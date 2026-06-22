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
| Comandament | `/admin`, `/admin/salut`, `/admin/reporting`, `/admin/analytics` | PENDENT |
| Comercial | `/admin/leads`, `/admin/leads/[id]`, `/admin/sales-ops`, `/admin/leads/arxiu`, `/admin/leads/reengagement` | INICIAL parcial |
| Documents | `/admin/presupuestos`, `/admin/presupuestos/[id]`, `/admin/dossiers`, `/admin/studio` | INICIAL parcial |
| Comunicacions | `/admin/inbox`, `/admin/inbox/compose`, `/admin/inbox/settings`, `/admin/emails`, `/admin/email-templates` | PENDENT |
| Reserves | `/admin/bookings`, `/admin/bookings/[id]`, `/admin/bookings/new`, `/admin/calendario`, `/admin/calendario/capacity` | PENDENT |
| Clients | `/admin/clientes`, `/admin/clientes/[id]`, `/admin/clientes/reactivation`, `/admin/clientes/referrals` | PENDENT |
| Catàleg | `/admin/packs`, `/admin/packs/[id]`, `/admin/packs/extras`, `/admin/inventory`, `/admin/pricing`, `/admin/catalog` | PENDENT |
| Partners | `/admin/collaborators`, `/admin/collaborators/[id]` | PENDENT |
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

## Registre de fitxes per fer

| Ruta | Page | Estat fitxa | Propietari | Nota |
|---|---|---:|---|---|
| `/admin` | `app/admin/page.tsx` | PENDENT | codex/claude | Dashboard / Control Room |
| `/admin/activity` | `app/admin/activity/page.tsx` | PENDENT | codex/claude | Log d'activitat |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | PENDENT | codex/claude | Analytics |
| `/admin/blog` | `app/admin/blog/page.tsx` | PENDENT | codex/claude | Blog llista |
| `/admin/blog/edit/[id]` | `app/admin/blog/edit/[id]/page.tsx` | PENDENT | codex/claude | Blog edició |
| `/admin/blog/new` | `app/admin/blog/new/page.tsx` | PENDENT | codex/claude | Nou blog |
| `/admin/bookings` | `app/admin/bookings/page.tsx` | PENDENT | codex/claude | Reserves llista |
| `/admin/bookings/[id]` | `app/admin/bookings/[id]/page.tsx` | PENDENT | codex/claude | Reserva detall |
| `/admin/bookings/new` | `app/admin/bookings/new/page.tsx` | PENDENT | codex/claude | Nova reserva |
| `/admin/calendario` | `app/admin/calendario/page.tsx` | PENDENT | codex/claude | Calendari legacy/compatibilitat |
| `/admin/calendario/capacity` | `app/admin/calendario/capacity/page.tsx` | PENDENT | codex/claude | Capacitat |
| `/admin/campaigns` | `app/admin/campaigns/page.tsx` | PENDENT | codex/claude | Campanyes |
| `/admin/canvas` | `app/admin/canvas/page.tsx` | PENDENT | codex/claude | Canvas |
| `/admin/catalog` | `app/admin/catalog/page.tsx` | PENDENT | codex/claude | Catàleg |
| `/admin/clientes` | `app/admin/clientes/page.tsx` | PENDENT | codex/claude | Clients llista |
| `/admin/clientes/[id]` | `app/admin/clientes/[id]/page.tsx` | PENDENT | codex/claude | Client 360 |
| `/admin/clientes/reactivation` | `app/admin/clientes/reactivation/page.tsx` | PENDENT | codex/claude | Reactivació |
| `/admin/clientes/referrals` | `app/admin/clientes/referrals/page.tsx` | PENDENT | codex/claude | Referrals |
| `/admin/collaborators` | `app/admin/collaborators/page.tsx` | PENDENT | codex/claude | Partners |
| `/admin/collaborators/[id]` | `app/admin/collaborators/[id]/page.tsx` | PENDENT | codex/claude | Partner detail |
| `/admin/cost-calculator` | `app/admin/cost-calculator/page.tsx` | PENDENT | codex/claude | Calculadora costos |
| `/admin/coverage` | `app/admin/coverage/page.tsx` | PENDENT | codex/claude | Coverage |
| `/admin/crons` | `app/admin/crons/page.tsx` | PENDENT | codex/claude | Crons |
| `/admin/css-manager` | `app/admin/css-manager/page.tsx` | PENDENT | codex/claude | CSS Manager |
| `/admin/cuadrant` | `app/admin/cuadrant/page.tsx` | PENDENT | codex/claude | Quadrant |
| `/admin/cuadrant/repartiment` | `app/admin/cuadrant/repartiment/page.tsx` | PENDENT | codex/claude | Repartiment |
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
