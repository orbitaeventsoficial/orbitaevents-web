/**
 * Sembra el catàleg de productes de Masquerade Events (Carlos Lucas Fernández)
 * com a productes de revenda del col·laborador, amb el nostre PVP canònic.
 *
 * Idempotent i segur: sincronitza per nom sense duplicar productes.
 *
 * Ús: node scripts/seed-masquerade-products.mjs
 */
import { PrismaClient } from '@prisma/client';
import { resellPrice, roundRecommendedSellingPrice } from '../lib/constants/pricing.ts';
import { getIncludedTravelOneWayKm } from '../lib/services/travelCost.ts';

const prisma = new PrismaClient();

const COLLABORATOR_ID = 'carlos-lucas-fernandez';
const IMG = '/img/collaborators/masquerade';
const BINGO_KIDS_IMG = '/img/portfolio/fiestas-infantiles/fiestas-infantiles-06.avif';
// Km inclosos canònics (font única: travelCost). Avui 20 km/sentit des de Granollers.
const INCLUDED_KM = getIncludedTravelOneWayKm();
const INCLUDES = `Vestuari d'alta qualitat · Desplaçament inclòs fins a ${INCLUDED_KM} km · Disponible en català`;
const CHILDREN_CATEGORY = 'Animació infantil';
const ADULTS_CATEGORY = 'Animació adulta';
const EXTRA_CATEGORY = 'Extra';

function productPrice(costPrice) {
  return resellPrice(costPrice);
}

function commercialProductPrice(costPrice) {
  return roundRecommendedSellingPrice(productPrice(costPrice));
}

const PRODUCTS = [
  {
    name: 'Animació temàtica',
    category: CHILDREN_CATEGORY,
    crew: 'Animador + tècnic de so',
    durationLabel: '1h',
    costPrice: 160,
    sellPrice: productPrice(160),
    imageUrl: `${IMG}/animacio-1-personatge.jpg`,
    // Sinopsi adaptada literalment del dossier del proveïdor (to natural, en català).
    description: "Els nostres personatges més entranyables vénen a descobrir-te un nou món de màgia i de color. Una animació on els jocs i els balls són els protagonistes, en un xou totalment dinàmic i ple de música. Pregunta'ns pels personatges disponibles!",
    includes: INCLUDES,
    sortOrder: 3,
  },
  {
    name: 'Bingo Musical KIDS',
    category: CHILDREN_CATEGORY,
    crew: 'Presentador + tècnic de so + equip propi',
    durationLabel: '1h',
    costPrice: 160,
    sellPrice: commercialProductPrice(160),
    imageUrl: BINGO_KIDS_IMG,
    description: "Versió infantil i familiar del Bingo Musical, especialment pensada per a nens i nenes de 6 a 12 anys i també per als pares. Una hora de música, joc i participació amb cançons enfocades al jovent actual, dinàmiques per a la mainada, dues línies i el bingo final. Manté l'energia del format gran però amb una durada més curta i un ritme adaptat a casals, escoles i festes familiars.",
    includes: `${INCLUDES} · Cartons i gomets de bingo · Dinàmiques infantils · Dues línies i bingo final`,
    isActive: true,
    visibleInDossier: true,
    visibleInBooking: true,
    sortOrder: 2,
  },
  {
    name: 'Animació amb personatge',
    category: CHILDREN_CATEGORY,
    crew: 'Animador + 1 personatge + tècnic de so',
    durationLabel: '1h',
    costPrice: 250,
    sellPrice: productPrice(250),
    imageUrl: `${IMG}/animacio-2-personatges.jpg`,
    description: "T'agradaria conèixer els teus personatges preferits? Disney, Bluey, Patrulla Canina… amb nosaltres és possible! Gaudeix de les nostres animacions amb els vostres personatges favorits, en una vetllada on els haureu d'ajudar a través de balls i dinàmiques. Esteu a punt per ballar amb ells?",
    includes: INCLUDES,
    sortOrder: 4,
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
    sortOrder: 5,
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
    name: 'Bingo Musical',
    category: ADULTS_CATEGORY,
    // Cost 200 = 160 presentador/equip + 40 tècnic de so. El configurador
    // detecta "tècnic de so" i el separa en una línia assignable a Òrbita o al
    // proveïdor, mantenint PVP i cost total invariants.
    crew: 'Presentador + tècnic de so + equip propi',
    durationLabel: '1h 30',
    // Cost real de Masquerade (recuperat de BD); PVP via resellPrice. isActive
    // explícit per reactivar-lo (el seed #956 l'havia desactivat: no era al Word).
    costPrice: 200,
    sellPrice: productPrice(200),
    imageUrl: `${IMG}/bingo-musical.jpg`,
    description: "Els temazos sonen des del primer minut, sempre des de la part que tothom reconeix, mentre el presentador porta l'energia. Cada participant té el seu cartró i els seus gomets; el joc acumula línies i, quan s'omplen, els guanyadors surten al davant per als reptes musicals. Tres rondes, cada cop diferent, mentre el públic canta i anima fins que algú canta bingo.",
    includes: INCLUDES,
    isActive: true,
    sortOrder: 10,
  },
  {
    name: 'Batalla Musical',
    category: ADULTS_CATEGORY,
    // Mateixa estructura que Bingo: producte client complet, tècnic assignable.
    crew: 'Presentador + tècnic de so + equip propi',
    durationLabel: '1h 30',
    costPrice: 200,
    sellPrice: productPrice(200),
    imageUrl: `${IMG}/batalla-musical.jpg`,
    description: "Hora i mitja de competició musical. Els participants es divideixen en equips i s'enfronten en reptes: karaoke col·lectiu, endevina la cançó, ball, preguntes musicals, concurs de talent… Cada repte suma punts i, al final, un sol equip s'emporta la Batalla Musical. Qui no vulgui competir pot fer de jurat.",
    includes: INCLUDES,
    isActive: true,
    sortOrder: 11,
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
    sortOrder: 7,
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
    sortOrder: 8,
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
    data: { isActive: false, visibleInDossier: false, visibleInBooking: false },
  });
  if (obsolete.count > 0) {
    console.log(`\n${obsolete.count} producte(s) antic(s) de Masquerade desactivat(s) perquè no surten al Word.`);
  }
  console.log(`\nFet. ${PRODUCTS.length} productes sincronitzats per a ${collaborator.name}.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
