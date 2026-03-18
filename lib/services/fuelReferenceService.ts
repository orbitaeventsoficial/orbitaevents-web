import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import {
  DEFAULT_VEHICLE_COST_PER_KM,
  DEFAULT_VEHICLE_CONSUMPTION_L100,
  DEFAULT_MAINTENANCE_COST_PER_KM,
  calculateEffectiveVehicleCostPerKm,
} from '@/lib/services/travelCost';

const SETTING_COST_KEY = 'finance.fuel.costPerKm';
const SETTING_UPDATED_AT_KEY = 'finance.fuel.updatedAt';
const SETTING_PRICE_KEY = 'finance.fuel.pricePerLiter';
const SETTING_CONSUMPTION_KEY = 'finance.fuel.vehicleConsumptionL100';
const STALE_MS = 24 * 60 * 60 * 1000;
const OFFICIAL_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

function parseCommaNumber(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.replace(',', '.').trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, n) => acc + n, 0) / values.length;
}

async function saveSettingNumber(key: string, value: number, label: string, description: string) {
  await prisma.setting.upsert({
    where: { key },
    create: {
      key,
      value: value.toFixed(4),
      type: 'NUMBER',
      category: 'finance',
      label,
      description,
    },
    update: {
      value: value.toFixed(4),
      type: 'NUMBER',
      category: 'finance',
      label,
      description,
    },
  });
}

async function saveSettingString(key: string, value: string, label: string, description: string) {
  await prisma.setting.upsert({
    where: { key },
    create: {
      key,
      value,
      type: 'STRING',
      category: 'finance',
      label,
      description,
    },
    update: {
      value,
      type: 'STRING',
      category: 'finance',
      label,
      description,
    },
  });
}

async function getVehicleConsumptionL100(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_CONSUMPTION_KEY } });
  const value = Number(setting?.value || '7.5');
  return Number.isFinite(value) && value > 0 ? value : 7.5;
}

export async function refreshFuelReferenceNow(): Promise<{
  costPerKm: number;
  pricePerLiter: number;
  sourceDate: string | null;
}> {
  const response = await fetch(OFFICIAL_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`FUEL_REFERENCE_HTTP_${response.status}`);
  }

  const data = await response.json() as {
    Fecha?: string;
    ListaEESSPrecio?: Array<Record<string, unknown>>;
  };

  const rows = Array.isArray(data.ListaEESSPrecio) ? data.ListaEESSPrecio : [];
  const prices = rows
    .map((row) => parseCommaNumber(row['Precio Gasolina 95 E5']))
    .filter((v): v is number => typeof v === 'number' && v > 0);

  if (!prices.length) {
    throw new Error('FUEL_REFERENCE_NO_VALID_PRICES');
  }

  const pricePerLiter = average(prices);
  const consumptionL100 = await getVehicleConsumptionL100();
  const costPerKm = Number(((pricePerLiter * consumptionL100) / 100).toFixed(4));
  const nowIso = new Date().toISOString();

  await Promise.all([
    saveSettingNumber(
      SETTING_PRICE_KEY,
      pricePerLiter,
      'Preu combustible (referència)',
      'Mitjana gasolina 95 E5 (font oficial MITECO)'
    ),
    saveSettingNumber(
      SETTING_COST_KEY,
      costPerKm,
      'Cost intern €/km',
      'Cost intern calculat diàriament segons combustible i consum del vehicle'
    ),
    saveSettingString(
      SETTING_UPDATED_AT_KEY,
      nowIso,
      'Actualització cost combustible',
      'Data d’última actualització automàtica de referència de combustible'
    ),
  ]);

  return {
    costPerKm,
    pricePerLiter: Number(pricePerLiter.toFixed(4)),
    sourceDate: data.Fecha || null,
  };
}


type FuelRefreshSummary = {
  generatedAt: string;
  costPerKm: number;
  pricePerLiter: number;
  sourceDate: string | null;
};

export async function runFuelDailyRefresh(): Promise<FuelRefreshSummary> {
  const refreshed = await refreshFuelReferenceNow();
  const summary: FuelRefreshSummary = {
    generatedAt: new Date().toISOString(),
    costPerKm: refreshed.costPerKm,
    pricePerLiter: refreshed.pricePerLiter,
    sourceDate: refreshed.sourceDate,
  };

  await prisma.adminLog.create({
    data: {
      action: 'AUTOMATION_FUEL_REFRESH',
      entity: 'automation',
      entityId: 'fuel-daily',
      details: summary,
    },
  });

  return summary;
}
export async function getFuelCostPerKmReference(): Promise<{
  costPerKm: number;
  updatedAt: string | null;
}> {
  const [costSetting, updatedAtSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: SETTING_COST_KEY } }),
    prisma.setting.findUnique({ where: { key: SETTING_UPDATED_AT_KEY } }),
  ]);

  const costValue = Number(costSetting?.value || NaN);
  const updatedAt = updatedAtSetting?.value || null;
  const stale = !updatedAt || (Date.now() - new Date(updatedAt).getTime()) > STALE_MS;
  const invalidCost = !Number.isFinite(costValue) || costValue <= 0;

  if (stale || invalidCost) {
    try {
      const refreshed = await refreshFuelReferenceNow();
      return {
        costPerKm: refreshed.costPerKm,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      log.error('[FuelReference] Error refrescant preu combustible:', error);
      return {
        costPerKm: Number.isFinite(costValue) && costValue > 0 ? costValue : DEFAULT_VEHICLE_COST_PER_KM,
        updatedAt,
      };
    }
  }

  return {
    costPerKm: costValue,
    updatedAt,
  };
}

/**
 * Retorna el cost efectiu per km del vehicle, derivat de:
 * - Preu combustible MITECO (BD) o fallback
 * - Consum configurat del vehicle (L/100km)
 * - Cost manteniment/amortització per km (configurable a economia)
 */
export async function getEffectiveVehicleCostPerKm(): Promise<{
  costPerKm: number;
  fuelPricePerLiter: number;
  consumptionL100: number;
  maintenanceCostPerKm: number;
  updatedAt: string | null;
}> {
  const [priceSetting, consumptionSetting, maintenanceSetting, updatedAtSetting] =
    await Promise.all([
      prisma.setting.findUnique({ where: { key: SETTING_PRICE_KEY } }),
      prisma.setting.findUnique({ where: { key: SETTING_CONSUMPTION_KEY } }),
      prisma.setting.findUnique({ where: { key: 'finance.vehicle.maintenanceCostPerKm' } }),
      prisma.setting.findUnique({ where: { key: SETTING_UPDATED_AT_KEY } }),
    ]);

  const fuelPricePerLiter = Number(priceSetting?.value || NaN);
  const consumptionL100 = Number(consumptionSetting?.value || NaN);
  const maintenanceCostPerKm = Number(maintenanceSetting?.value || NaN);

  const safeFuelPrice = Number.isFinite(fuelPricePerLiter) && fuelPricePerLiter > 0
    ? fuelPricePerLiter
    : 0;
  const safeConsumption = Number.isFinite(consumptionL100) && consumptionL100 > 0
    ? consumptionL100
    : DEFAULT_VEHICLE_CONSUMPTION_L100;
  const safeMaintenance = Number.isFinite(maintenanceCostPerKm) && maintenanceCostPerKm >= 0
    ? maintenanceCostPerKm
    : DEFAULT_MAINTENANCE_COST_PER_KM;

  // Si no tenim preu MITECO, retornem el fallback clàssic
  if (safeFuelPrice === 0) {
    return {
      costPerKm: DEFAULT_VEHICLE_COST_PER_KM,
      fuelPricePerLiter: 0,
      consumptionL100: safeConsumption,
      maintenanceCostPerKm: safeMaintenance,
      updatedAt: null,
    };
  }

  const costPerKm = calculateEffectiveVehicleCostPerKm(
    safeFuelPrice,
    safeConsumption,
    safeMaintenance,
  );

  return {
    costPerKm,
    fuelPricePerLiter: safeFuelPrice,
    consumptionL100: safeConsumption,
    maintenanceCostPerKm: safeMaintenance,
    updatedAt: updatedAtSetting?.value || null,
  };
}


