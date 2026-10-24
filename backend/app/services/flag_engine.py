import pandas as pd
import numpy as np
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.app.core.config import settings
from backend.app.models.review_flag import ReviewFlag

def detect_anomaly_flags(
    df_reconciled: pd.DataFrame,
    audit_summary: Dict[str, Any],
    db: Session
) -> List[ReviewFlag]:
    """
    Evaluates explainable, transparent anomaly detection rules.
    Syncs new and updated flags into the database while strictly preserving
    existing reviewer decisions, statuses, and notes.
    """
    generated_flags: List[Dict[str, Any]] = []

    held = df_reconciled[df_reconciled["session_held"] == 1].copy()
    if held.empty:
        return []

    held = held.sort_values(by=["student_key", "session_date"])

    # -------------------------------------------------------------
    # RULE 1: Consecutive Absences (RULE-ABS-STREAK)
    # -------------------------------------------------------------
    streak_thresh = settings.CONSECUTIVE_ABSENCE_THRESHOLD

    for stu, group in held.groupby("student_key"):
        current_streak = 0
        streak_start_date = None
        max_streak = 0
        max_streak_range = ("", "")

        for _, row in group.iterrows():
            if row["status"] == "ABSENT":
                if current_streak == 0:
                    streak_start_date = row["session_date"]
                current_streak += 1
                if current_streak > max_streak:
                    max_streak = current_streak
                    max_streak_range = (streak_start_date, row["session_date"])
            else:
                current_streak = 0

        if max_streak >= streak_thresh:
            flag_key = f"FLAG-STREAK-{stu}"
            generated_flags.append({
                "flag_key": flag_key,
                "category": "Attendance Pattern",
                "rule_name": "Consecutive Absence Threshold",
                "target_id": stu,
                "period": f"{max_streak_range[0]} to {max_streak_range[1]}",
                "evidence": f"Student accumulated {max_streak} consecutive unexcused absences across scheduled sessions.",
                "threshold_description": f"Triggered by ≥ {streak_thresh} consecutive unexcused absences.",
                "suggested_action": "Supportive mentor check-in to inquire about student well-being and offer academic resources."
            })

    # -------------------------------------------------------------
    # RULE 2: Longitudinal Attendance Drop (RULE-ATT-DROP)
    # -------------------------------------------------------------
    # Compare recent 2 weeks versus prior 4-week baseline
    unique_dates = sorted(held["session_date"].unique().tolist())
    if len(unique_dates) >= 6:
        # Split dates into recent 2 weeks and baseline
        recent_cutoff = unique_dates[-4] if len(unique_dates) >= 4 else unique_dates[-1]
        baseline_slice = held[held["session_date"] < recent_cutoff]
        recent_slice = held[held["session_date"] >= recent_cutoff]

        for stu in held["student_key"].unique():
            stu_base = baseline_slice[baseline_slice["student_key"] == stu]
            stu_rec = recent_slice[recent_slice["student_key"] == stu]

            # Require minimum sample size
            if len(stu_base) >= settings.MIN_SESSIONS_FOR_DROP_ANALYSIS and len(stu_rec) >= 2:
                # Calculate baseline rate
                b_p = int(stu_base["status"].eq("PRESENT").sum())
                b_l = int(stu_base["status"].eq("LATE").sum())
                b_a = int(stu_base["status"].eq("ABSENT").sum())
                b_denom = b_p + b_l + b_a
                base_rate = ((b_p + b_l) / b_denom * 100) if b_denom > 0 else None

                # Calculate recent rate
                r_p = int(stu_rec["status"].eq("PRESENT").sum())
                r_l = int(stu_rec["status"].eq("LATE").sum())
                r_a = int(stu_rec["status"].eq("ABSENT").sum())
                r_denom = r_p + r_l + r_a
                rec_rate = ((r_p + r_l) / r_denom * 100) if r_denom > 0 else None

                if base_rate is not None and rec_rate is not None:
                    drop = round(base_rate - rec_rate, 2)
                    if drop >= settings.ATTENDANCE_DROP_THRESHOLD_PCT:
                        flag_key = f"FLAG-DROP-{stu}"
                        generated_flags.append({
                            "flag_key": flag_key,
                            "category": "Attendance Pattern",
                            "rule_name": "Longitudinal Attendance Drop",
                            "target_id": stu,
                            "period": f"{recent_cutoff} to {unique_dates[-1]}",
                            "evidence": f"Attendance rate dropped by {drop:.1f}% (from {base_rate:.1f}% baseline to {rec_rate:.1f}% in recent weeks).",
                            "threshold_description": f"Triggered by ≥ {settings.ATTENDANCE_DROP_THRESHOLD_PCT}% drop vs baseline.",
                            "suggested_action": "Academic advisor consultation to explore schedule friction or study challenges."
                        })

    # -------------------------------------------------------------
    # RULE 3: Missing Expected Records Burst (RULE-MISSING-BURST)
    # -------------------------------------------------------------
    # Check course-section missing rate
    for (course, sec), grp in held.groupby(["course_code", "section"]):
        total_exp = len(grp)
        missing_cnt = int(grp["is_missing"].sum())
        missing_pct = (missing_cnt / total_exp * 100) if total_exp > 0 else 0.0

        if missing_pct >= settings.MISSING_RECORD_THRESHOLD_PCT:
            flag_key = f"FLAG-DATA-MISSING-{course}-{sec}"
            generated_flags.append({
                "flag_key": flag_key,
                "category": "Data Quality",
                "rule_name": "Session Recording Incompleteness",
                "target_id": f"{course} ({sec})",
                "period": f"{grp['session_date'].min()} to {grp['session_date'].max()}",
                "evidence": f"{missing_cnt} of {total_exp} expected student entries ({missing_pct:.1f}%) were unrecorded.",
                "threshold_description": f"Triggered by ≥ {settings.MISSING_RECORD_THRESHOLD_PCT}% missing expected records.",
                "suggested_action": "Contact course instructor or departmental coordinator to request unsubmitted attendance logs."
            })

    # -------------------------------------------------------------
    # RULE 4: Data Quality Audit Flags (RULE-DATA-INTEGRITY)
    # -------------------------------------------------------------
    if audit_summary.get("duplicate_count", 0) > 0:
        flag_key = "FLAG-AUDIT-DUPLICATES"
        generated_flags.append({
            "flag_key": flag_key,
            "category": "Data Quality",
            "rule_name": "Duplicate Attendance Submission",
            "target_id": "attendance_records",
            "period": "Term-wide audit",
            "evidence": f"Detected {audit_summary['duplicate_count']} duplicate records sharing student-session keys.",
            "threshold_description": "Triggered by duplicate (student_key, session_id) keys in source logs.",
            "suggested_action": "Check student attendance terminal synchronization or faculty log duplicate imports."
        })

    if audit_summary.get("invalid_status_count", 0) > 0:
        flag_key = "FLAG-AUDIT-INVALID-STATUS"
        generated_flags.append({
            "flag_key": flag_key,
            "category": "Data Quality",
            "rule_name": "Unrecognized Status Value",
            "target_id": "attendance_records",
            "period": "Term-wide audit",
            "evidence": f"Found {audit_summary['invalid_status_count']} records with non-standard status values.",
            "threshold_description": "Triggered by status values outside [PRESENT, ABSENT, LATE, EXCUSED].",
            "suggested_action": "Standardize data capture input enums in departmental recording software."
        })

    # -------------------------------------------------------------
    # Sync with Database (Preserve existing reviewer status & notes)
    # -------------------------------------------------------------
    existing_flags = {f.flag_key: f for f in db.query(ReviewFlag).all()}

    synced_flags = []
    for f_data in generated_flags:
        key = f_data["flag_key"]
        if key in existing_flags:
            # Existing flag: update metadata but keep user status & notes
            flag_obj = existing_flags[key]
            flag_obj.category = f_data["category"]
            flag_obj.rule_name = f_data["rule_name"]
            flag_obj.target_id = f_data["target_id"]
            flag_obj.period = f_data["period"]
            flag_obj.evidence = f_data["evidence"]
            flag_obj.threshold_description = f_data["threshold_description"]
            flag_obj.suggested_action = f_data["suggested_action"]
            flag_obj.updated_at = datetime.now(timezone.utc)
        else:
            # Brand new flag
            flag_obj = ReviewFlag(
                flag_key=key,
                category=f_data["category"],
                rule_name=f_data["rule_name"],
                target_id=f_data["target_id"],
                period=f_data["period"],
                evidence=f_data["evidence"],
                threshold_description=f_data["threshold_description"],
                suggested_action=f_data["suggested_action"],
                status="Needs context"
            )
            db.add(flag_obj)
        synced_flags.append(flag_obj)

    db.commit()
    return db.query(ReviewFlag).order_by(ReviewFlag.created_at.desc()).all()
