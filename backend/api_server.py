import base64
import cv2
import numpy as np
import mediapipe as mp
import torch
import json
import sys
import os
import time
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

# --- Cấu hình AI Dịch thuật ---
GEMINI_API_KEY = "AIzaSyCjBgv4qe2du1qrdNAlWbFpaZFX530SN6o"
genai.configure(api_key=GEMINI_API_KEY)
generative_model = genai.GenerativeModel('gemini-2.5-flash')

# --- Cấu hình Đường dẫn tương đối ---
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
CORE_DIR = os.path.join(BACKEND_DIR, 'core')
DATA_DIR = os.path.join(BACKEND_DIR, 'data')
WEIGHTS_DIR = os.path.join(BACKEND_DIR, 'weights')

# Nạp các hàm hỗ trợ
sys.path.append(CORE_DIR)
try:
    from inference_utils import extract_keypoints, normalize_sequence_for_tgcn, SlidingWindowBuffer, compute_hand_movement
    from tgcn_model import GCN_muti_att
except Exception as e:
    print(f"Error loading core modules: {e}")

# --- Configuration ---
WEIGHTS_PATH = os.path.join(WEIGHTS_DIR, "best_tgcn_model.pth")
LABEL_MAP_PATH = os.path.join(DATA_DIR, "label_map.json")

NUM_SAMPLES = 30
NUM_CLASSES = 25
HIDDEN_SIZE = 64
NUM_STAGES = 20

def load_labels():
    try:
        with open(LABEL_MAP_PATH, 'r') as f:
            label_map = json.load(f)
        id_to_word = {idx: word.upper() for word, idx in label_map.items()}
        return id_to_word
    except Exception:
        return {}

id_to_word = load_labels()
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

try:
    model = GCN_muti_att(input_feature=NUM_SAMPLES*2, hidden_feature=HIDDEN_SIZE, 
                         num_class=NUM_CLASSES, p_dropout=0.3, num_stage=NUM_STAGES)
    if os.path.exists(WEIGHTS_PATH):
        model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))
        print(f"[Thành Công] Đã nạp Mô hình TGCN vào API.")
    model.to(device)
    model.eval()
except Exception as e:
    print(f"Chưa thể load TGCN, lỗi: {e}")

mp_holistic = mp.solutions.holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# --- FastAPI Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Server TGCN Sign Language AI is running."}

async def translate_gloss(gloss_list):
    if not gloss_list:
        return ""
    gloss_text = ", ".join(gloss_list)
    prompt = f"Tôi có một chuỗi các từ khóa ngôn ngữ ký hiệu (Gloss): [{gloss_text}]. Hãy chuyển chúng thành một câu Tiếng Anh giao tiếp hoàn chỉnh, mượt mà và đúng ngữ pháp. Chỉ trả về duy nhất nội dung câu Tiếng Anh, tuyệt đối không giải thích thêm bất cứ chữ nào."
    try:
        # Chạy block call Gemini AI dưới dạng thread để không bị block server WebSockets
        response = await asyncio.to_thread(generative_model.generate_content, prompt)
        return response.text.replace('\n', ' ').strip()
    except Exception as e:
        return f"(Lỗi API: {str(e)})"

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    buffer = SlidingWindowBuffer(window_size=NUM_SAMPLES)
    prediction_history = []
    consecutive_predictions = []
    sentence_buffer = []
    
    last_added_word = ""
    current_prediction = "Đang chờ..."
    confidence = 0.0
    
    # Biến cho hệ thống dịch sau 3s nhàn rỗi (idle)
    last_movement_time = time.time()
    is_idle = False
    translated_sentence = ""
    is_translating = False

    try:
        while True:
            data = await websocket.receive_text()
            
            # Xử lý Base64 sang ảnh cv2
            if "," in data:
                data = data.split(",")[1]
            try:
                img_data = base64.b64decode(data)
                np_arr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            except Exception:
                continue
                
            if frame is None:
                continue

            # Chạy MediaPipe phân tích Landmarks
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = mp_holistic.process(image)
            image.flags.writeable = True

            keypoints = extract_keypoints(results)
            buffer.add(keypoints)

            if buffer.is_full():
                window = buffer.get_window()
                movement = compute_hand_movement(window)
                
                if movement < 0.005:  # Trạng thái Idle (Đứng yên)
                    current_prediction = "Đứng yên (Idle)"
                    last_added_word = ""
                    confidence = 0.0
                    prediction_history.clear()
                    consecutive_predictions.clear()
                    
                    # Logic: Sau 3 giây ngưng hoạt động -> Tự động dịch
                    if not is_idle:
                        is_idle = True
                    else:
                        idle_duration = time.time() - last_movement_time
                        if idle_duration >= 3.0 and len(sentence_buffer) > 0 and not is_translating:
                            is_translating = True
                            
                            # Cập nhật trạng thái cho Client biết là đang Call Gemini API
                            await websocket.send_json({
                                "prediction": current_prediction,
                                "confidence": 0,
                                "sentence": sentence_buffer,
                                "translation": "AI Đang Dịch..."
                            })
                            
                            trans_result = await translate_gloss(sentence_buffer.copy())
                            translated_sentence = trans_result
                            sentence_buffer.clear() # Đã dịch xong -> Cho câu mới
                            is_translating = False
                            last_movement_time = time.time() # Reset clock
                else:
                    # Trạng thái tay đang Múa / Cử động
                    last_movement_time = time.time()
                    is_idle = False
                    
                    # Logic xóa kết quả cũ đi khi múa chữ mới (Nếu đã dịch xong câu cũ)
                    if translated_sentence != "":
                        translated_sentence = "" 

                    input_data = normalize_sequence_for_tgcn(window)
                    input_tensor = torch.FloatTensor(input_data).unsqueeze(0).to(device)
                    
                    with torch.no_grad():
                        logits = model(input_tensor)
                        probs = torch.softmax(logits, dim=1)
                        
                        prediction_history.append(probs)
                        if len(prediction_history) > 5:
                            prediction_history.pop(0)
                            
                        avg_probs = torch.mean(torch.stack(prediction_history), dim=0)
                        conf, pred_idx = torch.max(avg_probs, dim=1)
                        confidence = conf.item()
                        
                        if confidence > 0.85:
                            pred_word = id_to_word.get(pred_idx.item(), "Unknown")
                            consecutive_predictions.append(pred_word)
                            if len(consecutive_predictions) > 3:
                                consecutive_predictions.pop(0)
                        else:
                            pred_word = "Đang xem..."
                            consecutive_predictions.clear()

                        if len(consecutive_predictions) == 3 and len(set(consecutive_predictions)) == 1:
                            current_prediction = consecutive_predictions[0]
                            if current_prediction != "Unknown" and current_prediction != last_added_word:
                                sentence_buffer.append(current_prediction)
                                last_added_word = current_prediction
                        elif current_prediction == "Đứng yên (Idle)":
                            current_prediction = "Đang chờ..."

            status_text = "AI Đang Dịch..." if is_translating else translated_sentence

            await websocket.send_json({
                "prediction": current_prediction,
                "confidence": round(confidence, 2),
                "sentence": sentence_buffer,
                "translation": status_text
            })

    except WebSocketDisconnect:
        print("Client disconnected từ App React Native.")
    except Exception as e:
        print(f"WS Error: {e}")
