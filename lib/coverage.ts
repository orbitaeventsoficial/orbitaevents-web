import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { isBuildPrerenderPhase } from '@/lib/build-phase';

export interface CoverageArea {
  city: string;
  province: string;
  enabled: boolean;
}

const SETTING_KEY = 'coverage.areas';

const DEFAULT_AREAS: CoverageArea[] = [
  { city: 'Barcelona', province: 'Barcelona', enabled: true },
  { city: 'Hospitalet de Llobregat', province: 'Barcelona', enabled: true },
  { city: 'Badalona', province: 'Barcelona', enabled: true },
  { city: 'Sabadell', province: 'Barcelona', enabled: true },
  { city: 'Terrassa', province: 'Barcelona', enabled: true },
  { city: 'Girona', province: 'Girona', enabled: true },
  { city: 'Tarragona', province: 'Tarragona', enabled: true },
  { city: 'Lleida', province: 'Lleida', enabled: true },
];

export const COVERAGE_PROVINCES = [
  'Barcelona',
  'Girona',
  'Tarragona',
  'Lleida',
  'Madrid',
  'Valencia',
  'Alicante',
  'Murcia',
  'Castellón',
] as const;

const ZONE_RULES: Array<{ slug: string; matcher: (values: string[]) => boolean }> = [
  { slug: 'dj-bodas-girona', matcher: (values) => values.includes('girona') },
  { slug: 'dj-bodas-barcelona-ciudad', matcher: (values) => values.includes('barcelona') },
  { slug: 'dj-bodas-valles', matcher: (values) => values.some((v) => ['sabadell', 'terrassa', 'granollers', 'valles', 'valles occidental', 'valles oriental'].includes(v)) },
  { slug: 'dj-bodas-maresme', matcher: (values) => values.some((v) => ['maresme', 'mataro', 'calella', 'arenys de mar', 'pineda de mar'].includes(v)) },
  { slug: 'dj-bodas-costa-brava', matcher: (values) => values.some((v) => ['costa brava', 'girona', 'blanes', 'lloret de mar', 'palamos', 'palafrugell'].includes(v)) },
  { slug: 'dj-bodas-baix-llobregat', matcher: (values) => values.some((v) => ['baix llobregat', 'hospitalet de llobregat', 'cornella de llobregat', 'el prat de llobregat', 'sant boi de llobregat'].includes(v)) },
  { slug: 'dj-bodas-garraf', matcher: (values) => values.some((v) => ['garraf', 'sitges', 'vilanova i la geltru'].includes(v)) },
  { slug: 'dj-bodas-penedes', matcher: (values) => values.some((v) => ['penedes', 'vilafranca del penedes', 'sant sadurni d anoia'].includes(v)) },
  { slug: 'dj-bodas-osona', matcher: (values) => values.some((v) => ['osona', 'vic', 'manlleu'].includes(v)) },
  { slug: 'dj-bodas-selva', matcher: (values) => values.some((v) => ['selva', 'blanes', 'lloret de mar', 'santa coloma de farners'].includes(v)) },
  { slug: 'dj-bodas-emporda', matcher: (values) => values.some((v) => ['emporda', 'figueres', 'la bisbal d emporda', 'roses', 'palafrugell'].includes(v)) },
  { slug: 'discomovil-barcelona', matcher: (values) => values.includes('barcelona') },
  { slug: 'discomovil-maresme', matcher: (values) => values.some((v) => ['maresme', 'mataro', 'calella', 'arenys de mar', 'pineda de mar'].includes(v)) },
  { slug: 'discomovil-girona', matcher: (values) => values.includes('girona') },
  { slug: 'discomovil-valles', matcher: (values) => values.some((v) => ['sabadell', 'terrassa', 'granollers', 'valles', 'valles occidental', 'valles oriental'].includes(v)) },
  { slug: 'dj-fiestas-barcelona', matcher: (values) => values.includes('barcelona') },
  { slug: 'dj-fiestas-maresme', matcher: (values) => values.some((v) => ['maresme', 'mataro', 'calella', 'arenys de mar', 'pineda de mar'].includes(v)) },
  { slug: 'dj-fiestas-costa-brava', matcher: (values) => values.some((v) => ['costa brava', 'girona', 'blanes', 'lloret de mar', 'palamos', 'palafrugell'].includes(v)) },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeCoverageAreas(areas: CoverageArea[]): CoverageArea[] {
  return areas
    .filter((area) => area?.city && area?.province)
    .map((area) => ({
      city: String(area.city).trim(),
      province: String(area.province).trim(),
      enabled: area.enabled !== false,
    }));
}

export async function getCoverageAreas(): Promise<CoverageArea[]> {
  if (isBuildPrerenderPhase()) {
    return DEFAULT_AREAS;
  }

  try {
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!setting?.value) return DEFAULT_AREAS;

    const parsed = JSON.parse(setting.value) as CoverageArea[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_AREAS;

    return sanitizeCoverageAreas(parsed);
  } catch (error) {
    log.error('Error reading coverage areas', error);
    return DEFAULT_AREAS;
  }
}

export async function ensureCoverageAreasSetting(input: { label: string; description: string }) {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (setting?.value) {
    return getCoverageAreas();
  }

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: JSON.stringify(DEFAULT_AREAS),
      type: 'JSON',
      category: 'config',
      label: input.label,
      description: input.description,
    },
    update: {
      value: JSON.stringify(DEFAULT_AREAS),
      type: 'JSON',
      category: 'config',
      label: input.label,
      description: input.description,
    },
  });

  return DEFAULT_AREAS;
}

export async function saveCoverageAreas(areas: CoverageArea[], input: { label: string; description: string }) {
  const sanitized = sanitizeCoverageAreas(areas);

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: JSON.stringify(sanitized),
      type: 'JSON',
      category: 'config',
      label: input.label,
      description: input.description,
    },
    update: {
      value: JSON.stringify(sanitized),
      type: 'JSON',
      category: 'config',
      label: input.label,
      description: input.description,
    },
  });

  return sanitized;
}

export async function updateCoverageAreas(input: {
  action: string;
  city: string;
  province?: string;
  enabled?: boolean;
  label: string;
  description: string;
}) {
  let areas = await getCoverageAreas();

  switch (input.action) {
    case 'add': {
      const exists = areas.some((area) => area.city === input.city);
      if (exists) {
        return { status: 400, body: { ok: false, error: 'city_exists' } };
      }
      areas = areas.concat({ city: input.city, province: input.province || '', enabled: true });
      break;
    }
    case 'remove': {
      areas = areas.filter((area) => area.city !== input.city);
      break;
    }
    case 'toggle': {
      areas = areas.map((area) =>
        area.city === input.city ? { ...area, enabled: Boolean(input.enabled) } : area,
      );
      break;
    }
    default:
      return { status: 400, body: { ok: false, error: 'invalid_action' } };
  }

  const savedAreas = await saveCoverageAreas(areas, {
    label: input.label,
    description: input.description,
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'coverage',
      entityId: 'coverage.areas',
      details: {
        action: input.action,
        city: input.city,
        province: input.province,
        enabled: input.enabled,
      },
    },
  });

  return { status: 200, body: { ok: true, areas: savedAreas } };
}

export async function getEnabledCoverageAreas(): Promise<CoverageArea[]> {
  const areas = await getCoverageAreas();
  return areas.filter((area) => area.enabled);
}

export async function getEnabledCoverageCities(): Promise<string[]> {
  const enabled = await getEnabledCoverageAreas();
  return Array.from(new Set(enabled.map((area) => area.city)));
}

export async function getEnabledZoneLandingSlugs(): Promise<string[]> {
  const enabled = await getEnabledCoverageAreas();
  const normalizedValues = Array.from(
    new Set(enabled.flatMap((area) => [normalize(area.city), normalize(area.province)]))
  );

  return ZONE_RULES.filter((rule) => rule.matcher(normalizedValues)).map((rule) => rule.slug);
}

export const WEDDING_COVERAGE_ZONE_DEFINITIONS = [
  {
    href: '/servicios/dj-bodas-maresme',
    icon: '🏖️',
    nameKey: 'coverage.zones.maresme.name',
    descKey: 'coverage.zones.maresme.desc',
    fallbackName: 'Maresme',
    fallbackDesc: 'Bodas frente al mar y fincas costeras',
  },
  {
    href: '/servicios/dj-bodas-girona',
    icon: '🏛️',
    nameKey: 'coverage.zones.girona.name',
    descKey: 'coverage.zones.girona.desc',
    fallbackName: 'Girona',
    fallbackDesc: 'Masías, castillos y eventos elegantes',
  },
  {
    href: '/servicios/dj-bodas-costa-brava',
    icon: '🌊',
    nameKey: 'coverage.zones.costaBrava.name',
    descKey: 'coverage.zones.costaBrava.desc',
    fallbackName: 'Costa Brava',
    fallbackDesc: 'Celebraciones junto al mar con montaje completo',
  },
  {
    href: '/servicios/dj-bodas-valles',
    icon: '🏡',
    nameKey: 'coverage.zones.valles.name',
    descKey: 'coverage.zones.valles.desc',
    fallbackName: 'Vallès',
    fallbackDesc: 'Bodas en jardines, masías y espacios privados',
  },
] as const;
