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
// 3. PACKS PRINCIPALS — TEXT DIRECTE EN CATALÀ
// ============================================

const PACKS: PackDefinition[] = [
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
      "DJ professional durant 2 hores",
      "So potent 2000W per fer vibrar la pista",
      "Ambient de festa: llums, fum i cabina il·luminada",
      "Muntatge i desmuntatge sense maldecaps",
    ],
    ideal: "Ball final del casament, fins a 80 convidats",
    duration: "2h",
    durationHours: 2,
    capacidadMinima: 20,
    capacidadMaxima: 80,
  },
  {
    id: "bodas-premium",
    service: "bodas",
    slug: "bodas-premium",
    i18nBaseKey: "configurator.step2.packs.bodas-premium",
    name: "Premium",
    tagline: "Un espectacle de llums que els convidats recordaran",
    emotion: "Un espectacle de llums que els convidats recordaran",
    price: "500€",
    priceValue: 500,
    features: [
      "DJ professional durant 3 hores",
      "So d'alta potència 4000W EV",
      "Pont de llums amb 4 caps mòbils i fons negre",
      "Fum, cabina il·luminada i muntatge inclòs",
    ],
    ideal: "Ball amb show de llums, 60-150 convidats",
    duration: "3h",
    durationHours: 3,
    capacidadMinima: 60,
    capacidadMaxima: 150,
    popular: true,
    badge: "Més popular",
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
      "DJ + tècnic de llums tot el dia (6h: dinar → ball)",
      "So d'alta potència 4000W EV",
      "Pont de llums amb 4 caps mòbils i fons negre",
      "Primer ball entre núvols (fum baix) + cabina il·luminada",
    ],
    ideal: "Tot el casament, 100-300 convidats",
    duration: "6h",
    durationHours: 6,
    capacidadMinima: 100,
    capacidadMaxima: 300,
  },

  // ── DISCOMÒBIL / FESTES PRIVADES ─────────────────────
  {
    id: "disco-basico",
    service: "discomovil",
    slug: "disco-basico",
    i18nBaseKey: "services.mobile.discoPacks.disco-basico",
    name: "Bàsic",
    tagline: "La teva festa, el teu so — nosaltres posem la resta",
    emotion: "La teva festa, el teu so — nosaltres posem la resta",
    price: "250€",
    priceValue: 250,
    features: [
      "DJ professional durant 2 hores",
      "So potent 2000W per omplir la sala",
      "Ambient de festa: llums, fum i cabina il·luminada",
      "Muntatge i desmuntatge sense maldecaps",
    ],
    ideal: "Aniversaris, comiats, festes fins a 60 persones",
    duration: "2h",
    durationHours: 2,
    capacidadMinima: 20,
    capacidadMaxima: 60,
  },
  {
    id: "disco-completo",
    service: "discomovil",
    slug: "disco-completo",
    i18nBaseKey: "services.mobile.discoPacks.disco-completo",
    name: "Complet",
    tagline: "Una hora més i llums que transformen l'espai",
    price: "400€",
    priceValue: 400,
    features: [
      "DJ professional durant 3 hores",
      "So potent 2000W amb presència",
      "Pont de llums amb 4 caps mòbils i fons negre",
      "Fum, cabina il·luminada i muntatge inclòs",
    ],
    ideal: "Festes on vols un show de llums real",
    duration: "3h",
    durationHours: 3,
    popular: true,
    badge: "Més popular",
    capacidadMinima: 40,
    capacidadMaxima: 120,
  },
  {
    id: "disco-premium",
    service: "discomovil",
    slug: "disco-premium",
    i18nBaseKey: "services.mobile.discoPacks.disco-premium",
    name: "Premium",
    tagline: "La festa on ningú vol marxar",
    price: "600€",
    priceValue: 600,
    features: [
      "DJ professional durant 5 hores de festa non-stop",
      "So d'alta potència 4000W EV",
      "Pont de llums amb 4 caps mòbils i fons negre",
      "Efectes VIP: espurnes fredes, confeti i bombolles",
    ],
    ideal: "Festes grans, la nit sencera",
    duration: "5h",
    durationHours: 5,
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
    price: "250€",
    priceValue: 250,
    features: [
      "DJ ambient o fil musical durant 2 hores",
      "So professional 2000W",
      "Il·luminació elegant i cabina il·luminada",
      "Muntatge, desmuntatge i coordinació inclosos",
    ],
    ideal: "Còctels, inauguracions, networking",
    duration: "2h",
    durationHours: 2,
  },
  {
    id: "empresas-evento",
    service: "empresas",
    slug: "empresas-evento",
    i18nBaseKey: "configurator.step2.packs.empresas-evento",
    name: "Estàndard",
    tagline: "Presentació impecable, festa que la gent recorda",
    emotion: "Presentació impecable, festa que la gent recorda",
    price: "400€",
    priceValue: 400,
    features: [
      "DJ + tècnic durant 3 hores",
      "So professional 2000W + 2 micros sense fils",
      "Pont de llums amb 4 caps mòbils i fons negre",
      "Coordinació completa amb el venue",
    ],
    ideal: "Esdeveniments corporatius",
    duration: "3h",
    durationHours: 3,
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
    price: "600€",
    priceValue: 600,
    features: [
      "DJ + tècnic dedicat durant 5 hores",
      "So d'alta potència 4000W EV",
      "Pont de llums amb 4 caps mòbils i fons negre",
      "Efectes VIP + coordinació integral amb el venue",
    ],
    ideal: "Gales i esdeveniments d'alt nivell",
    duration: "5h",
    durationHours: 5,
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
} as const;

// ============================================
// 7. FUNCIONS API
// ============================================

export function getPacksByService(service: ServiceSlug): PackDefinition[] {
  if (service === 'fiestas' || service === 'discomovil') {
    return PACKS.filter(p => p.service === 'discomovil');
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
  const packs = getPacksByCapacity(guests, service);
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
  const discoMin = Math.min(...PACKS.filter(p => p.service === 'discomovil').map(p => p.priceValue));
  const bodasMin = Math.min(...PACKS.filter(p => p.service === 'bodas').map(p => p.priceValue));
  const empresasMin = Math.min(...PACKS.filter(p => p.service === 'empresas').map(p => p.priceValue));
  return `Festes i discomòbil des de ${discoMin}€, bodes des de ${bodasMin}€, empreses des de ${empresasMin}€. Tots els packs inclouen muntatge, desmuntatge i equip complet.`;
}
