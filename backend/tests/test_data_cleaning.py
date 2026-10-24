import pytest
import pandas as pd
from backend.app.services.data_cleaner import clean_and_audit_data

def test_missing_mandatory_headers_raises_error():
    df_exp_bad = pd.DataFrame({"student_key": ["STU-001"]})
    df_att = pd.DataFrame({"student_key": ["STU-001"], "session_id": ["SES-1"], "status": ["PRESENT"]})
    
    with pytest.raises(ValueError) as exc:
        clean_and_audit_data(df_exp_bad, df_att)
    assert "missing mandatory columns" in str(exc.value)

def test_data_cleaner_identifies_duplicates_and_invalid_status():
    df_exp = pd.DataFrame({
        "student_key": ["STU-0001", "STU-0002"],
        "session_id": ["SES-01", "SES-01"],
        "session_date": ["2026-09-07", "2026-09-07"],
        "course_code": ["CS101", "CS101"],
        "section": ["SEC-A", "SEC-A"],
        "timetable_slot": ["08:30-10:00", "08:30-10:00"],
        "session_held": [1, 1]
    })

    # Intentional duplicate on STU-0001 and invalid status on STU-0002
    df_att = pd.DataFrame({
        "student_key": ["STU-0001", "STU-0001", "STU-0002"],
        "session_id": ["SES-01", "SES-01", "SES-01"],
        "status": ["PRESENT", "PRESENT", "INVALID_STATUS_VALUE"],
        "recorded_at": ["2026-09-07T08:35:00", "2026-09-07T08:35:00", "2026-09-07T08:35:00"]
    })

    df_exp_clean, df_att_clean, audit = clean_and_audit_data(df_exp, df_att)

    assert audit["duplicate_count"] == 2
    assert audit["invalid_status_count"] == 1
    # Deduplicated output should contain exactly 1 clean valid row
    assert len(df_att_clean) == 1
    assert df_att_clean.iloc[0]["student_key"] == "STU-0001"
    assert df_att_clean.iloc[0]["status"] == "PRESENT"

def test_data_cleaner_detects_orphan_records():
    df_exp = pd.DataFrame({
        "student_key": ["STU-0001"],
        "session_id": ["SES-SCHEDULED-1"],
        "session_date": ["2026-09-07"],
        "course_code": ["CS101"],
        "section": ["SEC-A"],
        "timetable_slot": ["08:30-10:00"],
        "session_held": [1]
    })
    # STU-0001 records attendance for an unscheduled session ID
    df_att = pd.DataFrame({
        "student_key": ["STU-0001", "STU-0001"],
        "session_id": ["SES-SCHEDULED-1", "SES-UNSCHEDULED-GHOST"],
        "status": ["PRESENT", "PRESENT"],
        "recorded_at": ["2026-09-07T08:30:00", "2026-09-07T08:30:00"]
    })

    df_exp_clean, df_att_clean, audit = clean_and_audit_data(df_exp, df_att)
    assert audit["orphan_count"] == 1
    assert len(df_att_clean) == 1
    assert df_att_clean.iloc[0]["session_id"] == "SES-SCHEDULED-1"
