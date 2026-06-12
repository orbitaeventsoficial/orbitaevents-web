/**
 * Sembra el catàleg de material de lloguer de Tino com a productes de revenda
 * del col·laborador, amb el nostre PVP canònic (resellPrice del cost de lloguer).
 *
 * Model: Tino lloga el material; l'operari sempre és Òrbita. El material
 * s'arrossega al bolo amb el seu cost de lloguer (= costPrice) i un PVP al client.
 *
 * Idempotent i segur: sincronitza per nom sense duplicar. L'aplica el propietari.
 * Ús: npx tsx scripts/seed-tino-products.ts
 */
import { PrismaClient } from '@prisma/client';
import { resellPrice } from '../lib/constants/pricing';

const prisma = new PrismaClient();

const COLLABORATOR_ID = 'tino-lloguer';
const CATEGORY = 'Lloguer de material';

function productPrice(costPrice: number): number {
  return resellPrice(costPrice);
}

const PRODUCTS = [
  {
    name: 'Fum baix 2500 W',
    category: CATEGORY,
    crew: null,
    durationLabel: null,
    costPrice: 60,
    sellPrice: productPrice(60),
    imageUrl: null,
    description: 'Màquina de fum baix de 2500 W. Omple una sala de fins a 100 pax.',
    includes: 'Màquina de fum + líquid de fum + aigua destil·lada',
    sortOrder: 1,
  },
  {
    name: 'Xispes fredes (2 màquines)',
    category: CATEGORY,
    crew: null,
    durationLabel: null,
    costPrice: 250,
    sellPrice: productPrice(250),
    imageUrl: null,
    description: 'Dues màquines de xispes fredes per a moments clau (entrada, pastís, primer ball).',
    includes: '2 màquines + 1 sobre de consumible (el sobre val 60 €, ja inclòs en el preu)',
    sortOrder: 2,
  },
  {
    name: 'Micròfon Shure',
    category: CATEGORY,
    crew: null,
    durationLabel: null,
    costPrice: 30,
    sellPrice: productPrice(30),
    imageUrl: null,
    description: 'Micròfon Shure de lloguer per a discursos, presentacions o cerimònia.',
    includes: null,
    sortOrder: 3,
  },
];

async function main() {
  const collaborator = await prisma.collaborator.upsert({
    where: { id: COLLABORATOR_ID },
    update: {},
    create: {
      id: COLLABORATOR_ID,
      name: 'Tino',
      company: 'Tino — lloguer de material',
      specialty: 'Lloguer de material tècnic',
      roles: ['EQUIPMENT_RENTAL', 'PROVIDER'],
      commissionPct: 0,
      isActive: true,
    },
  });

  for (const p of PRODUCTS) {
    const existing = await prisma.collaboratorProduct.findFirst({
      where: { collaboratorId: COLLABORATOR_ID, name: p.name },
      select: { id: true },
    });
    if (existing) {
      await prisma.collaboratorProduct.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.collaboratorProduct.create({ data: { collaboratorId: collaborator.id, ...p } });
    }
    const margin = p.sellPrice - p.costPrice;
    const pct = ((margin / p.costPrice) * 100).toFixed(0);
    console.log(`${existing ? '↻' : '✓'} ${p.name}: cost ${p.costPrice}€ → PVP ${p.sellPrice}€ (profit +${margin}€ / +${pct}%)`);
  }

  const canonicalNames = PRODUCTS.map((p) => p.name);
  const obsolete = await prisma.collaboratorProduct.updateMany({
    where: { collaboratorId: COLLABORATOR_ID, name: { notIn: canonicalNames }, isActive: true },
    data: { isActive: false },
  });
  if (obsolete.count > 0) {
    console.log(`\n${obsolete.count} producte(s) antic(s) de Tino desactivat(s).`);
  }
  console.log(`\nFet. ${PRODUCTS.length} productes sincronitzats per a ${collaborator.name}.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
