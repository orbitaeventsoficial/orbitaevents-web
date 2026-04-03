export type HeroMediaSeed = {
  id: string;
  url: string;
  type: 'video' | 'image';
  label: string;
};

export const HERO_MEDIA_DEFAULT_ITEMS: HeroMediaSeed[] = [
  { id: 'video-original', url: '/videos/hero-orbita-mobile.mp4', type: 'video', label: 'Vídeo original' },
  { id: 'img-disco-01', url: '/img/portfolio/discomovil/discomovil-01.avif', type: 'image', label: 'Discomòbil' },
  { id: 'img-bodas-04', url: '/img/portfolio/bodas/bodas-04.avif', type: 'image', label: 'Bodes' },
  { id: 'img-halloween-01', url: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif', type: 'image', label: 'Halloween' },
  { id: 'img-magic-05', url: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.avif', type: 'image', label: 'Món Màgic' },
  { id: 'img-empresa-01', url: '/img/portfolio/eventos-empresa/eventos-empresa-01.avif', type: 'image', label: 'Empreses' },
];
