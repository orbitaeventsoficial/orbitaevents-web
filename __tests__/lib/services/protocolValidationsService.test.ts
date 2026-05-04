import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  PROTOCOL_VALIDATION_SETTING_KEY,
  loadCanviValidations,
  recordCanviValidation,
  removeCanviValidation,
  summarizeValidations,
  type CanviValidation,
} from '@/lib/services/protocolValidationsService';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    adminLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const settingFindUnique = prisma.setting.findUnique as unknown as ReturnType<typeof vi.fn>;
const settingUpsert = prisma.setting.upsert as unknown as ReturnType<typeof vi.fn>;
const adminLogCreate = prisma.adminLog.create as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  settingFindUnique.mockReset();
  settingUpsert.mockReset();
  adminLogCreate.mockReset();
  adminLogCreate.mockResolvedValue({});
});

describe('summarizeValidations', () => {
  it('retorna 0% quan no hi ha cap canvi al protocol', () => {
    expect(summarizeValidations(0, new Map())).toEqual({
      totalCanvis: 0,
      validatedCount: 0,
      pendingCount: 0,
      validatedPercent: 0,
    });
  });

  it('calcula percentatge amb 1 decimal', () => {
    const map = new Map<number, CanviValidation>();
    map.set(1, { canviN: 1, validatedAt: '2026-04-30T00:00:00.000Z', validatedBy: 'jordi' });
    expect(summarizeValidations(3, map).validatedPercent).toBeCloseTo(33.3, 1);
  });

  it('cap la quantitat de validats al total de canvis', () => {
    const map = new Map<number, CanviValidation>();
    map.set(1, { canviN: 1, validatedAt: 'x', validatedBy: 'jordi' });
    map.set(2, { canviN: 2, validatedAt: 'x', validatedBy: 'jordi' });
    map.set(3, { canviN: 3, validatedAt: 'x', validatedBy: 'jordi' });
    const summary = summarizeValidations(2, map);
    expect(summary.totalCanvis).toBe(2);
    expect(summary.validatedCount).toBe(2);
    expect(summary.pendingCount).toBe(0);
    expect(summary.validatedPercent).toBe(100);
  });

  it('ignora validacions que no corresponen a cap canvi present al protocol', () => {
    const map = new Map<number, CanviValidation>();
    map.set(1, { canviN: 1, validatedAt: 'x', validatedBy: 'jordi' });
    map.set(999, { canviN: 999, validatedAt: 'x', validatedBy: 'jordi' });
    const summary = summarizeValidations(2, map, [1, 2]);
    expect(summary).toEqual({
      totalCanvis: 2,
      validatedCount: 1,
      pendingCount: 1,
      validatedPercent: 50,
    });
  });

  it('100% quan tots els canvis tenen validació', () => {
    const map = new Map<number, CanviValidation>();
    map.set(1, { canviN: 1, validatedAt: 'x', validatedBy: 'jordi' });
    map.set(2, { canviN: 2, validatedAt: 'x', validatedBy: 'jordi' });
    expect(summarizeValidations(2, map)).toMatchObject({ validatedPercent: 100, pendingCount: 0 });
  });
});

describe('loadCanviValidations', () => {
  it('retorna Map buit quan no hi ha cap setting', async () => {
    settingFindUnique.mockResolvedValueOnce(null);
    const result = await loadCanviValidations();
    expect(result.size).toBe(0);
    expect(settingFindUnique).toHaveBeenCalledWith({
      where: { key: PROTOCOL_VALIDATION_SETTING_KEY },
    });
  });

  it('parseja correctament una llista vàlida del setting JSON', async () => {
    const payload: CanviValidation[] = [
      { canviN: 462, validatedAt: '2026-04-30T10:00:00.000Z', validatedBy: 'jordi', notes: 'OK al desktop' },
      { canviN: 463, validatedAt: '2026-04-30T11:00:00.000Z', validatedBy: 'jordi' },
    ];
    settingFindUnique.mockResolvedValueOnce({ value: JSON.stringify(payload) });
    const result = await loadCanviValidations();
    expect(result.size).toBe(2);
    expect(result.get(462)?.notes).toBe('OK al desktop');
    expect(result.get(463)?.validatedBy).toBe('jordi');
  });

  it('descarta entrades del setting amb forma invàlida i mai trenca', async () => {
    settingFindUnique.mockResolvedValueOnce({
      value: JSON.stringify([
        { canviN: 100, validatedAt: '2026-04-30T00:00:00.000Z', validatedBy: 'jordi' },
        { canviN: 'not-a-number', validatedAt: 'x', validatedBy: 'jordi' },
        { canviN: 200, validatedAt: '', validatedBy: 'jordi' },
        { canviN: 300, validatedAt: '2026-04-30T00:00:00.000Z', validatedBy: '' },
        { canviN: 400, validatedAt: '2026-04-30T00:00:00.000Z', validatedBy: 'codex' },
      ]),
    });
    const result = await loadCanviValidations();
    expect(result.size).toBe(2);
    expect(Array.from(result.keys()).sort()).toEqual([100, 400]);
  });

  it('retorna Map buit quan el setting porta JSON malformat', async () => {
    settingFindUnique.mockResolvedValueOnce({ value: '{ this is not json' });
    const result = await loadCanviValidations();
    expect(result.size).toBe(0);
  });
});

describe('recordCanviValidation', () => {
  it('crea/upserta el setting amb la nova validació afegida', async () => {
    settingFindUnique.mockResolvedValueOnce(null);
    settingUpsert.mockResolvedValueOnce({});
    const now = new Date('2026-04-30T12:00:00.000Z');
    const validation = await recordCanviValidation({
      canviN: 462,
      validatedBy: 'jordi',
      notes: ' valid des del desktop ',
      now,
    });
    expect(validation).toEqual({
      canviN: 462,
      validatedAt: '2026-04-30T12:00:00.000Z',
      validatedBy: 'jordi',
      notes: 'valid des del desktop',
    });
    expect(settingUpsert).toHaveBeenCalledOnce();
    const upsertArgs = settingUpsert.mock.calls[0]![0];
    expect(upsertArgs.where.key).toBe(PROTOCOL_VALIDATION_SETTING_KEY);
    expect(JSON.parse(upsertArgs.create.value)).toEqual([validation]);
    expect(adminLogCreate).toHaveBeenCalledOnce();
  });

  it('substitueix una validació prèvia del mateix canviN', async () => {
    const previous: CanviValidation = {
      canviN: 462,
      validatedAt: '2026-04-29T00:00:00.000Z',
      validatedBy: 'jordi',
      notes: 'antiga',
    };
    settingFindUnique.mockResolvedValueOnce({ value: JSON.stringify([previous]) });
    settingUpsert.mockResolvedValueOnce({});
    const now = new Date('2026-04-30T00:00:00.000Z');
    await recordCanviValidation({ canviN: 462, validatedBy: 'jordi', now });
    const upsertArgs = settingUpsert.mock.calls[0]![0];
    const stored = JSON.parse(upsertArgs.update.value) as CanviValidation[];
    expect(stored).toHaveLength(1);
    expect(stored[0]?.validatedAt).toBe('2026-04-30T00:00:00.000Z');
    expect(stored[0]?.notes).toBeUndefined();
  });

  it('rebutja canviN no positiu o validatedBy buit', async () => {
    await expect(recordCanviValidation({ canviN: 0, validatedBy: 'jordi' })).rejects.toThrow();
    await expect(recordCanviValidation({ canviN: 1.5, validatedBy: 'jordi' })).rejects.toThrow();
    await expect(recordCanviValidation({ canviN: 100, validatedBy: '   ' })).rejects.toThrow();
    expect(settingUpsert).not.toHaveBeenCalled();
  });
});

describe('removeCanviValidation', () => {
  it('retorna false si no hi ha cap validació per al canviN', async () => {
    settingFindUnique.mockResolvedValueOnce(null);
    const removed = await removeCanviValidation(999);
    expect(removed).toBe(false);
    expect(settingUpsert).not.toHaveBeenCalled();
  });

  it('elimina la validació i persisteix la resta', async () => {
    const payload: CanviValidation[] = [
      { canviN: 462, validatedAt: 'x', validatedBy: 'jordi' },
      { canviN: 463, validatedAt: 'x', validatedBy: 'jordi' },
    ];
    settingFindUnique.mockResolvedValueOnce({ value: JSON.stringify(payload) });
    settingUpsert.mockResolvedValueOnce({});
    const removed = await removeCanviValidation(462);
    expect(removed).toBe(true);
    const upsertArgs = settingUpsert.mock.calls[0]![0];
    const stored = JSON.parse(upsertArgs.update.value) as CanviValidation[];
    expect(stored.map((v) => v.canviN)).toEqual([463]);
  });
});
