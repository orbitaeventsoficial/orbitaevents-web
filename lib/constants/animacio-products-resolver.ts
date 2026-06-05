import 'server-only';
import { getTranslations } from 'next-intl/server';
import { ANIMACIO_PRODUCTS_STRUCTURE, ANIMACIO_PRODUCT_IDS, resolveAnimacioPriceFrom, type AnimacioProduct } from './animacio-products';

/** Retorna els productes d'animació amb textos del JSON i estructura de preus del fitxer de constants. */
export async function getAnimacioProducts(locale = 'ca'): Promise<AnimacioProduct[]> {
  const t = await getTranslations({ locale, namespace: 'animacioProducts' });

  return ANIMACIO_PRODUCT_IDS.map((id) => {
    const structure = ANIMACIO_PRODUCTS_STRUCTURE.find((s) => s.id === id)!;
    const tKey = id as string;

    const raw = t.raw(tKey) as Record<string, unknown>;
    const descripcio = Array.isArray(raw.descripcio) ? (raw.descripcio as string[]) : [];
    const inclou = Array.isArray(raw.inclou) ? (raw.inclou as string[]) : [];
    const noInclou = typeof raw.noInclou === 'string' ? raw.noInclou : undefined;
    const nom = typeof raw.nom === 'string' ? raw.nom : id;

    const trams = 'trams' in structure ? [...structure.trams] : undefined;
    const djOptions = 'djOptions' in structure ? [...structure.djOptions] : undefined;

    return {
      id,
      nom,
      descripcio,
      inclou,
      noInclou: noInclou || undefined,
      trams,
      djOptions,
      durada: 'durada' in structure ? structure.durada : undefined,
      priceFrom: resolveAnimacioPriceFrom({ trams, djOptions }),
    } as AnimacioProduct;
  });
}
