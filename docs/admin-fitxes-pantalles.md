# Fitxes de pantalles admin

> Document de treball compartit Claude/Codex/propietari.
> Cap pantalla admin es toca visualment o funcionalment sense fitxa prèvia.

## Objectiu

Convertir l'admin d'arxipèlag a organisme:

- una ruta viva;
- un component viu;
- un CSS viu;
- uns serveis/APIs vius;
- cap còpia morta comptant com a funcional;
- cap pantalla `TANCAT CHARLIE` reoberta sense ordre explícita.

La fitxa no és burocràcia. És el resultat d'una auditoria forense de la pantalla. Quan acaba, el component no ha de tenir cap peça sobrera: ni ruta òrfena, ni import sense ús real, ni CSS que no coincideix amb el DOM, ni servei duplicat, ni acció que no arribi a dades, ni coma documental que prometi una cosa falsa.

## Responsabilitat

- El propietari valida visual, criteri humà i `TANCAT CHARLIE`.
- Claude/Codex assumeixen codi, cablejat, poda i cohesió. Si hi ha dues implementacions o un component mort, no és feina del propietari trobar-ho.
- La fitxa ha de portar al propietari una pantalla entenedora i una decisió clara, no un laberint tècnic.

## Estat de fitxa

- `PENDENT`: encara no s'ha fet reachability.
- `INICIAL`: fitxa arrencada amb mapa de superfície conegut, però encara no auditada línia per línia.
- `FETA`: auditoria línia per línia completada i documentada: història, ruta, components, imports/exports, JSX real, CSS/DOM, serveis, APIs, dades, accions, enllaços, estats, duplicacions, codi mort i residu hardcoded revisats.
- `BLOCADA`: cal decisió del propietari o informació externa.
- `TANCAT CHARLIE`: revisada pel propietari; zona protegida.

## Protocol d'auditoria forense abans de qualsevol canvi

Abans de començar qualsevol millora visual, funcional o de cablejat sobre una pantalla admin, Claude i Codex han de portar la seva fitxa com a mínim fins a `FETA`, tret que el primer tall sigui precisament crear aquesta fitxa. L'auditoria és exhaustiva i analítica:

1. **Història del component**: revisar `git log --follow`, canvis recents, diari/protocol i motiu original de la pantalla. Cal saber si la pantalla és viva, heretada, substituïda, parcial o prototip.
2. **Reachability real**: seguir la ruta des de `app/admin/**/page.tsx` fins als components renderitzats. Un component exportat, importat per un altre component mort o accessible només per una branca no usada no compta com a viu.
3. **Cable punta a punta**: seguir acció i dada de la UI fins a servei/API/Prisma i de tornada. La fitxa ha d'explicar què entra, què surt, quin estat canvia i quin òrgan veí queda alimentat.
4. **Lectura línia per línia del perímetre**: ruta, components directes, components fills propis, CSS local, helpers locals, constants locals, APIs i serveis específics. No es valida per intuïció ni per grep ràpid.
5. **CSS contra DOM**: cada classe local s'ha de poder justificar contra JSX viu. Selectors que no coincideixen, overrides impossibles, estils duplicats o tokens reinventats són residu.
6. **Monocapa i duplicació**: comparar la capacitat amb altres pantalles/serveis. Si hi ha dues maneres de fer el mateix, la fitxa ha de dir quina és la font única i què sobra.
7. **Codi mort i codi latent**: distingir entre API canònica no usada avui, peça preparada però no connectada, prototip i codi mort eliminable. El guard `qa:no-dead-admin-views` detecta arrels admin òrfenes i ha d'estar verd, però és conservador: no substitueix la reachability manual ni prova tot el graf. No es borra res només perquè `grep` dona poc ús; es documenta el judici.
8. **Hardcoded i residu visual**: colors, textos, labels, mides, dates, moneda, estats i mappings locals. Cal indicar si són legítims, si han d'anar a constants/tokens o si són deute.
9. **Connexions interrompudes**: si la pantalla viu com 2, 3 o 4 éssers separats en lloc d'un sol organisme, la fitxa ho ha de dir explícitament: quines illes hi ha, quin cable falta i quin és el risc.
10. **Decisió abans d'implementar**: la fitxa acaba amb una proposta de treball: conservar, fusionar, podar, reconnectar o deixar protegit. Sense aquesta decisió no es toca codi funcional.

## Òrgans principals

Les rutes admin no es tracten com 90 pantalles independents. Primer s'agrupen per òrgan; després es decideix si cal subfitxa.

| Òrgan | Rutes principals | Fitxa mare |
|---|---|---|
| Comandament | `/admin`, `/admin/salut`, `/admin/reporting`, `/admin/analytics` | FETA (#1156) |
| Comercial | `/admin/leads`, `/admin/leads/[id]`, `/admin/sales-ops`, `/admin/leads/arxiu`, `/admin/leads/reengagement` | INICIAL parcial |
| Documents | `/admin/presupuestos`, `/admin/presupuestos/[id]`, `/admin/dossiers`, `/admin/studio` | FETA (#1155) · studio=zona protegida |
| Comunicacions | `/admin/inbox`, `/admin/inbox/compose`, `/admin/inbox/settings`, `/admin/emails`, `/admin/email-templates` | FETA (#1133) |
| Reserves | `/admin/bookings`, `/admin/bookings/[id]`, `/admin/bookings/new`, `/admin/calendario`, `/admin/calendario/capacity` | INICIAL parcial |
| Clients | `/admin/clientes`, `/admin/clientes/[id]`, `/admin/clientes/reactivation`, `/admin/clientes/referrals` | FETA (#1761; satèl·lits #1114/#1210/#1760) |
| Catàleg | `/admin/packs`, `/admin/packs/[id]`, `/admin/packs/extras`, `/admin/inventory`, `/admin/pricing`, `/admin/catalog` | FETA (#1132) |
| Partners | `/admin/collaborators`, `/admin/collaborators/[id]` | FETA (#1145) |
| Post-event | `/admin/post-event`, reports, surveys, seguiment, playbook | FETA (#1162) |
| Sistema | settings, crons, scripts, features, coverage, docs, canvas, text/css/image managers | FETA (#1162) |

Una ruta detall (`[id]`), editor o modal gran només rep fitxa pròpia si governa dades/accions diferents de la fitxa mare.

### Proves mínimes d'una fitxa `FETA`

Una fitxa només pot ser `FETA` si conté evidència concreta:

- fitxers llegits i rol de cadascun;
- components vius i components descartats;
- APIs/serveis que realment s'executen;
- CSS viu i CSS sospitós/mort;
- entrades i sortides cap a altres òrgans;
- duplicacions trobades o descartades;
- hardcoded/residus trobats o descartats;
- `qa:no-dead-admin-views` verd o excepció justificada a l'allowlist;
- decisió final i validació pendent del propietari si és visual.

## Plantilla obligatòria

```txt
Pantalla:
Ruta:
Estat inventari:
TANCAT CHARLIE:
Estat fitxa:

Història:
- commits/canvis rellevants:
- motiu original:
- incidències o rectificacions:

Component viu:
CSS viu:
APIs/serveis vius:
Dades que governa:
Accions que governa:
Òrgans veïns:
- upstream:
- downstream:

Codi mort relacionat:
Duplicacions:
Hardcoded/residu visual:
Connexions interrompudes:
Riscos:

Evidència d'auditoria:
- fitxers llegits línia per línia:
- imports/exports verificats:
- selectors CSS verificats contra DOM:
- serveis/APIs seguits:
- proves/guards executats:

Decisió de treball:
- què es tocarà
- què no es tocarà
- què necessita validació del propietari
```

Una fitxa no pot passar a `FETA` només per intuïció, grep ràpid o coneixement previ. Ha d'haver-se llegit la pantalla i els seus components, seguit el cablejat fins a serveis/APIs i documentat les connexions interrompudes o duplicades. Una fitxa `INICIAL` pot orientar, però no autoritza implementació de millores.

## Fitxes inicials

### `/admin/leads`

Pantalla: Leads / Agenda  
Ruta: `/admin/leads`  
Estat inventari: 🟢  
TANCAT CHARLIE: sí — revisada pel propietari.

Component viu:
- `app/admin/leads/page.tsx`
- `app/admin/leads/LeadsSeasonClient.tsx`

CSS viu:
- `app/admin/leads/leads-design.css`

APIs/serveis vius:
- `loadSeasonCalendar`
- `patchLeadStatus`
- serveis de scoring/forecast consumits pel dashboard/economia i per la capa viva quan toca

Dades que governa:
- calendari de temporada;
- pipeline viu de 4 etapes visuals;
- llista;
- focus zone;
- leads + reserves fusionades dins Agenda.

Codi mort relacionat:
- `LeadPipelineView.tsx`, `LeadViewToggle.tsx` i `lib/services/leads/pipeline.ts` eren illa morta detectada per la incidència #1020 i eradicada amb la passada #1026. No recrear.

Duplicacions:
- duplicació pipeline viva/morta resolta: la font viva és `LeadsSeasonClient`.

Hardcoded/residu visual:
- no reobrir visual sense ordre explícita; és zona protegida.
- Canvi #1161: `LeadLostStatusPrompt` deixa `text-white`/`text-white/75`; passa a `fx__lostprompt-title` i `fx__lostprompt-label` dins `leads-design.css`.

Riscos:
- qualsevol canvi sobre leads ha de provar que toca la superfície viva i no una illa.
- el guard bloqueja arrels òrfenes, però la fitxa segueix sent obligatòria per detectar duplicacions importades o cables interromputs.

Decisió de treball:
- no tocar visual de `/admin/leads` dins passades genèriques;
- si cal forecast o cablejat, aplicar-lo només a `LeadsSeasonClient`;
- si queda feina en subzona, documentar-la com a subpantalla separada.

### `/admin/leads/[id]`

Pantalla: Fitxa de lead (cabina comercial)
Ruta: `/admin/leads/[id]`
Estat inventari: 🟢
TANCAT CHARLIE: sí — revisada pel propietari sobre el lead Alba i protegida al Canvi #1759; excepció #1833 només pel cable Dossiers, ordenada pel propietari.
Estat fitxa: FETA (auditoria forense #1032, claude, 2026-06-22)

Història:
- redisseny "fitxa en una pantalla" #920-#939 (b22f3434): va consolidar tota la fitxa al cockpit `LeadDetailClient` (edició inline, dossiers, vincle client, economia del bolo).
- #1032: eradicades ~2.500 línies de codi mort que el redisseny havia deixat penjades.
- #1833: `Crear dossier` i `Previsualitzar dossier` deixen de fer via pròpia des del lead i passen pel generador canònic `/admin/dossiers` amb `leadId`; la preview obre same-tab i enrere torna a Dossiers.

Component viu:
- `page.tsx` (server: query + càlcul economia/meteo/cost-km) → `LeadDetailClient` → `LeadBoloSection`.
- `error.tsx`, `loading.tsx`.

CSS viu: `app/admin/leads/leads-design.css` (compartit amb /admin/leads).

APIs/serveis vius:
- `computeBookingFinancialSummary` + `getProfitabilityConfig` (economia real quan hi ha reserva).
- `getEffectiveVehicleCostPerKm` (km assumibles), `getWeatherForEvent` (meteo si event < 5 dies).
- mutacions via `patchLeadStatus` i endpoints d'edició inline del cockpit.

Dades que governa: estat del lead, edició de contacte/valor, economia del bolo, dossiers/proposals, vincle amb client.

Òrgans veïns:
- upstream: /admin/leads (llista/calendari) obre la fitxa.
- downstream: reserva (`/admin/bookings/[id]`), dossiers, client.

Codi mort relacionat: ERADICAT (#1032) — 12 components + 2 tests orfes.

Duplicacions: cap restant. El cockpit és font única.

Hardcoded/residu visual: drenat en la passada Manolo #1755-#1758; el propietari valida visual final al #1759. Qualsevol regressió es tracta com a bug, no com a reauditoria genèrica.

Connexions interrompudes: cap. Arbre viu net page → LeadDetailClient → LeadBoloSection.

Decisió de treball:
- FET: eradicat el codi mort, podada la query, millorat el guard.
- FET: visual Manolo validada pel propietari i marcada `TANCAT CHARLIE` (#1759).
- FET: accions Dossiers solidàries amb `/admin/dossiers` per ordre del propietari (#1833), sense reobrir visual ni pacte partner.
- Protecció: no reobrir `/admin/leads/[id]` per auditories genèriques; només ordre explícita del propietari o regressió demostrable.

### `/admin/presupuestos`

Pantalla: Pressupostos  
Ruta: `/admin/presupuestos`  
Estat inventari: 🟡  
TANCAT CHARLIE: no.

Component viu:
- `app/admin/presupuestos/page.tsx`
- `app/admin/presupuestos/ProposalsList.tsx`
- `app/admin/presupuestos/ProposalOwnerPanel.tsx`

CSS viu:
- `app/admin/presupuestos/presupuestos.css`

APIs/serveis vius:
- `/api/admin/proposals`
- `/api/admin/proposals/[id]`
- `/api/admin/proposals/[id]/owner`

Dades que governa:
- proposals;
- estat comercial;
- propietari/responsable;
- filtres per estat;
- accions de proposta.

Codi mort relacionat:
- pendent de revisar en detall l'editor intern de PDF.

Duplicacions:
- possible deute a `PresupuestoPdfStudio.tsx` / `StudioPreview.tsx`; tractar com a subpantalla.

Hardcoded/residu visual:
- shell i llista ja passen per `pr__*`; editor PDF intern pendent.

Riscos:
- no marcar `TANCAT CHARLIE` fins a validació visual del propietari.

Decisió de treball:
- següent tall natural: fitxa pròpia de `/admin/presupuestos/[id]` i editor PDF intern;
- no barrejar la llista amb el PDF Studio.

### `/admin/presupuestos/[id]` + editor PDF intern

Pantalla: Pressupost detall / PDF Studio intern  
Ruta: `/admin/presupuestos/[id]`  
Estat inventari: 🟡  
TANCAT CHARLIE: no.  
Estat fitxa: FETA — auditoria forense inicial completada el 2026-06-22 (Canvi #1029).

Història:
- La llista i el shell de detall van passar a pantalla negra amb `pr__*` al Canvi #1021.
- La mateixa fitxa inicial de `/admin/presupuestos` deixava l'editor PDF intern com a subpantalla pendent.
- Aquest tall separa el detall viu del deute real de l'editor: no es toca visual de llista.

Component viu:
- `app/admin/presupuestos/[id]/page.tsx`: server component de detall. Carrega `Proposal` amb `customer`, `lead` i `booking`, pinta capçalera `pr__*` i renderitza `ProposalOwnerPanel`.
- `app/admin/presupuestos/PresupuestoPdfStudio.tsx`: editor client real compartit quan s'obre el flux d'edició amb `customerId/proposalId` via `buildCustomerProposalHref`.
- `app/admin/presupuestos/StudioPreview.tsx`: resum lateral de marca, client, esdeveniment, pack, costos i marge.
- `app/admin/presupuestos/studio-utils.ts`: tipus, constants centralitzades i helpers purs de l'editor.

CSS viu:
- `app/admin/presupuestos/presupuestos.css`: només cobreix shell `pr__*`, llista, taula/cards i detall base.
- L'editor intern encara no té capa `pr__*` pròpia: consumeix `admin-quote-studio*` sense regles locals al CSS i conserva molts utilitaris Tailwind/Tokens inline al JSX.

APIs/serveis vius:
- Detall: Prisma directe al `page.tsx` per llegir `proposal`.
- Propietari: `/api/admin/proposals/[id]/owner` → `reassignProposalOwner()`.
- Draft/save: `/api/admin/proposals` i `/api/admin/proposals/[id]` → `proposalAdminService`.
- Enviament: `/api/admin/emails/quote` → `sendAdminQuoteEmail()` i després `/api/admin/proposals/[id]/send` → `sendAdminProposal()`.
- Catàleg: `/api/admin/pricing?locale=...`.
- Rendibilitat: `/api/admin/reports/profitability/config` + `computeBookingFinancialSummary()`.
- Desplaçament: `/api/admin/maps/distance`.
- Traducció PDF: `/api/admin/translate` via `translateBatchForPdf()`.

Dades que governa:
- `Proposal` (`status`, `locale`, `subtotal`, `discount`, `vatRate`, `vatAmount`, `total`, `snapshot`, `sentAt`).
- Relacions comercials de la proposta: `customerId`, `leadId`, `bookingId`.
- Snapshot editable del PDF: client, event, pack, extres, marca, condicions, descompte, recàrrec de temporada, desplaçament.

Accions que governa:
- Obrir editor només si la proposta té client vinculat.
- Reassignar propietari/lead/reserva des del panell.
- Autosave del draft quan hi ha `customerId`.
- Generar/descarregar/imprimir PDF.
- Enviar pressupost per email, marcar proposta com `SENT`, assegurar lead/tasca de seguiment i registrar activitat.

Òrgans veïns:
- upstream: Clients/Customer Hub (`buildCustomerProposalHref`), Leads, reserves i llista de pressupostos.
- downstream: email/Inbox, Customer activity, Lead activity, tasques de seguiment, contractes i automatismes quan una proposta passa a `ACCEPTED`.

Codi mort relacionat:
- Cap component mort detectat per `qa:no-dead-admin-views`; el guard passa verd.
- No s'ha detectat una segona ruta viva per al PDF Studio, però el component és compartit i s'obre per query des del Customer Hub/pressupostos.

Duplicacions:
- El detall `page.tsx` llegeix Prisma directament en lloc de servei; és lectura simple però trenca la tendència de `qa:prisma-in-routes` en rutes API, no en pages.
- Hi ha dos enviaments encadenats: `emails/quote` envia email HTML de pressupost i `proposals/[id]/send` marca la proposta i crea lead/tasca si cal. És funcional, però la semàntica "enviar pressupost" està partida en dues capes.
- `sendAdminQuoteEmail()` genera un `quoteNumber` propi de document legacy mentre `Proposal` conserva `reference`; cal vigilar que no competeixin com a veritat visible.

Hardcoded/residu visual:
- `PresupuestoPdfStudio.tsx` i `StudioPreview.tsx` mantenen moltes classes visuals ad-hoc (`rounded-xl`, `border-emerald-500/30`, `hover:bg-white/5`, `text-white/20`, `bg-emerald-950/20`, etc.). Això confirma que l'editor intern encara no ha passat al canon `pr__*`/tokens.
- Copy admin local abundant dins l'editor; part ja viu a `ADMIN_PDF_STUDIO_COPY/DEFAULTS`, però labels i missatges únics continuen al component.
- `StudioPreview` usa `toFixed()` per percentatges/km, legítim de nombre no moneda; moneda passa per `formatEUR()`.

Connexions interrompudes:
- El botó "Obrir editor" no apunta a `/admin/presupuestos/[id]`, sinó a l'editor per context de client. Això és intencionat però fa que el detall i l'editor siguin dues illes UX connectades per URL, no una sola superfície.
- Una proposta sense `customerId` no es pot editar des del detall; el panell de propietari resol el prerequisit.
- Abans del Canvi #1029, dos POST d'enviament (`/api/admin/emails/quote` i `/api/admin/proposals/[id]/send`) tenien auth però no validaven CSRF. El client ja usava `fetchWithCsrf`; s'ha corregit el backend.

Riscos:
- Canviar pricing/PDF des d'aquest editor pot divergir de `Booking` si es tracta com a font definitiva post-reserva; cal mantenir `Proposal.snapshot` com a snapshot comercial, no com a veritat operacional.
- El proper tall visual de l'editor ha de ser de carcassa i canon CSS, no de negoci.

Evidència d'auditoria:
- Fitxers llegits línia per línia o per perímetre complet: `app/admin/presupuestos/[id]/page.tsx`, `PresupuestoPdfStudio.tsx`, `StudioPreview.tsx`, `studio-utils.ts`, `presupuestos.css`, `proposalAdminService.ts`, `proposalDispatchService.ts`, rutes `app/api/admin/proposals/**`, `app/api/admin/emails/quote/route.ts`, `adminQuoteEmailService.ts`.
- Imports/exports verificats: `PresupuestoPdfStudio` → `StudioPreview`/`studio-utils`; detall → `ProposalOwnerPanel`; APIs → serveis.
- Selectors CSS verificats contra DOM: `pr__*` cobreix detall; `admin-quote-*` queda sense capa CSS pròpia en `presupuestos.css`.
- Serveis/APIs seguits: proposals CRUD, owner, send, email quote, pricing, maps distance, profitability config, translate.
- Proves/guards executats: `pnpm test:run -- --run __tests__/app/api/admin/emails-quote-route.test.ts __tests__/app/api/admin/proposals-send-route.test.ts` OK (12 tests); `pnpm run qa:no-dead-admin-views` OK; `pnpm run qa:protocol` OK abans de registrar #1029.

Decisió de treball:
- La ruta de detall es conserva: és viva, curta i coherent com a resum + owner.
- El proper tall funcional/visual sobre Documents ha de ser l'editor PDF intern: migrar `PresupuestoPdfStudio`/`StudioPreview` a carcassa canònica `pr__*` o component compartit, reduir utilitaris visuals ad-hoc i decidir si l'acció d'enviament ha de quedar en una sola semàntica visible.
- No tocar pricing, càlcul de transport, IVA ni generació PDF sense una ordre funcional explícita.

### `/admin/bookings`

Pantalla: Reserves / llista i pipeline
Ruta: `/admin/bookings`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual final del propietari.
Estat fitxa: FETA — auditoria forense inicial completada el 2026-07-03 (Canvi #1384).

Història:
- Canvis antics de producte van convertir `/admin/bookings` en el centre de consulta de reserves amb llista, cards mobile, filtres, export i kanban.
- Canvi #1142: drenats contenidors/glass P2 del llistat (`bk-list-shell`, `bk-empty-state`, `bk-mobile-card` en la fase anterior).
- Canvi #1149: drenats dot mòbil i botons de pipeline a classes canòniques.
- Canvi #1154: `BookingFilters` elimina l'amplada inline del camp de cerca i passa a classe governada.
- Canvis #1294/#1316/#1322: consolidacio posterior del detall/lista cap a patrons `ap-*`; avui la llista viu sobre `ap-sticky-header`, `ap-detail-*`, `ap-table`, `ap-card` i `PipelineBoard`.
- Canvis #1379/#1382/#1383: el flux de nova reserva queda fitxat i vinculat des de la llista via `/admin/bookings/new`.

Component viu:
- `app/admin/bookings/page.tsx`: server component viu. Llegeix query params (`page`, `status`, `eventType`, `fromDate`, `toDate`, `search`, `view`, `payment`, `customerId`), fa query Prisma cachejada i renderitza header, KPIs, filtres, llista mobile, taula desktop, paginacio i wrapper kanban.
- `BookingFilters.tsx`: client component viu. Gestiona cerca debounced, filtres d'estat/tipus/cobrament/dates, reset i toggle llista/kanban.
- `BookingActions.tsx`: client component viu a cards/taula. Canvia estat, elimina reserves permeses, enllaça calendari/client/detall i usa `ConfirmDialog`.
- `BookingPipelineView.tsx`: client component viu carregat amb `next/dynamic` quan `view=kanban`. Carrega dades per API, mostra metrics, tauler `PipelineBoard`, drag/touch i botons de moviment.
- `PipelineBoard.tsx`: component compartit viu per kanbans; no és propi de reserves.

CSS viu:
- No hi ha CSS local exclusiu de `/admin/bookings`.
- Carcassa viva: `app/admin/admin-shell.css` (`ap-sticky-header`, `ap-detail-*`, `ap-btn`, `ap-card`) i `app/globals.css` (`ap-table-*`, `ap-empty`).
- Drag/drop viu: `app/admin/admin-theme.css` (`admin-drag-item`) i classes compartides de `PipelineBoard`.
- Residus `bk-*` històrics documentats en fitxes antigues ja no governen la llista principal actual; la pantalla viu sobre `ap-*`.

APIs/serveis vius:
- Llista server: `page.tsx` usa `prisma.booking.findMany`, `groupBy`, `count` i `findMany` d'export dins `cachedQuery(CacheTTL.VERY_SHORT)`.
- Config de marge: `getProfitabilityConfig`.
- Càlculs locals de marge: `aggregateServiceLines` i `computeSimpleMarginPct`.
- Kanban/API: `BookingPipelineView` fa `GET /api/admin/bookings?...&pipeline=true`; la ruta crida `listAdminBookings`.
- Mutacions de fila/card: `PATCH /api/admin/bookings/[id]/status` -> `changeBookingStatus`; `DELETE /api/admin/bookings/[id]` -> `deleteBookingIfAllowed`.
- Navegacio canònica: `buildBookingHref`, `buildCustomerHubHref`, `buildCustomerWorkspaceTabHref`, `buildCustomerBookingListHref`.

Dades que governa:
- Vista agregada de reserves, estats, ingressos per estat, total paginat, export CSV, filtres comercials i focus de cobrament.
- Estat de reserva des del llistat/kanban.
- Eliminacio de reserves només en estats permesos (`DELETABLE_BOOKING_STATUSES`).

Accions que governa:
- Crear nova reserva.
- Filtrar i cercar reserves.
- Canviar vista llista/kanban.
- Exportar CSV de reserves filtrades.
- Obrir detall de reserva i Customer Hub.
- Saltar a calendari pel dia de la reserva.
- Canviar estat i eliminar reserves elegibles.

Òrgans veïns:
- upstream: Dashboard, Salut, Economia, Customer Hub i alertes poden enllaçar cap a `/admin/bookings` amb filtres.
- downstream: nova reserva, reserva detall, Customer Hub, Calendari, API de reserves, servei de status i timeline/admin logs derivats de mutacions.

Codi mort relacionat:
- No s'ha detectat arrel de llista morta: `page.tsx`, `BookingFilters`, `BookingActions` i `BookingPipelineView` estan connectats des de la ruta viva.
- `PipelineBoard` és compartit amb leads i altres pipelines; no podar ni especialitzar des de Reserves sense revisar consumidors.

Duplicacions:
- Duplicacio principal: `page.tsx` construeix `buildBookingsWhere` i llegeix Prisma directament, mentre `/api/admin/bookings` usa `bookingListService`. Els filtres de pagament i cerca estan duplicats en dos llocs.
- L'ordenacio no és idèntica: la llista server ordena `eventDate desc`; `bookingListService` ordena `eventDate asc`.
- El llistat server calcula marge amb `computeSimpleMarginPct`; altres pantalles de detall tenen motors més complets de marge/cost. No canviar criteri en aquesta fitxa.

Hardcoded/residu visual:
- Hi ha emojis/símbols locals visibles (`📅`, `←`, `→`, `✕`, `+ Nova`, `👤`) i un SVG inline de lupa a `BookingFilters`. Són residu visual menor a revisar si es fa una passada UI, no bloqueig funcional.
- Hi ha classes Tailwind arbitràries i utilitats locals dins la llista (`bg-[var(--ax-canvas)]`, `text-[var(--t2)]`, `w-[...]`, `max-w-[...]`, `text-[var(--gold)]`). Els guards actuals ho toleren, pero si es retoca visualment s'ha de migrar a patró `ap-*`/tokens compartits.
- El loading del dynamic import del kanban és un spinner Tailwind local; acceptable com a estat existent, però no és patró de loading admin ric.

Connexions interrompudes:
- Resolt #1385: `customerId` ja passa per `/api/admin/bookings` i `listAdminBookings`, de manera que `view=kanban` dins context client conserva el mateix filtre que la llista server.
- La font de dades de taula/cards i kanban no és única. Això pot produir diferències de count, order, locale/translations i filtres.

Riscos:
- Unificar llista server i API és funcional: afecta cerca, paginacio, export, kanban i Customer Hub; necessita tests de `bookingListService` i verificacio de customer context.
- Canviar `BookingActions` afecta mutacions reals de status i eliminacio; requereix CSRF/status route tests.
- Canviar `PipelineBoard` afecta altres pipelines compartits.

Evidència d'auditoria:
- Fitxers llegits línia per línia: `app/admin/bookings/page.tsx`, `BookingFilters.tsx`, `BookingActions.tsx`, `BookingPipelineView.tsx`, `app/admin/components/PipelineBoard.tsx`, `app/api/admin/bookings/route.ts`, `app/api/admin/bookings/[id]/status/route.ts`, `app/api/admin/bookings/[id]/route.ts`, `lib/services/bookingListService.ts`, tests de `bookingListService` i `BookingPipelineView`.
- Imports/exports verificats: `page.tsx` -> `BookingFilters`/`BookingActions`/dynamic `BookingPipelineView`; `BookingPipelineView` -> `PipelineBoard`; API -> `listAdminBookings`; actions -> status/detail routes.
- Selectors CSS verificats contra DOM: `ap-sticky-header`, `ap-detail-*`, `ap-card`, `ap-table-*`, `ap-empty`, `admin-drag-item` i classes de `PipelineBoard`.
- Serveis/APIs seguits: query Prisma server, `/api/admin/bookings`, `/api/admin/bookings/[id]/status`, `/api/admin/bookings/[id]`, `bookingListService`, `bookingRouteService`.
- Proves/guards executats en aquest tall: `qa:protocol`, `tsc`, `validate:core` i `git diff --check` abans de tancar.

Decisió de treball:
- La ruta es conserva: és viva i operativa com a llista/pipeline de reserves.
- Proper tall funcional recomanat: unificar progressivament la resta de filtres/ordenacio entre `page.tsx` i `bookingListService`, sense barrejar-ho amb visual.
- No tocar en aquesta fitxa: booking detail, nova reserva, transport, marge global, Stripe/Bizum, CSS funcional ni schema.
- Validacio pendent del propietari: visual final de llista/kanban abans de `TANCAT CHARLIE`.

### `/admin/bookings/[id]`

Pantalla: Reserva detall / cabina operativa
Ruta: `/admin/bookings/[id]`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA — auditoria forense integrada el 2026-06-24 (Canvi #1112), sobre inventari previ `docs/admin-booking-detail-rebuild-inventari.md` i lectura del perímetre viu.

Història:
- `docs/admin-booking-detail-rebuild-inventari.md` (2026-06-02) va inventariar la refeta de fitxa reserva amb el cas Kimera/OE-2026-003: cabina molt potent però massa carregada, amb prioritat a semàfor, cobrament, client, bolo i accions crítiques.
- Canvi #849: migració visual de la fitxa a `booking-detail.css`, prefix `bd__`, secció sticky i `BookingSectionNav`.
- Canvis #577-#591: flux Stripe/portal client/post-pagament completat; `StripePaymentPanel` queda muntat dins Finances i connectat a Checkout/webhook.
- Canvis #1099-#1102: logística de camp afegida a reserva/calendari amb Waze/Maps i hora de sortida.

Component viu:
- `app/admin/bookings/[id]/page.tsx`: server component real. Importa `booking-detail.css`, carrega `Booking` amb Prisma i renderitza tota la cabina.
- Components fills vius renderitzats directament: `BookingStatusChanger`, `CommunicationPanel`, `CalendarSyncButton`, `PostEventEmailButton`, `BookingMarginCard`, `BookingServiceLinesEditor`, `BookingChecklist`, `InvoiceSection`, `DocumentFlowSection`, `BookingInventorySection`, `ClientPortalAccessPanel`, `StripePaymentPanel`, `BookingSectionNav`, `BookingGallery`, `BookingFieldNotesComposer`, `BookingCustomerLinkPanel`, `BookingQuestionnaireSection`, `BookingTotalEditor`.
- Estats auxiliars: `loading.tsx`, `error.tsx`.
- `GallerySharePanel.tsx` existeix al directori però no queda muntat directament al `page.tsx`; és peça latent/adjacent del flux galeria-share, no superfície principal de la fitxa.

CSS viu:
- `app/admin/bookings/[id]/booking-detail.css`: cobreix el detall `bd__*` i també algunes classes `bk-*` de la llista perquè `/admin/bookings/page.tsx` l'importa.
- El CSS usa `html.admin-mode` i tokens `--ax-*`/`--o-*`; `qa:admin-mode-prefix` és 0 deute.
- Canvi #1142: la llista `/admin/bookings` deixa d'emetre els contenidors `style={{...}}` P2 i `admin-card-glass` a empty/cards mòbil; passen a `bk-detail-bar-row`, `bk-detail-bar-actions`, `bk-list-shell`, `bk-empty-state` i `bk-mobile-card`.
- Canvi #1160: la taula `/admin/bookings` deixa el color Tailwind arbitrari `text-[var(--gold)]` a la referència; passa a `bk-booking-ref-link`. L'auditoria de fonts `text-[10px]`/`text-[11px]` del listat/pipeline queda obsoleta perquè el codi viu ja no conserva aquests patrons.
- Canvi #1154: `BookingFilters` deixa l'amplada inline `style={{ width: 260 }}` del camp de cerca i passa a `bk-filter-search`.
- Canvi #1157: `BookingTravelDiscountSection` deixa tres `style` estàtics (`gap`, `padding/whiteSpace`, `marginTop`) i passa a `nb__discount-code-row`, `nb__btn--compact` i `nb__field--spaced`.
- Canvi #1158: `BookingClientEventSection` deixa cinc `style` estàtics de marge/display i passa a `nb__event-type-field`, `nb__chips--spaced`, `nb__conflict-title`, `nb__row--spaced` i `nb__hint--spaced`.
- Canvi #1148: `BookingTotalEditor` i la cabina de marge (`BookingMarginCard`) deixen els inline styles i valors tipogràfics P2; passen a `bd-total-editor*` i `admin-booking-margin-*` dins aquest CSS.
- Canvi #1159: `ClientPortalAccessPanel` deixa el literal duplicat `#06b6d4`; default i placeholder de l'accent del portal consumeixen `CLIENT_PORTAL_DEFAULT_ACCENT_COLOR`.
- Canvi #1149: el pipeline de `/admin/bookings` deixa el dot mòbil i els botons ←/→ amb negre/blanc ad hoc; passen a `bk-pipeline-dot--inactive` i `bk-pipeline-shift-btn` dins aquest CSS.
- Canvi #1151: `BookingQuestionnaireSection` deixa `text-white/*` i `admin-tone-text-cyan`; passa a `bd-questionnaire-*` dins aquest CSS.
- Canvi #1152: `BookingGallery` i `GallerySharePanel` deixen `white/*` en skeleton/dropzones/delete/share; passen a `bd-gallery-*` i `bd-gallery-share-*` dins aquest CSS.
- Canvi #1153: `BookingStatusChanger` deixa el fallback `bg-white/30` i l'inline style estàtic de fletxa; passa a `bd__status-dot--fallback` i `bd__status-arrow--open`.
- Residus coneguts: overrides amb `!important` sobre components encaixats (`admin-booking-margin*`, inputs dins `bd__root`). El P1 cromàtic de `StripePaymentPanel.tsx` queda resolt al Canvi #1113.

APIs/serveis vius:
- Lectura inicial: `prisma.booking.findUnique()` al `page.tsx` amb `pack`, `extras`, `serviceLines`, `inventory`, `lead`, `proposals`, `invoices`, post-event, enquesta i seguiment.
- Snapshot operacional: `getBookingOperationalSnapshot()` → checklist, timeline canònica, client, portal actiu, configuració de rendibilitat, cost inventari, comunicacions i post-event.
- Meteo/logística: `getWeatherForEvent()` i `buildEventLogistics()`.
- Customer/lead/proposal links: `buildCustomerHubHref`, `buildCustomerComposeHref`, `buildLeadWorkspaceHref`, `buildLeadComposeHref`, `buildProposalHref`, `buildPackHref`.
- Mutacions principals: `/api/admin/bookings/[id]`, `/status`, `/calendar-sync`, `/checklist`, `/gallery`, `/gallery-share`, `/inventory`, `/portal-access`, `/communications`, `/customer-link`, `/stripe-checkout`, `/confirm-bizum`, `/api/admin/emails/send-post-event`, `/api/admin/maps/distance`.

Dades que governa:
- Identitat i estat de la reserva: `reference`, `status`, client/contacte, lead/customer vinculats.
- Bolo: data, horari, ubicació, venue, convidats, logística de sortida i navegació.
- Servei: pack, extres, hores extra i `BookingServiceLine`.
- Economia: subtotal, descompte, IVA, total editable, paga i senyal, resta, Stripe/Bizum, marge i cost directe.
- Operativa: inventari, checklist, portal client, qüestionari, documents, factura, comunicacions, timeline, galeria, post-event.

Accions que governa:
- Canviar estat de reserva.
- Editar total manual.
- Generar/copiar links Stripe i confirmar Bizum declarat.
- Vincular/crear client si falta `customerId`.
- Sincronitzar calendari, afegir a Google Calendar, enviar post-event, crear informe intern.
- Assignar inventari, editar checklist, gestionar portal/qüestionari/documents/factures/galeria.

Òrgans veïns:
- upstream: Agenda/Leads (`/admin/leads`), llista de reserves, Customer Hub, Economia, Calendari i Dashboard obren aquesta fitxa via `buildBookingHref()`.
- downstream: Customer Hub, Lead workspace, Inbox/Compose, Portal client, Documents/pressupostos/contractes/factures, Inventari, Post-event, Google Calendar i timeline canònica.

Codi mort relacionat:
- `qa:no-dead-admin-views` passa verd; no hi ha arrel admin òrfena.
- `GallerySharePanel` no apareix al render principal del `page.tsx`; cal tractar-lo com a subflux de galeria-share abans de podar o muntar-lo.

Duplicacions:
- La llista `/admin/bookings` i el detall comparteixen `booking-detail.css`; és una convivència històrica acceptable però no ideal per futures passades de llista.
- El detall llegeix Prisma directament i després amplia amb `bookingOperationalService`; no és duplicació funcional, però la font de lectura està partida entre query server i snapshot operacional.
- El marge final passa per `BookingMarginCard`/cost engine; no recalcular marges locals fora d'aquest perímetre.

Hardcoded/residu visual:
- Resolt #1113: `StripePaymentPanel.tsx` ja no conserva `style={{ background/color/border }}`, `color-mix(--at-*)` ni `text-[var(--at-*)]`; els estats de pagament viuen en classes `bd__stripe-*` dins `booking-detail.css`.
- Residus menors al `page.tsx`: `style={{ textDecoration: 'none' }}`, `style={{ opacity: 0.4 }}` i `style={{ marginTop: '10px' }}` són locals; no bloquegen la fitxa però entren al radar si es toca la carcassa.
- Icones/emoji visibles a botons (`Waze`, `Maps`, `Client`, `Lead`) existeixen; si es redissenya, preferir icona canònica o copy curt coherent.

Connexions interrompudes:
- No hi ha cable funcional principal trencat: la reserva connecta amb client, lead, documents, portal, inventari, calendari, timeline i post-event.
- Fricció coneguda del cas Kimera: booking pot tenir `customerId` buit, diferències de pax/contacte/adreça respecte al lead, i tensió entre `invoiceRequired=false`, `vatRate=21`, `paymentMethod=CASH` i `cashAmount`. La UI ho mostra parcialment però no ho resol automàticament.

Riscos:
- Canviar pagaments/Stripe/Bizum afecta diners reals i webhook; qualsevol canvi funcional requereix tests focalitzats de ruta/servei.
- Canviar total/IVA/manual pricing no s'ha de reinterpretar com a canvi de regla de negoci.
- El P1 visual de `StripePaymentPanel` queda resolt al Canvi #1113; el risc restant de pagaments és funcional, no de capa visual.

Evidència d'auditoria:
- Fitxers llegits: `page.tsx`, `StripePaymentPanel.tsx`, `booking-detail.css`, `docs/admin-booking-detail-rebuild-inventari.md`, `docs/audit/admin-fitxes.md`.
- Imports/exports verificats: `page.tsx` → components locals; `StripePaymentPanel` → `fetchWithCsrf` + `/stripe-checkout` i `/confirm-bizum`; enllaços externs via helpers.
- Selectors CSS verificats contra DOM: `bd__root`, `bd__overview`, `bd__pnl`, `bd__secnav`, `bd__stripe`, taules, field notes i overrides de components encaixats.
- Serveis/APIs seguits: `bookingOperationalService`, `bookingStripePaymentService`, rutes booking admin, webhook Stripe, timeline/cost engine per referències.
- Proves/guards executats en aquest tall: `pnpm run qa:api-admin-csrf`, `pnpm run qa:no-dead-admin-views`, `pnpm run qa:admin-mode-prefix`.

Decisió de treball:
- Es conserva la ruta i la cabina: és viva, connectada i operativa.
- Proper tall executable dins Reserva detall: si es continua en aquest òrgan, atacar un P2 acotat de questionnaire/gallery/share o pipeline, sense tocar lògica Stripe/Bizum ni regles de preu.
- No tocar: schema, webhook Stripe, càlculs de total/IVA, cost engine, llista de reserves ni refeta visual global de la fitxa.
- Validació pendent del propietari: visual final de la cabina abans de marcar `TANCAT CHARLIE`.

### `/admin/bookings/new`

Pantalla: Nova reserva / configurador contractual precreacio
Ruta: `/admin/bookings/new`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual final del propietari.
Estat fitxa: FETA — auditoria forense inicial completada el 2026-07-03 (Canvi #1383), despres dels canvis #1379/#1382 sobre herencia de lead i compactacio.

Història:
- Canvis #906-#910: base del formulari de nova reserva amb autosave, carrega de packs/extres/col·laboradors i submit cap a creacio canònica.
- Canvi #1157: `BookingTravelDiscountSection` deixa inline layout P3 i passa a classes `nb__*`.
- Canvi #1158: `BookingClientEventSection` deixa marges/display inline i passa a classes `nb__*`.
- Canvis #1326-#1330: el configurador incorpora proveïdors, tecnic inclos, transport real i evita duplicar vehicle com a linia de cost.
- Canvi #1369: la nova reserva hereta dades i linies visibles d'un lead quan entra amb `leadId`.
- Canvi #1379: `prefill=lead` força herencia neta i ignora autosaves locals vells quan l'accio ve explicitament del lead.
- Canvi #1382: pantalla compactada: catalegs plegats, tipus d'event resumit si ve heretat, extres/transport tancats i flux `Guanyat` -> crear reserva.

Component viu:
- `app/admin/bookings/new/page.tsx`: route server mínima; renderitza directament `NewBookingForm`.
- `app/admin/bookings/NewBookingForm.tsx`: arrel client viva. Orquestra query params (`leadId`, `customerId`, `date`, `prefill=lead`), autosave, dades inicials, pricing, distancia, conflictes, descompte, linies de servei, transport intern i submit.
- Components fills vius: `BookingClientEventSection`, `BookingServiceLinesSection`, `BookingPackExtrasSection`, `BookingTravelDiscountSection`, `BookingPricingSummary`.
- Hooks/helpers vius: `useNewBookingInitialData`, `useNewBookingSubmit`, `useBookingPricing`, `useBookingDistance`, `useBookingDateConflicts`, `useBookingDiscountValidation`, `bookingLeadServiceLineMapper`, `booking-form.types`, `booking-form-classes`.

CSS viu:
- No hi ha CSS local exclusiu de ruta. La pantalla usa carcassa `AdminPage`/`AdminSection`, classes globals admin (`adm-input`, `ap-btn`, `ap-card`) i constants visuals `NB_*` a `booking-form-classes.ts`.
- Les classes `nb__*` existents cobreixen estats i files compactes del formulari; els residus inline coneguts de `BookingTravelDiscountSection` i `BookingClientEventSection` van quedar drenats als #1157/#1158.
- No s'ha fet cap retoc CSS en aquesta fitxa.

APIs/serveis vius:
- Inicialitzacio: `useNewBookingInitialData` carrega packs, extres, col·laboradors i fuel reference; si hi ha `leadId`, consulta `/api/admin/leads/:id` i `/api/admin/leads/:id/service-lines`.
- Productes proveïdor: `BookingServiceLinesSection` consulta `GET /api/admin/collaborator-products`, que passa per `listActiveCollaboratorProductsForBooking`.
- Distancia: `useBookingDistance` fa `POST /api/admin/maps/distance` via `fetchWithCsrf`.
- Conflictes: `useBookingDateConflicts` fa `GET /api/admin/bookings?fromDate=...&toDate=...&limit=10` i filtra estats actius.
- Creacio: `useNewBookingSubmit` envia `POST /api/admin/bookings` via `fetchWithCsrf`; la ruta valida auth, CSRF, permisos i schema abans de `createBookingFromInput`.
- Servei canònic: `lib/services/bookingCreationService.ts` genera referencia, normalitza pack/extres/linies, hereta linies del lead si cal, calcula distancia/transport/tolls/IVA/senyal, crea booking/inventari/activity/task, marca lead `WON`, crea availability, adminLog i envia email no blocant.

Dades que governa:
- Esborrany local de nova reserva (`bookingAutosaveKey`), dades client/event, pack/extres, linies de servei, transport intern, descompte, fiscalitat, notes, origen lead/customer i total manual.
- Abans de guardar, és configurador contractual; despres de guardar, la veritat passa a `Booking` i `BookingServiceLine`.

Accions que governa:
- Prefill des de lead/customer/data.
- Recalcular distancia i peatges.
- Detectar conflictes de data.
- Configurar pack, extres, serveis Òrbita, productes de proveïdor, tecnic inclos i linies lliures.
- Calcular resum de preu/marge i crear la reserva.
- En exit, neteja autosave i navega a `buildLeadWorkspaceHref(leadId)` si ve de lead o a `buildBookingHref(booking.id)` si no.

Òrgans veïns:
- upstream: Lead workspace, llista/calendari de leads, Customer Hub i quick actions obren la pantalla via helpers (`buildLeadBookingPrefillHref`, `buildCustomerWorkspaceTabHref`, `buildLeadWorkspaceHref`).
- downstream: Reserva detall, Calendari/availability, Customer Activity, tasques, inventari, email de confirmacio, admin log i lead `WON`.

Codi mort relacionat:
- No s'ha detectat una segona arrel viva de nova reserva: `page.tsx` -> `NewBookingForm` és l'unic cami.
- `BookingServiceLinesSection` no és mort: el comparteixen nova reserva, editor de linies de reserva i bolo de lead. Qualsevol canvi allà és transversal.

Duplicacions:
- `BookingServiceLinesSection` és component compartit lead/reserva/editor; és monocapa funcional, pero el risc és que canvis visuals locals sobre nova reserva afectin també lead i fitxa reserva.
- `useNewBookingSubmit` encara suporta camps antics de `relationshipContext`; el formulari actual ja envia el cami explicit de `serviceLines`. Es conserva com a compatibilitat latent, no com a segona UI.
- La lectura inicial de linies del lead existeix al hook i el servei backend tambe pot heretar linies si el payload les omet; no és duplicacio activa: frontend mostra/editable, backend protegeix el cas sense payload.

Hardcoded/residu visual:
- No s'han trobat colors o mides locals nous dins aquest tall documental.
- Residus coneguts: `BookingServiceLinesSection` conserva agrupacions i labels locals de configurador; com que és component compartit i de negoci, qualsevol extraccio a constants ha de ser tall propi amb tests.
- `BookingServiceLinesSection` fa `fetch('/api/admin/collaborator-products', { headers: { 'x-admin': '1' } })` en cru. És `GET` autenticat i no necessita CSRF, pero queda com a residu de patró perquè altres mutacions ja passen per `fetchWithCsrf`.

Connexions interrompudes:
- No hi ha cable principal trencat en el flux lead -> nova reserva -> booking: `prefill=lead` força carrega fresca, esborra autosave vell i el submit acaba en servei canònic.
- Friccio pendent: la pantalla concentra configuracio comercial, cost intern i marge abans de crear la reserva. La compactacio #1382 ajuda, pero futurs canvis han de preservar la separacio mental lead/pre-reserva vs booking/veritat contractual.

Riscos:
- Tocar `BookingServiceLinesSection` sense mirar els altres dos consumidors pot trencar lead i editor de reserva.
- Tocar `bookingCreationService` afecta diners, availability, emails, lead status i inventari; requereix tests de servei i ruta.
- Tocar autosave/prefill pot reintroduir el bug #1379 on un esborrany local trepitja dades fresques del lead.

Evidència d'auditoria:
- Fitxers llegits línia per línia: `app/admin/bookings/new/page.tsx`, `NewBookingForm.tsx`, `useNewBookingInitialData.ts`, `useNewBookingSubmit.ts`, `BookingClientEventSection.tsx`, `BookingServiceLinesSection.tsx`, `BookingPackExtrasSection.tsx`, `BookingTravelDiscountSection.tsx`, `BookingPricingSummary.tsx`, `useBookingPricing.ts`, `useBookingDistance.ts`, `useBookingDateConflicts.ts`, `bookingLeadServiceLineMapper.ts`, `booking-form.types.ts`, `booking-form-classes.ts`, `app/api/admin/bookings/route.ts`, `lib/services/bookingCreationService.ts`, `app/api/admin/collaborator-products/route.ts`.
- Imports/exports verificats: `page.tsx` -> `NewBookingForm`; `NewBookingForm` -> hooks/sections; shared `BookingServiceLinesSection` -> lead/editor/nova reserva.
- Selectors CSS verificats contra DOM: pantalla sense CSS propi; classes `NB_*`, `adm-input`, `ap-btn`, `ap-card` i `AdminPage`/`AdminSection` identificades com a carcassa viva.
- Serveis/APIs seguits: lead detail/service-lines, collaborator-products, maps distance, bookings GET/POST i `bookingCreationService`.
- Proves/guards executats per context recent: tests enfocats `leadWorkspaceHref`, `useFormAutosave` i mapper; `tsc`; `qa:protocol`; `validate:core`; `git diff --check` verds en revisio post-crash #1382. Aquest tall documental executa de nou protocol/validacio abans de tancar.

Decisió de treball:
- La ruta es conserva i queda fitxada com a pantalla viva i crítica de Reserves.
- Qualsevol millora funcional posterior ha d'entrar per tall petit: autosave/prefill, configurador compartit o servei de creacio, no tot alhora.
- No tocar en aquest tall: schema, transport, marge, `BoloTripCard`, CSS funcional ni calculs economics.
- Validacio pendent del propietari: ergonomia visual final de nova reserva abans de `TANCAT CHARLIE`.

### `/admin/calendario`

Pantalla: Calendari operatiu / agenda de reserves, leads, bloquejos i feina
Ruta: `/admin/calendario`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual final del propietari.
Estat fitxa: FETA — auditoria forense inicial completada el 2026-07-04 (Canvi #1387).

Història:
- `app/admin/calendario/page.tsx` és una ruta viva amb tres modes (`month`, `week`, `day`) governats per query param `view`.
- Canvi #325: reserves i follow-ups vinculats van deixar d'obrir lead literal i passen per helper de workspace.
- Canvi #898: el calendari mostra multiples leads del mateix dia, no només el primer.
- Canvi #1321: els leads `LOST` es mantenen al calendari com a senyal simbòlic/minimitzat.
- Canvi #1334: verificacio real que la reserva Alba Orna/OE-2026-006 apareixia a `/api/admin/calendario/mes`.
- Canvis #1383/#1384/#1385: nova reserva, llista de reserves i kanban queden fitxats; calendari és el tercer node principal pendent de l'òrgan Reserves.

Component viu:
- `app/admin/calendario/page.tsx`: server component mínim. `dynamic = 'force-dynamic'`; tria `CalendarDayClient`, `CalendarWeekClient` o `CalendarMonthClient` segons `searchParams.view`.
- `CalendarMonthClient.tsx`: client principal. Carrega rang mensual, mostra KPIs, llegenda/capes, graella, detall de dia, bloqueig/desbloqueig i drag/drop per moure data de reserva.
- `CalendarWeekClient.tsx`: client setmanal. Reutilitza el mateix endpoint de rang i mostra agenda per setmana amb capes, bloqueig/desbloqueig i enllaços cap a reserves/leads/tasques/social.
- `CalendarDayClient.tsx`: client diari. Reutilitza el mateix endpoint amb rang d'un dia, pinta timeline horària, resum lateral, bloquejos i feina del dia.
- `calendar-utils.ts`: tipus i helpers compartits de dies, hores, tons, labels, format de data, packs i temps.
- `loading.tsx`: skeleton admin canònic per calendari.

CSS viu:
- No hi ha CSS local exclusiu de `/admin/calendario`.
- Carcassa viva: `AdminPage`, `ADMIN_CALENDAR_HELP`, `ap-card`, `ap-btn`, `ap-input`, `ap-badge`, `ToastProvider` i tokens globals admin.
- Persisten classes utilitàries locals i arbitràries dins els clients (`bg-[var(--raised)]`, `border-[var(--line)]`, rings de drag/drop, grid/layout Tailwind). Són residu visual admissible mentre la pantalla no es retoca, però no són patró nou a copiar.

APIs/serveis vius:
- Lectura agregada: `GET /api/admin/calendario/mes?from=...&to=...` valida auth i crida `getAdminCalendarMonth(from, to)`.
- `getAdminCalendarMonth`: agrega `Lead` sense booking, `Booking` no cancel·lada, `Availability` bloquejada, `Task` oberta/en curs, `SocialPost` draft/scheduled i follow-ups pendents del dia actual.
- Disponibilitat admin: `POST /api/admin/availability` i `DELETE /api/admin/availability` amb CSRF; servei `availabilityAdminService` crea/actualitza/elimina bloquejos amb data a migdia per evitar problemes de zona horària.
- Moviment de reserva: el mes fa `PATCH /api/admin/bookings/[id]` amb `eventDate` quan es deixa anar una reserva sobre un altre dia.
- Navegacio canònica: `buildBookingHref`, `buildLeadCustomerHref`, `buildCustomerWorkspaceTabHref` en mes i helpers compartits de lead/booking en dia/setmana.

Dades que governa:
- Agenda operativa de reserves: id, lead/customer, data, client, ubicacio, estat, tipus, total, horari i pack.
- Leads amb data d'event i sense reserva, inclosos `LOST` com a senyal simbolic.
- Bloquejos de disponibilitat admin.
- Tasques amb venciment, posts socials programats i follow-ups pendents.
- Preferencia visual local de capes activades/desactivades dins cada client.

Accions que governa:
- Canviar vista mes/setmana/dia i navegar dates.
- Activar/desactivar capes de lectura.
- Obrir reserva, lead/customer, tasques i social.
- Crear reserva amb data preomplerta (`/admin/bookings/new?date=...`) i crear client des del context del dia.
- Bloquejar o desbloquejar dies.
- Reprogramar reserva arrossegant-la en vista mensual o canviant data des del detall mensual.

Òrgans veïns:
- upstream: llista de reserves, nova reserva, Customer Hub, leads, dashboard i quick actions poden portar cap al calendari per data o context.
- downstream: reserva detall, nova reserva, Customer Hub, Lead workspace, Tasks, Social, Availability pública/admin i la subruta `/admin/calendario/capacity`.
- `/admin/calendario/capacity` és una ruta viva però queda fora d'aquesta fitxa; continua pendent de fitxa pròpia a la taula.

Codi mort relacionat:
- No s'ha detectat arrel morta: els tres clients estan connectats per `page.tsx` i el query param `view`.
- `calendar-utils.ts` és compartit pels tres clients; no podar helpers sense revisar mes/setmana/dia.
- `capacity/page.tsx` no és mort: és una subruta separada amb serveis de capacitat/forecast.

Duplicacions:
- Els tres clients dupliquen fetch del rang, estat `loading/error/data`, toggles de capes i lògica de bloqueig/desbloqueig.
- L'endpoint es diu `/mes`, però dia i setmana també el consumeixen com a agregador de rang. Funciona, però el nom del contracte és legacy i pot confondre futurs canvis.
- Month té moviment de reserva per drag/drop i canvi de data; week/day no tenen la mateixa capacitat. La diferència és funcional, no només visual.
- `CalendarWeekClient` no usa `buildCustomerWorkspaceTabHref` com el mes; cal revisar coherència d'enllaços si es toca navegacio.

Hardcoded/residu visual:
- Metadata sense accents: `"Calendari d'ocupacio | Orbita Admin"`; és admin intern, però si es toca copy s'ha d'alinear.
- Icones/emoji visibles locals (`📣`, `☎`, `👤`) i labels interns directes als components.
- Classes Tailwind arbitràries i rings locals en estats de drag/drop. Si hi ha passada visual, migrar cap a tokens/classes admin compartides.

Connexions interrompudes:
- No hi ha tall principal de dades: API i servei retornen les sis capes que els clients esperen.
- Risc funcional conegut: l'agregador inclou follow-ups només al `todayKey`; en rangs futurs/passats la capa no és històrica, sinó una safata del dia actual projectada sobre el calendari.
- La creacio de reserva des de calendari només passa `date`; qualsevol herencia de client/lead ha d'entrar per fluxos propis, no inventar-se al calendari.

Riscos:
- Tocar `getAdminCalendarMonth` afecta mes, setmana i dia simultaniament; qualsevol canvi ha de cobrir serveis i com a mínim una vista client.
- Tocar availability afecta disponibilitat pública/admin i integracions de reserva; validar `availabilityAdminService` i rutes amb CSRF.
- Tocar `PATCH /api/admin/bookings/[id]` des del calendari afecta reserva real; no barrejar moviments de data amb transport, marge o status.

Evidència d'auditoria:
- Fitxers llegits línia per línia o per perímetre complet: `app/admin/calendario/page.tsx`, `CalendarMonthClient.tsx`, `CalendarWeekClient.tsx`, `CalendarDayClient.tsx`, `calendar-utils.ts`, `loading.tsx`, `app/api/admin/calendario/mes/route.ts`, `lib/services/adminCalendarMonthService.ts`, `app/api/admin/availability/route.ts`, `lib/services/availabilityAdminService.ts`.
- Tests llegits: `__tests__/app/admin/calendario/CalendarMonthClient.test.ts`, `__tests__/lib/services/adminCalendarMonthService.test.ts`, `__tests__/lib/services/availabilityAdminService.test.ts`.
- Imports/exports verificats: `page.tsx` -> tres clients; clients -> `calendar-utils`; endpoint calendari -> servei mes; availability route -> servei availability.
- Serveis/APIs seguits: calendari mes, availability admin i PATCH booking per canvi de data.
- Proves/guards a executar abans de tancar aquest tall: tests de calendari/availability, `tsc`, `qa:protocol`, `validate:core` i `git diff --check`.

Decisió de treball:
- La ruta es conserva: és l'agenda operativa viva de Reserves i feina planificada.
- Proper tall recomanat: si es toca funcionalment, extreure fetch/block/layers a helper compartit o normalitzar el contracte de rang abans de polir UI.
- No tocar en aquesta fitxa: transport, marge, cost de bolo, booking detail, nova reserva, schema ni Google Calendar.
- Validacio pendent del propietari: visual final de mes/setmana/dia abans de `TANCAT CHARLIE`.

### `/admin/calendario/capacity`

Pantalla: Capacitat operativa / càrrega i forecast
Ruta: `/admin/calendario/capacity`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual final del propietari.
Estat fitxa: FETA — auditoria forense inicial completada el 2026-07-04 (Canvi #1388).

Història:
- La ruta neix com a extensió del calendari per llegir capacitat operativa abans que el calendari mensual sigui massa dens.
- Canvis #747/#748/#749: `operationalForecastService` afegeix forecast setmanal, el Dashboard mostra `WeeklyCapacityForecastPanel` quan hi ha alertes i el resum diari email/WhatsApp rep les setmanes `WARNING`/`CRITICAL`.
- Canvi #750: tests de `WeeklyCapacityForecastPanel` blinden render condicional, CTA a `/admin/calendario/capacity`, alertes i YoY.
- Canvis #987-#1322: la pàgina i el panell han passat per homogeneïtzació visual massiva cap a `.ap-*` i `admin-tone-*`.
- Canvi #1387: el calendari base queda fitxat; aquesta subruta queda com a detall de capacitat separat i viu.

Component viu:
- `app/admin/calendario/capacity/page.tsx`: server component viu. Carrega `loadWeekCapacity(now, 14)` i `loadWeeklyCapacityForecast(now, 4)` en paral·lel i renderitza KPIs, graella de 14 dies, llegenda i forecast de 4 setmanes.
- `loading.tsx`: reexporta `AdminLoadingSkeletonList`.
- `app/admin/components/WeeklyCapacityForecastPanel.tsx`: panell de Dashboard que filtra setmanes `WARNING`/`CRITICAL` i enllaça a aquesta ruta com a detall.
- No hi ha client component propi ni mutacions a la ruta.

CSS viu:
- No hi ha CSS local exclusiu.
- Carcassa viva: `AdminPage`, `ap-card`, `ap-btn`, `admin-tone-*`, tokens globals i utilitats responsive.
- Residus visuals locals: mapes `LOAD_CONFIG` i `ALERT_CONFIG` dins la pàgina amb classes Tailwind arbitràries (`text-[var(--t3)]`, `bg-[var(--o-admin-fill-1)]`, `border-[var(--line)]`, dots `bg-[var(--o-*)]`). Són dades visuals de presentació, no font de negoci.

APIs/serveis vius:
- `bookingCapacityService.ts`: `buildWeekCapacity(input)` pura i `loadWeekCapacity(startDate, days)` sobre `prisma.booking`.
- `loadWeekCapacity`: compta reserves amb status `PENDING`, `CONFIRMED` i `PREPARING`, dins finestra `[start, end)`, ordenades per `eventDate`.
- `operationalForecastService.ts`: `buildWeeklyCapacityForecast(input)` pura i `loadWeeklyCapacityForecast(now, weeksAhead, options)` sobre reserves properes i reserves de l'any anterior.
- `automationThresholds.ts`: `CAPACITY_FORECAST_THRESHOLDS` és la font canònica dels llindars del forecast (`maxBookingsPerDay=2`, `weekWarningBookings=5`, `weekCriticalBookings=7`, `defaultWeeksAhead=4`).
- Dashboard: `app/admin/page.tsx` carrega `loadWeeklyCapacityForecast()` i renderitza `WeeklyCapacityForecastPanel`.

Dades que governa:
- Capacitat de 14 dies: dies lliures, total reserves, dies sobrecarregats, dia més ocupat, càrrega per dia, convidats totals i reserves clicables.
- Nivells de càrrega de dia: `FREE`, `LIGHT`, `FULL`, `OVERLOADED`.
- Forecast 4 setmanes: reserves, convidats, dies sobrecarregats, reserves mateixa finestra de l'any anterior, delta YoY, alert level i missatge.
- No governa availability ni bloquejos; això viu al calendari base i serveis d'availability.

Accions que governa:
- Obrir la reserva afectada amb `buildBookingHref`.
- Tornar a calendari via `back`.
- Llegir setmanes futures amb alerta i decidir intervencio manual fora d'aquesta pàgina.
- Des del Dashboard, saltar a `/admin/calendario/capacity` quan el panell condicional detecta risc.

Òrgans veïns:
- upstream: Dashboard (`WeeklyCapacityForecastPanel`), calendari base, resum diari comercial i alertes operatives.
- downstream: reserva detall per cada booking, calendari base per context d'agenda, manual admin per capacitat/conflictes.
- relacionat però separat: `capacityConflictService` detecta col·lisions d'inventari; aquesta ruta només llegeix càrrega temporal de reserves i forecast.

Codi mort relacionat:
- La ruta és viva: apareix a `app/admin/calendario/capacity/page.tsx`, al CTA del Dashboard i al manual.
- `WeeklyCapacityForecastPanel` no és mort encara que retorni `null` sense alertes; és un panell condicional deliberat i testat.
- `bookingCapacityService` i `operationalForecastService` tenen tests de builder/loader.

Duplicacions:
- La pàgina duplica localment configuracions visuals `LOAD_CONFIG`/`ALERT_CONFIG`; `WeeklyCapacityForecastPanel` té el seu propi `ALERT_STYLE`. Si es fa una passada visual, caldria compartir mapa de presentació o portar-ho a constants UI.
- `bookingCapacityService` usa `DEFAULT_MAX_PER_DAY = 2`; `operationalForecastService` usa `CAPACITY_FORECAST_THRESHOLDS.maxBookingsPerDay = 2`. Mateix valor en dues fonts; el forecast ja és canònic, la capacitat de 14 dies encara té default local.
- Els llindars són de volum de reserves, no de persones, hores, equip ni staff. No interpretar `OVERLOADED` com a capacitat logística completa.

Hardcoded/residu visual:
- Textos de pàgina/admin en JSX directe; és admin intern i coherent amb la resta, però si es converteix en superfície pública o multiidioma caldria extreure.
- Classes arbitràries de color/token dins configs locals, tolerades pels guards actuals però no ideals com a patró nou.
- Comentaris JSX (`Summary KPIs`, `Day grid`, `Legend`, `Forecast 4 setmanes`) són orientatius; no afecten runtime.

Connexions interrompudes:
- No hi ha cable principal trencat: Dashboard -> capacity -> booking detail funciona amb helpers.
- Connexio parcial: la pàgina no enllaça cap a la data concreta del calendari base; només cap a reserva o calendari general. Si el propietari demana drill-down de dia, fer tall petit.
- La comparativa YoY compta reserves per offset setmanal respecte a l'any anterior; no ajusta festius, temporada ni tipus d'event.

Riscos:
- Canviar `loadWeekCapacity` afecta lectura de 14 dies i pot alterar semàfors del propietari; validar tests de `bookingCapacityService`.
- Canviar `loadWeeklyCapacityForecast` afecta Dashboard, resum diari i aquesta pàgina; validar servei, panell i automatitzacio comercial si es toca contracte.
- No barrejar aquesta ruta amb inventari/transport/staff: són dimensions relacionades però servides per altres motors.

Evidència d'auditoria:
- Fitxers llegits línia per línia o per perímetre complet: `app/admin/calendario/capacity/page.tsx`, `loading.tsx`, `lib/services/bookingCapacityService.ts`, `lib/services/operationalForecastService.ts`, `lib/constants/automationThresholds.ts`, `app/admin/components/WeeklyCapacityForecastPanel.tsx`, connexió al Dashboard dins `app/admin/page.tsx`.
- Tests llegits: `__tests__/lib/services/bookingCapacityService.test.ts`, `__tests__/lib/services/operationalForecastService.test.ts`, `__tests__/app/admin/components/WeeklyCapacityForecastPanel.test.tsx`.
- Imports/exports verificats: capacity page -> serveis; Dashboard -> `WeeklyCapacityForecastPanel`; panell -> CTA `/admin/calendario/capacity`.
- Proves/guards a executar abans de tancar aquest tall: tests de capacity/forecast/panell, `tsc`, `qa:protocol`, `validate:core` i `git diff --check`.

Decisió de treball:
- La ruta es conserva: és el detall operatiu del forecast de capacitat i complementa el calendari base.
- Proper tall recomanat: si es toca, unificar els llindars `maxPerDay` i els mapes visuals de forecast entre pàgina i panell.
- No tocar en aquesta fitxa: inventari, transport, staff, booking detail, schema, cron/commercial daily ni CSS funcional.
- Validacio pendent del propietari: utilitat visual de la graella 14 dies i forecast abans de `TANCAT CHARLIE`.

### `/admin/clientes`

Pantalla: Clients — llista CRM, priorització operativa i entrada al Customer Hub.
Ruta: `/admin/clientes`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1761, codex, 2026-07-09)

Història:
- El #811 va migrar la llista de clients al disseny Brass & Obsidian amb `clientes.css`/`cl__*` i va marcar-la `🟢` a l'inventari.
- El #1273 va revertir aquella arquitectura visual local cap al sistema canònic: `clientes.css` esborrat, `AdminPage`, `AdminKpiRow`, `ap-*`, `adm-input`, `ap-table-*`, `ap-card`, `ap-badge` i `AdminEmptyState`.
- La fitxa #1761 regularitza el mapa: la nota antiga de l'inventari ja no promet `clientes.css` ni absència d'`AdminPage`; la realitat viva és pàgina canònica `ap-*` amb accions CRM reals.

Reachability:
- `app/admin/clientes/page.tsx` és ruta Next real i client component.
- `app/admin/clientes/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/admin/lib/adminNav.ts`, shortcuts admin, manual operatiu, Daily Brief, Reporting, Salut, Calendar i Customer Hub enllacen cap a `/admin/clientes`.
- `app/admin/calendario/CalendarMonthClient.tsx` pot obrir `/admin/clientes?add=1&date=YYYY-MM-DD` i la pàgina sí consumeix `add/date` per obrir el modal amb nota d'origen.

Component viu:
- `page.tsx`: governa estat de cerca, filtres, paginació, càrrega de `/api/admin/customers`, add modal i start-process modal.
- `CustomersPageSections.tsx`: renderitza ajuda, KPIs, toolbar, CSV, filtres de prioritat, loading/error/empty, llista mòbil, taula desktop i paginació.
- `ClientesModals.tsx`: `AddCustomerModal` crea clients amb dedupe en viu; `StartProcessModal` dispara processos comercials per client.
- `customer-utils.ts`: tipus locals, prioritat operativa, següent pas i resum operatiu del Customer Hub.

CSS viu:
- No hi ha CSS propi de `/admin/clientes` després del #1273.
- La pàgina depèn del sistema admin compartit: `AdminPage`, `.ap-btn`, `.ap-kpi`, `.ap-table-*`, `.ap-card`, `.ap-badge`, `.adm-input`, `.skeleton`, `admin-tone-*` i utilitats Tailwind puntuals.
- Això és coherent amb el #1273; el deute era documental, no runtime.

APIs/serveis vius:
- `GET /api/admin/customers`: auth, `listAdminCustomers()` amb cerca, filtres, paginació i stats.
- `POST /api/admin/customers`: auth + CSRF, `createCustomerFromInput()` crea client, notes inicials, activitat i tasca `TASK_SOURCE.CUSTOMER_CREATION`.
- `POST /api/admin/customers/check-duplicates`: auth + CSRF, `findDuplicates()` per dedupe en viu.
- `POST /api/admin/start-process`: auth + CSRF, `startCustomerProcess()` per `review_request`, `post_event`, `welcome` i `promo`.
- Export CSV: `ExportCsvButton` exporta les files carregades a client; no fa query global.

Dades que governa:
- `Customer`: id, número, nom, email, telèfon, ciutat, instagram, source, totalEvents, totalSpent, tags, lifecycleStage, healthScore, dates i stats.
- Filtres server: `q`, `lifecycleStage`, `tag`, `healthScoreMax`, `minSpent`, `page`, `limit`.
- Filtres client: prioritat `ALTA|MITJANA|BAIXA` derivada de `getExecutionPriority()`.
- Modal de creació: name/email/phone/dni/instagram/source/notes i avisos de duplicat.

Accions que governa:
- Cercar i filtrar clients.
- Obrir Fitxa 360 via `buildCustomerHubHref()`.
- Crear pressupost per client sense events via `/admin/presupuestos?customerId=...`.
- Obrir post-event per clients amb historial.
- Afegir client manualment, amb dedupe i tasca inicial.
- Exportar CSV de la pàgina carregada.
- Iniciar processos comercials que poden enviar email real i/o crear codis de descompte.

Òrgans veïns:
- upstream: Dashboard/Daily Brief, Salut, Reporting, Calendari, Manual, Sales Ops i Customer Hub tornen o apunten a la llista.
- downstream: Customer Hub, Pressupostos, Post-event, Tasks, deduplicació, customer activities, email i discount codes.
- satèl·lits: Reactivació i Referrals són cues especialitzades; la llista és cercador/triador i entrada a la fitxa 360.

Codi mort relacionat:
- Cap arrel morta detectada: `qa:no-dead-admin-views` passa i page/sections/modals/loading són rutes/components vius.
- `buildCustomerHubOperatingSummary()` té test però avui no és renderitzat per `page.tsx`; és codi latent documentat, no prova de superfície visible.

Duplicacions:
- No duplica Customer Hub: la llista prioritza i navega; la veritat relacional i les mutacions de fitxa viuen a `/admin/clientes/[id]`.
- No duplica Reactivació/Referrals: aquests són worklists especialitzats; `/admin/clientes` és l'índex CRM.
- La prioritat de llista és local i simple; si s'ha d'elevar a cervell compartit, cal decidir contracte amb `customerInsightsService`, no copiar criteris.

Hardcoded/residu visual:
- Copy admin local acceptable; no és superfície pública.
- Deute menor: icones inline/emoji i SVG locals a botons; coherents amb la resta admin però no són lucide.
- `StartProcessModal` pot disparar emails reals amb HTML inline dins `customerProcessService`; és deute de traça/copy si aquest flux creix.
- `console.error` continua present en catch de càrrega i modals; no és `console.log`, però si s'endureix observabilitat s'hauria de passar per toast/log estructurat.

Connexions interrompudes:
- Resolt #1762: els consumidors que enllacen `/admin/clientes?segment=...` ja entren pels filtres de `CUSTOMER_SEGMENTS` mitjançant `resolveCustomerSegmentFilter()`.
- L'export CSV només exporta els `customers` carregats a la pàgina actual, no tot el resultat filtrat. Acceptable si es considera export de vista; si es vol export CRM complet, cal endpoint dedicat.
- `StartProcessModal` envia/codifica processos però no mostra preview del missatge abans d'executar; cal prudència perquè pot sortir email real.

Riscos:
- Tocar `listAdminCustomers()` afecta cerca, filtres, paginació, stats i qualsevol autocomplete que depengui de `/api/admin/customers`.
- Tocar `createCustomerFromInput()` impacta creació manual, dedupe, tasca inicial i activitat del client.
- Tocar `startCustomerProcess()` impacta email real i codis de descompte; requeriria tests focalitzats i validació humana.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/clientes/page.tsx`, `CustomersPageSections.tsx`, `ClientesModals.tsx`, `customer-utils.ts`, `loading.tsx`.
- serveis/APIs llegits: `app/api/admin/customers/route.ts`, `app/api/admin/customers/check-duplicates/route.ts`, `app/api/admin/start-process/route.ts`, `lib/services/customerListService.ts`, `customerCreationService.ts`, `customerProcessService.ts`.
- tests llegits o localitzats: `__tests__/app/admin/clientes/customer-utils.test.ts`, `__tests__/lib/services/customerListService.test.ts`, `customerCreationService.test.ts`, `customerProcessService.test.ts`, `__tests__/app/api/admin/customers-check-duplicates-route.test.ts`, `start-process-route.test.ts`.
- consumidors verificats amb `rg`: nav admin, manual, Daily Brief, Reporting, Salut, Calendar, Customer Hub i Post-event.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`. El P1 `?segment=` queda resolt al #1762 amb test focalitzat.

Decisio de treball:
- conservar `/admin/clientes` com a índex CRM canònic i entrada operativa al Customer Hub.
- actualitzar l'inventari perquè reflecteixi #1273: l'estat 🟢 és per canonització compartida, no per `clientes.css`.
- tall petit posterior resolt al #1762: consumir `?segment=` i aplicar el filtre de `CUSTOMER_SEGMENTS` corresponent amb test focalitzat.
- no tocar en aquesta fitxa: Customer Hub `[id]`, Reactivació, Referrals, schema, serveis d'email, discount codes, dedupe intern ni processos comercials.

### `/admin/clientes/[id]`

Pantalla: Client 360 / Customer Hub
Ruta: `/admin/clientes/[id]`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA — auditoria forense inicial completada el 2026-06-24 (Canvi #1114), abans de tocar el P1 visual de `TimelinePanel.tsx`.

Història:
- Canvi #812: migració de la fitxa 360 al disseny Brass & Obsidian, `customer-hub.css` amb prefix `ch__`, `CustomerHubClient`/`CustomerHeader`, KPIs, stagebar, tabs i accions pròpies.
- Canvi #1048: auditoria transversal va declarar l'òrgan Clients sa a nivell de codi mort/components, amb residu pendent només visual.
- Canvi #1114: aquesta fitxa deixa `/admin/clientes/[id]` de `PENDENT` a `FETA` dins `docs/admin-fitxes-pantalles.md`, perquè el P1 `TimelinePanel.tsx:197` no es podia sanejar sense mapa forense.
- Canvi #1116: `TimelinePanel` deixa d'emetre superfícies `bg-white/*`, `text-white/*` i `border-l-*` Tailwind; el lateral passa a classes `ch__timeline-*` governades per `customer-hub.css`.
- Canvi #1117: `InsightsBanner` deixa d'emetre fallbacks `bg-white/*`, `text-white/*`, `border-white/*`, `bg-[var(...)]` i `admin-tone-*`; les tres targetes passen a classes `ch__insight-*` governades per `customer-hub.css`.
- Canvi #1118: `BookingsPanel` deixa d'emetre `border-white/*`, `bg-white/*`, `text-white/*`, `bg-emerald-*` i `bg-amber-*`; cards, badges, pills, seccions i links passen a classes `ch__booking-*`/`ch__bookings-*`.
- Canvi #1119: `PrivacyPanel` deixa d'emetre `admin-card-glass`, skeletons `bg-white/*` i utilitats visuals locals; consentiments, export RGPD i ARCO passen a classes `ch__privacy-*`.
- Canvi #1120: `DiscountsPanel` deixa d'emetre `border-white/*`, `bg-white/*`, `text-white/*` i `admin-tone-*`; codis, status i metadata passen a classes `ch__discount-*`.
- Canvi #1121: `SummaryPanel` deixa d'emetre residus `bg-white/*`, `border-white/*`, `text-white/*`, `hover:bg-white/*`, `hover:text-white/*` i `placeholder:text-white/*`; barra financera, quick actions, ruta, referits i tags passen a classes `ch__summary-*`.
- Canvi #1126: `LeadsPanel` deixa d'emetre `admin-tone-*`, classes Tailwind cromàtiques de lead i superfícies genèriques; status, prioritat, blocker, cards i accions passen a classes `ch__lead-*`.
- Canvi #1128: `ProposalsPanel` deixa d'emetre superfícies genèriques, `text-white/40`, botons locals i confirmacions inline; grups, cards, accions, error i contracte passen a classes `ch__proposal-*`.
- Canvi #1134: `CommsPanel` deixa d'emetre contenidors, mètriques, pills, botons, textarea i llista de missatges amb classes genèriques; el fil canònic, accions ràpides, seguiment, canals, nota interna i missatges passen a `ch__comms-*` / `ch__comm-*`.
- Canvi #1136: `CustomerHeader.tsx` deixa de tenir els dos `style={{...}}` locals documentats; el backdrop del menú d'estat i el wrapper del rail d'etapes passen a `ch__statusbackdrop` i `ch__stageitem`.
- Canvi #1139: `/admin/clientes/reactivation` deixa d'emetre KPIs, cards, pills, missatge suggerit i accions amb classes visuals genèriques; `ReactivationClient` passa a `rc__*` i `reactivation.css` escopat a `html.admin-mode`.
- Canvi #1140: es va registrar que `/admin/clientes/referrals` deixava d'emetre KPIs, top referrers, filtres, candidats, missatge suggerit i accions amb classes visuals genèriques; reauditoria #1760 detecta que el codi viu ja no correspon del tot a aquella fotografia (`AdminPage`/`ap-*`/utilitats i sense `referrals.css`). Queda com a deute visual de la satèl·lit Referrals, separat de la fitxa 360.
- Canvi #1141: `ClientesModals` deixa d'emetre overlays `bg-black/60 admin-card-glass` i fallback `bg-white/5 text-white/40`; passen a `cl__modal-backdrop` i `cl__duplicate-score-low` dins `clientes.css`.

Component viu:
- `app/admin/clientes/[id]/page.tsx`: server component real. Importa `customer-hub.css`, força dinàmic, resol metadata i carrega dades amb `fetchCustomerHub(id)`.
- `CustomerHubClient.tsx`: client shell viu. Gestiona pestanya activa, refresh via `/api/admin/customers/[id]/hub`, avisos de tasca, context compartit i layout `ch__grid`.
- `CustomerHeader.tsx`: capçalera viva amb estat comercial, accions ràpides, canvi d'estat via CSRF, delete/anonymize via CSRF, next action i prioritat comercial.
- Panells dinàmics vius: `SummaryPanel` (residus `white/*` drenats al #1121), `ProposalsPanel` (visualment drenat al #1128), `BookingsPanel` (visualment drenat al #1118), `MarginExtrasPanel` (visualment drenat al #1130), `CommsPanel` (visualment drenat al #1134), `TasksNotesPanel` (visualment drenat al #1131), `DiscountsPanel` (visualment drenat al #1120), `LeadsPanel` (visualment drenat al #1126), `PrivacyPanel` (visualment drenat al #1119).
- `TimelinePanel.tsx`: lateral viu de timeline/riscs; és el primer punt P1 visual detectat.
- Components auxiliars vius: `InsightsBanner` (visualment drenat al #1117), `OwnerControlStrip`, `MobileQuickActions`, `loading.tsx`.

CSS viu:
- `app/admin/clientes/[id]/customer-hub.css`: capa local `ch__*` per shell, header, KPIs, tabs, cards, botons, estats i layout responsive.
- El CSS local conviu amb classes Tailwind encara presents dins panells; no es pot considerar completament drenat de residu visual.

APIs/serveis vius:
- Lectura canònica: `lib/customer-hub/fetchCustomerHub.ts` és font compartida per `page.tsx` i `GET /api/admin/customers/[id]/hub`.
- Dades base: `lib/customer-hub/data.ts` resol customer/lead/booking/proposal/task/activity/document i agrega leads, proposals, bookings, tasks, messages, discount codes, contacts, insights i reactivació.
- Timeline: `lib/customer-hub/timeline.ts` combina events de negoci i activitat canònica (`timelineQueryService`) i enllaça cap a leads/bookings amb helpers compartits.
- Rutes admin vives: `/api/admin/customers/[id]` (`GET/PATCH/DELETE`), `/hub`, `/status`, `/tags`, `/preferences`, `/contacts`, `/activities`, `/consents`, `/export`.
- Enllaços canònics: `customerWorkspaceHref`, `leadWorkspaceHref`, `bookingWorkspaceHref`, `nextActionLink`, `communicationSpine`, `commercialPriority`.

Dades que governa:
- Identitat i estat del client: nom, email, telèfon, idioma, consentiments, estat hub, tags, preferències i referències.
- Historial comercial: leads, pressupostos, reserves, tasques, comunicacions, activitats, documents/contractes i codis de descompte.
- Salut comercial: `CustomerInsightsDTO`, risc comercial, propera acció, recurrència, LTV, pagaments pendents, reactivació i referits.

Accions que governa:
- Canviar estat del client (`/status`).
- Editar dades base, tags, preferències i contactes (`/api/admin/customers/[id]`, `/tags`, `/preferences`, `/contacts`).
- Crear o obrir pressupostos, reserves, tasques i comunicacions via helpers de workspace.
- Registrar activitats de comunicació i marcar/eliminar tasques.
- Exportar dades i consultar/gestionar consentiments des del panell de privacitat.
- Filtrar timeline per tipus d'event i refrescar hub sense canviar ruta.

Òrgans veïns:
- upstream: `/admin/clientes`, leads, reserves, pressupostos, tasques, inbox/comunicacions i dashboard obren aquesta fitxa via helpers de customer/workspace.
- downstream: `/admin/leads/[id]`, `/admin/bookings/[id]`, `/admin/presupuestos`, Inbox/Compose, Tasks, Privacy/GDPR, Reactivation/Referrals, Discounts i timeline canònica.

Codi mort relacionat:
- `qa:no-dead-admin-views` ja passa verd en el perímetre admin; no hi ha arrel `clientes/[id]` òrfena detectada.
- Els panells dinàmics són renderitzats per `CustomerHubClient` segons tab; no són codi mort per falta d'import estàtic directe.

Duplicacions:
- La lectura està ben centralitzada: `page.tsx` i l'API `hub` consumeixen `fetchCustomerHub`.
- La capa `data.ts` fa Prisma directe i és el punt compartit del hub; no duplicar queries locals dins panells si es toca dades.
- La timeline del client ja passa per `timelineQueryService` quan hi ha events canònics; no reimplementar mappings de timeline dins UI.
- Hi ha convivència visual: `customer-hub.css` governa la carcassa `ch__*`, però panells interns encara tenen Tailwind i tons locals.

Hardcoded/residu visual:
- Resolt #1116: `TimelinePanel` ja no conserva `bg-white/*`, `text-white/*`, `bg-[var(...)]` ni `border-l-*` Tailwind al JSX o a la metadata; els tons viuen a `ch__timeline-event--*`.
- Resolt #1117: `InsightsBanner` ja no conserva `bg-white/*`, `text-white/*`, `border-white/*`, `bg-[var(...)]` ni `admin-tone-*`; les superfícies i tons viuen a `ch__insight-*`.
- Resolt #1118: `BookingsPanel` ja no conserva `border-white/*`, `bg-white/*`, `text-white/*`, `bg-emerald-*` ni `bg-amber-*`; el panell viu a `ch__booking-*`/`ch__bookings-*`.
- Resolt #1119: `PrivacyPanel` ja no conserva `admin-card-glass`, `bg-white/*`, `text-white/*`, `border-white/*`, `opacity-*` ni `rounded-2xl` locals; el panell viu a `ch__privacy-*`.
- Resolt #1120: `DiscountsPanel` ja no conserva `border-white/*`, `bg-white/*`, `text-white/*`, `admin-tone-*`, `bg-amber-*` ni `bg-emerald-*`; el panell viu a `ch__discount-*`.
- Resolt #1121: `SummaryPanel` ja no conserva `bg-white/*`, `border-white/*`, `text-white/*`, `hover:bg-white/*`, `hover:text-white/*` ni `placeholder:text-white/*`; els residus drenats viuen a `ch__summary-*`.
- Resolt #1126: `LeadsPanel` ja no conserva `admin-tone-*`, classes cromàtiques Tailwind dels helpers de lead ni superfícies genèriques `rounded/border/p-*`; el panell viu a `ch__lead-*`.
- Resolt #1128: `ProposalsPanel` ja no conserva `bg-white/*`, `border-white/*`, `text-white/*`, `rounded-2xl`, `opacity-*`, `border-dashed`, `space-y-*` ni superfícies/botons locals; el panell viu a `ch__proposal-*`.
- Resolt #1134: `CommsPanel` ja no conserva `bg-white/*`, `border-white/*`, `text-white`, `rounded-2xl`, `rounded-xl`, `opacity-*`, `space-y-*`, superfícies/botons/textarea genèrics ni botó de nota amb `disabled:opacity-*`; el panell viu a `ch__comms-*` / `ch__comm-*`.
- Resolt #1136: `CustomerHeader.tsx` ja no conserva overlay inline ni `display: contents` inline; ambdós viuen a `customer-hub.css`.
- El residu documentat dins la fitxa Client 360 queda concentrat sobretot en llista i validació visual final; qualsevol sanejament s'ha de fer per franges, sense reescriure el hub sencer.

Connexions interrompudes:
- No hi ha cable principal trencat: Customer Hub llegeix, muta i enllaça amb leads, reserves, pressupostos, tasques, comunicacions, privacitat i timeline.
- Fricció existent: Client 360 fa de hub transversal; tocar estat/client/contacte pot impactar lead/booking/proposal. Cal preservar els helpers de navegació i el contracte `CustomerHubDTO`.
- El refresh client (`fetch /hub`) no substitueix `router.refresh()` dels panells que muten altres òrgans; no barrejar patrons sense revisar cada acció.

Riscos:
- Canviar `fetchCustomerHub` o `data.ts` afecta Customer Hub sencer i qualsevol accés indirecte des de leads/bookings/proposals.
- Canviar privacitat/export/DELETE afecta GDPR i dades reals; requereix tests focalitzats si es toca funcionalment.
- Canviar timeline pot degradar la lectura canònica d'activitat si es confonen logs tècnics amb esdeveniments comercials.
- El P1 visual/canònic de `TimelinePanel` queda resolt al Canvi #1116, `InsightsBanner` queda drenat al #1117, `BookingsPanel` al #1118, `PrivacyPanel` al #1119, `DiscountsPanel` al #1120, els residus `white/*` de `SummaryPanel` al #1121, `LeadsPanel` al #1126, `ProposalsPanel` al #1128, `MarginExtrasPanel` al #1130, `TasksNotesPanel` al #1131, `CommsPanel` al #1134, els inline styles de `CustomerHeader` al #1136, `ReactivationClient` al #1139, Referrals queda reauditat al #1760 perquè el codi viu contradiu part del #1140, i overlays de `ClientesModals` al #1141; el risc restant de Client 360 ja no és un panell dinàmic principal, sinó llista, satèl·lits i validació visual final del propietari.

Evidència d'auditoria:
- Fitxers llegits línia per línia: `page.tsx`, `CustomerHubClient.tsx`, `CustomerHeader.tsx`, `TimelinePanel.tsx`, `customer-hub.css`, `fetchCustomerHub.ts`, `data.ts`, `dto.ts`, `timeline.ts`.
- Imports/exports verificats: `page.tsx` → `CustomerHubClient`; `CustomerHubClient` → panells dinàmics + `TimelinePanel`; `CustomerHeader` → helpers workspace + `fetchWithCsrf`.
- Selectors CSS verificats contra DOM: carcassa `ch__root`, `ch__grid`, `ch__header`, `ch__tabs`, `ch__btn`, `ch__panel`, `ch__fab`; residu visual local queda documentat com a pendent.
- Serveis/APIs seguits: `fetchCustomerHub`, `customer-hub/data`, `timeline`, `/api/admin/customers/[id]`, `/hub`, `/status` i rutes filles de customers.
- Proves/guards previs del perímetre: `qa:no-dead-admin-views` verd i P1 registrat a `docs/audit/admin-fitxes.md`; validació final d'aquest tall queda al registre #1114.

Decisió de treball:
- Es conserva Customer Hub com a organisme viu i font central del client.
- Proper tall executable: si es continua dins Client 360, revisar només superfícies satèl·lit o deixar-lo per validació visual del propietari; no tocar `fetchCustomerHub`, DTOs, Prisma, rutes API, privacitat ni accions de negoci.
- No tocar en aquest tall: schema, serveis, contractes de dades, rutes mutadores, panells interns fora de timeline ni refeta visual global de Client 360.
- Validació pendent del propietari: visual final de Client 360 abans de marcar `TANCAT CHARLIE`.

### `/admin/leads/arxiu`

Pantalla: Arxiu de leads (historic)
Ruta: `/admin/leads/arxiu`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1037, claude, 2026-06-22)

Component viu: `page.tsx` → `ArxiuClient` (importat nomes pel seu page). + `loading.tsx`.
CSS viu: `app/admin/leads/arxiu/arxiu-design.css`.
APIs/serveis vius: loadArchiveList, loadArchiveStats.
Codi mort relacionat: cap.
Duplicacions: cap.
Hardcoded/residu visual: cap real (nomes comentaris amb numeros de canvi).
Connexions interrompudes: cap.

Decisio de treball: organ sa, cap canvi de codi. Pendent validacio visual del propietari.

### `/admin/leads/reengagement`

Pantalla: Re-engagement de leads
Ruta: `/admin/leads/reengagement`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1037, claude, 2026-06-22)

Component viu: `page.tsx` → `LeadReengagementClient` (importat nomes pel seu page). + `loading.tsx`.
CSS viu: `app/admin/leads/reengagement/reengagement.css`.
APIs/serveis vius: loadReengagementCandidates.
Codi mort relacionat: cap.
Duplicacions: cap.
Hardcoded/residu visual: cap real (deute menor: loading.tsx skeleton antic #850).
Connexions interrompudes: cap.

Decisio de treball: organ sa, cap canvi de codi. Pendent validacio visual del propietari.

### `/admin/cuadrant` + `/admin/cuadrant/repartiment` (òrgan Cuadrant)

Pantalla: Cuadrant operatiu (qui treballa, solapaments, disponibilitat) + Repartiment de pasta (qui cobra què).
Ruta: `/admin/cuadrant` · `/admin/cuadrant/repartiment`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1115, claude, 2026-06-24)

Historia: construit als #917-921 (commit f6f4a715, «bolo economia + cuadrant operatiu + repartiment») seguint `docs/cuadrant-repartiment-concept.md` (pla d'Opus, F0-F4). Tocat despres nomes pel canon carbo+or (#1105). Mai havia tingut fitxa forense → era PENDENT al registre tot i estar construit i operatiu.

Reachability: les 2 `page.tsx` son rutes Next reals; `CrewBlockManager` importat nomes per `cuadrant/page.tsx`; passa `qa:no-dead-admin-views`. Cap illa morta.

Component viu: `cuadrant/page.tsx` (server) → `CrewBlockManager` (client) + `loading.tsx` × 2. `repartiment/page.tsx` (server, sense client propi).
CSS viu: cap CSS de pagina propi — tot via classes canoniques (`ap-card`, `adm-input`, `adm-row-hover`, `admin-tone-*`, `ap-btn`) i utilitats. Correcte: l'organ no inventa CSS.
APIs/serveis vius: servei canonic `lib/services/crewScheduleService.ts` (purs `buildCrewSchedule`/`detectOverlaps`/`buildPayoutSummary` + loaders + CRUD `CrewBlock`, 23 tests). Rutes `GET /api/admin/cuadrant`, `GET /api/admin/cuadrant/repartiment`, `GET/POST/DELETE /api/admin/cuadrant/blocks` — totes amb `requireAuth`; els mutadors (POST/DELETE) amb `verifyCsrf`. El client usa `fetchWithCsrf`. Loaders GRACEFUL si la taula `crew_blocks` encara no existeix (try/catch → []).
Codi mort relacionat: cap.
Duplicacions: cap. El repartiment es FLUX DE CAIXA (costAmount real per linia), NO reimplementa marge — el marge segueix a `costEngine`. Monocapa de diners respectada (`formatCurrency` centralitzat).
Hardcoded/residu visual: dins canon. Les classes `admin-tone-*-cyan/info` estan NEUTRALITZADES a carbo (`--at-raised`/`--at-text`) des de #999/#1011 — no renderitzen blau; el punt de status `bg-[var(--o-info)]` es l'idioma compartit de tot l'admin (8 fitxers, inclos `app/admin/page.tsx` i el germa directe `calendario/capacity`), no un defecte de l'organ. Tocar-lo nomes aqui trencaria la hipersemblança amb els veins.
Cablejat amb organs veins: cada assignacio enllaça a la seva reserva (`buildBookingHref`) o lead (`buildLeadWorkspaceHref`); el repartiment enllaça al Partner Hub (`/admin/collaborators/[id]`); back-links cuadrant↔calendari↔repartiment coherents. Flux de context correcte.
Connexions interrompudes: cap.

Canvi de codi (#1115): unic residu objectiu corregit a `CrewBlockManager.tsx` — el boto d'accio «Afegir» era un boto a ma (border+bg+padding amb `admin-tone-*-info` i un `hover:admin-tone-bg-info` no-op que Tailwind no genera) → ara `.ap-btn ap-btn--primary ap-btn--xs` (regla canon #2: tot boto consumeix `.ap-btn`). El `hover:admin-tone-text-danger` no-op del boto «✕» → `transition-opacity hover:opacity-70` (hover real). Cap altre canvi: la resta de l'organ es canonic i hipersemblant amb `calendario/capacity`.

Validacio: tsc EXIT 0 · validate:core EXIT 0 (qa:admin-canon 0 troballes) · `crewScheduleService.test.ts` 23/23 · render 4 rutes (cuadrant/repartiment + params) × 3 breakpoints = 0 overflow, 0 runtime error · HTTP 200.

Decisio de treball: organ SA i ben cablejat. Fet el fix canonic del boto-accio; la resta es conserva. Pendent validacio visual del propietari.

### Òrgan Catàleg (`/admin/packs`, `/admin/pricing`, `/admin/inventory`, `/admin/catalog`, `/admin/cost-calculator`)

Pantalla: Catàleg — producte, cost, preu i inventari.
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1132, claude, 2026-06-24)

Reachability: tots els components vius i renderitzats. `packs/page` → PackPriceQuickEditor + SyncButton; `inventory/page` → InventoryListClient → InventoryListSections (import named multi-línia, NO mort — fals positiu inicial de grep d'una línia, confirmat per Grep complet); `cost-calculator/page` → CostCalculatorClient; `pricing/page` i `catalog/page` autocontinguts. Passa `qa:no-dead-admin-views`.
Component viu: les page.tsx + els clients citats + loading.tsx a cada ruta.
CSS viu: classes canòniques compartides (`.ap-*` via AdminPage — header amb eyebrow d'òrgan «Catàleg» auto del #1124, `.ap-section-title` display 18px del #1122). Cap CSS de pàgina propi divergent.
APIs/serveis vius: packAdminService, packPricingCheckService, packPricingHealth, inventoryAdminService, inventoryBundles, bookingInventoryService, extrasConfiguratorService, catalogPdfService. Tots consumits. Permisos API de packs resolts al #1800.
Codi mort relacionat: cap.
Duplicacions: cap (qa:no-canonical-reimpl verd; les fórmules de preu/marge viuen a costEngine/pricing-intelligence, no es reimplementen a la UI).
Hardcoded/residu visual: dins canon. Excepció LEGÍTIMA documentada: `MARGIN_TONES`/`PRICE` a `lib/constants/pricing-intelligence.ts` és un HEATMAP de 8 nivells de salut de marge (verd→vermell, `tone.hex`) aplicat via `style={{background/borderLeftColor: tone.hex}}` a `pricing/page`. És una visualització de domini centralitzada (monocapa), com els editors PDF — NO un residu a tokenitzar (8 stops graduals no caben a 3 admin-tone). `style={{width}}` de les barres de vida = runtime %. `text-white/X` = sistema sobre fons fosc.
Connexions interrompudes: cap. Packs↔pricing↔inventory↔cost-calculator coherents; packs enllaça a booking/extras.

Canvi de codi (#1132): netejat un ternari redundant a `InventoryListSections.tsx` (barres de vida, línies 416 i 532): `>40 success : >20 warning : >5 warning : danger` → `>40 success : >5 warning : danger` (la branca `>5 warning` era idèntica a `>20 warning` = morta; comportament idèntic: success>40, warning 5-40, danger<5).

Validacio: tsc EXIT 0 · validate:core EXIT 0 (qa:admin-canon 0) · render packs/pricing/inventory ja verificat (#1122-1124).

Decisio de treball: organ SA, ben cablejat i ja canònic (AdminPage). Fet el micro-fix del ternari mort; el heatmap de marge es conserva com a exempció de domini. Pendent validacio visual del propietari.

### `/admin/pricing`

Pantalla: Pricing — cockpit de preus, marges i ús del catàleg.
Ruta: `/admin/pricing`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1801, codex, 2026-07-09)

Història:
- El #1132 va auditar l'òrgan Catàleg sencer i va considerar legítim el heatmap de marge de `pricing-intelligence`.
- El #1799 va corregir la frontera de permisos de `/api/admin/pricing`.
- El #1801 baixa de l'òrgan general a la pantalla concreta: què edita, què només llegeix i què queda pendent abans de validar visualment.
- El #1802 saneja les icones locals de Pricing amb `lucide-react` i guard estàtic.
- El #1803 fa accessibles els estats inicials de loading/error (`role=status` i `role=alert`).
- El #1804 elimina l'estat local mort de tarifes editables i el copy "Aviat".

Reachability:
- `app/admin/pricing/page.tsx` és una ruta admin real i client component.
- `app/admin/pricing/loading.tsx` existeix com a loading state de ruta.
- `app/api/admin/pricing/route.ts` alimenta la pantalla amb `GET` i muta preus d'extres amb `PUT`.
- `lib/services/pricingAdminService.ts` concentra lectura i mutació de dades de Pricing.
- Playwright autenticat renderitza `/admin/pricing`, `/admin/pricing?tab=tarifes`, `?tab=extras`, `?tab=packs` i `?tab=inventory` en desktop 1440 i mòbil 390 sense errors de consola ni overflow horitzontal.

Component viu:
- `PricingAdminPage` carrega dades amb `fetchWithCsrf('/api/admin/pricing?locale=ca')`, abort de 15s i estat d'error/retry.
- Pestanyes: `overview`, `tarifes`, `extras`, `packs`, `inventory`, governades per `ADMIN_PRICING_TABS` i URL `?tab=`.
- Focus de salut: `?focus=zero-price` filtra extres a preu zero; `?focus=alert` filtra packs amb alerta.
- `overview` mostra ingressos totals, packs, extres, inventari, top extres i top packs.
- `tarifes` mostra constants de preu/hora i amortització (`SERVICE_HOURLY_RATES`, `EQUIPMENT_AMORTIZATION`, `MARGIN_TONES`).
- `extras` és l'única zona editable: click al preu, input numèric i `savePrice(extra.id)`.
- `packs` és només lectura i deriva l'edició cap a `/admin/packs`.
- `inventory` és estadística d'ús i deriva l'edició cap a `/admin/inventory`.

APIs/serveis vius:
- `GET /api/admin/pricing`: `requireAuth`, `requirePermission(req, 'read')`, `getPricingAdminData(locale)`.
- `PUT /api/admin/pricing`: `requireAuth`, `requirePermission(req, 'mutate')`, `verifyCsrf`, valida `extraId` i `price`, crida `updateExtraPrice()`.
- `pricingAdminService` llegeix `Extra`, `Pack`, `InventoryItem`, `Booking` i relacions de traducció/inventari.
- `updateExtraPrice()` escriu `Extra.price` i registra `adminLog` (`entity=extra`, `action=UPDATE`).

Dades que governa:
- Govern directe: preu dels `Extra` del catàleg.
- Lectura contextual: packs, inventari, vendes recents, ingressos totals i ús d'equip.
- Constants canòniques: tarifes i llindars de marge a `lib/constants/pricing-intelligence.ts`; categories d'inventari a constants compartides.
- No governa model financer de packs d'Economia ni configuració `pricing.pack.modelConfig`.

Accions que governa:
- Revisar salut comercial del catàleg.
- Editar preus d'extres per a noves reserves.
- Detectar extres sense cost definit, packs amb alerta o inventari infrautilitzat.
- Navegar cap a `/admin/packs` o `/admin/inventory` quan l'edició no pertany a Pricing.

Òrgans veïns:
- upstream: Packs, Inventari, Extres, Reserves i dades de vendes.
- downstream: pressupostos, nova reserva, dossiers/catàleg i Economia quan audita marge.
- relació amb Economia: Pricing governa PVP i catàleg; Economia governa caixa, marge global, CAC i model de packs.
- relació amb Packs: Pricing mostra packs només lectura; `/admin/packs` és el workspace editor.

Codi mort / residu:
- No s'ha detectat arrel morta de ruta o servei.
- P2 tècnic: `pricingConfig`, `setPricingConfig`, `savingConfig` i `setSavingConfig` queden com estat parcial per a tarifes editables futures; avui només `pricingConfig` es llegeix com override local buit i no hi ha persistència.
- Resolt #1803: loading inicial anuncia `role="status"` i error inicial anuncia `role="alert"` amb `aria-live="assertive"`; els missatges de mutació ja mantenen `role=status/alert`.

Duplicacions:
- No reimplementa el motor de marge; consumeix constants i serveis compartits.
- El heatmap amb `tone.hex` continua documentat com a visualització de domini centralitzada, no com a hardcode local.
- Les dades de packs/inventari són lectura agregada, no un segon editor.

Hardcoded/residu visual:
- Resolt #1802: `ADMIN_PRICING_TABS` ja porta claus d'icona (`chart/target/sparkles/package/wrench`) i `PricingAdminPage` les mapa a `lucide-react`.
- Resolt #1802: KPIs, avisos, capçaleres, badges de lectura i microaccions locals ja renderitzen `lucide-react` en lloc d'emoji/text symbols.
- P2 responsive/densitat: mòbil no té overflow horitzontal, però `packs` i sobretot `inventory` generen una columna molt llarga i densa; usable, no Zenit.
- Les icones de categories d'inventari visibles a `inventory` venen del catàleg compartit (`INVENTORY_CATEGORY_OPTIONS`/`getInventoryCategoryDisplay`); no es tracten com a residu local de Pricing en aquest tall.
- Excepció legítima: `MARGIN_TONES` amb `style={{ background/borderLeftColor/color: tone.hex }}` és heatmap canònic de salut de marge.

Connexions interrompudes:
- Resolt #1799: permisos de lectura/mutació de `/api/admin/pricing`.
- No hi ha connexió trencada greu en el flux visible: editar extra actualitza `Extra.price` i recarrega dades.
- Resolt #1804: eliminat l'estat local mort `pricingConfig`/`savingConfig`; tarifes llegeixen directament `SERVICE_HOURLY_RATES`.

Riscos:
- Tocar `Extra.price` impacta noves reserves i pressupostos; no és una preferència visual.
- Convertir tarifes en editables sense servei/persistència compartida crearia una segona font de veritat.
- Substituir el heatmap per tokens plans faria perdre lectura gradual de salut de marge.

Evidència d'auditoria:
- fitxers llegits: `app/admin/pricing/page.tsx`, `app/api/admin/pricing/route.ts`, `lib/services/pricingAdminService.ts`, `lib/constants/admin.ts`.
- registre revisat: `docs/admin-inventari-pagines.md`, `docs/admin-fitxes-pantalles.md`, `docs/admin-protocol.md`, `docs/agent-sync.md`.
- captures Playwright autenticades: `.codex-captures/pricing-1801/desktop-overview.png`, `desktop-tarifes.png`, `desktop-extras.png`, `desktop-packs.png`, `desktop-inventory.png`, `mobile-overview.png`, `mobile-tarifes.png`, `mobile-extras.png`, `mobile-packs.png`, `mobile-inventory.png`.
- captures Playwright post-saneig d'icones: `.codex-captures/pricing-1802/desktop-overview.png`, `desktop-tarifes.png`, `desktop-extras.png`, `desktop-packs.png`, `desktop-inventory.png`, `mobile-overview.png`, `mobile-tarifes.png`, `mobile-extras.png`, `mobile-packs.png`, `mobile-inventory.png`.
- captures Playwright post-neteja tarifes: `.codex-captures/pricing-1804/desktop-tarifes.png`, `mobile-tarifes.png`.
- mètriques de captura: desktop i mòbil `overflowX=false`; consola sense errors.
- proves/guards del tall documental i visual: `qa:no-dead-admin-views`, `pricing/icon-contract.test.ts`, `pricing/feedback-a11y.test.ts`, `pricing/tariff-source-contract.test.ts`, `tsc`, `qa:protocol`, `git diff --check`.

Decisio de treball:
- conservar `/admin/pricing` com a cockpit de PVP/extres i lectura de salut del catàleg.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que passi, com a mínim, revisió de densitat mòbil.
- proper tall recomanat: compactar `inventory` mòbil sense tocar càlculs ni categories compartides.

### `/admin/packs`

Pantalla: Packs — llista, salut de preu i editor ràpid de PVP.
Ruta: `/admin/packs`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1805, codex, 2026-07-09)

Història:
- El #1132 va auditar l'òrgan Catàleg sencer.
- El #1800 va corregir permisos de `/api/admin/packs`, `/api/admin/packs/[id]` i `/api/admin/packs/sync`.
- El #1805 baixa a la ruta concreta `/admin/packs`; no tanca `/admin/packs/[id]`, `/admin/packs/new` ni `/admin/packs/extras`.
- El #1806 fa accessible `PackPriceQuickEditor` amb labels reals i feedback anunciat.
- El #1807 substitueix les icones locals de la llista i `SyncButton` per `lucide-react`.
- El #1808 baixa a la ruta concreta `/admin/packs/[id]`; la llista continua FETA però el detall ja queda mapat com a editor complet de pack.

Reachability:
- `app/admin/packs/page.tsx` és ruta server dinàmica (`force-dynamic`).
- `app/admin/packs/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- Components vius directes: `SyncButton` i `PackPriceQuickEditor`.
- APIs vives relacionades: `/api/admin/packs`, `/api/admin/packs/[id]`, `/api/admin/packs/sync`.
- Playwright autenticat renderitza `/admin/packs` i `/admin/packs?focus=alert` en desktop 1440 i mòbil 390 sense errors de consola ni overflow horitzontal.

Component viu:
- `getPacks()` llegeix `Pack`, `translations`, `inventory.item` i `_count.bookings`, i afegeix `leadsCount` via `Lead.groupBy(interestedPackId)`.
- La page carrega `getPackPricingModelConfig()`, `getAllPacks()` i `computePackPricingHealth()` per pack.
- Focus suportats: `alert`, `critical-margin`, `missing-capacity`, `partial-cost`, `without-inventory`.
- Agrupa packs per `PACK_SERVICE_OPTIONS` i deixa `otherPacks` per serveis fora de catàleg.
- Cada card mostra PVP, recomanat, editor ràpid de pack/hora extra, semàfors, cost laboral, IRPF, operari extra, atributs, conversió, equip i accions.
- `SyncButton` confirma abans de sincronitzar config→BD.
- `PackPriceQuickEditor` muta `price` i `extraHourPrice` via PATCH i refresca la ruta.

APIs/serveis vius:
- `GET /api/admin/packs`: `read`, `listAdminPacks(locale, includeInactive)`.
- `POST /api/admin/packs`: `mutate` + CSRF, `createAdminPack()`.
- `GET /api/admin/packs/[id]`: `read`, `getAdminPackById()`.
- `PATCH /api/admin/packs/[id]`: `mutate` + CSRF, `updateAdminPack()`.
- `POST /api/admin/packs/sync`: `mutate` + CSRF, `syncAdminPacksFromConfig()`.
- `packAdminService`: normalitza PVP amb `roundRecommendedSellingPrice`, completa traduccions i escriu `adminLog`.
- `packPricingHealth`: llegeix settings `pricing.pack.*`, calcula recomanats, divergències i alertes.

Dades que governa:
- Govern directe: `Pack.price`, `Pack.extraHourPrice`, metadata de pack, traduccions i inventari del pack quan es passa pel detall/API.
- Lectura contextual: `Booking._count`, leads interessats, inventari vinculat, purchase price i vida útil.
- Config de model: `Setting(pricing.pack.*)` gestionat principalment des d'Economia/config, consumit aquí per recomanar preus.
- Config seed: `config/packs-config` via `getAllPacks()` i sync.

Accions que governa:
- Sincronitzar packs config→BD.
- Crear pack (`/admin/packs/new`).
- Editar PVP i hora extra directament des de la llista.
- Obrir detall del pack o l'edició d'equip.
- Filtrar per focus de salut.

Òrgans veïns:
- upstream: config de packs, Inventari, settings de model de preu, leads i reserves.
- downstream: Pricing, Economia, nova reserva, pressupostos/dossiers i salut del catàleg.
- relació amb Pricing: Pricing mostra packs només lectura; Packs és l'editor real de PVP.
- relació amb Economia: Economia governa el model de marge/hores; Packs l'aplica a PVP concret.

Codi mort / residu:
- No s'ha detectat ruta morta.
- Duplicació JSX clara: la card de pack està duplicada per grups de servei i `otherPacks`. Qualsevol saneig visual hauria d'extreure un component `PackCard`.
- Resolt #1806: `PackPriceQuickEditor` usa `<label htmlFor>`/`id` per als inputs de PVP i anuncia feedback amb `role=status/alert`.

Duplicacions:
- No duplica càlcul de pricing core: consumeix `computePackPricingHealth()`.
- Sí duplica presentació de card dins la mateixa page; és deute de mantenibilitat/UI, no de negoci.
- `renderPackInventoryPreview()` és helper local legítim de presentació, no una segona font d'inventari.

Hardcoded/residu visual:
- Resolt #1807: icones locals de la llista i `SyncButton` renderitzen `lucide-react` en lloc d'emoji/text symbols (`ℹ️`, `🔄`, `⭐`, `🎵`, `🔊`, `🌫️`, `🎤`, `👥`, `✏️`, `📦`, `✓`, `✗`).
- P2 densitat: mòbil renderitza una columna de 14.353px en vista completa i 12.327px en focus alert; usable però lluny de Zenit.
- P2 copy: algunes labels mantenen castellà en dades (`Básico`, `Premium`) perquè venen de traduccions/seed; no s'ha tocat en aquest tall.
- Les classes semàntiques de to (`admin-tone-*`) i `MARGIN_TONES`/pricing health es conserven com a domini.

Connexions interrompudes:
- Resolt #1800: permisos API de Packs.
- No s'ha vist error runtime ni overflow horitzontal.
- Risc de UX: sync config→BD mostra resultat amb `role=status/alert`, però el botó i stats encara porten símbols textuals.

Riscos:
- `PackPriceQuickEditor` canvia PVP real i hora extra de packs; impacta venda, pressupostos, booking i dossier.
- `syncAdminPacksFromConfig()` pot crear/actualitzar múltiples packs; no és acció decorativa.
- Ajustar el model `pricing.pack.*` des d'Economia canvia recomanats i alertes que aquesta pantalla mostra.
- Sanejar visualment la card sense extreure component pot duplicar errors a dos blocs.

Evidència d'auditoria:
- fitxers llegits: `app/admin/packs/page.tsx`, `PackPriceQuickEditor.tsx`, `SyncButton.tsx`, `loading.tsx`, `app/api/admin/packs/route.ts`, `app/api/admin/packs/[id]/route.ts`, `app/api/admin/packs/sync/route.ts`, `lib/services/packAdminService.ts`, `lib/services/packPricingHealth.ts`.
- captures Playwright autenticades: `.codex-captures/packs-1805/desktop-all.png`, `desktop-alert.png`, `mobile-all.png`, `mobile-alert.png`.
- captures Playwright post-a11y editor ràpid: `.codex-captures/packs-1806/desktop-all.png`, `mobile-all.png`.
- captures Playwright post-icones: `.codex-captures/packs-1807/desktop-all.png`, `mobile-all.png`.
- mètriques de captura: `overflowX=false`; consola sense errors; scroll mobile complet 14.353px i focus alert 12.327px.
- proves/guards del tall documental: `qa:no-dead-admin-views`, `packs/quick-editor-a11y.test.ts`, `packs/icon-contract.test.ts`, `tsc`, `qa:protocol`, `git diff --check`.

Decisio de treball:
- conservar `/admin/packs` com a editor de PVP i salut de packs; no fusionar-lo amb Pricing ni Economia.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que es resolgui, com a mínim, densitat/card duplicada.
- proper tall recomanat: extracció `PackCard` i compactació de la lectura mòbil sense tocar pricing core.

### `/admin/packs/[id]`

Pantalla: Pack detall — editor complet de pack, equip, textos i publicació.
Ruta: `/admin/packs/[id]`
Estat inventari: 🔴 (fitxa FETA, visual/a11y pendent)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1808, codex, 2026-07-09)

Història:
- El #1800 va corregir permisos de `/api/admin/packs/[id]`: `GET` amb `read`, `PATCH` amb `mutate` + CSRF abans de tocar params/body/servei.
- El detall ja havia rebut talls previs de pricing recomanat i format premium; la foto viva del #1808 és la que mana per a qualsevol tall nou.
- El #1808 documenta el detall com a superfície diferent de `/admin/packs`: aquí no només es veu salut, es poden mutar pack, inventari, traduccions i estat de publicació.
- El #1809 resol el P1 de navegació: `/admin/packs/[id]?tab=content` obre directament la pestanya d'inventari.
- El #1810 substitueix emojis de tabs del detall per claus d'icona i `lucide-react`.
- El #1811 anuncia `error/info/success` globals del formulari amb `role=alert/status` i `aria-live`.
- El #1812 afegeix labels reals als controls econòmics principals i `aria-label` als botons d'hores DJ.
- El #1813 afegeix labels no visuals als controls de Content: cerca, slug, servei i quantitats d'inventari.
- El #1814 afegeix labels no visuals a Textos/Publicació i estabilitza `tabParam` perquè clicar tabs manuals no reboti a Economia.

Reachability:
- `app/admin/packs/[id]/page.tsx` és ruta server real (`force-dynamic`).
- `app/admin/packs/page.tsx` enllaça a `Editar` i `Equip` per cada pack; `Equip` construeix `/admin/packs/[id]?tab=content`.
- `app/admin/packs/[id]/page.tsx` carrega pack, inventari complet i reserves associades abans de renderitzar `EditPackForm`.
- `app/admin/packs/[id]/EditPackForm.tsx` és el client viu de l'editor.
- Playwright autenticat renderitza el pack real `cmmhz705w0007gxdq9vnv371m` en desktop 1440 i mòbil 390 sense errors de consola ni overflow horitzontal.

Component viu:
- `getPack(id)` llegeix `Pack`, traduccions i inventari vinculat amb dades de `InventoryItem`.
- `getInventoryItems()` carrega inventari complet ordenat per status/categoria/nom per poder compondre el pack.
- `getPackBookings(packId)` mostra fins a 20 reserves associades quan n'hi ha.
- `getPackPricingModelConfig()` + `computePackPricingHealth()` alimenten el recomanat inicial.
- `EditPackForm` governa quatre pestanyes: `economic`, `content`, `texts`, `publish`.
- `economic`: recomanats, semàfors, preu automàtic, PVP pack, PVP hora extra i composició visual.
- `content`: compositor automàtic BASE/PRO, lots reutilitzables, drag/drop d'inventari, quantitat i obligatorietat.
- `texts`: nom/tagline/descripció/features per `SUPPORTED_LOCALES`.
- `publish`: actiu, destacat i ordre.
- Submit: valida pack no buit i preus > 0, fa `PATCH /api/admin/packs/${pack.id}`, refresca i torna a `/admin/packs`.

APIs/serveis vius:
- `GET /api/admin/packs/[id]`: `read`, `getAdminPackById()`.
- `PATCH /api/admin/packs/[id]`: `mutate` + CSRF, `updateAdminPack()`.
- `GET /api/admin/inventory/bundles`: carrega lots reutilitzables dins el client; els errors es mostren amb `role=alert`.
- `packAdminService`: valida, normalitza PVP i escriu pack/traduccions/inventari/adminLog.
- `packPricingHealth`: recomanat server inicial; el client recalcula recomanat local quan canvien inventari/hores/watts/convidats.

Dades que governa:
- `Pack.slug`, `service`, `price`, `originalPrice`, `extraHourPrice`, `djHours`, `soundWatts`, `includesFog`, `includesMic`, `minGuests`, `maxGuests`, `isActive`, `isFeatured`, `order`.
- `PackTranslation`: name, tagline, description i features per idioma.
- `PackInventory`: `itemId`, `quantity`, `isRequired`.
- Lectura contextual: inventari amb preu de compra i vida útil, lots d'equip i reserves que usen el pack.

Accions que governa:
- Ajustar PVP i hora extra del pack complet.
- Recompondre inventari manualment, per lots o amb compositor.
- Editar textos multidioma del pack.
- Activar/desactivar, destacar i ordenar.
- Navegar a reserves associades.

Òrgans veïns:
- upstream: `/admin/packs`, Inventari, lots d'equip, Economia/config de model de preus.
- downstream: Pricing, pressupostos, dossiers, nova reserva, reserves existents i salut del catàleg.
- relació amb `/admin/packs`: la llista és triatge i quick edit; el detall és l'editor complet.
- relació amb Inventari: el detall no crea inventari; només selecciona i quantifica peces existents.
- relació amb Economia: el detall consumeix el model de cost/marge, no l'ha de governar.

Codi mort / residu:
- No s'ha detectat ruta morta ni component orfe en el perímetre del detall.
- Resolt #1809: el link `Equip` de `/admin/packs` envia `?tab=content` i `EditPackForm` llegeix el query per arrencar a `content`.
- P2 de drift: el recomanat local viu dins `EditPackForm`; qualsevol canvi del model de pricing ha de validar servidor i client alhora.
- Resolt #1812: els inputs econòmics principals tenen labels reals (`maxGuests`, `soundWatts`, PVP pack, PVP hora extra) i els botons d'hores DJ tenen `aria-label`.
- Resolt #1813: els camps de `content` principals tenen labels (`search`, `slug`, `service` i quantitats d'inventari).
- Resolt #1814: camps de `texts` i `publish` tenen labels (`name`, `tagline`, `description`, `features`, `order`).

Duplicacions:
- El detall no duplica la llista: edita inventari/textos/publicació que la llista no governa.
- Sí duplica part de la lectura econòmica de salut del pack, però aquí és necessària perquè l'operador veu l'impacte dels canvis abans de desar.
- Resolt #1810: el patró de tab/icon del detall passa a claus semàntiques (`banknote`, `sliders`, `languages`, `check`) i render `lucide-react`.

Hardcoded/residu visual:
- Resolt #1810: `ADMIN_PACK_EDITOR_TABS` ja no porta emoji; els tabs renderitzen 4 SVG Lucide amb text net.
- Resolt #1811: feedback general `error/info/success` del formulari té `role=alert/status` i `aria-live`; l'error de lots ja ho tenia.
- Resolt #1812: la pestanya Economia ja exposa labels reals als camps de decisió econòmica.
- Resolt #1813: Content afegeix labels no visuals sense canviar la graella.
- Resolt #1814: Textos/Publicació afegeixen labels no visuals i el canvi manual de tab queda estable amb `tabParam`.
- Cards dins cards i formulari llarg: usable, però encara té aparença de tauler tècnic més que workspace Zenit.
- Mobile 390: sense overflow, però `economic` fa 3.627px i `content` 3.971px; lectura correcta, densitat alta.

Connexions interrompudes:
- Resolt #1809: l'acció `Equip` obre directament la pestanya d'inventari mitjançant `?tab=content`.
- L'acció `Preu automàtic ON` pot modificar valors del formulari en memòria abans de desar; no persisteix sola, però pot sorprendre si l'operador no l'entén.

Riscos:
- `PATCH /api/admin/packs/[id]` impacta preus visibles, pressupostos, dossiers, reserves noves i salut de Pricing/Economia.
- Canviar inventari del pack altera cost/hora recomanat i percepció del producte comercial.
- Canviar textos multidioma impacta web/catàleg/dossiers segons consumidors.
- No tocar schema, API, motor de pricing ni dades manuals en un tall visual; qualsevol canvi aquí necessita test focalitzat i captura.

Evidència d'auditoria:
- fitxers llegits: `app/admin/packs/[id]/page.tsx`, `app/admin/packs/[id]/EditPackForm.tsx`, `lib/constants/admin.ts`, tests existents de packs detail i bundles.
- captures Playwright autenticades: `.codex-captures/packs-detail-1808/desktop-economic.png`, `desktop-content.png`, `desktop-texts.png`, `desktop-publish.png`, `mobile-economic.png`, `mobile-content.png`.
- captures Playwright post-fix de pestanya: `.codex-captures/packs-detail-1809/desktop-content-query.png`, `mobile-content-query.png`.
- captures Playwright post-icones: `.codex-captures/packs-detail-1810/desktop-economic.png`, `desktop-content.png`, `mobile-content.png`.
- captures Playwright post-labels economia: `.codex-captures/packs-detail-1812/desktop-economic.png`, `mobile-economic.png`.
- captures Playwright post-labels content: `.codex-captures/packs-detail-1813/desktop-content.png`, `mobile-content.png`.
- captures Playwright post-labels textos/publicació: `.codex-captures/packs-detail-1814/desktop-texts.png`, `desktop-publish.png`.
- mètriques de captura: overflowX 0 a totes les captures; consola sense errors; desktop scroll 900-2025px; mobile 3627-3971px.
- evidència de connexió #1809: `/admin/packs/cmmhz705w0007gxdq9vnv371m?tab=content` renderitza `Contingut` actiu, `Inventari del pack` visible, `Economia i semàfors` absent, overflowX 0 i consola neta.
- evidència d'icones #1810: els tabs exposen textos `Economia/Contingut/Textos/Publicació`, 4 SVG renderitzats i overflowX 0; en mòbil apareix una warning preexistent de Next Image del logo global, sense error JS.
- evidència labels #1812: 4 `label[for]` econòmics i 2 `aria-label` als steppers; overflowX 0.
- evidència labels #1813: 15 labels Content detectats al DOM, `Contingut` actiu, overflowX 0 i consola neta.
- evidència labels #1814: `Textos` actiu amb 12 labels, `Publicació` actiu amb label d'ordre, overflowX 0; warning preexistent del logo global en captura desktop, sense error JS.

Decisio de treball:
- conservar `/admin/packs/[id]` com a editor complet del pack i no fusionar-lo amb Pricing/Economia.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visual/densitat del detall complet.
- proper tall recomanat: revisar densitat/jerarquia de Textos/Publicació i card nesting, sense tocar preus, inventari ni API.

### `/admin/packs/new`

Pantalla: Nou pack — creador inicial de pack base.
Ruta: `/admin/packs/new`
Estat inventari: 🔴 (fitxa FETA, saneig visual/a11y pendent)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1816, codex, 2026-07-09)

Història:
- La ruta existeix com a entrada prima de creació abans de l'editor complet de pack; no pretén substituir `/admin/packs/[id]`.
- Commits recents rellevants: `3b93a004` migra el `page.tsx` a `AdminPage`; `893ab84c`, `cf3932cc`, `0705a637` i `5d431c10` passen el formulari per la canonització admin; `816c85a1` introdueix CSRF a fluxos admin.
- Història de servei/API: `d5e1f13f` completa traduccions CA/ES/EN en create/update; #1642 normalitza PVP i hora extra acabats en 0 dins `createAdminPack`; #1800 alinea permisos de `/api/admin/packs`.
- #641 migra el CTA post-creació a `buildPackHref()` també dins `NewPackForm`.

Reachability:
- `app/admin/packs/new/page.tsx` és ruta server real (`force-dynamic`) i renderitza `AdminPage title="Nou pack"` amb backlink a `/admin/packs`.
- `app/admin/packs/page.tsx` enllaça a `/admin/packs/new` des del CTA de creació.
- `app/admin/catalog/page.tsx` també enllaça a `/admin/packs/new`.
- `app/admin/packs/new/NewPackForm.tsx` és l'únic client component propi de la ruta.
- `app/admin/packs/new/loading.tsx` reutilitza `AdminLoadingSkeletonDetail`.
- Playwright autenticat renderitza `/admin/packs/new` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal.

Component viu:
- `NewPackForm` governa un formulari curt amb `slug`, `nameCa`, `service`, `price` i `djHours`.
- Submit: `fetchWithCsrf('/api/admin/packs', { method:'POST' })`, payload amb slug normalitzat a lowercase, servei, PVP, hores DJ i traducció CA mínima.
- Èxit: espera `data.pack.id` i redirigeix amb `router.push(buildPackHref(data.pack.id))`.
- Error: queda centralitzat a `useAsyncForm`, però es pinta com a `<p>` visual sense `role`/`aria-live`.

APIs/serveis vius:
- `POST /api/admin/packs`: `requireAuth` + `requirePermission(req, 'mutate')` + `verifyCsrf(req)` abans de `req.json()` i `createAdminPack()`.
- `createAdminPack()`: valida `slug`, `price` i `djHours`; completa traduccions per `SUPPORTED_LOCALES`; normalitza PVP/hora extra amb `roundRecommendedSellingPrice()`; escriu `Pack` + `PackTranslation`; crea `adminLog`.
- Tests existents: `__tests__/app/api/admin/packs-route.test.ts` cobreix auth/permís/CSRF/POST; `__tests__/lib/services/packAdminService.test.ts` cobreix validació mínima i arrodoniment de PVP/hora extra.

Dades que governa:
- Crea un `Pack` nou amb `slug`, `service`, `price`, `djHours`, defaults de `soundWatts/includesFog/includesMic` i traduccions.
- No governa inventari, textos multidioma complets, ordre, destacat, actiu/inactiu ni publicació fina: això passa pel detall `/admin/packs/[id]`.

Accions que governa:
- Crear el pack base.
- Cancel·lar i tornar a `/admin/packs`.
- Redirigir l'operador al detall del pack acabat de crear.

Òrgans veïns:
- upstream: `/admin/packs` i `/admin/catalog`.
- downstream: `/admin/packs/[id]` per completar inventari/textos/economia/publicació.
- relació amb Pricing/Economia: aquesta ruta no calcula salut ni recomanats; el servei normalitza PVP i el detall/llista mostren la salut després.

Codi mort / residu:
- No s'ha detectat ruta morta ni component orfe dins el perímetre.
- El formulari és deliberadament mínim; si es vol editor complet, la font és `/admin/packs/[id]`.

Duplicacions:
- Resolt #1817: el select de serveis consumeix `PACK_SERVICE_OPTIONS`, la mateixa font usada per `/admin/packs`, i deixa d'inventar opcions locals.
- No duplica la creació de pack: passa per `POST /api/admin/packs` i `createAdminPack()`.

Hardcoded/residu visual:
- Labels principals tenen `htmlFor/id`, herència d'una passada antiga.
- Resolt #1817: l'error visible anuncia `role=alert` + `aria-live=assertive`.
- Resolt #1817: `Crear pack` usa `ap-btn ap-btn--primary` i `Cancel·lar` usa `ap-btn ap-btn--secondary`.
- Resolt #1817: `price` arrenca buit i el camp exigeix `min={1}`/`step={1}`, coherent amb el servei que rebutja `!price`.
- P2 densitat: desktop queda funcional però amb una caixa molt ampla i molt aire buit; mòbil és usable i compacte.

Connexions interrompudes:
- Cap tall runtime detectat: render 200, shell present, sense overflow, sense asset/request fallida.
- Connexió incompleta de workflow: després de crear, el pack encara necessita detall per inventari/textos/publicació; això és correcte, però la pantalla ha de continuar explicant-se com a "pack base".

Riscos:
- `POST /api/admin/packs` crea dades comercials reals; un PVP o servei incorrecte impacta catàleg, dossiers, pressupostos i reserves noves.
- Canviar defaults (`soundWatts`, `includesFog`, `extraHourPrice`) dins el servei afecta tot pack nou; no tocar en un tall visual.
- Mantenir serveis locals al select pot divergir del catàleg compartit si `PACK_SERVICE_OPTIONS` canvia.

Evidència d'auditoria:
- fitxers llegits: `app/admin/packs/new/page.tsx`, `app/admin/packs/new/NewPackForm.tsx`, `app/admin/packs/new/loading.tsx`, `app/api/admin/packs/route.ts`, `lib/services/packAdminService.ts`, `lib/constants/index.ts`.
- imports/exports verificats: `page.tsx` -> `NewPackForm`; `NewPackForm` -> `fetchWithCsrf`, `useAsyncForm`, `buildPackHref`; route API -> `createAdminPack`.
- serveis/APIs seguits: `POST /api/admin/packs` -> `createAdminPack()` -> Prisma `pack.create` + `adminLog.create`.
- captures Playwright autenticades: `.codex-captures/packs-new-1816/screenshots/001__admin-packs-new__desktop.png` i `.codex-captures/packs-new-1816/screenshots/002__admin-packs-new__mobile.png`.
- captures post-saneig #1817: `.codex-captures/packs-new-1817/screenshots/001__admin-packs-new__desktop.png` i `.codex-captures/packs-new-1817/screenshots/002__admin-packs-new__mobile.png`.
- mètriques de captura: desktop 200, mobile 200, `adminShell=true`, `horizontalOverflow=false`, `consoleErrors=[]`, `pageErrors=[]`, `failedRequests=[]`, `failedAssets=[]`; mobile `scrollHeight=981`.
- proves/guards executats en el tall documental: `audit:visual:admin` per `/admin/packs/new`; `qa:no-dead-admin-views` OK; `npx tsc --noEmit --pretty false` OK; `qa:protocol` OK; `git diff --check` OK amb avisos CRLF aliens.
- proves #1817: `new-form-contract.test.ts` OK; `qa:no-dead-admin-views` OK; `npx tsc --noEmit --pretty false` OK; `audit:visual:admin` focalitzat OK; `qa:protocol` OK; `git diff --check` OK amb avisos CRLF aliens.

Decisio de treball:
- conservar `/admin/packs/new` com a creador inicial de pack base i no convertir-lo en editor complet.
- no marcar `🟢` ni `TANCAT CHARLIE`: el saneig funcional de formulari queda resolt #1817, però la pantalla encara és visualment molt mínima en desktop i necessita validació humana.
- proper tall recomanat: compactar/redistribuir l'aire buit del desktop si el propietari vol portar aquest creador a nivell Zenit; no tocar API, servei ni defaults.

### `/admin/packs/extras`

Pantalla: Extres de packs — configurador admin dels extres del configurador públic/reserva.
Ruta: `/admin/packs/extras`
Estat inventari: 🔴 (fitxa FETA, claus i18n #1820 i feedback/botons #1821 resolts; visual/densitat pendent)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1818, codex, 2026-07-09)

Història:
- La ruta neix com a editor de `extras.configurator` per al configurador d'extres, amb `AdminPage` i client propi.
- `76f0dcea` introdueix admin extras config; `816c85a1` afegeix CSRF general; #1042 saneja `PUT /api/admin/extras` perquè validi CSRF abans de llegir body.
- Migracions visuals posteriors (`5d431c10`, `d9332ff0`, `0705a637`, `893ab84c`) li han aplicat parts del canon admin, però no una revisió específica de pantalla.
- El #843 ja havia detectat a Nova reserva que `/api/admin/extras` podia servir claus i18n crues; aquesta fitxa confirma que el problema viu també a l'origen admin.

Reachability:
- `app/admin/packs/extras/page.tsx` és ruta server real i renderitza `AdminPage title="Extres"` amb backlink a `/admin/packs`.
- `app/admin/catalog/page.tsx` enllaça a `/admin/packs/extras` des de la pestanya d'extres del catàleg.
- `app/admin/bookings/BookingPackExtrasSection.tsx` enllaça `Gestionar extres` a `/admin/packs/extras`.
- `app/admin/packs/extras/ExtrasConfiguratorClient.tsx` és el client viu.
- `app/admin/packs/extras/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- Playwright autenticat renderitza `/admin/packs/extras` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal.

Component viu:
- `ExtrasConfiguratorClient` carrega `GET /api/admin/extras` amb `fetchWithCsrf('/api/admin/extras', { cache:'no-store' })`.
- Estat viu: `extras`, `loading`, `saving`, `error`, `isDefault`.
- Permet afegir extra local (`defaultExtra()`), editar id, icona, nom, categoria, descripció, preu, `consultarPrecio`, `popular`, `premium` i compatibilitat per família.
- `handleSave()` envia `PUT /api/admin/extras` amb `{ config: extras }` i CSRF.

APIs/serveis vius:
- Resolt #1819: `GET /api/admin/extras` exigeix `requireAuth()` + `requirePermission(req, 'read')` abans de `getExtrasConfiguratorConfig()`.
- Resolt #1819: `PUT /api/admin/extras` exigeix `requireAuth()` + `requirePermission(req, 'mutate')` + `verifyCsrf()` abans de body array i `saveExtrasConfiguratorConfig()`.
- `extrasConfiguratorService`: llegeix/escriu `Setting(key='extras.configurator')`; si no hi ha setting o JSON és invàlid, torna fallback de `EXTRAS`.
- Resolt #1820: `extrasConfiguratorService` usa `resolvePublicExtraDefinition(..., 'ca')` per convertir claus `services.mobile...` de `name`/`description` a labels admin humans abans de retornar o desar configuració.
- Resolt #1820: `PUBLIC_EXTRA_REGISTRY` incorpora `wireless-microphone` amb alias `micro-inalambric`, categoria `sound`, icona i traduccions ca/es/en.
- `sanitizeExtrasConfig()` filtra extres sense `id` o `name`, normalitza text, booleans, categoria i `enabled`; només resol camps que ja tenen valor, per no ressuscitar extres incomplets.
- Tests existents: `__tests__/app/api/admin/extras-route.test.ts` cobreix auth/CSRF/body; `__tests__/lib/services/extrasConfiguratorService.test.ts` cobreix default, sanitize, JSON invàlid i upsert.

Dades que governa:
- `Setting.extras.configurator` amb llista d'`ExtraDefinition`.
- No governa directament el model Prisma `Extra`; aquest model és llegit per `publicExtrasService` quan hi ha extres de BD.
- Governa dades consumides per configurador públic, nova reserva, pressupostos/PDF i booking pricing segons el camí que carregui extres.

Accions que governa:
- Afegir un extra nou.
- Editar camps comercials i compatibilitat per servei.
- Desar la configuració completa.
- Eliminar un extra de la llista abans de desar.

Òrgans veïns:
- upstream: `EXTRAS` de `app/config/packs-config.ts` com a fallback i `PUBLIC_EXTRA_REGISTRY_BY_SLUG` al servei públic.
- downstream: configurador públic, `/admin/bookings/new`, `/admin/bookings/[id]`, `/admin/pricing`, pressupostos i PDFs que mostren extres.
- relació amb `/admin/packs`: és subpantalla de catàleg; no edita packs ni inventari.

Codi mort / residu:
- No s'ha detectat ruta morta ni client orfe.
- Resolt #1820: l'import `resolvePublicExtraDefinition` a `extrasConfiguratorService` ja és viu i governa la resolució de labels admin.

Duplicacions:
- `ADMIN_EXTRA_SERVICE_LABELS` duplica conceptualment `SERVICE_LABELS`/`ALL_SERVICES`, però aquí inclou `animacion`; cal decidir si és excepció legítima o si s'ha de derivar d'una font única.
- `CATEGORY_OPTIONS` està centralitzat a `ADMIN_EXTRA_CATEGORY_OPTIONS`; correcte.
- Nova reserva conserva `humaniseExtraLabel()` local com a defensa, però el contracte d'`/api/admin/extras` ja resol les claus i18n a la font des del #1820.

Hardcoded/residu visual:
- Resolt #1820: el formulari ja mostra labels humans en `Nom` i `Descripció` (`Hora extra DJ`, `Llums extra`, `Micròfon sense fils`) en lloc de claus `services.mobile...`.
- Resolt #1819: `/api/admin/extras` usa `requirePermission('read'/'mutate')`, alineat amb Pricing/Packs #1799/#1800.
- Resolt #1821: loading (`role=status`), error (`role=alert`), èxit de desat (`role=status`), `aria-busy` de desat, `aria-pressed` de famílies i botons `+ Nou extra`/`Desar`/`Eliminar` amb variants `ap-btn` canòniques.
- P2 visual: inputs amb `rounded-xl border` locals i cards de formulari llarg; usable, però es veu més eina tècnica que workspace Zenit.
- P2 icones: el camp `Icona` treballa amb emoji directament; pot ser dada de catàleg, però visualment queda sense govern d'icones canòniques.

Connexions interrompudes:
- Runtime OK: render 200, shell present, sense overflow, sense errors consola ni requests/assets fallides.
- La pantalla edita `Setting` mentre part del públic pot llegir model `Extra` de BD via `publicExtrasService`; la fitxa ha de mantenir explícita aquesta frontera perquè no es vengui com a editor universal d'extres si la BD en té.
- Resolt #1820: el contracte admin de `GET /api/admin/extras` ja torna labels humans per les claus i18n conegudes; la defensa local de Nova reserva queda com a fallback, no com a solució principal.

Riscos:
- Canviar la semàntica de `name`/`description` pot afectar traduccions públiques: guardar text humà en comptes de clau i18n pot fer perdre localització si no es dissenya bé.
- El #1820 és deliberadament admin-facing: resol a català per al contracte admin i conserva el públic governat per `publicExtrasService`/registre; no converteix `/admin/packs/extras` en editor universal del model `Extra`.
- Canviar compatibilitats impacta configurador i reserva.
- Desar una llista filtrada elimina extres de la configuració; no és acció decorativa.

Evidència d'auditoria:
- fitxers llegits: `app/admin/packs/extras/page.tsx`, `ExtrasConfiguratorClient.tsx`, `loading.tsx`, `app/api/admin/extras/route.ts`, `lib/services/extrasConfiguratorService.ts`, `lib/services/publicExtrasService.ts`, `app/admin/bookings/useNewBookingInitialData.ts`, `lib/constants/admin.ts`, `app/config/packs-config.ts`.
- imports/exports verificats: `page.tsx` -> `ExtrasConfiguratorClient`; client -> `fetchWithCsrf`, `ALL_SERVICES`, `ADMIN_EXTRA_*`; API -> `extrasConfiguratorService`.
- serveis/APIs seguits: `GET/PUT /api/admin/extras` -> `get/saveExtrasConfiguratorConfig()` -> `Setting(extras.configurator)`.
- captures Playwright autenticades: `.codex-captures/packs-extras-1818/screenshots/001__admin-packs-extras__desktop.png` i `.codex-captures/packs-extras-1818/screenshots/002__admin-packs-extras__mobile.png`.
- captures post-resolució #1820: `.codex-captures/packs-extras-1820/screenshots/001__admin-packs-extras__desktop.png` i `.codex-captures/packs-extras-1820/screenshots/002__admin-packs-extras__mobile.png`.
- captures post-a11y #1821: `.codex-captures/packs-extras-1821/screenshots/001__admin-packs-extras__desktop.png` i `.codex-captures/packs-extras-1821/screenshots/002__admin-packs-extras__mobile.png`.
- mètriques de captura: desktop 200, mobile 200, `adminShell=true`, `horizontalOverflow=false`, `consoleErrors=[]`, `pageErrors=[]`, `failedRequests=[]`, `failedAssets=[]`; desktop `scrollHeight=1488`, mobile `scrollHeight=2641`.
- proves/guards #1818: `qa:no-dead-admin-views` OK; `npx tsc --noEmit --pretty false` OK; `qa:protocol` OK; `git diff --check` OK amb avisos CRLF aliens.
- proves #1819 permisos: `extras-route.test.ts` OK (8/8); `npx tsc --noEmit --pretty false` OK; `qa:api-admin-auth` OK; `qa:api-admin-csrf` OK.
- proves #1820 labels: `extrasConfiguratorService.test.ts` + `publicExtrasService.test.ts` OK (27/27); `npx tsc --noEmit --pretty false` OK; `audit:visual:admin` focalitzat OK sobre `/admin/packs/extras`.
- proves #1821 a11y/botons: `extras-client-a11y.test.ts` OK (2/2); `npx tsc --noEmit --pretty false` OK; `audit:visual:admin` focalitzat OK sobre `/admin/packs/extras`.

Decisio de treball:
- conservar `/admin/packs/extras` com a editor de configuració d'extres, no fusionar-lo amb Packs detall ni Pricing.
- no marcar `🟢` ni `TANCAT CHARLIE`: els P1 de permisos, claus i18n i feedback/botons queden resolts #1819-#1821, però queda visual/densitat de formulari tècnic.
- proper tall segur: reduir densitat i inputs locals del formulari sense tocar preus ni semàntica d'extres.

### `/admin/catalog`

Pantalla: Catàleg — hub de navegació i salut de packs/extres/inventari/preu.
Ruta: `/admin/catalog`
Estat inventari: 🔴 (fitxa FETA #1822; semàfor visual #1823 resolt; densitat pendent)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1822, codex, 2026-07-09)

Història:
- El #1132 audita l'òrgan Catàleg sencer i confirma que `/admin/catalog` és autocontingut i viu.
- El #310 ja havia convertit el hub Catàleg en lectura de salut abans de pestanyes.
- El #1822 baixa a la ruta concreta per separar-la de `/admin/packs`, `/admin/pricing`, `/admin/inventory` i `/admin/packs/extras`.

Reachability:
- `app/admin/catalog/page.tsx` és ruta server real amb `dynamic = 'force-dynamic'`.
- `app/admin/catalog/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/admin/settings/page.tsx` enllaça a `/admin/catalog?tab=packs`.
- La navegació admin marca el grup Catàleg quan `pathname.startsWith('/admin/catalog')`.
- Playwright autenticat renderitza `/admin/catalog` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal.
- Captura manual de `?tab=extras`, `?tab=inventory` i `?tab=pricing` en desktop: totes 200, sense overflow ni errors consola.

Component viu:
- `CatalogPage` resol `searchParams.tab` amb `resolveTab()`; només accepta `packs`, `extras`, `inventory`, `pricing` i torna a `packs` per defecte.
- Carrega en paral·lel `getPackPricingModelConfig()` i `prisma.pack.findMany({ isActive:true })` amb traduccions i inventari associat.
- Calcula `packRows`, ordena per salut (`red`, `amber`, `green`), recompta alertes i construeix el resum superior.
- Pestanya `packs`: enllaços a `/admin/packs`, `/admin/packs/new` i targetes de pack cap a `buildPackHref(pack.id)`.
- Pestanya `extras`: enllaços a `/admin/packs/extras` i `/admin/pricing`.
- Pestanya `inventory`: enllaços a `/admin/inventory` i `/admin/inventory/new`.
- Pestanya `pricing`: KPIs de salut, enllaços a `/admin/pricing` i `/admin/economia`, i taula de marge/cost/preu recomanat.

APIs/serveis vius:
- No té API pròpia ni mutacions; és lectura server + enllaços.
- Usa `getPackPricingModelConfig()` i `computePackPricingHealth()` de `lib/services/packPricingHealth`.
- Usa `calculateCostPerHour()` de `lib/inventory-utils`.
- Usa `CATALOG_TAB_META` i `formatCurrency` de `lib/constants`.
- Usa `buildPackHref()` per obrir fitxes de pack sense hardcodejar el patró.

Dades que governa:
- No governa dades; projecta `Pack`, `PackTranslation`, inventari assignat a pack i configuració de model de preu.
- No escriu `Pack`, `Extra`, `InventoryItem`, `Setting` ni pricing.

Accions que governa:
- Navegar cap a gestió de packs, nou pack, extres, pricing, inventari i economia.
- Triar pestanya per query param.
- Obrir fitxa d'un pack concret amb el helper canònic.

Òrgans veïns:
- upstream: `Pack`, `PackTranslation`, inventari associat, model de pricing.
- downstream: `/admin/packs`, `/admin/packs/new`, `/admin/packs/[id]`, `/admin/packs/extras`, `/admin/pricing`, `/admin/inventory`, `/admin/inventory/new`, `/admin/economia`.
- relació amb `/admin/pricing`: el hub mostra lectura executiva; Pricing és el cockpit amb dades i edició d'extres.

Codi mort / residu:
- No s'ha detectat ruta morta, client orfe ni loader orfe.
- `stripSystemItems`, `stripManualItems` i tons calculats queden preparats però no es renderitzen en aquesta versió; revisar si són residu de l'antic `OwnerControlStrip` o deute de UI pendent.

Duplicacions:
- `CatalogPage` recompon marge, cost directe, benefici i ratio cost a partir de `computePackPricingHealth()` + `calculateCostPerHour()`. No és reimplementació completa, però duplica part de la presentació econòmica que també viu a Packs/Pricing; s'ha de vigilar si es toca el model.
- Resolt #1823: `resolveHealthTone()` continua local a la pàgina, però ja exposa classes canòniques `admin-tone-*` per pintar `Sa`, `Vigilar` i `Crític`.

Hardcoded/residu visual:
- Resolt #1823: `resolveHealthTone()` pinta `Sa` en verd, `Vigilar` en warning i `Crític` en danger amb `badgeClass` i `dotClass` canònics.
- P2 densitat: el tab `pricing` és correcte i responsiu, però és una taula densa dins un hub; no és un cockpit tan llegible com `/admin/pricing`.
- P2 icones: l'alerta superior usa símbol textual `⚠`; si es prioritza, pot passar a iconografia lucide consistent.

Connexions interrompudes:
- Runtime OK: `/admin/catalog`, `?tab=extras`, `?tab=inventory` i `?tab=pricing` carreguen 200, shell present, sense overflow ni errors consola.
- Resolt #1823: el risc econòmic calculat ja arriba a color visual a targetes i taula.
- No s'han detectat enllaços morts en el codi llegit; els destins són rutes admin existents.

Riscos:
- Tocar càlculs del hub pot desalinear-lo de Packs/Pricing si no es fa via `packPricingHealth`.
- Fer editable el hub duplicaria responsabilitats; la ruta ha de continuar sent lectura/navegació.
- El semàfor visual és delicat perquè afecta decisió econòmica: si diu `Crític`, ha de semblar crític.

Evidència d'auditoria:
- fitxers llegits: `app/admin/catalog/page.tsx`, `app/admin/catalog/loading.tsx`, `lib/constants/index.ts`, veïns via `rg`.
- serveis seguits: `getPackPricingModelConfig()`, `computePackPricingHealth()`, `calculateCostPerHour()`, `buildPackHref()`.
- captures Playwright autenticades: `.codex-captures/catalog-1822/screenshots/001__admin-catalog__desktop.png` i `.codex-captures/catalog-1822/screenshots/002__admin-catalog__mobile.png`.
- captures query desktop: `.codex-captures/catalog-1822/screenshots/query-extras-desktop.png`, `query-inventory-desktop.png`, `query-pricing-desktop.png`.
- captures post-semàfor #1823: `.codex-captures/catalog-1823/screenshots/001__admin-catalog__desktop.png` i `.codex-captures/catalog-1823/screenshots/002__admin-catalog__mobile.png`.
- mètriques de captura: `/admin/catalog` desktop/mobile 200, `horizontalOverflow=false`, `consoleErrors=[]`, `failedAssets=[]`; queries `extras`, `inventory`, `pricing` 200, overflow false i errors consola 0.
- proves #1823 semàfor: `health-tone-contract.test.ts` OK (1/1); `npx tsc --noEmit --pretty false` OK; `audit:visual:admin` focalitzat OK sobre `/admin/catalog`.

Decisio de treball:
- marcar `/admin/catalog` com a fitxa FETA, no com a `TANCAT CHARLIE`.
- conservar-lo com a hub de lectura/navegació; no convertir-lo en editor de dades.
- proper tall segur: reduir densitat del tab `pricing` o passar l'alerta superior a iconografia consistent sense tocar càlculs ni dades.

### `/admin/discount-codes`

Pantalla: Codis de descompte — gestor global de codis promocionals.
Ruta: `/admin/discount-codes`
Estat inventari: 🔴 (fitxa FETA #1824; P1 toggle/API, permisos, mojibake i feedback resolts #1825; visual/densitat pendent)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1824, codex, 2026-07-09)

Història:
- El #306 va registrar que la pantalla havia entrat al llenguatge de govern amb resum promocional, backlog i següent pas. La reauditoria #1824 baixa al codi viu actual i comprova que la ruta renderitza com a `AdminPage` client amb KPIs, formulari i llistat.
- El #1041 va sanejar CSRF del `POST /api/admin/discount-codes`.
- El #1825 repara el P1 real detectat a la fitxa: toggle passa a `PATCH`, la route aplica permisos `read/mutate`, el servei actualitza `isActive` i el client saneja euro/feedback.
- La pantalla governa el model global `DiscountCode`; no és el mateix que `CustomerDiscountCode`, que viu al Customer Hub / flux de testimonis post-event.

Reachability:
- `app/admin/discount-codes/page.tsx` és ruta client real.
- `app/admin/discount-codes/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/api/admin/discount-codes/route.ts` exporta `GET` i `POST`.
- `lib/services/discountCodeAdminService.ts` és el servei viu de llista i creació.
- Playwright autenticat renderitza `/admin/discount-codes` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal.

Component viu:
- `DiscountCodesPage` carrega `GET /api/admin/discount-codes` amb `fetchWithCsrf`, abort de 15s i estat local `codes`, `stats`, `loading`, `showForm`, `form` i `error`.
- El formulari crea codis amb `POST /api/admin/discount-codes` i payload `code`, `type`, `value`, `validUntil`, `maxUses`, `minOrderValue`, `description` i `isAccumulative`.
- El llistat mostra codi, tipus, valor, data de validesa, usos, estat, acumulable i acció d'activació.
- `toggleActive()` intenta fer `POST /api/admin/discount-codes` amb `{ _action:'toggle', id, isActive }`.

APIs/serveis vius:
- `GET /api/admin/discount-codes`: `requireAuth(req)` i `listAdminDiscountCodes()`.
- Resolt #1825: `GET /api/admin/discount-codes` exigeix també `requirePermission(req,'read')`.
- `POST /api/admin/discount-codes`: `requireAuth(req)`, `requirePermission(req,'mutate')`, `verifyCsrf(req)`, validació zod de creació i `createAdminDiscountCode()`.
- Resolt #1825: `PATCH /api/admin/discount-codes` valida `{ id, isActive }`, exigeix `mutate` + CSRF i crida `setAdminDiscountCodeActive()`.
- `listAdminDiscountCodes()` llegeix `prisma.discountCode.findMany({ orderBy:{ createdAt:'desc' } })` i calcula stats `total`, `active`, `expired`, `totalUses`.
- `createAdminDiscountCode()` normalitza `code` a majúscules, bloqueja duplicats, crea `DiscountCode` i registra `adminLog`.
- `setAdminDiscountCodeActive()` comprova existència, actualitza `isActive` i registra `adminLog` `UPDATE`.

Dades que governa:
- Prisma `DiscountCode`: `code`, `type`, `value`, `description`, `validFrom`, `validUntil`, `maxUses`, `currentUses`, `minOrderValue`, `applicablePacks`, `isAccumulative`, `sourceType`, `sourceBookingId`, `isActive`.
- Separació explícita: `DiscountCode` global no substitueix `CustomerDiscountCode` personalitzat.

Accions que governa:
- Llegir codis globals i KPIs promocionals.
- Crear un codi global nou.
- Resolt #1825: activar/desactivar codis des de la taula via `PATCH`.

Òrgans veïns:
- upstream: model promocional global i public validation de codis.
- downstream: reserva/client quan un codi s'aplica; post-event/testimonis quan es creen codis personalitzats en `CustomerDiscountCode`.
- relació amb Clients: la ruta és de govern promocional global; el Customer Hub continua sent el lloc de codis per client.

Codi mort / residu:
- No s'ha detectat route morta ni servei orfe.
- Resolt #1825: `toggleActive()` ja no envia `_action:'toggle'` al `POST` de creació; usa `PATCH` i servei específic.

Duplicacions:
- La pantalla té tipus locals `DiscountCode`, `Stats` i `FormData` que dupliquen parcialment el model Prisma/contracte API; acceptable de moment com a contracte client, però si es toca API convé tipar resposta compartida.
- El format de moneda està inline amb símbol `€` i no passa per helper de moneda admin.

Hardcoded/residu visual:
- Resolt #1825: el símbol euro ja surt net com `€` en `Valor`, `Comanda mínima` i imports fixos.
- Resolt #1825: loading inicial anuncia `role=status`; error/èxit de formulari passen a `role=alert/status` amb `aria-live`.
- Resolt #1825: tipus `Percentatge %` / `Import fix` exposen `aria-pressed` i el submit exposa `aria-busy`.
- P2 visual: desktop correcte però molt buit quan no hi ha codis; mòbil és net però allarga molt la pantalla quan s'obre formulari.

Connexions interrompudes:
- Runtime OK en estat buit: 200, shell admin present, sense overflow, consola neta.
- Resolt #1825: acció toggle reconnectada per contracte client/API.
- Resolt #1825: permisos fins `read/mutate` aplicats a la route.

Riscos:
- Resolt #1825: toggle passa per servei canònic, permisos `mutate`, CSRF i test de route; no hi ha `prisma.discountCode.update(...)` inline al component.
- Canviar `DiscountCode` pot afectar aplicació pública de descomptes; cal mantenir separada la lògica global de la personalitzada.
- L'operador pot pensar que ha desactivat un codi si només mira el toast, per això el P1 de toggle és funcional, no cosmètic.

Evidència d'auditoria:
- fitxers llegits: `app/admin/discount-codes/page.tsx`, `app/admin/discount-codes/loading.tsx`, `app/api/admin/discount-codes/route.ts`, `lib/services/discountCodeAdminService.ts`, `__tests__/app/api/admin/discount-codes-route.test.ts`, `__tests__/lib/services/discountCodeAdminService.test.ts`, `prisma/schema.prisma`.
- imports/exports verificats: client -> `fetchWithCsrf`, `useAsyncForm`, `useToast`, `AdminPage`, `AdminEmptyState`; API -> `discountCodeAdminService`.
- captures Playwright autenticades: `.codex-captures/discount-codes-1824/screenshots/001__admin-discount-codes__desktop.png` i `.codex-captures/discount-codes-1824/screenshots/002__admin-discount-codes__mobile.png`.
- captures manuals del formulari: `.codex-captures/discount-codes-1824/screenshots/manual__admin-discount-codes__desktop-form.png` i `manual__admin-discount-codes__mobile-form.png`.
- captures post-fix #1825: `.codex-captures/discount-codes-1825/screenshots/001__admin-discount-codes__desktop.png`, `002__admin-discount-codes__mobile.png`, `manual__admin-discount-codes__desktop-form.png` i `manual__admin-discount-codes__mobile-form.png`.
- mètriques de captura: desktop/mobile 200, `horizontalOverflow=false`, `consoleErrors=[]`, `failedAssets=[]`.
- proves/guards #1824: `audit:visual:admin` focalitzat OK sobre `/admin/discount-codes`; `discount-codes-route.test.ts` + `discountCodeAdminService.test.ts` OK; `qa:no-dead-admin-views` OK; `npx tsc --noEmit --pretty false` OK; `qa:protocol` OK; `git diff --check` OK amb avisos CRLF aliens.
- proves #1825: `discount-codes-route.test.ts` + `discountCodeAdminService.test.ts` + `page-contract.test.ts` OK (31/31); `qa:api-admin-auth` OK; `qa:api-admin-csrf` OK; `npx tsc --noEmit --pretty false` OK; `audit:visual:admin` focalitzat OK sobre `/admin/discount-codes`.

Decisio de treball:
- marcar `/admin/discount-codes` com a fitxa FETA, no com a `TANCAT CHARLIE`.
- proper tall segur: reduir aire buit/densitat visual i decidir si cal recuperar el resum executiu de govern històric del #306, sense tocar lògica pública de descompte.

### Òrgan Comunicacions (`/admin/inbox`, `/admin/inbox/compose`, `/admin/inbox/settings`, `/admin/emails`, `/admin/email-templates`)

Pantalla: Comunicacions — safata IMAP, redactor, configuració SMTP/IMAP, panell de correus i plantilles.
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1133, claude, 2026-06-24)

Reachability: tots els components vius (1 importador cadascun, cap mort): SafataClient, ComposeForm, ImapSettingsClient, EmailConfigPanel, EmailStatsCards, InboxPanel, ManualActionsPanel, RecentEmailsTable, SendPostEventButton, EmailTemplatesClient (+ [slug]/TemplateEditorClient). Passa `qa:no-dead-admin-views`.
CSS viu: inbox.css (sf__, sub-app 3-panes), classes canòniques a emails/email-templates. Header sf__title ja canon (#1123).
APIs/serveis vius: adminEmailSendService, adminQuoteEmailService, emailTemplateService, emailTrackingService, emailSentRetryService, imapSettingsService, inboxLeadImportService, inboxTemplateService, bulkComposeSegmentService, emailLeadExtractionService. Tots consumits.
Codi mort relacionat: cap.
Duplicacions: cap.
Hardcoded/residu visual: dins canon. Excepció LEGÍTIMA: `color: '#06b6d4'` a TemplateEditorClient = color per defecte d'EMAIL HTML (renderitza a clients externs, no pot usar tokens CSS). Panes compactes d'Inbox (sf__pane-title 2xs) = excepció funcional de mail-app 3-columnes.
Connexions interrompudes: cap. Inbox↔leads (import), emails↔post-event, compose↔plantilles coherents.

Canvi de codi (#1133): corregit un BOTÓ-VOID que el guard no caçava (era una const string, no un `className="..."` literal): `ManualActionsPanel.tsx` `PRIMARY_BUTTON = 'rounded-xl px-4 py-2 ... text-white shadow-lg'` (sense fons → text blanc + shadow sobre transparent) → `'ap-btn ap-btn--primary'` (regla canon #2). Escaneig confirma que era l'ÚNIC botó-void en const a tot l'admin.
GAP DE GUARD documentat: `check-admin-canon` detecta botó-void només a `className="..."` literals, no a consts (`const X = '...text-white...'`). Candidat a ampliar el guard en una passada futura.

Validacio: tsc EXIT 0 · validate:core EXIT 0 (qa:admin-canon 0) · render /admin/emails HTTP 200, 3 `.ap-btn--primary`, 0 runtime error.

Decisio de treball: organ SA i ben cablejat. Fet el fix del botó-void; la resta es conserva. Pendent validacio visual del propietari.

### Òrgan Partners (`/admin/collaborators`, `/admin/collaborators/[id]`)

Pantalla: Partners — base única de relació externa (col·laboradors, cas Carlos Lucas amb rol dual client/proveïdor).
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1145, claude, 2026-06-25)

Reachability: 3 components vius (1 importador cadascun): CollaboratorsClient (llista), PartnerHubClient (detall, 7 tabs), CollaboratorProductsPanel. Passa qa:no-dead-admin-views.
CSS viu: classes canòniques `.ap-*` (ap-card, ap-kpi, ap-table, ap-btn) + NOU `partner-hub.css` (només `.ph__h2`, tipografia de títol de secció).
APIs/serveis vius: collaboratorAdminService, collaboratorMemberService, collaboratorProductService, partnerHubService. Tots consumits.
Codi mort relacionat: cap.
Duplicacions: cap.
Hardcoded/residu visual: 2 BUGS reals corregits (#1145, vegeu sota). Resta dins canon.
Connexions interrompudes: cap. Partner enllaça a bolos (booking/lead hrefs) i al cuadrant.

Bugs de codi corregits (#1145) — cap guard els caçava:
1. Títols de secció `text-lg font-semibold` (Tailwind cru, 7×) → `.ph__h2` (display 18px bold) via nou partner-hub.css. Abans no eren Plus Jakarta.
2. KPIs amb `.ap-kpi__label`/`.ap-kpi__value` (BEM doble-guió INEXISTENT al CSS) → `.ap-kpi-label`/`.ap-kpi-value` (canon, #1122). Abans els KPIs no tenien estil canònic. Únic lloc de l'admin amb aquest BEM doble.

Validacio: tsc EXIT 0 · validate:core EXIT 0 (qa:admin-canon 0) · render Partner Hub (Carlos Lucas) 3 breakpoints, `.ph__h2`/`.ap-kpi-value` = Plus Jakarta, HTTP 200, 0 overflow/error.

Decisio de treball: organ ben cablejat amb 2 bugs visuals corregits. Pendent validacio visual del propietari.

### Òrgan Documents (`/admin/presupuestos`, `/admin/dossiers`) + `/studio` (protegit a part)

Pantalla: Documents — pressupost/PDF (proposals) i generador de dossiers comercials.
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari. (`/studio` = zona protegida pròpia, NO auditada aquí.)
Estat fitxa: FETA (auditoria forense #1155, claude, 2026-06-25)

Reachability: tots els components vius (1 importador): `presupuestos/page` → PresupuestoPdfStudio (editor PDF), ProposalsList, ProposalOwnerPanel, StudioPreview; `dossiers/page` → DossierGeneratorClient, DossierListActions. Passa qa:no-dead-admin-views.
CSS viu: `presupuestos.css`, `dossiers.css` (layout propi). Títols ja canon (.ap-h2, StudioPreview migrat al #1147).
APIs/serveis vius: dossierService (getAllDossiers/getDeletedDossiers), costEngine, travelCost, leadServiceLineService, collaboratorProductService. Lectura presupuestos via prisma (customer/lead/proposal/setting/leadDocument) al server page.
Monocapa: copy del generador centralitzat a `ADMIN_DOSSIER_GENERATOR_COPY` + `lib/constants/dossier-copy` + `messages.dossier.*`; diners via costEngine (NO reimplementat).
Codi mort relacionat: cap.
Duplicacions: cap.
Hardcoded/residu visual: dins canon. PresupuestoPdfStudio + StudioPreview són EDITORS DE PDF (exempts del guard de canon: el color és contingut del document, no chrome — vegeu EXEMPT a check-admin-canon).
Connexions interrompudes: cap. Pressupost↔lead/client (prisma), dossier↔catàleg de productes (orbita/collaborator), tots dos↔costEngine.

Canvi de codi (#1155): cap. Auditoria neta — organ SA sense bugs (a diferència de Partners #1145). Només documentació.

Validacio: tsc EXIT 0 · validate:core EXIT 0 (qa:admin-canon 0) · render presupuestos/dossiers ja cobert per qa:smoke.

Decisio de treball: organ SA i ben cablejat, cap canvi de codi. `/studio` queda fora (zona protegida amb guard qa:studio-integrity propi). Pendent validacio visual del propietari.

### Òrgan Comandament (`/admin`, `/admin/salut`, `/admin/reporting`, `/admin/analytics`)

Pantalla: Comandament — dashboard operatiu, salut del sistema, reporting executiu, analytics.
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1156, claude, 2026-06-25)

Reachability: `/admin/page.tsx` (dashboard, server) consumeix dashboard-widgets (8 exports) + 9 serveis; salut/reporting/analytics són pages + loading amb AdminPage. Tot viu. Passa qa:no-dead-admin-views.
CSS viu: classes canòniques `.ap-*` + tokens `--at-cr-*` a admin-theme.css (control-room.css eliminat al #1315). Títols ja canon (.ap-h2/.ap-title del #1146).
APIs/serveis vius: adminOperatingCycleService, attributionService, capacityConflictService, captureHealthService, dailyAnomalyService, dailyBriefService, dashboardInsightsService, operationalForecastService, operationalPulseService. Tots consumits pel dashboard.
Codi mort relacionat: cap.
Duplicacions: cap (el forecast unificat viu a economicCockpitService #1089; el dashboard consumeix serveis, no els reimplementa).
Hardcoded/residu visual: dins canon. Títols migrats a .ap-h2/.ap-title (#1146); KPIs amb gramàtica canònica.
Connexions interrompudes: cap. Dashboard enllaça a tots els organs (leads, bookings, tasks, economia...).

Canvi de codi (#1156): cap. Auditoria neta — organ SA. Els títols ja es van canonitzar al #1146 (salut/analytics → .ap-h2).

Validacio: tsc EXIT 0 · validate:core EXIT 0 (qa:admin-canon 0) · render /admin + salut/reporting/analytics cobert per qa:smoke.

Decisio de treball: organ SA, cap canvi de codi nou. Pendent validacio visual del propietari.

### Òrgan Post-event (`/admin/post-event`, reports, surveys, seguiment, playbook)

Pantalla: Post-event — tancament de bolo i aprenentatge (informes, enquestes, seguiment, playbook).
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1162, claude, 2026-06-25)

Reachability: les 5 rutes (post-event, reports, reports/new, surveys, seguiment, playbook) són pages amb AdminPage + loading. Passa qa:no-dead-admin-views.
CSS viu: classes canòniques `.ap-*`. Títols ja canon.
APIs/serveis vius: postEventReportAdmin i serveis post-event consumits per les pages.
Codi mort / Duplicacions / Hardcoded: cap (escaneig #1162: 0 BEM doble, 0 dialog natiu, 0 títol cru).
Connexions interrompudes: cap. Post-event connecta amb booking i client (tancament de bolo).

Decisio de treball: organ SA, cap canvi de codi. Pendent validacio visual del propietari.

### Òrgan Sistema (settings, crons, scripts, features, coverage, canvas, text/css/image managers, stats, activity, cockpit, economia, docs)

Pantalla: Sistema — infraestructura, configuració, eines i sistema visual protegits.
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1162, claude, 2026-06-25)

Reachability: components clau vius (SettingsClient×5 usos, CronsClient, ScriptsClient, CanvasEditorClient, ActivityClient, EconomiaClient×2). Passa qa:no-dead-admin-views.
CSS viu: classes canòniques `.ap-*` + tokens `--at-cr-*` del cockpit a admin-theme.css (control-room.css eliminat al #1315). Títols ja canon (.ap-h2 del #1146).
APIs/serveis vius: adminSettings, cron services, economicCockpitService (cockpit), pricing services (economia). Consumits.
Codi mort / Duplicacions: cap.
Hardcoded/residu visual: dins canon. EXEMPCIONS legítimes documentades: CanvasEditorClient (editor gràfic, color = disseny d'usuari), css-manager/text-manager/image-manager (dades editables = contingut, no chrome) — tots a EXEMPT del guard de canon.
Connexions interrompudes: cap. cockpit↔economicCockpitService (forecast unificat #1089), economia↔costEngine.

Decisio de treball: organ SA. `/studio` queda protegit a part (qa:studio-integrity). Editors (canvas/managers) són exempts legítims. Cap canvi de codi. Pendent validacio visual del propietari.

### `/admin/stats`

Pantalla: Estadístiques — govern de números públics i overrides manuals.
Ruta: `/admin/stats`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1783, codex, 2026-07-09)

Història:
- La pantalla governa els números visibles al web públic quan el càlcul automàtic no explica bé el negoci.
- El #300 va fer entrar Stats al patró editorial amb `EditorControlStrip`.
- El #1055 va endurir `POST /api/admin/stats` amb CSRF.
- El #1782 resol la divergència clau: el servei públic ja llegeix les claus que escriu l'admin.

Reachability:
- `app/admin/stats/page.tsx` és ruta Next real i client component.
- `app/admin/stats/loading.tsx` reutilitza `AdminLoadingSkeletonDashboard`.
- `app/api/admin/stats/route.ts` és la route admin viva de lectura i desat.
- `lib/services/adminStatsService.ts` és el servei admin de càlcul/fallback.
- `lib/services/publicStatsService.ts` alimenta `/api/public/stats` i els consumidors públics via `fetchPublicStats()`.

Component viu:
- `StatsPage`: carrega `/api/admin/stats`, manté `stats`, `fetchError`, `editingStat`, `editValue` i `saving`.
- Mostra `EditorControlStrip` amb cobertura pública, estat dels overrides i següent acció.
- KPIs locals: automàtiques i manuals.
- Llista cada estadística amb valor actual, calculat i manual.
- `saveStat()` envia `{ key, fallback }`; `resetStat()` confirma i envia `{ key, resetToCalculated: true }`.
- Errors de mutació es mostren amb toast; errors de càrrega inicial mostren `AdminEmptyState` amb `Reintentar`.

CSS viu:
- No hi ha CSS local de `/admin/stats`.
- Usa `AdminPage`, `EditorControlStrip`, `ConfirmDialog`, `.ap-card`, `.ap-btn`, `admin-tone-*`, tokens `--line/--raised` i utilitats Tailwind puntuals.
- Inventari continua `🔴` perquè falta validació visual propietari i perquè queden residus visuals acotats.

APIs/serveis vius:
- `GET /api/admin/stats`: `requireAuth(req)`, `listAdminStats()`, JSON `{ok:true, stats}`.
- `POST /api/admin/stats`: `requireAuth(req)`, `verifyCsrf(req)`, valida `key`, valida `isAdminStatKey()`, crida `updateAdminStatFallback()`.
- `adminStatsService`: calcula esdeveniments completats, convidats, anys, satisfacció i rating; llegeix fallbacks de `Setting` i escriu `adminLog`.
- `publicStatsService`: llegeix `Setting(category=stats)`, compta bookings públics, aplica fallbacks/overrides i retorna `/api/public/stats`.

Dades que governa:
- Catàleg admin: `ADMIN_STATS_DEFINITIONS` amb 5 claus (`events_completed`, `people_entertained`, `years_experience`, `satisfaction_percent`, `rating_average`).
- Persistència: `Setting.key = stats.*`, `type=NUMBER`, `category=stats`.
- Traça: `adminLog` amb `entity=stat`, `entityId=stats.*`, `details.fallback` o `reset_to_calculated`.
- Sortida pública relacionada: `totalEvents`, `peopleEntertained`, `yearsExperience`, `averageRating/googleRating` i compatibilitats de Google Reviews.

Accions que governa:
- Veure valor calculat i valor manual de cada stat.
- Editar fallback manual no negatiu.
- Resetar una stat perquè torni al càlcul automàtic.
- No edita directament segmentació pública per weddings/corporate/parties; aquests valors surten del servei públic.

Òrgans veïns:
- upstream: bookings completats, `guestCount`, enquestes de client, Google Reviews cache i settings.
- downstream: `/api/public/stats`, hooks/clients públics i seccions de home/mobile que consumeixen stats.
- relació amb Text Manager: Text Manager governa copy; Stats governa xifres.
- relació amb Google Reviews: cache escriu `stats.googleRating` i `stats.googleReviewCount`; el #1782 manté compatibilitat.

Codi mort relacionat:
- Route admin i servei tenen tests vius (`stats-route`, `adminStatsService`).
- `publicStatsService` té tests de fallback i, des del #1782, test d'overrides admin.
- No s'ha detectat arrel morta, però hi havia divergència de claus admin→públic resolta al #1782.

Duplicacions:
- Admin calcula cinc stats; públic calcula més camps i exposa shape diferent.
- `stats.satisfaction_percent` es governa a l'admin però no apareix a la resposta pública actual.
- `publicStatsService` manté compatibilitat amb claus legacy/camel per no exigir migració de BD.

Hardcoded/residu visual:
- Copy admin local acceptable.
- Resolt #1784: `stat.icon` són claus (`party`, `people`, `calendar`, `star`, `sparkle`), però la page les mapa a icones `lucide-react` i no les renderitza com a text visible.
- Botons d'acció usen símbols visibles (`✏️`, `🔄`) dins el text del botó; acceptable com a botó textual però pendent de revisió visual si es migra.

Connexions interrompudes:
- Resolt #1782: les claus que escriu `/admin/stats` ja són llegides per `publicStatsService`.
- Resolt #1784: icones textuals substituïdes per un map local de claus a icones reals.
- P2 UX: errors de mutació queden en toast; no hi ha error persistent per fila.

Riscos:
- Overrides manuals poden maquillar el negoci si no es revisen periòdicament.
- El públic té cache; un canvi d'override pot no veure's immediatament segons TTL.
- Canviar noms de claus sense compatibilitat trencaria tant settings existents com sortida pública.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/stats/page.tsx`, `loading.tsx`, `app/api/admin/stats/route.ts`, `lib/services/adminStatsService.ts`, `lib/services/publicStatsService.ts`.
- constants llegides: `ADMIN_STATS_DEFINITIONS`.
- tests llegits/actualitzats: `__tests__/app/api/admin/stats-route.test.ts`, `__tests__/lib/services/adminStatsService.test.ts`, `__tests__/lib/services/publicStatsService.test.ts`, `__tests__/app/admin/stats/StatsPage.test.tsx`.
- consumidors verificats amb `rg`: `/admin/stats`, `/api/public/stats`, `fetchPublicStats`, `stats.*`.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`. Pont admin→públic resolt al #1782 amb test focalitzat 31/31 + TypeScript; icones resoltes al #1784 amb test focalitzat 32/32 + TypeScript.

Decisio de treball:
- conservar Stats com a govern de números públics, no com a dashboard analític.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visualment.
- proper tall recomanat: revisar si `stats.satisfaction_percent` ha de tenir sortida pública o sortir del catàleg admin.

### `/admin/manual`

Pantalla: Manual de possibilitats — memòria operativa del producte.
Ruta: `/admin/manual`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1785, codex, 2026-07-09)

Història:
- El manual concentra què existeix, què és automàtic, què continua sent manual i on entrar.
- El #606 va fixar la narrativa mare del product operating system.
- Els canvis #541-#559, #594/#596 i la sèrie de captació van convertir el manual en flux operatiu, gates, evidències, ritme, excepcions i roadmap.
- El #1785 documenta el codi viu sense tocar constants ni roadmap.

Reachability:
- `app/admin/manual/page.tsx` és server component, `dynamic = 'force-static'`, `revalidate = 60`.
- `app/admin/manual/loading.tsx` reutilitza `AdminLoadingSkeletonDashboard`.
- La page usa `AdminPage` i `AdminSection`.
- Llegeix `docs/admin-protocol.md` per indexar els `Canvi #N` del §9 via `protocolCanvisService`.
- `lib/services/adminManualRoadmapService.ts` construeix els CTAs del roadmap cap al protocol.

Component viu:
- Renderitza KPIs inicials: àrees cobertes, flux operatiu, govern visual alineat i roadmap pendent.
- Mostra snapshot, sistema operatiu de punta a punta, gates, checklist, excepcions, evidències i handoffs.
- Mostra govern visual, frontera d'automatització, captació/màrqueting, semàfor Google Ads, checklist d'auditoria i roadmap.
- No té formularis, no desa, no executa accions i no crida APIs mutadores.

CSS viu:
- No hi ha CSS local de `/admin/manual`.
- Usa `.ap-*`, `admin-tone-*`, tokens `--line/--panel/--raised`, cards i links admin compartits.
- Inventari continua `🔴` perquè falta validació visual propietari en una pantalla molt llarga i densa.

APIs/serveis vius:
- No hi ha `/api/admin/manual`.
- `loadProtocolCanvisIndex()` llegeix fitxer local del protocol i retorna `Map<number, ProtocolCanviMeta>`.
- `buildAdminManualRoadmapProtocolTarget()` apunta DONE a `?canvi=N#canvi-N` i PENDING a `?seccio=X#seccio-X`.
- Els guards `qa:admin-manual-consistency`, `check-admin-manual-hrefs`, `check-roadmap-canvis` i tests de render blinden coherència.

Dades que governa:
- `lib/constants/adminManual.ts`: principis, ritme, flow, gates, handoffs, checklist, excepcions, evidències, snapshot, reality checks, govern visual, seccions, roadmap, captació i Google Ads.
- `docs/admin-protocol.md`: origen canònic dels Canvis #N citats al roadmap.
- No governa dades de BD ni settings.

Accions que governa:
- Orientar decisió humana: on entrar, què mirar, quan aturar-se i quin pas tanca cada fase.
- Enllaçar a workspaces admin concrets.
- Enllaçar el roadmap amb el protocol.
- No crea tasques, no modifica leads, no canvia roadmap en runtime i no envia comunicacions.

Òrgans veïns:
- upstream: `adminManual.ts`, protocol §9, product operating system i constants de captació.
- downstream: Dashboard/Daily Brief, Marketing, Leads, Sales Ops, Pressupostos, Bookings, Economia, Clients, Text Manager, Social, Reporting i Protocol.
- relació amb Protocol: el Manual és interfície operativa; el Protocol és registre normatiu i changelog.

Codi mort relacionat:
- Page, constants, helper i tests tenen consumidors vius.
- Les entrades històriques del protocol sobre OwnerControlStrip no descriuen necessàriament el render actual; la fitxa documenta el server component viu.

Duplicacions:
- El Manual resumeix informació que també viu al protocol i a altres docs; la protecció és que els links a Canvi #N es deriven de §9 i els guards vigilen coherència.
- El roadmap té dades estàtiques dins `adminManual.ts`; qualsevol canvi de prioritat requereix editar constants i validar guards.

Hardcoded/residu visual:
- Copy extens i local dins constants, acceptable perquè és manual intern.
- Moltes seccions són llargues; risc de densitat visual més que de lògica.
- No hi ha inline styles ni catàleg duplicat de serveis/preus.

Connexions interrompudes:
- P2 UX: pantalla molt llarga; falta validació visual humana de lectura, scroll i prioritat del primer viewport.
- P2 governança: si el protocol §9 canvia format, el parser pot deixar de citar Canvis al roadmap.

Riscos:
- Si el Manual divergeix del protocol, deixa de ser memòria fiable.
- Si es toca `adminManual.ts` sense guards, pot trencar hrefs o passos canònics del product operating system.
- Marcar-lo `🟢` sense revisió humana seria prematur per densitat i longitud.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/manual/page.tsx`, `loading.tsx`, `lib/services/adminManualRoadmapService.ts`.
- tests llegits: `__tests__/app/admin/manual/AdminManualPage.test.tsx`, `__tests__/lib/services/adminManualRoadmapService.test.ts`, `__tests__/lib/constants/adminManualRoadmap.test.ts`.
- consumidors verificats amb `rg`: `/admin/manual`, `adminManual`, roadmap, manual consistency guards.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`.

Decisio de treball:
- conservar `/admin/manual` com a memòria operativa, no com a editor ni com a dashboard.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visualment lectura i jerarquia.
- proper tall recomanat: només si es vol, captura/revisió visual real per primer viewport i densitat; no tocar roadmap sense motiu.

### `/admin/docs/protocol`

Pantalla: Protocol — viewer normatiu i cua de validació humana dels Canvis.
Ruta: `/admin/docs/protocol`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1787, codex, 2026-07-09)

Història:
- El #463 va crear el viewer del §9 perquè el Manual pogués obrir Canvis #N i deixar de citar el protocol a cegues.
- El #464 va afegir índex de seccions `§X.Y` i entrada enfocada amb `?seccio=`.
- Els #466-#491 van convertir la validació humana del protocol en eina real: service, route, toggle, filtres, comptadors, primer pendent i tests de render.
- El #1786 blinda el toggle client contra doble mutació durant el `fetch`.
- El #1787 documenta el codi viu sense tocar parser, servei, API, schema ni contingut del protocol.
- El #1834 endureix la route: només es poden validar/desfer Canvis que existeixen a `docs/admin-protocol.md`.

Reachability:
- `app/admin/docs/protocol/page.tsx` és server component amb `dynamic = 'force-dynamic'`.
- `app/admin/docs/protocol/loading.tsx` reutilitza `AdminLoadingSkeletonDetail`.
- `app/admin/docs/protocol/ProtocolValidationToggle.tsx` és el component client per validar/desfer Canvi #N.
- `app/api/admin/protocol/validations/route.ts` és la route viva per llegir, marcar i desfer validacions.
- El Manual enllaça Canvis i seccions cap a aquesta pantalla.

Component viu:
- Llegeix `docs/admin-protocol.md` i fa fallback temporal a `docs/protocol-producte-admin-ca.md`.
- Parseja Canvis amb `parseProtocolCanvis()` i seccions amb `parseProtocolSections()`.
- Carrega `loadCanviValidations()` i mostra KPIs: canvis, seccions, darrer canvi, validats humans i filtre actiu.
- Suporta `?q=`, `?validation=all|validated|pending`, `?canvi=N` i `?seccio=X.Y`.
- Renderitza seccions com a cards navegables o una secció enfocada en `<pre>`.
- Renderitza Canvis com a `<details>` amb badges d'autor, estat del canvi i estat de validació humana.

CSS viu:
- No hi ha CSS local de protocol.
- Usa `AdminPage`, `AdminSection`, `.ap-card`, `.ap-btn`, `.adm-input`, `admin-tone-*` i tokens compartits.
- Inventari continua `🔴` perquè falta validació visual humana i la pantalla encara és densa per naturalesa documental.

APIs/serveis vius:
- `GET /api/admin/protocol/validations`: `requireAuth`, `requirePermission(req, 'read')`, retorna validacions en array.
- `POST /api/admin/protocol/validations`: `requireAuth`, `requirePermission(req, 'mutate')`, `verifyCsrf`, body `canviN/notes`, `validatedBy = getAdminRole(req)`.
- `DELETE /api/admin/protocol/validations`: mateix perímetre de mutació + CSRF, body `canviN`.
- `protocolValidationsService.ts`: persisteix a `Setting.key = protocol.canviValidations` com JSON i escriu `adminLog`.
- `protocolValidationViewerService.ts`: normalitza filtres, ordena pendents primer, calcula comptadors, progrés, empty states i shortcut al primer pendent.
- `protocolCanvisService.ts`: parser pur del protocol, Canvis i seccions.

Dades que governa:
- Contingut normatiu llegit: `docs/admin-protocol.md`.
- Compatibilitat històrica de lectura: `docs/protocol-producte-admin-ca.md`.
- Validacions humanes: setting JSON `protocol.canviValidations`.
- Logs interns: `adminLog` amb acció `UPDATE` sobre `setting`.

Accions que governa:
- Cercar Canvis per número, data, autor o titular.
- Filtrar Canvis per estat de validació humana.
- Obrir una secció normativa concreta.
- Marcar validació humana amb nota opcional.
- Desfer validació humana.
- No edita el Markdown del protocol, no crea Canvis i no canvia el comptador.

Òrgans veïns:
- upstream: `docs/admin-protocol.md`, `protocolCanvisService`, `protocolValidationsService`, auth/CSRF.
- downstream: Manual, roadmap admin, disciplina de tancament de canvis, agents humans.
- relació amb Manual: el Manual és interfície operativa; Protocol és registre normatiu, changelog i cua de revisió humana.

Codi mort relacionat:
- Page, toggle, route i serveis tenen tests vius.
- El fallback al fitxer legacy és compatibilitat històrica; no és font preferent.
- No s'ha detectat arrel morta en el viewer actual.

Duplicacions:
- Les validacions humanes viuen a `Setting` i no dins el Markdown; això evita editar el protocol per cada check humà, però crea una segona capa d'estat.
- El parser de Canvis depèn del format del header `### Canvi #N — YYYY-MM-DD — author (STATUS)`.
- El viewer resumeix seccions i Canvis que també existeixen en brut al Markdown.

Hardcoded/residu visual:
- Copy admin local acceptable per pantalla interna.
- Badges d'estat usen mapes locals de classes semàntiques.
- No hi ha inline styles ni catàlegs duplicats de negoci.

Connexions interrompudes:
- Resolt #1786: el toggle ja bloqueja durant el `fetch`, evita doble mutació i anuncia errors amb `role=alert`.
- Resolt #1834: la route ja rebutja `canviN` desconeguts amb `404 unknown-canvi` abans de persistir o esborrar validacions.
- P2 UX: pantalla llarga i molt documental; falta captura/revisió visual real abans de considerar migració.

Riscos:
- Si el format de `docs/admin-protocol.md` canvia, el parser pot deixar de trobar Canvis o seccions.
- Les validacions desconegudes per API directa queden bloquejades al #1834; si ja existís residu històric al setting, els summaries el continuen ignorant.
- Marcar la pantalla `🟢` sense validació humana seria prematur: és útil, però no és encara una migració visual formal.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/docs/protocol/page.tsx`, `ProtocolValidationToggle.tsx`, `loading.tsx`, `app/api/admin/protocol/validations/route.ts`, `lib/services/protocolCanvisService.ts`, `protocolValidationsService.ts`, `protocolValidationViewerService.ts`.
- tests llegits/actualitzats: `__tests__/app/admin/docs/ProtocolPage.test.tsx`, `ProtocolValidationToggle.test.tsx`, `__tests__/app/api/admin/protocol-validations-route.test.ts`, `__tests__/lib/services/protocolCanvisService.test.ts`, `protocolValidationsService.test.ts`, `protocolValidationViewerService.test.ts`, `__tests__/scripts/check-nonstop-protocol.test.ts`.
- consumidors verificats amb `rg`: `/admin/docs/protocol`, `protocolCanvis`, `protocolValidations`, Manual i guards de protocol.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`. El P1 de doble mutació queda resolt al #1786 amb test focalitzat 6/6 + TypeScript. El P2 API queda resolt al #1834 amb tests de route 11/11 dins una suite focalitzada 45/45.

Decisio de treball:
- conservar `/admin/docs/protocol` com a viewer normatiu i cua de validació humana, no com a editor del protocol.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visualment lectura, filtres i densitat.
- proper tall recomanat: seguir inventari Sistema amb la següent pantalla pendent o revisar visual/densitat de Protocol amb captures; l'API de Canvis existents ja queda tancada al #1834.

### `/admin/docs/master`

Pantalla: Master Òrbita — porta única modular cap al Zenit.
Ruta: `/admin/docs/master`
Estat inventari: 🔴 (fitxa FETA #1829; validació visual humana i priorització de palanques pendents)
TANCAT CHARLIE: no — pendent criteri visual/producte del propietari.
Estat fitxa: FETA (auditoria forense #1829, codex, 2026-07-09)

Història:
- El #1420 crea `/admin/docs/master` com a porta única sobre mòduls de negoci, creuant Atles elèctric i auditoria visual.
- El #1422 sincronitza la guàrdia de dissabtes perquè el Master no proposi com a pendent una peça ja feta.
- El #1425 afegeix la pestanya `Actual → Zenit`, KPIs de palanques i lectura de superintendent per vendre millor, operar millor i protegir marge.
- Aquesta fitxa #1829 baixa a la ruta viva i la incorpora al registre/inventari, perquè existia al sidebar però no al mapa de fitxes actual.

Reachability:
- `app/admin/docs/master/page.tsx` és ruta server real amb `dynamic = 'force-dynamic'`.
- `app/admin/docs/master/loading.tsx` existeix i renderitza `AdminPage` mentre carrega l'atles modular.
- `app/admin/lib/adminNav.ts` enllaça `Master Òrbita` dins Sistema com a secondary.
- Playwright autenticat renderitza `/admin/docs/master` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal de pàgina.

Component viu:
- `MasterAtlasPage` crida `loadMasterAtlas()` i mostra `AdminPage` amb KPIs (`Mòduls`, `Forts`, `En progrés`, `Palanques Zenit`, `Zenit pendents`).
- `MasterAtlasClient` és client component amb cercador, tabs `Mòduls`, `Actual → Zenit`, `Flux complet` i `Com intervenir`.
- Les cards mostren missió, pregunta del propietari, següent peça, riscos, validacions, rutes, fonts, visual routes, fitxers detectats i properes accions.
- Els enllaços de retorn porten a `/admin/docs/electric-atlas`, `/admin/docs/visual-audit`, `/admin/control` i `/admin/studio`.

APIs/serveis vius:
- No té API pròpia ni mutacions.
- `loadMasterAtlas()` combina `loadRepoElectricAtlas()` i `loadVisualAuditAtlas()` en paral·lel.
- `composeMasterAtlas()` aplica `MASTER_ATLAS_MODULES`, `MASTER_ATLAS_ACTUAL_TO_ZENIT`, `MASTER_ATLAS_PRINCIPLES` i `MASTER_ATLAS_GATES`.
- Depèn del baseline visual regenerable (`.codex-captures/visual-audit-1416-final`) a través de `visualAuditAtlasService`.

Dades que governa:
- No governa dades operatives; governa lectura transversal del sistema.
- En execució actual, el servei retorna 10 mòduls, 10 forts, 2.507 fitxers indexats, 94 rutes visuals, 20 properes accions pendents, 30 palanques Zenit i 27 d'impacte alt.
- Les fonts canòniques són `lib/constants/master-atlas.ts`, `repoElectricAtlasService`, `visualAuditAtlasService` i els docs/protocols de referència.

Accions que governa:
- Buscar mòduls, fitxers, rutes, riscos i palanques.
- Canviar de tab per veure mòduls, pont Actual→Zenit, flux complet i gates d'intervenció.
- Obrir atles elèctric, auditoria visual, control o Studio.
- No permet editar, validar ni executar cap acció operativa.

Òrgans veïns:
- upstream: `lib/constants/master-atlas.ts`, `lib/services/masterAtlasService.ts`, `repoElectricAtlasService`, `visualAuditAtlasService`, baseline visual i protocol.
- downstream: `/admin/docs/electric-atlas`, `/admin/docs/visual-audit`, `/admin/control`, `/admin/studio`, fitxes forenses pendents i decisions de roadmap Zenit.
- relació amb Atles elèctric: Master no és cens de fitxers; en resumeix el cablejat per capacitats de negoci.
- relació amb Full de ruta: Full de ruta és visió/fases; Master és consola viva de mòduls i palanques.

Codi mort / residu:
- No s'ha detectat route morta; la page és al sidebar però faltava al registre de fitxes.
- No hi ha CSS propi; usa classes canòniques `ap-card`, `ap-btn`, `ap-badge`, `adm-input` i tokens.

Duplicacions:
- `MASTER_ATLAS_MODULES` és un catàleg canònic propi del Master, no duplicació de nav: agrupa per capacitats i riscos.
- La pantalla duplica parcialment informació de docs/atles, però la seva funció és composar-la en un únic lloc consultable.

Hardcoded/residu visual:
- Els labels/tabs/copy són literals interns admin, acceptables de moment.
- En mòbil no hi ha overflow (`scrollWidth=390`) però la pantalla és molt llarga (`scrollHeight=11908`) perquè apila 10 mòduls complets. No és trencament, però sí deute de densitat si es vol convertir en eina diària.

Connexions interrompudes:
- Runtime OK: 200, shell present, sense overflow de pàgina, sense errors consola ni assets fallits.
- Connexió de fonts OK: el servei pot carregar atles elèctric i baseline visual; `visualAvailable=true`.
- Connexió de registre resolta en aquest tall: la ruta ja no queda invisible al mapa de fitxes.

Riscos:
- El Master pot envellir si `MASTER_ATLAS_MODULES` no s'actualitza quan es tanquen peces com #1421/#1422.
- El score `FORT` no equival a `TANCAT CHARLIE`: és un score de cobertura calculat, no validació visual humana.
- Si es toca `repoElectricAtlasService` o `visualAuditAtlasService`, el Master pot canviar de dades sense tocar la page.

Evidència d'auditoria:
- fitxers llegits: `app/admin/docs/master/page.tsx`, `app/admin/docs/master/MasterAtlasClient.tsx`, `app/admin/docs/master/loading.tsx`, `lib/services/masterAtlasService.ts`, `lib/constants/master-atlas.ts`, `__tests__/lib/services/masterAtlasService.test.ts`, refs #1420/#1422/#1425.
- captures Playwright autenticades: `.codex-captures/docs-master-1829/screenshots/001__admin-docs-master__desktop.png` i `.codex-captures/docs-master-1829/screenshots/002__admin-docs-master__mobile.png`.
- mètriques de captura: desktop/mobile 200, `horizontalOverflow=false`, `consoleErrors=[]`, `failedAssets=[]`; desktop `scrollHeight=5993`, mobile `scrollHeight=11908`.
- comprovació servei: `loadMasterAtlas()` actual retorna 10 mòduls forts, 2.507 fitxers indexats, 94 rutes visuals, 30 palanques Zenit i `visualAvailable=true`.
- proves/guards #1829: `audit:visual:admin` focalitzat OK sobre `/admin/docs/master`; `masterAtlasService` test 6/6 OK; `qa:no-dead-admin-views` OK; `npx tsc --noEmit --pretty false` OK; `qa:protocol` OK; `git diff --check` OK amb avisos CRLF aliens.

Decisio de treball:
- marcar `/admin/docs/master` com a fitxa FETA i afegir-la a inventari Sistema.
- no marcar `TANCAT CHARLIE`: queda decisió humana sobre si la densitat i la priorització de palanques són prou operatives.
- proper tall segur: `/admin/docs/electric-atlas` fitxa, perquè és l'altra ruta docs del sidebar que no constava al registre.

### `/admin/docs/electric-atlas`

Pantalla: Atles elèctric — escàner viu del repo real.
Ruta: `/admin/docs/electric-atlas`
Estat inventari: 🔴 (fitxa FETA #1830; validació visual humana pendent)
TANCAT CHARLIE: no — pendent validació visual/producte del propietari.
Estat fitxa: FETA (auditoria forense #1830, codex, 2026-07-09)

Història:
- El #1414 crea `/admin/docs/electric-atlas` i `repoElectricAtlasService`: fitxers, línies, caràcters, hashes, òrgans, símbols, imports, fetch, handlers, models i enums.
- El #1415 el converteix en manual operatiu viu: `Manual`, `Fluxos`, `On tocar`, `Glossari` i `Cables interns`, amb imports interns resolts i logs exclosos.
- El #1420 fa que el Master consumeixi aquest Atles com a font de cablejat.
- Aquesta fitxa #1830 incorpora la ruta al registre/inventari actual, perquè era visible al sidebar però no constava al mapa de fitxes.

Reachability:
- `app/admin/docs/electric-atlas/page.tsx` és ruta server real amb `dynamic = 'force-dynamic'`.
- `app/admin/docs/electric-atlas/loading.tsx` existeix i renderitza un skeleton amb `AdminPage`.
- `app/admin/lib/adminNav.ts` enllaça `Atles elèctric` dins Sistema com a secondary.
- Playwright autenticat renderitza `/admin/docs/electric-atlas` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal de pàgina.

Component viu:
- `ElectricAtlasPage` crida `loadRepoElectricAtlas()` i mostra KPIs (`Fitxers`, `Línies`, `Serveis`, `Models BD`).
- `ElectricAtlasClient` és client component amb cercador i tabs: `Manual`, `Fluxos`, `On tocar`, `Glossari`, `Cables interns`, `Circuit`, `Òrgans`, `Fitxers`, `Funcions`, `Cables`, `Rutes`, `BD`.
- Les taules limiten resultats a 350 i demanen filtrar per veure el cable exacte.
- La primera pantalla és síntesi mare, regles d'or i ús de l'atles; no arrenca en una taula massiva.

APIs/serveis vius:
- No té API pròpia ni mutacions.
- `loadRepoElectricAtlas()` recorre el filesystem del workspace, classifica òrgans i parseja fitxers de text.
- Detecta símbols, imports, `require`, dynamic imports, `fetch`, route handlers, models/enums Prisma i cables interns resolts.
- `lib/constants/repo-atlas.ts` conté extensions, carpetes excloses, patrons sensibles, fluxos, touchpoints, glossari i síntesi.

Dades que governa:
- No governa dades operatives; governa radiografia tècnica del repo en temps de render.
- En execució actual, el servei retorna 2.507 fitxers, 2.337 text files, 472.483 línies, 9.791 símbols, 8.505 cables, 380 handlers, 232 serveis, 64 models, 39 enums, 5 fluxos, 6 touchpoints, 11 termes de glossari i 4.671 cables interns.
- Exclou `.git`, `.next`, `node_modules`, `coverage`, `playwright-report`, `test-results`, `uploads`, `.codex-captures`, `.env*`, `*.log`, `*.pem`, `*.key`, `*.p12`.

Accions que governa:
- Buscar ruta, servei, funció, model, endpoint, hash, flux o concepte.
- Consultar fluxos de negoci i punts segurs d'intervenció.
- Consultar cens tècnic de fitxers, funcions, cables, handlers i models.
- No permet editar codi, executar scripts ni mutar dades.

Òrgans veïns:
- upstream: filesystem del repo, `repoElectricAtlasService`, `repo-atlas`.
- downstream: `/admin/docs/master`, fitxes forenses, protocol, futures IAs i qualsevol tall que necessiti trobar el cable exacte.
- relació amb Master: Atles elèctric és la radiografia de cables; Master és la lectura modular/Zenit que la consumeix.
- relació amb Visual Audit: Atles diu on tocar; Visual Audit diu com renderitza.

Codi mort / residu:
- No s'ha detectat route morta; faltava només registrar-la al mapa actual.
- No hi ha CSS propi; usa components/classes canòniques admin.

Duplicacions:
- No duplica el Master: l'Atles és cens/cablejat detallat, el Master és síntesi modular.
- El glossari/touchpoints dupliquen parcialment coneixement del protocol, però ho fan en forma de catàleg canònic `repo-atlas` consumit per servei i UI.

Hardcoded/residu visual:
- Labels/tabs/copy són literals interns admin, acceptables de moment.
- Les taules amples tenen `overflow-x-auto` i `min-w-[56rem]`; en tabs de cens caldrà validar manualment si la lectura mòbil és prou útil, però el manual inicial no desborda.

Connexions interrompudes:
- Runtime OK: 200, shell present, sense overflow de pàgina, sense errors consola ni assets fallits.
- Connexió de seguretat OK en test: `.env.local`, logs i `node_modules` no s'exposen.
- Connexió de registre resolta en aquest tall: la ruta ja no queda invisible al mapa de fitxes.

Riscos:
- És lectura filesystem en render server; si el repo creix molt, pot pesar en temps de render.
- És una radiografia heurística: detecta patrons, no substitueix lectura humana del codi abans de modificar.
- Si s'afegeixen nous tipus de secrets o generats, cal actualitzar `REPO_ATLAS_EXCLUDED_DIRS` / `REPO_ATLAS_SENSITIVE_FILE_PATTERNS`.

Evidència d'auditoria:
- fitxers llegits: `app/admin/docs/electric-atlas/page.tsx`, `ElectricAtlasClient.tsx`, `loading.tsx`, `lib/services/repoElectricAtlasService.ts`, `lib/constants/repo-atlas.ts`, `__tests__/lib/services/repoElectricAtlasService.test.ts`, refs #1414/#1415/#1420.
- captures Playwright autenticades: `.codex-captures/docs-electric-atlas-1830/screenshots/001__admin-docs-electric-atlas__desktop.png` i `.codex-captures/docs-electric-atlas-1830/screenshots/002__admin-docs-electric-atlas__mobile.png`.
- mètriques de captura: desktop/mobile 200, `horizontalOverflow=false`, `consoleErrors=[]`, `failedAssets=[]`.
- comprovació servei: `loadRepoElectricAtlas()` actual retorna 2.507 fitxers, 472.483 línies, 8.505 cables, 4.671 cables interns i exclusions de secrets/generats.
- proves/guards #1830: `audit:visual:admin` focalitzat OK sobre `/admin/docs/electric-atlas`; `repoElectricAtlasService` test 3/3 OK; `qa:no-dead-admin-views` OK; `npx tsc --noEmit --pretty false` OK; `qa:protocol` OK; `git diff --check` OK amb avisos CRLF aliens.

Decisio de treball:
- marcar `/admin/docs/electric-atlas` com a fitxa FETA i afegir-la a inventari Sistema.
- no marcar `TANCAT CHARLIE`: queda validació visual humana, especialment tabs de taules amples.
- proper tall segur: amb docs Sistema principals registrats, sanejar llegibilitat mòbil compartida (`MarkdownView`) o seguir registre de rutes que encara no consten al mapa.

### `/admin/docs/esquema`

Pantalla: Esquema absolut — radiografia interna de cables, òrgans i funcions.
Ruta: `/admin/docs/esquema`
Estat inventari: 🔴 (fitxa FETA #1826; taules mòbil apilades #1831; validació visual humana pendent)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1826, codex, 2026-07-09)

Història:
- El #965 crea `docs/admin-esquema-absolut.md`, la page `/admin/docs/esquema` i l'entrada secondary al sidebar de Sistema.
- Aquesta fitxa #1826 baixa a la ruta viva i comprova que continua sent un viewer server del document, no un editor ni una API.

Reachability:
- `app/admin/docs/esquema/page.tsx` és ruta server real amb `dynamic = 'force-dynamic'`.
- `app/admin/docs/esquema/loading.tsx` existeix amb skeleton tokenitzat.
- `app/admin/lib/adminNav.ts` enllaça `Esquema absolut` dins Sistema com a secondary.
- `docs/admin-esquema-absolut.md` existeix i és el contingut carregat.
- Playwright autenticat renderitza `/admin/docs/esquema` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal de pàgina.

Component viu:
- `readDoc()` fa `fs.readFile(path.join(process.cwd(), 'docs', 'admin-esquema-absolut.md'), 'utf-8')` i retorna `null` si falla.
- `EsquemaPage` renderitza `AdminPage title="Esquema absolut"` i, si hi ha markdown, una `ap-card` amb `MarkdownView`.
- Si falta el fitxer, mostra `AdminEmptyState` amb el nom exacte del document.
- `MarkdownView` és shared a `app/admin/docs/MarkdownView.tsx` i cobreix headings, taules, llistes, blockquote, code fence, hr, paràgrafs i inline code/bold.

APIs/serveis vius:
- No té API pròpia ni mutacions.
- No toca Prisma, Settings ni cap servei de domini.
- La font de veritat és el fitxer local `docs/admin-esquema-absolut.md`.

Dades que governa:
- No governa dades operatives; governa lectura interna/documental.
- El contingut documenta òrgans, rutes, cables de navegació, UI→API, serveis i cables solts detectats en aquell moment.

Accions que governa:
- Llegir la radiografia de cables dins admin.
- Fallback visible si falta el document.
- No permet editar, validar ni executar cap acció operativa.

Òrgans veïns:
- upstream: `docs/admin-esquema-absolut.md` i `MarkdownView`.
- downstream: altres docs admin (`/admin/docs/organisme`, `/admin/docs/full-de-ruta`, `/admin/docs/protocol`, `/admin/docs/visual-audit`).
- relació amb Manual/Protocol: és memòria tècnica visual; no substitueix el protocol normatiu ni el manual operatiu.

Codi mort / residu:
- No s'ha detectat component orfe ni route morta.
- `loading.tsx` és local i correcte; no reutilitza skeleton global, però està tokenitzat i curt.

Duplicacions:
- El patró `fs.readFile(...docs/*.md) + MarkdownView` es repeteix a altres docs (`organisme`, `full-de-ruta`). És duplicació tolerable però candidata a helper si es toca el conjunt.
- La navegació de docs secondary ve de `adminNav`; no hi ha catàleg local a la page.

Hardcoded/residu visual:
- El títol/subtítol de page són literals interns admin, acceptables de moment.
- El #1831 fa que les taules del `MarkdownView` es renderitzin en mòbil com a files apilades amb etiqueta/valor, sense scroll-x obligatori. Queda validació humana de lectura final, especialment en documents molt llargs.

Connexions interrompudes:
- Runtime OK: 200, shell present, sense overflow de pàgina, sense errors consola ni assets fallits.
- Connexió de contingut OK: el document existeix i es renderitza.
- Llegibilitat mòbil incompleta per contingut ample, no per ruta morta.

Riscos:
- Tocar `MarkdownView` afecta totes les rutes `/admin/docs/*`; el #1831 ja recaptura Esquema, Full de ruta i Organisme. Futurs retocs del renderer han de repetir aquest set.
- Convertir aquesta page en editor duplicaria responsabilitats de repo/docs; ha de continuar read-only.

Evidència d'auditoria:
- fitxers llegits: `app/admin/docs/esquema/page.tsx`, `app/admin/docs/esquema/loading.tsx`, `app/admin/docs/MarkdownView.tsx`, `app/admin/lib/adminNav.ts`, `docs/admin-esquema-absolut.md`, refs #965.
- captures Playwright autenticades: `.codex-captures/docs-esquema-1826/screenshots/001__admin-docs-esquema__desktop.png` i `.codex-captures/docs-esquema-1826/screenshots/002__admin-docs-esquema__mobile.png`.
- mètriques de captura: desktop/mobile 200, `horizontalOverflow=false`, `consoleErrors=[]`, `failedAssets=[]`; desktop `scrollHeight=4166`, mobile `scrollHeight=4564`.
- proves/guards #1826: `audit:visual:admin` focalitzat OK sobre `/admin/docs/esquema`; `qa:no-dead-admin-views` OK; `npx tsc --noEmit --pretty false` OK; `qa:protocol` OK; `git diff --check` OK amb avisos CRLF aliens.

Decisio de treball:
- marcar `/admin/docs/esquema` com a fitxa FETA, no com a `TANCAT CHARLIE`.
- el #1831 resol el pitjor de taules mòbil amb render apilat; queda validació visual humana.

### `/admin/docs/full-de-ruta`

Pantalla: Meta + Full de ruta — zenit de producte i camí per fases.
Ruta: `/admin/docs/full-de-ruta`
Estat inventari: 🔴 (fitxa FETA #1827; taules mòbil apilades #1831; validació visual humana pendent)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1827, codex, 2026-07-09)

Història:
- El #963 crea `docs/producte-zenit-full-de-ruta.md`, la page `/admin/docs/full-de-ruta` i mou `MarkdownView` a `app/admin/docs/` per compartir renderer amb altres docs.
- El #964 ajusta el document a la realitat sense banc/pagaments automàtics: cobrament, pagament i facturació queden aparcats fins formalització.
- El #965 confirma accessibilitat admin i afegeix l'entrada secondary al sidebar de Sistema.
- Aquesta fitxa #1827 baixa a la ruta viva i comprova que és visor estratègic read-only, no superfície operativa ni editor.

Reachability:
- `app/admin/docs/full-de-ruta/page.tsx` és ruta server real amb `dynamic = 'force-dynamic'`.
- `app/admin/docs/full-de-ruta/loading.tsx` existeix amb skeleton tokenitzat i `aria-busy`.
- `app/admin/lib/adminNav.ts` enllaça `Full de ruta` dins Sistema com a secondary.
- `docs/producte-zenit-full-de-ruta.md` existeix i és el contingut carregat.
- Playwright autenticat renderitza `/admin/docs/full-de-ruta` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal de pàgina.

Component viu:
- `readDoc()` fa `fs.readFile(path.join(process.cwd(), 'docs', 'producte-zenit-full-de-ruta.md'), 'utf-8')` i retorna `null` si falla.
- `FullDeRutaPage` renderitza `AdminPage title="Meta + Full de ruta"` i, si hi ha markdown, una `ap-card mx-auto max-w-[64rem]` amb `MarkdownView`.
- Si falta el fitxer, mostra `AdminEmptyState` amb el nom exacte `docs/producte-zenit-full-de-ruta.md`.
- `MarkdownView` és el mateix renderer compartit per docs admin: headings, taules, llistes, blockquote, code fence, hr, paràgrafs i inline code/bold.

APIs/serveis vius:
- No té API pròpia ni mutacions.
- No toca Prisma, Settings, lead, booking, pricing ni cap servei de domini.
- La font de veritat és el fitxer local `docs/producte-zenit-full-de-ruta.md`.

Dades que governa:
- No governa dades operatives; governa lectura estratègica del producte zenit.
- El document ordena diagnòstic expert, meta idealitzada, fases per impacte, quick wins, riscos, ritme de treball i decisions obertes.
- És mapa de producte, no source of truth de pressupostos, reserves, catàleg, preus ni liquidacions.

Accions que governa:
- Llegir el full de ruta des de l'admin.
- Fallback visible si falta el document.
- No permet editar, validar, acceptar ni executar cap decisió operativa.

Òrgans veïns:
- upstream: `docs/producte-zenit-full-de-ruta.md` i `MarkdownView`.
- downstream: altres docs admin (`/admin/docs/esquema`, `/admin/docs/organisme`, `/admin/docs/protocol`, `/admin/docs/visual-audit`) i el treball de roadmap que es decideixi convertir en talls concrets.
- relació amb Protocol: el full de ruta orienta prioritats; el protocol continua sent la norma de canvi.
- relació amb Manual: no substitueix operativa diària ni checklists.

Codi mort / residu:
- No s'ha detectat component orfe ni route morta.
- `loading.tsx` és local i correcte; comparteix patró amb altres docs però sense duplicar lògica de negoci.

Duplicacions:
- El patró `fs.readFile(...docs/*.md) + MarkdownView` es repeteix a Esquema i Organisme. És acceptable mentre hi ha poques rutes, però candidat a helper quan es revisi el conjunt `/admin/docs/*`.
- Hi ha diversos documents de tesi/roadmap al repo; aquesta ruta apunta al mestre de producte zenit (`docs/producte-zenit-full-de-ruta.md`) i no ha de convertir-se en un segon catàleg de decisions.

Hardcoded/residu visual:
- El títol/subtítol de page són literals interns admin, acceptables de moment.
- En mòbil el layout no desborda la pàgina. El #1831 fa que les taules del `MarkdownView` es renderitzin com a files etiqueta/valor; el document continua sent llarg i queda validació humana de densitat.

Connexions interrompudes:
- Runtime OK: 200, shell present, sense overflow de pàgina, sense errors consola ni assets fallits.
- Connexió de contingut OK: el document existeix i es renderitza.
- No hi ha cable d'edició ni sincronització automàtica cap a backlog; convertir decisions obertes en feina continua sent manual/protocolitzat.

Riscos:
- Tocar `MarkdownView` afecta totes les rutes `/admin/docs/*`; el #1831 ja recaptura Esquema, Full de ruta i Organisme.
- Fer del full de ruta un editor o checklist viu duplicaria protocol, manual i roadmap docs; ha de continuar read-only fins que es dissenyi un òrgan específic.
- Les decisions obertes del document poden quedar obsoletes; si es fan talls executius, cal actualitzar el document o registrar la resolució al protocol.

Evidència d'auditoria:
- fitxers llegits: `app/admin/docs/full-de-ruta/page.tsx`, `app/admin/docs/full-de-ruta/loading.tsx`, `app/admin/docs/MarkdownView.tsx`, `app/admin/lib/adminNav.ts`, `docs/producte-zenit-full-de-ruta.md`, refs #963/#964/#965.
- captures Playwright autenticades: `.codex-captures/docs-full-de-ruta-1827/screenshots/001__admin-docs-full-de-ruta__desktop.png` i `.codex-captures/docs-full-de-ruta-1827/screenshots/002__admin-docs-full-de-ruta__mobile.png`.
- mètriques de captura: desktop/mobile 200, `horizontalOverflow=false`, `consoleErrors=[]`, `failedAssets=[]`.
- proves/guards #1827: `audit:visual:admin` focalitzat OK sobre `/admin/docs/full-de-ruta`; `qa:no-dead-admin-views` OK; `npx tsc --noEmit --pretty false` OK; `qa:protocol` OK; `git diff --check` OK amb avisos CRLF aliens.

Decisio de treball:
- marcar `/admin/docs/full-de-ruta` com a fitxa FETA, no com a `TANCAT CHARLIE`.
- el #1831 resol el pitjor de taules mòbil amb render apilat; queda validació visual humana de densitat global.

### `/admin/docs/organisme`

Pantalla: Atles de l'organisme — mapa viu front/back de l'admin com a sistema.
Ruta: `/admin/docs/organisme`
Estat inventari: 🔴 (fitxa FETA #1828; taules mòbil apilades #1831; Atles v1 amb cobertura API/serveis incompleta)
TANCAT CHARLIE: no — pendent validació visual del propietari i v2 de fonament API/serveis.
Estat fitxa: FETA (auditoria forense #1828, codex, 2026-07-09)

Història:
- El #961 crea `docs/admin-organisme-atles.md` com a atles viu: inventari de rutes, frontissa front/back, duplicacions D1-D8, arquitectura objectiu i pla d'embut.
- El #962 crea `/admin/docs/organisme` perquè l'atles es pugui consultar dins admin i no només com a fitxer.
- El #963 mou `MarkdownView` a `app/admin/docs/` i el comparteix amb Full de ruta.
- El #965 confirma accessibilitat admin i afegeix Atles/Esquema/Full de ruta al sidebar de Sistema.
- Aquesta fitxa #1828 baixa a la ruta viva i comprova que continua sent viewer documental, no editor ni òrgan operatiu.

Reachability:
- `app/admin/docs/organisme/page.tsx` és ruta server real amb `dynamic = 'force-dynamic'`.
- `app/admin/docs/organisme/loading.tsx` existeix amb skeleton tokenitzat i `aria-busy`.
- `app/admin/lib/adminNav.ts` enllaça `Atles` dins Sistema com a secondary.
- `docs/admin-organisme-atles.md` existeix i és el contingut carregat.
- Playwright autenticat renderitza `/admin/docs/organisme` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal de pàgina.

Component viu:
- `readAtles()` fa `fs.readFile(path.join(process.cwd(), 'docs', 'admin-organisme-atles.md'), 'utf-8')` i retorna `null` si falla.
- `OrganismeAtlesPage` renderitza `AdminPage title="Atles de l'organisme"` i, si hi ha markdown, una `ap-card mx-auto max-w-[64rem]` amb `MarkdownView`.
- Si falta el fitxer, mostra `AdminEmptyState` amb el nom exacte `docs/admin-organisme-atles.md`.
- `MarkdownView` és el renderer compartit per docs admin.

APIs/serveis vius:
- No té API pròpia ni mutacions.
- No toca Prisma, Settings, lead, booking, pricing ni cap servei de domini.
- La font de veritat és el fitxer local `docs/admin-organisme-atles.md`.

Dades que governa:
- No governa dades operatives; governa lectura sistèmica i criteri d'auditoria.
- El document declara explícitament la seva cobertura v1: pàgines/rutes inventariades, però API, serveis, models Prisma, crons i components no auditats a fons.
- L'Atles és prerequisit conceptual per filtrar peces, però no substitueix la fitxa forense de cada pantalla ni el protocol.

Accions que governa:
- Llegir l'atles de l'organisme dins admin.
- Fallback visible si falta el document.
- No permet editar, validar ni executar cap acció operativa.

Òrgans veïns:
- upstream: `docs/admin-organisme-atles.md` i `MarkdownView`.
- downstream: fitxes de pantalles, inventari admin, protocol d'embut i altres docs (`/admin/docs/esquema`, `/admin/docs/full-de-ruta`, `/admin/docs/protocol`, `/admin/docs/visual-audit`).
- relació amb Esquema absolut: l'Atles dona mapa d'òrgans i diagnòstic; l'Esquema baixa a cables tècnics.
- relació amb Full de ruta: l'Atles diu què hi ha; Full de ruta diu cap on portar-ho.

Codi mort / residu:
- No s'ha detectat component orfe ni route morta.
- No existeix ja el duplicat local antic de `MarkdownView` dins `organisme`; la page importa el shared.

Duplicacions:
- Mateix patró `fs.readFile(...docs/*.md) + MarkdownView` que Esquema i Full de ruta.
- El document cita navegació antiga i fonts històriques (`nav-items.ts`) dins la seva història; la ruta actual consumeix `app/admin/lib/adminNav.ts`.

Hardcoded/residu visual:
- El títol/subtítol de page són literals interns admin, acceptables de moment.
- En mòbil no hi ha overflow global. El #1831 converteix les taules del `MarkdownView` en files apilades etiqueta/valor; l'Atles queda molt llarg (`scrollHeight=24550` a captura #1831), però cada fila és inspeccionable sense scroll-x.

Connexions interrompudes:
- Runtime OK: 200, shell present, sense overflow de pàgina, sense errors consola ni assets fallits.
- Connexió de contingut OK: el document existeix i es renderitza.
- Connexió de governança parcial: l'Atles v1 diu que falta v2 real de capa API/serveis/dades; no s'ha de vendre com a mapa totalment complet.

Riscos:
- Marcar l'Atles com a `TANCAT CHARLIE` seria fals mentre el propi document declara cobertura incompleta de fontaneria.
- Tocar `MarkdownView` afecta totes les rutes `/admin/docs/*`; el #1831 ja recaptura Esquema, Full de ruta i Organisme.
- Fer editable l'Atles dins admin duplicaria protocol/docs i obriria risc de perdre història de repo.

Evidència d'auditoria:
- fitxers llegits: `app/admin/docs/organisme/page.tsx`, `app/admin/docs/organisme/loading.tsx`, `app/admin/docs/MarkdownView.tsx`, `app/admin/lib/adminNav.ts`, `docs/admin-organisme-atles.md`, refs #961/#962/#963/#965.
- captures Playwright autenticades: `.codex-captures/docs-organisme-1828/screenshots/001__admin-docs-organisme__desktop.png` i `.codex-captures/docs-organisme-1828/screenshots/002__admin-docs-organisme__mobile.png`.
- mètriques de captura: desktop/mobile 200, `horizontalOverflow=false`, `consoleErrors=[]`, `failedAssets=[]`; desktop `scrollHeight=9258`, mobile `scrollHeight=10191`.
- proves/guards #1828: `audit:visual:admin` focalitzat OK sobre `/admin/docs/organisme`; `qa:no-dead-admin-views` OK; `npx tsc --noEmit --pretty false` OK; `qa:protocol` OK; `git diff --check` OK amb avisos CRLF aliens.

Decisio de treball:
- marcar `/admin/docs/organisme` com a fitxa FETA, no com a `TANCAT CHARLIE`.
- el #1831 resol el pitjor de taules mòbil amb render apilat; queda validar si la longitud de l'Atles en mòbil és acceptable per ús real.

### `/admin/analytics`

Pantalla: Panell de rendiment — analítica comercial, GA4, Ads i GTM.
Ruta: `/admin/analytics`
Estat inventari: 🔴 (fitxa FETA #1832; tendència GA4 sparse resolta #1835; validació visual humana pendent)
TANCAT CHARLIE: no — pendent revisió visual/producte del propietari.
Estat fitxa: FETA (auditoria forense #1832, codex, 2026-07-09)

Història:
- Forma part de l'òrgan Comandament documentat al #1156, però la fila pròpia del registre continuava `PENDENT`.
- El #1416 ja va corregir un warning real de React per `key` duplicada en llistes GA4 i va recapturar Analytics 3/3 dins l'auditoria visual global.
- Aquesta fitxa #1832 baixa a la ruta viva actual i separa el que és mètrica pròpia, connector extern i deute visual.
- El #1835 resol el P2 visual del card `Tendència 30 dies`: quan GA4 és escàs o zero, deixa de semblar una caixa buida.

Reachability:
- `app/admin/analytics/page.tsx` és server route real amb `dynamic = 'force-dynamic'`.
- `app/admin/analytics/loading.tsx` reutilitza `AdminLoadingSkeletonDashboard`.
- `scripts/admin-visual-audit.mjs` classifica `/admin/analytics` dins `Comandament`.
- Playwright autenticat renderitza `/admin/analytics` en desktop 1440 i mòbil 390 sense error JS ni overflow horitzontal de pàgina.

Component viu:
- `AnalyticsPage` renderitza `AdminPage title="Panell de rendiment"`.
- El bloc operatiu mostra entrades 7 dies, % a pressupost, % pressupostos acceptats i primer contacte mitjà.
- El bloc GA4 mostra estat de propietat, KPIs, tendència compacta de 30 dies, pàgines, fonts, realtime i paraules de cerca quan `getGa4ConfigStatus().ready`.
- El bloc Google Ads mostra estat/config pendent o dades de paid media quan `getGoogleAdsConfigStatus().ready`.
- El final conserva KPIs de facturació/reserves/tiquet/NPS, entrades per origen, conversió, reserves per tipus i GTM.

APIs/serveis vius:
- No té API pròpia.
- Fa queries Prisma directes dins la page (`lead`, `booking`, `proposal`, `clientSurvey`).
- Consumeix `lib/analytics/ga4.ts` (`getGa4ConfigStatus`, `getGa4Report`) i `lib/analytics/google-ads.ts` (`getGoogleAdsConfigStatus`, `getGoogleAdsReport`).
- Usa helpers canònics `formatNumber`, `getEventTypeDisplay`, `getLeadStatusAnalyticsDisplay`, `getSourceDisplay` i ajuda contextual `ADMIN_ANALYTICS_HELP`.

Dades que governa:
- No governa dades; llegeix i agrega mètriques.
- Fonts internes: Leads, Bookings, Proposals i ClientSurvey.
- Fonts externes condicionals: GA4 Data API, Google Ads API i GTM env.
- En captura #1832 GA4 està actiu (`GA4_PROPERTY_ID` visible), Google Ads queda pendent per variables i GTM està actiu.

Accions que governa:
- Obrir leads filtrats dels últims 7 dies.
- Obrir Google Ads en pestanya externa.
- Obrir Google Tag Manager, Tag Assistant i guies de GTM.
- No permet mutar dades, canviar configuració ni enviar res.

Òrgans veïns:
- upstream: Captació/Leads, Proposals, Bookings, ClientSurvey, GA4, Google Ads, GTM.
- downstream: Marketing Hub, Reporting, Control complet, Settings Integrations i decisions de captació.
- No duplica Marketing Hub: Analytics mostra números; Marketing diagnostica canals/gaps i decideix acció.
- No duplica Economia: els ingressos són lectura de rendiment, no motor de marge/cash.

Codi mort / residu:
- No s'ha detectat route morta.
- `revenueByMonth` encara és `Promise.resolve([])`: no es mostra gràfic de facturació mensual des d'aquesta ruta.
- El component és molt llarg i concentra queries, càlculs i JSX en un sol fitxer; és deute de manteniment, no P1 si la ruta renderitza.

Duplicacions:
- GA4 també es consumeix a dashboard/control i Marketing Hub; el connector està cachejat a `lib/analytics/ga4.ts`, per tant no és duplicació de client.
- La lectura d'entrades/reserves solapa amb Reporting/Economia, però amb intenció de panell de rendiment i no de veritat econòmica.

Hardcoded/residu visual:
- Copy i labels són interns admin, acceptables de moment.
- Resolt #1835: el card `Tendència 30 dies` mostra dies actius, pics de sessions/usuaris i una franja compacta de dies amb activitat; si la sèrie és zero, mostra empty state `role=status`.
- La page usa `rounded-2xl` en alguns cards antics; queda pendent migració visual fina.

Connexions interrompudes:
- Runtime OK: 200, shell present, sense overflow de pàgina, sense errors consola ni assets fallits.
- GA4 OK en captures #1832/#1835: KPIs reals carregats; tendència sparse ja no queda visualment buida.
- Google Ads pendent en captura #1832: falten variables `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_REFRESH_TOKEN` o OAuth d'integracions.

Riscos:
- Fer queries Prisma i connectors externs directament a la page la pot fer pesada; el #1177 va cachejar GA4, però la resta continua concentrada.
- No convertir el YoY `100.0%` en lectura de veritat absoluta quan l'any anterior és zero.
- No obrir Ads/ROI sense configurar correctament tokens externs i el bloqueig del roadmap de captació.

Evidència d'auditoria:
- fitxers llegits: `app/admin/analytics/page.tsx`, `app/admin/analytics/loading.tsx`, `lib/analytics/ga4.ts`, `lib/analytics/google-ads.ts`, `adminHelpContent`, refs #1156/#1416/#1177.
- captures Playwright autenticades: `.codex-captures/analytics-1832/screenshots/001__admin-analytics__desktop.png`, `.codex-captures/analytics-1832/screenshots/002__admin-analytics__mobile.png`, `.codex-captures/analytics-1835/screenshots/001__admin-analytics__desktop.png` i `.codex-captures/analytics-1835-mobile-full/screenshots/001__admin-analytics__mobile.png`.
- mètriques de captura: desktop/mobile 200, `horizontalOverflow=false`, `consoleErrors=[]`, `failedAssets=[]`.
- proves/guards #1835: `pnpm test:run -- --run __tests__\app\admin\analytics\trend-empty-state.test.ts` OK (1/1); `npx tsc --noEmit --pretty false` OK; `audit:visual:admin` focalitzat desktop/mobile OK; captura mòbil full-page OK.

Decisio de treball:
- marcar `/admin/analytics` com a fitxa FETA, no com a `TANCAT CHARLIE`.
- proper tall segur: si es toca Analytics, extraure helpers de dades abans de refactors més grans o revisar validació visual humana de tota la pàgina.

### `/admin/text-manager`

Pantalla: Textos PRO — editor de copy multidioma del web i dossiers.
Ruta: `/admin/text-manager`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1779, codex, 2026-07-09)

Història:
- La pantalla neix com a editor dens de textos públics i evoluciona cap a workspace PRO de contingut.
- El #953 va portar la copy del dossier a `messages.dossier.*` i la va fer editable des de Text Manager.
- El #1063 va endurir `PUT/POST /api/admin/text-manager` amb permís `mutate` i CSRF abans de llegir body.
- El #1779 documenta el codi viu actual: full-screen editor propi, no una page `AdminPage`.

Reachability:
- `app/admin/text-manager/layout.tsx` envolta la ruta i bloqueja rols no editorials amb `canManageContent(role)`.
- `app/admin/text-manager/page.tsx` és client component full-screen.
- `app/admin/text-manager/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/admin/text-manager/text-manager-config.ts` defineix seccions i idiomes visibles.
- `app/api/admin/text-manager/route.ts` és la route viva de lectura, desat i accions administratives.
- Marketing Hub i Manual apunten a `/admin/text-manager` com a eina editorial.

Component viu:
- `TextManagerPage`: carrega `/api/admin/text-manager`, manté textos `es/ca/en`, originals, idioma actiu, secció, cerca, filtres, errors i estat de desat.
- La UI té header sticky propi amb idioma, cerca, filtre de modificats i CTA `Desar`.
- Sidebar de seccions basada en `SECTIONS`, amb comptadors total/modificat.
- El cos agrupa textos per clau i renderitza `textarea` autoalçats amb botó `Revertir` per camp modificat.
- `handleSave()` detecta canvis de l'idioma actiu, crida `/api/admin/translate` per autotraduir i desa els tres idiomes amb tres `PUT /api/admin/text-manager`.

CSS viu:
- No hi ha CSS local separat.
- Usa tokens globals `--o-admin-canvas`, `--line`, `--raised`, `--panel`, `--t*`, `.ap-btn`, `admin-tone-*`, `adm-row-hover` i utilitats Tailwind puntuals.
- És una pantalla full-viewport (`h-screen`) amb scroll independent a sidebar i main.
- Inventari continua `🔴` perquè no hi ha validació visual propietari ni tancament formal de migració.

APIs/serveis vius:
- `GET /api/admin/text-manager`: `requireAuth(req)`, `canManageContent(getAdminRole(req))` i `getTextManagerPayload()`.
- `PUT /api/admin/text-manager`: `requireAuth`, `requirePermission(req, 'mutate')`, `verifyCsrf`, `saveTextManagerModifications()`.
- `POST /api/admin/text-manager`: `requireAuth`, `requirePermission(req, 'mutate')`, `verifyCsrf`, `runTextManagerAction(action)`.
- `lib/services/textManagerService.ts`: llegeix `messages/es.json`, `messages/ca.json`, `messages/en.json`, aplana JSON, carrega overrides de `Translation`, desa amb `prisma.translation.upsert` dins `$transaction`.
- Accions server: `sync`, `export`, `validate`, `restore` desactivat i acció desconeguda amb 400.

Dades que governa:
- Base de lectura: `messages/*.json`.
- Overrides persistents: taula `Translation` (`namespace`, `key`, `locale`, `value`, `isAutoTranslated`, `lastManualEdit`).
- Seccions editorials: `SECTIONS` amb paths de dossier, hero, home, packs, serveis, CTA, FAQ, temàtiques, testimonials, portfolio, SEO, contacte, mòbil, pàgines, nav, footer, recursos, admin, common i privacitat.
- Idiomes de treball: `ca`, `es`, `en`.

Accions que governa:
- Filtrar per secció, idioma, cerca i només modificats.
- Editar camps de text.
- Revertir un camp al valor original carregat.
- Desar canvis amb autotraducció prèvia i persistència a BD.
- La route pot fer `sync/export/validate`, però la page viva actual no mostra botons per aquestes accions POST.

Òrgans veïns:
- upstream: `messages/*.json`, taula `Translation`, `/api/admin/translate`, permisos admin i CSRF.
- downstream: web públic, dossiers, animació, SEO, CTAs, formularis, mobile i qualsevol consumidor de `messages`/traduccions.
- relació amb Dossiers: la copy editorial del dossier es governa aquí, però el render final viu als builders i serveis de dossier.
- relació amb Marketing Hub: Marketing deriva cap a Text Manager quan el problema és copy/canal.

Codi mort relacionat:
- Cap arrel morta detectada: page, layout, config, route i servei tenen consumidors.
- Història obsoleta: el protocol #316 parlava d'`OwnerControlStrip`, però el `page.tsx` viu actual no l'importa ni el renderitza.
- `POST /api/admin/text-manager` està testat però no té botó visible a la page actual; pot ser API operativa latent.

Duplicacions:
- Els JSON base i la taula `Translation` conviuen: el servei resol base + overrides, no escriu de tornada als JSON.
- La page manté tres estats paral·lels per idioma i tres originals; potent però fràgil si s'afegeixen més locales.
- `SECTIONS` duplica coneixement de namespaces de `messages`; si els namespaces canvien, cal actualitzar el config.

Hardcoded/residu visual:
- Copy admin local acceptable; la pantalla edita contingut públic, però el chrome és admin.
- `text-manager-config.ts` conté icones emoji i gradients locals de secció; alguns `color` no s'usen a la page actual.
- Hi ha utilitats Tailwind puntuals en una pantalla full-screen, però sense inline styles prohibits.

Connexions interrompudes:
- Resolt #1780: el `GET /api/admin/text-manager` aplica la mateixa frontera editorial que el layout; `VIEWER` no carrega el catàleg de textos.
- Resolt #1781: loading, error inicial, banner d'error i banner d'èxit tenen `role`/`aria-live` explícit.
- P2 contracte latent: `POST sync/export/validate` existeix i es prova, però no queda exposat a la UI actual.

Riscos:
- Un desat pot afectar molts textos públics i dossiers; per això el circuit de permisos/CSRF és crític.
- L'autotraducció silenciosament fallida fa fallback al mateix text en tots els idiomes; pot deixar copy duplicada sense avis específic.
- Dependre de paths de `SECTIONS` sense guard pot deixar namespaces nous amagats a `common` o mal agrupats.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/text-manager/page.tsx`, `layout.tsx`, `loading.tsx`, `text-manager-config.ts`, `app/api/admin/text-manager/route.ts`, `lib/services/textManagerService.ts`.
- tests llegits/actualitzats: `__tests__/app/api/admin/text-manager-route.test.ts`, `__tests__/lib/services/textManagerService.test.ts`, `__tests__/app/admin/text-manager/TextManagerPage.test.tsx`.
- consumidors verificats amb `rg`: `/admin/text-manager`, `Text Manager`, `textManagerService`, `Translation`, Dossiers, Marketing Hub i Manual.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`. Frontera GET/API resolta al #1780 amb test de route i servei 20/20 + TypeScript; alertes accessibles resoltes al #1781 amb test focalitzat 21/21 + TypeScript.

Decisio de treball:
- conservar `/admin/text-manager` com a editor PRO de copy multidioma amb overrides a BD.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visualment la pantalla.
- proper tall recomanat: decidir si les accions `sync/export/validate` han de tenir UI visible o quedar només com a API operativa latent.

### `/admin/features`

Pantalla: Funcionalitats — toggles de feature flags admin.
Ruta: `/admin/features`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1777, codex, 2026-07-09)

Història:
- La pantalla concentra flags funcionals amb intenció de governar seccions públiques del web.
- El catàleg canònic viu a `ADMIN_FEATURE_DEFINITIONS`.
- Les flags es persisteixen com a settings booleanes (`Setting.key = features.*`).
- La fitxa #1777 documenta una frontera important: avui el panell escriu settings, però no s'ha trobat consumidor públic de `features.*`.

Reachability:
- `app/admin/features/page.tsx` és ruta Next real i client component.
- `app/admin/features/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/api/admin/features/route.ts` és la route admin viva de lectura/desat.
- `app/admin/lib/adminNav.ts` no enllaça Features al menú principal actual, però `getGroupForPath()` el classifica com a Sistema per fallback.
- `lib/constants/adminManual.ts` referencia Features com a eina de govern de sistema.

Component viu:
- `FeaturesPage`: carrega `/api/admin/features`, manté `features`, `loading`, `fetchError` i `saving`.
- Mostra tres KPIs: total, actives i desactivades.
- Renderitza una card per flag amb label, description, icon i botó `role="switch"`.
- `toggleFeature()` fa POST amb `fetchWithCsrf`, espera `{ ok: true }`, actualitza estat local i mostra toast.
- La càrrega inicial té timeout local de 15 segons i error state amb `AdminEmptyState` + `Reintentar`.

CSS viu:
- No hi ha CSS local de `/admin/features`.
- Usa `AdminPage`, `AdminEmptyState`, `.ap-card`, `.ap-btn`, `admin-tone-*` i utilitats Tailwind puntuals.
- `admin-feature-toggle` apareix com a classe hook local, però no hi ha CSS específic associat en la ruta.
- Inventari continua `🔴` perquè no hi ha validació visual propietari ni tancament formal de migració.

APIs/serveis vius:
- `GET /api/admin/features`: `requireAuth(req)`, `listAdminFeatures()`, JSON `{ok:true, features}`.
- `POST /api/admin/features`: `requireAuth(req)`, `verifyCsrf(req)`, valida body, valida key amb `isAdminFeatureKey()`, crida `updateAdminFeature({ key, enabled })`.
- `lib/services/adminFeaturesService.ts`: llegeix `Setting`, default `enabled=true` si no hi ha setting, `upsert` de `Setting` i `adminLog CREATE`.
- `ADMIN_FEATURE_DEFINITIONS`: 6 flags (`reviews`, `calendar`, `offers`, `livechat`, `blog`, `configurator`).

Dades que governa:
- Persistència: `Setting` amb `key`, `value`, `type=BOOLEAN`, `category=config`, `label`, `description`.
- Traça: `adminLog` amb `action=UPDATE`, `entity=feature`, `entityId=features.*`, `details.enabled`.
- Estat UI local: feature carregada i fila `saving`.

Accions que governa:
- Veure flags actives/desactivades.
- Activar o desactivar una flag amb POST CSRF.
- Reintentar la càrrega inicial si falla.
- No mostra historial de canvis ni preview de l'impacte públic.

Òrgans veïns:
- upstream: catàleg `ADMIN_FEATURE_DEFINITIONS`, auth, CSRF i taula `Setting`.
- downstream previst: web públic, configurador, blog, ressenyes, ofertes i calendari.
- downstream real detectat al #1777: cap consumidor de `features.*` fora del servei/admin; `SITE_CONFIG.features` és una font separada estàtica i no llegeix aquests settings.

Codi mort relacionat:
- La route i el servei tenen tests vius: `features-route.test.ts` i `adminFeaturesService.test.ts`.
- Les flags persistides poden quedar funcionalment mortes si cap pantalla pública consulta `Setting(features.*)`.

Duplicacions:
- `ADMIN_FEATURE_DEFINITIONS` duplica parcialment `SITE_CONFIG.features` (`reviewsEnabled`, `calendarEnabled`, `offersEnabled`, `liveChatEnabled`, `blogEnabled`).
- `ADMIN_FEATURE_DEFINITIONS` inclou `configurator_enabled`, que no apareix a `SITE_CONFIG.features`.
- Aquesta duplicitat fa que el panell admin i la configuració pública puguin divergir.

Hardcoded/residu visual:
- Copy admin local acceptable; no és públic.
- Les definicions de label/description/icon són dades locals dins `lib/constants/admin.ts`.
- Resolt #1778: `feature.icon` són claus (`star`, `calendar`, `gift`, `chat`, `note`, `controls`), però el component les mapa a icones `lucide-react` i no les renderitza com a text visible.

Connexions interrompudes:
- P1 producte: les flags de `/admin/features` no semblen governar el web públic; només persisteixen settings i actualitzen el panell admin.
- Resolt #1778: icones textuals substituïdes per un map local de claus a icones reals.
- P2 UX: els errors de mutació queden en toast; no hi ha error persistent per fila ni rollback visual complex perquè l'estat només canvia després de resposta OK.

Riscos:
- L'usuari pot pensar que desactiva Blog/Configurador/Reviews quan el front públic continua llegint `SITE_CONFIG.features`.
- Connectar flags directament al web públic sense cache/SSR clar pot crear divergències entre admin i pàgines renderitzades.
- Afegir noves flags sense consumidor real augmenta configuració aparent però inoperant.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/features/page.tsx`, `loading.tsx`, `app/api/admin/features/route.ts`, `lib/services/adminFeaturesService.ts`.
- constants llegides: `ADMIN_FEATURE_DEFINITIONS` i `SITE_CONFIG.features`.
- tests llegits/actualitzats: `__tests__/app/api/admin/features-route.test.ts`, `__tests__/lib/services/adminFeaturesService.test.ts`, `__tests__/app/admin/features/FeaturesPage.test.tsx`.
- consumidors verificats amb `rg`: `features.*`, `ADMIN_FEATURE_DEFINITIONS`, `isFeatureEnabled`, `SITE_CONFIG.features`.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`. Icones resoltes al #1778 amb test focalitzat 16/16 i TypeScript.

Decisio de treball:
- conservar `/admin/features` com a panell admin de settings, però no vendre'l com a control públic efectiu fins que hi hagi consumidors.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visualment i fins que les flags tinguin impacte real o quedin etiquetades com a internes.
- proper tall recomanat: connectar una lectura canònica de flags al web públic o rebaixar la pantalla a "settings interns".

### `/admin/scripts`

Pantalla: Scripts i eines — catàleg de comandes manuals.
Ruta: `/admin/scripts`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1774, codex, 2026-07-09)

Història:
- La pantalla concentra comandes de terminal per seed, sync, check, report, fix i audit.
- No executa scripts des del navegador; el copy principal diu explícitament "Executa des del terminal".
- El #1774 documenta que la superfície és de govern operatiu: el risc és copiar una comanda sensible, no un endpoint executor.

Reachability:
- `app/admin/scripts/page.tsx` és ruta Next real, `dynamic = 'force-dynamic'`, amb `AdminPage`.
- `app/admin/scripts/ScriptsClient.tsx` és el client viu.
- `app/admin/scripts/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/admin/lib/adminNav.ts` no enllaça Scripts al menú principal actual, però `getGroupForPath()` el classifica com a Sistema per fallback.
- `lib/constants/adminManual.ts` referencia la família sistema/crons/scripts com a eines de govern.

Component viu:
- `ScriptsClient`: catàleg local `SCRIPTS` i estat `filter`, `copiedCommand`, `copyError`.
- Agrupa per `ADMIN_SCRIPT_CATEGORY_INFO`: seed, sync, check, report, fix, audit.
- Mostra `EditorControlStrip` amb cobertura, estat i acció principal.
- Filtres per categoria, cards per script, comanda en `<code>` i botó `Copiar`.
- `copyCommand()` usa `navigator.clipboard.writeText()`; si falla, només marca la comanda afectada amb `aria-invalid`, `aria-describedby` i `role="alert"`.

CSS viu:
- No hi ha CSS local de `/admin/scripts`.
- Usa `AdminPage`, `EditorControlStrip`, `.ap-kpi`, `.ap-card`, `.ap-btn`, `.ap-badge` i tons admin compartits.
- Inventari continua `🔴` perquè no hi ha validació visual propietari ni tancament formal de migració.

APIs/serveis vius:
- No hi ha `/api/admin/scripts`.
- No hi ha server action ni executor intern.
- L'única integració runtime és el Clipboard API del navegador.

Dades que governa:
- Catàleg local `SCRIPTS` dins `ScriptsClient.tsx`: `name`, `file`, `command`, `category`, `description`, `args`, `danger`.
- Categories compartides: `ADMIN_SCRIPT_CATEGORY_INFO`.
- No persisteix estat ni escriu `adminLog`.

Accions que governa:
- Filtrar scripts per categoria.
- Copiar comanda.
- Mostrar errors de còpia per comanda.
- No executa, no programa i no modifica dades directament.

Òrgans veïns:
- upstream: fitxers `scripts/*`, `prisma/seed*` i convencions de CLI.
- downstream: terminal local/CI/Railway segons qui executi la comanda copiada.
- relació amb Crons: Crons observa jobs programats; Scripts mostra eines manuals per terminal.
- relació amb Salut: Salut diagnostica; Scripts ofereix comandes que poden ajudar a diagnosticar o corregir.

Codi mort relacionat:
- La ruta i el client tenen test viu `__tests__/app/admin/scripts/ScriptsClient.test.tsx`.
- `SCRIPTS[].file` queda blindat amb guard estàtic des del #1776 perquè els paths existeixin al repo.

Duplicacions:
- El catàleg local duplica informació que també existeix com a fitxers de `scripts/` i en part al manual/protocol.
- No duplica crons perquè no executa jobs; només documenta comandes manuals.

Hardcoded/residu visual:
- Les comandes i descripcions són dades locals hardcoded dins el component.
- Les comandes que poden tocar dades/config tenen `mutatesData`; les destructives conserven `danger:true`.
- Copy admin local acceptable; no és públic.

Connexions interrompudes:
- Resolt #1775: metadata `mutatesData` marca scripts que poden tocar dades/config encara que no siguin destructius; `danger:true` queda per accions destructives.
- Resolt #1776: test estàtic valida que tots els `SCRIPTS[].file` existeixen al filesystem.
- P2: no hi ha distinció estructurada entre dry-run, mutació segura, mutació destructiva i requeriment d'arguments.

Riscos:
- Marcar poc el risc pot portar a copiar una comanda mutadora com si fos diagnòstic.
- Fer aquesta pantalla executable des del navegador seria un canvi de seguretat major i exigiria auth, permisos, CSRF, logs, confirmacions i allowlist server-side.
- Canviar una comanda en `scripts/` sense actualitzar el catàleg deixa la UI obsoleta.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/scripts/page.tsx`, `ScriptsClient.tsx`, `loading.tsx`.
- constants llegides: `ADMIN_SCRIPT_CATEGORY_INFO`.
- test llegit: `__tests__/app/admin/scripts/ScriptsClient.test.tsx`.
- consumidors verificats amb `rg`: `/admin/scripts`, comandes `scripts/*`, manual/protocol.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`. Metadata de risc resolta al #1775 amb test de component; guard de fitxers resolt al #1776.

Decisio de treball:
- conservar `/admin/scripts` com a catàleg/copiador, no executor.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visualment.
- proper tall recomanat: metadata `requiresArgs`/`dryRunDefault` si es vol més precisió sense executar res; visual final només amb propietari.

### `/admin/css-manager`

Pantalla: CSS Manager — editor de CSS custom del panell admin.
Ruta: `/admin/css-manager`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1771, codex, 2026-07-09)

Història:
- La pantalla permet editar CSS persistent que s'aplica només al panell admin.
- Els guards `check-inline-hex` i `check-inline-rgba` tracten `app/admin/css-manager/page.tsx` com a excepció tècnica perquè és literalment un editor de colors/CSS.
- El backend sanititza gradients via `lib/admin-css.ts` abans de persistir.
- La fitxa #1771 documenta que CSS Manager és una superfície d'alt impacte visual, no una utilitat menor.

Reachability:
- `app/admin/css-manager/page.tsx` és ruta Next real i client component.
- `app/admin/css-manager/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/admin/lib/adminNav.ts` no enllaça CSS Manager al menú principal actual, però `getGroupForPath()` el classifica com a Sistema per fallback.
- `app/api/admin/css/route.ts` és la route admin viva de lectura/desat.

Component viu:
- `AdminCssManagerPage`: editor client amb `css`, `loading`, `saving`, `msg`.
- Carrega CSS inicial amb `fetchWithCsrf('/api/admin/css', { cache: 'no-store' })`.
- `applyLiveCss()` escriu un `<style id="admin-custom-css-live">` i també actualitza `#admin-custom-css` si existeix.
- El canvi del textarea s'aplica en viu quan `css` canvia i `loading` ja és false.
- `EditorControlStrip` resumeix estat del tema, línies, paletes i acció principal.
- Botons: carregar exemple, aplicar una de les paletes locals, desar CSS.

CSS viu:
- No hi ha CSS local separat; la page usa classes `admin-css-*`, `admin-keep-colors`, `ap-*`, tokens i utilitats Tailwind.
- Les paletes viuen dins `page.tsx` com dades locals amb molts hex literals; és una excepció documentada pels guards.
- `buildPaletteCss()` genera CSS complet amb variables `--admin-*` i overrides sobre layout/control room.
- Inventari continua `🔴` perquè no hi ha validació visual propietari ni tancament formal de migració.

APIs/serveis vius:
- `GET /api/admin/css`: `requireAuth`, `requirePermission(req, 'read')`, `getAdminCustomCss()`, retorna `{ok:true, css}`.
- `PUT /api/admin/css`: `requireAuth`, `requirePermission(req, 'mutate')`, `verifyCsrf(req)`, `saveAdminCustomCss(css)`, retorna `{ok:true, sanitized}`.
- `lib/services/adminCustomCssService.ts`: llegeix/escriu `Setting.key = admin.css.custom`, registra `adminLog UPDATE setting`.
- `lib/admin-css.ts`: detecta i neutralitza gradients (`linear/radial/conic-gradient`) i variables Tailwind de gradient.

Dades que governa:
- Persistència: `Setting.value` string sota `admin.css.custom`.
- Missatge d'auditoria: `adminLog.details = { key, size, hadForbiddenRules }`.
- Estat DOM live: `#admin-custom-css-live` i opcionalment `#admin-custom-css`.

Accions que governa:
- Carregar el CSS persistent.
- Previsualitzar CSS en viu mentre s'edita.
- Carregar exemple local.
- Aplicar paleta local.
- Desar CSS i emetre `window.dispatchEvent(new CustomEvent('admin-css-updated', { detail: { css } }))`.

Òrgans veïns:
- upstream: permisos admin, CSRF i setting store.
- downstream: tot `/admin`, perquè el CSS live pot afectar layout, colors, panels i controls.
- relació amb Studio/tokens: CSS Manager pot sobreescriure aparença; no substitueix Studio ni `orbita-tokens.css`.

Codi mort relacionat:
- Cap arrel morta en la ruta: page, loading, route, servei i sanititzador tenen tests/consumidors.
- Les classes `admin-css-*` no apareixen en CSS local separat; són útils només si el tema/global CSS les contempla o com hooks futurs.

Duplicacions:
- Duplica parcialment decisions de tema que haurien de viure a Studio/tokens; per això s'ha de tractar com a eina controlada, no com a sistema de disseny paral·lel.
- Les paletes locals dupliquen una mena de catàleg visual dins la page; acceptable com a editor, però no és font canònica de marca.

Hardcoded/residu visual:
- Molts hex literals i noms de paleta locals, eximits pels guards perquè la pantalla edita CSS.
- `EXAMPLE_CSS` i `buildPaletteCss()` porten selectors concrets de l'admin; qualsevol refactor visual pot deixar exemples obsolets.
- Copy admin local acceptable; no és públic.

Connexions interrompudes:
- Resolt #1772: si `PUT /api/admin/css` sanititza gradients, la route retorna també `css` i el client aplica/propaga `savedCss`, no el CSS cru del textarea.
- Resolt #1773: la càrrega inicial mostra `role="alert"` persistent amb missatge backend/fallback i botó `Reintentar` si `GET /api/admin/css` falla.
- P2: el missatge de desat no diferencia visualment èxit/error més enllà del text.

Riscos:
- Aquesta pantalla pot afectar tota la percepció visual de l'admin amb un sol desat.
- Ampliar el sanititzador sense retornar CSS sanititzat al client accentua la divergència live/persistent.
- Convertir les paletes en disseny canònic sense passar per Studio trencaria la monocapa visual.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/css-manager/page.tsx`, `loading.tsx`, `app/api/admin/css/route.ts`, `lib/services/adminCustomCssService.ts`, `lib/admin-css.ts`.
- tests llegits: `__tests__/app/api/admin/css-route.test.ts`, `__tests__/lib/services/adminCustomCssService.test.ts`.
- guards llegits: `check-inline-hex`, `check-inline-rgba` amb excepció explícita per CSS Manager.
- consumidors verificats amb `rg`: `/api/admin/css`, `admin.css.custom`, `admin-custom-css-live`, `admin-css-updated`.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`. El P1 live/persistent sanititzat queda resolt al #1772 amb test focalitzat 13/13; error inicial resolt al #1773 amb test de component.

Decisio de treball:
- conservar CSS Manager com a eina controlada d'edició live admin.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visualment.
- proper tall recomanat: repàs visual/responsiu si el propietari vol portar CSS Manager a `🟢`; no convertir paletes locals en sistema de disseny paral·lel.

### `/admin/crons`

Pantalla: Crons — monitor de salut de tasques automàtiques.
Ruta: `/admin/crons`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1767, codex, 2026-07-09)

Història:
- La pantalla existeix com a cockpit de confiança dels automatismes: mostra quan va córrer cada procés, amb quin estat i quin resum va deixar.
- `ADMIN_CRON_PREFIXES` ha anat creixent amb automatismes reals: CRM lifecycle (#66), tasques (#68), benchmark (#126), reengagement (#737), Calendar Sync (#867), etc.
- El servei `cronRunStatusService` va ser endurit perquè el càlcul de health accepti `now` injectable i sigui testable (#272).
- La fitxa #1767 documenta que Crons és monitor read-only: no executa cap cron ni canvia freqüències.

Reachability:
- `app/admin/crons/page.tsx` és ruta Next real, `dynamic = 'force-dynamic'`, amb `AdminPage`.
- `app/admin/crons/CronsClient.tsx` és el client viu i fa `fetch('/api/admin/crons')`.
- `app/admin/crons/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/admin/lib/adminNav.ts` no enllaça Crons al menú principal actual, però `getGroupForPath()` el classifica com a Sistema per fallback.
- `lib/constants/adminManual.ts` i `lib/constants/master-atlas.ts` sí referencien `/admin/crons` com a eina de govern de sistema.

Component viu:
- `CronsClient`: carrega crons, guarda `loading`, `expandedId` i llista `crons`.
- Mostra quatre comptadors: correctes, retardats, errors i mai executats.
- Cada cron és un botó expandable amb label, freqüència, health, temps relatiu, data completa, últim status, missatge i resum.
- El botó `Actualitzar` només torna a carregar `/api/admin/crons`; no dispara cap job.
- Els errors de fetch fan `toast.error()` i `console.error()` i, des del #1770, també mostren `role="alert"` persistent amb botó `Reintentar`.

CSS viu:
- No hi ha CSS local de `/admin/crons`.
- La pantalla usa `AdminPage`, `.ap-card`, `.ap-btn` indirecte, tokens `var(--t3)`, `var(--line)`, `var(--raised)` i classes `admin-tone-*`.
- `ADMIN_CRON_HEALTH_CONFIG` encara conté classes Tailwind de color (`bg-emerald-400`, `border-amber-500/20`, etc.) com a font cromàtica del semàfor.
- Inventari continua `🔴` perquè no hi ha validació visual propietari ni tancament formal de migració.

APIs/serveis vius:
- `GET /api/admin/crons`: `requireAuth(req)`, `readCronRunStatuses([...ADMIN_CRON_PREFIXES])`, JSON `{ok:true, crons}`.
- No hi ha POST ni acció mutadora a `/api/admin/crons`.
- `lib/services/cronRunStatusService.ts` escriu i llegeix `Setting` amb claus `${prefix}.lastRun`, `${prefix}.lastStatus`, `${prefix}.lastSummary`, `${prefix}.lastMessage`.
- `saveCronRunStatus()` és cridat pels crons reals i serveis associats.
- `readCronRunStatuses()` calcula `health`: `unknown` si no hi ha run, `error` si últim status és error, `ok/warning` segons `maxAgeHours` de cada definició (default 26h si no s'informa).

Dades que governa:
- Catàleg de monitoratge: `ADMIN_CRON_PREFIXES` (`id`, `label`, `prefix`, `frequency`, `maxAgeHours`).
- Snapshot de run: `lastRun`, `lastStatus`, `lastSummary`, `lastMessage`, `health`.
- Persistència: taula `Setting`, categoria per defecte `automation` o categories específiques dels crons.

Accions que governa:
- Veure estat de crons.
- Expandir detalls d'un cron.
- Recarregar el monitor.
- No executa, no reintenta, no pausa i no configura jobs.

Òrgans veïns:
- upstream: rutes `/api/cron/*`, GitHub Actions/Railway scheduler, serveis d'automatització i `saveCronRunStatus()`.
- downstream: `/admin/salut`, manual operatiu, dashboard de confiança i diagnòstic d'automatitzacions.
- relació amb Activity: Crons mostra l'últim snapshot per prefix; Activity mostra rastre `adminLog` transversal. No són substituts.

Codi mort relacionat:
- Cap arrel morta en la ruta: page, client, loading, route, constants i servei tenen consumidors.
- `GET /api/admin/crons` té test de route propi des del #1769; la cobertura de servei/constants continua separada.

Duplicacions:
- No duplica Salut: Crons és frescor de jobs; Salut agrega domini, integracions i alerts.
- No duplica Activity: Crons és snapshot per prefix; Activity és timeline d'esdeveniments.
- No duplica scripts: Scripts executa eines manuals; Crons només observa jobs programats.

Hardcoded/residu visual:
- Copy admin local acceptable.
- Residu cromàtic: `ADMIN_CRON_HEALTH_CONFIG` encara porta classes Tailwind directes en constants.
- Residu visual/codi viu: el protocol històric #258 parlava d'`OwnerControlStrip`, però el `CronsClient` viu actual no l'importa ni el renderitza; la fitxa documenta el codi real, no la fotografia antiga.

Connexions interrompudes:
- Resolt #1768: `readCronRunStatuses()` respecta `maxAgeHours` per definició; `calendarSync` vigila 2h, `urgentFollowUpAlerts` 8h, diaris 26h i `weeklyBenchmark` 192h.
- Resolt #1769: `GET /api/admin/crons` té test de route que blinda auth, delegació a `readCronRunStatuses([...ADMIN_CRON_PREFIXES])` i error 500.
- Resolt #1770: si el fetch falla, la pantalla mostra `role="alert"` persistent amb missatge backend/fallback i reintent.

Riscos:
- Canviar prefixes trenca la lectura de Settings ja escrites si no hi ha migració o compatibilitat.
- Canviar el health sense tenir en compte freqüència pot amagar crons morts o marcar falsos retards.
- Convertir aquesta pantalla en executor manual de jobs barrejaria observabilitat amb operació; qualsevol acció nova hauria de tenir CSRF i confirmació.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/crons/page.tsx`, `CronsClient.tsx`, `loading.tsx`, `app/api/admin/crons/route.ts`, `lib/services/cronRunStatusService.ts`.
- constants llegides: `ADMIN_CRON_PREFIXES`, `ADMIN_CRON_HEALTH_CONFIG`.
- tests llegits/actualitzats: `__tests__/lib/services/cronRunStatusService.test.ts`, `__tests__/lib/constants/adminCronPrefixes.test.ts`, `__tests__/app/api/admin/crons-route.test.ts`, `__tests__/app/admin/crons/CronsClient.test.tsx`, llistat de tests `/api/cron/*`.
- consumidors verificats amb `rg`: `saveCronRunStatus()`, `/admin/crons`, `/api/admin/crons`, `/api/cron/*`, manual i master atlas.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`. Health per freqüència resolt al #1768 amb test focalitzat 16/16; route admin resolta al #1769 amb test focalitzat; error state resolt al #1770 amb test de component.

Decisio de treball:
- conservar `/admin/crons` com a monitor read-only.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visualment la pantalla.
- proper tall recomanat: repàs visual/responsiu si el propietari vol portar Crons a `🟢`; no reobrir scheduler ni jobs sense regressió demostrable.

### `/admin/activity`

Pantalla: Activitat del sistema — visor transversal de traça admin.
Ruta: `/admin/activity`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1763, codex, 2026-07-09)

Història:
- Ruta creada com a visor d'`AdminLog` per emails, crons, sincronitzacions i accions del sistema.
- El #340 va treure la lectura crua de `adminLog` de la route i la va concentrar a `fetchCanonicalAdminActivityPage()` dins `timelineQueryService`.
- El #1684 va fer que `ActivityClient` propagui l'error/missatge real del backend quan `/api/admin/activity` falla.
- La fitxa #1763 no toca runtime: només documenta la frontera viva i deixa el mapa alineat.

Reachability:
- `app/admin/activity/page.tsx` és ruta Next real, `dynamic = 'force-dynamic'`, amb `AdminPage` i `ActivityClient`.
- `app/admin/activity/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/admin/lib/adminNav.ts` enllaça `Activity` dins Sistema; Dashboard/Control pot retornar-hi quan no hi ha link específic de timeline.
- `qa:no-dead-admin-views` passa; `ActivityClient` és importat només per la page i viu.

Component viu:
- `page.tsx`: wrapper server amb títol/subtítol i `<ActivityClient />`.
- `ActivityClient.tsx`: client component amb categoria, finestra temporal, paginació, refresh, stats per categoria, cards mòbil, taula desktop i toast d'error.
- Helpers locals vius: `formatTimeAgo`, `getActionMeta`, `getSourceLabel`, `getKindLabel`, `formatDetails`, `getEntityLink`, `readActivityLoadError`.

CSS viu:
- No hi ha CSS local de `/admin/activity`.
- La pantalla usa sistema compartit: `AdminPage`, `.ap-card`, `.ap-table`, `.ap-btn`, `admin-tone-*`, `adm-row-hover`, `admin-stagger-item`, responsive Tailwind puntual.
- Estat inventari continua `🔴` perquè no hi ha validació visual propietari ni tancament formal de migració, tot i que el chrome ja és canònic.

APIs/serveis vius:
- `GET /api/admin/activity`: auth, saneja `days/page/limit`, limita `days<=90` i `limit<=200`, i delega a `fetchCanonicalAdminActivityPage({ since, category, page, limit })`.
- `lib/services/timelineQueryService.ts`: `fetchCanonicalAdminActivityPage()` llegeix `adminLog` paginat, `count`, `groupBy`, mapeja cada fila a timeline canònica i agrega stats per categoria.
- Constants: `ACTIVITY_CATEGORY_OPTIONS`, `ACTIVITY_DAYS_OPTIONS`, `ADMIN_ACTIVITY_ACTION_META`, `ADMIN_ACTIVITY_CATEGORY_MAP`, `ADMIN_ACTIVITY_ENTITY_LINKS`, `ADMIN_ACTIVITY_STATS_CARDS`.

Dades que governa:
- Lectura de `AdminLog`: action, entity, entityId, details, userId i createdAt.
- Sortida de pàgina: logs paginats, total, pages, stats per categoria i `timeline` canònica derivada.
- Categories: `comms`, `automation`, `system`, `crud` i fallback `other` segons `ADMIN_ACTIVITY_CATEGORY_MAP`.

Accions que governa:
- Filtrar per categoria.
- Canviar finestra temporal.
- Paginació.
- Refrescar manualment.
- Obrir entitat relacionada via link de timeline o fallback `ADMIN_ACTIVITY_ENTITY_LINKS`.
- No muta dades i no escriu `adminLog`; és visor read-only.

Òrgans veïns:
- upstream: qualsevol servei que escriu `adminLog` o que registra traça documental/comunicació/automatització.
- downstream: rutes d'entitat (`bookings`, `leads`, `clientes`, `presupuestos`, `packs`) quan `entity/entityId` o timeline link és resoluble.
- compartit amb Customer Hub i booking/lead timelines a través de `timelineQueryService` i `ADMIN_ACTIVITY_ACTION_META`.

Codi mort relacionat:
- Cap arrel morta detectada. Tests vius cobreixen route, error frontend i servei canònic.
- Les funcions locals de format són d'ús intern de `ActivityClient`; no hi ha component alternatiu mort.

Duplicacions:
- No duplica Dashboard/Control: Dashboard mostra resum recent; Activity és el log consultable.
- No duplica Customer Hub/Lead/Booking timelines: aquestes són contextuals per entitat; Activity és transversal i llegeix `adminLog`.
- La monocapa crítica és `timelineQueryService`; no reintroduir query Prisma d'`adminLog` dins el client o route.

Hardcoded/residu visual:
- Copy admin local acceptable.
- Deute menor: icones emoji/inline i botons de filtre amb classes locals Tailwind; coherent amb altres superfícies admin però no és `TANCAT CHARLIE`.
- `formatDetails()` només mostra un subconjunt de claus conegudes i fa fallback als tres primers camps; és útil per escaneig, no per inspecció completa de payload.

Connexions interrompudes:
- Cap cable principal trencat detectat: route -> servei canònic -> `adminLog` -> timeline -> UI.
- Risc de link fallback: si una entitat nova escriu `adminLog` però no entra a `ADMIN_ACTIVITY_ENTITY_LINKS` ni al mapper canònic, apareixerà sense link accionable. Afegir accions noves implica actualitzar constants i tests.
- Les stats es calculen per tota la finestra `since`, no per la categoria activa; és intencionat per mantenir context global dels quatre blocs.

Riscos:
- Tocar `ADMIN_ACTIVITY_CATEGORY_MAP` canvia filtres, stats i visibilitat per categoria.
- Tocar `mapAdminLogToCanonicalEvent()` impacta Activity, Customer Hub, booking/lead timelines i dashboard recent.
- Tocar limits/query de la route pot degradar rendiment sobre `adminLog`.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/activity/page.tsx`, `ActivityClient.tsx`, `loading.tsx`, `app/api/admin/activity/route.ts`.
- servei llegit: `lib/services/timelineQueryService.ts` (`fetchCanonicalAdminActivityPage` i mapping relacionat).
- tests llegits: `__tests__/app/api/admin/activity-route.test.ts`, `__tests__/app/admin/activity/ActivityClient-errors.test.ts`, bloc `fetchCanonicalAdminActivityPage` de `__tests__/lib/services/timelineQueryService.test.ts`.
- consumidors/constants verificats amb `rg`: `ADMIN_ACTIVITY_ACTION_META`, `ADMIN_ACTIVITY_CATEGORY_MAP`, `ADMIN_ACTIVITY_ENTITY_LINKS`, `ACTIVITY_CATEGORY_OPTIONS`, dashboard timeline i Customer Hub timeline.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`.

Decisio de treball:
- conservar `/admin/activity` com a visor transversal read-only del rastre admin.
- no marcar `🟢` ni `TANCAT CHARLIE` fins a revisió visual propietari; el codi és canònic però el mapa de migració no s'ha tancat.
- proper tall només si cal: afegir link/meta per una acció nova d'`adminLog` que surti sense destinació; no tocar route/servei sense regressió demostrable.

### `/admin/coverage`

Pantalla: Coverage — gestió de ciutats/províncies de cobertura pública.
Ruta: `/admin/coverage`
Estat inventari: 🔴 (fitxa FETA, migració/validació visual no tancada al mapa)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1764, codex, 2026-07-09)

Història:
- La ruta governa la configuració persistent `Setting.key = coverage.areas`.
- El backend va quedar canonitzat perquè `app/api/admin/coverage/route.ts` delegui lectura/escriptura a `lib/coverage.ts` i validi CSRF en mutacions (#1038).
- El frontend importa `CoverageArea` i `COVERAGE_PROVINCES` des de `lib/coverage.ts`, evitant un catàleg local paral·lel.
- La fitxa #1764 documenta que Coverage és configuració pública, no només una taula interna.

Reachability:
- `app/admin/coverage/page.tsx` és ruta Next real i client component.
- `app/admin/coverage/loading.tsx` reutilitza `AdminLoadingSkeletonList`.
- `app/admin/lib/adminNav.ts` enllaça `/admin/coverage` dins Sistema.
- Consumidors públics: `app/api/public/coverage/route.ts`, `app/components/ui/footer.tsx` via `fetchPublicCoverage()`, i serveis/zones de boda via `getEnabledCoverageAreas()`/`getEnabledZoneLandingSlugs()`/`getWeddingCoverageZones()`.

Component viu:
- `CoveragePage`: carrega àrees, mostra stats, formulari d'alta, agrupació per província, toggle actiu/inactiu i eliminació amb `ConfirmDialog`.
- `ConfirmDialog` és l'únic flux de confirmació; no hi ha `window.confirm`.
- Estat local viu: `areas`, `loading`, `fetchError`, `mutationError`, `newCity`, `newProvince`, `adding`, `pendingAreaMutation`.

CSS viu:
- No hi ha CSS local de `/admin/coverage`.
- La pantalla usa `AdminPage`, `AdminEmptyState`, `.ap-card`, `.ap-btn`, `.ap-h2`, `admin-tone` indirecte i utilitats Tailwind puntuals.
- Estat inventari continua `🔴` perquè no hi ha validació visual propietari ni tancament formal de migració.

APIs/serveis vius:
- `GET /api/admin/coverage`: auth, sense CSRF per lectura, `ensureCoverageAreasSetting()` inicialitza `coverage.areas` si falta.
- `POST /api/admin/coverage`: auth + CSRF, valida `action/city/province`, delega a `updateCoverageAreas()` i tradueix errors (`city_exists`, `invalid_action`) via `ADMIN_COVERAGE_API_MESSAGES`.
- `lib/coverage.ts`: `getCoverageAreas`, `ensureCoverageAreasSetting`, `saveCoverageAreas`, `updateCoverageAreas`, `getEnabledCoverageAreas`, `getEnabledCoverageCities`, `getEnabledZoneLandingSlugs`, `WEDDING_COVERAGE_ZONE_DEFINITIONS`.
- `GET /api/public/coverage`: exposa `areas` i `cities` actives al front públic.
- `lib/api/publicCoverageClient.ts`: wrapper canònic de fetch públic, testat.

Dades que governa:
- `CoverageArea`: city, province, enabled.
- Persistència: `Setting.value` JSON sota `coverage.areas`.
- Catàleg de províncies: `COVERAGE_PROVINCES`.
- Slugs SEO/landing derivats: `ZONE_RULES` i `WEDDING_COVERAGE_ZONE_DEFINITIONS`.

Accions que governa:
- Afegir ciutat.
- Eliminar ciutat amb confirmació i estat `busy` mentre la mutació és en curs.
- Activar/desactivar ciutat amb estat `busy` mentre la mutació és en curs.
- Inicialitzar defaults si no hi ha setting.
- Escriure `adminLog` `UPDATE` sobre `coverage` després de mutacions.

Òrgans veïns:
- upstream: Settings/coverage admin i qualsevol procés que necessiti saber si una zona és operativa.
- downstream: footer públic, endpoint públic de cobertura, pàgines de serveis/zones de boda i slugs SEO territorials.
- relació amb pricing/transport: cap regla econòmica; Coverage només diu on es comunica cobertura, no calcula desplaçament ni preu.

Codi mort relacionat:
- Cap arrel morta detectada; route, page, loading, `lib/coverage.ts`, public client i wedding coverage tenen tests/consumidors.
- `getEnabledZoneLandingSlugs()` és servei latent/consumit per generació territorial; no és codi mort per no aparèixer a la page.

Duplicacions:
- No duplica `weddingCoverage`: Coverage governa dades de ciutats; `weddingCoverage` resol copy/zones per pàgina de bodes.
- No duplica footer: el footer consumeix `/api/public/coverage`, no manté la font viva; només té fallback `PUBLIC_FOOTER_DEFAULT_COVERAGE`.
- No duplica transport/distància: és una capa editorial/territorial.

Hardcoded/residu visual:
- Copy admin local acceptable.
- `COVERAGE_PROVINCES` és catàleg de domini en `lib/coverage.ts`, no hardcode de JSX.
- Deute menor: formulari i files usen utilitats Tailwind (`rounded-xl`, `border`, `flex`) i botons amb text/símbols `✓/✕`; no és `TANCAT CHARLIE`.

Connexions interrompudes:
- Resolt #1765: el client mostra `fetchError` quan el GET retorna `{ok:false}` i un `role="alert"` per errors de mutació (`city_exists`, `invalid_action`, fallback local o excepció).
- Resolt #1766: `remove`/`toggle` exposen `aria-busy`, text d'acció en curs i bloqueig de doble clic mentre hi ha una mutació de ciutat pendent.
- Deute menor: no hi ha rollback optimista; la pantalla espera la resposta del backend i reemplaça `areas` amb la font retornada.
- No hi ha cable de dades trencat: admin -> setting -> public endpoint/footer/zones està connectat.

Riscos:
- Tocar `lib/coverage.ts` impacta admin, endpoint públic, footer, SEO territorial i tests de wrappers públics.
- Eliminar o renombrar ciutat afecta slugs/zones derivades per matcher normalitzat.
- Canviar `Setting.key` trencaria la font viva i faria caure a defaults.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/coverage/page.tsx`, `loading.tsx`, `app/api/admin/coverage/route.ts`, `lib/coverage.ts`, `app/api/public/coverage/route.ts`, `lib/api/publicCoverageClient.ts`, `lib/services/weddingCoverage.ts`.
- tests llegits: `__tests__/app/api/admin/coverage-route.test.ts`, `__tests__/lib/api/publicCoverageClient.test.ts`, `__tests__/lib/services/weddingCoverage.test.ts`.
- consumidors verificats amb `rg`: footer públic, API pública, wedding coverage, constants de footer, protocol/diari i guard de Railway ignore.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`. El P1 de feedback d'errors queda resolt al #1765 amb test focalitzat i el busy de remove/toggle queda resolt al #1766 amb test focalitzat.

Decisio de treball:
- conservar `/admin/coverage` com a gestor territorial públic.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que el propietari validi visualment la pantalla.
- proper tall només si cal: repàs visual/responsiu; no tocar `lib/coverage.ts` ni l'endpoint públic sense regressió demostrable.

### `/admin/docs/visual-audit`

Pantalla: Auditoria visual — visor del baseline runtime visual #1416.
Ruta: `/admin/docs/visual-audit`
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense compacta #1417, codex, 2026-07-05)

Història:
- Neix després del baseline #1416, que genera `.codex-captures/visual-audit-1416-final/visual-audit-results.json` amb 94 rutes i 282 captures.
- El #1417 converteix aquest arxiu en superfície admin consultable, perquè la revisió visual no depengui només de fitxers locals.

Reachability:
- `app/admin/docs/visual-audit/page.tsx` és ruta Next real, `dynamic = 'force-dynamic'`.
- `app/admin/docs/visual-audit/VisualAuditClient.tsx` és importat només per la page i governa filtres/captures.
- `app/admin/docs/visual-audit/loading.tsx` existeix.
- `app/admin/lib/adminNav.ts` enllaça `Auditoria visual` dins Sistema.
- Passa `qa:no-dead-admin-views`.

Component viu:
- Page server: carrega `loadVisualAuditAtlas()`, pinta `AdminPage`, KPIs i delega a `VisualAuditClient`.
- Client: filtra per òrgan/cerca, mostra síntesi radiografia real → zenit → full de ruta, resums per òrgan i targetes de ruta amb captures desktop/tablet/mobile.

CSS viu:
- Sense CSS local. Consumeix classes globals admin (`AdminPage`, `.ap-card`, `.ap-btn`, `.ap-badge`, `admin-tone-*`) i utilitats responsive.
- No introdueix tokens, hex ni rgba locals.

APIs/serveis vius:
- `lib/services/visualAuditAtlasService.ts`: loader filesystem + composició pura del baseline.
- `lib/constants/visual-audit.ts`: ordre d'òrgans, viewports, dimensions de revisió i principis zenit.
- `/api/admin/visual-audit/screenshot`: GET read-only amb `requireAuth`, validació de `run`/`file` i confinament a `.codex-captures/<run>/screenshots`.

Dades que governa:
- Només llegeix el baseline regenerable `.codex-captures/visual-audit-1416-final/visual-audit-results.json` i captures PNG associades.
- No governa negoci, schema, clients, leads, reserves, diners, emails ni PDF runtime.

Accions que governa:
- Filtrar i obrir captures/rutes. Cap mutació.
- Serveix com a punt de partida per decidir quina pantalla passa a revisió profunda.

Òrgans veïns:
- upstream: `scripts/admin-visual-audit.mjs` i documents `AUDITORIA-VISUAL-GLOBAL-1416.md` / `FULL-DE-RUTA-auditoria-disseny-admin.md`.
- downstream: `docs/admin-fitxes-pantalles.md` abans de tocar una pantalla concreta; rutes admin reals que s'obren des del visor.

Codi mort relacionat: cap evidència; servei, ruta, client, endpoint i nav són vius.
Duplicacions: no duplica l'atles elèctric; aquest visor mira runtime visual/captures, l'atles elèctric mira filesystem/cables/símbols.
Hardcoded/residu visual: strings admin locals acceptables per pantalla interna; semàntica estable de dimensions viu a `visual-audit.ts`.
Connexions interrompudes: cap. Si falta el baseline local, la pantalla mostra empty state i instrucció d'executar l'auditoria visual.

Evidència d'auditoria:
- Fitxers llegits/tocats: `page.tsx`, `VisualAuditClient.tsx`, `loading.tsx`, endpoint screenshot, `visualAuditAtlasService`, constants i test.
- Proves/guards: test servei 3/3, `tsc`, `validate:core`, `pnpm build`, `qa:protocol`, auditor visual acotat 3/3 OK a `.codex-captures/visual-audit-1417-route-final/`.

Decisio de treball: conservar com a eina viva de retorn visual. Proper pas real: usar-la per revisar un òrgan concret amb les 9 dimensions del full de ruta visual, no fer canvis genèrics sense fitxa.

### `/admin/campaigns`

Pantalla: Campanyes — comunicacions massives suggerides per segment CRM.
Ruta: `/admin/campaigns`
Estat inventari: 🔴 (no migrada visualment al mapa de pàgines)
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1206, codex, 2026-06-28)

Història:
- Construida al cicle d'expansio CRM/Growth (commit base `2f2bc545`) amb servei pur `generateCampaigns()` i page server `CampaignsPage`.
- Reforçada visualment al #295 amb `OwnerControlStrip` segons el registre historic, i sanejada posteriorment pels guards admin-canon/no-slate-gray.
- El #379 decideix que Social no necessita planificador editorial avançat; el #601 i #688 blinden que Social no es fragmenti. Aquesta fitxa comprova que Campanyes no és una ruta social paral·lela, sino CRM massiu.

Reachability:
- `app/admin/campaigns/page.tsx` és una ruta Next real, `dynamic = 'force-dynamic'`.
- `app/admin/lib/adminNav.ts` classifica `/admin/campaigns` dins l'òrgan `web`.
- `app/admin/components/DailyBriefPanel.tsx` enllaça a `/admin/campaigns` quan `brief.topCampaigns` existeix.
- `lib/constants/adminManual.ts` referencia `/admin/campaigns` al ritme setmanal de divendres.

Component viu:
- `app/admin/campaigns/page.tsx`: server component autocontingut. Renderitza `AdminPage`, KPIs, empty state, llistat de `CampaignCard` i bloc explicatiu.
- No hi ha component fill extern propi ni CSS local.

CSS viu:
- Sense CSS local. Consumeix classes canòniques globals (`AdminPage`, `.ap-card`, `.ap-btn` indirectament quan pertoqui, `admin-tone-*`).
- Residu visual pendent de possible sanejament posterior: alguns detalls són Tailwind/local (`rounded-lg`, `border-white/15`, emoji icons). No bloqueja la fitxa perquè és estat existent i no s'ha tocat codi funcional.

APIs/serveis vius:
- `lib/services/campaignService.ts`
  - `generateCampaigns(input)` és la funció pura i testada.
  - `loadCampaigns(now)` carrega segments CRM via Prisma (`customer.count`) i genera drafts.
- `lib/services/dailyBriefService.ts` consumeix `generateCampaigns()` per alimentar el resum diari i `topCampaigns`.
- No hi ha API route pròpia ni model `Campaign`: les campanyes són suggeriments calculats, no entitat persistent.

Dades que governa:
- Lectures agregades de `Customer`: `total`, `totalEvents`, `createdAt`, `lifecycleStage`, `healthScore`, `totalSpent`.
- Constants de domini: `CUSTOMER_SEGMENTS`, `CUSTOMER_DORMANT_MONTHS`.
- Sortida: drafts amb `type`, `segment`, `audienceSize`, `channel`, `subject`, `bodyTemplate`, `urgency`, `estimatedImpact`.

Accions que governa:
- Cap mutació. La pantalla no envia campanyes; només mostra suggeriments i plantilles perquè el propietari executi manualment per WhatsApp/email.
- CTA principal cap a `/admin/clientes/reactivation` per passar de comunicació massiva a reactivació individual.

Òrgans veïns:
- upstream: Customer Hub / CRM (`Customer.lifecycleStage`, `healthScore`, `totalEvents`, `totalSpent`).
- downstream: Dashboard/Daily Brief (`topCampaigns`), Manual operatiu (cadència de divendres), Reacció individual (`/admin/clientes/reactivation`).
- veïns conceptuals: `/admin/marketing` governa canals/ROI/gaps; `/admin/social` governa calendari editorial i captació Instagram; `/admin/campaigns` governa campanyes CRM massives manuals.

Codi mort relacionat:
- Cap evidència de codi mort: `generateCampaigns` té tests i consumidors (`loadCampaigns`, `dailyBriefService`); la page és reachable.

Duplicacions:
- No duplica Social: Social tracta posts/calendari/pols editorial, no missatges CRM massius.
- No duplica Marketing: Marketing diagnostica canals, ROI/CAC i gaps de mesura; Campanyes genera drafts concrets a partir de segments de client.
- Solapament controlat amb Reactivació: Campanyes és massiu/manual; Reactivació és individualitzada. El CTA cap a Reactivació és correcte.

Hardcoded/residu visual:
- Text admin local en català acceptable per pantalla admin, però les plantilles de missatge i labels de campanya són decisions de domini i viuen dins el servei. Si es toca funcionalment, primer s'ha de decidir si aquestes plantilles passen a constants compartides o es mantenen com a sortida del generador pur.
- `getMonthName()` usa `toLocaleDateString` dins servei. No és inline admin UI, però si el domini creix convé derivar-ho dels helpers de `lib/constants`.
- Icons emoji locals (`TYPE_ICON`, `CHANNEL_ICON`) i maps locals (`URGENCY_TONE`, `URGENCY_LABEL`) són deute menor de monocapa si es reutilitzen en una altra superfície.

Connexions interrompudes:
- La pantalla no deixa traça d'execucio: com que només copia/mostra plantilles, no sap si una campanya s'ha enviat. Això és decisió de producte futura, no bug actual.
- No està integrada dins `/admin/marketing`; avui és una ruta separada. La separació és tolerable perquè el rol és diferent, però el següent pas natural seria que Marketing l'enllaci com a "acció CRM massiva" quan el canal actiu ho demani.

Riscos:
- Reobrir-la com a planificador social duplicaria el #379/#601/#688 i trencaria §6.9.
- Automatitzar enviament massiu sense traça a Inbox/Timeline duplicaria comunicacions i saltaria el fil canònic.
- Convertir-la en entitat persistent exigiria decisió de producte i model propi; no és necessari per l'ús actual.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/campaigns/page.tsx`, `lib/services/campaignService.ts`, `__tests__/lib/services/campaignService.test.ts`.
- imports/exports verificats: `loadCampaigns` a page, `generateCampaigns` a tests i `dailyBriefService`, `/admin/campaigns` a `DailyBriefPanel`, `adminManual` i `adminNav`.
- selectors CSS verificats contra DOM: no hi ha CSS local; classes globals existents.
- serveis/APIs seguits: page → `loadCampaigns()` → Prisma `customer.count`; daily brief → `generateCampaigns()`.
- proves/guards executats: lectura forense + `rg` de consumidors. Validació tècnica final del canvi documental: `qa:protocol`, `qa:no-dead-admin-views`, `tsc --noEmit`.

Decisio de treball:
- conservar `/admin/campaigns` com a eina viva de CRM massiu manual.
- no tocar codi funcional en aquest tall.
- següent tall recomanat, si es vol millorar: fer que `/admin/marketing` enllaci explícitament a Campanyes quan el diagnòstic demani acció CRM massiva, sense fusionar Social ni crear un segon planificador.
- prohibició operativa: no afegir enviament massiu automàtic aquí sense passar per Inbox/Timeline i traça canònica.

### `/admin/marketing`

Pantalla: Marketing Hub — govern de captació, canals, mesura i bloqueig de paid media.
Ruta: `/admin/marketing`
Estat inventari: 🔴 (no migrada visualment al mapa de pàgines)
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1207, codex, 2026-06-28)

Història:
- Creat al #628 com a primera ruta operativa del roadmap `marketing-analytics-hub`, sense obrir OAuth nou.
- Reforçat als #664/#665 amb diagnòstic i conversió per canal CRM; #716/#717 amb gaps ROI/CAC i ingressos atribuïts; #718/#719 amb Google Ads/GA4 reals quan estan configurats; #720/#736 amb Google Business Profile OAuth; #738 amb distinció Meta Pixel vs cost Meta Ads.
- Tokenitzat visualment al #993. No estava fitxat forensicament abans del #1207.

Reachability:
- `app/admin/marketing/page.tsx` és ruta Next real, `dynamic = 'force-dynamic'`.
- `app/admin/lib/adminNav.ts` classifica `/admin/marketing` dins l'òrgan `web`.
- `app/admin/manual/page.tsx` apunta a `/admin/marketing` com a CTA de l'àrea `Captació i vendes`.
- `lib/constants/adminManual.ts` conserva `marketing-analytics-hub` com a roadmap pendent ampli, però el hub existent ja cobreix govern intern i gaps de mesura.

Component viu:
- `app/admin/marketing/page.tsx`: server component que renderitza `AdminPage`, readiness, KPIs de captació, diagnòstic per canal, gaps ROI/CAC, canal actiu, integracions i fonts CRM dels últims 90 dies.
- No té client component propi ni CSS local.

CSS viu:
- Sense CSS local. Consumeix `AdminPage`, `.ap-card`, `.ap-kpi`, `.ap-btn`, `.ap-badge`, `admin-tone-*` i tokens globals.
- Residu visual menor existent: alguns contenidors combinen `ap-card` amb `rounded-2xl`; no es toca en aquesta fitxa.

APIs/serveis vius:
- `lib/services/marketingHubService.ts`
  - `buildMarketingHubSummary(input)`: funció pura testada.
  - `loadMarketingHubSummary()`: wrapper amb `loadCaptureHealth`, `getGa4ConfigStatus`, `getGa4Report`, `getGoogleAdsConfigStatus`, `getGoogleAdsReport`, `loadAttributionReport`, `getGoogleBusinessIntegrationConfig`, `prisma.lead.groupBy` i `ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK`.
- Tests vius: `__tests__/lib/services/marketingHubService.test.ts` i `__tests__/app/admin/marketing/page.test.tsx`.
- No hi ha API route pròpia de Marketing Hub. L'API `/api/admin/marketing/spend` pertany a despesa/CAC dins Economia, no a aquesta pàgina.

Dades que governa:
- Salut de captació: leads 7/30/90 dies, tendències i fonts (`captureHealthService`).
- Conversió CRM per origen: `Lead.source` + `Lead.status`.
- Ingressos atribuïts: `attributionService`.
- Integracions: GA4, Google Ads, Google Business Profile, Meta Pixel.
- Regla operativa: `ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK` i fases del manual.

Accions que governa:
- Cap mutació. És un hub de lectura i decisió.
- CTAs cap a `/admin/analytics`, `/admin/reporting`, `/admin/settings/integrations`, `/admin/manual`, `/admin/google-reviews`, `/admin/text-manager`, `/admin/social`, `/admin/clientes/referrals` o `/admin/leads` segons diagnòstic.

Òrgans veïns:
- upstream: Captació/Leads, Attribution, GA4/Google Ads, Google Business Profile, Manual intern.
- downstream: Analytics, Reporting, Manual, Integracions, Google Reviews, Text Manager, Social, Referrals, Leads.
- veí pendent de cable suau: `/admin/campaigns` com a acció CRM massiva manual quan el diagnòstic demani segmentació.

Codi mort relacionat:
- Cap evidència de codi mort: servei, pàgina i tests són vius; `loadMarketingHubSummary()` és importat per la page.

Duplicacions:
- No duplica Analytics: Analytics mostra dades GA4/Ads; Marketing decideix què fer amb canals i gaps.
- No duplica Reporting/Economia: Reporting/Economia llegeixen conversió, marge, CAC i despesa; Marketing governa readiness i bloqueig d'inversió.
- No duplica Campanyes: Campanyes genera drafts massius CRM; Marketing diagnostica quin canal reforçar i quina dada falta.
- No duplica Social: Social governa calendari/posting; Marketing només hi deriva quan origen Instagram o canal social demana acció.

Hardcoded/residu visual:
- Copy admin local acceptable; la semàntica estable de canals/gates viu a `adminManual.ts` o a `marketingHubService`.
- `getSourceAction()` és un mapping de domini dins el servei. Si es reutilitza fora de Marketing, s'hauria d'extreure a constant/helper compartit.
- No hi ha colors hex ni CSS local a la pàgina.

Connexions interrompudes:
- ROI/CAC extern complet continua parcial: Meta Ads no té connector de cost, i Google Ads/GA4 només aporten dades quan la config està preparada. La pantalla ho explica com a gap, no ho ven com a complet.
- El cable suau cap a `/admin/campaigns` queda afegit al #1208 com a CTA `Campanyes CRM` dins les accions del header de Marketing.

Riscos:
- Presentar readiness com a ROI complet seria enganyós; la fitxa fixa que és hub de govern i gaps, no BI paid complet.
- Obrir connectors paid o automatismes sense sortir del `ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK` trencaria la regla anti-dispersió.
- Afegir campanyes dins Marketing com a segon generador duplicaria `/admin/campaigns`; cal enllaçar, no reimplementar.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/marketing/page.tsx`, `lib/services/marketingHubService.ts`, `__tests__/lib/services/marketingHubService.test.ts`, `__tests__/app/admin/marketing/page.test.tsx`, tram de `lib/constants/adminManual.ts`.
- imports/exports verificats: `loadMarketingHubSummary` → page; `buildMarketingHubSummary` → tests; `/admin/marketing` → Manual i nav.
- selectors CSS verificats contra DOM: no hi ha CSS local; classes globals existents.
- serveis/APIs seguits: page → `loadMarketingHubSummary()` → capture/GA4/Ads/Attribution/GBP/Prisma.
- proves/guards executats: lectura forense + `rg` de consumidors. Validació tècnica final del canvi documental: `qa:no-dead-admin-views`, `tsc --noEmit`, `qa:protocol`.

Decisio de treball:
- conservar `/admin/marketing` com a hub viu de govern de captació i mesura.
- no reimplementar campanyes dins Marketing; el cable correcte és l'enllaç cap a `/admin/campaigns` (#1208).
- no crear connectors paid nous ni enviar campanyes automàtiques sense decisió explícita i traça canònica.

### `/admin/social`

Pantalla: Social Media — calendari editorial, idees i captació Instagram.
Ruta: `/admin/social`
Estat inventari: 🔴 (no migrada visualment al mapa de pàgines)
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1209, codex, 2026-06-28)

Història:
- Creat al cicle Social Media Calendar (#38) amb workspace complet, CRUD, vista llista/calendari mensual, modal i KPIs.
- Connectat a idees automàtiques (#40), mètriques de rendiment (#147), decisió de no fer planificador avançat (#379), pols editorial (#555), bucle social únic (#601), guard anti-split (#688) i regularització documental #742.
- El #1206 i #1207 han fixat els veïns: Campanyes és CRM massiu manual; Marketing és govern de canals/gaps. Aquesta fitxa comprova que Social continua sent la font viva de calendari/posting/captació social.

Reachability:
- `app/admin/social/page.tsx` és ruta Next real, `dynamic = 'force-dynamic'`.
- `app/admin/lib/adminNav.ts` classifica `/admin/social` dins l'òrgan `web`.
- Daily Brief, Sales Ops, Calendari i Marketing Hub apunten a `/admin/social` com a sortida operativa quan el senyal és social.
- APIs vives: `/api/admin/social-posts`, `/api/admin/social-posts/[id]`, `/api/admin/social-posts/performance`.

Component viu:
- `app/admin/social/page.tsx`: carrega en paral·lel `listSocialPosts()`, `getSocialPostCounts()`, `loadSocialIdeas()` i `loadSocialContentPulse()`; serialitza dates i passa el contracte a `SocialClient`.
- `app/admin/social/SocialClient.tsx`: client component amb llista/calendari, filtres, modal crear/editar, canvi d'estat, eliminar, panell d'idees, pols editorial, cadència, cua i Instagram→pipeline.
- `buildSocialOperatingLoop()` dona el veredicte únic abans dels KPI: idees, publicacions programades/publicades i captació Instagram en una sola lectura.

CSS viu:
- No hi ha CSS local de la ruta; consumeix classes globals admin/Tailwind existents.
- Residu visual menor existent: maps locals amb emoji (`IDEA_SOURCE_ICON`, `PLATFORM_ICON`) i tons locals (`STATUS_TONE`). No es toca en aquesta fitxa; si es reutilitzen fora de Social, s'han d'extreure a constants compartides.

APIs/serveis vius:
- `lib/services/socialPostService.ts`: validació, CRUD, counts, calendari i sincronització amb Google Calendar (`syncSocialPostToGoogleCalendar`).
- `lib/services/socialIdeasService.ts`: genera idees des de bookings recents, testimonials aprovats, portfolio publicat i esdeveniments propers.
- `lib/services/socialContentPulseService.ts`: calcula pols 30 dies, consistència, drafts, programades i leads Instagram.
- `lib/services/socialPerformanceService.ts`: mètriques per canal i recomanacions de ritme/diversitat.
- Tests vius: `SocialClient.test.tsx`, `socialOperatingLoop.test.ts`, routes API i serveis social.

Dades que governa:
- Posts socials (`SocialPost`) amb estat, plataformes, calendari, publicació, media, booking vinculat i notes.
- Idees de contingut derivades de booking/testimonial/portfolio/upcoming events.
- Pols editorial: publicades, programades, esborranys, consistència, dies des de l'últim post.
- Captació social: leads d'origen Instagram i guanyats.

Accions que governa:
- Crear/editar posts socials.
- Canviar estat (`IDEA`, `DRAFT`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`).
- Eliminar posts.
- Pre-omplir posts des d'idees generades.
- Sincronitzar cada canvi amb Google Calendar.

Òrgans veïns:
- upstream: Bookings, Testimonials, Portfolio, Leads Instagram, Google Calendar.
- downstream: Daily Brief, Sales Ops, Calendari, Marketing Hub i reporting social.
- veïns conceptuals: `/admin/marketing` diagnostica canals/gaps; `/admin/campaigns` genera drafts CRM massius; `/admin/social` governa calendari, posting i pols editorial.

Codi mort relacionat:
- Cap evidència de codi mort: la page importa tots els serveis principals, les APIs són consumides pel client i els tests cobreixen serveis, ruta i component.

Duplicacions:
- No duplica Marketing: Social executa contingut i calendari; Marketing decideix readiness, canals i gaps de mesura.
- No duplica Campanyes: Social tracta posts/plataformes/calendari; Campanyes tracta missatges CRM massius a segments de clients.
- No necessita planificador avançat ara: el #379/#742 deixen el criteri de reobertura només si `socialPerformanceService` marca inactivitat o baixa freqüència recurrent.

Hardcoded/residu visual:
- Copy admin local acceptable per pantalla interna.
- Constants de domini de plataformes/estats/tipus/categories viuen a `lib/constants`; el client encara té mappings visuals locals perquè només són d'aquesta pantalla.
- Si Social es divideix o algun mapping es reutilitza fora de la ruta, cal extreure'l abans de duplicar.

Connexions interrompudes:
- No hi ha connector real de publicació directa a xarxes; Social és calendari/operació, no publisher automàtic.
- El rendiment per canal existeix com a servei/API, però la fitxa actual confirma el paper del workspace, no l'eleva a BI paid complet.

Riscos:
- Crear rutes separades `social-calendar`, `social-ideas` o `editorial-calendar` trencaria el guard #688 i fragmentaria §6.9.
- Convertir Marketing en calendari social o Social en generador CRM duplicaria responsabilitats ja fixades al #1206/#1207.
- Automatitzar publicació externa sense traça i permisos explícits seria una capacitat nova, no una millora menor.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/social/page.tsx`, `lib/services/socialPostService.ts`, `lib/services/socialIdeasService.ts`, `lib/services/socialContentPulseService.ts`, `lib/socialOperatingLoop.ts`.
- imports/exports verificats: page → serveis social; `SocialClient` → APIs; `buildSocialOperatingLoop` → client i tests; consumidors de `/admin/social` via `rg`.
- serveis/APIs seguits: page → `listSocialPosts`/`loadSocialIdeas`/`loadSocialContentPulse`; client → `/api/admin/social-posts`; service → Prisma + Google Calendar.
- proves/guards executats: lectura forense + `rg` de consumidors. Validació tècnica final del canvi documental: `qa:no-dead-admin-views`, `tsc --noEmit`, `qa:protocol`, `git diff --check`.

Decisio de treball:
- conservar `/admin/social` com a hub viu de calendari editorial, idees i captació social.
- no crear planificador social avançat mentre no hi hagi fricció recurrent mesurada.
- no fusionar Social amb Marketing ni Campanyes; els tres òrgans queden separats i cablejats per responsabilitat.

### `/admin/clientes/reactivation`

Pantalla: Reactivació de clients — candidats individuals per recuperar recurrència.
Ruta: `/admin/clientes/reactivation`
Estat inventari: 🔴 (no migrada visualment al mapa de pàgines)
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1210, codex, 2026-06-28)

Història:
- Creat al #41 amb `reactivationService.ts`, UI completa i 20 tests: candidats dormants/en risc, missatges ca/es, WhatsApp/email/copiar/descartar.
- Integrat posteriorment amb Customer Hub i Tasks (#201-#210): la reactivació assistida obre esborrany o tasca, no enviament automàtic, i queda deduplicada per `TASK_DEDUPE_KEY.reactivation(customerId)`.
- Visualment drenada als #1137/#1139 i reparada de tokens fantasma al #1169. Aquesta fitxa en comprova el rol funcional dins el mapa Campanyes/Social/Marketing.

Reachability:
- `app/admin/clientes/reactivation/page.tsx` és ruta Next real, `dynamic = 'force-dynamic'`.
- `app/admin/lib/adminNav.ts` classifica l'àrea Clients; `/admin/campaigns` enllaça cap a aquesta ruta com a pas individual.
- `lib/constants/adminManual.ts`, Daily Brief i Customer Hub referencien la reactivació com a part de recurrència/CRM.
- `loading.tsx` existeix per contracte de pàgina admin.

Component viu:
- `page.tsx`: carrega `loadReactivationCandidates()` i renderitza `AdminPage` amb CTA `Tornar al CRM`.
- `ReactivationClient.tsx`: filtra per prioritat, descarta candidats localment, copia missatge, obre WhatsApp/email, enllaça Customer Hub i mostra facts comercials del client.
- `reactivation.css`: gramàtica local `rc__*` escopada a la ruta, amb tokens reparats.

APIs/serveis vius:
- `lib/services/reactivationService.ts`
  - `generateReactivationCandidates(input)`: funció pura testada.
  - `loadReactivationCandidates(now, limit)`: wrapper Prisma sobre `Customer`.
- Tests vius: `__tests__/lib/services/reactivationService.test.ts` (classificació, exclusions, ordenació, templates, canals, URL WhatsApp, dies).
- Traça operativa indirecta: Customer Hub genera tasques de reactivació amb `TASK_SOURCE.REACTIVATION` i dedupeKey canònic; `taskAdminService` deduplica/reobre quan cal.

Dades que governa:
- Lectura de `Customer`: lifecycleStage, totalEvents, totalSpent, healthScore, lastEventDate, lastContactedAt, preferredLocale, marketingConsent, email, telèfon i instagram.
- Classificacions: `DORMANT_VIP`, `DORMANT_HIGH_VALUE`, `DORMANT_RECURRING`, `DORMANT_FIRST_TIME`, `AT_RISK_HEALTH`, `CHURNED_RECOVERY`.
- Sortida: prioritat, score, canals suggerits, assumpte, missatge, WhatsApp URL i mailto.

Accions que governa:
- Obrir WhatsApp amb text preparat.
- Obrir email amb assumpte/cos preparats.
- Copiar missatge.
- Obrir fitxa 360 del client.
- Descartar candidat localment en sessió.
- No envia res automàticament i no persisteix campanya pròpia.

Òrgans veïns:
- upstream: Customer Hub, historial d'esdeveniments, lifecycle, health score i consentiments.
- downstream: Customer Hub, Tasks canòniques, Inbox/WhatsApp/email manual.
- veïns conceptuals: `/admin/campaigns` és reactivació massiva/manual per segments; `/admin/clientes/reactivation` és recuperació individual assistida; `/admin/leads/reengagement` és reactivació de leads, no de clients.

Codi mort relacionat:
- Cap evidència de codi mort: servei, page, client, CSS i tests són vius; `loadReactivationCandidates()` alimenta la pàgina.

Duplicacions:
- No duplica Campanyes: Campanyes proposa missatges per audiències agregades; Reactivació mostra persones concretes i sortides individuals.
- No duplica Customer Hub: Customer Hub és la fitxa canònica i absorbeix la traça; Reactivació és una cua focalitzada per trobar candidats.
- No duplica Leads Reengagement: reengagement tracta leads sense convertir; reactivació tracta clients amb historial.

Hardcoded/residu visual:
- Copy admin local acceptable; templates ca/es viuen dins el servei com a sortida de domini testada.
- Maps locals `PRIORITY_TONE` i `CHANNEL_ICON` són deute menor si s'han de reutilitzar fora de la ruta.
- `mailto:` i `wa.me` aquí són accions externes explícites i manuals; no s'han de confondre amb comunicació canònica automàtica.

Connexions interrompudes:
- El botó `Descartar` és estat local, no persistència de decisió. Acceptable com a triatge de sessió; si cal traça real, ha de passar per Customer Hub/Tasks/Timeline.
- La pàgina no crea tasques directament; la traça forta viu al Customer Hub. Això és intencionat perquè la fitxa 360 sigui el lloc de decisió.

Riscos:
- Convertir Reactivació en enviament automàtic massiu duplicaria Campanyes i trencaria la traça.
- Afegir persistència local de descart sense model canònic podria crear una quarta capa de decisió del client.
- Fusionar-la amb Leads Reengagement barrejaria clients amb historial i leads sense relació contractual.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/clientes/reactivation/page.tsx`, `app/admin/clientes/reactivation/ReactivationClient.tsx`, `lib/services/reactivationService.ts`, `__tests__/lib/services/reactivationService.test.ts`.
- imports/exports verificats: page → `loadReactivationCandidates`; client → `buildCustomerHubHref`; servei → Prisma + `CUSTOMER_DORMANT_MONTHS`; Customer Hub/Tasks → reactivació assistida amb dedupe.
- consumidors verificats amb `rg`: Campanyes, Daily Brief, Customer Hub, Manual i Tasks.
- proves/guards executats: lectura forense + `rg` de consumidors. Validació tècnica final del canvi documental: `qa:no-dead-admin-views`, `tsc --noEmit`, `qa:protocol`, `git diff --check`.

Decisio de treball:
- conservar `/admin/clientes/reactivation` com a cua individual assistida de clients.
- no convertir-la en campanya massiva ni enviament automàtic.
- si cal decisió persistent, fer-la passar per Customer Hub/Tasks/Timeline, no per estat local nou.

### `/admin/clientes/referrals`

Pantalla: Referrals — clients que porten clients i candidats per demanar recomanació.
Ruta: `/admin/clientes/referrals`
Estat inventari: 🔴 (no migrada visualment al mapa de pàgines)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1760, codex, 2026-07-09)

Història:
- Ruta satèl·lit del Customer Hub per treballar recurrència per recomanació: top referrers, valor generat i candidats concrets.
- El #1140 va registrar una migració visual a `rf__*` + `referrals.css`, però la reauditoria #1760 comprova que el codi viu no conserva aquesta forma: no existeix CSS propi de referrals i la pantalla encara usa `AdminPage`, `ap-*` i utilitats visuals locals.
- El #1683 va reparar el feedback de còpia fallida: quan el clipboard falla, només queda marcat el candidat afectat i hi ha test focalitzat.

Reachability:
- `app/admin/clientes/referrals/page.tsx` és ruta Next real, `dynamic = 'force-dynamic'`.
- `app/admin/clientes/referrals/loading.tsx` reutilitza el skeleton admin.
- Consumidors verificats amb `rg`: Customer Hub/CRM satèl·lit, post-event playbook, Marketing Hub, Reporting, Manual i constants operatives enllacen cap a `/admin/clientes/referrals`.

Component viu:
- `page.tsx`: carrega `loadReferralsSummary()` i renderitza `AdminPage` amb CTA `Tornar al CRM`.
- `ReferralsClient.tsx`: filtra per prioritat, descarta candidats localment, copia missatge, obre WhatsApp/email, enllaça Customer Hub i mostra top referrers/candidats.
- No hi ha `referrals.css` viu sota `app/admin/clientes/referrals`; el component depèn de `ap-*`, `AdminSection`, `AdminEmptyState` i utilitats Tailwind/variables.

APIs/serveis vius:
- `lib/services/referralsService.ts`
  - `computeReferralsSummary(input)`: funció pura testada.
  - `loadReferralsSummary(limit)`: wrapper Prisma sobre `Customer` amb `mergedIntoId = null`.
- Tests vius: `__tests__/lib/services/referralsService.test.ts` (resum, classificació, exclusions, ordenació, templates ca/es, WhatsApp i mailto) i `__tests__/app/admin/clientes/referrals/ReferralsClient.test.tsx` (error de còpia per candidat).
- Navegació canònica cap a client: `buildCustomerHubHref()`.

Dades que governa:
- Lectura de `Customer`: id, nom, email, telèfon, lifecycleStage, totalEvents, totalSpent, healthScore, referredById i preferredLocale.
- Sortida de negoci: referrers actius, clients referits, taxa de referral, valor generat, top referrers, candidats, prioritat, score, raó, assumpte, missatge, WhatsApp URL i mailto URL.

Accions que governa:
- Obrir WhatsApp amb text preparat.
- Obrir email amb assumpte/cos preparats via `mailto:`.
- Copiar missatge suggerit.
- Obrir fitxa 360 del client.
- Descartar candidat localment en sessió.
- No envia res automàticament i no persisteix la decisió de contacte.

Òrgans veïns:
- upstream: Customer Hub/CRM (`Customer.referredById`, lifecycle, salut, totalEvents, totalSpent), post-event playbook, Marketing Hub i Reporting.
- downstream: Customer Hub, WhatsApp, client d'email local i, si es vol traça forta, Tasks/Timeline/Inbox.
- veïns conceptuals: `/admin/clientes/reactivation` recupera clients; `/admin/clientes/referrals` demana recomanacions a clients sans o valuosos; Campanyes tracta audiències agregades.

Codi mort relacionat:
- Cap evidència de ruta morta: page, client, loading, servei i tests són vius.
- No hi ha API pròpia de referrals; la lectura és server-side via servei.

Duplicacions:
- No duplica Customer Hub: Referrals és una cua focalitzada; el client 360 continua sent la fitxa canònica.
- No duplica Reactivació: criteris, missatges i objectiu comercial són diferents.
- Templates ca/es viuen dins el servei com a sortida de domini testada; no crear un segon generador de missatges sense extreure contracte comú.

Hardcoded/residu visual:
- Deute P1 visual/documental: el #1140 no reflecteix el codi viu actual. La pantalla encara usa `AdminPage`, `ap-card`, `ap-kpi`, botons `ap-btn`, utilitats Tailwind (`grid`, `flex`, `text-[var(...)]`, `tracking-[...]`) i icones inline.
- `mailto:` és present dins `ReferralsClient`; és una acció manual externa, però si la norma de traça comercial es vol endurir, hauria de passar per Inbox/Compose o Customer Hub/Tasks.
- Copy admin local acceptable; si s'obre visualment, aprofitar per decidir si els templates de missatge han de migrar a constants o quedar com a lògica de domini testada.

Connexions interrompudes:
- El botó `Descartar` és estat local, no persistència. Acceptable com a triatge de sessió; si cal registre real, ha de crear tasca/activitat al Customer Hub o timeline.
- Obrir email amb `mailto:` no deixa activitat canònica. No és regressió d'aquest tall, però és el següent risc si Referrals ha de ser un flux comercial traçable.

Riscos:
- Marcar aquesta ruta com a migrada sense corregir la discrepància #1140 faria que el mapa Zenit mentís.
- Convertir referrals en enviament automàtic massiu duplicaria Campanyes i trencaria la traça.
- Persistir descartes localment sense model canònic crearia una capa paral·lela de decisió comercial.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/clientes/referrals/page.tsx`, `ReferralsClient.tsx`, `loading.tsx`, `lib/services/referralsService.ts`.
- tests llegits: `__tests__/lib/services/referralsService.test.ts`, `__tests__/app/admin/clientes/referrals/ReferralsClient.test.tsx`.
- imports/exports verificats: page -> `loadReferralsSummary` -> Prisma `Customer`; client -> `buildCustomerHubHref`, `formatCurrency`, `navigator.clipboard`, `mailtoUrl`/`whatsappUrl` del servei.
- consumidors verificats amb `rg`: Customer Hub/CRM, post-event, Marketing, Reporting i Manual.
- proves/guards executats en aquest tall documental: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`.

Decisio de treball:
- conservar `/admin/clientes/referrals` com a cua individual assistida de recomanacions.
- no marcar-la `🟢` ni `TANCAT CHARLIE` fins que es resolgui la discrepància visual #1140 amb CSS viu o es corregeixi formalment el registre antic.
- si es toca visualment, fer-ho com a tall acotat: `referrals.css` real o migració al sistema admin vigent, sense tocar schema, servei ni criteris de scoring.
- si es toca la traça comercial, substituir `mailto:` per flux canònic de compose/tasca o registrar activitat; no crear una quarta capa de comunicació.

### `/admin/portfolio`

Pantalla: Portfolio — gestor de media públic, categories, events i portades.
Ruta: `/admin/portfolio`
Estat inventari: 🔴 (migració visual completa pendent al mapa de pàgines)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1754, codex, 2026-07-08)

Història:
- Pantalla original de gestió visual de portfolio; reforçada per la sèrie de canonització visual (`#987-#1240`), pel guard CSRF dels endpoints (`#1029`) i per la reparació de mutacions amb `res.ok` (`#1711`).
- El #1727 hi afegeix la pestanya `Imatges`, drop-in per categoria, normalització de nom/carpeta/AVIF i comptadors que no fan zero fals abans de carregar media editable.
- El roadmap Manolo deixa el front `Portfolio/media pipeline` com a següent tall probable després del carril Lead/Reserva: cal provar que portfolio, productes Masquerade i snapshots de dossier no barregen fonts d'imatge.
- El #1842 elimina el camp manual `URL de portada` del formulari d'events i el substitueix per un selector d'imatges existents de la categoria; els vídeos ja no s'ofereixen com a portada pública.

Reachability:
- `app/admin/portfolio/page.tsx` és ruta Next real i client component únic.
- `app/admin/portfolio/loading.tsx` existeix.
- `app/admin/lib/adminNav.ts` enllaça `/admin/portfolio` dins Contingut/Web i marca actiu amb `pathname.startsWith('/admin/portfolio')`.
- Consumidors públics: `/portfolio`, `/portfolio/[slug]`, `/portfolio/[slug]/[eventSlug]`, home showcase i serveis públics consumeixen `portfolioEventService`, `portfolioMediaService`, `publicPortfolioShowcaseService` i `publicServiceMediaService`.

Component viu:
- `AdminPortfolioPage`: governa tabs `media|events`, càrrega d'events i preview fullscreen.
- `CategorySection`: llegeix media per categoria, mostra fallback estàtic, puja/substitueix/reordena media, assigna event, canvia portada i impedeix eliminar una imatge que és portada.
- `EventsManager`: crea event, publica/despublica i elimina event.
- `FullscreenPreview`: visualitza imatge/vídeo i bloqueja scroll mentre és obert.

CSS viu:
- Sense CSS local. Consumeix `AdminPage`, `.ap-card`, `.ap-btn`, `.ap-badge`, `.adm-*` parcial, `admin-tone-*` i tokens `--t`, `--t2`, `--t3`, `--line`, `--raised`, `--hair-gold`.
- Residu visual existent: classes Tailwind locals (`rounded-2xl`, `bg-black`, `bg-black/60`, grids i espaiats) dins la page. No es drena en #1754 perquè el tall és de frontera de dades/media, no de migració visual.

APIs/serveis vius:
- `/api/admin/portfolio/media`: GET llista per `slug`; POST puja `FormData`; PATCH caption/ordre/event; DELETE media. Mutacions amb `requireAuth` + `verifyCsrf`.
- `/api/admin/portfolio/events`: GET llista events; POST crea; PATCH actualitza; DELETE elimina. Mutacions amb `requireAuth` + `verifyCsrf`.
- `portfolioMediaService`: valida slugs, MIME, normalitza imatges amb `portfolioImageService`, desa a `portfolio/{slug}/...` i retorna URL pública via storage.
- `portfolioEventService`: crea/llista/actualitza/elimina events i vincula media; des del #1754 valida que `coverImage` vingui de media/galeria de portfolio, no de producte o proveïdor.
- `publicPortfolioShowcaseService` i `publicServiceMediaService`: la web pública prioritza media editable de portfolio, després galeria de booking, després fallback estàtic; no consumeix imatges de producte de col·laborador.
- `collaboratorProductService` + `dossierSnapshotService`: les imatges de producte Masquerade viuen al dossier/producte i es poden rehidratar al snapshot de dossier sense passar pel portfolio.

Dades que governa:
- `PortfolioMedia`: slug, mediaUrl, mediaType, caption, sortOrder, eventId i storage path.
- `PortfolioEvent`: slug públic, categoria, títol, metadades, coverImage, published i relació amb media.
- Catàleg estàtic `PORTFOLIO_IMAGES` només com fallback/lectura inicial, no com font editable.

Accions que governa:
- Pujar imatge/vídeo a una categoria.
- Substituir media conservant caption, ordre, event i portades vinculades.
- Reordenar media per drag/drop.
- Assignar media a event.
- Fer media portada d'un event.
- Crear, publicar/despublicar i eliminar event.
- Obrir preview fullscreen.

Òrgans veïns:
- upstream: Booking gallery, Image Manager, productes de col·laborador i catàleg estàtic.
- downstream: web pública `/portfolio`, home showcase, pàgines de servei, sitemap, Social Ideas i dossier/document quan el producte és Masquerade.

Codi mort relacionat:
- Cap component propi mort detectat dins `app/admin/portfolio`: la page és autocontinguda i reachable.
- `portfolioEventService` i `portfolioMediaService` tenen tests i consumidors admin/públics.

Duplicacions:
- No duplica Image Manager: Image Manager governa placements/overrides; Portfolio governa galeria pública per categoria i events.
- No duplica Booking Gallery: la galeria de booking pot alimentar portfolio com fallback o media publicable, però PortfolioMedia és la font editable explícita de l'aparador.
- No duplica productes de col·laborador: imatge de producte (`/img/collaborators/...`) és per dossier/producte; no és portada de portfolio.

Hardcoded/residu visual:
- Text admin local acceptable per pantalla interna.
- Copy estable de límits i empty state viu a `lib/constants/portfolio-media.ts`.
- El #1754 afegeix la regla compartida `isPortfolioEventCoverImage()` i l'error canònic de font de portada a constants, no a la page.

Connexions interrompudes:
- Abans del #1754, `PortfolioEvent.coverImage` podia acceptar qualsevol URL manual, inclosa una imatge de producte Masquerade. Això trencava la frontera del roadmap: portfolio per galeria pública, producte per dossier, snapshot per document enviat.
- Amb #1754, create/update d'event bloqueja portades fora de `/api/uploads/portfolio/`, `/api/uploads/bookings/` o `/img/portfolio/`.

Riscos:
- La migració visual de la pantalla continua pendent: no confondre fitxa forense FETA amb `TANCAT CHARLIE`.
- Si algun event històric té portada fora de les fonts permeses, continuarà renderitzant fins que s'editi; el tall protegeix noves escriptures i actualitzacions.
- Si algun dia es vol usar una imatge de producte com aparador públic, s'ha de pujar o vincular com a PortfolioMedia, no referenciar directament el producte.

Evidència d'auditoria:
- fitxers llegits línia per línia: `app/admin/portfolio/page.tsx`, `app/api/admin/portfolio/media/route.ts`, `app/api/admin/portfolio/events/route.ts`, `lib/services/portfolioMediaService.ts`, `lib/services/portfolioImageService.ts`, `lib/services/portfolioEventService.ts`, `lib/services/publicPortfolioShowcaseService.ts`, `lib/services/publicServiceMediaService.ts`, `lib/services/collaboratorProductService.ts`, `lib/services/dossierSnapshotService.ts`, tests focalitzats.
- història revisada: `git log --follow -- app/admin/portfolio/page.tsx` mostra #1727/drop-in, canonitzacions #987-#1240 i origen antic del gestor.
- imports/exports verificats: page → APIs; APIs → services; públic → `listPortfolioMedia`/`listPortfolioEvents`; dossier/producte → `collaboratorProductToAnimacioProduct`/snapshot.
- serveis/APIs seguits: upload → storage `/api/uploads/portfolio`; booking gallery → `/api/uploads/bookings`; dossier producte → `/img/collaborators`; web pública → portfolio media abans de gallery/static.
- proves/guards executats: `pnpm test:run -- --run __tests__\lib\services\portfolioEventService.test.ts` OK (20/20) abans del registre.

Decisio de treball:
- conservar `/admin/portfolio` com a gestor visual de l'aparador públic.
- #1754 toca només frontera de portada d'event i fitxa; no migra visualment la pantalla.
- següent tall possible del front: prova real browser/drop-in amb pujada/substitució i captura admin; el contracte de selector de portada existent queda fet al #1842.

### `/admin/economia`

Pantalla: Economia — cockpit financer, cobrament, marge, tresoreria, forecast, CAC i model de packs.
Ruta: `/admin/economia`
Estat inventari: 🔴 (migració visual completa pendent al mapa de pàgines)
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1789, codex, 2026-07-09; P1 permisos resolt #1790; P2 feedback resolt #1791; tabs icones resolt #1792; icones secció resolt #1793; rendibilitat mòbil resolta #1794; tresoreria mòbil resolta #1795; previsions mòbil resolta #1796; config packs resolt #1797)

Història:
- Economia concentra el front de diners del sistema: cobraments, cash-aware, marge, previsió, CAC, packs i vehicle.
- Els canvis #1626, #1651, #1652, #1681 i #1737 ja van corregir punts crítics de cash-aware, feedback de toggles/recordatoris i doble comptatge de transport.
- El #1788 només neteja quatre separadors corruptes a `page.tsx`; no és fitxa ni migració visual.

Reachability:
- `app/admin/economia/page.tsx` és ruta Next real, `dynamic = 'force-dynamic'`.
- `app/admin/economia/EconomiaClient.tsx` és el client principal i rep tota la projecció server.
- `loading.tsx` existeix.
- Entrades verificades amb `rg`: Manual, Salut/finance alerts, Reporting Insights, Master Atlas i navegació d'operativa apunten a `/admin/economia`.
- `?tab=` és suportat pel client i validat contra `resum`, `cobraments`, `rendibilitat`, `tresoreria`, `previsions`, `config`.

Component viu:
- `page.tsx`: carrega bookings no cancel·lades, timeline de comunicacions, resum de cobraments, informe de rendibilitat, valor d'inventari, model de packs, histories, tresoreria, forecast, vehicle i CAC.
- `EconomiaClient`: tabs, franja executiva, KPIs, taules, alertes, export CSV i connexions a reserves/packs.
- `economia-components.tsx`: KPIs, progress bars, timeline de pagament i filtres/bulk de cobraments.
- Components fills mutadors: `PaymentToggleButton`, `PaymentReminderActions`, `MarketingSpendPanel`, `ProfitabilityConfigEditor`, `ProfitabilityConfigHistory`, `PackPricingModelEditor`, `PackPricingModelHistory`.

APIs/serveis vius:
- Cobraments: `bookingOutstandingBreakdown`, `buildEconomiaPaymentRow`, `summarizeEconomiaPaymentRows`, `/api/admin/bookings/[id]`, `/api/admin/bookings/[id]/communications`, `/api/admin/bookings/bulk-payment`.
- Marge: `buildProfitabilityReport`, `normalizeProfitabilityConfig`, `/api/admin/reports/profitability`, `/api/admin/reports/profitability/config`.
- Packs: `computePackPricingHealth`, `getPackPricingModelConfigEditable`, `/api/admin/pricing/model-config`, histories via `adminLog`.
- Tresoreria/forecast/CAC: `buildCashFlowForecast`, `buildPipelineForecast`, `buildCacAnalysis`, `marketingSpendService`, `/api/admin/marketing/spend`.
- Vehicle: `getEffectiveVehicleCostPerKm()`.
- Navegació canònica: `buildBookingHref()` i `buildPackHref()`.

Dades que governa:
- `Booking`: imports, bestreta, resta, efectiu, status, data i client.
- Timeline/comunicacions: estat del flux `PAYMENT`.
- `Setting(finance.profitabilityConfig)` i `Setting(pricing.pack.modelConfig)`.
- `adminLog`: histories de configuració i restauració.
- `Pack` + inventari associat per cost/hora i recomanat comercial.
- `MarketingSpend`: despesa real per canal/mes per calcular CAC real.
- `InventoryItem`: valor d'actius.

Accions que governa:
- Marcar bestreta/resta pagada en una reserva concreta.
- Enviar o registrar recordatori de cobrament per email/WhatsApp.
- Marcar pagaments en bulk.
- Desar/eliminar despesa de màrqueting.
- Desar/restaurar configuració de rendibilitat.
- Desar/restaurar model econòmic de packs.
- Exportar CSV de rendibilitat, cobraments i històrics.
- Obrir reserva o pack des del context econòmic.

Òrgans veïns:
- upstream: Reserves, Leads, Timeline/Inbox, Packs, Inventari, Marketing, Google Ads/GA4 indirecte, fuel reference.
- downstream: Salut/alertes financeres, Dashboard/brief econòmic, Reporting, Pricing, Cost Calculator, Reserves i Packs.
- No duplica la fitxa de reserva: Economia és control transversal; la reserva continua sent la veritat operativa del bolo.
- No duplica Marketing Hub: Marketing decideix canals i gaps; Economia carrega despesa real i calcula CAC.
- No duplica Pricing: Pricing governa preus del catàleg; Economia audita si els packs respiren marge i recomana PVP.

Codi mort relacionat:
- Cap ruta morta detectada dins `app/admin/economia`: page, client, components, loading i tests focalitzats són vius.
- `/api/admin/reports/profitability` és API de lectura latent respecte la page server, però útil com contracte admin read-only; no és eliminable sense revisar consumidors futurs.
- `economicCockpitService` no és usat directament per aquesta page; viu com a composició per altres superfícies executives.

Hardcoded/residu visual:
- Resolt #1792: les pestanyes ja no exposen emoji; `TABS` usa claus `TabIcon` i `EconomiaClient` les renderitza amb `lucide-react`.
- Resolt #1793: les cards d'alerta/top i capçaleres de secció ja no exposen emoji locals (`⚠️`, `📉`, `🏆`, `📊`, `⏰`); `EconomiaClient` les renderitza amb `lucide-react`.
- Resolt #1794: en mòbil, `Rendibilitat per canal d'adquisició` ja no força una taula horitzontal tallada; mostra cards de canal i conserva la taula en desktop/tablet.
- Resolt #1794: els noms dels esdeveniments del top de marge poden fer línia en mòbil i mantenen truncat només a partir de `sm`.
- Resolt #1795: en mòbil, `Previsió de tresoreria` ja no amaga costos, flux net i acumulat dins una taula horitzontal; mostra cards mensuals i conserva la taula en desktop/tablet.
- Resolt #1796: en mòbil, `Previsió de vendes` i `CAC per canal` ja no amaguen rang, YoY, confirmades, conversió, despesa i CAC real dins taules horitzontals; mostren cards i conserven taules en desktop/tablet.
- Resolt #1797: `Semàfor de packs` ja no depèn d'una taula de 1450px en mòbil/desktop normal; mostra cards compactes i reserva la taula per pantalles molt amples.
- Hi ha amplades inline en barres (`style={{ width: ... }}`) derivades de percentatges runtime. Són dades visuals legítimes, no hardcode de layout.
- Taules molt amples (`min-w-[1450px]`, `1080px`, etc.) són honestes per densitat de dades però requereixen revisió visual real abans de marcar `🟢`.
- `EconomiaClient.tsx` continua sent una peça molt gran; està parcialment trencada en components, però encara barreja moltes seccions.

Connexions interrompudes / P1-P2:
- Resolt #1790: `/api/admin/bookings/bulk-payment` exigeix `requirePermission(req, 'mutate')`, alineat amb el PATCH individual de booking i comunicacions.
- Resolt #1790: `/api/admin/marketing/spend` exigeix `read` en GET i `mutate` en POST/DELETE, alineat amb les configs de rendibilitat i packs.
- Resolt #1791: `ProfitabilityConfigEditor`, `PackPricingModelEditor` i els historials de restore anuncien èxit amb `role="status"` i error amb `role="alert"`.
- Resolt #1791: l'error de bulk payment s'anuncia amb `role="alert"`.

Riscos:
- Qualsevol canvi de càlcul pot afectar marge, cash, alertes de salut, reporting i decisions de preu.
- Recalcular transport dins Economia sense respectar `[travel-cost]` o `bookingOutstandingBreakdown` pot reobrir bugs ja tancats.
- Tocar model de packs impacta recomanat comercial, pack editor, health, crons de pricing i decisió de vendre.
- Relaxar permisos aquí és especialment delicat: no és una pantalla de lectura decorativa, escriu diners i criteris econòmics.

Evidència d'auditoria:
- fitxers llegits línia per línia: `page.tsx`, `EconomiaClient.tsx`, `economia-types.ts`, `economia-payments.ts`, `economia-components.tsx`, `PaymentToggleButton.tsx`, `PaymentReminderActions.tsx`, `MarketingSpendPanel.tsx`, `ProfitabilityConfigEditor.tsx`, `ProfitabilityConfigHistory.tsx`, `PackPricingModelEditor.tsx`, `PackPricingModelHistory.tsx`, `loading.tsx`.
- routes llegides: `/api/admin/bookings/bulk-payment`, `/api/admin/bookings/[id]`, `/api/admin/bookings/[id]/communications`, `/api/admin/reports/profitability`, `/api/admin/reports/profitability/config`, `/api/admin/pricing/model-config`, `/api/admin/marketing/spend`.
- serveis i tests revisats per traça: `profitabilityService`, `packPricingHealth`, `cashFlowForecast`, `pipelineForecast`, `cacAnalysis`, `adminConfigHistoryService`, `marketingSpendService`, tests de payments, toggles, reminders, marketing spend i pricing model config.
- proves/guards del tall documental i visual: `qa:no-dead-admin-views`, `qa:protocol`, `git diff --check`, `section-icons.test.ts`, `profitability-mobile-cards.test.ts`, `cashflow-mobile-cards.test.ts`, `forecast-mobile-cards.test.ts`, `cac-mobile-cards.test.ts`, `pack-pricing-mobile-cards.test.ts`, captures `.codex-captures/economia-1793/`, `.codex-captures/economia-1794/`, `.codex-captures/economia-1795/`, `.codex-captures/economia-1796/` i `.codex-captures/economia-1797/`.

Decisio de treball:
- conservar `/admin/economia` com a cockpit financer transversal i no fusionar-la amb Reserves, Marketing ni Pricing.
- no marcar `🟢` ni `TANCAT CHARLIE` fins que es faci validació visual amb captura real.
- següent tall segur: fer una passada visual agregada de totes les pestanyes d'Economia amb captures abans de qualsevol `TANCAT CHARLIE`, sense tocar càlculs.

## Registre de fitxes per fer

| Ruta | Page | Estat fitxa | Propietari | Nota |
|---|---|---:|---|---|
| `/admin` | `app/admin/page.tsx` | FETA | codex | Avui/Copilot — òrgan Comandament #1156; NBA/economia/post-event; dossiers #1844, contractes #1845 i pressupostos draft #1846 |
| `/admin/activity` | `app/admin/activity/page.tsx` | FETA | codex | Activity log — fitxa forense #1763; read-only via `timelineQueryService` |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | FETA | codex | Analytics — fitxa #1832; GA4 viu, Ads pendent de config; tendència GA4 sparse #1835 |
| `/admin/blog` | `app/admin/blog/page.tsx` | PENDENT | codex/claude | Blog llista |
| `/admin/blog/edit/[id]` | `app/admin/blog/edit/[id]/page.tsx` | PENDENT | codex/claude | Blog edició |
| `/admin/blog/new` | `app/admin/blog/new/page.tsx` | PENDENT | codex/claude | Nou blog |
| `/admin/bookings` | `app/admin/bookings/page.tsx` | FETA | codex | Reserves llista — fitxa forense #1384; contenidors/glass P2 drenats #1142; pipeline dots/botons P2 drenats #1149 |
| `/admin/bookings/[id]` | `app/admin/bookings/[id]/page.tsx` | FETA | codex | Reserva detall — fitxa forense #1112 |
| `/admin/bookings/new` | `app/admin/bookings/new/page.tsx` | FETA | codex | Nova reserva — fitxa forense #1383; TravelDiscount inline layout P3 drenat #1157; ClientEvent marges inline drenats #1158 |
| `/admin/calendario` | `app/admin/calendario/page.tsx` | FETA | codex | Calendari mes/setmana/dia — fitxa forense #1387 |
| `/admin/calendario/capacity` | `app/admin/calendario/capacity/page.tsx` | FETA | codex | Capacitat operativa — fitxa forense #1388 |
| `/admin/campaigns` | `app/admin/campaigns/page.tsx` | FETA | codex | Campanyes — fitxa forense #1206 |
| `/admin/canvas` | `app/admin/canvas/page.tsx` | PENDENT | codex/claude | Canvas |
| `/admin/catalog` | `app/admin/catalog/page.tsx` | FETA | codex | Catàleg — hub fitxa #1822; semàfor visual #1823 resolt; densitat pendent |
| `/admin/clientes` | `app/admin/clientes/page.tsx` | FETA | codex | Clients llista — fitxa forense #1761; canonització #1273; `?segment=` resolt #1762 |
| `/admin/clientes/[id]` | `app/admin/clientes/[id]/page.tsx` | FETA | codex | Client 360 — fitxa forense #1114; Timeline #1116; Insights #1117; Bookings #1118; Privacy #1119; Discounts #1120; Summary #1121 |
| `/admin/clientes/reactivation` | `app/admin/clientes/reactivation/page.tsx` | FETA | codex | Reactivació — fitxa forense #1210; visual `ReactivationClient` drenat #1139 |
| `/admin/clientes/referrals` | `app/admin/clientes/referrals/page.tsx` | FETA | codex | Referrals — fitxa forense #1760; discrepància visual #1140 reoberta com a deute |
| `/admin/collaborators` | `app/admin/collaborators/page.tsx` | PENDENT | codex/claude | Partners |
| `/admin/collaborators/[id]` | `app/admin/collaborators/[id]/page.tsx` | PENDENT | codex/claude | Partner detail |
| `/admin/cost-calculator` | `app/admin/cost-calculator/page.tsx` | PENDENT | codex/claude | Calculadora costos |
| `/admin/coverage` | `app/admin/coverage/page.tsx` | FETA | codex | Coverage — fitxa forense #1764; feedback errors resolt #1765; busy remove/toggle #1766 |
| `/admin/crons` | `app/admin/crons/page.tsx` | FETA | codex | Crons — fitxa forense #1767; health #1768, route #1769 i error state #1770 resolts |
| `/admin/css-manager` | `app/admin/css-manager/page.tsx` | FETA | codex | CSS Manager — fitxa forense #1771; sanitització client #1772 i load error #1773 resolts |
| `/admin/cuadrant` | `app/admin/cuadrant/page.tsx` | FETA | claude | Quadrant — fitxa forense #1115 |
| `/admin/cuadrant/repartiment` | `app/admin/cuadrant/repartiment/page.tsx` | FETA | claude | Repartiment — fitxa forense #1115 |
| `/admin/discount-codes` | `app/admin/discount-codes/page.tsx` | FETA | codex | Codis descompte — fitxa #1824; P1 toggle/API, permisos, mojibake euro i feedback resolts #1825; visual pendent |
| `/admin/docs/electric-atlas` | `app/admin/docs/electric-atlas/page.tsx` | FETA | codex | Atles elèctric — fitxa #1830; escàner viu del repo real via `repoElectricAtlasService`; visual tabs amples pendent |
| `/admin/docs/master` | `app/admin/docs/master/page.tsx` | FETA | codex | Master Òrbita — fitxa #1829; porta modular viva sobre `masterAtlasService`; validació visual/priorització pendents |
| `/admin/docs/esquema` | `app/admin/docs/esquema/page.tsx` | FETA | codex | Docs esquema — fitxa #1826; viewer read-only sobre `docs/admin-esquema-absolut.md`; taules mòbil apilades #1831 |
| `/admin/docs/full-de-ruta` | `app/admin/docs/full-de-ruta/page.tsx` | FETA | codex | Full de ruta — fitxa #1827; viewer read-only sobre `docs/producte-zenit-full-de-ruta.md`; taules mòbil apilades #1831 |
| `/admin/docs/organisme` | `app/admin/docs/organisme/page.tsx` | FETA | codex | Organisme/Atles — fitxa #1828; viewer read-only sobre `docs/admin-organisme-atles.md`; taules mòbil apilades #1831; cobertura v1 pendent |
| `/admin/docs/protocol` | `app/admin/docs/protocol/page.tsx` | FETA | codex | Protocol — fitxa forense #1787; toggle validació humana #1786; API només Canvis existents #1834 |
| `/admin/docs/visual-audit` | `app/admin/docs/visual-audit/page.tsx` | FETA | codex | Auditoria visual — fitxa forense compacta #1417 |
| `/admin/dossiers` | `app/admin/dossiers/page.tsx` | FETA | codex | Dossiers — òrgan Documents #1155; camí canònic de creació unificat #1748-#1749 |
| `/admin/economia` | `app/admin/economia/page.tsx` | FETA | codex | Economia — fitxa #1789; mojibake #1788; permisos #1790; feedback #1791; tabs #1792; seccions #1793; rendibilitat mòbil #1794; tresoreria mòbil #1795; previsions mòbil #1796; config packs #1797 |
| `/admin/email-templates` | `app/admin/email-templates/page.tsx` | PENDENT | codex/claude | Plantilles email |
| `/admin/email-templates/[slug]` | `app/admin/email-templates/[slug]/page.tsx` | PENDENT | codex/claude | Editor plantilla |
| `/admin/emails` | `app/admin/emails/page.tsx` | PENDENT | codex/claude | Emails |
| `/admin/faq` | `app/admin/faq/page.tsx` | PENDENT | codex/claude | FAQ |
| `/admin/faq/[id]` | `app/admin/faq/[id]/page.tsx` | PENDENT | codex/claude | FAQ detall |
| `/admin/faq/new` | `app/admin/faq/new/page.tsx` | PENDENT | codex/claude | Nova FAQ |
| `/admin/features` | `app/admin/features/page.tsx` | FETA | codex | Features — fitxa forense #1777; icones #1778; settings sense consumidor públic detectat |
| `/admin/google-reviews` | `app/admin/google-reviews/page.tsx` | PENDENT | codex/claude | Google Reviews |
| `/admin/image-manager` | `app/admin/image-manager/page.tsx` | PENDENT | codex/claude | Image Manager |
| `/admin/inbox` | `app/admin/inbox/page.tsx` | PENDENT | codex/claude | Inbox |
| `/admin/inbox/compose` | `app/admin/inbox/compose/page.tsx` | PENDENT | codex/claude | Compose |
| `/admin/inbox/settings` | `app/admin/inbox/settings/page.tsx` | PENDENT | codex/claude | Inbox settings |
| `/admin/intake` | `app/admin/intake/page.tsx` | PENDENT | codex/claude | Intake |
| `/admin/inventory` | `app/admin/inventory/page.tsx` | PENDENT | codex/claude | Inventari |
| `/admin/inventory/[id]` | `app/admin/inventory/[id]/page.tsx` | PENDENT | codex/claude | Inventari detall |
| `/admin/inventory/new` | `app/admin/inventory/new/page.tsx` | PENDENT | codex/claude | Nou inventari |
| `/admin/leads` | `app/admin/leads/page.tsx` | INICIAL | propietari/codex/claude | TANCAT CHARLIE visual; auditoria de cablejat completa pendent del resultat Claude |
| `/admin/leads/[id]` | `app/admin/leads/[id]/page.tsx` | FETA / TANCAT CHARLIE | codex/claude | Lead detall — validació propietari #1759; accions Dossiers solidàries #1833 |
| `/admin/leads/arxiu` | `app/admin/leads/arxiu/page.tsx` | PENDENT | codex/claude | Arxiu leads |
| `/admin/leads/reengagement` | `app/admin/leads/reengagement/page.tsx` | PENDENT | codex/claude | Reengagement |
| `/admin/manual` | `app/admin/manual/page.tsx` | FETA | codex | Manual — fitxa forense #1785; memòria operativa server |
| `/admin/marketing` | `app/admin/marketing/page.tsx` | FETA | codex | Marketing — fitxa forense #1207 |
| `/admin/mensajes` | `app/admin/mensajes/page.tsx` | PENDENT | codex/claude | Missatges |
| `/admin/packs` | `app/admin/packs/page.tsx` | FETA | codex | Packs — fitxa forense #1805; permisos API #1800; visual/editor ràpid pendent |
| `/admin/packs/[id]` | `app/admin/packs/[id]/page.tsx` | FETA | codex | Pack detall — fitxa #1808; tab #1809, tabs #1810, feedback #1811 i labels #1812-#1814 resolts |
| `/admin/packs/extras` | `app/admin/packs/extras/page.tsx` | FETA | codex | Extres — fitxa #1818; permisos API #1819; claus i18n #1820 i feedback/botons #1821 resolts; visual pendent |
| `/admin/packs/new` | `app/admin/packs/new/page.tsx` | FETA | codex | Nou pack — fitxa #1816; saneig formulari #1817; permisos API #1800; validació visual pendent |
| `/admin/portfolio` | `app/admin/portfolio/page.tsx` | FETA | codex | Portfolio/media pipeline — fitxa forense #1754 |
| `/admin/post-event` | `app/admin/post-event/page.tsx` | PENDENT | codex/claude | Post-event |
| `/admin/post-event/seguiment` | `app/admin/post-event/seguiment/page.tsx` | PENDENT | codex/claude | Seguiment |
| `/admin/post-event/feedback` | `app/admin/post-event/feedback/page.tsx` | PENDENT | codex/claude | Alias legacy de seguiment |
| `/admin/post-event/playbook` | `app/admin/post-event/playbook/page.tsx` | PENDENT | codex/claude | Playbook |
| `/admin/post-event/reports` | `app/admin/post-event/reports/page.tsx` | PENDENT | codex/claude | Reports |
| `/admin/post-event/reports/new` | `app/admin/post-event/reports/new/page.tsx` | PENDENT | codex/claude | Nou report |
| `/admin/post-event/surveys` | `app/admin/post-event/surveys/page.tsx` | PENDENT | codex/claude | Enquestes |
| `/admin/presupuestos` | `app/admin/presupuestos/page.tsx` | INICIAL | codex | Fitxa inicial; preview/transport/editor #1839; IVA/ruta/Bingo +70 #1840; drafts afloren a `/admin` #1846; auditoria línia per línia pendent |
| `/admin/presupuestos/[id]` | `app/admin/presupuestos/[id]/page.tsx` | FETA | codex | Pressupost detall / PDF Studio — fitxa forense #1029 |
| `/admin/pricing` | `app/admin/pricing/page.tsx` | FETA | codex | Pricing — fitxa forense #1801; permisos API #1799; visual pendent |
| `/admin/privacy` | `app/admin/privacy/page.tsx` | PENDENT | codex/claude | Privacitat |
| `/admin/questionnaires` | `app/admin/questionnaires/page.tsx` | PENDENT | codex/claude | Qüestionaris |
| `/admin/questionnaires/[id]` | `app/admin/questionnaires/[id]/page.tsx` | PENDENT | codex/claude | Qüestionari detall |
| `/admin/questionnaires/new` | `app/admin/questionnaires/new/page.tsx` | PENDENT | codex/claude | Nou qüestionari |
| `/admin/quick-create` | `app/admin/quick-create/page.tsx` | PENDENT | codex/claude | Quick create |
| `/admin/reporting` | `app/admin/reporting/page.tsx` | PENDENT | codex/claude | Reporting |
| `/admin/ressenyes` | `app/admin/ressenyes/page.tsx` | PENDENT | codex/claude | Ressenyes |
| `/admin/sales-ops` | `app/admin/sales-ops/page.tsx` | PENDENT | codex/claude | Sales Ops |
| `/admin/salut` | `app/admin/salut/page.tsx` | PENDENT | codex/claude | Salut |
| `/admin/scripts` | `app/admin/scripts/page.tsx` | FETA | codex | Scripts — fitxa forense #1774; risc #1775 i guard fitxers #1776 resolts |
| `/admin/settings` | `app/admin/settings/page.tsx` | PENDENT | codex/claude | Settings |
| `/admin/settings/company` | `app/admin/settings/company/page.tsx` | PENDENT | codex/claude | Empresa |
| `/admin/settings/hero` | `app/admin/settings/hero/page.tsx` | PENDENT | codex/claude | Hero |
| `/admin/settings/integrations` | `app/admin/settings/integrations/page.tsx` | PENDENT | codex/claude | Integracions |
| `/admin/settings/notifications` | `app/admin/settings/notifications/page.tsx` | PENDENT | codex/claude | Notificacions |
| `/admin/settings/quotes` | `app/admin/settings/quotes/page.tsx` | PENDENT | codex/claude | Pressupostos config |
| `/admin/social` | `app/admin/social/page.tsx` | FETA | codex | Social — fitxa forense #1209 |
| `/admin/stats` | `app/admin/stats/page.tsx` | FETA | codex | Stats — fitxa forense #1783; pont public #1782 i icones #1784 resolts |
| `/admin/studio` | `app/admin/studio/page.tsx` | PENDENT | codex/claude | Studio |
| `/admin/tasks` | `app/admin/tasks/page.tsx` | PENDENT | codex/claude | Tasques |
| `/admin/tasks/new` | `app/admin/tasks/new/page.tsx` | PENDENT | codex/claude | Nova tasca |
| `/admin/text-manager` | `app/admin/text-manager/page.tsx` | FETA | codex | Text Manager — fitxa forense #1779; GET #1780 i alertes #1781 resolts |
