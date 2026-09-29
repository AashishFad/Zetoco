import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Shield,
  CheckSquare,
  MoreVertical,
  Circle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, Avatar, Dropdown, DropdownItem, useToast } from '../components/ui';
import InviteMemberModal from '../components/modals/InviteMemberModal';

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { addToast } = useToast();

  // Section 14 Requirements: Avatar, Name, Role, Online/offline indicator, Number of assigned tasks, Invite Member button
  const members = [
    {
      id: 1,
      name: 'Aashish Lead',
      email: 'lead@flowsync.dev',
      role: 'Lead Architect & Admin',
      roleBadge: 'brand',
      status: 'online',
      assignedTasks: 8,
      completedTasks: 34,
      department: 'Core Engineering',
    },
    {
      id: 2,
      name: 'Rahul Sharma',
      email: 'rahul.s@flowsync.dev',
      role: 'Senior Backend Engineer',
      roleBadge: 'purple',
      status: 'online',
      assignedTasks: 6,
      completedTasks: 22,
      department: 'Backend & APIs',
    },
    {
      id: 3,
      name: 'Priya Patel',
      email: 'priya.p@flowsync.dev',
      role: 'Senior Frontend Engineer',
      roleBadge: 'cyan',
      status: 'away',
      assignedTasks: 5,
      completedTasks: 19,
      department: 'Design System',
    },
    {
      id: 4,
      name: 'Dhruv Mehta',
      email: 'dhruv.m@flowsync.dev',
      role: 'Full Stack Engineer',
      roleBadge: 'neutral',
      status: 'online',
      assignedTasks: 7,
      completedTasks: 14,
      department: 'Core Engineering',
    },
    {
      id: 5,
      name: 'Sarah Jenkins',
      email: 'sarah.j@flowsync.dev',
      role: 'Product Designer',
      roleBadge: 'warning',
      status: 'offline',
      assignedTasks: 2,
      completedTasks: 18,
      department: 'UI/UX Design',
    },
    {
      id: 6,
      name: 'Michael Chang',
      email: 'michael.c@flowsync.dev',
      role: 'DevOps & Reliability',
      roleBadge: 'neutral',
      status: 'offline',
      assignedTasks: 4,
      completedTasks: 12,
      department: 'Infrastructure',
    },
  ];

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Team & Workspace Members
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage organization members, roles, permissions, and active task workloads.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={UserPlus}
          onClick={() => setIsInviteOpen(true)}
        >
          Invite Member
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-900/80 p-3 rounded-2xl border border-surface-800">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name, role, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Badge variant="brand" size="md">
            {filteredMembers.length} Members Total
          </Badge>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((m) => (
          <Card key={m.id} hover className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div className="flex items-center gap-3">
                <Avatar name={m.name} size="md" status={m.status} />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">{m.email}</p>
                </div>
              </div>

              <Badge variant={m.roleBadge} size="xs">
                {m.role.split(' ')[0]}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              <div className="p-2.5 rounded-xl bg-surface-950/80 border border-surface-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-200">{m.department}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-surface-950/80 border border-surface-800/80 text-center">
                  <span className="text-slate-400 text-[10px] block">Assigned Tasks</span>
                  <span className="text-sm font-bold text-brand-300 mt-0.5 block">
                    {m.assignedTasks}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-surface-950/80 border border-surface-800/80 text-center">
                  <span className="text-slate-400 text-[10px] block">Completed</span>
                  <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                    {m.completedTasks}
                  </span>
                </div>
              </div>
            </CardContent>

            <div className="p-4 pt-2 border-t border-surface-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <Circle
                  className={`w-2 h-2 fill-current ${
                    m.status === 'online'
                      ? 'text-emerald-400'
                      : m.status === 'away'
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}
                />
                <span className="capitalize">{m.status}</span>
              </span>

              <Button
                variant="outline"
                size="xs"
                onClick={() => addToast(`Opening direct message with ${m.name}`, 'info')}
              >
                Send Message
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <InviteMemberModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  );
}
