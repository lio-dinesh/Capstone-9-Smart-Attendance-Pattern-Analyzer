from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

AttendanceStatusType = Literal["PRESENT", "ABSENT", "LATE", "EXCUSED", "MISSING"]

class AttendanceRecordBase(BaseModel):
    student_key: str
    session_id: str
    status: AttendanceStatusType
    recorded_at: Optional[str] = None

class AttendanceRecordUpdate(BaseModel):
    status: Literal["PRESENT", "ABSENT", "LATE", "EXCUSED"]
    reviewer_note: Optional[str] = Field(None, description="Reason for manual status amendment")

class ReconciledRecordItem(BaseModel):
    id: Optional[int] = None
    student_key: str
    session_id: str
    session_date: str
    course_code: str
    section: str
    timetable_slot: str
    session_held: bool
    status: AttendanceStatusType
    recorded_at: Optional[str] = None
    is_missing: bool
    reconciliation_status: str

class RecordTableResponse(BaseModel):
    records: list[ReconciledRecordItem]
    total: int
    page: int
    page_size: int
    total_pages: int
