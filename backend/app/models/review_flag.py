from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class ReviewFlag(Base):
    __tablename__ = "review_flags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    flag_key = Column(String(150), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # 'Attendance Pattern' | 'Data Quality'
    rule_name = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=False, index=True)  # student_key or course-section
    period = Column(String(100), nullable=False)
    evidence = Column(Text, nullable=False)  # JSON or descriptive text
    threshold_description = Column(String(200), nullable=False)
    suggested_action = Column(String(255), nullable=False)
    status = Column(String(50), default="Needs context", nullable=False, index=True)  # 'Needs context', 'Data issue', 'Reviewed'
    reviewer_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
