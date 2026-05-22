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

declare global {
  // eslint-disable-next-line no-var -- `var` és obligatori a `declare global` per fer el singleton de Prisma compatible amb hot reload de Next.js
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
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

globalThis.prisma = prisma;
