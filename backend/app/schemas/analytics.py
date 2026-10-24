from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class KpiSummary(BaseModel):
    overall_attendance_rate: Optional[float] = None
    rate_status_label: str  # "Normal", "Provisional (Low Completeness)"
    completeness_rate: float
    total_expected_sessions_held: int
    total_recorded_valid: int
    missing_entries: int
    active_flags_count: int
    baseline_delta_pct: Optional[float] = None
    comparison_period_label: str
    status_counts: Dict[str, int]  # PRESENT, ABSENT, LATE, EXCUSED, MISSING

class TrendPoint(BaseModel):
    period: str  # e.g., "W01 (Sep 07)", "2026-W37"
    date_start: str
    attendance_rate: Optional[float] = None
    completeness_rate: float
    expected_count: int
    attended_count: int
    absent_count: int
    late_count: int
    excused_count: int
    missing_count: int

class TrendsResponse(BaseModel):
    granularity: str  # "weekly" | "monthly"
    points: List[TrendPoint]
    comparison_baseline_rate: Optional[float] = None

class HeatmapCell(BaseModel):
    weekday: str  # Monday, Tuesday, Wednesday, Thursday, Friday
    timetable_slot: str  # e.g. "08:30-10:00"
    attendance_rate: Optional[float] = None
    total_held: int
    attended_count: int
    absent_count: int
    sample_size: int

class PatternsResponse(BaseModel):
    weekday_distribution: List[Dict[str, Any]]
    slot_distribution: List[Dict[str, Any]]
    timetable_heatmap: List[HeatmapCell]
    detected_friction_notes: List[str]

class CourseComparisonItem(BaseModel):
    course_code: str
    section: str
    attendance_rate: Optional[float] = None
    completeness_rate: float
    expected_sessions_held: int
    recorded_sessions: int
    missing_count: int
    status_counts: Dict[str, int]
    is_provisional: bool

class CourseComparisonResponse(BaseModel):
    courses: List[CourseComparisonItem]
