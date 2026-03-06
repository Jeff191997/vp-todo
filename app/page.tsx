import { AddTaskButton } from '@/components/add-task-button';
import { TaskCard } from '@/components/task-card';
import { TaskSearch } from '@/components/task-search';
import getCurrentUser from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';

type Props = {
  searchParams?: Promise<{
    view?: string;
    status?: string;
    category?: string;
    q?: string;
  }>;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  category?: string;
  dueDate?: string;
  assignees?: {
    id: string;
    name: string | null;
    email: string;
  }[];
};

const getTasks = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const tasks = await prisma.task.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      assignees: {
        include: {
          user: true,
        },
      },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    status: t.status,
    category: t.category?.name,
    dueDate: t.dueAt ? t.dueAt.toISOString().slice(0, 10) : undefined,
    assignees: t.assignees.map((a) => ({
      id: a.user.id,
      name: a.user.name,
      email: a.user.email,
    })),
  }));
};

const filterTasks = (
  tasks: Task[],
  params: {
    view?: string;
    status?: string;
    category?: string;
    q?: string;
  },
) => {
  const view = params.view;
  const status = params.status as Task['status'] | undefined;
  const category = params.category;
  const q = (params.q ?? '').trim().toLowerCase();

  if (!view && !status && !category && !q) return tasks;

  let filteredTasks = [...tasks];

  if (status)
    filteredTasks = filteredTasks.filter((task) => task.status === status);
  if (category)
    filteredTasks = filteredTasks.filter((task) => task.category === category);

  if (view === 'today') {
    const today = new Date().toISOString().slice(0, 10);
    filteredTasks = filteredTasks.filter((task) => task.dueDate === today);
  }

  if (q) {
    filteredTasks = filteredTasks.filter((t) => {
      const haystack = [
        t.title,
        t.description ?? '',
        t.category ?? '',
        t.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  return filteredTasks;
};

const HomePage = async ({ searchParams }: Props) => {
  const sp = (await searchParams) ?? {};
  const view = sp.view;
  const status = sp.status;
  const category = sp.category;

  const isOverview = !view && !status && !category;

  const allTasks = await getTasks();
  const tasks = filterTasks(allTasks, sp);

  let title = 'My Dashboard';
  let subtitle = 'Sign in to start managing your tasks';

  const today = new Date().toISOString().slice(0, 10);

  const overdueCount = allTasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'COMPLETED',
  ).length;

  const pendingCount = allTasks.filter((t) => t.status === 'PENDING').length;

  const inProgressCount = allTasks.filter(
    (t) => t.status === 'IN_PROGRESS',
  ).length;

  const completedCount = allTasks.filter(
    (t) => t.status === 'COMPLETED',
  ).length;

  if (view === 'today') {
    title = "Today's tasks";
    subtitle = 'Tasks due today.';
  } else if (status) {
    title = `Tasks: ${status.replace('_', ' ')}`;
    subtitle = 'Filtered by status.';
  } else if (category) {
    title = `Category: ${category}`;
    subtitle = 'Filtered by category.';
  } else if (view === 'tasks') {
    title = 'All Tasks';
    subtitle = 'All tasks in your workspace.';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64 hidden sm:block">
            <TaskSearch />
          </div>
          <div>
            <AddTaskButton />
          </div>
        </div>
      </div>

      {/* Summary */}
      {isOverview && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border/60 p-4">
            <div className="text-sm text-muted-foreground">Overdue</div>
            <div className="text-3xl font-semibold">{overdueCount}</div>
          </div>

          <div className="rounded-xl border border-border/60 p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-3xl font-semibold">{pendingCount}</div>
          </div>

          <div className="rounded-xl border border-border/60 p-4">
            <div className="text-sm text-muted-foreground">In Progress</div>
            <div className="text-3xl font-semibold">{inProgressCount}</div>
          </div>

          <div className="rounded-xl border border-border/60 p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-3xl font-semibold">{completedCount}</div>
          </div>
        </div>
      )}

      {/* Today's Task Session */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          {isOverview ? "Today's Tasks" : 'Tasks'}
        </h2>

        {tasks.length === 0 ?
          <p className="text-sm text-muted-foreground">No tasks found.</p>
        : <div className="space-y-2">
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        }
      </div>
    </div>
  );
};

export default HomePage;
