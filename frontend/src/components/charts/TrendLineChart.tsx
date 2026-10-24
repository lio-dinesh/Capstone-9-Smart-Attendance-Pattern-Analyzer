nimport React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendPoint } from '../../types';

interface TrendLineChartProps {
  data: TrendPoint[];
  baselineRate?: number | null;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d: TrendPoint = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-2 z-50 text-slate-800">
        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-slate-500 font-mono text-[11px]">Starts {d.date_start}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-teal-700 font-semibold">Attendance Rate:</span>
            <span className="font-mono font-bold text-slate-900">
              {d.attendance_rate !== null ? `${d.attendance_rate.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-indigo-700 font-semibold">Record Completeness:</span>
            <span className="font-mono font-bold text-slate-700">{d.completeness_rate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-600 font-mono">
          <div>Attended: <span className="font-bold text-slate-800">{d.attended_count}</span></div>
          <div>Absent: <span className="font-bold text-slate-800">{d.absent_count}</span></div>
          <div>Late: <span className="font-bold text-slate-800">{d.late_count}</span></div>
          <div>Excused: <span className="font-bold text-slate-800">{d.excused_count}</span></div>
          <div className="col-span-2 text-amber-700 font-bold">Missing Entries: {d.missing_count}</div>
        </div>
      </div>
    );
  }
  return null;
};

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  baselineRate,
  height = 300,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No attendance trend data available for selected filters.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="period"
            stroke="#94A3B8"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#94A3B8"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            formatter={(val) => <span className="text-slate-700 font-semibold">{val}</span>}
          />
          {baselineRate && (
            <ReferenceLine
              y={baselineRate}
              stroke="#8B5CF6"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Cohort Baseline (${baselineRate.toFixed(1)}%)`,
                fill: '#7C3AED',
                fontSize: 11,
                fontWeight: 600,
                position: 'insideBottomRight',
              }}
            />
          )}
          <Line
            type="monotone"
            name="Attendance Rate"
            dataKey="attendance_rate"
            stroke="#0D9488"
            strokeWidth={3}
            dot={{ r: 4, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#0D9488', stroke: '#CCFBF1', strokeWidth: 3 }}
          />
          <Line
            type="monotone"
            name="Record Completeness"
            dataKey="completeness_rate"
            stroke="#6366F1"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={{ r: 3, fill: '#6366F1', stroke: '#FFFFFF', strokeWidth: 1.5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
