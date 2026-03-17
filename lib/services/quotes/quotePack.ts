import { getDbPackByCode, getDbPacks } from '@/lib/packs-db';
import type { PackDefinition } from '@/config/packs-config';

type QuotePack = {
  name: string;
  price: number;
  djHours: number;
  extraHourPrice: number;
  description: string;
};

function packToQuotePack(pack: PackDefinition | undefined): QuotePack {
  if (!pack) {
    return {
      name: 'Servei DJ Professional',
      price: 500,
      djHours: 4,
      extraHourPrice: 80,
      description: 'Servei DJ complet amb so i il·luminació',
    };
  }

  return {
    name: pack.name,
    price: pack.priceValue ?? 500,
    djHours: pack.durationHours ?? 4,
    extraHourPrice: 80,
    description: pack.emotion || pack.tagline || pack.name,
  };
}

export async function resolveQuotePack(packKey: string, locale = 'ca'): Promise<QuotePack> {
  const pack = await getDbPackByCode(packKey, locale);
  if (pack) return packToQuotePack(pack);

  const fallback = await getDbPacks({ service: 'fiestas', locale });
  return packToQuotePack(fallback[0]);
}

