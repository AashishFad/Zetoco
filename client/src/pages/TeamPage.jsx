import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  CheckSquare,
  Shield,
  MoreVertical,
  Sparkles
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import InviteMemberModal from '../components/modals/InviteMemberModal';
import { useToast } from '../components/ui/Toast';

export default function TeamPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  const members = [
    {
      id: 1,
      name: 'Aashish Fad',
      email: 'aashish.fad@flowsync.dev',
      role: 'Lead Full-Stack Engineer',
      roleType: 'Admin',
      status: 'online',
      assignedTasks: 8,
      department: 'Engineering',
    },
    {
      id: 2,
      name: 'Rahul Sharma',
      email: 'rahul.s@flowsync.dev',
      role: 'Backend Architect',
      roleType: 'Manager',
      status: 'online',
      assignedTasks: 6,
      department: 'Engineering',
    },
    {
      id: 3,
      name: 'Priya Kapoor',
      email: 'priya.k@flowsync.dev',
      role: 'Frontend & UI Specialist',
      roleType: 'Member',
      status: 'away',
      assignedTasks: 5,
      department: 'Design & Frontend',
    },
    {
      id: 4,
      name: 'Dhruv Mehta',
      email: 'dhruv.m@flowsync.dev',
      role: 'DevOps & Cloud Engineer',
      roleType: 'Member',
      status: 'busy',
      assignedTasks: 4,
      department: 'Infrastructure',
    },
    {
      id: 5,
      name: 'Sneha Patel',
      email: 'sneha.p@flowsync.dev',
      role: 'Product Designer',
      roleType: 'Member',
      status: 'offline',
      assignedTasks: 3,
      department: 'Design',
    },
    {
      id: 6,
      name: 'Vikram Rao',
      email: 'vikram.r@flowsync.dev',
      role: 'QA & Automation Engineer',
      roleType: 'Member',
      status: 'offline',
      assignedTasks: 2,
      department: 'Quality Assurance',
    },
  ];

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Team Directory
            </h1>
            <Badge variant="brand" size="sm">
              {members.length} Members
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage workspace collaborators, roles, permissions, and active workload distribution.
          </p>
        </div>

        {/* Invite CTA Button */}
        <Button
          size="md"
          variant="primary"
          leftIcon={UserPlus}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Invite Member
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, role, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{members.filter((m) => m.status === 'online').length} Online</span>
          <span>•</span>
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>{members.filter((m) => m.status === 'away').length} Away</span>
          <span>•</span>
          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
          <span>{members.filter((m) => m.status === 'offline').length} Offline</span>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} hover className="flex flex-col justify-between">
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} status={member.status} size="lg" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{member.name}</h3>
                    <p className="text-xs text-slate-400">{member.role}</p>
                  </div>
                </div>

                <Badge
                  variant={
                    member.roleType === 'Admin'
                      ? 'brand'
                      : member.roleType === 'Manager'
                      ? 'accent'
                      : 'slate'
                  }
                  size="sm"
                >
                  {member.roleType}
                </Badge>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Department:</span>
                  <span className="text-slate-200 font-medium">{member.department}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Assigned Tasks:</span>
                  <span className="text-brand-300 font-mono font-semibold">
                    {member.assignedTasks} tasks
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 truncate">
                  <span>Email:</span>
                  <span className="text-slate-300 font-mono truncate">{member.email}</span>
                </div>
              </div>
            </CardContent>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 rounded-b-2xl flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  addToast({
                    title: `Messaging ${member.name}`,
                    message: 'Direct messaging shell is available under Messages tab.',
                    type: 'info',
                  })
                }
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                Send Message
              </button>
              <button
                type="button"
                onClick={() =>
                  addToast({
                    title: 'Permissions (Phase 2)',
                    message: `Role settings for ${member.name} will be active in RBAC phase.`,
                    type: 'info',
                  })
                }
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Manage Role
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
