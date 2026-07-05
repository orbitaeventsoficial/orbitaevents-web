# La Màquina Òrbita — Tesi d'auditoria vertical i full de ruta

> **Encàrrec del propietari (2026-07-04):** auditoria vertical de *tots* els processos i
> components, del lead fins al post-event, auditant tots els cervells (economia inclosa),
> portfolios, ordres, scripts i com es cusen. Objectiu: el full de ruta per **dinamitzar,
> millorar, economitzar i automatitzar** tots els processos i construir «la millor màquina
> del món».
>
> **Mirada:** dissenyador web (com es *sent* i s'*usa*) + ESADE (on hi ha *valor econòmic*
> i on es *fuga*). Escrit després de recórrer el codi real —no des de memòria—: cervells
> econòmics, automatismes, crons, esquema, rutes i el cablejat entre òrgans.
>
> **Relació amb el diagnòstic anterior** (`DIAGNOSTIC-I-FULL-DE-RUTA.md`, 2026-06-28): aquell
> va establir *què és* i *la mida*. Aquesta tesi va un pas més enllà: **com flueix el valor**
> per la cadena, **on es perd** i **quin ordre d'automatització dona més ROI**. No el
> substitueix; el continua.

---

## Part I — La tesi en una frase

> **Òrbita Events és un ERP vertical d'un sol operador amb un motor econòmic que diu la
> veritat.** El seu actiu ocult no és cap pantalla: és una **columna vertebral de dades
> —la línia de servei— que travessa tot el cicle**, i un **cervell econòmic monocapa** que
> converteix qualsevol bolo en marge real. El coll d'ampolla no és el motor: és que el motor
> encara no *treballa sol* ni *parla clar* al seu únic operador.

Tres afirmacions que sostenen tota la tesi (i que el codi confirma):

1. **Hi ha UNA veritat econòmica, no cinc.** `costEngine`, `travelLaborCost`,
   `repartimentService`, `collaboratorPayoutService` i `economicCockpit` són funcions pures,
   solidàries, consumides per totes les superfícies (lead, reserva, cuadrant, portal, PDFs).
   Canvia una línia i el número es mou a tot arreu alhora. Això és rar i valuós.
2. **Hi ha UNA columna vertebral operativa: la `ServiceLine`.** El «bolo» neix com a línies
   al lead, es projecta al dossier, es **copia** a la reserva en guanyar, i d'aquestes línies
   deriven transport, repartiment, pagament a col·laboradors, calendari i documents. Un sol
   ADN recorre tot el cos.
3. **El problema real és de palanca, no de motor.** El propietari usa el 10-20% del sistema
   perquè (a) la perifèria té errades/manques i (b) 93 pàgines són inabastables per a un sol
   cap. La feina d'ara no és afegir múscul: és fer que el múscul **es contragui sol** i que
   el cap **només hagi de mirar un lloc**.

---

## Part II — La cadena de valor vertical (el recorregut complet)

El negoci és una sola cinta transportadora. La dibuixo amb els **òrgans de codi reals** a
cada estació i **els nexes** (com passa la informació d'una a l'altra).

```
  ADQUISICIÓ          CAPTACIÓ           QUALIFICACIÓ         PROPOSTA
  (web pública)  →    (lead)        →    (comercial)     →   (dossier/quote)
       │                 │                    │                   │
  SEO municipi      contact form         scoring+SLA         línies del bolo
  packs/config      inbox IMAP           NBA/sequences       computeBoloTransport
  portfolio         extract (IA)         daily brief         dossier-html-builder
       │                 │                    │                   │
       ▼                 ▼                    ▼                   ▼
  ─────────────────────────────────────────────────────────────────────────
  TANCAMENT          OPERATIVA           ESDEVENIMENT         POST-EVENT
  (booking)     →    (cuadrant)     →    (execució)      →   (playbook)
       │                 │                    │                   │
  copia serviceLines  crew schedule       checklist          thank-you
  Stripe/Bizum/cash   capacity conflict   inventory          testimonial+review
  contract/invoice    repartiment         calendar sync      referral → nou lead
       │                 │                    │                   │
       └─────────────────┴──── EL VOLANT ─────┴───────────────────┘
                    (el post-event alimenta l'adquisició)
```

### Estació per estació — què hi ha i com es cus

| # | Estació | Òrgans (codi real) | Nexe cap a la següent |
|---|---|---|---|
| 1 | **Adquisició** | 74 pàgines públiques: SEO per municipi (`dj-bodas-*`, `discomovil-*`), `packs`, `configurador`, `portfolio`, `contacto`. `attributionService`, `publicBookingService` | El visitant deixa `source`/UTM → entra al lead |
| 2 | **Captació** | `contactLeadCaptureService` (form), `inboxLeadImportService` (IMAP), `emailLeadExtractionService`+`leadTextExtractionService` (IA extreu dades d'un WhatsApp/email enganxat) | `onLeadCreated` → email de benvinguda automàtic amb fallback a task; lead `NEW` |
| 3 | **Qualificació** | `commercialScoring`, `slaAutomationService`, `commercialSequenceService`, `nextBestActionService` (745 L), `dailyBriefService`, `leadPipelineSuggestionsService` | Estat: `NEW→CONTACTED→QUOTE_SENT→NEGOTIATING` |
| 4 | **Proposta** | `dossierService`+`dossier-html-builder`, `quotePdfService`, `proposalAdminService`, `leadServiceLineService` (les línies del bolo), `computeBoloTransport` | Es fixen les `LeadServiceLine`; s'envia dossier/pressupost |
| 5 | **Tancament** | `bookingCreationService` (**copia** `lead.serviceLines`→`booking.serviceLines`), `bookingStripePaymentService`, `bookingBizumService`, `contractService`+`contractPdfService`, `invoiceService` | Lead `WON` → `Booking PENDING`; `onBookingConfirmed` |
| 6 | **Operativa** | `crewScheduleService`, `capacityConflictService`, `dayCollisionService`, `bookingCapacityService`, `bookingInventoryService`, `repartimentService`, `seasonCalendarService` | Checklist pre-event, assignació d'inventari, col·lisions de dia, repartiment |
| 7 | **Esdeveniment** | `bookingChecklistService`, `googleCalendarSyncService`, `crewBlock`/`Availability` | Estat `PREPARING→COMPLETED` |
| 8 | **Post-event** | `postEventPlaybookService`, `postEventDispatchService`, `questionnaireService`, `reviewsSyncService`, `referralsService`, `reactivationService` | Testimoni→portfolio; referral→**nou lead** (volant) |
| ∞ | **Client hub** | `fetchCustomerHub`, `customerSegmentationService`, `customerActivityService`, `customerInsightsService`, `clientPortalAccess` | El client viu per sobre de tot el cicle |

**El nexe més important de tot el sistema** (i el més ben resolt) és el pas 4→5:
`bookingCreationService` llegeix `lead.serviceLines` i les torna a crear com a
`booking.serviceLines`. Per això el mateix bolo —amb el mateix transport, el mateix
repartiment i el mateix marge— és coherent des del primer contacte fins a la liquidació del
col·laborador. **Aquesta continuïtat és el moat tècnic del producte.**

---

## Part III — Els cervells (inventari canònic dels motors)

«Un sol cervell, moltes pàgines» no és un eslògan: és l'arquitectura. Aquests són els
cervells i el seu estat de salut real.

### 1. Cervell econòmic — 🟢 EXCEL·LENT (el cor fiable)
- **`costEngine.ts`** — `computeBookingFinancialSummary` / `computeDirectCostBreakdown`. Font
  única de marge/cost. Separa marge de servei propi, markup de subcontractació
  (`SUBCONTRACTED_MARKUP_TARGET_PCT = 20`), marge de transport i CAC. `computeServiceLineEconomics`
  és la regla única de cost per línia.
- **`travelLaborCost.ts`** — `computeBoloTransport` (font única del transport). Doctrina
  codificada: `CLIENT_TRAVEL_MARGIN = 1` (break-even conscient), franquícia de 50 km
  (`INCLUDED_TRAVEL_KM`), temps de tripulació a 15 €/h en blocs de 30 min amb 1a hora
  inclosa, dieta de 30 €/persona en rutes >3 h. `deriveTravelHeadcount` compta persones
  físiques (els rols que fas tu col·lapsen en 1). **Molt fi.**
- **`repartimentService.ts`** — `computeBoloRepartiment`. «Qui cobra què», element a element,
  en € absoluts. Pura i solidària: lead, reserva i cuadrant projecten el mateix.
- **`collaboratorPayoutService.ts`** — `loadCollaboratorPayout`. La «pasta» d'un col·laborador
  creuant repartiment amb `CollaboratorPayment` (PREVI/ENTREGAT/PAGAT).
- **`economicCockpitService.ts`** — `buildEconomicCockpit` = `pipelineForecast` (leads
  ponderats) + `cashFlowForecast` (reserves compromeses). Previsió a 6 mesos amb YoY i marge net.
- **Suport:** `profitabilityService` (config única de ratis/CAC), `cashFlowForecast`,
  `pipelineForecast`, `cacAnalysis` (**CAC real ja implementat**: despesa `MarketingSpend` /
  guanyats del període), `marketingSpendService`, `profitabilityService`.

> **Veredicte ESADE:** la comptabilitat de gestió d'aquesta empresa és millor que la de
> moltes pimes amb gestor. El motor sap el marge real de cada bolo. **El que falta no és
> càlcul: és que aquest càlcul dirigeixi les decisions abans de dir «sí» a un bolo.**

### 2. Cervell comercial — 🟢 SÒLID, 🟡 infrautilitzat
`commercialDailyAutomationService` (cron diari) orquestra: seqüències comercials, SLA de
leads, recordatoris de pagament, scoring de leads (`commercialScoring`), conflictes de
capacitat i `dailyBrief`. `nextBestActionService` (745 L) calcula la propera millor acció.
`leadReengagementService` i `reactivationService` recuperen leads freds. **Existeix un
copilot comercial complet; el repte és que el propietari el *miri* i s'hi *refiï*.**

### 3. Cervell operatiu — 🟡 POTENT però poc cablejat a la realitat diària
`crewScheduleService` (qui treballa quan), `capacityConflictService` (solapaments d'inventari
i equip), `dayCollisionService` (dies amb 2+ bolos compromesos, sobretot dissabtes),
`operationalForecastService` (previsió de capacitat setmanal), `bookingCapacityService`,
`seasonCalendarService`. El cuadrant + repartiment (memòria `project-cuadrant-repartiment`)
és la vista operativa. **El recurs escàs —els dissabtes— viu aquí; és on més valor hi ha per
protegir.**

### 4. Cervell de comunicació — 🟢 BO
`timelineQueryService` (timeline canònica unificada, 850 L), `commTimelineService`,
`adminEmailSendService`, `emailTrackingService`, `inboxLeadImportService`,
`whatsappService` (**integració real Meta Cloud API**, activada per env vars). Escriptures
tipades, «qui ha de respondre» correcte. Ja consolidat en la tanda #1187-1197.

### 5. Cervell d'adquisició i contingut — 🟡 FORT en SEO, 🔴 fluix en tancar el llaç econòmic
Web pública amb SEO agressiu per municipi (l'estratègia d'adquisició, memòria
`project-seo-municipis-preus`), `portfolioEventService`+`portfolioMediaService` (les històries
que venen), `attributionService`, `cacAnalysis`, `marketingSpendService`, `socialPostService`,
`campaignService`, `googleAdsIntegration`. **La maquinària de CAC real existeix però està
buida de dades** (ningú carrega `MarketingSpend`), així que l'atribució es queda en estimació.

### 6. Cervell de post-event — 🟡 CONSTRUÏT, poc automatitzat
`postEventPlaybookService` (4 accions: agraïment, testimoni, social, referral),
`postEventDispatchService` (cron), `questionnaireService`+`ClientSurvey`/`ClientFeedback`,
`reviewsSyncService`, `referralsService`, `weddingCoverage`. **Aquí viu el CAC més barat del
món —el client content— i és l'estació menys explotada.**

### 7. Cervell de documents — 🟢 RIC
`dossierCompositePdfService`, `quotePdfService`, `contractPdfService`, `invoicePdfService`,
`catalogPdfService`, `executiveReportPdfService`, `collaboratorPayoutPdfService`,
`dossier-html-builder`. Tot consumeix el motor econòmic (mai reinventa números). El dossier
acaba de rebre polish editorial (#1394-1401).

### 8. Cervell de compliance — 🟢 SERIÓS
`privacyService` (910 L, RGPD: consents, data requests, retention policies, audit log),
cron `data-retention`. Poc glamurós, ben fet.

---

## Part IV — Diagnòstic ESADE: unit economics i recursos escassos

### Els tres motors d'ingrés (i el seu marge)
1. **Servei propi (DJ d'Òrbita)** — marge alt. És on el propietari *ha* de competir.
2. **Revenda de partners (Masquerade, Tino…)** — marge = markup, objectiu **20%**
   (`SUBCONTRACTED_MARKUP_TARGET_PCT`). El motor ja avisa si un bolo no arriba.
3. **Transport** — **marge zero volgut** (`CLIENT_TRAVEL_MARGIN = 1`). Doctrina del propietari:
   *«el transport és cost, no negoci; el marge viu al producte»*. És estratègicament correcte.

### Els tres recursos escassos (on es guanya o es perd de debò)
1. **Els dissabtes (temps-escenari).** ~50 caps de setmana l'any. Cada «sí» a un mal bolo és
   un «no» a un de bo (és literalment una de les màximes del sistema, `ADMIN_ECONOMY_MAXIMS`).
   **Palanca #1:** que el motor digui, *abans* d'acceptar, si el bolo mereix el dissabte.
2. **L'atenció del propietari (ample de banda cognitiu).** 93 pàgines. El coll d'ampolla humà.
   **Palanca #2:** col·lapsar 93 pàgines en *una brúixola diària* que digui què fer avui.
3. **La caixa (timing).** `cashFlowForecast` ja ho modela. Cobrar abans, pagar després
   (màxima «la caixa és la reina»). **Palanca #3:** automatitzar recordatoris i dipòsits.

### On es fuga valor avui (honest)
- **Fuga de temps comercial:** cada lead es treballa a mà encara que el copilot (scoring, NBA,
  seqüències) ja sap què fer. El sistema *pensa* però no *actua* sol prou.
- **Fuga de CAC:** el post-event (referrals, ressenyes) —el canal més barat— no es dispara
  automàticament. Es capta car (SEO/Ads) i no es reactiva barat.
- **Fuga de marge silenciosa:** no hi ha un *guardarail* al moment de fer el pressupost que
  bloquegi o alerti un bolo per sota de llindar (el motor ho sap *després*, no *abans*).
- **Fuga de decisió:** la maquinària de CAC real, pricing per data (`datePricingService`,
  `seasonCalendarService`) i previsió existeix però no alimenta les decisions perquè falten
  dades d'entrada (marketing spend) o superfície de decisió.

---

## Part V — El full de ruta (prioritzat per ROI: esforç × impacte)

Principi rector: **no construir cervells nous —ja hi són— sinó connectar-los perquè actuïn
sols i parlin clar.** Ordenat perquè cada onada financi la següent (menys temps del propietari
→ més marge → més capacitat de millorar).

### 🌊 Onada 0 — «La màquina et parla» (brúixola única) · esforç BAIX · impacte MÀXIM
El problema #1 del propietari és cognitiu (93 pàgines). La solució ja existeix mig feta:
`dailyBriefService`, `nextBestActionService`, `operationalPulseService`, `economicCockpit`.
- **0.1** Consolidar UNA pantalla «Avui» (home de l'admin): 5 coses que importen avui —leads
  que criden, pagaments pendents, bolos de la setmana, conflictes de capacitat, la xifra de
  caixa del mes. Tot ja calculat; només falta *una* superfície que ho reuneixi i sigui la
  pàgina d'aterratge.
- **0.2** Que el `dailyBrief` s'enviï cada matí (email/WhatsApp) amb «les 3 accions d'avui».
  El cron `commercial-daily` ja el genera; falta el canal de sortida al propietari.
- **Per què primer:** converteix «no me'n refio perquè és massa» en «obro un lloc i sé què
  fer». Desbloqueja l'ús de tota la resta. Zero motor nou.

### 🌊 Onada 1 — Autopilot comercial (del lead al «sí») · esforç MITJÀ · impacte ALT
- **1.1 Resposta < 5 min automàtica — FET #1418.** `onLeadCreated` crea el lock/audit amb
  `dedupeKey`, envia el welcome email sol si hi ha SMTP, usa la plantilla editable `welcome`
  i el `preferredLocale`, i deixa tasca manual si no pot enviar. La velocitat de resposta
  és el predictor #1 de conversió; ara ja no depèn d'una acció manual.
- **1.2 Dossier/pressupost auto-esborrany.** En arribar un lead qualificat, generar el
  dossier en esborrany amb els serveis suggerits (`packSuggestionService`,
  `leadPipelineSuggestionsService`) perquè el propietari només revisi i premi «enviar».
- **1.3 Seqüències multicanal reals.** `commercialSequenceService` + `whatsappService` +
  `emailTemplateService`: 3 tocs automàtics (email→WhatsApp→email) amb aturada en resposta.
- **1.4 Prioritació per scoring a la vista de leads.** Que el kanban ordeni/pinti pel score
  (`commercialScoring`) i mostri l'NBA per lead. El cervell ja el calcula.

### 🌊 Onada 2 — Autopilot operatiu (del «sí» a l'escenari) · esforç MITJÀ · impacte MITJÀ-ALT
- **2.1 Checklist pre-event que es dispara i recorda.** `onBookingConfirmed` ja el crea;
  afegir recordatoris T-7/T-2 dies i assignació automàtica d'inventari (`bookingInventoryService`).
- **2.2 Guàrdia de capacitat proactiva — FET parcial #1421.** `capacityConflictService`+
  `operationalForecastService` ja detecten solapaments d'inventari/capacitat, i
  `dayCollisionService` ja porta a «Avui» els dies amb 2+ bolos compromesos. Pendent com a
  següent refinament: elevar aquest avís al moment de crear/acceptar el segon bolo del dia.
- **2.3 Repartiment i pagament de col·laboradors semi-auto.** `collaboratorPayoutService` ja
  sap qui cobra què; afegir «marcar pagat» en bloc i recordatori del que s'ha entregat i no
  pagat (estat ENTREGAT).

### 🌊 Onada 3 — El volant post-event (l'escenari alimenta el proper lead) · esforç BAIX-MITJÀ · impacte ALT (CAC↓)
Aquesta és, en termes ESADE, **la millor inversió del roadmap**: converteix cost enfonsat
(bolo ja fet) en adquisició gratuïta.
- **3.1 Dispatch automàtic del playbook.** `postEventPlaybookService` ja calcula les 4 accions;
  el cron `post-event` ja llista pendents. Automatitzar l'enviament de l'agraïment + petició de
  ressenya Google (T+1 dia) i de testimoni (T+3).
- **3.2 Referral loop.** `referralsService`: després d'un event 5★, oferta de referral amb codi
  (`CustomerDiscountCode`) que crea un lead atribuït. Tancar el volant del diagrama.
- **3.3 Testimoni → portfolio automàtic.** Un testimoni aprovat alimenta `portfolioEventService`
  → nova pàgina SEO amb prova social real. Contingut que ven, generat pel propi client.

### 🌊 Onada 4 — Economització (marge i CAC de veritat) · esforç MITJÀ · impacte ESTRATÈGIC
- **4.1 Guardarail de marge al pressupost.** Al moment de fer el dossier/quote, si el
  `computeBookingFinancialSummary` dona marge < llindar o markup subcontractat < 20%, avís
  visible *abans* d'enviar. El motor ja té el número; falta posar-lo davant de la decisió.
- **4.2 Protecció del dissabte.** Combinar `seasonCalendarService` + `capacityConflict` +
  marge: un semàfor que digui «aquest bolo, en aquesta data escassa, val el dissabte?».
- **4.3 CAC real operatiu.** Rutina mensual (o import) per carregar `MarketingSpend` per canal
  → `cacAnalysis` passa d'estimat a real → es veu quin canal (SEO municipi vs Ads) porta
  clients rendibles. Decideix on posar l'euro següent. (Memòria `project-cac-real-pendent`.)
- **4.4 Pricing per data.** `datePricingService`+`seasonCalendarService` ja existeixen:
  activar recàrrec/preu dinàmic en dates d'alta demanda (dissabtes de temporada) — el recurs
  escàs s'ha de preuar com a escàs.

### 🌊 Onada 5 — Claredat i consolidació (per al novell) · esforç VARIABLE · impacte SOSTINGUT
Del diagnòstic anterior, encara vàlid: **una capacitat = un camí**. No campanya d'esborrat
massiu (verificat 5 cops: l'organisme és viu, no inflat), sinó:
- **5.1** Reduir superfície a la UI: amagar del menú el que no s'usa (decisió de navegació, no
  d'esborrat). Requereix input del propietari: què uses / què no.
- **5.2** Connectar les òrfenes que es volen (no fer-ne de noves); matar només les traçades
  buides. Inventari: `docs/audit/inventari-funcions-orfenes.md`.
- **5.3** Atles navegable: mapes i noms entenedors perquè un sol cap abasti l'organisme.

---

## Part VI — La visió: «la millor màquina del món»

La màquina ideal per a aquest negoci **no és la que té més pàgines: és la que demana menys
atenció**. En estat final:

- **Al matí,** el propietari rep 3 accions (no 93 pàgines). La màquina ja ha respost els leads
  nous, ja ha enviat els esborranys de dossier, ja ha recordat els pagaments.
- **Al fer un pressupost,** la màquina li diu en verd/ambre/vermell si el bolo val la pena
  *abans* de dir que sí, i si crema un dissabte que podria valer més.
- **Després d'un event,** la màquina agraeix, demana la ressenya, ofereix el referral i publica
  el testimoni al portfolio —sola— convertint cada client content en el proper lead barat.
- **Cada euro de marketing** té un CAC real associat, així que el propietari sap on invertir.
- **El motor econòmic** —que ja diu la veritat— ara també *dirigeix*: no és una calculadora,
  és un copilot que protegeix el marge i el temps.

En una frase: **passar d'un ERP que el propietari ha de conduir a un copilot que condueix i el
deixa decidir.** El motor ja hi és. Les onades 0-3 són, sobretot, *cablejat i canals de
sortida*, no motor nou —per això el ROI és tan alt.

---

## Part VII — Mètriques d'èxit (com sabrem que la màquina millora)

| Palanca | Mètrica | Font (ja existeix) |
|---|---|---|
| Velocitat comercial | Temps mitjà 1a resposta a lead | `slaAutomationService`, `leadActivity` |
| Autopilot | % leads amb 1a resposta automàtica | `automationTriggers`, tasks |
| Conversió | Taxa lead→WON per canal | `cacAnalysis`, `leadLossAnalyticsService` |
| Volant post-event | Ressenyes/testimonis/referrals per bolo | `postEventPlaybookService` |
| CAC | CAC real per canal | `cacAnalysis` + `MarketingSpend` |
| Marge | % bolos per sota de llindar enviats | `costEngine`, guardarail nou |
| Temps escàs | Ocupació i marge/dissabte | `seasonCalendarService`, `capacityConflict` |
| Atenció | Nº de pàgines que el propietari obre/dia | `adminLog` |

**Definició de «fet» de tot el roadmap:** que el propietari passi del 10-20% al 100% de
confiança —no perquè hi hagi més pantalles, sinó perquè la màquina fa la feina i ell només
decideix.

---

## Apèndix A — Els números de la bèstia (2026-07-04)

| Dimensió | Quantitat |
|---|---|
| Serveis (`lib/services`) | 217 (~46.500 L) |
| Rutes API | 222 (166 admin) |
| Pàgines admin | 93 |
| Pàgines públiques | 74 |
| Models Prisma | 64 |
| Crons | 15 |
| Scripts npm | 121 |
| Guards `validate:core` | 68+ |
| Tests | ~5.000 |
| `ADMIN_CHANGE_COUNTER` | 1401 |

## Apèndix B — Els 15 crons (el que ja passa sol)

`calendar-sync` · `commercial-daily` (el cor: seqüències+SLA+pagaments+scoring+brief) ·
`customer-lifecycle` · `data-retention` · `dossier-trash-purge` · `fuel-daily` (preu benzina
MITECO) · `invoice-sync` · `lead-cleanup` · `lead-reengagement` · `pack-pricing-check` ·
`post-event` · `reviews-sync` · `tasks-auto` · `urgent-followup-alerts` · `weekly-benchmark`.

## Apèndix C — Prioritització visual (esforç × impacte)

```
IMPACTE
  ▲
A │  [O3 volant]   [O1 autopilot]     [O0 brúixola]
L │                [O4 economització]
T │
──┼───────────────────────────────────────────────
M │  [O2 operativa]        [O5 claredat]
I │
G │
  └────────────────────────────────────────────────▶ ESFORÇ
     BAIX              MITJÀ                 ALT
```

**Ordre recomanat d'execució:** O0 → O1 → O3 → O2 → O4 → O5.
(O3 puja abans que O2 perquè el volant post-event és el CAC més barat i és esforç baix.)

---

*Escrit el 2026-07-04 recorrent el codi real. Aquesta tesi és estratègia, no llei: la llei
segueix sent `CLAUDE.md`. Per executar cada onada, obrir un `Canvi #N` amb el mètode de sempre
(servei→pàgina→missatges→test→diari→counter) i validació real.*
