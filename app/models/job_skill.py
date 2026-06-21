from sqlalchemy import Column, Integer, ForeignKey, Table
from app.database.db import Base

# Đây là Table trung gian liên kết Job và Skill (Mối quan hệ n-n)
job_skill = Table(
    "job_skills",
    Base.metadata,
    Column("job_id", Integer, ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
)