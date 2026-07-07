# Manolo Zenit #1548 - Comandament nonstop de la superauditoria total

Data: 2026-07-07
Autor: codex
Tipus: comandament mestre + ordre operativa nonstop
Mandat: fer la supermega auditoria total absoluta en totes les direccions possibles i, quan una evidencia sigui clara, convocar Manolo i portar la maquina cap al Zenit.

## 0. Ordre del propietari

El propietari no ha demanat una auditoria parcial, ni un informe bonic, ni mirar una pantalla.

Ha demanat:

- auditoria extensissima i exhaustivissima;
- vertical, horitzontal, diagonal, frontal, posterior, lateral, de perfil i end to end;
- front, back, dades, UI, accions, funcions, serveis, APIs, models, proves, cablejat, textos, visual, operativa i negoci;
- refer tot el necessari i tot el possible;
- que Manolo governi el criteri;
- arribar al Zenit: el millor programa de gestio possible per a Orbita Events.

Aquest document converteix aquesta ordre en sistema de treball nonstop.

## 1. Definicio de Zenit

`Zenit` no vol dir "tot reescrit". Vol dir que cada peça de la maquina compleix simultaniament:

1. fa una feina real de negoci;
2. te una sola font de veritat;
3. esta connectada amb el flux complet `Customer -> Lead -> Dossier/Proposal -> Booking -> Invoice/Contract -> Post-event`;
4. no promet res que el back no pugui sostenir;
5. no perd dades entre public, API, servei, BD i admin;
6. no duplica un cervell existent;
7. es pot entendre sense ser desenvolupador;
8. protegeix marge, caixa, temps, confiança i recurrencia;
9. es veu com una sola serie de producte, no com pantalles de mans diferents;
10. esta validada amb proves proporcionals al risc.

## 2. Manolo: rol de comandament

Manolo no es un altre agent. Es el criteri dur que s'aplica abans de tocar codi i despres de cada evidencia.

Manolo pregunta sempre:

- Aixo ven, governa o nomes existeix?
- Aixo redueix risc o l'amaga?
- Aixo fa mes clara la decisio del propietari?
- Aixo protegeix marge o el confon?
- Aixo es premium i huma o sembla una eina tecnica improvisada?
- Aixo esta connectat al seguent organ?
- Aixo tindria sentit si Orbita fos una empresa 10 cops mes gran?
- Aixo es pot delegar sense context oral?

Si la resposta es dolenta, no es maquilla: es refa, es cus, es poda o es deixa com a decisio pendent de producte.

## 3. Fotografia viva del repo en arrencada #1548

Mesura local feta el 2026-07-07:

| Superficie | Mesura actual |
|---|---:|
| Fitxers sota `app/` | 829 |
| Pagines `app/**/page.tsx` o `page.ts` | 171 |
| Pagines admin | 97 |
| API routes `app/**/route.ts` | 224 |
| Serveis a `lib/services` | 229 |
| Models Prisma | 64 |
| Fitxers de test | 603 |
| Scripts | 142 |
| Documents d'auditoria a `docs/audit` | 27 |
| Counter viu | 1547 abans d'aquest comandament |

Lectura: la maquina es massa gran per auditar-la per intuicio. Cal auditar per organs i fluxos, amb inventari, grep, proves i decisions.

## 4. Fronts obligatoris de la superauditoria

### A. Flux vertical lead -> cash

Objectiu: que cada euro, estat i decisio pugui reconstruir-se.

Inclou:
- captacio publica;
- intake manual;
- lead workspace;
- dossier/proposal/quote;
- conversio a booking;
- booking detail;
- contracte;
- factura;
- pagaments;
- repartiment;
- post-event;
- recurrencia/referral.

Sortida minima:
- mapa d'entrada/sortida;
- perdues de dades;
- duplicacions de veritat;
- accions que prometen mes del que fan;
- fixes directes.

### B. CRM, Leads i Clients

Objectiu: que el propietari pugui treballar el pipeline sense desconfiar.

Inclou:
- `Lead`, `Customer`, notes, activitats, timeline;
- scoring, prioritats, status, lost/won;
- intake, reengagement, referrals;
- customer hub i privacy.

Regla: si una dada de client existeix a dos llocs, s'ha de saber quin mana i quan.

### C. Reserva, bolo, calendari i capacitat

Objectiu: que una reserva sigui executable, cobrada i calendaritzada sense zones grises.

Inclou:
- `Booking`, `Availability`, calendari, capacity;
- `BookingServiceLine`, transport, inventari, collaborators;
- cash, Bizum, Stripe;
- portal client.

Regla: una reserva publica no pot bloquejar realitat operativa si encara no te garanties de reserva real.

### D. Economia, preu, cost i marge

Objectiu: que tots els diners surtin d'un sol cervell i siguin explicables.

Inclou:
- `costEngine`;
- transport;
- repartiment;
- collaborator payout;
- invoices;
- economic cockpit;
- pricing/catalog.

Regla: cap pagina calcula diners pel seu compte.

### E. Cataleg, packs, inventari i partners

Objectiu: que producte, cost, preu, stock i proveidor siguin una sola cadena.

Inclou:
- packs i extres;
- inventory items;
- collaborator products;
- annexos de dossier;
- cost/hora i vida util.

Regla: un producte public ha de poder explicar d'on surt el preu i com s'executa.

### F. Documents, PDFs, dossier i contractes

Objectiu: que allò que es ven, es pressuposta, es contracta i es factura sigui coherent.

Inclou:
- Studio PDF;
- dossier composite;
- quote PDF;
- contract PDF;
- invoice;
- catalog append;
- preview routes.

Regla: cap PDF pot ser una foto bonica d'una veritat diferent de l'admin.

### G. Comunicacions i automatismes comercials

Objectiu: que cada email, inbox, template, sequence i automated trigger tingui sentit i no dupliqui missatges.

Inclou:
- inbox;
- notification services;
- email templates;
- post-event dispatch;
- welcome lead;
- SLA/sequence/commercial automation.

Regla: el client no ha de notar la complexitat interna.

### H. Web publica, configurador, contacte i reserva publica

Objectiu: vendre amb desig, confiança i veritat operable.

Inclou:
- homepage, serveis, packs, portfolio;
- configurador;
- contacte;
- reserva publica;
- valoracio/testimonials;
- i18n i SEO.

Regla: el front no pot captar dades que el back descarta.

### I. Portal client

Objectiu: que el client vegi una experiencia clara, premium i connectada al seu bolo.

Inclou:
- hub portal;
- contracte/sign;
- payments;
- questionnaire;
- gallery;
- invoice;
- timeline.

Regla: tot ha d'heretar `bookingId/customerId` i tornar a la veritat admin.

### J. Admin visual, navegacio i claredat per novell

Objectiu: que l'admin sigui abastable mentalment i sembli un sol producte.

Inclou:
- navegacio D9;
- labels;
- shell;
- cards, buttons, forms;
- responsive;
- Studio/tokens;
- fitxes forenses.

Regla: no hi ha Zenit si el propietari no pot entendre on esta i que toca fer.

### K. Seguretat, privacitat, errors i anti-abus

Objectiu: que la maquina no sigui facil d'embrutar, explotar o deixar en estat fals.

Inclou:
- auth/admin;
- Turnstile;
- rate limits;
- API validation;
- privacy/RGPD;
- webhook idempotency;
- errors humans i tecnics.

Regla: cap accio publica forta sense guarda proporcional.

### L. Tests, guards, build, deploy i operacio

Objectiu: que cada millora sigui verificable i desplegable.

Inclou:
- `validate:core`;
- `qa:protocol`;
- focused tests;
- Playwright quan toca;
- build;
- scripts i crons;
- Railway/GitHub Actions.

Regla: una passada sense validacio real no es Zenit, es opinio.

## 5. Matriu de direccions

Cada front es mira amb totes aquestes direccions:

| Direccio | Pregunta |
|---|---|
| Vertical | El flux complet funciona de public/admin fins a BD i tornada? |
| Horitzontal | Les pantalles germanes comparteixen criteri, labels, visual i dades? |
| Diagonal | Una dada creada en un organ afecta correctament un altre organ? |
| Frontal | El que veu el client/admin es clar, premium i accionable? |
| Posterior | El back, serveis, crons i logs sostenen la promesa? |
| Lateral | Hi ha rutes alternatives que fan el mateix diferent? |
| Temporal | Que passa abans, durant i despres del bolo? |
| Error | Que passa si falla BD, email, Stripe, captcha, build o xarxa? |
| Dades | Quina taula mana i quina dada es derivada? |
| Negoci | Millora conversio, execucio, cobrament, recurrencia o marge? |

## 6. Pipeline nonstop

Cada cicle Manolo segueix aquesta seqüencia:

1. Triar front amb mes risc/ROI.
2. Inventariar fitxers, rutes, serveis, models, tests i docs.
3. Traçar fluxos reals amb grep i lectura.
4. Classificar troballes:
   - `BUG`: trenca veritat o promesa.
   - `FORAT`: falta una peça per completar el flux.
   - `DUPLICAT`: dues vies competeixen.
   - `CONFUSIO`: el propietari/client no entendra la decisio.
   - `VISUAL`: sembla d'un altre producte.
   - `RISC`: seguretat, dades, deploy o operacio.
5. Decidir accio:
   - `REFER`: reconstruir una peça.
   - `COSIR`: connectar organs.
   - `PODAR`: treure sobrant provadament mort.
   - `PROTEGIR`: afegir test/guard/validacio.
   - `DEIXAR`: no tocar si funciona i el risc de canvi supera el guany.
6. Si el fix es clar i acotat, implementar-lo.
7. Validar.
8. Registrar.
9. Continuar al seguent front sense demanar "segueixo?".

## 7. Primeres decisions ja verificades

### #1547 - Frontissa captacio

Evidencia ja documentada:
- contacte pot respondre exit sense `Lead`;
- `location` es descarta;
- `locale` de contacte/configurador no es contracte explicit;
- referencia publica `OE-*` no es id real;
- reserva publica crea `Booking/Availability BOOKED` sense `Lead/ServiceLine`;
- total front sense IVA vs backend amb IVA.

Accio immediata:
- primer fix executable: contracte dur de persistencia de `/api/contact`.

Motiu:
- abans de fer la maquina mes bonica, cal que no menteixi quan capta un client.

## 8. Regla de continuacio

Aquest comandament no es tanca dient "ja esta auditada tota la maquina".

Es tanca quan:

1. existeix el mapa mestre;
2. s'ha registrat formalment el mode nonstop;
3. el seguent fix executable queda obert i en marxa.

La superauditoria continua en cicles successius. Cada cicle ha de deixar una millora real o una decisio dura documentada.

## 9. Estat viu

| Front | Estat inicial | Proxim moviment |
|---|---|---|
| Captacio publica | Auditat #1547 | Fixar persistencia real de `/api/contact` |
| Configurador | Auditat parcial #1547 | Afegir locale i revisar ubicacio/context |
| Reserva publica | Auditat parcial #1547 | Decidir reserva real vs peticio |
| CRM/Lead/Client | Pendent superpassada | Inventariar serveis i rutes |
| Booking/Bolo/Calendari | Pendent superpassada | Traçar booking detail/new/API/calendar |
| Economia | Motor fort | Auditar que totes les vistes criden cervell |
| Cataleg/Inventari/Partners | Pendent superpassada | Traçar producte -> cost -> dossier -> booking |
| PDFs/Documents | Pendent superpassada | Traçar dossier/quote/contract/invoice |
| Comunicacions | Pendent superpassada | Traçar email/inbox/template/timeline |
| Portal client | Pendent superpassada | Traçar herencia booking/customer |
| Admin visual/navegacio | Atles D9-D11 pendent | Font unica de nav i labels |
| Seguretat/errors | Pendent transversal | Captcha/rate-limit/status forts |
| Tests/guards/deploy | Sempre actiu | Afegir cobertura per cada fix |

## 10. Frase de comandament

No es treballa per "fer canvis".

Es treballa per convertir Orbita Events en una maquina de gestio que:

- ven millor;
- governa millor;
- protegeix marge;
- redueix improvisacio;
- permet delegar;
- no perd dades;
- no duplica veritats;
- i fa que el propietari pugui confiar en el 100% del sistema.

Aixo es Manolo. Aixo es el Zenit.
