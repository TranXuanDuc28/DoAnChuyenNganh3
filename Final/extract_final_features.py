import os
import cv2
import json
import pandas as pd
import numpy as np
import mediapipe as mp
try:
    from tqdm import tqdm
except ImportError:
    print("Vui lòng chạy: pip install tqdm")
    sys.exit()
import sys

# Cấu hình đường dẫn
FINAL_DIR = os.path.dirname(os.path.abspath(__file__))
WLASL_DIR = os.path.join(FINAL_DIR, '..', 'WLASL')

# Đảm bảo đường dẫn lấy hàm import đúng từ thư mục WLASL
sys.path.append(os.path.abspath(WLASL_DIR))
try:
    from inference_utils import extract_keypoints, interpolate_missing_keypoints
except ModuleNotFoundError:
    print("Vẫn không tìm thấy inference_utils. Kiểm tra đường dẫn:", os.path.abspath(WLASL_DIR))
    sys.exit(1)

CSV_FILES = ['train.csv', 'valid.csv', 'test.csv']
VIDEO_DIR = os.path.join(FINAL_DIR, 'videos')
OUTPUT_DIR = os.path.join(FINAL_DIR, 'keypoints')
LABEL_MAP_FILE = os.path.join(FINAL_DIR, 'final_label_map.json')

# Tạo thư mục output nếu chưa có
os.makedirs(OUTPUT_DIR, exist_ok=True)

def main():
    print("=== Bước 1: Tạo tệp Label Map (25 classes) ===")
    
    # Gom tất cả label từ 3 tệp csv
    all_glosses = set()
    df_list = []
    
    for csv_file in CSV_FILES:
        path = os.path.join(FINAL_DIR, csv_file)
        if os.path.exists(path):
            df = pd.read_csv(path)
            all_glosses.update(df['Gloss'].unique())
            df_list.append(df)
            
    if not df_list:
        print("Lỗi: Không tìm thấy file CSV nào!")
        return
        
    # Tạo label dictionary (Sort theo bảng chữ cái để cố định Index)
    sorted_glosses = sorted(list(all_glosses))
    label_map = {gloss: idx for idx, gloss in enumerate(sorted_glosses)}
    
    with open(LABEL_MAP_FILE, 'w') as f:
        json.dump(label_map, f, indent=4)
    print(f"Đã tạo {LABEL_MAP_FILE} với {len(label_map)} từ vựng.")
    
    print("\n=== Bước 2: Trích xuất MediaPipe Keypoints ===")
    
    # Nối tất cả dataframe để chạy vòng lặp
    combined_df = pd.concat(df_list, ignore_index=True)
    # Loại bỏ file trùng lặp do VideoID đúp
    combined_df = combined_df.drop_duplicates(subset=['VideoID'])
    total_videos = len(combined_df)
    
    mp_holistic = mp.solutions.holistic
    skipped_videos = 0
    extracted_videos = 0
    
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        for index, row in tqdm(combined_df.iterrows(), total=total_videos, desc="Extracting MediaPipe"):
            video_filename = row['VideoID']
            video_path = os.path.join(VIDEO_DIR, video_filename)
            output_path = os.path.join(OUTPUT_DIR, f"{video_filename}.npy")
            
            # Nếu đã tồn tại thì bỏ qua (Phòng khi script dừng giữa chừng)
            if os.path.exists(output_path):
                continue
                
            if not os.path.exists(video_path):
                skipped_videos += 1
                continue
                
            cap = cv2.VideoCapture(video_path)
            frames_keypoints = []
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image.flags.writeable = False
                results = holistic.process(image)
                
                # Trích xuất 75 điểm (pose, left hand, right hand)
                kps = extract_keypoints(results)
                frames_keypoints.append(kps)
                
            cap.release()
            
            if len(frames_keypoints) > 0:
                seq_75 = np.array(frames_keypoints) # Shape (T, 75, 3)
                
                # Làm mượt (Cực kỳ quan trọng, tái sử dụng script đã viết)
                try:
                    seq_75 = interpolate_missing_keypoints(seq_75)
                    np.save(output_path, seq_75)
                    extracted_videos += 1
                except Exception as e:
                    # Trong t/hợp tồi tệ hàm interpolate gây lỗi thì save raw
                    np.save(output_path, seq_75)
                    extracted_videos += 1
            else:
                skipped_videos += 1
                
    print(f"\nHoàn tất! Bỏ qua/Lỗi file: {skipped_videos}")
    print(f"Đã trích xuất xong: {extracted_videos} / {total_videos}")

if __name__ == "__main__":
    main()
