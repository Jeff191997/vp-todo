import getCurrentUser from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

type TaskUpdateBody = {
  completed?: boolean;
  status?: string;
  title?: string;
  description?: string;
  categoryName?: string;
  dueDate?: string;
  assigneeIds?: string[];
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  let body: TaskUpdateBody = {};
  try {
    body = await req.json();
  } catch {}

  let nextStatus: TaskStatus | undefined;

  if (typeof body.completed === 'boolean') {
    nextStatus = body.completed ? TaskStatus.COMPLETED : TaskStatus.PENDING;
  } else if (typeof body.status === 'string') {
    const s = body.status as TaskStatus;
    const allowed: TaskStatus[] = [
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS,
      TaskStatus.COMPLETED,
    ];
    if (!allowed.includes(s)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    nextStatus = s;
  }

  try {
    const exists = await prisma.task.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    let categoryId: string | null | undefined;

    if (body.categoryName !== undefined) {
      const name = body.categoryName.trim();

      if (!name) {
        // allow clearing category
        categoryId = null;
      } else {
        const category = await prisma.category.upsert({
          where: {
            userId_name: {
              userId,
              name,
            },
          },
          update: {},
          create: { name, userId },
        });

        categoryId = category.id;
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(nextStatus && { status: nextStatus }),
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.description !== undefined && {
          description: body.description ? body.description : null,
        }),
        ...(body.dueDate !== undefined && {
          dueAt: body.dueDate ? new Date(body.dueDate) : null,
        }),
        ...(categoryId !== undefined && { categoryId }),
      },
    });

    if (body.assigneeIds !== undefined) {
      await prisma.taskAssignee.deleteMany({
        where: { taskId: id },
      });

      if (body.assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: body.assigneeIds.map((userId) => ({
            taskId: id,
            userId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ task: updated });
  } catch (e: unknown) {
    console.error(e);

    const error = e as { code?: string };
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const exists = await prisma.task.findFirst({
      where: { id, ownerId: user.id },
      select: { id: true },
    });

    if (!exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
