# Full de ruta — bolo canònic Lead ↔ Reserva

Data: 2026-06-13  
Context: el propietari demana que el lead i la reserva comparteixin una sola veritat de productes. El model visual que mana és Cristina: a l'esquerra el bolo, a la dreta els productes disponibles del configurador.

## Criteri de domini

- Abans de crear reserva, el lead cuina el bolo en `LeadServiceLine`.
- Quan existeix reserva vinculada, la font de veritat contractual passa a ser `Booking`.
- La fitxa del lead post-reserva no ha de tenir un mirall propi: ha de presentar la informació de `Booking` dins el mateix configurador del bolo.
- Les ampliacions o modificacions fetes des del lead post-reserva han d'escriure sobre la reserva real (`BookingServiceLine`) i recalcular totals.
- No s'han d'inventar productes ni reconstruir-los des de notes.

## Estat real detectat

### Cristina Rey

- Lead: `cmpwudznj00g3vigky4altclu`
- No té reserva vinculada.
- Té `LeadServiceLine` poblades:
  - Animació 1 personatge (Masquerade Events) — 195
  - Pintacares professional (Masquerade Events) — 85
  - DJ · hora addicional — 3 x 100
  - Micròfon Shure (Tino — lloguer de material) — 40
- Per això Cristina es veu bé: és un lead pre-reserva amb bolo viu al lead.

### Alejandro García

- Lead: `cmpyhlaox0001puw1jpc8cvad`
- Reserva: `OE-2026-004` (`cmpyif9zd0002mittudtg9tui` o verificar id real a BD abans de tocar)
- Té `Booking.pack = disco-basico / Party Starter`, total 445.
- No té `LeadServiceLine`.
- No té `BookingServiceLine`.
- Per això no es veia com Cristina: la base contractada existia com a pack de reserva, però no estava presentada dins el configurador del bolo.

## Codi ja avançat en aquesta sessió

Canvi #935 ja tancat:

- `lib/services/leadServiceLineService.ts`
  - `GET /api/admin/leads/:id/service-lines`: si el lead té reserva, retorna `BookingServiceLine`; si no, retorna `LeadServiceLine`.
  - `PUT /api/admin/leads/:id/service-lines`: si el lead té reserva, reemplaça `BookingServiceLine`; si no, reemplaça `LeadServiceLine`.
- `lib/services/bookingRouteService.ts`
  - Recalcula subtotal, IVA, total, paga i resta quan canvien `serviceLines`.
- Test focalitzat:
  - `__tests__/lib/services/bookingRouteService.test.ts` blinda el recalcul.

Canvi començat després de #936, pendent de tancar:

- `app/admin/bookings/BookingServiceLinesSection.tsx`
  - Afegida prop opcional `baseLines`.
  - Mostra una "base contractada" dins el bolo, però no l'envia com a `serviceLines`.
- `app/admin/leads/[id]/LeadBoloSection.tsx`
  - Rep `contractedProducts`.
  - Converteix `PACK`, `EXTRA`, `EXTRA_HOURS` a `baseLines`.
  - Calcula economia visual amb `baseLines + lines`.
  - Desa només `lines` editables per evitar duplicar pack/extres.
- `app/admin/leads/[id]/LeadDetailClient.tsx`
  - Passa `lead.booking?.contractedProducts ?? []` a `LeadBoloSection`.

Aquest codi encara no està validat ni documentat com a canvi formal. Abans de continuar, revisar diffs i compilar.

## Següent pas executable

1. Revisar el diff parcial:
   - `app/admin/bookings/BookingServiceLinesSection.tsx`
   - `app/admin/leads/[id]/LeadBoloSection.tsx`
   - `app/admin/leads/[id]/LeadDetailClient.tsx`

2. Ajustar el component visual:
   - La base contractada ha de sortir dins l'esquerra del bolo, per sobre de les línies editables.
   - Ha de ser compacta i clara:
     - `Party Starter · discomovil`
     - `250€`
     - estat `contractat`
   - La dreta ha de continuar mostrant productes disponibles per ampliar.

3. Decidir si es retira o es compacta el panell lateral `Productes contractats`.
   - Recomanació: si la base ja viu dins el configurador, el panell lateral hauria de desaparèixer o quedar només com a resum de reserva/cobraments. Evitar doble lectura.

4. Validar Alejandro:
   - Obrir `/admin/leads/cmpyhlaox0001puw1jpc8cvad`.
   - Ha de veure's com Cristina:
     - esquerra: base contractada `Party Starter`
     - dreta: catàleg disponible
     - possibilitat d'afegir línies
   - Afegir una línia de prova només en entorn segur o amb acord del propietari; no tocar producció sense permís.

5. Validar Cristina:
   - Obrir `/admin/leads/cmpwudznj00g3vigky4altclu`.
   - No ha de canviar el comportament:
     - continua llegint `LeadServiceLine`
     - continua mostrant productes disponibles
     - no apareix cap base contractada perquè no té reserva.

6. Validacions tècniques:
   - `npx tsc --noEmit --pretty false`
   - `node_modules\.bin\vitest.cmd run __tests__\lib\services\bookingRouteService.test.ts`
   - `pnpm run qa:protocol`
   - `pnpm run validate:core`
   - `git diff --check`

7. Registrar com a nou canvi formal només quan estigui validat:
   - probablement `#937`, perquè Claude ja ha tancat `#936`.
   - Actualitzar `ADMIN_CHANGE_COUNTER`.
   - Afegir entrada a `docs/admin-diary.md`.
   - Afegir entrada a `docs/admin-protocol.md` §6.6, §6.7 i §9.
   - Actualitzar `docs/agent-sync.md`.

## Regla a no trencar

No convertir el pack de reserva en una `BookingServiceLine` només per fer-lo visible. Això duplicaria imports o faria que el pack i les línies representessin el mateix producte dues vegades.

La representació correcta és:

- `Booking.pack`, `Booking.extras`, `Booking.extraHours` = base contractada no editable dins el bolo.
- `BookingServiceLine` = ampliacions/editables post-reserva.
- `LeadServiceLine` = només estat pre-reserva.
