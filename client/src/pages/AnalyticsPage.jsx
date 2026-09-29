import React from 'react';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Users, ArrowUpRight, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '../components/ui';

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Sprint Velocity', value: '42 pts', sub: '+12% vs last cycle', color: 'text-brand-400' },
    { label: 'On-Time Delivery', value: '94.2%', sub: 'Target: 90%', color: 'text-emerald-400' },
    { label: 'Average Lead Time', value: '3.4 days', sub: '-0.8 days reduction', color: 'text-cyan-400' },
    { label: 'Defect Density', value: '1.2%', sub: 'Target: < 3%', color: 'text-purple-400' },
  ];

  const sprintBars = [
    { sprint: 'Sprint 10', completed: 32, planned: 36 },
    { sprint: 'Sprint 11', completed: 35, planned: 35 },
    { sprint: 'Sprint 12', completed: 40, planned: 42 },
    { sprint: 'Sprint 13', completed: 38, planned: 38 },
    { sprint: 'Sprint 14', completed: 42, planned: 45 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Project Analytics & Velocity
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time metrics on team sprint execution, lead times, and deliverable quality.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-5 space-y-2">
            <span className="text-xs font-semibold text-slate-400">{m.label}</span>
            <div className="text-2xl sm:text-3xl font-black text-white">{m.value}</div>
            <span className={`text-[11px] font-semibold ${m.color}`}>{m.sub}</span>
          </Card>
        ))}
      </div>

      {/* Chart Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sprint Velocity History (Story Points)</CardTitle>
            <CardDescription>Completed vs Planned story points across sprints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 pt-2">
              {sprintBars.map((s) => (
                <div key={s.sprint} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{s.sprint}</span>
                    <span className="text-slate-400">
                      <strong className="text-brand-300">{s.completed}</strong> / {s.planned} pts
                    </span>
                  </div>
                  <div className="w-full h-3 bg-surface-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-brand-500 h-full rounded-full"
                      style={{ width: `${(s.completed / s.planned) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Distribution by Priority</CardTitle>
            <CardDescription>Active sprint allocation breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-surface-800">
              <span className="text-rose-400 font-semibold">Urgent / High</span>
              <span className="font-bold text-white">12 tasks (43%)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-surface-800">
              <span className="text-amber-400 font-semibold">Medium</span>
              <span className="font-bold text-white">10 tasks (36%)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-surface-800">
              <span className="text-slate-400 font-semibold">Low / Backlog</span>
              <span className="font-bold text-white">6 tasks (21%)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
