import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface StatusDonutChartProps {
  statusCounts: {
    PRESENT: number;
    LATE: number;
    ABSENT: number;
    EXCUSED: number;
    MISSING: number;
  };
  height?: number;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({ statusCounts, height = 220 }) => {
  const data = [
    { name: 'Present', count: statusCounts.PRESENT, color: '#10B981' },
    { name: 'Late', count: statusCounts.LATE, color: '#8B5CF6' },
    { name: 'Absent', count: statusCounts.ABSENT, color: '#F43F5E' },
    { name: 'Excused', count: statusCounts.EXCUSED, color: '#F59E0B' },
    { name: 'Missing Entry', count: statusCounts.MISSING, color: '#94A3B8' },
  ].filter((d) => d.count > 0);

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-xl text-xs space-y-1 text-slate-800">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
          </div>
          <div className="text-slate-600 font-mono">
            {item.count.toLocaleString()} sessions ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400">
        No status count data available.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div style={{ width: 170, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomPieTooltip />} />
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2.5} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-1.5 flex-1 text-xs">
        {data.map((item) => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
          return (
            <div key={item.name} className="flex items-center justify-between gap-3 text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: item.color }} />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="font-mono text-slate-500">
                <span className="text-slate-900 font-bold">{item.count}</span> ({pct}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
