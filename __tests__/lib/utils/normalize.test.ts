/**
 * Tests per les utilitats de normalització de dades.
 * Cobreix email, telèfon, nom, Instagram, DNI/NIF/NIE i comparació de clients.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeEmail,
  isValidEmail,
  normalizePhone,
  formatPhone,
  isValidPhone,
  normalizeName,
  capitalizeName,
  getFirstName,
  getInitials,
  normalizeInstagram,
  isValidInstagram,
  getInstagramUrl,
  normalizeDni,
  isValidDni,
  generateDiscountCode,
  generatePersonalizedCode,
  normalizeCustomerData,
  compareCustomers,
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

describe('formatPhone', () => {
  it('formata telèfon espanyol', () => {
    expect(formatPhone('612345678')).toBe('+34 612 345 678');
  });

  it('retorna string buit per input buit', () => {
    expect(formatPhone('')).toBe('');
  });
});

describe('isValidPhone', () => {
  it('accepta telèfon espanyol vàlid', () => {
    expect(isValidPhone('612345678')).toBe(true);
  });

  it('rebutja telèfon massa curt', () => {
    expect(isValidPhone('123')).toBe(false);
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

describe('isValidInstagram', () => {
  it('accepta handle vàlid', () => {
    expect(isValidInstagram('orbita.events_dj')).toBe(true);
  });

  it('normalitza i accepta handle amb espais (espais eliminats)', () => {
    // normalizeInstagram elimina espais, resultant en 'orbitaevents' que és vàlid
    expect(isValidInstagram('orbita events')).toBe(true);
  });

  it('rebutja handle buit', () => {
    expect(isValidInstagram('')).toBe(false);
  });
});

describe('getInstagramUrl', () => {
  it('genera URL correcta', () => {
    expect(getInstagramUrl('@orbitaevents')).toBe('https://instagram.com/orbitaevents');
  });

  it('retorna string buit per input buit', () => {
    expect(getInstagramUrl('')).toBe('');
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

describe('isValidDni', () => {
  it('valida NIF correcte (12345678Z)', () => {
    expect(isValidDni('12345678Z')).toBe(true);
  });

  it('rebutja NIF amb lletra incorrecta', () => {
    expect(isValidDni('12345678A')).toBe(false);
  });

  it('valida NIE correcte (X1234567L)', () => {
    expect(isValidDni('X1234567L')).toBe(true);
  });

  it('rebutja input buit', () => {
    expect(isValidDni('')).toBe(false);
  });
});

// ─── Codis descompte ────────────────────────────────────────────────────────

describe('generateDiscountCode', () => {
  it('genera codi amb prefix ORBITA per defecte', () => {
    const code = generateDiscountCode();
    expect(code).toMatch(/^ORBITA-[A-Z0-9]{4}$/);
  });

  it('accepta prefix personalitzat', () => {
    const code = generateDiscountCode('VIP');
    expect(code).toMatch(/^VIP-[A-Z0-9]{4}$/);
  });
});

describe('generatePersonalizedCode', () => {
  it('genera codi amb nom + percentatge', () => {
    expect(generatePersonalizedCode('Joan Garcia', 15)).toBe('JOAN15');
  });

  it('usa 10% per defecte', () => {
    expect(generatePersonalizedCode('Maria')).toBe('MARIA10');
  });
});

// ─── Comparació clients ─────────────────────────────────────────────────────

describe('compareCustomers', () => {
  const base = normalizeCustomerData({
    email: 'joan@gmail.com',
    phone: '612345678',
    name: 'Joan Garcia',
    instagram: '@orbitaevents',
  });

  it('retorna 100 per email idèntic', () => {
    const other = normalizeCustomerData({
      email: 'j.oan@gmail.com', // es normalitza igual
      name: 'Joan Diferent',
    });
    expect(compareCustomers(base, other)).toBe(100);
  });

  it('retorna 90 per telèfon idèntic', () => {
    const other = normalizeCustomerData({
      email: 'other@example.com',
      phone: '+34 612 345 678',
      name: 'Altre Nom',
    });
    expect(compareCustomers(base, other)).toBe(90);
  });

  it('retorna 85 per Instagram idèntic', () => {
    const other = normalizeCustomerData({
      email: 'other@example.com',
      name: 'Altre Nom',
      instagram: 'OrbitaEvents',
    });
    expect(compareCustomers(base, other)).toBe(85);
  });

  it('retorna 0 si no hi ha coincidència', () => {
    const other = normalizeCustomerData({
      email: 'totalment@diferent.com',
      name: 'Persona Nova',
    });
    expect(compareCustomers(base, other)).toBe(0);
  });
});
