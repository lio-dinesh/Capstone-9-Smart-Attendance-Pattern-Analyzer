import React from 'react';
import { Filter, X, Calendar } from 'lucide-react';
import { FilterState } from '../../types';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, onReset }) => {
  const courses = ['All Courses', 'CS101', 'MATH201', 'ENG102', 'DS301'];
  const sections = ['All Sections', 'SEC-A', 'SEC-B'];

  const hasActiveFilters =
    filters.courseCode !== 'All Courses' ||
    filters.section !== 'All Sections' ||
    Boolean(filters.dateStart) ||
    Boolean(filters.dateEnd);

  const handlePreset = (type: 'all' | 'first-half' | 'second-half') => {
    if (type === 'all') {
      onChange({
        ...filters,
        dateStart: '',
        dateEnd: '',
      });
    } else if (type === 'first-half') {
      onChange({
        ...filters,
        dateStart: '2026-09-07',
        dateEnd: '2026-10-09',
      });
    } else if (type === 'second-half') {
      onChange({
        ...filters,
        dateStart: '2026-10-12',
        dateEnd: '2026-11-13',
      });
    }
  };

  return (
    <div className="bg-white/95 border-b border-slate-200 px-8 py-3 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
          <Filter className="w-3.5 h-3.5 text-teal-600" />
          <span>Cohort Filters:</span>
        </div>

        {/* Course Dropdown */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="course-select" className="text-slate-500 sr-only">Course</label>
          <select
            id="course-select"
            value={filters.courseCode}
            onChange={(e) => onChange({ ...filters, courseCode: e.target.value })}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer shadow-xs"
          >
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Section Dropdown */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="section-select" className="text-slate-500 sr-only">Section</label>
          <select
            id="section-select"
            value={filters.section}
            onChange={(e) => onChange({ ...filters, section: e.target.value })}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer shadow-xs"
          >
            {sections.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
          <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <button
            onClick={() => handlePreset('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              !filters.dateStart && !filters.dateEnd
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            10-Wk Term
          </button>
          <button
            onClick={() => handlePreset('first-half')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              filters.dateStart === '2026-09-07' && filters.dateEnd === '2026-10-09'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Weeks 1–5
          </button>
          <button
            onClick={() => handlePreset('second-half')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              filters.dateStart === '2026-10-12' && filters.dateEnd === '2026-11-13'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Weeks 6–10
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors shadow-xs"
        >
          <X className="w-3 h-3" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
