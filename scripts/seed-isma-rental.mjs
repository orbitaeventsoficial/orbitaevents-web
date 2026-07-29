// scripts/seed-isma-rental.mjs
// Modela la realitat del so (propietari, 2026-06-28):
//  - Els EV ETX-12P són un DESIG futur (encara NO comprats) → fora dels packs + RETIRED.
//  - 50€ del preu DJ es liquiden a ISMA pels altaveus → es resta al marge.
// Idempotent. Isma no és producte seleccionable: la liquidació viu dins el servei DJ.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Col·laborador Isma (liquidació interna d'altaveus)
  let isma = await prisma.collaborator.findFirst({ where: { name: 'Isma' } });
  if (!isma) {
    isma = await prisma.collaborator.create({
      data: {
        name: 'Isma',
        company: 'Isma - so DJ inclòs',
        specialty: "Altaveus inclosos dins el preu DJ",
        roles: ['EQUIPMENT_RENTAL'],
        pricingModel: 'DISCOUNT',
        commissionPct: 0,
        notes: '50€ del preu DJ es liquiden a Isma pels altaveus. No es ven com a producte extra del client. Substitueix el somni dels EV ETX-12P (encara no comprats).',
        isActive: true,
        isFavorite: true,
      },
    });
    console.log(`✅ Col·laborador Isma creat: ${isma.id}`);
  } else {
    console.log(`⏭️  Isma ja existeix: ${isma.id}`);
    await prisma.collaborator.update({
      where: { id: isma.id },
      data: {
        company: 'Isma - so DJ inclòs',
        specialty: "Altaveus inclosos dins el preu DJ",
        roles: (isma.roles || []).filter((role) => role !== 'PROVIDER').includes('EQUIPMENT_RENTAL')
          ? (isma.roles || []).filter((role) => role !== 'PROVIDER')
          : ['EQUIPMENT_RENTAL'],
        notes: '50€ del preu DJ es liquiden a Isma pels altaveus. No es ven com a producte extra del client. Substitueix el somni dels EV ETX-12P (encara no comprats).',
      },
    });
    console.log('↻ Isma queda com a liquidació interna, fora de proveïdors seleccionables.');
  }

  // 2. EV ETX-12P → desig futur: fora dels packs + RETIRED
  const evs = await prisma.inventoryItem.findMany({ where: { code: { in: ['ALT-001', 'ALT-002'] } }, select: { id: true, code: true } });
  for (const ev of evs) {
    await prisma.packInventory.deleteMany({ where: { itemId: ev.id } });
    await prisma.inventoryItem.update({
      where: { id: ev.id },
      data: {
        status: 'RETIRED',
        notes: 'DESIG/FUTUR - encara NO comprat. Ara 50€ del preu DJ es liquiden a Isma pels altaveus. Reactivar (status AVAILABLE + tornar als packs) quan es compri. Preu referència nou: ~1.444€.',
      },
    });
    console.log(`✅ ${ev.code} → fora dels packs + marcat FUTUR`);
  }

  console.log('\nNota: 50€ del preu DJ es liquiden a Isma; no és un producte extra del client.');
  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
