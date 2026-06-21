import os
import time
import re
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.models.job import Job
from app.models.skill import Skill
from app.models.job_skill import job_skill
from dotenv import load_dotenv

# Tải cấu hình biến môi trường
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Khuyến nghị dùng gemini-1.5-flash để tốc độ cao và tránh lỗi 404
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# 1. BỘ TỪ ĐIỂN VÀ CHUẨN HÓA KỸ NĂNG
# Bộ lọc gom nhóm các từ khóa về 1 chuẩn duy nhất (Standardization)
SKILL_MAPPING = {
    "reactjs": "React", "react.js": "React", "react js": "React",
    "nodejs": "NodeJS", "node.js": "NodeJS", "node": "NodeJS",
    "vuejs": "VueJS", "vue.js": "VueJS", "vue": "VueJS",
    "angularjs": "Angular", "angular.js": "Angular",
    "golang": "Go", 
    "cpp": "C++", "c plus plus": "C++",
    "csharp": "C#", "c sharp": "C#",
    "k8s": "Kubernetes",
    "aws": "AWS", "amazon web services": "AWS",
    "gcp": "GCP", "google cloud": "GCP", "google cloud platform": "GCP",
    "ts": "TypeScript",
    "js": "JavaScript",
    "postgres": "PostgreSQL", "postgresql": "PostgreSQL",
    "mongo": "MongoDB", "mongodb": "MongoDB",
    "rn": "React Native", "react-native": "React Native"
}

# Kho từ vựng dự phòng (Fallback Dictionary) - Dành cho lúc Gemini gặp sự cố
TECH_DICTIONARY = [
    "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "Go", "Golang", "Ruby", "PHP", "Swift", "Kotlin", "Rust", "Dart",
    "React", "Angular", "Vue", "VueJS", "NodeJS", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "Laravel", "ASP.NET",
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Oracle", "SQL Server", "SQLite", "Cassandra",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Ansible", "Jenkins", "GitLab CI", "GitHub Actions",
    "Git", "Linux", "Bash", "Agile", "Scrum", "REST API", "GraphQL", "Kafka", "RabbitMQ", "HTML", "CSS", "Tailwind"
]


# 2. CÁC HÀM XỬ LÝ LÕI

def standardize_skills(raw_skills: list) -> list:
    """Xóa ký tự thừa, làm sạch và gom nhóm các kỹ năng giống nhau."""
    standardized = set()
    for skill in raw_skills:
        # Xóa các ký tự đặc biệt thừa (chỉ giữ lại chữ, số và các dấu +- . #)
        skill_clean = re.sub(r'[^a-zA-Z0-9\+\#\-\.\s]', '', str(skill)).strip()
        if not skill_clean:
            continue
            
        lower_skill = skill_clean.lower()
        
        # Áp dụng bộ lọc gom nhóm
        if lower_skill in SKILL_MAPPING:
            standardized.add(SKILL_MAPPING[lower_skill])
        else:
            # Nếu không có trong danh sách chuẩn hóa, giữ nguyên chữ gốc (VD: Python)
            # Chỉ viết hoa chữ cái đầu cho đẹp
            standardized.add(skill_clean.title() if len(skill_clean) > 2 else skill_clean.upper())
            
    return list(standardized)

def fallback_extract(description: str) -> list:
    """Thuật toán quét từ vựng dự phòng cực nhanh không cần AI."""
    found_skills = set()
    desc_lower = description.lower()
    for tech in TECH_DICTIONARY:
        # Dùng Regex để tìm chính xác từ (tránh việc chữ "go" bị nhầm trong "good")
        pattern = r'\b' + re.escape(tech.lower()) + r'\b'
        if re.search(pattern, desc_lower):
            found_skills.add(tech)
    return standardize_skills(list(found_skills))

def extract_skills_from_text(description: str) -> list:
    """Gọi Gemini để nhặt kỹ năng theo prompt khắt khe."""
    if not description:
        return []
        
    if model:
        try:
            # Prompt siêu nâng cấp ép Gemini nhả data chuẩn
            prompt = f"""
            Bạn là một hệ thống Trích xuất Dữ liệu (Data Extractor) chuyên ngành IT.
            Nhiệm vụ của bạn là đọc đoạn Mô tả công việc dưới đây và lọc ra CÁC KỸ NĂNG CÔNG NGHỆ.
            
            QUY TẮC NGHIÊM NGẶT CẦN TUÂN THỦ:
            1. CHỈ trích xuất Kỹ năng cứng (Ngôn ngữ lập trình, Frameworks, Databases, Tools, Cloud).
            2. TUYỆT ĐỐI BỎ QUA Kỹ năng mềm (Giao tiếp, làm việc nhóm, tiếng Anh, Agile, bằng cấp...).
            3. KHÔNG viết câu trả lời, KHÔNG giải thích.
            4. KẾT QUẢ TRẢ VỀ DUY NHẤT LÀ MỘT DANH SÁCH TÊN CÔNG NGHỆ CÁCH NHAU BẰNG DẤU PHẨY.
            Ví dụ mẫu: Python, React, PostgreSQL, Docker, AWS
            
            Mô tả công việc:
            {description}
            """
            response = model.generate_content(prompt)
            raw_skills = response.text.split(',')
            skills = [s.strip() for s in raw_skills if s.strip()]
            return standardize_skills(skills)
            
        except Exception as e:
            print(f"[!] Lỗi kết nối Gemini API: {e}. Kích hoạt quét từ vựng dự phòng...")
            return fallback_extract(description)
    else:
        return fallback_extract(description)


# 3. LUỒNG CHẠY CHÍNH ĐƯỢC TỰ ĐỘNG HÓA


def process_job_skills_extraction(db: Session):
    """Quét Database, tìm job chưa bóc tách và nạp vào máy AI."""
    # SỬA Ở ĐÂY: Dùng job_skill và .c.job_id
    unextracted_jobs = db.query(Job).outerjoin(job_skill).filter(job_skill.c.job_id == None).all()
    
    if not unextracted_jobs:
        return {"status": "success", "message": "Tất cả công việc đã được AI xử lý trước đó. Không có việc làm mới."}
        
    processed_count = 0
    total_jobs = len(unextracted_jobs)
    
    print(f"[*] AI bắt đầu đọc {total_jobs} tin tuyển dụng...")
    
    for job in unextracted_jobs:
        skills_list = extract_skills_from_text(job.description)
        
        for skill_name in skills_list:
            skill_obj = db.query(Skill).filter(Skill.name == skill_name).first()
            
            if not skill_obj:
                skill_obj = Skill(name=skill_name)
                db.add(skill_obj)
                db.commit() 
                
            # SỬA Ở ĐÂY: Logic check và insert cho Table job_skill
            existing_link = db.query(job_skill).filter(
                job_skill.c.job_id == job.id, 
                job_skill.c.skill_id == skill_obj.id
            ).first()
            
            if not existing_link:
                # Dùng db.execute để insert vào bảng trung gian
                db.execute(job_skill.insert().values(job_id=job.id, skill_id=skill_obj.id))
            
        processed_count += 1
        db.commit()
        
        print(f" -> Đã xử lý {processed_count}/{total_jobs} (ID: {job.id}) | Tìm thấy: {', '.join(skills_list) if skills_list else 'Trống'}")
        
        time.sleep(5)
        
    return {"status": "success", "message": f"Gemini đã bóc tách thành công kỹ năng cho {processed_count} công việc."}