import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { $queryRaw: vi.fn() },
}));

import {
  checkDatabaseHealth,
  createBaseHealthStatus,
  applySentryHealth,
  finalizeHealthStatus,
  createFallbackHealthStatus,
  type HealthStatus,
} from '@/lib/services/healthCheckService';

describe('checkDatabaseHealth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna pass si BD respon', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([{ 1: 1 }]);

    const result = await checkDatabaseHealth(true);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('Database connected');
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it('retorna warn amb detalls si BD falla (exposeDetails=true)', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection refused'));

    const result = await checkDatabaseHealth(true);
    expect(result.status).toBe('warn');
    expect(result.message).toContain('Connection refused');
  });

  it('retorna warn sense detalls si BD falla (exposeDetails=false)', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Secret error'));

    const result = await checkDatabaseHealth(false);
    expect(result.status).toBe('warn');
    expect(result.message).toBe('Database error');
    expect(result.message).not.toContain('Secret');
  });
});

describe('createBaseHealthStatus', () => {
  it('retorna health status amb checks base', () => {
    const serverStartTime = Date.now() - 60000;
    const health = createBaseHealthStatus({ exposeDetails: true, serverStartTime });

    expect(health.status).toBe('healthy');
    expect(health.timestamp).toBeTruthy();
    expect(health.uptime).toBeGreaterThanOrEqual(59);
    expect(health.checks.server.status).toBe('pass');
    expect(health.checks.database.status).toBe('pass');
    expect(health.checks.api.status).toBe('pass');
    expect(health.checks.sentry.status).toBe('pass');
  });

  it('inclou versió si exposeDetails=true', () => {
    const health = createBaseHealthStatus({ exposeDetails: true, serverStartTime: Date.now() });
    // Hauria de ser 'local' en test environment
    expect(health.version).toBeDefined();
  });

  it('no inclou versió si exposeDetails=false', () => {
    const health = createBaseHealthStatus({ exposeDetails: false, serverStartTime: Date.now() });
    expect(health.version).toBeUndefined();
    expect(health.environment).toBeUndefined();
  });
});

describe('applySentryHealth', () => {
  it('no canvia res si SENTRY_DSN configurat', () => {
    const orig = process.env.SENTRY_DSN;
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';

    const health = createBaseHealthStatus({ exposeDetails: true, serverStartTime: Date.now() });
    applySentryHealth(health);

    expect(health.checks.sentry.status).toBe('pass');
    process.env.SENTRY_DSN = orig;
  });

  it('marca warn si Sentry no configurat en producció', () => {
    vi.stubEnv('SENTRY_DSN', '');
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
    vi.stubEnv('NODE_ENV', 'production');

    const health = createBaseHealthStatus({ exposeDetails: true, serverStartTime: Date.now() });
    applySentryHealth(health);

    expect(health.checks.sentry.status).toBe('warn');
    expect(health.checks.sentry.message).toContain('not configured');

    vi.unstubAllEnvs();
  });

  it('marca pass si Sentry no configurat en development', () => {
    vi.stubEnv('SENTRY_DSN', '');
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
    vi.stubEnv('NODE_ENV', 'development');

    const health = createBaseHealthStatus({ exposeDetails: true, serverStartTime: Date.now() });
    applySentryHealth(health);

    expect(health.checks.sentry.status).toBe('pass');

    vi.unstubAllEnvs();
  });
});

describe('finalizeHealthStatus', () => {
  function makeHealth(checks: Partial<HealthStatus['checks']> = {}): HealthStatus {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 100,
      checks: {
        server: { status: 'pass', message: 'OK' },
        database: { status: 'pass', message: 'OK' },
        api: { status: 'pass', message: 'OK' },
        sentry: { status: 'pass', message: 'OK' },
        ...checks,
      },
      responseTime: 0,
    };
  }

  it('retorna healthy + 200 si tot pass', () => {
    const { health, statusCode } = finalizeHealthStatus(makeHealth(), Date.now());
    expect(health.status).toBe('healthy');
    expect(statusCode).toBe(200);
    expect(health.responseTime).toBeGreaterThanOrEqual(0);
  });

  it('retorna degraded + 200 si hi ha warns', () => {
    const { health, statusCode } = finalizeHealthStatus(
      makeHealth({ sentry: { status: 'warn', message: 'Missing DSN' } }),
      Date.now()
    );
    expect(health.status).toBe('degraded');
    expect(statusCode).toBe(200);
  });

  it('retorna unhealthy + 503 si hi ha fails', () => {
    const { health, statusCode } = finalizeHealthStatus(
      makeHealth({ database: { status: 'fail', message: 'Down' } }),
      Date.now()
    );
    expect(health.status).toBe('unhealthy');
    expect(statusCode).toBe(503);
  });

  it('fail té prioritat sobre warn', () => {
    const { health } = finalizeHealthStatus(
      makeHealth({
        database: { status: 'fail', message: 'Down' },
        sentry: { status: 'warn', message: 'Missing' },
      }),
      Date.now()
    );
    expect(health.status).toBe('unhealthy');
  });
});

describe('createFallbackHealthStatus', () => {
  it('retorna degraded amb database warn', () => {
    const health = createFallbackHealthStatus(Date.now() - 30000, Date.now());
    expect(health.status).toBe('degraded');
    expect(health.checks.database.status).toBe('warn');
    expect(health.checks.server.status).toBe('pass');
    expect(health.uptime).toBeGreaterThanOrEqual(29);
    expect(health.responseTime).toBeGreaterThanOrEqual(0);
  });
});
