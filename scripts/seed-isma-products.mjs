/**
 * Sembra el catàleg intern d'Isma com a lloguer d'equip per a bolos DJ.
 *
 * Model:
 * - visibleInBooking=true: es pot afegir al configurador de bolo per imputar cost real.
 * - visibleInDossier=false: no és un capítol comercial del client; el client compra DJ.
 * - sellPrice=0 i costPrice=50: descompon el marge del DJ sense inflar el pressupost.
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
    description: 'Cost intern de lloguer dels altaveus d’Isma quan el servei DJ necessita equip de so extern. No es mostra com a producte del dossier.',
    includes: 'Altaveus per al servei DJ',
    sortOrder: 1,
    isActive: true,
    visibleInDossier: false,
    visibleInBooking: true,
  },
];

async function main() {
  const collaborator = await prisma.collaborator.upsert({
    where: { id: COLLABORATOR_ID },
    update: {
      name: 'Isma',
      company: 'Isma — lloguer altaveus',
      specialty: 'Lloguer d’altaveus per a DJ',
      roles: ['EQUIPMENT_RENTAL', 'PROVIDER'],
      isActive: true,
    },
    create: {
      id: COLLABORATOR_ID,
      name: 'Isma',
      company: 'Isma — lloguer altaveus',
      specialty: 'Lloguer d’altaveus per a DJ',
      roles: ['EQUIPMENT_RENTAL', 'PROVIDER'],
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
    console.log(`${existing ? '↻' : '✓'} ${product.name}: cost intern ${product.costPrice}€, PVP client ${product.sellPrice}€`);
  }

  const canonicalNames = PRODUCTS.map((product) => product.name);
  const obsolete = await prisma.collaboratorProduct.updateMany({
    where: { collaboratorId: collaborator.id, name: { notIn: canonicalNames }, isActive: true },
    data: { isActive: false },
  });
  if (obsolete.count > 0) {
    console.log(`${obsolete.count} producte(s) antic(s) d'Isma desactivat(s).`);
  }
  console.log(`Fet. ${PRODUCTS.length} productes sincronitzats per a ${collaborator.name}.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
