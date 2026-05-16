
import os
import json

keypoints_dir = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\keypoints"
label_map_path = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\final_label_map.json"

with open(label_map_path, 'r') as f:
    target_words = list(json.load(f).keys())

report = []
total_missing = 0

for word in target_words:
    word_dir = os.path.join(keypoints_dir, word)
    count = 0
    if os.path.exists(word_dir):
        count = len([f for f in os.listdir(word_dir) if f.endswith('.npy')])
    
    needed = max(0, 100 - count)
    total_missing += needed
    
    status = "OK" if count >= 100 else "NEED"
    report.append({
        "word": word,
        "count": count,
        "needed": needed,
        "status": status
    })

# Sort by needed amount
report.sort(key=lambda x: x['needed'], reverse=True)

print("| Word | Current | **Needed for 100** | Status |")
print("| :--- | :--- | :--- | :--- |")
for item in report:
    if item['needed'] > 0:
        print(f"| **{item['word']}** | {item['count']} | **+{item['needed']}** | {item['status']} |")

print(f"\nTOTAL_MISSING: {total_missing}")
