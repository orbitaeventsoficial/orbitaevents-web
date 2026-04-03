export const PUBLIC_SERVICE_MEDIA_CONFIG = {
  servicios: {
    portfolioSlug: 'fiestas-privadas',
    fallbackImage: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
  },
  bodas: {
    portfolioSlug: 'bodas',
    fallbackImage: '/img/portfolio/bodas/bodas-01.avif',
  },
  discomovil: {
    portfolioSlug: 'discomovil',
    fallbackImage: '/img/portfolio/discomovil/discomovil-01.avif',
  },
  fiestas: {
    portfolioSlug: 'fiestas-privadas',
    fallbackImage: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
  },
  halloween: {
    portfolioSlug: 'fiestas-tematicas-halloween',
    fallbackImage: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif',
  },
  monmagic: {
    portfolioSlug: 'fiestas-tematicas-mon-magic',
    fallbackImage: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-hero.avif',
  },
  empresas: {
    portfolioSlug: 'eventos-empresa',
    fallbackImage: '/img/portfolio/eventos-empresa/eventos-empresa-02.avif',
  },
} as const;

export type PublicServiceMediaKey = keyof typeof PUBLIC_SERVICE_MEDIA_CONFIG;
export type PublicMobileServiceCardId = 'bodas' | 'halloween' | 'monmagic' | 'fiestas' | 'empresas';
