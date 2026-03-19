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
    tagline: "Descompte exclusiu per a festes de fins a 50 convidats",
    price: "250€",
    priceValue: 250,
    priceOriginal: "450€",
    priceOriginalValue: 450,
    features: [
      "So PRO 4000W EV",
      "Il·luminació bàsica (multiefectes LED + focus LED)",
      "DJ professional 2 hores",
      "Màquina de fum",
      "Muntatge i desmuntatge inclosos",
    ],
    ideal: "Festes privades de fins a 50 convidats",
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
    tagline: "El ball del teu casament, amb so i llums professionals",
    emotion: "El ball del teu casament, amb so i llums professionals",
    price: "350€",
    priceValue: 350,
    features: [
      "DJ professional 2 hores",
      "So PRO 4000W EV",
      "Il·luminació bàsica (multiefectes LED + focus LED)",
      "Màquina de fum",
      "Muntatge i desmuntatge inclosos",
    ],
    ideal: "Casaments — ball final",
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
    tagline: "Ball amb espectacle de llums i efectes que marquen la diferència",
    emotion: "Ball amb espectacle de llums i efectes que marquen la diferència",
    price: "500€",
    priceValue: 500,
    features: [
      "DJ professional 3 hores",
      "So PRO 4000W EV + controladora Pioneer",
      "Il·luminació PRO (4 caps mòbils + multiefectes)",
      "Cabina DJ ampliada",
      "Màquina de fum",
      "Muntatge i desmuntatge inclosos",
    ],
    ideal: "Casaments — ball + espectacle",
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
    tagline: "Cerimònia, banquet i ball — tot el dia amb tu",
    emotion: "Cerimònia, banquet i ball — tot el dia amb tu",
    price: "1.000€",
    priceValue: 1000,
    features: [
      "DJ + TÈCNIC DE LLUMS (2 persones, 6 hores)",
      "Música cerimònia + còctel + banquet + ball",
      "So audiòfil 4000W EV ETX 2000W",
      "Show de llums sincronitzat (4 caps mòbils 150W LED)",
      "Efecte màquina de fum baix (Ball entre núvols)",
      "Muntatge i desmuntatge inclosos",
    ],
    ideal: "Casaments — dia complet",
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
    tagline: "La teva festa, el teu estil. Nosaltres la fem realitat",
    emotion: "La teva festa, el teu estil. Nosaltres la fem realitat",
    price: "350€",
    priceValue: 350,
    features: [
      "DJ professional 3 hores",
      "So PRO 4000W EV + controladora Pioneer",
      "Il·luminació PRO (4 caps mòbils + multiefectes)",
      "Màquina de fum",
      "Muntatge i desmuntatge inclosos",
    ],
    ideal: "Festes privades, aniversaris, celebracions",
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
    tagline: "Més durada i efectes per a festes que no paren",
    price: "400€",
    priceValue: 400,
    features: [
      "DJ professional 4 hores",
      "So PRO 4000W EV + controladora Pioneer",
      "Il·luminació PRO (4 caps mòbils + multiefectes)",
      "Màquina de fum",
      "Muntatge i desmuntatge inclosos",
    ],
    ideal: "Festes mitjanes amb ganes de ballar",
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
    tagline: "Màxima durada, efectes espectaculars i potència professional",
    price: "700€",
    priceValue: 700,
    features: [
      "DJ professional 6 hores",
      "So Club (4000W + subwoofer de reforç)",
      "Show de llums complet (caps mòbils)",
      "Efectes VIP (fum, bombolles, espurnes fredes, confeti)",
      "Cabina DJ Pro il·luminada",
    ],
    ideal: "Esdeveniments llargs o espais grans",
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
    tagline: "Professionalitat que reforça la teva marca",
    emotion: "Professionalitat que reforça la teva marca",
    price: "400€",
    priceValue: 400,
    features: [
      "DJ/Fil musical 4 hores",
      "So ambient nítid (EV ETX)",
      "Il·luminació estàtica decorativa",
      "Muntatge i desmuntatge inclosos",
    ],
    ideal: "Còctels corporatius",
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
    tagline: "Opció equilibrada per presentacions i festa",
    price: "500€",
    priceValue: 500,
    features: [
      "DJ professional 5 hores",
      "So 4000W EV + controladora Pioneer",
      "Il·luminació PRO (caps mòbils)",
      "Màquina de fum",
      "Muntatge i desmuntatge inclosos",
    ],
    ideal: "Esdeveniments corporatius complets",
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
    tagline: "Producció completa amb reforç tècnic",
    price: "1.400€",
    priceValue: 1400,
    features: [
      "Servei integral 6 hores",
      "DJ + tècnic de so dedicat",
      "So reforçat + microfonia avançada (4 micros)",
      "Disseny d'il·luminació corporativa",
      "Coordinació amb agència/venue",
      "Gravació d'àudio de l'esdeveniment",
      "Muntatge estètic impecable",
    ],
    ideal: "Gales corporatives",
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
  },
  {
    id: "micro-inalambric",
    name: "Micròfon sense fils",
    description: "Per a discursos, speeches o cerimònia",
    price: 30,
    icon: "🎤",
    category: "sound",
    compatibleWith: ["bodas", "discomovil", "fiestas", "empresas"],
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
