import React from 'react';
import { LucideIcon, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GlassCard } from './GlassCard';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'negative' | 'warning' | 'neutral';
  };
  accentColor?: 'teal' | 'violet' | 'cyan' | 'amber' | 'rose';
  tooltip?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  accentColor = 'teal',
  tooltip,
}) => {
  const iconColorMap = {
    teal: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25',
    violet: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25',
    cyan: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25',
    amber: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25',
    rose: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25',
  };

  const topBorderMap = {
    teal: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    violet: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    cyan: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    amber: 'bg-gradient-to-r from-amber-400 to-orange-500',
    rose: 'bg-gradient-to-r from-rose-500 to-red-500',
  };

  const badgeColorMap = {
    positive: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    negative: 'bg-rose-100 text-rose-800 border-rose-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-300',
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between relative overflow-hidden group">
      {/* Colorful Accent Top Border */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', topBorderMap[accentColor])} />

      {/* Top row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>{title}</span>
          {tooltip && (
            <div className="group/tip relative cursor-help">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tip:block w-52 p-2.5 text-xs normal-case tracking-normal bg-white text-slate-700 border border-slate-200 rounded-lg shadow-xl z-30 font-normal">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105', iconColorMap[accentColor])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Main value and badge */}
      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
          {value}
        </div>
        {badge && (
          <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs', badgeColorMap[badge.variant])}>
            {badge.text}
          </span>
        )}
      </div>

      {/* Provenance Context */}
      {subtitle && (
        <div className="mt-3.5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2.5 font-normal">
          {subtitle}
        </div>
      )}
    </div>
  );
};
