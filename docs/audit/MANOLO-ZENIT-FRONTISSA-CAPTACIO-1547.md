# Manolo Zenit #1547 - Frontissa captacio publica -> API -> admin

Data: 2026-07-06
Autor: codex
Tipus: auditoria vertical executable, sense canvi runtime
Documents rectors: `MANOLO-ZENIT-FULL-DE-TREBALL-1545.md`, `MANOLO-ZENIT-ANALISI-MASTER-ATLES-1546.md`, `ATLES-FUNCIONAL.md`, `admin-organisme-atles.md`, `TESI-MAQUINA-full-de-ruta-2026-07.md`, `TESI-ZENIT-MAQUINA-ORBITA-2026-07-04.md`

## 0. Veredicte curt

La primera frontissa real de negoci existeix i esta parcialment ben cablejada, pero no es zenit:

1. El contacte/configurador pot dir "ok" al client encara que no hi hagi cap `Lead` guardat.
2. El formulari de contacte demana `location`, pero la ruta publica la descarta abans d'arribar a `Lead.eventLocation`.
3. El contacte/configurador no envien el `locale` de pagina de manera explicita; depenen del navegador.
4. La resposta publica de contacte retorna una referencia artificial `OE-*`, no l'id real de `Lead`.
5. La reserva publica crea `Booking` + `Availability BOOKED` directament, sense `Lead` ni `ServiceLine` vertebral.
6. La reserva publica mostra un total sense IVA al formulari, pero el servei desa total amb IVA 21%.

La conclusio Manolo: el flux no s'ha de refer sencer encara. Primer cal cosir la veritat d'entrada: si el client envia una captacio, o queda a admin amb dades completes i referencia real, o el sistema no pot prometre exit.

## 1. Perimetre llegit

Flux A - contacte general:
- `app/components/forms/ContactFormComplete.tsx`
- `app/api/contact/route.ts`
- `app/api/contact/contact-copy.ts`
- `lib/services/contactLeadCaptureService.ts`
- `prisma/schema.prisma`
- primera recepcio a `app/admin/leads/[id]/page.tsx`

Flux B - configurador:
- `app/[locale]/configurador/client.tsx`
- `lib/hooks/useConfiguratorLeadForm.ts`
- mateixa ruta `/api/contact`
- mateix servei `contactLeadCaptureService`

Flux C - reserva publica:
- `components/booking/BookingForm.tsx`
- `app/api/booking/route.ts`
- `lib/services/publicBookingService.ts`
- `prisma/schema.prisma`
- primera recepcio a `app/admin/bookings/page.tsx` i `app/admin/bookings/[id]/page.tsx`

Proves mirades:
- `__tests__/lib/services/contactLeadCaptureService.test.ts`
- `__tests__/api/contact/contact-copy.test.ts`
- `__tests__/lib/hooks/useConfiguratorLeadForm.test.ts`
- `__tests__/app/api/booking-route.test.ts`
- `__tests__/lib/services/publicBookingService.test.ts`
- `__tests__/components/booking/BookingForm.test.tsx`

## 2. Mapa real del flux

### 2.1 Contacte general

Client:

`ContactFormComplete` envia a `/api/contact`:
- `name`
- `contact`
- `email`
- `phone`
- `event`
- `eventDate`
- `eventStartTime`
- `eventEndTime`
- `location`
- `message`
- `source`
- `turnstileToken`
- UTM

Evidencia: `ContactFormComplete.tsx:219-238`.

API:

`/api/contact` valida amb `contactSchema`, verifica Turnstile, calcula `leadId = OE-*`, crida `persistContactLead`, envia emails i respon `ok: true`.

Evidencia:
- `app/api/contact/route.ts:88`
- `app/api/contact/route.ts:100`
- `app/api/contact/route.ts:383-388`

Servei:

`persistContactLead` crea o actualitza `Lead`, notes, `Customer` si hi ha email real, i retorna `{ leadId: savedLeadId }`.

Evidencia:
- `lib/services/contactLeadCaptureService.ts:91-114`
- `lib/services/contactLeadCaptureService.ts:135-169`
- `lib/services/contactLeadCaptureService.ts:178-189`

Admin:

El detall de lead carrega `eventLocation`, weather, linies de servei i context economic. Si la ubicacio no arriba al model, admin queda cec en una dada clau.

Evidencia:
- `prisma/schema.prisma:428-469`
- `app/admin/leads/[id]/page.tsx:53`
- `app/admin/leads/[id]/page.tsx:156-159`
- `app/admin/leads/[id]/page.tsx:279`

### 2.2 Configurador

El configurador recull event, pack, data, pax, extres i preu calculat. La submissio usa `useConfiguratorLeadForm` i construeix payload per `/api/contact`.

Payload actual:
- `name`
- `contact`
- `event`
- `message`
- `packId`
- `packName`
- `estimatedPrice`
- `eventDate`
- `guests`
- `extras`
- `turnstileToken`
- UTM

Evidencia: `app/[locale]/configurador/client.tsx:1031-1045`.

Punt important: el component te `locale` viu via `useLocale`, pero no l'inclou al payload de contacte. Per tant, la ruta acaba decidint idioma per body o `Accept-Language`, no necessariamant pel path public on era l'usuari.

Evidencia:
- `app/[locale]/configurador/client.tsx:426-432`
- `app/api/contact/contact-copy.ts:231`
- `app/api/contact/route.ts:100-113`

### 2.3 Reserva publica

Client:

`BookingForm` calcula total a front sumant pack + extres + hores extra, i envia `/api/booking` amb `preferredLocale`.

Evidencia:
- `components/booking/BookingForm.tsx:77-103`
- `components/booking/BookingForm.tsx:111-121`
- `components/booking/BookingForm.tsx:495-504`

API/servei:

`publicBookingService` no confia en imports del client: torna a llegir `Pack` i `Extra`, calcula subtotal, IVA i total, crea/actualitza `Customer`, crea `Booking` `PENDING`, crea `BookingExtra` i marca `Availability` com `BOOKED`.

Evidencia:
- `lib/services/publicBookingService.ts:118-178`
- `lib/services/publicBookingService.ts:186-209`
- `lib/services/publicBookingService.ts:256-283`

Model/admin:

`Booking` pot tenir `leadId` nullable i `serviceLines`, pero el cami public directe no crea lead ni projecta les linies economiques vertebrals. Admin pot mostrar la reserva, pero no rep el mateix nervi economic que el flux lead -> reserva.

Evidencia:
- `prisma/schema.prisma:724-807`
- `prisma/schema.prisma:907-960`
- `app/admin/bookings/[id]/page.tsx:139`
- `app/admin/bookings/[id]/page.tsx:226-243`

## 3. Troballes prioritzades

### Alta - Contacte pot tenir exit public sense `Lead`

`persistContactLead` captura qualsevol error de BD, escriu log i retorna `{ leadId: null }`. La ruta `/api/contact` no converteix aquest `null` en error: continua amb emails i respon `ok: true` amb `leadId` artificial.

Evidencia:
- `lib/services/contactLeadCaptureService.ts:178-189`
- `app/api/contact/route.ts:100`
- `app/api/contact/route.ts:383-388`
- test actual que blinda el comportament gracil: `__tests__/lib/services/contactLeadCaptureService.test.ts:194-200`

Impacte:
- el client pot rebre confirmacio;
- el propietari pot rebre email;
- admin pot no tenir cap entrada;
- la referencia publica no serveix per recuperar res.

Accio recomanada #1548:
- fer que la ruta de contacte falli si no hi ha `savedLeadId`;
- retornar l'id real de `Lead` a la resposta;
- deixar els emails subordinats a persistencia real, o com a minim etiquetar clarament la incidencia;
- actualitzar tests per exigir error quan la persistencia falla.

### Alta - `location` surt del formulari i mor al schema

`ContactFormComplete` envia `location: formData.location` i el camp es presenta amb asterisc visual. Pero `contactSchema` no accepta `location` ni `eventLocation`; Zod descarta claus desconegudes i el servei no te camp per persistir-ho.

Evidencia:
- `app/components/forms/ContactFormComplete.tsx:232`
- `app/components/forms/ContactFormComplete.tsx:444-459`
- `app/api/contact/contact-copy.ts:215-237`
- `lib/services/contactLeadCaptureService.ts:13-29`
- `lib/services/contactLeadCaptureService.ts:91-114`
- `prisma/schema.prisma:444`

Impacte:
- admin perd ubicacio des del primer contacte;
- weather, transport, Waze, distancia, saturacio territorial i marge precoç queden sense dada;
- el formulari promet una obligatorietat visual que el backend no conserva.

Accio recomanada #1549:
- afegir `location` o `eventLocation` al schema public;
- normalitzar-lo a `eventLocation`;
- persistir-lo a create/update de `Lead`;
- si la UI el marca requerit, validar-lo de debo;
- cobrir amb test de schema + servei + ruta.

### Mitja-alta - Locale de contacte/configurador no es contracte explicit

`contactSchema` accepta `locale`, i el servei desa `preferredLocale`, pero `ContactFormComplete` i el configurador no envien el locale de pagina. La ruta pot acabar usant `Accept-Language` del navegador.

Evidencia:
- `app/api/contact/contact-copy.ts:231`
- `app/[locale]/configurador/client.tsx:426-432`
- `app/[locale]/configurador/client.tsx:1031-1045`
- `components/booking/BookingForm.tsx:111-121` com a contrast positiu: booking si envia `preferredLocale`.

Impacte:
- emails i lead admin poden quedar en idioma diferent del funnel real;
- les comparatives de conversio per idioma queden contaminades;
- no hi ha una sola veritat entre path public i dades guardades.

Accio:
- passar `locale` a tots els contactes publics;
- normalitzar-lo al mateix helper que booking (`ca/es/en`);
- test del configurador i formulari complet.

### Mitja - Referencia publica falsa `OE-*`

`/api/contact` genera `leadId = OE-*` abans de persistir. El `Lead` real te un id Prisma diferent. La resposta i emails usen el `OE-*`, no el `_savedLeadId`.

Evidencia:
- `app/api/contact/route.ts:88`
- `app/api/contact/route.ts:100`
- `app/api/contact/route.ts:199`
- `app/api/contact/route.ts:334`
- `app/api/contact/route.ts:383-388`

Impacte:
- referencia inutil per obrir admin;
- suport i debug mes lents;
- si BD falla, la referencia nomes certifica un email, no una entrada de negoci.

Accio:
- si es vol referencia humana, afegir camp durable `reference` o usar una referencia derivada del `Lead`;
- no retornar una referencia que no sigui resoluble.

### Mitja-alta - Reserva publica salta directament a `Booking` sense nervi `Lead/ServiceLine`

El cami `/api/booking` crea reserva publica directament. Tecnicament es coherent amb `Booking.leadId` nullable, pero doctrinalment s'ha de decidir si "Confirmar reserva" es una reserva real o una sol.licitud.

Evidencia:
- `lib/services/publicBookingService.ts:256-283`
- `prisma/schema.prisma:727-728`
- `prisma/schema.prisma:807`
- `prisma/schema.prisma:941-960`

Impacte:
- evita CRM/lead stage;
- no projecta `BookingServiceLine`;
- no passa pel mateix esquelet economic que lead -> dossier -> booking;
- pot bloquejar disponibilitat publica amb status `BOOKED` abans de pagament o validacio humana.

Accio de producte:
- Si es reserva real: afegir anti-abus, pagament/senyal o confirmacio forta, IVA clar, i projeccio a `BookingServiceLine`.
- Si es sol.licitud: crear `Lead`/proposal i no marcar `Availability BOOKED` fins que hi hagi contracte o senyal.

### Mitja - Total public sense IVA vs total servidor amb IVA

El front mostra `totalPrice` com suma de preus base. El servei desa `vatRate = 21`, `vatAmount` i `total = subtotal + IVA`.

Evidencia:
- `components/booking/BookingForm.tsx:77-103`
- `components/booking/BookingForm.tsx:495-504`
- `lib/services/publicBookingService.ts:173-178`
- `__tests__/lib/services/publicBookingService.test.ts:53`
- `__tests__/lib/services/publicBookingService.test.ts:196-220`

Impacte:
- el client veu un import i admin desa un altre;
- el copy actual diu "preu final subjecte a confirmacio", pero el CTA diu "Confirmar reserva";
- risc de friccio comercial quan el client compara emails/admin.

Accio:
- decidir si public mostra preu amb IVA inclos o preu base amb breakdown visible;
- fer que el missatge de total i el servidor comparteixin semantica.

### Mitja - Booking list usa locale del lead i pot perdre el locale de booking directa

El llistat de reserves tradueix pack amb `booking.lead?.preferredLocale`. El detall ja fa fallback a `booking.preferredLocale`.

Evidencia:
- `app/admin/bookings/page.tsx:172`
- `app/admin/bookings/page.tsx:395`
- `app/admin/bookings/page.tsx:491`
- `app/admin/bookings/[id]/page.tsx:185`

Impacte:
- reserves publiques sense lead poden mostrar pack amb idioma per defecte o inconsistent al llistat;
- detall i llista no segueixen la mateixa regla.

Accio:
- usar `booking.lead?.preferredLocale || booking.preferredLocale || 'ca'` tambe al llistat.

## 4. Bones peces que no cal trencar

### Contacte

- Hi ha Turnstile a `/api/contact`.
- Hi ha rate limit de contacte.
- Hi ha deduplicacio per email/telefon aproximada al servei.
- Hi ha notes de lead per preservar actualitzacions.
- Hi ha Customer quan el contacte porta email real.

### Reserva publica

- El servidor recalcula preu i no confia en imports del client.
- `preferredLocale` ja es passa des de `BookingForm`.
- `publicBookingService` normalitza `preferredLocale`.
- Les proves de booking cobreixen pack invalid, extres invalids, disponibilitat, Customer, email fallit no fatal, subtotal, IVA i pending.

## 5. Ordre Manolo recomanat

### #1548 - Contracte dur de persistencia de contacte

Objectiu: cap `ok: true` sense `Lead`.

Canvis esperats:
- `persistContactLead` no ha de convertir l'error de BD en exit funcional per a la ruta publica, o la ruta ha de tractar `leadId: null` com a error.
- `/api/contact` ha de respondre amb id real de lead.
- tests de servei/ruta.

Validacio:
- test de BD fallida;
- test que resposta usa id real;
- `pnpm run qa:protocol`.

### #1549 - Dades essencials de captacio: ubicacio + locale

Objectiu: el que veu i escriu el client arriba a admin.

Canvis esperats:
- `location/eventLocation` acceptat pel schema;
- persistencia a `Lead.eventLocation`;
- validacio coherent amb UI;
- `locale` enviat des de `ContactFormComplete` i configurador;
- tests de schema, hook i servei.

### #1550 - Semantica de reserva publica

Objectiu: decidir si el formulari es "reserva real" o "peticio".

Opcio A, reserva real:
- anti-abus public;
- pagament/senyal o confirmacio forta;
- IVA visible;
- creacio de `BookingServiceLine` inicial;
- disponibilitat bloquejada amb motiu clar.

Opcio B, peticio:
- crear `Lead`;
- deixar disponibilitat no bloquejada o soft-hold temporal;
- passar a booking nomes amb accio admin/client confirmada.

## 6. Criteri Zenit aplicat

No es tracta d'afegir mes formularis. Es tracta que cada entrada publica:

1. tingui una sola veritat;
2. sigui visible a admin;
3. porti idioma, ubicacio, event i preu sense perdua;
4. pugui reconstruir-se des de logs i id real;
5. no prometi reserva si encara no hi ha les garanties de reserva.

La frontissa captacio es el primer nervi del programa. Si aquesta frontissa menteix, tota la maquina posterior treballa amb una ombra.
