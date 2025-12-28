// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK API - ÒRBITA EVENTS
// ═══════════════════════════════════════════════════════════════════════════
//
// Endpoint per monitoritzar l'estat del sistema:
// - Estat general del servidor
// - Connexió a base de dades (Supabase)
// - Temps de resposta
// - Versió del deployment
//
// Ús: GET /api/health
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    server: CheckResult;
    database: CheckResult;
    api: CheckResult;
  };
  responseTime: number;
  environment: string;
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  latency?: number;
}

// Track server start time
const serverStartTime = Date.now();

export async function GET() {
  const startTime = Date.now();

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      server: { status: 'pass', message: 'Server responding' },
      database: { status: 'pass', message: 'Not checked' },
      api: { status: 'pass', message: 'API responding' },
    },
    responseTime: 0,
  };

  // Check database connection via Prisma
  try {
    const dbStartTime = Date.now();

    // Simple query to check connection
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
      message: `Database error: ${err instanceof Error ? err.message : 'Unknown'}`,
      latency: dbLatency,
    };
    health.status = 'degraded';
  }

  // Calculate total response time
  health.responseTime = Date.now() - startTime;

  // Determine overall status
  const failedChecks = Object.values(health.checks).filter(c => c.status === 'fail').length;
  const warnChecks = Object.values(health.checks).filter(c => c.status === 'warn').length;

  if (failedChecks > 0) {
    health.status = 'unhealthy';
  } else if (warnChecks > 0) {
    health.status = 'degraded';
  }

  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Status': health.status,
    },
  });
}

// HEAD request for simple uptime checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Status': 'ok',
    },
  });
}
