// HEALTH CHECK API - ORBITA EVENTS
// Endpoint para monitorizar estado del sistema.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
  checks: {
    server: CheckResult;
    database: CheckResult;
    api: CheckResult;
  };
  responseTime: number;
  environment?: string;
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  latency?: number;
}

const serverStartTime = Date.now();

export async function GET() {
  const startTime = Date.now();
  const exposeDetails = process.env.HEALTH_EXPOSE_DETAILS === 'true' || process.env.NODE_ENV !== 'production';

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    version: exposeDetails
      ? process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ||
        process.env.GIT_COMMIT_SHA?.slice(0, 7) ||
        'local'
      : undefined,
    environment: exposeDetails ? process.env.NODE_ENV || 'development' : undefined,
    checks: {
      server: { status: 'pass', message: 'Server responding' },
      database: { status: 'pass', message: 'Not checked' },
      api: { status: 'pass', message: 'API responding' },
    },
    responseTime: 0,
  };

  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;

    const dbLatency = Date.now() - dbStartTime;
    health.checks.database = {
      status: 'pass',
      message: 'Database connected',
      latency: dbLatency,
    };
  } catch (err) {
    const dbLatency = Date.now() - startTime;
    health.checks.database = {
      status: 'warn',
      message: exposeDetails
        ? `Database error: ${err instanceof Error ? err.message : 'Unknown'}`
        : 'Database error',
      latency: dbLatency,
    };
    health.status = 'degraded';
  }

  health.responseTime = Date.now() - startTime;

  const failedChecks = Object.values(health.checks).filter(c => c.status === 'fail').length;
  const warnChecks = Object.values(health.checks).filter(c => c.status === 'warn').length;

  if (failedChecks > 0) {
    health.status = 'unhealthy';
  } else if (warnChecks > 0) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Status': health.status,
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Status': 'ok',
    },
  });
}
