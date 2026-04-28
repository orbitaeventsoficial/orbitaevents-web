export type PublicServiceZoneLink = {
  id: string;
  href: string;
  icon: string;
  labelKey: string;
  descKey: string;
};

export const PUBLIC_SERVICE_ZONE_LINKS: Record<string, PublicServiceZoneLink[]> = {
  discomovil: [
    {
      id: 'barcelona',
      href: '/servicios/discomovil-barcelona',
      icon: '🏙️',
      labelKey: 'barcelona',
      descKey: 'barcelonaDesc',
    },
    {
      id: 'maresme',
      href: '/servicios/discomovil-maresme',
      icon: '🏖️',
      labelKey: 'maresme',
      descKey: 'maresmeDesc',
    },
    {
      id: 'girona',
      href: '/servicios/discomovil-girona',
      icon: '🏛️',
      labelKey: 'girona',
      descKey: 'gironaDesc',
    },
    {
      id: 'valles',
      href: '/servicios/discomovil-valles',
      icon: '🏡',
      labelKey: 'valles',
      descKey: 'vallesDesc',
    },
  ],
  fiestas: [
    {
      id: 'barcelona',
      href: '/servicios/dj-fiestas-barcelona',
      icon: '🏙️',
      labelKey: 'barcelona.name',
      descKey: 'barcelona.desc',
    },
    {
      id: 'maresme',
      href: '/servicios/dj-fiestas-maresme',
      icon: '🏖️',
      labelKey: 'maresme.name',
      descKey: 'maresme.desc',
    },
    {
      id: 'costa-brava',
      href: '/servicios/dj-fiestas-costa-brava',
      icon: '🌊',
      labelKey: 'costaBrava.name',
      descKey: 'costaBrava.desc',
    },
  ],
};
