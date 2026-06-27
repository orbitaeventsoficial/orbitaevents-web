import { describe, it, expect } from 'vitest';
import { generatePostEventEmail } from '@/lib/services/postEventEmailService';

const base = {
  name: 'Cristina Rey',
  packName: 'Pack DJ',
  eventDate: new Date('2026-06-15'),
  reviewUrl: 'https://orbitaevents.com/ca/valoracio?token=x',
  googleReviewUrl: 'https://g.page/orbita',
  locale: 'ca' as const,
};

describe('postEventEmail — botó d\'enquesta automàtic', () => {
  it('inclou el botó d\'enquesta quan es passa questionnaireUrl', () => {
    const html = generatePostEventEmail({ ...base, questionnaireUrl: 'https://orbitaevents.com/ca/portal/abc123' });
    expect(html).toContain('https://orbitaevents.com/ca/portal/abc123');
    expect(html).toContain('Respondre l');
  });

  it('NO inclou el botó d\'enquesta si no hi ha questionnaireUrl', () => {
    const html = generatePostEventEmail(base);
    expect(html).not.toContain('/portal/');
    expect(html).not.toContain('Respondre l');
  });

  it('conté sempre el botó de valoració (no es trenca per l\'enquesta)', () => {
    const html = generatePostEventEmail({ ...base, questionnaireUrl: 'https://x/portal/y' });
    expect(html).toContain(base.reviewUrl);
    expect(html).toContain('Deixar la meva valoració');
  });

  it('el copy de l\'enquesta s\'adapta a l\'idioma (es)', () => {
    const html = generatePostEventEmail({ ...base, locale: 'es', questionnaireUrl: 'https://x/portal/y' });
    expect(html).toContain('Responder la encuesta');
  });
});
