# 🗺️ Full de ruta d'execució — auditoria vertical completa + checklist viu

> **Plantejament.** Document operatiu únic que es va SEGUINT pas a pas. Ordre fixat pel
> propietari (2026-06-28): **(1) auditoria vertical de fluxos i components → (2) funcions i
> diners → (3) tot.** Cada ítem té estat: ⬜ pendent · ✅ fet · 🔴 troballa ·
> en curs (🔄). Es treballa de dalt a baix. Acompanya `DIAGNOSTIC-I-FULL-DE-RUTA.md` (estratègia) i
> `ATLES-FUNCIONAL.md` (cens). Mètode: §6 del diagnòstic (exercir el flux, front+back, dades reals).

## Principi (recordatori del mandat)
Projecte madur i **viu, no inflat** (verificat 5×: gairebé res és codi mort). El problema
és **errades + manques** que bloquegen l'ús (el propietari usa el 20%) i la **inabastabilitat
per a un novell**. Feina = **afinar, cosir, fiabilitzar el flux que s'usa, fer usable el
80% trencat** — no esborrar. Lent: **com l'operador que treballa el sistema, fàcil.**

---

## FASE 1 — Auditoria vertical de FLUXOS i COMPONENTS (lead → cash)

Recorrer cada baula com un operador real, verificar que la pàgina/component funciona i el
cablejat al següent pas existeix.

- ✅ **F1 · Captació de lead** — formulari públic `ContactFormComplete` → `/api/contact` → `persistContactLead`. **SÒLID:** validació Zod (400), captcha Turnstile (403), dedup (fusiona lead existent), tracking source/UTM/locale/pack, status NEW + activitat. Cap manca.
- 🔄 **F2 · Fitxa del lead + accions** — l'operador obre un lead: veu dades, pot contactar, canviar estat. 🔴 **F2-a (manca, operador novell):** es pot marcar un lead **WON manualment** (PATCH `/api/admin/leads/[id]`) **sense crear reserva** → arrel dels **7 bolos fantasma**. El #1194 alerta al dashboard, però NO al moment de marcar WON. *Fix proposat: en passar a WON sense booking, oferir «crear reserva ara» al punt d'acció.* 🔴 **F2-b:** la fitxa no diu «què fer ara» (NBA/`leadPipelineSuggestions` desconnectat — vegeu B1).
- ✅ **F3 · Conversió lead → booking** (`bookingCreationService` ← `/api/admin/bookings`) — **EXCEL·LENT i complet:** arrossega customer + col·laborador + línies del lead; deriva hores extra; suma pack+extres+línies+desplaçament (Google Maps real); IVA segons factura; arrodoneix a cèntims (sense desquadre Stripe); crea reserva amb tot, **marca lead WON+convertedAt**, bloqueja calendari (availability BOOKED), crea **tasca de preparació −7 dies**, registra activitat client + adminLog. Cap pèrdua de dades. 🔴 *crida `assignPackInventory` però és no-op perquè els packs no tenen inventari (D1).*
- ✅ **F4 · Pressupost / quote** (`proposalAdminService` + `proposalDispatchService` + `quotePdfService`) — **complet:** CRUD + PDF (jsPDF) + send. El send marca `SENT`+`sentAt`, actualitza lead→`QUOTE_SENT`, guard clar si falta client. 25 proposals reals, 0 òrfens. *Obs: tots en DRAFT (no s'envien pel sistema) — possible senyal que l'operador ho fa a mà; fricció lleu: cal client vinculat abans d'enviar.*
- ⬜ **F5 · Contracte** — generació, enviament, signatura (portal).
- ⬜ **F6 · Pagament** (deposit + resta · Stripe/Bizum/efectiu) — ✅ auditat V4 (idempotent, robust). Re-verificar amb la lent operador.
- ✅ **F7 · Operativa de l'event** — calendari (`availability`, 4 BOOKED), quadrant `crewSchedule`→`/admin/cuadrant`+`/repartiment`, conflictes `capacityConflict`→panell+dashboard. Tot connectat.
- ✅ **F8 · Post-event** — `postEventDispatch`→cron `/api/cron/post-event` + `send-post-event`; enquesta cosida (#1195). Cablejat.
- ✅ **F5 · Contracte** — rutes `proposals/[id]/contract` + `/contract/send`; estat i signatura al portal (`contractStatus`/`contractSignedAt`). Cablejat.

**FASE 1 — veredicte: el flux F1→F8 està CABLEJAT i funciona de punta a punta.** Cap baula trencada. Les manques són puntuals (F2-a WON-sense-reserva, F2-b guia novell, D1 inventari↔pack) i la majoria és DADES o GUIA, no codi trencat.

---

## FASE 2 — FUNCIONS i DINERS

### Diners (verificat per dissecció sobre dades reals, 2026-06-28)
- ✅ **El quadre financer QUADRA** a les 4 reserves reals (total + ingressos − costos − CAC = marge net, exacte). El motor de cost és correcte.
- ✅ CAC col·locat per canal (referral 8€, other 20€). Marges sans (44-66%).
- 🔴 **D1 — L'amortització d'inventari NO s'atribueix a cap reserva.** Causa: **0 packs tenen inventari assignat** (`pack.inventory` buit a tots). Conseqüència: `computePackPricingHealth` retorna **preu recomanat 0€** a tots els packs; les reserves usen cost de pack **ESTIMAT (ratio)**, no real. La maquinària és correcta, falta el **cablejat de dades inventari↔pack**.
- 🔴 **D2 — 28 de 51 items d'inventari sense cost** (`purchasePrice`/`expectedLifeHours` buits) → amortització 0. Encara que s'assignessin a packs, sortirien infravalorats. *Tasca de dades del propietari.*
- ⬜ **D3** — verificar atribució d'**hores de treball** (mà d'obra: especialista+operadors × hores) en un pack amb inventari real (bloquejat per D1).
- ⬜ **D4** — verificar **despeses fixes** i **desplaçament** (travelCost) en cada reserva. *(travelCost apareix correcte: 2-19€ segons distància.)*

### Funcions (capacitats fetes però desconnectades — connectar, no refer)
- 🔴 **B1 — `leadPipelineSuggestionsService` orfe.** Genera 7 tipus de suggeriments accionables per lead (hot uncontacted, stale negotiation, quote no reply…) i **cap pàgina el mostra**. La fitxa del lead no guia el novell. → **Connectar** a la fitxa/pipeline.
- ⬜ **B2** — revisar inventari d'òrfenes (`audit/inventari-funcions-orfenes.md`) cas a cas amb la cadena completa (funció→alias→route→fetch) abans de decidir connectar/treure. *Baixa prioritat (verificat: poc rendiment).*

---

## FASE 3 — TOT (components, UI, responsive, claredat per al novell)
- ⬜ T1 — coherència visual dels components del flux (els 7 eixos de sèrie).
- ⬜ T2 — responsive 375/tablet/desktop de les pàgines del flux.
- ⬜ T3 — claredat per al novell: noms confusos (snapshot/archive/snapshot), navegació, què-fer-ara.
- ⬜ T4 — neteja de documentació (39 docs → jerarquia clara). *Nota: 6 docs «vells» estan cablejats a guards, no moure'ls.*

---

## Deures del PROPIETARI (no codi — desbloquegen ús)
- ⬜ P1 — **Materialitzar 7 bolos guanyats sense reserva** (cobrats en efectiu, fora del sistema).
- ⬜ P2 — **Omplir cost/vida de 28 items d'inventari** + **assignar inventari als packs** (desbloqueja D1+D2+D3 → preu recomanat real).
- ⬜ P3 — Decidir privacy: `recordConsent` + retenció (refer o deixar).

---

## Registre d'avanç
- 2026-06-28 — Creat el full de ruta. Diners verificats (quadren). Trobat D1 (inventari↔pack buit), D2 (28 items sense cost), B1 (suggeriments orfes).
- 2026-06-28 — FASE 1 en marxa: **F1 ✅** (captació sòlida), **F2 🔄** (trobat F2-a: WON manual sense reserva = arrel 7 bolos; F2-b: fitxa sense «què fer ara»), **F3 ✅** (conversió excel·lent i completa), **F4 ✅** (pressupost complet). Següent: F5 (contracte), F7 (operativa), F8 (post-event); F6 ja auditat (V4 ✅).
