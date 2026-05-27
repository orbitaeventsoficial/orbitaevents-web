/**
 * Marca tots els EmailSend antics SENSE htmlBody (anteriors a la migració
 * #800 que va afegir el snapshot) com a "legacy no-recuperables" — així la
 * UI pot mostrar un avís en lloc d'un "Enviat" enganyós.
 *
 * Acció:
 *   imapAppendOk = false
 *   imapError    = "Sense snapshot HTML — anterior a #821 (no recuperable)"
 *
 * Run:
 *   npx tsx scripts/mark-legacy-emailsends.ts --dry-run
 *   npx tsx scripts/mark-legacy-emailsends.ts
 */
import { prisma } from '../lib/prisma';

const LEGACY_ERROR = "Sense snapshot HTML — anterior a #821 (no recuperable)";

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const candidates = await prisma.emailSend.findMany({
    where: {
      htmlBody: null,
      OR: [{ imapAppendOk: null }, { imapAppendOk: false }],
    },
    select: { id: true, to: true, subject: true, sentAt: true },
    orderBy: { sentAt: 'desc' },
  });

  console.log(`Candidats legacy (sense htmlBody, imapAppendOk pendent): ${candidates.length}`);
  for (const c of candidates) {
    console.log(`  - ${c.id} | ${c.sentAt.toISOString()} | ${c.to} | "${c.subject.slice(0, 60)}"`);
  }

  if (dryRun) {
    console.log('');
    console.log('DRY-RUN: cap canvi aplicat.');
    return;
  }

  if (candidates.length === 0) {
    console.log('Res a fer.');
    return;
  }

  const { count } = await prisma.emailSend.updateMany({
    where: { id: { in: candidates.map(c => c.id) } },
    data: {
      imapAppendOk: false,
      imapError: LEGACY_ERROR,
    },
  });
  console.log('');
  console.log(`Actualitzats: ${count}`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
