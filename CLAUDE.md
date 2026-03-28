# Ã’rbita Events â€” Instruccions per a Claude Code

## Comportament general

- **Idioma**: SEMPRE respondre en catalÃ . Tot: conversa, explicacions, preguntes. Mai castellÃ  ni anglÃ¨s tret que es demani explÃ­citament.
- **Permisos**: NO demanar permÃ­s per res. Tens permÃ­s per tot. Actuar directament.
- **Diari**: Mantenir `docs/diario.md` en catalÃ , amb raonament per cada decisiÃ³.
- **Dossier**: `docs/estat-admin.md` contÃ© l'estat complet de l'admin. Consultar-lo en lloc de fer auditories noves.
- **CONSTRUIR, no auditar**: L'usuari vol veure codi nou, no informes. Prioritzar sempre construir sobre analitzar.
- **ConcÃ­s**: Respostes curtes i directes. No repetir el que l'usuari ha dit. No demanar confirmaciÃ³ per coses Ã²bvies.

## NIVELL D'EXIGÃˆNCIA DE L'USUARI â€” LLEGIR ABANS DE FER RES

**L'usuari Ã©s exigent, directe i no tolera voltes.** Aquestes regles sÃ³n inviolables:

### Escolta primer, actua desprÃ©s
- **ENTENDRE el que demana ABANS de tocar codi.** Si no ho tens 100% clar, pregunta UNA vegada. No interpretar, no suposar, no improvisar.
- **MAI fer canvis que no s'han demanat.** Si l'usuari diu "quadrÃ­cula al footer", NO toquis la quadrÃ­cula d'altres llocs. Si diu "unifica stats", NO eliminis el grid pattern global de passada.
- **Un canvi = un canvi.** No aprofitar per "millorar" coses del voltant. No opinar sobre si algo Ã©s "de 2020" o no tret que es demani opiniÃ³.

### Zero hex hardcodejats
- **MAI hardcodejar colors hex** (`#0A0A0A`, `#1a1408`, etc.) als components o pÃ gines. SEMPRE usar tokens del design system: `bg-bg-main`, `bg-bg-surface`, `bg-bg-card`, `text-oe-gold`, `from-bg-main`, etc.
- Els Ãºnics llocs on hex Ã©s acceptable: `globals.css` (definiciÃ³ de variables), `tailwind.config.js`, admin canvas, API routes d'imatge, email templates.

### No fer auditories si la guia diu que no cal
- **Si la secciÃ³ "QuÃ¨ JA EXISTEIX" marca una cosa com tancada, NO auditar-la.** La feina ja estÃ  feta. No perdre temps ni tokens revisant-la.
- **Construir directament.** No fer "primer reviso l'estat actual" si la guia ja ho documenta.

### Zero cercles
- **Fer el canvi correcte A LA PRIMERA.** No fer-desfet-refer. Si no estÃ s segur, pregunta ABANS de tocar.
- **MAI desfer un canvi i tornar-lo a fer 3 vegades.** Si t'equivoques, reverteix net i pregunta.
- **Verificar amb captures de pantalla** (Playwright) cada canvi visual ABANS de dir que estÃ  fet.

### Procediment correcte quan cal netejar o refactoritzar visuals sense canviar el look
- **Objectiu primer**: mantenir el look actual. Si la pantalla ja es veu bÃ©, la neteja NO Ã©s una excusa per repintar-la.
- **Ordre obligatori**:
  1. Llegir CLAUDE.md i docs/diario.md abans de tocar res.
  2. Separar style funcional de style visual. PosiciÃ³, coordenades, amplades o cÃ lculs dinÃ mics poden ser legÃ­tims; colors, ombres, gradients i filtres visuals no.
  3. Moure els literals visuals a la capa correcta (lib/constants, globals.css, config central, traduccions) **sense alterar el resultat visual**.
  4. Auditar nomÃ©s els fitxers tocats o staged, no mig repo sense context.
  5. Verificar visualment que el resultat final Ã©s el mateix abans de donar-ho per bo.
- **Prohibit**: aprofitar una neteja per canviar gradients, ombres, colors, espais, tipografia o composiciÃ³ si l'usuari no ho ha demanat.
- **Prohibit**: substituir inline styles a cegues nomÃ©s perquÃ¨ existeixen. Primer s'ha d'entendre si sÃ³n funcionals o visuals.
- **Auditoria correcta**:
  - Grep nomÃ©s sobre el diff o els fitxers tocats.
  - Excloure casos legÃ­tims documentats: logos de marca, SVGs oficials, emails HTML, `admin-theme`, canvas i API d'imatges.
  - No declarar "net" si encara hi ha literals visuals nous al diff.
- **ImplementaciÃ³ obligatÃ²ria**: cada cop que Claude/Codex faci una neteja o refactor visual, ha de rellegir aquesta secciÃ³ i seguir aquest ordre exactament.
### Monocapa â€” SEMPRE
- **Cada decisiÃ³ visual, lÃ²gica o de dades ha de viure a UN SOL LLOC.** Mai duplicar el mateix efecte, valor o patrÃ³ en dues capes (inline + CSS class, component + constant, etc.).
- **Tot ha de venir dels arxius centralitzats** (`lib/constants`, `globals.css`, `site-config.ts`, `messages/*.json`). Si un valor apareix a un component, ha de ser perquÃ¨ ve d'una font centralitzada, NO hardcoded.
- **Abans de tocar qualsevol cosa**: comprovar si ja existeix per una altra via. Si existeix, usar-la. Si no, crear-la al lloc correcte (constants, CSS, traduccions) i referenciar-la.
- **Si un efecte s'aplica a N llocs, ha de venir d'UN sol lloc.** Si Ã©s exclusiu d'un component, va inline. Mai les dues coses alhora.

### ComunicaciÃ³
- **No donar rodeos.** Si l'has cagat, dir-ho i arreglar-ho. No justificar-se.
- **No repetir el que l'usuari ha dit.** Ell ja ho sap.
- **No prometre coses que no has verificat.** Si dius "fet", ha d'estar realment fet i comprovat.

### VerificaciÃ³ real â€” No dir "tot net" sense proves
- **`tsc --noEmit` no Ã©s suficient.** Compilar sense errors de tipus NO vol dir que el codi estigui net.
- **DesprÃ©s de cada ronda de canvis, fer grep actiu de residus:**
  - `#[0-9a-fA-F]{3,6}` â€” hex literals que haurien de ser Tailwind
  - `style={{` â€” inline styles que haurien de ser classes CSS
  - `rgba(` â€” colors inline que haurien de ser tokens
  - Imports no usats, exports morts
- **Ser honest sobre quÃ¨ s'ha verificat i quÃ¨ no.** Dir "compila sense errors de tipus, perÃ² no he passat eslint" Ã©s millor que dir "tot perfecte".
- **No defensar-se quan Codex o altres eines troben problemes.** Acceptar i corregir.

---

## CHECKLIST DE QUALITAT â€” ObligatÃ²ria en TOTA modificaciÃ³

**Aquesta secciÃ³ Ã©s la llei del repo.** Cada cop que es modifica qualsevol fitxer, s'ha de verificar TOT el que apliqui. No Ã©s opcional.

---

### 1. ZERO HARDCODED â€” Mai valors en cru al codi

| Prohibit | Correcte | On estÃ  |
|---|---|---|
| `"2026"`, `"2025"` (anys) | `new Date().getFullYear()` o `{year}` a traduccions | Tot el codi |
| `"â‚¬"`, `"EUR"` inline | `formatCurrency(value, locale)` | `lib/constants/index.ts` |
| `"12/03/2026"` dates inline | `formatDate(date, locale)` / `formatDateTime` | `lib/constants/index.ts` |
| `"ca-ES"`, `"es-ES"` inline | `toIntlLocale(locale)` | `lib/constants/index.ts` |
| `"fiestas"`, `"bodas"` strings soltes | `ServiceSlug` type | Tipat a TypeScript |
| `"BÃ sic"`, `"Premium"` hardcoded | TraduÃ¯ts via `messages/*.json` | next-intl |
| URLs absolutes internes | Paths relatius o constants | `config/site-config.ts` |
| Colors hex/rgb inline a JSX | Classes Tailwind del design system | Veure "Visual / CSS" |
| `alert()`, `window.confirm()` | `useConfirmDialog()` | Hook propi |
| Preus/marges calculats inline | `computeBookingFinancialSummary()` | `lib/services/costEngine.ts` |
| Cost vehicle calculat inline | `getEffectiveVehicleCostPerKm()` | `fuelReferenceService.ts` |
| Textos d'UI directes al JSX | `t('clau')` via next-intl | `messages/{ca,es,en}.json` |

**Regla d'or**: Si un valor apareix a mÃ©s d'1 lloc, ha d'estar a una constant, configuraciÃ³ o traducciÃ³. Si Ã©s un format (data, moneda, nÃºmero), ha de passar per la funciÃ³ centralitzada.

---

### 2. TESTING â€” Cada lÃ­nia nova, testada

#### Quan modificar codi, SEMPRE:

1. **Abans de modificar**: Llegir el fitxer i entendre el context
2. **DesprÃ©s de modificar**: Executar els tests relacionats
3. **Si fallen tests**: Arreglar-los ABANS de continuar amb una altra cosa
4. **Mai lliurar codi que faci fallar tests existents**
5. **Si es crea lÃ²gica nova**: Crear test corresponent al moment (no "desprÃ©s")

### Comandes de test

```bash
# Tests unitaris (rÃ pid, ~30s)
pnpm test:run

# Tests unitaris d'un servei especÃ­fic
pnpm test:run -- --run __tests__/lib/services/NOM.test.ts

# Tests unitaris amb coverage
pnpm test:run -- --coverage

# E2E tests (necessita servidor, ~3min)
npx playwright test --project=chromium

# E2E d'un fitxer especÃ­fic
npx playwright test e2e/NOM.spec.ts --project=chromium

# TypeScript check (sense executar)
npx tsc --noEmit

# Guard de capa (catalegs locals sospitosos)
pnpm run arch:layer:check

# Build complet
pnpm build
```

### QuÃ¨ executar segons el que modifiques

| Modifiques | Executa |
|---|---|
| `lib/services/*.ts` | `pnpm test:run` (tots els unit tests) |
| `lib/services/SERVEI.ts` concret | `pnpm test:run -- --run __tests__/lib/services/SERVEI.test.ts` |
| `app/admin/**` (pÃ gines/components) | `pnpm run arch:layer:check` + `npx tsc --noEmit` + `pnpm build` |
| `app/api/**` (rutes API) | `pnpm test:run` + `pnpm run arch:layer:check` + `npx tsc --noEmit` |
| `prisma/schema.prisma` | `npx prisma generate` + `pnpm test:run` + `pnpm run arch:layer:check` + `pnpm build` |
| `messages/*.json` (i18n) | `pnpm run arch:layer:check` + `pnpm build` |
| `e2e/*.spec.ts` | `npx playwright test e2e/FITXER.spec.ts --project=chromium` |
| Qualsevol canvi gran | `pnpm run arch:layer:check && npx tsc --noEmit && pnpm test:run && pnpm build` |

### Quan es crea un element nou

Quan es crea un fitxer nou de lÃ²gica de negoci (`lib/services/*.ts`, `lib/*.ts`, `app/api/**/*.ts`), **SEMPRE crear el test corresponent**:

1. **Serveis** (`lib/services/nouServei.ts`) â†’ Crear `__tests__/lib/services/nouServei.test.ts`
2. **API routes** (`app/api/admin/ruta/route.ts`) â†’ Testar via el servei que invoquen
3. **Utilitats** (`lib/utils/nova.ts`) â†’ Crear `__tests__/lib/nova.test.ts`

El test ha de cobrir com a mÃ­nim:
- Cas d'Ã¨xit (happy path)
- ValidaciÃ³ d'inputs (camps obligatoris, valors invÃ lids)
- Casos lÃ­mit (null, buit, no trobat)
- Errors esperats (404, 400, etc.)

PatrÃ³ estÃ ndard per al mock de Prisma:
```typescript
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: { model: { method: vi.fn() } },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
```

### Si un test falla

1. Llegir l'error amb atenciÃ³
2. Determinar si el test Ã©s incorrecte o el codi Ã©s incorrecte
3. Si el codi Ã©s incorrecte â†’ arreglar el codi
4. Si el test Ã©s obsolet (selectors canviats, textos actualitzats) â†’ actualitzar el test
5. Re-executar per confirmar que passa
6. MAI desactivar o eliminar tests sense raÃ³ justificada

### Estructura de tests

```
__tests__/lib/services/     â† Unit tests (Vitest, ~1784 tests, 140 fitxers)
e2e/                        â† E2E tests (Playwright, 9 specs, ~80 tests)
vitest.config.ts            â† Config Vitest amb aliases
playwright.config.ts        â† Config Playwright amb webServer
```

**Cobertura actual**: 100% serveis tenen test. Tots els `lib/services/*.ts` estan coberts.

### Patrons de test establerts

- **Mock de Prisma**: `vi.hoisted()` + `vi.mock('@/lib/prisma')` â€” veure qualsevol test existent
- **Mock de server-only**: Alias a `vitest.config.ts` â†’ `vitest.server-only-stub.ts`
- **Mock de fetch**: `globalThis.fetch = vi.fn()` amb cleanup a `afterAll`
- **Mock de File**: Spy `FormData.get()` amb objecte mock (jsdom no suporta `file.arrayBuffer()`)
- **E2E admin**: Auth amb `extraHTTPHeaders` Basic, `setupErrorFilter` per ignorar hidrataciÃ³, `addLocatorHandler` per tancar dev overlay

---

### 3. TOT ES VEU â€” Res invisible, res amagat, res trencat visualment

- **Cap element nou sense verificar que es renderitza**: Si crees un component, pÃ gina o secciÃ³, comprova que es veu al navegador (o que el build no falla).
- **Responsive obligatori**: Tot el que es toca ha de funcionar a mÃ²bil (min 375px), tablet (768px) i desktop (1280px+).
  - Taules: `overflow-x-auto` al contenidor. Columnes secundÃ ries `hidden md:table-cell`.
  - Botons: `min-h-[44px] min-w-[44px]` per touch targets mÃ²bil.
  - Textos llargs: `truncate` o `line-clamp-2` per evitar overflow.
- **Dark mode admin**: El fons Ã©s negre (`bg-[#0a0a0f]`). Tot text sobre `white/opacity`. Si un element no es veu sobre fons fosc, estÃ  malament.
- **Skeleton loading**: Cada pÃ gina admin ha de tenir el seu `loading.tsx` amb skeleton. Si en crees una de nova, crea el loading.
- **Empty states**: Si una llista pot estar buida, mostrar missatge clar ("No hi ha elements") amb icona. Mai una pÃ gina en blanc.
- **Errors visibles**: Tot `catch` ha de tenir com a mÃ­nim `console.error()`. Si Ã©s acciÃ³ d'usuari, `toast.error()`. Mai swallow silent d'errors.
- **Traduccions**: Si afegeixes text a la UI, ha d'estar als 3 fitxers: `messages/ca.json`, `messages/es.json`, `messages/en.json`. Mai text directe al JSX per la part pÃºblica. Admin pot ser catalÃ  directe.

---

### 4. TOT FUNCIONA â€” Res trencat, res a mitges

- **0 errors TypeScript**: `npx tsc --noEmit` ha de passar NET. 0 errors, 0 `any` nous (els existents es toleren, no n'afegeixis de nous).
- **Build net**: `pnpm build` sense warnings nous. Si un warning apareix pel teu canvi, arregla'l.
- **0 tests trencats**: `pnpm test:run` ha de donar el mateix resultat o millor que abans del canvi.
- **NavegaciÃ³ funcional**: Si toques una pÃ gina admin, comprova que els links/breadcrumbs no queden trencats.
- **Formularis complets**: Si crees o modifiques un formulari:
  - Tots els camps obligatoris tenen validaciÃ³ (client + servidor)
  - El submit mostra loading state i feedback (toast success/error)
  - Els selects tenen opciÃ³ per defecte o placeholder
  - `htmlFor` + `id` a cada label/input
- **API routes**: Si crees una ruta API nova:
  - ValidaciÃ³ d'inputs al principi (400 si falta algo)
  - Try/catch amb resposta d'error adequada (500, 404, etc.)
  - Auth check si Ã©s ruta admin (`requireAdmin()` o similar)
  - Testar via el servei corresponent

---

### 5. ACCESSIBILITAT â€” No Ã©s opcional

- `htmlFor` + `id` a cada parella label/input
- `aria-label` a selects sense label visible, botons amb nomÃ©s icona, taules
- `scope="col"` a tots els `<th>`
- `min={0}` a inputs numÃ¨rics de preus/quantitats
- `rel="noopener noreferrer"` amb `target="_blank"`
- `role="switch"` + `aria-checked` als toggles
- Focus ring visible: `focus:ring-1 focus:ring-cyan-500/50`
- Contrast suficient: text `white/70` mÃ­nim sobre fons fosc

---

### 6. SEGURETAT â€” Mai relaxar

- **Inputs d'usuari**: Mai inserir directament al HTML sense sanititzar. Prisma ja parametritza SQL, perÃ² compte amb `dangerouslySetInnerHTML`.
- **Auth**: Tota ruta `/api/admin/*` ha de verificar autenticaciÃ³. No hi ha excepcions.
- **Uploads**: Validar tipus MIME i extensiÃ³. Limitar mida (ja configurat).
- **Variables d'entorn**: Mai hardcodejar secrets. Tot a `.env` i referit via `process.env.X`.
- **Headers de seguretat**: Ja configurats (CSP, HSTS, X-Frame). No relaxar-los.

---

### 7. i18n â€” Tres idiomes sempre

- **PÃºblic (web)**: Tot traducciÃ³ via `t('clau')`. Si afegeixes una clau nova â†’ afegir als 3 JSON (`ca.json`, `es.json`, `en.json`).
- **Admin**: InterfÃ­cie en catalÃ  directe (no cal traduir). PerÃ² els emails als clients usen `preferredLocale`.
- **Emails**: Sempre usar `preferredLocale` del Lead/Booking/Customer. Cadena: `lead.preferredLocale || booking.preferredLocale || customer.preferredLocale || 'es'`.
- **Formats**: Dates i moneda sempre via funcions centralitzades amb `locale` param.
- **Slug de servei**: Mantenir `ServiceSlug` type. No inventar nous slugs.

---

### 8. CONSISTÃˆNCIA VISUAL â€” El design system mana

- **Colors**: Sistema `white/opacity` sobre fons negre. MAI `slate-*`, `gray-*`, ni hex custom.
- **Border radius**: `rounded-xl` estÃ ndard, `rounded-2xl` cards, `rounded-full` badges.
- **Cards**: `.admin-card-glass`, `--raised`, `--elevated`. No inventar cards noves.
- **Gradients**: `.admin-gradient.admin-gradient--hero` etc. MAI Tailwind gradient classes directes.
- **Hover taules**: `hover:bg-white/[0.03] transition-colors` a totes les `<tr>`.
- **Spacing**: Padding intern cards `p-6`, gap entre elements `gap-4` o `gap-6`, margin entre seccions `mb-8`.
- **Tipografia**: TÃ­tols `text-xl font-semibold text-white/90`, subtÃ­tols `text-sm text-white/40`, body `text-sm text-white/70`.
- **Animacions**: `.admin-stagger-item` amb `prefers-reduced-motion` respectat.

---

### RESUM RÃ€PID â€” Checklist pre-lliurament

```
â–¡ pnpm run arch:layer:check â†’ sense catalegs locals sospitosos
â–¡ npx tsc --noEmit          â†’ 0 errors
â–¡ pnpm test:run             â†’ tots passen
â–¡ pnpm build                â†’ build net
â–¡ 0 valors hardcoded        â†’ dates, moneda, anys, textos, colors
â–¡ Tests nous per codi nou   â†’ servei/util/API â†’ test
â–¡ Responsive verificat      â†’ mÃ²bil 375px, tablet, desktop
â–¡ Empty states              â†’ llistes buides mostren missatge
â–¡ Errors amb feedback       â†’ catch + console.error/toast.error
â–¡ Accessibilitat            â†’ labels, aria, focus, contrast
â–¡ i18n complet              â†’ 3 JSONs si Ã©s pÃºblic
â–¡ Seguretat                 â†’ auth, sanitize, env vars
â–¡ Visual consistent         â†’ design system, no hex custom
â–¡ loading.tsx               â†’ skeleton si pÃ gina nova
â–¡ Formularis validats       â†’ client + servidor
```

---

## Stack i infraestructura

- **Framework**: Next.js 14 (App Router), TypeScript strict
- **BD**: Prisma + PostgreSQL (Railway, connexiÃ³ directa sense pooler)
- **i18n**: next-intl (ca/es/en)
- **Tests**: Vitest (unit) + Playwright (E2E)
- **Storage**: Filesystem local `./uploads/`, servit via `/api/uploads/[...path]`
  - Funcions: `uploadFile()`, `deleteFile()`, `readFile()`, `getPublicUrl()`, `isLocalStorageUrl()`
  - Tot a `lib/storage.ts`
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) â€” lint+typecheck, tests amb coverage, build
- **CI backup**: `.github/workflows/backup.yml` â€” backup BD setmanal (dilluns 3:00 UTC)

### Hero media admin

- **Servei**: `lib/services/heroVideoService.ts` â€” CRUD sobre Setting (`config.heroMedia`, JSON)
- **API admin**: `/api/admin/hero-media` â€” GET/POST/DELETE amb `requireAuth`
- **API pÃºblica**: `/api/hero-media` â€” GET amb cache 5min, retorna nomÃ©s actius
- **Admin UI**: `app/admin/settings/hero/page.tsx` â€” upload, URL externa, toggle, reorder, delete
- **Component**: `app/components/ui/HeroElegant.tsx` â€” fetch media, shuffle, mixed video+imatge, Ken Burns, blur morph text

## Patrons de codi

### Serveis i lÃ²gica de negoci

- **Cost/marge**: Tot passa per `computeBookingFinancialSummary()` a `lib/services/costEngine.ts`. MAI calcular marges inline.
- **Cost vehicle**: `getEffectiveVehicleCostPerKm()` a `fuelReferenceService.ts`. FÃ³rmula: `(fuelPrice Ã— consumL100 / 100) + maintenanceCostPerKm`
- **Locale mapping**: `toIntlLocale(locale)` de `lib/constants` per convertir `ca`â†’`ca-ES`, `es`â†’`es-ES`, `en`â†’`en-GB`. Mai hardcodejar.
- **Dates/nÃºmeros**: Funcions centralitzades a `lib/constants/index.ts` â€” `formatDate`, `formatDateTime`, `formatCurrency`, etc. Totes accepten `locale`.
- **ServiceSlug**: `'fiestas' | 'bodas' | 'discomovil' | 'empresas'` â€” sense produccion ni alquiler
- **Pack names**: En catalÃ  clar â€” BÃ sic, Premium, Exclusiu, Complet, CÃ²ctel, EstÃ ndard, Gala
- **SemÃ for pagament**: `depositPaid && remainingPaid` = verd, `depositPaid` = groc, cap = vermell
- **Client hub**: `fetchCustomerHub()` Ã©s la font Ãºnica per a tota la fitxa client

### Emails

- **preferredLocale**: Existeix a Customer, Lead i Booking. SEMPRE usar-lo per emails al client.
- **Cadena locale**: `lead.preferredLocale || booking.preferredLocale || customer.preferredLocale || 'es'`
- **Translate API**: `/api/admin/translate` â€” POST `{ texts: string[], targetLanguages: ['es','en'] }`. DeepL primer, Google Translate fallback.
- **Signatura**: `getEmailSignatureHtml()` i `getEmailSignatureText()` de `lib/email.ts`

### UX i components

- **DiÃ legs**: Mai `alert()` ni `window.confirm()`. Usar `useConfirmDialog()` hook o inline errors amb `setError()`.
- **ConfirmDialog**: `const { confirm, dialogProps } = useConfirmDialog()`. `confirm(opts)` retorna `Promise<boolean>`. Variants: danger/warning/info.
- **Kanban**: Drag & drop HTML5 + optimistic updates + toast + botons mÃ²bil. Ref: `TaskKanbanView`, `LeadPipelineView`, `BookingPipelineView`
- **View toggle**: searchParam `view=kanban|list` per canviar vista.
- **Overflow menu**: `<details><summary>` natiu HTML per accions secundÃ ries.
- **Toggle switch**: CSS-only amb `role="switch"` + `aria-checked` + `translate-x`.
- **WhatsApp**: `getWhatsAppUrl(messageType, customData)` de `config/site-config.ts`
- **BookingSectionNav**: IntersectionObserver per 10 seccions amb scroll-to smooth. Sticky.

### Visual / CSS

#### Principi MONOCAPA visual (CRÃTIC â€” llegir abans de tocar CSS)

**Cada efecte visual ha de viure a UN SOL LLOC. Mai duplicar entre inline i classe CSS, entre component i globals, o entre dos components.**

Abans de tocar qualsevol estil:
1. Comprovar si l'element JA tÃ© l'efecte per una altra via (classe global, inline, herÃ¨ncia, pseudo-element)
2. Si existeix â†’ usar-lo, no crear-ne un de nou
3. Si no existeix â†’ crear-lo al lloc correcte (globals.css per compartit, inline per exclusiu d'un component)
4. **MAI** aplicar el mateix efecte per dues vies alhora (ex: grid pattern via classe CSS + grid pattern inline = DOBLE = error)

**VerificaciÃ³ obligatÃ²ria**: DesprÃ©s de cada canvi visual, fer captura amb Playwright i comparar amb l'estat anterior. No dir "fet" sense veure-ho.

#### QuadrÃ­cula de fons (grid pattern)

- **Classe**: `oe-grid-pattern` â€” definida a `globals.css`, `::before` amb quadrÃ­cula 60px Ã— 60px, blanc, `isolation: isolate` + `z-index: -1`.
- **Opacitat**: `0.06` â€” visible perÃ² no competeix amb el contingut. **NO TOCAR**.
- **On s'aplica**: TOTES les seccions pÃºbliques amb fons fosc (footer, stats, CTA, FAQ, garantia, blog, packs, opiniones, servicios).
- **On NO s'aplica**: Heroes amb imatge, admin.
- **Modificador `--radial`**: `oe-grid-pattern--radial` afegeix mask radial amb desapariciÃ³. Usat al footer. **NO TOCAR**.
- **Cards sobre grid**: Si una secciÃ³ tÃ© cards, el container de contingut ha de portar `relative z-[1]` i les cards fons opac (no semi-transparent). ReferÃ¨ncia: FAQSection.tsx.
- **Regla MONOCAPA**: Si una secciÃ³ tÃ© `oe-grid-pattern`, **NO pot tenir** cap grid inline propi. Una sola font, sempre.
- **Admin**: NO porta quadrÃ­cula. Mai.

#### Paleta pÃºblica (site pÃºblic)

- **Fons**: Negre (`#0A0A0A`, `zinc-950`, `black`). Totes les seccions pÃºbliques.
- **Text**: `text-white` per tÃ­tols, `text-white/70` per body, `text-white/40-60` per secundari.
- **Accent Ãºnic**: Ambre (`amber-400`, `amber-500`, `orange-400`). Per a CTAs, highlights, badges, stats.
- **MAI**: Porpra, cyan, rosa, verd o qualsevol altre color com a accent principal en seccions genÃ¨riques. Aquests colors NOMÃ‰S per a pÃ gines temÃ tiques especÃ­fiques (Halloween = taronja/vermell, MÃ³n MÃ gic = porpra, etc.).
- **Glows decoratius**: Molt subtils (`/5` opacitat mÃ xima), blur gran (`blur-3xl`). No han de competir amb el contingut.
- **Border**: `border-white/10` estÃ ndard. `border-white/20` al hover. Mai borders de color.

#### Stats (component unificat)

- **Un sol component**: `StatsSection` (`app/components/marketing/StatsSection.tsx`).
- **Disseny**: Xifres ambre sobre negre, separadors verticals (`divide-x divide-white/10`), glow central subtil. Sense targetes colorides, sense emojis, sense gradients multicolor.
- **Dades**: Via API `/api/public/stats`. Defaults raonables si l'API falla.
- **On s'usa**: Home desktop (`page.tsx`), home mobile (`MobileHomePage`). Enlloc mÃ©s.
- **MAI**: Crear variants de stats a altres llocs (footer, opinions, etc.). Si es vol mostrar un nÃºmero, usar el component existent.

#### Arquitectura CSS admin (IMPORTANT â€” no repetir errors)

- **Layout admin**: `app/admin/layout.tsx` retorna `<>Fragment</>` amb `<div className="admin-layout-shell">` â€” **MAI** renderitzar `<html>` ni `<body>` (el root layout ja ho fa)
- **Fitxers CSS admin**: 3 fitxers carregats a `admin/layout.tsx`:
  - `globals.css` â€” estructura (sidebar, headers, nav) + tokens extra (`--at-gold`, `--at-blue`, etc.)
  - `admin-theme.css` â€” tokens base (`--at-bg/surface/panel/border`), glass, pipeline colors, booking stats, leads metrics, semantic tones, UX polish
  - `control-room.css` â€” dashboard especÃ­fic amb tokens `--at-cr-*`
- **Classe `admin-mode`**: S'afegeix a `document.documentElement` via useEffect. Tots els CSS admin requereixen `html.admin-mode` com a prefix.
- **Cascada**: admin-theme.css NO pot competir amb globals.css a mateixa especificitat â€” Next.js no garanteix ordre de chunks. Si una propietat visual (background, border) es defineix a globals.css, canviar-la allÃ  directament, no intentar override des d'admin-theme.css.
- **Tailwind dins admin**: `.border` hereta `var(--at-border)`, `bg-white/5` â†’ `var(--at-raised)` automÃ ticament via globals.css

#### Paleta admin (tokens a admin-theme.css)

- `--at-bg: #0f1218` â†’ `--at-surface: #1a1f2b` â†’ `--at-panel: #222938` â†’ `--at-raised: #2d3548`
- `--at-border: #3a4560`, `--at-border-strong: #506080`
- Glass: `--at-glass-bg: rgba(22,28,40,0.85)`, `--at-glass-border: rgba(255,255,255,0.12)`
- Cada capa ha de tenir **mÃ­nim 20 unitats** de diferÃ¨ncia amb l'anterior

#### Classes i patrons

- **Glass cards**: `.admin-card-glass` â€” backdrop-blur, semi-transparent, shadow, hover
- **Focus**: `focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50` a tots els inputs admin
- **Border radius**: `rounded-xl` estÃ ndard, `rounded-2xl` cards/seccions, `rounded-full` badges
- **Table hover**: `hover:bg-white/[0.03] transition-colors` a totes les `<tr>`
- **Gradients admin**: MAI Tailwind gradient classes directes. Usar classes `.admin-gradient--*`
- **Metric glow**: Hover glow per accent color via CSS classes
- **Stagger animation**: `.admin-stagger-item` amb nth-child delay. `prefers-reduced-motion` el desactiva.
- **Components SVG**: `RadialProgress`, `Tooltip`, `MonthlyBarChart`, `DonutChart` â€” tots reutilitzables
- **Leads metrics**: `.admin-leads-metric--open/won/lost/winrate` amb colors semÃ ntics

### Accessibilitat (OBLIGATORI en tot codi nou)

- **Formularis**: Sempre `htmlFor`+`id` a cada label/input
- **Selects sense label**: Sempre `aria-label`
- **Taules**: `aria-label` descriptiu a `<table>`, `scope="col"` a `<th>`
- **NÃºmeros**: `min={0}` a inputs de preus, quantitats, valors monetaris
- **Links externs**: Sempre `rel="noopener noreferrer"` amb `target="_blank"`
- **Catch blocks**: Sempre `console.error` com a mÃ­nim, `toast.error()` si Ã©s acciÃ³ d'usuari
- **Dates**: MAI hardcodejar anys. Usar `new Date().getFullYear()` o `{year}` a traduccions

### Calendari

- **Vista diÃ ria**: `?view=day` â€” CalendarDayClient amb timeline per hores
- **Toggle**: Botons Mes/Setmana/Dia a les vistes
- **CelÂ·les compactes**: `h-[72px] sm:h-[80px] md:h-[88px]` â€” dissenyat per cabre en una pantalla sense scroll
- **KPIs**: amb color semÃ ntic (emerald reserves, rosa bloquejos, cyan lliures, ambre mixtes)

### Delete (patrÃ³ estÃ ndard)

- **ConfirmDialog**: SEMPRE usar `useConfirmDialog()` per a deletes. Mai `window.confirm()`, mai doble-clic.
  ```tsx
  const { confirm, dialogProps } = useConfirmDialog();
  const ok = await confirm({ title, message, variant: 'danger', confirmLabel: 'Eliminar' });
  // + <ConfirmDialog {...dialogProps} /> al JSX
  ```
- **Leads**: Requereix estat LOST abans d'eliminar. Backend valida a `leadRouteService.ts`
- **Bookings**: NomÃ©s PENDING o CANCELLED. Backend valida a `bookingRouteService.ts`
- **Clients**: Smart GDPR â€” si tÃ© reserves/pressupostos â†’ anonimitza. Si no â†’ elimina. Servei: `customerRouteService.ts`

### Lead lifecycle

- **Estats oberts**: NEW â†’ CONTACTED â†’ QUOTE_SENT â†’ NEGOTIATING â†’ WON/LOST
- **Auto-LOST**: Cron `lead-cleanup` marca leads amb eventDate passat com LOST
- **Auto-DELETE**: Cron `lead-cleanup` elimina LOST >90 dies sense booking (cascade: notes, activities, tasks, documents)
- **Cron endpoint**: `/api/cron/lead-cleanup` â€” Bearer auth amb CRON_SECRET
- **DNI**: Camp `dni` al model Lead. Auto-uppercase. Cercable a pipeline

### Google Reviews (dashboard)

- **Cache**: `settings` table amb claus `stats.googleRating`, `stats.googleReviewCount`, `cache.googleReviews`
- **Dashboard**: Mostra rating i count de Google (no de CustomerTestimonial interna)
- **Sync**: Via SerpAPI o Google Business OAuth. Manual a `/admin/google-reviews` ("Refrescar ressenyes")
- **Servei**: `googleReviewsCacheService.ts` â€” `readGoogleReviewsCache()`, `writeGoogleReviewsCache()`

### Weather Widget

- **Servei**: `lib/services/weatherService.ts` â€” OpenWeatherMap free tier, 5-day forecast
- **Cache**: 1h en memÃ²ria
- **Activar**: Cal `OPENWEATHERMAP_API_KEY` a env vars. Sense key, widget no es mostra (graceful fallback)
- **Mostra**: Previsions per reserves CONFIRMED/PREPARING en els prÃ²xims 3 dies

### Filtres

- **Server-side**: searchParams a page.tsx â†’ Prisma where clause
- **Client-side**: FilterChips locals dins el component (no recarrega pÃ gina). Ref: LeadPipelineView.

## QuÃ¨ JA EXISTEIX â€” NO tornar a crear, auditar NI MODIFICAR

Abans de proposar crear, auditar o **modificar** qualsevol d'aixÃ², **consulta primer**. Ja estÃ  fet, aprovat i tancat:

### UX / Copy / ConversiÃ³ (tancat 2026-03-25 â€” NO TOCAR)
- **Hero CTAs**: Primari "Veure packs i preus" â†’ /packs, Secundari "Munta el teu event" â†’ /configurador. Mobile: WhatsApp primari, packs secundari.
- **Hero subtitle**: "DJ, ilÂ·luminaciÃ³ i tematitzaciÃ³ per a festes que la gent recorda" (3 idiomes)
- **Meta SEO homepage**: Rangs reals ("Festes 250â€“700â‚¬ Â· Bodes 350â€“1.000â‚¬") als 3 idiomes
- **Process section**: "De la idea a la festa Â· 3 passos Â· 0 maldecaps" â€” copy natural (3 idiomes)
- **Portfolio stories**: Copy natural per categoria ("Festes amb discomÃ²bil", "Halloween com toca", etc.) â€” 3 idiomes
- **Portfolio event CTA**: Primari preus, secundari configurador
- **Features serveis preus**: Rangs reals (250â€“700â‚¬, 350â€“700â‚¬)
- **Social proof hero**: 5â˜…, 50+ events, "NomÃ©s 1 event per dia"

### Visual / CSS (tancat sessions 11-12 + packs v2 2026-03-26 â€” NO TOCAR)
- Paleta admin amb contrast 30+ unitats entre capes, sidebar glass, !important cleanup, control-room.css
- Film grain (`.oe-film-grain`), vignette (`.oe-vignette`), grid pattern (`.oe-grid-pattern`) a 35+ seccions
- Calendari 72-88px amb KPIs color semÃ ntic
- PartÃ­cules hero 36, pseudo-random, translÃºcides
- Heroes amb imatge a 3 pÃ gines de serveis
- Footer trust signals amb color semÃ ntic + legal links posiciÃ³
- Admin timeout 15s a 10 pÃ gines amb spinner+reintentar
- Hex hardcoded netejats â†’ Tailwind/tokens (FloatingCTAs, ExitIntentModal, CTAFinal, ProcessSection, GarantiaSection, HeroElegant)
- **Pack cards visual v2**: hover glow (amber/10 popular, white/5 normal), hover bg transition, group class, duration-300
- **Badge popular**: shadow-md shadow-amber-500/30 a tots els badges "MÃ©s popular"
- **Badge no-popular**: text-white/80, border-white/15, backdrop-blur-sm (no gris mort)
- **Preu popular ambre**: text-amber-400 al preu del pack popular a /packs
- **Separador preu/specs**: border-b border-white/10 consistent (no /5 ni /[0.06])
- **Checks circulars**: w-5 h-5 rounded-full bg-amber-500/10 amb check w-3 h-3 dins â€” a TOTES les pÃ gines (packs, bodas, empresas, discomovil, fiestas)
- **"Tots els packs inclouen"**: icones w-12 h-12 amb border-amber-500/20, text-white/80 font-medium

### Components pÃºblics (consolidats â€” NO TOCAR)
- **HeroElegant**: Carrousel media + Ken Burns + stagger words + CTAs + social proof + partÃ­cules + cursor glow
- **MobileHeroUltimate**: Carrousel + WhatsApp CTA + packs CTA + morphing texts
- **MobileHomePage**: App shell + intro + hero + serveis + stats + process + portfolio + FAQ + CTA + guarantees
- **ProcessSection**: 3 steps amb gradient glow boxes + connector line + CTAs WhatsApp/configurador
- **MobileProcessSection**: VersiÃ³ mÃ²bil, mateixes claus i18n
- **StatsSection**: Component Ãºnic, xifres ambre, separadors, glow central â€” s'usa NOMÃ‰S a home desktop i mÃ²bil
- **PortfolioShowcase**: Scroll horitzontal infinit, 6 story cards amb crossfade
- **GarantiaSection**: 4 garanties amb icones
- **CTAFinal**: CTA final amb film grain
- **FAQSection**: AcordiÃ³ amb schema.org
- **GoogleReviewsRotating**: Reviews de Google amb rotaciÃ³
- **TrustedByLogos**: Logos de clients
- **CalendarioUrgencia**: UrgÃ¨ncia amb calendari real
- **ServicesGridElegant**: Grid de serveis amb hover
- **FloatingCTAs**: WhatsApp + configurador flotants
- **ExitIntentModal**: Modal sortida amb oferta
- **GalleryPro/SimpleGallery**: Mosaic HEROâ†’3-gridâ†’HEROâ†’2-grid + lightbox

### PÃ gines pÃºbliques (consolidades â€” NO TOCAR estructura/copy)
- **Homepage** (`app/[locale]/page.tsx`): 11 seccions en ordre fix (heroâ†’serveisâ†’statsâ†’urgÃ¨nciaâ†’portfolioâ†’processâ†’reviewsâ†’logosâ†’garantiaâ†’FAQâ†’CTA) â€” VERIFICAT VISUALMENT 2026-03-26, TOT OK
- **Packs** (`app/[locale]/packs/`): 3 tabs (festes/bodas/empresas), cards amb preus, features, ideal per, checks circulars, hover glow, badge shadow
- **Packs a serveis**: bodas/discomovil/fiestas/empresas â€” mateixos patrons visuals que /packs (checks circulars, hover glow, badge shadow)
- **Portfolio index** (`app/[locale]/portfolio/page.tsx`): Grid categories amb hero cards cinemÃ tics
- **Portfolio categoria** (`app/[locale]/portfolio/[slug]/page.tsx`): Hero + events destacats + galeria mosaic + JSON-LD ImageGallery
- **Portfolio event** (`app/[locale]/portfolio/[slug]/[eventSlug]/page.tsx`): Hero cinemÃ tic + detalls + galeria + CTA dual (preus+configurador)
- **Serveis** (`app/[locale]/servicios/`): Heroes amb foto, FAQ, breadcrumbs
- **Contacte, Blog, Opinions, About, Legal, Zones, Configurador**: Totes amb metadata, i18n, breadcrumbs

### Admin â€” sistemes consolidats (NO TOCAR)
- **Layout**: Fragment + admin-layout-shell, admin-mode class, 3 CSS files
- **Sidebar glass**: A globals.css directament
- **Kanban**: Drag & drop HTML5 + optimistic + toast + mÃ²bil (Tasks, Leads, Bookings)
- **BookingSectionNav**: IntersectionObserver 10 seccions, sticky
- **ConfirmDialog**: Hook + component, variants danger/warning/info
- **Error handling**: Timeout 15s, toasts explÃ­cits, zero catches muts
- **Lead pipeline**: Estats, auto-LOST cron, auto-DELETE >90d, DNI, cercable
- **Google Reviews cache**: Settings table, SerpAPI/Google OAuth, dashboard
- **Weather widget**: OpenWeatherMap, 1h cache, graceful fallback
- **Calendari**: Mes/Setmana/Dia, KPIs color, bloqueig/desbloqueig amb toast
- **Inbox/Compose**: Email + pressupost amb error explÃ­cit
- **Client portal**: AccÃ©s amb link, cÃ²pia amb warning
- **Booking inventory**: AssignaciÃ³, lot, pack, checkout/checkin amb errors explÃ­cits
- **Clientes modals**: Duplicats check, GDPR smart delete/anonimitza
- **Settings/Canvas/Checklist**: Tots amb error handling explÃ­cit

### SEO (complet â€” NO TOCAR)
- **`app/sitemap.ts`** (160 lÃ­nies) â€” DinÃ mic: pÃ gines estÃ tiques, zones, blog, portfolio, i18n (ca/es/en), prioritats estratÃ¨giques
- **`app/robots.ts`** (48 lÃ­nies) â€” Regles per Googlebot, Googlebot-Image, Twitterbot. Disallow: /api/, /admin/, /_next/
- **`public/robots.txt`** â€” Fallback estÃ tic
- **JSON-LD** a `app/[locale]/layout.tsx` â€” LocalBusiness complet (geo, horaris, OfferCatalog amb preus, areaServed 13 ciutats, ReserveAction, CommunicateAction)
- **Open Graph + Twitter Cards** â€” Root layout + 31 `generateMetadata` a pÃ gines
- **Canonical URLs + hreflang** â€” Alternates ca-ES/es-ES/en-GB/x-default
- **Breadcrumbs** component amb schema.org
- **FAQ** component amb schema.org

### Performance (complet â€” NO TOCAR)
- **53 `loading.tsx`** amb skeletons (48 admin + 5 pÃºblic)
- **8 `dynamic()` imports** amb SSR i fallback skeletons
- **`next/image`** a 25 components (nomÃ©s 2 `<img>` raw a admin)
- **Cache headers** a `next.config.mjs`: 1 any immutable assets, no-store APIs, ISR 1h blog
- **Security headers**: CSP, HSTS 1 any preload, X-Frame-Options DENY, CORS
- **Image formats**: webp + avif habilitats a next.config
- **SWC minify** + source maps desactivats en producciÃ³

### Testing (complet â€” NO TOCAR)
- **1784 unit tests** (140 fitxers) â€” 100% serveis coberts
- **9 E2E specs** (~80 tests) â€” admin, pÃºblic, APIs, SEO, contacte, serveis
- **CI** amb coverage report i artifact upload

### Infraestructura (complet â€” NO TOCAR)
- **CI**: `.github/workflows/ci.yml` â€” lint+tsc, tests+coverage, build
- **Backup BD**: `.github/workflows/backup.yml` â€” setmanal, artifact 90 dies
- **PWA admin**: Manifest + service worker
- **Sentry**: Integrat a next.config.mjs
- **Analytics**: GA4 amb WebVitalsReporter, ConsentScripts
- **Crons**: `lead-cleanup` (auto-LOST + auto-DELETE), emails automation, reviews sync â€” tots amb Bearer auth CRON_SECRET

### UX click-to-center (tancat 2026-03-26 â€” NO TOCAR)
- **PatrÃ³**: Primer click centra la card al viewport + border ambre + ring, segon click navega
- **On s'aplica**: `/servicios` (ServiciosClient), `ServicesGridElegant` (home desktop), `MobileServicesCards` (home mobile)
- **ImplementaciÃ³**: `focusedCard` state + `scrollIntoView({ behavior: 'smooth', block: 'center' })` + ring-1 ring-amber-500/20

### TemÃ tiques â€” pÃ gines pÃºbliques (tancat 2026-03-26 â€” NO TOCAR)
- **MÃ³n MÃ gic** (`app/[locale]/tematica-mon-magic/client.tsx`): Hero fullscreen amb enquadrament des de baix, vel cÃ lid i pedestal subtil per al copy; principal visual fixada a la foto `16`; galeria pÃºblica tancada amb `02`, `10`, `13`, `14` i una miniatura menys perquÃ¨ no en sobri cap; to aprovat: banquet mÃ gic viu, fantasia elegant i cÃ lida, mai gÃ²tic pesat ni cripta.
- **Halloween** (`app/[locale]/tematica-halloween/page.tsx`): Tim Burton style â€” hero cinemÃ tic 85vh amb vignetting, gradient orange/red, separadors gÃ²tics, pack cards amb emojis temÃ tics, galeria amb vignette overlay, testimonial gÃ²tic, fons radials
- **HalloweenAtmosphere** (`app/components/ui/HalloweenAtmosphere.tsx`): FloatingBats (8 ratpenats), SpookyParticles (25 partÃ­cules), FogLayer â€” tot amb `prefers-reduced-motion`

### Packs copy i empresas (tancat 2026-03-26 â€” NO TOCAR)
- **Features copy natural**: `packs-config.ts` reescrit â€” to comercial en lloc de llista tÃ¨cnica
- **Empresas packs secciÃ³**: SecciÃ³ dinÃ mica a `/servicios/empresas` amb `usePacks({ service: 'empresas' })`
- **GuestRecommender**: Algorisme millorat â€” selecciona per punt mig de capacitat, no popular per defecte

### ConfiguraciÃ³ i constants (consolidat â€” NO TOCAR)
- `config/packs-config.ts`: Packs amb preus, features, duraciÃ³, capacitat (font de veritat preus)
- `config/site-config.ts`: Business info, URLs, social, WhatsApp
- `config/portfolio-images.ts`: Fotos portfolio per categoria
- `config/client-logos.ts`: Logos clients
- `config/equipment-config.ts`: Inventari equipament
- `lib/constants/index.ts` (~1800L): Constants compartides (formats, opcions, catÃ legs, process styles, portfolio items)
- `lib/constants/privacy.ts`: Constants RGPD

### Serveis de negoci (consolidats â€” NO TOCAR lÃ²gica)
- `costEngine.ts`: `computeBookingFinancialSummary()` â€” font Ãºnica per marges
- `fuelReferenceService.ts`: `getEffectiveVehicleCostPerKm()`
- `leadRouteService.ts`: ValidaciÃ³ delete (requereix LOST)
- `bookingRouteService.ts`: ValidaciÃ³ delete (PENDING/CANCELLED)
- `customerRouteService.ts`: Smart GDPR delete/anonimitza
- `heroVideoService.ts`: CRUD hero media
- `galleryService.ts` + `portfolioMediaService.ts` + `portfolioEventService.ts`: Portfolio backend
- `googleReviewsCacheService.ts`: Cache Google Reviews
- `weatherService.ts`: OpenWeatherMap amb cache 1h

### i18n (estructura consolidada â€” NO TOCAR estructura)
- 3 fitxers: `messages/ca.json`, `messages/es.json`, `messages/en.json` (~6800L cadascun)
- Admin: catalÃ  directe, no cal traduir
- Emails: `preferredLocale` sempre
- Formats: funcions centralitzades amb `locale` param

## Monocapa admin

### Regla de capa obligatoria

- El repo no pot tornar a crÃ©ixer amb catÃ legs, presets, copy estructural o metadada declarativa dins de components, pÃ gines o serveis si aquesta decisiÃ³ pot viure a la capa comuna.
- Aquesta regla no aplica nomÃ©s a l'admin: tambÃ© aplica a pÃ gines pÃºbliques, rutes API i serveis de domini.
- Si una dada Ã©s estable, declarativa i governa render, flux o comportament, ha d'anar a `lib/constants/*` o a un helper compartit pur.

### QuÃ¨ s'ha de deixar al component

- Estat React, handlers, wiring de render, refs, efectes i composiciÃ³ visual local.
- Wiring d'icones o components React quan nomÃ©s resolen una metadada compartida en un component concret.
- LÃ²gica estrictament local de presentaciÃ³ que no representi una decisiÃ³ reutilitzable de producte o domini.

### QuÃ¨ ha d'anar obligatoriament a la capa comuna

- Arrays i objects de `options`, `items`, `cards`, `stats`, `steps`, `faq`, `features`, `packs`, `products`, `badges`, `thresholds`, `copy`, `defaults`, `messages`, `mime types`, `limits`, `status labels`, `source labels`, `section order`, `nav meta` i qualsevol catÃ leg equivalent.
- Dades declaratives de pÃ gina encara que nomÃ©s surtin en una sola pÃ gina, si sÃ³n estables i separables del JSX: galeries, cards, packs, FAQs, presets visuals, configuracions de calculadora, preus base, etc.
- Qualsevol helper local que nomÃ©s reempaqueti una decisiÃ³ compartida o derivi opcions des d'un catÃ leg que ja existeix.

### Anti-patrons prohibits

- Declarar `const SOMETHING = [...]` o `const SOMETHING = { ... }` dins d'una pÃ gina o servei per dades estables de producte, copy o configuraciÃ³.
- Fer `Object.keys(...)`, `Object.values(...)`, `new Set(...)` o `Record<string, string>` locals per reconstruir una decisiÃ³ que la capa comuna ja coneix.
- Duplicar la mateixa semÃ ntica en forma de labels, emojis, gradients, ordres, FAQs, packs o presets a dos fitxers diferents.
- Donar per bo un component perquÃ¨ "nomÃ©s Ã©s d'aquesta pÃ gina" si el que contÃ© Ã©s metadada declarativa i no wiring.

### Protocol abans d'afegir cap dada local nova

- Buscar primer a `lib/constants/*`, `lib/*` i a `docs/diario.md` si la decisiÃ³ ja existeix.
- Si la dada Ã©s estable i separable del JSX, crear-la o ampliar-la a la capa comuna abans de renderitzar-la.
- Si hi ha dubte entre deixar-la local o no, el criteri per defecte Ã©s moure-la a constants compartides.

- Si una opciÃ³, label, ordre, badge o estat apareix a mÃ©s d'un component admin, s'ha de moure a lib/constants/index.ts o lib/constants/privacy.ts.
- Els components d'admin han de consumir la capa comuna; no han de recrear arrays locals de STATUS_OPTIONS, SOURCE_OPTIONS, EVENT_TYPES, SECTIONS, STATUS_ORDER o maps equivalents si la dada ja Ã©s compartida.
- Quan es faci una passada d'un bloc d'admin, deixar tambÃ© entrada breu i neta a docs/diario.md amb el criteri i la validaciÃ³ executada.
- La regla de monocapa admin tambÃ© aplica a domini compartit: locales suportats, status values, open statuses, catÃ legs de categories, ordres de serveis i filtres repetits. Si admin i serveis comparteixen aquesta decisiÃ³, s'ha de treure a constants comunes.

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




