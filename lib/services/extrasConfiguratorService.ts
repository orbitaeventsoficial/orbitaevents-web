import { EXTRAS, type ExtraDefinition } from '@/config/packs-config';
import { prisma } from '@/lib/prisma';
import { resolvePublicExtraDefinition } from '@/lib/services/publicExtrasService';

const SETTING_KEY = 'extras.configurator';

export function getDefaultExtrasConfig(): ExtraDefinition[] {
  return sanitizeExtrasConfig(EXTRAS);
}

function resolveAdminExtraText(extra: ExtraDefinition): Pick<ExtraDefinition, 'name' | 'description'> {
  const resolved = resolvePublicExtraDefinition(
    {
      slug: extra.id,
      price: typeof extra.price === 'number' ? extra.price : 0,
      priceType: extra.consultarPrecio ? 'ON_REQUEST' : 'FIXED',
      translationName: extra.name,
      translationDescription: extra.description,
    },
    'ca'
  );

  return {
    name: extra.name ? resolved.name : extra.name,
    description: extra.description ? resolved.description : extra.description,
  };
}

export function sanitizeExtrasConfig(input: unknown): ExtraDefinition[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((raw) => {
      const extra = raw as Partial<ExtraDefinition> | null | undefined;
      const sanitized: ExtraDefinition = {
        id: String(extra?.id || '').trim(),
        name: String(extra?.name || '').trim(),
        description: String(extra?.description || '').trim(),
        price: extra?.price ?? null,
        consultarPrecio: Boolean(extra?.consultarPrecio),
        icon: String(extra?.icon || '').trim(),
        category: extra?.category || 'other',
        compatibleWith: Array.isArray(extra?.compatibleWith) ? extra?.compatibleWith : undefined,
        popular: Boolean(extra?.popular),
        premium: Boolean(extra?.premium),
        enabled: extra?.enabled !== false,
      };
      const resolvedText = resolveAdminExtraText(sanitized);

      return {
        ...sanitized,
        ...resolvedText,
      };
    })
    .filter((extra) => extra.id && extra.name);
}

export async function getExtrasConfiguratorConfig(): Promise<{ config: ExtraDefinition[]; isDefault: boolean }> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting?.value) {
    return {
      config: getDefaultExtrasConfig(),
      isDefault: true,
    };
  }

  try {
    const parsed = JSON.parse(setting.value);
    return {
      config: sanitizeExtrasConfig(parsed),
      isDefault: false,
    };
  } catch {
    return {
      config: getDefaultExtrasConfig(),
      isDefault: true,
    };
  }
}

export async function saveExtrasConfiguratorConfig(input: unknown): Promise<ExtraDefinition[]> {
  const config = sanitizeExtrasConfig(input);

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: JSON.stringify(config),
      type: 'JSON',
      category: 'config',
      label: 'Extras configurador',
      description: 'Llistat d\'extras mostrat al configurador',
    },
    update: {
      value: JSON.stringify(config),
      type: 'JSON',
      category: 'config',
    },
  });

  return config;
}
