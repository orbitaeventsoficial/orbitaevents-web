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
| Post-event | `/admin/post-event`, reports, surveys, feedback, playbook | PENDENT |
| Sistema | settings, crons, scripts, features, coverage, docs, canvas, text/css/image managers | PENDENT |

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
- Canvi #1154: `BookingFilters` deixa l'amplada inline `style={{ width: 260 }}` del camp de cerca i passa a `bk-filter-search`.
- Canvi #1148: `BookingTotalEditor` i la cabina de marge (`BookingMarginCard`) deixen els inline styles i valors tipogràfics P2; passen a `bd-total-editor*` i `admin-booking-margin-*` dins aquest CSS.
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
CSS viu: control-room.css (dashboard) + classes canòniques `.ap-*`. Títols ja canon (.ap-h2/.ap-title del #1146).
APIs/serveis vius: adminOperatingCycleService, attributionService, capacityConflictService, captureHealthService, dailyAnomalyService, dailyBriefService, dashboardInsightsService, operationalForecastService, operationalPulseService. Tots consumits pel dashboard.
Codi mort relacionat: cap.
Duplicacions: cap (el forecast unificat viu a economicCockpitService #1089; el dashboard consumeix serveis, no els reimplementa).
Hardcoded/residu visual: dins canon. Títols migrats a .ap-h2/.ap-title (#1146); KPIs amb gramàtica canònica.
Connexions interrompudes: cap. Dashboard enllaça a tots els organs (leads, bookings, tasks, economia...).

Canvi de codi (#1156): cap. Auditoria neta — organ SA. Els títols ja es van canonitzar al #1146 (salut/analytics → .ap-h2).

Validacio: tsc EXIT 0 · validate:core EXIT 0 (qa:admin-canon 0) · render /admin + salut/reporting/analytics cobert per qa:smoke.

Decisio de treball: organ SA, cap canvi de codi nou. Pendent validacio visual del propietari.

## Registre de fitxes per fer

| Ruta | Page | Estat fitxa | Propietari | Nota |
|---|---|---:|---|---|
| `/admin` | `app/admin/page.tsx` | PENDENT | codex/claude | Dashboard / Control Room |
| `/admin/activity` | `app/admin/activity/page.tsx` | PENDENT | codex/claude | Log d'activitat |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | PENDENT | codex/claude | Analytics |
| `/admin/blog` | `app/admin/blog/page.tsx` | PENDENT | codex/claude | Blog llista |
| `/admin/blog/edit/[id]` | `app/admin/blog/edit/[id]/page.tsx` | PENDENT | codex/claude | Blog edició |
| `/admin/blog/new` | `app/admin/blog/new/page.tsx` | PENDENT | codex/claude | Nou blog |
| `/admin/bookings` | `app/admin/bookings/page.tsx` | PENDENT | codex/claude | Reserves llista — contenidors/glass P2 drenats #1142; pipeline dots/botons P2 drenats #1149 |
| `/admin/bookings/[id]` | `app/admin/bookings/[id]/page.tsx` | FETA | codex | Reserva detall — fitxa forense #1112 |
| `/admin/bookings/new` | `app/admin/bookings/new/page.tsx` | PENDENT | codex/claude | Nova reserva |
| `/admin/calendario` | `app/admin/calendario/page.tsx` | PENDENT | codex/claude | Calendari legacy/compatibilitat |
| `/admin/calendario/capacity` | `app/admin/calendario/capacity/page.tsx` | PENDENT | codex/claude | Capacitat |
| `/admin/campaigns` | `app/admin/campaigns/page.tsx` | PENDENT | codex/claude | Campanyes |
| `/admin/canvas` | `app/admin/canvas/page.tsx` | PENDENT | codex/claude | Canvas |
| `/admin/catalog` | `app/admin/catalog/page.tsx` | PENDENT | codex/claude | Catàleg |
| `/admin/clientes` | `app/admin/clientes/page.tsx` | PENDENT | codex/claude | Clients llista |
| `/admin/clientes/[id]` | `app/admin/clientes/[id]/page.tsx` | FETA | codex | Client 360 — fitxa forense #1114; Timeline #1116; Insights #1117; Bookings #1118; Privacy #1119; Discounts #1120; Summary #1121 |
| `/admin/clientes/reactivation` | `app/admin/clientes/reactivation/page.tsx` | PENDENT | codex/claude | Reactivació — visual `ReactivationClient` drenat #1139 |
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
| `/admin/dossiers` | `app/admin/dossiers/page.tsx` | PENDENT | codex/claude | Dossiers |
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
| `/admin/marketing` | `app/admin/marketing/page.tsx` | PENDENT | codex/claude | Marketing |
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
| `/admin/social` | `app/admin/social/page.tsx` | PENDENT | codex/claude | Social |
| `/admin/stats` | `app/admin/stats/page.tsx` | PENDENT | codex/claude | Stats |
| `/admin/studio` | `app/admin/studio/page.tsx` | PENDENT | codex/claude | Studio |
| `/admin/tasks` | `app/admin/tasks/page.tsx` | PENDENT | codex/claude | Tasques |
| `/admin/tasks/new` | `app/admin/tasks/new/page.tsx` | PENDENT | codex/claude | Nova tasca |
| `/admin/text-manager` | `app/admin/text-manager/page.tsx` | PENDENT | codex/claude | Text manager |
