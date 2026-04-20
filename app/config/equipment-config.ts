import { resolveEquipmentCatalogKey } from '@/lib/equipment-i18n';

/**
 * INVENTARIO REAL DE EQUIPAMIENTO - ÒRBITA EVENTS
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
    [key: string]: string | undefined;
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
    name: "equipmentCatalog.items.ddj-rev7.name",
    brand: "Pioneer DJ",
    model: "DDJ-REV7",
    category: "controller",
    quantity: 1,
    specs: {
      channels: "equipmentCatalog.items.ddj-rev7.specs.channels",
      effects: "equipmentCatalog.items.ddj-rev7.specs.effects",
      connectivity: "equipmentCatalog.items.ddj-rev7.specs.connectivity",
    },
    description: "equipmentCatalog.items.ddj-rev7.description",
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
    name: "equipmentCatalog.items.ev-etx-12p.name",
    brand: "Electro-Voice",
    model: "ETX-12P",
    category: "speaker",
    quantity: 2,
    specs: {
      power: "equipmentCatalog.items.ev-etx-12p.specs.power",
      coverage: "equipmentCatalog.items.ev-etx-12p.specs.coverage",
      type: "equipmentCatalog.items.ev-etx-12p.specs.type",
    },
    description: "equipmentCatalog.items.ev-etx-12p.description",
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
    name: "equipmentCatalog.items.led-bash-bateria.name",
    brand: "Bash",
    category: "lighting",
    quantity: 2,
    specs: {
      type: "equipmentCatalog.items.led-bash-bateria.specs.type",
      power: "equipmentCatalog.items.led-bash-bateria.specs.power",
      modes: "equipmentCatalog.items.led-bash-bateria.specs.modes",
      battery: "equipmentCatalog.items.led-bash-bateria.specs.battery",
    },
    description: "equipmentCatalog.items.led-bash-bateria.description",
    condition: "excellent",
  },
  {
    id: "multibos-led",
    name: "equipmentCatalog.items.multibos-led.name",
    category: "lighting",
    quantity: 1,
    specs: {
      type: "equipmentCatalog.items.multibos-led.specs.type",
      coverage: "equipmentCatalog.items.multibos-led.specs.coverage",
      modes: "equipmentCatalog.items.multibos-led.specs.modes",
    },
    description: "equipmentCatalog.items.multibos-led.description",
    condition: "excellent",
  },
  {
    id: "cabezas-moviles-beam",
    name: "equipmentCatalog.items.cabezas-moviles-beam.name",
    category: "lighting",
    quantity: 4,
    specs: {
      power: "equipmentCatalog.items.cabezas-moviles-beam.specs.power",
      type: "equipmentCatalog.items.cabezas-moviles-beam.specs.type",
      colors: "equipmentCatalog.items.cabezas-moviles-beam.specs.colors",
      modes: "equipmentCatalog.items.cabezas-moviles-beam.specs.modes",
    },
    description: "equipmentCatalog.items.cabezas-moviles-beam.description",
    condition: "excellent",
  },
  {
    id: "esferas-luz-calida",
    name: "equipmentCatalog.items.esferas-luz-calida.name",
    category: "lighting",
    quantity: 2,
    specs: {
      type: "equipmentCatalog.items.esferas-luz-calida.specs.type",
      power: "equipmentCatalog.items.esferas-luz-calida.specs.power",
      color: "equipmentCatalog.items.esferas-luz-calida.specs.color",
    },
    description: "equipmentCatalog.items.esferas-luz-calida.description",
    condition: "excellent",
  },
];

/**
 * EFECTOS ESPECIALES
 */
export const EFFECTS: Equipment[] = [
  {
    id: "maquina-humo-1800w",
    name: "equipmentCatalog.items.maquina-humo-1800w.name",
    category: "effect",
    quantity: 1,
    specs: {
      power: "equipmentCatalog.items.maquina-humo-1800w.specs.power",
      output: "equipmentCatalog.items.maquina-humo-1800w.specs.output",
      fluid: "equipmentCatalog.items.maquina-humo-1800w.specs.fluid",
      heatUpTime: "equipmentCatalog.items.maquina-humo-1800w.specs.heatUpTime",
    },
    description: "equipmentCatalog.items.maquina-humo-1800w.description",
    condition: "excellent",
  },
  {
    id: "maquina-humo-bajo-3000w",
    name: "equipmentCatalog.items.maquina-humo-bajo-3000w.name",
    category: "effect",
    quantity: 0, // ALQUILER - No propio
    specs: {
      power: "equipmentCatalog.items.maquina-humo-bajo-3000w.specs.power",
      type: "equipmentCatalog.items.maquina-humo-bajo-3000w.specs.type",
      coverage: "equipmentCatalog.items.maquina-humo-bajo-3000w.specs.coverage",
      note: "equipmentCatalog.items.maquina-humo-bajo-3000w.specs.note",
    },
    description: "equipmentCatalog.items.maquina-humo-bajo-3000w.description",
    condition: "excellent",
  },
];

/**
 * ACCESORIOS Y PERIFÉRICOS
 */
export const ACCESSORIES: Equipment[] = [
  {
    id: "cabina-dj",
    name: "equipmentCatalog.items.cabina-dj.name",
    category: "accessory",
    quantity: 1,
    specs: {
      material: "equipmentCatalog.items.cabina-dj.specs.material",
      includes: "equipmentCatalog.items.cabina-dj.specs.includes",
    },
    description: "equipmentCatalog.items.cabina-dj.description",
    condition: "excellent",
  },
  {
    id: "microfono-inalambrico",
    name: "equipmentCatalog.items.microfono-inalambrico.name",
    category: "accessory",
    quantity: 1,
    specs: {
      type: "equipmentCatalog.items.microfono-inalambrico.specs.type",
      range: "equipmentCatalog.items.microfono-inalambrico.specs.range",
      batteryLife: "equipmentCatalog.items.microfono-inalambrico.specs.batteryLife",
    },
    description: "equipmentCatalog.items.microfono-inalambrico.description",
    condition: "excellent",
  },
  {
    id: "tripodes",
    name: "equipmentCatalog.items.tripodes.name",
    category: "accessory",
    quantity: 4,
    specs: {
      height: "equipmentCatalog.items.tripodes.specs.height",
      type: "equipmentCatalog.items.tripodes.specs.type",
      material: "equipmentCatalog.items.tripodes.specs.material",
    },
    description: "equipmentCatalog.items.tripodes.description",
    condition: "excellent",
  },
  {
    id: "cableado-profesional",
    name: "equipmentCatalog.items.cableado-profesional.name",
    category: "accessory",
    quantity: 1, // Set completo
    specs: {
      includes: "equipmentCatalog.items.cableado-profesional.specs.includes",
      length: "equipmentCatalog.items.cableado-profesional.specs.length",
    },
    description: "equipmentCatalog.items.cableado-profesional.description",
    condition: "excellent",
  },
  {
    id: "atrezzo-mon-magic",
    name: "equipmentCatalog.items.atrezzo-mon-magic.name",
    category: "other",
    quantity: 1, // Set completo
    specs: {
      includes: "equipmentCatalog.items.atrezzo-mon-magic.specs.includes",
      theme: "equipmentCatalog.items.atrezzo-mon-magic.specs.theme",
    },
    description: "equipmentCatalog.items.atrezzo-mon-magic.description",
    condition: "excellent",
  },
  {
    id: "atrezzo-halloween",
    name: "equipmentCatalog.items.atrezzo-halloween.name",
    category: "other",
    quantity: 1, // Set completo
    specs: {
      includes: "equipmentCatalog.items.atrezzo-halloween.specs.includes",
      theme: "equipmentCatalog.items.atrezzo-halloween.specs.theme",
    },
    description: "equipmentCatalog.items.atrezzo-halloween.description",
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



export function getLocalizedEquipmentCatalog(locale: string): Equipment[] {
  return ALL_EQUIPMENT.map((item) => ({
    ...item,
    name: resolveEquipmentCatalogKey(item.name, locale) || item.name,
    description: resolveEquipmentCatalogKey(item.description, locale) || item.description,
    specs: resolveLocalizedSpecs(item.specs, locale),
  }));
}

function resolveLocalizedSpecs(specs: Equipment['specs'] | undefined, locale: string): Equipment['specs'] | undefined {
  if (!specs) return specs;
  return Object.fromEntries(
    Object.entries(specs).map(([key, value]) => [key, resolveEquipmentCatalogKey(value, locale) || value])
  );
}
