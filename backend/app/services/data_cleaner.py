import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, List

VALID_STATUSES = {"PRESENT", "ABSENT", "LATE", "EXCUSED"}

EXPECTED_REQUIRED_COLUMNS = {
    "student_key", "session_id", "session_date", "course_code", "section", "timetable_slot", "session_held"
}

ATTENDANCE_REQUIRED_COLUMNS = {
    "student_key", "session_id", "status"
}

def clean_and_audit_data(
    df_expected_raw: pd.DataFrame, 
    df_attendance_raw: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Performs rigorous data hygiene, audit, and preparation.
    Detects invalid dates, malformed statuses, duplicates, and orphan records.
    Returns cleaned DataFrames and an extensive diagnostic audit dictionary.
    """
    issues = []
    
    # 1. Header Validation
    expected_missing_cols = EXPECTED_REQUIRED_COLUMNS - set(df_expected_raw.columns)
    if expected_missing_cols:
        raise ValueError(f"Expected sessions dataset is missing mandatory columns: {expected_missing_cols}")
        
    attendance_missing_cols = ATTENDANCE_REQUIRED_COLUMNS - set(df_attendance_raw.columns)
    if attendance_missing_cols:
        raise ValueError(f"Attendance records dataset is missing mandatory columns: {attendance_missing_cols}")

    df_expected = df_expected_raw.copy()
    df_attendance = df_attendance_raw.copy()

    # Normalize string columns
    for col in ["student_key", "session_id", "course_code", "section", "timetable_slot"]:
        df_expected[col] = df_expected[col].astype(str).str.strip()
    
    for col in ["student_key", "session_id", "status"]:
        df_attendance[col] = df_attendance[col].astype(str).str.strip()

    # Ensure session_held is boolean/int (1 or 0)
    df_expected["session_held"] = df_expected["session_held"].apply(
        lambda x: 1 if str(x).strip().lower() in ("1", "true", "t", "yes") else 0
    )

    # 2. Date Validation for Expected Sessions
    invalid_dates_count = 0
    parsed_dates = pd.to_datetime(df_expected["session_date"], errors="coerce")
    invalid_date_mask = parsed_dates.isna()
    if invalid_date_mask.any():
        invalid_dates_count = int(invalid_date_mask.sum())
        issues.append({
            "issue_type": "Invalid Date",
            "severity": "high",
            "target_identifier": "expected_sessions",
            "description": f"Encountered {invalid_dates_count} unparseable session dates.",
            "affected_rows": invalid_dates_count,
            "system_action": "Excluded rows with invalid dates from timetable analytics"
        })
        # Filter out invalid dates
        df_expected = df_expected[~invalid_date_mask].copy()

    # 3. Status Enum Validation
    invalid_status_mask = ~df_attendance["status"].isin(VALID_STATUSES)
    invalid_status_count = int(invalid_status_mask.sum())
    if invalid_status_count > 0:
        bad_sample = df_attendance.loc[invalid_status_mask, "status"].unique().tolist()
        issues.append({
            "issue_type": "Invalid Status",
            "severity": "high",
            "target_identifier": "attendance_records",
            "description": f"Found {invalid_status_count} rows with unrecognized status values: {bad_sample}",
            "affected_rows": invalid_status_count,
            "system_action": "Excluded from attendance rate numerator and denominator"
        })
        # Retain only recognized statuses for metric calculation
        df_attendance_valid = df_attendance[~invalid_status_mask].copy()
    else:
        df_attendance_valid = df_attendance.copy()

    # 4. Duplicate Key Audit: (student_key, session_id)
    dup_mask = df_attendance_valid.duplicated(subset=["student_key", "session_id"], keep=False)
    duplicate_count = int(dup_mask.sum())
    if duplicate_count > 0:
        issues.append({
            "issue_type": "Duplicate Key",
            "severity": "medium",
            "target_identifier": "attendance_records",
            "description": f"Found {duplicate_count} duplicate recorded entries for the same student and session.",
            "affected_rows": duplicate_count,
            "system_action": "Deterministically retained the first recorded submission; logged duplicates for audit."
        })
        # Deduplicate deterministically keeping the first entry
        df_attendance_dedup = df_attendance_valid.drop_duplicates(
            subset=["student_key", "session_id"], keep="first"
        ).copy()
    else:
        df_attendance_dedup = df_attendance_valid.copy()

    # 5. Orphan Record Audit (session_id not in expected sessions)
    expected_session_ids = set(df_expected["session_id"].unique())
    orphan_mask = ~df_attendance_dedup["session_id"].isin(expected_session_ids)
    orphan_count = int(orphan_mask.sum())
    if orphan_count > 0:
        issues.append({
            "issue_type": "Orphan Record",
            "severity": "medium",
            "target_identifier": "attendance_records",
            "description": f"Found {orphan_count} recorded rows referencing session IDs not in the scheduled timetable.",
            "affected_rows": orphan_count,
            "system_action": "Excluded orphan records from cohort attendance rates."
        })
        df_attendance_cleaned = df_attendance_dedup[~orphan_mask].copy()
    else:
        df_attendance_cleaned = df_attendance_dedup.copy()

    # Build audit summary
    audit_summary = {
        "raw_expected_rows": len(df_expected_raw),
        "cleaned_expected_rows": len(df_expected),
        "raw_attendance_rows": len(df_attendance_raw),
        "cleaned_attendance_rows": len(df_attendance_cleaned),
        "invalid_date_count": invalid_dates_count,
        "invalid_status_count": invalid_status_count,
        "duplicate_count": duplicate_count,
        "orphan_count": orphan_count,
        "issues": issues
    }

    return df_expected, df_attendance_cleaned, audit_summary
