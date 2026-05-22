# Studio · Operativa principal

> Document principal de treball per a la fitxa tècnica del sistema visual del **nou admin**.
> La resta de documents de Studio queden com a arxiu o inventari de suport. La superfície viu a
> `http://localhost:3000/studio`. Aquest fitxer recull **què s'ha fet**, **tot el
> contingut real del repo** (per a què serveix cadascun) i **el camí a seguir**.
>
> Estat: **v0.4 — base completa i renderitzant sense errors**. Pendent: omplir-la amb
> tot el contingut real del repo (ara hi ha catàlegs reals d'actius/favicons/logos,
> però packs, serveis, portfolio i emails encara són mostres hardcoded).

---

## 0. Com obrir-la i capturar-la

```bash
pnpm dev                 # arrenca Next a :3000
# → http://localhost:3000/studio   (públic, noindex, sense auth)
node .dbg-studio.cjs     # captures a .codex-captures/studio-*.png
```

- `.dbg-studio.cjs` (arrel) → script Playwright: captura `studio-full.png` + per secció.
- Ruta sense prefix de locale: `middleware.ts` té `pathname.startsWith('/studio')` al bypass d'i18n.
- Fitxers font: `app/studio/page.tsx` · `layout.tsx` (noindex) · `StudioShowroom.tsx` · `studio.css`.

---

## 1. Fet en aquesta passada ✅

- [x] **Fonts connectades.** `studio.css` referenciava `"Inter"` / `"JetBrains Mono"` pel
      nom literal → no existeixen (next/font les serveix amb nom ofuscat). Ara
      `--o-font`/`--o-font-mono`/`--o-font-display` usen `var(--font-inter)` i
      `var(--font-mono)` (declarades a `<html>` a `app/layout.tsx`, definides a `app/fonts.ts`).
      Verificat: Mono resol a `__JetBrains_Mono_968187`, body a `__Inter_8b3a0b`.
- [x] **Icones arreglades.** `.o-spec-icon*` no existien → els SVG sense `width/height`
      explotaven a pantalla completa. Afegit `.o-spec-icon__box svg { width:22px; height:22px }` + graella.
- [x] **~30 classes CSS que faltaven** afegides (el `studio.css` era v0.3 i el TSX v0.4):
      brand cards, do/don't (`o-spec-rules` + `o-spec-voice`), `o-spec-header__stats`,
      `o-spec-search-*`, `o-spec-section__num`, `o-spec-bp*` (responsive),
      `o-spec-email-mock*`, `o-spec-pdf-mock*`, `o-spec-toc__foot/back`, `o-pill--neutral`, `o-dot--neutral`.
- [x] **PDFs visibles.** `o-spec-pdf-mock*` no estava estilat → ara els 5 docs (Pressupost,
      Confirmació, Contracte, Factura, Resum post-event) mostren mock de document.
- [x] **Secció "5. Actius del repo" creada.** Estava al menú i a les dades (`ASSETS`) però
      **no es renderitzava**. Ara mostra **fitxers reals de `/public`**: logotips de marca,
      favicons SVG, raster PNG, ICO + Open Graph.
- [x] **Logotips reals de marca** (`/public/img/*.svg|webp`) afegits a Actius amb fons
      clar/fosc segons el color del logo (`orbitawordmark.svg` és negre → fons clar).
- [x] **Renumeració de seccions** coherent amb el menú: 16 seccions `00`→`15`, sense duplicats.
- [x] **Alerta "Ara atens"**: la base `.o-now` ara és **ambre (atenció)**; `.o-now--danger`
      és la variant **vermella (crític)**. Abans totes dues sortien vermelles.
- [x] `npx tsc --noEmit` → **0 errors**. Pàgina renderitza sense `PAGEERR`.

### Passada de disseny (v0.4.1)
- [x] **Emails en paper real.** Nous tokens `--o-paper*` (fons clar/tinta). El mock d'email
      (§14) ara és **paper blanc amb ombra** → es veu i comunica "això és el que rep el client".
- [x] **§15 PDFs → previsualització FIDEL del contingut real.** Descobert que el PDF real
      (`lib/pdf-utils.ts` · `generateQuotePDF` / `generateContractPDF`) **NO és paper blanc**:
      és **tema fosc + or** (`rgb(18,20,24)` fons, `rgb(212,175,55)` accent). Afegits tokens
      `--o-doc-*` amb els valors exactes i reconstruïda la secció amb un **switcher
      Pressupost / Contracte** que reprodueix totes les seccions reals (header+ref, client,
      detalls event, pack+preu, què inclou, extres, resum econòmic amb TOTAL, condicions,
      clàusules legals, signatures, peu amb dades reals de `SITE_CONFIG`).
      ⚠️ Les **dades són mostres** il·lustratives — el pas següent (§3) és alimentar-les des de
      `generateQuotePDF`/`packs-config`/quote service real.
- [x] **4 PDFs reals al switcher** (abans 2). Trobats els 4 generadors reals del repo i
      reproduïts fidelment: **Pressupost** + **Contracte** (tema fosc, `generateQuotePDF` /
      `generateContractPDF`) i **Catàleg de serveis** + **Informe executiu** (tema clar,
      `generateServiceBrochure` / `exportExecutiveReportPdf`). Tokens `--o-docl-*` per al tema
      clar. La **Factura** és via Holded (extern, sense generador intern) → només a l'índex.
      Catàleg `PDF_DOCS` actualitzat per reflectir la realitat (Confirmació/Resum són emails, no PDFs).
- [x] **Diari + protocol §9 + comptador**: registrat com a **Canvi #756** (`docs/diario.md`,
      `docs/protocol-producte-admin-ca.md`, `ADMIN_CHANGE_COUNTER` 755→756). ⚠️ Detectat que
      #754/#755 no s'havien afegit al protocol §9 (guard ja fallava abans d'aquest tall); en
      registrar #756 el guard torna a passar (només valida l'entrada actual + `max==counter`).
- [x] **Logos reals a §0 Marca.** Substituït el logo dibuixat a mà per `orbitalockupwhite.svg`
      (sobre fosc) i `orbitalockupdark.svg` (sobre or). El `ConstellationLogo` inline es manté
      només per a marques petites (TOC, peus de mock) i ara és tone-aware (`--o-logo-star`).
- [x] **Tokens d'ombra** `--o-shadow-sm/md/lg` + `--o-glow-accent`. Profunditat a swatches,
      cards, brand cards, PDFs.
- [x] **Capçalera premium**: glow daurat radial + stat chips amb números mono daurats.
- [x] **Jerarquia de secció**: número daurat (eyebrow) + divisòria per sobre de tota la secció
      (abans la línia partia número i títol). Títol de secció 22→26px.
- [x] **Microinteraccions** coherents: hover amb `translateY` + vora accent a swatches, actius,
      breakpoints i PDFs.

---

## 2. Tot el contingut real del repo (per a què serveix)

> Aquesta és la matèria primera per omplir la fitxa tècnica. "N'hi ha de sobra."

### 2.1 Logotips de marca — `public/img/`
| Fitxer | Per a què |
|---|---|
| `orbitalockupwhite.svg` / `orbitalockupwhitetransparent.webp` | Lockup principal (logo+text), fons foscos |
| `orbitalockupdark.svg` | Lockup per a fons clars |
| `orbitalockupmono.svg` | Lockup monocrom |
| `orbitawordmark.svg` | Només text (negre) |
| `orbita-glyph.svg` / `orbita-glyph-anim.svg` | Símbol sol (estàtic / animat) |
| `orbitaglyphgold.webp` / `orbitaglyphblack.svg` | Glyph daurat / negre |
| `logoplanetatextdreta.svg` / `logosoloplaneta.svg` / `.png` | Variants planeta |
| `placeholder-standard.svg` | Placeholder genèric d'imatge |

### 2.2 Favicons / icones PWA — `public/`
`favicon.svg`, `icon.svg`, `favicon-halloween.svg`, `favicon-mon-magic.svg` (variants temàtiques),
`favicon-{16,32,48,64,96,128,144,180,192,256,512}.png`, `apple-touch-icon.png`, `favicon.ico`,
`maskable-{192,512}.{png,webp}` (PWA maskable), `og-default.jpg` (Open Graph 1200×630).

### 2.3 Media — `public/`
- Hero: `img/hero-fallback.webp`, `img/hero-home-visual.webp`, `img/hero-poster.webp`, `img/hero-poster-mobile.webp`
- Vídeos: `video/Herovideo.mp4`, `videos/hero-orbita-mobile.mp4`
- Logos clients: `img/logos/cliente1..9.webp` (→ `TrustedByLogos`)
- Portfolio: `img/portfolio/` (**105 fitxers**)
- Reviews cache: `data/google-reviews.json`, `data/google-reviews-manual.json`
- PWA/legal: `manifest.json`, `manifest.webmanifest`, `sw.js`, `offline.html`, `oauth-{home,privacy,terms}.html`
- Mini-PWA `respira-rosa/`: `audio/`, `icons/`, `index.html`, `manifest.webmanifest`, `sw.js`

### 2.4 Catàlegs de producte — `app/config/`
`packs-config.ts` (packs i features), `site-config.ts` (WhatsApp, contacte, social),
`portfolio-images.ts`, `client-logos.ts`, `equipment-config.ts`.

### 2.5 Constants de domini — `lib/constants/` (17)
`index.ts` (~1800L: formats, locale, helpers), `services.ts` (ServiceSlug), `pricingRules.ts`,
`automationThresholds.ts`, `leadLoss.ts`, `notifications.ts`, `privacy.ts`, `customer-crm.ts`,
`hero-media.ts`, `portfolio-media.ts`, `public-service-media.ts`, `halloween-atmosphere.ts`,
`clientPortalNavigation.ts`, `googleCalendar.ts`, `social.ts`, `admin.ts`, `adminManual.ts`.

### 2.6 Serveis de negoci — `lib/services/` (**186** + `bookings/`)
Nuclis: `costEngine`, `fuelReferenceService`, `leadRouteService`, `bookingRouteService`,
`customerRouteService`. Email/comms: `adminEmailSendService`, `bookingCommunicationService`,
`adminQuoteEmailService`. (Vegeu `docs/estat-admin.md` per al detall consolidat.)

### 2.7 Pàgines públiques — `app/[locale]/` (24)
about, blog, boda-halloween, configurador, contacto, disponibilidad, experiencias, faq,
gallery, gracias, legal, opiniones, packs, portal, portfolio, privacitat, reserva-confirmada,
reservar, respira, sensorial, servicios, tematica-halloween, tematica-mon-magic, valoracio.

### 2.8 Pàgines admin — `app/admin/` (~57)
activity, analytics, blog, bookings, calendario, campaigns, canvas, catalog, clientes,
collaborators, cost-calculator, coverage, crons, css-manager, discount-codes, docs, economia,
email-templates, emails, faq, features, google-reviews, image-manager, inbox, intake,
inventory, leads, manual, marketing, mensajes, packs, portfolio, post-event, presupuestos,
pricing, privacy, questionnaires, quick-create, reporting, ressenyes, sales-ops, salut,
scripts, settings, social, stats, tasks, text-manager.

### 2.9 i18n — `messages/`
`ca.json`, `es.json`, `en.json` (~6800L cadascun). Públic via `t('clau')`; admin en català directe.

---

## 3. Camí a seguir (TODO per ChatGPT)

Objectiu del client: que la fitxa tècnica **mostri tot el contingut real del repo i per a
què serveix cadascun**, no mostres inventades. Prioritat de dalt a baix:

1. **§0 Marca → usar logos reals.** Ara `ConstellationLogo` és un SVG aproximat inline.
   Substituir/complementar amb `orbitalockupwhite.svg` + `orbita-glyph.svg` reals de `/public/img`.
2. **§5 Actius → completar.** Afegir grups: **Hero media** (posters + vídeos amb `<video>`),
   **Logos de clients** (`img/logos/cliente*.webp`), **mostra de Portfolio** (primers N de
   `img/portfolio/`), **maskable icons**, **placeholder**.
3. **§ Packs (nova).** Llegir `app/config/packs-config.ts` i renderitzar packs reals
   (nom, preu, features) en comptes de descripcions genèriques.
4. **§ Serveis (nova).** ServiceSlug (`fiestas|bodas|discomovil|empresas`) + imatges de
   `lib/constants/public-service-media.ts`.
5. **§14 Comunicacions → reals.** Ara `EMAIL_COMMS` és hardcoded al TSX. Contrastar amb les
   plantilles reals (`/admin/email-templates`, `lib/email.ts`, `adminEmailSendService.ts`) i,
   idealment, llegir-les de la font única. Verificar que els 8 slugs i triggers coincideixen.
6. **§15 PDFs → contrastar** amb els generadors reals (pressupost/contracte/factura Holded).
7. **Portfolio (nova, opcional).** Categories i esdeveniments des de `portfolio-images.ts`.

### Regles de la casa (CLAUDE.md) a respectar
- **Monocapa**: no duplicar catàlegs. Llegir de `app/config/*`, `lib/constants/*`, `messages/*`.
  Evitar arrays hardcoded al TSX quan la dada ja viu en una capa comuna.
- **Zero hex** a components: usar tokens `--o-*` de `studio.css` (la def. de variables sí pot tenir hex).
- `<img>` dispara `@next/next/no-img-element` (error amb `next/core-web-vitals`) → cal
  `{/* eslint-disable-next-line @next/next/no-img-element */}` (ja aplicat als actius) o `next/image`.
- Català sempre.

---

## 4. Validació abans de tancar / mergear

```bash
npx tsc --noEmit          # ✅ ja passa (0 errors)
pnpm run validate:core    # base
pnpm build                # app/** → build net (recomanat abans de commit)
node .dbg-studio.cjs      # captures de regressió visual
```

Grep de residus després de tocar CSS:
`#[0-9a-fA-F]{3,6}` fora de def. de variables · `style={{` evitable · `rgba(` que hauria de ser token.

---

## 5. Mapa ràpid de fitxers

| Fitxer | Rol |
|---|---|
| `app/studio/StudioShowroom.tsx` | Tot el contingut (client component). Dades a dalt: `PALETTE`, `TYPE_SCALE`, `ICONS`, `EMAIL_COMMS`, `PDF_DOCS`, `ASSETS`, `BRAND_LOGOS`, `SECTIONS` |
| `app/studio/studio.css` | Tokens `--o-*` + tots els estils, scoped a `.o-studio-root` |
| `app/studio/layout.tsx` | metadata + `robots: noindex` |
| `app/studio/page.tsx` | Entry |
| `middleware.ts` | Bypass i18n per a `/studio` |
| `.dbg-studio.cjs` | Script de captures Playwright |
