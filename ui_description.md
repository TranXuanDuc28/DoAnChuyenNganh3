# MÔ TẢ CHI TIẾT GIAO DIỆN ỨNG DỤNG LUMINA SIGN

## 1. Giao diện Đăng nhập / Đăng ký
- **Chức năng**: Xác thực người dùng qua Email và mật khẩu.
- **Trải nghiệm**: Giao diện tối giản, tích hợp thông báo lỗi thời gian thực (ví dụ: sai định dạng email).
- **Công nghệ**: Sử dụng JWT để duy trì trạng thái đăng nhập.

## 2. Trang chủ (Home)
- **Chức năng**: Trung tâm điều hướng của ứng dụng.
- **Thành phần**:
    - Header chào mừng người dùng kèm số ngày học liên tiếp (Streak).
    - Các Shortcut truy cập nhanh vào Camera nhận diện hoặc bài học mới nhất.
    - Danh sách gợi ý từ vựng mỗi ngày (Daily Sign).

## 3. Trang Nhận diện Ngôn ngữ ký hiệu (AI Recognition)
- **Giao diện**: Full-screen Camera tích hợp MediaPipe Landmarks.
- **Chức năng chính**:
    - Nhận diện hành động ký hiệu theo thời gian thực (TGCN Model).
    - Hiển thị từ khóa (Gloss) ngay khi người dùng kết thúc một ký hiệu.
    - Tự động dịch thuật sang câu văn xuôi hoàn chỉnh bằng Gemini AI sau khi người dùng ngừng hoạt động.
- **Tương tác**: Có thanh trạng thái hiển thị độ tin cậy (Confidence) của AI.

## 4. Trang Học tập (Learning & Library)
- **Giao diện**: Danh sách theo dạng lưới (Grid) hoặc danh sách (List) các chủ đề bài học.
- **Nội dung**:
    - Video mẫu quay chậm để người dùng dễ theo dõi.
    - Hệ thống câu đố (Quizzes) tương tác để kiểm tra khả năng nhớ từ.
    - Tính năng "Tập luyện cùng AI" giúp người dùng tự kiểm tra độ chuẩn xác của ký hiệu mình thực hiện.

## 5. Trang Theo dõi Tiến độ (Progress)
- **Chức năng**: Thống kê lộ trình phát triển của người dùng.
- **Thành phần**:
    - Biểu đồ hình tròn hiển thị tổng tiến độ học tập.
    - Lịch sử các bài kiểm tra đạt điểm cao.
    - Thống kê số lượng ký hiệu đã học được.

## 6. Trang Hồ sơ (Profile & Settings)
- **Chức năng**: Quản lý tài khoản cá nhân.
- **Thành phần**:
    - Quản lý thông tin cá nhân và ảnh đại diện.
    - Danh sách lịch sử nhận diện đã lưu (có thể xem lại và xóa).
    - Cài đặt hệ thống: Ngôn ngữ, Chế độ tối (Dark mode), Cỡ chữ hỗ trợ người dùng đặc biệt.
