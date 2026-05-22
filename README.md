# BÁO CÁO BÀI TẬP 04

**Môn:** Phát triển ứng dụng với mã nguồn mở - TEE0421  
**Lớp:** 58KTPM  
**Sinh viên:** Đặng Đinh Đạt  
**Nội dung:** Khai thác n8n để tự động đăng bài lên WordPress

## 1. Mục tiêu bài tập

Bài tập này nhằm xây dựng một hệ thống tự động đăng bài lên WordPress bằng n8n, kết hợp với Telegram Bot, Google Gemini và Cloudflare Tunnel. Luồng xử lý được thiết kế để người dùng chỉ cần gửi một câu lệnh ngắn qua Telegram, hệ thống sẽ tự tạo nội dung bài viết theo định dạng HTML và đẩy bài đó lên WordPress gần như tự động hoàn toàn. Bài làm cũng yêu cầu triển khai toàn bộ dịch vụ bằng Docker Compose, public qua Cloudflare Tunnel và kiểm tra từng bước bằng giao diện web.

## 2. Thành phần hệ thống

Hệ thống được triển khai bằng Docker Compose với 5 service chính:

- `mariadb`: lưu cơ sở dữ liệu cho WordPress.
- `phpmyadmin`: giao diện quản trị database.
- `wordpress`: website WordPress để hiển thị bài viết.
- `cloudflared`: tạo tunnel và public các dịch vụ ra internet.
- `n8n`: workflow automation để nhận prompt, gọi AI và đăng bài.

File triển khai chính: [docker-compose.yml](docker-compose.yml).  
File xử lý dữ liệu ở node Code JavaScript: [n8n_code_node.js](n8n_code_node.js).

Từ hai file này, em đã cấu hình đủ phần hạ tầng cơ bản để WordPress có CSDL riêng, phpMyAdmin truy cập được vào MariaDB, Cloudflared giữ vai trò trung gian public các dịch vụ, và n8n đảm nhiệm phần tự động hóa nội dung.

## 3. Cấu hình Docker Compose

Trong `docker-compose.yml`, em khai báo các biến môi trường và image theo yêu cầu của đề. Mỗi service được tách riêng để dễ kiểm tra và dễ thay đổi cấu hình khi cần:

- MariaDB dùng `mariadb:latest`, có cấu hình múi giờ `Asia/Ho_Chi_Minh` và thông tin database riêng cho WordPress.
- phpMyAdmin dùng `phpmyadmin:latest`, kết nối qua `PMA_HOST=mariadb`.
- WordPress dùng `wordpress:latest`, nhận đầy đủ thông tin kết nối CSDL từ MariaDB.
- Cloudflared dùng `cloudflare/cloudflared:latest`, chạy tunnel theo token lấy từ Cloudflare.
- n8n dùng `n8nio/n8n:latest`, khai báo `WEBHOOK_URL` theo sub-domain public của n8n.

Sau khi cấu hình xong, em thực hiện `docker-compose up -d` để kéo image và khởi chạy toàn bộ hệ thống. Đây là bước kiểm tra đầu tiên để đảm bảo các container chạy ổn định, không bị restart liên tục.

### 3.1 Khởi chạy toàn bộ service bằng Docker Compose

<img width="979" height="512" alt="image" src="https://github.com/user-attachments/assets/c82204eb-d2ee-435b-a8a7-ab8f85dd5f6f" />

## 4. Thiết lập Cloudflare Tunnel

Sau khi tunnel hoạt động, em thêm các route công khai để map từng sub-domain vào đúng service nội bộ. Mục tiêu là truy cập WordPress, phpMyAdmin và n8n từ bên ngoài mà không phải mở cổng trực tiếp trên máy chủ:

- `wp.dangdinhdat.id.vn` trỏ tới WordPress.
- `pma.dangdinhdat.id.vn` trỏ tới phpMyAdmin.
- `n8n.dangdinhdat.id.vn` trỏ tới n8n.

Nhờ đó có thể truy cập từng dịch vụ từ trình duyệt và điện thoại mà không cần mở port trực tiếp trên máy chủ. Phần này đặc biệt quan trọng vì toàn bộ bài tập dựa vào việc public tunnel để kiểm thử từ xa.

### 4.1 Cấu hình public route trên Cloudflare Tunnel

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f3c354df-d119-4e96-87a9-5181b0810fe2" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/e6106405-9b54-4bc6-8833-c2fedd321f32" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f4c2087c-47ec-45da-b162-6b14cdde09b9" />


### 4.2 Chi tiết route tunnel trong Cloudflare

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/40eafb40-2175-43b1-b7a2-4f879a6cba6f" />


## 5. Cài đặt WordPress và kiểm tra database

Em truy cập `wp.dangdinhdat.id.vn` để hoàn tất cài đặt WordPress. Sau khi làm xong các bước cài đặt cơ bản, em quay lại phpMyAdmin để kiểm tra. Lúc này database `wordpress_db` đã xuất hiện đầy đủ bảng hệ thống do WordPress sinh ra như `wp_posts`, `wp_users`, `wp_options`, `wp_comments`...

### 5.1 Trang quản trị WordPress sau khi cài đặt

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c746ae10-68a5-40c6-9bf0-c3b1045114bd" />

### 5.2 phpMyAdmin hiển thị các bảng WordPress

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4636ebb7-61bf-4eba-a1ff-f978387e7f4a" />

## 6. Kích hoạt n8n và chuẩn bị bot Telegram

Trước khi cấu hình workflow, em cần hoàn tất phần kích hoạt n8n và chuẩn bị bot Telegram. Đây là hai điều kiện đầu vào để hệ thống nhận được prompt từ người dùng và cho phép một số tính năng của n8n hoạt động ổn định hơn.

### 6.1 Email n8n gửi license key

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/10ab3804-db59-4c00-9106-9eb687b5c456" />

### 6.2 Tạo bot mới bằng BotFather

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/603c4281-daf8-4ce3-978c-fdbbdce6c173" />

Sau khi tạo bot, em lấy token từ BotFather và gửi một tin nhắn đầu tiên vào bot để Telegram có dữ liệu đầu vào cho node Trigger. Nếu không có bước này thì n8n khó nhận được cập nhật message ngay từ lần đầu.

## 7. Cấu hình workflow n8n tự động đăng bài

Workflow trong n8n được thiết kế theo chuỗi sau:

1. **Telegram Trigger**: nhận nội dung chat từ bot Telegram.
2. **Google Gemini - Message a model**: gửi prompt sang AI để sinh nội dung HTML.
3. **Code in JavaScript**: tách tiêu đề và nội dung từ JSON do AI trả về.
4. **WordPress - Create a Post**: tạo bài viết mới trên WordPress.

### 7.1 Telegram Trigger

Node này nhận tin nhắn từ bot Telegram và đẩy dữ liệu đầu vào cho toàn bộ luồng tự động. Ở màn hình cấu hình, em chọn credential Telegram account, đặt Trigger On là `Message`, sau đó kiểm tra output để chắc chắn payload có đủ `message.text`, `chat.id`, `from.first_name`...

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/66c2ec30-e1d8-4a40-8ad6-9d8b85136094" />

### 7.2 Google Gemini - Message a model

Em dùng API key từ Google AI Studio để cấu hình credential cho node Gemini. Prompt được ghép thêm yêu cầu sinh HTML + CSS để AI trả về nội dung có cấu trúc rõ ràng, dễ đăng lên WordPress hơn. Em cũng bật chế độ Output Content as JSON để dễ xử lý ở node Code phía sau.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/78d1abf4-7b75-4bf1-89a0-f10ee71cef55" />

### 7.3 Code in JavaScript

Node Code dùng để đọc kết quả trả về từ Gemini, xử lý JSON và tách thành 2 trường. Đây là bước trung gian rất quan trọng vì output của Gemini thường nằm trong một chuỗi HTML dài, cần được chuyển lại thành dữ liệu sạch cho WordPress:

- `title`: tiêu đề bài viết.
- `content`: nội dung HTML của bài viết.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1ab27e1e-b1e8-428b-8989-a49040e91ef8" />

Trong ảnh này có thể thấy phần input từ Gemini ở bên trái và output bên phải đã được rút gọn thành đúng 2 trường cần thiết cho bước tạo post.

### 7.4 Toàn bộ workflow n8n

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/15629c4e-4b2d-4383-a76a-bbb08476cee6" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4a65e9eb-9618-445a-864e-2571ceba37f1" />


Đây là sơ đồ tổng thể của luồng tự động hóa. Bốn node chính được nối theo đúng thứ tự xử lý: nhận message, sinh nội dung, lọc dữ liệu và tạo bài viết.

### 7.5 Lịch sử phiên bản workflow

<img width="1179" height="2556" alt="image" src="https://github.com/user-attachments/assets/cfce1a3d-daf4-4704-86c9-1ad3097e9f71" />

Ảnh này dùng để minh họa rằng workflow đã được publish và có lịch sử thay đổi trên n8n. Nó cũng xác nhận workflow không chỉ là bản nháp cục bộ mà đã được lưu và chạy trên hệ thống thật.

## 8. Bài viết đã được đăng lên WordPress

Khi workflow chạy xong, bài viết xuất hiện trong trình soạn thảo WordPress với tiêu đề và nội dung đúng theo prompt đã gửi từ Telegram. Ảnh bên dưới là màn hình chỉnh sửa bài viết sau khi hệ thống tạo ra bài viết tự động, cho thấy nội dung đã được đẩy sang WordPress thành công.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/81380067-4c8c-43f8-ac09-ceae3b3ff85a" />

## 9. Nhận xét thành quả đạt được

Kết quả bài tập đạt đúng yêu cầu đề ra:

- Docker Compose chạy đồng thời 5 service cần thiết.
- Cloudflare Tunnel public được WordPress, phpMyAdmin và n8n bằng các sub-domain riêng.
- n8n nhận được nội dung từ Telegram, gọi Gemini sinh nội dung HTML và đăng bài sang WordPress.
- Quy trình hoạt động tự động, có thể demo trực tiếp từ điện thoại đến website WordPress.

Ngoài phần chạy được end-to-end, em cũng đã kiểm tra lại từng bước trung gian để đảm bảo dữ liệu từ Telegram đi qua Gemini, qua node Code rồi mới sang WordPress, đúng với yêu cầu đề bài.

## 10. Kết luận

Qua bài tập này, em đã nắm được cách kết hợp Docker, Cloudflare Tunnel, WordPress và n8n để xây dựng một quy trình tự động hóa hoàn chỉnh. Đây là một mô hình thực tế, dễ mở rộng và rất phù hợp để áp dụng cho việc tự động sinh nội dung và đăng bài lên website.
