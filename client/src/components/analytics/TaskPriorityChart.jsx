/**
 * TaskPriorityChart
 * Visualizes task distribution by priority using a responsive Donut / Pie chart.
 */
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PRIORITY_CONFIG = [
  { key: 'urgent', label: 'Urgent', color: '#EF4444' },
  { key: 'high', label: 'High', color: '#F59E0B' },
  { key: 'medium', label: 'Medium', color: '#6366F1' },
  { key: 'low', label: 'Low', color: '#52525B' },
];

export default function TaskPriorityChart({ priorityBreakdown = {}, height = 220 }) {
  const data = PRIORITY_CONFIG.map((item) => ({
    name: item.label,
    count: priorityBreakdown[item.key] || 0,
    color: item.color,
  })).filter((item) => item.count > 0);

  const totalTasks = Object.values(priorityBreakdown).reduce((a, b) => a + b, 0);

  if (totalTasks === 0 || data.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-center p-4 bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
        <p className="text-xs font-medium text-[#A1A1AA]">No priority data available</p>
        <p className="text-[11px] text-[#71717A] mt-0.5">
          Priority breakdown will appear once tasks are created.
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
            <span>{d.name} Priority</span>
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
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#111114" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F1F24] text-[11px]">
        {PRIORITY_CONFIG.map((item) => {
          const count = priorityBreakdown[item.key] || 0;
          const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
          return (
            <div
              key={item.key}
              className="flex items-center justify-between p-2 rounded-md bg-[#0B0B0E] border border-[#1F1F24]"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#A1A1AA] font-medium">{item.label}</span>
              </div>
              <span className="font-semibold text-[#F5F5F7]">
                {count} <span className="text-[10px] text-[#71717A] font-normal">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
