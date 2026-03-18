import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSanitize, mockHasForbidden } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findUnique: vi.fn(), upsert: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockSanitize: vi.fn(),
  mockHasForbidden: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/admin-css', () => ({
  sanitizeAdminCss: mockSanitize,
  hasForbiddenAdminCss: mockHasForbidden,
}));

import {
  getAdminCustomCss,
  saveAdminCustomCss,
} from '@/lib/services/adminCustomCssService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findUnique.mockResolvedValue(null);
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockSanitize.mockImplementation((css: string) => css);
  mockHasForbidden.mockReturnValue(false);
});

describe('getAdminCustomCss', () => {
  it('retorna string buit si no hi ha setting', async () => {
    const result = await getAdminCustomCss();
    expect(result).toBe('');
  });

  it('retorna CSS guardat', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: '.card { color: red; }' });

    const result = await getAdminCustomCss();
    expect(result).toBe('.card { color: red; }');
  });
});

describe('saveAdminCustomCss', () => {
  it('guarda CSS sanititzat', async () => {
    mockSanitize.mockReturnValue('.clean {}');

    const result = await saveAdminCustomCss('.dirty {}');

    expect(result.css).toBe('.clean {}');
    expect(result.hadForbiddenRules).toBe(false);
    expect(mockPrisma.setting.upsert).toHaveBeenCalled();
  });

  it('detecta regles prohibides', async () => {
    mockSanitize.mockReturnValue('');
    mockHasForbidden.mockReturnValue(true);

    const result = await saveAdminCustomCss('script {}');

    expect(result.hadForbiddenRules).toBe(true);
  });

  it('crea adminLog amb mida', async () => {
    mockSanitize.mockReturnValue('.test { }');

    await saveAdminCustomCss('.test { }');

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'UPDATE',
        entity: 'setting',
        entityId: 'admin.css.custom',
        details: expect.objectContaining({ size: 9 }),
      }),
    });
  });

  it('gestiona input no-string', async () => {
    mockSanitize.mockReturnValue('');

    const result = await saveAdminCustomCss(42 as unknown as string);

    expect(result.css).toBe('');
  });
});
