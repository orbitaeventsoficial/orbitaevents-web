export type ImageManagerSectionId = 'home' | 'services' | 'themes' | 'portfolio' | 'seo' | 'layout' | 'dossier';

export interface ImageManagerSection {
  id: ImageManagerSectionId;
  name: string;
  icon: string;
  description: string;
}

export interface ImagePlacementDefinition {
  key: string;
  section: ImageManagerSectionId;
  label: string;
  description: string;
  /** Component, config file or function that consumes this image */
  target: string;
  /**
   * La imatge que es fa servir ara mateix quan la casella és buida, si el codi
   * en porta cap. Serveix perquè la targeta pugui ensenyar què hi ha abans de
   * canviar-ho: fins ara deia «auto» i prou, i no hi havia manera de saber si
   * el web ensenya alguna cosa o no ensenya res.
   */
  fallback?: string;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export const IMAGE_MANAGER_SECTIONS: ImageManagerSection[] = [
  {
    id: 'home',
    name: 'Home',
    icon: '🏠',
    description: 'Hero, targetes de serveis, portfolio showcase i logos de clients.',
  },
  {
    id: 'services',
    name: 'Serveis',
    icon: '🎯',
    description: 'Heroes, galeries i OG de cada servei base i landings zonals.',
  },
  {
    id: 'themes',
    name: 'Temàtiques',
    icon: '🎃',
    description: 'Halloween, Món Màgic i altres experiències temàtiques.',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '🖼️',
    description: 'Cobertes de categoria i galeries del portfolio públic.',
  },
  {
    id: 'seo',
    name: 'SEO / OG',
    icon: '🔍',
    description: 'Open Graph, Twitter Card i imatges representatives per compartir.',
  },
  {
    id: 'layout',
    name: 'Layout / Marca',
    icon: '🎨',
    description: 'Logos, favicons, PWA icons i assets de marca globals.',
  },
  {
    id: 'dossier',
    name: 'Dossier',
    icon: '📄',
    description: 'La portada del dossier i la foto de cada servei propi. Arrossega-hi una imatge i surt al document que rep el client.',
  },
];

// ---------------------------------------------------------------------------
// Placements — inventari real auditat 2026-04-02
// ---------------------------------------------------------------------------

export const IMAGE_MANAGER_PLACEMENTS: ImagePlacementDefinition[] = [
  // ── HOME ──────────────────────────────────────────────────────────────
  {
    key: 'home.hero.slides',
    section: 'home',
    label: 'Home · hero slides',
    description: 'Carrusel principal (5 imatges + 1 vídeo). Fallback des de HERO_MEDIA_DEFAULT_ITEMS si l\'API no retorna res.',
    target: 'HeroElegant / MobileHeroUltimate',
  },
  {
    key: 'home.servicesCards.bodas',
    section: 'home',
    label: 'Home mòbil · targeta Bodes',
    description: 'Imatge principal de la card mòbil de bodes.',
    target: 'MobileServicesCards · FALLBACK_SERVICE_IMAGES',
    fallback: '/img/portfolio/bodas/bodas-01.avif',
  },
  {
    key: 'home.servicesCards.halloween',
    section: 'home',
    label: 'Home mòbil · targeta Halloween',
    description: 'Imatge principal de la card mòbil de Halloween.',
    target: 'MobileServicesCards · FALLBACK_SERVICE_IMAGES',
    fallback: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif',
  },
  {
    key: 'home.servicesCards.monmagic',
    section: 'home',
    label: 'Home mòbil · targeta Món Màgic',
    description: 'Imatge principal de la card mòbil de Món Màgic.',
    target: 'MobileServicesCards · FALLBACK_SERVICE_IMAGES',
  },
  {
    key: 'home.servicesCards.fiestas',
    section: 'home',
    label: 'Home mòbil · targeta Festes',
    description: 'Imatge principal de la card mòbil de festes.',
    target: 'MobileServicesCards · FALLBACK_SERVICE_IMAGES',
    fallback: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
  },
  {
    key: 'home.servicesCards.empresas',
    section: 'home',
    label: 'Home mòbil · targeta Empreses',
    description: 'Imatge principal de la card mòbil d\'empreses.',
    target: 'MobileServicesCards · FALLBACK_SERVICE_IMAGES',
    fallback: '/img/portfolio/eventos-empresa/eventos-empresa-02.avif',
  },
  {
    key: 'home.portfolioShowcase',
    section: 'home',
    label: 'Home · portfolio showcase',
    description: 'Stories de portfolio (6 categories, 4-10 fotos cadascuna). Des de PORTFOLIO_IMAGES config.',
    target: 'PortfolioShowcase / MobilePortfolioShowcase',
  },
  {
    key: 'home.clientLogos',
    section: 'home',
    label: 'Home · logos de clients',
    description: '9 logos de clients en marquee (client-logos.ts → TrustedByLogos).',
    target: 'TrustedByLogos · CLIENT_LOGOS',
  },

  // ── SERVICES ──────────────────────────────────────────────────────────
  {
    key: 'services.bodas.hero',
    section: 'services',
    label: 'Serveis · hero Bodes',
    description: 'Hero i OG de /servicios/bodas i landings zonals dj-bodas-*.',
    target: 'getPublicServiceHeroImage(bodas)',
  },
  {
    key: 'services.fiestas.hero',
    section: 'services',
    label: 'Serveis · hero Festes',
    description: 'Hero i OG de /servicios/fiestas.',
    target: 'getPublicServiceHeroImage(fiestas)',
  },
  {
    key: 'services.empresas.hero',
    section: 'services',
    label: 'Serveis · hero Empreses',
    description: 'Hero i OG de /servicios/empresas.',
    target: 'getPublicServiceHeroImage(empresas)',
  },
  {
    key: 'services.discomovil.hero',
    section: 'services',
    label: 'Serveis · hero Discomòbil',
    description: 'Hero i OG de /servicios/discomovil i landings zonals discomovil-*.',
    target: 'getPublicServiceHeroImage(discomovil)',
  },
  {
    key: 'services.bodas.gallery',
    section: 'services',
    label: 'Serveis · galeria Bodes',
    description: 'Galeria de fotos a pàgines zonals dj-bodas-*.',
    target: 'getPublicServiceGalleryImages(bodas)',
  },
  {
    key: 'services.discomovil.gallery',
    section: 'services',
    label: 'Serveis · galeria Discomòbil',
    description: 'Galeria de fotos a pàgines zonals discomovil-*.',
    target: 'getPublicServiceGalleryImages(discomovil)',
  },
  {
    key: 'services.fiestas.gallery',
    section: 'services',
    label: 'Serveis · galeria Festes',
    description: 'Galeria de fotos a pàgines zonals dj-fiestas-*.',
    target: 'getPublicServiceGalleryImages(fiestas)',
  },

  // ── THEMES ────────────────────────────────────────────────────────────
  {
    key: 'themes.halloween.hero',
    section: 'themes',
    label: 'Temàtiques · hero Halloween',
    description: 'Hero principal, OG i card mòbil de tematica-halloween. Constant PUBLIC_HALLOWEEN_HERO_IMAGE.',
    target: 'tematica-halloween/page.tsx · PUBLIC_HALLOWEEN_HERO_IMAGE',
    fallback: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-15.avif',
  },
  {
    key: 'themes.halloween.gallery',
    section: 'themes',
    label: 'Temàtiques · galeria Halloween',
    description: '6 imatges seleccionades (PUBLIC_HALLOWEEN_GALLERY_SELECTION) + DB gallery.',
    target: 'tematica-halloween/page.tsx · PUBLIC_HALLOWEEN_GALLERY_SELECTION',
  },
  {
    key: 'themes.monmagic.hero',
    section: 'themes',
    label: 'Temàtiques · hero Món Màgic',
    description: 'Hero principal i OG de tematica-mon-magic. Constant PUBLIC_MON_MAGIC_IMAGES.hero.',
    target: 'tematica-mon-magic/page.tsx · PUBLIC_MON_MAGIC_IMAGES',
    fallback: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-18.avif',
  },
  {
    key: 'themes.monmagic.featured',
    section: 'themes',
    label: 'Temàtiques · featured Món Màgic',
    description: 'Imatge destacada (.featured) de la pàgina Mon Màgic.',
    target: 'tematica-mon-magic/page.tsx · PUBLIC_MON_MAGIC_IMAGES.featured',
    fallback: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-16.avif',
  },
  {
    key: 'themes.monmagic.cartell',
    section: 'themes',
    label: 'Temàtiques · cartell Món Màgic',
    description: 'Cartell promocional de Món Màgic.',
    target: 'tematica-mon-magic/page.tsx · PUBLIC_MON_MAGIC_IMAGES.cartell',
    fallback: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-02.avif',
  },
  {
    key: 'themes.monmagic.gallery',
    section: 'themes',
    label: 'Temàtiques · galeria Món Màgic',
    description: 'Imatges decoratives (mussolDecoratiu, taulaCompleta, gabiaPerga, llegintCarta).',
    target: 'tematica-mon-magic/page.tsx · PUBLIC_MON_MAGIC_IMAGES.*',
  },

  // ── PORTFOLIO ─────────────────────────────────────────────────────────
  {
    key: 'portfolio.category.bodas.cover',
    section: 'portfolio',
    label: 'Portfolio · coberta Bodes',
    description: 'Coberta de la categoria Bodes al portfolio públic.',
    target: 'portfolio-images.ts · PORTFOLIO_CATEGORIES',
  },
  {
    key: 'portfolio.category.discomovil.cover',
    section: 'portfolio',
    label: 'Portfolio · coberta Discomòbil',
    description: 'Coberta de la categoria Discomòbil al portfolio públic.',
    target: 'portfolio-images.ts · PORTFOLIO_CATEGORIES',
  },
  {
    key: 'portfolio.category.fiestas-privadas.cover',
    section: 'portfolio',
    label: 'Portfolio · coberta Festes Privades',
    description: 'Coberta de la categoria Festes Privades al portfolio públic.',
    target: 'portfolio-images.ts · PORTFOLIO_CATEGORIES',
  },
  {
    key: 'portfolio.category.eventos-empresa.cover',
    section: 'portfolio',
    label: 'Portfolio · coberta Empreses',
    description: 'Coberta de la categoria Esdeveniments Empresa.',
    target: 'portfolio-images.ts · PORTFOLIO_CATEGORIES',
  },
  {
    key: 'portfolio.category.fiestas-infantiles.cover',
    section: 'portfolio',
    label: 'Portfolio · coberta Festes Infantils',
    description: 'Coberta de la categoria Festes Infantils.',
    target: 'portfolio-images.ts · PORTFOLIO_CATEGORIES',
  },
  {
    key: 'portfolio.category.produccion-tecnica.cover',
    section: 'portfolio',
    label: 'Portfolio · coberta Producció Tècnica',
    description: 'Coberta de la categoria Producció Tècnica.',
    target: 'portfolio-images.ts · PORTFOLIO_CATEGORIES',
  },
  {
    key: 'portfolio.category.alquiler-equipo.cover',
    section: 'portfolio',
    label: 'Portfolio · coberta Lloguer d\'Equip',
    description: 'Coberta de la categoria Lloguer d\'Equip.',
    target: 'portfolio-images.ts · PORTFOLIO_CATEGORIES',
  },
  {
    key: 'portfolio.category.halloween.cover',
    section: 'portfolio',
    label: 'Portfolio · coberta Halloween',
    description: 'Coberta de la categoria Festes Temàtiques Halloween.',
    target: 'portfolio-images.ts · PORTFOLIO_CATEGORIES',
  },
  {
    key: 'portfolio.category.monmagic.cover',
    section: 'portfolio',
    label: 'Portfolio · coberta Món Màgic',
    description: 'Coberta de la categoria Festes Temàtiques Món Màgic.',
    target: 'portfolio-images.ts · PORTFOLIO_CATEGORIES',
  },

  // ── SEO / OG ──────────────────────────────────────────────────────────
  {
    key: 'seo.og.default',
    section: 'seo',
    label: 'SEO · OG per defecte',
    description: 'Imatge general /og-default.jpg. Usada a layout.tsx, home, blog index i qualsevol pàgina sense OG específic.',
    target: 'layout.tsx · app/[locale]/layout.tsx · SITE_CONFIG.web.ogImage',
  },
  {
    key: 'seo.og.halloween',
    section: 'seo',
    label: 'SEO · OG Halloween',
    description: 'OG de la pàgina temàtica Halloween (reutilitza hero image).',
    target: 'tematica-halloween/page.tsx · openGraph',
  },
  {
    key: 'seo.og.monmagic',
    section: 'seo',
    label: 'SEO · OG Món Màgic',
    description: 'OG de la pàgina temàtica Món Màgic (reutilitza hero image).',
    target: 'tematica-mon-magic/page.tsx · openGraph',
  },

  // ── LAYOUT / MARCA ────────────────────────────────────────────────────
  {
    key: 'layout.logo.header',
    section: 'layout',
    label: 'Layout · logo header',
    description: 'Logo principal al HeaderChampion i footer: /img/logoplanetatextdreta.svg.',
    target: 'HeaderChampion.tsx · footer.tsx',
  },
  {
    key: 'layout.logo.admin',
    section: 'layout',
    label: 'Layout · logo admin sidebar',
    description: 'Icona del sidebar admin: /img/logosoloplaneta.svg.',
    target: 'admin/layout.tsx',
  },
  {
    key: 'layout.favicon.main',
    section: 'layout',
    label: 'Layout · favicon principal',
    description: 'favicon.ico + favicon.svg + PNG variants (16, 32, 48, 192, 512).',
    target: 'app/layout.tsx · manifest.webmanifest',
  },
  {
    key: 'layout.favicon.halloween',
    section: 'layout',
    label: 'Layout · favicon Halloween',
    description: 'Favicon SVG temàtic per pàgines Halloween.',
    target: 'tematica-halloween/page.tsx · boda-halloween/page.tsx',
  },
  {
    key: 'layout.favicon.monmagic',
    section: 'layout',
    label: 'Layout · favicon Món Màgic',
    description: 'Favicon SVG temàtic per la pàgina Món Màgic.',
    target: 'tematica-mon-magic/page.tsx',
  },
  {
    key: 'layout.appleTouchIcon',
    section: 'layout',
    label: 'Layout · Apple Touch Icon',
    description: 'Icona iOS 180x180 /apple-touch-icon.png.',
    target: 'app/layout.tsx',
  },

  // ── DOSSIER ───────────────────────────────────────────────────────────
  // El document que rep el client. Cada servei propi té la seva casella:
  // s'hi arrossega una foto i surt al dossier; canviar-la és arrossegar-n'hi
  // una altra.
  //
  // Els serveis de col·laborador no hi són: la seva foto viu a la fitxa del
  // producte, al catàleg de proveïdors. Dues caselles per a la mateixa imatge
  // serien dues veritats.
  {
    key: 'dossier.portada',
    section: 'dossier',
    label: 'Dossier · portada',
    description: 'El fons de la primera pàgina, darrere el nom del client. Horitzontal i fosca: a sobre hi va text en blanc.',
    target: 'dossier-html-builder · capçal',
    fallback: '/img/dossier/portada.jpg',
  },
  {
    key: 'dossier.orbita:dj-primera-hora',
    section: 'dossier',
    label: 'Dossier · DJ',
    description: 'La cabina en marxa, amb gent ballant. Horitzontal.',
    target: 'dossier-html-builder · fitxa',
    fallback: '/img/dossier/dj.jpg',
  },
  {
    key: 'dossier.orbita:bombolles',
    section: 'dossier',
    label: 'Dossier · màquina de bombolles',
    description: 'Bombolles sobre la pista. Horitzontal.',
    target: 'dossier-html-builder · fitxa',
    fallback: '/img/dossier/bombolles.jpg',
  },
  {
    key: 'dossier.orbita:pont-llums-caps-mobils',
    section: 'dossier',
    label: 'Dossier · pont de llums',
    description: 'El pont de caps mòbils encès. Horitzontal.',
    target: 'dossier-html-builder · fitxa',
    fallback: '/img/dossier/pont-llums.jpg',
  },
  {
    key: 'dossier.orbita:candybar-halloween',
    section: 'dossier',
    label: 'Dossier · candybar de Halloween',
    description: 'La taula parada amb la gàbia, les teranyines i els calderons. Horitzontal.',
    target: 'dossier-html-builder · fitxa',
  },
  {
    key: 'dossier.orbita:deco-estand-dj-halloween',
    section: 'dossier',
    label: 'Dossier · decoració de l’estand de DJ',
    description: 'Els fantasmes gegants sobre la cabina, amb el fum baix. Horitzontal.',
    target: 'dossier-html-builder · fitxa',
  },
];
