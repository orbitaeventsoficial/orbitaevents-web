# Handoff bug Kimera — total 300 sense IVA torna a 350,90

Data: 2026-06-02  
Reserva: `cmpv6tehp0002mittudtg9tui`  
Referència: `OE-2026-003`  
Propietari de continuació: Claude

---

## Resum executiu

El propietari informa que ahir va canviar diverses vegades la reserva Kimera a `300` sense IVA i sense factura, però la fitxa continua mostrant `350,90`.

La BD actual confirma una inconsistència:

- `invoiceRequired = false`
- `paymentMethod = CASH`
- `cashAmount = 300`
- `subtotal = 290`
- `vatRate = 21`
- `vatAmount = 60.90`
- `total = 350.90`
- `depositAmount = 105`
- `remainingAmount = 245.90`

El problema no és només visual. El registre persisteix dades contradictòries.

---

## Evidència BD actual

Reserva:

- `id`: `cmpv6tehp0002mittudtg9tui`
- `reference`: `OE-2026-003`
- `clientName`: `Kimera`
- `status`: `PENDING`
- `invoiceRequired`: `false`
- `paymentMethod`: `CASH`
- `cashAmount`: `300`
- `vatRate`: `21`
- `vatAmount`: `60.90`
- `total`: `350.90`

Context de preu:

- Pack `disco-basico`: `250`
- Desplaçament carregat: `40`
- `subtotal`: `290`
- IVA 21% sobre `290`: `60.90`
- Total final: `350.90`

---

## Historial adminLog rellevant

Consulta feta a `adminLog` per `entityId = cmpv6tehp0002mittudtg9tui`.

1. `2026-06-01T12:31:10.321Z` — `CREATE`
   - `total: 350.9`

2. `2026-06-01T21:18:23.807Z` — `UPDATE`
   - `changes: ["paymentMethod"]`

3. `2026-06-01T21:18:23.847Z` i `2026-06-01T21:18:23.849Z` — `UPDATE`
   - `changes: ["invoiceRequired"]`

4. `2026-06-01T21:57:48.246Z` i `2026-06-01T21:57:53.233Z` — `UPDATE`
   - `changes: ["cashAmount"]`

5. `2026-06-01T23:05:37.xxxZ` — 6 updates consecutius
   - `changes: ["total"]`

6. `2026-06-02T15:38:15.759Z`, `15:39:10.045Z`, `15:58:52.469Z` — updates de transport
   - `changes: ["distanceKm","fuelCostPerKm","travelCost","subtotal","vatAmount","total","depositAmount","remainingAmount"]`

Lectura: el propietari sí va tocar total/cash/invoiceRequired. Després, una actualització de transport ha recalculat `vatAmount`, `total`, `depositAmount` i `remainingAmount`, conservant `vatRate=21`.

---

## Causa probable en codi

### 1. PATCH no recalcula quan canvia `invoiceRequired`

Fitxer: `lib/services/bookingRouteService.ts`

`prepareBookingPatchData(...)` accepta `invoiceRequired`, però només recalcula imports si hi ha camps de transport:

```ts
const travelFieldTouched =
  hasOwn(body, 'distanceKm') ||
  hasOwn(body, 'fuelCostPerKm') ||
  hasOwn(body, 'travelCost');

if (travelFieldTouched) {
  // recalcula subtotal/vatAmount/total/deposit/remaining
}
```

Per tant, canviar `invoiceRequired=false` no posa automàticament:

- `vatRate = 0`
- `vatAmount = 0`
- `total = baseAfterDiscount`
- `depositAmount = calcDeposit(total)`
- `remainingAmount = total - depositAmount`

### 2. El recàlcul de transport usa el `vatRate` antic

En el mateix fitxer:

```ts
const vatRate = typeof body.vatRate === 'number'
  ? body.vatRate
  : existing.vatRate || VAT_RATE_INVOICE;
```

Aquesta reserva ja tenia `existing.vatRate = 21`, així que qualsevol actualització de transport torna a calcular amb IVA 21 encara que `invoiceRequired=false`.

### 3. `totalPrice` manual només escriu `total`

Fitxer: `lib/services/bookingRouteService.ts`

```ts
if (typeof body.totalPrice === 'number') body.total = body.totalPrice;
delete body.totalPrice;
```

Això deixa desquadrats `subtotal`, `vatRate`, `vatAmount`, `depositAmount` i `remainingAmount` si l'usuari edita el total a mà.

### 4. `BookingTotalEditor` només envia `totalPrice`

Fitxer: `app/admin/bookings/[id]/BookingTotalEditor.tsx`

```ts
body: JSON.stringify({ totalPrice: newTotal })
```

Efecte: la UI permet canviar el total, però el backend no converteix aquesta edició en un estat econòmic coherent.

---

## Criteri de fix recomanat

### Regla canònica

En reserves admin:

- Si `invoiceRequired=false`, llavors `vatRate=0`, `vatAmount=0`.
- Si `invoiceRequired=true`, llavors `vatRate=VAT_RATE_INVOICE`.
- `total`, `depositAmount` i `remainingAmount` sempre s'han de recalcular junts quan canvia qualsevol camp econòmic.
- Si l'usuari modifica manualment el preu final pactat, el pack deixa de ser la font de veritat econòmica del total. El pack pot continuar com a descriptor de servei/equip base, però no pot tornar a recalcular el preu automàticament.

### Camps que han de disparar recàlcul econòmic

- `invoiceRequired`
- `vatRate`
- `totalPrice`
- `distanceKm`
- `fuelCostPerKm`
- `travelCost`
- `discount`
- `depositAmount`
- `remainingAmount`
- `cashAmount`
- possibles futurs: pack, extres, hores extra

### Cas especial `totalPrice`

Decidir una de dues opcions:

1. **Total manual és total final**.
   - Si `invoiceRequired=false`, guardar `subtotal=totalPrice`, `vatRate=0`, `vatAmount=0`, `total=totalPrice`.
   - Recalcular `depositAmount` i `remainingAmount`.
   - Marcar explícitament la reserva com a preu manual/pactat perquè futurs recàlculs de transport, pack o IVA no la tornin a portar al preu del pack.

2. **Total manual és preu pactat base**.
   - Llavors no s'hauria d'anomenar `totalPrice`; hauria de ser `customPackPrice` o `agreedBasePrice`.
   - Si `invoiceRequired=true`, sumar IVA sobre aquesta base.

Per Kimera, la intenció del propietari és clara: `300` és total final sense IVA/sense factura.

### Pack assignat vs preu manual

Pregunta del propietari: "si modifico el preu, s'hauria de desassignar el pack prèviament assignat no?"

Criteri recomanat:

- No desassignar automàticament el `packId`, perquè el pack encara descriu què s'ha de prestar: tipus de servei, hores incloses, material base, extres disponibles i logística.
- Sí desassignar el pack com a **font de preu**. És a dir, cal un camp/estat explícit del tipus:
  - `pricingMode = PACK | MANUAL`
  - o `customPackPrice`
  - o `manualTotalOverride`
- Quan `pricingMode=MANUAL`, cap recàlcul posterior de transport, IVA o pack ha de sobrescriure `total` sense una acció explícita de l'usuari.
- La UI hauria de mostrar-ho com: `Pack: Bàsic` + `Preu pactat manual: 300 €`, no com si el pack Bàsic costés realment 300 €.

Si no volem tocar schema ara, solució curta:

- Usar el `totalPrice` manual com a override persistent de total.
- En `prepareBookingPatchData`, si `totalPrice` arriba, recalcular només `vat/deposit/remaining` segons `invoiceRequired`, i evitar que posteriors canvis de transport reescriguin `total` mentre `cashAmount` o un futur camp manual indiqui preu pactat.

Solució bona:

- Afegir camp explícit de preu pactat/manual al model `Booking` i migració.
- Separar clarament:
  - `packId`: servei contractat
  - `packBasePrice`: preu tarifari del pack en aquell moment
  - `manualTotalOverride` o `agreedTotal`: preu pactat final
  - `invoiceRequired/vatRate/vatAmount`: fiscalitat derivada

### Reflexions de comportament del preu pactat

1. **El preu pactat preval per sobre de tots els càlculs automàtics.**
   - Si l'usuari escriu `300`, aquest és el total final de negoci mentre no el canviï explícitament.
   - Ni pack, ni extres, ni transport, ni IVA, ni recàlculs de distància poden tornar-lo a `350,90`.

2. **El pack queda com a plantilla operativa, no com a motor de preu.**
   - Serveix per saber què s'ha de portar i quines hores/serveis inclou.
   - No governa el `total` quan hi ha preu pactat.

3. **Tots els percentatges de benefici es recalculen sobre el preu pactat.**
   - Marge net = `preuPactat - costDirecte`.
   - Percentatge marge = `margeNet / preuPactat`.
   - Els costos continuen venint de pack/inventari/extres/transport, però l'ingrés és el preu pactat.

4. **Alertes obligatòries si el preu pactat és perillós.**
   - Si marge net < 0: alerta crítica "Perdem diners".
   - Si marge % < objectiu configurat: alerta warning "Marge sota objectiu".
   - Si preu pactat < cost directe estimat: bloqueig suau o confirmació explícita abans de desar.

5. **La UI ha d'explicar el motiu del risc, no només pintar vermell.**
   - Exemple: `Preu pactat 300 € · cost estimat 318 € · marge -18 €`.
   - Exemple: `Objectiu marge 35%; marge actual 22%`.
   - El propietari ha de saber què provoca el risc: transport, inventari, hores, extres o pack base.

6. **Els cobraments es deriven del preu pactat.**
   - Senyal/resta es recalculen sobre `agreedTotal`.
   - Si ja hi ha pagaments registrats, recalcular només la resta pendent i avisar que el total ha canviat amb pagaments existents.

7. **Canviar fiscalitat no pot canviar silenciosament el pacte comercial.**
   - Si `invoiceRequired=false`, `agreedTotal` és total final sense IVA.
   - Si l'usuari activa factura, cal decidir UI:
     - o bé `agreedTotal` continua sent total final amb IVA inclòs i es desglossa base/IVA cap enrere,
     - o bé s'avisa que afegir factura sumarà IVA i canviarà total.
   - No pot passar en silenci.

---

## Fix de dades per Kimera després del codi

Quan el codi estigui arreglat, la reserva Kimera hauria de quedar així:

- `invoiceRequired=false`
- `paymentMethod=CASH`
- `cashAmount=300`
- `vatRate=0`
- `vatAmount=0`
- `total=300`
- `depositAmount=90` si es manté senyal 30%
- `remainingAmount=210` si no hi ha pagaments

Punt a decidir amb el propietari: si en efectiu `300` significa total complet, o si `cashAmount=300` significa import cobrat/previst independent del total.

---

## Tests recomanats

Afegir tests a `bookingRouteService`:

1. `invoiceRequired=false` sobre reserva amb `vatRate=21` recalcula a IVA 0.
2. Canviar `distanceKm` en una reserva `invoiceRequired=false` no torna a aplicar IVA 21.
3. `totalPrice=300` amb `invoiceRequired=false` deixa `total=300`, `vatAmount=0`, `depositAmount=90`, `remainingAmount=210`.
4. `invoiceRequired=true` reaplica `VAT_RATE_INVOICE` i recalcula imports.
5. Una reserva amb preu manual/pactat no torna a calcular el total des del `pack.price` quan es modifica transport.
6. El `packId` es manté com a descriptor de servei encara que el preu sigui manual.

També seria útil un test de component per `BookingTotalEditor` només si es decideix canviar el payload.

---

## Fitxers implicats

- `lib/services/bookingRouteService.ts`
- `app/api/admin/bookings/[id]/route.ts`
- `app/admin/bookings/[id]/BookingTotalEditor.tsx`
- `app/admin/bookings/[id]/page.tsx`
- `app/admin/bookings/useBookingPricing.ts`
- `lib/constants/pricing.ts`

---

## Nota de coordinació

Codex no ha aplicat el fix per no trepitjar la continuació que farà Claude. Aquest document deixa la causa, la reproducció i el criteri esperat.
