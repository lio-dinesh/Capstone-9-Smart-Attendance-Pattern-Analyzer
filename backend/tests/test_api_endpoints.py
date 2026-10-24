import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["dataset_loaded"] is True

def test_dashboard_summary_endpoint():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "overall_attendance_rate" in data
    assert "completeness_rate" in data
    assert "total_expected_sessions_held" in data
    assert "status_counts" in data
    assert data["total_expected_sessions_held"] > 0

def test_analytics_trends_and_patterns_endpoints():
    res_trends = client.get("/api/analytics/trends?granularity=weekly")
    assert res_trends.status_code == 200
    trends_data = res_trends.json()
    assert len(trends_data["points"]) > 0

    res_patterns = client.get("/api/analytics/patterns")
    assert res_patterns.status_code == 200
    patterns_data = res_patterns.json()
    assert len(patterns_data["weekday_distribution"]) > 0
    assert len(patterns_data["timetable_heatmap"]) > 0

def test_course_comparison_endpoint():
    response = client.get("/api/analytics/course-comparison")
    assert response.status_code == 200
    data = response.json()
    assert len(data["courses"]) > 0
    first_course = data["courses"][0]
    assert "course_code" in first_course
    assert "section" in first_course

def test_data_quality_report_endpoint():
    response = client.get("/api/quality/report")
    assert response.status_code == 200
    data = response.json()
    assert "total_expected_records" in data
    assert "duplicate_count" in data
    assert "issues_list" in data

def test_flags_review_workflow():
    # 1. Fetch flags
    res_flags = client.get("/api/flags")
    assert res_flags.status_code == 200
    flags_data = res_flags.json()
    assert len(flags_data["flags"]) > 0
    target_flag = flags_data["flags"][0]
    flag_key = target_flag["flag_key"]

    # 2. Review flag
    review_payload = {
        "status": "Reviewed",
        "reviewer_note": "Verified student attendance records with department admin."
    }
    res_review = client.post(f"/api/flags/{flag_key}/review", json=review_payload)
    assert res_review.status_code == 200
    assert res_review.json()["success"] is True

    # 3. Verify updated state
    res_flags_after = client.get("/api/flags")
    updated_flag = next(f for f in res_flags_after.json()["flags"] if f["flag_key"] == flag_key)
    assert updated_flag["status"] == "Reviewed"
    assert "Verified student attendance records" in updated_flag["reviewer_note"]

def test_records_table_and_patch_update():
    # 1. Fetch records
    res_rec = client.get("/api/records?page=1&page_size=10")
    assert res_rec.status_code == 200
    data = res_rec.json()
    assert len(data["records"]) > 0
    # Find a record with an ID (recorded attendance)
    editable_rec = next((r for r in data["records"] if r["id"] is not None), None)
    assert editable_rec is not None

    record_id = editable_rec["id"]
    current_status = editable_rec["status"]
    new_status = "LATE" if current_status != "LATE" else "PRESENT"

    # 2. Patch amendment
    res_patch = client.patch(
        f"/api/attendance/{record_id}",
        json={"status": new_status, "reviewer_note": "Medical slip provided by student."}
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["success"] is True
    assert res_patch.json()["data"]["new_status"] == new_status

def test_download_templates_and_export_summary():
    res_exp_tpl = client.get("/api/datasets/templates/expected")
    assert res_exp_tpl.status_code == 200
    assert "student_key,session_id" in res_exp_tpl.text

    res_att_tpl = client.get("/api/datasets/templates/attendance")
    assert res_att_tpl.status_code == 200
    assert "student_key,session_id,status" in res_att_tpl.text

    res_export = client.get("/api/exports/summary")
    assert res_export.status_code == 200
    assert "Smart Attendance Pattern Analyzer" in res_export.text
