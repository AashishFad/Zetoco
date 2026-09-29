import React, { useState } from 'react';
import { Kanban, Plus, Filter, Sparkles } from 'lucide-react';
import { Button, Badge } from '../components/ui';
import KanbanBoardView from '../components/kanban/KanbanBoardView';
import CreateTaskModal from '../components/modals/CreateTaskModal';

export default function KanbanBoardPage() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Sprint Kanban Board</span>
            <Badge variant="brand" size="xs">Sprint 14</Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visual task lifecycle management across all workflow stages.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={Plus}
          onClick={() => setIsTaskModalOpen(true)}
        >
          New Task
        </Button>
      </div>

      {/* Kanban Board View */}
      <KanbanBoardView onAddTask={() => setIsTaskModalOpen(true)} />

      {/* Modal */}
      <CreateTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
    </div>
  );
}
