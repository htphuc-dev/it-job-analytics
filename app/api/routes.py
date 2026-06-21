from flask import Blueprint, jsonify, request
from app.database.db import SessionLocal
from app.models.job import Job
from app.services.analyzer import (
    get_top_skills, 
    get_salary_by_skill,
    get_jobs_by_location,
    get_jobs_by_source
)

# Khởi tạo Blueprint
api_bp = Blueprint('api', __name__)

def get_db():
    return SessionLocal()


# 1. API LẤY DANH SÁCH VIỆC LÀM (CÓ TÌM KIẾM, LỌC & PHÂN TRANG)

@api_bp.route('/jobs', methods=['GET'])
def get_all_jobs():
    db = get_db()
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 15, type=int)
        search = request.args.get('search', '', type=str)
        location = request.args.get('location', '', type=str)
        min_salary = request.args.get('min_salary', type=float)
        
        offset = (page - 1) * limit
        
        # Khởi tạo query cơ bản
        query = db.query(Job)
        
        # Áp dụng bộ lọc nếu có
        if search:
            query = query.filter(Job.title.ilike(f'%{search}%') | Job.company.ilike(f'%{search}%'))
        if location:
            query = query.filter(Job.location.ilike(f'%{location}%'))
        if min_salary:
            query = query.filter(Job.salary_max >= min_salary) # Công ty có max_salary >= mức yêu cầu
            
        total_jobs = query.count()
        jobs = query.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()

        jobs_list = []
        for job in jobs:
            jobs_list.append({
                "id": job.id, 
                "title": job.title, 
                "company": job.company,
                "location": job.location, 
                "salary_min": job.salary_min,
                "salary_max": job.salary_max, 
                "source": job.source,
                "url": job.url,
                "description": job.description, # Thêm mô tả để hiện vào Modal
                "created_at": job.created_at.strftime("%Y-%m-%d") if job.created_at else None
            })

        total_pages = (total_jobs + limit - 1) // limit if limit > 0 else 1
        return jsonify({
            "status": "success", 
            "pagination": {"total_records": total_jobs, "current_page": page, "total_pages": total_pages, "limit": limit}, 
            "data": jobs_list
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()
# 2. API THỐNG KÊ (CẤP DỮ LIỆU CHO 4 BIỂU ĐỒ DASHBOARD)

@api_bp.route('/stats/top-skills', methods=['GET'])
def get_stats_top_skills():
    db = get_db()
    try:
        limit = request.args.get('limit', 10, type=int)
        result = get_top_skills(db, limit=limit)
        return jsonify({"status": "success", "count": len(result), "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()

@api_bp.route('/stats/salary-trends', methods=['GET'])
def get_stats_salary_trends():
    db = get_db()
    try:
        result = get_salary_by_skill(db)
        return jsonify({"status": "success", "count": len(result), "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()

@api_bp.route('/stats/locations', methods=['GET'])
def get_stats_locations():
    db = get_db()
    try:
        limit = request.args.get('limit', 5, type=int)
        result = get_jobs_by_location(db, limit=limit)
        return jsonify({"status": "success", "count": len(result), "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()

@api_bp.route('/stats/sources', methods=['GET'])
def get_stats_sources():
    db = get_db()
    try:
        limit = request.args.get('limit', 5, type=int)
        result = get_jobs_by_source(db, limit=limit)
        return jsonify({"status": "success", "count": len(result), "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()