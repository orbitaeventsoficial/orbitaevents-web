# Calendari de LEADS / Agenda — poliment visual pendent (validació del propietari)

> ⚠️ ZONA EXACTA: quan el propietari diu «calendari» SEMPRE es refereix al **calendari de leads** = `app/admin/leads/LeadsSeasonClient.tsx` + `app/admin/leads/leads-design.css` (vista calendari de caps de setmana de l'Agenda). NO és `/admin/calendario`.
>
> Peticions del propietari 2026-06-08. Fixos a fer amb el **dev viu** i validar **visualment** (no a cegues). Diagnòstic tècnic fet per accelerar.
>
> NOTA: la marca `TANCAT CHARLIE` s'havia posat per error a `/admin/calendario/Calendar*Client.tsx`; el que el propietari ha validat és el calendari de LEADS → moure la marca a `LeadsSeasonClient.tsx`.

## 1. Color daurat per confirmats + color independent si barreja
**Símptoma**: dissabte 11 juliol amb 2 bolos confirmats surt VERD; els confirmats haurien de ser DAURATS. Si el dia barreja confirmat + no-confirmat → color independent (no verd ni daurat).
**Causa (a localitzar a `LeadsSeasonClient.tsx`/`leads-design.css`)**: la targeta/dia del calendari de leads pinta el color sense distingir l'estat del bolo. ⚠️ El `getCalendarTone` de `/admin/calendario/calendar-utils.ts` és d'una ALTRA pàgina — NO és aquesta; cal trobar la lògica equivalent dins `LeadsSeasonClient` (data-attrs `data-status`/`data-stage` + regles a `leads-design.css`).
**Solució proposada**:
- Afegir un eix d'estat: a partir de `reservas[].estado` (CONFIRMED/PENDING/…) i `leads[].status` (WON/…), derivar `confirmed | partial | pending`.
- Nous tons: `confirmed` (daurat) i `partial` (color independent).
- Crear classes `admin-tone-soft-gold`/`-border-gold`/`-text-gold` a `admin-theme.css` consumint el token `--gold`/`--ax-gold` (ja existeix; el protocol prohibeix inventar hex).
- Aplicar a mes/setmana/dia + reinici del dev (CSS).
**DECISIÓ DE NEGOCI PENDENT**: què compta com a «daurat/confirmat»? (`reserva.estado=CONFIRMED`? `lead.status=WON`? tots dos?) I quin color exacte per «barreja».

## 2. Import (€) que queda a sota → en línia, responsiu (no hardcoded) — ✅✅ FET I VALIDAT (recaptura 2026-06-08: dia 12 juny mostra «12 340 €» en línia)
**Símptoma**: divendres 12 juny, l'import (€) fa wrap a la línia de sota de la targeta.
**Causa REAL (confirmada amb captura `.codex-captures/cal-leads-desktop.png`)**: l'import es renderitza a `LeadsSeasonClient.tsx` L187 com `<span className="fx__cval">{euro(firstLead.value)}</span>` dins `.fx__celltop` (flex). La classe `.fx__cval` (leads-design.css L534) **NO tenia `white-space: nowrap`**, així que «340 €» es partia entre el número i el `€`.
**FIX APLICAT** (leads-design.css L534): afegit `white-space: nowrap; flex: none; font-variant-numeric: tabular-nums;` a `.fx__cval`. Responsiu, sense width fix, monocapa CSS.
**PENDENT**: Next NO hot-recarrega CSS → cal `Get-Process node | Stop-Process -Force` + esborrar `.next` + `pnpm dev`, després recapturar (`node .dbg-cal-leads.cjs`) i validar visualment que «340 €» queda en línia a 375px/tablet/desktop.

## 3. Targetes del mateix dia comparteixen color (Cristina Rey vs Adrià) — ✅ FET (opció a: color per identitat)
**Implementat**: `leadHue(id)` (LeadsSeasonClient L102) → `style={{'--bolo-hue'}}` a `.fx__cellpart` (inline, runtime) + `border-left: 3px solid hsl(var(--bolo-hue) 55% 58%)` a leads-design.css L510. Cada bolo té accent lateral propi i estable. Recapturat 2026-06-08.
**Pendent**: validació visual fina del propietari (contrast dels hues vs estats).

### (històric de la decisió)
**Símptoma**: dos bolos el mateix dia (Cristina 18:00, Adrià 22:00) tenen el mateix color de targeta; haurien de distingir-se.
**Decisió de disseny PENDENT**: per què es distingeixen els colors? Opcions:
- (a) per estat del bolo (confirmat/pendent) — lliga amb #1.
- (b) per tipus d'event (`eventType`).
- (c) color estable per identitat (hash de l'id / partner) per distingir bolos solapats.
Definir la regla abans d'implementar; després assignar la classe/token per targeta a la vista corresponent.

---
## ▶ PER A LA PRÒXIMA SESSIÓ DE CLAUDE — estat exacte

**Marca TANCAT CHARLIE**: posada correctament a `app/admin/leads/LeadsSeasonClient.tsx` (capçalera). Treta de `/admin/calendario/Calendar*Client.tsx` (estaven mal posades).

**Captura de referència**: `.codex-captures/cal-leads-desktop.png` (dev a `localhost:3000`, auth Basic `orbita`/`.env`). Script: `node .dbg-cal-leads.cjs` (desktop 1440 + mobile 390).

**Estat dels 3 fixos**:
1. ⬜ Barra daurada per confirmats — BLOQUEJAT per decisió de negoci (quins estats = daurat). La barra és `.fx__dot[data-stage]` (LeadsSeasonClient L191) + regles a leads-design.css per `data-stage`/`data-pay`. La paleta daurada hauria de consumir `--gold`/`--ax-gold` (no inventar hex).
2. ✅ € en línia — FIX APLICAT a `.fx__cval` (L534). **Falta reinici dev + recaptura per validar.**
3. ⬜ Cristina/Adrià mateix color — la cel·la multi-bolo (`.fx__cell--multi`, L206; parts a `.fx__multiparts` L213). Ara coloregen per `data-stage` (estat), per això dos WON surten igual. Decisió pendent: distingir per identitat o només per solapament.

**PRIMER PAS recomanat**: reiniciar dev (matar node + esborrar `.next` + `pnpm dev`), recapturar, validar el fix #2 del €. Després demanar al propietari les 2 decisions de disseny (#1 i #3) i fer-les una a una amb recaptura.

**Avís**: no s'ha fet commit d'aquests canvis de poliment (fix #2 CSS + marca TANCAT CHARLIE + docs). El push anterior (`1ccb4b9b`) NO els inclou.

---
**Nota de procés**: les tres són zona `TANCAT CHARLIE`. Fer-les amb dev viu, una a una, validació visual del propietari abans de tancar cadascuna. Reinici de servidor obligatori per a canvis CSS.

---
## BUG flux Lead→Reserva (Vilanova) — diagnòstic per a l'altra sessió
1. **Pressupost no s'arrossega** — CONFIRMAT: `app/admin/bookings/useNewBookingInitialData.ts` (L107-120) NO mapeja `lead.budget`. Cal afegir-lo; com que `manualTotalPrice`/`customPackPrice` viuen en state propi de `NewBookingForm` (no a `form`), cal passar `budget` via `setLeadData`/prop i pre-omplir el preu acordat. Usar `parseBudgetValue` (a leads/[id]/page.tsx) perquè budget és string.
2. **Hora** — el prefill SÍ mapeja `eventStartTime/eventEndTime` i l'API els retorna; si no van venir és perquè el lead no els tenia. Verificar amb el lead de Vilanova concret.
3. **Preu acordat (manualTotalPrice)** — existeix a `NewBookingForm.tsx` L53 + es passa a un component fill (`onManualTotalPriceChange`); comprovar si està condicionat a pack seleccionat i, si cal, fer-lo sempre editable.
