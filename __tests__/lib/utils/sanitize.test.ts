import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeEmail, truncate } from '@/lib/utils/sanitize';

describe('escapeHtml', () => {
  it('escapa tag script complet', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapa ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it("escapa cometa simple", () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('retorna string buit per null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('retorna string buit per undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('no modifica text pla sense caràcters HTML', () => {
    expect(escapeHtml('Hola mon')).toBe('Hola mon');
  });
});

describe('sanitizeEmail', () => {
  it('converteix a minúscules', () => {
    expect(sanitizeEmail('Joan@Example.COM')).toBe('joan@example.com');
  });

  it('elimina espais inicials i finals', () => {
    expect(sanitizeEmail('  joan@example.com  ')).toBe('joan@example.com');
  });

  it('aplica les dues operacions alhora', () => {
    expect(sanitizeEmail('  JOAN@EXAMPLE.COM  ')).toBe('joan@example.com');
  });
});

describe('truncate', () => {
  it('no trunca si el text és més curt que maxLength', () => {
    expect(truncate('abcde', 10)).toBe('abcde');
  });

  it('no trunca si el text és exactament maxLength', () => {
    expect(truncate('abcde', 5)).toBe('abcde');
  });

  it('trunca i afegeix suffix per defecte', () => {
    expect(truncate('abcdefghij', 7)).toBe('abcd...');
  });

  it('accepta suffix personalitzat', () => {
    expect(truncate('abcdefgh', 5, '!')).toBe('abcd!');
  });

  it('suffix buit trunca sense indicador', () => {
    expect(truncate('abcdefgh', 6, '')).toBe('abcdef');
  });
});
