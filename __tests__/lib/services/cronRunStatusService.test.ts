import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  saveCronRunStatus,
  readCronRunStatus,
  readCronRunStatuses,
} from '@/lib/services/cronRunStatusService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findMany.mockResolvedValue([]);
  mockPrisma.setting.upsert.mockResolvedValue({});
});

describe('saveCronRunStatus', () => {
  it('guarda status i lastRun', async () => {
    await saveCronRunStatus({
      prefix: 'cron.daily',
      status: 'ok',
      timestamp: '2026-03-18T10:00:00Z',
    });

    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'cron.daily.lastRun' },
      })
    );
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'cron.daily.lastStatus' },
      })
    );
  });

  it('guarda summary si es proporciona', async () => {
    await saveCronRunStatus({
      prefix: 'cron.daily',
      status: 'ok',
      summary: { created: 5 },
    });

    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'cron.daily.lastSummary' },
      })
    );
  });

  it('guarda message si es proporciona', async () => {
    await saveCronRunStatus({
      prefix: 'cron.daily',
      status: 'error',
      message: 'DB connection failed',
    });

    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'cron.daily.lastMessage' },
      })
    );
  });
});

describe('readCronRunStatus', () => {
  it('retorna snapshot amb health unknown si no hi ha dades', async () => {
    const result = await readCronRunStatus('cron.daily');

    expect(result.lastRun).toBeNull();
    expect(result.lastStatus).toBeNull();
    expect(result.health).toBe('unknown');
  });

  it('retorna health ok si execució recent', async () => {
    const recentRun = new Date().toISOString();
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'cron.daily.lastRun', value: recentRun },
      { key: 'cron.daily.lastStatus', value: 'ok' },
    ]);

    const result = await readCronRunStatus('cron.daily');

    expect(result.health).toBe('ok');
    expect(result.lastRun).toBe(recentRun);
  });

  it('retorna health error si últim status error', async () => {
    const recentRun = new Date().toISOString();
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'cron.daily.lastRun', value: recentRun },
      { key: 'cron.daily.lastStatus', value: 'error' },
    ]);

    const result = await readCronRunStatus('cron.daily');

    expect(result.health).toBe('error');
  });

  it('retorna health warning si execució antiga (>26h)', async () => {
    const oldRun = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'cron.daily.lastRun', value: oldRun },
      { key: 'cron.daily.lastStatus', value: 'ok' },
    ]);

    const result = await readCronRunStatus('cron.daily');

    expect(result.health).toBe('warning');
  });

  it('parseja lastSummary JSON', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'cron.daily.lastRun', value: new Date().toISOString() },
      { key: 'cron.daily.lastSummary', value: '{"created":5}' },
    ]);

    const result = await readCronRunStatus('cron.daily');

    expect(result.lastSummary).toEqual({ created: 5 });
  });
});

describe('readCronRunStatuses', () => {
  it('retorna array buit per definicions buides', async () => {
    const result = await readCronRunStatuses([]);
    expect(result).toEqual([]);
  });

  it('retorna múltiples snapshots', async () => {
    const now = new Date().toISOString();
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'cron.a.lastRun', value: now },
      { key: 'cron.a.lastStatus', value: 'ok' },
      { key: 'cron.b.lastRun', value: now },
      { key: 'cron.b.lastStatus', value: 'error' },
    ]);

    const result = await readCronRunStatuses([
      { prefix: 'cron.a', name: 'Cron A' },
      { prefix: 'cron.b', name: 'Cron B' },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].health).toBe('ok');
    expect(result[1].health).toBe('error');
    // Preserves extra properties
    expect((result[0] as { name: string }).name).toBe('Cron A');
  });
});
