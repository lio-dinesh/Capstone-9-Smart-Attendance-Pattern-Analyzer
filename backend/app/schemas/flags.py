from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

ReviewStatusType = Literal["Needs context", "Data issue", "Reviewed"]

class ReviewFlagItem(BaseModel):
    id: int
    flag_key: str
    category: str  # "Attendance Pattern" | "Data Quality"
    rule_name: str
    target_id: str
    period: str
    evidence: str
    threshold_description: str
    suggested_action: str
    status: ReviewStatusType
    reviewer_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ReviewActionRequest(BaseModel):
    status: ReviewStatusType
    reviewer_note: Optional[str] = Field(None, description="Contextual note explaining review conclusion")

class FlagsListResponse(BaseModel):
    total: int
    needs_context_count: int
    data_issue_count: int
    reviewed_count: int
    flags: List[ReviewFlagItem]
