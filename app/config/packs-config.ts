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

import { DJ_EXTRA_HOUR_PRICE, djPriceForHours } from '@/lib/constants/orbita-services';

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
      precio: 75,
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
      precio: 350,
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

export type ServiceSlug = 'fiestas' | 'bodas' | 'discomovil' | 'empresas' | 'animacion';

export const ALL_SERVICES: ServiceSlug[] = [
  'fiestas',
  'bodas',
  'discomovil',
  'empresas',
  'animacion',
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

// Regla de preu unificada (propietari 2026-06-11): MATEIX preu per a tothom (bodes,
// empreses, festes...). La VERITAT ABSOLUTA viu a lib/constants/orbita-services.ts
// (DJ 1a hora 150 + 100/hora). Aquí NO es repeteixen números: el preu base es DERIVA.
export const PACK_EXTRA_HOUR_PRICE = DJ_EXTRA_HOUR_PRICE;

// Serveis amb preu derivat de la regla DJ (per hores). L'animació té preu propi (Masquerade).
const DJ_PRICED_SERVICES: ServiceSlug[] = ['bodas', 'discomovil', 'empresas', 'fiestas'];

const RAW_PACKS: PackDefinition[] = [
  // ── BODES ─────────────────────────────────────────
  {
    id: "bodas-basico",
    service: "bodas",
    slug: "bodas-basico",
    i18nBaseKey: "configurator.step2.packs.bodas-basico",
    name: "configurator.step2.packs.bodas-basico.name",
    tagline: "configurator.step2.packs.bodas-basico.tagline",
    emotion: "configurator.step2.packs.bodas-basico.tagline",
    price: "250€",
    priceValue: 250,
    features: [
      "configurator.step2.packs.bodas-basico.features.f1",
      "configurator.step2.packs.bodas-basico.features.f2",
      "configurator.step2.packs.bodas-basico.features.f3",
      "configurator.step2.packs.bodas-basico.features.f4",
      "configurator.step2.packs.bodas-basico.features.f5",
    ],
    ideal: "configurator.step2.packs.bodas-basico.ideal",
    duration: "2h",
    durationHours: 2,
    extraHourPrice: PACK_EXTRA_HOUR_PRICE,
    capacidadMinima: 20,
    capacidadMaxima: 80,
  },
  {
    id: "bodas-premium",
    service: "bodas",
    slug: "bodas-premium",
    i18nBaseKey: "configurator.step2.packs.bodas-premium",
    name: "configurator.step2.packs.bodas-premium.name",
    tagline: "configurator.step2.packs.bodas-premium.tagline",
    emotion: "configurator.step2.packs.bodas-premium.tagline",
    price: "550€",
    priceValue: 550,
    features: [
      "configurator.step2.packs.bodas-premium.features.f1",
      "configurator.step2.packs.bodas-premium.features.f2",
      "configurator.step2.packs.bodas-premium.features.f3",
      "configurator.step2.packs.bodas-premium.features.f4",
      "configurator.step2.packs.bodas-premium.features.f5",
      "configurator.step2.packs.bodas-premium.features.f6",
    ],
    ideal: "configurator.step2.packs.bodas-premium.ideal",
    duration: "5h",
    durationHours: 5,
    extraHourPrice: PACK_EXTRA_HOUR_PRICE,
    capacidadMinima: 60,
    capacidadMaxima: 150,
    popular: true,
    badge: "packsBadges.mostPopular",
  },

  // ── DISCOMÒBIL / FESTES PRIVADES ─────────────────────
  {
    id: "disco-basico",
    service: "discomovil",
    slug: "disco-basico",
    i18nBaseKey: "services.mobile.discoPacks.disco-basico",
    name: "services.mobile.discoPacks.disco-basico.name",
    tagline: "services.mobile.discoPacks.disco-basico.tagline",
    emotion: "services.mobile.discoPacks.disco-basico.tagline",
    price: "250€",
    priceValue: 250,
    features: [
      "services.mobile.discoPacks.disco-basico.features.f1",
      "services.mobile.discoPacks.disco-basico.features.f2",
      "services.mobile.discoPacks.disco-basico.features.f3",
      "services.mobile.discoPacks.disco-basico.features.f4",
      "services.mobile.discoPacks.disco-basico.features.f5",
    ],
    ideal: "services.mobile.discoPacks.disco-basico.ideal",
    duration: "2h",
    durationHours: 2,
    extraHourPrice: PACK_EXTRA_HOUR_PRICE,
    capacidadMinima: 20,
    capacidadMaxima: 60,
  },
  {
    id: "bingo-musical",
    service: "animacion",
    slug: "bingo-musical",
    i18nBaseKey: "services.mobile.discoPacks.bingo-musical",
    name: "services.mobile.discoPacks.bingo-musical.name",
    tagline: "services.mobile.discoPacks.bingo-musical.tagline",
    emotion: "services.mobile.discoPacks.bingo-musical.tagline",
    // Preu de client = cervell econòmic (cost partner 200 × markup 20% — SUBCONTRACTED_MARKUP_TARGET_PCT)
    price: "240€",
    priceValue: 240,
    features: [
      "services.mobile.discoPacks.bingo-musical.features.f1",
      "services.mobile.discoPacks.bingo-musical.features.f2",
      "services.mobile.discoPacks.bingo-musical.features.f3",
      "services.mobile.discoPacks.bingo-musical.features.f4",
      "services.mobile.discoPacks.bingo-musical.features.f5",
    ],
    ideal: "services.mobile.discoPacks.bingo-musical.ideal",
    duration: "1h 30min",
    durationHours: 1.5,
    highlight: true,
    popular: true,
    badge: "packsBadges.animationFeatured",
    capacidadMinima: 15,
    capacidadMaxima: 160,
  },
  {
    id: "batalla-musical",
    service: "animacion",
    slug: "batalla-musical",
    i18nBaseKey: "services.mobile.discoPacks.batalla-musical",
    name: "services.mobile.discoPacks.batalla-musical.name",
    tagline: "services.mobile.discoPacks.batalla-musical.tagline",
    emotion: "services.mobile.discoPacks.batalla-musical.tagline",
    // Preu de client = cervell econòmic (cost partner 200 × markup 20% — SUBCONTRACTED_MARKUP_TARGET_PCT)
    price: "240€",
    priceValue: 240,
    features: [
      "services.mobile.discoPacks.batalla-musical.features.f1",
      "services.mobile.discoPacks.batalla-musical.features.f2",
      "services.mobile.discoPacks.batalla-musical.features.f3",
      "services.mobile.discoPacks.batalla-musical.features.f4",
      "services.mobile.discoPacks.batalla-musical.features.f5",
    ],
    ideal: "services.mobile.discoPacks.batalla-musical.ideal",
    duration: "1h 30min",
    durationHours: 1.5,
    highlight: true,
    badge: "packsBadges.animationFeatured",
    capacidadMinima: 15,
    capacidadMaxima: 160,
  },
  {
    id: "disco-premium",
    service: "discomovil",
    slug: "disco-premium",
    i18nBaseKey: "services.mobile.discoPacks.disco-premium",
    name: "services.mobile.discoPacks.disco-premium.name",
    tagline: "services.mobile.discoPacks.disco-premium.tagline",
    price: "550€",
    priceValue: 550,
    features: [
      "services.mobile.discoPacks.disco-premium.features.f1",
      "services.mobile.discoPacks.disco-premium.features.f2",
      "services.mobile.discoPacks.disco-premium.features.f3",
      "services.mobile.discoPacks.disco-premium.features.f4",
      "services.mobile.discoPacks.disco-premium.features.f5",
    ],
    ideal: "services.mobile.discoPacks.disco-premium.ideal",
    duration: "5h",
    durationHours: 5,
    extraHourPrice: PACK_EXTRA_HOUR_PRICE,
    badge: "packsBadges.premium",
    capacidadMinima: 80,
    capacidadMaxima: 200,
  },

  // ── EMPRESES ──────────────────────────────────────────
  {
    id: "empresas-cocktail",
    service: "empresas",
    slug: "empresas-cocktail",
    i18nBaseKey: "configurator.step2.packs.empresas-cocktail",
    name: "configurator.step2.packs.empresas-cocktail.name",
    tagline: "configurator.step2.packs.empresas-cocktail.tagline",
    emotion: "configurator.step2.packs.empresas-cocktail.tagline",
    price: "250€",
    priceValue: 250,
    features: [
      "configurator.step2.packs.empresas-cocktail.features.f1",
      "configurator.step2.packs.empresas-cocktail.features.f2",
      "configurator.step2.packs.empresas-cocktail.features.f3",
      "configurator.step2.packs.empresas-cocktail.features.f4",
      "configurator.step2.packs.empresas-cocktail.features.f5",
    ],
    ideal: "configurator.step2.packs.empresas-cocktail.ideal",
    duration: "2h",
    durationHours: 2,
    extraHourPrice: PACK_EXTRA_HOUR_PRICE,
  },
  {
    id: "empresas-gala",
    service: "empresas",
    slug: "empresas-gala",
    i18nBaseKey: "configurator.step2.packs.empresas-gala",
    name: "configurator.step2.packs.empresas-gala.name",
    tagline: "configurator.step2.packs.empresas-gala.tagline",
    emotion: "configurator.step2.packs.empresas-gala.tagline",
    price: "550€",
    priceValue: 550,
    features: [
      "configurator.step2.packs.empresas-gala.features.f1",
      "configurator.step2.packs.empresas-gala.features.f2",
      "configurator.step2.packs.empresas-gala.features.f3",
      "configurator.step2.packs.empresas-gala.features.f4",
      "configurator.step2.packs.empresas-gala.features.f5",
      "configurator.step2.packs.empresas-gala.features.f6",
    ],
    ideal: "configurator.step2.packs.empresas-gala.ideal",
    duration: "5h",
    durationHours: 5,
    extraHourPrice: PACK_EXTRA_HOUR_PRICE,
    badge: "packsBadges.premium",
  },

];

// Els packs de serveis DJ DERIVEN el preu de la regla canònica (djPriceForHours):
// el valor numèric viu a un sol lloc. L'animació (Masquerade) manté el seu preu propi.
const PACKS: PackDefinition[] = RAW_PACKS.map((p) => {
  if (!DJ_PRICED_SERVICES.includes(p.service)) return p;
  const derived = djPriceForHours(p.durationHours);
  return { ...p, priceValue: derived, price: `${derived}€` };
});

// ============================================
// 5. EXTRAS — NOMÉS EL QUE TENIM
// ============================================

export const EXTRAS: ExtraDefinition[] = [
  {
    id: "hora-extra",
    name: "services.mobile.extras.hora-extra.name",
    description: "services.mobile.extras.hora-extra.description",
    price: 75,
    icon: "⏰",
    category: "time",
    compatibleWith: ["bodas", "discomovil", "fiestas", "empresas"],
    popular: true,
    enabled: false,
  },
  {
    id: "caps-mobils-extra",
    name: "services.mobile.extras.caps-mobils-extra.name",
    description: "services.mobile.extras.caps-mobils-extra.description",
    price: 120,
    icon: "💡",
    category: "lighting",
    compatibleWith: ["bodas", "discomovil", "fiestas", "empresas"],
    popular: true,
    enabled: false,
  },
  {
    id: "micro-inalambric",
    name: "services.mobile.extras.micro-inalambric.name",
    description: "services.mobile.extras.micro-inalambric.description",
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
    name: 'packsOffers.earlyBird.name',
    discount: 10,
    minAmount: 800,
    description: 'packsOffers.earlyBird.description',
    badge: 'packsOffers.earlyBird.badge',
  },
  combo: {
    id: 'combo-extras',
    name: 'packsOffers.combo.name',
    discount: 10,
    minExtras: 2,
    description: 'packsOffers.combo.description',
    badge: 'packsOffers.combo.badge',
  },
  seasonal: {
    id: 'temporada-baixa',
    name: 'packsOffers.seasonal.name',
    discount: 10,
    months: [1, 2, 11],
    description: 'packsOffers.seasonal.description',
    badge: 'packsOffers.seasonal.badge',
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

