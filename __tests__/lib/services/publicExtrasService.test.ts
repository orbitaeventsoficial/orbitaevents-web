import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    extra: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  resolvePublicExtraDefinition,
  listPublicExtras,
} from '@/lib/services/publicExtrasService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.extra.findMany.mockResolvedValue([]);
});

// ─────────────────────────────────────────────────────────────────────────
// resolvePublicExtraDefinition (pure function)
// ─────────────────────────────────────────────────────────────────────────
describe('resolvePublicExtraDefinition', () => {
  it('resol extra del registre amb traduccions ca', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'extra-hour', price: 75, priceType: 'FIXED' },
      'ca'
    );

    expect(result.id).toBe('extra-hour');
    expect(result.name).toBe('Hora extra DJ');
    expect(result.description).toContain('Allarga');
    expect(result.price).toBe(75);
    expect(result.icon).toBe('⏰');
    expect(result.category).toBe('time');
    expect(result.popular).toBe(true);
  });

  it('resol extra del registre amb traduccions es', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'low-fog', price: 50, priceType: 'FIXED' },
      'es'
    );

    expect(result.name).toBe('Fum baix');
    expect(result.description).toContain('ras de suelo');
  });

  it('resol extra del registre amb traduccions en', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'co2-cannon', price: 80, priceType: 'FIXED' },
      'en'
    );

    expect(result.name).toBe('CO2 Cannon');
    expect(result.description).toContain('cold smoke');
  });

  it('usa translationName si no és clau de traducció', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'extra-hour', price: 75, priceType: 'FIXED', translationName: 'Hora especial' },
      'ca'
    );

    expect(result.name).toBe('Hora especial');
  });

  it('ignora translationName si és clau de traducció (i18n key)', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'extra-hour', price: 75, priceType: 'FIXED', translationName: 'extras.extra-hour.name' },
      'ca'
    );

    expect(result.name).toBe('Hora extra DJ');
  });

  it('usa translationDescription si no és clau de traducció', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'low-fog', price: 50, priceType: 'FIXED', translationDescription: 'Custom desc' },
      'ca'
    );

    expect(result.description).toBe('Custom desc');
  });

  it('preu null si priceType ON_REQUEST', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'sparklers', price: 100, priceType: 'ON_REQUEST' },
      'ca'
    );

    expect(result.price).toBeNull();
    expect(result.consultarPrecio).toBe(true);
  });

  it('resol alias a extra canònic', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'humo-bajo', price: 50, priceType: 'FIXED' },
      'ca'
    );

    expect(result.id).toBe('humo-bajo');
    expect(result.name).toBe('Fum baix');
    expect(result.icon).toBe('☁️');
  });

  it('retorna icona per defecte per slug desconegut', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'unknown-extra', price: 30, priceType: 'FIXED' },
      'ca'
    );

    expect(result.icon).toBe('🎵');
    expect(result.name).toBe('unknown-extra');
  });

  it('marca premium correctament', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'sparklers', price: 100, priceType: 'FIXED' },
      'ca'
    );

    expect(result.premium).toBe(true);
  });

  it('compatibleWith inclou tots els serveis per defecte', () => {
    const result = resolvePublicExtraDefinition(
      { slug: 'karaoke', price: 60, priceType: 'FIXED' },
      'ca'
    );

    expect(result.compatibleWith).toEqual(['bodas', 'discomovil', 'fiestas', 'empresas']);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// listPublicExtras
// ─────────────────────────────────────────────────────────────────────────
describe('listPublicExtras', () => {
  it('retorna extras de BD si existeixen', async () => {
    mockPrisma.extra.findMany.mockResolvedValue([
      {
        slug: 'extra-hour',
        price: 80,
        priceType: 'FIXED',
        translations: [{ name: 'Hora extra personalitzada', description: 'Desc custom' }],
      },
      {
        slug: 'low-fog',
        price: 55,
        priceType: 'FIXED',
        translations: [],
      },
    ]);

    const result = await listPublicExtras('ca');

    expect(result.source).toBe('database');
    expect(result.extras).toHaveLength(2);
    expect(result.extras[0].name).toBe('Hora extra personalitzada');
    expect(result.extras[0].price).toBe(80);
    expect(result.extras[1].name).toBe('Fum baix'); // Fallback to registry
  });

  it('retorna extras de config si BD buida', async () => {
    mockPrisma.extra.findMany.mockResolvedValue([]);

    const result = await listPublicExtras('ca');

    expect(result.source).toBe('config');
    expect(result.extras.length).toBeGreaterThan(0);
  });

  it('normalitza locale desconegut a ca', async () => {
    mockPrisma.extra.findMany.mockResolvedValue([
      { slug: 'karaoke', price: 60, priceType: 'FIXED', translations: [] },
    ]);

    const result = await listPublicExtras('fr');

    expect(result.extras[0].name).toBe('Karaoke');
  });

  it('gestiona traduccions per locale es', async () => {
    mockPrisma.extra.findMany.mockResolvedValue([
      { slug: 'confetti', price: 40, priceType: 'FIXED', translations: [] },
    ]);

    const result = await listPublicExtras('es');

    expect(result.extras[0].name).toBe('Cañón de confeti');
    expect(result.extras[0].description).toContain('momentos clave');
  });

  it('gestiona preu ON_REQUEST des de BD', async () => {
    mockPrisma.extra.findMany.mockResolvedValue([
      { slug: 'sparklers', price: 150, priceType: 'ON_REQUEST', translations: [] },
    ]);

    const result = await listPublicExtras('ca');

    expect(result.extras[0].price).toBeNull();
    expect(result.extras[0].consultarPrecio).toBe(true);
  });
});
