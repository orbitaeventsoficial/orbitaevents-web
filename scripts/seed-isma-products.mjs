/**
 * Manté Isma com a liquidació interna de so DJ, no com a producte seleccionable.
 *
 * Model:
 * - El client compra DJ a preu tancat.
 * - 50€ d'aquest preu es liquiden a Isma pels altaveus.
 * - Isma no apareix al catàleg de proveïdors/productes del configurador.
 *
 * Ús: node scripts/seed-isma-products.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COLLABORATOR_ID = 'isma-lloguer-altaveus';

const PRODUCTS = [
  {
    name: 'Lloguer altaveus DJ',
    category: 'Cost intern DJ',
    crew: null,
    durationLabel: 'bolo',
    costPrice: 50,
    sellPrice: 0,
    imageUrl: null,
    description: 'Liquidació interna: 50€ del preu DJ corresponen al so d’Isma. No es mostra com a producte seleccionable.',
    includes: 'So inclòs dins el servei DJ',
    sortOrder: 1,
    isActive: false,
    visibleInDossier: false,
    visibleInBooking: false,
  },
];

async function main() {
  const collaborator = await prisma.collaborator.upsert({
    where: { id: COLLABORATOR_ID },
    update: {
      name: 'Isma',
      company: 'Isma — so DJ inclòs',
      specialty: 'Altaveus inclosos dins el preu DJ',
      roles: ['EQUIPMENT_RENTAL'],
      isActive: true,
    },
    create: {
      id: COLLABORATOR_ID,
      name: 'Isma',
      company: 'Isma — so DJ inclòs',
      specialty: 'Altaveus inclosos dins el preu DJ',
      roles: ['EQUIPMENT_RENTAL'],
      commissionPct: 0,
      isActive: true,
    },
  });

  for (const product of PRODUCTS) {
    const existing = await prisma.collaboratorProduct.findFirst({
      where: { collaboratorId: collaborator.id, name: product.name },
      select: { id: true },
    });
    if (existing) {
      await prisma.collaboratorProduct.update({ where: { id: existing.id }, data: product });
    } else {
      await prisma.collaboratorProduct.create({ data: { collaboratorId: collaborator.id, ...product } });
    }
    console.log(`${existing ? '↻' : '✓'} ${product.name}: retirat del catàleg; liquidació interna ${product.costPrice}€`);
  }

  const canonicalNames = PRODUCTS.map((product) => product.name);
  const obsolete = await prisma.collaboratorProduct.updateMany({
    where: { collaboratorId: collaborator.id, name: { notIn: canonicalNames }, isActive: true },
    data: { isActive: false, visibleInDossier: false, visibleInBooking: false },
  });
  if (obsolete.count > 0) {
    console.log(`${obsolete.count} producte(s) antic(s) d'Isma desactivat(s).`);
  }
  console.log(`Fet. ${collaborator.name} queda fora del catàleg seleccionable; la liquidació viu dins el preu DJ.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
