import re
import json
import time
import os
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.models.job import Job
from dotenv import load_dotenv

# Khởi tạo API Key cho Gemini
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

def process_salary_pipeline(db: Session):
    """Phễu 2 tầng: Quét Regex trước, quét Gemini sau cho những job còn sót."""
    jobs_without_salary = db.query(Job).filter(Job.salary_min == None).all()
    if not jobs_without_salary:
        return {"status": "success", "message": "Tất cả công việc đã có mức lương."}

    print(f"[*] Đang xử lý lương cho {len(jobs_without_salary)} công việc...")
    
    # === TẦNG 1: QUÉT NHANH BẰNG REGEX ===
    pattern_usd_range = r'(?:\$|usd)?\s*(\d{3,4})\s*(?:-|đến|~|to)\s*(?:\$|usd)?\s*(\d{3,4})\b'
    pattern_vnd_range = r'(\d{1,3})\s*(?:-|đến|~|to)\s*(\d{1,3})\s*(?:triệu|tr\b|m\b|vnđ|vnd)'
    
    regex_updated = 0
    for job in jobs_without_salary:
        if not job.description: 
            continue
            
        desc = job.description.lower()
        
        match_usd = re.search(pattern_usd_range, desc)
        match_vnd = re.search(pattern_vnd_range, desc)
        
        if match_usd:
            job.salary_min = float(match_usd.group(1))
            job.salary_max = float(match_usd.group(2))
            regex_updated += 1
        elif match_vnd:
            job.salary_min = float(match_vnd.group(1)) * 40
            job.salary_max = float(match_vnd.group(2)) * 40
            regex_updated += 1

    db.commit()
    print(f" -> [Regex] Đã bóc tách siêu tốc được {regex_updated} công việc.")

    # === TẦNG 2: VÉT CẠN BẰNG GEMINI ===
    remaining_jobs = db.query(Job).filter(Job.salary_min == None).all()
    if not remaining_jobs or not model:
        return {"status": "success", "message": "Hoàn tất xử lý lương bằng Regex."}

    print(f" -> [Gemini] Đang dùng AI phân tích {len(remaining_jobs)} công việc còn lại (lương ẩn/phức tạp)...")
    gemini_updated = 0
    
    for job in remaining_jobs:
        if not job.description: 
            continue
            
        prompt = f"""Đọc mô tả và tìm lương. 1 Triệu VNĐ = 40 USD. Trả về JSON {{"min": số, "max": số}} hoặc {{"min": null, "max": null}}. KHÔNG GIẢI THÍCH.\n\nMô tả: {job.description}"""
        
        try:
            res = model.generate_content(prompt).text.strip()
            
            # Xử lý dọn dẹp chuỗi JSON nếu Gemini bọc trong markdown
            if res.startswith("```json"): 
                res = res[7:-3].strip()
            elif res.startswith("```"): 
                res = res[3:-3].strip()
            
            data = json.loads(res)
            
            if data.get("min") is not None and data.get("max") is not None:
                job.salary_min = float(data["min"])
                job.salary_max = float(data["max"])
                gemini_updated += 1
                
            db.commit()
            time.sleep(5) # Chống sập API Google
            
        except Exception as e:
            # Bỏ qua âm thầm nếu AI trả về sai định dạng
            pass 

    return {"status": "success", "message": f"Regex xử lý {regex_updated}, Gemini xử lý {gemini_updated}."}