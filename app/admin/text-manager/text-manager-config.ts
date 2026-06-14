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
  // ── CANVIA SOVINT ─────────────────────────────────────────────────────────
  {
    id: 'dossiers',
    name: 'Dossiers / Animació',
    icon: '🎤',
    description: 'Textos del dossier (portada, intro, capítols, resum) + productes Bingo, Batalla, DJ, Cerimònia, Boda',
    color: 'from-orange-500 to-red-500',
    paths: ['dossier.', 'animacioProducts.'],
  },
  {
    id: 'hero',
    name: 'Hero Principal',
    icon: '🏠',
    description: 'Títols, subtítols, badges i urgència del hero',
    color: 'from-purple-500 to-pink-500',
    paths: ['hero.', 'heroUrgency.', 'mobileHero.', 'trust.'],
  },
  {
    id: 'homepage',
    name: 'Pàgina d\'inici',
    icon: '✨',
    description: 'Seccions de la home: stats, prova social, diferències, experiències',
    color: 'from-violet-500 to-fuchsia-500',
    paths: [
      'homePage.', 'homeSections.', 'stats.', 'sections.', 'proof.',
      'comparison.', 'transformation.', 'diferencia.', 'whyUs.', 'experiences.',
      'logoWall.', 'mobileHome.',
    ],
  },
  {
    id: 'packs',
    name: 'Packs i preus',
    icon: '📦',
    description: 'Descripcions de packs, característiques, preus i calculadora',
    color: 'from-orange-500 to-amber-500',
    paths: [
      'packs.', 'pricing.', 'configurator.', 'pages.mobile.discoPacks.',
      'packsOffers.', 'extras.', 'calculator.',
    ],
  },
  {
    id: 'services',
    name: 'Serveis',
    icon: '🎯',
    description: 'Bodes, festes, corporatiu, discomòbil, showcase de serveis',
    color: 'from-green-500 to-emerald-500',
    paths: [
      'services.', 'weddings.', 'parties.', 'fiestas.', 'corporativo.',
      'discomovil.', 'servicesShowcase.', 'servicesGrid.', 'mobileServices.',
    ],
  },
  {
    id: 'cta',
    name: 'CTAs & Garanties',
    icon: '✅',
    description: 'Crides a l\'acció, garanties, urgència i ofertes',
    color: 'from-red-500 to-rose-500',
    paths: [
      'guarantee.', 'guarantees.', 'finalCta.', 'ctaFinal.', 'cta.', 'ctaSection.',
      'urgency.', 'offerModal.', 'flashOffer.', 'stickyCta.', 'sticky.',
      'contactCta.',
    ],
  },
  {
    id: 'faq',
    name: 'FAQ',
    icon: '❓',
    description: 'Preguntes freqüents (bàsica i ampliada)',
    color: 'from-indigo-500 to-purple-500',
    paths: ['faq.', 'faqAmpliat.'],
  },
  {
    id: 'themes',
    name: 'Pàgines temàtiques',
    icon: '🎃',
    description: 'Halloween, Boda Halloween, Món Màgic, temàtiques especials',
    color: 'from-purple-600 to-orange-500',
    paths: [
      'halloweenPage.', 'monMagic.', 'magicWorld.', 'sensorial.',
      'bodaHalloween.', 'bodaHalloweenPage.', 'tematicaMonMagicPage.', 'monMagicPage.',
      'themes.', 'tematitzacio.', 'themingSection.',
    ],
  },
  // ── CANVIA DE TANT EN TANT ────────────────────────────────────────────────
  {
    id: 'testimonials',
    name: 'Testimonis',
    icon: '💬',
    description: 'Ressenyes, opinions, prova social i Google Reviews',
    color: 'from-yellow-500 to-orange-500',
    paths: [
      'testimonials.', 'reviews.', 'opiniones.', 'videoTestimonials.',
      'testimonialForm.', 'googleReviews.', 'opinionsPage.',
    ],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '📸',
    description: 'Galeria, esdeveniments, projectes i procés visual',
    color: 'from-pink-500 to-rose-500',
    paths: ['portfolio.', 'gallery.', 'portfolioGrid.', 'galeriaPortfolio.', 'procesVisual.'],
  },
  {
    id: 'meta',
    name: 'SEO & Meta',
    icon: '🔍',
    description: 'Títols SEO, descripcions, etiquetes OG i dades estructurades',
    color: 'from-cyan-500 to-blue-500',
    paths: ['meta.', 'seo.', 'seoJsonLd.', 'structuredData.', 'layoutJsonLd.'],
  },
  {
    id: 'contact',
    name: 'Contacte & Reserva',
    icon: '📧',
    description: 'Formularis, validacions, disponibilitat i gràcies',
    color: 'from-teal-500 to-green-500',
    paths: [
      'contact.', 'contactForm.', 'common.validation.',
      'booking.', 'availability.', 'gracias.',
    ],
  },
  {
    id: 'mobile',
    name: 'Mòbil',
    icon: '📲',
    description: 'Textos específics de la versió mòbil de la web',
    color: 'from-sky-500 to-blue-500',
    paths: ['mobileLanding.', 'mobileTestimonials.', 'mobileCTA.', 'mobileExperience.'],
  },
  {
    id: 'pages',
    name: 'Pàgines especials',
    icon: '📄',
    description: 'About, blog, 404, errors i zona de zones',
    color: 'from-white/20 to-white/[0.05]',
    paths: [
      'sobreNosaltres.', 'blog.', 'notFound.', 'errorPage.',
      'zoneLanding.', 'privacyPortal.',
    ],
  },
  // ── QUASI MAI ES TOCA ─────────────────────────────────────────────────────
  {
    id: 'nav',
    name: 'Navegació',
    icon: '📱',
    description: 'Menú, navegació, capçalera, selector d\'idioma i botons flotants',
    color: 'from-blue-500 to-cyan-500',
    paths: [
      'common.nav.', 'common.buttons.', 'common.breadcrumbs.',
      'header.', 'mobileHeader.', 'mobileNav.', 'bottomNav.',
      'languageSelector.', 'floatingButtons.',
    ],
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: '🦶',
    description: 'Peu de pàgina, enllaços legals i xarxes socials',
    color: 'from-white/20 to-zinc-500',
    paths: ['footer.', 'footerLinks.', 'legal.'],
  },
  {
    id: 'resources',
    name: 'Recursos',
    icon: '📁',
    description: 'Descàrregues, catàlegs i PDFs',
    color: 'from-violet-500 to-purple-500',
    paths: ['resources.'],
  },
  {
    id: 'admin',
    name: 'Panell admin',
    icon: '⚙️',
    description: 'Dashboard, bookings, leads, CRM',
    color: 'from-white/15 to-white/[0.05]',
    paths: ['admin.'],
  },
  {
    id: 'common',
    name: 'Comú i sistema',
    icon: '🔧',
    description: 'Mesos, errors, carregador i textos genèrics',
    color: 'from-stone-500 to-neutral-600',
    paths: ['common.', 'loader.', 'error.'],
  },
  {
    id: 'privacy',
    name: 'Privacitat & GDPR',
    icon: '🔒',
    description: 'RGPD, drets i cookies — text legal estable',
    color: 'from-emerald-600 to-teal-600',
    paths: ['privacy.', 'gdpr.', 'cookies.', 'privacitat.'],
  },
];
