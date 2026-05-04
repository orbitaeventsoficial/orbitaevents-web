import { describe, it, expect } from 'vitest';
import type { PackDefinition } from '@/app/config/packs-config';
import {
  parseBudgetRange,
  suggestPackForLead,
  EVENT_TYPE_TO_SERVICE,
} from '@/lib/services/packSuggestionService';

const FIXTURE_PACKS: PackDefinition[] = [
  {
    id: 'bodas-basico',
    service: 'bodas',
    slug: 'bodas-basico',
    name: 'Bodas Bàsic',
    tagline: '',
    price: '350€',
    priceValue: 350,
    features: [],
    duration: '2h',
    durationHours: 2,
    capacidadMinima: 20,
    capacidadMaxima: 80,
  },
  {
    id: 'bodas-premium',
    service: 'bodas',
    slug: 'bodas-premium',
    name: 'Bodas Premium',
    tagline: '',
    price: '500€',
    priceValue: 500,
    features: [],
    duration: '3h',
    durationHours: 3,
    capacidadMinima: 60,
    capacidadMaxima: 150,
    popular: true,
  },
  {
    id: 'bodas-luxury',
    service: 'bodas',
    slug: 'bodas-luxury',
    name: 'Bodas Luxury',
    tagline: '',
    price: '1000€',
    priceValue: 1000,
    features: [],
    duration: '6h',
    durationHours: 6,
    capacidadMinima: 100,
    capacidadMaxima: 300,
  },
  {
    id: 'disco-completo',
    service: 'discomovil',
    slug: 'disco-completo',
    name: 'Disco Completo',
    tagline: '',
    price: '400€',
    priceValue: 400,
    features: [],
    duration: '3h',
    durationHours: 3,
    popular: true,
    capacidadMinima: 40,
    capacidadMaxima: 120,
  },
  {
    id: 'empresas-evento',
    service: 'empresas',
    slug: 'empresas-evento',
    name: 'Empresas Evento',
    tagline: '',
    price: '400€',
    priceValue: 400,
    features: [],
    duration: '3h',
    durationHours: 3,
    popular: true,
  },
];

describe('parseBudgetRange', () => {
  it('returns null per a valors null o buits', () => {
    expect(parseBudgetRange(null)).toBeNull();
    expect(parseBudgetRange(undefined)).toBeNull();
    expect(parseBudgetRange('')).toBeNull();
    expect(parseBudgetRange('   ')).toBeNull();
  });

  it('parseja un sol valor en euros', () => {
    expect(parseBudgetRange('500€')).toEqual({ min: 500, max: 500 });
    expect(parseBudgetRange('500')).toEqual({ min: 500, max: 500 });
  });

  it('parseja un rang amb guió', () => {
    expect(parseBudgetRange('300-500€')).toEqual({ min: 300, max: 500 });
    expect(parseBudgetRange('300€-500€')).toEqual({ min: 300, max: 500 });
    expect(parseBudgetRange('300 - 500')).toEqual({ min: 300, max: 500 });
  });

  it('reconeix mínim obert (+ / > / més de)', () => {
    expect(parseBudgetRange('+500€')).toEqual({ min: 500, max: Number.POSITIVE_INFINITY });
    expect(parseBudgetRange('>500')).toEqual({ min: 500, max: Number.POSITIVE_INFINITY });
    expect(parseBudgetRange('més de 500€')).toEqual({ min: 500, max: Number.POSITIVE_INFINITY });
  });

  it('reconeix màxim obert (< / menys de / fins a)', () => {
    expect(parseBudgetRange('<500')).toEqual({ min: 0, max: 500 });
    expect(parseBudgetRange('menys de 500€')).toEqual({ min: 0, max: 500 });
    expect(parseBudgetRange('fins a 500€')).toEqual({ min: 0, max: 500 });
  });

  it('retorna null amb format desconegut', () => {
    expect(parseBudgetRange('barat')).toBeNull();
    expect(parseBudgetRange('abc 500')).toBeNull();
  });
});

describe('EVENT_TYPE_TO_SERVICE', () => {
  it('mappeja els 9 EventType canònics', () => {
    expect(EVENT_TYPE_TO_SERVICE.WEDDING).toBe('bodas');
    expect(EVENT_TYPE_TO_SERVICE.CORPORATE).toBe('empresas');
    expect(EVENT_TYPE_TO_SERVICE.BIRTHDAY).toBe('discomovil');
    expect(EVENT_TYPE_TO_SERVICE.COMMUNION).toBe('discomovil');
    expect(EVENT_TYPE_TO_SERVICE.BAPTISM).toBe('discomovil');
    expect(EVENT_TYPE_TO_SERVICE.GRADUATION).toBe('discomovil');
    expect(EVENT_TYPE_TO_SERVICE.ANNIVERSARY).toBe('discomovil');
    expect(EVENT_TYPE_TO_SERVICE.PRIVATE_PARTY).toBe('discomovil');
    expect(EVENT_TYPE_TO_SERVICE.OTHER).toBe('discomovil');
  });
});

describe('suggestPackForLead', () => {
  it('retorna unmatched si eventType és null', () => {
    const result = suggestPackForLead(
      { eventType: null, guestCount: 50, budget: '500€' },
      FIXTURE_PACKS,
    );
    expect(result.unmatched).toBe(true);
    expect(result.best).toBeNull();
    expect(result.serviceSlug).toBeNull();
  });

  it('retorna unmatched si eventType no és canònic', () => {
    const result = suggestPackForLead(
      { eventType: 'BOGUS', guestCount: 50, budget: '500€' },
      FIXTURE_PACKS,
    );
    expect(result.unmatched).toBe(true);
    expect(result.serviceSlug).toBeNull();
  });

  it('escull bodas-premium per WEDDING amb 100 convidats i 500€', () => {
    const result = suggestPackForLead(
      { eventType: 'WEDDING', guestCount: 100, budget: '500€' },
      FIXTURE_PACKS,
    );
    expect(result.best?.pack.id).toBe('bodas-premium');
    expect(result.best?.confidence).toBe('high');
    expect(result.best?.reasons).toContain('Pack popular del catàleg');
    expect(result.serviceSlug).toBe('bodas');
  });

  it('escull bodas-basico per WEDDING amb 30 convidats i 350€', () => {
    const result = suggestPackForLead(
      { eventType: 'WEDDING', guestCount: 30, budget: '350€' },
      FIXTURE_PACKS,
    );
    expect(result.best?.pack.id).toBe('bodas-basico');
    expect(result.best?.confidence).toBe('high');
  });

  it('escull disco-completo per BIRTHDAY amb 80 convidats', () => {
    const result = suggestPackForLead(
      { eventType: 'BIRTHDAY', guestCount: 80, budget: '400€' },
      FIXTURE_PACKS,
    );
    expect(result.best?.pack.id).toBe('disco-completo');
    expect(result.serviceSlug).toBe('discomovil');
  });

  it('escull empresas-evento per CORPORATE sense dades extra', () => {
    const result = suggestPackForLead(
      { eventType: 'CORPORATE', guestCount: null, budget: null },
      FIXTURE_PACKS,
    );
    expect(result.best?.pack.id).toBe('empresas-evento');
    expect(result.serviceSlug).toBe('empresas');
  });

  it('alerta quan els convidats superen la capacitat màxima', () => {
    const result = suggestPackForLead(
      { eventType: 'WEDDING', guestCount: 200, budget: '500€' },
      FIXTURE_PACKS,
    );
    const best = result.best;
    expect(best?.pack.id).toBe('bodas-luxury');
    const overflow = result.alternatives.find((a) => a.pack.id === 'bodas-premium');
    expect(overflow?.warnings.some((w) => w.includes('màxima'))).toBe(true);
  });

  it('alerta quan el preu del pack està fora del pressupost', () => {
    const result = suggestPackForLead(
      { eventType: 'WEDDING', guestCount: 50, budget: '350€' },
      FIXTURE_PACKS,
    );
    const luxury = result.alternatives.find((a) => a.pack.id === 'bodas-luxury');
    expect(luxury?.warnings.some((w) => w.includes('per sobre'))).toBe(true);
  });

  it('retorna fins a 2 alternatives ordenades per score', () => {
    const result = suggestPackForLead(
      { eventType: 'WEDDING', guestCount: 100, budget: '500€' },
      FIXTURE_PACKS,
    );
    expect(result.alternatives).toHaveLength(2);
    const scores = [result.best?.score ?? 0, ...result.alternatives.map((a) => a.score)];
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it('marca unmatched quan el millor score és < 30', () => {
    const skinnyPacks: PackDefinition[] = [
      {
        ...FIXTURE_PACKS[0],
        priceValue: 5000,
        capacidadMinima: 500,
        capacidadMaxima: 1000,
      },
    ];
    const result = suggestPackForLead(
      { eventType: 'WEDDING', guestCount: 10, budget: '100€' },
      skinnyPacks,
    );
    expect(result.unmatched).toBe(true);
  });

  it('parsa rangs de pressupost com a limit per a la coincidència', () => {
    const result = suggestPackForLead(
      { eventType: 'WEDDING', guestCount: null, budget: '+800€' },
      FIXTURE_PACKS,
    );
    expect(result.best?.pack.id).toBe('bodas-luxury');
  });

  it('ignora budget mal format i continua amb capacitat', () => {
    const result = suggestPackForLead(
      { eventType: 'WEDDING', guestCount: 50, budget: 'molt' },
      FIXTURE_PACKS,
    );
    expect(result.best).not.toBeNull();
    expect(result.best?.pack.service).toBe('bodas');
  });

  it('retorna unmatched si no hi ha packs del servei mappejat', () => {
    const onlyBodas = FIXTURE_PACKS.filter((p) => p.service === 'bodas');
    const result = suggestPackForLead(
      { eventType: 'BIRTHDAY', guestCount: 50, budget: '400€' },
      onlyBodas,
    );
    expect(result.unmatched).toBe(true);
    expect(result.serviceSlug).toBe('discomovil');
  });
});
