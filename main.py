from flask import Flask, render_template
from app.api.routes import api_bp

# Khởi tạo ứng dụng Flask
app = Flask(__name__)

# Đăng ký các đường link API với tiền tố /api
app.register_blueprint(api_bp, url_prefix='/api')

# Đường link mặc định (Trang chủ Dashboard)
@app.route('/')
def home():
    # Render ra file index.html nằm trong thư mục templates
    return render_template('index.html')

if __name__ == '__main__':
    print(" FLASK SERVER ĐANG KHỞI ĐỘNG ")
    print(" Mở trình duyệt và truy cập: http://127.0.0.1:5000")
    # Chạy server ở chế độ debug để tự động cập nhật khi sửa code
    app.run(debug=True, port=5000)