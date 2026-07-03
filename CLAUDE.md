# Òrbita Events — Protocol de Treball

## Propòsit

Aquest fitxer és la constitució del repo. Conté normes estables de treball, patrons de codi i la llista de zones protegides.

### 📍 Ordre de lectura canònic (per a qualsevol que entri, humà o IA)

El projecte té UNA jerarquia de lectura, no 39 documents solts. Es llegeix en aquest ordre:

1. **`docs/DIAGNOSTIC-I-FULL-DE-RUTA.md`** ← **LLEGEIX-HO PRIMER.** L'auditoria d'Opus de
   l'organisme: què és, la mida real, el diagnòstic honest i el full de ruta en 5 fases.
   Conté el **mapa de documents** (què és viu vs vell). És la «llicència per operar».
2. **Aquest `CLAUDE.md`** ← la LLEI: normes innegociables, patrons, zones protegides.
3. **`docs/admin-protocol.md`** ← el MANUAL OPERATIU del dia a dia (§6 backlog, §9 història).

La resta de `docs/**` són **referència** (es consulten quan toca) o **arxiu** (feina ja
tancada). El mapa complet, classificat viu/vell, viu al §8 del DIAGNÒSTIC.

Per estat funcional i peces consolidades:
- `docs/protocol-executiu.md` → resum operatiu curt (qui decideix què, com s'auditen òrgans i què vol dir fet)
- `docs/estat-admin.md` → dossier viu de l'admin
- `docs/admin-diary.md` → registre cronològic del que s'ha fet i amb quina validació

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

## Norma de tot canvi (resum — el detall ja viu a les seccions corresponents)

Cada canvi, per petit que sigui, ha de complir TOT això abans de considerar-se fet (no es repeteixen aquí les regles; es citen on viuen):

1. **Documentat** → vegeu `## Documentació obligatòria` + `### Canvi #N` al protocol + `ADMIN_CHANGE_COUNTER`.
2. **Reflectit al web/admin** → el canvi ha de quedar **visible i operatiu a la interfície real**, no només al codi. Una funció importada però no renderitzada, o que no s'usa, NO compta com a feta.
3. **0 hardcoded** → vegeu `## Hardcode i monocapa` (inviolable).
4. **Responsiu + i18n + a11y** → vegeu `## Checklist pre-lliurament` i `## i18n`.

## Protocol d'autonomia

- Treballar en mode completament autònom: no demanar confirmació, no demanar "segueix?", no esperar input.
- Acabar un canvi complet (servei + pàgina + missatges + tests + diario + counter), validar, i passar automàticament al proper ítem del backlog.
- Continuar fins que tots els ítems pendents del backlog (§6 del protocol de producte) estiguin tancats.
- Després d'un tall verd, no enviar resposta final si encara queda un `SEGÜENT`, `PENDENT CRÍTIC` o backlog accionable. La resposta final només toca quan no queda feina executable, hi ha bloqueig real o l'usuari demana explícitament parar/reportar.
- Amb `go` actiu, la resposta final queda prohibida després d'un tall verd mentre hi hagi backlog accionable. El pas immediat després de `validate:core` verd és rellegir §6, triar el següent `SEGÜENT` / `PENDENT CRÍTIC` executable i continuar automàticament amb una actualització curta, no tancar la conversa.
- Aquesta regla també viu en format executable a `docs/agent-runtime-policy.json`: `repository=orbitaevents`, `defaultWorkspacePath=D:\orbitaevents`, `mode=nonstop_until_end`. El guard `pnpm run qa:nonstop-protocol` ha de fallar si el JSON, aquest fitxer o el protocol deixen d'estar alineats.
- No interrompre el treball per preguntes que es poden resoldre llegint el protocol, el diari o el codi.
- Reportar l'estat final quan no quedi cap ítem pendent, no en cada canvi.
- **Pressupost/tokens (ordre del propietari 2026-06-08)**: treballar a tope SENSE preguntar ni avisar mai pel pressupost o els tokens. Prohibit oferir parar per estalviar tokens o condicionar la feina al pressupost. Si s'esgoten els tokens és problema del propietari. Acció directa sempre. Veure `budgetPolicy` a `docs/agent-runtime-policy.json`.

## Flux obligatori abans de tocar res

1. Llegir `CLAUDE.md`.
2. Llegir `docs/agent-sync.md` — llegir el bloc de l'altre agent i actualitzar el propi amb estat `treballant` i el proper canvi previst.
3. Llegir `docs/admin-diary.md`.
4. Si la tasca és d'admin o toca una zona ja consolidada, llegir `docs/estat-admin.md`.
5. Si la tasca és d'admin o toca una zona consolidada, llegir també `docs/admin-protocol.md`, el tram rellevant del `§6` i el final del `§9` abans de començar.
6. Si la tasca és d'admin, llegir `docs/protocol-executiu.md` com a resum operatiu abans de decidir el tall.
7. Si existeix una guia específica de la iniciativa, usar-la només com a context del tall concret.

**Cap IA ni agent (Claude, Codex o qualsevol altre) pot començar feina real al repo sense haver fet aquesta lectura mínima.** No és opcional ni es pot saltar "perquè el canvi és petit". Una IA que comenci a editar sense haver llegit i confirmat aquest flux està incomplint el protocol i la seva passada s'ha de revertir.

- **Senyal d'arrencada obligatori**: la primera acció de qualsevol sessió és declarar que s'ha llegit `CLAUDE.md` + `docs/agent-sync.md` + `docs/admin-diary.md` (i, si toca admin, `estat-admin.md` + `admin-protocol.md`), i actualitzar el bloc propi a `docs/agent-sync.md` a `treballant`.
- **Reforç automàtic (Claude Code)**: el hook `SessionStart` (`scripts/hooks/session-start.mjs`) injecta a cada sessió l'estat viu del protocol (counter + blocs d'agent-sync + recordatori del flux). Connexió via `node scripts/hooks/install-hooks.mjs`.
- **Altres eines (Codex, etc.)**: han de llegir aquest fitxer igualment; si l'eina suporta un fitxer d'arrencada propi (p. ex. `AGENTS.md`), ha d'apuntar aquí.

## Regles operatives

- No fer canvis no demanats.
- No duplicar regles, catàlegs o mappings locals si ja existeixen a la capa comuna.
- No hardcodejar dades estables al JSX o dins serveis si poden anar a constants, traduccions o CSS compartit.
- No tocar lògica de negoci, SEO, infra o components consolidats sense una raó explícita.
- No prometre verificacions que no s'han executat.
- Si una passada queda incompleta, s'ha d'explicar netament al `docs/admin-diary.md`.
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
- Sí → `app/globals.css`, `app/admin/admin-theme.css`, `app/admin/admin-shell.css`
- No → continuar

### 4. És wiring o presentació exclusivament local del component?
Exemples: estat React, refs, handlers, càlcul temporal de UI, composició local.
- Sí → dins del component
- No → si és reusable, extreure a helper o constant compartida

### 5. És un valor visual puntual i funcional que depèn del runtime?
Exemples: coordenades calculades, amplades dinàmiques, transform puntual.
- Sí → inline és acceptable
- No → ha d'anar a la capa comuna adequada

## Un sol cervell, moltes pàgines (norma vinculant, propietari 2026-07-02)

**Principi constitucional del repo.** Tota lògica de domini —sobretot els diners (transport, cost, marge, pasta, repartiment, tresoreria)— viu en UN sol **cervell** i les **pàgines només hi criden**.

- **Cervell = capa de serveis** (`lib/services/*`): funcions pures, font ÚNICA de veritat de cada càlcul. El cervell és **sagrat**: la seva responsabilitat no es duplica ni es reparteix.
- **Pàgines/vistes = crides** (`app/**`): poden crear-se, modificar-se o eliminar-se lliurement, però **NO calculen res de domini**. Demanen el número al cervell i el mostren.
- **Un càlcul = una funció.** Si el mateix número (un càrrec, un marge, un headcount, una pasta) es calcula a més d'una pàgina, és un BUG d'arquitectura que s'ha de consolidar. La regla de tres del propietari: *«un sol cervell, moltes pàgines»*.
- **Els diners són el domini d'Economia.** Tot el que és pasta viu al cervell econòmic (`costEngine`, `travelLaborCost`, `repartimentService`, `collaboratorPayoutService`…); `/admin/economia` n'és la vista-hub, però lead, reserva, portal i PDFs també hi **criden** — mai reinventen el càlcul.
- **Cervells de diners consolidats (font única — no en facis de paral·lels):**
  - Transport al client i cost de ruta → `computeBoloTransport` (`lib/services/travelLaborCost.ts`). El marge del transport es decideix a UNA constant (`CLIENT_TRAVEL_MARGIN`). Headcount → `deriveTravelHeadcount`. Prohibit `calculateTravelCharge` (fórmula de trams, retirada).
  - Marge/cost del bolo → `computeBookingFinancialSummary` (`costEngine.ts`).
  - Qui cobra què → `computeBoloRepartiment` (`repartimentService.ts`).
  - Pasta d'un col·laborador → `loadCollaboratorPayout` (`collaboratorPayoutService.ts`).
- **Com afegir una pàgina que mostra diners:** importa la funció del cervell, crida-la, mostra el resultat. Zero `reduce`/fórmules/ratios propis sobre imports. Si el cervell no exposa el que necessites, **s'amplia el cervell**, després la pàgina hi crida.

## Hardcode i monocapa

- **NORMA ABSOLUTA — ZERO HARDCODED EN TOT EL REPO**: Ni hex de color, ni mides de font en px/pt, ni strings de contacte, ni URLs, ni telèfons, ni emails, ni textos reutilitzats, ni `true`/`false` per a flags de domini. Tot ve de:
  - Colors → tokens CSS `--o-*` o COLORS de `lib/pdf-config.ts`
  - Mides de font → tokens `--o-text-*`, `PDF_DESIGN.type.*` o helpers `setStyle*()`
  - Contacte/web → `SITE_CONFIG` de `app/config/site-config.ts`
  - Textos reutilitzats → `lib/constants/` o `messages/*.json`
  - Mides de layout → `PDF_DESIGN.*`, `PAGE.*` o tokens CSS
  - Violar aquesta norma és un bug de producte que s'ha de revertir immediatament.
- Zero hex hardcoded a components i pàgines, tret dels casos tècnics acceptats: definició de variables globals, canvas, APIs d'imatge, emails HTML.
- Dates, moneda, locale i formats passen per helpers centralitzats (`formatDate`, `formatCurrency`, `formatDateTime`, `toIntlLocale` de `lib/constants/index.ts`).
- Si una dada apareix en més d'un lloc, queda prohibit resoldre-la localment.
- A l'admin, cal minimitzar el hardcoded: el text o valor local i unic es acceptable, pero qualsevol copy, ajuda contextual, label, mapping o valor reutilitzat s'ha de centralitzar en una capa compartida.
- Si tens dubte entre local i compartit, per defecte va a la capa comuna.
- Anti-patrons prohibits: `Object.keys(...)` locals per opcions compartides, maps locals de labels, `Set(...)` locals per regles de domini, arrays derivats locals per categories/status.

## Canon visual admin — HIPERSEMBLANÇA (norma vinculant, propietari 2026-06-17)

**Principi: «un CSS, una veritat, un canònic». Totes les pàgines admin han de ser HIPERSEMBLANTS — fetes pel mateix dissenyador, no diferents.** La decisió visual viu a UNA capa (CSS/tokens), mai repartida pel JSX. «Merda fora»: zero Tailwind ad-hoc que dupliqui el que ja governa una classe canònica.

### Regles dures (es validen amb `pnpm run qa:admin-canon`)
1. **Color = carbó + or.** El blau/violeta NO existeix com a superfície ni com a text de marca. Estat (verd/ambre/vermell) només via `admin-tone-{bg/text/border}-{success/warning/danger}`, mai Tailwind cru (`bg-emerald-500/X`).
2. **Cap botó-void:** un botó/Link sempre consumeix `.ap-btn`/`.ap-btn--primary`/`--xs`. Mai `text-white` + padding sense fons.
3. **Cap blanc/negre absolut:** ni `bg-white` sòlid, ni `text-black`, ni `#000`/`#fff`, ni `style={{background:'#000'}}`. Substituts: `--o-admin-light`, `--gold-ink`, `--o-admin-ink`.
4. **Superfícies = classe canònica.** Cards/panells → `.ap-card`. Inputs/selects/textarea → `.adm-input`/`.ap-input`. KPIs → `.ap-kpi` o gramàtica de Cristina (label `--mono`, número `--display`). Prohibit reinventar amb `bg-white/[0.0x] border-white/10 rounded-* ` a mà.
5. **Tipografia de token.** Mides via `--o-text-*` (o `text-xs`+, que admin força ≥12px). Prohibit `text-[Npx]` i `font-black` als números (usar `font-bold`/`--display`).
6. **Radi únic.** Totes les cards tenen el MATEIX radi (`--o-r-md`). Normalitzat a una capa: `html.admin-mode [class*="rounded-xl|2xl|3xl"]` → `--o-r-md` (admin-shell.css). No barrejar radis de card.
7. **Responsiu amb la mateixa importància que el canon.** Tot component admin nou/modificat ha de funcionar a 375px (mòbil), tablet i desktop. Verificar amb captura als 3 breakpoints abans de tancar.
8. **Controls ≠ diners · zero debug com a UI (norma vinculant, propietari 2026-07-03).** Una peça d'admin NO barreja controls d'edició crus (inputs/selects) amb outputs financers al mateix nivell sense jerarquia (l'anti-patró de la «taula d'enginyer»). Els controls s'AGRUPEN per intenció amb una etiqueta de grup (`--mono` daurada, p. ex. «Ruta» / «Equip»); el resultat de diner viu en la seva pròpia zona destacada. **El text tècnic de debug MAI és interfície:** res de `«es cobren 0 h de 0,56 h · cotxe: X · condueix: Y»` — es converteix en llenguatge humà (`«Ruta curta: dins la 1a hora inclosa»`) o s'elimina. Els detalls secundaris (repartiment, desglossaments) van plegats (`<details>`), no en panells sempre-oberts desproporcionats. Referència: el bloc «Desplaçament» de la fitxa de lead (#1377).

### Referència i prevenció
- **Òrgan de referència NET:** la fitxa de lead (`app/admin/leads/[id]`, cas «Cristina») i el calendari. Tota pàgina nova ha de semblar germana d'aquestes.
- **Font de veritat de tokens:** `app/studio/orbita-tokens.css`. Studio (`/admin/studio`) n'és el mirall FIDEL — si Studio i l'admin divergeixen, és un bug del mirall.
- **Prevenció (es munta bé a la primera):** el guard `scripts/check-admin-canon.mjs` corre a `validate:core --strict` i BLOQUEJA botó-void/blau/blanc-negre/font-black nous. Cap codi no-canònic pot entrar. Si falla, eradica abans de continuar — no s'afegeix excepció.

## Sistema visual admin — norma canònica `/admin/studio`

Vegeu `protocol-producte-admin-ca.md` §2.5 (Migració del Frankenstein admin). Resum operatiu:

- **`/admin/studio` + `app/studio/orbita-tokens.css` són la font de veritat visual de l'admin** (Canvis #795 + #797 + #798).
- `app/admin/**` **NO inventa paletes, hex, gradients ni estats locals**. Només consumeix tokens (`--ax-*`, `--canvas`, `--gold`, `--t*`, `--o-stage-*`) i classes ja exposades pel sistema.
- Si falta un color, estat o component, **primer s'amplia `/admin/studio` i/o `orbita-tokens.css`**, després es consumeix des de l'admin. Mai a l'inrevés.
- CSS local d'una pàgina admin queda restringit a **layout específic** (grid, gaps, posició, ordre de columnes). Decisions cromàtiques o tipogràfiques no viuen a fitxers `app/admin/**.css`.
- `docs/admin-inventari-pagines.md` és el **mapa de la migració** peça a peça: 🔴 old · 🟡 en curs · 🟢 migrada. Cada estat 🟡/🟢 ha de citar el `Canvi #NNN` a la nota.
- **Norma «Sèrie Òrbita Events — fet pel mateix dissenyador» (vinculant, propietari 2026-06-15)**: l'admin NO són pàgines independents, és UN organisme; cada pantalla és un òrgan d'una mateixa sèrie de marca. Tota actuació al codi admin s'avalua contra 7 eixos alhora — **visual, coherència, canònic, monocapa, responsiu, corporatiu i tècnic** (inclou el cablejat real entre òrgans: enllaços/params/context han de fluir i tenir sentit). El detall i el test d'avaluació viuen a `docs/admin-build-method.md` §0–§0.2. Cap pàgina és `TANCAT CHARLIE` si, al costat de les altres, sembla feta per una altra mà.

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

Aquest grep està **automatitzat** via hook `PostToolUse` (`scripts/hooks/check-residue.mjs`): després de cada `Write`/`Edit` d'un `.tsx`/`.css` sota `app/`/`components/` injecta els residus trobats. És advisori, no bloqueja, i respecta l'allowlist de fitxers de tokens. Connexió local via `node scripts/hooks/install-hooks.mjs` (`.claude/settings.json` és gitignorat; els scripts sí van a git). Veure `docs/admin-diary.md`.

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


## Consultor visual expert

Quan el propietari demani un canvi visual significant, consultar via `Agent(model: 'opus')`. El prompt ha de ser concís i el context mínim necessari: Opus ha de sintetitzar i donar ordres concretes directament implementables, no filosofia ni explicacions llargues.

**Quan activar:** canvis a `orbita-tokens.css`, tipografia admin, nous components visuals importants.

**Tokens de referència (#874+#875):** canvas `#111116`, T3 `#9a9286`, `--o-lh-*`, `--o-row-h`, `--ax-action`.

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
- `admin-theme.css` — compatibilitat legacy (`--at-*`), glass, semantic tones i tokens del Control Room (`--at-cr-*`) mentre dura la migració

### Regles de cascada

- La classe `admin-mode` s'afegeix a `document.documentElement` via useEffect. Tots els CSS admin requereixen `html.admin-mode` com a prefix.
- admin-theme.css NO pot competir amb globals.css a mateixa especificitat — Next.js no garanteix ordre de chunks.
- Si una propietat visual es defineix a globals.css, canviar-la allà directament, no intentar override des d'admin-theme.css.

### Selector canònic (norma 2026-06-04)

**Format obligatori**: `html.admin-mode .nomclasse { }` — sense `.admin-shell` ni cap classe intermediària fictícia.

- `.admin-shell` **no existeix al DOM**. El layout usa `.ax-root > .ax__workspace > .ax__page`. Cap selector CSS pot incloure `.admin-shell` com a part del camí.
- Selector vàlid: `html.admin-mode .bd__pnl { }` ✓
- Selector mort: `html.admin-mode .admin-shell .bd__pnl { }` ✗ (mai coincideix)
- Si un CSS antic té `.admin-shell`, fer `sed -i 's/html\.admin-mode \.admin-shell /html.admin-mode /g'` al fitxer.

### Norma CSS monocapa i canònica (norma 2026-06-04)

Tot fitxer CSS d'admin nou o modificat ha de complir:

1. **Zero hex hardcoded** — usar sempre `var(--ax-*)` o `var(--o-admin-*)` de `orbita-tokens.css`. Excepció: valors tècnics puntuals a `rgba()` quan el token no existeix.
2. **Zero duplicats** — cada selector apareix una sola vegada per fitxer. Dues definicions del mateix selector → la primera és codi mort. Eliminar-la.
3. **Zero `!important`** — prohibit tret de compatibilitat legacy explícitament justificada en comentari. Un `!important` que afecti una classe pròpia (`bd__*`, `tk__*`, etc.) és un error.
4. **Responsiu obligatori** — tot component nou ha de tenir `@media` per a mòbil (≥375px), tablet i desktop. No lliurar sense haver comprovat els tres punts de ruptura.
5. **Zero maquetació a píxel en admin nou/modificat** — no fixar layouts amb `px` locals (`width`, `max-width`, `min-width`, `height`, `max-height`, `grid-template-columns`, `flex-basis`, breakpoints, gaps/paddings repetits). Usar tokens (`--o-*`), `rem`, `ch`, `%`, `fr`, `dvh/dvw`, `clamp()`, `min()`, `max()` i `minmax()` perquè la peça sigui reutilitzable i responsiva. Excepcions: hairlines `1px`, SVG/canvas, captures/previews tècnics i definició centralitzada de tokens a `orbita-tokens.css`.
6. **Monocapa** — si un valor o regla visual s'usa en més d'un lloc, va a `orbita-tokens.css` o a `admin-shell.css`. Cap fitxer de pàgina reinventa tokens globals.
7. **Refresc del navegador després de canvi CSS** — Next.js 14 (Fast Refresh) SÍ recarrega el CSS modificat; el servidor serveix l'estil nou a cada càrrega. Si una pàgina segueix mostrant l'estil antic, el primer pas és un **refresc fort al navegador** (`Ctrl+Shift+R`), no reiniciar el servidor. El reinici complet (`Get-Process node | Stop-Process -Force` + esborrar `.next` + `pnpm dev`) queda reservat **només** per al cas residual en què el refresc fort no n'hi hagi prou (corrupció de `.next`), que és poc freqüent.

### Paleta admin (tokens)

- La paleta nova surt de `app/studio/orbita-tokens.css`: `--o-admin-canvas`, `--o-admin-panel`, `--o-admin-raised`, `--o-admin-gold`, `--o-stage-*`.
- Colors: tokens de Studio o sistema `rgba(255,255,255,X)` sobre fons fosc. MAI `slate-*`, `gray-*`, ni hex custom als components.
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

### `/studio-lab` — retirat

- `app/studio-lab/` va ser un prototip intern amb dades de mostra i ha estat **eliminat**.
- No recrear `/studio-lab` ni afegir-hi rutes noves sense ordre explícita del propietari.
- La distinció activa queda: `/admin` = admin real de producció · `/studio` = fitxa tècnica protegida del sistema visual.
- La lògica aprofitada del prototip ha de viure en serveis/constants/components canònics de `/admin`, mai en una carpeta de laboratori.

## Documentació obligatòria

- `docs/admin-diary.md` s'ha d'actualitzar quan es tanca una passada rellevant.
- El diari ha d'explicar què s'ha fet, amb quin criteri i quina validació real s'ha passat.
- No escriure "final", "tot net" o equivalents si no està realment verificat.
