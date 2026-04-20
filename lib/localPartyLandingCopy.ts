export type LocalPartyLandingKey = 'dj-fiestas-barcelona' | 'dj-fiestas-baix-llobregat' | 'dj-fiestas-garraf' | 'dj-fiestas-girona' | 'dj-fiestas-maresme' | 'dj-fiestas-valles' | 'dj-fiestas-costa-brava';

export type LocalPartyLandingCopy = {
  metadata: {
    title: (minPrice: number) => string;
    description: (minPrice: number) => string;
    keywords: string[];
    ogTitle: (minPrice: number) => string;
    ogDescription: string;
    imageAlt: string;
  };
  breadcrumbLabel: string;
  serviceJsonLd: {
    name: string;
    description: (minPrice: number) => string;
    serviceType: string[];
  };
  zone: {
    heroTitle: string;
    heroSubtitle: string;
    highlights: string[];
    description: (minPrice: number) => string;
    whyChooseUs: string[];
  };
};

export const LOCAL_PARTY_LANDING_COPY: Record<LocalPartyLandingKey, LocalPartyLandingCopy> = {
  'dj-fiestas-barcelona': {
    metadata: {
      title: (minPrice) => `DJ Fiestas Barcelona | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para fiestas en Barcelona desde ${minPrice}€. Cumpleaños, aniversarios, despedidas y celebraciones privadas. Equipo profesional, presupuesto en 2h.`,
      keywords: ['DJ fiestas Barcelona', 'DJ fiesta cumpleaños Barcelona', 'DJ fiesta privada Barcelona', 'DJ Barcelona precio', 'contratar DJ Barcelona'],
      ogTitle: (minPrice) => `DJ Fiestas Barcelona | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas privadas en Barcelona. Cumpleaños, despedidas y celebraciones.',
      imageAlt: 'DJ Fiestas Barcelona - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Fiestas Barcelona',
    serviceJsonLd: {
      name: 'DJ Fiestas Barcelona',
      description: (minPrice) => `DJ profesional para fiestas privadas en Barcelona. Cumpleaños, despedidas y celebraciones. Desde ${minPrice}€.`,
      serviceType: ['DJ fiestas Barcelona', 'DJ cumpleaños Barcelona', 'DJ fiesta privada Barcelona'],
    },
    zone: {
      heroTitle: 'DJ Fiestas Barcelona',
      heroSubtitle: 'Cumpleaños · Despedidas · Aniversarios · Celebraciones Privadas',
      highlights: ['DJ fiestas Barcelona precio', 'DJ cumpleaños Barcelona', 'DJ fiesta privada Barcelona', 'contratar DJ Barcelona'],
      description: (_minPrice) => 'DJ profesional para todo tipo de fiestas en Barcelona. Equipo completo, open format y adaptación total a tu celebración.',
      whyChooseUs: [
        'Open format: Ponemos lo que tú y tus invitados queráis',
        'Desplazamiento incluido a Barcelona y área metropolitana',
        'Experiencia: Más de 200 fiestas privadas realizadas',
        'Flexibilidad: Nos adaptamos al espacio y al horario',
      ],
    },
  },
  'dj-fiestas-baix-llobregat': {
    metadata: {
      title: (minPrice) => `DJ Fiestas Baix Llobregat | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para fiestas en el Baix Llobregat desde ${minPrice}€. L'Hospitalet, Cornellà, Sant Boi, El Prat. Presupuesto en 2h.`,
      keywords: ['DJ fiestas Baix Llobregat', 'DJ fiestas Hospitalet', 'DJ fiestas Cornellà', 'DJ cumpleaños Baix Llobregat'],
      ogTitle: (minPrice) => `DJ Fiestas Baix Llobregat | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas privadas en el Baix Llobregat.',
      imageAlt: 'DJ Fiestas Baix Llobregat - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Fiestas Baix Llobregat',
    serviceJsonLd: {
      name: 'DJ Fiestas Baix Llobregat',
      description: (minPrice) => `DJ profesional para fiestas en el Baix Llobregat. Desde ${minPrice}€.`,
      serviceType: ['DJ fiestas Hospitalet', 'DJ fiestas Cornellà', 'DJ fiesta privada Baix Llobregat'],
    },
    zone: {
      heroTitle: 'DJ Fiestas Baix Llobregat',
      heroSubtitle: 'L\'Hospitalet · Cornellà · Sant Boi · Gavà · Viladecans',
      highlights: ['DJ fiestas Hospitalet', 'DJ fiestas Cornellà', 'DJ cumpleaños Baix Llobregat', 'contratar DJ Baix Llobregat'],
      description: (_minPrice) => 'DJ profesional para fiestas en el Baix Llobregat. Equipo completo, adaptable a cualquier espacio.',
      whyChooseUs: [
        'Proximitat: operem des de Barcelona, a 10-20 min de qualsevol punt',
        'Desplazamiento incluido sin coste extra',
        'Equipo profesional adaptable a interiores y exteriores',
        'Open format: tú decides el estilo musical',
      ],
    },
  },
  'dj-fiestas-garraf': {
    metadata: {
      title: (minPrice) => `DJ Fiestas Garraf | Sitges | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para fiestas en el Garraf desde ${minPrice}€. Sitges, Vilanova i la Geltrú. Fiestas privadas frente al mar.`,
      keywords: ['DJ fiestas Garraf', 'DJ fiestas Sitges', 'DJ fiesta privada Sitges', 'DJ cumpleaños Garraf', 'contratar DJ Sitges'],
      ogTitle: (minPrice) => `DJ Fiestas Garraf | Sitges | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas en Sitges y el Garraf. Celebraciones privadas frente al mar.',
      imageAlt: 'DJ Fiestas Garraf Sitges - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Fiestas Garraf',
    serviceJsonLd: {
      name: 'DJ Fiestas Garraf',
      description: (minPrice) => `DJ profesional para fiestas en el Garraf. Sitges, Vilanova. Desde ${minPrice}€.`,
      serviceType: ['DJ fiestas Sitges', 'DJ fiestas Garraf', 'DJ fiesta privada Sitges'],
    },
    zone: {
      heroTitle: 'DJ Fiestas Garraf · Sitges',
      heroSubtitle: 'Sitges · Vilanova i la Geltrú · Fiestas frente al mar',
      highlights: ['DJ fiestas Sitges', 'DJ fiesta privada Garraf', 'DJ cumpleaños Sitges', 'contratar DJ Garraf'],
      description: (_minPrice) => 'DJ profesional para fiestas en el Garraf. Sitges, Vilanova y costa. Celebraciones al aire libre con equipo pro.',
      whyChooseUs: [
        'Experiencia en eventos al aire libre frente al mar',
        'Equipo profesional resistente a exteriores',
        'Desplazamiento incluido a todo el Garraf',
        'Open format y flexibilidad horaria total',
      ],
    },
  },
  'dj-fiestas-girona': {
    metadata: {
      title: (minPrice) => `DJ Fiestas Girona | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para fiestas en Girona desde ${minPrice}€. Cumpleaños, aniversarios, despedidas y celebraciones privadas. Equipo profesional, presupuesto en 2h.`,
      keywords: ['DJ fiestas Girona', 'DJ fiesta cumpleaños Girona', 'DJ fiesta privada Girona', 'DJ Girona precio', 'contratar DJ Girona'],
      ogTitle: (minPrice) => `DJ Fiestas Girona | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas privadas en Girona. Cumpleaños, despedidas y celebraciones.',
      imageAlt: 'DJ Fiestas Girona - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Fiestas Girona',
    serviceJsonLd: {
      name: 'DJ Fiestas Girona',
      description: (minPrice) => `DJ profesional para fiestas privadas en Girona. Cumpleaños, despedidas y celebraciones. Desde ${minPrice}€.`,
      serviceType: ['DJ fiestas Girona', 'DJ cumpleaños Girona', 'DJ fiesta privada Girona'],
    },
    zone: {
      heroTitle: 'DJ Fiestas Girona',
      heroSubtitle: 'Cumpleaños · Despedidas · Aniversarios · Celebraciones Privadas',
      highlights: ['DJ fiestas Girona precio', 'DJ cumpleaños Girona', 'DJ fiesta privada Girona', 'contratar DJ Girona'],
      description: (_minPrice) => 'DJ profesional para todo tipo de fiestas en Girona y provincia. Equipo completo, open format y adaptación total a tu celebración.',
      whyChooseUs: [
        'Cobertura total de la provincia de Girona',
        'Desplazamiento incluido a cualquier punto',
        'Open format: ponemos la música que queráis',
        'Experiencia en espacios interiores y exteriores',
      ],
    },
  },
  'dj-fiestas-maresme': {
    metadata: {
      title: (minPrice) => `DJ Fiestas Maresme | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para fiestas en el Maresme desde ${minPrice}€. Mataró, Calella, Pineda y toda la costa. Cumpleaños, aniversarios y fiestas privadas con equipo profesional.`,
      keywords: ['DJ fiestas Maresme', 'DJ fiesta Mataró', 'DJ fiesta Calella', 'DJ cumpleaños Maresme', 'contratar DJ Maresme'],
      ogTitle: (minPrice) => `DJ Fiestas Maresme | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas en el Maresme. Mataró, Calella, Pineda y toda la costa.',
      imageAlt: 'DJ Fiestas Maresme - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Fiestas Maresme',
    serviceJsonLd: {
      name: 'DJ Fiestas Maresme',
      description: (minPrice) => `DJ profesional para fiestas privadas en el Maresme. Mataró, Calella y toda la costa. Desde ${minPrice}€.`,
      serviceType: ['DJ fiestas Maresme', 'DJ fiesta Mataró', 'DJ fiesta Calella Pineda'],
    },
    zone: {
      heroTitle: 'DJ Fiestas Maresme',
      heroSubtitle: 'Mataró · Calella · Pineda · Arenys · Canet · Malgrat',
      highlights: ['DJ fiestas Maresme precio', 'DJ fiesta Mataró', 'DJ cumpleaños Calella', 'DJ fiestas costa Maresme'],
      description: (_minPrice) => 'DJ profesional para fiestas privadas en el Maresme. Especialistas en fiestas de verano y celebraciones en la costa.',
      whyChooseUs: [
        'Conocemos el Maresme: Somos de la zona',
        'Fiestas de verano: Expertos en exterior y costa',
        'Desplazamiento incluido: Sin costes extra a la comarca',
        'Open format: La música que vosotros queráis',
      ],
    },
  },
  'dj-fiestas-valles': {
    metadata: {
      title: (minPrice) => `DJ Fiestas Vallès | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para fiestas en el Vallès desde ${minPrice}€. Sabadell, Terrassa, Granollers. Cumpleaños, despedidas y celebraciones privadas.`,
      keywords: ['DJ fiestas Vallès', 'DJ fiestas Sabadell', 'DJ fiestas Terrassa', 'DJ cumpleaños Vallès', 'contratar DJ Vallès'],
      ogTitle: (minPrice) => `DJ Fiestas Vallès | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas privadas en el Vallès. Sabadell, Terrassa, Granollers.',
      imageAlt: 'DJ Fiestas Vallès - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Fiestas Vallès',
    serviceJsonLd: {
      name: 'DJ Fiestas Vallès',
      description: (minPrice) => `DJ profesional para fiestas privadas en el Vallès. Sabadell, Terrassa, Granollers. Desde ${minPrice}€.`,
      serviceType: ['DJ fiestas Sabadell', 'DJ fiestas Terrassa', 'DJ fiesta privada Vallès'],
    },
    zone: {
      heroTitle: 'DJ Fiestas Vallès',
      heroSubtitle: 'Sabadell · Terrassa · Granollers · Sant Cugat',
      highlights: ['DJ fiestas Sabadell', 'DJ fiestas Terrassa', 'DJ cumpleaños Vallès', 'contratar DJ Vallès'],
      description: (_minPrice) => 'DJ profesional para fiestas en el Vallès Occidental i Oriental. Equipo completo, open format i adaptación total.',
      whyChooseUs: [
        'Cobertura de tot el Vallès (Occidental + Oriental)',
        'Desplazamiento incluido sin recargo',
        'Open format: el estilo que tú y tus invitados queráis',
        'Equipo profesional de 4000W para cualquier espacio',
      ],
    },
  },
  'dj-fiestas-costa-brava': {
    metadata: {
      title: (minPrice) => `DJ Fiestas Costa Brava | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para fiestas en la Costa Brava desde ${minPrice}€. Lloret de Mar, Tossa, Platja d'Aro, Roses y toda la costa. Equipo profesional resistente a exteriores.`,
      keywords: ['DJ fiestas Costa Brava', 'DJ fiesta Lloret de Mar', 'DJ fiesta Tossa de Mar', "DJ fiesta Platja d'Aro", 'DJ cumpleaños Costa Brava'],
      ogTitle: (minPrice) => `DJ Fiestas Costa Brava | Desde ${minPrice}€`,
      ogDescription: "DJ profesional para fiestas en la Costa Brava. Lloret, Tossa, Platja d'Aro y toda la costa.",
      imageAlt: 'DJ Fiestas Costa Brava - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Fiestas Costa Brava',
    serviceJsonLd: {
      name: 'DJ Fiestas Costa Brava',
      description: (minPrice) => `DJ profesional para fiestas privadas en la Costa Brava. Exterior, villas y terrazas. Desde ${minPrice}€.`,
      serviceType: ['DJ fiestas Costa Brava', 'DJ fiesta Lloret de Mar', 'DJ fiesta exterior Costa Brava'],
    },
    zone: {
      heroTitle: 'DJ Fiestas Costa Brava',
      heroSubtitle: "Lloret · Tossa · Platja d'Aro · Roses · Cadaqués · Palamós",
      highlights: ['DJ fiestas Costa Brava precio', 'DJ fiesta Lloret de Mar', 'DJ fiesta Tossa', 'DJ cumpleaños Costa Brava'],
      description: (_minPrice) => 'DJ profesional para fiestas privadas en la Costa Brava. Especialistas en exterior y fiestas de verano en la costa.',
      whyChooseUs: [
        'Expertos en exterior: Equipo resistente al mar',
        'Toda la Costa Brava cubierta: De Blanes a Cadaqués',
        'Desplazamiento incluido: Sin recargos por distancia',
        'Plan B preparado: Soluciones ante cambios de tiempo',
      ],
    },
  },
};
