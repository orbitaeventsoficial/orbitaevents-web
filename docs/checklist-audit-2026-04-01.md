# Checklist Audit Admin — 2026-04-01

## FETA (Claude Code)

- [x] CLAUDE.md reescrit — Protocol de Treball complet (~320L)
- [x] 11 loading.tsx creats (collaborators, portfolio, canvas, cost-calculator, scripts, crons, privacy, intake, activity, settings/company, settings/hero)
- [x] 2 guies marcades TANCAT (guia-portfolio-blog-upgrade.md, guia-configurador-upgrade.md)
- [x] TypeScript: 0 errors verificat
- [x] Analisi completa admin — 6 agents, informe lliurat
- [x] **A11y Tabs** — role="tablist" + role="tab" + aria-selected a:
  - BookingViewToggle.tsx
  - InventoryListClient.tsx
  - EconomiaClient.tsx
  - BlogEditorForm.tsx
- [x] **A11y Filtres** — role="navigation" + aria-label a:
  - LeadPipelineView.tsx
  - ActivityClient.tsx
- [x] **A11y Botons icona** — aria-label a:
  - ToastProvider.tsx (boto tancar)
  - BookingGallery.tsx (boto eliminar foto)
- [x] **A11y Drag handles** — aria-label a:
  - BookingPipelineView.tsx (cards reserva)
  - SortableList.tsx (elements ordenables)
  - EditPackForm.tsx (inventari available + included)
- [x] TypeScript post-a11y: 0 errors

## FETA (Codex)

- [x] **P0 Auth** — Verificat i tancat el bloc de rutes sospitoses
  - afegit `requireAuth` a:
    - `app/api/admin/activity/route.ts`
    - `app/api/admin/collaborators/route.ts`
    - `app/api/admin/collaborators/[id]/route.ts`
    - `app/api/admin/custom-quotes/route.ts`
    - `app/api/admin/custom-quotes/[id]/route.ts`
  - falsos positius confirmats:
    - `app/api/admin/leads/[id]/quote/route.ts` → auth ja aplicada a `lib/services/leads/quoteRouteHandler.ts`
    - `app/api/admin/leads/[id]/status/route.ts` → auth ja aplicada a `lib/services/leads/statusRouteHandler.ts`
- [x] **P1 N+1** — `lib/services/commercialDailyAutomationService.ts`
  - eliminat el loop d'updates individuals sense batching
  - ara els updates de score es fan per lots amb `prisma.$transaction(...)`
- [x] **P1 Paginacio** — limits hardcodejats revisats i millorats
  - `lib/services/profitabilityService.ts` → eliminat el tall arbitrari `take: 1500`; lectura per lots
  - `lib/services/proposalAdminService.ts` → paginacio real (`page`, `limit`, `skip`, `count`)
  - `lib/services/invoiceAdminService.ts` → paginacio real (`page`, `limit`, `skip`, `count`)
  - `app/api/admin/proposals/route.ts` i `app/api/admin/invoices/route.ts` ara passen `page/limit`
- [x] **P1 Test** — creat `__tests__/lib/services/commercialDailyAutomationService.test.ts`
- [x] **P1 Monocapa** — `privacyService.ts` i `app/api/admin/privacy/consents/route.ts` consumeixen constants compartides de `lib/constants/privacy.ts` per l'estat de consentiment
- [x] **P2 Rendiment client** — pipelines memoitzats
  - `LeadPipelineView.tsx` usa `useDeferredValue` per la cerca local i deriva columnes amb `useMemo`
  - `BookingPipelineView.tsx` memoitza la construcció de columnes del kanban
- [x] **P2 Índexs Prisma (schema)**
  - afegits a `prisma/schema.prisma`:
    - `Lead @@index([status, updatedAt])`
    - `Booking @@index([depositPaid, eventDate])`
    - `Invoice @@index([customerId, status])`
  - pendent només d'aplicar-se a BD via `prisma db push` o migració quan toqui
- [x] **Validacio Codex**
  - `npx tsc --noEmit` OK
  - `pnpm test:run` OK (tests afectats de serveis)
  - `npx prisma format` OK

## NO PRIORITARI (futur)

- [x] Refactoritzar `NewBookingForm.tsx` (estabilitzat per Codex amb components i hooks extrets: `BookingPricingSummary.tsx`, `BookingPackExtrasSection.tsx`, `BookingTravelDiscountSection.tsx`, `BookingClientEventSection.tsx`, `useNewBookingInitialData.ts`, `useNewBookingSubmit.ts`, `useBookingDiscountValidation.ts`, `useBookingDistance.ts`, `useBookingDateConflicts.ts` i `useBookingPricing.ts`)
- [x] Extreure `GenericPipelineView<T>` (eliminar duplicacio Leads/Bookings) — `PipelineBoard.tsx` genèric, `LeadPipelineView` i `BookingPipelineView` refactoritzats
- [x] Unificar empty states en 1 component (passada segura aplicada a FAQ, Settings, Discount Codes, Clients, Coverage, Features, Stats i Blog)
- [x] Hook `useAsyncForm()` per consolidar patro formulari (aplicat a NewPackForm, Nova tasca i Discount Codes)
- [x] Virtualitzacio llistes llargues (500+ items pipeline) — windowing zero-dependency a `PipelineBoard.tsx`, activat a leads i bookings
- [ ] Debounce + memoitzacio a pipelines













## BLOC CLAUDE (evitar solapament)

- [x] `GenericPipelineView<T>` per Leads/Bookings — `PipelineBoard.tsx` creat, ambdós pipelines refactoritzats
- [x] Virtualitzacio de llistes llargues (500+ items pipeline)
- [x] Rematats d'accessibilitat — aria-label afegit a 8 botons ✕ sense label:
  - BookingStatusChanger.tsx (2), LeadActions.tsx, BookingInventorySection.tsx, InvoiceSection.tsx, post-event/reports/new/page.tsx, text-manager/page.tsx, InboxModals.tsx (QuoteModal)
- [x] Mode ajuda contextual — data-help-title/desc afegit a:
  - 6 panells hub client: ProposalsPanel, BookingsPanel, CommsPanel, TasksNotesPanel, LeadsPanel, PrivacyPanel
  - lead detail: reserva associada, metadades, UTM, relació client, historial, timeline comercial
- [x] Cobertura contextual data-help (ronda 2, 2026-04-01):
  - `emails/InboxPanel.tsx` — safata IMAP, paginació
  - `tasks/page.tsx` — wrapper kanban
  - `calendario/CalendarMonthClient.tsx` — navegació mes, graella, detall dia
  - `inventory/InventoryListClient.tsx` — KPIs, lots/equips, alerta estoc baix
  - `cost-calculator/CostCalculatorClient.tsx` — grid principal, sidebar components, resum marge
  - `clientes/[id]/panels/SummaryPanel.tsx` — secció general, contacte, resum operatiu, accions ràpides
  - `clientes/[id]/panels/MarginExtrasPanel.tsx` — extres i marge
  - `clientes/[id]/panels/DiscountsPanel.tsx` — descomptes del client
- [x] TypeScript post-ajuda ronda 2: 0 errors
- [x] Playwright validació data-help a leads/clientes/economia — 6/6 passed
  - spec: `e2e/admin-help-leads-clients-eco.spec.ts`
  - captures: `admin-help-leads.png`, `admin-help-clients.png`, `admin-help-economia.png`
- [x] **Performance (2026-04-02)**:
  - `revalidate = 86400` a tematica-halloween i tematica-mon-magic (ISR 24h)
  - 3 AVIF mon-magic comprimits (quality 75, resolució intacta 3200px)
  - 2 fitxers .bak eliminats (-9.3MB)
  - Dashboard admin: 5 `await` seqüencials → 1 sol `Promise.all` (~7.2s → ~2-3s)
  - Prisma indexes aplicats a Railway (`prisma db push`)
  - Fix portfolio build error (comilla escapada)
  - Fix test brightness obsolet (1796/1796 OK)
- [x] **Galeria ZoneLandingPage service-aware (2026-04-02)**:
  - `publicServiceMediaService.ts` ja existent amb `getPublicServiceGalleryImages(key, limit)`
  - `ZoneLandingPage.tsx` actualitzat per Codex amb claus i18n per servei
  - Traduccions `galleryTitleByService`, `viewMoreByService`, `galleryAltByService` a ca/es/en
  - Claus duplicades velles (`galleryTitle`, `viewMoreWeddings`) eliminades dels 3 JSONs
- [x] **Fix build: googleReviewsStaticFile.ts** — `fs` condicional per evitar error webpack en client
- [ ] Unificacions secundaries de patro fora de `NewBookingForm` si aporten valor real
- [ ] No tocar hooks/components ja extrets per Codex a NewBookingForm

## PUNT ACTUAL CODEX

- [x] `NewBookingForm.tsx` descomprimit en components i hooks sense canviar comportament base
- [x] Components extrets: `BookingClientEventSection.tsx`, `BookingPackExtrasSection.tsx`, `BookingTravelDiscountSection.tsx`, `BookingPricingSummary.tsx`
- [x] Hooks extrets: `useNewBookingInitialData.ts`, `useNewBookingSubmit.ts`, `useBookingDiscountValidation.ts`, `useBookingDistance.ts`, `useBookingDateConflicts.ts`
- [x] `booking-form.types.ts` consolidat i consumit pels hooks/components principals de `NewBookingForm`


## NOTA FINAL CODEX

- [x] `NewBookingForm.tsx` queda estabilitzat i validat amb `npx tsc --noEmit`
- [x] Fora del bloc Codex: virtualitzacio real del pipeline tancada; només queden polishes opcionals del kanban si es vol anar més enllà

## AJUDA CONTEXTUAL ADMIN

- [x] `AdminHelpOverlay.tsx` sense llegenda lateral fixa; ajuda només contextual a pantalla
- [x] `AdminHelpMode.tsx` persistent per a usuaris novells
- [x] `nav-items.ts` amb descripcions compartides de navegació
- [x] `layout.tsx` propaga `data-help-title` i `data-help-desc` a sidebar i bottom nav
- [x] `Tooltip.tsx` exposa el mateix text al mode ajuda
- [x] cobertura de controls compartits:
  - `QuickActions.tsx`
  - `ExportCsvButton.tsx`
  - `StatusQuickSelect.tsx`
  - `LeadViewToggle.tsx`
  - `BookingViewToggle.tsx`
- [x] cobertura principal de la home admin a `app/admin/page.tsx`
  - accessos ràpids
  - objectiu mensual
  - pilot automàtic
  - checklist
  - centre de comandament
  - radar
  - gràfiques principals
  - mini-cards
  - auditoria recent
- [x] `dashboard-widgets.tsx` accepta `helpText` / `helpTitle` a `MetricCard`, `Card` i `Button`
- [x] validació real visual amb Playwright
  - spec: `e2e/admin-help-home.spec.ts`
  - captures: `e2e/screenshots/admin-home-help-inbox.png`, `admin-home-help-objectiu.png`, `admin-home-help-pilot.png`, `admin-home-help-command.png`, `admin-home-help-audit.png`
- [x] cobertura contextual afegida a:
  - `app/admin/leads/LeadPipelineView.tsx`
  - `app/admin/bookings/BookingPipelineView.tsx`
  - `app/admin/economia/EconomiaClient.tsx`
  - `app/admin/clientes/page.tsx`
  - `app/admin/leads/[id]/page.tsx`
  - `app/admin/leads/[id]/LeadGuidedFlow.tsx`
  - `app/admin/bookings/[id]/page.tsx`
  - `app/admin/bookings/[id]/BookingSectionNav.tsx`
  - `app/admin/clientes/[id]/_components/CustomerHubClient.tsx`
  - `app/admin/clientes/[id]/_components/CustomerHeader.tsx`
  - `app/admin/clientes/[id]/_components/TimelinePanel.tsx`
  - `app/admin/leads/[id]/LeadWorkspace.tsx`
  - `app/admin/bookings/[id]/BookingMarginCard.tsx`
  - `app/admin/bookings/[id]/InvoiceSection.tsx`
  - `app/admin/bookings/[id]/DocumentFlowSection.tsx`
- [x] validació visual addicional estable amb Playwright
  - spec: `e2e/admin-help-pages.spec.ts`
  - captura: `e2e/screenshots/admin-help-bookings.png`
- [x] validació visual estable addicional amb Playwright
  - spec: `e2e/admin-help-calendar-emails.spec.ts`
  - captures: `admin-help-calendar-week.png`, `admin-help-calendar-day.png`, `admin-help-emails.png`
- [x] rematats els punts pendents de `app/admin/leads/[id]/page.tsx` (sidebar i reserva associada)
- [x] rematat el bloc `Timeline comercial` de `app/admin/leads/[id]/LeadWorkspace.tsx`
- [x] cobertura contextual principal afegida a `emails`, `inbox`, `tasks` i `salut`
- [x] cobertura contextual afegida a `CalendarWeekClient.tsx`, `CalendarDayClient.tsx` i `RecentEmailsTable.tsx`
- [x] cobertura contextual afegida a `EmailStatsCards.tsx`, `ManualActionsPanel.tsx` i `EmailConfigPanel.tsx`
- [x] cobertura contextual afegida a `EmailStatsCards.tsx`, `ManualActionsPanel.tsx` i `EmailConfigPanel.tsx`
- [x] validació visual estable addicional amb Playwright
  - spec: `e2e/admin-help-calendar-emails.spec.ts`
  - captures: `admin-help-calendar-week.png`, `admin-help-calendar-day.png`, `admin-help-emails.png`
- [ ] pendent futur: estendre cobertura fina pàgina per pàgina fora de la home i ampliar validació visual real a calendari, emails i altres pantalles secundàries

## REVIEW POST-CLAUDE (Codex)

- [x] revisada la feina grossa de Claude als blocs de pipelines, ajuda contextual i accessibilitat
- [x] `PipelineBoard.tsx` corregit
  - eliminat el `setTimeout(...syncColumnHeight...)` dins del `ref` de columna per evitar soroll de render al component base compartit
- [x] `LeadPipelineView.tsx` corregit
  - afegits `aria-label` als botons de moviment entre columnes
- [x] `BookingPipelineView.tsx` corregit
  - afegits `aria-label` als botons de moviment entre columnes
  - afegits `aria-label` als botons mòbils de canvi d'estat
- [x] `layout.tsx` corregit
  - les `description` definides a `nav-items.ts` ara sí es propaguen a `data-help-title` / `data-help-desc` a sidebar i bottom nav
- [x] validació post-review Claude
  - `npx tsc --noEmit` OK

## INTEGRACIO FAVICONS I MANIFEST

- [x] `app/layout.tsx` alineat amb `manifest.webmanifest`
- [x] `app/layout.tsx` usa `apple-touch-icon.png` com a icona Apple canònica
- [x] `app/admin/layout.tsx` alineat amb `manifest.webmanifest`
- [x] `app/admin/layout.tsx` usa `apple-touch-icon.png` en lloc de `favicon-192.png`
- [x] `app/config/site-config.ts` alineat amb els assets canònics (`favicon.svg` + `apple-touch-icon.png`)
- [x] verificat que l'app principal ja no depèn de `manifest.json` per defecte; queda com a fitxer legacy si algun entorn extern encara el consumeix
- [x] validació d'integració
  - `npx tsc --noEmit` OK

## AUDITORIA DOBLE FONT

- [x] `portfolio` classificat com a cas crític de doble font
  - `app/admin/portfolio/page.tsx` llegia portfolio editable de BBDD/API admin
  - `app/[locale]/portfolio/[slug]/page.tsx` barrejava catàleg estàtic + booking photos + `PortfolioMedia` / `PortfolioEvent`
  - l'admin mostra el catàleg públic actual en mode lectura quan la BBDD és buida o falla la ruta
- [x] `hero media` classificat com a gairebé alineat
  - la font operativa principal és `lib/services/heroVideoService.ts` sobre `Setting(config.heroMedia)`
  - el fallback públic ara surt d'una font compartida (`lib/constants/hero-media.ts`)
- [x] `reviews` classificat com a multi-font per disseny
  - `app/api/google-reviews/route.ts` fusiona JSON estàtic, cache de Setting, testimonials de BBDD i APIs de Google
  - la lectura del JSON estàtic queda consolidada a `lib/services/googleReviewsStaticFile.ts`
- [x] `portfolio` categoria pública prioritzada a media real
  - `app/[locale]/portfolio/[slug]/page.tsx` ara prioritza `PortfolioMedia` i, si no n'hi ha, `booking photos`; el catàleg estàtic queda només com a fallback
- [x] `portfolio` portada pública més solidària amb BBDD
  - `app/[locale]/portfolio/page.tsx` usa `PortfolioEvent.coverImage` publicat per categoria quan existeix; el `cover` estàtic queda com a fallback
- [x] `portfolio` metadata pública alineada amb media real
  - `app/[locale]/portfolio/[slug]/page.tsx` prioritza `PortfolioMedia`, després booking photos i events, i només al final l'estàtic per OG/SEO
- [x] `landing de Halloween` més solidària amb portfolio real
  - `app/[locale]/tematica-halloween/page.tsx` prioritza `PortfolioMedia`, després booking photos i només al final la selecció estàtica
  - `app/[locale]/tematica-halloween/client.tsx` ja rep la galeria des del servidor en lloc de llegir `PORTFOLIO_IMAGES` directament
- [x] `Món Màgic` més solidari amb portfolio real
  - `app/[locale]/tematica-mon-magic/page.tsx` construeix ara un `imageSet` DB-first via `PortfolioMedia` i `booking photos`, amb fallback estàtic
  - `app/[locale]/tematica-mon-magic/client.tsx` consumeix aquest `imageSet` en lloc de dependre només de `PUBLIC_MON_MAGIC_IMAGES`
  - corregit el tipus perquè admeti URLs reals provinents de BBDD
- [x] `sitemap` del portfolio alineat amb BBDD
  - `app/sitemap.ts` inclou també events publicats del `portfolio` des de `PortfolioEvent`
- [x] `home showcase` alineat entre desktop, mòbil i BBDD
  - `lib/services/publicPortfolioShowcaseService.ts` defineix un model compartit amb prioritat `PortfolioMedia` → `booking photos` → fallback estàtic
  - `app/[locale]/page.tsx` carrega aquest model al servidor
  - `app/components/marketing/PortfolioShowcase.tsx` i `app/components/mobile-ultimate/MobilePortfolioShowcase.tsx` consumeixen les mateixes dades
  - `app/components/HomePageWrapper.tsx` i `app/components/mobile-ultimate/MobileHomePage.tsx` passen el mateix contingut a la versió mòbil
- [ ] pendent residual honest
  - `MobileServicesCards.tsx` ja consumeix `listPublicMobileServiceCardImages()` i no depèn del `showcase` com a font funcional
  - els showcases mantenen fallback estàtic tècnic per no deixar la home cega si la BBDD o la galeria fallen




## TANCAT — 2026-04-02 — ZoneLandingPage service-aware i galeria local compartida
- `lib/services/publicServiceMediaService.ts`: afegits `getPublicServicePortfolioSlug(...)` i `getPublicServiceGalleryImages(...)`
- `app/components/zones/ZoneLandingPage.tsx`: galeria, CTA, `alt` i enllaç a portfolio resolts per servei, sense biaix a bodes
- `app/[locale]/servicios/dj-bodas-*`, `app/[locale]/servicios/dj-fiestas-*`, `app/[locale]/servicios/discomovil-*`: `galleryImages` ja no són seleccions estàtiques locals; passen per la mateixa capa compartida que el hero i l'OG
- `messages/ca.json`, `messages/es.json`, `messages/en.json`: noves claus `galleryTitleByService`, `viewMoreByService`, `galleryAltByService`
- validació: `npx tsc --noEmit` OK


## TANCAT — 2026-04-02 — Home mòbil alineada amb capa pròpia de media de serveis
- `lib/services/publicServiceMediaService.ts`: ampliada per cobrir `halloween` i `monmagic`, i afegit `listPublicMobileServiceCardImages()`
- `app/[locale]/page.tsx`: carrega les imatges de targetes mòbil al servidor
- `app/components/HomePageWrapper.tsx` i `app/components/mobile-ultimate/MobileHomePage.tsx`: passen aquestes dades cap a la versió mòbil
- `app/components/mobile-ultimate/MobileServicesCards.tsx`: ja no recicla `portfolioStories`; consumeix una capa pròpia per a les targetes de serveis
- validació: `npx tsc --noEmit` OK

## TANCAT - 2026-04-02 - Base del gestor d imatges
- `app/admin/image-manager/page.tsx`: nova UI admin per governar placements visuals
- `app/admin/image-manager/image-manager-config.ts`: seccions i claus inicials del sistema
- `app/api/admin/image-manager/route.ts`: lectura i escriptura autenticada del gestor
- `lib/services/imageManagerService.ts`: persistencia sobre `Setting(JSON)` i lectura d overrides manuals
- `lib/services/publicServiceMediaService.ts`: integra overrides del gestor per a serveis base, Halloween, Mon Magic i targetes mobil
- `app/[locale]/portfolio/page.tsx`: les cobertes de categories del portfolio tambe poden quedar forcades per clau (`portfolio.category.*.cover`)
- `app/admin/components/nav-items.ts`: nova entrada `Imatges` al panell admin
- validacio: `npx tsc --noEmit` OK


## TANCAT - 2026-04-02 - Image manager connectat a OG general, Halloween i Mon Magic
- `app/layout.tsx`: `seo.og.default` ja pot forcar l imatge OG per defecte del projecte
- `app/[locale]/tematica-halloween/page.tsx`: hero i galeria alineats amb la capa compartida de serveis/tematiques
- `app/[locale]/tematica-mon-magic/page.tsx`: hero i imageSet alineats amb la mateixa capa compartida
- validacio: `npx tsc --noEmit` OK
