import { Prisma, SettingType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type SettingValue = string | number | boolean | object;
type SettingPayload = {
  key: string;
  value: SettingValue;
};

type CreateSettingInput = {
  key: string;
  value: SettingValue;
  type?: SettingType;
  category: string;
  label?: string;
  description?: string;
};

function parseSettingValue(value: string, type: string): SettingValue {
  if (type === 'NUMBER') return parseFloat(value);
  if (type === 'BOOLEAN') return value === 'true';
  if (type === 'JSON') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function stringifySettingValue(value: SettingValue): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export async function listAdminSettings(category?: string | null) {
  const settings = await prisma.setting.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });

  const settingsMap = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = {};
    acc[setting.category][setting.key] = parseSettingValue(setting.value, setting.type);
    return acc;
  }, {} as Record<string, Record<string, SettingValue>>);

  return {
    settings: category ? settingsMap[category] || {} : settingsMap,
    raw: settings,
  };
}

export async function updateAdminSettings(settings: SettingPayload[]) {
  const results = await Promise.all(
    settings.map(({ key, value }) =>
      prisma.setting.update({
        where: { key },
        data: { value: stringifySettingValue(value) },
      })
    )
  );

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'setting',
      details: { keys: settings.map((setting) => setting.key) } as unknown as Prisma.InputJsonValue,
    },
  });

  return results.length;
}

export async function createAdminSetting(input: CreateSettingInput) {
  return prisma.setting.create({
    data: {
      key: input.key,
      value: stringifySettingValue(input.value ?? ''),
      type: input.type || 'STRING',
      category: input.category,
      label: input.label,
      description: input.description,
    },
  });
}
