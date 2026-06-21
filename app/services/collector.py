import os
import requests
from sqlalchemy.orm import Session
from app.models.job import Job
from dotenv import load_dotenv
import time

# Tải biến môi trường
load_dotenv()

def get_mock_jobs(keyword: str):
    """Dữ liệu dự phòng trong trường hợp gọi API thật thất bại"""
    return [
        {
            "title": f"Senior {keyword} Developer",
            "company": "Tech Innovators VN",
            "location": "Hà Nội",
            "salary_min": 1500.0,
            "salary_max": 2500.0,
            "description": f"Yêu cầu kinh nghiệm {keyword}, FastAPI, PostgreSQL. Biết hệ thống tự động hóa là lợi thế.",
            "url": f"https://example.com/job/mock-1-{keyword}",
            "source": "Mock Data"
        },
        {
            "title": f"Data Engineer ({keyword}/SQL)",
            "company": "DataCorp",
            "location": "Hồ Chí Minh",
            "salary_min": 1200.0,
            "salary_max": 2000.0,
            "description": f"Cần tuyển Data Engineer rành {keyword}, ETL pipelines, ưu tiên ứng viên biết dùng pandas.",
            "url": f"https://example.com/job/mock-2-{keyword}",
            "source": "Mock Data"
        }
    ]

# 1. Thêm tham số location_name vào hàm fetch
def fetch_jobs_from_api(keyword: str = "IT", location_name: str = "Vietnam", start: int = 0):
    SERPAPI_KEY = os.getenv("SERPAPI_KEY")
    
    if not SERPAPI_KEY:
        print("[*] Cảnh báo: Chưa cấu hình SERPAPI_KEY.")
        return []

    try:
        url = "https://serpapi.com/search"
        params = {
            "engine": "google_jobs",
            "q": keyword,          # Dùng keyword nguyên bản
            "location": location_name, # ĐÃ SỬA: Dùng biến địa điểm truyền vào
            "google_domain": "google.com.vn",
            "gl": "vn",
            "hl": "vi",
            "start": start,
            "api_key": SERPAPI_KEY
        }
        
        response = requests.get(url, params=params, timeout=45)
        response.raise_for_status()
        data = response.json()
        
        if "error" in data:
            return []

        jobs_array = data.get("jobs_results", [])
        if len(jobs_array) == 0:
            return []

        job_results = []
        for item in jobs_array:
            description = item.get("description", "")
            if isinstance(description, list):
                description = "\n".join(description)
                
            related_links = item.get("related_links", [])
            job_url = related_links[0].get("link") if related_links else item.get("share_link", "")

            raw_source = item.get("via", "Google Jobs")
            clean_source = raw_source.replace("via ", "") if isinstance(raw_source, str) else "Google Jobs"
                
            job_results.append({
                "title": item.get("title", "Không rõ tiêu đề"),
                "company": item.get("company_name", "Không rõ công ty"),
                "location": item.get("location", location_name), # Cập nhật vị trí lưu
                "salary_min": None, 
                "salary_max": None,
                "description": description,
                "url": job_url,
                "source": clean_source
            })
            
        return job_results
        
    except Exception as e:
        print(f"[*] Lỗi kết nối Google Jobs API: {e}")
        return []

# 2. Truyền location_name từ hàm save xuống hàm fetch
def collect_and_save_jobs(db: Session, keyword: str = "IT", location_name: str = "Vietnam", start: int = 0):
    raw_jobs = fetch_jobs_from_api(keyword, location_name, start) 
    saved_count = 0

    for job_data in raw_jobs:
        if not job_data["url"]: 
            continue
            
        existing_job = db.query(Job).filter(Job.url == job_data["url"]).first()

        if not existing_job:
            new_job = Job(
                title=job_data["title"],
                company=job_data["company"],
                location=job_data["location"],
                salary_min=job_data["salary_min"],
                salary_max=job_data["salary_max"],
                description=job_data["description"],
                url=job_data["url"],
                source=job_data.get("source", "Google Jobs") 
            )
            db.add(new_job)
            saved_count += 1

    db.commit() 
    if saved_count > 0:
        print(f"[*] Đã lưu mới {saved_count} việc làm.")
    return {"status": "success", "message": f"Đã thu thập và lưu mới {saved_count} công việc."}

def start_crawl(db):
    """
    Hàm bao tổng hợp được gọi từ run_pipeline.py
    Tự động quét qua các tổ hợp từ khóa và địa điểm để nạp dữ liệu sạch.
    """
    print("\n[*] BẮT ĐẦU CHU TRÌNH CÀO DỮ LIỆU TỰ ĐỘNG TỪ GOOGLE JOBS...")
    
    keywords = [
        "Software Engineer",
        "Backend Developer",
        "Frontend Developer",
        "Full Stack Developer",
        "Data Engineer",
        "DevOps Engineer",
        "QA Engineer",
        "Business Analyst",
        "Mobile Developer",
        "Project Manager",
        "Junior",
        "Senior ",
    ]
    
    locations = [
        "Ho Chi Minh City, Vietnam",
        "HaNoi, Vietnam",
        "Da Nang, Vietnam"
    ]
    
    # Thực hiện vòng lặp quét chéo đa chiều (Matrix Crawl)
    for kw in keywords:
        for loc in locations:
            print(f" -> Đang tiến hành quét: Từ khóa '{kw}' | Khu vực '{loc}'...")
            try:
                # Gọi hàm lưu dữ liệu gốc
                result = collect_and_save_jobs(db, keyword=kw, location_name=loc, start=0)
                
                # In kết quả trả về từ hàm collect_and_save_jobs
                print(f"    + {result.get('message', 'Thành công')}")
                
            except Exception as e:
                # Bọc try-except ở đây để lỡ 1 keyword bị API từ chối, hệ thống vẫn chạy tiếp
                print(f"    [!] Bỏ qua do lỗi khi quét nhóm ({kw} - {loc}): {e}")
                continue
            
            # Tính năng bảo vệ: Nghỉ 2 giây sau mỗi lần cào để tránh bị SerpAPI khóa do spam
            time.sleep(2)
                
    print("\n[*] KẾT THÚC CHU TRÌNH CÀO DỮ LIỆU TỪ GOOGLE JOBS HOÀN HẢO!")