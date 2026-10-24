import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { NavPage } from './Sidebar';

interface HeaderProps {
  activePage: NavPage;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onRefresh,
  isRefreshing = false,
}) => {
  const pageMeta: Record<NavPage, { title: string; subtitle: string }> = {
    overview: {
      title: 'Attendance Overview',
      subtitle: 'Understand patterns. Improve data quality. Support students fairly.',
    },
    trends: {
      title: 'Attendance Trends & Streaks',
      subtitle: 'Longitudinal, weekly, and monthly attendance dynamics across terms.',
    },
    courses: {
      title: 'Course & Section Insights',
      subtitle: 'Identify timetable friction and recording discrepancies without student ranking.',
    },
    review: {
      title: 'Review Center',
      subtitle: 'Explainable, transparent review prompts for human-led supportive follow-up.',
    },
    quality: {
      title: 'Data Quality & Reconciliation',
      subtitle: 'Audit missing expected sessions, duplicates, invalid statuses, and completeness.',
    },
    explorer: {
      title: 'Data Explorer & Import',
      subtitle: 'Pseudonymous session records, CSV import zones, and safe status amendments.',
    },
    methodology: {
      title: 'Methodology & Privacy Safeguards',
      subtitle: 'Formulas, non-punitive ethics, anomaly thresholds, and responsible use principles.',
    },
  };

  const current = pageMeta[activePage] || { title: 'Dashboard', subtitle: '' };

  const handleExportSummary = () => {
    window.open('/api/exports/summary', '_blank');
  };

  return (
    <header className="px-8 py-4 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 shadow-xs">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{current.title}</h1>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold shadow-xs">
            Demo Data
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 font-normal">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 transition-colors shadow-xs disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}

        <button
          onClick={handleExportSummary}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all shadow-sm shadow-teal-600/25 active:scale-95"
          title="Download aggregated cohort summary report"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span>Export Summary JSON</span>
        </button>
      </div>
    </header>
  );
};
