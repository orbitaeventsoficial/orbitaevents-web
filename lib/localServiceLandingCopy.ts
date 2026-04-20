export type LocalServiceLandingKey = 'dj-bodas-barcelona-ciudad' | 'discomovil-barcelona' | 'dj-bodas-baix-llobregat' | 'discomovil-maresme' | 'dj-bodas-girona' | 'discomovil-girona' | 'dj-bodas-costa-brava' | 'discomovil-costa-brava' | 'dj-bodas-garraf' | 'discomovil-garraf' | 'dj-bodas-valles' | 'discomovil-valles' | 'dj-bodas-penedes' | 'dj-bodas-selva' | 'dj-bodas-emporda' | 'dj-bodas-osona' | 'dj-bodas-maresme' | 'discomovil-baix-llobregat';

export type LocalServiceLandingCopy = {
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

export const LOCAL_SERVICE_LANDING_COPY: Record<LocalServiceLandingKey, LocalServiceLandingCopy> = {
  'dj-bodas-barcelona-ciudad': {
    metadata: {
      title: (minPrice) => `DJ Bodas Barcelona Ciudad | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en Barcelona ciudad desde ${minPrice}€. Eixample, Gràcia, Sarrià, Ciutat Vella. Desplazamiento incluido en toda la ciudad.`,
      keywords: ['DJ bodas Barcelona', 'DJ bodas Eixample', 'DJ bodas Gràcia', 'DJ bodas Sarrià', 'bodas Barcelona ciudad'],
      ogTitle: (minPrice) => `DJ Bodas Barcelona Ciudad | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en Barcelona ciudad. Todos los distritos con desplazamiento incluido.',
      imageAlt: 'DJ Bodas Barcelona Ciudad - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Barcelona Ciudad',
    serviceJsonLd: {
      name: 'DJ Bodas Barcelona Ciudad',
      description: (minPrice) => `DJ profesional para bodas en Barcelona ciudad. Desplazamiento incluido. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Barcelona', 'DJ bodas Eixample', 'DJ bodas Gràcia'],
    },
    zone: {
      heroTitle: 'DJ Bodas Barcelona Ciudad',
      heroSubtitle: 'Eixample · Gràcia · Sarrià · Ciutat Vella · Todos los distritos',
      highlights: ['DJ boda Barcelona', 'Precio DJ boda', 'Bodas hotel Barcelona', 'DJ rooftop Barcelona'],
      description: (minPrice) => `DJ profesional para bodas en Barcelona ciudad. Cubrimos todos los distritos con desplazamiento incluido desde ${minPrice}€.`,
      whyChooseUs: [
        'Toda la ciudad: Eixample, Gràcia, Sarrià y más',
        'Hoteles 5 estrellas: W Hotel, Arts, Mandarin Oriental...',
        'Espacios urbanos: Rooftops, restaurantes y terrazas',
        'Conocemos las normativas: Horarios y límites de ruido',
      ],
    },
  },
  'discomovil-barcelona': {
    metadata: {
      title: (minPrice) => `Discomóvil Barcelona | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `Discomóvil en Barcelona desde ${minPrice}€. DJ profesional para fiestas privadas, cumpleaños y celebraciones. Sonido 4000W + iluminación completa. Presupuesto en 2h.`,
      keywords: ['discomovil Barcelona', 'discomóvil precio Barcelona', 'DJ fiesta Barcelona', 'discomóvil cumpleaños Barcelona', 'alquiler discomovil Barcelona'],
      ogTitle: (minPrice) => `Discomóvil Barcelona | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas en Barcelona. Equipo completo de sonido e iluminación.',
      imageAlt: 'Discomóvil Barcelona - Òrbita Events',
    },
    breadcrumbLabel: 'Discomóvil Barcelona',
    serviceJsonLd: {
      name: 'Discomóvil Barcelona',
      description: (minPrice) => `Discomóvil profesional en Barcelona. DJ + equipo completo de sonido e iluminación. Desde ${minPrice}€.`,
      serviceType: ['Discomóvil Barcelona', 'DJ fiestas Barcelona', 'Discomóvil cumpleaños'],
    },
    zone: {
      heroTitle: 'Discomóvil Barcelona',
      heroSubtitle: 'Eixample · Gràcia · Sants · Horta · Área Metropolitana',
      highlights: ['Discomóvil Barcelona precio', 'DJ fiesta Barcelona', 'Discomóvil cumpleaños', 'DJ fiestas privadas Barcelona'],
      description: (minPrice) => `DJ profesional con discomóvil en Barcelona desde ${minPrice}€. Equipo completo de sonido e iluminación para cualquier celebración privada.`,
      whyChooseUs: [
        'Desplazamiento incluido: Sin costes extra a Barcelona',
        'Equipo profesional: Pioneer DDJ REV7 + 4000W EV ETX',
        'DJ adaptado: Open format para todos los gustos',
        'Montaje rápido: 45 minutos, sin complicaciones',
      ],
    },
  },
  'dj-bodas-baix-llobregat': {
    metadata: {
      title: (minPrice) => `DJ Bodas Baix Llobregat | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en el Baix Llobregat desde ${minPrice}€. Hospitalet, Cornellà, Sant Boi, El Prat. Desplazamiento incluido.`,
      keywords: ['DJ bodas Baix Llobregat', 'DJ bodas Hospitalet', 'DJ bodas Cornellà', 'DJ bodas Sant Boi', 'bodas Baix Llobregat'],
      ogTitle: (minPrice) => `DJ Bodas Baix Llobregat | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en el Baix Llobregat. Toda la comarca con desplazamiento incluido.',
      imageAlt: 'DJ Bodas Baix Llobregat - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Baix Llobregat',
    serviceJsonLd: {
      name: 'DJ Bodas Baix Llobregat',
      description: (minPrice) => `DJ profesional para bodas en el Baix Llobregat. Desplazamiento incluido. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Baix Llobregat', 'DJ bodas Hospitalet', 'DJ bodas Cornellà'],
    },
    zone: {
      heroTitle: 'DJ Bodas Baix Llobregat',
      heroSubtitle: 'Hospitalet · Cornellà · Sant Boi · El Prat · Toda la comarca',
      highlights: ['DJ boda Hospitalet', 'Bodas Castelldefels playa', 'Precio DJ boda', 'DJ boda Gavà Mar'],
      description: (minPrice) => `DJ profesional para bodas en el Baix Llobregat. Cubrimos toda la comarca con desplazamiento incluido desde ${minPrice}€.`,
      whyChooseUs: [
        'Toda la comarca: Hospitalet, Cornellà, Sant Boi y más',
        'Bodas de playa: Castelldefels y Gavà Mar',
        'Variedad de espacios: Masías, restaurantes y hoteles',
        'Conexión Barcelona: Fácil acceso desde la ciudad',
      ],
    },
  },
  'discomovil-maresme': {
    metadata: {
      title: (minPrice) => `Discomóvil Maresme | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `Discomóvil en el Maresme desde ${minPrice}€. Mataró, Calella, Pineda, Arenys, Canet y toda la costa. DJ profesional + equipo completo para fiestas privadas.`,
      keywords: ['discomovil Maresme', 'discomóvil Mataró', 'DJ fiesta Maresme', 'discomóvil Calella', 'DJ fiestas costa Maresme'],
      ogTitle: (minPrice) => `Discomóvil Maresme | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas en el Maresme. Mataró, Calella, Pineda y toda la costa.',
      imageAlt: 'Discomóvil Maresme - Òrbita Events',
    },
    breadcrumbLabel: 'Discomóvil Maresme',
    serviceJsonLd: {
      name: 'Discomóvil Maresme',
      description: (minPrice) => `Discomóvil profesional en el Maresme. DJ + equipo completo para fiestas costeras. Desde ${minPrice}€.`,
      serviceType: ['Discomóvil Maresme', 'DJ fiestas Mataró', 'Discomóvil costa Maresme'],
    },
    zone: {
      heroTitle: 'Discomóvil Maresme',
      heroSubtitle: 'Mataró · Calella · Pineda · Arenys · Canet · Malgrat',
      highlights: ['Discomóvil Maresme precio', 'DJ fiesta Mataró', 'Discomóvil Calella', 'DJ fiestas costa Maresme'],
      description: (minPrice) => `DJ profesional con discomóvil en el Maresme desde ${minPrice}€. Equipo completo para fiestas en la costa.`,
      whyChooseUs: [
        'Somos locales: Conocemos el Maresme a fondo',
        'Desplazamiento incluido: Sin costes extra a la comarca',
        'Especialistas en fiestas de verano y al aire libre',
        'Equipo resistente: Preparado para exteriores costeros',
      ],
    },
  },
  'dj-bodas-girona': {
    metadata: {
      title: (minPrice) => `DJ Bodas Girona | Ciudad y Provincia | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en Girona desde ${minPrice}€. Cobertura en Girona ciudad, Figueres, Olot, Banyoles, Salt. Sonido profesional 4000W, iluminación y efectos. Presupuesto gratis.`,
      keywords: ['DJ bodas Girona', 'DJ bodas Figueres', 'DJ bodas Olot', 'DJ boda Banyoles', 'DJ matrimonio Girona', 'discomóvil Girona'],
      ogTitle: (minPrice) => `DJ Bodas Girona | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en Girona. Ciudad, Figueres, Olot, Banyoles y toda la provincia.',
      imageAlt: 'DJ Bodas Girona - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Girona',
    serviceJsonLd: {
      name: 'DJ Bodas Girona',
      description: (minPrice) => `DJ profesional para bodas en Girona. Cobertura completa. Sonido 4000W, iluminación LED. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Girona', 'DJ bodas Figueres', 'DJ bodas Olot', 'Discomóvil Girona'],
    },
    zone: {
      heroTitle: 'DJ Bodas Girona',
      heroSubtitle: 'Girona · Figueres · Olot · Banyoles · Toda la provincia',
      highlights: ['DJ boda Girona', 'Bodas masía Girona', 'Precio DJ boda', 'DJ boda provincia Girona'],
      description: (minPrice) => `¿Buscas un DJ para tu boda en Girona? En Òrbita Events somos especialistas en bodas en toda la provincia de Girona desde ${minPrice}€: desde la ciudad hasta el Empordà, pasando por la Garrotxa, el Gironès y la Selva.`,
      whyChooseUs: [
        'Cobertura completa: Trabajamos en toda la provincia de Girona',
        'Experiencia en masías: Conocemos las particularidades de las masías del Empordà',
        'Multilingüe: Catalán, castellano e inglés',
        'Espacios históricos: Experiencia en monumentos y patrimonio protegido',
      ],
    },
  },
  'discomovil-girona': {
    metadata: {
      title: (minPrice) => `Discomóvil Girona | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `Discomóvil en Girona desde ${minPrice}€. Girona ciudad, Figueres, Olot, Costa Brava. DJ profesional + equipo completo para fiestas y celebraciones.`,
      keywords: ['discomovil Girona', 'discomóvil Costa Brava', 'DJ fiesta Girona', 'discomóvil Figueres', 'DJ fiestas provincia Girona'],
      ogTitle: (minPrice) => `Discomóvil Girona | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas en Girona y provincia. Costa Brava, Empordà y toda la comarca.',
      imageAlt: 'Discomóvil Girona - Òrbita Events',
    },
    breadcrumbLabel: 'Discomóvil Girona',
    serviceJsonLd: {
      name: 'Discomóvil Girona',
      description: (minPrice) => `Discomóvil profesional en Girona y provincia. DJ + equipo completo para fiestas y masías. Desde ${minPrice}€.`,
      serviceType: ['Discomóvil Girona', 'DJ fiestas Girona', 'Discomóvil Costa Brava'],
    },
    zone: {
      heroTitle: 'Discomóvil Girona',
      heroSubtitle: 'Girona · Figueres · Olot · Empordà · Costa Brava · Selva',
      highlights: ['Discomóvil Girona precio', 'DJ fiesta Girona', 'Discomóvil Empordà', 'DJ fiestas masía Girona'],
      description: (minPrice) => `DJ profesional con discomóvil en Girona y provincia desde ${minPrice}€. Especialistas en masías y fiestas rurales.`,
      whyChooseUs: [
        'Toda la provincia cubierta: Girona, Costa Brava, Empordà',
        'Expertos en masías: Adaptamos el equipo a cualquier espacio',
        'Desplazamiento incluido: Sin recargos por distancia',
        'Plan B siempre preparado: Nos adaptamos al clima',
      ],
    },
  },
  'dj-bodas-costa-brava': {
    metadata: {
      title: (minPrice) => `DJ Bodas Costa Brava | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en la Costa Brava desde ${minPrice}€. Cadaqués, Tossa, Lloret, Begur y toda la costa. Sonido profesional resistente a exteriores.`,
      keywords: ['DJ bodas Costa Brava', 'DJ bodas Cadaqués', 'DJ bodas Tossa de Mar', 'DJ bodas Begur', 'bodas playa Costa Brava'],
      ogTitle: (minPrice) => `DJ Bodas Costa Brava | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en la Costa Brava. Especialistas en bodas de costa y exteriores.',
      imageAlt: 'DJ Bodas Costa Brava - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Costa Brava',
    serviceJsonLd: {
      name: 'DJ Bodas Costa Brava',
      description: (minPrice) => `DJ profesional para bodas en la Costa Brava. Equipo resistente a exteriores. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Costa Brava', 'DJ bodas playa', 'Bodas costa Girona'],
    },
    zone: {
      heroTitle: 'DJ Bodas Costa Brava',
      heroSubtitle: 'Cadaqués · Tossa · Lloret · Begur · Toda la costa',
      highlights: ['DJ boda Costa Brava', 'Bodas playa Cadaqués', 'Precio DJ boda', 'DJ boda Begur'],
      description: (_minPrice) => 'DJ profesional para bodas en la Costa Brava. Especialistas en bodas de costa con equipo resistente a exteriores.',
      whyChooseUs: [
        'Especialistas en costa: Equipo preparado para exteriores',
        'Bodas en playa: Protección contra humedad y viento',
        'Conocemos la zona: Cap Roig, Aiguablava, Calella de Palafrugell',
        'Plan B preparado: Nos adaptamos a cambios de tiempo',
      ],
    },
  },
  'discomovil-costa-brava': {
    metadata: {
      title: (minPrice) => `Discomóvil Costa Brava | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `Discomóvil profesional en la Costa Brava desde ${minPrice}€. Lloret, Blanes, Palamós, Palafrugell. DJ + sonido + luces.`,
      keywords: ['discomóvil Costa Brava', 'discomóvil Lloret de Mar', 'discomóvil Blanes', 'alquiler discomóvil Costa Brava'],
      ogTitle: (minPrice) => `Discomóvil Costa Brava | Desde ${minPrice}€`,
      ogDescription: 'Discomóvil profesional en la Costa Brava. Lloret, Blanes, Palamós.',
      imageAlt: 'Discomóvil Costa Brava - Òrbita Events',
    },
    breadcrumbLabel: 'Discomóvil Costa Brava',
    serviceJsonLd: {
      name: 'Discomóvil Costa Brava',
      description: (minPrice) => `Discomóvil profesional en la Costa Brava. Desde ${minPrice}€.`,
      serviceType: ['discomóvil Lloret', 'discomóvil Blanes', 'discomóvil Costa Brava'],
    },
    zone: {
      heroTitle: 'Discomóvil Costa Brava',
      heroSubtitle: 'Lloret · Blanes · Palamós · Palafrugell · Roses',
      highlights: ['discomóvil Lloret de Mar', 'discomóvil Blanes', 'discomóvil Costa Brava precio', 'alquiler discomóvil Costa Brava'],
      description: (_minPrice) => 'Discomóvil profesional a la Costa Brava. DJ + sonido + iluminación per a festes, casaments i celebracions.',
      whyChooseUs: [
        'Cobertura completa de la Costa Brava',
        'Experiencia en montajes al aire libre y junto al mar',
        'Pack completo: DJ + sonido 4000W + iluminación LED',
        'Desplazamiento incluido sin recargo',
      ],
    },
  },
  'dj-bodas-garraf': {
    metadata: {
      title: (minPrice) => `DJ Bodas Garraf | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en el Garraf desde ${minPrice}€. Sitges, Vilanova, Cubelles. Especialistas en bodas de costa y chiringuitos.`,
      keywords: ['DJ bodas Garraf', 'DJ bodas Sitges', 'DJ bodas Vilanova', 'DJ bodas costa', 'bodas playa Garraf'],
      ogTitle: (minPrice) => `DJ Bodas Garraf | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en el Garraf. Especialistas en bodas de costa y espacios con vistas al mar.',
      imageAlt: 'DJ Bodas Garraf - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Garraf',
    serviceJsonLd: {
      name: 'DJ Bodas Garraf',
      description: (minPrice) => `DJ profesional para bodas en el Garraf. Especialistas en bodas de costa. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Garraf', 'DJ bodas Sitges', 'DJ bodas Vilanova'],
    },
    zone: {
      heroTitle: 'DJ Bodas Garraf',
      heroSubtitle: 'Sitges · Vilanova · Cubelles · Costa y chiringuitos',
      highlights: ['DJ boda Sitges', 'Bodas playa Garraf', 'Precio DJ boda', 'Bodas LGTBI+ Sitges'],
      description: (_minPrice) => 'DJ profesional para bodas en el Garraf. Especialistas en bodas de costa y espacios con vistas al mar.',
      whyChooseUs: [
        'Bodas de costa: Chiringuitos, terrazas y playas de Sitges',
        'Experiencia LGTBI+: Sitges es destino top para bodas diversas',
        'Desplazamiento incluido: Toda la comarca cubierta',
        'Equipo para exteriores: Protección contra humedad y viento',
      ],
    },
  },
  'discomovil-garraf': {
    metadata: {
      title: (minPrice) => `Discomóvil Garraf | Sitges | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `Discomóvil profesional en Sitges y el Garraf desde ${minPrice}€. DJ + sonido + iluminación para fiestas frente al mar.`,
      keywords: ['discomóvil Garraf', 'discomóvil Sitges', 'alquiler discomóvil Sitges', 'discomóvil Vilanova'],
      ogTitle: (minPrice) => `Discomóvil Garraf | Sitges | Desde ${minPrice}€`,
      ogDescription: 'Discomóvil profesional en Sitges y el Garraf.',
      imageAlt: 'Discomóvil Garraf Sitges - Òrbita Events',
    },
    breadcrumbLabel: 'Discomóvil Garraf',
    serviceJsonLd: {
      name: 'Discomóvil Garraf',
      description: (minPrice) => `Discomóvil profesional en el Garraf. Sitges, Vilanova. Desde ${minPrice}€.`,
      serviceType: ['discomóvil Sitges', 'discomóvil Garraf', 'discomóvil Vilanova'],
    },
    zone: {
      heroTitle: 'Discomóvil Garraf · Sitges',
      heroSubtitle: 'Sitges · Vilanova · Fiestas frente al mar con equipo profesional',
      highlights: ['discomóvil Sitges', 'discomóvil Garraf', 'alquiler discomóvil Sitges precio', 'discomóvil Vilanova'],
      description: (_minPrice) => 'Discomóvil profesional en el Garraf. Sitges, Vilanova y costa. DJ + sonido + luces per a festes a l\'aire lliure.',
      whyChooseUs: [
        'Experiencia en montajes al aire libre frente al mar',
        'Pack completo: DJ + sonido + iluminación + efectos',
        'Desplazamiento incluido a todo el Garraf',
        'Equipo resistente a condiciones exteriores',
      ],
    },
  },
  'dj-bodas-valles': {
    metadata: {
      title: (minPrice) => `DJ Bodas Vallès | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en el Vallès desde ${minPrice}€. Granollers, Sabadell, Terrassa, Mollet. DJ local con desplazamiento incluido.`,
      keywords: ['DJ bodas Vallès', 'DJ bodas Granollers', 'DJ bodas Sabadell', 'DJ bodas Terrassa', 'bodas Vallès Oriental'],
      ogTitle: (minPrice) => `DJ Bodas Vallès | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional local para bodas en el Vallès. Oriental y Occidental con desplazamiento incluido.',
      imageAlt: 'DJ Bodas Vallès - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Vallès',
    serviceJsonLd: {
      name: 'DJ Bodas Vallès',
      description: (minPrice) => `DJ profesional local para bodas en el Vallès. Desplazamiento incluido. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Vallès', 'DJ bodas Granollers', 'DJ bodas Sabadell', 'DJ bodas Terrassa'],
    },
    zone: {
      heroTitle: 'DJ Bodas Vallès',
      heroSubtitle: 'Granollers · Sabadell · Terrassa · Mollet · Toda la comarca',
      highlights: ['DJ boda Granollers', 'Bodas masía Vallès', 'Precio DJ boda', 'DJ boda Sabadell'],
      description: (_minPrice) => 'DJ profesional local para bodas en el Vallès. Base en Granollers, cubrimos Oriental y Occidental.',
      whyChooseUs: [
        'DJ local: Base en Granollers, conocemos la zona',
        'Desplazamiento incluido: Sin costes adicionales',
        'Masías del Vallès: Can Bonastre, Cal Blay, Can Ribas...',
        'Visita previa: Conocemos el espacio antes del evento',
      ],
    },
  },
  'discomovil-valles': {
    metadata: {
      title: (minPrice) => `Discomóvil Vallès | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `Discomóvil en el Vallès desde ${minPrice}€. Granollers, Mollet, Sabadell, Terrassa, Cerdanyola. DJ profesional + equipo completo para fiestas privadas.`,
      keywords: ['discomovil Vallès', 'discomóvil Granollers', 'DJ fiesta Sabadell', 'discomóvil Terrassa', 'DJ fiestas Vallès Occidental Oriental'],
      ogTitle: (minPrice) => `Discomóvil Vallès | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para fiestas en el Vallès Occidental y Oriental. Granollers, Sabadell, Terrassa y comarca.',
      imageAlt: 'Discomóvil Vallès - Òrbita Events',
    },
    breadcrumbLabel: 'Discomóvil Vallès',
    serviceJsonLd: {
      name: 'Discomóvil Vallès',
      description: (minPrice) => `Discomóvil profesional en el Vallès. Base en Granollers. DJ + equipo completo. Desde ${minPrice}€.`,
      serviceType: ['Discomóvil Vallès', 'DJ fiestas Granollers', 'Discomóvil Sabadell Terrassa'],
    },
    zone: {
      heroTitle: 'Discomóvil Vallès',
      heroSubtitle: 'Granollers · Mollet · Sabadell · Terrassa · Cerdanyola · Sant Cugat',
      highlights: ['Discomóvil Vallès precio', 'DJ fiesta Granollers', 'Discomóvil Sabadell', 'DJ fiestas Terrassa'],
      description: (_minPrice) => 'DJ profesional con discomóvil en el Vallès. Somos de Granollers y conocemos la comarca al detalle.',
      whyChooseUs: [
        'Somos de Granollers: Base en el Vallès Oriental',
        'Toda la comarca cubierta: V. Oriental y Occidental',
        'Desplazamiento incluido: Sin recargos por distancia',
        'Fiestas temáticas: Especialistas en temáticas únicas',
      ],
    },
  },
  'dj-bodas-penedes': {
    metadata: {
      title: (minPrice) => `DJ Bodas Penedès | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en el Penedès desde ${minPrice}€. Vilafranca, Sant Sadurní, Sitges. Especialistas en bodas en bodegas y viñedos.`,
      keywords: ['DJ bodas Penedès', 'DJ bodas Vilafranca', 'DJ bodas Sant Sadurní', 'DJ bodas bodegas', 'bodas viñedos Penedès'],
      ogTitle: (minPrice) => `DJ Bodas Penedès | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en el Penedès. Especialistas en bodegas y viñedos.',
      imageAlt: 'DJ Bodas Penedès - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Penedès',
    serviceJsonLd: {
      name: 'DJ Bodas Penedès',
      description: (minPrice) => `DJ profesional para bodas en el Penedès. Especialistas en bodegas y viñedos. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Penedès', 'DJ bodas Vilafranca', 'DJ bodas bodegas'],
    },
    zone: {
      heroTitle: 'DJ Bodas Penedès',
      heroSubtitle: 'Vilafranca · Sant Sadurní · Sitges · Bodegas y viñedos',
      highlights: ['Bodas bodega Penedès', 'DJ boda viñedos', 'Precio DJ boda', 'Bodas cava Sant Sadurní'],
      description: (_minPrice) => 'DJ profesional para bodas en el Penedès. Especialistas en bodas en bodegas y viñedos.',
      whyChooseUs: [
        'Especialistas en bodegas: Codorníu, Freixenet, Torres...',
        'Acústica en cavas: Sabemos ecualizar espacios subterráneos',
        'Desplazamiento incluido: Toda la comarca cubierta',
        'Generador propio: Por si la finca no tiene potencia',
      ],
    },
  },
  'dj-bodas-selva': {
    metadata: {
      title: (minPrice) => `DJ Bodas La Selva | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en La Selva desde ${minPrice}€. Blanes, Lloret, Santa Coloma, Hostalric. Costa y interior de Girona.`,
      keywords: ['DJ bodas La Selva', 'DJ bodas Blanes', 'DJ bodas Lloret', 'DJ bodas Santa Coloma', 'bodas La Selva Girona'],
      ogTitle: (minPrice) => `DJ Bodas La Selva | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en La Selva. Costa y interior de la comarca de Girona.',
      imageAlt: 'DJ Bodas La Selva - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas La Selva',
    serviceJsonLd: {
      name: 'DJ Bodas La Selva',
      description: (minPrice) => `DJ profesional para bodas en La Selva. Costa e interior. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas La Selva', 'DJ bodas Blanes', 'DJ bodas Lloret'],
    },
    zone: {
      heroTitle: 'DJ Bodas La Selva',
      heroSubtitle: 'Blanes · Lloret · Santa Coloma · Hostalric · Costa e interior',
      highlights: ['DJ boda Lloret', 'Bodas Blanes Costa Brava', 'Precio DJ boda', 'Bodas playa Lloret'],
      description: (_minPrice) => 'DJ profesional para bodas en La Selva. Costa e interior de la comarca entre Barcelona y Girona.',
      whyChooseUs: [
        'Costa e interior: Blanes, Lloret y masías del interior',
        'Ubicación estratégica: Entre Barcelona y Girona',
        'Desplazamiento incluido: Toda la comarca cubierta',
        'Jardines botánicos: Marimurtra y espacios únicos',
      ],
    },
  },
  'dj-bodas-emporda': {
    metadata: {
      title: (minPrice) => `DJ Bodas Empordà | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en el Empordà desde ${minPrice}€. Figueres, Roses, Cadaqués, L'Escala. Especialistas en bodas con encanto empordanés.`,
      keywords: ['DJ bodas Empordà', 'DJ bodas Figueres', 'DJ bodas Roses', 'DJ bodas Costa Brava', 'bodas Empordà'],
      ogTitle: (minPrice) => `DJ Bodas Empordà | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en el Empordà. Especialistas en masías empordanesas y bodas con vistas al Mediterráneo.',
      imageAlt: 'DJ Bodas Empordà - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Empordà',
    serviceJsonLd: {
      name: 'DJ Bodas Empordà',
      description: (minPrice) => `DJ profesional para bodas en el Empordà. Masías y costa. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Empordà', 'DJ bodas Figueres', 'DJ bodas Roses', 'DJ bodas Cadaqués'],
    },
    zone: {
      heroTitle: 'DJ Bodas Empordà',
      heroSubtitle: 'Figueres · Roses · Cadaqués · Costa Brava Nord',
      highlights: ['DJ boda Roses', 'Bodas masía Empordà', 'Precio DJ boda', 'Bodas Costa Brava'],
      description: (_minPrice) => 'DJ profesional para bodas en el Empordà. Especialistas en masías empordanesas y espacios con vistas al Mediterráneo.',
      whyChooseUs: [
        'Masías con historia: Conocemos los mejores espacios del Empordà',
        'Costa Brava Nord: Bodas frente al mar en Roses y Cadaqués',
        'Idiomas: Hablamos catalán, castellano, inglés y francés',
        'Desplazamiento incluido: Cubrimos todo el Alt y Baix Empordà',
      ],
    },
  },
  'dj-bodas-osona': {
    metadata: {
      title: (minPrice) => `DJ Bodas Osona | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en Osona desde ${minPrice}€. Vic, Manlleu, Torelló, Centelles. Especialistas en masías y entornos rurales.`,
      keywords: ['DJ bodas Osona', 'DJ bodas Vic', 'DJ bodas Manlleu', 'DJ bodas Torelló', 'bodas masías Osona'],
      ogTitle: (minPrice) => `DJ Bodas Osona | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en Osona. Especialistas en masías y entornos rurales.',
      imageAlt: 'DJ Bodas Osona - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Osona',
    serviceJsonLd: {
      name: 'DJ Bodas Osona',
      description: (minPrice) => `DJ profesional para bodas en Osona. Especialistas en masías y entornos rurales. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Osona', 'DJ bodas Vic', 'DJ bodas masías'],
    },
    zone: {
      heroTitle: 'DJ Bodas Osona',
      heroSubtitle: 'Vic · Manlleu · Torelló · Centelles · Masías con encanto',
      highlights: ['DJ boda Vic', 'Bodas masía Osona', 'Precio DJ boda', 'Bodas rurales Catalunya'],
      description: (_minPrice) => 'DJ profesional para bodas en Osona. Especialistas en masías y entornos rurales de la comarca.',
      whyChooseUs: [
        'Masías con encanto: Experiencia en los mejores espacios de Osona',
        'Generador propio: Para fincas sin conexión eléctrica',
        'Desplazamiento incluido: Toda la comarca cubierta',
        'Paisajes únicos: Bodas con vistas al Montseny y los Pirineos',
      ],
    },
  },
  'dj-bodas-maresme': {
    metadata: {
      title: (minPrice) => `DJ Bodas Maresme | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `DJ para bodas en el Maresme desde ${minPrice}€. Mataró, Calella, Arenys de Mar, Vilassar. Desplazamiento incluido.`,
      keywords: ['DJ bodas Maresme', 'DJ bodas Mataró', 'DJ bodas Calella', 'DJ bodas Arenys de Mar', 'bodas Maresme'],
      ogTitle: (minPrice) => `DJ Bodas Maresme | Desde ${minPrice}€`,
      ogDescription: 'DJ profesional para bodas en el Maresme. Toda la comarca con desplazamiento incluido.',
      imageAlt: 'DJ Bodas Maresme - Òrbita Events',
    },
    breadcrumbLabel: 'DJ Bodas Maresme',
    serviceJsonLd: {
      name: 'DJ Bodas Maresme',
      description: (minPrice) => `DJ profesional para bodas en el Maresme. Desplazamiento incluido. Desde ${minPrice}€.`,
      serviceType: ['DJ bodas Maresme', 'DJ bodas Mataró', 'DJ bodas Calella'],
    },
    zone: {
      heroTitle: 'DJ Bodas Maresme',
      heroSubtitle: 'Mataró · Calella · Arenys de Mar · Vilassar · Toda la comarca',
      highlights: ['DJ boda Mataró', 'Bodas playa Maresme', 'Precio DJ boda', 'DJ boda Calella'],
      description: (_minPrice) => 'DJ profesional para bodas en el Maresme. Cubrimos toda la comarca con desplazamiento incluido.',
      whyChooseUs: [
        'Toda la comarca: Mataró, Calella, Arenys y más',
        'Desplazamiento incluido: Sin costes adicionales',
        'Masías y costa: Experiencia en todo tipo de espacios',
        'Adaptable: Preparados para limitaciones eléctricas',
      ],
    },
  },
  'discomovil-baix-llobregat': {
    metadata: {
      title: (minPrice) => `Discomóvil Baix Llobregat | Desde ${minPrice}€ | Òrbita Events`,
      description: (minPrice) => `Discomóvil profesional en el Baix Llobregat desde ${minPrice}€. L'Hospitalet, Cornellà, Gavà. DJ + sonido + iluminación.`,
      keywords: ['discomóvil Baix Llobregat', 'discomóvil Hospitalet', 'discomóvil Cornellà', 'alquiler discomóvil Baix Llobregat'],
      ogTitle: (minPrice) => `Discomóvil Baix Llobregat | Desde ${minPrice}€`,
      ogDescription: 'Discomóvil profesional en el Baix Llobregat. DJ, sonido e iluminación.',
      imageAlt: 'Discomóvil Baix Llobregat - Òrbita Events',
    },
    breadcrumbLabel: 'Discomóvil Baix Llobregat',
    serviceJsonLd: {
      name: 'Discomóvil Baix Llobregat',
      description: (minPrice) => `Discomóvil profesional en el Baix Llobregat. Desde ${minPrice}€.`,
      serviceType: ['discomóvil Hospitalet', 'discomóvil Cornellà', 'discomóvil Baix Llobregat'],
    },
    zone: {
      heroTitle: 'Discomóvil Baix Llobregat',
      heroSubtitle: 'L\'Hospitalet · Cornellà · Sant Boi · Gavà · El Prat',
      highlights: ['discomóvil Hospitalet', 'discomóvil Cornellà', 'discomóvil Baix Llobregat precio', 'alquiler discomóvil'],
      description: (_minPrice) => 'Discomóvil profesional en el Baix Llobregat. DJ + sonido 4000W + iluminación LED completa. Montaje i desmontaje inclòs.',
      whyChooseUs: [
        'Pack completo: DJ + sonido + iluminación LED + efectos',
        'Desplazamiento incluido a todo el Baix Llobregat',
        'Adaptable a cualquier espacio interior o exterior',
        'Montaje y desmontaje sin coste adicional',
      ],
    },
  },
};
