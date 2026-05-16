
import json
import os

# Đường dẫn
wlasl_class_list = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\wlasl_class_list.txt"
wlasl_json = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\nslt_2000.json"
keypoints_dir = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\dataset_keypoints"

# Danh sách 45 từ của bạn (chuẩn hóa về lowercase để khớp WLASL)
ESSENTIAL_VOCAB = [
    "ME", "YOU", "WE", "WHO",
    "WANT1", "NEED", "LIKE", "HELP",
    "GO", "COME", "EAT1", "DRINK1",
    "HELLO", "THANKYOU", "SORRY",
    "WHAT1", "WHERE", "WHY",
    "GOOD", "BAD", "YES", "NO",
    "MOTHER", "FATHER", "FRIEND",
    "NOW", "TIME", "FINISH",
    "SLEEP", "HAPPY",
    "SICK", "HURT", "HOSPITAL", "TOILET", "PLEASE", 
    "AGAIN", "UNDERSTAND", "DONT_UNDERSTAND", "WAIT", "HOME", 
    "SCARED", "MONEY", "WORK", "NAME", "POLICE"
]

# Hàm map từ vựng sang chuẩn WLASL
def normalize_gloss(gloss):
    gloss = gloss.lower()
    if gloss == "thankyou": return "thank you"
    if gloss == "dont_understand": return "don't understand"
    if gloss.endswith("1"): return gloss[:-1]
    return gloss

# 1. Đọc mapping từ WLASL class list
class_to_id = {}
with open(wlasl_class_list, 'r') as f:
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) >= 2:
            class_to_id[parts[1].lower()] = int(parts[0])

# 2. Đọc nslt_2000.json để tìm video_id cho mỗi class_id
with open(wlasl_json, 'r') as f:
    wlasl_data = json.load(f)

# 3. Duyệt và kiểm tra file thực tế
results = {}
total_available = 0

for gloss in ESSENTIAL_VOCAB:
    w_gloss = normalize_gloss(gloss)
    c_id = class_to_id.get(w_gloss)
    
    if c_id is None:
        results[gloss] = 0
        continue
        
    # Tìm tất cả video_id có label_id này
    video_ids = [vid for vid, meta in wlasl_data.items() if meta['action'][0] == c_id]
    
    # Kiểm tra xem file .npy có tồn tại trong máy không
    count = 0
    for vid in video_ids:
        # File có thể là "12345.npy" hoặc "01234.npy" (5 chữ số)
        vid_str = str(vid).zfill(5)
        if os.path.exists(os.path.join(keypoints_dir, f"{vid_str}.npy")):
            count += 1
            
    results[gloss] = count
    total_available += count

# Xuất kết quả
print("-" * 50)
print(f"{'GLOSS':<20} | {'WLASL ID':<10} | {'AVAILABLE SAMPLES'}")
print("-" * 50)
for gloss in ESSENTIAL_VOCAB:
    w_gloss = normalize_gloss(gloss)
    c_id = class_to_id.get(w_gloss, "N/A")
    print(f"{gloss:<20} | {str(c_id):<10} | {results[gloss]}")

print("-" * 50)
print(f"Tổng cộng số video có sẵn trong máy: {total_available}")
