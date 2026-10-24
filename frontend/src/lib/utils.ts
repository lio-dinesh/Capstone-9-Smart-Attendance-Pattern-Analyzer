import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(1)}%`;
}

export function getStatusBadgeClasses(status: string): string {
  switch (status.toUpperCase()) {
    case 'PRESENT':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'LATE':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'ABSENT':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'EXCUSED':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'MISSING':
      return 'bg-slate-100 text-slate-700 border-slate-300 border-dashed';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getReviewStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'Needs context':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Data issue':
      return 'bg-sky-100 text-sky-800 border-sky-300';
    case 'Reviewed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
