// HEALTH CHECK API - ORBITA EVENTS
// Endpoint para monitorizar estado del sistema.

import { NextResponse } from 'next/server';
import {
  applySentryHealth,
  checkDatabaseHealth,
  createBaseHealthStatus,
  createFallbackHealthStatus,
  finalizeHealthStatus,
} from '@/lib/services/healthCheckService';

const serverStartTime = Date.now();

export async function GET() {
  const startTime = Date.now();
  const exposeDetails = process.env.HEALTH_EXPOSE_DETAILS === 'true' || process.env.NODE_ENV !== 'production';

  try {
    const health = createBaseHealthStatus({ exposeDetails, serverStartTime });
    applySentryHealth(health);

    const databaseCheck = await checkDatabaseHealth(exposeDetails);
    health.checks.database = databaseCheck;
    if (databaseCheck.status === 'warn') {
      health.status = 'degraded';
    }

    const { health: finalizedHealth, statusCode } = finalizeHealthStatus(health, startTime);

    return NextResponse.json(finalizedHealth, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Status': finalizedHealth.status,
      },
    });
  } catch {
    const fallback = createFallbackHealthStatus(serverStartTime, startTime);
    return NextResponse.json(fallback, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Status': fallback.status,
      },
    });
  }
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Status': 'ok',
    },
  });
}
