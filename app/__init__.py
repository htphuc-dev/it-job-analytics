from flask import Flask
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from app.database.db import Base, engine, SessionLocal
from app.services.collector import collect_and_save_jobs
from app.services.extractor import process_job_skills_extraction

def automated_pipeline():
    """Tiến trình ngầm: Tự động cào dữ liệu và bóc tách AI"""
    print("[Cronjob] Bắt đầu tiến trình tự động cập nhật hệ thống...")
    db = SessionLocal()
    try:
        collect_and_save_jobs(db, keyword="Python")
        collect_and_save_jobs(db, keyword="React")
        process_job_skills_extraction(db)
        print("[Cronjob] Tiến trình tự động hoàn tất!")
    except Exception as e:
        print(f"[Cronjob] Lỗi hệ thống ngầm: {e}")
    finally:
        db.close()

def create_app():
    """Hàm Factory khởi tạo toàn bộ ứng dụng"""
    # 1. Khởi tạo Database (tạo bảng nếu chưa có)
    Base.metadata.create_all(bind=engine)

    # 2. Khởi tạo Flask & CORS
    app = Flask(__name__)
    CORS(app)

    # 3. Đăng ký luồng API từ file routes.py
    from app.api.routes import api_bp
    app.register_blueprint(api_bp)

    # 4. Khởi tạo và chạy bộ lập lịch ngầm
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=automated_pipeline, trigger="interval", hours=12)
    scheduler.start()

    return app