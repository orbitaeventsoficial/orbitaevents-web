/**
 * Tipus i configuració de seccions pel gestor de textos.
 * Extret de text-manager/page.tsx per reduir la mida del component.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TextNode {
  path: string;
  value: string;
  originalValue: string;
  section: string;
  subsection: string;
  isModified: boolean;
  isNew: boolean;
  characterCount: number;
  locale: 'es' | 'ca' | 'en';
}

export interface Section {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  paths: string[];
}

export interface TranslationComparison {
  path: string;
  es: string;
  ca: string;
  hasTranslation: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const LANGUAGE_META: Record<'ca' | 'es' | 'en', { label: string; icon: string }> = {
  ca: { label: 'Català', icon: '🏴' },
  es: { label: 'Castellà', icon: '🇪🇸' },
  en: { label: 'Anglès', icon: '🇬🇧' },
};

export const SECTIONS: Section[] = [
  {
    id: 'hero',
    name: 'Hero Principal',
    icon: '🏠',
    description: 'Títols, subtítols i badges del hero',
    color: 'from-purple-500 to-pink-500',
    paths: ['hero.']
  },
  {
    id: 'nav',
    name: 'Navegació i capçalera',
    icon: '📱',
    description: 'Menú, navegació i selector d\'idioma',
    color: 'from-blue-500 to-cyan-500',
    paths: ['common.nav.', 'common.buttons.', 'common.breadcrumbs.']
  },
  {
    id: 'services',
    name: 'Serveis',
    icon: '🎯',
    description: 'Bodes, festes, corporatiu, discomòbil',
    color: 'from-green-500 to-emerald-500',
    paths: ['services.', 'weddings.', 'parties.', 'fiestas.', 'corporativo.', 'discomovil.']
  },
  {
    id: 'packs',
    name: 'Packs i preus',
    icon: '📦',
    description: 'Descripcions de packs, característiques i preus',
    color: 'from-orange-500 to-amber-500',
    paths: ['packs.', 'pricing.', 'configurator.']
  },
  {
    id: 'cta',
    name: 'CTAs & Garantías',
    icon: '✅',
    description: 'Crides a l\'acció, garanties i urgència',
    color: 'from-red-500 to-rose-500',
    paths: ['guarantee.', 'finalCta.', 'cta.', 'urgency.', 'offerModal.']
  },
  {
    id: 'testimonials',
    name: 'Testimonis',
    icon: '💬',
    description: 'Ressenyes, opinions i prova social',
    color: 'from-yellow-500 to-orange-500',
    paths: ['testimonials.', 'reviews.', 'opiniones.']
  },
  {
    id: 'faq',
    name: 'FAQ',
    icon: '❓',
    description: 'Preguntes freqüents',
    color: 'from-indigo-500 to-purple-500',
    paths: ['faq.']
  },
  {
    id: 'contact',
    name: 'Contacte',
    icon: '📧',
    description: 'Formularis, validacions i missatges',
    color: 'from-teal-500 to-green-500',
    paths: ['contact.', 'common.validation.']
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: '🦶',
    description: 'Peu de pàgina i enllaços legals',
    color: 'from-white/20 to-zinc-500',
    paths: ['footer.', 'legal.']
  },
  {
    id: 'themes',
    name: 'Pàgines temàtiques',
    icon: '🎃',
    description: 'Halloween, Món Màgic, temáticas especiales',
    color: 'from-purple-600 to-orange-500',
    paths: ['halloweenPage.', 'monMagic.', 'magicWorld.', 'sensorial.']
  },
  {
    id: 'meta',
    name: 'SEO & Meta',
    icon: '🔍',
    description: 'Títols SEO, descripcions i etiquetes OG',
    color: 'from-cyan-500 to-blue-500',
    paths: ['meta.', 'seo.']
  },
  {
    id: 'admin',
    name: 'Panell admin',
    icon: '⚙️',
    description: 'Dashboard, bookings, leads, CRM',
    color: 'from-gray-600 to-gray-800',
    paths: ['admin.']
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '📸',
    description: 'Galeria, esdeveniments i projectes',
    color: 'from-pink-500 to-rose-500',
    paths: ['portfolio.', 'gallery.']
  },
  {
    id: 'privacy',
    name: 'Privacidad & GDPR',
    icon: '🔒',
    description: 'RGPD, drets i cookies',
    color: 'from-emerald-600 to-teal-600',
    paths: ['privacy.', 'gdpr.', 'cookies.', 'privacitat.']
  },
  {
    id: 'resources',
    name: 'Recursos',
    icon: '📁',
    description: 'Descàrregues, catàlegs i PDFs',
    color: 'from-violet-500 to-purple-500',
    paths: ['resources.']
  },
  {
    id: 'common',
    name: 'Comú i sistema',
    icon: '🔧',
    description: 'Mesos, errors, carregador i textos genèrics',
    color: 'from-stone-500 to-neutral-600',
    paths: ['common.', 'loader.', 'error.']
  }
];
