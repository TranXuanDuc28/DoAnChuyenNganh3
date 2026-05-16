
import cv2
import mediapipe as mp
import numpy as np
import os
import json
import tqdm
import re

# --- CONFIGURATION ---
WLASL_VIDEOS_DIR = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\videos"
WLASL_JSON_PATH = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\nslt_2000.json"
WLASL_CLASS_LIST = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\wlasl_class_list.txt"
USER_VIDEOS_DIR = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\videos"
OUTPUT_KEYPOINTS_DIR = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\keypoints"
LABEL_MAP_PATH = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\final_label_map.json"

# MediaPipe Initialization
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(static_image_mode=False, model_complexity=1, min_detection_confidence=0.5)

def extract_keypoints(results):
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])

def process_video(video_path, output_path):
    if os.path.exists(output_path): return True
    cap = cv2.VideoCapture(video_path)
    sequence = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = holistic.process(image)
        sequence.append(extract_keypoints(results))
    cap.release()
    if len(sequence) > 0:
        np.save(output_path, np.array(sequence))
        return True
    return False

def normalize_name(name):
    # THANK YOU -> THANKYOU, EAT -> EAT1, etc.
    name = name.upper().replace(" ", "").replace("-", "")
    if name == "THANKYOU": return "THANKYOU"
    if name == "EAT": return "EAT1"
    if name == "DRINK": return "DRINK1"
    if name == "WANT": return "WANT1"
    if name == "WHAT": return "WHAT1"
    if name == "DOCTOR": return "DOCTOR1"
    return name

# 1. Load Label Map
with open(LABEL_MAP_PATH, 'r') as f:
    label_map = json.load(f)

# 2. Gather User Videos
print("Scanning user videos...")
user_vids = {} # label -> [paths]
for f in os.listdir(USER_VIDEOS_DIR):
    if f.endswith(".mp4"):
        # Match pattern ASL_...-LABEL.mp4
        match = re.search(r"-(.*?)\.mp4", f)
        if match:
            raw_label = match.group(1).strip()
            norm_label = normalize_name(raw_label)
            if norm_label in label_map:
                if norm_label not in user_vids: user_vids[norm_label] = []
                user_vids[norm_label].append(os.path.join(USER_VIDEOS_DIR, f))

# 3. Gather WLASL Videos
print("Scanning WLASL metadata...")
wlasl_vids = {}
class_to_id = {}
with open(WLASL_CLASS_LIST, 'r') as f:
    for line in f:
        p = line.strip().split('\t')
        if len(p) >= 2: class_to_id[p[1].upper()] = int(p[0])

with open(WLASL_JSON_PATH, 'r') as f:
    w_meta = json.load(f)

for gloss in label_map:
    # Try to find ID for this gloss
    w_gloss = gloss
    if w_gloss.endswith("1"): w_gloss = w_gloss[:-1]
    if w_gloss == "THANKYOU": w_gloss = "THANK YOU"
    
    c_id = class_to_id.get(w_gloss)
    if c_id is not None:
        video_ids = [vid for vid, m in w_meta.items() if m['action'][0] == c_id]
        wlasl_vids[gloss] = [os.path.join(WLASL_VIDEOS_DIR, f"{str(v).zfill(5)}.mp4") for v in video_ids]

# 4. Process Everything
for gloss in label_map:
    print(f"\n--- Processing: {gloss} ---")
    word_dir = os.path.join(OUTPUT_KEYPOINTS_DIR, gloss)
    os.makedirs(word_dir, exist_ok=True)
    
    # Process User Vids
    uv = user_vids.get(gloss, [])
    for i, path in enumerate(tqdm.tqdm(uv, desc=f"User {gloss}")):
        out = os.path.join(word_dir, f"user_{i:04d}.npy")
        process_video(path, out)
        
    # Process WLASL Vids
    wv = wlasl_vids.get(gloss, [])
    for path in tqdm.tqdm(wv, desc=f"WLASL {gloss}"):
        if os.path.exists(path):
            vid_id = os.path.basename(path).split('.')[0]
            out = os.path.join(word_dir, f"wlasl_{vid_id}.npy")
            process_video(path, out)

holistic.close()
print("\n🎉 DONE! All sources merged.")
