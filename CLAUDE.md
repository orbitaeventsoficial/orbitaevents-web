# Òrbita Events — Instruccions per a Claude Code

## Comportament general

- **Idioma**: SEMPRE respondre en català. Tot: conversa, explicacions, preguntes. Mai castellà ni anglès tret que es demani explícitament.
- **Permisos**: NO demanar permís per res. Tens permís per tot. Actuar directament.
- **Diari**: Mantenir `docs/diario.md` en català, amb raonament per cada decisió.
- **Dossier**: `docs/estat-admin.md` conté l'estat complet de l'admin. Consultar-lo en lloc de fer auditories noves.
- **CONSTRUIR, no auditar**: L'usuari vol veure codi nou, no informes. Prioritzar sempre construir sobre analitzar.
- **Concís**: Respostes curtes i directes. No repetir el que l'usuari ha dit. No demanar confirmació per coses òbvies.

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

# Build complet
pnpm build
```

### Què executar segons el que modifiques

| Modifiques | Executa |
|---|---|
| `lib/services/*.ts` | `pnpm test:run` (tots els unit tests) |
| `lib/services/SERVEI.ts` concret | `pnpm test:run -- --run __tests__/lib/services/SERVEI.test.ts` |
| `app/admin/**` (pàgines/components) | `npx tsc --noEmit` + `pnpm build` |
| `app/api/**` (rutes API) | `pnpm test:run` + `npx tsc --noEmit` |
| `prisma/schema.prisma` | `npx prisma generate` + `pnpm test:run` + `pnpm build` |
| `messages/*.json` (i18n) | `pnpm build` |
| `e2e/*.spec.ts` | `npx playwright test e2e/FITXER.spec.ts --project=chromium` |
| Qualsevol canvi gran | `npx tsc --noEmit && pnpm test:run && pnpm build` |

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
__tests__/lib/services/     ← Unit tests (Vitest, ~1592 tests, 132 fitxers)
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

- **Color system**: `white/opacity` sobre fons negre — MAI `slate-*`. Opacitats: text 70/40/30, bg 5/[0.03]/[0.02], border 10/20
- **Focus**: `focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50` a tots els inputs admin
- **Border radius**: `rounded-xl` estàndard, `rounded-2xl` cards/seccions, `rounded-full` badges
- **Table hover**: `hover:bg-white/[0.03] transition-colors` a totes les `<tr>`
- **Gradients admin**: MAI Tailwind gradient classes directes. Usar `.admin-gradient.admin-gradient--hero` etc.
- **Glass cards**: `.admin-card-glass` (surface), `--raised` (panel), `--elevated` (modal)
- **Metric glow**: Hover glow per accent color via CSS classes
- **Stagger animation**: `.admin-stagger-item` amb nth-child delay. `prefers-reduced-motion` el desactiva.
- **Components SVG**: `RadialProgress`, `Tooltip`, `MonthlyBarChart`, `DonutChart` — tots reutilitzables

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
- **1592 unit tests** (132 fitxers) — 100% serveis coberts
- **9 E2E specs** (~80 tests) — admin, públic, APIs, SEO, contacte, serveis
- **CI** amb coverage report i artifact upload

### Infraestructura (complet)
- **CI**: `.github/workflows/ci.yml` — lint+tsc, tests+coverage, build
- **Backup BD**: `.github/workflows/backup.yml` — setmanal, artifact 90 dies
- **PWA admin**: Manifest + service worker
- **Sentry**: Integrat a next.config.mjs
- **Analytics**: GA4 amb WebVitalsReporter, ConsentScripts
