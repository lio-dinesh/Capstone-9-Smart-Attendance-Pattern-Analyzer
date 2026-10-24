import os
import io
import pandas as pd
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.models.attendance import ExpectedSession, AttendanceRecord
from backend.app.models.review_flag import ReviewFlag
from backend.app.models.dataset import DatasetMetadata
from backend.app.services.data_cleaner import clean_and_audit_data
from backend.app.services.reconciliation import reconcile_attendance_data
from backend.app.services.flag_engine import detect_anomaly_flags

class DatasetService:
    _instance = None
    
    def __init__(self):
        self.df_expected: Optional[pd.DataFrame] = None
        self.df_attendance: Optional[pd.DataFrame] = None
        self.df_reconciled: Optional[pd.DataFrame] = None
        self.audit_summary: Dict[str, Any] = {}
        self.dataset_meta: Dict[str, Any] = {}

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DatasetService()
        return cls._instance

    def initialize(self, db: Session):
        """Initializes tables and loads existing or demo dataset."""
        Base.metadata.create_all(bind=engine)
        
        # Check if ExpectedSession already has rows
        expected_count = db.query(ExpectedSession).count()
        if expected_count > 0:
            self._load_from_db(db)
        else:
            self.load_demo_data(db)

    def load_demo_data(self, db: Session) -> Dict[str, Any]:
        """Loads default synthetic dataset into SQLite database and recalculates."""
        synthetic_dir = os.path.join(settings.DATA_DIR, "synthetic")
        expected_csv = os.path.join(synthetic_dir, "expected_sessions.csv")
        attendance_csv = os.path.join(synthetic_dir, "attendance_records.csv")

        # Generate if not present
        if not (os.path.exists(expected_csv) and os.path.exists(attendance_csv)):
            from data.synthetic.generate_synthetic_data import generate_datasets
            generate_datasets(synthetic_dir)

        df_exp_raw = pd.read_csv(expected_csv)
        df_att_raw = pd.read_csv(attendance_csv)

        # Clear existing data
        db.query(ExpectedSession).delete()
        db.query(AttendanceRecord).delete()
        db.commit()

        # Clean and audit
        df_exp_cleaned, df_att_cleaned, audit_summary = clean_and_audit_data(df_exp_raw, df_att_raw)

        # Bulk insert into DB for persistence
        expected_objects = [
            ExpectedSession(
                student_key=row["student_key"],
                session_id=row["session_id"],
                session_date=row["session_date"],
                course_code=row["course_code"],
                section=row["section"],
                timetable_slot=row["timetable_slot"],
                session_held=bool(row["session_held"])
            )
            for _, row in df_exp_cleaned.iterrows()
        ]
        db.bulk_save_objects(expected_objects)

        # Retain raw attendance rows in DB so data quality view can inspect invalid/duplicates
        attendance_objects = []
        for _, row in df_att_raw.iterrows():
            attendance_objects.append(
                AttendanceRecord(
                    student_key=str(row["student_key"]).strip(),
                    session_id=str(row["session_id"]).strip(),
                    status=str(row["status"]).strip(),
                    recorded_at=str(row["recorded_at"]) if pd.notna(row.get("recorded_at")) else None
                )
            )
        db.bulk_save_objects(attendance_objects)

        # Reconcile
        df_reconciled, recon_stats = reconcile_attendance_data(df_exp_cleaned, df_att_cleaned)

        # Update metadata
        meta = db.query(DatasetMetadata).first()
        if not meta:
            meta = DatasetMetadata(name="Synthetic Demo Benchmark", source_type="synthetic_demo")
            db.add(meta)
        meta.name = "Synthetic Demo Benchmark (10 Wks)"
        meta.source_type = "synthetic_demo"
        meta.total_expected_sessions = recon_stats["total_expected_sessions_held"]
        meta.total_recorded_records = recon_stats["total_recorded_valid"]
        meta.total_students = recon_stats["total_students"]
        meta.date_range_start = recon_stats["date_min"]
        meta.date_range_end = recon_stats["date_max"]
        meta.loaded_at = datetime.now(timezone.utc)
        db.commit()

        # Detect flags and sync
        detect_anomaly_flags(df_reconciled, audit_summary, db)

        # Cache in memory
        self.df_expected = df_exp_cleaned
        self.df_attendance = df_att_cleaned
        self.df_reconciled = df_reconciled
        self.audit_summary = audit_summary
        self.dataset_meta = recon_stats

        return recon_stats

    def _load_from_db(self, db: Session):
        """Loads cached DataFrames from persistent SQLite tables."""
        exp_records = db.query(ExpectedSession).all()
        att_records = db.query(AttendanceRecord).all()

        df_exp_raw = pd.DataFrame([{
            "student_key": r.student_key,
            "session_id": r.session_id,
            "session_date": r.session_date,
            "course_code": r.course_code,
            "section": r.section,
            "timetable_slot": r.timetable_slot,
            "session_held": 1 if r.session_held else 0
        } for r in exp_records])

        df_att_raw = pd.DataFrame([{
            "id": r.id,
            "student_key": r.student_key,
            "session_id": r.session_id,
            "status": r.status,
            "recorded_at": r.recorded_at
        } for r in att_records])

        df_exp_cleaned, df_att_cleaned, audit = clean_and_audit_data(df_exp_raw, df_att_raw)
        df_reconciled, recon_stats = reconcile_attendance_data(df_exp_cleaned, df_att_cleaned)

        self.df_expected = df_exp_cleaned
        self.df_attendance = df_att_cleaned
        self.df_reconciled = df_reconciled
        self.audit_summary = audit
        self.dataset_meta = recon_stats

    def update_attendance_status(self, record_id: int, new_status: str, note: Optional[str], db: Session) -> Dict[str, Any]:
        """Safely updates an attendance status and triggers backend recalculation."""
        rec = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
        if not rec:
            raise ValueError(f"Attendance record with ID {record_id} not found.")

        old_status = rec.status
        rec.status = new_status
        rec.updated_at = datetime.now(timezone.utc)
        db.commit()

        # Reload from DB and re-evaluate analytics and flags
        self._load_from_db(db)
        detect_anomaly_flags(self.df_reconciled, self.audit_summary, db)

        return {
            "record_id": record_id,
            "student_key": rec.student_key,
            "session_id": rec.session_id,
            "old_status": old_status,
            "new_status": new_status,
            "note": note
        }

    def import_custom_dataset(
        self, 
        expected_csv_content: str, 
        attendance_csv_content: str, 
        db: Session
    ) -> Dict[str, Any]:
        """Validates and imports user-supplied CSV files."""
        df_exp_raw = pd.read_csv(io.StringIO(expected_csv_content))
        df_att_raw = pd.read_csv(io.StringIO(attendance_csv_content))

        # Clean and audit
        df_exp_cleaned, df_att_cleaned, audit = clean_and_audit_data(df_exp_raw, df_att_raw)

        # Wipe and replace
        db.query(ExpectedSession).delete()
        db.query(AttendanceRecord).delete()
        db.commit()

        expected_objects = [
            ExpectedSession(
                student_key=row["student_key"],
                session_id=row["session_id"],
                session_date=row["session_date"],
                course_code=row["course_code"],
                section=row["section"],
                timetable_slot=row["timetable_slot"],
                session_held=bool(row["session_held"])
            )
            for _, row in df_exp_cleaned.iterrows()
        ]
        db.bulk_save_objects(expected_objects)

        attendance_objects = [
            AttendanceRecord(
                student_key=str(row["student_key"]).strip(),
                session_id=str(row["session_id"]).strip(),
                status=str(row["status"]).strip(),
                recorded_at=str(row["recorded_at"]) if pd.notna(row.get("recorded_at")) else None
            )
            for _, row in df_att_raw.iterrows()
        ]
        db.bulk_save_objects(attendance_objects)

        df_reconciled, recon_stats = reconcile_attendance_data(df_exp_cleaned, df_att_cleaned)

        meta = db.query(DatasetMetadata).first()
        if not meta:
            meta = DatasetMetadata(name="Custom Imported Dataset", source_type="csv_upload")
            db.add(meta)
        meta.name = "Custom Uploaded Dataset"
        meta.source_type = "csv_upload"
        meta.total_expected_sessions = recon_stats["total_expected_sessions_held"]
        meta.total_recorded_records = recon_stats["total_recorded_valid"]
        meta.total_students = recon_stats["total_students"]
        meta.date_range_start = recon_stats["date_min"]
        meta.date_range_end = recon_stats["date_max"]
        meta.loaded_at = datetime.now(timezone.utc)
        db.commit()

        detect_anomaly_flags(df_reconciled, audit, db)

        self.df_expected = df_exp_cleaned
        self.df_attendance = df_att_cleaned
        self.df_reconciled = df_reconciled
        self.audit_summary = audit
        self.dataset_meta = recon_stats

        return recon_stats
