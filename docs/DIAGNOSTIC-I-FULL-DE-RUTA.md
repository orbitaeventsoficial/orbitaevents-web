# Òrbita Events — Diagnòstic d'enginyeria i full de ruta

> **Per a qui entra de nou.** Aquest document el llegeixes PRIMER. No és un protocol ni
> una llista de regles: és la radiografia honesta de l'organisme i el camí cap endavant,
> escrita amb criteri d'enginyer sènior. Quan l'acabis, has d'entendre tres coses: **què
> és**, **com és de gran i complex de debò**, i **què s'ha de fer i en quin ordre**.
>
> Escrit: 2026-06-28, després d'una auditoria vertical de tot el flux de negoci.

---

## 1. Què és Òrbita Events

Una empresa real d'animació i serveis per a esdeveniments (festes, bodes, discomòbil,
empreses). El programari té **dues meitats**:

- **La web pública** (`orbitaevents.com`) — **atrau i ven**. Homepage, serveis, packs,
  portfolio, blog, configurador, contacte. SEO, conversió.
- **L'admin** (`/admin`) — **governa**. CRM, reserves, economia, calendari, comunicacions,
  catàleg, partners, post-event, documents (PDF), portal del client. És el cervell operatiu.

La frase que ho resumeix tot, i que has de tenir present sempre: **«la web atrau i ven;
l'admin governa».** No són dos projectes — són **un sol organisme** amb una sola veritat
de dades al darrere (Prisma + PostgreSQL).

---

## 2. La mida real de la bèstia (números, 2026-06-28)

| Dimensió | Quantitat | Lectura |
|---|---|---|
| Pàgines admin | **93** | Cadascuna és una pantalla amb estat, accions, dades |
| Pàgines públiques | **72** | Web de venda + portal del client |
| Rutes API | **217** | Tota la lògica passa per aquí |
| Serveis (`lib/services`) | **193** | El múscul: càlculs, queries, integracions |
| Models de BD (Prisma) | **63** | El domini complet |
| Migracions aplicades | **50** | Història de l'esquema |
| Crons / automatismes | **14** | El que passa sol cada dia |
| Components admin | **357** | Les peces de UI |
| Fitxers de test | **526** | Cobertura real (~5.000 tests) |
| Guards de qualitat (`validate:core`) | **68** | QA estructural automàtic |
| Línies de TS/TSX (app+lib) | **~79.400** | La superfície de codi |
| Canvis registrats (`ADMIN_CHANGE_COUNTER`) | **1.197** | El volum de feina acumulada |

**Conclusió de la mida:** això NO és un MVP ni un projecte petit. És una aplicació de
gestió completa, de mida d'empresa, construïda majoritàriament per una persona al llarg
de molt de temps. La complexitat és **real i alta**. Qualsevol que la subestimi (humà o
IA) prendrà decisions equivocades.

---

## 3. El diagnòstic honest

### 3.1 El que funciona de debò (el motor és fiable)
Després d'auditar el flux econòmic i de pagaments de punta a punta:
- **El càlcul de diners és sòlid.** Marge, IVA, total, cost (pack/línies/extres/viatge)
  surten d'una **font única** (`costEngine`), blindada per guard, amb ~80 tests. Els
  números no menteixen.
- **Els pagaments són robustos.** Stripe (webhook atòmic + idempotent), Bizum (declarar +
  confirmar), efectiu — els tres mètodes tanquen el cercle correctament.
- **L'arquitectura de comunicació és bona.** Escriptures via helpers tipats, timeline
  unificada canònica, lògica de «qui ha de respondre» correcta.
- **La base de qualitat és seriosa.** 68 guards + ~5.000 tests + CI. Pocs projectes
  d'aquesta mida tenen aquesta xarxa.

### 3.1.bis 📊 DADA EMPÍRICA — què s'usa de debò (de l'`adminLog`, 2026-06-28)
Anàlisi de 457 registres d'`adminLog` (accions reals sobre el sistema):
- **Accions humanes concentrades en 2 entitats:** `booking` (142 UPDATE + creacions/portal) i
  `lead` (50 UPDATE + 12 CREATE + comms). **~95% de tota l'activitat humana.**
- La resta del sistema (clients, inventari, packs, col·laboradors, màrqueting, reporting,
  documents…) **no rep cap acció humana registrada**; només hi ha automatismes (pricing
  check, fuel refresh, alertes) que corren sols.

**Conclusió:** el «10-20% que el propietari usa» té nom — **és LEADS → RESERVES.** És
l'empresa en funcionament real. (Caveat: `adminLog` registra escriptures, no visites.)

**MATÍS CRÍTIC del propietari (2026-06-28):** *no* usa només el 20% perquè no necessiti la
resta. Usa el 20% **perquè la resta té ERRADES o coses a mig fer (manques)** — i perquè,
com a **novell sense experiència**, un sistema de 93 pàgines és **inabastable mentalment**.
Vol usar el 80% restant; no pot, perquè falla o està incomplet.

**Implicació operativa (corregida):**
1. **NO desjerarquitzar/amagar la perifèria** — el propietari la vol. L'objectiu és el
   contrari: **fer-la funcionar** perquè passi del 20% al 100% d'ús.
2. **La feina central = caça d'ERRADES i MANQUES**, àrea per àrea, arreglant a mesura, fins
   que cada funció sigui de confiança i usable. (És exactament el que fan les auditories
   verticals: troben «errades o manques» — vegeu §6 i el resultat #1187-1197.)
3. **CLAREDAT per al novell** — mapes, noms, navegació entenedora, perquè un sol cap sense
   experiència pugui abastar i confiar en l'organisme.
4. El cor (lead→reserva) ja és sòlid; l'expansió va cap a les àrees adjacents trencades.

### 3.2 La tensió central (el que el propietari viu cada dia)
> «Estic en proves. Uso la interfície al **10-20%** perquè **encara no és fiable** i és
> **molt extensa**.»

Aquesta frase és el diagnòstic. El problema NO és que el motor falli — és que hi ha
**massa superfície i massa duplicació**, i això fa que no et puguis refiar del conjunt.

### 3.3 El patró arrel (la causa de l'extensió i la poca fiabilitat)
**Sistemes nous construïts AL COSTAT dels vells, sense retirar els vells.**

Aquest patró apareix a **totes** les verticals auditades:
| On | Sistema viu | Sistema vell (no retirat) |
|---|---|---|
| Repartiment de col·laboradors | línies de servei (+20%) | comissions `CollaboratorBooking` (buit) → **retirat #1196** |
| Feedback post-event | valoració (enviada) | enquesta (sense via) → **cablejada #1195** |
| Timeline de comunicació | versió canònica | `buildCommTimeline` raw → **retirat #1197** |
| Privacitat (RGPD) | funcions de llista admin | funcions per-entitat originals (òrfenes) |
| Gestió del hero | gestor d'imatges unificat | `heroVideoService` (5 funcions mortes) |

I a nivell de codi: **79 funcions de `lib/` estan òrfenes** (existeixen però cap pantalla
les crida). Moltes NO són «codi mort» — són **capacitats construïdes que no es van acabar
de connectar**. Inventari complet: `docs/audit/inventari-funcions-orfenes.md`.

**Per què passa això** (sense culpa): quan construeixes sol durant molt de temps, fas la
feature nova i no sempre tens temps de retirar/connectar la vella. Cada iteració deixa un
pòsit. Multiplicat per 1.197 canvis = capes acumulades. És natural; ara toca drenar-les.

---

## 4. El full de ruta (criteri d'enginyer sènior)

### Principi rector (per damunt de tot)
> **UNA capacitat = UN camí. Consolidar abans que afegir. Fiabilitat abans que features.**
> Mai dos sistemes per a la mateixa cosa. En fase de proves, **reduir superfície** és
> més valuós que afegir-ne.

**El mandat del cervell (propietari, 2026-06-28).** El projecte és **madur**; les coses
canvien i cada cop cal més precisió. La feina d'ara és, en aquest ordre i amb aquestes
paraules:
1. **Entendre els fluxos verticals molt i molt bé** (front→back→BD, totes les branques).
2. **Afinar** — precisió, no aproximació.
3. **Cosir molt bé** — el cablejat entre òrgans ha de fluir i tenir sentit.
4. **Passar la llijadora** — treure el sobrant: duplicació, òrfenes, capes velles.
5. **Si cal refer, es refà** — i **es treu la porqueria sobrant**. No es conserva pes mort
   per por; es reconstrueix net on calgui.

Autoritat: el cervell POT reconstruir i eliminar (amb la regla d'or: verificar que el que
es manté fa la mateixa feina o millor; i validació real abans de tancar).

Estem en el moment ÒPTIM per consolidar: com que la dependència de producció és baixa
(10-20%), es pot netejar agressivament sense trencar feina real.

### Fase 0 — Base (✅ majoritàriament feta)
Guards, tests, CI, font única de càlcul. **Ja hi és.** No s'hi torna si no es trenca.

### Fase 1 — VERTICALS: consolidar el flux de negoci (🔶 en curs)
Auditar cada flux end-to-end (front+back) i deixar **una sola via** per capacitat. Ja
fetes les 5 verticals (econòmica, post-event, comunicació, client/portal, catàleg→preu).
Pendent: **executar les decisions de consolidació** que les verticals han destapat
(retirar duplicats, connectar capacitats òrfenes que es volen). Mètode provat: §7.

### Fase 2 — ÒRFENES: connectar o eliminar (⬜ — REPRIORITZAT A BAIXA, veure aprenentatge)
Per cada una de les 79 funcions òrfenes, decisió binària amb el propietari:
- **Connectar** (refer) si és una capacitat que es vol → enganxar-la al camí viu, **no
  fer-ne un de nou**. Si la via viva es queda curta, **estendre-la** perquè sigui un
  superconjunt (ex: afegir filtre per client a `listConsents`), no duplicar.
- **Eliminar** (matar) si no es vol → fora, amb verificació (la migració de comissions
  #1196 és el patró: verificar 0 dades, mapejar usos, eliminar per capes).

⚠️ **Regla d'or abans de matar:** comprovar que el que es manté fa la MATEIXA feina (o
millor) que el que s'elimina. (Lliçó real: la «substitució» de privacy NO cobria els
casos per-entitat — gairebé res era un kill net.)

> ### 🧠 APRENENTATGE DEL CERVELL (2026-06-28) — la cacera de codi mort és de BAIX RENDIMENT
> Després de traçar a fons múltiples candidats a «codi mort» (privacy, hero, els 5
> «penjats» del transversal: financeAlerts, holded, responseTracking, signature,
> translation), **gairebé tots han resultat VIUS**. L'ús real s'amaga darrere de:
> (a) crides **lib→lib** (un servei en crida un altre), (b) **alias** re-exportats,
> (c) **endpoints HTTP** cridats des del frontend amb un string (`fetch('/api/...')`),
> invisibles a qualsevol anàlisi estàtica de funcions.
>
> **Conclusió:** aquest codi té MOLT menys codi mort del que diuen les mètriques. La
> superfície és gran però **viva**. Perseguir funcions òrfenes una a una = molt esforç,
> molt risc de trencar coses vives, i guany mínim. **S'ATURA com a estratègia principal.**
> Només s'elimina una funció quan se n'ha traçat la cadena completa (funció → alias →
> route → fetch) i és buida de debò (com `buildCommTimeline`, #1197).
>
> **La palanca real NO és esborrar — és:** (1) **fiabilitzar** els fluxos que el propietari
> usa de debò (el 10-20%), (2) **reduir superfície** amagant/simplificant el perifèric que
> no usa (l'admin té 93 pàgines), (3) **consolidar** la fragmentació del CRM (36 serveis),
> l'únic clúster on combinar té valor real i és al flux central.
>
> **Igual de important — què NO cal tocar:** clústers que funcionen i tenen poc valor de
> canvi (p. ex. els 3 serveis de protocol intern → 1 sola pàgina): fusionar-los seria
> soroll sense benefici per a l'usuari. Es queden. *Millorar ≠ remenar.*

> ### 🧠🧠 CONCLUSIÓ ESTRATÈGICA DEFINITIVA (2026-06-28) — l'organisme és VIU, no inflat
> S'han verificat a fons **5 hipòtesis de «sobrant»** consecutives: (1) funcions privacy
> «substituïdes», (2) els 5 serveis «penjats» del transversal, (3) leadActivity vs
> customerActivity, (4) el trio de snapshots de lead, (5) els 26 docs «vells».
> **Resultat: 5 de 5 eren VIUS o distints.** Fins i tot 6 docs «vells» estan cablejats a
> GUARDS (`check-visual-identity-bridge`, `check-product-operating-system`,
> `check-dead-admin-views`) i scripts de seed — moure'ls trencaria el QA.
>
> **DIAGNÒSTIC REAL DEL PROJECTE:** no està inflat de brossa — està **densament
> interconnectat i viu**. La sensació de «massa extens» és real, però és **múscul cablejat,
> no greix**. «Reduir esborrant» és el model mental EQUIVOCAT aquí: gairebé res és
> eliminable amb seguretat, i el que ho sembla amaga l'ús darrere d'alias, endpoints HTTP,
> crides lib→lib o guards.
>
> **PER TANT, les úniques palanques vàlides (que milloren sense trencar):**
> 1. **CLAREDAT** — mapes (atles), noms menys confusos, índexs. El cervell ha de poder
>    abastar l'organisme. (Zero risc; pur guany.)
> 2. **FIABILITAT** dels fluxos que el propietari usa (el 10-20%) — afinar/cosir, no esborrar.
> 3. **REDUIR SUPERFÍCIE A LA UI** — amagar del menú les pàgines que no s'usen. Es decideix
>    a nivell de **navegació/visibilitat**, NO esborrant codi. Requereix input del propietari
>    (què uses / què no).
>
> **Queda PROHIBIT** (per haver-ho verificat 5 cops) tornar a obrir una campanya d'esborrat
> massiu de codi o docs «perquè sembla mort». Cada eliminació individual exigeix traçar la
> cadena completa (funció→alias→route→fetch / doc→guard→script) i provar que és buida.

### Fase 3 — FIABILITAT: del 10-20% al 100% de confiança (⬜, l'objectiu real)
Que cada flux que el propietari fa servir sigui **de confiança total**: estats buits,
errors amb feedback, dades que quadren entre pantalles, cap acció que no faci res.
Aquesta fase converteix «la uso poc perquè no me'n refio» en «la uso tota».

### Fase 4 — POLISH HORITZONTAL: disseny pàgina a pàgina (⬜)
Quan el motor sigui fiable: les 93 pàgines admin + PDFs + emails, contra els 7 eixos de
la «Sèrie Òrbita Events» (visual · coherència · canònic · monocapa · responsiu ·
corporatiu · tècnic) + tipografia/espaiat/copy. Mapa: `docs/audit/FULL-DE-RUTA-auditoria-disseny-admin.md`.

### L'ordre importa
Polir pantalles (Fase 4) abans de consolidar el motor (Fases 1-3) seria pintar parets
amb les canonades trencades. **Primer fiabilitat, després bellesa.**

---

## 5. Com treballar dins aquest organisme (per a qui hi entra)

1. **És UN organisme, no pàgines soltes.** Cada canvi s'avalua contra el conjunt: dades,
   cablejat entre òrgans, coherència de sèrie.
2. **Segueix el flux, no la pàgina.** Els bugs cars (diners, cablejat) no es veuen en una
   captura — surten seguint el recorregut front↔back. Per això les verticals funcionen.
3. **Font única, sempre.** Cap càlcul/label/llindar/color duplicat. Si existeix, consumeix-lo.
4. **Òrfena ≠ morta.** Abans d'esborrar, pregunta si és una capacitat demanada desconnectada.
5. **Documenta el que fas** (diari + counter + agent-sync) i **valida de debò** (no «compila»).
6. **Respecta les zones tancades** i la feina sense commit d'altres agents (worktree compartit).

---

## 6. El mètode d'auditoria vertical (el que ha donat valor)

Per a cada flux de negoci:
1. **Mapa de ramificacions** des del codi (els `if/else/switch` són les branques).
2. **Dades reals** (un bolo concret, p. ex. la Cristina) per recórrer cada branca.
3. **Front + back alhora** — la desconnexió entre ells és on viuen els bugs.
4. **Veredicte per branca** + arreglar el que és clar i segur, documentar el que necessita
   decisió de producte.

**Resultat d'aquesta tanda (auditoria vertical, #1187-1197):** 11 canvis, tots verds.
Forats reals destapats que no es veien i no petaven: 7 bolos guanyats sense reserva
(cobrats en efectiu, fora del sistema), cap manera de registrar efectiu, enquestes que no
arribaven, dos sistemes de repartiment, codi mort que enganyava. **Tots arreglats o
documentats.**

---

## 8. Mapa de documents — què és VIU i què és VELL

El projecte té 39 documents a `docs/`. Aquesta és la classificació canònica perquè ningú
(humà o IA) perdi temps llegint feina ja tancada. **La documentació té la mateixa malaltia
que el codi: massa superfície acumulada.** Per tant, una sola jerarquia:

### 🟢 CANÒNIC — la jerarquia de lectura (només aquests defineixen com es treballa)
| Document | Rol |
|---|---|
| `CLAUDE.md` | La LLEI: constitució, normes, patrons, zones protegides |
| `docs/DIAGNOSTIC-I-FULL-DE-RUTA.md` | **Aquest.** L'auditoria d'Opus + full de ruta. Llegir primer |
| `docs/admin-protocol.md` | Manual operatiu: §6 backlog viu + §9 història de canvis |
| `docs/admin-diary.md` | Registre cronològic del que s'ha fet i amb quina validació |
| `docs/agent-sync.md` | Coordinació entre agents (qui treballa en què ara) |
| `docs/agent-runtime-policy.json` | Política d'autonomia en format executable (guard) |
| `docs/protocol-executiu.md` | Resum operatiu curt (qui decideix què, què vol dir «fet») |
| `docs/estat-admin.md` | Dossier viu de l'estat de l'admin |

### 🟡 REFERÈNCIA VIVA — es consulten quan toca la seva zona (no per treballar en general)
`admin-build-method.md` (els 7 eixos de disseny) · `admin-inventari-pagines.md` (mapa
migració) · `studio-fitxa-tecnica-handoff.md` + `studio-textos.md` (zona /studio protegida) ·
`docs/audit/**` (dossiers d'auditoria d'aquesta tanda: inventari d'òrfenes, full de ruta de
disseny).

### 🔴 VELL / ARXIU — feina tancada o superada (NO és guia de com treballar avui)
Tot handoff, checklist o inventari d'una iniciativa puntual ja tancada (juny-15 cap enrere
majoritàriament): `producte-zenit-full-de-ruta.md`, `lead-booking-canonical-bolo-roadmap.md`,
`bolo-flux.md`, `admin-organisme-atles.md`, `admin-esquema-absolut.md`, `fitxes-tipus.md`,
`tino-lloguer-seed.md`, `lead-fitxa-pantalla-negra.md`, `cuadrant-repartiment-concept.md`,
`REINICI-CHECKLIST.md`, `partners-platform-*.md`, `calendar-polish-pending.md`,
`admin-migration-checklist.md`, `studio-lab-*.md`, `admin-leads-funcions-inventari.md`,
`admin-booking-detail-rebuild-inventari.md`, `safata-*.md`, `inventari-recursos.md`,
`visual-identity-bridge-ca.md`, `rfc-timeline-event-polimorfic-ca.md`,
`product-operating-system-ca.md`, `runbook.md`, `guia-mobile-admin.md`,
`booking-kimera-vat-total-bug-handoff.md`, `admin-fitxes-pantalles.md`.

> **Regla:** un document 🔴 pot contenir context històric útil, però **no és font de veritat
> de com es treballa ara**. Si el seu contingut encara aplica, s'ha de pujar a un 🟢. Quan hi
> hagi temps, aquests es mouen a `docs/_arxiu/` (no s'esborren: git ja en guarda la història,
> però l'objectiu és reduir la superfície que cal llegir). Aplicar als docs el mateix principi
> que al codi: **una capacitat = un camí; consolidar abans que afegir.**

---

## 7. Resum en tres línies (si no llegeixes res més)

1. **És una aplicació de gestió gran i seriosa** (165 pàgines, 217 APIs, 63 models, ~79k
   línies), amb un **motor de negoci fiable** (càlculs, pagaments, tests, guards).
2. El problema no és el motor — és **massa superfície i sistemes duplicats** acumulats, que
   fan que el propietari només se'n refiï al 10-20%.
3. El camí: **consolidar (una capacitat = un camí), connectar el que falta, fiabilitzar el
   conjunt, i NOMÉS llavors polir el disseny.** Reduir abans que afegir.
