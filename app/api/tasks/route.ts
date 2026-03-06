import getCurrentUser from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { ownerId: user.id },
    orderBy: [{ createdAt: 'desc' }],
    include: { category: true, assignees: { include: { user: true } } },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const title = String(body.title ?? '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const description =
    body.description && String(body.description).trim().length > 0 ?
      String(body.description)
    : null;

  const dueAt =
    body.dueDate && String(body.dueDate).trim().length > 0 ?
      new Date(String(body.dueDate))
    : null;

  let categoryId: string | null = null;
  const categoryName = String(body.categoryName ?? '').trim();

  if (categoryName) {
    const category = await prisma.category.upsert({
      where: {
        userId_name: { userId: user.id, name: categoryName },
      },
      update: {},
      create: { userId: user.id, name: categoryName },
    });

    categoryId = category.id;
  }

  const created = await prisma.task.create({
    data: {
      title,
      description,
      dueAt,
      ownerId: user.id,
      categoryId,
      status: TaskStatus.PENDING,
    },
    include: { category: true },
  });

  return NextResponse.json({ task: created }, { status: 201 });
}
