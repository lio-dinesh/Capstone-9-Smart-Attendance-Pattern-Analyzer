import {
  KpiSummaryData,
  TrendsData,
  PatternsData,
  CourseComparisonItem,
  QualityReport,
  FlagsResponse,
  RecordsResponse,
  FilterState,
  ReviewStatus,
  AttendanceStatus,
} from '../types';

const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

function buildFilterQuery(filters?: Partial<FilterState>): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.courseCode && filters.courseCode !== 'All Courses' && filters.courseCode !== 'ALL') {
    params.set('course_code', filters.courseCode);
  }
  if (filters.section && filters.section !== 'All Sections' && filters.section !== 'ALL') {
    params.set('section', filters.section);
  }
  if (filters.dateStart) params.set('date_start', filters.dateStart);
  if (filters.dateEnd) params.set('date_end', filters.dateEnd);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export async function fetchSummary(filters?: Partial<FilterState>): Promise<KpiSummaryData> {
  const query = buildFilterQuery(filters);
  const res = await fetch(`${BASE_URL}/dashboard/summary${query}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchTrends(
  filters?: Partial<FilterState>,
  granularity: 'weekly' | 'monthly' = 'weekly'
): Promise<TrendsData> {
  const params = new URLSearchParams();
  if (filters?.courseCode && filters.courseCode !== 'All Courses' && filters.courseCode !== 'ALL') {
    params.set('course_code', filters.courseCode);
  }
  if (filters?.section && filters.section !== 'All Sections' && filters.section !== 'ALL') {
    params.set('section', filters.section);
  }
  if (filters?.dateStart) params.set('date_start', filters.dateStart);
  if (filters?.dateEnd) params.set('date_end', filters.dateEnd);
  params.set('granularity', granularity);

  const res = await fetch(`${BASE_URL}/analytics/trends?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch trends');
  return res.json();
}

export async function fetchPatterns(filters?: Partial<FilterState>): Promise<PatternsData> {
  const query = buildFilterQuery(filters);
  const res = await fetch(`${BASE_URL}/analytics/patterns${query}`);
  if (!res.ok) throw new Error('Failed to fetch attendance patterns');
  return res.json();
}

export async function fetchCourseComparisons(filters?: Partial<FilterState>): Promise<{ courses: CourseComparisonItem[] }> {
  const query = buildFilterQuery(filters);
  const res = await fetch(`${BASE_URL}/analytics/course-comparison${query}`);
  if (!res.ok) throw new Error('Failed to fetch course comparisons');
  return res.json();
}

export async function fetchQualityReport(): Promise<QualityReport> {
  const res = await fetch(`${BASE_URL}/quality/report`);
  if (!res.ok) throw new Error('Failed to fetch data quality report');
  return res.json();
}

export async function fetchFlags(category?: string, status?: string): Promise<FlagsResponse> {
  const params = new URLSearchParams();
  if (category && category !== 'ALL') params.set('category', category);
  if (status && status !== 'ALL') params.set('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${BASE_URL}/flags${query}`);
  if (!res.ok) throw new Error('Failed to fetch flags');
  return res.json();
}

export async function submitFlagReview(flagKey: string, status: ReviewStatus, reviewerNote?: string) {
  const res = await fetch(`${BASE_URL}/flags/${encodeURIComponent(flagKey)}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reviewer_note: reviewerNote || null }),
  });
  if (!res.ok) throw new Error('Failed to submit flag review');
  return res.json();
}

export async function fetchRecords(
  page: number = 1,
  pageSize: number = 20,
  filters?: Partial<FilterState>,
  search?: string,
  status?: string,
  isMissing?: boolean
): Promise<RecordsResponse> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('page_size', pageSize.toString());
  if (filters?.courseCode && filters.courseCode !== 'All Courses' && filters.courseCode !== 'ALL') {
    params.set('course_code', filters.courseCode);
  }
  if (filters?.section && filters.section !== 'All Sections' && filters.section !== 'ALL') {
    params.set('section', filters.section);
  }
  if (search) params.set('search', search);
  if (status && status !== 'All Statuses' && status !== 'ALL') params.set('status', status);
  if (isMissing !== undefined) params.set('is_missing', isMissing.toString());

  const res = await fetch(`${BASE_URL}/records?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch attendance records');
  return res.json();
}

export async function patchAttendanceRecord(recordId: number, status: AttendanceStatus, reviewerNote?: string) {
  const res = await fetch(`${BASE_URL}/attendance/${recordId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reviewer_note: reviewerNote || null }),
  });
  if (!res.ok) throw new Error('Failed to update attendance record');
  return res.json();
}

export async function reloadDemoData() {
  const res = await fetch(`${BASE_URL}/datasets/demo`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reload demo data');
  return res.json();
}

export async function importDatasets(expectedFile: File, attendanceFile: File) {
  const formData = new FormData();
  formData.append('expected_file', expectedFile);
  formData.append('attendance_file', attendanceFile);

  const res = await fetch(`${BASE_URL}/datasets/import`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to import datasets');
  }
  return res.json();
}
