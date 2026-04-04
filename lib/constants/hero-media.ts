export type HeroMediaSeed = {
  id: string;
  url: string;
  type: 'video' | 'image';
  label: string;
};

export const HERO_MEDIA_DEFAULT_ITEMS: HeroMediaSeed[] = [
  { id: 'video-original', url: '/videos/hero-orbita-mobile.mp4', type: 'video', label: 'Vídeo original' },
  { id: 'img-bodas-01', url: '/img/portfolio/bodas/bodas-01.avif', type: 'image', label: 'Bodes' },
  { id: 'img-disco-01', url: '/img/portfolio/discomovil/discomovil-01.avif', type: 'image', label: 'Discomòbil' },
  { id: 'img-empresa-01', url: '/img/portfolio/eventos-empresa/eventos-empresa-01.avif', type: 'image', label: 'Empreses' },
  { id: 'img-infantils-01', url: '/img/portfolio/fiestas-infantiles/fiestas-infantiles-01.avif', type: 'image', label: 'Festes infantils' },
  { id: 'img-privades-01', url: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif', type: 'image', label: 'Festes privades' },
  { id: 'img-halloween-01', url: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif', type: 'image', label: 'Halloween' },
  { id: 'img-magic-01', url: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.avif', type: 'image', label: 'Món Màgic' },
  { id: 'img-produccio-01', url: '/img/portfolio/produccion-tecnica/produccion-tecnica-01.avif', type: 'image', label: 'Producció tècnica' },
  { id: 'img-lloguer-01', url: '/img/portfolio/alquiler-equipo/alquiler-equipo-01.avif', type: 'image', label: 'Lloguer equip' },
];
