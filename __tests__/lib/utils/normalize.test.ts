/**
 * Tests per les utilitats de normalització de dades.
 * Cobreix el nucli de normalització que alimenta deduplicació i camps normalitzats.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeEmail,
  isValidEmail,
  normalizePhone,
  normalizeName,
  capitalizeName,
  getFirstName,
  getInitials,
  normalizeInstagram,
  normalizeDni,
} from '@/lib/utils/normalize';

// ─── Email ──────────────────────────────────────────────────────────────────

describe('normalizeEmail', () => {
  it('converteix a lowercase i elimina espais', () => {
    expect(normalizeEmail('  Joan@Example.COM ')).toBe('joan@example.com');
  });

  it('elimina punts de Gmail', () => {
    expect(normalizeEmail('j.o.a.n@gmail.com')).toBe('joan@gmail.com');
  });

  it('elimina +alias de Gmail', () => {
    expect(normalizeEmail('joan+test@gmail.com')).toBe('joan@gmail.com');
  });

  it('elimina punts i alias de Gmail alhora', () => {
    expect(normalizeEmail('j.oan+spam@gmail.com')).toBe('joan@gmail.com');
  });

  it('tracta googlemail.com com a Gmail', () => {
    expect(normalizeEmail('test@googlemail.com')).toBe('test@gmail.com');
  });

  it('no modifica dominis no-Gmail', () => {
    expect(normalizeEmail('j.oan+tag@hotmail.com')).toBe('j.oan+tag@hotmail.com');
  });

  it('retorna string buit per input buit', () => {
    expect(normalizeEmail('')).toBe('');
  });
});

describe('isValidEmail', () => {
  it('accepta email vàlid', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rebutja email sense @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rebutja email sense domini', () => {
    expect(isValidEmail('user@')).toBe(false);
  });
});

// ─── Telèfon ────────────────────────────────────────────────────────────────

describe('normalizePhone', () => {
  it('afegeix +34 per defecte', () => {
    expect(normalizePhone('612345678')).toBe('+34612345678');
  });

  it('elimina espais, guions i parèntesis', () => {
    expect(normalizePhone('612 345 678')).toBe('+34612345678');
    expect(normalizePhone('612-345-678')).toBe('+34612345678');
    expect(normalizePhone('(612) 345 678')).toBe('+34612345678');
  });

  it('conserva prefix internacional existent', () => {
    expect(normalizePhone('+33612345678')).toBe('+33612345678');
  });

  it('converteix 00 a +', () => {
    expect(normalizePhone('0034612345678')).toBe('+34612345678');
  });

  it('elimina 0 nacional', () => {
    expect(normalizePhone('0612345678')).toBe('+34612345678');
  });

  it('retorna string buit per input buit', () => {
    expect(normalizePhone('')).toBe('');
  });
});

// ─── Nom ────────────────────────────────────────────────────────────────────

describe('normalizeName', () => {
  it('lowercase, elimina accents, espais múltiples', () => {
    expect(normalizeName('  Joan  García  López  ')).toBe('joan garcia lopez');
  });

  it('elimina caràcters especials', () => {
    expect(normalizeName("María José O'Brien")).toBe('maria jose obrien');
  });

  it('retorna string buit per input buit', () => {
    expect(normalizeName('')).toBe('');
  });
});

describe('capitalizeName', () => {
  it('capitalitza correctament', () => {
    expect(capitalizeName('joan garcia lópez')).toBe('Joan Garcia López');
  });

  it('manté partícules en minúscula', () => {
    expect(capitalizeName('maria de la fuente')).toBe('Maria de la Fuente');
  });

  it('retorna string buit per input buit', () => {
    expect(capitalizeName('')).toBe('');
  });
});

describe('getFirstName', () => {
  it('retorna el primer nom', () => {
    expect(getFirstName('Joan Garcia López')).toBe('Joan');
  });

  it('retorna string buit per input buit', () => {
    expect(getFirstName('')).toBe('');
  });
});

describe('getInitials', () => {
  it('retorna 2 inicials per defecte', () => {
    expect(getInitials('Joan Garcia López')).toBe('JG');
  });

  it('retorna 1 inicial si només hi ha un nom', () => {
    expect(getInitials('Joan')).toBe('J');
  });

  it('respecta maxChars', () => {
    expect(getInitials('Joan Garcia López', 3)).toBe('JGL');
  });

  it('retorna string buit per input buit', () => {
    expect(getInitials('')).toBe('');
  });
});

// ─── Instagram ──────────────────────────────────────────────────────────────

describe('normalizeInstagram', () => {
  it('elimina @ i converteix a lowercase', () => {
    expect(normalizeInstagram('@OrbitaEvents')).toBe('orbitaevents');
  });

  it('extreu handle de URL', () => {
    expect(normalizeInstagram('https://instagram.com/orbitaevents')).toBe('orbitaevents');
  });

  it('retorna string buit per input buit', () => {
    expect(normalizeInstagram('')).toBe('');
  });
});

// ─── DNI/NIF/NIE ────────────────────────────────────────────────────────────

describe('normalizeDni', () => {
  it('neteja format amb punts i guions', () => {
    expect(normalizeDni('12.345.678-A')).toBe('12345678A');
  });

  it('converteix a uppercase', () => {
    expect(normalizeDni('12345678a')).toBe('12345678A');
  });

  it('retorna string buit per input buit', () => {
    expect(normalizeDni('')).toBe('');
  });
});
