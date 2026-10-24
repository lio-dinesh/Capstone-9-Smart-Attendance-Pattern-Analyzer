import React from 'react';
import { HeatmapCell } from '../../types';
import { cn } from '../../lib/utils';

interface TimetableHeatmapProps {
  cells: HeatmapCell[];
  frictionNotes?: string[];
}

export const TimetableHeatmap: React.FC<TimetableHeatmapProps> = ({ cells, frictionNotes }) => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = ['08:30-10:00', '10:15-11:45', '13:00-14:30', '15:00-16:30'];

  const getCell = (day: string, slot: string): HeatmapCell | undefined => {
    return cells.find((c) => c.weekday === day && c.timetable_slot === slot);
  };

  const getCellColor = (rate: number | null): string => {
    if (rate === null) return 'bg-slate-100 text-slate-400 border-slate-200';
    if (rate >= 90) return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold shadow-xs';
    if (rate >= 80) return 'bg-sky-100 text-sky-900 border-sky-300 font-bold shadow-xs';
    if (rate >= 70) return 'bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-xs';
    return 'bg-rose-100 text-rose-900 border-rose-300 font-bold shadow-xs';
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-500 font-semibold border-b border-slate-200 w-24">
                Weekday
              </th>
              {slots.map((s) => (
                <th key={s} className="p-2 text-center text-slate-500 font-semibold border-b border-slate-200">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekdays.map((day) => (
              <tr key={day} className="border-b border-slate-100">
                <td className="p-2.5 font-semibold text-slate-700">{day}</td>
                {slots.map((slot) => {
                  const cell = getCell(day, slot);
                  const rate = cell?.attendance_rate ?? null;
                  return (
                    <td key={slot} className="p-1.5 text-center">
                      {cell ? (
                        <div
                          className={cn(
                            'py-2 px-2 rounded-lg border font-mono transition-transform hover:scale-105 cursor-help group relative',
                            getCellColor(rate)
                          )}
                        >
                          <span>{rate !== null ? `${rate.toFixed(1)}%` : 'N/A'}</span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-white border border-slate-200 rounded-lg shadow-xl text-left text-slate-700 z-50 text-[11px] font-sans">
                            <div className="font-bold text-slate-900 mb-1">{day} {slot}</div>
                            <div>Held Sessions: <span className="font-semibold text-slate-800">{cell.total_held}</span></div>
                            <div>Attended: <span className="font-semibold text-emerald-700">{cell.attended_count}</span></div>
                            <div>Absent: <span className="font-semibold text-rose-700">{cell.absent_count}</span></div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 font-mono">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Friction Insight Notes */}
      {frictionNotes && frictionNotes.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed space-y-1">
          <div className="font-bold text-amber-800 flex items-center gap-1.5">
            <span>Timetable Correlation Findings:</span>
          </div>
          {frictionNotes.map((note, i) => (
            <p key={i}>• {note}</p>
          ))}
        </div>
      )}
    </div>
  );
};
