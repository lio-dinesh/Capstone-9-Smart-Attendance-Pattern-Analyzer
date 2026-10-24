import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Database,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type NavPage =
  | 'overview'
  | 'trends'
  | 'courses'
  | 'review'
  | 'quality'
  | 'explorer'
  | 'methodology';

interface SidebarProps {
  activePage: NavPage;
  onPageSelect: (page: NavPage) => void;
  activeFlagsCount?: number;
  dataQualityIssuesCount?: number;
  onResetDemo?: () => void;
  isResetting?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onPageSelect,
  activeFlagsCount = 0,
  dataQualityIssuesCount = 0,
  onResetDemo,
  isResetting = false,
}) => {
  const navItems = [
    { id: 'overview' as NavPage, label: 'Overview', icon: LayoutDashboard },
    { id: 'trends' as NavPage, label: 'Attendance Trends', icon: TrendingUp },
    { id: 'courses' as NavPage, label: 'Course & Section', icon: BarChart3 },
    {
      id: 'review' as NavPage,
      label: 'Review Center',
      icon: CheckCircle2,
      badge: activeFlagsCount > 0 ? activeFlagsCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'quality' as NavPage,
      label: 'Data Quality',
      icon: AlertCircle,
      badge: dataQualityIssuesCount > 0 ? dataQualityIssuesCount : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    { id: 'explorer' as NavPage, label: 'Data Explorer & Import', icon: Database },
    { id: 'methodology' as NavPage, label: 'Methodology & Privacy', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-20 shadow-xs">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 tracking-tight">Smart Attendance</div>
              <div className="text-xs text-slate-500 font-medium">Pattern Analyzer</div>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Capstone Benchmark
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
              v1.0.0
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageSelect(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-900 border-l-4 border-teal-600 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-l-4 border-transparent'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-teal-600' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-mono font-bold shadow-xs', item.badgeColor)}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Footer & Reset Control */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-slate-600">Backend Connected</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
            MySQL (3306)
          </span>
        </div>

        {onResetDemo && (
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 shadow-xs transition-colors disabled:opacity-50"
          >
            <RotateCcw className={cn('w-3.5 h-3.5 text-teal-600', isResetting && 'animate-spin')} />
            <span>{isResetting ? 'Resetting Data...' : 'Reset Demo Dataset'}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
