# Partners Platform — Handoff i pla d'implantació

Data origen: 2026-06-07 · Revisat: 2026-06-08 (Claude)
Canvi admin base: #898 (codex, al working tree, sense commit)
Objectiu: convertir proveïdors, col·laboradors i fonts de bolos en una plataforma única de gestió de partners, escalable.

> **Estat**: el fonament (#898) està al codi local però **la plataforma encara no és operativa**. Llegeix primer el §Bloqueig.

---

## ⛔ Bloqueig que cal resoldre PRIMER (propietari)

La migració `prisma/migrations/20260607193000_partner_roles_and_sources/migration.sql` està **creada però NO desplegada** a la BD.

Però el codi del #898 **ja llegeix les columnes noves**: `lib/services/leadRouteService.ts` fa `select: { sourceCollaborator: ... }` i el schema declara `roles`, `Lead.sourceCollaboratorId`, `Booking.sourceCollaboratorId`. Mentre les columnes no existeixin a la BD real, **les queries de fitxa de lead i de partners llançaran error a runtime** (la home pot respondre 200, però les pantalles admin afectades no).

**Acció (només propietari — escriure a Railway està bloquejat per a l'agent):**

```
npx prisma migrate deploy
npx prisma generate
```

Després, verificar al navegador `/admin/leads/[id]` i `/admin/collaborators` sense error 500. Fins que això no estigui fet, no té sentit construir el Partner Hub a sobre.

---

## Resum executiu (decisió de negoci — NO reobrir)

El negoci no necessita dues bases separades de «proveïdors» i «col·laboradors». Necessita una base única de **partners**, on cada empresa o persona pot tenir diversos rols segons el cas. El mateix Carlos / Masquerade pot contractar Òrbita com a tècnic o DJ, pot vendre un bingo on Òrbita hi participa, o pot ser contractat per Òrbita per portar un pintacares, un mag o una animació. Rufo pot passar bolos. Tino pot llogar material i també passar bolos. Tronios i DJ Mania poden ser només proveïdors de material.

Decisió de producte:

- `Customer` continua sent el client econòmic o final del bolo.
- `Collaborator` passa a ser la base de partners del negoci.
- Els rols del partner són **acumulables**, no excloents.
- La relació comercial és **del bolo**, no només del contacte.
- Cal separar **qui porta el bolo** de **qui és contractat** com a proveïdor.
- Cal separar serveis propis d'Òrbita: **DJ i tècnic de so són línies diferents**.

## Model mental — rols del partner

- `PROVIDER`: proveïdor o servei extern.
- `REFERRER`: porta bolos a Òrbita.
- `EQUIPMENT_RENTAL`: lloguer o venda de material.
- `CLIENT_PARTNER`: contracta Òrbita com a partner, tècnic, DJ o suport.
- `CREW`: equip extern, tècnic, DJ o reforç.

Aquest model evita duplicats: no cal «Carlos client» i «Carlos proveïdor»; es crea un sol partner amb rols, i cada lead o reserva diu quina relació comercial aplica.

## Tres conceptes que NO s'han de barrejar

| Concepte | Significat | Exemple |
|---|---|---|
| `sourceCollaboratorId` (a `Lead`/`Booking`) | **Qui ha passat aquest bolo** | DJ Rufo passa Sant Joan a Òrbita |
| `CollaboratorBooking` | **Qui està contractat dins aquesta reserva** (costos, comissions, subcontractació) | Òrbita contracta Masquerade per un pintacares |
| `CollaboratorProduct` | **Catàleg** de productes/serveis/material del partner | Tronios amb cabines, fum, altaveus |

Són complementaris.

## Exemples reals (són DADES, mai casos especials de codi)

- **Carlos / Masquerade**: pot contractar Òrbita com a tècnic, com a DJ o tots dos en un bolo; Òrbita pot contractar Carlos per bingo/animador/mag/pintacares. Rols: `PROVIDER`, `CLIENT_PARTNER`, `REFERRER`, potser `CREW`.
- **Bolo Masquerade 2026-06-12** (`OE-2026-005`, Lliçà de Munt, 19:30–23:30, 340 €): Òrbita va com a tècnic de so per una animació i després fa 3 h de DJ → 300 € DJ + 40 € tècnic. Justifica separar línies DJ i tècnic.
- **DJ Rufo**: passa bolos (Sant Joan ve d'ell). Rol: `REFERRER`.
- **Tino**: Òrbita li lloga material i també pot passar bolos. Rols: `EQUIPMENT_RENTAL`, `REFERRER`, potser `PROVIDER`.
- **Tronios**: proveïdor de material de música. Rols: `PROVIDER`, `EQUIPMENT_RENTAL`.
- **DJ Mania**: proveïdor d'altaveus i material electrònic. Rols: `PROVIDER`, `EQUIPMENT_RENTAL`.

---

## Què ja està fet al #898 (working tree, sense commit) — verificat per Claude

Schema (`prisma/schema.prisma`):
- `Collaborator.roles String[] @default([])` (línia ~1801)
- `Lead.sourceCollaboratorId` + relació `LeadSourceCollaborator` + `@@index` (~448, 493)
- `Booking.sourceCollaboratorId` + relació `BookingSourceCollaborator` + `@@index` (~718, 818)
- `Collaborator.sourcedLeads` / `sourcedBookings` (~1810)

Serveis i API:
- `leadRouteService.ts`: ja selecciona `sourceCollaborator` i accepta el camp al PATCH (`app/api/admin/leads/[id]/route.ts`).
- `bookingCreationService.ts`: hereta `sourceCollaboratorId` del lead vinculat; `manualTotalPrice` desa el total pactat exacte.
- `collaboratorAdminService.ts`: `listAdminCollaborators`, `getAdminCollaborator`, create/update/delete (amb rols).

UI:
- `/admin/collaborators` presentat com a «Partners», formulari amb rols acumulables, badges, KPI de bolos passats.
- Nova reserva: secció «Relació comercial» (direcció comercial, partner relacionat, «Bolo passat per», separació import DJ/tècnic, preu final manual que guanya sobre el càlcul).
- Agenda de leads: un dia pot mostrar diversos bolos (cas 2026-07-11 amb Adrià 22:00 i Cristina Rey 18:00, tots dos `WON`).

---

## Pla d'implantació restant — ordenat per dependències

### Fase 0 — Desbloqueig (propietari) · PREREQUISIT DE TOT
- [ ] `npx prisma migrate deploy` + `npx prisma generate` (vegeu §Bloqueig).
- [ ] Verificar `/admin/leads/[id]` i `/admin/collaborators` sense 500.
- [ ] Decidir commit del #898 (ara és working tree net de codex).

### Fase 1 — Selector «Bolo passat per» a la fitxa de lead (Claude) · petit
- Depèn de: Fase 0.
- L'API ja accepta `sourceCollaboratorId`; falta només el selector a la UI de detall/edició del lead.
- Llistar partners amb rol `REFERRER` (no hardcodejar noms). Empty state si no n'hi ha.
- Test: el PATCH amb `sourceCollaboratorId` desa i es mostra.

### Fase 2 — Partner Hub `/admin/collaborators/[id]` (Claude) · gros, alt valor
- Depèn de: Fase 0. NO necessita migració nova (usa camps i relacions existents).
- Plataforma operativa tipus Customer Hub (`fetchCustomerHub` com a referència de patró), **no decorativa**: historial, diners, relacions, productes, notes i accions.
- Pestanyes: **Resum · Bolos que ens passa** (via `sourcedLeads`/`sourcedBookings`) **· Bolos on el contractem** (via `CollaboratorBooking`) **· Material i catàleg** (`CollaboratorProduct`) **· Economia · Notes i contactes**.
- Servei únic `fetchPartnerHub(id)` com a font de veritat (paral·lel a `fetchCustomerHub`).

### Fase 3 — Línies de servei estructurades (Claude + propietari per migració) · mitjà
- Avui la relació comercial DJ/tècnic va parcialment a `Booking.notes` (acceptable com a pas intermedi, no com a model final).
- Model final recomanat: **`BookingServiceLine`**
  - `id`, `bookingId` (FK), `sortOrder Int`
  - `partyType String?` (p. ex. «animació», «festa»)
  - `collaboratorId String?` (FK opcional al partner contractat)
  - `kind String` (p. ex. `DJ`, `SOUND_TECH`, `PROVIDER_SERVICE`, `EQUIPMENT`)
  - `label String`
  - `revenueAmount Decimal?`, `costAmount Decimal?`
  - `quantity Int?`, `hours Decimal?`
  - `notes String?`
- Requereix nova migració → desplegament de **propietari**. El càlcul de marge ha de passar per `computeBookingFinancialSummary()` (no inline).

### Fase 4 — Seed inicial de partners (propietari executa) · petit
- Normalitzar Carlos/Masquerade, DJ Rufo, Tino, Tronios, DJ Mania **com a dades** (script seed, no hardcode en components). El propietari l'executa contra Railway.

### Fase 5 — Analítica de partners (Claude) · mitjà
- Depèn de: Fases 2–3.
- Mètriques: bolos passats per partner; import facturat gràcies al partner; costos de subcontractació; material llogat/comprat; marge per partner i per tipus de relació.
- Reaprofitar el patró d'`executiveReportService` (agregació pura + servei) en comptes de queries soltes a la UI.

---

## Regles per a qui implementi (de codex, mantingudes)

- No separis proveïdors i col·laboradors en dues bases: el model escalable és **una base única de partners amb rols**.
- No facis codi especial per Rufo, Tino, Carlos, Tronios o DJ Mania: són exemples de **dades**.
- No confonguis `sourceCollaboratorId` amb `CollaboratorBooking` (vegeu taula §Tres conceptes).
- No amaguis DJ i tècnic dins un sol camp genèric: el negoci els vol separats.
- El hub ha de ser **operatiu**, no decoratiu.
- Mantingues `Customer` per a clients i `Collaborator` per a partners externs.

## Validació feta al #898

- `npx prisma generate` OK · `npx tsc --noEmit --pretty false` OK.
- Focused tests booking + collaborators: 72 OK.
- `pnpm run qa:protocol` OK (current #898).
- Servidor local respon 200 (home; pendent verificar pantalles admin afectades després de desplegar la migració).

## Estat final abans de pausa

Data pausa: 2026-06-08.
Propietari del tall: Codex.

Estat real:

- La base tècnica està implantada localment.
- La migració `20260607193000_partner_roles_and_sources` existeix, però no està desplegada.
- El servidor local va respondre correctament a `http://127.0.0.1:3000` amb status 200 després del tall.
- TypeScript, tests focalitzats i `qa:protocol` van quedar en verd.
- No s'ha fet commit ni push.
- El working tree continua brut amb canvis del tall #898 i canvis aliens de tooling Claude (`CLAUDE.md`, `.claude/`, `scripts/hooks/`). No revertir aquests canvis aliens.
- En el `git status` final també apareixen no rastrejats `lib/services/partnerHubService.ts` i `__tests__/lib/services/partnerHubService.test.ts`. Tractar-los com a possible feina concurrent/no validada abans de continuar; no assumir que el Partner Hub ja està acabat només per aquests fitxers.

Revisió recomanada demà:

- `/admin/leads`: validar dies amb múltiples bolos, especialment 2026-07-11.
- `/admin/bookings/new`: validar relació comercial, "Bolo passat per", DJ Òrbita, tècnic Òrbita i total final acordat.
- `/admin/collaborators`: validar pantalla Partners amb rols acumulables.

Encara no acabat:

- Partner Hub detallat a `/admin/collaborators/[id]`.
- Selector visible de "Bolo passat per" a la fitxa completa de lead.
- Model `BookingServiceLine`; ara la relació comercial ampliada queda parcialment com a nota estructurada.
- Seed/normalització de Rufo, Tino, Tronios, DJ Mania i Carlos/Masquerade com a dades de partner.

Ordre recomanat per continuar:

1. Revalidar `npx tsc --noEmit --pretty false`, tests focalitzats i `pnpm run qa:protocol`.
2. Aplicar la migració a l'entorn necessari.
3. Crear o normalitzar dades inicials de partners.
4. Afegir selector de partner origen al detall de lead.
5. Construir el Partner Hub operatiu.
6. Només després, valorar si cal model `BookingServiceLine`.
