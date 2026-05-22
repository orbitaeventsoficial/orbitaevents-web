'use client';

/* ============================================================================
   ÒRBITA · STUDIO — Fitxa tècnica del sistema visual del NOU ADMIN (v0.4)
   ----------------------------------------------------------------------------
   Catàleg viu de tokens, components, comunicacions i documents. Tot el que el
   client veu i tot el que l'admin manipula passa per aquí.

   ⚠️ ZONA PROTEGIDA — vegeu CLAUDE.md (§Zones consolidades) i el guard
   `qa:studio-integrity` (scripts/check-studio-integrity.mjs) dins validate:core.
   No buidar ni reduir aquesta fitxa: el guard exigeix les 16 seccions i un
   mínim de superfície. Tota passa (prova o definitiva) ha de quedar a git i
   documentada al diari amb número de canvi.

   Estils: tots a ./studio.css, scoped a .o-studio-root. Zero hex de color al
   JSX (els chips usen var(--token)); el hex que es veu és contingut textual.
============================================================================ */

import { useState, type ReactNode } from 'react';
import './studio.css';

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
  { name: 'Mono', spec: 'JetBrains Mono · 12', sample: '14 jun · 120 pax · 22:00', use: 'Dades, codis, IDs', style: { fontSize: 12, fontFamily: 'var(--o-font-mono)' } },
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

/* ── 15 · Documents PDF — índex ───────────────────────────────────────────── */
const PDF_DOCS = [
  { name: 'Pressupost', gen: 'generateQuotePDF · tema fosc' },
  { name: 'Contracte', gen: 'generateContractPDF · tema fosc' },
  { name: 'Catàleg de serveis', gen: 'generateServiceBrochure · tema clar' },
  { name: 'Informe executiu', gen: 'exportExecutiveReportPdf · tema clar' },
  { name: 'Factura', gen: 'generada via Holded (integració externa)' },
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
];

type PdfId = 'pressupost' | 'contracte' | 'cataleg' | 'informe';

function SectionHead({ num, title, intro }: { num: string; title: string; intro: string }) {
  return (
    <>
      <div className="o-spec-section__num">{num}</div>
      <h2 className="o-spec-section__title">{title}</h2>
      <p className="o-spec-section__intro">{intro}</p>
    </>
  );
}

export default function StudioShowroom() {
  const [openComm, setOpenComm] = useState<string | null>('welcome');
  const [pdf, setPdf] = useState<PdfId>('pressupost');

  return (
    <div className="o-studio-root">
      <div className="o-spec-shell">
        {/* ── TOC ── */}
        <aside className="o-spec-toc">
          <div className="o-brand">
            <span className="o-brand__text">
              <span className="o-brand__name">Òrbita</span>
              <span className="o-brand__sub">Sistema · v0.4</span>
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
              <div><strong>16</strong> seccions</div>
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
            <SectionHead num="02" title="Tipografia" intro="Inter (UI) · JetBrains Mono (dades) · 7 nivells · numerals tabulars" />
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
            <SectionHead num="15" title="Documents PDF" intro="Previsualització fidel del contingut real · reprodueix lib/pdf-utils.ts (tema fosc + or / clar, A4)" />
            <div className="o-pdf-switch">
              <button type="button" aria-pressed={pdf === 'pressupost'} onClick={() => setPdf('pressupost')}>Pressupost</button>
              <button type="button" aria-pressed={pdf === 'contracte'} onClick={() => setPdf('contracte')}>Contracte</button>
              <button type="button" aria-pressed={pdf === 'cataleg'} onClick={() => setPdf('cataleg')}>Catàleg de serveis</button>
              <button type="button" aria-pressed={pdf === 'informe'} onClick={() => setPdf('informe')}>Informe executiu</button>
            </div>

            <div className="o-pdfdoc-wrap">
              {pdf === 'pressupost' && (
                <div className="o-pdfdoc">
                  <div className="o-pdfdoc__header">
                    <div className="o-pdfdoc__brand">
                      <span className="o-pdfdoc__brandname">Òrbita Events</span>
                      <span className="o-pdfdoc__title">Pressupost</span>
                    </div>
                    <div className="o-pdfdoc__meta">
                      Referència <b>OE-LX9K2A</b><br />Data <b>22/05/2026</b><br />Validesa <b>15 dies</b>
                    </div>
                  </div>
                  <div className="o-pdfdoc__card">
                    <div className="o-pdfdoc__grid2">
                      <div className="o-pdfdoc__field"><span className="o-pdfdoc__label">Client</span><span className="o-pdfdoc__value">Marta Soler i Jordi Vila</span><span className="o-pdfdoc__muted">marta.soler@email.com · 612 345 678</span></div>
                      <div className="o-pdfdoc__field"><span className="o-pdfdoc__label">Event</span><span className="o-pdfdoc__value">Casament · 120 convidats</span><span className="o-pdfdoc__muted">14 juny 2026 · 18:00–02:00 · Mas de Sant Lleí, Vallromanes</span></div>
                    </div>
                  </div>
                  <div className="o-pdfdoc__card o-pdfdoc__card--soft">
                    <div className="o-pdfdoc__packrow">
                      <div><span className="o-pdfdoc__eyebrow">Pack seleccionat</span><div className="o-pdfdoc__value">Pack Premium Boda · 8 hores</div></div>
                      <span className="o-pdfdoc__packprice">1.890,00€</span>
                    </div>
                    <div className="o-pdfdoc__list">
                      {['DJ professional tota la nit', 'Equip de so line-array', 'Il·luminació intel·ligent + focus mòbils', 'Photocall amb attrezzo', 'Màquina de fum de terra', 'Tècnic present tot l\'event'].map((x) => (
                        <div className="o-pdfdoc__li" key={x}>{x}</div>
                      ))}
                    </div>
                  </div>
                  <div className="o-pdfdoc__card">
                    <span className="o-pdfdoc__eyebrow">Resum econòmic</span>
                    <div className="o-pdfdoc__sumrow"><span>Pack base</span><span>1.890,00€</span></div>
                    <div className="o-pdfdoc__sumrow"><span>Extres (photobooth + saxo)</span><span>630,00€</span></div>
                    <div className="o-pdfdoc__sumrow"><span>Desplaçament</span><span>90,00€</span></div>
                    <div className="o-pdfdoc__sumrow"><span>Descompte (reserva anticipada)</span><span>-120,00€</span></div>
                    <div className="o-pdfdoc__divider" />
                    <div className="o-pdfdoc__total"><span className="o-pdfdoc__total-label">Total</span><span className="o-pdfdoc__total-value">2.490,00€</span></div>
                  </div>
                  <div className="o-pdfdoc__footer">Preus sense IVA · Validesa 15 dies · orbitaevents.com · info@orbitaevents.com · +34 699 12 10 23</div>
                </div>
              )}

              {pdf === 'contracte' && (
                <div className="o-pdfdoc">
                  <div className="o-pdfdoc__header">
                    <div className="o-pdfdoc__brand">
                      <span className="o-pdfdoc__brandname">Òrbita Events</span>
                      <span className="o-pdfdoc__title">Contracte de prestació de serveis</span>
                    </div>
                    <div className="o-pdfdoc__meta">Referència <b>OE-C-2026-014</b><br />Data <b>22/05/2026</b></div>
                  </div>
                  <div className="o-pdfdoc__card">
                    <div className="o-pdfdoc__grid2">
                      <div className="o-pdfdoc__field"><span className="o-pdfdoc__label">Prestador</span><span className="o-pdfdoc__value">Òrbita Events</span><span className="o-pdfdoc__muted">NIF B-00000000 · info@orbitaevents.com</span></div>
                      <div className="o-pdfdoc__field"><span className="o-pdfdoc__label">Client</span><span className="o-pdfdoc__value">Marta Soler i Jordi Vila</span><span className="o-pdfdoc__muted">NIF 00000000X · 612 345 678</span></div>
                    </div>
                  </div>
                  <div className="o-pdfdoc__card o-pdfdoc__card--soft">
                    <span className="o-pdfdoc__eyebrow">Detalls del servei</span>
                    <div className="o-pdfdoc__muted">Casament · 14 juny 2026 · 18:00–02:00 · Mas de Sant Lleí · 120 convidats · Pack Premium Boda (8h)</div>
                  </div>
                  <div className="o-pdfdoc__card">
                    <span className="o-pdfdoc__eyebrow">Resum econòmic</span>
                    <div className="o-pdfdoc__sumrow"><span>Subtotal</span><span>2.490,00€</span></div>
                    <div className="o-pdfdoc__sumrow"><span>IVA (21%)</span><span>522,90€</span></div>
                    <div className="o-pdfdoc__divider" />
                    <div className="o-pdfdoc__total"><span className="o-pdfdoc__total-label">Total</span><span className="o-pdfdoc__total-value">3.012,90€</span></div>
                    <div className="o-pdfdoc__sumrow o-pdfdoc__sumrow--reason">Aval (dipòsit) 903,87€ · Resta 2.109,03€ · IBAN ES00 0000 0000 0000 0000 0000</div>
                  </div>
                  <div className="o-pdfdoc__footer">Controvèrsies: jutjats de Granollers · Dades segons RGPD (UE) 2016/679 i LOPDGDD 3/2018 · Signat digitalment</div>
                </div>
              )}

              {pdf === 'cataleg' && (
                <div className="o-pdfdoc o-pdfdoc--light">
                  <div className="o-pdfdoc__band">
                    <div><span className="o-pdfdoc__band-title">Catàleg de serveis</span><div className="o-pdfdoc__band-sub">Casaments</div></div>
                  </div>
                  <div className="o-pdfdoc__card">
                    <span className="o-pdfdoc__sec-title">Els nostres packs</span>
                    <div className="o-broc-pack">
                      <div className="o-broc-pack__top"><span className="o-broc-pack__name">Pack Essencial</span><span className="o-broc-pack__price">990€</span></div>
                      <span className="o-broc-pack__dur">5 hores</span>
                      <div className="o-broc-pack__feats">{['DJ professional', 'Equip de so i micròfon', 'Il·luminació de pista'].map((f) => <span className="o-broc-pack__feat" key={f}>{f}</span>)}</div>
                      <span className="o-broc-pack__ideal">Ideal per: celebracions íntimes</span>
                    </div>
                    <div className="o-broc-pack">
                      <div className="o-broc-pack__top"><span className="o-broc-pack__name">Pack Premium Boda <span className="o-broc-badge">Més popular</span></span><span className="o-broc-pack__price">1.890€</span></div>
                      <span className="o-broc-pack__dur">8 hores</span>
                      <div className="o-broc-pack__feats">{['DJ + tècnic tota la nit', 'So line-array + il·luminació intel·ligent', 'Photocall amb attrezzo'].map((f) => <span className="o-broc-pack__feat" key={f}>{f}</span>)}</div>
                      <span className="o-broc-pack__ideal">Ideal per: casaments de 80 a 150 convidats</span>
                    </div>
                    <div className="o-broc-pack">
                      <div className="o-broc-pack__top"><span className="o-broc-pack__name">Pack Estrella <span className="o-broc-badge o-broc-badge--premium">Premium</span></span><span className="o-broc-pack__price">2.690€</span></div>
                      <span className="o-broc-pack__dur">10 hores</span>
                      <div className="o-broc-pack__feats">{['Tot el Premium + cabina DJ premium', 'Espectacle de llum i efectes', 'Coordinació musical personalitzada'].map((f) => <span className="o-broc-pack__feat" key={f}>{f}</span>)}</div>
                      <span className="o-broc-pack__ideal">Ideal per: grans esdeveniments</span>
                    </div>
                  </div>
                  <div className="o-broc-contact"><b>Tens dubtes? Escriu-nos sense compromís!</b><span>Barcelona · Girona · Catalunya · info@orbitaevents.com · +34 699 12 10 23</span></div>
                </div>
              )}

              {pdf === 'informe' && (
                <div className="o-pdfdoc o-pdfdoc--light">
                  <div className="o-pdfdoc__band">
                    <div><span className="o-pdfdoc__band-title">Informe executiu</span><div className="o-pdfdoc__band-sub">Generat el 22 de maig de 2026</div></div>
                  </div>
                  <div className="o-pdfdoc__card">
                    <span className="o-pdfdoc__sec-title">Indicadors principals</span>
                    <div className="o-rep-kpis">
                      <div className="o-rep-kpi"><div className="o-rep-kpi__label">Clients</div><div className="o-rep-kpi__value">248</div></div>
                      <div className="o-rep-kpi"><div className="o-rep-kpi__label">Leads oberts</div><div className="o-rep-kpi__value">32</div></div>
                      <div className="o-rep-kpi o-rep-kpi--accent"><div className="o-rep-kpi__label">Reserves</div><div className="o-rep-kpi__value">41</div></div>
                      <div className="o-rep-kpi o-rep-kpi--accent"><div className="o-rep-kpi__label">Ingressos €</div><div className="o-rep-kpi__value">86.400</div></div>
                    </div>
                  </div>
                  <div className="o-pdfdoc__card">
                    <span className="o-pdfdoc__sec-title">Conversió per origen</span>
                    <table className="o-rep-table">
                      <thead><tr><th scope="col">Origen</th><th scope="col">Leads</th><th scope="col">Guanyats</th><th scope="col">Conversió</th></tr></thead>
                      <tbody>
                        <tr><td>Web</td><td>64</td><td>21</td><td>32,8%</td></tr>
                        <tr><td>Instagram</td><td>48</td><td>14</td><td>29,2%</td></tr>
                        <tr><td>Referits</td><td>22</td><td>11</td><td>50,0%</td></tr>
                        <tr><td>Google</td><td>31</td><td>9</td><td>29,0%</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="o-pdfdoc__footer o-pdfdoc__footer--light">Marge brut 44.700,00€ · Taxa marge 51,7% · Òrbita Events · Informe intern</div>
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

          <footer className="o-spec-footer">
            Òrbita Studio · sistema visual v0.4 · 16 seccions · 8 comunicacions · 5 documents
          </footer>
        </main>
      </div>

      <div className="o-hud">
        <strong>Studio v0.4</strong> · fitxa tècnica · <a href="/admin">admin actual</a>
      </div>
    </div>
  );
}
