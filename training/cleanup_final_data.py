
import os
import json
import shutil

keypoints_dir = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\keypoints"
label_map_path = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\final_label_map.json"

# Load the 30 words we want to keep
with open(label_map_path, 'r') as f:
    keep_words = set(json.load(f).keys())

print(f"CLEANING UP KEYPOINTS: Keeping {len(keep_words)} classes.")

# 1. Remove subdirectories not in the keep list
for item in os.listdir(keypoints_dir):
    item_path = os.path.join(keypoints_dir, item)
    if os.path.isdir(item_path):
        if item not in keep_words:
            print(f"Deleting extra folder: {item}")
            shutil.rmtree(item_path)
    else:
        # 2. Remove loose files at the root (they should be in subfolders now)
        if item.endswith('.npy'):
            # print(f"Deleting loose file: {item}")
            os.remove(item_path)

print("Cleanup complete. Keypoints folder is now optimized for the 30-word vocabulary.")
