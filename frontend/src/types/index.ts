export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'MISSING';

export type ReviewStatus = 'Needs context' | 'Data issue' | 'Reviewed';

export interface FilterState {
  courseCode: string;
  section: string;
  dateStart: string;
  dateEnd: string;
}

export interface KpiSummaryData {
  overall_attendance_rate: number | null;
  rate_status_label: string;
  completeness_rate: number;
  total_expected_sessions_held: number;
  total_recorded_valid: number;
  missing_entries: number;
  active_flags_count: number;
  baseline_delta_pct: number | null;
  comparison_period_label: string;
  status_counts: {
    PRESENT: number;
    LATE: number;
    ABSENT: number;
    EXCUSED: number;
    MISSING: number;
  };
}

export interface TrendPoint {
  period: string;
  date_start: string;
  attendance_rate: number | null;
  completeness_rate: number;
  expected_count: number;
  attended_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  missing_count: number;
}

export interface TrendsData {
  granularity: 'weekly' | 'monthly';
  points: TrendPoint[];
  comparison_baseline_rate: number | null;
}

export interface HeatmapCell {
  weekday: string;
  timetable_slot: string;
  attendance_rate: number | null;
  total_held: number;
  attended_count: number;
  absent_count: number;
  sample_size: number;
}

export interface PatternsData {
  weekday_distribution: Array<{
    weekday: string;
    attendance_rate: number | null;
    held_count: number;
    attended_count: number;
    absent_count: number;
    late_count: number;
  }>;
  slot_distribution: Array<{
    timetable_slot: string;
    attendance_rate: number | null;
    held_count: number;
    attended_count: number;
    absent_count: number;
    late_count: number;
  }>;
  timetable_heatmap: HeatmapCell[];
  detected_friction_notes: string[];
}

export interface CourseComparisonItem {
  course_code: string;
  section: string;
  attendance_rate: number | null;
  completeness_rate: number;
  expected_sessions_held: number;
  recorded_sessions: number;
  missing_count: number;
  status_counts: {
    PRESENT: number;
    LATE: number;
    ABSENT: number;
    EXCUSED: number;
    MISSING: number;
  };
  is_provisional: boolean;
}

export interface ReviewFlag {
  id: number;
  flag_key: string;
  category: 'Attendance Pattern' | 'Data Quality';
  rule_name: string;
  target_id: string;
  period: string;
  evidence: string;
  threshold_description: string;
  suggested_action: string;
  status: ReviewStatus;
  reviewer_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlagsResponse {
  total: number;
  needs_context_count: number;
  data_issue_count: number;
  reviewed_count: number;
  flags: ReviewFlag[];
}

export interface QualityIssueItem {
  issue_type: string;
  severity: 'high' | 'medium' | 'low';
  target_identifier: string;
  description: string;
  affected_rows: number;
  system_action: string;
}

export interface QualityReport {
  total_expected_records: number;
  total_recorded_records: number;
  valid_matched_records: number;
  missing_expected_count: number;
  duplicate_count: number;
  invalid_status_count: number;
  invalid_date_count: number;
  orphan_record_count: number;
  record_completeness_pct: number;
  completeness_status: string;
  breakdown_by_course: Array<{
    course_code: string;
    section: string;
    expected_count: number;
    recorded_count: number;
    missing_count: number;
    completeness_rate: number;
  }>;
  issues_list: QualityIssueItem[];
}

export interface ReconciledRecord {
  id: number | null;
  student_key: string;
  session_id: string;
  session_date: string;
  course_code: string;
  section: string;
  timetable_slot: string;
  session_held: boolean;
  status: AttendanceStatus;
  recorded_at: string | null;
  is_missing: boolean;
  reconciliation_status: string;
}

export interface RecordsResponse {
  records: ReconciledRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
