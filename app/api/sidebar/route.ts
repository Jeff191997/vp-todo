import getCurrentUser from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groupStatus = await prisma.task.groupBy({
    by: ['status'],
    where: { ownerId: user.id },
    _count: { _all: true },
  });

  const statusCounts: Record<TaskStatus, number> = {
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
  };

  for (const row of groupStatus) {
    statusCounts[row.status] = row._count._all;
  }

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  const categoryCounts = categories.map((c) => ({
    name: c.name,
    count: c._count.tasks,
  }));

  return NextResponse.json({
    total,
    statusCounts,
    categoryCounts,
  });
}
