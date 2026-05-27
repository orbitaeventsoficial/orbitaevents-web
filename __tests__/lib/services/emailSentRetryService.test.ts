/**
 * Tests de emailSentRetryService — reintent d'APPEND a Sent IMAP per a
 * EmailSends antics (cas Eric Conchillo).
 *
 * El servei reconstrueix MIME des de snapshot BD + headers Òrbita persistits
 * i actualitza el resultat de l'APPEND. Cobrim els 6 estats possibles:
 *   - ok (normal)
 *   - ok (alreadyAppended)
 *   - not-found
 *   - no-snapshot
 *   - no-sent-folder
 *   - no-smtp-from
 *   - append-failed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAppendToFolder, mockDiscoverSpecial, mockBuildMime } = vi.hoisted(() => ({
  mockPrisma: {
    emailSend: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  mockAppendToFolder: vi.fn(),
  mockDiscoverSpecial: vi.fn(),
  mockBuildMime: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/imap', () => ({
  appendToFolder: mockAppendToFolder,
  buildOrbitaHeaders: (ctx: { kind: string; id?: string; origin?: string }) => ({
    'X-Orbita-Kind': ctx.kind,
    ...(ctx.id ? { 'X-Orbita-Id': ctx.id } : {}),
    ...(ctx.origin ? { 'X-Orbita-Origin': ctx.origin } : {}),
  }),
  buildOrbitaMessageId: (ctx: { kind: string; id?: string }) =>
    `<orbita.${ctx.kind}.${ctx.id ?? 'na'}.test.fake@orbitaevents.com>`,
  discoverSpecialFolders: mockDiscoverSpecial,
}));
vi.mock('@/lib/mailComposerLoader', () => ({
  buildMime: mockBuildMime,
}));

import { retryAppendToSent } from '@/lib/services/emailSentRetryService';

const SAMPLE_RECORD = {
  id: 'es-1',
  to: 'client@test.com',
  subject: 'Hola',
  htmlBody: '<p>Hola</p>',
  smtpMessageId: '<m1@test>',
  orbitaKind: 'lead',
  orbitaId: 'L1',
  orbitaOrigin: 'admin-compose',
  sentAt: new Date('2026-05-26T09:46:00Z'),
  imapAppendOk: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SMTP_FROM = 'info@orbita.test';
  mockBuildMime.mockResolvedValue(Buffer.from('MIME RAW'));
  mockDiscoverSpecial.mockResolvedValue({
    inbox: 'INBOX', sent: 'INBOX.Sent', drafts: null, trash: null, junk: null, archive: null,
  });
  mockAppendToFolder.mockResolvedValue({ ok: true, folder: 'INBOX.Sent', uid: 42 });
  mockPrisma.emailSend.update.mockResolvedValue({});
});

describe('retryAppendToSent', () => {
  it('retorna ok i actualitza la BD quan tot va bé', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({ ...SAMPLE_RECORD });

    const result = await retryAppendToSent('es-1');

    expect(result).toEqual({ kind: 'ok', folder: 'INBOX.Sent', uid: 42 });
    expect(mockBuildMime).toHaveBeenCalledWith(expect.objectContaining({
      to: 'client@test.com',
      subject: 'Hola',
      html: '<p>Hola</p>',
      headers: expect.objectContaining({ 'X-Orbita-Kind': 'lead', 'X-Orbita-Id': 'L1' }),
      messageId: '<m1@test>', // reutilitza el messageId persistit
    }));
    expect(mockAppendToFolder).toHaveBeenCalledWith('INBOX.Sent', expect.any(Buffer), ['\\Seen']);
    expect(mockPrisma.emailSend.update).toHaveBeenCalledWith({
      where: { id: 'es-1' },
      data: expect.objectContaining({
        imapAppendOk: true,
        imapSentFolder: 'INBOX.Sent',
        imapSentUid: 42,
        imapError: null,
      }),
    });
  });

  it('retorna ok alreadyAppended si imapAppendOk era true', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({ ...SAMPLE_RECORD, imapAppendOk: true });

    const result = await retryAppendToSent('es-1');

    expect(result).toEqual({ kind: 'ok', folder: null, alreadyAppended: true });
    expect(mockBuildMime).not.toHaveBeenCalled();
    expect(mockAppendToFolder).not.toHaveBeenCalled();
    expect(mockPrisma.emailSend.update).not.toHaveBeenCalled();
  });

  it('retorna not-found si el record no existeix', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue(null);
    const result = await retryAppendToSent('inexistent');
    expect(result).toEqual({ kind: 'not-found' });
  });

  it('retorna no-snapshot si htmlBody és null', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({ ...SAMPLE_RECORD, htmlBody: null });
    const result = await retryAppendToSent('es-1');
    expect(result).toEqual({ kind: 'no-snapshot' });
  });

  it('retorna no-sent-folder si el servidor IMAP no té carpeta Sent', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({ ...SAMPLE_RECORD });
    mockDiscoverSpecial.mockResolvedValue({
      inbox: 'INBOX', sent: null, drafts: null, trash: null, junk: null, archive: null,
    });
    const result = await retryAppendToSent('es-1');
    expect(result).toEqual({ kind: 'no-sent-folder' });
    expect(mockAppendToFolder).not.toHaveBeenCalled();
  });

  it('retorna no-smtp-from si SMTP_FROM no està configurat', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({ ...SAMPLE_RECORD });
    delete process.env.SMTP_FROM;
    const result = await retryAppendToSent('es-1');
    expect(result).toEqual({ kind: 'no-smtp-from' });
  });

  it('retorna append-failed i registra l\'error a la BD si l\'APPEND falla', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({ ...SAMPLE_RECORD });
    mockAppendToFolder.mockResolvedValue({ ok: false, folder: 'INBOX.Sent', error: "Mailbox doesn't exist" });

    const result = await retryAppendToSent('es-1');

    expect(result).toEqual({ kind: 'append-failed', error: "Mailbox doesn't exist" });
    expect(mockPrisma.emailSend.update).toHaveBeenCalledWith({
      where: { id: 'es-1' },
      data: expect.objectContaining({
        imapAppendOk: false,
        imapError: "Mailbox doesn't exist",
      }),
    });
  });

  it('genera un Message-ID Òrbita nou si no n\'hi havia (smtpMessageId null)', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({
      ...SAMPLE_RECORD,
      smtpMessageId: null,
    });

    await retryAppendToSent('es-1');

    expect(mockBuildMime).toHaveBeenCalledWith(expect.objectContaining({
      messageId: expect.stringMatching(/^<orbita\.lead\.L1\./),
    }));
  });

  it('no injecta headers Òrbita si el record no en té', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({
      ...SAMPLE_RECORD,
      orbitaKind: null,
      orbitaId: null,
      orbitaOrigin: null,
    });

    await retryAppendToSent('es-1');

    expect(mockBuildMime).toHaveBeenCalledWith(expect.objectContaining({
      headers: undefined,
      messageId: '<m1@test>',
    }));
  });
});
