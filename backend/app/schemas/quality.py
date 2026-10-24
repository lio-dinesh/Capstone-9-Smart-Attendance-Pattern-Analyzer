from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class DataQualityIssueItem(BaseModel):
    issue_type: str  # "Duplicate Key", "Missing Expected", "Invalid Status", "Orphan Record", "Invalid Date"
    severity: str  # "high", "medium", "low"
    target_identifier: str  # e.g. "SES-CS101-SEC-A-W02-1" or "STU-0099"
    description: str
    affected_rows: int
    system_action: str  # "Excluded from metrics", "Flagged as missing", "Auto-deduplicated"

class DataQualityReport(BaseModel):
    total_expected_records: int
    total_recorded_records: int
    valid_matched_records: int
    missing_expected_count: int
    duplicate_count: int
    invalid_status_count: int
    invalid_date_count: int
    orphan_record_count: int
    record_completeness_pct: float
    completeness_status: str
    breakdown_by_course: List[Dict[str, Any]]
    issues_list: List[DataQualityIssueItem]

class ImportValidationPreview(BaseModel):
    valid: bool
    expected_rows_count: int
    recorded_rows_count: int
    duplicate_rows_count: int
    invalid_status_rows_count: int
    missing_sessions_detected: int
    warnings: List[str]
    errors: List[str]
    sample_preview: List[Dict[str, Any]]
