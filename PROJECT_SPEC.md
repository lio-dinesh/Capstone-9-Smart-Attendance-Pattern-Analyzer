# Project Specification: Smart Attendance Pattern Analyzer

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Role:** Principal Software Architect & Lead Full-Stack Analytics Engineer  
**Theme:** Obsidian Aurora Glass  

---

## 1. Executive Summary & Capstone Mission

The **Smart Attendance Pattern Analyzer** is a privacy-preserving academic attendance intelligence platform engineered to:
1. Discover longitudinal, cyclical, and timetable-correlated attendance patterns across academic cohorts.
2. Ingest, audit, and clean inconsistent attendance records, reconciling expected scheduled sessions with actual recorded entries.
3. Calculate mathematically rigorous, transparent metrics (weekly/monthly trends, record completeness, streak indicators, and timetable distributions).
4. Apply explainable, configurable anomaly-detection rules that produce human-actionable prompts rather than punitive black-box risk scores.
5. Provide educators and academic support advisors with an interactive, accessible dashboard to facilitate early, supportive human-led interventions.
6. Safeguard student dignity through pseudonymisation, strict access boundaries, and clear contextual disclaimers.

---

## 2. Core Architectural Principles

- **Reconciliation-First Data Model:** Attendance status cannot be evaluated in isolation. A recorded entry is meaningful only relative to an expected scheduled session that was actually held. Missing records are explicitly treated as *unknown* data-quality gaps, never silently converted into absences.
- **Explainability Over Black-Box Surveillance:** Every anomaly flag is tied to a human-readable rule, specific triggering threshold, and audited evidence. The system rejects opaque individual scoring or automated punitive sanctions.
- **Supportive Follow-Up Paradigm:** Attendance variations often stem from scheduling friction (e.g., early Monday slots, multi-hour gaps), transit challenges, or recording delays. The system prioritises cohort and timetable insights before individual outreach.
- **Obsidian Aurora Glass Visual Standard:** Built with an enterprise dark aesthetic featuring `#080D18` midnight surfaces, `#2DD4BF` Aurora Jade accents, `#A78BFA` Iris Violet comparisons, and calibrated glassmorphism with high contrast (WCAG AAA/AA).

---

## 3. Technology Stack & Component Mapping

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite | High-performance reactive client application |
| **Styling & Theme** | Tailwind CSS + Custom Obsidian Glass Tokens | Design system implementation with responsive layout |
| **UI Primitives** | Radix-style accessible primitives + Lucide Icons | Accessible dialogs, dropdowns, tooltips, and iconography |
| **Data Visualisation** | Recharts (Responsive SVG) | Trends, course comparisons, timetable heatmaps, status breakdowns |
| **State & Data Fetching** | TanStack Query v5 | Cache management, reactive query invalidation on mutation |
| **Backend Framework** | Python 3.14 + FastAPI + Uvicorn | High-performance async REST API with OpenAPI documentation |
| **Data Engine** | pandas + NumPy + Pydantic v2 | Reconciled analytics pipeline, schema parsing, and metric calculations |
| **Persistence Layer** | SQLAlchemy 2.0 (SQLite / PostgreSQL) | Relational store for expected sessions, attendance records, and review audits |
| **Testing** | pytest + Vitest / Playwright / automated browser | Unit, integration, calculation verification, and end-to-end UI tests |
| **Research & Analysis** | Jupyter Notebook + Matplotlib | Reproducible data cleaning, statistical validation, and report generation |

---

## 4. Reconciled Data Model & Schemas

### 4.1 Expected Sessions (`expected_sessions.csv`)
Represents the official timetable schedule indicating which students were expected at specific sessions.
- `student_key` (string, opaque fictional ID e.g., `STU-0104`)
- `session_id` (string, unique session key e.g., `SES-CS101-W01-1`)
- `session_date` (ISO date `YYYY-MM-DD`)
- `course_code` (e.g., `CS101`, `MATH201`, `ENG102`, `DS301`)
- `section` (e.g., `SEC-A`, `SEC-B`)
- `timetable_slot` (e.g., `08:30-10:00`, `10:15-11:45`, `13:00-14:30`, `15:00-16:30`)
- `session_held` (boolean `1`/`0` or `true`/`false`; cancelled sessions are excluded from denominator)

### 4.2 Attendance Records (`attendance_records.csv`)
Represents logs recorded by faculty or automated check-in systems.
- `student_key` (string)
- `session_id` (string)
- `status` (enum: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`)
- `recorded_at` (ISO datetime string, optional if absent)

### 4.3 Reconciled Composite Key & Status Reconciliation
Composite Primary Key: `(student_key, session_id)`
Reconciliation Outcomes:
1. **Recorded Valid:** Key matches an expected session held; valid status recorded.
2. **Missing Entry (`MISSING`):** Key exists in expected sessions held, but no entry exists in recorded logs. Reported as data quality gap.
3. **Duplicate Record:** Key appears multiple times in recorded logs. Handled by flagging as an audit anomaly; deduplicated deterministically.
4. **Orphan Record:** Key exists in recorded logs but has no matching expected session held. Excluded with an import warning.
5. **Cancelled Session:** Expected session with `session_held == False`. Excluded from attendance rate calculations.

---

## 5. Metric Calculation Engine & Edge Case Policy

### 5.1 Metric Formats & Formulas
- **Default Attendance Rate (%):**
  $$\text{Attendance Rate} = \frac{N_{\text{PRESENT}} + (w_{\text{LATE}} \cdot N_{\text{LATE}})}{N_{\text{PRESENT}} + N_{\text{LATE}} + N_{\text{ABSENT}}} \times 100$$
  *Default configuration:* Late weight $w_{\text{LATE}} = 1.0$ (late counts as attended session under institution baseline; configurable to $0.5$ or $0.0$).
- **Excused Exclusion:**
  `EXCUSED` entries are formally excluded from the denominator. They do not penalise students nor inflate unearned attendance.
- **Data Completeness (%):**
  $$\text{Record Completeness} = \frac{N_{\text{Recorded Valid}}}{N_{\text{Expected Sessions Held}}} \times 100$$
- **Missing Entries Metric:**
  $$N_{\text{Missing}} = N_{\text{Expected Sessions Held}} - N_{\text{Recorded}}$$
  Missing entries are isolated in data quality reports. If completeness drops below 85%, attendance figures are flagged as **Provisional (Low Completeness)**.
- **Zero Denominator Safeguard:**
  If $N_{\text{PRESENT}} + N_{\text{LATE}} + N_{\text{ABSENT}} = 0$, rate returns `None` / `N/A`, avoiding division-by-zero artifacts.

---

## 6. Explainable Anomaly Detection Rules

The engine implements four transparent, configurable rules:

1. **RULE-ABS-STREAK (Consecutive Absences):**
   - *Trigger:* $\ge 3$ consecutive `ABSENT` records across chronological scheduled sessions held.
   - *Purpose:* Timely alert for sudden disengagement or personal distress requiring pastoral check-in.
2. **RULE-ATT-DROP (Significant Longitudinal Drop):**
   - *Trigger:* Current 2-week rolling attendance rate declines by $\ge 15.0$ percentage points compared to prior 4-week baseline.
   - *Condition:* Both periods must satisfy minimum sample size ($N \ge 4$ sessions) and record completeness ($\ge 80\%$).
3. **RULE-MISSING-BURST (Data Incompleteness Anomaly):**
   - *Trigger:* $\ge 10.0\%$ missing expected records across a course-section or single session.
   - *Classification:* Categorised strictly as a **Data Quality Issue**, shielding students from misattribution.
4. **RULE-DATA-INTEGRITY (Malformed / Duplicate Records):**
   - *Trigger:* Unparseable dates, invalid enum statuses, or duplicate composite keys.
   - *Classification:* Data pipeline audit alert for administrative correction.

---

## 7. REST API Contract Overview

- `GET /api/health` — System status, database connection, dataset metadata
- `GET /api/dashboard/summary` — High-level KPIs with global filter parameters (`course_code`, `section`, `date_start`, `date_end`)
- `GET /api/analytics/trends` — Weekly and monthly time series
- `GET /api/analytics/patterns` — Weekday distribution and timetable slot analysis
- `GET /api/analytics/course-comparison` — Course and section breakdown with completeness comparison
- `GET /api/quality/report` — Discrepancy counts, duplicates, missing expected sessions, invalid entries
- `GET /api/flags` — Active anomaly flags with review statuses and human notes
- `POST /api/flags/{flag_key}/review` — Update review status (`Needs context`, `Data issue`, `Reviewed`) with note
- `GET /api/records` — Paginated, filterable student session table with reconciliation details
- `PATCH /api/attendance/{record_id}` — Safely correct recorded attendance status and trigger re-calculation
- `POST /api/datasets/demo` — Reset to verified synthetic benchmark dataset
- `POST /api/datasets/import` — Ingest custom CSV datasets with pre-validation preview
- `GET /api/datasets/templates/{kind}` — Download clean CSV templates (`expected` or `attendance`)
- `GET /api/exports/summary` — Aggregated anonymised cohort report (no student PII)

---

## 8. Privacy, Ethics & Human Oversight Safeguards

1. **Strict Pseudonymisation:** Student records use opaque identifiers (`STU-XXXX`). No names, emails, addresses, or demographics are collected or stored.
2. **Non-Automated Sanctions:** Flags never trigger automated disciplinary measures or grade penalties. They serve strictly as advisory prompts for academic mentors.
3. **Institutional Accountability:** Low attendance clustered around early morning or Friday late slots indicates structural timetable friction rather than individual deficit.
4. **Audit Trail:** Every status correction and reviewer note records a timestamp and actor role for academic integrity.
