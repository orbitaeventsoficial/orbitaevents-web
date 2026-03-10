/**
 * Exportar backup de dades crítiques a JSON
 * ==========================================
 * Exporta leads, bookings, customers, settings, email templates i packs.
 *
 * Executar: npx tsx scripts/export-backup.ts
 * Resultat: backup/backup-YYYY-MM-DD.json
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('💾 Exportant backup de dades crítiques...\n');

  const [leads, bookings, customers, settings, emailTemplates, packs, extras, discountCodes, faqs, inventoryItems] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.customer.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.setting.findMany({ orderBy: { key: 'asc' } }),
    prisma.emailTemplate.findMany({ orderBy: [{ slug: 'asc' }, { locale: 'asc' }] }),
    prisma.pack.findMany({ include: { translations: true } }),
    prisma.extra.findMany({ include: { translations: true } }),
    prisma.discountCode.findMany(),
    prisma.fAQ.findMany({ include: { translations: true } }),
    prisma.inventoryItem.findMany({ orderBy: { code: 'asc' } }),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    counts: {
      leads: leads.length,
      bookings: bookings.length,
      customers: customers.length,
      settings: settings.length,
      emailTemplates: emailTemplates.length,
      packs: packs.length,
      extras: extras.length,
      discountCodes: discountCodes.length,
      faqs: faqs.length,
      inventoryItems: inventoryItems.length,
    },
    data: {
      leads,
      bookings,
      customers,
      settings,
      emailTemplates,
      packs,
      extras,
      discountCodes,
      faqs,
      inventoryItems,
    },
  };

  // Crear carpeta backup si no existeix
  const backupDir = path.join(process.cwd(), 'backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const filePath = path.join(backupDir, `backup-${date}.json`);
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf8');

  console.log('📊 Resum:');
  for (const [key, count] of Object.entries(backup.counts)) {
    console.log(`   ${key}: ${count}`);
  }
  console.log(`\n✅ Backup guardat a: ${filePath}`);
  console.log(`   Mida: ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
