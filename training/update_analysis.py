
import os
import re

keypoints_dir = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\keypoints"
analysis_file = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\dataset_analysis.md"

# 1. Đếm số mẫu thực tế
stats = {}
if os.path.exists(keypoints_dir):
    for word in os.listdir(keypoints_dir):
        word_path = os.path.join(keypoints_dir, word)
        if os.path.isdir(word_path):
            count = len([f for f in os.listdir(word_path) if f.endswith('.npy')])
            stats[word] = count

# 2. Đọc nội dung file markdown
with open(analysis_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 3. Cập nhật từng dòng bảng
new_lines = []
for line in lines:
    if "|" not in line or "---" in line:
        new_lines.append(line)
        continue
    
    parts = line.split("|")
    if len(parts) < 4:
        new_lines.append(line)
        continue
    
    # Lấy nhãn từ cột 1 (ví dụ: **ME / YOU / WE**)
    label_cell = parts[1].strip().replace("*", "")
    words_in_cell = [w.strip() for w in label_cell.split("/")]
    
    # Kiểm tra xem có từ nào trong cell này nằm trong stats không
    has_update = False
    new_counts = []
    for w in words_in_cell:
        if w in stats:
            new_counts.append(str(stats[w]))
            has_update = True
        else:
            # Giữ nguyên giá trị cũ nếu không tìm thấy (có thể là 0)
            old_val_match = re.search(r"(\d+)", parts[3])
            new_counts.append(old_val_match.group(1) if old_val_match else "0")
    
    if has_update:
        # Cập nhật cột "Số mẫu hiện có" (cột 3)
        parts[3] = f" {' / '.join(new_counts)} "
        
        # Cập nhật cột "Trạng thái" (cột 4) dựa trên trung bình cộng hoặc giá trị thấp nhất
        min_count = min([int(c) for c in new_counts])
        status = "✅ Tốt" if min_count >= 30 else ("⚠️ Thêm" if min_count >= 10 else "❌ Thiếu")
        parts[4] = f" {status} "
        
        line = "|".join(parts)
        
    new_lines.append(line)

with open(analysis_file, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("SUCCESS: Intelligent Update of dataset_analysis.md completed.")
