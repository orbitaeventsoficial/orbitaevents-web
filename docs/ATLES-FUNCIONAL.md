# 🧬 Atles funcional — Òrbita Events com un sol ésser (cens complet)

> **Ull de Sauron, bata d'enginyer.** Aquest document és el cens COMPLET de totes les
> funcions de servei del projecte, agrupades per òrgan, perquè es vegi tot l'organisme
> d'un cop. Generat MECÀNICAMENT del codi real (no de memòria): 210 serveis,
> **684 funcions** de servei. Acompanya el `DIAGNOSTIC-I-FULL-DE-RUTA.md` (la capa
> estratègica) i l'`admin-organisme-atles.md` (òrgans + cablejat front↔back).
>
> Generat: 2026-06-28 · Regenerable amb `scratchpad/build-function-atlas.mjs`.

## 🧠 La interpretació del cervell — l'organisme com UN flux vertical

L'organisme no és una llista de 684 funcions: és **un flux vertical viu**. Un desconegut
entra per la web i acaba sent diners cobrats i un client fidel. **Tota la màquina existeix
per moure aquest recorregut** (lead → cash). Així es veu de dalt a baix:

```
   ▼ FLUX VERTICAL MESTRE (lead → cash) — la columna que dona vida a tot
   ════════════════════════════════════════════════════════════════════════

   🌐 WEB PÚBLICA ········· un desconegut veu un anunci, entra
        │                   [SEO municipi · packs · configurador]
        ▼
   👤 LEAD ················ 🔴 CRM (135 fn, 36 serveis) — INFLAT · 1a llijadora
        │                   captació · scoring · pipeline · reengagement
        ▼
   📨 CONVERSA ············ 🟡 Comunicació (58 fn) — afinar cosit IMAP↔BD
        │                   email · whatsapp · timeline · "qui deu resposta"
        ▼
   📅 RESERVA ············· 🟢 Bolo/Calendari (41 fn) — sòlid
        │                   data · servei · disponibilitat
        ▼
   💰 PREU ················ 🟢 Economia (49 fn) — EL COR, model a imitar
        │                   cost real · marge · +20% · IVA
        ▼
   📄 PRESSUPOST/CONTRACTE  🟡 Documents (44 fn) — flux PDF sense auditar
        │
        ▼
   💳 PAGAMENT ············ 🟢 Stripe/Bizum/efectiu — impecable, idempotent
        │
        ▼
   🎉 BOLO FET ············ 🤝 Partners (23 fn) net · 📦 Inventari (28 fn) dades
        │
        ▼
   📊 POST-EVENT ·········· enquesta (#1195) · valoració · fidelització
        │
        └──▶ torna a 👤 (client recurrent)

   ┌─────────────────────────────────────────────────────────────────────┐
   │  🧩 TRANSVERSAL (127 fn, 40 serveis) — flota AL COSTAT de tot el flux │
   │  utils, helpers, restes sense òrgan. 🔴 Aquí la porqueria sobrant.    │
   └─────────────────────────────────────────────────────────────────────┘
                                    │
                              🩸 PostgreSQL (63 models) — una sola sang
```

**El que el cervell llegeix d'aquesta imatge:**
1. **El flux central està sa al mig i als extrems** (Economia, Reserva, Pagament = verds). El cor funciona.
2. **Les vores grinyolen**: l'**entrada** (CRM inflat, on es capta) i el **lateral** (Transversal, el calaix de sastre). On es construeix ràpid, s'hi acumula el pòsit.
3. **La porqueria sobrant no és al flux — flota al costat** (bloc Transversal). Per això la màquina sembla «extensa»: no és que el flux sigui llarg, és que té massa coses penjant als costats que no formen part del recorregut.
4. **Llijar = aprimar les vores fins que només quedi el flux net.** Cada òrgan ha de ser una baula clara del recorregut lead→cash. El que no el serveixi: es connecta o fora.

---

## ⚡ Veredicte del cervell — afinar · cosir · llijar (per òrgan)

> El projecte és **madur**. La feina d'ara NO és construir: és **afinar** molt, **cosir**
> molt bé el cablejat entre òrgans, **passar la llijadora** al sobrant (duplicació, òrfenes,
> capes velles) i **entendre els fluxos verticals molt i molt bé**. Aquest és el mapa de
> per on passa la llijadora, ordenat per prioritat del cervell.

| Òrgan | fn | Salut | Què cal fer (afinar/cosir/llijar) |
|---|---|---|---|
| 💰 Economia/Cost/Preu | 49 | 🟢 sa | **Model a imitar.** Compacte, font única, blindat. Poc a llijar. Cosit ja fet (#1196 va treure el duplicat de comissions). |
| 📅 Reserva/Bolo/Calendari | 41 | 🟢 sòlid | Cor operatiu fiable. Cosir: els 7 bolos guanyats sense reserva (deure del propietari). |
| 🔒 Privacitat/Seguretat | 29 | 🟡 cosir | 8 funcions per-entitat desconnectades + 2 forats RGPD (`recordConsent`, retenció). **Cosir o llijar**, decisió pendent. |
| 🤝 Partners/Col·laboradors | 23 | 🟢 net | Acabat de llijar (#1196). Una sola via: línies de servei +20%. |
| 📨 Comunicació/Email/Safata | 58 | 🟡 afinar | Arquitectura bona; ja llijat el timeline raw (#1197). Afinar: vinculació IMAP↔BD, retry APPEND. |
| 📦 Catàleg/Inventari/Pack | 28 | 🟡 dades | Càlcul sòlid; forat de DADES (32/51 items sense cost). Deure del propietari, no codi. |
| 👤 CRM/Lead/Client | 135 | 🔴 **inflat** | **L'òrgan més fragmentat (36 serveis).** Aquí viu gran part de la duplicació i les òrfenes (segmentació, reengagement, dedup). **Primera zona de llijadora seriosa.** |
| 🧩 Transversal | 127 | 🔴 **inflat** | 40 serveis sense òrgan clar = utils/helpers/restes. Conté moltes de les 79 òrfenes. **Segona zona de llijadora.** |
| 🖼️ Contingut/Media/Portfolio | 65 | 🟡 afinar | Hero migrat al gestor d'imatges (5 fn velles a llijar). Revisar duplicació media. |
| 📄 Documents/PDF/Dossier | 44 | 🟡 afinar | Cap auditoria vertical encara. Pendent: entendre el flux PDF de punta a punta. |
| 📊 Anàlisi/Reporting/Salut | 39 | 🟡 verificar | Molts reports/insights; verificar quins es renderitzen de debò (risc d'òrfenes). |
| ⚙️ Tasques/Automatització/Cron | 25 | 🟡 verificar | 14 crons; verificar que cada un dispara i té efecte real. |
| 🌦️ Integracions externes | 21 | 🟢 ok | Weather, Google reviews, maps. Cache i contenció ja resolts. |

**Ordre de llijadora que recomana el cervell:** (1) 🧩 Transversal i (2) 👤 CRM — els dos
inflats, on hi ha el 38% de les funcions i la majoria del sobrant. Després afinar els 🟡 un
a un, seguint el **flux vertical** de cada un (front→back→BD), no pàgina a pàgina.

---

## Índex d'òrgans
- 💰 Economia / Cost / Preu — 16 serveis, 49 funcions
- 👤 CRM / Lead / Client — 36 serveis, 135 funcions
- 📅 Reserva / Bolo / Calendari — 19 serveis, 41 funcions
- 🤝 Partners / Col·laboradors — 4 serveis, 23 funcions
- 📨 Comunicació / Email / Safata — 18 serveis, 58 funcions
- 📦 Catàleg / Inventari / Pack — 8 serveis, 28 funcions
- 🖼️ Contingut / Media / Portfolio — 13 serveis, 65 funcions
- 📊 Anàlisi / Reporting / Salut — 19 serveis, 39 funcions
- 🔒 Privacitat / Seguretat / Auth — 4 serveis, 29 funcions
- 📄 Documents / PDF / Dossier — 13 serveis, 44 funcions
- 🌦️ Integracions externes — 9 serveis, 21 funcions
- ⚙️ Tasques / Automatització / Cron — 11 serveis, 25 funcions
- 🧩 Altres / transversal — 40 serveis, 127 funcions

---

## 💰 Economia / Cost / Preu

### `bookingBizumService.ts` (2)
- `declareBizumPayment`
- `confirmBizumPayment`

### `bookingBulkPaymentService.ts` (1)
- `updateBulkPaymentField`

### `bookingStripePaymentService.ts` (2)
- `createBookingStripeCheckoutLink`
- `processStripeWebhook`

### `costEngine.ts` (7)
- `aggregateServiceLines` — `collaboratorId` (el cost es gestiona a la seva fitxa, mai imputat); - si és una línia prò
- `classifyBoloLines` — s'ha d'anar a buscar i tornar; el transport el carrega la pròpia línia. - **Servei presenc
- `computeSupportableTravelKm` — Km de desplaçament que el marge del bolo pot assumir abans de deixar de guanyar (net = 0).
- `computeDirectCostBreakdown` — `computeBookingFinancialSummary` (servidor) com els components de marge en viu del client 
- `computeBookingFinancialSummary`
- `computeSimpleMarginPct` — Calcula el marge % simplificat (sense CAC) per a llistes/dashboards. Substitueix calculate
- `computeCollaboratorNetMargin` — Calcula el marge NET d'una reserva amb col·laborador. Descompta la comissió del col·labora

### `datePricingService.ts` (2)
- `findApplicableRule` — Selecciona la regla amb multiplicador més alt; tie-break per priority.
- `applyDatePricing`

### `fuelReferenceService.ts` (4)
- `refreshFuelReferenceNow`
- `runFuelDailyRefresh`
- `getFuelCostPerKmReference`
- `getEffectiveVehicleCostPerKm` — - Preu combustible MITECO (BD) o fallback - Consum configurat del vehicle (L/100km) - Cost

### `invoiceAdminService.ts` (4)
- `listAdminInvoices`
- `createAdminInvoiceFromBooking`
- `getAdminInvoiceById`
- `updateAdminInvoiceStatus`

### `invoicePdfService.ts` (1)
- `generateInvoicePDF` — ── Generador ────────────────────────────────────────────────────────────────

### `invoiceService.ts` (4)
- `createInvoiceFromBooking` — ============================================ CREATE INVOICE FROM BOOKING =================
- `retryHoldedSync` — ============================================ RETRY SYNC ==================================
- `markInvoiceAsPaid` — ============================================ MARK AS PAID (amb validació d'estat) ========
- `runInvoiceSyncCron`

### `packPricingCheckService.ts` (1)
- `runPackPricingCheck`

### `packPricingHealth.ts` (6)
- `getPackPricingModelConfig`
- `getPackPricingModelConfigEditable`
- `upsertPackPricingModelConfig`
- `computePackPricingHealth`
- `getPackPricingAlertsCount`
- `syncPackPublicPricesToRecommended`

### `paymentReminderService.ts` (1)
- `sendPaymentReminders`

### `pricingAdminService.ts` (3)
- `normalizePricingLocale`
- `getPricingAdminData`
- `updateExtraPrice`

### `reactivationService.ts` (2)
- `generateReactivationCandidates` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadReactivationCandidates` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `stripeService.ts` (2)
- `createStripeCheckoutSession`
- `constructStripeEvent`

### `travelCost.ts` (7)
- `getIncludedTravelOneWayKm`
- `sanitizeNonNegative`
- `calculateBillableTravelKm`
- `calculateTravelBlocks`
- `calculateTravelCost`
- `calculateTravelCharge`
- `calculateEffectiveVehicleCostPerKm` — - Cost de manteniment/amortització fix per km Fórmula: vehicleCostPerKm = (fuelPricePerLit


## 👤 CRM / Lead / Client

### `bookingCustomerLinkService.ts` (2)
- `previewBookingCustomerLink`
- `linkBookingToCustomer`

### `bulkComposeSegmentService.ts` (2)
- `loadBulkComposeAudience`
- `sendBulkComposeSegment`

### `clientPortalAccess.ts` (6)
- `normalizePortalLocale`
- `getActivePortalAccessForBooking`
- `issueClientPortalAccess`
- `revokeActiveClientPortalAccess`
- `findPortalAccessByRawToken`
- `markPortalAccessHit`

### `contactLeadCaptureService.ts` (1)
- `persistContactLead`

### `customerActivityService.ts` (20)
- `deriveCustomerHubActivitySummary`
- `recordCustomerEmailSent`
- `recordCustomerQuoteSent`
- `recordCustomerProposalSent`
- `recordCustomerPostEventEmailSent`
- `recordCustomerCreated`
- `recordCustomerInitialNotes`
- `recordCustomerDuplicateWarning`
- `recordCustomerLeadCreated`
- `recordCustomerProfileUpdated`
- `recordCustomerStatusChanged`
- `recordCustomersMerged`
- `recordLeadConverted`
- `recordCustomerBookingCreated`
- `recordCustomerProcessStarted`
- `recordCustomerTestimonialSubmitted`
- `readRecentEmailActivitySummary`
- `readCustomerActivityLog`
- `listCustomerActivities`
- `createCustomerActivityNote`

### `customerContactService.ts` (4)
- `listCustomerContacts`
- `createCustomerContact`
- `updateCustomerContact`
- `deleteCustomerContact`

### `customerCreationService.ts` (1)
- `createCustomerFromInput`

### `customerInsightsService.ts` (1)
- `computeCustomerInsights` — ─── Main ───────────────────────────────────────────────────────────────

### `customerListService.ts` (1)
- `listAdminCustomers`

### `customerProcessService.ts` (1)
- `startCustomerProcess`

### `customerRouteService.ts` (3)
- `getCustomerDetail`
- `updateCustomerFromInput`
- `deleteCustomerOrAnonymize`

### `customerSegmentationService.ts` (11)
- `computeHealthScore` — - Frescor (25p): temps des de l'últim event - Satisfacció (15p): NPS mitjà - Engagement (1
- `computeLifecycleStage` — Determina el lifecycle stage correcte basat en les dades del client. No fa downgrade de VI
- `recalculateAllCustomers` — Recalcula healthScore i lifecycleStage de tots els clients. Dissenyat per executar-se al c
- `addCustomerTags` — ═══════════════════════════════════════════════════════════════════════════ TAGS — afegir,
- `removeCustomerTags`
- `setCustomerTags`
- `updateCustomerPreferences`
- `querySegment`
- `getLifecycleDistribution` — Retorna comptadors per cada lifecycle stage (per KPIs).
- `getTopTags` — Retorna els tags més usats amb comptadors.
- `getHealthDistribution` — Retorna el resum de health score distribution (per gràfica).

### `customerStatusService.ts` (1)
- `updateCustomerHubStatus`

### `deduplicationService.ts` (2)
- `findDuplicates` — Busca possibles duplicats d'un client
- `mergeCustomers` — Fusionar dos o més clients en un

### `emailLeadExtractionService.ts` (1)
- `extractLeadDataFromEmail`

### `inboxLeadImportService.ts` (1)
- `importLeadFromInboxMessage`

### `leadActivityService.ts` (26)
- `recordLeadInboundChannelCaptured`
- `recordLeadEmailSent`
- `recordLeadQuoteSent`
- `recordLeadQuoteGenerated`
- `recordLeadScoreSnapshot`
- `recordLeadSlaTaskCreated`
- `recordLeadStatusChanged`
- `recordLeadLost`
- `recordLeadTechnicalSnapshotSaved`
- `recordLeadTechnicalSnapshotSent`
- `recordLeadContractSent`
- `recordLeadContractCancelled`
- `recordLeadContractSigned`
- `recordLeadDocumentAdded`
- `recordLeadDocumentDeleted`
- `recordLeadTaskCreated`
- `recordLeadTaskUpdated`
- `recordLeadTaskDeleted`
- `recordLeadNoteAdded`
- `recordLeadUpdatedFromInbox`
- `recordLeadCreatedFromInbox`
- `recordLeadCommercialSequenceStepSent`
- `listLeadActivities`
- `createLeadActivity`
- `cleanupDuplicateLeadActivities`
- `deleteLeadActivity`

### `leadAdminService.ts` (3)
- `countNewAdminLeads`
- `listAdminLeads`
- `createAdminLead`

### `leadArchiveService.ts` (7)
- `computeReasonStats`
- `computeBreakdownByEventType`
- `computeBreakdownBySource`
- `computeMonthlyStats`
- `computeArchiveStats`
- `loadArchiveList`
- `loadArchiveStats`

### `leadArchiveSnapshot.ts` (1)
- `snapshotLeadsBeforeDelete` — Crea snapshots a `lead_archive` per a un conjunt de leads abans que es purguin. Es crida d

### `leadCleanupService.ts` (1)
- `runLeadCleanup`

### `leadCustomerLinkService.ts` (2)
- `previewLeadCustomerLink`
- `linkLeadToCustomer`

### `leadDocumentService.ts` (3)
- `listLeadDocuments`
- `uploadLeadDocument`
- `deleteLeadDocument`

### `leadLossAnalyticsService.ts` (2)
- `computeLossSummary`
- `loadLossReport`

### `leadLossService.ts` (2)
- `buildLostActivityDescription`
- `markLeadAsLost`

### `leadNoteService.ts` (3)
- `createLeadNote`
- `cleanupDuplicateLeadNotes`
- `deleteLeadNote`

### `leadPipelineSuggestionsService.ts` (2)
- `generatePipelineSuggestions` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadPipelineSuggestions` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `leadReengagementAutomationService.ts` (2)
- `buildLeadReengagementProposals`
- `runLeadReengagementAutomation`

### `leadReengagementService.ts` (2)
- `generateReengagementCandidates` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadReengagementCandidates` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `leadRouteService.ts` (3)
- `getLeadDetail`
- `updateLeadFromInput`
- `deleteLeadIfAllowed`

### `leadScopedTaskRouteService.ts` (4)
- `listLeadScopedTasksForRoute`
- `createLeadScopedTaskForRoute`
- `updateLeadScopedTaskForRoute`
- `deleteLeadScopedTaskForRoute`

### `leadScopedTaskService.ts` (5)
- `listLeadScopedTasks`
- `createLeadScopedTask`
- `updateLeadScopedTask`
- `findTaskLinkByTaskOrLegacyId`
- `deleteLeadScopedTask`

### `leadScoreAdminService.ts` (2)
- `getAdminLeadScore`
- `createAdminLeadScoreSnapshot`

### `leadServiceLineService.ts` (2)
- `listLeadServiceLines`
- `replaceLeadServiceLines` — Replace-all de les línies del bolo (mateix patró que el booking editor). Esborra les actua

### `leadSnapshotService.ts` (4)
- `buildLeadTechnicalSnapshot`
- `serializeLeadTechnicalSnapshot`
- `renderLeadTechnicalSnapshotEmail`
- `processLeadTechnicalSnapshot`

### `leadTextExtractionService.ts` (1)
- `extractLeadDataFromText`


## 📅 Reserva / Bolo / Calendari

### `adminCalendarMonthService.ts` (1)
- `getAdminCalendarMonth`

### `availabilityAdminService.ts` (3)
- `listBlockedAvailability`
- `blockAvailabilityDay`
- `unblockAvailabilityDay`

### `bookingCapacityService.ts` (2)
- `buildWeekCapacity` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadWeekCapacity` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `bookingChecklistService.ts` (3)
- `sanitizeBookingChecklistItems`
- `getBookingChecklist`
- `saveBookingChecklist`

### `bookingCommunicationLogService.ts` (1)
- `recordBookingCommunicationLog`

### `bookingCommunicationService.ts` (2)
- `parseBookingCommunicationBody`
- `executeBookingCommunication`

### `bookingCreationService.ts` (1)
- `createBookingFromInput`

### `bookingInventoryService.ts` (4)
- `getBookingInventoryView`
- `assignBookingInventory`
- `updateBookingInventoryAssignment`
- `removeBookingInventoryAssignment`

### `bookingListService.ts` (1)
- `listAdminBookings`

### `bookingOperationalService.ts` (1)
- `getBookingOperationalSnapshot` — checklist, comunicacions, timeline, client, portal, rendibilitat, inventari, pagaments, do

### `bookingPortalCompletionService.ts` (1)
- `tryEnsureCompletedBookingPortalAccess`

### `bookingRouteService.ts` (5)
- `getBookingDetail`
- `prepareBookingPatchData`
- `updateBookingDetail`
- `changeBookingStatus`
- `deleteBookingIfAllowed`

### `bookingStatusTransitionService.ts` (1)
- `applyBookingStatusSideEffects`

### `calendarFeedTokenService.ts` (4)
- `getCalendarFeedToken`
- `regenerateCalendarFeedToken`
- `isValidCalendarFeedToken`
- `buildCalendarFeedIcs`

### `googleCalendarSyncService.ts` (3)
- `reconcileGoogleCalendar`
- `syncBookingToGoogleCalendar`
- `syncSocialPostToGoogleCalendar`

### `publicAvailabilityService.ts` (3)
- `generateFallbackPublicAvailability`
- `listAvailabilityRange`
- `buildPublicAvailability`

### `publicBookingService.ts` (2)
- `createPublicBooking`
- `isDateUnavailableBookingError`

### `recentBookingsService.ts` (1)
- `listRecentBookingsFeed`

### `seasonCalendarService.ts` (2)
- `buildSeasonCalendar` — ─── Funció pura (testejable sense I/O) ──────────────────────────────────────
- `loadSeasonCalendar` — ─── Wrapper amb Prisma ───────────────────────────────────────────────────────


## 🤝 Partners / Col·laboradors

### `collaboratorAdminService.ts` (5)
- `listAdminCollaborators`
- `createAdminCollaborator`
- `getAdminCollaborator`
- `updateAdminCollaborator`
- `deleteAdminCollaborator`

### `collaboratorMemberService.ts` (4)
- `listCollaboratorMembers`
- `createCollaboratorMember`
- `updateCollaboratorMember`
- `deleteCollaboratorMember`

### `collaboratorProductService.ts` (13)
- `computeProductMargin`
- `stripProviderBrand`
- `toDossierCollaboratorProductId`
- `parseDossierCollaboratorProductId`
- `collaboratorProductToDossierProduct`
- `collaboratorProductToAnimacioProduct`
- `listCollaboratorProducts`
- `listDossierCollaboratorProducts`
- `listActiveCollaboratorProductsForBooking`
- `getDossierCollaboratorProductsByIds`
- `createCollaboratorProduct`
- `updateCollaboratorProduct`
- `deleteCollaboratorProduct`

### `partnerHubService.ts` (1)
- `fetchPartnerHub`


## 📨 Comunicació / Email / Safata

### `adminEmailSendService.ts` (1)
- `sendAdminEmail`

### `adminQuoteEmailService.ts` (1)
- `sendAdminQuoteEmail`

### `adminTestNotificationService.ts` (2)
- `getAdminNotificationDiagnostics`
- `sendAdminTestEmail`

### `commercialDailyAutomationService.ts` (1)
- `runCommercialDailyAutomation`

### `commercialScoring.ts` (2)
- `scoreLead`
- `estimateLeadAmount`

### `commercialSequenceService.ts` (2)
- `runCommercialSequences`
- `runCommercialSequenceForLead`

### `commTimelineService.ts` (2)
- `buildCommTimelineFromCanonicalEvents` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadCommTimeline` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `communicationStatusService.ts` (3)
- `deriveFlowStatus`
- `deriveFlowStatusFromTimeline`
- `buildRecentCommRowsFromTimeline`

### `emailSentRetryService.ts` (1)
- `retryAppendToSent`

### `emailTemplateService.ts` (6)
- `getTemplate`
- `getAdminTemplateDetail`
- `listTemplates`
- `isTemplateSlug`
- `getTemplateVariables`
- `upsertTemplate`

### `emailTrackingService.ts` (9)
- `computeTemplatePerformance`
- `generateEmailTrackingReport`
- `recordEmailSend` — ─────────────────────────────────────────────────────────────────────────── WRAPPER — oper
- `updateEmailSendResult` — Es crida DESPRÉS de `sendEmail()` perquè la BD reflecteixi l'estat observable sense bloque
- `loadSentEmail`
- `recordEmailClick`
- `wrapLinksForTracking` — Wraps all <a href="..."> links in HTML with a tracking redirect. Preserves mailto:, tel:, 
- `recordEmailOpen`
- `loadEmailTrackingReport`

### `imapSettingsService.ts` (3)
- `deleteImapSettings`
- `readInboxImapSettings`
- `handleInboxImapSettings`

### `inboxTemplateService.ts` (2)
- `generateSmartTemplates` — ─────────────────────────────────────────────────────────────────────────── MAIN — genera 
- `generateAllTemplates` — Genera totes les plantilles sense filtre d'estat (per UI sense lead seleccionat)

### `notificationRecipientsService.ts` (4)
- `listNotificationRecipients`
- `getRecipientsFor`
- `getRecipientsAsString`
- `saveNotificationRecipients`

### `notificationService.ts` (1)
- `notifyNewLead` — ============================================ NOTIFICACIÓ PRINCIPAL - NOU LEAD ============

### `postEventEmailService.ts` (4)
- `normalizeLocale`
- `resolvePackName`
- `getPostEventSubject`
- `generatePostEventEmail`

### `timelineQueryService.ts` (13)
- `mapCustomerActivityToCanonicalEvent`
- `mapLeadActivityToCanonicalEvent`
- `mapAdminLogToCanonicalEvent`
- `canonicalEventsToTimeline`
- `summarizeCanonicalCommunicationMetrics`
- `fetchRecentCanonicalEvents`
- `fetchRecentCanonicalCommunicationMetrics`
- `fetchRecentCommercialSequenceMetrics`
- `fetchCanonicalCommunicationEventsForBookings`
- `fetchCanonicalAdminActivityPage`
- `fetchCanonicalEventsForCustomer`
- `fetchCanonicalEventsForLead`
- `fetchCanonicalEventsForBooking`

### `whatsappService.ts` (1)
- `sendWhatsAppText`


## 📦 Catàleg / Inventari / Pack

### `catalogPdfService.ts` (3)
- `generateServiceBrochure` — Catàleg d'un sol servei (ús en pressupostos i envios reals al client).
- `appendCatalogServicesToPdf`
- `generateFullCatalogPDF` — Catàleg complet amb tots els serveis (ús al visor Studio i preview). Cada servei ocupa la 

### `extrasConfiguratorService.ts` (4)
- `getDefaultExtrasConfig`
- `sanitizeExtrasConfig`
- `getExtrasConfiguratorConfig`
- `saveExtrasConfiguratorConfig`

### `inventoryAdminService.ts` (7)
- `listInventoryAdminData`
- `createInventoryItem`
- `getInventoryItemDetails`
- `updateInventoryItem`
- `deleteInventoryItem`
- `uploadInventoryItemPhoto`
- `deleteInventoryItemPhoto`

### `inventoryBundles.ts` (4)
- `getInventoryBundles`
- `saveInventoryBundles`
- `listAdminInventoryBundles`
- `saveAdminInventoryBundles`

### `packAdminService.ts` (5)
- `listAdminPacks`
- `createAdminPack`
- `getAdminPackById`
- `updateAdminPack`
- `syncAdminPacksFromConfig`

### `packSuggestionService.ts` (2)
- `parseBudgetRange`
- `suggestPackForLead`

### `publicExtrasService.ts` (2)
- `resolvePublicExtraDefinition`
- `listPublicExtras`

### `quotePack.ts` (1)
- `resolveQuotePack`


## 🖼️ Contingut / Media / Portfolio

### `blogAdminService.ts` (4)
- `listAdminBlogPosts`
- `createAdminBlogPost`
- `updateAdminBlogPost`
- `deleteAdminBlogPost`

### `galleryService.ts` (11)
- `addGalleryPhoto` — Afegir foto a la galeria d'un booking
- `listGalleryPhotos` — Llistar fotos d'un booking
- `listPortalPhotos` — Llistar fotos per al portal client (només isPortal)
- `listPortfolioPhotos` — Llistar fotos per al portfolio públic (tots els bookings)
- `updateGalleryPhoto` — Actualitzar foto (caption, flags, ordre)
- `deleteGalleryPhoto` — Eliminar foto
- `getGallerySummary` — Obtenir resum de galeria per un booking
- `createGalleryShareToken`
- `revokeGalleryShareToken`
- `getGalleryByShareToken`
- `getGalleryShareInfo`

### `heroVideoService.ts` (7)
- `listHeroMedia` — ── Read ──────────────────────────────────────────────────────────────────
- `listActiveHeroMedia`
- `addHeroMedia` — ── Add media (upload or URL) ─────────────────────────────────────────────
- `removeHeroMedia` — ── Remove ────────────────────────────────────────────────────────────────
- `toggleHeroMedia` — ── Toggle active ─────────────────────────────────────────────────────────
- `reorderHeroMedia` — ── Reorder ───────────────────────────────────────────────────────────────
- `updateHeroMediaLabel` — ── Update label ──────────────────────────────────────────────────────────

### `imageManagerProcessing.ts` (1)
- `processImageManagerUpload`

### `imageManagerService.ts` (9)
- `invalidateCache`
- `inferPlacementKind` — --------------------------------------------------------------------------- Helpers purs (
- `getManagedImageOverride` — --------------------------------------------------------------------------- Reads (consumi
- `getManagedImageCollection`
- `getImageManagerPayload` — --------------------------------------------------------------------------- Payload admin 
- `uploadImageManagerAsset` — --------------------------------------------------------------------------- Upload -------
- `deleteImageManagerAsset` — --------------------------------------------------------------------------- Delete -------
- `saveImageManagerModifications`
- `reorderImageManagerAssets` — --------------------------------------------------------------------------- Reorder (PATCH

### `portfolioEventService.ts` (8)
- `createPortfolioEvent` — Crear un event de portfolio
- `listPortfolioEvents` — Llistar events d'una categoria (publicats per defecte)
- `getPortfolioEvent` — Obtenir un event per slug (amb media)
- `updatePortfolioEvent` — Actualitzar un event
- `deletePortfolioEvent` — Eliminar un event (media queda amb eventId=null)
- `linkMediaToEvent` — Vincular media existent a un event
- `unlinkMediaFromEvent` — Desvincular media d'un event
- `getPortfolioEventCounts` — Comptar events per categoria

### `portfolioImageService.ts` (4)
- `slugifyPortfolioAssetName`
- `normalizePortfolioImageBuffer`
- `buildPortfolioUploadImagePath`
- `buildBookingGalleryImagePath`

### `portfolioMediaService.ts` (7)
- `isValidSlug`
- `detectMediaType`
- `addPortfolioMedia`
- `listPortfolioMedia`
- `getPortfolioMediaCounts`
- `updatePortfolioMedia`
- `deletePortfolioMedia`

### `publicBlogService.ts` (3)
- `listPublicBlogPosts`
- `getPublicBlogPost`
- `incrementPublicBlogPostView`

### `publicPortfolioShowcaseService.ts` (1)
- `listPublicPortfolioShowcaseStories`

### `publicServiceMediaService.ts` (4)
- `getPublicServicePortfolioSlug`
- `getPublicServiceHeroImage`
- `getPublicServiceGalleryImages`
- `listPublicMobileServiceCardImages`

### `publicTestimonialService.ts` (3)
- `listApprovedPublicTestimonials`
- `listApprovedDatabaseReviews`
- `submitPublicTestimonial`

### `testimonialAdminService.ts` (3)
- `listAdminTestimonials`
- `moderateTestimonial`
- `countPendingTestimonials`


## 📊 Anàlisi / Reporting / Salut

### `adminHealthService.ts` (1)
- `getAdminHealthSnapshot`

### `adminStatsService.ts` (3)
- `listAdminStats`
- `updateAdminStatFallback`
- `isAdminStatKey`

### `captureHealthService.ts` (2)
- `generateCaptureHealth` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadCaptureHealth` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `cronRunStatusService.ts` (3)
- `saveCronRunStatus`
- `readCronRunStatus`
- `readCronRunStatuses`

### `dashboardInsightsService.ts` (1)
- `generateDashboardInsights`

### `economicCockpitService.ts` (2)
- `composeEconomicCockpit` — Composició pura (sense I/O) — testejable directament. Fusiona el forecast de pipeline i el
- `buildEconomicCockpit`

### `executiveReportDispatchService.ts` (1)
- `sendExecutiveReport`

### `executiveReportPdfService.ts` (1)
- `exportExecutiveReportPdf` — ── Exportació principal ─────────────────────────────────────────────────────

### `executiveReportService.ts` (2)
- `exportExecutiveReportCsv`
- `buildExecutiveReport` — ─────────────────────────────────────────────────────────────────────────── WRAPPER — Pris

### `googleReviewsStaticFile.ts` (1)
- `readStaticGoogleReviewsData`

### `healthCheckService.ts` (5)
- `checkDatabaseHealth`
- `createBaseHealthStatus`
- `applySentryHealth`
- `finalizeHealthStatus`
- `createFallbackHealthStatus`

### `nbaAiExplainService.ts` (1)
- `generateNBAExplanation`

### `nextBestActionService.ts` (3)
- `assembleNextBestActions` — ─────────────────────────────────────────────────────────────────────────── PURE: ASSEMBLE
- `buildNBAReport`
- `loadNextBestActions`

### `postEventReportAdminService.ts` (1)
- `createAdminPostEventReport`

### `publicStatsService.ts` (3)
- `getPublicStatsLocale`
- `getFallbackPublicStats`
- `getPublicStats`

### `reportingInsightsService.ts` (1)
- `generateReportingInsights`

### `socialPerformanceService.ts` (5)
- `computePlatformMetrics` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTIONS
- `computeConsistencyScore`
- `generateRecommendations`
- `generateSocialPerformanceReport`
- `loadSocialPerformanceReport` — ─────────────────────────────────────────────────────────────────────────── WRAPPER — Pris

### `statusRouteHandler.ts` (1)
- `handleLeadStatusPatch`

### `weeklyBenchmarkService.ts` (2)
- `generateWeeklyBenchmark`
- `runWeeklyBenchmark` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────


## 🔒 Privacitat / Seguretat / Auth

### `googleOAuthService.ts` (4)
- `verifyGoogleOAuthState`
- `exchangeGoogleOAuthCode`
- `upsertIntegrationSetting`
- `upsertIntegrationSettings`

### `privacyRequestAdminService.ts` (1)
- `processPrivacyRequestById`

### `privacyRequestListService.ts` (1)
- `listAdminPrivacyRequests`

### `privacyService.ts` (23)
- `recordConsent` — Registra un consentiment
- `revokeConsent` — Revoca un consentiment
- `listConsents` — Llistar tots els consentiments amb paginació i filtre
- `getActiveConsents` — Obtenir consentiments actius d'un client
- `hasActiveConsent` — Verificar si un client té un consentiment actiu
- `createDataRequest` — Crear una sol·licitud de drets
- `verifyDataRequest` — Verificar identitat d'una sol·licitud
- `processDataRequest` — Processar una sol·licitud de drets
- `getPendingDataRequests` — Obtenir sol·licituds pendents
- `getUrgentDataRequests` — Obtenir sol·licituds pròximes al deadline
- `exportCustomerData` — Exportar totes les dades d'un client (dret d'accés/portabilitat)
- `anonymizeCustomerData` — Anonimitzar dades d'un client (dret de supressió)
- `logPrivacyAction` — Registrar acció d'auditoria de privacitat
- `getAuditHistory` — Obtenir historial d'auditoria d'una entitat
- `getAuditSummary` — Obtenir resum d'auditoria per un període
- `getActiveLegalDocument` — Obtenir document legal actiu
- `getCurrentLegalVersion` — Obtenir versió actual d'un document legal
- `executeRetentionPolicies` — Executar polítiques de retenció
- `getPrivacyStats` — Obtenir estadístiques de privacitat
- `checkGdprCompliance` — Verificar compliment RGPD d'un client
- `fetchCustomerPrivacyData`
- `listPrivacyAuditLogs`
- `findConsentById`


## 📄 Documents / PDF / Dossier

### `contractPdfService.ts` (1)
- `generateContractPDF`

### `contractService.ts` (9)
- `getCompanyConfig`
- `getDefaultCancellationPolicy`
- `getDefaultTermsAndConditions`
- `renderContractPDF`
- `generateContractFromProposal`
- `sendContract`
- `generateSignedContractPdf`
- `markContractSigned`
- `cancelContract`

### `contractSignatureService.ts` (1)
- `signContractOnline`

### `customQuoteAdminService.ts` (5)
- `listAdminCustomQuotes`
- `createAdminCustomQuote`
- `getAdminCustomQuote`
- `updateAdminCustomQuote`
- `deleteAdminCustomQuote`

### `documentService.ts` (3)
- `generateQuoteNumber` — ============================================ GENERAR NÚMERO DE DOCUMENT ==================
- `generateQuoteHTML` — ============================================ GENERAR HTML DEL PRESSUPOST =================
- `createQuoteFromLead` — ============================================ CREAR PRESSUPOST DES D'UN LEAD ==============

### `dossierCompositePdfService.ts` (1)
- `generateDossierCompositePDF`

### `dossierService.ts` (11)
- `createDossier`
- `getDossiersByLead`
- `getAllDossiers`
- `getDossierById`
- `softDeleteDossier`
- `restoreDossier`
- `purgeDossier`
- `getDeletedDossiers`
- `purgeExpiredDossiers`
- `deleteDossier`
- `sendDossierByEmail`

### `pdfPreviewService.ts` (3)
- `renderCanonicalQuotePreview`
- `renderCanonicalContractPreview`
- `renderCanonicalInvoicePreview`

### `quoteFollowUp.ts` (1)
- `ensureQuoteFollowUpTask`

### `quoteParsing.ts` (3)
- `mapLeadEventType`
- `parseDateOrNull`
- `normalizeQuoteLocale`

### `quotePdfService.ts` (1)
- `generateQuotePDF`

### `quoteRouteHandler.ts` (2)
- `handleLeadQuoteGet`
- `handleLeadQuotePost`

### `quoteTemplateService.ts` (3)
- `normalizeQuoteTemplate`
- `getQuoteTemplateSettings`
- `upsertQuoteTemplateSettings`


## 🌦️ Integracions externes

### `adminManualRoadmapService.ts` (1)
- `buildAdminManualRoadmapProtocolTarget`

### `googleBusinessIntegrationService.ts` (1)
- `getGoogleBusinessIntegrationConfig`

### `googleMapsDistance.ts` (1)
- `calculateGoogleMapsDistance`

### `googleReviewsCacheService.ts` (2)
- `writeGoogleReviewsCache`
- `readGoogleReviewsCache`

### `reviewsSyncService.ts` (2)
- `fetchFromSerpAPI`
- `syncReviews`

### `socialContentPulseService.ts` (1)
- `loadSocialContentPulse`

### `socialIdeasService.ts` (2)
- `generateSocialIdeas`
- `loadSocialIdeas` — ─────────────────────────────────────────────────────────────────────────── WRAPPER: carre

### `socialPostService.ts` (8)
- `validateSocialPostInput` — ─────────────────────────────────────────────────────────────────────────── VALIDATION ───
- `createSocialPost` — ─────────────────────────────────────────────────────────────────────────── CRUD ─────────
- `getSocialPost`
- `listSocialPosts`
- `updateSocialPost`
- `deleteSocialPost`
- `getSocialCalendar`
- `getSocialPostCounts`

### `weatherService.ts` (3)
- `owmMainToKind`
- `getWeatherForEvent`
- `getEventWeatherForecast` — ─── Funció principal ───────────────────────────────────────────────


## ⚙️ Tasques / Automatització / Cron

### `adminAutomationService.ts` (4)
- `readCommercialSequenceMetrics`
- `runCommercialSequencesAutomation`
- `enforceSlaAutomation`
- `runAllAdminAutomations`

### `automationTriggers.ts` (4)
- `onProposalAccepted` — ─── Proposal accepted → auto-generate contract ─────────────────────────────
- `onLeadCreated` — ─── Lead created → immediate welcome email ──────────────────────────────────
- `onBookingConfirmed` — ─── Booking confirmed → auto-generate pre-event checklist ───────────────────
- `dispatchAutoTrigger`

### `dailyChecklist.ts` (1)
- `generateDailyChecklistTasks`

### `postEventDispatchService.ts` (2)
- `listPendingPostEventBookings`
- `sendPostEventEmailForBooking`

### `proposalDispatchService.ts` (1)
- `sendAdminProposal`

### `slaAutomationService.ts` (2)
- `getSlaSnapshot`
- `enforceLeadSla`

### `taskAdminService.ts` (4)
- `listAdminTasks`
- `createAdminTask`
- `updateAdminTask`
- `deleteAdminTask`

### `taskAutomationService.ts` (2)
- `generateAutoTasks` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `runTaskAutomation` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `taskCreation.ts` (1)
- `createUniversalTask`

### `taskList.ts` (1)
- `fetchAdminTaskList`

### `taskQueueService.ts` (3)
- `parseBudgetValue` — Wrapper de la font canònica `parseBudgetAmount` (lib/constants); retorna 0 en comptes de n
- `classifyTaskQueue` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadTaskQueue` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────


## 🧩 Altres / transversal

### `adminConfigHistoryService.ts` (3)
- `normalizePackPricingConfigHistory`
- `readProfitabilityConfigHistory`
- `readPackPricingModelHistory`

### `adminCustomCssService.ts` (2)
- `getAdminCustomCss`
- `saveAdminCustomCss`

### `adminFeaturesService.ts` (3)
- `listAdminFeatures`
- `updateAdminFeature`
- `isAdminFeatureKey`

### `adminOperatingCycleService.ts` (1)
- `buildDashboardOperatingCycle`

### `adminSettingsService.ts` (3)
- `listAdminSettings`
- `updateAdminSettings`
- `createAdminSetting`

### `attributionService.ts` (4)
- `generateAttributionReport`
- `generateMultiTouchReport`
- `loadAttributionReport` — ─────────────────────────────────────────────────────────────────────────── WRAPPERS (Pris
- `loadMultiTouchReport`

### `cacAnalysis.ts` (1)
- `buildCacAnalysis`

### `campaignService.ts` (2)
- `generateCampaigns` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadCampaigns` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `capacityConflictService.ts` (2)
- `detectCapacityConflicts` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadCapacityConflicts` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `cashFlowForecast.ts` (1)
- `buildCashFlowForecast`

### `copyAiSuggestionsService.ts` (1)
- `generateCopySuggestions`

### `crewScheduleService.ts` (12)
- `parseHhmmToMin` — ─── Helpers de temps (purs) ──────────────────────────────────────────────────
- `minToHhmm`
- `toDateKey`
- `deriveInterval` — Deriva l'interval [startMin, endMin] d'una línia a partir de l'horari de l'event i de les 
- `intervalsOverlap`
- `buildCrewSchedule` — Construeix el cuadrant per persona i detecta solapaments dins cada persona+dia. `names`: m
- `buildPayoutSummary` — Repartiment de caixa: per col·laborador, el que cobra (Σ costAmount×qty de les seves línie
- `loadCrewSchedule`
- `loadPayoutSummary`
- `listCrewBlocks` — ─── Bloquejos manuals (CRUD) ──────────────────────────────────────────────────
- `createCrewBlock`
- `deleteCrewBlock`

### `dailyAnomalyService.ts` (2)
- `detectAnomalies` — Detecta anomalies comparant valors actuals contra la mitjana dels últims N dies. Una mètri
- `loadAnomalyReport` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `dailyBriefService.ts` (3)
- `parseBudgetValue` — Wrapper de la font canònica `parseBudgetAmount` (lib/constants); retorna 0 en comptes de n
- `generateDailyBrief` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadDailyBrief` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `discountCodeAdminService.ts` (2)
- `listAdminDiscountCodes`
- `createAdminDiscountCode`

### `faqAdminService.ts` (5)
- `listAdminFaqs`
- `getAdminFaqById`
- `createAdminFaq`
- `updateAdminFaq`
- `deleteAdminFaq`

### `financeAlertsService.ts` (1)
- `getFinanceAlertsSummary`

### `holdedService.ts` (4)
- `isHoldedEnabled` — ============================================ CONFIG ======================================
- `findOrCreateHoldedContact` — Cerca un contacte a Holded per NIF o email, o en crea un de nou.
- `createHoldedInvoice` — Crea una factura a Holded.
- `getHoldedInvoiceStatus` — Obté l'estat d'una factura a Holded.

### `marketingHubService.ts` (2)
- `buildMarketingHubSummary`
- `loadMarketingHubSummary`

### `marketingSpendService.ts` (4)
- `listMarketingSpend`
- `upsertMarketingSpend` — Crea o actualitza la despesa d'un canal per a un mes concret (upsert per la clau única can
- `deleteMarketingSpend`
- `getChannelSpendSummary` — Resum de despesa per canal: total invertit i rang de mesos cobert. Serveix per casar la de

### `operationalForecastService.ts` (2)
- `buildWeeklyCapacityForecast`
- `loadWeeklyCapacityForecast`

### `operationalPulseService.ts` (2)
- `generateOperationalPulse` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadOperationalPulse` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `pipelineForecast.ts` (1)
- `buildPipelineForecast`

### `postEventPlaybookService.ts` (2)
- `buildPostEventPlaybook` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadPostEventPlaybook` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `profitabilityService.ts` (4)
- `normalizeProfitabilityConfig`
- `getProfitabilityConfig`
- `upsertProfitabilityConfig`
- `buildProfitabilityReport`

### `proposalAdminService.ts` (6)
- `listAdminProposals`
- `createAdminProposal`
- `getAdminProposalById`
- `updateAdminProposal`
- `reassignProposalOwner`
- `deleteAdminProposal`

### `protocolCanvisService.ts` (4)
- `parseProtocolCanvis`
- `indexProtocolCanvisByNumber`
- `parseProtocolSections`
- `indexProtocolSectionsById`

### `protocolValidationsService.ts` (4)
- `summarizeValidations`
- `loadCanviValidations`
- `recordCanviValidation`
- `removeCanviValidation`

### `protocolValidationViewerService.ts` (12)
- `normalizeProtocolValidationFilter`
- `filterProtocolCanvisByValidation`
- `summarizeProtocolValidationFilterCounts`
- `summarizeProtocolValidationProgress`
- `findFirstPendingProtocolCanvi`
- `describeProtocolValidationFilter`
- `shouldAutoOpenProtocolCanvi`
- `describeProtocolValidationEmptyState`
- `describeProtocolValidationResults`
- `describeProtocolSectionResults`
- `describeProtocolSectionEmptyState`
- `describeProtocolPendingShortcut`

### `publicDiscountCodeService.ts` (1)
- `validatePublicDiscountCode`

### `questionnaireService.ts` (7)
- `listQuestionnaireTemplates`
- `getQuestionnaireTemplate`
- `createQuestionnaireTemplate`
- `updateQuestionnaireTemplate`
- `deleteQuestionnaireTemplate`
- `getBookingQuestionnaire`
- `submitQuestionnaireResponse`

### `quickCreateFlow.ts` (1)
- `quickCreate`

### `referralsService.ts` (2)
- `computeReferralsSummary` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `loadReferralsSummary` — ─────────────────────────────────────────────────────────────────────────── WRAPPER ──────

### `responseTrackingService.ts` (3)
- `deriveLeadResponseState`
- `detectPendingFollowUps`
- `loadPendingFollowUps` — ─────────────────────────────────────────────────────────────────────────── WRAPPER — carr

### `safataService.ts` (4)
- `getSafataLeads`
- `getSafataStats`
- `getEmailSignatureSetting`
- `saveEmailSignatureSetting`

### `signatureService.ts` (2)
- `getEmailSignatureHtml` — Genera firma professional HTML per als emails enviats des de l'admin. Si hi ha una firma p
- `getEmailSignatureText` — Genera firma en text pla. Si hi ha firma personalitzada a BD, la usa.

### `textManagerService.ts` (3)
- `getTextManagerPayload`
- `saveTextManagerModifications`
- `runTextManagerAction`

### `translationService.ts` (4)
- `translateTextForLocale`
- `translateHtmlForLocale`
- `translateContent`
- `detectContentLanguage`

### `urgentFollowUpAlertService.ts` (4)
- `filterNewUrgentAlerts` — ─────────────────────────────────────────────────────────────────────────── PURE FUNCTION 
- `buildUrgentAlertEmail`
- `buildUrgentAlertWhatsApp`
- `runUrgentFollowUpAlerts` — ─────────────────────────────────────────────────────────────────────────── WRAPPER — carr

### `weddingCoverage.ts` (1)
- `getWeddingCoverageZones`

