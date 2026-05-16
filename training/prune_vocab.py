
import os
import json

keypoints_dir = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\keypoints"
label_map_path = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\final_label_map.json"

# List of all candidate words (45 words)
with open(label_map_path, 'r') as f:
    candidate_words = list(json.load(f).keys())

# Special addition: DOCTOR (it has many samples)
if "DOCTOR1" not in candidate_words:
    candidate_words.append("DOCTOR1")

word_counts = []
for word in candidate_words:
    word_dir = os.path.join(keypoints_dir, word)
    if os.path.exists(word_dir):
        count = len([f for f in os.listdir(word_dir) if f.endswith('.npy')])
        word_counts.append((word, count))
    else:
        word_counts.append((word, 0))

# Sort by count descending and take top 30
word_counts.sort(key=lambda x: x[1], reverse=True)
top_30 = word_counts[:30]

# Create new label map
new_label_map = {word: i for i, (word, count) in enumerate(top_30)}

with open(label_map_path, 'w') as f:
    json.dump(new_label_map, f, indent=4)

print("NEW TOP 30 VOCABULARY:")
for word, count in top_30:
    print(f"{word}: {count}")
