# Manolo Zenit — Full de treball total del programa

Data: 2026-07-06  
Canvi: #1545  
Estat: full de treball viu

## Mandat

Manolo queda convocat com a criteri de màxim nivell per portar OrbitaEvents al Zenit. La feina no és fer una auditoria estètica, ni una repassada superficial, ni una llista d'opinions. La feina és mirar el programa sencer com una màquina de negoci real i revisar-lo fins al límit: verticalment, horitzontalment, diagonalment, frontalment, per darrere, de perfil, de costat, pas a pas i end to end.

El mandat inclou front, back, dades, serveis, API, UI, copy, PDFs, emails, crons, integracions, tests, docs, runtime i operació real. Si una coma, un botó, una query, una funció, una etiqueta, un flux, una relació de dades o una peça visual impedeix que el sistema vengui millor, s'entengui millor, operi millor, cobri millor o generi més confiança, es pot i s'ha de proposar millorar-la.

## Principi dur

Tot es pot millorar, però no tot es remena per gust. Una millora només entra si reforça almenys un d'aquests eixos:

- Conversió: més visites que passen a lead, proposta o reserva.
- Execució: menys fricció per operar un bolo real.
- Cobrament: més claredat de pagaments, imports, factures, senyals i deute.
- Recurrència: més ressenyes, referrals, retorn, post-venda i memòria de client.
- Confiança: menys dubte, més professionalitat, més prova real.
- Claredat: menys càrrega mental per al propietari i per al client.
- Fiabilitat: menys errors, duplicats, dades cegues, accions mortes o promeses no operables.

El Zenit no és afegir més pantalles. El Zenit és que cada capacitat tingui un camí viu, comprensible, fiable, operable i premium.

## Abast d'auditoria

### 1. Auditoria vertical

Recórrer cada flux de punta a punta:

- Web pública -> lead -> admin.
- Lead -> proposta -> dossier -> email.
- Lead -> reserva -> contracte -> factura.
- Reserva -> calendari -> equip -> inventari -> execució.
- Pagament -> Stripe/Bizum/efectiu -> deute -> compte corrent.
- Booking -> post-event -> qüestionari -> valoració -> ressenya -> referral.
- Client -> historial -> recurrència -> reactivació.
- Partner -> servei -> cost -> repartiment -> payout.

Per cada flux:

- Identificar d'on ve la dada.
- Identificar qui n'és el propietari.
- Identificar què és provisional i què passa a ser veritat final.
- Verificar la ruta real renderitzada i l'API/servei que escriu o llegeix.
- Detectar bifurcacions, duplicats, pantalles cegues i accions sense efecte.

### 2. Auditoria horitzontal

Comparar totes les peces que fan funcions semblants:

- Llistes, fitxes, formularis, modals, taules, cards, KPIs, tabs i empty states.
- Botons, links, CTAs, accions destructives i confirmacions.
- Estats de pagament, fases, labels, dates, imports i formats.
- Visual admin contra Studio i tokens.
- Copy públic, emails i PDFs contra veu de marca.
- Errors, loading, permisos, sense dades i dades incompletes.

Objectiu: una mateixa acció ha de semblar i comportar-se igual a tot arreu. Si hi ha tres maneres de fer el mateix, Manolo ha de trobar la font única i proposar la poda o fusió.

### 3. Auditoria diagonal

Creuar capes que normalment s'analitzen separades:

- UI que promet una cosa i back que en fa una altra.
- PDF que ven una proposta però no hereta bé el lead o la reserva.
- Admin que mostra diners però no crida el cervell econòmic.
- Email que parla en un locale però el client en tenia un altre.
- Botó que sembla acció però només navega, o acció que no deixa rastre.
- Cron que falla i no deixa una tasca humana clara.
- Component viu que renderitza dades mortes o incompletes.

Objectiu: detectar costures invisibles, no només errors de pantalla.

### 4. Auditoria línia per línia quan calgui

Quan una peça sigui crítica, sospitosa o central, revisar:

- Imports.
- Props.
- Estat local.
- Fetches.
- Calls a serveis.
- Selects Prisma.
- Mappings.
- Constants.
- Textos.
- Classes CSS.
- Branches.
- Tests.

No es dona per viva una funció només perquè existeix, ni per correcta una pantalla només perquè compila.

## Capes obligatòries

### Frontend públic

- Home, serveis, packs, portfolio, blog, configurador, contacte, opinions, reserva pública i valoració.
- SEO, metadata, hreflang, structured data i Open Graph.
- Conversió, prova social, fricció, CTA, confiança local i premium proper.
- Mobile real, no només desktop.

### Admin

- Comandament, leads, reserves, clients, documents, comunicacions, post-event, catàleg, inventari, partners, economia, sistema i Studio.
- Cada òrgan ha de saber què governa, què rep i què entrega.
- El propietari ha d'entendre què fer ara sense interpretar una taula d'enginyer.

### Backend i serveis

- `lib/services/*`, helpers, constants i utilitats compartides.
- Càlculs de diners sempre a cervell únic.
- Queries revisades per cost, límits, N+1, ordenació i coherència.
- Cap regla de domini duplicada a JSX.

### API i seguretat

- Auth, permisos, CSRF, validació d'inputs i sanejament.
- Rutes públiques i admin separades amb criteri.
- Errors segurs: cap missatge intern al client.
- Uploads, secrets, headers i dades personals.

### Dades i model

- Prisma schema, relacions, camps duplicats, camps orfes i migracions.
- Dades reals incoherents o mig migrades.
- Seeds, backfills i scripts.
- AdminLog com a prova d'ús real, no com a decoració.

### PDFs, emails i documents

- Pressupost, contracte, factura, dossier, catàleg, informe intern i emails.
- Herència de context sempre visible: customer, lead, booking, proposal, invoice.
- Valor percebut, narrativa, objeccions, professionalitat i CTA.
- Locale i veu de marca.

### Integracions i automatismes

- Stripe, Holded, Google Calendar, SMTP, IMAP, SerpAPI, crons i Railway.
- Què passa quan falla cada integració.
- Si una automatització falla, ha de deixar rastre, alerta o tasca.

### Tests, guards i QA

- Unit, integration, Playwright i smoke real quan cal.
- `validate:core`, `qa:protocol`, i18n, guards de codi mort, auth, CSRF, canon visual.
- Tests nous quan es toca lògica, contractes de dades o UX pública crítica.

### Accessibilitat

- Labels, noms accessibles, focus, teclat, contrast, aria, lectura de botons i errors.
- Símbols decoratius marcats com a decoratius.
- Errors anunciats com a alertes quan cal.

### Performance i runtime

- Render lent, bundle, imatges, PDF generation, queries, crons i cache.
- Build, env vars, Railway, migracions aplicades i server local.
- El que el propietari veu al navegador pesa més que una teoria.

### Documentació viva

- Protocol, diari, agent-sync, fitxes forenses, atles, counter i fulls de ruta.
- Docs vells no poden governar feina nova si no han estat pujats a font viva.
- Cada decisió estable ha de quedar en un lloc que es pugui trobar.

## Preguntes Manolo per cada peça

Per cada peça revisada, respondre:

1. Què fa avui?
2. Quin objectiu de negoci hauria de servir?
3. D'on hereta la dada?
4. Què escriu i on queda com a veritat?
5. Quin òrgan l'alimenta i quin òrgan alimenta després?
6. Ven millor, genera confiança o ajuda a decidir?
7. Redueix risc o augmenta valor percebut?
8. Protegeix marge, ticket, cobrament o recurrència?
9. És operable després en un bolo real?
10. Té duplicats, codi mort, CSS mort o accions sense efecte?
11. És responsiva, accessible i coherent amb la sèrie?
12. Què cal refer, podar, fusionar, reconnectar o protegir?

## Sortida mínima de cada auditoria

Cada peça o flux revisat ha d'acabar amb:

- Veredicte: funciona, coixeja o és inacceptable.
- Forat principal: el punt que més limita confiança, conversió, execució, cobrament o recurrència.
- Prova: codi, ruta, API, test, captura o dada real.
- Millores prioritzades: ordenades per impacte, no per gust.
- Tall recomanat: el canvi petit executable primer.
- Validació necessària: tècnica, funcional i humana/UX.
- Risc de no fer-ho: què es continua perdent si queda igual.

## Regla de reconstrucció

Manolo pot proposar refer qualsevol cosa si compleix tres condicions:

1. Ha traçat què existeix i què depèn d'això.
2. Pot explicar per què el sistema actual limita el negoci o la fiabilitat.
3. Pot dividir la reconstrucció en talls petits, verificables i compatibles amb el protocol.

Refer no vol dir reescriure per gust. Vol dir arribar a una peça més clara, més fiable, més operable i més premium, retirant la porqueria sobrant.

## Ordre de treball recomanat

1. Triar un òrgan o flux, no una ruta solta.
2. Fer mapa end to end amb front, API, serveis, dades i sortides.
3. Detectar duplicats i font única.
4. Revisar experiència, visual, copy i accions.
5. Revisar seguretat, errors, accessibilitat i performance.
6. Proposar tall petit.
7. Implementar només el tall si el propietari o el protocol ho permet.
8. Validar.
9. Documentar.
10. Passar al següent tall.

## No negociable

- Zero hardcoded quan hi ha capa comuna.
- Una capacitat, un camí.
- Una dada, un propietari.
- Un càlcul de diners, un cervell.
- Cap acció invisible.
- Cap pantalla cega.
- Cap promesa que el sistema no pugui operar.
- Cap canvi sense validació proporcional.
- Cap `TANCAT CHARLIE` sense el propietari.

## Objectiu final

Que OrbitaEvents deixi de semblar un sistema gran que cal recordar i passi a semblar una màquina inevitable: clara, fiable, premium, connectada, accionable i capaç de portar el negoci de captació a post-venda sense costures.
