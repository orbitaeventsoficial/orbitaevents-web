import { describe, it, expect } from 'vitest';
import {
  ORBITA_SERVICES,
  SOUND_TECH_PRICE,
  SOUND_TECH_DURATION,
  BINGO_ASSISTANT_GUEST_THRESHOLD,
  BINGO_ASSISTANT_LINE_LABEL,
  productIncludesSoundTech,
  partnerProductRequiresSoundTech,
  countProductCrewMembers,
  bingoAssistantRequiredForGuestCount,
  isAdultBingoMusicalName,
  isBingoAssistantLine,
  djPriceForHours,
  DJ_FIRST_HOUR_PRICE,
  DJ_EXTRA_HOUR_PRICE,
} from '@/lib/constants/orbita-services';

describe('productIncludesSoundTech', () => {
  it('detecta tècnic de so en composicions reals de Masquerade', () => {
    expect(productIncludesSoundTech('Animador + tècnic de so')).toBe(true);
    expect(productIncludesSoundTech('Animador + personatge + tècnic de so')).toBe(true);
    expect(productIncludesSoundTech('2 actors + decoració + tècnic de so')).toBe(true);
  });

  it('és tolerant a accents i majúscules', () => {
    expect(productIncludesSoundTech('Tecnic de so')).toBe(true);
    expect(productIncludesSoundTech('TÈCNIC DE SO inclòs')).toBe(true);
  });

  it('retorna false quan no hi ha tècnic o el crew és buit', () => {
    expect(productIncludesSoundTech('Animador sol')).toBe(false);
    expect(productIncludesSoundTech(null)).toBe(false);
    expect(productIncludesSoundTech(undefined)).toBe(false);
    expect(productIncludesSoundTech('')).toBe(false);
  });
});

describe('countProductCrewMembers', () => {
  it('compta 1 o 2 persones de ruta segons el crew i ignora material/decoració', () => {
    expect(countProductCrewMembers('Animador')).toBe(1);
    expect(countProductCrewMembers('Animador + personatge')).toBe(2);
    expect(countProductCrewMembers('2 actors + decoració + equip propi')).toBe(2);
  });
});

describe('partnerProductRequiresSoundTech', () => {
  it('Bingo Musical sempre genera tècnic assignable encara que crew vingui buit', () => {
    expect(partnerProductRequiresSoundTech({ name: 'Bingo Musical', crew: null })).toBe(true);
  });

  it('manté els productes sense tècnic fora de la línia assignable', () => {
    expect(partnerProductRequiresSoundTech({ name: 'Pintacares professional', crew: 'Animador sol' })).toBe(false);
  });
});

describe('Bingo Musical +70 pax', () => {
  it('activa assistent a partir de 70 convidats sense confondre Bingo KIDS', () => {
    expect(BINGO_ASSISTANT_GUEST_THRESHOLD).toBe(70);
    expect(bingoAssistantRequiredForGuestCount(70)).toBe(true);
    expect(bingoAssistantRequiredForGuestCount('69')).toBe(false);
    expect(isAdultBingoMusicalName('Bingo Musical (Masquerade)')).toBe(true);
    expect(isAdultBingoMusicalName('Bingo Musical KIDS')).toBe(false);
    expect(isBingoAssistantLine({ label: BINGO_ASSISTANT_LINE_LABEL })).toBe(true);
  });
});

describe('Tècnic de so — font única de preu', () => {
  it('SOUND_TECH_PRICE és 40 € / 1,5 h', () => {
    expect(SOUND_TECH_PRICE).toBe(40);
    expect(SOUND_TECH_DURATION).toBe('1,5 h');
  });

  it('el servei de tècnic del catàleg deriva de la constant (cap número repetit)', () => {
    const tech = ORBITA_SERVICES.find((s) => s.kind === 'SOUND_TECH');
    expect(tech).toBeDefined();
    expect(tech!.defaultPrice).toBe(SOUND_TECH_PRICE);
    expect(tech!.label).toContain(SOUND_TECH_DURATION);
  });
});

describe('djPriceForHours — veritat absoluta del preu DJ', () => {
  it('1a hora i hores extra deriven de les constants', () => {
    expect(djPriceForHours(1)).toBe(DJ_FIRST_HOUR_PRICE);
    expect(djPriceForHours(2)).toBe(DJ_FIRST_HOUR_PRICE + DJ_EXTRA_HOUR_PRICE);
    expect(djPriceForHours(5)).toBe(DJ_FIRST_HOUR_PRICE + 4 * DJ_EXTRA_HOUR_PRICE);
  });

  it('mai baixa d\'1 hora', () => {
    expect(djPriceForHours(0)).toBe(DJ_FIRST_HOUR_PRICE);
    expect(djPriceForHours(-3)).toBe(DJ_FIRST_HOUR_PRICE);
  });
});
