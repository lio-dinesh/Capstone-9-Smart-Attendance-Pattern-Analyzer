# Design System Specification: Obsidian Aurora Glass

**Product:** Smart Attendance Pattern Analyzer  
**Design Paradigm:** Obsidian Aurora Glass (Midnight Glassmorphism)  
**Target Viewport:** Desktop (1440px primary), Tablet (768px-1024px), Mobile (<768px)  
**Accessibility Target:** WCAG 2.1 AA / Section 508 Compliant  

---

## 1. Visual Philosophy

The **Obsidian Aurora Glass** visual system evokes a state-of-the-art observatory: calm, deep, dark, and illuminated by celestial data streams.
- **Deep Obsidian Surfaces:** Prevent eye fatigue during prolonged analytical sessions.
- **Selective Glassmorphism:** Translucent surfaces with soft backdrop blur (`backdrop-blur-md` / `16px`), micro-fine borders (`rgba(148, 163, 184, 0.12)`), and multi-layered depth.
- **Aurora Accents:** Primary metrics emerge through vibrant Aurora Jade (`#2DD4BF`) and Ice Cyan (`#67E8F9`), while Iris Violet (`#A78BFA`) provides analytical contrast without alarmism.
- **Supportive Tone:** Yellow/Amber warnings indicate data gaps or context requirements. Red/Coral is reserved strictly for genuine system or data corruption errors—never for stigmatising students.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Surfaces & Backgrounds
| Token Name | Hex / RGBA | Tailwind Alias | Purpose |
| :--- | :--- | :--- | :--- |
| `bg-obsidian-base` | `#080D18` | `bg-[#080D18]` | Canvas background; deepest layer |
| `bg-obsidian-nav` | `#0C1424` | `bg-[#0C1424]` | Persistent sidebar and top navigation |
| `bg-obsidian-card` | `rgba(20, 34, 56, 0.72)` | `bg-[#142238]/75` | Primary glass card container with blur |
| `bg-obsidian-card-hover` | `rgba(28, 48, 78, 0.82)` | `hover:bg-[#1C304E]/80` | Interactive card hover state |
| `bg-obsidian-popover` | `#111C30` | `bg-[#111C30]` | Dropdown menus, tooltips, dialogs |

### 2.2 Accent & Data Visualization Palette
| Token Name | Hex | Semantic Role |
| :--- | :--- | :--- |
| `aurora-jade` | `#2DD4BF` | Primary brand accent; Attended / High Completeness |
| `ice-cyan` | `#67E8F9` | Secondary trend metric; Expected sessions baseline |
| `iris-violet` | `#A78BFA` | Cohort comparisons; Section analytics; Late status |
| `amber-glow` | `#FBBF24` | Needs Context / Warning / Excused records / Incomplete data |
| `coral-rose` | `#FB7185` | Absent status / Critical Data Quality anomalies / Excluded rows |
| `slate-muted` | `#64748B` | Inactive tracks, gridlines, cancelled sessions |

### 2.3 Typography & Foreground Colors
| Token Name | Hex | Usage |
| :--- | :--- | :--- |
| `text-primary` | `#F1F5F9` (Slate 100) | Primary headings, KPI figures, table values |
| `text-secondary` | `#94A3B8` (Slate 400) | Secondary descriptions, column headers, axis labels |
| `text-muted` | `#64748B` (Slate 500) | Captions, timestamps, disabled items, footnotes |
| `border-glass` | `rgba(148, 163, 184, 0.16)` | 1px clean card and divider borders |
| `border-glass-bright`| `rgba(45, 212, 191, 0.35)` | Active item borders, focus rings, selected filters |

---

## 3. Typography Scale & Hierarchy

Font Family: `Inter`, `system-ui`, `-apple-system`, `sans-serif`  
Monospace / Tabular Font: `JetBrains Mono`, `ui-monospace`, `monospace` (used for KPIs, dates, session IDs, and student keys)

| Level | Size | Weight | Line Height | Tracking | Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display KPI** | `32px` (`2rem`) | 700 Bold | `1.1` | `-0.02em` | Metric card hero numbers |
| **H1 Screen Title** | `24px` (`1.5rem`) | 600 SemiBold | `1.2` | `-0.015em` | Page title |
| **H2 Section Title**| `18px` (`1.125rem`) | 600 SemiBold | `1.3` | `-0.01em` | Card headers, chart titles |
| **H3 Card Title** | `15px` (`0.9375rem`)| 500 Medium | `1.4` | `normal` | Sub-sections, modal headers |
| **Body Primary** | `14px` (`0.875rem`)| 400 Regular | `1.5` | `normal` | Table rows, filter labels, body text |
| **Caption / Badge**| `12px` (`0.75rem`) | 500 Medium | `1.4` | `+0.01em` | Status chips, axis labels, tooltips |
| **Micro / Footnote**| `11px` (`0.6875rem`)| 400 Regular | `1.4` | `+0.02em` | Data provenance, timestamp stamps |

---

## 4. Glass Component Architecture

### 4.1 Card Anatomy (`GlassCard`)
```css
.glass-panel {
  background: rgba(20, 34, 56, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
}
```

### 4.2 KPI Metric Card Anatomy
1. **Header Row:** Label (Secondary text 13px) + Icon badge (rounded-lg with 10% accent tint) + Info tooltip.
2. **Value Row:** Large tabular display (32px Bold) + Trend delta pill (e.g., `+2.4% vs 4-wk baseline` or `Provisional`).
3. **Context / Denominator Row:** Micro text indicating sample basis e.g., `Based on 1,420 expected sessions held (98.4% recorded)`.
4. **Mini Sparkline or Micro Progress Bar:** Subtle 4px track showing status distribution or completeness.

### 4.3 Navigation Sidebar (Desktop 248px)
- Fixed left layout with deep `#0C1424` background and fine right border.
- **Brand Header:** Icon (Aurora Jade spark) + Product Title ("Smart Attendance") + Subtitle ("Pattern Analyzer") + "Demo Data" pill.
- **Navigation Items:**
  1. Overview (`LayoutDashboard`)
  2. Attendance Trends (`TrendingUp`)
  3. Course & Section (`BarChart3`)
  4. Review Center (`CheckCircle2`) with badge count
  5. Data Quality (`AlertCircle`) with error/warning indicator
  6. Data Explorer & Import (`Database`)
  7. Methodology & Privacy (`ShieldCheck`)
- **System Footer:** Backend sync indicator (Green pulsating dot), active database mode (`SQLite Dev`), and quick-reset demo data button.

### 4.4 Global Filter Header
Sticky top bar containing:
- Selected course selector dropdown (`All Courses`, `CS101`, `MATH201`, etc.)
- Section selector (`All Sections`, `SEC-A`, `SEC-B`)
- Reporting period selector (`Full Term (10 Wks)`, `Last 4 Weeks`, `Last 2 Weeks`, `Custom Range`)
- Quick Action: Refresh queries / Clear filters
- Dataset Status Indicator: Shows last synchronized timestamp and current row count.

---

## 5. Chart & Data Visualization Guidelines

1. **Recharts Theming:**
   - Backgrounds: transparent.
   - Gridlines: `#1E293B` stroke with `strokeDasharray="3 3"`.
   - Tooltips: Custom HTML glass popover (`#111C30`, 1px border, backdrop-blur) displaying full counts, date, and calculated percentages with explicit denominators.
   - Curves: `monotone` or `linear` with smooth transitions (`transition-all duration-300`).
   - Legends: Clean, horizontal flex with matching colored indicator dots.
2. **Accessibility & Color Independence:**
   - Line series employ distinct stroke styles or point markers (circles, diamonds, squares) to ensure distinguishability under monochromatic or color-deficient viewing.
   - All chart values are accessible via an underlying screen-reader data table or toggleable accessible view.
3. **Heatmap & Timetable Matrix:**
   - 2D grid: Weekday (Monday–Friday) vs. Timetable Slots (`08:30-10:00`, `10:15-11:45`, `13:00-14:30`, `15:00-16:30`).
   - Cells colored on a continuous Aurora Jade opacity scale (0.1 to 0.95) based on attendance percentage, with explicit percentage text displayed in each cell.

---

## 6. Review Center & Human-Led Ethics

The Review Center embodies non-stigmatising, supportive academic guidance:
- **Calm Surface Cards:** Never use aggressive red danger banners. Yellow/amber indicates required context. Blue/cyan indicates timetable factors.
- **Explainability Block:**
  - *Trigger Rule:* Human-readable rule title (e.g., `Consecutive Absences Threshold`).
  - *Threshold Exceeded:* Clear comparison (e.g., `Recorded: 3 consecutive absences vs Threshold: ≥ 3`).
  - *Context Caveat:* `Check if student faced transit disruptions or timetable clashes before individual outreach.`
- **Interactive Review Actions:**
  - Button: `Needs Context` (Amber outline)
  - Button: `Data Issue` (Cyan outline)
  - Button: `Mark Reviewed` (Jade solid)
  - Textarea: Optional reviewer notes (persisted to database with author role).

---

## 7. Responsive Breakpoint Strategy

- **Desktop (≥ 1280px):** Permanent 248px sidebar; 3-column KPI row; 2-column chart grid; full width data tables.
- **Laptop / Tablet Landscape (1024px - 1279px):** 220px sidebar; 2-column KPI row; single or 2-column chart flex.
- **Tablet Portrait (768px - 1023px):** Collapsible sidebar drawer with hamburger trigger; 2-column KPI grid; stacked charts.
- **Mobile (< 768px):** Off-canvas slide-out navigation; 1-column KPI stack; scrollable horizontal chart cards with touch tooltips; responsive card tables.
