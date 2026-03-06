import { prisma } from '@/lib/prisma';

export async function getOrCreateUser(email: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
    },
  });
}
