import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, BookOpen } from 'lucide-react';
import { fetchCourseComparisons } from '../services/api';
import { FilterState, CourseComparisonItem } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { CourseBarChart } from '../components/charts/CourseBarChart';
import { formatPct } from '../lib/utils';

interface CourseInsightsPageProps {
  filters: FilterState;
}

export const CourseInsightsPage: React.FC<CourseInsightsPageProps> = ({ filters }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['course-comparisons', filters],
    queryFn: () => fetchCourseComparisons(filters),
  });

  if (isLoading) {
    return <div className="p-8 text-xs text-slate-400">Loading course analytics...</div>;
  }

  const courses = data?.courses || [];

  return (
    <div className="p-8 space-y-8">
      {/* 1. Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Course & Section Structural Insights</h2>
        <p className="text-xs text-slate-500">
          Compare cohort engagement and identify recording anomalies or timetable friction without student rankings.
        </p>
      </div>

      {/* 2. Primary Comparison Chart */}
      <GlassCard className="space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Attendance Rate vs Record Completeness</h3>
          <p className="text-xs text-slate-500">
            Evaluating cohort attendance against the percentage of submitted session records.
          </p>
        </div>
        <CourseBarChart data={courses} height={300} />
      </GlassCard>

      {/* 3. Detailed Course Comparison Table */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Course-Section Reconciled Inventory</h3>
            <p className="text-xs text-slate-500">
              Breakdown of expected sessions held, recorded attendance entries, and completeness status.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                <th className="py-2.5 px-3 font-bold">Course Code</th>
                <th className="py-2.5 px-3 font-bold">Section</th>
                <th className="py-2.5 px-3 font-bold">Attendance Rate</th>
                <th className="py-2.5 px-3 font-bold">Completeness</th>
                <th className="py-2.5 px-3 font-bold">Expected Held</th>
                <th className="py-2.5 px-3 font-bold">Recorded Valid</th>
                <th className="py-2.5 px-3 font-bold">Missing Entries</th>
                <th className="py-2.5 px-3 font-bold">Data Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((item: CourseComparisonItem) => (
                <tr key={`${item.course_code}-${item.section}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    <span>{item.course_code}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-mono font-medium">{item.section}</td>
                  <td className="py-3 px-3 font-mono font-bold text-teal-700">
                    {formatPct(item.attendance_rate)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-purple-700">
                    {item.completeness_rate.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">{item.expected_sessions_held}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{item.recorded_sessions}</td>
                  <td className="py-3 px-3 font-mono text-amber-800 font-bold">
                    {item.missing_count > 0 ? item.missing_count : '—'}
                  </td>
                  <td className="py-3 px-3">
                    {item.is_provisional ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Provisional (&lt;85%)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span>Reliable</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* 4. Responsible Use Context Card */}
      <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-slate-700 flex items-start gap-3 shadow-xs">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sky-950">Contextual Interpretation Protocol</div>
          <p className="text-slate-600 leading-relaxed font-normal">
            Attendance rate differences between courses or sections must be contextualised by timetable slots (e.g. early morning or Friday late sessions) and record completeness. Never rank sections as &quot;better&quot; or &quot;worse&quot;. A section with 78% attendance and 65% completeness is subject to data capture gaps rather than student truancy.
          </p>
        </div>
      </div>
    </div>
  );
};
