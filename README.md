# DoAnChuyenNganh3 - Hệ thống Nhận Diện Ngôn Ngữ Kí Hiệu Đa Phương Thức

Dự án nhận diện ngôn ngữ ký hiệu ASL (25 lớp) sử dụng mô hình TGCN, MediaPipe và Gemini AI.

## 📂 Cấu trúc dự án
- **`backend/`**: Máy chủ xử lý AI, WebSockets và tích hợp Gemini.
- **`frontend/`**: Ứng dụng di động Expo (React Native).
- **`training/`**: Script huấn luyện model, xử lý dữ liệu và nghiên cứu.

## 🚀 Cách chạy hệ thống

### 1. Khởi động AI Backend
Cài đặt thư viện:
```bash
cd backend
pip install -r requirements.txt
```

Chạy nhận diện thời gian thực qua Webcam:
```bash
python backend/main_realtime.py
```

Khởi động Server cho Mobile App:
```bash
python backend/api_server_true_hybrid.py
```

### 2. Khởi động Mobile App (Frontend)
```bash
cd frontend
npm install
npx expo start
```

### 3. Huấn luyện Model (Training)
Nếu bạn muốn huấn luyện lại model:
```bash
cd training
python train_tgcn_final.py
```

---
## ✨ Tính năng mới cập nhật
- **Nhận diện liên tục (Continuous ASL):** Tự động dịch sau 2.5 giây tay đứng yên.
- **Đa ngôn ngữ:** Dịch song ngữ Việt - Anh bằng Gemini AI.
- **Text-to-Speech (TTS):** Tự động phát âm bản dịch tiếng Việt.
- **Lưu lịch sử:** Ghi lại các câu đã dịch vào `backend/data/history.json`.
- **Multi-modal:** Hiển thị Face Mesh để quan sát biểu cảm khuôn mặt.