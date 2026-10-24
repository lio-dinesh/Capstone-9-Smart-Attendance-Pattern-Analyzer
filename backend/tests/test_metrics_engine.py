import pytest
import pandas as pd
from backend.app.services.metrics_engine import (
    calculate_attendance_rate, compute_kpi_summary, apply_filters
)
from backend.app.services.reconciliation import reconcile_attendance_data

def test_hand_verifiable_attendance_rate_calculations():
    # 8 present, 2 late, 2 absent -> (8 + 2) / 12 * 100 = 83.33%
    rate = calculate_attendance_rate(present_cnt=8, late_cnt=2, absent_cnt=2, late_weight=1.0)
    assert rate == 83.33

    # Half weight for late: (8 + 0.5 * 2) / 12 * 100 = 9 / 12 * 100 = 75.0%
    rate_half = calculate_attendance_rate(present_cnt=8, late_cnt=2, absent_cnt=2, late_weight=0.5)
    assert rate_half == 75.0

    # Zero denominator safeguard (0 present, 0 late, 0 absent) -> None (N/A)
    rate_zero = calculate_attendance_rate(present_cnt=0, late_cnt=0, absent_cnt=0)
    assert rate_zero is None

def test_excused_exclusion_and_missing_reconciliation():
    # 4 expected sessions for student STU-001
    df_exp = pd.DataFrame({
        "student_key": ["STU-001"] * 4,
        "session_id": [f"SES-0{i}" for i in range(1, 5)],
        "session_date": ["2026-09-07", "2026-09-09", "2026-09-14", "2026-09-16"],
        "course_code": ["CS101"] * 4,
        "section": ["SEC-A"] * 4,
        "timetable_slot": ["08:30-10:00"] * 4,
        "session_held": [1, 1, 1, 0]  # SES-04 was cancelled
    })

    # Recorded: 1 PRESENT, 1 EXCUSED, SES-03 is MISSING
    df_att = pd.DataFrame({
        "student_key": ["STU-001", "STU-001"],
        "session_id": ["SES-01", "SES-02"],
        "status": ["PRESENT", "EXCUSED"],
        "recorded_at": ["2026-09-07T08:30:00", "2026-09-09T08:30:00"]
    })

    df_rec, stats = reconcile_attendance_data(df_exp, df_att)

    # SES-04 was cancelled: total expected held is 3
    assert stats["total_expected_sessions_held"] == 3
    # 2 entries recorded for held sessions
    assert stats["total_recorded_valid"] == 2
    # SES-03 is missing
    assert stats["missing_entries"] == 1
    # Completeness = 2 / 3 * 100 = 66.67%
    assert stats["completeness_rate"] == 66.67
    assert stats["is_provisional"] is True

    # KPI Summary calculation
    kpis = compute_kpi_summary(df_rec)
    # Rate: 1 PRESENT, 0 LATE, 0 ABSENT -> Denominator is 1 (EXCUSED and MISSING excluded) -> 100.0%
    assert kpis["overall_attendance_rate"] == 100.0
    assert kpis["status_counts"]["EXCUSED"] == 1
    assert kpis["status_counts"]["MISSING"] == 1
    assert "Provisional" in kpis["rate_status_label"]
