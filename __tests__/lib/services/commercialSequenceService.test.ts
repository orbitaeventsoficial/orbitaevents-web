import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendEmail, mockSendWhatsAppText } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    leadActivity: { create: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockSendEmail: vi.fn(),
  mockSendWhatsAppText: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/services/whatsappService', () => ({ sendWhatsAppText: mockSendWhatsAppText }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { runCommercialSequences, DEFAULT_NURTURING_CADENCE } from '@/lib/services/commercialSequenceService';

function makeLead(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'lead-1',
    name: 'Joan Garcia',
    email: 'joan@example.com',
    phone: '+34612345678',
    eventType: 'Boda',
    status: 'NEW',
    preferredLocale: 'ca',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // fa 48h
    nurturingStep: 0,
    lastNurturingAt: null,
    ...overrides,
  };
}

describe('runCommercialSequences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.lead.update.mockResolvedValue({});
    mockPrisma.leadActivity.create.mockResolvedValue({});
    mockPrisma.adminLog.create.mockResolvedValue({});
    mockSendEmail.mockResolvedValue(undefined);
    mockSendWhatsAppText.mockResolvedValue({ ok: false }); // WhatsApp off per defecte
  });

  it('retorna summary buit sense leads', async () => {
    const result = await runCommercialSequences();
    expect(result.scanned).toBe(0);
    expect(result.executed).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('envia email al pas 1 si lead creat fa >24h', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([makeLead()]);

    const result = await runCommercialSequences();

    expect(result.scanned).toBe(1);
    expect(result.matched).toBe(1);
    expect(result.executed).toBe(1);
    expect(result.sentEmail).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joan@example.com',
        subject: expect.stringContaining('sol·licitud'), // ca locale
      }),
    );
  });

  it('salta lead si no ha passat prou temps (pas 1 < 24h)', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      makeLead({ createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }), // fa 12h
    ]);

    const result = await runCommercialSequences();
    expect(result.skippedNotReady).toBe(1);
    expect(result.executed).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('envia WhatsApp primer, fallback a email si falla', async () => {
    mockSendWhatsAppText.mockResolvedValue({ ok: false });
    mockPrisma.lead.findMany.mockResolvedValue([makeLead()]);

    const result = await runCommercialSequences();
    expect(mockSendWhatsAppText).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(result.sentEmail).toBe(1);
    expect(result.sentWhatsapp).toBe(0);
  });

  it('usa WhatsApp si disponible', async () => {
    mockSendWhatsAppText.mockResolvedValue({ ok: true });
    mockPrisma.lead.findMany.mockResolvedValue([makeLead()]);

    const result = await runCommercialSequences();
    expect(result.sentWhatsapp).toBe(1);
    expect(result.sentEmail).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('salta si no té ni email ni telèfon', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      makeLead({ email: null, phone: null }),
    ]);

    const result = await runCommercialSequences();
    expect(result.skippedNoChannel).toBe(1);
    expect(result.executed).toBe(0);
  });

  it('actualitza lead després d\'enviar (nurturingStep +1)', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([makeLead()]);

    await runCommercialSequences();

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: expect.objectContaining({
        nurturingStep: 1,
        nurturingDone: false,
      }),
    });
  });

  it('marca nurturingDone=true a l\'últim pas', async () => {
    const maxStep = DEFAULT_NURTURING_CADENCE.length;
    const lastStepDelay = DEFAULT_NURTURING_CADENCE[maxStep - 1].delayHours;

    mockPrisma.lead.findMany.mockResolvedValue([
      makeLead({
        nurturingStep: maxStep - 1,
        lastNurturingAt: new Date(Date.now() - (lastStepDelay + 1) * 60 * 60 * 1000),
      }),
    ]);

    const result = await runCommercialSequences();

    expect(result.exhausted).toBe(1);
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: expect.objectContaining({
        nurturingStep: maxStep,
        nurturingDone: true,
      }),
    });
  });

  it('crea adminLog COMM_SEQUENCE_EXEC per cada execució', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([makeLead()]);

    await runCommercialSequences();

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'COMM_SEQUENCE_EXEC',
        entity: 'lead',
        entityId: 'lead-1',
        details: expect.objectContaining({
          step: 1,
          templateSlug: 'follow-up-1',
        }),
      }),
    });
  });

  it('crea leadActivity amb canal i metadades', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([makeLead()]);

    await runCommercialSequences();

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        type: 'EMAIL',
        createdBy: 'Sequence Bot',
        metadata: expect.objectContaining({
          step: 1,
          channel: 'email',
          locale: 'ca',
        }),
      }),
    });
  });

  it('usa locale correcte del lead (es)', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      makeLead({ preferredLocale: 'es' }),
    ]);

    await runCommercialSequences();

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('solicitud'), // es locale
      }),
    );
  });


  it('no executa nurturing si el lead ja ha respost després de l’últim outbound', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      makeLead({
        activities: [
          { createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000), metadata: { direction: 'inbound' } },
          { createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000), metadata: { direction: 'outbound' } },
        ],
      }),
    ]);

    const result = await runCommercialSequences();

    expect(result.executed).toBe(0);
    expect(result.skippedNotReady).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });
  it('compta errors sense parar', async () => {
    mockSendEmail.mockRejectedValue(new Error('SMTP down'));
    mockPrisma.lead.findMany.mockResolvedValue([makeLead(), makeLead({ id: 'lead-2' })]);

    const result = await runCommercialSequences();
    expect(result.errors).toBe(2);
    expect(result.executed).toBe(0);
  });

  it('processa múltiples leads independentment', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      makeLead({ id: 'l1' }),
      makeLead({ id: 'l2', preferredLocale: 'en' }),
      makeLead({ id: 'l3', createdAt: new Date() }), // massa recent
    ]);

    const result = await runCommercialSequences();
    expect(result.scanned).toBe(3);
    expect(result.executed).toBe(2);
    expect(result.skippedNotReady).toBe(1);
  });
});

describe('DEFAULT_NURTURING_CADENCE', () => {
  it('té 5 passos', () => {
    expect(DEFAULT_NURTURING_CADENCE).toHaveLength(5);
  });

  it('delays incrementals', () => {
    for (let i = 1; i < DEFAULT_NURTURING_CADENCE.length; i++) {
      expect(DEFAULT_NURTURING_CADENCE[i].delayHours).toBeGreaterThan(
        DEFAULT_NURTURING_CADENCE[i - 1].delayHours,
      );
    }
  });

  it('tots els passos tenen templateSlug i channel', () => {
    for (const step of DEFAULT_NURTURING_CADENCE) {
      expect(step.templateSlug).toBeTruthy();
      expect(step.channel).toBe('EMAIL');
      expect(step.step).toBeGreaterThan(0);
    }
  });
});
