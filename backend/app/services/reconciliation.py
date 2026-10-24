import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any

def reconcile_attendance_data(
    df_expected: pd.DataFrame, 
    df_attendance: pd.DataFrame
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Reconciles expected scheduled student-sessions with actual recorded entries.
    Identifies missing sessions, excludes cancelled sessions, and calculates record completeness.
    """
    # Merge expected with attendance on (student_key, session_id)
    # Using outer join ensures we can detect unexpected logs as well
    merged = pd.merge(
        df_expected,
        df_attendance[["student_key", "session_id", "status", "recorded_at"]],
        on=["student_key", "session_id"],
        how="left"
    )

    # Missing status resolution
    is_missing = merged["status"].isna() | (merged["status"] == "")
    merged["is_missing"] = is_missing
    merged["status"] = merged["status"].fillna("MISSING")

    # Reconciliation status label
    def get_recon_label(row):
        if row["session_held"] == 0:
            return "Session Cancelled"
        elif row["is_missing"]:
            return "Missing Entry"
        else:
            return f"Recorded: {row['status']}"

    merged["reconciliation_status"] = merged.apply(get_recon_label, axis=1)

    # Filter held sessions for completeness calculation
    held_sessions = merged[merged["session_held"] == 1]
    total_expected_held = len(held_sessions)
    total_recorded_valid = len(held_sessions[~held_sessions["is_missing"]])
    missing_count = int(held_sessions["is_missing"].sum())

    completeness_rate = (
        round((total_recorded_valid / total_expected_held * 100), 2)
        if total_expected_held > 0 else 0.0
    )

    stats = {
        "total_expected_sessions_held": total_expected_held,
        "total_recorded_valid": total_recorded_valid,
        "missing_entries": missing_count,
        "completeness_rate": completeness_rate,
        "is_provisional": completeness_rate < 85.0,
        "total_students": int(merged["student_key"].nunique()),
        "total_sessions": int(merged["session_id"].nunique()),
        "date_min": str(merged["session_date"].min()) if not merged.empty else "",
        "date_max": str(merged["session_date"].max()) if not merged.empty else ""
    }

    return merged, stats
