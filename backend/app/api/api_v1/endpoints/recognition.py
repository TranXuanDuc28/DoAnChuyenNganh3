import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, UploadFile, File
import cv2
import tempfile
import os
import shutil
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.services.ai_service import ai_service
import sys
import os

# Đường dẫn để import các util
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
CORE_DIR = os.path.join(BACKEND_DIR, 'ml_core')
sys.path.append(CORE_DIR)

try:
    from inference_utils import SlidingWindowBuffer, compute_hand_movement
except ImportError:
    print("Warning: SlidingWindowBuffer not found.")

router = APIRouter()

def parse_landmarks(data):
    pose = np.array(data.get('pose', [])) if data.get('pose') else np.zeros((33, 3))
    lh = np.array(data.get('left_hand', [])) if data.get('left_hand') else np.zeros((21, 3))
    rh = np.array(data.get('right_hand', [])) if data.get('right_hand') else np.zeros((21, 3))
    
    if pose.shape != (33, 3): pose = np.zeros((33, 3))
    if lh.shape != (21, 3): lh = np.zeros((21, 3))
    if rh.shape != (21, 3): rh = np.zeros((21, 3))
    
    return np.concatenate([pose, lh, rh], axis=0)

@router.websocket("/ws")
async def websocket_recognition(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    print("AI Recognition Client Connected via WebSocket.")
    
    buffer = SlidingWindowBuffer(window_size=30)
    prediction_history = []
    consecutive_predictions = []
    sentence_buffer = []
    
    last_added_word = ""
    current_prediction = "READY"
    confidence = 0.0
    translated_sentence = ""
    is_translating = False

    try:
        while True:
            data = await websocket.receive_json()
            
            # --- COMMANDS ---
            if "command" in data:
                cmd = data["command"]
                if cmd == "delete_last" and sentence_buffer:
                    sentence_buffer.pop()
                    last_added_word = ""
                elif cmd == "clear_all":
                    sentence_buffer.clear()
                    translated_sentence = ""
                    last_added_word = ""
                elif cmd == "translate" and not is_translating:
                    is_translating = True
                    target_lang = data.get("lang", "vi")
                    await websocket.send_json({"status": "translating", "sentence": sentence_buffer})
                    translated_sentence = await ai_service.translate_gloss(sentence_buffer.copy(), target_lang=target_lang)
                    is_translating = False
                
                await websocket.send_json({
                    "prediction": current_prediction,
                    "confidence": round(confidence, 2),
                    "sentence": sentence_buffer,
                    "translation": translated_sentence if not is_translating else "AI Đang dịch..."
                })
                continue

            # --- INFERENCE ---
            keypoints = parse_landmarks(data)
            buffer.add(keypoints)

            if buffer.is_full():
                window = buffer.get_window()
                movement = compute_hand_movement(window)
                
                if movement < 0.006: # Tăng lên để lờ đi các rung động nhỏ (ổn định hơn)
                    current_prediction = "IDLE"
                    last_added_word = ""
                    confidence = 0.0
                    prediction_history.clear()
                    consecutive_predictions.clear()
                else:
                    if translated_sentence: translated_sentence = ""
                    
                    pred_word, conf = ai_service.predict(window, prediction_history)
                    confidence = conf
                    
                    if confidence > 0.85: # Chỉ nhận diện khi độ tin cậy trên 85%
                        consecutive_predictions.append(pred_word)
                        if len(consecutive_predictions) > 3: consecutive_predictions.pop(0)
                        
                        if len(consecutive_predictions) == 3 and len(set(consecutive_predictions)) == 1:
                            current_prediction = consecutive_predictions[0]
                            if current_prediction != "Unknown" and current_prediction != last_added_word:
                                sentence_buffer.append(current_prediction)
                                last_added_word = current_prediction
                                
                                # Lưu vào lịch sử (History)
                                try:
                                    db.execute(
                                        text("INSERT INTO recognition_history (user_id, recognized_text, confidence) VALUES (:u, :t, :c)"),
                                        {"u": 1, "t": current_prediction, "c": round(confidence, 2)}
                                    )
                                    db.commit()
                                except Exception as e:
                                    print(f"DB Error: {e}")
                    else:
                        consecutive_predictions.clear()

            # Trả về kết quả
            await websocket.send_json({
                "prediction": current_prediction,
                "confidence": round(confidence, 2),
                "sentence": sentence_buffer,
                "translation": translated_sentence if not is_translating else "AI Đang dịch..."
            })

    except WebSocketDisconnect:
        print("AI Recognition Client Disconnected.")
# --- NEW: API Upload Video ---
@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...), lang: str = "vi", db: Session = Depends(get_db)):
    # 1. Lưu file tạm
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        import mediapipe as mp
        # Import động để tránh lỗi đường dẫn khi khởi động
        from ml_core.inference_utils import extract_keypoints
        
        mp_holistic = mp.solutions.holistic
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            return {"success": False, "error": "Không thể mở file video."}
            
        frames_keypoints = []
        
        # 2. Quét MediaPipe qua từng frame (Tối ưu: Nhảy cóc 4 frame để đạt tốc độ CHÓP NHOÁNG)
        frame_idx = 0
        skip_frames = 4 
        print(f"--- Bắt đầu phân tích video SIÊU TỐC: {file.filename} ---")
        with mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=0, 
            min_detection_confidence=0.5, 
            min_tracking_confidence=0.5
        ) as holistic:
            while cap.isOpened():
                # Dùng grab/retrieve để bỏ qua việc giải mã những frame không dùng
                if not cap.grab(): break
                
                if frame_idx % (skip_frames + 1) == 0:
                    ret, frame = cap.retrieve()
                    if not ret: break
                    
                    # Nén ảnh xuống cực nhỏ (240x180) để CPU xử lý cực nhanh
                    image = cv2.resize(frame, (240, 180))
                    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                    results = holistic.process(image)
                    kps = extract_keypoints(results)
                    frames_keypoints.append(kps)
                frame_idx += 1
        cap.release()
        print(f"--- Hoàn thành quét. Tổng cộng: {len(frames_keypoints)} mốc. Bắt đầu nhận diện... ---")

        if len(frames_keypoints) < 15:
            return {"success": False, "error": "Video quá ngắn hoặc không tìm thấy người."}

        # 3. Gom nhóm và dự đoán (Xử lý linh hoạt cho cả video ngắn)
        detected_words = []
        window_size = 30
        step = 10
        
        # Nếu tổng số mốc ít hơn 30, ta bù (padding) cho đủ 30 để AI chạy được
        if len(frames_keypoints) < window_size:
            padding = [frames_keypoints[-1]] * (window_size - len(frames_keypoints))
            window = frames_keypoints + padding
            word, conf = ai_service.predict(window, [])
            if conf > 0.60 and word not in ["Unknown", "IDLE"]:
                print(f"Bắt được từ (Video ngắn): {word} ({conf:.2f})")
                detected_words.append(word)
        else:
            # Chạy cửa sổ trượt như bình thường
            for i in range(0, len(frames_keypoints) - window_size + 1, step):
                window = frames_keypoints[i : i + window_size]
                word, conf = ai_service.predict(window, [])
                if conf > 0.60 and word not in ["Unknown", "IDLE"]:
                    if not detected_words or detected_words[-1] != word:
                        print(f"Bắt được từ: {word} ({conf:.2f})")
                        detected_words.append(word)

        if not detected_words:
            return {
                "success": True, 
                "words": [], 
                "translation": "Không nhận diện được ký hiệu nào trong video."
            }

        # 4. Dịch chuỗi từ bằng Gemini
        translation = await ai_service.translate_gloss(detected_words, target_lang=lang)
        
        return {
            "success": True,
            "words": detected_words,
            "translation": translation
        }

    except Exception as e:
        import traceback
        traceback.print_exc() # In lỗi ra terminal để bạn xem
        return {"success": False, "error": f"Server Error: {str(e)}"}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
