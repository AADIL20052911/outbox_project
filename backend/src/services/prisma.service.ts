import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('[Prisma] Disconnected from database.');
  } catch (err) {
    console.error('[Prisma] Disconnect error:', err);
  }
}
