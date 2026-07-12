import { describe, expect, it } from 'vitest';

import { isAdminTestArtifactFromParts, isAdminTestArtifactText, isAdminTestBookingArtifact } from '@/lib/admin/testArtifacts';

describe('admin test artifact detector', () => {
  it('detecta artefactes Manolo E2E coneguts', () => {
    expect(isAdminTestArtifactText('ZENIT E2E WhatsApp 20260710')).toBe(true);
    expect(isAdminTestArtifactText('client@example.test')).toBe(true);
    expect(isAdminTestArtifactText('ZENIT WhatsApp lead')).toBe(true);
    expect(isAdminTestArtifactText('ZENIT Mail pressupost')).toBe(true);
    expect(isAdminTestArtifactText('ZENIT Config proposta')).toBe(true);
    expect(isAdminTestArtifactText('ZENIT Admin manual')).toBe(true);
  });

  it('no marca entrades comercials reals', () => {
    expect(isAdminTestArtifactText('Alba Garcia boda octubre')).toBe(false);
    expect(isAdminTestArtifactFromParts(['Bingo musical empresa', 'client@empresa.com'])).toBe(false);
  });

  it('combina parts de diferents pantalles', () => {
    expect(isAdminTestArtifactFromParts(['Pressupost real', 'ZENIT E2E Config 20260710'])).toBe(true);
  });

  it('detecta reserves de prova des de dades de booking i lead', () => {
    expect(isAdminTestBookingArtifact({
      reference: 'OE-2026-020',
      clientName: 'Client real',
      clientEmail: 'zenit.e2e.20260710.config@example.test',
      eventLocation: 'Cornella de Llobregat',
    })).toBe(true);
    expect(isAdminTestBookingArtifact({
      clientName: 'Client real',
      clientEmail: 'client@empresa.com',
      lead: { name: 'ZENIT WhatsApp entrada manual' },
    })).toBe(true);
    expect(isAdminTestBookingArtifact({
      clientName: 'Cristina Rey',
      clientEmail: 'cristina@example.com',
      eventLocation: 'Barcelona',
    })).toBe(false);
  });
});
