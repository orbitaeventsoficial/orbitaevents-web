import { prisma } from '@/lib/prisma';

const AVAILABLE_FEATURES = [
  {
    key: 'features.reviews_enabled',
    label: 'Ressenyes públiques',
    description: 'Mostrar la secció de ressenyes i Google Reviews al web',
    icon: 'star',
  },
  {
    key: 'features.calendar_enabled',
    label: 'Calendari de disponibilitat',
    description: 'Mostrar calendari amb dates disponibles/ocupades',
    icon: 'calendar',
  },
  {
    key: 'features.offers_enabled',
    label: 'Ofertes especials',
    description: 'Mostrar secció d’ofertes i promocions',
    icon: 'gift',
  },
  {
    key: 'features.livechat_enabled',
    label: 'Live Chat',
    description: 'Activar xat en viu per a suport immediat',
    icon: 'chat',
  },
  {
    key: 'features.blog_enabled',
    label: 'Blog',
    description: 'Mostrar secció de blog i articles',
    icon: 'note',
  },
  {
    key: 'features.configurator_enabled',
    label: 'Configurador d’esdeveniments',
    description: 'Activar configurador interactiu d’esdeveniments',
    icon: 'controls',
  },
] as const;

type FeatureKey = typeof AVAILABLE_FEATURES[number]['key'];

function getFeatureDefinition(key: string) {
  return AVAILABLE_FEATURES.find((feature) => feature.key === key);
}

export async function listAdminFeatures() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: AVAILABLE_FEATURES.map((feature) => feature.key),
      },
    },
  });

  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value === 'true']));

  return AVAILABLE_FEATURES.map((feature) => ({
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
  return AVAILABLE_FEATURES.some((feature) => feature.key === key);
}
