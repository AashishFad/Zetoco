import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Users,
  CheckSquare,
  Clock,
  ArrowRight,
  MoreVertical,
  Calendar,
  Layers,
  Building
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, Avatar, AvatarGroup, Dropdown, DropdownItem, useToast } from '../components/ui';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import { useProject } from '../context/ProjectContext';
import { useOrganization } from '../context/OrganizationContext';

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { projects, loading } = useProject();
  const { currentOrganization, can } = useOrganization();
  const { addToast } = useToast();

  const canCreateProject = can('projects.create');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active':
        return 'brand';
      case 'planning':
        return 'cyan';
      case 'on_hold':
        return 'warning';
      case 'completed':
        return 'success';
      case 'archived':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'brand';
      case 'low':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F7] tracking-tight">
              Projects
            </h1>
            <Badge variant="brand" size="xs">
              {currentOrganization?.name || 'Workspace'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Manage your workspace roadmaps, deliverables, and sprint team workspaces.
          </p>
        </div>

        {canCreateProject && (
          <Button
            size="sm"
            leftIcon={Plus}
            onClick={() => setIsCreateOpen(true)}
          >
            New Project
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#111114] p-2.5 rounded-lg border border-[#292930] shadow-sm">
        <div className="w-full lg:w-80">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={Search}
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {['ALL', 'planning', 'active', 'on_hold', 'completed', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded font-medium capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                  : 'bg-[#0B0B0E] text-[#71717A] hover:text-[#F5F5F7] border border-[#1F1F24]'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {['ALL', 'urgent', 'high', 'medium', 'low'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-2.5 py-1 rounded font-medium capitalize whitespace-nowrap transition-colors ${
                priorityFilter === pr
                  ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                  : 'bg-[#0B0B0E] text-[#71717A] hover:text-[#F5F5F7] border border-[#1F1F24]'
              }`}
            >
              {pr === 'ALL' ? 'All Priority' : pr}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 bg-surface-900 rounded-2xl border border-surface-700 animate-pulse p-6" />
          ))}
        </div>
      )}

      {/* Empty States */}
      {!loading && projects.length === 0 && (
        <Card className="p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-surface-100">No Projects Yet</h2>
          <p className="text-xs sm:text-sm text-surface-400 mt-1 max-w-md mx-auto">
            Create your first project to start organizing team deliverables, sprint milestones, and collaborative task boards.
          </p>
          {canCreateProject && (
            <div className="pt-5">
              <Button onClick={() => setIsCreateOpen(true)} leftIcon={Plus}>
                Create Project
              </Button>
            </div>
          )}
        </Card>
      )}

      {!loading && projects.length > 0 && filteredProjects.length === 0 && (
        <div className="p-12 text-center text-[#71717A] bg-[#111114] rounded-lg border border-[#292930]">
          <p className="text-sm font-medium text-[#F5F5F7]">No matching projects found</p>
          <p className="text-xs mt-1">Try adjusting your search query or status/priority filters.</p>
        </div>
      )}

      {/* Project Cards Grid */}
      {!loading && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p) => {
            const statusVariant = getStatusVariant(p.status);
            const priorityVariant = getPriorityVariant(p.priority);
            const code = p.name ? p.name.substring(0, 3).toUpperCase() : 'PRJ';
            const isArchived = p.status === 'archived';

            return (
              <Card
                key={p.id}
                hover
                className={`flex flex-col justify-between transition-all ${
                  isArchived ? 'opacity-70 border-dashed' : ''
                }`}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
                      {code}
                    </div>
                    <div>
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-base font-semibold text-[#F5F5F7] hover:text-indigo-400 transition-colors flex items-center gap-2"
                      >
                        <span>{p.name}</span>
                      </Link>
                      <p className="text-[11px] text-[#71717A] mt-0.5">
                        {p.creator?.full_name ? `Lead: ${p.creator.full_name}` : `Key: ${p.slug}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant={priorityVariant} size="xs">
                      {p.priority}
                    </Badge>
                    <Badge variant={statusVariant} size="xs" dot>
                      {p.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed min-h-[32px]">
                    {p.description || 'No description provided for this project workspace.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[#71717A] pt-2 border-t border-[#1F1F24]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>{p.due_date ? `Due ${new Date(p.due_date).toLocaleDateString()}` : 'No due date'}</span>
                    </span>

                    <span className="text-[11px] font-medium text-[#A1A1AA]">
                      {p.membersCount} {p.membersCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </CardContent>

                <div className="p-4 pt-2.5 border-t border-[#1F1F24] flex items-center justify-between">
                  <AvatarGroup max={3} size="xs">
                    {(p.members || []).map((m) => (
                      <Avatar key={m.id || m.userId} name={m.fullName} size="xs" />
                    ))}
                  </AvatarGroup>

                  <Link to={`/projects/${p.id}`}>
                    <Button variant="outline" size="xs" rightIcon={ArrowRight}>
                      View Project
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
