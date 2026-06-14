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
const ADULTS_CATEGORY = 'Animació adulta';
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
    // Sinopsi adaptada literalment del dossier del proveïdor (to natural, en català).
    description: "Els nostres personatges més entranyables vénen a descobrir-te un nou món de màgia i de color. Una animació on els jocs i els balls són els protagonistes, en un xou totalment dinàmic i ple de música. Pregunta'ns pels personatges disponibles!",
    includes: INCLUDES,
    sortOrder: 1,
  },
  {
    name: 'Animació amb personatge',
    category: CHILDREN_CATEGORY,
    crew: 'Animador + 1 personatge + tècnic de so',
    durationLabel: '1h',
    costPrice: 250,
    sellPrice: productPrice(250),
    imageUrl: `${IMG}/animacio-personatge.jpg`,
    description: "T'agradaria conèixer els teus personatges preferits? Disney, Bluey, Patrulla Canina… amb nosaltres és possible! Gaudeix de les nostres animacions amb els vostres personatges favorits, en una vetllada on els haureu d'ajudar a través de balls i dinàmiques. Esteu a punt per ballar amb ells?",
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
    description: "Diuen les llegendes que a les profunditats del mar Mediterrani s'amaga l'illa Maragda, creada pel déu del mar, Poseidó. Allà, amagat sota la terra, hi ha el seu tresor: un tresor màgic que es transforma en allò que més desitja qui el troba. El capità William té el vent a favor per arribar-hi, però tot canvia quan es topa amb la capitana Elissabeth a l'illa i descobreix que ella guarda l'altra meitat del mapa. Arribaran a treballar junts o lluitaran per ser el pirata més ràpid? Un musical ple de cançons en directe, balls i música, on l'amistat i el treball en equip són els pilars de l'espectacle.",
    includes: INCLUDES,
    sortOrder: 3,
  },
  {
    name: 'Animació adults 1h',
    category: ADULTS_CATEGORY,
    crew: 'Animador',
    durationLabel: '1h',
    // Cost real del col·laborador (animador sol, 1 hora). PVP derivat amb el
    // helper canònic resellPrice (cost +20% arrodonit a múltiple de 5).
    costPrice: 160,
    sellPrice: productPrice(160),
    imageUrl: null,
    description: "Animació en directe pensada per al grup gran: conducció, jocs i dinàmiques participatives que mantenen el ritme de la festa sense parar-la. Un animador professional condueix l'estona perquè els adults s'hi impliquin i passin una bona estona.",
    includes: INCLUDES,
    sortOrder: 6,
  },
  {
    name: 'Pintacares professional',
    category: EXTRA_CATEGORY,
    crew: null,
    durationLabel: '1h',
    costPrice: 70,
    sellPrice: productPrice(70),
    imageUrl: null,
    description: "Pintacares professional per ampliar l'experiència de la festa. Es contracta amb una animació infantil o familiar.",
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
    description: "Globoflèxia en acabar l'espectacle perquè cada infant marxi amb un record. Es contracta amb una animació infantil o familiar.",
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
