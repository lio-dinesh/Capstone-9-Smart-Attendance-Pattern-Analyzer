from pydantic import BaseModel
from typing import Optional, List, Any

class ApiResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None

class PaginatedMeta(BaseModel):
    page: int
    page_size: int
    total_records: int
    total_pages: int

class FilterParams(BaseModel):
    course_code: Optional[str] = None
    section: Optional[str] = None
    date_start: Optional[str] = None
    date_end: Optional[str] = None
