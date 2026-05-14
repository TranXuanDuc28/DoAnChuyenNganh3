import os
import cv2
import torch
import numpy as np
import json
import mediapipe as mp
import sys

# Add backend to path
sys.path.append(os.getcwd())

from core.tgcn_model import GCN_muti_att
from core.inference_utils import extract_keypoints, interpolate_missing_keypoints

# Constants
MODEL_PATH = "weights/best_tgcn_model.pth"
LABEL_MAP_PATH = "data/label_map.json"
VIDEO_DIR = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\videos"

# MediaPipe Setup
mp_holistic = mp.solutions.holistic

def predict_video(video_path, model, label_map, device):
    id_to_word = {v: k for k, v in label_map.items()}
    cap = cv2.VideoCapture(video_path)
    frames_keypoints = []
    
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = holistic.process(image)
            kps = extract_keypoints(results)
            frames_keypoints.append(kps)
            
    cap.release()
    
    if len(frames_keypoints) < 10: return "Too short", 0.0
    
    seq = np.array(frames_keypoints)
    seq = interpolate_missing_keypoints(seq)
    T = seq.shape[0]
    
    # Normalization (Matches training/inference)
    res_seq = np.zeros_like(seq)
    for i in range(T):
        nose = seq[i, 0]
        s1, s2 = seq[i, 11], seq[i, 12]
        dist = np.linalg.norm(s1 - s2)
        if dist == 0: dist = 1.0
        if not np.all(nose == 0):
            for j in range(75):
                if not np.all(seq[i, j] == 0):
                    res_seq[i, j] = (seq[i, j] - nose) / dist
    
    # 55 Points (Pose + Hands)
    BODY = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24]
    HANDS = list(range(33, 75))
    indices = BODY + HANDS
    seq_55 = res_seq[:, indices, :2]
    
    # Sample 30 frames
    idx = np.linspace(0, T - 1, 30).astype(int)
    sampled = seq_55[idx]
    
    # Reshape for TGCN (1, 55, 60)
    input_data = sampled.transpose(1, 0, 2).reshape(1, 55, -1)
    input_tensor = torch.FloatTensor(input_data).to(device)
    
    with torch.no_grad():
        output = model(input_tensor)
        prob = torch.softmax(output, dim=1)
        conf, pred = torch.max(prob, 1)
        
    return id_to_word.get(pred.item(), "Unknown"), conf.item()

def run_test():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Testing on {device}...")
    
    with open(LABEL_MAP_PATH, 'r') as f:
        label_map = json.load(f)
        
    model = GCN_muti_att(input_feature=60, hidden_feature=64, num_class=25, p_dropout=0.3, num_stage=20)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.to(device)
    model.eval()
    
    test_cases = [
        ("ASL_0022932153577568393-HELLO.mp4", "HELLO"),
        ("ASL_011053589241707185-BYE.mp4", "BYE"),
        ("ASL_12979829347320937-HELP.mp4", "HELP"),
        ("ASL_050364485120873326-YES.mp4", "YES"),
        ("ASL_00792407895198255-SLEEP.mp4", "SLEEP")
    ]
    
    print("\n--- Model Recognition Test Results ---\n")
    for filename, expected in test_cases:
        path = os.path.join(VIDEO_DIR, filename)
        if not os.path.exists(path):
            print(f"File missing: {filename}")
            continue
            
        pred, conf = predict_video(path, model, label_map, device)
        status = "PASS" if pred == expected else "FAIL"
        print(f"File: {expected:<10} | Pred: {pred:<10} | Conf: {conf:.4f} | {status}")

if __name__ == "__main__":
    run_test()
