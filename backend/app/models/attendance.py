from sqlalchemy import Column, Integer, String, Boolean, DateTime, UniqueConstraint
from datetime import datetime, timezone
from backend.app.core.database import Base

class ExpectedSession(Base):
    __tablename__ = "expected_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_key = Column(String(50), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    session_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    course_code = Column(String(50), nullable=False, index=True)
    section = Column(String(50), nullable=False, index=True)
    timetable_slot = Column(String(50), nullable=False)
    session_held = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint('student_key', 'session_id', name='uq_expected_student_session'),
    )

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_key = Column(String(50), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)  # PRESENT, ABSENT, LATE, EXCUSED
    recorded_at = Column(String(30), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Note: We do not enforce strict database unique constraint here so import validation can inspect duplicate anomalies
