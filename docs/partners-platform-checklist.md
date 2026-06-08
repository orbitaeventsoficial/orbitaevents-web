# Partners Platform — Checklist gegant (estat 2026-06-08, nit)

> Mapa complet per reprendre la feina. Llegeix `docs/partners-platform-handoff.md` per al detall de negoci i `docs/agent-sync.md` per a la coordinació entre agents.
> **Arquitectura DECIDIDA per Opus** (vegeu §Decisió). No reobrir el model sense motiu fort.

---

## A. Estat actual del repo (working tree, SENSE commit)

### Fet per codex (#898)
- [x] Schema: `Collaborator.roles[]`, `Lead.sourceCollaboratorId`, `Booking.sourceCollaboratorId` + relacions + índexs.
- [x] Migració `20260607193000_partner_roles_and_sources` — **desplegada a Railway** (2026-06-08).
- [x] Serveis: `leadRouteService` (select + PATCH `sourceCollaboratorId`), `bookingCreationService` (herència + `manualTotalPrice`), `collaboratorAdminService` (rols).
- [x] UI: `/admin/collaborators` com a «Partners» (rols, badges, KPI), nova reserva amb «Relació comercial» (DJ/tècnic split a `notes`), agenda multi-bolo.
- [x] Validació codex: tsc OK, 72 tests, qa:protocol OK (#898).

### Fet per claude (aquesta sessió)
- [x] Hooks de protocol: `scripts/hooks/check-residue.mjs` (PostToolUse), `session-start.mjs` (SessionStart), `install-hooks.mjs`. Instal·lats a `.claude/settings.json`. Documentats a `CLAUDE.md` + diari.
- [x] `lib/services/partnerHubService.ts` — `fetchPartnerHub(id)` (capa de dades del hub). **3 tests verds**, tsc net.
- [x] `docs/partners-platform-handoff.md` reescrit (ortografia normativa + pla per fases + bloqueig).
- [x] Prisma client regenerat (resolt l'EPERM del lock de node).

### Pendent de decisió humana
- [ ] **Commit del working tree**: ara hi ha #898 (codex) + capa hub + hooks barrejats sense commit. Decidir com es parteix en commits.
- [ ] El `page.tsx` del hub el vaig eliminar (incomplet) per no deixar el repo trencat; es refà a la Fase 2.

---

## B. Decisió d'arquitectura (Opus, 2026-06-08) — LOCKED

1. **NO unificar `Customer` + `Collaborator`.** Dues taules separades. Customer és zona consolidada/arriscada (facturació, GDPR, portal, emails). Connexió pel bolo.
2. **`Booking.billedCollaboratorId`** (nou): un bolo es factura a un partner sense crear Customer mirall. Excloent amb `customerId` a nivell de **servei** (no constraint BD).
3. **`BookingServiceLine`** (nou model + enum `BookingServiceLineKind`: DJ, SOUND_TECH, PROVIDER_SERVICE, EQUIPMENT, OTHER): split estructurat ingrés/cost per línia. `Float`, no `Decimal` (coherència amb la resta del repo).
4. **Marge sempre via `computeBookingFinancialSummary()`** — afegir-hi inputs `serviceLinesRevenue`/`serviceLinesCost`, mai càlcul inline.
5. **`CollaboratorBooking` NO es toca ni s'elimina** — segueix sent la liquidació/comissió amb el partner. Conviu amb `BookingServiceLine`.
6. **Risc crític**: no comptar el cost dos cops (`BookingServiceLine.costAmount` vs `CollaboratorBooking.commissionAmount`). Cada concepte una sola via. Cobrir amb test.

Validació dels dos casos reals amb el model:
- **Cristina Rey**: `customerId`=Cristina · `billedCollaboratorId`=null · línia DJ (revenue) + línia animador `collaboratorId`=Masquerade (cost).
- **Lliçà d'Amunt (OE-2026-005)**: `customerId`=null · `billedCollaboratorId`=Masquerade · 2 línies pròpies (DJ 300 + tècnic 40 = 340), zero `notes`.

---

## C. CHECKLIST D'IMPLEMENTACIÓ (per dependències)

### ✅ Fase 0 — Desbloqueig (PROPIETARI) — FET
- [x] `npx prisma migrate deploy` (Railway).
- [x] `npx prisma generate`.
- [ ] Verificar al navegador `/admin/leads/[id]` i `/admin/collaborators` sense 500 (recomanat confirmar-ho).

### 🟡 Fase 1 — Selector «Bolo passat per» a la fitxa de lead (AGENT) · codi FET, validació pendent
- [x] ⚠️ Confirmat: `LeadProfileEditor.tsx` és codi mort. El selector s'ha posat a `LeadDetailClient.tsx` (superfície real).
- [x] `LeadDetailClient.tsx`: tipus `sourceCollaboratorId` + `saveSourceCollaborator()` (patró de `saveAssignedTo`) + `<select>` «Bolo passat per» (reutilitza la llista `collaborators` ja carregada; qualsevol partner pot passar un bolo). `aria-label` posat.
- [x] `page.tsx`: `sourceCollaboratorId` afegit a la query i a l'objecte passat.
- [x] PATCH a `/api/admin/leads/[id]` (l'API ja acceptava el camp). `tsc` OK.
- [x] **Test**: `leadRouteService.test.ts` +2 casos (desa `sourceCollaboratorId` i el propaga al booking; accepta null sense booking). **14 tests verds.** `tsc` global OK.
- [x] **Validació tècnica**: `pnpm build` OK en el tall #900/#902. Validació visual manual a `/admin/leads/[id]` encara recomanada.
- [ ] Opcional futur: filtrar per rol `REFERRER` si es vol acotar la llista.

### 🟡 Fase 2 — Partner Hub `/admin/collaborators/[id]` (AGENT) · versió funcional FETA
- [x] Capa de dades: `fetchPartnerHub` + test (FET, 3 verds).
- [x] `app/admin/collaborators/[id]/page.tsx` (server, `AdminPage` amb `back`, serialitza dates). FET.
- [x] `PartnerHubClient.tsx` amb 6 pestanyes: **Resum · Bolos que ens passa · Bolos on el contractem · Material i catàleg · Economia · Notes i contacte**. FET (sense hex/style/rgba; tsc net).
- [x] `loading.tsx`. FET.
- [ ] **Enllaç des de les targetes de `/admin/collaborators`** → editar `CollaboratorsClient.tsx` (pendent).
- [ ] **Accions operatives** (marcar comissió pagada, editar des del hub) — ara és lectura. Pendent.
- [x] **Enllaç des de les targetes** → `CollaboratorsClient.tsx` botó «Obrir fitxa» (FET, tsc OK).
- [ ] **Pestanya «Bolos facturats a aquest partner»** (cas Lliçà: partner = client via `billedCollaboratorId`) → ampliar `fetchPartnerHub` amb `billedBookings`. **BLOQUEJAT**: depèn que el propietari desplegui la migració `20260608113000_booking_partner_billing_service_lines` a Railway (si no, peta a runtime). Fer-ho just després del desplegament.
- [ ] **Poliment visual 🟢** (CSS bespoke `ph__` amb tokens, treure `ap-*`/`AdminPage`) — **fer amb dev server viu + captures**, no a cegues.
- [x] Validació tècnica global: `pnpm run validate:core`, `pnpm test:run` i `pnpm build` OK fins a #902.

### ⬜ Fase 3 — Facturació a partner + línies estructurades (AGENT + PROPIETARI per migració) · mitjà
- [x] **AGENT** — Schema: afegir `Booking.billedCollaboratorId` + relació `BookingBilledCollaborator` + `@@index`; `Collaborator.billedBookings`; `Booking.serviceLines`; model `BookingServiceLine` + enum. `prisma generate`. FET #899.
- [ ] **PROPIETARI** — aplicar migració local `20260608113000_booking_partner_billing_service_lines` a Railway i regenerar Prisma a l'entorn.
- [x] **AGENT** — `computeBookingFinancialSummary()`: inputs `serviceLinesRevenue`/`serviceLinesCost`; sumar `serviceLinesCost` al `directCost`. Test anti-doble-comptabilitat. FET #899.
- [x] **AGENT** — `bookingRouteService`/`bookingCreationService`: validació de servei `customerId` XOR `billedCollaboratorId`; si partner, omplir `clientName/Email/Phone` des del Collaborator. Test. FET #899.
- [x] **AGENT** — UI nova reserva: `serviceLines` substitueix el split a `notes`; selector real de partner i `billedCollaboratorId` quan el partner contracta Òrbita. FET #903.

### ⬜ Fase 4 — Seed inicial de partners (PROPIETARI executa) · petit
- [ ] **AGENT** — Script seed amb Carlos/Masquerade, DJ Rufo, Tino, Tronios, DJ Mania **com a dades** (rols correctes), idempotent.
- [ ] **PROPIETARI** — Executar el seed contra Railway.

### ⬜ Fase 5 — Analítica de partners (AGENT) · mitjà
- [ ] Servei d'agregació (patró `executiveReportService`): bolos passats, import facturat gràcies al partner, cost de subcontractació, material, marge per partner i per relació.
- [ ] Pestanya «Economia» del hub la consumeix.
- [ ] Test del servei.

### ⬜ Fase 6 — Migració de dades dels bolos existents (AGENT script + PROPIETARI executa) · petit
- [x] **AGENT** — Script dry-run `scripts/migrate-booking-partner-service-lines.mjs` per OE-2026-005 (Lliçà): passa split de `notes` → `serviceLines` + `billedCollaboratorId`=Masquerade quan el propietari executi `--apply`. FET #904.
- [ ] **PROPIETARI** — executar dry-run i després `--apply` contra Railway quan la migració `20260608113000_booking_partner_billing_service_lines` estigui aplicada.
- [ ] Cap hardcode; via script que executa el propietari.

---

## D. Tancament del canvi (cada fase)
- [x] Entrada a `docs/admin-diary.md` (#899).
- [x] Update `docs/agent-sync.md` (bloc codex).
- [x] Incrementar `ADMIN_CHANGE_COUNTER` (ara #899).
- [x] `pnpm run qa:protocol` + `pnpm run validate:core` + `pnpm test:run` + `pnpm build` OK fins a #903. #904: `node --check` OK; dry-run bloquejat correctament per migració pendent.

## F. Repartiment de feina claude ↔ codex (no-col·lisió) — vigent

> Acordat 2026-06-08. Objectiu: que els dos agents treballin en paral·lel sense tocar els mateixos fitxers. Llegir sempre `docs/agent-sync.md` abans de començar i actualitzar el bloc propi.

| Zona / fitxers | Responsable |
|---|---|
| **Fase 3**: schema `Booking.billedCollaboratorId` + model `BookingServiceLine` + enum; `lib/services/costEngine.ts`; `bookingCreationService.ts` / `bookingRouteService.ts` (facturació XOR + service lines) | **codex** |
| **Partner Hub**: `app/admin/collaborators/[id]/**`, `lib/services/partnerHubService.ts`, `scripts/seed-partners.mjs`, enllaç a `CollaboratorsClient.tsx` | **claude** |
| **Migració a Railway + execució del seed** | **propietari** (classificador bloqueja els agents) |
| `docs/admin-diary.md` | **codex** el manté ara (claude no el força per evitar col·lisió; claude documenta a `agent-sync.md` + aquests checklists) |

**Regla anti-doble-comptabilitat (Opus, crítica):** el cost de subcontractació viu NOMÉS a `BookingServiceLine.costAmount`. `CollaboratorBooking.commissionAmount` és per a comissió/liquidació amb el partner. El motor (`computeBookingFinancialSummary`) NO ha de sumar el mateix cost per les dues vies. Cobrir-ho amb test.

**Invariant de facturació:** un `Booking` té `customerId` **XOR** `billedCollaboratorId`, mai els dos. Validació centralitzada al servei de bookings, no constraint de BD.

## E. Avisos
- Migracions a Railway = **només propietari** (classificador bloqueja l'agent).
- No personalitzar Rufo/Tino/Carlos/Tronios/DJ Mania al codi: són **dades**.
- No barrejar els tres conceptes: `sourceCollaboratorId` (porta-bolos) ≠ `CollaboratorBooking` (contractat) ≠ `BookingServiceLine` (línia del bolo).
- `next dev` està aturat (s'han matat els node per resoldre l'EPERM de Prisma). Reaixecar amb `pnpm dev`.

---
## Fase 7 — Productes/serveis FORA DE PACK (disseny Opus 2026-06-08) — EN CURS
Cas real: Cristina Rey ens contracta animació+pintacares (de Masquerade, +20%) + DJ 1h (100€) + tècnic (40€, opcional). Cap a packs.

### ✅ FET i validat (tsc + 52 tests)
- `lib/constants/orbita-services.ts`: serveis propis (DJ/h 100€, tècnic 40€ opcional) com a dades.
- FIX `bookingCreationService.ts`: subtotal SUMA pack+hores+extres+línies (abans descartava el pack si hi havia línies).
- FIX `useNewBookingSubmit.ts`: accepta `serviceLines` explícites → DIRECT_CLIENT (Cristina) ja pot tenir línies (abans buildServiceLines les descartava).
- `BookingServiceLinesSection.tsx` (editor: servei Òrbita / producte partner del catàleg amb cost+PVP auto / línia lliure) + ruta `GET /api/admin/collaborator-products` + CSS responsiu a nb-design.css.
- `useBookingPricing.ts`: total i marge en viu sumen serviceLinesRevenue/Cost (marge pel patró del hook, no inline).

### ✅ FET addicional (2026-06-08)
- Contracte PDF (contractService + contractPdfService + i18n ca/es/en): desglossa serviceLines (només revenueAmount). 44 tests verds.
- Marge fitxa reserva: BookingMarginCard + [id]/page.tsx sumen serviceLinesCost al cost directe (desglossament «Cost serveis externs»). Bug «marge fals» resolt.

### ⬜ PENDENT
- **BookingMarginCard / fitxa reserva [id]**: el marge de la fitxa calcula inline i ignora línies (Opus). Cal passar serviceLinesRevenue/Cost al càlcul.
- **Editor de línies a la fitxa de reserva** `[id]` (afegir/editar/eliminar post-creació; el route service ja fa deleteMany+create).
- **Contracte PDF** (`contractPdfService.ts` + `contractService.ts`): desglossar serviceLines (només revenueAmount, mai cost) + i18n "Serveis".
- **/admin/packs**: secció read-only "Serveis solts d'Òrbita" (de ORBITA_SERVICES).
- **Lead hints**: mostrar `interestedExtras` del lead com a pista a l'editor (cal afegir `interestedExtras` a BookingLeadData + prefill).
- Cap migració nova (tot ja a Railway).

---
## Fase 7 — estat 2026-06-08 (pushejat fins 86e0fb40)
✅ Serveis propis (orbita-services.ts) · editor de línies a nova reserva · API collaborator-products · fix subtotal+submit (cas Cristina) · marge en viu + fitxa amb serviceLinesCost · contracte PDF desglossa línies · Partner Hub "quant li paguem" (comissions+subcontractació) · línies visibles a fitxa reserva · secció "Serveis solts" a /admin/packs · separació Responsable intern / Bolo passat per al lead.
⬜ PENDENT: editor EDITABLE de línies post-creació a la fitxa de reserva (ara lectura; PATCH ja ho suporta) · hints interestedExtras a l'editor · confirmar noms reals TEAM_MEMBERS · nexe inventari equip propi.
