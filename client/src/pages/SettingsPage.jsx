import React, { useState } from 'react';
import { Settings, Shield, Bell, Key, Globe, Database, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Select, Badge, useToast } from '../components/ui';

export default function SettingsPage() {
  const { addToast } = useToast();
  const [workspaceName, setWorkspaceName] = useState('Acme Engineering');
  const [timezone, setTimezone] = useState('UTC');

  const handleSave = (e) => {
    e.preventDefault();
    addToast('Workspace preferences saved (UI Simulation)', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure organization preferences, member permissions, and notification rules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic settings for your FlowSync workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Workspace Name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />

            <Select
              label="Default Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[
                { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
                { label: 'EST (Eastern Standard Time)', value: 'EST' },
                { label: 'PST (Pacific Standard Time)', value: 'PST' },
                { label: 'IST (India Standard Time)', value: 'IST' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security & Role Permissions</CardTitle>
            <CardDescription>Enforce security policies for team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-surface-800">
              <div>
                <p className="font-semibold text-white">Require Two-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-slate-400">Enforce 2FA for all Workspace Admins and Managers</p>
              </div>
              <Badge variant="success" size="xs">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-surface-800">
              <div>
                <p className="font-semibold text-white">Public Project Visibility</p>
                <p className="text-[11px] text-slate-400">Allow team members to view projects across the organization</p>
              </div>
              <Badge variant="brand" size="xs">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" size="sm" leftIcon={Check}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
