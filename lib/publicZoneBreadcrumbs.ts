export type PublicZoneBreadcrumbService = 'bodas' | 'discomovil' | 'fiestas';

export type PublicZoneBreadcrumbItem = {
  name: string;
  url: string;
};

type PublicZoneBreadcrumbServiceMeta = {
  navKey: 'weddings' | 'discomovil' | 'parties';
  basePath: string;
};

const PUBLIC_ZONE_BREADCRUMB_SERVICE_META: Record<PublicZoneBreadcrumbService, PublicZoneBreadcrumbServiceMeta> = {
  bodas: { navKey: 'weddings', basePath: '/servicios/bodas' },
  discomovil: { navKey: 'discomovil', basePath: '/servicios/discomovil' },
  fiestas: { navKey: 'parties', basePath: '/servicios/fiestas' },
};

export type PublicZoneBreadcrumbInput = {
  service: PublicZoneBreadcrumbService;
  zoneSlug: string;
  breadcrumbLabel: string;
  tCommon: (key: string) => string;
};

export function buildPublicZoneBreadcrumbs({
  service,
  zoneSlug,
  breadcrumbLabel,
  tCommon,
}: PublicZoneBreadcrumbInput): PublicZoneBreadcrumbItem[] {
  const meta = PUBLIC_ZONE_BREADCRUMB_SERVICE_META[service];
  return [
    { name: tCommon('nav.home'), url: '/' },
    { name: tCommon('nav.services'), url: '/servicios' },
    { name: tCommon(`nav.${meta.navKey}`), url: meta.basePath },
    { name: breadcrumbLabel, url: `/servicios/${zoneSlug}` },
  ];
}
