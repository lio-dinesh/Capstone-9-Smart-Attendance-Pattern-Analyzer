import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from backend.app.core.config import settings

def apply_filters(
    df: pd.DataFrame,
    course_code: Optional[str] = None,
    section: Optional[str] = None,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None
) -> pd.DataFrame:
    """Applies global filters uniformly across all analytical views."""
    filtered = df.copy()
    if course_code and course_code != "All Courses" and course_code != "ALL":
        filtered = filtered[filtered["course_code"] == course_code]
    if section and section != "All Sections" and section != "ALL":
        filtered = filtered[filtered["section"] == section]
    if date_start:
        filtered = filtered[filtered["session_date"] >= date_start]
    if date_end:
        filtered = filtered[filtered["session_date"] <= date_end]
    return filtered

def calculate_attendance_rate(
    present_cnt: int,
    late_cnt: int,
    absent_cnt: int,
    late_weight: float = None
) -> Optional[float]:
    """
    Standard Capstone Attendance Formula:
    Rate = (PRESENT + w_late * LATE) / (PRESENT + LATE + ABSENT) * 100
    EXCUSED and MISSING are excluded from denominator.
    Returns None if denominator is 0 (safeguard against division by zero).
    """
    if late_weight is None:
        late_weight = settings.LATE_ATTENDANCE_WEIGHT

    denominator = present_cnt + late_cnt + absent_cnt
    if denominator == 0:
        return None
    numerator = present_cnt + (late_weight * late_cnt)
    return round((numerator / denominator) * 100, 2)

def compute_kpi_summary(
    df_reconciled: pd.DataFrame,
    filters: Optional[Dict[str, Any]] = None,
    active_flags_count: int = 0
) -> Dict[str, Any]:
    """Computes high-level KPI cards with provenance, sample size, and completeness."""
    filtered = df_reconciled.copy()
    if filters:
        filtered = apply_filters(
            filtered,
            filters.get("course_code"),
            filters.get("section"),
            filters.get("date_start"),
            filters.get("date_end")
        )

    # Eligible held sessions
    held = filtered[filtered["session_held"] == 1]
    total_expected_held = len(held)

    # Status counts for held sessions
    status_counts = held["status"].value_counts().to_dict()
    present_cnt = int(status_counts.get("PRESENT", 0))
    late_cnt = int(status_counts.get("LATE", 0))
    absent_cnt = int(status_counts.get("ABSENT", 0))
    excused_cnt = int(status_counts.get("EXCUSED", 0))
    missing_cnt = int(status_counts.get("MISSING", 0))

    total_valid_recorded = present_cnt + late_cnt + absent_cnt + excused_cnt

    # Attendance rate
    rate = calculate_attendance_rate(present_cnt, late_cnt, absent_cnt)

    # Completeness rate
    completeness = (
        round((total_valid_recorded / total_expected_held * 100), 2)
        if total_expected_held > 0 else 0.0
    )

    is_provisional = completeness < settings.PROVISIONAL_COMPLETENESS_THRESHOLD_PCT
    status_label = "Provisional (Low Completeness)" if is_provisional else "Normal"

    # Compute baseline comparison delta (e.g. versus prior 4 weeks if date range specified, or overall term)
    baseline_delta = None
    comparison_label = "Full period baseline"

    if not held.empty and "session_date" in held.columns:
        unique_dates = sorted(held["session_date"].unique().tolist())
        if len(unique_dates) >= 8:
            split_idx = len(unique_dates) // 2
            prior_dates = unique_dates[:split_idx]
            recent_dates = unique_dates[split_idx:]
            
            prior_held = held[held["session_date"].isin(prior_dates)]
            recent_held = held[held["session_date"].isin(recent_dates)]
            
            prior_p = int(prior_held["status"].eq("PRESENT").sum())
            prior_l = int(prior_held["status"].eq("LATE").sum())
            prior_a = int(prior_held["status"].eq("ABSENT").sum())
            prior_rate = calculate_attendance_rate(prior_p, prior_l, prior_a)
            
            recent_p = int(recent_held["status"].eq("PRESENT").sum())
            recent_l = int(recent_held["status"].eq("LATE").sum())
            recent_a = int(recent_held["status"].eq("ABSENT").sum())
            recent_rate = calculate_attendance_rate(recent_p, recent_l, recent_a)
            
            if prior_rate is not None and recent_rate is not None:
                baseline_delta = round(recent_rate - prior_rate, 2)
                comparison_label = "Recent half vs first half of term"

    return {
        "overall_attendance_rate": rate,
        "rate_status_label": status_label,
        "completeness_rate": completeness,
        "total_expected_sessions_held": total_expected_held,
        "total_recorded_valid": total_valid_recorded,
        "missing_entries": missing_cnt,
        "active_flags_count": active_flags_count,
        "baseline_delta_pct": baseline_delta,
        "comparison_period_label": comparison_label,
        "status_counts": {
            "PRESENT": present_cnt,
            "LATE": late_cnt,
            "ABSENT": absent_cnt,
            "EXCUSED": excused_cnt,
            "MISSING": missing_cnt
        }
    }

def compute_trends(
    df_reconciled: pd.DataFrame,
    filters: Optional[Dict[str, Any]] = None,
    granularity: str = "weekly"
) -> Dict[str, Any]:
    """Generates weekly or monthly attendance trends with completeness."""
    filtered = df_reconciled.copy()
    if filters:
        filtered = apply_filters(
            filtered,
            filters.get("course_code"),
            filters.get("section"),
            filters.get("date_start"),
            filters.get("date_end")
        )

    held = filtered[filtered["session_held"] == 1].copy()
    if held.empty:
        return {"granularity": granularity, "points": [], "comparison_baseline_rate": None}

    held["session_dt"] = pd.to_datetime(held["session_date"])
    
    if granularity == "monthly":
        held["period_key"] = held["session_dt"].dt.strftime("%Y-%m")
        period_format = lambda dt: dt.strftime("%b %Y")
    else:
        # Default weekly (ISO week)
        held["period_key"] = held["session_dt"].dt.strftime("%Y-W%U")
        period_format = lambda dt: f"Wk {dt.strftime('%U')} ({dt.strftime('%b %d')})"

    points = []
    baseline_rates = []

    for p_key, group in held.groupby("period_key", sort=True):
        date_start = group["session_date"].min()
        dt_sample = group["session_dt"].min()
        period_label = period_format(dt_sample)

        p_cnt = int(group["status"].eq("PRESENT").sum())
        l_cnt = int(group["status"].eq("LATE").sum())
        a_cnt = int(group["status"].eq("ABSENT").sum())
        e_cnt = int(group["status"].eq("EXCUSED").sum())
        m_cnt = int(group["status"].eq("MISSING").sum())
        exp_cnt = len(group)
        rec_cnt = p_cnt + l_cnt + a_cnt + e_cnt

        att_rate = calculate_attendance_rate(p_cnt, l_cnt, a_cnt)
        if att_rate is not None:
            baseline_rates.append(att_rate)

        comp_rate = round((rec_cnt / exp_cnt * 100), 2) if exp_cnt > 0 else 0.0

        points.append({
            "period": period_label,
            "date_start": date_start,
            "attendance_rate": att_rate,
            "completeness_rate": comp_rate,
            "expected_count": exp_cnt,
            "attended_count": p_cnt + l_cnt,
            "absent_count": a_cnt,
            "late_count": l_cnt,
            "excused_count": e_cnt,
            "missing_count": m_cnt
        })

    avg_baseline = round(sum(baseline_rates) / len(baseline_rates), 2) if baseline_rates else None

    return {
        "granularity": granularity,
        "points": points,
        "comparison_baseline_rate": avg_baseline
    }

def compute_patterns(
    df_reconciled: pd.DataFrame,
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Analyzes weekday and timetable-slot distributions to discover structural friction."""
    filtered = df_reconciled.copy()
    if filters:
        filtered = apply_filters(
            filtered,
            filters.get("course_code"),
            filters.get("section"),
            filters.get("date_start"),
            filters.get("date_end")
        )

    held = filtered[filtered["session_held"] == 1].copy()
    if held.empty:
        return {
            "weekday_distribution": [],
            "slot_distribution": [],
            "timetable_heatmap": [],
            "detected_friction_notes": []
        }

    held["session_dt"] = pd.to_datetime(held["session_date"])
    held["weekday_name"] = held["session_dt"].dt.day_name()

    weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

    # Weekday breakdown
    weekday_data = []
    for day in weekday_order:
        grp = held[held["weekday_name"] == day]
        if grp.empty:
            continue
        p = int(grp["status"].eq("PRESENT").sum())
        l = int(grp["status"].eq("LATE").sum())
        a = int(grp["status"].eq("ABSENT").sum())
        rate = calculate_attendance_rate(p, l, a)
        weekday_data.append({
            "weekday": day,
            "attendance_rate": rate,
            "held_count": len(grp),
            "attended_count": p + l,
            "absent_count": a,
            "late_count": l
        })

    # Slot breakdown
    slot_data = []
    unique_slots = sorted(held["timetable_slot"].unique().tolist())
    for slot in unique_slots:
        grp = held[held["timetable_slot"] == slot]
        p = int(grp["status"].eq("PRESENT").sum())
        l = int(grp["status"].eq("LATE").sum())
        a = int(grp["status"].eq("ABSENT").sum())
        rate = calculate_attendance_rate(p, l, a)
        slot_data.append({
            "timetable_slot": slot,
            "attendance_rate": rate,
            "held_count": len(grp),
            "attended_count": p + l,
            "absent_count": a,
            "late_count": l
        })

    # Heatmap matrix: (weekday x slot)
    heatmap_matrix = []
    friction_notes = []

    for day in weekday_order:
        for slot in unique_slots:
            grp = held[(held["weekday_name"] == day) & (held["timetable_slot"] == slot)]
            if grp.empty:
                continue
            p = int(grp["status"].eq("PRESENT").sum())
            l = int(grp["status"].eq("LATE").sum())
            a = int(grp["status"].eq("ABSENT").sum())
            rate = calculate_attendance_rate(p, l, a)
            heatmap_matrix.append({
                "weekday": day,
                "timetable_slot": slot,
                "attendance_rate": rate,
                "total_held": len(grp),
                "attended_count": p + l,
                "absent_count": a,
                "sample_size": len(grp)
            })

            # Detect specific timetable friction
            if rate is not None and rate < 75.0 and len(grp) >= 20:
                friction_notes.append(
                    f"Noticeable attendance dip ({rate}%) identified during {day} {slot} slots across cohorts."
                )

    if not friction_notes:
        friction_notes.append("Attendance patterns appear relatively balanced across weekdays and scheduled timetable slots.")

    return {
        "weekday_distribution": weekday_data,
        "slot_distribution": slot_data,
        "timetable_heatmap": heatmap_matrix,
        "detected_friction_notes": friction_notes
    }

def compute_course_comparisons(
    df_reconciled: pd.DataFrame,
    filters: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Generates course and section level aggregates with record completeness."""
    filtered = df_reconciled.copy()
    if filters:
        filtered = apply_filters(
            filtered,
            filters.get("course_code"),
            filters.get("section"),
            filters.get("date_start"),
            filters.get("date_end")
        )

    held = filtered[filtered["session_held"] == 1].copy()
    if held.empty:
        return []

    course_items = []
    grouped = held.groupby(["course_code", "section"], sort=True)

    for (course, sec), grp in grouped:
        p = int(grp["status"].eq("PRESENT").sum())
        l = int(grp["status"].eq("LATE").sum())
        a = int(grp["status"].eq("ABSENT").sum())
        e = int(grp["status"].eq("EXCUSED").sum())
        m = int(grp["status"].eq("MISSING").sum())
        exp = len(grp)
        rec = p + l + a + e

        rate = calculate_attendance_rate(p, l, a)
        comp = round((rec / exp * 100), 2) if exp > 0 else 0.0

        course_items.append({
            "course_code": course,
            "section": sec,
            "attendance_rate": rate,
            "completeness_rate": comp,
            "expected_sessions_held": exp,
            "recorded_sessions": rec,
            "missing_count": m,
            "status_counts": {
                "PRESENT": p,
                "LATE": l,
                "ABSENT": a,
                "EXCUSED": e,
                "MISSING": m
            },
            "is_provisional": comp < settings.PROVISIONAL_COMPLETENESS_THRESHOLD_PCT
        })

    return course_items
