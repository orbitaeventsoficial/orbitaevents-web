import 'server-only';
import { getTranslations } from 'next-intl/server';
import { formatCurrency, toIntlLocale } from '@/lib/constants';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import type { DossierCopy } from '@/lib/utils/dossier-html-builder';
import {
  DJ_FIRST_HOUR_PRICE,
  DJ_EXTRA_HOUR_PRICE,
  ORBITA_SERVICES,
} from '@/lib/constants/orbita-services';

/**
 * Textos marc del dossier resolts des de `messages.dossier.*` (font única
 * canònica, editable a /admin/text-manager → secció Dossiers). El builder
 * (`buildDossierHtml`) consumeix aquest objecte; no porta cap string.
 */
export async function getDossierCopy(locale = 'ca'): Promise<DossierCopy> {
  const t = await getTranslations({ locale, namespace: 'dossier' });
  return {
    portada: t.raw('portada') as DossierCopy['portada'],
    intro: t.raw('intro') as DossierCopy['intro'],
    chapter: t.raw('chapter') as DossierCopy['chapter'],
    resum: t.raw('resum') as DossierCopy['resum'],
    budget: t.raw('budget') as DossierCopy['budget'],
    cta: t.raw('cta') as DossierCopy['cta'],
  };
}

/**
 * Capítols propis d'Òrbita al dossier (DJ, bombolles, llums, operari). Textos
 * des de `messages.dossier.ownProducts.*` (els preus de DJ s'interpolen amb la
 * veritat absoluta `DJ_FIRST_HOUR_PRICE`/`DJ_EXTRA_HOUR_PRICE`). El preu i la
 * categoria són domini estructural; els textos, monocapa a messages.
 */
type OwnProductDef = { msgKey: string; serviceId: string; categoria: string; image?: string };

const ORBITA_DOSSIER_PRODUCTS: ReadonlyArray<{ id: string } & OwnProductDef> = [
  { id: 'orbita:dj-primera-hora', msgKey: 'dj-primera-hora', serviceId: 'dj-primera-hora', categoria: 'DJ', image: '/img/portfolio/discomovil/discomovil-01.avif' },
  { id: 'orbita:bombolles', msgKey: 'bombolles', serviceId: 'bombolles', categoria: 'Efectes' },
  { id: 'orbita:pont-llums-caps-mobils', msgKey: 'pont-llums-caps-mobils', serviceId: 'caps-mobils', categoria: 'Llums', image: '/img/portfolio/produccion-tecnica/produccion-tecnica-01.avif' },
  { id: 'orbita:operari-extra', msgKey: 'operari-extra', serviceId: 'operari-extra', categoria: 'Operativa' },
];

export async function getOrbitaDossierProducts(locale = 'ca'): Promise<AnimacioProduct[]> {
  const t = await getTranslations({ locale, namespace: 'dossier.ownProducts' });
  const intl = toIntlLocale(locale);
  const firstHourLabel = formatCurrency(DJ_FIRST_HOUR_PRICE, intl);
  const extraHourLabel = formatCurrency(DJ_EXTRA_HOUR_PRICE, intl);
  const interp = (value: string) =>
    value.replace(/\{first\}/g, firstHourLabel).replace(/\{extra\}/g, extraHourLabel);

  const byId = new Map(ORBITA_SERVICES.map((service) => [service.id, service]));

  return ORBITA_DOSSIER_PRODUCTS.flatMap((def) => {
    const service = byId.get(def.serviceId);
    if (!service) return [];
    const raw = t.raw(def.msgKey) as { nom: string; descripcio: string[]; inclou: string[] };
    return [{
      id: def.id,
      nom: raw.nom,
      descripcio: (raw.descripcio ?? []).map(interp),
      inclou: (raw.inclou ?? []).map(interp),
      priceFrom: service.defaultPrice,
      categoria: def.categoria,
      image: def.image,
      sourceProviderName: 'Òrbita Events',
    } as AnimacioProduct];
  });
}
