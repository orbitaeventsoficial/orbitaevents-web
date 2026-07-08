# Manolo Zenit reset total — superultra megaauditoria i execucio

> Canvi #1551 · 2026-07-07 · codex  
> Estat: full de comandament viu del reinici.  
> Ordre del propietari: repetir de zero; Manolo fa la feina; primer auditoria i despres portar la maquina al Zenit.

---

## 0. Veredicte Manolo

Orbita no necessita una altra capa de brillantor. Necessita una maquina que no menteixi,
que no perdi dades, que no obligui el propietari a recordar 93 pantalles, que ajudi a fer
la feina i que defensi marge, temps i reputacio abans que una decisio dolenta entri al
sistema.

La feina no es "mirar una pantalla". La feina es entendre el programa sencer com un sol cos:
web publica, formularis, APIs, serveis, Prisma, admin, documents, portal, emails, crons,
tests, Studio, Atles, Master, dades i experiencia humana.

## 1. Reset real

Aquest tall no dona per bones les conclusions #1545-#1550 com a base de veritat. Queden com
historial del repo, pero aquest reinici parteix de:

- protocol viu: `CLAUDE.md`, `docs/admin-protocol.md`, `docs/protocol-executiu.md`;
- Atles: `docs/admin-organisme-atles.md` i `docs/ATLES-FUNCIONAL.md`;
- Master/Tesi: `docs/TESI-MAQUINA-full-de-ruta-2026-07.md` i `docs/TESI-ZENIT-MAQUINA-ORBITA-2026-07-04.md`;
- Studio: `app/studio/orbita-tokens.css` com a veritat visual;
- repo real actual, no memoria.

El mandat queda separat en dues feines:

1. **Auditoria Manolo total.** Vertical, horitzontal, diagonal, frontal, de reves, de cara,
   d'esquena, de costat, end-to-end, per cada funcio, cable, trucada, dada, text, estil,
   document, prova i promesa comercial.
2. **Zenit.** Convertir troballes en millores reals: refer, cosir, podar, protegir,
   simplificar, automatitzar, fer copilot i validar.

## 2. Fotografia viva del repo

Inventari mecanic executat localment el 2026-07-07:

| Superficie | Recompte viu |
|---|---:|
| Fitxers sota `app/` | 829 |
| `page.tsx` totals | 171 |
| `page.tsx` admin | 97 |
| `page.tsx` publics locale | 72 |
| API routes `app/api/**/route.ts` | 224 |
| Serveis `lib/services/*.ts` | 229 |
| Fitxers `lib/**/*.ts` | 381 |
| Models Prisma | 64 |
| Tests | 604 |
| Scripts | 136 |
| Exports/funcions detectades a serveis | 1362 |

Lectura Manolo: aixo no es un projecte petit. Qualsevol "refeta" sense mapa es una aposta
cega. Pero tampoc hi ha vaca sagrada: si una peça enganya, duplica, bloqueja o no ajuda a
gestionar, es refa.

## 3. Que vol dir "exhaustiu" aqui

Manolo audita cada front en 12 direccions:

1. **Vertical client -> BD -> admin.** Que entra, com es valida, on es desa, qui ho veu.
2. **Vertical admin -> servei -> BD -> web.** Que canvia l'admin i on impacta publicament.
3. **De reves.** Partir de cada dada guardada i trobar quina pantalla l'alimenta i quina la consumeix.
4. **Horitzontal de veritats.** Preus, estats, labels, dates, moneda, idioma, visual i copy no poden duplicar-se.
5. **Diagonal de casos reals.** Lead normal, lead lluny, dissabte escas, partner-client, revenda partner, cash same-day, post-event.
6. **Funcions.** Cada servei ha de tenir propietari de negoci, consumidor real i prova proporcional.
7. **Cables.** Links, params, fetch, route handlers, service calls, transactions, emails i crons.
8. **Trucades.** Tota mutacio ha de tenir auth/CSRF si es admin, rate limit si es publica i error visible.
9. **Visual.** Studio/tokens, jerarquia, responsive, accessibilitat, no dues mans.
10. **Traçabilitat.** AdminLog, activity, customer/lead timeline, documents i snapshots.
11. **Simplicitat.** Menys memoria manual, mes "aixo toca ara".
12. **Copilot.** La maquina ha de preparar feina, avisar risc, proposar seguent accio i deixar que el propietari aprovi quan hi ha risc.

## 4. Criteri Zenit

Una peça puja al Zenit quan compleix tot aixo:

- **Confiable:** cap exit fals, cap dada perduda, cap total que no coincideixi.
- **Una sola veritat:** calculs i labels viuen en un cervell, no a cada pantalla.
- **Traçable:** cada decisio important deixa rastre i es pot reconstruir.
- **Operable:** el que promet al client es pot executar al bolo.
- **Simple:** redueix feina mental al propietari.
- **Copilot:** prepara, prioritza, alerta i proposa; no nomes mostra dades.
- **Visualment coherent:** sembla part de la mateixa serie Orbita, amb Studio com a font.
- **Validat:** test tecnic, comprovacio funcional i lectura humana/UX.

## 5. Primeres troballes revalidades en aquest reset

Aquestes no venen de memoria; s'han tornat a llegir al codi viu.

### F1 — Reserva publica mostra un total diferent del que es guarda

**Peça:** `components/booking/BookingForm.tsx` -> `/api/booking` -> `publicBookingService`.

**Avui:** el formulari public calcula `totalPrice` com pack + extres + hores extra, sense IVA.
El backend guarda `subtotal`, `vatRate=21`, `vatAmount` i `total=subtotal+IVA`.

**Problema real:** la pantalla publica pot ensenyar 400 EUR i la reserva real quedar a 484
EUR. Aixo es una falta de fiabilitat comercial. No cal que peti: ja fa mal perque la promesa
visible i la veritat guardada no son iguals.

**Tall Zenit recomanat:** el formulari public ha de mostrar base, IVA i total final amb la
mateixa regla que el backend, consumint `VAT_RATE_INVOICE`, `calcVatAmount` i `roundMoney`.

**Risc si no es fa:** el client veu un preu i el sistema en grava un altre; el propietari
ha de defensar una diferencia que la maquina ha creat.

### F2 — Reserva publica crea massa veritat massa aviat

**Peça:** `createPublicBooking`.

**Avui:** la publicacio directa crea `Customer`, `Booking PENDING`, `Availability BOOKED`,
emails i activity. No neix com lead/configuracio revisable; neix com reserva pendent.

**Problema real:** per a una empresa petita, "reservar" sense pagament ni revisio pot bloquejar
calendari i generar operativa massa forta. Pot ser intencionat, pero llavors la UI ha de dir-ho
amb absoluta claredat i el back ha de protegir disponibilitat, marge i capacitat.

**Tall Zenit recomanat:** despres de F1, decidir si la reserva publica continua sent reserva
forta o passa a lead qualificat/esborrany. Sense decisio humana, es pot millorar el contracte
visible i la traçabilitat, no canviar el model de negoci de cop.

**Risc si no es fa:** falsos bloquejos, reserves sense senyal i calendari ocupat per intencions
que potser eren consultes.

### F3 — Navegacio ha millorat, pero encara no es copilot

**Peça:** `app/admin/lib/adminNav.ts`.

**Avui:** la navegacio ja te una font unica, millor que l'Atles v2 antic, pero continua sent
un mapa de llocs. El Zenit demana mapa d'intencions: que toca avui, quin risc crema, quin
front esta pendent i quin organ resol cada cosa.

**Tall Zenit recomanat:** no tocar nav abans d'acabar els primers talls de fiabilitat. El
copilot ha de sortir de dades reals (`dailyBrief`, `nextBestAction`, `postEventPlaybook`,
`economicCockpit`), no d'un menu mes bonic.

**Risc si no es fa:** seguir confonent "tenir rutes" amb "ajudar a gestionar".

## 6. Cua de Zenit

Ordre inicial de talls, reavaluable despres de cada prova:

1. **#1552 — Reserva publica confiable:** total visible = total backend, amb IVA i copy i18n.
2. **#1553 — Contracte de reserva publica:** decidir o preparar el cami reserva forta vs lead revisable, amb traçabilitat.
3. **Copilot Avui:** mes que dashboard: cues d'accio, risc, cobrament, post-event, marge i proper moviment.
4. **Guardia economica:** cap dossier/reserva/dissabte escas sense marge i cost d'oportunitat visibles.
5. **Post-event volant:** ressenya/testimoni/referral com a CAC barat, començant amb cues i esborranys segurs.
6. **Documents/PDF:** client veu valor; propietari veu marge; snapshots immutables.
7. **Visual/Studio:** tot el que es toqui ha de consumir tokens i patrons; cap altra mà.

## 7. Full de treball nocturn viu

Actualitzat el 2026-07-08 durant el torn nonstop. Aquest bloc es el tauler de comandament
del roadmap Manolo: no substitueix el protocol, pero evita que la feina quedi com una llista
de microcanvis sense direccio.

### 7.1 Estat executiu

| Front | Estat | Canvis | Veredicte Manolo |
|---|---|---:|---|
| Reserva publica: preu visible = veritat guardada | FET | #1552 | El client ja veu base, IVA i total final coherent amb backend. |
| Reserva publica: traçabilitat i contracte pendent | FET | #1553-#1557 | El flux deixa de prometre confirmacio final abans de revisio, proposta/contracte i senyal. |
| Public web / configurador: promesa coherent | EN CURS | #1606, #1607, #1608, #1609, #1612, #1613, #1614, #1615, #1616 | El configurador, les ofertes publiques, home, calendari, Halloween, Mon Magic, subtitols de captacio, metadades SEO, FAQ de preu, checkout public i trust del formulari ja parlen de sol.licitud/proposta/disponibilitat/estimacio orientativa/revisio abans de confirmar, no de reserva instantania, confirmacio enviada, reserves confirmades avui, subtitols de "reserva ara", data reservada 48h, reemborsament sense pagament, pressupost final instantani, preu final automatic ni etiqueta de preu final. |
| Copilot Avui: connexio amb ranking transversal | EN CURS | #1558-#1562, #1577, #1580, #1583, #1617, #1618, #1619, #1620, #1623 | `/admin` ja consumeix NBA, degrada millor, mostra domini/finestra, evita lectura duplicada de capacity, pot pujar post-event i riscos economics dels proxims bolos a la cua principal, omple buits amb `dailyBrief` sense duplicar el mateix desti, no perd caixa pendent dins la finestra operativa de 7 dies, calcula cobraments NBA/dailyBrief amb efectiu registrat i evita avisos del proper bolo si `outstandingAmount` ja és zero. |
| Roadmap nocturn visible | EN CURS | #1561 | Aquest bloc fa visible la columna vertebral de la nit. |
| Sistema / guards monocapa | EN CURS | #1575, #1610, #1624, #1686, #1719, #1720, #1721, #1722, #1723, #1724 | El roadmap ja esta protegit per guard propi, els catalegs declaratius detectats per `arch:layer:check` tornen a `lib/constants/*` sense trencar imports existents, el desglossament de caixa pendent viu en una sola font a `payment-status`, el cataleg de scripts ja no fa veure que una comanda s'ha copiat si el porta-retalls falla, Railway no mutila rutes Next per ignores massa amplis, la instrumentacio no deixa imports `@/lib` opacs al runtime de produccio, les notificacions finals del cron comercial no tomben tota l'automatitzacio si un canal extern fa timeout, el contracte de desat de leads queda protegit perquè una data canviada no pugui quedar atrapada en estat local/cache de temporada, els productes de partner separen visibilitat comercial de dossier i visibilitat interna de booking, i els hard-delete de col·laboradors/productes queden bloquejats si hi ha dependències o si la BD no les pot verificar. |
| Guardia economica de bolos | EN CURS | #1563, #1566, #1569, #1572, #1580, #1583, #1586, #1592, #1595, #1597, #1600, #1603, #1618, #1619, #1620, #1621, #1622, #1623, #1624, #1625, #1626, #1627, #1628, #1629, #1630, #1631, #1632, #1633, #1634, #1635, #1637, #1638, #1639, #1640, #1641, #1642, #1643, #1644, #1645, #1646, #1647, #1648, #1650, #1651, #1652, #1657, #1658, #1659, #1690, #1693, #1697, #1698, #1699, #1700, #1704, #1705, #1706, #1710, #1711, #1712, #1713, #1714, #1715, #1723, #1724 | El proper bolo, la fitxa de reserva, l'Studio de pressupostos, el calendari, el Customer Hub, els recordatoris automàtics, Salut, el control, Google Calendar, Economia, els filtres de Reserves, l'API/Kanban i el portal client ja mostren marge/caixa/risc; si qualsevol bolo dels proxims 7 dies crema, tambe pot entrar com a accio executiva i l'agenda el resumeix per mes/setmana/dia amb CTA directe a la reserva amb risc, motiu visible, salt a finances o marge, microaccio visible dins la fitxa i pendent/cobrat de client/resum diari/client/email/control/Salut/calendar/economia/reserves/kanban/portal/timeline/agenda/fitxa/Stripe/Bizum/pols operatiu cash-aware, PVP recomanat de packs arrodonit amunt a acabat en 0 comunicat a Economia i Packs sense decimals visuals, aplicat a l'editor detallat i protegit a la frontera d'escriptura del servei admin, lots d'inventari/packs i productes partner de línies de servei sense fals buit quan l'API falla, mutacions de partners, productes partner, membres/favorits, portfolio, gestor d'imatges, contactes/tags client, Studio de pressupostos i pagaments amb error backend llegible, despesa de màrqueting/CAC sense fals buit quan la lectura falla, bloquejos manuals de cuadrant i desat de pressupostos personalitzats amb motiu backend quan fallen, i creació manual/API de reserva bloquejada fins que l'operador completa dades mínimes, revisa conflictes del mateix dia, bloqueja si aquesta comprovació falla, conserva peatges manuals, el PATCH canonic accepta els camps que el servei ja sap aplicar sense perdre contacte, tipus, descompte o peatges, l'editor de total ja no confirma un preu pactat si l'API el rebutja, la fitxa usa `travelCost` persistent perquè peatges/temps/dieta no desapareguin del marge, Economia mostra error visible quan falla un toggle de cobrament o un recordatori de pagament, la fitxa ja no deixa errors de cobrament de cash/bestreta/resta només en toast efímer, el desat de línies de servei no amaga errors que afecten total/marge, el lloguer d'altaveus d'Isma pot entrar com a cost intern de DJ sense inflar el dossier i el dossier pot explicar desplaçament llarg amb vehicle, operaris, peatges i dietes sense convertir-ho en quatre productes. |
| Post-event i recurrencia | EN CURS | #1564, #1567, #1570, #1573, #1576, #1579, #1582, #1585, #1588, #1594, #1602, #1661, #1683, #1684, #1685, #1702, #1703 | "Tanca el cercle" i el playbook ja comparteixen desti; el playbook prepara accio segura, registra decisio comercial, avança quan el testimoni ja està sol.licitat, distingeix social preparat de publicat, crea esborrany social intern, l'obre directament a l'editor, bloqueja publicacio sense revisar consentiment, permet marcar revisio feta amb nota persistent, aplica la mateixa regla al servei server-side, l'email post-event de fitxa anuncia errors abans que l'operador assumeixi que ha sortit, les còpies de missatges de referral/reactivació/reengagement ja no fallen en silenci, les mutacions socials de publicar/arxivar/eliminar conserven el motiu backend i el catàleg de plantilles email no confon fallada de lectura amb catàleg buit. |
| Documents/PDF | EN CURS | #1565, #1568, #1571, #1574, #1581, #1584, #1587, #1590, #1593, #1596, #1598, #1601, #1604, #1605, #1636, #1691, #1692, #1694, #1695, #1696, #1708, #1716, #1717, #1718, #1723, #1724 | El dossier complet i el cicle pressupost/contracte deixen traça; contracte i pressupost enviat congelen snapshots v1, el Customer Hub els fa visibles, la timeline diferencia "obrir pressupost" de "obrir contracte", el PDF signat queda accionable també com a fita de negoci i cada document mostra ruta d'origen client/entrada/reserva també a la cronologia, al llistat de dossiers i a les traces de dossier enviat/PDF compost; les traces de dossier ja no semblen activitat generica, la timeline pot aillar documents sense duplicar panells, el PDF de factura pinta bestreta/resta amb el mateix pendent real cash-aware que la resta de la maquina, el generador de dossiers no crea lead/client nou si no pot verificar clients existents, avisa si no pot importar productes del lead i tampoc confon la cerca de leads fallida amb cap resultat, la reassignacio de pressupostos no confon una cerca de vincles fallida amb cap resultat, el Studio de pressupostos avisa quan no pot llegir clients del CRM, el llistat de dossiers no confirma enviaments, paperera, restauracio o purga si el backend ho rebutja, intake sintetitza WhatsApps llargs sense aixafar ni duplicar notes abans de crear dossier/lead, el cataleg del generador separa proveidor -> audiencia mentre accepta productes actius nous sense whitelist i torna a pintar imatges de producte quan existeixen, Bingo Musical KIDS entra com a producte infantil ofertable amb PVP 200, Partners no cau si un KPI de bolos passats apunta a una relacio absent de produccio, les columnes buides d'audiència desapareixen del generador i els snapshots antics poden recuperar imatge viva sense perdre la foto comercial congelada. |
| Visual/Studio | TRANSVERSAL | #1611 | `qa:admin-canon` queda a 0 troballes: les microtipografies residuals de calendari i playbook post-event passen de píxels locals al token `--o-text-2xs`. |
| Traçabilitat profunda | TRANSVERSAL | #1575, #1578, #1584, #1590, #1596, #1621, #1649, #1653, #1654, #1655, #1656, #1660, #1687, #1688, #1689, #1701, #1707, #1709, #1722 | AdminLog, activity, timeline, snapshots, Customer Hub i guards han de poder reconstruir cada decisio important, amb CTA documental semantic, contracte signat a timeline, origen visible, pendent de cobrament cash-aware, comunicacions de reserva amb error visible quan el backend rebutja l'accio, galeria de reserva sense mutacions invisibles cap a portal/portfolio, link compartit de galeria sense errors muts de càrrega/còpia, checklist de reserva sense estat optimista fals quan el desat falla, vincle reserva-client sense refresh fals ni dubte CRM quan falla, portal client amb errors accessibles abans d'enviar link, Safata sense canvi de llegit/no llegit fals, sense autolectura muda quan el PATCH del lead falla ni auto-refresh de leads mut, selector ràpid d'estat, registre d'activitat i accions de qüestionaris sense fallida amagada al log, fitxa/temporada de leads sense data antiga després d'un PATCH i el full de ruta que la governa. |

### 7.1.1 Actualització viva #1725-#1732

Aquest complement manté el comandament alineat amb la ronda recent. Les files llargues de 7.1
continuen sent la lectura de domini; aquesta taula és el resum executiu fresc de la nit.

| Canvis | Front | Impacte Zenit |
|---|---|---|
| #1725-#1726 | Dossiers / portfolio / productes | Bingo Musical KIDS, Bingo Musical adult i Batalla Musical tenen imatges de producte millorades, amb presentador visible i cares infantils pixelades quan cal. |
| #1727 | Portfolio | `/admin/portfolio` deixa de marcar zero fals, exposa la pestanya `Imatges` i permet drop-in per categoria amb pipeline canònic de carpeta, nom i optimització. |
| #1728-#1731, #1733, #1738, #1742-#1749 | Lead / economia / repartiment | El lead veu el repartiment abans de reserva, però el transforma en `Pacte amb partner`: Masquerade valida import, hores reals, hores pagades, dietes i compensacions sense veure el net d'Òrbita com a peça principal; #1742 compacta la fitxa i fixa la ruta com `km - 50`, persones amb 1 h inclosa i dietes només si passa de 150 km; #1743 fa que la liquidació oculta de ruta viatgi a la reserva i que els peatges entrin al càrrec visible; #1744 impedeix que el dossier esborri aquesta liquidació en sincronitzar productes cap al lead; #1745 talla el soroll amb ruta agregada, pacte partner curt, rail de marge de decisio i detall complet reservat a reserva/economia; #1746 fa que `Crear dossier` creï/obri directament el PDF des del lead quan les dades ja hi són; #1747 redueix el pacte a servei + ruta agregada - compensació i deixa la liquidació completa per reserva/economia; #1748 fa que lead i generador de dossiers creïn pel mateix contracte canònic `{ leadId }`; #1749 retira l'endpoint vell, plega el partner i converteix el lead en pantalla de decisio amb dossier com accio principal. |
| #1729-#1730, #1734-#1737, #1739-#1741 | Dossier / reserva / booking legacy | Els peatges i el desplaçament llarg es congelen al dossier; seleccionar un lead dins del generador hereta km/peatges, snapshots antics poden rehidratar peatges, el PDF compost pinta desplaçament, les reserves amb `travelCost` i línies `[travel-cost]` no dupliquen cost, les previews blob del dossier carreguen imatges absolutes i el dossier ordena experiències abans d'extres amb imatges completes responsives. |
| #1732 | Roadmap / auditoria | Aquest full torna a ser viu: incorpora #1725-#1731, defineix els següents talls probables i queda protegit pel guard `qa:zenit-roadmap`. |

### 7.2 Criteri de prioritat de la nit

1. **Fiabilitat abans de brillantor.** Primer es corregeix qualsevol cosa que pugui mentir al client o al propietari.
2. **Copilot abans de mes pantalles.** Si dues pantalles mostren dades, el Zenit pregunta quina accio prepara la maquina.
3. **Economia abans d'estetica quan hi ha risc.** Marge, transport, dissabte i cobrament tenen prioritat sobre refinaments visuals.
4. **Visual nomes si acompanya flux real.** No es maquilla una peça que encara esta mal cablejada.
5. **Traça sempre.** Si una decisio canvia estat, diners, client, disponibilitat o document, ha de quedar reconstruible.

### 7.3 Roadmap operatiu per blocs

| Bloc | Pregunta Manolo | Evidencia a llegir | Tall esperat |
|---|---|---|---|
| Avui / Copilot | La primera pantalla diu realment "fes aixo ara" i per que? | `app/admin/page.tsx`, `nextBestActionService`, `dailyBrief`, `postEventPlaybook`, `capacityConflict`, `dayCollision` | Convertir Avui en cua executiva fiable, no dashboard decorat. |
| Economia / marge | Un bolo pot semblar bo mentre perd temps o diners? | `costEngine`, `travelLaborCost`, `payment-status`, `economicCockpit`, reserves reals | Guardies visibles de marge, transport, cobrament i cost d'oportunitat. |
| Lead -> reserva | El que es ven com a lead arriba igual a reserva i documents? | `LeadServiceLine`, `BookingServiceLine`, dossier service, new booking form | Herencia i ownership nets, sense doble veritat. |
| Post-event | El sistema converteix bolos fets en reputacio i recurrencia? | `postEventPlaybook`, dispatch service, testimonials, reviews, referrals | Cua segura de post-event amb accions preparades. |
| Documents/PDF | El document que surt fora coincideix amb el negoci intern? | `dossierCompositePdfService`, `quotePdfService`, `contractPdfService`, Studio previews | Snapshots i promesa comercial coherents. |
| Public web | La web promet exactament el que la maquina pot executar? | booking form, contact, packs, availability, i18n messages | Cap promesa publica mes forta que el backend. |
| Sistema / guards | El repo impedeix regressions o nomes les documenta? | scripts QA, tests, protocol, service coverage | Guard nou nomes quan evita una regressio real. |

### 7.4 Fet aquesta nit

- **#1552**: preu public de reserva alineat amb IVA i total backend.
- **#1553**: reserva publica deixa rastre `adminLog` i availability note amb referencia.
- **#1554**: copy public deixa de dir reserva confirmada quan el backend desa `PENDING`.
- **#1555**: email public passa a sol.licitud rebuda i no confirmacio final.
- **#1556**: servei public valida camps requerits trimmejats i email.
- **#1557**: disponibilitat publica passa de reservar ara a sol.licitar data.
- **#1558**: `/admin` connecta top accions NBA al bloc principal d'Avui.
- **#1559**: API d'explicacio NBA degrada a buit 200 si falla.
- **#1560**: projeccio NBA/dailyBrief surt del JSX, queda testejada i mostra domini/finestra.
- **#1561**: aquest full passa a comandament nocturn viu.
- **#1562**: `/admin` reutilitza la mateixa lectura de capacity dins NBA i evita una consulta duplicada.
- **#1563**: "El focus" d'Avui mostra marge estimat, caixa pendent i checklist del proper bolo.
- **#1564**: "Tanca el cercle" deixa de linkar generic i obre reserva/client/social/referrals segons la propera accio.
- **#1565**: el PDF complet de dossier registra traça documental a `adminLog`.
- **#1566**: el punt/label de pagament del proper bolo usa cobertura derivada del pendent real.
- **#1567**: `/admin/post-event/playbook` reutilitza el mateix href accionable que la home.
- **#1568**: pressupost enviat i contracte generat/enviat/signat/cancel.lat/PDF signat registren traça documental global a `adminLog`.
- **#1569**: la fitxa de reserva mostra `Marge` i `Pendent caixa` a la capçalera amb càlcul canònic i cash-aware.
- **#1570**: `/admin/post-event/playbook` mostra accio preparada, draft segur i CTA especific sense tocar dispatch ni enviar res.
- **#1571**: el contracte desa `contractSnapshot` v1 dins `Proposal.snapshot` i les regeneracions el prioritzen sobre booking/cataleg vius.
- **#1572**: l'Studio de pressupostos mostra guàrdia comercial amb cost directe, marge net i CAC estimat abans de descarregar/imprimir/enviar.
- **#1573**: `/admin/post-event/playbook` registra decisions de testimoni/social/referral com a `CustomerActivity` segura; el referral registrat compta com a programat per aquella reserva.
- **#1574**: `sendAdminProposal` desa `quoteSnapshot` v1 dins `Proposal.snapshot`, preservant `contractSnapshot` i congelant imports, pack, extres, condicions i trace del pressupost enviat.
- **#1575**: nou `qa:zenit-roadmap` condicional; si el protocol diu que aquest roadmap s'ha actualitzat, el guard exigeix que el `#N` actual aparegui al full Manolo i entra a `validate:core`.
- **#1576**: el playbook reconeix `POST_EVENT_RECURRENCE_DECIDED` amb `actionKey: testimonial`; mostra `Sol.licitat` i avança la cua sense confondre-ho amb testimoni rebut.
- **#1577**: `/admin` omple buits de "Fes això ara" amb post-event prioritari i evita duplicar el mateix booking a "Tanca el cercle".
- **#1578**: `timelineQueryService` fa llegibles `POST_EVENT_RECURRENCE_DECIDED` i `DOCUMENT_*`, amb títols/bodies humans i `DOCUMENT_PROPOSAL_SENT` com `PROPOSAL_SENT`.
- **#1579**: el playbook llegeix decisions `social_post`, mostra `Preparat, no publicat`, manté el social pendent fins que existeixi publicacio real i desactiva el registre repetit.
- **#1580**: `/admin` projecta marge critic o caixa pendent imminent del proper bolo com a accio `economic` dins "Fes això ara", amb prioritat suficient per superar NBA alt no critic.
- **#1581**: el Customer Hub mostra `quoteSnapshot`/`contractSnapshot` com a `Foto documental`, amb CTA al document; la timeline de proposta enviada/acceptada també obre el pressupost.
- **#1582**: la decisio `social_post` del playbook crea/reutilitza un `SocialPost` `DRAFT` intern vinculat al booking, amb traça `DRAFT_NOT_PUBLISHED`, sense publicar ni tocar APIs externes.
- **#1583**: `dashboard-data` calcula riscos economics dels proxims 7 dies i `/admin` els pot elevar a "Fes això ara" encara que no siguin el proper bolo.
- **#1584**: `timelineQueryService` separa CTA documental de pressupost i contracte (`Obrir pressupost` vs `Obrir contracte`) sense rutes noves.
- **#1585**: el playbook conserva `socialPostId`, mostra `Obrir esborrany` i `/admin/social?postId=...` obre el modal del draft concret sense publicar res.
- **#1586**: `getAdminCalendarMonth` baixa `economicRisk` per reserva i mes/setmana/dia mostren marge critic o caixa pendent imminent al calendari.
- **#1587**: `ProposalDTO` porta `contractPdfUrl` i el Customer Hub mostra `Contracte signat` amb CTA al PDF signat o al workspace del contracte.
- **#1588**: `SocialClient` mostra revisio de consentiment pendent i bloqueja programar/publicar drafts post-event mentre la nota interna no s'hagi resolt.
- **#1589**: els posts socials del calendari month/week/day obren `/admin/social?postId=...` amb el deep link canonic.
- **#1590**: la timeline business del Customer Hub mostra `Contracte signat` amb CTA al PDF signat o al workspace del contracte.
- **#1592**: mes/setmana/dia del calendari resumeixen quantes reserves porten `economicRisk`, separant critic i avis sense recalcular economia al front.
- **#1593**: el Customer Hub propaga `customerId`/`leadId`/`bookingId` de cada proposta i mostra `Origen` amb links a client, entrada i reserva.
- **#1594**: `SocialClient` permet marcar la revisio post-event feta, neteja marcadors pendents i persisteix la decisio a `SocialPost.notes` sense schema.
- **#1595**: el resum economic de calendari tria una reserva amb risc, prioritza critics i mostra CTA directe a mes/setmana/dia.
- **#1596**: la timeline del Customer Hub renderitza `Origen` per events documentals amb links a client, entrada i reserva.
- **#1597**: el CTA economic de calendari mostra `Motiu` amb la primera rao de `economicRisk` o fallback al label ja calculat.
- **#1598**: el llistat i paperera de dossiers mostren `Origen` amb links a entrada i client derivat del lead.
- **#1600**: el CTA economic de calendari obre `#sec-finances` o `#sec-marge` de la reserva segons `economicRisk`, sense recalcular al front.
- **#1601**: el dossier enviat i el PDF compost registren traça documental amb origen lead/client, i la timeline la pot recuperar per customer/lead.
- **#1602**: la revisio social post-event passa a guard compartit UI+servei; programar/publicar queda bloquejat tambe server-side mentre hi ha notes pendents.
- **#1603**: la fitxa de reserva mostra microaccio de caixa o marge quan hi ha risc economic, i apunta a pagaments/enllacos, costos o total sense automatitzar cobraments.
- **#1604**: la timeline del Customer Hub destaca traces documentals de dossier amb franja i badge propis, sense duplicar documents ni tocar backend.
- **#1605**: la timeline del Customer Hub incorpora filtre `Documents` i separa traces documentals de comunicacions generiques sense fetch nou.
- **#1606**: el configurador public deixa de prometre reserva instantania, confirmacio enviada o reemborsament; comunica sol.licitud, proposta i revisio humana.
- **#1607**: les ofertes publiques `checkout` i `offerModal` passen de reserva/confirmacio immediata a proposta amb descompte i validacio de disponibilitat.
- **#1608**: el subtitol final del configurador tambe passa de "reserva ara" a demanar proposta, blindat pel test de promesa publica.
- **#1609**: CTAs publics residuals (`common.buttons`, `reviews.cta`, `urgency`, `flashOffer`, `packsOffers`, `heroUrgency` i about EN) passen de reserva/book a proposta, pressupost o disponibilitat, amb guard ampliat.
- **#1610**: `arch:layer:check` torna a verd movent catalegs declaratius locals a `lib/constants/*`, mantenint reexports compatibles i afegint cobertura per `documentAuditTrailService`/`bookingEconomics`.
- **#1611**: `qa:admin-canon` queda a 0 troballes eliminant els 4 `font-px` P3 de calendari mensual i playbook post-event amb token Studio `--o-text-2xs`.
- **#1612**: home, calendari, Halloween i Mon Magic deixen de prometre reserva/book/data reservada en captacio i passen a proposta/disponibilitat, blindat pel guard de promesa publica.
- **#1613**: subtitols publics i metadades del configurador deixen de prometre pressupost/quote instantani final i passen a estimacio orientativa revisable, blindat pel guard de promesa publica.
- **#1614**: FAQ publica deixa de dir que els preus/prices es calculen automaticament com a preu final i passa a estimacio orientativa del configurador, blindat sobre tots els strings de `messages`.
- **#1615**: checkout public deixa d'etiquetar el resultat com a `preu/precio/final price` i passa a preu estimat, blindat pel guard de promesa publica.
- **#1616**: el trust public `Sense compromís/No commitment` deixa de prometre reemborsament post-senyal i passa a revisio final abans de confirmar, sense tocar politiques legals de cancel.lacio.
- **#1617**: `Fes això ara` omple buits del ranking principal amb accions `dailyBrief` de baixa prioritat i evita duplicar fallback si ja hi ha una accio amb el mateix `href`.
- **#1618**: la guardia economica d'Avui usa finestra de 7 dies per caixa pendent, compartida entre filtre de risc i projeccio `Fes això ara`, sense avisar fora de finestra.
- **#1619**: NBA calcula pendent de cobrament de clients amb `bookingOutstandingAmount` i `cashAmount`, evitant accions falses quan un bolo ja esta cobrat en efectiu.
- **#1620**: `dailyBrief` compta cobraments pendents amb `bookingOutstandingAmount` i `cashAmount`, evitant KPI/resum/fallback falsos per reserves cobertes en efectiu.
- **#1621**: Customer Hub calcula `pendingPaymentTotal` i `COLLECT_PAYMENT` amb `bookingOutstandingAmount` i `cashAmount`, evitant accions falses dins el workspace de client.
- **#1622**: `paymentReminderService` envia recordatoris només amb pendent real cash-aware i ajusta el detall de l'email perquè no reclami trams ja coberts en efectiu.
- **#1623**: dashboard/control i insights del pròxim bolo miren `outstandingAmount` i deixen de mostrar cobrament imminent quan l'efectiu ja cobreix el total.
- **#1624**: `payment-status` exposa breakdown cash-aware de bestreta/resta; recordatoris i Salut el consumeixen per evitar trams pendents falsos.
- **#1625**: Google Calendar exporta `Cobrament` amb `getPaymentBand` i `cashAmount`, evitant `Pagament pendent` en events coberts en efectiu.
- **#1626**: `/admin/economia` projecta KPI, filtres i cues de cobrament amb `bookingOutstandingBreakdown`, separant flags reals de reserva i saldo pendent cash-aware.
- **#1627**: `/admin/bookings?payment=...` filtra bestreta, vencuts i pròxims amb condicions `cashAmount` vs `depositAmount`/`remainingAmount`/`total`, sense paginació falsa.
- **#1628**: `/api/admin/bookings` i `BookingPipelineView` consumeixen el mateix `bookingPaymentFilter` compartit que la pàgina server, eliminant la segona lògica crua de deute pendent.
- **#1629**: el portal client i la factura del portal deriven pagaments, proper pas i CTAs de `bookingOutstandingBreakdown`; si `cashAmount` cobreix o redueix un tram, no reclama ni sobrecobra.
- **#1630**: Customer Hub calcula `totalPaid`, risc del top lead i badges de reserva amb `bookingOutstandingAmount`/`bookingOutstandingBreakdown`, incorporant `cashAmount` també a la reserva vinculada del lead.
- **#1631**: la timeline del portal client marca bestreta/resta amb `bookingOutstandingBreakdown`, de manera que `Procés` ja no contradiu `Pagaments` quan `cashAmount` cobreix un tram.
- **#1632**: l'Agenda de leads propaga `total/cashAmount` de la reserva vinculada i pinta el semàfor amb `getPaymentBand` cash-aware sense reobrir el layout TANCAT CHARLIE.
- **#1633**: el kanban de reserves calcula la pill `Paga pendent` amb `bookingOutstandingBreakdown`, evitant reclamar bestreta quan `cashAmount` ja la cobreix.
- **#1634**: la fitxa de reserva pinta trams de pagament i botó cash amb `bookingOutstandingBreakdown`, mantenint els toggles com a flags manuals.
- **#1635**: el servei i panell Stripe bloquegen links online si `cashAmount` cobreix o redueix parcialment un tram, evitant checkouts d'import complet ambigu.
- **#1636**: el PDF de factura deriva bestreta/resta de `bookingOutstandingBreakdown`, incloent efectiu complet o parcial amb flags falsos.
- **#1637**: Bizum bloqueja declaracions/confirmacions de trams ja coberts per `cashAmount` i amaga pendents antics quan el display cash-aware ja els considera liquidats.
- **#1638**: el pols operatiu calcula la taxa de cobrament amb `bookingOutstandingAmount`, comptant efectiu total com a liquidat encara que els flags manuals siguin falsos.
- **#1639**: Economia i el model de packs recomanen PVP, hora extra i operari extra acabats en 0, sempre arrodonits amunt des del càlcul exacte.
- **#1640**: `/admin/packs` mostra aquests recomanats comercials amb format net sense decimals visuals, conservant decimals només per costos/imports exactes.
- **#1641**: `/admin/packs/[id]` aplica el recomanat comercial amb `roundRecommendedSellingPrice()`, inclòs preu automàtic i botó d'aplicar, sense segon càlcul decimal.
- **#1642**: `packAdminService` normalitza `price`, `extraHourPrice` i `priceValue` de sync amb `roundRecommendedSellingPrice()` abans de persistir PVP de packs.
- **#1643**: `/admin/bookings/new` bloqueja crear una segona reserva del mateix dia fins que l'operador marca que ha revisat les reserves actives detectades.
- **#1690**: `/admin/bookings/new` també bloqueja crear si la comprovació de conflictes del dia falla i mostra disponibilitat no verificada.
- **#1644**: `/admin/bookings/new` bloqueja el CTA si falten telèfon, data, ubicació o bolo, alineant la UI amb el contracte de `useNewBookingSubmit`.
- **#1645**: `POST /api/admin/bookings` trimmeja i rebutja camps obligatoris en blanc abans de cridar `createBookingFromInput`.
- **#1646**: `POST /api/admin/bookings` conserva `tollsEur` perquè els peatges manuals arribin al cervell de creació i transport.
- **#1647**: `PATCH /api/admin/bookings/[id]` accepta i trimmeja contacte, tipus, descompte i `tollsEur`, alineant la ruta amb `bookingRouteService`.
- **#1648**: `BookingTotalEditor` comprova `res.ok` i no mostra èxit ni refresca quan el PATCH del total pactat falla.
- **#1649**: `CommunicationPanel` mostra error per flux quan `/communications` falla i no refresca la fitxa com si s'hagués aplicat.
- **#1650**: la fitxa de reserva passa `travelCost`/`tollsEur` persistents al guard i a `BookingMarginCard`, i el recàlcul usa `computeBoloTransport`.
- **#1651**: el toggle de pagament d'Economia captura errors HTTP/xarxa, mostra error visible i no refresca com si el cobrament s'hagués aplicat.
- **#1652**: els recordatoris de cobrament d'Economia capturen errors HTTP/xarxa i `ok:false`, mostren error visible i no refresquen com si la comunicacio hagués sortit.
- **#1653**: la galeria de reserva mostra error visible si falla carregar, publicar al portal/portfolio, canviar carpeta, eliminar o desar nota de foto.
- **#1654**: el link compartit de galeria mostra error visible si falla carregar, copiar, crear o revocar el link.
- **#1655**: la checklist de reserva reverteix mutacions optimistes fallides i recupera el text d'un ítem nou si el PUT no es desa.
- **#1656**: el vincle reserva-client mostra error visible si falla crear o vincular client i no refresca com si el CRM s'hagués actualitzat.
- **#1657**: el cobrament complet en efectiu mostra error persistent si el PATCH falla i no marca la fitxa com cobrada.
- **#1658**: el toggle manual de bestreta/resta mostra error persistent si el PATCH falla i reverteix l'estat optimista.
- **#1659**: l'editor de línies de servei mostra error persistent si el PATCH falla i no refresca com si total/marge s'haguessin recalculat.
- **#1660**: el panell de portal client anuncia errors amb `role="alert"` i marca accions quan generar/copiar/revocar link falla.
- **#1661**: el botó d'email post-event anuncia errors amb `role="alert"` i marca l'acció si l'API falla.
- **#1662**: el botó de Google Calendar de la fitxa anuncia errors amb `role="alert"` i marca l'acció si `calendar-sync` falla.
- **#1663**: la secció de factura de reserva anuncia errors d'API/Holded amb `role="alert"` i marca accions quan facturació falla.
- **#1664**: el panell Stripe/Bizum anuncia errors de cobrament amb `role="alert"`, captura fallades de xarxa i marca l'acció fallida.
- **#1665**: la secció d'inventari separa èxits/errors, anuncia assignacions fallides amb `role="alert"` i marca accions mutadores.
- **#1666**: el canviador d'estat de reserva anuncia PATCH fallits amb `role="alert"` i marca el selector si stats/calendari no s'han aplicat.
- **#1667**: el compositor de field notes anuncia pujades fallides amb `role="alert"` i marca `+ Foto` si la captura no queda guardada.
- **#1668**: la cabina de marge mostra error persistent si desar transport falla i marca `Desar canvis` abans de confiar en el marge.
- **#1669**: l'editor de total pactat mostra error persistent amb `role="alert"` i marca import/desar si el PATCH falla.
- **#1670**: el link de galeria compartida marca accions quan carregar/copiar/generar/revocar falla i conserva l'error real de clipboard.
- **#1671**: el panell de comunicacions marca les accions del flux fallit i deixa traça quan email/WhatsApp/log/resposta no es persisteixen.
- **#1672**: la galeria principal marca el control concret que falla en pujada, portal, portfolio, carpeta, eliminacio o nota.
- **#1673**: la checklist de preparacio marca si ha fallat marcar, eliminar o afegir un item, mantenint rollback i text recuperat.
- **#1674**: l'editor de linies de servei marca el CTA de desat quan validar o persistir el bolo falla.
- **#1675**: el portal client de reserva marca nomes l'accio fallida: generar/rotar, copiar o revocar.
- **#1676**: el vincle CRM de reserva marca nomes la coincidencia o alta de client que ha fallat.
- **#1677**: el link de galeria compartida marca si falla carregar, crear, copiar o revocar sense embrutar altres controls.
- **#1678**: la factura de reserva marca nomes l'accio fallida: crear, reintentar sync, marcar pagada o cancel-lar.
- **#1679**: pagaments Stripe/Bizum marquen el tram i accio fallits sense tacar l'altre cobrament.
- **#1680**: l'inventari de reserva marca nomes el control fallit: item, pack, lot, sortida, retorn o treure.
- **#1693**: Inventari i editor de Packs mostren error si no poden carregar lots reutilitzables, sense confondre fallada amb llista buida.
- **#1697**: el configurador de línies de servei mostra error si no pot carregar productes de proveïdors externs, sense confondre fallada amb catàleg buit.
- **#1698**: les mutacions de productes partner mostren el motiu del backend quan falla crear, editar o eliminar producte.
- **#1699**: les mutacions de col·laboradors mostren el motiu del backend quan falla crear, editar, eliminar o activar/desactivar partner.
- **#1700**: despesa de màrqueting mostra error si falla la lectura o mutació i no converteix una fallada de CAC en llista buida.
- **#1701**: selector ràpid d'estat mostra error backend si el PATCH falla i no deixa el canvi de lead/reserva només al log.
- **#1702**: Social mostra el motiu backend quan falla canviar estat o eliminar una publicació, sense estat local fals.
- **#1703**: Plantilles email mostra error i reintent si falla la lectura, sense recomanar accions sobre un catàleg falsament buit.
- **#1704**: Payout de partner conserva el motiu backend quan falla marcar pagat o desfer un pagament.
- **#1705**: Bloquejos manuals del cuadrant conserven el motiu backend quan falla afegir o treure disponibilitat.
- **#1706**: Calculadora de costos conserva el motiu backend quan falla guardar un pressupost personalitzat.
- **#1707**: Activitat conserva el motiu backend quan falla carregar el registre transversal.
- **#1708**: Llistat de dossiers conserva motius backend i no confirma enviar/paperera/restaurar/purgar si falla.
- **#1709**: Accions de qüestionaris mostren error accessible i no refresquen si activar/desactivar o eliminar falla.
- **#1710**: Partner hub conserva motius backend quan falla afegir/eliminar membre o marcar favorit.
- **#1711**: Portfolio admin comprova `res.ok` i conserva `error/message` backend en mutacions de media/events abans de refrescar o tocar estat local.
- **#1712**: Customer Hub no amaga un contacte si el delete falla i mostra el motiu backend en alerta.
- **#1713**: Studio de pressupostos no confirma enviament si el backend no marca la proposta com enviada.
- **#1714**: Customer Hub no refresca tags de client si el backend rebutja afegir-los o treure'ls.
- **#1715**: Image manager no recarrega placements si upload/delete/auto/alt/reordre fallen al backend.
- **#1716**: Intake sintetitza converses WhatsApp llargues en notes idempotents, sense copiar text brut ni aixafar notes humanes.
- **#1717**: Generador de dossiers ordena el cataleg per proveidor i dins per audiencia, qualsevol producte actiu de partner entra sense whitelist hardcoded i el dossier HTML torna a pintar imatges de producte quan existeixen.
- **#1718**: Partners carrega col·laboradors/productes encara que falli el comptador informatiu de bookings (`public.collaborator_bookings` absent), desbloquejant crear productes ofertables per dossier.
- **#1719**: Railway deixa d'excloure rutes Next anomenades `coverage`; el guard impedeix que un ignore local mutili el snapshot de produccio abans de validar BD/API.
- **#1720**: `instrumentation.ts` deixa de carregar el scheduler amb imports opacs que mantenien `@/lib` literal; ara crida les rutes cron autenticades i el guard impedeix que la produccio torni a arrencar amb `ERR_MODULE_NOT_FOUND` al scheduler.
- **#1721**: `commercialDailyAutomationService` tracta email/WhatsApp finals del resum com a best-effort; un timeout queda logat i comptat a `summary.notifications` sense convertir tota la ronda comercial en `500`.
- **#1722**: la fitxa de lead i la temporada consumeixen la veritat retornada pel PATCH i forcen ruta dinamica; una data editada com Albert Aujas no pot quedar enganxada a l'estat local o a una vista cachejada sense que el guard ho detecti.
- **#1723**: `CollaboratorProduct` separa visibilitat de dossier i booking; Bingo Musical KIDS entra com a producte infantil ofertable i els altaveus d'Isma entren com a cost intern de DJ sense sortir al dossier.
- **#1724**: dossiers amaga columnes buides, rehidrata imatges de snapshots, afegeix imatges infantils a portfolio/Bingo KIDS, separa DJ continuacio amb equip muntat, desglossa desplaçament llarg i blinda hard-delete de col·laboradors/productes amb auditoria BD.
- **#1725**: Bingo Musical KIDS guanya asset propi amb presentador; portfolio rep seleccio manual de 174 imatges locals sense publicar cares infantils identificables.
- **#1726**: Bingo Musical KIDS, Bingo Musical adult i Batalla Musical reben candidates millors; KIDS passa a JPG amb canalla pixelada i BD/seed alineats.
- **#1727**: Portfolio afegeix pestanya `Imatges`, drop-in per categoria i comptadors que no fan zero fals abans de carregar l'estat editable.
- **#1728**: la fitxa del lead mostra repartiment estimat pre-reserva reutilitzant `computeBoloRepartiment`, sense crear segona veritat.
- **#1729**: `Qui cobra què` del lead incorpora transport, vehicle, hores de ruta, peatges i dietes; el dossier hereta `tollsEur`.
- **#1730**: el repartiment separa caixa bruta d'Òrbita, cost intern i benefici net real; booking/cuadrant/payout deixen de confondre brut amb marge.
- **#1731**: `Qui cobra què` queda ancorat, visible des del rail i llegible en mòbil amb labels per cel·la.
- **#1732**: aquest roadmap queda sincronitzat amb la ronda #1725-#1731 i converteix la següent auditoria en talls probables verificables.
- **#1733**: el pas lead -> nova reserva preserva `hours` i `partyType` en mapper, submit, càrrega de lead i herència server-side, evitant que planning/cuadrant perdin durada o audiència.
- **#1734**: seleccionar un lead des del cercador del generador de dossiers també omple `travelKm` i `travelTollsEur`, no només el prefill per URL amb `leadId`.
- **#1735**: l'email/PDF de dossier pot rehidratar `tollsEur` del lead encara que el snapshot antic ja tingui productes congelats però no peatges.
- **#1736**: el PDF compost de dossier rep el transport resolt i afegeix pàgina de desplaçament quan hi ha km, alineant-lo amb l'email/HTML.
- **#1737**: `costEngine` ignora línies `[travel-cost]` quan ja hi ha `booking.travelCost`, evitant duplicar el cost de ruta en Economia, dashboard, cashflow, rendibilitat i calendari.
- **#1738**: el lead converteix `Qui cobra què` en `Pacte amb partner`: visible només el pacte del partner amb fórmula de ruta, hores pagades, dietes i peatges; net/brut/cost d'Òrbita queda plegat internament.
- **#1739**: les previews HTML `blob:` del dossier absolutitzen imatges amb l'origen actual, de manera que productes Masquerade tornen a mostrar assets reals en pestanya nova.
- **#1740**: el dossier comparteix un ordre editorial HTML/PDF que posa experiències visuals abans d'extres/equipament i fa que els contenidors d'imatge siguin responsius amb `contain`, sense retallar cossos ni presentacions verticals.
- **#1741**: el transport llarg deixa de restar la franquícia local al vehicle del client; si la ruta supera 25 km per sentit, el client veu i paga la mateixa base de km que es liquida a qui posa el cotxe, mentre la primera hora de persones continua inclosa.
- **#1742**: el lead compacta desplaçament i pacte partner: vehicle `km - 50`, persones `hores - 1 h`, dietes només si `km > 150`, i lectura presentable per Masquerade.
- **#1743**: el handoff lead -> reserva conserva les línies ocultes `[travel-cost]` pactades i el preu visible de nova reserva suma peatges.
- **#1744**: el generador de dossiers conserva les línies ocultes `[travel-cost]` quan sincronitza productes cap al lead, evitant esborrar la liquidació de ruta abans de crear reserva.
- **#1745**: el lead deixa de mostrar auditoria interna al pacte i sintetitza desplaçament/marge en lectures agregades; el dossier HTML/PDF i el generador mostren imatges completes amb `contain`.
- **#1746**: `Crear dossier` al lead reutilitza l'API canònica de draft i obre el PDF compost directament; les imatges del dossier perden la capsa quadrada rígida i es veuen senceres per regla global, sense excepcions per producte.
- **#1747**: el pacte del partner queda en tres files (`Bingo Musical`, `Ruta`, `Compensació a Òrbita`) i el Bingo Musical adult apunta a la portada editorial `bingo-musical-cover.jpg` tant al seed com a la BD configurada.
- **#1748**: la creació de dossier queda unificada: lead, botó de draft i generador passen per `POST /api/admin/dossiers` amb `leadId`, i el generador ja no construeix snapshots manuals divergents.
- **#1749**: el vell endpoint `draft-from-lead` desapareix, el lead mostra ruta en frase i partner plegat, i la jerarquia d'accions posa `Crear dossier` abans de pressupost/reserva.
- **#1681**: els recordatoris de pagament d'Economia marquen nomes Email, WA API o registre manual quan falla aquell canal.
- **#1682**: la copia del link Stripe deixa de fallar en silenci i marca nomes el boto de copiar del tram afectat.
- **#1683**: referrals mostra error accessible si copiar missatge suggerit falla i marca nomes aquell candidat.
- **#1684**: reactivacio de clients mostra error accessible si copiar missatge suggerit falla i marca nomes aquell candidat.
- **#1685**: reengagement de leads mostra error accessible si copiar missatge suggerit falla i marca nomes aquell lead.
- **#1686**: scripts mostra error accessible si copiar una comanda falla i marca nomes aquella comanda.
- **#1687**: Safata mostra error accessible si marcar un lead com llegit/no llegit falla i no aplica estat fals.
- **#1688**: Safata mostra error accessible si l'autolectura NEW -> CONTACTED falla en seleccionar un lead nou.
- **#1689**: Safata mostra error accessible si l'auto-refresh de leads falla i evita que una llista desactualitzada sembli fresca.
- **#1691**: generador de dossiers mostra error si falla el lookup de clients i no converteix la fallada en "cap coincidència" abans de crear lead/client.
- **#1692**: generador de dossiers mostra error si no pot importar línies de servei del lead i no confon la fallada amb una configuració buida.
- **#1694**: Pressupostos mostra error si falla cercar client, lead o reserva per reassignar un pressupost, sense confondre fallada amb zero resultats.
- **#1695**: generador de dossiers mostra error si falla cercar leads existents i tanca el patró de `return` silenciós a `app/admin` fora de `tasks`.
- **#1696**: Studio de pressupostos mostra error si falla cercar clients i no converteix la lectura CRM fallida en "Cap resultat trobat".

### 7.5 Següents talls probables

1. **E2E lead -> dossier -> reserva.** Reproduir un lead real amb productes, desplaçament, peatges, dietes, imatges i pacte partner; #1733 blinda `hours`/`partyType`, #1734 blinda km/peatges en seleccionar lead dins del generador, #1735 blinda peatges en snapshots antics, #1736 alinea PDF compost amb email/HTML, #1738 explica el pacte partner, #1739 arregla previews blob amb imatges, #1740 ordena jerarquia/imatges responsives, #1741 alinea vehicle client amb liquidació de ruta llarga, #1743 conserva la liquidació oculta de ruta en crear reserva, #1744 evita que el dossier l'esborri en sincronitzar productes, #1745 força imatges completes al dossier, #1746 crea/obre el PDF directament des del lead, #1747 deixa el pacte en resum validable amb portada Bingo adulta viva, #1748 unifica el contracte de creació lead/generador i #1749 retira el cami redundant mentre deixa el lead en mode decisio. Falta verificar el cas complet fins a reserva final.
2. **Portfolio/media pipeline.** Provar drop-in per categoria, assets públics i productes Masquerade perquè cada imatge surt d'on toca: portfolio per galeria, producte per dossier, snapshot per documents ja enviats.
3. **Economia de bolos antics.** #1737 blinda la duplicació latent entre `travelCost` i línies `[travel-cost]`; el següent tall econòmic hauria de mirar riscos visibles de marge/cobrament, no migració de ruta sense evidència.
4. **Copilot de gestió.** Convertir els fallos reals detectats en accions executives a `Avui`, no en pantalles amagades: cobrament, marge, documents pendents, post-event i lead calent.

### 7.6 Stop rules

- No es toca `app/admin/tasks` mentre Claude el tingui reservat.
- No es canvia schema/migracio sense necessitat clara i prova.
- No es refa una pantalla sencera si una costura petita porta mes Zenit verificable.
- No es dona per "auditat" un front sense haver llegit codi viu i haver deixat evidencia.

## 8. Regla de continuacio

Cada tall de Zenit segueix aquest format:

1. Veredicte Manolo.
2. Prova al codi viu.
3. Tall petit pero real.
4. Tests i TypeScript.
5. Registre: diari, protocol, counter, sync.
6. Seguent front sense demanar "segueixo".

La superauditoria no s'acaba en aquest document. Aquest document es el comandament per
seguir treballant tota la nit: auditar, millorar, provar, tornar a millorar.
