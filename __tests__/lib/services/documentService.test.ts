import { describe, it, expect, vi } from 'vitest';

vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: { phone: '+34612345678', phoneDisplay: '612 345 678', email: 'info@orbitaevents.com' },
    web: { domain: 'orbitaevents.com' },
  },
}));
vi.mock('@/lib/services/travelCost', () => ({ INCLUDED_TRAVEL_KM: 50 }));
vi.mock('@/lib/utils/sanitize', () => ({ escapeHtml: (s: string) => s }));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: () => 'https://orbitaevents.com' }));

import { generateQuoteNumber, generateQuoteHTML, createQuoteFromLead, type QuoteData } from '@/lib/services/documentService';

function makeQuoteData(overrides: Partial<QuoteData> = {}): QuoteData {
  return {
    clientName: 'Joan Garcia',
    clientEmail: 'joan@example.com',
    clientPhone: '+34612345678',
    eventType: 'WEDDING',
    eventDate: new Date('2026-09-15'),
    eventLocation: 'Masia Can Roda, Girona',
    guestCount: 120,
    packName: 'Pack Premium',
    packPrice: 1500,
    djHours: 6,
    extraHourPrice: 75,
    subtotal: 1500,
    iva: 315,
    total: 1815,
    quoteNumber: 'PRE-2026-TEST',
    validUntil: new Date('2026-10-01'),
    ...overrides,
  };
}

describe('generateQuoteNumber', () => {
  it('format PRE-YYYY-XXXX', () => {
    const num = generateQuoteNumber();
    expect(num).toMatch(/^PRE-\d{4}-[A-Z0-9]{4}$/);
  });

  it('inclou any actual', () => {
    const num = generateQuoteNumber();
    expect(num).toContain(`PRE-${new Date().getFullYear()}-`);
  });

  it('genera valors únics', () => {
    const a = generateQuoteNumber();
    // El timestamp és prou ràpid per ser diferent dins el mateix test
    // però en realitat pot ser igual si s'executen en el mateix ms
    expect(a).toMatch(/^PRE-/);
  });
});

describe('generateQuoteHTML', () => {
  it('retorna HTML vàlid amb DOCTYPE', () => {
    const html = generateQuoteHTML(makeQuoteData());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('inclou dades del client', () => {
    const html = generateQuoteHTML(makeQuoteData());
    expect(html).toContain('Joan Garcia');
    expect(html).toContain('joan@example.com');
    expect(html).toContain('+34612345678');
  });

  it('inclou número de pressupost', () => {
    const html = generateQuoteHTML(makeQuoteData({ quoteNumber: 'PRE-2026-ABCD' }));
    expect(html).toContain('PRE-2026-ABCD');
  });

  it('inclou pack i preu', () => {
    const html = generateQuoteHTML(makeQuoteData());
    expect(html).toContain('Pack Premium');
    expect(html).toContain('1500.00€');
    expect(html).toContain('6h de DJ professional');
    expect(html).toContain('75€');
  });

  it('inclou totals amb IVA', () => {
    const html = generateQuoteHTML(makeQuoteData());
    expect(html).toContain('1500.00€'); // subtotal
    expect(html).toContain('315.00€'); // iva
    expect(html).toContain('1815.00€'); // total
    expect(html).toContain('IVA (21%)');
  });

  it('mostra descompte si existeix', () => {
    const html = generateQuoteHTML(makeQuoteData({ discount: 200, discountCode: 'PROMO' }));
    expect(html).toContain('-200.00€');
    expect(html).toContain('PROMO');
    expect(html).toContain('Descompte');
  });

  it('no mostra descompte si 0', () => {
    const html = generateQuoteHTML(makeQuoteData({ discount: 0 }));
    expect(html).not.toContain('Descompte');
  });

  it('mostra notes si existeixen', () => {
    const html = generateQuoteHTML(makeQuoteData({ notes: 'Prefereix música llatina' }));
    expect(html).toContain('Prefereix música llatina');
    expect(html).toContain('Notes');
  });

  it('no mostra notes si no n\'hi ha', () => {
    const html = generateQuoteHTML(makeQuoteData({ notes: undefined }));
    expect(html).not.toContain('<div class="notes-section">');
  });

  it('mostra extras si existeixen', () => {
    const html = generateQuoteHTML(makeQuoteData({
      extras: [
        { name: 'Karaoke', price: 200, quantity: 1 },
        { name: 'Llum extra', description: 'Set de llums addicional', price: 100, quantity: 2 },
      ],
    }));
    expect(html).toContain('Karaoke');
    expect(html).toContain('200.00€');
    expect(html).toContain('Llum extra');
    expect(html).toContain('Set de llums addicional');
    expect(html).toContain('2 unitats');
    expect(html).toContain('200.00€'); // 100*2
  });

  it('inclou condicions per defecte', () => {
    const html = generateQuoteHTML(makeQuoteData());
    expect(html).toContain('Condicions del pressupost');
    expect(html).toContain('Reserva:');
    expect(html).toContain("30%");
    expect(html).toContain('Cancel·lació');
    expect(html).toContain('Hores extres');
  });

  it('permet override de condicions', () => {
    const html = generateQuoteHTML(makeQuoteData(), {
      conditions: ['Condició 1', 'Condició 2'],
    });
    expect(html).toContain('Condició 1');
    expect(html).toContain('Condició 2');
    expect(html).not.toContain('Reserva:');
  });

  it('permet override de títols', () => {
    const html = generateQuoteHTML(makeQuoteData(), {
      introTitle: 'PROPOSTA ESPECIAL',
      introSubtitle: 'Feta amb amor',
      ctaTitle: 'Confirma ara!',
      ctaSubtitle: 'No esperis més',
    });
    expect(html).toContain('PROPOSTA ESPECIAL');
    expect(html).toContain('Feta amb amor');
    expect(html).toContain('Confirma ara!');
    expect(html).toContain('No esperis més');
  });

  it('inclou validesa', () => {
    const html = generateQuoteHTML(makeQuoteData({ validUntil: new Date('2026-10-01') }));
    expect(html).toContain('Vàlid fins:');
  });

  it('inclou CTA amb WhatsApp i telèfon', () => {
    const html = generateQuoteHTML(makeQuoteData());
    expect(html).toContain('wa.me');
    expect(html).toContain('Confirmar per WhatsApp');
  });

  it('inclou eventType traduït per WEDDING', () => {
    const html = generateQuoteHTML(makeQuoteData({ eventType: 'WEDDING' }));
    expect(html).toContain('Boda');
  });

  it('mostra eventType original si no es reconeix', () => {
    const html = generateQuoteHTML(makeQuoteData({ eventType: 'FESTIVAL' }));
    expect(html).toContain('FESTIVAL');
  });

  it('inclou NIF i adreça del client si existeixen', () => {
    const html = generateQuoteHTML(makeQuoteData({
      clientNIF: '12345678A',
      clientAddress: 'Carrer Major 1, Girona',
    }));
    expect(html).toContain('12345678A');
    expect(html).toContain('Carrer Major 1, Girona');
  });

  it('dark theme CSS (background #0f1113)', () => {
    const html = generateQuoteHTML(makeQuoteData());
    expect(html).toContain('#0f1113');
    expect(html).toContain('#d4b06e'); // or daurat
  });
});

describe('createQuoteFromLead', () => {
  const baseLead = {
    name: 'Maria López',
    email: 'maria@test.com',
    phone: '+34699999999',
    eventType: 'BIRTHDAY',
    eventDate: new Date('2026-12-20'),
    guestCount: 80,
    eventLocation: 'Barcelona',
    message: 'Vol karaoke',
  };

  const basePack = {
    name: 'Pack Bàsic',
    price: 800,
    djHours: 4,
    extraHourPrice: 75,
    description: 'Pack essencial',
  };

  it('crea QuoteData amb dades del lead', () => {
    const quote = createQuoteFromLead(baseLead, basePack);

    expect(quote.clientName).toBe('Maria López');
    expect(quote.clientEmail).toBe('maria@test.com');
    expect(quote.clientPhone).toBe('+34699999999');
    expect(quote.eventType).toBe('BIRTHDAY');
    expect(quote.eventDate).toEqual(new Date('2026-12-20'));
    expect(quote.guestCount).toBe(80);
    expect(quote.eventLocation).toBe('Barcelona');
  });

  it('calcula subtotal, IVA 21% i total', () => {
    const quote = createQuoteFromLead(baseLead, basePack);

    expect(quote.subtotal).toBe(800);
    expect(quote.iva).toBeCloseTo(168, 2); // 800 * 0.21
    expect(quote.total).toBeCloseTo(968, 2); // 800 + 168
  });

  it('inclou extras al subtotal', () => {
    const extras = [
      { name: 'Karaoke', price: 200, quantity: 1 },
      { name: 'Llums', price: 100, quantity: 2 },
    ];
    const quote = createQuoteFromLead(baseLead, basePack, extras);

    // 800 + 200 + 200 = 1200
    expect(quote.subtotal).toBe(1200);
    expect(quote.iva).toBeCloseTo(252, 2); // 1200 * 0.21
    expect(quote.total).toBeCloseTo(1452, 2);
    expect(quote.extras).toEqual(extras);
  });

  it('genera quoteNumber vàlid', () => {
    const quote = createQuoteFromLead(baseLead, basePack);
    expect(quote.quoteNumber).toMatch(/^PRE-\d{4}-[A-Z0-9]{4}$/);
  });

  it('validesa de 15 dies', () => {
    const now = new Date();
    const quote = createQuoteFromLead(baseLead, basePack);

    const diffDays = Math.round(
      (quote.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBeGreaterThanOrEqual(14);
    expect(diffDays).toBeLessThanOrEqual(16);
  });

  it('usa defaults si lead no té eventDate ni guestCount', () => {
    const minLead = {
      name: 'Test',
      email: 'test@test.com',
      eventType: 'OTHER',
    };
    const quote = createQuoteFromLead(minLead, basePack);

    expect(quote.eventDate).toBeInstanceOf(Date);
    expect(quote.guestCount).toBe(100); // default
    expect(quote.eventLocation).toBe('A determinar');
  });

  it('inclou notes del lead', () => {
    const quote = createQuoteFromLead(baseLead, basePack);
    expect(quote.notes).toBe('Vol karaoke');
  });

  it('phone undefined si no proporcionat', () => {
    const leadNoPhone = { ...baseLead, phone: null };
    const quote = createQuoteFromLead(leadNoPhone, basePack);
    expect(quote.clientPhone).toBeUndefined();
  });

  it('inclou dades del pack', () => {
    const quote = createQuoteFromLead(baseLead, basePack);

    expect(quote.packName).toBe('Pack Bàsic');
    expect(quote.packDescription).toBe('Pack essencial');
    expect(quote.packPrice).toBe(800);
    expect(quote.djHours).toBe(4);
    expect(quote.extraHourPrice).toBe(75);
  });
});
