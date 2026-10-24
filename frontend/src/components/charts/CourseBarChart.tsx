import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { CourseComparisonItem } from '../../types';

interface CourseBarChartProps {
  data: CourseComparisonItem[];
  height?: number;
}

const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item: CourseComparisonItem = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-2 z-50 text-slate-800">
        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-4">
          <span>{item.course_code} ({item.section})</span>
          {item.is_provisional && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Low Completeness
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-teal-700 font-semibold">Attendance Rate:</span>
            <span className="font-mono font-bold text-slate-900">
              {item.attendance_rate !== null ? `${item.attendance_rate.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-purple-700 font-semibold">Completeness:</span>
            <span className="font-mono font-bold text-slate-700">{item.completeness_rate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-1 text-[11px] text-slate-500 font-mono flex justify-between">
          <span>Expected: {item.expected_sessions_held}</span>
          <span>Recorded: {item.recorded_sessions}</span>
          <span className="text-amber-700 font-bold">Missing: {item.missing_count}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const CourseBarChart: React.FC<CourseBarChartProps> = ({ data, height = 280 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No course comparison data available.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: `${d.course_code} (${d.section})`,
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="label"
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
          <Tooltip content={<CustomBarTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
            formatter={(val) => <span className="text-slate-700 font-semibold">{val}</span>}
          />
          <Bar
            name="Attendance Rate"
            dataKey="attendance_rate"
            fill="#0D9488"
            radius={[4, 4, 0, 0]}
            maxBarSize={38}
          />
          <Bar
            name="Record Completeness"
            dataKey="completeness_rate"
            fill="#8B5CF6"
            radius={[4, 4, 0, 0]}
            maxBarSize={38}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
