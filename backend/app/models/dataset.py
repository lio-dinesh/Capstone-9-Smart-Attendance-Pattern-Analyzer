from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    source_type = Column(String(50), nullable=False)  # 'synthetic_demo', 'csv_upload'
    total_expected_sessions = Column(Integer, default=0)
    total_recorded_records = Column(Integer, default=0)
    total_students = Column(Integer, default=0)
    date_range_start = Column(String(10), nullable=True)
    date_range_end = Column(String(10), nullable=True)
    loaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
