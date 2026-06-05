import { ALL_SERVICES, type ServiceSlug } from '@/app/config/packs-config';
import { ANIMACIO_PRODUCT_IDS as ANIMACIO_PRODUCT_ID_VALUES } from '@/lib/constants/animacio-products';

const SERVICE_IDS = new Set<string>(ALL_SERVICES);
const ANIMACIO_PRODUCT_IDS = new Set<string>(ANIMACIO_PRODUCT_ID_VALUES);

function normalizeCatalogServiceId(value: string): string {
  return value.trim().replace(/^(service|catalog|cataleg):/i, '');
}

export function isCatalogServiceSlug(value: string): value is ServiceSlug {
  return SERVICE_IDS.has(normalizeCatalogServiceId(value));
}

export function resolveDossierCatalogServices(productIds: string[]): ServiceSlug[] {
  const services = new Set<ServiceSlug>();

  productIds.forEach((rawId) => {
    const id = normalizeCatalogServiceId(rawId);
    if (SERVICE_IDS.has(id)) {
      services.add(id as ServiceSlug);
      return;
    }
    if (ANIMACIO_PRODUCT_IDS.has(id)) {
      services.add('animacion');
    }
  });

  return ALL_SERVICES.filter((service) => services.has(service));
}
