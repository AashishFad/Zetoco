import React from 'react';
import { BarChart3, TrendingUp, Activity, CheckCircle2, Users, Layers } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sprint & Velocity Analytics
          </h1>
          <Badge variant="accent" size="sm">
            Live Metrics
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Team throughput, milestone burn-down rates, and delivery forecasting.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sprint 14 Burndown</CardTitle>
            <CardDescription>Story points closed vs estimated timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">94.2%</span>
              <span className="text-xs text-slate-400">On Track</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[94%]"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cycle Time</CardTitle>
            <CardDescription>Average time from In-Progress to Done</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">1.8 Days</span>
              <span className="text-xs text-brand-300">-0.4 days faster</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full w-[80%]"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Code Review Velocity</CardTitle>
            <CardDescription>Average PR turnaround and approval time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-accent-400 font-mono">3.2 Hours</span>
              <span className="text-xs text-slate-400">Target &lt; 6h</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-accent-500 h-full rounded-full w-[85%]"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
