import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminSettings,
  updateAdminSettings,
  createAdminSetting,
} from '@/lib/services/adminSettingsService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findMany.mockResolvedValue([]);
  mockPrisma.setting.update.mockResolvedValue({});
  mockPrisma.setting.create.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('listAdminSettings', () => {
  it('retorna settings agrupats per categoria', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'site.title', value: 'Òrbita', type: 'STRING', category: 'site' },
      { key: 'site.email', value: 'info@orbita.com', type: 'STRING', category: 'site' },
      { key: 'pricing.margin', value: '35', type: 'NUMBER', category: 'pricing' },
    ]);

    const result = await listAdminSettings();

    expect(result.settings).toHaveProperty('site');
    expect(result.settings).toHaveProperty('pricing');
    expect((result.settings as Record<string, Record<string, unknown>>).pricing['pricing.margin']).toBe(35);
  });

  it('filtra per categoria', async () => {
    await listAdminSettings('pricing');

    expect(mockPrisma.setting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category: 'pricing' },
      })
    );
  });

  it('retorna totes si sense categoria', async () => {
    await listAdminSettings();

    expect(mockPrisma.setting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: undefined,
      })
    );
  });

  it('parseja BOOLEAN correctament', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'flag', value: 'true', type: 'BOOLEAN', category: 'test' },
    ]);

    const result = await listAdminSettings('test');
    expect(result.settings['flag']).toBe(true);
  });

  it('parseja JSON correctament', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'config', value: '{"a":1}', type: 'JSON', category: 'test' },
    ]);

    const result = await listAdminSettings('test');
    expect(result.settings['config']).toEqual({ a: 1 });
  });

  it('retorna string per JSON invàlid', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'bad', value: 'not-json', type: 'JSON', category: 'test' },
    ]);

    const result = await listAdminSettings('test');
    expect(result.settings['bad']).toBe('not-json');
  });
});

describe('updateAdminSettings', () => {
  it('actualitza múltiples settings', async () => {
    const count = await updateAdminSettings([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ]);

    expect(count).toBe(2);
    expect(mockPrisma.setting.update).toHaveBeenCalledTimes(2);
  });

  it('crea adminLog', async () => {
    await updateAdminSettings([{ key: 'test', value: 'val' }]);

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'UPDATE',
        entity: 'setting',
        details: { keys: ['test'] },
      }),
    });
  });

  it('serialitza objectes a JSON', async () => {
    await updateAdminSettings([{ key: 'obj', value: { nested: true } }]);

    expect(mockPrisma.setting.update).toHaveBeenCalledWith({
      where: { key: 'obj' },
      data: { value: '{"nested":true}' },
    });
  });
});

describe('createAdminSetting', () => {
  it('crea setting amb tipus STRING per defecte', async () => {
    await createAdminSetting({ key: 'new.key', value: 'val', category: 'test' });

    expect(mockPrisma.setting.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: 'new.key',
        value: 'val',
        type: 'STRING',
        category: 'test',
      }),
    });
  });
});
