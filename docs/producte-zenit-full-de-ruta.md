# Òrbita Events — Meta de producte (zenit) + Full de ruta

> **Document mestre de producte.** Si `docs/admin-organisme-atles.md` és la radiografia (**on som**), aquest diu **on volem arribar** (la META) i **com hi arribem** (el FULL DE RUTA). Fusió de la visió d'expert de sector (event-management SaaS) amb el procés de l'embut del protocol.
>
> Estat: **v1.1 (claude, 2026-06-15)**, per validar el propietari. La META és visió de negoci del propietari; aquí es proposa una idealització fonamentada **segons el que ja es disposa** — realisme dur, res de promeses impossibles. Mirada de referents del sector (HoneyBook, Dubsado, Aisle Planner, Planning Pod, 17hats) aplicada als ingredients reals del repo.

---

## 0. RESTRICCIÓ DE REALITAT DE NEGOCI (propietari 2026-06-15) — llegir abans de tot

**Òrbita encara NO té estructura legal/fiscal/bancària formal:** sense alta d'autònom, sense estructura d'empresa, **sense mitjans bancaris ni passarel·la de pagament**. Avui el sistema és una **eina interna de gestió i conversió**, NO una plataforma transaccional.

Conseqüència directa sobre el full de ruta (re-prioritza tot el document):
- **APARCAT fins que hi hagi estructura legal/bancària:** cobrament/pagament al portal (passarel·la Stripe/Redsys), facturació amb IVA automàtica, qualsevol moviment de diners real dins el sistema. NO es construeix ara; quedaria mort o, pitjor, donaria una falsa sensació de legalitat.
- **El «cobrament» es gestiona MANUALMENT:** el semàfor que ja existeix (`depositPaid`/`remainingPaid`) es marca a mà; els recordatoris poden ser avisos interns, no cobraments automàtics.
- **SÍ aporten valor ara (no depenen de banc/empresa) — aquí va l'esforç:** captació SEO, proposta/dossier, **automatització de SEGUIMENT** (no de cobrament), pipeline visual ponderat, execució (capacitat/cuadrant/equip), CRM i recurrència, reviews. És la majoria de la visió.

> Quan Òrbita es formalitzi (autònom + banc), s'activa el bloc transaccional (Fase 1A pagament + facturació). Fins llavors, el producte és excel·lent **com a eina de gestió i conversió**, i s'optimitza per a això.

---

## 1. Diagnòstic d'expert (sense complaença)

Òrbita Events és, de facto, un **vertical SaaS d'event-management fet a mida per a un sol operador**, i això és alhora la seva força i el seu sostre. Ja té peces que els generalistes (HoneyBook, Dubsado) **no tenen** i serien impossibles en un producte horitzontal: un **motor de cost/marge real per bolo** (`computeBookingFinancialSummary` amb cost de combustible per km, col·laboradors i trams de desplaçament), **captació SEO de municipi nativa**, **safata IMAP/SMTP real amb la conversa lligada a l'entitat** per headers MIME, i un **sistema visual canònic propi** (`/admin/studio`). Cap competidor de prestatgeria et dóna el marge net real d'un esdeveniment amb el dièsel inclòs. Aquesta és la joia.

Però — sense complaença — **avui el producte no és un organisme, és un arxipèlag d'illes excel·lents**: 90 pàgines admin, 221 serveis i 8 duplicacions de capacitat (D1–D8). El que als referents del sector és **una sola autopista comercial sense costures** (lead → proposta amb signatura i pagament al portal → reserva → cobrament automàtic → recurrència), aquí encara és un flux que l'operador empeny a mà de pàgina en pàgina. Falten les peces que defineixen el primer nivell: **propostes amb signatura + pagament al portal**, **automatització de seguiments**, **forecasting d'ingressos i capacitat**, i un **pipeline visual amb valor ponderat**. El potencial és altíssim precisament perquè el difícil (motor econòmic, canal de correu real, SEO, visual) ja està fet: el que falta és **connectar i automatitzar, no construir de nou**. Avui ~6,5/10 amb sostre 9,5 assolible amb els ingredients actuals.

---

## 2. LA META — el producte final idealitzat

### 2.1 Principi rector (alineat amb §0 i §0.1 del protocol)
El zenit **no s'assoleix afegint 40 mòduls**. S'assoleix portant el bitxo que ja existeix al seu **màxim exponent** fins que sigui **un sol organisme** (norma «Sèrie Òrbita Events», 7 eixos), tancant les tres costures que el separen del primer nivell: **proposta-a-cobrament al portal**, **automatització de seguiment**, i **una sola veritat per domini**. Tot el que es construeixi ha d'impactar un dels 4 eixos: **conversió · execució · cobrament · recurrència**.

### 2.2 Un dia normal al zenit (el test de la META)
> Si operar el producte un dia qualsevol se sent així, hem arribat.

- **08:30 — El radar.** El Dashboard no són 90 pàgines: és **una pantalla de comandament** que respon *què he de fer ara, què entra de diners, on hi ha risc*. Els leads de la nit (landings SEO de municipi) ja són al pipeline amb **valor ponderat**. Forecast: «aquest mes 4.200€ tancats + 3.100€ ponderats». Avís: «la Núria (boda 12/07) no ha obert la proposta en 4 dies → seguiment automàtic enviat ahir».
- **09:00 — Conversió sense fricció.** Lead de `dj-fiestas-cardedeu`. El configurador ja ha **preseleccionat pack i extres** del text del formulari (`leadTextExtractionService`). S'ajusten hores de DJ, el motor recalcula marge en viu. Un clic: **«Enviar proposta»**. El client rep el dossier al portal amb **«Acceptar i reservar»** que **signa i cobra la paga i senyal** en la mateixa pantalla.
- **11:00 — Execució automàtica.** El client ha acceptat de matinada. El sistema **sol**: converteix el lead en reserva, bloqueja data al calendari i cuadrant, assigna Carlos (Masquerade) si hi ha animació infantil, envia el qüestionari pre-event, programa el recordatori del 50% restant. L'operador **revisa**, no tecleja.
- **13:00 — Capacitat.** El dissabte 19/07 té 3 bolos i 2 equips de so → avís vermell. Decisió informada (llogar Tino o derivar), no sorpresa el divendres.
- **17:00 — Cobrament i recurrència.** Safata amb converses lligades a cada reserva (IMAP). Factura que venç → recordatori automàtic. Clients dormants: la Maria (festa fa 11 mesos) → campanya d'aniversari suggerida. Post-event amb 5★ → **petició de ressenya de Google automàtica**.

Tot això **ja té els ingredients al repo**. Falta el cablejat i l'automatització.

### 2.3 Què el faria excel·lent al sector
1. **Marge real, no facturació.** Els competidors diuen quant has facturat; Òrbita diu **quant has guanyat** per bolo (dièsel, col·laborador, desplaçament dins). Ja existeix (`costEngine`). Al zenit, **forecasteja**.
2. **Captació SEO → conversió com un sol motor.** Cap generalista neix amb landings de municipi; cada landing alimenta el pipeline amb atribució real.
3. **Canal de correu real, no mirall.** IMAP/SMTP amb conversa lligada a l'entitat; la safata **és** el centre de comunicació (D1 resolt).
4. **Operació de camp integrada.** Cuadrant + repartiment + col·laboradors: qui treballa, qui cobra, quanta capacitat queda.

### 2.4 Capacitats que un expert troba a faltar (cru o absent)
| Capacitat | Avui | Al zenit | Eix |
|---|---|---|---|
| **Proposta → signatura → pagament al portal** | rutes `portal/[token]/{sign,contract,payments,invoice}` existeixen soltes | **un sol flux**: acceptar+signar+pagar paga i senyal → el lead es converteix en reserva sol | conversió + cobrament |
| **Automatització de seguiments** | `sales-ops` + `emails` existeixen, desconnectats del lead viu | regles: «proposta no oberta en X dies → recordatori»; tanca vendes sol | conversió + cobrament |
| **Pipeline visual amb valor ponderat** | kanban per estat | **€ ponderat per columna** (valor × probabilitat); el pipeline ÉS el forecast | conversió |
| **Forecasting d'ingressos i marge** | `reporting`/`economia` miren enrere | projecció endavant per mes | cobrament |
| **Gestió de capacitat/equip** | `calendario/capacity` + `cuadrant` | avís proactiu de sobrecàrrega abans del conflicte | execució |
| **Recurrència proactiva** | `reactivation`/`reengagement`/`campaigns` (D6 fragmentat) | motor de segments que dispara campanyes sol | recurrència |

Cap requereix tecnologia nova: són **cablejat + automatització sobre serveis que ja hi són**.

---

## 3. FULL DE RUTA per fases (ordenat per impacte: conversió → execució → cobrament → recurrència)

Cada peça passa **l'embut** (protocol §0.1.1: desglossar → estudiar el possible → dinamització → recompondre → 7 eixos → canonitzar a Studio → verificar cablejat).

### Fase 0 — Sanejament i veritat (prerequisit) · cost baix, valor estructural
- **Peces:** atles v2 (els budells: 239 API, 221 serveis, 63 models), **verificar D1–D8 a serveis reals** (avui deduïdes de noms), auditar la frontissa front↔back (formulari públic → endpoint → Lead; **preu públic vs veritat absoluta** `orbita-services.ts`).
- **DECISIÓ PROPIETARI:** confirmar destí de D1 (comunicacions) i D2 (documents).
- **Fet quan:** atles v2 amb les 8 duplicacions verificades a codi + decisió D1/D2.
- **Progrés:** ✅ atles v1 (#961) · ✅ accessible a l'admin (#962) · ✅ costura nº1 morta (#961) · ◻ atles v2.

### Fase 1 — CONVERSIÓ: l'autopista de proposta a reserva · **MÀXIM IMPACTE**
- **1A — Proposta → acceptació → reserva (SENSE pagament, ara).** Unificar `dossierService`/`presupuestos`/`contractService` + `portal/[token]/{sign,contract}` en **un sol flux d'acceptació**: el client veu la proposta i l'**accepta** (i, si es vol, signa), i això **converteix el lead en reserva** (via `bookingRouteService`) i bloqueja data. La paga i senyal es marca **manualment** (semàfor existent).
- **1A-bis — Pagament al portal · APARCAT (no important ara).** La passarel·la (Stripe/Redsys), el cobrament i la facturació amb IVA queden BLOQUEJATS fins que Òrbita tingui estructura legal/bancària (§0). NO es construeix ara. Es reactivarà quan el propietari es formalitzi.
- **1B — Pipeline amb valor ponderat (quick win).** Map estat→probabilitat (constants) + € ponderat al kanban (`/admin/leads`, `seasonCalendarService`, `costEngine`).
- **1C — Automatització de seguiments.** Regles per estat de lead/proposta (`sales-ops`, `emails`, crons, `inbox`, `email-templates`). Depèn de D1 resolt + SMTP sa.
- **Criteri de sèrie:** Inbox canonitzat (avui 0% `html.admin-mode`) + SMTP de producció sa.

### Fase 2 — EXECUCIÓ: capacitat i operació de camp · cost mitjà
- **Peces:** `calendario/capacity`, `cuadrant`(+`repartiment`), `crewScheduleService`, `collaborators`, `CrewBlock`.
- **Capacitat nova:** avís proactiu de capacitat; assignació automàtica de col·laborador en convertir la reserva.
- **Dependència:** D3 (vistes temporals duplicades). **DECISIÓ PROPIETARI:** llindars de capacitat.

### Fase 3 — COBRAMENT: forecasting i tresoreria · cost mitjà
- **Peces:** `economia`, `reporting`, `cost-calculator`, `pricing`, `stats`, `analytics`, `salut` (D4: 7 òrgans).
- **Capacitat nova:** forecast d'ingressos+marge (pipeline ponderat + reserves), calendari de cobraments, recordatoris automàtics.
- **Dependència:** D4 consolidat; tot marge via `computeBookingFinancialSummary`. **DECISIÓ PROPIETARI:** racionalització D4.

### Fase 4 — RECURRÈNCIA: el motor que torna a vendre · cost baix-mitjà
- **Peces:** `clientes/[id]`, `reactivation`, `reengagement`, `campaigns`, `post-event`, `ressenyes`, `google-reviews`.
- **Capacitat nova:** motor de segments únic (dormants/risc/upsell/aniversari) + petició de ressenya automàtica post-event. **Dependència:** D6. **DECISIÓ PROPIETARI:** com s'unifica D6.

### Fase 5 — Sistema i contingut · l'última capa
- Blog, portfolio, social, gestors de contingut (`text-manager`/`image-manager`/`css-manager`) sota el paraigua de `studio` (D8).

---

## 4. Quick wins vs apostes grans

**Quick wins (valor immediat, cost baix) — fer ja:**
1. **Pipeline amb valor ponderat (1B).** Map estat→probabilitat + presentació. Hores, no setmanes.
2. **Recordatoris automàtics de pagament pendent.** Cron + plantilla; el semàfor `depositPaid`/`remainingPaid` ja existeix.
3. **Preselecció de productes des del text del lead.** `leadTextExtractionService` ja extreu; cablejar-ho al configurador del bolo.
4. **Petició de ressenya automàtica post-event** amb feedback alt (`surveys` + `google-reviews` ja hi són; falta el disparador).
5. **Avís de capacitat bàsic al calendari** (comptar bolos vs equips per data).

**Apostes grans (transformador, cost alt) — planificar:**
1. **Proposta → signatura → pagament al portal (1A).** La peça que canvia el producte de categoria.
2. **Motor d'automatització de seguiments (1C).** Depèn de D1 + SMTP.
3. **Forecasting d'ingressos i marge (Fase 3).** Depèn de D4.
4. **Resolució de les 8 duplicacions (D1–D8).** Converteix l'arxipèlag en organisme.

---

## 5. Riscos i deute (el que pot fer descarrilar la visió)
1. **SMTP/IMAP caigut a producció (RISC PRINCIPAL).** Tota la Fase 1C i el rol de la safata depenen d'un canal sa. **Primer a estabilitzar.**
2. **Les 8 duplicacions no resoltes.** Construir automatització/forecast sobre duplicacions consolida el Frankenstein. **Cada fase d'automatització va precedida de la decisió de deduplicació.**
3. **Inbox com a sub-app aïllat** (0% `html.admin-mode`, ~231 px). Deute que bloqueja la Fase 1C.
4. **Pagaments al portal:** dependència externa + compliment (PCI/legal). Fer-ho bé a la primera.
5. **Working tree amb molta feina sense commit (#927+).** Risc operatiu pur.
6. **Atribució de canal / CAC encara manual.** El forecast per municipi serà aproximat fins que el CAC sigui real.
7. **Sobre-construcció.** El risc clàssic: afegir en comptes de connectar. La META és explícita: **connectar i automatitzar, no acumular.**

---

## 6. Com es treballa (ritme i mètode)
- **1–3 peces per sessió**, cada una tancada de debò: embut → 7 eixos → validació del propietari → Studio → diari/counter.
- El propietari **valida cada peça** abans de `TANCAT CHARLIE`.
- L'embut s'estreny sol: cada patró canonitzat a Studio fa més fàcil la peça següent.
- Repartiment: claude executa/canonitza/verifica; el propietari decideix producte/marca i valida.

---

## 7. DECISIONS OBERTES que necessiten el propietari (consolidades)
1. ~~Passarel·la de pagament~~ → **APARCAT** (§0): no important ara, no hi ha estructura bancària. Es reactiva quan Òrbita es formalitzi.
2. **D1 — Comunicacions**: destí de `inbox` + `mensajes` + `emails` + `email-templates` (probable: eliminar `mensajes`).
3. **D2 — Documents**: rol net `dossiers` (narratiu) vs `presupuestos` (vinculant) vs `catalog`.
4. **D4 — Mètriques**: quins dels 7 òrgans de números es fusionen.
5. **D6 — Segments**: com s'unifiquen `reactivation`/`reengagement`/`campaigns`.
6. **Llindars de capacitat** (Fase 2): quants equips/bolos per dia és «ple».
7. **Prioritat immediata:** ¿acabem Inbox+Reserva (Fase 1) abans de l'atles v2 (Fase 0), o al revés? I dels quick wins, quin primer?
