import { describe, it, expect, vi } from 'vitest';

vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: { business: { phone: '+34600000000', email: 'info@test.com' } },
}));
vi.mock('@/lib/constants', () => ({
  toIntlLocale: (l: string) => l === 'es' ? 'es-ES' : l === 'en' ? 'en-GB' : 'ca-ES',
}));

import {
  normalizeLocale,
  resolvePackName,
  getPostEventSubject,
  generatePostEventEmail,
} from '@/lib/services/postEventEmailService';

describe('normalizeLocale', () => {
  it('retorna ca per defecte', () => {
    expect(normalizeLocale(null)).toBe('ca');
    expect(normalizeLocale(undefined)).toBe('ca');
    expect(normalizeLocale('')).toBe('ca');
  });

  it('normalitza es', () => {
    expect(normalizeLocale('es')).toBe('es');
    expect(normalizeLocale('es-ES')).toBe('es');
  });

  it('normalitza en', () => {
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('en-GB')).toBe('en');
  });
});

describe('resolvePackName', () => {
  it('retorna fallback sense translations', () => {
    expect(resolvePackName(undefined, 'ca')).toBe('El teu pack');
    expect(resolvePackName(undefined, 'es')).toBe('Tu pack');
    expect(resolvePackName(undefined, 'en')).toBe('Your pack');
  });

  it('resol per locale', () => {
    const translations = [
      { locale: 'ca', name: 'Premium CA' },
      { locale: 'es', name: 'Premium ES' },
    ];
    expect(resolvePackName(translations, 'ca')).toBe('Premium CA');
    expect(resolvePackName(translations, 'es')).toBe('Premium ES');
  });

  it('fallback a ca si locale no trobat', () => {
    const translations = [{ locale: 'ca', name: 'Bàsic' }];
    expect(resolvePackName(translations, 'en')).toBe('Bàsic');
  });
});

describe('getPostEventSubject', () => {
  it('usa primer nom', () => {
    const subject = getPostEventSubject('ca', 'Maria García');
    expect(subject).toContain('Maria');
    expect(subject).not.toContain('García');
  });

  it('retorna en el locale correcte', () => {
    expect(getPostEventSubject('es', 'Pau')).toContain('gracias');
    expect(getPostEventSubject('en', 'Pau')).toContain('thank you');
  });
});

describe('generatePostEventEmail', () => {
  it('genera HTML amb dades', () => {
    const html = generatePostEventEmail({
      name: 'Maria García',
      packName: 'Premium',
      eventDate: new Date('2026-06-15'),
      reviewUrl: 'https://test.com/review',
      googleReviewUrl: 'https://google.com/review',
      locale: 'ca',
    });

    expect(html).toContain('Maria');
    expect(html).toContain('Premium');
    expect(html).toContain('https://test.com/review');
    expect(html).toContain('https://google.com/review');
  });

  it('usa review en anglès en comptes de feedback legacy', () => {
    const html = generatePostEventEmail({
      name: 'Maria García',
      packName: 'Premium',
      eventDate: new Date('2026-06-15'),
      reviewUrl: 'https://test.com/review',
      googleReviewUrl: 'https://google.com/review',
      locale: 'en',
    });

    expect(html).toContain('Your review helps us improve');
    expect(html).not.toContain('Your feedback helps us improve');
  });
});
