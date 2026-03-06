import getCurrentUser from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await ctx.params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const userId = body.userId as string;

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ownerId: currentUser.id,
    },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const assignee = await prisma.taskAssignee.create({
    data: {
      taskId,
      userId,
    },
  });

  return NextResponse.json({ assignee });
}
