import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, HelpCircle, FileCheck, Save, MessageSquare } from 'lucide-react';
import { fetchFlags, submitFlagReview } from '../services/api';
import { ReviewFlag, ReviewStatus } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { getReviewStatusBadgeClasses } from '../lib/utils';

export const ReviewCenterPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Attendance Pattern' | 'Data Quality'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReviewStatus>('ALL');
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['flags', categoryFilter, statusFilter],
    queryFn: () => fetchFlags(categoryFilter, statusFilter),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ flagKey, status, note }: { flagKey: string; status: ReviewStatus; note?: string }) =>
      submitFlagReview(flagKey, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-xs text-slate-400">Loading review prompts...</div>;
  }

  const flags = data?.flags || [];

  const handleStatusChange = (flagKey: string, newStatus: ReviewStatus) => {
    const note = editingNotes[flagKey];
    reviewMutation.mutate({ flagKey, status: newStatus, note });
  };

  const handleSaveNote = (flag: ReviewFlag) => {
    const note = editingNotes[flag.flag_key] ?? flag.reviewer_note ?? '';
    reviewMutation.mutate({ flagKey: flag.flag_key, status: flag.status, note });
  };

  return (
    <div className="p-8 space-y-8">
      {/* 1. Header & Guidance */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Explainable Human-Led Review Center</h2>
        <p className="text-xs text-slate-500">
          Review prompts serve as supportive inquiry points rather than punitive determinations. Consider cohort timetable factors before individual outreach.
        </p>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              categoryFilter === 'ALL'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Prompts ({data?.total ?? 0})
          </button>
          <button
            onClick={() => setCategoryFilter('Attendance Pattern')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              categoryFilter === 'Attendance Pattern'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Patterns
          </button>
          <button
            onClick={() => setCategoryFilter('Data Quality')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              categoryFilter === 'Data Quality'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Quality
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600 font-semibold">Review Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="Needs context">Needs Context ({data?.needs_context_count ?? 0})</option>
            <option value="Data issue">Data Issue ({data?.data_issue_count ?? 0})</option>
            <option value="Reviewed">Reviewed ({data?.reviewed_count ?? 0})</option>
          </select>
        </div>
      </div>

      {/* 3. Review Prompt Cards */}
      {flags.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
          No review items matching the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {flags.map((flag) => {
            const currentNote = editingNotes[flag.flag_key] !== undefined
              ? editingNotes[flag.flag_key]
              : flag.reviewer_note || '';

            return (
              <GlassCard key={flag.flag_key} className="space-y-4 border-slate-200">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        flag.category === 'Attendance Pattern'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}
                    >
                      {flag.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {flag.rule_name} — Target: <span className="font-mono text-teal-800 font-bold">{flag.target_id}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Window: {flag.period}
                    </span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border shadow-xs ${getReviewStatusBadgeClasses(flag.status)}`}>
                      {flag.status}
                    </span>
                  </div>
                </div>

                {/* Evidence & Threshold */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-slate-800 font-bold">Audited Evidence:</div>
                    <p className="text-slate-700 leading-relaxed font-normal">{flag.evidence}</p>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      Threshold Rule: {flag.threshold_description}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-slate-800 font-bold">Supportive Action Recommendation:</div>
                    <p className="text-slate-700 leading-relaxed font-normal">{flag.suggested_action}</p>
                    <div className="text-[11px] text-teal-800 font-semibold mt-1">
                      Guidance: Check timetable conflicts or transport barriers before individual follow-up.
                    </div>
                  </div>
                </div>

                {/* Reviewer Note and Interactive Actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  {/* Note input */}
                  <div className="flex-1 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Add reviewer context note (e.g., student verified transport issue)..."
                      value={currentNote}
                      onChange={(e) =>
                        setEditingNotes({ ...editingNotes, [flag.flag_key]: e.target.value })
                      }
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-xs"
                    />
                    <button
                      onClick={() => handleSaveNote(flag)}
                      disabled={reviewMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                      title="Save note"
                    >
                      <Save className="w-3.5 h-3.5 text-teal-700" />
                      <span>Save</span>
                    </button>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStatusChange(flag.flag_key, 'Needs context')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        flag.status === 'Needs context'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-amber-900 hover:bg-amber-50 border-slate-200'
                      }`}
                    >
                      Needs Context
                    </button>
                    <button
                      onClick={() => handleStatusChange(flag.flag_key, 'Data issue')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        flag.status === 'Data issue'
                          ? 'bg-sky-100 text-sky-900 border-sky-300 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-sky-900 hover:bg-sky-50 border-slate-200'
                      }`}
                    >
                      Data Issue
                    </button>
                    <button
                      onClick={() => handleStatusChange(flag.flag_key, 'Reviewed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        flag.status === 'Reviewed'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 border-slate-200'
                      }`}
                    >
                      Mark Reviewed
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
