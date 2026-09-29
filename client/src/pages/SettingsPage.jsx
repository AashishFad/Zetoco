import React from 'react';
import { Settings, Shield, Bell, Key, Globe, Database } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';

export default function SettingsPage() {
  const { addToast } = useToast();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workspace Settings
          </h1>
          <Badge variant="brand" size="sm">
            Admin Access
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure organization preferences, member permissions, and environment variables.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Profile</CardTitle>
            <CardDescription>Primary organization information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Workspace Name" defaultValue="FlowSync Technologies" />
              <Input label="Workspace Slug" defaultValue="flowsync-tech" helperText="Used in URLs" />
            </div>
            <Input label="Contact Email" defaultValue="admin@flowsync.dev" />
            <div className="pt-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  addToast({
                    title: 'Settings Saved (Demo)',
                    message: 'Workspace configurations updated.',
                    type: 'success',
                  })
                }
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PostgreSQL Foundation Configuration</CardTitle>
            <CardDescription>Connection pool parameters established in Phase 1</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Database Engine:</span>
              <span className="text-slate-200 font-mono">PostgreSQL 14+</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Connection Pool Driver:</span>
              <span className="text-slate-200 font-mono">node-postgres (pg.Pool)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Health Endpoint:</span>
              <span className="text-brand-400 font-mono">/api/health/full</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
