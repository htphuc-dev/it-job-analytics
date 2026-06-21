from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.db import Base
from app.models.job_skill import job_skill

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    # Khai báo mối quan hệ n-n ngược lại với bảng Job
    jobs = relationship("Job", secondary=job_skill, back_populates="skills")