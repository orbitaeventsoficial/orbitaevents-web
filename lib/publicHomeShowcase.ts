import type { PublicMobileServiceCardId } from '@/lib/constants/public-service-media';

export type PublicHomePillarKey = 'dj' | 'theming' | 'production';
export type PublicHomePillarIconKey = 'dj' | 'theme' | 'production';

export type PublicHomePillar = {
  key: PublicHomePillarKey;
  iconKey: PublicHomePillarIconKey;
  accent: string;
  accentLight: string;
  glowColor: string;
  href: string;
};

export const PUBLIC_HOME_SHOWCASE_PILLARS: readonly PublicHomePillar[] = [
  { key: 'dj', iconKey: 'dj', accent: 'from-amber-500 to-orange-500', accentLight: 'text-amber-400', glowColor: 'rgba(251, 191, 36, 0.08)', href: '/servicios/fiestas' },
  { key: 'theming', iconKey: 'theme', accent: 'from-purple-500 to-pink-500', accentLight: 'text-purple-400', glowColor: 'rgba(168, 85, 247, 0.08)', href: '/portfolio' },
  { key: 'production', iconKey: 'production', accent: 'from-cyan-500 to-blue-500', accentLight: 'text-cyan-400', glowColor: 'rgba(6, 182, 212, 0.08)', href: '/servicios/empresas' },
] as const;

export type PublicHomeMobileCard = {
  id: PublicMobileServiceCardId;
  emoji: string;
  gradient: string;
  badgeKey: string;
  badgeColor: string;
  href: string;
  features: readonly ['feature1', 'feature2', 'feature3'];
};

export const PUBLIC_HOME_MOBILE_CARDS: readonly PublicHomeMobileCard[] = [
  { id: 'bodas', emoji: '💒', gradient: 'from-pink-500/14 via-rose-500/6 to-transparent', badgeKey: '', badgeColor: '', href: '/servicios/bodas', features: ['feature1', 'feature2', 'feature3'] },
  { id: 'halloween', emoji: '🎃', gradient: 'from-orange-500/14 via-red-500/6 to-transparent', badgeKey: 'halloween.badge', badgeColor: 'from-orange-500 to-red-500', href: '/tematica-halloween', features: ['feature1', 'feature2', 'feature3'] },
  { id: 'monmagic', emoji: '🪄', gradient: 'from-amber-500/14 via-purple-500/6 to-transparent', badgeKey: 'monmagic.badge', badgeColor: 'from-amber-500 to-yellow-500', href: '/tematica-mon-magic', features: ['feature1', 'feature2', 'feature3'] },
  { id: 'fiestas', emoji: '🎉', gradient: 'from-purple-500/14 via-violet-500/6 to-transparent', badgeKey: '', badgeColor: '', href: '/servicios/fiestas', features: ['feature1', 'feature2', 'feature3'] },
  { id: 'empresas', emoji: '🏢', gradient: 'from-blue-500/14 via-cyan-500/6 to-transparent', badgeKey: '', badgeColor: '', href: '/servicios/empresas', features: ['feature1', 'feature2', 'feature3'] },
] as const;
export const PUBLIC_PORTFOLIO_SHOWCASE_ITEMS = [
  {
    id: 'discomovil',
    slug: 'discomovil',
    translationKey: 'discomovil',
    emoji: '🎧',
    mobileAccent: 'from-amber-500 to-orange-500',
    mobileBorder: 'border-amber-500/50',
    mobileText: 'text-amber-400',
    mobileBg: 'bg-amber-500/10',
    desktopAccent: 'from-amber-500/30 to-orange-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 10,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'halloween',
    slug: 'fiestas-tematicas-halloween',
    translationKey: 'halloween',
    emoji: '🎃',
    mobileAccent: 'from-orange-600 to-red-700',
    mobileBorder: 'border-orange-500/50',
    mobileText: 'text-orange-400',
    mobileBg: 'bg-orange-500/10',
    desktopAccent: 'from-purple-500/30 to-red-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 10,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'monMagic',
    slug: 'fiestas-tematicas-mon-magic',
    translationKey: 'monMagic',
    emoji: '🪄',
    mobileAccent: 'from-purple-600 to-pink-600',
    mobileBorder: 'border-purple-500/50',
    mobileText: 'text-purple-400',
    mobileBg: 'bg-purple-500/10',
    desktopAccent: 'from-blue-500/30 to-cyan-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 9,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'bodas',
    slug: 'bodas',
    translationKey: 'bodas',
    emoji: '💍',
    mobileAccent: 'from-pink-500 to-rose-500',
    mobileBorder: 'border-pink-500/50',
    mobileText: 'text-pink-400',
    mobileBg: 'bg-pink-500/10',
    desktopAccent: 'from-rose-500/30 to-pink-500/10',
    mobilePhotoCount: 4,
    desktopPhotoCount: 4,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'empreses',
    slug: 'eventos-empresa',
    translationKey: 'empreses',
    emoji: '🏢',
    mobileAccent: 'from-blue-500 to-cyan-500',
    mobileBorder: 'border-blue-500/50',
    mobileText: 'text-blue-400',
    mobileBg: 'bg-blue-500/10',
    desktopAccent: 'from-emerald-500/30 to-teal-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 9,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'privades',
    slug: 'fiestas-privadas',
    translationKey: 'privades',
    emoji: '🎉',
    mobileAccent: 'from-emerald-500 to-teal-500',
    mobileBorder: 'border-emerald-500/50',
    mobileText: 'text-emerald-400',
    mobileBg: 'bg-emerald-500/10',
    desktopAccent: 'from-emerald-500/30 to-teal-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 6,
    showInMobile: true,
    showInDesktop: false,
  },
] as const;

export type PublicPortfolioShowcaseBaseItem = (typeof PUBLIC_PORTFOLIO_SHOWCASE_ITEMS)[number];
export type PublicPortfolioShowcaseStory = PublicPortfolioShowcaseBaseItem & {
  photos: string[];
};

const HOME_PORTFOLIO_IMAGES: Record<string, string[]> = {
  discomovil: [
    '/img/portfolio/discomovil/discomovil-01.avif',
    '/img/portfolio/discomovil/discomovil-02.avif',
    '/img/portfolio/discomovil/discomovil-03.avif',
    '/img/portfolio/discomovil/discomovil-04.avif',
    '/img/portfolio/discomovil/discomovil-05.avif',
    '/img/portfolio/discomovil/discomovil-06.avif',
    '/img/portfolio/discomovil/discomovil-07.avif',
    '/img/portfolio/discomovil/discomovil-08.avif',
    '/img/portfolio/discomovil/discomovil-09.avif',
    '/img/portfolio/discomovil/discomovil-10.avif',
  ],
  'fiestas-tematicas-halloween': [
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-02.avif',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-03.avif',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-04.avif',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-05.avif',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-06.avif',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-07.avif',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-08.avif',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-09.avif',
    '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-10.avif',
  ],
  'fiestas-tematicas-mon-magic': [
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.avif',
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-02.avif',
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-03.avif',
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-04.avif',
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.avif',
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-06.avif',
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-07.avif',
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-08.avif',
    '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-09.avif',
  ],
  bodas: [
    '/img/portfolio/bodas/bodas-01.avif',
    '/img/portfolio/bodas/bodas-02.avif',
    '/img/portfolio/bodas/bodas-03.avif',
    '/img/portfolio/bodas/bodas-04.avif',
  ],
  'eventos-empresa': [
    '/img/portfolio/eventos-empresa/eventos-empresa-01.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-02.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-03.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-04.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-05.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-06.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-07.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-08.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-09.avif',
  ],
  'fiestas-privadas': [
    '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-02.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-03.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-04.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-05.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-06.avif',
  ],
};

export function getPublicPortfolioShowcasePhotos(slug: keyof typeof HOME_PORTFOLIO_IMAGES, limit: number) {
  return (HOME_PORTFOLIO_IMAGES[slug] ?? []).slice(0, limit);
}

export const PUBLIC_MOBILE_HOME_GUARANTEES = [
  { icon: '🛡️', titleKey: 'satisfaction.title', descKey: 'satisfaction.desc', gradient: 'from-green-500 to-emerald-500' },
  { icon: '🔧', titleKey: 'backup.title', descKey: 'backup.desc', gradient: 'from-blue-500 to-cyan-500' },
  { icon: '⚡', titleKey: 'response.title', descKey: 'response.desc', gradient: 'from-amber-500 to-orange-500' },
] as const;