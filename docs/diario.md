# Diari de treball — Òrbita Events

## Auditories prèvies (sessions anteriors)

S'han realitzat **2 auditories exhaustives de codi** abans de la sessió del 2026-02-23. Gran part del codi ha estat reparat, netejat i reorganitzat. El que se sap amb seguretat que s'ha fet:

- **Eliminació de codi mort i assets morts** (commit: `refactor: fase 1 — eliminació codi duplicat i assets morts`)
  - Components sense importar eliminats
  - Assets (imatges, fonts, fitxers) sense referència eliminats
  - Codi duplicat consolidat
- **Revisió d'inconsistències** al llarg de tot el repo:
  - Rutes inconsistents detectades i catalogades
  - Labels d'idioma inconsistents identificats
  - Dependències sense ús revisades
- **Recuperació del repo** (accident durant la còpia de C: a D:):
  - La còpia de C: a D: va perdre una gran quantitat de fitxers
  - 225 fitxers recuperats des de GitHub (el repo remot)
  - 66 fitxers van sobreviure localment (es desconeix exactament quins)
  - Repo restaurat a estat coherent i commitat

> Nota: Les auditories prèvies no estan detallades aquí perquè les sessions van crashejar. Tot el que es va fer queda a l'historial de git.

---

## 2026-02-23

### Context de la sessió
- El repo va ser copiat de C: a D:, es van perdre fitxers a meitat d'un canvi gran
- Es van recuperar 225 fitxers des de GitHub per completar el repo
- S'havien fet 2 auditories prèvies exhaustives de codi mort + inconsistències, amb gran quantitat de reparacions
- S'estava a la 3a passada de refactoring quan va petar la sessió
- Últim commit en arrencar: `refactor: fase 1 — eliminació codi duplicat i assets morts` (21:20)

### Anàlisi del repo (estat en iniciar)
- ~19.000 LOC TypeScript, 132 rutes API, 63 pàgines admin, schema Prisma 1.417 línies
- Cobertura de tests: ~6%

---

### Treball realitzat

#### ✅ Unificar rutes `clientes` / `contactes`
**Per què**: L'entitat "client" tenia la llista a `/admin/clientes` però el detall a `/admin/contactes/[id]`. Hi havia 28+ enllaços apuntant a rutes diferents per a la mateixa cosa. Confusió operativa i risc d'enllaços trencats.
**Què s'ha fet**:
- Contingut real mogut de `contactes/[id]` a `clientes/[id]`
- `contactes/[id]/page.tsx` convertit en redirect de compatibilitat
- 28 links actualitzats a `clientes/[id]`
- Label duplicat "Contactes" eliminat de `mapa/page.tsx`
- `CustomerTabSelector.tsx` eliminat (codi mort, ningú l'importava)

#### ✅ Unificar labels d'idioma (`es`)
**Per què**: El panell admin barrejava "Castellà", "Español" i "Spanish" per al mateix codi `es`. Confusió en operar i aparença poc professional. L'admin és en català, per tant "Castellà" és el terme correcte.
**Què s'ha fet**:
- "Español" → "Castellà" a ClientPortalAccessPanel, PresupuestoPdfStudio, text-manager
- ServiceJsonLD.tsx manté "Spanish" (schema.org requereix anglès estàndard)
- `contactes/[id]/_components/` eliminat (codi mort post-migració)

#### ✅ Refactoritzar `admin/layout.tsx` (904 → 717 línies)
**Per què**: El fitxer barrejava dades de navegació estàtiques, lògica de fetching d'alertes, el patch de CSRF en fetch, i el JSX del layout. Difícil de mantenir i de testejar individualment.
**Què s'ha fet**:
- Nav items extrets a `app/admin/components/nav-items.ts` (dades estàtiques)
- Lògica d'alertes (leads/packs/finances + visibility refresh) → `hooks/useAdminAlerts.ts`
- CSRF fetch wrapper → `hooks/useCsrfFetch.ts` (reutilitzable)

#### ✅ Refactoritzar `admin/page.tsx` (1.186 → 480 línies)
**Per què**: El dashboard barrejava 29 queries Prisma en paral·lel, processament de dades i el JSX de renderitzat, tot en un sol fitxer. Impossible de llegir, difícil de depurar si fallava una query.
**Què s'ha fet**:
- Fetching + processament + tipus extrets a `app/admin/lib/dashboard-data.ts`
- `page.tsx` només importa `fetchDashboardData()` i renderitza

#### ✅ Reduir usos de `any` (110 → 94)
**Per què**: `any` desactiva el sistema de tipus de TypeScript. Cada `as any` és un punt cec on poden entrar bugs sense que el compilador els detecti.
**Què s'ha fet**:
- `types/window.d.ts` creat: `window.dataLayer` tipat globalment (GTM/GA4)
- ExitIntentModal + WebVitalsReporter: `(window as any)` eliminat
- InventoryListClient: interface `BundleApiItem` local per a dades de fetch
- tasks/page.tsx: `prisma as any` eliminat, `prisma.task` directe
- ESLint: `@typescript-eslint/no-explicit-any: warn` afegit per prevenir nous
- **Pendient**: 94 usos restants concentrats a `api/admin/emails/` amb patrons `(pack as any).field` — requereixen tipat correcte del schema Prisma, sessió dedicada

#### ✅ Playwright: webServer configurat correctament
**Per què**: El `webServer` estava comentat i `baseURL` apuntava a `https://orbitaevents.com` per defecte. Qualsevol `pnpm test:e2e` sense configurar `BASE_URL` llançava tests contra producció real. Risc de dades corruptes i side effects en producció.
**Què s'ha fet**:
- Sense `BASE_URL` → aixeca `pnpm dev` a `localhost:3000` automàticament
- Amb `BASE_URL` → usa aquella URL (staging/prod) sense aixecar servidor local
- `baseURL` ja no apunta a producció per defecte

#### ✅ Refactoritzar middleware (321 → 90 línies)
**Per què**: Barrejava 5 responsabilitats (bots, www redirect, legacy redirects, admin auth+CSRF, i18n). Impossible de testejar individualment i difícil de depurar en producció quan falla l'auth.
**Què s'ha fet**:
- `lib/middleware/admin-rate-limit.ts`: Upstash Redis + fallback in-memory per a rate limiting de login
- `lib/middleware/admin-auth.ts`: Basic auth + Bearer + CSRF — retorna null si passa, NextResponse si bloqueja
- `middleware.ts`: orquestrador de 90 línies, flow clar i llegible amb 5 passos numerats

#### ✅ Admin verificat en català
**Per què**: L'admin ha d'estar 100% en català (text visible a la UI, no noms de variables ni rutes).
**Què s'ha fet**:
- Auditoria exhaustiva de tots els fitxers `.tsx` de `/app/admin`
- Únic text en castellà trobat: nom del fitxer CSV descarregable `rentabilidad-history-*.csv`
- Corregit: `rendibilitat-history-${stamp}.csv`
- `PresupuestoPdfStudio.tsx`: les cadenes en castellà estan correctament al bloc `es` de `STUDIO_COPY` (contingut per a PDFs en castellà enviats a clients, no UI de l'admin)

---

### Pendent per a properes sessions (estat actualitzat 2026-02-25)
- [x] ~~94 usos de `any` a rutes email~~ — Resolt a la sessió 2026-02-24 (17 `as any` eliminats, fitxers ben tipats)
- [x] ~~`formatDate` hardcodejat a `ca-ES` sense suport i18n~~ — Resolt a la sessió 2026-02-25 amb `toIntlLocale()`
- [x] ~~TODO sense resoldre a `FiestasClient.tsx`~~ — No era un TODO pendent; és una nota arquitectònica ("TODO sale de packs-config.ts" = "tot ve de packs-config.ts"). Ja implementat correctament.

---

## 2026-02-24

### Context de la sessió
- L'admin ja funciona (7.5/10) però l'operador sol necessita: feedback visual, semafors de marge, kanban de tasques, navegació creuada i dreceres.
- Sessió d'implementació UX completa: 4 fases, 15 subtasques.

### Treball realitzat

#### ✅ Fase 1A: Sistema global de Toast notifications
**Per què**: Cada acció (drag-drop, guardar, eliminar) succeïa en silenci. L'operador no sabia si havia funcionat.
**Què s'ha fet**:
- `app/admin/components/ToastProvider.tsx` creat — context provider amb `useToast()` hook
- Reutilitza el component `Toast` existent d'`AdminUI.tsx` (corregit posicionament: `fixed` eliminat del component, ara gestionat pel provider amb stacking)
- Integrat a `layout.tsx` wrapping children
- Connectat a:
  - `LeadPipelineView.tsx` — toast.success/error al moure entrada (drag-drop i botons ←→)
  - `BookingActions.tsx` — toast en lloc d'`alert()` per eliminar i canviar estat
  - `BookingMarginCard.tsx` — toast en lloc d'`alert()` i inline "Desat!"

#### ✅ Fase 1B: Semafors de marge a la llista de reserves
**Per què**: L'usuari ho va demanar explícitament. Cal veure si una reserva és rendible sense obrir-la.
**Què s'ha fet**:
- `lib/margin-utils.ts` creat — `getMarginTone(pct)` retorna color/bg/label (emerald≥50%, amber≥30%, orange≥15%, rose<15%), `calculateSimpleMarginPct()` per càlcul ràpid
- Query de `bookings/page.tsx` ampliada amb `extras: { select: { price, quantity } }`
- Chip colorat de marge afegit a la taula desktop (nova columna "Marge") i a les cards mòbil
- Fórmula simplificada amb ratios per defecte (packCostRatio: 0.36, extraCostRatio: 0.28, fixedOperationalCost: 45€)

#### ✅ Fase 1C: Cards més rics al pipeline de leads
**Per què**: Les cards del kanban eren text pur sense indicadors visuals ràpids.
**Què s'ha fet**:
- Chip "dies sense resposta" amb semàfor (verd≤2d, ambre 3-5d, rosa>5d)
- Budget prominent amb chip emerald quan existeix
- Data d'event amb icona 📅
- Punt de prioritat augmentat (w-3 h-3 en lloc de w-2 h-2)
- Booking reference com a chip-link prominent (border sky)
- Link a client amb text "👤 Client" en lloc d'emoji sol

#### ✅ Fase 1D: KPI marge mitjà al dashboard
**Per què**: 6 KPIs al dashboard però cap de marge. L'operador vol veure la salut del negoci d'un cop d'ull.
**Què s'ha fet**:
- `dashboard-data.ts` — nova query per obtenir reserves confirmades/completades amb preu pack i extras
- Càlcul `avgMarginPct` amb la mateixa fórmula simplificada
- MetricCard "Marge mitjà" amb semàfor dinàmic (emerald/amber/rose) afegit a la fila de KPIs

#### ✅ Fase 2A: Navegació creuada entre entitats
**Per què**: Des de qualsevol entitat arribar a les relacionades en 1 clic.
**Què s'ha fet**:
- Les cards de leads ja tenien links a client i booking — millorats amb estil prominent (chip sky per booking, text "👤 Client")
- Reserves ja tenien links a lead/client/calendari a BookingActions

#### ✅ Fase 2B: Botó flotant d'acció ràpida (FAB)
**Per què**: Crear nova entrada/reserva/tasca/pressupost des de qualsevol pàgina en 1 clic.
**Què s'ha fet**:
- `app/admin/components/FloatingAddButton.tsx` creat — botó "+" fix baix-dreta, expandeix a 4 opcions
- Posicionat `bottom-24 sm:bottom-6` per no tapar bottom-nav mòbil
- Tanca amb clic fora o Escape
- Integrat a `layout.tsx`

#### ✅ Fase 2C: Dreceres de teclat
**Per què**: Velocitat per a l'operador sol. Abans només hi havia Ctrl+K.
**Què s'ha fet**:
- `layout.tsx` — handler de shortcuts ampliat: Alt+1→leads, Alt+2→tasques, Alt+3→correus, Alt+4→reserves, Alt+C→calendari, Alt+N→FAB
- `AdminSearchModal.tsx` — secció "Dreceres de teclat" mostrada quan el modal és buit

#### ✅ Fase 2D: Ítems recents al cercador
**Per què**: 80% de les cerques són coses d'avui. Estalvia temps.
**Què s'ha fet**:
- `AdminSearchModal.tsx` — `addRecentItem()` exportat, `localStorage admin.recent` (max 8 ítems)
- "Visitats recentment" mostrat al modal quan no hi ha query
- Cada clic a resultat de cerca (lead/booking/customer) guarda automàticament l'ítem als recents

#### ✅ Fase 3A: Kanban de tasques amb drag-drop
**Per què**: L'usuari adora el drag-drop. Les tasques eren una taula plana.
**Què s'ha fet**:
- `app/admin/tasks/TaskKanbanView.tsx` creat — 3 columnes (OPEN, IN_PROGRESS, DONE) amb HTML5 DnD
- Cards amb: títol, entitat relacionada (link a client/lead), data límit amb color (vençuda=rosa, avui=ambre, futur=neutral)
- Optimistic update + rollback en cas d'error + toast
- `tasks/page.tsx` — toggle vista llista/kanban amb searchParam `view=kanban|list` (default: kanban)

#### ✅ Fase 3B: Drag-drop al calendari per moure reserves
**Per què**: Reprogramar un event requeria obrir reserva → editar data → guardar. Amb drag-drop: 1 segon.
**Què s'ha fet**:
- `CalendarMonthClient.tsx` — chips de reserva fets `draggable`, cel·les receptores amb `onDrop`
- PATCH `/api/admin/bookings/{id}` amb nova `eventDate`
- Highlight ring ambre a la cel·la target durant hover
- Refetch automàtic del calendari després de moure
- Toast de confirmació/error

#### ✅ Fase 4A: Exportació CSV reutilitzable
**Per què**: Poder exportar dades des de qualsevol llista sense dependre del backend.
**Què s'ha fet**:
- `app/admin/components/ExportCsvButton.tsx` creat — botó reutilitzable, BOM UTF-8, escapament de comes/cometes
- Toast de confirmació o warning si no hi ha dades

#### ✅ Fase 4B: Explicacions "Per què" al marge
**Per què**: L'operador vol saber ràpidament si el marge és sa o no, i què fer al respecte.
**Què s'ha fet**:
- `BookingMarginCard.tsx` — missatge contextual sota el % de marge:
  - ≥50%: "Excel·lent. Marge sa."
  - 30-50%: "Acceptable. Considera reduir costos o augmentar preu."
  - 15-30%: "Vigilar. Revisa descomptes i transport."
  - <15%: "Crític! Revisa preu o costos."

#### ✅ Fase 4C: Empty states millorats al pipeline
**Per què**: "Cap entrada" era poc informatiu. Ara té CTA contextual.
**Què s'ha fet**:
- Pipeline de leads: columna "Noves" buida mostra link "+ Afegir entrada"
- Kanban de tasques: empty state per columna amb "Cap tasca"

---

### Fitxers nous creats
- `app/admin/components/ToastProvider.tsx`
- `app/admin/components/FloatingAddButton.tsx`
- `app/admin/components/ExportCsvButton.tsx`
- `app/admin/tasks/TaskKanbanView.tsx`
- `lib/margin-utils.ts`

### Fitxers modificats
- `app/admin/components/AdminUI.tsx` — Toast: eliminat `fixed` positioning
- `app/admin/components/AdminSearchModal.tsx` — recents, dreceres, save recent on click
- `app/admin/layout.tsx` — ToastProvider, FAB, dreceres teclat
- `app/admin/leads/LeadPipelineView.tsx` — cards enriquides, toast, empty states
- `app/admin/bookings/page.tsx` — columna marge, chip marge mòbil
- `app/admin/bookings/BookingActions.tsx` — toast
- `app/admin/bookings/[id]/BookingMarginCard.tsx` — toast, "Per què" marge
- `app/admin/lib/dashboard-data.ts` — avgMarginPct
- `app/admin/page.tsx` — KPI marge mitjà
- `app/admin/tasks/page.tsx` — toggle kanban/llista
- `app/admin/calendario/CalendarMonthClient.tsx` — drag-drop reserves

---

### Continuació sessió 2026-02-24 (part 2)

#### ✅ Centralitzar formatació de dates i números (zero `ca-ES` hardcodejat)
**Per què**: Hi havia ~60 instàncies de `toLocaleDateString('ca-ES', ...)`, `toLocaleString('ca-ES')` i `new Intl.NumberFormat('ca-ES', ...)` repartides per tot l'admin. Canviar el locale requeriria editar 46 fitxers. Un únic punt de control és imprescindible.
**Què s'ha fet**:
- `lib/constants/index.ts` — afegits `DEFAULT_LOCALE`, `formatDateShort`, `formatDateFull`, `formatDateSimple`, `formatDateTimeFull`, `formatNumber`, i paràmetre `locale` a `formatDate`/`formatDateTime`
- ~46 fitxers admin actualitzats: tots els `'ca-ES'` hardcodejats reemplaçats per helpers centralitzats
- Casos especials (hora sola, dia de la setmana) usen `DEFAULT_LOCALE`
- Verificat amb Grep: **zero** `'ca-ES'` hardcodejat a tot el directori admin

#### ✅ Eliminar tots els `as any` a rutes d'email (17 → 0)
**Per què**: 17 `as any` a 4 fitxers de `api/admin/emails/` desactivaven el sistema de tipus. Cada cast era un punt cec on podien entrar bugs.
**Què s'ha fet**:
- `app/api/admin/emails/quote/route.ts`:
  - `(pack as any).durationHours` → `pack.durationHours ?? 4` (PackDefinition ja té el camp)
  - `(pack as any).emotion` → `pack.emotion` (PackDefinition ja té el camp)
  - Interfície `ExtraInput` creada per a extras no tipats
  - `extra.translations as any` → `extra.translations` (tipus Prisma compatibles)
  - `prisma as any` → `prisma.task` directe (model Task existeix a l'schema línia 732)
- `app/api/admin/emails/send/route.ts`:
  - Mateixos canvis de pack + interfície `QuoteAttachmentInput` creada
- `app/api/admin/emails/send-post-event/route.ts` i `run-cron/route.ts`:
  - `booking.pack?.translations as any` → `booking.pack?.translations`
- Verificat amb Grep: **zero** `as any` a rutes email

#### ✅ Integrar ExportCsvButton a bookings, leads i economia
**Per què**: El botó ExportCsvButton existia però no estava connectat a cap pàgina. L'operador necessita poder exportar dades.
**Què s'ha fet**:
- `ExportCsvButton.tsx` refactoritzat amb mode dual:
  - `headers+rows` (strings pre-computats, per a server components)
  - `data+columns` (amb funcions accessor, per a client components)
  - Motiu: les funcions no es poden serialitzar de server a client components
- `bookings/page.tsx` — integrat amb mode `headers+rows` (server component)
- `leads/page.tsx` — integrat amb mode `headers+rows` (server component)
- `economia/EconomiaClient.tsx` — integrat amb mode `data+columns` (client component), substituint l'antic "Exportar JSON"

#### ✅ Verificació TypeScript
**Per què**: Confirmar que els canvis no introdueixen errors de compilació.
**Què s'ha fet**:
- `npx tsc --noEmit` — només errors preexistents (CookieConsent, analytics), cap error nou introduït

### Commit
- 53 fitxers, commit `7997d97`: `refactor: centralitzar formatació dates/números i eliminar any a rutes email`
- Push a origin/main completat

#### ✅ Resoldre errors TypeScript preexistents (7 → 0)
**Per què**: 7 errors de compilació a CookieConsent i analytics impedien un `tsc --noEmit` net. Causats per declaracions duplicades i incompatibles de `Window.dataLayer`.
**Què s'ha fet**:
- `types/window.d.ts` — unificada la declaració de `Window`: `dataLayer`, `gtag`, `gtagConsentUpdate` amb tipus correctes
- `app/lib/analytics.ts` — eliminat `declare global` duplicat, `Record<string, any>` → `Record<string, unknown>`
- `npx tsc --noEmit` → **zero errors**

### Pendent per a properes sessions
- [ ] Verificar manualment al navegador: toast, semafors, drag-drop, FAB, dreceres
- [ ] Comprovar responsive (mòbil): bottom nav no es tapa amb FAB, cards touch-friendly

---

## 2026-02-25

### Context de la sessió
- 3 tasques pendents de la sessió 2026-02-23 per resoldre.
- Investigació prèvia va revelar que 2 de 3 ja estaven resoltes; la tercera (`formatDate` i18n) era real.

### Treball realitzat

#### ✅ Centralitzar locale mapping amb `toIntlLocale()`
**Per què**: 14 aparicions del patró `locale === 'ca' ? 'ca-ES' : locale === 'es' ? 'es-ES' : 'en-GB'` escampades per 11 fitxers. Codi duplicat, propens a errors (un fitxer tenia `en-US` en lloc de `en-GB`), i impossible de mantenir si s'afegeix un nou locale.
**Què s'ha fet**:
- `lib/constants/index.ts` — afegit `LOCALE_MAP` i `toIntlLocale()` que mapeja `ca→ca-ES`, `es→es-ES`, `en→en-GB`
- 8 funcions de format (`formatDate`, `formatDateTime`, `formatDateShort`, `formatDateFull`, `formatDateSimple`, `formatDateTimeFull`, `formatNumber`, `formatCurrency`) actualitzades per usar `toIntlLocale(locale)` internament
- `formatCurrency` — afegit paràmetre `locale` (abans hardcodejat a `ca-ES`)
- Blog `page.tsx` i `[slug]/page.tsx` — eliminades funcions `formatDate` locals, substituïdes per `toIntlLocale()` inline
- 9 fitxers més actualitzats: `pdf-utils.ts`, `portal/[token]/page.tsx`, `configurador/client.tsx` (corregit bug `en-US`→`en-GB`), `CalendarioUrgencia.tsx`, `contact/route.ts` (3 llocs), `cron/post-event/route.ts`, `emails/run-cron/route.ts`, `emails/send-post-event/route.ts`, `privacy/verify/route.ts`
- Verificat amb Grep: **zero** aparicions del patró antic

#### ✅ Tancar tasques pendents sessió 2026-02-23
**Per què**: El diari i la memòria tenien 3 tasques pendents que ja no ho eren.
**Què s'ha fet**:
- `any` a emails: ja resolt sessió 2026-02-24 (17 `as any` → 0)
- `formatDate` i18n: resolt en aquesta sessió amb `toIntlLocale()`
- TODO a `FiestasClient.tsx`: no era un TODO pendent, era nota arquitectònica ("TODO sale de packs-config.ts")
- Diari i memòria actualitzats

### Fitxers modificats
- `lib/constants/index.ts` — `toIntlLocale()`, `LOCALE_MAP`, 8 funcions actualitzades
- `app/[locale]/blog/page.tsx` — eliminat `formatDate` local, import `toIntlLocale`
- `app/[locale]/blog/[slug]/page.tsx` — eliminat `formatDate` local, import `toIntlLocale`
- `lib/pdf-utils.ts` — 3 substitucions, import `toIntlLocale`
- `app/[locale]/portal/[token]/page.tsx` — 1 substitució, import `toIntlLocale`
- `app/[locale]/configurador/client.tsx` — 1 substitució (fix `en-US`→`en-GB`), import `toIntlLocale`
- `app/components/ui/CalendarioUrgencia.tsx` — 1 substitució, import `toIntlLocale`
- `app/api/contact/route.ts` — 3 substitucions, import `toIntlLocale`
- `app/api/cron/post-event/route.ts` — 1 substitució, import `toIntlLocale`
- `app/api/admin/emails/run-cron/route.ts` — 1 substitució, import `toIntlLocale`
- `app/api/admin/emails/send-post-event/route.ts` — 1 substitució, import `toIntlLocale`
- `app/api/privacy/verify/route.ts` — 1 substitució, import `toIntlLocale`
- `docs/diario.md` — tasques 2026-02-23 marcades resoltes, entrada 2026-02-25
- `.eslintrc.json` — corregit error preexistent: afegit `plugin:@typescript-eslint/recommended` per registrar el plugin, desactivades regles noves que no apliquen al codi existent

---

## 2026-02-25 (sessió 2 — Revisió sistema econòmic-financer + UX)

### Context de la sessió
L'operador vol un sistema de gestió de nivell professional: coherència financera absoluta, tests exhaustius, i una UX que permeti prendre decisions econòmiques correctes tant en desktop com en mòbil. Criteri de doctor en ADE: cada número ha de reflectir la realitat operativa, cada semàfor ha de tenir significat econòmic real, i la interfície ha de ser comprensible per qualsevol persona.

### Treball realitzat

#### ✅ Bloc 5: Centralitzar `escapeHtml()` (5 còpies → 1)
**Per què**: 5 fitxers tenien la seva pròpia implementació d'`escapeHtml()`. 2 d'ells acceptaven `null|undefined`, 3 no. Això és risc de seguretat (XSS) i deute tècnic: si es troba un vector d'atac nou, s'ha de corregir a 5 llocs.
**Què s'ha fet**:
- `lib/utils/sanitize.ts` — ampliat per acceptar `string | null | undefined` (retorna `''` per null/undefined)
- 5 fitxers: eliminada còpia local, afegit `import { escapeHtml } from '@/lib/utils/sanitize'`
- Tests actualitzats amb casos `null` i `undefined`
- Verificat amb Grep: **zero** `function escapeHtml` fora de `sanitize.ts`

#### ✅ Bloc 7: Correccions de qualitat
**Per què**: `(prisma as any)` desactiva la comprovació de tipus — si el model canvia, no detectem l'error fins a producció. Toast sense `role="status"` és invisible per a lectors de pantalla (accessibilitat). `exhaustive-deps` evita bugs subtils de closures.
**Què s'ha fet**:
- `scripts/autofix-system-health.ts` — `(prisma as any).task` → `prisma.task` (model Task existeix a schema línia 732)
- `lib/services/clientPortalAccess.ts` — `(prisma as any).clientPortalAccess` → `prisma.clientPortalAccess` (model existeix línia 657)
- `app/admin/components/ToastProvider.tsx` — afegit `role="status"` i `aria-live="polite"` al contenidor de toasts
- `BookingMarginCard.tsx` — afegit `toast` al dependency array del `handleSave` useCallback
- Verificat: **zero** `(prisma as any)` al projecte

#### ✅ Bloc 3: Renominar fuel→vehicle al model de cost
**Per què**: `DEFAULT_FUEL_COST_PER_KM = 0.19` cobreix NOMÉS benzina. El cost real d'un vehicle inclou manteniment (~0.05 €/km), assegurança (~0.03 €/km), pneumàtics (~0.02 €/km) i amortització (~0.08 €/km). El nom "Cost benzina intern" a la UI enganyava l'operador, que creia que 0.19 €/km cobria tot. Cost real recomanat: 0.35-0.50 €/km.
**Què s'ha fet**:
- `lib/services/travelCost.ts` — nova constant `DEFAULT_VEHICLE_COST_PER_KM`, alias deprecated `DEFAULT_FUEL_COST_PER_KM` per compatibilitat
- Paràmetre `fuelCostPerKm` → `vehicleCostPerKm` a `calculateTravelCost()`
- `BookingMarginCard.tsx` — interfície actualitzada amb `vehicleCostPerKm` (compat amb prop legacy `fuelCostPerKm`)
- UI: "Cost benzina intern" → "Cost vehicle per km" + tooltip "Inclou benzina, manteniment, assegurança i amortització. Valor recomanat: 0.35-0.50 €/km"

#### ✅ Bloc 2: Centralitzar semàfors de marge
**Per què**: `BookingMarginCard.tsx` tenia ~25 línies de lògica inline duplicant `getMarginTone()` amb colors lleugerament diferents (inconsistència visual). A més, el transport tenia llindars propis (45%/20%) sense funció reutilitzable.
**Què s'ha fet**:
- `lib/margin-utils.ts` — afegit `getTravelMarginTone()` amb 3 bandes: ≥45% emerald (sa), ≥20% orange (vigilar), <20% rose (crític)
- `BookingMarginCard.tsx` — substituïts ~25 línies de lògica inline per `getMarginTone()` i `getTravelMarginTone()`

#### ✅ Bloc 1: Unificar ratis de cost (config BD)
**Per què**: PROBLEMA CRÍTIC. `bookings/page.tsx` i `dashboard-data.ts` usaven `0.36/0.28/45` hardcodejats. El detall de booking sí usava `getProfitabilityConfig()`. Resultat: l'operador canviava la config a Economia, veia marges correctes al detall, però la llista i el dashboard seguien mostrant els antics. Decisió de preus errònies.
**Què s'ha fet**:
- `bookings/page.tsx` — afegit `getProfitabilityConfig()` al `Promise.all`, els 2 blocs de marge (mòbil + desktop) ara usen `profitConfig.packCostRatio/extraCostRatio/fixedOperationalCost`
- `dashboard-data.ts` — afegit `getProfitabilityConfig()` al bloc d'inicialització, marge mitjà usa config de BD
- Verificat amb Grep: **zero** `0.36` hardcodejat fora de `profitabilityService.ts` i tests

#### ✅ Bloc 4: Tests exhaustius del sistema financer (4 fitxers, ~88 casos nous)
**Per què**: Zero cobertura de test per a la lògica financera. El sistema decideix si una reserva és rendible, calcula costos de viatge, puntua leads comercialment, i normalitza configuració. Tot això sense cap test unitari. Un error de càlcul = decisions financeres incorrectes.
**Què s'ha fet**:
- `__tests__/lib/margin-utils.test.ts` (21 tests) — semàfors de marge (fronteres exactes 15/30/50), semàfors de transport (20/45), càlcul de marge (cas típic, total=0, negatiu, sense extras/viatge)
- `__tests__/lib/services/travelCost.test.ts` (35 tests) — sanitizeNonNegative (NaN, Infinity, negatiu), km facturables, trams, cost vehicle, suplement client, km inclosos
- `__tests__/lib/services/commercialScoring.test.ts` (17 tests) — scoring per estat, bonificacions (budget, telèfon, referit), penalitzacions (event passat, stale), clamping (0-100, probabilitat 2%-98%), estimació d'import
- `__tests__/lib/services/profitabilityService.test.ts` (15 tests) — valors per defecte, normalització (null, parcial, ràtios fora rang, CAC parcial)
- Tots els tests documentats amb comentaris pedagògics en català explicant conceptes econòmics (marge, ràtio de cost, CAC, amortització, trams de transport)
- **151 tests totals, 12 fitxers, TOTS passen**

#### ✅ Bloc 6: Fallbacks mòbil per drag-drop
**Per què**: HTML5 Drag & Drop no funciona en dispositius tàctils (mòbil/tablet). El kanban de tasques i el calendari eren inutilitzables en mòbil — 50%+ del tràfic admin.
**Què s'ha fet**:
- `TaskKanbanView.tsx` — afegits botons "Obertes" / "En curs" / "Fetes" sota cada card, visibles només en mòbil (`md:hidden`). Usen la mateixa funció `moveTask()` que el drag-drop.
- `CalendarMonthClient.tsx` — afegit botó "Canviar data" al panell de detalls de cada reserva. Obre un input `type="date"` natiu (óptim per mòbil). En seleccionar, mou la reserva i refresca el calendari.

### Verificació final
- `npx tsc --noEmit` → 2 errors pre-existents (portal/booking), cap error nou
- `npx vitest run` → **151 tests, 12 fitxers, tots passen**
- Grep `function escapeHtml` → 1 sola definició (sanitize.ts)
- Grep `0.36` hardcodejat → només a profitabilityService.ts (font canònica) i tests
- Grep `(prisma as any)` → zero

### Fitxers nous creats
- `__tests__/lib/margin-utils.test.ts`
- `__tests__/lib/services/travelCost.test.ts`
- `__tests__/lib/services/commercialScoring.test.ts`
- `__tests__/lib/services/profitabilityService.test.ts`

### Fitxers modificats
- `lib/utils/sanitize.ts` — escapeHtml ampliat a null|undefined
- `lib/margin-utils.ts` — getTravelMarginTone() afegit
- `lib/services/travelCost.ts` — DEFAULT_VEHICLE_COST_PER_KM, alias deprecated
- `lib/services/clientPortalAccess.ts` — eliminat (prisma as any)
- `lib/email.ts` — import escapeHtml centralitzat
- `lib/services/documentService.ts` — import escapeHtml centralitzat
- `lib/services/canvasService.ts` — import escapeHtml centralitzat
- `app/admin/bookings/page.tsx` — getProfitabilityConfig, zero hardcodes
- `app/admin/lib/dashboard-data.ts` — getProfitabilityConfig, zero hardcodes
- `app/admin/bookings/[id]/BookingMarginCard.tsx` — semàfors centralitzats, fuel→vehicle, tooltip, exhaustive-deps
- `app/admin/components/ToastProvider.tsx` — accessibilitat (role/aria-live)
- `app/admin/tasks/TaskKanbanView.tsx` — botons mòbil per moure tasques
- `app/admin/calendario/CalendarMonthClient.tsx` — botó canviar data per mòbil
- `app/api/admin/emails/send/route.ts` — import escapeHtml centralitzat
- `app/api/admin/leads/[id]/snapshot/route.ts` — import escapeHtml centralitzat
- `scripts/autofix-system-health.ts` — eliminat (prisma as any)
- `__tests__/lib/sanitize.test.ts` — tests null/undefined

## 2026-02-26 — Auditoria econòmica-financera Fase 2

### Context de la sessió
L'operador vol el sistema econòmic completament automatitzat i interconnectat. Criteri de doctor en ADE: tots els costos derivats de dades reals, previsions de vendes, recordatoris automàtics, i que "la feina es faci sola". Objectiu: enriquir i automatitzar, no reconstruir.

### Treball realitzat

#### Bloc 0: Motor de cost unificat (`costEngine.ts`)
**Per què**: Hi havia 3 sistemes de cost desconnectats (profitabilityService, packPricingHealth, BookingMarginCard). L'operador veia marges diferents segons on mirés.
**Què s'ha fet**:
- Creat `lib/services/costEngine.ts` — `computeBookingFinancialSummary()` com a font única de veritat
- Si hi ha inventari real → cost REAL, si no → estimat via ratis
- `profitabilityService.ts` ara delega internament a costEngine
- `bookings/page.tsx` i `dashboard-data.ts` ara usen `computeSimpleMarginPct()` del costEngine
- 10 tests nous per al costEngine

#### Bloc 1: MITECO → cost vehicle automàtic
**Per què**: `travelCost.ts` usava 0.19€/km hardcodejat. `fuelReferenceService.ts` ja descarregava el preu MITECO però no s'usava en cap càlcul.
**Què s'ha fet**:
- `travelCost.ts` — nova `calculateEffectiveVehicleCostPerKm()` amb fórmula: `(fuelPrice × consumL100 / 100) + maintenance`
- `fuelReferenceService.ts` — nova `getEffectiveVehicleCostPerKm()` que llegeix MITECO de BD
- Defaults: consum 8.5 L/100km (furgoneta), manteniment 0.12 €/km
- 6 tests nous per al càlcul de cost vehicle
- UI a economia/config mostrant preu combustible, consum, manteniment i cost efectiu

#### Bloc 7: Eliminar redundàncies de càlcul
**Per què**: Marge es calculava de manera diferent a bookings/page, dashboard-data, BookingMarginCard, profitabilityService.
**Què s'ha fet**:
- `profitabilityService.ts` → `toProfitabilityRow()` ara usa costEngine
- `dashboard-data.ts` → marge mitjà ara via `computeSimpleMarginPct()` del costEngine
- `bookings/page.tsx` → ambdós càlculs de marge (mòbil + desktop) via costEngine
- Eliminat import de `calculateSimpleMarginPct` dels consumidors (queda a margin-utils per retrocompatibilitat)

#### Bloc 2: Previsió de tresoreria
**Per què**: L'operador no sabia quan entraria diners. Sense previsió de tresoreria, qualsevol empresa petita va a cegues.
**Què s'ha fet**:
- Creat `lib/services/cashFlowForecast.ts` — `buildCashFlowForecast()`
- Ingressos = total × % pendent de cobrar per mes d'event
- Costos = estimats via costEngine per reserva
- Taula mensual: ingressos, costos, flux net, acumulat
- API route: `app/api/admin/economia/cash-flow/route.ts`
- Nova pestanya "Tresoreria" a Economia

#### Bloc 3: Previsió de vendes + estacionalitat
**Per què**: L'operador no sabia quantes reserves necessitava per arribar als objectius ni quins mesos eren forts.
**Què s'ha fet**:
- Creat `lib/services/pipelineForecast.ts` — `buildPipelineForecast()`
- Pipeline ponderat: leads actius × probabilitat (scoreLead) × import estimat
- Històric: reserves passades per mes → mitjana estacional (últims 24 mesos)
- Combinació: 60% pipeline + 40% històric
- API route: `app/api/admin/economia/forecast/route.ts`
- Nova pestanya "Previsions" a Economia

#### Bloc 4: Recordatoris de pagament automàtics
**Per què**: L'operador mirava manualment quines reserves tenien pagaments pendents. Amb 30+ reserves al mes, molt temps perdut.
**Què s'ha fet**:
- Creat `lib/services/paymentReminderService.ts`
- Cerca reserves amb pagament pendent i event < 14 dies
- No repeteix si ja enviat en últims 7 dies (via AdminLog)
- Integrat al cron `commercial-daily`
- Email en HTML amb import pendent, dies fins l'event

#### Bloc 5: Portal client automàtic en COMPLETED
**Per què**: Quan una reserva es marcava COMPLETED, l'operador havia de crear manualment el portal. Pas mecànic que s'oblidava.
**Què s'ha fet**:
- `app/api/admin/bookings/[id]/route.ts` — al canvi a COMPLETED:
  - Auto-crea `ClientPortalAccess` via `issueClientPortalAccess()`
  - Envia email al client amb enllaç del portal
  - Registra a AdminLog
  - No bloqueja el canvi d'estat si falla

#### Bloc 6: Cron setmanal sync preus pack
**Per què**: `packPricingHealth.ts` calcula preu recomanat, però l'operador havia d'anar manualment a revisar. Si els costos canviaven, els preus quedaven desactualitzats.
**Què s'ha fet**:
- Creat `app/api/cron/pack-pricing-check/route.ts`
- Analitza divergència per cada pack actiu
- Si >15% → crea Task amb prioritat proporcional
- No canvia preus automàticament (decisió comercial)

#### Bloc 8: Cache intel·ligent de scoring
**Per què**: `scoreLead()` es cridava per cada lead a cada renderització. Amb 200+ leads, feina repetida.
**Què s'ha fet**:
- Afegit `cachedScore` i `cachedScoreAt` al model Lead (schema Prisma)
- Migració: `20260501090000_add_lead_cached_score`
- Cron `commercial-daily` actualitza scores de tots els leads actius

#### Bloc 10: CAC real des de dades
**Per què**: CAC era estimacions fixes (Instagram=35€, etc). No reflectien la realitat.
**Què s'ha fet**:
- Creat `lib/services/cacAnalysis.ts` — `buildCacAnalysis()`
- Per canal: leads totals, guanyats, taxa conversió, CAC ponderat
- Comparativa CAC estimat vs real a Economia → pestanya Previsions

#### Bloc 9: Dashboard financer enriquit
**Per què**: Dashboard mostrava marge i facturació, però faltaven KPIs financers clau.
**Què s'ha fet**:
- `dashboard-data.ts` — afegit `cashFlowNet30`, `pipelineWeighted30`, `pendingPayments`
- `app/admin/page.tsx` — 3 cards noves: Flux net previst, Pipeline ponderat, Pendent de cobrar
- Tot resilient amb catch (no bloqueja dashboard si un servei falla)

### Verificació
- `npx tsc --noEmit` → 0 errors nous (2 pre-existents en portal/booking page)
- `npx vitest run` → **167 tests, 14 fitxers, tots passen** (151→167, +16 nous)
- 6 nous serveis creats, 4 API routes noves, 2 crons nous
- Tots els càlculs de marge ara via costEngine (font única)

### Fitxers nous creats
- `lib/services/costEngine.ts`
- `lib/services/cashFlowForecast.ts`
- `lib/services/pipelineForecast.ts`
- `lib/services/paymentReminderService.ts`
- `lib/services/cacAnalysis.ts`
- `app/api/admin/economia/cash-flow/route.ts`
- `app/api/admin/economia/forecast/route.ts`
- `app/api/cron/pack-pricing-check/route.ts`
- `prisma/migrations/20260501090000_add_lead_cached_score/migration.sql`
- `__tests__/lib/services/costEngine.test.ts`
- `__tests__/lib/services/vehicleCost.test.ts`

### Fitxers modificats
- `lib/services/travelCost.ts` — calculateEffectiveVehicleCostPerKm, constants noves
- `lib/services/fuelReferenceService.ts` — getEffectiveVehicleCostPerKm
- `lib/services/profitabilityService.ts` — delega a costEngine
- `app/admin/bookings/page.tsx` — computeSimpleMarginPct del costEngine
- `app/admin/lib/dashboard-data.ts` — costEngine + KPIs financers
- `app/admin/page.tsx` — 3 cards dashboard noves
- `app/admin/economia/EconomiaClient.tsx` — 2 pestanyes noves + vehicle config + CAC
- `app/admin/economia/page.tsx` — integració dades noves
- `app/api/admin/bookings/[id]/route.ts` — portal auto-created en COMPLETED
- `app/api/cron/commercial-daily/route.ts` — recordatoris + scoring cache
- `prisma/schema.prisma` — cachedScore, cachedScoreAt al Lead

---

#### ✅ Corregir ESLint config (build bloquejat)
**Per què**: La regla `@typescript-eslint/no-explicit-any: warn` va ser afegida a la sessió 2026-02-23, però sense registrar el plugin `@typescript-eslint` explícitament. `next/core-web-vitals` no el registra de forma que les regles siguin accessibles directament. Resultat: `npm run build` fallava amb "Definition for rule not found".
**Què s'ha fet**:
- Afegit `plugin:@typescript-eslint/recommended` als extends (registra el plugin)
- Desactivades regles noves que `recommended` activa per defecte i que trencarien el codebase: `no-unused-vars`, `no-require-imports`, `prefer-as-const`, `no-unsafe-function-type`, `prefer-const`
- `npm run build` → **èxit** (compilació + lint + 235 pàgines generades)

---

## 2026-02-26 — Auditoria UX completa admin

### Context de la sessió
L'operador (no expert tècnic) utilitza l'admin sol per gestionar un negoci d'events. Algunes pàgines clau (reserves, clients) estaven per sota del nivell de les altres (leads, tasques). Cal unificar l'experiència.

### Treball realitzat

#### ✅ Reserves: Filtres + cerca
**Per què**: La pàgina de reserves no tenia filtres ni cerca. L'API ja suportava `status`, `eventType`, `fromDate`, `toDate`, `search` però la pàgina no els passava. Amb 30+ reserves, trobar-ne una requeria fer scroll.
**Què s'ha fet**:
- `BookingFilters.tsx` creat — barra de filtres client-side amb cerca (debounce 300ms), selects d'estat i tipus, dates des de/fins a, botó "Netejar filtres"
- `bookings/page.tsx` — `searchParams` ampliat a `status`, `eventType`, `fromDate`, `toDate`, `search`, `view`
- Query Prisma amb `where` dinàmic basat en filtres (ja existent a l'API)
- Paginació conserva filtres a la URL

#### ✅ Reserves: Vista kanban amb drag & drop
**Per què**: Leads i tasques tenen kanban, reserves no. L'operador vol veure el flux d'un cop d'ull i moure reserves d'estat amb drag.
**Què s'ha fet**:
- `BookingPipelineView.tsx` creat — 4 columnes (PENDING → CONFIRMED → PREPARING → COMPLETED), CANCELLED ocultes
- Drag & drop HTML5 amb optimistic updates via `PATCH /api/admin/bookings/{id}/status`
- Cards compactes: referència, nom client, data, total, marge, paga pendent
- Botons ← → per a mòbil (com a TaskKanbanView)
- Mètriques per columna: total reserves, facturació
- `BookingViewToggle.tsx` creat — toggle Llista/Kanban via searchParam `view=kanban`

#### ✅ Clients: alert() → toast + Export CSV
**Per què**: `window.alert()` a la pàgina de clients — UX amateur. I clients no tenia export CSV (leads i reserves sí).
**Què s'ha fet**:
- `alert()` substituït per `toast.success()` (hook `useToast()` que ja existia)
- `ExportCsvButton` afegit amb headers: Nom, Email, Telèfon, Ciutat, Font, Esdeveniments, Despesa total, VIP

#### ✅ Pipeline Leads: Filtres interactius + score
**Per què**: La vista pipeline rebia filtres del servidor però no es podien canviar localment (cada canvi recarregava). I el score es calculava però no es veia a les targetes.
**Què s'ha fet**:
- Filtres locals (no recarrega pàgina): FilterChips clicables per prioritat, tipus event, font + cerca inline amb debounce
- Botó "Netejar" per reiniciar filtres locals
- Score badge a cada card: si hi ha `cachedScore` l'usa, si no, estima (budget+phone+eventDate+email)
- Colors: verd >70, ambre >40, vermell ≤40

#### ✅ Navegació: Simplificar
**Per què**: 31 ítems al menú, sobrecàrrega cognitiva per a un operador sol.
**Què s'ha fet**:
- **Prioritat** (7→5): Eliminats Entrada ràpida (accessible des de Leads), Pressupost PDF, Mapa admin
- **Operativa** (5→4): Eliminat Calendari (mogut a Prioritat)
- **Eines** (12→7): Eliminats FAQ, Textos PRO, Canvas, Google Reviews, Operativa vendes (poc usats, accessibles via Ctrl+K)
- **Config** (7→4): Eliminats Plantilla pressupostos (dins config), Traduccions, CSS PRO

#### ✅ Bottom nav: Millorat
**Per què**: Analítica apareixia al bottom nav mòbil i a "Eines". I l'operador necessita accés ràpid al calendari.
**Què s'ha fet**:
- Bottom nav: Tauler, Entrades, Reserves, Calendari, Més (obre sidebar)
- "Més" és un botó que obre el sidebar, no un link

#### ✅ Bidireccionalitat: Botó entrada original
**Per què**: Des de la fitxa de reserva, el link a l'entrada original estava amagat al peu d'una secció.
**Què s'ha fet**:
- Botó "📥 Entrada original" afegit al header d'`AdminPage` (al costat de "👤 Fitxa Client")
- Només visible si hi ha lead associat

#### ✅ Fix errors TypeScript preexistents (21→0)
**Per què**: `useSearchParams()` pot retornar `null` en Next.js 14 strict mode. 15 fitxers tenien `searchParams.get()` sense null check. El build fallava.
**Què s'ha fet**:
- 11 fitxers arreglats amb optional chaining (`searchParams?.get()`)
- `layout.tsx` — `isActive()` ara retorna `boolean` explícit (no `boolean | undefined`)
- `LanguageSelector.tsx`, `MobileBottomNav.tsx` — `pathname` nullable arreglat
- Build complet: **233 pàgines generades, 0 errors**

### Fitxers nous creats
- `app/admin/bookings/BookingFilters.tsx`
- `app/admin/bookings/BookingPipelineView.tsx`
- `app/admin/bookings/BookingViewToggle.tsx`

### Fitxers modificats
- `app/admin/bookings/page.tsx` — filtres, toggle kanban, searchParams ampliat
- `app/admin/bookings/[id]/page.tsx` — botó "Entrada original" al header
- `app/admin/clientes/page.tsx` — toast, CSV export
- `app/admin/leads/LeadPipelineView.tsx` — filtres locals, score badge, estimateScore()
- `app/admin/components/nav-items.ts` — simplificat (31→20 ítems)
- `app/admin/layout.tsx` — bottom nav millorat, isActive fix
- `app/[locale]/valoracio/client.tsx` — fix searchParams nullable
- `app/admin/blog/page.tsx` — fix searchParams nullable
- `app/admin/bookings/new/page.tsx` — fix searchParams nullable
- `app/admin/inbox/settings/InboxSettingsClient.tsx` — fix searchParams nullable
- `app/admin/post-event/reports/new/page.tsx` — fix searchParams nullable
- `app/admin/tasks/new/page.tsx` — fix searchParams nullable
- `app/components/mobile-ultimate/MobileBottomNav.tsx` — fix pathname nullable
- `app/components/ui/LanguageSelector.tsx` — fix pathname nullable
