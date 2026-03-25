/**
 * SISTEMA DE PREUS ÒRBITA EVENTS
 * ================================
 *
 * REGLA D'OR: ZERO DADES HARDCODEJADES AL PROJECTE
 * Tot preu, duració, contingut de pack, equip... surt d'aquí.
 * Tots els noms i textos són en català directe (no claus i18n).
 *
 * La BD (model Pack/Extra) és la font de veritat si té dades.
 * Aquest fitxer serveix de fallback robust.
 */

// ============================================
// 1. INVENTARI REAL D'EQUIPAMENT
// ============================================

export const INVENTARIO = {
  controladora: {
    nombre: "Pioneer DDJ REV7",
    descripcion: "Controladora DJ professional",
  },
  altavoces: {
    nombre: "2x EV ETX 2000W",
    descripcion: "Amplificadors actius Electro-Voice",
    potenciaTotal: 4000,
    potenciaUnidad: 2000,
    cantidad: 2,
  },
  cabinaDJ: {
    nombre: "Cabina DJ Professional",
    descripcion: "Setup complet per al DJ",
  },
  iluminacion: {
    focosLED: {
      nombre: "2x Focus Bash LED",
      cantidad: 2,
    },
    multiefectos: {
      nombre: "Multiefectes LED",
      cantidad: 1,
    },
    cabezasMoviles: {
      nombre: "4x Caps Mòbils 150W LED",
      potenciaUnidad: 150,
      cantidad: 4,
    },
  },
  efectos: {
    maquinaHumo: {
      nombre: "Màquina de fum",
      incluido: true,
    },
  },

  extras: {
    humoBajo: {
      id: "humo-bajo",
      nombre: "Fum Baix",
      descripcion: "Efecte 'núvol' per al ball nupcial",
      precio: 150,
    },
    co2: {
      id: "co2-gun",
      nombre: "Canó CO2",
      descripcion: "Raig d'aire fred espectacular",
      precio: 200,
    },
    confetti: {
      id: "confetti",
      nombre: "Canó de Confeti",
      descripcion: "Explosió de color per a moments clau",
      precio: 100,
    },
    chispasFrias: {
      id: "fuego-frio",
      nombre: "Espurnes Fredes (2 màquines)",
      descripcion: "Efecte pirotècnic segur per a interior",
      precio: 150,
    },
    burbujas: {
      id: "burbujas",
      nombre: "Màquina de Bombolles",
      descripcion: "Toc màgic i divertit",
      precio: 50,
    },
  },
} as const;

// Helper per descriure l'equip de so
export function getDescripcionSonido(): string {
  const { altavoces, controladora } = INVENTARIO;
  return `${altavoces.cantidad}x ${altavoces.nombre.replace('2x ', '')} (${altavoces.potenciaTotal}W total) + ${controladora.nombre}`;
}

// Helper per descriure il·luminació bàsica
export function getDescripcionIluminacionBasica(): string {
  const { focosLED, multiefectos } = INVENTARIO.iluminacion;
  return `${multiefectos.nombre} + ${focosLED.nombre}`;
}

// Helper per descriure il·luminació PRO
export function getDescripcionIluminacionPRO(): string {
  const { cabezasMoviles } = INVENTARIO.iluminacion;
  return `${cabezasMoviles.cantidad} ${cabezasMoviles.nombre.replace('4x ', '')}`;
}

// ============================================
// 2. TIPUS I ESTRUCTURES
// ============================================

export type ServiceSlug = 'fiestas' | 'bodas' | 'discomovil' | 'empresas';

export const ALL_SERVICES: ServiceSlug[] = [
  'fiestas',
  'bodas',
  'discomovil',
  'empresas',
];

export type PackId = string;

export interface PackDefinition {
  id: string;
  service: ServiceSlug;
  slug: string;
  i18nBaseKey?: string;
  name: string;
  tagline: string;
  emotion?: string;
  price: string;
  priceValue: number;
  priceOriginal?: string | null;
  priceOriginalValue?: number | null;
  features: string[];
  ideal?: string;
  bestFor?: string;
  duration: string;
  durationHours: number;
  highlight?: boolean;
  popular?: boolean;
  badge?: string | null;
  cta?: string;
  lowCost?: boolean;
  extraHourPrice?: number;
  recommendedOperatorExtraHourPrice?: number;
  capacidadMinima?: number;
  capacidadMaxima?: number;
  isFlash?: boolean;
  flashDiscount?: number;
}

export interface ExtraDefinition {
  id: string;
  name: string;
  description: string;
  price: number | null;
  consultarPrecio?: boolean;
  icon: string;
  popular?: boolean;
  premium?: boolean;
  category?: 'effects' | 'visual' | 'time' | 'other' | 'sound' | 'lighting';
  compatibleWith?: ServiceSlug[];
  /** Si és false, l'extra no es mostra al configurador públic */
  enabled?: boolean;
}

// ============================================
// 3. CONFIGURACIÓ DE L'OFERTA FLASH
// ============================================

export const OFERTA_FLASH = {
  nombre: "Oferta Flash",
  descripcion: "Festes petites amb descompte exclusiu",
  maxInvitados: 50,
  descuentoPorcentaje: 44,
  duracionHoras: 2,
  disponible: true,
  condiciones: [
    "Vàlid per a festes de fins a 50 convidats",
    "Reserva amb mínim 15 dies d'antelació",
    "Subjecte a disponibilitat",
  ],
  opciones: {
    basica: { horas: 2, precio: 250 },
    extendida: { horas: 3, precio: 400 },
  },
  extras: [
    { id: "humo", nombre: "Màquina de fum", precio: 50 },
    { id: "burbujas", nombre: "Màquina de bombolles", precio: 50 },
    { id: "chispas", nombre: "Espurnes fredes", precio: 100 },
    { id: "cabina-led", nombre: "Cabina DJ il·luminada", precio: 75 },
  ],
} as const;

// ============================================
// 4. PACKS PRINCIPALS — TEXT DIRECTE EN CATALÀ
// ============================================

const PACKS: PackDefinition[] = [
  // ── OFERTA FLASH ──────────────────────────────────
  {
    id: "oferta-flash",
    service: "fiestas",
    slug: "oferta-flash",
    i18nBaseKey: "services.mobile.discoPacks.oferta-flash",
    name: "Oferta Flash",
    tagline: "La teva festa de sempre, ara amb so i llums de veritat",
    price: "250€",
    priceValue: 250,
    priceOriginal: "450€",
    priceOriginalValue: 450,
    features: [
      "DJ professional 2 hores — la música que us agrada, com ha de sonar",
      "So PRO 4000W que omple la sala",
      "Llums que creen l'ambient perfecte",
      "Màquina de fum per als moments especials",
      "Nosaltres ho muntem i ho desmontem tot",
    ],
    ideal: "Aniversaris i festes de fins a 50 convidats",
    duration: "2 hores",
    durationHours: OFERTA_FLASH.duracionHoras,
    badge: "🔥 OFERTA FLASH",
    isFlash: true,
    flashDiscount: OFERTA_FLASH.descuentoPorcentaje,
    capacidadMinima: 10,
    capacidadMaxima: OFERTA_FLASH.maxInvitados,
  },

  // ── BODES ─────────────────────────────────────────
  {
    id: "bodas-basico",
    service: "bodas",
    slug: "bodas-basico",
    i18nBaseKey: "configurator.step2.packs.bodas-basico",
    name: "Bàsic",
    tagline: "Que la pista no pari fins que vosaltres digueu",
    emotion: "Que la pista no pari fins que vosaltres digueu",
    price: "350€",
    priceValue: 350,
    features: [
      "DJ professional 2 hores de sessió de ball",
      "So professional 4000W que s'escolta i es sent",
      "Llums que creen ambient de festa",
      "Màquina de fum per als moments clau",
      "Nosaltres ho muntem i ho desmontem tot",
    ],
    ideal: "Per al ball final del vostre casament",
    duration: "2 hores",
    durationHours: 2,
    badge: null,
  },
  {
    id: "bodas-premium",
    service: "bodas",
    slug: "bodas-premium",
    i18nBaseKey: "configurator.step2.packs.bodas-premium",
    name: "Premium",
    tagline: "El vostre ball, amb un espectacle de llums que els convidats recordaran",
    emotion: "El vostre ball, amb un espectacle de llums que els convidats recordaran",
    price: "500€",
    priceValue: 500,
    features: [
      "DJ professional 3 hores per gaudir sense pressa",
      "So PRO 4000W EV + controladora Pioneer",
      "4 caps mòbils que segueixen el ritme de la música",
      "Cabina DJ ampliada — el centre de la festa",
      "Fum i efectes que fan que cada moment sigui especial",
      "Nosaltres ho muntem i ho desmontem tot",
    ],
    ideal: "Ball amb show de llums i efectes",
    duration: "3 hores",
    durationHours: 3,
    popular: true,
    badge: "EL MÉS ESCOLLIT",
  },
  {
    id: "bodas-luxury",
    service: "bodas",
    slug: "bodas-luxury",
    i18nBaseKey: "configurator.step2.packs.bodas-luxury",
    name: "Exclusiu",
    tagline: "Som amb vosaltres des del dinar fins a l'última cançó",
    emotion: "Som amb vosaltres des del dinar fins a l'última cançó",
    price: "1.000€",
    priceValue: 1000,
    features: [
      "DJ + Tècnic de llums dedicat (2 persones, 6 hores)",
      "Posem la música a cada pas: entrada dels nuvis, passes de plats i begudes, pastís, entregues, regals, entrada al ball i sessió completa",
      "So audiòfil 4000W — cada cançó sona com ha de sonar",
      "Show de llums sincronitzat amb la música (4 caps mòbils 150W)",
      "Fum baix per al primer ball — ballareu entre núvols",
      "Nosaltres ho muntem i ho desmontem tot",
    ],
    ideal: "Tot el casament, del dinar al ball",
    duration: "6 hores",
    durationHours: 6,
    badge: null,
  },

  // ── DISCOMÒBIL / FESTES ──────────────────────────────
  {
    id: "disco-basico",
    service: "discomovil",
    slug: "disco-basico",
    i18nBaseKey: "services.mobile.discoPacks.disco-basico",
    name: "Bàsic",
    tagline: "La teva festa, el teu so — nosaltres posem la resta",
    emotion: "La teva festa, el teu so — nosaltres posem la resta",
    price: "350€",
    priceValue: 350,
    features: [
      "DJ professional 3 hores — triem junts la música",
      "So PRO 4000W EV que s'escolta clar i net",
      "4 caps mòbils + multiefectes que transformen l'espai",
      "Màquina de fum per als moments clau",
      "Nosaltres ho muntem i ho desmontem tot",
    ],
    ideal: "Aniversaris, celebracions i festes privades",
    duration: "3 hores",
    durationHours: 3,
    badge: "Bàsic",
    capacidadMinima: 20,
    capacidadMaxima: 80,
  },
  {
    id: "disco-completo",
    service: "discomovil",
    slug: "disco-completo",
    i18nBaseKey: "services.mobile.discoPacks.disco-completo",
    name: "Complet",
    tagline: "Una hora més perquè les bones nits no s'acaben aviat",
    price: "400€",
    priceValue: 400,
    features: [
      "DJ professional 4 hores — sense mirar el rellotge",
      "So PRO 4000W EV + controladora Pioneer",
      "4 caps mòbils + multiefectes que creen ambient de club",
      "Màquina de fum per als millors moments",
      "Nosaltres ho muntem i ho desmontem tot",
    ],
    ideal: "Festes on vols que la nit no s'acabi",
    duration: "4 hores",
    durationHours: 4,
    popular: true,
    badge: "Més popular",
    capacidadMinima: 50,
    capacidadMaxima: 120,
  },
  {
    id: "disco-premium",
    service: "discomovil",
    slug: "disco-premium",
    i18nBaseKey: "services.mobile.discoPacks.disco-premium",
    name: "Premium",
    tagline: "La festa on ningú vol marxar",
    price: "700€",
    priceValue: 700,
    features: [
      "DJ professional 6 hores — tota la nit al teu servei",
      "So de club (4000W + subwoofer de reforç) — ho sentireu a tot el cos",
      "Show de llums complet amb caps mòbils sincronitzats",
      "Efectes VIP: fum, bombolles, espurnes fredes, confeti",
      "Cabina DJ Pro il·luminada — el centre de la festa",
    ],
    ideal: "Festes grans on vols que sigui inoblidable",
    duration: "6 hores",
    durationHours: 6,
    badge: "Premium",
    capacidadMinima: 80,
    capacidadMaxima: 200,
  },

  // ── EMPRESES ──────────────────────────────────────────
  {
    id: "empresas-cocktail",
    service: "empresas",
    slug: "empresas-cocktail",
    i18nBaseKey: "configurator.step2.packs.empresas-cocktail",
    name: "Còctel",
    tagline: "El detall sonor que fa que el teu còctel sigui diferent",
    emotion: "El detall sonor que fa que el teu còctel sigui diferent",
    price: "400€",
    priceValue: 400,
    features: [
      "Fil musical o DJ ambient 4 hores — posem el to just",
      "So nítid EV ETX que acompanya sense molestar",
      "Il·luminació decorativa que reforça l'ambient",
      "Nosaltres ho muntem i ho desmontem tot",
    ],
    ideal: "Còctels corporatius, inauguracions, networking",
    duration: "4 hores",
    durationHours: 4,
    badge: "Bàsic",
  },
  {
    id: "empresas-evento",
    service: "empresas",
    slug: "empresas-evento",
    i18nBaseKey: "configurator.step2.packs.empresas-evento",
    name: "Estàndard",
    tagline: "Presentació impecable, festa que la gent recorda",
    emotion: "Presentació impecable, festa que la gent recorda",
    price: "500€",
    priceValue: 500,
    features: [
      "DJ + tècnic 5 hores — cobrim presentació i festa",
      "So 4000W per discursos i música amb la mateixa nitidesa",
      "Il·luminació dinàmica amb caps mòbils",
      "2 micròfons sense fils per a intervencions",
      "Nosaltres ho muntem i ho desmontem tot",
    ],
    ideal: "Esdeveniments corporatius on vols quedar bé",
    duration: "5 hores",
    durationHours: 5,
    popular: true,
    badge: "Més popular",
  },
  {
    id: "empresas-gala",
    service: "empresas",
    slug: "empresas-gala",
    i18nBaseKey: "configurator.step2.packs.empresas-gala",
    name: "Gala",
    tagline: "Producció a un altre nivell — que la teva marca brilli",
    emotion: "Producció a un altre nivell — que la teva marca brilli",
    price: "1.400€",
    priceValue: 1400,
    features: [
      "Servei integral 6 hores amb DJ + tècnic de so dedicat",
      "So reforçat + microfonia avançada (4 micros)",
      "Disseny d'il·luminació corporativa a mida",
      "Coordinació directa amb agència o venue",
      "Gravació d'àudio de l'esdeveniment",
      "Muntatge estètic impecable — cuidem cada detall",
    ],
    ideal: "Gales i esdeveniments d'alt nivell",
    duration: "6 hores",
    durationHours: 6,
    badge: "Premium",
  },
];

// ============================================
// 5. EXTRAS — NOMÉS EL QUE TENIM
// ============================================

export const EXTRAS: ExtraDefinition[] = [
  {
    id: "hora-extra",
    name: "Hora Extra",
    description: "Si la festa continua, nosaltres també",
    price: 75,
    icon: "⏰",
    category: "time",
    compatibleWith: ["bodas", "discomovil", "fiestas", "empresas"],
    popular: true,
    enabled: false,
  },
  {
    id: "caps-mobils-extra",
    name: "Caps Mòbils Extra (x2)",
    description: "2 caps mòbils LED addicionals per ampliar la il·luminació",
    price: 120,
    icon: "💡",
    category: "lighting",
    compatibleWith: ["bodas", "discomovil", "fiestas", "empresas"],
    popular: true,
    enabled: false,
  },
  {
    id: "micro-inalambric",
    name: "Micròfon sense fils",
    description: "Per a discursos, speeches o cerimònia",
    price: 30,
    icon: "🎤",
    category: "sound",
    compatibleWith: ["bodas", "discomovil", "fiestas", "empresas"],
    enabled: false,
  },
];

// ============================================
// 6. OFERTES I DESCOMPTES
// ============================================

export const OFFERS = {
  earlyBird: {
    id: 'early-bird',
    name: 'Reserva Anticipada',
    discount: 10,
    minAmount: 800,
    description: 'Reserva avui i estalvia un 10% al teu pack',
    badge: '🔥 OFERTA LIMITADA',
  },
  combo: {
    id: 'combo-extras',
    name: 'Pack complet',
    discount: 10,
    minExtras: 2,
    description: 'Contracta els 2 extras i estalvia un 10%',
    badge: '💎 COMBO',
  },
  seasonal: {
    id: 'temporada-baixa',
    name: 'Descompte Temporada Baixa',
    discount: 10,
    months: [1, 2, 11],
    description: 'Esdeveniments en temporada baixa tenen descompte',
    badge: '📅 TEMPORADA',
  },
  flash: {
    id: 'oferta-flash',
    name: OFERTA_FLASH.nombre,
    discount: OFERTA_FLASH.descuentoPorcentaje,
    maxGuests: OFERTA_FLASH.maxInvitados,
    description: `Festes de fins a ${OFERTA_FLASH.maxInvitados} persones amb descompte exclusiu`,
    badge: '⚡ FLASH',
    condiciones: OFERTA_FLASH.condiciones,
  },
} as const;

// ============================================
// 7. FUNCIONS API
// ============================================

export function getPacksByService(service: ServiceSlug): PackDefinition[] {
  if (service === 'fiestas' || service === 'discomovil') {
    const discovilPacks = PACKS.filter(p => p.service === 'discomovil');
    const flashPack = PACKS.find(p => p.isFlash);
    return flashPack ? [flashPack, ...discovilPacks] : discovilPacks;
  }
  return PACKS.filter(p => p.service === service);
}

export function getMinPriceByService(service: ServiceSlug): number {
  const packs = getPacksByService(service);
  if (!packs.length) return 0;
  return Math.min(...packs.map(p => p.priceValue));
}

export function getAllPacks(): PackDefinition[] {
  return PACKS;
}

export function getPackById(id: string): PackDefinition | undefined {
  return PACKS.find(p => p.id === id);
}

export function getOfertaFlash(): PackDefinition | undefined {
  return PACKS.find(p => p.isFlash);
}

export function getPacksByCapacity(guests: number, service?: ServiceSlug): PackDefinition[] {
  const packs = service ? getPacksByService(service) : PACKS;
  return packs.filter(p => {
    if (!p.capacidadMinima && !p.capacidadMaxima) return true;
    const min = p.capacidadMinima || 0;
    const max = p.capacidadMaxima || Infinity;
    return guests >= min && guests <= max;
  });
}

export function getRecommendedPack(guests: number, service: ServiceSlug): PackDefinition | undefined {
  const packs = getPacksByCapacity(guests, service).filter(p => !p.isFlash);
  return packs.find(p => p.popular) || packs[0];
}

// ============================================
// 8. HELPERS PER A FAQS DINÀMIQUES
// ============================================

export function getFAQEquipamiento(): string {
  const { altavoces, controladora, iluminacion, efectos } = INVENTARIO;
  return `Muntatge complet: ${altavoces.cantidad} altaveus ${altavoces.nombre.replace('2x ', '')} (${altavoces.potenciaUnidad}W cadascun), ${iluminacion.cabezasMoviles.cantidad} ${iluminacion.cabezasMoviles.nombre.replace('4x ', '')}, ${iluminacion.multiefectos.nombre}, ${efectos.maquinaHumo.nombre}, controladora ${controladora.nombre}, micros professionals, DJ/tècnic dedicat TOTA la nit, coordinació prèvia. Muntatge en 45 min. Sense sorpreses ni extres ocults.`;
}

export function getFAQPreciosResumen(): string {
  const flash = PACKS.find(p => p.isFlash);
  const bodasMin = Math.min(...PACKS.filter(p => p.service === 'bodas').map(p => p.priceValue));
  const discoMin = Math.min(...PACKS.filter(p => p.service === 'discomovil').map(p => p.priceValue));
  const empresasMin = Math.min(...PACKS.filter(p => p.service === 'empresas').map(p => p.priceValue));
  return `Festes des de ${flash?.priceValue || 250}€ (Oferta Flash fins a ${OFERTA_FLASH.maxInvitados} convidats), discomòbil des de ${discoMin}€, bodes des de ${bodasMin}€, empreses des de ${empresasMin}€. Hora extra ${EXTRAS[0].price}€. Tots els packs inclouen muntatge, desmuntatge i equip complet.`;
}
