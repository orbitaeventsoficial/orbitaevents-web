/**
 * Actualitzar PVP dels packs
 * ============================
 * Mostra els preus actuals i permet actualitzar-los.
 *
 * Executar:
 *   npx tsx scripts/update-pack-prices.ts                      # Llistar preus
 *   npx tsx scripts/update-pack-prices.ts flash 300             # Canviar preu
 *   npx tsx scripts/update-pack-prices.ts party-starter 450     # Canviar preu
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetSlug = process.argv[2];
  const newPrice = process.argv[3] ? parseFloat(process.argv[3]) : null;

  const packs = await prisma.pack.findMany({
    include: { translations: { where: { locale: 'ca' } } },
    orderBy: { order: 'asc' },
  });

  if (targetSlug && newPrice !== null && !isNaN(newPrice)) {
    const pack = packs.find((p) => p.slug === targetSlug);
    if (!pack) {
      console.log(`❌ Pack "${targetSlug}" no trobat. Slugs disponibles: ${packs.map((p) => p.slug).join(', ')}`);
      return;
    }

    const oldPrice = pack.price;
    await prisma.pack.update({
      where: { slug: targetSlug },
      data: { price: newPrice },
    });

    const change = ((newPrice - Number(oldPrice)) / Number(oldPrice) * 100).toFixed(1);
    console.log(`✅ Pack "${targetSlug}": ${oldPrice}€ → ${newPrice}€ (${Number(change) >= 0 ? '+' : ''}${change}%)`);
    return;
  }

  // Llistar tots els preus
  console.log('💲 Preus actuals dels packs\n');
  console.log('  Slug                   Preu     Original   Hores DJ   Convidats');
  console.log('  ─────────────────────  ───────  ─────────  ─────────  ─────────');

  for (const pack of packs) {
    const name = pack.translations[0]?.name || pack.slug;
    const original = pack.originalPrice ? `${pack.originalPrice}€` : '—';
    const guests = pack.maxGuests ? `${pack.minGuests || 0}–${pack.maxGuests}` : '—';
    console.log(`  ${(name + ' (' + pack.slug + ')').padEnd(23)} ${String(pack.price + '€').padEnd(8)} ${original.padEnd(10)} ${String(pack.djHours + 'h').padEnd(10)} ${guests}`);
  }

  console.log(`\n  Per canviar: npx tsx scripts/update-pack-prices.ts <slug> <nou_preu>`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
