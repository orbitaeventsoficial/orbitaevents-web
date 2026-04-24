import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ───────────────────────────────────────────────────────
const { mockPrisma, mockFetchEmailByUid, mockExtractLeadData } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    leadNote: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
  mockFetchEmailByUid: vi.fn(),
  mockExtractLeadData: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/imap', () => ({ fetchEmailByUid: mockFetchEmailByUid }));
vi.mock('@/lib/services/emailLeadExtractionService', () => ({
  extractLeadDataFromEmail: mockExtractLeadData,
}));
vi.mock('@/lib/services/leadActivityService', () => ({
  recordLeadCreatedFromInbox: vi.fn(),
  recordLeadUpdatedFromInbox: vi.fn(),
}));

import { importLeadFromInboxMessage } from '@/lib/services/inboxLeadImportService';
import { recordLeadCreatedFromInbox, recordLeadUpdatedFromInbox } from '@/lib/services/leadActivityService';

// ── Helpers ─────────────────────────────────────────────────────────────
function makeEmailResult(overrides = {}) {
  return {
    from: { address: 'client@example.com', name: 'Maria López' },
    subject: 'Consulta boda setembre',
    bodyText: 'Hola, volem DJ per la nostra boda de 150 convidats.',
    ...overrides,
  };
}

function makeExtraction(overrides = {}) {
  return {
    name: 'Maria López',
    email: 'client@example.com',
    phone: '+34699111222',
    eventType: 'WEDDING' as const,
    eventDate: new Date('2026-09-20'),
    eventSchedule: '21:00 - 04:00',
    guestCount: 150,
    budget: '1500€',
    eventLocation: 'Masia el Bosc',
    message: 'Volem DJ per la nostra boda',
    commercialSummary: 'Boda 150 convidats, budget 1500€',
    importantUnknowns: ['Confirmar horari exacte'],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchEmailByUid.mockResolvedValue(makeEmailResult());
  mockExtractLeadData.mockReturnValue(makeExtraction());
  mockPrisma.lead.findFirst.mockResolvedValue(null);
  mockPrisma.lead.create.mockResolvedValue({
    id: 'new-lead-1',
    name: 'Maria López',
    email: 'client@example.com',
    status: 'NEW',
  });
  mockPrisma.lead.update.mockResolvedValue({
    id: 'existing-lead-1',
    name: 'Maria López',
    email: 'client@example.com',
    status: 'NEW',
  });
  mockPrisma.leadNote.findFirst.mockResolvedValue(null);
  mockPrisma.leadNote.create.mockResolvedValue({});
});

// ─────────────────────────────────────────────────────────────────────────
// Validació entrada
// ─────────────────────────────────────────────────────────────────────────
describe('validació entrada', () => {
  it('retorna 400 si UID no és finit', async () => {
    const result = await importLeadFromInboxMessage(NaN);
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('UID');
  });

  it('retorna 400 si email remitent invàlid', async () => {
    mockFetchEmailByUid.mockResolvedValue({
      from: { address: '', name: '' },
      subject: 'test',
      bodyText: 'test',
    });

    const result = await importLeadFromInboxMessage(123);
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('remitent');
  });

  it('retorna 400 si email extret no és vàlid', async () => {
    mockFetchEmailByUid.mockResolvedValue({
      from: { address: 'not-an-email', name: '' },
      subject: 'test',
      bodyText: 'test',
    });
    mockExtractLeadData.mockReturnValue(makeExtraction({ email: 'not-an-email' }));

    const result = await importLeadFromInboxMessage(123);
    expect(result.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Creació nou lead
// ─────────────────────────────────────────────────────────────────────────
describe('creació nou lead', () => {
  it('crea lead nou si no existeix', async () => {
    const result = await importLeadFromInboxMessage(100);

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.action).toBe('created');
    expect(result.body.lead!.name).toBe('Maria López');
  });

  it('crea lead amb source OTHER', async () => {
    await importLeadFromInboxMessage(100);

    expect(mockPrisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'OTHER',
          email: 'client@example.com',
          name: 'Maria López',
        }),
      })
    );
  });

  it('crea leadNote amb UID i resum', async () => {
    await importLeadFromInboxMessage(100);

    expect(mockPrisma.leadNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: expect.stringContaining('UID 100'),
          createdBy: 'Admin Inbox',
        }),
      })
    );

    const noteContent = mockPrisma.leadNote.create.mock.calls[0][0].data.content;
    expect(noteContent).toContain('Resum comercial');
    expect(noteContent).toContain('Revisar manualment');
  });

  it('registra leadActivity shared amb metadades', async () => {
    await importLeadFromInboxMessage(100);

    expect(recordLeadCreatedFromInbox).toHaveBeenCalledWith({
      leadId: 'new-lead-1',
      senderAddress: 'client@example.com',
      uid: 100,
      subject: 'Consulta boda setembre',
      usedFallback: false,
    });
  });

  it('usa fallback email si IMAP no retorna res', async () => {
    mockFetchEmailByUid.mockResolvedValue(null);
    mockExtractLeadData.mockReturnValue(makeExtraction({
      name: 'Fallback Name',
      email: 'fallback@test.com',
    }));

    const result = await importLeadFromInboxMessage(200, {
      fromAddress: 'fallback@test.com',
      fromName: 'Fallback Name',
      subject: 'Fallback subject',
      bodyText: 'Fallback body',
    });

    expect(result.status).toBe(200);
    expect(result.body.action).toBe('created');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Actualització lead existent
// ─────────────────────────────────────────────────────────────────────────
describe('actualització lead existent', () => {
  const existingLead = {
    id: 'existing-lead-1',
    name: 'Maria López',
    email: 'client@example.com',
    phone: null,
    eventType: 'OTHER' as const,
    eventDate: null,
    eventSchedule: null,
    guestCount: null,
    budget: null,
    eventLocation: null,
    source: 'WEBSITE' as const,
    message: null,
    status: 'NEW',
  };

  it('actualitza lead existent (merge)', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(existingLead);

    const result = await importLeadFromInboxMessage(100);

    expect(result.status).toBe(200);
    expect(result.body.action).toBe('updated');
    expect(mockPrisma.lead.update).toHaveBeenCalled();
  });

  it('no sobreescriu camps que ja tenen valor', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      ...existingLead,
      phone: '+34600000000',
      eventType: 'BIRTHDAY',
      guestCount: 50,
    });

    await importLeadFromInboxMessage(100);

    const updateCall = mockPrisma.lead.update.mock.calls[0][0];
    expect(updateCall.data.phone).toBe('+34600000000'); // no sobreescrit
    expect(updateCall.data.eventType).toBe('BIRTHDAY'); // no canvia (no és OTHER)
    expect(updateCall.data.guestCount).toBe(50); // no sobreescrit
  });

  it('actualitza eventType si era OTHER', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(existingLead);

    await importLeadFromInboxMessage(100);

    const updateCall = mockPrisma.lead.update.mock.calls[0][0];
    expect(updateCall.data.eventType).toBe('WEDDING');
  });

  it('canvia source WEBSITE a OTHER', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(existingLead);

    await importLeadFromInboxMessage(100);

    const updateCall = mockPrisma.lead.update.mock.calls[0][0];
    expect(updateCall.data.source).toBe('OTHER');
  });

  it('no canvia source si no és WEBSITE', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      ...existingLead,
      source: 'INSTAGRAM',
    });

    await importLeadFromInboxMessage(100);

    const updateCall = mockPrisma.lead.update.mock.calls[0][0];
    expect(updateCall.data.source).toBe('INSTAGRAM');
  });

  it('detecta importació duplicada (already_imported)', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(existingLead);
    mockPrisma.leadNote.findFirst.mockResolvedValue({ id: 'note-1' });

    const result = await importLeadFromInboxMessage(100);

    expect(result.status).toBe(200);
    expect(result.body.action).toBe('already_imported');
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  it('registra activitat shared quan actualitza lead existent', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(existingLead);

    await importLeadFromInboxMessage(100);

    expect(recordLeadUpdatedFromInbox).toHaveBeenCalledWith({
      leadId: 'existing-lead-1',
      senderAddress: 'client@example.com',
      uid: 100,
      subject: 'Consulta boda setembre',
      usedFallback: false,
    });
  });

  it('inclou missatge merged amb marker', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(existingLead);

    await importLeadFromInboxMessage(100);

    const updateCall = mockPrisma.lead.update.mock.calls[0][0];
    expect(updateCall.data.message).toContain('[importat des d\'email:');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Sanitització
// ─────────────────────────────────────────────────────────────────────────
describe('sanitització', () => {
  it('trunca noms massa llargs', async () => {
    mockExtractLeadData.mockReturnValue(
      makeExtraction({ name: 'A'.repeat(200) })
    );

    await importLeadFromInboxMessage(100);

    const createCall = mockPrisma.lead.create.mock.calls[0][0];
    expect(createCall.data.name.length).toBeLessThanOrEqual(120);
  });

  it('limita importantUnknowns a 6 elements', async () => {
    mockExtractLeadData.mockReturnValue(
      makeExtraction({
        importantUnknowns: Array.from({ length: 10 }, (_, i) => `Unknown ${i}`),
      })
    );

    await importLeadFromInboxMessage(100);

    const noteContent = mockPrisma.leadNote.create.mock.calls[0][0].data.content;
    const unknownLines = noteContent.split('\n').filter((l: string) => l.startsWith('- Unknown'));
    expect(unknownLines.length).toBeLessThanOrEqual(6);
  });

  it('no inclou guestCount negatiu', async () => {
    mockExtractLeadData.mockReturnValue(
      makeExtraction({ guestCount: -5 })
    );

    await importLeadFromInboxMessage(100);

    const createCall = mockPrisma.lead.create.mock.calls[0][0];
    expect(createCall.data.guestCount).toBeNull();
  });

  it('limita guestCount a 10000', async () => {
    mockExtractLeadData.mockReturnValue(
      makeExtraction({ guestCount: 50000 })
    );

    await importLeadFromInboxMessage(100);

    const createCall = mockPrisma.lead.create.mock.calls[0][0];
    expect(createCall.data.guestCount).toBeLessThanOrEqual(10000);
  });
});
