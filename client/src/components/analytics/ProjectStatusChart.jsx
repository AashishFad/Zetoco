/**
 * ProjectStatusChart
 * Visualizes project status distribution (planning, active, on_hold, completed, archived).
 */
import React from 'react';
import { Badge } from '../ui';

const STATUS_CONFIG = [
  { key: 'active', label: 'Active', bg: 'bg-emerald-500', text: 'text-emerald-400' },
  { key: 'planning', label: 'Planning', bg: 'bg-indigo-400', text: 'text-indigo-400' },
  { key: 'on_hold', label: 'On Hold', bg: 'bg-amber-500', text: 'text-amber-400' },
  { key: 'completed', label: 'Completed', bg: 'bg-indigo-600', text: 'text-indigo-400' },
  { key: 'archived', label: 'Archived', bg: 'bg-zinc-600', text: 'text-zinc-400' },
];

export default function ProjectStatusChart({ projectStatusBreakdown = {} }) {
  const totalProjects = Object.values(projectStatusBreakdown).reduce((a, b) => a + b, 0);

  if (totalProjects === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
        <p className="text-xs font-medium text-[#A1A1AA]">No projects found</p>
        <p className="text-[11px] text-[#71717A] mt-0.5">
          Create projects to view project lifecycle distribution.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Horizontal Multi-Segment Progress Bar */}
      <div className="w-full h-2.5 bg-[#0B0B0E] rounded-full overflow-hidden flex border border-[#1F1F24]">
        {STATUS_CONFIG.map((cfg) => {
          const count = projectStatusBreakdown[cfg.key] || 0;
          if (count === 0) return null;
          const widthPct = (count / totalProjects) * 100;
          return (
            <div
              key={cfg.key}
              style={{ width: `${widthPct}%` }}
              className={`${cfg.bg} h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
              title={`${cfg.label}: ${count} projects (${Math.round(widthPct)}%)`}
            />
          );
        })}
      </div>

      {/* Breakdown Items List */}
      <div className="space-y-2">
        {STATUS_CONFIG.map((cfg) => {
          const count = projectStatusBreakdown[cfg.key] || 0;
          const pct = totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0;
          return (
            <div
              key={cfg.key}
              className="flex items-center justify-between p-2 rounded-md bg-[#0B0B0E] border border-[#1F1F24] text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                <span className="font-medium text-[#F5F5F7]">{cfg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#F5F5F7]">{count}</span>
                <span className="text-[10px] text-[#71717A] font-normal w-8 text-right">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
