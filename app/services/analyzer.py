from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.job import Job
from app.models.skill import Skill
from app.models.job_skill import job_skill

def get_top_skills(db: Session, limit: int = 10):
    """Thống kê top các kỹ năng được yêu cầu nhiều nhất"""
    results = (
        db.query(Skill.name, func.count(job_skill.c.job_id).label('job_count'))
        .join(job_skill, Skill.id == job_skill.c.skill_id)
        .group_by(Skill.name)
        .order_by(desc('job_count'))
        .limit(limit)
        .all()
    )
    return [{"skill": r.name, "count": r.job_count} for r in results]

def get_salary_by_skill(db: Session):
    """Tính toán mức lương trung bình cho từng kỹ năng"""
    valid_jobs = db.query(Job).filter(Job.salary_min != None, Job.salary_max != None).subquery()
    
    results = (
        db.query(
            Skill.name, 
            func.avg((valid_jobs.c.salary_min + valid_jobs.c.salary_max) / 2).label('avg_salary'),
            func.count(valid_jobs.c.id).label('sample_size')
        )
        .join(job_skill, Skill.id == job_skill.c.skill_id)
        .join(valid_jobs, valid_jobs.c.id == job_skill.c.job_id)
        .group_by(Skill.name)
        .having(func.count(valid_jobs.c.id) > 0) 
        .order_by(desc('avg_salary'))
        .all()
    )
    
    return [
        {
            "skill": r.name, 
            "average_salary": round(r.avg_salary, 2),
            "data_samples": r.sample_size
        } 
        for r in results
    ]


# CÁC HÀM BỔ SUNG CHO DASHBOARD

def get_jobs_by_location(db: Session, limit: int = 5):
    """Thống kê số lượng việc làm theo từng thành phố/địa điểm"""
    results = (
        db.query(Job.location, func.count(Job.id).label('job_count'))
        .filter(Job.location != None)
        .group_by(Job.location)
        .order_by(desc('job_count'))
        .limit(limit)
        .all()
    )
    return [{"location": r.location, "count": r.job_count} for r in results]

def get_jobs_by_source(db: Session, limit: int = 5):
    """Thống kê tỷ trọng nguồn cào dữ liệu (TopCV, ITviec, v.v.) để vẽ biểu đồ Doughnut"""
    results = (
        db.query(Job.source, func.count(Job.id).label('job_count'))
        .filter(Job.source != None)
        .group_by(Job.source)
        .order_by(desc('job_count'))
        .limit(limit)
        .all()
    )
    return [{"source": r.source, "count": r.job_count} for r in results]