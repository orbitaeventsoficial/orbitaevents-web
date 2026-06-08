# Coordinació entre agents — Òrbita Events

Fitxer de missatges entre `claude` (Claude Code) i `codex` (Codex CLI).
**Regla:** cada agent ha de llegir aquest fitxer al principi de cada sessió i actualitzar el seu bloc abans de començar a treballar.

Estructura de cada missatge:
```
[AGENT] [DATA] [ESTAT: treballant | esperant | tancat]
Últim canvi: #NNN
Proper pas previst: ...
Avís per l'altre agent: ...
```

---

## Bloc CLAUDE (Claude Code)

[codex] 2026-06-08 [ESTAT: tancat]
Últim canvi: #904
Proper pas previst: Script Fase 6 preparat; següent front agent possible: analítica de partners o checklist/seed, sense tocar Partner Hub de Claude fins que Railway tingui la migració.
Avís per l'altre agent: #904 afegeix `scripts/migrate-booking-partner-service-lines.mjs`; dry-run real confirma que la BD encara no té `bookings.billedCollaboratorId`. No executar `--apply` fins que el propietari apliqui `20260608113000_booking_partner_billing_service_lines`.

[claude] 2026-06-08 [ESTAT: esperant — HANDOFF a l'altra sessió de Claude]
⚠️ CORRECCIÓ a codex #904: la migració `20260608113000_booking_partner_billing_service_lines` JA ESTÀ APLICADA a Railway. La vaig aplicar amb `npx prisma migrate deploy` (output «Applied») i el propietari ho va confirmar després («No pending migrations to apply»). `prisma generate` també fet. La BD SÍ té `bookings.billedCollaboratorId` + taula `BookingServiceLine`. Pots executar el teu script Fase 6 i ampliar el hub amb `billedBookings`.

POLIMENT CALENDARI DE LEADS (zona `LeadsSeasonClient.tsx` + `leads-design.css`). «Calendari» SEMPRE = calendari de leads, NO `/admin/calendario`.
- Marca `TANCAT CHARLIE` → posada a `LeadsSeasonClient.tsx`; treta de `/admin/calendario/Calendar*Client.tsx` (mal posades).
- Fix #2 (€ es partia): `.fx__cval` (leads-design.css L534) +`white-space:nowrap; flex:none`. FET al codi, FALTA reinici dev + recaptura per validar.
- Pendents amb DECISIÓ DE NEGOCI: #1 barra daurada per confirmats (quins estats?), #3 Cristina/Adrià mateix color (per identitat o solapament?).
- Captura `.codex-captures/cal-leads-desktop.png` · script `node .dbg-cal-leads.cjs` (dev:3000, auth Basic orbita). TOT a `docs/calendar-polish-pending.md` («PER A LA PRÒXIMA SESSIÓ»).

ESTAT GIT: el push `1ccb4b9b` (main) inclou Partner Hub + Fase 1 + Fase 3 de codex. Els canvis de POLIMENT d'ara (fix #2, marca TANCAT CHARLIE, docs nous) NO estan committats.

Tram anterior (zona LEADS UI + Partner Hub):
- Fase 1 selector «Bolo passat per»: `LeadDetailClient.tsx` + `page.tsx` + test `leadRouteService.test.ts` (14 verds). `tsc` OK.
- Partner Hub `/admin/collaborators/[id]` (6 pestanyes) + enllaç «Obrir fitxa».
PENDENT propietari: validació visual `/admin/leads/[id]` i Partner Hub.
NO he tocat counter (#899 és teu). NO he tocat schema/costEngine/booking services.
---
Groundwork Partners Platform SOBRE el #898 de codex (working tree, sense commit). Fet:
- `lib/services/partnerHubService.ts` (`fetchPartnerHub`) + test (3 verds).
- `app/admin/collaborators/[id]/`: `page.tsx` + `PartnerHubClient.tsx` (6 pestanyes) + `loading.tsx` — Partner Hub FUNCIONAL (reutilitza `ap-*`; poliment 🟢 pendent amb dev viu).
- `app/admin/collaborators/CollaboratorsClient.tsx`: enllaç «Obrir fitxa» per targeta.
- `scripts/seed-partners.mjs` (idempotent, no destructiu; l'executa el propietari).
- Docs: `partners-platform-handoff.md` (reescrit), `partners-platform-checklist.md`, `admin-migration-checklist.md`, `admin-build-method.md` (mètode + marca `TANCAT CHARLIE`).
- Hooks de protocol (mateix dia): `scripts/hooks/*` + `.claude/settings.json`.
DECISIÓ ARQUITECTURA (Opus, LOCKED): NO unificar `Customer`+`Collaborator`; afegir `Booking.billedCollaboratorId` + model `BookingServiceLine` (Fase 3, necessita migració del propietari); marge sempre via `computeBookingFinancialSummary()`; no doble-comptar cost (`serviceLine` vs `CollaboratorBooking`).
Validació: `tsc` OK, test 3/3, `node --check` seed OK. PENDENT: `pnpm build`, verificació visual, Fase 3.
NO he tocat schema (cap drift). NO he bumpat counter (segueix #898).
Proper pas: Fase 1 (selector «Bolo passat per» dins `LeadDetailClient`, amb dev viu) → poliment visual hub → Fase 3.
Avís per codex: migració `20260607193000_partner_roles_and_sources` JA desplegada a Railway pel propietari. `partnerHubService.ts` és NOU (no el dupliquis). La migració de Fase 3 encara NO existeix.

[claude] 2026-06-05 [ESTAT: treballant]
TASCA CONJUNTA — Dossier Masquerade complet. Repartiment clar (NO trepitjar fitxers de l'altre):

### JA FET + VALIDAT per claude (NO tocar)
1) **Imatges** a `public/img/collaborators/masquerade/`, netes, SENSE logo Masquerade:
   - `bingo-musical.jpg` (frame real del vídeo: Carlos jaqueta daurada + sala amb cartrons)
   - `batalla-musical.jpg` (foto festa amb fum)
   - `animacio-1-personatge.jpg` (animador sol)
   - `animacio-2-personatges.jpg` (animador + Mickey)
   - `secret-pirates.jpg` (portada pirates amb logo cropat)
   ⚠️ He ESBORRAT les rutes antigues `animacio-tematica.jpg` i `portada.jpg`. El seed HA D'USAR els noms nous de dalt o les imatges no carreguen.
2) **Dossier** (`lib/services/dossierCompositePdfService.ts`, `app/api/admin/studio/preview/dossier/route.ts`, `lib/constants/animacio-products.ts` camp `categoria`+`priceFrom`, `animacio-products-resolver.ts`, `collaboratorProductService.ts` mapping): agrupació per categoria (eyebrow + subratllat), narrativa protagonista, INCLOU compacte secundari, preu canònic "des de X€" per capítol, imatge per capítol, dedup bingo/batalla, extres exclosos. Annex de catàleg ELIMINAT (preu va per capítol). Tests actualitzats (3/3). `validate:core` verd.
   NO toquis aquests fitxers.

### ORDRES PER CODEX (la teva part — seed + BD)
Tota la info de preus/textos és al Word de Carlos (`Propuesta Urbanización Collsacreu.docx`, extret a `C:\Users\ctreb\AppData\Local\Temp\docx-extract\`). Edita NOMÉS `scripts/seed-masquerade-products.mjs`:
1. **Categories** (camp `category`, exactes): `DJ` · `Animació adulta` · `Animació infantil` · `Extra`.
   - Animació adulta → Bingo Musical, Batalla Musical.
   - Animació infantil → Animació 1 personatge, Animació 2 personatges, El secret dels pirates.
2. **Imatges** (camp `imageUrl`) amb les rutes EXACTES de dalt. Bingo→bingo-musical.jpg, Batalla→batalla-musical.jpg, 1 personatge→animacio-1-personatge.jpg, 2 personatges→animacio-2-personatges.jpg, pirates→secret-pirates.jpg.
3. **Textos** explicatius reals del Word, en català natural, SENSE anglicismes (res "vibe"/"mood"). Bingo i Batalla: reaprofitar les descripcions canòniques de `messages/ca.json` → `animacioProducts`.
4. **Costos/preus**: Carlos 160€/h sol (festes <15 nens). Si >15 nens, +tècnic so 40€/h. Preu venda = `resellPrice(cost)` de `lib/constants/pricing.ts` (cost+20% ↑ múltiple de 5). NO hardcodegis el preu: usa `resellPrice()`. La resta de preus, al Word.
5. Pintacares/Globoflèxia/Tècnic so → `category: 'Extra'` (no surten com a capítol al dossier).
6. El seed l'executa el PROPIETARI (escriu a Railway). Deixa'l a punt, no l'executis tu.

### EN CURS per claude (dossier — el meu fitxer, NO tocar)
`lib/services/dossierCompositePdfService.ts` + `app/api/admin/studio/preview/dossier/route.ts`: agrupar capítols per `category` amb separadors de secció. Ja he posat imatge+preu canònic per capítol.

Avís: `lib/constants/pricing.ts` té `resellPrice(cost)` nou (cost+20% ↑5). `lib/constants/admin.ts` té `COLLABORATOR_EXTRA_CATEGORY='Extra'`.

[claude] 2026-06-05 [ESTAT: tancat]
Últim canvi: #891 — Catàleg de productes de col·laboradors (model `CollaboratorProduct` + migració Railway aplicada + UI/API/seed). Incorporats productes Masquerade Events a `/admin/collaborators` (cost/PVP/marge, imatges anti-reverse-search). Abast: només admin (no catàleg públic ni dossier).
Proper pas previst: propietari ha d'executar `node scripts/seed-masquerade-products.mjs` (escriu a Railway, bloquejat pel classificador) + `pnpm build` net.
Avís per codex: schema.prisma té model nou `CollaboratorProduct` + migració `20260605101200_add_collaborator_products` JA aplicada a Railway. No reapliquis. Nous fitxers: `lib/services/collaboratorProductService.ts`, `app/admin/collaborators/CollaboratorProductsPanel.tsx`, rutes `[id]/products`. `validate:core` verd, 11 tests OK.

[claude] 2026-06-05 [ESTAT: tancat]
Últim canvi: #889 — Fix i18n: features packs Discomòbil/Festes/Animació resoltes automàticament. `normalizeCandidateKeys` combina `services↔pages` + `fN→N-1`. Qualsevol pack nou a `pages.mobile.discoPacks.*` mostra features al PDF sense configuració extra.
Proper pas previst: pendent demanda propietari.
Avís per codex: `lib/pack-i18n.ts` modificat (#889). Tots els serveis ara mostren features al catàleg PDF.

[claude] 2026-06-05 [ESTAT: tancat]
Últim canvi: #887 — Catàleg PDF complet al visor Studio: `generateFullCatalogPDF` (tots els serveis, multi-pàgina). Preview sense `?service=` → tots els serveis; amb `?service=X` → servei individual per ús real.
Proper pas previst: pendent demanda propietari.
Avís per codex: `lib/services/catalogPdfService.ts` refactoritzat (nova funció `generateFullCatalogPDF`, lògica extreta a `drawServiceBrochureContent`). `app/api/admin/studio/preview/cataleg/route.ts` actualitzat. 6 tests verds. `validate:core` verd.

[claude] 2026-06-05 [ESTAT: tancat]
Últim canvi: #885–#886 — Separació de signatures en servei canonical + consolidació contactes.
- #885: Crear `lib/services/signatureService.ts` + `lib/constants/email.ts` (EMAIL_CONTACT); moure getEmailSignatureHtml/Text de lib/email.ts.
- #886: Consolidar contactes a EMAIL_CONTACT canonical; actualitzar lib/email.ts i lib/services/contractService.ts.
Proper pas previst: pendent demanda propietari sobre extres/footer/contenidor o altres fronts.
Avís per codex: Tota la lògica de signatures ara viu a signatureService.ts; constants contacte (phone/email/web) a lib/constants/email.ts. Audit "res hardcoded tot canonical responsive" ja estava 100% complet. `validate:core` verd.

[claude] 2026-06-04 [ESTAT: tancat]
Últim canvi: #869 — fix visual booking-detail: `bd__pnl` border 20%, gradient+4%, títol or.
Proper pas previst: pendent decisió propietari — continuar migració Frankenstein (Fase 2: Pressupostos / Sales Ops / Reactivació clients) o poliment de booking-detail.
Avís per codex: `app/admin/bookings/[id]/booking-detail.css` modificat (#869). Cap conflicte amb #867. `app/admin/tasks/` completament migrat (#868).

[claude] 2026-06-04 [ESTAT: tancat]
Últim canvi: #866 — leads en dies feiners (Dl–Dj) visibles al calendari i a pipeline/llista.
Bug crític: leads amb data feiner eren invisibes a tota la pàgina leads. `seasonCalendarService.weekdays` + `page.tsx` ara els capturen.
Proper pas previst: pendent decisió propietari — tests unitaris del nou camp `weekdays` a `seasonCalendarService`.
Avís per codex: `seasonCalendarService.ts`, `leads/page.tsx`, `LeadsSeasonClient.tsx`, `leads-design.css`, `CalendarWeekClient.tsx`, `CalendarDayClient.tsx` modificats. No reobrir sense coordinar.

[claude] 2026-06-02 [ESTAT: tancat]
Últim canvi: #855 (fitxa lead — cost real col·laborador via CollaboratorBooking + formatCurrency/formatDateFull canònics).
Proper pas previst: el propietari decideix — opció A: validació browser fitxa lead, opció B: migrar `/admin/tasks` a Brass & Obsidian.
Avís per codex: `page.tsx` i `LeadDetailClient.tsx` modificats per #855. No reobrir sense coordinar.

[claude] 2026-06-01 [ESTAT: tancat]
Últim canvi: #850 (`/admin/leads/reengagement` migrada a Brass & Obsidian — `lr__`).
Proper pas previst: el domini Leads ja és completament 🟢 (Leads + fitxa + re-engagement). Segueix Tasques o el que indiqui el propietari.
Avís per codex: reengagement.css + page.tsx + LeadReengagementClient.tsx modificats. Inventari Lead re-engagement 🟢.

[claude] 2026-05-26 [ESTAT: tancat]
Últim canvi: #794 (meteo real per al calendari de leads: `getWeatherForEvent` a `weatherService`, cache 1h, OWM 5-day forecast, graceful fallback).
Proper pas previst: pendent decisió propietari — #5 suggeriments (`PipelineSuggestionsPanel`), #6 prioritat inline (`LeadQuickPriority`). Migrar la propera pàgina de l'inventari general (`/admin/bookings`?) o seguir polint `/admin/leads`.
Avís per codex: /admin/leads ESSENCIALMENT COMPLET. Cronologia: shell #781 → pàgina #782 → dades reals #783 → canvi estat fitxa #784 → drag pipeline #785 → eliminar #786 → badge LOST #787 → WhatsApp/correu #788 → fix LOST #789 → enriquit servei #790 → arxiu històric #791+#792+#793 → meteo real #794. Inventari /admin/leads: 6 de 8 funcions tancades + 4 millores extra (arxiu, meteo, enriquit, fix). #5 i #6 en pausa.

[claude] 2026-05-26 [ESTAT: tancat]
Últim canvi: #796 (item #6 inventari leads tancat — `seasonCalendarService` exposa `priority`, panell "Prioritat" radiogroup a la fitxa amb PATCH optimista + rollback, estètica Brass & Obsidian; CSS `.lp2__priopick`/`.lp2__priobtn`/`.lp2__priodot` amb 4 tints).
Proper pas previst: pendent decisió propietari — item #5 (Focus zone com a botó/modal amb suggeriments) si val la pena; mostrar prioritat també a targetes calendari/kanban; o migrar la propera pàgina de l'inventari general (`/admin/bookings`?).
Avís per codex: `validate:core` verd amb el teu #795 + el meu #796 conviuent al worktree. He reaprofitat la teva consolidació de `PRIORITY_VALUES`/`LEAD_STATUS_VALUES` canònics a `page.tsx` (eliminat catàleg local). Inventari `/admin/leads`: 7 de 8 funcions tancades (només #5 pendent).

[claude] 2026-05-26 [ESTAT: tancat]
Últim canvi: #798 (promoció de la norma visual canònica a secció §2.5 del protocol + nova secció a CLAUDE.md + header millorat a inventari general; counter 797→798).
Proper pas previst: esperant ordre del propietari sobre el següent front. Leads = territori codex (acabarà ell). Possibles: (a) #799 amb guard automàtic `qa:admin-frankenstein-migration` (draft funcional fet, 5 tests verds, retirat fins ordre), (b) migrar següent pàgina de Fase 1 de l'inventari (Clients fitxa 360 / Reserves cabina / Tasques / Inbox) un cop codex tingui leads totalment 🟢.
Avís per codex: la teva norma escrita al cos del #797 ha quedat promoguda a §2.5 del protocol (visibilitat permanent) + secció a CLAUDE.md (carrega d'arrencada) + header inventari. La regla "admin no inventa paleta" ara és impossible d'enterrar. Si vols que afegeixi un guard automàtic, marca-ho al teu bloc i obro #799.

[claude] 2026-05-27 [ESTAT: tancat]
Últim canvi: #820 (Dossiers paperera soft-delete 30 dies + cron purga + #819 Safata IMAP Sent).
Proper pas previst: aplicar migració a Railway (`npx prisma migrate deploy`); verificar browser dossiers + safata. Següent front: Reserves (`/admin/bookings`) o continuació de millores de dossiers (cercador client BD, tots els packs animació).
Avís per codex: #819+#820 commitats junts. Safata Enviats ara carrega de IMAP real. Dossiers amb paperera de 30 dies i cron registrat al monitor. Migració SQL inclosa però cal `migrate deploy` a Railway.

[claude:opus] 2026-05-27 [ESTAT: tancat]
Últim canvi: #821 (Safata Outlook — mirall IMAP/SMTP + X-Orbita + observabilitat).
Proper pas previst: aplicar migració a Railway (`npx prisma migrate deploy`)
i executar `scripts/backfill-append-imap.ts` per recuperar el rastre dels
emails antics (cas Eric). Després verificació al browser.
Avís per codex: TOT al working tree, sense commit. `npx tsc --noEmit` verd.
- Backend complet (lib/imap.ts, lib/email.ts amb SendEmailResult,
  EmailSend schema ampliat + migració, helpers X-Orbita, 5 nous endpoints).
- UI complet (SafataClient refactor, sidebar carpetes IMAP dinàmiques,
  selecció múltiple, accions en lot, pill X-Orbita, Composer 2.0 amb
  Cc/Bcc/Reply/Reply-all/Forward/Drafts).
- CSS noves classes amb tokens var(--ax-*).
- Script backfill + .env.example + counter 821 + diari.
LLEGIR `docs/safata-821-checklist.md` per a la secció B (operacional Codex):
migració Railway + regenerar Prisma local + backfill cas Eric.
Estratègia clau: el servidor IMAP és la font de veritat. Vinculació
conversa ↔ entitat via headers MIME `X-Orbita-Kind/Id/Origin` + Message-ID
estable `<orbita.{kind}.{id}.{ts}.{rand}@orbitaevents.com>`. La BD no entra
al canal — només recull traça observable de tornada.

[claude] 2026-05-28 [ESTAT: tancat]
Últim canvi: #828 (animació — preus DJ 100/200€ + packPrice 80/160€ + badge ✨NOU + badge hero inclou Animació).
Proper pas previst: commit #826+#827+#828 + verificació browser. Següent: Reserves (`/admin/bookings`) o millores dossiers.
Avís per codex: #826 (ingesta 🤝 + hora fi). #827 (animació: nova categoria web). #828 (animació: preus DJ revisats + badge NOU a serveis + hero badge/subtitle actualitzats). `ServiceSlug` inclou 'animacion'. No tocar ServiceSlug sense coordinar.

---

## Bloc CODEX (Codex CLI)

<!-- codex: actualitza aquest bloc quan comencis/acabis una sessió -->
[codex] 2026-06-08 [ESTAT: treballant]
Últim canvi: #898 base de Partners; obro continuació coordinada per Fase 3 segons decisió Opus locked.
Proper pas previst: implementar localment `Booking.billedCollaboratorId` + `BookingServiceLine`, reconnectar `bookingCreationService`/`bookingRouteService` i `computeBookingFinancialSummary()` sense doble comptar `CollaboratorBooking`.
Avís per l'altre agent: NO tocaré `app/admin/collaborators/[id]/**`, `lib/services/partnerHubService.ts` ni `scripts/seed-partners.mjs`; això queda per Claude. Migració Railway i seed els executa el propietari. Risc principal: `BookingServiceLine.costAmount` i `CollaboratorBooking.commissionAmount` no poden representar el mateix cost alhora.

[codex] 2026-06-07 [ESTAT: tancat]
Últim canvi: #898 — agenda multi-bolo, total manual exacte, relació comercial DJ/tècnic i base escalable de Partners amb rols i `sourceCollaboratorId`.
Proper pas previst: Claude ha de llegir `docs/partners-platform-handoff.md`; després aplicar migració pendent i construir el Partner Hub operatiu a `/admin/collaborators/[id]`.
Avís per l'altre agent: no personalitzar Rufo/Tino/Carlos/Tronios/DJ Mania al codi. Són dades. `sourceCollaboratorId` és qui passa el bolo; `CollaboratorBooking` és qui es contracta dins la reserva. Migració `20260607193000_partner_roles_and_sources` creada localment, no desplegada. Abans de continuar, llegir l'apartat "Estat final abans de pausa" de `docs/partners-platform-handoff.md`.

[codex] 2026-06-05 [ESTAT: tancat]
Últim canvi: #895 — seed Masquerade refet des del Word complet de Downloads: només productes infantils del document, extres amb preu, pirates amb imatge sencera i dossier més personal/proper.
Proper pas previst: propietari pot executar `node scripts\seed-masquerade-products.mjs` si vol sincronitzar BD; el script desactiva productes Masquerade antics que no surten al Word.
Avís per l'altre agent: no he executat el seed contra BD. Bingo/Batalla queden com `Animació adulta` del catàleg propi, no com a productes Masquerade.

[codex] 2026-06-05 [ESTAT: tancat]
Últim canvi: #893 — packs Masquerade entren al dossier amb IDs `collab:<id>` i annex comercial propi al PDF complet; PVP corregit a cost×1,20.
Proper pas previst: si es vol més refinament, revisar visualment `/admin/dossiers` i un PDF complet real amb productes Masquerade seleccionats.
Avís per l'altre agent: BD sincronitzada amb `node scripts\seed-masquerade-products.mjs`: bingo musical 192 + tècnic so 48 = 240 total. No reaplicar migració #891.

[codex] 2026-06-05 [ESTAT: tancat]
Últim canvi: #888 — dossier comercial convertit en peça editorial: portada carbon obligatòria amb logo/wordmark i nom del client, introducció narrativa, capítols de proposta i preus separats cap al catàleg comercial adjunt.
Proper pas previst: si el propietari vol el flux complet final, connectar la selecció del dossier amb el catàleg PDF filtrat perquè l'enviament generi un sol document compost dossier + fitxes dels serveis seleccionats.
Avís per l'altre agent: perímetre tocat `lib/utils/dossier-html-builder.ts`, `__tests__/lib/utils/dossier-html-builder.test.ts`, `lib/constants/pdfDocuments.ts`, docs/counter/sync. No he tocat `catalogPdfService.ts`.

[codex] 2026-06-05 [ESTAT: tancat]
Últim canvi: #890 — PDF complet de dossier: portada/editorial + capítols sense preus + catàleg comercial filtrat al mateix `jsPDF`, amb ruta `/api/admin/dossiers/[id]/composite` i botó `PDF complet`.
Proper pas previst: si el propietari vol el següent salt, ampliar la selecció del generador perquè també pugui triar serveis generals (`bodas`, `discomovil`, `fiestas`, `empresas`) a més dels productes d'animació.
Avís per l'altre agent: perímetre tocat `catalogPdfService.ts` només per exportar append, nous serveis `dossierCatalogSelectionService`/`dossierCompositePdfService`, ruta composite, botons dossier/lead, Studio preview, docs/counter. No s'ha canviat el disseny intern del catàleg.

[codex] 2026-06-04 [ESTAT: tancat]
Últim canvi: #867 — Google Calendar passa a mirall complet cada 15 min amb reconciliació inicial OAuth.
Proper pas previst: activació operativa pendent que el propietari autoritzi Google Calendar una vegada; després verificar mappings reals a Railway.
Avís per l'altre agent: perímetre #867 tancat i `validate:core` verd. No he tocat els canvis concurrents de `app/admin/tasks/**`. Suite global/build tenen errors aliens documentats al diari i protocol.
[codex] 2026-06-02 [ESTAT: tancat]
Últim canvi: #860 (handoff bug Kimera: total 300 sense IVA/sense factura torna a 350,90 per recàlcul amb `vatRate=21`).
Proper pas previst: Claude pot aplicar fix a `bookingRouteService` i reparar dades de Kimera segons document `docs/booking-kimera-vat-total-bug-handoff.md`.
Avís per l'altre agent: no he aplicat el fix funcional per no trepitjar Claude. Evidència: `invoiceRequired=false`, `cashAmount=300`, però `vatRate=21`, `vatAmount=60.90`, `total=350.90`; adminLog mostra updates de total ahir i recàlculs de transport avui que han reescrit total/IVA.
[codex] 2026-06-02 [ESTAT: tancat]
Últim canvi: #859 (inventari refeta fitxa reserva: Kimera / OE-2026-003 abans de pantalla negra).
Proper pas previst: si el propietari valida l'inventari, començar la pantalla negra de `/admin/bookings/[id]` per primer viewport crític.
Avís per l'altre agent: no he tocat `app/admin/tasks/`. Perímetre #859: document d'inventari `docs/admin-booking-detail-rebuild-inventari.md`, protocol/diari/counter/xip.
[codex] 2026-06-02 [ESTAT: tancat]
Últim canvi: #858 (flux Lead → Reserva: nova reserva creada amb `leadId` torna a la fitxa del lead/Agenda).
Proper pas previst: validació browser del flux complet des de `/admin/leads`; després continuar auditoria de Reserves només si apareix fricció real.
Avís per l'altre agent: no he tocat `app/admin/tasks/`. Perímetre #858: `app/admin/bookings/useNewBookingSubmit.ts`, test de regressió, protocol/diari/counter/xip.
[codex] 2026-06-02 [ESTAT: tancat]
Últim canvi: #857 (constants canòniques sanejades: separadors i icones sense controls C1 amagats).
Proper pas previst: continuar auditoria de residus canònics fora de `app/admin/tasks/`; candidates següents: moneda/preus en pàgines admin 🔴 o inventari de fonts duplicades.
Avís per l'altre agent: no he tocat `app/admin/tasks/`. Perímetre #857: `lib/constants/index.ts`, protocol/diari/counter/xip.
[codex] 2026-06-02 [ESTAT: tancat]
Últim canvi: #856 (auditoria mojibake admin: Canvas, Pressupostos Studio i Ressenyes sanejats).
Proper pas previst: continuar auditoria de residus canònics fora de `app/admin/tasks/`; candidates següents: preus/moneda en pàgines 🔴 o inventari de fonts duplicades.
Avís per l'altre agent: no he tocat `app/admin/tasks/`. Perímetre #856: `app/admin/canvas/CanvasEditorClient.tsx`, `app/admin/presupuestos/PresupuestoPdfStudio.tsx`, `app/admin/presupuestos/studio-utils.ts`, `app/admin/ressenyes/page.tsx`, protocol/diari/counter/xip.
[codex] 2026-06-02 [ESTAT: tancat]
Últim canvi: #855 (fitxa lead sanejada: data via `formatDateFull` i cost real de col·laborador al panell econòmic).
Proper pas previst: continuar auditoria global de residus canònics sense tocar `app/admin/tasks/`; primer front segur: pàgines admin 🔴 fora de tasks o serveis/capes fora d'admin.
Avís per l'altre agent: no he tocat `app/admin/tasks/`. Perímetre #855: `app/admin/leads/[id]/LeadDetailClient.tsx`, `app/admin/leads/[id]/page.tsx`, protocol/diari/counter/xip.
[codex] 2026-06-01 [ESTAT: tancat]
Últim canvi: #848 tancat: fitxa interna de `/admin/leads` recuperada dins el canvas nou, `qa:protocol` net i captura Playwright generada.
Proper pas previst: si el propietari continua amb `seguim`, revisar el següent front accionable del protocol després de `validate:core`.
Avís per l'altre agent: perímetre tocat: `app/admin/leads/LeadsSeasonClient.tsx`, `app/admin/leads/leads-design.css`, `app/studio-lab/leads/page.tsx`, protocol/diari/inventari. No he tocat schema ni serveis.
[codex] 2026-05-25 [ESTAT: tancat]
Últim canvi: #779 (`/studio` v0.6 amb catàleg comercial real i actius públics complets)
Proper pas previst: començar la incorporació del sistema visual i del catàleg a `/admin` pas a pas, sense reescriptura massiva.
Avís per l'altre agent: #779 deixa `/studio` com a referència completa abans d'entrar a l'admin: 20 seccions, §19 Catàleg comercial, §05 Actius ampliat amb portfolio/logos, counter/xip/protocol/diari alineats a 779. `validate:core` verd.
[codex] 2026-05-26 [ESTAT: treballant]
Últim canvi: #794 tancat per Claude; obro #795 per unificar el sistema visual admin amb `/studio`.
Proper pas previst: crear el pont conservador de tokens `--o-*` → `--ax-*`/`--canvas` sense reescriure JSX ni buidar `/studio`.
Avís per l'altre agent: no tocaré els canvis pendents de #791-#794. L'objectiu és que `/admin/leads` mantingui aspecte però deixi de duplicar decisions de paleta fora de la font `/studio`.
[codex] 2026-05-26 [ESTAT: tancat]
Últim canvi: #795 (`/studio` font de veritat visual: `app/studio/orbita-tokens.css`, aliases admin `--ax-*`/`--canvas`, guard `qa:studio-integrity` ampliat).
Proper pas previst: #5 suggeriments només com a botó/modal d'ajuda si el propietari ho vol; #6 prioritat queda en pausa perquè pot ser soroll.
Avís per l'altre agent: `pnpm run validate:core` verd. Els canvis #791-#794 de Claude continuen al working tree; #795 només hi afegeix la capa de tokens compartits i arregla el catàleg local de prioritat a `app/admin/leads/page.tsx`.
[codex] 2026-05-26 [ESTAT: treballant]
Últim canvi: obro #797 per tancar el criteri CSS i la ubicació de Studio sota admin.
Proper pas previst: `/admin/studio` sota auth, `/studio` redirect, error boundary admin amb tokens `.ax-*`, i norma escrita perquè cap pàgina admin inventi paleta/hex/gradients locals.
Avís per l'altre agent: resum per Claude — Studio és el manual i font de veritat visual; admin només consumeix `app/studio/orbita-tokens.css`. Si falta un color, estat o component, primer s'amplia Studio i després s'usa a admin. També he aplicat `npx prisma migrate deploy` i `lead_archive` ja existeix a Railway.
[codex] 2026-05-26 [ESTAT: tancat]
Últim canvi: #797 (`/admin/studio` sota auth, `/studio` redirect, error boundary `.ax__error*`, norma CSS canònica escrita, `lead_archive` aplicada a Railway).
Proper pas previst: #5 suggeriments continua pendent només si el propietari vol botó/modal d'ajuda; evitar panells sempre visibles.
Avís per l'altre agent: `pnpm run validate:core` verd. Norma per Claude: no afegir paletes/hex/gradients/estats locals a `app/admin/**`; ampliar `app/studio/orbita-tokens.css` o la fitxa `/admin/studio` i consumir-ho des de l'admin.

---

## Norma de no-col·lisió

- Si el teu bloc diu `treballant`, l'altre agent ha d'esperar o triar un canvi que no toqui els mateixos fitxers.
- El counter `ADMIN_CHANGE_COUNTER` sempre l'actualitza l'agent que tanca el canvi. Si veus que el counter és N+1 però no hi ha entrada #(N+1) al protocol, és un conflicte de timing — posa el counter de tornada a N i afegeix l'entrada que falta.
- En cas de dubte, consultar `docs/admin-diary.md` i `docs/admin-protocol.md` per veure qui ha fet l'últim canvi.
