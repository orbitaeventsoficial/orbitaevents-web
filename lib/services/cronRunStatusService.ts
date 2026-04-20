import { prisma } from '@/lib/prisma';

type CronRunStatus = 'ok' | 'error';
type SettingType = 'STRING' | 'JSON';
type CronHealth = 'ok' | 'warning' | 'error' | 'unknown';

type CronRunSnapshot = {
  lastRun: string | null;
  lastStatus: string | null;
  lastSummary: unknown;
  lastMessage: string | null;
  health: CronHealth;
};

async function upsertCronSetting(key: string, value: string, type: SettingType, category: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value, type, category },
    create: { key, value, type, category },
  });
}

function parseCronSummary(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function getCronHealth(lastRun: string | null, lastStatus: string | null, now: Date = new Date()): CronHealth {
  if (!lastRun) return 'unknown';
  if (lastStatus === 'error') return 'error';

  const hoursSinceRun = (now.getTime() - new Date(lastRun).getTime()) / (1000 * 60 * 60);
  return hoursSinceRun <= 26 ? 'ok' : 'warning';
}

export async function saveCronRunStatus(input: {
  prefix: string;
  status: CronRunStatus;
  summary?: unknown;
  message?: string;
  category?: string;
  timestamp?: string;
}): Promise<void> {
  const {
    prefix,
    status,
    summary,
    message,
    category = 'automation',
    timestamp = new Date().toISOString(),
  } = input;

  await Promise.all([
    upsertCronSetting(`${prefix}.lastRun`, timestamp, 'STRING', category),
    upsertCronSetting(`${prefix}.lastStatus`, status, 'STRING', category),
    ...(summary !== undefined ? [upsertCronSetting(`${prefix}.lastSummary`, JSON.stringify(summary), 'JSON', category)] : []),
    ...(message ? [upsertCronSetting(`${prefix}.lastMessage`, message, 'STRING', category)] : []),
  ]);
}

export async function readCronRunStatus(prefix: string, now?: Date): Promise<CronRunSnapshot> {
  const [snapshot] = await readCronRunStatuses([{ prefix }], now);
  return snapshot;
}

export async function readCronRunStatuses<T extends { prefix: string }>(definitions: T[], now: Date = new Date()): Promise<Array<T & CronRunSnapshot>> {
  if (definitions.length === 0) {
    return [];
  }

  const keys = definitions.flatMap((item) => [
    `${item.prefix}.lastRun`,
    `${item.prefix}.lastStatus`,
    `${item.prefix}.lastSummary`,
    `${item.prefix}.lastMessage`,
  ]);

  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });

  const settingsMap = Object.fromEntries(settings.map((item) => [item.key, item.value]));

  return definitions.map((definition) => {
    const lastRun = settingsMap[`${definition.prefix}.lastRun`] || null;
    const lastStatus = settingsMap[`${definition.prefix}.lastStatus`] || null;
    const lastMessage = settingsMap[`${definition.prefix}.lastMessage`] || null;
    const lastSummary = parseCronSummary(settingsMap[`${definition.prefix}.lastSummary`] || null);

    return {
      ...definition,
      lastRun,
      lastStatus,
      lastSummary,
      lastMessage,
      health: getCronHealth(lastRun, lastStatus, now),
    };
  });
}
