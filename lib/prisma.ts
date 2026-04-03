// Singleton de PrismaClient para Next.js.
// Evita multiples instancias en desarrollo durante hot reload.

import { PrismaClient } from '@prisma/client';

function buildDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? '';
  if (process.env.NODE_ENV === 'production' && url && !url.includes('connection_limit')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}connection_limit=10`;
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? process.env.PRISMA_LOG_QUERIES === '1'
          ? ['query', 'error', 'warn']
          : ['error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  });

globalForPrisma.prisma = prisma;
