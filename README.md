# 📊 Hệ Thống Phân Tích Việc Làm IT (IT Job Analytics)

Bài tập lớn môn học: Lập trình Python


Đề tài :Công cụ tổng hợp và phân tích xu hướng việc làm IT (Job Aggregator)  


* **Tầng Thu Thập & Lưu Trữ Dữ Liệu (ETL Pipeline):**
    * **Ngôn ngữ chính:** Python kết hợp thư viện `requests` để tương tác và khai thác dữ liệu từ cấu trúc Google Jobs thông qua dịch vụ **SerpAPI**.
    * **Cơ chế lọc trùng:** Tích hợp bộ lọc thông minh dựa trên thuộc tính `URL` duy nhất của từng tin tuyển dụng, tự động nhận diện và loại bỏ hoàn toàn các bản ghi đã tồn tại trước khi nạp vào hệ thống để bảo vệ dung lượng bộ nhớ.
    * **Cơ sở dữ liệu:** Sử dụng hệ quản trị cơ sở dữ liệu quan hệ **SQLite** nhỏ gọn, kết hợp với trường bọc ORM **SQLAlchemy** để quản lý cấu trúc bảng và thực thi truy vấn dữ liệu an toàn.

* **Tầng Xử Lý Thông Minh (AI Integration):**
    * Tích hợp **Gemini AI API** làm lõi xử lý ngôn ngữ tự nhiên (NLP) để bóc tách, chuẩn hóa các dải lương thô phi cấu trúc và phân tích nội dung mô tả công việc (JD) phức tạp thành các thẻ kỹ năng (Tech Stack) cốt lõi phục vụ thống kê trực quan.

* **Tầng Quản Trị & Tự Động Hóa (Automation Scheduler):**
    * Sử dụng thư viện `BackgroundScheduler` (thuộc gói `APScheduler`) thiết lập luồng chạy ngầm độc lập (`daemon=True`). Hệ thống tự động kích hoạt lại toàn bộ chu trình tái nạp dữ liệu và xử lý AI theo chu kỳ cố định **24 giờ/lần** mà không gây ảnh hưởng đến hiệu năng truy cập Dashboard của người dùng.

* **Tầng Backend Server & API Gateway:**
    * Xây dựng trên nền tảng **Flask Framework** kết hợp cơ chế chia gói **Blueprint** để đóng gói cấu trúc mã nguồn và điều phối hệ thống RESTful API phân trang chuyên nghiệp.
    * Cấu hình thư viện `Flask-CORS` đảm bảo chia sẻ tài nguyên an toàn giữa các nguồn (Cross-Origin Resource Sharing) và quản lý bảo mật nghiêm ngặt các mã khóa API key thông qua tệp cấu hình môi trường `.env` (`python-dotenv`).

* **Tầng Frontend Dashboard:**
    * Giao diện Responsive hiển thị đa nền tảng được phát triển bằng bộ ba **HTML5, CSS3, và JavaScript** nguyên bản (Vanilla JS), không phụ thuộc vào framework nặng nề.
    * Trực quan hóa dữ liệu thời gian thực bằng thư viện **Chart.js**, cung cấp chuỗi 6 trang báo cáo chuyên sâu (Biểu đồ mạng nhện tech stack, biểu đồ Box-plot/Histogram phân tích dải lương, Scatter plot độ rộng thị trường, Line chart theo dõi xu hướng tuyển dụng...).

## 🚀 Các Tính Năng Chính Của Hệ Thống

- **Dashboard Tổng Quan (Trang 1)**: Cập nhật thời gian thực tổng số việc làm, kỹ năng đã quét, lương trung bình toàn thị trường, và tích hợp 3 biểu đồ trực quan (Cơ cấu khu vực, Nguồn dữ liệu gốc, Top kỹ năng hot).
- **Khám Phá Việc Làm (Trang 2)**: Kho dữ liệu việc làm gốc tích hợp bộ lọc tìm kiếm nâng cao (Vị trí, Khu vực, Lương), phân trang mượt mà và cửa sổ hiển thị chi tiết JD (Modal).
- **Phân Tích Kỹ Năng IT (Trang 3)**: Trực quan hóa mức độ phổ biến bằng biểu đồ cột ngang, Đám mây từ khóa sinh động (Word Cloud), biểu đồ lưới nhện Cán cân công nghệ (Tech Stack) và biểu đồ Đường đua công nghệ theo chuỗi thời gian.
- **Phân Tích Lương Chuyên Sâu (Trang 4)**: Cung cấp 5 góc nhìn phân tích lương (Top kỹ năng thu nhập cao, Tỷ lệ việc làm, Phân bố mức lương theo cấp bậc Box Plot, Mật độ tập trung Histogram và Độ rộng dải lương Scatter). Hỗ trợ chuyển đổi đơn vị USD / VNĐ thông minh.
- **Bản Đồ Tuyển Dụng (Trang 5)**: Biểu đồ bánh phân tích quy mô việc làm theo thành phố. Tích hợp tính năng tương tác click chuột vào vùng miền để lọc Bảng phong thần các công ty tuyển dụng hàng đầu.
- **Xu Hướng Thị Trường (Trang 6)**: Theo dõi lưu lượng tin đăng tuyển mới (Line Chart) và biểu đồ cột chồng (Stacked Bar Chart) phân tích diễn biến dịch chuyển cơ cấu Tech Stack theo ngày.
- **Quản Trị Hệ Thống (Trang 7)**: Bảng điều khiển admin kiểm tra trạng thái kết nối Database (SQLite), Server (Flask) và hướng dẫn thực thi chuỗi công cụ Automation Pipeline (ETL).

## 🛠️ Hướng Dẫn Cài Đặt và Triển Khai
## Môi trường sử dụng: Visual Studio Code
### 1. Tải mã nguồn về máy local

Tải file định dạng `.zip` trực tiếp từ: https://github.com/htphuc-dev/it-job-analytics

Hoặc nếu máy tính đã cài đặt sẵn Git, thực thi lệnh sau dưới Terminal:

```bash
git clone https://github.com/htphuc-dev/it-job-analytics
cd job_aggregator
```

### 2. Khởi tạo môi trường ảo và cài đặt thư viện

Mở thư mục dự án bằng VS Code, mở cửa sổ Terminal (`Ctrl + ~`) và chạy các lệnh sau:

```bash
# Khởi tạo môi trường ảo độc lập
python -m venv .venv
# Nếu máy báo lỗi lệnh python, sử dụng: py -m venv .venv

# Kích hoạt môi trường ảo (Dành cho Windows)
.venv\Scripts\activate
# (Khi kích hoạt thành công, bạn sẽ thấy chữ (.venv) xuất hiện ở đầu dòng lệnh)

# Kích hoạt môi trường ảo (Dành cho macOS/Linux)
source .venv/bin/activate

# Cài đặt toàn bộ các thư viện bắt buộc từ tệp cấu hình
pip install -r requirements.txt
```

### 3. Cấu hình bảo mật API Key

Tại thư mục gốc của dự án, tạo một tệp tin mới đặt tên chính xác là `.env` (Nếu đã có sẵn từ trước, hãy mở tệp đó ra).

Điền mã cấu hình API Key cá nhân  vào tệp theo định dạng bảo mật dưới đây (không chứa dấu cách):

```
GEMINI_API_KEY=Nhập_Mã_API_Key_Gemini_Của_Bạn
SERPAPI_KEY=Nhập_Mã_SerpAPI_Của_Bạn
DATABASE_URL=sqlite:///job_database.db
SECRET_KEY=some_secret_key_123
FLASK_ENV=development
PORT=5000
```

### 4. Khởi chạy ứng dụng và nạp dữ liệu Pipeline

Đảm bảo Terminal đang đứng đúng thư mục dự án và môi trường ảo (`.venv`) đã được bật. Gõ trực tiếp lệnh sau để kích hoạt luồng tự động khởi tạo Database, thu thập dữ liệu và khởi động Server:

```bash
python run_pipeline.py
# Hoặc nếu máy cấu hình lệnh rút gọn: py run_pipeline.py
```

(Khuyến khích gõ lệnh trực tiếp bằng tay thay vì bấm nút Play/Run trên giao diện đồ họa để tránh tình trạng hệ thống gọi nhầm phiên bản Python gốc của máy tính).

Sau khi màn hình hiển thị thông báo hoàn tất chu trình ETL, mở trình duyệt web và truy cập địa chỉ: `http://127.0.0.1:5000` để sử dụng hệ thống Dashboard.

## 🛑 Cẩm Nang Xử Lý Lỗi Thường Gặp (Troubleshooting)

### Lỗi 1: `ModuleNotFoundError: No module named 'flask_cors'` (Hoặc các thư viện khác)

**Nguyên nhân:** Do bạn chạy ứng dụng khi chưa kích hoạt môi trường ảo `.venv`, hoặc VS Code tự ý gọi phiên bản Python gốc của hệ điều hành.

**Cách sửa:** Tắt Terminal cũ đi, mở một Terminal mới, gõ lệnh kích hoạt `.venv\Scripts\activate`. Nếu vẫn báo thiếu, hãy gõ lệnh ép cài đặt trực tiếp: `pip install flask-cors` rồi chạy lại file.

### Lỗi 2: Biểu đồ trống hoặc báo lỗi `500 Internal Server Error` khi mới tải trang

**Nguyên nhân:** Tệp cơ sở dữ liệu `job_database.db` mới được tạo trên môi trường sạch chưa có cấu trúc bảng hoặc chưa có dữ liệu tin tuyển dụng bên trong.

**Cách sửa:** Tắt Server Flask (`Ctrl + C`), chạy lệnh tổng `python run_pipeline.py` để kích hoạt cỗ máy cào dữ liệu hoạt động. Hệ thống lọc trùng thông minh sẽ quét qua, tự động loại bỏ các tin có URL trùng lặp để lưu trữ dữ liệu mới, sau đó các biểu đồ trên giao diện Dashboard sẽ tự khắc hiển thị số liệu mượt mà.
