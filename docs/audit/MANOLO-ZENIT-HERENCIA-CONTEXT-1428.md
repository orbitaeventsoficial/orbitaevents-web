# Manolo / Zenit — herència de context client-lead

> Canvis #1428 + #1436 · 2026-07-05 · Estat: cadena Customer Hub + reserva pública aplicada

## Veredicte Manolo

El sistema no pot presumir de Zenit si una peça sap fer PDFs, reserves o economia però no sap tornar al client i al lead que l'han originat. Això no és un detall tècnic: és pèrdua de memòria comercial.

## Regla de columna vertebral

La cadena comercial canònica és:

```
Customer
  -> Lead
  -> Dossier / Proposal / Quote
  -> Booking
  -> Invoice / Contract / Documents
  -> Post-event / Review / Referral
```

Cada punt d'entrada ha de poder reconstruir la cadena cap enrere quan la dada existeix. Entrar per una reserva, proposta, dossier, factura, tasca o document no pot deixar el sistema cec: ha de resoldre el Customer Hub o la fitxa del lead amb context.

## Contracte d'herència

- **Customer** és la memòria recurrent: historial, preferències, comunicacions, recurrència, ressenyes i valor de vida.
- **Lead** és el precontracte comercial: intenció, origen, servei desitjat, pressupost, lloc, data, idioma, urgència i configuració provisional del bolo.
- **Proposal/Dossier** és una foto comercial: ven valor i deixa prova del que s'ha ofert. Si no porta `customerId`, ha de poder tornar pel `leadId` o `bookingId`.
- **Booking** és la veritat post-reserva: execució, imports finals, calendari, serveis contractats, transport, cobrament i operació. Si no porta `leadId`, el seu `customerId` directe continua manant.
- **Invoice/Contract/Documents** no són arxius solts: són proves del flux. Si porten `customerId` o `bookingId`, han de reconnectar el client.

## Tall aplicat #1428

`lib/customer-hub/data.ts` ara resol el Customer Hub des de més portes:

- `Customer` directe, incloent client fusionat.
- `Lead` via `customerId`.
- `Booking` via `customerId` directe o fallback a `leadId`.
- `Proposal` via `customerId`, `leadId` o `bookingId`.
- `Dossier` via `leadId`.
- `Invoice` via `customerId` o `bookingId`.
- `LeadActivity`, `LeadDocument` i tasques continuen resolent via el lead o customer vinculat.

També s'ha corregit la col·lecció del Customer Hub: propostes i reserves ja no es carreguen només per `customerId`; també entren si pertanyen a un lead del client. Això evita que una proposta antiga feta abans de vincular el client desaparegui del 360.

## Tall aplicat #1436

La porta pública de reserva directa (`/[locale]/reservar` -> `/api/booking`) ja no crea una `Booking` sense memòria de client:

- `publicBookingService` normalitza nom, email i telèfon amb els helpers canònics.
- La transacció de reserva fa `customer.upsert` per `emailNormalized`.
- `booking.create` desa `customerId`.
- La mateixa transacció registra `BOOKING_CREATED` al Customer 360.

Decisió deliberada: no es crea un `Lead` retroactiu. En aquesta porta el client ja està reservant; per tant, `Booking` és la veritat post-reserva i `Customer` és la memòria recurrent. Crear un lead fictici només embrutaria la frontera lead/reserva.

## Risc si no es fa

El propietari veu un client incomplet, una proposta perduda o una reserva sense història. Comercialment això és tòxic: baixa confiança interna, fa repetir feina i converteix el 360 en una fitxa parcial.

## Validació

- Test focalitzat: `pnpm test:run -- --run __tests__/lib/customer-hub/data.test.ts`.
- Test de reserva pública: `pnpm test:run -- --run __tests__/lib/services/publicBookingService.test.ts`.
- Regressions cobertes: reserva directa amb `customerId`, reserva via `leadId`, proposta via `leadId`, proposta via `bookingId`, dossier via `leadId`, factura via `customerId`, i queries del Customer Hub per `customerId OR leadId`.

## Següent tall natural

Revisar cada PDF un a un amb aquesta regla: cap PDF ha de ser només "descarregar un arxiu". Ha de saber quin client/lead/reserva alimenta, quina decisió vol provocar i quina acció posterior obre.
