/**
 * Sembra el catàleg de productes de Masquerade Events (Carlos Lucas Fernández)
 * com a productes de revenda del col·laborador, amb el nostre PVP canònic.
 *
 * Idempotent i segur: sincronitza per nom sense duplicar productes.
 *
 * Ús: node scripts/seed-masquerade-products.mjs
 */
import { PrismaClient } from '@prisma/client';
import { resellPrice } from '../lib/constants/pricing.ts';

const prisma = new PrismaClient();

const COLLABORATOR_ID = 'carlos-lucas-fernandez';
const IMG = '/img/collaborators/masquerade';
const INCLUDES = "Vestuari d'alta qualitat · Desplaçament inclòs · Disponible en català";
const CHILDREN_CATEGORY = 'Animació infantil';
const EXTRA_CATEGORY = 'Extra';

function productPrice(costPrice) {
  return resellPrice(costPrice);
}

const PRODUCTS = [
  {
    name: 'Animació temàtica',
    category: CHILDREN_CATEGORY,
    crew: 'Animador + tècnic de so',
    durationLabel: '1h',
    costPrice: 160,
    sellPrice: productPrice(160),
    imageUrl: `${IMG}/animacio-tematica.jpg`,
    description: "Els personatges més entranyables obren un món de màgia i color amb jocs, balls i música. És una animació dinàmica, pensada perquè els infants participin en una aventura adaptada a la seva edat. Els personatges disponibles es confirmen segons agenda.",
    includes: INCLUDES,
    sortOrder: 1,
  },
  {
    name: 'Animació amb personatge',
    category: CHILDREN_CATEGORY,
    crew: 'Animador + personatge + tècnic de so',
    durationLabel: '1h',
    costPrice: 250,
    sellPrice: productPrice(250),
    imageUrl: `${IMG}/animacio-personatge.jpg`,
    description: "Els infants coneixen els seus personatges preferits i els ajuden a través de balls, jocs i dinàmiques participatives. És un format proper, molt visual i pensat perquè els nens i nenes se sentin dins de la història.",
    includes: INCLUDES,
    sortOrder: 2,
  },
  {
    name: 'El secret dels pirates',
    category: CHILDREN_CATEGORY,
    crew: '2 actors + decoració + tècnic de so',
    durationLabel: '70 min',
    costPrice: 320,
    sellPrice: productPrice(320),
    imageUrl: `${IMG}/secret-pirates.jpg`,
    description: "A les profunditats del Mediterrani s'amaga l'illa Maragda i el tresor màgic de Poseidó. El capità William i la capitana Elissabeth tenen cadascun una part del mapa i hauran de decidir si competeixen o treballen junts. Un musical amb cançons en directe, balls i valors d'amistat i treball en equip.",
    includes: INCLUDES,
    sortOrder: 3,
  },
  {
    name: 'Pintacares professional',
    category: EXTRA_CATEGORY,
    crew: null,
    durationLabel: '1h',
    costPrice: 70,
    sellPrice: productPrice(70),
    imageUrl: null,
    description: "Extra contractable amb una animació infantil o familiar. Servei de pintacares professional per ampliar l'experiència de la festa.",
    includes: null,
    sortOrder: 4,
  },
  {
    name: 'Globoflèxia',
    category: EXTRA_CATEGORY,
    crew: null,
    durationLabel: null,
    costPrice: 40,
    sellPrice: productPrice(40),
    imageUrl: null,
    description: "Extra contractable amb una animació infantil o familiar. Globoflèxia en acabar l'espectacle perquè cada infant pugui marxar amb un record.",
    includes: null,
    sortOrder: 5,
  },
];

async function main() {
  // Assegura el col·laborador (sense trepitjar dades existents).
  const collaborator = await prisma.collaborator.upsert({
    where: { id: COLLABORATOR_ID },
    update: {},
    create: {
      id: COLLABORATOR_ID,
      name: 'Carlos Lucas Fernández',
      company: 'Masquerade Events',
      email: 'masqueradaeeventsbcn@gmail.com',
      phone: '691748306',
      specialty: 'Presentador / animació infantil',
      costPerHour: 100,
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
      await prisma.collaboratorProduct.update({
        where: { id: existing.id },
        data: p,
      });
    } else {
      await prisma.collaboratorProduct.create({ data: { collaboratorId: collaborator.id, ...p } });
    }
    const margin = p.sellPrice - p.costPrice;
    const pct = ((margin / p.costPrice) * 100).toFixed(0);
    const marginText = p.costPrice > 0
      ? `cost ${p.costPrice}€ → PVP ${p.sellPrice}€ (profit +${margin}€ / +${pct}% sobre cost)`
      : 'preu a consultar';
    console.log(`${existing ? '↻' : '✓'} ${p.name}: ${marginText}`);
  }

  const canonicalNames = PRODUCTS.map((p) => p.name);
  const obsolete = await prisma.collaboratorProduct.updateMany({
    where: {
      collaboratorId: COLLABORATOR_ID,
      name: { notIn: canonicalNames },
      isActive: true,
    },
    data: { isActive: false },
  });
  if (obsolete.count > 0) {
    console.log(`\n${obsolete.count} producte(s) antic(s) de Masquerade desactivat(s) perquè no surten al Word.`);
  }
  console.log(`\nFet. ${PRODUCTS.length} productes sincronitzats per a ${collaborator.name}.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
