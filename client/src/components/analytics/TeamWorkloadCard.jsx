/**
 * TeamWorkloadCard
 * Displays objective team task distribution (open vs completed tasks per member).
 * Strictly count-based and non-evaluative.
 */
import React from 'react';
import { Users, CheckCircle2, Clock } from 'lucide-react';
import { Avatar, Badge } from '../ui';

export default function TeamWorkloadCard({ teamWorkload = [] }) {
  if (!teamWorkload || teamWorkload.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-center p-4 bg-surface-950/40 rounded-xl border border-surface-800/80">
        <Users className="w-6 h-6 text-slate-500 mb-2" />
        <p className="text-xs font-semibold text-slate-400">No member workload data</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Assign tasks to team members to visualize work distribution.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teamWorkload.map((member) => {
        const total = member.totalTasks || 0;
        const open = member.openTasks || 0;
        const completed = member.completedTasks || 0;
        const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

        return (
          <div
            key={member.userId}
            className="p-3.5 rounded-xl bg-surface-950/60 border border-surface-800/80 hover:border-surface-700/80 transition-all space-y-2.5"
          >
            {/* Header: Avatar, Name, Role */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar name={member.fullName} size="xs" />
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {member.fullName}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {member.jobTitle || `@${member.username || 'member'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  {open} open
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {completed} done
                </span>
              </div>
            </div>

            {/* Task Completion Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-surface-900 rounded-full overflow-hidden flex border border-surface-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{total} total assigned</span>
                <span>{completionPct}% completed</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
