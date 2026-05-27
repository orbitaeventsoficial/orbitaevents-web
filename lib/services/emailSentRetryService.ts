/**
 * emailSentRetryService — reintent d'APPEND al folder Sent IMAP per a
 * EmailSends que no es van arxivar el primer cop (cas Eric Conchillo i
 * emails enviats abans de #821).
 *
 * Reconstrueix el MIME a partir del snapshot `htmlBody` + headers Òrbita
 * persistits a la BD. NO reenvia per SMTP — només deixa el rastre al
 * servidor IMAP. La pròpia BD només es toca per persistir el resultat
 * observable de l'APPEND.
 */

import { prisma } from '@/lib/prisma';
import {
  appendToFolder,
  buildOrbitaHeaders,
  buildOrbitaMessageId,
  discoverSpecialFolders,
  type OrbitaContext,
  type OrbitaEntityKind,
} from '@/lib/imap';
import { buildMime } from '@/lib/mailComposerLoader';

export type RetryAppendResult =
  | { kind: 'ok'; folder: string | null; uid?: number; alreadyAppended?: boolean }
  | { kind: 'not-found' }
  | { kind: 'no-snapshot' }
  | { kind: 'no-sent-folder' }
  | { kind: 'no-smtp-from' }
  | { kind: 'append-failed'; error: string };

export async function retryAppendToSent(emailSendId: string): Promise<RetryAppendResult> {
  const record = await prisma.emailSend.findUnique({
    where: { id: emailSendId },
    select: {
      id: true,
      to: true,
      subject: true,
      htmlBody: true,
      smtpMessageId: true,
      orbitaKind: true,
      orbitaId: true,
      orbitaOrigin: true,
      sentAt: true,
      imapAppendOk: true,
    },
  });

  if (!record) return { kind: 'not-found' };
  if (!record.htmlBody) return { kind: 'no-snapshot' };
  if (record.imapAppendOk === true) {
    return { kind: 'ok', folder: null, alreadyAppended: true };
  }

  const special = await discoverSpecialFolders();
  if (!special.sent) return { kind: 'no-sent-folder' };

  const fromAddress = (process.env.SMTP_FROM || '').trim();
  if (!fromAddress) return { kind: 'no-smtp-from' };

  let orbitaHeaders: Record<string, string> | undefined;
  let orbitaMessageId: string | undefined;
  if (record.orbitaKind) {
    const ctx: OrbitaContext = {
      kind: record.orbitaKind as OrbitaEntityKind,
      id: record.orbitaId || undefined,
      origin: record.orbitaOrigin || undefined,
    };
    orbitaHeaders = buildOrbitaHeaders(ctx);
    orbitaMessageId = record.smtpMessageId || buildOrbitaMessageId(ctx);
  } else {
    orbitaMessageId = record.smtpMessageId || undefined;
  }

  const built = await buildMime({
    from: `"Orbita Events" <${fromAddress}>`,
    to: record.to,
    subject: record.subject,
    html: record.htmlBody,
    date: record.sentAt,
    headers: orbitaHeaders,
    messageId: orbitaMessageId,
  });

  const result = await appendToFolder(special.sent, built, ['\\Seen']);

  await prisma.emailSend.update({
    where: { id: record.id },
    data: {
      imapAppendOk: result.ok,
      imapSentFolder: result.folder,
      imapSentUid: result.uid ?? null,
      imapError: result.ok ? null : (result.error || 'APPEND ha fallat'),
    },
  });

  if (!result.ok) {
    return { kind: 'append-failed', error: result.error || 'APPEND ha fallat' };
  }
  return { kind: 'ok', folder: result.folder, uid: result.uid };
}
