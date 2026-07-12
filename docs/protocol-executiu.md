# Protocol executiu — Òrbita Events

> Entrada curta per treballar sense perdre's. La llei completa continua a `CLAUDE.md` i `docs/admin-protocol.md`.

## 1. Contracte de responsabilitat

- El propietari valida la **visual final**, el criteri de negoci visible i el `TANCAT CHARLIE`.
- Els agents assumeixen la **cohesió tècnica**: component viu, CSS viu, serveis/APIs vius, codi mort, duplicacions, hardcoded, cablejat i poda.
- El propietari no ha de descobrir si una pantalla està partida en illes. Això ho han de detectar Claude/Codex abans de tocar-la.

## 2. Regles que no es poden saltar

1. Llegir l'arrencada obligatòria: `CLAUDE.md` → `docs/agent-sync.md` → `docs/admin-diary.md` → `docs/estat-admin.md` → `docs/admin-protocol.md` quan toca admin.
2. No tocar codi funcional d'una pantalla admin sense fitxa `FETA` a `docs/admin-fitxes-pantalles.md`, excepte si el tall és fer la fitxa.
3. Una fitxa `FETA` exigeix auditoria forense: història, reachability, lectura línia per línia, CSS contra DOM, UI→API/servei→dades, òrgans veïns, duplicacions i residu. El guard `qa:no-dead-admin-views` fa **reachability real** des dels punts d'entrada de Next (caça també illes transitives, #1028), però NO substitueix l'auditoria forense: cobreix accessibilitat, no CSS↔DOM, duplicacions semàntiques, hardcoded ni cablejat de dades punta a punta.
4. Monocapa: una decisió estable viu a un sol lloc.
5. Zero hardcoded: colors a tokens, textos/labels/constants a capa comuna, dades a serveis/constants.
6. `TANCAT CHARLIE` només el marca el propietari; després queda zona protegida.
7. Cap canvi compta si no es reflecteix a la superfície real renderitzada.
8. Cada canvi amb número porta protocol, diari, counter, agent-sync i validació.
9. En worktree brut, no es reverteix ni es neteja feina aliena.
10. Si una peça viu com 2, 3 o 4 illes, primer es documenta i després es fusiona/poda/reconnecta. Si una peça passa el guard però només està importada per una altra illa morta, la fitxa encara ho ha de detectar.
11. Si el propietari invoca `Manolo`, l'agent fa una mirada d'Expert/a en Experiència Comercial Digital abans de tocar codi: UX/UI, CRO, marca, service design, negoci d'esdeveniments, revenue, arquitectura d'informació, copy comercial, direcció visual i growth. Un cop activat en un front o sessió, Manolo continua governant tota la passada fins que el propietari l'aturi o canviï explícitament de criteri.
12. Podem entrar per tot arreu, però tot ha d'heretar context: qualsevol peça comercial ha de declarar quin `customerId`, `leadId`, `bookingId` o `proposalId` la governa, quin workspace canònic obre i quina dada passa de provisional a veritat final.

## 3. Com es treballa un programa gran

No es treballa ruta per ruta plana. Es treballa per **òrgans**:

| Òrgan | Rutes principals | Responsabilitat de cohesió |
|---|---|---|
| Comandament | `/admin`, `/admin/salut`, `/admin/reporting` | Una lectura de negoci, no tres dashboards competint. |
| Comercial | `/admin/leads`, `/admin/leads/[id]`, `/admin/sales-ops` | Pipeline, score, seguiment i conversió amb una sola veritat. |
| Documents | `/admin/presupuestos`, `/admin/dossiers`, Studio PDF | Pressupost/dossier/PDF com un flux, no editors separats. |
| Comunicacions | `/admin/inbox`, `/admin/inbox/compose`, `/admin/emails`, plantilles | Safata, email, plantilles i timeline connectats. |
| Reserves | `/admin/bookings`, `/admin/bookings/[id]`, `/admin/bookings/new`, calendari | Contracte, execució, calendari i pagaments alineats. |
| Clients | `/admin/clientes`, `/admin/clientes/[id]`, reactivació/referrals | Client 360 i recurrència sense duplicar història. |
| Catàleg | `/admin/packs`, extres, inventari, pricing, catalog | Producte, cost, preu i inventari amb fonts comunes. |
| Partners | `/admin/collaborators`, `/admin/collaborators/[id]` | Partner com a base única de relació externa. |
| Post-event | `/admin/post-event`, reports, surveys, feedback | Tancament de bolo i aprenentatge connectats al client. |
| Sistema | settings, crons, scripts, features, coverage, studio | Infra, configuració i sistema visual protegits. |

Cada òrgan té una fitxa mare i subfitxes només quan una subpantalla té flux propi.

## 4. Ordre d'una intervenció

1. Triar òrgan, no una ruta aïllada.
2. Fer o completar fitxa mare.
3. Identificar subpantalles que necessiten fitxa pròpia.
4. Detectar la font viva i les illes mortes.
5. Decidir: conservar, fusionar, podar, reconnectar o protegir.
6. Implementar el mínim canvi coherent.
7. Validar en tres capes: tècnica, funcional i humana/UX.
8. Documentar i deixar el següent pas clar.

## 4.1 Convocar Manolo

`Manolo` és la mirada experta transversal sobre una peça del repo. S'activa amb frases com `Manolo`, `convoca Manolo`, `passa-li Manolo` o `mirada Manolo`.

Quan s'activa en un front o sessió, no és una resposta única: continua sent el criteri de treball de tota la passada fins que el propietari digui prou o canviï explícitament de criteri.

Quan s'activa, l'agent no comença pel codi. Primer ha de respondre com a expert en experiència comercial digital:
- què fa avui la peça;
- si ven, genera confiança i fa desitjar;
- si redueix risc i justifica valor percebut;
- si la decisió és clara i la fricció mínima;
- si el visual/copy/marca semblen premium però humans;
- si allò que promet és operable després;
- si protegeix marge, ticket, recurrència i post-venda.

Manolo parla fred, tallant i àcid. No fa diplomàcia amb una peça mediocre, genèrica, confusa, poc premium o que no ven. La duresa va contra la peça i la decisió, no contra la persona. Ha de ser incòmode si cal, però sempre accionable.

La sortida mínima és: **veredicte Manolo**, **problema real**, **què faria**, **tall recomanat** i **risc de no fer-ho**. Si després es toca codi, torna a aplicar el protocol complet: fitxa, monocapa, zero hardcoded, validació, diari, §9 i counter.

Límit vinculant: Manolo no autoritza schema, Manolo no autoritza migracions i Manolo no autoritza endpoints/API/BD. Qualsevol canvi Manolo que necessiti schema, migració, endpoint, base de dades o deploy requereix autorització explícita del propietari escrita al Canvi #N abans de tocar el perímetre.

## 4.2 Herència de context

La cadena canònica és `Customer → Lead → Dossier/Proposal/Quote → Booking → Invoice/Contract/Documents → Post-event/Review/Referral`.

Cada punt d'entrada lateral ha de poder tornar enrere si la dada existeix. Una reserva directa ha de trobar el client; una proposta antiga ha de tornar pel lead; un dossier ha de saber quin lead l'alimenta; una factura ha de saber quin client o booking governa. Si una peça no pot reconstruir aquesta cadena, és una peça cega.

Abans de tocar PDFs, emails, reserves, propostes, tasques o hubs, l'agent ha de respondre: d'on hereta, què escriu, què queda com a foto immutable i quin workspace canònic obre.

## 5. Definició de fet

Una peça només està feta quan:

- renderitza a la ruta real;
- no duplica una font de veritat existent;
- no conserva codi mort rellevant sense decisió;
- usa tokens/constants/serveis canònics;
- connecta amb els òrgans veïns;
- és responsiva;
- passa la validació proporcional al risc;
- el propietari pot validar la visual sense haver d'entendre el cablejat.

## 6. Abast de repo

Aquest protocol cobreix tot el repo a nivell de principis: monocapa, hardcoded, validació, documentació, agents i codi mort.

El sistema de fitxes forenses és obligatori per `app/admin/**`. Per web pública, PDFs, emails, scripts i serveis s'aplica el mateix criteri de monocapa i cablejat, però amb fitxa només quan el canvi sigui visual, transversal o d'alt risc.
