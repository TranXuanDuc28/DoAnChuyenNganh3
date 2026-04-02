import cv2
import numpy as np
import mediapipe as mp
import torch
import json
import sys
import os
import argparse

# --- Cấu hình Đường dẫn tương đối ---
FINAL_DIR = os.path.dirname(os.path.abspath(__file__))
WLASL_DIR = os.path.abspath(os.path.join(FINAL_DIR, '..', 'WLASL'))

# Nạp các hàm hỗ trợ từ thư mục WLASL
sys.path.append(WLASL_DIR)
try:
    from inference_utils import extract_keypoints, normalize_sequence_for_tgcn, SlidingWindowBuffer, compute_hand_movement
except ModuleNotFoundError:
    print("Vui lòng đảm bảo bạn đang giữ cấu trúc thư mục hợp lệ.")
    sys.exit(1)

# Nạp mạng Neural Network Architect (TGCN) từ thư mục gốc
sys.path.append(os.path.join(WLASL_DIR, 'code', 'TGCN'))
from tgcn_model import GCN_muti_att

# --- Configuration (Chỉnh lại cho 25 từ) ---
WEIGHTS_PATH = os.path.join(FINAL_DIR, "best_tgcn_model_FINAL.pth")
LABEL_MAP_PATH = os.path.join(FINAL_DIR, "final_label_map.json")

NUM_SAMPLES = 30
NUM_CLASSES = 25  # Thay đổi thành 25
HIDDEN_SIZE = 64
NUM_STAGES = 20

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
    
    # 5. Webcam/Video Loop
    video_source = args.video if args.video is not None else 0
    cap = cv2.VideoCapture(video_source)
    
    if not cap.isOpened():
        print(f"Lỗi: Không thể mở Camera hoặc tệp Video: {video_source}")
        return
        
    current_prediction = "Đang khởi động..."
    confidence = 0.0
    frame_count = 0
    
    # System delay để file mp4 chạy ở mức xấp xỉ tốc độ 1x (30fps)
    wait_time = 10 if args.video is None else 33 

    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print(f"End of video stream. Processed {frame_count} frames.")
                if args.video is not None and frame_count > 0:
                    print(f"Dự đoán cuối cùng: {current_prediction} (Conf: {confidence:.2f})")
                    print("Nhấn phím bất kỳ (trên cửa sổ OpenCV) để thoát...")
                    cv2.waitKey(0)
                break
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

            # Extract and Add to Buffer
            keypoints = extract_keypoints(results)
            buffer.add(keypoints)

            # Inference Logic
            if buffer.is_full():
                window = buffer.get_window() # Shape: (30, 75, 3)
                
                # Tính lượng thay đổi chuyển động (Action Spotting)
                movement = compute_hand_movement(window)
                if movement < 0.005:  # Bạn có thể tự chỉnh xuống 0.003 nếu tay múa quá chậm bị lờ đi
                    current_prediction = "Đứng yên (Idle)"
                    confidence = 0.0
                    prediction_history.clear()
                    consecutive_predictions.clear()
                else:
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
                        
                        # Consecutive Voting (Khóa kết quả bằng tần số xuất hiện)
                        if confidence > 0.85:
                            pred_word = id_to_word.get(pred_idx.item(), "Unknown")
                            consecutive_predictions.append(pred_word)
                            # Giữ lại 3 kết quả vừa nhất
                            if len(consecutive_predictions) > 3:
                                consecutive_predictions.pop(0)
                        else:
                            pred_word = "Đang xem..."
                            consecutive_predictions.clear()

                        # Chỉ hiện tên lệnh khi 3 khung hình liên tục đoán ra 1 chữ (Vượt qua mức nháy hình)
                        if len(consecutive_predictions) == 3 and len(set(consecutive_predictions)) == 1:
                            current_prediction = consecutive_predictions[0]
                        elif current_prediction == "Đứng yên (Idle)":
                            current_prediction = "Đang xem..."


            # Hiển thị độ bám sát giao diện người dùng (HUD)
            cv2.rectangle(image, (0, 0), (300, 80), (22, 22, 137), -1) # Màu đỏ đô
            cv2.putText(image, 'PREDICTION', (15, 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
            cv2.putText(image, f'{current_prediction}', (15, 60), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
            
            cv2.putText(image, f'CONF: {confidence:.2f}', (170, 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)

            cv2.imshow('TGCN Model - FINAL (25 Classes)', image)

            # Bấm 'q' tắt cửa sổ
            if cv2.waitKey(wait_time) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
