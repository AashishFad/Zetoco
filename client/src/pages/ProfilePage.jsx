import React from 'react';
import { User, Mail, Shield, Calendar, CheckSquare, Sparkles, Building } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Avatar, useToast } from '../components/ui';

export default function ProfilePage() {
  const { addToast } = useToast();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          User Profile & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your personal account profile, roles, and collaborative assignments.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar name="Aashish Lead" size="xl" status="online" />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">Aashish Lead</h2>
                <Badge variant="brand" size="xs">Workspace Admin</Badge>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> lead@flowsync.dev
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> Acme Engineering • Lead Architect
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-surface-800">
            <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 text-center">
              <span className="text-slate-400 text-xs">Assigned Tasks</span>
              <p className="text-xl font-bold text-brand-300 mt-1">8 Tasks</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 text-center">
              <span className="text-slate-400 text-xs">Total Sprints Completed</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">34 Sprints</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 text-center">
              <span className="text-slate-400 text-xs">Account Status</span>
              <p className="text-xl font-bold text-cyan-400 mt-1">Active (Verified)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
