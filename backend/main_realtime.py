import cv2
import numpy as np
import mediapipe as mp
import torch
import json
import sys
import os
import argparse
import threading
import time
import datetime
import io

# Fix encoding issue on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
try:
    import pyttsx3
except ImportError:
    print("Vui lòng cài đặt pyttsx3 bằng lệnh: pip install pyttsx3")

try:
    import google.generativeai as genai
except ImportError:
    print("Vui lòng cài đặt thư viện Google AI bằng lệnh: pip install google-generativeai")
    sys.exit(1)

# --- Cấu hình AI Dịch thuật ---
# VUI LÒNG ĐIỀN API KEY CỦA BẠN VÀO ĐÂY (Lấy miền phí tại aistudio.google.com)
GEMINI_API_KEY = "AIzaSyCjBgv4qe2du1qrdNAlWbFpaZFX530SN6o"
genai.configure(api_key=GEMINI_API_KEY)
generative_model = genai.GenerativeModel('gemini-2.5-flash')

# Biến toàn cục dùng cho luồng Dịch thuật
translated_sentence_vi = ""
translated_sentence_en = ""
is_translating = False
last_auto_translate_time = 0

# --- Khởi tạo TTS Engine (Phát âm) ---
try:
    engine = pyttsx3.init()
    # Thử tìm giọng tiếng Việt (thường là 'An' hoặc 'Linh' trên Windows)
    voices = engine.getProperty('voices')
    for voice in voices:
        if "vietnam" in voice.name.lower() or "vi-vn" in voice.id.lower():
            engine.setProperty('voice', voice.id)
            break
    engine.setProperty('rate', 160) # Tốc độ nói
except Exception as e:
    print(f"Lỗi khởi tạo TTS: {e}")
    engine = None

def speak_text(text):
    if engine and text:
        def _speak():
            try:
                engine.say(text)
                engine.runAndWait()
            except:
                pass
        threading.Thread(target=_speak).start()

def save_to_history(vi, en, gloss_list):
    history_file = os.path.join(DATA_DIR, "history.json")
    entry = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "glosses": gloss_list,
        "vietnamese": vi,
        "english": en
    }
    
    data = []
    if os.path.exists(history_file):
        try:
            with open(history_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except:
            data = []
            
    data.append(entry)
    with open(history_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def translate_gloss_to_text(gloss_list):
    global translated_sentence_vi, translated_sentence_en, is_translating
    if not gloss_list:
        is_translating = False
        return
        
    is_translating = True
    gloss_text = ", ".join(gloss_list)
    prompt = (
        f"Tôi có một chuỗi các từ khóa ngôn ngữ ký hiệu (Gloss): [{gloss_text}]. "
        "Hãy chuyển chúng thành một câu Tiếng Việt và một câu Tiếng Anh giao tiếp hoàn chỉnh. "
        "Chỉ trả về duy nhất định dạng JSON như sau: "
        "{\"vi\": \"câu tiếng Việt\", \"en\": \"câu tiếng Anh\"}"
    )
    
    try:
        response = generative_model.generate_content(prompt)
        text_res = response.text.replace('```json', '').replace('```', '').strip()
        res_json = json.loads(text_res)
        
        translated_sentence_vi = res_json.get("vi", "")
        translated_sentence_en = res_json.get("en", "")
        
        # Phát âm câu tiếng Việt
        speak_text(translated_sentence_vi)
        
        print(f"\n--- KẾT QUẢ DỊCH AI ---")
        print(f"Glosses: {gloss_list}")
        print(f"Tiếng Việt: {translated_sentence_vi}")
        print(f"Tiếng Anh: {translated_sentence_en}")
        print(f"-----------------------\n")
        
        # Lưu lịch sử
        save_to_history(translated_sentence_vi, translated_sentence_en, gloss_list)
        
    except Exception as e:
        translated_sentence_vi = f"(Lỗi: {str(e)})"
        translated_sentence_en = ""
    finally:
        is_translating = False

# --- Cấu hình Đường dẫn tương đối ---
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
CORE_DIR = os.path.join(BACKEND_DIR, 'ml_core')
DATA_DIR = os.path.join(BACKEND_DIR, 'data')
WEIGHTS_DIR = os.path.join(BACKEND_DIR, 'weights')

# Nạp các hàm hỗ trợ và Model từ thư mục core/
sys.path.append(CORE_DIR)
try:
    from inference_utils import extract_keypoints, normalize_sequence_for_tgcn, SlidingWindowBuffer, compute_hand_movement
    from tgcn_model import GCN_muti_att
except ImportError as e:
    print(f"Lỗi: Không tìm thấy các module cốt lõi trong {CORE_DIR}: {e}")
    sys.exit(1)

# --- Configuration ---
WEIGHTS_PATH = os.path.join(WEIGHTS_DIR, "best_tgcn_model.pth")
LABEL_MAP_PATH = os.path.join(DATA_DIR, "label_map.json")

NUM_SAMPLES = 30
NUM_CLASSES = 52  # Nâng cấp lên 52 từ vựng
HIDDEN_SIZE = 64
NUM_STAGES = 20
# --- Cấu hình Nhận diện liên tục ---
AUTO_TRANSLATE_SEC = 2.5  # Giây đứng yên để tự động dịch
MOVEMENT_THRESHOLD = 0.003 # Ngưỡng nhạy vừa phải
MIN_CONFIDENCE = 0.85      # Quay lại mức 0.85
STABILITY_FRAMES = 4       # Cần 4 khung hình liên tiếp
COOLDOWN_PERIOD = 15       # Nghỉ 15 khung hình sau khi chốt

def load_labels():
    with open(LABEL_MAP_PATH, 'r') as f:
        label_map = json.load(f)
    
    # Reverse map: index -> word
    # Vì file label map của Final có dạng {"Từ_vựng": ID_number}
    id_to_word = {}
    for word, idx in label_map.items():
        id_to_word[idx] = word.upper()
    return id_to_word

def main():
    global translated_sentence_vi, translated_sentence_en, is_translating
    parser = argparse.ArgumentParser(description="Real-time Sign Language Recognition (25 Classes - FINAL)")
    parser.add_argument('--video', type=str, default=None, help='Đường dẫn video (nếu không truyền sẽ tự bật Webcam 0)')
    args = parser.parse_args()

    # 1. Load Labels
    id_to_word = load_labels()
    print("Đã tải Map 25 Từ vựng thành công.")

    # 2. Load Model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = GCN_muti_att(input_feature=NUM_SAMPLES*2, hidden_feature=HIDDEN_SIZE, 
                         num_class=NUM_CLASSES, p_dropout=0.3, num_stage=NUM_STAGES)
    
    if os.path.exists(WEIGHTS_PATH):
        model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))
        print(f"[Thành Công] Tải trọng số từ: {WEIGHTS_PATH}")
    else:
        print(f"[Lỗi] Không tìm thấy file {WEIGHTS_PATH}. Xin lấy file này từ Colab thả vào thư mục Final trước!")
        return

    model.to(device)
    model.eval()

    # 3. Setup MediaPipe
    mp_holistic = mp.solutions.holistic
    mp_drawing = mp.solutions.drawing_utils
    
    # 4. Initialize Buffer and History
    buffer = SlidingWindowBuffer(window_size=NUM_SAMPLES)
    prediction_history = []
    consecutive_predictions = []
    
    # Biến dùng cho hệ thống ghép câu
    sentence_buffer = []
    last_added_word = ""
    last_movement_time = time.time() # Thời điểm cuối cùng phát hiện múa
    last_action_detected = False     # Trạng thái đang múa hay không
    cooldown_counter = 0             # Đếm ngược thời gian chờ sau khi chốt từ
    
    # 5. Webcam/Video Loop
    video_source = args.video if args.video is not None else 0
    cap = cv2.VideoCapture(video_source)
    
    if not cap.isOpened():
        print(f"Lỗi: Không thể mở Camera hoặc tệp Video: {video_source}")
        return
        
    current_prediction = "Đang khởi động..."
    confidence = 0.0
    frame_count = 0
    
    # Giảm wait_time xuống tối thiểu để không cộng dồn độ trễ xử lý AI
    wait_time = 1 

    with mp_holistic.Holistic(
        model_complexity=0, 
        min_detection_confidence=0.5, 
        min_tracking_confidence=0.5
    ) as holistic:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Giữ nguyên độ phân giải gốc của video
            frame_count += 1

            # Process MediaPipe
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = holistic.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            # Draw landmarks (Giúp chẩn đoán MediaPipe có bắt được xương tay không)
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
            mp_drawing.draw_landmarks(image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
            mp_drawing.draw_landmarks(image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
            # Thêm Face Mesh (Vẽ mờ để quan sát biểu cảm)
            if results.face_landmarks:
                mp_drawing.draw_landmarks(
                    image, results.face_landmarks, mp_holistic.FACEMESH_TESSELATION,
                    mp_drawing.DrawingSpec(color=(80,110,10), thickness=1, circle_radius=1),
                    mp_drawing.DrawingSpec(color=(80,256,121), thickness=1, circle_radius=1)
                )

            # Extract and Add to Buffer
            keypoints = extract_keypoints(results)
            buffer.add(keypoints)

            # Inference Logic
            if buffer.is_full():
                window = buffer.get_window() # Shape: (30, 75, 3)
                
                # Tính lượng thay đổi chuyển động (Action Spotting)
                movement = compute_hand_movement(window)
                
                # Kiểm tra xem MediaPipe có bắt được tay không (nếu tọa độ khác 0)
                hands_detected = np.any(window[:, 33:75, :] != 0)
                
                # DEBUG: In ra mỗi 10 khung hình để tránh tràn terminal
                if frame_count % 10 == 0:
                    status = "Có Tay" if hands_detected else "KHÔNG THẤY TAY"
                    print(f"[DEBUG MP] Movement: {movement:.5f} | Status: {status}")

                if movement < MOVEMENT_THRESHOLD:  
                    current_prediction = "Đứng yên (Idle)"
                    last_added_word = ""  # Tay buông xuống -> Mở khóa từ
                    confidence = 0.0
                    prediction_history.clear()
                    consecutive_predictions.clear()
                    last_action_detected = False
                else:
                    last_movement_time = time.time() # Cập nhật thời gian đang múa
                    last_action_detected = True
                    
                    # Normalize & chuyển đổi Tensor mượt
                    input_data = normalize_sequence_for_tgcn(window) # (55, 60)
                    input_tensor = torch.FloatTensor(input_data).unsqueeze(0).to(device) # (1, 55, 60)
                    
                    with torch.no_grad():
                        logits = model(input_tensor)
                        probs = torch.softmax(logits, dim=1)
                        
                        # Temporal Smoothing (Lấy trung bình cộng của 5 frame dự đoán gần nhất)
                        prediction_history.append(probs)
                        if len(prediction_history) > 5:
                            prediction_history.pop(0)
                            
                        avg_probs = torch.mean(torch.stack(prediction_history), dim=0)
                        conf, pred_idx = torch.max(avg_probs, dim=1)
                        confidence = conf.item()
                        
                        pred_word = id_to_word.get(pred_idx.item(), "Unknown")
                        
                        # DEBUG: In ra mọi thứ AI nhìn thấy nếu độ tin cậy > 0.4
                        if confidence > 0.4:
                            print(f"--- [DEBUG] AI đang thấy: {pred_word} ({confidence:.2f})")

                        # Consecutive Voting (Khóa kết quả bằng tần số xuất hiện)
                        if confidence > MIN_CONFIDENCE:
                            consecutive_predictions.append(pred_word)
                            # Giữ lại số lượng khung hình cần kiểm chứng
                            if len(consecutive_predictions) > STABILITY_FRAMES:
                                consecutive_predictions.pop(0)
                        else:
                            # Không xóa sạch ngay, mà chỉ xóa từ từ hoặc giữ nguyên để đợi khung hình tiếp theo
                            if len(consecutive_predictions) > 0:
                                consecutive_predictions.pop(0)

                        # LOGIC CHỐT TỪ
                        if cooldown_counter > 0:
                            cooldown_counter -= 1
                            current_prediction = f"Đợi ({cooldown_counter})"
                        elif len(consecutive_predictions) >= STABILITY_FRAMES and len(set(consecutive_predictions)) == 1:
                            detected_word = consecutive_predictions[0]
                            
                            if detected_word != "Unknown" and detected_word != last_added_word:
                                sentence_buffer.append(detected_word)
                                last_added_word = detected_word
                                cooldown_counter = COOLDOWN_PERIOD 
                                print(f"[NHẬN DIỆN] Chốt từ: {detected_word}")
                                current_prediction = f"CHỐT: {detected_word}"
                                consecutive_predictions.clear() 
                            else:
                                current_prediction = detected_word
                        elif last_action_detected:
                            current_prediction = pred_word
                        else:
                            current_prediction = "Đang chờ..."

                # --- LOGIC TỰ ĐỘNG DỊCH (Auto-Translate) ---
                idle_duration = time.time() - last_movement_time
                if len(sentence_buffer) > 0 and not is_translating and not last_action_detected:
                    if idle_duration > AUTO_TRANSLATE_SEC:
                        # Kích hoạt dịch tự động
                        threading.Thread(target=translate_gloss_to_text, args=(sentence_buffer.copy(),)).start()
                        # Xóa buffer sau khi dịch để chuẩn bị cho câu mới (Tùy chọn)
                        # sentence_buffer.clear() 
                        # Hoặc giữ lại để người dùng tự xóa bằng phím 'C'
                        last_movement_time = time.time() # Reset timer để không gọi liên tục


            # Hiển thị độ bám sát giao diện người dùng (HUD)
            h, w, c = image.shape
            
            # --- KHUNG THEO DÕI TỪNG TỪ ---
            cv2.rectangle(image, (0, 0), (300, 80), (22, 22, 137), -1) # Màu đỏ đô
            cv2.putText(image, 'PREDICTION', (15, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
            cv2.putText(image, f'{current_prediction}', (15, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(image, f'CONF: {confidence:.2f}', (170, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
            
            # HƯỚNG DẪN DÙNG PHÍM TẮT
            cv2.putText(image, '[SPACE]: Dich Cau | [C]: Xoa Cau', (320, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

            # --- KHUNG THEO DÕI CÂU VĂN (Bên dưới màn hình) ---
            cv2.rectangle(image, (0, h - 80), (w, h), (40, 40, 40), -1) 
            
            # 1. In chuỗi mảng thô (Gloss)
            gloss_str = " + ".join(sentence_buffer)
            cv2.putText(image, f'Chuoi: {gloss_str}', (10, h - 55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1, cv2.LINE_AA)
            
            # 2. In văn bản hoàn chỉnh của AI
            # Hiển thị trạng thái Auto-Translate
            idle_duration = time.time() - last_movement_time
            if len(sentence_buffer) > 0 and not is_translating and not last_action_detected:
                remaining = max(0, AUTO_TRANSLATE_SEC - idle_duration)
                if remaining > 0:
                    status_text = f"Tu dong dich sau {remaining:.1f}s..."
                    cv2.putText(image, status_text, (w - 250, h - 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

            if is_translating:
                cv2.putText(image, "AI Dang Dich...", (10, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (144, 238, 144), 2, cv2.LINE_AA)
            else:
                cv2.putText(image, f'VI: {translated_sentence_vi}', (10, h - 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (144, 238, 144), 2, cv2.LINE_AA)
                cv2.putText(image, f'EN: {translated_sentence_en}', (10, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1, cv2.LINE_AA)

            cv2.imshow('TGCN Model - FINAL (25 Classes)', image)

            # --- KIỂM SOÁT BÀN PHÍM ---
            key = cv2.waitKey(wait_time) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('c'):
                # Nhấn C để xóa lịch sử câu làm lại
                sentence_buffer.clear()
                translated_sentence_vi = ""
                translated_sentence_en = ""
                last_added_word = ""
            elif key == 32: # Code 32 là phím Dấu Cách (Spacebar)
                # Kích hoạt luồng AI dịch thuật để không làm đơ Camera
                if len(sentence_buffer) > 0 and not is_translating:
                    threading.Thread(target=translate_gloss_to_text, args=(sentence_buffer.copy(),)).start()

    # --- KẾT THÚC VIDEO ---
    print(f"\n[HOÀN THÀNH] Đã xử lý {frame_count} khung hình.")
    if sentence_buffer:
        print(f"Toàn bộ chuỗi từ nhận diện được: {sentence_buffer}")
        # Tự động dịch luôn khi kết thúc video nếu có từ
        if not is_translating:
            translate_gloss_to_text(sentence_buffer.copy())
    
    if args.video is not None:
        print("Nhấn phím bất kỳ (trên cửa sổ OpenCV) để thoát...")
        cv2.waitKey(0)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
