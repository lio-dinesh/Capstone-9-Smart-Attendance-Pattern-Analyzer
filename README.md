# Smart Attendance Pattern Analyzer

A privacy-preserving academic attendance intelligence platform engineered to discover time-based attendance patterns, clean inconsistent records, calculate mathematically rigorous metrics, detect explainable anomalies, and support proactive, human-led academic interventions without punitive student surveillance.

---

## 🌟 Visual Theme: Obsidian Aurora Glass

Designed with an enterprise midnight glassmorphism design:
- **Base Canvas:** Deep Midnight `#080D18`
- **Surfaces & Sidebar:** Navigation Navy `#0C1424` with elevated glass cards (`rgba(20, 34, 56, 0.72)`)
- **Accents:** Aurora Jade (`#2DD4BF`), Ice Cyan (`#67E8F9`), and Iris Violet (`#A78BFA`)
- **Typography:** Inter (Headings/Body) and JetBrains Mono (Tabular analytics figures)
- **Contrast & Accessibility:** Full WCAG 2.1 AA compliance with dual color-and-marker data visualizations

---

## 🚀 Key Features

1. **Reconciliation-First Ingestion Pipeline:**
   - Matches official scheduled timetable sessions (`expected_sessions.csv`) against recorded instructor logs (`attendance_records.csv`).
   - Distinguishes unsubmitted faculty logs from student absences, preventing unfair grade penalties.
   - Audits invalid dates, unrecognized status enums, duplicate composite keys, and orphan logs.
2. **Mathematically Rigorous Calculation Engine:**
   - Formula: $\text{Rate} = \frac{\text{PRESENT} + (w_{\text{late}} \cdot \text{LATE})}{\text{PRESENT} + \text{LATE} + \text{ABSENT}} \times 100$
   - Formally excludes excused absences and unrecorded missing sessions from the denominator.
   - Features zero-denominator safeguards (outputs `N/A`) and record completeness health checks.
3. **Transparent, Explainable Anomaly Rules:**
   - `RULE-ABS-STREAK`: Detects $\ge 3$ consecutive unexcused absences on scheduled sessions held.
   - `RULE-ATT-DROP`: Flags rolling 2-week attendance drops of $\ge 15.0\%$ versus prior 4-week baseline.
   - `RULE-MISSING-BURST`: Identifies course sections with $\ge 10.0\%$ unrecorded records as **Data Quality** issues.
   - `RULE-DATA-INTEGRITY`: Alerts on duplicate entries or malformed dates.
4. **Interactive 7-Screen Dashboard:**
   - **Overview:** Executive KPIs, weekly trend line, status donut, quick timetable preview, analytical synthesis.
   - **Attendance Trends:** Weekly/monthly time series, weekday/slot distributions, consecutive absence patterns.
   - **Course & Section Insights:** Side-by-side attendance rate vs. completeness comparison without leaderboards.
   - **Review Center:** Human-led review cards, persistent reviewer notes, and status workflows (`Needs context`, `Data issue`, `Reviewed`).
   - **Data Quality:** Pipeline audit logs, duplicate resolution, course completeness health.
   - **Data Explorer & Import:** Paginated pseudonymous record table, search, inline safe amendment with immediate recalculation, and CSV file upload zone.
   - **Methodology & Privacy:** Complete formula references, active thresholds, data dictionary, and ethical statement.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Recharts, Lucide Icons, TanStack Query v5
- **Backend:** Python 3.14, FastAPI, Uvicorn, SQLAlchemy 2.0, pandas, NumPy, Pydantic v2
- **Persistence:** SQLite for local execution; compatible with PostgreSQL via `DATABASE_URL`
- **Testing:** pytest + httpx TestClient (15 passed tests)
- **Analytics Notebook:** Jupyter Notebook (`notebooks/attendance_analysis.ipynb`) with reproducible data cleaning and plots

---

## ⚡ Quick Start Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ and npm (Tested on Node v24)

### 1. Backend Setup & Startup

```bash
# 1. Create and activate virtual environment
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
# source .venv/bin/activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Launch FastAPI backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start at `http://127.0.0.1:8000`. OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup & Startup

In a separate terminal window:

```bash
cd frontend

# 1. Install npm dependencies
npm install

# 2. Run local development server
npm run dev
```
The frontend will start at `http://localhost:5173`. Open your browser to view the interactive application.

---

## 🧪 Running Automated Tests

Run the full backend test suite with pytest:

```bash
# From workspace root
.\.venv\Scripts\pytest backend\tests
```
All 15 tests verify data cleaning, hand-calculated metrics, streak detection, note preservation, and REST endpoints.

---

## 📁 Repository Structure

```
.
├── .env.example
├── .gitignore
├── README.md
├── PROJECT_SPEC.md
├── DESIGN.md
├── data/
│   ├── templates/
│   │   ├── expected_sessions_template.csv
│   │   └── attendance_records_template.csv
│   └── synthetic/
│       ├── expected_sessions.csv
│       ├── attendance_records.csv
│       └── generate_synthetic_data.py
├── docs/
│   ├── data_dictionary.md
│   ├── dashboard_guide.md
│   ├── privacy_responsible_use.md
│   ├── flag_validation.md
│   └── final_report.md
├── notebooks/
│   └── attendance_analysis.ipynb
├── backend/
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── api/
│   └── tests/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.tsx
        ├── index.css
        ├── components/
        ├── pages/
        ├── services/
        └── types/
```

---

## 📄 License & Responsible Use

Developed for academic capstone purposes under a privacy-preserving and non-punitive educational research framework. All data included is completely synthetic.
