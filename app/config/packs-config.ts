/**
 * SISTEMA DE PRECIOS ÒRBITA EVENTS - VERSIÓN DEFINITIVA
 * =====================================================
 * 
 * REGLA DE ORO: CERO DATOS HARDCODEADOS EN EL PROYECTO
 * Todo precio, duración, contenido de pack, equipo... sale de aquí.
 * 
 * @author Manolo - Arquitecto Digital
 * @updated 2024-11 - Inventario real + duraciones actualizadas
 */

// ============================================
// 1. INVENTARIO REAL DE EQUIPAMIENTO
// ============================================

export const INVENTARIO = {
  // Equipo principal - INVENTARIO REAL actualizado
  controladora: {
    nombre: "Pioneer DDJ REV7",
    descripcion: "Controladora DJ profesional",
  },
  altavoces: {
    nombre: "2x EV ETX 2000W",
    descripcion: "Amplificadores activos Electro-Voice",
    potenciaTotal: 4000,
    potenciaUnidad: 2000,
    cantidad: 2,
  },
  cabinaDJ: {
    nombre: "Cabina DJ Profesional",
    descripcion: "Setup completo para el DJ",
  },
  iluminacion: {
    focosLED: {
      nombre: "2x Focos Bash LED",
      cantidad: 2,
    },
    multiefectos: {
      nombre: "Multiefectos LED",
      cantidad: 1,
    },
    cabezasMoviles: {
      nombre: "4x Cabezas Móviles 150W LED",
      potenciaUnidad: 150,
      cantidad: 4,
    },
  },
  efectos: {
    maquinaHumo: {
      nombre: "Máquina de humo",
      incluido: true, // Incluido en todos los packs
    },
  },
  
  // EXTRAS (precio consulta o fijo)
  extras: {
    humoBajo: {
      id: "humo-bajo",
      nombre: "Máquina de Humo Bajo",
      descripcion: "Efecto 'nube' para el baile nupcial",
      precio: 150,
    },
    co2: {
      id: "co2-gun",
      nombre: "Pistola/Cañón CO2",
      descripcion: "Chorro de aire frío espectacular",
      precio: 200,
    },
    confetti: {
      id: "confetti",
      nombre: "Cañón de Confeti",
      descripcion: "Explosión de color para momentos clave",
      precio: 100,
    },
    chispasFrias: {
      id: "fuego-frio",
      nombre: "Chispas Frías (2 máquinas)",
      descripcion: "Efecto pirotécnico seguro para interior",
      precio: 150,
    },
    burbujas: {
      id: "burbujas",
      nombre: "Máquina de Burbujas",
      descripcion: "Toque mágico y divertido",
      precio: 50,
    },
    pantalla: {
      id: "pantalla",
      nombre: "Proyector + Pantalla",
      descripcion: "Para vídeos sorpresa o presentaciones",
      precio: null, // Consultar precio
      consultarPrecio: true,
    },
  },
} as const;

// Helper para describir el equipo de sonido
export function getDescripcionSonido(): string {
  const { altavoces, controladora } = INVENTARIO;
  return `${altavoces.cantidad}x ${altavoces.nombre.replace('2x ', '')} (${altavoces.potenciaTotal}W total) + ${controladora.nombre}`;
}

// Helper para describir iluminación básica
export function getDescripcionIluminacionBasica(): string {
  const { focosLED, multiefectos } = INVENTARIO.iluminacion;
  return `${multiefectos.nombre} + ${focosLED.nombre}`;
}

// Helper para describir iluminación PRO
export function getDescripcionIluminacionPRO(): string {
  const { cabezasMoviles } = INVENTARIO.iluminacion;
  return `${cabezasMoviles.cantidad} ${cabezasMoviles.nombre.replace('4x ', '')}`;
}

// ============================================
// 2. TYPES & STRUCTURES
// ============================================

export type ServiceSlug = 'fiestas' | 'bodas' | 'discomovil' | 'alquiler' | 'empresas' | 'produccion';

export const ALL_SERVICES: ServiceSlug[] = [
  'fiestas',
  'bodas',
  'discomovil',
  'alquiler',
  'empresas',
  'produccion',
];

export type PackId = string;

export interface PackDefinition {
  id: string;
  service: ServiceSlug;
  slug: string;
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
  
  // Capacidad de invitados
  capacidadMinima?: number;
  capacidadMaxima?: number;
  
  // Para ofertas flash
  isFlash?: boolean;
  flashDiscount?: number; // Porcentaje de descuento
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
// 3. CONFIGURACIÓN DE OFERTA FLASH
// ============================================

export const OFERTA_FLASH = {
  nombre: "⚡ Oferta Flash",
  descripcion: "Fiestas pequeñas con descuento exclusivo",
  maxInvitados: 50, // ← AQUÍ SE CONFIGURA EL LÍMITE
  descuentoPorcentaje: 44, // 44% de descuento
  duracionHoras: 2, // ← Opción básica: 2 horas
  disponible: true,
  condiciones: [
    "Válido para fiestas de hasta 50 invitados",
    "Reserva con mínimo 15 días de antelación",
    "Sujeto a disponibilidad",
  ],
  // Opciones de duración
  opciones: {
    basica: {
      horas: 2,
      precio: 250,
    },
    extendida: {
      horas: 3,
      precio: 400,
    },
  },
  // Extras disponibles para Flash
  extras: [
    { id: "humo", nombre: "Máquina de humo", precio: 50 },
    { id: "burbujas", nombre: "Máquina de burbujas", precio: 50 },
    { id: "chispas", nombre: "Chispas frías", precio: 100 },
    { id: "cabina-led", nombre: "Cabina DJ iluminada", precio: 75 },
  ],
} as const;

// ============================================
// 4. PACKS PRINCIPALES - ACTUALIZADOS
// ============================================

const PACKS: PackDefinition[] = [
  // =============================================
  // OFERTA FLASH - FIESTAS PEQUEÑAS (≤50 personas)
  // =============================================
  {
    id: "oferta-flash",
    service: "fiestas",
    slug: "oferta-flash",
    name: OFERTA_FLASH.nombre,
    tagline: `Solo para fiestas de hasta ${OFERTA_FLASH.maxInvitados} invitados`,
    price: "250€",
    priceValue: 250,
    priceOriginal: "450€",
    priceOriginalValue: 450,
    features: [
      `🔊 Sonido PRO ${INVENTARIO.altavoces.potenciaTotal}W (${INVENTARIO.altavoces.nombre})`,
      `💡 ${getDescripcionIluminacionBasica()}`,
      `🎧 DJ profesional ${OFERTA_FLASH.duracionHoras} horas`,
      `✨ ${INVENTARIO.efectos.maquinaHumo.nombre}`,
      "📦 Montaje y desmontaje incluido",
    ],
    ideal: `Fiestas privadas de hasta ${OFERTA_FLASH.maxInvitados} personas`,
    duration: `${OFERTA_FLASH.duracionHoras} horas`,
    durationHours: OFERTA_FLASH.duracionHoras,
    badge: "🔥 OFERTA FLASH",
    isFlash: true,
    flashDiscount: OFERTA_FLASH.descuentoPorcentaje,
    capacidadMinima: 10,
    capacidadMaxima: OFERTA_FLASH.maxInvitados,
  },

  // =============================================
  // BODAS - Actualizados con 4h base + cabezas móviles
  // =============================================
  {
    id: "bodas-basico",
    service: "bodas",
    slug: "boda-esencial",
    name: "Essential (Baile Final)",
    tagline: "Tu fiesta final, exactamente como la imaginas",
    emotion: "Ese momento cuando todos bailan juntos... tu boda, tu estilo, tu música",
    price: "550€",
    priceValue: 550,
    features: [
      "DJ profesional 3 horas (Solo baile final)", // ← CORRECCIÓN: 3h para solo baile
      `Sonido PRO ${INVENTARIO.altavoces.potenciaTotal}W (${INVENTARIO.altavoces.nombre}) + ${INVENTARIO.controladora.nombre}`,
      `Iluminación de pista (${getDescripcionIluminacionBasica()})`,
      INVENTARIO.efectos.maquinaHumo.nombre,
      "Micrófono inalámbrico (Discursos)",
      "1 Reunión de coordinación",
    ],
    ideal: "Bodas íntimas que solo necesitan fiesta",
    duration: "3 horas",
    durationHours: 3,
    badge: "Básico",
  },
  {
    id: "bodas-premium",
    service: "bodas",
    slug: "boda-signature",
    name: "Signature (Día Completo)",
    tagline: "Vivimos tu boda contigo desde el primer momento",
    emotion: "Desde que entras hasta el último baile: música, tematización y animación pensadas para vosotros",
    price: "800€",
    priceValue: 800,
    features: [
      "DJ profesional 5 horas (Ceremonia, Cóctel, Baile)",
      `Sonido PRO ${INVENTARIO.altavoces.potenciaTotal}W + ${INVENTARIO.controladora.nombre}`,
      `Iluminación PRO: ${getDescripcionIluminacionPRO()}`, // ← Cabezas móviles
      "Iluminación ambiental (Bolas LED)",
      `${INVENTARIO.efectos.maquinaHumo.nombre} ligero`,
      "2 Micrófonos inalámbricos (Lecturas/Discursos)",
      "Coordinación total con Wedding Planner",
      "Música personalizada para cada momento",
    ],
    ideal: "Bodas estándar 80-150 invitados",
    duration: "5 horas",
    durationHours: 5,
    popular: true,
    badge: "Más popular",
  },
  {
    id: "bodas-luxury",
    service: "bodas",
    slug: "boda-royal",
    name: "Royal Wedding (Full FX)",
    tagline: "La experiencia VIP que tus invitados jamás olvidarán",
    emotion: "No solo una boda. Un espectáculo diseñado para que cada invitado diga: 'Nunca había visto algo así'",
    price: "1.000€",
    priceValue: 1000,
    features: [
      "DJ + TÉCNICO DE LUCES (2 Personas, 6 horas)",
      `Sonido Audiófilo ${INVENTARIO.altavoces.potenciaTotal}W ${INVENTARIO.altavoces.nombre.replace('2x ', '')}`,
      `Show de luces sincronizado (${getDescripcionIluminacionPRO()})`, // ← Cabezas móviles
      `Efecto ${INVENTARIO.extras.humoBajo.nombre} (Baile en las nubes)`,
      `Pack ${INVENTARIO.extras.chispasFrias.nombre}`,
      INVENTARIO.extras.burbujas.nombre,
      "Grabación de audio de la ceremonia",
      "Montaje estético premium (Cabina retroiluminada)",
    ],
    ideal: "Bodas que buscan impacto visual",
    duration: "6 horas",
    durationHours: 6,
    badge: "Premium",
  },

  // =============================================
  // DISCOMÓVIL / FIESTAS - Actualizados con 4h + cabezas móviles
  // =============================================
  {
    id: "disco-basico",
    service: "discomovil",
    slug: "party-starter",
    name: "Party Starter",
    tagline: "Tu fiesta, tu estilo. Nosotros la hacemos realidad",
    emotion: "Desde cumpleaños temáticos hasta celebraciones familiares: creamos el ambiente perfecto para que todos disfruten",
    price: "350€",
    priceValue: 350,
    features: [
      "DJ profesional 3 horas",
      `Sonido ${INVENTARIO.altavoces.potenciaTotal}W ${INVENTARIO.altavoces.nombre} + ${INVENTARIO.controladora.nombre}`,
      `Iluminación básica (${getDescripcionIluminacionBasica()})`,
      INVENTARIO.efectos.maquinaHumo.nombre,
      "Música variada (Open format)",
    ],
    ideal: "Fiestas privadas, cumpleaños, aniversarios",
    duration: "3 horas",
    durationHours: 3,
    badge: "Básico",
    capacidadMinima: 20,
    capacidadMaxima: 80,
  },
  {
    id: "disco-completo",
    service: "discomovil",
    slug: "party-machine",
    name: "Party Machine",
    tagline: "Más duración y efectos para fiestas que no paran",
    price: "400€",
    priceValue: 400,
    features: [
      "DJ profesional 4 horas",
      `Sonido ${INVENTARIO.altavoces.potenciaTotal}W ${INVENTARIO.altavoces.nombre} + ${INVENTARIO.controladora.nombre}`,
      `Iluminación básica (${getDescripcionIluminacionBasica()})`,
      `${INVENTARIO.efectos.maquinaHumo.nombre} + ${INVENTARIO.extras.burbujas.nombre}`,
      "Peticiones de canciones en directo",
    ],
    ideal: "Fiestas medianas con ganas de bailar",
    duration: "4 horas",
    durationHours: 4,
    popular: true,
    badge: "Más popular",
    capacidadMinima: 50,
    capacidadMaxima: 120,
  },
  {
    id: "disco-premium",
    service: "discomovil",
    slug: "vip-experience",
    name: "VIP Experience",
    tagline: "Máxima duración, efectos espectaculares y potencia profesional",
    price: "700€",
    priceValue: 700,
    features: [
      "DJ profesional 6 horas",
      `Sonido Club (${INVENTARIO.altavoces.potenciaTotal}W + Subwoofer de refuerzo)`,
      `Show de luces completo (${getDescripcionIluminacionPRO()})`,
      `Efectos VIP (${INVENTARIO.efectos.maquinaHumo.nombre}, ${INVENTARIO.extras.burbujas.nombre}, Chispas frías, Confeti manual)`,
      "Cabina DJ Pro iluminada",
    ],
    ideal: "Eventos largos o espacios grandes",
    duration: "6 horas",
    durationHours: 6,
    badge: "Premium",
    capacidadMinima: 80,
    capacidadMaxima: 200,
  },

  // =============================================
  // EMPRESAS - Actualizados
  // =============================================
  {
    id: "empresas-cocktail",
    service: "empresas",
    slug: "corporate-cocktail",
    name: "Corporate Cocktail",
    tagline: "Profesionalismo que refuerza tu marca",
    emotion: "Networking elegante con el ambiente perfecto que refleja los valores de tu empresa",
    price: "400€",
    priceValue: 400,
    features: [
      "DJ/Hilo musical 4 horas", // ← 3h → 4h
      `Sonido ambiente cristalino (${INVENTARIO.altavoces.nombre.replace('2x ', '')})`,
      "Iluminación estática decorativa",
      "1 Micrófono inalámbrico",
      "Factura y gestión administrativa",
    ],
    ideal: "Afterworks y aperitivos",
    duration: "4 horas",
    durationHours: 4,
    badge: "Básico",
  },
  {
    id: "empresas-evento",
    service: "empresas",
    slug: "corporate-event",
    name: "Corporate Event",
    tagline: "La opción equilibrada para presentaciones y fiesta.",
    price: "850€",
    priceValue: 850,
    features: [
      "DJ + Técnico 5 horas",
      `Sonido ${INVENTARIO.altavoces.potenciaTotal}W para speech y música`,
      `Iluminación dinámica (${getDescripcionIluminacionPRO()})`, // ← Cabezas móviles
      "2 Micrófonos inalámbricos",
      "Coordinación de escaleta",
      "Soporte para proyección (Audio)",
    ],
    ideal: "Cenas de empresa y presentaciones",
    duration: "5 horas",
    durationHours: 5,
    popular: true,
    badge: "Más popular",
  },
  {
    id: "empresas-gala",
    service: "empresas",
    slug: "corporate-gala",
    name: "Corporate Gala",
    tagline: "Producción completa con refuerzo técnico.",
    price: "1.400€",
    priceValue: 1400,
    features: [
      "Servicio integral 6 horas",
      "DJ + Técnico de Sonido dedicado",
      "Sonido reforzado + Microfonía avanzada (4 micros)",
      "Diseño de iluminación corporativa",
      "Coordinación con agencia/venue",
      "Grabación de audio del evento",
      "Montaje estético impecable",
    ],
    ideal: "Eventos importantes y marcas",
    duration: "6 horas",
    durationHours: 6,
    badge: "Premium",
  },

  // =============================================
  // PRODUCCIÓN TÉCNICA
  // =============================================
  {
    id: "produccion-basico",
    service: "produccion",
    slug: "tech-support",
    name: "Tech Support",
    tagline: "Alquiler de equipo propio con técnico operador.",
    price: "600€",
    priceValue: 600,
    features: [
      `Sonido ${INVENTARIO.altavoces.potenciaTotal}W ${INVENTARIO.altavoces.nombre}`,
      getDescripcionIluminacionPRO(),
      "1 Técnico de sonido/luces (6 horas)",
      "Transporte y montaje incluidos",
    ],
    ideal: "Pequeños conciertos o actos",
    duration: "6 horas",
    durationHours: 6,
    badge: "Básico",
  },
  {
    id: "produccion-completo",
    service: "produccion",
    slug: "tech-team",
    name: "Tech Team",
    tagline: "Doble personal para asegurar el éxito.",
    price: "1.000€",
    priceValue: 1000,
    features: [
      `Sonido ${INVENTARIO.altavoces.potenciaTotal}W ${INVENTARIO.altavoces.nombre}`,
      "Iluminación completa propia",
      "2 Técnicos (1 Sonido + 1 Luces) 6 horas",
      "Microfonía completa",
      "Pruebas de sonido exhaustivas",
    ],
    ideal: "Eventos que no pueden fallar",
    duration: "6 horas",
    durationHours: 6,
    popular: true,
    badge: "Más popular",
  },
  {
    id: "produccion-festival",
    service: "produccion",
    slug: "full-service",
    name: "Full Service",
    tagline: "Máxima cobertura horaria y técnica.",
    price: "1.400€",
    priceValue: 1400,
    features: [
      "Todo el equipamiento de sonido y luz",
      "Refuerzo de graves (Subwoofer alquiler)",
      "3 Técnicos (Coordinador + Sonido + Luces) 8 horas",
      `Efectos especiales (${INVENTARIO.efectos.maquinaHumo.nombre}, ${INVENTARIO.extras.chispasFrias.nombre})`,
      "Gestión técnica integral",
    ],
    ideal: "Jornadas completas",
    duration: "8 horas",
    durationHours: 8,
    badge: "Premium",
  },
];

// ============================================
// 5. EXTRAS DISPONIBLES
// ============================================

export const EXTRAS: ExtraDefinition[] = [
  {
    id: "hora-extra",
    name: "Hora Extra",
    description: "Si la fiesta sigue, nosotros también",
    price: 100,
    icon: "⏰",
    category: "time",
    compatibleWith: ["bodas", "discomovil", "fiestas", "empresas"],
    popular: true,
  },
  {
    id: INVENTARIO.extras.humoBajo.id,
    name: INVENTARIO.extras.humoBajo.nombre,
    description: INVENTARIO.extras.humoBajo.descripcion,
    price: INVENTARIO.extras.humoBajo.precio,
    icon: "☁️",
    category: "effects",
    compatibleWith: ["bodas"],
    popular: true,
  },
  {
    id: INVENTARIO.extras.chispasFrias.id,
    name: INVENTARIO.extras.chispasFrias.nombre,
    description: INVENTARIO.extras.chispasFrias.descripcion,
    price: INVENTARIO.extras.chispasFrias.precio,
    icon: "✨",
    category: "effects",
    compatibleWith: ["bodas", "discomovil", "empresas"],
    popular: true,
  },
  {
    id: INVENTARIO.extras.burbujas.id,
    name: INVENTARIO.extras.burbujas.nombre,
    description: INVENTARIO.extras.burbujas.descripcion,
    price: INVENTARIO.extras.burbujas.precio,
    icon: "🫧",
    category: "effects",
    compatibleWith: ["bodas", "fiestas"],
  },
  {
    id: INVENTARIO.extras.co2.id,
    name: INVENTARIO.extras.co2.nombre,
    description: INVENTARIO.extras.co2.descripcion,
    price: INVENTARIO.extras.co2.precio,
    icon: "❄️",
    category: "effects",
    compatibleWith: ["discomovil", "bodas"],
  },
  {
    id: INVENTARIO.extras.confetti.id,
    name: INVENTARIO.extras.confetti.nombre,
    description: INVENTARIO.extras.confetti.descripcion,
    price: INVENTARIO.extras.confetti.precio,
    icon: "🎊",
    category: "effects",
    compatibleWith: ["bodas", "fiestas", "empresas"],
  },
  {
    id: INVENTARIO.extras.pantalla.id,
    name: INVENTARIO.extras.pantalla.nombre,
    description: INVENTARIO.extras.pantalla.descripcion,
    price: INVENTARIO.extras.pantalla.precio,
    consultarPrecio: true,
    icon: "📽️",
    category: "visual",
    compatibleWith: ["bodas", "empresas"],
  },
  {
    id: "micros-extra",
    name: "Micrófonos Extra (Pack 2)",
    description: "Inalámbricos de mano para discursos",
    price: 80,
    icon: "🎤",
    category: "sound",
    compatibleWith: ["empresas", "bodas", "produccion"],
  },
  // =============================================
  // EXTRAS CREATIVOS PARA BODAS Y CEREMONIAS
  // =============================================
  {
    id: "pulseras-luminosas",
    name: "Pulseras Luminosas (Pack 100)",
    description: "Pulseras de luz química para invitados - efecto mágico en la pista",
    price: 80,
    icon: "💫",
    category: "effects",
    compatibleWith: ["bodas", "fiestas"],
    popular: true,
  },
  {
    id: "barras-led-personalizadas",
    name: "Barras LED Personalizadas (Pack)",
    description: "Iluminación LED adicional personalizable con colores de la boda",
    price: 120,
    icon: "💡",
    category: "lighting",
    compatibleWith: ["bodas", "empresas"],
  },
  {
    id: "letras-luminosas-love",
    name: "Letras Luminosas LOVE/Iniciales",
    description: "Letras gigantes iluminadas para photocall y decoración",
    price: null, // Consultar precio (depende del tamaño)
    consultarPrecio: true,
    icon: "💝",
    category: "visual",
    compatibleWith: ["bodas"],
  },
  {
    id: "alfombra-led-pista",
    name: "Alfombra LED para Pista",
    description: "Pista de baile iluminada con efectos LED sincronizados",
    price: null, // Consultar precio (alquiler especial)
    consultarPrecio: true,
    icon: "✨",
    category: "lighting",
    compatibleWith: ["bodas"],
    premium: true,
  },
  {
    id: "gobo-personalizado",
    name: "Gobo Personalizado (Iniciales/Logo)",
    description: "Proyección de iniciales o logo en pared/suelo con iluminación",
    price: 150,
    icon: "🎯",
    category: "lighting",
    compatibleWith: ["bodas", "empresas"],
  },
  {
    id: "bengalas-frias-invitados",
    name: "Bengalas Frías para Invitados (Pack 50)",
    description: "Bengalas de mano para momentos especiales (entrada novios, tarta)",
    price: 100,
    icon: "🎇",
    category: "effects",
    compatibleWith: ["bodas"],
    popular: true,
  },
  {
    id: "cortina-led-backdrop",
    name: "Cortina LED Backdrop",
    description: "Telón LED iluminado para ceremonia o presidencia",
    price: 200,
    icon: "🌟",
    category: "lighting",
    compatibleWith: ["bodas", "empresas"],
    premium: true,
  },
  {
    id: "first-dance-special",
    name: "Pack 'First Dance Special'",
    description: "Humo bajo + iluminación personalizada + bengalas para el primer baile",
    price: 250, // Combo especial
    icon: "💍",
    category: "effects",
    compatibleWith: ["bodas"],
    popular: true,
  },
  // =============================================
  // EXTRAS ADICIONALES - Sonido y Ambiente
  // =============================================
  {
    id: "subwoofer-refuerzo",
    name: "Subwoofer de Refuerzo",
    description: "Graves potentes para eventos grandes o espacios amplios",
    price: 150,
    icon: "🔊",
    category: "sound",
    compatibleWith: ["bodas", "discomovil", "empresas", "fiestas"],
  },
  {
    id: "altavoces-adicionales",
    name: "Altavoces Adicionales (Par)",
    description: "Cobertura de sonido para espacios muy grandes o distribuidos",
    price: 200,
    icon: "📢",
    category: "sound",
    compatibleWith: ["bodas", "discomovil", "empresas", "produccion"],
  },
  {
    id: "neon-personalizado",
    name: "Letrero Neón Personalizado",
    description: "Neón LED con mensaje personalizado para photocall",
    price: 180,
    icon: "💡",
    category: "lighting",
    compatibleWith: ["bodas", "fiestas"],
    popular: true,
  },
  {
    id: "laser-show",
    name: "Show de Láser",
    description: "Efectos láser sincronizados con la música - espectacular",
    price: 220,
    icon: "✨",
    category: "lighting",
    compatibleWith: ["bodas", "discomovil", "empresas"],
    premium: true,
  },
  {
    id: "photobooth-360",
    name: "Photobooth 360°",
    description: "Cabina de fotos con vídeo 360° para tus invitados",
    price: 350,
    icon: "📸",
    category: "visual",
    compatibleWith: ["bodas", "fiestas", "empresas"],
    premium: true,
    popular: true,
  },
  {
    id: "alfombra-roja",
    name: "Alfombra Roja + Postes VIP",
    description: "Entrada VIP con alfombra roja y cordones dorados",
    price: 120,
    icon: "🎬",
    category: "visual",
    compatibleWith: ["bodas", "fiestas", "empresas"],
  },
  {
    id: "efectos-nieve",
    name: "Máquina de Nieve Artificial",
    description: "Efecto nevada para momentos mágicos (bodas invierno)",
    price: 140,
    icon: "❄️",
    category: "effects",
    compatibleWith: ["bodas", "fiestas"],
  },
  {
    id: "humo-pesado",
    name: "Humo Pesado (Dry Ice)",
    description: "Efecto nube densa para entrada o primer baile",
    price: 160,
    icon: "☁️",
    category: "effects",
    compatibleWith: ["bodas"],
    popular: true,
  },
  {
    id: "sparklers-fountain",
    name: "Fuentes de Chispas (4 unidades)",
    description: "Fuentes pirotécnicas de interior para momentos clave",
    price: 180,
    icon: "🎆",
    category: "effects",
    compatibleWith: ["bodas", "fiestas"],
  },
  {
    id: "uplighting-colores",
    name: "Uplighting Ambiental (Pack 12)",
    description: "Iluminación LED de pared para ambientar el espacio con colores",
    price: 150,
    icon: "🌈",
    category: "lighting",
    compatibleWith: ["bodas", "empresas"],
  },
  {
    id: "bola-espejos-grande",
    name: "Bola de Espejos Gigante",
    description: "Bola de discoteca de gran tamaño con foco dedicado",
    price: 80,
    icon: "🪩",
    category: "lighting",
    compatibleWith: ["discomovil", "fiestas", "bodas"],
  },
  {
    id: "pantalla-led-gigante",
    name: "Pantalla LED Gigante",
    description: "Pantalla LED profesional para vídeos y visuales",
    price: null,
    consultarPrecio: true,
    icon: "📺",
    category: "visual",
    compatibleWith: ["bodas", "empresas"],
    premium: true,
  },
  {
    id: "monograma-proyeccion",
    name: "Monograma Proyectado",
    description: "Proyección de iniciales o logo en movimiento",
    price: 100,
    icon: "🎯",
    category: "lighting",
    compatibleWith: ["bodas", "empresas"],
  },
  {
    id: "videoclip-resumen",
    name: "Videoclip Resumen del Evento",
    description: "Vídeo profesional editado con los mejores momentos - precio según duración",
    price: null,
    consultarPrecio: true,
    icon: "🎥",
    category: "visual",
    compatibleWith: ["bodas", "fiestas"],
    popular: true,
  },
];

// ============================================
// 6. OFERTAS Y DESCUENTOS
// ============================================

export const OFFERS = {
  earlyBird: {
    id: 'early-bird',
    name: 'Reserva Anticipada',
    discount: 10,
    minAmount: 800,
    description: 'Reserva hoy y ahorra 10% en tu pack',
    badge: '🔥 OFERTA LIMITADA',
  },
  combo: {
    id: 'combo-extras',
    name: 'Pack de 3 Extras',
    discount: 15,
    minExtras: 3,
    description: 'Contrata 3+ extras y ahorra 15%',
    badge: '💎 COMBO',
  },
  seasonal: {
    id: 'temporada-baja',
    name: 'Descuento Temporada Baja',
    discount: 10,
    months: [1, 2, 11], // Enero, Febrero, Noviembre
    description: 'Eventos en temporada baja tienen descuento',
    badge: '📅 TEMPORADA',
  },
  flash: {
    id: 'oferta-flash',
    name: OFERTA_FLASH.nombre,
    discount: OFERTA_FLASH.descuentoPorcentaje,
    maxGuests: OFERTA_FLASH.maxInvitados,
    description: `Fiestas de hasta ${OFERTA_FLASH.maxInvitados} personas con descuento exclusivo`,
    badge: '⚡ FLASH',
    condiciones: OFERTA_FLASH.condiciones,
  },
} as const;

// ============================================
// 7. API FUNCTIONS
// ============================================

export function getPacksByService(service: ServiceSlug): PackDefinition[] {
  // Caso especial: Fiestas y Discomóvil incluyen la oferta flash
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

// Helper para obtener packs por capacidad de invitados
export function getPacksByCapacity(guests: number, service?: ServiceSlug): PackDefinition[] {
  let packs = service ? getPacksByService(service) : PACKS;
  return packs.filter(p => {
    if (!p.capacidadMinima && !p.capacidadMaxima) return true;
    const min = p.capacidadMinima || 0;
    const max = p.capacidadMaxima || Infinity;
    return guests >= min && guests <= max;
  });
}

// Helper para obtener el pack recomendado por invitados
export function getRecommendedPack(guests: number, service: ServiceSlug): PackDefinition | undefined {
  const packs = getPacksByCapacity(guests, service).filter(p => !p.isFlash);
  // Devolver el popular si existe, si no el primero que encaje
  return packs.find(p => p.popular) || packs[0];
}

// ============================================
// 8. HELPERS PARA FAQs DINÁMICAS
// ============================================

export function getFAQEquipamiento(): string {
  const { altavoces, controladora, iluminacion, efectos } = INVENTARIO;
  return `Montaje completo: ${altavoces.cantidad} altavoces ${altavoces.nombre.replace('2x ', '')} (${altavoces.potenciaUnidad}W cada uno), ${iluminacion.cabezasMoviles.cantidad} ${iluminacion.cabezasMoviles.nombre.replace('4x ', '')}, ${iluminacion.multiefectos.nombre}, ${efectos.maquinaHumo.nombre}, controladora ${controladora.nombre}, micros profesionales, DJ/técnico dedicado TODA la noche, coordinación previa. Montaje en 45 min. Sin sorpresas ni extras ocultos.`;
}

export function getFAQPrecioMinimoBodas(): string {
  const minPrice = getMinPriceByService('bodas');
  return `${minPrice}€`;
}

export function getFAQPrecioMinimoFiestas(): string {
  const flashPack = getOfertaFlash();
  return flashPack ? flashPack.price : `${getMinPriceByService('fiestas')}€`;
}

export function getFAQDesplazamiento(): string {
  const minPriceDesplazamientoIncluido = 600;
  return `Sí, TODA Catalunya sin problema. Desplazamiento INCLUIDO en packs a partir de ${minPriceDesplazamientoIncluido}€. Resto de ubicaciones: +50€. Montamos en masías, fincas, hoteles y espacios al aire libre. Si tu ubicación es complicada, lo solucionamos.`;
}

export function getFAQOfertaFlash(): string {
  const flash = OFERTA_FLASH;
  const flashPack = getOfertaFlash();
  if (!flashPack) return "";
  return `Tenemos la ${flash.nombre} para fiestas de hasta ${flash.maxInvitados} personas desde solo ${flashPack.price}. Incluye ${flashPack.durationHours} horas de DJ, sonido profesional e iluminación. ¡${flash.descuentoPorcentaje}% de descuento!`;
}

