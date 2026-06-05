/**
 * Sembra el catàleg de productes de Masquerade Events (Carlos Lucas Fernández)
 * com a productes de revenda del col·laborador, amb el nostre marge (PVP).
 *
 * Idempotent i segur: si el col·laborador ja té productes, NO els toca
 * (per no sobreescriure edicions de preu fetes des de l'admin).
 *
 * Ús: node scripts/seed-masquerade-products.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COLLABORATOR_ID = 'carlos-lucas-fernandez';
const IMG = '/img/collaborators/masquerade';
const INCLUDES = "Vestuari d'alta qualitat · Desplaçament inclòs · Disponible en català";
const DEFAULT_MARKUP = 0.20;

function sellPrice(costPrice) {
  return Math.round(costPrice * (1 + DEFAULT_MARKUP));
}

const PRODUCTS = [
  {
    name: 'Animació temàtica',
    category: 'Animació infantil',
    crew: 'Animador + tècnic de so',
    durationLabel: '1h',
    costPrice: 160,
    sellPrice: sellPrice(160),
    imageUrl: `${IMG}/animacio-tematica.jpg`,
    description: 'Els nostres personatges més entranyables venen a ensenyar un nou món de màgia i color. Jocs, balls i música en un show totalment dinàmic. Pregunta pels personatges disponibles.',
    includes: INCLUDES,
    sortOrder: 1,
  },
  {
    name: 'Animació amb personatge',
    category: 'Animació infantil',
    crew: 'Animador + 1 personatge + tècnic de so',
    durationLabel: '1h',
    costPrice: 250,
    sellPrice: sellPrice(250),
    imageUrl: `${IMG}/animacio-personatge.jpg`,
    description: 'Coneix els personatges preferits dels més petits (Disney, Bluey, Patrulla Canina…). Una vetllada on ajudareu els personatges a través de balls i dinàmiques.',
    includes: INCLUDES,
    sortOrder: 2,
  },
  {
    name: 'El secret dels pirates',
    category: 'Musical',
    crew: '2 actors + decoració + tècnic de so',
    durationLabel: '70 min',
    costPrice: 320,
    sellPrice: sellPrice(320),
    imageUrl: `${IMG}/secret-pirates.jpg`,
    description: "Un musical carregat de cançons en directe, balls i música. L'illa Maragda i el tresor de Poseidó, la lluita entre el capità William i la capitana Elissabeth. Valors d'amistat i treball en equip.",
    includes: INCLUDES,
    sortOrder: 3,
  },
  {
    name: 'Pintacares professional',
    category: 'Extra',
    crew: null,
    durationLabel: '1h',
    costPrice: 70,
    sellPrice: sellPrice(70),
    imageUrl: null,
    description: 'Pintacares professional per complementar qualsevol espectacle.',
    includes: null,
    sortOrder: 4,
  },
  {
    name: 'Globoflèxia',
    category: 'Extra',
    crew: null,
    durationLabel: null,
    costPrice: 40,
    sellPrice: sellPrice(40),
    imageUrl: null,
    description: 'Globoflèxia al finalitzar el show.',
    includes: null,
    sortOrder: 5,
  },
  {
    name: 'Bingo musical',
    category: 'Bingo',
    crew: 'Presentador + equip propi (so a part)',
    durationLabel: '1h 30',
    costPrice: 160,
    sellPrice: sellPrice(160),
    imageUrl: null,
    description: 'El bingo que es juga cantant, ballant i rient amb tothom. Carlos hi ve amb equip propi. El tècnic de so va a part (+40€). Ideal per a sopars d\'empresa, festes populars i aniversaris.',
    includes: INCLUDES,
    sortOrder: 6,
  },
  {
    name: 'Tècnic de so (bingo)',
    category: 'Extra',
    crew: null,
    durationLabel: null,
    costPrice: 40,
    sellPrice: sellPrice(40),
    imageUrl: null,
    description: 'So per al bingo musical. Normalment el cobreix Òrbita (ingrés propi com a tècnic); si no pots, va un tercer (cost 40€).',
    includes: null,
    sortOrder: 7,
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
    console.log(`${existing ? '↻' : '✓'} ${p.name}: cost ${p.costPrice}€ → PVP ${p.sellPrice}€ (profit +${margin}€ / +${pct}% sobre cost)`);
  }
  console.log(`\nFet. ${PRODUCTS.length} productes sincronitzats per a ${collaborator.name}.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
