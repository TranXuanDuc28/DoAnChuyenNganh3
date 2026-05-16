# Báo cáo Phân tích Dữ liệu Nhận diện - Chiến lược 30 Lớp Cân Bằng (Lumina v2)

Bản báo cáo này cập nhật chiến lược tối ưu hóa model bằng cách chọn ra **30 từ vựng tốt nhất** và áp dụng kỹ thuật **Cân bằng tuyệt đối (Perfect Balance)** để đạt độ chính xác cao nhất.

## 📊 Danh sách 30 từ vựng mục tiêu (Top 30 Balanced)

| STT | Từ vựng (Gloss) | Mẫu thực tế | Ngưỡng Train | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| 1 | NIGHT | 212 | **104** | 🏆 Top 1 |
| 2 | READ | 186 | **104** | 🏆 Top 2 |
| 3 | FINISH | 184 | **104** | 🏆 Top 3 |
| 4 | FRIEND | 179 | **104** | 🏆 |
| 5 | WATER | 173 | **104** | 🏆 |
| 6 | WHERE | 173 | **104** | 🏆 |
| 7 | MANY | 167 | **104** | 🏆 |
| 8 | WRITE | 165 | **104** | 🏆 |
| 9 | START | 142 | **104** | ⭐⭐⭐⭐⭐ |
| 10 | YOU | 141 | **104** | ⭐⭐⭐⭐⭐ |
| 11 | LIKE | 139 | **104** | ⭐⭐⭐⭐⭐ |
| 12 | CLEAN | 136 | **104** | ⭐⭐⭐⭐⭐ |
| 13 | SLEEP | 132 | **104** | ⭐⭐⭐⭐⭐ |
| 14 | NOW | 128 | **104** | ⭐⭐⭐⭐⭐ |
| 15 | YES | 128 | **104** | ⭐⭐⭐⭐⭐ |
| 16 | COOK | 127 | **104** | ⭐⭐⭐⭐⭐ |
| 17 | FAMILY | 126 | **104** | ⭐⭐⭐⭐⭐ |
| 18 | MOTHER | 121 | **104** | ⭐⭐⭐⭐⭐ |
| 19 | BAD | 114 | **104** | ⭐⭐⭐⭐ |
| 20 | SORRY | 111 | **104** | ⭐⭐⭐⭐ |
| 21 | EAT1 | 111 | **104** | ⭐⭐⭐⭐ |
| 22 | TIME | 111 | **104** | ⭐⭐⭐⭐ |
| 23 | BUSY | 108 | **104** | ⭐⭐⭐⭐ |
| 24 | FAST | 108 | **104** | ⭐⭐⭐⭐ |
| 25 | NO | 107 | **104** | ⭐⭐⭐⭐ |
| 26 | FATHER | 105 | **104** | ⭐⭐⭐⭐ |
| 27 | LATE | 104 | **104** | ⭐⭐⭐⭐ |
| 28 | TIRED | 104 | **104** | ⭐⭐⭐⭐ |
| 29 | GOOD | 104 | **104** | ⭐⭐⭐⭐ |
| 30 | LATER | 104 | **104** | ⭐⭐⭐⭐ |

---

## 🛠️ Chiến lược Tối ưu hóa:

1.  **Lọc dữ liệu:** Chỉ chọn 30 từ có số lượng mẫu lớn nhất để đảm bảo model có đủ "vốn" để học.
2.  **Cân bằng tuyệt đối (Undersampling):** Mặc dù từ `NIGHT` có 212 mẫu, nhưng script sẽ chỉ lấy **104** mẫu (bằng với từ ít nhất trong top 30 là `LATER`). Điều này triệt tiêu hoàn toàn lỗi dự đoán lệch (Bias) sang các lớp có nhiều dữ liệu.
3.  **Cấu hình Model:** Sử dụng `HIDDEN_SIZE = 128` để tăng khả năng phân tách giữa các ký hiệu có nét tương đồng trong 30 lớp.

## 📈 Nhận xét tổng quan:
*   **Tổng số từ vựng:** 30 (Tinh gọn từ bộ 52).
*   **Độ cân bằng:** 100% (Tất cả các lớp đều có đúng 104 mẫu khi train).
*   **Mục tiêu:** Đạt Val Accuracy > 90% cho các tác vụ thời gian thực.

---
*Báo cáo cập nhật ngày 16/05/2026 sau khi áp dụng thuật toán Tự động Cân bằng (Auto-Balance).*
