import pytest
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.models.review_flag import ReviewFlag
from backend.app.services.flag_engine import detect_anomaly_flags

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    yield db
    db.close()

def test_consecutive_absence_streak_trigger(test_db):
    # STU-001 has 3 consecutive absences
    df_reconciled = pd.DataFrame({
        "student_key": ["STU-001"] * 5,
        "session_id": [f"SES-{i}" for i in range(1, 6)],
        "session_date": ["2026-09-07", "2026-09-09", "2026-09-11", "2026-09-14", "2026-09-16"],
        "course_code": ["CS101"] * 5,
        "section": ["SEC-A"] * 5,
        "timetable_slot": ["08:30-10:00"] * 5,
        "session_held": [1, 1, 1, 1, 1],
        "status": ["PRESENT", "ABSENT", "ABSENT", "ABSENT", "PRESENT"],
        "is_missing": [False] * 5,
        "reconciliation_status": ["Recorded: PRESENT"] + ["Recorded: ABSENT"] * 3 + ["Recorded: PRESENT"]
    })

    flags = detect_anomaly_flags(df_reconciled, audit_summary={}, db=test_db)
    streak_flags = [f for f in flags if f.flag_key == "FLAG-STREAK-STU-001"]
    assert len(streak_flags) == 1
    assert "3 consecutive unexcused absences" in streak_flags[0].evidence
    assert streak_flags[0].category == "Attendance Pattern"
    assert streak_flags[0].status == "Needs context"

def test_flag_review_status_preservation_across_sync(test_db):
    # Initial trigger
    df_reconciled = pd.DataFrame({
        "student_key": ["STU-001"] * 3,
        "session_id": [f"SES-{i}" for i in range(1, 4)],
        "session_date": ["2026-09-07", "2026-09-09", "2026-09-11"],
        "course_code": ["CS101"] * 3,
        "section": ["SEC-A"] * 3,
        "timetable_slot": ["08:30-10:00"] * 3,
        "session_held": [1, 1, 1],
        "status": ["ABSENT", "ABSENT", "ABSENT"],
        "is_missing": [False] * 3,
        "reconciliation_status": ["Recorded: ABSENT"] * 3
    })

    detect_anomaly_flags(df_reconciled, audit_summary={}, db=test_db)
    
    # Reviewer marks the flag as "Reviewed" with custom notes
    flag = test_db.query(ReviewFlag).filter(ReviewFlag.flag_key == "FLAG-STREAK-STU-001").first()
    assert flag is not None
    flag.status = "Reviewed"
    flag.reviewer_note = "Spoke with student mentor; transit card was expired and now resolved."
    test_db.commit()

    # Data recalculated/re-synced
    detect_anomaly_flags(df_reconciled, audit_summary={}, db=test_db)

    # Status and note MUST BE preserved!
    reloaded_flag = test_db.query(ReviewFlag).filter(ReviewFlag.flag_key == "FLAG-STREAK-STU-001").first()
    assert reloaded_flag.status == "Reviewed"
    assert "transit card was expired" in reloaded_flag.reviewer_note
