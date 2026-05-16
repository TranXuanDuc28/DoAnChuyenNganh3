
import os
import shutil
import re
import json

keypoints_dir = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\keypoints"
label_map_path = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\final_label_map.json"

def normalize_label(label):
    label = label.upper().replace(" ", "").replace("-", "")
    
    # Existing mappings
    if label == "THANKYOU": return "THANKYOU"
    if label in ["EAT", "EAT1"]: return "EAT1"
    if label in ["DRINK", "DRINK1"]: return "DRINK1"
    if label in ["WANT", "WANT1", "WANT2"]: return "WANT1"
    if label in ["WHAT", "WHAT1", "WHAT2"]: return "WHAT1"
    if label in ["DOCTOR", "DOCTOR1"]: return "DOCTOR1"
    if label == "CAN1": return "CAN"
    
    # NEW Synonym mappings to fill gaps
    if label == "PAIN": return "HURT"
    if label in ["BATHROOM", "RESTROOM"]: return "TOILET"
    
    return label

# 1. Load 45 target words
with open(label_map_path, 'r') as f:
    target_words = list(json.load(f).keys())

print(f"Target words: {len(target_words)}")

# 2. Final Optimized Cleanup
moved_count = 0
skipped_count = 0

for f in os.listdir(keypoints_dir):
    if not f.endswith(".npy") or not os.path.isfile(os.path.join(keypoints_dir, f)):
        continue
        
    found_label = None
    
    # Pattern 1: ASL_...-LABEL.mp4.npy or WLASL_LABEL_...
    match1 = re.search(r"-(.*?)\.mp4", f)
    if match1:
        found_label = normalize_label(match1.group(1).strip())
    
    # Pattern 2: BAI_LABEL_...mp4.npy
    if not found_label:
        match2 = re.search(r"BAI_(.*?)_", f)
        if match2:
            found_label = normalize_label(match2.group(1).strip())
            
    # Pattern 3: WLASL_LABEL_...
    if not found_label:
        match3 = re.search(r"WLASL_(.*?)_", f)
        if match3:
            found_label = normalize_label(match3.group(1).strip())

    if found_label and found_label in target_words:
        dest_dir = os.path.join(keypoints_dir, found_label)
        os.makedirs(dest_dir, exist_ok=True)
        try:
            shutil.move(os.path.join(keypoints_dir, f), os.path.join(dest_dir, f))
            moved_count += 1
        except:
            skipped_count += 1
    else:
        skipped_count += 1

print(f"DONE: Final move of {moved_count} files. Skipped {skipped_count} files.")
