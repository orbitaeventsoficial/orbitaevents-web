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

## Clústers + recomanació (per decidir per blocs)

| Clúster | Funcions | Edat | Recomanació de l'auditor |
|---|---|---|---|
| **privacyService (RGPD)** | recordConsent, getActiveConsents, hasActiveConsent, processDataRequest, getPendingDataRequests, getAuditHistory, getAuditSummary, getCurrentLegalVersion, executeRetentionPolicies, checkGdprCompliance (10) | 2025-12 | ⚠️ **Substituïdes** per les noves (listConsents/listPrivacyAuditLogs/getPrivacyStats que SÍ usen les rutes). Codi RGPD llegat → MATAR (amb el teu OK, és compliment legal). |
| **heroVideoService (gestió hero)** | addHeroMedia, removeHeroMedia, toggleHeroMedia, reorderHeroMedia, updateHeroMediaLabel (5) | 2026-03 | 🔵 La lectura (`listActiveHeroMedia`) SÍ s'usa; la GESTIÓ no té UI. **Possible feature DEMANADA orfe** (gestionar el hero des de l'admin) → REFER o MATAR? |
| **normalize.ts (validació)** | formatPhone, isValidPhone, isValidDni, getInstagramUrl, isValidInstagram, generatePersonalizedCode, compareCustomers, normalizeCustomerData (8) | 2025-12 | 🔵 Utilitats de validació/format. Probablement útils si es connecten a formularis. REFER (a inputs) o MATAR? |
| **customerSegmentationService** | querySegment, getLifecycleDistribution, getTopTags, getHealthDistribution (4) | 2026-04 | 🔵 Segmentació de clients (per gràfiques/KPIs). Feature de CRM possiblement demanada → REFER o MATAR? |
| **portfolioEventService / heroVideo / gallery / portfolioMedia** | linkMediaToEvent, unlinkMediaFromEvent, get*Counts, getGallerySummary (6) | 2026-03 | 🔵 Gestió de mèdia de portfolio. REFER o MATAR? |
| **analytics.ts (tracking)** | initAnalytics, trackCalculatorUse, trackPackSelection, trackVideoView (4) | ? | 🔵 Events de GA4. Si no es disparen, és tracking perdut. REFER o MATAR? |
| **email.ts (testimonials/privacy)** | sendTestimonial*, sendPrivacyRequestCompletedEmail (4) | 2025-12 | 🔵 Emails que no s'envien. REFER o MATAR? |
| **utils llegades** | cn, getEnv, sanitizePhone, pluralizeWithCount, buildTimeline, getClientIP, getUserAgent, etc. | varia | 🔴 Utils mai connectades → MATAR (probable). |
| **costEngine: computeCollaboratorNetMargin** | (1) | 2026-03 | 🔴 Òrfena des del #1196 (vaig retirar comissions). MATAR. |
| **resta** | drawCanonicalCard, deriveFlowStatus, exportExecutiveReportCsv, mergeCustomers, deleteDossier(@deprecated)… | varia | revisar 1 a 1 |

---

## Taula completa (79)

| # | Servei | Funció | Què fa | Edat | Test | Decisió |
|---|---|---|---|---|---|---|
| 1 | `admin-auth.ts` | `handleAdminAuth` | Validates admin auth (Basic, Bearer o cookie de sessió persistent). Returns a NextResponse if the re | 2026-02-23 | sí | ⬜ |
| 2 | `admin.ts` | `getAdminLeadPackOptions` | function getAdminLeadPackOptions() { | 2026-03-23 | no | ⬜ |
| 3 | `analytics.ts` | `initAnalytics` | (arrow/const) | ? | no | ⬜ |
| 4 | `analytics.ts` | `trackCalculatorUse` | (arrow/const) | ? | no | ⬜ |
| 5 | `analytics.ts` | `trackPackSelection` | (arrow/const) | ? | no | ⬜ |
| 6 | `analytics.ts` | `trackVideoView` | (arrow/const) | ? | no | ⬜ |
| 7 | `auth.ts` | `getClientIP` | Obtenir IP del request (per logging) | 2025-12-10 | sí | ⬜ |
| 8 | `auth.ts` | `getUserAgent` | Obtenir User Agent del request (per logging) | 2025-12-10 | no | ⬜ |
| 9 | `collaboratorProductService.ts` | `computeProductMargin` | Profit net (€) i markup d'un producte. % calculat sobre el cost del col·laborador. */ | 2026-06-05 | sí | ⬜ |
| 10 | `communicationStatusService.ts` | `deriveFlowStatus` | function deriveFlowStatus(logs: AdminLogLike[], flow: string): FlowStatus { | 2026-04-24 | sí | ⬜ |
| 11 | `costEngine.ts` | `computeCollaboratorNetMargin` | Calcula el marge NET d'una reserva amb col·laborador. Descompta la comissió del col·laborador del ma | 2026-03-17 | sí | ⬜ |
| 12 | `costEngine.ts` | `computeSupportableTravelKm` | Km de desplaçament que el marge del bolo pot assumir abans de deixar de guanyar (net = 0). El despla | 2026-06-15 | sí | ⬜ |
| 13 | `csrf.ts` | `shouldEnforceCsrf` | Check if CSRF protection should be enforced Skip in development or for specific paths | 2026-01-04 | sí | ⬜ |
| 14 | `customerSegmentationService.ts` | `getHealthDistribution` | Retorna el resum de health score distribution (per gràfica). | 2026-04-20 | sí | ⬜ |
| 15 | `customerSegmentationService.ts` | `getLifecycleDistribution` | Retorna comptadors per cada lifecycle stage (per KPIs). | 2026-04-20 | sí | ⬜ |
| 16 | `customerSegmentationService.ts` | `getTopTags` | Retorna els tags més usats amb comptadors. | 2026-04-20 | sí | ⬜ |
| 17 | `customerSegmentationService.ts` | `querySegment` | async function querySegment(filter: SegmentFilter, page = 1, limit = 50) { | 2026-04-20 | sí | ⬜ |
| 18 | `deduplicationService.ts` | `mergeCustomers` | Fusionar dos o més clients en un | 2025-12-10 | sí | ⬜ |
| 19 | `dossierService.ts` | `deleteDossier` | @deprecated Usar softDeleteDossier */ | 2026-05-27 | sí | ⬜ |
| 20 | `dossierService.ts` | `getDossiersByLead` | async function getDossiersByLead(leadId: string) { | 2026-05-27 | sí | ⬜ |
| 21 | `email.ts` | `sendPrivacyRequestCompletedEmail` | async function sendPrivacyRequestCompletedEmail(params: { | 2025-12-10 | no | ⬜ |
| 22 | `email.ts` | `sendTestimonialAdminNotification` | async function sendTestimonialAdminNotification(params: { | 2025-12-30 | no | ⬜ |
| 23 | `email.ts` | `sendTestimonialReceivedEmail` | async function sendTestimonialReceivedEmail(params: { | 2025-12-30 | no | ⬜ |
| 24 | `email.ts` | `sendTestimonialsReminderEmail` | async function sendTestimonialsReminderEmail(params: { | 2026-01-14 | no | ⬜ |
| 25 | `env.ts` | `getEnv` | (arrow/const) | ? | sí | ⬜ |
| 26 | `executiveReportService.ts` | `exportExecutiveReportCsv` | function exportExecutiveReportCsv(report: ExecutiveReport): string { | 2026-04-20 | sí | ⬜ |
| 27 | `galleryService.ts` | `getGallerySummary` | Obtenir resum de galeria per un booking | 2026-03-18 | sí | ⬜ |
| 28 | `heroVideoService.ts` | `addHeroMedia` | ── Add media (upload or URL) ───────────────────────────────────────────── | 2026-03-19 | sí | ⬜ |
| 29 | `heroVideoService.ts` | `removeHeroMedia` | ── Remove ──────────────────────────────────────────────────────────────── | 2026-03-19 | sí | ⬜ |
| 30 | `heroVideoService.ts` | `reorderHeroMedia` | ── Reorder ─────────────────────────────────────────────────────────────── | 2026-03-19 | sí | ⬜ |
| 31 | `heroVideoService.ts` | `toggleHeroMedia` | ── Toggle active ───────────────────────────────────────────────────────── | 2026-03-19 | sí | ⬜ |
| 32 | `heroVideoService.ts` | `updateHeroMediaLabel` | ── Update label ────────────────────────────────────────────────────────── | 2026-03-19 | sí | ⬜ |
| 33 | `home-meta.ts` | `getDefaultHomeMeta` | function getDefaultHomeMeta(locale: PublicLocale = 'es'): Required<Pick<HomeMeta, 'title' \| 'descrip | 2026-04-20 | no | ⬜ |
| 34 | `imap.ts` | `clearFetchEmailCache` | function clearFetchEmailCache(): void { | 2026-05-04 | no | ⬜ |
| 35 | `imap.ts` | `clearSpecialFoldersCache` | function clearSpecialFoldersCache(): void { | 2026-05-27 | no | ⬜ |
| 36 | `inventory-image-constants.ts` | `INVENTORY_IMAGE_USER_AGENT` | (arrow/const) | ? | no | ⬜ |
| 37 | `leadCustomerHref.ts` | `buildLeadCustomerContinuityTarget` | function buildLeadCustomerContinuityTarget(input: { | 2026-05-22 | sí | ⬜ |
| 38 | `leadWorkspaceHref.ts` | `buildLeadPaymentsHref` | function buildLeadPaymentsHref(input: { | 2026-04-24 | sí | ⬜ |
| 39 | `leadWorkspaceHref.ts` | `buildLeadTaskHref` | function buildLeadTaskHref(input: { | 2026-04-24 | sí | ⬜ |
| 40 | `normalize.ts` | `compareCustomers` | Compara dos clients per veure si són el mateix Retorna un score de 0-100 | 2025-12-10 | sí | ⬜ |
| 41 | `normalize.ts` | `formatPhone` | Formata un telèfon per mostrar +34612345678 -> +34 612 345 678 | 2025-12-10 | sí | ⬜ |
| 42 | `normalize.ts` | `generatePersonalizedCode` | Genera un codi de descompte personalitzat amb el nom del client "Joan Garcia" -> "JOAN10" | 2025-12-10 | sí | ⬜ |
| 43 | `normalize.ts` | `getInstagramUrl` | Genera URL d'Instagram | 2025-12-10 | sí | ⬜ |
| 44 | `normalize.ts` | `isValidDni` | Valida un DNI/NIF espanyol (8 dígits + lletra) o NIE (X/Y/Z + 7 dígits + lletra) | 2026-02-18 | sí | ⬜ |
| 45 | `normalize.ts` | `isValidInstagram` | Valida un handle d'Instagram | 2025-12-10 | sí | ⬜ |
| 46 | `normalize.ts` | `isValidPhone` | Valida format de telèfon (mínim 9 dígits sense prefix) | 2025-12-10 | sí | ⬜ |
| 47 | `normalize.ts` | `normalizeCustomerData` | function normalizeCustomerData(data: CustomerData): NormalizedCustomerData { | 2025-12-10 | sí | ⬜ |
| 48 | `openapi.ts` | `getOpenAPIJSON` | Export as JSON for external tools | 2026-01-20 | sí | ⬜ |
| 49 | `orbita-services.ts` | `getOrbitaService` | function getOrbitaService(id: string): OrbitaService \| undefined { | 2026-06-08 | no | ⬜ |
| 50 | `pdf-header.ts` | `drawCanonicalCard` | function drawCanonicalCard( | 2026-06-05 | no | ⬜ |
| 51 | `pdf-header.ts` | `drawCanonicalLabel` | function drawCanonicalLabel(doc: jsPDFType, text: string, x: number, y: number): void { | 2026-06-05 | no | ⬜ |
| 52 | `pdf-header.ts` | `spacingDelta` | ── Contenidor responsiu ─────────────────────────────────────────────────── ── Farciment de pàgina ─ | 2026-06-05 | no | ⬜ |
| 53 | `pluralize.ts` | `pluralizeWithCount` | function pluralizeWithCount(count: number, singular: string, plural: string): string { | 2026-04-28 | sí | ⬜ |
| 54 | `portfolioEventService.ts` | `getPortfolioEventCounts` | Comptar events per categoria | 2026-03-18 | sí | ⬜ |
| 55 | `portfolioEventService.ts` | `linkMediaToEvent` | Vincular media existent a un event | 2026-03-18 | sí | ⬜ |
| 56 | `portfolioEventService.ts` | `unlinkMediaFromEvent` | Desvincular media d'un event | 2026-03-18 | sí | ⬜ |
| 57 | `portfolioMediaService.ts` | `getPortfolioMediaCounts` | async function getPortfolioMediaCounts() { | 2026-03-18 | sí | ⬜ |
| 58 | `pricing-intelligence.ts` | `computeCollaboratorCost` | function computeCollaboratorCost( | 2026-06-03 | sí | ⬜ |
| 59 | `pricing-intelligence.ts` | `computeFullBookingCost` | function computeFullBookingCost(input: FullBookingCostInput): FullBookingCostResult { | 2026-06-02 | sí | ⬜ |
| 60 | `pricing-intelligence.ts` | `getHourlyColor` | function getHourlyColor(eur: number): PriceTone { | 2026-06-02 | no | ⬜ |
| 61 | `pricing-intelligence.ts` | `getPriceDeviationAlert` | ── Alerta desviació (compat amb codi existent) ─────────────────────────────── | 2026-06-02 | no | ⬜ |
| 62 | `pricingRules.ts` | `DATE_PRICING_RULE_PRIORITY_MAX` | (arrow/const) | ? | no | ⬜ |
| 63 | `privacyService.ts` | `checkGdprCompliance` | Verificar compliment RGPD d'un client | 2025-12-10 | sí | ⬜ |
| 64 | `privacyService.ts` | `executeRetentionPolicies` | ═══════════════════════════════════════════════════════════════════════════ Executar polítiques de r | 2025-12-10 | sí | ⬜ |
| 65 | `privacyService.ts` | `getActiveConsents` | Obtenir consentiments actius d'un client | 2025-12-10 | sí | ⬜ |
| 66 | `privacyService.ts` | `getAuditHistory` | Obtenir historial d'auditoria d'una entitat | 2025-12-10 | sí | ⬜ |
| 67 | `privacyService.ts` | `getAuditSummary` | Obtenir resum d'auditoria per un període | 2025-12-10 | sí | ⬜ |
| 68 | `privacyService.ts` | `getCurrentLegalVersion` | Obtenir versió actual d'un document legal | 2025-12-10 | sí | ⬜ |
| 69 | `privacyService.ts` | `getPendingDataRequests` | Obtenir sol·licituds pendents | 2025-12-10 | sí | ⬜ |
| 70 | `privacyService.ts` | `hasActiveConsent` | Verificar si un client té un consentiment actiu | 2025-12-10 | sí | ⬜ |
| 71 | `privacyService.ts` | `processDataRequest` | Processar una sol·licitud de drets | 2025-12-10 | sí | ⬜ |
| 72 | `privacyService.ts` | `recordConsent` | ═══════════════════════════════════════════════════════════════════════════ Registra un consentiment | 2025-12-10 | sí | ⬜ |
| 73 | `protocolCanvisService.ts` | `indexProtocolSectionsById` | function indexProtocolSectionsById(sections: ProtocolSectionMeta[]): Map<string, ProtocolSectionMeta | 2026-05-04 | sí | ⬜ |
| 74 | `publicServiceMediaService.ts` | `getPublicServicePortfolioSlug` | function getPublicServicePortfolioSlug(key: PublicServiceMediaKey) { | 2026-04-03 | no | ⬜ |
| 75 | `publicServiceMediaService.ts` | `listPublicMobileServiceCardImages` | async function listPublicMobileServiceCardImages(): Promise<Record<PublicMobileServiceCardId, string | 2026-04-03 | sí | ⬜ |
| 76 | `sanitize.ts` | `sanitizePhone` | Sanitiza un número de teléfono eliminando espacios y caracteres no numéricos @param phone - Teléfono | 2026-01-04 | sí | ⬜ |
| 77 | `socialPerformanceService.ts` | `loadSocialPerformanceReport` | ─────────────────────────────────────────────────────────────────────────── WRAPPER — Prisma ─────── | 2026-04-20 | no | ⬜ |
| 78 | `timeline.ts` | `buildTimeline` | function buildTimeline(input: BuildTimelineInput): TimelineEventDTO[] { | 2026-02-16 | sí | ⬜ |
| 79 | `utils.ts` | `cn` | function cn(...inputs: ClassValue[]) { | 2025-12-10 | sí | ⬜ |

**TOTAL: 79 funcions òrfenes en 37 serveis.**
