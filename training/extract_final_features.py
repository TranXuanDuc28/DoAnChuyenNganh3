import os
import cv2
import json
import pandas as pd
import numpy as np
import mediapipe as mp
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed

try:
    from tqdm import tqdm
except ImportError:
    print("Vui lòng chạy: pip install tqdm")
    sys.exit()

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

os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_single_video(video_info):
    """
    Hàm xử lý cho một video đơn lẻ (Chạy trong Worker Process)
    """
    video_filename, output_path = video_info
    
    # Khởi tạo Holistic bên trong mỗi process để tránh xung đột luồng
    mp_holistic = mp.solutions.holistic
    
    if not os.path.exists(video_filename):
        return False
        
    try:
        with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
            cap = cv2.VideoCapture(video_filename)
            frames_keypoints = []
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image.flags.writeable = False
                results = holistic.process(image)
                
                kps = extract_keypoints(results)
                frames_keypoints.append(kps)
                
            cap.release()
            
            if len(frames_keypoints) > 0:
                seq_75 = np.array(frames_keypoints)
                # Làm mượt nội suy
                seq_75 = interpolate_missing_keypoints(seq_75)
                np.save(output_path, seq_75)
                return True
            return False
    except Exception as e:
        return False

def main():
    # Load label map hiện tại (52 từ) để lọc
    LABEL_MAP_PATH = os.path.join(FINAL_DIR, '..', 'backend', 'data', 'label_map.json')
    if not os.path.exists(LABEL_MAP_PATH):
        print("Lỗi: Không tìm thấy label_map.json tại backend/data")
        return
        
    with open(LABEL_MAP_PATH, 'r') as f:
        target_label_map = json.load(f)
    
    df_list = []
    # Duyệt qua các file CSV trong backend/data
    DATA_DIR = os.path.join(FINAL_DIR, '..', 'backend', 'data')
    for csv_file in CSV_FILES:
        path = os.path.join(DATA_DIR, csv_file)
        if os.path.exists(path):
            df = pd.read_csv(path)
            # Chỉ lấy các dòng có Gloss nằm trong bộ 52 từ
            df = df[df['Gloss'].isin(target_label_map.keys())]
            df_list.append(df)
            
    if not df_list:
        print(f"Lỗi: Không tìm thấy file CSV nào tại {DATA_DIR}!")
        return
        
    print(f"Đã nạp dữ liệu cho {len(target_label_map)} từ vựng mục tiêu.")

    
    print("\n=== Bước 2: Trích xuất MediaPipe Keypoints (ĐA NHIỆM) ===")
    
    combined_df = pd.concat(df_list, ignore_index=True)
    combined_df = combined_df.drop_duplicates(subset=['VideoID'])
    
    # Lọc danh sách các video cần xử lý (bỏ qua những cái đã có .npy)
    tasks = []
    for _, row in combined_df.iterrows():
        video_filename = row['VideoID']
        video_path = os.path.join(VIDEO_DIR, video_filename)
        output_path = os.path.join(OUTPUT_DIR, f"{video_filename}.npy")
        
        if not os.path.exists(output_path):
            tasks.append((video_path, output_path))
    
    total_tasks = len(tasks)
    print(f"Tổng số video cần trích xuất mới: {total_tasks}")
    
    if total_tasks == 0:
        print("Mọi video đã được trích xuất xong!")
        return

    # Sử dụng ProcessPoolExecutor để chạy đa nhân CPU
    # max_workers=None sẽ tự động lấy số nhân CPU của máy
    extracted_count = 0
    with ProcessPoolExecutor() as executor:
        futures = {executor.submit(process_single_video, task): task for task in tasks}
        
        # tqdm hiển thị tiến trình
        for future in tqdm(as_completed(futures), total=total_tasks, desc="Đang trích xuất đa luồng"):
            if future.result():
                extracted_count += 1
                
    print(f"\nHoàn tất! Đã trích xuất thêm: {extracted_count} / {total_tasks} video mới.")
    print(f"Dữ liệu hiện có tổng cộng: {len(os.listdir(OUTPUT_DIR))} tập tin Keypoints.")

if __name__ == "__main__":
    main()

