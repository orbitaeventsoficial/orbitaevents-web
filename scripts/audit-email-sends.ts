/**
 * Auditoria ràpida d'EmailSend per veure quants tenen htmlBody / imapAppendOk
 * i si trobem el cas Eric.
 */
import { prisma } from '../lib/prisma';

async function main() {
  const total = await prisma.emailSend.count();
  const withHtml = await prisma.emailSend.count({ where: { htmlBody: { not: null } } });
  const withoutHtml = await prisma.emailSend.count({ where: { htmlBody: null } });
  const appendOk = await prisma.emailSend.count({ where: { imapAppendOk: true } });
  const appendFalse = await prisma.emailSend.count({ where: { imapAppendOk: false } });
  const appendNull = await prisma.emailSend.count({ where: { imapAppendOk: null } });

  const eric = await prisma.emailSend.findMany({
    where: { to: { contains: 'ercobix7' } },
    select: { id: true, to: true, subject: true, sentAt: true, htmlBody: true, imapAppendOk: true },
    take: 5,
  });

  const lastWithHtml = await prisma.emailSend.findMany({
    where: { htmlBody: { not: null } },
    orderBy: { sentAt: 'desc' },
    select: { id: true, to: true, subject: true, sentAt: true, imapAppendOk: true },
    take: 5,
  });

  console.log('═══ EMAILSEND AUDIT ═══');
  console.log(`Total:           ${total}`);
  console.log(`Amb htmlBody:    ${withHtml}`);
  console.log(`Sense htmlBody:  ${withoutHtml}`);
  console.log(`imapAppendOk=T:  ${appendOk}`);
  console.log(`imapAppendOk=F:  ${appendFalse}`);
  console.log(`imapAppendOk=N:  ${appendNull}`);
  console.log('');
  console.log('Cas Eric (to contains "ercobix7"):');
  for (const e of eric) {
    console.log(`  - ${e.id} | ${e.sentAt.toISOString()} | htmlBody=${e.htmlBody ? `${e.htmlBody.length}b` : 'null'} | imapAppendOk=${e.imapAppendOk}`);
    console.log(`    "${e.subject}"`);
  }
  console.log('');
  console.log('Últims 5 amb htmlBody:');
  for (const e of lastWithHtml) {
    console.log(`  - ${e.id} | ${e.sentAt.toISOString()} | imapAppendOk=${e.imapAppendOk} | ${e.to}`);
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
