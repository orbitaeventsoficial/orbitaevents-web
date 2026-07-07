# Manolo Zenit — Analisi master + atles abans de l'auditoria total

Data: 2026-07-06
Canvi: #1546
Estat: mapa rector previ a auditories de codi

## 0. Correccio del propietari

El propietari ha corregit el rumb: abans de fer l'auditoria exhaustiva no es pot comencar de zero ni improvisar un mapa nou. Ja existeixen `master` i `atles`; s'han de mirar be i han de governar la feina.

Per tant:

- `docs/audit/MANOLO-ZENIT-FULL-DE-TREBALL-1545.md` queda com el mandat general de Manolo.
- Aquest document #1546 queda com la lectura rectoral del mandat contra els documents mestres ja existents.
- Les auditories posteriors no han de repetir diagnostics ja escrits; han de verificar, prioritzar i executar talls petits amb proves.
- No es pot obrir una "auditoria total" com una bola opaca que ho toqui tot. S'ha de baixar per organs i fluxos, seguint l'atles.

## 1. Documents font que manen

Aquest #1546 queda subordinat a aquests documents:

- `docs/ATLES-FUNCIONAL.md`: cens funcional i lectura de l'organisme com a flux vertical `lead -> cash`.
- `docs/admin-organisme-atles.md`: mapa de front, back, frontissa, duplicacions D1-D11 i deute de navegacio/costures.
- `docs/TESI-MAQUINA-full-de-ruta-2026-07.md`: tesi vertical de la maquina, cervells, fuites de valor i onades de ROI.
- `docs/TESI-ZENIT-MAQUINA-ORBITA-2026-07-04.md`: tesi estrategica del zenit, dimensions vertical/horitzontal/diagonal i escenaris reals.
- `docs/audit/MANOLO-ZENIT-FULL-DE-TREBALL-1545.md`: mandat Manolo d'auditoria total i millora fins al limit.

Lectura en una frase: Orbita no necessita mes pantalles per ser millor; necessita que els cervells que ja existeixen parlin clar, actuïn en el moment correcte, eliminin sobrant i protegeixin marge, caixa, temps i reputacio.

## 2. El que el master i l'atles ja deixen clar

### 2.1 La maquina no es una llista de pagines

El repo s'ha d'entendre com un organisme amb un flux de negoci:

```
web publica
  -> lead
  -> conversa
  -> dossier / pressupost
  -> reserva
  -> operativa
  -> cobrament
  -> partners / inventari
  -> post-event
  -> client recurrent
```

Cap auditoria Manolo pot jutjar una pantalla sola si no mira:

- qui l'alimenta;
- que escriu;
- quin organ rep el resultat;
- si conserva la veritat economica i operativa;
- si redueix o augmenta carrega mental del propietari.

### 2.2 La columna vertebral bona ja existeix

La tesi de la maquina diu que el valor tecnic real es:

- una veritat economica compartida (`costEngine`, `travelLaborCost`, `repartimentService`, `collaboratorPayoutService`, `economicCockpit`);
- una columna operativa de linies de servei (`LeadServiceLine` -> `BookingServiceLine`);
- un nexe critic `bookingCreationService`, que copia les linies del lead a la reserva quan el bolo es guanya.

Conseqüencia: la feina Manolo no ha de reinventar el motor. Ha de comprovar que cada superficie el consumeix i que el propietari veu el criteri abans de decidir.

### 2.3 Els organs vermells no son misteri

`ATLES-FUNCIONAL.md` ja marca dues zones inflades:

- CRM / Lead / Client: 135 funcions, 36 serveis, molt fragmentat.
- Transversal: 127 funcions, 40 serveis, calaix de utils/helpers/restes.

Aixo no vol dir "tocar 76 serveis de cop". Vol dir que cada audit ha de decidir si la peca revisada:

- pertany a un organ real;
- esta duplicada;
- esta orfena;
- hauria de baixar a constants/servei compartit;
- o hauria de desapareixer.

### 2.4 La frontissa front-back continua pendent de verificacio end to end

`docs/admin-organisme-atles.md` avisa que la frontissa publica/API/admin no esta auditada extrem a extrem. Aixo es clau per Manolo, perque la captacio es el primer punt on es pot perdre dada, marge, locale, UTM, origen, intencio o confiança.

Primera radiografia de noms reals:

- `app/components/forms/ContactFormComplete.tsx` envia a `/api/contact` amb UTM.
- `lib/hooks/useConfiguratorLeadForm.ts` envia el configurador a `/api/contact`.
- `app/api/contact/route.ts` valida, rate-limita i crida `persistContactLead`.
- `lib/services/contactLeadCaptureService.ts` crea o actualitza `Lead`, crea notes, vincula `Customer` i guarda `preferredLocale`, UTM i `landingPage`.
- `components/booking/BookingForm.tsx` envia a `/api/booking`.
- `app/api/booking/route.ts` crida `createPublicBooking`.
- `lib/services/publicBookingService.ts` crea `Customer`, `Booking`, reserva disponibilitat i envia emails.

La lectura important: hi ha almenys dos camins d'entrada molt diferents. Un crea/actualitza `Lead`; l'altre crea `Booking` directament. Aixo pot ser correcte, pero s'ha de validar contra la doctrina del repo: abans del si, governa el lead; despres del si, governa la reserva.

### 2.5 D9-D11 ja son deute diagnosticat, no cal redescobrir-lo

L'atles admin ja detecta:

- D9: navegacio amb tres fonts divergents (`layout.tsx`, `nav-items.ts`, protocol). Proposta: `lib/admin/admin-nav.ts` com a font unica. No aplicar sense decisio de propietari sobre noms, ordre i grups col.lapsables.
- D10: labels de lead duplicades i divergencia `Pagat` vs `Pagada`. Centralitzable, pero el copy final l'ha de fixar el propietari.
- D11: costura CSS entre organs (`BookingTotalEditor` depen de classes `fxd__` de leads). Candidat a botons canonics a `admin-shell.css` + Studio.

Aixo dona talls tecnics bons, pero no son el primer audit Manolo si l'objectiu es entendre la maquina sencera. D9, sobretot, necessita decisio de producte.

## 3. Que faltava afegir al mandat Manolo despres de mirar master/atles

El #1545 ja era ampli, pero master/atles obliguen a afegir aquests filtres:

1. **No repetir audit ja feta**: si l'atles ja diu D9/D10/D11, el treball nou ha de verificar o executar, no tornar-ho a descobrir.
2. **Separar estrategia de tall executable**: la tesi pot ser gran; el canvi ha de ser petit i verificable.
3. **No confondre volum amb valor**: 90 pagines no son 90 prioritats; el criteri es conversio, execucio, cobrament i recurrencia.
4. **Mirar adopcio del propietari**: una funcio pot existir i no tenir valor si el propietari no la veu, no la creu o no la pot usar en el moment de decidir.
5. **Classificar automatitzacions per risc**: auto, draft o aprovacio humana segons si surt al client, toca diners o canvia estat.
6. **Detectar fuites de palanca**: cervells que calculen be pero no governen decisions visibles.
7. **Protegir dissabtes i marge abans del si**: no n'hi ha prou amb calcular marge despres; el sistema ha d'avisar abans de comprometre capacitat escassa.
8. **Tancar el volant post-event**: testimoni, ressenya, referral i portfolio no son decoracio; son CAC barat.
9. **Verificar dades d'entrada economica**: `MarketingSpend`/CAC real existeix, pero si no hi ha dades, el cervell no decideix.
10. **Fer servir Transversal com a prova, no com a paperera**: abans de podar helpers cal saber quin flux els consumeix.

## 4. Ordre rector d'auditoria

### 4.1 Primer principi

El primer audit real ha de creuar public -> API -> servei -> model -> admin. Si nomes mirem una pagina admin, no complim l'avís de l'atles sobre la frontissa. Si nomes mirem Transversal, podem podar sense saber quina branca encara alimenta un flux viu.

### 4.2 Primer tall recomanat: frontissa de captacio a Lead/Booking

Tall proposat per al #1547:

```
Frontissa de captacio:
  Contacte public + Configurador + Reserva publica
  -> /api/contact + /api/booking
  -> contactLeadCaptureService + publicBookingService
  -> Lead / Customer / Booking
  -> primera superficie admin que ho ha de fer accionable
```

Per que aquest tall primer:

- toca l'entrada del `lead -> cash`;
- valida la part que l'atles diu que falta auditar E2E;
- posa a prova CRM sense intentar revisar 36 serveis de cop;
- detecta si el public promet preus, packs, dates o idiomes que el back no conserva;
- separa clarament quan ha de manar `Lead` i quan ha de manar `Booking`;
- dona un primer mapa real de dependencies Transversal abans de podar.

Sortida esperada del #1547:

- mapa de camps: que entra al formulari, que arriba a l'API, que es guarda i que veu l'admin;
- veredicte sobre etapa lead vs reserva publica;
- divergencies de preu, pack, extras, UTM, locale, consent, notes i client;
- accions mortes o promeses no operables;
- primer tall de codi petit si hi ha un forat clar.

### 4.3 Segon tall: CRM / Lead / Client

Despres de la frontissa, la llijadora entra a CRM amb proves:

- `Lead` nou o actualitzat;
- activitat i notes;
- scoring / prioritat / next best action;
- lead list;
- lead detail;
- customer link;
- conversio a dossier o booking.

Objectiu: que un lead no sigui un registre mort, sino una oportunitat amb propera accio clara.

### 4.4 Tercer tall: Transversal

Quan ja sapiguem quins helpers participen en un flux real, es pot entrar a Transversal:

- utils que nomes serveixen una ruta;
- helpers duplicats;
- constants locals que haurien de ser canon;
- funcions sense consumidor;
- wrappers antics que amaguen la font de veritat.

Objectiu: convertir "calaix" en capes amb nom d'organ, o eliminar sobrants.

### 4.5 Talls tecnics ja detectats

Es poden executar quan el propietari ho ordeni o quan encaixin amb un organ:

- D9 nav canonica: gran impacte, pero requereix decisio de noms, ordre i collapsables.
- D10 labels de lead: petit i bo, pendent copy final.
- D11 botons/costura CSS: petit i bo, especialment si es toca booking detail o leads.

## 5. Matriu Manolo per a cada audit posterior

Cada audit posterior ha d'omplir aquesta fitxa:

| Camp | Resposta obligatoria |
|---|---|
| Organ | Quin organ de l'atles toca. |
| Flux | Quin tram `lead -> cash` revisa. |
| Entrada | Quina dada neix o entra. |
| Propietari de la dada | Lead, Booking, Customer, Dossier, Payment, Partner o altre. |
| Front | Quina pantalla/formulari ho promet. |
| API | Quin endpoint ho valida. |
| Servei | Quin servei decideix. |
| Model | Quins camps Prisma queden com a veritat. |
| Sortida | Quina pantalla, PDF, email, cron o admin action ho consumeix. |
| Duplicats | On hi ha una segona manera de fer el mateix. |
| Risc | Que es perd si queda igual. |
| Tall petit | Quin canvi verificable ve primer. |
| Validacio | Tests, smoke, captura, diff-check o prova manual. |

## 6. Veredicte d'aquest #1546

Si la pregunta es "fas l'exhaustiu analisi?", la resposta correcta despres de mirar master/atles es:

Si, pero no com una passada cega per tot el repo. Es fa com una serie de disseccions verticals governades pel master i l'atles.

El primer moviment no ha de ser tocar mil fitxers. Ha de ser auditar la frontissa de captacio, perque es on la realitat entra a la maquina. A partir d'aqui:

1. frontissa publica -> Lead/Booking;
2. CRM/Lead/Client;
3. Transversal amb dependencies reals;
4. documents/PDF;
5. comunicacio/inbox;
6. post-event/volant;
7. economia guardrails;
8. navegacio D9 quan el propietari fixi criteri de producte.

Aquest ordre respecta el master, l'atles i Manolo: entendre, provar, podar i reconstruir nomes on el tall millora conversio, execucio, cobrament, recurrencia, confiança, claredat o fiabilitat.
