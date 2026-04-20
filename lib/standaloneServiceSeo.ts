export type StandaloneServiceKey = 'alquiler' | 'produccion' | 'animacion-infantil';

export type StandaloneServiceSeoConfig = {
  metadata: {
    title?: string;
    description?: string;
    openGraphTitle?: string;
    openGraphDescription?: string;
    openGraphImage?: string;
    openGraphImageAlt?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    keywords?: string[];
  };
  jsonLd: {
    name: string;
    description: string;
    serviceType: string[];
    areaServed: string[];
    priceFrom?: string;
    priceCurrency: string;
    availability?: string;
  };
};

export const STANDALONE_SERVICE_SEO: Record<StandaloneServiceKey, StandaloneServiceSeoConfig> = {
  alquiler: {
    metadata: {},
    jsonLd: {
      name: 'Alquiler de Equipo de Sonido e Iluminación',
      description: 'Alquiler profesional de equipo de sonido (4000W EV ETX) e iluminación LED para eventos. Con o sin técnico. Toda Catalunya.',
      serviceType: ['Alquiler equipo sonido', 'Alquiler iluminación eventos', 'Alquiler material audiovisual'],
      areaServed: ['Barcelona', 'Girona', 'Tarragona', 'Lleida', 'Granollers', 'Mataró', 'Sabadell', 'Terrassa'],
      priceCurrency: 'EUR',
    },
  },
  produccion: {
    metadata: {},
    jsonLd: {
      name: 'Producción Técnica de Eventos',
      description: 'Producción técnica profesional para eventos. Equipo de sonido e iluminación con técnico incluido. Desde 600€.',
      serviceType: ['Producción técnica eventos', 'Alquiler equipo sonido con técnico', 'Técnico sonido eventos'],
      areaServed: ['Barcelona', 'Girona', 'Tarragona', 'Lleida', 'Granollers', 'Sabadell', 'Terrassa', 'Mataró'],
      priceFrom: '600',
      priceCurrency: 'EUR',
    },
  },
  'animacion-infantil': {
    metadata: {
      title: 'Animació Infantil Barcelona | Festes Infantils Professionals | Òrbita Events',
      description: 'Animació infantil professional per a festes, comunions i esdeveniments. Jocs, pintacares, màgia, globoflèxia, tallers i música infantil. Barcelona i Girona.',
      openGraphTitle: 'Animació Infantil | Festes per als Més Petits',
      openGraphDescription: 'Animadors professionals per a festes infantils. Jocs, màgia, pintacares, globoflèxia i molt més. Diversió garantida!',
      openGraphImage: '/api/og?title=Animacio%20Infantil%20Barcelona',
      openGraphImageAlt: 'Animació infantil amb jocs i activitats',
      twitterTitle: 'Animació Infantil | Festes Infantils Barcelona',
      twitterDescription: 'Animadors professionals + Jocs + Màgia + Pintacares + Globoflèxia. Festes inoblidables per als petits!',
      twitterImage: '/api/og?title=Animacio%20Infantil',
      keywords: [
        'animació infantil Barcelona',
        'festes infantils Girona',
        'animadors infantils',
        'pintacares Barcelona',
        'màgia infantil',
        'globoflèxia festes',
        'jocs infantils',
        'comunions Barcelona',
        'festes aniversari nens',
        'tallers infantils',
      ],
    },
    jsonLd: {
      name: 'Animació Infantil Professional',
      description: 'Servei d\'animació infantil complet: jocs, pintacares, màgia, globoflèxia, tallers creatius i música infantil. Animadors professionals per a festes d\'aniversari, comunions i esdeveniments familiars. Barcelona i Girona.',
      serviceType: ['Animació infantil', 'Festes infantils', 'Pintacares', 'Màgia infantil', 'Globoflèxia', 'Tallers creatius', 'Jocs infantils'],
      areaServed: ['Barcelona', 'Girona', 'Maresme', 'Vallès'],
      priceFrom: '150',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
  },
};
