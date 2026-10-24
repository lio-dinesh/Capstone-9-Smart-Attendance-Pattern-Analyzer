import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle2, FileQuestion, Copy, AlertOctagon, HelpCircle } from 'lucide-react';
import { fetchQualityReport } from '../services/api';
import { GlassCard } from '../components/common/GlassCard';

export const DataQualityPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['quality-report'],
    queryFn: fetchQualityReport,
  });

  if (isLoading) {
    return <div className="p-8 text-xs text-slate-400">Loading data quality audit...</div>;
  }

  const issues = data?.issues_list || [];

  return (
    <div className="p-8 space-y-8">
      {/* 1. Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Data Quality & Pipeline Integrity</h2>
        <p className="text-xs text-slate-500">
          Continuous reconciliation between scheduled timetable sessions and actual attendance logs received.
        </p>
      </div>

      {/* 2. Quality Metric Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="space-y-2 border-t-4 border-t-teal-500">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Overall Completeness</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {data?.record_completeness_pct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {data?.valid_matched_records.toLocaleString()} valid / {data?.total_expected_records.toLocaleString()} expected held
          </div>
        </GlassCard>

        <GlassCard className="space-y-2 border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Missing Expected Entries</span>
            <FileQuestion className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800">
            {data?.missing_expected_count.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Scheduled sessions without recorded logs
          </div>
        </GlassCard>

        <GlassCard className="space-y-2 border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Duplicate Records</span>
            <Copy className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-800">
            {data?.duplicate_count}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Deterministically resolved to first log
          </div>
        </GlassCard>

        <GlassCard className="space-y-2 border-t-4 border-t-rose-500">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Malformed / Orphan Rows</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-800">
            {(data?.invalid_status_count || 0) + (data?.orphan_record_count || 0) + (data?.invalid_date_count || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Excluded from calculation denominators
          </div>
        </GlassCard>
      </div>

      {/* 3. Non-Punitive Missing Record Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs shadow-xs">
        <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-950">Reconciliation Principle: Missing ≠ Absent</div>
          <p className="text-amber-900/90 leading-relaxed font-normal">
            A student without an attendance entry for a scheduled session cannot be assumed absent. The absence of an attendance entry indicates faculty non-recording, network sync interruption, or physical roster loss. The Smart Attendance Pattern Analyzer isolates missing entries as data gaps and prevents them from artificially deflating attendance percentages.
          </p>
        </div>
      </div>

      {/* 4. Audited Issues Table */}
      <GlassCard className="space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Data Pipeline Audit Log</h3>
          <p className="text-xs text-slate-500">Discrepancies identified during dataset ingestion and validation.</p>
        </div>

        {issues.length === 0 ? (
          <div className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-xl border border-slate-200">
            No pipeline discrepancies detected. Dataset conforms to all schema integrity rules.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                  <th className="py-2.5 px-3 font-bold">Issue Type</th>
                  <th className="py-2.5 px-3 font-bold">Severity</th>
                  <th className="py-2.5 px-3 font-bold">Target / File</th>
                  <th className="py-2.5 px-3 font-bold">Description</th>
                  <th className="py-2.5 px-3 font-bold">Affected Rows</th>
                  <th className="py-2.5 px-3 font-bold">Automated Pipeline Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((iss, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{iss.issue_type}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          iss.severity === 'high'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {iss.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">{iss.target_identifier}</td>
                    <td className="py-3 px-3 text-slate-700 max-w-sm leading-relaxed font-normal">{iss.description}</td>
                    <td className="py-3 px-3 font-mono text-slate-900 font-bold">{iss.affected_rows}</td>
                    <td className="py-3 px-3 text-teal-700 font-mono font-bold text-[11px]">{iss.system_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 5. Course-by-Course Completeness Breakdown */}
      <GlassCard className="space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Course Completeness Breakdown</h3>
          <p className="text-xs text-slate-500">Section-level inspection of recorded versus missing session logs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.breakdown_by_course.map((b) => (
            <div
              key={`${b.course_code}-${b.section}`}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between font-mono font-bold">
                <span className="text-slate-900 text-sm">{b.course_code}</span>
                <span className="text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{b.section}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-600 font-medium">Completeness:</span>
                <span
                  className={`font-mono font-bold ${
                    b.completeness_rate >= 85 ? 'text-teal-700' : 'text-amber-800'
                  }`}
                >
                  {b.completeness_rate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    b.completeness_rate >= 85 ? 'bg-teal-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${b.completeness_rate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
                <span>Recorded: {b.recorded_count}</span>
                <span className={b.missing_count > 0 ? 'text-amber-800 font-bold' : ''}>
                  Missing: {b.missing_count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
