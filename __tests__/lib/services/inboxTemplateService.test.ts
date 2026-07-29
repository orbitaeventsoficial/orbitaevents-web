import { describe, it, expect } from 'vitest';
import {
  generateSmartTemplates,
  generateAllTemplates,
  type TemplateContext,
} from '@/lib/services/inboxTemplateService';

const BASE_CTX: TemplateContext = {
  name: 'Maria Garcia',
  email: 'maria@test.com',
  eventType: 'WEDDING',
  eventDate: '2026-09-15',
  eventLocation: 'Masía El Sol',
  guestCount: 120,
  status: 'NEW',
  locale: 'ca',
};

describe('generateSmartTemplates', () => {
  it('genera plantilles per lead NEW', () => {
    const templates = generateSmartTemplates(BASE_CTX);
    const keys = templates.map((t) => t.key);
    expect(keys).toContain('primer-contacte');
    expect(keys).toContain('seguiment');
    expect(keys).toContain('reactivacio');
    expect(keys).not.toContain('seguiment-pressupost');
    expect(keys).not.toContain('confirmacio-data');
  });

  it('genera plantilles per lead CONTACTED', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, status: 'CONTACTED' });
    const keys = templates.map((t) => t.key);
    expect(keys).toContain('seguiment');
    expect(keys).toContain('seguiment-pressupost');
    expect(keys).not.toContain('primer-contacte');
  });

  it('genera plantilles per lead NEGOTIATING', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, status: 'NEGOTIATING' });
    const keys = templates.map((t) => t.key);
    expect(keys).toContain('seguiment');
    expect(keys).toContain('seguiment-pressupost');
    expect(keys).toContain('confirmacio-data');
    expect(keys).not.toContain('primer-contacte');
  });

  it('genera plantilles per lead WON', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, status: 'WON' });
    const keys = templates.map((t) => t.key);
    expect(keys).toContain('confirmacio-data');
    expect(keys).toContain('agraiment-post-event');
    expect(keys).toContain('reactivacio');
    expect(keys).not.toContain('primer-contacte');
    expect(keys).not.toContain('seguiment');
  });

  it('sempre inclou reactivacio', () => {
    const statuses = ['NEW', 'CONTACTED', 'NEGOTIATING', 'WON', 'LOST'];
    for (const status of statuses) {
      const templates = generateSmartTemplates({ ...BASE_CTX, status });
      expect(templates.map((t) => t.key)).toContain('reactivacio');
    }
  });

  it('usa primer nom al body', () => {
    const templates = generateSmartTemplates(BASE_CTX);
    const primer = templates.find((t) => t.key === 'primer-contacte')!;
    expect(primer.body).toContain('Hola Maria');
    expect(primer.body).not.toContain('Maria Garcia');
  });

  it('inclou event type al subject/body', () => {
    const templates = generateSmartTemplates(BASE_CTX);
    const primer = templates.find((t) => t.key === 'primer-contacte')!;
    expect(primer.subject.toLowerCase() + primer.body.toLowerCase()).toContain('casament');
  });

  it('inclou data formattejada al body', () => {
    const templates = generateSmartTemplates(BASE_CTX);
    const primer = templates.find((t) => t.key === 'primer-contacte')!;
    expect(primer.body).toContain('2026');
  });

  it('inclou convidats al body del primer contacte', () => {
    const templates = generateSmartTemplates(BASE_CTX);
    const primer = templates.find((t) => t.key === 'primer-contacte')!;
    expect(primer.body).toContain('120 convidats');
  });

  it('genera en castellà si locale es', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, locale: 'es' });
    const primer = templates.find((t) => t.key === 'primer-contacte')!;
    expect(primer.body).toContain('Gracias por contactar');
    expect(primer.subject).toContain('consulta');
  });

  it('gestiona nom buit', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, name: '' });
    const primer = templates.find((t) => t.key === 'primer-contacte')!;
    expect(primer.body).toContain('Hola ');
  });

  it('gestiona sense event type', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, eventType: null });
    const primer = templates.find((t) => t.key === 'primer-contacte')!;
    expect(primer.body).not.toContain('undefined');
    expect(primer.subject).not.toContain('undefined');
  });

  it('gestiona sense data', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, eventDate: null });
    const primer = templates.find((t) => t.key === 'primer-contacte')!;
    expect(primer.body).not.toContain('undefined');
  });

  it('gestiona sense convidats', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, guestCount: null });
    const primer = templates.find((t) => t.key === 'primer-contacte')!;
    expect(primer.body).not.toContain('null');
    expect(primer.body).not.toContain('convidats');
  });

  it('cada plantilla té mode email', () => {
    const templates = generateSmartTemplates(BASE_CTX);
    for (const t of templates) {
      expect(t.mode).toBe('email');
    }
  });

  it('cada plantilla té icon i description', () => {
    const templates = generateSmartTemplates(BASE_CTX);
    for (const t of templates) {
      expect(t.icon).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.label).toBeTruthy();
    }
  });

  it('confirmacio-data inclou localització', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, status: 'NEGOTIATING' });
    const confirmacio = templates.find((t) => t.key === 'confirmacio-data')!;
    expect(confirmacio.body).toContain('Masía El Sol');
  });

  it('confirmacio-data en castellà inclou localització', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, status: 'NEGOTIATING', locale: 'es' });
    const confirmacio = templates.find((t) => t.key === 'confirmacio-data')!;
    expect(confirmacio.body).toContain('Masía El Sol');
  });

  it('agraiment post-event usa primer nom al subject', () => {
    const templates = generateSmartTemplates({ ...BASE_CTX, status: 'WON' });
    const agr = templates.find((t) => t.key === 'agraiment-post-event')!;
    expect(agr.subject).toContain('Maria');
  });

  it('genera plantilla referral per client sense lead', () => {
    const templates = generateAllTemplates(BASE_CTX);
    const referral = templates.find((t) => t.key === 'referral')!;
    expect(referral.subject).toContain('Maria');
    expect(referral.body).toContain('Òrbita Events');
  });
});

describe('generateAllTemplates', () => {
  it('retorna les 7 plantilles', () => {
    const templates = generateAllTemplates(BASE_CTX);
    expect(templates).toHaveLength(7);
  });

  it('les 7 keys són úniques', () => {
    const templates = generateAllTemplates(BASE_CTX);
    const keys = templates.map((t) => t.key);
    expect(new Set(keys).size).toBe(7);
  });

  it('funciona sense context mínim', () => {
    const templates = generateAllTemplates({ name: 'Joan' });
    expect(templates.length).toBe(7);
    for (const t of templates) {
      expect(t.body).not.toContain('undefined');
      expect(t.body).not.toContain('null');
      expect(t.subject).not.toContain('undefined');
    }
  });
});
