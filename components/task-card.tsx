'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { emitSidebarRefresh } from '@/lib/events';
import { Pencil, Trash2 } from 'lucide-react';
import EditTaskModal from './edit-task-modal';

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    category?: string;
    dueDate?: string;
    assignees?: {
      id: string;
      name: string | null;
      email: string;
    }[];
  };
};

function statusLabel(s: TaskStatus) {
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'COMPLETED') return 'Completed';
  return 'Pending';
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function patchTask(body: { completed?: boolean; status?: TaskStatus }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to update task', res.status, text);
        return;
      }

      emitSidebarRefresh();

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask() {
    const confirmDelete = confirm('Delete this task?');

    if (!confirmDelete) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Failed to delete task');
        return;
      }

      emitSidebarRefresh();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const completed = task.status === 'COMPLETED';

  return (
    <div>
      <div className="rounded-xl border border-border/60 p-3 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={completed}
            disabled={loading}
            onCheckedChange={(v) => patchTask({ completed: Boolean(v) })}
            className="my-1"
          />

          <div className="min-w-0">
            <div
              className={[
                'font-medium truncate',
                completed ? 'line-through text-muted-foreground' : '',
              ].join(' ')}
            >
              {task.title}
            </div>

            {task.assignees && task.assignees.length > 0 && (
              <div className="flex space-x-2">
                {task.assignees.map((u) => (
                  <Badge key={u.id} className="bg-blue-100 text-blue-700">
                    {u.name ?? u.email}
                  </Badge>
                ))}
              </div>
            )}

            {task.description && (
              <div className="text-sm text-muted-foreground truncate">
                {task.description}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {task.category && <Badge variant="outline">{task.category}</Badge>}

          <Select
            value={task.status}
            onValueChange={(v) => patchTask({ status: v as TaskStatus })}
            disabled={loading}
          >
            <SelectTrigger className="w-140px">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">{statusLabel('PENDING')}</SelectItem>
              <SelectItem value="IN_PROGRESS">
                {statusLabel('IN_PROGRESS')}
              </SelectItem>
              <SelectItem value="COMPLETED">
                {statusLabel('COMPLETED')}
              </SelectItem>
            </SelectContent>
          </Select>

          {task.dueDate && (
            <Badge variant="outline" className="">
              {task.dueDate}
            </Badge>
          )}

          <button
            onClick={() => setEditOpen(true)}
            className="h-4 w-4 text-muted-foreground"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={deleteTask}
            disabled={loading}
            className="h-4 w-4 text-muted-foreground"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <EditTaskModal open={editOpen} onOpenChange={setEditOpen} task={task} />
    </div>
  );
}
