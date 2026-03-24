# Òrbita Events — Instruccions per a Claude Code

## Comportament general

- **Idioma**: SEMPRE respondre en català. Tot: conversa, explicacions, preguntes. Mai castellà ni anglès tret que es demani explícitament.
- **Permisos**: NO demanar permís per res. Tens permís per tot. Actuar directament.
- **Diari**: Mantenir `docs/diario.md` en català, amb raonament per cada decisió.
- **Dossier**: `docs/estat-admin.md` conté l'estat complet de l'admin. Consultar-lo en lloc de fer auditories noves.
- **CONSTRUIR, no auditar**: L'usuari vol veure codi nou, no informes. Prioritzar sempre construir sobre analitzar.
- **Concís**: Respostes curtes i directes. No repetir el que l'usuari ha dit. No demanar confirmació per coses òbvies.

## NIVELL D'EXIGÈNCIA DE L'USUARI — LLEGIR ABANS DE FER RES

**L'usuari és exigent, directe i no tolera voltes.** Aquestes regles són inviolables:

### Escolta primer, actua després
- **ENTENDRE el que demana ABANS de tocar codi.** Si no ho tens 100% clar, pregunta UNA vegada. No interpretar, no suposar, no improvisar.
- **MAI fer canvis que no s'han demanat.** Si l'usuari diu "quadrícula al footer", NO toquis la quadrícula d'altres llocs. Si diu "unifica stats", NO eliminis el grid pattern global de passada.
- **Un canvi = un canvi.** No aprofitar per "millorar" coses del voltant. No opinar sobre si algo és "de 2020" o no tret que es demani opinió.

### Zero cercles
- **Fer el canvi correcte A LA PRIMERA.** No fer-desfet-refer. Si no estàs segur, pregunta ABANS de tocar.
- **MAI desfer un canvi i tornar-lo a fer 3 vegades.** Si t'equivoques, reverteix net i pregunta.
- **Verificar amb captures de pantalla** (Playwright) cada canvi visual ABANS de dir que està fet.

### Monocapa — SEMPRE
- **Cada decisió visual, lògica o de dades ha de viure a UN SOL LLOC.** Mai duplicar el mateix efecte, valor o patró en dues capes (inline + CSS class, component + constant, etc.).
- **Tot ha de venir dels arxius centralitzats** (`lib/constants`, `globals.css`, `site-config.ts`, `messages/*.json`). Si un valor apareix a un component, ha de ser perquè ve d'una font centralitzada, NO hardcoded.
- **Abans de tocar qualsevol cosa**: comprovar si ja existeix per una altra via. Si existeix, usar-la. Si no, crear-la al lloc correcte (constants, CSS, traduccions) i referenciar-la.
- **Si un efecte s'aplica a N llocs, ha de venir d'UN sol lloc.** Si és exclusiu d'un component, va inline. Mai les dues coses alhora.

### Comunicació
- **No donar rodeos.** Si l'has cagat, dir-ho i arreglar-ho. No justificar-se.
- **No repetir el que l'usuari ha dit.** Ell ja ho sap.
- **No prometre coses que no has verificat.** Si dius "fet", ha d'estar realment fet i comprovat.

---

## CHECKLIST DE QUALITAT — Obligatòria en TOTA modificació

**Aquesta secció és la llei del repo.** Cada cop que es modifica qualsevol fitxer, s'ha de verificar TOT el que apliqui. No és opcional.

---

### 1. ZERO HARDCODED — Mai valors en cru al codi

| Prohibit | Correcte | On està |
|---|---|---|
| `"2026"`, `"2025"` (anys) | `new Date().getFullYear()` o `{year}` a traduccions | Tot el codi |
| `"€"`, `"EUR"` inline | `formatCurrency(value, locale)` | `lib/constants/index.ts` |
| `"12/03/2026"` dates inline | `formatDate(date, locale)` / `formatDateTime` | `lib/constants/index.ts` |
| `"ca-ES"`, `"es-ES"` inline | `toIntlLocale(locale)` | `lib/constants/index.ts` |
| `"fiestas"`, `"bodas"` strings soltes | `ServiceSlug` type | Tipat a TypeScript |
| `"Bàsic"`, `"Premium"` hardcoded | Traduïts via `messages/*.json` | next-intl |
| URLs absolutes internes | Paths relatius o constants | `config/site-config.ts` |
| Colors hex/rgb inline a JSX | Classes Tailwind del design system | Veure "Visual / CSS" |
| `alert()`, `window.confirm()` | `useConfirmDialog()` | Hook propi |
| Preus/marges calculats inline | `computeBookingFinancialSummary()` | `lib/services/costEngine.ts` |
| Cost vehicle calculat inline | `getEffectiveVehicleCostPerKm()` | `fuelReferenceService.ts` |
| Textos d'UI directes al JSX | `t('clau')` via next-intl | `messages/{ca,es,en}.json` |

**Regla d'or**: Si un valor apareix a més d'1 lloc, ha d'estar a una constant, configuració o traducció. Si és un format (data, moneda, número), ha de passar per la funció centralitzada.

---

### 2. TESTING — Cada línia nova, testada

#### Quan modificar codi, SEMPRE:

1. **Abans de modificar**: Llegir el fitxer i entendre el context
2. **Després de modificar**: Executar els tests relacionats
3. **Si fallen tests**: Arreglar-los ABANS de continuar amb una altra cosa
4. **Mai lliurar codi que faci fallar tests existents**
5. **Si es crea lògica nova**: Crear test corresponent al moment (no "després")

### Comandes de test

```bash
# Tests unitaris (ràpid, ~30s)
pnpm test:run

# Tests unitaris d'un servei específic
pnpm test:run -- --run __tests__/lib/services/NOM.test.ts

# Tests unitaris amb coverage
pnpm test:run -- --coverage

# E2E tests (necessita servidor, ~3min)
npx playwright test --project=chromium

# E2E d'un fitxer específic
npx playwright test e2e/NOM.spec.ts --project=chromium

# TypeScript check (sense executar)
npx tsc --noEmit

# Guard de capa (catalegs locals sospitosos)
pnpm run arch:layer:check

# Build complet
pnpm build
```

### Què executar segons el que modifiques

| Modifiques | Executa |
|---|---|
| `lib/services/*.ts` | `pnpm test:run` (tots els unit tests) |
| `lib/services/SERVEI.ts` concret | `pnpm test:run -- --run __tests__/lib/services/SERVEI.test.ts` |
| `app/admin/**` (pàgines/components) | `pnpm run arch:layer:check` + `npx tsc --noEmit` + `pnpm build` |
| `app/api/**` (rutes API) | `pnpm test:run` + `pnpm run arch:layer:check` + `npx tsc --noEmit` |
| `prisma/schema.prisma` | `npx prisma generate` + `pnpm test:run` + `pnpm run arch:layer:check` + `pnpm build` |
| `messages/*.json` (i18n) | `pnpm run arch:layer:check` + `pnpm build` |
| `e2e/*.spec.ts` | `npx playwright test e2e/FITXER.spec.ts --project=chromium` |
| Qualsevol canvi gran | `pnpm run arch:layer:check && npx tsc --noEmit && pnpm test:run && pnpm build` |

### Quan es crea un element nou

Quan es crea un fitxer nou de lògica de negoci (`lib/services/*.ts`, `lib/*.ts`, `app/api/**/*.ts`), **SEMPRE crear el test corresponent**:

1. **Serveis** (`lib/services/nouServei.ts`) → Crear `__tests__/lib/services/nouServei.test.ts`
2. **API routes** (`app/api/admin/ruta/route.ts`) → Testar via el servei que invoquen
3. **Utilitats** (`lib/utils/nova.ts`) → Crear `__tests__/lib/nova.test.ts`

El test ha de cobrir com a mínim:
- Cas d'èxit (happy path)
- Validació d'inputs (camps obligatoris, valors invàlids)
- Casos límit (null, buit, no trobat)
- Errors esperats (404, 400, etc.)

Patró estàndard per al mock de Prisma:
```typescript
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: { model: { method: vi.fn() } },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
```

### Si un test falla

1. Llegir l'error amb atenció
2. Determinar si el test és incorrecte o el codi és incorrecte
3. Si el codi és incorrecte → arreglar el codi
4. Si el test és obsolet (selectors canviats, textos actualitzats) → actualitzar el test
5. Re-executar per confirmar que passa
6. MAI desactivar o eliminar tests sense raó justificada

### Estructura de tests

```
__tests__/lib/services/     ← Unit tests (Vitest, ~1784 tests, 140 fitxers)
e2e/                        ← E2E tests (Playwright, 9 specs, ~80 tests)
vitest.config.ts            ← Config Vitest amb aliases
playwright.config.ts        ← Config Playwright amb webServer
```

**Cobertura actual**: 100% serveis tenen test. Tots els `lib/services/*.ts` estan coberts.

### Patrons de test establerts

- **Mock de Prisma**: `vi.hoisted()` + `vi.mock('@/lib/prisma')` — veure qualsevol test existent
- **Mock de server-only**: Alias a `vitest.config.ts` → `vitest.server-only-stub.ts`
- **Mock de fetch**: `globalThis.fetch = vi.fn()` amb cleanup a `afterAll`
- **Mock de File**: Spy `FormData.get()` amb objecte mock (jsdom no suporta `file.arrayBuffer()`)
- **E2E admin**: Auth amb `extraHTTPHeaders` Basic, `setupErrorFilter` per ignorar hidratació, `addLocatorHandler` per tancar dev overlay

---

### 3. TOT ES VEU — Res invisible, res amagat, res trencat visualment

- **Cap element nou sense verificar que es renderitza**: Si crees un component, pàgina o secció, comprova que es veu al navegador (o que el build no falla).
- **Responsive obligatori**: Tot el que es toca ha de funcionar a mòbil (min 375px), tablet (768px) i desktop (1280px+).
  - Taules: `overflow-x-auto` al contenidor. Columnes secundàries `hidden md:table-cell`.
  - Botons: `min-h-[44px] min-w-[44px]` per touch targets mòbil.
  - Textos llargs: `truncate` o `line-clamp-2` per evitar overflow.
- **Dark mode admin**: El fons és negre (`bg-[#0a0a0f]`). Tot text sobre `white/opacity`. Si un element no es veu sobre fons fosc, està malament.
- **Skeleton loading**: Cada pàgina admin ha de tenir el seu `loading.tsx` amb skeleton. Si en crees una de nova, crea el loading.
- **Empty states**: Si una llista pot estar buida, mostrar missatge clar ("No hi ha elements") amb icona. Mai una pàgina en blanc.
- **Errors visibles**: Tot `catch` ha de tenir com a mínim `console.error()`. Si és acció d'usuari, `toast.error()`. Mai swallow silent d'errors.
- **Traduccions**: Si afegeixes text a la UI, ha d'estar als 3 fitxers: `messages/ca.json`, `messages/es.json`, `messages/en.json`. Mai text directe al JSX per la part pública. Admin pot ser català directe.

---

### 4. TOT FUNCIONA — Res trencat, res a mitges

- **0 errors TypeScript**: `npx tsc --noEmit` ha de passar NET. 0 errors, 0 `any` nous (els existents es toleren, no n'afegeixis de nous).
- **Build net**: `pnpm build` sense warnings nous. Si un warning apareix pel teu canvi, arregla'l.
- **0 tests trencats**: `pnpm test:run` ha de donar el mateix resultat o millor que abans del canvi.
- **Navegació funcional**: Si toques una pàgina admin, comprova que els links/breadcrumbs no queden trencats.
- **Formularis complets**: Si crees o modifiques un formulari:
  - Tots els camps obligatoris tenen validació (client + servidor)
  - El submit mostra loading state i feedback (toast success/error)
  - Els selects tenen opció per defecte o placeholder
  - `htmlFor` + `id` a cada label/input
- **API routes**: Si crees una ruta API nova:
  - Validació d'inputs al principi (400 si falta algo)
  - Try/catch amb resposta d'error adequada (500, 404, etc.)
  - Auth check si és ruta admin (`requireAdmin()` o similar)
  - Testar via el servei corresponent

---

### 5. ACCESSIBILITAT — No és opcional

- `htmlFor` + `id` a cada parella label/input
- `aria-label` a selects sense label visible, botons amb només icona, taules
- `scope="col"` a tots els `<th>`
- `min={0}` a inputs numèrics de preus/quantitats
- `rel="noopener noreferrer"` amb `target="_blank"`
- `role="switch"` + `aria-checked` als toggles
- Focus ring visible: `focus:ring-1 focus:ring-cyan-500/50`
- Contrast suficient: text `white/70` mínim sobre fons fosc

---

### 6. SEGURETAT — Mai relaxar

- **Inputs d'usuari**: Mai inserir directament al HTML sense sanititzar. Prisma ja parametritza SQL, però compte amb `dangerouslySetInnerHTML`.
- **Auth**: Tota ruta `/api/admin/*` ha de verificar autenticació. No hi ha excepcions.
- **Uploads**: Validar tipus MIME i extensió. Limitar mida (ja configurat).
- **Variables d'entorn**: Mai hardcodejar secrets. Tot a `.env` i referit via `process.env.X`.
- **Headers de seguretat**: Ja configurats (CSP, HSTS, X-Frame). No relaxar-los.

---

### 7. i18n — Tres idiomes sempre

- **Públic (web)**: Tot traducció via `t('clau')`. Si afegeixes una clau nova → afegir als 3 JSON (`ca.json`, `es.json`, `en.json`).
- **Admin**: Interfície en català directe (no cal traduir). Però els emails als clients usen `preferredLocale`.
- **Emails**: Sempre usar `preferredLocale` del Lead/Booking/Customer. Cadena: `lead.preferredLocale || booking.preferredLocale || customer.preferredLocale || 'es'`.
- **Formats**: Dates i moneda sempre via funcions centralitzades amb `locale` param.
- **Slug de servei**: Mantenir `ServiceSlug` type. No inventar nous slugs.

---

### 8. CONSISTÈNCIA VISUAL — El design system mana

- **Colors**: Sistema `white/opacity` sobre fons negre. MAI `slate-*`, `gray-*`, ni hex custom.
- **Border radius**: `rounded-xl` estàndard, `rounded-2xl` cards, `rounded-full` badges.
- **Cards**: `.admin-card-glass`, `--raised`, `--elevated`. No inventar cards noves.
- **Gradients**: `.admin-gradient.admin-gradient--hero` etc. MAI Tailwind gradient classes directes.
- **Hover taules**: `hover:bg-white/[0.03] transition-colors` a totes les `<tr>`.
- **Spacing**: Padding intern cards `p-6`, gap entre elements `gap-4` o `gap-6`, margin entre seccions `mb-8`.
- **Tipografia**: Títols `text-xl font-semibold text-white/90`, subtítols `text-sm text-white/40`, body `text-sm text-white/70`.
- **Animacions**: `.admin-stagger-item` amb `prefers-reduced-motion` respectat.

---

### RESUM RÀPID — Checklist pre-lliurament

```
□ pnpm run arch:layer:check → sense catalegs locals sospitosos
□ npx tsc --noEmit          → 0 errors
□ pnpm test:run             → tots passen
□ pnpm build                → build net
□ 0 valors hardcoded        → dates, moneda, anys, textos, colors
□ Tests nous per codi nou   → servei/util/API → test
□ Responsive verificat      → mòbil 375px, tablet, desktop
□ Empty states              → llistes buides mostren missatge
□ Errors amb feedback       → catch + console.error/toast.error
□ Accessibilitat            → labels, aria, focus, contrast
□ i18n complet              → 3 JSONs si és públic
□ Seguretat                 → auth, sanitize, env vars
□ Visual consistent         → design system, no hex custom
□ loading.tsx               → skeleton si pàgina nova
□ Formularis validats       → client + servidor
```

---

## Stack i infraestructura

- **Framework**: Next.js 14 (App Router), TypeScript strict
- **BD**: Prisma + PostgreSQL (Railway, connexió directa sense pooler)
- **i18n**: next-intl (ca/es/en)
- **Tests**: Vitest (unit) + Playwright (E2E)
- **Storage**: Filesystem local `./uploads/`, servit via `/api/uploads/[...path]`
  - Funcions: `uploadFile()`, `deleteFile()`, `readFile()`, `getPublicUrl()`, `isLocalStorageUrl()`
  - Tot a `lib/storage.ts`
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) — lint+typecheck, tests amb coverage, build
- **CI backup**: `.github/workflows/backup.yml` — backup BD setmanal (dilluns 3:00 UTC)

### Hero media admin

- **Servei**: `lib/services/heroVideoService.ts` — CRUD sobre Setting (`config.heroMedia`, JSON)
- **API admin**: `/api/admin/hero-media` — GET/POST/DELETE amb `requireAuth`
- **API pública**: `/api/hero-media` — GET amb cache 5min, retorna només actius
- **Admin UI**: `app/admin/settings/hero/page.tsx` — upload, URL externa, toggle, reorder, delete
- **Component**: `app/components/ui/HeroElegant.tsx` — fetch media, shuffle, mixed video+imatge, Ken Burns, blur morph text

## Patrons de codi

### Serveis i lògica de negoci

- **Cost/marge**: Tot passa per `computeBookingFinancialSummary()` a `lib/services/costEngine.ts`. MAI calcular marges inline.
- **Cost vehicle**: `getEffectiveVehicleCostPerKm()` a `fuelReferenceService.ts`. Fórmula: `(fuelPrice × consumL100 / 100) + maintenanceCostPerKm`
- **Locale mapping**: `toIntlLocale(locale)` de `lib/constants` per convertir `ca`→`ca-ES`, `es`→`es-ES`, `en`→`en-GB`. Mai hardcodejar.
- **Dates/números**: Funcions centralitzades a `lib/constants/index.ts` — `formatDate`, `formatDateTime`, `formatCurrency`, etc. Totes accepten `locale`.
- **ServiceSlug**: `'fiestas' | 'bodas' | 'discomovil' | 'empresas'` — sense produccion ni alquiler
- **Pack names**: En català clar — Bàsic, Premium, Exclusiu, Complet, Còctel, Estàndard, Gala
- **Semàfor pagament**: `depositPaid && remainingPaid` = verd, `depositPaid` = groc, cap = vermell
- **Client hub**: `fetchCustomerHub()` és la font única per a tota la fitxa client

### Emails

- **preferredLocale**: Existeix a Customer, Lead i Booking. SEMPRE usar-lo per emails al client.
- **Cadena locale**: `lead.preferredLocale || booking.preferredLocale || customer.preferredLocale || 'es'`
- **Translate API**: `/api/admin/translate` — POST `{ texts: string[], targetLanguages: ['es','en'] }`. DeepL primer, Google Translate fallback.
- **Signatura**: `getEmailSignatureHtml()` i `getEmailSignatureText()` de `lib/email.ts`

### UX i components

- **Diàlegs**: Mai `alert()` ni `window.confirm()`. Usar `useConfirmDialog()` hook o inline errors amb `setError()`.
- **ConfirmDialog**: `const { confirm, dialogProps } = useConfirmDialog()`. `confirm(opts)` retorna `Promise<boolean>`. Variants: danger/warning/info.
- **Kanban**: Drag & drop HTML5 + optimistic updates + toast + botons mòbil. Ref: `TaskKanbanView`, `LeadPipelineView`, `BookingPipelineView`
- **View toggle**: searchParam `view=kanban|list` per canviar vista.
- **Overflow menu**: `<details><summary>` natiu HTML per accions secundàries.
- **Toggle switch**: CSS-only amb `role="switch"` + `aria-checked` + `translate-x`.
- **WhatsApp**: `getWhatsAppUrl(messageType, customData)` de `config/site-config.ts`
- **BookingSectionNav**: IntersectionObserver per 10 seccions amb scroll-to smooth. Sticky.

### Visual / CSS

#### Principi MONOCAPA visual (CRÍTIC — llegir abans de tocar CSS)

**Cada efecte visual ha de viure a UN SOL LLOC. Mai duplicar entre inline i classe CSS, entre component i globals, o entre dos components.**

Abans de tocar qualsevol estil:
1. Comprovar si l'element JA té l'efecte per una altra via (classe global, inline, herència, pseudo-element)
2. Si existeix → usar-lo, no crear-ne un de nou
3. Si no existeix → crear-lo al lloc correcte (globals.css per compartit, inline per exclusiu d'un component)
4. **MAI** aplicar el mateix efecte per dues vies alhora (ex: grid pattern via classe CSS + grid pattern inline = DOBLE = error)

**Verificació obligatòria**: Després de cada canvi visual, fer captura amb Playwright i comparar amb l'estat anterior. No dir "fet" sense veure-ho.

#### Quadrícula de fons (grid pattern)

- **Classe**: `oe-grid-pattern` — definida a `globals.css`, `::before` amb quadrícula 60px × 60px, blanc, z-index 0.
- **Opacitat**: `0.015` — molt subtil, afegeix textura sense competir amb el contingut.
- **On s'aplica**: Seccions públiques amb fons fosc que necessiten textura (footer, stats, CTA, FAQ, garantia).
- **On NO s'aplica**: Heroes amb imatge, seccions amb contingut dens (cards, portfoli, formularis), admin.
- **Regla MONOCAPA**: Si una secció té `oe-grid-pattern`, **NO pot tenir** cap grid inline propi. Una sola font, sempre.
- **Admin**: NO porta quadrícula. Mai.

#### Paleta pública (site públic)

- **Fons**: Negre (`#0A0A0A`, `zinc-950`, `black`). Totes les seccions públiques.
- **Text**: `text-white` per títols, `text-white/70` per body, `text-white/40-60` per secundari.
- **Accent únic**: Ambre (`amber-400`, `amber-500`, `orange-400`). Per a CTAs, highlights, badges, stats.
- **MAI**: Porpra, cyan, rosa, verd o qualsevol altre color com a accent principal en seccions genèriques. Aquests colors NOMÉS per a pàgines temàtiques específiques (Halloween = taronja/vermell, Món Màgic = porpra, etc.).
- **Glows decoratius**: Molt subtils (`/5` opacitat màxima), blur gran (`blur-3xl`). No han de competir amb el contingut.
- **Border**: `border-white/10` estàndard. `border-white/20` al hover. Mai borders de color.

#### Stats (component unificat)

- **Un sol component**: `StatsSection` (`app/components/marketing/StatsSection.tsx`).
- **Disseny**: Xifres ambre sobre negre, separadors verticals (`divide-x divide-white/10`), glow central subtil. Sense targetes colorides, sense emojis, sense gradients multicolor.
- **Dades**: Via API `/api/public/stats`. Defaults raonables si l'API falla.
- **On s'usa**: Home desktop (`page.tsx`), home mobile (`MobileHomePage`). Enlloc més.
- **MAI**: Crear variants de stats a altres llocs (footer, opinions, etc.). Si es vol mostrar un número, usar el component existent.

#### Arquitectura CSS admin (IMPORTANT — no repetir errors)

- **Layout admin**: `app/admin/layout.tsx` retorna `<>Fragment</>` amb `<div className="admin-layout-shell">` — **MAI** renderitzar `<html>` ni `<body>` (el root layout ja ho fa)
- **Fitxers CSS admin**: 3 fitxers carregats a `admin/layout.tsx`:
  - `globals.css` — estructura (sidebar, headers, nav) + tokens extra (`--at-gold`, `--at-blue`, etc.)
  - `admin-theme.css` — tokens base (`--at-bg/surface/panel/border`), glass, pipeline colors, booking stats, leads metrics, semantic tones, UX polish
  - `control-room.css` — dashboard específic amb tokens `--at-cr-*`
- **Classe `admin-mode`**: S'afegeix a `document.documentElement` via useEffect. Tots els CSS admin requereixen `html.admin-mode` com a prefix.
- **Cascada**: admin-theme.css NO pot competir amb globals.css a mateixa especificitat — Next.js no garanteix ordre de chunks. Si una propietat visual (background, border) es defineix a globals.css, canviar-la allà directament, no intentar override des d'admin-theme.css.
- **Tailwind dins admin**: `.border` hereta `var(--at-border)`, `bg-white/5` → `var(--at-raised)` automàticament via globals.css

#### Paleta admin (tokens a admin-theme.css)

- `--at-bg: #0f1218` → `--at-surface: #1a1f2b` → `--at-panel: #222938` → `--at-raised: #2d3548`
- `--at-border: #3a4560`, `--at-border-strong: #506080`
- Glass: `--at-glass-bg: rgba(22,28,40,0.85)`, `--at-glass-border: rgba(255,255,255,0.12)`
- Cada capa ha de tenir **mínim 20 unitats** de diferència amb l'anterior

#### Classes i patrons

- **Glass cards**: `.admin-card-glass` — backdrop-blur, semi-transparent, shadow, hover
- **Focus**: `focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50` a tots els inputs admin
- **Border radius**: `rounded-xl` estàndard, `rounded-2xl` cards/seccions, `rounded-full` badges
- **Table hover**: `hover:bg-white/[0.03] transition-colors` a totes les `<tr>`
- **Gradients admin**: MAI Tailwind gradient classes directes. Usar classes `.admin-gradient--*`
- **Metric glow**: Hover glow per accent color via CSS classes
- **Stagger animation**: `.admin-stagger-item` amb nth-child delay. `prefers-reduced-motion` el desactiva.
- **Components SVG**: `RadialProgress`, `Tooltip`, `MonthlyBarChart`, `DonutChart` — tots reutilitzables
- **Leads metrics**: `.admin-leads-metric--open/won/lost/winrate` amb colors semàntics

### Accessibilitat (OBLIGATORI en tot codi nou)

- **Formularis**: Sempre `htmlFor`+`id` a cada label/input
- **Selects sense label**: Sempre `aria-label`
- **Taules**: `aria-label` descriptiu a `<table>`, `scope="col"` a `<th>`
- **Números**: `min={0}` a inputs de preus, quantitats, valors monetaris
- **Links externs**: Sempre `rel="noopener noreferrer"` amb `target="_blank"`
- **Catch blocks**: Sempre `console.error` com a mínim, `toast.error()` si és acció d'usuari
- **Dates**: MAI hardcodejar anys. Usar `new Date().getFullYear()` o `{year}` a traduccions

### Calendari

- **Vista diària**: `?view=day` — CalendarDayClient amb timeline per hores
- **Toggle**: Botons Mes/Setmana/Dia a les vistes
- **Cel·les compactes**: `h-[72px] sm:h-[80px] md:h-[88px]` — dissenyat per cabre en una pantalla sense scroll
- **KPIs**: amb color semàntic (emerald reserves, rosa bloquejos, cyan lliures, ambre mixtes)

### Delete (patró estàndard)

- **ConfirmDialog**: SEMPRE usar `useConfirmDialog()` per a deletes. Mai `window.confirm()`, mai doble-clic.
  ```tsx
  const { confirm, dialogProps } = useConfirmDialog();
  const ok = await confirm({ title, message, variant: 'danger', confirmLabel: 'Eliminar' });
  // + <ConfirmDialog {...dialogProps} /> al JSX
  ```
- **Leads**: Requereix estat LOST abans d'eliminar. Backend valida a `leadRouteService.ts`
- **Bookings**: Només PENDING o CANCELLED. Backend valida a `bookingRouteService.ts`
- **Clients**: Smart GDPR — si té reserves/pressupostos → anonimitza. Si no → elimina. Servei: `customerRouteService.ts`

### Lead lifecycle

- **Estats oberts**: NEW → CONTACTED → QUOTE_SENT → NEGOTIATING → WON/LOST
- **Auto-LOST**: Cron `lead-cleanup` marca leads amb eventDate passat com LOST
- **Auto-DELETE**: Cron `lead-cleanup` elimina LOST >90 dies sense booking (cascade: notes, activities, tasks, documents)
- **Cron endpoint**: `/api/cron/lead-cleanup` — Bearer auth amb CRON_SECRET
- **DNI**: Camp `dni` al model Lead. Auto-uppercase. Cercable a pipeline

### Google Reviews (dashboard)

- **Cache**: `settings` table amb claus `stats.googleRating`, `stats.googleReviewCount`, `cache.googleReviews`
- **Dashboard**: Mostra rating i count de Google (no de CustomerTestimonial interna)
- **Sync**: Via SerpAPI o Google Business OAuth. Manual a `/admin/google-reviews` ("Refrescar ressenyes")
- **Servei**: `googleReviewsCacheService.ts` — `readGoogleReviewsCache()`, `writeGoogleReviewsCache()`

### Weather Widget

- **Servei**: `lib/services/weatherService.ts` — OpenWeatherMap free tier, 5-day forecast
- **Cache**: 1h en memòria
- **Activar**: Cal `OPENWEATHERMAP_API_KEY` a env vars. Sense key, widget no es mostra (graceful fallback)
- **Mostra**: Previsions per reserves CONFIRMED/PREPARING en els pròxims 3 dies

### Filtres

- **Server-side**: searchParams a page.tsx → Prisma where clause
- **Client-side**: FilterChips locals dins el component (no recarrega pàgina). Ref: LeadPipelineView.

## Què JA EXISTEIX — NO tornar a crear ni auditar

Abans de proposar crear o auditar qualsevol d'això, **consulta primer**. Ja està fet i funciona:

### SEO (complet)
- **`app/sitemap.ts`** (160 línies) — Dinàmic: pàgines estàtiques, zones, blog, portfolio, i18n (ca/es/en), prioritats estratègiques
- **`app/robots.ts`** (48 línies) — Regles per Googlebot, Googlebot-Image, Twitterbot. Disallow: /api/, /admin/, /_next/
- **`public/robots.txt`** — Fallback estàtic
- **JSON-LD** a `app/[locale]/layout.tsx` — LocalBusiness complet (geo, horaris, OfferCatalog amb preus, areaServed 13 ciutats, ReserveAction, CommunicateAction)
- **Open Graph + Twitter Cards** — Root layout + 31 `generateMetadata` a pàgines
- **Canonical URLs + hreflang** — Alternates ca-ES/es-ES/en-GB/x-default
- **Breadcrumbs** component amb schema.org
- **FAQ** component amb schema.org

### Performance (complet)
- **53 `loading.tsx`** amb skeletons (48 admin + 5 públic)
- **8 `dynamic()` imports** amb SSR i fallback skeletons
- **`next/image`** a 25 components (només 2 `<img>` raw a admin)
- **Cache headers** a `next.config.mjs`: 1 any immutable assets, no-store APIs, ISR 1h blog
- **Security headers**: CSP, HSTS 1 any preload, X-Frame-Options DENY, CORS
- **Image formats**: webp + avif habilitats a next.config
- **SWC minify** + source maps desactivats en producció

### Testing (complet)
- **1784 unit tests** (140 fitxers) — 100% serveis coberts
- **9 E2E specs** (~80 tests) — admin, públic, APIs, SEO, contacte, serveis
- **CI** amb coverage report i artifact upload

### Infraestructura (complet)
- **CI**: `.github/workflows/ci.yml` — lint+tsc, tests+coverage, build
- **Backup BD**: `.github/workflows/backup.yml` — setmanal, artifact 90 dies
- **PWA admin**: Manifest + service worker
- **Sentry**: Integrat a next.config.mjs
- **Analytics**: GA4 amb WebVitalsReporter, ConsentScripts
- **Crons**: `lead-cleanup` (auto-LOST + auto-DELETE), emails automation, reviews sync — tots amb Bearer auth CRON_SECRET

## Monocapa admin

### Regla de capa obligatoria

- El repo no pot tornar a créixer amb catàlegs, presets, copy estructural o metadada declarativa dins de components, pàgines o serveis si aquesta decisió pot viure a la capa comuna.
- Aquesta regla no aplica només a l'admin: també aplica a pàgines públiques, rutes API i serveis de domini.
- Si una dada és estable, declarativa i governa render, flux o comportament, ha d'anar a `lib/constants/*` o a un helper compartit pur.

### Què s'ha de deixar al component

- Estat React, handlers, wiring de render, refs, efectes i composició visual local.
- Wiring d'icones o components React quan només resolen una metadada compartida en un component concret.
- Lògica estrictament local de presentació que no representi una decisió reutilitzable de producte o domini.

### Què ha d'anar obligatoriament a la capa comuna

- Arrays i objects de `options`, `items`, `cards`, `stats`, `steps`, `faq`, `features`, `packs`, `products`, `badges`, `thresholds`, `copy`, `defaults`, `messages`, `mime types`, `limits`, `status labels`, `source labels`, `section order`, `nav meta` i qualsevol catàleg equivalent.
- Dades declaratives de pàgina encara que només surtin en una sola pàgina, si són estables i separables del JSX: galeries, cards, packs, FAQs, presets visuals, configuracions de calculadora, preus base, etc.
- Qualsevol helper local que només reempaqueti una decisió compartida o derivi opcions des d'un catàleg que ja existeix.

### Anti-patrons prohibits

- Declarar `const SOMETHING = [...]` o `const SOMETHING = { ... }` dins d'una pàgina o servei per dades estables de producte, copy o configuració.
- Fer `Object.keys(...)`, `Object.values(...)`, `new Set(...)` o `Record<string, string>` locals per reconstruir una decisió que la capa comuna ja coneix.
- Duplicar la mateixa semàntica en forma de labels, emojis, gradients, ordres, FAQs, packs o presets a dos fitxers diferents.
- Donar per bo un component perquè "només és d'aquesta pàgina" si el que conté és metadada declarativa i no wiring.

### Protocol abans d'afegir cap dada local nova

- Buscar primer a `lib/constants/*`, `lib/*` i a `docs/diario.md` si la decisió ja existeix.
- Si la dada és estable i separable del JSX, crear-la o ampliar-la a la capa comuna abans de renderitzar-la.
- Si hi ha dubte entre deixar-la local o no, el criteri per defecte és moure-la a constants compartides.

- Si una opció, label, ordre, badge o estat apareix a més d'un component admin, s'ha de moure a lib/constants/index.ts o lib/constants/privacy.ts.
- Els components d'admin han de consumir la capa comuna; no han de recrear arrays locals de STATUS_OPTIONS, SOURCE_OPTIONS, EVENT_TYPES, SECTIONS, STATUS_ORDER o maps equivalents si la dada ja és compartida.
- Quan es faci una passada d'un bloc d'admin, deixar també entrada breu i neta a docs/diario.md amb el criteri i la validació executada.
- La regla de monocapa admin també aplica a domini compartit: locales suportats, status values, open statuses, catàlegs de categories, ordres de serveis i filtres repetits. Si admin i serveis comparteixen aquesta decisió, s'ha de treure a constants comunes.

## Regles de no-engreixament

- "Ja esta fet" no es valid si encara queden adapters locals trivials, arrays duplicats, labels locals o helpers repetits. No donar per tancada una passada fins que la cerca residual estigui sota control.
- Si una decisio de domini o presentacio apareix en 2 o mes llocs, queda prohibit resoldre-la localment. S'ha de portar a lib/constants/* o a un helper compartit.
- Aixo aplica a: status labels, status values, open statuses, locales suportats, locale labels, categories, service order, filter options, source labels, section order i qualsevol cataleg equivalent.
- Queda prohibit recrear Record<string, string>, Object.keys(...), arrays s const, Set(...) o maps inline dins de components/serveis quan la mateixa dada ja existeixi conceptualment a la capa comuna.
- Si un component o pagina nomes te una funcio local per traduir un status, tipus o variant coneguda, aquesta funcio s'ha d'eliminar i s'ha de consumir la constant/helper comuna.
- Si una pagina te JSX massa dens o linies molt llargues amb logica incrustada, s'ha de refactoritzar abans de considerar la passada acabada.
- Abans d'afegir qualsevol nova constant o helper local a admin o serveis, buscar primer a lib/constants/* i lib/* si la decisio ja existeix.
- Quan es tanqui una passada, docs/diario.md ha d'explicar l'estat real: que s'ha rematat, que no, i quina validacio s'ha passat. No escriure "final" de manera optimista.
- `pnpm run arch:layer:check` forma part de la validacio obligatoria abans de build o merge. Si falla, no es pot donar la passada per bona.
- Quan es mogui una funcio petita o un helper local, deixar escrit tambe el perque: si no aporta comportament propi i nomes reempaqueta una decisio compartida, s'ha d'eliminar o moure a la capa comuna.
- La mateixa regla aplica a semantica de rutes admin: shortcuts de teclat, labels de breadcrumb, noms de detall i aliases de navegacio no s'han de recrear dins layout o pagines si ja representen estructura compartida d'admin.
- Regles de domini petites tambe compten: MIME types permesos, mides maximes de pujada, articles RGPD, camps que disparen sync extern i catalegs equivalents no s'han de deixar enterrats dins un servei si poden aparixer o ser consultats des d'altres punts.

- Exemples de code smell que no s'han de reintroduir: Object.keys(...) per generar opcions compartides, maps locals de labels d'estat, Set([...]) locals per regles de domini, arrays derivats locals per event types/categories/status values.

- Cas concret a no reintroduir: si una mateixa font, status o tipus necessita label + icona + fallback, no s'han de separar en maps locals per pantalla. S'ha de definir un helper/display compartit a lib/constants/* i consumir-lo des dels components.
