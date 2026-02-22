// lib/prisma.ts
// Singleton de PrismaClient para Next.js
// Evita múltiples instancias en desarrollo (hot reload)

import { PrismaClient } from '@prisma/client';

// Exportación del tipo para TypeScript
export type { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? (process.env.PRISMA_LOG_QUERIES === '1' ? ['query', 'error', 'warn'] : ['error', 'warn'])
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
