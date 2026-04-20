export type ServiceHubKey = 'bodas' | 'fiestas' | 'discomovil' | 'empresas';

export type ServiceHubSeoConfig = {
  keywords: string[];
  jsonLd: {
    name: string;
    description: (minPrice: number) => string;
    serviceType: string[];
    areaServed: string[];
    availability?: string;
    offerUrlPrefix: string;
  };
};

export const SERVICE_HUB_SEO: Record<ServiceHubKey, ServiceHubSeoConfig> = {
  bodas: {
    keywords: [
      'dj bodas barcelona',
      'dj boda girona',
      'dj bodas maresme',
      'dj bodas costa brava',
      'sonido bodas',
      'musica boda',
      'efectos especiales bodas',
    ],
    jsonLd: {
      name: 'Experiencia Completa para Bodas',
      description: (minPrice) => `Experiencia completa personalizada para bodas: DJ profesional, sonido EV 4.000W, iluminación de ambiente y efectos especiales adaptados a vuestra historia. Packs desde ${minPrice}€.`,
      serviceType: ['DJ para bodas', 'Sonido e iluminación bodas', 'Producción musical bodas', 'Efectos especiales bodas', 'Animación bodas'],
      areaServed: ['Barcelona', 'Girona', 'Costa Brava', 'Maresme'],
      offerUrlPrefix: '/servicios/bodas#',
    },
  },
  fiestas: {
    keywords: [
      'fiestas privadas barcelona',
      'dj cumpleaños barcelona',
      'dj fiestas barcelona',
      'despedidas barcelona',
      'fiestas temáticas barcelona',
      'dj fiestas girona',
      'cumpleaños con dj',
      'fiesta halloween barcelona',
    ],
    jsonLd: {
      name: 'Fiestas Privadas Completas y Personalizadas',
      description: (minPrice) => `Experiencias completas para fiestas privadas: desde cumpleaños temáticos hasta celebraciones familiares. DJ profesional, sonido 4.000W, iluminación LED, animación y juegos adaptados a todos los invitados. Tematización completa disponible (Halloween, años 80, mundo mágico, tropical). Desde ${minPrice}€.`,
      serviceType: ['DJ para fiestas', 'Fiestas privadas', 'Cumpleaños temáticos', 'Despedidas', 'Fiestas temáticas', 'Animación fiestas', 'Iluminación LED'],
      areaServed: ['Barcelona', 'Girona', 'Costa Brava', 'Maresme'],
      availability: 'https://schema.org/InStock',
      offerUrlPrefix: '/servicios/fiestas#',
    },
  },
  discomovil: {
    keywords: ['discomóvil barcelona', 'discomóvil girona', 'dj fiestas privadas barcelona', 'discomóvil cumpleaños', 'discomóvil bodas'],
    jsonLd: {
      name: 'Discomóvil Completa - Experiencia Personalizada',
      description: (minPrice) => `Experiencia completa personalizada: DJ profesional, sonido EV profesional, iluminación LED ambiente y efectos especiales. Packs desde ${minPrice}€.`,
      serviceType: ['Discomóvil', 'DJ para fiestas', 'DJ bodas', 'DJ cumpleaños', 'Iluminación LED', 'Efectos especiales'],
      areaServed: ['Barcelona', 'Girona', 'Costa Brava', 'Maresme'],
      availability: 'https://schema.org/InStock',
      offerUrlPrefix: '/servicios/discomovil#',
    },
  },
  empresas: {
    keywords: [
      'eventos corporativos barcelona',
      'dj eventos empresa barcelona',
      'team building barcelona',
      'cenas de empresa barcelona',
      'eventos empresariales',
      'presentaciones corporativas',
      'dj empresa girona',
    ],
    jsonLd: {
      name: 'Eventos Corporativos Profesionales con Toque Humano',
      description: (_minPrice) => 'Eventos corporativos que refuerzan tu marca: cenas de empresa, team building, presentaciones y networking elegante. Producción técnica profesional con sonido Pioneer + EV y coordinación completa.',
      serviceType: ['Eventos corporativos', 'Team building', 'Cenas de empresa', 'Eventos empresariales', 'Networking empresarial', 'Presentaciones corporativas'],
      areaServed: ['Barcelona', 'Girona', 'Costa Brava', 'Maresme'],
      availability: 'https://schema.org/InStock',
      offerUrlPrefix: '/servicios/empresas#',
    },
  },
};
