import getCurrentUser from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  await getCurrentUser();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
  });

  return NextResponse.json({ users });
}
