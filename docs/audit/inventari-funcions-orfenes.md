# 🗂️ Inventari global de funcions ÒRFENES (refer o matar) — 2026-06-28

> Funcions exportades de **tot `lib/**`** (services + utils + helpers, els 2 estils
> `export function` i `export const NAME = () =>`) que NO tenen cap consumidor de
> producció (verificat a app/ + lib/, incloent el mateix fitxer menys la definició).
> **Òrfena ≠ morta**: pot ser una funció DEMANADA que es va quedar desconnectada en
> un refactor. El propietari decideix cada una: **REFER** (reconnectar) o **MATAR**.
>
> Verificat que NO és fals positiu: `cn`/`formatPhone`/`getEnv` confirmats amb 0 usos
> a tot el repo (app/lib/components/pages/hooks). Detecció: `scratchpad/build-orphan-inventory.mjs`.
> Edat = commit que la va introduir (vella→probable abandó · recent→probable òrfena per refactor).
> Test = té test propi (sí vol dir que la lògica està coberta encara que no es cridi).
>
> Actualització 2026-07-11 (#1951): el mapa queda sincronitzat amb els clústers ja
> tancats al diari/protocol. RGPD queda parcialment tancat (#1934: `recordConsent` i
> `executeRetentionPolicies` són vius; 8 funcions llegades mortes), utils/cost queden
> tancats (#1938), resta queda tancada (#1941), gestió antiga de hero queda tancada
> (#1942), Grup A de `normalize.ts` queda tancat (#1944), `customerSegmentationService`
> dashboard queda tancat (#1946), els helpers antics de gallery/portfolio/media que ja
> no existeixen al codi actual queden marcats com a MATATS #1948 i els exports antics de
> tracking públic queden MATATS #1950. El Grup B de validació/format de `normalize.ts`
> queda MATAT #1951: no tenia cap consumidor real i connectar-lo hauria obert un segon
> carril de validació sense contracte de producte. El clúster `email.ts`
> testimonials/privacy queda tancat #1953: es mata l'export vell de resolució RGPD,
> es confirma que els tres exports antics de testimonials ja no existeixen, i el
> recordatori admin real passa per `sendTrackedStandaloneEmail` des de la ruta manual.
> `deriveFlowStatus` queda MATAT #1954: el producte viu usa la timeline canònica amb
> `deriveFlowStatusFromTimeline`.
> `shouldEnforceCsrf` queda MATAT #1955: la política viva és `verifyCsrf` als
> handlers, `fetchWithCsrf` al client i els guards/scripts CSRF.
> `INVENTORY_IMAGE_USER_AGENT` queda VIU #1956: el fitxer real és
> `lib/inventory-image-constants.ts` i la constant alimenta la localització
> d'imatges d'inventari.
> `getDefaultHomeMeta` queda MATAT #1957: ja no existeix al codi actual; la via
> viva és `getHomeMeta`/`getHomeKeywords`.
> `clearFetchEmailCache` i `clearSpecialFoldersCache` queden MATATS #1958: eren
> exports de neteja global sense consumidor; la cache viva continua dins
> `fetchEmailByUid`, amb `invalidateFetchEmailCache` per mutacions IMAP i
> `discoverSpecialFolders(forceRefresh)` per refresc explícit de carpetes.
> `getAdminLeadPackOptions` queda MATAT #1959: era un adapter admin sense
> consumidor real; la font viva de packs continua sent `app/config/packs-config.ts`
> consumida directament per configurador, admin packs, serveis i scripts.
> `getOpenAPIJSON` queda MATAT #1960: era un wrapper de serialització només
> sostingut pel test; la via viva és `openAPISchema` servit per `/api/docs`.
> `getOrbitaService` queda MATAT #1961: era un accessor sense consumidor; la
> font viva continua sent `ORBITA_SERVICES` i els helpers de preu/equip del mateix
> mòdul.
> Helpers href de lead tancats #1962: `buildLeadCustomerContinuityTarget`,
> `buildLeadPaymentsHref` i `buildLeadTaskHref` queden MATATS perquè només els
> sostenien tests; continuen vius `buildLeadWorkspaceHref`, `buildLeadCustomerHref`,
> compose i booking prefill.
> `indexProtocolSectionsById` queda MATAT #1963: només el sostenia el test;
> `parseProtocolSections` continua viu a `/admin/docs/protocol` i
> `indexProtocolCanvisByNumber` continua com a indexador de canvis.
> `publicServiceMediaService` queda tancat #1965: `getPublicServicePortfolioSlug`
> era una entrada stale que ja no existeix i `listPublicMobileServiceCardImages`
> queda MATAT perquè només el sostenia el test; hero/gallery públiques continuen
> sent la via viva.
> `loadSocialPerformanceReport` queda MATAT #1966: era un wrapper Prisma sense
> consumidor; les funcions pures de mètriques socials continuen vives i
> `socialContentPulseService` conserva `computeConsistencyScore`.
> `pricing-intelligence.ts` queda MATAT #1967: `computeCollaboratorCost`,
> `computeFullBookingCost`, `getHourlyColor` i `getPriceDeviationAlert` eren un
> motor de cost/marge paral·lel (dissenyat, testejat, mai importat des de cap
> pàgina) que duplicava `costEngine.ts` (`computeBookingFinancialSummary`), el
> cervell viu de cost/marge segons la doctrina "un sol cervell, moltes pàgines".
> Es conserven `resolveServicePricingKey`, `getEquipmentCostPerHour`,
> `getMarginColor`, `SERVICE_HOURLY_RATES` i `MARGIN_TONES`, que sí alimenten
> `/admin/pricing`. Nota fora d'abast d'aquest tall:
> `PRICING_INTELLIGENCE` (llindars de marge/hourlyRate/priceDeviation/business),
> `MARGIN_ADVICE` i `SOLIDARITY_RULES` queden ara sense cap consumidor extern
> però són constants de configuració, no funcions d'aquest inventari — caldria
> un audit separat si es vol decidir el seu destí.
> `handleAdminAuth` queda VIU #1968: era un fals positiu perquè el consumidor
> real és `middleware.ts` a l'arrel del repo, fora del perímetre original
> `app/lib/components/pages/hooks`.
> Tancament final #1969: `computeProductMargin`, `computeSupportableTravelKm` i
> `getDossiersByLead` ja no existeixen al codi actual i queden MATATS al mapa.

## Clústers + recomanació (per decidir per blocs)

| Clúster | Funcions | Edat | Recomanació de l'auditor |
|---|---|---|---|
| **privacyService (RGPD)** | `recordConsent` i `executeRetentionPolicies` són vius; getActiveConsents, hasActiveConsent, processDataRequest, getPendingDataRequests, getAuditHistory, getAuditSummary, getCurrentLegalVersion, checkGdprCompliance (8) | 2025-12 | ✅ PARCIAL TANCAT #1934 — les 8 llegades es maten; les 2 vives es conserven perquè alimenten formulari públic i cron. |
| **heroVideoService (gestió hero)** | addHeroMedia, removeHeroMedia, toggleHeroMedia, reorderHeroMedia, updateHeroMediaLabel (5) | 2026-03 | ✅ MATAT #1942 — la gestió separada ja estava migrada a `/admin/image-manager`; només queden vives `listHeroMedia`/`listActiveHeroMedia`. |
| **normalize.ts (validació)** | Grup A mort #1944: compareCustomers, normalizeCustomerData. Grup B mort #1951: formatPhone, isValidPhone, isValidDni, getInstagramUrl, isValidInstagram, generatePersonalizedCode (6) + `generateDiscountCode` germà no inventariat. Nucli viu: normalizeEmail, normalizePhone, normalizeName, normalizeInstagram, normalizeDni. | 2025-12 | ✅ MATAT #1951 — es conserva només la font única de normalització usada per deduplicació, customer linking i camps normalitzats; els formats/validacions/generadors sense consumidor no es connecten a cegues. |
| **customerSegmentationService** | querySegment, getLifecycleDistribution, getTopTags, getHealthDistribution (4) | 2026-04 | ✅ MATAT #1946 — només hauria alimentat un dashboard agregat mai construït; backend viu de health/tags/preferències es conserva. |
| **portfolioEventService / gallery / portfolioMedia** | getGallerySummary, linkMediaToEvent, unlinkMediaFromEvent, getPortfolioEventCounts, getPortfolioMediaCounts (5) | 2026-03 | ✅ MATAT #1948 — el codi actual ja no les exporta ni les usa; queden vives les vies canòniques `listPortfolioPhotos`, `listPortfolioEvents`, `ensurePortfolioEventFromPostEventReport` i `listPortfolioMedia`. |
| **analytics.ts (tracking)** | initAnalytics, trackCalculatorUse, trackPackSelection, trackVideoView (4) | ? | ✅ MATAT #1950 — exports antics sense consumidor; el tracking viu continua a `trackEvent`, `trackLead`, CTAs, WhatsApp, page views, `trackPublicServiceEvent`, WebVitals i informes GA4. |
| **email.ts (testimonials/privacy)** | sendPrivacyRequestCompletedEmail mort; sendTestimonialAdminNotification, sendTestimonialReceivedEmail i sendTestimonialsReminderEmail ja no existeixen com a exports vius. | 2025-12 | ✅ TANCAT #1953 — no es ressusciten helpers antics; el recordatori admin real s'envia des de `/api/admin/emails/testimonials-reminder` via `sendTrackedStandaloneEmail`. |
| **utils llegades** | cn, getEnv, sanitizePhone, pluralizeWithCount, buildTimeline, getClientIP, getUserAgent | varia | ✅ MATAT #1938 — helpers sense consumidor real; `safeParseInt`, `env`, `pluralize`, `escapeHtml/sanitizeEmail/truncate` es conserven. |
| **costEngine: computeCollaboratorNetMargin** | (1) | 2026-03 | ✅ MATAT #1938 — òrfena des del #1196; comissions antigues retirades. |
| **resta** | drawCanonicalCard i deriveFlowStatusFromTimeline són vius; deriveFlowStatus, drawCanonicalLabel, spacingDelta, exportExecutiveReportCsv, mergeCustomers, deleteDossier(@deprecated) | varia | ✅ TANCAT #1954 — es maten només les òrfenes reals; `drawCanonicalCard` i la via timeline de comunicació es conserven. |

---

## Taula completa (79)

| # | Servei | Funció | Què fa | Edat | Test | Decisió |
|---|---|---|---|---|---|---|
| 1 | `admin-auth.ts` | `handleAdminAuth` | Validates admin auth (Basic, Bearer o cookie de sessió persistent). Returns a NextResponse if the re | 2026-02-23 | sí | ✅ VIU #1968 — consumit per `middleware.ts` per `/admin`, `/api/admin` i previews Studio |
| 2 | `admin.ts` | `getAdminLeadPackOptions` | function getAdminLeadPackOptions() { | 2026-03-23 | no | ✅ MATAT #1959 — 0 consumidors reals; la font viva de packs és `packs-config` |
| 3 | `analytics.ts` | `initAnalytics` | (arrow/const) | ? | no | ✅ MATAT #1950 — funció buida, scripts carregats per layout/consent |
| 4 | `analytics.ts` | `trackCalculatorUse` | (arrow/const) | ? | no | ✅ MATAT #1950 — 0 consumidors reals |
| 5 | `analytics.ts` | `trackPackSelection` | (arrow/const) | ? | no | ✅ MATAT #1950 — 0 consumidors reals |
| 6 | `analytics.ts` | `trackVideoView` | (arrow/const) | ? | no | ✅ MATAT #1950 — 0 consumidors reals |
| 7 | `auth.ts` | `getClientIP` | Obtenir IP del request (per logging) | 2025-12-10 | sí | ✅ MATAT #1938 — 0 consumidors reals |
| 8 | `auth.ts` | `getUserAgent` | Obtenir User Agent del request (per logging) | 2025-12-10 | no | ✅ MATAT #1938 — 0 consumidors reals |
| 9 | `collaboratorProductService.ts` | `computeProductMargin` | Profit net (€) i markup d'un producte. % calculat sobre el cost del col·laborador. */ | 2026-06-05 | sí | ✅ MATAT #1969 — ja no existeix al codi actual |
| 10 | `communicationStatusService.ts` | `deriveFlowStatus` | function deriveFlowStatus(logs: AdminLogLike[], flow: string): FlowStatus { | 2026-04-24 | sí | ✅ MATAT #1954 — wrapper AdminLog directe sense consumidor; la via viva és `deriveFlowStatusFromTimeline` |
| 11 | `costEngine.ts` | `computeCollaboratorNetMargin` | Calcula el marge NET d'una reserva amb col·laborador. Descompta la comissió del col·laborador del ma | 2026-03-17 | sí | ✅ MATAT #1938 — carril de comissions antic retirat |
| 12 | `costEngine.ts` | `computeSupportableTravelKm` | Km de desplaçament que el marge del bolo pot assumir abans de deixar de guanyar (net = 0). El despla | 2026-06-15 | sí | ✅ MATAT #1969 — ja no existeix al codi actual; la lectura viva de transport és al cost engine i UI actuals |
| 13 | `csrf.ts` | `shouldEnforceCsrf` | Check if CSRF protection should be enforced Skip in development or for specific paths | 2026-01-04 | sí | ✅ MATAT #1955 — 0 consumidors reals; la via viva és `verifyCsrf` + `fetchWithCsrf` + guards CSRF |
| 14 | `customerSegmentationService.ts` | `getHealthDistribution` | Retorna el resum de health score distribution (per gràfica). | 2026-04-20 | sí | ✅ MATAT #1946 — dashboard agregat mai construït |
| 15 | `customerSegmentationService.ts` | `getLifecycleDistribution` | Retorna comptadors per cada lifecycle stage (per KPIs). | 2026-04-20 | sí | ✅ MATAT #1946 — dashboard agregat mai construït |
| 16 | `customerSegmentationService.ts` | `getTopTags` | Retorna els tags més usats amb comptadors. | 2026-04-20 | sí | ✅ MATAT #1946 — dashboard agregat mai construït |
| 17 | `customerSegmentationService.ts` | `querySegment` | async function querySegment(filter: SegmentFilter, page = 1, limit = 50) { | 2026-04-20 | sí | ✅ MATAT #1946 — dashboard agregat mai construït |
| 18 | `deduplicationService.ts` | `mergeCustomers` | Fusionar dos o més clients en un | 2025-12-10 | sí | ✅ MATAT #1941 — 0 consumidors reals |
| 19 | `dossierService.ts` | `deleteDossier` | @deprecated Usar softDeleteDossier */ | 2026-05-27 | sí | ✅ MATAT #1941 — substituït per soft delete/purge canònic |
| 20 | `dossierService.ts` | `getDossiersByLead` | async function getDossiersByLead(leadId: string) { | 2026-05-27 | sí | ✅ MATAT #1969 — ja no existeix al codi actual; dossiers es llisten per serveis/rutes actuals |
| 21 | `email.ts` | `sendPrivacyRequestCompletedEmail` | async function sendPrivacyRequestCompletedEmail(params: { | 2025-12-10 | no | ✅ MATAT #1953 — 0 consumidors; la verificació RGPD viva queda a `sendPrivacyVerificationEmail` |
| 22 | `email.ts` | `sendTestimonialAdminNotification` | async function sendTestimonialAdminNotification(params: { | 2025-12-30 | no | ✅ MATAT #1953 — ja no existeix al codi actual; no es ressuscita |
| 23 | `email.ts` | `sendTestimonialReceivedEmail` | async function sendTestimonialReceivedEmail(params: { | 2025-12-30 | no | ✅ MATAT #1953 — ja no existeix al codi actual; plantilles BD `testimonial_received` no són aquest export |
| 24 | `email.ts` | `sendTestimonialsReminderEmail` | async function sendTestimonialsReminderEmail(params: { | 2026-01-14 | no | ✅ MATAT #1953 — ja no existeix; el recordatori admin viu és la ruta manual amb `sendTrackedStandaloneEmail` |
| 25 | `env.ts` | `getEnv` | (arrow/const) | ? | sí | ✅ MATAT #1938 — `env` tipat és la via viva |
| 26 | `executiveReportService.ts` | `exportExecutiveReportCsv` | function exportExecutiveReportCsv(report: ExecutiveReport): string { | 2026-04-20 | sí | ✅ MATAT #1941 — export CSV mai connectat |
| 27 | `galleryService.ts` | `getGallerySummary` | Obtenir resum de galeria per un booking | 2026-03-18 | sí | ✅ MATAT #1948 — ja no existeix al codi actual |
| 28 | `heroVideoService.ts` | `addHeroMedia` | ── Add media (upload or URL) ───────────────────────────────────────────── | 2026-03-19 | sí | ✅ MATAT #1942 — gestió migrada a image-manager |
| 29 | `heroVideoService.ts` | `removeHeroMedia` | ── Remove ──────────────────────────────────────────────────────────────── | 2026-03-19 | sí | ✅ MATAT #1942 — gestió migrada a image-manager |
| 30 | `heroVideoService.ts` | `reorderHeroMedia` | ── Reorder ─────────────────────────────────────────────────────────────── | 2026-03-19 | sí | ✅ MATAT #1942 — gestió migrada a image-manager |
| 31 | `heroVideoService.ts` | `toggleHeroMedia` | ── Toggle active ───────────────────────────────────────────────────────── | 2026-03-19 | sí | ✅ MATAT #1942 — gestió migrada a image-manager |
| 32 | `heroVideoService.ts` | `updateHeroMediaLabel` | ── Update label ────────────────────────────────────────────────────────── | 2026-03-19 | sí | ✅ MATAT #1942 — gestió migrada a image-manager |
| 33 | `home-meta.ts` | `getDefaultHomeMeta` | function getDefaultHomeMeta(locale: PublicLocale = 'es'): Required<Pick<HomeMeta, 'title' \| 'descrip | 2026-04-20 | no | ✅ MATAT #1957 — ja no existeix al codi actual; metadata viva via `getHomeMeta` i `getHomeKeywords` |
| 34 | `imap.ts` | `clearFetchEmailCache` | function clearFetchEmailCache(): void { | 2026-05-04 | no | ✅ MATAT #1958 — 0 consumidors reals; la invalidació viva és granular amb `invalidateFetchEmailCache` |
| 35 | `imap.ts` | `clearSpecialFoldersCache` | function clearSpecialFoldersCache(): void { | 2026-05-27 | no | ✅ MATAT #1958 — 0 consumidors reals; el refresc viu és `discoverSpecialFolders(forceRefresh)` |
| 36 | `inventory-image-constants.ts` | `INVENTORY_IMAGE_USER_AGENT` | (arrow/const) | ? | no | ✅ VIU #1956 — consumit per `scripts/localize-inventory-images.ts`; constants compartides també alimenten `inventoryAdminService` |
| 37 | `leadCustomerHref.ts` | `buildLeadCustomerContinuityTarget` | function buildLeadCustomerContinuityTarget(input: { | 2026-05-22 | sí | ✅ MATAT #1962 — 0 consumidors reals; `buildLeadCustomerHref` continua viu |
| 38 | `leadWorkspaceHref.ts` | `buildLeadPaymentsHref` | function buildLeadPaymentsHref(input: { | 2026-04-24 | sí | ✅ MATAT #1962 — 0 consumidors reals; els fluxos vius naveguen amb helpers específics |
| 39 | `leadWorkspaceHref.ts` | `buildLeadTaskHref` | function buildLeadTaskHref(input: { | 2026-04-24 | sí | ✅ MATAT #1962 — 0 consumidors reals; `buildLeadWorkspaceHref` continua viu |
| 40 | `normalize.ts` | `compareCustomers` | Compara dos clients per veure si són el mateix Retorna un score de 0-100 | 2025-12-10 | sí | ✅ MATAT #1944 — duplicava `deduplicationService.ts` |
| 41 | `normalize.ts` | `formatPhone` | Formata un telèfon per mostrar +34612345678 -> +34 612 345 678 | 2025-12-10 | sí | ✅ MATAT #1951 — format display sense consumidor; la font viva és `normalizePhone` |
| 42 | `normalize.ts` | `generatePersonalizedCode` | Genera un codi de descompte personalitzat amb el nom del client "Joan Garcia" -> "JOAN10" | 2025-12-10 | sí | ✅ MATAT #1951 — codi sense reserva ni unicitat; els descomptes vius es creen als serveis amb registre |
| 43 | `normalize.ts` | `getInstagramUrl` | Genera URL d'Instagram | 2025-12-10 | sí | ✅ MATAT #1951 — helper display sense consumidor; es conserva `normalizeInstagram` |
| 44 | `normalize.ts` | `isValidDni` | Valida un DNI/NIF espanyol (8 dígits + lletra) o NIE (X/Y/Z + 7 dígits + lletra) | 2026-02-18 | sí | ✅ MATAT #1951 — validador sense contracte de formulari; es conserva `normalizeDni` per unicitat |
| 45 | `normalize.ts` | `isValidInstagram` | Valida un handle d'Instagram | 2025-12-10 | sí | ✅ MATAT #1951 — validador sense consumidor; es conserva `normalizeInstagram` |
| 46 | `normalize.ts` | `isValidPhone` | Valida format de telèfon (mínim 9 dígits sense prefix) | 2025-12-10 | sí | ✅ MATAT #1951 — validador sense consumidor; es conserva `normalizePhone` |
| 47 | `normalize.ts` | `normalizeCustomerData` | function normalizeCustomerData(data: CustomerData): NormalizedCustomerData { | 2025-12-10 | sí | ✅ MATAT #1944 — duplicava `deduplicationService.ts` |
| 48 | `openapi.ts` | `getOpenAPIJSON` | Export as JSON for external tools | 2026-01-20 | sí | ✅ MATAT #1960 — 0 consumidors reals; `/api/docs` serveix `openAPISchema` directament |
| 49 | `orbita-services.ts` | `getOrbitaService` | function getOrbitaService(id: string): OrbitaService \| undefined { | 2026-06-08 | no | ✅ MATAT #1961 — 0 consumidors reals; `ORBITA_SERVICES` queda com a font viva |
| 50 | `pdf-header.ts` | `drawCanonicalCard` | function drawCanonicalCard( | 2026-06-05 | no | ✅ VIU #1941 — consumit per `deliveryNotePdfService.ts` |
| 51 | `pdf-header.ts` | `drawCanonicalLabel` | function drawCanonicalLabel(doc: jsPDFType, text: string, x: number, y: number): void { | 2026-06-05 | no | ✅ MATAT #1941 — 0 consumidors reals |
| 52 | `pdf-header.ts` | `spacingDelta` | ── Contenidor responsiu ─────────────────────────────────────────────────── ── Farciment de pàgina ─ | 2026-06-05 | no | ✅ MATAT #1941 — 0 consumidors reals |
| 53 | `pluralize.ts` | `pluralizeWithCount` | function pluralizeWithCount(count: number, singular: string, plural: string): string { | 2026-04-28 | sí | ✅ MATAT #1938 — `pluralize` simple es manté |
| 54 | `portfolioEventService.ts` | `getPortfolioEventCounts` | Comptar events per categoria | 2026-03-18 | sí | ✅ MATAT #1948 — ja no existeix al codi actual |
| 55 | `portfolioEventService.ts` | `linkMediaToEvent` | Vincular media existent a un event | 2026-03-18 | sí | ✅ MATAT #1948 — ja no existeix al codi actual |
| 56 | `portfolioEventService.ts` | `unlinkMediaFromEvent` | Desvincular media d'un event | 2026-03-18 | sí | ✅ MATAT #1948 — ja no existeix al codi actual |
| 57 | `portfolioMediaService.ts` | `getPortfolioMediaCounts` | async function getPortfolioMediaCounts() { | 2026-03-18 | sí | ✅ MATAT #1948 — ja no existeix al codi actual |
| 58 | `pricing-intelligence.ts` | `computeCollaboratorCost` | function computeCollaboratorCost( | 2026-06-03 | sí | ✅ MATAT #1967 — 0 consumidors reals; `costEngine.ts` és el cervell viu de cost/marge |
| 59 | `pricing-intelligence.ts` | `computeFullBookingCost` | function computeFullBookingCost(input: FullBookingCostInput): FullBookingCostResult { | 2026-06-02 | sí | ✅ MATAT #1967 — motor de cost paral·lel mai connectat a cap pantalla |
| 60 | `pricing-intelligence.ts` | `getHourlyColor` | function getHourlyColor(eur: number): PriceTone { | 2026-06-02 | no | ✅ MATAT #1967 — 0 consumidors reals; `getMarginColor` continua viu a `/admin/pricing` |
| 61 | `pricing-intelligence.ts` | `getPriceDeviationAlert` | ── Alerta desviació (compat amb codi existent) ─────────────────────────────── | 2026-06-02 | no | ✅ MATAT #1967 — 0 consumidors reals |
| 63 | `privacyService.ts` | `checkGdprCompliance` | Verificar compliment RGPD d'un client | 2025-12-10 | sí | ✅ MATAT #1934 — substituït per servei admin viu |
| 64 | `privacyService.ts` | `executeRetentionPolicies` | ═══════════════════════════════════════════════════════════════════════════ Executar polítiques de r | 2025-12-10 | sí | ✅ VIU #1934 — consumit pel cron `data-retention` |
| 65 | `privacyService.ts` | `getActiveConsents` | Obtenir consentiments actius d'un client | 2025-12-10 | sí | ✅ MATAT #1934 — substituït per `listConsents` |
| 66 | `privacyService.ts` | `getAuditHistory` | Obtenir historial d'auditoria d'una entitat | 2025-12-10 | sí | ✅ MATAT #1934 — substituït per `listPrivacyAuditLogs` |
| 67 | `privacyService.ts` | `getAuditSummary` | Obtenir resum d'auditoria per un període | 2025-12-10 | sí | ✅ MATAT #1934 — substituït per stats admin |
| 68 | `privacyService.ts` | `getCurrentLegalVersion` | Obtenir versió actual d'un document legal | 2025-12-10 | sí | ✅ MATAT #1934 — sense consumidor real |
| 69 | `privacyService.ts` | `getPendingDataRequests` | Obtenir sol·licituds pendents | 2025-12-10 | sí | ✅ MATAT #1934 — substituït per llistes admin |
| 70 | `privacyService.ts` | `hasActiveConsent` | Verificar si un client té un consentiment actiu | 2025-12-10 | sí | ✅ MATAT #1934 — sense consumidor real |
| 71 | `privacyService.ts` | `processDataRequest` | Processar una sol·licitud de drets | 2025-12-10 | sí | ✅ MATAT #1934 — substituït per flux admin nou |
| 72 | `privacyService.ts` | `recordConsent` | ═══════════════════════════════════════════════════════════════════════════ Registra un consentiment | 2025-12-10 | sí | ✅ VIU #1934 — consumit pel formulari públic de contacte |
| 73 | `protocolCanvisService.ts` | `indexProtocolSectionsById` | function indexProtocolSectionsById(sections: ProtocolSectionMeta[]): Map<string, ProtocolSectionMeta | 2026-05-04 | sí | ✅ MATAT #1963 — 0 consumidors reals; `parseProtocolSections` i `indexProtocolCanvisByNumber` continuen vius |
| 74 | `publicServiceMediaService.ts` | `getPublicServicePortfolioSlug` | function getPublicServicePortfolioSlug(key: PublicServiceMediaKey) { | 2026-04-03 | no | ✅ MATAT #1965 — entrada stale; ja no existeix al codi actual |
| 75 | `publicServiceMediaService.ts` | `listPublicMobileServiceCardImages` | async function listPublicMobileServiceCardImages(): Promise<Record<PublicMobileServiceCardId, string | 2026-04-03 | sí | ✅ MATAT #1965 — 0 consumidors reals; hero/gallery públiques continuen vives |
| 76 | `sanitize.ts` | `sanitizePhone` | Sanitiza un número de teléfono eliminando espacios y caracteres no numéricos @param phone - Teléfono | 2026-01-04 | sí | ✅ MATAT #1938 — 0 consumidors reals |
| 77 | `socialPerformanceService.ts` | `loadSocialPerformanceReport` | ─────────────────────────────────────────────────────────────────────────── WRAPPER — Prisma ─────── | 2026-04-20 | no | ✅ MATAT #1966 — 0 consumidors reals; el motor pur de mètriques socials continua viu |
| 78 | `timeline.ts` | `buildTimeline` | function buildTimeline(input: BuildTimelineInput): TimelineEventDTO[] { | 2026-02-16 | sí | ✅ MATAT #1938 — substituït per builders específics del Customer Hub |
| 79 | `utils.ts` | `cn` | function cn(...inputs: ClassValue[]) { | 2025-12-10 | sí | ✅ MATAT #1938 — 0 consumidors reals |

**TOTAL original: 78 funcions òrfenes inventariades en 36 serveis.** Totes les
files inventariades tenen decisió `VIU` o `MATAT`; no queden files ⬜ pendents.
