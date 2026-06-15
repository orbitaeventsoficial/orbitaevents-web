# Atles de l'organisme — Òrbita Events (front + back, un sol element)

> Estudi/auditoria del programa SENCER, a pams: tots els òrgans, què fan, com es connecten i on es **duplica/triplica** funcionalitat. És el **prerequisit de l'embut** (protocol §0.1.1): cap peça es filtra sense mirar el seu lloc aquí i els òrgans veïns a banda i banda.
>
> Estat: **v1 (claude, 2026-06-15)**. Document VIU: s'actualitza a mesura que les peces passen l'embut.
>
> **COBERTURA HONESTA d'aquesta v1** (què s'ha mapejat i què NO):
> - ✅ Inventari de **pàgines/rutes**: 90 admin + 72 públiques.
> - ⚠️ **NO inventariat encara a fons** (capa de sota, la fontaneria real): **239 rutes API** (`app/api/**`), **221 serveis** (`lib/services/**`), 15 crons, 63 models Prisma, 44 components. Les duplicacions D1–D8 s'han **deduït dels noms de pàgina**, no verificades encara a serveis/API (cal v2).
> - ⚠️ **Frontissa front↔back**: aquí hi ha la principal coneguda del codi, però NO auditada extrem a extrem (l'agent dedicat va caure per límit de sessió). Pendent: traçar cada formulari públic → endpoint → Lead i verificar divergències de preu front vs veritat absoluta.
> - Conclusió: v1 és el mapa de la **cara** (pàgines); falta mapar els **budells** (API/serveis/dades) per a v2.

---

## 1. Visió de conjunt

Un sol organisme amb dues cares:
- **Front-office** (`app/[locale]/**`): **72 pàgines públiques** (ca/es/en). Capta i mostra. Objectiu: SEO + conversió.
- **Back-office** (`app/admin/**`): ~90 rutes. Opera. Objectiu: execució + cobrament + recurrència.
- **Frontissa** (`app/api/**` + capa de constants/serveis compartida): el web públic alimenta l'admin (leads) i l'admin governa el web (preus, textos, contingut).

**Flux vital del negoci:**
```
WEB PÚBLIC (captació)
  contacto / configurador / reservar / portal
        │  app/api/** (crea Lead)
        ▼
LEADS (entrades) → FITXA LEAD (el bolo) → DOSSIER/PRESSUPOST (proposta)
        │                                          │
        ▼                                          ▼
  SAFATA (comunicació)  ◄──────────────►  RESERVA (execució + cobrament)
                                                   │
                                                   ▼
                                          CLIENT (recurrència) → POST-EVENT → REVIEWS
```

---

## 2. Inventari d'òrgans — BACK-OFFICE (agrupació actual de `nav-items.ts`)

### A. Nucli operatiu (1r nivell, ús diari)
| Òrgan | Ruta | Funció | Eix negoci |
|---|---|---|---|
| Dashboard | `/admin` | Visió general + accessos ràpids | tot |
| Entrades (Leads) | `/admin/leads` (+`[id]`, `arxiu`, `reengagement`) | Pipeline de consultes → conversió. Fitxa = «el bolo» | conversió |
| Clients | `/admin/clientes` (+`[id]`, `reactivation`, `referrals`) | Hub 360 del client | recurrència |
| Reserves | `/admin/bookings` (+`[id]`, `new`) | Execució, cobrament, marge | execució+cobrament |
| Tasques | `/admin/tasks` (+`new`) | Feina pendent (kanban) | execució |
| Calendari | `/admin/calendario` (+`capacity`) | Càrrega per dia/setmana/mes | execució |

### B. Comercial / Sales Ops
| Òrgan | Ruta | Funció |
|---|---|---|
| Pressupostos | `/admin/presupuestos` (+`[id]`) | Propostes comercials → reserva |
| Dossiers | `/admin/dossiers` | Dossier editorial de propostes (✅ TANCAT CHARLIE) |
| Calculadora costos | `/admin/cost-calculator` | Simulació de marges |
| Finances | `/admin/economia` | Cobraments, rendibilitat, tresoreria |
| Salut | `/admin/salut` | Incidències i risc operatiu |
| Col·laboradors | `/admin/collaborators` (+`[id]`) | Equip extern, tarifes, productes |
| Safata (IMAP) | `/admin/inbox` (+`compose`, `settings`) | Correu real IMAP/SMTP |
| Sales Ops | `/admin/sales-ops` | Seqüències, SLA, automatismes |
| Campanyes | `/admin/campaigns` | Comunicacions massives per segment |
| Cuadrant | `/admin/cuadrant` (+`repartiment`) | Qui treballa cada bolo + repartiment de pasta |
| Entrada ràpida | `/admin/intake` · `/admin/quick-create` | Crear entrada fora de flux |

### C. Catàleg / Producte
| Òrgan | Ruta | Funció |
|---|---|---|
| Packs | `/admin/packs` (+`[id]`, `extras`, `new`) | Què venem |
| Inventari | `/admin/inventory` (+`[id]`, `new`) | Equip tècnic |
| Preus | `/admin/pricing` | Criteris de pricing |
| Descomptes | `/admin/discount-codes` | Codis promocionals |
| Catàleg | `/admin/catalog` | Oferta global (packs+inventari+preus) |
| Qüestionaris | `/admin/questionnaires` (+`[id]`, `new`) | Pre-event al portal |

### D. Contingut / Màrqueting
| Òrgan | Ruta | Funció |
|---|---|---|
| Blog | `/admin/blog` (+`new`, `edit/[id]`) | Contingut editorial |
| Ressenyes | `/admin/ressenyes` | Testimonis interns |
| Ressenyes Google | `/admin/google-reviews` | Prova social externa |
| Correus | `/admin/emails` | Automatismes d'enviament |
| Plantilles email | `/admin/email-templates` (+`[slug]`) | Missatges base |
| Portfolio | `/admin/portfolio` | Aparador visual |
| Social | `/admin/social` | Xarxes socials |
| Mensajes | `/admin/mensajes` | ⚠️ sembla pont/redirecció a leads (revisar) |
| Marketing | `/admin/marketing` | Hub de màrqueting |

### E. Anàlisi / Sistema
| Òrgan | Ruta | Funció |
|---|---|---|
| Post-esdeveniment | `/admin/post-event` (+`feedback`, `playbook`, `reports`, `surveys`) | Tancament de cicle |
| Analítica | `/admin/analytics` · Reporting `/admin/reporting` · Stats `/admin/stats` | Mètriques |
| FAQ | `/admin/faq` (+`[id]`, `new`) | Respostes freqüents |
| Textos | `/admin/text-manager` | i18n centralitzat (font: `messages/*`) |
| Imatges | `/admin/image-manager` | Placements visuals |
| Tema admin | `/admin/css-manager` · Canvas `/admin/canvas` | Aspecte/edició visual |
| Studio | `/admin/studio` | **Font de veritat visual (mostrari de la sèrie)** |
| Privacitat | `/admin/privacy` | RGPD |
| Manual | `/admin/manual` · Docs `/admin/docs/protocol` | Guia interna |
| Sistema | `/admin/settings` (+`company`,`hero`,`integrations`,`notifications`,`quotes`) · `features` · `coverage` · `activity` · `crons` · `scripts` · `salut` | Configuració i monitoratge |

## 2.bis Inventari d'òrgans — FRONT-OFFICE (`app/[locale]/**`)
- **Captació/conversió**: `contacto`, `configurador`, `reservar`, `disponibilidad`, `packs`, `gracias`, `reserva-confirmada`, `valoracio`.
- **Servei/SEO**: `servicios` + subrutes (`bodas`, `fiestas`, `empresas`, `animacion`, `animacion-infantil`, `alquiler`, `produccion`, i landings SEO de municipi `dj-fiestas-*`, `dj-bodas-*`).
- **Marca/contingut**: `about`, `portfolio` (+`[slug]`, `[eventSlug]`), `blog` (+`[slug]`), `opiniones`, `experiencias`, `gallery/[shareToken]`.
- **Temàtiques**: `tematica-halloween`, `boda-halloween`, `tematica-mon-magic`, `sensorial`, `respira`.
- **Portal client** (frontissa pura): `portal/[token]` (+`contract`, `gallery`, `invoice`, `payments`, `questionnaire`, `sign`, `timeline`, `payment-success`).
- **Legal**: `legal/*`, `privacitat`.

---

## 3. La FRONTISSA front ↔ back (tot relacionat)

| Pont | Front | → | Back / Font de veritat |
|---|---|---|---|
| **Captació de leads** | `contacto`, `configurador`, `reservar` | `app/api/**` | crea `Lead` → `/admin/leads` |
| **Catàleg comercial** | web packs/serveis | comparteix | `app/config/packs-config.ts` (claus i18n) + model `Pack` (BD) + `/admin/packs` |
| **Veritat de preus** | preus públics | deriva de | `lib/constants/orbita-services.ts` (`DJ_FIRST_HOUR_PRICE`…) — **una sola veritat** |
| **Textos/i18n** | tot el web | governat per | `messages/{ca,es,en}.json` ← editables a `/admin/text-manager` |
| **Portal client** | `portal/[token]/*` | reflecteix | reserva, contracte, factura, pagaments, qüestionari de l'admin |
| **Dossiers/emails** | rebut pel client | generat a | `/admin/dossiers` + `lib/services/dossierService` (preferredLocale) |
| **Reviews** | `opiniones` públiques | alimentat per | `/admin/ressenyes` + `/admin/google-reviews` |

> Pendent v2 (front-office-atles): traçar el camí exacte de cada formulari públic → endpoint → Lead, i auditar divergències de preu públic vs veritat absoluta.

---

## 4. ⚠️ ESTUDI DE DINAMITZACIÓ — duplicació/triplicació (el punt clau)

Funcionalitats repartides en més d'un òrgan. Cal **una sola veritat** per capacitat.

| # | Capacitat duplicada | Òrgans implicats | Diagnòstic | Font única recomanada |
|---|---|---|---|---|
| D1 | **Comunicació per email** | `inbox` + `mensajes` + `emails` + `email-templates` | 4 òrgans toquen correu; `mensajes` sembla redundant amb leads/inbox | `inbox` = safata viva · `email-templates` = plantilles · `emails` = automatismes · **fusionar/eliminar `mensajes`** |
| D2 | **Document comercial** | `dossiers` + `presupuestos` + `catalog` | Dossier (editorial), pressupost (preu), catàleg (oferta) se solapen en generació de PDF i selecció de productes | Decidir: dossier = narratiu, pressupost = vinculant; compartir el motor de selecció de productes (ja parcialment fet) |
| D3 | **Vistes temporals** | `calendario` + `leads`(calendari caps de setmana) + `cuadrant` + `calendario/capacity` | 4 visions de «qui/què/quan» | Unificar font de dades temporal; cada vista una lent, no una còpia |
| D4 | **Números del negoci** | `economia` + `pricing` + `cost-calculator` + `reporting` + `stats` + `analytics` + `salut` | 7 òrgans de mètriques/diners; alt risc de càlcul divergent | Tot marge via `computeBookingFinancialSummary`; consolidar reporting; `stats`(web) vs `analytics`(negoci) clarificar |
| D5 | **Creació d'entrada** | `quick-create` + `intake` + `tasks/new` + `bookings/new` + lead nou | Múltiples portes d'entrada | Una entrada ràpida canònica; la resta hi apunten |
| D6 | **Segments dormants/CRM** | `clientes/reactivation` + `leads/reengagement` + `campaigns` | Segments solapats (dormants/risc/upsell) | Un motor de segments; vistes especialitzades |
| D7 | **Reviews** | `ressenyes` + `google-reviews` | Internes vs externes; raonable separar però unificar presentació | Mantenir separat, unificar UI/patró |
| D8 | **Gestors de contingut/visual** | `text-manager` + `image-manager` + `css-manager` + `canvas` + `studio` | Diversos editors; `studio` ha de ser el paraigua visual | `studio` = sistema; els *-manager = contingut concret |

---

## 5. ARQUITECTURA OBJECTIU — on va cada pàgina i com es cableja

**Agrupació lògica (mantenir les 5 famílies de `nav-items`, depurades):**
1. **Operativa diària** (Dashboard, Leads, Clients, Reserves, Tasques, Calendari) — el que es toca cada dia.
2. **Comercial** (Pressupostos+Dossiers unificats de motor, Finances, Col·laboradors, Safata, Sales Ops, Cuadrant) — vendre i cobrar.
3. **Catàleg** (Packs, Inventari, Preus, Descomptes, Catàleg, Qüestionaris) — què venem.
4. **Creixement/Contingut** (Blog, Portfolio, Reviews, Social, Campanyes, Reactivació/Reengagement) — captar i fidelitzar.
5. **Sistema** (Studio, Textos, Imatges, Settings, Features, Crons, Activitat, Manual, Privacitat) — la infraestructura.

**Cablejat ideal del nucli comercial** (objectiu, verificat parcialment al #960):
`Lead ⇄ Fitxa(bolo) → Dossier/Pressupost → Safata(comunicació) → Reserva(cobrament) → Client(360) → Post-event → Review`. Cada fletxa ha de ser un enllaç real amb context (params) que flueix i torna.

---

## 6. PLA DE PAS PER L'EMBUT (ordre prioritzat)

1. **Nucli comercial ja iniciat** (dossiers ✅, fitxa lead ✅, leads ✅, inbox ◻ pendent SMTP+canonicitat). Acabar la coherència de sèrie d'aquests 4 (veure §7).
2. **Reserves + Clients** (`bookings/[id]`, `clientes/[id]`): els òrgans que tanquen el flux; alta prioritat operativa.
3. **Resoldre dinamització D1 (comunicacions) i D2 (documents)**: decisions d'arquitectura abans de polir.
4. **Catàleg** (packs/preus/inventari): font de veritat compartida amb el front.
5. **Mètriques (D4)**: consolidar economia/reporting.
6. **Sistema/contingut**: l'última capa.

---

## 7. Deute transversal conegut (del diagnòstic del director de disseny, #960)

- **Coherència de sèrie actual: 5,5/10 — «Frankenstein elegant»**. Comparteixen tokens (sang) però divergeix l'esquelet.
- **Costura nº1**: `/admin/dossiers` usa `.ix__forminput` (9 inputs) definida dins `inbox.css` → dependència creuada fràgil. **Acció: input canònic a `admin-shell.css` + mostra a Studio.**
- **Inbox = sub-app aïllat**: 0% selectors `html.admin-mode`, 3 prefixos (`sf__`/`cx__`/`ix__`), ~231 mides en `px`. No pot ser TANCAT CHARLIE com a sèrie fins canonitzar-lo.
- **4 patrons de capçalera** (només dossiers usa `AdminPage`, i amb hero doble). Unificar sota `AdminPage`.
- **Skeletons/empty/error desiguals**: dossiers reinventa skeleton; només fitxa lead té `error.tsx`; ningú usa `AdminEmptyState`/`ap-btn-*`.
- **`OwnerControlStrip.tsx`** (capa compartida) usa Tailwind amb paleta directa (`cyan-*`,`amber-*`…) → viola «admin no inventa paleta».
- **Millor patró a imitar**: `/admin/dossiers`. **Més lluny**: `/admin/inbox`.

---

## 8. Estat TANCAT CHARLIE (eix de sèrie)
- ✅ `/admin/leads` (calendari) · ✅ `/admin/leads/[id]` (fitxa) · ✅ `/admin/dossiers`.
- ◻ `/admin/inbox` — millorat però NO tancat (SMTP + canonicitat pendents).
- La resta: pendents de passar l'embut.

---

# v2 — Auditoria de cablejat de l'admin (claude, 2026-06-15)

> Recorregut cable-per-cable de `app/admin/**` contra els 7 eixos «Sèrie Òrbita Events». Tota troballa d'aquesta v2 s'ha **revalidat sobre el codi** (fitxer:línia) abans d'escriure-la — dos punts d'un informe d'agent extern es van descartar per ser falsos (vegeu §v2.4). Inventari real verificat: **90 fitxers `page.tsx`** sota `app/admin/**`.

## v2.0 Veredicte ràpid

- **El cablejat d'ENTITATS està ben canonitzat** (sorpresa positiva): 11 helpers a `lib/admin/*WorkspaceHref.ts` (`buildBookingHref`, `buildLeadWorkspaceHref`, `buildCustomerHubHref`, `buildLeadComposeHref`, `buildCustomerProposalHref`…). Cap pàgina construeix `/admin/clientes/${id}` ni `/admin/bookings/${id}` a mà. El flux comercial lead→dossier→pressupost→reserva→client→inbox→post-event té enllaços reals amb context (`leadId`/`customerId`/`bookingId`/`proposalId`/`to`) que flueixen i es consumeixen.
- **El que desafina és la NAVEGACIÓ (D9) i unes poques COSTURES de CSS/labels**, no el cablejat profund.

## v2.1 D9 — La navegació té TRES fonts divergents (no dues)

La troballa inicial parlava de dues fonts. La revisió en destapa **tres** mapes de navegació que no es parlen entre ells:

| # | Font | Fitxer | Qui la consumeix | Estructura |
|---|---|---|---|---|
| 1 | `NAV_GROUPS` | `app/admin/layout.tsx:21` | **El sidebar real** | 5 grups: Agenda · Operativa · Catàleg · Web · Sistema (~20 entrades visibles) |
| 2 | `NAV_SECTIONS` + `getPriorityItems()` | `app/admin/components/nav-items.ts` | **Només el cercador** (`AdminSearchModal.tsx:21,127`) | 5 seccions: Prioritat · Operacions · Producte · Contingut · Avançat · Configuració (~45 entrades) |
| 3 | Doctrina escrita §4 | `docs/admin-protocol.md:434` | Ningú (paper) | 8 famílies: Prioritat · Captació · Clients · Operacions · Comunicació · Finances · Growth · Sistema |

**Conseqüències verificades:**
- **Cobertura asimètrica greu**: el sidebar exposa ~20 destins; existeixen ~90 pàgines. Òrgans de primer ordre **no tenen entrada al sidebar** i només s'arriba per URL o pel cercador: `economia`(sí hi és), `collaborators`, `sales-ops`, `cuadrant`, `post-event`, `analytics`, `reporting`, `calendario`, `campaigns`, `emails`, `email-templates`, `google-reviews`, `catalog`, `cost-calculator`, `discount-codes`, `questionnaires`, `salut`. `getGroupForPath()` (layout.tsx:73) fins i tot ressalta grups (p. ex. `cataleg` per `/admin/catalog`) que **no tenen l'enllaç al submenú** → el grup s'encén però no mostra com arribar-hi.
- **Doble manteniment real**: afegir una entrada obliga a tocar `layout.tsx` (sidebar) **i** `nav-items.ts` (cercador). Ja han divergit; el pegat «Atles»/«Full de ruta» viu duplicat a tots dos.
- **Noms confusos**: el grup `Agenda` conté de fet tot el nucli comercial (Temporada/Reserves/Dossiers/Clients/Pressupostos); hauria de dir-se **Comercial**. `Operativa` (id intern `events`) només té Tasques+Inventari.

**Proposta concreta — UNA font canònica de nav (a validar pel propietari, NO aplicada):**

Crear `lib/admin/admin-nav.ts` com a **font única** (tipus `AdminNavGroup[]` amb `id`, `label`, `icon?`, `items[]` on cada item té `label`, `href`, `description`, `secondary?`, `searchableOnly?`). D'aquí beuen ALHORA: el sidebar (`layout.tsx`), el cercador (`AdminSearchModal`) i `getGroupForPath` (derivat de la mateixa estructura, no una funció paral·lela). Estructura i ordre proposats (flux de negoci captar→convertir→operar→comunicar→cobrar→créixer→mantenir):

1. **Comercial** (era «Agenda»): Temporada(leads) · Reserves · Dossiers · Pressupostos · Clients · Col·laboradors · Safata · Sales Ops · Cuadrant · _Arxiu·Reengagement·Reactivació (secondary)_.
2. **Operativa**: Tasques · Calendari · Capacitat · Inventari · Post-event · Salut.
3. **Catàleg**: Packs · Preus · Descomptes · Catàleg · Qüestionaris · Calculadora costos.
4. **Creixement / Web**: Portfolio · Blog · Ressenyes · Google Reviews · Social · Campanyes · Marketing.
5. **Mesura**: Economia · Reporting · Analítica · Stats.
6. **Sistema**: Studio · Textos · Imatges · Tema · Settings · Features · Cobertura · Crons · Activitat · Scripts · Privacitat · Manual · Atles · Full de ruta.

Recomanació UX: **grups col·lapsables** (no només "el grup actiu obert"), amb persistència de l'obert/tancat, perquè 6 grups amb 8–10 items cadascun caben i es naveguen sense saltar de context. La decisió d'ordre/noms/desplegable és **del propietari** → per això NO s'aplica aquí.

## v2.2 Mapa de cables entre òrgans (verificat fitxer:línia)

| Cable | Origen → Destí | Param | Estat |
|---|---|---|---|
| Leads → fitxa | `LeadsSeasonClient` → `/admin/leads/[id]` | `buildLeadWorkspaceHref` | ✅ OK |
| Fitxa lead → pressupost | `LeadBoloSection.tsx:229` → `/admin/presupuestos?leadId=` | `leadId` | ✅ OK (consumit a `presupuestos/page.tsx:83`) |
| Fitxa lead → compose | `LeadDetailClient.tsx` → `/admin/inbox/compose` | `buildLeadComposeHref` | ✅ OK |
| Lead guanyat → nova reserva | `LeadDetailClient` → `/admin/bookings/new?leadId=` | `leadId` | ✅ OK (`NewBookingForm.tsx:65`) |
| Reserva → lead origen | `bookings/[id]/page.tsx:385` → `/admin/leads/[id]` | `buildLeadWorkspaceHref` | ✅ OK |
| Reserva → fitxa client | `bookings/[id]/page.tsx:391` → `/admin/clientes/[id]` | `buildCustomerHubHref` | ✅ OK |
| Reserva → compose | `bookings/[id]/page.tsx:372` | `buildLead/CustomerComposeHref` | ✅ OK |
| Reserva → informe post-event | `bookings/[id]/page.tsx:397` → `/admin/post-event/reports/new?bookingId=` | `bookingId` | ✅ OK |
| Client → pressupost/reserva/tasques/compose | panells de `clientes/[id]/_components/**` | `customerId`(+`view`/`status`/`to`/`proposalId`) | ✅ OK (`customerWorkspaceHref.ts`) |
| Partner Hub → compose | `PartnerHubClient.tsx:372` → `/admin/inbox/compose?to=` | `to` | ✅ OK (arreglat #960; `compose/page.tsx:170 initialTo`) |
| `?to=` a compose | — | — | ✅ **NO és cable mort** (l'informe extern s'equivocava): `compose/page.tsx:102,170` + `ComposeForm.tsx:46,57,64` el consumeixen. |
| `?proposalId=` a presupuestos | — | — | ✅ **NO és cable mort** (l'informe extern s'equivocava): `presupuestos/page.tsx:42,45,327,360 initialProposalId`. |

**Cap cable trencat crític detectat.** El nucli comercial està ben cosit. El que falta és exposició a la NAV (v2.1), no enllaços inexistents.

## v2.3 Duplicacions noves (a banda de D1–D8)

| # | Capacitat duplicada | On | Diagnòstic | Font única recomanada |
|---|---|---|---|---|
| **D9** | **Mapa de navegació** | `layout.tsx NAV_GROUPS` + `nav-items.ts NAV_SECTIONS` + `protocol §4` | Tres llistes divergents; doble manteniment; cobertura asimètrica | `lib/admin/admin-nav.ts` única → sidebar + cercador + getGroupForPath (vegeu v2.1) |
| **D10** | **Labels de pipeline/prioritat/pagament del lead** | `LeadDetailClient.tsx:36-45` ⟷ `LeadsSeasonClient.tsx:63-86` | `PRIORITY_LABEL` repetit i **idèntic** a `PRIORITY_LABELS` de `lib/constants/index.ts:432`. `STAGE_LABEL` (type `Stage` visual nou/contactat/guanyat/perdut) repetit entre els dos fitxers. **`PAY_LABEL` DIVERGEIX**: `LeadDetailClient` diu `full:'Pagat'`, `LeadsSeasonClient` diu `full:'Pagada'` → monocapa trencada de copy. | `lib/constants/lead-labels.ts` (o reusar `PRIORITY_LABELS`). El copy de `PAY_LABEL` (Pagat vs Pagada) l'ha de fixar el propietari. |
| **D11** | **Costura de classes CSS entre òrgans** | (a) `dossiers/DossierGeneratorClient.tsx` usava `.ix__forminput` d'inbox · (b) `bookings/[id]/BookingTotalEditor.tsx:82-83` usa `.fxd__savebtn`/`.fxd__cancelbtn` definides a `leads/leads-design.css:2236` | Un òrgan depèn del CSS d'un altre: tocar el CSS d'inbox/leads trenca dossiers/reserves. | Botó desar/cancel·lar canònic a `admin-shell.css` + mostra a Studio. (a) JA RESOLT (vegeu v2.5). (b) PROPOSAT. |

> Nota duplicacions menors (no D-nou, anotades): formatadors locals `formatDateUTC` (`leads/arxiu/ArxiuClient`), `formatDateKey` (`cuadrant/page`) — específics de context, baix valor de consolidació. `MATCH_LABELS` repetit a `BookingCustomerLinkPanel.tsx:14` i `LeadCustomerLinkPanel.tsx:14` (vincular client per email/telèfon/nom) → candidat a `lib/constants` si es toca.

## v2.4 Correccions a l'informe d'agent extern (revalidació)

Per disciplina del protocol («revalidar localment abans de donar per bo»), dues afirmacions de l'auditoria automàtica es van **descartar per falses**: el cable `?to=` a compose i el `?proposalId=` a presupuestos SÍ es consumeixen (vegeu v2.2). La costura `fxd__` a `BookingTotalEditor` i el D10 de labels SÍ es van confirmar.

## v2.5 Millores aplicades vs proposades

**APLICADES (baix risc, validades amb `tsc --noEmit` net):**
- **Costura D11(a) tancada a la cara**: `dossiers/DossierGeneratorClient.tsx` migrat de `.ix__forminput`/`.ix__forminput--textarea` (prefix inbox, 9 usos) → `.adm-input`/`.adm-input--textarea` canònic. El #961 ja havia mogut la definició a `admin-shell.css` i deixat l'àlies; ara la cara de dossiers ja no depèn del CSS d'inbox. `grep ix__` a dossiers = 0.

**PROPOSADES (a validar/aplicar per l'orquestrador + propietari):**
- **D9 — unificació de nav**: estructural i visual (ordre/noms/desplegables) → decisió del propietari. Pla concret a v2.1.
- **D11(b) — costura `fxd__savebtn`/`fxd__cancelbtn`**: promoure a botó canònic a `admin-shell.css` + Studio, i fer que leads i `BookingTotalEditor` el consumeixin. (S'hi suma que `BookingTotalEditor.tsx` té inline styles que el propietari hauria de validar com a refactor a classes.)
- **D10 — labels de lead**: centralitzar a `lib/constants`; cal que el propietari fixi el copy divergent `PAY_LABEL` (Pagat vs Pagada) abans d'unificar.
- **Capçalera de sèrie**: ~persistents pàgines de primer nivell (leads, bookings, inbox, clientes, presupuestos, calendario) usen layout propi en lloc d'`AdminPage`. És deute conegut (#960 §7: «4 patrons de capçalera»); la unificació sota `AdminPage` és refactor gros → no és «baix risc».
