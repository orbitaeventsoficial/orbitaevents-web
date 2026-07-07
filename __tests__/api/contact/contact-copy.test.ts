/**
 * Tests per les funcions pures de l'API de contacte.
 * parseGuestCount, mapEventType, determineSource, contactSchema.
 */

import { describe, it, expect } from 'vitest';
import {
  parseGuestCount,
  mapEventType,
  determineSource,
  contactSchema,
  CONTACT_COPY,
  EVENT_TYPE_LABELS,
} from '@/app/api/contact/contact-copy';

// ─── parseGuestCount ────────────────────────────────────────────────────────

describe('parseGuestCount', () => {
  it('retorna number directament si és finite', () => {
    expect(parseGuestCount(100)).toBe(100);
  });

  it('retorna undefined per NaN', () => {
    expect(parseGuestCount(NaN)).toBeUndefined();
  });

  it('parseja string numèrica', () => {
    expect(parseGuestCount('150')).toBe(150);
  });

  it('parseja rang i calcula mitjana', () => {
    expect(parseGuestCount('100-200')).toBe(150);
    expect(parseGuestCount('50 - 100')).toBe(75);
  });

  it('parseja format "N+"', () => {
    expect(parseGuestCount('200+')).toBe(200);
  });

  it('retorna undefined per string buida', () => {
    expect(parseGuestCount('')).toBeUndefined();
  });

  it('retorna undefined per string no parsejable', () => {
    expect(parseGuestCount('molts')).toBeUndefined();
  });

  it('retorna undefined per undefined', () => {
    expect(parseGuestCount(undefined)).toBeUndefined();
  });
});

// ─── mapEventType ───────────────────────────────────────────────────────────

describe('mapEventType', () => {
  it('mapeja boda/wedding a WEDDING', () => {
    expect(mapEventType('boda')).toBe('WEDDING');
    expect(mapEventType('Wedding')).toBe('WEDDING');
    expect(mapEventType('Mi boda soñada')).toBe('WEDDING');
  });

  it('mapeja empresa/corporate a CORPORATE', () => {
    expect(mapEventType('empresa')).toBe('CORPORATE');
    expect(mapEventType('corporate event')).toBe('CORPORATE');
    expect(mapEventType('evento corporativo')).toBe('CORPORATE');
  });

  it('mapeja cumpleanos/birthday a BIRTHDAY', () => {
    expect(mapEventType('cumpleanos')).toBe('BIRTHDAY');
    expect(mapEventType('birthday party')).toBe('BIRTHDAY');
  });

  it('mapeja communion a COMMUNION', () => {
    expect(mapEventType('communion')).toBe('COMMUNION');
    expect(mapEventType('comunion')).toBe('COMMUNION');
  });

  it('mapeja baptism/bautizo a BAPTISM', () => {
    expect(mapEventType('baptism')).toBe('BAPTISM');
    expect(mapEventType('bautizo')).toBe('BAPTISM');
  });

  it('mapeja graduation a GRADUATION', () => {
    expect(mapEventType('graduacion')).toBe('GRADUATION');
    expect(mapEventType('graduation party')).toBe('GRADUATION');
  });

  it('mapeja anniversary/aniversari a ANNIVERSARY', () => {
    expect(mapEventType('anniversary')).toBe('ANNIVERSARY');
    expect(mapEventType('aniversari')).toBe('ANNIVERSARY');
  });

  it('mapeja fiesta/discomovil/party a PRIVATE_PARTY', () => {
    expect(mapEventType('fiesta')).toBe('PRIVATE_PARTY');
    expect(mapEventType('discomovil')).toBe('PRIVATE_PARTY');
    expect(mapEventType('party')).toBe('PRIVATE_PARTY');
  });

  it('retorna OTHER per tipus desconegut', () => {
    expect(mapEventType('algo random')).toBe('OTHER');
    expect(mapEventType('')).toBe('OTHER');
  });
});

// ─── determineSource ────────────────────────────────────────────────────────

describe('determineSource', () => {
  it('retorna CONFIGURATOR si hi ha packId', () => {
    expect(determineSource('pack-123')).toBe('CONFIGURATOR');
  });

  it('retorna CONFIGURATOR si hi ha packName', () => {
    expect(determineSource(undefined, 'Premium')).toBe('CONFIGURATOR');
  });

  it('retorna WEBSITE si no hi ha pack', () => {
    expect(determineSource()).toBe('WEBSITE');
    expect(determineSource(undefined, undefined)).toBe('WEBSITE');
  });
});

// ─── contactSchema ──────────────────────────────────────────────────────────

describe('contactSchema', () => {
  const t = CONTACT_COPY.ca;
  const schema = contactSchema(t);

  it('accepta dades vàlides amb email', () => {
    const result = schema.safeParse({
      name: 'Joan Garcia',
      email: 'joan@example.com',
      event: 'boda',
    });
    expect(result.success).toBe(true);
  });

  it('accepta dades vàlides amb contact', () => {
    const result = schema.safeParse({
      name: 'Joan Garcia',
      contact: 'joan@example.com',
      event: 'boda',
    });
    expect(result.success).toBe(true);
  });

  it('accepta ubicació pública com a location o eventLocation', () => {
    expect(schema.safeParse({
      name: 'Joan Garcia',
      contact: 'joan@example.com',
      event: 'boda',
      location: 'Barcelona',
    }).success).toBe(true);

    expect(schema.safeParse({
      name: 'Joan Garcia',
      contact: 'joan@example.com',
      event: 'boda',
      eventLocation: 'Girona',
    }).success).toBe(true);
  });

  it('rebutja nom massa curt', () => {
    const result = schema.safeParse({
      name: 'J',
      email: 'joan@example.com',
      event: 'boda',
    });
    expect(result.success).toBe(false);
  });

  it('rebutja sense cap forma de contacte', () => {
    const result = schema.safeParse({
      name: 'Joan Garcia',
      event: 'boda',
    });
    expect(result.success).toBe(false);
  });

  it("rebutja sense tipus d'event", () => {
    const result = schema.safeParse({
      name: 'Joan Garcia',
      email: 'joan@example.com',
      event: '',
    });
    expect(result.success).toBe(false);
  });
});

// ─── CONTACT_COPY ───────────────────────────────────────────────────────────

describe('CONTACT_COPY', () => {
  it('conté els 3 idiomes', () => {
    expect(Object.keys(CONTACT_COPY)).toEqual(['ca', 'es', 'en']);
  });

  it('cada idioma té les mateixes claus', () => {
    const caKeys = Object.keys(CONTACT_COPY.ca).sort();
    const esKeys = Object.keys(CONTACT_COPY.es).sort();
    const enKeys = Object.keys(CONTACT_COPY.en).sort();
    expect(caKeys).toEqual(esKeys);
    expect(caKeys).toEqual(enKeys);
  });
});

// ─── EVENT_TYPE_LABELS ──────────────────────────────────────────────────────

describe('EVENT_TYPE_LABELS', () => {
  it('conté els 3 idiomes', () => {
    expect(Object.keys(EVENT_TYPE_LABELS)).toEqual(['ca', 'es', 'en']);
  });

  it('cada idioma té les mateixes claus', () => {
    const caKeys = Object.keys(EVENT_TYPE_LABELS.ca).sort();
    const esKeys = Object.keys(EVENT_TYPE_LABELS.es).sort();
    const enKeys = Object.keys(EVENT_TYPE_LABELS.en).sort();
    expect(caKeys).toEqual(esKeys);
    expect(caKeys).toEqual(enKeys);
  });
});
