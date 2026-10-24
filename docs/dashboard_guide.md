# Dashboard Guide: Smart Attendance Pattern Analyzer

**Document Version:** 1.0.0  
**Target Audience:** Academic Advisors, Department Chairs, Faculty Mentors, and Data Stewards  
**Platform Theme:** Obsidian Aurora Glass  

---

## 1. System Navigation & Architecture

The **Smart Attendance Pattern Analyzer** dashboard is organized into seven specialized workspaces accessible from the fixed 248px left navigation bar:

```
Smart Attendance Pattern Analyzer
├── 1. Overview Dashboard (Executive health & core indicators)
├── 2. Attendance Trends (Time series & consecutive absence streaks)
├── 3. Course & Section Insights (Cohort comparison without ranking)
├── 4. Review Center (Explainable anomaly review & mentor notes)
├── 5. Data Quality & Reconciliation (Missing logs, duplicates, hygiene)
├── 6. Data Explorer & Import (Search, pagination, edit, CSV import)
└── 7. Methodology & Privacy (Formulas, policies, ethics statement)
```

---

## 2. Walkthrough by Screen

### Screen 1: Attendance Overview
- **Header & Global Filters:** Select a specific course (`CS101`, `MATH201`, `ENG102`, `DS301`), section (`SEC-A`, `SEC-B`), or reporting window (`Weeks 1–5`, `Weeks 6–10`, or custom).
- **Core KPI Cards:**
  - *Overall Attendance Rate:* The central attendance percentage calculated according to formula policy. Features baseline delta pills (`+1.8% vs baseline`).
  - *Record Completeness:* The ratio of expected held sessions that have recorded logs. Look for the badge: if completeness drops below 85%, the badge warns **Provisional (Low Completeness)**.
  - *Missing Expected Entries:* Exact count of unrecorded expected student sessions.
  - *Active Review Prompts:* Count of flags requiring attention.
- **Weekly Dynamics Chart:** Interactive curve showing weekly attendance rate with dashed record completeness line and baseline marker. Hover to view detailed session counts.
- **Analytical Synthesis Banner:** Plain-English summary explaining key cohort trends, such as morning slot drops or faculty recording omissions.
- **Status Distribution:** Donut chart breakdown of Present, Late, Absent, Excused, and Missing logs.

### Screen 2: Attendance Trends
- **Granularity Toggle:** Switch between **Weekly** and **Monthly** time series views.
- **Weekday & Slot Histograms:** Visualizes attendance across Monday through Friday and across timetable slots (`08:30-10:00` to `15:00-16:30`). Quickly exposes structural timetable friction (e.g., commute issues during 8:30 AM slots).
- **Consecutive Absence Streaks:** Dedicated cards displaying students who have accumulated $\ge 3$ consecutive unexcused absences across scheduled sessions held, with suggested mentor follow-up actions.

### Screen 3: Course & Section Insights
- **Dual Metric Comparison:** Evaluates Course Attendance Rate alongside Record Completeness.
- **Non-Ranking Principle:** The platform strictly prohibits public student leaderboards or punitive section rankings.
- **Reconciled Course Table:** Displays expected sessions held, valid recorded logs, missing entries, and whether completeness is sufficient to treat figures as reliable.

### Screen 4: Review Center
- **Explainable Anomaly Prompts:** Each item details the rule triggered (`Consecutive Absence Threshold`, `Longitudinal Attendance Drop`, `Session Recording Incompleteness`), target ID (`STU-XXXX` or Course/Section), observed time window, audited evidence, and recommended supportive action.
- **Filtering:** Filter prompts by Category (**Attendance Pattern** vs. **Data Quality**) and Review Status (**Needs Context**, **Data Issue**, **Reviewed**).
- **Interactive Review Workflow:**
  1. Read evidence and threshold.
  2. Input qualitative notes in the text box (e.g., *"Student confirmed transit pass delay"*).
  3. Click **Save** to persist the note to the database.
  4. Click **Needs Context**, **Data Issue**, or **Mark Reviewed** to advance the prompt status.

### Screen 5: Data Quality & Reconciliation
- **Reconciliation Counters:** Summarizes total expected sessions, valid recorded entries, missing entries, duplicates, and malformed dates.
- **Principle: Missing ≠ Absent:** Prominently highlights that missing logs indicate recording or transmission gaps, never student truancy.
- **Data Pipeline Audit Log:** Tabular log showing each discrepancy type, severity, affected row count, and automated system action (e.g. *Deterministic deduplication*, *Exclusion of orphan rows*).

### Screen 6: Data Explorer & Import
- **Search & Filter Records:** Filter by course, section, status, or search by student key / session ID.
- **Safe Inline Amendment:**
  1. Locate the record in the table and click **Amend**.
  2. In the modal, select the amended status (`PRESENT`, `LATE`, `ABSENT`, `EXCUSED`).
  3. Enter an audit note explaining the amendment.
  4. Click **Confirm Amendment**. The backend recalculates dependent cohort metrics, trends, and review flags, and updates the UI immediately.
- **CSV Import Zone:**
  1. Click **Import CSV Datasets**.
  2. Download sample CSV templates if needed (`Expected Template` and `Attendance Template`).
  3. Select your `expected_sessions.csv` and `attendance_records.csv` files.
  4. Click **Validate & Import**. The system audits schemas, checks headers, executes reconciliation, and refreshes the database.

### Screen 7: Methodology & Privacy
- Full mathematical formula references.
- Configured demonstration thresholds.
- Complete data dictionary.
- Institutional ethical guidelines and privacy safeguards.

---

## 3. Frequently Asked Questions (FAQ)

**Q: Why does a student with missing records have an "N/A" attendance rate?**  
*A:* If all scheduled sessions for a student were cancelled, or if no valid logs have been recorded yet, the denominator is zero. The system displays `N/A` rather than `0.0%` to prevent misleading and alarming reports.

**Q: How does the system handle late arrivals?**  
*A:* Under the default institutional policy, late arrivals count as attended sessions (`w_late = 1.0`). If an institution configures late arrivals at partial credit (e.g. `w_late = 0.5`), the calculation engine adjusts automatically.

**Q: Can educators use these flags to deduct grades?**  
*A:* **No.** The platform's ethical charter strictly forbids automated disciplinary sanctions or punitive actions based on anomaly flags. Flags serve solely as supportive prompts for academic advisors to offer assistance.
