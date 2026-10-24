import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, AlertCircle } from 'lucide-react';
import { fetchTrends, fetchPatterns, fetchFlags } from '../services/api';
import { FilterState } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { TrendLineChart } from '../components/charts/TrendLineChart';

interface TrendsPageProps {
  filters: FilterState;
}

export const TrendsPage: React.FC<TrendsPageProps> = ({ filters }) => {
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('weekly');

  const { data: trends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['trends', filters, granularity],
    queryFn: () => fetchTrends(filters, granularity),
  });

  const { data: patterns, isLoading: isPatternsLoading } = useQuery({
    queryKey: ['patterns', filters],
    queryFn: () => fetchPatterns(filters),
  });

  const { data: flagsData } = useQuery({
    queryKey: ['flags'],
    queryFn: () => fetchFlags('Attendance Pattern'),
  });

  if (isTrendsLoading || isPatternsLoading) {
    return <div className="p-8 text-xs text-slate-400">Loading trend analytics...</div>;
  }

  // Filter streak flags specifically
  const streakFlags = flagsData?.flags.filter((f) => f.rule_name.includes('Consecutive Absence')) || [];

  return (
    <div className="p-8 space-y-8">
      {/* 1. Header & Granularity Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Time Series & Streak Analytics</h2>
          <p className="text-xs text-slate-500">
            Analyze cyclical fluctuations, consecutive session absences, and timetable dependencies.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs">
          <button
            onClick={() => setGranularity('weekly')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              granularity === 'weekly'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setGranularity('monthly')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              granularity === 'monthly'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* 2. Primary Time Series Chart */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {granularity === 'weekly' ? 'Weekly Attendance Progression' : 'Monthly Aggregated Attendance'}
            </h3>
            <p className="text-xs text-slate-500">
              Tracing attendance percentage against expected session completeness.
            </p>
          </div>
          {trends?.comparison_baseline_rate && (
            <div className="text-xs text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-md font-mono font-bold">
              Term Baseline: {trends.comparison_baseline_rate.toFixed(1)}%
            </div>
          )}
        </div>
        <TrendLineChart
          data={trends?.points || []}
          baselineRate={trends?.comparison_baseline_rate}
          height={320}
        />
      </GlassCard>

      {/* 3. Weekday & Timetable Slot Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">Weekday Attendance Profile</h3>
            <p className="text-xs text-slate-500">Aggregate attendance rates by day of the week</p>
          </div>
          <div className="space-y-3">
            {patterns?.weekday_distribution.map((d) => (
              <div key={d.weekday} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{d.weekday}</span>
                  <span className="font-mono text-teal-700 font-bold">
                    {d.attendance_rate !== null ? `${d.attendance_rate.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, d.attendance_rate ?? 0))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Held: {d.held_count}</span>
                  <span>Attended: {d.attended_count} (Late: {d.late_count})</span>
                  <span>Absent: {d.absent_count}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">Timetable Slot Distribution</h3>
            <p className="text-xs text-slate-500">Aggregate attendance rates across scheduled daily time bands</p>
          </div>
          <div className="space-y-3">
            {patterns?.slot_distribution.map((s) => (
              <div key={s.timetable_slot} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{s.timetable_slot}</span>
                  <span className="font-mono text-cyan-700 font-bold">
                    {s.attendance_rate !== null ? `${s.attendance_rate.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, s.attendance_rate ?? 0))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Held: {s.held_count}</span>
                  <span>Attended: {s.attended_count} (Late: {s.late_count})</span>
                  <span>Absent: {s.absent_count}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* 4. Consecutive Absence Patterns */}
      <GlassCard className="space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">Identified Consecutive Absence Streaks (≥ 3 Sessions)</h3>
          <p className="text-xs text-slate-500">
            Pseudonymous student session sequences requiring supportive academic mentor outreach.
          </p>
        </div>

        {streakFlags.length === 0 ? (
          <div className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-xl border border-slate-200">
            No active consecutive absence streaks detected under current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {streakFlags.map((flag) => (
              <div
                key={flag.flag_key}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors space-y-2 text-xs shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-teal-800 text-sm">
                    {flag.target_id}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {flag.status}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-normal">{flag.evidence}</p>
                <div className="text-slate-500 font-mono text-[11px]">
                  Observed Window: {flag.period}
                </div>
                <div className="border-t border-slate-200 pt-2 text-slate-600 flex items-start gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{flag.suggested_action}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
