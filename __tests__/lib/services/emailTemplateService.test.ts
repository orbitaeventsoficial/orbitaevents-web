import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    emailTemplate: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  getTemplate,
  getAdminTemplateDetail,
  listTemplates,
  isTemplateSlug,
  getTemplateVariables,
  upsertTemplate,
} from '@/lib/services/emailTemplateService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);
  mockPrisma.emailTemplate.findMany.mockResolvedValue([]);
  mockPrisma.emailTemplate.upsert.mockResolvedValue({ id: 'tpl-1' });
});

// ─────────────────────────────────────────────────────────────────────────
// isTemplateSlug
// ─────────────────────────────────────────────────────────────────────────
describe('isTemplateSlug', () => {
  it('retorna true per slugs vàlids', () => {
    expect(isTemplateSlug('booking_confirmation')).toBe(true);
    expect(isTemplateSlug('post_event')).toBe(true);
    expect(isTemplateSlug('welcome')).toBe(true);
    expect(isTemplateSlug('payment_reminder')).toBe(true);
  });

  it('retorna false per slugs invàlids', () => {
    expect(isTemplateSlug('invalid')).toBe(false);
    expect(isTemplateSlug('')).toBe(false);
    expect(isTemplateSlug('BOOKING_CONFIRMATION')).toBe(false); // case-sensitive
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getTemplateVariables
// ─────────────────────────────────────────────────────────────────────────
describe('getTemplateVariables', () => {
  it('retorna variables per booking_confirmation', () => {
    const vars = getTemplateVariables('booking_confirmation');
    expect(vars).toContain('clientName');
    expect(vars).toContain('reference');
    expect(vars).toContain('eventDate');
    expect(vars).toContain('total');
  });

  it('retorna variables per payment_reminder', () => {
    const vars = getTemplateVariables('payment_reminder');
    expect(vars).toContain('pendingAmount');
    expect(vars).toContain('daysUntilEvent');
  });

  it('retorna array buit per slug invàlid', () => {
    expect(getTemplateVariables('invalid')).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getTemplate
// ─────────────────────────────────────────────────────────────────────────
describe('getTemplate', () => {
  it('usa template de BD si actiu', async () => {
    mockPrisma.emailTemplate.findUnique.mockResolvedValue({
      slug: 'welcome',
      locale: 'ca',
      subject: 'Benvingut {{clientName}}!',
      bodyHtml: '<p>Hola {{clientName}}</p>',
      isActive: true,
    });

    const result = await getTemplate('welcome', 'ca', { clientName: 'Maria' });

    expect(result.source).toBe('db');
    expect(result.subject).toBe('Benvingut Maria!');
    expect(result.bodyHtml).toBe('<p>Hola Maria</p>');
  });

  it('usa template per defecte si BD no en té', async () => {
    const result = await getTemplate('welcome', 'ca', { clientName: 'Joan' });

    expect(result.source).toBe('default');
    expect(result.bodyHtml).toContain('Joan');
    expect(result.subject).toContain('Òrbita Events');
  });

  it('usa template per defecte si BD template no és actiu', async () => {
    mockPrisma.emailTemplate.findUnique.mockResolvedValue({
      slug: 'welcome',
      locale: 'ca',
      subject: 'Custom',
      bodyHtml: '<p>Custom</p>',
      isActive: false,
    });

    const result = await getTemplate('welcome', 'ca');
    expect(result.source).toBe('default');
  });

  it('interpola múltiples variables', async () => {
    const result = await getTemplate('booking_confirmation', 'ca', {
      clientName: 'Pere',
      reference: 'OE-2026-ABCD',
      total: 500,
    });

    expect(result.subject).toContain('OE-2026-ABCD');
    expect(result.bodyHtml).toContain('Pere');
  });

  it('manté placeholder si variable no proporcionada', async () => {
    // welcome subject doesn't have {{clientName}}, but body does
    const result = await getTemplate('welcome', 'ca', {});

    expect(result.bodyHtml).toContain('{{clientName}}');
  });

  it('retorna template en castellà si sol·licitat', async () => {
    const result = await getTemplate('welcome', 'es', { clientName: 'Ana' });

    expect(result.subject).toContain('Bienvenido');
    expect(result.bodyHtml).toContain('Ana');
  });

  it('retorna template en anglès', async () => {
    const result = await getTemplate('welcome', 'en', { clientName: 'John' });

    expect(result.subject).toContain('Welcome');
  });

  it('gestiona error BD sense petar (fallback a default)', async () => {
    mockPrisma.emailTemplate.findUnique.mockRejectedValue(new Error('DB down'));

    const result = await getTemplate('welcome', 'ca', { clientName: 'Test' });

    expect(result.source).toBe('default');
    expect(result.bodyHtml).toContain('Test');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getAdminTemplateDetail
// ─────────────────────────────────────────────────────────────────────────
describe('getAdminTemplateDetail', () => {
  it('retorna 400 per slug invàlid', async () => {
    const result = await getAdminTemplateDetail({ slug: 'invalid', locale: 'ca' });

    expect(result.status).toBe(400);
    expect(result.body.ok).toBe(false);
  });

  it('retorna 200 amb resolved template', async () => {
    const result = await getAdminTemplateDetail({
      slug: 'welcome',
      locale: 'ca',
      variables: { clientName: 'Test' },
    });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.resolved!.bodyHtml).toContain('Test');
  });

  it('inclou template DB si existeix', async () => {
    const dbTemplate = {
      slug: 'welcome',
      locale: 'ca',
      subject: 'Custom Subject',
      bodyHtml: '<p>Custom</p>',
      isActive: true,
    };
    mockPrisma.emailTemplate.findUnique.mockResolvedValue(dbTemplate);

    const result = await getAdminTemplateDetail({ slug: 'welcome', locale: 'ca' });

    expect(result.body.template).toBeTruthy();
    expect(result.body.template!.subject).toBe('Custom Subject');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// listTemplates
// ─────────────────────────────────────────────────────────────────────────
describe('listTemplates', () => {
  it('retorna tots els slugs de templates', async () => {
    const result = await listTemplates();

    expect(result.length).toBeGreaterThanOrEqual(8);
    const slugs = result.map((t) => t.slug);
    expect(slugs).toContain('booking_confirmation');
    expect(slugs).toContain('post_event');
    expect(slugs).toContain('welcome');
    expect(slugs).toContain('payment_reminder');
  });

  it('cada template té 3 locales (ca, es, en)', async () => {
    const result = await listTemplates();

    for (const template of result) {
      expect(template.locales).toHaveLength(3);
      const locales = template.locales.map((l) => l.locale);
      expect(locales).toContain('ca');
      expect(locales).toContain('es');
      expect(locales).toContain('en');
    }
  });

  it('marca source db si existeix al BD', async () => {
    mockPrisma.emailTemplate.findMany.mockResolvedValue([
      { slug: 'welcome', locale: 'ca', updatedAt: new Date() },
    ]);

    const result = await listTemplates();
    const welcome = result.find((t) => t.slug === 'welcome')!;
    const caLocale = welcome.locales.find((l) => l.locale === 'ca')!;
    const esLocale = welcome.locales.find((l) => l.locale === 'es')!;

    expect(caLocale.source).toBe('db');
    expect(esLocale.source).toBe('default');
  });

  it('inclou variables per cada template', async () => {
    const result = await listTemplates();

    const booking = result.find((t) => t.slug === 'booking_confirmation')!;
    expect(booking.variables).toContain('clientName');
    expect(booking.variables).toContain('reference');
  });

  it('inclou descripció per cada template', async () => {
    const result = await listTemplates();

    for (const template of result) {
      expect(template.description).toBeTruthy();
      expect(typeof template.description).toBe('string');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// upsertTemplate
// ─────────────────────────────────────────────────────────────────────────
describe('upsertTemplate', () => {
  it('crida upsert amb les dades correctes', async () => {
    await upsertTemplate({
      slug: 'welcome',
      locale: 'ca',
      subject: 'Nou subject',
      bodyHtml: '<p>Nou body</p>',
    });

    expect(mockPrisma.emailTemplate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug_locale: { slug: 'welcome', locale: 'ca' } },
        update: expect.objectContaining({
          subject: 'Nou subject',
          bodyHtml: '<p>Nou body</p>',
          isActive: true,
        }),
        create: expect.objectContaining({
          slug: 'welcome',
          locale: 'ca',
          subject: 'Nou subject',
        }),
      })
    );
  });

  it('usa bodyHtml buit si no proporcionat', async () => {
    await upsertTemplate({
      slug: 'welcome',
      locale: 'ca',
      subject: 'Test',
    });

    const call = mockPrisma.emailTemplate.upsert.mock.calls[0][0];
    expect(call.update.bodyHtml).toBe('');
  });

  it('inclou variables al JSON', async () => {
    await upsertTemplate({
      slug: 'booking_confirmation',
      locale: 'ca',
      subject: 'Test',
    });

    const call = mockPrisma.emailTemplate.upsert.mock.calls[0][0];
    const variables = JSON.parse(call.update.variables);
    expect(variables).toContain('clientName');
    expect(variables).toContain('reference');
  });
});
