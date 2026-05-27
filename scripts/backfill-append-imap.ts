/**
 * Script de backfill: recupera el rastre IMAP per a EmailSend antics que
 * no van fer APPEND a Sent.
 *
 * Cas d'ús: emails enviats abans del canvi #821 (com el cas Eric
 * `ercobix7@gmail.com`) tenen `imapAppendOk = NULL` perquè `sendEmail` no
 * feia APPEND. Aquest script:
 *   1. Llista tots els EmailSend amb `imapAppendOk IN (NULL, FALSE)`.
 *   2. Per a cada un, reconstrueix el MIME des de `htmlBody` + headers Òrbita
 *      i fa APPEND al folder Sent IMAP.
 *   3. Actualitza els camps `imapAppendOk / SentFolder / SentUid / Error`.
 *
 * Ús:
 *   npx tsx scripts/backfill-append-imap.ts --dry-run   # només llistar
 *   npx tsx scripts/backfill-append-imap.ts             # executar real
 *   npx tsx scripts/backfill-append-imap.ts --limit=10  # processar només 10
 *
 * Rate limit: ~1 missatge/segon per no saturar el servidor IMAP.
 */

import { prisma } from '../lib/prisma';
import {
  appendToFolder,
  buildOrbitaHeaders,
  buildOrbitaMessageId,
  discoverSpecialFolders,
  type OrbitaContext,
  type OrbitaEntityKind,
} from '../lib/imap';
import { promises as fs } from 'fs';
import * as path from 'path';

interface RunOptions {
  dryRun: boolean;
  limit: number | null;
}

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? Math.max(1, parseInt(limitArg.split('=')[1], 10)) : null;
  return { dryRun, limit };
}

async function ensureLogDir(): Promise<string> {
  const logDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(logDir, { recursive: true });
  return logDir;
}

async function buildMimeFor(record: {
  to: string;
  subject: string;
  htmlBody: string;
  sentAt: Date;
  smtpMessageId: string | null;
  orbitaKind: string | null;
  orbitaId: string | null;
  orbitaOrigin: string | null;
}): Promise<Buffer> {
  const fromAddress = (process.env.SMTP_FROM || '').trim();
  if (!fromAddress) throw new Error('SMTP_FROM no configurat');

  let orbitaHeaders: Record<string, string> | undefined;
  let messageId: string | undefined = record.smtpMessageId || undefined;

  if (record.orbitaKind) {
    const ctx: OrbitaContext = {
      kind: record.orbitaKind as OrbitaEntityKind,
      id: record.orbitaId || undefined,
      origin: record.orbitaOrigin || undefined,
    };
    orbitaHeaders = buildOrbitaHeaders(ctx);
    if (!messageId) messageId = buildOrbitaMessageId(ctx);
  }

  const { buildMime } = await import('../lib/mailComposerLoader');
  return buildMime({
    from: `"Orbita Events" <${fromAddress}>`,
    to: record.to,
    subject: record.subject,
    html: record.htmlBody,
    date: record.sentAt,
    headers: orbitaHeaders,
    messageId,
  });
}

async function main() {
  const opts = parseArgs();
  const logDir = await ensureLogDir();
  const logFile = path.join(logDir, `append-backfill-${Date.now()}.log`);
  const logLine = async (line: string) => {
    console.log(line);
    await fs.appendFile(logFile, line + '\n', 'utf8');
  };

  await logLine(`══ BACKFILL APPEND-IMAP ══ ${new Date().toISOString()}`);
  await logLine(`Mode: ${opts.dryRun ? 'DRY-RUN' : 'REAL'}${opts.limit ? `  (limit=${opts.limit})` : ''}`);
  await logLine(`Log: ${logFile}`);
  await logLine('');

  const special = await discoverSpecialFolders();
  if (!special.sent) {
    await logLine('❌ Servidor IMAP sense carpeta Sent reconeguda. Abort.');
    process.exit(1);
  }
  await logLine(`Folder Sent detectat: ${special.sent}`);
  await logLine('');

  const where = {
    OR: [
      { imapAppendOk: null },
      { imapAppendOk: false },
    ],
    htmlBody: { not: null },
  };

  const total = await prisma.emailSend.count({ where });
  await logLine(`Total candidats: ${total}`);

  if (opts.dryRun) {
    const sample = await prisma.emailSend.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: Math.min(20, opts.limit ?? 20),
      select: { id: true, to: true, subject: true, sentAt: true, imapAppendOk: true },
    });
    await logLine('Mostra (top 20):');
    for (const r of sample) {
      await logLine(`  - ${r.id} | ${r.sentAt.toISOString()} | ${r.to} | ${r.subject}`);
    }
    await logLine('');
    await logLine('DRY-RUN: cap canvi aplicat.');
    return;
  }

  const records = await prisma.emailSend.findMany({
    where,
    orderBy: { sentAt: 'desc' },
    take: opts.limit ?? undefined,
    select: {
      id: true,
      to: true,
      subject: true,
      htmlBody: true,
      sentAt: true,
      smtpMessageId: true,
      orbitaKind: true,
      orbitaId: true,
      orbitaOrigin: true,
    },
  });

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r.htmlBody) {
      await logLine(`[${i + 1}/${records.length}] ❌ ${r.id} — htmlBody buit`);
      fail++;
      continue;
    }

    try {
      const built = await buildMimeFor({
        to: r.to,
        subject: r.subject,
        htmlBody: r.htmlBody,
        sentAt: r.sentAt,
        smtpMessageId: r.smtpMessageId,
        orbitaKind: r.orbitaKind,
        orbitaId: r.orbitaId,
        orbitaOrigin: r.orbitaOrigin,
      });
      const result = await appendToFolder(special.sent, built, ['\\Seen']);
      await prisma.emailSend.update({
        where: { id: r.id },
        data: {
          imapAppendOk: result.ok,
          imapSentFolder: result.folder,
          imapSentUid: result.uid ?? null,
          imapError: result.ok ? null : (result.error || 'APPEND ha fallat'),
        },
      });

      if (result.ok) {
        await logLine(`[${i + 1}/${records.length}] ✅ ${r.id} — UID ${result.uid ?? '?'} a ${result.folder} | ${r.to}`);
        ok++;
      } else {
        await logLine(`[${i + 1}/${records.length}] ⚠ ${r.id} — ${result.error || 'APPEND fallit'}`);
        fail++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.emailSend.update({
        where: { id: r.id },
        data: { imapAppendOk: false, imapError: msg },
      });
      await logLine(`[${i + 1}/${records.length}] ❌ ${r.id} — ${msg}`);
      fail++;
    }

    // Rate limit ~1/seg
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await logLine('');
  await logLine(`══ RESUM ══`);
  await logLine(`OK: ${ok} | Fail: ${fail} | Total: ${records.length}`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
