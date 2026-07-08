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
| Clients | `/admin/clientes`, `/admin/clientes/[id]`, `/admin/clientes/reactivation`, `/admin/clientes/referrals` | INICIAL parcial |
| Catàleg | `/admin/packs`, `/admin/packs/[id]`, `/admin/packs/extras`, `/admin/inventory`, `/admin/pricing`, `/admin/catalog` | FETA (#1132) |
| Partners | `/admin/collaborators`, `/admin/collaborators/[id]` | FETA (#1145) |
| Post-event | `/admin/post-event`, reports, surveys, feedback, playbook | FETA (#1162) |
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
TANCAT CHARLIE: no — pendent validació visual del propietari.
Estat fitxa: FETA (auditoria forense #1032, claude, 2026-06-22)

Història:
- redisseny "fitxa en una pantalla" #920-#939 (b22f3434): va consolidar tota la fitxa al cockpit `LeadDetailClient` (edició inline, dossiers, vincle client, economia del bolo).
- #1032: eradicades ~2.500 línies de codi mort que el redisseny havia deixat penjades.

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

Hardcoded/residu visual: pendent passada visual del propietari; no detectat residu de tokens en aquesta auditoria (no s'ha tocat CSS).

Connexions interrompudes: cap. Arbre viu net page → LeadDetailClient → LeadBoloSection.

Decisió de treball:
- FET: eradicat el codi mort, podada la query, millorat el guard.
- NO tocat: la visual del cockpit (terreny del propietari).
- Pendent del propietari: validació visual → `TANCAT CHARLIE`.

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
- Lectura inicial: `prisma.booking.findUnique()` al `page.tsx` amb `pack`, `extras`, `serviceLines`, `inventory`, `lead`, `proposals`, `invoices`, post-event, enquesta i feedback.
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
- Canvi #1140: `/admin/clientes/referrals` deixa d'emetre KPIs, top referrers, filtres, candidats, missatge suggerit i accions amb classes visuals genèriques; `ReferralsClient` passa a `rf__*` i `referrals.css` escopat a `html.admin-mode`.
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
- El P1 visual/canònic de `TimelinePanel` queda resolt al Canvi #1116, `InsightsBanner` queda drenat al #1117, `BookingsPanel` al #1118, `PrivacyPanel` al #1119, `DiscountsPanel` al #1120, els residus `white/*` de `SummaryPanel` al #1121, `LeadsPanel` al #1126, `ProposalsPanel` al #1128, `MarginExtrasPanel` al #1130, `TasksNotesPanel` al #1131, `CommsPanel` al #1134, els inline styles de `CustomerHeader` al #1136, `ReactivationClient` al #1139, `ReferralsClient` al #1140 i overlays de `ClientesModals` al #1141; el risc restant de Client 360 ja no és un panell dinàmic principal, sinó llista i validació visual final del propietari.

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
APIs/serveis vius: packAdminService, packPricingCheckService, packPricingHealth, inventoryAdminService, inventoryBundles, bookingInventoryService, extrasConfiguratorService, catalogPdfService. Tots consumits.
Codi mort relacionat: cap.
Duplicacions: cap (qa:no-canonical-reimpl verd; les fórmules de preu/marge viuen a costEngine/pricing-intelligence, no es reimplementen a la UI).
Hardcoded/residu visual: dins canon. Excepció LEGÍTIMA documentada: `MARGIN_TONES`/`PRICE` a `lib/constants/pricing-intelligence.ts` és un HEATMAP de 8 nivells de salut de marge (verd→vermell, `tone.hex`) aplicat via `style={{background/borderLeftColor: tone.hex}}` a `pricing/page`. És una visualització de domini centralitzada (monocapa), com els editors PDF — NO un residu a tokenitzar (8 stops graduals no caben a 3 admin-tone). `style={{width}}` de les barres de vida = runtime %. `text-white/X` = sistema sobre fons fosc.
Connexions interrompudes: cap. Packs↔pricing↔inventory↔cost-calculator coherents; packs enllaça a booking/extras.

Canvi de codi (#1132): netejat un ternari redundant a `InventoryListSections.tsx` (barres de vida, línies 416 i 532): `>40 success : >20 warning : >5 warning : danger` → `>40 success : >5 warning : danger` (la branca `>5 warning` era idèntica a `>20 warning` = morta; comportament idèntic: success>40, warning 5-40, danger<5).

Validacio: tsc EXIT 0 · validate:core EXIT 0 (qa:admin-canon 0) · render packs/pricing/inventory ja verificat (#1122-1124).

Decisio de treball: organ SA, ben cablejat i ja canònic (AdminPage). Fet el micro-fix del ternari mort; el heatmap de marge es conserva com a exempció de domini. Pendent validacio visual del propietari.

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

### Òrgan Post-event (`/admin/post-event`, reports, surveys, feedback, playbook)

Pantalla: Post-event — tancament de bolo i aprenentatge (informes, enquestes, feedback, playbook).
Estat inventari: 🟢
TANCAT CHARLIE: no — pendent validacio visual del propietari.
Estat fitxa: FETA (auditoria forense #1162, claude, 2026-06-25)

Reachability: les 5 rutes (post-event, reports, reports/new, surveys, feedback, playbook) són pages amb AdminPage + loading. Passa qa:no-dead-admin-views.
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

## Registre de fitxes per fer

| Ruta | Page | Estat fitxa | Propietari | Nota |
|---|---|---:|---|---|
| `/admin` | `app/admin/page.tsx` | PENDENT | codex/claude | Dashboard / Control Room |
| `/admin/activity` | `app/admin/activity/page.tsx` | PENDENT | codex/claude | Log d'activitat |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | PENDENT | codex/claude | Analytics |
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
| `/admin/catalog` | `app/admin/catalog/page.tsx` | PENDENT | codex/claude | Catàleg |
| `/admin/clientes` | `app/admin/clientes/page.tsx` | PENDENT | codex/claude | Clients llista |
| `/admin/clientes/[id]` | `app/admin/clientes/[id]/page.tsx` | FETA | codex | Client 360 — fitxa forense #1114; Timeline #1116; Insights #1117; Bookings #1118; Privacy #1119; Discounts #1120; Summary #1121 |
| `/admin/clientes/reactivation` | `app/admin/clientes/reactivation/page.tsx` | FETA | codex | Reactivació — fitxa forense #1210; visual `ReactivationClient` drenat #1139 |
| `/admin/clientes/referrals` | `app/admin/clientes/referrals/page.tsx` | PENDENT | codex/claude | Referrals — visual `ReferralsClient` drenat #1140 |
| `/admin/collaborators` | `app/admin/collaborators/page.tsx` | PENDENT | codex/claude | Partners |
| `/admin/collaborators/[id]` | `app/admin/collaborators/[id]/page.tsx` | PENDENT | codex/claude | Partner detail |
| `/admin/cost-calculator` | `app/admin/cost-calculator/page.tsx` | PENDENT | codex/claude | Calculadora costos |
| `/admin/coverage` | `app/admin/coverage/page.tsx` | PENDENT | codex/claude | Coverage |
| `/admin/crons` | `app/admin/crons/page.tsx` | PENDENT | codex/claude | Crons |
| `/admin/css-manager` | `app/admin/css-manager/page.tsx` | PENDENT | codex/claude | CSS Manager |
| `/admin/cuadrant` | `app/admin/cuadrant/page.tsx` | FETA | claude | Quadrant — fitxa forense #1115 |
| `/admin/cuadrant/repartiment` | `app/admin/cuadrant/repartiment/page.tsx` | FETA | claude | Repartiment — fitxa forense #1115 |
| `/admin/discount-codes` | `app/admin/discount-codes/page.tsx` | PENDENT | codex/claude | Codis descompte |
| `/admin/docs/esquema` | `app/admin/docs/esquema/page.tsx` | PENDENT | codex/claude | Docs esquema |
| `/admin/docs/full-de-ruta` | `app/admin/docs/full-de-ruta/page.tsx` | PENDENT | codex/claude | Full de ruta |
| `/admin/docs/organisme` | `app/admin/docs/organisme/page.tsx` | PENDENT | codex/claude | Organisme |
| `/admin/docs/protocol` | `app/admin/docs/protocol/page.tsx` | PENDENT | codex/claude | Protocol |
| `/admin/docs/visual-audit` | `app/admin/docs/visual-audit/page.tsx` | FETA | codex | Auditoria visual — fitxa forense compacta #1417 |
| `/admin/dossiers` | `app/admin/dossiers/page.tsx` | FETA | codex | Dossiers — òrgan Documents #1155; camí canònic de creació unificat #1748-#1749 |
| `/admin/economia` | `app/admin/economia/page.tsx` | PENDENT | codex/claude | Economia |
| `/admin/email-templates` | `app/admin/email-templates/page.tsx` | PENDENT | codex/claude | Plantilles email |
| `/admin/email-templates/[slug]` | `app/admin/email-templates/[slug]/page.tsx` | PENDENT | codex/claude | Editor plantilla |
| `/admin/emails` | `app/admin/emails/page.tsx` | PENDENT | codex/claude | Emails |
| `/admin/faq` | `app/admin/faq/page.tsx` | PENDENT | codex/claude | FAQ |
| `/admin/faq/[id]` | `app/admin/faq/[id]/page.tsx` | PENDENT | codex/claude | FAQ detall |
| `/admin/faq/new` | `app/admin/faq/new/page.tsx` | PENDENT | codex/claude | Nova FAQ |
| `/admin/features` | `app/admin/features/page.tsx` | PENDENT | codex/claude | Features |
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
| `/admin/leads/[id]` | `app/admin/leads/[id]/page.tsx` | PENDENT | codex/claude | Lead detall |
| `/admin/leads/arxiu` | `app/admin/leads/arxiu/page.tsx` | PENDENT | codex/claude | Arxiu leads |
| `/admin/leads/reengagement` | `app/admin/leads/reengagement/page.tsx` | PENDENT | codex/claude | Reengagement |
| `/admin/manual` | `app/admin/manual/page.tsx` | PENDENT | codex/claude | Manual |
| `/admin/marketing` | `app/admin/marketing/page.tsx` | FETA | codex | Marketing — fitxa forense #1207 |
| `/admin/mensajes` | `app/admin/mensajes/page.tsx` | PENDENT | codex/claude | Missatges |
| `/admin/packs` | `app/admin/packs/page.tsx` | PENDENT | codex/claude | Packs |
| `/admin/packs/[id]` | `app/admin/packs/[id]/page.tsx` | PENDENT | codex/claude | Pack detall |
| `/admin/packs/extras` | `app/admin/packs/extras/page.tsx` | PENDENT | codex/claude | Extres |
| `/admin/packs/new` | `app/admin/packs/new/page.tsx` | PENDENT | codex/claude | Nou pack |
| `/admin/portfolio` | `app/admin/portfolio/page.tsx` | PENDENT | codex/claude | Portfolio |
| `/admin/post-event` | `app/admin/post-event/page.tsx` | PENDENT | codex/claude | Post-event |
| `/admin/post-event/feedback` | `app/admin/post-event/feedback/page.tsx` | PENDENT | codex/claude | Feedback |
| `/admin/post-event/playbook` | `app/admin/post-event/playbook/page.tsx` | PENDENT | codex/claude | Playbook |
| `/admin/post-event/reports` | `app/admin/post-event/reports/page.tsx` | PENDENT | codex/claude | Reports |
| `/admin/post-event/reports/new` | `app/admin/post-event/reports/new/page.tsx` | PENDENT | codex/claude | Nou report |
| `/admin/post-event/surveys` | `app/admin/post-event/surveys/page.tsx` | PENDENT | codex/claude | Enquestes |
| `/admin/presupuestos` | `app/admin/presupuestos/page.tsx` | INICIAL | codex | Fitxa inicial; auditoria línia per línia pendent |
| `/admin/presupuestos/[id]` | `app/admin/presupuestos/[id]/page.tsx` | FETA | codex | Pressupost detall / PDF Studio — fitxa forense #1029 |
| `/admin/pricing` | `app/admin/pricing/page.tsx` | PENDENT | codex/claude | Pricing |
| `/admin/privacy` | `app/admin/privacy/page.tsx` | PENDENT | codex/claude | Privacitat |
| `/admin/questionnaires` | `app/admin/questionnaires/page.tsx` | PENDENT | codex/claude | Qüestionaris |
| `/admin/questionnaires/[id]` | `app/admin/questionnaires/[id]/page.tsx` | PENDENT | codex/claude | Qüestionari detall |
| `/admin/questionnaires/new` | `app/admin/questionnaires/new/page.tsx` | PENDENT | codex/claude | Nou qüestionari |
| `/admin/quick-create` | `app/admin/quick-create/page.tsx` | PENDENT | codex/claude | Quick create |
| `/admin/reporting` | `app/admin/reporting/page.tsx` | PENDENT | codex/claude | Reporting |
| `/admin/ressenyes` | `app/admin/ressenyes/page.tsx` | PENDENT | codex/claude | Ressenyes |
| `/admin/sales-ops` | `app/admin/sales-ops/page.tsx` | PENDENT | codex/claude | Sales Ops |
| `/admin/salut` | `app/admin/salut/page.tsx` | PENDENT | codex/claude | Salut |
| `/admin/scripts` | `app/admin/scripts/page.tsx` | PENDENT | codex/claude | Scripts |
| `/admin/settings` | `app/admin/settings/page.tsx` | PENDENT | codex/claude | Settings |
| `/admin/settings/company` | `app/admin/settings/company/page.tsx` | PENDENT | codex/claude | Empresa |
| `/admin/settings/hero` | `app/admin/settings/hero/page.tsx` | PENDENT | codex/claude | Hero |
| `/admin/settings/integrations` | `app/admin/settings/integrations/page.tsx` | PENDENT | codex/claude | Integracions |
| `/admin/settings/notifications` | `app/admin/settings/notifications/page.tsx` | PENDENT | codex/claude | Notificacions |
| `/admin/settings/quotes` | `app/admin/settings/quotes/page.tsx` | PENDENT | codex/claude | Pressupostos config |
| `/admin/social` | `app/admin/social/page.tsx` | FETA | codex | Social — fitxa forense #1209 |
| `/admin/stats` | `app/admin/stats/page.tsx` | PENDENT | codex/claude | Stats |
| `/admin/studio` | `app/admin/studio/page.tsx` | PENDENT | codex/claude | Studio |
| `/admin/tasks` | `app/admin/tasks/page.tsx` | PENDENT | codex/claude | Tasques |
| `/admin/tasks/new` | `app/admin/tasks/new/page.tsx` | PENDENT | codex/claude | Nova tasca |
| `/admin/text-manager` | `app/admin/text-manager/page.tsx` | PENDENT | codex/claude | Text manager |
