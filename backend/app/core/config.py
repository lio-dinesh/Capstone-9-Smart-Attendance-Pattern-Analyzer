import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Attendance Pattern Analyzer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database Configuration (falls back to built-in SQLite when no external DB is configured)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./attendance.db"
    )
    
    # Anomaly Rule Thresholds
    CONSECUTIVE_ABSENCE_THRESHOLD: int = 3
    ATTENDANCE_DROP_THRESHOLD_PCT: float = 15.0
    BASELINE_WEEKS: int = 4
    CURRENT_WINDOW_WEEKS: int = 2
    MIN_SESSIONS_FOR_DROP_ANALYSIS: int = 4
    MIN_COMPLETENESS_FOR_DROP_ANALYSIS_PCT: float = 80.0
    MISSING_RECORD_THRESHOLD_PCT: float = 10.0
    PROVISIONAL_COMPLETENESS_THRESHOLD_PCT: float = 85.0
    
    # Attendance Policy
    LATE_ATTENDANCE_WEIGHT: float = 1.0  # Configurable: 1.0 (counted), 0.5 (half), 0.0 (unattended)
    EXCLUDE_EXCUSED_FROM_DENOMINATOR: bool = True
    
    # Paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    DATA_DIR: str = os.path.join(BASE_DIR, '..', 'data')

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'),
        env_file_encoding='utf-8',
        extra='ignore'
    )

settings = Settings()
