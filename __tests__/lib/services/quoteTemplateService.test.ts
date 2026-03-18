import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: { business: { email: 'info@orbitaevents.com' } },
}));

import {
  normalizeQuoteTemplate,
  DEFAULT_QUOTE_TEMPLATE,
  getQuoteTemplateSettings,
  upsertQuoteTemplateSettings,
} from '@/lib/services/quoteTemplateService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findUnique.mockResolvedValue(null);
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
});

// ─────────────────────────────────────────────────────────────────────────
// normalizeQuoteTemplate (pure)
// ─────────────────────────────────────────────────────────────────────────
describe('normalizeQuoteTemplate', () => {
  it('retorna defaults per null/undefined', () => {
    expect(normalizeQuoteTemplate(null)).toEqual(DEFAULT_QUOTE_TEMPLATE);
    expect(normalizeQuoteTemplate(undefined)).toEqual(DEFAULT_QUOTE_TEMPLATE);
  });

  it('retorna defaults per tipus no-objecte', () => {
    expect(normalizeQuoteTemplate('string')).toEqual(DEFAULT_QUOTE_TEMPLATE);
    expect(normalizeQuoteTemplate(42)).toEqual(DEFAULT_QUOTE_TEMPLATE);
  });

  it('clamp validityDays entre 1 i 120', () => {
    expect(normalizeQuoteTemplate({ validityDays: 0 }).validityDays).toBe(1);
    expect(normalizeQuoteTemplate({ validityDays: -5 }).validityDays).toBe(1);
    expect(normalizeQuoteTemplate({ validityDays: 200 }).validityDays).toBe(120);
    expect(normalizeQuoteTemplate({ validityDays: 30 }).validityDays).toBe(30);
  });

  it('retorna defaults per validityDays invàlid', () => {
    expect(normalizeQuoteTemplate({ validityDays: 'abc' }).validityDays).toBe(DEFAULT_QUOTE_TEMPLATE.validityDays);
    expect(normalizeQuoteTemplate({ validityDays: NaN }).validityDays).toBe(DEFAULT_QUOTE_TEMPLATE.validityDays);
  });

  it('sanititza textos buits a defaults', () => {
    const result = normalizeQuoteTemplate({ introTitle: '', ctaTitle: '' });
    expect(result.introTitle).toBe(DEFAULT_QUOTE_TEMPLATE.introTitle);
    expect(result.ctaTitle).toBe(DEFAULT_QUOTE_TEMPLATE.ctaTitle);
  });

  it('sanititza condicions', () => {
    const result = normalizeQuoteTemplate({ conditions: ['Cond 1', '', 'Cond 2'] });
    expect(result.conditions).toEqual(['Cond 1', 'Cond 2']);
  });

  it('retorna defaults per condicions buides', () => {
    const result = normalizeQuoteTemplate({ conditions: [] });
    expect(result.conditions).toEqual(DEFAULT_QUOTE_TEMPLATE.conditions);
  });

  it('limita condicions a 12', () => {
    const manyConditions = Array.from({ length: 20 }, (_, i) => `Cond ${i}`);
    const result = normalizeQuoteTemplate({ conditions: manyConditions });
    expect(result.conditions).toHaveLength(12);
  });

  it('respecta sendAdminCopy boolean', () => {
    expect(normalizeQuoteTemplate({ sendAdminCopy: false }).sendAdminCopy).toBe(false);
    expect(normalizeQuoteTemplate({ sendAdminCopy: true }).sendAdminCopy).toBe(true);
  });

  it('default sendAdminCopy a true si no és boolean', () => {
    expect(normalizeQuoteTemplate({ sendAdminCopy: 'yes' }).sendAdminCopy).toBe(DEFAULT_QUOTE_TEMPLATE.sendAdminCopy);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getQuoteTemplateSettings
// ─────────────────────────────────────────────────────────────────────────
describe('getQuoteTemplateSettings', () => {
  it('retorna defaults si no hi ha setting', async () => {
    const result = await getQuoteTemplateSettings();
    expect(result).toEqual(DEFAULT_QUOTE_TEMPLATE);
  });

  it('retorna settings normalitzats', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({ validityDays: 30, introTitle: 'Custom' }),
    });

    const result = await getQuoteTemplateSettings();
    expect(result.validityDays).toBe(30);
    expect(result.introTitle).toBe('Custom');
  });

  it('retorna defaults si JSON invàlid', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'not-json' });

    const result = await getQuoteTemplateSettings();
    expect(result).toEqual(DEFAULT_QUOTE_TEMPLATE);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// upsertQuoteTemplateSettings
// ─────────────────────────────────────────────────────────────────────────
describe('upsertQuoteTemplateSettings', () => {
  it('guarda i retorna settings normalitzats', async () => {
    const result = await upsertQuoteTemplateSettings({
      ...DEFAULT_QUOTE_TEMPLATE,
      validityDays: 45,
    });

    expect(result.validityDays).toBe(45);
    expect(mockPrisma.setting.upsert).toHaveBeenCalled();
  });

  it('crea adminLog', async () => {
    await upsertQuoteTemplateSettings(DEFAULT_QUOTE_TEMPLATE);

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'UPDATE',
          entity: 'setting',
        }),
      })
    );
  });
});
