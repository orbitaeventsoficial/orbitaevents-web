import { ADMIN_FEATURE_DEFINITIONS } from '@/lib/constants/admin';
import { prisma } from '@/lib/prisma';

type FeatureKey = typeof ADMIN_FEATURE_DEFINITIONS[number]['key'];

function getFeatureDefinition(key: string) {
  return ADMIN_FEATURE_DEFINITIONS.find((feature) => feature.key === key);
}

export async function listAdminFeatures() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ADMIN_FEATURE_DEFINITIONS.map((feature) => feature.key),
      },
    },
  });

  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value === 'true']));

  return ADMIN_FEATURE_DEFINITIONS.map((feature) => ({
    ...feature,
    enabled: settingsMap.get(feature.key) ?? true,
  }));
}

export async function updateAdminFeature(input: { key: string; enabled: boolean }) {
  const definition = getFeatureDefinition(input.key);
  if (!definition) {
    throw new Error('Funcionalitat no vàlida');
  }

  await prisma.setting.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      value: String(input.enabled),
      type: 'BOOLEAN',
      category: 'config',
      label: definition.label,
      description: definition.description,
    },
    update: {
      value: String(input.enabled),
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'feature',
      entityId: input.key,
      details: { enabled: input.enabled },
    },
  });
}

export function isAdminFeatureKey(key: string): key is FeatureKey {
  return ADMIN_FEATURE_DEFINITIONS.some((feature) => feature.key === key);
}
