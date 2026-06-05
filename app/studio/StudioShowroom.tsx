'use client';

/* ============================================================================
   ÒRBITA · STUDIO — Fitxa tècnica del sistema visual del NOU ADMIN (v0.6)
   ----------------------------------------------------------------------------
   Catàleg viu de tokens, components, comunicacions i documents. Tot el que el
   client veu i tot el que l'admin manipula passa per aquí.

   ⚠️ ZONA PROTEGIDA — vegeu CLAUDE.md (§Zones consolidades) i el guard
   `qa:studio-integrity` (scripts/check-studio-integrity.mjs) dins validate:core.
   No buidar ni reduir aquesta fitxa: el guard exigeix les 16 seccions i un
   mínim de superfície. Tota passa (prova o definitiva) ha de quedar a git i
   documentada al diari amb número de canvi.

   Estils: tokens a ./orbita-tokens.css i components a ./studio.css, scoped a
   .o-studio-root. Zero hex de color al JSX; el hex visible és contingut textual.
============================================================================ */

import { useState, type ReactNode } from 'react';
import { CLIENT_LOGOS } from '@/config/client-logos';
import { EXTRAS, INVENTARIO, getAllPacks, type PackDefinition, type ServiceSlug } from '@/config/packs-config';
import { PORTFOLIO_CATEGORIES } from '@/config/portfolio-images';
import { PDF_DOCUMENT_CATALOG, type PdfDocumentId } from '@/lib/constants/pdfDocuments';
import { ORBITA_LOGO_LOCKUP_LIGHT_BASE64 } from '@/lib/logo-lockup-light-base64';
import './orbita-tokens.css';
import './studio.css';

type PublicService = {
  slug: ServiceSlug;
  label: string;
  route: string;
  summary: string;
};

/* ── 04 · Iconografia — 16 icones monolínia (stroke 1.7, 24×24) ───────────── */
const ico = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const ICONS: { name: string; node: ReactNode }[] = [
  { name: 'pipeline', node: ico(<><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></>) },
  { name: 'calendari', node: ico(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>) },
  { name: 'clients', node: ico(<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 8.5a3 3 0 0 1 0 5.5M17 20a5.5 5.5 0 0 0-2-4" /></>) },
  { name: 'inbox', node: ico(<><path d="M4 13l2.5-7h11L20 13" /><path d="M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" /><path d="M4 13h4l1.5 2.5h5L16 13h4" /></>) },
  { name: 'mail', node: ico(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>) },
  { name: 'phone', node: ico(<path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />) },
  { name: 'whatsapp', node: ico(<><path d="M4 20l1.4-4A8 8 0 1 1 9 19.6L4 20Z" /><path d="M9 9c0 4 2 6 6 6" /></>) },
  { name: 'pdf', node: ico(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>) },
  { name: 'search', node: ico(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.5-3.5" /></>) },
  { name: 'plus', node: ico(<path d="M12 5v14M5 12h14" />) },
  { name: 'cog', node: ico(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>) },
  { name: 'alert', node: ico(<><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></>) },
  { name: 'check', node: ico(<path d="M5 13l4 4 10-11" />) },
  { name: 'cross', node: ico(<path d="M6 6l12 12M18 6 6 18" />) },
  { name: 'arrow-right', node: ico(<path d="M4 12h15M13 6l6 6-6 6" />) },
  { name: 'sparkle', node: ico(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />) },
];

/* ── 01 · Paleta — 4 grups ────────────────────────────────────────────────── */
const PALETTE: { group: string; items: { name: string; token: string; hex: string; use: string }[] }[] = [
  {
    group: 'Fons · capes de profunditat',
    items: [
      { name: 'Fons absolut', token: '--o-bg', hex: '#07090d', use: 'Body, viewport base' },
      { name: 'Superfície', token: '--o-surface', hex: '#0e1219', use: 'Sidebar, command bar' },
      { name: 'Card / elev-1', token: '--o-elev-1', hex: '#141923', use: 'Targetes principals' },
      { name: 'Raised / elev-2', token: '--o-elev-2', hex: '#1c2230', use: 'Hover, botons secondary' },
      { name: 'Popover / elev-3', token: '--o-elev-3', hex: '#252b3a', use: 'Tooltips, dropdowns' },
    ],
  },
  {
    group: 'Text · nivells de jerarquia',
    items: [
      { name: 'Primari', token: '--o-text', hex: '#f5f7fa', use: 'Títols, valors clau' },
      { name: 'Secundari', token: '--o-text-2', hex: '#a2acba', use: 'Body, descripcions' },
      { name: 'Terciari', token: '--o-text-3', hex: '#6b7585', use: 'Labels, captions' },
      { name: 'Subtle', token: '--o-text-4', hex: '#4a525e', use: 'Disabled, separadors' },
    ],
  },
  {
    group: 'Marca · Òrbita (or sobri)',
    items: [
      { name: 'Accent (or)', token: '--o-accent', hex: '#d4a857', use: 'CTA primary, focus' },
      { name: 'Accent fosc', token: '--o-accent-deep', hex: '#b8923f', use: 'Borders, ombres' },
      { name: 'Ink', token: '--o-accent-ink', hex: '#1a1208', use: 'Text sobre or' },
    ],
  },
  {
    group: 'Estats funcionals · semàntica clara',
    items: [
      { name: 'Info', token: '--o-info', hex: '#5fb7e8', use: 'Nous, notificacions' },
      { name: 'Èxit', token: '--o-success', hex: '#3ec57b', use: 'Confirmats, guanyats' },
      { name: 'Atenció', token: '--o-warning', hex: '#e8a93a', use: 'Pendents, atenció' },
      { name: 'Crític', token: '--o-danger', hex: '#e2596a', use: 'Errors, perduts, urgents' },
    ],
  },
];

/* ── 02 · Tipografia ──────────────────────────────────────────────────────── */
const TYPE_SCALE: { name: string; spec: string; sample: string; use: string; style: React.CSSProperties }[] = [
  { name: 'Display', spec: '32 / 700 / -0.025em', sample: 'Òrbita Events', use: 'Títol pàgina', style: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em' } },
  { name: 'Title', spec: '22 / 700 / -0.02em', sample: 'Pipeline · Juny', use: 'Títol secció', style: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' } },
  { name: 'Heading', spec: '18 / 600', sample: 'Configuració general', use: 'Card title', style: { fontSize: 18, fontWeight: 600 } },
  { name: 'Body', spec: '14 / 400', sample: 'Exemple · Boda · 120 pax · 14 jun', use: 'Text llarg', style: { fontSize: 14, fontWeight: 400 } },
  { name: 'Small', spec: '12 / 500', sample: 'Última actualització fa 3 minuts', use: 'Meta, hints', style: { fontSize: 12, fontWeight: 500 } },
  { name: 'Caption', spec: '11 / 700 / 0.06em UP', sample: 'PIPELINE · 8 LEADS', use: 'Labels, eyebrows', style: { fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' } },
  { name: 'Dades', spec: 'Inter tabular · 12', sample: '14 jun · 120 pax · 22:00', use: 'Dades, dates, imports i IDs', style: { fontSize: 12, fontFamily: 'var(--o-font-data)', fontVariantNumeric: 'tabular-nums' } },
];

/* ── 03 · Spacing & Radii ─────────────────────────────────────────────────── */
const SPACES = [
  { token: '--o-1', px: 4 }, { token: '--o-2', px: 8 }, { token: '--o-3', px: 12 },
  { token: '--o-4', px: 16 }, { token: '--o-5', px: 20 }, { token: '--o-6', px: 24 },
  { token: '--o-8', px: 32 }, { token: '--o-10', px: 40 }, { token: '--o-12', px: 48 },
];
const RADII = [
  { token: '--o-r-sm', px: 6, use: 'pills, tags' },
  { token: '--o-r-md', px: 10, use: 'botons, inputs' },
  { token: '--o-r-lg', px: 14, use: 'cards' },
  { token: '--o-r-xl', px: 20, use: 'modals' },
  { token: '--o-r-pill', px: 999, use: 'badges, dots' },
];

/* ── 09 · Estats ──────────────────────────────────────────────────────────── */
const STATES: { label: string; tone: string }[] = [
  { label: 'Neutre', tone: 'neutral' },
  { label: 'Nou', tone: 'info' },
  { label: 'Contactat', tone: 'accent' },
  { label: 'Negociant', tone: 'warning' },
  { label: 'Guanyat', tone: 'success' },
  { label: 'Perdut', tone: 'danger' },
];

/* ── 11 · Responsive ──────────────────────────────────────────────────────── */
const BREAKPOINTS = [
  { name: 'Mobile', code: '< 600px', desc: '1 col · sidebar collapsed · stats stack' },
  { name: 'Tablet', code: '600–900px', desc: '2 cols · sidebar horizontal' },
  { name: 'Laptop', code: '900–1200px', desc: '3-4 cols · sidebar fix' },
  { name: 'Desktop', code: '> 1200px', desc: '4-5 cols · pipeline complet' },
];

/* ── 13 · To de veu ───────────────────────────────────────────────────────── */
const VOICE_DO = [
  'Tutejant, càlid',
  'Una idea per frase',
  'Català / Castellà / Anglès segons preferredLocale',
  'Acabar amb una signatura curta «Òrbita Events»',
  'Subjectes específics: «Reserva confirmada R2026-014»',
  'Tota acció amb un sol botó/enllaç visible',
];
const VOICE_DONT = [
  'De vostè, distant',
  'Frases-paràgraf de 4 línies',
  'Mesclar idiomes en el mateix correu',
  'Banners de marca o disclaimers legals al peu',
  'Subjectes vagues: «Notícies», «Actualització»',
  'Múltiples CTAs competidors al mateix mail',
];

/* ── 14 · Comunicacions automàtiques (8 emails) ───────────────────────────── */
const EMAIL_COMMS: { slug: string; locales: string[]; trigger: string; subject: string; body: string }[] = [
  {
    slug: 'welcome', locales: ['ca', 'es', 'en'],
    trigger: 'Quan es crea un client per primera vegada',
    subject: 'Benvingut a Òrbita Events, {{clientName}}',
    body: 'Hola {{clientName}}, gràcies per confiar en Òrbita Events. Som aquí per a tot el que necessitis: pressupostos, dubtes, idees per al teu event. El meu directe és aquest mateix correu — qualsevol cosa, escriu-nos. Òrbita Events',
  },
  {
    slug: 'booking_confirmation', locales: ['ca', 'es', 'en'],
    trigger: 'Quan es confirma una reserva (estat → CONFIRMED)',
    subject: 'Reserva confirmada {{reference}} · {{eventDate}}',
    body: 'Hola {{clientName}}, la teva reserva ja és nostra: Referència {{reference}} — Data {{eventDate}} · {{startTime}} a {{endTime}} — Tipus {{eventType}} — Pack {{packName}} — Lloc {{location}} — Total {{total}}€ — Senyal pagada {{depositAmount}}€. T\'esperem. Òrbita Events',
  },
  {
    slug: 'admin_booking_notification', locales: ['ca'],
    trigger: 'Notifica a l\'admin quan entra una reserva nova',
    subject: '🔔 Nova reserva: {{reference}}',
    body: 'Nova reserva entrada: {{clientName}} ({{clientEmail}} · {{clientPhone}}) — Event {{eventType}} — Data {{eventDate}} — Lloc {{location}} — Pack {{packName}} — Total {{total}}€',
  },
  {
    slug: 'payment_reminder', locales: ['ca', 'es', 'en'],
    trigger: 'Quan queden N dies per l\'event i hi ha pagament pendent',
    subject: 'Recordatori de pagament · {{reference}}',
    body: 'Hola {{clientName}}, tens pendents {{pendingAmount}}€ per la reserva {{reference}}. L\'event és el {{eventDate}} — queden {{daysUntilEvent}} dies. Quan vulguis tanquem-ho. Òrbita Events',
  },
  {
    slug: 'post_event', locales: ['ca', 'es', 'en'],
    trigger: 'N dies després de l\'event (cron diari)',
    subject: 'Com va anar el teu event, {{clientName}}?',
    body: 'Hola {{clientName}}, esperem que {{packName}} del {{eventDate}} t\'agradés. Ens deixaries la teva opinió? Ens ajuda molt. 👉 {{reviewUrl}} · Google: {{googleReviewUrl}} · Gràcies — Òrbita Events',
  },
  {
    slug: 'testimonial_reminder', locales: ['ca', 'es', 'en'],
    trigger: 'Si no ha deixat ressenya passats N dies del post_event',
    subject: 'Encara tens un minut, {{clientName}}?',
    body: 'Hola {{clientName}}, no t\'oblidis de deixar la teva opinió a {{reviewUrl}}. És el millor que pots fer per nosaltres. Gràcies.',
  },
  {
    slug: 'testimonial_received', locales: ['ca', 'es', 'en'],
    trigger: 'Quan el client envia el testimoni des de la web',
    subject: 'Gràcies per la teva opinió, {{clientName}}',
    body: 'Hola {{clientName}}, hem rebut el teu testimoni. El revisarem i el publicarem ben aviat. Gràcies de tot cor. Òrbita Events',
  },
  {
    slug: 'testimonial_approved', locales: ['ca', 'es', 'en'],
    trigger: 'Quan un admin aprova un testimoni',
    subject: '🎁 La teva ressenya és viva — codi descompte regal',
    body: 'Hola {{clientName}}, el teu testimoni ja és publicat. Com a regal, et donem aquest codi: {{discountCode}} ({{discountAmount}}€) · Per al teu proper event amb nosaltres. Gràcies — Òrbita Events',
  },
];

/* ── 05 · Actius del repo ─────────────────────────────────────────────────── */
const BRAND_LOGOS: { file: string; src: string; use: string; light?: boolean }[] = [
  { file: 'orbitalockupwhite.svg', src: '/img/orbitalockupwhite.svg', use: 'Lockup principal · fons foscos' },
  { file: 'orbitalockupdark.svg', src: '/img/orbitalockupdark.svg', use: 'Lockup · fons clars', light: true },
  { file: 'orbitalockupmono.svg', src: '/img/orbitalockupmono.svg', use: 'Lockup monocrom' },
  { file: 'orbitawordmark.svg', src: '/img/orbitawordmark.svg', use: 'Només text · wordmark', light: true },
  { file: 'orbita-glyph.svg', src: '/img/orbita-glyph.svg', use: 'Símbol sol · glyph' },
  { file: 'orbitaglyphgold.webp', src: '/img/orbitaglyphgold.webp', use: 'Glyph daurat' },
  { file: 'orbitaglyphblack.svg', src: '/img/orbitaglyphblack.svg', use: 'Glyph negre · fons clars', light: true },
  { file: 'logosoloplaneta.svg', src: '/img/logosoloplaneta.svg', use: 'Només planeta' },
];

const FAVICON_VEC = ['favicon.svg', 'icon.svg', 'favicon-halloween.svg', 'favicon-mon-magic.svg'];
const FAVICON_RASTER = ['favicon-32.png', 'favicon-48.png', 'favicon-96.png', 'favicon-180.png', 'favicon-192.png', 'favicon-512.png', 'apple-touch-icon.png'];
const PORTFOLIO_ASSETS = PORTFOLIO_CATEGORIES.slice(0, 9);
const CLIENT_LOGO_ASSETS = CLIENT_LOGOS.slice(0, 9);

const SERVICE_CATALOG: PublicService[] = [
  { slug: 'bodas', label: 'Bodes', route: '/servicios/bodas', summary: 'Cerimònia, còctel, banquet i festa amb packs escalables.' },
  { slug: 'discomovil', label: 'Discomòbil', route: '/servicios/discomovil', summary: 'Festes privades i pista de ball amb so, llum i tècnic.' },
  { slug: 'fiestas', label: 'Festes', route: '/servicios/fiestas', summary: 'Aniversaris, comunions i celebracions familiars.' },
  { slug: 'empresas', label: 'Empreses', route: '/servicios/empresas', summary: 'Cocktail, gala i producció corporativa amb lectura professional.' },
];

const PUBLIC_PACKS = getAllPacks();
const PUBLIC_EXTRAS = EXTRAS;
const servicePacks = (service: ServiceSlug) => PUBLIC_PACKS.filter((pack) => (service === 'fiestas' ? pack.service === 'discomovil' : pack.service === service));
const titleFromSlug = (slug: string) => slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
const priceRange = (packs: PackDefinition[]) => {
  if (packs.length === 0) return 'sense packs';
  const values = packs.map((pack) => pack.priceValue);
  return `${Math.min(...values)}€-${Math.max(...values)}€`;
};
const serviceCapacity = (packs: PackDefinition[]) => {
  const mins = packs.map((pack) => pack.capacidadMinima).filter((value): value is number => typeof value === 'number');
  const maxs = packs.map((pack) => pack.capacidadMaxima).filter((value): value is number => typeof value === 'number');
  if (!mins.length && !maxs.length) return 'capacitat flexible';
  return `${mins.length ? Math.min(...mins) : 0}-${maxs.length ? Math.max(...maxs) : '∞'} pax`;
};
const STUDIO_BROCHURE_PACKS = servicePacks('bodas');
const STUDIO_BROCHURE_EXTRAS = PUBLIC_EXTRAS.filter((extra) => extra.compatibleWith?.includes('bodas'));

/* ── 16 · Lab · Paleta Obsidiana ─────────────────────────────────────────── */
const LAB_PALETTE_GROUPS: { group: string; items: { name: string; token: string; hex: string; use: string }[] }[] = [
  {
    group: 'Fons · Obsidiana càlida (mai negre pur ni slate fred)',
    items: [
      { name: 'Canvas', token: '--canvas', hex: '#0a0a0c', use: 'Viewport, body base' },
      { name: 'Side', token: '--side', hex: '#0d0d10', use: 'Barra lateral' },
      { name: 'Panel', token: '--panel', hex: '#131318', use: 'Cards, panells elevats' },
      { name: 'Raised', token: '--raised', hex: '#1d1e25', use: 'Hover, botons, inputs' },
      { name: 'Sunk', token: '--sunk', hex: '#08080a', use: 'Cel·les buides del calendari' },
    ],
  },
  {
    group: 'Text · càlid (mai blanc pur)',
    items: [
      { name: 'Primari', token: '--t', hex: '#ece7df', use: 'Títols, valors principals' },
      { name: 'Secundari', token: '--t2', hex: '#b6aea2', use: 'Body, metadades' },
      { name: 'Apagat', token: '--t3', hex: '#837c70', use: 'Labels, captions' },
    ],
  },
  {
    group: 'Or · Identitat Marca + Diners + Acció (heroi únic)',
    items: [
      { name: 'Gold', token: '--gold', hex: '#d7b86e', use: 'Accents, cursor actiu, hairlines' },
      { name: 'Gold Bright', token: '--gold-bright', hex: '#f0d99a', use: 'Text monetari, valors en or' },
      { name: 'Gold Ink', token: '--gold-ink', hex: '#2a210e', use: 'Text sobre fons or' },
      { name: 'Gold Edge', token: '--gold-edge', hex: '#a9863f', use: 'Vores, profunditat' },
      { name: 'Hair Gold', token: '--hair-gold', hex: 'rgba(215,184,110,.22)', use: 'Hairlines, vores decoratives' },
    ],
  },
  {
    group: 'Línies · càlides translúcides',
    items: [
      { name: 'Line', token: '--line', hex: 'rgba(236,233,227,.10)', use: 'Vora tènue' },
      { name: 'Line 2', token: '--line2', hex: 'rgba(236,233,227,.20)', use: 'Vora visible' },
    ],
  },
];

const LAB_STAGES: { label: string; hex: string; strong: string; slug: string; desc: string }[] = [
  { label: 'Nou · Topazi', hex: '#e0922b', strong: '#b45309', slug: 'nou', desc: 'Entra al funnel' },
  { label: 'Contactat · Ametista', hex: '#9d83c2', strong: '#6a4f9c', slug: 'contactat', desc: 'En seguiment actiu' },
  { label: 'Guanyat · Maragda', hex: '#3fa06a', strong: '#1f7a4c', slug: 'guanyat', desc: 'Tancat, confirmat' },
  { label: 'Perdut · Cendra', hex: '#8a817a', strong: '#5d564f', slug: 'perdut', desc: 'Forat silenciós, mort' },
];

/* ── 17 · Lab · Tipografia ────────────────────────────────────────────────── */
const LAB_TYPE_GROUPS: {
  group: string;
  entries: { role: string; spec: string; sample: string; use: string; style: React.CSSProperties }[];
}[] = [
  {
    group: 'Plus Jakarta Sans — display · heroic · personalitat',
    entries: [
      { role: 'H1 pàgina', spec: '40px / 800 / -0.01em', sample: 'Casaments 2026', use: 'Títol principal de pàgina', style: { fontSize: 40, fontWeight: 800, letterSpacing: '-0.01em', fontFamily: 'var(--font-display)', lineHeight: 1 } },
      { role: 'Focus Name', spec: '28px / 800 / -0.015em', sample: 'Boda · Laia i Nil', use: 'Nom del bolo al Focus Card', style: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.015em', fontFamily: 'var(--font-display)' } },
      { role: 'Valor clau', spec: '24px / 800 / -0.01em', sample: '2.490 €', use: 'Import/valor econòmic destacat', style: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' } },
      { role: 'Mes / Lane', spec: '23px / 800 / -0.01em', sample: 'Juny · 4 bolos', use: 'Capçalera de mes i lane de pipeline', style: { fontSize: 23, fontWeight: 800, letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' } },
      { role: 'Nom pipeline', spec: '16px / 800 / -0.01em', sample: 'Marta i Pere · Boda', use: 'Nom de lead a la targeta pipeline', style: { fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' } },
      { role: 'Nom cel·la', spec: '15px / 800 / -0.01em', sample: 'Laia i Nil', use: 'Nom de lead a cel·la de calendari', style: { fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' } },
    ],
  },
  {
    group: 'Inter — UI funcional · navegació · botons',
    entries: [
      { role: 'Sidebar item', spec: '14.5px / 700', sample: 'Leads · Pipeline', use: 'Ítem de menú lateral', style: { fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-inter)' } },
      { role: 'Sub-nav', spec: '13.5px / 650', sample: 'Primavera 2026', use: 'Subítem de menú, pestanya', style: { fontSize: 13.5, fontWeight: 650, fontFamily: 'var(--font-inter)' } },
      { role: 'Botó primari', spec: '14px / 750 / 0.01em', sample: '+ Nova entrada', use: 'CTA del sidebar (botó de vora)', style: { fontSize: 14, fontWeight: 750, letterSpacing: '0.01em', fontFamily: 'var(--font-inter)' } },
      { role: 'Body meta', spec: '14px / 400', sample: 'Casament · 120 pax · Vallromanes', use: 'Metadades del bolo, body de fitxa', style: { fontSize: 14, fontFamily: 'var(--font-inter)' } },
    ],
  },
  {
    group: 'Inter tabular — dades · dates · imports · IDs',
    entries: [
      { role: 'Eyebrow / label', spec: '11px / 700 / 0.14em UP', sample: 'LEADS OBERTS', use: 'Eyebrow, captions, labels de secció', style: { fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--o-font-data)', fontVariantNumeric: 'tabular-nums' } },
      { role: 'Focus meta', spec: '12.5px / 500 / tabular', sample: '14 jun 2026 · 120 pax · Vallromanes', use: 'Metadades al Focus Card', style: { fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--o-font-data)', fontVariantNumeric: 'tabular-nums' } },
      { role: 'Sub-títol pàgina', spec: '13px / 500 / tabular', sample: 'Jun – Ago 2026 · caps de setmana', use: 'Subtítol de pàgina i períodes', style: { fontSize: 13, fontWeight: 500, fontFamily: 'var(--o-font-data)', fontVariantNumeric: 'tabular-nums' } },
      { role: 'Data / ID', spec: '12px / 500 / tabular', sample: 'OE-LX9K2A · 2026-05-25', use: 'IDs, dates, codis de referència', style: { fontSize: 12, fontWeight: 500, fontFamily: 'var(--o-font-data)', fontVariantNumeric: 'tabular-nums' } },
    ],
  },
];

/* ── 15 · Documents PDF — índex ───────────────────────────────────────────── */
const PDF_DOCS = [
  ...PDF_DOCUMENT_CATALOG.map((document) => ({
    name: document.name,
    gen: `${document.generator} · ${document.theme}`,
  })),
];

/* ── Menú lateral (TOC) — 16 seccions ─────────────────────────────────────── */
const SECTIONS: { num: string; id: string; label: string }[] = [
  { num: '00', id: 'marca', label: 'Marca' },
  { num: '01', id: 'paleta', label: 'Paleta' },
  { num: '02', id: 'tipografia', label: 'Tipografia' },
  { num: '03', id: 'spacing', label: 'Spacing & Radii' },
  { num: '04', id: 'iconografia', label: 'Iconografia' },
  { num: '05', id: 'actius', label: 'Actius del repo' },
  { num: '06', id: 'botons', label: 'Botons' },
  { num: '07', id: 'inputs', label: 'Inputs' },
  { num: '08', id: 'cards', label: 'Cards' },
  { num: '09', id: 'estats', label: 'Estats' },
  { num: '10', id: 'alertes', label: 'Alertes' },
  { num: '11', id: 'responsive', label: 'Responsive' },
  { num: '12', id: 'layout', label: 'Layout' },
  { num: '13', id: 'veu', label: 'To de veu' },
  { num: '14', id: 'comunicacions', label: 'Comunicacions' },
  { num: '15', id: 'pdfs', label: 'PDFs' },
  { num: '16', id: 'lab-paleta', label: 'Lab · Paleta' },
  { num: '17', id: 'lab-tipografia', label: 'Lab · Tipografia' },
  { num: '18', id: 'lab-components', label: 'Lab · Components' },
  { num: '19', id: 'cataleg-comercial', label: 'Catàleg comercial' },
];

type PdfId = PdfDocumentId;

function SectionHead({ num, title, intro }: { num: string; title: string; intro: string }) {
  return (
    <>
      <div className="o-spec-section__num">{num}</div>
      <h2 className="o-spec-section__title">{title}</h2>
      <p className="o-spec-section__intro">{intro}</p>
    </>
  );
}

function PdfPreviewHeader({ title, subtitle, docRef }: { title: string; subtitle?: string; docRef?: string }) {
  return (
    <div className="o-pdfdoc__header o-pdfdoc__header--dark">
      <div className="o-pdfdoc__brand">
        <img src={ORBITA_LOGO_LOCKUP_LIGHT_BASE64} alt="Òrbita Events" />
      </div>
      <div className="o-pdfdoc__meta">
        <strong className="o-pdfdoc__header-title">{title}</strong>
        {subtitle && <span className="o-pdfdoc__header-subtitle">{subtitle}</span>}
        {docRef && <span className="o-pdfdoc__header-ref">{docRef}</span>}
      </div>
    </div>
  );
}

export default function StudioShowroom() {
  const [openComm, setOpenComm] = useState<string | null>('welcome');
  const [pdf, setPdf] = useState<PdfId>('pressupost');
  const activePdfDocument = PDF_DOCUMENT_CATALOG.find((document) => document.id === pdf) ?? PDF_DOCUMENT_CATALOG[0];

  return (
    <div className="o-studio-root">
      <div className="o-spec-shell">
        {/* ── TOC ── */}
        <aside className="o-spec-toc">
          <div className="o-brand">
            <span className="o-brand__text">
              <span className="o-brand__name">Òrbita</span>
              <span className="o-brand__sub">Sistema · v0.6</span>
            </span>
          </div>
          <nav className="o-spec-toc__nav" aria-label="Seccions">
            {SECTIONS.map((s) => (
              <a key={s.id} className="o-spec-toc__item" href={`#sec-${s.id}`}>
                {s.num} · {s.label}
              </a>
            ))}
          </nav>
          <div className="o-spec-toc__foot">
            <a className="o-spec-toc__back" href="/admin">← Admin actual</a>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="o-spec-main">
          <header className="o-spec-header">
            <div className="o-spec-header__crumb">Studio · fitxa tècnica</div>
            <h1 className="o-spec-header__title">Sistema visual Òrbita</h1>
            <p className="o-spec-header__sub">
              Tots els tokens, components, comunicacions i documents que defineixen l&apos;aspecte i la veu
              del nou admin. Tot el que el client veu i tot el que l&apos;admin manipula passa per aquí.
            </p>
            <div className="o-spec-header__stats">
              <div><strong>20</strong> seccions</div>
              <div><strong>16</strong> tokens</div>
              <div><strong>16</strong> icones</div>
              <div><strong>8</strong> comunicacions</div>
              <div><strong>5</strong> documents</div>
            </div>
          </header>

          {/* 00 · Marca */}
          <section className="o-spec-section" id="sec-marca">
            <SectionHead num="00" title="Marca" intro="Logotip, nom i regles d'ús · principi: sobri i únic" />
            <div className="o-grid-2">
              <div className="o-spec-brand-card">
                <div className="o-spec-brand-card__visual">
                  {/* eslint-disable-next-line @next/next/no-img-element -- /studio és noindex intern amb logos SVG; next/image els necessitaria dangerouslyAllowSVG global */}
                  <img className="o-spec-brand-logo" src="/img/orbitalockupwhite.svg" alt="Lockup Òrbita blanc" />
                </div>
                <div className="o-spec-brand-card__data">
                  <div className="o-spec-brand-card__row"><span>Actiu</span><code>orbitalockupwhite.svg</code></div>
                  <div className="o-spec-brand-card__row"><span>Símbol</span><code>Planeta + òrbita</code></div>
                  <div className="o-spec-brand-card__row"><span>Ús</span><code>Headers, fons foscos</code></div>
                </div>
              </div>
              <div className="o-spec-brand-card">
                <div className="o-spec-brand-card__visual o-spec-asset__preview--light">
                  {/* eslint-disable-next-line @next/next/no-img-element -- /studio és noindex intern amb logos SVG; next/image els necessitaria dangerouslyAllowSVG global */}
                  <img className="o-spec-brand-logo" src="/img/orbitalockupdark.svg" alt="Lockup Òrbita fosc" />
                </div>
                <div className="o-spec-brand-card__data">
                  <div className="o-spec-brand-card__row"><span>Actiu</span><code>orbitalockupdark.svg</code></div>
                  <div className="o-spec-brand-card__row"><span>Variant</span><code>Sobre fons clar</code></div>
                  <div className="o-spec-brand-card__row"><span>Espai mínim</span><code>16px al voltant</code></div>
                </div>
              </div>
            </div>
            <div className="o-spec-rules">
              <div className="o-spec-rules__col o-spec-rules__col--do">
                <h4>✓ Sí</h4>
                <ul>
                  <li>Logo + nom junts en headers principals</li>
                  <li>Sol logo en mides petites (favicon, badges)</li>
                  <li>Color or pur o ink invertit</li>
                </ul>
              </div>
              <div className="o-spec-rules__col o-spec-rules__col--dont">
                <h4>✗ No</h4>
                <ul>
                  <li>Mai canviar la proporció del símbol</li>
                  <li>Mai el logo sobre fons sorollós</li>
                  <li>Mai el daurat amb degradats</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 01 · Paleta */}
          <section className="o-spec-section" id="sec-paleta">
            <SectionHead num="01" title="Paleta" intro="16 tokens · 4 grups · sobris i sense neon" />
            {PALETTE.map((g) => (
              <div className="o-spec-group" key={g.group}>
                <h3 className="o-spec-group__title">{g.group}</h3>
                <div className="o-spec-swatches">
                  {g.items.map((c) => (
                    <div className="o-spec-swatch" key={c.token}>
                      <div className="o-spec-swatch__chip" style={{ background: `var(${c.token})` }} />
                      <div className="o-spec-swatch__data">
                        <span className="o-spec-swatch__name">{c.name}</span>
                        <span className="o-spec-swatch__token">{c.token}</span>
                        <span className="o-spec-swatch__hex">{c.hex}</span>
                        <span className="o-spec-swatch__use">{c.use}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* 02 · Tipografia */}
          <section className="o-spec-section" id="sec-tipografia">
            <SectionHead num="02" title="Tipografia" intro="Inter (UI i dades) · Plus Jakarta Sans (display) · numerals tabulars amb zeros nets" />
            <div className="o-spec-types">
              {TYPE_SCALE.map((t) => (
                <div className="o-spec-type-row" key={t.name}>
                  <div className="o-spec-type-meta">
                    <span className="o-spec-type-name">{t.name}</span>
                    <span className="o-spec-type-spec">{t.spec}</span>
                    <span className="o-spec-type-use">{t.use}</span>
                  </div>
                  <div className="o-spec-type-sample" style={t.style}>{t.sample}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 03 · Spacing & Radii */}
          <section className="o-spec-section" id="sec-spacing">
            <SectionHead num="03" title="Spacing & Radii" intro="Base 4px · escala geomètrica · zero gaps fora del sistema" />
            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Spacing</h3>
              <div className="o-spec-spaces">
                {SPACES.map((s) => (
                  <div className="o-spec-space" key={s.token}>
                    <span className="o-spec-space__token">{s.token}</span>
                    <div className="o-spec-space__bar" style={{ width: s.px }} />
                    <span className="o-spec-space__px">{s.px}px</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Radii</h3>
              <div className="o-spec-radii">
                {RADII.map((r) => (
                  <div className="o-spec-radius" key={r.token}>
                    <div className="o-spec-radius__shape" style={{ borderRadius: r.px === 999 ? 999 : r.px }} />
                    <span className="o-spec-radius__token">{r.token}</span>
                    <span className="o-spec-radius__use">{r.use}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 04 · Iconografia */}
          <section className="o-spec-section" id="sec-iconografia">
            <SectionHead num="04" title="Iconografia" intro="16 icones · stroke 1.5-2px · arrodoniments · 16×16 base · monolínia" />
            <div className="o-spec-icons">
              {ICONS.map((i) => (
                <div className="o-spec-icon" key={i.name}>
                  <div className="o-spec-icon__box">{i.node}</div>
                  <code>{i.name}</code>
                </div>
              ))}
            </div>
          </section>

          {/* 05 · Actius del repo */}
          <section className="o-spec-section" id="sec-actius">
            <SectionHead num="05" title="Actius del repo" intro="Logotips, favicons i imatge social — fitxers reals servits des de /public" />
            <div className="o-spec-assets">
              <div className="o-spec-group">
                <h3 className="o-spec-group__title">Logotips de marca · /public/img</h3>
                <div className="o-spec-asset-grid">
                  {BRAND_LOGOS.map((b) => (
                    <div className="o-spec-asset" key={b.file}>
                      <div className={`o-spec-asset__preview o-spec-asset__preview--wide${b.light ? ' o-spec-asset__preview--light' : ''}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- /studio és noindex intern amb logos SVG; next/image els necessitaria dangerouslyAllowSVG global */}
                        <img src={b.src} alt={b.file} />
                      </div>
                      <span className="o-spec-asset__name">{b.file}</span>
                      <span className="o-spec-asset__use">{b.use}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="o-spec-group">
                <h3 className="o-spec-group__title">Vectorials · SVG</h3>
                <div className="o-spec-asset-grid">
                  {FAVICON_VEC.map((f) => (
                    <div className="o-spec-asset" key={f}>
                      <div className="o-spec-asset__preview">
                        {/* eslint-disable-next-line @next/next/no-img-element -- /studio és noindex intern amb logos SVG; next/image els necessitaria dangerouslyAllowSVG global */}
                        <img src={`/${f}`} alt={f} />
                      </div>
                      <span className="o-spec-asset__name">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="o-spec-group">
                <h3 className="o-spec-group__title">Raster · PNG + Open Graph</h3>
                <div className="o-spec-asset-grid">
                  {FAVICON_RASTER.map((f) => (
                    <div className="o-spec-asset" key={f}>
                      <div className="o-spec-asset__preview">
                        {/* eslint-disable-next-line @next/next/no-img-element -- /studio és noindex intern amb logos SVG; next/image els necessitaria dangerouslyAllowSVG global */}
                        <img src={`/${f}`} alt={f} />
                      </div>
                      <span className="o-spec-asset__name">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="o-spec-group">
                <h3 className="o-spec-group__title">Portfolio públic · covers reals</h3>
                <div className="o-spec-asset-grid o-spec-asset-grid--media">
                  {PORTFOLIO_ASSETS.map((item) => (
                    <div className="o-spec-asset" key={item.slug}>
                      <div className="o-spec-asset__preview o-spec-asset__preview--photo">
                        {/* eslint-disable-next-line @next/next/no-img-element -- /studio mostra fitxers reals de /public sense pipeline d'optimització */}
                        <img src={item.cover} alt={item.name} />
                      </div>
                      <span className="o-spec-asset__name">{item.name}</span>
                      <span className="o-spec-asset__use">{item.cover}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="o-spec-group">
                <h3 className="o-spec-group__title">Logos de clients · prova social</h3>
                <div className="o-spec-asset-grid">
                  {CLIENT_LOGO_ASSETS.map((src) => {
                    const file = src.split('/').at(-1) || src;
                    return (
                      <div className="o-spec-asset" key={src}>
                        <div className="o-spec-asset__preview o-spec-asset__preview--light">
                          {/* eslint-disable-next-line @next/next/no-img-element -- /studio mostra fitxers reals de /public sense pipeline d'optimització */}
                          <img src={src} alt={file} />
                        </div>
                        <span className="o-spec-asset__name">{file}</span>
                        <span className="o-spec-asset__use">Logo client · home / confiança</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 06 · Botons */}
          <section className="o-spec-section" id="sec-botons">
            <SectionHead num="06" title="Botons" intro="4 variants · 3 mides · primary amb relleu 3D real" />
            <div className="o-row">
              <button type="button" className="o-btn o-btn--primary o-btn--sm">SM</button>
              <button type="button" className="o-btn o-btn--primary">Acció principal</button>
              <button type="button" className="o-btn o-btn--primary o-btn--lg">Acció gran</button>
            </div>
            <div className="o-row">
              <button type="button" className="o-btn o-btn--secondary o-btn--sm">SM</button>
              <button type="button" className="o-btn o-btn--secondary">Secundària</button>
              <button type="button" className="o-btn o-btn--ghost">Ghost</button>
              <button type="button" className="o-btn o-btn--danger">Eliminar</button>
            </div>
          </section>

          {/* 07 · Inputs */}
          <section className="o-spec-section" id="sec-inputs">
            <SectionHead num="07" title="Inputs" intro="Text · select · textarea · search · focus daurat · disabled visible" />
            <div className="o-form-card">
              <div className="o-grid-2">
                <div className="o-field">
                  <label className="o-field__label" htmlFor="st-text">Text</label>
                  <input className="o-input" id="st-text" placeholder="Exemple" />
                </div>
                <div className="o-field">
                  <label className="o-field__label" htmlFor="st-select">Select</label>
                  <select className="o-select" id="st-select" aria-label="Tipus d'event">
                    <option>Boda</option>
                    <option>Comunió</option>
                  </select>
                </div>
                <div className="o-field">
                  <label className="o-field__label" htmlFor="st-search">Search</label>
                  <input className="o-input" id="st-search" placeholder="Cercar..." />
                </div>
                <div className="o-field">
                  <label className="o-field__label" htmlFor="st-dis">Disabled</label>
                  <input className="o-input" id="st-dis" placeholder="No disponible" disabled />
                </div>
              </div>
              <div className="o-field">
                <label className="o-field__label" htmlFor="st-area">Textarea</label>
                <textarea className="o-textarea" id="st-area" rows={3} placeholder="Notes internes..." />
              </div>
            </div>
          </section>

          {/* 08 · Cards */}
          <section className="o-spec-section" id="sec-cards">
            <SectionHead num="08" title="Cards i panels" intro="Card base · panel amb to · tint subtil segons importància" />
            <div className="o-system-grid">
              <div className="o-sys-card">
                <h3 className="o-sys-card__title">Card base <span className="o-pill o-pill--neutral">neutre</span></h3>
                <p className="o-spec-section__intro">Contenidor general. Padding generós, border subtle.</p>
              </div>
              <div className="o-sys-card">
                <h3 className="o-sys-card__title">Card amb to <span className="o-pill o-pill--accent">accent</span></h3>
                <p className="o-spec-section__intro">Variant amb tint per indicar importància o estat.</p>
              </div>
            </div>
          </section>

          {/* 09 · Estats */}
          <section className="o-spec-section" id="sec-estats">
            <SectionHead num="09" title="Estats" intro="Sempre el mateix to per al mateix significat — vocabulari únic a tot l'admin" />
            <div className="o-row">
              {STATES.map((s) => (
                <span className={`o-pill o-pill--${s.tone}`} key={s.label}>
                  <span className={`o-dot o-dot--${s.tone}`} />{s.label}
                </span>
              ))}
            </div>
          </section>

          {/* 10 · Alertes */}
          <section className="o-spec-section" id="sec-alertes">
            <SectionHead num="10" title="Alertes i banners" intro="Una sola alerta visible alhora. Mai un panell d'alertes." />
            <a className="o-now o-now--danger" href="#sec-alertes">
              <span className="o-now__icon">{ICONS.find((i) => i.name === 'alert')?.node}</span>
              <span className="o-now__body">
                <span className="o-now__title">Ara atens · crític</span>
                <span className="o-now__msg">1 lead fa 3 dies sense contactar — Exemple · Boda · 14 jun</span>
              </span>
              <span className="o-now__cta">Obrir →</span>
            </a>
            <a className="o-now" href="#sec-alertes">
              <span className="o-now__icon">{ICONS.find((i) => i.name === 'alert')?.node}</span>
              <span className="o-now__body">
                <span className="o-now__title">Ara atens · atenció</span>
                <span className="o-now__msg">Pressupost enviat fa 5 dies sense resposta — Exemple · Empresa</span>
              </span>
            </a>
          </section>

          {/* 11 · Responsive */}
          <section className="o-spec-section" id="sec-responsive">
            <SectionHead num="11" title="Responsive" intro="4 breakpoints · mobile-first · el sidebar es plega abans dels 900px" />
            <div className="o-spec-bps">
              {BREAKPOINTS.map((b) => (
                <div className="o-spec-bp" key={b.name}>
                  <div className="o-spec-bp__head">
                    <span className="o-spec-bp__name">{b.name}</span>
                    <code>{b.code}</code>
                  </div>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 12 · Layout */}
          <section className="o-spec-section" id="sec-layout">
            <SectionHead num="12" title="Layout estàndard" intro="Sidebar slim 200px · Main amb command bar fixa · Content scrollejable" />
            <div className="o-spec-layout">
              <div className="o-spec-layout__sidebar">
                <div className="o-spec-layout__brand">Òrbita</div>
                <div className="o-spec-layout__nav-item">Leads</div>
                <div className="o-spec-layout__nav-item o-spec-layout__nav-item--active">Reserves</div>
                <div className="o-spec-layout__nav-item">Clients</div>
                <div className="o-spec-layout__nav-item">Safata</div>
                <div className="o-spec-layout__nav-item">Config</div>
              </div>
              <div className="o-spec-layout__main">
                <div className="o-spec-layout__cmd">⌘ Command bar (omnipresent)</div>
                <div className="o-spec-layout__content">
                  <div className="o-spec-layout__box">Capçalera de pàgina</div>
                  <div className="o-spec-layout__box">Contingut principal</div>
                  <div className="o-spec-layout__box">Stats bar (KPIs compactes)</div>
                </div>
              </div>
            </div>
          </section>

          {/* 13 · To de veu */}
          <section className="o-spec-section" id="sec-veu">
            <SectionHead num="13" title="To de veu (al client)" intro="Càlid, directe, sense disclaimers · senyal de marca quan el client llegeix" />
            <div className="o-spec-voice">
              <div className="o-spec-voice__col o-spec-voice__col--do">
                <h4>✓ Sí</h4>
                <ul>{VOICE_DO.map((v) => <li key={v}>{v}</li>)}</ul>
              </div>
              <div className="o-spec-voice__col o-spec-voice__col--dont">
                <h4>✗ No</h4>
                <ul>{VOICE_DONT.map((v) => <li key={v}>{v}</li>)}</ul>
              </div>
            </div>
          </section>

          {/* 14 · Comunicacions */}
          <section className="o-spec-section" id="sec-comunicacions">
            <SectionHead num="14" title="Comunicacions automàtiques" intro="8 plantilles d'email · disparades per esdeveniments · editables a /admin/email-templates" />
            <div className="o-comms-list">
              {EMAIL_COMMS.map((c) => {
                const open = openComm === c.slug;
                return (
                  <div className={`o-comm${open ? ' o-comm--open' : ''}`} key={c.slug}>
                    <button
                      type="button"
                      className="o-comm__head"
                      aria-expanded={open}
                      onClick={() => setOpenComm(open ? null : c.slug)}
                    >
                      <span className="o-comm__icon">{ICONS.find((i) => i.name === 'mail')?.node}</span>
                      <span className="o-comm__top">
                        <span className="o-comm__slug">{c.slug}</span>
                        <span className="o-comm__subject">{c.subject}</span>
                      </span>
                      <span className="o-comm__locales">
                        {c.locales.map((l) => <span className="o-comm__locale" key={l}>{l}</span>)}
                      </span>
                      <span className="o-comm__chev">{open ? '−' : '+'}</span>
                    </button>
                    {open && (
                      <div className="o-comm__body">
                        <div className="o-comm__field">
                          <span className="o-comm__label">Trigger</span>
                          <p>{c.trigger}</p>
                        </div>
                        <div className="o-comm__field">
                          <span className="o-comm__label">Cos</span>
                          <p>{c.body}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 15 · PDFs */}
          <section className="o-spec-section" id="sec-pdfs">
            <SectionHead num="15" title="Documents PDF" intro="Catàleg canònic únic · paper ivori càlid · accent de marca · previsualització A4 responsive · gràfiques amb primitives jsPDF" />
            <div className="o-pdf-switch" role="tablist" aria-label="Documents PDF">
              {PDF_DOCUMENT_CATALOG.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  role="tab"
                  aria-selected={pdf === document.id}
                  aria-controls="pdf-preview"
                  onClick={() => setPdf(document.id)}
                >
                  {document.name}
                </button>
              ))}
            </div>

            <div className="o-pdf-canonical">
              <div>
                <span>Generador canònic</span>
                <strong>{activePdfDocument.generator}</strong>
              </div>
              <div>
                <span>Seccions obligatòries</span>
                <strong>{activePdfDocument.sections.join(' · ')}</strong>
              </div>
              <div>
                <span>Seccions opcionals</span>
                <strong>{activePdfDocument.optionalSections.join(' · ') || 'Cap'}</strong>
              </div>
              <div>
                <span>Paginació</span>
                <strong>{activePdfDocument.pagination}</strong>
              </div>
            </div>

            <div className="o-pdfdoc-wrap" id="pdf-preview" role="tabpanel">
              {activePdfDocument.previewUrl && (
                <iframe
                  className="o-pdf-iframe"
                  src={activePdfDocument.previewUrl}
                  title={activePdfDocument.previewTitle}
                />
              )}
              {pdf === 'dossier' && (
                <div className="o-pdfdoc o-pdfdoc--dossier">
                  <div className="o-dossier-cover">
                    <img src="/img/logoplanetatextdreta.svg" alt="Òrbita Events" />
                    <div className="o-dossier-cover__line" />
                    <strong>Maria Garcia</strong>
                    <span>Dossier de propostes · Òrbita Events</span>
                  </div>
                  <div className="o-dossier-proposal">
                    <div className="o-dossier-proposal__header"><img src="/img/logoplanetatextdreta.svg" alt="Òrbita Events" /></div>
                    <div className="o-dossier-proposal__title"><span>Proposta 01</span><strong>Bingo musical</strong></div>
                    <p>Descripció comercial editable i adaptada a la proposta seleccionada.</p>
                    <div className="o-dossier-includes">
                      {['Presentador/a i DJ', 'Material de joc', 'Equip de so', 'Durada 1h30'].map((item) => <span key={item}>{item}</span>)}
                    </div>
                    <table className="o-dossier-table">
                      <thead><tr><th scope="col">Participants</th><th scope="col">Equip</th><th scope="col">Preu</th></tr></thead>
                      <tbody>
                        <tr><td>15–60 persones</td><td>DJ + Presentador/a</td><td>250€</td></tr>
                        <tr><td>61–110 persones</td><td>DJ + Presentador/a + assistent/a</td><td>300€</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="o-dossier-greeting">
                    {'Hola Maria, gràcies per contactar amb nosaltres. T\'enviem aquestes propostes d\'animació pensades per al vostre event.'}
                  </div>
                  <div className="o-dossier-cta"><span>Per confirmar disponibilitat o per a qualsevol dubte</span><strong>+34 699 12 10 23 · info@orbitaevents.com</strong></div>
                </div>
              )}
            </div>

            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Índex de documents</h3>
              <div className="o-pdf-list">
                {PDF_DOCS.map((d) => (
                  <div className="o-pdf" key={d.name}>
                    <span className="o-pdf__icon">{ICONS.find((i) => i.name === 'pdf')?.node}</span>
                    <div>
                      <p className="o-pdf__name">{d.name}</p>
                      <p className="o-pdf__use">{d.gen}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 16 · Lab · Paleta Obsidiana */}
          <section className="o-spec-section" id="sec-lab-paleta">
            <SectionHead num="16" title="Lab · Paleta Obsidiana" intro="«Brass & Obsidian» — obsidiana càlida (mai negre pur ni slate fred), or sobri com a identitat de marca + diners. 4 tons joia per als estats del pipeline (sense blau, sense candy)." />
            {LAB_PALETTE_GROUPS.map((g) => (
              <div className="o-spec-group" key={g.group}>
                <h3 className="o-spec-group__title">{g.group}</h3>
                <div className="o-spec-swatches">
                  {g.items.map((c) => (
                    <div className="o-spec-swatch" key={c.token}>
                      <div className="o-spec-swatch__chip" style={{ background: c.hex }} />
                      <div className="o-spec-swatch__data">
                        <span className="o-spec-swatch__name">{c.name}</span>
                        <span className="o-spec-swatch__token">{c.token}</span>
                        <span className="o-spec-swatch__hex">{c.hex}</span>
                        <span className="o-spec-swatch__use">{c.use}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Estats del pipeline · quartet joia (sense blau, sense candy)</h3>
              <div className="o-lab-states">
                {LAB_STAGES.map((s) => (
                  <div
                    className="o-lab-state"
                    key={s.slug}
                    style={{ '--c': s.hex, background: `color-mix(in oklab, ${s.hex} 10%, #131318)`, border: `1px solid color-mix(in oklab, ${s.hex} 28%, transparent)` } as React.CSSProperties}
                  >
                    <span className="o-lab-state__dot" />
                    <span className="o-lab-state__label">{s.label}</span>
                    <span className="o-lab-state__hex">{s.hex}</span>
                    <span className="o-lab-state__use">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="o-spec-rules">
              <div className="o-spec-rules__col o-spec-rules__col--do">
                <h4>✓ Or = Diners · Marca · Acció primària</h4>
                <ul>
                  <li>Imports, marges, totals (valors monetaris)</li>
                  <li>CTA «Nova entrada» (botó primari de vora)</li>
                  <li>Hairlines de mark-up de l&apos;UI (vores decoratives)</li>
                  <li>Cursor actiu: l&apos;element seleccionat ara</li>
                </ul>
              </div>
              <div className="o-spec-rules__col o-spec-rules__col--dont">
                <h4>✗ No usar or per a</h4>
                <ul>
                  <li>Comptadors d&apos;entrades (→ blanc càlid <code>--t</code>)</li>
                  <li>Probabilitats en % (→ blanc càlid <code>--t</code>)</li>
                  <li>Pax / nombre de convidats (→ blanc càlid <code>--t</code>)</li>
                  <li>Estats del pipeline (→ tons joia dedicats per estat)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 17 · Lab · Tipografia */}
          <section className="o-spec-section" id="sec-lab-tipografia">
            <SectionHead num="17" title="Lab · Tipografia" intro="Dues famílies amb rol clar: Plus Jakarta Sans per display i Inter per UI, dades, dates, imports i IDs. Numerals tabulars sense zero barrat." />
            {LAB_TYPE_GROUPS.map((g) => (
              <div className="o-spec-group" key={g.group}>
                <h3 className="o-spec-group__title">{g.group}</h3>
                <div className="o-spec-types">
                  {g.entries.map((t) => (
                    <div className="o-spec-type-row" key={t.role}>
                      <div className="o-spec-type-meta">
                        <span className="o-spec-type-name">{t.role}</span>
                        <span className="o-spec-type-spec">{t.spec}</span>
                        <span className="o-spec-type-use">{t.use}</span>
                      </div>
                      <div className="o-spec-type-sample" style={t.style}>{t.sample}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* 18 · Lab · Components */}
          <section className="o-spec-section" id="sec-lab-components">
            <SectionHead num="18" title="Lab · Components" intro="Patrons del laboratori: botó de vora (no sòlid), tira de mètriques (or=diners), Focus Card (decisió ara), targeta pipeline, cel·les de calendari i sidebar." />

            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Botó de vora primari — hairline d&apos;or + fons fosc + sheen</h3>
              <div className="o-lab-demo">
                <p className="o-lab-demo-label">border 1px solid --hair-gold · background gradient --raised+--panel · color --gold-bright · mai sòlid</p>
                <div className="o-row">
                  <button type="button" className="o-lab-btn-border">+ Nova entrada</button>
                  <button type="button" className="o-lab-btn-border o-lab-btn-border--sm">Exportar</button>
                </div>
              </div>
            </div>

            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Tira de mètriques — doctrina or=diners</h3>
              <div className="o-lab-demo">
                <p className="o-lab-demo-label">top border --hair-gold · 4 cel·les · imports → --gold-bright · counts/% → --t (blanc càlid)</p>
                <div className="o-lab-metrics">
                  <div className="o-lab-metric o-lab-metric--count">
                    <span className="o-lab-metric__label">Leads</span>
                    <strong className="o-lab-metric__val">8</strong>
                    <span className="o-lab-metric__note">count → blanc</span>
                  </div>
                  <div className="o-lab-metric">
                    <span className="o-lab-metric__label">Valor total</span>
                    <strong className="o-lab-metric__val">24.800 €</strong>
                    <span className="o-lab-metric__note">diners → or</span>
                  </div>
                  <div className="o-lab-metric">
                    <span className="o-lab-metric__label">Marge mig</span>
                    <strong className="o-lab-metric__val">3.100 €</strong>
                    <span className="o-lab-metric__note">diners → or</span>
                  </div>
                  <div className="o-lab-metric o-lab-metric--count">
                    <span className="o-lab-metric__label">Prob. mit.</span>
                    <strong className="o-lab-metric__val">62%</strong>
                    <span className="o-lab-metric__note">% → blanc</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Focus Card — la decisió que toca ara</h3>
              <div className="o-lab-demo">
                <p className="o-lab-demo-label">border-left 3px --c · gradient de l&apos;estat · top --hair-gold · eyebrow gold-bright · nom display 28px · valor or</p>
                <div className="o-lab-focus" style={{ '--c': '#3fa06a' } as React.CSSProperties}>
                  <div className="o-lab-focus__ew">↗ Focus · decisió ara</div>
                  <div className="o-lab-focus__name">Boda · Laia i Nil</div>
                  <div className="o-lab-focus__meta">14 jun 2026 · 120 pax · Mas de Sant Lleí</div>
                  <div className="o-lab-focus__val">2.490 €</div>
                </div>
                <div className="o-lab-focus" style={{ '--c': '#9d83c2' } as React.CSSProperties}>
                  <div className="o-lab-focus__ew">↗ Focus · decisió ara</div>
                  <div className="o-lab-focus__name">Empresa · Aniversari Gremi</div>
                  <div className="o-lab-focus__meta">21 jun 2026 · 200 pax · Fira de Barcelona</div>
                  <div className="o-lab-focus__val">4.800 €</div>
                </div>
              </div>
            </div>

            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Targeta pipeline — vista kanban</h3>
              <div className="o-lab-demo">
                <p className="o-lab-demo-label">border-left 3px --c · gradient d&apos;estat · nom display 15px/800 · valor gold-bright · barra de probabilitat</p>
                <div className="o-row" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start' }}>
                  {([
                    { c: '#e0922b', s: '#b45309', name: 'Marta i Pere', val: '1.890 €', meta: 'Boda · 120 pax · 14 jun', prob: 20 },
                    { c: '#9d83c2', s: '#6a4f9c', name: 'Gremi Aniversari', val: '4.800 €', meta: 'Empresa · 200 pax · 21 jun', prob: 55 },
                    { c: '#3fa06a', s: '#1f7a4c', name: 'Laia i Nil', val: '2.490 €', meta: 'Boda · 100 pax · 5 jul', prob: 100 },
                  ] as const).map((l) => (
                    <div className="o-lab-pipe-card" key={l.name} style={{ '--c': l.c, flex: '1 1 180px' } as React.CSSProperties}>
                      <div className="o-lab-pipe-card__top">
                        <span className="o-lab-pipe-card__name">{l.name}</span>
                        <span className="o-lab-pipe-card__val">{l.val}</span>
                      </div>
                      <div className="o-lab-pipe-card__meta">{l.meta}</div>
                      <div className="o-lab-pipe-card__bar">
                        <div className="o-lab-pipe-card__prog" style={{ width: `${l.prob}%`, background: `linear-gradient(90deg, ${l.s}, ${l.c})` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Cel·les de calendari — forat silenciós vs reservat en relleu</h3>
              <div className="o-lab-demo">
                <p className="o-lab-demo-label">Lliure = dashed + sunk background · Reservat = border-left --c + gradient d&apos;estat + relleu físic</p>
                <div className="o-lab-cells">
                  <div className="o-lab-cell o-lab-cell--free">
                    <span className="o-lab-cell__day">14</span>
                    <span className="o-lab-cell__free-label">Lliure</span>
                  </div>
                  <div className="o-lab-cell o-lab-cell--lead" style={{ '--c': '#e0922b' } as React.CSSProperties}>
                    <span className="o-lab-cell__day">21</span>
                    <span className="o-lab-cell__name">Marta i Pere</span>
                    <span className="o-lab-cell__type">Boda</span>
                  </div>
                  <div className="o-lab-cell o-lab-cell--lead" style={{ '--c': '#9d83c2' } as React.CSSProperties}>
                    <span className="o-lab-cell__day">28</span>
                    <span className="o-lab-cell__name">Gremi Aniversari</span>
                    <span className="o-lab-cell__type">Empresa</span>
                  </div>
                  <div className="o-lab-cell o-lab-cell--free">
                    <span className="o-lab-cell__day">5</span>
                    <span className="o-lab-cell__free-label">Lliure</span>
                  </div>
                  <div className="o-lab-cell o-lab-cell--lead" style={{ '--c': '#3fa06a' } as React.CSSProperties}>
                    <span className="o-lab-cell__day">12</span>
                    <span className="o-lab-cell__name">Laia i Nil</span>
                    <span className="o-lab-cell__type">Boda</span>
                  </div>
                  <div className="o-lab-cell o-lab-cell--free">
                    <span className="o-lab-cell__day">19</span>
                    <span className="o-lab-cell__free-label">Lliure</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Sidebar navigation — idle vs actiu</h3>
              <div className="o-lab-demo">
                <p className="o-lab-demo-label">Actiu = gradient gold+raised · hairline border · accent bar 3px esquerra · text gold-bright · Idle = transparent · --t2</p>
                <div className="o-lab-side">
                  {['Calendari', 'Leads · Pipeline', 'Reserves', 'Clients', 'Safata d\'entrada'].map((item) => (
                    <div
                      key={item}
                      className={`o-lab-side__item${item === 'Leads · Pipeline' ? ' o-lab-side__item--active' : ' o-lab-side__item--idle'}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 19 · Catàleg comercial */}
          <section className="o-spec-section" id="sec-cataleg-comercial">
            <SectionHead num="19" title="Catàleg comercial" intro="Catàleg públic real: serveis, packs, extres, inventari base i actius que alimenten configurador, pressupostos, PDFs i admin." />
            <div className="o-catalog-grid">
              {SERVICE_CATALOG.map((service) => {
                const packs = servicePacks(service.slug);
                const highlighted = packs.find((pack) => pack.popular || pack.highlight) || packs[0];
                return (
                  <article className="o-catalog-service" key={service.slug}>
                    <div className="o-catalog-service__head">
                      <div>
                        <span className="o-catalog-service__kicker">{service.route}</span>
                        <h3>{service.label}</h3>
                      </div>
                      <span className="o-catalog-service__price">{priceRange(packs)}</span>
                    </div>
                    <p>{service.summary}</p>
                    <div className="o-catalog-service__meta">
                      <span>{packs.length} packs</span>
                      <span>{serviceCapacity(packs)}</span>
                      <span>{highlighted ? `${highlighted.duration} · ${highlighted.price}` : 'pendent'}</span>
                    </div>
                    {highlighted && (
                      <div className="o-catalog-service__pick">
                        <span>Pack guia</span>
                        <strong>{titleFromSlug(highlighted.slug)}</strong>
                        <code>{highlighted.id}</code>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="o-spec-group">
              <h3 className="o-spec-group__title">Packs reals · fallback públic del configurador</h3>
              <div className="o-catalog-table-wrap">
                <table className="o-catalog-table">
                  <thead>
                    <tr>
                      <th scope="col">Pack</th>
                      <th scope="col">Servei</th>
                      <th scope="col">Preu</th>
                      <th scope="col">Durada</th>
                      <th scope="col">Capacitat</th>
                      <th scope="col">Senyal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PUBLIC_PACKS.map((pack) => (
                      <tr key={pack.id}>
                        <td><strong>{titleFromSlug(pack.slug)}</strong><code>{pack.id}</code></td>
                        <td>{pack.service}</td>
                        <td>{pack.price}</td>
                        <td>{pack.duration}</td>
                        <td>{pack.capacidadMinima || 0}-{pack.capacidadMaxima || '∞'} pax</td>
                        <td>{pack.popular ? 'popular' : pack.badge ? pack.badge : 'base'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="o-catalog-columns">
              <div className="o-spec-group">
                <h3 className="o-spec-group__title">Extres públics</h3>
                <div className="o-catalog-mini-list">
                  {PUBLIC_EXTRAS.map((extra) => (
                    <div className="o-catalog-mini" key={extra.id}>
                      <span className="o-catalog-mini__icon" aria-hidden="true">{extra.icon}</span>
                      <div>
                        <strong>{titleFromSlug(extra.id)}</strong>
                        <span>{extra.price !== null ? `${extra.price}€` : 'consultar'} · {extra.category || 'other'}</span>
                        <code>{extra.enabled === false ? 'ocult configurador' : 'visible configurador'}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="o-spec-group">
                <h3 className="o-spec-group__title">Inventari base que sustenta els packs</h3>
                <div className="o-catalog-inventory">
                  <div><span>Controladora</span><strong>{INVENTARIO.controladora.nombre}</strong></div>
                  <div><span>So</span><strong>{INVENTARIO.altavoces.nombre} · {INVENTARIO.altavoces.potenciaTotal}W</strong></div>
                  <div><span>Llum PRO</span><strong>{INVENTARIO.iluminacion.cabezasMoviles.nombre}</strong></div>
                  <div><span>Efectes</span><strong>{Object.values(INVENTARIO.extras).length} extres configurables</strong></div>
                </div>
              </div>
            </div>
          </section>

          <footer className="o-spec-footer">
            Òrbita Studio · sistema visual v0.6 · 20 seccions · 8 comunicacions · 5 documents
          </footer>
        </main>
      </div>

      <div className="o-hud">
        <strong>Studio v0.6</strong> · fitxa tècnica · <a href="/admin">admin actual</a>
      </div>
    </div>
  );
}
