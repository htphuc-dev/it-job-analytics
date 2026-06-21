from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base
from app.models.job_skill import job_skill

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    company = Column(String, index=True)
    location = Column(String, nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    url = Column(String, unique=True, index=True) 

    # --- BỔ SUNG 2 TRƯỜNG DỮ LIỆU MỚI TẠI ĐÂY ---
    # Nguồn cào dữ liệu (Mặc định là Adzuna)
    source = Column(String, default="Adzuna", index=True) 
    # Thời gian cào dữ liệu (Tự động lấy giờ hệ thống khi lưu)
    created_at = Column(DateTime, default=datetime.utcnow) 

    # Khai báo mối quan hệ n-n với bảng Skill
    skills = relationship("Skill", secondary=job_skill, back_populates="jobs")