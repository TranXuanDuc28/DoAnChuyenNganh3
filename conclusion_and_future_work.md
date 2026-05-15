# KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN (LUMINA SIGN)

## 1. Kết luận
Sau quá trình nghiên cứu và triển khai, nhóm đã xây dựng thành công ứng dụng **Lumina Sign** – Hệ thống hỗ trợ giao tiếp và học tập ngôn ngữ ký hiệu thông minh. Ứng dụng tích hợp các công nghệ hiện đại như **React Native**, **FastAPI (Python)**, **MediaPipe**, cùng mô hình học sâu **TGCN (Temporal Graph Convolutional Network)** và mô-đun **Gemini AI** để tối ưu hóa khả năng dịch thuật tự động.

Hệ thống đáp ứng đầy đủ các yêu cầu đặt ra ban đầu: nhận diện ký hiệu thời gian thực với độ chính xác cao, dịch thuật Gloss-to-Text mượt mà nhờ LLM, quản lý lộ trình học tập bài bản, và cung cấp giao diện trực quan, dễ tiếp cận cho cộng đồng người yếu thế. Đồ án góp phần chứng minh khả năng ứng dụng AI trong việc xóa bỏ rào cản giao tiếp giữa người khiếm thính và xã hội.

## 2. Kết quả đạt được

### a) Về mặt lí thuyết
Hiểu và vận dụng được các kiến thức cốt lõi:
- **Kiến trúc hệ thống**: Client–server giữa React Native và FastAPI qua REST API & WebSockets.
- **Xử lý tín hiệu video**: Cơ chế hoạt động của Pose & Hand Estimation bằng MediaPipe.
- **Học sâu (Deep Learning)**: Mô hình Temporal Graph Convolutional Network (TGCN) trong bài toán nhận diện hành động theo thời gian (Action Recognition).
- **Xử lý ngôn ngữ tự nhiên (NLP)**: Kỹ thuật Prompt Engineering để điều khiển Gemini AI dịch thuật ngôn ngữ ký hiệu sang văn bản có ngữ pháp.
- **Cơ sở dữ liệu**: Thiết kế hệ quản trị MySQL/PostgreSQL với cấu trúc quan hệ phức tạp (9 bảng) quản lý từ người dùng đến tiến trình học tập.

### b) Về mặt thực hành
Xây dựng thành công ứng dụng **Lumina Sign** đa nền tảng với các chức năng chính:
- **Nhận diện thời gian thực**: Dịch ngôn ngữ ký hiệu trực tiếp qua camera với độ trễ thấp (Real-time Inference).
- **Dịch thuật thông minh**: Chuyển đổi chuỗi ký hiệu (Gloss) thành câu văn hoàn chỉnh bằng Gemini AI.
- **Hệ thống E-learning**: Quản lý danh mục bài học, video hướng dẫn và bài kiểm tra (Quiz) tương tác.
- **Theo dõi tiến độ**: Hệ thống tính điểm, lưu lịch sử nhận diện và tính năng Streak (ngày học liên tiếp) giúp thúc đẩy động lực người học.
- **Cá nhân hóa**: Quản lý hồ sơ người dùng và tùy chỉnh giao diện hỗ trợ khả năng tiếp cận (Accessibility).

## 3. Hướng phát triển
Để nâng cao chất lượng và mở rộng khả năng ứng dụng thực tế, hệ thống có thể phát triển theo các hướng sau:

### (1) Phát triển mô hình AI
- **Mở rộng bộ dữ liệu**: Huấn luyện mô hình trên bộ dữ liệu lớn hơn để nhận diện được hàng nghìn từ vựng.
- **Tối ưu hóa mô hình**: Chuyển đổi sang các định dạng nhẹ để chạy inference trực tiếp trên thiết bị di động (Edge AI).
- **Nhận diện câu liên tục**: Phát triển khả năng nhận diện các câu ký hiệu dài và phức tạp hơn.

### (2) Mở rộng tính năng ứng dụng
- **Giao tiếp hai chiều**: Tích hợp Text-to-Sign (chuyển văn bản ngược lại thành video ký hiệu ảo).
- **Kết nối cộng đồng**: Tính năng gọi video hỗ trợ dịch trực tiếp cho người khiếm thính.
- **Hỗ trợ đa ngôn ngữ**: Nhận diện ngôn ngữ ký hiệu của nhiều quốc gia khác nhau.

### (3) Nâng cấp trải nghiệm người dùng
- **Gamification**: Bổ sung hệ thống bảng xếp hạng, huy hiệu để tăng tính thú vị khi học tập.
- **Accessibility nâng cao**: Tích hợp phản hồi rung và âm thanh khi AI nhận diện thành công.
