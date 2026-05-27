# Òrbita Events — Protocol de Treball

## Propòsit

Aquest fitxer és la constitució del repo. Conté normes estables de treball, patrons de codi i la llista de zones protegides.

Per estat funcional i peces consolidades:
- `docs/estat-admin.md` → dossier viu de l'admin
- `docs/diario.md` → registre cronològic del que s'ha fet i amb quina validació

## Stack

- **Framework**: Next.js 14 (App Router), TypeScript strict
- **BD**: Prisma + PostgreSQL (Railway, connexió directa sense pooler)
- **i18n**: next-intl (ca/es/en)
- **Tests**: Vitest (unit) + Playwright (E2E)
- **Storage**: Filesystem local `./uploads/`, servit via `/api/uploads/[...path]`
- **CI**: GitHub Actions — lint+tsc, tests+coverage, build
- **Admin**: 100% en català, PWA instal·lable, tema fosc

## Principis base

- **Idioma**: sempre en català, excepte si l'usuari demana explícitament un altre idioma.
- **Construir abans que auditar**: si la guia o el dossier ja expliquen l'estat, no repetir una auditoria des de zero.
- **Un canvi és un canvi**: no aprofitar una tasca per repintar o refactoritzar zones que l'usuari no ha demanat.
- **Monocapa**: cada decisió estable de producte, copy, estats, labels, ordre, llindars o configuració ha de viure a un sol lloc.
- **Verificació real**: no donar res per acabat només perquè compila.
- **Conservar el que ja funciona**: si una zona està tancada o consolidada, no reobrir-la sense motiu real.

## Protocol d'autonomia

- Treballar en mode completament autònom: no demanar confirmació, no demanar "segueix?", no esperar input.
- Acabar un canvi complet (servei + pàgina + missatges + tests + diario + counter), validar, i passar automàticament al proper ítem del backlog.
- Continuar fins que tots els ítems pendents del backlog (§6 del protocol de producte) estiguin tancats.
- Després d'un tall verd, no enviar resposta final si encara queda un `SEGÜENT`, `PENDENT CRÍTIC` o backlog accionable. La resposta final només toca quan no queda feina executable, hi ha bloqueig real o l'usuari demana explícitament parar/reportar.
- Amb `go` actiu, la resposta final queda prohibida després d'un tall verd mentre hi hagi backlog accionable. El pas immediat després de `validate:core` verd és rellegir §6, triar el següent `SEGÜENT` / `PENDENT CRÍTIC` executable i continuar automàticament amb una actualització curta, no tancar la conversa.
- Aquesta regla també viu en format executable a `docs/agent-runtime-policy.json`: `repository=orbitaevents`, `defaultWorkspacePath=D:\orbitaevents`, `mode=nonstop_until_end`. El guard `pnpm run qa:nonstop-protocol` ha de fallar si el JSON, aquest fitxer o el protocol deixen d'estar alineats.
- No interrompre el treball per preguntes que es poden resoldre llegint el protocol, el diari o el codi.
- Reportar l'estat final quan no quedi cap ítem pendent, no en cada canvi.

## Flux obligatori abans de tocar res

1. Llegir `CLAUDE.md`.
2. Llegir `docs/agent-sync.md` — llegir el bloc de l'altre agent i actualitzar el propi amb estat `treballant` i el proper canvi previst.
3. Llegir `docs/diario.md`.
4. Si la tasca és d'admin o toca una zona ja consolidada, llegir `docs/estat-admin.md`.
5. Si la tasca és d'admin o toca una zona consolidada, llegir també `docs/protocol-producte-admin-ca.md`, el tram rellevant del `§6` i el final del `§9` abans de començar.
6. Si existeix una guia específica de la iniciativa, usar-la només com a context del tall concret.

Cap agent pot començar feina real al repo sense haver fet aquesta lectura mínima.

## Regles operatives

- No fer canvis no demanats.
- No duplicar regles, catàlegs o mappings locals si ja existeixen a la capa comuna.
- No hardcodejar dades estables al JSX o dins serveis si poden anar a constants, traduccions o CSS compartit.
- No tocar lògica de negoci, SEO, infra o components consolidats sense una raó explícita.
- No prometre verificacions que no s'han executat.
- Si una passada queda incompleta, s'ha d'explicar netament al `docs/diario.md`.
- Si una passada no està realment tancada, no es pot presentar com a "gran", "quasi acabada" o "només queda el detall final". Cal dir explícitament si està `tancada` o `pendent`.
- Queda prohibit reservar feina crítica o estructural per a una suposada passada "fina" posterior si això no s'ha advertit abans. No s'admet el patró de l'"últim 10-15%" descobert després.
- Si s'elimina una feature, grep TOT el repo: component → hook → servei → API route → test → constants → i18n keys.

## Decision Tree — On va cada cosa?

### 1. És text visible a la web pública?
- Sí → `messages/ca.json`, `messages/es.json`, `messages/en.json`
- No → continuar

### 2. És una decisió estable de domini o de producte?
Exemples: estats, labels, nav meta, ordres, llindars, presets, FAQs, cards, packs, categories, MIME types, límits.
- Sí → `lib/constants/*` o helper compartit pur
- No → continuar

### 3. És estil reutilitzable o token visual?
Exemples: colors, superfícies, gradients, animacions compartides, layout chrome, classes reutilitzables.
- Sí → `app/globals.css`, `app/admin/admin-theme.css`, `app/admin/control-room.css`
- No → continuar

### 4. És wiring o presentació exclusivament local del component?
Exemples: estat React, refs, handlers, càlcul temporal de UI, composició local.
- Sí → dins del component
- No → si és reusable, extreure a helper o constant compartida

### 5. És un valor visual puntual i funcional que depèn del runtime?
Exemples: coordenades calculades, amplades dinàmiques, transform puntual.
- Sí → inline és acceptable
- No → ha d'anar a la capa comuna adequada

## Hardcode i monocapa

- Zero hex hardcoded a components i pàgines, tret dels casos tècnics acceptats: definició de variables globals, canvas, APIs d'imatge, emails HTML.
- Dates, moneda, locale i formats passen per helpers centralitzats (`formatDate`, `formatCurrency`, `formatDateTime`, `toIntlLocale` de `lib/constants/index.ts`).
- Si una dada apareix en més d'un lloc, queda prohibit resoldre-la localment.
- A l'admin, cal minimitzar el hardcoded: el text o valor local i unic es acceptable, pero qualsevol copy, ajuda contextual, label, mapping o valor reutilitzat s'ha de centralitzar en una capa compartida.
- Si tens dubte entre local i compartit, per defecte va a la capa comuna.
- Anti-patrons prohibits: `Object.keys(...)` locals per opcions compartides, maps locals de labels, `Set(...)` locals per regles de domini, arrays derivats locals per categories/status.

## Sistema visual admin — norma canònica `/admin/studio`

Vegeu `protocol-producte-admin-ca.md` §2.5 (Migració del Frankenstein admin). Resum operatiu:

- **`/admin/studio` + `app/studio/orbita-tokens.css` són la font de veritat visual de l'admin** (Canvis #795 + #797 + #798).
- `app/admin/**` **NO inventa paletes, hex, gradients ni estats locals**. Només consumeix tokens (`--ax-*`, `--canvas`, `--gold`, `--t*`, `--o-stage-*`) i classes ja exposades pel sistema.
- Si falta un color, estat o component, **primer s'amplia `/admin/studio` i/o `orbita-tokens.css`**, després es consumeix des de l'admin. Mai a l'inrevés.
- CSS local d'una pàgina admin queda restringit a **layout específic** (grid, gaps, posició, ordre de columnes). Decisions cromàtiques o tipogràfiques no viuen a fitxers `app/admin/**.css`.
- `docs/admin-inventari-pagines.md` és el **mapa de la migració** peça a peça: 🔴 old · 🟡 en curs · 🟢 migrada. Cada estat 🟡/🟢 ha de citar el `Canvi #NNN` a la nota.

## Dependències

Norma per defecte: **zero-dependency si és raonable**.

Només es pot afegir un package nou si:
- resol un problema real que no es cobreix bé amb l'stack actual
- evita codi propi complex o fràgil de mantenir
- no duplica una llibreria o capacitat que el repo ja té
- el cost de pes, manteniment i superfície de risc és justificable

Abans d'afegir una dependència:
1. comprovar si Next.js, React, Prisma, utilitats del repo o CSS actual ja ho resolen
2. preferir helpers propis petits si la necessitat és acotada
3. preferir dependències petites, madures i específiques
4. evitar paquets només per comoditat o cosmètica

## Validació mínima obligatòria

Base per defecte després d'una passada normal:
- `pnpm run validate:core`

S'hi suma el que pertoqui segons el canvi:

| Modifiques | Executa |
|---|---|
| `lib/services/*.ts` | `pnpm run validate:core` + `pnpm test:run` |
| `lib/services/SERVEI.ts` concret | `pnpm test:run -- --run __tests__/lib/services/SERVEI.test.ts` |
| `app/admin/**` (pàgines/components) | `pnpm run validate:core` + `pnpm build` |
| `app/api/**` (rutes API) | `pnpm run validate:core` + `pnpm test:run` |
| `prisma/schema.prisma` | `npx prisma generate` + `pnpm run validate:core` + `pnpm test:run` + `pnpm build` |
| `messages/*.json` (i18n) | `pnpm run validate:core` + `pnpm build` |
| `e2e/*.spec.ts` | `npx playwright test e2e/FITXER.spec.ts --project=chromium` |
| Qualsevol canvi gran | `pnpm run validate:core && pnpm test:run && pnpm build` |

Després de cada ronda de canvis, grep actiu de residus:
- `#[0-9a-fA-F]{3,6}` — hex literals que haurien de ser Tailwind
- `style={{` — inline styles que haurien de ser classes CSS
- `rgba(` — colors inline que haurien de ser tokens

## Testing

- Codi nou de negoci o utilitat nova ha de sortir amb el seu test.
- No es lliura una passada amb tests trencats sense explicar-ho.
- Si falla un test, s'arregla el codi o s'actualitza el test si estava obsolet.

### Patró estàndard per al mock de Prisma

```typescript
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: { model: { method: vi.fn() } },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
```

### Altres mocks establerts

- **server-only**: Alias a `vitest.config.ts` → `vitest.server-only-stub.ts`
- **fetch**: `globalThis.fetch = vi.fn()` amb cleanup a `afterAll`
- **File**: Spy `FormData.get()` amb objecte mock (jsdom no suporta `file.arrayBuffer()`)
- **E2E admin**: Auth amb `extraHTTPHeaders` Basic, `setupErrorFilter` per ignorar hidratació, `addLocatorHandler` per tancar dev overlay

### Quan es crea un element nou

| Crees | Test a |
|---|---|
| `lib/services/nouServei.ts` | `__tests__/lib/services/nouServei.test.ts` |
| `app/api/admin/ruta/route.ts` | Testar via el servei que invoquen |
| `lib/utils/nova.ts` | `__tests__/lib/nova.test.ts` |

Cobertura mínima: cas èxit, validació inputs, casos límit, errors esperats.

## Checklist pre-lliurament

```
pnpm run arch:layer:check   → sense catàlegs locals sospitosos
npx tsc --noEmit             → 0 errors
pnpm run validate:core       → passada base feta
pnpm test:run                → tots passen
pnpm build                   → build net
0 valors hardcoded           → dates, moneda, anys, textos, colors
Tests nous per codi nou      → servei/util/API → test
Responsive verificat         → mòbil 375px, tablet, desktop
Empty states                 → llistes buides mostren missatge
Errors amb feedback          → catch + console.error/toast.error
Accessibilitat               → labels, aria, focus, contrast
i18n complet                 → 3 JSONs si és públic
Seguretat                    → auth, sanitize, env vars
Visual consistent            → design system, no hex custom
loading.tsx                  → skeleton si pàgina nova
Formularis validats          → client + servidor
```

## Patrons de codi clau

### Serveis i lògica de negoci

- **Cost/marge**: Tot passa per `computeBookingFinancialSummary()` a `lib/services/costEngine.ts`. MAI calcular marges inline.
- **Cost vehicle**: `getEffectiveVehicleCostPerKm()` a `fuelReferenceService.ts`. Fórmula: `(fuelPrice × consumL100 / 100) + maintenanceCostPerKm`
- **Locale mapping**: `toIntlLocale(locale)` de `lib/constants` per convertir `ca`→`ca-ES`, `es`→`es-ES`, `en`→`en-GB`.
- **ServiceSlug**: `'fiestas' | 'bodas' | 'discomovil' | 'empresas'` — sense produccion ni alquiler.
- **Semàfor pagament**: `depositPaid && remainingPaid` = verd, `depositPaid` = groc, cap = vermell.
- **Client hub**: `fetchCustomerHub()` és la font única per a tota la fitxa client.

### Emails

- **preferredLocale**: Existeix a Customer, Lead i Booking. SEMPRE usar-lo per emails al client.
- **Cadena locale**: `lead.preferredLocale || booking.preferredLocale || customer.preferredLocale || 'es'`
- **Signatura**: `getEmailSignatureHtml()` i `getEmailSignatureText()` de `lib/email.ts`

### UX i components

- **Diàlegs**: Mai `alert()` ni `window.confirm()`. Usar `useConfirmDialog()` hook.
  ```tsx
  const { confirm, dialogProps } = useConfirmDialog();
  const ok = await confirm({ title, message, variant: 'danger', confirmLabel: 'Eliminar' });
  // + <ConfirmDialog {...dialogProps} /> al JSX
  ```
- **Kanban**: Drag & drop HTML5 + optimistic updates + toast + botons mòbil.
- **View toggle**: searchParam `view=kanban|list` per canviar vista.
- **WhatsApp**: `getWhatsAppUrl(messageType, customData)` de `config/site-config.ts`

### Delete (patró estàndard)

- **Leads**: Requereix estat LOST abans d'eliminar. Backend valida a `leadRouteService.ts`.
- **Bookings**: Només PENDING o CANCELLED. Backend valida a `bookingRouteService.ts`.
- **Clients**: Smart GDPR — si té reserves/pressupostos → anonimitza. Si no → elimina.

## CSS architecture admin

### Regla canònica de sistema visual (2026-05-26)

- `/admin/studio` és la fitxa tècnica interna i sota auth del sistema visual. La ruta antiga `/studio` només redirigeix a `/admin/studio`.
- `app/studio/orbita-tokens.css` és la font de veritat de paleta, tokens, tipografia base i estats visuals del nou admin (`--o-*`, `--o-admin-*`, aliases `--ax-*`, `--canvas`, `--gold`, `--t`, `--o-stage-*`).
- Cap pàgina o component dins `app/admin/**` pot inventar paleta, hex, gradients o estats locals. Si falta un color, component o variant, primer s'amplia `/admin/studio`/`orbita-tokens.css`; després l'admin el consumeix.
- CSS local de pàgina admin només pot definir layout i composició pròpia (grid, gaps, amplades, responsive, posició). Les decisions cromàtiques, de tipografia, ombres i estats viuen a Studio.
- Els error states de l'admin també han de consumir `.ax-*` i tokens de Studio; no s'usen Tailwind utilitari ni tipografies ad hoc per a pantalles d'error.

### Fitxers CSS admin (carregats a `admin/layout.tsx`)

- `../studio/orbita-tokens.css` — font canònica de tokens visuals compartits entre Studio i admin
- `admin-shell.css` — shell admin, navegació, error boundary i aliases `.ax-*` consumint tokens de Studio
- `admin-theme.css` — compatibilitat legacy (`--at-*`), glass i semantic tones mentre dura la migració
- `control-room.css` — dashboard específic amb tokens `--at-cr-*`

### Regles de cascada

- La classe `admin-mode` s'afegeix a `document.documentElement` via useEffect. Tots els CSS admin requereixen `html.admin-mode` com a prefix.
- admin-theme.css NO pot competir amb globals.css a mateixa especificitat — Next.js no garanteix ordre de chunks.
- Si una propietat visual es defineix a globals.css, canviar-la allà directament, no intentar override des d'admin-theme.css.

### Paleta admin (tokens)

- La paleta nova surt de `app/studio/orbita-tokens.css`: `--o-admin-canvas`, `--o-admin-panel`, `--o-admin-raised`, `--o-admin-gold`, `--o-stage-*`.
- Colors: tokens de Studio o sistema `white/opacity` sobre fons fosc. MAI `slate-*`, `gray-*`, ni hex custom als components.
- Glass cards: `.admin-card-glass`. Focus: `focus:ring-1 focus:ring-cyan-500/50`. Table hover: `hover:bg-white/[0.03]`.
- Gradients: MAI Tailwind gradient classes directes. Usar `.admin-gradient--*`.
- Stagger: `.admin-stagger-item` amb `prefers-reduced-motion` respectat.

## Accessibilitat (obligatòria en tot codi nou)

- `htmlFor` + `id` a cada parella label/input
- `aria-label` a selects sense label visible, botons amb només icona, taules
- `scope="col"` a tots els `<th>`
- `min={0}` a inputs numèrics de preus/quantitats
- `rel="noopener noreferrer"` amb `target="_blank"`
- `role="switch"` + `aria-checked` als toggles
- Focus ring visible: `focus:ring-1 focus:ring-cyan-500/50`
- Contrast suficient: text `white/70` mínim sobre fons fosc
- Tot `catch` ha de tenir `console.error()` mínim, `toast.error()` si és acció d'usuari

## Seguretat

- Tota ruta `/api/admin/*` ha de verificar autenticació amb `requireAuth`. No hi ha excepcions.
- Inputs d'usuari: mai inserir directament al HTML sense sanititzar.
- Uploads: validar tipus MIME i extensió, limitar mida.
- Variables d'entorn: mai hardcodejar secrets. Tot a `.env`.
- Headers de seguretat: ja configurats (CSP, HSTS, X-Frame). No relaxar-los.

## i18n

- **Públic (web)**: Tot traducció via `t('clau')`. Clau nova → afegir als 3 JSON.
- **Admin**: Interfície en català directe (no cal traduir).
- **Emails**: Sempre usar `preferredLocale` del Lead/Booking/Customer.
- **Formats**: Dates i moneda sempre via funcions centralitzades amb `locale` param.
- **ServiceSlug**: Mantenir type. No inventar nous slugs.

## Informes d'Altres Agents

- Els informes d'altres agents o eines serveixen per **prioritzar**, no per donar un problema per confirmat automàticament.
- Qualsevol troballa crítica de seguretat, auth, dades o rendiment s'ha de **revalidar localment** abans de fer canvis o donar-la per bona.
- Si un informe extern contradiu el dossier o l'estat conegut del repo, preval la verificació directa sobre el codi.
- No es comença una refeta grossa només perquè un informe la suggereix; primer es comprova impacte, risc i cost.

### Ordre de prioritat davant un informe gran

1. Seguretat i auth
2. Integritat de dades, Prisma i queries crítiques
3. Errors funcionals reals visibles a usuari
4. Rendiment amb impacte clar
5. Refactors estructurals
6. Polish, duplicacions menors i neteja

### Aplicació pràctica

- Rutes admin sense auth → P0, verificar primer.
- N+1, límits arbitraris, falta paginació → P1 si afecta serveis centrals.
- Components massa grans, duplicació, memoització → no justifiquen refeta immediata sense dolor real demostrat.

## Què JA EXISTEIX — NO tornar a crear, auditar NI MODIFICAR

Abans de proposar crear, auditar o modificar qualsevol d'això, consulta primer. Ja està fet, aprovat i tancat:

### UX / Copy / Conversió (tancat 2026-03-25)
- Hero CTAs, subtitle, meta SEO homepage, process section, portfolio stories/CTA, features serveis preus, social proof hero

### Visual / CSS (tancat sessions 11-12 + packs v2 2026-03-26)
- Paleta admin contrast 30+, sidebar glass, !important cleanup, control-room.css
- Film grain, vignette, grid pattern a 35+ seccions
- Calendari 72-88px, partícules hero 36, heroes amb imatge serveis
- Footer trust signals, admin timeout 15s, hex cleanup
- Pack cards visual v2 (hover glow, badge popular shadow, preu ambre, separador, checks circulars)

### Components públics (consolidats)
- HeroElegant, MobileHeroUltimate, MobileHomePage, ProcessSection, MobileProcessSection
- StatsSection, PortfolioShowcase, GarantiaSection, CTAFinal, FAQSection
- GoogleReviewsRotating, TrustedByLogos, CalendarioUrgencia, ServicesGridElegant
- FloatingCTAs, ExitIntentModal, GalleryPro/SimpleGallery

### Pàgines públiques (consolidades)
- Homepage (11 seccions ordre fix), Packs (3 tabs), Portfolio (index/categoria/event)
- Serveis (heroes foto, FAQ, breadcrumbs), Contacte, Blog, Opinions, About, Legal, Zones, Configurador

### Admin — sistemes consolidats
- Layout (Fragment + admin-layout-shell, admin-mode, 3 CSS files)
- Sidebar glass, Kanban D&D (Tasks/Leads/Bookings), BookingSectionNav
- ConfirmDialog hook, Error handling timeout 15s, Lead pipeline + auto-LOST/DELETE
- Google Reviews cache, Weather widget, Calendari Mes/Setmana/Dia
- Inbox/Compose, Client portal, Booking inventory, Clientes modals GDPR
- Settings/Canvas/Checklist amb error handling explícit

### SEO (complet)
- sitemap.ts dinàmic, robots.ts, JSON-LD LocalBusiness, Open Graph + Twitter Cards
- Canonical URLs + hreflang, Breadcrumbs schema.org, FAQ schema.org

### Performance (complet)
- 53 loading.tsx, 8 dynamic() imports, next/image a 25 components
- Cache headers 1 any, security headers, webp+avif, SWC minify

### Testing (complet)
- 1784+ unit tests (140 fitxers), 9 E2E specs (~80 tests), CI amb coverage

### Infraestructura (complet)
- CI (ci.yml), backup BD setmanal, PWA admin, Sentry, GA4 WebVitals, crons amb Bearer auth

### Temàtiques (tancat 2026-03-26)
- Món Màgic (hero, galeria, to aprovat), Halloween (Tim Burton, HalloweenAtmosphere)

### UX click-to-center (tancat 2026-03-26)
- Primer click centra + ring, segon click navega. A /servicios, ServicesGridElegant, MobileServicesCards.

### Packs copy i empresas (tancat 2026-03-26)
- Features copy natural a packs-config.ts, empresas packs secció dinàmica, GuestRecommender algorisme

### Configuració i constants (consolidat)
- `config/packs-config.ts`, `config/site-config.ts`, `config/portfolio-images.ts`
- `config/client-logos.ts`, `config/equipment-config.ts`
- `lib/constants/index.ts` (~1800L), `lib/constants/privacy.ts`

### Serveis de negoci (consolidats — NO TOCAR lògica)
- costEngine, fuelReferenceService, leadRouteService, bookingRouteService, customerRouteService
- heroVideoService, galleryService, portfolioMediaService, portfolioEventService
- googleReviewsCacheService, weatherService

### i18n (estructura consolidada)
- 3 fitxers (~6800L cadascun), admin català directe, emails preferredLocale, formats centralitzats

## Zones consolidades

- Les zones ja tancades no es reobren per gust.
- La referència viva del que ja existeix és `docs/estat-admin.md`.
- Si una guia antiga queda completada, es marca com a TANCAT o s'arxiva.

### `/studio` — fitxa tècnica del sistema visual (ZONA PROTEGIDA)

- `app/studio/` és la fitxa tècnica viva del sistema visual del nou admin (16 seccions: tokens, components, comunicacions, documents). És el **laboratori** i la pàgina de **consulta** del disseny. Ja va ser reventada un cop (buidada de 16 seccions a un wireframe) perquè vivia fora de git.
- **No buidar, no reduir, no wireframitzar.** Tota peça nova s'hi **afegeix** mantenint les seccions existents. El guard `qa:studio-integrity` (a `validate:core`) falla si el TSX perd seccions, baixa de 400 línies o si `studio.css` es buida.
- Documents de referència: `docs/studio-fitxa-tecnica-handoff.md` (operativa) i `docs/studio-textos.md` (inventari de textos).
- Tota passa sobre `/studio` (prova o definitiva) ha de quedar **a git** i documentada al diari amb número de canvi. Captura de regressió: `node .dbg-studio.cjs` → `.codex-captures/studio-*.png`.

### `/studio-lab` — laboratori del nou admin (Òrbita Command)

- `app/studio-lab/` és el **laboratori** on es dissenya el nou admin (concepte *Òrbita Command*: pipeline de bolos arrossegable, decisions al centre). Prototip intern `noindex`, dades de mostra.
- Distinció: `/admin` = admin real a substituir · `/studio` = fitxa tècnica del sistema visual · `/studio-lab` = laboratori del nou admin.
- Estat i full de ruta a `docs/studio-lab-handoff.md`. Tota passa → git + diari amb número de canvi.

## Documentació obligatòria

- `docs/diario.md` s'ha d'actualitzar quan es tanca una passada rellevant.
- El diari ha d'explicar què s'ha fet, amb quin criteri i quina validació real s'ha passat.
- No escriure "final", "tot net" o equivalents si no està realment verificat.
