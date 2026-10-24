import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle, AlertTriangle, FileWarning, ArrowUpRight, TrendingUp } from 'lucide-react';
import { fetchSummary, fetchTrends, fetchCourseComparisons, fetchPatterns } from '../services/api';
import { FilterState } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { GlassCard } from '../components/common/GlassCard';
import { TrendLineChart } from '../components/charts/TrendLineChart';
import { CourseBarChart } from '../components/charts/CourseBarChart';
import { StatusDonutChart } from '../components/charts/StatusDonutChart';
import { TimetableHeatmap } from '../components/charts/TimetableHeatmap';
import { formatPct } from '../lib/utils';
import { NavPage } from '../components/layout/Sidebar';

interface OverviewPageProps {
  filters: FilterState;
  onNavigate: (page: NavPage) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ filters, onNavigate }) => {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['summary', filters],
    queryFn: () => fetchSummary(filters),
  });

  const { data: trends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['trends', filters, 'weekly'],
    queryFn: () => fetchTrends(filters, 'weekly'),
  });

  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['course-comparisons', filters],
    queryFn: () => fetchCourseComparisons(filters),
  });

  const { data: patterns } = useQuery({
    queryKey: ['patterns', filters],
    queryFn: () => fetchPatterns(filters),
  });

  if (isSummaryLoading || isTrendsLoading || isCoursesLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-200/70 animate-pulse border border-slate-200" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-slate-200/70 animate-pulse border border-slate-200" />
      </div>
    );
  }

  const deltaText = summary?.baseline_delta_pct !== null && summary?.baseline_delta_pct !== undefined
    ? `${summary.baseline_delta_pct >= 0 ? '+' : ''}${summary.baseline_delta_pct.toFixed(1)}% vs baseline`
    : 'Benchmark period';

  const deltaVariant = (summary?.baseline_delta_pct ?? 0) >= 0 ? 'positive' : 'negative';

  return (
    <div className="p-8 space-y-8">
      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Overall Attendance Rate"
          value={formatPct(summary?.overall_attendance_rate)}
          subtitle={`Based on ${summary?.total_expected_sessions_held?.toLocaleString()} expected sessions held`}
          icon={TrendingUp}
          accentColor="teal"
          badge={{
            text: deltaText,
            variant: deltaVariant,
          }}
          tooltip="Calculated as (PRESENT + 1.0*LATE) / (PRESENT + LATE + ABSENT) * 100. Excused entries and unrecorded missing entries are excluded from the denominator."
        />

        <KpiCard
          title="Record Completeness"
          value={formatPct(summary?.completeness_rate)}
          subtitle={`${summary?.total_recorded_valid?.toLocaleString()} recorded of ${summary?.total_expected_sessions_held?.toLocaleString()} expected`}
          icon={CheckCircle}
          accentColor="cyan"
          badge={{
            text: summary?.rate_status_label || 'Normal',
            variant: summary?.rate_status_label === 'Normal' ? 'positive' : 'warning',
          }}
          tooltip="Percentage of scheduled held student-sessions that have received valid recorded attendance logs. Figures below 85% are labeled provisional."
        />

        <KpiCard
          title="Missing Expected Entries"
          value={summary?.missing_entries?.toLocaleString() ?? 0}
          subtitle="Reconciled expected sessions lacking recorded faculty submissions"
          icon={FileWarning}
          accentColor="amber"
          badge={{
            text: (summary?.missing_entries ?? 0) > 0 ? 'Data Gap' : 'Complete',
            variant: (summary?.missing_entries ?? 0) > 0 ? 'warning' : 'neutral',
          }}
          tooltip="Missing records represent unknown data capture gaps, not confirmed student absences. Treated as data quality alerts."
        />

        <KpiCard
          title="Active Review Prompts"
          value={summary?.active_flags_count ?? 0}
          subtitle="Unresolved patterns or data-quality anomalies awaiting human review"
          icon={AlertTriangle}
          accentColor="rose"
          badge={{
            text: 'Needs Review',
            variant: (summary?.active_flags_count ?? 0) > 0 ? 'warning' : 'neutral',
          }}
          tooltip="Explainable, rule-based alerts highlighting consecutive absences or substantial longitudinal declines for mentor follow-up."
        />
      </div>

      {/* 2. Analytical Insights Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-teal-50 via-emerald-50 to-indigo-50 border border-teal-200/90 flex flex-col sm:flex-row items-start justify-between gap-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse shadow-sm shadow-teal-500/50" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
              Supportive Analytical Synthesis
            </h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed max-w-4xl">
            Longitudinal trends indicate high overall cohort engagement (85%+), with attendance dips concentrated in early Monday 08:30 slots and late Friday sessions. A faculty recording gap in DS301 Section B contributed to <span className="font-bold text-amber-700">{summary?.missing_entries} missing expected records</span>; this has been classified strictly as a data-quality audit rather than individual student disengagement.
          </p>
        </div>
        <button
          onClick={() => onNavigate('review')}
          className="shrink-0 flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-900 bg-white/90 hover:bg-white border border-teal-200 px-3 py-1.5 rounded-lg transition-all shadow-xs"
        >
          <span>Open Review Center</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Main Trend Chart & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Weekly Attendance Dynamics</h2>
              <p className="text-xs text-slate-500">
                Attendance rate compared with record completeness across term weeks
              </p>
            </div>
            <button
              onClick={() => onNavigate('trends')}
              className="text-xs text-teal-700 hover:text-teal-900 flex items-center gap-1 font-bold"
            >
              <span>Explore Trends</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <TrendLineChart
            data={trends?.points || []}
            baselineRate={trends?.comparison_baseline_rate}
            height={280}
          />
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Session Status Distribution</h2>
            <p className="text-xs text-slate-500">Total session logs breakdown</p>
          </div>
          {summary?.status_counts && (
            <StatusDonutChart statusCounts={summary.status_counts} height={220} />
          )}
        </GlassCard>
      </div>

      {/* 4. Course Comparison & Timetable Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Course & Section Comparison</h2>
              <p className="text-xs text-slate-500">Aggregate attendance and data completeness side-by-side</p>
            </div>
            <button
              onClick={() => onNavigate('courses')}
              className="text-xs text-teal-700 hover:text-teal-900 flex items-center gap-1 font-bold"
            >
              <span>View All Courses</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <CourseBarChart data={courses?.courses || []} height={260} />
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Timetable Heatmap (Weekly Friction)</h2>
            <p className="text-xs text-slate-500">Attendance percentages by scheduled day and time slot</p>
          </div>
          <TimetableHeatmap
            cells={patterns?.timetable_heatmap || []}
            frictionNotes={patterns?.detected_friction_notes}
          />
        </GlassCard>
      </div>
    </div>
  );
};
