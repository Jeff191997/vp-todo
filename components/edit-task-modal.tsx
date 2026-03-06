'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

import { emitSidebarRefresh } from '@/lib/events';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';

type Task = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  dueDate?: string;
  assignees?: {
    id: string;
    name: string | null;
    email: string;
  }[];
};

type Props = {
  task: Task;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const EditTaskModal = ({ task, open, onOpenChange }: Props) => {
  const router = useRouter();

  const [title, setTitle] = useState(() => task.title);
  const [description, setDescription] = useState(() => task.description ?? '');
  const [category, setCategory] = useState(() => task.category ?? '');
  const [dueDate, setDueDate] = useState(() => task.dueDate ?? '');

  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<
    { id: string; name: string | null; email: string }[]
  >([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    async function loadUsers() {
      const res = await fetch('/api/users');

      if (!res.ok) return;

      const data = await res.json();
      setUsers(data.users);
    }

    loadUsers();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setSelectedAssignees(task.assignees?.map((a) => a.id) ?? []);
  }, [open, task]);

  async function updateTask(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categoryName: category,
          dueDate,
          assigneeIds: selectedAssignees,
        }),
      });

      if (!res.ok) {
        console.error('Failed to update a task.');
        return;
      }

      emitSidebarRefresh();

      router.refresh();

      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={updateTask} className="space-y-4">
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Assign users</label>

            <Select
              onValueChange={(userId) => {
                if (!selectedAssignees.includes(userId)) {
                  setSelectedAssignees([...selectedAssignees, userId]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>

              <SelectContent>
                {users
                  .filter((u) => !selectedAssignees.includes(u.id))
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedAssignees.map((id) => {
                const u = users.find((x) => x.id === id);

                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedAssignees(
                        selectedAssignees.filter((x) => x !== id),
                      )
                    }
                  >
                    {u?.name ?? u?.email} ✕
                  </Badge>
                );
              })}
            </div>
          </div>

          <Button disabled={loading} type="submit">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
