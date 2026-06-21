import subprocess
import time
from app.database.db import SessionLocal, Base, engine

# Gọi chuẩn xác các module từ thư mục services
from app.services.collector import start_crawl
from app.services.salary_extractor import process_salary_pipeline
from app.services.extractor import process_job_skills_extraction
from app.services.analyzer import get_top_skills

def print_header(title):
    print("\n" + "="*70)
    print(f"🚀 {title}")
    print("="*70 + "\n")

def run_full_system():
    print_header("KHỞI ĐỘNG HỆ THỐNG AUTOMATION PIPELINE TOÀN DIỆN")
    start_time = time.time()
    db = SessionLocal()

    try:
        # [BƯỚC 1] Khởi tạo Database
        print_header("[BƯỚC 1] KIỂM TRA/TẠO DATABASE")
        Base.metadata.create_all(bind=engine)
        print(" -> Đã kết nối Database thành công. Sẵn sàng xử lý dữ liệu.")

        # [BƯỚC 2] Thu thập dữ liệu việc làm (Google Jobs)
        print_header("[BƯỚC 2] THU THẬP DỮ LIỆU TỪ GOOGLE JOBS")
        # 🌟 ĐÃ SỬA LỖI CHÍNH TẢ TẠI ĐÂY:
        start_crawl(db)

        # [BƯỚC 3] Xử lý lương (Phễu 2 tầng: Regex quét nhanh, Gemini quét vét)
        print_header("[BƯỚC 3] CHUẨN HÓA MỨC LƯƠNG (REGEX + AI)")
        process_salary_pipeline(db)

        # [BƯỚC 4] Trích xuất kỹ năng bằng Gemini + Regex dự phòng
        print_header("[BƯỚC 4] TRÍCH XUẤT KỸ NĂNG (SKILLS) BẰNG GEMINI")
        process_job_skills_extraction(db)

        # [BƯỚC 5] Phân tích dữ liệu và tạo thống kê
        print_header("[BƯỚC 5] PHÂN TÍCH DỮ LIỆU & BÁO CÁO THỐNG KÊ")
        top_skills = get_top_skills(db, limit=5)
        print("🔥 BẢNG XẾP HẠNG TOP 5 KỸ NĂNG YÊU CẦU NHIỀU NHẤT:")
        for rank, s in enumerate(top_skills, 1):
            print(f"   {rank}. {s['skill']:<15} - Tần suất: {s['count']} công việc")

    except Exception as e:
        print(f"\n❌ Lỗi hệ thống trong quá trình ETL: {e}")
    finally:
        # Bắt buộc đóng kết nối DB để giải phóng file SQLite trước khi chạy Flask
        db.close() 

    # Tính toán thời gian chạy toàn hệ thống
    end_time = time.time()
    minutes = int((end_time - start_time) // 60)
    seconds = int((end_time - start_time) % 60)
    print(f"\n✅ HOÀN TẤT CHU TRÌNH XỬ LÝ TỰ ĐỘNG TRONG {minutes} PHÚT {seconds} GIÂY!")

    # [BƯỚC 6] Khởi động Flask Dashboard
    print_header("[BƯỚC 6] KHỞI ĐỘNG FLASK DASHBOARD SERVER")
    print("👉 Trình duyệt web của bạn sẽ hoạt động tại: http://127.0.0.1:5000\n")
    
    try:
        # Mở server Flask, tự động chặn tiến trình cho đến khi bạn bấm Ctrl+C
        subprocess.run(["python", "main.py"])
    except KeyboardInterrupt:
        print("\n🛑 Đã tắt Server an toàn.")

if __name__ == "__main__":
    run_full_system()