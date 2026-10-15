/**
 * TaskStatusChart
 * Visualizes task distribution across workflow statuses using responsive Recharts bar chart.
 */
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const STATUS_CONFIG = [
  { key: 'backlog', label: 'Backlog', color: '#52525B' },
  { key: 'todo', label: 'To Do', color: '#71717A' },
  { key: 'in_progress', label: 'In Progress', color: '#6366F1' },
  { key: 'review', label: 'Review', color: '#818CF8' },
  { key: 'done', label: 'Done', color: '#10B981' },
];

export default function TaskStatusChart({ statusBreakdown = {}, height = 220 }) {
  const data = STATUS_CONFIG.map((item) => ({
    name: item.label,
    count: statusBreakdown[item.key] || 0,
    color: item.color,
  }));

  const totalTasks = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);

  if (totalTasks === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-center p-4 bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
        <p className="text-xs font-medium text-[#A1A1AA]">No tasks created yet</p>
        <p className="text-[11px] text-[#71717A] mt-0.5">
          Tasks created in projects will populate this workflow breakdown.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = totalTasks > 0 ? Math.round((d.count / totalTasks) * 100) : 0;
      return (
        <div className="bg-[#17171C] border border-[#292930] p-2.5 rounded-md shadow-xl text-xs">
          <div className="font-semibold text-[#F5F5F7] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span>{d.name}</span>
          </div>
          <p className="text-[#A1A1AA] mt-1 font-medium">
            {d.count} tasks <span className="text-[#71717A] font-normal">({pct}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-3">
      <div style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="#71717A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="#71717A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1F1F24] text-[11px]">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[#71717A]">{item.name}:</span>
            <span className="font-medium text-[#F5F5F7]">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
