/**
 * INVENTARIO REAL DE EQUIPAMIENTO - ÒRBITA EVENTS
 *
 * FILOSOFÍA: "Lo que no tengo, lo alquilo. No hay problema"
 * - Equipment PROPIO está listado aquí con quantity > 0
 * - Equipment de ALQUILER tiene nota "Alquiler disponible - consultar precio"
 * - Si añades nuevo equipment → añádelo al array correspondiente
 * - Si vendes/quitas equipment → elimínalo del array
 *
 * SISTEMA AUTO-ACTUALIZABLE:
 * - Los componentes leen de aquí automáticamente
 * - Los packs referencian IDs de este archivo
 * - Las FAQs se generan desde aquí
 *
 * ÚLTIMA ACTUALIZACIÓN: 27/11/2025
 * @author Manolo - Arquitecto Digital
 */

// ============================================
// TIPOS
// ============================================

export interface Equipment {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  category: 'controller' | 'speaker' | 'lighting' | 'effect' | 'accessory' | 'other';
  quantity: number; // Cantidad REAL que tienes
  specs?: {
    power?: string;
    coverage?: string;
    connectivity?: string;
    [key: string]: any;
  };
  images?: string[]; // Rutas a fotos reales del equipo
  description: string;
  purchaseYear?: number;
  condition?: 'new' | 'excellent' | 'good' | 'fair';
  retailPrice?: number; // Precio de mercado (referencia)
}

// ============================================
// INVENTARIO REAL
// ============================================

/**
 * CONTROLADORAS Y MIXERS
 */
export const CONTROLLERS: Equipment[] = [
  {
    id: "ddj-rev7",
    name: "Pioneer DDJ-REV7",
    brand: "Pioneer DJ",
    model: "DDJ-REV7",
    category: "controller",
    quantity: 1,
    specs: {
      channels: "2 canales",
      effects: "Profesional con FX",
      connectivity: "USB, MIDI",
    },
    description: "Controladora profesional Pioneer DJ de nivel club con motorized platters",
    condition: "excellent",
    images: [
      "/img/equipment/ddj-rev7.webp"
    ],
  },
];

/**
 * SISTEMAS DE SONIDO
 */
export const SPEAKERS: Equipment[] = [
  {
    id: "ev-etx-12p",
    name: "EV ETX 2000W",
    brand: "Electro-Voice",
    model: "ETX-12P",
    category: "speaker",
    quantity: 2,
    specs: {
      power: "2000W por unidad (4000W total)",
      coverage: "Hasta 150-200 personas",
      type: "Altavoz activo profesional",
    },
    description: "Sistema de altavoces profesional Electro-Voice, sonido cristalino y potente para cualquier evento",
    condition: "excellent",
    images: [
      "/img/equipment/ev-etx.webp"
    ],
  },
];

/**
 * ILUMINACIÓN
 */
export const LIGHTING: Equipment[] = [
  {
    id: "led-bash-bateria",
    name: "LED Bash a Batería",
    brand: "Bash",
    category: "lighting",
    quantity: 2,
    specs: {
      type: "Foco LED RGB a batería",
      power: "LED de alta potencia",
      modes: "Auto, Sound-activated, DMX",
      battery: "Autonomía 8-12 horas",
    },
    description: "Focos LED a batería ideales para iluminación sin cables en cualquier ubicación",
    condition: "excellent",
  },
  {
    id: "multibos-led",
    name: "Multibos LED",
    category: "lighting",
    quantity: 1,
    specs: {
      type: "Sistema de iluminación completo",
      coverage: "Ideal para fiestas hasta 50 personas",
      modes: "Múltiples programas automáticos",
    },
    description: "Sistema de iluminación compacto y versátil, perfecto para eventos pequeños y medianos",
    condition: "excellent",
  },
  {
    id: "cabezas-moviles-beam",
    name: "Cabezas Móviles Beam 150W LED",
    category: "lighting",
    quantity: 4,
    specs: {
      power: "150W LED por unidad",
      type: "Moving Head Beam",
      colors: "RGBW + Color Wheel",
      modes: "Auto, Sound, DMX512",
    },
    description: "Cabezas móviles tipo Beam profesionales, efectos espectaculares de luz",
    condition: "excellent",
  },
  {
    id: "esferas-luz-calida",
    name: "Esferas de Luz Cálida",
    category: "lighting",
    quantity: 2,
    specs: {
      type: "Iluminación ambiental",
      power: "Alta potencia",
      color: "Luz cálida",
    },
    description: "Esferas de luz muy cálidas y potentes, ideales para dar ambiente e iluminación al punto",
    condition: "excellent",
  },
];

/**
 * EFECTOS ESPECIALES
 */
export const EFFECTS: Equipment[] = [
  {
    id: "maquina-humo-1800w",
    name: "Máquina de Humo 1800W",
    category: "effect",
    quantity: 1,
    specs: {
      power: "1800W",
      output: "Alta producción de humo",
      fluid: "Líquido profesional bajo olor",
      heatUpTime: "5 minutos",
    },
    description: "Máquina de humo profesional 1800W para efectos ambientales. Incluida en todos los packs.",
    condition: "excellent",
  },
  {
    id: "maquina-humo-bajo-3000w",
    name: "Máquina de Humo Bajo 3000W",
    category: "effect",
    quantity: 0, // ALQUILER - No propio
    specs: {
      power: "3000W",
      type: "Low fog machine",
      coverage: "Efecto de niebla a nivel del suelo",
      note: "ALQUILER DISPONIBLE - Precio a consultar",
    },
    description: "Máquina de humo bajo 3000W para efectos dramáticos a nivel del suelo (primeros bailes, entradas). Disponible mediante alquiler.",
    condition: "excellent",
  },
];

/**
 * ACCESORIOS Y PERIFÉRICOS
 */
export const ACCESSORIES: Equipment[] = [
  {
    id: "cabina-dj",
    name: "Cabina DJ Profesional",
    category: "accessory",
    quantity: 1,
    specs: {
      material: "Estructura profesional",
      includes: "Soporte controladora + iluminación integrada",
    },
    description: "Cabina DJ profesional, presentación elegante y funcional para cualquier evento",
    condition: "excellent",
  },
  {
    id: "microfono-inalambrico",
    name: "Micrófono Inalámbrico",
    category: "accessory",
    quantity: 1,
    specs: {
      type: "Wireless",
      range: "Hasta 100m",
      batteryLife: "8-10 horas",
    },
    description: "Micrófono inalámbrico profesional para discursos, ceremonias y karaoke",
    condition: "excellent",
  },
  {
    id: "tripodes",
    name: "Trípodes Profesionales",
    category: "accessory",
    quantity: 4,
    specs: {
      height: "Hasta 3 metros",
      type: "T-bar stands",
      material: "Aluminio profesional",
    },
    description: "Trípodes profesionales para iluminación y efectos",
    condition: "excellent",
  },
  {
    id: "cableado-profesional",
    name: "Cableado Profesional Completo",
    category: "accessory",
    quantity: 1, // Set completo
    specs: {
      includes: "XLR, DMX, Power, Audio",
      length: "Múltiples longitudes disponibles",
    },
    description: "Kit completo de cableado profesional certificado (audio, DMX, alimentación)",
    condition: "excellent",
  },
  {
    id: "atrezzo-mon-magic",
    name: "Atrezzo Temàtic Món Màgic",
    category: "other",
    quantity: 1, // Set completo
    specs: {
      includes: "Decoración temática completa",
      theme: "Món Màgic",
    },
    description: "Set completo de atrezzo temático de escuela de brujos para crear experiencias mágicas inolvidables",
    condition: "excellent",
  },
  {
    id: "atrezzo-halloween",
    name: "Atrezzo Temático Halloween",
    category: "other",
    quantity: 1, // Set completo
    specs: {
      includes: "Decoración temática completa",
      theme: "Halloween",
    },
    description: "Set completo de atrezzo temático de Halloween para fiestas terroríficamente divertidas",
    condition: "excellent",
  },
];

// ============================================
// CATÁLOGO COMPLETO (Para búsquedas/listados)
// ============================================

export const ALL_EQUIPMENT: Equipment[] = [
  ...CONTROLLERS,
  ...SPEAKERS,
  ...LIGHTING,
  ...EFFECTS,
  ...ACCESSORIES,
];

// ============================================
// HELPERS
// ============================================

/**
 * Obtener equipment por ID
 */
export function getEquipmentById(id: string): Equipment | undefined {
  return ALL_EQUIPMENT.find(item => item.id === id);
}

/**
 * Obtener equipment por categoría
 */
export function getEquipmentByCategory(category: Equipment['category']): Equipment[] {
  return ALL_EQUIPMENT.filter(item => item.category === category);
}

/**
 * Obtener equipment por marca
 */
export function getEquipmentByBrand(brand: string): Equipment[] {
  return ALL_EQUIPMENT.filter(item => item.brand?.toLowerCase() === brand.toLowerCase());
}

/**
 * Contar total de piezas de equipment
 */
export function getTotalEquipmentCount(): number {
  return ALL_EQUIPMENT.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Verificar si un equipment está disponible (cantidad > 0)
 */
export function isEquipmentAvailable(id: string): boolean {
  const equipment = getEquipmentById(id);
  return equipment ? equipment.quantity > 0 : false;
}

/**
 * Obtener valor total del inventario (precios retail)
 */
export function getTotalInventoryValue(): number {
  return ALL_EQUIPMENT.reduce((total, item) => {
    const price = item.retailPrice || 0;
    return total + (price * item.quantity);
  }, 0);
}

/**
 * Validar integridad del inventario
 * Retorna errores si hay equipment mal configurado
 */
export function validateInventory(): string[] {
  const errors: string[] = [];

  ALL_EQUIPMENT.forEach(item => {
    if (!item.id) errors.push(`Equipment sin ID: ${item.name}`);
    if (!item.name) errors.push(`Equipment ID ${item.id} sin nombre`);
    if (item.quantity < 0) errors.push(`${item.name}: cantidad negativa`);
    if (!item.description) errors.push(`${item.name}: falta descripción`);
  });

  return errors;
}

// ============================================
// EXPORTS
// ============================================

export default ALL_EQUIPMENT;
