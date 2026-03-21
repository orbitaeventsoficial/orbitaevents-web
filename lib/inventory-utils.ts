// lib/inventory-utils.ts
// Utilitats per a la gestió d'inventari: codis automàtics, càlculs d'amortització, durades

import { InventoryCategory } from '@prisma/client';

/**
 * Mapa de prefixos per categoria d'inventari
 */
export const CATEGORY_PREFIX: Record<InventoryCategory, string> = {
  SOUND: 'SON',
  LIGHTING: 'LUM',
  EFFECTS: 'EFX',
  STRUCTURE: 'EST',
  CABLING: 'CAB',
  TECH: 'TEC',
  DECORATION_HP: 'DHP',
  DECORATION_HW: 'DHW',
  DECORATION_GEN: 'DGE',
  CONSUMABLE: 'CON',
};

/**
 * Genera el pròxim codi automàtic per una categoria.
 * Busca l'últim codi amb el prefix corresponent i incrementa.
 * Ex: SON-003 → SON-004
 */
export function generateNextCode(
  category: InventoryCategory,
  existingCodes: string[]
): string {
  const prefix = CATEGORY_PREFIX[category];
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);

  let maxNum = 0;
  for (const code of existingCodes) {
    const match = code.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Calcula la duració d'un event en hores a partir de startTime i endTime.
 * Suporta horaris que creuen mitjanit (ex: 22:00 - 03:00 = 5h).
 */
export function calculateEventDuration(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Si l'hora final és menor que la inicial, creua mitjanit
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return (endMinutes - startMinutes) / 60;
}

/**
 * Calcula el valor actual d'un element (amortització lineal).
 * Retorna 0 si ja ha superat la vida útil.
 */
export function calculateCurrentValue(
  purchasePrice: number | null | undefined,
  totalHoursUsed: number,
  expectedLifeHours: number | null | undefined
): number {
  if (!purchasePrice || purchasePrice <= 0) return 0;
  const lifeHours = expectedLifeHours || 2000;
  const ratio = Math.max(0, 1 - totalHoursUsed / lifeHours);
  return Math.round(purchasePrice * ratio * 100) / 100;
}

/**
 * Calcula el cost per hora d'un element.
 */
export function calculateCostPerHour(
  purchasePrice: number | null | undefined,
  expectedLifeHours: number | null | undefined
): number {
  if (!purchasePrice || purchasePrice <= 0) return 0;
  const lifeHours = expectedLifeHours || 2000;
  return Math.round((purchasePrice / lifeHours) * 100) / 100;
}

/**
 * Calcula el percentatge de vida restant.
 */
export function calculateLifeRemainingPercent(
  totalHoursUsed: number,
  expectedLifeHours: number | null | undefined
): number {
  const lifeHours = expectedLifeHours || 2000;
  return Math.max(0, Math.round((1 - totalHoursUsed / lifeHours) * 100));
}

/**
 * Configuració de categories amb etiquetes en català
 */
export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  SOUND: { label: 'So', icon: '🔊', color: 'blue' },
  LIGHTING: { label: 'Il·luminació', icon: '💡', color: 'yellow' },
  EFFECTS: { label: 'Efectes', icon: '✨', color: 'purple' },
  STRUCTURE: { label: 'Estructura', icon: '🏗️', color: 'gray' },
  CABLING: { label: 'Cablejat', icon: '🔌', color: 'orange' },
  TECH: { label: 'Tecnologia', icon: '💻', color: 'indigo' },
  DECORATION_HP: { label: 'Deco HP', icon: '🎃', color: 'orange' },
  DECORATION_HW: { label: 'Deco HW', icon: '🎄', color: 'red' },
  DECORATION_GEN: { label: 'Deco General', icon: '🎨', color: 'pink' },
  CONSUMABLE: { label: 'Consumibles', icon: '📦', color: 'green' },
};

export const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  AVAILABLE: { label: 'Disponible', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  IN_USE: { label: 'En ús', bg: 'bg-blue-500/20', text: 'text-blue-300' },
  MAINTENANCE: { label: 'Manteniment', bg: 'bg-orange-500/20', text: 'text-orange-300' },
  BROKEN: { label: 'Avariat', bg: 'bg-rose-500/20', text: 'text-rose-300' },
  RETIRED: { label: 'Retirat', bg: 'bg-slate-500/20', text: 'text-slate-400' },
};


export function getInventoryCategoryDisplay(category: string) {
  return CATEGORY_CONFIG[category] || { label: category, icon: '📦', color: 'gray' };
}

export function getInventoryStatusDisplay(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.AVAILABLE;
}

export function getInventoryConditionLabel(condition: string) {
  return CONDITION_LABELS[condition] || condition;
}

export const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Nou',
  EXCELLENT: 'Excel·lent',
  GOOD: 'Bo',
  FAIR: 'Acceptable',
  POOR: 'Dolent',
};
