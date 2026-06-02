# Inventari refeta fitxa reserva — `/admin/bookings/[id]`

Data: 2026-06-02  
Reserva inspeccionada: `cmpv6tehp0002mittudtg9tui` (`OE-2026-003`)  
Objectiu: deixar inventari abans de posar pantalla negra i reconstruir la fitxa peça per peça.

---

## 1. Veredicte de pantalla actual

La fitxa actual ja té molta capacitat operativa, però està massa carregada per ser una cabina clara. Barreja en una sola columna:

- resum executiu
- CRM/client
- dades del bolo
- serveis i pack
- equipament
- portal client
- qüestionari
- finances i pagaments
- checklist
- marge i costos
- documents/factura
- comunicacions
- historial
- galeria
- post-event

La refeta ha de partir de pantalla negra i reconstruir primer el que el propietari necessita decidir en 5 segons.

---

## 2. Dades reals de la reserva Kimera

### Identitat

- `id`: `cmpv6tehp0002mittudtg9tui`
- `reference`: `OE-2026-003`
- `status`: `PENDING`
- `leadId`: `cmppw0nqu0001108ifwrdn956`
- `customerId`: `null`
- `customer`: no vinculat
- `preferredLocale`: `es`

### Client

- Nom: `Kimera`
- Email: `kimera@pendent.local`
- Telèfon: `680735701`
- Client CRM: no existeix o no està vinculat
- Lead origen: sí, estat `WON`, prioritat `HIGH`

### Bolo

- Tipus: `PRIVATE_PARTY`
- Data: `2026-06-06`
- Hora inici: `10:00`
- Hora fi: `20:00`
- Lloc: `Kimera Climbing, Carrer de Barcelona, 1e, 08850 Gavà, Barcelona`
- Venue: `Kimera climbing`
- Convidats booking: `100`
- Convidats lead origen: `150`
- Telèfon event: `null` al booking, però el lead té `eventPhone = 680735701`
- Adreça event: `null` al booking, però el lead té `eventAddress` poblada

### Servei

- Pack: `disco-basico`
- Servei: `discomovil`
- Nom pack: `Bàsic`
- Preu pack: `250`
- Hores DJ: `2`
- Watts: `4000`
- Inclou fum: sí
- Inclou micro: no
- Extres: cap
- Hores extra: `0`
- Inventari assignat: cap

### Economia

- Subtotal: `290`
- Descompte: `0`
- IVA: `21%`
- IVA import: `60.90`
- Total: `350.90`
- Senyal: `105`
- Resta: `245.90`
- Senyal pagada: no
- Resta pagada: no
- Mètode cobrament: `CASH`
- Vol factura: `false`
- Import efectiu previst: `300`
- Distància: `94.8 km`
- Cost combustible/km: `0.1156`
- Cost desplaçament: `10.96`

### Documents i post-event

- Pressupostos: `0`
- Factures: `0`
- Contracte: no existeix
- Informe post-event: no
- Enquesta client: no
- Feedback client: no
- Email post-event enviat: no
- Galeria compartida: no

---

## 3. Fitxers de la pantalla actual

### Shell principal

- `app/admin/bookings/[id]/page.tsx`
  - Server component.
  - Carrega el booking directament amb Prisma.
  - Fa includes de pack, extres, inventari, lead, proposals, invoices, post-event, survey i feedback.
  - Crida `getBookingOperationalSnapshot(booking)`.
  - Renderitza tota la cabina.

- `app/admin/bookings/[id]/booking-detail.css`
  - CSS `bd__*`.
  - Migració Brass & Obsidian del canvi #849.
  - Encara conviu amb components que usen classes `ap-card`, Tailwind i `admin-tone-*`.

- `app/admin/bookings/[id]/BookingSectionNav.tsx`
  - Nav sticky horitzontal.
  - Consumeix `BOOKING_DETAIL_SECTIONS`.
  - Marca secció activa amb `IntersectionObserver`.

- `app/admin/bookings/[id]/booking-utils.ts`
  - Helpers purs per Google Calendar, traducció de pack i compat de numèrics.

### Components operatius

- `BookingStatusChanger.tsx`: canvi d'estat `PENDING | CONFIRMED | PREPARING | COMPLETED | CANCELLED`.
- `BookingTotalEditor.tsx`: edició inline del total via `PATCH /api/admin/bookings/[id]`.
- `BookingMarginCard.tsx`: marge, distància, cost directe, objectiu de marge i càlcul de ruta.
- `BookingInventorySection.tsx`: assignar material, lots, sortida/retorn, cerca inventari.
- `BookingChecklist.tsx`: checklist operativa editable.
- `DocumentFlowSection.tsx`: resum pressupost/contracte/factura.
- `InvoiceSection.tsx`: crear factura, marcar pagada, reintentar sync, cancel·lar.
- `StripePaymentPanel.tsx`: generar enllaços Stripe de senyal/resta i copiar-los.
- `ClientPortalAccessPanel.tsx`: generar/revocar portal privat del client.
- `BookingQuestionnaireSection.tsx`: mostra qüestionari vinculat o accés a crear-lo.
- `BookingGallery.tsx`: pujar, optimitzar, classificar, publicar a portal/portfolio i eliminar fotos.
- `BookingFieldNotesComposer.tsx`: captura ràpida de foto + nota de camp.
- `GallerySharePanel.tsx`: existeix però no està renderitzat directament al `page.tsx` actual.
- `CommunicationPanel.tsx`: enviar/logar comunicacions per flux `PAYMENT`, `POST_EVENT`, `GENERAL`.
- `PostEventEmailButton.tsx`: disparar email post-event.
- `CalendarSyncButton.tsx`: sincronització Google Calendar.
- `BookingCustomerLinkPanel.tsx`: vincular o crear client quan la reserva no té `customerId`.

### Estats auxiliars

- `loading.tsx`: skeleton `bd__skel`.
- `error.tsx`: pantalla error de detall.

---

## 4. Fonts de dades

### Càrrega inicial directa

`page.tsx` fa `prisma.booking.findUnique` amb:

- `pack.translations`
- `pack.inventory.item`
- `extras.extra.translations`
- `inventory.item`
- `lead`
- `proposals`
- `invoices`
- `postEventReport`
- `clientSurvey`
- `clientFeedback`

### Snapshot operacional

`lib/services/bookingOperationalService.ts` afegeix:

- checklist
- timeline canònica
- client per `customerId` o email normalitzat
- portal actiu
- configuració de rendibilitat
- objectiu de marge
- cost real d'inventari
- resum pagaments
- resum documents
- estat dels fluxos de comunicació
- estat post-event intern

---

## 5. APIs que la pantalla pot tocar

- `GET /api/admin/bookings/[id]`
- `PATCH /api/admin/bookings/[id]`
- `DELETE /api/admin/bookings/[id]`
- `PATCH /api/admin/bookings/[id]/status`
- `POST /api/admin/bookings/[id]/calendar-sync`
- `GET/POST /api/admin/bookings/[id]/checklist`
- `GET/POST/PATCH/DELETE /api/admin/bookings/[id]/gallery`
- `GET/POST/DELETE /api/admin/bookings/[id]/gallery-share`
- `GET/POST/PATCH/DELETE /api/admin/bookings/[id]/inventory`
- `GET/POST/DELETE /api/admin/bookings/[id]/portal-access`
- `POST /api/admin/bookings/[id]/communications`
- `GET/POST /api/admin/bookings/[id]/customer-link`
- `POST /api/admin/bookings/[id]/stripe-checkout`
- `POST /api/admin/emails/send-post-event`
- `POST /api/admin/maps/distance`

---

## 6. Constants i contractes

- `BOOKING_STATUS_VALUES`: `PENDING`, `CONFIRMED`, `PREPARING`, `COMPLETED`, `CANCELLED`.
- `BOOKING_STATUS_ORDER`: ordre del selector d'estat.
- `ACTIVE_BOOKING_STATUSES`: `PENDING`, `CONFIRMED`, `PREPARING`.
- `ACTIVE_INVENTORY_BOOKING_STATUSES`: `CONFIRMED`, `PREPARING`.
- `DELETABLE_BOOKING_STATUSES`: `PENDING`, `CANCELLED`.
- `BOOKING_DETAIL_SECTIONS`: `Client`, `Event`, `Serveis`, `Equipament`, `Portal`, `Qüestionari`, `Finances`, `Marge`, `Documents`, `Comunicacions`, `Historial`, `Galeria`.
- `ADMIN_BOOKING_HELP`, `ADMIN_BOOKING_HELP_2`, `ADMIN_BOOKING_HELP_3`: copy del mode ajuda.

---

## 7. Peces candidates per reconstrucció

### Primera pantalla imprescindible

1. Capçalera negra amb referència, client, estat i data.
2. Semàfor de decisió:
   - falta senyal
   - falta client CRM
   - reserva pendent
   - event en pocs dies
3. Bloc bolo:
   - data/hora
   - lloc/venue
   - telèfon operatiu
   - pax
4. Bloc cobrament:
   - total
   - senyal/resta
   - mètode de pagament
   - factura sí/no
   - CTA cobrar senyal
5. Bloc servei:
   - pack
   - extres
   - durada
6. Accions primàries:
   - WhatsApp
   - crear/vincular client
   - marcar senyal pagada
   - confirmar reserva
   - obrir entrada original

### Segona capa

1. Equipament.
2. Checklist.
3. Documents.
4. Portal client.
5. Marge.
6. Comunicacions.

### Tercera capa

1. Historial.
2. Galeria.
3. Qüestionari.
4. Post-event.
5. Sync calendari.
6. Ajuda contextual.

---

## 8. Alertes concretes per Kimera

- Booking sense `customerId`: cal decidir si crear client o vincular-lo.
- Booking `PENDING`: falta confirmació operativa.
- Senyal no pagada: CTA primari hauria de ser cobrament inicial.
- `invoiceRequired=false` però `vatRate=21`: revisar si és intencionat o herència de creació.
- `paymentMethod=CASH`, `cashAmount=300`, però total `350.90`: cal mostrar-ho clar perquè hi ha diferència.
- Booking té `eventPhone/eventAddress` buits però el lead origen sí els té: cal sincronitzar o mostrar fallback del lead.
- Pax booking `100` i pax lead `150`: diferència que la nova UI ha de fer visible o resoldre.
- No hi ha inventari assignat tot i ser event proper.
- No hi ha pressupost, contracte ni factura.

---

## 9. Regla per la refeta

No començar refactor gran des del JSX actual. Primer crear pantalla negra mínima amb:

- dades crítiques
- accions crítiques
- semàfors
- navegació cap a la resta

Després reintroduir components existents només quan passin aquest filtre:

1. és acció freqüent?
2. evita perdre diners o una reserva?
3. ajuda el dia del bolo?
4. és necessari abans de completar l'esdeveniment?

