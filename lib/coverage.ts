import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

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

const ZONE_RULES: Array<{ slug: string; matcher: (values: string[]) => boolean }> = [
  // DJ Bodas
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
  // Discomóvil
  { slug: 'discomovil-barcelona', matcher: (values) => values.includes('barcelona') },
  { slug: 'discomovil-maresme', matcher: (values) => values.some((v) => ['maresme', 'mataro', 'calella', 'arenys de mar', 'pineda de mar'].includes(v)) },
  { slug: 'discomovil-girona', matcher: (values) => values.includes('girona') },
  { slug: 'discomovil-valles', matcher: (values) => values.some((v) => ['sabadell', 'terrassa', 'granollers', 'valles', 'valles occidental', 'valles oriental'].includes(v)) },
  // DJ Fiestas
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

export async function getCoverageAreas(): Promise<CoverageArea[]> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!setting?.value) return DEFAULT_AREAS;

    const parsed = JSON.parse(setting.value) as CoverageArea[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_AREAS;

    return parsed.filter((area) => area?.city && area?.province);
  } catch (error) {
    log.error('Error reading coverage areas', error);
    return DEFAULT_AREAS;
  }
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

