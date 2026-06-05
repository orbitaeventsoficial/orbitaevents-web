import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logo-lockup-light-base64', () => ({
  ORBITA_LOGO_LOCKUP_LIGHT_BASE64: 'data:image/png;base64,fake',
}));

import { generateQuotePDF, type QuoteData } from '@/lib/services/quotePdfService';
import { getPacksByService } from '@/app/config/packs-config';

function makeQuoteData(overrides: Partial<QuoteData> = {}): QuoteData {
  const pack = getPacksByService('bodas')[0];
  return {
    reference: 'PRE-2026-001',
    eventType: 'bodas',
    pack,
    date: '2026-09-15',
    eventSchedule: '18:00 - 02:00',
    eventLocation: 'Masia Can Roca, Granollers',
    guests: 120,
    extras: [],
    basePrice: 1200,
    extrasPrice: 0,
    discount: 0,
    discountReason: '',
    total: 1200,
    clientName: 'Maria Garcia',
    clientEmail: 'maria@example.com',
    clientPhone: '600123456',
    validityDays: 15,
    ...overrides,
  };
}

describe('generateQuotePDF', () => {
  it('retorna un doc jsPDF vàlid per a un pressupost bàsic', async () => {
    const doc = await generateQuotePDF(makeQuoteData());
    expect(doc).toBeDefined();
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
    const header = new Uint8Array(output.slice(0, 5));
    expect(String.fromCharCode(...header)).toBe('%PDF-');
  });

  it('funciona en espanyol', async () => {
    const doc = await generateQuotePDF(makeQuoteData(), 'es');
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('funciona en anglès', async () => {
    const doc = await generateQuotePDF(makeQuoteData(), 'en');
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('inclou descompte i recàrrec de temporada', async () => {
    const doc = await generateQuotePDF(makeQuoteData({
      discount: 100,
      discountReason: 'Promo especial',
      seasonSurcharge: 200,
      seasonLabel: 'Recàrrec alta temporada',
      seasonPct: 10,
      total: 1300,
    }));
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('inclou càrrec de transport amb detall km', async () => {
    const doc = await generateQuotePDF(makeQuoteData({
      travelCharge: 80,
      travelKm: 150,
      billableTravelKm: 100,
      travelBlocks: 2,
      total: 1280,
    }));
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });

  it('funciona sense dades de client opcionals', async () => {
    const doc = await generateQuotePDF(makeQuoteData({
      clientName: undefined,
      clientEmail: undefined,
      clientPhone: undefined,
    }));
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(500);
  });
});
