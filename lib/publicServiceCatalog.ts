export type PublicServiceTier = 'core' | 'satellite' | 'seo_only';

export type PublicServiceCatalogItem = {
  key: string;
  href: string;
  popular: boolean;
  icon: string;
  emoji: string;
  tier: PublicServiceTier;
  showInServicesPage: boolean;
  novelty?: boolean;
};

type PublicCoreServiceKey = 'bodas' | 'discomovil' | 'fiestas' | 'empresas' | 'animacion';

export type PublicCoreServiceNavItem = {
  key: PublicCoreServiceKey;
  href: string;
  icon: string;
  headerDescKey: `${PublicCoreServiceKey}Desc`;
  footerNameKey: 'djWeddings' | 'discomovil' | 'privateParties' | 'corporateEvents' | 'animacion';
  notFoundLabelKey: 'djWeddings' | 'discomovil' | 'parties' | 'corporate' | 'animacion';
};

export const PUBLIC_SERVICE_CATALOG: PublicServiceCatalogItem[] = [
  { key: 'bodas', href: '/servicios/bodas', popular: true, icon: 'heart', emoji: '💍', tier: 'core', showInServicesPage: true },
  { key: 'animacion', href: '/servicios/animacion', popular: true, icon: 'mic', emoji: '🎤', tier: 'core', showInServicesPage: true, novelty: true },
  { key: 'discomovil', href: '/servicios/discomovil', popular: true, icon: 'music', emoji: '🎧', tier: 'core', showInServicesPage: true },
  { key: 'fiestas', href: '/servicios/fiestas', popular: false, icon: 'cake', emoji: '🎉', tier: 'core', showInServicesPage: true },
  { key: 'animacionInfantil', href: '/servicios/animacion-infantil', popular: false, icon: 'party', emoji: '🧒', tier: 'satellite', showInServicesPage: true },
  { key: 'empresas', href: '/servicios/empresas', popular: false, icon: 'briefcase', emoji: '💼', tier: 'core', showInServicesPage: true },
  { key: 'produccion', href: '/servicios/produccion', popular: false, icon: 'sparkles', emoji: '🎛️', tier: 'seo_only', showInServicesPage: false },
  { key: 'alquiler', href: '/servicios/alquiler', popular: false, icon: 'radio', emoji: '🔊', tier: 'seo_only', showInServicesPage: false },
];

const CORE_SERVICE_NAV_META: Record<PublicCoreServiceKey, Omit<PublicCoreServiceNavItem, 'key' | 'href'>> = {
  bodas: { icon: '💍', headerDescKey: 'bodasDesc', footerNameKey: 'djWeddings', notFoundLabelKey: 'djWeddings' },
  animacion: { icon: '🎤', headerDescKey: 'animacionDesc', footerNameKey: 'animacion', notFoundLabelKey: 'animacion' },
  discomovil: { icon: '🎵', headerDescKey: 'discomovilDesc', footerNameKey: 'discomovil', notFoundLabelKey: 'discomovil' },
  fiestas: { icon: '🎉', headerDescKey: 'fiestasDesc', footerNameKey: 'privateParties', notFoundLabelKey: 'parties' },
  empresas: { icon: '💼', headerDescKey: 'empresasDesc', footerNameKey: 'corporateEvents', notFoundLabelKey: 'corporate' },
};

function isPublicCoreServiceKey(key: string): key is PublicCoreServiceKey {
  return key in CORE_SERVICE_NAV_META;
}

export const PUBLIC_CORE_SERVICE_NAV: PublicCoreServiceNavItem[] = PUBLIC_SERVICE_CATALOG.reduce<PublicCoreServiceNavItem[]>((acc, service) => {
  if (service.tier !== 'core' || !isPublicCoreServiceKey(service.key)) {
    return acc;
  }

  acc.push({
    key: service.key,
    href: service.href,
    ...CORE_SERVICE_NAV_META[service.key],
  });

  return acc;
}, []);
