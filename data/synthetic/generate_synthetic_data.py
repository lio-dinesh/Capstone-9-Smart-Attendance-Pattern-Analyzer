"""
Synthetic Academic Attendance Data Generator
Generates realistic, reproducible, anonymized student attendance datasets
with ground-truth anomaly cases and data-quality variations for the
Smart Attendance Pattern Analyzer capstone project.
"""

import os
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

def generate_datasets(output_dir: str = None, seed: int = 42) -> tuple[pd.DataFrame, pd.DataFrame]:
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)

    random.seed(seed)
    np.random.seed(seed)

    # 1. Cohort & Term Configuration
    num_students = 100
    student_keys = [f"STU-{i:04d}" for i in range(1, num_students + 1)]
    term_start = datetime(2026, 9, 7)  # Monday
    num_weeks = 10

    courses = [
        {"code": "CS101", "name": "Intro to Computer Science", "sections": ["SEC-A", "SEC-B"], 
         "schedule": [("Monday", "08:30-10:00"), ("Wednesday", "10:15-11:45")]},
        {"code": "MATH201", "name": "Linear Algebra & Calculus", "sections": ["SEC-A", "SEC-B"], 
         "schedule": [("Tuesday", "10:15-11:45"), ("Thursday", "13:00-14:30")]},
        {"code": "ENG102", "name": "Technical Communication", "sections": ["SEC-A", "SEC-B"], 
         "schedule": [("Monday", "13:00-14:30"), ("Thursday", "08:30-10:00")]},
        {"code": "DS301", "name": "Data Analytics & Inference", "sections": ["SEC-A", "SEC-B"], 
         "schedule": [("Wednesday", "13:00-14:30"), ("Friday", "15:00-16:30")]},
    ]

    day_offsets = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4
    }

    # Assign students to courses and sections
    # E.g., ~50 students per course section
    student_enrollments = []
    for stu in student_keys:
        stu_num = int(stu.split("-")[1])
        # Each student takes 3-4 courses
        enrolled_courses = courses if stu_num % 4 == 0 else courses[:3] if stu_num % 2 == 0 else courses[1:]
        sec = "SEC-A" if (stu_num % 2 == 1) else "SEC-B"
        for c in enrolled_courses:
            student_enrollments.append({
                "student_key": stu,
                "course_code": c["code"],
                "section": sec
            })

    # 2. Build Expected Sessions
    expected_rows = []
    sessions_meta = []

    for week in range(1, num_weeks + 1):
        week_monday = term_start + timedelta(weeks=week - 1)
        for c in courses:
            for sec in c["sections"]:
                for slot_idx, (day_name, time_slot) in enumerate(c["schedule"], start=1):
                    session_date = week_monday + timedelta(days=day_offsets[day_name])
                    session_id = f"SES-{c['code']}-{sec}-W{week:02d}-{slot_idx}"
                    
                    # Intentional cancelled session: Week 5 Monday was a campus holiday
                    session_held = 0 if (week == 5 and day_name == "Monday") else 1

                    sessions_meta.append({
                        "session_id": session_id,
                        "session_date": session_date.strftime("%Y-%m-%d"),
                        "course_code": c["code"],
                        "section": sec,
                        "timetable_slot": time_slot,
                        "session_held": session_held
                    })

                    # Add expected student records
                    eligible_students = [
                        e["student_key"] for e in student_enrollments
                        if e["course_code"] == c["code"] and e["section"] == sec
                    ]
                    for stu in eligible_students:
                        expected_rows.append({
                            "student_key": stu,
                            "session_id": session_id,
                            "session_date": session_date.strftime("%Y-%m-%d"),
                            "course_code": c["code"],
                            "section": sec,
                            "timetable_slot": time_slot,
                            "session_held": session_held
                        })

    df_expected = pd.DataFrame(expected_rows)

    # 3. Build Attendance Records with Realistic & Anomaly Profiles
    # Special labeled cohorts:
    # - Consecutive absence streak: STU-0012, STU-0034 (Absent for 4+ consecutive sessions starting W06)
    # - Sudden drop: STU-0025, STU-0050 (High W01-W04 >90%, low W05-W08 <40%)
    # - Frequent late: STU-0008, STU-0044 (High late rate ~40% of attendance)
    # - Excused medical leave: STU-0018 (Weeks 6-7 marked EXCUSED)
    # - Timetable effect: Early Monday 08:30 and Friday 15:00 have ~15% higher natural absence/lateness across cohort

    attendance_rows = []

    # Sessions where recording was incomplete (e.g. faculty missed recording on DS301 SEC-B in Week 4)
    missing_session_filter = ("DS301", "SEC-B", 4)

    for idx, row in df_expected.iterrows():
        stu = row["student_key"]
        sid = row["session_id"]
        held = row["session_held"]
        course = row["course_code"]
        sec = row["section"]
        slot = row["timetable_slot"]
        date_str = row["session_date"]
        week_num = int(sid.split("-W")[1][:2])

        # If session was cancelled, no attendance was taken
        if held == 0:
            continue

        # Injected Data Quality Issue 1: Missing faculty recording
        if course == missing_session_filter[0] and sec == missing_session_filter[1] and week_num == missing_session_filter[2]:
            # Entire session had no logs submitted (Missing expected records)
            continue

        # Minor sporadic missing entries for other students (1% chance)
        if random.random() < 0.01 and stu not in ["STU-0012", "STU-0025"]:
            continue

        stu_num = int(stu.split("-")[1])
        status = "PRESENT"
        recorded_time = f"{date_str}T{slot.split('-')[0]}:{random.randint(10, 45):02d}"

        # Ground-truth anomaly cases
        if stu in ["STU-0012", "STU-0034"] and week_num >= 6:
            # Streak of absences
            status = "ABSENT"
            recorded_time = ""
        elif stu in ["STU-0025", "STU-0050"]:
            if week_num <= 4:
                status = "PRESENT"
            else:
                status = random.choices(["ABSENT", "LATE", "PRESENT"], weights=[0.65, 0.20, 0.15])[0]
                if status == "ABSENT":
                    recorded_time = ""
        elif stu == "STU-0018" and week_num in [6, 7]:
            status = "EXCUSED"
            recorded_time = f"{date_str}T09:00:00"
        elif stu in ["STU-0008", "STU-0044"]:
            status = random.choices(["PRESENT", "LATE", "ABSENT"], weights=[0.50, 0.40, 0.10])[0]
        else:
            # Baseline realistic probabilities with timetable friction
            p_present = 0.86
            p_late = 0.07
            p_absent = 0.07

            # Early Monday slot penalty
            if "08:30" in slot and "Monday" in slot:
                p_present -= 0.10
                p_late += 0.05
                p_absent += 0.05
            # Friday late afternoon slot penalty
            elif "15:00" in slot:
                p_present -= 0.08
                p_absent += 0.06
                p_late += 0.02

            status = random.choices(["PRESENT", "LATE", "ABSENT", "EXCUSED"], 
                                    weights=[p_present, p_late, p_absent, 0.01])[0]
            if status == "ABSENT":
                recorded_time = ""

        attendance_rows.append({
            "student_key": stu,
            "session_id": sid,
            "status": status,
            "recorded_at": recorded_time
        })

    # Injected Data Quality Issue 2: Duplicate records (2 deliberate duplicates)
    dup_1 = dict(attendance_rows[10])
    dup_2 = dict(attendance_rows[45])
    attendance_rows.append(dup_1)
    attendance_rows.append(dup_2)

    # Injected Data Quality Issue 3: Invalid status string (1 test row)
    attendance_rows.append({
        "student_key": "STU-0099",
        "session_id": "SES-CS101-SEC-A-W02-1",
        "status": "ATTENDED_UNKNOWN",  # Invalid enum
        "recorded_at": "2026-09-14T08:35:00"
    })

    # Injected Data Quality Issue 4: Orphan record (Session doesn't exist)
    attendance_rows.append({
        "student_key": "STU-0088",
        "session_id": "SES-UNKNOWN-W99-1",
        "status": "PRESENT",
        "recorded_at": "2026-10-01T12:00:00"
    })

    df_attendance = pd.DataFrame(attendance_rows)

    # Save CSVs
    expected_path = os.path.join(output_dir, "expected_sessions.csv")
    attendance_path = os.path.join(output_dir, "attendance_records.csv")

    df_expected.to_csv(expected_path, index=False)
    df_attendance.to_csv(attendance_path, index=False)

    print(f"Generated synthetic datasets in {output_dir}:")
    print(f" - Expected records: {len(df_expected):,} rows across {df_expected['session_id'].nunique()} unique sessions")
    print(f" - Attendance records: {len(df_attendance):,} rows")
    print(f" - Unique students: {df_expected['student_key'].nunique()}")

    return df_expected, df_attendance

if __name__ == "__main__":
    generate_datasets()
