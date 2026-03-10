/**
 * Resetejar plantilles email als valors per defecte
 * ===================================================
 * Elimina les personalitzacions de la BD i torna als defaults del codi.
 *
 * Executar:
 *   npx tsx scripts/reset-email-templates.ts                    # Reset TOTES
 *   npx tsx scripts/reset-email-templates.ts booking_confirmation  # Reset un slug
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetSlug = process.argv[2];

  if (targetSlug) {
    const deleted = await prisma.emailTemplate.deleteMany({ where: { slug: targetSlug } });
    console.log(`🗑️  ${deleted.count} plantilles eliminades per slug "${targetSlug}"`);
    console.log('   Ara s\'usaran els defaults del codi.');
    console.log('   Per reinserir-les a la BD: npx tsx prisma/seed-email-templates.ts');
  } else {
    const count = await prisma.emailTemplate.count();
    const deleted = await prisma.emailTemplate.deleteMany();
    console.log(`🗑️  ${deleted.count}/${count} plantilles eliminades`);
    console.log('   Ara s\'usaran els defaults del codi per a tots els emails.');
    console.log('   Per reinserir-les a la BD: npx tsx prisma/seed-email-templates.ts');
  }
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
