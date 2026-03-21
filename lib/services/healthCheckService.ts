import { Prisma } from '@prisma/client';
import { isBuildPrerenderPhase } from '@/lib/build-phase';

export type HealthCheckResult = {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  latency?: number;
};

export type HealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
  checks: {
    server: HealthCheckResult;
    database: HealthCheckResult;
    api: HealthCheckResult;
    sentry: HealthCheckResult;
  };
  responseTime: number;
  environment?: string;
};

export async function checkDatabaseHealth(exposeDetails: boolean): Promise<HealthCheckResult> {
  const dbStartTime = Date.now();

  if (isBuildPrerenderPhase()) {
    return {
      status: 'warn',
      message: 'Database check skipped during build',
      latency: 0,
    };
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);
    return {
      status: 'pass',
      message: 'Database connected',
      latency: Date.now() - dbStartTime,
    };
  } catch (err) {
    return {
      status: 'warn',
      message: exposeDetails
        ? `Database error: ${err instanceof Error ? err.message : 'Unknown'}`
        : 'Database error',
      latency: Date.now() - dbStartTime,
    };
  }
}

export function createBaseHealthStatus(params: { exposeDetails: boolean; serverStartTime: number }): HealthStatus {
  const { exposeDetails, serverStartTime } = params;

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    version: exposeDetails
      ? process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7)
        || process.env.GIT_COMMIT_SHA?.slice(0, 7)
        || 'local'
      : undefined,
    environment: exposeDetails ? process.env.NODE_ENV || 'development' : undefined,
    checks: {
      server: { status: 'pass', message: 'Server responding' },
      database: { status: 'pass', message: 'Not checked' },
      api: { status: 'pass', message: 'API responding' },
      sentry: { status: 'pass', message: 'Monitoring configured' },
    },
    responseTime: 0,
  };
}

export function applySentryHealth(health: HealthStatus): void {
  const sentryConfigured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!sentryConfigured) {
    health.checks.sentry = {
      status: process.env.NODE_ENV === 'production' ? 'warn' : 'pass',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Sentry DSN not configured'
          : 'Sentry optional in non-production',
    };
  }
}

export function finalizeHealthStatus(health: HealthStatus, startTime: number): { health: HealthStatus; statusCode: number } {
  health.responseTime = Date.now() - startTime;

  const failedChecks = Object.values(health.checks).filter((c) => c.status === 'fail').length;
  const warnChecks = Object.values(health.checks).filter((c) => c.status === 'warn').length;

  if (failedChecks > 0) {
    health.status = 'unhealthy';
  } else if (warnChecks > 0) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  return { health, statusCode };
}

export function createFallbackHealthStatus(serverStartTime: number, startTime: number): HealthStatus {
  return {
    status: 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    checks: {
      server: { status: 'pass', message: 'Server responding' },
      database: { status: 'warn', message: 'Database check unavailable' },
      api: { status: 'pass', message: 'API responding' },
      sentry: {
        status: process.env.NODE_ENV === 'production' ? 'warn' : 'pass',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Sentry status unavailable'
            : 'Sentry optional in non-production',
      },
    },
    responseTime: Date.now() - startTime,
  };
}

