# 📊 Hệ Thống Phân Tích Việc Làm IT (IT Job Analytics)

Đồ án tốt nghiệp / Bài tập lớn xây dựng hệ thống tự động thu thập (Web Crawling), bóc tách dữ liệu thông minh và trực quan hóa các xu hướng công nghệ, thị trường lương thưởng ngành Công nghệ thông tin.

## 🚀 Các Tính Năng Chính Của Hệ Thống

* **Dashboard Tổng Quan (Trang 1)**: Cập nhật thời gian thực tổng số việc làm, kỹ năng đã quét, lương trung bình toàn thị trường, và tích hợp 3 biểu đồ trực quan (Cơ cấu khu vực, Nguồn dữ liệu gốc, Top kỹ năng hot).
* **Khám Phá Việc Làm (Trang 2)**: Kho dữ liệu việc làm gốc tích hợp bộ lọc tìm kiếm nâng cao (Vị trí, Khu vực, Lương), phân trang mượt mà và cửa sổ hiển thị chi tiết JD (Modal).
* **Phân Tích Kỹ Năng IT (Trang 3)**: Trực quan hóa mức độ phổ biến bằng biểu đồ cột ngang, Đám mây từ khóa sinh động (Word Cloud), biểu đồ lưới nhện Cán cân công nghệ (Tech Stack) và biểu đồ Đường đua công nghệ theo chuỗi thời gian.
* **Phân Tích Lương Chuyên Sâu (Trang 4)**: Cung cấp 5 góc nhìn phân tích lương (Top kỹ năng thu nhập cao, Tỷ lệ việc làm, Phân bố mức lương theo cấp bậc Box Plot, Mật độ tập trung Histogram và Độ rộng dải lương Scatter). Hỗ trợ chuyển đổi đơn vị USD / VNĐ thông minh.
* **Bản Đồ Tuyển Dụng (Trang 5)**: Biểu đồ bánh phân tích quy mô việc làm theo thành phố. Tích hợp tính năng tương tác click chuột vào vùng miền để lọc Bảng phong thần các công ty tuyển dụng hàng đầu.
* **Xu Hướng Thị Trường (Trang 6)**: Theo dõi lưu lượng tin đăng tuyển mới (Line Chart) và biểu đồ cột chồng (Stacked Bar Chart) phân tích diễn biến dịch chuyển cơ cấu Tech Stack theo ngày.
* **Quản Trị Hệ Thống (Trang 7)**: Bảng điều khiển admin kiểm tra trạng thái kết nối Database (SQLite), Server (Flask) và hướng dẫn thực thi chuỗi công cụ Automation Pipeline (ETL).

## 🛠️ Hướng Dẫn Cài Đặt 

### 1. Tải mã nguồn về máy local
```bash
git clone <Đường_Link_GitHub_Của_Bạn>
cd job_aggregator