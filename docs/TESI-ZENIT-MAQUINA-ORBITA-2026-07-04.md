# Tesi zenit de la maquina Orbita

> Data: 2026-07-04
> Estat: document estrategic de decisio, no implementacio
> Abast: negoci, producte, operacio, economia, documents, PDFs, partners, automatitzacio i post-event
> Relacio amb documents previs: continua `DIAGNOSTIC-I-FULL-DE-RUTA.md`, `product-operating-system-ca.md` i `TESI-MAQUINA-full-de-ruta-2026-07.md`. No els substitueix; els puja una capa.

## 0. Per que existeix aquest document

El propietari ha demanat una mirada de maxim nivell: vertical, horitzontal i diagonal; de
l'entrada del lead fins a l'ultima operacio post-event; amb preus, marges, presentacio,
documents, PDF, simplificacio, dinamitzacio i automatitzacio.

Aixo no s'ha de resoldre amb una feature. S'ha de resoldre amb una tesi de sistema.

La pregunta real no es: "quina pantalla falta?". La pregunta real es:

> Com ha de funcionar Orbita per vendre mes be, perdre menys marge, operar amb menys soroll,
> presentar-se millor, cobrar millor i convertir cada bolo fet en el proxim lead barat?

Aquest document deixa escrit el mapa d'opcions. Despres cada opcio es pot convertir en un
canvi numerat, petit i verificable.

## 1. Tesi principal

Orbita no es una web amb un admin. Es un sistema operatiu vertical per a una empresa
d'esdeveniments petita, amb un propietari que ha de fer de comercial, operador, financer,
productor, relacions publiques i director de marca.

La maquina bona no es la que te mes pantalles. La maquina bona es la que redueix el nombre
de decisions que el propietari ha de carregar al cap.

Per tant, el zenit no es "automatitzar-ho tot". El zenit es:

1. Que el sistema vegi abans que tu el que importa.
2. Que el marge governi abans de dir que si.
3. Que els documents venguin sense ensenyar la cuina interna.
4. Que cada reserva sigui una operacio controlada, no una memoria oral.
5. Que cada client content alimenti el seguent client.
6. Que les automatitzacions tinguin fre huma quan surten cap al client.
7. Que una sola veritat travessi lead, dossier, reserva, cobrament i post-event.

La millor versio d'Orbita no es un ERP gran. Es un copilot petit, molt fi, que protegeix
temps, marge, caixa i reputacio.

## 2. Les tres dimensions de l'auditoria

### 2.1 Vertical: el flux complet

La vertical mira el cicle com una cadena:

```
Lead entrant
  -> qualificacio
  -> proposta / dossier / PDF
  -> negociacio
  -> reserva
  -> preparacio
  -> bolo
  -> cobrament
  -> repartiment / partners
  -> post-event
  -> ressenya / testimoni / referral / portfolio
  -> nou lead
```

Objectiu: que cap etapa trenqui la veritat anterior ni faci repetir feina.

### 2.2 Horitzontal: els atributs que travessen totes les etapes

La horitzontal pregunta el mateix a cada etapa:

| Atribut | Pregunta |
|---|---|
| Dada | Quina informacio neix aqui i on es torna veritat final? |
| Preu | El client veu un preu clar, defensable i premium? |
| Marge | El sistema sap si aquest pas protegeix o crema marge? |
| Temps | Quanta feina humana demana aquest pas? |
| Risc | Que pot fallar sense fer soroll? |
| Document | Que queda escrit o enviat? |
| Presentacio | El que veu el client construeix confiança? |
| Operacio | Ajuda a preparar millor el bolo? |
| Automatitzacio | Pot anar sol, en esborrany, o necessita aprovacio? |
| Aprenentatge | Aquest pas alimenta decisions futures? |

Objectiu: que el sistema no sigui nomes un flux, sino una maquina amb criteri repetit.

### 2.3 Diagonal: escenaris reals

La diagonal no mira pantalles ni fases. Mira casos:

1. Client normal que entra per web i acaba contractant.
2. Lead fred que necessita seguiment.
3. Lead calent que demana resposta rapida.
4. Bolo lluny amb transport i poc marge.
5. Bolo de dissabte amb capacitat limitada.
6. Masquerade/Carlos et contracta a tu.
7. Tu revens un producte de Masquerade.
8. Bolo cobrat en efectiu el mateix dia.
9. Dossier amb productes propis + partner.
10. Event completat que hauria de generar ressenya, testimoni i referral.

Objectiu: detectar si el sistema aguanta la realitat, no nomes la teoria.

## 3. Estat actual despres dels ultims talls

Hi ha una dada important: la primera tesi ja no es un paper abstracte. Avui ja s'han
convertit peces en producte.

| Canvi | Estat actual |
|---|---|
| #1402 | `/admin` ja es pantalla "Avui" calmada; el dashboard exhaustiu viu a `/admin/control`. |
| #1403 | La home ja mostra leads a treballar avui per prioritat. |
| #1404 | La home ja mostra "Tanca el cercle" post-event pendent. |
| #1405-#1407 | Masquerade/Carlos ja te compte corrent bidireccional i cobrament cash-aware. |
| #1408 | `CLIENT_PARTNER` ja es operatiu a Partners i Masquerade es filtrable com a soci-client. |
| #1409 | El generador de dossiers ja mostra marge abans d'enviar. |
| #1410 | `/admin/dossiers` ja recomana leads sense dossier actiu. |
| #1411 | Els dossiers poden conservar foto immutable (`lineSnapshot`). |
| #1412 | Un lead recomanat ja pot generar un dossier `DRAFT` intern d'un clic. |
| #1413 | Aquesta tesi zenit fixa la separacio radiografia real -> zenit -> full de ruta. |
| #1414-#1415 | L'atles electric ja no es nomes cens: es manual operatiu viu del repo, fluxos, punts d'intervencio i cables. |
| #1416-#1417 | La radiografia visual runtime de l'admin ja te baseline global i visor viu a `/admin/docs/visual-audit`. |
| #1418 | El lead nou amb email real ja rep welcome automatic amb plantilla editable, `preferredLocale`, lock `dedupeKey` i fallback manual. |
| #1420 | `/admin/docs/master` ja es la porta unica: atles modular per capacitats de negoci que creua repo real, baseline visual, riscos, validacions i properes peces. |
| #1421 | La home `Avui` ja te guardia de dissabtes: `dayCollisionService` avisa dies amb 2+ bolos compromesos i separa presencia humana de xoc d'inventari. |

Per tant, el front viu ja no es "crear la base". La base s'esta convertint en maquina.
El front viu ara es pujar de nivell: criteri, automatitzacio segura, simplificacio i
govern economic.

## 4. Cadena vertical pas a pas

### 4.1 Entrada del lead

Funcio: captar demanda sense perdre origen, intencio ni urgencia.

El que ha d'existir com a veritat:
- origen del lead;
- servei desitjat;
- data i ubicacio;
- pressupost implicit o explicit;
- canal de resposta preferit;
- idioma;
- urgencia;
- primera hipotesi de marge.

Opcions de millora:
1. **Entrada minima perfecta**: formulari curt, pero amb dades que alimenten marge i dossier.
2. **Parser d'entrada lliure**: enganxar WhatsApp/email i que extregui data, lloc, servei i nom.
3. **Semafor instantani**: en entrar el lead, classificar-lo com `bo`, `dubtos`, `perillos`.
4. **Canal-first**: si ve per WhatsApp, resposta per WhatsApp; si ve per email, email.
5. **Origen economic**: cada lead entra amb canal per poder calcular CAC real.

Risc principal: captar leads sense dades suficients obliga el propietari a reconstruir el
context manualment.

### 4.2 Qualificacio

Funcio: decidir si val la pena treballar aquest lead i quin es el seguent moviment.

El sistema ja te scoring, SLA i prioritzacio. La pregunta ara es com fer que dirigeixin.

Opcions:
1. **Score visible a tot arreu**: no nomes a llista; tambe en lead, dossier i Avui.
2. **Seguent accio obligatoria**: cada lead o te una accio clara o esta tancat.
3. **Lead sense accio = problema**: cua diaria de leads oberts sense proper moviment.
4. **Descartar amb criteri**: si marge/transport/data fan mala pinta, suggerir "no perseguir".
5. **Resposta rapida segura**: primer missatge automatic o esborrany-a-punt segons risc.

Risc principal: el propietari sap massa i el sistema massa poc; si el sistema no transforma
scoring en accio, el scoring es decoratiu.

### 4.3 Proposta, dossier i PDF

Funcio: convertir una conversa en una oferta premium, coherent i rendible.

Principi:

> El client ha de veure valor, claredat i confiança. El propietari ha de veure marge, risc i
> cost. Mai al reves.

El dossier ha de vendre. La guardia economica ha de protegir. Son dues capes diferents.

Opcions:
1. **Dossier editorial premium**: document que explica experiencia, no una factura.
2. **Marge intern abans d'enviar**: ja iniciat amb #1409; ha de ser condicio de decisio.
3. **PDF immutable**: ja iniciat amb `lineSnapshot`; cada dossier enviat ha de ser prova.
4. **Annex comercial filtrat**: nomes serveis seleccionats, no cataleg sencer.
5. **Dossier auto-esborrany**: ja iniciat amb #1412; pendent fer-lo mes intel-ligent.
6. **Biblioteca de blocs**: testimonis, fotos, arguments i garanties segons tipus de bolo.
7. **Versio client vs versio interna**: el mateix bolo genera PDF bonic i fitxa economica.

Risc principal: que el PDF expliqui massa la cuina o massa poc el valor. Premium no vol dir
mes llarg; vol dir mes convincent.

### 4.4 Negociacio

Funcio: fer seguiment sense perseguir a cegues ni regalar marge.

Opcions:
1. **Cadencia recomanada**: T+1, T+3, T+7 segons score.
2. **Objeccions tipus**: preu, data, distancia, dubte de servei.
3. **Descompte amb fre**: si es baixa preu, el sistema mostra marge resultant.
4. **Alternativa rentable**: si el pressupost espanta, proposar retallar servei sense matar marge.
5. **Caducitat intel-ligent**: si es dissabte escas, la proposta caduca abans.

Risc principal: negociar contra el marge per por de perdre el bolo.

### 4.5 Tancament i reserva

Funcio: convertir el si comercial en veritat operativa.

Veritat final:
- la reserva es qui mana despres del si;
- el lead ja no ha de ser el lloc on es canvia la realitat final;
- les service lines es copien i la reserva passa a ser font del bolo.

Opcions:
1. **Gate de tancament**: no crear reserva sense data, lloc, serveis i cobrament clar.
2. **Deposits/efectiu segons cas**: si el normal es cash same-day, el sistema ho ha de reflectir.
3. **Contracte i portal**: generar sense repetir dades.
4. **Alertes de dissabtes**: `Avui` ja avisa si hi ha 2+ bolos el mateix dia; pendent elevar-ho al moment de crear/confirmar si la data ja esta ocupada.
5. **Reserva de partner-client**: Masquerade com a `billedCollaborator`, sense client final.

Risc principal: que la reserva sigui una copia parcial del lead i despres es desalinei.

### 4.6 Preparacio pre-event

Funcio: que el bolo arribi al dia de l'esdeveniment sense dependre de memoria.

Opcions:
1. **Checklist T-7 / T-2 / T-0**: tasques automaticament escalades.
2. **Inventari assignat**: el sistema proposa equip necessari i detecta conflictes.
3. **Crew guard**: qui va, quin rol fa i quin cost te.
4. **Ruta i temps**: transport com a cost operatiu, no negoci.
5. **Brief del bolo**: una sola fitxa imprimible/mobil amb el que importa aquell dia.

Risc principal: tenir dades al sistema pero no convertir-les en preparacio accionable.

### 4.7 Bolo i cobrament

Funcio: executar, cobrar i deixar rastre.

La realitat del negoci:
- normalment es cobra en efectiu el mateix dia;
- es estrany que no, pero pot passar;
- el sistema ha de fer be els dos casos.

Opcions:
1. **Botó cash same-day**: ja existeix i ja es reutilitza al compte corrent.
2. **Tancament de bolo**: "fet + cobrat + incidencies + material post-event".
3. **Incidencia economica**: si no s'ha cobrat, apareix a Avui i compte corrent.
4. **Foto/document del rebut**: opcional si cal evidencia.
5. **Repartiment immediat**: despres de completar, calcular qui cobra que.

Risc principal: que l'efectiu no quedi registrat i aparegui deute fals o marge fals.

### 4.8 Partners i Masquerade

Funcio: tractar una relacio externa amb dues direccions de diner.

Doctrina:
- Carlos Lucas i Masquerade son el mateix interlocutor.
- Quan ell et contracta, el teu client es Masquerade.
- Quan tu revens el seu servei, ell es proveidor.
- No es duplica fitxa.

Opcions:
1. **Compte corrent per partner**: ja iniciat; li dec / em deu / saldo.
2. **Filtre soci-client**: ja iniciat amb `CLIENT_PARTNER`.
3. **Regles de marge partner**: +20% sobre cost com a minim visible.
4. **Liquidacio mensual**: saldo net per partner, no moviments dispersos.
5. **Dossier amb annex partner**: el client veu valor, no la relacio interna.

Risc principal: barrejar client final de Masquerade amb client d'Orbita. Si el client real
es Masquerade, no s'ha de registrar el seu client final com si fos teu.

### 4.9 Post-event

Funcio: convertir un bolo fet en reputacio, contingut i nou negoci.

El post-event no es cortesia. Es CAC barat.

Opcions:
1. **Agraiment T+1**: automatic o esborrany segons tipus de client.
2. **Ressenya Google**: demanar quan l'experiencia encara es calenta.
3. **Testimoni**: si resposta positiva, demanar frase curta i permis.
4. **Referral**: client content -> conegut -> lead atribuït.
5. **Portfolio**: fotos/testimoni -> prova social -> SEO -> nou lead.
6. **Reactivacio**: aniversaris, empreses, escoles, ajuntaments.

Risc principal: pagar el CAC del primer client i no explotar el valor posterior.

## 5. Matriu economica: preus, marges i decisions

### 5.1 Doctrina de preu

1. El marge viu al producte propi, no al quilometre.
2. El transport ha de ser honest i cobrir cost, no vendre's com a negoci.
3. El partner ha de deixar markup suficient o no compensa el risc.
4. El dissabte es recurs escas i ha de tenir criteri propi.
5. El preu ha de defensar valor, no demanar perdo.

### 5.2 Classes de bolo

| Classe | Lectura | Decisio |
|---|---|---|
| Producte propi, marge alt | Ideal | Prioritzar, cuidar, repetir |
| Producte propi lluny | Pot ser bo si el producte paga el viatge | Alertar transport vs marge |
| Partner +20% net | Acceptable si ajuda relacio o complementa | No competir nomes per volum |
| Partner sota marge | Perillos | Repreuar o rebutjar |
| Dissabte baix marge | Cost d'oportunitat alt | Bloqueig/avis fort |
| Cash same-day | Normal operatiu | Registrar rapid, no fingir pendent |
| Client-partner | Doble direccio | Compte corrent, no client retail |

### 5.3 Guardarails recomanats

| Guardarail | Nivell |
|---|---|
| Marge net sota llindar | Avis abans d'enviar dossier |
| Partner sota +20% | Avis i suggeriment de PVP |
| Transport sota cost | Avis intern, no client-facing cru |
| Dissabte amb marge baix | Bloqueig tou: "segur que vols gastar aquest dissabte?" |
| Lead sense data o lloc | No generar proposta final |
| Reserva sense cobrament definit | Tasca de risc economic |
| Post-event sense accio | CAC perdut |

## 6. Matriu documental i PDF

### 6.1 Documents del sistema

| Document | Qui el veu | Funcio |
|---|---|---|
| Dossier | Client | Vendre experiencia i confiança |
| PDF complet | Client | Dossier + fitxes seleccionades |
| Pressupost | Client / intern | Formalitzar oferta |
| Contracte | Client | Compromis legal |
| Factura | Client / gestor | Cobrament i fiscalitat |
| Brief pre-event | Intern | Execucio sense memoria |
| Compte corrent partner | Intern | Saldo li dec / em deu |
| Informe post-event | Intern | Aprenentatge i material reutilitzable |
| Testimoni/portfolio | Public | Prova social i SEO |

### 6.2 Principis de presentacio

1. **El client no compra components; compra tranquil-litat.**
2. **El PDF no ha de semblar una taula interna.**
3. **El preu s'ha de veure clar, pero no despullar tota la cuina.**
4. **El marge mai es client-facing.**
5. **Les fotos i proves socials han de fer mes feina que els adjectius.**
6. **Un dossier enviat ha de quedar congelat.**
7. **El document ha de vendre el bolo concret, no tot el cataleg.**

### 6.3 Opcions de millora documental

1. Dossier per tipus d'esdeveniment amb blocs narratius diferents.
2. Annex de servei filtrat segons el que s'ofereix.
3. PDF intern paral-lel: marge, costos, riscos, checklist i seguiment.
4. Biblioteca de testimonis reutilitzables per context.
5. Portada amb senyal fort del client/event, no generic.
6. Comparativa de versions si es canvia una proposta.
7. Estat documental visible: esborrany, enviat, acceptat, caducat, substituit.

## 7. Automatitzacio: escala de risc

No tot s'ha d'automatitzar igual. La millor maquina no es la que envia coses sola sense
criteri; es la que sap quan pot actuar i quan ha de demanar aprovacio.

| Nivell | Nom | Que pot fer |
|---|---|---|
| 0 | Només lectura | Mostrar alertes, cues, score, marge |
| 1 | Esborrany intern | Crear dossier draft, resposta suggerida, checklist |
| 2 | Aprovar i enviar | Preparar email/WhatsApp i esperar clic huma |
| 3 | Automatic controlat | Enviar accions de baix risc amb opt-out i logs |
| 4 | Automatic fort | Nomes per operacions internes o comunicacions molt segures |

### 7.1 Automatitzacions segures ara

- Crear esborrany de dossier des d'un lead.
- Crear checklist pre-event.
- Crear tasques de cobrament pendent.
- Mostrar leads prioritaris.
- Mostrar post-event pendent.
- Marcar risc de marge abans d'enviar.
- Recalcular compte corrent de partner.

### 7.2 Automatitzacions amb aprovacio humana

- Enviar primer email a lead nou.
- Enviar dossier final.
- Enviar WhatsApp comercial.
- Demanar testimoni si el cas es delicat.
- Aplicar descompte o canviar preu.
- Rebutjar lead per marge.

### 7.3 Automatitzacions que poden anar soles amb bon guardrail

- Agraiment post-event estandard.
- Peticio de ressenya Google si event completat i sense incidencia.
- Recordatori intern de cobrament.
- Recordatori intern T-7/T-2.
- Reengagement de leads freds amb plantilla suau.

### 7.4 Automatitzacions perilloses

- Enviar pressupost amb marge baix sense avis.
- Enviar WhatsApp agressiu sense revisar.
- Confirmar reserva sense revisar capacitat.
- Assumir que un partner-client es client retail.
- Esborrar dades o fusionar clients sense traça.

## 8. Simplificacio: reduir soroll sense matar muscul

El diagnostic anterior ja va demostrar una cosa important: l'organisme no esta ple de
brossa facil d'esborrar. Moltes peces semblen mortes pero estan vives per alias, routes,
guards o crides indirectes.

Per tant, simplificar no vol dir esborrar a cegues.

Vol dir:

1. **Una entrada diaria**: Avui com a cockpit.
2. **Una veritat per etapa**: lead abans del si, booking despres del si.
3. **Una cua per intencio**: leads a treballar, dossiers a preparar, post-event pendent.
4. **Menys menu, mes context**: amagar el que no toca avui.
5. **Plegar detall tecnic**: mostrar decisio, no debug.
6. **Noms humans**: el propietari no ha de pensar com un programador.
7. **Eliminar nomes amb prova**: no matar codi viu per sensacio.

Opcions concretes:
- Mode "Avui" per defecte i "Control complet" per profunditat.
- Navegacio per organs, no per 93 pantalles.
- Fitxa de lead amb seguent millor accio sempre visible.
- Fitxa de reserva amb "que falta abans del bolo".
- Fitxa partner amb saldo i moviments, no llistes disperses.
- Post-event com a cua de diner futur, no apartat secundari.

## 9. Diagonals de prova

Aquestes diagonals haurien de ser els "casos d'examen" de la maquina.

### Diagonal A: client normal rentable

Entrada web -> lead amb data/lloc -> score alt -> dossier draft -> marge verd -> enviament
-> reserva -> checklist -> cash same-day -> agraiment -> ressenya -> portfolio.

La maquina passa si el propietari gairebe nomes revisa i aprova.

### Diagonal B: lead lluny i baix marge

Lead amb 400 km -> transport calculat -> marge just -> dossier mostra avis intern -> proposta
repreuada o rebutjada.

La maquina passa si evita un "si" que crema dissabte.

### Diagonal C: Masquerade et contracta

Reserva al calendari igual que qualsevol bolo -> `billedCollaborator=Masquerade` -> no client
final -> cobrament cash o pendent -> compte corrent actualitzat.

La maquina passa si no duplica Carlos/Masquerade ni inventa client final.

### Diagonal D: tu revens Masquerade

Lead client propi -> producte partner seleccionat -> cost intern i PVP +20 -> dossier bonic
-> reserva -> repartiment -> li dec a Masquerade.

La maquina passa si el client veu valor i tu veus marge.

### Diagonal E: dissabte escas

Lead per dissabte de temporada -> capacitat i marge consultats -> semafor de "val aquest
dissabte?" abans d'enviar.

La maquina passa si tracta el dissabte com inventari premium.

### Diagonal F: post-event amb client content

Booking completat -> sense incidencia -> agraiment -> ressenya -> testimoni -> referral
-> portfolio -> nou lead atribuit.

La maquina passa si el bolo no mor el dia que s'acaba.

## 10. Opcions de grans programes

### Opcio 1: Tesi total convertida en roadmap viu

Crear un "Atles Orbita" permanent que connecti fluxos, documents, cervells, riscos i
estat de cada onada. Es una opcio de govern, no de runtime.

Impacte: molt alt en claredat.
Risc: baix.
Quan: ara.

### Opcio 2: Copilot comercial segur

Passar de "el sistema recomana" a "el sistema prepara". Leads prioritaris, esborranys de
dossier, resposta suggerida, seguiment i aprovacio.

Impacte: alt en conversio.
Risc: mitja per comunicacions outward-facing.
Condicio: començar amb esborranys, no enviament silencios.

### Opcio 3: Guardia economica dura

Que cap proposta, reserva o dissabte escas avanci sense veure marge, transport, partner,
CAC i cost d'oportunitat.

Impacte: molt alt en diners.
Risc: baix si es intern.
Condicio: no duplicar calculs; tot des del cervell economic.

### Opcio 4: Document factory premium

Convertir dossier/PDF/contracte/brief/post-event en una cadena documental coherent: cada
document neix d'una mateixa veritat, pero parla diferent segons qui el veu.

Impacte: alt en percepcio i confiança.
Risc: mitja si es toca PDF sense proves visuals.
Condicio: snapshots, preview i captures.

### Opcio 5: Operativa pre-event sense memoria

Checklist, inventari, crew, ruta, cobrament, brief mobil i conflictes abans del bolo.

Impacte: alt en tranquil-litat i qualitat d'execucio.
Risc: baix-mitja.
Condicio: no fer una altra pantalla; integrar en reserva i Avui.

### Opcio 6: Volant post-event

Automatitzar el CAC barat: ressenya, testimoni, referral, portfolio, reactivacio.

Impacte: molt alt.
Risc: mitja si envia missatges; baix si comença amb cues i esborranys.
Condicio: separar client content de client amb incidencia.

### Opcio 7: Partner OS

Tractar partners com a sistema: proveidor, client-partner, referidor, compte corrent,
productes, dossiers i liquidacio.

Impacte: alt per Masquerade i escalabilitat.
Risc: baix si no es toca schema.
Condicio: una fitxa per interlocutor, mai duplicar persona/marca.

### Opcio 8: Navegacio per organs

Fer que el propietari no hagi de recordar 93 rutes. Entrar per Avui, Comercial, Operacions,
Documents, Finances, Partners i Post-event.

Impacte: alt en us real.
Risc: baix si es navegacio, no eliminacio.
Condicio: no amagar funcions necessaries sense alternativa.

## 11. Recomanacio zenit

La millor opcio no es triar una sola branca. Es executar en aquest ordre:

1. **Atles escrit i viu**: aquest document com a base, despres convertit en mapa operatiu.
2. **Copilot comercial segur**: leads -> esborrany -> aprovacio -> enviament.
3. **Guardia economica dura**: marge i dissabte abans de comprometre's.
4. **Document factory premium**: tot PDF/document amb snapshot, rol i intencio.
5. **Operativa pre-event**: checklist, inventari, crew, ruta i cash.
6. **Volant post-event**: ressenya, testimoni, referral i portfolio.
7. **Partner OS**: Masquerade com a cas model i despres generalitzar.
8. **Simplificacio de navegacio**: menys superficie mental, mateixa potencia interna.

## 12. La frase final

El zenit d'Orbita no es tenir-ho tot automatitzat. Es tenir una maquina que sap quan ha de
fer, quan ha de preparar, quan ha d'avisar i quan ha de callar.

La web atrau.
El dossier convenç.
El marge decideix.
La reserva governa.
El calendari protegeix.
El cobrament tanca.
El post-event torna a obrir el cercle.

Quan aquests set verbs funcionen com una sola frase, Orbita deixa de ser un admin gran i
passa a ser un sistema de direccio.
