from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from fastapi.responses import StreamingResponse, PlainTextResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import io
import os
import json
import pandas as pd

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.services.dataset_service import DatasetService
from backend.app.services.metrics_engine import (
    compute_kpi_summary, compute_trends, compute_patterns, compute_course_comparisons
)
from backend.app.models.review_flag import ReviewFlag
from backend.app.models.attendance import AttendanceRecord
from backend.app.schemas import (
    ApiResponse, KpiSummary, TrendsResponse, PatternsResponse,
    CourseComparisonResponse, DataQualityReport, FlagsListResponse,
    ReviewFlagItem, ReviewActionRequest, RecordTableResponse, ReconciledRecordItem,
    AttendanceRecordUpdate
)

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    svc = DatasetService.get_instance()
    if svc.df_reconciled is None:
        svc.initialize(db)
    active_flags = db.query(ReviewFlag).count()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "dataset_loaded": svc.df_reconciled is not None and not svc.df_reconciled.empty,
        "dataset_metadata": svc.dataset_meta,
        "active_flags_count": active_flags
    }

@router.get("/dashboard/summary", response_model=KpiSummary)
def get_dashboard_summary(
    course_code: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    svc = DatasetService.get_instance()
    if svc.df_reconciled is None:
        svc.initialize(db)

    active_flags_count = db.query(ReviewFlag).filter(ReviewFlag.status != "Reviewed").count()
    filters = {
        "course_code": course_code,
        "section": section,
        "date_start": date_start,
        "date_end": date_end
    }
    return compute_kpi_summary(svc.df_reconciled, filters, active_flags_count)

@router.get("/analytics/trends", response_model=TrendsResponse)
def get_trends(
    course_code: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    granularity: str = Query("weekly", pattern="^(weekly|monthly)$"),
    db: Session = Depends(get_db)
):
    svc = DatasetService.get_instance()
    if svc.df_reconciled is None:
        svc.initialize(db)

    filters = {
        "course_code": course_code,
        "section": section,
        "date_start": date_start,
        "date_end": date_end
    }
    return compute_trends(svc.df_reconciled, filters, granularity)

@router.get("/analytics/patterns", response_model=PatternsResponse)
def get_patterns(
    course_code: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    svc = DatasetService.get_instance()
    if svc.df_reconciled is None:
        svc.initialize(db)

    filters = {
        "course_code": course_code,
        "section": section,
        "date_start": date_start,
        "date_end": date_end
    }
    return compute_patterns(svc.df_reconciled, filters)

@router.get("/analytics/course-comparison", response_model=CourseComparisonResponse)
def get_course_comparison(
    course_code: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    svc = DatasetService.get_instance()
    if svc.df_reconciled is None:
        svc.initialize(db)

    filters = {
        "course_code": course_code,
        "section": section,
        "date_start": date_start,
        "date_end": date_end
    }
    courses = compute_course_comparisons(svc.df_reconciled, filters)
    return {"courses": courses}

@router.get("/quality/report", response_model=DataQualityReport)
def get_quality_report(db: Session = Depends(get_db)):
    svc = DatasetService.get_instance()
    if svc.df_reconciled is None:
        svc.initialize(db)

    audit = svc.audit_summary
    held = svc.df_reconciled[svc.df_reconciled["session_held"] == 1]
    
    total_exp = len(held)
    valid_recorded = len(held[~held["is_missing"]])
    missing_exp = int(held["is_missing"].sum())
    completeness = round((valid_recorded / total_exp * 100), 2) if total_exp > 0 else 0.0

    # Course breakdown
    breakdown = []
    for (course, sec), grp in held.groupby(["course_code", "section"]):
        grp_exp = len(grp)
        grp_rec = len(grp[~grp["is_missing"]])
        grp_miss = int(grp["is_missing"].sum())
        grp_comp = round((grp_rec / grp_exp * 100), 2) if grp_exp > 0 else 0.0
        breakdown.append({
            "course_code": course,
            "section": sec,
            "expected_count": grp_exp,
            "recorded_count": grp_rec,
            "missing_count": grp_miss,
            "completeness_rate": grp_comp
        })

    return {
        "total_expected_records": audit.get("raw_expected_rows", total_exp),
        "total_recorded_records": audit.get("raw_attendance_rows", valid_recorded),
        "valid_matched_records": valid_recorded,
        "missing_expected_count": missing_exp,
        "duplicate_count": audit.get("duplicate_count", 0),
        "invalid_status_count": audit.get("invalid_status_count", 0),
        "invalid_date_count": audit.get("invalid_date_count", 0),
        "orphan_record_count": audit.get("orphan_count", 0),
        "record_completeness_pct": completeness,
        "completeness_status": "Reliable" if completeness >= 85.0 else "Provisional (Low Completeness)",
        "breakdown_by_course": breakdown,
        "issues_list": audit.get("issues", [])
    }

@router.get("/flags", response_model=FlagsListResponse)
def get_flags(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    svc = DatasetService.get_instance()
    if svc.df_reconciled is None:
        svc.initialize(db)

    query = db.query(ReviewFlag)
    if category and category != "ALL":
        query = query.filter(ReviewFlag.category == category)
    if status and status != "ALL":
        query = query.filter(ReviewFlag.status == status)

    all_flags = query.order_by(ReviewFlag.id.desc()).all()

    needs_context = db.query(ReviewFlag).filter(ReviewFlag.status == "Needs context").count()
    data_issue = db.query(ReviewFlag).filter(ReviewFlag.status == "Data issue").count()
    reviewed = db.query(ReviewFlag).filter(ReviewFlag.status == "Reviewed").count()

    return {
        "total": len(all_flags),
        "needs_context_count": needs_context,
        "data_issue_count": data_issue,
        "reviewed_count": reviewed,
        "flags": all_flags
    }

@router.post("/flags/{flag_key}/review", response_model=ApiResponse)
def review_flag(
    flag_key: str, 
    review: ReviewActionRequest, 
    db: Session = Depends(get_db)
):
    flag = db.query(ReviewFlag).filter(ReviewFlag.flag_key == flag_key).first()
    if not flag:
        raise HTTPException(status_code=404, detail=f"Review flag '{flag_key}' not found.")

    flag.status = review.status
    if review.reviewer_note is not None:
        flag.reviewer_note = review.reviewer_note
    db.commit()

    return ApiResponse(
        success=True, 
        message=f"Review flag '{flag_key}' updated to '{review.status}'.",
        data={"flag_key": flag_key, "status": flag.status, "reviewer_note": flag.reviewer_note}
    )

@router.get("/records", response_model=RecordTableResponse)
def get_reconciled_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    course_code: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_missing: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    svc = DatasetService.get_instance()
    if svc.df_reconciled is None:
        svc.initialize(db)

    df = svc.df_reconciled.copy()

    # Search filter
    if search:
        s = search.strip().lower()
        df = df[
            df["student_key"].str.lower().str.contains(s) |
            df["session_id"].str.lower().str.contains(s) |
            df["course_code"].str.lower().str.contains(s)
        ]

    if course_code and course_code not in ("All Courses", "ALL"):
        df = df[df["course_code"] == course_code]
    if section and section not in ("All Sections", "ALL"):
        df = df[df["section"] == section]
    if status and status not in ("All Statuses", "ALL"):
        df = df[df["status"] == status]
    if is_missing is not None:
        df = df[df["is_missing"] == is_missing]

    total = len(df)
    total_pages = max(1, (total + page_size - 1) // page_size)

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    sliced = df.iloc[start_idx:end_idx]

    # Map DB ID for editable attendance records
    att_db_map = {
        (r.student_key, r.session_id): r.id
        for r in db.query(AttendanceRecord.id, AttendanceRecord.student_key, AttendanceRecord.session_id).all()
    }

    records_out = []
    for _, row in sliced.iterrows():
        key = (row["student_key"], row["session_id"])
        record_id = att_db_map.get(key)
        records_out.append({
            "id": record_id,
            "student_key": row["student_key"],
            "session_id": row["session_id"],
            "session_date": row["session_date"],
            "course_code": row["course_code"],
            "section": row["section"],
            "timetable_slot": row["timetable_slot"],
            "session_held": bool(row["session_held"]),
            "status": row["status"],
            "recorded_at": row.get("recorded_at") if pd.notna(row.get("recorded_at")) else None,
            "is_missing": bool(row["is_missing"]),
            "reconciliation_status": row["reconciliation_status"]
        })

    return {
        "records": records_out,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.patch("/attendance/{record_id}", response_model=ApiResponse)
def update_attendance_record(
    record_id: int,
    payload: AttendanceRecordUpdate,
    db: Session = Depends(get_db)
):
    svc = DatasetService.get_instance()
    try:
        result = svc.update_attendance_status(record_id, payload.status, payload.reviewer_note, db)
        return ApiResponse(
            success=True,
            message=f"Attendance record {record_id} amended to {payload.status}.",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/datasets/demo", response_model=ApiResponse)
def reload_demo_dataset(db: Session = Depends(get_db)):
    svc = DatasetService.get_instance()
    stats = svc.load_demo_data(db)
    return ApiResponse(
        success=True,
        message="Demo synthetic benchmark dataset successfully reloaded and metrics recalculated.",
        data=stats
    )

@router.post("/datasets/import", response_model=ApiResponse)
async def import_datasets(
    expected_file: UploadFile = File(...),
    attendance_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    svc = DatasetService.get_instance()
    try:
        exp_bytes = await expected_file.read()
        att_bytes = await attendance_file.read()

        exp_content = exp_bytes.decode("utf-8")
        att_content = att_bytes.decode("utf-8")

        stats = svc.import_custom_dataset(exp_content, att_content, db)
        return ApiResponse(
            success=True,
            message="Datasets imported, validated, and metrics recomputed successfully.",
            data=stats
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@router.get("/datasets/templates/{kind}")
def download_template(kind: str):
    templates_dir = os.path.join(settings.DATA_DIR, "templates")
    if kind == "expected":
        filepath = os.path.join(templates_dir, "expected_sessions_template.csv")
        filename = "expected_sessions_template.csv"
    elif kind == "attendance":
        filepath = os.path.join(templates_dir, "attendance_records_template.csv")
        filename = "attendance_records_template.csv"
    else:
        raise HTTPException(status_code=404, detail="Unknown template kind. Use 'expected' or 'attendance'.")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Template file not found.")

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/exports/summary")
def export_summary(db: Session = Depends(get_db)):
    """Downloads an aggregated, privacy-preserving JSON report containing cohort metrics without PII."""
    svc = DatasetService.get_instance()
    if svc.df_reconciled is None:
        svc.initialize(db)

    kpis = compute_kpi_summary(svc.df_reconciled)
    trends = compute_trends(svc.df_reconciled)
    patterns = compute_patterns(svc.df_reconciled)
    courses = compute_course_comparisons(svc.df_reconciled)

    export_payload = {
        "report_name": "Smart Attendance Pattern Analyzer — Executive Summary",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "privacy_notice": "Contains aggregated cohort statistics only. All individual student keys excluded.",
        "kpis": kpis,
        "weekly_trends": trends["points"],
        "course_comparisons": courses,
        "timetable_friction_notes": patterns["detected_friction_notes"]
    }

    json_str = json.dumps(export_payload, indent=2)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=attendance_analytics_summary.json"}
    )
