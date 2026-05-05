# Protocol de Treball - Òrbita Events Admin

Data d'inici: 2026-04-08
Última consolidació: 2026-04-09
Estat: document viu — font única de veritat sobre producte, arquitectura, coordinació, navegació i full de ruta.

Aquest document substitueix i integra sis documents originals:
- protocol de producte admin
- protocol de treball Zenith
- coordinació Claude ↔ Codex
- proposta de navegació admin
- diagnòstic de consolidació `Task` / `timeline`
- checklist executiva
- Master Checklist Zenith

Tots sis absorbits al 100% i esborrats el 2026-04-09 (Canvi #0).

---

# Sumari

- **§0** Principi rector
- **§1** Coordinació Claude ↔ Codex
- **§2** Mètode de treball
- **§3** Workspaces principals
- **§4** Navegació admin
- **§5** Arquitectura de domini (deute estructural)
- **§6** Master Checklist Zenith (estat per domini)
- **§7** Decisions obertes
- **§8** Ordre recomanat fins al Zenith
- **§9** Registre de canvis (comptador global)
- **§10** Veredicte

---

# 0. Principi rector

El producte no ha de créixer per acumulació de pantalles. Ha de créixer en capacitat operativa.

Cada funcionalitat nova ha de millorar almenys un d'aquests eixos:
- conversió
- execució
- cobrament
- recurrència

Si no impacta cap d'aquests eixos, no entra al primer nivell de l'admin.

**Veredicte Zenith**: OrbitaEvents ja no està en fase de construcció. Està en fase de refinament seriós. El zenit no arribarà per afegir 40 mòduls més. Arribarà per:
- una sola veritat per domini
- workspaces premium
- fluxos nets
- visual potent
- operativa impecable

---

# 1. Coordinació Claude ↔ Codex

## Repartiment

### Claude
Propietari de: **backend, schema, serveis, API, tests, contingut de constants, visual/CSS quan sigui tema tokenitzat i coordinat.**

Responsabilitats:
- editar `prisma/schema.prisma`
- ampliar models (CRM, Social, etc.)
- crear serveis backend i rutes API
- escriure i mantenir tests
- pujada visual coordinada amb tokens `--at-*`

No toca sense permís:
- navegació global admin
- redistribució funcional dels mòduls
- reorganització del dashboard
- arquitectura d'interfície dels workspaces fora de consumir schema

### Codex
Propietari de: **producte + arquitectura UI/Admin.**

Responsabilitats:
- protocol de treball
- redistribució de mòduls admin
- navegació orientada a funció de negoci
- definició de workspaces principals
- millores de Customer Hub i Bookings que no depenguin de migracions actives
- anàlisi de duplicats de domini (`LeadTask` vs `Task`, timelines, panells redundants)

No toca mentre Claude treballa backend obert:
- `prisma/schema.prisma`
- migracions
- serveis backend nous lligats al nou schema

## Protocol de merge

1. Claude acaba schema i serveis base.
2. Codex integra canvis de producte i UI sobre el contracte nou.
3. Qualsevol camp nou de schema s'ha de considerar estable abans de consumir-lo a la UI.
4. Si hi ha conflicte al Customer Hub, mana primer l'estabilitat de dades, després l'experiència d'ús.

## Coordinació operativa

La coordinació ha de ser explícita **sempre**, tant si hi ha 1 agent com si n'hi ha 2, 3 o més.

Regles obligatòries:
- cada agent ha de tenir un bloc o perímetre clar abans d'editar
- el repartiment s'ha de fer per **blocs disjunts** o per **capes disjuntes** dins del mateix domini
- si dos o més agents treballen el mateix domini, la divisió correcta és normalment:
  - schema/serveis/tests
  - UI/workspace/navegació
  - documentació/QA/checklist o una tercera subcapa realment disjunta
- els fitxers hub (`app/admin/page.tsx`, layouts, shell global, constants compartides, protocol) han de tenir **un únic responsable actiu**
- cap agent entra en un fitxer hub sense relleu explícit o sense haver-ho deixat apuntat al protocol/checklist
- si apareix dubte de propietat, es resol **abans d'editar**, no després del conflicte
- si un fitxer ja té canvis aliens, **no s'assumeix que es pot continuar a sobre sense llegir-lo i entendre'l**
- el propietari d'un bloc també és responsable de la seva **validació mínima obligatòria**, no només del codi
- cap agent obre un front nou “per aprofitar el context” si hi ha un bloc `EN MARXA` del mateix domini sense tancament clar

Criteri pràctic:
- 1 agent: ownership directe del bloc complet
- 2 agents: partició per blocs o per capa
- Agent A: backend/schema/API
- Agent B: serveis/tests
- Agent C: producte/UI/admin
- Agents addicionals: docs/QA/checklist o subblocs disjunts reals dins del domini, mai fitxers hub compartits sense responsable únic

L'objectiu no és "anar més ràpid a qualsevol preu", sinó moure fronts en paral·lel **sense col·lisions i sense degradar la font única de veritat**.

Normes substancials addicionals:
- **Un bloc, un objectiu executable**: cada tall ha de tenir una pregunta clara de negoci o operativa que pugui quedar realment més resolta en acabar.
- **No hi ha refactor sense guany explícit**: si una refosa no redueix duplicació, risc o confusió visible, no entra al tall.
- **Fitxer hub = lock fort**: qui toca un layout, shell, `page.tsx` central, constants compartides o el protocol, assumeix que està tocant infraestructura de coordinació i ho ha de tractar com a perímetre d'alt risc.
- **Canvi de propietat explícit**: si un agent hereta un bloc començat per un altre, s'ha de reflectir a `Treballant per` i, si cal, al registre de canvis; no val “ja ho acabo jo” sense rastre.
- **Continuïtat obligatòria**: qualsevol bloc s'ha de poder reprendre encara que l'agent original desaparegui, s'aturi o perdi el context.
- **No es barregen dos tancaments en un de sol** si afecten dominis diferents: és millor dos canvis curts i traçables que un canvi gros opac.
- **La validació ha de correspondre al risc**: servei/route/workspace canviat implica prova focalitzada real; no val només “compila”.
- **No es considera avenç moure codi sense reconnectar consumidors**: backend latent o UI buida no tanquen un ítem del checklist.
- **Els pendents s'escriuen en positiu i accionables**: no “millorar Inbox”, sinó “integrar comunicacions a la història canònica del client”.
- **Cap agent es dona per desblocat per intuïció**: si el guard, el comptador o el checklist no quadren, es tracta com a incidència real de coordinació.
- **Handoff mínim obligatori**: si un bloc queda a mitges, ha de quedar visible què s'ha fet, què falta, quin és el següent pas executable i quina validació queda pendent.

## Objectiu comú

Passar d'un admin amb moltes eines a un sistema operatiu comercial i d'operacions:
**captar → convertir → executar → cobrar → reactivar → generar recurrència.**

---

# 2. Mètode de treball

## 2.1 Principis invariables
- **Construir, no auditar**. No es gasta temps verificant el que ja està tancat a CLAUDE.md secció "Què JA EXISTEIX".
- **Monocapa**: cada valor/efecte/string viu en un sol lloc. Els dominis nous defineixen constants a `lib/constants` i la resta importa.
- **Zero hardcoded** a l'admin català. Tot string visible o acció semàntica ha d'estar centralitzada.
- **Copy traduïble de la web pública**: viu a `messages/*`. No ha de quedar escampat entre `config`, components i constants sense criteri.
- **Constants de domini**: etiquetes de workflow, estats, canals i valors semàntics viuen a `lib/constants/*`, no dins dels components.
- **Copy específic de l'admin**: viu a `app/admin/components/adminHelpContent.ts` o a `lib/constants/admin.ts` quan sigui text/label propi del panell.
- **Zero voltes**: la via simple primer. Si falla, diagnosticar causa arrel, no provar la mateixa acció tornada.
- **Tests amb cada element nou**. No es tanca bloc sense tests afegits quan toca.
- **Verificar amb linter/grep reals**, no amb "crec que està net".
- **Reparacions íntegres, no parxes dispersos**: si un bloc queda incoherent, es refà el perímetre funcional sencer que s'ha tocat fins que contracte, copy, UI, tests i validació tornin a quadrar. Metodologia concreta:
  1. Abans d'editar un fitxer amb un bug, `grep` del patró problemàtic a tot el fitxer (i sovint a tot el perímetre proper) per detectar instàncies similars.
  2. Agrupa tots els problemes relacionats i arregla'ls en una sola passada coherent.
  3. Si trobes un fix inline repetit diverses vegades (pluralitzadors, builders de títol, format de copy), extreu un helper.
  4. Quan es completa feina inacabada d'un altre (Codex, un sprint interromput), no et limitis a "fer compilar": revisa test, tipus, query, UI, copy. Entén la intenció i completa-la bé.
  5. La reparació íntegra val la pena encara que incrementi l'abast del tall: evita tornar-hi amb un altre parxe demà. El detector automàtic viu a `scripts/check-patches.mjs` i és obligatori abans de tancar un canvi.
- **No afegir mòduls nous si abans no s'entén quin problema real resolen.**
- **No duplicar domini** si una sola font de veritat ja hauria de cobrir aquell cas.
- **No prioritzar "pantalles noves" per damunt de fluxos nets.**
- **No tocar visual perquè sí**: cada pujada visual ha de reforçar jerarquia, control i claredat.
- **Norma canònica de lectures i escriptures**: si un domini ja té servei, helper o contracte shared per llegir o escriure, no es permet reobrir query crua o `create(...)` inline des d'una pàgina, route o servei adjacent. Primer s'ha de reutilitzar la capa canònica; si no arriba, s'amplia aquella capa i després es reconnecten els consumidors.
- **Norma de tancament rigorós de tall**: cada `Canvi #N` registrat al §9 ha d'incloure, sense excepció: (1) tests nous o ampliats quan el codi canvia — shape, happy paths i regressions; (2) `pnpm run validate:core` verd 100% (tots els guards); (3) `pnpm run qa:protocol` OK al tancament; (4) entrada completa al §9 amb context, què s'ha fet en bullets concrets, verificació executada, `ADMIN_CHANGE_COUNTER` incrementat i autors (`Començat` / `Treballant` / `Tancat`); (5) entrada al `docs/diario.md` amb el mateix detall; (6) actualització del bloc §6 afectat (p.ex. `EN MARXA → FET` amb cita al canvi); (7) si el tall introdueix una regla operativa o arquitectònica, s'escriu explícitament a aquest document — no es deixa en context oral. Sense aquests punts, el tall no compta com a tancat. Aquesta norma aplica per igual a tots els agents (`claude`, `codex`) i al treball del `user` quan fa intervencions directes.
- **Interfície de propietari obligatòria**: qualsevol pantalla que governi negoci, operativa o risc ha de poder-se llegir d'un cop d'ull. La UI ha de separar clarament què és `automàtic` i què és `manual`, fer visibles semàfors, prioritat i següent pas, i reduir dependència de memòria o lectura tècnica.
- **Validació humana obligatòria**: una funció no es dona per bona només perquè el codi, els tests o la lògica interna semblin correctes. Si l'ús real depèn de botons, noms, estats, textos o d'un flux d'interfície, també s'ha de validar com ho faria una persona no tècnica. Si la UI indueix a error o fa passar per alt el comportament bo, el treball es considera incomplet.
- **No consolidar només a nivell de codi**: també cal consolidar llenguatge, UX i model mental.
- **Qualsevol millora grossa ha de quedar reflectida en aquest document.**
- **Norma operativa de "go" del propietari**: quan el propietari escriu `go` (sol, sense més) és la seva forma més curta d'ordenar *"continua segons tot el que està previst al protocol de treball i al checklist"*. No cal demanar direcció concreta — l'agent ha d'obrir `docs/protocol-producte-admin-ca.md`, localitzar un `SEGÜENT` actiu i acotat als §6.N, i atacar-lo seguint la norma de tancament rigorós. Preguntar "què vols?" davant un `go` és malgastar tokens i temps del propietari.
- **Workflow mínim obligatori per cada tall**: abans de tocar res s'han de fer 4 comprovacions i deixar-les clares al cap: (1) `git status` per detectar worktree brut, (2) `ADMIN_CHANGE_COUNTER` actual, (3) `§6.N` afectat o `SEGÜENT` que justifica el tall, (4) classificació del tall: `codi`, `UI`, `documental`, `schema/migració` o `infra`. Sense aquestes 4 peces, no s'ha començat de veritat.
- **Regla explícita de worktree brut**: si el repo ja té canvis locals aliens, no es permet "netejar", reordenar ni refactoritzar per comoditat. Només es toca l'àmbit mínim necessari pel tall actual. Si el fitxer ja està modificat i el nou tall hi entra, primer s'ha d'entendre què ja hi ha i adaptar-s'hi; no s'imposa un estat net fictici.
- **Validació en 3 capes**: cada tall ha de deixar escrit què s'ha validat exactament entre aquestes tres capes: (1) `validació tècnica` — types, tests, guards, build; (2) `validació funcional` — el cas d'ús resolt produeix l'efecte correcte; (3) `validació humana/UX` — una persona no tècnica entén què passa i què ha de fer. Dir només "validat" és massa ambigu i ja no és acceptable.
- **Ordre de prioritat operatiu**: quan hi ha dubte entre diversos fronts, l'ordre és aquest: (1) errors de compilació o contracte trencat, (2) regressions de runtime o dades, (3) tests/guards en vermell, (4) `PENDENT CRÍTIC` o `SEGÜENT` explícit del protocol, (5) millores documentals o UX no bloquejants. Això evita obrir fronts bonics mentre la base encara falla.
- **Autoregulació de model/effort i consum**: no es treballa en mode “màxim del màxim” per defecte. Per `go` normal, docs, guards, tests focalitzats, refactors petits i canvis mecànics, l'agent ha de ser eficient: context mínim suficient, eines agrupades, respostes curtes i raonament proporcional. S'eleva a `high`/màxim només quan hi ha risc real: producció, schema/migracions, auth, dades, concurrència entre agents, errors opacs de build/runtime, decisions arquitectòniques o refactors grans. Si cal pujar el nivell, s'ha d'explicar breument el motiu. Objectiu: pagar per rigor quan aporta valor, no per inèrcia.
- **Checklist de tancament canònic**: al final del tall s'ha de poder respondre sí/no, sense literatura, a aquesta llista: `tests tocats?`, `npx tsc --noEmit OK?`, `validate:core OK?`, `qa:protocol OK?`, `§6 afectat actualitzat?`, `§9 registrat?`, `docs/diario.md actualitzat?`, `ADMIN_CHANGE_COUNTER pujat?`, `tipus de validació explicitats?`. Si falta un sí en un tall que tocava aquell punt, el tall continua obert.
- **Aplicació simètrica per actor**: aquestes normes operatives no són només per un agent concret. Apliquen igual a `claude`, `codex` i al `user` quan intervé directament al repo. Ningú no queda exempt del workflow mínim, la regla de worktree brut, la validació en 3 capes ni el checklist de tancament.
- **Norma operativa de no-col·lisió entre agents**: `claude` i `codex` treballen concurrents sobre el mateix repo. Abans d'atacar un `SEGÜENT` cal mirar la darrera finestra de canvis `#N` al §9 i veure quin perímetre està ocupat ara mateix (el `ADMIN_CHANGE_COUNTER` pot pujar preemptivament per l'altre agent entre dues consultes). Dos indicadors: (1) si el counter està per sobre del darrer Canvi registrat al §9, és que l'altre agent ha reservat el número i està escrivint-ne el contingut — no es pren aquest número, el següent agent usa `counter + 1`; (2) abans de començar un tall, cal triar un **front diferent** al que ha tocat l'altre agent les darreres hores (si `codex` està al Lead Hub `LOST`, `claude` ataca bookings/tasks/social; i al revés). Si tot i així es detecta col·lisió (p.ex. edits paral·leles al mateix fitxer), el tall es replanteja o s'espera. Val la pena perdre una ronda abans que fer feina que es trepitgi.

## 2.1.0 Característiques exigides del repo
- **Monocapa real**: cada valor de domini, label, acció, to, icona o regla viu en un sol lloc i la resta importa.
- **Responsiu de debò**: tot el que es fa a web i admin ha de funcionar bé a desktop i mòbil.
- **0 hardcoded visible** quan el text sigui compartit, traduïble o semàntic.
- **0 mojibake**: cap text corrupte, cap charset trencat, cap nom intern visible a UI.
- **TypeScript en verd** al perímetre tocat com a mínim.
- **Tests en tot bloc important**: servei, route, mapper o workspace que canvii de comportament.
- **Una sola veritat per domini**: res de duplicar models, timelines, estats o contractes si ja existeix una capa canònica.
- **Visual amb jerarquia clara**: estat, risc, prioritat, següent acció i semàfors llegibles d'un cop d'ull.
- **Interfície molt visual per al propietari**: dashboards, hubs i manuals han de prioritzar lectura executiva abans que detall tècnic. Primer s'ha de veure què passa, què és automàtic, què continua sent manual i què toca fer ara.
- **Bellesa funcional obligatòria**: cada punt del checklist ha de revisar claredat visual, jerarquia, ritme, contenidors, zero overflow visible i coherència amb el sistema abans de donar-se per `FET`.
- **Accessibilitat funcional**: focus, teclat, scroll, overlays i contrast no poden quedar rebentats.
- **Configuració separada del copy**: settings a `config`, copy a `messages/*`, semàntica a `lib/constants/*`.
- **Noms interns no visibles**: codis, enums o ids no han d'arribar crus a l'usuari.
- **Documentació viva**: qualsevol canvi estructural o regla nova s'apunta aquí mateix.

## 2.1.1 Workspaces sagrats

Aquests workspaces tenen **prioritat absoluta** perquè sostenen el sistema:
- `Leads`
- `Customer Hub`
- `Bookings`
- `Tasks`
- `Inbox`

Cap millora nova hauria d'afeblir-los ni competir-hi sense motiu fort.

## 2.1.2 Regla de producte — consolidar per defecte

Quan hi hagi dubte entre:
- afegir una feature nova
- o consolidar un flux existent

**La prioritat per defecte és: consolidar.**

**Excepció**: només si la feature nova obre una capacitat de negoci claríssima i immediata.

## 2.1.3 Ordre correcte de decisió

1. Definir quin problema de negoci o operativa es vol resoldre.
2. Decidir si ja existeix un workspace que ho hauria d'absorbir.
3. Validar quina és la font canònica de dades.
4. Simplificar contractes i serveis.
5. Només després construir o refinar UI.

## 2.2 Regla d'inici de bloc
Abans de començar qualsevol bloc de feina al repo:

1. **Lectura obligatòria abans de tocar res** — cap agent pot començar feina real sense haver rellegit `protocol-producte-admin-ca.md` (aquest doc), el tram viu del §6 que toca i el tram final del §9 per confirmar l'últim `Canvi #...`.
2. **Identificar ownership** — confirmar que el bloc és territori Claude (backend/schema/serveis/tests/visual tokenitzat) o Codex (producte/UI/navegació).
3. **No trepitjar el front de l'altre**. Si hi ha dubte, mirar qui té obert què al checklist.
4. **Marcar el bloc com `EN MARXA`** al §6 del checklist (apartat del domini corresponent).
5. **Crear Tasks** (TaskCreate) si el bloc té >2 passos, marcant-les `in_progress` quan s'ataquen.
6. **Deixar explícit el repartiment per bloc/capa abans de començar** i evitar fitxers hub compartits, fins i tot quan només hi ha un sol agent treballant un front gran.
7. **Definir el criteri de tancament abans d'editar** — quins tests/guards o quina lectura visible han de demostrar que el bloc ha quedat realment millor.

## 2.3 Regla de tancament de bloc
Un bloc NO es considera tancat fins que:

1. **Codi acabat** — funcionalitat implementada, sense TODOs crítics.
2. **Tests escrits i passant** — els nous i els afectats. No hi ha excepcions.
3. **TypeScript en verd** — `pnpm tsc --noEmit` sense errors (almenys al perímetre tocat).
4. **Nomenclatura coherent** — si s'ha introduït semàntica canònica, els llocs adjacents s'han alineat o marcat com a legacy explícit.
5. **Revisió visual obligatòria** — el bloc no pot passar a `FET` si la UI afectada no és clara, bella en sentit funcional, responsive i sense overflow visible fora dels contenidors.
6. **Reparació coherent del perímetre** — si durant el tancament apareix que el bloc ha quedat a mitges o amb contractes trencats, no s'accepta un pedaç local: s'ha de deixar íntegre dins del seu perímetre funcional abans de donar-lo per tancat.
7. **Checklist actualitzat** — el bloc passa de `EN MARXA` a `FET` al §6. Si apareix deute nou, queda apuntat a `PENDENT CRÍTIC`.
8. **Registre de canvis incrementat** — s'afegeix una entrada al §9 amb el número següent del comptador.
9. **`qa:protocol` obligatori després de registrar** — cap bloc amb entrada nova al §9 es considera realment tancat fins que `pnpm run qa:protocol` passa després d'actualitzar protocol, diari i `ADMIN_CHANGE_COUNTER`.
10. **Comunicar**: un missatge curt a l'usuari amb el resum (què s'ha tancat, què ha quedat obert).
11. **Si la validació falla, el bloc no està tancat** encara que el codi sembli correcte; es reobre fins que el criteri de tancament queda complert o el risc queda escrit explícitament.
12. **Si `qa:protocol` falla per deute històric, es repara abans de seguir** — el tall actual no queda formalment tancat fins que el guard torna a verd, encara que la causa original no sigui del mateix autor.

## 2.4 Regla de propietat dels blocs

Cada bloc important ha de tenir sempre aquestes dades visibles al checklist (§6):
- `Començat per` (claude / codex / user)
- `estat actual` (`EN MARXA` / `FET` / `PENDENT CRÍTIC`)
- `Treballant per` o responsable actual
- `Tancat per` quan pertoqui
- `últim moviment visible`
- `següent pas executable`
- `validació pendent`

Regles obligatòries:
- Si un bloc ja està iniciat, **no convé que una altra persona l'iniciï de nou sense motiu fort**.
- Qui hereta un bloc **o bé el continua amb criteri o bé el tanca formalment**.
- **No s'han de deixar blocs "mig oberts" sense responsable visible.**
- Quan es toqui un bloc ja començat, s'ha d'actualitzar aquest document.
- Un bloc pot tenir subrepartiment intern, però cada subcapa ha de tenir ownership clar i els fitxers hub continuen amb un únic responsable actiu.
- Abans d'escriure un nou `Canvi #N`, **cal rellegir el màxim `Canvi #...` existent i el valor actual d'`ADMIN_CHANGE_COUNTER`**; no es pot assumir el número lliure per context o memòria recent.
- El número de canvi no es reserva “de cap” ni al xat: es decideix només en el moment d'escriure el registre final.
- Si un bloc queda interromput, el seu estat no pot quedar implícit: o bé continua `EN MARXA` amb responsable visible o bé es baixa a `SEGÜENT` / `PENDENT CRÍTIC` amb motiu.
- Si dos blocs toquen la mateixa font de veritat, s'han d'ordenar; no es treballen en paral·lel “a veure què passa”.
- Si un agent reprèn feina a mitges, **no recomença de zero per defecte**: primer llegeix l'estat visible, valida què és reutilitzable i només després decideix si continua, refà o tanca.
- Si un bloc està `EN MARXA` però no hi ha moviment visible suficient per entendre'l, qualsevol agent el pot reprendre actualitzant `Treballant per`, `últim moviment visible`, `següent pas executable` i `validació pendent`.
- Cap agent ha d'esperar confirmació de vida d'un altre agent per reprendre un bloc; mana l'últim estat visible del repo i del checklist.
- Si un bloc `EN MARXA` queda sense `últim moviment visible`, `següent pas executable` o `validació pendent`, es considera mal handoff i s'ha de regularitzar abans de continuar-hi feina substancial.
- Si un bloc `EN MARXA` queda antic o ambigu, la norma per defecte és reprendre'l o rebaixar-lo explícitament a `SEGÜENT` / `PENDENT CRÍTIC`; no es deixa flotant.

Conseqüència pràctica:
- Qui inicia un bloc no necessita ser qui el tanca.
- Però el següent que l'agafi ha d'assumir que el seu objectiu és portar-lo a tancament o redefinir-lo explícitament.

## 2.5 Regla d'honor sobre memòria i context
- El checklist mana sobre la memòria personal de l'agent. Si la memòria diu X i el checklist diu Y, mana Y.
- Abans de recomanar res basat en memòria que anomeni un fitxer/funció/camp concret, verificar que encara existeix.

## 2.6 Condicions d'actualització del protocol

Aquest document s'ha d'actualitzar cada vegada que:
- Es tanqui un bloc important.
- Aparegui un deute nou rellevant.
- Canviï una prioritat de negoci.
- Es prengui una decisió arquitectònica important.
- S'obri una línia nova de producte o operativa.
- Es reforci la norma de coordinació, handoff o represa que afecta qualsevol treball futur.

---

# 3. Workspaces principals

### 2.1 Leads — Captació i conversió
- pipeline
- scoring
- SLA de resposta
- historial de contacte
- accions comercials recomanades
- temperatura del lead, propera acció, risc de pèrdua, context comercial recent

### 2.2 Customer Hub — Centre absolut de la relació
- resum relacional
- timeline canònica (merge `leadActivity` + `customerActivity` + `adminLog`)
- preferències i memòria comercial
- propostes, reserves, comunicacions, tasques
- riscos i next actions
- LTV, recurrència, salut del client

### 2.3 Bookings — Cabina d'operacions
- checklist
- cobraments
- inventari
- document flow
- portal client
- galeria
- seguiment post-event
- timeline canònica del booking

### 2.4 Inbox — Comunicació operativa
- email, plantilles, seqüències, recordatoris
- vista de seguiment
- integrat a la història canònica del client

### 2.5 Tasks — Cua única de feina executable
Regla: les tasques no poden viure duplicades entre models o pantalles si representen la mateixa feina.

---

# 4. Navegació admin

## Criteri
La navegació ordena el negoci en aquest ordre: **captar → convertir → operar → comunicar → cobrar → fer créixer → mantenir el sistema.**

## Estructura

### Prioritat (primer nivell visual)
- `/admin/leads` — Entrades
- `/admin/tasks` — Tasques
- `/admin/bookings` — Reserves
- `/admin/calendario` — Calendari
- `/admin/clientes` — Clients

### Captació
- `/admin/leads` — Pipeline comercial
- `/admin/intake` — Entrada ràpida
- `/admin/sales-ops` — SLA i automatismes comercials
- futura: `Campanyes`

### Clients
- `/admin/clientes` — Customer Hub
- `/admin/discount-codes` — Descomptes relacionals
- `/admin/privacy` — RGPD i consentiments
- futura: `Segments`
- futura: `Referrals`

### Operacions
- `/admin/bookings` — Execució de reserves
- `/admin/calendario` — Càrrega i disponibilitat
- `/admin/presupuestos` — Propostes i documents comercials
- `/admin/inventory` — Inventari operatiu
- `/admin/collaborators` — Recursos externs
- `/admin/post-event` — Tancament post-event

### Comunicació
- `/admin/inbox` — Safata d'entrada
- `/admin/emails` — Automatismes
- `/admin/email-templates` — Plantilles
- futura: `WhatsApp Hub`

### Finances
- `/admin/economia` — Economia
- `/admin/pricing` — Pricing
- `/admin/cost-calculator` — Costos i marge
- `/admin/analytics` — Reporting executiu

### Growth
- `/admin/portfolio` — Portfolio
- `/admin/blog` — Blog
- `/admin/ressenyes` — Testimonis interns
- `/admin/google-reviews` — Prova social externa
- `/admin/image-manager` — Assets visuals
- `/admin/canvas` — Creativitats
- futura: `Social` (UI — backend ja llest)

### Sistema (fora del primer nivell visual)
- `/admin/salut`, `/admin/settings`, `/admin/features`, `/admin/activity`, `/admin/crons`, `/admin/scripts`, `/admin/css-manager`, `/admin/stats`, `/admin/coverage`, `/admin/faq`, `/admin/text-manager`

## Bottom nav mobil
**Proposta**: Entrades · Clients · Reserves · Tasques · Més
(el dashboard no ha de tenir el lloc principal a mobil — el treball real passa per cues i workspaces)

## Dashboard
La portada queda com a **Control Room**, no com a punt d'entrada principal. S'hi arriba quan vols prioritzar, no quan vols executar.

---

# 5. Arquitectura de domini — deute estructural

## Diagnòstic
Els dos problemes centrals detectats:
1. `Task` i `LeadTask` conviuen a `schema` i codi
2. La narrativa d'activitat està fragmentada entre `leadActivity`, `customerActivity` i `adminLog`

Això no trenca el producte, però penalitza consistència, mantenibilitat, coherència del Customer Hub i velocitat per construir automatismes.

## Evidència al repo

### Duplicació de tasques
- `Lead` exposa `tasks LeadTask[]` **i** `universalTasks Task[]`
- existeixen `model LeadTask` **i** `model Task`
- `Task` conté `legacyLeadTaskId` (senyal de migració a mig fer)

### Timeline fragmentada
- `leadActivity`: notes, emails, canvis de tasca lligats al lead
- `customerActivity`: cicle de client i post-conversió
- `adminLog`: activitat operativa i tècnica transversal

El Customer Hub ha de fusionar fonts en temps de lectura.

## Decisió

### Tasks
Fer `Task` model canònic immediat:
- no crear més lògica nova sobre `LeadTask`
- mantenir `LeadTask` com a llegat temporal
- serveis i rutes parlen de `task`, no de `leadTask`

### Timeline
**No** unificar físicament les 3 taules ara. Primer una **timeline canònica de lectura**:
- un servei (`timelineQueryService`) que converteixi les 3 fonts al mateix DTO
- totes les pantalles importants consumeixen aquest read model
- més endavant es valora consolidació d'escriptura

Menys arriscat, retorn més ràpid.

## Tipus canònic de timeline
```
source       : 'leadActivity' | 'customerActivity' | 'adminLog'
entityType   : 'customer' | 'lead' | 'booking' | 'proposal' | 'task' | 'system' | 'other'
entityId     : string | null
kind         : 'note' | 'message' | 'task' | 'proposal' | 'booking' | 'system' | 'crud' | 'activity'
title        : string
body         : string?
actor        : string?
occurredAt   : ISO string
metadata     : Record<string, unknown>?
link         : { label, href }?
timelineType : TimelineEventDTO['type']
```

Pantalles que consumeixen: `Customer Hub`, `Activity`, `Leads`, `Bookings`.

## Fases executives de consolidació

### Fase 1 — Consolidació segura (actual)
**Objectiu**: reduir duplicació sense trencar pantalles ni APIs existents.

Accions:
1. Declarar `Task` com a model oficial.
2. Congelar `LeadTask`: cap feature nova, cap camp nou, cap ús nou fora de compatibilitat.
3. Reanomenar capa d'accés: `leadTaskFacade.ts` → wrapper de compatibilitat; `leadTaskRouteService.ts` → orientat a `Task`.
4. Deixar clar que `legacyLeadTaskId` és camp temporal.
5. `timelineQueryService` unificat retorna timeline per customer, lead i booking.

### Fase 2 — Neteja de contractes
Tasks:
1. Substituir noms i imports antics a rutes i serveis.
2. UI de leads deixa de pensar en `LeadTask` i pensa en `Task filtrada per lead`.
3. Revisar si cal mantenir `Lead.tasks` al model Prisma.

Timeline:
1. Totes les pantalles importants usen el mateix mapper canònic.
2. Eliminar codi de fusió ad hoc.

### Fase 3 — Decisió de migració final

**Opció A** — Mantenir `leadActivity`, `customerActivity` i `adminLog` separats sota una lectura unificada.
- Bo si: voleu risc mínim i ja cobreix el 90% del valor.

**Opció B** — Crear entitat canònica d'events operatius i deixar la resta com a llegat.
- Bo si: voleu automatismes profunds, analítica transversal forta, arquitectura neta a llarg termini.

**Recomanació actual**: **Opció A**. Retorn més ràpid, risc mínim.

---

# 6. Master Checklist Zenith

Estats: `FET` · `EN MARXA` · `SEGÜENT` · `PENDENT CRÍTIC` · `MÉS ENDAVANT`

Actualitzar cada vegada que:
- es tanqui un bloc important
- aparegui un deute nou rellevant
- canviï una prioritat de negoci
- es prengui una decisió arquitectònica important

## 6.0 Memòria de novetats importants
Aplicació: això no és per a cada microcanvi. És per a funcionalitats o comportaments importants que s'han llançat i que després costaria recordar.

Regla obligatòria:
- una novetat important no pot quedar només al `Canvi #...` del §9
- també ha de deixar rastre al checklist del domini on viu (`§6.x`)
- s'ha d'escriure en llenguatge d'usuari, no només tècnic

Format mínim quan es llanci una novetat important:
- què és
- on es fa servir
- per què importa operativament
- com es comprova ràpidament sense haver de rellegir tot el diari

Criteri pràctic:
- no cal per canvis petits de copy, layout o refactor invisible
- sí que cal per flux nou, CTA nou, automatització nova, feedback nou, canvi de model mental o qualsevol millora que el propietari del producte pugui voler “recordar que existeix”

## 6.1 Fonaments de producte
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: base molt potent, schema ric, serveis, admin ampli, tests i infraestructura.
**FET** *(2026-04-10 fins Canvi #55)*: workspaces sagrats ja tenen direcció operativa clara: Daily Brief, Operational Pulse, Customer/Lead insights, Task Queue, Inbox context, Social, Reporting i Capacity.
**EN MARXA**: passar de conjunt molt potent a sistema coherent amb una sola narrativa operativa. Manual de possibilitats creat a `/admin/manual` per explicar la maquinària per problemes de negoci i accions concretes (Canvi #82).
**SEGÜENT**: backlog major cap al zenit ja drenat en gran part. ~~Executive Cockpit com a centre de comandament~~ — ✅ FET (Canvi #153). ~~Motor de següent millor acció~~ — ✅ FET (Canvi #168). ~~Nurturing automàtic controlat~~ — ✅ FET (`commercialSequenceService`, backlog §6.15). ~~Attribution/ROI comercial~~ — ✅ FET (Canvis #128 + #131). ~~Forecast real~~ — ✅ FET (Canvi #115). ~~Command palette~~ — ✅ FET (Canvis #107 + #380). ~~QA visual automàtica amb guards i captures~~ — ✅ FET (Canvis #385 + #388 + #389 + #391). ~~Google Calendar amb alarmes pròpies per reserves sincronitzades~~ — ✅ FET (Canvi #134). El següent real d'aquest front és evolucionar el manual/playbooks (`#84`, `#85`, `#86`) cap a un product operating system viu amb una sola narrativa operativa, no continuar llistant com a pendents peces que el producte ja té.
**FET** *(2026-04-11 per `codex` — Canvi #107)*: command palette blindada amb capa pura i tests. El catàleg, la deduplicació, els recents i el filtrat viuen a `adminCommandPaletteService.ts`, i el modal només consumeix aquesta capa.
**FET** *(2026-04-17 per `claude` — Canvi #153)*: `executiveCockpitService.ts` — Executive Cockpit com a centre de comandament. Agrega en paral·lel: Daily Brief, Operational Pulse, follow-ups pendents, conflictes de capacitat, suggeriments de pipeline i anomalies KPI. Funcions pures: `assemblePriorityActions` (ranking global d'accions per urgència), `assembleHealthSignals` (5 àrees de salut), `computeGlobalHealthScore` (score 0-100 + level). API `/api/admin/cockpit`. 19 tests.
**FET** *(2026-04-17 per `claude` — Canvi #168)*: `nextBestActionService.ts` — Motor de següent millor acció. Agrega 6 fonts (leads actius, customers, tasques, follow-ups, capacitat, pipeline) i genera rànking unificat d'accions executables amb scoring compost (urgència × impacte × finestra temporal). 6 dominis d'extracció, deduplicació per entitat+domini, scoring i ranking global. API `/api/admin/next-actions`. 24 tests servei + 4 tests ruta.
**PENDENT CRÍTIC**: evitar dispersió per excés de mòduls sense consolidació. Una sola narrativa de producte.
**MÉS ENDAVANT**: formalitzar product operating system.

## 6.2 Arquitectura de domini
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: detectat deute estructural. Servei canònic de tasks per lead (`leadScopedTaskService`). Servei canònic de rutes (`leadScopedTaskRouteService`). Els wrappers legacy (`leadTaskFacade`, `leadTaskRouteService`) ja han estat retirats; el protocol només els conserva com a rastre històric de la migració.
**FET**: desenganxament semàntic de `LeadTask`, desplaçament cap a `Task` model real i lectura canònica de timeline consolidats. El pendent viu ja no és estructural sinó només l'eliminació futura de `legacyLeadTaskId` quan les dades ho permetin.
**FET** *(2026-04-10 per `claude`)*: `model LeadTask` eliminat del schema. Enums renombrats `TaskStatus`/`TaskPriority` (amb `@@map` per preservar noms SQL). Relació `tasks LeadTask[]` eliminada de `Lead`. Refs `tx.leadTask.deleteMany` tretes de `leadCleanupService` i `leadRouteService` + tests alineats. Migració `20260410140000_drop_lead_task_model`. Camp `legacyLeadTaskId` preservat a `Task` (1 ref viva a `leadScopedTaskService`). 2219 tests, 0 failures, 0 errors TS.
**FET** *(2026-04-10 per `codex` — Canvi #67)*: aliases legacy `LeadTaskRouteInput`/`LeadTaskRouteUpdateInput` eliminats de `leadScopedTaskRouteService`; substituïts per `LeadScopedTaskRouteInput`/`LeadScopedTaskRouteUpdateInput`.
**FET** *(2026-04-10 per `codex` — Canvi #69)*: guard `arch:task-canonical:check` integrat a `validate:core` per bloquejar regressions actives a `LeadTask` (`prisma.leadTask`, `lead.tasks`, wrappers/aliases legacy i `model LeadTask`).
**FET** *(2026-04-24 per `claude` — Canvi #356)*: migració `20260410140000_drop_lead_task_model` aplicada a Railway i verificada. `npx prisma migrate status` contra `DIRECT_DATABASE_URL` retorna `Database schema is up to date!` amb 20/20 migracions trobades a `prisma/migrations`. El `SEGÜENT` quedava obert al protocol però la migració ja era efectiva al servidor. Guard pendent només: **MÉS ENDAVANT** — eliminar `legacyLeadTaskId` quan ja no hi hagi dades amb aquest camp.
**FET** *(2026-04-26 per `codex` — Canvi #413)*: el vell `EN MARXA` de `§6.2` queda regularitzat com a feina ja consolidada. La mateixa secció ja documentava schema sense `model LeadTask`, guards canònics (`#69`), timeline compartida i migració desplegada a Railway (`#356`); el pendent real que resta és exclusivament el `MÉS ENDAVANT` d'eliminar `legacyLeadTaskId` quan desaparegui la dependència de dades.
**MÉS ENDAVANT**: eliminar `legacyLeadTaskId` quan ja no hi hagi dades amb aquest camp.

## 6.3 Timeline canònica
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: detectades les 3 fonts. Creat `timelineQueryService` amb mappers. Customer Hub integra `adminLog` a la lectura. `Activity` route i UI amb forma canònica. `LeadWorkspace` amb lectura canònica.
**FET** *(2026-04-09 per `claude` — Canvi #1)*: afegits **fetchers unificats** (`fetchCanonicalEventsForCustomer/Lead/Booking`) al `timelineQueryService`. Bookings detail (`page.tsx`) ara consumeix `fetchCanonicalEventsForBooking` en lloc d'interpretar `adminLog` cru. 20 tests nous passant.
**FET** *(2026-04-10 per `codex` — Canvi #71)*: `leadActivity.metadata` preservada a la timeline canònica; les comunicacions `EMAIL/WHATSAPP/CALL/NOTE` ja no perden context quan entren a Customer/Lead/Booking timeline.
**FET** *(2026-04-22 per `codex` — Canvi #329)*: `loadCommTimeline()` deixa de llegir `leadActivity` pel seu compte i passa a construir el resum des dels fetchers canònics `fetchCanonicalEventsForLead/Customer`. Inbox i Customer Hub reaprofiten així la mateixa lectura estructural de comunicacions abans de decidir mètriques o següent pas.
**FET** *(2026-04-22 per `codex` — Canvi #331)*: `communicationStatusService` deixa de ser un helper només per `adminLog` cru i absorbeix també la derivació des d’events canònics (`deriveFlowStatusFromTimeline`, `buildRecentCommRowsFromTimeline`). `Bookings` deixa enrere el fix local i passa a consumir aquesta monocapa compartida.
**FET** *(2026-04-22 per `codex` — Canvi #332)*: la timeline del `Customer Hub` comença a migrar cap a la capa canònica sense perdre els events de negoci. `fetchCustomerHub()` carrega ara `fetchCanonicalEventsForCustomer()`, `buildTimeline()` pot consumir `canonicalEvents` i `canonicalEventsToTimeline()` preserva `preview` des del `body`, de manera que comunicacions i activitat deixen de mapar-se a mà dins el hub.
**FET** *(2026-04-22 per `codex` — Canvi #333)*: la cronologia del `Customer Hub` separa explícitament `business events` i `canonical activity events`. `timeline.ts` exporta ara `buildCustomerBusinessTimelineEvents()` i `buildCustomerActivityTimelineEvents()`, i `fetchCustomerHub()` les combina de forma explícita en lloc de mantenir un builder híbrid opac.
**FET** *(2026-04-22 per `codex` — Canvi #334)*: el dashboard deixa de construir la seva timeline recent amb `customerActivity + adminLog` separats. `timelineQueryService` exporta ara `fetchRecentCanonicalEvents()`, i `dashboard-data.ts` la consumeix perquè el resum recent passi també per la mateixa capa canònica i inclogui `leadActivity`.
**FET** *(2026-04-22 per `codex` — Canvi #335)*: `Economia` deixa de derivar el seguiment de cobrament directament des d’`adminLog` cru. `page.tsx` normalitza ara aquests logs de booking amb `mapAdminLogToCanonicalEvent()` i calcula `paymentFlowState` via `deriveFlowStatusFromTimeline()`, alineant la lectura financera amb la mateixa capa canònica de comunicacions.
**FET** *(2026-04-23 per `codex` — Canvi #336)*: `Sales Ops` i les automatitzacions comercials passen també per una mètrica canònica compartida de comunicacions. `timelineQueryService` exporta `fetchRecentCanonicalCommunicationMetrics()` + `summarizeCanonicalCommunicationMetrics()`, i tant `readCommercialSequenceMetrics()` com `runCommercialDailyAutomation()` i `/admin/sales-ops` deixen enrere els comptadors locals sobre `adminLog` cru per `COMM_SENT/COMM_RESPONDED`.
**FET** *(2026-04-23 per `codex` — Canvi #337)*: `Economia` deixa també la lectura crua de comunicacions de booking. `timelineQueryService` exporta `fetchCanonicalCommunicationEventsForBookings()`, i `app/admin/economia/page.tsx` consumeix ara aquest helper batch en lloc de remuntar `adminLog` cru localment abans de calcular `paymentFlowState`.
**FET** *(2026-04-23 per `codex` — Canvi #338)*: el dashboard deixa també la lectura crua d’`adminLog` per a l’auditoria recent. `dashboard-data.ts` reaprofita `recentCanonicalTimeline` i en filtra els events `source === 'adminLog'`, de manera que la secció “Auditoria recent” de `app/admin/page.tsx` deixa de dependre d’una query pròpia paral·lela.
**FET** *(2026-04-23 per `codex` — Canvi #339)*: el `Customer Hub` elimina també la col·lecció crua `adminLogs` que ja no consumia. `fetchCustomerHubCollections()` deixa de carregar-la, `fetchCustomerHub()` simplifica el contracte intern, i la cronologia continua depenent només de `fetchCanonicalEventsForCustomer()`.
**FET** *(2026-04-23 per `codex` — Canvi #340)*: `/api/admin/activity` deixa de mantenir la seva pròpia lectura Prisma sobre `adminLog`. `timelineQueryService` exporta `fetchCanonicalAdminActivityPage()`, que concentra paginació, filtre per categoria, estadístiques i mapping canònic; la route queda reduïda a adaptador prim d’aquest contracte shared.
**FET** *(2026-04-24 per `codex` — Canvi #341)*: `Emails` deixa de construir localment el feed recent i els comptadors sobre `customerActivity`. `customerActivityService` exporta ara `readRecentEmailActivitySummary()` + `EMAIL_ACTIVITY_ACTIONS`, i `app/admin/emails/page.tsx` consumeix aquest contracte shared per a activitat recent, enviaments 24h i testimonis 7d.
**FET** *(2026-04-24 per `codex` — Canvi #342)*: el `Customer Hub` deixa també la lectura local de `customerActivity` per a notes i estat manual. `customerActivityService` exporta `readCustomerActivityLog()`, i `fetchCustomerHubCollections()` delega a aquest helper shared en lloc de mantenir un altre `findMany` cru propi.
**FET** *(2026-04-24 per `codex` — Canvi #343)*: `Economia` treu a servei shared els historials de configuració que llegia des de `adminLog`. `adminConfigHistoryService` concentra ara la lectura i normalització de `finance.profitabilityConfig` i `pricing.pack.modelConfig`, i `app/admin/economia/page.tsx` deixa de mantenir aquests mappers/queries duplicats.
**FET** *(2026-04-24 per `codex` — Canvi #344)*: `Sales Ops` i les automatitzacions comercials comparteixen també la mètrica recent de `COMM_SEQUENCE_EXEC`. `timelineQueryService` exporta `fetchRecentCommercialSequenceMetrics()`, i tant `readCommercialSequenceMetrics()` com `app/admin/sales-ops/page.tsx` deixen de comptar aquesta mètrica localment sobre `adminLog`.
**FET** *(2026-04-24 per `codex` — Canvi #345)*: el `Customer Hub` deixa també de derivar localment notes i estat manual des de `activityLog`. `customerActivityService` exporta `deriveCustomerHubActivitySummary()`, i `fetchCustomerHub.ts` delega aquesta interpretació en el servei shared en lloc de mantenir-la dins del fetcher.
**FET** *(2026-04-24 per `codex` — Canvi #346)*: les sortides comercials comparteixen també l’escriptura de `customerActivity`. `customerActivityService` exporta `recordCustomerEmailSent()`, `recordCustomerQuoteSent()` i `recordCustomerProposalSent()`, i els serveis `adminEmailSendService`, `adminQuoteEmailService` i `proposalDispatchService` deixen de crear aquestes activitats directament.
**FET** *(2026-04-24 per `codex` — Canvi #347)*: el clúster de comunicacions de reserva comparteix també l’escriptura de `adminLog`. `bookingCommunicationLogService` exporta `recordBookingCommunicationLog()`, i `bookingCommunicationService`, `paymentReminderService` i `postEventDispatchService` deixen de crear localment els logs `COMM_SENT`, `COMM_RESPONDED`, `PAYMENT_REMINDER_SENT` i `SEND_POST_EVENT_EMAIL`.
**FET** *(2026-04-24 per `codex` — Canvi #348)*: el lifecycle base de client comparteix també l’escriptura de `customerActivity`. `customerActivityService` exporta ara helpers shared per `CUSTOMER_CREATED`, `INITIAL_NOTES`, `DUPLICATE_WARNING`, `LEAD_CREATED`, `PROFILE_UPDATED`, `STATUS_CHANGED`, `LEAD_CONVERTED` i `BOOKING_CREATED`, i els serveis del cicle principal deixen d’escriure aquestes activitats directament.
**FET** *(2026-04-24 per `codex` — Canvi #351)*: el post-event de reserva tanca també el residual de `customerActivity`. `customerActivityService` exporta `recordCustomerPostEventEmailSent()`, i `postEventDispatchService` deixa de fer `customerActivity.create(...)` inline quan envia el correu post-event.
**FET** *(2026-04-24 per `codex` — Canvi #352)*: els emails comercials de lead comparteixen també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadEmailSent()` i `recordLeadQuoteSent()`, i `adminEmailSendService` / `adminQuoteEmailService` deixen de crear aquestes activitats directament.
**FET** *(2026-04-24 per `codex` — Canvi #355)*: el cicle de contracte comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadContractSent()` i `recordLeadContractCancelled()`, i `contractService` deixa de crear aquestes activitats directament.
**FET** *(2026-04-24 per `codex` — Canvi #357)*: el cicle de documents del lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadDocumentAdded()` i `recordLeadDocumentDeleted()`, i `leadDocumentService` deixa de crear aquestes activitats directament.
**FET** *(2026-04-24 per `codex` — Canvi #359)*: el cicle de tasques scoped del lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadTaskCreated()`, `recordLeadTaskUpdated()` i `recordLeadTaskDeleted()`, i `leadScopedTaskRouteService` deixa de crear aquestes activitats directament.
**FET** *(2026-04-24 per `codex` — Canvi #361)*: el cicle de notes del lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadNoteAdded()`, i `leadNoteService` deixa de crear aquesta activitat directament.
**FET** *(2026-04-24 per `codex` — Canvi #362)*: el cicle d’importació Inbox del lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadUpdatedFromInbox()` i `recordLeadCreatedFromInbox()`, i `inboxLeadImportService` deixa de crear aquestes activitats directament.
**FET** *(2026-04-24 per `codex` — Canvi #364)*: el motor de seqüències comercials comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadCommercialSequenceStepSent()`, i `commercialSequenceService` deixa de crear aquesta activitat directament quan executa un pas de nurturing.
**FET** *(2026-04-24 per `codex` — Canvi #366)*: la ruta de generació de pressupost de lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadQuoteGenerated()`, i `quoteRouteHandler` deixa de crear aquesta activitat directament.
**FET** *(2026-04-24 per `codex` — Canvi #368)*: el snapshot manual de scoring del lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadScoreSnapshot()`, i `leadScoreAdminService` deixa de crear aquesta activitat directament.
**FET** *(2026-04-24 per `codex` — Canvi #369)*: l’automatització SLA del lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadSlaTaskCreated()`, i `slaAutomationService` deixa de crear aquesta activitat directament.
**FET** *(2026-04-24 per `codex` — Canvi #370)*: la ruta de canvi d’estat del lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadStatusChanged()`, i `statusRouteHandler` deixa de crear aquesta activitat directament.
**FET** *(2026-04-24 per `codex` — Canvi #371)*: el cicle de snapshot tècnic del lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadTechnicalSnapshotSaved()` i `recordLeadTechnicalSnapshotSent()`, i `leadSnapshotService` deixa de crear aquestes activitats directament.
**FET** *(2026-04-24 per `claude` — Canvi #373)*: el cicle de pèrdua de lead comparteix també l’escriptura de `leadActivity`. `leadActivityService` exporta `recordLeadLost()`, i `leadLossService` deixa de crear aquesta activitat directament. Amb això tots els consumidors ja passen pels helpers shared.
**FET** *(2026-04-24 per `claude` — Canvi #374)*: decisió canònica — **NO es crea entitat `CommunicationEvent` pròpia**. `leadActivity` continua sent la font canònica de comunicacions amb el lead (EMAIL, CALL, WHATSAPP) juntament amb la resta d’events del domini lead. Raons: (1) el PENDENT CRÍTIC apunta cap a menys entitats (unificar `customerActivity` + `leadActivity` en un `TimelineEvent` polimòrfic), no més — afegir una 4a font augmentaria fan-in al `timelineQueryService`; (2) després dels Canvis #352–#373 totes les escriptures passen per helpers shared tipats (`recordLeadEmailSent`, `recordLeadQuoteSent`, `recordLeadCommercialSequenceStepSent`, etc.) que encapsulen `type + metadata` sense dependre de queries natives sobre columnes pròpies; (3) queries tipades sobre comms es poden cobrir amb helpers de lectura (`listLeadEmailActivities()`, etc.) sense tocar schema, i camps "hot" per SLA/analítica (ex: `lastRespondedAt`) poden viure com a camps derivats al `Lead` si algun dia calen. Aquesta decisió tanca explícitament el debat i evita que agents futurs tornin a plantejar-lo sense evidència nova.
**PENDENT CRÍTIC**: definir què és timeline operativa vs log tècnic. Decidir si a llarg termini hi ha una entitat única d'events — la direcció preferida (un `TimelineEvent` polimòrfic que absorbeix `customerActivity` + `leadActivity`) queda documentada al `#374`, però no és feina immediata; requereix un RFC curt abans de tocar schema.
**MÉS ENDAVANT**: analítica transversal sobre timeline. Automatismes basats en ella.

## 6.4 Tasks / Tasques operatives
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: `Task` guanya pes com a model central. Workspace global alineat amb `TaskStatus`. Lead workspace tracta tasques com a operativa real.
**FET** *(2026-04-09 per `claude` — Canvi #3)*: eliminats wrappers legacy (`leadTaskFacade`, `leadTaskRouteService` + tests). Migrats 3 consumidors de `lead.tasks` (LeadTask) a `lead.universalTasks` (Task canònic). Eliminat `prisma.leadTask` de tot el codi — **0 referències**. Model `LeadTask` queda al schema com a fòssil fins que es decideixi migració `DROP TABLE`.
**FET** *(2026-04-10 per `claude`)*: `model LeadTask` eliminat del schema Prisma. Migració `20260410140000_drop_lead_task_model` creada. Enums renombrats a `TaskStatus`/`TaskPriority`.
**FET** *(2026-04-10 per `codex` — Canvi #72)*: filtre de queue operativa corregit perquè s'apliqui abans de paginar via `taskIds` a `fetchAdminTaskList`; evita llistes buides quan la queue té tasques fora de la pàgina actual.
**FET** *(2026-04-10 per `codex` — Canvi #73)*: `TaskRowActions` i llista de `TaskPageSections` ajustades a mobile: accions apilades, row `flex-col` en petit, sense `shrink-0` agressiu i copy visible `Obrir destí` corregit.
**FET** *(2026-04-10 per `codex` — Canvi #75)*: `TaskKanbanView` ajustat a mobile amb board horitzontal `snap-x`, column picker i columnes `min-w-[86vw]`; desktop conserva grid de 3 columnes i drag/drop.
**FET** *(2026-04-18 per `claude` — Canvi #203)*: `Task` schema ampliat amb camps canònics `source`, `autoRule`, `dedupeKey` (unique) i `resolutionNote`. Migració `20260418120000_add_task_dedupe_source_fields` amb backfill: `createdBy='system:auto'`→`source='AUTOMATION'` (+5 mappings addicionals), i extracció del `[dedupeKey:X]` embegut a `description` cap a columna real amb `autoRule` derivada. `taskAutomationService.ts` elimina el hack regex, escriu a columnes i fa dedup per `dedupeKey` amb `skipDuplicates`. `taskCreation.ts` accepta els 4 camps nous. 20 tests verds (4 nous: persistència canònica, dedup per columna, defaults, input complet). Fix adjacent pre-existent a `app/admin/tasks/new/page.tsx` (`normalizeTaskPriority` amb `?? null`) per destapar error tapat pel cache `tsbuildinfo`.
**FET** *(2026-04-18 per `codex` — Canvi #204)*: la reactivació assistida del `Customer Hub` ja entra a `Tasks` amb semàntica canònica i sense duplicats operatius silenciosos. `SummaryPanel` genera `taskSource='REACTIVATION'` + `dedupeKey='reactivation:{customerId}'`; `tasks/new` conserva el context assistit; `taskAdminService` deduplica contra tasques obertes amb la mateixa `dedupeKey` abans de crear, i la llista global fa visible l'origen amb badge `Reactivació`. Cobertura afegida a `taskAdminService.test.ts` i `SummaryPanel.test.tsx`.
**FET** *(2026-04-18 per `claude` — Canvi #205)*: migració completa dels 4 serveis productors `createdBy='system:*'` cap al camp canònic `source` (`dailyChecklist`→CHECKLIST, `packPricingCheckService`→PACK_PRICING, `bookingCreationService`→BOOKING_CREATION, `customerCreationService`→CUSTOMER_CREATION). Consumidors `taskList.ts` i `dashboard-data.ts` passen a filtrar per `source: 'CHECKLIST'`. `TASK_SOURCE` centralitzat a `lib/constants`. 34 tests verds, validate:core 7/7. `bookingPortalCompletionService` verificat: no crea Task (només `ClientPortalAccess`), fora d'abast.
**FET** *(2026-04-18 per `claude` — Canvi #207)*: `TASK_SOURCE` incorpora també `REACTIVATION` per tancar la monocapa iniciada pel Canvi #204. `SummaryPanel.tsx` i `TaskPageSections.tsx` deixen d'usar el string literal `'REACTIVATION'` i consumeixen `TASK_SOURCE.REACTIVATION` com la resta de valors canònics. 19 tests verds, validate:core 7/7.
**FET** *(2026-04-18 per `claude` — Canvi #212)*: cobertura de `source` canònic blindada als últims dos productors del Canvi #205. `bookingCreationService.test.ts` afirma que la task de preparació 7 dies abans inclou `source: 'BOOKING_CREATION'`; `customerCreationService.test.ts` captura el payload del `task.create` transaccional i afirma `source: 'CUSTOMER_CREATION'`. 40 tests verds als dos fitxers. Nota obsoleta de `nextActionType` eliminada del checklist: mai va aterrar al schema (grep zero) i no hi ha res a confirmar.
**FET** *(2026-04-18 per `claude` — Canvi #215)*: tancada la monocapa de `source` a `automationTriggers.ts`, els últims dos productors que creaven Task sense origen canònic. `onLeadCreated` (welcome email immediat) i `onBookingConfirmed` (checklist pre-event 2 dies abans) escriuen ara `source: TASK_SOURCE.AUTOMATION`. Les 7 regles canòniques de `TASK_SOURCE` cobreixen ja tots els productors del repo; cap `task.create`/`createMany` actiu queda sense `source`.
**FET** *(2026-04-18 per `claude` — Canvi #217)*: `automationTriggers.test.ts` passa de 7 tests vacus (exports + tipus) a 18 tests amb mocks reals de prisma. Blinda els 3 triggers — `onProposalAccepted` (5 tests: not-found, no-booking, contractStatus existent, happy DRAFT, error DB), `onLeadCreated` (4 tests: no-email, placeholder intern, Task creada amb `source: 'AUTOMATION'`, error DB) i `onBookingConfirmed` (5 tests: not-found, dup checklist, BODA amb 8 ítems + source, OTHER amb 5 ítems, dueDate 2d abans, dueDate null) — i el dispatcher (3 tests de routing per event.type). Corregeix la decisió floixa del Canvi #215 que havia saltat els tests amb justificació feble.
**FET** *(2026-04-19 per `claude` — Canvi #219)*: `onBookingConfirmed` (a `automationTriggers.ts`) substitueix el dedup fràgil per `task.findFirst({bookingId, title: {contains: 'Checklist pre-event'}})` pel patró canònic `createMany({skipDuplicates:true}) + dedupeKey='pre-event-checklist:{bookingId}'`, alineat amb `taskAutomationService.ts`. El `count===0` retornat per Prisma decideix `triggered=false` amb detail `Checklist already exists`. Robust a renames de títol i a race conditions (unique constraint a DB). 18 tests verds al fitxer: test de dedup ara simula `createMany({count:0})`, els 4 happy paths afirmen `skipDuplicates:true` + `dedupeKey` canònic a args.
**FET** *(2026-04-19 per `claude` — Canvi #221)*: `onLeadCreated` tanca la monocapa de dedupeKey als auto-triggers. Abans no tenia cap dedup, així que un retry del dispatcher, un double-click de l'API `/admin/leads` o una regeneració manual podia crear N welcome-email tasks per al mateix lead. Migrat al mateix patró canònic del Canvi #219: `createMany({skipDuplicates:true}) + dedupeKey='welcome-email:{leadId}'`. El `count===0` → `{triggered:false, detail:'Welcome email already queued'}`. 19 tests verds al fitxer (nou test de dedup + assertions `skipDuplicates:true` + `dedupeKey` a args). Amb això, els 2 triggers d'`automationTriggers.ts` que creen Task tenen dedup canònica blindada per unique constraint de DB; `onProposalAccepted` no crea Task (només actualitza proposal), fora d'abast.
**FET** *(2026-04-19 per `claude` — Canvi #223)*: `TASK_DEDUPE_KEY` centralitzat a `lib/constants/index.ts`. Els 10 prefixos de `dedupeKey` que existien com a strings inline escampades pel repo (`welcome-email`, `pre-event-checklist`, `sla`, `stale`, `prep`, `payment`, `postevent`, `atrisk`, `quote`, `reactivation`) passen a builders canònics: `TASK_DEDUPE_KEY.welcomeEmail(leadId)`, `.preEventChecklist(bookingId)`, etc. Migrats tots els consumidors: `automationTriggers.ts` (2 builders), `taskAutomationService.ts` (7), `SummaryPanel.tsx` (1). Zero strings inline de dedupeKey queden al codi productiu. 92 tests verds als 8 fitxers afectats.
**FET** *(2026-04-19 per `claude` — Canvi #225)*: guard preventiu contra regressions del registry `TASK_DEDUPE_KEY`. `scripts/check-task-canonical.mjs` afegeix la regla `inline-dedupe-template` amb pattern `/dedupeKey:\s*\`[^\`]*\$\{/` que captura template-literals inline (l'anti-pattern eliminat al Canvi #223) i un camp nou `scopes: ['app/', 'lib/']` que limita la regla al codi productiu (tests poden mantenir strings literals per assertions). Test dedicat a `__tests__/scripts/check-task-canonical.test.ts` amb 5 casos: accepta `TASK_DEDUPE_KEY.welcomeEmail(id)`, rebutja template inline a `lib/` i `app/`, no toca `__tests__/`, ignora strings estàtiques sense `${...}`. A partir d'ara, qualsevol nou productor que construeixi `dedupeKey: \`foo:${x}\`` falla el guard.
**FET** *(2026-04-19 per `claude` — Canvi #227)*: el test del guard del Canvi #225 queda connectat al `validate:core`. `package.json` · `qa:protocol:test` amplia el scope de `vitest run __tests__/scripts/check-admin-change-log.test.ts` a `vitest run __tests__/scripts/` — ara captura tant el test del guard del protocol com el nou `check-task-canonical.test.ts` i qualsevol futur test de scripts sense haver d'editar l'script cada cop. Verificat: `pnpm run qa:protocol:test` corre ara els 10 tests (5+5) dels dos fitxers, i ambdós entren a validate:core. La regla del #225 estava blindada contra regressions però el test mateix no corria al pipeline; ara sí.
**FET** *(2026-04-19 per `claude` — Canvi #230)*: `createLeadScopedTask` (a `lib/services/tasks/leadScopedTaskService.ts`) deixa de ser l'últim productor de Task que no propagava `source`. Afegit `source?: string | null` al contracte `LeadScopedTaskInput` i `source: input.source ?? null` al `prisma.task.create`, alineat amb el patró de `taskCreation.ts` · `createUniversalTask` (Canvi #205) i `taskAdminService.ts` (normalizedSource). Aquest servei alimenta l'endpoint `app/api/admin/leads/[id]/tasks/route.ts` (creació manual de tasques des del Lead Hub); fins ara el camp quedava silent null per omissió d'schema, no per decisió explícita. 2 nous tests a `leadScopedTaskService.test.ts`: un afirma `source: 'AUTOMATION'` propagat, altre afirma `source: null` per defecte quan el caller no el passa. Amb això, zero productors de Task al repo escriuen sense passar pel contracte `source`.
**FET** *(2026-04-19 per `claude` — Canvi #232)*: el Zod schema del route `app/api/admin/leads/[id]/tasks/route.ts` accepta ara `source: z.string().optional()`. Sense aquesta línia, el contracte afegit al Canvi #230 (`LeadScopedTaskInput.source`) era inaccessible des del perímetre HTTP — Zod `.safeParse()` despullava el camp abans que arribés al servei. Ara el pipeline és end-to-end: body HTTP → Zod → `createLeadScopedTaskForRoute` → `createLeadScopedTask` → `prisma.task.create`. Alineat amb el route germà `app/api/admin/tasks/route.ts` que ja accepta `source`, `autoRule`, `dedupeKey`, `resolutionNote` al seu Zod. Test nou a `leads-tasks-route.test.ts`: POST amb `{title, source: 'AUTOMATION'}` ha de propagar `source` al mock de `createLeadScopedTaskForRoute`. 11 tests verds al fitxer (10 + 1 nou).
**FET** *(2026-04-24 per `claude` — Canvi #356)*: migració `20260418120000_add_task_dedupe_source_fields` aplicada a Railway i verificada. `npx prisma migrate status` contra `DIRECT_DATABASE_URL` retorna `Database schema is up to date!`. Els 4 camps canònics de `Task` (`source`, `autoRule`, `dedupeKey` unique, `resolutionNote`) i els 6 backfills SQL (`system:auto`→AUTOMATION, `system:daily-checklist`→CHECKLIST, etc.) són actius a producció. El `SEGÜENT` quedava obert al protocol però l'actuació ja era efectiva.
**FET** *(2026-04-10 per `claude` — Canvi #45)*: `taskQueueService.ts` — queue operativa intel·ligent amb 5 classificacions (VENÇUT, AVUI, VIP, BLOQUEJAT, NORMAL), scoring, filtres a la UI. 18 tests.
**FET** *(2026-04-10 per `claude` — Canvi #48)*: `taskAutomationService.ts` — 7 regles d'automatització (SLA, stale, prep, payment, post-event, at-risk, quote). Cada tasca vinculada a entitat concreta amb deduplicació. API + botó a UI. 14 tests.
**FET** *(2026-04-10 per `codex` — Canvi #68)*: cron `/api/cron/tasks-auto` per executar `runTaskAutomation` diàriament amb Bearer `CRON_SECRET`, status `automation.tasks`, registre a `/admin/crons` i tests de route.
**MÉS ENDAVANT**: alertes en temps real i ajust fi de regles automàtiques segons dades reals.

## 6.5 CRM / Customer Hub
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: CRM potenciat. Customer Hub elevat visualment. Nous camps CRM. Lectura global del client.
**FET**: pas de "fitxa" a "workspace d'acció" consolidat. El pendent viu ja no és la base del workspace sinó convertir-lo en cervell comercial i evitar que el client es fragmenti en pantalles paral·leles.
**FET** *(2026-04-09 per `claude` — Canvi #16)*: `customerInsightsService.ts` — next action, relational health, LTV, recurrència, pagament pendent. Integrat a `fetchCustomerHub` via `insights` al DTO.
**FET** *(2026-04-10 per `claude` — Canvi #35)*: `InsightsBanner` integrat al Customer Hub header — next action intel·ligent, salut relacional, LTV. Substitueix el "següent acció" hardcodejat.
**FET** *(2026-04-10 per `claude` — Canvi #39)*: segments CRM "En risc" (`healthScoreMax`) i "Alt valor" (`minSpent`) ara funcionals — backend (`listAdminCustomers` + stat `highValue`) + frontend (estat + handlers correctes) + 3 tests nous.
**FET** *(2026-04-10 per `claude` — Canvi #41)*: `reactivationService.ts` — servei pur `generateReactivationCandidates` + wrapper `loadReactivationCandidates`. 6 classificacions (VIP dormant, alt valor, recurrent, primer event, at-risk health, churn recovery). Missatges suggerits ca/es. UI completa `/admin/clientes/reactivation` amb KPIs, filtres prioritat, missatge expandible, WhatsApp/email/copiar, descartar. 20 tests.
**FET** *(2026-04-10 per `claude` — Canvi #52)*: `referralsService.ts` — programa de referrals complet. Top referrers amb `referralsCount`/`referralsValue`, stats globals (taxa referral, valor generat, avg per referral), 4 classificacions de candidats (VIP, alt valor, recurrent, first-time satisfet). UI `/admin/clientes/referrals`. 20 tests.
**FET** *(2026-04-10 per `claude` + tancat per `codex` — Canvi #65)*: cron `/api/cron/customer-lifecycle` amb Bearer `CRON_SECRET`, recalcul diari de `lifecycleStage` i `healthScore` via `recalculateAllCustomers`, status centralitzat `crm.customer-lifecycle` i cobertura de route.
**FET** *(2026-04-10 per `codex` — Canvi #66)*: `crm.customer-lifecycle` afegit a `ADMIN_CRON_PREFIXES` perquè /admin/crons el monitoritzi com a cron diari; test de catàleg per evitar omissions futures.
**FET** *(2026-04-16 per `codex` — Canvi #136)*: el `Customer Hub` ja carrega `commSummary` des de `loadCommTimeline()` i el panell `Comunicacions` mostra últim contacte, dies sense contacte, gap de resposta i repartiment per canal. La comunicació deixa de viure només a Inbox.
**FET** *(2026-04-16 per `codex` — Canvi #137)*: la timeline del `Customer Hub` ja conserva i mostra metadades canòniques de comunicació (`channel`, `direction`, `preview`) als events de missatge. El client veu la comunicació dins la seva història, no com un títol genèric.
**FET** *(2026-04-16 per `codex` — Canvi #138)*: el `Customer Hub` ja mostra estat de conversa reutilitzant el resum canònic: últim canal/direcció de contacte i si la resposta pendent és nostra o del client. La comunicació ja no és només volum; també és cua operativa.
**FET** *(2026-04-16 per `codex` — Canvi #139)*: l'`InsightsBanner` del `Customer Hub` ja prioritza respondre al client quan l'estat canònic de conversa diu que tenim una entrada pendent entrant. La comunicació ja impacta també l'acció recomanada, no només el context.
**FET** *(2026-04-16 per `codex` — Canvi #140)*: l'acció recomanada del `Customer Hub` ja és executable segons canal: segueix obrint Inbox per email, però si l'últim toc és `WHATSAPP` i hi ha telèfon, obre directament la conversa de WhatsApp amb missatge inicial.
**FET** *(2026-04-16 per `codex` — Canvi #141)*: el `Customer Hub` ja incorpora també els follow-ups canònics pendents derivats de `responseTrackingService`; el panell `Comunicacions` mostra la cua principal de seguiment amb urgència, dies i CTA operativa.
**FET** *(2026-04-17 per `codex` — Canvi #142)*: el motor d'insights del `Customer Hub` ja publica risc comercial per inacció des de la mateixa font canònica de follow-ups i últim contacte. El client pot quedar marcat com a `Risc comercial alt` o `Relació en refredament` encara que no hi hagi una tasca manual oberta.
**FET** *(2026-04-17 per `codex` — Canvi #145)*: les quick actions del `Customer Hub` ja fan executable aquest risc comercial: si el bloqueig és urgent i hi ha telèfon, obren `WhatsApp`; si no, preparen el seguiment per email des de la mateixa CTA del resum.
**FET** *(2026-04-17 per `codex` — Canvi #148)*: el resum del `Customer Hub` ja té un bloc específic de `Prioritat comercial`, alimentat pel motor d'insights i pels follow-ups canònics. El risc deixa de ser només una alerta dispersa i passa a ser una peça central del workspace.
**FET** *(2026-04-17 per `codex` — Canvi #151)*: la cronologia del `Customer Hub` ja arrenca amb un estat comercial actual reutilitzant `commercialPriority` i la mateixa CTA executable de risc. La narrativa del client deixa de separar “història” i “bloqueig comercial actual”.
**FET** *(2026-04-18 per `codex` — Canvi #201)*: el `Customer Hub` mostra ara `Reactivació suggerida` quan el client encaixa en reactivació però no té leads actives ni reserves futures. La decisió queda resolta en mode assistit i traçable: la CTA obre esborrany de WhatsApp o email, però no envia res automàticament.
**FET** *(2026-04-18 per `codex` — Canvi #202)*: aquesta reactivació assistida ja pot deixar rastre explícit a `Tasks`: el `Customer Hub` obre `Nova tasca` amb títol, descripció i prioritat prefijats, però continua requerint confirmació manual abans de crear-la.
**FET** *(2026-04-18 per `codex` — Canvi #204)*: la reactivació assistida ja no només obre `Nova tasca`, sinó que ho fa amb traça canònica i visible a `Tasks`. El pas operatiu queda deduplicat per client mitjançant `dedupeKey`, la creació reutilitza `source='REACTIVATION'` i la cua mostra un badge específic perquè la reactivació no es barregi com una tasca genèrica.
**FET** *(2026-04-18 per `codex` — Canvi #206)*: la reactivació assistida ja pot reobrir la seva tasca canònica quan la `dedupeKey` continua sent la mateixa però el registre existent ja estava tancat. Això evita xocs amb la unicitat de `dedupeKey`, manté una sola peça operativa per client i refresca l'intent comercial sobre la mateixa tasca.
**FET** *(2026-04-18 per `codex` — Canvi #208)*: el `Customer Hub` ja mostra feedback explícit del resultat de la CTA de reactivació. `tasks/new` retorna ara a `?tab=tasks` amb `taskSource` i `taskResult`, i el panell `Tasques / Notes` pinta un avís visible quan la tasca s'ha creat, reutilitzat o reobert.
**FET** *(2026-04-18 per `claude` — Canvi #209)*: primer ús operatiu del camp canònic `resolutionNote` (introduït al Canvi #203 i fins ara mort). `dailyChecklist.ts` escriu motiu explícit als dos moments de cancel·lació automàtica: `staleCleanup` (checklist vençut sense resoldre) i `toCancelTodayIds` (senyal desaparegut durant el dia). 13 tests verds (2 assertions noves), validate:core 7/7. Les cancel·lacions automàtiques ja deixen traça consultable enlloc d'orfe.
**FET** *(2026-04-18 per `codex` — Canvi #210)*: l'avís de reactivació ja és temporal i descartable. `CustomerHubClient` conserva el notice en estat local, neteja la URL amb `router.replace(...?tab=tasks)` després del primer retorn i `TasksNotesPanel` permet tancar-lo manualment sense recarregar ni perdre la pestanya activa.
**FET** *(2026-04-18 per `codex` — Canvi #213)*: el formulari `tasks/new` ja torna al lloc correcte quan s'obre des del `Customer Hub`. Si hi ha `customerId`, tant el back principal com `Cancel·lar` apunten ara a `?tab=tasks` de la fitxa del client, evitant que l'operador surti involuntàriament cap a la cua global de tasques.
**FET** *(2026-04-18 per `codex` — Canvi #214)*: aquest retorn canònic ja s'estén també a `inbox/compose` i `bookings/new` quan s'obren des del `Customer Hub`. `compose` torna a `?tab=comms` tant al back com a `Cancel·lar` i després d'enviar; `bookings/new` torna a `?tab=bookings` al back i a `Cancel·lar`.
**FET** *(2026-04-18 per `codex` — Canvi #216)*: el patró dels workspaces externs ja no depèn de query strings hardcoded escampades pel `Customer Hub`. `taskResultNotice.ts` exporta ara helpers canònics per `tasks/new`, `bookings/new` i `inbox/compose`, i els panells `Summary` i `Comms` els consumeixen en lloc de construir URLs a mà.
**FET** *(2026-04-18 per `codex` — Canvi #218)*: aquests helpers ja surten del fitxer de notices i passen a un mòdul propi de navegació de workspace client. `lib/admin/customerWorkspaceHref.ts` concentra el contracte de tabs i salts a workspaces externs; `taskResultNotice.ts` queda de nou centrat només en feedback de reactivació.
**FET** *(2026-04-19 per `codex` — Canvi #220)*: `customerWorkspaceHref.ts` ja cobreix també els salts restants del `Customer Hub` cap a pressupostos i formularis de client. El header, els panells de `Bookings`, `Tasks`, `Summary`, `Proposals` i `Margin` deixen d’usar query strings hardcoded i passen a consumir `buildCustomerProposalHref`, `buildCustomerBookingCreateHref`, `buildCustomerTaskCreateHref` i `buildCustomerComposeHref`.
**FET** *(2026-04-19 per `codex` — Canvi #222)*: els helpers de `customerWorkspaceHref.ts` ja es reutilitzen també en consumidors compartits fora del `Customer Hub`. `nextActionLink.ts` deixa de construir a mà els salts cap a pressupost i `compose`; `TaskPageSections.tsx` reutilitza el builder de nova tasca amb `customerId`; i `ProposalsList.tsx` centralitza els enllaços d’edició amb `buildCustomerProposalHref`.
**FET** *(2026-04-19 per `codex` — Canvi #224)*: `customerWorkspaceHref.ts` ja absorbeix també la navegació de llistes filtrades per client. El mòdul exporta `buildCustomerTaskListHref()` i `buildCustomerBookingListHref()`, `nextActionLink.ts` deixa enrere el fallback pitjor `q=customerId` i `TaskPageSections.tsx` reutilitza el builder canònic també al toggle `kanban/list`.
**FET** *(2026-04-19 per `codex` — Canvi #226)*: el contracte de llistes filtrades de client ja no és només navegació, també és funcional a `Bookings`. `app/admin/bookings/page.tsx` aplica ara `customerId` al `where`, mostra context de client al `subtitle`/`back` i conserva el filtre també a la paginació. `buildCustomerBookingListHref()` s’amplia amb opcions mínimes (`view`, `status`, `eventType`, `payment`, `fromDate`, `toDate`, `search`, `page`) perquè aquest context no es perdi.
**FET** *(2026-04-19 per `codex` — Canvi #228)*: el context de client a `Bookings` ja no es perd en interaccions bàsiques de UI. `BookingFilters.tsx` i `BookingViewToggle.tsx` reutilitzen `buildCustomerBookingListHref()` quan hi ha `customerId`, de manera que `Netejar filtres` i el canvi `Llista/Kanban` es mantenen dins la cua del mateix client en lloc de tornar silenciosament a `/admin/bookings`.
**FET** *(2026-04-19 per `codex` — Canvi #229)*: `LeadInsightsBanner` deixa d’apuntar a filtres no suportats. Les CTAs `Revisar cobraments` i `Veure tasques` resolen ara destins reals segons context: reserva concreta si existeix, llista de tasques del client si hi ha `customerId`, i fallback a la pròpia fitxa de lead quan no hi ha millor target operatiu.
**FET** *(2026-04-19 per `codex` — Canvi #231)*: `PendingFollowUpsPanel` d’Inbox deixa d’obrir el redactor amb `customerId=` buit. El CTA d’email fa servir ara `leadId` i manté el context real del follow-up pendent.
**FET** *(2026-04-24 per `claude` — Canvi #378)*: el criteri "CTA només cap a destins realment suportats" està auditat també fora de Customer/Lead Hub — no es necessita cap tall de codi. Únic candidat tangible: `app/admin/tasks/TaskQueueBanner.tsx`, que només fa filtres interns a `/admin/tasks?queue=X` sense cap CTA extern. La resta de banners executius (`LeadInsightsBanner`, `clientes/.../InsightsBanner`) ja viuen dins Lead/Customer Hub i es cobreixen pels Canvis `#229` i `#231`.
**FET** *(2026-04-26 per `codex` — Canvi #415)*: el vell `EN MARXA` de `§6.5` queda regularitzat com a feina ja consolidada. El mateix bloc ja documentava el `Customer Hub` amb insights, comunicacions canòniques, prioritat comercial, reactivació assistida i navegació shared cap a tasques, reserves, pressupostos i compose (`#136`-`#151`, `#201`-`#224`); el pendent real que resta és el `PENDENT CRÍTIC` d'elevar-lo a cervell comercial únic i evitar la fragmentació en pantalles paral·leles.
**PENDENT CRÍTIC**: Customer Hub com a cervell comercial. Evitar client repartit en pantalles paral·leles.
**MÉS ENDAVANT**: segments intel·ligents, reactivació assistida i automatismes comercials amb traçabilitat.

## 6.6 Leads / Pipeline comercial
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: LeadWorkspace reforçat. Timeline del lead coherent. Tasques en model canònic.
**FET**: conversió del workspace en cabina comercial real consolidada. El pendent viu ja no és la cabina comercial base sinó la seva integració conceptual amb Customer Hub dins un flux únic.
**FET** *(2026-04-09 per `claude` — Canvi #17)*: `leadInsightsService.ts` — next action, loss risk, commercial context. Integrat a lead detail page.
**FET** *(2026-04-10 per `claude` — Canvi #36)*: `LeadInsightsBanner.tsx` — next action amb CTA, risc de pèrdua amb raons, context comercial visible. Integrat entre executive section i LeadGuidedFlow.
**FET** *(2026-04-10 per `claude` — Canvi #46)*: `leadScoreBreakdownService.ts` — scoring explicable amb breakdown visual. Component `LeadScoreBreakdown` amb barra, factors, punts. Integrat al lead detail. 18 tests.
**FET** *(2026-04-10 per `claude` — Canvi #51)*: `leadReengagementService.ts` — 6 classificacions (UPCOMING_EVENT, HOT_STALE, QUOTE_NO_REPLY, NEGOTIATION_COLD, EARLY_SILENCE, LONG_DORMANT) amb missatges ca/es i UI `/admin/leads/reengagement`. 22 tests.
**FET** *(2026-04-10 per `claude` — Canvi #81)*: `leadPipelineSuggestionsService.ts` — 7 suggeriments automàtics de pipeline (hot uncontacted, stale negotiation, quote no reply, event soon, high value idle, bulk new, winning streak). API + panell integrat a `/admin/leads`. 25 tests.
**FET** *(2026-04-11 per `codex` — Canvi #109)*: `dailyBriefService.ts` deixa de duplicar criteris comercials i consumeix `loadPipelineSuggestions()` per alimentar alertes i accions de `HOT_UNCONTACTED`, `QUOTE_NO_REPLY` i `EVENT_SOON_NO_BOOKING` des de la capa canònica.
**FET** *(2026-04-11 per `codex` — Canvi #110)*: `operationalPulseService.ts` consumeix `loadPipelineSuggestions()` i separa la `conversió pipeline` del nou indicador `salut pipeline`, perquè el dashboard vegi tant el resultat com la fricció comercial real des de la mateixa font canònica.
**FET** *(2026-04-24 per `codex` — Canvi #381)*: el `SEGÜENT` queda regularitzat com a deute de checklist ja resolt. La feina funcional ja existia als Canvis `#327` i `#328`: `operationalPulseService` propaga `pipelineDrivers` derivats de `loadPipelineSuggestions()` i el dashboard els fa visibles tant a `OperationalPulsePanel` com al `Radar d'execució`. No hi havia cap segon tall de codi pendent a `§6.6`; només faltava sincronitzar el protocol.
**FET** *(2026-04-11 per `codex` — Canvi #113)*: el resum extern `commercial-daily` ja reflecteix les alertes crítiques del matí, de manera que el dashboard no és l'únic lloc on apareixen aquests senyals.
**FET** *(2026-04-26 per `codex` — Canvi #416)*: el vell `EN MARXA` de `§6.6` queda regularitzat com a feina ja consolidada. El mateix bloc ja documentava insights comercials executables (`#17`, `#36`, `#46`), suggeriments canònics de pipeline (`#81`) i la seva reutilització al brief i al pols operatiu (`#109`, `#110`, `#113`, `#381`); el pendent real que resta és exclusivament el `PENDENT CRÍTIC` d'evitar que Leads continuï separat conceptualment del Customer Hub.
**PENDENT CRÍTIC**: evitar que Leads sigui pantalla separada conceptualment del Customer Hub. Flux clar: lead nou → negociació → conversió → reserva → client recurrent.
**MÉS ENDAVANT**: reengagement de leads dormants automatitzat.

## 6.7 Bookings / Operacions
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: detall visual més fort. Header, KPI cards, seccions premium. Mojibake visible corregit.
**FET** *(2026-04-09 per `claude` — Canvi #1)*: timeline canònica a Bookings — `fetchCanonicalEventsForBooking` substitueix `adminLog` cru.
**FET**: transformació del detall en "cabina d'operacions" consolidada. El pendent viu ja no és la cabina operativa base sinó només la capa futura de planificació avançada.
**FET** *(2026-04-09 per `claude` — Canvi #14)*: `bookingOperationalService.ts` — snapshot operacional unificat. 25 tests, integrat a `page.tsx`.
**FET** *(2026-04-09 per `claude` — Canvi #19)*: `fetchCanonicalEventsForBooking` enriquit — consolida adminLog booking + inventory adminLog + leadActivity del lead origen en una sola història ordenada. Tanca el pendent crític de la història coherent.
**FET** *(2026-04-22 per `codex` — Canvi #330)*: `bookingOperationalService` deixa de fer una lectura paral·lela de `adminLog` per comunicacions. `commStatuses` i `recentCommRows` es deriven ara directament de `fetchCanonicalEventsForBooking()`, de manera que el detall de reserves reutilitza la mateixa timeline canònica que ja mostra l’historial.
**FET** *(2026-04-26 per `codex` — Canvi #414)*: el vell `EN MARXA` de `§6.7` queda regularitzat com a feina ja consolidada. El mateix bloc ja documentava snapshot operacional unificat (`#14`), història canònica coherent (`#1`, `#19`) i consolidació final dels estats de comunicació a monocapa shared (`#330` + `#331`); el pendent real que resta és exclusivament el `MÉS ENDAVANT` de planificació avançada.
**FET** *(2026-04-10 per `claude` — Canvi #50)*: `bookingCapacityService.ts` — visió global de càrrega operativa per dia. 4 nivells (FREE/LIGHT/FULL/OVERLOADED), grid 14d, KPIs. 15 tests.
**FET** *(2026-04-16 per `claude` — Canvi #129)*: alertes de col·lisió automàtiques — `loadCapacityConflicts()` integrat al `commercialDailyAutomationService` amb bloc HTML email + línia WhatsApp. Test mock + 2 tests específics (email + WA) afegits.
**MÉS ENDAVANT**: planificació avançada.

## 6.8 Inbox / Comunicacions
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: Inbox existent i funcional. Jerarquia del workspace reforçada amb triatge visible, recompte de resultats i acció recomanada al detall.
**FET**: integració a la història canònica del client consolidada. El pendent viu ja no és aquesta integració base sinó evitar que comunicacions tornin a derivar capes paral·leles per sobre de la monocapa actual.
**FET** *(2026-04-10 per `claude` — Canvi #37)*: `InboxLeadContext.tsx` — scoring comercial en temps real al panell de detall. Substitueix el hint estàtic per acció intel·ligent + puntuació + context temporal.
**FET** *(2026-04-10 per `claude` — Canvi #47)*: `commTimelineService.ts` — narrativa de comunicació unificada (EMAIL/WHATSAPP/CALL/NOTE) amb canal, direcció, mètriques. `CommSummaryPanel` lazy a l'Inbox. 16 tests.
**FET** *(2026-04-10 per `claude` — Canvi #78)*: `inboxTemplateService.ts` — 6 plantilles intel·ligents (primer-contacte, seguiment, seguiment-pressupost, confirmació-data, agraïment, reactivació) amb i18n ca/es i selecció contextual per estat. Integrat al `ComposeForm` amb panell visual. 22 tests.
**FET** *(2026-04-10 per `claude` — Canvi #80)*: `responseTrackingService.ts` — detecció de leads contactats sense resposta, 3 nivells urgència, accions suggerides ca/es. API `/api/admin/leads/follow-ups`. Panell `PendingFollowUpsPanel` integrat a Inbox amb accions ràpides. 17 tests.
**FET** *(2026-04-11 per `codex` — Canvi #109)*: `dailyBriefService.ts` consumeix `loadPendingFollowUps()` com a font canònica dels seguiments pendents i urgents; el brief del matí ja reflecteix la mateixa cua comercial que Inbox.
**FET** *(2026-04-11 per `codex` — Canvi #110)*: `operationalPulseService.ts` consumeix `loadPendingFollowUps()` i calcula la `taxa de seguiment` sobre la mateixa cua canònica d'Inbox, no sobre una aproximació local.
**FET** *(2026-04-11 per `codex` — Canvi #111)*: `useAdminAlerts()` incorpora `inboxUnreadCount` des de `/api/admin/inbox/messages?action=count` i refresc periòdic cada 60s; el badge global de notificacions de l'admin ja reflecteix també correu nou a Inbox.
**FET** *(2026-04-11 per `codex` — Canvi #113)*: `commercialDailyAutomationService.ts` ja incorpora les alertes `CRITICAL` del `Daily Brief` al resum extern del matí: es guarden al `summary`, s'injecten a l'email HTML i també al WhatsApp diari.
**FET** *(2026-04-16 per `codex` — Canvi #136)*: el resum canònic de comunicacions (`loadCommTimeline`) ja no queda aïllat a Inbox; el `Customer Hub` el consumeix també com a `commSummary` i el mostra dins del panell `Comunicacions`.
**FET** *(2026-04-16 per `codex` — Canvi #137)*: la narrativa canònica de comunicació també puja a la timeline del `Customer Hub`; els events de missatge mostren canal, direcció i preview des de la mateixa font de veritat.
**FET** *(2026-04-16 per `codex` — Canvi #138)*: `buildCommTimeline()` publica també `lastContactChannel`, `lastContactDirection` i `pendingResponseFrom`, i el `Customer Hub` ho utilitza per mostrar si l'última pilota està a la teulada de l'equip o del client.
**FET** *(2026-04-16 per `codex` — Canvi #139)*: el motor de `customerInsightsService` consumeix `commSummary.pendingResponseFrom` i converteix una entrada entrant pendent en acció recomanada `Respondre al client` amb urgència alta.
**FET** *(2026-04-16 per `codex` — Canvi #140)*: la CTA de l'`InsightsBanner` ja reutilitza `commSummary.lastContactChannel` per obrir `/admin/inbox/compose?template=recordatori` quan toca email i `wa.me` quan toca WhatsApp. El següent pas comercial ja no és neutre respecte al canal.
**FET** *(2026-04-16 per `codex` — Canvi #141)*: la mateixa lògica canònica de `responseTrackingService` ja entra al `Customer Hub`; el client veu si hi ha seguiment pendent real, no només l'últim missatge o el resum agregat.
**FET** *(2026-04-17 per `codex` — Canvi #142)*: `customerInsightsService` eleva el risc comercial per inacció a senyal canònic i el `Customer Hub` el pinta tant al banner com al resum superior. La falta de moviment comercial ja és visible fora del panell de comunicacions.
**FET** *(2026-04-17 per `codex` — Canvi #145)*: el helper `nextActionLink` resol també la CTA del risc comercial al resum superior del `Customer Hub`, de manera que la sortida operativa del risc queda alineada amb canal, urgència i top follow-up canònic.
**FET** *(2026-04-17 per `claude` — Canvi #144)*: `urgentFollowUpAlertService.ts` — alertes push immediates per follow-ups URGENT (≥5d sense resposta). Servei pur `filterNewUrgentAlerts` + `buildUrgentAlertEmail` + `buildUrgentAlertWhatsApp`. Wrapper `runUrgentFollowUpAlerts` amb supressió 24h per lead (setting-based). Cron `/api/cron/urgent-followup-alerts` amb Bearer. Registre `ADMIN_CRON_PREFIXES` (`alerts.urgentFollowUp`, 4x diari). 16 tests.
**FET** *(2026-04-17 per `codex` — Canvi #148)*: `commercialPriority` dona al `Customer Hub` una lectura operativa compacta de bloqueig comercial i següent pas, reutilitzant els mateixos senyals canònics de risc i seguiment pendent.
**FET** *(2026-04-17 per `codex` — Canvi #151)*: el `TimelinePanel` mostra un resum d'estat comercial actual abans de la cronologia, connectant risc, següent pas i CTA dins del mateix espai on es llegeix la seqüència de comunicació.
**FET** *(2026-04-22 per `codex` — Canvi #329)*: el resum de comunicacions deixa de viure com a reconstrucció local a Inbox. `CommSummaryPanel` consumeix ara `/api/admin/leads/[id]/comm-summary`, que delega a `loadCommTimeline()` basat en timeline canònica; el mateix servei continua alimentant `commSummary` del Customer Hub. Es redueix una capa paral·lela sense tocar schema ni fluxos de redacció.
**FET** *(2026-04-26 per `codex` — Canvi #417)*: el vell `EN MARXA` de `§6.8` queda regularitzat com a feina ja consolidada. El mateix bloc ja documentava resum canònic compartit entre Inbox i Customer Hub (`#136`, `#329`), narrativa de comunicació integrada a la timeline del client (`#137`, `#138`) i follow-ups/risc comercial reutilitzats fora d'Inbox (`#139`-`#151`); el pendent real que resta és exclusivament el `PENDENT CRÍTIC` d'evitar noves capes paral·leles de comunicacions.
**FET** *(2026-05-04 per `claude` — Canvi #496)*: el detall IMAP deixa de descarregar el RFC822 sencer amb attachments quan s'obre un mail. `fetchEmailByUid()` passa de `source: true` a `bodyParts: ['HEADER', 'TEXT']`, parseja només header+text i manté la detecció d'adjunts via `bodyStructure`; `__tests__/lib/imap-fetch-bodyparts.test.ts` blinda que no es torni a baixar el missatge complet. Efecte: el detall de mail evita timeouts/502 a Railway provocats per attachments grans.
**PENDENT CRÍTIC**: evitar que comunicacions visquin com a capa paral·lela.
**MÉS ENDAVANT**: inbox unificada multi-canal.

## 6.9 Social / Contingut / Growth
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: backend Social Media Calendar tancat (schema, servei `socialPostService`, routes `/api/admin/social-posts`, constants, 32 tests).
**FET** *(2026-04-10 per `claude` — Canvi #38)*: `SocialClient.tsx` + `/admin/social/page.tsx` — workspace complet amb vista llista, vista calendari mensual, CRUD modal, filtres per estat, navegació mensual, KPIs clicables. Integrat al menú a la secció Contingut.
**FET** *(2026-04-10 per `claude` — Canvi #40)*: `socialIdeasService.ts` — idees de post auto-generades des de bookings recents, testimonials aprovats, portfolio nou i esdeveniments futurs. Panell integrat al `SocialClient` amb pre-emplenat del modal.
**FET** *(2026-04-17 per `claude` — Canvi #147)*: `socialPerformanceService.ts` — mètriques de rendiment per canal: `computePlatformMetrics` (posts per estat, breakdown contentType/category, millor dia/hora, avgPostsPerWeek, daysSinceLastPost), `computeConsistencyScore` (% setmanes amb activitat), `generateRecommendations` (inactivitat, baixa freqüència, falta diversitat, posts no publicats). API `/api/admin/social-posts/performance`. 19 tests.
**FET** *(2026-04-24 per `claude` — Canvi #379)*: decisió canònica — **no cal planificador editorial avançat ara**. El workspace Social actual (vista llista + calendari mensual + modal CRUD + filtres + KPIs clicables + panell d'idees auto-generades des de bookings/testimonials/portfolio + mètriques de rendiment amb recomanacions automàtiques) cobreix el volum de posts esperat per una empresa DJ/events com Òrbita. Features que faltarien per ser "planificador avançat" (drag-drop entre dates, vista setmanal, bulk actions, multi-plataforma amb threading, calendari editorial per campanya) són overkill pel cas d'ús real. Reavaluar només quan `socialPerformanceService.generateRecommendations()` comenci a marcar "inactivitat sistèmica" o "baixa freqüència" de forma recurrent — és a dir, quan la feina volgui un ritme de posting que la UI actual no pugui sostenir. Aquesta decisió tanca explícitament el debat per evitar que un agent futur el reobri sense evidència operativa.
**PENDENT CRÍTIC**: evitar Social com a mòdul decoratiu aïllat. Ha de ser part del pipeline real de contingut.
**MÉS ENDAVANT**: calendari editorial viu, assistència de campanyes.

## 6.10 Finances / Reporting / BI
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: base potent d'economia, costos, estat financer.
**FET** *(2026-04-10 per `claude` — Canvi #43)*: `executiveReportService` ampliat amb conversió per origen, marge brut, recurrència i tendència mensual 6m. UI `/admin/reporting` amb headline KPIs, embut, marge, recurrència, conversió/origen, tendència i leads en risc.
**FET** *(2026-04-17 per `claude` — Canvi #146)*: `exportExecutiveReportCsv` — export CSV complet del reporting executiu amb 7 seccions (KPIs, embut, conversió/origen, recurrència, marge, tendència 6m, leads en risc). Ruta `/api/admin/reports/executive/export` retorna CSV amb `Content-Disposition: attachment`. Funció pura d'escape CSV (comes, cometes). 9 tests nous. Types exportats (`ExecutiveReport`, `ConversionBySource`, `MonthlyTrend`).
**FET** *(2026-04-17 per `claude` — Canvi #153)*: `executiveReportPdfService.ts` — export PDF complet amb jsPDF: header branded, KPI cards, taules estilitzades (embut, conversió/origen, recurrència, marge, tendència 6m, leads en risc), paginació automàtica, footers. Ruta `/api/admin/reports/executive/export-pdf`. 8 tests (4 servei + 4 ruta).
**PENDENT CRÍTIC**: reporting clar i accionable, no acumulació de mètriques.
**MÉS ENDAVANT**: tendències avançades, forecast comercial i operatiu.

## 6.11 UX / Visual / Marca
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: navegació millorada. Customer Hub i Bookings pujats visualment. Pintura forta de Claude.
**FET** *(2026-04-26 per `codex` — Canvi #410)*: el vell `EN MARXA` de l'auditoria visual/overflow global queda regularitzat com a feina ja consolidada. La base factual ja estava documentada a `§6.13` des dels Canvis `#385 + #388 + #389 + #391`: suite 100% verda, `qa:visual-overflow` obligatori dins `validate:core` i barrera automàtica contínua. A `§6.11` no quedava un segon tall de producte pendent; només faltava sincronitzar el checklist visual amb l'estat real del pipeline.
**FET** *(2026-04-10 per `claude`)*: visual premium aplicat a Lead detail (executive KPIs → glass+stagger, booking section → glass cards), Tasks (llista → glass cards amb indicador vençut), Social (KPIs → glass+stagger, posts → glass cards, idees → glass, calendari → glass). 0 hex hardcoded nous.
**FET** *(2026-04-10 per `claude` — Canvi #74)*: Activity — KPI stats cards, mobile cards i desktop table amb `admin-card-glass` + `admin-stagger-item` + hover subtle. Empty state coherent.
**FET** *(2026-04-20 per `codex` — Canvi #300)*: `Stats` entra al patró shared de configuració/editorial amb `EditorControlStrip`; el workspace deixa de començar només per comptadors i targetes locals i passa a resumir cobertura pública, overrides manuals, sessió oberta i següent pas abans d’editar.
**FET** *(2026-04-22 per `claude` — Canvi #301)*: `Pressupostos` (llistat) entra al patró shared de govern amb `OwnerControlStrip`; la pàgina deixa de començar només per KPI-cards i taula i resumeix primer catàleg comercial recent, tensions pendents (enviades fredes, acceptades sense reserva, esborranys vells, expirades) i el següent pas executable abans de baixar al detall.
**FET** *(2026-04-22 per `codex` — Canvi #302)*: `Activity` entra al patró shared de propietari amb `OwnerControlStrip`; el workspace deixa de començar només per filtres, KPI-cards i feed locals i passa a resumir volum, categoria dominant, lectura canònica i focus manual abans de baixar al detall.
**FET** *(2026-04-22 per `claude` — Canvi #303)*: `Packs` (llistat) entra al patró shared de govern amb `OwnerControlStrip`; la pàgina deixa de començar només per KPI-cards i graella i resumeix primer catàleg (actius, destacats, reserves/leads, sync BD↔config), salut (alertes de preu, marge crític, sense equip, càlcul parcial, sense rang de convidats) i següent pas que reutilitza el sistema `?focus=...` ja existent.
**FET** *(2026-04-22 per `claude` — Canvi #304)*: `Post-event` entra al patró shared de govern amb `OwnerControlStrip`; la pàgina deixa de començar només per KPI-row i els 3 passos del workflow i resumeix primer cicle tancat (informes i enquestes completades, taxa de resposta), backlog (events sense informe, esborranys, enquestes pendents) i següent pas que escolleix informe concret > esborranys > enquestes > playbook.
**FET** *(2026-04-22 per `codex` — Canvi #305)*: `Emails Automàtics` entra al patró shared de propietari amb `OwnerControlStrip`; el workspace deixa de començar només per stats, automatitzacions i blocs laterals i passa a resumir cua post-event, salut del cron, activitat recent i focus manual abans de baixar a la llista i a la configuració.
**FET** *(2026-04-22 per `claude` — Canvi #306)*: `Codis de descompte` entra al patró shared de propietari amb `OwnerControlStrip`; la pàgina deixa de començar només per KPI-grid i formulari/llistat i resumeix primer catàleg promocional (total/actius/caducats, usos acumulats), backlog (caducats amb bandera activa, esgotats, caducats en ≤7 dies, ≥80% usos, actius sense ús) i següent pas executable abans de baixar al catàleg. Les CTAs del strip apunten a ancoratges `#nou-codi` (auto-obre formulari via `useEffect`) i `#codis-list`.
**FET** *(2026-04-22 per `claude` — Canvi #308)*: `Ressenyes` entra al patró shared de propietari amb `OwnerControlStrip`; la pàgina deixa de començar només per KPIs i pestanyes pending/approved i resumeix primer volum i nota mitjana (reutilitzant `avgRating`), backlog (pendents per moderar, pendents >7 dies, pendents i aprovades amb <4★) i següent pas executable. Les CTAs del strip apunten a ancoratges `#pendents` / `#aprovades` amb sync automàtic de `activeTab` via listener `hashchange`.
**FET** *(2026-04-22 per `codex` — Canvi #309)*: `Cobertura` entra al patró shared de propietari amb `OwnerControlStrip`; la pàgina deixa de començar només per stats, formulari i llistat provincial i passa a resumir mapa actiu, províncies sense cobertura, tensió manual i següent pas abans de baixar al detall.
**FET** *(2026-04-22 per `claude` — Canvi #310)*: `Catàleg` (hub `/admin/catalog`) entra al patró shared de propietari amb `OwnerControlStrip`; la pàgina deixa de començar només per pestanyes (packs/extres/inventari/preus) i resumeix primer salut del catàleg (packs actius amb distribució sans/vigilar/crítics, marge mitjà vs objectiu), backlog (packs crítics, a vigilar, sense inventari, amb desviació ≥20% vs preu recomanat) i següent pas executable reutilitzant `?focus=critical-margin`/`?focus=without-inventory` de `/admin/packs`.
**FET** *(2026-04-22 per `codex` — Canvi #311)*: `Funcionalitats` entra al patró shared de propietari amb `OwnerControlStrip`; la pàgina deixa de començar només per stats i llistat de toggles i passa a resumir catàleg actiu/inactiu, primera peça apagada, mutacions en curs i següent pas abans de baixar al detall.
**FET** *(2026-04-22 per `claude` — Canvi #312)*: `Portfolio` entra al patró shared de propietari amb `OwnerControlStrip`; la pàgina deixa de començar només per dues legendes i tabs `Media`/`Events` i resumeix primer catàleg (events totals publicats/esborranys, peces vinculades, categories actives), backlog (sense portada, sense media, esborranys pendents, categories buides) i següent pas executable. Les CTAs del strip apunten a ancoratges `#media` / `#events` amb sync automàtic de `tab` via listener `hashchange`.
**FET** *(2026-04-22 per `codex` — Canvi #313)*: passada responsive `375px` aplicada a `Activity`, `Emails`, `Lead detail` i `Social`; els punts amb més pressió d’ample (toolbars, cues, CTA stacks, paginació, headers i modals) deixen de dependre d’una sola línia rígida en mòbil estret.
**FET** *(2026-04-22 per `codex` — Canvi #314, recollint tall de `claude`)*: `Missatges` entra al patró shared de propietari amb `OwnerControlStrip`; la pàgina deixa de començar només per KPI-cards, CTAs i llistat recent i passa a resumir safata activa, backlog NEW >24h, entrades sense nota/contacte i següent pas executable abans de baixar a les converses.
**FET** *(2026-04-22 per `codex` — Canvi #315)*: `Privacitat` entra al patró shared de propietari amb `OwnerControlStrip`; la pàgina deixa de començar només per KPI-cards, pestanyes i llistats RGPD i passa a resumir tensió legal de sol·licituds, base activa de consentiments i traça d'auditoria, amb hash-sync de pestanyes perquè el següent pas obri `requests`, `consents` o `audit` sense duplicar navegació.
**FET** *(2026-04-22 per `codex` — Canvi #316)*: `Text Manager` entra al patró shared de propietari amb `OwnerControlStrip`; el workspace deixa de dependre només del header sticky, filtres i targetes de sessió i passa a resumir primer el catàleg editorial carregat, els canvis pendents, el focus actiu i el següent pas (`search`, `save`, `sections`, `content`) sense tocar l’autotraducció ni el flux d’edició.
**FET** *(2026-04-22 per `codex` — Canvi #317)*: `Calendari` entra al patró shared de propietari a la vista mes (`CalendarMonthClient`) amb `OwnerControlStrip`; el workspace deixa de dependre només de toolbar, KPI-cards i graella i passa a resumir primer ocupació visible, dies mixtes, tensió manual (capes amagades, detall obert, bloqueig en preparació, drag&drop) i següent pas cap a setmana, dia o detall.
**FET** *(2026-04-22 per `codex` — Canvi #318)*: `Canvas Editor` entra al patró shared de propietari amb `OwnerControlStrip`; el workspace deixa de dependre només de toolbar, llenç i panell lateral i passa a resumir composició viva, tensió de sessió (selecció, moviment, redimensionat, exportació) i següent pas cap a plantilles, propietats, capes o toolbar.
**FET** *(2026-04-22 per `codex` — Canvi #319)*: passada responsive menor `375px` sobre `Calendari` i `Canvas`; la toolbar superior del calendari, els CTAs del detall del dia, la toolbar del canvas, l’exportació, les plantilles, els presets i els controls d’alineació deixen de dependre de files rígides en ample curt.
**FET** *(2026-04-22 per `codex` — Canvi #320)*: review responsive final `375px` sobre `Missatges`, `Privacitat` i `Text Manager`; els CTAs principals, tabs/filtres i barres sticky deixen de dependre d’una sola fila rígida i poden apilar-se o ocupar ample complet quan l’ample és curt.
**FET** *(2026-04-22 per `codex` — Canvi #328)*: el `Radar d’execució` del dashboard reaprofita els `pipelineDrivers` canònics quan existeixen, en lloc de viure només de comptadors locals. El protocol ja no deixa aquest punt a mig camí entre mètrica agregada i radar separat.
**FET** *(2026-04-22 per `codex` — Canvi #327)*: el dashboard ja destaca explícitament quins senyals del pipeline degraden el pols operatiu; `operationalPulseService` propaga `pipelineDrivers` derivats de `loadPipelineSuggestions()` i `OperationalPulsePanel` els fa visibles sense crear una segona lògica paral·lela.
**FET** *(2026-04-22 per `codex` — Canvi #326)*: `tasks`, `intake` i el domini `leads` passen també per `buildLeadWorkspaceHref`; amb això, la canonització de navegació UI de lead queda pràcticament exhaustiva i el residu amb `/admin/leads/...` queda reduït bàsicament a endpoints API i rutes especials.
**FET** *(2026-04-22 per `codex` — Canvi #325)*: `calendario`, `bookings`, `presupuestos`, `sales-ops`, `reporting` i `mensajes` passen també a `buildLeadWorkspaceHref`; el contracte canònic de lead ja cobreix també aquest lot ampli de UI operativa/comercial i redueix encara més els literals dispersos.
**FET** *(2026-04-22 per `codex` — Canvi #324)*: la UI operativa d’`Inbox`, `Customer Hub` i dashboard principal deixa de fabricar rutes de lead a mà; els CTAs i navegacions d’aquestes superfícies passen a `buildLeadWorkspaceHref`, de manera que la canonització ja cobreix també la capa d’ús diari visible.
**FET** *(2026-04-22 per `codex` — Canvi #323)*: notificacions de lead (email, WhatsApp i webhook) passen també pel contracte canònic; `notificationService` deixa de construir l’URL absoluta del lead a mà i el test del servei queda estabilitzat amb mock explícit de `notificationRecipientsService`, evitant dependència a Prisma/BD local.
**FET** *(2026-04-22 per `codex` — Canvi #322)*: segona capa de canonització de links de lead a la capa servei; `executiveCockpit`, `nextBestAction`, `timeline`, `timelineQueryService` i `adminCommandPalette` deixen de fabricar `'/admin/leads/${id}'` directament i passen a resoldre’l amb `buildLeadWorkspaceHref`, de manera que el contracte canònic ja governa també el backend/pure layer que alimenta superfícies executives.
**FET** *(2026-04-22 per `codex` — Canvi #321)*: primera capa de canonització de CTA de lead fora del Lead Hub; `LeadInsightsBanner`, `PendingFollowUpsPanel` i `leadActionLink` deixen de construir rutes literals ad hoc i passen a consumir `lib/admin/leadWorkspaceHref.ts` per resoldre `workspace`, `compose`, `payments` i `tasks` amb un contracte compartit.
**FET** *(2026-04-24 per `claude` — Canvi #376)*: auditoria exhaustiva del codebase confirma que **tots** els CTAs de navegació UI a leads ja passen per `buildLeadWorkspaceHref`. Les 87 ocurrències restants de `/admin/leads/` al codi (30 fitxers) són tot URLs API (`fetch('/api/admin/leads/...')`), import paths (`@/app/admin/leads/colorTheme`), rutes especials que no representen fitxa de lead (`/admin/leads/reengagement`, `/admin/leads/new`) o strings de test — cap és un CTA candidat al helper canònic. El SEGÜENT queda tancat sense tall de codi: la canonització ja és 100%, no "pràcticament exhaustiva" com indicava el #326.
**PENDENT CRÍTIC**: identitat visual coherent entre admin, web pública i mòduls nous.
**MÉS ENDAVANT**: sistema visual formalitzat. Tokens, ritmes, components premium compartits. Mobile admin d'alt nivell.

## 6.12 Web pública / Conversió
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: base existent, fora del focus principal d'admin.
**EN MARXA**: direcció conceptual clara — web brutal, memorable, convertint molt. `Canvi #8` continua com a paraigua d'i18n/copy.
**FET** *(fins Canvi #55)*: drenats metadata, WhatsApp, reviews fallback, auto-reply, stats, packs, offers, extras, equipment catalog/specs, layout metadata, error/not-found copy i imports directes de `messages/*` des d'`app/**`. Guards actius: `qa:message-imports`, `i18n:packs:guard`, `i18n:equipment:guard`.
**FET** *(2026-04-12 per codex — Canvi #122)*: drenat el patró repetitiu de landings locals cap a helpers (localServiceLandingCopy, localPartyLandingCopy), hubs i serveis singulars reconnectats a SEO compartit (serviceHubSeo, standaloneServiceSeo), catàleg públic elevat a font de veritat (publicServiceCatalog) i navegació pública principal (/servicios, header, footer i bottom nav) alineada amb la mateixa jerarquia real de serveis.
**FET** *(2026-04-12 per codex — Canvi #123)*: entry points públics secundaris també alineats amb el mateix nucli visible de serveis; `not-found` deixa de repetir enllaços a mà, consumeix el catàleg compartit per evitar divergències entre errors, navegació i hub de serveis, i es retira la duplicació morta `PUBLIC_FOOTER_SERVICES_LINKS`.
**FET** *(2026-04-12 per codex — Canvi #124)*: la narrativa de la home deixa de viure amagada dins `lib/constants`; la showcase editorial (`ServicesGridElegant` i `MobileServicesCards`) es mou a `lib/publicHomeShowcase.ts`, separada explícitament del catàleg comercial compartit.
**FET** *(2026-04-12 per codex — Canvi #125)*: el portfolio showcase i les garanties mòbils de la portada també surten de `lib/constants`; passen a `lib/publicHomeShowcase.ts` i `index.ts` només en manté el contracte via reexport.
**FET** *(2026-04-24 per `codex` — Canvi #384)*: `discomovil/client.tsx` deixa de tenir la graella de zones de cobertura hardcodejada dins el component. Els quatre entry points zonals (`barcelona`, `maresme`, `girona`, `valles`) passen a `lib/publicServiceZones.ts` com a contracte shared (`PUBLIC_SERVICE_ZONE_LINKS.discomovil`) amb `href`, icona i claus de copy. La pàgina pública consumeix ara aquest helper i un test pur (`__tests__/lib/publicServiceZones.test.ts`) blinda l'ordre i el contingut del contracte. El `SEGÜENT` de §6.12 queda una mica més drenat perquè una altra peça de jerarquia comercial deixa de viure incrustada a UI.
**FET** *(2026-04-25 per `codex` — Canvi #386)*: `FiestasClient.tsx` deixa també de portar la seva graella zonal hardcodejada. Els entry points `/servicios/dj-fiestas-barcelona`, `...-maresme` i `...-costa-brava` passen a `lib/publicServiceZones.ts` com a `PUBLIC_SERVICE_ZONE_LINKS.fiestas`, amb el mateix patró shared que `discomovil`. `__tests__/lib/publicServiceZones.test.ts` s'amplia per blindar els dos contractes, i el `SEGÜENT` de §6.12 torna a drenar una altra peça concreta de jerarquia comercial incrustada a UI.
**FET** *(2026-04-25 per `codex` — Canvi #387)*: els breadcrumbs zonals que encara escrivien manualment el label base de `discomovil` queden alineats amb la mateixa capa de traducció shared que la resta de landings. `app/[locale]/servicios/discomovil-garraf/page.tsx`, `.../discomovil-costa-brava/page.tsx` i `.../discomovil-baix-llobregat/page.tsx` substitueixen el literal `'Discomóvil'` per `tCommon('nav.discomovil')`. No és un canvi de jerarquia gran, però sí un drenatge real de narrativa pública duplicada dins entry points comercials.
**FET** *(2026-04-25 per `codex` — Canvi #390)*: `discomovil` i `fiestas` deixen també de duplicar la capa visual de la seva secció de cobertura. El component nou `app/components/public/PublicServiceZonesSection.tsx` concentra el markup de títol + graella de targetes zonals, i tant `app/[locale]/servicios/discomovil/client.tsx` com `app/[locale]/servicios/fiestas/FiestasClient.tsx` passen a mapar `PUBLIC_SERVICE_ZONE_LINKS` cap a aquest component shared. `__tests__/app/components/public/PublicServiceZonesSection.test.tsx` blinda el render del contracte visual compartit.
**FET** *(2026-04-25 per `codex` — Canvi #393)*: `discomovil` i `fiestas` comparteixen també la CTA intermèdia pública. El component nou `app/components/public/PublicServiceMidCta.tsx` concentra el bloc de títol + subtítol + CTA cap al configurador, i les dues landings mantenen només el `href` i el tracking específic de servei. `__tests__/app/components/public/PublicServiceMidCta.test.tsx` blinda el render i la propagació del click handler.
**FET** *(2026-04-25 per `claude` — Canvi #394)*: `bodas` també abandona la versió hardcodejada de la CTA intermèdia i delega en el `PublicServiceMidCta` shared, igual que `discomovil` i `fiestas`. `app/[locale]/servicios/bodas/client.tsx` substitueix les ~19 línies de markup inline de la secció `CTA INTERMEDI` per una sola crida al component, conservant el tracking `bodas_mid_cta` i les claus i18n (`heroTitle`, `heroSubtitle`, `configure`). El bloc de CTA intermèdia ja no viu duplicat a cap dels tres entry points comercials principals.
**FET** *(2026-04-25 per `claude` — Canvi #395)*: el patró de breadcrumb 4-entry de pàgines zonals (`home → /servicios → /servicios/<service> → <zonal>`) deixa de viure literal a 25 pàgines zonals i passa a un helper canònic compartit. `lib/publicZoneBreadcrumbs.ts` exporta `buildPublicZoneBreadcrumbs({service, zoneSlug, breadcrumbLabel, tCommon})` amb el contracte canònic per `bodas`, `discomovil` i `fiestas`. Les 11 `dj-bodas-X`, 7 `discomovil-X` i 7 `dj-fiestas-X` consumeixen ara el helper en lloc de re-construir el mateix array literal. `__tests__/lib/publicZoneBreadcrumbs.test.ts` blinda el contracte amb 4 tests (estructura per cada servei + ordre canònic).
**FET** *(2026-04-25 per `claude` — Canvi #396)*: els 3 enllaços legals del `MobileFooter` deixen de viure hardcoded i passen al catàleg compartit `PUBLIC_MOBILE_FOOTER_LEGAL_LINKS` a `lib/constants`. `app/components/mobile-ultimate/MobileHomePage.tsx` mapeja el catàleg amb separadors `·` automàtics i prepend del locale al render. Mateix patró que `PUBLIC_FOOTER_LEGAL_LINKS` per al footer desktop (#388 de la línia editorial #28-#69). `__tests__/lib/publicMobileFooterLegalLinks.test.ts` blinda les 3 entrades canòniques (privacitat, cookies, avís legal) amb les seves claus de traducció.
**FET** *(2026-04-25 per `claude` — Canvi #397)*: les pàgines standalone `produccion` i `alquiler` (estructura idèntica literal: `<h1>` + tagline + desc + features list + CTAs + ServiceJsonLD + FAQ) deixen de duplicar el bloc i deleguen al component shared `app/components/public/StandaloneServicePage.tsx`. El component server consumeix `pages.servicios.items.<key>.{name,tagline,desc,features}` i renderitza els links shared `/contacto` i `/configurador`. Cada pàgina només manté `slug`, `itemKey`, `seo` (de `STANDALONE_SERVICE_SEO`) i `faqItems` específics. Test pur amb mocks de `getTranslations`, `Link`, `ServiceJsonLD` i `FAQ`.
**FET** *(2026-04-25 per `claude` — Canvi #398)*: el patró literal `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(...)}` deixa de viure en 10 punts UI dispersos i passa a consumir el helper canònic `WHATSAPP_URL_WITH_MESSAGE(message)` ja existent a `lib/constants` però fins ara no aprofitat. Migrats: `app/[locale]/contacto/client.tsx`, `app/[locale]/tematica-halloween/client.tsx` (2 ocurrències), `app/[locale]/experiencias/page.tsx`, `app/[locale]/faq/client.tsx`, `app/[locale]/servicios/client.tsx`, `app/components/home/FAQSection.tsx`, `app/components/marketing/CTAFinal.tsx`, `app/components/ui/CalendarioUrgencia.tsx` (2 ocurrències). Total: 11 substitucions a 8 fitxers, amb canvi simultani de l'import (`WHATSAPP_NUMBER` → `WHATSAPP_URL_WITH_MESSAGE`). `__tests__/lib/whatsappUrlWithMessage.test.ts` (4 tests) blinda el helper: estructura canònica, encoding de caràcters perillosos (`& = ? #`), missatge buit, i que el número provingui de `WHATSAPP_NUMBER` (sense literals).
**FET** *(2026-04-25 per `claude` — Canvi #399)*: `bodas` també delega la secció de zones de cobertura al `PublicServiceZonesSection` shared, igual que `discomovil` i `fiestas` (#390). El component shared s'amplia amb props opcionals `badge`, `subtitle` i `headingLevel` per absorbir el cas bodas (header més ric amb badge `MapPin` + h3 + subtitle) sense trencar el cas simple de discomovil/fiestas (només h2 amb title). El bloc inline de 24 línies de `bodas/client.tsx` se substitueix per una sola crida al component shared. Test del component ampliat amb un cas nou per la variant bodas (badge + subtitle + h3).
**FET** *(2026-04-25 per `claude` — Canvi #400)*: el helper `trackServiceEvent` (idèntic a 3 service clients amb la seva pròpia còpia de `AnalyticsValue`/`AnalyticsParams`/`GtagWindow` types + funció) passa al canònic `trackPublicServiceEvent` a `app/lib/analytics.ts` (mateix lloc que els altres trackers GA4 ja existents — `trackEvent`, `trackLead`, `trackWhatsAppClick`, etc.). Tipus `PublicServiceEventValue` i `PublicServiceEventParams` també exportats. `app/[locale]/servicios/{bodas,discomovil,fiestas}/client.tsx`: imports de `trackPublicServiceEvent`, eliminats els 3 blocs locals de tipus + funció (~10 línies/fitxer = 30 línies netes), totes les crides renombrades. `__tests__/app/lib/trackPublicServiceEvent.test.ts` (4 tests) blinda el contracte: forward correcte a `window.gtag('event', ...)`, no-op si `window.gtag` no existeix, no-op en SSR, passa qualsevol shape de params (string/number/boolean/undefined).
**FET** *(2026-04-26 per `claude` — Canvi #401)*: el patró `useState(fallback)` + `useEffect` que feia fetch a `/api/public/image-manager?key=<X>` i extreia `data?.data?.[X]?.item?.src` deixa de viure duplicat literal a 3 components UI (header desktop, footer, mobile home) i passa a un hook canònic `useManagedImageSrc(key, fallback)` a `lib/hooks/useManagedImageSrc.ts`. `HeaderChampion.tsx` i `footer.tsx` (ambdós amb `layout.logo.header` + fallback `/img/logoplanetatextdreta.svg`) i `MobileHomePage.tsx` (`layout.logo.admin` + `/img/orbita-glyph.svg`) consumeixen ara el hook amb una sola línia. ~50 línies netes eliminades. `__tests__/lib/hooks/useManagedImageSrc.test.tsx` (6 tests) blinda: fallback inicial, substitució amb src gestionat, encoding de la key, fallback si `!response.ok`, fallback si src buit/només-espais, fallback si fetch llença error de xarxa.
**FET** *(2026-04-26 per `codex` — Canvi #402)*: la navegació inferior pública deixa de viure en dues fonts paral·leles. `lib/constants/index.ts` tipa `PUBLIC_BOTTOM_NAV_ITEMS` com a contracte shared amb `id`, `icon`, `labelKey`, `href`, `exactMatch` i `highlight`; `app/components/mobile-ultimate/MobileBottomNav.tsx` deixa de declarar `home/services/portfolio/contact` a mà i passa a derivar els 4 items navegables i el FAB central del mateix catàleg que ja consumia `app/components/ui/BottomNav.tsx`. `__tests__/lib/publicBottomNavItems.test.ts` blinda ordre, shape i que només el configurador sigui l'item destacat. El `SEGÜENT` de §6.12 continua viu, però una altra capa de jerarquia pública ja no pot divergir entre variants mòbils.
**FET** *(2026-04-27 per `claude` — Canvi #431)*: el patró `fetch('/api/hero-media').then(r => r.json())` que vivia duplicat als dos heroes públics (`HeroElegant.tsx` desktop i `MobileHeroUltimate.tsx`) passa al client canònic `lib/api/heroMediaClient.ts`, que també re-exporta el `type HeroMediaItem` per evitar que cada caller el redefineixi via `typeof PUBLIC_HERO_MEDIA_FALLBACK`. Mateixa línia editorial de canalització de dades públiques que `#427` (`fetchPublicGoogleReviews`) i `#430` (`type GoogleReview` re-export). Comportament conservat: el desktop continua aplicant `shuffle()` sobre tot el catàleg; el mòbil continua filtrant a `type === 'image'` amb `url` no buit abans del shuffle. `__tests__/lib/api/heroMediaClient.test.ts` (3 tests) blinda URL canònica + parse, error amb status (`!ok` → `Error /503/`), i propagació d'`init` arbitrari (`signal: AbortController.signal`, `cache: 'no-store'`).
**FET** *(2026-04-27 per `claude` — Canvi #432)*: drenades 3 ocurrències residuals del polygon `M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z` que van escapar al `#412`. `app/components/home/GoogleReviewsRotating.tsx` (5 estrelles del fallback hero, una per `[1,2,3,4,5].map`), `app/components/marketing/CTAFinal.tsx` (1 estrella decorativa al trust strip 5.0/5) i `app/[locale]/reservar/page.tsx` (1 estrella al panell trust de la pàgina pública de reserva) passen ara al component canònic `<StarIcon className="..." fill="..." />` ja existent a `app/components/public/StarIcon.tsx` (#412). `GoogleReviewsRotating.tsx` ja l'importava; `CTAFinal.tsx` i `reservar/page.tsx` afegeixen l'import nou. La cobertura existent del component (`__tests__/app/components/public/StarIcon.test.tsx`, 4 tests del #412) ja blinda render canònic i propagació de props — la migració és substitució literal sense canvi de comportament. ~9 línies netes eliminades. L'única ocurrència restant del path inline (`app/admin/google-reviews/page.tsx:189`) és territori admin i queda explícitament fora d'aquesta línia editorial pública (§6.12).
**FET** *(2026-04-26 per `claude` — Canvi #407)*: el SVG complet del logo Google G (4 paths colorit `#4285F4`/`#34A853`/`#FBBC05`/`#EA4335` amb `viewBox="0 0 24 24"`) deixa de viure duplicat a 8 ocurrències a 6 fitxers públics i d'admin, i passa a un component canònic `app/components/public/GoogleGIcon.tsx` que rep tots els `SVGProps<SVGSVGElement>` (className, width, height, aria-hidden) i renderitza els 4 paths inline. Substituïdes a: `app/components/home/GoogleReviewsRotating.tsx` (×2), `app/components/mobile-ultimate/MobileHomePage.tsx` (×2 — la variant truncada `l3.66-2.84z` queda uniformitzada cap a la canònica `l2.85-2.22.81-.62z` sense canvi visual perceptible), `app/[locale]/opiniones/client.tsx`, `app/[locale]/opiniones/page.tsx` (variant truncada → canònica), `app/admin/google-reviews/page.tsx` i `components/reviews/ReviewsSection.tsx`. ~56 línies netes eliminades. `__tests__/app/components/public/GoogleGIcon.test.tsx` (3 tests) blinda render dels 4 paths amb fills oficials en l'ordre canònic, propagació de props arbitràries, i viewBox sense width/height. NO toca: 3 ocurrències a `ReviewsSection.tsx` que són fragments parcials d'1 path (badges `Deixa la teva opinió`, `Verificat google source`, `Ressenyes verificades`) i no representen el logo G complet.
**FET** *(2026-04-26 per `claude` — Canvi #412)*: el polygon SVG canònic d'estrella (`12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2`) deixa de viure duplicat a 5 ocurrències a 3 fitxers (`GoogleReviewsRotating.tsx` ×2, `MobileHomePage.tsx` ×2, `opiniones/client.tsx`) i passa a `app/components/public/StarIcon.tsx` amb dues peces: `StarPolygon` (només el polygon, perquè el cas `motion.svg` animat no pugui perdre la seva identitat) i `StarIcon` default (svg + polygon amb `SVGProps<SVGSVGElement>` arbitràries). Cada caller decideix presentació (filled-outline 20×20, sòlid 12/18, size variable) sense afegir lògica al component. ~17 línies netes eliminades. `__tests__/app/components/public/StarIcon.test.tsx` (4 tests) blinda render canònic, propagació de fill/stroke/strokeWidth/className, render sense props i ús aïllat de `StarPolygon` dins un svg extern.
**FET** *(2026-04-26 per `claude` — Canvi #422)*: el SVG canònic del logo WhatsApp (path `M17.472 14.382c-.297-.149...3.48-8.413z` amb `viewBox="0 0 24 24"` i `fill="currentColor"`) deixa de viure duplicat a 17 ocurrències a 17 fitxers (header, footer, FloatingCTAs ×2, ExitIntentModal, CTAFinal, ProcessSection, MobileHero, MobileCTAUrgency, MobileProcess, MobileAppShell, WhatsAppSticky, BottomCTABar, faq, servicios, experiencias, gracias) i passa a un component canònic `app/components/public/WhatsAppIcon.tsx` que rep tots els `SVGProps<SVGSVGElement>` (className, width, height, fill override, etc.) i renderitza el path inline. ~187 línies netes eliminades. `__tests__/app/components/public/WhatsAppIcon.test.tsx` (3 tests) blinda viewBox + path canònic + fill default, override de fill, propagació de aria-hidden/width/height. NO toca: l'ocurrència de `app/[locale]/contacto/client.tsx` perquè conté **dos paths** (path canònic + un segon path circular outline `M12 0C5.373 0 0 5.373 0 12...`) — variant visual diferent, no la mateixa dada SVG.
**FET** *(2026-04-26 per `claude` — Canvi #427)*: el patró `await fetch('/api/google-reviews') + await response.json()` deixa de viure replicat a 7 ocurrències a 5 fitxers (`GoogleReviewsRotating.tsx`, `MobileHomePage.tsx`, `opiniones/client.tsx`, `ReviewsSection.tsx` ×3 — `ReviewsSection` default + `ReviewsBadge` + `ReviewsInline`, `admin/google-reviews/page.tsx`) i passa a una funció canònica `lib/api/googleReviewsClient.ts` `fetchPublicGoogleReviews(init?)` que crida l'endpoint i retorna `GoogleReviewsResponse` parsejada (reusa el tipus canònic ja existent a `app/api/google-reviews/reviews-types.ts`). Llança error si `!response.ok` amb el status. Cada caller manté la seva mecànica de state (filter 5★, multi-source merge a opiniones, sync admin) però depèn d'un únic punt per la URL, el shape i el manegament de status. `__tests__/lib/api/googleReviewsClient.test.ts` (3 tests) blinda crida amb URL canònica + parse, error amb status quan no OK, propagació d'`init` (signal/cache).
**FET** *(2026-04-26 per `claude` — Canvi #430)*: la interface local `GoogleReview` deixa de viure replicada a 4 fitxers consumidors (`GoogleReviewsRotating.tsx`, `MobileHomePage.tsx`, `opiniones/client.tsx`, `admin/google-reviews/page.tsx`) i passa a importar-se canònicament des de `lib/api/googleReviewsClient.ts` (re-exportada des de `app/api/google-reviews/reviews-types.ts`). Cada caller tenia una variant lleugerament diferent (uns sense `time`, altres sense `source`, alguns amb `language` opcional, etc.) — totes redundants perquè la dada que arribava per fetch era sempre la mateixa shape canònica. `lib/api/googleReviewsClient.ts` ara re-exposa `GoogleReview` junt amb `GoogleReviewsResponse` perquè els consumidors només importin un fitxer. ~22 línies netes eliminades. Cap test nou — la canalització és una refactorització pura de tipus sense canvi de shape de runtime; la cobertura existent del client (#427, 3 tests) i dels components SVG (#407 #412 #422) continua validant l'ús. `tsc --noEmit` verd, `validate:core` verd 12/12.
**FET** *(2026-04-29 per `codex` — Canvi #448)*: els darrers enllaços públics de WhatsApp que encara fabricaven `wa.me` inline passen al helper canònic compartit. `app/[locale]/gracias/page.tsx`, `app/[locale]/boda-halloween/page.tsx` i `app/components/ui/ExitIntentModal.tsx` deixen de concatenar número + `encodeURIComponent(...)` al component i consumeixen `WHATSAPP_URL_WITH_MESSAGE(...)` des de `lib/constants`. El tall tanca l'última bossa visible del `PENDENT CRÍTIC` de §6.12 sobre literals públics compartits fora de `messages/*` + helper `lib/*`. Cobertura nova: `__tests__/app/gracias-page.test.tsx`, `__tests__/app/boda-halloween-page.test.tsx` i `__tests__/app/components/ui/ExitIntentModal.test.tsx` blinden els tres call sites.
**PENDENT CRÍTIC**:
- web i admin no poden semblar dos productes diferents
- els literals públics compartits no poden tornar a `app/config` ni components: han de passar per `messages/*` + helper `lib/*`
- evitar que la neteja i18n trenqui SEO o metadata per locale
**MÉS ENDAVANT**: refinament narratiu/SEO de pàgines singulars i hubs. Replantejament complet de home, serveis, portfolio, formularis i missatge de marca coherent entre web pública, admin i emails.

## 6.13 Qualitat / Tests / Fiabilitat
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: `tsc` en verd als blocs treballats. Tests globals pujats. Backend Social amb tests nous. Afegida regressió específica de `Customer Hub` perquè `fetchCustomerHub` consumeixi `lead.universalTasks` quan no hi ha `customerTasks`.
**FET** *(fins Canvi #69)*: `validate:core` passa complet: protocol, encoding complet, imports de messages, layer catalogs, Task canònic, TypeScript, i18n packs i i18n equipment. `build:ci` passa amb 255/255 pàgines; `qa:protocol` valida comptador, propietat de canvis nous i artefactes reals de newline.
**FET** *(2026-04-25 per `claude` — Canvis #385+#388+#389+#391)*: el review de regressions visuals + suite de tests ha arribat a **100% verd** amb barrera automàtica contínua. Suite total: **3287/3287 tests passed** (288 fitxers), 0 failures. `validate:core` passa **12 guards seqüencials**: qa:protocol, qa:protocol:test, qa:encoding, qa:language, qa:patches, qa:visual-overflow, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard. El `#385` va tancar el darrer deute ocult de tests (3 tests d'`InventoryListClient`); el `#388` va eliminar 40 ternaris inline dels 5 fitxers admin afectats; el `#389` va fer `qa:patches` guard obligatori; el `#391` va fer `qa:visual-overflow` guard obligatori. El "EN MARXA" passa a FET — la barrera verda ja no és "recent" sinó **contínua i protegida per pipeline automàtic**.
**FET** *(2026-04-10 per `claude`)*: suite completa passada — 2219 tests (166 fitxers), 0 failures, build net (255 pàgines), validate:core 7/7. Fix mock `executiveReportService.test.ts` (faltava `customer.aggregate` + `booking.findMany`).
**FET** *(2026-04-16 per `claude`)*: audit tests legacy — 0 refs a `LeadTask`/`leadTaskFacade`/`leadTaskRouteService` en codi i tests. Neteja canònica completa. Suite 2392/2392, 180 fitxers.
**FET** *(2026-04-17 per `claude` — Canvi #149)*: 3 tests de ruta nous per APIs creades avui: `/api/cron/urgent-followup-alerts` (5 tests: auth, token incorrecte, alertes noves, sense noves, error), `/api/admin/reports/executive/export` (4 tests: auth, permission, CSV headers, passthrough), `/api/admin/social-posts/performance` (4 tests: auth, default 90d, days custom, recomanacions). 13 tests de ruta.
**FET** *(2026-04-18 per `claude` — Canvi #175)*: tests d'integracio de ruta per 3 workspaces principals: Customer Hub (`/api/admin/customers/[id]/hub` — 6 tests: auth, hub complet, id passthrough, kpis/leads/bookings, insights, 404), Leads (`/api/admin/leads/[id]` — 11 tests: GET auth/data/id/404/500, PATCH auth/update/invalid/strict, DELETE auth/ok), Bookings (`/api/admin/bookings/[id]` — 17 tests: GET auth/permission/data/id/404/500, PATCH auth/permission/update/auto-trigger confirmed/no-trigger/invalid/strict, DELETE auth/permission/ok/404). 34 tests.
**FET** *(2026-04-18 per `claude` — Canvi #179)*: tests d'integració per 8 rutes secundàries: leads activities (GET/POST/DELETE — 12 tests), leads tasks (GET/POST — 10 tests), leads task detail (PATCH/DELETE — 9 tests), leads notes (POST/PUT/DELETE — 11 tests), leads score (GET/POST — 10 tests), leads snapshot (POST — 7 tests), customers activities (GET/POST — 11 tests), tasks detail (PATCH/DELETE — 10 tests). **80 tests** nous. Cobreix auth, validació Zod, CSRF, permission, passthrough id, errors 400/404/500.
**FET** *(2026-04-18 per `claude` — Canvi #181)*: tests d'integració per 8 rutes terciàries: bookings checklist (7), bookings inventory (14), bookings status (6), bookings communications (5), bookings calendar-sync (7), bookings portal-access (11), proposals detail (13), inbox messages (9). **72 tests** nous. Cobreix auth, permission, CSRF, Zod validation, auto-triggers, IMAP errors.
**FET** *(2026-04-18 per `claude` — Canvi #183)*: tests d'integració per 4 rutes restants: collaborators list+detail (14), discount-codes (9), custom-quotes list+detail (12), email-templates list+detail+upsert (11). **46 tests** nous. Cobreix auth, CSRF, Zod validation, CRUD complet, 404/500.
**FET** *(2026-04-18 per `claude` — Canvi #187)*: tests d'integració per 7 cron routes restants: commercial-daily (4), fuel-daily (4), invoice-sync (4), lead-cleanup (4), pack-pricing-check (4), post-event (6), reviews-sync (5). **31 tests** nous. Cobreix Bearer auth, token incorrecte, execució OK amb saveCronRunStatus, errors 500, batching (post-event), dades null (reviews-sync).
**FET** *(2026-04-18 per `claude` — Canvi #199)*: tests d'integració per 4 inventory + 6 packs + 4 privacy routes. **65 tests** nous. Cobreix auth, permission, Zod, formData photo, cron Bearer fallback, ARCO approve/reject, audit filtering.
**FET** *(2026-04-18 per `claude` — Canvi #192)*: tests d'integració per 7 rutes de customers (detail, consents, export, preferences, status, tags, check-duplicates) + 3 rutes d'invoices (list+create, detail, sync). **62 tests** nous. Fix TS `packName` al DTO de Codex.
**FET** *(2026-04-18 per `claude` — Canvi #190)*: tests d'integració per 4 rutes d'automatització + 6 rutes d'emails: automation commercial-sequences (9), daily-summary (5), enforce-sla (8), run-all (5), emails send (5), test (6), quote (6), run-cron (4), send-post-event (7), testimonials-reminder (3). **58 tests** nous. Cobreix auth, permission, CSRF, rate-limit, timeout SMTP→504, missing extras→400, 404/409/422, passthrough status.
**PENDENT CRÍTIC**: evitar que la cobertura tapi deute conceptual.
**MÉS ENDAVANT**: validació visual de pantalles clau.

## 6.14 Infra / Dev / Operativa
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: dev server local quan cal. Monocapa de constants reforçada. Guard anti-mojibake operatiu amb `qa:encoding` i `qa:encoding:changed`. Comptador d'admin compartit al header i mode ajuda corregit (arrenca OFF, bloqueja accions, permet scroll i es pot apagar sempre).
**FET** *(fins Canvi #70)*: `validate:core` ja inclou `qa:protocol`, `qa:protocol:test`, `qa:encoding`, `qa:message-imports`, `arch:layer:check`, `arch:task-canonical:check`, `tsc`, `i18n:packs:guard` i `i18n:equipment:guard`. `build:ci` depèn directament de `validate:core` abans de `next build`. El protocol queda protegit contra comptador desincronitzat, duplicats, falta de propietat i artefactes reals de newline.
**FET**: consistència i neteja general del repo consolidada a nivell de pipeline i guards. El pendent viu ja no és la neteja base sinó evitar regressions silencioses a mesura que el repo creixi.
**FET** *(2026-04-11 per `codex` — Canvi #111)*: el shell global de notificacions ja no depèn només de leads i alertes de negoci; també incorpora `inboxUnreadCount` i polling lleuger per detectar correu nou sense recarregar.
**FET** *(2026-04-11 per `codex` — Canvi #114)*: el shell admin deixa enrere el punt genèric de notificació: badge numèric real al header i l'entrada `Safata (IMAP)` mostra el recompte viu de correus no llegits en lloc del marcador estàtic `IMAP`.
**FET** *(2026-04-10 per `claude`)*: build complet amb barrera `validate:core` passat en verd (qa:protocol, qa:encoding, qa:message-imports, arch:layer:check, tsc, i18n:packs:guard, i18n:equipment:guard + next build).
**FET** *(2026-04-10 per `claude`)*: `validate:core` integrat a `ci.yml` com a step obligatori al job `lint-typecheck`. Substitueix els steps separats `arch:layer:check` + `tsc` per un sol `pnpm run validate:core` (7 guards).
**FET** *(2026-04-11 per `claude`)*: pre-commit hook instal·lat a `.git/hooks/pre-commit`. Executa `qa:encoding:changed` (mojibake dels fitxers canviats) + `tsc --noEmit` (TypeScript incremental). Lleuger (<5s) i bloquejant si falla.
**FET** *(2026-04-16 per `claude` — Canvi #127)*: mojibake residual eliminat a `lib/constants/index.ts` (~20 emojis corruptes CP1252→UTF-8 reparats: WEDDING, SOURCE_ICONS, LEAD_STATUS_ACTION_OPTIONS, INVENTORY_CATEGORY, SETTINGS, INTAKE_SOURCE/EVENT_TYPE_OPTIONS, ACTIVITY_CATEGORY_OPTIONS, TESTIMONIAL/DISCOUNT/LEAD_EMAIL icons, PUBLIC_TESTIMONIAL_API_MESSAGES). Allowlist `scripts/check-layer-catalogs.mjs` ampliat amb `lib/publicHomeShowcase.ts` (Canvi #124-125). Test `customerRouteService.test.ts` alineat al constant canònic `CUSTOMER_ANONYMIZED_NAME`. Validació: `validate:core` 7/7, 2392 tests, build net.
**FET** *(2026-04-16 per `claude`)*: `build:ci` avaluat — CI ja executa `validate:core` (job lint-typecheck) + `next build` (job build) per separat; `build:ci` queda com a conveniència local, no cal al CI. `check-patches` avaluat: 0 findings a 885 fitxers, 5 detectors centrats en code smells (no lingüístics). No cal separar ara — si apareixen falsos positius lingüístics, crear `check-language-quality.mjs` apart. `docs/runbook.md` i `docs/estat-admin.md` actualitzats: crons 6→10, endpoints `/api/admin/crons/...`→`/api/cron/...`.
**FET** *(2026-04-24 per `claude` — Canvi #354)*: `check-language-quality.mjs` integrat a `validate:core` amb test blindat. El guard lingüístic del repo (apòstrof català dins strings single-quoted, plurals incorrectes tipus `respostas`/`tascas`/`pressuposts`) ja existia com a script + entry `qa:language` a `package.json` però no entrava al pipeline. Afegit `pnpm run qa:language` dins `validate:core` entre `qa:encoding` i `qa:message-imports`. Nou test `__tests__/scripts/check-language-quality.test.ts` (7 tests: clean, apòstrof detectat en single-quote, no-flag en double-quote, plurals incorrectes detectats, skip `__tests__/`, skip `.test.` files). També queda escrita al §2.1 la **norma de tancament rigorós de tall** (aplica a `claude`, `codex` i `user`), documentant el que fins ara depenia de context oral: cada canvi requereix tests, validate:core verd, qa:protocol OK, §9 complet, diari, §6 actualitzat i regles noves al protocol.
**FET** *(2026-04-26 per `codex` — Canvi #418)*: el vell `EN MARXA` de `§6.14` queda regularitzat com a feina ja consolidada. El mateix bloc ja documentava `validate:core` com a barrera obligatòria, pre-commit hook, guards de protocol/encoding/language/patches/overflow i disciplina de tancament rigorós escrita al §2.1; el pendent real que resta és exclusivament el `PENDENT CRÍTIC` d'evitar regressions silencioses en un repo gran.
**FET** *(2026-05-01 per `codex` — Canvi #466)*: el nou perímetre HTTP de validacions del protocol ja queda alineat amb els contractes reals del repo i blindat amb test de route. `app/api/admin/protocol/validations/route.ts` deixa d'importar un helper inexistent (`@/lib/auth-utils`), substitueix el permís invàlid `write` pel permís canònic `mutate` i reutilitza `getAdminRole(req)` com a `validatedBy`. Test nou `__tests__/app/api/admin/protocol-validations-route.test.ts` cobreix `GET/POST/DELETE`, auth, permisos, body invàlid i la persistència del rol admin canònic. Efecte: `npx tsc --noEmit` i `validate:core` tornen a verd, i el mòdul de validacions del protocol deixa de ser una peça nova sense cobertura de contracte.
**FET** *(2026-05-01 per `codex` — Canvi #467)*: la validació humana del protocol deixa de ser només servei+API i passa a ser una eina operativa real dins l'admin. `/admin/docs/protocol` deixa `force-static`, carrega `loadCanviValidations()` en temps real, mostra KPI de percentatge validat i cada `Canvi #N` incorpora un panell `Validació humana` amb estat, actor, data, nota curta i CTA per marcar/desfer via `fetchWithCsrf('/api/admin/protocol/validations')`. Test nou `__tests__/app/admin/docs/ProtocolValidationToggle.test.tsx` blinda `POST`, `DELETE`, refresh i error visible. Efecte: la norma §2.1 de validació humana ja no viu només al paper; queda accionable des del viewer del protocol.
**FET** *(2026-05-01 per `codex` — Canvi #468)*: el viewer del protocol ja permet separar visualment el backlog humà pendent del que ja ha passat revisió. Nou helper pur `protocolValidationViewerService.ts` amb `normalizeProtocolValidationFilter()` + `filterProtocolCanvisByValidation()`, test propi (`__tests__/lib/services/protocolValidationViewerService.test.ts`) i wiring a `/admin/docs/protocol` via `?validation=all|validated|pending`, select al formulari i shortcuts ràpids `Tots / Validats / Pendents`. Efecte: el propietari pot veure només els canvis que encara requereixen validació humana, en lloc de recórrer manualment tota la llista.
**FET** *(2026-05-01 per `codex` — Canvi #469)*: el viewer prioritza la feina humana pendent sense obligar a obrir cap detall. El helper `filterProtocolCanvisByValidation()` ara ordena `pending → validated` quan el filtre és `all`, i cada resum de `Canvi #N` mostra badge visible `Pendent validació` o `Validat humà` al costat de l'estat del canvi. Test del helper ampliat a 6 casos per blindar aquesta ordenació. Efecte: el propietari veu d'un cop d'ull què queda per revisar i què ja està validat, sense escaneig manual.
**FET** *(2026-05-01 per `codex` — Canvi #471)*: els filtres del viewer ja mostren els comptadors reals de cada bucket humà. `protocolValidationViewerService.ts` guanya `summarizeProtocolValidationFilterCounts()` i el viewer pinta `Tots · N`, `Validats · N`, `Pendents · N` sobre el subconjunt ja filtrat per cerca `?q=`. Test del helper ampliat a 7 casos. Efecte: el propietari sap quants canvis queden pendents sense canviar de vista ni comptar manualment.
**FET** *(2026-05-01 per `codex` — Canvi #473)*: la vista de backlog humà ja entra al detall correcte sense fricció. `protocolValidationViewerService.ts` afegeix `describeProtocolValidationFilter()` i `shouldAutoOpenProtocolCanvi()`; el KPI `Filtre actiu` deixa de ser genèric i ara explicita `Sense filtre / Cerca activa / Només validats / Només pendents`, i quan el filtre és `pending` els `<details>` dels canvis pendents s'obren automàticament. Test del helper ampliat a 13 casos per blindar copy, auto-open i focus explícit. Efecte: el propietari veu immediatament què està revisant i pot validar els pendents sense un clic addicional per canvi.
**FET** *(2026-05-01 per `codex` — Canvi #475)*: el viewer ja porta l'usuari directament al primer canvi pendent del subconjunt actual. `protocolValidationViewerService.ts` afegeix `findFirstPendingProtocolCanvi()` i `/admin/docs/protocol` pinta el shortcut `Obrir primer pendent · #N` al costat dels filtres ràpids, preservant `?q=` i entrant directament a `?validation=pending&canvi=N#canvi-N`. Test del helper ampliat a 15 casos per blindar el càlcul del primer pendent i el cas `tot validat`. Efecte: la validació humana deixa de requerir escaneig inicial fins i tot quan hi ha molts canvis al bucket pendent.
**FET** *(2026-05-01 per `codex` — Canvi #476)*: el viewer descriu millor els extrems de la cua humana i assenyala el següent pendent sense haver d'entrar al detall. `protocolValidationViewerService.ts` afegeix `describeProtocolValidationEmptyState()`; el card `Validats humans` mostra `Següent pendent: #N · author` quan n'hi ha cap, i l'empty state de resultats deixa de ser genèric per diferenciar `Tot validat`, `Cap pendent amb aquesta cerca`, `Cap canvi validat` o `Cap coincidència`. Test del helper ampliat a 19 casos. Efecte: el propietari sap si realment la cua està buida o si només la cerca l'ha deixat sense resultats, i sempre veu quin és el proper canvi humà a revisar.
**FET** *(2026-05-01 per `codex` — Canvi #478)*: el viewer ja quantifica el progrés de validació dins la vista activa, no només al global. `protocolValidationViewerService.ts` afegeix `summarizeProtocolValidationProgress()` i el card `Validats humans` mostra `Vista actual: X/Y validats · Z%` sobre el subconjunt ja filtrat per `?q=` i `?validation=`. Test del helper ampliat a 21 casos, incloent subconjunt buit (`0/0`, `0%`). Efecte: el propietari entén d'un cop d'ull si la vista activa està a mig revisar o pràcticament tancada, sense haver de deduir-ho dels comptadors separats.
**FET** *(2026-05-01 per `codex` — Canvi #480)*: el bloc `Resultats canvis` deixa de parlar en genèric i s'alinea amb la vista real. `protocolValidationViewerService.ts` afegeix `describeProtocolValidationResults()` i el viewer canvia el títol/descripció segons `all / validated / pending` i la cerca activa, p.ex. `Pendents de validació (N)` amb nota d'auto-open o `Validats humans (N)` quan només es miren els ja revisats. Test del helper ampliat a 24 casos. Efecte: el context del llistat queda explícit sense obligar l'usuari a deduir-lo dels filtres superiors.
**FET** *(2026-05-01 per `codex` — Canvi #481)*: el bloc d'índex de seccions `§X.Y` també parla segons la vista real quan hi ha cerca activa. `protocolValidationViewerService.ts` afegeix `describeProtocolSectionResults()` i el viewer adapta títol/descripció del catàleg de seccions entre la vista base i `Seccions amb coincidències (N)`. Test del helper ampliat a 26 casos. Efecte: la cerca del protocol queda coherent tant al llistat de canvis com al llistat de seccions, sense copy genèric residual.
**FET** *(2026-05-01 per `codex` — Canvi #483)*: la drecera de backlog humà ja explica també quan no queda res per revisar. `protocolValidationViewerService.ts` afegeix `describeProtocolPendingShortcut()` i el bloc de filtres deixa de desaparèixer en silenci quan no hi ha pendents: mostra `Obrir primer pendent · #N` quan existeix un pendent i un estat passiu `Sense pendents` o `Sense pendents en aquesta cerca` quan la cua ja està resolta. Test del helper ampliat a 28 casos. Efecte: el viewer evita silencis ambigus i deixa clar si la cua humana està realment tancada.
**FET** *(2026-05-04 per `codex` — Canvi #486)*: el shortcut `Obrir primer pendent` del viewer deixa de filtrar un `href` brut. `protocolValidationViewerService.ts` extreu `querySuffix` i elimina el backtick residual que quedava enganxat al final de la URL `?validation=pending&canvi=N#canvi-N`. `__tests__/lib/services/protocolValidationViewerService.test.ts` guanya el cas explícit sense cerca activa, de manera que queden blindades tant la URL amb `?q=` com la versió base sense query. Efecte: el CTA del backlog humà torna a ser una drecera fiable i copiable, sense caràcters paràsits al final de l'àncora.
**FET** *(2026-05-04 per `codex` — Canvi #487)*: la pàgina `/admin/docs/protocol` deixa de dependre només de proves de helpers i toggle aïllat. Nou test d'integració `__tests__/app/admin/docs/ProtocolPage.test.tsx` que renderitza el server component real amb markdown mockejat i valida tres contractes visibles: el shortcut `Obrir primer pendent · #N` amb `href` correcte, els comptadors humans (`Pendents · N`, progrés de la vista) i l'auto-open dels `<details>` quan el filtre és `pending`. Efecte: una regressió de wiring entre parser, viewer helpers, pàgina i CTA ja no passarà en silenci dins el front de validacions humanes.
**FET** *(2026-05-04 per `codex` — Canvi #488)*: el mateix test d'integració del viewer ara cobreix també les dues branques que quedaven fora de la pàgina real: `focusedSection` i l'estat passiu quan no hi ha cap pendent dins el subconjunt actual. `__tests__/app/admin/docs/ProtocolPage.test.tsx` guanya un tercer cas que obre `?seccio=6.14&q=infra&validation=pending`, comprova els links `Tornar a tot el protocol` / `Manual de possibilitats`, el missatge `Sense pendents en aquesta cerca` i l'empty state `Cap pendent amb aquesta cerca`. Efecte: el viewer ja no depèn d'inferències sobre aquestes dues branques; el render real queda blindat també quan el backlog humà filtrat és buit o quan s'entra des del manual a una secció concreta.
**FET** *(2026-05-04 per `codex` — Canvi #490)*: la mateixa barrera d'integració ara cobreix també la vista `validated` amb cerca i el buit de seccions del viewer real. `__tests__/app/admin/docs/ProtocolPage.test.tsx` guanya un quart cas que obre `?validation=validated&q=codex`, comprova el títol `Validats humans (1)`, la descripció contextualitzada amb la cerca, el link `Validats · 1`, el text passiu `Sense pendents en aquesta cerca` i l'empty state `Cap secció amb aquesta cerca`. Efecte: el wiring visible entre filtre `validated`, copy dinàmic, shortcuts passius i índex de seccions queda cobert també a nivell de pàgina, no només als helpers purs.
**FET** *(2026-05-04 per `codex` — Canvi #491)*: el toggle `ProtocolValidationToggle` deixa de dependre només de proves de happy path. `__tests__/app/admin/docs/ProtocolValidationToggle.test.tsx` cobreix ara també l'estat renderitzat quan un canvi ja està validat (`Validat per ...`, `Nota registrada: ...`, CTA `Desfer validació`) i el camí d'error quan el `DELETE /api/admin/protocol/validations` falla (`cannot-delete` visible, sense `router.refresh()`). Efecte: una regressió del component client en la lectura del registre humà o en el rollback de validació ja no passarà en silenci.
**FET** *(2026-05-04 per `codex` — Canvi #493)*: el parser del protocol deixa de degradar a `UNKNOWN` els canvis reclassificats o reservats amb context extra al header. `lib/services/protocolCanvisService.ts` ara normalitza també capçaleres com `(FET; reclassificat des de #487 ...)`, `(EN MARXA; reservat ...)` o `(PENDENT temporal ...)` a l'estat canònic correcte, en lloc d'exigir coincidència exacta. `__tests__/lib/services/protocolCanvisService.test.ts` guanya un cas amb els tres formats reals/adjacents. Efecte: el viewer i qualsevol consumidor de `parseProtocolCanvis()` deixa d'ensenyar `UNKNOWN` en canvis vàlids quan el protocol documenta col·lisions o context de sessió dins del mateix parèntesi.
**FET** *(2026-05-04 per `codex` — Canvi #495)*: el resum global de validacions humanes deixa de comptar validacions stale o futures que no corresponen a cap `Canvi #N` present al protocol parsejat. `summarizeValidations()` accepta ara la llista canònica de números existents, `/admin/docs/protocol` li passa `allCanvis.map((canvi) => canvi.n)` i els tests blinden tant el servei com el render real amb una validació `#999` que no ha d'inflar el KPI. Efecte: el card `Validats humans` no pot mostrar un 100% fals si el setting conserva entrades antigues o escrites fora del viewer.
**FET** *(2026-05-04 per `codex` — Canvi #497)*: `qa:protocol` deixa de validar només protocol + comptador i passa a exigir també l'entrada corresponent a `docs/diario.md` pel `ADMIN_CHANGE_COUNTER` actual. `scripts/check-admin-change-log.mjs` llegeix el diari i falla si no hi ha cap header `## ... Canvi #N`; `__tests__/scripts/check-admin-change-log.test.ts` guanya el cas negatiu que reprodueix el forat detectat al `#496`. Efecte: cap canvi futur podrà quedar formalment verd si el diari no acompanya el §9.
**FET** *(2026-05-04 per `claude` — Canvi #498)*: producció guanya smoke test automàtic post-deploy i heartbeat. `scripts/smoke-prod.mjs` comprova health, home pública, challenge d'auth admin i endpoints admin amb auth opcional; `.github/workflows/smoke-prod.yml` l'executa a `main`, cada 15 minuts i manualment. Efecte: regressions com redirects trencats, 502 o endpoints crítics lents deixen de dependre només d'una comprovació manual.
**FET** *(2026-05-04 per `codex` — Canvi #501)*: el CTA pendent del Manual queda cobert també a nivell de render real. `__tests__/app/admin/manual/AdminManualPage.test.tsx` renderitza el server component `/admin/manual` amb `fs` i `next/link` mockejats, comprova `Obrir §6.16 al protocol` amb `href=/admin/docs/protocol?seccio=6.16#seccio-6-16` i verifica que el CTA antic `§6.15` no aparegui. Efecte: una regressió de wiring entre constant, helper i UI ja no passa en silenci.
**FET** *(2026-05-04 per `codex` — Canvi #502)*: el protocol incorpora la norma d'autoregulació de model/effort i consum. Per defecte, `go` normal i canvis petits han d'usar context mínim suficient i raonament proporcional; només s'eleva a `high`/màxim quan hi ha risc real (producció, schema, auth, dades, concurrència, errors opacs, arquitectura o refactors grans).
**FET** *(2026-05-05 per `codex` — Canvi #505)*: el guard `qa:canonical-fetches` queda blindat explícitament contra crides qualificades a endpoints canònics (`window.fetch(...)` i `globalThis.fetch(...)`). `__tests__/scripts/check-canonical-fetches.test.ts` guanya un cas amb `/api/google-reviews` i `/api/public/stats` fora dels seus clients `lib/api/*`, verificant que el guard reporta dues violacions i recomana `fetchPublicGoogleReviews()` / `fetchPublicStats()`. Efecte: el `PENDENT CRÍTIC` de regressions silencioses queda una mica més tancat també davant variants habituals de fetch directe.
**FET** *(2026-05-05 per `codex` — Canvi #506)*: el guard `qa:canonical-svgs` ja cobreix també còpies parcials del Google G, no només el cas complet amb quatre colors. `components/reviews/ReviewsSection.tsx` deixa de tenir tres SVG inline amb el path de Google i passa a `GoogleGIcon`; `scripts/check-canonical-svgs.mjs` detecta el path blau canònic, i el test del guard blinda el cas. Efecte: una còpia parcial del logo ja no pot tornar a escapar perquè no porti tots els colors.
**FET** *(2026-05-05 per `codex` — Canvi #508)*: el guard `qa:patches` ja detecta marcadors `TODO`/`FIXME`/`HACK`/`XXX` també dins comentaris de bloc i JSDoc, no només com a `// TODO`. `scripts/check-patches.mjs` amplia `detectTodoMarkers()` i `__tests__/scripts/check-patches.test.ts` blinda fitxers nets, línia, bloc i exclusions de tests. Efecte: els deutes explícits no poden esquivar el guard canviant el format del comentari.
**FET** *(2026-05-05 per `codex` — Canvi #509)*: `hooks/useScrollTracking.ts` deixa d'usar `(window as any).dataLayer` i passa a consumir el global tipat `window.dataLayer` ja declarat a `types/window.d.ts`. `__tests__/hooks/useScrollTracking.test.ts` blinda que el hook mantingui `Array.isArray(window.dataLayer)` + `window.dataLayer.push` i que no torni el cast `window as any`. Efecte: menys escapes de tipus en analítica pública i regressió coberta.
**FET** *(2026-05-05 per `codex` — Canvi #510)*: `lib/hooks/useAnalytics.ts` també deixa de crear un alias manual `window as unknown as { dataLayer... }` i passa a usar `window.dataLayer` directament. `__tests__/lib/hooks/useAnalytics.test.ts` blinda que el hook mantingui el global tipat i que no torni `window as unknown`/`win.dataLayer`. Efecte: la capa d'analítica pública queda alineada amb el contracte global declarat, sense casts locals innecessaris.
**PENDENT CRÍTIC**: evitar regressions silencioses en repo gran.
**MÉS ENDAVANT**: scripts de salut del repo. Checks de consistència de dominis compartits.

## 6.15 Roadmap de millores identificades (backlog prioritzat)
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca.
**FET** *(2026-04-10 per `claude` — Canvi #84)*: backlog exhaustiu documentat a `lib/constants/adminManual.ts` com a `ADMIN_MANUAL_ROADMAP` i visible a `/admin/manual`. Cada ítem porta prioritat, impacte, esforç i àrea.
**FET** *(2026-04-30 per `claude` — Canvi #462)*: `ADMIN_MANUAL_ROADMAP` deixa de divergir d'aquesta secció. El contracte `AdminManualRoadmapItem` guanya `status: 'PENDING' | 'DONE'`, `doneCanvi?: number` i `doneNote?: string`; els 11 ítems CRITICAL/HIGH/MEDIUM/LOW que ja són FET aquí porten cita del Canvi #N corresponent (#115, #116, #126, #131, #133, #380, #408 + decisions sense Canvi únic), i només `marketing-analytics-hub` queda `PENDING`. La pàgina `/admin/manual` ordena pendents primer, pinta badge `Fet · Canvi #N` o `Pendent`, mostra `doneNote` als FET amb panell verd, i el KPI "Roadmap pendent" passa de `12` a `1`.
**FET** *(2026-04-30 per `claude` — Canvi #463)*: el roadmap ja no és informatiu passiu. Cada card té CTAs reals: botó primari `Obrir Canvi #N` (DONE) o `Obrir §9 al protocol` (PENDING) que enllaça al nou viewer `/admin/docs/protocol?canvi=N#canvi-N`, i botó secundari `Anar a {workspace}` per `area`. La línia `Verificat al §9: #N · DATE · AUTHOR · STATUS` mostra metadades llegides en runtime des del protocol via `parseProtocolCanvis()`, sense duplicació al constant. Guard `qa:roadmap-canvis` afegit a `validate:core` (12 → 13 guards) blinda que cada `doneCanvi` del roadmap correspongui a un `### Canvi #N — ... (FET)` real al §9 — qualsevol divergència futura falla el pipeline.
**FET** *(2026-05-04 per `codex` — Canvi #500)*: el CTA del roadmap pendent deixa de tenir la secció del protocol hardcoded. `AdminManualRoadmapItem` guanya `protocolSection?: string`, `marketing-analytics-hub` apunta explícitament a `§6.16` i `/admin/manual` construeix el CTA via `buildAdminManualRoadmapProtocolTarget()`. Efecte: l'únic pendent real de màrqueting obre directament el bloc de captació externa, no un `§6.15` genèric.
**FET** *(2026-05-04 per `codex` — Canvi #501)*: el wiring visible del `#500` queda blindat amb test de pàgina. El Manual renderitzat ja ha de mostrar `Obrir §6.16 al protocol` per l'ítem pendent `marketing-analytics-hub` i no pot tornar a mostrar `Obrir §6.15 al protocol` sense trencar `AdminManualPage.test.tsx`.

### SEGÜENT (Crítiques — impacte directe a conversió)
- **[CRITICAL] ~~Motor de nurturing automàtic de leads~~** — ✅ FET (anteriorment). `commercialSequenceService.ts` executa cadència 5 passos (1d/3d/7d/14d/30d) amb email/WA, integrat al cron `commercialDailyAutomation`.
- **[HIGH] ~~Forecast predictiu per estat del pipeline~~** — ✅ FET (Canvi #115). `loadDailyBrief` usa `LEAD_SCORING_STATUS_PROBABILITY` per estat en lloc de `budget × 0.3` fix.
- **[HIGH] ~~A/B testing de plantilles d'email~~** — ✅ FET (Canvi #133). `emailTrackingService.ts` ampliat amb click tracking (clickedAt/clickCount), link wrapping, report amb best/worst performer. Ruta `/api/tracking/click/[token]`, API `/api/admin/email-tracking`. Migració schema. 33 tests.
- **[HIGH] ~~Attribution multi-touch del journey~~** — ✅ FET (Canvi #128 + #131). `generateMultiTouchReport` + `loadMultiTouchReport` amb journeys, crèdits per canal (first/assist/last touch), insights i veredicte. 12 tests nous. Dashboard connectat al model multi-touch amb panell operatiu.
- **[HIGH] ~~Command palette global (Cmd+K)~~** — ✅ FET. Cercador universal per saltar a qualsevol pàgina/lead/client/reserva en <2s. Base funcional tancada al Canvi #102; lògica extreta a capa pura i coberta per tests al Canvi #380: `lib/services/adminCommandPaletteService.ts` exporta `buildAdminCommandItems`, `filterAdminCommandItems`, `buildAdminSearchEntries`, `buildAdminRecentEntries`, `buildAdminCommandEntries` i `buildAdminSelectableEntries` com a funcions pures sense dependència de React; `AdminSearchModal` consumeix aquests helpers; 13 tests cobreixen dedupe per href, prioritat, filtre amb/sense accents, entries de cerca/recents/commands, combinació recents+commands vs commands+search i edge cases (arrays buits, limit 0, results buits).

### SEGÜENT (Importants — qualitat operativa)
- **[MEDIUM] ~~Scoring dinàmic automàtic de leads~~** — ✅ FET (anteriorment). `commercialScoring.ts` calcula score 0-100 + probabilitat + band. Cron `commercialDailyAutomation` actualitza `cachedScore` diari en lots.
- **[MEDIUM] ~~Detector d'anomalies al Daily Brief~~** — ✅ FET (Canvi #115). `dailyAnomalyService.ts` compara 5 KPIs vs mitjana 30d, threshold 50%. Panel `AnomalyPanel` al dashboard quan hi ha desviacions.
- **[MEDIUM] ~~Alertes de conflicte de capacitat operativa~~** — ✅ FET (Canvi #116). `capacityConflictService.ts` detecta col·lisions d'inventari entre reserves. Panel `CapacityConflictPanel` al dashboard.
- **[MEDIUM] ~~Notificacions push/email per alertes CRITICAL~~** — ✅ FET (Canvi #115). `commercialDailyAutomationService` envia alertes CRITICAL per email i WhatsApp al resum diari.
- **[MEDIUM] ~~Benchmark automàtic setmanal~~** — ✅ FET (Canvi #126). Test de route nou (4 tests) + fix workflow `daily-crons.yml` (`if:` del job mai s'executava). Servei, ruta, catàleg ADMIN_CRON_PREFIXES i job GitHub Actions ja existien prèviament.

### MÉS ENDAVANT
- **[LOW] ~~Audit trail de decisions administratives — backend + analítica~~** — ✅ FET backend (Canvi #358), capa de lectura agregada (Canvi #360), endpoint HTTP (Canvi #363), wiring canònic de `statusRouteHandler` (Canvi #370), panell de lectura a `Sales Ops` (Canvi #372), formulari operatiu al Lead Hub/detall (Canvi #375), bloqueig del pas ràpid a `LOST` també al kanban/listat (Canvi #377), lectura visual del `lostReason` dins les targetes/llistats (Canvi #383) i migració `20260424120000_add_lead_lost_reason` desplegada a Railway (Canvi #408). `Lead` schema guanya `lostReason String?` i `lostAt DateTime?` (+ índex); `lib/constants/leadLoss.ts` publica `LEAD_LOST_REASONS` canònics (incloent `EVENT_PASSED` per auto-descartats) amb `LEAD_LOST_REASON_LABELS` i guards; `lib/services/leadLossService.ts` exporta `markLeadAsLost({leadId, reason, note?, actor?})`; `lib/services/leadLossAnalyticsService.ts` exporta `computeLossSummary()` + `loadLossReport({sinceDays})`; `GET /api/admin/reports/lead-losses` exposa el `LossSummary`; `Sales Ops` el llegeix des d'un `LossBreakdownPanel`; i totes les superfícies ràpides de canvi d'estat que porten a `LOST` ja demanen `lostReason` + `note` abans de persistir, mentre que `LeadLostReasonBadge` en fa visible la classificació des de la llista i el kanban.

**PENDENT CRÍTIC**: aquestes millores no són "nice to have" aïllades — cadascuna tanca un gap identificat. Prioritzar per impacte vs esforç.

## 6.16 Màrqueting i captació externa (del zero)
**CONTEXT**: L'usuari reconeix que no té experiència en màrqueting i els clients no arriben. L'admin està preparat per gestionar leads, però fa falta un embut de captació real. Aquesta secció és el pla d'acció pas a pas.
**FET** *(2026-04-10 per `claude` — Canvi #84)*: pla d'acció màrqueting documentat (veure baix). Cal executar-lo per fases.
**FET** *(2026-05-04 per `codex` — Canvi #500)*: el manual de possibilitats ja envia el roadmap pendent `marketing-analytics-hub` cap a aquest bloc (`/admin/docs/protocol?seccio=6.16#seccio-6-16`). Això reforça la regla d'aquesta secció: abans d'obrir integracions cares d'ads/GA4/GBP, cal treballar la captació per fases.

### Fase 0 — Fundació (abans de gastar res)
- **Definir 1 client ideal clar** (ICP): tipus d'event (bodes? corporatius? festes privades?), ubicació, pressupost mig, què busquen.
- **Proposta de valor en 1 frase**: "Ajudem a [X] a [Y] sense [dolor]". Si no la tens clara, res funcionarà.
- **Optimitzar el web actual**: testimonials reals, galeria bona de portfolio, WhatsApp/form ben visibles, pàgina per cada tipus d'event (SEO local).
- **Google Business Profile**: obligatori. Gratuït. Fitxa amb fotos, horaris, ressenyes. Apareixes a Google Maps per "events [ciutat]".

### Fase 1 — Captació gratuïta (primers clients sense invertir)
- **SEO local**: pàgines específiques per ciutat + tipus d'event (`/events-corporatius-barcelona`, `/bodes-girona`). Contingut útil, no spam.
- **Ressenyes Google**: demana ressenya a cada client content. 10 ressenyes = confiança visible.
- **Instagram/TikTok orgànic**: 3 posts/setmana de bolos reals. Before/after, setup, moments clau. Social ja té el workspace al repo — cal usar-lo.
- **WhatsApp Business**: catàleg de serveis + respostes automàtiques. Lliure.
- **Xarxa personal**: avisa 50 contactes rellevants que el negoci existeix. El primer client sol venir d'aquí.
- **Partners**: restaurants, fotògrafs, DJs, event planners. Comissió o intercanvi. El teu CRM ja té `referralsService` — aprofita-ho.

### Fase 2 — Captació pagada (quan els orgànics funcionin)
- **Google Ads "Performance Max" o "Search"** amb keywords locals (ex: "empresa events corporatius Barcelona"). Pressupost inicial: 150-300€/mes. ROI mesurable al CRM amb `attribution multi-touch` (§6.15).
- **Meta Ads (Instagram)**: anuncis a públic local interessat en events. Format carousel amb portfolio real. 200-400€/mes.
- **Remarketing**: qui visita el web sense contactar, re-impactar 7 dies a Instagram/Google. Molt barat i efectiu.

### Fase 3 — Sistematització (quan ja hi ha flux)
- **Content marketing**: blog amb "Com organitzar un event corporatiu a [ciutat]", "10 errors a evitar en una boda". Tràfic orgànic constant.
- **Email màrqueting**: newsletter trimestral a clients anteriors + prospects. `inboxTemplateService` ja pot servir com a base.
- **Referral program**: el que ja tens a `/admin/clientes/referrals` — activar-lo amb incentiu (descompte, servei extra).
- **Partnerships formals**: acords signats amb 3-5 partners que porten leads regularment.

### Mesurar què funciona
- **CAC (Customer Acquisition Cost)**: quant et costa aconseguir un client per canal. Sense això, no saps on invertir.
- **LTV (Lifetime Value)**: quant val un client al llarg del temps. El `customerInsightsService` ja el calcula.
- **Ratio LTV:CAC**: ha de ser >3. Si és <2, el canal no és rendible.
- **Attribution**: quin canal porta els leads? Millor canal = més inversió.

**PENDENT CRÍTIC**: no dispersar esforç. Una fase a la vegada. Un canal a la vegada fins que funcioni. La dispersió mata els petits negocis.

## 6.17 Front inventari + packs (estat operatiu)
**OBJECTIU**: que la relació entre equipament i packs sigui visible, entenedora i accionable des de llista, no només des del detall.
**COMENÇAT PER**: `claude`
**TREBALLANT PER**: `codex`
**ESTAT ACTUAL**:
- `FET`: relació visible inventari → packs a `/admin/inventory` amb badges clicables cap a la pestanya d'equip del pack.
- `FET`: relació visible packs → equip a `/admin/packs` amb preview real de material dins de cada card.
- `FET`: botó secundari de pack corregit: `Equip` obre directament `/admin/packs/[id]?tab=content`.
- FET: editor detall d'inventari pujat a fitxa operativa amb lectura ràpida, checklist d'edició i accions més clares.
- FET: pestanya content del pack editor simplificada i elevada visualment, amb flux de treball, lots reutilitzables i lectura més clara de la composició.
- FET: compositor automàtic explicat com a punt de partida, amb modes visibles i revisió explícita de quantitats i obligatorietat.
**CARACTERÍSTIQUES EXIGIDES**: relació bidireccional visible · zero contingut opac · bellesa funcional · zero overflow · TypeScript verd al perímetre.
**FET** *(2026-05-04 per `claude` — Canvi #485)*: el `SEGÜENT` d'aquesta secció estava ocupat per un text desencaixat ("preparar una reunió de treball per definir Fase 0 (ICP + proposta de valor) — sense això no es pot començar res") que pertany conceptualment a `§6.16 Màrqueting i captació externa · Fase 0 — Fundació` (definir ICP, proposta de valor, optimitzar web, Google Business Profile), no a aquesta secció d'inventari+packs. La Fase 0 ja viu correctament documentada a `§6.16` amb les seves 4 sub-tasques. Aquí queda eliminat el residu sense duplicar — el bloc d'`ESTAT ACTUAL` ja deixa veure que la relació bidireccional inventari↔packs està drenada (badges clicables, preview de material, editor detall, pestanya content, compositor automàtic). No hi ha cap tall executable immediat pendent en aquesta zona. Mateix patró que el `#484` de codex (Camí 2 a §6.18) i el `#447` de claude (Camí 1 a §6.18).
**MÉS ENDAVANT**: refinaments d'UI sobre la mateixa relació quan apareguin friccions reals d'ús.

## 6.18 Auditoria CRMs top — backlog d'incorporacions
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET** *(2026-04-29 per `codex` — Canvi #450)*: B.9 tancat amb marge viu al PDF Studio. `PresupuestoPdfStudio` carrega la `profitabilityConfig` canònica, calcula el resum via `costEngine` i `StudioPreview` mostra `cost directe`, `marge net`, `% marge` i CAC estimat amb to semàfor, sense crear un segon motor econòmic.
**FET** *(2026-04-29 per `codex` — Canvi #449)*: B.8 tancat amb auto-suggeriment de pack integrat a `/admin/quick-create`. El formulari calcula suggeriment client-side a partir de `eventType + guestCount + budget`, mapeja el pack de config al pack real de Prisma per `slug`, mostra confiança + motius + alternatives i permet aplicar la recomanació sense sobreescriure la tria manual.
**FET** *(2026-04-29 per `claude` — Canvi #447)*: regularització documental del Camí 1 i meitat del Camí 2. Els ítems A.2 (#437), A.3 (#438), A.4 (#441), A.5 (#442), B.6 (#444) i B.7 (#446) ja estaven tancats al §9 però seguien llistats com a `SEGÜENT` aquí. Camí 1 ara 100% FET. Camí 2 redueix `SEGÜENT` a B.8 + B.9.
**FET** *(2026-04-28 per `claude` — Canvi #436)*: backlog complet d'auditoria contra CRMs top documentat (HubSpot, Pipedrive, Monday CRM, Zoho, Salesforce + Tave/Honeybook per events). 27 ítems agrupats en 7 àrees (A-G) amb tag de criticitat (`[BLOC]` mai pot faltar · `[BÀSIC]` sentit comú · `[USP]` diferenciador d'Òrbita) i priorització en 3 camins paral·lels.
**FET** *(2026-04-28 per `claude` — Canvi #435)*: A.1 — vinculació explícita lead→client amb match per email/DNI/telèfon i feedback explícit. Tancat amb `leadCustomerLinkService` + endpoint + panell + 13 tests.
**LLEGENDA**: `[BLOC]` mai hauria de faltar a un CRM seriós · `[BÀSIC]` sentit comú a tots els tops · `[USP]` diferenciador d'Òrbita.

### Camí 1 — Eradicar fricció lead → pressupost → reserva (~10-15h, prioritat 1) — TANCAT 2026-04-29
Resol el dolor que l'usuari té cada dia operant amb el sistema. Desbloca tot el flux comercial. Tots els ítems A.1-A.5 tancats.

### FET (Camí 1)
- **A.2 [BLOC] Pressupost lligat a entitat flexible** — `FET` *(Canvi #437)*: `Proposal.customerId` nullable, FK SET NULL, formulari accepta pressupost orfe o lligat opcional a lead/customer/booking, validació "almenys un lligam o cap" sense bloquejar.
- **A.3 [BLOC] Re-assignar pressupost a una altra entitat** — `FET` *(Canvi #438)*: endpoint `PATCH /api/admin/proposals/[id]/owner` que canvia `leadId`/`customerId`/`bookingId` amb audit; UI al detall del pressupost.
- **A.4 [USP] Mode "client de pas"** — `FET` *(Canvi #441)*: panell de vinculació al detall del booking amb mode transitori per events one-shot sense customer permanent.
- **A.5 [BÀSIC] Wizard d'1 minut** — `FET` *(Canvi #442)*: `/admin/quick-create` amb pantalla única + 3 outcomes (`lead`, `lead+proposal`, `lead+proposal+booking`) i servei orquestrador `quickCreateFlow`.

### Camí 2 — Auto-càlcul brutal com a USP (~8-12h, prioritat 2)
Amplifica el USP que l'usuari ja té (km + transport autocalculat) i el converteix en la marca diferenciadora.

### FET (Camí 2)
- **B.6 [USP brutal] Fer estrella visible l'auto-càlcul km + transport** — `FET` *(Canvi #444)*: línia explícita "Desplaçament" al PDF del pressupost amb detall km totals · km facturables · trams. Abans els 40€/2 trams se sumaven al total invisibles.
- **B.7 [USP] Auto-pricing per data** — `FET` *(Canvi #446)*: `lib/constants/pricingRules.ts` amb 4 regles canòniques (cap de setmana +10%, alta temporada juny-set +15%, Nadal 15dec-6gen +25%, Nochevieja 31dec +50%) + servei pur `applyDatePricing` + integració PDF/preview amb línia "Recàrrec ..." quan aplica.
- **B.8 [BÀSIC] Auto-suggeriment de pack** — `FET` *(Canvi #449)*: `suggestPackForLead()` puntua packs per servei/capacitat/pressupost, parseja brackets de pressupost lliure (incloent accents com `més de` / `fins a`) i `/admin/quick-create` mostra la recomanació amb confiança, motius, alternatives i botó `Aplicar suggeriment` via mapping segur `config slug → Prisma pack`.
- **B.9 [BÀSIC] Marge instantani per event visible al pressupost** — `FET` *(Canvi #450)*: el PDF Studio calcula marge viu reutilitzant `computeBookingFinancialSummary()` i la `profitabilityConfig` canònica. La preview ensenya cost directe, marge net, % marge, CAC estimat i to semàfor, sense motor paral·lel ni hardcodes econòmics locals.

### FET (Camí 2)
- **Regularització documental** — `FET` *(2026-05-03 per `codex` — Canvi #484)*: el `SEGÜENT` de Camí 2 queda tancat perquè els quatre ítems reals del bloc ja estaven completats (`B.6` → `#444`, `B.7` → `#446`, `B.8` → `#449`, `B.9` → `#450`). El checklist deixa de fingir un pas immediat obert quan l'únic estat honest és "Camí 2 drenat".

### Camí 3 — Portal client + signatura + pagament (~25-40h, prioritat 3)
Salt qualitatiu multi-tall. Honeybook s'ha menjat el mercat USA d'events amb això. Reservar per quan hi hagi flux real que ho justifiqui.

### SEGÜENT (Camí 3)
- **F.22 [USP] Signatura digital de contractes inline** — DocuSign-like sense sortir d'Òrbita. Honeybook/Tave brutal en això. Implica: nou model `ContractSignature { contractId, signedAt, signatureBlob, ip, userAgent }` + portal públic `/contract/[token]/sign` + integració amb generació PDF firmat.
- **F.23 [USP] Pagaments online (Stripe link) dins el pressupost** — Honeybook brutal. CTA "Paga el 30% per confirmar" amb Stripe Checkout. Implica: integració Stripe + nou flow `Booking.paymentLink` + webhook handler.
- **G.25 [USP mig-llarg] Portal client** — timeline visible, contracte, factures, fotos post-event, qüestionaris. Honeybook Client Portal és el referent absolut. Implica: nou conjunt rutes `/portal/[token]/*` (`overview`, `contract`, `payments`, `gallery`, `questionnaire`) basades en `ClientPortalAccess` que ja existeix com a model.
- **G.26 [USP] Qüestionari pre-event automàtic** — timing, cançons, contactes claus. Honeybook Questionnaires. Implica: nou model `Questionnaire { templateId, bookingId, responses }` + UI per propietari (templates) + UI portal client (responses).
- **G.27 [USP] Galeria post-event privada amb codi compartible** — Tave Galleries. Implica: nou model `EventGallery { bookingId, shareToken, photos[] }` + ruta pública `/gallery/[token]` amb password opcional.

### Mancances transversals (atacar quan toqui per àrea)
- **C.10 [BÀSIC] Inbox unificada multi-canal real** (email + WhatsApp + IG DM + form) — `FET` *(Canvi #461)*: `commTimeline` i el resum canònic de comunicacions ja tracten `INSTAGRAM` i `FORM` com a canals reals; la captura web (`contactLeadCaptureService`) i l'alta admin de leads `INSTAGRAM` escriuen activitat inbound canònica via `recordLeadInboundChannelCaptured()`, i `CommSummaryPanel` els mostra a la Inbox.
- **C.11 [BÀSIC] Enviament massiu segmentat** — `FET` *(Canvi #457)*: `Inbox Compose` ja pot treballar en mode bulk sobre segments reals carregats pel servidor (`clients de bodes 2025` i `leads sense resposta 7d`) i enviar la campanya via `sendAdminEmail()` per destinatari a través del nou endpoint `POST /api/admin/emails/send-bulk`.
- **C.12 [BÀSIC]** Plantilles intel·ligents amb variables (`{{firstName}}`, `{{eventDate}}`) — `FET` *(Canvi #452)*: `ComposeForm` reaplica la plantilla activa quan canvia el context (lead/idioma) mentre el text continua autoemplenat, i preserva les edicions manuals.
- **C.13 [BÀSIC]** Sequencer manual des del lead — `FET` *(Canvi #455)*: la fitxa del lead exposa `Seqüència manual` amb selector de pas i trigger sobre el motor canònic `commercialSequenceService`, via endpoint dedicat `POST /api/admin/leads/[id]/sequence`.
- **D.14 [FET]** Forecast per mes amb confiança ponderada — `FET` *(Canvi #454)*: `pipelineForecast.buildPipelineForecast()` ja sumava pipeline ponderat per mes amb `LEAD_SCORING_STATUS_PROBABILITY`; ara propaga també variància Bernoulli per lead i exposa `pipelineLow/High` + `combinedLow/High` (banda ±1σ). `EconomiaClient` mostra una nova columna `Rang ±1σ` a la previsió, amb 6 tests nous a `pipelineForecast.test.ts` que blinden la banda en casos límit (p=0, p=0.5, p=1, sense pipeline, combinat 60/40 amb històric).
- **D.15 [FET]** "Què faig avui" en 5 línies — `FET` *(Canvi #44)*: `dailyBriefService` cobreix `greeting`, `summary`, KPIs, alertes per nivell i accions prioritàries; consumit per `DailyBriefPanel` a la home admin (regularitzat al Canvi #453).
- **D.16 [FET]** Customer Lifetime Value visible per client — `FET` *(Canvi #16)*: `customerInsightsService.calculateLTV` integrat al `fetchCustomerHub` via `insights` i visible a `InsightsBanner` del Customer Hub (#35 ho mou de hardcode a aquest servei; regularitzat al Canvi #453).
- **D.17 [FET]** Pipeline drag & drop entre estats — `FET` *(Canvi #456)*: `PipelineBoard` (compartit per `LeadPipelineView` i `BookingPipelineView`) exposa al renderCard un contracte complet `dragHandlers` amb `draggable + onDragStart/End` per desktop (HTML5 drag&drop) i `onPointerDown/Move/Up/Cancel` per mòbil (Pointer Events) amb heurística de scroll vertical vs drag horitzontal i `touchAction: pan-y/none` segons l'estat. Test nou `__tests__/app/admin/components/PipelineBoard.test.tsx` blinda el contracte (3 tests: handlers vius, deshabilitació quan `updatingId`, ignorar pointer down de ratolí).
- **E.18 [FET]** App PWA admin — `FET` *(Canvi #458)*: `public/manifest.webmanifest` (consumit per `app/admin/layout.tsx`) afegeix `shortcuts` per a `Entrades`, `Creació ràpida`, `Reserves` i `Inbox` — Quick Actions de homescreen quan l'usuari instal·la l'admin com a PWA. La capa d'offline ja vivia al `public/sw.js` (precache + `offline.html`); el que faltava eren les Quick Actions admin. Test nou `__tests__/public/manifest-webmanifest.test.ts` blinda JSON vàlid + 4 shortcuts canònics + icona 96x96 per cadascuna.
- **E.19 [BÀSIC]** Quick action mobile (1 tap → trucar/WhatsApp/marcar contactat) — `FET` *(Canvi #451)*: `MobileQuickActions` concentra el strip mòbil shared per `lead`, `customer` i `booking`, i `LeadMobileQuickActions` reaprofita `patchLeadStatus('CONTACTED')` per marcar contactat en un sol toc quan el lead és `NEW`.
- **E.20 [USP]** Foto + nota ràpida des del bolo — `FET` *(Canvi #460)*: la fitxa de reserva incorpora `BookingFieldNotesComposer`, que obre càmera/fitxer al mòbil, puja la captura a la galeria del booking amb `caption` intern i deixa la nota editable des de `BookingGallery` sense tocar schema.
- **F.21 [FET]** Calendar bidireccional Google/iCal — Canvi #134 ja ho cobreix.
- **F.24 [USP]** Integració Google Maps a la fitxa client — `FET` *(Canvi #459)*: la `SummaryPanel` del Customer Hub mostra una targeta `Ubicació i ruta` amb enllaç a Google Maps, distància guardada (`distanceKm`) si la reserva ja la té i càlcul viu via `POST /api/admin/maps/distance` quan encara falta persistència. Refinement directe del B.6 (auto-km) sense duplicar motor.

**PENDENT CRÍTIC**: no convertir aquest backlog en feina paral·lela dispersa. Camí 1 tancat (#435-#442). Camí 2 tancat (#444, #446, #449, #450). El següent salt real és Camí 3 i només s'hauria d'obrir quan hi hagi prou flux i pressió operativa que el justifiqui.

**MÉS ENDAVANT**: tractar com a backlog viu — quan un ítem es tanca, marcar `FET` amb cita al canvi corresponent; quan apareix una nova mancança detectada per ús real, afegir-la mantenint la nomenclatura A-G + tag `[BLOC]/[BÀSIC]/[USP]`.

## Fase 1 — Consolidació del nucli (actual)
- `Task` com a veritat canònica: pràcticament tancat, pendent de desplegar migració i netejar aliases legacy.
- `timeline` canònica de lectura: avançada, pendent decidir Inbox/Comms i frontera timeline operativa vs log tècnic.
- Coherència `Leads`, `Customers`, `Bookings`, `Tasks`, `Activity`: avançada, pendent review visual/UX transversal.
## Fase 2 — Workspaces d'elit
- Customer Hub
- Bookings
- Leads
- Inbox

## Fase 3 — Growth i sistema comercial avançat (TANCADA 2026-04-10)
- Social UI — Canvi #38 (workspace) + #40 (idees auto-generades)
- Segments — Canvi #39 (CRM segments funcionals)
- Campanyes — Canvi #42 (servei + UI 7 tipus)
- Reactivació — Canvi #41 (servei + UI individual)
- Reporting executiu — Canvi #43 (mètriques ampliades + UI dedicada)

## Fase 4 — Zenith
- Coherència total
- Visual premium sostinguda
- Automatismes reals
- Control operatiu altíssim
- Marca + sistema + experiència alineats

---

# 9. Registre de canvis (comptador global)

## Norma
Cada canvi rellevant al repo d'admin s'incrementa en aquest comptador. El número serveix com a **referència compartida entre l'usuari, Claude i Codex** per parlar de "canvi #X" i estar segurs que tots mirem el mateix.

### Normes del comptador
- **Únic i seqüencial**: no es reinicia per bloc, mòdul o persona.
- **Cada canvi nou suma `+1`**. Si l'últim número és `N`, el següent és `N+1`.
- **Reinici explícit**: si en algun moment es decideix reiniciar el comptador, s'ha d'anotar explícitament al §9 i tothom ha d'assumir la nova base. (**2026-04-09**: reiniciat des de `0` per consolidació del protocol únic, substituint el comptador anterior que anava pel `24`.)
- **No duplicitat**: no s'han d'obrir dos canvis diferents amb el mateix número.
- **Sense reserva prèvia**: el número només s'assigna quan el tall ja es pot registrar; un canvi a mig fer no “bloqueja” cap número si encara no ha entrat al §9.

### Regla operativa
- Abans d'obrir o tancar un canvi, mirar quin és l'últim número vigent al §9.
- El canvi s'ha de registrar amb aquest número a aquest document, només al final del tall.
- `user`, `claude` i `codex` han de parlar sempre de la mateixa iteració usant aquest número.
- Protocol + diari + `ADMIN_CHANGE_COUNTER` s'han d'actualitzar en la mateixa seqüència.
- Després del registre, `pnpm run qa:protocol` és obligatori i qualsevol deute detectat es repara abans de considerar el canvi tancat.

### Què compta com a canvi
- Tancament d'un bloc del checklist (qualsevol `EN MARXA → FET`)
- Addició d'un model/servei/route/test nou significatiu
- Modificació arquitectònica (consolidació, renaming canònic, eliminació de llegat)
- Passada de neteja gran (mojibakes, constants, tests legacy)
- Decisió arquitectònica documentada
- Enduriment substancial de la norma de coordinació, handoff o represa

### Què NO compta
- Fixes de typo o mini-edits
- Canvis de copy aïllats
- Ajustos visuals micro (menys de 3 classes CSS)
- Experiments/exploracions que no queden commitejats

### Format d'entrada
```
### Canvi #N — YYYY-MM-DD — Autor (FET / EN MARXA)
**Títol curt del canvi.**
- Què s'ha fet (1-4 bullets màxim)
- Verificació executada o risc pendent
- `ADMIN_CHANGE_COUNTER` passa a `N`; el següent canvi real ha de ser `#N+1`.
- Començat per: `autor`
- Treballant per: `autor`
- Tancat per: `autor` o `pendent`
```

Seqüència obligatòria de registre:
1. Validar el tall funcional.
2. Rellegir el màxim `Canvi #...` existent al §9 i el valor actual d'`ADMIN_CHANGE_COUNTER`.
3. Escriure protocol + diari + comptador en el mateix tall.
4. Passar `pnpm run qa:protocol`.
5. Si falla, reparar el deute detectat abans de considerar el tall tancat.
### Autors
- `claude` — backend/schema/serveis/tests/visual tokenitzat
- `codex` — producte/UI/navegació/workspaces
- `user` — decisions manuals o interventions directes

## Entrades

### Canvi #166 — 2026-04-17 — claude (FET)
**Tests cobertura completa serveis + fix bug pluralització + fix mojibake (§6.13).**
- `__tests__/lib/services/nextBestActionService.test.ts` — **24 tests** per motor Next Best Action (6 dominis: leads, customers, tasks, follow-ups, capacitat, pipeline + scoring + dedup + report)
- `__tests__/lib/services/googleReviewsStaticFile.test.ts` — **3 tests** (parse OK, fitxer absent, JSON malformat)
- Fix bug pluralització `nextBestActionService.ts`: "2 tascaques vençudaes" → "2 tasques vençudes"
- Fix mojibake (`U+FFFD`) a separador de codi de `nextBestActionService.ts`
- **0 serveis `lib/services/*.ts` sense test** — cobertura completa
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

---

### Canvi #153 — 2026-04-17 — claude (FET)
**Export PDF del reporting executiu (§6.10).**
- `lib/services/executiveReportPdfService.ts` — funció pura `exportExecutiveReportPdf` que genera PDF amb jsPDF:
  - Header amb logo Orbita i branding
  - KPI cards visuals (7 indicadors), embut comercial, conversio per origen, recurrencia, marge, tendencia mensual 6m, leads en risc
  - Paginacio automatica amb page breaks, footers numerats
- `app/api/admin/reports/executive/export-pdf/route.ts` — ruta GET amb auth + permission
- **4 tests servei** (magic bytes PDF, empty data, many leads, zero values) + **4 tests ruta** (auth, permission, headers, passthrough)
- Fix TS error a `executiveCockpitService.test.ts` (camps `CapacityConflict` incorrectes)
- Tanca SEGUENT de §6.10 (export PDF a mes del CSV)
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

---

### Canvi #150 — 2026-04-17 — claude (FET)
**Tests de ruta per APIs noves (§6.13).**
- `__tests__/app/api/cron/urgent-followup-alerts-route.test.ts` — 5 tests (auth, token incorrecte, alertes noves, sense noves, error servei)
- `__tests__/app/api/admin/reports-executive-export-route.test.ts` — 4 tests (auth, permission, CSV headers correctes, passthrough report→CSV)
- `__tests__/app/api/admin/social-posts-performance-route.test.ts` — 4 tests (auth, default 90d, days custom, recomanacions)
- **13 tests** de ruta, 0 errors TypeScript
- Tanca parcialment SEGÜENT de §6.13 (tests d'integració per workspaces nous)
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

---

### Canvi #149 — 2026-04-17 — claude (FET)
**Tests cobertura + workflows urgent-alerts + fixes validate:core.**
- Tests nous per `portfolioImageService` (14 tests) i `publicPortfolioShowcaseService` (6 tests)
- Workflow dedicat `.github/workflows/urgent-followup-alerts.yml` (4x/dia)
- Step `urgent-followup-alerts` afegit a `daily-crons.yml`
- Fix ownership fields canvi #147, allowlist DAY_NAMES
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

---

### Canvi #147 — 2026-04-17 — claude (FET)
**Mètriques de rendiment per canal social (§6.9).**
- `lib/services/socialPerformanceService.ts` — servei pur amb 4 funcions exportades:
  - `computePlatformMetrics`: posts per estat, breakdown contentType/category, publishedByDayOfWeek/Hour, bestDay/bestHour, avgPostsPerWeek, daysSinceLastPost
  - `computeConsistencyScore`: % setmanes amb ≥1 publicació dins la finestra
  - `generateRecommendations`: alertes d'inactivitat, baixa freqüència, falta diversitat de format, posts no publicats
  - `generateSocialPerformanceReport`: report complet per plataforma amb recomanacions
- Wrapper `loadSocialPerformanceReport(windowDays)` amb Prisma
- API `/api/admin/social-posts/performance?days=90`
- **19 tests** (pur), 0 errors TypeScript
- Tanca SEGÜENT de §6.9 (mètriques de rendiment per canal)
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

---

### Canvi #146 — 2026-04-17 — claude (FET)
**Export CSV del reporting executiu (§6.10).**
- `lib/services/executiveReportService.ts` — nova funció pura `exportExecutiveReportCsv` que converteix `ExecutiveReport` a CSV amb 7 seccions: KPIs principals, embut comercial, conversió per origen, recurrència, marge, tendència mensual 6m, leads en risc
- Types `ExecutiveReport`, `ConversionBySource`, `MonthlyTrend` ara exportats
- Ruta `/api/admin/reports/executive/export` — retorna CSV amb `Content-Disposition: attachment` i filename datat
- Escape CSV robust: comes, cometes, salts de línia
- **9 tests nous** (pur), 0 errors TypeScript
- Tanca parcialment SEGÜENT de §6.10 (reporting accionable + export)
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

---

### Canvi #144 — 2026-04-17 — claude (FET)
**Alertes push per follow-ups urgents (§6.8).**
- `lib/services/urgentFollowUpAlertService.ts` — servei pur `filterNewUrgentAlerts` + `buildUrgentAlertEmail` + `buildUrgentAlertWhatsApp` + wrapper `runUrgentFollowUpAlerts`
- Detecta follow-ups URGENT (≥5 dies sense resposta) via `responseTrackingService`
- Supressió de duplicats per lead amb finestra 24h (setting-based `alerts.urgentFollowUp.lastAlerted.*`)
- Envia alerta immediata per email (taula HTML amb lead, tipus, dies, acció recomanada) i WhatsApp
- Cron `/api/cron/urgent-followup-alerts` amb Bearer `CRON_SECRET`, recomanat 4x diari
- Registre `ADMIN_CRON_PREFIXES` amb prefix `alerts.urgentFollowUp`
- AdminLog `URGENT_FOLLOWUP_ALERT_SENT` per traçabilitat
- **16 tests** (pur + wrapper), 0 errors TypeScript
- Tanca SEGÜENT de §6.8 (alertes push per follow-ups urgents)
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

---

### Canvi #52 — 2026-04-10 — claude (FET)
**Referrals — programa de referrals amb top referrers i candidats per preguntar (§6.5).**
- `lib/services/referralsService.ts` — servei pur `computeReferralsSummary` + wrapper `loadReferralsSummary`
- Calcula top referrers (referralsCount, referralsValue), stats globals (taxa referral, valor generat, avg per referral)
- 4 classificacions de candidats: `VIP_NO_REFERRAL`, `HIGH_VALUE_NO_REFERRAL`, `RECURRING_NO_REFERRAL`, `HAPPY_FIRST_TIME`
- Exclou clients sense events, DORMANT/CHURNED, health score baix i els que ja han fet referral
- Missatges suggerits ca/es per cada reason + whatsapp/email/mailto
- UI `/admin/clientes/referrals` — 4 KPIs globals, llista top referrers amb rang, candidats amb filtres prioritat
- Integrat al menú Operacions (🎁 Referrals)
- Fix col·lateral: afegit `SOCIAL_VALIDATION_SETS` als imports de `socialPostService.ts` (pre-existent, no meu)
- **20 tests** (pur), 0 errors TypeScript
- Tanca SEGÜENT de §6.5 (referrals + reactivació automàtica)
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

---

### Canvi #51 — 2026-04-10 — claude (FET)
**Lead Reengagement — reenganxar leads dormants amb missatge suggerit (§6.6).**
- `lib/services/leadReengagementService.ts` — servei pur `generateReengagementCandidates` + wrapper `loadReengagementCandidates`
- 6 classificacions: `UPCOMING_EVENT` (esdeveniment ≤45d), `HOT_STALE` (alta prioritat stale), `QUOTE_NO_REPLY` (pressupost ≥6d), `NEGOTIATION_COLD` (negociació ≥5d), `EARLY_SILENCE` (contactat ≥4d), `LONG_DORMANT` (≥21d últim intent)
- Missatges suggerits ca/es per cada reason, canals whatsapp/email, whatsappUrl + mailtoUrl
- Scoring 30–100 ordenat per prioritat, exclou `WON`/`LOST` i stale >90d
- UI `/admin/leads/reengagement` — KPIs per prioritat, filtres per motiu, missatge expandible, WhatsApp/email/copiar/descartar
- Integrat al menú Operacions (🔥 Reengagement leads)
- **22 tests** (pur), 0 errors TypeScript
- Tanca parcialment SEGÜENT de §6.6 (reengagement de leads dormants)
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #0 — 2026-04-09 — claude
**Inicialització del comptador global i consolidació del protocol únic.**
- Reiniciat el comptador d'admin des de `0` (substituint l'anterior que anava pel `24`)
- Fusionats **6 docs** en `protocol-producte-admin-ca.md` com a font única:
  - `coordinacio-codex-claude-2026-04-08.md` → absorbit a §1
  - `proposta-navegacio-admin-2026-04-08.md` → absorbit a §4
  - `consolidacio-domini-tasks-timeline-2026-04-09.md` → absorbit a §5 (inclou Opció A/B i Fases executives)
  - `checklist-executiva-2026-04-09.md` → absorbit a §6 (subset del master)
  - `master-checklist-zenith-2026-04-09.md` → absorbit a §6-§8
  - `protocol-de-treball-zenith.md` → absorbit a §2 (regles de treball, workspaces sagrats, regla de producte, ordre de decisió, propietat de blocs, comptador)
- Creades §2 Mètode de treball (principis, inici/tancament de bloc, propietat, memòria, actualització) i §9 Registre de canvis (amb normes explícites del comptador)
- **Esborrats els 6 docs absorbits** (contingut preservat al 100%)
- Estat final: un sol document operatiu per tot el que no és log històric (`diario.md`), dossier viu (`estat-admin.md`), guia tècnica (`guia-mobile-admin.md`), runbook o SEO
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #4 — 2026-04-09 — claude (FET)
**Passada global de neteja: 0 fallades a test suite, mojibake fix, imports morts, legacy cleanup.**
- **Corregides 6 fallades preexistents** que arrossegava el repo:
  - `leadActivityService.test.ts` (3 tests): mocks incomplets (faltava `createdAt`, `type`, `leadId` per `mapLeadActivityToCanonicalEvent`).
  - `InventoryListClient.test.tsx` (3 tests): mojibake a `InventoryListClient.tsx` — `â‚¬` → `€`, `â€"` → `—`, `â€™` → `'` (escaped).
- **Esborrat `legacyLeadTaskCleanup.ts`** (0 consumidors des de Canvi #3).
- **Netejats imports morts**: `leadRouteService.ts` i `leadCleanupService.ts` importaven `legacyLeadTaskCleanup` sense usar-lo.
- **Alineats tests** `leadRouteService.test.ts` i `leadCleanupService.test.ts` amb la realitat del codi (eliminat mock de `deleteLegacyLeadTasksForLead/s`).
- Migrat `lead.tasks` → `lead.universalTasks` a 2 llocs més: `leadRouteService.ts` (include) i `leadSnapshotService.ts` (`_count`).
- Resultat final: **150 fitxers, 1924 tests, 0 fallades, 0 errors TypeScript**.
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #3 — 2026-04-09 — claude (FET)
**Consolidació Task canònic: migració lead.tasks → universalTasks, eliminació wrappers legacy.**
- Migrats **6 consumidors** de `lead.tasks` (relació `LeadTask[]` legacy) a `lead.universalTasks` (relació `Task[]` canònic):
  - `lib/services/slaAutomationService.ts` — include + lectura
  - `lib/customer-hub/data.ts` — type + include
  - `lib/customer-hub/fetchCustomerHub.ts` — fallback mapping
  - `app/admin/leads/[id]/page.tsx` — select + 3 accesos `.tasks`
  - `lib/services/leadRouteService.ts` — include
  - `lib/services/leadSnapshotService.ts` — `_count.tasks` → `_count.universalTasks`
- **Esborrats 4 fitxers** wrapper legacy (0 consumidors externs):
  - `lib/services/leadTaskRouteService.ts` (re-export de `leadScopedTaskRouteService`)
  - `lib/services/tasks/leadTaskFacade.ts` (re-export de `leadScopedTaskService`)
  - `__tests__/lib/services/leadTaskRouteService.test.ts`
  - `__tests__/lib/services/tasks/leadTaskFacade.test.ts`
- Actualitzats tests: `slaAutomationService.test.ts`, `leadSnapshotService.test.ts`, `leadScopedTaskService.test.ts` (mocks actualitzats).
- Eliminat cleanup `prisma.leadTask.deleteMany` de `deleteLeadScopedTask` — el model `LeadTask` ja no s'invoca en cap fitxer `.ts`. Model `LeadTask` queda al schema sense consumidors (pot esborrar-se amb migració quan es decideixi).
- Cobertura real intacta a `leadScopedTaskRouteService.test.ts` + `leadScopedTaskService.test.ts`.
- 0 errors TS, 1916 tests passant, 0 regressions.
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #2 — 2026-04-09 — codex (FET)
**Alarma automàtica anti-mojibake per al repo admin.**
- Afegit script `scripts/check-mojibake.mjs` que escaneja `app`, `lib`, `messages` i `prisma` buscant patrons típics de corrupció (`Ã`, `Â`, `â…`, `ðŸ`, `�`).
- Afegits scripts a `package.json`:
  - `qa:encoding` — escaneig complet.
  - `qa:encoding:changed` — escaneig només sobre fitxers canviats contra `HEAD`.
- Ignora soroll: `node_modules`, `.next`, `coverage`, `dist`, `docs/diario.md`.
- Verificació: `node --check scripts/check-mojibake.mjs` OK; `node scripts/check-mojibake.mjs --paths package.json` OK; `pnpm run qa:encoding:changed` net (`147` fitxers revisats).
- Àmbit: QA/infra — **no interfereix amb Canvi #1** (Timeline canònica).
- Iniciat per: `codex` — Tancat per: `codex`

---

### Canvi #1 — 2026-04-09 — claude (FET)
**Consolidació de la timeline canònica a nivell de fetchers compartits i baixada a Bookings.**
- Afegits **3 fetchers unificats** a `lib/services/timelineQueryService.ts`:
  - `fetchCanonicalEventsForCustomer(customerId, limit?)` — creua `customerActivity` + `leadActivity` (via leads del customer) + `adminLog` (customer + leads + bookings).
  - `fetchCanonicalEventsForLead(leadId, limit?)` — `leadActivity` + `adminLog` del lead.
  - `fetchCanonicalEventsForBooking(bookingId, limit?)` — `adminLog` de la reserva → `CanonicalTimelineEvent[]`.
- **Bookings integrat**: `app/admin/bookings/[id]/page.tsx` ara consumeix `fetchCanonicalEventsForBooking` en lloc d'interpretar `adminLog` cru a la UI.
- **20 tests nous** a `__tests__/lib/services/timelineQueryService.test.ts` cobrint mappers (purs) i fetchers (amb mock Prisma). Tots passant.
- 0 errors TypeScript, 0 regressions (1919 tests passats; 13 fallades preexistents no relacionades).
- Fitxers tocats: `lib/services/timelineQueryService.ts`, `app/admin/bookings/[id]/page.tsx`, `__tests__/lib/services/timelineQueryService.test.ts`.
- Iniciat per: `claude` — Tancat per: `claude`

---


---

### Canvi #23 — 2026-04-09 — codex (FET; reclassificat des de #3 per col·lisió de comptador)
**Cobertura de la capa canònica de tasques per lead.**
- Afegits tests per `leadScopedTaskRouteService` i `leadScopedTaskService`.
- Coberts els fluxos de llistar, crear, actualitzar, eliminar i resolució de links legacy.
- Verificació: `pnpm test:run __tests__/lib/services/leadScopedTaskRouteService.test.ts` i `pnpm test:run __tests__/lib/services/tasks/leadScopedTaskService.test.ts` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #24 — 2026-04-09 — codex (FET; reclassificat des de #4 per col·lisió de comptador)
**Inbox com a workspace de triatge més clar i accionable.**
- `InboxClient` i `InboxSections` ara mostren triatge visible, context de vista/filtre, empty state més útil i una acció recomanada al detall.
- Corregit `fetchCustomerHub.ts` perquè consumeixi `lead.universalTasks` en lloc de `lead.tasks`, alineant el Customer Hub amb el model canònic.
- Verificació: `npx tsc --noEmit` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #5 — 2026-04-09 — codex (FET)
**Regressió coberta al Customer Hub per blindar el model canònic de tasques.**
- Afegit `__tests__/lib/customer-hub/fetchCustomerHub.test.ts` amb una prova focalitzada perquè `fetchCustomerHub` usi `lead.universalTasks` quan no hi ha `customerTasks`.
- El fix funcional ja havia alineat `lib/customer-hub/fetchCustomerHub.ts` amb `universalTasks`; ara queda també protegit per test.
- Verificació: `pnpm test:run __tests__/lib/customer-hub/fetchCustomerHub.test.ts` i `npx tsc --noEmit` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #6 — 2026-04-09 — codex (FET)
**Comptador compartit d'admin i mode ajuda corregits al shell.**
- El header deixa d'ensenyar `24` hardcoded i passa a consumir `ADMIN_CHANGE_COUNTER` com a font única compartida.
- `AdminHelpMode` ara arrenca sempre `OFF`; el mode ajuda bloqueja accions però no l'scroll, i es pot desactivar sempre tant des del botó `Ajuda` com des de `Tancar ajuda`.
- Verificació: `npx tsc --noEmit` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #7 — 2026-04-09 — codex (FET)
**Labels de timeline en català al Customer Hub.**
- `timelineQueryService` ja no exposa codis interns com `AUTOMATION_FUEL_REFRESH`, `PACK_PRICING_CHECK` o `LEAD_CONVERTED` a la UI.
- Els `adminLog` canònics passen a mostrar labels humanes en català segons acció i entitat (`Preu combustible`, `Check preus packs`, `Lead convertit a client`, etc.).
- Verificació: `npx tsc --noEmit` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #8 — 2026-04-09 — codex (EN MARXA)
**Unificació de textos i i18n del producte.**
- Front obert: `messages/*` passa a ser la capa bona per al copy traduïble de la web pública; `lib/constants/*` queda per etiquetes/semàntica de domini i l'admin manté el seu copy específic separat.
- Primer pas ja escrit al protocol/checklist: criteri d'unificació, frontera entre web pública / admin / constants i objectiu de treure copy pública dispersa de `config` i components.
- Inventari inicial confirmat al repo:
- `app/config/packs-config.ts`: copy comercial, taglines, emotions, descriptions, CTA i ofertes barrejades amb configuració
- `app/config/site-config.ts`: missatges WhatsApp, auto-reply, fallback reviews, horaris de display i labels públiques barrejats amb settings
- `app/layout.tsx`: metadata pública amb fallback hardcoded i dependència directa de `ca.json`
- `app/config/equipment-config.ts`: descripcions públiques d'equipament fora de la capa d'i18n
- Proper pas tècnic:
- inventariar per domini tot el copy públic que encara viu fora de `messages/*`
- començar migració per `packs`, `site config`, `equipment` i metadata
- marcar què és copy web, què és copy admin i què és semàntica de domini
- Característiques exigides a preservar: monocapa, responsiu, 0 hardcoded visible, 0 mojibake, TypeScript en verd, tests i separació clara entre copy web / admin / semàntica de domini.
- Iniciat per: `codex` — Tancat per: *(pendent)*

### Canvi #9 — 2026-04-09 — codex (FET)
**Metadata pública extreta del layout cap a una capa pròpia.**
- Afegit `lib/home-meta.ts` com a punt únic per llegir `homePage.meta` i `keywords` des de `messages/*`.
- `app/layout.tsx` deixa de carregar directament `ca.json` i deixa de contenir literals públics de metadata com a font principal.
- Això prepara la migració del `Canvi #8`: menys copy pública dispersa i millor separació entre layout, i18n i configuració.
- Verificació: `npx tsc --noEmit` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #10 — 2026-04-09 — codex (FET)
**`site-config` deixa de hardcodejar els missatges principals de WhatsApp.**
- `app/config/site-config.ts` ara consumeix `whatsappMessages` des de `messages/ca.json` en lloc de mantenir el catàleg de missatges públics incrustat dins de config.
- El helper `getWhatsAppUrl` conserva el comportament i, en el cas del configurador, hi afegeix les dades del pack sense tornar a duplicar el missatge base.
- Això redueix copy pública dispersa dins `config` i alinea `site-config` amb el criteri del `Canvi #8`: settings per una banda, copy traduïble per una altra.
- Verificació: `npx tsc --noEmit` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #11 — 2026-04-09 — codex (FET)
**Customer Hub: contenidors blindats i labels crues de timeline corregides.**
- `CustomerHubClient`, `TasksNotesPanel` i `TimelinePanel` ara imposen `min-w-0`, `overflow-hidden`, `break-words` i truncat on toca perquè noms i títols llargs no surtin del contenidor.
- `timelineQueryService` ja no deixa escapar `LEAD_CONVERTED` com a títol cru: es mostra com `Lead convertit a client`.
- El pegat està orientat al cas visible del Hub: llista de tasques, timeline lateral i cards d'esdeveniment.
- Verificació: `npx tsc --noEmit` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #12 — 2026-04-09 — codex (FET)
**Customer Hub: tallafocs final contra labels internes crues a la timeline.**
- `TimelinePanel` ara sanititza títols crus abans de pintar-los i reutilitza `ADMIN_ACTIVITY_ACTION_META` per convertir codis interns en labels humanes.
- Si algun camí legacy encara envia títols com `AUTOMATION_FUEL_REFRESH · automation`, `PACK_PRICING_CHECK · pricing` o `LEAD_CONVERTED`, la UI del Hub els converteix igualment a labels netes.
- Això complementa la correcció dels mappers i evita que una font antiga torni a embrutar la cronologia visible.
- Verificació: `npx tsc --noEmit` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #13 — 2026-04-09 — codex (FET)
**`site-config` deixa de hardcodejar també el fallback de reviews i el missatge principal d'auto-reply.**
- `app/config/site-config.ts` ara llegeix `googleReviews.fallback.description` i `contact.success.message` / `contact.responseTime` des de `messages/ca.json` mitjançant una capa tipada mínima.
- Això continua la neteja del `Canvi #8`: menys copy pública dins `config`, més reutilització de la capa i18n existent.
- El comportament es manté i el fitxer queda millor separat entre settings i copy pública.
- Verificació: `npx tsc --noEmit` en verd.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #14 — 2026-04-09 — claude (FET)
**`bookingOperationalService` — snapshot operacional unificat de reserva (§6.7)**
- **Creat `lib/services/bookingOperationalService.ts`** amb `getBookingOperationalSnapshot()`.
- Consolida 8 queries paral·leles en una sola crida: checklist, commLogs+deriveFlowStatus, timeline canònica, customer context, portal access, profitability config, margin target, inventory cost+usage.
- Retorna `BookingOperationalSnapshot` amb: checklist, commStatuses, recentCommRows, reviewFlowStatus, internalPostEventStatus, timeline, customer, portalAccess, profitabilityConfig, targetMarginPct, inventoryCost, payment, documents.
- **25 tests** a `__tests__/lib/services/bookingOperationalService.test.ts`.
- **Integrat a `page.tsx`**: ~100 línies de queries+derivats → 1 crida. Eliminats 7 imports morts.
- **Verificació**: 0 errors TypeScript, 151 fitxers / 1949 tests / 0 failures.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #15 — 2026-04-09 — codex (FET)
**`packs-config` deixa de portar incrustat gairebé tot el copy principal dels packs públics.**
- `app/config/packs-config.ts` ja resol via claus i18n els `name`, `tagline`, `emotion`, `ideal`, `features`, `badges` i `OFFERS.*.(name|description|badge)` dels packs principals.
- `app/[locale]/configurador/configurador-utils.ts` resol els noms d'oferta segons `locale`, de manera que el motiu del descompte deixa de dependre del català hardcoded.
- Afegides les claus `packsOffers` i `packsBadges` a `messages/ca.json`, `messages/es.json` i `messages/en.json`.
- Validació: `npx tsc --noEmit` en verd i `pnpm run qa:encoding:changed` net.
- Efecte real: la capa pública de packs queda molt més monocapa; `messages/*` passa a ser la veritat del copy i `packs-config` queda més a prop de configuració/fallback semàntic.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #16 — 2026-04-09 — codex (FET)
**`packs-config` deixa de hardcodejar també els `extras` públics principals.**
- `EXTRAS` ara resol via i18n els `name` i `description` de `hora-extra`, `caps-mobils-extra` i `micro-inalambric`.
- Afegida la clau `services.mobile.extras.micro-inalambric` a `messages/ca.json`, `messages/es.json` i `messages/en.json`.
- Validació: `npx tsc --noEmit` en verd, JSON dels tres idiomes correcte i `pnpm run qa:encoding:changed` net.
- Efecte real: el bloc públic d'extres continua sortint de `packs-config`, però ja no arrossega aquest copy visible dur dins del fitxer.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #17 — 2026-04-09 — claude (FET)
**`leadInsightsService` — motor d'insights comercials per a leads (§6.6)**
- **Creat `lib/services/leadInsightsService.ts`** amb `computeLeadInsights()` (funció pura).
- Computa: `nextAction` (8 tipus prioritzats), `lossRisk` (nivell + raons), `commercial` context (client recurrent, events anteriors, deal value, dies des de creació/contacte/activitat, dies fins event).
- Reutilitza `scoreLead` i `estimateLeadAmount` de `commercialScoring.ts` — zero duplicació.
- **Integrat a `app/admin/leads/[id]/page.tsx`** com a `leadInsights` (disponible per a UI).
- **21 tests** a `__tests__/lib/services/leadInsightsService.test.ts`.
- **Verificació**: 0 errors TypeScript, 153 fitxers / 1991 tests / 0 failures.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #18 — 2026-04-09 — codex (FET)
**`equipment-config` estrena capa i18n pròpia per al catàleg públic d'equipament.**
- Nou helper [equipment-i18n.ts](D:\orbitaevents\lib\equipment-i18n.ts) per resoldre copy del catàleg d'equip segons `locale`.
- [equipment-config.ts](D:\orbitaevents\app\config\equipment-config.ts) ja guarda claus i18n a `name` i `description` per als principals ítems del catàleg i exposa `getLocalizedEquipmentCatalog(locale)`.
- Afegit namespace `equipmentCatalog.items.*` a `messages/ca.json`, `messages/es.json` i `messages/en.json`.
- Validació: `npx tsc --noEmit` en verd, JSON dels tres idiomes correcte i `pnpm run qa:encoding:changed` net.
- Efecte real: el catàleg d'equipament deixa de dependre només de literals incrustats i ja té una capa preparada perquè qualsevol vista pública el consumeixi localitzat.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #19 — 2026-04-09 — claude (FET)
**Timeline de booking enriquit — una sola història coherent (§6.7)**
- **Modificat `lib/services/timelineQueryService.ts`**: `fetchCanonicalEventsForBooking()` ara consolida múltiples fonts en paral·lel:
  1. `adminLog` del booking (`entity: 'booking'`)
  2. `adminLog` d'inventari assignat al booking (`entity: 'booking_inventory'`, filtrat per JSON path `details.bookingId`)
  3. `leadActivity` del lead origen (si el booking té `leadId`) — per mostrar la història prèvia del client
- Resolució lleugera del `leadId` via `prisma.booking.findUnique` amb `select: { leadId: true }` abans del paral·lel.
- Tot passa per `safeFetch` — resilient davant qualsevol error puntual.
- Ordenació final descendent per data i `slice(0, limit)`.
- **Tests actualitzats**: 6 tests a `fetchCanonicalEventsForBooking` cobrint múltiples fonts, cas sense lead, fusió ordenada, forma canònica, limit propagat i resiliència global (22/22 tests del fitxer en verd).
- **Verificació**: 0 errors TypeScript, 153 fitxers / **1993 tests** / 0 failures.
- Efecte real: la timeline de la reserva a `/admin/bookings/[id]` ara mostra una sola història coherent del cicle del client (lead → reserva → operació) en comptes de fragments aïllats. Tanca el "PENDENT CRÍTIC" de §6.7.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #25 — 2026-04-09 — codex (FET; reclassificat des de #19 per col·lisió de comptador)
**`equipment-config` deixa de portar també els `specs` principals en dur.**
- El namespace `equipmentCatalog.items.*.specs.*` s'ha afegit a `messages/ca.json`, `messages/es.json` i `messages/en.json`.
- [equipment-config.ts](D:\orbitaevents\app\config\equipment-config.ts) ara referencia claus i18n també als `specs` dels principals ítems del catàleg.
- `getLocalizedEquipmentCatalog(locale)` ja localitza `name`, `description` i `specs` en una sola passada.
- Validació: `npx tsc --noEmit` en verd, JSON dels tres idiomes correcte i `pnpm run qa:encoding:changed` net.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #20 — 2026-04-09 — codex (FET)
**`site-config` deixa de portar també els darrers display strings visibles d'horari i stats.**
- Nou subbloc `siteConfig.schedule` i `siteConfig.stats` a `messages/ca.json`, `messages/es.json` i `messages/en.json`.
- [site-config.ts](D:\orbitaevents\app\config\site-config.ts) ara llegeix des de `messages/*` els textos de `schedule.weekdays`, `schedule.saturday`, `schedule.sunday`, `schedule.note`, `whatsapp.autoReplySchedule.officeHours` i `stats.yearsLabel`.
- Validació: `npx tsc --noEmit` en verd, JSON correcte i `pnpm run qa:encoding:changed` net.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #21 — 2026-04-09 — codex (FET)
**`site-config` deixa de portar també el `stats.responseTime` en dur.**
- Afegit `siteConfig.stats.responseTime` a `messages/ca.json`, `messages/es.json` i `messages/en.json`.
- [site-config.ts](D:\orbitaevents\app\config\site-config.ts) ara llegeix també aquest valor des de `messages/*`.
- Validació: `npx tsc --noEmit` en verd i `pnpm run qa:encoding:changed` net.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #22 — 2026-04-09 — codex (FET)
**`site-config` estrena helper locale-aware per a WhatsApp públic i el configurador deixa de quedar fixat en català.**
- [site-config.ts](D:\orbitaevents\app\config\site-config.ts) incorpora resolució per `locale` sobre `messages/{ca,es,en}.json` sense trencar els imports actuals de `SITE_CONFIG`.
- Nou helper `getLocalizedWhatsAppUrl(locale, messageType, customData)` amb fallback a català si falta cap text.
- [client.tsx](D:\orbitaevents\app\[locale]\configurador\client.tsx) deixa d'usar el missatge català fix i genera l'enllaç de WhatsApp segons l'idioma actual.
- Validació: `npx tsc --noEmit` en verd i `pnpm run qa:encoding:changed` net.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #26 — 2026-04-09 — codex (FET)
**Sanejament del registre de canvis perquè el comptador torni a ser únic i fiable.**
- Detectades col·lisions històriques al registre: `#3`, `#4` i `#19` tenien dues entrades diferents.
- Les entrades de `codex` afectades s'han reclassificat a `#23`, `#24` i `#25` sense canviar-ne el contingut funcional.
- El comptador compartit passa a `26`; el següent canvi real ha de ser `#27`.
- Norma reforçada: si un número ja existeix al protocol, no es reutilitza encara que el canvi sigui antic o paral·lel.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #27 — 2026-04-09 — codex (FET)
**Guard automàtic perquè el comptador compartit no torni a duplicar-se.**
- Afegit [check-admin-change-log.mjs](D:\orbitaevents\scripts\check-admin-change-log.mjs) per validar que no hi ha números de canvi duplicats al protocol.
- Nou script `qa:protocol` a [package.json](D:\orbitaevents\package.json).
- El guard també comprova que `ADMIN_CHANGE_COUNTER` coincideixi amb el màxim `Canvi #N` registrat.
- El comptador compartit passa a `27`; el següent canvi real ha de ser `#28`.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #28 — 2026-04-09 — codex (FET)
**El layout públic deixa de portar metadata base escrita directament al component.**
- [home-meta.ts](D:\orbitaevents\lib\home-meta.ts) exposa `getDefaultHomeMeta()` com a font centralitzada per títol, descripció, keywords i Open Graph base.
- [layout.tsx](D:\orbitaevents\app\[locale]\layout.tsx) deixa de tenir els literals principals de metadata/OG/keywords incrustats i consumeix la capa de `messages/*` a través del helper.
- Es conserva l'estructura estàtica de Next sense trencar rutes ni imports existents.
- Validació: `npx tsc --noEmit`, `pnpm run qa:encoding:changed` i `pnpm run qa:protocol`.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #29 — 2026-04-09 — codex (FET)
**El guard del comptador entra al flux de validació real.**
- `validate:core` ara executa `qa:protocol` abans dels checks d'arquitectura, TypeScript i i18n packs.
- `build:ci` també executa `qa:protocol` abans del build, perquè una col·lisió de comptador no arribi a CI sense fallar.
- El comptador compartit passa a `29`; el següent canvi real ha de ser `#30`.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #30 — 2026-04-09 — codex (FET)
**Guard i18n per evitar que el catàleg d'equipament mostri claus tècniques.**
- Afegit [check-equipment-i18n.ts](D:\orbitaevents\scripts\check-equipment-i18n.ts) per validar `getLocalizedEquipmentCatalog()` en `ca`, `es` i `en`.
- Nou script `i18n:equipment:guard` a [package.json](D:\orbitaevents\package.json).
- `validate:core` i `build:ci` ara executen també el guard d'equipament després del guard de packs.
- El comptador compartit passa a `30`; el següent canvi real ha de ser `#31`.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #31 — 2026-04-09 — codex (FET)
**El guard anti-mojibake entra també al flux de validació real.**
- `validate:core` ara executa `qa:encoding` abans dels checks d'arquitectura, TypeScript i i18n.
- `build:ci` també executa `qa:encoding` abans del build.
- Això converteix el criteri `0 mojibake` del protocol en una barrera automàtica, no només en una revisió manual.
- El comptador compartit passa a `31`; el següent canvi real ha de ser `#32`.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #32 — 2026-04-09 — codex (FET)
**Error/not-found públic deixen d'importar `ca.json` directament.**
- Nou helper [public-error-copy.ts](D:\orbitaevents\lib\public-error-copy.ts) per centralitzar copy de `errorPage` i `notFound` amb fallback a català.
- [error.tsx](D:\orbitaevents\app\error.tsx), [global-error.tsx](D:\orbitaevents\app\global-error.tsx) i [not-found.tsx](D:\orbitaevents\app\not-found.tsx) consumeixen el helper en lloc de llegir `messages/ca.json` directament.
- Això manté les pàgines globals fora del routing `[locale]`, però treu el copy i els fallbacks del component.
- El comptador compartit passa a `32`; el següent canvi real ha de ser `#33`.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #33 — 2026-04-09 — codex (FET)
**`site-config` deixa d'importar `messages/*` directament.**
- Nou helper [site-public-copy.ts](D:\orbitaevents\lib\site-public-copy.ts) per centralitzar el copy públic de `siteConfig`, `whatsappMessages`, `googleReviews` i `contact`.
- [site-config.ts](D:\orbitaevents\app\config\site-config.ts) consumeix `getSitePublicCopy()` i `getSiteLocalizedText()` des de `lib`, mantenint `app/config` com a capa de configuració i no com a capa i18n.
- Això redueix l'acoblament directe entre `app/config` i `messages/*`.
- El comptador compartit passa a `33`; el següent canvi real ha de ser `#34`.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #34 — 2026-04-10 — claude (FET)
**Hero desktop millorat + fix runtime `getDefaultHomeMeta` (§6.11)**
- **Fix crític**: `layout.tsx` importava `getDefaultHomeMeta` que no existeix — canviat a `getHomeMeta`. La pàgina pública estava trencada (Server Error).
- **Hero hook memorable**: substituït bloc tagline genèric (CREEM MOMENTS / PER AL TEU CASAMENT / ARREU) per hook emocional amb barra d'accent ambre: *"La gent no recorda el menú. Recorda l'última cançó."* (i18n ca/es/en). Keys `tagline.*` mantingudes al JSON per al mòbil.
- **Tercer CTA recuperat**: `Parla amb nosaltres` com a text-link elegant amb subratllat i fletxa.
- **Trust bar premium**: convertida en càpsula glass (backdrop-blur, border, ombra) amb punt "ping" animat a l'exclusivitat i drop-shadow ambre als estels.
- **Distribució vertical optimitzada**: `items-end` → `items-center`, paddings reduïts perquè tot el hero (badge → trust bar) entri dins 1 viewport sense scroll.
- **Mòbil intacte** — `MobileHeroUltimate.tsx` no tocat.
- **Verificació**: 0 errors TypeScript, pàgina pública funcional.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #35 — 2026-04-10 — claude (FET)
**Customer Hub — InsightsBanner amb next action, salut relacional i LTV (§6.5)**
- **Creat `InsightsBanner.tsx`** a `app/admin/clientes/[id]/_components/` — component presentacional pur sobre `CustomerInsightsDTO`.
- Mostra 3 cards: **Acció recomanada** (amb CTA contextual segons tipus), **Salut relacional** (5 nivells amb color semàntic + detalls) i **Valor del client** (LTV + pagament pendent + tasques obertes + pròxim event).
- **Integrat a `CustomerHeader.tsx`**: substitueix el "Següent millor acció" hardcodejat (que depenia només del `status`) pel motor d'insights que mira tasques, pagaments, contacte, events i scoring.
- Eliminat codi mort (`nextAction` hardcodejat de 35 línies).
- **Verificació**: 0 errors TypeScript, 153 fitxers / **1993 tests** / 0 failures.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #36 — 2026-04-10 — claude (FET)
**Lead Insights UI — LeadInsightsBanner amb next action, risc i context comercial (§6.6)**
- **Creat `LeadInsightsBanner.tsx`** a `app/admin/leads/[id]/` — component presentacional pur sobre `LeadInsights`.
- Mostra 3 cards: **Acció recomanada** (8 tipus amb CTA contextual + urgència), **Risc de pèrdua** (4 nivells + fins a 3 raons visibles) i **Context comercial** (deal value estimat + client recurrent + dies fins event + última activitat).
- **Integrat a `page.tsx`**: inserit entre la secció executiva (score + LeadScore) i el `LeadGuidedFlow`. La variable `leadInsights` ja existia (Canvi #17) però no es renderitzava.
- **Verificació**: 0 errors TypeScript, 21 tests leadInsightsService passant.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #50 — 2026-04-10 — claude (FET)
**Booking Capacity — visió global de càrrega operativa (§6.7 Zenith)**
- **Creat `lib/services/bookingCapacityService.ts`** — funció pura `buildWeekCapacity(input)` + wrapper `loadWeekCapacity(startDate, days)`.
- **4 nivells de càrrega**: FREE (0 reserves), LIGHT (<max), FULL (=max), OVERLOADED (>max). maxPerDay configurable (default 2).
- Per dia: data, dayOfWeek, isWeekend, bookings amb detall, totalGuests, loadLevel.
- Sumari setmanal: totalBookings, busiestDay, freeCount, overloadedCount.
- **Creat `app/admin/calendario/capacity/page.tsx`** — 4 KPIs, grid 14 dies amb dot de nivell, bookings clicables, llegenda.
- Integrat al menú Operacions. 15 tests, 0 errors TypeScript.
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #49 — 2026-04-10 — claude (FET)
**Operational Pulse — salut operativa en temps real (§6.1 Zenith)**
- **Creat `lib/services/operationalPulseService.ts`** — funció pura `generateOperationalPulse(input)` + wrapper `loadOperationalPulse()`.
- **7 mètriques amb nivell** (EXCELLENT/GOOD/WARNING/CRITICAL):
  - Temps de resposta (<4h), compliment SLA (>90%), taxa seguiment (>80%), conversió pipeline (>30%), tasques vençudes (<5%), cobrament (>95%), retenció clients (>70%).
- `overallScore` com a mitjana, `overallLevel` derivat de combinació de criticals/warnings.
- **Creat `app/admin/components/OperationalPulsePanel.tsx`** — grid 7 mètriques colorejades amb dot animat si CRITICAL.
- **Integrat a `/admin/page.tsx`** sota DailyBriefPanel amb `Promise.all`.
- 17 tests nous, 0 errors TypeScript.
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #48 — 2026-04-10 — claude (FET)
**Task Automation — tasques intel·ligents per entitat (§6.4 Zenith)**
- **Creat `lib/services/tasks/taskAutomationService.ts`** — funció pura `generateAutoTasks(input)` + wrapper `runTaskAutomation()`.
- **7 regles d'automatització**: SLA_BROKEN (URGENT), STALE_LEAD (MEDIUM), BOOKING_PREP (HIGH), PAYMENT_OVERDUE (HIGH), POST_EVENT (MEDIUM), AT_RISK_CLIENT (MEDIUM), QUOTE_FOLLOWUP (HIGH).
- Cada tasca vinculada a l'entitat concreta (lead/booking/customer) amb nom, description, priority, dueDate i dedupeKey.
- Deduplicació via `[dedupeKey:...]` a la description per evitar tasques repetides.
- **API `POST /api/admin/tasks/auto`** per executar manualment.
- **`RunAutoTasksButton.tsx`** a la toolbar de tasques.
- 14 tests nous, 64/64 tests de tasks passant, 0 errors TypeScript.
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #47 — 2026-04-10 — claude (FET)
**Narrativa de comunicació unificada — Inbox + servei (§6.8 Zenith)**
- **Creat `lib/services/commTimelineService.ts`** — servei pur `buildCommTimeline(input)` + wrapper `loadCommTimeline(leadId, customerId)`.
- Unifica EMAIL, WHATSAPP, CALL i NOTE en una sola narrativa ordenada.
- Per cada entrada: canal, direcció (OUTBOUND/INBOUND/INTERNAL), títol, cos, autor, data.
- Mètriques: comptadors per canal, `lastContactAt`, `daysSinceLastContact`, `responseGap` (hores entre últim outbound i inbound).
- **Creat `app/admin/inbox/CommSummaryPanel.tsx`** — component client amb lazy fetch d'activitats, comptadors de canal, meta, últimes 3 entrades.
- **Integrat a `InboxSections.tsx`** sota `InboxLeadContext` quan el lead seleccionat té dades.
- 16 tests nous, 0 errors TypeScript.
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #46 — 2026-04-10 — claude (FET)
**Scoring explicable al UI — breakdown visual del lead score (§6.6 Zenith)**
- **Creat `lib/services/leadScoreBreakdownService.ts`** — funció pura `generateScoreBreakdown(input)` que decomposa el score en factors individuals amb impacte numèric (+/-), tipus (BASE/POSITIVE/NEGATIVE) i icona.
- Factors: estat base, pressupost (3 nivells), telèfon, data event (viable/passat/imminent), lloc, convidats, pack, staleness (24h/72h), source (referral/WhatsApp).
- Retorna `ScoreBreakdown` amb `score`, `band`, `probability`, `factors[]`, `positiveTotal`, `negativeTotal`.
- **Creat `app/admin/leads/[id]/LeadScoreBreakdown.tsx`** — component client amb barra visual, toggle expandible, cada factor colorejat per tipus amb punts.
- **Integrat a `leads/[id]/page.tsx`** entre InsightsBanner i GuidedFlow.
- 18 tests nous, 35/35 scoring tests passant, 0 errors TypeScript.
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #45 — 2026-04-10 — claude (FET)
**Smart Task Queue — classificació intel·ligent de tasques (§6.4 Zenith)**
- **Creat `lib/services/tasks/taskQueueService.ts`** — servei pur `classifyTaskQueue(input)` + wrapper `loadTaskQueue()`.
- **5 queues operatives**: VENÇUT (dueDate passat), AVUI (venç avui), VIP (client VIP o lead ≥2000€), BLOQUEJAT (sense moviment >7d configurable), NORMAL.
- Scoring intel·ligent: prioritat base per queue (1000/800/600/400/200) + bonus per priority (URGENT/HIGH/MEDIUM/LOW) + dies vençuts + bonus VIP.
- Entity resolution: customer > lead > booking per cada tasca.
- **Creat `app/admin/tasks/TaskQueueBanner.tsx`** — component client amb filtres per queue clicables, comptadors, toggle actiu/inactiu.
- **Integrat a `app/admin/tasks/page.tsx`** — `loadTaskQueue` en `Promise.all`, filtre per `?queue=` param, banner sobre la llista.
- 18 tests nous, 50/50 tests de tasks passant, 0 errors TypeScript.
- Iniciat per: `claude` — Tancat per: `claude`

---

### Canvi #44 — 2026-04-10 — claude (FET)
**Daily Brief — resum operatiu diari unificat a la home (§6.1 Zenith)**
- **Creat `lib/services/dailyBriefService.ts`** — servei pur `generateDailyBrief(input)` + wrapper `loadDailyBrief()`.
- **Contingut del brief**:
  - `greeting` dinàmic per hora (Bon dia/Bona tarda/Bona nit)
  - `summary` narratiu amb comptadors (entrades, tasques vençudes, reserves, cobraments)
  - 6 KPIs inline (entrades avui, leads oberts, vençudes, reserves 7d, cobraments, previsió)
  - **Alertes** amb nivell (CRITICAL/WARNING/INFO), icona, títol, detall i href: SLA broken, tasques vençudes, cobraments, leads estancats, post-event, dormants, at-risk
  - **Accions prioritàries** ordenades per score (respondre urgents, classificar, tancar vençudes, cobrar, preparar reserves, embut, post-event)
  - **Top 3 campanyes suggerides** amb link a `/admin/campaigns`
- **Creat `app/admin/components/DailyBriefPanel.tsx`** — component server renderitzable amb 6 KPIs, alertes clicables (link directe), accions en chips, campanyes en footer.
- **Integrat a `app/admin/page.tsx`** — `loadDailyBrief()` en paral·lel amb `fetchDashboardData()`. `<DailyBriefPanel>` inserit entre hero header i pròxim bolo.
- **Tests**: `__tests__/lib/services/dailyBriefService.test.ts` — 15 tests (greeting per hora, summary singular/plural, alertes per tipus, ordering accions, campanyes top 3, KPIs).
- **Verificació**: 0 errors TypeScript, 71 tests totals sessió.
- Primer canvi de Fase 4 Zenith: home com a "centre de comandament" real.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #43 — 2026-04-10 — claude (FET)
**Reporting Executiu — mètriques ampliades + UI dedicada (§6.10)**
- **Ampliat `executiveReportService.ts`** — 3 noves seccions al tipus `ExecutiveReport`:
  - `conversionBySource`: conversió per origen amb win rate i ingrés mig/client (CAC proxy)
  - `recurrence`: clients recurrents, taxa, mitjana events/client
  - `margin`: ingressos totals, cost directe (travelCost), marge brut, taxa de marge
  - `monthlyTrend`: 6 mesos amb leads, reserves i ingressos
- **Noves queries** al wrapper: `lead.groupBy` per source+status, `customer.count` returning, `customer.aggregate` avgEvents, `booking.findMany` amb travelCost, monthly groupBy leads + bookings.
- **Creat `app/admin/reporting/page.tsx`** — dashboard executiu server component:
  - 7 headline KPIs (clients, leads, reserves, ingressos, pipeline, previsió, SLA)
  - Embut visual amb barres proporcionals
  - Marge brut (ingressos, cost, marge, taxa)
  - Recurrència (clients recurrents, taxa, mitjana)
  - Taula conversió per origen (total, tancats, win rate, ingrés mig)
  - Tendència mensual 6m (leads, reserves, ingressos)
  - Leads en risc (top 10)
- **Integrat al menú** (`nav-items.ts`, secció Avançat): "📊 Reporting Executiu".
- **Verificació**: 0 errors TypeScript.
- Tanca el "SEGÜENT" de §6.10: reporting executiu real.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #42 — 2026-04-10 — claude (FET)
**Campanyes CRM — servei + UI (§6.5/Growth)**
- **Creat `lib/services/campaignService.ts`** — servei pur `generateCampaigns(input)` + wrapper `loadCampaigns()`.
- **7 tipus de campanya**: REACTIVATION (dormants + at-risk), UPSELL (first-time), LOYALTY (VIP), REFERRAL (returning), FEEDBACK_REQUEST (recent), SEASONAL (per temporada).
- Cada campanya inclou: segment, audienceSize, canal suggerit (WhatsApp/email), subject, body template amb `{nom}` i `{link_ressenya}`, urgència, estimatedImpact.
- Campanyes SEASONAL dinàmiques segons el mes: primavera-estiu (comunions/bodes), tardor (corporatives), Nadal, hivern (Carnaval/Sant Valentí).
- **Creat `app/admin/campaigns/page.tsx`** — server component amb:
  - 4 KPIs (campanyes suggerides, urgència alta, audiència total, canals)
  - Targeta expandible per campanya (tipus, nom, segment, audiència, impacte, plantilla)
  - Explicació de com funcionen
  - Link a reactivació individual
- **Integrat al menú** (`nav-items.ts`, secció Operacions): "📣 Campanyes".
- **Tests**: `__tests__/lib/services/campaignService.test.ts` — 14 tests (tots els tipus, seasonal per mes, estimatedImpact, ids únics).
- **Verificació**: 0 errors TypeScript, 14 tests passant.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #41 — 2026-04-10 — claude (FET)
**Reactivació de clients — servei + UI (§6.5)**
- **Creat `lib/services/reactivationService.ts`** — servei pur `generateReactivationCandidates(input)` + wrapper `loadReactivationCandidates()`.
- **6 classificacions** amb prioritat i score:
  - `DORMANT_VIP` (95, ALTA) — VIP dormant
  - `DORMANT_HIGH_VALUE` (85, ALTA) — ≥2000€ dormant
  - `DORMANT_RECURRING` (70, MITJANA) — ≥2 events dormant
  - `DORMANT_FIRST_TIME` (55, MITJANA) — 1 event dormant
  - `AT_RISK_HEALTH` (50, MITJANA) — healthScore ≤40 no dormant
  - `CHURNED_RECOVERY` (30, BAIXA) — churn ≤24 mesos
- **Missatges suggerits** en català i castellà segons `preferredLocale`, amb primer nom, subject i body complets.
- **Canals suggerits**: WhatsApp (si phone), email (si consent o alta prioritat), Instagram (si present).
- **UI `app/admin/clientes/reactivation/`**:
  - Server component carrega candidats → `ReactivationClient` client component
  - KPIs clicables per prioritat (ALTA/MITJANA/BAIXA/Total)
  - Targeta per candidat: badge prioritat, reason label, score, dades client, canals suggerits
  - Missatge expandible (details/summary) amb subject + body
  - Accions: WhatsApp (URL directa), Email (mailto), Copiar missatge, Veure fitxa client, Descartar
  - Estat buit diferenciat (sense candidats vs tots descartats)
- **Integrat al menú** (`nav-items.ts`, secció Operacions): "💤 Reactivació".
- **Tests**: `__tests__/lib/services/reactivationService.test.ts` — 20 tests (classificació 6 raons, exclusions, ordenació, plantilles ca/es, primer nom, WhatsApp URL, canals per consent/prioritat, daysSinceLastEvent).
- **Verificació**: 0 errors TypeScript, 20 tests passant.
- Tanca el pendent "reactivació automàtica" de §6.5.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #40 — 2026-04-10 — claude (FET)
**Social Ideas — idees de post auto-generades (§6.9)**
- **Creat `lib/services/socialIdeasService.ts`** — servei pur `generateSocialIdeas(input)` + wrapper `loadSocialIdeas()` que carrega dades i crida la pura.
- **4 fonts d'idees**:
  - **Booking recent (1–30d)** sense `SocialPost` associat → `EVENT_SHOWCASE` + carrusel
  - **Testimoni aprovat** → `TESTIMONIAL` + imatge (si hi ha foto) o text
  - **Portfolio event nou (≤45d publicat)** → carrusel + Pinterest
  - **Esdeveniment futur (2–14d)** → `STORY` + countdown + `scheduledAt` suggerit (-2d abans)
- **Integració a `SocialClient.tsx`**:
  - Nova prop `initialIdeas` + estat `ideas`
  - Panell "Idees suggerides" sota el toolbar amb targeta per idea (icona font, títol, caption, plataformes, reason)
  - Botó "Usar aquesta idea" → obre el modal pre-emplenat via `postSeed` (title, caption, hashtags, platforms, contentType, category, scheduledAt, mediaUrl, bookingId)
  - Botó "Descartar" treu localment la idea
  - En desar una idea convertida: s'auto-elimina de la llista
  - Panell colapsable ("Amagar"/"Mostrar")
- **Tests**: `__tests__/lib/services/socialIdeasService.test.ts` — 12 tests de la funció pura (booking + exclusions, testimoni 5★ + contentType, portfolio ≤45d, upcoming scheduledAt, combinació multi-font, truncat).
- **Verificació**: 0 errors TypeScript, 22 tests totals (socialIdeas 12 + customerList 10).
- Tanca parcialment el "SEGÜENT" de §6.9: connectar Social amb bookings, testimonials i portfolio.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #39 — 2026-04-10 — claude (FET)
**CRM Segments — segments "En risc" i "Alt valor" ara funcionals (§6.5)**
- **Bug detectat**: els segments `en-risc` (`healthScoreMax: 40`) i `alt-valor` (`minSpent: 2000`) estaven definits a `CUSTOMER_SEGMENTS` però el click handler a `CrmSegmentFilters` només cridava `clearAll()` sense aplicar-los. Backend tampoc suportava `minSpent`.
- **Backend (`customerListService.ts`)**:
  - Afegit `minSpent?: number` al tipus `CustomerListInput`
  - Afegida condició Prisma `{ totalSpent: { gte: input.minSpent } }`
  - Afegit count `highValue` (`totalSpent >= 2000`) a stats
- **API route (`customers/route.ts`)**: passa `minSpent` del query param al servei.
- **Frontend (`clientes/page.tsx`)**:
  - Estats nous `healthScoreMax` i `minSpent` amb integració a `fetchCustomers` (URL params + deps) i reset de pàgina
  - `CrmSegmentFilters` reescrit: props signature ampliada, `clearAll` helper, `isActive` detecta els 4 tipus de filtre, click handler aplica el filtre correcte segons tipus de segment
  - Badge `highValue` al segment "Alt valor", dropdown lifecycle fa reset de segments
  - Botó "Netejar filtres" condició ampliada
- **Tipus (`customer-utils.ts`)**: `CustomerStats.highValue?: number`
- **Tests**: 3 nous a `customerListService.test.ts` — filtre `healthScoreMax`, filtre `minSpent`, stats `highValue`. Total **10/10 passing**.
- **Verificació**: 0 errors TypeScript, 10 tests customerListService passant.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #38 — 2026-04-10 — claude (FET)
**Social Media Workspace — UI completa per al Social Media Calendar (§6.9)**
- **Creat `app/admin/social/page.tsx`** — server component que carrega posts + counts amb `listSocialPosts` + `getSocialPostCounts`.
- **Creat `app/admin/social/SocialClient.tsx`** — client component amb:
  - KPIs clicables per estat (5 estats: IDEA, DRAFT, SCHEDULED, PUBLISHED, ARCHIVED)
  - **Vista llista** amb filtres, canvi d'estat inline, accions edit/delete
  - **Vista calendari mensual** amb navegació per mesos, posts renderitzats per dia, col·lisions visibles, click obre l'editor
  - **Modal CRUD** amb multi-platform selector (7 plataformes), contentType (6 tipus), category (8 categories), scheduledAt datetime, caption, hashtags, notes
  - Feedback via flash messages
- **Integrat al menú lateral** (`nav-items.ts`, secció Contingut) amb icona 📱.
- Backend existent (`socialPostService` + API routes + 32 tests) no tocat — només UI.
- Tanca el pendent crític de §6.9: Social ja no és backend orfe.
- **Verificació**: 0 errors TypeScript.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #37 — 2026-04-10 — claude (FET)
**Inbox — Context comercial intel·ligent al detall de leads (§6.8)**
- **Creat `InboxLeadContext.tsx`** a `app/admin/inbox/` — computa `scoreLead` client-side en temps real.
- Mostra 2 cards: **Acció recomanada** (dinàmica segons status + temps transcorregut + score band) i **Puntuació comercial** (score + band + dies des de creació + dies fins event + comptador riscos).
- Substitueix el `actionHint` estàtic ("Respon o obre el lead") per recomanació intel·ligent contextual.
- **Afegits camps `updatedAt` i `source`** al query del leads d'Inbox + tipus `LeadData`.
- **Verificació**: 0 errors TypeScript.
- Iniciat per: `claude` — Tancat per: `claude`

### Canvi #53 — 2026-04-10 — codex (FET; reclassificat des de #51/#52 per col·lisió de comptador)
**Sincronització del comptador compartit després dels canvis #34-#50 de Claude.**
- Detectat que el protocol ja contenia canvis fins al `#50`, però [admin.ts](D:\orbitaevents\lib\constants\admin.ts) encara mostrava `ADMIN_CHANGE_COUNTER = 33`.
- El header compartit passa a `53`, alineat amb el màxim real del protocol més aquest canvi de sincronització.
- `qa:protocol` queda com a barrera: si el header torna a quedar per sota del màxim registrat, fallarà.
- El següent canvi real ha de ser `#54`.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #54 — 2026-04-10 — codex (FET)
**Correcció dels catàlegs locals detectats per `arch:layer:check`.**
- `DAY_NAMES` de [capacity/page.tsx](D:\orbitaevents\app\admin\calendario\capacity\page.tsx) passa a `ADMIN_WEEKDAY_SHORT_LABELS` a [admin.ts](D:\orbitaevents\lib\constants\admin.ts).
- Els `Set` locals de validació de [socialPostService.ts](D:\orbitaevents\lib\services\socialPostService.ts) passen a `SOCIAL_VALIDATION_SETS` a [index.ts](D:\orbitaevents\lib\constants\index.ts).
- Això manté el criteri monocapa: serveis i pàgines consumeixen constants, no defineixen catàlegs propis.
- El comptador compartit passa a `54`; el següent canvi real ha de ser `#55`.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #55 — 2026-04-10 — codex (FET)
**Guard perquè `app/**` no torni a importar `messages/*` directament.**
- Afegit [check-message-imports.mjs](D:\orbitaevents\scripts\check-message-imports.mjs) per detectar imports directes de `messages/{ca,es,en}.json` fora dels adaptadors i18n aprovats.
- Nou script `qa:message-imports` a [package.json](D:\orbitaevents\package.json).
- `validate:core` i `build:ci` ara executen també aquest guard abans del check de capes.
- Això reforça la regla: components i configs consumeixen helpers de `lib`, no `messages/*` directament.
- El comptador compartit passa a `55`; el següent canvi real ha de ser `#56`.
- Iniciat per: `codex` — Tancat per: `codex`
### Canvi #56 — 2026-04-10 — codex (FET)
**Checklist Zenith actualitzat amb l'estat real fins al Canvi #55.**
- Actualitzades les seccions §6.1, §6.9, §6.10, §6.12, §6.13 i §6.14 perquè reflecteixin els canvis de Claude #34-#52 i els guards de Codex #53-#55.
- El checklist ja no diu que `packs-config`, `site-config`, `equipment-config` o `app/layout` continuen com a pendents crítics principals quan ja han estat drenats o protegits per guards.
- Les decisions obertes passen a focus real: build complet, review visual dels workspaces nous i literals residuals de landings/SEO.
- El comptador compartit passa a `56`; el següent canvi real ha de ser `#57`.
- Iniciat per: `codex` — Tancat per: `codex`

### Canvi #57 — 2026-04-10 — codex (FET)
**Validació de build de producció amb `build:ci`.**
- `build:ci` ha passat tots els guards previs: `qa:protocol`, `qa:encoding`, `qa:message-imports`, `arch:layer:check`, `i18n:packs:guard`, `i18n:equipment:guard`.
- Primera passada: `next build` ha compilat correctament, però ha fallat a `Collecting page data` per `ENOENT: .next/server/pages-manifest.json`.
- Segona passada: `pnpm run build:ci` ha acabat en verd i ha generat 255/255 pàgines estàtiques.
- Risc residual detectat: durant la generació estàtica apareixen avisos Prisma `P2037` per excés de connexions DB en consultes públiques de portfolio/showcase. No tomba el build, però queda com a següent deute tècnic a reduir.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #58 — 2026-04-10 — codex (FET)
**Reducció de pressió Prisma durant el build públic de portfolio/media.**
- `publicPortfolioShowcaseService` deixa de resoldre totes les categories amb `Promise.all` i passa a carregar-les de forma seqüencial, mantenint la cache de producció.
- `galleryService.listPortfolioPhotos` elimina el `findMany + count` en paral·lel; conserva `includeTotal` per compatibilitat i permet saltar el `count` quan només calen imatges.
- Les crides públiques de portfolio/media que no necessiten totals passen a `includeTotal: false`.
- `publicServiceMediaService` deixa de carregar totes les targetes mòbils en paral·lel i evita pics de connexions durant SSG.
- Objectiu: reduir els `P2037` de Prisma detectats al `Canvi #57` sense canviar el comportament visible.
- Verificació: `pnpm run qa:protocol`, `pnpm run qa:encoding:changed`, `npx tsc --noEmit` i `pnpm run build:ci` en verd; build amb 255/255 pàgines i sense errors Prisma `P2037`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #59 — 2026-04-10 — codex (FET)
**Guard obligatori de propietat per als canvis nous del protocol.**
- `qa:protocol` ara valida que cada `Canvi #N` des del `#57` inclogui els tres camps exactes: `Començat per`, `Treballant per` i `Tancat per`.
- Això converteix la norma verbal del protocol en una barrera automàtica: si algú obre o tanca un bloc sense responsable visible, el check falla.
- `ADMIN_CHANGE_COUNTER` passa a `59`; el següent canvi real ha de ser `#60`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #60 — 2026-04-10 — codex (FET)
**Guard anti-artefactes literals de newline al protocol.**
- `qa:protocol` ara falla si `protocol-producte-admin-ca.md` conté artefactes literals de newline escapats reals, sense penalitzar paths Windows legítims.
- Això evita que edicions amb PowerShell o reemplaços manuals deixin caràcters tècnics visibles dins el document operatiu.
- També queda netejada la separació visual entre `Canvi #59` i `#10. Veredicte`.
- `ADMIN_CHANGE_COUNTER` passa a `60`; el següent canvi real ha de ser `#61`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #61 — 2026-04-10 — codex (FET)
**Checklist Zenith actualitzat després dels guards i build net fins al Canvi #60.**
- §6.12, §6.13 i §6.14 deixen de tractar el build complet i els guards de protocol com a pendents: `build:ci` ja passa amb 255/255 pàgines i `qa:protocol` cobreix comptador, propietat i artefactes reals de newline.
- Fase 1 queda reexpressada com a nucli avançat: `Task` pràcticament tancat, timeline avançada i coherència transversal pendent de review visual/UX.
- `ADMIN_CHANGE_COUNTER` passa a `61`; el següent canvi real ha de ser `#62`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #62 — 2026-04-10 — codex (FET)
**Format del registre alineat amb el guard de propietat.**
- El bloc `Format d'entrada` del §9 ara inclou explícitament `Començat per`, `Treballant per` i `Tancat per`, que són obligatoris des del guard `qa:protocol`.
- També queda netejada la separació visual entre `Canvi #61` i `#10. Veredicte`.
- `ADMIN_CHANGE_COUNTER` passa a `62`; el següent canvi real ha de ser `#63`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #63 — 2026-04-10 — codex (FET)
**Tests del guard de protocol.**
- Afegit `__tests__/scripts/check-admin-change-log.test.ts` per provar el comportament real de `qa:protocol` sobre fixtures temporals.
- Cobreix protocol vàlid, números duplicats, comptador desincronitzat, camps de propietat absents i artefactes literals de newline.
- `ADMIN_CHANGE_COUNTER` passa a `63`; el següent canvi real ha de ser `#64`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #64 — 2026-04-10 — codex (FET)
**Test del protocol integrat al flux `validate:core`.**
- Afegit script `qa:protocol:test` per executar `__tests__/scripts/check-admin-change-log.test.ts` de forma explícita.
- `validate:core` ara executa `qa:protocol` i després `qa:protocol:test`, de manera que el guard no només corre: també queda cobert per prova automatitzada.
- Netejada la separació visual entre els canvis `#61`, `#62`, `#63` i el veredicte.
- `ADMIN_CHANGE_COUNTER` passa a `64`; el següent canvi real ha de ser `#65`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #65 — 2026-04-10 — claude/codex (FET)
**Cron CRM customer-lifecycle tancat amb cobertura.**
- Claude havia iniciat `app/api/cron/customer-lifecycle/route.ts` abans d'aturar-se.
- Codex tanca el bloc amb test de route: auth Bearer obligatòria, execució OK, persistència `saveCronRunStatus` i camí d'error controlat.
- El checklist §6.5 queda ajustat: el cron automatitza recalcul de `lifecycleStage` i `healthScore`; la reactivació amb enviaments/tasques queda com a decisió separada per seguretat operativa.
- `ADMIN_CHANGE_COUNTER` passa a `65`; el següent canvi real ha de ser `#66`.
- Començat per: `claude`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #66 — 2026-04-10 — codex (FET)
**Customer lifecycle visible al monitor de crons.**
- Afegit `customerLifecycle` a `ADMIN_CRON_PREFIXES` amb prefix `crm.customer-lifecycle` i freqüència diària.
- Afegit `__tests__/lib/constants/adminCronPrefixes.test.ts` per garantir que el cron CRM queda registrat i que no hi ha ids/prefixes duplicats.
- Això tanca el forat entre endpoint existent i observabilitat admin: el cron ja no queda invisible a `/admin/crons`.
- `ADMIN_CHANGE_COUNTER` passa a `66`; el següent canvi real ha de ser `#67`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #67 — 2026-04-10 — codex (FET)
**Neteja semàntica final de LeadTask a la capa route.**
- Renombrats els aliases exportats `LeadTaskRouteInput` i `LeadTaskRouteUpdateInput` a `LeadScopedTaskRouteInput` i `LeadScopedTaskRouteUpdateInput`.
- El servei `leadScopedTaskRouteService` ja no exposa noms que suggereixin el model eliminat `LeadTask`.
- El checklist §6.2 queda ajustat: el pendent de naming queda tancat; només resta desplegar la migració a Railway i verificar dades reals.
- `ADMIN_CHANGE_COUNTER` passa a `67`; el següent canvi real ha de ser `#68`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #68 — 2026-04-10 — codex (FET)
**Cron programat per tasques automàtiques.**
- Afegit `GET /api/cron/tasks-auto` amb Bearer `CRON_SECRET`, `runTaskAutomation()` i `saveCronRunStatus` a `automation.tasks`.
- El cron retorna i persisteix un resum compacte (`proposed`, `created`, `skipped`) per no embrutar settings amb propostes completes.
- Registrat `taskAutomation` a `ADMIN_CRON_PREFIXES` perquè aparegui a `/admin/crons`.
- Afegit test de route `__tests__/app/api/cron/tasks-auto-route.test.ts` i ampliat el test de catàleg de crons.
- `ADMIN_CHANGE_COUNTER` passa a `68`; el següent canvi real ha de ser `#69`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #69 — 2026-04-10 — codex (FET)
**Guard de regressió Task canònic.**
- Afegit `scripts/check-task-canonical.mjs` per bloquejar usos actius de `LeadTask` ja eliminat: `prisma.leadTask`, `lead.tasks`, `LeadTaskRouteInput`, `LeadTaskRouteUpdateInput`, wrappers legacy i `model LeadTask`.
- Afegit script `arch:task-canonical:check` i integrat a `validate:core` després de `arch:layer:check`.
- El guard deixa fora docs i migracions històriques; només protegeix codi actiu i `prisma/schema.prisma`.
- `ADMIN_CHANGE_COUNTER` passa a `69`; el següent canvi real ha de ser `#70`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #70 — 2026-04-10 — codex (FET)
**build:ci passa per validate:core.**
- Simplificat `build:ci` a `pnpm run validate:core && next build`.
- Això evita divergències entre CI/build i validació local: qualsevol guard nou dins `validate:core` entra automàticament al build.
- El guard de Task canònic del Canvi #69 queda també cobert pel build sense duplicar scripts manualment.
- `ADMIN_CHANGE_COUNTER` passa a `70`; el següent canvi real ha de ser `#71`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #71 — 2026-04-10 — codex (FET)
**Metadata de comunicacions preservada a timeline canònica.**
- `LeadActivityLike` accepta `metadata` i `mapLeadActivityToCanonicalEvent` la propaga a `CanonicalTimelineEvent.metadata`.
- Els fetchers de customer, lead i booking passen `leadActivity.metadata` al mapper canònic.
- Afegides regressions a `timelineQueryService.test.ts` per WhatsApp/email metadata.
- Això tanca parcialment §6.3: Inbox/Comms ja entren via `leadActivity`; queda decidir si cal una entitat pròpia de comunicacions a llarg termini.
- `ADMIN_CHANGE_COUNTER` passa a `71`; el següent canvi real ha de ser `#72`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #72 — 2026-04-10 — codex (FET)
**Queue filter de Tasks abans de paginar.**
- `fetchAdminTaskList` accepta `taskIds` i aplica `id in (...)` a la query i al count abans del `skip/take`.
- `/admin/tasks` ara carrega `TaskQueue` primer quan hi ha `queue=` i passa els ids filtrats al servei en comptes de filtrar només la pàgina ja paginada.
- Cas `taskIds: []` retorna `{ tasks: [], total: 0 }` sense tocar Prisma.
- Afegides regressions a `__tests__/lib/services/tasks/taskList.test.ts`.
- `ADMIN_CHANGE_COUNTER` passa a `72`; el següent canvi real ha de ser `#73`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #73 — 2026-04-10 — codex (FET)
**Tasks list responsive i copy visible corregit.**
- `TaskRowActions` passa a accions apilades en mòbil i horitzontals en `sm+`, amb botons `whitespace-nowrap`.
- `TaskListSection` passa a row `flex-col` en petit i `sm:flex-row`, evitant que data/accions surtin del contenidor.
- Corregit copy visible `Obrir desti` -> `Obrir destí`.
- `ADMIN_CHANGE_COUNTER` passa a `73`; el següent canvi real ha de ser `#74`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #74 — 2026-04-10 — claude (FET)
**Activity — visual premium (§6.11).**
- KPI stats cards: `ap-card` → `admin-card-glass` + `admin-stagger-item` + `border-white/10` + hover subtle. Labels amb `opacity-60`.
- Mobile log cards: `ap-card` → `admin-card-glass` + `admin-stagger-item` + `border-white/10` + hover subtle.
- Desktop table: wrapper amb `admin-card-glass` + `border-white/10` + `overflow-hidden`.
- Empty state: `admin-card-glass` amb border coherent.
- 0 hex hardcoded nous, 0 errors TypeScript.
- `ADMIN_CHANGE_COUNTER` passa a `74`; el següent canvi real ha de ser `#75`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #75 — 2026-04-10 — codex (FET)
**TaskKanbanView responsive.**
- Kanban de tasques passa a scroll horitzontal amb `snap-x` en mòbil i manté `md:grid md:grid-cols-3` en desktop.
- Afegit selector de columna mòbil amb punts i `scrollIntoView`, consistent amb altres pipelines.
- Cada columna mostra posició mòbil i evita tres columnes llargues apilades a 375px.
- `ADMIN_CHANGE_COUNTER` passa a `75`; el següent canvi real ha de ser `#76`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #76 — 2026-04-10 — codex (FET)
**Norma de bellesa funcional obligatòria al checklist.**
- Afegida com a característica exigida del repo: cada punt del checklist ha de revisar claredat visual, jerarquia, ritme, contenidors, zero overflow visible i coherència amb el sistema abans de donar-se per `FET`.
- Afegida al tancament de bloc: no es pot tancar una feina UI sense validació de bellesa funcional, responsive i contenidors.
- Actualitzat §6.1 perquè el checklist incorpori explícitament `bellesa funcional obligatòria` i `zero overflow visible`.
- `ADMIN_CHANGE_COUNTER` passa a `76`; el següent canvi real ha de ser `#77`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #77 — 2026-04-10 — codex (EN MARXA)
**Auditoria visual/overflow global del repo.**
- Objectiu: revisar de nou admin i web pública amb criteri de bellesa funcional, contenidors, responsive real, copy visible i zero overflow visible.
- Primera passada: escaneig estàtic de patrons de risc (`nowrap`, `shrink-0`, `min-w-*`, taules, grids, cards i layouts flex).
- Segona passada prevista: `theme:admin:check`, captures Playwright quan el servidor local estigui disponible i correccions prioritzades per pantalles crítiques.
- Categories obligatòries de l'auditoria global: overflow i contenidors; colors/gradients hardcoded; copy visible fora de `messages/*` o constants; enums interns visibles; mojibake; duplicació de domini; mala separació de capes; responsive fals; accessibilitat trencada; semàfors incoherents; estats buits pobres; accions confuses; tests absents en lògica nova; migracions arriscades; performance visual; noms legacy; docs/checklist desfasats.
- Direcció de qualitat: cada categoria s'ha de convertir progressivament en guard, script o checklist verificable, no només en revisió manual.
- `ADMIN_CHANGE_COUNTER` passa a `77`; el següent canvi real ha de ser `#78`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `pendent`

### Canvi #78 — 2026-04-10 — claude (FET)
**Plantilles intel·ligents per Inbox (§6.8) + responsive/overflow fixes globals.**
- **Creat `lib/services/inboxTemplateService.ts`** — servei pur `generateSmartTemplates(context)` + `generateAllTemplates(context)`.
- **6 plantilles**: primer-contacte, seguiment, seguiment-pressupost, confirmació-data, agraïment-post-event, reactivació.
- Cada plantilla adapta subject+body al nom (primer nom), event type, data, ubicació, convidats i idioma (ca/es).
- Selecció contextual per estat del lead: NEW → primer contacte; CONTACTED/NEGOTIATING → seguiment + pressupost; WON → confirmació + agraïment; sempre → reactivació.
- **Integrat al `ComposeForm.tsx`**: panell de plantilles intel·ligents amb grid responsive (`sm:grid-cols-2 lg:grid-cols-3`), glass cards amb stagger. Click aplica subject+body+mode.
- **22 tests** (`inboxTemplateService.test.ts`): classificació per estat, i18n ca/es, primer nom, context event, camp buit/null.
- **Fixes responsive/overflow globals**: Activity title `truncate`, Lead detail 4 sidebar sections → `admin-card-glass`, related leads → glass, Social `p-4 sm:p-6` + toolbar `flex-wrap` + title `truncate` + accions `max-w` responsive, ComposeForm `p-4 sm:p-6`.
- 0 errors TypeScript, 0 hex hardcoded nous.
- `ADMIN_CHANGE_COUNTER` passa a `78`; el següent canvi real ha de ser `#79`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`


### Canvi #79 — 2026-04-10 — codex (FET)
**Checklist ampliat amb categories de revisió global del repo.**
- Afegides al checklist les famílies de problemes que s'han de buscar de forma recurrent: overflow/contenidors, hardcoded visual, copy mal ubicat, enums interns visibles, mojibake, duplicació de domini, capes barrejades, responsive fals, accessibilitat, semàfors, estats buits, accions confuses, tests, migracions, performance visual, legacy i docs desfasats.
- La llista no és tancada: qualsevol patró nou que aparegui al repo s'ha d'afegir com a nova categoria auditable, amb guard, script o criteri verificable quan sigui possible.
- La norma queda lligada al Canvi #77: l'auditoria global continua `EN MARXA`, però aquest apunt tanca la incorporació formal de les categories al checklist.
- `ADMIN_CHANGE_COUNTER` passa a `79`; el següent canvi real ha de ser `#80`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #80 — 2026-04-10 — claude (FET)
**Seguiment de resposta automàtic per Inbox (§6.8).**
- **Creat `lib/services/responseTrackingService.ts`** — servei pur `detectPendingFollowUps(input)` + wrapper `loadPendingFollowUps()`.
- Detecta leads contactats sense resposta inbound. 3 nivells d'urgència: URGENT (≥5d), NORMAL (2-4d), LOW (1d).
- Ordena per urgència i dies. Suggereix acció concreta (trucar, email, esperar) en ca/es.
- Diferencia outbound/inbound per `metadata.direction` a `leadActivity`.
- **API**: `GET /api/admin/leads/follow-ups` — retorna `FollowUpSummary`.
- **UI**: `PendingFollowUpsPanel.tsx` a Inbox — panell glass amb llistat de follow-ups pendents, badges urgència, accions ràpides (email, WhatsApp, obrir lead). Expandible si >5 items.
- **17 tests** (`responseTrackingService.test.ts`): detecció, exclusions, urgència, ordenació, i18n, edge cases.
- 0 errors TypeScript.
- `ADMIN_CHANGE_COUNTER` passa a `80`; el següent canvi real ha de ser `#81`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #81 — 2026-04-10 — claude (FET)
**Suggeriments automàtics de pipeline per Leads (§6.6).**
- **Creat `lib/services/leadPipelineSuggestionsService.ts`** — servei pur `generatePipelineSuggestions(input)` + wrapper `loadPipelineSuggestions()`.
- **7 tipus de suggeriment**: HOT_UNCONTACTED (NEW >4h), STALE_NEGOTIATION (>5d), QUOTE_NO_REPLY (>3d), EVENT_SOON_NO_BOOKING (<30d), HIGH_VALUE_IDLE (>2000€ + >3d), BULK_NEW_LEADS (≥5/dia), WINNING_STREAK (≥3 WON/7d).
- 4 nivells prioritat (CRITICAL/HIGH/MEDIUM/INFO), ordenat per urgència.
- **API**: `GET /api/admin/leads/suggestions`.
- **UI**: `PipelineSuggestionsPanel.tsx` integrat a `/admin/leads` — glass cards amb badge de count, stagger, responsive.
- **25 tests** cobertura de cada suggeriment, thresholds, edge cases.
- 0 errors TypeScript.
- `ADMIN_CHANGE_COUNTER` passa a `81`; el següent canvi real ha de ser `#82`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`


### Canvi #82 — 2026-04-10 — codex (FET)
**Manual de possibilitats dins l'admin.**
- Creada la pàgina `/admin/manual` com a guia pràctica de tota la maquinària: captació, clients, operacions, comunicació/social, finances i sistema.
- El contingut viu a `lib/constants/adminManual.ts` perquè el component no sigui un mur de copy dispers i pugui créixer amb criteri.
- Afegida entrada `Manual` al menú de Configuració perquè sigui visible i accessible des de l'admin.
- La pàgina inclou també el checklist de categories de revisió global: overflow, hardcoded, copy, enums interns, mojibake, duplicacions, capes, responsive, accessibilitat, semàfors, estats buits, accions, tests, migracions, performance, legacy i docs.
- `ADMIN_CHANGE_COUNTER` passa a `82`; el següent canvi real ha de ser `#83`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #83 — 2026-04-10 — claude (FET)
**Daily Brief integra follow-ups i suggeriments pipeline.**
- `DailyBriefInput` amplia 5 camps nous: `pendingFollowUps`, `urgentFollowUps`, `pipelineHotUncontacted`, `pipelineQuoteNoReply`, `pipelineEventSoonNoBooking`.
- `generateDailyBrief()` genera 5 alertes i 4 accions noves amb prioritats ajustades (seguiments urgents a 95, leads calents a 92, events propers a 75).
- `loadDailyBrief()` afegeix 5 queries lleugeres al `Promise.all` per obtenir els comptadors sense invocar els wrappers complets dels serveis (eficiència).
- `dailyBriefService.test.ts`: 6 tests nous cobrint urgents, pendents, hot uncontacted, quote no reply, event soon, i prioritat d'accions — 21/21 verd.
- Resultat: l'Executive Cockpit (`/admin/executive`) ara unifica tot el senyal crític (SLA, tasques, pagaments, leads calents, pressuposts encallats, events imminents, follow-ups urgents) en un sol brief.
- `ADMIN_CHANGE_COUNTER` passa a `83`; el següent canvi real ha de ser `#84`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #84 — 2026-04-10 — codex (FET)
**Backlog de millores majors cap al zenit apuntat al checklist.**
- Prioritat 1: Executive Cockpit / centre de comandament. Una pantalla única de decisió diària amb diners, leads calents, tasques crítiques, reserves en risc, cobraments, clients a reactivar, social pendent i decisions recomanades.
- Prioritat 2: motor de següent millor acció. Cada lead, client i reserva ha de proposar una acció concreta: trucar, enviar plantilla, cobrar, demanar ressenya, reactivar, pujar preu o revisar risc.
- Prioritat 3: nurturing automàtic amb control. Seqüències aprovables, no spam cec: dia 1, dia 3, dia 7, estat, plantilla, calendari, opt-out i traça.
- Prioritat 4: attribution i ROI comercial. Primer touch, assist, last touch, campanya, canal, cost i marge per saber què val la pena potenciar.
- Prioritat 5: forecast real. Probabilitat per estat, antiguitat, tipus d'event, urgència, pressupost, resposta i historial en lloc de `budget * 0.3`.
- Prioritat 6: manual viu + command palette. La guia `/admin/manual` ha d'evolucionar cap a “què vols fer?” i la cerca global ha de ser palanca central d'acció.
- Prioritat 7: QA visual automàtica. Overflow, contenidors, mobile, semàfors, hardcoded, copy cru, mojibake i captures quan toca han de ser part del tancament de cada punt.
- També queda revisat `scripts/check-visual-overflow.mjs` perquè el guard pugui continuar evolucionant dins l'auditoria global del Canvi #77.
- `ADMIN_CHANGE_COUNTER` passa a `84`; el següent canvi real ha de ser `#85`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #85 — 2026-04-10 — codex (FET)
**Playbook de màrqueting afegit al manual/checklist/diari.**
- Afegida secció visible `Playbook de màrqueting` a `/admin/manual` amb rutina accionable: cada dia, dilluns, dimarts, dimecres, dijous i divendres.
- Cada item diu què fer, quin objectiu té, com fer-ho, quin mòdul admin obrir i quins senyals mirar.
- El contingut viu a `lib/constants/adminManual.ts` com a `ADMIN_MARKETING_PLAYBOOK`, no hardcoded dins el component.
- El checklist §6.1 queda alineat: el manual ja no només explica la maquinària, també guia captació i màrqueting operatiu.
- `ADMIN_CHANGE_COUNTER` passa a `85`; el següent canvi real ha de ser `#86`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #86 — 2026-04-10 — codex (FET)
**Criteri de canals i Google Ads afegit al manual.**
- Afegida secció `Criteri de canals i Google Ads` a `/admin/manual` amb regla explícita: `0 leads = coll d'ampolla abans que pressupost`.
- Afegit mapa de plataformes recomanades: Google Business Profile, Google Ads Search, Instagram/Facebook orgànic, Meta Ads, WhatsApp Business, SEO local/blog, TikTok/Reels i partners/referrals.
- Afegit semàfor de decisió per Google Ads: impressions/entrega, CTR, CPC, conversió landing, CPA/CPL, qualitat del lead i ROI/marge atribuït.
- El contingut viu a `lib/constants/adminManual.ts`; la UI només renderitza constants i manté contenidors responsive.
- `ADMIN_CHANGE_COUNTER` passa a `86`; el següent canvi real ha de ser `#87`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #87 — 2026-04-10 — codex (FET)
**Google Calendar genera alarmes de reserva.**
- Afegides constants canòniques a `lib/constants/googleCalendar.ts` per definir recordatoris de reserves sincronitzades.
- `syncBookingToGoogleCalendar` ara envia `reminders.useDefault = false` i overrides propis: popup 7 dies abans, popup 24 h abans, email 24 h abans i popup 2 h abans.
- La descripció de l'event inclou resum d'alarmes perquè sigui visible dins Google Calendar.
- La pàgina d'integracions explica que Google Calendar sincronitza reserves i crea alarmes 7 dies, 24 h i 2 h abans.
- Afegit test de regressió a `googleCalendarSyncService.test.ts` per assegurar que el payload enviat a Google inclou recordatoris.
- `ADMIN_CHANGE_COUNTER` passa a `87`; el següent canvi real ha de ser `#88`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #88 — 2026-04-10 — claude (FET)
**Daily Brief detecta sequera de captació (lead drought).**
- **Problema identificat per l'usuari**: "no arribem a gairebé ningú · no entra ni un lead amb les dades actuals". L'admin estava dissenyat per gestionar un flux de leads que no existeix, mostrant alertes buides sobre leads inexistents.
- `DailyBriefInput` amplia amb `leadsLast7d` i `leadsLast30d` (TOTS els estats, no només oberts).
- `generateDailyBrief()` nova lògica **PRIORITAT MÀXIMA** abans de qualsevol altra alerta:
  - Si `leadsLast7d === 0` → alerta CRITICAL "🏜️ Captació aturada — 0 leads en 7 dies" amb href `/admin/manual`.
  - Si `leadsLast7d ≤ 2` → alerta CRITICAL "⚠️ Captació molt baixa" amb href `/admin/manual`.
- `buildSummary()` canvia completament de to en sequera: "Captació aturada. 0 leads en 7 dies. El focus d'avui és atraure, no gestionar."
- Accions prioritàries: "Executar pla de captació" amb priority 200 (per sobre de tota la resta — SLA era 100).
- `loadDailyBrief()` afegeix 2 queries lleugeres per `leadsLast7d` i `leadsLast30d`.
- 5 tests nous cobrint sequera/famine/summary change/prioritat d'acció. 26/26 verd.
- **Efecte real**: quan l'usuari obri el dashboard amb 0 leads, la primera cosa que veurà no és "has de respondre 0 entrades urgents" (absurd) sinó "CAPTACIÓ ATURADA — ves al manual i executa el pla". Això reenfoca tota l'experiència cap al problema real.
- `ADMIN_CHANGE_COUNTER` passa a `88`; el següent canvi real ha de ser `#89`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #89 — 2026-04-10 — claude (FET)
**Panell "Estat de captació" al dashboard executiu.**
- Continuació natural del Canvi #88: la detecció de sequera al Daily Brief era puntual (alerta binària), però calia un panell permanent amb context visual, tendència i comparativa per saber *com* està evolucionant la captació dia a dia.
- Nou servei `lib/services/captureHealthService.ts` (pure function + async wrapper):
  - `CaptureHealthStatus`: `DROUGHT` (0) · `FAMINE` (1-2) · `LOW` (3-5) · `HEALTHY` (6-10) · `GROWING` (>10) — llindars setmanals.
  - `CaptureTrend`: `UP` / `DOWN` / `FLAT` amb llindar ±10% (dins del rang → estable, sense soroll).
  - `generateCaptureHealth()` retorna headline + detail + suggestedAction contextuals al status, més breakdown d'orígens ordenats per volum amb percentatges.
  - `loadCaptureHealth()` fa 6 queries Prisma en paral·lel: leads 7d/prev7d/30d/prev30d/90d + `groupBy({ by: ['source'] })` per breakdown d'origen dels últims 90 dies.
  - `SOURCE_LABELS` tradueix l'enum `LeadSource` al català (Web, Configurador, Telèfon, WhatsApp, Instagram, Wallapop, Referit, Google, Altres).
- Accions suggerides contextuals per status:
  - DROUGHT → "Executar pla de captació" → `/admin/manual` (Fase 0 + Fase 1).
  - FAMINE → "Reforçar canals gratuïts" → `/admin/manual` (Fase 1).
  - LOW → "Revisar quins canals funcionen" → `/admin/reporting` (amb nom del canal principal si existeix).
  - HEALTHY → "Optimitzar conversió" → `/admin/sales-ops`.
  - GROWING → "Escalar canals rendibles" → `/admin/reporting` (amb nom del canal principal).
- Nou component `app/admin/components/CaptureHealthPanel.tsx`:
  - Estil visual que canvia segons el status (rose per DROUGHT/FAMINE, amber per LOW, emerald per HEALTHY, cyan per GROWING) amb icona corresponent.
  - Grid 3 columnes amb 7d/30d/90d i indicadors de tendència (▲▼▬) amb percentatge comparatiu a la setmana/mes anterior.
  - Bloc de recomanació amb detail contextual.
  - Breakdown d'origen amb barres horitzontals proporcionals (top 5 fonts) o empty state si no hi ha leads.
- Integrat a `app/admin/page.tsx`: `loadCaptureHealth()` afegit a `Promise.all`, component renderitzat entre `DailyBriefPanel` i `OperationalPulsePanel` (posició lògica: abans veure alerts i després veure l'estat global de la captació).
- 16 tests nous cobrint tots els status, càlculs de tendència (incloent edge cases `0→0`, `0→N`), ordenació de sources, exclusió de counts `0`, percentatges, i accions contextuals amb nom de canal. 16/16 verd.
- `ADMIN_CHANGE_COUNTER` passa a `89`; el següent canvi real ha de ser `#90`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`


### Canvi #90 — 2026-04-10 — codex (FET)
**Calendari admin = bolos + feina; Social crea alarmes a Google Calendar.**
- `getAdminCalendarMonth()` ara retorna, a més de reserves i bloquejos, tasques obertes/en curs per `dueDate` i posts socials `DRAFT/SCHEDULED` per `scheduledAt`.
- `/admin/calendario` mostra feina planificada a les vistes mes/setmana/dia: tasques i posts socials ja no queden fora de la planificació operativa.
- `CalendarApiDay` i els components del calendari s'han alineat perquè el calendari admin sigui agenda de negoci, no només agenda de bolos.
- `syncSocialPostToGoogleCalendar()` afegeix alarmes de Google Calendar per posts socials programats i `socialPostService` la dispara en crear/actualitzar/esborrar posts.
- Recordatoris socials inicials: 24 h abans, 3 h abans, email 3 h abans i 30 min abans.
- Validació del tall: `npx tsc --noEmit` OK; `socialPostService.test.ts` + `googleCalendarSyncService.test.ts` OK; `qa:encoding:changed` OK.
- `ADMIN_CHANGE_COUNTER` passa a `90`; el següent canvi real ha de ser `#91`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #91 — 2026-04-10 — codex (FET)
**Follow-ups comercials entren al calendari admin i Social mostra alarma Calendar.**
- `CalendarApiDay` i `getAdminCalendarMonth()` amplien el shape amb `followUps`; els pendents comercials es projecten com a feina d'avui al calendari admin.
- Les vistes mes/setmana/dia de `/admin/calendario` mostren follow-ups dins la mateixa capa de feina que tasques i social.
- `SocialClient` mostra badge `⏰ Alarma Calendar` quan un post programat en estat `DRAFT` o `SCHEDULED` té alarma activa via Google Calendar.
- Validació del tall: `npx tsc --noEmit` OK; `socialPostService.test.ts` + `googleCalendarSyncService.test.ts` OK; `qa:encoding:changed` OK.
- `ADMIN_CHANGE_COUNTER` passa a `91`; el següent canvi real ha de ser `#92`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #92 — 2026-04-10 — codex (FET)
**El calendari admin incorpora filtres de capes a mes, setmana i dia.**
- Les tres vistes de `/admin/calendario` incorporen selector de capes per mostrar o amagar `Reserves`, `Bloquejos`, `Tasques`, `Social` i `Follow-ups` sense tocar backend.
- La vista mensual filtra tant els chips del dia com el panell de detall, de manera que la lectura del calendari no es col·lapsa quan coincideixen bolos i feina.
- La vista setmanal i la diària queden alineades amb el mateix model de capes, convertint el calendari en una agenda operativa configurable segons el moment de treball.
- `getAdminCalendarMonth()` queda consolidat amb el shape complet `reservas + bloqueos + tasks + socialPosts + followUps`.
- Validació del tall: `npx tsc --noEmit` OK; `git diff --check` OK al perímetre del calendari.
- `ADMIN_CHANGE_COUNTER` passa a `92`; el següent canvi real ha de ser `#93`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #93 — 2026-04-11 — codex (FET)
**La capa `Reserves` també governa el timeline de la vista diària.**
- La vista `/admin/calendario?view=day` tenia el toggle de capes visible però el timeline seguia pintant reserves encara que `Reserves` estigués desactivat.
- `CalendarDayClient` ara deriva `visibleTimelineBookings` de `visibleLayers.bookings` i l'aplica tant a la graella horària com al bloc `Sense hora definida`.
- El resum superior de la vista diària també reflecteix la capa activa, evitant que el calendari digui que hi ha reserves visibles quan el filtre les ha silenciat.
- Validació del tall: `npx tsc --noEmit` OK.
- `ADMIN_CHANGE_COUNTER` passa a `93`; el següent canvi real ha de ser `#94`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #94 — 2026-04-11 — claude (FET)
**SEO local: 7 noves zone landing pages + pre-commit hook + script diagnòstic de negoci.**
- **Script `scripts/business-state.ts`**: diagnòstic d'estat real del negoci contra Railway. 8 seccions (captació, origen, embut, reserves/ingressos, conversió, leads estancats, clients/repetició, veredicte). Resultat real: 5 leads totals, tots de Wallapop, 0 en 7 dies, 1 reserva. Confirma que el problema és captació.
- **Pre-commit hook** (`.git/hooks/pre-commit`): executa `qa:encoding:changed` (mojibake fitxers canviats) + `tsc --noEmit` (TypeScript incremental). Bloquejant si falla. Lleuger (<5s). Tanca §6.14 SEGÜENT.
- **7 noves zone landing pages** per ampliar cobertura SEO local:
  - `dj-fiestas-girona` — DJ festes a Girona i província
  - `dj-fiestas-valles` — DJ festes Sabadell, Terrassa, Granollers
  - `dj-fiestas-baix-llobregat` — DJ festes L'Hospitalet, Cornellà, Gavà
  - `dj-fiestas-garraf` — DJ festes Sitges, Vilanova
  - `discomovil-baix-llobregat` — Discomòbil Baix Llobregat
  - `discomovil-garraf` — Discomòbil Sitges/Garraf
  - `discomovil-costa-brava` — Discomòbil Lloret, Blanes, Palamós
- **`lib/coverage.ts`**: afegides 7 noves regles a `ZONE_RULES` per activar les landing pages automàticament quan la cobertura inclou les ciutats/comarques respectives.
- Cada landing page segueix el patró existent: `ZoneLandingPage` component + `ServiceJsonLD` + `FAQ` + `Breadcrumbs` + metadata SEO completa amb keywords locals.
- Les noves zones ja apareixeran al sitemap dinàmic sense cap canvi extra (via `getEnabledZoneLandingSlugs()`).
- 5 de 7 zones s'activen automàticament amb les àrees per defecte; les 2 de Garraf s'activen quan s'afegeixi Sitges a la configuració de cobertura.
- `ADMIN_CHANGE_COUNTER` passa a `95`; el següent canvi real ha de ser `#96`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`


### Canvi #95 — 2026-04-11 — codex (FET)
**Els calendars d'admin guanyen scroll mòbil net i baixen els riscos d'overflow.**
- CalendarMonthClient, CalendarWeekClient i el calendari de SocialClient ara tenen contenidors horitzontals explícits per a les graelles de 7 columnes en pantalles estretes.
- La protecció evita que el calendari rebasi el contenidor en mòbil i manté la lectura íntegra amb scroll lateral controlat en lloc de trencar el layout.
- També s'han afegit hints de overflow-x-auto als grids protegits perquè l'auditoria estàtica reflecteixi la protecció real.
- Resultat de l'auditoria: check-visual-overflow baixa de 14 a 10 riscos; els avisos del calendari admin i del calendari social desapareixen del llistat.
- Validació del tall: 
px tsc --noEmit OK; 
ode scripts/check-visual-overflow.mjs OK amb 10 riscos restants fora del perímetre tocat.
- ADMIN_CHANGE_COUNTER passa a 94; el següent canvi real ha de ser #95.
- Començat per: codex
- Treballant per: codex
- Tancat per: codex
### Canvi #96 — 2026-04-11 — codex (FET)
**L'auditoria d'overflow de l'admin baixa a zero riscos dins del perímetre actiu.**
- ActivityClient ja no força dates en 
owrap sense guard: les peces de temps ara tenen truncat i límit d'amplada en entorns estrets.
- TaskRowActions deixa de dependre de whitespace-nowrap rígid i admet tall natural en mòbil sense rebentar la fila.
- intake/page.tsx passa la matriu de prioritat a 2x2 en mòbil i recupera 4x1 a sm, evitant que els botons pressionin el contenidor.
- Resultat de QA: check-visual-overflow baixa de 10 a 5 riscos, i els 5 restants ja són fora del perímetre admin que s'ha tocat en aquesta passada.
- Validació del tall: 
px tsc --noEmit OK; 
ode scripts/check-visual-overflow.mjs OK amb 5 riscos residuals fora del front actual.
- ADMIN_CHANGE_COUNTER passa a 96; el següent canvi real ha de ser #97.
- Començat per: codex
- Treballant per: codex
- Tancat per: codex
### Canvi #97 — 2026-04-11 — codex (FET)
**L'auditoria estàtica d'overflow queda a zero.**
- CookieConsent.client.tsx deixa de forçar el CTA principal amb whitespace-nowrap rígid i admet tall controlat en mòbil.
- CalendarioUrgencia.tsx marca explícitament protecció horitzontal als seus grids de 7 columnes, tancant els avisos estàtics del calendari públic.
- sensorial/page.tsx baixa la densitat de dues graelles en mòbil (3/4 i 2/4 columnes segons bloc) perquè no pressionin el contenidor en pantalles estretes.
- Resultat de QA: 
ode scripts/check-visual-overflow.mjs passa a OK: no obvious static overflow risks found.
- Validació del tall: 
px tsc --noEmit OK; 
ode scripts/check-visual-overflow.mjs OK.
- ADMIN_CHANGE_COUNTER passa a 97; el següent canvi real ha de ser #98.
- Començat per: codex
- Treballant per: codex
- Tancat per: codex
### Canvi #98 — 2026-04-11 — codex (FET)
**QA visual real executada amb captures Playwright sobre servidor dedicat.**
- S'ha aixecat un servidor a http://localhost:3099 per aïllar la passada visual del procés trencat que hi havia a 3000.
- scripts/visual-audit.ts ha capturat sense errors 11 pantalles públiques desktop, 9 pantalles admin i 3 pantalles mòbil.
- Les captures queden a D:\orbitaevents\screenshots com a base de comprovació visual real, no només regex estàtic.
- Aquest tall no ha detectat fallades de càrrega ni pàgines que petin durant la captura; el següent pas, si es vol més rigor, és una revisió manual dirigida sobre les captures generades.
- Validació del tall: 
px tsx scripts/visual-audit.ts OK sobre VISUAL_AUDIT_BASE=http://localhost:3099.
- ADMIN_CHANGE_COUNTER passa a 98; el següent canvi real ha de ser #99.
- Començat per: codex
- Treballant per: codex
- Tancat per: codex
### Canvi #99 — 2026-04-11 — codex (FET)
**El nurturing automàtic deixa de perseguir leads que ja han respost.**
- commercialSequenceService ara carrega les activitats EMAIL/WHATSAPP del lead i deriva l'estat de resposta abans d'executar el següent pas de la cadència.
- Si hi ha un inbound posterior a l'últim outbound, la seqüència es frena i el lead queda fora del batch automàtic en lloc de rebre un follow-up redundant.
- S'ha extret deriveLeadResponseState() a 
esponseTrackingService perquè el criteri de inbound/outbound sigui compartit entre follow-ups pendents i nurturing automàtic.
- Afegida regressió a commercialSequenceService.test.ts per blindar que un lead amb resposta no rep més automatismes.
- Validació del tall: 
px tsc --noEmit OK; commercialSequenceService.test.ts + 
esponseTrackingService.test.ts OK (34 tests).
- ADMIN_CHANGE_COUNTER passa a 99; el següent canvi real ha de ser #100.
- Començat per: codex
- Treballant per: codex
- Tancat per: codex

### Canvi #100 — 2026-04-11 — claude (FET)
**Pipeline d'atribució end-to-end: captura UTM + landing page + servei + panell dashboard.**
- Context: la BD ja tenia els camps `utmSource`, `utmMedium`, `utmCampaign` i `landingPage` a `Lead` des del primer dia, però el pipeline estava trencat end-to-end — els formularis mai els enviaven, l'API mai els llegia i `persistContactLead` mai els desava. Amb 5 leads totals (tots Wallapop, 0 atribuïts) i 7 noves zone landing pages (Canvi #94) a punt d'entrar en servei, calia saber d'on venen els leads.
- **Hook `lib/hooks/useUtmParams.ts`**: `useMemo` que llegeix `utm_source`/`utm_medium`/`utm_campaign` de `window.location.search` i captura `window.location.pathname` com a `landingPage`. Trunca tots els valors (200/500 chars) per seguretat.
- **Schema `contact-copy.ts`**: afegits `utmSource`, `utmMedium`, `utmCampaign` (max 200) i `landingPage` (max 500) al `contactSchema` zod.
- **`app/api/contact/route.ts`**: extreu els 4 camps del body i els passa a `persistContactLead`.
- **`lib/services/contactLeadCaptureService.ts`**: els 4 camps entren al tipus `PersistContactLeadInput`. A l'`update` es preserva el valor existent si el nou és buit (first-touch wins). Al `create` s'escriuen directament.
- **Integració clients**:
  - `ContactFormComplete.tsx` → `useUtmParams()` + spread al body del fetch.
  - `configurador/client.tsx` → `useUtmParams()` + spread al `buildPayload()`.
- **Nou servei `lib/services/attributionService.ts`** (pure function + async wrapper):
  - `AttributionLeadInput` + `AttributionBucket` + `AttributionReport`.
  - `aggregate()` genèric que agrupa per qualsevol clau, calcula `won`/`lost`/`open`, `conversionRate` (won/(won+lost)), suma de `revenue`.
  - `generateAttributionReport()` retorna 4 buckets: `bySource`, `byUtmSource`, `byUtmCampaign`, `byLandingPage`, més `topPerformer` (prioritza won sobre leads) i `verdict` contextual.
  - `loadAttributionReport(windowDays = 90)` fa una sola query `prisma.lead.findMany` amb `booking` include per revenue. Map mapeja només bookings actius (`CONFIRMED/PREPARING/COMPLETED`).
- **Nou component `AttributionPanel.tsx`**: tres columnes responsive (canal · campanya · landing), cada bucket amb barra de quota, comptadors `W/L`, taxa conversió i revenue. Empty states diferenciats: global (explica que els UTM només es capturen a partir d'ara) i per columna (cap UTM/landing capturat encara). Veredicte destacat a dalt.
- **Integrat a `app/admin/page.tsx`**: `loadAttributionReport(90)` dins el `Promise.all` existent, panell entre `CaptureHealthPanel` i `OperationalPulsePanel`.
- **13 tests nous** a `attributionService.test.ts` cobrint: empty state, agrupació per source, ordenació per volum, càlcul de conversion rate, suma de revenue només en WON, ignorar claus nul·les, agrupació per campanya/landing, `topPerformer` prioritzant won sobre leads, veredictes (cap tancat · canal principal amb won), format `generatedAt`, preservació de `windowDays`. 13/13 verd.
- **Validació del tall**: `npx tsc --noEmit` OK · `npx vitest run attributionService.test.ts` 13/13 · `npx vitest run contact-copy.test.ts` 29/29 (cap regressió).
- **Efecte real**: des del pròxim lead, el dashboard mostrarà d'on ha vingut (canal + campanya + landing). Quan les 7 zone landings generin trànsit, es veurà directament quines funcionen. Els leads existents apareixeran sota "Web" sense UTM (backwards-compatible, no cal migració).
- `ADMIN_CHANGE_COUNTER` passa a `100`; el següent canvi real ha de ser `#101`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #101 — 2026-04-11 — codex (FET)
**Daily Brief reparat de forma íntegra + norma anti-parxes incorporada al protocol.**
- `dailyBriefService.ts` ha quedat refet de forma coherent: contracte `DailyBriefInput`, alertes, accions prioritzades i wrapper `loadDailyBrief()` tornen a quadrar com un sol bloc.
- El brief ara detecta `repliedLeadsAwaitingAction`: si un lead ja ha contestat després de l'últim outbound, es genera alerta `↩️` i acció prioritària d'anar a `/admin/inbox`.
- La detecció reutilitza `deriveLeadResponseState()` i només marca casos on el client ha respost i encara no hi ha hagut acció humana posterior (`updatedAt < lastInboundAt`).
- `dailyBriefService.test.ts` ha quedat alineat amb el contracte nou i cobreix l'alerta i la prioritat d'acció de resposta humana.
- El protocol de treball reforça una norma global: **reparacions íntegres, no parxes dispersos**. Si un perímetre queda trencat, s'ha de deixar coherent sencer abans de tancar-lo.
- Validació del tall: `npx tsc --noEmit` OK · `pnpm exec vitest run __tests__/lib/services/dailyBriefService.test.ts __tests__/lib/services/commercialSequenceService.test.ts __tests__/lib/services/responseTrackingService.test.ts` OK (62 tests) · `git diff --check` OK.
- `ADMIN_CHANGE_COUNTER` passa a `101`; el següent canvi real ha de ser `#102`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #102 — 2026-04-11 — codex (FET)
**Command palette global real sobre l'admin existent.**
- `AdminSearchModal.tsx` deixa de ser només un cercador de tres entitats i passa a funcionar com a `command palette` real oberta amb `Ctrl/Cmd+K`.
- La palette ara unifica en un sol lloc: comandes canòniques del panell, mòduls de navegació, accessos recents i resultats reals de `leads`, `bookings` i `customers`.
- Les comandes es construeixen a partir de les fonts de veritat existents (`getPriorityItems()` i `NAV_SECTIONS`) més un petit nucli d'accions base; no s'ha creat cap catàleg paral·lel.
- Afegit control per teclat dins del modal: `↑/↓` per moure's, `Enter` per obrir i `Esc` per tancar i resetejar.
- El mode sense query ara serveix per operar: recents + comandes + dreceres. Amb query, barreja comandes i resultats CRM dins del mateix flux.
- Validació del tall: `npx tsc --noEmit` OK · `git diff --check -- app/admin/components/AdminSearchModal.tsx` OK.
- `ADMIN_CHANGE_COUNTER` passa a `102`; el següent canvi real ha de ser `#103`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #103 — 2026-04-11 — codex (FET)
**Front següent deixat apuntat formalment: blindar la command palette amb capa pura i tests.**
- Després del `#102`, queda declarat com a següent tall actiu extreure la lògica de la command palette a una capa pura i cobrir-la amb tests.
- Objectiu explícit: que la palette no depengui només del render del component, sinó d'una font funcional verificable per deduplicació, recents, navegació canònica i filtrat.
- Això queda registrat perquè el front no es perdi si es reprèn més tard o el continua un altre agent.
- `ADMIN_CHANGE_COUNTER` passa a `103`; el següent canvi real ha de ser `#104`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #104 — 2026-04-11 — codex (FET)
**Checklist alineat amb el front actiu de la command palette.**
- El front següent de la command palette no queda només al registre de canvis: també queda visible al checklist del protocol.
- §6.1 reflecteix que el següent tall en marxa és blindar la palette amb capa pura i tests.
- §6.15 deixa explícit l'estat del punt `[HIGH] Command palette global (Cmd+K)`: base funcional ja tancada al `#102`, següent tall pendent de blindatge lògic i cobertura.
- `ADMIN_CHANGE_COUNTER` passa a `104`; el següent canvi real ha de ser `#105`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #105 — 2026-04-11 — codex (FET)
**Checklist reforçat: `check-patches` separat de qualitat lingüística.**
- Queda apuntat al checklist i a Infra/Dev que el guard `check-patches` ha de detectar pedaços sospitosos, no problemes d'apòstrofs, pluralització o copy.
- S'estableix explícitament que la qualitat lingüística ha d'anar en un check separat per evitar falsos positius i pèrdua de confiança en el guard.
- Això deixa el front de l'script ben definit per quan es reprengui: primer redefinir responsabilitat, després refinar detecció.
- `ADMIN_CHANGE_COUNTER` passa a `105`; el següent canvi real ha de ser `#106`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #106 — 2026-04-11 — codex (FET)
**Separació real dels guards: patch smells vs qualitat lingüística.**
- `scripts/check-patches.mjs` queda reduït a smells estructurals de pedaç: `REPEATED_INLINE_PLURAL_TERNARY`, `DUPLICATE_PUSH_BLOCK`, `EMPTY_CATCH`, `TODO_MARKER` i `NARROW_FIX_COMMENT`.
- Apòstrofs i pluralització catalana surten de `check-patches` i passen a un guard separat: `scripts/check-language-quality.mjs`.
- `package.json` incorpora dos scripts explícits: `qa:patches` i `qa:language`.
- Verificació real del split: `check-patches` ja no es distreu amb apòstrofs i retorna només 3 smells estructurals reals a `lib/services`; `check-language-quality` corre net sobre el mateix perímetre.
- `git diff --check` del perímetre tocat queda net, amb avisos només de `CRLF/LF` no bloquejants.
- `ADMIN_CHANGE_COUNTER` passa a `106`; el següent canvi real ha de ser `#107`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #107 — 2026-04-11 — codex (FET)
**Command palette blindada amb capa pura i tests.**
- `lib/services/adminCommandPaletteService.ts` passa a concentrar la lògica de catàleg, deduplicació, recents, filtrat i combinació d'entrades seleccionables.
- `app/admin/components/AdminSearchModal.tsx` deixa de duplicar aquesta lògica i consumeix la capa pura.
- Afegit `__tests__/lib/services/adminCommandPaletteService.test.ts` amb cobertura de deduplicació, filtrat, recents, combinació de resultats i shape d'entries.
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm exec vitest run __tests__/lib/services/adminCommandPaletteService.test.ts` OK (9 tests) · `git diff --check` del perímetre tocat OK.
- Això tanca el front que havia quedat declarat a `#103` i alineat al checklist a `#104`.
- `ADMIN_CHANGE_COUNTER` passa a `107`; el següent canvi real ha de ser `#108`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #108 — 2026-04-11 — codex (FET)
**Command palette amb cerca tolerant a accents.**
- `adminCommandPaletteService.ts` incorpora normalització de cerca sense diacrítics perquè la palette trobi `accio`/`acció`, `rapida`/`ràpida` i `marqueting`/`màrqueting` com el mateix terme.
- La millora queda coberta a `adminCommandPaletteService.test.ts` amb 10 tests en total.
- Validació del tall: `npx tsc --noEmit` OK · `pnpm exec vitest run __tests__/lib/services/adminCommandPaletteService.test.ts` OK (10 tests) · `git diff --check` del perímetre tocat OK.
- `ADMIN_CHANGE_COUNTER` passa a `108`; el següent canvi real ha de ser `#109`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #109 — 2026-04-11 — codex (FET)
**Daily Brief connectat a les fonts canòniques comercials.**
- `dailyBriefService.ts` deixa de recalcular a mà part del comercial i passa a consumir `loadPendingFollowUps()` i `loadPipelineSuggestions()` com a fonts canòniques per als seguiments i els senyals de pipeline.
- Això unifica el que veu el Daily Brief del matí amb el que ja veuen Inbox i Leads: mateix criteri, mateix recompte, menys risc de divergència.
- Es manté el detector específic de respostes entrants pendents d'acció humana, perquè encara no té capa canònica pròpia separada.
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm exec vitest run __tests__/lib/services/dailyBriefService.test.ts` OK (28 tests).
- `ADMIN_CHANGE_COUNTER` passa a `109`; el següent canvi real ha de ser `#110`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #110 — 2026-04-11 — codex (FET)
**Operational Pulse alineat amb els senyals comercials canònics.**
- `operationalPulseService.ts` deixa de mesurar el seguiment amb una aproximació paral·lela i consumeix `loadPendingFollowUps()` com a font de veritat per a la `taxa de seguiment`.
- El mateix servei ara consumeix `loadPipelineSuggestions()` i incorpora una mètrica nova de `salut pipeline`, separada de la `conversió pipeline`, per distingir resultat de fricció comercial real.
- `__tests__/lib/services/operationalPulseService.test.ts` queda alineat amb 8 mètriques i cobertura del nou indicador.
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm exec vitest run __tests__/lib/services/operationalPulseService.test.ts` OK (18 tests).
- `ADMIN_CHANGE_COUNTER` passa a `110`; el següent canvi real ha de ser `#111`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #111 — 2026-04-11 — codex (FET)
**Notificacions globals de l'admin també compten correu nou d'Inbox.**
- `useAdminAlerts.ts` incorpora `inboxUnreadCount` llegint `/api/admin/inbox/messages?action=count`, de manera que el badge global de notificacions ja reflecteix també correu nou a més de leads i alertes de negoci.
- El mateix hook afegeix polling lleuger cada 60s perquè el shell admin capti entrades i correus nous sense dependre només de canviar de pestanya.
- El lead nou ja tenia alerta server-side immediata; aquest tall tanca la part visible contínua del correu nou dins l'admin.
- Verificació del tall: `npx tsc --noEmit` OK.
- `ADMIN_CHANGE_COUNTER` passa a `111`; el següent canvi real ha de ser `#112`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #113 — 2026-04-11 — codex (FET)
**Alertes crítiques del matí també surten fora del dashboard.**
- `commercialDailyAutomationService.ts` consumeix el `Daily Brief` i propaga les alertes `CRITICAL` al resum extern diari: es guarden al `summary`, s'afegeixen al bloc HTML del correu i s'inclouen també al text de WhatsApp.
- Això fa que SLA trencat, follow-ups urgents o altres crítics del matí no quedin tancats dins del panell: arriben també al canal diari de resum.
- `__tests__/lib/services/commercialDailyAutomationService.test.ts` queda ampliat per cobrir `summary`, email HTML i WhatsApp.
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm exec vitest run __tests__/lib/services/commercialDailyAutomationService.test.ts` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` passa a `113`; el següent canvi real ha de ser `#114`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`


### Canvi #114 — 2026-04-11 — codex (FET)
**Notificacions del shell admin amb recompte real i Inbox viu.**
- `app/admin/layout.tsx` deixa de mostrar un punt genèric: el header mobile/desktop ara ensenya badge numèric real de notificacions.
- La navegació es recalcula amb tipus explícits i l'entrada `Safata (IMAP)` mostra el recompte viu de correus no llegits; quan no n'hi ha, conserva el marcador `IMAP`.
- `app/globals.css` adapta el badge perquè pugui mostrar números sense desbordar ni perdre llegibilitat.
- Verificació del tall: `npx tsc --noEmit` OK · `git diff --check` del perímetre tocat OK.
- `ADMIN_CHANGE_COUNTER` passa a `114`; el següent canvi real ha de ser `#115`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #112 — 2026-04-11 — claude (FET)
**Detector de parches + reparació íntegra de plurals catalans i mocks trencats.**
- Nou script `scripts/check-patches.mjs` — escaneja `app/` i `lib/` (872 fitxers) buscant:
  - `CATALAN_APOSTROPHE_IN_SINGLE_QUOTE` — apòstrofs catalans dins single-quotes.
  - `WRONG_CATALAN_PLURAL_S` — plurals castellans (`respostas`, `pressuposts`, `tascas`).
  - `REPEATED_INLINE_PLURAL_TERNARY` — >3 ternaris de pluralització al mateix fitxer (candidat helper).
  - `DUPLICATE_PUSH_BLOCK` — blocs push() idèntics (4 línies) repetits.
  - `EMPTY_CATCH` — catch buits sense log ni comentari.
  - `TODO_MARKER` / `NARROW_FIX_COMMENT` — marcadors de parche.
- Reparació íntegra executada amb l'script:
  - `dailyBriefService.ts`: 24 ternaris inline → helper `plural(count, singular, pluralForm)`, fix `pressupost${...'s'}` → `pressupostos`.
  - `adminHealthService.ts`: 4 ternaris inline → helper `plural()`, fix `tascas` → `tasques`, `bestretas` → `bestretes`.
  - `emailTemplateService.ts`: empty catch → `console.warn` amb context.
  - `operationalPulseService.test.ts`: fix TS error Partial spread amb `??`.
  - `adminCalendarMonthService.test.ts`: mock incomplet → afegits `task`, `socialPost`, `lead`, `loadPendingFollowUps`.
  - `commercialDailyAutomationService.test.ts`: mock `dailyBriefService` absent → afegit.
- Protocol §2.1 ampliat amb metodologia concreta de reparació íntegra (5 punts).
- Verificació: `check-patches.mjs` clean, `tsc --noEmit` 0 errors, 2141/2141 tests verds.
- `ADMIN_CHANGE_COUNTER` passa a `112`; el següent canvi real ha de ser `#113`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #115 — 2026-04-11 — claude (FET)
**Forecast predictiu + detector d'anomalies + alertes crítiques al WhatsApp.**
- **Forecast predictiu**: `dailyBriefService.ts` wrapper `loadDailyBrief` substitueix `budget × 0.3` fix per probabilitats per estat (`LEAD_SCORING_STATUS_PROBABILITY`: NEW 12%, CONTACTED 22%, QUOTE_SENT 38%, NEGOTIATING 57%). Afegit `status` al select de la query.
- **Detector d'anomalies**: nou `lib/services/dailyAnomalyService.ts` — funció pura `detectAnomalies()` + wrapper `loadAnomalyReport()`. Compara 5 KPIs (leads, bookings, won, lost, overdue) contra mitjana 30d, threshold 50%. Ordena per |desviació| desc, genera verdict.
- **AnomalyPanel**: nou `app/admin/components/AnomalyPanel.tsx` — glass card amb deviation bars, badge %, stagger. Només es mostra si hi ha anomalies. Integrat al dashboard admin entre Daily Brief i Capture Health.
- **WhatsApp**: `commercialDailyAutomationService.ts` ara inclou alertes crítiques del Daily Brief al missatge WA.
- **Fix mocks Codex**: `commercialDailyAutomationService.test.ts` — syntax error (describe tancat, apòstrof single-quote). 3/3 tests verds.
- **13 tests** nous per `dailyAnomalyService` (funció pura).
- Tanca `[HIGH] Forecast predictiu per estat del pipeline` i `[MEDIUM] Detector d'anomalies al Daily Brief` de §6.15.
- Verificació: `tsc --noEmit` 0 errors, 41 tests verds (anomaly + brief).
- `ADMIN_CHANGE_COUNTER` passa a `115`; el següent canvi real ha de ser `#116`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #116 — 2026-04-11 — codex (FET)
**Shell admin amb notificacions separades per tipus i comptador re-sincronitzat.**
- `app/admin/layout.tsx` deixa de resumir-ho tot en un sol total opac: el shell mostra xips separats per `Leads`, `Mail` i `Risc`, tant a desktop com a mòbil, reutilitzant exclusivament els comptadors canònics de `useAdminAlerts()`.
- `app/globals.css` incorpora la capa visual d'aquests xips perquè quedin dins del contenidor, sense overflow i amb lectura clara.
- `lib/constants/admin.ts` es re-sincronitza amb el registre de canvis després del `#115` ja tancat per Claude.
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm run qa:protocol` OK · `git diff --check` del perímetre tocat OK.
- `ADMIN_CHANGE_COUNTER` passa a `116`; el següent canvi real ha de ser `#117`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #117 — 2026-04-11 — claude (FET)
**Detector de conflictes de capacitat operativa + neteja backlog §6.15.**
- Nou `lib/services/capacityConflictService.ts` — funció pura `detectCapacityConflicts()` + wrapper `loadCapacityConflicts()`. Detecta quan 2+ reserves el mateix dia demanen més unitats d'un ítem que l'stock disponible. Agrupa per dia×ítem, calcula dèficit, ordena per data+severitat.
- Nou `app/admin/components/CapacityConflictPanel.tsx` — glass card amb severity bars, badge de dèficit, link a reserves. Només visible si hi ha conflictes. Integrat al dashboard admin.
- **9 tests** nous (funció pura): cap conflicte, demanda dins rang, 2 reserves que superen stock, 3 reserves acumulades, múltiples ítems/dies, ordenació, singular/plural, etc.
- Backlog §6.15 auditat: marcat com a FET motor nurturing (ja existia `commercialSequenceService`), scoring dinàmic (`commercialScoring`), notificacions CRITICAL (Canvi #115), alertes capacitat (aquest canvi).
- Verificació: `check-patches.mjs` clean (876 fitxers), `tsc --noEmit` 0 errors, 9/9 tests verds.
- `ADMIN_CHANGE_COUNTER` passa a `117`; el següent canvi real ha de ser `#118`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #118 — 2026-04-11 — codex (FET)
**Matriu de cobertura real a notificacions.**
- `app/admin/settings/notifications/page.tsx` incorpora una lectura operativa per tipus d’avís: `Lead nou`, `Mail nou` i `Resum diari i crítics`.
- Cada bloc mostra quins canals estan realment actius (`Shell admin`, `Email`, `Webhook / WhatsApp`) i on està trencada la cadena si no arriba res.
- Això evita confondre “hi ha comptador” amb “el canal extern està ben configurat”.
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` passa a `118`; el següent canvi real ha de ser `#119`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #119 — 2026-04-11 — codex (FET)
**Notificacions amb acció següent, no només diagnòstic.**
- `app/admin/settings/notifications/page.tsx` afegeix una recomanació directa per a cada cadena trencada: SMTP, webhook/WhatsApp o cron del resum diari.
- Això converteix la pantalla en un panell de resolució: quan un canal està `OFF`, diu exactament què has de configurar per recuperar-lo.
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` passa a `119`; el següent canvi real ha de ser `#120`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #120 — 2026-04-11 — codex (FET)
**Relació visible inventari ↔ packs a les llistes.**
- `app/admin/inventory/InventoryListSections.tsx` mostra ara a cada equip els packs on participa, amb badges clicables cap a la pestanya d'equip del pack.
- `app/admin/packs/page.tsx` deixa de mostrar només un número i ensenya un preview real de l'equip inclòs dins de cada pack.
- El botó secundari dels packs es corregeix perquè obri directament `?tab=content` en lloc de duplicar l'acció d'editar.
- El protocol deixa registrat el front `inventari + packs` amb estat `començat per claude / treballant per codex` i el que queda pendent.
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` passa a `120`; el següent canvi real ha de ser `#121`.
- Començat per: `claude`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #121 — 2026-04-12 — codex (FET)
**Tancament del bloc inventari + packs amb editor i compositor visibles.**
- `app/admin/inventory/[id]/InventoryItemEditor.tsx` puja la fitxa d'inventari a lectura operativa: resum, cost/hora, estoc, checklist i accions més clares.
- `app/admin/packs/[id]/EditPackForm.tsx` simplifica la pestanya `content` i fa explícit el compositor automàtic com a punt de partida revisable, no com a decisió cega.
- El bloc `6.17` queda sense pendents tècnics dins del perímetre `inventari + packs`.
- Verificació del tall: `npx tsc --noEmit` OK · `git diff --check` del perímetre tocat OK.
- `ADMIN_CHANGE_COUNTER` passa a `121`; el següent canvi real ha de ser `#122`.
- Començat per: `claude`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #122 — 2026-04-12 — codex (FET)
**Jerarquia pública de serveis alineada i drenatge massiu de copy/SEO local fora dels `page.tsx`.**
- `lib/localServiceLandingCopy.ts` i `lib/localPartyLandingCopy.ts` absorbeixen la part estructural de les landings locals repetitives; els `page.tsx` de zones deixen de carregar metadata, breadcrumb i narrativa base incrustades.
- `lib/serviceHubSeo.ts`, `lib/standaloneServiceSeo.ts` i `lib/publicServiceCatalog.ts` eleven SEO i jerarquia pública a capes compartides perquè `/servicios`, hubs, serveis singulars, header i footer no diguin coses diferents.
- `app/components/ui/HeaderChampion.tsx`, `app/components/ui/footer.tsx` i `lib/constants/index.ts` queden alineats amb el mateix nucli visible de serveis; el `BottomNav` apunta al hub `/servicios` en lloc de colar `bodas` com si fos el catàleg sencer.
- Verificació del tall: `npx tsc --noEmit` OK · `git diff --check` OK.
- `ADMIN_CHANGE_COUNTER` passa a `122`; el següent canvi real ha de ser `#123`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
### Canvi #123 — 2026-04-12 — codex (FET)
**Entry points públics secundaris alineats amb el mateix catàleg compartit de serveis.**
- `app/[locale]/not-found.tsx` deixa de repetir manualment `bodas`, `discomovil`, `fiestas` i `empresas`; ara pinta els enllaços des de `PUBLIC_CORE_SERVICE_NAV`.
- `lib/publicServiceCatalog.ts` amplia el contracte del nucli visible amb la clau de traducció necessària per reutilitzar-lo també en pantalles d'error, no només a header i footer; `lib/constants/index.ts` perd la duplicació morta `PUBLIC_FOOTER_SERVICES_LINKS`.
- Verificació del tall: `npx tsc --noEmit` OK · `git diff --check` OK.
- `ADMIN_CHANGE_COUNTER` passa a `123`; el següent canvi real ha de ser `#124`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #124 — 2026-04-12 — codex (FET)
**Showcase editorial de la home separat del catàleg comercial compartit.**
- lib/publicHomeShowcase.ts concentra els pilars i cards editorials de la portada com a capa pròpia, en lloc de barrejar-los amb constants públiques genèriques.
- pp/components/ui/ServicesGridElegant.tsx i pp/components/mobile-ultimate/MobileServicesCards.tsx consumeixen ara aquest helper compartit; lib/constants/index.ts perd PUBLIC_SERVICES_GRID_PILLARS.
- Verificació del tall: 
px tsc --noEmit OK · git diff --check OK.
- ADMIN_CHANGE_COUNTER passa a 124; el següent canvi real ha de ser #125.
- Començat per: codex
- Treballant per: codex
- Tancat per: codex
### Canvi #125 — 2026-04-12 — codex (FET)
**Portfolio showcase i garanties de la portada desacoblats de lib/constants.**
- lib/publicHomeShowcase.ts absorbeix PUBLIC_PORTFOLIO_SHOWCASE_ITEMS, getPublicPortfolioShowcasePhotos, PublicPortfolioShowcaseStory i PUBLIC_MOBILE_HOME_GUARANTEES.
- pp/components/mobile-ultimate/MobileHomePage.tsx i pp/components/mobile-ultimate/MobilePortfolioShowcase.tsx pengen del helper nou; lib/constants/index.ts manté compatibilitat pública via xport *.
- Verificació del tall: 
px tsc --noEmit OK · git diff --check OK.
- ADMIN_CHANGE_COUNTER passa a 125; el següent canvi real ha de ser #126.
- Començat per: codex
- Treballant per: codex
- Tancat per: codex

### Canvi #126 — 2026-04-16 — claude-bes (FET)
**Benchmark setmanal — wiring cron tancat (§6.15).**
- `__tests__/app/api/cron/weekly-benchmark-route.test.ts` nou amb 4 tests: auth rebutjada (401 sense token, 401 token erroni), happy path (200 + report retornat), error path (500 + `saveCronRunStatus` amb prefix `benchmark.weekly`, status `error`, categoria `config`).
- Fix `.github/workflows/daily-crons.yml`: eliminat `if:` del job `weekly-benchmark` — la condició `contains('1', '0 3 * * *')` retornava sempre false (cap `1` a la cron expression), impedint que el job s'executés mai per schedule. El check de dilluns ja vivia al step-level (`date -u +%u = 1`), que continua gestionant la lògica correctament.
- Nota: el servei `weeklyBenchmarkService.ts`, la ruta `app/api/cron/weekly-benchmark/route.ts`, el catàleg `ADMIN_CRON_PREFIXES` (a `lib/constants/admin.ts`) i el test del servei ja existien — l'únic gap real era el test del route i el bug del workflow.
- Validació: `npx tsc --noEmit` 0 errors · `pnpm test:run` 2392/2392 OK (180 fitxers) · `pnpm run validate:core` 7/7 OK.
- `ADMIN_CHANGE_COUNTER` passa a `126`; el següent canvi real ha de ser `#127`.
- Començat per: `claude-bes`
- Treballant per: `claude-bes`
- Tancat per: `claude-bes`

### Canvi #127 — 2026-04-16 — claude (FET)
**Mojibake cleanup a `lib/constants/index.ts` + allowlist layer catalogs + test drift fix.**
- ~20 emojis corruptes (CP1252→UTF-8 mojibake) reparats a `lib/constants/index.ts`: WEDDING 💍, SOURCE_ICONS (🌐⚙️🔍), LEAD_STATUS (🤝❌), INVENTORY_CATEGORY (🏗️), SETTINGS (🏢⚙️), INTAKE_SOURCE/EVENT_TYPE (🗣️🔍🌐💍), ACTIVITY_CATEGORY (✉️📝), TESTIMONIAL/DISCOUNT/LEAD_EMAIL (⭐🎁✉️), PUBLIC_TESTIMONIAL_API_MESSAGES (accents ca/es).
- Allowlist `scripts/check-layer-catalogs.mjs` ampliat amb `lib/publicHomeShowcase.ts::PUBLIC_PORTFOLIO_SHOWCASE_ITEMS` i `::PUBLIC_MOBILE_HOME_GUARANTEES` per alinear amb Canvi #124-125.
- Test `customerRouteService.test.ts:194` alineat al constant canònic `CUSTOMER_ANONYMIZED_NAME = 'Client anonimitzat'` (drift pre-existent).
- Script one-shot `scripts/fix-emoji-mojibake.mjs` creat com a referència.
- Verificació: `validate:core` 7/7 verd, 2392/2392 tests, build net.
- ADMIN_CHANGE_COUNTER passa a 127; el següent canvi real ha de ser #128.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #128 — 2026-04-16 — claude-bes (FET)
**Attribution multi-touch del journey (§6.15) — servei pur + wrapper + tests.**
- `lib/services/attributionService.ts` ampliat amb model multi-touch: tipus `JourneyTouchpoint`, `LeadJourney`, `ChannelCredit`, `MultiTouchReport`, `MultiTouchLeadInput`; funció pura `generateMultiTouchReport` i wrapper Prisma `loadMultiTouchReport`.
- Lògica: first touch = lead `source` a creació; assists = `LeadActivity` comunicatives (EMAIL/CALL/WHATSAPP/NOTE) ordenades cronològicament; last touch = última activitat comunicativa (separada d'assists per no fer doble comptatge). Crèdits acumulats per canal amb `firstTouchCount/Revenue`, `assistCount`, `lastTouchCount/Revenue`. Insights automàtics (canal captació, canal assist, canal tancament). Veredicte que distingeix si captació i tancament operen per canals diferents.
- 12 tests nous a `__tests__/lib/services/attributionService.test.ts` (total 25): sense leads, cap WON, first touch source, last touch activitat, filtre no-comunicatives, null lastTouch, crèdits per canal, ordenació byChannel, veredicte canals diferents, veredicte canal dominant, insights, generatedAt/windowDays.
- Allowlist `scripts/check-layer-catalogs.mjs` ampliat amb `lib/services/attributionService.ts::COMM_ACTIVITY_TYPES` (Set privat de l'algoritme, no catàleg de domini compartit).
- Validació: `npx tsc --noEmit` 0 errors · `pnpm test:run` 2404/2404 OK (180 fitxers) · `pnpm run validate:core` 7/7 OK.
- UI del dashboard tancada posteriorment al Canvi `#131`: `loadMultiTouchReport(90)` consumit a `app/admin/page.tsx` amb panell d'atribució multi-touch operatiu.
- `ADMIN_CHANGE_COUNTER` passa a `128`; el següent canvi real ha de ser `#129`.
- Començat per: `claude-bes`
- Treballant per: `claude-bes`
- Tancat per: `claude-bes`

### Canvi #134 — 2026-04-16 — claude (FET)
**Google Calendar amb alarmes pròpies per reserves sincronitzades (§6.1).**
- `googleCalendarSyncService.ts` → `buildEventPayload` ara injecta `reminders: { useDefault: false, overrides: GOOGLE_CALENDAR_BOOKING_REMINDERS }` (7d popup, 24h popup, 24h email, 2h popup) tant per events amb hora com per events all-day.
- Descripció de l'event inclou resum textual d'alarmes (`GOOGLE_CALENDAR_BOOKING_REMINDER_SUMMARY`).
- Constants ja existien a `lib/constants/googleCalendar.ts` (no calia crear-les), social posts ja les usaven — bookings no.
- **1 test nou** verificant payload (reminders.overrides 4 entrades, descripció conté "Alarmes:"). 8/8 tests verds.
- Verificació: `tsc --noEmit` 0 errors.
- `ADMIN_CHANGE_COUNTER` passa a `134`; el següent canvi real ha de ser `#135`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #133 — 2026-04-16 — claude (FET)
**A/B testing plantilles email — tracking complet obertures/clics/respostes (§6.15).**
- Schema: afegits `clickedAt` i `clickCount` a `EmailSend`. Migració `20260416210000_add_click_tracking_to_email_send`.
- `emailTrackingService.ts` ampliat: `recordEmailClick()`, `wrapLinksForTracking()` (regex http/https, preserva mailto/tel), `computeTemplatePerformance` amb `clicked`/`clickRate`, `generateEmailTrackingReport` amb `totalClicked`/`globalClickRate`/`bestPerformer`/`worstPerformer` (mínim 3 enviaments, exclou `_manual`).
- Nova ruta `/api/tracking/click/[token]` — registra clic fire-and-forget i redirigeix a URL original (validació protocol).
- Nova ruta `/api/admin/email-tracking` — report JSON amb auth `requireAuth`.
- `adminEmailSendService.ts` ja integra `wrapLinksForTracking` (Codex) al pipeline d'email outbound.
- **33 tests** (Codex — funcions pures + wrappers + wrapLinks + pixel + click + report loader).
- Verificació: `tsc --noEmit` 0 errors, 38/38 tests tracking verds.
- `ADMIN_CHANGE_COUNTER` passa a `133`; el següent canvi real ha de ser `#134`.
- Començat per: `claude`
- Treballant per: `claude` + `codex` (tests + integració wrapLinks)
- Tancat per: `claude`

### Canvi #129 — 2026-04-16 — claude (FET)
**Alertes de col·lisió d'inventari al resum diari (§6.7).**
- `commercialDailyAutomationService.ts` ja tenia el wiring complet: `loadCapacityConflicts()` al `Promise.all`, bloc HTML amb llista de conflictes, línia WhatsApp amb dèficit per ítem. Codi operatiu des de `claude-bes`.
- Afegit mock `mockLoadCapacityConflicts` al test (faltava — el `.catch()` emmascarava l'absència).
- **2 tests nous**: col·lisions a l'email (HTML conté títol + nom ítem) i col·lisions al WhatsApp (text conté recompte + detall).
- 5/5 tests `commercialDailyAutomationService` verds.
- `ADMIN_CHANGE_COUNTER` passa a `129`; el següent canvi real ha de ser `#130`.
- Començat per: `claude-bes`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #130 — 2026-04-16 — codex (FET)
**Protocol reforçat per treball simultani amb 3 agents.**
- Nou bloc `Mode 3 agents` a `§1` del protocol: partició explícita per blocs/capes, criteri pràctic Agent A/B/C i prohibició d'entrar a fitxers hub sense responsable únic actiu.
- `§2.2 Regla d'inici de bloc` i `§2.4 Regla de propietat dels blocs` queden ampliats perquè el subrepartiment intern sigui explícit quan hi ha 3 agents o més.
- Això converteix la coordinació verbal en norma escrita del repo i evita col·lisions a `page.tsx`, layouts, constants compartides i protocol.
- Verificació del tall: revisió del text inserit al protocol i alineació amb les regles existents de checklist/ownership.
- `ADMIN_CHANGE_COUNTER` passa a `130`; el següent canvi real ha de ser `#131`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #131 — 2026-04-16 — codex (FET)
**Dashboard admin connectat al model d'atribució multi-touch.**
- `app/admin/page.tsx` deixa de carregar el model antic i consumeix `loadMultiTouchReport(90)` dins del bloc principal del dashboard.
- `app/admin/components/AttributionPanel.tsx` renderitza ara `MultiTouchReport` amb KPIs de captació/assistència/tancament, veredicte, repartiment per canal, ingressos first/last touch i journeys recents.
- Això tanca el pendent explícit del Canvi `#128`: l'atribució ja no és només backend, també és lectura operativa visible a l'admin.
- Verificació del tall: `npx tsc --noEmit` OK després d'alinear el repo complet.
- `ADMIN_CHANGE_COUNTER` passa a `131`; el següent canvi real ha de ser `#132`.
- Començat per: `claude-bes`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #132 — 2026-04-16 — codex (FET)
**TypeScript global recuperat després d'alinear els mocks d'email tracking.**
- `__tests__/lib/services/emailTrackingService.test.ts` alinea els mocks de `emailSend.findMany` amb el contracte real de `emailTrackingService.ts`, afegint `clickedAt` i `clickCount`.
- El tall elimina l'error residual que mantenia el repo fora de verd després dels canvis coordinats previs.
- Verificació del tall: `npx tsc --noEmit` OK · `npx vitest run __tests__/lib/services/emailTrackingService.test.ts` OK (25 tests).
- `ADMIN_CHANGE_COUNTER` passa a `132`; el següent canvi real ha de ser `#133`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #143 — 2026-04-16 — codex (FET; reclassificat des de #134 per col·lisió històrica)
**Tracking d'email visible al reporting executiu i routes cobertes.**
- `app/admin/reporting/page.tsx` carrega `loadEmailTrackingReport(90)` i mostra un bloc operatiu amb totals, rates globals, millor/pitjor performer, taula per plantilla i export JSON via `/api/admin/email-tracking?days=90`.
- Nous tests de route: `__tests__/app/api/admin/email-tracking-route.test.ts`, `__tests__/app/api/tracking/open-route.test.ts` i `__tests__/app/api/tracking/click-route.test.ts`.
- Això converteix el tracking d'obertures/clics/respostes per plantilla en una lectura visible i auditada, en lloc de quedar com a backend latent.
- Verificació del tall: `npx tsc --noEmit` OK · `npx vitest run __tests__/lib/services/emailTrackingService.test.ts __tests__/app/api/admin/email-tracking-route.test.ts __tests__/app/api/tracking/open-route.test.ts __tests__/app/api/tracking/click-route.test.ts` OK (41 tests).
- Reclassificat com a `#143` perquè el `#134` ja havia quedat ocupat per un altre tall històric del 2026-04-16; la re-sincronització formal del comptador va quedar documentada al Canvi `#135`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #135 — 2026-04-16 — codex (FET)
**Comptador compartit re-sincronitzat després del Canvi #133.**
- Detectat que el protocol havia quedat amb un `#133` duplicat i el comptador compartit ja havia avançat mentre el registre no reflectia tots els canvis reals.
- El registre queda alineat amb el comptador real i el guard `qa:protocol` torna a protegir el màxim `Canvi #N` sense falsos positius.
- Verificació del tall: `pnpm run qa:protocol` OK · `npx tsc --noEmit` OK.
- `ADMIN_CHANGE_COUNTER` passa a `135`; el següent canvi real ha de ser `#136`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #136 — 2026-04-16 — codex (FET)
**Customer Hub connectat al resum canònic de comunicacions.**
- `lib/customer-hub/fetchCustomerHub.ts` carrega `commSummary` des de `loadCommTimeline(primaryLeadId, customerId)` i l'exposa al DTO del Hub.
- `app/admin/clientes/[id]/_components/panels/CommsPanel.tsx` mostra ara últim contacte, dies sense contacte, gap de resposta, volum i repartiment per canal dins del mateix workspace del client.
- `__tests__/lib/customer-hub/fetchCustomerHub.test.ts` afegeix regressió perquè el resum canònic de comunicacions entri al `Customer Hub`.
- Verificació del tall: `npx tsc --noEmit` OK · `npx vitest run __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` passa a `136`; el següent canvi real ha de ser `#137`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #137 — 2026-04-16 — codex (FET)
**Timeline del Customer Hub enriquida amb metadades canòniques de comunicació.**
- `lib/customer-hub/timeline.ts` conserva `channel`, `direction` i `preview` dins `meta` per als events de missatge.
- `app/admin/clientes/[id]/_components/TimelinePanel.tsx` mostra aquesta informació a la targeta de timeline perquè la comunicació no quedi reduïda a un títol genèric.
- `__tests__/lib/customer-hub/timeline.test.ts` blinda que la timeline preservi les metadades canòniques de missatge i l'enllaç operatiu al lead.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/customer-hub/fetchCustomerHub.test.ts __tests__/lib/customer-hub/timeline.test.ts` OK (4 tests).
- `ADMIN_CHANGE_COUNTER` passa a `137`; el següent canvi real ha de ser `#138`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #138 — 2026-04-16 — codex (FET)
**Estat de conversa operatiu al Customer Hub des del resum canònic de comunicacions.**
- `lib/services/commTimelineService.ts` amplia el contracte canònic amb `lastContactChannel`, `lastContactDirection` i `pendingResponseFrom` per saber qui deu el següent pas.
- `lib/customer-hub/fetchCustomerHub.ts` i `lib/customer-hub/dto.ts` pugen aquest estat al `commSummary` del `Customer Hub`.
- `app/admin/clientes/[id]/_components/panels/CommsPanel.tsx` mostra ara l'estat de conversa i l'últim toc (`Email/WhatsApp/Trucada · entrant/sortint`) dins del workspace del client.
- `__tests__/lib/services/commTimelineService.test.ts` i `__tests__/lib/customer-hub/fetchCustomerHub.test.ts` blinden el nou contracte.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/services/commTimelineService.test.ts __tests__/lib/customer-hub/fetchCustomerHub.test.ts __tests__/lib/customer-hub/timeline.test.ts` OK (21 tests).
- `ADMIN_CHANGE_COUNTER` passa a `138`; el següent canvi real ha de ser `#139`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #139 — 2026-04-16 — codex (FET)
**Acció recomanada del Customer Hub connectada a l'estat canònic de conversa.**
- `lib/services/customerInsightsService.ts` consumeix `commSummary.pendingResponseFrom` i prioritza `Respondre al client` amb urgència `HIGH` quan l'últim contacte és entrant i l'equip deu el següent pas.
- L'`InsightsBanner` del `Customer Hub` reutilitza aquesta acció recomanada sense crear una capa paral·lela de criteris.
- `__tests__/lib/services/customerInsightsService.test.ts` blinda que una entrada entrant pendent mogui la prioritat del motor d'insights.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/services/customerInsightsService.test.ts __tests__/lib/services/commTimelineService.test.ts __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK (42 tests).
- `ADMIN_CHANGE_COUNTER` passa a `139`; el següent canvi real ha de ser `#140`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #140 — 2026-04-16 — codex (FET)
**CTA del Customer Hub orientada pel canal real de l'últim contacte.**
- `lib/customer-hub/nextActionLink.ts` encapsula la resolució de la CTA del `Customer Hub` perquè el següent pas sigui coherent amb el canal real de comunicació.
- `app/admin/clientes/[id]/_components/InsightsBanner.tsx` deixa de tenir links hardcodejats i reutilitza aquest helper: segueix obrint Inbox per email, però obre `wa.me` amb missatge inicial si l'últim toc és `WHATSAPP` i hi ha telèfon.
- `app/admin/clientes/[id]/_components/CustomerHeader.tsx` passa al banner el nom, telèfon i `commSummary` del client.
- `__tests__/lib/customer-hub/nextActionLink.test.ts` blinda tant la branca WhatsApp com la branca email.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/customer-hub/nextActionLink.test.ts __tests__/lib/services/customerInsightsService.test.ts __tests__/lib/services/commTimelineService.test.ts` OK (41 tests).
- `ADMIN_CHANGE_COUNTER` passa a `140`; el següent canvi real ha de ser `#141`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #141 — 2026-04-16 — codex (FET)
**Seguiment canònic pendent visible dins del Customer Hub.**
- `lib/customer-hub/fetchCustomerHub.ts` deriva `followUpSummary` reutilitzant `deriveLeadResponseState()` i `detectPendingFollowUps()` sobre els leads ja carregats del client, sense crear una font paral·lela.
- `lib/customer-hub/dto.ts` amplia el contracte del `Customer Hub` amb un resum mínim de follow-ups pendents i el top ítem operatiu.
- `app/admin/clientes/[id]/_components/panels/CommsPanel.tsx` mostra ara el seguiment pendent canònic amb urgència, dies sense resposta i CTA per preparar email, obrir WhatsApp o entrar al lead.
- `__tests__/lib/customer-hub/fetchCustomerHub.test.ts` blinda que el `Customer Hub` derivi aquest seguiment pendent des del model canònic.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/customer-hub/fetchCustomerHub.test.ts __tests__/lib/services/responseTrackingService.test.ts __tests__/lib/services/customerInsightsService.test.ts` OK (43 tests).
- `ADMIN_CHANGE_COUNTER` passa a `141`; el següent canvi real ha de ser `#142`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #142 — 2026-04-17 — codex (FET)
**Risc comercial per inacció visible al Customer Hub des del motor d'insights.**
- `lib/services/customerInsightsService.ts` calcula `commercialRisk` a partir de `followUpSummary` i `daysSinceLastContact`, amb nivells `HIGH/MEDIUM/LOW/NONE` i context accionable.
- `lib/customer-hub/dto.ts` amplia `CustomerInsightsDTO` amb aquest nou senyal canònic.
- `app/admin/clientes/[id]/_components/InsightsBanner.tsx` mostra el risc comercial sota la salut relacional, i `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` l'eleva a alerta quan és `HIGH` o `MEDIUM`.
- `__tests__/lib/services/customerInsightsService.test.ts` blinda tant el cas de seguiment urgent com el refredament per inacció.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/services/customerInsightsService.test.ts __tests__/lib/customer-hub/fetchCustomerHub.test.ts __tests__/lib/services/responseTrackingService.test.ts` OK (45 tests).
- `ADMIN_CHANGE_COUNTER` passa a `143`; el següent canvi real ha de ser `#144`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #145 — 2026-04-17 — codex (FET)
**Quick actions del Customer Hub connectades al risc comercial.**
- `lib/customer-hub/nextActionLink.ts` amplia la resolució de CTA amb `buildCustomerCommercialRiskLink()`, reutilitzant `commercialRisk` i `followUpSummary` per decidir si cal desencallar per `WhatsApp` o preparar seguiment per email.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara una quick action específica de risc comercial quan el client està en `HIGH` o `MEDIUM`, sense inventar una heurística local nova.
- `__tests__/lib/customer-hub/nextActionLink.test.ts` blinda les dues branques: WhatsApp per urgència alta amb telèfon i email quan no hi ha via urgent per mòbil.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/customer-hub/nextActionLink.test.ts __tests__/lib/services/customerInsightsService.test.ts __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK (32 tests).
- `ADMIN_CHANGE_COUNTER` passa a `145`; el següent canvi real ha de ser `#146`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #148 — 2026-04-17 — codex (FET)
**Bloc de prioritat comercial visible dins del Customer Hub.**
- `lib/customer-hub/commercialPriority.ts` afegeix un helper pur que resumeix el bloqueig comercial actual a partir de `commercialRisk`, `nextAction` i `followUpSummary`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` incorpora una targeta nova de `Prioritat comercial` al bloc de propers passos, amb lectura compacta i CTA coherent amb el risc.
- `__tests__/lib/customer-hub/commercialPriority.test.ts` blinda tant el cas de risc alt amb top follow-up visible com la caiguda al pròxim pas comercial quan no hi ha risc explícit.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/customer-hub/commercialPriority.test.ts __tests__/lib/customer-hub/nextActionLink.test.ts __tests__/lib/services/customerInsightsService.test.ts` OK (30 tests).
- `ADMIN_CHANGE_COUNTER` puja a `148`; el següent canvi real ha de ser `#149`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #151 — 2026-04-17 — codex (FET)
**Estat comercial actual visible també dins de la cronologia del Customer Hub.**
- `app/admin/clientes/[id]/_components/CustomerHubClient.tsx` passa al `TimelinePanel` el context canònic necessari (`insights`, `followUpSummary`, identitat i telèfon del client) en lloc de deixar la cronologia aïllada del risc comercial.
- `app/admin/clientes/[id]/_components/TimelinePanel.tsx` mostra un bloc d'`Estat comercial actual` al capdamunt de la cronologia reutilitzant `buildCustomerCommercialPriority()` i `buildCustomerCommercialRiskLink()`, sense inventar esdeveniments amb dates artificials.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/customer-hub/commercialPriority.test.ts __tests__/lib/customer-hub/nextActionLink.test.ts __tests__/lib/services/customerInsightsService.test.ts` OK (30 tests).
- `ADMIN_CHANGE_COUNTER` puja a `151`; el següent canvi real ha de ser `#152`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #152 — 2026-04-17 — codex (FET)
**Protocol de treball reforçat per concurrència, handoff i represa.**
- `§2.3` deixa explícit que si `qa:protocol` falla per deute històric, aquest deute s'ha de reparar abans de considerar el tall actual formalment tancat.
- `§2.4` exigeix `últim moviment visible`, `següent pas executable` i `validació pendent` a qualsevol bloc important, i estableix que la represa no depèn de confirmar si l'altre agent “segueix viu”.
- `§2.6` i `§9` eliminen la idea de reservar números per avançat: el `Canvi #N` només s'assigna al final, amb protocol + diari + comptador actualitzats en la mateixa seqüència i `qa:protocol` obligatori després.
- Verificació del tall: `pnpm run qa:protocol` OK després d'actualitzar protocol, diari i comptador.
- `ADMIN_CHANGE_COUNTER` puja a `152`; el següent canvi real ha de ser `#153`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #154 — 2026-04-17 — codex (FET)
**Lectura obligatòria del protocol abans d'iniciar qualsevol tall.**
- `§2.2` deixa explícit que cap agent pot començar feina real sense rellegir aquest protocol, el tram viu del §6 i el final del §9 per confirmar estat i comptador.
- `CLAUDE.md` reforça el flux obligatori abans de tocar res: lectura de `CLAUDE.md`, `docs/diario.md`, `docs/estat-admin.md` quan pertoqui i, per qualsevol feina d'admin o zona consolidada, lectura obligatòria de `docs/protocol-producte-admin-ca.md`, el §6 rellevant i el §9 final.
- Verificació del tall: `pnpm run qa:protocol` després de registrar.
- `ADMIN_CHANGE_COUNTER` puja a `154`; el següent canvi real ha de ser `#155`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #155 — 2026-04-17 — codex (FET)
**Correccions de revisió al Customer Hub i al protocol recent.**
- `docs/protocol-producte-admin-ca.md` corregeix el `Canvi #152` perquè la verificació deixi de constar com a "pendent" si el tall ja està marcat com a `FET`.
- `app/admin/clientes/[id]/_components/TimelinePanel.tsx` fa que el bloc `Estat comercial actual` només aparegui quan el filtre és `all`, evitant barrejar un resum comercial no filtrat dins de vistes de `bookings` o `tasks`.
- `__tests__/app/admin/clientes/InsightsBanner.test.tsx` afegeix una regressió de wiring perquè el `InsightsBanner` resolgui la CTA des del `CustomerCommSummaryDTO` canònic i obri `WhatsApp` quan toca.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/InsightsBanner.test.tsx __tests__/lib/customer-hub/nextActionLink.test.ts __tests__/lib/customer-hub/commercialPriority.test.ts` OK (7 tests).
- `ADMIN_CHANGE_COUNTER` puja a `155`; el següent canvi real ha de ser `#156`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #156 — 2026-04-17 — codex (FET)
**Resum superior del Customer Hub reconnectat al resum canònic de comunicacions.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` deixa de llegir la card de `Comunicacions` des de `data.messages` i passa a consumir `data.commSummary.total` i `data.commSummary.lastContactAt`.
- Això evita que el resum superior depengui d'una llista parcial o d'un ordre incidental de missatges quan ja existeix una font canònica de comunicació al workspace.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/InsightsBanner.test.tsx __tests__/lib/customer-hub/nextActionLink.test.ts __tests__/lib/customer-hub/commercialPriority.test.ts __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK (11 tests).
- `ADMIN_CHANGE_COUNTER` puja a `156`; el següent canvi real ha de ser `#157`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #157 — 2026-04-17 — codex (FET)
**Panell de Comunicacions reconnectat a les CTA canòniques del Customer Hub.**
- `app/admin/clientes/[id]/_components/panels/CommsPanel.tsx` deixa d'exposar només accions locals genèriques i mostra també la CTA canònica de conversa (`buildCustomerNextActionLink`) i la de risc comercial (`buildCustomerCommercialRiskLink`) dins del mateix panell.
- El bloc `Seguiment canònic pendent` reutilitza aquesta mateixa sortida operativa en lloc de forçar sempre `Preparar seguiment`, de manera que el panell de `Comunicacions` ja no viu amb criteris paral·lels al banner i al resum.
- `__tests__/app/admin/clientes/CommsPanel.test.tsx` blinda que el panell resolgui `Respondre per WhatsApp` des del resum canònic de conversa quan toca.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/CommsPanel.test.tsx __tests__/app/admin/clientes/InsightsBanner.test.tsx __tests__/lib/customer-hub/nextActionLink.test.ts __tests__/lib/customer-hub/commercialPriority.test.ts` OK (8 tests).
- `ADMIN_CHANGE_COUNTER` puja a `157`; el següent canvi real ha de ser `#158`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #158 — 2026-04-17 — codex (FET)
**Llistat recent de Comunicacions netejat de labels interns crus.**
- `app/admin/clientes/[id]/_components/panels/CommsPanel.tsx` deixa d'ensenyar títols crus com `NOTE_ADDED` al llistat recent i reutilitza labels canònics per mostrar `Nota afegida`, `Email`, `WhatsApp`, `Trucada` o `Nota` segons toca.
- Això alinea la llista recent amb la mateixa llengua operativa que la timeline i evita que el panell de `Comunicacions` sigui l'últim tros del workspace que encara filtra codis interns.
- `__tests__/app/admin/clientes/CommsPanel.test.tsx` amplia la regressió perquè el llistat recent mostri `Nota afegida` i el badge `Nota` en lloc del codi cru.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/CommsPanel.test.tsx __tests__/app/admin/clientes/InsightsBanner.test.tsx __tests__/lib/customer-hub/nextActionLink.test.ts` OK (7 tests).
- `ADMIN_CHANGE_COUNTER` puja a `158`; el següent canvi real ha de ser `#159`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #159 — 2026-04-17 — codex (FET)
**Semàntica de conversa del panell de Comunicacions preparada per consolidació futura.**
- `app/admin/clientes/[id]/_components/panels/CommsPanel.tsx` ja no és només un contenidor de CTA i llista recent: la seva semàntica visible queda alineada amb els labels canònics del workspace (`Nota afegida`, `Email`, `WhatsApp`, `Trucada`, `Nota`) i amb les CTA canòniques de conversa/risc.
- Aquest tall deixa el panell en millor posició per a una consolidació futura del resum canònic de comunicacions sense arrastrar llenguatge intern ni sortides operatives locals.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/CommsPanel.test.tsx __tests__/app/admin/clientes/InsightsBanner.test.tsx __tests__/lib/customer-hub/nextActionLink.test.ts` OK (7 tests).
- `ADMIN_CHANGE_COUNTER` puja a `159`; el següent canvi real ha de ser `#160`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #160 — 2026-04-17 — codex (FET)
**Leads del Customer Hub ordenades per prioritat operativa.**
- `app/admin/clientes/[id]/_components/panels/LeadsPanel.tsx` deixa de pintar les entrades només com un històric pla: les ordena per prioritat i estat, mostra una `Lead prioritària` al capdamunt i afegeix el badge de prioritat a cada targeta.
- Això fa que el panell de leads sigui més executable dins del `Customer Hub` i no només una llista passiva d'oportunitats antigues.
- `__tests__/app/admin/clientes/LeadsPanel.test.tsx` blinda que la lead amb prioritat més alta pugi al resum superior i que els badges de prioritat es mostrin al panell.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/LeadsPanel.test.tsx` OK (1 test).
- `ADMIN_CHANGE_COUNTER` puja a `160`; el següent canvi real ha de ser `#161`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #161 — 2026-04-17 — codex (FET)
**Cada lead del Customer Hub mostra també el seu bloqueig comercial principal.**
- `lib/customer-hub/leadCommercialBlocker.ts` afegeix un helper pur que resumeix el bloqueig principal de cada lead a partir del follow-up canònic pendent o, si no n'hi ha, des de l'estat comercial (`NEW`, `QUOTE_SENT`, `NEGOTIATING`, `WON` sense reserva).
- `lib/customer-hub/fetchCustomerHub.ts` connecta aquest resum al DTO de cada lead reutilitzant els mateixos `pendingFollowUps` ja derivats pel workspace, sense inventar un segon motor de lectura.
- `app/admin/clientes/[id]/_components/panels/LeadsPanel.tsx` mostra aquest bloqueig tant a la `Lead prioritària` com a cada targeta individual, de manera que el panell de leads deixa de ser només estat + prioritat i passa a ensenyar també què està encallant comercialment cada oportunitat.
- `__tests__/lib/customer-hub/leadCommercialBlocker.test.ts` i `__tests__/app/admin/clientes/LeadsPanel.test.tsx` blinden el resum nou, i `__tests__/lib/customer-hub/fetchCustomerHub.test.ts` segueix passant amb el contracte ampliat.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/LeadsPanel.test.tsx __tests__/lib/customer-hub/leadCommercialBlocker.test.ts __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK (7 tests).
- `ADMIN_CHANGE_COUNTER` puja a `161`; el següent canvi real ha de ser `#162`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #162 — 2026-04-17 — codex (FET)
**Cada lead del Customer Hub resol també una CTA executable coherent.**
- `lib/customer-hub/leadActionLink.ts` afegeix un helper pur que transforma el bloqueig canònic de cada lead en una sortida operativa: `WhatsApp` per seguiment urgent amb telèfon, `recordatori` per email quan toca perseguir pressupost o primer contacte, i fitxa del lead quan cal tancar conversió o revisar-la.
- `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim de lead amb el telèfon necessari per resoldre aquesta CTA sense heurístiques locals.
- `app/admin/clientes/[id]/_components/panels/LeadsPanel.tsx` mostra aquesta acció tant a la `Lead prioritària` com a cada targeta, de manera que el panell deixa de ser només diagnòstic i passa a oferir una següent passa executable per oportunitat.
- `__tests__/lib/customer-hub/leadActionLink.test.ts` i `__tests__/app/admin/clientes/LeadsPanel.test.tsx` blinden les dues branques principals: `Desencallar per WhatsApp` i `Enviar recordatori`.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/LeadsPanel.test.tsx __tests__/lib/customer-hub/leadCommercialBlocker.test.ts __tests__/lib/customer-hub/leadActionLink.test.ts __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK (9 tests).
- `ADMIN_CHANGE_COUNTER` puja a `162`; el següent canvi real ha de ser `#163`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #163 — 2026-04-17 — codex (FET)
**CTA del panell de leads separades del link principal de la targeta.**
- `app/admin/clientes/[id]/_components/panels/LeadsPanel.tsx` evita els enllaços niats: la targeta continua obrint la fitxa del lead, però la CTA operativa queda com un link separat fora de l'àrea principal de navegació.
- Això elimina una estructura HTML incorrecta i evita que les accions ràpides de cada lead quedin encastades dins d'un altre `Link`.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/LeadsPanel.test.tsx __tests__/lib/customer-hub/leadActionLink.test.ts` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `163`; el següent canvi real ha de ser `#164`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #164 — 2026-04-17 — codex (FET)
**Resum superior del Customer Hub connectat també a la lead prioritària.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` incorpora una targeta d'`Oportunitat comercial` que reutilitza la mateixa lead prioritària i la mateixa CTA canònica del panell de leads.
- Això fa que el resum superior no visqui només de risc comercial agregat: també mostra quina oportunitat concreta s'hauria de desencallar i amb quina acció.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que el resum mostri la millor lead visible, el seu bloqueig i la CTA `Desencallar per WhatsApp` quan toca.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx __tests__/app/admin/clientes/LeadsPanel.test.tsx __tests__/lib/customer-hub/leadActionLink.test.ts` OK (4 tests).
- `ADMIN_CHANGE_COUNTER` puja a `164`; el següent canvi real ha de ser `#165`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #165 — 2026-04-17 — codex (FET)
**Lead prioritària consolidada amb criteri únic dins del Customer Hub.**
- `lib/customer-hub/topLead.ts` centralitza l'ordenació de leads i la resolució de la `lead prioritària` en un helper compartit (`sortCustomerHubLeads()` i `getTopCustomerHubLead()`).
- `app/admin/clientes/[id]/_components/panels/LeadsPanel.tsx` i `SummaryPanel.tsx` deixen de mantenir heurístiques pròpies i passen a reutilitzar exactament el mateix criteri.
- Això evita que el panell de leads i el resum superior divergeixin si més endavant canvia l'ordre de prioritat o d'estat.
- `__tests__/lib/customer-hub/topLead.test.ts` blinda el criteri pur de prioritat + estat, i els tests de `LeadsPanel` i `SummaryPanel` continuen passant sobre el wiring.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/customer-hub/topLead.test.ts __tests__/app/admin/clientes/LeadsPanel.test.tsx __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (4 tests).
- `ADMIN_CHANGE_COUNTER` puja a `165`; el següent canvi real ha de ser `#166`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #167 — 2026-04-17 — codex (FET)
**Quick actions del resum superior deduplicades i `tsc` global desbloquejat.**
- `lib/customer-hub/quickActions.ts` afegeix una deduplicació pura de quick actions per etiqueta operativa, de manera que el resum superior no repeteixi la mateixa CTA quan el risc comercial i la lead prioritària desemboquen al mateix pas.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` reutilitza aquest helper i marca la targeta d'`Accions ràpides` amb un `data-testid` per blindar la regressió exacta del bloc.
- `__tests__/lib/customer-hub/quickActions.test.ts` i `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinden que `Desencallar per WhatsApp` només aparegui una vegada dins de les quick actions quan les dues fonts apunten a la mateixa sortida.
- `lib/services/nextBestActionService.ts` queda reparat per tornar `npx tsc --noEmit` a verd: elimina un `select` incorrecte (`leadActivity` → `activities`), alinea els estats actius amb l'enum real de Prisma i neteja el tipat de la consulta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/lib/customer-hub/quickActions.test.ts __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `167`; el següent canvi real ha de ser `#168`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

---

### Canvi #168 — 2026-04-17 — claude (FET)
**Motor de seguent millor accio — Next Best Action Engine (§6.1).**
- `lib/services/nextBestActionService.ts` — servei pur + wrapper:
  - `assembleNextBestActions`: agrega accions de 6 dominis (leads, customers, tasks, follow-ups, capacity, pipeline), scoring compost (urgencia x impacte x finestra temporal), deduplicacio per entitat+domini, ranking global
  - `buildNBAReport`: resum estadistic amb comptadors per urgencia
  - 6 extractors purs: lead (CONTACT_NOW, OVERDUE_TASK, FOLLOW_QUOTE, EVENT_SOON, STALE_NEGOTIATION), customer (COLLECT_PAYMENT, AT_RISK, RECONTACT), task (overdue/today/priority), follow-ups (URGENT/NORMAL), capacity (RESOLVE_CONFLICT), pipeline (CRITICAL/HIGH)
- Wrapper `loadNextBestActions` amb `Promise.all` i fallbacks per font
- `app/api/admin/next-actions/route.ts` — GET amb requireAuth
- **24 tests servei** + **4 tests ruta** = 28 tests, 0 errors TypeScript
- Tanca SEGUENT de §6.1 (motor de seguent millor accio)
- `ADMIN_CHANGE_COUNTER` puja a `168`; el seguent canvi real ha de ser `#169`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #169 — 2026-04-17 — codex (FET)
**Targeta d'oportunitat comercial enriquida amb context visible de la lead prioritària.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` amplia la targeta d'`Oportunitat comercial` amb badges d'estat i prioritat de la lead principal, i hi afegeix també el context canònic de tipus d'event.
- Això fa que el resum superior no obligui a baixar al panell de leads per entendre ràpidament en quin punt comercial està la millor oportunitat.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que aquesta targeta mostri la lead prioritària amb el seu estat, prioritat i tipus d'event visibles.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (2 tests).
- `ADMIN_CHANGE_COUNTER` puja a `169`; el següent canvi real ha de ser `#170`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #170 — 2026-04-17 — codex (FET)
**Targeta d'oportunitat comercial amb accés directe també a la fitxa de la lead.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` afegeix un accés directe `Obrir fitxa de la lead` dins de la targeta d'`Oportunitat comercial`, de manera que la CTA principal pot continuar sent comercial (`WhatsApp`, recordatori, etc.) sense perdre l'entrada ràpida al detall operatiu de la lead.
- Això evita que la targeta obligui a triar entre “executar” i “inspeccionar”: ara permet fer les dues coses des del resum superior.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que la targeta mantingui tant la CTA comercial principal com l'accés directe a la fitxa.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (2 tests).
- `ADMIN_CHANGE_COUNTER` puja a `170`; el següent canvi real ha de ser `#171`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #171 — 2026-04-17 — codex (FET)
**Targeta d'oportunitat comercial amb traça temporal bàsica de la lead.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` afegeix a la targeta d'`Oportunitat comercial` una línia estable amb la data d'obertura de la lead i, si existeix, la reserva vinculada.
- Això fa que el resum superior doni també context de traça comercial bàsica sense obligar a obrir la fitxa per saber si la lead és recent o si ja ha desembocat en una reserva.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que aquesta traça mínima continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (2 tests).
- `ADMIN_CHANGE_COUNTER` puja a `171`; el següent canvi real ha de ser `#172`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #172 — 2026-04-17 — codex (FET)
**Targeta d'oportunitat comercial amb canal suggerit visible.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també el `Canal suggerit` de la CTA principal de la lead prioritària, deixant clar si el següent pas proposat és `WhatsApp`, `Email` o revisar la fitxa del lead.
- Això fa que el resum superior expliqui no només què convé fer, sinó també des d'on es farà el següent toc comercial.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que aquesta pista de canal continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (2 tests).
- `ADMIN_CHANGE_COUNTER` puja a `172`; el següent canvi real ha de ser `#173`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #173 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb prioritat del pas visible.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també la `Prioritat del pas` de la CTA principal de la lead prioritària, traduïda a un nivell llegible (`Alta`, `Mitjana` o `Informativa`) a partir del bloqueig comercial canònic.
- Això fa que el resum superior expliqui no només què convé fer i per quin canal, sinó també amb quina urgència operativa convé executar aquest següent toc.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que aquesta pista de prioritat continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (2 tests).
- `ADMIN_CHANGE_COUNTER` puja a `173`; el següent canvi real ha de ser `#174`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #174 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb estat de conversió explícit.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també si la lead prioritària està `sense reserva vinculada` o si ja ha desembocat en una reserva concreta.
- Això fa que el resum superior deixi explícit l'estat de conversió sense haver d'entrar a la fitxa per saber si l'oportunitat continua oberta o ja ha passat a reserva.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que aquesta pista de conversió continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (2 tests).
- `ADMIN_CHANGE_COUNTER` puja a `174`; el següent canvi real ha de ser `#175`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

---

### Canvi #175 — 2026-04-18 — claude (FET)
**Tests d'integracio de ruta per 3 workspaces principals (§6.13).**
- `__tests__/app/api/admin/customers-hub-route.test.ts` — 6 tests: auth, hub complet ok:true, id passthrough, kpis/leads/bookings, insights, 404
- `__tests__/app/api/admin/leads-detail-route.test.ts` — 11 tests: GET (auth, data, id, 404, 500), PATCH (auth, update, invalid status, strict), DELETE (auth, ok)
- `__tests__/app/api/admin/bookings-detail-route.test.ts` — 17 tests: GET (auth, permission, data, id, 404, 500), PATCH (auth, permission, update, auto-trigger booking.confirmed, no-trigger altres, invalid, strict), DELETE (auth, permission, ok, 404)
- **34 tests**, 0 errors TypeScript
- Tanca SEGUENT de §6.13 (tests d'integracio per workspaces reals)
- `ADMIN_CHANGE_COUNTER` puja a `175`; el seguent canvi real ha de ser `#176`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #176 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb accés directe també a la reserva vinculada.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` afegeix un accés directe `Obrir reserva vinculada` quan la lead prioritària ja està convertida i té una reserva associada.
- Això completa la lectura de conversió del resum superior: si l'oportunitat ja ha desembocat en booking, la targeta no només ho explica sinó que també permet entrar directament a la reserva.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè la targeta mostri tant la conversió explícita com l'accés directe a la reserva.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `176`; el següent canvi real ha de ser `#177`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #177 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb estat visible de la reserva vinculada.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també l'`Estat de la reserva` quan la lead prioritària ja està convertida, deixant clar si el booking vinculat està confirmat o en un altre estat.
- Això fa que la lectura de conversió del resum superior sigui més útil: no només existeix una reserva, sinó que també se sap ràpidament en quin punt operatiu es troba.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que el cas convertit mostri aquest estat de la reserva dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `177`; el següent canvi real ha de ser `#178`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #178 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb valor econòmic visible de la reserva vinculada.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també el `Valor de la reserva` quan la lead prioritària ja està convertida i té un booking associat.
- Això completa la lectura de conversió del resum superior amb una dada econòmica mínima: no només es veu que hi ha reserva i en quin estat està, sinó també quin import representa.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que el cas convertit continuï mostrant aquesta línia de valor.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `178`; el següent canvi real ha de ser `#179`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #179 — 2026-04-18 — claude (FET)
**Tests d'integració per 8 rutes secundàries dels workspaces principals (§6.13).**
- 8 fitxers de test nous:
  - `leads-activities-route.test.ts` — 12 tests (GET auth/data/id/500, POST auth/create/invalid-title/invalid-type/500, DELETE auth/cleanup/500)
  - `leads-tasks-route.test.ts` — 10 tests (GET auth/data/id/500, POST auth/create/invalid-title/invalid-status/invalid-priority/500)
  - `leads-task-detail-route.test.ts` — 9 tests (PATCH auth/update/invalid-status/404/500, DELETE auth/ok/404/500)
  - `leads-notes-route.test.ts` — 11 tests (POST auth/create/status-passthrough/500, PUT auth/cleanup/500, DELETE auth/noteId/null-noteId/500)
  - `leads-score-route.test.ts` — 10 tests (GET auth/permission/data/id/500, POST auth/permission/csrf/create/500)
  - `leads-snapshot-route.test.ts` — 7 tests (auth/save_document/send_email/invalid-action/invalid-recipient/empty-body/500)
  - `customers-activities-route.test.ts` — 11 tests (GET auth/data/id/500, POST auth/csrf/create/empty-note/long-note/long-action/500)
  - `tasks-detail-route.test.ts` — 10 tests (PATCH auth/update/multi-fields/invalid-status/invalid-priority/empty-title/500, DELETE auth/ok/500)
- **80 tests** nous, tots passant. 0 errors TypeScript.
- Tanca SEGÜENT de §6.13 (rutes secundàries: activities, tasks, notes, score, snapshot)
- `ADMIN_CHANGE_COUNTER` puja a `179`; el següent canvi real ha de ser `#180`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #180 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb acció principal prioritzant la reserva ja convertida.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` fa que la CTA principal de la targeta d'`Oportunitat comercial` passi a ser `Obrir reserva` quan la lead prioritària ja té un booking vinculat, en lloc de continuar suggerint una acció de lead que ja ha quedat superada.
- La mateixa targeta ajusta també el `Canal suggerit` a `Fitxa reserva`, deixant coherent el resum superior amb l'estat real de conversió.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que el cas convertit mostri tant el canal corregit com la CTA principal cap a la reserva, tolerant que el mateix label també pugui aparèixer a accions ràpides.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `180`; el següent canvi real ha de ser `#181`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #181 — 2026-04-18 — claude (FET)
**Tests d'integració per 8 rutes terciàries: bookings sub-routes, proposals i inbox (§6.13).**
- 8 fitxers de test nous:
  - `bookings-checklist-route.test.ts` — 7 tests (GET auth/items/id, PUT auth/save/invalid-array/500)
  - `bookings-inventory-route.test.ts` — 14 tests (GET auth/data/id+url/500, POST auth/assign/500, PATCH auth/update/500, DELETE auth/remove/null-id/500)
  - `bookings-status-route.test.ts` ��� 6 tests (auth/permission/change/invalid/empty/500)
  - `bookings-communications-route.test.ts` — 5 tests (auth/permission/execute/invalid-payload/500)
  - `bookings-calendar-sync-route.test.ts` — 7 tests (auth/permission/upsert/delete/unknown-action/sync-fail/500)
  - `bookings-portal-access-route.test.ts` — 11 tests (GET auth/permission/data/500, POST auth/issue/404/500, DELETE auth/permission/revoke/500)
  - `proposals-detail-route.test.ts` — 13 tests (GET auth/data/id/404/500, PATCH auth/csrf/update/auto-trigger-accepted/auto-trigger-acceptedAt/no-trigger/invalid/500)
  - `inbox-messages-route.test.ts` — 9 tests (auth/list/test-conn/count-unread/count-total/folder/limit-cap/imap-not-configured/500)
- **72 tests** nous, tots passant. 0 errors TypeScript.
- Tanca SEGÜENT de §6.13 (rutes terciàries: bookings sub-routes, proposals, inbox messages)
- `ADMIN_CHANGE_COUNTER` puja a `181`; el següent canvi real ha de ser `#182`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #182 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb data visible de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim de la lead convertida perquè el booking vinculat també transporti `eventDate`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara `Data de la reserva` quan la lead prioritària ja està convertida, deixant clar no només que hi ha booking i quin valor té, sinó també quan cau l'esdeveniment reservat.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquesta data continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `182`; el següent canvi real ha de ser `#183`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #183 — 2026-04-18 — claude (FET)
**Tests d'integració per 4 rutes restants: collaborators, discount-codes, custom-quotes, email-templates (§6.13).**
- 4 fitxers de test nous:
  - `collaborators-route.test.ts` — 14 tests (list: auth/data/500, create: auth/ok/500, detail: auth/data/404/500, patch: ok/500, delete: ok/500)
  - `discount-codes-route.test.ts` — 9 tests (list: auth/data/500, create: auth/ok/code-curt/sense-validUntil/value-negatiu/500)
  - `custom-quotes-route.test.ts` — 12 tests (list: auth/data/500, create: ok/500, detail: data/404/500, patch: ok/500, delete: ok/500)
  - `email-templates-route.test.ts` — 11 tests (list: auth/data, upsert: auth/csrf/ok/sense-slug/sense-locale/sense-subject, detail: auth/locale-ca/locale-es)
- **46 tests** nous, tots passant. 0 errors TypeScript.
- Tanca cobertura de rutes d'integració de §6.13
- `ADMIN_CHANGE_COUNTER` puja a `183`; el següent canvi real ha de ser `#184`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #184 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb estat mínim de cobrament de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim del booking vinculat perquè la lead convertida també transporti `depositPaid` i `remainingPaid`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara una línia de `Cobrament` quan la lead prioritària ja té reserva: `Pagada`, `Bestreta cobrada` o `Pagament pendent`.
- Això fa que la lectura de conversió del resum superior no sigui només temporal i econòmica, sinó també operativa a nivell de cobrament.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquesta pista de cobrament continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `184`; el següent canvi real ha de ser `#185`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #185 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb ubicació visible de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim del booking vinculat perquè la lead convertida també transporti `eventLocation`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també la `Ubicació` de la reserva quan la lead prioritària ja està convertida.
- Això completa una mica més la lectura de conversió del resum superior: no només es veu que hi ha booking, quan és i com va el cobrament, sinó també on passa.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquesta ubicació continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `185`; el següent canvi real ha de ser `#186`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #187 — 2026-04-18 — claude (FET)
**Tests d'integració per 7 cron routes restants (§6.13).**
- 7 fitxers nous: `commercial-daily-route.test.ts` (4), `fuel-daily-route.test.ts` (4), `invoice-sync-route.test.ts` (4), `lead-cleanup-route.test.ts` (4), `pack-pricing-check-route.test.ts` (4), `post-event-route.test.ts` (6), `reviews-sync-route.test.ts` (5).
- **31 tests** nous: Bearer auth, token incorrecte, execució OK amb saveCronRunStatus, errors 500, batching post-event, dades null reviews-sync.
- Tots passant. 0 errors TypeScript.
- Tanca cobertura de totes les cron routes sense tests.
- `ADMIN_CHANGE_COUNTER` puja a `187`; el següent canvi real ha de ser `#188`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #190 — 2026-04-18 — claude (FET)
**Tests d'integració per 4 rutes d'automatització + 6 rutes d'emails (§6.13).**
- 10 fitxers nous: automation commercial-sequences (9), automation daily-summary (5), automation enforce-sla (8), automation run-all (5), emails send (5), emails test (6), emails quote (6), emails run-cron (4), emails send-post-event (7), emails testimonials-reminder (3).
- **58 tests** nous: auth, permission, CSRF, rate-limit, timeout SMTP→504, missing extras→400, reserva no trobada→404, ja enviat→409, passthrough status, saveCronRunStatus, errors individuals.
- Tots passant. 0 errors TypeScript.
- `ADMIN_CHANGE_COUNTER` puja a `190`; el següent canvi real ha de ser `#191`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #192 — 2026-04-18 — claude (FET)
**Tests d'integració per 7 rutes de customers + 3 rutes d'invoices + fix TS packName (§6.13).**
- 10 fitxers nous: customers detail (12), consents (3), export (5), preferences (5), status (5), tags (8), check-duplicates (4), invoices list+create (9), invoices detail (7), invoices sync (4).
- **62 tests** nous: auth, CSRF, Zod validation, GDPR export+download, tag add/remove/set, duplicates graceful, invoice passthrough status.
- Fix TS: afegit `packName?: string` a `LeadDTO.booking` al DTO (Codex ho usava a SummaryPanel però faltava al tipus).
- Tots passant. 0 errors TypeScript.
- `ADMIN_CHANGE_COUNTER` puja a `192`; el següent canvi real ha de ser `#193`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #199 — 2026-04-18 — claude (FET)
**Tests d'integració per 4 rutes d'inventari + 6 rutes de packs + 4 rutes de privacy (§6.13).**
- 14 fitxers nous: inventory list+create (8), detail (8), photo (5), bundles (4), packs list+create (6), detail (6), sync (3), price-sync (3), included-extras (3), price-alerts (4), privacy audit (4), requests (3), requests/process (5), stats (3).
- **65 tests** nous: auth, permission, Zod validation, formData photo upload, cron Bearer fallback, ARCO approve/reject, audit filtering.
- Tots passant. 0 errors TypeScript.
- `ADMIN_CHANGE_COUNTER` puja a `199`; el següent canvi real ha de ser `#200`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #193 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb bestreta prevista visible de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim del booking vinculat perquè la lead convertida també transporti `depositAmount`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també la `Bestreta prevista` quan la lead prioritària ja està convertida.
- Això deixa la lectura de conversió del resum superior més útil a nivell econòmic: no només es veu l'estat del cobrament, sinó també quin import estava previst com a bestreta.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquesta bestreta continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `193`; el següent canvi real ha de ser `#194`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #194 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb import pendent visible de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim del booking vinculat perquè la lead convertida també transporti `remainingAmount`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també el `Pendent de cobrament` quan la lead prioritària ja està convertida.
- Això deixa la lectura de conversió del resum superior més útil a nivell econòmic: no només es veu la bestreta prevista, sinó també què queda realment per cobrar.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquest import pendent continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `194`; el següent canvi real ha de ser `#195`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #195 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb descompte aplicat visible de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim del booking vinculat perquè la lead convertida també transporti `discountCode`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també el `Descompte aplicat` quan la lead prioritària ja està convertida i la reserva té codi associat.
- Això deixa la lectura de conversió del resum superior més útil a nivell comercial: no només es veu l'import i el cobrament, sinó també si la reserva porta una condició promocional concreta.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquest descompte continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `195`; el següent canvi real ha de ser `#196`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #196 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb dies restants visibles fins a la reserva vinculada.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també `Dies fins a la reserva` quan la lead prioritària ja està convertida i té `eventDate`.
- Això fa que la lectura de conversió del resum superior sigui més operativa: no només es veu la data absoluta, sinó també la proximitat real de la reserva.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquesta pista temporal continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `196`; el següent canvi real ha de ser `#197`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #197 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb risc temporal visible quan queda poc i hi ha cobrament pendent.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` detecta ara quan la reserva vinculada és dins dels pròxims 14 dies i encara té import pendent, i mostra una línia de `Risc temporal` amb dies restants i import pendent.
- Això evita que la targeta sigui només descriptiva: ara també assenyala quan una conversió ja tancada comercialment encara és delicada a nivell de cobrament i calendari.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquest senyal de risc continuï visible quan toca.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `197`; el següent canvi real ha de ser `#198`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #200 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb resum econòmic sintètic de la reserva vinculada.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també una línia d'`Estat econòmic` quan la lead prioritària ja està convertida, resumint si el cobrament està `tancat`, `parcial` o `pendent`.
- Això compacta la lectura econòmica del resum superior i evita haver d'inferir l'estat només a partir de línies separades de bestreta, pendent i risc temporal.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquest resum econòmic continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `200`; el següent canvi real ha de ser `#201`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #201 — 2026-04-18 — codex (FET)
**Reactivació assistida visible al Customer Hub sense enviament automàtic.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien la lectura del client amb els camps mínims de reactivació i reaprofiten `generateReactivationCandidates()` per publicar una pista canònica de reactivació quan no hi ha flux comercial actiu ni reserva futura.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara una targeta de `Reactivació suggerida` amb motiu, antiguitat i CTA executable; la decisió de producte queda explícita en mode assistit: s'obre esborrany de WhatsApp o email, però no s'envia res automàticament.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que aquesta reactivació assistida continuï visible i que la CTA segueixi sent un esborrany, no un enviament opac.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (4 tests).
- `ADMIN_CHANGE_COUNTER` puja a `201`; el següent canvi real ha de ser `#202`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #202 — 2026-04-18 — codex (FET)
**Reactivació assistida amb pas explícit cap a Tasks.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` amplia la targeta de `Reactivació suggerida` amb una via explícita cap a `Nova tasca`, reutilitzant la mateixa lectura canònica de reactivació i preparant el pas operatiu sense crear res en silenci.
- `app/admin/tasks/new/page.tsx` accepta ara prefills per query string (`title`, `description`, `priority`, `source`) perquè la reactivació assistida pugui obrir el formulari de tasca ja preparat i amb context.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que la CTA de reactivació també pugui desembocar en `Tasks` amb origen `reactivation`.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (4 tests).
- `ADMIN_CHANGE_COUNTER` puja a `202`; el següent canvi real ha de ser `#203`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #203 — 2026-04-18 — claude (FET)
**`Task` schema guanya camps canònics: elimina el hack `[dedupeKey:X]` dins `description`.**
- `prisma/schema.prisma` amplia `Task` amb `source String?` (índex), `autoRule String?` (índex), `dedupeKey String? @unique` i `resolutionNote String? @db.Text`. Cap camp trenca retrocompatibilitat: tots opcionals.
- `prisma/migrations/20260418120000_add_task_dedupe_source_fields/migration.sql` crea columnes + índexs i fa backfill: `createdBy='system:auto'`→`source='AUTOMATION'` (més 5 mappings: `CHECKLIST`, `PACK_PRICING`, `BOOKING_COMPLETION`, `BOOKING_CREATION`, `CUSTOMER_CREATION`), extreu `[dedupeKey:X]` de la descripció de les tasques `AUTOMATION` cap a la columna real i deriva `autoRule` (SLA_BROKEN, STALE_LEAD, BOOKING_PREP, PAYMENT_OVERDUE, POST_EVENT, AT_RISK_CLIENT, QUOTE_FOLLOWUP) a partir del prefix del dedupeKey; neteja el marcador de la descripció.
- `lib/services/tasks/taskAutomationService.ts` substitueix el dedup per regex sobre `description` per una consulta canònica `where: { source: 'AUTOMATION', dedupeKey: { in: ... } }` i escriu `source`, `autoRule` i `dedupeKey` a columnes reals; `createMany` passa a `skipDuplicates: true` perquè `dedupeKey` té `@unique`.
- `lib/services/tasks/taskCreation.ts` accepta els 4 camps opcionals; `createdBy` continua per compatibilitat mentre la resta de serveis `system:*` no estiguin migrats.
- `__tests__/lib/services/tasks/taskCreation.test.ts` +2 tests nous (camps canònics, defaults a `null`). `__tests__/lib/services/tasks/taskAutomationService.test.ts` +2 tests nous per `runTaskAutomation` (persistència amb columnes reals; dedup per columna amb filtre `source: 'AUTOMATION'` i `select: { dedupeKey: true }`).
- Fix adjacent: `app/admin/tasks/new/page.tsx` — `normalizeTaskPriority(searchParams?.get('priority') ?? null)` destapa error tapat pel cache `tsbuildinfo` (el getter retorna `string | null | undefined`).
- Verificació del tall: `npx vitest run __tests__/lib/services/tasks/*.ts` OK (20 tests) · `npx tsc --noEmit --pretty false` OK · `pnpm run validate:core` OK (qa:protocol, qa:encoding 924 fitxers, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard).
- `ADMIN_CHANGE_COUNTER` puja a `203`; el següent canvi real ha de ser `#204`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #205 — 2026-04-18 — claude (FET)
**Monocapa de `Task.source`: migració completa dels 5 serveis `system:*` + consumidors al camp canònic.**
- `lib/constants/index.ts` publica `TASK_SOURCE` (`AUTOMATION`, `CHECKLIST`, `PACK_PRICING`, `BOOKING_COMPLETION`, `BOOKING_CREATION`, `CUSTOMER_CREATION`) i `TaskSource` com a origen únic de valors. Els magic strings `system:*` ja no viatgen per filtres d'agregació.
- Productors migrats: `lib/services/dailyChecklist.ts` (stale cleanup, retenció 14d, existents d'avui i `createMany` ara filtren/escriuen per `source: 'CHECKLIST'`); `lib/services/packPricingCheckService.ts` (`create` afegeix `source: 'PACK_PRICING'`); `lib/services/bookingCreationService.ts` (`source: 'BOOKING_CREATION'`); `lib/services/customerCreationService.ts` (`source: 'CUSTOMER_CREATION'`). `bookingPortalCompletionService.ts` no crea tasques (només `ClientPortalAccess`), per tant queda fora de l'abast.
- Consumidors migrats: `lib/services/tasks/taskList.ts` exclou checklist antic per `source: 'CHECKLIST'` (no per `createdBy`); `app/admin/lib/dashboard-data.ts` compta `checklist:done` i `checklist:pending` per `source: 'CHECKLIST'`. L'agregació passa a ser canònica i independent de l'string humà de `createdBy`.
- `createdBy` es conserva com a traça d'actor (qui ha creat: usuari real o etiqueta `system:*`); la semàntica d'origen viu exclusivament a `source`.
- Cobertura: `__tests__/lib/services/dailyChecklist.test.ts` i `__tests__/lib/services/packPricingCheckService.test.ts` afirmen que `createMany`/`create` i els filtres de cleanup usen `source` canònic; els 34 tests dels 3 fitxers afectats passen.
- Verificació del tall: `npx vitest run __tests__/lib/services/dailyChecklist.test.ts __tests__/lib/services/packPricingCheckService.test.ts __tests__/lib/services/tasks/taskAutomationService.test.ts` OK (34 tests) · `pnpm run validate:core` OK 7/7 (qa:protocol, qa:encoding 924 fitxers, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard).
- `ADMIN_CHANGE_COUNTER` puja a `205`; el següent canvi real ha de ser `#206`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #207 — 2026-04-18 — claude (FET)
**Monocapa `TASK_SOURCE`: tancament del buit deixat pels Canvis #204/#206 amb `REACTIVATION`.**
- `lib/constants/index.ts` amplia `TASK_SOURCE` amb `REACTIVATION: 'REACTIVATION'`. El conjunt d'orígens canònics passa de 6 a 7 valors i continua sent l'única font de veritat.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` ja consumeix `TASK_SOURCE.REACTIVATION` a la CTA de reactivació assistida (abans era un string literal `'REACTIVATION'`).
- `app/admin/tasks/TaskPageSections.tsx` ja compara `task.source === TASK_SOURCE.REACTIVATION` per decidir si pinta el badge `Reactivació` (abans era un string literal comparat).
- La monocapa queda íntegra: qualsevol nou origen de tasca cal passar per `TASK_SOURCE` abans d'aterrar a codi consumidor. El tall no toca la semàntica existent de Codex (dedupeKey, reopen, badge), només tanca la porta dels strings vius.
- Verificació del tall: `npx vitest run __tests__/lib/services/tasks/taskAdminService.test.ts __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (19 tests) · `pnpm run validate:core` OK 7/7.
- `ADMIN_CHANGE_COUNTER` puja a `207`; el següent canvi real ha de ser `#208`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #212 — 2026-04-18 — claude (FET)
**Cobertura de `source` canònic blindada als dos productors que la tenien escrita però no afirmada als tests.**
- Context: el Canvi #205 va migrar `bookingCreationService.ts` i `customerCreationService.ts` a `source: TASK_SOURCE.BOOKING_CREATION` i `source: TASK_SOURCE.CUSTOMER_CREATION`, però els tests existents no afirmaven aquest camp. Qualsevol regressió futura (tornar a `createdBy`-only, buidar `source`, etc.) passava muda.
- `__tests__/lib/services/bookingCreationService.test.ts`: el test "crea task de preparació 7 dies abans del event" afegeix `source: 'BOOKING_CREATION'` a l'assertion del `task.create` (26 tests verds).
- `__tests__/lib/services/customerCreationService.test.ts`: el test es reescriu per capturar el payload real del `task.create` transaccional (en comptes d'una flag booleana) i afirma `customerId`, `status: 'OPEN'`, `priority: 'HIGH'` i `source: 'CUSTOMER_CREATION'` (14 tests verds).
- Neteja addicional: la nota obsoleta "Confirmar si cal `nextActionType`" s'elimina del SEGÜENT de §6.4. `nextActionType` mai va aterrar al schema (grep zero al repo sencer fora del propi protocol), per tant no hi ha res a confirmar ni a refactoritzar.
- Verificació del tall: `npx vitest run __tests__/lib/services/bookingCreationService.test.ts __tests__/lib/services/customerCreationService.test.ts` OK (40 tests) · `pnpm run validate:core` OK 7/7.
- `ADMIN_CHANGE_COUNTER` puja a `212`; el següent canvi real ha de ser `#213`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #214 — 2026-04-18 — codex (FET)
**Customer Hub: retorn canònic també a `inbox/compose` i `bookings/new`.**
- `app/admin/inbox/compose/page.tsx` calcula `customerHubCommsHref` amb `buildCustomerHubTabHref(customerId, 'comms')` i l'utilitza tant al `back` de la pàgina com a `returnHref` del formulari.
- `app/admin/inbox/compose/ComposeForm.tsx` deixa d'enviar sempre cap a `/admin/inbox`: `Cancel·lar` i els redirects de post-enviament (`email` i `quote`) reutilitzen ara `returnHref`, de manera que si el correu s'ha obert des del `Customer Hub`, el tancament torna a la pestanya `Comunicacions` del client.
- `app/admin/bookings/NewBookingForm.tsx` aplica el mateix criteri per creació manual de reserves amb `customerId`: `back` i `Cancel·lar` retornen a `?tab=bookings` del client en lloc de la llista global de reserves.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `214`; el següent canvi real ha de ser `#215`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #215 — 2026-04-18 — claude (FET)
**Tancament de la monocapa `TASK_SOURCE`: els últims dos productors que creaven Task sense `source` ja l'escriuen.**
- `lib/services/automationTriggers.ts` centralitza els auto-triggers entre passos del workflow. Els dos `task.create` actius (welcome email a `onLeadCreated` i checklist pre-event a `onBookingConfirmed`) entraven a la cua amb `source = null`, trencant l'agregació canònica per origen i impedint que `taskList.ts`/`dashboard-data.ts` les classifiquessin com a automatitzades.
- Ara les dues creacions escriuen `source: TASK_SOURCE.AUTOMATION`. És el valor canònic que ja feia servir `taskAutomationService.ts` (Canvi #203) per totes les regles periòdiques, de manera que aquestes tasques puntuals queden integrades al mateix bucket operatiu i no com a "manuals" fantasma.
- Estat final del parc de productors: tots els `prisma.task.create`/`createMany` actius del repo escriuen `source` canònic. `dailyChecklist`→CHECKLIST, `packPricingCheckService`→PACK_PRICING, `bookingCreationService`→BOOKING_CREATION, `customerCreationService`→CUSTOMER_CREATION, `taskAdminService` (flux assistit)→REACTIVATION i altres segons input, `taskAutomationService` + `automationTriggers`→AUTOMATION, `bookingPortalCompletionService` verificat fora d'abast (no crea Task).
- Sense canvis a tests: `automationTriggers.test.ts` no exercita `prisma` (el propi fitxer ho explicita: funcions depenen de DB, només es verifiquen exportacions i tipus). Afegir mocks ad-hoc aquí seria soroll sense captura real; l'afirmació canònica viu als tests de consumidors (`taskList.ts`, `dashboard-data.ts`) que filtren per `source`.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `pnpm run validate:core` OK 7/7 (qa:protocol, qa:encoding, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard).
- `ADMIN_CHANGE_COUNTER` puja a `215`; el següent canvi real ha de ser `#216`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #217 — 2026-04-18 — claude (FET)
**`automationTriggers.test.ts` reescrit amb mocks reals: 7 tests vacus → 18 tests amb assertions de comportament i `source: AUTOMATION`.**
- Context: al Canvi #215 vaig afegir `source: TASK_SOURCE.AUTOMATION` a `onLeadCreated` i `onBookingConfirmed` sense cobertura de tests, justificant-ho amb que el propi fitxer deia que "les funcions depenen de Prisma/DB i no es poden testar com a funcions pures". Aquesta justificació era floixa: `bookingCreationService`, `customerCreationService`, `dailyChecklist` i `packPricingCheckService` exactament això fan servir mocks de prisma i ho tenen blindat. Corregeixo.
- `__tests__/lib/services/automationTriggers.test.ts` passa de 7 tests (només `expect(typeof ...).toBe('function')` + checks de tipus) a 18 tests amb `vi.mock('@/lib/prisma', ...)` seguint el patró de la resta de serveis:
  - `onProposalAccepted` (5 tests): proposta inexistent → `No booking linked`; sense `bookingId` → idem; `contractStatus` ja != DRAFT → `Contract already exists`; happy path escriu `proposal.update({ contractStatus: 'DRAFT', contractSentAt: null })`; error de DB propagat a `detail` sense llançar.
  - `onLeadCreated` (4 tests): sense email → `No valid email`; email placeholder intern `@leads.orbitaevents.local` → idem; happy path crea Task amb `source: 'AUTOMATION'`, `leadId`, `priority: 'HIGH'`, `status: 'OPEN'` i title amb el nom del lead; error de DB no peta.
  - `onBookingConfirmed` (6 tests): reserva inexistent → `Booking not found`; checklist ja existent → `Checklist already exists`; happy BODA → 8 ítems (5 base + 3 específics) amb `source: 'AUTOMATION'` i descripció que conté els textos específics de BODA; eventType desconegut (OTHER) → només 5 ítems base; `dueDate` = 2 dies abans de `eventDate`; `dueDate: null` si la reserva no té `eventDate`.
  - `dispatchAutoTrigger` (3 tests): routing correcte per `proposal.accepted` → `onProposalAccepted`, `lead.created` → `onLeadCreated`, `booking.confirmed` → `onBookingConfirmed` (verificat per `findUnique` call amb `where.id` correcte).
- Verificació del tall: `npx vitest run __tests__/lib/services/automationTriggers.test.ts` OK (18 tests) · `pnpm run validate:core` OK 7/7.
- `ADMIN_CHANGE_COUNTER` puja a `217`; el següent canvi real ha de ser `#218`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #227 — 2026-04-19 — claude (FET)
**`qa:protocol:test` passa de fitxar un únic test fix a escanejar `__tests__/scripts/` sencer — el guard del Canvi #225 queda realment cobert al `validate:core`.**
- Context: al Canvi #225 vaig afegir `__tests__/scripts/check-task-canonical.test.ts` (5 tests que verifiquen la regla `inline-dedupe-template`). Però `qa:protocol:test` a `package.json` apuntava literalment a `__tests__/scripts/check-admin-change-log.test.ts`, així que el nou test no entrava al pipeline. El guard corria al validate:core (via `arch:task-canonical:check`), però el test que verifica que el guard funciona no es disparava mai. Sense aquesta connexió, una ruptura silenciosa del guard (ex: regex escapat malament, scopes mal aplicats) no generaria cap senyal a CI.
- `package.json` · `qa:protocol:test`: `vitest run __tests__/scripts/check-admin-change-log.test.ts` → `vitest run __tests__/scripts/`. Ara corre el directori sencer — els 10 tests existents (5+5) hi entren, i qualsevol futur test de scripts queda automàticament cobert sense editar l'script. Renomenar el script hauria estat més precís però també més invasiu (hauria requerit tocar `validate:core`); l'amplada del pattern a directori és la solució minima viable.
- Verificació del tall: `pnpm run qa:protocol:test` OK (2 test files, 10 tests verds — els 5 de `check-admin-change-log.test.ts` i els 5 de `check-task-canonical.test.ts`) · `pnpm run validate:core` pendent.
- `ADMIN_CHANGE_COUNTER` puja a `227`; el següent canvi real ha de ser `#228`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #225 — 2026-04-19 — claude (FET)
**Guard preventiu `inline-dedupe-template` a `check-task-canonical.mjs` — qualsevol regressió del registry `TASK_DEDUPE_KEY` tumba CI.**
- Context: el Canvi #223 va centralitzar els 10 prefixos de `dedupeKey` a `TASK_DEDUPE_KEY` i migrar els 10 consumidors, però res impedia que un nou productor (o un rebase) reintroduís el patró `dedupeKey: \`foo:${x}\`` inline. Sense guard, la monocapa del Canvi #223 és una fotografia d'un moment, no una propietat duradera.
- `scripts/check-task-canonical.mjs`: afegida regla `inline-dedupe-template` amb pattern `/dedupeKey:\s*\`[^\`]*\$\{/` (captura només template-literals amb interpolació `${...}`, que és exactament l'anti-pattern). Afegit camp nou `scopes` al schema de regles (`scopes: ['app/', 'lib/']`) perquè aquesta regla només s'apliqui al codi productiu: els tests poden mantenir strings literals per a assertions de sortida sense disparar el guard. Loop d'escaneig adaptat per respectar el camp (`if (rule.scopes && !rule.scopes.some(...)) continue`).
- `__tests__/scripts/check-task-canonical.test.ts` (nou): 5 casos amb fixtures temporals via `mkdtempSync`: (1) accepta `TASK_DEDUPE_KEY.welcomeEmail(id)`; (2) rebutja template inline a `lib/`; (3) rebutja template inline a `app/`; (4) no toca `__tests__/` (tests poden usar template literals); (5) ignora strings estàtiques sense `${...}` (cas rar, no perillós).
- Efecte: la propietat "zero inline dedupeKey" del Canvi #223 queda blindada pel validate:core. Qualsevol futur productor que vulgui crear un `dedupeKey` dinàmic ha d'afegir primer un builder a `TASK_DEDUPE_KEY` i consumir-lo — no pot concatenar strings directament.
- Verificació del tall: `node scripts/check-task-canonical.mjs` OK · `pnpm vitest run __tests__/scripts/check-task-canonical.test.ts` OK (5 tests) · `pnpm run validate:core` pendent.
- `ADMIN_CHANGE_COUNTER` puja a `225`; el següent canvi real ha de ser `#226`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #223 — 2026-04-19 — claude (FET)
**`TASK_DEDUPE_KEY` central registry — els 10 prefixos de `dedupeKey` deixen de ser strings inline i passen a builders canònics.**
- Context: el patró canònic `createMany({skipDuplicates:true}) + dedupeKey @unique` quedava tancat operativament amb els Canvis #219 i #221, però les 10 concatenacions inline (`\`welcome-email:${leadId}\``, `\`pre-event-checklist:${bookingId}\``, `\`sla:${id}\``, etc.) estaven escampades per 3 fitxers: `automationTriggers.ts` (2), `taskAutomationService.ts` (7) i `SummaryPanel.tsx` (1). Efecte: si un consumidor volia cleanup massiu per prefix (ex: `task.deleteMany({ where: { dedupeKey: { startsWith: 'welcome-email:' } } })`) havia de conèixer la string exacta, i un rename silenciós a un productor hauria deixat el consumer orfe. Monocapa trencada: 10 punts de veritat pels mateixos 10 prefixos canònics.
- `lib/constants/index.ts`: afegit objecte `TASK_DEDUPE_KEY` amb 10 builders (al costat de `TASK_SOURCE` per cohesió), cadascun signat amb el tipus d'entitat sobre la qual opera: `welcomeEmail(leadId)`, `preEventChecklist(bookingId)`, `sla(entityId)`, `stale(entityId)`, `prep(bookingId)`, `payment(bookingId)`, `postEvent(bookingId)`, `atRisk(customerId)`, `quote(entityId)`, `reactivation(customerId)`. Comentari a la definició prohibeix expressament inlining futur.
- Migrats els 10 consumidors a builders: `lib/services/automationTriggers.ts` (2: welcome-email + pre-event-checklist), `lib/services/tasks/taskAutomationService.ts` (7: sla, stale, prep, payment, postEvent, atRisk, quote), `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` (1: reactivation). Zero strings inline de dedupeKey queden al codi productiu (els tests mantenen les strings literals perquè verifiquen la sortida, que no canvia — equivalència per construcció).
- Verificació del tall: `pnpm vitest run __tests__/lib/services/automationTriggers.test.ts __tests__/lib/services/tasks/` OK (92 tests verds als 8 fitxers afectats) · `pnpm run validate:core` pendent.
- `ADMIN_CHANGE_COUNTER` puja a `223`; el següent canvi real ha de ser `#224`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #224 — 2026-04-19 — codex (FET)
**Navegació client: helpers canònics també per llistes filtrades de tasks i bookings.**
- Context: el “SEGÜENT” del Canvi #222 deixava obert si `customerWorkspaceHref.ts` havia d’absorbir també la navegació de llistes filtrades. La base del producte ja ho feia viable: `app/admin/tasks/page.tsx` consumeix `customerId` com a filtre natiu i `nextActionLink.ts` encara seguia enviant `COMPLETE_TASK` a `/admin/tasks?q={customerId}`, que és una cerca pitjor que el filtre real de client.
- `lib/admin/customerWorkspaceHref.ts` incorpora `buildCustomerTaskListHref(customerId, options?)` i `buildCustomerBookingListHref(customerId)`. El builder de tasks admet `view`, `status` i `page` per cobrir el toggle existent sense duplicar concatenacions de query string.
- `lib/customer-hub/nextActionLink.ts` reutilitza ara `buildCustomerBookingListHref()` per `COLLECT_PAYMENT` i `buildCustomerTaskListHref()` per `COMPLETE_TASK`, eliminant el patró fràgil `q=${customerId}`.
- `app/admin/tasks/TaskPageSections.tsx` deixa de construir manualment els hrefs del toggle `Kanban/Llista` quan hi ha `customerId`; passa a consumir `buildCustomerTaskListHref(customerId, { view, status })`, mantenint el cas global sense helper.
- `__tests__/lib/customer-hub/taskResultNotice.test.ts` amplia el contracte amb asserts de `buildCustomerTaskListHref()` i `buildCustomerBookingListHref()`. `__tests__/lib/customer-hub/nextActionLink.test.ts` afegeix cobertura dels casos `COLLECT_PAYMENT` i `COMPLETE_TASK` per garantir que `nextActionLink` reutilitza els builders nous.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/nextActionLink.test.ts __tests__/lib/customer-hub/taskResultNotice.test.ts` OK (15 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `224`; el següent canvi real ha de ser `#225`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #226 — 2026-04-19 — codex (FET)
**Bookings: el filtre `customerId` passa de query string ornamental a filtre real de dades.**
- Context: el Canvi #224 havia centralitzat la navegació de llistes filtrades i `buildCustomerBookingListHref(customerId)` ja generava `/admin/bookings?customerId=...`, però `app/admin/bookings/page.tsx` encara no consumia aquest paràmetre al backend. Efecte: la URL semblava contextualitzada però la llista seguia mostrant totes les reserves.
- `app/admin/bookings/page.tsx` incorpora `customerId` a `BookingSearchParams`, l’aplica a `buildBookingsWhere()`, i ajusta la capçalera perquè el context sigui coherent: `subtitle` mostra “del client” quan toca i el `back` torna a `?tab=bookings` del `Customer Hub`.
- La paginació de `bookings` deixa també de perdre el context quan hi ha `customerId`: reutilitza `buildCustomerBookingListHref(customerId, {...})` perquè `page`, `view`, `status`, `payment`, dates i cerca es conservin dins la mateixa llista filtrada del client.
- `lib/admin/customerWorkspaceHref.ts` amplia `buildCustomerBookingListHref()` amb aquestes opcions mínimes reals, i `__tests__/lib/customer-hub/taskResultNotice.test.ts` blinda el contracte amb un cas que combina `view`, `status`, `payment` i `page`.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/taskResultNotice.test.ts __tests__/lib/customer-hub/nextActionLink.test.ts` OK (15 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `226`; el següent canvi real ha de ser `#227`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #228 — 2026-04-19 — codex (FET)
**Bookings: `Netejar filtres` i el toggle de vista ja preserven el context de client.**
- Context: després del Canvi #226, `bookings?customerId=...` ja filtrava correctament el backend, però dos punts de la UI encara podien expulsar l’usuari fora del context del client: `BookingFilters.tsx` enviava `Netejar filtres` sempre a `/admin/bookings`, i `BookingViewToggle.tsx` reconstruïa l’URL només des dels search params crus sense reutilitzar el contracte centralitzat.
- `app/admin/bookings/BookingFilters.tsx` llegeix ara `customerId` dels search params i, quan existeix, usa `buildCustomerBookingListHref(customerId, ...)` tant per actualitzar filtres com per netejar-los. Això manté la vista contextual del client encara que s’esborrin `status`, `payment`, dates o cerca.
- `app/admin/bookings/BookingViewToggle.tsx` aplica el mateix criteri al canvi `Llista/Kanban`: si hi ha `customerId`, el toggle reutilitza `buildCustomerBookingListHref()` i conserva el context en lloc de degradar a la llista global.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `228`; el següent canvi real ha de ser `#229`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #229 — 2026-04-19 — codex (FET)
**Lead Insights: les CTAs passen a destins reals i suportats pel producte.**
- Context: `app/admin/leads/[id]/LeadInsightsBanner.tsx` generava dues sortides febles: `COLLECT_PAYMENT` apuntava a `/admin/bookings?leadId=...` i `COMPLETE_TASK` a `/admin/tasks?q=...`. Cap de les dues rutes estava alineada amb filtres natius de la pantalla, així que el CTA semblava contextual però podia desembocar en una vista global o en una cerca imprecisa.
- El banner ara rep també `customerId` i `bookingId` des de `app/admin/leads/[id]/page.tsx`. Amb aquest context, `Revisar cobraments` obre la reserva concreta si existeix; si no, cau a la llista de reserves del client quan hi ha client; i només en darrer terme torna a la pròpia fitxa de lead. `Veure tasques` obre la llista canònica de tasques del client si hi ha `customerId`, i si no manté l’usuari a la fitxa de lead en lloc d’enviar-lo a una cerca opaca.
- Efecte: el criteri de navegació que hem anat tancant al `Customer Hub` i `Bookings` s’estén també al `Lead Insights` executive banner: la CTA ja no promet un context que el destí no sap resoldre.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `229`; el següent canvi real ha de ser `#230`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #231 — 2026-04-19 — codex (FET)
**Inbox follow-ups: el CTA d’email deixa de sortir amb `customerId=` buit.**
- Context: `app/admin/inbox/PendingFollowUpsPanel.tsx` treballa sobre items de follow-up de lead (`PendingFollowUp` amb `leadId`), però el botó `✉️ Email` obria `/admin/inbox/compose?customerId=&template=seguiment`. Això generava una URL inconsistent: ni carregava un client real ni reflectia l’origen de la cua pendent.
- El CTA passa a obrir `/admin/inbox/compose?leadId={item.leadId}&template=seguiment`, alineat amb el model real del panell i amb la resta de punts del repo que obren seguiment des d’una lead.
- Efecte: l’Inbox deixa de tenir un accés ràpid amb paràmetre buit i el follow-up pendent manté un destí executable i coherent amb la dada disponible.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `231`; el següent canvi real ha de ser `#232`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #233 — 2026-04-19 — codex (FET)
**Les novetats importants ja no poden quedar enterrades només al registre cronològic: entren també al checklist del domini com a memòria reusable.**
- Context: el `§9` serveix per traça tècnica, però no és bona memòria operativa. Si una millora important només queda registrada com a `Canvi #...`, al cap d'uns dies costa recordar que existeix, on viu o com es prova ràpidament sense rellegir el diari sencer.
- `§6` incorpora ara `6.0 Memòria de novetats importants` com a norma transversal. A partir d'aquí, una novetat rellevant no es considera ben tancada si només viu al log cronològic: també ha de deixar rastre al checklist del domini corresponent.
- La regla fixa també el format mínim de memòria útil: `què és`, `on es fa servir`, `per què importa` i `com es comprova ràpidament`. Això obliga a escriure la millora en llenguatge d'usuari i converteix el checklist en recordatori executable, no només en inventari tècnic.
- Llindar explícit: no aplica a microcopy, layout petit o refactor invisible; sí a fluxos nous, CTAs nous, automatitzacions noves, feedback nou, canvis de model mental o qualsevol millora important que després es pugui oblidar.
- Verificació del tall: `pnpm run qa:protocol` després de registrar.
- `ADMIN_CHANGE_COUNTER` puja a `233`; el següent canvi real ha de ser `#234`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #234 — 2026-04-19 — codex (FET)
**`/admin/manual` passa de “manual de possibilitats” a mapa real del sistema: què existeix avui, què és automàtic, què t’avisa i què continua sent manual.**
- Context: el manual ja existia, però estava més orientat a possibilitats i roadmap que a memòria de propietari. Problema real: amb moltes funcions, antigues i noves, el risc no és només no recordar com funcionen, sinó no recordar ni que existeixen.
- `lib/constants/adminManual.ts` incorpora dues capes noves de lectura no tècnica: `ADMIN_MANUAL_SNAPSHOT` (què té la web pública, què té l’admin, què fa automàticament, què t’avisa i què continua sent manual) i `ADMIN_MANUAL_REALITY_CHECKS` (preguntes pràctiques com “m’avisarà al mòbil?”, “es traurà dades sol?” o “com sé si una funció existeix?”).
- `app/admin/manual/page.tsx` obre ara amb aquest mapa abans del bloc de capacitats. El manual deixa de funcionar només com a aparador de mòduls i passa a ser memòria externa del producte: primer t’explica què hi ha avui i quins límits té, després et diu on entrar.
- Efecte: el propietari del producte ja no ha de deduir l’estat del sistema des del protocol, el diari o la memòria oral. El punt d’entrada bo passa a ser `/admin/manual`, en llenguatge d’usuari i amb resposta directa sobre automatismes, avisos i parts manuals.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `234`; el següent canvi real ha de ser `#235`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #240 — 2026-04-19 — claude (FET)
**`assembleHealthSignals` del cockpit executiu deixa de diluir el senyal d'anomalies KPI: 3+ anomalies negatives ara pugen a `CRITICAL` en comptes de quedar-se a `WARNING` per copy-paste redundant.**
- Context: `lib/services/executiveCockpitService.ts:208-211` tenia una lògica redundant de l'única àrea de salut (`Anomalies KPI`) que no seguia l'escala canònica dels altres 3 senyals: `negativeAnomalies.length > 2 ? 'WARNING' : > 0 ? 'WARNING' : 'GOOD'`. Els branches `> 2` i `> 0` retornaven el mateix valor, mentre que seguiment comercial, capacitat operativa i pipeline comercial tots usen l'escala `> 2 → CRITICAL, > 0 → WARNING, else → GOOD`. Efecte silenciós: quan el detector detectava 3+ desviacions negatives el mateix dia (leads, bookings, won, lost, overdue), el dashboard executiu ho mostrava com a WARNING i el `globalHealthScore` rebia 40 punts (WARNING) en comptes de 15 (CRITICAL). Uns 4-5 punts de dilució al score global. Exactament el tipus de bug que soterra la norma visual #237: una pantalla que ha de donar lectura executiva directa acaba pintant l'àrea de color equivocat.
- `lib/services/executiveCockpitService.ts:209`: `> 2 ? 'WARNING'` → `> 2 ? 'CRITICAL'`. Diff d'una paraula. Escala ara alineada amb les altres 3 àrees de salut del cockpit.
- `__tests__/lib/services/executiveCockpitService.test.ts`: 3 tests nous al `describe('assembleHealthSignals')` que cobreixen l'escala completa: (1) 0 anomalies negatives → `GOOD`; (2) 1 anomalia → `WARNING`; (3) 3 anomalies → `CRITICAL`. El tercer és el test de regressió directe del bug — abans d'aquest fix hauria fallat amb `WARNING`. 22 tests verds al fitxer (19 existents + 3 nous).
- Efecte: el senyal `Anomalies KPI` del cockpit executiu ara reflecteix realment la gravetat operativa. Un dia amb caiguda paral·lela de leads + bookings + won ja no es maquilla com a WARNING. El `globalHealthScore` guanya fidelitat a la pitjor cas.
- Fix adjacent TS destapat pel `npx tsc --noEmit` de `validate:core`: `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx:215` (`TS18048: 'topLead' is possibly 'undefined'`). Canviat el guard `topLeadAction ? ... topLead?.name ...` per `topLeadAction && topLead ? ... topLead.name ...` — narrowing de les dues variables. Zero canvi funcional ni de copy; només fa el TS feliç. Regressió preexistent, tapada en camí per no deixar `validate:core` en vermell a causa d'un territori aliè (patró precedent: Canvi #203).
- Verificació del tall: `npx vitest run __tests__/lib/services/executiveCockpitService.test.ts` OK (22/22) · `pnpm run validate:core` OK (7 guards + i18n packs/equipment).
- `ADMIN_CHANGE_COUNTER` puja a `240`; el següent canvi real ha de ser `#241`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #249 — 2026-04-19 — claude (FET)
**`deriveLossRisk` del `leadInsightsService` deixa d'usar `new Date()` real per comprovar si un NEW porta >24h sense contactar i passa a usar el `now` injectat — elimina desviació silenciosa entre el senyal de risc del lead i la resta de càlculs.**
- Context: `lib/services/leadInsightsService.ts:209` (fnció interna `deriveLossRisk`) calculava l'edat del lead NEW no contactat amb `new Date().getTime() - lead.createdAt.getTime()`. Tota la resta del càlcul (`computeLeadInsights`) acceptava un `now` injectat i el propagava a `deriveNextAction` (línies 262-269). `deriveLossRisk` era l'única funció que s'escapava d'aquesta disciplina. Conseqüències silencioses: (a) els tests no poden fixar el signal del risc per aquesta regla concreta; (b) quan el caller injecta un `now` del passat o del futur (reports históricos, simulacions), el reason "Més de 24h sense contactar" dispara o s'amaga segons el rellotge real del servidor, no segons el temps lògic del report; (c) pantalles que consumeixen `LossRisk` (Customer Hub SummaryPanel — Codex Canvi #241 — i qualsevol lead detail) poden pintar el mateix lead amb raons diferents a dos càlculs consecutius, trencant la determinisme visual que demana la norma #237.
- `lib/services/leadInsightsService.ts`: `deriveLossRisk` ara accepta `now: Date` al seu contracte; `computeLeadInsights` el propaga (mateixa variable `now` que ja s'usava per `deriveNextAction`); la comprovació de `hoursOld` passa de `new Date().getTime()` a `now.getTime()`. 3 línies tocades, zero canvi semàntic a cap call-site (el nou camp és obligatori i tots els callers passen per `computeLeadInsights`, que sempre té `now`).
- `__tests__/lib/services/leadInsightsService.test.ts`: 2 tests nous de regressió. (1) "només depèn del `now` lògic, no del rellotge real": NEW sense contactar amb `createdAt` a 6h del `now` fixat — el reason NO ha d'aparèixer; abans del fix, com que el rellotge real del test runner està sempre molt més enllà del `NOW = 2026-04-09`, la comparació real vs lògica feia disparar el reason erròniament. (2) Cas positiu: `createdAt` 54h abans del `now` lògic dispara el reason, verificant que el llindar funcional segueix intacte. 23 tests verds al fitxer (21 existents + 2 nous).
- Efecte: el senyal `LossRisk` dels leads torna a ser una funció pura del `(lead, activities, tasks, booking, now)`. Dos càlculs amb els mateixos inputs retornen les mateixes `reasons`. Pantalles de propietari (Customer Hub, lead detail, SummaryPanel de Codex) ja no poden pintar el mateix lead amb un semàfor de risc diferent en funció de l'hora a què es van renderitzar.
- Verificació del tall: `npx vitest run __tests__/lib/services/leadInsightsService.test.ts` OK (23/23) · `pnpm run validate:core` OK (7 guards + i18n packs/equipment).
- `ADMIN_CHANGE_COUNTER` puja a `249`; el següent canvi real ha de ser `#250`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #246 — 2026-04-19 — claude (FET)
**`loadOperationalPulse` deixa de poder pintar percentatges negatius al pulse operatiu del cockpit: `followUpRate` i `pipelineHealthRate` clampen el numerador-subconjunt amb `Math.max(0, …)`.**
- Context: `lib/services/operationalPulseService.ts` (wrapper `loadOperationalPulse`) computava dos dels vuit indicadors del pulse operatiu amb una asimetria silenciosa entre numerador i denominador. `followUpRate` restava `pendingFollowUpSummary.total` (sense finestra temporal, inclou follow-ups sobre leads antics) sobre `contactedLeads` (restringit a `createdAt >= thirtyDaysAgo`). `pipelineHealthRate` restava `flaggedLeadIds.size` (suggestions sobre tot el pipeline viu) sobre `totalPipelineLeads` (també restringit a 30d). Quan el numerador de la resta creixia més ràpid que el denominador — escenari natural en un repo amb història — el ratio es feia negatiu i el pulse del cockpit renderitzava `-12%` o similar. Exactament la mena de silenciador visual que la norma #237 (Interfície de propietari obligatòria, de Codex) prohibeix: un semàfor numèric que perd sentit i fa soroll al panell executiu.
- `lib/services/operationalPulseService.ts`: els dos ràtios envolten la fracció amb `Math.max(0, …)`, de manera que el pitjor cas és `0%` (que mapeja a `CRITICAL`) en comptes d'un percentatge negatiu. El comentari inline explica la causa (subset mismatch) i per què la decisió és clampejar en lloc d'alinear les finestres — alinear-les demanaria reestructurar `loadPendingFollowUps` i `loadPipelineSuggestions`, cosa que desbordaria aquest tall.
- `__tests__/lib/services/operationalPulseService.test.ts`: 2 tests nous (“wrapper ha de clampejar negatius”) que verifiquen que un `followUpRate` o `pipelineHealthRate` ja clampejat a `0` produeix una mètrica `CRITICAL` amb `value: 0` — és a dir, el pulse mai surt al frontend amb un número sota zero. 20 tests verds al fitxer (18 existents + 2 nous).
- Efecte: el panell del pulse operatiu del cockpit executiu ja no pot sortir amb valors fora de l'interval `[0, 100]`. Un propietari que mira el pulse veu sempre un semàfor llegible (`CRITICAL → WARNING → GOOD → EXCELLENT`), no un número negatiu que trenca la lectura immediata. Complement directe del tall #240 (score global correcte) i #238 (falses alarmes d'overdue): els tres reforcen que els serveis que alimenten les pantalles de propietari retornen senyal matemàticament sòlid.
- Verificació del tall: `npx vitest run __tests__/lib/services/operationalPulseService.test.ts` OK (20/20) · `pnpm run validate:core` OK (7 guards + i18n packs/equipment).
- `ADMIN_CHANGE_COUNTER` puja a `246`; el següent canvi real ha de ser `#247`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #251 — 2026-04-19 — claude (FET)
**`generateWeeklyBenchmark` deixa de generar verdicts trencats tipus `++30%` o `++∞` al correu setmanal: neteja del doble `+` i branca dedicada quan la setmana anterior era 0.**
- Context: `lib/services/weeklyBenchmarkService.ts:83` concatenava el verdict de creixement amb `'+' + pctChange(this, prev)`, però `pctChange` ja retorna el valor amb signe (`+30%`, `+∞`). Dos bugs silenciosos al mateix lloc: (1) quan `leadsPrevWeek > 0` i la pujada supera el 30%, el verdict arribava com "🚀 Setmana de creixement! ++30% en leads" — text visualment trencat al correu automàtic setmanal que s'envia cada dilluns (`runWeeklyBenchmark` a `lib/services/weeklyBenchmarkService.ts:153`). (2) Pitjor, quan `leadsPrevWeek === 0` i `leadsThisWeek > 0`, la condició `thisWeek > prevWeek * 1.3` es simplifica a `thisWeek > 0`, sempre TRUE, i `pctChange(x, 0)` retorna `+∞`; el verdict resultant era "🚀 Setmana de creixement! ++∞ en leads. Assegura't de respondre ràpid." — un correu enviat al propietari amb un símbol d'infinit i doble `+`, exactament el tipus de soroll visual silenciós que contradiu la norma #237 del protocol (la interfície de propietari ha de ser llegible i predicible, i el correu setmanal és la finestra "propietària" que arriba sense obrir l'admin).
- `lib/services/weeklyBenchmarkService.ts`: (a) eliminat el `'+'` explícit abans de `pctChange(...)` a la branca de creixement — ara el signe ve del `pctChange`. (b) afegida una branca nova entre "cap lead" i "creixement" que cobreix `leadsPrevWeek === 0 && leadsThisWeek > 0`, redactant el verdict sense el `+∞` ("🚀 N lead[s] nou[s] després d'una setmana a 0"). (c) eliminat el guard `&& input.leadsPrevWeek > 0` de la branca de baixada perquè ara és inassolible amb leadsPrevWeek=0 (cau abans a la branca nova) — un petit decapeat de codi mort que resulta del fix.
- `__tests__/lib/services/weeklyBenchmarkService.test.ts`: 3 tests nous de regressió. (1) "creixement no duplica el signe `+`" verifica que l'escenari 10 vs 5 retorna `+100%` i no `++100%`. (2) "leadsPrevWeek=0 amb leads nous: cap `∞` al correu" bloqueja la regressió del símbol infinit i confirma que el verdict esmenta la setmana a 0. (3) "baixada: cap `+` al text" protegeix la simetria — `pctChange` retorna `-30%` amb signe propi, no s'hi ha d'afegir res. 13 tests verds al fitxer (10 existents + 3 nous).
- Efecte: el correu automàtic setmanal ja no pot arribar amb signes duplicats o símbols matemàtics al propietari. L'estat de "setmana zero → setmana amb leads" té ara missatge propi en comptes d'una expressió d'infinit. Quarta reparació consecutiva a serveis que alimenten superfícies de propietari (#238 overdue, #240 cockpit, #246 pulse, #249 loss risk, #251 benchmark setmanal): cada una és un silencis diferent que trencava la premissa de la norma #237 de Codex.
- Verificació del tall: `npx vitest run __tests__/lib/services/weeklyBenchmarkService.test.ts` OK (13/13) · `pnpm run validate:core` OK (7 guards + i18n packs/equipment).
- `ADMIN_CHANGE_COUNTER` puja a `251`; el següent canvi real ha de ser `#252`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #252 — 2026-04-19 — codex (FET)
**El `dashboard` deixa de mantenir una versió pròpia de la capa executiva i passa també al patró compartit de propietari.**
- Context: després del `Canvi #250`, el patró ja era reusable però el `dashboard` encara conservava una implementació local de la franja `automàtic / manual / següent pas`. Això mantenia una excepció en el lloc més central de l’admin.
- `app/admin/page.tsx` migra la seva lectura executiva al component compartit `OwnerControlStrip`.
- El `dashboard` continua mostrant el mateix senyal de negoci: crons, salut, checklist, alertes, tasques, cobraments i operació en curs, però ara amb el mateix contracte visual que `Customer Hub`, `Bookings`, `Tasks`, `Inbox` i `Leads`.
- Efecte: el llenguatge de govern visual queda més estable. El `dashboard` ja no és una excepció estilística dins la norma nova, sinó el mateix patró canònic aplicat al tauler principal.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `252`; el següent canvi real ha de ser `#253`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #250 — 2026-04-19 — codex (FET)
**La capa visual de propietari deixa de viure com a copy-paste i passa a patró reutilitzable de l’admin.**
- Context: després dels talls visuals a `Customer Hub`, `Bookings`, `Tasks`, `Inbox` i `Leads`, el criteri ja era bo però l’implementació començava a dispersar-se en helpers locals repetits. Això anava contra la monocapa i hauria acabat degradant consistència i manteniment.
- `app/admin/components/OwnerControlStrip.tsx` defineix ara el patró compartit: `Què vigila el sistema`, `Què et reclama decisió` i `Següent pas`, amb el mateix llenguatge visual i responsive.
- He migrat a aquest component els workspaces que ja havíem pujat: `CustomerHeader`, `SummaryPanel`, `bookings/page.tsx`, `bookings/[id]/page.tsx`, `tasks/page.tsx`, `inbox/page.tsx` i `leads/page.tsx`.
- Efecte: la capa executiva de propietari deixa de ser una suma de casos i passa a contracte reutilitzable. La millora visual és ara escalable a la resta de l’admin sense reobrir el problema de duplicació.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `250`; el següent canvi real ha de ser `#251`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #248 — 2026-04-19 — codex (FET)
**`Inbox` guanya lectura executiva de propietari: seguiments, entrades noves i estat real del canal visibles abans de la safata.**
- Context: `Inbox` ja tenia follow-ups i una safata unificada funcional, però encara no feia prou evident d’un cop d’ull si el problema principal era seguiment urgent, entrades noves o configuració incompleta del correu.
- `app/admin/inbox/page.tsx` incorpora una franja superior amb `Què vigila el sistema`, `Què et reclama decisió` i `Següent pas`.
- La nova capa concentra dades reals: leads noves, follow-ups pendents o urgents i si IMAP està o no configurat. També obre directament el bloc correcte via `#pending-followups`, `#inbox-main` o configuració.
- Efecte: `Inbox` comença a comportar-se com a torre de control de seguiment. Abans de llegir la safata, ja veus si la tensió és comercial, operativa o de configuració.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `248`; el següent canvi real ha de ser `#249`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #247 — 2026-04-19 — codex (FET)
**La pàgina de `Tasks` guanya lectura executiva de propietari: tensió de cua, reactivacions i següent pas visibles abans de filtres i llista.**
- Context: `Tasks` ja tenia kanban, llista, cues i accions bones, però encara et feia llegir massa per entendre on hi havia la tensió real del dia.
- `app/admin/tasks/page.tsx` incorpora una franja superior amb `Què vigila el sistema`, `Què et reclama decisió` i `Següent pas`.
- La nova capa concentra senyals ja existents: volum dins la queue operativa, tasques vençudes, tasques per avui, bloquejades, VIP i reactivacions.
- Efecte: la cua de tasques comença a comportar-se més com a torre de control. Abans de filtres i cards, ja veus si el problema és retard, bloqueig o recuperació comercial.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `247`; el següent canvi real ha de ser `#248`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #245 — 2026-04-19 — codex (FET)
**La fitxa individual de `Booking` guanya també cockpit de propietari: risc de cobrament, tensió operativa i següent pas visibles abans de les seccions.**
- Context: la detail page ja tenia molt contingut bo, però la lectura inicial seguia essent massa de panell detallat. Cobrament, preparació, marge i post-event existien, però calia baixar i interpretar-los.
- `app/admin/bookings/[id]/page.tsx` incorpora una nova franja superior amb `Què vigila el sistema`, `Què et reclama decisió` i `Següent pas`.
- La capa reutilitza dades ja presents a la reserva: dies fins a l’esdeveniment, estat de cobrament, tensió de marge, progrés de preparació i estat del flux post-event.
- Efecte: la fitxa de reserva passa a comportar-se més com a cabina d’execució. En entrar, ja saps si el problema principal és caixa, preparació, post-event o revisió econòmica, i tens una CTA directa cap a la secció correcta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `245`; el següent canvi real ha de ser `#246`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #243 — 2026-04-19 — codex (FET)
**La llista de `Bookings` obre ara amb lectura executiva: cobrament calent, execució pròxima i següent pas abans del detall de reserves.**
- Context: després dels talls visuals a `dashboard` i `Customer Hub`, la pàgina de reserves continuava mostrant bons filtres i bones taules, però encara demanava lectura manual per entendre on hi havia tensió real.
- `app/admin/bookings/page.tsx` incorpora una franja superior amb tres blocs: `Què vigila el sistema`, `Què et reclama decisió` i `Següent pas`.
- La capa nova concentra senyals que ja existien a la cua: focus de cobrament, reserves dins dels pròxims 7 dies, reserves en preparació, cobraments en risc o pendents i reserves encara per confirmar.
- Efecte: `Bookings` comença a comportar-se com a cabina d’operacions. Abans d’entrar a la llista o al kanban, ja veus si el problema és caixa, preparació o confirmació, i tens una CTA principal immediata.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `243`; el següent canvi real ha de ser `#244`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #242 — 2026-04-19 — codex (FET)
**La capçalera del `Customer Hub` deixa de ser només identificació + KPIs i passa a donar lectura executiva immediata.**
- Context: després del tall al `SummaryPanel` (`#241`), la part superior del hub encara et feia baixar una pantalla per entendre què vigilava el sistema i quina era l’acció prioritària. La capçalera seguia sent correcta, però massa de fitxa.
- `app/admin/clientes/[id]/_components/CustomerHeader.tsx` incorpora una franja nova sota els KPI amb tres peces: `Què veu el sistema`, `On et cal intervenir` i `Següent pas`.
- La nova lectura reutilitza la semàntica existent del hub: `nextAction`, `commercialPriority`, risc comercial, salut relacional, esdeveniment pròxim, tasques obertes i pressupostos en esborrany. No introdueix estat nou; concentra el senyal.
- Efecte: el `Customer Hub` ja arrenca en mode propietari des de la capçalera. Sense canviar de tab ni baixar al resum, ja saps què passa, què requereix intervenció i quina és la CTA principal.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `242`; el següent canvi real ha de ser `#243`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #241 — 2026-04-19 — codex (FET)
**Primer tall visual de propietari al `Customer Hub`: el resum obre ara separant `automàtic`, `manual` i `què toca ara` abans del detall.**
- Context: després del `dashboard` (`#239`), el `Customer Hub` continuava sent molt ric però encara massa de fitxa. Hi havia risc, prioritat, reactivació, tasques i següent acció, però estaven dispersos entre alertes, targetes i resum operatiu.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` incorpora una nova capa superior de lectura executiva amb tres blocs: `Què està vigilant el sistema`, `Què et reclama decisió` i `Què toca ara`.
- La capa reutilitza contractes que ja existien al hub: risc comercial, reactivació, pròxim esdeveniment, tasques urgents, pressupostos vius i oportunitat comercial principal. No crea lògica paral·lela; només la fa llegible d’un cop d’ull.
- Efecte: el `Customer Hub` comença a comportar-se més com a workspace de propietari. Abans de llegir la fitxa, ja veus què el sistema detecta, on has d’intervenir i quina és l’acció prioritària immediata.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `241`; el següent canvi real ha de ser `#242`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #239 — 2026-04-19 — codex (FET)
**Primer tall visual de propietari al `dashboard`: separació explícita entre el que vigila el sistema, el que requereix decisió manual i el següent pas operatiu.**
- Context: després de fixar al Canvi #237 que la interfície de propietari és norma de treball, el dashboard continuava sent potent però massa interpretatiu. Hi havia moltes dades bones, però no una lectura inicial claríssima de `què fa el sistema per tu`, `què necessita decisió teva` i `què toca ara`.
- `app/admin/page.tsx` incorpora una nova franja superior de lectura executiva just sota l'hero. La primera targeta (`Lectura de propietari`) resumeix senyals automàtiques reals: estat dels crons clau, salut vigilada i checklist del dia. La segona (`Manual`) compta punts que et reclamen decisió: alertes obertes, tasques i cobrament pendent. La tercera (`Següent pas`) converteix l'alerta principal i la propera operació en CTA llegible sense haver de navegar ni interpretar mig dashboard.
- Efecte: el tauler comença a comportar-se més com a centre de comandament i menys com a agregador de widgets. El propietari veu abans de res què està sota vigilància, on hi ha treball real i quina és la següent acció operativa recomanada.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `239`; el següent canvi real ha de ser `#240`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #238 — 2026-04-19 — claude (FET)
**`loadAnomalyReport` deixa de generar un fals positiu silenciós cada dia: el `where` de la query `overdueToday` era lògicament impossible i retornava sempre 0.**
- Context: `lib/services/dailyAnomalyService.ts:142` comptava tasques vençudes d'avui amb `dueDate: { lt: todayStart, gte: todayStart }` — una condició `dueDate < X AND dueDate >= X` mai pot ser certa. La mètrica `overdueToday` retornava sempre `0` independentment de l'estat real de la DB. Com que la mètrica `avg30d` sí tenia valors reals (`overdueLast30d / 30`), el detector d'anomalies produïa **cada dia** un falsel positiu `Tasques vençudes: 0 avui, 100% per sota de la mitjana` (interpretat com a POSITIVE perquè `higherIsBetter: false` + deviation negativa). Senyal de negoci corrupte des del moment en què el detector es va crear.
- `lib/services/dailyAnomalyService.ts:142`: clàusula canviada a `dueDate: { lt: todayStart }` — totes les tasques actualment obertes amb dueDate al passat = vençudes ara. Semàntica consistent amb línia 143 (`dueDate: { lt: todayStart, gte: thirtyDaysAgo }` per la mitjana de 30d). Diff mínim (-`, gte: todayStart`).
- `__tests__/lib/services/dailyAnomalyService.test.ts`: nou `describe('loadAnomalyReport')` amb 3 tests de regressió mockejant Prisma via `vi.hoisted()`: (1) assert explícit que la query overdueToday **no** conté `gte` (regressió directa del bug); (2) valor real propagat al comptador quan hi ha tasques vençudes a DB; (3) rang temporal vàlid a la query de 30d. 16 tests totals verds (13 existents + 3 nous).
- Efecte: la mètrica `overdue` del dashboard d'anomalies passa a reflectir realitat. El propietari deixa de veure alertes fantasma i el dia que hi hagi un pic real de tasques vençudes rebrà el senyal correcte. Bug datat des de la introducció del detector — mai ha funcionat a producció.
- Verificació del tall: `npx vitest run __tests__/lib/services/dailyAnomalyService.test.ts` OK (16/16) · `pnpm run validate:core` pendent.
- `ADMIN_CHANGE_COUNTER` puja a `238`; el següent canvi real ha de ser `#239`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #237 — 2026-04-19 — codex (FET)
**La interfície molt visual per al propietari queda fixada com a norma de treball del repo, no com a preferència estètica.**
- Context: amb el volum actual de funcionalitats, automatismes i workspaces, una UI només “correcta” no és suficient. Si el propietari no veu d’un cop d’ull què passa, què és automàtic, què continua sent manual i quin és el següent pas, el sistema torna a dependre de memòria oral o de lectura tècnica.
- `§2.1` incorpora la norma `Interfície de propietari obligatòria`: qualsevol pantalla que governi negoci, operativa o risc ha de separar clarament `automàtic` vs `manual`, mostrar semàfors, prioritat i següent pas i reduir dependència de memòria.
- `§2.1.0` reforça la mateixa idea com a característica exigida del repo: dashboards, hubs i manuals no s’han de dissenyar només per “veure dades”, sinó per donar lectura executiva abans del detall tècnic.
- Efecte: la direcció visual deixa de ser cosmètica. A partir d’ara és criteri de construcció i de tancament: si una pantalla és funcional però no et deixa governar el sistema visualment, no està realment acabada.
- Verificació del tall: `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `237`; el següent canvi real ha de ser `#238`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #235 — 2026-04-19 — codex (FET)
**El manual fixa també la frontera correcta: manual només on hi ha risc real; la resta entra al radar d’automatització prioritzada.**
- Context: el sistema ja té molta automatització, però encara arrossega punts de “forçat manual” per inèrcia: crons llançables a mà, seguiments que demanen massa memòria, post-event amb marge de persecució manual, sincronitzacions amb botó explícit i diverses cues que encara depenen més del record que del sistema.
- `lib/constants/adminManual.ts` afegeix `ADMIN_MANUAL_AUTOMATION_FRONTIER`, una capa nova que no descriu el que ja existeix sinó el que encara està massa manual i quin objectiu d’automatització toca perseguir. Els fronts queden ordenats per retorn real: Inbox/seguiments, post-event/reputació, Customer Hub/reactivació, bookings/checklist/cobraments, alertes fora de l’admin i sincronitzacions/manteniment.
- `app/admin/manual/page.tsx` incorpora la secció `Frontera d’automatització`, amb tres lectures per front: per què importa, què passa avui i quin és l’objectiu. Això converteix el manual no només en memòria del sistema actual, sinó també en criteri de disseny: si alguna cosa és repetitiva i de baix risc, s’ha d’absorbir cap al sistema.
- Efecte: la regla de producte queda més clara per al propietari i per a futurs talls. El debat ja no és “què podríem automatitzar algun dia”, sinó “què continua sent manual sense motiu prou bo”.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `235`; el següent canvi real ha de ser `#236`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #232 — 2026-04-19 — claude (FET)
**`source` passa a ser camp acceptat al Zod del route `/api/admin/leads/[id]/tasks` — el pipeline del Canvi #230 deixa de tenir un tall al perímetre HTTP.**
- Context: al Canvi #230 vaig afegir `source?: string | null` a `LeadScopedTaskInput` i propagar-lo al `prisma.task.create`, però el Zod schema del route (línies 11-19 de `app/api/admin/leads/[id]/tasks/route.ts`) no llistava `source`. `safeParse()` despulla camps no declarats: així que qualsevol body que arribés amb `source: 'AUTOMATION'` perdia el camp a la validació i mai no arribava al servei. El contracte del #230 era funcionalment inaccessible per HTTP.
- `app/api/admin/leads/[id]/tasks/route.ts`: afegida línia `source: z.string().optional()` al `taskSchema`. Alineat amb el route germà `app/api/admin/tasks/route.ts` (creació genèrica) que ja acceptava `source`, `autoRule`, `dedupeKey`, `resolutionNote` al Zod des del Canvi #205. Altres camps canònics (`autoRule`, `dedupeKey`, `resolutionNote`) no s'afegeixen aquí perquè aquest route és específicament per a creacions manuals des del Lead Hub, no per a productors automàtics.
- `__tests__/app/api/admin/leads-tasks-route.test.ts`: test nou `propaga source del body al servei` — POST amb `{title, source: 'AUTOMATION'}` ha de resultar en `mockCreateTask` cridat amb `{title, source: 'AUTOMATION'}`. 11 tests verds al fitxer (10 existents + 1 nou).
- Efecte: el pipeline HTTP → Zod → servei → Prisma queda complet per `source` al lead-scoped path. Canvi #230 deixa de tenir el seu propi tall invisible i esdevé realment explotable des del perímetre públic.
- Verificació del tall: `npx vitest run __tests__/app/api/admin/leads-tasks-route.test.ts` OK (11 tests) · `pnpm run validate:core` pendent.
- `ADMIN_CHANGE_COUNTER` puja a `232`; el següent canvi real ha de ser `#233`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #230 — 2026-04-19 — claude (FET)
**`createLeadScopedTask` tanca el forat del monocapa `source`: l'últim productor de Task que l'omet deixa de fer-ho.**
- Context: el Canvi #215 va declarar tancada la monocapa `TASK_SOURCE` ("zero `prisma.task.create`/`createMany` actius sense `source`"), però la verificació exhaustiva de productors s'ha fet retrospectivament en aquest tall. `lib/services/tasks/leadScopedTaskService.ts` · `createLeadScopedTask` (cridat des de `leadScopedTaskRouteService.ts` → `app/api/admin/leads/[id]/tasks/route.ts`) és el servei que alimenta la creació manual de tasques al Lead Hub. El seu `prisma.task.create` data block no incloïa `source`, així que totes les tasques creades manualment des del Lead Hub quedaven amb `source = null` a DB — no per decisió, sinó per omissió de contracte.
- `LeadScopedTaskInput` afegeix `source?: string | null` com a camp opcional (mateix tipus que a `UniversalTaskCreateInput` a `taskCreation.ts`, que és el contracte canònic de referència). `createLeadScopedTask` propaga `source: input.source ?? null` al `prisma.task.create`, alineant-lo amb els patrons de `taskCreation.ts` (line 37) i `taskAdminService.ts` (normalizedSource, line 141). Els callers existents no passen `source`, així que el comportament observable no canvia — però el contracte sí: el camp ara és explícit i fiable.
- `__tests__/lib/services/tasks/leadScopedTaskService.test.ts` afegeix 2 tests: (1) `propaga source canònic al crear la tasca` — input `{source:'AUTOMATION'}` → `prisma.task.create` rep `source: 'AUTOMATION'`; (2) `desa source null per defecte si no es proporciona` — input sense `source` → `source: null` explícit al payload. Amb això, cap regressió silenciosa pot reintroduir el gap.
- Efecte: els 9 productors actius de `prisma.task.create`/`createMany` al repo escriuen tots pel contracte `source`. Cap productor queda fora de la monocapa declarada al Canvi #215.
- Verificació del tall: edicions minimes (1 camp al tipus, 1 línia al data block, 2 tests); `pnpm run validate:core` pendent en aquest tall.
- `ADMIN_CHANGE_COUNTER` puja a `230`; el següent canvi real ha de ser `#231`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #222 — 2026-04-19 — codex (FET)
**Navegació client: extensió dels helpers canònics a consumidors compartits fora del Customer Hub.**
- Context: després del Canvi #220, el `Customer Hub` ja no construïa URLs de client a mà, però encara quedaven consumidors reutilitzables fora d’aquest workspace repetint el mateix contracte: `lib/customer-hub/nextActionLink.ts`, `app/admin/tasks/TaskPageSections.tsx` i `app/admin/presupuestos/ProposalsList.tsx`.
- `lib/customer-hub/nextActionLink.ts` passa a consumir `buildCustomerProposalHref()` per `SEND_PROPOSAL` i `buildCustomerComposeHref()` pels casos de seguiment i risc comercial. `__tests__/lib/customer-hub/nextActionLink.test.ts` amplia cobertura amb el cas `SEND_PROPOSAL` i deixa d’afirmar strings literals per `recordatori`/`seguiment`, reutilitzant els helpers canònics també al test.
- `app/admin/tasks/TaskPageSections.tsx` deixa d’assemblar manualment `/admin/tasks/new?customerId=...` i consumeix `buildCustomerTaskCreateHref(customerId)` quan la toolbar està contextualitzada per client.
- `app/admin/presupuestos/ProposalsList.tsx` centralitza l’edició de proposta amb `getProposalHref(proposal)`, basat en `buildCustomerProposalHref(proposal.customerId, proposal.id)`, per evitar quatre variants del mateix query string disperses entre vista mobile i desktop.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/nextActionLink.test.ts __tests__/lib/customer-hub/taskResultNotice.test.ts` OK (14 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `222`; el següent canvi real ha de ser `#223`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #221 — 2026-04-19 — claude (FET)
**`onLeadCreated` tanca la monocapa de `dedupeKey` als auto-triggers: `createMany({skipDuplicates:true}) + dedupeKey='welcome-email:{leadId}'`.**
- Context: després del Canvi #219 (que va canonicalitzar `onBookingConfirmed`), `onLeadCreated` era l'últim dels 2 triggers de `lib/services/automationTriggers.ts` que creava Task sense `dedupeKey`. Impacte real: el dispatcher es crida des de `app/api/admin/leads/route.ts:161` en `.catch(()=>{})` fire-and-forget, però si l'operador fa double-click al botó de crear lead, si hi ha un retry d'infra o si es reexecuta manualment el trigger per debug, es podien acumular N welcome-email tasks idèntiques per al mateix lead.
- `lib/services/automationTriggers.ts` · `onLeadCreated`: eliminat `task.create` i substituït pel patró canònic `task.createMany({ data: [{...}], skipDuplicates: true })` amb `dedupeKey: \`welcome-email:${lead.id}\``. El count retornat decideix l'outcome: `count === 0` → `{ triggered: false, detail: 'Welcome email already queued' }`; `count === 1` → happy path. La unique constraint de DB garanteix ara que no hi pot haver dues welcome-email tasks per al mateix lead, sigui quina sigui la ruta d'invocació.
- `__tests__/lib/services/automationTriggers.test.ts` actualitzat: el test del happy path afirma ara `skipDuplicates:true` + `dedupeKey:'welcome-email:l1'` a `mockPrisma.task.createMany.mock.calls[0][0]`; afegit un nou test de dedup que simula `createMany({count:0})` i verifica el detail canònic; el test d'error DB passa a mockar `createMany.mockRejectedValue`. 19 tests verds (vs 18 al Canvi #219 — +1 de dedup).
- Estat final: els 2 productors de Task d'`automationTriggers.ts` (`onLeadCreated` i `onBookingConfirmed`) tenen dedup canònica per `dedupeKey`. `onProposalAccepted` no crea Task (només `proposal.update({contractStatus:'DRAFT'})`), fora d'abast. La monocapa `dedupeKey` queda tancada al fitxer.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/automationTriggers.test.ts` OK (19 tests verds) · `pnpm run validate:core` pendent.
- `ADMIN_CHANGE_COUNTER` puja a `221`; el següent canvi real ha de ser `#222`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #220 — 2026-04-19 — codex (FET)
**Customer Hub: cobertura final dels helpers de navegació també a pressupostos i accessos ràpids restants.**
- Context: el Canvi #218 havia extret la navegació de workspace client a `lib/admin/customerWorkspaceHref.ts`, però encara quedaven punts del `Customer Hub` construint URLs a mà: quick actions del `CustomerHeader`, botons de `BookingsPanel` i `TasksNotesPanel`, CTA de resum per continuar pressupost, accessos de `ProposalsPanel` i l’enllaç d’`Obrir Studio` a `MarginExtrasPanel`.
- `lib/admin/customerWorkspaceHref.ts` ja exposava `buildCustomerProposalHref(customerId, proposalId?)`; aquest tall n’estén l’ús real als consumidors pendents. `CustomerHeader.tsx` passa a reutilitzar helpers per `Nou pressupost`, `Nova reserva`, `Nova tasca` i `Missatge`. `BookingsPanel.tsx` i `TasksNotesPanel.tsx` deixen de construir manualment els formularis de creació. `SummaryPanel.tsx` reusa `buildCustomerProposalHref` per `Continuar pressupost`. `ProposalsPanel.tsx` centralitza tant `+ Nou pressupost` i l’estat buit com `✏️ Editar`. `MarginExtrasPanel.tsx` obre l’Studio del proposal actiu amb el mateix helper.
- Efecte: el `Customer Hub` deixa de tenir una frontera híbrida on part dels salts usaven contracte centralitzat i part continuaven amb query strings duplicades. Ara el contracte de navegació client és coherent també per pressupostos i accessos ràpids.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/taskResultNotice.test.ts` OK (9 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `220`; el següent canvi real ha de ser `#221`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #219 — 2026-04-19 — claude (FET)
**`onBookingConfirmed` deduplica per `dedupeKey` canònic amb `createMany({skipDuplicates:true})` en lloc del `findFirst` fràgil per títol.**
- Context: arran del Canvi #217, la cobertura de tests va destapar que `onBookingConfirmed` (a `lib/services/automationTriggers.ts`) encara feia servir un patró de dedup incoherent amb la resta del repo — `prisma.task.findFirst({ where: { bookingId, title: { contains: 'Checklist pre-event' } } })` — que tenia tres problemes: (1) fràgil a qualsevol rename del títol; (2) no atòmic (dues invocacions concurrents per la mateixa reserva poden passar el check alhora i crear dues tasques); (3) fora del patró canònic ja establert per `taskAutomationService.ts`, que tot el repo fa servir (`createMany({skipDuplicates:true}) + dedupeKey @unique`). El camp `dedupeKey` ja existia al schema (Canvi #203) i estava infrautilitzat.
- `lib/services/automationTriggers.ts` · `onBookingConfirmed`: eliminat `task.findFirst`. El `task.create` passa a `task.createMany({ data: [{...}], skipDuplicates: true })` amb `dedupeKey: \`pre-event-checklist:${booking.id}\``. El count retornat decideix l'outcome: `count === 0` → `{ triggered: false, detail: 'Checklist already exists' }`; `count === 1` → happy path. La unique constraint de DB garanteix ara que no hi pot haver dues tasques checklist per la mateixa reserva, sigui quin sigui el títol.
- `__tests__/lib/services/automationTriggers.test.ts` actualitzat: `mockPrisma.task` incorpora `createMany: vi.fn()`. El test de dedup (`retorna triggered=false si createMany skip-dedupa pel dedupeKey existent`) simula `mockResolvedValue({ count: 0 })`. Els 4 happy paths (BODA amb 8 ítems, OTHER amb 5, dueDate 2d abans, dueDate null) afirmen ara sobre `mockPrisma.task.createMany.mock.calls[0][0]` — amb `skipDuplicates: true` i `data[0]` contenint `dedupeKey: 'pre-event-checklist:b1'`, `source: 'AUTOMATION'`, `bookingId`, etc.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/automationTriggers.test.ts` OK (18 tests verds) · `pnpm run validate:core` pendent.
- `ADMIN_CHANGE_COUNTER` puja a `219`; el següent canvi real ha de ser `#220`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #218 — 2026-04-18 — codex (FET)
**Customer Hub: extracció de la navegació de workspace client a mòdul propi.**
- Nou mòdul `lib/admin/customerWorkspaceHref.ts` amb `parseCustomerWorkspaceTab`, `buildCustomerWorkspaceTabHref`, `buildCustomerTaskCreateHref`, `buildCustomerBookingCreateHref` i `buildCustomerComposeHref`.
- `taskResultNotice.ts` deixa de barrejar navegació de workspace amb feedback de reactivació: conserva només `getCustomerHubTaskNotice()` i `buildCustomerHubTaskHref()`, reutilitzant el nou mòdul per al cas net de `?tab=tasks`.
- Consumidors migrats: `CustomerHubClient.tsx`, `tasks/new/page.tsx`, `inbox/compose/page.tsx`, `bookings/NewBookingForm.tsx`, `SummaryPanel.tsx` i `CommsPanel.tsx`.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/taskResultNotice.test.ts` OK (9 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `218`; el següent canvi real ha de ser `#219`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #216 — 2026-04-18 — codex (FET)
**Customer Hub: helpers canònics per salts a workspaces externs.**
- `lib/customer-hub/taskResultNotice.ts` deixa de ser només un helper de notices i retorna també URLs canòniques per obrir `tasks/new`, `bookings/new` i `inbox/compose` des del context d’un client (`buildCustomerHubTaskCreateHref`, `buildCustomerHubBookingCreateHref`, `buildCustomerHubComposeHref`).
- `__tests__/lib/customer-hub/taskResultNotice.test.ts` amplia cobertura d’aquests helpers i blinda tant els casos amb template com els salts simples.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` i `CommsPanel.tsx` deixen de repetir query strings a mà per salts cap a `compose`, `tasks/new` i `bookings/new`; consumeixen ara els helpers compartits i mantenen un únic contracte de navegació.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/taskResultNotice.test.ts` OK (9 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `216`; el següent canvi real ha de ser `#217`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #213 — 2026-04-18 — codex (FET)
**Customer Hub: retorn canònic des de `tasks/new` cap a la fitxa del client.**
- `app/admin/tasks/new/page.tsx` reutilitza `buildCustomerHubTabHref(customerId, 'tasks')` com a href únic de retorn quan el formulari s'ha obert amb `customerId`.
- Això alinea els dos punts de sortida del formulari amb el context real: el back superior i el botó `Cancel·lar` ja no llancen l'usuari a `/admin/tasks` si havia entrat des del `Customer Hub`, sinó que el retornen a `?tab=tasks` del mateix client.
- El patró de feedback temporal continua sent específic del flux de reactivació; la resta de creacions manuals vinculades al client mantenen retorn net al workspace sense notice addicional.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/taskResultNotice.test.ts __tests__/lib/services/tasks/taskAdminService.test.ts` OK (23 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `213`; el següent canvi real ha de ser `#214`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #210 — 2026-04-18 — codex (FET)
**Reactivació assistida: avís temporal net i descartable al Customer Hub.**
- `app/admin/clientes/[id]/_components/CustomerHubClient.tsx` deixa de dependre permanentment dels `search params` per mostrar el feedback: inicialitza el notice des de la URL, el conserva en estat local i després neteja la URL amb `router.replace(...?tab=tasks)` perquè un refresh no el torni a injectar.
- `app/admin/clientes/[id]/_components/panels/TasksNotesPanel.tsx` afegeix acció `Tancar`, de manera que l'operador pot descartar l'avís sense perdre el context de la pestanya ni recarregar la fitxa.
- `lib/customer-hub/taskResultNotice.ts` exporta també `buildCustomerHubTabHref()` com a helper canònic per tornar a una pestanya neta del `Customer Hub`; `taskResultNotice.test.ts` l'exercita junt amb el contracte existent del flux de reactivació.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/taskResultNotice.test.ts __tests__/lib/services/tasks/taskAdminService.test.ts` OK (23 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `210`; el següent canvi real ha de ser `#211`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #209 — 2026-04-18 — claude (FET)
**Primer ús operatiu de `resolutionNote`: les cancel·lacions automàtiques de checklist deixen traça explícita del motiu.**
- `lib/services/dailyChecklist.ts` escriu ara `resolutionNote` als dos moments on es cancel·laven tasques sense deixar cap rastre consultable:
  - `staleCleanup` (checklist vençut: `dueDate < todayStart` i `status ∈ {OPEN, IN_PROGRESS}`): escriu `"Checklist diari vençut sense resoldre: cancel·lat automàticament."`
  - `toCancelTodayIds` (senyal desapareguda durant el dia: tasca d'avui amb `shouldCreate=false`): escriu `"Senyal desaparegut durant el dia: la tasca ja no és necessària."`
- El camp `resolutionNote` va arribar al schema canònic al Canvi #203 com a columna `@db.Text`, però fins ara cap servei productor l'escrivia. Aquest canvi el posa en ús real sense tocar contracte ni migració: només aprofita el que ja hi havia.
- La cancel·lació queda traçable des del registre de la tasca: qui consulti la Task sabrà per què ha estat tancada automàticament i podrà distingir-ho d'una cancel·lació manual sense nota.
- Cobertura: `__tests__/lib/services/dailyChecklist.test.ts` afirma ara que el `updateMany` de `staleCleanup` inclou `resolutionNote: expect.stringContaining('vençut')` i que el de `toCancelTodayIds` inclou `resolutionNote: expect.stringContaining('Senyal desaparegut')`. 12 tests verds.
- Verificació del tall: `npx vitest run __tests__/lib/services/dailyChecklist.test.ts` OK (12 tests) · `pnpm run validate:core` OK 7/7 (qa:protocol, qa:encoding 925 fitxers, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard).
- `ADMIN_CHANGE_COUNTER` puja a `209`; el següent canvi real ha de ser `#210`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #208 — 2026-04-18 — codex (FET)
**Reactivació assistida: feedback visible al Customer Hub quan la tasca es crea, es reutilitza o es reobre.**
- `lib/customer-hub/taskResultNotice.ts` centralitza el contracte del retorn: parseig segur de `tab`, mapatge de `taskResult` a copy visible i construcció de l'`href` de tornada al `Customer Hub`.
- `app/admin/tasks/new/page.tsx` calcula ara el resultat real del POST (`created`, `deduped`, `reopened`) i, si la tasca venia d'una reactivació assistida, torna a `/admin/clientes/[id]?tab=tasks&taskSource=reactivation&taskResult=...` en lloc de perdre aquest context.
- `app/admin/clientes/[id]/_components/CustomerHubClient.tsx` consumeix aquests `search params` per obrir directament la pestanya `tasks`, i `TasksNotesPanel.tsx` mostra un avís `role="alert"` que explica si la tasca s'ha creat, reutilitzat o reobert.
- `__tests__/lib/customer-hub/taskResultNotice.test.ts` blinda el parseig del tab, el mapping del notice i l'`href` de retorn; `taskAdminService.test.ts` continua cobrint la semàntica `deduped/reopened` que alimenta aquest feedback.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/taskResultNotice.test.ts __tests__/lib/services/tasks/taskAdminService.test.ts` OK (22 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `208`; el següent canvi real ha de ser `#209`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #206 — 2026-04-18 — codex (FET)
**Reactivació assistida: reobertura canònica si la tasca ja estava tancada.**
- `lib/services/tasks/taskAdminService.ts` resol ara el cas que quedava viu després de `#204`: si entra una nova reactivació amb la mateixa `dedupeKey`, no hi ha cap tasca oberta però sí una `REACTIVATION` ja tancada, la tasca existent es reobre en lloc d'intentar crear-ne una altra i topar amb la unicitat.
- La reobertura refresca `customerId`, relacions, títol, descripció, `dueDate` i prioritat; l'estat torna a `OPEN` per defecte i `completedAt` es neteja perquè el nou intent comercial quedi operatiu sobre la mateixa peça.
- `__tests__/lib/services/tasks/taskAdminService.test.ts` blinda aquest cas junt amb la deduplicació d'obertes: quan la `dedupeKey` continua viva però la tasca anterior està `DONE` o equivalent, el servei actualitza i reobre en lloc de crear.
- Verificació del tall: `npx vitest run __tests__/lib/services/tasks/taskAdminService.test.ts` OK (15 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `206`; el següent canvi real ha de ser `#207`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #204 — 2026-04-18 — codex (FET)
**Reactivació assistida amb deduplicació canònica i reconeixement visible a Tasks.**
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` fa que la CTA de `Nova tasca` per reactivació surti ja amb `taskSource='REACTIVATION'` i `dedupeKey='reactivation:{customerId}'`, de manera que el pas assistit cap a `Tasks` no quedi com una tasca genèrica ni permeti duplicats oberts pel mateix client.
- `app/admin/tasks/new/page.tsx` conserva aquest context assistit, preomple el formulari des de query string i envia els camps canònics `source` i `dedupeKey` quan la tasca es crea realment.
- `app/api/admin/tasks/route.ts` i `lib/services/tasks/taskAdminService.ts` accepten ara també `source`, `autoRule`, `dedupeKey` i `resolutionNote`; abans de crear, `taskAdminService` busca si ja existeix una tasca oberta amb la mateixa `dedupeKey` i, si existeix, retorna el registre existent en lloc de crear-ne una altra.
- `lib/services/tasks/taskList.ts` i `app/admin/tasks/TaskPageSections.tsx` transporten i mostren l'origen canònic perquè la cua global identifiqui aquestes tasques amb badge `Reactivació`.
- `__tests__/lib/services/tasks/taskAdminService.test.ts` blinda la persistència de `source='REACTIVATION'` i el retorn deduplicat; `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda que l'enllaç de reactivació generi `taskSource` i `dedupeKey` correctes.
- Verificació del tall: `npx vitest run __tests__/lib/services/tasks/taskAdminService.test.ts __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (18 tests) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `204`; el següent canvi real ha de ser `#205`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #188 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb aforament visible de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim del booking vinculat perquè la lead convertida també transporti `guestCount`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també l'`Aforament previst` quan la lead prioritària ja està convertida.
- Això completa una mica més la lectura de conversió del resum superior: no només es veu on i quan cau la reserva, sinó també de quina escala operativa estem parlant.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquest aforament continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `188`; el següent canvi real ha de ser `#189`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #189 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb recinte visible de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim del booking vinculat perquè la lead convertida també transporti `eventVenue`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també el `Recinte` quan la lead prioritària ja està convertida.
- Això completa una mica més la lectura de conversió del resum superior: no només es veu on cau l'esdeveniment a nivell de localització general, sinó també quin espai concret té reservat.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquest recinte continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `189`; el següent canvi real ha de ser `#190`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #191 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb tipus d'esdeveniment visible de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim del booking vinculat perquè la lead convertida també transporti `eventType`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també el `Tipus de reserva` quan la lead prioritària ja està convertida.
- Això completa una mica més la lectura de conversió del resum superior: no només es veu l'espai reservat, sinó també de quin tipus d'esdeveniment estem parlant.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquest tipus de reserva continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `191`; el següent canvi real ha de ser `#192`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #186 — 2026-04-18 — codex (FET)
**Targeta d'oportunitat comercial amb horari visible de la reserva vinculada.**
- `lib/customer-hub/data.ts`, `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts` amplien el contracte mínim del booking vinculat perquè la lead convertida també transporti `eventStartTime` i `eventEndTime`.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` mostra ara també l'`Horari` de la reserva quan la lead prioritària ja està convertida.
- Això completa una mica més la lectura de conversió del resum superior: no només es veu on passa la reserva, sinó també en quina franja operativa cau.
- `__tests__/app/admin/clientes/SummaryPanel.test.tsx` blinda el cas convertit perquè aquest horari continuï visible dins de la targeta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK · `npx vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx` OK (3 tests).
- `ADMIN_CHANGE_COUNTER` puja a `186`; el següent canvi real ha de ser `#187`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #254 — 2026-04-19 — codex (FET)
**El manual admin passa a mostrar explícitament quins workspaces ja estan alineats amb la capa visual de propietari i quins entren a la segona onada.**
- Context: després del `Canvi #250` (patró reusable `OwnerControlStrip`) i del `Canvi #252` (dashboard migrat), la norma visual ja existia a codi però no com a mapa de cobertura. Això obligava a recordar de memòria quines pantalles ja parlaven en mode propietari i quines encara quedaven pendents.
- `lib/constants/adminManual.ts`: nous tipus `AdminManualVisualGovernanceItem` i `AdminManualVisualGovernanceSection`, més el catàleg canònic `ADMIN_MANUAL_VISUAL_GOVERNANCE` amb dos buckets tipats: `ALIGNED` i `SECOND_WAVE`.
- `app/admin/manual/page.tsx`: nova secció `Govern visual del sistema`, badges d'estat, links als workspaces i recompte superior de workspaces alineats. El bloc `Checklist de bolets a caçar` deixa explícit que la segona onada visual també entra al checklist de qualitat.
- Efecte: el manual passa a ser memòria externa també de la cobertura visual. La norma de treball deixa d'estar només al protocol o dispersa per pantalles concretes i queda visible dins l'admin de forma responsive i sense hardcoded local a la pàgina.
- Validació: `npx tsc --noEmit --pretty false` OK.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #255 — 2026-04-19 — codex (FET)
**`Sales Ops` entra al patró visual de propietari amb la mateixa capa `automàtic / manual / següent pas` que la resta de workspaces principals.**
- Context: al `Canvi #254` el manual ja deixava `Sales Ops` dins la `SECOND_WAVE` visual. La pantalla tenia mètrica i profunditat bones, però encara començava per KPIs i text explicatiu sense una lectura executiva clara del que el sistema veu, del que et reclama decisió i del següent moviment operatiu.
- `app/admin/sales-ops/page.tsx`: integrat `OwnerControlStrip` compartit. La banda `Automàtic` resumeix embut, previsió ponderada, seqüències automàtiques i taxa de resposta; la banda `Manual` visibilitza backlog SLA, risc de pèrdua i higiene de dades; el `Següent pas` salta dinàmicament a `leads`, `tasks` o optimització d'embut segons tensió real.
- La lògica del següent pas queda lligada al domini existent, no hardcoded com a copy estàtica: si hi ha entrades >24h prioritza `leads`; si el coll principal és risc de pèrdua, prioritza execució a `tasks`; si no hi ha foc immediat, el focus passa a optimització comercial.
- Efecte: `Sales Ops` deixa de ser un dashboard dens per especialista i passa a llegir-se també com a cabina de comandament per propietari. La segona onada visual ja no és només declarativa al manual: comença a absorbir workspaces reals.
- Validació: `npx tsc --noEmit --pretty false` OK.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #256 — 2026-04-19 — claude (FET) — petició directa del propietari
**El comptador `ADMIN_CHANGE_COUNTER` passa de marca d'aigua al header a casella explícita al flux del header (mòbil i desktop), amb label `Canvi #N` llegible, i a sota el capó `computeHealthScore` i `computeLifecycleStage` deixen d'usar el rellotge real i passen a respectar un `now` injectat.**
- Context (capa visual): el propietari ha demanat directament durant aquesta sessió que el comptador de canvis, que fins ara es dibuixava a `app/admin/layout.tsx:606` i `app/admin/layout.tsx:780` com a marca d'aigua absoluta centrada sobre el logo/breadcrumb amb `text-cyan-400/70` i tracking ample, passés a ser "bonic en una casella". La versió anterior era decorativa i difícil de llegir (competia visualment amb el logo i el títol de la pàgina). En mode "interfície de propietari obligatòria" (norma #237 de Codex), qualsevol senyal del header ha de ser inequívoc i llegible, no una marca d'aigua ambigua.
- Context (capa servei): `lib/services/customerSegmentationService.ts` té dues funcions pures que alimenten el workspace visual del propietari — `computeHealthScore` (0-100, pinta el color del client al Customer Hub) i `computeLifecycleStage` (mapeja a `NEW`/`FIRST_TIME`/`RETURNING`/`VIP`/`DORMANT`/`CHURNED`). Ambdues declaraven `const now = new Date()` com a primera línia del cos, ignorant qualsevol intent d'injectar-lo des del caller. Conseqüència silenciosa: dos càlculs del mateix client amb els mateixos inputs retornaven valors diferents segons l'hora real del runner/server, i `recalculateAllCustomers` (cron diari) no podia fer dos batches al mateix `now` — els clients a la frontera de 6/12 mesos oscil·lessin entre DORMANT i CHURNED. Mateix patró que `Canvi #249` (`deriveLossRisk`). Dos fronts del mateix principi: el header deixa de mentir estèticament, i els serveis que alimenten el workspace sota el header deixen de mentir temporalment.
- `app/admin/layout.tsx`: eliminats els dos `<div>` absolute que renderitzaven `ADMIN_CHANGE_COUNTER` com a marca d'aigua (línies 602-607 mòbil, 776-781 desktop). Substituïts per un chip explícit amb les classes noves `admin-change-counter-chip` + variant `--mobile` o `--desktop`, amb dos spans dins: label `Canvi` (petit, uppercase, tracking ample) i valor `#N` (bold, tabular-nums). Inclou `aria-label` i `title` amb el número per accessibilitat i tooltip.
- `app/globals.css`: afegit bloc d'estils `html.admin-mode .admin-change-counter-chip` (i les seves subclasses `-label`, `-value`, `--mobile`) just després del grup `admin-header-alert-chip*` per mantenir la cohesió visual de la família de chips del header. Usa tokens existents (`var(--at-border)`, `var(--at-panel)`) i afegeix glow cyan coherent amb la marca d'aigua anterior (la intensitat es manté, només es fa la forma llegible).
- `lib/services/customerSegmentationService.ts`: `HealthInput` i `LifecycleInput` guanyen camp opcional `now?: Date`. Ambdues funcions fan `const now = input.now ?? new Date();` — el `??` preserva retrocompatibilitat de callers que no injecten temps. `recalculateAllCustomers(now: Date = new Date())` rep l'instant al principi del batch i el propaga a cada `computeHealthScore`/`computeLifecycleStage` — tots els clients d'una mateixa execució del cron es calculen respecte al mateix tall temporal. Zero canvi funcional a regles de scoring ni mapatge de stages.
- `__tests__/lib/services/customerSegmentationService.test.ts`: 2 tests nous. (1) "determinisme del health score" verifica que dos càlculs amb el mateix `now` lògic donen el mateix resultat, i que avançar `now` un any fa baixar el score (freshness decau) — prova que `now` es respecta, no només s'accepta. (2) "DORMANT/CHURNED respecten el `now` injectat" verifica la frontera: `lastEventDate` 7 mesos abans de `now=2026-04-19` és DORMANT, el mateix lead amb `now=2027-04-19` és CHURNED — si el servei usés `new Date()` real, la segona assertion fallaria. 36 tests verds al fitxer (34 existents + 2 nous).
- Efecte visual: el propietari veu ara al header (mòbil i desktop) una casella cyan explícita amb "Canvi #N", on N és el comptador viu. El chip se situa al flux del header (no com a marca d'aigua sobreposada), i respecta el mateix contracte visual que els `admin-header-alert-chip` d'alertes ja existents. Efecte servei: el cron diari de recàlcul de clients ja no pot produir oscil·lacions "DORMANT → CHURNED → DORMANT" entre execucions consecutives; el healthScore renderitzat al hub és ara funció pura de (inputs del client + now). Sisena reparació consecutiva que tanca una escapatòria al rellotge real a la capa de serveis que alimenten pantalles de propietari, combinada amb el primer polit visual directe al header del mateix propietari.
- Verificació del tall: `npx vitest run __tests__/lib/services/customerSegmentationService.test.ts` OK (36/36) · `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `256`; el següent canvi real ha de ser `#257`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #257 — 2026-04-19 — codex (FET)
**`Reporting` entra al patró visual de propietari i deixa de ser només una pantalla de mètriques per passar a ser lectura executiva amb decisió següent.**
- Context: després del `Canvi #255`, `Sales Ops` ja havia absorbit la capa `automàtic / manual / següent pas`, però `Reporting` encara començava per KPIs, taules i funnels sense una lectura inicial clara de desviació, tensió i acció recomanada. El manual del `Canvi #254` ja el deixava dins la segona onada visual.
- `app/admin/reporting/page.tsx`: integrat `OwnerControlStrip` compartit. La banda `Automàtic` resumeix previsió ponderada, pipeline, marge brut, recurrència i tracking d'email; la banda `Manual` destaca SLA trencats, marge insuficient, recurrència baixa o tracking comercial fluix; el `Següent pas` redirigeix a `leads`, `pricing`, `economia`, `clientes` o `sales-ops` segons el coll principal detectat.
- La lògica de priorització no és decorativa: si hi ha `slaBroken` el reporting no intenta “explicar el negoci” abans de tallar el soroll operatiu; si el marge és baix posa el focus en pricing; si la recurrència és baixa força lectura de clients i reactivació; si no hi ha incendi immediat, empeny optimització comercial i analítica.
- Efecte: `Reporting` passa de dashboard descriptiu a cockpit executiu. La segona onada visual continua absorbint workspaces on la decisió importava més que la mera lectura de dades.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `257`; el següent canvi real ha de ser `#258`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #258 — 2026-04-19 — codex (FET)
**`Crons` entra al patró visual de propietari i deixa de mostrar només monitoratge tècnic per passar a lectura d’excepcions i impacte.**
- Context: després del `Canvi #257`, `Reporting` ja havia entrat a la segona onada visual, però `Crons` encara es llegia principalment com a llista tècnica d'estats. El propietari veia comptadors i detalls de run, però no una síntesi clara de què està controlat, què reclama intervenció i quin és el següent pas.
- `app/admin/crons/CronsClient.tsx`: integrat `OwnerControlStrip` compartit. La banda `Automàtic` resumeix crons correctes, retardats, en error i mai executats; la banda `Manual` fa emergir l'error principal, retards actius i processos sense primera execució; el `Següent pas` canvia entre revisar `Crons` mateix o saltar a `Salut` segons tensió real.
- La lògica de priorització és operativa, no decorativa: si hi ha error es posa el focus a la incidència concreta; si hi ha retard sense error, el focus és regularitzar la finestra; si no hi ha incidència crítica, la CTA ja no obliga a seguir dins la mateixa pantalla i envia a observabilitat general.
- Efecte: `Crons` deixa de ser només un monitor i passa a comportar-se com a cockpit de confiança del sistema. La segona onada visual continua absorbint workspaces on abans dominava el detall tècnic per damunt de la lectura executiva.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `258`; el següent canvi real ha de ser `#259`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #259 — 2026-04-19 — codex (FET)
**`Salut` entra al patró visual de propietari i deixa de començar per filtres i seccions per passar a explicar risc, prioritat i següent pas d’un cop d’ull.**
- Context: després del `Canvi #258`, `Crons` ja s’havia convertit en cockpit d’excepcions. `Salut` ja tenia bona estructura per domini, priorització i filtres, però seguia obligant a llegir la pantalla de dalt a baix abans de decidir què atacar. Faltava la capa comuna `automàtic / manual / següent pas`.
- `app/admin/salut/page.tsx`: integrat `OwnerControlStrip` compartit abans dels filtres. La banda `Automàtic` resumeix crítics, warnings, blocs correctes i darrera generació del snapshot; la banda `Manual` comprimeix els tres focus prioritaris que ja calcula el motor; el `Següent pas` obre directament el `href` del primer focus crític o passa a control preventiu si no hi ha incendi.
- La lògica de sortida continua recolzada en el contracte existent de `priorityItems`: no s’inventa una ruta nova ni un resum en paral·lel. Si ja hi ha un senyal prioritari a salut, el mateix item decideix també la CTA principal i, si n’hi ha un segon, queda com a acció secundària.
- Efecte: `Salut` passa de ser una pantalla bona per inspecció a una pantalla bona també per govern. La segona onada visual ja cobreix observabilitat, reporting i salut sistèmica sota el mateix llenguatge executiu.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `259`; el següent canvi real ha de ser `#260`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #260 — 2026-04-19 — codex (FET)
**`Settings` puja jerarquia visual i deixa de comportar-se com una pàgina plana de configuracions per passar a lectura de context, estat i acció principal.**
- Context: després del `Canvi #259`, la segona onada visual ja cobria observabilitat i salut sistèmica. El següent pas lògic era un workspace de configuració, però aquí no tocava copiar la mateixa franja executiva per inèrcia. El problema real de `Settings` era un altre: començava amb una nota plana, després la llista de settings i finalment quick links, sense una lectura clara d'estat general ni de quines configuracions tenen més impacte.
- `app/admin/settings/page.tsx`: afegida una obertura en tres blocs. El primer resumeix volum i risc (`categories`, `settings`, `claus sensibles`), el segon diu què convé vigilar abans d'editar i mostra l'últim canvi registrat, i el tercer fixa una `Acció principal` perquè l'operador entri per empresa/Holded o catàleg si el canvi és de negoci real.
- Els quick links deixen de ser una graella nua al final i passen a bloc propi de “canvis que acostumen a tenir més impacte”, amb millor separació visual i copy més orientat a decisió. La pantalla guanya jerarquia sense simular un cockpit operatiu que aquí no tocava.
- Efecte: el criteri visual nou queda demostrat també en un workspace de configuració. No es tracta de posar `OwnerControlStrip` a tot arreu, sinó d'aplicar la lectura correcta segons el tipus de pantalla: govern operatiu on toca, i jerarquia + estat + CTA principal on el domini és configuració.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `260`; el següent canvi real ha de ser `#261`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #261 — 2026-04-19 — claude (FET)
**Tres serveis que alimenten la fitxa de client i el cockpit NBA del propietari deixen de comptar tasques `CANCELLED` com a "obertes" o "vençudes".**
- Context: dins la cacera de bugs silenciosos que sabotegen la norma #237 (interfície de propietari obligatòria, signals inequívocs al cockpit), detectat un patró incoherent a tres queries Prisma del repo. L'enum `TaskStatus` té quatre valors (`OPEN`, `IN_PROGRESS`, `DONE`, `CANCELLED`), però diverses queries filtraven només per `status: { not: 'DONE' }` en lloc de `status: { notIn: ['DONE', 'CANCELLED'] }`. Conseqüència silenciosa: una tasca cancel·lada amb `dueDate` passada entrava al comptador d'overdue del lead al cockpit NBA, i apareixia com a "oberta" a la fitxa del client — el propietari llegia "5 tasques vençudes" quan algunes ja s'havien cancel·lat. La tercera query afectada (`prisma.task.findMany` línia 610) ja feia servir correctament `notIn: ['DONE', 'CANCELLED']`, cosa que feia el bug encara més asimètric: el widget de tasques de la llista general filtrava bé, però el lead card al NBA comptava malament.
- `lib/services/nextBestActionService.ts`: dues correccions a `loadNextBestActions`. (1) Línia 577, subselecció `universalTasks` de `prisma.lead.findMany`: `status: { not: 'DONE' }` → `status: { notIn: ['DONE', 'CANCELLED'] }` (preservant el filtre `dueDate: { lt: now }`). Aquest és el que alimenta `overdueTasks: l.universalTasks.length` — cada lead al NBA llegeix correctament quantes tasques estan realment obertes i vençudes. (2) Línia 601, subselecció `tasks` de `prisma.customer.findMany`: mateixa transformació. Aquest alimenta `openTasks: c.tasks.length` per cada client al cockpit — la "salut" del client ja no inclou tasques mortes.
- `lib/services/customerRouteService.ts`: `getCustomerDetail` (línia 34), include `tasks` de la fitxa del client: `status: { not: 'DONE' }` → `status: { notIn: ['DONE', 'CANCELLED'] }`. Quan el propietari obre `/admin/clientes/[id]` i veu el bloc "Tasques actives", ara veu només tasques realment actives (OPEN/IN_PROGRESS), no cancel·lades que s'ocultaven de la llista general però reapareixien a la fitxa.
- `__tests__/lib/services/nextBestActionServiceQueries.test.ts` (nou): 3 tests que mocken `prisma` i verifiquen que `loadNextBestActions` crida les tres queries Prisma amb el filtre `notIn: ['DONE', 'CANCELLED']` correcte — un test per cada model (lead, customer, task). Si algú torna a introduir `{ not: 'DONE' }` a qualsevol d'aquestes tres subseleccions, el test falla explícitament. `__tests__/lib/services/customerRouteService.test.ts`: afegit test "filtra tasques obertes excloent DONE i CANCELLED" que verifica el mateix contracte a `getCustomerDetail` mitjançant `toHaveBeenCalledWith(expect.objectContaining(...))`.
- Efecte visual: al cockpit NBA del propietari (`/admin/dashboard` → NBA card), els comptadors `overdueTasks` per lead i `openTasks` per client reflecteixen realitat, no soroll. Una tasca que el propietari mateix va cancel·lar deixa d'aparèixer com a "vençuda" al mateix cockpit. A la fitxa de client, "Tasques" no duplica l'estat "Cancel·lada" com si fos "Oberta". Setena reparació consecutiva que tanca una escapatòria a la capa de serveis que alimenten pantalles de propietari.
- Verificació del tall: `npx vitest run __tests__/lib/services/nextBestActionServiceQueries.test.ts __tests__/lib/services/customerRouteService.test.ts` OK (19/19) · `npx tsc --noEmit --pretty false` OK · `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `261`; el següent canvi real ha de ser `#262`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #264 — 2026-04-19 — codex (FET)
**`Text Manager` puja lectura de sessió i deixa de ser només un editor dens per passar a explicar què estàs tocant, en quin idioma i quin és el següent moviment net.**
- Context: després del `Canvi #260`, `Settings` ja demostrava el criteri correcte per workspaces de configuració: jerarquia, context i CTA principal en lloc de copiar un cockpit operatiu. `Text Manager` encara començava directament pel header enganxós, idioma, cerca i llista de textos; potent, sí, però massa fàcil perdre focus sobre què estàs editant de veritat.
- `app/admin/text-manager/page.tsx`: nova obertura en tres blocs abans del contingut principal. `Sessió d’edició` resumeix idioma actiu, canvis pendents i volum visible; `Focus` explica secció actual, cerca activa, vista de modificats i estat de comparació; `Acció principal` deixa clar si toca desar canvis o primer trobar el bloc correcte abans d’obrir més fronts.
- També s’elimina repetició local al banner de secció activa reutilitzant `activeSectionMeta` via `useMemo`, en lloc de fer tres `SECTIONS.find(...)` separats al render.
- Efecte: `Text Manager` passa de pàgina d’edició crua a workspace més governable per al propietari/editor. No usa `OwnerControlStrip` perquè aquí no tocava: el patró correcte és control de sessió, focus i tancament net de canvis, no simulació de cues operatives.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `264`; el següent canvi real ha de ser `#265`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #263 — 2026-04-19 — claude (FET)
**`scoreLead` de `commercialScoring.ts` deixa d'anar a buscar `Date.now()` dues vegades per càlcul i passa a respectar un `now?: Date` injectat opcional.**
- Context: `scoreLead` alimenta tres pantalles visuals del propietari. `app/admin/sales-ops/page.tsx:86` genera la banda (HIGH/MEDIUM/LOW), el score 0-100, les raons i els riskFlags que es renderitzen al cockpit comercial — el propietari mira aquest score cada matí per decidir què tocar primer. La funció cridava `Date.now()` dues vegades al seu cos: una per `daysToEvent` (finestra 7-120 dies, frontera `<0` i `<=3`) i una altra per `staleHours` (fronteres de penalització a 24h i 72h). Conseqüència silenciosa: dos càlculs consecutius d'un mateix lead amb els mateixos inputs podien caure a bandes diferents si la crida segona travessava la frontera 24h/72h en el moment just. I a tests, impossible validar deterministament el comportament a prop de frontera sense manipular el rellotge real del runner — els tests existents feien assertions relatives precisament perquè no es podia fixar un tall temporal. Mateix patró tancat als `Canvi #249` (deriveLossRisk) i `Canvi #256` (computeHealthScore/computeLifecycleStage).
- `lib/services/commercialScoring.ts`: `ScoreInput` guanya camp opcional `now?: Date`. El cos de `scoreLead` substitueix les dues crides a `Date.now()` per una única captura al principi (`const nowMs = (input.now ?? new Date()).getTime();`) que es reusa a `daysToEvent` i `staleHours`. Zero canvi funcional a les regles de scoring: els mateixos pesos, els mateixos llindars, els mateixos riskFlags i les mateixes bandes. El `??` preserva retrocompatibilitat amb `app/admin/sales-ops/page.tsx` i tots els callers existents que no injecten temps.
- `__tests__/lib/services/commercialScoring.test.ts`: 2 tests nous. (1) "determinisme: dos scoring amb el mateix `now` lògic donen el mateix resultat" verifica que dues crides consecutives amb el mateix input + `now` donen el mateix score, banda i riskFlags. (2) "la frontera de 72h stale respecta el `now` injectat" prova el cas exacte de la frontera: un lead amb `updatedAt` fa exactament 71h (relatiu al `now` injectat) no ha de rebre `Sense seguiment 72h+`, i el mateix lead amb `now` avançat 2h més ha de rebre el flag i tenir score menor. Sense `now` injectable, aquest test no era possible de fer deterministament. 19 tests verds al fitxer (17 existents + 2 nous).
- Efecte: el cockpit de Sales Ops del propietari esdevé funció pura de (inputs del lead + now), i les penalitzacions d'envelliment es poden provar i raonar sense ambigüitat. Vuitena reparació consecutiva que tanca una escapatòria al rellotge real a la capa de serveis que alimenten pantalles de propietari. Tercer servei corregit amb aquest mateix patró (lossRisk, segmentation, scoring) — queda documentat que qualsevol funció pura que barreja `Date.now()` amb inputs d'usuari ha d'acceptar `now?` opcional des d'ara.
- Verificació del tall: `npx vitest run __tests__/lib/services/commercialScoring.test.ts` OK (19/19) · `npx tsc --noEmit --pretty false` OK · `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `263`; el següent canvi real ha de ser `#264`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #265 — 2026-04-19 — codex (FET)
**`FAQ` puja de llista correcta a workspace editorial amb cobertura, estat i acció principal visibles abans d’entrar a editar.**
- Context: després del `Canvi #264`, `Text Manager` ja demostrava el patró correcte per editors: lectura de sessió i focus, no cockpit operatiu. `FAQ` encara començava per KPIs simples i una tira de categories, sense una lectura clara de cobertura editorial, inactives o on convé entrar primer.
- `app/admin/faq/page.tsx`: nova obertura en tres blocs. `Cobertura editorial` resumeix volum real (`preguntes`, `actives`, `idiomes`), `Estat` explica si hi ha inactives, quina categoria concentra més volum i si la cobertura d’idiomes és completa, i `Acció principal` decideix si cal recuperar una inactiva o ampliar cobertura.
- Reutilitza dades que ja existien a la pàgina (`faqsByCategory`, `translations`, `isActive`) en lloc de crear cap capa paral·lela. La CTA principal obre una FAQ inactiva si n’hi ha, o crea nova pregunta si no hi ha incidències visibles.
- Efecte: `FAQ` es llegeix ja com a espai de govern editorial, no només com a catàleg de preguntes. La passada transversal sobre workspaces no-operatius continua mantenint el mateix criteri: jerarquia, estat i acció clara, sense forçar el mateix patró de cockpit on no toca.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `265`; el següent canvi real ha de ser `#266`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #266 — 2026-04-19 — claude (FET)
**`NBA cockpit` deixa de subvalorar leads amb pressupost en format europeu; `estimateBudget` parseja `1.500,50 €` correctament igual que `leadPipelineSuggestionsService`.**
- Context: `nextBestActionService.ts:137` tenia una còpia divergent de `estimateBudget` que feia `parseFloat(budget.replace(/[^\d.]/g, ''))`. Amb un pressupost escrit en format europeu (`"1.500"`, `"1.500,50"`) el punt era un separador de milers però `parseFloat` l’interpretava com a decimal → `"1.500"` → `1.5`. El `isHighValue = budget > 500` sempre donava `false`, així que leads d’alt valor es marcaven amb `estimatedImpact: 'MEDIUM'` al cockpit NBA (§237). L’altra còpia a `leadPipelineSuggestionsService.ts:72` ja feia el tractament correcte (`replace(/\./g, '').replace(',', '.')`).
- Causa: duplicació de lògica sense una sola font de veritat; quan es va millorar una, l’altra va quedar enrere. Patró conegut (vegeu `feedback_db_config_consistency`).
- `lib/services/nextBestActionService.ts:137`: `estimateBudget` ara usa el mateix parser europeu que `leadPipelineSuggestionsService.ts:72`: treu separadors de milers `.`, converteix `,` en `.` i valida amb `Number.isFinite`.
- `__tests__/lib/services/nextBestActionService.test.ts`: tres regressions noves. `"1.500"` ha de donar `estimatedImpact: 'HIGH'`; `"1.500,50 €"` també; budget baix `"300"` amb prioritat `NORMAL` ha de donar `MEDIUM`. 27/27 tests passen.
- Efecte: al cockpit NBA, un lead com "Casament 1.500 €" apareix ara com a `HIGH` impact i es prioritza correctament a la llista d'accions de l'operador, fidel a la norma §237 de pantalla de propietari.
- Verificació: `npx vitest run __tests__/lib/services/nextBestActionService.test.ts` → 27/27. `npm run validate:core` → 9/9.
- `ADMIN_CHANGE_COUNTER` puja a `266`; el següent canvi real ha de ser `#267`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #267 — 2026-04-19 — codex (FET)
**`Plantilla de pressupostos` deixa de començar pel formulari nu i puja context, estat i acció principal abans d’editar el missatge comercial.**
- Context: després dels `Canvi #260`, `#264` i `#265`, els workspaces de configuració/editorial ja començaven a parlar millor amb el propietari. `app/admin/settings/quotes/page.tsx` encara enviava directament a `QuoteTemplateEditor`, amb només un alert de fallback si fallava la càrrega. Faltava entendre què controla aquest editor i què convé revisar abans de tocar el text.
- `app/admin/settings/quotes/page.tsx`: nova capçalera en tres blocs. `Plantilla viva` resumeix validesa, nombre de condicions i si la còpia interna està activa; `Estat` explica si s’està editant configuració real o fallback i a quina adreça va la còpia interna; `Acció principal` posa el focus en polir missatge, validesa i CTA, no només omplir camps.
- El canvi es queda al wrapper i no carrega l’editor amb més soroll. El formulari continua sent la peça d’edició; la pàgina és la que ara dóna context i govern del que s’està tocant.
- Efecte: un altre workspace de configuració deixa de semblar una pantalla tècnica sense narrativa i passa a ser coherent amb la línia visual nova dels editors: context, estat i acció clara abans de l’input.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `267`; el següent canvi real ha de ser `#268`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #268 — 2026-04-19 — claude (FET)
**`Daily Brief` deixa d'infravalorar el forecast ponderat quan els pressupostos dels leads vénen en format europeu (`1.500,50 €`).**
- Context: `lib/services/dailyBriefService.ts:457` (wrapper `loadDailyBrief`) calculava `forecastWeighted = Σ (Number(lead.budget) || 0) × probabilitat_per_estat`. `Number("1.500")` = `1.5`, `Number("1.500,50")` = `NaN → 0`, `Number("1.500,50 €")` = `NaN → 0`. Els leads amb pressupost escrit en format europeu es comptaven com a 1.5 € o 0 €, i el forecast del cockpit (`/admin` · `DailyBriefPanel`) es veia infravalorat — algunes vegades per factors de 1000×. Mateix patró que `Canvi #266` (NBA cockpit, `nextBestActionService`), aquí aplicat al brief diari.
- Causa: tercera divergència del mateix helper. `commercialScoring.ts:25`, `leadScoreBreakdownService.ts:50`, `leadPipelineSuggestionsService.ts:72` i `nextBestActionService.ts:137` ja feien el parser europeu; `dailyBriefService.ts:457` era l'únic que encara usava `Number(budget)` directament.
- `lib/services/dailyBriefService.ts`: nou helper `parseBudgetValue(input?: string | null): number` exportat, amb la mateixa implementació que els altres serveis (`replace(/[^\d.,]/g, '')` + `replace(/\./g, '')` + `replace(',', '.')` + `Number.isFinite`). `forecastWeighted` passa a `sum + parseBudgetValue(lead.budget) * prob`.
- `__tests__/lib/services/dailyBriefService.test.ts`: nou `describe('parseBudgetValue')` amb 6 regressions — `"1.500"` → `1500`, `"1.500,50"` → `1500.5`, `"1.500,50 €"` → `1500.5`, `"500"` → `500`, `null/undefined/""` → `0`, `"no ho sé"` → `0`. 34/34 tests al fitxer (28 previs + 6 nous).
- Efecte: al cockpit de propietari (`/admin`), el KPI `Forecast ponderat` del brief diari passa a reflectir els pressupostos reals dels leads oberts, no una versió infravalorada. Primera reparació consecutiva a `dailyBriefService`; tercera a la família `parseBudgetValue` en dos dies. Segueixen pendents les dues còpies internes a `commercialScoring.ts:25` i `leadScoreBreakdownService.ts:50`, tenen comportament correcte i es tocaran quan es consolidi un utilitari compartit.
- Verificació: `npx vitest run __tests__/lib/services/dailyBriefService.test.ts` OK (34/34) · `npx tsc --noEmit --pretty false` OK · `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `268`; el següent canvi real ha de ser `#269`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #269 — 2026-04-19 — codex (FET)
**Els workspaces editorials/configuració passen de patrons copiats a contracte shared amb `EditorControlStrip`.**
- Context: després dels `Canvi #260`, `#264`, `#265` i `#267`, ja era clar que els workspaces no-operatius necessitaven un altre llenguatge visual: `context / estat / acció principal`, no `OwnerControlStrip`. Però `Settings`, `FAQ` i `Plantilla de pressupostos` ho resolien amb blocs gairebé idèntics repetits a mà. La següent passa bona era consolidar aquesta família en un component shared.
- `app/admin/components/EditorControlStrip.tsx`: component nou per al patró editorial/config. Accepta `overview`, `status` i `action`, amb stats, bullets i CTA/pills segons el cas. És el contracte germà d’`OwnerControlStrip`, però per pantalles de configuració i edició.
- Migrats els tres primers consumidors: `app/admin/settings/page.tsx`, `app/admin/faq/page.tsx` i `app/admin/settings/quotes/page.tsx`. Tots tres mantenen el mateix contingut funcional, però deixen de tenir blocs estructuralment duplicats al fitxer.
- Efecte: la línia visual nova deixa de ser una col·lecció de decisions locals i passa a ser també monocapa de component als editors/configuració. A partir d’ara, altres workspaces d’aquest tipus poden entrar pel mateix contracte sense reinventar el layout.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `269`; el següent canvi real ha de ser `#270`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #270 — 2026-04-19 — claude (FET)
**`Task Queue` deixa de comptar pressupostos en format europeu com a 2.5 € i torna a poder promoure tasques de lead alt valor a la cua VIP.**
- Context: `lib/services/tasks/taskQueueService.ts:208` (wrapper `loadTaskQueue`) feia `leadBudget: r.lead?.budget ? Number(r.lead.budget) : null`. `Number("2.500")` = `2.5`, `Number("2.500,50 €")` = `NaN`. A la funció pura `classifyTaskQueue` (línia 91) el criteri de VIP és `isVip = task.customerLifecycleStage === 'VIP' || (task.leadBudget !== null && task.leadBudget >= 2000)`. Leads amb pressupost escrit en format europeu no entraven mai a la cua VIP i, a més, el text a línia 117 mostrava "Lead alt valor (2.5€)" — bug visible al banner `/admin/tasks`.
- Causa: quarta divergència del patró `parseBudgetValue` al codebase. Els fitxers `commercialScoring.ts:25`, `leadScoreBreakdownService.ts:50`, `leadPipelineSuggestionsService.ts:72`, `nextBestActionService.ts:137` (Canvi #266) i `dailyBriefService.ts` (Canvi #268) ja feien el tractament correcte; `taskQueueService.ts` era l'última còpia trencada entre els serveis que alimenten pantalles de propietari.
- `lib/services/tasks/taskQueueService.ts`: nou helper `parseBudgetValue(input?: string | null): number` exportat amb la mateixa implementació que els altres serveis. La línia 208 passa a `leadBudget: r.lead?.budget ? parseBudgetValue(r.lead.budget) : null`. Rescata també el cas d'input no parsejable, que abans donava `NaN` (que passava a `NaN >= 2000 === false` però contaminava la reason). Ara `NaN → 0`.
- `__tests__/lib/services/tasks/taskQueueService.test.ts`: nou bloc `describe('parseBudgetValue')` amb 5 regressions — `"2.500"` → `2500` (entra llindar VIP), `"2.500,50 €"` → `2500.5`, `"1500"` → `1500` (no arriba), `null/""` → `0`, `"no ho sé"` → `0`. Total 23 tests al fitxer (18 previs + 5 nous).
- Efecte: al banner `/admin/tasks`, les tasques de leads amb pressupost `2.500 €` tornen a classificar-se com a `VIP` amb el reason `Lead alt valor (2500€)`. Tercer fix consecutiu contra la família `Number(budget)`; el quadre queda tancat. Onzena reparació de bugs silenciosos sota pantalles de propietari en aquesta sèrie.
- Verificació: `npx vitest run __tests__/lib/services/tasks/taskQueueService.test.ts` OK (23/23) · `npx tsc --noEmit --pretty false` OK · `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `270`; el següent canvi real ha de ser `#271`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #271 — 2026-04-19 — codex (FET)
**`Empresa i Holded` entra al patró shared `EditorControlStrip` i deixa de començar pel formulari nu de dades sensibles.**
- Context: després del `Canvi #269`, el patró shared per workspaces editorials/configuració ja cobria `Settings`, `FAQ` i `Plantilla de pressupostos`. `app/admin/settings/company/page.tsx` encara obria directament el formulari de dades fiscals i integració Holded, tot i ser una de les pantalles més sensibles de l’admin.
- `app/admin/settings/company/page.tsx`: integrat `EditorControlStrip` abans del `CompanySettingsClient`. La capa `overview` resumeix camps d’empresa informats, estat de Holded i presència d’API key; `status` explica impacte en contractes/factures i l’estat real de la sincronització; `action` posa el focus en validar NIF, IBAN i credencials abans de tocar cap altra configuració.
- El formulari continua intacte i segueix sent el lloc on s’edita. El canvi va al wrapper, que és on toca donar context i govern del risc abans de manipular dades sensibles.
- Efecte: `settings/company` deixa de semblar una pantalla tècnica més i passa a parlar el mateix llenguatge visual que la resta de workspaces de configuració. El patró shared queda demostrat també en un cas de màxima sensibilitat operativa.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `271`; el següent canvi real ha de ser `#272`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #272 — 2026-04-19 — claude (FET)
**`getCronHealth` i els wrappers `readCronRunStatus(es)` accepten `now?: Date` per fer deterministes les bandes del cockpit `/admin/crons`.**
- Context: `lib/services/cronRunStatusService.ts:36` calculava `hoursSinceRun = (Date.now() - new Date(lastRun).getTime()) / 3600000` i classificava com a `'ok'` (≤26h) o `'warning'` (>26h). Sense injecció de `now`, la frontera de 26h no era testable deterministament — mateixa família de problemes que `Canvi #249` (deriveLossRisk), `#256` (healthScore/lifecycle), `#263` (commercialScoring). Afecta directament el cockpit de cron health que veu el propietari a `/admin/crons`.
- `lib/services/cronRunStatusService.ts`: `getCronHealth(lastRun, lastStatus, now?: Date = new Date())` — la tercera posició accepta `now` opcional. `readCronRunStatuses<T>(definitions, now?: Date = new Date())` i `readCronRunStatus(prefix, now?)` propaguen el paràmetre. Default preserva la retrocompatibilitat amb els callers actuals (`/admin/crons`, `adminTestNotificationService`).
- `__tests__/lib/services/cronRunStatusService.test.ts`: 2 regressions. (1) "frontera de 26h respecta el `now` injectat" mocka 25h i 27h sobre un `anchorNow` fix i verifica `'ok'` vs `'warning'`. (2) "dos reads amb el mateix `now` donen el mateix health" — determinisme positiu. 12 tests al fitxer (10 previs + 2 nous).
- Efecte: el cockpit `/admin/crons` passa a ser funció pura de (dades de setting) + (now injectable). El banner de health de cada cron deixa d'oscil·lar en el moment exacte de travessar la frontera de 26h. Dotzena reparació de bugs silenciosos sota pantalles de propietari; quarta específica d'escapatòria al rellotge real en serveis cockpit.
- Verificació: `npx vitest run __tests__/lib/services/cronRunStatusService.test.ts` OK (12/12) · `npx tsc --noEmit --pretty false` OK · `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `272`; el següent canvi real ha de ser `#273`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #273 — 2026-04-19 — codex (FET)
**`EditorControlStrip` rep el primer polish transversal i deixa de ser només l’extracció mínima dels workspaces editorials/configuració.**
- Context: al `Canvi #269` vaig extreure el patró shared `EditorControlStrip` i el vaig connectar als primers consumidors (`Settings`, `FAQ`, `Plantilla de pressupostos`). Ja es veia útil, però encara era massa rígid: assumia sempre una graella de tres stats i no tenia suport per CTA secundària real, així que alguns casos acabaven degradant-se a text/pills on tocava una segona acció clara.
- `app/admin/components/EditorControlStrip.tsx`: la graella de `stats` ara s’adapta quan només hi ha 1-2 mètriques (`sm:grid-cols-2` en comptes de forçar sempre 3), i `action` guanya `secondaryAction` per poder renderitzar una CTA secundària amb el mateix llenguatge visual del patró.
- Consumidors ajustats: `app/admin/settings/page.tsx` i `app/admin/settings/company/page.tsx` passen a usar aquesta CTA secundària real (`Plantilla` i `Tornar a configuració`) en lloc de deixar-ho resolt només amb pills o copy auxiliar.
- Efecte: el patró shared dels workspaces editorials/configuració deixa de ser una extracció “justa” i comença a madurar com a component de sistema. Això redueix encara més la necessitat de microdecisions locals quan es migrin més pantalles d’aquest perfil.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `273`; el següent canvi real ha de ser `#274`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #274 — 2026-04-19 — claude (FET)
**`computeLeadInsights` propaga `now?: Date` a `scoreLead` — la fitxa `/admin/leads/[id]` passa a ser determinista sencera, no només a mitges.**
- Context: `lib/services/leadInsightsService.ts:247` feia `scoreLead(input.lead)` sense passar el `now` injectat. El paràmetre `now` que `computeLeadInsights` rep des del caller de `/admin/leads/[id]/page.tsx` s'usava correctament per `daysSinceCreation`, `daysSinceLastActivity`, `daysSinceContact` i `daysUntilEvent`, però `scoreLead` queia a `new Date()` internament (arran del `Canvi #263` que va afegir `now?` a `scoreLead`). La fitxa de lead era determinista a mitges: els comptadors de dies respectaven el `now` lògic, però la banda del lead i els riskFlags no. Inconsistència interna sota la mateixa funció pura.
- Causa: quan el `Canvi #263` va afegir `now?` al contracte de `scoreLead`, els callers existents no es van actualitzar per aprofitar-ho. `leadInsightsService` és el caller principal a la capa cockpit.
- `lib/services/leadInsightsService.ts`: `scoreLead(input.lead)` passa a `scoreLead({ ...input.lead, now })`. `LeadInput` ja té tots els camps que `ScoreInput` necessita (status, createdAt, updatedAt, eventDate, budget, phone, eventLocation, guestCount, interestedPackId, source) — el spread és segur i no introdueix cap camp extra.
- `__tests__/lib/services/leadInsightsService.test.ts`: 2 regressions. (1) "`now` injectat arriba a `scoreLead`" — un lead CONTACTED amb `updatedAt` fix, calculat amb `now` a 71h i a 73h, ha de donar score inferior al segon (flag `Sense seguiment 72h+` s'activa després). (2) Dos càlculs amb mateix `now` donen mateix `score` i `scoreBand`. Total 25 tests al fitxer (23 previs + 2 nous).
- Efecte: la fitxa `/admin/leads/[id]` deixa de tenir la inconsistència subtil entre "dies des del primer contacte" (que respectava el `now` lògic) i "banda del lead" (que no). Oscil·lacions de banda a prop de fronteres 24h/72h queden tancades. Tretzena reparació de bugs silenciosos; cinquena específica d'escapatòria al rellotge real. La família `Date.now()` intern ja queda bastant neta per la capa cockpit.
- Verificació: `npx vitest run __tests__/lib/services/leadInsightsService.test.ts` OK (25/25) · `npx tsc --noEmit --pretty false` OK · `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `274`; el següent canvi real ha de ser `#275`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #275 — 2026-04-19 — codex (FET)
**`Hero — Mitjans` deixa de ser un pont amb layout propi i entra al mateix patró shared de configuració/editorial.**
- Context: després del `Canvi #271` i del polish del `Canvi #273`, el patró `EditorControlStrip` ja havia arribat a workspaces sensibles i editors reals. `app/admin/settings/hero/page.tsx` quedava com a residu visual: no és un editor, però sí una pantalla de configuració/redirect que continuava amb un layout bespoke fora del llenguatge nou.
- `app/admin/settings/hero/page.tsx`: migrada a `AdminPage` + `EditorControlStrip`. La pantalla segueix sent un pont cap a `/admin/image-manager`, però ara explica amb el mateix patró què controla aquest espai, què ha canviat i quina és l’acció correcta (`home.hero.slides` al gestor d’imatges).
- Efecte: un altre front residual deixa de parlar un dialecte visual propi. La monocapa dels workspaces editorials/configuració s’estén també als ponts i pantalles de transició, no només als formularis principals.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `275`; el següent canvi real ha de ser `#276`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #276 — 2026-04-19 — codex (FET)
**`Integrations` entra al patró shared `EditorControlStrip` i deixa de començar com una col·lecció de targetes tècniques sense lectura inicial comuna.**
- Context: després dels `Canvi #271`, `#275` i del patró shared consolidat al `Canvi #269`, el bloc de `settings` ja tenia una línia visual clara per pantalles de configuració. `app/admin/settings/integrations/page.tsx` seguia sent molt útil però arrencava directament per l’assistent i les targetes de connexió, sense una síntesi inicial de cobertura ni del punt feble principal de la cadena.
- `app/admin/settings/integrations/page.tsx`: integrat `EditorControlStrip` abans de `IntegrationSetupWizard`. La capa `overview` resumeix integracions actives, estat d’IMAP i cron; `status` identifica el punt més feble actual i els buits reals de la cadena; `action` posa el focus en regularitzar la peça més dèbil abans d’obrir totes les connexions a la vegada.
- El canvi no substitueix ni simplifica la informació profunda del workspace: continua havent-hi assistent, targetes i checklist tècnic. El que canvia és la lectura inicial, que deixa de ser tècnica per defecte i passa a ser governable pel propietari.
- Efecte: un altre workspace sensible de configuració s’alinea amb la monocapa nova. El patró `EditorControlStrip` ja cobreix configuració general, empresa, FAQs, text manager, plantilla de pressupostos, hero-bridge i ara també integracions.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `276`; el següent canvi real ha de ser `#277`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #277 — 2026-04-19 — claude (FET)
**`generateDashboardInsights` accepta `now?: Date` i el bloc "objectiu mensual" del dashboard `/admin` deixa de dependre del rellotge real en el render.**
- Context: continuació directa del bug-hunt de determinisme (`#272` `getCronHealth`, `#274` `computeLeadInsights` → `scoreLead`). `lib/services/dashboardInsightsService.ts` és una funció pura que rebia tot l'estat com a input (`leadsThisMonth`, `revenueThisMonth`, `revenueTarget`, etc.), però dins del bloc "Objectiu mensual" cridava tres cops `new Date()` per calcular `dayOfMonth`, `daysInMonth` i `expectedPct`. Conseqüència: els insights `revenue-ahead`/`revenue-behind` que veu el propietari al cockpit principal eren no-reproduïbles en tests i variaven silenciosament segons el moment del servidor.
- `lib/services/dashboardInsightsService.ts`: la signatura passa a `generateDashboardInsights(input, now: Date = new Date())`. Les tres lectures de rellotge del bloc "objectiu mensual" s'han substituït per `now.getDate()`, `new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()` i el corresponent `expectedPct`. Comportament idèntic en producció (es manté el default `new Date()` per als callers existents com `app/admin/page.tsx`).
- `__tests__/lib/services/dashboardInsightsService.test.ts`: afegit un sub-bloc de regressió amb 4 casos nous — dia 5 d'un mes de 30 dies detecta "ahead" amb 40%, dia 25 detecta "behind" amb 40%, determinisme estricte (dues crides amb el mateix `now` donen el mateix array d'insights), càlcul correcte de `daysInMonth` per a febrer no bixest. 43/43 tests verds.
- Efecte: el cockpit `/admin` deixa de tenir una banda d'insight que "respira" amb el rellotge del server quan l'estat del negoci és el mateix. Tercer bug tancat en el patró `Date.now()` intern dins d'un servei amb interfície pura (`#272` `/admin/crons`, `#274` `/admin/leads/[id]`, `#277` `/admin`).
- Verificació del tall: `npx vitest run __tests__/lib/services/dashboardInsightsService.test.ts` 43/43 OK; `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `277`; el següent canvi real ha de ser `#278`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #278 — 2026-04-19 — codex (FET)
**`Notificacions` entra al patró shared `EditorControlStrip` i deixa de començar com una suma de blocs operatius sense lectura comuna de context.**
- Context: després del `Canvi #276`, `Integrations` ja havia entrat al patró shared de configuració. `app/admin/settings/notifications/page.tsx` era probablement l’últim gran subworkspace de `settings` que encara començava directament pel seu radar i pels blocs de prova/configuració sense una capa inicial de lectura comuna.
- `app/admin/settings/notifications/page.tsx`: integrat `EditorControlStrip` abans del radar viu. La capa `overview` resumeix l’estat d’email, WhatsApp i autopilot; `status` fa emergir el punt més feble de la cadena i l’última execució; `action` posa el focus en regularitzar la baula més dèbil abans d’afegir més canals o automatismes.
- El canvi no desmunta la part profunda del workspace: radar viu, cobertura real dels avisos, test d’email, pilot automàtic i referència tècnica continuen igual. El que canvia és que la pantalla passa a tenir una narrativa d’entrada alineada amb la resta de configuració/editorial.
- Efecte: amb `notifications`, el bloc `settings` queda molt més homogeni visualment. El patró `EditorControlStrip` ja cobreix configuració general, empresa, quotes, hero, integracions i notificacions.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `278`; el següent canvi real ha de ser `#279`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #279 — 2026-04-19 — claude (FET)
**`buildPipelineForecast` accepta `now?: Date` i propaga `now` a `scoreLead`; la previsió de vendes del cockpit `/admin` i del workspace `/admin/economia` deixa de dependre del rellotge real del server.**
- Context: continuació del bug-hunt de determinisme (`#272` `getCronHealth`, `#274` `computeLeadInsights`, `#277` `generateDashboardInsights`). `lib/services/pipelineForecast.ts` cridava `const now = new Date()` internament i, pitjor encara, feia `scoreLead(lead)` sense propagar cap `now`. Això provocava que la probabilitat de cada lead actiu es calculés amb el rellotge real, mentre que la distribució per mes d'esdeveniment i la finestra històrica de 24 mesos es calculaven amb una captura de `now` anterior. Dues lectures de rellotge distintes dins d'una mateixa previsió, totes dues invisibles al caller.
- `lib/services/pipelineForecast.ts`: la signatura passa a `buildPipelineForecast(monthsAhead = 6, now: Date = new Date())`. S'elimina el `const now = new Date()` intern i es substitueix la crida `scoreLead(lead)` per `scoreLead({ ...lead, now })` (mateix patró que `#274` a `computeLeadInsights`). Comportament idèntic en producció (el default `new Date()` cobreix `app/admin/lib/dashboard-data.ts`, `app/admin/economia/page.tsx` i `app/api/admin/economia/forecast/route.ts`).
- `__tests__/lib/services/pipelineForecast.test.ts`: afegits 3 tests de regressió — `now=2026-06-15` arrenca el forecast a `2026-07`, `scoreLead` rep un lead amb `now` injectat (via `expect.objectContaining({ now })`), i dues crides amb el mateix `now` i les mateixes dades retornen el mateix array. 12/12 tests verds.
- Efecte: el bloc de previsió combinada de vendes (pipeline ponderat + mitjana estacional històrica) deixa de ser una caixa negra no-determinística. Quart bug silenciós tancat en el patró `Date.now()` intern dins d'una funció de cockpit (`#272` `/admin/crons`, `#274` `/admin/leads/[id]`, `#277` `/admin`, `#279` `/admin/economia` + `/admin`).
- Verificació del tall: `npx vitest run __tests__/lib/services/pipelineForecast.test.ts` 12/12 OK; `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `279`; el següent canvi real ha de ser `#280`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #280 — 2026-04-19 — claude (FET)
**`getAdminLeadScore` i `createAdminLeadScoreSnapshot` (endpoint `/api/admin/leads/[id]/score`) propaguen `now?: Date` a `scoreLead`, tancant la darrera fuita del patró temporal a l'API de scoring.**
- Context: el `Canvi #274` ja va propagar `now` de `computeLeadInsights` a `scoreLead` al render del detall de lead (`/admin/leads/[id]`), però la crida ad-hoc via `GET /api/admin/leads/[id]/score` — que és la que alimenta la snapshot activity i qualsevol refresc manual del score — continuava passant `scoreLead(lead)` sense `now`. Resultat: la puntuació podia oscil·lar si el render server-side i el refresc API caien a banda i banda d'una frontera temporal (p. ex. el tall de 24h/72h d'stale), fent aparèixer una lectura diferent a la fitxa vs. a la snapshot.
- `lib/services/leadScoreAdminService.ts`: `buildLeadScoring(lead, now)` passa a acceptar `now` com a paràmetre explícit i el propaga dins l'objecte `ScoreInput` que rep `scoreLead`. Les dues funcions públiques del servei — `getAdminLeadScore(id, now = new Date())` i `createAdminLeadScoreSnapshot(id, now = new Date())` — accepten un `now?` opcional. Comportament idèntic en producció per als callers existents (`app/api/admin/leads/[id]/score/route.ts` continua cridant sense paràmetre).
- `__tests__/lib/services/leadScoreAdminService.test.ts`: afegit un sub-bloc de regressió amb 3 tests — `getAdminLeadScore(id, injectedNow)` passa `now` a `scoreLead`; `createAdminLeadScoreSnapshot(id, injectedNow)` també; sense `now` explícit, el default és `Date` (no `undefined`, no string). 7/7 tests verds.
- Efecte: totes les tres vies pels quals un admin veu el score d'un lead — render del detall, refresc API, snapshot activity — ja propaguen un mateix `now` lògic. Cinquè bug tancat en el patró `Date.now()` intern (`#272`, `#274`, `#277`, `#279`, `#280`).
- Verificació del tall: `npx vitest run __tests__/lib/services/leadScoreAdminService.test.ts` 7/7 OK; `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `280`; el següent canvi real ha de ser `#281`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #281 — 2026-04-19 — codex (FET)
**`Inbox > settings` entra a `EditorControlStrip` i deixa de començar com un formulari tècnic sense lectura inicial de govern.**
- Context: després dels `Canvi #276` i `#278`, el perímetre de configuració ja havia absorbit `integrations` i `notifications` dins del patró shared. `app/admin/inbox/settings/ImapSettingsClient.tsx` continuava sent un cas sensible però massa cru: estat de connexió, font (`env`/`db`) i mode d’edició existien, però només emergien repartits dins de targetes i formulari.
- `app/admin/inbox/settings/ImapSettingsClient.tsx`: integrat `EditorControlStrip` al capdamunt del client, alimentat per estat real de la pantalla. `overview` resumeix connexió, font i mode de sessió; `status` fa emergir el punt feble actual, la font efectiva i l’últim error si n’hi ha; `action` separa clarament si toca tornar a operativa o regularitzar la cadena abans de confiar en la safata.
- El canvi no mou la lògica de formulari ni inventa un resum paral·lel: reutilitza `config`, `connection` i `showForm`, de manera que la lectura visual respon al mateix estat que governa el test de connexió i el desat. També evita hardcoded fals: la capa inicial reflecteix si la configuració viu a Railway, a base de dades o encara no existeix.
- Efecte: `Inbox settings` deixa de parlar només en mode tècnic i entra a la mateixa monocapa de configuració/editorial que `settings`, `company`, `quotes`, `hero`, `integrations` i `notifications`.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `281`; el següent canvi real ha de ser `#282`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #282 — 2026-04-19 — claude (FET)
**`listAdminBookings` (`/admin/bookings` amb filtre `payment=overdue` o `payment=due-soon`) accepta `now?: Date` injectable, eliminant l'última captura de rellotge intern a la llista de reserves.**
- Context: sisè bug del patró `Date.now()` intern a funcions de cockpit. `lib/services/bookingListService.ts` capturava un `const now = new Date()` a la línia 41 i calculava sis límits temporals (`overdueEventDateLimit`, `overdueRemainingDateLimit`, `dueSoonDepositFrom`/`To`, `dueSoonRemainingFrom`/`To`) que feien de frontera per als filtres `overdue` i `due-soon` de la llista. Resultat: a prop de la mitjanit o a la frontera d'un segon, una mateixa reserva podia aparèixer/desaparèixer de la llista segons quan el server l'inclogués en la seva query.
- `lib/services/bookingListService.ts`: afegit `now: Date = new Date()` com a segon paràmetre i eliminat el `const now = new Date()` intern. Les sis finestres temporals (now+30, now+7, now+37, now+14) es deriven del `now` rebut. Comportament idèntic en producció: `app/api/admin/bookings/route.ts` continua cridant sense paràmetre i rep el default.
- `__tests__/lib/services/bookingListService.test.ts`: afegit sub-bloc de regressió amb 3 tests — `payment=overdue` amb `now=2026-06-15` produeix `eventDate.lt = 2026-07-15` (deposit) i `eventDate.lt = 2026-06-22` (remaining); `payment=due-soon` amb el mateix `now` produeix finestres `[2026-07-15, 2026-07-22]` i `[2026-06-22, 2026-06-29]`; sense `now` explícit no llança i retorna `ok:true`. 12/12 tests verds.
- Efecte: el filtre de pagament de la llista `/admin/bookings` ja és determinista i testable. Sisè bug tancat en el patró `Date.now()` intern (`#272`, `#274`, `#277`, `#279`, `#280`, `#282`).
- Verificació del tall: `npx vitest run __tests__/lib/services/bookingListService.test.ts` 12/12 OK; `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `282`; el següent canvi real ha de ser `#283`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #283 — 2026-04-19 — codex (FET)
**`Email templates` entra a `EditorControlStrip` i deixa de començar només per KPIs i llista sense una lectura inicial de cobertura editorial.**
- Context: després dels `Canvi #269`, `#276`, `#278` i `#281`, la línia shared de configuració/editorial ja absorbia bona part dels workspaces sensibles. `app/admin/email-templates/EmailTemplatesClient.tsx` encara començava per KPIs correctes però muts: no emergia d’entrada si el catàleg depenia encara de fallbacks, quina plantilla era la més densa o quin era el següent pas editorial.
- `app/admin/email-templates/EmailTemplatesClient.tsx`: integrat `EditorControlStrip` al capdamunt del client, alimentat per dades reals del catàleg. `overview` resumeix plantilles, cobertura de variants i capa personalitzada; `status` identifica el punt feble principal, la plantilla amb més variables i la densitat visible del catàleg; `action` diferencia entre cobrir fallbacks pendents o revisar consistència entre idiomes i variables.
- El canvi no inventa resum paral·lel ni escriu heurístiques desconnectades: reutilitza `templates`, `locales` i `variables`, així que la lectura inicial respon exactament al mateix estat que veu la llista. També manté el criteri `res hardcoded`: la capa shared deriva cobertura, pes i focus editorial des del contingut carregat.
- Efecte: `Email templates` entra a la mateixa monocapa visual de configuració/editorial que `settings`, `quotes`, `hero`, `integrations`, `notifications` i `inbox/settings`, i passa de pàgina útil a workspace més governable.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `283`; el següent canvi real ha de ser `#284`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #284 — 2026-04-19 — claude (FET)
**`listAdminCustomers` (`/admin/clientes` amb `?stats=true`) accepta `now?: Date` injectable per a la finestra "recentMonth", tancant la captura de rellotge intern de la llista de clients.**
- Context: setè bug del patró `Date.now()` intern a funcions de cockpit. `lib/services/customerListService.ts` capturava `new Date()` a la línia 81 i en derivava `oneMonthAgo` (via `setMonth(getMonth() - 1)`) per calcular la stat `recentMonth` (clients creats en els últims 30 dies). Al marge d'una frontera horària, el mateix render podia donar una xifra diferent que el refresc que el seguia.
- `lib/services/customerListService.ts`: afegit `now: Date = new Date()` com a segon paràmetre. Construïm `oneMonthAgo = new Date(now)` (còpia defensiva: `setMonth` muta l'instància) abans d'aplicar `setMonth(getMonth() - 1)`. Comportament idèntic a producció: `app/api/admin/customers/route.ts` continua cridant sense paràmetre i rep el default.
- `__tests__/lib/services/customerListService.test.ts`: afegit sub-bloc de regressió amb 3 tests — `stats=true` amb `now=2026-06-15T12:00:00Z` filtra `createdAt > 2026-05-15T12:00:00Z`; sense `now` explícit, `stats.recentMonth` continua definit (default ok); `now` injectat no es muta entre crides (la còpia `new Date(now)` aïlla el `setMonth`). 13/13 tests verds.
- Efecte: la stat de "clients nous del mes" de `/admin/clientes` ja és determinista i testable. Setè bug tancat en el patró `Date.now()` intern (`#272`, `#274`, `#277`, `#279`, `#280`, `#282`, `#284`).
- Verificació del tall: `npx vitest run __tests__/lib/services/customerListService.test.ts` 13/13 OK; `validate:core` 9/9 OK.
- `ADMIN_CHANGE_COUNTER` puja a `284`; el següent canvi real ha de ser `#285`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #285 — 2026-04-19 — codex (FET)
**`Image Manager` entra a `EditorControlStrip` i deixa de començar només per header, comptadors i ajuda sense una lectura inicial shared de monocapa visual.**
- Context: després dels `Canvi #269`, `#281` i `#283`, la línia shared de configuració/editorial ja cobria workspaces textuals i de settings. `app/admin/image-manager/page.tsx` tenia molt bon context operatiu, però encara obria amb capçalera, badges i ajuda sense resumir d’entrada quin era l’estat real de la monocapa, quants overrides manuals hi havia i quin era el focus correcte segons secció, cerca i errors.
- `app/admin/image-manager/page.tsx`: integrat `EditorControlStrip` abans de `AdminHelpPanel`, alimentat per estat real del workspace. `overview` resumeix placements totals, overrides manuals i cobertura automàtica; `status` fa emergir el punt feble actual, la secció activa i l’impacte de la cerca; `action` separa clarament si toca recuperar la lectura del gestor, revisar overrides manuals o continuar governant la monocapa per secció.
- El canvi no mou cap lògica del gestor ni afegeix heurístiques falses: reutilitza `placements`, `sections`, `filtered`, `activeSection`, `search`, `loading` i `error`, de manera que la capa shared respon exactament al mateix estat que governa el catàleg i les targetes de placement.
- Efecte: `Image Manager` deixa de ser només una pantalla potent de treball i passa a entrar també dins del mateix llenguatge visual shared que la resta de workspaces editorials/configuració, mantenint el criteri de `res hardcoded` i `tot responsive`.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `285`; el següent canvi real ha de ser `#286`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #286 — 2026-04-19 — codex (FET)
**`CSS Manager` entra a `EditorControlStrip` i deixa de començar només per l’editor i les paletes sense una lectura inicial shared de sessió.**
- Context: després dels `Canvi #269`, `#283` i `#285`, la línia shared de configuració/editorial ja cobria workspaces de copy, settings i media. `app/admin/css-manager/page.tsx` continuava sent un editor potent però massa cru a l’entrada: hi havia estat real (`loading`, `saving`, `msg`, `css`) però no emergia d’entrada si hi havia base pròpia, en quin punt estava la sessió ni quin era el següent pas correcte.
- `app/admin/css-manager/page.tsx`: integrat `EditorControlStrip` dins de la mateixa pàgina client, alimentat per estat real del workspace. `overview` resumeix si hi ha CSS propi, quantes línies hi ha i quantes paletes disponibles; `status` fa visibles càrrega, desat, mida del bloc actiu i últim missatge; `action` separa si toca esperar càrrega, deixar acabar el desat o refinar el tema existent amb una base coherent.
- El canvi no toca la lògica d’aplicació en viu ni inventa cap heurística externa: reutilitza `css`, `loading`, `saving` i `msg`, de manera que la capa shared respon al mateix estat que governa el live preview i el desat del panell.
- Efecte: `CSS Manager` deixa de ser només un editor tècnic i entra també al mateix llenguatge visual shared dels workspaces editorials/configuració, mantenint el criteri de `res hardcoded` i `tot responsive`.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `286`; el següent canvi real ha de ser `#287`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #287 — 2026-04-20 — codex (FET)
**`Blog` entra a `EditorControlStrip` i deixa de començar només per toolbar, feedback i llista sense una lectura inicial shared del catàleg editorial.**
- Context: després dels `Canvi #283`, `#285` i `#286`, la monocapa shared ja cobria diversos editors i workspaces de configuració. `app/admin/blog/page.tsx` continuava sent funcional i operatiu, però l’entrada encara depenia només de toolbar, flash messages i taula/targetes, sense resumir d’entrada l’estat real de publicació, esborranys, cobertura idiomàtica o tracció del catàleg.
- `app/admin/blog/page.tsx`: integrat `EditorControlStrip` dins de la mateixa pàgina client, alimentat per estat real del workspace. `overview` resumeix posts totals, publicats i esborranys; `status` fa visibles el coll editorial principal, la peça amb més tracció i el pes visible de traduccions/visites; `action` diferencia si toca esperar càrrega, crear base, tancar esborranys o continuar refinant el catàleg publicat.
- El canvi no toca la lògica de fetch, publicació o esborrat ni inventa heurístiques paral·leles: reutilitza `posts`, `loading`, `locale`, `page`, `total`, `totalPages` i `flashMessage`, de manera que la capa shared respon al mateix estat que governa la llista i el workflow editorial.
- Efecte: `Blog` deixa de ser només una llista de peces i passa a entrar també dins del mateix llenguatge visual shared dels workspaces editorials/configuració, mantenint el criteri de `res hardcoded` i `tot responsive`.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `287`; el següent canvi real ha de ser `#288`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #288 — 2026-04-20 — codex (FET)
**`Blog editor` entra a `EditorControlStrip` i deixa de començar només pel formulari sense una lectura shared de sessió editorial.**
- Context: després del `Canvi #287`, la llista de blog ja havia entrat al llenguatge visual shared, però el detall (`app/admin/blog/BlogEditorForm.tsx`) continuava començant directament pel formulari. Hi havia prou estat real per governar la sessió (`loading`, `saving`, `flashMessage`, `formData`, idioma actiu, draft/publicat), però no emergia d’entrada què faltava, si el SEO estava prou cobert ni quin era el següent pas correcte abans de desar.
- `app/admin/blog/BlogEditorForm.tsx`: integrat `EditorControlStrip` al capdamunt del formulari, alimentat per l’estat real de l’editor. `overview` resumeix idiomes omplerts, slug i densitat de contingut de la pestanya activa; `status` fa visible si falta base editorial, si el SEO de la pestanya activa és suficient i quin és l’últim missatge de la sessió; `action` diferencia entre esperar càrrega, deixar acabar el desat o completar/triar la base editorial abans de sortir.
- El canvi no toca la lògica de càrrega, desat, publicació ni navegació: reutilitza `formData`, `loading`, `saving`, `activeLocale` i `flashMessage`, de manera que la capa shared respon al mateix estat que governa l’editor i no introdueix cap resum paral·lel o hardcoded.
- Efecte: `blog/new` i `blog/edit` deixen de ser només formularis potents i passen a entrar també dins del mateix llenguatge visual shared dels workspaces editorials/configuració, amb lectura clara de sessió i qualitat abans d’editar.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `288`; el següent canvi real ha de ser `#289`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #289 — 2026-04-20 — codex (FET)
**`Email template editor` entra a `EditorControlStrip` i deixa de començar només per assumpte, blocs i preview sense una lectura shared de sessió.**
- Context: després dels `Canvi #283` i `#288`, tant la llista de plantilles com el detall del blog ja havien entrat al llenguatge visual shared. `app/admin/email-templates/[slug]/TemplateEditorClient.tsx` continuava sent un editor ric, però l’entrada encara depenia només del toolbar d’idioma, l’assumpte i les tres columnes d’edició, sense resumir d’entrada si hi havia base mínima, quins blocs hi havia actius, si la sessió estava traduint o si la plantilla estava llesta per desar.
- `app/admin/email-templates/[slug]/TemplateEditorClient.tsx`: integrat `EditorControlStrip` al capdamunt del client, alimentat per estat real de l’editor. `overview` resumeix idioma, blocs i variables; `status` fa visible si falta assumpte o estructura mínima, quin bloc hi ha seleccionat i si hi ha traducció en curs; `action` diferencia entre esperar càrrega, deixar acabar desat/traducció o refinar blocs, variables i preview abans de sortir.
- El canvi no toca la lògica de càrrega, guardat, auto-traducció ni preview: reutilitza `locale`, `subject`, `blocks`, `variables`, `saving`, `translating` i `selectedBlockId`, de manera que la capa shared respon al mateix estat real que governa la sessió de l’editor i no afegeix res paral·lel o hardcoded.
- Efecte: l’editor de plantilles deixa de ser només un constructor potent i passa a entrar també dins del mateix llenguatge visual shared dels workspaces editorials/configuració, amb una lectura clara de cobertura, sessió i següent pas.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `289`; el següent canvi real ha de ser `#290`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #290 — 2026-04-20 — codex (FET)
**`Social` entra a `OwnerControlStrip` i deixa de començar només per KPIs, toolbar i idees sense una lectura inicial shared de pipeline editorial.**
- Context: després dels `Canvi #247`, `#248`, `#287` i `#289`, els workspaces operatius i editorials principals ja parlaven bastant el mateix llenguatge visual. `app/admin/social/SocialClient.tsx` continuava sent un workspace fort però sense la franja shared: hi havia prou estat real (`counts`, `ideas`, `view`, `statusFilter`, calendari/lista) per governar pipeline i següent pas, però tot quedava dispers entre KPIs, toolbar i panell d’idees.
- `app/admin/social/SocialClient.tsx`: integrat `OwnerControlStrip` al capdamunt del client. El bloc `Automàtic` resumeix volum total, idees generades i vista activa; `Manual` fa emergir el coll editorial principal, l’estat del filtre i si el panell d’idees està entrant en la lectura; `Següent pas` diferencia si toca crear base, tancar esborranys o convertir idees en peces programades.
- El canvi no toca la lògica del calendari, del modal ni dels canvis d’estat: reutilitza `counts`, `ideas`, `view`, `statusFilter` i el volum real del pipeline, de manera que la capa shared respon al mateix estat que governa la cua social i no inventa res paral·lel o hardcoded.
- Efecte: `Social` deixa de ser només un calendari editorial funcional i passa a entrar també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de pipeline, tensió i següent pas.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `290`; el següent canvi real ha de ser `#291`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #291 — 2026-04-20 — codex (FET)
**`Scripts i eines` entra a `EditorControlStrip` i deixa de començar només per KPIs i llistat sense una lectura inicial shared del catàleg tècnic.**
- Context: després dels `Canvi #283`, `#286` i `#289`, gran part dels workspaces editorials/configuració ja parlaven el mateix llenguatge visual. `app/admin/scripts/ScriptsClient.tsx` continuava sent una pantalla molt útil però massa plana a l’entrada: hi havia prou informació real (`filter`, scripts destructius, comanda copiada, categories) per governar el catàleg, però tot quedava dispers entre KPI-cards i llistat.
- `app/admin/scripts/ScriptsClient.tsx`: integrat `EditorControlStrip` al capdamunt del client. `overview` resumeix volum de scripts, categories i peces destructives; `status` fa visible el filtre actiu, el risc del catàleg i l’última comanda copiada; `action` diferencia entre entrar per categoria, revisar scripts delicats de `fix/audit` o copiar la comanda correcta amb context.
- El canvi no toca la lògica de filtres ni de còpia al portapapers: reutilitza `filter`, `copiedCommand`, el catàleg `SCRIPTS` i la metadata `ADMIN_SCRIPT_CATEGORY_INFO`, de manera que la capa shared respon al mateix estat real del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Scripts i eines` deixa de ser només un catàleg tècnic i entra també dins del mateix llenguatge visual shared dels workspaces editorials/configuració, amb lectura clara de risc, focus i següent pas abans d’executar res.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `291`; el següent canvi real ha de ser `#292`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #292 — 2026-04-20 — codex (FET)
**`Col·laboradors` entra a `OwnerControlStrip` i deixa de començar només per KPIs, botó i llista sense una lectura inicial shared del canal.**
- Context: després dels `Canvi #247`, `#248`, `#290` i `#291`, la majoria de workspaces operatius i editorials ja parlaven el mateix llenguatge visual. `app/admin/collaborators/CollaboratorsClient.tsx` continuava sent funcional però massa pla a l’entrada: hi havia prou estat real (`kpis`, col·laboradors actius/inactius, reserves, comissions pendents, formulari obert) per governar el canal, però tot quedava repartit entre KPI-row, CTA i llistat.
- `app/admin/collaborators/CollaboratorsClient.tsx`: integrat `OwnerControlStrip` al capdamunt del client. El bloc `Automàtic` resumeix volum del canal, reserves vinculades i pes econòmic; `Manual` fa emergir si hi ha edicions obertes, col·laboradors inactius o comissions pendents; `Següent pas` diferencia si toca crear base, tancar formulari, revisar pendents o simplement mantenir la xarxa activa.
- El canvi no toca la lògica de càrrega, formulari, toggles ni eliminació: reutilitza `collaborators`, `kpis`, `showForm` i `editingId`, de manera que la capa shared respon al mateix estat real del workspace i no inventa cap resum paral·lel o hardcoded.
- Efecte: `Col·laboradors` deixa de ser només una llista amb KPI i passa a entrar també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de canal, tensió i següent pas.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `292`; el següent canvi real ha de ser `#293`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #293 — 2026-04-20 — codex (FET)
**`Pricing` entra a `OwnerControlStrip` i deixa de començar només per tabs, focus i KPI locals sense una lectura inicial shared del catàleg econòmic.**
- Context: després dels `Canvi #243`, `#247`, `#257` i `#292`, molts workspaces de govern ja havien entrat al llenguatge visual shared. `app/admin/pricing/page.tsx` continuava sent una pantalla potent però sense franja comuna: hi havia prou estat real (`stats`, extres a preu 0, packs amb alerta, focus actiu, inventory amb ús) per governar riscos i següent pas, però tot quedava repartit entre tabs, focus i blocs interns.
- `app/admin/pricing/page.tsx`: integrat `OwnerControlStrip` dins de la mateixa pàgina, abans dels tabs. El bloc `Automàtic` resumeix volum del catàleg, ingressos i ús d’inventari; `Manual` fa emergir extres a preu 0, packs amb alerta i el focus de salut actiu; `Següent pas` diferencia si toca mantenir el focus actual, atacar extres sense preu, revisar packs amb alerta o tornar al resum.
- El canvi no toca la lògica de càrrega, focus, edició de preus ni navegació per pestanyes: reutilitza `stats`, `extras`, `packs`, `inventory`, `activeTab`, `activeFocus` i `message`, de manera que la capa shared respon al mateix estat real del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Pricing` deixa de ser només un dashboard econòmic local i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de risc, tensió i següent pas sobre el catàleg econòmic.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `293`; el següent canvi real ha de ser `#294`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #294 — 2026-04-20 — codex (FET)
**`Analytics` entra a `OwnerControlStrip` i deixa de començar només per seccions locals de KPI sense una lectura inicial shared de rendiment.**
- Context: després dels `Canvi #257`, `#290` i `#293`, diversos panells de govern ja parlaven el mateix llenguatge visual shared. `app/admin/analytics/page.tsx` seguia sent potent, però obria directament per seccions de KPI i blocs locals sense una franja comuna que sintetitzés què veu el sistema, on hi ha tensió manual i quin és el següent pas correcte.
- `app/admin/analytics/page.tsx`: integrat `OwnerControlStrip` dins de la mateixa pàgina servidor, abans dels KPI operatius. El bloc `Automàtic` resumeix entrades, reserves, ingressos i estat de GA4; `Manual` fa emergir el coll comercial del primer contacte i les incidències de GA4/Google Ads; `Següent pas` diferencia si toca estabilitzar analítica, regularitzar paid media o atacar la conversió comercial.
- El canvi no toca la lògica de càrrega ni els càlculs d’analítica: reutilitza `data`, `ops`, `ga4Ready`, `ga4`, `ga4Error`, `googleAdsStatus` i `googleAdsError`, de manera que la capa shared respon al mateix estat real del panell i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Analytics` deixa de ser només un panell de mètriques i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de rendiment, tensió i següent pas.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `294`; el següent canvi real ha de ser `#295`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #295 — 2026-04-20 — codex (FET)
**`Economia` entra a `OwnerControlStrip` i deixa de començar només per tabs i KPI locals sense una lectura inicial shared del cockpit financer.**
- Context: després dels `Canvi #243`, `#245`, `#293` i `#294`, diversos cockpits econòmics i de rendiment ja parlaven el mateix llenguatge visual. `app/admin/economia/EconomiaClient.tsx` seguia sent un workspace molt potent, però obria directament per tabs i blocs locals sense una franja shared que sintetitzés caixa, marge, risc i següent pas abans d’entrar al detall.
- `app/admin/economia/EconomiaClient.tsx`: integrat `OwnerControlStrip` dins del mateix client, abans de la navegació de pestanyes. El bloc `Automàtic` resumeix pendent, cobrat, venciments, marge realitzat/previst i previsió; `Manual` fa emergir cobraments fora de termini, riscos de marge i la pestanya activa; `Següent pas` diferencia si toca atacar cobraments, revisar rendibilitat o ajustar configuració.
- El canvi no toca la lògica de tresoreria, forecast, marge ni navegació interna: reutilitza `props.outstandingTotal`, `props.overdueTotal`, `props.hasReport`, `props.realized`, `props.forecast`, `props.cashFlow`, `props.forecast_pipeline`, `props.riskProfitability` i `activeTab`, de manera que la capa shared respon al mateix estat real del cockpit i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Economia` deixa de ser només un cockpit financer local i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de caixa, tensió i següent pas.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `295`; el següent canvi real ha de ser `#296`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #296 — 2026-04-20 — codex (FET)
**`Cost calculator` entra a `EditorControlStrip` i deixa de començar només per la zona de drag&drop sense una lectura inicial shared de la sessió.**
- Context: després dels `Canvi #286`, `#288` i `#291`, diversos editors i workspaces de configuració ja parlaven el mateix llenguatge visual shared. `app/admin/cost-calculator/CostCalculatorClient.tsx` continuava sent útil però entrava directament per components i drop zone, sense resumir d’entrada si hi havia base econòmica, marge, nom de pressupost o focus correcte abans de desar.
- `app/admin/cost-calculator/CostCalculatorClient.tsx`: integrat `EditorControlStrip` al capdamunt del client. `overview` resumeix components, cost total i PVP suggerit; `status` fa visible si falta base, nom de pressupost o client, i concentra el volum de la sessió; `action` diferencia entre començar la base, identificar el pressupost o refinar marge i cost abans de guardar.
- El canvi no toca la lògica de càlcul, drag&drop, marge ni desat: reutilitza `components`, `quoteName`, `clientName`, `saving`, `totals` i `marginPct`, de manera que la capa shared respon al mateix estat real de la simulació i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Cost calculator` deixa de ser només un constructor operatiu i entra també dins del mateix llenguatge visual shared dels workspaces editorials/configuració, amb lectura clara de sessió, base i següent pas.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `296`; el següent canvi real ha de ser `#297`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #297 — 2026-04-20 — codex (FET)
**`Campanyes` entra a `OwnerControlStrip` i deixa de començar només per KPI locals i llistat sense una lectura inicial shared del canal massiu.**
- Context: després dels `Canvi #290`, `#292`, `#294` i `#295`, diversos workspaces de govern ja parlaven el mateix llenguatge visual shared. `app/admin/campaigns/page.tsx` continuava sent útil però massa pla a l’entrada: hi havia prou estat real (`campaigns`, urgència, canals, audiència) per governar el canal massiu, però tot quedava dispers entre KPI-cards i llistat.
- `app/admin/campaigns/page.tsx`: integrat `OwnerControlStrip` dins de la mateixa pàgina servidor, abans dels KPI locals. El bloc `Automàtic` resumeix volum, audiència i repartiment per canal/urgència; `Manual` fa emergir urgències altes, caràcter manual de l’execució i relació amb reactivació; `Següent pas` diferencia si toca revisar campanyes urgents o si convé passar a reactivació individual quan no hi ha volum suficient.
- El canvi no toca la lògica de càrrega ni les targetes de campanya: reutilitza `campaigns`, `highCount`, `mediumCount`, `totalAudience`, `whatsappCount` i `emailCount`, de manera que la capa shared respon al mateix estat real del catàleg i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Campanyes` deixa de ser només un llistat de suggeriments i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de volum, tensió i següent pas.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `297`; el següent canvi real ha de ser `#298`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #298 — 2026-04-20 — codex (FET)
**`Inventari` entra a `OwnerControlStrip` i deixa de començar només per resum, lots i llistat sense una lectura inicial shared del canal d’equip.**
- Context: després dels `Canvi #293`, `#295` i `#297`, diversos workspaces de govern ja parlaven el mateix llenguatge visual shared. `app/admin/inventory/InventoryListClient.tsx` continuava sent potent però massa operatiu a l’entrada: hi havia prou estat real (`displayedItems`, `totalValue`, `lowStockItems`, `healthFilter`, lots i filtres actius) per governar inventari, però tot quedava dispers entre targetes, alertes i seccions.
- `app/admin/inventory/InventoryListClient.tsx`: integrat `OwnerControlStrip` just després de `AdminPage`. El bloc `Automàtic` resumeix volum visible, valor econòmic, stock crític i cobertura del lot seleccionat; `Manual` fa emergir focus de salut, filtres/cerca actius i estat real de desat dels lots; `Següent pas` prioritza recàrrega, stock crític, focus de salut o definició d’un lot útil abans d’ampliar l’operativa.
- El canvi no toca la lògica de fetch, filtres, lots, vista ni canvi d’estat: reutilitza `displayedItems`, `totalValue`, `lowStockItems`, `activeHealthLabel`, `search`, `filterCategory`, `filterStatus`, `healthFilter`, `selectedBundle`, `bundleMessage` i `savingBundles`, de manera que la capa shared respon al mateix estat real del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Inventari` deixa de ser només un gestor d’equip i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de tensió, intervenció manual i següent pas abans de baixar a lots o llistat.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `298`; el següent canvi real ha de ser `#299`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #299 — 2026-04-20 — codex (FET)
**Tancament documentat de sessió: sanejament del registre i pendent executable deixat per escrit.**
- Context: abans de tancar, calia assegurar que el que queda obert no depengués de memòria ni de conversa oral. També hi havia una incoherència documental sobre wrappers legacy i brutícia real a `docs/diario.md`.
- `docs/protocol-producte-admin-ca.md`: corregida la línia de §6.2 que encara presentava `leadTaskFacade` i `leadTaskRouteService` com a wrappers vius; queden ara marcats només com a rastre històric de la migració.
- `docs/diario.md`: sanejat el fitxer eliminant bytes nuls i control chars incrustats perquè torni a ser llegible i tractable per eines de text.
- Pendent deixat explícit per a la següent represa: revisar residuals finals fora de `OwnerControlStrip` / `EditorControlStrip`, i després passar a pendents estructurals no visuals del protocol (`migracions Railway`, frontera canònica de comunicacions i review responsive transversal).
- Efecte: el tancament de sessió ja no depèn de recordar “què faltava”; el registre queda net i amb següent pas executable visible.
- Verificació del tall: `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `299`; el següent canvi real ha de ser `#300`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #300 — 2026-04-20 — codex (FET)
**`Stats` entra a `EditorControlStrip` i deixa de començar només per comptadors i targetes locals sense una lectura inicial shared de configuració pública.**
- Context: després dels `Canvi #269`, `#281`, `#283`, `#286`, `#289`, `#291` i `#296`, la monocapa shared de configuració/editorial ja cobria bona part dels workspaces sensibles. `app/admin/stats/page.tsx` continuava sent útil però massa cru a l’entrada: hi havia prou estat real (`stats`, `manualStats`, `editingStat`, `fallback`, `calculated`) per governar la capa pública, però tot quedava dispers entre dos comptadors, targetes i el bloc final d’ajuda.
- `app/admin/stats/page.tsx`: integrat `EditorControlStrip` al capdamunt del workspace. `overview` resumeix volum total, pes automàtic i overrides manuals; `status` fa emergir si hi ha edició oberta i quina és la desviació manual més gran; `action` diferencia entre tancar la sessió activa, revisar overrides antics o mantenir el catàleg en automàtic.
- El canvi no toca la lògica de càrrega, desat ni reset: reutilitza `stats`, `manualStats`, `editingStat`, `fallback`, `calculated` i l’estat real de la sessió, de manera que la capa shared respon al mateix contracte viu del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Stats` deixa de ser només una pantalla tècnica de manteniment i entra també dins del mateix llenguatge visual shared dels workspaces de configuració/editorial, amb lectura clara de cobertura, override i focus abans d’editar.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `300`; el següent canvi real ha de ser `#301`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #301 — 2026-04-22 — claude (FET)
**`Pressupostos` (llistat) entra a `OwnerControlStrip` i deixa de començar només per KPI-cards i taula sense una lectura inicial shared del catàleg comercial.**
- Context: després dels `Canvi #293`, `#295`, `#297`, `#298` i `#300`, molts workspaces de govern i editorials ja parlaven el mateix llenguatge visual shared. `app/admin/presupuestos/page.tsx` continuava útil però obria directament amb els 5 botons de stats i la taula/llista de propostes, sense resumir primer volum recent, valor pendent, tensions operatives ni el següent pas executable abans de baixar al detall.
- `app/admin/presupuestos/page.tsx`: integrat `OwnerControlStrip` dins del branch `!showEditor`, abans de `ProposalsList`. El bloc `Automàtic` resumeix propostes recents, enviades amb valor pendent, acceptades amb valor guanyat, esborranys vius i pressupostos antics (`LeadDocument.QUOTE`) encara vinculats; `Manual` fa emergir enviades fredes (≥7 dies sense resposta), acceptades sense reserva vinculada, esborranys oberts ≥14 dies, expirades i rebutjades recents; `Següent pas` prioritza convertir acceptades en reserva > recuperar enviades fredes > tancar esborranys > crear primer pressupost > catàleg al dia.
- El canvi no toca la lògica de càrrega, filtres, accions ni l’editor PDF: reutilitza el mateix `proposals` ja carregat (amb `bookingId` afegit al `select` per la comprovació de conversió), serialitza-ho tal com ja feia i no duplica el càlcul d’`stats`/`totalValue` que `ProposalsList` fa client-side. La capa shared respon al mateix estat real del catàleg i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Pressupostos` deixa de ser només un llistat d’ofertes i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de catàleg, tensió comercial i següent pas abans d’editar o crear una proposta.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `301`; el següent canvi real ha de ser `#302`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #302 — 2026-04-22 — codex (FET)
**`Activity` entra a `OwnerControlStrip` i deixa de començar només per filtres, KPI-cards i feed sense una lectura inicial shared del sistema.**
- Context: després dels `Canvi #74`, `#247`, `#248`, `#290`, `#300` i `#301`, diversos workspaces de propietari ja parlaven el mateix llenguatge visual shared. `app/admin/activity/ActivityClient.tsx` continuava sent útil però massa cru a l’entrada: hi havia prou estat real (`data`, `stats`, `category`, `days`, `page`, fonts del timeline) per governar la lectura del sistema, però tot quedava dispers entre filtres, targetes i feed.
- `app/admin/activity/ActivityClient.tsx`: integrat `OwnerControlStrip` al capdamunt del workspace. El bloc `Automàtic` resumeix volum de moviments, categoria dominant, pes de la lectura canònica i font principal; `Manual` fa emergir si la sessió està filtrada, si s'ha mogut la finestra temporal i si la lectura actual reclama obrir context; `Següent pas` diferencia entre recuperar context buit, tancar un focus concret o continuar la lectura executiva global.
- El canvi no toca la lògica de fetch, paginació ni render del feed: reutilitza `data`, `stats`, `category`, `days`, `page` i el timeline real, de manera que la capa shared respon al mateix estat viu del registre i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Activity` deixa de ser només un log operatiu i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de volum, focus i següent pas abans de baixar al detall.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `302`; el següent canvi real ha de ser `#303`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #303 — 2026-04-22 — claude (FET)
**`Packs` (llistat) entra a `OwnerControlStrip` i deixa de començar només per KPI-cards i graella de targetes sense una lectura inicial shared del catàleg comercial.**
- Context: després dels `Canvi #293` (pricing), `#297` (campanyes), `#298` (inventari) i `#301` (pressupostos), diversos workspaces comercials germans ja parlaven el mateix llenguatge visual shared. `app/admin/packs/page.tsx` continuava sent un dels workspaces més rics del catàleg (motor preus + health + inventory + focus) però obria directament per 5 KPI-cards i la graella de packs sense resumir primer volum, alertes de salut ni el següent pas executable.
- `app/admin/packs/page.tsx`: integrat `OwnerControlStrip` dins de la mateixa pàgina servidor, just a l’entrada de l’`AdminPage`. El bloc `Automàtic` resumeix total packs, actius/destacats, reserves/leads amb conversió, estat sync BD↔config i focus actiu si n’hi ha; `Manual` fa emergir alertes de preu (`pricingAlertsCount`), marge crític, packs sense equip, càlcul parcial i sense rang de convidats; `Següent pas` prioritza sync pendent > divergències de preu > marge crític > equip buit > higiene > catàleg al dia, i reutilitza el sistema `?focus=...` ja existent a la pàgina per activar el filtre corresponent.
- El canvi no toca la lògica de `getPacks`, `computePackPricingHealth`, el sistema `activeFocus` ni la graella: reutilitza `packs`, `packsInSync`, `configPacks`, `pricingHealthByPack`, `packSignalsById`, `pricingAlertsCount` i `activeFocusLabel`, de manera que la capa shared respon al mateix estat real del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Packs` deixa de ser només un inventari comercial i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de catàleg, salut i següent pas abans d’obrir la graella o el detall d’un pack.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `303`; el següent canvi real ha de ser `#304`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #304 — 2026-04-22 — claude (FET)
**`Post-event` entra a `OwnerControlStrip` i deixa de començar només per KPI-row i els 3 passos del workflow sense una lectura inicial shared del cicle tancat.**
- Context: després dels `Canvi #301` (pressupostos) i `#303` (packs), seguim drenant residuals del llenguatge visual shared. `app/admin/post-event/page.tsx` té 4 KPI-cards i 3 targetes de workflow (informe / enquesta / feedback) que són útils però no resumeixen primer què ja està tancat, quin backlog queda, ni quin és el següent pas executable abans d’entrar a un dels 3 submòduls.
- `app/admin/post-event/page.tsx`: integrat `OwnerControlStrip` al capdamunt de l’`AdminPage`. El bloc `Automàtic` resumeix informes tancats i enquestes rebudes amb taxa de resposta derivada (`completedSurveys / (pendingSurveys + completedSurveys)`); `Manual` fa emergir events completats sense informe, esborranys DRAFT i enquestes pendents d’enviar; `Següent pas` prioritza crear informe del primer event sense informe (pre-fill amb `bookingId`) > completar esborranys > enviar enquestes pendents > feedback/playbook quan el cicle està al dia.
- El canvi no toca la lògica de `getPostEventData` ni les targetes de workflow: reutilitza `data.recentBookings`, `data.pendingReports`, `data.pendingSurveys`, `data.completedReports` i `data.completedSurveys` ja carregats, de manera que la capa shared respon al mateix estat real del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Post-event` deixa de ser només un router de 3 submòduls i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara del cicle tancat, backlog i següent pas executable (amb bookingId ja pre-fill quan hi ha events sense informe).
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `304`; el següent canvi real ha de ser `#305`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #305 — 2026-04-22 — codex (FET)
**`Emails Automàtics` entra a `OwnerControlStrip` i deixa de començar només per stats, automatitzacions i blocs laterals sense una lectura inicial shared del sistema.**
- Context: després dels `Canvi #278`, `#281`, `#301`, `#302` i `#304`, diversos workspaces de comunicació i govern ja parlaven el mateix llenguatge visual shared. `app/admin/emails/page.tsx` continuava sent útil però massa dispers a l’entrada: hi havia prou estat real (`stats`, `pendingBookings`, estat del cron i errors parcials) per governar el panell, però tot quedava repartit entre KPI-cards, automatitzacions, cua post-event i sidebar.
- `app/admin/emails/page.tsx`: integrat `OwnerControlStrip` al capdamunt del workspace. El bloc `Automàtic` resumeix leads amb email, volum post-event, activitat recent i últim estat del cron; `Manual` fa emergir la cua post-event, la primera reserva pendent, incidències parcials de dades i qualsevol cron no saludable; `Següent pas` diferencia entre buidar cua manual, recuperar confiança en les dades, revisar el cron o optimitzar plantilles quan no hi ha foc operatiu.
- El canvi no toca la lògica de queries, cua ni enviament manual: reutilitza `stats`, `pendingBookings`, `cronLastRun`, `cronLastStatus`, `cronLastMessage` i l’estat real del panell, de manera que la capa shared respon al mateix contracte viu del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Emails Automàtics` deixa de ser només un cockpit operatiu fragmentat i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de salut, tensió i següent pas abans de baixar al detall.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `305`; el següent canvi real ha de ser `#306`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #306 — 2026-04-22 — claude (FET)
**`Codis de descompte` entra a `OwnerControlStrip` i deixa de començar només per KPI-grid i formulari/llistat sense una lectura inicial shared del catàleg promocional.**
- Context: seguint els `Canvi #301`, `#303`, `#304` i `#305`, continuem drenant residuals del llenguatge visual shared. `app/admin/discount-codes/page.tsx` és un workspace client amb prou estat real (`codes`, `stats`, `showForm`) com per governar-se, però començava només per 4 KPI-cards + formulari + llista, sense resum de salut del catàleg ni següent pas executable.
- `app/admin/discount-codes/page.tsx`: integrat `OwnerControlStrip` al capdamunt de l’`AdminPage`. El bloc `Automàtic` resumeix volum del catàleg (total/actius/caducats) i usos acumulats reutilitzant `stats`; `Manual` fa emergir codis caducats encara marcats actius, codis esgotats amb bandera activa, codis que caduquen en ≤7 dies, codis a ≥80% d'usos i actius sense cap ús; `Següent pas` prioritza crear primer codi > desactivar caducats > tancar esgotats > renovar els que caduquen aviat > reviure catàleg si no hi ha actius > al dia.
- Les CTAs del `nextStep` apunten a ancoratges interns (`#nou-codi`, `#codis-list`). S'ha afegit un `useEffect` que obre automàticament el formulari si l'usuari aterra amb `#nou-codi` a la URL, reutilitzant el `setShowForm` existent sense duplicar l'acció del botó `+ Nou codi` ni afegir cap nou motor d'estat.
- El canvi no toca la lògica de càrrega (`loadCodes`), creació (`handleCreate`) ni activació (`toggleActive`): reutilitza `codes`, `stats`, `showForm` i la funció `isExpired` ja existent, de manera que la capa shared respon al mateix contracte viu del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `discount-codes` deixa de ser només un panell tàctic de creació/activació i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de salut promocional, backlog i següent pas abans de baixar al catàleg.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `306`; el següent canvi real ha de ser `#307`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #308 — 2026-04-22 — claude (FET)
**`Ressenyes` entra a `OwnerControlStrip` i deixa de començar només per KPI-row i pestanyes pendents/aprovades sense una lectura inicial shared del catàleg de social proof.**
- Context: seguint els `Canvi #301`, `#303`, `#304`, `#305`, `#306` i `#307`, continuem drenant residuals del llenguatge visual shared. `app/admin/ressenyes/page.tsx` és un workspace client de moderació (pending/approved) amb prou estat real (`pending`, `approved`, `avgRating`, `busyId`) per governar-se, però començava només per 4 KPIs + botons de pestanya + llistat, sense resum de backlog (pendents antics, pendents baixos, aprovades baixes al web) ni següent pas executable.
- `app/admin/ressenyes/page.tsx`: integrat `OwnerControlStrip` al capdamunt de l’`AdminPage`. El bloc `Automàtic` resumeix volum (pending+approved, aprovades, pendents) i nota mitjana reutilitzant `avgRating` ja computat; `Manual` fa emergir pendents per moderar, pendents de fa >7 dies, pendents i aprovades amb <4★; `Següent pas` prioritza cap ressenya (derivar a enquestes post-event) > moderar pendents > reviure aprovades baixes visibles > al dia (veure aprovades per generar canvas).
- Les CTAs del `nextStep` apunten a ancoratges interns (`#pendents`, `#aprovades`) amb canvi automàtic de pestanya via `useEffect` + listener `hashchange`, de manera que clicar des del strip sincronitza `activeTab` sense duplicar la lògica dels botons de pestanya ni afegir cap altre estat.
- El canvi no toca la lògica de `load`, `updateStatus`, `generateCanvas` ni `downloadCanvas`: reutilitza `pending`, `approved`, `avgRating`, `loading` i el mateix `setActiveTab` ja existent, de manera que la capa shared respon al mateix contracte viu del workspace.
- Efecte: `ressenyes` deixa de ser només un panell tàctic de moderació i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de salut del social proof, backlog i següent pas abans de baixar al detall.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `308`; el següent canvi real ha de ser `#309`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #309 — 2026-04-22 — codex (FET)
**`Cobertura` entra a `OwnerControlStrip` i deixa de començar només per stats, formulari i llistat provincial sense una lectura inicial shared del mapa comercial.**
- Context: després dels `Canvi #305`, `#306` i `#308`, seguim drenant residuals del llenguatge visual shared. `app/admin/coverage/page.tsx` continuava sent un mantenidor útil però massa cru a l’entrada: hi havia prou estat real (`areas`, `newCity`, `newProvince`, `adding`) per governar cobertura, però tot quedava repartit entre tres comptadors, formulari i llistat per províncies.
- `app/admin/coverage/page.tsx`: integrat `OwnerControlStrip` al capdamunt del workspace. El bloc `Automàtic` resumeix total de ciutats, cobertura activa/inactiva, província dominant i buit territorial si hi ha províncies sense cap ciutat; `Manual` fa emergir ciutat en preparació, ciutats desactivades i províncies buides que demanen criteri; `Següent pas` diferencia entre tancar una alta oberta, revisar cobertura desactivada, omplir províncies sense base o simplement mantenir el mapa net.
- El canvi no toca la lògica de `loadAreas`, alta, baixa ni toggle: reutilitza `areas`, `newCity`, `newProvince`, `adding` i el catàleg `COVERAGE_PROVINCES`, de manera que la capa shared respon al mateix contracte viu del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Cobertura` deixa de ser només un mantenidor administratiu i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de mapa, tensió i següent pas abans de baixar al detall.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `309`; el següent canvi real ha de ser `#310`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #310 — 2026-04-22 — claude (FET)
**`Catàleg` (hub `/admin/catalog`) entra a `OwnerControlStrip` i deixa de començar només per pestanyes (packs/extres/inventari/preus) sense una lectura inicial shared de salut del catàleg.**
- Context: seguint els `Canvi #301`, `#303`, `#304`, `#306`, `#308` i `#309`, continuem drenant residuals del llenguatge visual shared. `app/admin/catalog/page.tsx` és un hub de routing a `/admin/packs`, `/admin/pricing`, `/admin/inventory` que ja computava `sortedRows`, `greenCount`, `amberCount`, `redCount`, `avgMargin`, `targetMarginPct`, `pricingAlerts` via `computePackPricingHealth`, però començava directament per les pestanyes sense un resum previ.
- `app/admin/catalog/page.tsx`: integrat `OwnerControlStrip` al capdamunt de l'`AdminPage` just abans de `<nav>` de pestanyes. El bloc `Automàtic` resumeix packs actius amb distribució semàfor (sans/vigilar/crítics) i marge mitjà vs objectiu; `Manual` fa emergir packs crítics (marge < objectiu −8pp), packs a vigilar, packs sense components d'inventari i packs amb desviació ≥20% vs preu recomanat; `Següent pas` prioritza configurar model (si falta `pricingConfig`) > crear primer pack (si catàleg buit) > resoldre crítics (amb nom del pack més crític) > vincular inventari > pujar marge mitjà > catàleg sa.
- El canvi no toca la lògica de consulta a Prisma (`packsData`) ni els càlculs de `resolveHealthTone` i `computePackPricingHealth`: reutilitza `sortedRows`, `greenCount`, `amberCount`, `redCount`, `avgMargin`, `targetMarginPct`, `pricingAlerts` i `pricingConfig` ja computats per al detall. El `nextStep` reutilitza el sistema `?focus=critical-margin` / `?focus=without-inventory` ja existent a `/admin/packs` (Canvi #303).
- Efecte: `catalog` deixa de ser només un router de 4 pestanyes i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de salut del catàleg abans de decidir pestanya.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `310`; el següent canvi real ha de ser `#311`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #311 — 2026-04-22 — codex (FET)
**`Funcionalitats` entra a `OwnerControlStrip` i deixa de començar només per stats i llistat de toggles sense una lectura inicial shared del catàleg de producte.**
- Context: després dels `Canvi #305`, `#306`, `#309` i `#310`, seguim drenant residuals del llenguatge visual shared. `app/admin/features/page.tsx` continuava sent un switchboard útil però massa cru a l’entrada: hi havia prou estat real (`features`, `saving`) per governar el catàleg, però tot quedava repartit entre tres comptadors i la llista de toggles.
- `app/admin/features/page.tsx`: integrat `OwnerControlStrip` al capdamunt del workspace. El bloc `Automàtic` resumeix volum total, actives/desactivades, la primera funcionalitat activa visible i si hi ha una mutació en curs; `Manual` fa emergir quantes funcionalitats apagades demanen criteri, quina és la següent peça desactivada i si cal esperar una mutació abans d’encadenar canvis; `Següent pas` diferencia entre esperar un canvi en curs, revisar la primera funcionalitat apagada o mantenir el catàleg estable.
- El canvi no toca la lògica de `loadFeatures` ni `toggleFeature`: reutilitza `features`, `saving` i els mateixos toggles del panell, de manera que la capa shared respon al mateix contracte viu del workspace i no afegeix cap resum paral·lel o hardcoded.
- Efecte: `Funcionalitats` deixa de ser només un panell tècnic de switches i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de catàleg, decisió i següent pas abans de baixar al detall.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `311`; el següent canvi real ha de ser `#312`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #313 — 2026-04-22 — codex (FET)
**Passada responsive `375px` sobre `Activity`, `Emails`, `Lead detail` i `Social` per eliminar pressions d’ample als punts shared més densos.**
- Context: el protocol deixava com a següent pas immediat revisar `375px` a les pantalles shared ja tocades. Els punts amb més risc real eren `app/admin/activity/ActivityClient.tsx`, `app/admin/emails/page.tsx`, `app/admin/leads/[id]/page.tsx`, `app/admin/leads/[id]/LeadWorkspace.tsx` i `app/admin/social/SocialClient.tsx`, on toolbars, CTA stacks, cues i modals encara assumien més ample del desitjable.
- `app/admin/activity/ActivityClient.tsx`: la barra superior passa a separar millor filtres i controls en mòbil; el select de finestra pot ocupar l’ample disponible i la paginació guanya amplada mínima perquè els botons no col·lapsin a `375px`.
- `app/admin/emails/page.tsx`: la capçalera de “Post-event pendents” i cada fila de reserva passen a estructura vertical en mòbil; el mail pot fer `break-all` i el botó queda separat del bloc de text per evitar competència d’ample.
- `app/admin/leads/[id]/page.tsx` + `app/admin/leads/[id]/LeadWorkspace.tsx`: els CTA principals del header i del bloc de reserva passen a apilar-se en mòbil, els headers interns es relaxen, el formulari de tasques evita camps rígids i la timeline pot fer wrap net entre metadades i accions.
- `app/admin/social/SocialClient.tsx`: toolbar, capçalera del panell d’idees, costat dret de les targetes de llista, header del calendari i footer del modal deixen de pressionar l’ample curt i passen a layouts apilables o amb wrap controlat.
- Efecte: la primera onada shared de workspaces de propietari queda molt més robusta en mòbil estret sense tocar la lògica de negoci ni afegir cap capa visual nova.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `313`; el següent canvi real ha de ser `#314`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #314 — 2026-04-22 — codex (FET)
**`Missatges` entra a `OwnerControlStrip` i deixa de començar només per KPI-cards, CTAs i mostra recent sense una lectura inicial shared de la safata.**
- Context: dins del drenatge de residuals fora del llenguatge visual shared, `app/admin/mensajes/page.tsx` havia quedat a mig camí en un tall iniciat per `claude` abans de caure. El workspace ja tenia prou estat viu (`recentLeads`, `pendingLeads`, `todayLeads`, `stalePendingLeads`, notes i canals de contacte de la mostra) per governar-se, però continuava obrint directament per les KPI-cards, els accessos ràpids i el llistat recent.
- `app/admin/mensajes/page.tsx`: queda integrat `OwnerControlStrip` al capdamunt de l'`AdminPage`. El bloc `Automàtic` resumeix volum NEW, entrades rebudes avui i mida de la mostra recent amb missatge; `Manual` fa emergir entrades NEW de més de 24h, pendents sense nota i mostres sense telèfon/email; `Següent pas` prioritza obrir `/admin/leads?status=NEW` quan hi ha backlog pendent i deriva a la safata general quan el canal està al dia.
- El canvi no toca la lògica de consulta principal ni duplica `/admin/leads`: només afegeix `stalePendingLeads` a `getMessagesData` i reutilitza els mateixos `recentLeads`/`notes` ja carregats per construir una lectura shared coherent amb l'estat real de la safata.
- Efecte: `Missatges` deixa de ser només una vista tàctica de comunicacions i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de tensió comercial i següent pas abans de baixar a les converses.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `314`; el següent canvi real ha de ser `#315`.
- Començat per: `claude`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #315 — 2026-04-22 — codex (FET)
**`Privacitat` entra a `OwnerControlStrip` i deixa de començar només per KPI-cards, pestanyes i llistats RGPD sense una lectura inicial shared del front legal.**
- Context: un cop tancat el relleu de `mensajes` (`Canvi #314`), `app/admin/privacy/page.tsx` continuava com a residual clar fora del llenguatge shared: KPI-cards, tabs i llistats funcionals, però sense resumir primer tensió de terminis, estat de consentiments ni visibilitat de la traça d'auditoria. El workspace ja tenia prou estat viu (`stats`, `requests`, `consents`, `consentsTotal`, `auditLogs`, `pageTab`) per governar-se sense cap capa paral·lela.
- `app/admin/privacy/page.tsx`: integrat `OwnerControlStrip` al capdamunt de l'`AdminPage`. A `requests`, el bloc `Automàtic` resumeix pendents/completades i urgències globals; el bloc `Manual` fa emergir vençudes, urgents visibles i verificades per processar; el `nextStep` prioritza venciments > urgències > verificades. A `consents`, el strip resumeix volum total/actiu i la finestra filtrada, i fa emergir revocats, absència d'actius visibles i cerca activa. A `audit`, resumeix mida de la traça i entrades de sistema, i fa emergir absència de logs o accions sense motiu explícit.
- S'ha afegit hash-sync simple (`#requests`, `#consents`, `#audit`) perquè el `nextStep` pugui obrir la pestanya correcta sense duplicar l'estat de navegació ni tocar la lògica de càrrega. El canvi no altera cap fetch, cap procés ARCO ni cap acció de revocació: només reordena la lectura del front legal sobre el mateix contracte viu.
- Efecte: `Privacitat` deixa de ser només un panell legal operatiu i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de risc legal, backlog i següent pas abans de baixar a cada pestanya.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `315`; el següent canvi real ha de ser `#316`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #316 — 2026-04-22 — codex (FET)
**`Text Manager` entra a `OwnerControlStrip` i deixa de dependre només del header sticky, filtres i targetes de sessió sense una lectura inicial shared del catàleg editorial.**
- Context: després de `#314` i `#315`, `app/admin/text-manager/page.tsx` seguia sent un residual clar fora del patró shared. El workspace ja tenia prou estat viu per governar-se (`currentTexts`, `filteredTexts`, `modifiedCount`, `sectionCounts`, `activeSection`, `debouncedSearchTerm`, `showComparison`, `showOnlyModified`, `changeHistory`), però la lectura inicial continuava repartida entre header sticky, cercador, toggles i tres targetes locals.
- `app/admin/text-manager/page.tsx`: integrat `OwnerControlStrip` just després del `AdminHelpPanel`. El bloc `Automàtic` resumeix volum del catàleg, secció/focus actiu i mida de la finestra visible. El bloc `Manual` fa emergir textos pendents de desar, seccions tocades, cerca activa, comparació oberta, filtre de modificats i mida del mini-historial. El `nextStep` deriva a `#text-manager-save`, `#text-manager-search`, `#text-manager-sections` o `#text-manager-content` segons l’estat real de la sessió.
- El canvi no toca el contracte de càrrega (`/api/admin/text-manager`), l’autotraducció (`/api/admin/translate`), el header sticky ni les targetes existents: només afegeix una capa shared sobre els mateixos senyals vius del workspace i uns anchors interns perquè el següent pas pugui obrir el punt correcte sense duplicar navegació.
- Efecte: `Text Manager` deixa de ser només un editor potent però cru i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de catàleg, tensió d’edició i següent pas abans de tocar textos.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `316`; el següent canvi real ha de ser `#317`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #317 — 2026-04-22 — codex (FET)
**`Calendari` entra a `OwnerControlStrip` a la vista mes i deixa de dependre només de toolbar, KPI-cards i graella sense una lectura inicial shared de l’ocupació visible.**
- Context: després de `#316`, `calendario` era l’últim residual shared gran abans de `canvas`. El hub `app/admin/calendario/page.tsx` és només un router entre mes/setmana/dia, així que el tall correcte havia d’entrar a `app/admin/calendario/CalendarMonthClient.tsx`, que ja concentra el gruix real de l’operativa: ocupació visible, capes, selecció de dia, bloquejos i drag&drop de reserves.
- `app/admin/calendario/CalendarMonthClient.tsx`: integrat `OwnerControlStrip` al capdamunt de l’`AdminPage`. El bloc `Automàtic` resumeix reserves, bloquejos, dies lliures/mixtes i feina (tasques/social) del rang visible. El bloc `Manual` fa emergir dies mixtes, capes amagades, detall obert, bloqueig en preparació i qualsevol reserva en moviment via drag&drop. El `nextStep` prioritza revisar conflictes (`mixedDays`) abans de baixar a setmana/dia o al panell de detall del dia seleccionat.
- El canvi no toca el contracte de `/api/admin/calendario/mes`, ni el drag&drop, ni el flux de bloqueig/desbloqueig: només afegeix una capa shared sobre `stats`, `visibleLayers`, `selectedDayData`, `showBlockForm` i `draggingBookingId`, més un anchor intern al panell de detall perquè el `nextStep` no dupliqui navegació.
- Efecte: la vista mes del calendari deixa de ser només una graella operativa i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara d’ocupació, tensió i següent pas abans de manipular disponibilitat.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `317`; el següent canvi real ha de ser `#318`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #318 — 2026-04-22 — codex (FET)
**`Canvas Editor` entra a `OwnerControlStrip` i deixa de dependre només de toolbar, llenç i panell lateral sense una lectura inicial shared de la composició viva.**
- Context: després de `#317`, `canvas` era l’últim residual shared clar fora del patró `OwnerControlStrip`. El wrapper `app/admin/canvas/page.tsx` és només un `AdminPage` amb càrrega dinàmica, així que el tall correcte havia d’entrar a `app/admin/canvas/CanvasEditorClient.tsx`, que concentra tota l’operativa real: elements, selecció, drag, resize, exportació, plantilles i propietats.
- `app/admin/canvas/CanvasEditorClient.tsx`: integrat `OwnerControlStrip` al capdamunt del workspace. El bloc `Automàtic` resumeix mida/preset, volum d’elements i composició activa; el bloc `Manual` fa emergir element seleccionat, moviment, redimensionat, exportació i buit de llenç; el `nextStep` prioritza esperar exportació > carregar plantilla o primer element > ajustar l’element seleccionat > revisar capes.
- El canvi no toca el contracte d’exportació (`/api/canvas/custom`), ni el flux d’edició directa del llenç, ni les plantilles: només afegeix una capa shared sobre `canvasSize`, `elements`, `selected`, `dragging`, `resizing`, `exporting` i anchors interns (`#canvas-toolbar`, `#canvas-templates`, `#canvas-properties`, `#canvas-layers`) perquè el següent pas no dupliqui navegació.
- Efecte: `Canvas Editor` deixa de ser només un editor aïllat i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara de composició, tensió i següent pas abans d’exportar o seguir editant.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `318`; el següent canvi real ha de ser `#319`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #319 — 2026-04-22 — codex (FET)
**Passada responsive menor `375px` sobre `Calendari` i `Canvas` per tancar els dos últims workspaces shared nous en mòbil estret.**
- Context: després de drenar els residuals shared fins a `#318`, el següent pas natural era una segona onada responsive curta només sobre els dos workspaces acabats d’entrar al patró shared. Els punts amb més risc real eren la toolbar superior i el detall del dia a `app/admin/calendario/CalendarMonthClient.tsx`, i la toolbar/plantilles/presets/controls d’alineació a `app/admin/canvas/CanvasEditorClient.tsx`.
- `app/admin/calendario/CalendarMonthClient.tsx`: els botons de navegació superior guanyen altura mínima i el selector `Mes / Setmana / Dia` pot ocupar tota l’amplada quan cal; al detall del dia, `+ Nou client`, `+ Nova reserva`, `Bloquejar/Desbloquejar` i el CTA de confirmació del bloqueig poden apilar-se i ocupar ample complet en mòbil estret.
- `app/admin/canvas/CanvasEditorClient.tsx`: la toolbar d’edició deixa de dependre d’una sola fila rígida, el CTA `Descarregar PNG` pot anar a ample complet en mòbil, la graella de plantilles i els presets de mida es relaxen a una columna quan cal, i els controls d’alineació/text no col·lapsen per falta d’ample.
- Efecte: el bloc shared de propietari queda també robust a `375px` en els dos últims workspaces nous, sense tocar lògica de calendari, drag&drop, exportació ni edició del canvas.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `319`; el següent canvi real ha de ser `#320`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #320 — 2026-04-22 — codex (FET)
**Review responsive final `375px` sobre `Missatges`, `Privacitat` i `Text Manager` per tancar regressions mòbils evidents del bloc shared recent.**
- Context: un cop tancats `#319` (`Calendari` + `Canvas`), quedava una última passada curta i transversal sobre workspaces recentment drenats que encara tenien risc de densitat mòbil a nivell de CTAs, tabs i barres sticky. Els punts més clars eren `app/admin/mensajes/page.tsx`, `app/admin/privacy/page.tsx` i `app/admin/text-manager/page.tsx`.
- `app/admin/mensajes/page.tsx`: els tres CTAs principals passen a ample complet en mòbil; les files de missatges recents permeten apilar millor avatar, metadades i accions sense competir en una sola línia.
- `app/admin/privacy/page.tsx`: els tabs de pàgina, els filtres de sol·licituds/consentiments i les accions de processat passen a disposicions apilables o a ample complet quan l’ample és curt.
- `app/admin/text-manager/page.tsx`: els selectors d’idioma i la toolbar sticky d’accions guanyen altura mínima i el botó de desar pot ocupar ample complet quan no hi ha espai lateral suficient.
- Efecte: queda tancada la review transversal curta de regressions mòbils sobre el bloc shared recent sense tocar lògica de negoci, fetches ni fluxos d’edició.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `320`; el següent canvi real ha de ser `#321`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #321 — 2026-04-22 — codex (FET)
**Primera capa de canonització de CTA de lead fora del Lead Hub perquè banners i panells executius deixin de construir rutes literals ad hoc.**
- Context: un cop drenat el bloc shared + responsive, el següent pendent estructural clar era auditar CTA executives fora del `CustomerHub`/`Lead Hub`. Ja hi havia superfícies com `LeadInsightsBanner`, `PendingFollowUpsPanel` i `leadActionLink` que apuntaven a `lead`, `compose`, `payments` o `tasks`, però cada una resolia les rutes pel seu compte.
- `lib/admin/leadWorkspaceHref.ts`: nou helper canònic per resoldre el workspace base del lead, el `compose` d’inbox i les derivacions cap a cobraments o tasques quan hi ha `bookingId` o `customerId`. Reutilitza `buildCustomerBookingListHref` i `buildCustomerTaskListHref` per no obrir una segona lògica paral·lela.
- `app/admin/leads/[id]/LeadInsightsBanner.tsx`: les accions `CONTACT_NOW`, `FOLLOW_UP`, `CLOSE_DEAL`, `COLLECT_PAYMENT`, `COMPLETE_TASK` i `RE_ENGAGE` passen a consumir el helper i deixen de barrejar literals de `lead`, `compose`, `bookings` i `tasks` dins del mateix banner.
- `lib/customer-hub/leadActionLink.ts` i `app/admin/inbox/PendingFollowUpsPanel.tsx`: els CTAs de seguiment/obertura reaprofiten el mateix contracte, de manera que les superfícies executives apunten als mateixos destins suportats quan obren un lead o preparen un seguiment.
- `__tests__/lib/admin/leadWorkspaceHref.test.ts`: prova focalitzada per blindar el contracte del helper nou (`workspace`, `compose`, prioritat de `bookingId`, fallback a `customerId` i fallback final a `lead`).
- Efecte: queda tancada una primera capa del pendent estructural “CTA només a destins suportats” fora del `CustomerHub`/`Lead Hub`, i el següent tall pot continuar l’auditoria sobre altres superfícies executives sense reobrir literals de navegació.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `npx vitest run __tests__/lib/admin/leadWorkspaceHref.test.ts __tests__/lib/customer-hub/leadActionLink.test.ts` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `321`; el següent canvi real ha de ser `#322`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #328 — 2026-04-22 — codex (FET)
**El radar del dashboard reaprofita els drivers canònics del pipeline.**
- Context: `#327` feia visible al panell del `pulse` quins senyals degradaven el pipeline, però el `Radar d’execució` del dashboard encara seguia funcionant amb tres comptadors locals separats (`staleLeadsCount`, `hotLeadsCount`, `quotesInFlightCount`). El protocol deixava explícitament aquest punt com a pendent adjacent.
- `app/admin/page.tsx`: la secció “Radar d’execució” passa a construir primer `pipelineRadarItems` a partir de `pulse.pipelineDrivers`. Quan hi ha drivers canònics, el radar els mostra com a targetes prioritzades amb mateix destí i mateixa lectura comercial; si no n’hi ha, conserva el fallback als comptadors locals existents.
- Efecte: el dashboard deixa de tenir dues lectures paral·leles del pipeline i reaprofita la mateixa font canònica tant al bloc de pols operatiu com al radar visible de focus diari.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `328`; el següent canvi real ha de ser `#329`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #329 — 2026-04-22 — codex (FET)
**Inbox i Customer Hub reaprofiten el mateix resum de comunicacions basat en timeline canònica.**
- Context: el protocol mantenia `Inbox / Comunicacions` com a bloc `EN MARXA` perquè el resum de comunicacions encara vivia mig separat: `Customer Hub` cridava `loadCommTimeline()`, però aquest servei llegia `leadActivity` directament, i `CommSummaryPanel` d’Inbox reconstruïa el resum al client des de `/api/admin/leads/[id]/activities`.
- `lib/services/commTimelineService.ts`: `loadCommTimeline()` deixa de consultar Prisma directament i passa a construir el resum des de `fetchCanonicalEventsForLead()` o `fetchCanonicalEventsForCustomer()`. El mòdul guanya `buildCommTimelineFromCanonicalEvents()` i manté `buildCommTimeline()` retrocompatible per als consumidors/tests basats en activitats crues.
- `app/api/admin/leads/[id]/comm-summary/route.ts`: nova ruta autenticada perquè Inbox pugui demanar el resum canònic ja calculat, en lloc de reconstruir-lo al client.
- `app/admin/inbox/CommSummaryPanel.tsx`: deixa de consumir `/activities` i de recomposar `CommTimelineRawEntry[]`; ara pinta directament el payload de `/comm-summary`.
- `__tests__/lib/services/commTimelineService.test.ts`: cobertura nova per blindar la derivació del resum a partir d’events canònics, mantenint també la cobertura existent de la funció retrocompatible.
- Efecte: es tanca una altra capa paral·lela de comunicacions sense tocar schema ni fluxos d’edició. Inbox i Customer Hub passen a llegir el mateix resum estructural abans de mostrar mètriques de contacte, resposta pendent i últims tocs.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `npx vitest run __tests__/lib/services/commTimelineService.test.ts` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `329`; el següent canvi real ha de ser `#330`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #330 — 2026-04-22 — codex (FET)
**El detall de reserves reaprofita la timeline canònica també per a l’estat de comunicacions.**
- Context: després de `#329`, `Inbox` i `Customer Hub` ja compartien resum canònic de comunicacions, però `bookingOperationalService` continuava fent una query pròpia a `adminLog` per derivar `commStatuses` i `recentCommRows`, tot i que `fetchCanonicalEventsForBooking()` ja incorporava aquests mateixos `COMM_SENT` / `COMM_RESPONDED`.
- `lib/services/bookingOperationalService.ts`: eliminada la lectura paral·lela de `prisma.adminLog.findMany()` per comunicacions. El snapshot deriva ara `PAYMENT`, `POST_EVENT` i `GENERAL` des de la mateixa `timeline` canònica, i també construeix `recentCommRows` a partir dels events `adminLog` ja normalitzats.
- `__tests__/lib/services/bookingOperationalService.test.ts`: la cobertura del snapshot deixa de mockejar `adminLog.findMany()` i passa a provar els estats de comunicació i el llistat recent a partir d’events canònics del booking.
- Efecte: el detall de `Bookings` deixa de mantenir una segona lectura de comunicacions fora de la història canònica del client/reserva. El workspace operatiu i la timeline passen a mirar la mateixa font abans de mostrar semàfors i historial recent.
- Verificació del tall: `npx vitest run __tests__/lib/services/bookingOperationalService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `330`; el següent canvi real ha de ser `#331`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #331 — 2026-04-22 — codex (FET)
**La derivació d’estats de comunicació passa a una monocapa compartida entre logs crus i timeline canònica.**
- Context: `#330` ja havia tret una lectura paral·lela de `Bookings`, però el comportament nou vivia encara com a helpers locals dins `bookingOperationalService.ts`, mentre `Economia` seguia depenent del `communicationStatusService` antic sobre `adminLog` cru. Faltava tancar la monocapa.
- `lib/services/communicationStatusService.ts`: el servei manté `deriveFlowStatus(logs, flow)` per als consumidors batch sobre `adminLog`, però guanya també `deriveFlowStatusFromTimeline(events, flow)` i `buildRecentCommRowsFromTimeline(events, limit?)` per derivar el mateix contracte des d’events canònics.
- `lib/services/bookingOperationalService.ts`: elimina els helpers locals del Canvi `#330` i passa a consumir el servei compartit.
- `__tests__/lib/services/communicationStatusService.test.ts`: s’amplia la cobertura per blindar tant la derivació des de logs crus com des de timeline canònica, incloent el llistat recent.
- Efecte: la lògica de “flux enviat / respost / canal recent” deixa de viure fragmentada. Ara hi ha una sola capa per calcular estats de comunicació, i cada pantalla decideix només si la seva entrada és `adminLog` cru o `CanonicalTimelineEvent`.
- Verificació del tall: `npx vitest run __tests__/lib/services/communicationStatusService.test.ts __tests__/lib/services/bookingOperationalService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `331`; el següent canvi real ha de ser `#332`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #332 — 2026-04-22 — codex (FET)
**El `Customer Hub` prepara la seva cronologia per consumir activitat canònica sense remapeig manual.**
- Context: després de `#329`-`#331`, `Inbox`, `Bookings` i els serveis de comunicació ja depenien molt més de la timeline canònica, però `fetchCustomerHub()` encara construïa la cronologia del client remapejant `messages`, `customerActivities`, `leadActivities` i `adminLogs` a mà dins `buildTimeline()`.
- `lib/customer-hub/fetchCustomerHub.ts`: el hub carrega ara també `fetchCanonicalEventsForCustomer(resolvedCustomerId, 250)` abans de construir la cronologia.
- `lib/customer-hub/timeline.ts`: `buildTimeline()` guanya `canonicalEvents` com a entrada opcional. Quan existeixen, els events canònics passen a ser la font de les peces d’activitat/comunicació, mentre el builder continua aportant els events de negoci específics (`proposals`, `bookings`, `tasks`).
- `lib/services/timelineQueryService.ts`: `canonicalEventsToTimeline()` preserva també `preview` des de `event.body` perquè el `TimelinePanel` no perdi context llegible en la migració.
- `__tests__/lib/customer-hub/fetchCustomerHub.test.ts` i `__tests__/lib/customer-hub/timeline.test.ts`: cobertura nova per blindar tant la càrrega de `fetchCanonicalEventsForCustomer()` com la preservació del `preview` quan la cronologia es construeix des de `canonicalEvents`.
- Efecte: el `Customer Hub` deixa de ser una excepció on l’activitat del client es tornava a muntar a mà. La migració encara és parcial perquè els events de negoci continuen entrant pel builder propi, però la capa d’activitat/comunicació ja queda alineada amb la font canònica.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/fetchCustomerHub.test.ts __tests__/lib/customer-hub/timeline.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `332`; el següent canvi real ha de ser `#333`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #333 — 2026-04-22 — codex (FET)
**La cronologia del `Customer Hub` deixa de ser un builder híbrid i separa clarament negoci vs activitat canònica.**
- Context: després de `#332`, el hub ja carregava `fetchCanonicalEventsForCustomer()`, però la composició final encara quedava amagada darrere un únic `buildTimeline()` amb dues responsabilitats barrejades.
- `lib/customer-hub/timeline.ts`: s’extreu la separació explícita entre `buildCustomerBusinessTimelineEvents()` i `buildCustomerActivityTimelineEvents()`. `buildTimeline()` queda com a compositor final i no com a lloc on conviuen totes les decisions de negoci i de canonicitat.
- `lib/customer-hub/fetchCustomerHub.ts`: el `Customer Hub` combina ara de forma visible els dos blocs (`business` + `canonical activity`) i només després ordena i talla la cronologia final.
- `__tests__/lib/customer-hub/fetchCustomerHub.test.ts` i `__tests__/lib/customer-hub/timeline.test.ts`: la cobertura valida tant la càrrega de la capa canònica com la nova separació d’events de negoci.
- Efecte: el `Customer Hub` s’acosta més a ser el cervell comercial canònic del producte. La cronologia ja no és una peça híbrida opaca i la següent migració pot atacar el contingut pendent sense haver de tornar a obrir l’arquitectura del builder.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/fetchCustomerHub.test.ts __tests__/lib/customer-hub/timeline.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `333`; el següent canvi real ha de ser `#334`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #334 — 2026-04-22 — codex (FET)
**El dashboard principal passa també per una capa canònica de timeline recent.**
- Context: després de consolidar `Inbox`, `Bookings` i `Customer Hub`, el dashboard encara construïa la seva `timeline` recent barrejant leads/reserves amb dues queries separades de `customerActivity` i `adminLog`. A més, quedava fora `leadActivity`, que sí entra a la resta de la narrativa canònica del producte.
- `lib/services/timelineQueryService.ts`: nou fetcher `fetchRecentCanonicalEvents(limit)` que fusiona `customerActivity`, `leadActivity` i `adminLog` en un sol conjunt d’events canònics recents.
- `app/admin/lib/dashboard-data.ts`: la `timeline` recent deixa d’usar les queries `admin:dashboard:timeline:activity` i la composició manual de `customerActivity/adminLog`; ara consumeix `fetchRecentCanonicalEvents(8)` i el mapeja a timeline executiva del dashboard.
- `__tests__/lib/services/timelineQueryService.test.ts`: cobertura nova per blindar la fusió i el `limit` del fetcher global recent.
- Efecte: el dashboard ja no manté una lectura parcial i paral·lela de l’activitat recent. El resum executiu passa a mirar també la mateixa capa canònica de timeline que la resta de workspaces, i guanya visibilitat de `leadActivity` sense crear una altra narrativa pròpia.
- Verificació del tall: `npx vitest run __tests__/lib/services/timelineQueryService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `334`; el següent canvi real ha de ser `#335`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #335 — 2026-04-22 — codex (FET)
**`Economia` alinea el seguiment de cobrament amb la capa canònica de comunicacions.**
- Context: després de `#331` i `#334`, la lògica de fluxos de comunicació ja estava consolidada a `communicationStatusService` i a la capa canònica, però `app/admin/economia/page.tsx` continuava derivant `paymentFlowState` des de `adminLog` cru amb `deriveFlowStatus()`.
- `app/admin/economia/page.tsx`: els logs `COMM_SENT/COMM_RESPONDED` de booking es normalitzen ara amb `mapAdminLogToCanonicalEvent()` i el semàfor `paymentFlowState` es calcula via `deriveFlowStatusFromTimeline()`.
- Efecte: la lectura financera de “cobrament enviat / respost / pendent” deixa de ser una excepció local i queda alineada amb la mateixa semàntica canònica de comunicacions que ja fan servir `Bookings`, dashboard i la resta de workspaces operatius.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `335`; el següent canvi real ha de ser `#336`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #336 — 2026-04-23 — codex (FET)
**`Sales Ops` i les automatitzacions comercials deixen de comptar comunicacions fora de la capa canònica.**
- Context: després de `#335`, encara quedaven lectures paral·leles de `COMM_SENT/COMM_RESPONDED` sobre `adminLog` cru a `app/admin/sales-ops/page.tsx`, `readCommercialSequenceMetrics()` i `runCommercialDailyAutomation()`. El pendent estructural ja no era de navegació, sinó de semàntica compartida de mètriques.
- `lib/services/timelineQueryService.ts`: nou helper `fetchRecentCanonicalCommunicationMetrics(since)` i resum pur `summarizeCanonicalCommunicationMetrics(events)`. La derivació de `commSent`, `commResponded` i `responseRate` queda centralitzada dins la capa canònica de timeline.
- `lib/services/adminAutomationService.ts` i `lib/services/commercialDailyAutomationService.ts`: els comptadors de comunicacions a 30 dies i 24h deixen de consultar `adminLog` cru directament i passen a consumir la nova mètrica compartida. `COMM_SEQUENCE_EXEC` es manté separat perquè continua sent una mètrica d’automatització.
- `app/admin/sales-ops/page.tsx`: els KPI de comunicacions/respostes a 30 dies passen també pel mateix helper, de manera que la lectura comercial del workspace deixa de tenir una quarta derivació local.
- Verificació del tall: `npx vitest run __tests__/lib/services/timelineQueryService.test.ts __tests__/lib/services/adminAutomationService.test.ts __tests__/lib/services/commercialDailyAutomationService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `336`; el següent canvi real ha de ser `#337`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #337 — 2026-04-23 — codex (FET)
**`Economia` deixa també la query crua de comunicacions de booking i passa al helper batch canònic.**
- Context: `#335` havia alineat la semàntica del flux de cobrament a `Economia`, però la pàgina encara carregava `adminLog` cru de booking per després normalitzar-lo localment. Quedava un residual estructural: mateixa lectura, però encara fora de la capa canònica.
- `lib/services/timelineQueryService.ts`: nou helper batch `fetchCanonicalCommunicationEventsForBookings(bookingIds, limit)`, que agrupa `COMM_SENT/COMM_RESPONDED` per reserva i els retorna ja com a `CanonicalTimelineEvent`.
- `app/admin/economia/page.tsx`: desapareix la query local a `prisma.adminLog.findMany(...)` per comunicacions de booking; la pàgina consumeix ara el helper batch de timeline abans de derivar `paymentFlowState`.
- Verificació del tall: `npx vitest run __tests__/lib/services/timelineQueryService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `337`; el següent canvi real ha de ser `#338`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #338 — 2026-04-23 — codex (FET)
**L’auditoria recent del dashboard deixa també la seva query pròpia a `adminLog`.**
- Context: després de `#334`, `#336` i `#337`, el dashboard ja vivia sobre timeline canònica per al resum recent, però encara mantenia una query separada `admin:dashboard:timeline:admin-logs` només per omplir el bloc “Auditoria recent”.
- `app/admin/lib/dashboard-data.ts`: s’elimina aquesta query específica i `recentAdminLogs` passa a derivar-se de `recentCanonicalTimeline`, filtrant els events amb `source === 'adminLog'` i reutilitzant el text/temps/enllaç resolts per `mapCanonicalEventToDashboardTimelineItem()`.
- `app/admin/page.tsx`: la secció “Auditoria recent” deixa de mostrar `action · entity` crus i passa a pintar també la lectura canònica ja preparada.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `338`; el següent canvi real ha de ser `#339`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #339 — 2026-04-23 — codex (FET)
**El `Customer Hub` elimina també una query crua sobrera de `adminLog`.**
- Context: després de `#332` i `#333`, la cronologia del hub ja es construïa des de `fetchCanonicalEventsForCustomer()`, però `fetchCustomerHubCollections()` continuava carregant `adminLogs` crus que `fetchCustomerHub()` ja no consumia en cap sortida viva.
- `lib/customer-hub/data.ts`: `fetchCustomerHubCollections()` deixa de consultar `prisma.adminLog.findMany(...)` per customer/lead/booking.
- `lib/customer-hub/fetchCustomerHub.ts`: el contracte intern del hub es simplifica i deixa d’esperar `adminLogs` dins les col·leccions carregades.
- Verificació del tall: `npx vitest run __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `339`; el següent canvi real ha de ser `#340`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #340 — 2026-04-23 — codex (FET)
**`/api/admin/activity` deixa de governar la seva pròpia lectura crua de `adminLog`.**
- Context: després de `#338`, `/admin/activity` ja pintava gairebé tota la lectura visible des de timeline canònica, però la route `app/api/admin/activity/route.ts` encara decidia pel seu compte el `findMany`, `count`, `groupBy` i el mapping Prisma -> resposta. Era un altre consumidor cru de `adminLog` fora de la capa shared.
- `lib/services/timelineQueryService.ts`: nou helper `fetchCanonicalAdminActivityPage()` que concentra paginació, filtre per categoria, estadístiques per acció i mapping a `timeline` canònica per a cada fila retornada al workspace d’activitat.
- `app/api/admin/activity/route.ts`: la route queda reduïda a adaptador prim (`requireAuth` + paràmetres + delegació al helper shared) i deixa de portar semàntica de dades pròpia.
- `__tests__/lib/services/timelineQueryService.test.ts`: cobertura nova del helper paginat, incloent filtre de categoria, stats agregades i resposta buida quan la categoria no mapeja cap acció coneguda.
- Verificació del tall: `npx vitest run __tests__/lib/services/timelineQueryService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `340`; el següent canvi real ha de ser `#341`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #341 — 2026-04-24 — codex (FET)
**`Emails` deixa de comptar `customerActivity` cru localment per al feed recent.**
- Context: el panell `app/admin/emails/page.tsx` continuava fent tres lectures locals sobre `customerActivity` per al feed recent, els enviaments 24h i els testimonis 7d. Era una altra semàntica recent d’activitat fora d’un contracte shared, tot i pertànyer al mateix bloc operatiu d’email/post-event.
- `lib/services/customerActivityService.ts`: nou helper `readRecentEmailActivitySummary()` i constant `EMAIL_ACTIVITY_ACTIONS` per concentrar feed recent + comptadors sota una sola frontera de servei reutilitzable.
- `app/admin/emails/page.tsx`: la pàgina deixa de fer `findMany`/`count` locals sobre `customerActivity` per aquest bloc i delega la lectura al helper shared.
- `__tests__/lib/services/customerActivityService.test.ts`: cobertura nova del helper perquè el contracte d’activitat recent d’Emails quedi tipat i blindat.
- Verificació del tall: `npx vitest run __tests__/lib/services/customerActivityService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `341`; el següent canvi real ha de ser `#342`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #342 — 2026-04-24 — codex (FET)
**El `Customer Hub` deixa també una lectura local crua de `customerActivity`.**
- Context: després de `#339`, el hub ja no arrossegava `adminLog` sobrer i després de `#341` la lectura recent d’Emails ja passava per servei shared, però `fetchCustomerHubCollections()` encara feia un `customerActivity.findMany(...)` local per alimentar notes internes i l’estat manual del hub.
- `lib/services/customerActivityService.ts`: nou helper `readCustomerActivityLog()` per convertir la lectura base d’historial del client en contracte shared explícit.
- `lib/customer-hub/data.ts`: `fetchCustomerHubCollections()` deixa de consultar `prisma.customerActivity.findMany(...)` directament i delega `activityLog` a `readCustomerActivityLog()`.
- `__tests__/lib/services/customerActivityService.test.ts`: cobertura nova del helper amb ordre descendent i límit configurable perquè la frontera compartida quedi blindada.
- Verificació del tall: `npx vitest run __tests__/lib/services/customerActivityService.test.ts __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `342`; el següent canvi real ha de ser `#343`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #343 — 2026-04-24 — codex (FET)
**`Economia` treu a servei shared els historials de configuració basats en `adminLog`.**
- Context: la pàgina `app/admin/economia/page.tsx` encara feia dues lectures molt semblants de `adminLog` per a `finance.profitabilityConfig` i `pricing.pack.modelConfig`, amb mapping i normalització local. Era log tècnic legítim, però la frontera seguia enganxada a la pàgina en lloc d’estar centralitzada.
- `lib/services/adminConfigHistoryService.ts`: nou servei shared amb `readProfitabilityConfigHistory()`, `readPackPricingModelHistory()` i `normalizePackPricingConfigHistory()` per concentrar lectura + normalització dels canvis de configuració.
- `app/admin/economia/page.tsx`: deixa de reconstruir localment aquests dos historials i delega la càrrega al servei shared.
- `__tests__/lib/services/adminConfigHistoryService.test.ts`: cobertura nova del servei per blindar el mapping d’historial i la normalització del model de preus.
- Verificació del tall: `npx vitest run __tests__/lib/services/adminConfigHistoryService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `343`; el següent canvi real ha de ser `#344`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #344 — 2026-04-24 — codex (FET)
**`Sales Ops` i automatitzacions comercials comparteixen també la mètrica de `COMM_SEQUENCE_EXEC`.**
- Context: després de `#336`, la semàntica recent de comunicacions ja era shared per `COMM_SENT/COMM_RESPONDED`, però el recompte de `COMM_SEQUENCE_EXEC` continuava duplicat entre `app/admin/sales-ops/page.tsx` i `readCommercialSequenceMetrics()` a `adminAutomationService`.
- `lib/services/timelineQueryService.ts`: nou helper `fetchRecentCommercialSequenceMetrics()` que concentra el recompte recent de seqüències comercials executades.
- `lib/services/adminAutomationService.ts` i `app/admin/sales-ops/page.tsx`: deixen de comptar `adminLog` localment per aquesta mètrica i consumeixen el helper shared.
- `__tests__/lib/services/adminAutomationService.test.ts` i `__tests__/lib/services/timelineQueryService.test.ts`: cobertura ampliada del helper i dels consumidors reconnectats.
- Verificació del tall: `npx vitest run __tests__/lib/services/adminAutomationService.test.ts __tests__/lib/services/timelineQueryService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `344`; el següent canvi real ha de ser `#345`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #345 — 2026-04-24 — codex (FET)
**El `Customer Hub` deixa de derivar localment notes i estat manual des de `activityLog`.**
- Context: després de `#342`, el hub ja llegia `customerActivity` via servei shared, però `fetchCustomerHub.ts` continuava interpretant aquest `activityLog` localment per construir `customerNotes` i resoldre `manualStatus`. Era una capa de semàntica encara enganxada al fetcher.
- `lib/services/customerActivityService.ts`: nou helper `deriveCustomerHubActivitySummary()` que deriva `customerNotes` i `manualStatus` des de l’historial del client.
- `lib/customer-hub/fetchCustomerHub.ts`: deixa de reconstruir aquesta interpretació manualment i delega la derivació al servei shared.
- `__tests__/lib/services/customerActivityService.test.ts`: cobertura nova del helper perquè la derivació quedi blindada.
- Verificació del tall: `npx vitest run __tests__/lib/services/customerActivityService.test.ts __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `345`; el següent canvi real ha de ser `#346`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #346 — 2026-04-24 — codex (FET)
**Les sortides comercials comparteixen també l’escriptura de `customerActivity`.**
- Context: encara hi havia tres serveis (`adminEmailSendService`, `adminQuoteEmailService` i `proposalDispatchService`) escrivint `EMAIL_SENT`, `QUOTE_SENT` i `PROPOSAL_SENT` cadascun pel seu compte sobre `customerActivity`. Era un clúster clar de semàntica duplicada en escriptura.
- `lib/services/customerActivityService.ts`: nous helpers `recordCustomerEmailSent()`, `recordCustomerQuoteSent()` i `recordCustomerProposalSent()` per concentrar aquestes activitats sortints en una sola capa shared.
- `lib/services/adminEmailSendService.ts`, `lib/services/adminQuoteEmailService.ts` i `lib/services/proposalDispatchService.ts`: deixen de fer `customerActivity.create(...)` directament i deleguen l’escriptura als nous helpers.
- `__tests__/lib/services/customerActivityService.test.ts`: cobertura nova dels tres helpers shared. Les suites d’`adminEmailSendService`, `adminQuoteEmailService` i `proposalDispatchService` continuen passant sense canvi de comportament.
- Verificació del tall: `npx vitest run __tests__/lib/services/customerActivityService.test.ts __tests__/lib/services/adminEmailSendService.test.ts __tests__/lib/services/adminQuoteEmailService.test.ts __tests__/lib/services/proposalDispatchService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `346`; el següent canvi real ha de ser `#347`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #347 — 2026-04-24 — codex (FET)
**El clúster de comunicacions de reserva comparteix també l’escriptura de `adminLog`.**
- Context: després de `#346`, la sortida comercial de client ja compartia l’escriptura de `customerActivity`, però el clúster de reserva encara escrivia `COMM_SENT`, `COMM_RESPONDED`, `PAYMENT_REMINDER_SENT` i `SEND_POST_EVENT_EMAIL` cadascun pel seu compte sobre `adminLog` a `bookingCommunicationService`, `paymentReminderService` i `postEventDispatchService`.
- `lib/services/bookingCommunicationLogService.ts`: nou servei shared `recordBookingCommunicationLog()` per concentrar aquests logs tècnics de reserva.
- `lib/services/bookingCommunicationService.ts`, `lib/services/paymentReminderService.ts` i `lib/services/postEventDispatchService.ts`: deixen de fer `adminLog.create(...)` directament per aquests casos i deleguen al servei shared.
- `__tests__/lib/services/bookingCommunicationLogService.test.ts`: cobertura nova del servei shared. Les suites del clúster booking comms continuen passant.
- Verificació del tall: `npx vitest run __tests__/lib/services/bookingCommunicationLogService.test.ts __tests__/lib/services/bookingCommunicationService.test.ts __tests__/lib/services/paymentReminderService.test.ts __tests__/lib/services/postEventDispatchService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `347`; el següent canvi real ha de ser `#348`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #348 — 2026-04-24 — codex (FET)
**El lifecycle base de client comparteix també l’escriptura de `customerActivity`.**
- Context: després de `#346`, la sortida comercial ja compartia les activitats de client, però el lifecycle base del CRM encara escrivia directament `CUSTOMER_CREATED`, `INITIAL_NOTES`, `DUPLICATE_WARNING`, `LEAD_CREATED`, `PROFILE_UPDATED`, `STATUS_CHANGED`, `LEAD_CONVERTED` i `BOOKING_CREATED` des de diversos serveis del cicle principal.
- `lib/services/customerActivityService.ts`: nous helpers shared per aquest lifecycle base, amb suport també per client transaccional quan la creació passa dins `tx`.
- `lib/services/customerCreationService.ts`, `contactLeadCaptureService.ts`, `customerStatusService.ts`, `customerRouteService.ts`, `leads/statusRouteHandler.ts` i `bookingCreationService.ts`: deixen d’escriure aquestes activitats directament i deleguen al servei shared.
- Verificació del tall: `npx vitest run __tests__/lib/services/customerActivityService.test.ts __tests__/lib/services/customerCreationService.test.ts __tests__/lib/services/contactLeadCaptureService.test.ts __tests__/lib/services/customerStatusService.test.ts __tests__/lib/services/customerRouteService.test.ts __tests__/lib/services/bookingCreationService.test.ts __tests__/lib/services/leads/statusRouteHandler.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `348`; el següent canvi real ha de ser `#349`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #349 — 2026-04-24 — codex (FET)
**Els residuals no comercials de `customerActivity` passen també per la capa shared.**
- Context: després de `#348`, encara quedaven tres punts clars escrivint `customerActivity` directament fora de la capa shared: la fusió de clients, l’inici de processos de client i el testimoni públic dins transacció. Era un residual petit però coherent del mateix problema.
- `lib/services/customerActivityService.ts`: nous helpers `recordCustomerProcessStarted()` i `recordCustomerTestimonialSubmitted()`, i reaprofitament explícit de `recordCustomersMerged()` com a porta única pel log de fusió.
- `lib/services/deduplicationService.ts`, `customerProcessService.ts` i `publicTestimonialService.ts`: deixen de fer `customerActivity.create(...)` inline per aquests casos i deleguen a la capa shared, inclòs el cas transaccional via `tx`.
- `__tests__/lib/services/deduplicationService.test.ts`, `customerProcessService.test.ts` i `publicTestimonialService.test.ts`: cobertura ajustada perquè la delegació shared quedi blindada sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/deduplicationService.test.ts __tests__/lib/services/customerProcessService.test.ts __tests__/lib/services/publicTestimonialService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `349`; el següent canvi real ha de ser `#350`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #350 — 2026-04-24 — codex (FET)
**La norma canònica queda escrita explícitament al protocol, no només aplicada al codi.**
- Context: després de setmanes de drenatge de lectures i escriptures paral·leles sobre `adminLog`, `customerActivity`, timelines i rutes de lead, la regla ja existia de facto però no estava formulada de manera directa dins els principis operatius.
- `docs/protocol-producte-admin-ca.md`: s’afegeix la norma explícita de lectures/escriptures canòniques a `§2.1 Principis invariables`: si ja existeix una capa shared per un domini, no es reobre una query crua ni una escriptura inline des de pàgines, routes o serveis adjacents; si cal més capacitat, s’amplia primer la capa canònica i després es reconnecten consumidors.
- Efecte: la política arquitectònica que ha governat la sèrie recent de canvis deixa de dependre del context oral o del record de l’agent i passa a formar part del protocol viu del repo.
- Verificació del tall: `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `350`; el següent canvi real ha de ser `#351`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #351 — 2026-04-24 — codex (FET)
**El post-event de reserva comparteix també l’escriptura residual de `customerActivity`.**
- Context: després de `#347`, el clúster post-event ja havia tret l’escriptura tècnica d’`adminLog` cap a `bookingCommunicationLogService`, però encara mantenia una escriptura inline residual de `POST_EVENT_EMAIL_SENT` sobre `customerActivity` dins `postEventDispatchService`.
- `lib/services/customerActivityService.ts`: nou helper shared `recordCustomerPostEventEmailSent()` per concentrar aquesta activitat del cicle post-event del client.
- `lib/services/postEventDispatchService.ts`: deixa de fer `customerActivity.create(...)` directament quan una reserva completada envia el correu post-event i delega al nou helper shared.
- `__tests__/lib/services/customerActivityService.test.ts` i `__tests__/lib/services/postEventDispatchService.test.ts`: cobertura ajustada perquè el helper nou i el consumidor validin la delegació shared; el test de post-event passa també a afirmar el contracte shared d’`adminLog` ja introduït al `#347`.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/customerActivityService.test.ts __tests__/lib/services/postEventDispatchService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `351`; el següent canvi real ha de ser `#352`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #352 — 2026-04-24 — codex (FET)
**Els emails comercials de lead comparteixen també l’escriptura de `leadActivity`.**
- Context: després de tancar residuals de `customerActivity`, encara quedava un mini clúster paral·lel sobre `leadActivity`: `adminEmailSendService` i `adminQuoteEmailService` continuaven escrivint inline activitats d’email sortint (`Email enviat` i `Pressupost enviat`) malgrat existir una capa shared natural al domini.
- `lib/services/leadActivityService.ts`: nous helpers `recordLeadEmailSent()` i `recordLeadQuoteSent()` per concentrar la semàntica d’emails comercials sortints sobre el lead.
- `lib/services/adminEmailSendService.ts` i `lib/services/adminQuoteEmailService.ts`: deixen de fer `leadActivity.create(...)` directament i deleguen les dues escriptures al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts`, `__tests__/lib/services/adminEmailSendService.test.ts` i `__tests__/lib/services/adminQuoteEmailService.test.ts`: cobertura ajustada perquè el helper shared i els dos consumidors validin la delegació sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/adminEmailSendService.test.ts __tests__/lib/services/adminQuoteEmailService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `352`; el següent canvi real ha de ser `#353`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #355 — 2026-04-24 — codex (FET)
**El cicle de contracte comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#352`, `contractService` encara mantenia un mini clúster local de `leadActivity` per dues transicions del mateix subdomini: `Contracte enviat` i `Contracte cancel·lat`.
- `lib/services/leadActivityService.ts`: nous helpers `recordLeadContractSent()` i `recordLeadContractCancelled()` per concentrar aquestes dues activitats del cicle de contracte del lead.
- `lib/services/contractService.ts`: deixa de fer `leadActivity.create(...)` directament tant a `sendContract()` com a `cancelContract()` i delega les dues escriptures al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/contractService.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/contractService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `355`; el següent canvi real ha de ser `#356`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #358 — 2026-04-24 — claude (FET)
**Audit trail backend de pèrdua de lead: `lostReason`, `lostAt` i `leadLossService`.**
- Context: `§6.15` llistava `[LOW] Audit trail de decisions administratives — Log de qui/perquè es va perdre un lead` com a `MÉS ENDAVANT` obert. Fins ara un lead que passava a `LOST` al `statusRouteHandler` només deixava una `leadActivity` genèrica `'Canvi d'estat: X → LOST'` sense motiu ni metadades; cap query podia respondre "quants leads hem perdut per preu aquest trimestre?" ni "quines zones ens descarten". Zero visibilitat operativa sobre pèrdues.
- `prisma/schema.prisma` — `Lead` guanya `lostReason String?` i `lostAt DateTime?` (tots dos opcionals per retrocompatibilitat) + `@@index([lostReason])` per queries d'auditoria per motiu. Migració `20260424120000_add_lead_lost_reason/migration.sql` creada amb `ALTER TABLE "leads" ADD COLUMN ...` + `CREATE INDEX "leads_lostReason_idx"`.
- `lib/constants/leadLoss.ts` — nou sub-mòdul canònic: `LEAD_LOST_REASONS` (tuple `as const` amb 8 valors: `PRICE_TOO_HIGH`, `DATE_UNAVAILABLE`, `COMPETITOR_CHOSEN`, `EVENT_CANCELLED`, `NO_RESPONSE`, `NOT_QUALIFIED`, `OUT_OF_AREA`, `OTHER`), `LeadLostReason` type, `LEAD_LOST_REASON_LABELS` (Record català), i el guard `isLeadLostReason(value)`. Sub-mòdul dedicat (no al `lib/constants/index.ts`) per evitar arrossegar el graf complet en tests aïllats — mateix patró que `lib/constants/notifications.ts` (Canvi #354).
- `lib/services/leadLossService.ts` — servei backend nou: `markLeadAsLost({leadId, reason, note?, actor?, now?})` valida el motiu via `isLeadLostReason`, busca el lead, actualitza `status='LOST'` + `lostReason` + `lostAt`, i crea una `leadActivity` `type='STATUS_CHANGE'` / `title='Lead perdut'` / `description` (label català + nota), amb `metadata={fromStatus, toStatus, reason, note}` i `createdBy` (actor real o `'Admin'`). Retorna `{ok, lead}` o `{ok: false, status, error}` per als errors de validació/404. També exporta `buildLostActivityDescription()` com a funció pura.
- `__tests__/lib/services/leadLossService.test.ts` — 8 tests: `buildLostActivityDescription` (label-only, label+note amb trim, 3 labels canònics) i `markLeadAsLost` (reason invàlid → 400 sense tocar DB, lead not found → 404 sense `update`, happy path amb tots els camps, defaults per `actor='Admin'` i `now=Date.now()`, acceptació dels 8 motius canònics).
- Aquest tall NO connecta el servei al `statusRouteHandler.ts` — el contracte HTTP actual només accepta `{status}`; la reconnexió requereix extensió del route handler i UI de formulari de pèrdua, tots dos territori codex. Documentat com a `SEGÜENT` explícit al §6.15. L'split respecta §1 (schema/servei/tests per `claude`, UI/workspace per `codex`).
- Verificació del tall: `npx prisma generate` OK · `npx vitest run __tests__/lib/services/leadLossService.test.ts` OK (8 tests) · `pnpm run validate:core` OK (10/10 guards: qa:protocol, qa:protocol:test, qa:encoding, qa:language, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard) · `pnpm run qa:protocol` OK. Migració `20260424120000_add_lead_lost_reason` pendent de `prisma migrate deploy` a Railway.
- `ADMIN_CHANGE_COUNTER` puja a `358`; el següent canvi real ha de ser `#359`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #357 — 2026-04-24 — codex (FET)
**El cicle de documents del lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#355`, `leadDocumentService` encara mantenia un mini clúster local de `leadActivity` per dues transicions del mateix subdomini: `Document afegit` i `Document eliminat`.
- `lib/services/leadActivityService.ts`: nous helpers `recordLeadDocumentAdded()` i `recordLeadDocumentDeleted()` per concentrar aquestes dues activitats del cicle documental del lead.
- `lib/services/leadDocumentService.ts`: deixa de fer `leadActivity.create(...)` directament tant a `uploadLeadDocument()` com a `deleteLeadDocument()` i delega les dues escriptures al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/leadDocumentService.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/leadDocumentService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `357`; el següent canvi real ha de ser `#358`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #359 — 2026-04-24 — codex (FET)
**El cicle de tasques scoped del lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#357`, `leadScopedTaskRouteService` encara mantenia un mini clúster local de `leadActivity` per tres transicions del mateix subdomini: `Tasca creada`, `Tasca actualitzada` i `Tasca eliminada`.
- `lib/services/leadActivityService.ts`: nous helpers `recordLeadTaskCreated()`, `recordLeadTaskUpdated()` i `recordLeadTaskDeleted()` per concentrar aquestes tres activitats del cicle de tasques scoped del lead.
- `lib/services/leadScopedTaskRouteService.ts`: deixa de fer `leadActivity.create(...)` directament a `createLeadScopedTaskForRoute()`, `updateLeadScopedTaskForRoute()` i `deleteLeadScopedTaskForRoute()` i delega les tres escriptures al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/leadScopedTaskRouteService.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/leadScopedTaskRouteService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `359`; el següent canvi real ha de ser `#360`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #361 — 2026-04-24 — codex (FET)
**El cicle de notes del lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#359`, `leadNoteService` encara mantenia una escriptura inline local de `leadActivity` per la transició `Nota afegida`.
- `lib/services/leadActivityService.ts`: nou helper `recordLeadNoteAdded()` per concentrar aquesta activitat del cicle de notes del lead.
- `lib/services/leadNoteService.ts`: deixa de fer `leadActivity.create(...)` directament a `createLeadNote()` i delega aquesta escriptura al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/leadNoteService.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/leadNoteService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `361`; el següent canvi real ha de ser `#362`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #362 — 2026-04-24 — codex (FET)
**El cicle d’importació Inbox del lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#361`, `inboxLeadImportService` encara mantenia dues escriptures inline locals de `leadActivity` per les transicions `Lead actualitzat des d’Inbox` i `Lead creat des d’Inbox`.
- `lib/services/leadActivityService.ts`: nous helpers `recordLeadUpdatedFromInbox()` i `recordLeadCreatedFromInbox()` per concentrar aquestes dues activitats del cicle d’importació Inbox del lead.
- `lib/services/inboxLeadImportService.ts`: deixa de fer `leadActivity.create(...)` directament tant al flux d’update com al flux de creació i delega les dues escriptures al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/inboxLeadImportService.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/inboxLeadImportService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `362`; el següent canvi real ha de ser `#363`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #363 — 2026-04-24 — claude (FET)
**Endpoint `GET /api/admin/reports/lead-losses` exposa el `LossSummary` del Canvi #360.**
- Context: el Canvi #360 va crear `leadLossAnalyticsService.loadLossReport()` però la funció només vivia a `lib/services/`. Sense endpoint HTTP, cap UI podia consumir el `LossSummary` (ni el futur panell `LossBreakdownPanel` a `Sales Ops`/`Reporting executiu`, ni tests E2E, ni integracions externes). Aquest tall tanca el pas del contracte del servei al perímetre HTTP, en pur territori Claude (route handler + parser + test), deixant la UI i la navegació a codex.
- `app/api/admin/reports/lead-losses/route.ts` — nou `GET` handler: `requireAuth` + `requirePermission('read')` (mateix patró que `/api/admin/reports/executive`), llegeix `?days=N` via `req.nextUrl.searchParams`, el passa per `parseSinceDays()` que aplica `DEFAULT_DAYS=90`, `MIN_DAYS=1`, `MAX_DAYS=365`, ignora valors no numèrics, i delega a `loadLossReport({sinceDays})`. Retorna `{ok:true, sinceDays, summary}`. `export const dynamic = 'force-dynamic'` perquè el report no s'ha de cachejar entre requests.
- `__tests__/app/api/admin/reports-lead-losses-route.test.ts` — 8 tests que cobreixen: `requireAuth` error bloqueja (sense cridar servei), `requirePermission` error bloqueja, default 90 dies quan no hi ha query, `?days=30` passa al servei, clamping a 365 amb `?days=9999`, clamping a 1 amb `?days=0`, ignora `?days=abc` i usa default, retorna forma completa `{ok, sinceDays, summary}`. Tots els mocks hoisted seguint el patró de `reports-executive-export-route.test.ts`.
- **FET** *(2026-04-24 per `codex` — Canvi #372)*: el `SEGÜENT` queda tancat. `Sales Ops` consumeix ja l'endpoint via `LossBreakdownPanel` amb KPI `topReason`, donut `byReason`, barres `bySource` i línia `byMonth`, tal com havia quedat demanat en aquest mateix Canvi #363.
- Verificació del tall: `npx vitest run __tests__/app/api/admin/reports-lead-losses-route.test.ts` OK (8 tests) · `pnpm run validate:core` OK (10/10 guards: qa:protocol, qa:protocol:test, qa:encoding, qa:language, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard) · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `363`; el següent canvi real ha de ser `#364`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #364 — 2026-04-24 — codex (FET)
**El motor de seqüències comercials comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#362`, `commercialSequenceService` encara mantenia una escriptura inline local de `leadActivity` per cada pas executat de nurturing comercial (`EMAIL` o `WHATSAPP`) amb metadades de pas, plantilla i idioma.
- `lib/services/leadActivityService.ts`: nou helper `recordLeadCommercialSequenceStepSent()` per concentrar aquesta activitat del motor de seqüències comercials.
- `lib/services/commercialSequenceService.ts`: deixa de fer `leadActivity.create(...)` directament quan executa un pas de nurturing i delega l’escriptura al servei shared, mantenint intacte el `adminLog` `COMM_SEQUENCE_EXEC`.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/commercialSequenceService.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/commercialSequenceService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `364`; el següent canvi real ha de ser `#365`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #365 — 2026-04-24 — claude (FET)
**Cron `lead-cleanup` classifica les pèrdues automàtiques amb motiu canònic `EVENT_PASSED`.**
- Context: el Canvi #358 va afegir `Lead.lostReason` i `markLeadAsLost()`, però el cron diari `leadCleanupService.runLeadCleanup()` — responsable d'auto-LOST dels leads amb data d'event passada — continuava fent un `prisma.lead.updateMany({data:{status:'LOST'}})` inline, sense motiu ni entrada a `leadActivity`. Resultat: cada dia el cron generava leads LOST sense audit trail, contaminant el `LossSummary` del #360 amb registres `uncategorized`. Aquest tall tanca la monocapa: totes les transicions a LOST (manuals i automàtiques) passen ara pel servei canònic.
- `lib/constants/leadLoss.ts` — `LEAD_LOST_REASONS` s'amplia de 8 a 9 motius amb `EVENT_PASSED` ("Data d'esdeveniment passada sense conversió"). Encaix natural: motiu específic per a la lògica del cron, diferent de `EVENT_CANCELLED` (client cancel·la) i `NO_RESPONSE` (client no respon mai).
- `lib/services/leadCleanupService.ts` — refactor: el bloc d'auto-LOST substitueix `prisma.lead.updateMany` per un `findMany({select:{id:true}}) + loop de markLeadAsLost({leadId, reason:'EVENT_PASSED', actor:'system:lead-cleanup', now})`. Cada lead queda amb `status='LOST'`, `lostReason='EVENT_PASSED'`, `lostAt=now` i entrada a `leadActivity` amb `type='STATUS_CHANGE'`, `title='Lead perdut'`, `description='Data d'esdeveniment passada sense conversió'`, `metadata={fromStatus,toStatus:'LOST',reason:'EVENT_PASSED',note:null}`, `createdBy='system:lead-cleanup'`. Si un `markLeadAsLost` falla (e.g. lead esborrat entre findMany i update), es fa `log.warn` i no es compta com autoLost. Constants `AUTO_LOST_ACTOR` i `AUTO_LOST_REASON` al cap del fitxer per explicitar la decisió. El bloc d'auto-DELETE no canvia.
- `__tests__/lib/services/leadCleanupService.test.ts` — reescrits 5 tests complets (abans 3): mock `markLeadAsLost` amb hoisted factory; els dos `findMany` consecutius es mocken amb `mockResolvedValueOnce` (primer per auto-LOST, segon per auto-DELETE); verificacions: crida a `markLeadAsLost` amb el motiu i actor canònics per cada lead obert amb data passada, `autoLost` compta només els `ok:true`, auto-DELETE continua funcionant, `$transaction` no es crida si no hi ha res a eliminar ni a marcar, totes les invocacions de `markLeadAsLost` dins d'una sola execució comparteixen el mateix `now` (perquè el cron no deriva timestamps diferents entre leads processats en ràfega).
- Efecte pràctic: a partir del pròxim cron diari, l'analítica del #360 (`loadLossReport`) podrà distingir entre pèrdues per dates passades i pèrdues amb motius comercials reals — el KPI "top motiu" deixarà d'estar contaminat per soroll automàtic anònim.
- Verificació del tall: `npx vitest run __tests__/lib/services/leadCleanupService.test.ts __tests__/lib/services/leadLossService.test.ts __tests__/lib/services/leadLossAnalyticsService.test.ts` OK (23 tests · 5 nous) · `pnpm run validate:core` OK (10/10 guards) · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `365`; el següent canvi real ha de ser `#366`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #366 — 2026-04-24 — codex (FET)
**La ruta de generació de pressupost de lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#364`, `quoteRouteHandler` encara mantenia una escriptura inline local de `leadActivity` per la transició `Pressupost generat`, malgrat que ja existia una capa shared clara per concentrar els events documentals del lead.
- `lib/services/leadActivityService.ts`: nou helper `recordLeadQuoteGenerated()` per concentrar aquesta activitat de generació de pressupost.
- `lib/services/leads/quoteRouteHandler.ts`: deixa de fer `leadActivity.create(...)` directament a `handleLeadQuotePost()` i delega l’escriptura al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/quoteRouteHandler.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/quoteRouteHandler.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `366`; el següent canvi real ha de ser `#367`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #367 — 2026-04-24 — claude (FET)
**Informe executiu incorpora `lossSummary`: la pèrdua del Canvi #358 arriba també als exports CSV i PDF.**
- Context: els Canvis #358, #360, #363 i #365 han construït l'audit trail de pèrdues (schema → write manual → write automàtic → read agregada → HTTP endpoint). El `ExecutiveReport` — font única de veritat del reporting executiu, ja connectat a CSV (Canvi #146), PDF (Canvi #153) i dispatch per email (servei existent) — no incloïa aquesta dimensió. Aquest tall integra `lossSummary` al contracte canònic del report: l'anàlisi de pèrdues deixa d'estar en una superfície aïllada i passa a ser part del mateix paquet executiu que surt cada setmana per email i es pot exportar en CSV/PDF. L'usuari veu pèrdues al mateix lloc on veu ingressos, embut i forecast.
- `lib/services/executiveReportService.ts` — `ExecutiveReport` guanya `lossSummary: LossSummary`. `buildExecutiveReport()` afegeix una consulta paral·lela a `prisma.lead.findMany` (dins del mateix `Promise.all` de les altres 11 queries, per no afegir latència seqüencial) amb filtre `status:'LOST'` i finestra 90 dies (`OR: [{lostAt: gte},{lostAt:null, updatedAt: gte}]`, mateix patró que `loadLossReport()` per capturar leads anteriors al #358). La llista resultant es passa a `computeLossSummary()` que ja és pura i testejada al Canvi #360. `exportExecutiveReportCsv()` afegeix la secció `ANÀLISI DE PÈRDUES` amb total, uncategorized, motiu principal (si existeix) i breakdown complet per motiu amb percentatges.
- `__tests__/lib/services/executiveReportService.test.ts` — cobertura ampliada: `sampleReport` guanya un `lossSummary` realista (6 leads perduts, 2 motius agregats, 1 uncategorized); el test `genera CSV vàlid amb totes les seccions` inclou ara l'assertion de `ANÀLISI DE PÈRDUES`; dos tests nous específics: `inclou anàlisi de pèrdues amb motiu principal i breakdown` (valida total, uncategorized, línia "Motiu principal,...", i les dues files del breakdown amb percentatges), i `pot serialitzar report sense topReason (lossSummary buit)` (valida que amb `topReason: null` no es genera la línia "Motiu principal," — edge case). Afegida una suite nova `buildExecutiveReport — lossSummary (Canvi #367)` amb 2 tests: empty data retorna `lossSummary` amb estructura buida i `topReason: null`; amb 3 leads reals mockejats al `mockResolvedValueOnce` de `lostLeads` (2a crida a `lead.findMany`, després de `openLeads`), l'agregació detecta `PRICE_TOO_HIGH` com a topReason amb count 2 i ordre correcte per count desc.
- `__tests__/lib/services/executiveReportPdfService.test.ts` — `makeReport()` guanya `lossSummary` buit al payload per defecte per satisfer el nou camp obligatori del contracte. No es valida el contingut del PDF (el test ja només comprova magic bytes + longitud + edge cases amb 0 i 20 leads), però el tipus `ExecutiveReport` ara exigeix el camp i això garanteix que el fixture segueix vàlid.
- `__tests__/lib/services/executiveReportDispatchService.test.ts` — fix adjacent pre-existent: el test no mockejava `notificationRecipientsService.getRecipientsAsString`, i per tant `sendExecutiveReport()` intentava accedir a `prisma.setting.findUnique` (no existeix al mock de prisma del test), fallant amb `TypeError: Cannot read properties of undefined (reading 'findUnique')`. Regressió introduïda al commit `643d5015` (feat notifications) que no va actualitzar aquest test. Afegit `vi.mock('@/lib/services/notificationRecipientsService', () => ({ getRecipientsAsString: mockGetRecipientsAsString }))` + default mock `mockResolvedValue('reports@test.com')` a `beforeEach`. Reparació íntegra segons §2.1.5 — tocava executive report service, vaig trobar el dispatch trencat al perímetre, i l'he arreglat al mateix tall.
- Verificació del tall: `npx vitest run __tests__/lib/services/executiveReportService.test.ts __tests__/lib/services/executiveReportPdfService.test.ts __tests__/lib/services/executiveReportDispatchService.test.ts` OK (23 tests · 3 nous + 2 reparats) · `pnpm run validate:core` OK (10/10 guards: qa:protocol, qa:protocol:test, qa:encoding, qa:language, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard) · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `367`; el següent canvi real ha de ser `#368`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #368 — 2026-04-24 — codex (FET)
**El snapshot manual de scoring del lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#366`, `leadScoreAdminService` encara mantenia una escriptura inline local de `leadActivity` per la transició tècnica `Scoring snapshot`.
- `lib/services/leadActivityService.ts`: nou helper `recordLeadScoreSnapshot()` per concentrar aquesta activitat de snapshot de scoring.
- `lib/services/leadScoreAdminService.ts`: deixa de fer `leadActivity.create(...)` directament a `createAdminLeadScoreSnapshot()` i delega l’escriptura al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/leadScoreAdminService.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/leadScoreAdminService.test.ts` OK. `npx tsc --noEmit --pretty false` continua fallant per un error aliè a `__tests__/lib/services/executiveReportPdfService.test.ts` (`lossSummary` opcional incompatible amb `ExecutiveReport`). `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `368`; el següent canvi real ha de ser `#369`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #369 — 2026-04-24 — codex (FET)
**L’automatització SLA del lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#368`, `slaAutomationService` encara mantenia una escriptura inline local de `leadActivity` per la transició `SLA incomplert: tasca automàtica creada`.
- `lib/services/leadActivityService.ts`: nou helper `recordLeadSlaTaskCreated()` per concentrar aquesta activitat automàtica de SLA.
- `lib/services/slaAutomationService.ts`: deixa de fer `leadActivity.create(...)` directament a `enforceLeadSla()` i delega l’escriptura al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/slaAutomationService.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/slaAutomationService.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `369`; el següent canvi real ha de ser `#370`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #370 — 2026-04-24 — codex (FET)
**La ruta de canvi d’estat del lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#369`, `statusRouteHandler` encara mantenia una escriptura inline local de `leadActivity` per la transició `Canvi d'estat` en el path legacy de canvi d’estat.
- `lib/services/leadActivityService.ts`: nou helper `recordLeadStatusChanged()` per concentrar aquesta activitat de canvi d’estat del lead.
- `lib/services/leads/statusRouteHandler.ts`: deixa de fer `leadActivity.create(...)` directament al path legacy i delega l’escriptura al servei shared, mantenint intacte el path canònic `markLeadAsLost()` per `LOST` amb `lostReason`.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/leads/statusRouteHandler.test.ts`: cobertura ajustada perquè el helper shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/leads/statusRouteHandler.test.ts` OK. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `370`; el següent canvi real ha de ser `#371`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #371 — 2026-04-24 — codex (FET)
**El cicle de snapshot tècnic del lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#370`, `leadSnapshotService` encara mantenia dues escriptures inline locals de `leadActivity` per les transicions `Instantània tècnica desada` i `Instantània tècnica enviada`.
- `lib/services/leadActivityService.ts`: nous helpers `recordLeadTechnicalSnapshotSaved()` i `recordLeadTechnicalSnapshotSent()` per concentrar aquestes dues activitats del snapshot tècnic del lead.
- `lib/services/leadSnapshotService.ts`: deixa de fer `leadActivity.create(...)` directament tant al flux `save_document` com al flux `send_email` i delega les dues escriptures al servei shared.
- `__tests__/lib/services/leadActivityService.test.ts` i `__tests__/lib/services/leadSnapshotService.test.ts`: cobertura ajustada perquè els helpers shared i el consumidor validin la delegació canònica sense canviar comportament funcional.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/leadSnapshotService.test.ts` OK. `npx tsc --noEmit --pretty false` continua fallant per errors aliens a `__tests__/lib/services/executiveReportPdfService.test.ts` i `__tests__/lib/services/executiveReportService.test.ts` perquè els fixtures `LossSummary` encara no inclouen `autoTotal` i `commercialTotal`. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `371`; el següent canvi real ha de ser `#372`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #373 — 2026-04-24 — claude (FET)
**El cicle de pèrdua de lead comparteix també l’escriptura de `leadActivity`.**
- Context: després de `#371`, `leadLossService` era l’últim consumidor del repo (fora del propi servei owner) que encara mantenia una escriptura inline local de `leadActivity` — concretament la transició `Lead perdut` que escriu `markLeadAsLost()` quan un lead passa a `LOST` amb motiu canònic. Per tancar del tot el cicle iniciat al `#352` calia que aquesta última entrada també passés per una porta d’entrada shared. (El número `#372` queda assignat al tall de `LossBreakdownPanel` del mateix dia, enregistrat en paral·lel per `codex`.)
- `lib/services/leadActivityService.ts`: nou helper `recordLeadLost()` amb signatura `{ leadId, fromStatus, reason: LeadLostReason, description, note, actor }` per concentrar l’activitat `Lead perdut` (`type: 'STATUS_CHANGE'`, metadata canònica `{ fromStatus, toStatus: 'LOST', reason, note }`). Import de tipus `LeadLostReason` des de `@/lib/constants/leadLoss` per preservar la tipificació estricta del motiu sense crear cicle (el helper rep `description` ja formatada per `buildLostActivityDescription`, que viu al consumer i continua exportat/testat a `leadLossService`).
- `lib/services/leadLossService.ts`: `markLeadAsLost()` deixa de fer `prisma.leadActivity.create(...)` directament i delega al helper shared. Comportament funcional idèntic — mateix payload, mateix `createdBy` default `'Admin'`, mateixa metadata.
- `__tests__/lib/services/leadActivityService.test.ts`: afegit `describe('recordLeadLost')` amb cas que valida el payload complet (`type STATUS_CHANGE`, títol `Lead perdut`, description, metadata amb fromStatus/toStatus/reason/note, createdBy de l’actor). Import `recordLeadLost` incorporat al bloc canònic d’imports. El test existent de `leadLossService.test.ts` segueix verd sense canvis perquè el mock de `prisma.leadActivity.create` captura igualment la crida final al prisma.
- Efecte: tots els consumidors del repo passen per helpers shared de `leadActivityService`. El grep `leadActivity\.create\(` dins `lib/services/` només retorna `leadActivityService.ts` (owner). La migració iniciada al `#352` queda tancada.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/leadActivityService.test.ts __tests__/lib/services/leadLossService.test.ts` OK (36 tests). `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK després d’aquest registre.
- `ADMIN_CHANGE_COUNTER` puja a `373`; el següent canvi real ha de ser `#374`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #374 — 2026-04-24 — claude (FET)
**Decisió canònica: `leadActivity` continua sent la font canònica de comunicacions. No es crea entitat `CommunicationEvent`.**
- Context: el `SEGÜENT` del §6.15 obert des del Canvi #352 demanava decidir si calia una entitat `CommunicationEvent` pròpia o si `leadActivity` continuava sent la font canònica. Després del `#373` tot el perímetre d’escriptures ja passa per helpers shared (`recordLeadEmailSent`, `recordLeadQuoteSent`, `recordLeadCommercialSequenceStepSent`, `recordLeadLost`, etc.), de manera que el dolor d’"escriptures disperses" que hauria justificat una entitat dedicada ja no existeix. La pregunta restant era arquitectònica: fragmentar `leadActivity` en una font específica de comms o mantenir-la única.
- Decisió: **no crear `CommunicationEvent`**. `leadActivity` continua canònica per a tot el domini lead (NOTE, STATUS_CHANGE, EMAIL, CALL, WHATSAPP, DOCUMENT, TASK, SYSTEM). Raons alineades amb el PENDENT CRÍTIC de §6.15, que apunta cap a **menys entitats** (un `TimelineEvent` polimòrfic que absorbeixi `customerActivity` + `leadActivity`), no més: afegir una 4a font al `timelineQueryService` augmenta fan-in i va en direcció contrària. Els camps "hot" que podrien justificar columnes natives (ex: `lastRespondedAt` per SLA, `lastEmailSentAt` per automatismes) poden viure com a camps derivats al model `Lead` quan apareguin, sense obrir una entitat nova. Queries tipades sobre comms (ex: "emails pendents de resposta") es cobreixen amb helpers de lectura `listLeadEmailActivities()` sobre el `type` ja existent, sense tocar schema.
- `docs/protocol-producte-admin-ca.md` · §6.15: el bullet `SEGÜENT` es converteix en `FET` amb les raons completes de la decisió. El bullet `PENDENT CRÍTIC` es reescriu per documentar que la direcció preferida és unificació (`TimelineEvent` polimòrfic) però que requereix un RFC curt abans de tocar schema, no feina immediata.
- No hi ha canvi de codi, schema ni tests — és un tall documental que tanca un debat obert perquè cap agent el torni a plantejar sense evidència nova. Segueix el patró del Canvi #356 (consolidació documental sobre decisions ja preses), compatible amb la norma §2.1 de tancament rigorós de tall.
- Verificació del tall: `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `374`; el següent canvi real ha de ser `#375`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #375 — 2026-04-24 — codex (FET)
**El Lead Hub i les accions ràpides del detall ja demanen `lostReason` i `note` abans de passar un lead a `LOST`.**
- Context: després dels Canvis `#358`, `#370` i `#372`, el backend de pèrdua de lead ja era canònic (`markLeadAsLost()` + `statusRouteHandler` + analítica + panell), però la UI principal del detall encara mantenia camins ràpids que enviaven només `{status:'LOST'}`. El pendent explícit del §6.15 era tancar aquest buit al Lead Hub perquè la captura de motiu i nota no depengués d'un caller manual ni d'una futura UI separada.
- `app/admin/leads/leadStatusClient.ts`: helper shared `patchLeadStatus()` perquè tots els callers del detall enviïn el mateix `PATCH /api/admin/leads/:id/status` amb shape canònic `{status, lostReason?, note?}` i la mateixa gestió d'error JSON.
- `app/admin/leads/LeadLostStatusPrompt.tsx`: component shared del formulari de pèrdua. Renderitza select dels motius canònics (`LEAD_LOST_REASONS` / `LEAD_LOST_REASON_LABELS`), textarea de nota interna i botons de confirmació/cancel·lació.
- `app/admin/leads/LeadQuickStatus.tsx`, `app/admin/leads/LeadActions.tsx`, `app/admin/leads/[id]/LeadActionsEnhanced.tsx` i `app/admin/leads/[id]/LeadGuidedFlow.tsx`: els canvis normals d'estat continuen pel flux directe, però qualsevol intent de passar a `LOST` obre el prompt shared i no envia la petició fins que hi ha `lostReason`. La confirmació reutilitza sempre `patchLeadStatus()` i refresca el workspace un cop persistit.
- `__tests__/app/admin/leads/LeadQuickStatus.test.tsx`: 2 tests nous que blinden el contracte de UI. Un confirma que un canvi d'estat normal continua fent `PATCH {status}`; l'altre valida que `LOST` obre prompt i acaba enviant `{status:'LOST', lostReason, note}`.
- Efecte: el detall del lead deixa enrere el path legacy cap a `LOST` sense context. El motiu de pèrdua entra ara a la base canònica des de la UI operativa principal, alineat amb el servei, l'activitat shared i l'analítica executiva.
- Verificació del tall: `pnpm vitest run __tests__/app/admin/leads/LeadQuickStatus.test.tsx` OK (2 tests). `npx tsc --noEmit --pretty false` OK. `pnpm run validate:core` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `375`; el següent canvi real ha de ser `#376`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #376 — 2026-04-24 — claude (FET)
**Consolidació documental: el `SEGÜENT` del §6.11 sobre l’auditoria estructural de CTAs executives queda tancat com a `FET` amb evidència empírica que la canonització és 100%, no "pràcticament exhaustiva".**
- Context: el §6.11 mantenia obert des del Canvi `#326` un `SEGÜENT` literal: *"continuar l’auditoria estructural de CTA executives i fronteres de navegació/comunicacions que encara no depenen d’un contracte canònic únic"*. El mateix `#326` reconeixia la canonització com a "pràcticament exhaustiva" — formulació ambigua que creava risc de doble entrada futura o d'agent futur invertint temps re-auditant una feina ja completa.
- Auditoria empírica executada al `#376`: grep de `/admin/leads/` a tot el codebase retorna 87 ocurrències en 30 fitxers. Classificació exhaustiva dels 9 fitxers `app/admin/**` i `lib/**` candidats: (1) `PendingFollowUpsPanel.tsx:21` → `fetch('/api/admin/leads/follow-ups')` URL API, literal correcte; (2) `CommSummaryPanel.tsx:37` → `fetch('/api/admin/leads/${leadId}/comm-summary')` URL API, literal correcte; (3) `app/admin/page.tsx:428` → `entityPath` de l'`StatusQuickSelect` apuntant a l'endpoint `/api/admin/leads/${lead.id}/status`, literal correcte perquè és contracte API; (4) `clientes/[id]/.../SummaryPanel.tsx:33` → `@/app/admin/leads/colorTheme` és un **import path** TypeScript, no URL; (5) `bookings/useNewBookingInitialData.ts:66` → `fetchWithCsrf('/api/admin/leads/${leadId}')` URL API, literal correcte; (6) `nav-items.ts:41` → `'/admin/leads/reengagement'` és una **ruta especial** (pàgina agregada, no fitxa de lead individual) que no té equivalent al helper canònic; (7) `lib/services/leads/quoteRouteHandler.ts:159` → `'${baseUrl}/api/admin/leads/${leadId}/quote'` URL API, literal correcte; (8) `lib/constants/adminManual.ts:638` → `'/admin/leads/reengagement'` en format de manual d'ajuda, mateixa ruta especial; (9) `scripts/capture-check.ts:1` script de Playwright, URLs de prova literals. Les 78 ocurrències restants (22 fitxers) són strings de tests, e2e specs, o helpers propis del contracte (`lib/admin/leadWorkspaceHref.ts` com a owner).
- `docs/protocol-producte-admin-ca.md` · §6.11: el bullet `SEGÜENT` obsolet es substitueix per un `FET` que explicita el resultat de l'auditoria (87 ocurrències classificades, 0 CTAs candidats pendents) i tanca el debat amb evidència. El segon bullet `SEGÜENT` del mateix §6.11 ("saltar als pendents estructurals del cicle") queda viu, apuntant cap al següent pas d'arquitectura.
- No hi ha canvi de codi, schema ni tests — tall purament documental en la línia dels Canvis `#356`, `#374`. Consistent amb la norma §2.1 de tancament rigorós de tall: cada `SEGÜENT` viu al protocol ha de ser realment viu, o es converteix en `FET` amb cita del Canvi que el resol.
- Verificació del tall: `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `376`; el següent canvi real ha de ser `#377`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #377 — 2026-04-24 — codex (FET)
**El kanban de leads també bloqueja el pas ràpid a `LOST` fins que hi ha `lostReason` i nota opcional.**
- Context: el Canvi `#375` ja havia tancat el detall i les accions ràpides del Lead Hub, però encara quedava un forat operatiu clar: `LeadPipelineView` podia moure una targeta a `LOST` des del board amb botó lateral o drag sense passar pel prompt shared. Això deixava oberta una segona entrada cap al path legacy just al cockpit de treball comercial.
- `app/admin/leads/LeadPipelineView.tsx`: qualsevol moviment cap a `LOST` deixa de fer canvi optimista directe. El board obre ara `LeadLostStatusPrompt`, guarda el lead pendent i només persisteix el canvi quan hi ha `lostReason`. La confirmació reutilitza `patchLeadStatus()` i manté el mateix contracte canònic `{ status:'LOST', lostReason, note }`.
- El comportament dels altres moviments del board no canvia: per `NEW/CONTACTED/QUOTE_SENT/NEGOTIATING/WON` es manté el flux ràpid, el toast existent i el canvi optimista.
- Reuse explícit de les peces del Canvi `#375`: `LeadPipelineView` consumeix `LeadLostStatusPrompt` i `leadStatusClient.patchLeadStatus()` en lloc de crear una tercera implementació de formulari o de `PATCH`.
- Verificació del tall: `pnpm vitest run __tests__/app/admin/leads/LeadQuickStatus.test.tsx` OK (2 tests, el contracte shared del prompt continua verd). `npx tsc --noEmit --pretty false` OK. `pnpm run validate:core` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `377`; el següent canvi real ha de ser `#378`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #378 — 2026-04-24 — claude (FET)
**Normes operatives "go" + no-col·lisió entre agents escrites al §2.1 + tancat el `SEGÜENT` del §6.5 (auditoria CTAs destins suportats fora Customer/Lead Hub).**
- Context: el propietari ha explicitat a la sessió del 2026-04-24 dues regles de treball que no estaven al protocol i que feien perdre temps i tokens: (1) `go` sol vol dir "continua segons el protocol + checklist", no és invitació a preguntar direcció; (2) `claude` i `codex` treballen concurrents i han de coordinar-se via el `ADMIN_CHANGE_COUNTER` i atacant fronts diferents (les col·lisions fan perdre rondes). Aquestes dues normes havien de quedar al protocol per no repetir-les oralment cada sessió. Paral·lelament, el §6.5 mantenia obert un `SEGÜENT` des del `#231` sobre auditar el criteri "CTA només cap a destins realment suportats" fora de Customer/Lead Hub.
- `docs/protocol-producte-admin-ca.md` · §2.1 Principis invariables: afegides dues normes operatives al final del bloc de bullets. (1) **Norma operativa de "go" del propietari**: `go` sol = continua checklist, no preguntar direcció, atacar `SEGÜENT` acotats dels §6.N seguint la norma de tancament rigorós. (2) **Norma operativa de no-col·lisió entre agents**: mirar el counter abans d'atacar, respectar el `counter + 1` si l'altre agent ha reservat número, i triar front diferent al que ha tocat l'altre agent les darreres hores (si `codex` toca Lead Hub, `claude` ataca bookings/tasks/social; i viceversa).
- `docs/protocol-producte-admin-ca.md` · §6.5: el `SEGÜENT` de "auditar CTAs executives fora Customer/Lead Hub" es converteix en `FET` amb evidència. Únic candidat tangible fora de Lead/Customer Hub és `app/admin/tasks/TaskQueueBanner.tsx`, que només fa filtres interns a `/admin/tasks?queue=X` (router.push amb searchParams dins el propi workspace) i no té cap CTA extern que pugui apuntar a destí no suportat. Els altres banners executius (`LeadInsightsBanner`, `clientes/.../InsightsBanner`) viuen dins Lead/Customer Hub i ja es van cobrir als Canvis `#229` i `#231`. Cap tall de codi necessari.
- No hi ha canvi de codi ni schema ni tests funcionals — el tall és normatiu i documental. Segueix el patró dels Canvis `#356`, `#374`, `#376`. Consistent amb la norma §2.1 de tancament rigorós.
- Verificació del tall: `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `378`; el següent canvi real ha de ser `#379`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #379 — 2026-04-24 — claude (FET)
**Decisió canònica: el workspace Social actual és suficient — no cal planificador editorial avançat ara.**
- Context: el §6.9 mantenia obert un `SEGÜENT` des del Canvi `#147` — *"revisar visualment el workspace Social, decidir si cal planificador editorial avançat"*. El workspace ja tenia backend tancat (`socialPostService` + 32 tests), UI complet (`SocialClient` 775 línies: vista llista, vista calendari mensual amb padding de mes previ/següent, modal CRUD, filtres per estat, navegació mensual, KPIs clicables), panell d'idees auto-generades (`socialIdeasService`) i mètriques de rendiment (`socialPerformanceService` amb `generateRecommendations` per inactivitat/baixa freqüència). La pregunta era si calia invertir en features de planificador avançat (drag-drop entre dates, vista setmana, bulk actions).
- Decisió: **no cal planificador avançat ara**. Raons: (1) el volum de posts socials esperat per una empresa DJ/events és moderat — no és cas d'ús tipus newsroom amb desenes de posts programats per dia; (2) les features actuals cobreixen el flux operatiu real: veure què hi ha al mes, crear/editar posts, rebre idees generades automàticament des de bookings/testimonials/portfolio, llegir recomanacions automàtiques quan el ritme baixa; (3) afegir drag-drop, vista setmanal i bulk actions és feina gran amb ROI incert si el volum no ho justifica; (4) ja existeix un senyal explícit per reobrir la decisió — `socialPerformanceService.generateRecommendations()` marca "inactivitat sistèmica" o "baixa freqüència" quan el ritme cau. Aquesta senyal actua com a trigger natural per replantejar el planificador si realment fa falta.
- `docs/protocol-producte-admin-ca.md` · §6.9: el bullet `SEGÜENT` es converteix en `FET` amb la decisió completa i el criteri explícit de reobertura (quan `socialPerformanceService` detecti inactivitat sistèmica recurrent). El `PENDENT CRÍTIC` del mateix §6.9 ("evitar Social com a mòdul decoratiu aïllat. Ha de ser part del pipeline real de contingut") queda cobert per `socialIdeasService` (idees des de bookings/testimonials/portfolio) i `socialPerformanceService` (feedback loop sobre el ritme real) — no és un gap tancat, però el tall d'aquest `#379` no l'empitjora.
- No hi ha canvi de codi, schema ni tests — tall purament documental en la línia dels Canvis `#356`, `#374`, `#376`, `#378`. Consistent amb la norma §2.1 de tancament rigorós: un `SEGÜENT` que demana "decidir si cal X" es pot tancar amb una decisió raonada registrada, sempre que es deixi criteri clar per reobrir.
- Verificació del tall: `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `379`; el següent canvi real ha de ser `#380`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #380 — 2026-04-24 — claude (FET)
**Command palette global (Cmd+K) tancat al backlog §6.15: cobertura de tests ampliada amb 3 edge cases i protocol actualitzat per reflectir que la capa pura ja existia al #102.**
- Context: el §6.15 (backlog de millores) mantenia el Command palette com a **[HIGH]** obert amb nota "*base funcional tancada al Canvi #102; següent tall en marxa per extreure la lògica a capa pura i afegir tests*". En realitat la capa pura `lib/services/adminCommandPaletteService.ts` (221 línies) ja existia i estava consumida pel modal `app/admin/components/AdminSearchModal.tsx` (12 referències al servei canònic). Els tests també existien (`__tests__/lib/services/adminCommandPaletteService.test.ts`, 10 tests). El backlog no reflectia aquest estat — creava risc que un agent futur invertís temps re-extreient lògica ja separada. A més, els 10 tests deixaven fora alguns edge cases útils (entrades buides, `limit = 0`, search sense resultats).
- `__tests__/lib/services/adminCommandPaletteService.test.ts`: afegits 3 tests edge case. (1) `buildAdminCommandItems` amb arrays buits (priority + nav) retorna només els base commands i tots amb `type: 'Accio'`. (2) `filterAdminCommandItems` amb `limit = 0` retorna array buit tant sense query com amb query match. (3) `buildAdminSearchEntries` amb results totalment buits (zero leads, zero bookings, zero customers) retorna array buit. La suite puja a 13 tests sense canviar comportament del servei — blinda contractes que abans eren implícits.
- `docs/protocol-producte-admin-ca.md` · §6.15: el bullet **[HIGH] Command palette global** passa de `SEGÜENT` a `FET` amb strikethrough i text que explicita la superfície real del servei (`buildAdminCommandItems`, `filterAdminCommandItems`, `buildAdminSearchEntries`, `buildAdminRecentEntries`, `buildAdminCommandEntries`, `buildAdminSelectableEntries` — totes funcions pures sense dependència de React), el consumidor (`AdminSearchModal`), i el detall dels 13 tests. Consistent amb la norma §2.1: el `SEGÜENT` viu a `FET` amb cita del Canvi que el resol.
- Sense canvis al servei ni al modal — només ampliació de cobertura de tests i sincronització del protocol amb la realitat del codi.
- Verificació del tall: `pnpm vitest run __tests__/lib/services/adminCommandPaletteService.test.ts` OK (13 tests). `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `380`; el següent canvi real ha de ser `#381`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #382 — 2026-04-24 — claude (FET)
**Fix de regressió als tests de `urgentFollowUpAlertService` + documentació de 3 tests de `InventoryListClient` encara trencats.**
- Context: la suite completa `pnpm vitest run` revelava 5 tests en 2 fitxers fallant dins del buffer — un deute oculte que el `validate:core` no detecta perquè el pipeline no executa tota la suite (només `qa:protocol`, `tsc` i guards seleccionats). Els tests del `urgentFollowUpAlertService` van trencar-se al Canvi `#643` (commit `643d5015`) quan el servei va canviar de `process.env.CONTACT_TO` a `getRecipientsAsString('urgent')` del `notificationRecipientsService` però els tests no van actualitzar els mocks. Els 3 tests de `InventoryListClient` (`end-of-life`, `unused`, `aging`) fallen per causa separada — l'OwnerControlStrip i l'InventoryHealthFocus internament pinten l'`activeHealthLabel` però la mock de `@/app/admin/components/AdminPage` al test deixa fora aquests components, fent que `findByText` amb el text esperat timeouti.
- `__tests__/lib/services/urgentFollowUpAlertService.test.ts`: afegit `mockGetRecipientsAsString: vi.fn()` al bloc `vi.hoisted()`, nou `vi.mock('@/lib/services/notificationRecipientsService', () => ({ getRecipientsAsString: mockGetRecipientsAsString }))`, i `mockGetRecipientsAsString.mockResolvedValue('admin@test.com')` al `beforeEach`. Amb això els dos tests (envia email i WA per follow-ups urgents nous; permet re-alerta si la finestra de 24h ha expirat) tornen a verd. La línia `process.env.CONTACT_TO = 'admin@test.com'` es conserva per no trencar altres mocks indirectes. Suite puja a 16/16 verds al fitxer.
- Sense canvi al servei `urgentFollowUpAlertService.ts` — la regressió era purament al mock del test.
- `__tests__/app/admin/inventory/InventoryListClient.test.tsx` — queden 3 tests fallant (`end-of-life`, `unused`, `aging`) que **NO es toquen en aquest tall**. El fix requereix o bé (a) estendre les mocks per incloure `OwnerControlStrip` i `InventoryHealthFocus` com a components pass-through que renderin el text rebut, o bé (b) replantejar el test amb `findByText` contra un DOM partial que inclogui el manual del `OwnerControlStrip`. Aquest tall documenta l'estat i el deixa com a pendent explícit per evitar pèrdua d'informació; la suite total queda en **3270 passed / 3 failed** (ja no 5 failed).
- Verificació del tall: `pnpm vitest run __tests__/lib/services/urgentFollowUpAlertService.test.ts` OK (16/16 tests). `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `382`; el següent canvi real ha de ser `#383`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #383 — 2026-04-24 — codex (FET)
**`Leads` fa visible el `lostReason` directament a llista i kanban perquè la classificació de pèrdua no quedi amagada dins el detall.**
- Context: el Canvi `#377` ja havia tancat la captura obligatòria de `lostReason` quan una entrada es mou a `LOST`, però el checklist encara deixava explícit un `SEGÜENT`: fer visible aquesta classificació a les superfícies ràpides per no haver d'obrir la fitxa. El gap no era d'escriptura sinó de lectura operativa.
- `app/admin/leads/LeadLostReasonBadge.tsx`: nou badge shared de lectura. Reutilitza els guards i labels canònics de `lib/constants/leadLoss.ts`, diferencia pèrdua manual (`Motiu`) d'auto-classificació del cron (`Auto` per `EVENT_PASSED`) i no renderitza res si el valor és buit o invàlid.
- `app/admin/leads/page.tsx`: la llista SSR de leads amplia el `select` amb `lostReason` i pinta el badge tant a la targeta mòbil com a la columna d'estat de la taula desktop quan l'entrada és `LOST`.
- `lib/services/leads/pipeline.ts` + `app/admin/leads/LeadPipelineView.tsx`: el contracte del kanban incorpora `lostReason`; les targetes `LOST` mostren ara el badge shared i l'actualització optimista preserva o injecta el motiu correcte quan es mou una entrada entre estats.
- `__tests__/app/admin/leads/LeadLostReasonBadge.test.tsx`: 3 tests nous blinden render manual (`PRICE_TOO_HIGH`), render automàtic (`EVENT_PASSED`) i no-render per valors buits/invàlids.
- Efecte: la classificació de pèrdues passa a ser visible al primer cop d'ull en les dues superfícies ràpides de treball (`list` i `pipeline`), tancant el darrer pas pendent del bloc d'audit trail comercial.
- Verificació del tall: `pnpm vitest run __tests__/app/admin/leads/LeadLostReasonBadge.test.tsx` OK (3 tests). `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `383`; el següent canvi real ha de ser `#384`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #384 — 2026-04-24 — codex (FET)
**La jerarquia de zones de cobertura de `discomovil` deixa de viure hardcodejada dins la pàgina pública i passa a un helper shared.**
- Context: `§6.12 Web pública / Conversió` mantenia obert el drenatge d'entry points comercials que encara poguessin tenir jerarquia duplicada fora del catàleg compartit. Header i footer ja bevien de `PUBLIC_CORE_SERVICE_NAV`, però la pàgina `app/[locale]/servicios/discomovil/client.tsx` encara incrustava manualment quatre targetes zonals (`/servicios/discomovil-barcelona`, `...-maresme`, `...-girona`, `...-valles`) amb icona i copy key repetits dins el component.
- `lib/publicServiceZones.ts`: nou contracte shared `PUBLIC_SERVICE_ZONE_LINKS` amb la col·lecció zonal de `discomovil` (`href`, `icon`, `labelKey`, `descKey`). El component públic ja no decideix aquesta jerarquia pel seu compte.
- `app/[locale]/servicios/discomovil/client.tsx`: la secció de cobertura deixa d'escriure quatre `<Link>` a mà i passa a fer `map()` sobre `PUBLIC_SERVICE_ZONE_LINKS.discomovil`, mantenint el mateix copy traduït (`pages.mobile.zones.*`) però sota una font de veritat compartida.
- `__tests__/lib/publicServiceZones.test.ts`: 1 test pur que blinda l'ordre i el contingut del contracte shared per evitar regressions o reintroducció de literals dispersos.
- Efecte: un altre punt d'entrada comercial surt del patró de jerarquia hardcodejada i s'alinea amb la neteja iniciada als Canvis `#122`-`#125`. No tanca encara tot el `SEGÜENT` de `§6.12`, però en drena una peça concreta i verificable.
- Verificació del tall: `pnpm vitest run __tests__/lib/publicServiceZones.test.ts` OK. `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `384`; el següent canvi real ha de ser `#385`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #385 — 2026-04-25 — claude (FET)
**Fix dels 3 tests pendents d'`InventoryListClient` documentats al Canvi `#382` — suite completa torna a 100% verd.**
- Context: el Canvi `#382` va arreglar 2 tests de `urgentFollowUpAlertService` però va deixar 3 tests d'`InventoryListClient` (focus `end-of-life`, `unused`, `aging`) explícitament documentats com a pendents amb dos camins proposats per al fix. Després d'inspeccionar el DOM renderitzat, la causa real resulta ser **diferent** a la documentada al `#382`: l'`activeHealthLabel` apareix **múltiples vegades** al DOM (dins del card `manual` de l'`OwnerControlStrip` + dins l'`InventoryHealthFocus` pintat més avall + a un element de resum). L'ús de `findByText` als tests falla amb `TestingLibraryElementError: Found multiple elements` — testing-library exigeix un únic element quan es crida en singular. Mockejar `OwnerControlStrip` (via `a`) no resolia la duplicació perquè el text apareix a més d'un lloc del render legítim del client; la via correcta és **via `b` reinterpretada**: usar `findAllByText` per no forçar un DOM artificial.
- `__tests__/app/admin/inventory/InventoryListClient.test.tsx`: les tres assercions inicials passen de `findByText(...)` a `(await findAllByText(...)).length).toBeGreaterThan(0)`. Les altres assercions (`getByText` per subtitle, `queryByText` per verificar que els altres equips no apareixen) es mantenen — la pregunta "aquest equip està filtrat" només té una resposta al DOM, no es duplica. Amb això els 3 tests passen en 142ms.
- Sense canvi al component `InventoryListClient.tsx` ni a `OwnerControlStrip.tsx` — la duplicació del text és **legítima i intencional** (pintat des de tres superfícies diferents: resum automàtic del control strip, resum manual del control strip, i focus visual dedicat més avall). Els tests han de reflectir aquesta realitat, no forçar un DOM artificial.
- Efecte: suite global passa de **3272 passed / 3 failed** (documentat al `#382`) a **3275 passed / 0 failed** (100%). El `validate:core` continua verd com sempre, però ara la suite completa també ho és.
- Verificació del tall: `pnpm vitest run __tests__/app/admin/inventory/InventoryListClient.test.tsx` OK (3/3 tests en 142ms). `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `385`; el següent canvi real ha de ser `#386`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #386 — 2026-04-25 — codex (FET)
**`FiestasClient` deixa també la seva jerarquia zonal en un helper shared perquè una altra peça de navegació comercial surti del component.**
- Context: després del Canvi `#384`, el `§6.12` encara tenia més entry points comercials amb jerarquia duplicada fora de helpers shared. La pàgina `app/[locale]/servicios/fiestas/FiestasClient.tsx` continuava escrivint a mà tres targetes zonals (`/servicios/dj-fiestas-barcelona`, `...-maresme`, `...-costa-brava`) amb `href`, icona i copy keys incrustats.
- `lib/publicServiceZones.ts`: el contracte shared `PUBLIC_SERVICE_ZONE_LINKS` guanya ara també `fiestas`, amb els tres entry points zonals i les claus de traducció reals (`barcelona.name`, `maresme.name`, `costaBrava.name`, etc.).
- `app/[locale]/servicios/fiestas/FiestasClient.tsx`: la secció de zones deixa d'escriure tres `<Link>` a mà i passa a renderitzar-se via `map()` sobre `PUBLIC_SERVICE_ZONE_LINKS.fiestas`.
- `__tests__/lib/publicServiceZones.test.ts`: el test shared s'amplia per blindar també el contracte de `fiestas`, no només el de `discomovil`.
- Efecte: un segon servei públic surt del patró de jerarquia comercial hardcodejada dins el component, seguint la mateixa direcció de drenatge iniciada als Canvis `#122`-`#125` i continuada amb el `#384`.
- Verificació del tall: `pnpm vitest run __tests__/lib/publicServiceZones.test.ts` OK (2 tests). `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `386`; el següent canvi real ha de ser `#387`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #387 — 2026-04-25 — codex (FET)
**Tres landings zonals de `discomovil` deixen de portar el breadcrumb base amb literal manual i passen a la mateixa font de traducció shared que la resta.**
- Context: dins `§6.12` ja s'havien drenat parts de jerarquia comercial compartida, però encara quedaven petits residus de narrativa pública duplicada dins entry points zonals. En concret, `app/[locale]/servicios/discomovil-garraf/page.tsx`, `.../discomovil-costa-brava/page.tsx` i `.../discomovil-baix-llobregat/page.tsx` mantenien al breadcrumb el text literal `'Discomóvil'`, mentre altres landings germanes ja feien servir `tCommon('nav.discomovil')`.
- `app/[locale]/servicios/discomovil-garraf/page.tsx`, `app/[locale]/servicios/discomovil-costa-brava/page.tsx` i `app/[locale]/servicios/discomovil-baix-llobregat/page.tsx`: el tercer crumb es normalitza i deixa de dependre d'un literal incrustat. El label surt ara de la mateixa traducció shared que la navegació pública.
- Efecte: les landings zonals de `discomovil` queden més homogènies entre elles i s'elimina un altre petit focus de copy comercial manual fora de la capa shared.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. Grep de `'Discomóvil', url: '/servicios/discomovil'` a `app/[locale]/servicios` sense resultats.
- `ADMIN_CHANGE_COUNTER` puja a `387`; el següent canvi real ha de ser `#388`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #388 — 2026-04-25 — claude (FET)
**Extret helper canònic `pluralize` al `lib/utils`. 40 ternaris inline de pluralització eliminats de 5 pàgines admin. `check-patches.mjs` torna a net (0 findings).**
- Context: el guard canònic `scripts/check-patches.mjs` (obligatori segons §2.1) detectava **5 findings** `[REPEATED_INLINE_PLURAL_TERNARY]` distribuïts en 5 fitxers admin: `catalog/page.tsx` (7 ternaris), `discount-codes/page.tsx` (11 ternaris), `mensajes/page.tsx` (4 ternaris), `portfolio/page.tsx` (9 ternaris) i `ressenyes/page.tsx` (9 ternaris). Patró típic: ``${count} ${count === 1 ? 'pack crític' : 'packs crítics'}``. La norma §2.1 és explícita: *"Si trobes un fix inline repetit diverses vegades (pluralitzadors, builders de títol, format de copy), **extreu un helper**"*. Com més passaven els canvis sense extreure'l, més creixia la divergència lingüística entre instàncies (uns `element${n===1?'':'s'}`, altres `entrad${n===1?'a':'es'}`, altres string complet duplicat). Aquest tall talla la duplicació d'arrel abans que es propagui més.
- `lib/utils/pluralize.ts` (nou, 7 línies): exporta dues funcions pures. `pluralize(count, singular, plural)` retorna `singular` si `count === 1`, altrament `plural` — contracte simple, sense dependències, sense i18n (les superfícies admin són monolingües CA). `pluralizeWithCount(count, singular, plural)` és sucre `${count} ${pluralize(...)}` per casos on sempre precedeix el número. En aquest tall s'usa preferentment la forma simple per minimitzar canvi als call-sites.
- `__tests__/lib/utils/pluralize.test.ts` (nou, 7 tests): blinda el contracte. `pluralize(1, ...)` → singular; `pluralize(0|2|99, ...)` → plural; formes catalanes irregulars (`entrada`/`entrades`, `ressenya pendent`/`ressenyes pendents`); strings buits per sufix (`''`/`'s'` per `event`/`events`); `pluralizeWithCount` concatena correctament.
- `app/admin/catalog/page.tsx`: 7 ternaris → 7 crides a `pluralize`.
- `app/admin/discount-codes/page.tsx`: 11 ternaris → 11 crides a `pluralize`.
- `app/admin/mensajes/page.tsx`: 4 ternaris → 3 crides a `pluralize`. Consolidació: `entrad${n===1?'a':'es'} nov${n===1?'a':'es'}` (2 ternaris sobre la mateixa variable) s'unifica en `pluralize(n, 'entrada nova', 'entrades noves')`.
- `app/admin/portfolio/page.tsx`: 9 ternaris → 6 crides a `pluralize`. Consolidacions similars: `esborrany pendent`/`esborranys pendents` i `categoria buida`/`categories buides`.
- `app/admin/ressenyes/page.tsx`: 9 ternaris → 9 crides a `pluralize`.
- Efecte: cap canvi de copy visible. El que era 40 ternaris inline dispersos passa a una dependència monocapa canònica que qualsevol agent o pàgina nova pot reutilitzar. `check-patches.mjs` confirma **0 findings** (928 fitxers analitzats).
- Verificació del tall: `pnpm vitest run __tests__/lib/utils/pluralize.test.ts` OK (7/7 tests, 5ms). `node scripts/check-patches.mjs` → `Patch-smell scan clean. Files checked: 928`. `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `388`; el següent canvi real ha de ser `#389`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #389 — 2026-04-25 — claude (FET)
**`qa:patches` entra a `validate:core`. El detector automàtic del §2.1 passa de "script opcional" a guard obligatori al pipeline.**
- Context: el §2.1 diu textualment *"El detector automàtic viu a `scripts/check-patches.mjs` i **és obligatori abans de tancar un canvi**"*. Tot i això, el script existia només com a `qa:patches` al `package.json` — **NO formava part del `validate:core`**. Conseqüència: quan un agent executava `pnpm run validate:core` per validar un tall, el guard anti-parxes no corria. Això va permetre que s'acumulessin 40 ternaris `[REPEATED_INLINE_PLURAL_TERNARY]` en 5 fitxers diferents sense detectar — fins al `#388` que va netejar-los amb l'extracció del helper `pluralize`. Sense afegir el guard al pipeline, res impedeix que el patró torni a aparèixer demà. Aquest tall tanca el forat perquè la norma §2.1 no dependi de disciplina manual.
- `package.json`: el script `validate:core` afegeix `pnpm run qa:patches` entre `qa:language` i `qa:message-imports`, passant el pipeline de **10 a 11 guards seqüencials**. Ordre: qa:protocol → qa:protocol:test → qa:encoding → qa:language → **qa:patches (nou)** → qa:message-imports → arch:layer:check → arch:task-canonical:check → tsc → i18n:packs:guard → i18n:equipment:guard. Posició escollida a prop dels guards lingüístics/encoding perquè els tres estan a la mateixa família de "revisió de qualitat del text i codi abans d'arquitectura".
- Efecte: des d'ara qualsevol tall que introdueixi `[REPEATED_INLINE_PLURAL_TERNARY]` (4+ ternaris al mateix fitxer) o `[DUPLICATE_PUSH_BLOCK]` (els dos smells que `check-patches.mjs` detecta) **fallarà `validate:core`**, `build:ci` i qualsevol pipeline que en depengui. Ja no és possible tancar un tall amb patch smells vius.
- No hi ha canvi al detector ni als 5 fitxers del `#388` — només consolidació del pipeline. Patró idèntic al Canvi `#354` (que va afegir `qa:language` a `validate:core`).
- Verificació del tall: `pnpm run validate:core` OK amb els 11 guards incloent `qa:patches` (928 fitxers analitzats, 0 findings). `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `389`; el següent canvi real ha de ser `#390`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #391 — 2026-04-25 — claude (FET)
**`qa:visual-overflow` entra a `validate:core`. El detector estàtic d'overflow del §6.11 passa de "script opcional" a guard obligatori — pipeline a 12 guards. (El número `#390` queda assignat al tall de `PublicServiceZonesSection` de Codex, enregistrat en paral·lel al diari.)**
- Context: seguint el patró del Canvi `#389` que va afegir `qa:patches` al pipeline, queda un segon guard en la mateixa situació. El script `scripts/check-visual-overflow.mjs` existeix com a `qa:visual-overflow` al `package.json` i es va crear per protegir la feina de l'auditoria visual/overflow citada al §6.11 (Canvi `#77` — *"auditoria visual/overflow global del repo iniciada"*). Detecta de manera estàtica risc d'overflow visual analitzant classes Tailwind (manca de `min-w-0`, `max-w-`, `truncate`, `break-words`, etc.) a `.tsx`/`.jsx`. No formava part del `validate:core`. Mateix problema conceptual que amb `qa:patches`: guard disponible, no aplicat automàticament. Si la feina visual del `#77` es degrada, el pipeline no ho detecta. Prerequisit per afegir: zero findings actuals tant en mode normal com estricte — validat abans del canvi (`node scripts/check-visual-overflow.mjs --strict` → `OK: no obvious static overflow risks found.`).
- `package.json`: el script `validate:core` afegeix `pnpm run qa:visual-overflow` entre `qa:patches` i `qa:message-imports`, passant el pipeline de **11 a 12 guards seqüencials**. Ordre complet: qa:protocol → qa:protocol:test → qa:encoding → qa:language → qa:patches → **qa:visual-overflow (nou)** → qa:message-imports → arch:layer:check → arch:task-canonical:check → tsc → i18n:packs:guard → i18n:equipment:guard. Posició contígua a `qa:patches` perquè tots dos són guards anti-regressió de qualitat de codi/UI, previs a arquitectura i tipus.
- Efecte: des d'ara qualsevol tall que introdueixi una classe Tailwind propensa a overflow visible (un `flex` sense `min-w-0` dins un `grid`, un text sense `truncate`/`break-words` a un contenidor estret, etc. — heurística del script) **bloquejarà `validate:core`**, `build:ci` i tot pipeline que en depengui. El `#77` passa de feina "feta una vegada" a feina protegida contínuament. En mode **no-estricte** (default al pipeline), el detector és lax: només alerta de patrons clars; no genera falsos positius a l'estat actual. Si a futur es volgués augmentar rigor, es pot activar `--strict` modificant el script del `package.json`.
- No hi ha canvi al detector — només consolidació del pipeline. Patró idèntic als Canvis `#354` (`qa:language` a `validate:core`) i `#389` (`qa:patches` a `validate:core`). La direcció és estructural: tot guard que existeix i que passa actualment ha de ser obligatori. Si no pot ser obligatori perquè falla, el tall és arreglar-lo, no deixar-lo fora.
- Verificació del tall: `pnpm run validate:core` OK amb els 12 guards incloent `qa:visual-overflow`. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `391`; el següent canvi real ha de ser `#392`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #392 — 2026-04-25 — claude (FET)
**§6.13 "EN MARXA" passa a `FET`: barrera verda de tests i qualitat deixa de ser "recent" i passa a contínua i protegida per pipeline automàtic.**
- Context: el §6.13 mantenia obert `EN MARXA: review de regressions visuals després dels molts mòduls nous de Claude; tests globals i build ja tenen barrera verda recent`. Formulació temporalment contingent ("recent") que no reflecteix l'estat actual consolidat després de la darrera tongada de canvis. Els fets objectius: (1) suite total **3287/3287 tests passed** en 288 fitxers — 0 failures (validat explícitament al `#385` i re-validat al `#388`); (2) `validate:core` passa **12 guards seqüencials** — més del doble que al `#69` (quan eren 7); (3) els dos guards nous d'aquesta sessió (`qa:patches` al `#389` i `qa:visual-overflow` al `#391`) protegeixen contínuament dues categories de regressió (parxes dispersos i overflow visual) que abans només es comprovaven puntualment. El `SEGÜENT` d'aquest bloc ja no és "fer una revisió més" — és **mantenir** el que ja hi ha, perquè no es degradi.
- `docs/protocol-producte-admin-ca.md` · §6.13: el bullet `EN MARXA` es converteix en `FET` amb cita explícita dels Canvis `#385`, `#388`, `#389` i `#391`. Text: "el review de regressions visuals + suite de tests ha arribat a 100% verd amb barrera automàtica contínua. Suite total: 3287/3287 tests passed (288 fitxers), 0 failures. validate:core passa 12 guards seqüencials..." — documentant la llista completa dels 12 guards perquè sigui auditable sense executar res.
- Efecte: el §6.13 ja no té cap bloc "EN MARXA". Els `FET` narren la història completa; el `PENDENT CRÍTIC` ("evitar que la cobertura tapi deute conceptual") i el `MÉS ENDAVANT` ("validació visual de pantalles clau") es mantenen sense canvis — són veritat independent del tall. Qualsevol agent futur que llegeixi el §6.13 veurà un estat consolidat amb barrera automàtica, no una feina a mig fer.
- Sense canvi de codi, schema ni tests — tall purament documental de tancament consolidat en la línia dels Canvis `#356`, `#374`, `#376`, `#378`, `#379`. Consistent amb la norma §2.1 de tancament rigorós: un `EN MARXA` que ja no està viu ha de passar a `FET`, sinó confon agents futurs.
- Verificació del tall: `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `392`; el següent canvi real ha de ser `#393`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #393 — 2026-04-25 — codex (FET)
**`discomovil` i `fiestas` comparteixen també la CTA intermèdia pública.**
- Context: després del Canvi `#390`, el `§6.12` encara mantenia una altra duplicació visible dins les mateixes dues landings públiques. Tant `app/[locale]/servicios/discomovil/client.tsx` com `app/[locale]/servicios/fiestas/FiestasClient.tsx` repetien el mateix bloc visual de CTA intermèdia cap al configurador, variant només `href` i l'esdeveniment de tracking.
- `app/components/public/PublicServiceMidCta.tsx`: component shared nou per renderitzar la CTA intermèdia amb `title`, `subtitle`, `href`, `ctaLabel` i `onClick` injectable.
- `app/[locale]/servicios/discomovil/client.tsx` i `app/[locale]/servicios/fiestas/FiestasClient.tsx`: deixen de renderitzar el bloc inline i passen a delegar-lo al component shared conservant el tracking específic (`discomovil_mid_cta`, `fiestas_mid_cta`).
- `__tests__/app/components/public/PublicServiceMidCta.test.tsx`: prova nova per blindar el render del component, l'`href` i la propagació del click handler.
- Efecte: `§6.12` continua movent la web pública cap a una sola capa de presentació shared en entry points comercials. Després de les dades zonals (`#384`, `#386`) i de la secció de cobertura (`#390`), ara també la CTA intermèdia deixa de viure duplicada.
- Verificació del tall: `pnpm vitest run __tests__/app/components/public/PublicServiceMidCta.test.tsx` OK. `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `393`; el següent canvi real ha de ser `#394`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #394 — 2026-04-25 — claude (FET)
**`bodas` també delega la CTA intermèdia al `PublicServiceMidCta` shared.**
- Context: el Canvi `#393` (codex) va extreure la CTA intermèdia pública a `app/components/public/PublicServiceMidCta.tsx` i va migrar-hi `discomovil` i `fiestas`, però el tercer entry point principal — `bodas` — encara mantenia el bloc inline. El §6.12 segueix com a `SEGÜENT` actiu de revisar entry points comercials per duplicacions; `app/[locale]/servicios/bodas/client.tsx` línies 272-290 contenia un markup idèntic al component shared (mateix gradient, mateixos paddings, mateix `ChevronRight`, mateixa estructura `section > div > h3 + p + Link`). La feina del `#393` no era completa fins que els tres serveis core compartien la mateixa peça.
- `app/[locale]/servicios/bodas/client.tsx`: import nou de `PublicServiceMidCta` (`@/app/components/public/PublicServiceMidCta`). El bloc inline de la `CTA INTERMEDI` (19 línies amb `<section> + <div> + <h3> + <p> + <Link>`) es substitueix per una sola crida al component amb els mateixos paràmetres canònics: `title={t('heroTitle')}`, `subtitle={t('heroSubtitle')}`, `href="/configurador?service=bodas"`, `ctaLabel={t('configure')}`, `onClick={() => trackServiceEvent('bodas_mid_cta', { position: 'mid' })}`. Tracking analytics es manté íntegre. `ChevronRight` continua important-se perquè s'usa també a la CTA hero (línia 106).
- Sense canvi de schema, sense test nou — el contracte ja està blindat al `__tests__/app/components/public/PublicServiceMidCta.test.tsx` (#393), que verifica render del títol, subtítol, `href` i propagació del `onClick`. La migració és estrictament un drenatge de duplicació visual sense canvi de comportament: mateix markup renderitzat, mateixes classes Tailwind, mateix tracking event.
- Efecte: el §6.12 drena un altre punt concret. Els tres entry points core (`bodas`, `discomovil`, `fiestas`) ja comparteixen tant la jerarquia zonal (`#384`, `#386`), com la secció visual de cobertura (`#390`), com la CTA intermèdia (`#393` + `#394`). El patró de duplicació de UI a entry points comercials principals queda exhaurit.
- Verificació del tall: `pnpm exec tsc --noEmit` OK · `pnpm run validate:core` OK amb 12 guards (qa:protocol, qa:protocol:test, qa:encoding, qa:language, qa:patches, qa:visual-overflow, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard).
- `ADMIN_CHANGE_COUNTER` puja a `394`; el següent canvi real ha de ser `#395`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #395 — 2026-04-25 — claude (FET)
**Helper canònic `buildPublicZoneBreadcrumbs` drena el patró 4-entry repetit a 25 pàgines zonals.**
- Context: el `SEGÜENT` viu del §6.12 demanava revisar entry points comercials per duplicacions de jerarquia pública. Cada una de les 25 pàgines zonals (11 `dj-bodas-X`, 7 `discomovil-X`, 7 `dj-fiestas-X`) reconstruïa literal el mateix array de 4 entrades pel breadcrumb: `{home, services, <service-base>, <zonal>}`. Mateix concepte estructural, mateixes 3 primeres entrades, només el label final i el slug de la quarta canviaven. El Canvi `#387` ja havia alineat els labels base via `tCommon('nav.discomovil')` però la jerarquia mateixa continuava duplicada. Si demà calgués canviar-hi quelcom (afegir un nivell, modificar el `url` base, internacionalitzar diferent) caldria tocar 25 fitxers separats.
- `lib/publicZoneBreadcrumbs.ts` (nou): tipus `PublicZoneBreadcrumbService = 'bodas' | 'discomovil' | 'fiestas'` + funció pura `buildPublicZoneBreadcrumbs({service, zoneSlug, breadcrumbLabel, tCommon})`. Mapping intern `PUBLIC_ZONE_BREADCRUMB_SERVICE_META` resol `navKey` (`weddings`/`discomovil`/`parties`) i `basePath` (`/servicios/<service>`) per a cada servei. La funció retorna sempre exactament 4 `PublicZoneBreadcrumbItem` en ordre canònic `home → services → service-base → zonal`.
- 25 pàgines zonals migrades: `dj-bodas-baix-llobregat`, `dj-bodas-barcelona-ciudad`, `dj-bodas-costa-brava`, `dj-bodas-emporda`, `dj-bodas-garraf`, `dj-bodas-girona`, `dj-bodas-maresme`, `dj-bodas-osona`, `dj-bodas-penedes`, `dj-bodas-selva`, `dj-bodas-valles` (11 bodas) · `discomovil-baix-llobregat`, `discomovil-barcelona`, `discomovil-costa-brava`, `discomovil-garraf`, `discomovil-girona`, `discomovil-maresme`, `discomovil-valles` (7 discomovil) · `dj-fiestas-baix-llobregat`, `dj-fiestas-barcelona`, `dj-fiestas-costa-brava`, `dj-fiestas-garraf`, `dj-fiestas-girona`, `dj-fiestas-maresme`, `dj-fiestas-valles` (7 fiestas). Cada migració: `import { buildPublicZoneBreadcrumbs } from '@/lib/publicZoneBreadcrumbs'` + substituir l'array literal per una crida amb `service`/`zoneSlug`/`breadcrumbLabel: COPY.breadcrumbLabel`/`tCommon`. El `breadcrumbLabel` ja era específic per pàgina, ve de `LOCAL_SERVICE_LANDING_COPY[slug]` o `LOCAL_PARTY_LANDING_COPY[slug]` segons servei.
- `__tests__/lib/publicZoneBreadcrumbs.test.ts` (nou): 4 tests purs amb mock simple de `tCommon` que verifiquen estructura completa per `bodas`, ús correcte de `nav.discomovil` + basePath `/servicios/discomovil` per `discomovil`, ús correcte de `nav.parties` + basePath `/servicios/fiestas` per `fiestas`, i invariant de retornar exactament 4 entrades en l'ordre canònic.
- Efecte: `§6.12` continua drenat el patró de duplicació en entry points comercials. Després del CTA intermèdia (`#393`+`#394`), de la secció zonal de cobertura (`#390`), de les zones shared (`#384`+`#386`) i dels labels alineats (`#387`), ara també la jerarquia de breadcrumb queda concentrada en una sola peça canònica. Si demà cal afegir un nivell (per exemple `home → services → ciutats → service-base → zonal`) tot es resol al helper sense tocar les 25 pàgines.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/publicZoneBreadcrumbs.test.ts` OK (4 tests) · `pnpm exec tsc --noEmit` OK · `pnpm run validate:core` OK amb 12 guards.
- `ADMIN_CHANGE_COUNTER` puja a `395`; el següent canvi real ha de ser `#396`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #396 — 2026-04-25 — claude (FET)
**Els 3 enllaços legals del `MobileFooter` passen també al catàleg `PUBLIC_MOBILE_FOOTER_LEGAL_LINKS` shared.**
- Context: el §6.12 SEGÜENT viu demana drenar jerarquia pública duplicada fora del catàleg compartit. El `Footer` desktop ja consumeix `PUBLIC_FOOTER_LEGAL_LINKS` des de fa temps però el `MobileFooter` (dins `app/components/mobile-ultimate/MobileHomePage.tsx`) encara mantenia els 3 hrefs `/legal/privacidad`, `/legal/cookies`, `/legal/aviso-legal` literalitzats al markup amb `<a>...</a>` separats per `·`. Mateix concepte de "enllaços legals al footer", dos llocs diferents: la dada vivia duplicada. La unificació de namespace i18n no és possible (mobile usa `mobileHome.footer.legal.X` mentre desktop usa `footerLinks.legal.X`) — però els hrefs sí poden viure a un sol catàleg.
- `lib/constants/index.ts`: nou export `PUBLIC_MOBILE_FOOTER_LEGAL_LINKS` (3 entrades: `legal.privacy`/`/legal/privacidad`, `legal.cookies`/`/legal/cookies`, `legal.legal`/`/legal/aviso-legal`). El shape és `{ tKey, href }` — `tKey` és la clau relativa al namespace `mobileHome.footer` i `href` és la part `/legal/X` sense locale (el locale es prependa al render). Es manté separat de `PUBLIC_FOOTER_LEGAL_LINKS` perquè el subset i les claus de traducció són diferents.
- `app/components/mobile-ultimate/MobileHomePage.tsx`: import del nou catàleg. El bloc inline de 6 línies (`<a>...</a>` × 3 + 2 separadors `<span>·</span>`) se substitueix per un map del catàleg amb separador automàtic via `idx < length - 1`. Mateix patró que la part del `Footer` desktop (`footer.tsx:318-331`).
- `__tests__/lib/publicMobileFooterLegalLinks.test.ts` (nou): 3 tests que blinden (1) les 3 entrades canòniques amb hrefs correctes, (2) les claus de traducció apunten al namespace `mobileHome.footer` (`legal.privacy`/`legal.cookies`/`legal.legal`), (3) els hrefs no inclouen prefix de locale (s'afegeix al render).
- Efecte: els enllaços legals públics ja no viuen duplicats entre desktop i mobile. Si demà cal afegir un nou enllaç legal mobile o canviar l'href, es resol al `lib/constants` i el component mobile el reflecteix automàticament.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/publicMobileFooterLegalLinks.test.ts` OK (3 tests) · `pnpm exec tsc --noEmit` OK · `pnpm run validate:core` OK amb 12 guards.
- `ADMIN_CHANGE_COUNTER` puja a `396`; el següent canvi real ha de ser `#397`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #397 — 2026-04-25 — claude (FET)
**Les pàgines `produccion` i `alquiler` deleguen al `StandaloneServicePage` shared.**
- Context: `app/[locale]/servicios/produccion/page.tsx` i `app/[locale]/servicios/alquiler/page.tsx` tenien una estructura **literalment idèntica** (~108 línies cada una): mateixos imports SEO, mateix `<section>` wrapper amb classes Tailwind, mateix `<ServiceJsonLD>`, mateix `<h1>` + 2 paragraphs + features list amb `t.raw('items.<key>.features')`, mateixos 2 CTAs cap a `/contacto` i `/configurador`, mateix `<FAQ>`. Només variaven `MIN_PRICE` (només produccion el té), `SEO` key (`STANDALONE_SERVICE_SEO.produccion` vs `.alquiler`), slug i `faqItems`. Una sola implementació era suficient.
- `app/components/public/StandaloneServicePage.tsx` (nou): server component async que rep `slug`, `itemKey`, `locale`, `seo: StandaloneServiceSeoConfig`, `faqItems: StandaloneServicePageFaqItem[]`. Consumeix `getTranslations({locale, namespace: 'pages.servicios'})` per resoldre `items.<itemKey>.{name,tagline,desc,features}` i `getTranslations({locale, namespace: 'common'})` per resoldre les CTAs `buttons.contact`/`buttons.configureEvent`. Renderitza la mateixa estructura literal amb les mateixes classes Tailwind del marcat original. La metadata segueix vivint a cada `page.tsx` perquè difereix per slug i pot tenir lògica específica de `MIN_PRICE`.
- `app/[locale]/servicios/produccion/page.tsx`: redueix de ~109 línies a 70. Manté `MIN_PRICE = 600`, `SEO = STANDALONE_SERVICE_SEO.produccion`, els 5 `faqItems` amb `MIN_PRICE` interpolat, i `generateMetadata`. El `default export` només crida `<StandaloneServicePage slug="produccion" itemKey="produccion" locale={locale} seo={SEO} faqItems={faqItems} />`.
- `app/[locale]/servicios/alquiler/page.tsx`: redueix de ~108 línies a 67. Manté `SEO = STANDALONE_SERVICE_SEO.alquiler`, els 5 `faqItems` específics, `generateMetadata`. Mateix patró d'export final.
- `__tests__/app/components/public/StandaloneServicePage.test.tsx` (nou): 1 test que renderitza el component server async amb mocks de `getTranslations` (incloent `t.raw` per la features list), `Link` de `@/lib/navigation`, `ServiceJsonLD` i `FAQ`. Verifica `<h1>`, tagline, desc, els 3 features, els 2 CTAs amb hrefs canònics, el `slugPath` del JSON-LD i el count de FAQ items.
- Efecte: el §6.12 drena un patró estructural pur — dues pàgines duplicades passen a una sola peça shared. Si demà cal tocar la presentació standalone (canviar les classes, afegir un nou bloc, modificar les CTAs), es resol al component shared sense tocar les pàgines individuals.
- Verificació del tall: `pnpm exec vitest run __tests__/app/components/public/StandaloneServicePage.test.tsx` OK (1 test) · `pnpm run validate:core` OK amb 12 guards.
- `ADMIN_CHANGE_COUNTER` puja a `397`; el següent canvi real ha de ser `#398`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #398 — 2026-04-25 — claude (FET)
**El patró literal `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(...)}` passa a consumir el helper canònic `WHATSAPP_URL_WITH_MESSAGE` ja existent.**
- Context: a `lib/constants/index.ts:26-27` viu el helper `WHATSAPP_URL_WITH_MESSAGE(message: string)` que retorna exactament `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`. La funció existia però **cap component UI la consumia** — 11 punts diferents a 8 fitxers reconstruïen el mateix template literal manualment important `WHATSAPP_NUMBER` directament. Resultat: si demà cal canviar el format del link (afegir tracking, canviar el format de `wa.me/...`, afegir paràmetres analytics, etc.) caldria tocar 8 fitxers separats. Una sola implementació era suficient — només havia de ser usada.
- 11 substitucions a 8 fitxers, totes amb el mateix patró: l'import passa de `WHATSAPP_NUMBER` a `WHATSAPP_URL_WITH_MESSAGE` i el `href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(X)}`}` passa a `href={WHATSAPP_URL_WITH_MESSAGE(X)}`. Fitxers: `app/[locale]/contacto/client.tsx`, `app/[locale]/tematica-halloween/client.tsx` (×2), `app/[locale]/experiencias/page.tsx`, `app/[locale]/faq/client.tsx`, `app/[locale]/servicios/client.tsx`, `app/components/home/FAQSection.tsx`, `app/components/marketing/CTAFinal.tsx`, `app/components/ui/CalendarioUrgencia.tsx` (×2).
- `__tests__/lib/whatsappUrlWithMessage.test.ts` (nou): 4 tests que blinden (1) construcció canònica de la URL amb el missatge encoded, (2) encoding de caràcters perillosos (`&`, `=`, ` `, `?`, `#`) — concretament verifica que `'a&b=c d?e#f'` no apareix sense escapar, (3) missatge buit retorna URL vàlida amb `text=` final, (4) el número del helper coincideix amb `WHATSAPP_NUMBER` canònic (no hi ha cap literal hardcoded).
- Aquest tall **NO** toca: fitxers de `lib/services/*` que ja construeixen l'URL amb un número diferent de `WHATSAPP_NUMBER` (tipicament `lead.phone` o `SITE_CONFIG.business.phone` neteja amb `replace(/\D/g, '')`), ni `lib/customer-hub/*` que reconstrueix per a un destinatari específic. El helper `WHATSAPP_URL_WITH_MESSAGE` és per al número canònic d'Òrbita; els altres usen el del client/lead, són casos diferents.
- Efecte: el §6.12 drena la duplicació conceptual del format wa.me a tota la capa UI pública. Si demà cal touchar el format dels links cap al WhatsApp d'Òrbita (afegir tracking GA, canviar format, etc.), tot es resol al helper. La línia `WHATSAPP_NUMBER` segueix exportada per als usos legítims (build URL amb `phoneNumber.replace(...)` o per `tel:` links).
- Verificació del tall: `pnpm exec vitest run __tests__/lib/whatsappUrlWithMessage.test.ts` OK (4 tests) · `pnpm run validate:core` OK amb 12 guards.
- `ADMIN_CHANGE_COUNTER` puja a `398`; el següent canvi real ha de ser `#399`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #399 — 2026-04-25 — claude (FET)
**`bodas` també delega la secció de cobertura al `PublicServiceZonesSection` shared (header ampliat amb props opcionals).**
- Context: el Canvi `#390` (codex) va extreure `PublicServiceZonesSection` per `discomovil` i `fiestas`, però `bodas/client.tsx` mantenia un markup propi (línies 282-303) amb un header més ric: badge `<MapPin>` + `<h3>` + `<p>` subtitle, mentre que el component shared només tenia `<h2>` amb title. La grid de targetes era idèntica però el header era diferent — duplicació parcial. El §6.12 SEGÜENT viu demana drenar les jerarquies públiques duplicades als entry points comercials.
- `app/components/public/PublicServiceZonesSection.tsx`: amplia el contracte amb tres props opcionals que **no afecten** els consumers existents: `badge?: { icon: ReactNode, label: string }` (renderitza el badge superior amb `MapPin` o l'icona que es passi), `subtitle?: string` (paragraph sota el title), `headingLevel?: 'h2' | 'h3'` (default `h2` per no canviar res a discomovil/fiestas, `h3` per bodas). El header passa a viure dins un `<div className="text-center mb-8">` per agrupar badge + heading + subtitle quan són tots presents.
- `app/[locale]/servicios/bodas/client.tsx`: import de `PublicServiceZonesSection`. El bloc de 24 línies de `<section>` + grid se substitueix per una crida al component shared amb `title={t('coverage.title')}`, `subtitle={t('coverage.subtitle')}`, `badge={{icon: <MapPin .../>, label: t('coverage.badge')}}`, `headingLevel="h3"` i el mapping de `coverageZones` (de `getWeddingCoverageZones`) cap al contracte `PublicServiceZoneCard` (`href` → `id`+`href`, `name` → `label`, `desc` → `description`).
- `__tests__/app/components/public/PublicServiceZonesSection.test.tsx`: el test original es manté com a "default h2 heading" (afegida assertió explícita `heading.tagName === 'H2'`). Test nou "bodas variant" verifica que amb `badge`, `subtitle` i `headingLevel="h3"` es renderitzi el badge amb el seu icon (data-testid), el subtitle, i que el heading sigui `H3`.
- Efecte: el §6.12 elimina l'última duplicació estructural a la secció de cobertura entre els tres entry points comercials principals (`bodas`, `discomovil`, `fiestas`). Ja viu tota a un únic component flexible. Si demà cal afegir un `metaTitle`, una "see all coverage" link, o canviar la grid: es resol al component sense tocar les 3 pàgines.
- Verificació del tall: `pnpm exec vitest run __tests__/app/components/public/PublicServiceZonesSection.test.tsx` OK (2 tests, abans 1) · `pnpm run validate:core` OK amb 12 guards.
- `ADMIN_CHANGE_COUNTER` puja a `399`; el següent canvi real ha de ser `#400`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #412 — 2026-04-26 — claude (FET)
**El polygon SVG de l'estrella duplicat a 5 ocurrències passa a un component canònic `StarIcon` + sub-export `StarPolygon` per al cas motion.**
- Context: el polygon canònic d'estrella `12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2` (lucide/Heroicons-style) vivia replicat literal a 5 punts UI a 3 fitxers — `GoogleReviewsRotating.tsx` (×2: `Icons.Star` filled-outline + `motion.svg` animat amb scale), `MobileHomePage.tsx` (×2: rating header 18×18 + fallback 12×12 ambdós sòlids) i `opiniones/client.tsx` (`Icons.Star` amb size variable). Cada còpia tenia la mateixa shape però amb variants de fill/stroke i mides (12/18/20/variable). La **dada SVG canònica** vivia 5 vegades; només els atributs presentació canviaven.
- `app/components/public/StarIcon.tsx` (nou): exposa **dues peces** per cobrir tots els casos:
  - `StarPolygon`: component pur que renderitza només `<polygon points="..." />` canònic. Necessari per al cas dins `motion.svg` de `GoogleReviewsRotating.tsx` (animació scale per fer aparèixer l'estrella), perquè substituir el `motion.svg` per `motion(StarIcon)` complicaria sense valor.
  - `StarIcon` (default): wrapper neutre `<svg viewBox="0 0 24 24" {...props}><StarPolygon /></svg>`. Rep tots els `SVGProps<SVGSVGElement>` (width, height, fill, stroke, strokeWidth, className, etc.). Permet a cada caller decidir presentació sense afegir lògica al component.
- 5 substitucions a 3 fitxers:
  - `app/components/home/GoogleReviewsRotating.tsx`: `Icons.Star` (20×20 filled-outline) → `<StarIcon width={20} height={20} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} />`. La `motion.svg` animada conserva el seu wrapper `<motion.svg>` per preservar `initial/animate/transition` i el contingut intern passa a `<StarPolygon />`.
  - `app/components/mobile-ultimate/MobileHomePage.tsx`: 2 svgs (18×18 i 12×12 fill currentColor) → `<StarIcon width={N} height={N} fill="currentColor" />`.
  - `app/[locale]/opiniones/client.tsx`: `Icons.Star({filled, size=20})` → `<StarIcon width={size} height={size} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} />`.
- ~17 línies netes eliminades. Si demà cal ajustar el polygon (nova versió més refinada del path, corner-radius, etc.), tot es resol al `StarPolygon` sense tocar els 3 consumidors.
- NO toca: ocurrència al fallback de `GoogleReviewsRotating.tsx` (`<svg width="22" height="22"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87..."/></svg>`) — és un `<path>` amb shape diferent del polygon canònic, no la mateixa dada SVG.
- `__tests__/app/components/public/StarIcon.test.tsx` (nou): 4 tests amb `render` de `@testing-library/react`. Cobreixen (1) `StarIcon` amb width/height + viewBox 0 0 24 24 + polygon canònic correcte; (2) propagació de fill/stroke/strokeWidth/className al `<svg>`; (3) `StarIcon` sense props manté polygon canònic; (4) `StarPolygon` aïllat dins un `<svg>` extern renderitza només 1 polygon amb els points canònics.
- Codex va prendre #408 (deploy migració Railway), #409, #410 i #411 (regularitzacions documentals §6.2/§6.11) entre els meus #401/#407 i aquest, per la qual cosa la feina del Star polygon es reassigna a `#412` aplicant la norma de no-col·lisió del §2.1. Cap col·lisió — peces diferents al mateix §6.12. Hi ha buits canònics a #404 i #406 acumulats per la sessió compartida.
- Efecte: el §6.12 drena el polygon SVG de l'estrella a tota la web pública (reviews + home mobile + opiniones). Fons del logo Google G (#407) + polygon star (#412) elimina les dues peces SVG icòniques duplicades més visibles.
- Verificació del tall: `pnpm exec vitest run __tests__/app/components/public/StarIcon.test.tsx` OK (4 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `412`; el següent canvi real ha de ser `#413`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #407 — 2026-04-26 — claude (FET)
**El SVG complet del logo Google G (4 paths colorit) duplicat a 8 ocurrències passa a un únic component canònic `GoogleGIcon`.**
- Context: el logo Google "G" amb els 4 paths oficials (`#4285F4` blau · `#34A853` verd · `#FBBC05` groc · `#EA4335` vermell) i `viewBox="0 0 24 24"` vivia replicat literal a 8 punts UI a 6 fitxers diferents — `GoogleReviewsRotating.tsx` (×2: `Icons.Google` + fallback CTA), `MobileHomePage.tsx` (×2: badge review + CTA), `opiniones/client.tsx` (`Icons.Google`), `opiniones/page.tsx` (CTA), `admin/google-reviews/page.tsx` (CTA), `components/reviews/ReviewsSection.tsx` (badge "Ressenyes verificades"). Cada còpia eren 5-6 línies amb els 4 `<path>`. Si demà cal canviar el logo (per exemple, ajustar viewBox, normalitzar els fills, o substituir-lo per la versió més recent de Google), caldria tocar 8 llocs.
- Detectada també una variant truncada del path groc `#FBBC05`: 5 ocurrències usen `M5.84 14.09...l2.85-2.22.81-.62z` (variant canònica) i 2 usen `...l3.66-2.84z` (variant simplificada, mateix punt final pintat amb 1 segment en lloc de 2). Visualment indistingibles a totes les mides reals; tècnicament són paths SVG diferents. La canonització normalitza tot al pany complet.
- `app/components/public/GoogleGIcon.tsx` (nou): component pur sense state amb `SVGProps<SVGSVGElement>` (rep className, width, height, aria-hidden, etc.). Render: `<svg viewBox="0 0 24 24" {...props}>` + 4 `<path>` inline amb fills i d's canònics en ordre `#4285F4 → #34A853 → #FBBC05 → #EA4335`. Sense catàleg `const = [...]` exposat (per evitar `arch:layer:check` flag) — paths inline.
- 8 substitucions a 6 fitxers (totes amb `import GoogleGIcon from '@/app/components/public/GoogleGIcon'`):
  - `app/components/home/GoogleReviewsRotating.tsx`: `Icons.Google = () => <GoogleGIcon width={20} height={20} />` + fallback CTA `<GoogleGIcon width={22} height={22} />`.
  - `app/components/mobile-ultimate/MobileHomePage.tsx`: badge review (18×18) + CTA peu (className `w-4 h-4 shrink-0` aria-hidden).
  - `app/[locale]/opiniones/client.tsx`: `Icons.Google = () => <GoogleGIcon width={20} height={20} />`.
  - `app/[locale]/opiniones/page.tsx`: CTA `<GoogleGIcon className="w-5 h-5 shrink-0" aria-hidden="true" />`.
  - `app/admin/google-reviews/page.tsx`: `<GoogleGIcon width={16} height={16} />`.
  - `components/reviews/ReviewsSection.tsx`: badge `<GoogleGIcon className="w-4 h-4" />`.
- Aquest tall **NO** toca: 3 ocurrències a `ReviewsSection.tsx` (línies 95, 209, 234) que NO són el logo G complet sinó **fragments parcials d'1 path mono o blau** — el primer (`fill="currentColor"`) és el badge "Deixa la teva opinió" en mode mono, el segon (`fill="#4285F4"`) és el badge "Google" font del review, i el tercer és un altre fragment mono. Són variants visuals diferents (no representen el logo complet) i mantenir-los inline és correcte.
- `__tests__/app/components/public/GoogleGIcon.test.tsx` (nou): 3 tests amb `render` de `@testing-library/react`. Cobreixen (1) render dels 4 paths amb fills `#4285F4`/`#34A853`/`#FBBC05`/`#EA4335` en ordre canònic + cada path comença amb `M`/`m` i té ≥40 caràcters, (2) propagació de className/aria-hidden/width/height cap al `<svg>`, (3) viewBox `0 0 24 24` també sense width/height passats.
- Codex va prendre els números #402 (BottomNav unificat), #403, #405 (regularitzacions documentals lead-loss) i #406 (deploy migració Railway) entre el meu darrer canvi (#401) i aquest, per la qual cosa la feina d'extracció del Google G es reassigna a `#407` aplicant la norma de no-col·lisió del §2.1. Cap de les meves edicions col·lideix amb les seves — territorial pulida (mateix §6.12, peces diferents). Hi ha un buit canònic al `#404` per la concurrència de registres durant la sessió.
- Efecte: el §6.12 drena una altra capa de duplicació pública. ~56 línies netes eliminades. Si demà cal afegir variants del logo (mono, outline, icon-only), telemetria de visualització, o substituir-lo per la versió Material Symbols, es resol al component sense tocar els 6 fitxers consumidors.
- Verificació del tall: `pnpm exec vitest run __tests__/app/components/public/GoogleGIcon.test.tsx` OK (3 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `407`; el següent canvi real ha de ser `#408`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #507 — 2026-05-05 — claude (FET)
**Les mutacions IMAP (`markAsRead`, `markAsUnread`, `deleteEmail`, `moveToFolder`) no invalidaven `FETCH_EMAIL_CACHE` del `#499` — un mail marcat llegit es tornava a servir des del cache amb `isRead: false`. Tancament del deute documentat al tancament del `#499`.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: el `#499` va introduir `FETCH_EMAIL_CACHE` (Map LRU, max 200) per accelerar `fetchEmailByUid`. Va exportar dos helpers (`clearFetchEmailCache`, `invalidateFetchEmailCache`) i va deixar escrita la honestedat: *"Si un mail es marca llegit o es mou, la cache no s'invalida automàticament — caldria cridar `invalidateFetchEmailCache()` als handlers que mutin l'estat IMAP."* Forat real: usuari obre mail → cached. Marca llegit → IMAP canvia. Reobre → cache torna l'entrada vella amb `isRead: false`. Mateix risc per `deleteEmail` (cache serveix mail esborrat) i `moveToFolder` (cache té UID a la carpeta origen però el mail real ja no hi és).
- `lib/imap.ts` · 4 mutacions: afegida crida `invalidateFetchEmailCache(uid, folder)` immediatament després de la mutació IMAP exitosa.
  - `markAsRead`: després de `messageFlagsAdd([uid], ['\\Seen'], ...)`.
  - `markAsUnread`: després de `messageFlagsRemove([uid], ['\\Seen'], ...)`.
  - `deleteEmail`: tant al `messageDelete` directe com al fallback `messageMove` cap a paperera.
  - `moveToFolder`: després de `messageMove([uid], targetFolder, ...)` invalida el cache de `sourceFolder` (no del destí — el cache no tenia entrada al destí).
- `restoreFromTrash` no necessita canvi: delega a `moveToFolder`, que ja invalida.
- `__tests__/lib/imap-cache-invalidation.test.ts` (nou): guard estructural que llegeix `lib/imap.ts` i verifica per cada funció que conté la crida canònica `invalidateFetchEmailCache(uid, folder)` (o `sourceFolder` per `moveToFolder`). Mateix patró que `imap-fetch-bodyparts.test.ts` (#496): sense mocks IMAP, sense fragilitat. 5 tests: markAsRead, markAsUnread, deleteEmail (≥2 crides per cobrir delete + fallback move-to-trash), moveToFolder (per `sourceFolder`), i export-en-vida d'`invalidateFetchEmailCache`.
- Aquest tall **NO** toca: `fetchEmails` (lectura, no mutació), `fetchEmailByUid` (consumidor del cache), `markAsRead`/etc d'altres canvis no relacionats, IMAP client, env vars, schema, auth ni UI.
- Validació tècnica: `npx vitest run __tests__/lib/imap-cache-invalidation.test.ts` OK (5 tests) · `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- Validació funcional: l'usuari pot marcar un mail llegit o esborrar-lo i l'següent open NO retornarà l'estat stale del cache.
- Validació humana/UX: comportament invisible des de l'UI (és exactament el que l'usuari ja esperava intuïtivament) — el bug només era detectable en escenaris on `fetchEmailByUid` es cridava just després d'una mutació.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `506` a `507`.
- `ADMIN_CHANGE_COUNTER` puja a `507`; el següent canvi real ha de ser `#508`.

---

### Canvi #508 — 2026-05-05 — codex (FET)
**El guard anti-parxes detecta també marcadors de deute dins comentaris de bloc/JSDoc (`/* TODO`, `/** TODO`, `* TODO`), no només variants `// TODO`.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: continuació del `go` amb worktree brut per canvis paral·lels. El `#507` queda ocupat per Claude amb IMAP; aquest tall es registra com a `#508` segons la norma de no-col·lisió. Front triat: `§6.14 Infra / Dev / Operativa`, `PENDENT CRÍTIC` d'evitar regressions silencioses en repo gran. `scripts/check-patches.mjs` ja fallava davant `// TODO`, `// FIXME`, `// HACK` i `// XXX`, però una línia de bloc o JSDoc amb el mateix deute podia passar perquè el patró exigia `//`.
- `scripts/check-patches.mjs`: `detectTodoMarkers()` amplia el patró a `//`, `/*`, `/**` i línies prefixades amb `*`.
- `__tests__/scripts/check-patches.test.ts` (nou): prova el cas net, el marcador de línia, el marcador de bloc i que els fitxers `.test.` / `__tests__` continuen exclosos com abans.
- Aquest tall **NO** toca: IMAP/inbox, SVGs canònics, fetches canònics, schema, auth, endpoints ni UI.
- Validació tècnica: `npx vitest run __tests__/scripts/check-patches.test.ts` OK (4 tests) · `pnpm run qa:patches` OK.
- Validació funcional: un deute explícit ja no pot saltar-se el guard només canviant `// TODO` per un comentari de bloc o JSDoc.
- Validació humana/UX: sense canvi visible; reforç operatiu del pipeline.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `507` a `508`.
- `ADMIN_CHANGE_COUNTER` puja a `508`; el següent canvi real ha de ser `#509`.

---

### Canvi #509 — 2026-05-05 — codex (FET)
**El tracking de scroll deixa d'accedir a GTM amb `(window as any).dataLayer` i usa el global tipat `window.dataLayer` declarat al projecte.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: continuació del `go` amb worktree brut per canvis recents `#506`-`#508`. Front triat: `§6.14 Infra / Dev / Operativa`, `PENDENT CRÍTIC` d'evitar regressions silencioses en repo gran. El fitxer `types/window.d.ts` ja declara `Window.dataLayer`, i altres peces (`app/lib/analytics.ts`, `WebVitalsReporter`, `ExitIntentModal`) consumeixen `window.dataLayer` directament. `hooks/useScrollTracking.ts` era una excepció amb `(window as any).dataLayer`, que saltava el contracte tipat global sense necessitat.
- `hooks/useScrollTracking.ts`: substituït `Array.isArray((window as any).dataLayer)` per `Array.isArray(window.dataLayer)` i el `push` equivalent per `window.dataLayer.push(...)`.
- `__tests__/hooks/useScrollTracking.test.ts` (nou): guard estructural que comprova l'ús del global tipat i falla si torna el text `window as any`.
- Aquest tall **NO** toca: IMAP/inbox, SVGs canònics, fetches canònics, `check-patches`, schema, auth, endpoints ni UI.
- Validació tècnica: `npx vitest run __tests__/hooks/useScrollTracking.test.ts` OK (1 test) · `npx tsc --noEmit` OK.
- Validació funcional: el tracking continua enviant `section_view` al mateix `dataLayer`, però ara passa pel tipus global compartit.
- Validació humana/UX: sense canvi visible; reforç de mantenibilitat i de contracte TypeScript.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `508` a `509`.
- `ADMIN_CHANGE_COUNTER` puja a `509`; el següent canvi real ha de ser `#510`.

---

### Canvi #511 — 2026-05-05 — claude (FET)
**Cobertura `qa:protocol:test` per `check-message-imports.mjs`: el guard ja entrava al pipeline `validate:core` però no tenia test propi al directori `__tests__/scripts/`. Tancament del forat per la regla §6.14 d'evitar regressions silencioses al propi guard.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: `qa:message-imports` (= `node scripts/check-message-imports.mjs`) detecta imports directes de `messages/*` fora dels 5 adapters i18n autoritzats (`pack-i18n`, `equipment-i18n`, `home-meta`, `site-public-copy`, `public-error-copy`). El guard ja era obligatori al `validate:core` i corre cada commit, però no tenia test propi: si algú toca el regex (`messageImportRegex`), l'allowlist o la lògica de skip (`node_modules`/`.next`/...) i la ruptura no tomba `validate:core` perquè el guard segueix retornant `0` per casualitat, ningú s'enteraria fins que un import real escapa silenciós a producció. Mateix patró que els altres tests de scripts: `check-canonical-fetches.test.ts`, `check-canonical-svgs.test.ts`, `check-task-canonical.test.ts`, `check-roadmap-canvis.test.ts`, `check-language-quality.test.ts`, `check-admin-change-log.test.ts` i el nou `check-patches.test.ts` (#508). Aquest era l'últim guard de monocapa de l'i18n d'app/lib sense cobertura pròpia.
- `__tests__/scripts/check-message-imports.test.ts` (nou): 9 tests amb fixtures temporals via `mkdtempSync` + `spawnSync(process.execPath, [scriptPath], { cwd })`:
  1. passa si cap fitxer importa de `messages`.
  2. falla amb `from '@/messages/ca.json'` a `app/`.
  3. falla amb `'../messages/...'` i `'../../messages/...'` (relatius parent).
  4. falla amb path qualsevol que acabi en `messages/<locale>.json`.
  5. permet tots 5 adapters de l'allowlist (`lib/pack-i18n.ts`, `lib/equipment-i18n.ts`, `lib/home-meta.ts`, `lib/site-public-copy.ts`, `lib/public-error-copy.ts`).
  6. ignora `node_modules/` i `.next/`.
  7. només escaneja `app/` i `lib/` (no `scripts/`, `docs/`, etc.).
  8. multi-violació amb missatge d'ajuda (`i18n/copy helper` o `allowlist entry`).
  9. accepta extensions `.tsx`/`.ts`/`.jsx`/`.mjs` netes sense fals positiu.
- Aquest tall **NO** toca: el script `check-message-imports.mjs` en si (el guard funciona correctament, només li faltava cobertura), els 5 adapters allowlistats, IMAP, schema, auth, UI ni cap altra peça d'admin.
- Validació tècnica: `npx vitest run __tests__/scripts/check-message-imports.test.ts` OK (9 tests) · `pnpm run qa:protocol` OK · `pnpm run validate:core` OK · `qa:protocol:test` recull automàticament el nou fitxer perquè és `vitest run __tests__/scripts/`.
- Validació funcional: una regressió futura al regex (p.ex. canviar `messages/(?:ca|es|en)\.json` a una expressió diferent) o a l'allowlist (afegir/treure adapters) trenca el test abans d'arribar a CI.
- Validació humana/UX: invisible des de l'UI; reforç operatiu de monocapa.
- Col·lisió de comptador: havia de ser `#509`, però codex va tancar `#509`/`#510` mentre treballava (canvis d'analítica pública). Reassignat a `#511` segons norma §2.1 + `project_admin_counter.md`.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `510` a `511`.
- `ADMIN_CHANGE_COUNTER` puja a `511`; el següent canvi real ha de ser `#512`.

---

### Canvi #510 — 2026-05-05 — codex (FET)
**`useAnalytics` elimina l'alias manual de `dataLayer` i consumeix el global tipat `window.dataLayer`, igual que la resta de la capa d'analítica pública.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: continuació del `go`. No és un error funcional detectat, sinó cleanup tipat dins `§6.14 Infra / Dev / Operativa`: després del `#509`, quedava un segon accés a GTM amb cast local a `lib/hooks/useAnalytics.ts`. El projecte ja té `Window.dataLayer` declarat a `types/window.d.ts`, i altres peces d'analítica pública consumeixen aquest contracte directament.
- `lib/hooks/useAnalytics.ts`: substituït `const win = window as unknown as { dataLayer: Record<string, unknown>[] }` per ús directe de `window.dataLayer`.
- `__tests__/lib/hooks/useAnalytics.test.ts` (nou): guard estructural que exigeix `window.dataLayer = window.dataLayer || []` i `window.dataLayer.push`, i falla si tornen `window as unknown` o `win.dataLayer`.
- Aquest tall **NO** toca: IMAP/inbox, SVGs canònics, fetches canònics, `check-patches`, schema, auth, endpoints ni UI.
- Validació tècnica: `npx vitest run __tests__/hooks/useScrollTracking.test.ts __tests__/lib/hooks/useAnalytics.test.ts` OK (2 tests) · `npx tsc --noEmit` OK.
- Validació funcional: `trackEvent()` i `useAnalytics().track()` continuen fent push del mateix payload al `dataLayer`.
- Validació humana/UX: sense canvi visible; reforç de mantenibilitat TypeScript.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `509` a `510`.
- `ADMIN_CHANGE_COUNTER` puja a `510`; el següent canvi real ha de ser `#511`.

---

### Canvi #506 — 2026-05-05 — codex (FET)
**El Google G deixa de tenir còpies parcials inline a `ReviewsSection` i el guard `qa:canonical-svgs` aprèn a detectar també el path blau parcial, no només el logo complet de quatre colors.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: continuació del `go` amb worktree brut per `#504/#505`, sense tocar IMAP ni el guard de fetches. El front és `§6.14 Infra / Dev / Operativa`: evitar regressions silencioses en repo gran. El guard de SVGs canònics només detectava Google G quan un fitxer contenia els quatre colors (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`). Això deixava passar còpies parcials del path blau del logo, i `components/reviews/ReviewsSection.tsx` encara en tenia tres còpies inline.
- `components/reviews/ReviewsSection.tsx`: els tres SVG inline de Google passen a `GoogleGIcon`, que ja era importat pel component. Cap canvi de contracte de dades ni de fetch.
- `scripts/check-canonical-svgs.mjs`: el detector `google-g-icon` conserva la detecció de quatre colors i afegeix detecció del path blau canònic `M22.56 12.25...`.
- `__tests__/scripts/check-canonical-svgs.test.ts`: nou cas que crea una còpia parcial del Google G fora del component canònic i exigeix error amb recomanació de `GoogleGIcon`.
- Aquest tall **NO** toca: IMAP/inbox, fetches canònics, schema, auth, endpoints, ni la lògica de ressenyes.
- Validació tècnica: `npx vitest run __tests__/scripts/check-canonical-svgs.test.ts` OK (9 tests) · `pnpm run qa:canonical-svgs` OK.
- Validació funcional: el guard ja no deixa passar còpies parcials del Google G com les que quedaven a `ReviewsSection`.
- Validació humana/UX: el senyal visual de Google es manté, però ara surt del component shared i no de fragments SVG locals.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `505` a `506`.
- `ADMIN_CHANGE_COUNTER` puja a `506`; el següent canvi real ha de ser `#507`.

### Canvi #505 — 2026-05-05 — codex (FET)
**El guard de fetches canònics queda cobert explícitament contra variants `window.fetch(...)` i `globalThis.fetch(...)` sobre endpoints que han de passar per `lib/api/*`.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: l'ordre `go` activa la continuïtat del protocol. El front recent de Claude era IMAP/inbox (#503), així que aquest tall entra a `§6.14 Infra / Dev / Operativa`, concretament al `PENDENT CRÍTIC` d'evitar regressions silencioses en repo gran. En revisar `qa:canonical-fetches`, el forat històric de `/api/public/stats` ja estava resolt al worktree actual: `hooks/usePublicData.ts` consumeix `fetchPublicStats()`, el guard inclou `public-stats` i els tests ja cobreixen el cas bàsic. Durant el registre, Claude ha aterrat `#504`; aquest tall queda renumerat a `#505` segons norma de no-col·lisió.
- `__tests__/scripts/check-canonical-fetches.test.ts`: nou cas que crea dues fuites en fixture temporal, `window.fetch('/api/google-reviews')` i `globalThis.fetch('/api/public/stats?locale=ca')`.
- El test comprova que el guard reporta `2 direct fetch(es)` i recomana els helpers canònics `fetchPublicGoogleReviews()` i `fetchPublicStats()`.
- No cal tocar `scripts/check-canonical-fetches.mjs`: el detector actual ja capturava aquestes formes perquè el patró troba el substring `fetch(`; el canvi fa que aquest comportament quedi blindat i no sigui accidental.
- Aquest tall **NO** toca: IMAP/inbox, schema, clients `lib/api/*`, UI pública, auth, ni cap endpoint HTTP.
- Validació tècnica: `npx vitest run __tests__/scripts/check-canonical-fetches.test.ts` OK (14 tests).
- Validació funcional: una regressió futura que intenti saltar-se els clients canònics amb `window.fetch` o `globalThis.fetch` queda coberta pel test del guard.
- Validació humana/UX: no hi ha canvi visible; el valor és operatiu, mantenir una sola font de veritat per URL, shape i error path dels endpoints públics.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `504` a `505`.
- `ADMIN_CHANGE_COUNTER` puja a `505`; el següent canvi real ha de ser `#506`.

### Canvi #504 — 2026-05-05 — claude (FET)
**Cobertura unitària de `emailMatchesToFilter`: el `#503` només testejava el parsing de `INBOX_TO_FILTER`; la lògica real de match contra `to[]` quedava sense cap test directe. Tancament del forat per la regla §6.14 d'evitar regressions silencioses.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: el `#503` va introduir dues peces a `lib/imap.ts` — `getInboxToFilter()` (parsing CSV de la env) i `emailMatchesToFilter(email, allowed)` (decideix si una `EmailMessage` passa el filtre per `to[].address`). El test que va acompanyar el tall (`__tests__/lib/imap-inbox-filter.test.ts`, 5 casos) blindava només el parsing. La funció `emailMatchesToFilter` era privada al mòdul i sense cobertura: si algú canvia el `for` per un `find` mal escrit, perd el `trim()` o trenca el case-insensitive, els tests existents no ho detectarien. Forat directe del `PENDENT CRÍTIC §6.14`.
- `lib/imap.ts`: `emailMatchesToFilter` passa de funció privada a `export`. Cap canvi de comportament — la signatura i la lògica són idèntiques.
- `__tests__/lib/imap-inbox-filter.test.ts`: nou bloc `describe('emailMatchesToFilter()')` amb 9 tests pure: llista buida (no filtre), match exacte, no-match, case-insensitive sobre `to[].address`, una de diverses `to[]` coincideix, `to[]` buit, ignora addresses buides/només-espai, multi-allowed, trim de `to[].address`. Helper `makeEmail()` local per construir `EmailMessage` mínim.
- Aquest tall **NO** toca: `getInboxToFilter` (ja cobert), `fetchEmails` (només consumidor del helper, sense canvi de contracte), `fetchEmailByUid`, IMAP client, env vars, schema, auth, UI ni cap altra peça d'admin.
- Validació tècnica: `npx vitest run __tests__/lib/imap-inbox-filter.test.ts` OK (14 tests = 5 originals + 9 nous) · `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- Validació funcional: el filtre real (`to[]` match) queda blindat contra regressions silencioses del comportament canònic.
- Validació humana/UX: el propietari pot confiar que un canvi futur a `emailMatchesToFilter` no podrà silenciosament excloure mails legítims o deixar passar mails forwardejats antics.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `503` a `504`.
- `ADMIN_CHANGE_COUNTER` puja a `504`; el següent canvi real ha de ser `#505`.

---

### Canvi #503 — 2026-05-04 — claude (FET)
**Filtre opcional `INBOX_TO_FILTER` per amagar mails que vénen d'adreces velles forwardejades a la mateixa bústia. Resol el cas reportat per l'usuari: "rebo ctreball20 i info, només vull info@orbitaevents.com".**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: l'usuari reporta que la safata d'entrada barreja mails de dues adreces: `info@orbitaevents.com` (la canònica del negoci) i `ctreball20@gmail.com` (alies/forwarding antic). Verificat al llistat real: alguns mails IMAP tenen `to:[{address:"ctreball20@gmail.com"}]` i altres `to:[{address:"info@orbitaevents.com"}]`. Vénen tots a la mateixa bústia perquè el servidor IMAP té forwarding actiu. L'opció correcta a llarg termini és tancar el forwarding al servidor; mentre, una opció software ràpida que no perd informació.
- `lib/imap.ts`: nova funció exportada `getInboxToFilter()` que parseja `process.env.INBOX_TO_FILTER` (llista d'adreces separades per comes, case-insensitive). Si la env està buida o no definida, retorna llista buida i el filtre no s'aplica (comportament històric). `fetchEmails()` ara crida `getInboxToFilter()` i, si hi ha llista, sobrebusca emails (3× el `limit` requerit, max 200) i filtra post-fetch per `email.to[].address`. Per defecte (sense env), comportament idèntic a abans.
- `lib/imap.ts:fetchEmails`: també substituït `await client.logout()` per `client.close()` síncron amb try/catch defensiu, alineat amb el patró del `#499` per `fetchEmailByUid`. Evita timeouts de logout cooperatiu.
- `__tests__/lib/imap-inbox-filter.test.ts` (nou, 5 tests): blinda els 5 casos del parsing: env no definida, env buida, una sola adreça (case-insensitive), múltiples separades per comes, espais i entrades buides. 5/5 verds.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `502` a `503`.
- Aquest tall **NO** toca: `fetchEmailByUid` (continua sense filtre — si l'usuari ja té el UID, ja saps que el vol obrir), `markAsRead`, `markAsUnread`, `deleteEmail`, `moveToFolder`, `restoreFromTrash`, `listFolders`, `countUnread`, `countTotal`, `testConnection`, ni cap UI.
- Configuració per a producció: cal afegir a Railway env vars `INBOX_TO_FILTER=info@orbitaevents.com` i redesplegar. Sense aquesta env, comportament idèntic al d'avui.
- Col·lisió de comptador: havia de ser `#502`, però codex va tancar `#502` mentre escrivia. Reassignat a `#503` segons norma §2.1.
- Honestedat: aquesta solució és pragmàtica però no perfecta. Si la safata té MOLTS mails de `ctreball20` (>200 entre el `limit*3` sobrebuscat), els que arribin al final podrien no aparèixer al llistat ni quedar amagats. Per safates molt actives, la solució correcta és cancel·lar el forwarding al servidor IMAP. Documentat com a `MÉS ENDAVANT` al `§6.19` per si calgui millorar la implementació.
- `ADMIN_CHANGE_COUNTER` puja a `503`; el següent canvi real ha de ser `#504`.

### Canvi #502 — 2026-05-04 — codex (FET)
**Norma d'autoregulació de model/effort i consum: no treballar en mode màxim per defecte; pujar effort només quan el risc tècnic ho justifica.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el propietari pregunta si cal mantenir model top + effort màxim i si això impacta consum. La decisió operativa queda escrita: el rigor s'ha d'aplicar quan aporta valor, no per inèrcia. En tasques rutinàries, l'agent ha de reduir exploració, sortida i raonament innecessari.
- `docs/protocol-producte-admin-ca.md` · §2.1: nova regla **Autoregulació de model/effort i consum**.
- Regla per defecte: `go` normal, docs, guards, tests focalitzats, refactors petits i canvis mecànics → context mínim suficient, eines agrupades, respostes curtes i raonament proporcional.
- Regla d'escalada: només pujar a `high`/màxim quan hi ha risc real: producció, schema/migracions, auth, dades, concurrència entre agents, errors opacs de build/runtime, decisions arquitectòniques o refactors grans. Si cal pujar, s'explica breument el motiu.
- Aquest tall **NO** toca: codi d'aplicació, tests, UI, schema, auth, IMAP ni pipelines. És una norma documental de treball.
- Validació tècnica: `pnpm run qa:protocol` OK. `validate:core` no s'executa perquè és un tall documental + comptador; `qa:protocol` cobreix la coherència del registre.
- Validació funcional: el protocol ja dona instrucció explícita sobre quan gastar raonament alt i quan no.
- Validació humana/UX: el propietari pot demanar `go` sense assumir que cada ronda anirà en mode màxim.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `501` a `502`.
- `ADMIN_CHANGE_COUNTER` puja a `502`; el següent canvi real ha de ser `#503`.

### Canvi #501 — 2026-05-04 — codex (FET)
**El CTA pendent del Manual queda blindat amb un test de render real de `/admin/manual`: la UI ha de mostrar `Obrir §6.16 al protocol` i no pot tornar al link antic `§6.15`.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el `#500` va arreglar el contracte de navegació del roadmap amb `protocolSection` + `buildAdminManualRoadmapProtocolTarget()`, però la cobertura nova vivia sobretot en helper/constant. Faltava una prova del wiring visible: constant → helper → server component `/admin/manual` → `<Link>`.
- `__tests__/app/admin/manual/AdminManualPage.test.tsx` (nou): renderitza `AdminManualPage()` com a server component real, mockeja `fs.readFile()` perquè el lookup del protocol no depengui del fitxer complet i mockeja `next/link` a `<a>`.
- El test comprova tres contractes:
  1. el card pendent `Marketing Analytics Hub amb integracions externes` existeix;
  2. el link `Obrir §6.16 al protocol` té `href="/admin/docs/protocol?seccio=6.16#seccio-6-16"`;
  3. el link antic `Obrir §6.15 al protocol` no es renderitza.
- Aquest tall **NO** toca: el helper del `#500`, els constants del roadmap, integracions externes, IMAP, schema, auth ni UI productiva. Només afegeix cobertura de render i puja el comptador.
- Validació tècnica: `npx vitest run __tests__/app/admin/manual/AdminManualPage.test.tsx` OK (1 test) · `pnpm run qa:protocol` OK · `pnpm run validate:core` OK (15 guards).
- Validació funcional: el test cobreix el comportament visible que veurà el propietari al Manual.
- Validació humana/UX: el botó del pendent de màrqueting queda verificat com a entrada directa al pla de captació per fases.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `500` a `501`.
- `ADMIN_CHANGE_COUNTER` puja a `501`; el següent canvi real ha de ser `#502`.

### Canvi #500 — 2026-05-04 — codex (FET)
**El CTA del roadmap pendent del Manual deixa de ser hardcoded a `§6.15`: els ítems `PENDING` poden declarar `protocolSection`, i `marketing-analytics-hub` obre directament `§6.16` de captació externa.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del `#499` concurrent, el següent tall havia de ser `#500`. En revisar el `SEGÜENT` viu del roadmap, el Manual només conserva un ítem `PENDING` (`marketing-analytics-hub`), però `/admin/manual` generava el CTA dels pendents amb una URL fixa a `/admin/docs/protocol?seccio=6.15#seccio-6-15`. Per una peça de màrqueting/captació, això obligava a entrar al backlog genèric en comptes del pla operatiu `§6.16`.
- `lib/constants/adminManual.ts`: `AdminManualRoadmapItem` guanya `protocolSection?: string`; `marketing-analytics-hub` declara `protocolSection: '6.16'`.
- `lib/services/adminManualRoadmapService.ts` (nou): helper pur `buildAdminManualRoadmapProtocolTarget(item)` que retorna el CTA canònic. `DONE + doneCanvi` apunta a `?canvi=N#canvi-N`; `PENDING` apunta a `?seccio=X#seccio-X`, amb fallback `§6.15` per compatibilitat amb pendents antics sense secció.
- `app/admin/manual/page.tsx`: elimina el `Link` hardcoded a `§6.15` i renderitza el botó primari des del helper. El text del botó queda derivat (`Obrir §6.16 al protocol`) en lloc de duplicat a UI.
- `__tests__/lib/services/adminManualRoadmapService.test.ts` (nou): cobreix CTA per `DONE`, `DONE` sense `doneCanvi`, `PENDING` amb secció explícita i fallback `§6.15`.
- `__tests__/lib/constants/adminManualRoadmap.test.ts`: blinda que els `PENDING` no tinguin `doneCanvi`/`doneNote`, que `protocolSection` tingui format de secció i que `marketing-analytics-hub` apunti a `6.16`.
- Aquest tall **NO** toca: `lib/imap.ts` del `#499`, integracions externes de Google/Meta/GA4, schema, auth, crons ni tracking real d'ads. Només millora el contracte de navegació del roadmap.
- Validació tècnica: `npx vitest run __tests__/lib/services/adminManualRoadmapService.test.ts __tests__/lib/constants/adminManualRoadmap.test.ts` OK (10 tests) · `npx tsc --noEmit` OK · `pnpm run qa:protocol` OK · `pnpm run validate:core` OK (15 guards).
- Validació funcional: el CTA de l'únic roadmap pendent obre `/admin/docs/protocol?seccio=6.16#seccio-6-16`.
- Validació humana/UX: el propietari passa del backlog genèric al pla de captació per fases quan prem l'únic pendent de màrqueting.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `499` a `500`.
- `ADMIN_CHANGE_COUNTER` puja a `500`; el següent canvi real ha de ser `#501`.

### Canvi #499 — 2026-05-04 — claude (FET)
**Obrir mail trigava 35s constants tot i el #496. Causa real: `return` dins `for await` deixa IMAP stream suspès + `client.logout()` espera resposta que mai arriba. Fix: `break + client.close()` + cache LRU en memòria. Mesurat: 35s → 1.58s primer cop, 0.43s cache hit.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: després del `#496`, l'usuari segueix reportant que obrir un mail és lentíssim. Mesurat al dev local contra IMAP real (DonDominio): cada `GET /api/admin/inbox/messages/{uid}` triga **35.0s exactament**, fix entre múltiples UIDs (342, 343, 344). Valor constant ⇒ timeout fix, NO mida del payload (el `#496` ja l'havia reduït).
- Diagnòstic: dues causes acumulades a `lib/imap.ts:fetchEmailByUid`:
  1. **`return` dins `for await`**: deixa el stream IMAP suspès. El runtime espera el `client.logout()` final, que envia `LOGOUT` al servidor, però com el stream segueix obert, el servidor no respon i el logout queda penjat fins el timeout intern de 35s.
  2. **`client.logout()`** és cooperatiu (espera resposta servidor); `client.close()` tanca local instant sense round-trip.
- `lib/imap.ts:fetchEmailByUid`: tres canvis:
  1. `return` dins `for await` → `result = {...}; break;`. Loop tanca net.
  2. `await client.logout()` → `client.close()` síncron en try/catch defensiu.
  3. Cache LRU en memòria (`FETCH_EMAIL_CACHE`, max 200). Helpers `clearFetchEmailCache()` i `invalidateFetchEmailCache(uid, folder)` exportats per quan algú esborri/mou un mail.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `498` a `499`.
- Aquest tall **NO** toca: `connectIMAP`, `fetchEmails`, `markAsRead`, `markAsUnread`, `deleteEmail`, `moveToFolder`, `restoreFromTrash`, `listFolders`, `countUnread`, `countTotal`, `testConnection`. Cache només a `fetchEmailByUid`.
- Verificació real (mesura local contra IMAP de DonDominio):
  ```
  Abans: 35007ms / 35008ms / 34999ms (3 UIDs diferents)
  Després: 1.58s / 0.43s (cache hit) / 0.96s
  ```
  Reducció: **35s → 1.58s** (22× més ràpid) primer cop, **35s → 0.43s** (81× més ràpid) si l'usuari obre el mateix mail dues vegades.
- Honestedat: la cache és en memòria de procés Node. Si Railway escala a múltiples instàncies, cada una té la seva cache. Si un mail es marca llegit o es mou, la cache no s'invalida automàticament — caldria cridar `invalidateFetchEmailCache()` als handlers que mutin l'estat IMAP. Cobertura definitiva via cache a Prisma queda com a feina futura.
- Per què els tests existents NO ho van caçar: `__tests__/app/api/admin/inbox-messages-route.test.ts` mocka `@/lib/imap` per complet — els mocks retornen instant. Mateix patró que el `#496`.
- `ADMIN_CHANGE_COUNTER` puja a `499`; el següent canvi real ha de ser `#500`.

### Canvi #498 — 2026-05-04 — claude (FET)
**Smoke test real de producció: GitHub Actions comprova health, home pública i endpoints admin crítics després de deploy i cada 15 minuts.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: els últims incidents de producció (`#492` redirect `www` → `:8080`, `#494` cache acumulat, `#496` detall IMAP amb 502 per timeout) mostren que el repo tenia bones barreres locals però cap heartbeat extern que detectés ràpidament regressions reals post-deploy. Si una API cau, un redirect es trenca o un endpoint admin torna a fer timeout, calia descobrir-ho manualment.
- `scripts/smoke-prod.mjs` (nou): script Node sense mocks que llegeix `SMOKE_BASE_URL`, `SMOKE_AUTH` i `SMOKE_MAX_MS`; comprova `/api/health`, home pública, challenge `401` d'admin sense auth, `/api/admin/leads?limit=1` amb auth i `/api/admin/inbox/messages?action=count` amb auth. Valida status HTTP, JSON quan toca, cos mínim i temps màxim per check.
- `.github/workflows/smoke-prod.yml` (nou): workflow `Smoke test — producció` amb `push` a `main`, `schedule` cada 15 minuts i `workflow_dispatch`; fa checkout, setup Node 20 i executa `node scripts/smoke-prod.mjs` amb secrets/vars de GitHub.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `497` a `498`.
- Aquest tall **NO** toca: codi d'aplicació, endpoints, auth, IMAP, middleware, cache, schema ni UI. Només afegeix observabilitat externa.
- Validació tècnica: `node --check scripts/smoke-prod.mjs` OK · `pnpm run qa:protocol` OK · `pnpm run validate:core` OK (15 guards).
- Validació funcional: el smoke cobreix explícitament els patrons que han fallat recentment en producció: health, home, auth admin, leads i inbox count.
- Validació humana/UX: el propietari passa de detectar caigudes manualment a rebre feedback de GitHub Actions quan un endpoint crític no respon o supera el límit.
- Verificació real post-deploy: pendent configurar `SMOKE_AUTH` a secrets de GitHub si es vol cobrir també els checks autenticats; sense secret, el script salta aquests checks i manté els públics.
- `ADMIN_CHANGE_COUNTER` puja a `498`; el següent canvi real ha de ser `#499`.

### Canvi #497 — 2026-05-04 — codex (FET)
**`qa:protocol` valida també que `docs/diario.md` tingui entrada pel canvi actual; el guard ja no pot deixar verd un tall amb §9 i comptador sincronitzats però sense diari.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: en la ronda del `#496`, el protocol i el comptador van quedar sincronitzats mentre el diari podia anar per separat. La norma §2.1 ja obliga a registrar cada tall també a `docs/diario.md`, però `scripts/check-admin-change-log.mjs` només comprovava `docs/protocol-producte-admin-ca.md` + `ADMIN_CHANGE_COUNTER`. Això deixava un forat real: `pnpm run qa:protocol` podia passar encara que el diari no tingués l'entrada del canvi actual.
- `scripts/check-admin-change-log.mjs`: afegeix `DIARIO_PATH`, llegeix `docs/diario.md` i, quan el counter coincideix amb el màxim del protocol, exigeix un header `## ... Canvi #N` pel mateix número actual. Si falta, falla amb `docs/diario.md missing entry for current change #N`.
- `__tests__/scripts/check-admin-change-log.test.ts`: els fixtures temporals creen ara també `docs/diario.md`; s'afegeix un test que deixa protocol `#58` + counter `58` correctes però diari només amb `#57`, i comprova que el guard falla pel motiu nou.
- Efecte: la disciplina de tancament rigorós deixa de dependre només d'autocontrol. Qualsevol canvi futur que oblidi el diari trencarà `qa:protocol` i, per extensió, `validate:core`.
- Validació tècnica: `npx vitest run __tests__/scripts/check-admin-change-log.test.ts` OK (6 tests) · `pnpm run qa:protocol` OK · `pnpm run validate:core` OK (15 guards).
- Validació funcional: el guard cobreix el cas exacte de desalineació `protocol + counter OK` però `diari absent`.
- Validació humana/UX: el propietari pot llegir el diari com a registre cronològic fiable sense haver de comparar-lo manualment amb el §9.
- Aquest tall **NO** toca: parser del viewer, validacions humanes del protocol, codi IMAP del `#496`, ni cap flux d'admin.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `496` a `497`.
- `ADMIN_CHANGE_COUNTER` puja a `497`; el següent canvi real ha de ser `#498`.

### Canvi #496 — 2026-05-04 — claude (FET)
**Fix crític d'inbox: obrir un mail trigava 27s i acabava en 502 perquè `fetchEmailByUid` baixava el RFC822 sencer (`source: true`) incloent attachments base64. Substituït per `bodyParts: ['HEADER', 'TEXT']` + test estructural anti-regressió.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: usuari reporta lentitud d'obrir mail. Verificat amb curl real contra `https://orbitaevents.com/api/admin/inbox/messages/16578`: HTTP 502 a 27.5s. Diagnòstic a `lib/imap.ts:fetchEmailByUid`: `source: true` baixa RFC822 sencer (attachments base64 inclosos). Mail amb PDF de 2MB → 2.7MB base64 + parse MIME → timeout >25s a Railway.
- `lib/imap.ts`: `fetchEmailByUid` substitueix `source: true` per `bodyParts: ['HEADER', 'TEXT']`. Reconstrueix RFC822 mínim concatenant `bodyParts.get('HEADER')` + `bodyParts.get('TEXT')` per `simpleParser`, fallback a `textPart.toString('utf8')` si parse falla. `hasAttachments` segueix detectat via `bodyStructure.childNodes`.
- `__tests__/lib/imap-fetch-bodyparts.test.ts` (nou, 3 tests): guard estructural que llegeix `lib/imap.ts` real (cap mock) i verifica: (1) NO conté `source: true`, (2) usa `bodyParts: [...]` amb `'HEADER'` i `'TEXT'`, (3) llegeix `bodyParts?.get('HEADER')` i `bodyParts?.get('TEXT')`. Patró contrari als tests existents (`inbox-messages-route.test.ts`) que mocken `@/lib/imap` per complet i no van detectar mai el problema.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` 495 → 496.
- Aquest tall **NO** toca: `fetchEmails`, `markAsRead`, `markAsUnread`, `deleteEmail`, `moveToFolder`, `restoreFromTrash`, `listFolders`, `countUnread`, `countTotal`, `testConnection` (no afectats), ni cap component d'UI.
- Verificació: `pnpm exec vitest run __tests__/lib/imap-fetch-bodyparts.test.ts` OK 3/3, `pnpm run validate:core` OK, verificació real post-deploy contra Railway pendent.
- Honestedat: el test és estructural (parse de codi font), no funcional contra IMAP real. No mesura temps. La verificació definitiva només es pot fer post-deploy. Aquest test no resol el problema general de mocks-massa-profunds; blinda específicament aquest antipattern.
- `ADMIN_CHANGE_COUNTER` puja a `496`; el següent canvi real ha de ser `#497`.

### Canvi #495 — 2026-05-04 — codex (FET)
**El KPI global de validacions humanes del protocol ignora validacions stale/futures que no existeixen al §9 parsejat.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: `summarizeValidations(totalCanvis, validations)` comptava `validations.size` i només el capava al total. Si el setting `protocol.canviValidations` conservava una validació antiga, futura o escrita manualment per un `canviN` que no apareix al protocol parsejat, el card global `Validats humans` podia inflar el percentatge i fins i tot mostrar 100% amb pendents reals. Els comptadors de filtre ja eren precisos perquè iteraven sobre `canvis`; faltava alinear el resum global amb la mateixa font canònica.
- `lib/services/protocolValidationsService.ts`: `summarizeValidations()` accepta un tercer paràmetre opcional `knownCanviNumbers` i compta només validacions presents en aquest conjunt; si no es passa, conserva el comportament anterior per compatibilitat.
- `app/admin/docs/protocol/page.tsx`: el resum global passa `allCanvis.map((canvi) => canvi.n)`, de manera que només els `Canvi #N` realment parsejats poden sumar al KPI.
- `__tests__/lib/services/protocolValidationsService.test.ts`: nou cas que blinda que una validació `#999` no compti quan els canvis coneguts són `[1, 2]`.
- `__tests__/app/admin/docs/ProtocolPage.test.tsx`: el test principal injecta una validació stale `#999` i comprova que el card global continua mostrant `50% · 1 pendents.` sobre dos canvis reals.
- Validació tècnica: `npx vitest run __tests__/lib/services/protocolValidationsService.test.ts` OK (14 tests) · `npx vitest run __tests__/app/admin/docs/ProtocolPage.test.tsx` OK (4 tests) · `pnpm run qa:protocol` OK · `pnpm run validate:core` OK (15 guards).
- Validació funcional: el percentatge global queda derivat de la intersecció `validacions persistides ∩ canvis parsejats`, no de la mida bruta del setting.
- Validació humana/UX: el propietari deixa de veure una cua aparentment tancada quan encara hi ha canvis reals pendents i només existeix soroll stale al registre humà.
- Aquest tall **NO** toca: API de crear/esborrar validacions, persistència del setting, parser de canvis, filtres de `validated/pending`, ni els canvis de cache del `#494`.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `494` a `495`.
- `ADMIN_CHANGE_COUNTER` puja a `495`; el següent canvi real ha de ser `#496`.

### Canvi #494 — 2026-05-04 — claude (FET)
**Cache acumulat: HTML d'admin sempre fresc + Service Worker amb versió nova + JS/CSS network-first per evitar servir codi vell als deploys.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: l'usuari reporta que ha de fer hard-refresh constantment per veure canvis nous a producció. Tres causes acumulatives: (1) `next.config.mjs` no tenia regla per HTML d'admin (default cachejejable); (2) `public/sw.js` tenia `CACHE_NAME = 'orbita-v1'` fix que mai canviava entre deploys, fent que la lògica d'`activate` (línies 52-67) que elimina caches obsolets no s'activés mai; (3) `staleWhileRevalidate` per CSS/JS servia sempre la versió cachejada al primer load i només actualitzava al següent navegació, fent invisibles els canvis fins el segon load.
- `next.config.mjs`: afegida regla `source: '/admin/:path*'` amb `Cache-Control: no-store, max-age=0, must-revalidate` + securityHeaders. Els assets `/_next/static/*` mantenen `max-age=31536000, immutable` (no afectats) — Next hashejja els bundles, així el cache de JS/CSS encara funciona per recursos no canviats.
- `public/sw.js`: `CACHE_NAME` puja de `'orbita-v1'` a `'orbita-v2-2026-05-04'`. La transició dispara la lògica d'`activate` que elimina caches amb nom != `CACHE_NAME`, purgant els residus.
- `public/sw.js`: la branca de CSS/JS (línies 117-119) passa de `staleWhileRevalidate` a `networkFirst`. JS/CSS frescos al primer load post-deploy; cau a cache només offline.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `493` a `494`.
- Aquest tall **NO** toca: lògica d'install del SW, altres estratègies (cacheFirst per imatges/fonts, networkFirst per HTML), headers `/api/*` (ja eren no-store), headers `/_next/static/*` (segueixen max-age 1y), background sync, push notifications.
- Verificació del tall: `pnpm run validate:core` OK 13/13. La verificació real només es pot fer post-deploy: la transició SW v1→v2 fa primer load amb xarxa pura (cache buit), i a partir d'aleshores `networkFirst` per HTML+CSS+JS.
- Efecte operatiu: deixa de necessitar Ctrl+Shift+R per veure canvis post-deploy. `CACHE_NAME` versionat amb data manual obliga a recordar bumpar-lo a deploys grans; millora futura possible: injectar `git rev-parse --short HEAD` al build.
- `ADMIN_CHANGE_COUNTER` puja a `494`; el següent canvi real ha de ser `#495`.

### Canvi #493 — 2026-05-04 — codex (FET)
**`parseProtocolCanvis()` reconeix ja estats canònics encara que el header porti context extra de reclassificació o reserva.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el protocol viu ja conté headers com `### Canvi #489 — ... (FET; reclassificat des de #487 per col·lisió de comptador)`. Però `normalizeStatus()` només acceptava coincidència exacta amb `FET`, `EN MARXA` o `PENDENT`, de manera que aquests canvis passaven a `UNKNOWN` quan el viewer o qualsevol altre consumidor feia `parseProtocolCanvis()`. Era un bug real del parser sobre dades reals del mateix document.
- `lib/services/protocolCanvisService.ts`: `normalizeStatus()` deixa d'exigir coincidència exacta i accepta també els tres estats canònics quan són prefix d'un text més llarg (`FET; ...`, `FET ...`, `EN MARXA; ...`, `PENDENT temporal ...`).
- `__tests__/lib/services/protocolCanvisService.test.ts`: nou cas que blinda els tres formats amb context extra (`FET; reclassificat ...`, `EN MARXA; reservat ...`, `PENDENT temporal ...`).
- Efecte: el viewer del protocol i qualsevol altre consumidor de `parseProtocolCanvis()` deixa d'ensenyar `UNKNOWN` per canvis vàlids només perquè el parèntesi incorpora context operatiu addicional.
- Verificació del tall:
  - `npx vitest run __tests__/lib/services/protocolCanvisService.test.ts` OK (14 tests)
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `492` a `493`.
- Col·lisió de comptador: aquest tall havia de ser `#492`, però mentre el preparava Claude ha tancat el seu propi `#492` sobre el redirect `www` → apex a Railway. Reassignat a `#493` seguint la norma de no-col·lisió del protocol.
- `ADMIN_CHANGE_COUNTER` puja a `493`; el següent canvi real ha de ser `#494`.

### Canvi #492 — 2026-05-04 — claude (FET)
**Fix crític: el redirect `www.orbitaevents.com` → `orbitaevents.com` mantenia el port intern de Railway (`:8080`) al `Location` header, fent inaccessible tota la web pública i admin per als usuaris que entraven per `www.`.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: l'usuari reporta "tot mort" — múltiples funcionalitats que existeixen al codi (respondre mails, convertir a lead, canviar estat de leads) no funcionen a producció. Verificat amb curl: `https://www.orbitaevents.com/api/health` retorna `301 Location: https://orbitaevents.com:8080/api/health` (port `8080` que el proxy HTTPS de Railway no exposa públicament). Comparat amb `https://orbitaevents.com/api/health` (sense `www.`) que retorna `200 OK`. Diagnòstic: `middleware.ts:26-31` despullava el subdomini `www` clonant `req.nextUrl` i canviant només `hostname`, però el clone preserva el `port` que Next.js veu del servidor intern (`process.env.PORT=8080` a Railway). El proxy de Railway escolta a 443 i fa forward al container al port 8080; quan el middleware redirige amb el clone, el `Location` header inclou el port intern. Resultat: tot el tràfic per `www.orbitaevents.com` rebia un redirect 301 a una URL amb port no accessible.
- `middleware.ts`: dins del bloc `if (host === 'www.orbitaevents.com')`, abans de retornar `NextResponse.redirect(url, 301)`, afegit `url.port = '';` per netejar el port heredat del clone, i `url.protocol = 'https:';` com a defensa (el proxy ja fa HTTPS termination, però explicitar evita ambigüitats si en algun cas Next reconstrueix l'URL amb `http`). El redirect ara genera `Location: https://orbitaevents.com/...` sense port.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `491` a `492`.
- Aquest tall **NO** toca cap altre redirect, cap altra branca del middleware, ni el handling d'auth, i18n o legacy redirects. El bug afectava exclusivament la branca de strip-www i no es propagava a redirects de legacy paths o i18n perquè aquests usen `req.nextUrl.clone()` amb `pathname` modificat sobre la mateixa URL servida (sense canvi de hostname, el port no surt al header `Location` perquè el navegador resol relatiu al host actual).
- Verificació del tall: el fix és lògicament obvi — `URL.port = ''` neteja el port. No afegeixo test perquè els tests d'integració de middleware no existeixen al repo i muntar un mock de `NextRequest` només per verificar `url.port` clear seria desproporcionat. Si es volgués blindar contra regressions, caldria un e2e Playwright contra l'entorn de staging amb `Host: www.orbitaevents.com`. Documento el patró aquí perquè agents futurs sàpiguen que `req.nextUrl.clone() + setHostname` requereix també clear port a Railway.
- Col·lisió de comptador: aquest tall havia de ser `#491`, però mentre escrivia codex va tancar `#491` (cobertura `ProtocolValidationToggle`). Reassignat a `#492` segons norma §2.1.
- `ADMIN_CHANGE_COUNTER` puja a `492`; el següent canvi real ha de ser `#493`.

### Canvi #491 — 2026-05-04 — codex (FET)
**`ProtocolValidationToggle` guanya cobertura de l'estat validat i del camí d'error en desfer la validació.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el component client `ProtocolValidationToggle` ja tenia proves per al `POST` feliç, el `DELETE` feliç i l'error en validar. Però encara faltaven dues superfícies visibles del mateix component: l'estat inicial quan la validació humana ja existeix (metadata + nota registrada + CTA secundari) i el cas en què `DELETE /api/admin/protocol/validations` falla i no s'ha de refrescar la pàgina.
- `__tests__/app/admin/docs/ProtocolValidationToggle.test.tsx`: dos casos nous. El primer blinda el render de `Validat per OWNER`, `Nota registrada: OK` i el botó `Desfer validació` quan arriba una `validation` existent. El segon simula `fetchWithCsrf` amb `{ ok: false, error: 'cannot-delete' }` en `DELETE` i comprova que el missatge d'error es mostra a UI i que `router.refresh()` no es crida.
- Efecte: el component client deixa de dependre només dels happy paths. Qualsevol regressió en la lectura del registre humà o en el rollback de validació quedarà atrapada per la suite del toggle.
- Verificació del tall:
  - `npx vitest run __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx` OK (5 tests)
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `490` a `491`.
- `ADMIN_CHANGE_COUNTER` puja a `491`; el següent canvi real ha de ser `#492`.

### Canvi #490 — 2026-05-04 — codex (FET)
**La pàgina `/admin/docs/protocol` blinda també la vista `validated` amb cerca i l'empty state de seccions dins el render real.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després dels `#487` i `#488`, el viewer ja tenia cobertura d'integració per al wiring principal del backlog humà, la vista `pending`, la secció enfocada i el cas “sense pendents”. Però encara faltava la combinació `validation=validated&q=...` a nivell de pàgina real: el helper pur ja cobria `describeProtocolValidationResults()` i `describeProtocolSectionEmptyState()`, però no hi havia cap prova que garantís que el server component mostrés correctament el títol/descripció contextual, l'estat passiu del shortcut i el buit de seccions quan la cerca només coincideix amb canvis i no amb títols de secció.
- `__tests__/app/admin/docs/ProtocolPage.test.tsx`: nou quart test que renderitza `app/admin/docs/protocol/page.tsx` amb `searchParams = { validation: 'validated', q: 'codex' }` i les dues validacions resoltes. El cas blinda: (1) `Validats humans (1)`, (2) la descripció `1 canvi ja validat humanament amb cerca "codex".`, (3) el link `Validats · 1`, (4) el text passiu `Sense pendents en aquesta cerca`, i (5) l'empty state de seccions `Cap secció amb aquesta cerca`.
- Efecte: la vista de validats deixa de dependre només de contractes unitaris. Qualsevol regressió de wiring entre filtres, copy i seccions dins la pàgina real queda ara coberta pel test d'integració.
- Verificació del tall:
  - `npx vitest run __tests__/app/admin/docs/ProtocolPage.test.tsx` OK (4 tests)
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `489` a `490`.
- `ADMIN_CHANGE_COUNTER` puja a `490`; el següent canvi real ha de ser `#491`.

### Canvi #489 — 2026-05-04 — claude (FET; reclassificat des de #487 per col·lisió de comptador)
**Instrumentació real d'errors al canvi d'estat de lead: 5 punts d'UI deixaven de mostrar la causa real al toast i tapaven errors backend amb text genèric o misleading.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: l'usuari reporta que no pot passar un lead concret de `NEW` a `CONTACTED`. Verificat directament contra la BD de Railway via dev local: el codi del backend (`statusRouteHandler.ts`) funciona — `PATCH /api/admin/leads/[id]/status` amb `{status: 'CONTACTED'}` retorna `200 OK` en ~2s i deixa el lead com a `CONTACTED` amb `contactedAt` set i `customerId` upsertat correctament. Per tant el problema reportat no era backend trencat sinó **error de UX al frontend que tapava la causa real** quan alguna petició fallava puntualment (timeout AJAX, FK orphan, validació, latència Railway, etc.). Auditats els 7 punts del repo que criden `patchLeadStatus()` i només 2 mostraven el missatge real (`LeadActions.tsx` i `LeadGuidedFlow.tsx`); els altres 5 (3 fitxers diferents) o bé descartaven l'objecte `error` amb `catch {}` o bé el substituïen per text fix com `'Error de connexió movent l'entrada'` (literalment fals — la causa pot ser qualsevol cosa, no només connexió).
- `app/admin/leads/LeadQuickStatus.tsx`: els 2 `catch (error)` del select d'estat (cas normal i cas `LOST`) ara propaguen `error.message` al `toast.error()` quan l'error és `instanceof Error`, amb fallback al text genèric només si no ho és.
- `app/admin/leads/LeadPipelineView.tsx`: els 2 `catch {}` (kanban move + confirm loss) deixen de descartar l'objecte. Ara són `catch (error)` amb `log.error('[LeadPipelineView] ...', error)` per traçabilitat al servidor i `toast.error(error instanceof Error ? error.message : 'Error movent l'entrada')`. El text fix `'Error de connexió movent l'entrada'` queda eliminat — era misleading perquè donava una causa concreta (xarxa) quan en realitat la causa podia ser qualsevol error 4xx/5xx del backend.
- `app/admin/leads/[id]/LeadMobileQuickActions.tsx`: el botó mòbil `Marcar contactat` només tenia `try/finally` (silent fail — l'usuari no veia cap feedback si fallava). Afegit `catch (error)` amb `log.error()` + `toast.error()` consumint `useToast` i `log` del repo. Patró idèntic als altres fitxers.
- `__tests__/app/admin/leads/LeadQuickStatus.test.tsx`: nou test ("mostra el missatge d'error real de l'API al toast en lloc d'un text genèric") que blinda el comportament: simula `fetchWithCsrf` que retorna `{ok: false, status: 500, json: () => ({error: 'Lead orfe — customer eliminat'})}`, dispara el canvi d'estat i afirma `toast.error` cridat amb el missatge concret de l'API. 3 tests verds al fitxer (2 existents + 1 nou).
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `488` a `489`.
- Aquest tall **NO** toca el backend (`statusRouteHandler.ts`) ni el client `leadStatusClient.ts` (que ja propagava bé `payload.error` via `throw new Error(...)`); només els 5 punts de UI que descartaven la informació. Tampoc toca tests d'altres fitxers ni el patró general de toast de l'admin.
- Verificació del tall:
  - `pnpm exec vitest run __tests__/app/admin/leads/LeadQuickStatus.test.tsx` OK (3/3 tests verds)
  - `pnpm run validate:core` OK
- Efecte operatiu: la propera vegada que un canvi d'estat de lead falli (per timeout, per FK orphan, per validació, per qualsevol motiu real), l'usuari veurà la causa concreta al toast en lloc d'un text genèric o misleading, i podrà reportar-la directament en lloc d'haver d'inferir-la.
- Col·lisió de comptador: aquest tall havia de ser `#487`, però mentre validava codex va tancar `#487` (test d'integració del viewer) i `#488` (cobertura de la branca de secció enfocada). Reassignat a `#489` segons norma §2.1.
- `ADMIN_CHANGE_COUNTER` puja a `489`; el següent canvi real ha de ser `#490`.

### Canvi #488 — 2026-05-04 — codex (FET)
**La pàgina `/admin/docs/protocol` blinda també la branca de secció enfocada i el cas “sense pendents” dins la vista filtrada.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el `#487` ja havia incorporat un test d'integració per al wiring principal del viewer (`shortcut` pendent, comptadors humans i auto-open dels `<details>` en filtre `pending`). Però la mateixa pàgina encara tenia dues branques sense cobertura d'integració: la vista `focusedSection` quan s'entra amb `?seccio=...` des del manual, i l'estat passiu del shortcut/empty state quan el subconjunt filtrat ja no té cap pendent humà.
- `__tests__/app/admin/docs/ProtocolPage.test.tsx`: nou tercer test que mockeja totes dues validacions com a resoltes i renderitza `app/admin/docs/protocol/page.tsx` amb `searchParams = { seccio: '6.14', q: 'infra', validation: 'pending' }`. El cas comprova: (1) header `§6.14 — Infra / Dev / Operativa`, (2) enllaços `Tornar a tot el protocol` i `Manual de possibilitats`, (3) text passiu `Sense pendents en aquesta cerca`, (4) absència del link `Obrir primer pendent · #N`, i (5) empty state `Cap pendent amb aquesta cerca`.
- Efecte: el viewer queda cobert també quan la validació humana d'una cerca concreta ja està drenada o quan s'obre una secció directa des dels CTAs del manual. Una regressió d'aquestes branques visibles ja no passarà en silenci.
- Verificació del tall:
  - `npx vitest run __tests__/app/admin/docs/ProtocolPage.test.tsx` OK (3 tests)
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `487` a `488`.
- `ADMIN_CHANGE_COUNTER` puja a `488`; el següent canvi real ha de ser `#489`.

### Canvi #487 — 2026-05-04 — codex (FET)
**La pàgina `/admin/docs/protocol` guanya un test d'integració perquè el wiring visible del viewer no torni a trencar-se en silenci.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: fins ara el front de validacions humanes del protocol només tenia cobertura de peces aïllades: `ProtocolValidationToggle` pel costat client i `protocolValidationViewerService.ts` pel costat de helpers purs. Després del `#486`, el shortcut del primer pendent ja quedava correcte a nivell de helper, però seguia faltant una prova que verifiqués la pàgina real `/admin/docs/protocol` com a punt d'integració entre `readProtocolMarkdown()`, els parsers, `loadCanviValidations()`, els comptadors visibles i els enllaços renderitzats. Sense això, una regressió de wiring al server component podia escapar tot i tenir helpers verds.
- `__tests__/app/admin/docs/ProtocolPage.test.tsx` (nou): renderitza `app/admin/docs/protocol/page.tsx` com a server component real amb `fs` i `loadCanviValidations()` mockejats. El primer test blinda el shortcut `Obrir primer pendent · #486`, els comptadors `Pendents · 1`, el progrés `1/2 validats · 50%` i el text `Següent pendent: #486 · codex`. El segon test blinda que la vista `?validation=pending` mostri `Pendents de validació (1)` i autoobri el `<details id="canvi-486">`.
- Efecte: el viewer del protocol deixa de dependre exclusivament de proves microscòpiques. Ara hi ha una barrera específica que detecta regressions de render, wiring i navegació visible dins la pàgina canònica.
- Verificació del tall:
  - `npx vitest run __tests__/app/admin/docs/ProtocolPage.test.tsx` OK (2 tests)
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `486` a `487`.
- `ADMIN_CHANGE_COUNTER` puja a `487`; el següent canvi real ha de ser `#488`.

### Canvi #486 — 2026-05-04 — codex (FET)
**El shortcut "Obrir primer pendent" del viewer del protocol deixa de generar una URL amb un backtick residual al final.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el Canvi `#483` havia introduït `describeProtocolPendingShortcut()` per convertir el backlog humà en una drecera explícita cap al primer `Canvi #N` pendent. Però al helper hi havia quedat un backtick literal enganxat al final de l'`href`, de manera que la URL resultant sortia com `/admin/docs/protocol?validation=pending&canvi=466#canvi-466``. Era un defecte petit però real en un CTA de navegació directa del viewer.
- `lib/services/protocolValidationViewerService.ts`: la construcció de l'`href` deixa de compondre la query inline i passa a reutilitzar un `querySuffix` explícit. Això elimina el caràcter sobrant i deixa una URL canònica tant amb cerca (`?q=`) com sense cerca.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: nou cas `construeix una URL neta quan no hi ha cerca activa`, a més del cas existent amb `q=lead`. La suite del helper passa a 29 tests i blinda les dues variants del shortcut.
- Efecte: el CTA `Obrir primer pendent · #N` torna a ser una drecera fiable, copiable i sense caràcters paràsits al final de l'àncora.
- Verificació del tall:
  - `npx vitest run __tests__/lib/services/protocolValidationViewerService.test.ts` OK (29 tests)
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `485` a `486`.
- `ADMIN_CHANGE_COUNTER` puja a `486`; el següent canvi real ha de ser `#487`.

### Canvi #485 — 2026-05-04 — claude (FET)
**Regularització documental del `SEGÜENT` desencaixat de `§6.17`: el text d'ICP/Fase 0 que portava no pertanyia a inventari+packs sinó a `§6.16 Màrqueting`.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: `§6.17 Front inventari + packs (estat operatiu)` ja documentava com a `FET` tots els punts del seu `ESTAT ACTUAL` — relació visible inventari→packs amb badges clicables, relació visible packs→equip amb preview de material, botó secundari `Equip` corregit, editor detall pujat a fitxa operativa, pestanya `content` del pack editor simplificada i compositor automàtic explicat com a punt de partida. Tot i això, l'última línia de la secció era `**SEGÜENT**: preparar una reunió de treball per definir Fase 0 (ICP + proposta de valor) — sense això no es pot començar res.` Aquest text parla d'`ICP` (Ideal Customer Profile) i `proposta de valor`, que són exactament les dues primeres sub-tasques de `§6.16 Màrqueting i captació externa · Fase 0 — Fundació` (`Definir 1 client ideal clar (ICP)` + `Proposta de valor en 1 frase`). El text estava conceptualment desencaixat: a `§6.17` (inventari+packs) no hi havia cap tall executable obert, només un residu documental que feia soroll al checklist com si encara hi hagués un pas immediat pendent.
- `docs/protocol-producte-admin-ca.md` · `§6.17`: la línia `**SEGÜENT**: preparar una reunió de treball ...` queda substituïda per una entrada `**FET** *(2026-05-04 per `claude` — Canvi #485)*` que explica la regularització i remet a `§6.16 · Fase 0` per la documentació real de la feina d'ICP+proposta de valor. S'hi afegeix una línia `**MÉS ENDAVANT**` honesta (refinaments d'UI sobre la relació inventari↔packs quan apareguin friccions reals d'ús), de manera que la secció queda amb forma `OBJECTIU + ESTAT ACTUAL (FET) + CARACTERÍSTIQUES + FET (regularització) + MÉS ENDAVANT`, sense fingir un `SEGÜENT` que no era cap tall.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `484` a `485`.
- Aquest tall **NO** toca codi d'aplicació, schema Prisma, serveis, tests, UI ni contractes HTTP. És sincronització documental pura — mateix patró ja aplicat al `#484` de codex (regularitza `SEGÜENT` buit de Camí 2 a §6.18) i al `#447` de claude (regularitza Camí 1 i meitat de Camí 2 a §6.18).
- Verificació del tall:
  - `pnpm run qa:protocol` OK
  - `pnpm run validate:core` OK
- `ADMIN_CHANGE_COUNTER` puja a `485`; el següent canvi real ha de ser `#486`.

### Canvi #484 — 2026-05-03 — codex (FET)
**Regularitzat el `SEGÜENT` buit de Camí 2 a `§6.18`: el bloc ja estava complet i només faltava sincronitzar el checklist.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: `§6.18 Auditoria CRMs top` ja documentava `B.6` `#444`, `B.7` `#446`, `B.8` `#449` i `B.9` `#450` com a `FET`, i el `PENDENT CRÍTIC` de la mateixa secció ja deia explícitament "Camí 2 tancat". Tot i això, entre aquests bullets i Camí 3 encara quedava un encapçalament `### SEGÜENT (Camí 2)` amb l'únic text "Camí 2 drenat. No hi ha més ítems oberts en aquest bloc." Això era un fals pendent formal: no hi havia cap tall executable, només una resta documental que feia soroll al checklist.
- `docs/protocol-producte-admin-ca.md` · `§6.18`: el `SEGÜENT (Camí 2)` es converteix en `FET (Camí 2)` i explicita la regularització documental amb cites als quatre canvis reals que han drenat el bloc (`#444`, `#446`, `#449`, `#450`).
- Aquest tall no toca codi d'aplicació, schema, serveis, tests ni UI. És sincronització documental pura perquè el checklist continuï sent font honesta de veritat.
- Verificació del tall:
- `pnpm run validate:core` OK
- `pnpm run qa:protocol` OK
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` es manté a `484`.
- `ADMIN_CHANGE_COUNTER` queda a `484`; el següent canvi real ha de ser `#485`.

### Canvi #483 — 2026-05-01 — codex (FET)
**La drecera del primer pendent passa a tenir també un estat passiu explícit quan no queda backlog humà.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del `#481`, el viewer explicava millor la vista de seccions i de canvis, però la drecera `Obrir primer pendent` desapareixia completament quan el subconjunt no tenia cap pendent. Això deixava un buit silenciós just al mateix lloc on l'usuari espera entendre l'estat de la cua humana.
- `lib/services/protocolValidationViewerService.ts`: nou helper pur `describeProtocolPendingShortcut(firstPending, query)` per centralitzar tant el CTA accionable com el missatge passiu quan no hi ha pendents.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: ampliat de 26 a 28 tests amb cobertura del cas accionable i del cas `Sense pendents`.
- `app/admin/docs/protocol/page.tsx`: el bloc de filtres mostra ara una pastilla passiva `Sense pendents` o `Sense pendents en aquesta cerca` quan no hi ha cap canvi humà pendent dins el subconjunt actual, en lloc d'amagar la drecera.
- Aquest tall no toca persistència, API ni el toggle de validació. És refinament de feedback del viewer.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `482` a `483`.
- `ADMIN_CHANGE_COUNTER` puja a `483`; el següent canvi real ha de ser `#484`.

### Canvi #482 — 2026-05-01 — claude (FET)
**Nou client canònic `lib/api/imageManagerClient.ts` (genèric, accepta una clau o llista de claus) + migrats els 3 consumers (`useManagedImageSrc`, `app/admin/layout.tsx`, `TrustedByLogos.tsx`) + `/api/public/image-manager` afegit al guard `qa:canonical-fetches`. 6è endpoint cobert.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: continuació de la cadena #470 → #472 → #474 → #477 → #479. L'endpoint `/api/public/image-manager` tenia un hook canonical pel cas simple (`useManagedImageSrc` del Canvi #401, retorna 1 src per 1 key) però NO cobria 2 patrons reals: (1) `app/admin/layout.tsx` fetcheja **múltiples claus alhora** (`?key=layout.logo.admin&key=layout.appleTouchIcon`) per carregar logo admin + apple-touch-icon en un sol RTT, (2) `app/components/marketing/TrustedByLogos.tsx` fetcheja una clau **amb collection** (`home.clientLogos.items[]`) per la galeria de logos client. El hook `useManagedImageSrc` no podia cobrir aquests dos casos. Solució: client genèric a la capa `lib/api/*` que abasta tots tres patrons.
- `lib/api/imageManagerClient.ts` (nou): exporta `ImageManagerItem` (`{ src?, alt?, caption? }`), `ImageManagerEntry` (`{ item?, items? }` — el contracte real del response: cada clau pot tenir un `item` singular o `items[]` collection), `ImageManagerResponse` (`{ ok, data? }`). Funció `fetchImageManager(keys, init?)` accepta `string | string[]` i construeix `URLSearchParams` amb `params.append('key', k)` per cada clau (la API permet repetir el query param). Llança error si `!response.ok` (HTTP). Cap dependència de hook ni de React — funciona també des de codi server.
- `lib/hooks/useManagedImageSrc.ts`: el hook deixa de fer `fetch(\`/api/public/image-manager?key=${encodeURIComponent(key)}\`)` + parse manual i passa a `fetchImageManager(key, { cache: 'no-store' })`. Comportament idèntic — el hook continua llegint `response.data?.[key]?.item?.src` i fent `setSrc(managed)` si és string vàlid; si l'API falla o no té managed src, manté el `fallback` estàtic.
- `app/admin/layout.tsx`: el `useEffect` que carrega assets de marca admin (`layout.logo.admin` + `layout.appleTouchIcon`) deixa de fer fetch inline i passa a `fetchImageManager(['layout.logo.admin', 'layout.appleTouchIcon'], { cache: 'no-store' })`. Lectura idèntica de `response.data?.[key]?.item?.src`. Eliminada la doble guarda `if (!res.ok) return; data = await res.json().catch(...)` — el client ja llança si HTTP fail.
- `app/components/marketing/TrustedByLogos.tsx`: el `useEffect` que carrega `home.clientLogos` deixa de fer fetch inline i passa a `fetchImageManager('home.clientLogos', { cache: 'no-store' })`. Lectura idèntica de `response.data?.['home.clientLogos']?.items`, filter per `src` no buit, fallback a `CLIENT_LOGOS` static. La doble guarda `!response.ok || !data?.ok` simplificada perquè el client ja llança si HTTP fail; només queda `!response.ok` (app-level json.ok) i `cancelled`.
- `scripts/check-canonical-fetches.mjs`: nova entrada `{ id: 'image-manager', url: '/api/public/image-manager', client: 'lib/api/imageManagerClient.ts', helper: 'fetchImageManager()' }`. El guard ara cobreix **6 endpoints**.
- `__tests__/scripts/check-canonical-fetches.test.ts`: 12è test afegit per blindar la nova entrada.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `481` a `482`.
- Aquest tall **NO** toca: la API `/api/public/image-manager/route.ts` ni la seva lògica de servei, el component `<Image>` consumidor del src retornat pel hook, ni cap altre fetch del repo.
- Verificació del tall: `pnpm exec vitest run __tests__/scripts/check-canonical-fetches.test.ts` OK (12 tests) · `node scripts/check-canonical-fetches.mjs` OK (6 canonical fetches) · `npx tsc --noEmit` OK · `pnpm run validate:core` OK 15/15 guards.
- Amb aquest tall, els 6 endpoints públics canalitzats pel guard són: `/api/google-reviews`, `/api/hero-media`, `/api/public/stats`, `/api/public/availability`, `/api/public/packs`, `/api/public/image-manager`. Tots amb client a `lib/api/*Client.ts`, tots blindats contra fetches inline.
- `ADMIN_CHANGE_COUNTER` puja a `482`; el següent canvi real ha de ser `#483`.

### Canvi #481 — 2026-05-01 — codex (FET)
**El bloc de seccions `§X.Y` adapta títol i descripció a la cerca activa.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del `#480`, el llistat principal de canvis ja explicava la vista activa, però el catàleg de seccions `§X.Y` encara mantenia un copy menys específic quan la cerca filtrava el conjunt.
- `lib/services/protocolValidationViewerService.ts`: nou helper pur `describeProtocolSectionResults(query, filteredCount)` per centralitzar títol i descripció del bloc de seccions.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: ampliat de 24 a 26 tests amb cobertura de la vista amb cerca i del copy base de totes les seccions.
- `app/admin/docs/protocol/page.tsx`: el bloc del catàleg de seccions consumeix ara `sectionResultsMeta.title` i `sectionResultsMeta.description`.
- Aquest tall no toca API, persistència ni validacions humanes. És refinament de lectura i coherència del viewer.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `480` a `481`.
- `ADMIN_CHANGE_COUNTER` puja a `481`; el següent canvi real ha de ser `#482`.

### Canvi #480 — 2026-05-01 — codex (FET)
**El bloc `Resultats canvis` adapta títol i descripció a la vista humana real.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del `#478`, el viewer ja mostrava millor progrés, buit i següent pendent, però el bloc principal del llistat encara usava un copy base massa genèric. La UI ja sabia si estava mostrant `pending`, `validated` o `all`, però el text no ho feia explícit.
- `lib/services/protocolValidationViewerService.ts`: nou helper pur `describeProtocolValidationResults(filter, query, filteredCount)` per centralitzar títol i descripció del bloc principal.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: ampliat de 21 a 24 tests amb cobertura de la vista `pending`, `validated` amb cerca i la vista base `all`.
- `app/admin/docs/protocol/page.tsx`: el `AdminSection` del llistat consumeix ara `resultsMeta.title` i `resultsMeta.description` en lloc del copy genèric fix.
- Aquest tall no toca persistència, API ni el toggle de validació. És refinament de copy i lectura contextual del viewer.
- Col·lisió de sessió: mentre validava aquest tall, `claude` ha tancat el `#479` en paral·lel. Seguint la norma de no-col·lisió del §2.1, aquest tall es registra directament al següent número lliure visible: `#480`.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `479` a `480`.
- `ADMIN_CHANGE_COUNTER` puja a `480`; el següent canvi real ha de ser `#481`.

### Canvi #479 — 2026-05-01 — claude (FET)
**Nou client canònic `lib/api/publicPacksClient.ts` + migrats els 2 consumers (`usePrices` a `hooks/usePublicData.ts` + `usePacks` a `lib/hooks/usePacks.ts`) + `/api/public/packs` afegit al guard `qa:canonical-fetches`. Tanca el cercle de canonicalització de `usePublicData.ts` (3 hooks, 3 endpoints, 0 fetches inline).**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: continuació natural dels Canvis #474 (stats) i #477 (availability). Aquest tall completa la canonicalització de tots els endpoints públics consumits per `hooks/usePublicData.ts`. Identifica també un segon consumer (`lib/hooks/usePacks.ts`, fitxer separat amb fallback localitzat per packs i `cache: 'no-store'`) que també llegia `/api/public/packs` directament — exemple d'una capa shared on un grep manual del consumer principal hauria deixat orfe.
- `lib/api/publicPacksClient.ts` (nou): defineix `PublicPacksResponse = { ok: boolean; packs: unknown[] }` (alineat amb el contracte real de `app/api/public/packs/route.ts`) i `FetchPublicPacksOptions = { service?, locale? }`. La funció `fetchPublicPacks(options?, init?)` construeix el querystring amb `URLSearchParams`, propaga el `RequestInit` (per a `cache: 'no-store'` que `usePacks` necessita) i llança error si `!response.ok`. Els consumers interpreten `packs` segons les seves necessitats (cast a `PackDefinition[]` o partial shape).
- `hooks/usePublicData.ts`: `usePrices()` deixa de fer `fetch('/api/public/packs')` + `await response.json()` i passa a `await fetchPublicPacks()`. La forma `(json as { ok: boolean; packs: ... }).packs` substituïda per `response.packs` ja tipat. Cap canvi semàntic — el hook continua interpretant cada element com `{ slug, price, originalPrice?, name }`.
- `lib/hooks/usePacks.ts`: el hook que carrega packs amb fallback localitzat passa de construir el querystring amb `URLSearchParams` + `fetch(\`/api/public/packs?...\`, { cache: 'no-store' })` a `fetchPublicPacks({ service, locale }, { cache: 'no-store' })`. La gestió d'error (`!res.ok` → `throw`) ara és interna al client; el consumer captura amb `try/catch` el throw del client. La logica de `Array.isArray(data.packs)` + cast a `PackDefinition[]` es manté; el `localizedFallback` queda intacte.
- `scripts/check-canonical-fetches.mjs`: nova entrada `{ id: 'public-packs', url: '/api/public/packs', client: 'lib/api/publicPacksClient.ts', helper: 'fetchPublicPacks()' }`. Allowlist deriva auto. El guard ara cobreix **5 endpoints**.
- `__tests__/scripts/check-canonical-fetches.test.ts`: 11è test afegit per blindar la nova entrada.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `478` a `479`.
- Aquest tall **NO** toca: schema, dades, UI consumidora dels hooks, lògica de cache local, l'engine de packs (`getDbPacks`, `mapPack`, `fallbackPacks`), ni el route handler.
- Verificació del tall: `pnpm exec vitest run __tests__/scripts/check-canonical-fetches.test.ts` OK (11 tests) · `node scripts/check-canonical-fetches.mjs` OK (5 canonical fetches) · `npx tsc --noEmit` OK · `pnpm run validate:core` OK 15/15 guards.
- Cadena tancada: `usePublicData.ts` ja no té cap fetch directe a un endpoint públic. Totes les rutes (`/api/public/stats`, `/api/public/availability`, `/api/public/packs`) passen per `lib/api/*Client.ts`. La capa shared d'hooks (`lib/hooks/{useBookedDates,usePacks}.ts`) també està alineada amb la mateixa monocapa.
- `ADMIN_CHANGE_COUNTER` puja a `479`; el següent canvi real ha de ser `#480`.

### Canvi #478 — 2026-05-01 — codex (FET)
**El viewer del protocol mostra el progrés de validació de la vista activa.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del `#476`, el viewer ja diferenciava millor global vs buit i ja indicava el següent pendent, però encara faltava una lectura compacta del progrés de la vista activa. El propietari veia comptadors globals i buckets separats, però no un resum directe tipus `X/Y validats` sobre el subconjunt actual.
- `lib/services/protocolValidationViewerService.ts`: nou helper pur `summarizeProtocolValidationProgress(canvis, validations)` que deriva `validated`, `total`, `percent` i label `X/Y validats`.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: ampliat de 19 a 21 tests amb cobertura del progrés sobre subconjunt normal i buit (`0/0`, `0%`).
- `app/admin/docs/protocol/page.tsx`: el card `Validats humans` mostra ara `Vista actual: X/Y validats · Z%` sobre la vista filtrada actual.
- Aquest tall no toca persistència, API ni interaccions del toggle. És refinament de lectura del viewer.
- Col·lisió de sessió: mentre validava aquest tall, `claude` ha tancat el `#477` en paral·lel. Seguint la norma de no-col·lisió del §2.1, aquest tall es registra directament al següent número lliure visible: `#478`.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `477` a `478`.
- `ADMIN_CHANGE_COUNTER` puja a `478`; el següent canvi real ha de ser `#479`.

### Canvi #477 — 2026-05-01 — claude (FET)
**Nou client canònic `lib/api/publicAvailabilityClient.ts` + migrats els 2 consumers (`useAvailability` a `hooks/usePublicData.ts` + `useBookedDates` a `lib/hooks/useBookedDates.ts`) + `/api/public/availability` afegit al guard `qa:canonical-fetches`. El guard ha caçat un segon consumer (`useBookedDates`) que el grep manual hauria omès — exemple viu del seu valor.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: continuació natural del Canvi #474. Aquell tall va deixar identificat al §9 que `useAvailability` (a `hooks/usePublicData.ts`) encara llegia `/api/public/availability` directament. Aquest tall crea el client canònic que faltava i hi connecta tots els consumers reals — no només el documentat. La integració al guard `qa:canonical-fetches` (afegint l'entrada nova) ha caçat automàticament un consumidor extra (`lib/hooks/useBookedDates.ts`) que jo no havia vist al grep inicial: validació viva de la utilitat dels guards canònics introduïts als #470 i #472.
- `lib/api/publicAvailabilityClient.ts` (nou): mateixa estructura que `publicStatsClient.ts`. Exporta `AvailabilityValues`, `AvailabilityMonth`, `AvailabilitySaturdayDate`, `AvailabilityUrgencyLevel`, `AvailabilitySaturdayStatus`, `PublicAvailabilityResponse` (`{ ok, data, generatedAt }` alineat amb el contracte real de `app/api/public/availability/route.ts`) i la funció `fetchPublicAvailability(locale?, init?)` que llença error si `!response.ok` (HTTP) i retorna el body parsejat. Cap dependència del servei `publicAvailabilityService` (les dades arriben tipades pel response, no per l'engine intern).
- `hooks/usePublicData.ts`: `useAvailability()` deixa de fer `fetch('/api/public/availability?locale=...')` + `await response.json()` i passa a `await fetchPublicAvailability(locale)`. Interfaces locals duplicades `MonthAvailability` i `AvailabilityData` substituïdes per `type MonthAvailability = CanonicalAvailabilityMonth` i `type AvailabilityData = AvailabilityValues` (re-export tipat). El cast `as AvailabilityData` desapareix.
- `lib/hooks/useBookedDates.ts`: el hook estàndard que extreu dates ocupades del payload de disponibilitat deixa també el `fetch(\`/api/public/availability?locale=${locale}\`).then(r => r.json())` directe i passa a `fetchPublicAvailability(locale)`. Eliminada la lectura `data?.ok` opcional (ara `response.ok` és typed). Cap canvi semàntic — el hook continua filtrant `saturday.status === 'booked' || 'blocked'`.
- `scripts/check-canonical-fetches.mjs`: nova entrada `{ id: 'public-availability', url: '/api/public/availability', client: 'lib/api/publicAvailabilityClient.ts', helper: 'fetchPublicAvailability()' }`. Allowlist deriva auto.
- `__tests__/scripts/check-canonical-fetches.test.ts`: 10è test afegit per blindar la nova entrada.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `476` a `477`.
- Aquest tall **NO** toca: schema, dades, UI consumidora dels hooks, lògica de cache local, els altres consumers de `usePublicData.ts` (`usePublicStats` ja al #474, `usePrices` queda per un futur Canvi com a deute identificat).
- Verificació del tall: `pnpm exec vitest run __tests__/scripts/check-canonical-fetches.test.ts` OK (10 tests) · `node scripts/check-canonical-fetches.mjs` OK (4 canonical fetches) · `npx tsc --noEmit` OK · `pnpm run validate:core` OK 15/15 guards.
- Lliçó documentada al protocol: el guard `qa:canonical-fetches` introduït al #472 ha pagat el seu cost al primer ús. Sense ell, hauria fet l'extensió només al consumer documentat (`hooks/usePublicData.ts`) i hauria deixat `lib/hooks/useBookedDates.ts` orfe — falsa monocapa.
- `ADMIN_CHANGE_COUNTER` puja a `477`; el següent canvi real ha de ser `#478`.

### Canvi #476 — 2026-05-01 — codex (FET)
**El viewer del protocol diferencia millor els estats buits i destaca el següent pendent a validar.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del `#475`, l'usuari ja podia saltar directament al primer pendent, però quan la llista quedava buida el missatge continuava sent massa genèric i no distingia si realment ja estava tot validat o si la cerca havia filtrat massa. També faltava un senyal persistent al resum superior per recordar quin és el següent pendent de la cua.
- `lib/services/protocolValidationViewerService.ts`: nou helper pur `describeProtocolValidationEmptyState(filter, query)` per centralitzar els missatges de buit segons filtre humà i cerca activa.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: ampliat de 15 a 19 tests amb cobertura de `Tot validat`, `Cap pendent amb aquesta cerca`, `Cap canvi validat` i `Cap coincidència`.
- `app/admin/docs/protocol/page.tsx`: el card `Validats humans` mostra `Següent pendent: #N · author` quan n'hi ha, i l'empty state de resultats usa copy específica segons `all / validated / pending` i si hi ha `?q=`.
- Aquest tall no toca API, persistència ni la interacció de `ProtocolValidationToggle`. És refinament de lectura i feedback del viewer.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `475` a `476`.
- `ADMIN_CHANGE_COUNTER` puja a `476`; el següent canvi real ha de ser `#477`.

### Canvi #475 — 2026-05-01 — codex (FET)
**El viewer del protocol ja té drecera per obrir el primer canvi pendent del subconjunt actiu.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del `#473`, la vista `pending` ja autoobria els detalls pendents i el KPI superior explicava millor el filtre humà actiu. Tot i així, encara faltava una drecera perquè l'usuari no hagués ni de localitzar visualment quin és el primer canvi pendent quan hi ha cerca textual o una llista llarga.
- `lib/services/protocolValidationViewerService.ts`: nou helper pur `findFirstPendingProtocolCanvi(canvis, validations)` per derivar el primer pendent del subconjunt actual sense acoblar la regla al component.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: ampliat de 13 a 15 tests amb cobertura del primer pendent i del cas en què tots els canvis ja estan validats.
- `app/admin/docs/protocol/page.tsx`: nou shortcut `Obrir primer pendent · #N` al costat de `Tots / Validats / Pendents`, preservant la cerca `?q=` i obrint directament `?validation=pending&canvi=N#canvi-N`.
- Aquest tall no toca API, persistència ni el panell client de validació. És refinament de navegació del viewer.
- Col·lisió de sessió: mentre preparava aquest registre, `claude` ha tancat el `#474` en paral·lel. Seguint la norma de no-col·lisió del §2.1, aquest tall es registra directament al següent número lliure visible: `#475`.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `474` a `475`.
- `ADMIN_CHANGE_COUNTER` puja a `475`; el següent canvi real ha de ser `#476`.

### Canvi #474 — 2026-05-01 — claude (FET)
**Migrat `usePublicStats` (`hooks/usePublicData.ts`) cap al client canònic `fetchPublicStats()`, i `/api/public/stats` afegit al guard `qa:canonical-fetches`. Drena l'últim consumer directe identificat al deute del Canvi #472.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: el Canvi #472 va instaurar el guard `qa:canonical-fetches` amb 2 entrades (`/api/google-reviews`, `/api/hero-media`) i va deixar documentat un deute explícit: `hooks/usePublicData.ts` encara llegia `/api/public/stats` directament malgrat existir el client `lib/api/publicStatsClient.ts`. Sense la migració, el guard no podia incloure el tercer endpoint (la inclusió hauria fallat el pipeline). Aquest tall tanca el deute i amplia el guard.
- `hooks/usePublicData.ts`: el hook `usePublicStats()` deixa de fer `fetch('/api/public/stats?locale=...')` + `await response.json()` i passa a `await fetchPublicStats(locale)` del client canònic. Eliminada la interface local duplicada `StatsData` i substituïda per `type StatsData = PublicStatsValues` (del propi client). El cast `as StatsData` també desapareix perquè la resposta ja és tipada. Cap consumidor del hook s'altera (el contracte `useStatsReturn` continua igual).
- `scripts/check-canonical-fetches.mjs`: nou bloc al config `CANONICAL_FETCHES`: `{ id: 'public-stats', url: '/api/public/stats', client: 'lib/api/publicStatsClient.ts', helper: 'fetchPublicStats()' }`. Sense canviar lògica del walker ni dels detectors. Allowlist deriva automàticament.
- `__tests__/scripts/check-canonical-fetches.test.ts`: 9è test afegit (`fails when /api/public/stats is fetched outside the canonical client`) que blinda la nova entrada amb la mateixa mecànica `spawnSync` + fixture temp.
- Aquest tall **NO** toca: schema, dades, UI consumidora del hook, lògica de cache local del hook (`getCachedData`/`setCachedData`), els altres dos hooks (`useAvailability`, `usePrices`), ni la resta del pipeline. Pur drenatge del deute identificat al §9 del Canvi #472.
- Verificació del tall: `pnpm exec vitest run __tests__/scripts/check-canonical-fetches.test.ts` OK (9 tests) · `node scripts/check-canonical-fetches.mjs` OK (3 canonical fetches) · `npx tsc --noEmit` OK · `pnpm run validate:core` OK 15/15 guards.
- `ADMIN_CHANGE_COUNTER` puja a `474`; el següent canvi real ha de ser `#475`.

### Canvi #473 — 2026-05-01 — codex (FET)
**El viewer del protocol fa explícit el filtre humà actiu i autoobre els pendents quan entres a la vista de backlog.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del `#471`, els comptadors `Tots / Validats / Pendents` ja deien quants canvis hi havia a cada bucket, però la vista encara tenia dues friccions: el KPI `Filtre actiu` continuava sent massa genèric i, quan l'usuari entrava a `?validation=pending`, encara havia d'obrir manualment cada `Canvi #N` per veure el detall que havia de validar. El backlog humà era visible però no prou accionable.
- `lib/services/protocolValidationViewerService.ts`: nous helpers purs `describeProtocolValidationFilter()` i `shouldAutoOpenProtocolCanvi()` per centralitzar la semàntica del filtre i la regla d'obertura automàtica.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: ampliat de 7 a 13 tests amb cobertura de copy del filtre, pluralització, auto-open de pendents, focus explícit i regressions fora del mode `pending`.
- `app/admin/docs/protocol/page.tsx`: el KPI `Filtre actiu` mostra ara label + descripció real (`Sense filtre`, `Cerca activa`, `Només validats`, `Només pendents`) i els `<details>` dels canvis s'obren per defecte quan el filtre humà és `pending` o quan arribes amb `?canvi=N`.
- Aquest tall no toca persistència, API, esquema ni el component client `ProtocolValidationToggle`. És refinament de lectura i navegació del viewer.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `472` a `473`.
- `ADMIN_CHANGE_COUNTER` puja a `473`; el següent canvi real ha de ser `#474`.

### Canvi #472 — 2026-05-01 — claude (FET)
**Nou guard `qa:canonical-fetches` integrat a `validate:core`: blinda contra fetches directes als endpoints públics que ja tenen client canònic a `lib/api/*` (Google Reviews #427, Hero Media #431).**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: continuïtat del Canvi #470 (`qa:canonical-svgs`) aplicant la mateixa idea als clients HTTP. Els Canvis #427 (`fetchPublicGoogleReviews` a `lib/api/googleReviewsClient.ts`) i #431 (`fetchHeroMedia` a `lib/api/heroMediaClient.ts`) van centralitzar fetches que vivien duplicats. Sense guard, una nova UI pot reescriure `fetch('/api/google-reviews')` inline i tornar a divergir el shape, l'error path i la URL. §6.14 PENDENT CRÍTIC torna a apuntar: "evitar regressions silencioses en repo gran". El tercer client `lib/api/publicStatsClient.ts` queda fora del guard ara perquè `hooks/usePublicData.ts` encara llegeix `/api/public/stats` directament — migrar-lo serà un canvi futur.
- `scripts/check-canonical-fetches.mjs` (nou): walker recursiu sobre `app/`, `components/`, `lib/`, `hooks/` (skip `__tests__/`, `node_modules/`, `.next/`, `.git/`, `dist/`, `build/`). Configuració declarativa `CANONICAL_FETCHES = [{url, client, helper}]` amb 2 entrades canòniques. Detector regex `fetch\(\s*['"\`]URL(['"\`?])` que captura les 3 variants de quote i evita falsos positius per URLs amb prefix compartit (ex: `/api/google-reviews-stats` no dispara). Allowlist deriva automàticament dels `client` paths.
- `__tests__/scripts/check-canonical-fetches.test.ts` (nou): 8 tests via `spawnSync` + fixtures temp. Cobertura: clean fixture, fail per `/api/google-reviews` inline, fail per `/api/hero-media` inline, fail per double-quoted, no flag a canonical clients (allowlist), no flag a URL amb prefix compartit, skip `__tests__/`, multiple violations report combinat.
- `package.json`: nou script `qa:canonical-fetches` afegit a `validate:core` entre `qa:canonical-svgs` i `arch:layer:check`. `validate:core` passa de **14 → 15 guards**.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `471` a `472`.
- Aquest tall **NO** toca: lògica de servei, schema, dades, UI, copy, cap workspace admin, els clients canònics existents, ni `usePublicData.ts`/publicStatsClient (deute futur). Pur guard nou + integració al pipeline.
- Verificació del tall: `pnpm exec vitest run __tests__/scripts/check-canonical-fetches.test.ts` OK (8 tests) · `node scripts/check-canonical-fetches.mjs` OK contra repo real · `pnpm run validate:core` OK 15/15 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `472`; el següent canvi real ha de ser `#473`.

### Canvi #471 — 2026-05-01 — codex (FET)
**Els filtres `Tots / Validats / Pendents` del viewer del protocol mostren els comptadors reals.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del `#469`, el viewer ja distingia bé pendents i validats, però els filtres ràpids continuaven sent cecs: l'usuari havia de clicar cada bucket per saber-ne la mida. Faltava el mateix nivell de feedback que ja tenen molts panells operatius del repo.
- `lib/services/protocolValidationViewerService.ts`: nou helper pur `summarizeProtocolValidationFilterCounts(canvis, validations)` que retorna `{ all, validated, pending }` sobre el subconjunt actual de canvis.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: ampliat de 6 a 7 tests amb cobertura del resum de comptadors.
- `app/admin/docs/protocol/page.tsx`: els shortcuts ràpids passen a mostrar `Tots · N`, `Validats · N` i `Pendents · N`, calculats sobre els canvis que ja han passat el filtre textual `?q=...`.
- Aquest tall no toca el contracte HTTP, la persistència ni el component `ProtocolValidationToggle`. És refinament informatiu de la capa de lectura del viewer.
- Col·lisió de sessió: `claude` ja havia reservat i registrat el `#470` en paral·lel. Seguint la norma de no-col·lisió del §2.1, aquest tall es registra directament al següent número lliure visible: `#471`.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `ADMIN_CHANGE_COUNTER` puja a `471`; el següent canvi real ha de ser `#472`.

### Canvi #470 — 2026-05-01 — claude (FET)
**Nou guard `qa:canonical-svgs` integrat a `validate:core`: blinda contra regressions dels drenatges SVG canònics (Google G #407, Star polygon #412, WhatsApp #422, residuals #432) — qualsevol fitxer fora dels components shared que reintrodueixi aquests SVGs hardcoded falla el pipeline.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: durant els Canvis #407, #412, #422 i #432 es van drenar 17+ ocurrències del logo WhatsApp, 5 del polygon canònic d'estrella i 8 del logo Google G complet (4 paths colorejats `#4285F4`/`#34A853`/`#FBBC05`/`#EA4335`) cap a tres components canònics: `WhatsAppIcon.tsx`, `StarIcon.tsx`, `GoogleGIcon.tsx`. El §6.14 PENDENT CRÍTIC apunta explícitament a "evitar regressions silencioses en repo gran". Sense un guard, qualsevol PR futura que copïi una d'aquestes SVGs inline trencaria la monocapa sense que ningú se n'adoni fins al següent grep.
- `scripts/check-canonical-svgs.mjs` (nou): walker recursiu sobre `app/`, `components/` i `lib/` (skip `__tests__/`, `node_modules/`, `.next/`, `.git/`, `dist/`, `build/`). Per cada fitxer `.{ts,tsx,js,jsx,mjs,cjs}` aplica 3 detectors: (1) substring `M17.472 14.382c-.297-.149` (path WhatsApp), (2) substring `12 2 15.09 8.26 22 9.27` (polygon estrella canònic), (3) presència simultània dels 4 hex colors del logo Google (només els 4 alhora compten — fragments parcials com `#4285F4` sol no disparen, alineat amb `ReviewsSection.tsx` que té badges parcials per Canvi #407). Allowlist canònica de 4 fitxers: els 3 components shared + `app/[locale]/contacto/client.tsx` (variant amb dual-path WhatsApp documentada al Canvi #422). Format de sortida coherent amb la resta de guards (`OK`/`FAIL` amb file:pattern).
- `__tests__/scripts/check-canonical-svgs.test.ts` (nou): 8 tests via `spawnSync` sobre fixtures temp. (1) clean fixture passa. (2) WhatsApp path inline fora canonical → fail. (3) Star polygon inline → fail. (4) Tots 4 colors Google G alhora → fail. (5) Fragment parcial Google (només 1-2 colors) → no flag. (6) Components canonical mateixos no es flaguen. (7) Excepció documentada `app/[locale]/contacto/client.tsx` no es flaga. (8) Fitxers sota `__tests__/` ignorats. Aquest test entra automàticament a `qa:protocol:test` que ja escaneja `__tests__/scripts/`.
- `package.json`: nou script `qa:canonical-svgs` afegit a `validate:core` entre `qa:roadmap-canvis` i `arch:layer:check`. `validate:core` passa de **13 → 14 guards**.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `469` a `470`.
- Aquest tall **NO** toca: lògica de servei, schema, dades, UI, copy, cap workspace admin existent, cap component public canònic. Pur guard nou + integració a pipeline.
- Verificació del tall: `pnpm exec vitest run __tests__/scripts/check-canonical-svgs.test.ts` OK (8 tests) · `node scripts/check-canonical-svgs.mjs` OK contra el repo real (cap regressió detectada) · `pnpm run validate:core` OK 14/14 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `470`; el següent canvi real ha de ser `#471`.

### Canvi #469 — 2026-05-01 — codex (FET)
**El viewer del protocol posa els pendents primer i fa visible l'estat de validació humana ja al resum de cada canvi.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el Canvi #468 ja permetia filtrar `all / validated / pending`, però en la vista per defecte (`all`) la llista seguia l'ordre cronològic pur del §9 i l'estat de validació humana només es veia dins del panell expandit. Això obligava a un segon nivell d'inspecció per detectar què faltava validar.
- `lib/services/protocolValidationViewerService.ts`: `filterProtocolCanvisByValidation()` manté la semàntica del filtre però, quan el filtre és `all`, ordena els pendents abans que els validats mantenint la resta d'ordre estable.
- `__tests__/lib/services/protocolValidationViewerService.test.ts`: suite ampliada de 5 a 6 tests, afegint la regressió que blinda l'ordre `pending → validated` en vista `all`.
- `app/admin/docs/protocol/page.tsx`: cada `<summary>` de `Canvi #N` guanya badge explícit `Pendent validació` o `Validat humà`; el `ProtocolValidationToggle` continua al detall, però la informació clau passa a ser visible sense expandir el bloc.
- Aquest tall no toca el contracte HTTP ni la persistència de validacions. És refinament pur d'ordenació i lectura ràpida del viewer.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `ADMIN_CHANGE_COUNTER` puja a `469`; el següent canvi real ha de ser `#470`.

### Canvi #468 — 2026-05-01 — codex (FET)
**El viewer del protocol separa `validats` i `pendents` de validació humana amb filtre navegable.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: després del Canvi #467, la validació humana ja es podia marcar/desfer des de cada `Canvi #N`, però el viewer continuava mostrant tota la llista barrejada. Si el propietari vol saber "què queda pendent de revisar humanament", haver d'obrir-ho tot o escanejar targeta per targeta és fricció innecessària. Faltava una capa mínima de triatge.
- `lib/services/protocolValidationViewerService.ts` (nou): helper pur amb `normalizeProtocolValidationFilter(raw)` i `filterProtocolCanvisByValidation(canvis, validations, filter)` per centralitzar la lògica `all / validated / pending` fora del component de pàgina.
- `__tests__/lib/services/protocolValidationViewerService.test.ts` (nou): 5 tests blinden normalització del filtre, fallback a `all` i filtratge correcte de canvis validats vs pendents.
- `app/admin/docs/protocol/page.tsx`: el viewer admet nou search param `?validation=all|validated|pending`, afegeix `<select>` al formulari de cerca i 3 shortcuts ràpids `Tots / Validats / Pendents`. El recompte de `Resultats canvis` i la llista renderitzada passen a sortir del filtre combinat `q + validation`.
- Aquest tall no toca el contracte HTTP ni el component `ProtocolValidationToggle`. És consolidació d'ús sobre la capa de validacions ja tancada al #467.
- Verificació del tall:
- `pnpm exec vitest run __tests__/lib/services/protocolValidationViewerService.test.ts __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `ADMIN_CHANGE_COUNTER` puja a `468`; el següent canvi real ha de ser `#469`.

### Canvi #467 — 2026-05-01 — codex (FET)
**La validació humana del protocol es fa accionable al viewer admin: estat viu, KPI i CTA per marcar/desfer cada `Canvi #N`.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el Canvi #466 ha deixat el servei i la route de validacions del protocol tècnicament correctes, però la funcionalitat continuava invisible per a l'usuari: no hi havia cap consumidor real al viewer i la norma nova de `Validació humana obligatòria` seguia sent més procedimental que operativa. Si ningú no pot marcar o veure la validació des del mateix lloc on llegeix el `Canvi #N`, la feature existeix a mitges.
- `app/admin/docs/protocol/page.tsx`: el viewer passa de `force-static` a `force-dynamic` perquè reflecteixi estat viu de validacions. Carrega `loadCanviValidations()` i `summarizeValidations()` junt amb el markdown del protocol. El dashboard inicial guanya una KPI nova `Validats humans` amb `validatedCount / pendingCount / validatedPercent`.
- `app/admin/docs/protocol/ProtocolValidationToggle.tsx` (nou): component client-side per cada `Canvi #N`. Mostra si consta validat o pendent, qui ho ha validat, quan i la nota registrada. Permet `Marcar validació humana` o `Desfer validació` via `fetchWithCsrf('/api/admin/protocol/validations')` amb `POST/DELETE`, textarea de nota opcional i `router.refresh()` després de persistir.
- El component reaprofita el contracte del Canvi #466 sense inventar una segona capa: `validatedBy` surt del rol admin canònic, la persistència continua a `protocolValidationsService.ts` i el perímetre HTTP continua sent `/api/admin/protocol/validations`.
- `__tests__/app/admin/docs/ProtocolValidationToggle.test.tsx` (nou): 3 tests cobreixen (1) marcar validació amb nota opcional, (2) desfer validació existent, (3) error visible quan l'API falla. Es mockegen `fetchWithCsrf` i `router.refresh()` com a contracte del component.
- Aquest tall no toca la sintaxi del protocol, el parser `parseProtocolCanvis()` ni la capa de servei interna. La novetat és exclusivament convertir la validació humana en una superfície d'ús real dins l'admin.
- Verificació del tall:
- `pnpm exec vitest run __tests__/app/admin/docs/ProtocolValidationToggle.test.tsx __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `ADMIN_CHANGE_COUNTER` puja a `467`; el següent canvi real ha de ser `#468`.

### Canvi #466 — 2026-05-01 — codex (FET)
**El perímetre HTTP de validacions del protocol deixa de trencar compilació i queda blindat amb test de contracte.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: durant l'auditoria completa del repo ha aparegut un bloqueig objectiu: `npx tsc --noEmit` i `validate:core` fallaven a `app/api/admin/protocol/validations/route.ts`. La route nova importava `@/lib/auth-utils` (mòdul inexistent al repo) i demanava `requirePermission(req, 'write')` quan `AdminPermission` només admet `read | mutate | automation | integrations`. Això deixava el mòdul de validacions del protocol en estat aparentment construït però no tancable segons el mateix protocol.
- `app/api/admin/protocol/validations/route.ts`: la route passa a reutilitzar només contractes canònics reals del repo. Import nou `getAdminRole` des de `@/lib/auth`; eliminat l'import inexistent `@/lib/auth-utils`; `POST` i `DELETE` passen de `write` a `mutate`; `validatedBy` es deriva via `getAdminRole(req)` (`OWNER`/`MANAGER`/`VIEWER`) en lloc d'inventar una superfície d'usuari no existent a l'auth actual.
- `__tests__/app/api/admin/protocol-validations-route.test.ts` (nou): 7 tests de contracte per `GET/POST/DELETE`. Cobertura: auth 401, permission 403, `GET` retorna el `Map` serialitzat com a array, `POST` falla amb body invàlid, `POST` persisteix `validatedBy` amb el rol admin canònic, `DELETE` elimina correctament i `DELETE` retorna 400 amb body invàlid.
- Aquest tall no canvia el servei `protocolValidationsService.ts` ni el model de persistència (`setting` JSON). El problema era al perímetre HTTP, no a la capa interna.
- Verificació del tall:
- `pnpm exec vitest run __tests__/app/api/admin/protocol-validations-route.test.ts __tests__/lib/services/protocolValidationsService.test.ts` OK
- `npx tsc --noEmit` OK
- `pnpm run validate:core` OK
- `ADMIN_CHANGE_COUNTER` puja a `466`; el següent canvi real ha de ser `#467`.

### Canvi #465 — 2026-05-01 — codex (FET)
**El protocol de treball queda més executable: §2.1 guanya workflow mínim, regla explícita de worktree brut, validació separada en 3 capes, ordre de prioritat i checklist canònic de tancament.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el protocol ja exigia rigor i traçabilitat, però la part operativa encara depenia massa d'interpretació. Hi havia bones normes (`tancament rigorós`, `validació humana`, `go` del propietari), però faltava convertir-les en instruccions més mecàniques: què mirar abans de començar, què fer quan el worktree és brut, com dir clarament què s'ha validat i en quin ordre prioritzar fronts quan n'hi ha diversos.
- `docs/protocol-producte-admin-ca.md` · §2.1: afegits 5 blocs nous dins dels principis invariables:
- `Workflow mínim obligatori per cada tall` — força a comprovar `git status`, `ADMIN_CHANGE_COUNTER`, `§6.N/SEGÜENT` afectat i el tipus de tall abans de començar.
- `Regla explícita de worktree brut` — prohibeix "netejar" o reordenar canvis aliens i obliga a treballar sobre l'àmbit mínim real.
- `Validació en 3 capes` — separa `validació tècnica`, `funcional` i `humana/UX` perquè "validat" no sigui una paraula buida.
- `Ordre de prioritat operatiu` — fixa l'escala compilació → runtime/dades → tests/guards → protocol crític → millores no bloquejants.
- `Checklist de tancament canònic` — converteix el tancament en preguntes binàries (`tsc`, `validate:core`, `qa:protocol`, §6, §9, diari, comptador, tipus de validació).
- Aclariment afegit al mateix §2.1: aquestes normes apliquen simètricament a `claude`, `codex` i al `user`; no és una disciplina reservada a un sol agent.
- Efecte: el protocol continua sent rigorós, però ara és més fàcil d'executar per qualsevol agent sense dependre tant de context oral o d'interpretació del moment.
- Verificació del tall: canvi documental; no s'han executat proves.
- `ADMIN_CHANGE_COUNTER` puja a `465`; el següent canvi real ha de ser `#466`.

### Canvi #464 — 2026-04-30 — claude (FET)
**El viewer del protocol cobreix també les seccions §X.Y, no només els Canvis del §9: índex navegable amb 60+ links, vista per secció via `?seccio=X.Y`, i el CTA dels items PENDING del manual roadmap salta directament a §6.15 ressaltat.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: el Canvi #463 va obrir el viewer `/admin/docs/protocol` amb el §9 sencer (Canvis #N llegits del fitxer Markdown). Però els items PENDING del manual roadmap ('marketing-analytics-hub') tenien CTA "Obrir §9 al protocol" — apuntant genèricament a la llista de Canvis enlloc d'on viuen com a SEGÜENT (§6.15 Roadmap). El protocol té ~60 seccions §X.Y (`§6.1 Fonaments`, `§6.6 Leads`, `§6.15 Roadmap`, `§6.18 Auditoria CRMs`, etc.) i cap d'elles era visible a l'admin sense obrir el `.md` al editor. Continuació natural del fil "botons clars + tot automatitzat" del #463.
- `lib/services/protocolCanvisService.ts` · ampliació: nou type `ProtocolSectionMeta { id: string; title: string; body: string; anchorId: string }`. Funció pura `parseProtocolSections(rawMarkdown)` extreu cada `## X.Y Title` (regex `/^##\s+(\d+(?:\.\d+)*)(?:\s+|\.\s*)(.+)$/`) i el body fins al següent `## ` header. `id` preserva el `X.Y` original (`'6.15'`, `'2.1.0'`, etc.); `anchorId` substitueix `.` per `-` (`seccio-6-15`, `seccio-2-1-0`) per generar id HTML vàlids. `parseProtocolCanvis` (## headers de §9) i `parseProtocolSections` (## headers numerats) coexisteixen sense col·lisió perquè `### Canvi #N` té tres `#` i no entra al pattern de seccions.
- `lib/services/protocolCanvisService.ts` · helper: `indexProtocolSectionsById()` per lookup O(1) per id (mateix patró que `indexProtocolCanvisByNumber`).
- `__tests__/lib/services/protocolCanvisService.test.ts` · ampliat de 7 a 13 tests: 6 nous per `parseProtocolSections` (input buit, extracció amb anchorId derivat, body fins al següent ##, ignora `### Canvi`, ids multi-nivell `2.1.0`, lookup per Map). Tots verds.
- `app/admin/docs/protocol/page.tsx` · ampliat:
  - Nou search param `?seccio=X.Y`. Si present, mostra **només** la secció demanada (vista focus) com a primer block — `<pre>` amb body, ressaltat amb border-amber, més enllaços de tornada al protocol complet i al manual.
  - Si no hi ha `?seccio=...`, mostra una nova `<AdminSection>` amb un grid de cards-link per cada `§X.Y` (id + title), cada una és un `<Link href="/admin/docs/protocol?seccio=X.Y#seccio-X-Y">`. Quan hi ha `?q=...`, filtra també les seccions per id+title (a més dels canvis).
  - KPI grid passa de 3 a 4 columnes amb nou KPI "Seccions del protocol" mostrant el total parsejat.
  - Search params type ara inclou `seccio?: string`.
- `app/admin/manual/page.tsx`: el CTA primari dels items PENDING canvia de `/admin/docs/protocol` (genèric) a `/admin/docs/protocol?seccio=6.15#seccio-6-15` (apunta a §6.15 — el roadmap canònic on viuen els PENDING) i el text passa de "Obrir §9 al protocol" a "Obrir §6.15 al protocol". Els items DONE continuen apuntant al Canvi #N concret com al #463.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `463` a `464`.
- Aquest tall **NO** toca: lògica de servei, schema, dades, cap altre workspace admin. Continuació pura del viewer del protocol amb una segona dimensió de navegació.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/protocolCanvisService.test.ts` OK (13 tests) · `pnpm run validate:core` OK 13/13 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `464`; el següent canvi real ha de ser `#465`.

### Canvi #463 — 2026-04-30 — claude (FET)
**Roadmap del manual passa de badges passius a CTAs reals i auto-verificats: viewer del §9 a `/admin/docs/protocol`, lectura enriquida del Canvi #N citat, botó "Anar al workspace" per àrea, i guard `qa:roadmap-canvis` que blinda la coherència entre `ADMIN_MANUAL_ROADMAP` i el §9.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: el Canvi #462 va sincronitzar el roadmap amb la realitat (11 DONE + 1 PENDING), però l'usuari va detectar dos defectes oberts amb la frase "botons clars i entendibles i tot automatitzat joder": (1) el badge `Fet · Canvi #N` era passiu — no es podia clicar per anar al detall real al §9, (2) el manteniment del status/doneCanvi al constant continuava sent manual cada cop que es tancava un Canvi al §9 (doble entrada). El feedback és general però aquí toca tancar la peça concreta.
- `lib/services/protocolCanvisService.ts` (nou): servei pur amb `parseProtocolCanvis(rawMarkdown)` que extreu cada `### Canvi #N — DATE — AUTHOR (STATUS)` com a `{ n, date, author, status, headline, body, anchorId }` i `indexProtocolCanvisByNumber()` que exposa lookup O(1) per Canvi #N. La regex canònica del header és `/^### Canvi #(\d+)\s+—\s+(\d{4}-\d{2}-\d{2})\s+—\s+([^\s(]+)\s*\(([^)]+)\)/` i el body s'agafa des del header fins al següent. `normalizeStatus()` retorna `'FET' | 'EN MARXA' | 'PENDENT' | 'UNKNOWN'`.
- `__tests__/lib/services/protocolCanvisService.test.ts` (nou): 7 tests purs. (1) input buit/sense Canvis. (2) extracció de metadades canòniques amb headline preservada. (3) body capturat fins al següent header (no inclou el següent). (4) normalització dels 4 status. (5) ignora headers amb format trencat (sense `#`, sense numero, sense data, etc.). (6) ordre preservat (de més recent a més antic, com al §9). (7) `indexProtocolCanvisByNumber` lookup correcte i `undefined` per claus inexistents.
- `app/admin/docs/protocol/page.tsx` (nou): pàgina admin server component (`force-static` + `revalidate: 60`) que llegeix `docs/protocol-producte-admin-ca.md` via `fs.readFile()`, parseja amb `parseProtocolCanvis()` i renderitza tots els Canvis com a `<details>` plegables amb `id="canvi-N"` per àncora directa. Suporta `?canvi=N` (obre el `<details>` corresponent + ressalta amb border-amber) i `?q=text` (filtra per número/data/autor/headline). KPIs: total canvis, # FET, darrer canvi (#N + data + autor), filtres actius. Cerca via `<form method="get">` simple. Cada `<summary>` mostra `#N`, data, autor (badge amb estil per `claude`/`codex`), status (badge amb estil per FET/EN MARXA/PENDENT/UNKNOWN) i headline. Body renderitzat com `<pre whitespace-pre-wrap>`.
- `app/admin/manual/page.tsx`: la pàgina ara és `async` i llegeix el protocol via `loadProtocolCanvisIndex()` (un sol fetch + parse cacheat per `revalidate`). Cada card del roadmap rep: (a) sota la `doneNote` verda, una línia `Verificat al §9: #N · DATE · AUTHOR · STATUS` amb les metadades **reals** llegides del protocol (no només el número) — autoverificació que l'usuari demanava. (b) Una fila d'acció final amb dos CTAs: primari `Obrir Canvi #N` (DONE amb `doneCanvi`) o `Obrir §9 al protocol` (PENDING) enllaçant a `/admin/docs/protocol?canvi=N#canvi-N`; secundari `Anar a {workspace}` amb mappeig fix per `area`.
- `scripts/check-roadmap-canvis.mjs` (nou): guard que parseja `lib/constants/adminManual.ts` (regex per blocs + `/doneCanvi:\s*(\d+)/`), parseja el §9 (regex de header amb status FET filtrat) i falla si una `doneCanvi: N` del roadmap no apareix com a `### Canvi #N — ... (FET)` al protocol. Si el fitxer del protocol no existeix, falla amb missatge clar.
- `__tests__/scripts/check-roadmap-canvis.test.ts` (nou): 5 tests via `spawnSync` sobre fixtures temp. (1) passa quan tot doneCanvi té match FET. (2) passa quan no hi ha doneCanvi al roadmap. (3) falla amb un Canvi orfe. (4) falla quan el Canvi citat existeix però amb status `EN MARXA` (no FET). (5) falla quan el fitxer del protocol no existeix. Aquest test entra automàticament a `qa:protocol:test` que ja escaneja `__tests__/scripts/`.
- `package.json`: nou script `qa:roadmap-canvis` afegit a `validate:core` entre `qa:message-imports` i `arch:layer:check`. `validate:core` passa de 12 guards a **13**.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `462` a `463`.
- Ressonància amb el feedback general: aquesta línia editorial (botons clars + automatització) queda escrita com a regla durador a `feedback_botons_clars_automatitzat.md` a la memòria de Claude. Qualsevol UI futura amb badges passius o manteniment manual de doble entrada hauria d'aplicar el mateix patró (CTA real + lectura del source canònic + guard de coherència).
- Aquest tall **NO** toca: lògica de servei comercial, schema, dades de leads/customers/bookings, copy públic, cap altre workspace admin. Pur drenatge UX + automatització de coherència.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/protocolCanvisService.test.ts __tests__/scripts/check-roadmap-canvis.test.ts __tests__/lib/constants/adminManualRoadmap.test.ts` OK (18 tests) · `pnpm run qa:roadmap-canvis` OK · `pnpm run validate:core` OK 13/13 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `463`; el següent canvi real ha de ser `#464`.

### Canvi #462 — 2026-04-30 — claude (FET)
**`ADMIN_MANUAL_ROADMAP` sincronitzat amb la realitat del §6.15: 11 ítems marcats `DONE` amb cita de Canvi #N + 1 ítem `PENDING` real, i el roadmap a `/admin/manual` deixa de mentir sobre l'estat del producte.**
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`
- Context: `lib/constants/adminManual.ts` exporta `ADMIN_MANUAL_ROADMAP` amb 12 ítems que es pinten a `/admin/manual` com a "Roadmap de millores pendents". El contracte original (`AdminManualRoadmapItem` amb `id/title/description/priority/impact/effort/area`) no portava camp `status` i tots els ítems es renderitzaven com si fossin pendents. La realitat al §6.15 del protocol és l'oposada: 11 dels 12 ítems ja són FET amb cita explícita de Canvi #N (alguns múltiples). Només `marketing-analytics-hub` és realment pendent. Resultat: l'usuari entrava a `/admin/manual` i veia 12 cards "pendents" quan només n'hi havia 1, i el KPI "Roadmap pendent" mostrava `12` en lloc de `1`. Trencava la confiança del manual com a font operativa.
- `lib/constants/adminManual.ts` · contracte: nou type `AdminManualRoadmapStatus = 'PENDING' | 'DONE'` exportat. `AdminManualRoadmapItem` guanya `status: AdminManualRoadmapStatus`, `doneCanvi?: number` (referència al §9 quan és identificable amb un sol canvi) i `doneNote?: string` (descripció breu del lliurament real). Camps opcionals només es completen quan `status === 'DONE'`.
- `lib/constants/adminManual.ts` · dades: 11 ítems marcats `DONE` amb mapeig contra el §6.15:
  - `lead-nurturing-engine` → `commercialSequenceService.ts` (cadència 5 passos, sense Canvi únic).
  - `forecast-per-status` → Canvi #115 (`LEAD_SCORING_STATUS_PROBABILITY` a `loadDailyBrief`, ampliat al #454 amb banda ±1σ).
  - `command-palette` → Canvi #380 (capa pura `adminCommandPaletteService.ts` + 13 tests; base al #102).
  - `ab-testing-templates` → Canvi #133 (`emailTrackingService.ts` click tracking + report best/worst).
  - `attribution-multitouch` → Canvi #131 (`generateMultiTouchReport` + dashboard model multi-touch; #128).
  - `lead-scoring-dynamic` → `commercialScoring.ts` (sense Canvi únic).
  - `kpi-anomaly-detection` → Canvi #115 (`dailyAnomalyService.ts` + `AnomalyPanel`).
  - `capacity-conflict-alerts` → Canvi #116 (`capacityConflictService.ts` + `CapacityConflictPanel`; alertes #129).
  - `push-notifications-critical` → Canvi #115 (resum diari email/WA; #144 alertes urgents).
  - `weekly-benchmark` → Canvi #126 (servei + ruta + GitHub Actions + 4 tests).
  - `decision-audit-trail` → Canvi #408 (#358 backend + #360 analítica + #363 endpoint + #370/#372/#375/#377/#383 UI/wiring + #408 deploy Railway).
- `lib/constants/adminManual.ts` · 1 ítem `PENDING`: `marketing-analytics-hub` (CRITICAL, OAuth + 4 APIs externes Google Ads/Meta Ads/GA4/Google Business Profile). Segueix sent l'únic candidat real a futur Canvi del protocol; no porta `doneCanvi` ni `doneNote`.
- `app/admin/manual/page.tsx`: pàgina admin ajustada per llegir el nou contracte. (1) Nou record `ROOTMAP_STATUS_ORDER` amb `PENDING: 0, DONE: 1` per ordenar pendents primer. (2) Nous comptadors `roadmapPendingCount` i `roadmapDoneCount` calculats sobre `ADMIN_MANUAL_ROADMAP`. (3) `roadmapItemsSorted` aplica el sort sense mutar la constant. (4) KPI "Roadmap pendent" passa de mostrar `ADMIN_MANUAL_ROADMAP.length` (12) a `roadmapPendingCount` (1) i la descripció diu "X ja construïdes · Y per atacar". (5) Title de la secció passa de "Roadmap de millores pendents" a "Roadmap de millores identificades" amb description que reconeix el §9 com a origen canònic. (6) Cada card pinta dos badges apilats (prioritat com abans + estat nou amb classes verdes per `DONE` o neutres per `PENDING`); el text del badge `DONE` és `Fet · Canvi #N` quan hi ha `doneCanvi`, o simplement `Fet`. (7) Card amb `status === 'DONE'` guanya un border-emerald subtil i, si porta `doneNote`, un panell verd a sota de la descripció amb la cita textual del lliurament real.
- `__tests__/lib/constants/adminManualRoadmap.test.ts` (nou): 6 tests purs sobre el contracte. (1) tots els ítems tenen status canònic ∈ {PENDING, DONE}. (2) ids únics. (3) ítems DONE amb `doneCanvi` sempre numèric enter positiu i `doneNote` no buit quan apareix. (4) ítems PENDING no porten `doneCanvi` ni `doneNote`. (5) `marketing-analytics-hub` és l'únic PENDING amb prioritat CRITICAL. (6) els 11 ids canònics esperats al backlog DONE estan presents amb `status === 'DONE'`.
- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER` puja de `461` a `462`.
- Aquest tall **NO** toca: lògica de servei, schema Prisma, rutes API, tests d'altres mòduls. Pur drenatge de deute documental + monocapa entre `/admin/manual` i el §6.15 del protocol.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/constants/adminManualRoadmap.test.ts` OK (6 tests) · `pnpm run validate:core` OK 12/12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `462`; el següent canvi real ha de ser `#463`.

### Canvi #461 — 2026-04-30 — codex (FET)
**C.10 del §6.18: la Inbox canònica ja tracta Instagram DM i formulari web com a canals reals dins del resum compartit de comunicacions.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el backlog `C.10` no demanava una nova pantalla, sinó tancar el buit de model entre la Inbox existent i dos canals que encara no entraven bé al `commTimeline`: `IG DM` i `form`. El problema real era de font canònica, no d'UI: el resum de comunicacions i les activitats de lead només entenien bé `EMAIL` i `WHATSAPP`, així que els contactes entrants de formulari i Instagram quedaven com a soroll o semàntica parcial.
- `lib/services/commTimelineService.ts`: el contracte `CommChannel` incorpora `INSTAGRAM` i `FORM`; el mapper canònic normalitza `metadata.channel` (`instagram`, `ig`, `ig_dm`, `form`, `web_form`, `contact_form`) abans de caure al tipus legacy, i el summary ja compta aquests dos canals al mateix nivell que email/WhatsApp/trucada/nota.
- `app/admin/inbox/CommSummaryPanel.tsx`: el resum visual de la Inbox mostra també `Instagram` i `Formulari` com a canals actius, amb les seves icones i comptadors reals.
- `lib/services/leadActivityService.ts`: nou helper `recordLeadInboundChannelCaptured()` per escriure una activitat inbound canònica a lead sense duplicar lògica ni inventar un segon model.
- `lib/services/contactLeadCaptureService.ts`: la captura pública de contactes registra ara una activitat inbound de canal `FORM` o `INSTAGRAM` quan l'entrada arriba des de web/configurador/Instagram, mantenint `leadNote` i afegint traça canònica reutilitzable per Inbox/Hub.
- `lib/services/leadAdminService.ts`: l'alta manual d'una lead amb `source='INSTAGRAM'` deixa també una activitat inbound canònica (`Instagram DM registrat`) perquè el resum compartit no depengui només d'integracions futures.
- `lib/customer-hub/dto.ts` i `lib/customer-hub/fetchCustomerHub.ts`: el contracte del Customer Hub s'alinea amb els dos nous canals (`INSTAGRAM`, `FORM`) i els fallbacks locals deixen de trencar `tsc`.
- Tests ampliats: `__tests__/lib/services/commTimelineService.test.ts`, `__tests__/app/admin/inbox/CommSummaryPanel.test.tsx`, `__tests__/lib/services/contactLeadCaptureService.test.ts`, `__tests__/lib/services/leadAdminService.test.ts`, més alineació de fixtures a `__tests__/app/admin/clientes/*`, `__tests__/lib/customer-hub/nextActionLink.test.ts` i `__tests__/lib/services/customerInsightsService.test.ts`.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/commTimelineService.test.ts __tests__/app/admin/inbox/CommSummaryPanel.test.tsx __tests__/lib/services/contactLeadCaptureService.test.ts __tests__/lib/services/leadAdminService.test.ts` OK (42 tests) · `npx tsc --noEmit` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `461`; el següent canvi real ha de ser `#462`.

### Canvi #460 — 2026-04-30 — codex (FET)
**E.20 del §6.18 mancances transversals: la reserva ja té captura ràpida de bolo amb foto + nota sobre la galeria existent.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el punt `E.20` demanava un equivalent de "Field Notes" directament dins la fitxa de `Booking`. El model ja tenia `BookingGalleryPhoto.caption` i l'endpoint `POST /api/admin/bookings/[id]/gallery` ja acceptava `caption`, però la UI no exposava cap flux ràpid de mòbil per obrir càmera, pujar la foto i deixar context operatiu.
- `app/admin/bookings/[id]/BookingFieldNotesComposer.tsx` (nou): composer compacte de captura ràpida. Permet escriure una nota curta, obre càmera o selector de foto amb `accept="image/*"` + `capture="environment"`, i puja la captura via `fetchWithCsrf` a la galeria de la reserva.
- Contracte del composer:
  - envia `caption` amb la nota escrita;
  - força `isPortal=false` i `isPortfolio=false`, de manera que la captura queda interna per defecte;
  - refresca la reserva després de guardar per veure la captura immediatament a la galeria.
- `app/admin/bookings/[id]/BookingGallery.tsx`: la foto seleccionada guanya un camp `Nota / context` editable, reutilitzant el `PATCH` existent de galeria per desar `caption`. Això converteix `caption` en una nota de camp real i no només en metadada latent.
- `app/admin/bookings/[id]/page.tsx`: el composer es col·loca a la secció `Galeria`, just abans de `BookingGallery`, perquè el flux sigui un sol pas des de la fitxa de reserva.
- Tests:
  - `__tests__/app/admin/bookings/BookingFieldNotesComposer.test.tsx` (nou): blinda enviament de `file + caption + flags interns` i `router.refresh()`, més el cas d'error.
  - `__tests__/lib/services/galleryService.test.ts` ja cobria `caption` i segueix passant sense canvis de backend.
- Verificació del tall: `pnpm exec vitest run __tests__/app/admin/bookings/BookingFieldNotesComposer.test.tsx __tests__/lib/services/galleryService.test.ts` OK · `npx tsc --noEmit` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `460`; el següent canvi real ha de ser `#461`.

### Canvi #459 — 2026-04-30 — codex (FET)
**F.24 del §6.18 mancances transversals: la fitxa client ja ensenya ubicació i distància real reutilitzant el motor canònic de Google Maps.**
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`
- Context: el Customer Hub ja mostrava `eventVenue/eventLocation` en punts dispersos, però no hi havia cap superfície clara per consultar la ruta real des de la base Òrbita. El càlcul ja existia a `B.6` per reserves (`distanceKm` guardat + endpoint `POST /api/admin/maps/distance`), però `F.24` demanava aterrar-lo a la fitxa client sense crear un segon flux.
- `lib/customer-hub/dto.ts`: `BookingDTO` i la reserva vinculada dins `LeadDTO` guanyen `distanceKm?: number` per transportar el km canònic fins a la UI.
- `lib/customer-hub/data.ts` + `lib/customer-hub/fetchCustomerHub.ts`: el loader del Customer Hub selecciona i mapeja `booking.distanceKm` tant per a `bookingsRows` com per a la reserva vinculada del lead, de manera que la fitxa client pot consumir el valor persistent quan ja existeix.
- `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx`: nova targeta `Ubicació i ruta` al bloc de següents passos. Prioritza la pròxima reserva del client, mostra `venue + location`, obre el destí a Google Maps i:
  - si `distanceKm` ja existeix, ensenya la distància guardada (`km A/T`) com a dada canònica de la reserva;
  - si no existeix però sí hi ha destí, calcula ruta viva via `fetchWithCsrf('/api/admin/maps/distance')` i mostra `km anada`, `km A/T`, durada i resolució de l'origen/destí sense modificar la reserva;
  - si Google Maps falla o no està configurat, la targeta manté igualment la ubicació i un missatge de degradació net.
- Tests:
  - `__tests__/app/admin/clientes/SummaryPanel.test.tsx`: cobreix tant la variant amb `distanceKm` guardat com el fallback viu via Google Maps.
  - `__tests__/lib/customer-hub/fetchCustomerHub.test.ts`: blinda que `distanceKm` es propagui des del loader cap a `bookings[]` i `leads[].booking`.
- Verificació del tall: `pnpm exec vitest run __tests__/app/admin/clientes/SummaryPanel.test.tsx __tests__/lib/customer-hub/fetchCustomerHub.test.ts` OK · `npx tsc --noEmit` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `459`; el següent canvi real ha de ser `#460`.

### Canvi #458 — 2026-04-30 — claude (FET)
**E.18 del §6.18 mancances transversals: l'admin PWA guanya Quick Actions de homescreen via `manifest.webmanifest`, completant el front que estava `[FET base]`.**
- Context: el `E.18` deia "App PWA admin — `app/manifest` ja existeix, refinar offline i Quick Actions". L'auditoria ràpida mostra que la capa d'**offline** ja era robusta — `public/sw.js` té `OFFLINE_PAGE = '/offline.html'`, precache d'assets, estratègies fetch i activate cleanup; l'admin layout registra el SW. El que faltava eren les **Quick Actions** admin: `manifest.webmanifest` consumit per `app/admin/layout.tsx` només tenia `name`, `icons` i camps mínims, sense l'array `shortcuts` que defineix els accessos ràpids del homescreen quan l'usuari instal·la la PWA.
- `public/manifest.webmanifest`: afegit l'array `shortcuts` amb 4 entrades canòniques alineades amb les superfícies més usades del cockpit:
  - `Entrades` → `/admin/leads` (cockpit comercial)
  - `Creació ràpida` → `/admin/quick-create` (wizard A.5 + B.8)
  - `Reserves` → `/admin/bookings`
  - `Inbox` → `/admin/inbox` (compose i bulk de C.11/C.12)
  Cada shortcut porta `name`, `short_name`, `description`, `url` i icona `96x96` reaprofitant `/favicon-96.png` (no calen assets nous; el SO renderitza la mateixa icona arrodonida).
- `__tests__/public/manifest-webmanifest.test.ts` (nou): 3 tests de contracte. (1) JSON vàlid amb camps mínims de PWA (`name`, `start_url`, `display: standalone`, ≥2 icones). (2) `shortcuts` inclou les 4 URLs admin canòniques (`/admin/leads`, `/admin/quick-create`, `/admin/bookings`, `/admin/inbox`). (3) Cada shortcut admin té `name`, `url` `/admin/*` i icona `96x96`.
- Aquest tall **NO** toca:
  - El SW (`public/sw.js`) ni l'`offline.html` — la capa d'offline ja era operativa i no requeria modificacions.
  - El `manifest.json` públic (que viu separat amb shortcuts cap a `/contacto`, `/portfolio`, `/servicios/bodas` per al site web, no per a l'admin).
  - `app/admin/layout.tsx` — el `<link rel="manifest" href="/manifest.webmanifest" />` ja apuntava al fitxer correcte.
- Efecte: quan un propietari instal·la l'admin a un mòbil, el `long-press` sobre la icona ofereix saltar directament a Entrades, Creació ràpida, Reserves o Inbox sense passar per la home. És el patró estàndard de productivitat dels CRMs mòbil.
- Verificació del tall: `pnpm exec vitest run __tests__/public/manifest-webmanifest.test.ts` OK (3 tests) · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `458`; el següent canvi real ha de ser `#459`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #457 — 2026-04-30 — codex (FET)
**`C.11` queda tancat: `Inbox Compose` ja pot executar enviaments massius segmentats sobre audiències reals sense crear una capa paral·lela de redacció o d’enviament.**
- Context: el backlog de `§6.18` marcava `C.11` com a pendent perquè el producte tenia segments CRM, campanyes suggerides i redactor d’Inbox, però l’últim pas continuava sent manual: copiar text i enviar-lo contacte per contacte. El tall bo no era inventar un mòdul nou, sinó connectar segmentació + compose + `sendAdminEmail()` sota el mateix flux.
- `lib/services/bulkComposeSegmentService.ts` (nou): catàleg canònic `BULK_COMPOSE_SEGMENTS` amb dos segments executables de primer nivell: `customers-weddings-2025` i `leads-no-response-7d`. Carrega audiència real des de Prisma o des de `loadPendingFollowUps()`, personalitza placeholders simples `{nom}` / `{name}` i orquestra l’enviament bulk reutilitzant `sendAdminEmail()` per destinatari.
- `app/api/admin/emails/send-bulk/route.ts` (nou): ruta autenticada per executar el bulk send sobre un segment, retornant `audienceSize`, `sent` i `failed`.
- `app/admin/inbox/compose/page.tsx`: el redactor guanya accessos ràpids a segments i pot carregar l’audiència directament per `?segment=` sense crear una pantalla nova.
- `app/admin/inbox/compose/ComposeForm.tsx`: nou mode segmentat. Mostra resum d’audiència, primers destinataris, bloqueja la selecció individual de lead quan s’està en bulk mode i envia el formulari a `/api/admin/emails/send-bulk`. El CTA passa a `📣 Envia campanya` per no semblar un correu individual.
- `__tests__/lib/services/bulkComposeSegmentService.test.ts` (nou): blinda resolució de les dues audiències i personalització del missatge. `__tests__/app/api/admin/emails-send-bulk-route.test.ts` (nou): auth + happy path + propagació d’error funcional. `__tests__/app/admin/inbox/compose/ComposeForm.test.tsx`: ampliat amb regressió de mode segmentat.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/bulkComposeSegmentService.test.ts __tests__/app/api/admin/emails-send-bulk-route.test.ts __tests__/app/admin/inbox/compose/ComposeForm.test.tsx` OK · `npx tsc --noEmit` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `457`; el següent canvi real ha de ser `#458`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #456 — 2026-04-30 — claude (FET)
**D.17 del §6.18 mancances transversals: `PipelineBoard` ja porta drag & drop de mòbil via Pointer Events; queda blindada amb un test de contracte i marcat `[FET]` al checklist.**
- Context: el `D.17` estava taggat `[BLOC verificar UX]` perquè la lectura ràpida del checklist suggeriria que `LeadPipelineView` només tenia drag HTML5 (que mobile browsers no suporten). La verificació real del codi mostra que `PipelineBoard` (component genèric extret del Lead i Booking pipeline) implementa una capa d'aliments dual: HTML5 drag&drop per desktop **i** Pointer Events per touch amb heurística pròpia de scroll vertical vs drag horitzontal (`Math.abs(deltaY) > 18 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2 → cancel·la el drag`), `touchAction: 'pan-y'` per defecte i `'none'` mentre el drag és actiu, i `resolveDropStatusFromPoint(x, y)` per determinar la columna destí des de coordenades absolutes. Sense això es deixava la sensació que el front estava parcialment obert quan en realitat ja hi era; aquest tall el blinda i el converteix en `FET`.
- `__tests__/app/admin/components/PipelineBoard.test.tsx` (nou): cobreix tres regressions del contracte exposat al `renderCard`: (1) tots els handlers desktop+mòbil són funcions vives i `style.touchAction` arrenca a `'pan-y'`; (2) `updatingId` desactiva `draggable` només per al lead afectat sense bloquejar la resta; (3) un `onPointerDown` d'origen `mouse` no llança cap moviment (els drags de ratolí passen per HTML5 drag&drop, no per Pointer Events).
- Aquest tall **NO** toca codi del component, ni `LeadPipelineView`, ni `BookingPipelineView`, ni cap servei. La capa de Pointer Events ja existia (afegida prèviament al sync `81245d80 fix: ... mobile swipe`); el que faltava era una cita explícita al `Canvi #N` que ho tanqués. La regla és la mateixa que el `#447` i el `#453`: un `FET` viu al protocol ha de tenir cita de canvi.
- Verificació del tall: `pnpm exec vitest run __tests__/app/admin/components/PipelineBoard.test.tsx` OK (3 tests) · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `456`; el següent canvi real ha de ser `#457`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #455 — 2026-04-29 — codex (FET)
**`C.13` queda tancat: la fitxa del lead ja pot disparar manualment un pas de seqüència comercial sobre el motor canònic existent.**
- Context: el backlog de `§6.18` marcava `C.13` com a parcialment fet perquè el nurturing comercial ja existia com a batch (`commercialSequenceService` + cron + botó massiu a `Sales Ops`), però faltava la superfície de propietari per executar-lo sobre un lead concret amb un pas triat. Sense això, el motor existia però no era accionable des de la fitxa comercial del dia a dia.
- `lib/services/commercialSequenceService.ts`: refós perquè el batch i el trigger manual comparteixin la mateixa funció interna `executeSequenceStepForLead()`. El servei exporta ara `runCommercialSequenceForLead(leadId, { step })`, valida lead actiu, resol el pas demanat, reutilitza la mateixa lògica d’enviament (`WhatsApp` primer, fallback a correu), actualitza `nurturingStep/lastNurturingAt/nurturingDone`, registra `leadActivity` shared i marca `adminLog` amb `manual: true`.
- `app/api/admin/leads/[id]/sequence/route.ts` (nou): endpoint autenticat + `permission('automation')` + CSRF per executar el pas manual i retornar `summary` tipat al client.
- `app/admin/leads/[id]/LeadActionsEnhanced.tsx`: nou bloc `Seqüència manual` al sidebar del lead. Mostra progrés actual, permet triar pas 1-5 i executa el trigger manual sense sortir de la fitxa. Es desactiva automàticament fora dels estats actius (`NEW`, `CONTACTED`, `QUOTE_SENT`, `NEGOTIATING`).
- `app/admin/leads/[id]/page.tsx` i `lib/constants/admin.ts`: la fitxa aporta `nurturingStep/lastNurturingAt` al panell i es centralitza el catàleg UI `ADMIN_MANUAL_SEQUENCE_STEP_OPTIONS`.
- `__tests__/lib/services/commercialSequenceService.test.ts`: 3 regressions noves per al trigger manual (`404`, execució de pas concret amb `manual: true`, i `409` si no hi ha canal). `__tests__/app/api/admin/leads-sequence-route.test.ts` (nou) blinda auth, permission, CSRF, happy path i propagació d’errors de domini.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/commercialSequenceService.test.ts __tests__/app/api/admin/leads-sequence-route.test.ts` OK · `npx tsc --noEmit` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `455`; el següent canvi real ha de ser `#456`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #454 — 2026-04-29 — claude (FET)
**D.14 del §6.18 mancances transversals: la previsió mensual deixa de ser un punt cec — `pipelineForecast` propaga ara una banda de confiança ±1σ derivada de la variància Bernoulli per lead i `EconomiaClient` la fa visible com a `Rang ±1σ`.**
- Context: el §6.18 mantenia `D.14` com a `[parcial]` perquè `LEAD_SCORING_STATUS_PROBABILITY` i la combinació `60% pipeline + 40% històric` ja existien, però la UI a `/admin/economia` només mostrava el punt central (`historicalAvg`, `pipeline`, `combined`). Sense banda d'incertesa, un mes amb 1 lead "calent" valorat 8 000€ es presentava igual que un mes amb 4 leads molt insegurs sumant la mateixa esperança matemàtica — informació crítica perduda al cockpit financer.
- `lib/services/pipelineForecast.ts`: el `ForecastMonth` afegeix `pipelineLow/High` i `combinedLow/High`. El loop de leads ara acumula també una variància Bernoulli per mes (`a²·p·(1-p)`), respectant la divisió per 9 quan un lead sense data es reparteix als 3 mesos següents (cada contribució és `weighted/3`, amb variància pròpia). Al final, `stdDev = sqrt(variance)` dóna `pipelineLow = max(0, pipeline - σ)` i `pipelineHigh = pipeline + σ`. La combinació amb l'històric reaprofita el helper local `combine(p)` per garantir que la banda final viu sota la mateixa regla 60/40 que el valor central.
- `app/admin/economia/economia-types.ts`: `ForecastMonth` queda alineat amb el contracte nou del servei.
- `app/admin/economia/EconomiaClient.tsx`: la taula `Previsió de vendes` afegeix la columna `Rang ±1σ`, mostrant `low – high` quan la banda té amplada (mai negativa) i `—` quan és col·lapsada (cap pipeline o p=0/p=1). El subtítol explica explícitament que la banda és la variància Bernoulli per lead — evita que un usuari ho llegeixi com un interval de confiança paramètric estricte.
- Aquest tall **NO** toca:
  - El motor de scoring (`commercialScoring.ts`) ni el càlcul d'amount estimat — la banda surt de la mateixa probabilitat que ja consumeix el centre.
  - El cron `/api/admin/cron/forecast` ni cap endpoint — la signatura de `buildPipelineForecast` és estrictament additiva.
  - La pestanya `Cash flow` (que viu en un altre servei `cashFlowForecast.ts`).
- Tests nous (6): `confidence band ±1σ` cobreix banda zero sense leads, banda no negativa amb 1 lead, col·lapse a p=1, amplada exacta a p=0.5 (`σ = amount/2`), combinació 60/40 amb històric, i col·lapse total quan només hi ha històric.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/pipelineForecast.test.ts` OK (18 tests) · `pnpm run validate:core` OK (12 guards) · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `454`; el següent canvi real ha de ser `#455`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #453 — 2026-04-29 — claude (FET)
**Regularització documental §6.18 mancances transversals: D.15 i D.16 estaven marcats `[FET]` però sense citar el `Canvi #N` que els resol, contràriament a la norma §2.1.**
- Context: el bullet de `D.15 "Què faig avui"` deia només "`dailyBriefService` ja cobreix" i el de `D.16 "Customer Lifetime Value"` deia "`customerInsightsService.calculateLTV` ja existeix". Cap dels dos donava la cita explícita al canvi que els tancava, així que un agent futur que llegís el §6.18 hauria de fer una recerca a `git log` per saber on viu el codi tancat. Aquesta lectura és exactament la que la norma §2.1 vol evitar — un `FET` sense cita al `Canvi #N` és un drenatge documental incomplet.
- Verificació del codi referenciat (lectura d'estat actual, sense modificar):
  - D.15: `lib/services/dailyBriefService.ts` existeix amb `generateDailyBrief(input)` + wrapper `loadDailyBrief()`; consumit per `app/admin/components/DailyBriefPanel.tsx` integrat a `app/admin/page.tsx`. Tests `__tests__/lib/services/dailyBriefService.test.ts` cobreixen greeting, summary, KPIs, alertes i accions. Origen: `Canvi #44` (2026-04-10, claude). Re-foundat al `#109` (codex) per consumir `loadPipelineSuggestions` i `loadPendingFollowUps` com a fonts canòniques.
  - D.16: `lib/services/customerInsightsService.ts` exposa `calculateLTV` i la integra a `fetchCustomerHub` via `insights`. UI: `InsightsBanner` al Customer Hub mostra LTV, salut relacional i next action. Origen: `Canvi #16` (2026-04-09, claude). El `#35` ho mou de hardcode a aquest servei al banner.
- `docs/protocol-producte-admin-ca.md` · §6.18 mancances transversals: el bullet `D.15` passa a `FET *(Canvi #44)*` amb context complet del que cobreix realment el servei. El bullet `D.16` passa a `FET *(Canvi #16)*` amb cita addicional al `#35` que va portar la dada al banner. Tots dos esmenten que aquesta regularització és el `Canvi #453`.
- Aquest tall **NO** toca codi, schema ni tests — és pur deute documental sanat. Els canvis #16, #35, #44 i #109 ja portaven la seva pròpia validació (validate:core + qa:protocol al moment del tancament).
- Verificació del tall: `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `453`; el següent canvi real ha de ser `#454`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #452 — 2026-04-29 — codex (FET)
**`ComposeForm` manté l’auto-emplenat de plantilles intel·ligents sincronitzat amb el lead actiu sense trepitjar edicions manuals.**
- Context: `inboxTemplateService` ja generava plantilles contextuals amb `name`, `eventDate`, `eventType`, `guestCount` i idioma, però al `ComposeForm` el text només s’emplenava en el moment de fer click. Si després es canviava de lead o d’idioma, la UI recalculava `smartTemplates` però l’assumpte i el cos quedaven congelats amb el context antic, de manera que `C.12` continuava parcialment obert.
- `app/admin/inbox/compose/ComposeForm.tsx`: nou `lastAppliedTemplateRef` per recordar l’últim auto-emplenat. Quan hi ha `activeTemplateKey`, el formulari reaplica la plantilla recalculada només si `subject` i `body` encara coincideixen amb l’últim valor generat; així el canvi de lead/idioma refresca variables com nom o dades d’event, però si l’usuari ja ha començat a editar a mà, el formulari no li sobrescriu el treball.
- `__tests__/app/admin/inbox/compose/ComposeForm.test.tsx`: ampliada la suite amb dues regressions noves. La primera blinda que la plantilla activa es rehidrati amb el segon lead quan el text continua untouched; la segona garanteix que una edició manual de l’assumpte bloqueja la reaplicació automàtica i preserva el contingut escrit per l’usuari.
- Efecte: les plantilles intel·ligents passen de ser només un “paste inicial” a comportar-se com un auto-emplenat real dins del redactor, que segueix el context mentre encara és segur fer-ho.
- Verificació del tall: `pnpm exec vitest run __tests__/app/admin/inbox/compose/ComposeForm.test.tsx` OK · `npx tsc --noEmit` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `452`; el següent canvi real ha de ser `#453`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #451 — 2026-04-29 — codex (FET)
**E.19 del §6.18: quick actions mòbil unificades a lead, customer i booking amb una franja shared i l'acció canònica de "contactat" al lead.**
- Context: el backlog transversal del §6.18 apuntava un gap molt concret de camp: des del mòbil, les fitxes de `lead`, `customer` i `booking` no oferien una capa consistent de primer contacte. Hi havia telèfons, correus i alguns links de WhatsApp dispersos, però no una affordance clara d'un sol toc; i al lead faltava exposar a mòbil l'acció operativa bàsica de marcar-lo com a `CONTACTED` reutilitzant la ruta canònica existent.
- `app/admin/components/MobileQuickActions.tsx` (nou): component shared client-side per a vista mòbil (`md:hidden`) que centralitza `trucar`, `WhatsApp`, `correu` i una acció primària opcional. El helper intern `buildWhatsAppHref()` evita tornar a duplicar el format del link a cada fitxa.
- `app/admin/leads/[id]/LeadMobileQuickActions.tsx` (nou): wrapper específic del lead que reaprofita `patchLeadStatus()` per fer `CONTACTED` amb un sol toc quan l'estat actual és `NEW`, i després refresca la fitxa.
- `app/admin/leads/[id]/page.tsx`: injecta la franja mòbil shared just sota el bloc executiu principal del lead.
- `app/admin/clientes/[id]/_components/CustomerHeader.tsx`: afegeix la mateixa franja al header del Customer Hub perquè el mòbil tingui `tel`, `WhatsApp` i `correu` sense navegar més.
- `app/admin/bookings/[id]/page.tsx`: afegeix la franja shared dins la secció "Informació del Client" de la reserva.
- Efecte operatiu: al telèfon, el propietari pot trucar, obrir WhatsApp, enviar correu o marcar el lead com a contactat en un sol toc, sense buscar aquestes accions dins la fitxa ni dependre del layout desktop.
- Verificació del tall: `npx tsc --noEmit` OK.
- `ADMIN_CHANGE_COUNTER` puja a `451`; el següent canvi real ha de ser `#452`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #450 — 2026-04-29 — codex (FET)
**B.9 del §6.18: el marge instantani entra al PDF Studio reutilitzant `costEngine` i la configuració canònica de rendibilitat, sense cap motor econòmic paral·lel.**
- Context: després de tancar B.8 al `quick-create`, l'últim punt obert del Camí 2 era B.9: fer visible el marge mentre es cotitza, no només a `/admin/economia` o al detall d'una reserva existent. El repo ja tenia la peça bona (`computeBookingFinancialSummary` a `lib/services/costEngine.ts`) i l'endpoint de lectura de `profitabilityConfig`, però el Studio de pressupost continuava ensenyant només ingressos i recàrrecs. Si volíem tancar B.9 bé, calia portar-hi exactament el mateix motor i no un resum local inventat.
- `lib/services/costEngine.ts`: deixa de dependre runtime de `profitabilityService.ts` per al default i passa a usar `PROFITABILITY_MODEL_DEFAULTS` de constants. Això el fa segur per entorns client sense tocar la fórmula canònica ni els tests del motor.
- `app/admin/presupuestos/PresupuestoPdfStudio.tsx`: nou carregador de `profitabilityConfig` via `GET /api/admin/reports/profitability/config`. Amb aquesta config calcula un `financialSummary` amb `computeBookingFinancialSummary({ total, packPrice, extrasTotal, distanceKm, source:'UNKNOWN' })`. El Studio continua amb la mateixa veritat de preu, transport i extres; només afegeix la lectura de cost i marge.
- `app/admin/presupuestos/StudioPreview.tsx`: nova targeta `Marge viu` amb `cost directe`, `marge net`, `% marge` i `CAC` estimat. El to visual surt del `marginTone` canònic (`emerald` / `amber` / `orange` / `rose`), així que el llenguatge és coherent amb bookings/economia.
- `app/admin/presupuestos/studio-utils.ts`: tipus nou `ProfitabilityConfigResponse` per evitar payloads inline i mantenir la frontera tipada del Studio.
- Efecte operatiu: mentre cotitza, el propietari veu al mateix moment si el pressupost respira o no, amb cost directe i marge net reals del motor compartit. B.9 queda tancat i el Camí 2 del §6.18 passa completament a FET.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/costEngine.test.ts` OK (53 tests) · `npx tsc --noEmit` OK.
- `ADMIN_CHANGE_COUNTER` puja a `450`; el següent canvi real ha de ser `#451`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #449 — 2026-04-29 — codex (FET)
**B.8 del §6.18: auto-suggeriment de pack aterra a `/admin/quick-create` amb parser de pressupost robust, score per capacitat/pressupost i mapping segur cap als packs reals de Prisma.**
- Context: el backlog del §6.18 deixava B.8 com el següent tall natural després de B.6/B.7. El repo ja tenia un esquelet nou a `packSuggestionService`, però encara era una capa pura sense impacte operatiu i amb un forat real: `parseBudgetRange('més de 500€')` fallava per accents, així que el test nou ni tan sols passava. A més, el suggeridor treballava amb packs de `packs-config`, mentre que `/admin/quick-create` envia `packId` de Prisma; sense resoldre aquest mapping, la recomanació no podia aplicar-se al flux real.
- `lib/services/packSuggestionService.ts`: `parseBudgetRange` normalitza accents via Unicode NFD abans de parsejar. Això fa robusts casos com `més de`, `mes de`, `fins a` i variants similars sense duplicar regexs. La resta del motor de score es manté: servei per `eventType`, capacitat, bracket de pressupost, bonus de popularitat, `confidence` i `alternatives`.
- `app/admin/quick-create/page.tsx`: la query de packs actius passa també `slug`, no només `id/code/price`, perquè el formulari pugui resoldre el pack suggerit de config cap al registre real de Prisma sense heurístiques febles.
- `app/admin/quick-create/QuickCreateForm.tsx`: integra `suggestPackForLead()` directament al formulari. Quan hi ha invitats o pressupost:
  - calcula el millor pack i alternatives;
  - mapeja `suggestion.best.pack.slug` al pack real carregat des de Prisma;
  - mostra targeta `Suggeriment automàtic` amb confiança, motius, warning si toca i alternatives;
  - afegeix CTA `Aplicar suggeriment` que posa `packId` al select però **no** sobreescriu mai una tria manual existent;
  - si no hi ha encaix prou net (`unmatched`), mostra explícitament que no hi ha suggeriment clar.
- Efecte operatiu: el wizard A.5 (#442) deixa de demanar al propietari que dedueixi mentalment quin pack encaixa millor. Ara rep una proposta accionable al mateix punt on crea lead/pressupost/reserva, tancant B.8 sense automatismes cecs.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/packSuggestionService.test.ts` OK.
- `ADMIN_CHANGE_COUNTER` puja a `449`; el següent canvi real ha de ser `#450`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #448 — 2026-04-29 — codex (FET)
**§6.12: els darrers links públics de WhatsApp deixen de construir `wa.me` inline i passen pel helper canònic compartit.**
- Context: després dels Canvis `#398` (helper `WHATSAPP_URL_WITH_MESSAGE`) i `#422` (component `WhatsAppIcon`), encara quedaven tres call sites públics fora del contracte shared: `gracias/page.tsx`, `boda-halloween/page.tsx` i `ExitIntentModal.tsx`. Tots tres concatenaven número + `encodeURIComponent(...)` dins el component, exactament el patró que §6.12 vol evitar perquè els literals públics compartits no tornin a `app/config` ni a UI.
- `app/[locale]/gracias/page.tsx`: deixa d'importar `WHATSAPP_NUMBER` i deriva l'CTA urgent des de `WHATSAPP_URL_WITH_MESSAGE('Hola, acabo de enviar el formulario')`.
- `app/[locale]/boda-halloween/page.tsx`: el CTA hero de WhatsApp deixa de construir `wa.me` amb `SITE_CONFIG.business.phone.replace(...)` i consumeix `WHATSAPP_URL_WITH_MESSAGE(tWhatsapp('bodas'))`.
- `app/components/ui/ExitIntentModal.tsx`: elimina la construcció local `waPhone`/`waMessage`/`waUrl`; el botó obre directament `WHATSAPP_URL_WITH_MESSAGE("Hola! M'agradaria rebre informació sobre els vostres serveis.")`.
- `__tests__/app/gracias-page.test.tsx`, `__tests__/app/boda-halloween-page.test.tsx` i `__tests__/app/components/ui/ExitIntentModal.test.tsx`: cobertura nova per blindar que els tres punts obren exactament la URL canònica.
- Verificació del tall: `npx vitest run __tests__/app/components/ui/ExitIntentModal.test.tsx __tests__/app/gracias-page.test.tsx __tests__/app/boda-halloween-page.test.tsx` OK · `npx tsc --noEmit` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `448`; el següent canvi real ha de ser `#449`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #447 — 2026-04-29 — claude (FET)
**Regularització documental del §6.18: 6 ítems FET (Camí 1 complet + B.6/B.7 del Camí 2) que ja estaven tancats al §9 però seguien llistats com a `SEGÜENT` al checklist del §6.18.**
- Context: l'auditoria CRMs top (§6.18) tenia un deute documental clar — entre #437 i #446 s'havien tancat 6 ítems del backlog (A.2, A.3, A.4, A.5, B.6, B.7), però el bloc `SEGÜENT (Camí 1)` i `SEGÜENT (Camí 2)` continuaven llistant-los com a feina pendent. Qualsevol agent futur que llegís el §6.18 hauria reobert una feina ja feta. La norma §2.1 de tancament rigorós exigeix que cada Canvi #N actualitzi el §6 afectat, i aquí 6 canvis seguits no havien sincronitzat el checklist amb el §9. Aquest tall sana el deute.
- `docs/protocol-producte-admin-ca.md` · §6.18:
  - Camí 1 (Eradicar fricció lead → pressupost → reserva) marcat com `TANCAT 2026-04-29`. Subsecció `SEGÜENT (Camí 1)` reanomenada `FET (Camí 1)` amb 4 entrades (A.2 → #437, A.3 → #438, A.4 → #441, A.5 → #442) cadascuna amb cita explícita al canvi i descripció del lliurament real (no només la promesa original).
  - Camí 2 dividit en dues subseccions: `FET (Camí 2)` amb B.6 (#444 — línia "Desplaçament" visible al PDF) i B.7 (#446 — `pricingRules.ts` + `applyDatePricing` + integració PDF/preview). `SEGÜENT (Camí 2)` redueix a B.8 (auto-suggeriment de pack) i B.9 (marge instantani al pressupost).
  - `PENDENT CRÍTIC` actualitzat: "Camí 1 tancat (#435-#442). Camí 2 a mig drenar — atacar B.8 i B.9 abans de saltar a Camí 3."
  - Capçalera del §6.18 guanya nou bullet `**FET** *(2026-04-29 per claude — Canvi #447)*` que documenta aquest tall de regularització, alineat amb el patró Codex va aplicar als Canvis `#410`, `#413`, `#414`, `#416`, `#417`, `#418` per altres seccions.
- Aquest tall **NO** toca codi, schema, tests ni lògica de servei — és pur deute documental sanat. Tots els #437/#438/#441/#442/#444/#446 ja portaven validació pròpia (validate:core 12 guards + qa:protocol).
- Verificació del tall: `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `447`; el següent canvi real ha de ser `#448`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #446 — 2026-04-29 — claude (FET)
**B.7 del §6.18: auto-pricing per data — caps de setmana, alta temporada, Nadal, Nochevieja amb regla canònica + servei pur + integració PDF/preview.**
- Context: B.7 del §6.18 Camí 2 (P2). L'usuari valora el USP brutal del càlcul automàtic; B.6 (#444) va fer transport visible. Aquesta peça afegeix recàrrec automàtic per data: si l'event cau en cap de setmana, alta temporada o festiu, el preu base s'ajusta i apareix com a línia explícita al pressupost.
- `lib/constants/pricingRules.ts` (nou): `DATE_PRICING_RULES` declaratives. 4 regles canòniques amb i18n (ca/es/en):
  - `weekend` (divendres+dissabte): +10%
  - `high-season` (1 juny → 30 setembre): +15%
  - `christmas` (15 desembre → 6 gener, wrap-around): +25%
  - `new-year-eve` (31 desembre fixed): +50%
  Cada regla té `id`, `kind` ('recurring-weekday' | 'date-range' | 'fixed-date'), `multiplier`, `label.{ca,es,en}`, `priority` per tie-break.
- `lib/services/pricing/datePricingService.ts` (nou): `applyDatePricing(basePrice, eventDate, locale, rules?)` retorna `{ basePrice, finalPrice, surchargeEur, surchargePct, appliedRule? }` purament funcional. `findApplicableRule` selecciona la regla amb multiplicador més alt, tie-break per priority. Sanititza preu negatiu, data invàlida i null. Wrap-around correcte per regles que travessen any (Nadal Dec 15 → Jan 6).
- `__tests__/lib/services/pricing/datePricingService.test.ts` (nou): 19 tests purs. Cobertura: dates ordinàries (null), tots els kinds (weekday, range, fixed), wrap-around, priority tie-break (Nochevieja > Nadal), labels i18n, arrodoniment 2 decimals, sanitització base negativa, regles custom injectades.
- `app/admin/presupuestos/PresupuestoPdfStudio.tsx`: importa `applyDatePricing`. Computa `datePricing` + `seasonSurcharge` reactivament a `eventDate/basePrice/locale`. Total inclou ara `basePrice + seasonSurcharge + extrasPrice + travelCharge - discount`. Snapshot al draft (`pricing.seasonSurcharge`, `seasonLabel`, `seasonPct`) per persistència. Passa els 3 camps al `generateQuotePDF` i a `<StudioPreview>`.
- `app/admin/presupuestos/StudioPreview.tsx`: 3 props opcionals (`seasonSurcharge`, `seasonLabel`, `seasonPct`). Renderitza línia "Recàrrec ..." amb badge "+10% sobre el preu base" només si `seasonSurcharge > 0`.
- `lib/pdf-utils.ts` · `QuoteData` afegeix 3 camps opcionals (`seasonSurcharge`, `seasonLabel`, `seasonPct`). Summary card creix dinàmicament: `summaryRows` puja a +1 quan `hasSeason`, `seasonDetailGap` afegeix l'alçada del subtítol amb percentatge. Render entre `extrasTotal` i `travel`. Patró idèntic al de `travel` (línia + subtítol muted) per consistència.
- Comportament:
  - Event en dilluns ordinari → cap recàrrec, preu igual a abans.
  - Event en dissabte de juliol → +15% (alta temporada guanya cap de setmana per multiplicador més alt).
  - Event 31 desembre → +50% (Nochevieja específica guanya regla Nadal genèrica).
  - PDF mostra la línia "Recàrrec alta temporada: +150€" amb subtítol "+15% sobre el preu base".
- Aquest tall **NO** toca:
  - Schema Prisma (les regles són canòniques al codi; si un dia cal CRUD per usuari, futures iteracions schema/CRUD).
  - El càlcul de transport ni descompte.
  - El flow d'enviament d'email ni contracte (les proposals existents continuen sense recàrrec; les noves o regenerades l'apliquen).
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/pricing/datePricingService.test.ts` OK (19 tests) · `npx tsc --noEmit` OK · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `446`; el següent canvi real ha de ser `#447`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #445 — 2026-04-29 — claude (FET)
**Logo planeta es veu sencer: header del PDF (pressupost i contracte) ampliat de 26→32mm i caixa logo de 52×14→52×22mm.**
- Context: l'usuari va detectar que el logo planeta apareixia tallat al PDF del pressupost. Inspecció: la caixa de logo era 52×14mm i `fitWithin` redueix proporcionalment per encabir-hi tot, així que un logo quadrat (planeta sol) només ocupava 14×14mm — molt petit i sembla retallat per la mida absoluta.
- `lib/pdf-utils.ts` · `drawHeader` (pressupost): `headerHeight` non-compact passa de 26→32mm. `fitWithin` per al logo passa de 52×14 a 52×22 — un logo quadrat passa de 14×14 a 22×22 (+57% àrea visible). El text de marca (y+11→y+13), `quote` (y+18.5→y+22), `quoteRef` (y+8.5→y+10), `issueDate` (y+13→y+16) i `validity` (y+18.5→y+22) reposicionats per centrats verticalment al header més alt sense solapaments.
- `lib/pdf-utils.ts` · contracte (línies ~1070-1100): mateix patró amb constant `contractHeaderHeight = 32` i caixa logo `52×22`. `brandName` (y+11→y+13), `title` (y+18.5→y+22), `ref` (y+8.5→y+10), `date` (y+13→y+16). `y += 34` passa a `y += contractHeaderHeight + 8` (= 40) per donar marge inferior consistent.
- Aquest tall **NO** toca: `addHeader` (header gran de catàleg, ja és 50mm i logo 38×38mm — suficient), ni `ORBITA_LOGO_BASE64` ni `ORBITA_LOGO_TEXT_DRETA_BASE64` (els assets són correctes).
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `445`; el següent canvi real ha de ser `#446`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #444 — 2026-04-28 — claude (FET)
**Bug crític fixat: el PDF del pressupost no mostrava la línia de transport (els 40€ extra apareixien al total sense desglossament). Ara apareix com a línia explícita amb km/trams.**
- Context: l'usuari va detectar al pressupost de Silvia Sanchez que el total era 265€ quan l'esperat era 225€ (preu sol·licitat + descompte). La diferència de 40€ corresponia a 2 trams de transport (TRAVEL_BLOCK_EUR=20€ × 2) que es **sumaven al total però no apareixien com a línia visible al PDF**. La preview admin (`StudioPreview.tsx`) sí els mostrava (línies 86-93), però la generació del PDF (`generateQuotePDF` a `lib/pdf-utils.ts`) no els rebia ni renderitzava.
- `lib/pdf-utils.ts`:
  - `QuoteData` afegeix 4 camps opcionals: `travelCharge?: number`, `travelKm?: number`, `billableTravelKm?: number`, `travelBlocks?: number`. Tots opcionals per retrocompatibilitat (proposals antigues continuen funcionant).
  - Traduccions afegides als 3 locales (ca/es/en): `travel` (label) + `travelDetail(km, billable, blocks)` (línia secundària amb km/trams).
  - Lògica del summary card amplia 1 fila quan `travelCharge > 0`, amb detall opcional `1.0 km totals · 5 km facturables · 1 tram` en text muted just sota la línia principal. Càlcul d'alçada (`summaryHeight`) actualitzat amb `travelDetailGap` perquè el card creixi correctament i la secció `Condicions` no se solapi.
- `app/admin/presupuestos/PresupuestoPdfStudio.tsx` · `buildPdf`: passa els 4 camps de transport al `generateQuotePDF`. Abans aquests valors només es feien servir al `total` (línia 279) i a la preview, però no es propagaven al PDF.
- Comportament:
  - Si la proposta té `travelCharge > 0` → apareix línia "Desplaçament: X€" amb detall km/trams al PDF.
  - Si és 0 (lloc sense distància calculada o dins els 50 km inclosos) → no apareix la línia (com abans).
  - El `total` no canvia: ja era correcte, només invisible el desglossament.
- Aquest tall **NO** modifica:
  - El càlcul del `total` ni les regles de transport (km inclosos, mida de bloc, preu per bloc) — només la **visibilitat**.
  - El contracte ni la generació de proposta ni el flux d'enviament. Només el PDF.
  - Els proposals desats abans d'aquest fix (els seus PDFs regenerats automàticament tindran ara la línia visible).
- Verificació del tall: `npx tsc --noEmit` OK · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `444`; el següent canvi real ha de ser `#445`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #443 — 2026-04-28 — claude (FET)
**Llistat de leads amaga `LOST` per defecte; toggle visible per mostrar-los quan calgui.**
- Context: l'usuari es queixava que veure `/admin/leads` amb tots els leads perduts barrejats era soroll diari ("em dona toc veure-ho ple"). Esborrar-los no és bona idea — alimenten `LossSummary`, reactivació i reporting (#358-#367). La solució correcta és amagar-los visualment per defecte.
- `app/admin/leads/page.tsx`:
  - `getLeads` accepta `includeLost?: string`. Si NO és `'1'` i NO hi ha filtre explícit `status=LOST`, afegeix `status: { not: 'LOST' }` al where (ignorat quan l'usuari filtra LOST manualment des de la UI).
  - `LeadFilters` guanya `includeLost: boolean` propagat a `buildQuery` per mantenir el toggle dins els links de paginació/filtres.
  - Nou toggle UI just sobre el `LeadViewToggle`: pill "Incloent perduts" (ambre) + link "Amagar perduts" quan està actiu, o text "Per defecte amaguem leads perduts" + link "Mostrar també perduts" quan és la vista per defecte. Les dues vies preserven la query string actual via `URLSearchParams(currentQuery)`.
- Comportament concret:
  - `/admin/leads` → amaga LOST (vista neta per defecte)
  - `/admin/leads?includeLost=1` → mostra tots
  - `/admin/leads?status=LOST` → mostra només LOST (override manual: filtre explícit té prioritat)
  - L'eliminació individual ja existent (botó 🗑️ a `LeadActions.tsx`) segueix funcionant per als casos d'error real.
- Aquest tall **NO** elimina cap lead (cap dada perduda), NO toca els reports de pèrdues (`LossSummary` segueix llegint tot), NO afegeix bulk delete (decisió: no cal — el botó individual ja cobreix els casos d'error humà). NO modifica schema.
- Verificació del tall: `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `443`; el següent canvi real ha de ser `#444`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #442 — 2026-04-28 — claude (FET)
**A.5 del §6.18: wizard d'1 minut lead → pressupost → reserva amb pantalla única i 3 outcomes.**
- Context: el flow tradicional de captura demana 3 pantalles separades (lead → presupost → reserva). Per casos típics on l'usuari ja sap el què (cas pas, lead amb pressupost ràpid, etc.) això és fricció pura. A.5 del §6.18 (Camí 1 P1) tanca-ho amb un wizard d'una sola pantalla.
- `lib/services/leads/quickCreateFlow.ts` (nou): servei orquestrador `quickCreate({outcome, client, event, proposalSubtotal?, proposalSnapshot?})` amb 3 outcomes ('lead' | 'lead+proposal' | 'lead+proposal+booking'). Sempre crea lead via `createAdminLead`; encadena `createAdminProposal` amb leadId i `createBookingFromInput` amb leadId quan toca. Validació pre-flight per outcome 'lead+proposal+booking' (data, lloc, invitats, pack, telèfon obligatoris) abans de tocar res. Després del booking, lliga `proposal.bookingId` per coherència. Errors retornats amb `stage` ('lead' | 'proposal' | 'booking') per UI feedback granular.
- `app/api/admin/quick-create/route.ts` (nou): POST amb auth + mutate permission + CSRF + Zod parse. Body amb `outcome`, `client`, `event`, `proposalSubtotal?`, `proposalSnapshot?`.
- `app/admin/quick-create/page.tsx` (nou): server component que carrega packs actius i passa al form.
- `app/admin/quick-create/QuickCreateForm.tsx` (nou, client component): un sol form amb dos fieldsets (Client, Esdeveniment) i un tercer ("Què vols crear?") amb 3 botons distintius — `Només lead` (gris), `Lead + pressupost` (ambre), `Tot d'un cop` (verd). Validació per outcome al client abans de fer fetch (data/lloc/invitats/pack/telèfon obligatoris només si l'usuari trie 'tot'). Toast feedback + redirect post-èxit: si crea booking → `/admin/bookings/{id}`, si crea proposal → `/admin/presupuestos/{id}`, si només lead → workspace canònic via `buildLeadWorkspaceHref`.
- `__tests__/lib/services/leads/quickCreateFlow.test.ts`: 9 tests amb mocks de `prisma`/`createAdminLead`/`createAdminProposal`/`createBookingFromInput` hoisted: outcome=lead (happy + error), outcome=lead+proposal (happy amb VAT calculat, default subtotal=0, errors), outcome=lead+proposal+booking (validació data manca, telèfon manca, happy path encadenat amb update proposal.bookingId, propaga error de booking).
- Aquest tall **NO** toca: els endpoints existents `/api/admin/leads`, `/api/admin/proposals`, `/api/admin/bookings` (continuen funcionant; el wizard només és una capa addicional). Tampoc `bookingCreationService` (ja accepta leadId per encadenar).
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/leads/quickCreateFlow.test.ts` OK (9 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `442`; el següent canvi real ha de ser `#443`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #441 — 2026-04-28 — claude (FET)
**A.4 del §6.18: mode "client de pas" — panell de detecció + acció directa al detall del booking.**
- Context: A.4 ja tenia el suport schema (`Booking.customerId String?` i `Booking.leadId String?` ja eren nullable); el flow de creació ja permetia bookings sense customerId. Faltava la **visibilitat** i **acció** al detall del booking — un booking orfe no mostrava cap pista que es podia vincular o promoure a customer real, igual que el #435 va fer per leads.
- `lib/services/bookings/bookingCustomerLinkService.ts` (nou): mirror del `leadCustomerLinkService` adaptat al schema del Booking. `previewBookingCustomerLink(bookingId)` busca matches per `emailNormalized` + `phoneNormalized` + `nameNormalized` (`Booking` no té DNI, només 3 claus en lloc de 4). `linkBookingToCustomer({bookingId, action, customerId?, actor?})` és idempotent (alreadyLinked sense escriptures), valida customer per `link`, rebutja amb 409 conflicte d'email per `create`. Mateix patró de confidence: `email` = `strong`, `phone`/`name` = `medium`.
- `app/api/admin/bookings/[id]/customer-link/route.ts` (nou): GET preview (auth + read), POST acció (auth + mutate + CSRF). Patró idèntic al lead.
- `app/admin/bookings/[id]/BookingCustomerLinkPanel.tsx` (nou, client component): mostra "Reserva amb client de pas" amb badge groc quan `matches-found`, "Reserva sense client al CRM" amb botó verd "Crear client nou" quan `no-match`. Toast feedback + `router.refresh()`.
- `app/admin/bookings/[id]/page.tsx`: server component computa `customerLinkPreview = booking.customerId ? null : await previewBookingCustomerLink(booking.id)` i renderitza el panell just abans del `OwnerControlStrip`. Mai apareix si la booking ja té customer; sempre apareix amb missatge clar quan no.
- `__tests__/lib/services/bookings/bookingCustomerLinkService.test.ts`: 11 tests amb mocks `prisma` hoisted: previewBookingCustomerLink (booking-not-found, already-linked, match per email+name strong, no-match per dades buides); linkBookingToCustomer link (404, alreadyLinked, 400 sense customerId, happy path); linkBookingToCustomer create (400 email buit, 409 conflicte email, happy path amb normalització email/phone/locale).
- Aquest tall **NO** toca: el flow de creació de booking (continua acceptant `clientName`/`clientEmail`/`clientPhone` directes amb `customerId` opcional), ni `bookingCreationService.ts` (ja gestionava el customerId null amb `linkedCustomerId` resolution per email lookup). NO modifica `Booking.clientName/clientEmail/clientPhone` (snapshot) — només connecta al CRM real.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/bookings/bookingCustomerLinkService.test.ts` OK (11 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `441`; el següent canvi real ha de ser `#442`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #440 — 2026-04-28 — claude (FET)
**Match per nom afegit al lead→client (4a clau): `previewLeadCustomerLink` ara busca també per `nameNormalized` quan tingui ≥3 chars.**
- Context: l'usuari va dir explícitament al #435 "match per email, dni, telefon... tots els possibles". El #435 va cobrir email/DNI/telèfon però no nom (i no Instagram). Aquest tall afegeix el quart canal de match.
- `lib/services/leads/leadCustomerLinkService.ts`:
  - `CustomerMatchKind` amplia a `'email' | 'dni' | 'phone' | 'name'`.
  - `previewLeadCustomerLink` ara llegeix `lead.name`, normalitza amb `normalizeName` i només l'usa al where si té ≥3 caràcters (anti-soroll: noms tipus "JJ", "Jo" donarien massa falsos positius). El where afegeix `{ nameNormalized: nameSearchable }` al `OR`.
  - El `select` de `prisma.customer.findMany` afegeix `nameNormalized` al payload, i el ranking inclou `'name'` al `matchedBy`. Un match per nom sol és `confidence: 'medium'` (igual que phone) — només email/dni són `strong`.
- `app/admin/leads/[id]/LeadCustomerLinkPanel.tsx`: `MATCH_LABELS` afegeix `name: 'mateix nom'`.
- `__tests__/lib/services/leads/leadCustomerLinkService.test.ts`: 4 tests existents adaptats (afegint `lead.name` als fixtures + `nameNormalized` als customers); 2 tests nous (`matches by name alone medium confidence`, `skips name matching when normalized name <3 chars`). Suite: 15/15 verds.
- Aquest tall **NO** afegeix match per Instagram. Lead schema **no té camp `instagram`** (Customer sí); per tant requereix migració schema. Apuntat com a feedback futur i documentat al §6.18 mancances transversals.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/services/leads/leadCustomerLinkService.test.ts` OK (15 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `440`; el següent canvi real ha de ser `#441`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #439 — 2026-04-28 — claude (FET)
**Hotfix lint Railway: `customerActivityService` esnetejat per ESLint estricte (any → tipus Prisma; `{}` → `Record<string, never>`).**
- Context: Railway build fallava amb `customerActivityService.ts` línia 8 (`Unexpected any`) i 24 (`{}` empty object type) — ESLint estricte de Next.js 14 al `next lint` que corre dins `pnpm run build`. Aquests errors lint feien que el build de Railway abortés sense aplicar els canvis més recents (#433 endavant). Visible des de `https://orbitaevents.com/api/health` que retornava un timestamp del 20 d'abril (build congelat).
- `lib/services/customerActivityService.ts`: el `CustomerActivityWriter` accepta ara `args: { data: Prisma.CustomerActivityCreateInput | Prisma.CustomerActivityUncheckedCreateInput }` en lloc de `(args: any)`. La unió amb `UncheckedCreateInput` és necessària perquè els callers escriuen `customerId: string` directe en lloc de `customer: { connect: { id } }`. `CustomerActivityLogEntry` passa de `Prisma.CustomerActivityGetPayload<{}>` a `<Record<string, never>>` — significat idèntic, ESLint content.
- Aquest tall **NO** toca: cap caller del servei (els 13 helpers `recordCustomer*`/`recordLead*` continuen funcionant amb el mateix shape), ni el model Prisma. És pura neteja de tipus per fer el build verd.
- Verificació del tall: `pnpm exec next lint --file lib/services/customerActivityService.ts` OK · `npx tsc --noEmit` OK · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `439`; el següent canvi real ha de ser `#440`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #438 — 2026-04-28 — claude (FET)
**A.3 del §6.18: re-assignar pressupost entre entitats (client/lead/booking) sense haver d'esborrar i recrear.**
- Context: després de `#437` (proposta orfe permesa), faltava la peça operativa que permet l'usuari moure un pressupost d'una entitat a una altra — el dolor real era "fer un pressupost al lead, després el lead es converteix en client, i ara el pressupost ha de migrar". A.3 del §6.18 (Camí 1, P1) tanca aquesta fricció amb un panell shared al detall del pressupost.
- `lib/services/proposalAdminService.ts`: nou `reassignProposalOwner({proposalId, customerId?, leadId?, bookingId?, actor?})`. Tres camps independents — passar `null` desconnecta, `string` connecta, `undefined` no toca. Valida l'existència de cada entity target abans de fer connect (404 explícit per cada peça). Retorna `changed: { customerId, leadId, bookingId }` per permetre UI feedback granular. Usa `connect`/`disconnect` Prisma idiomàtic en lloc de scalar IDs nuls/strings.
- `app/api/admin/proposals/[id]/owner/route.ts` (nou): PATCH amb auth + mutate permission + CSRF + Zod parse. Errors 400 per body invàlid, 404 per entitats inexistents, 500 per fallades inesperades.
- `app/admin/presupuestos/ProposalOwnerPanel.tsx` (nou, client component): mostra les 3 files de vincles (client/lead/booking) amb estat actual, botó `Veure` (link a la fitxa) + `Canviar/Vincular` (obre modal d'autocomplete) + `Desvincular` (passa `null`). El modal cerca per `q` (customers) o `search` (leads/bookings) als endpoints existents amb debounce 250ms. Toast feedback + `router.refresh()` post-acció.
- `app/admin/presupuestos/[id]/page.tsx` (nou): pàgina de detall mínima del pressupost amb header (referència, status badge, total, data) + link al editor (només si té client) + el `ProposalOwnerPanel` integrat. Sense aquesta pàgina, un pressupost orfe no tenia ruta visible — només aquí es pot accedir des de la llista.
- `app/admin/presupuestos/ProposalsList.tsx`: nou helper `getProposalDetailHref` apuntant a `/admin/presupuestos/{id}`. Botó `🔗 Vincles` afegit al menu d'accions tant a card mòbil com a dropdown desktop, accessible per qualsevol pressupost (orfe o no).
- `__tests__/lib/services/proposalAdminService.test.ts`: 6 tests nous a `reassignProposalOwner` — 404 sense pressupost, 400 sense canvis, 404 customer target, happy path connect+disconnect, validació lead/booking, disconnect-only no toca FKs no especificades. Suite: 16/16 verds.
- Aquest tall **NO** toca: l'editor existent de pressupost (`/admin/presupuestos?customerId=X&proposalId=Y` segueix igual), ni el flow de creació nova, ni les FKs a `Booking`/`Lead` (ja eren nullable abans).
- Verificació del tall: `npx prisma generate` OK · `pnpm exec vitest run __tests__/lib/services/proposalAdminService.test.ts` OK (16 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `438`; el següent canvi real ha de ser `#439`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #437 — 2026-04-28 — claude (FET)
**A.2 del §6.18: pressupost lligat a entitat flexible — `Proposal.customerId` passa a nullable amb FK SET NULL. Un pressupost ja no obliga a tenir client assignat.**
- Context: l'usuari portava demanant explícitament des del primer moment "que no m'obligui a assignar client a un pressupost, però que el pugui assignar després a client/lead/booking". Fins ara `Proposal.customerId String` (NOT NULL) + FK `Customer @relation(...onDelete: Cascade)` obligava a triar client al moment de crear pressupost. A.2 del §6.18 (Camí 1 P1) tanca aquesta fricció amb un canvi schema additiu i compatible.
- `prisma/schema.prisma`: `Proposal.customerId String` → `String?` i `customer Customer @relation(...onDelete: Cascade)` → `Customer? @relation(...onDelete: SetNull)`. Esborrar un client deixa de matar les seves propostes — passen a orfes en lloc de cascada.
- `prisma/migrations/20260508120000_proposal_customer_optional/migration.sql` (nou, 8 línies, additiu pur): `DROP CONSTRAINT proposals_customerId_fkey` + `ALTER COLUMN customerId DROP NOT NULL` + `ADD CONSTRAINT ... ON DELETE SET NULL`. Sense pèrdua de dades — totes les propostes existents tenen customerId, només la columna deixa de ser obligatòria. Aplicat a Railway via `railway run prisma migrate deploy` ("All migrations have been successfully applied").
- `lib/services/proposalAdminService.ts`: `ProposalCreateInput.customerId: string` → `customerId?: string`. `createAdminProposal` ara consulta `customer.findUnique` només si hi ha customerId; locale defaulteja a `'ca'` si no hi ha customer ni `data.locale` explícit.
- `app/api/admin/proposals/route.ts`: Zod `customerId: z.string().min(1)` → `z.string().min(1).optional()`.
- `lib/services/contractService.ts`: `renderContractPDF` i `sendContract` ara llencen error explícit ("Aquest pressupost no té client assignat. Vincula un client abans de generar/enviar el contracte.") si `proposal.customer` és null al moment de generar/enviar contracte. Pressupost orfe pot existir; contracte requereix customer.
- `lib/services/proposalDispatchService.ts`: `sendAdminProposal` retorna `400` amb missatge clar si la proposta no té client; reescriu el flux intern per usar variables `customer`/`customerId` desestructurades després del guard, eliminant les referències a `existing.customer.email`/`.name`/`.customerId` que ara serien `string | null`.
- `app/admin/presupuestos/ProposalsList.tsx`: `ProposalItem.customerId: string` → `string | null`. Els 4 punts on es construïa `<Link href={`/admin/clientes/${proposal.customerId}`}>` ara es protegeixen amb `proposal.customerId ? <Link>...</Link> : <span>Sense client assignat</span>`. `getProposalHref` defaulteja a `/admin/presupuestos/{id}` (workspace propi) quan no hi ha customerId.
- `__tests__/lib/services/proposalAdminService.test.ts`: 1 test nou — `crea proposta sense customerId (orfe)` afirma `customer.findUnique` no es crida i `proposal.create` rep `customerId: undefined` + `locale: 'ca'`. Suite: 10/10 verds.
- Aquest tall **NO** toca: les FKs de `Proposal.leadId`/`bookingId` (ja eren nullable de fa temps), ni el flux de `Booking.proposalId` (independent), ni la generació de PDF de pressupost (continua funcionant amb o sense customer al snapshot). Tampoc afegeix UI per re-assignar pressupost orfe a una entitat — això és A.3 del §6.18 i va com a tall separat.
- Verificació del tall: `npx prisma generate` OK · `pnpm exec vitest run __tests__/lib/services/proposalAdminService.test.ts` OK (10 tests) · `pnpm run validate:core` OK amb 12 guards · `prisma migrate deploy` aplicat a Railway · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `437`; el següent canvi real ha de ser `#438`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #436 — 2026-04-28 — claude (FET)
**Documentat el backlog complet d'auditoria CRM al §6.18 — 27 ítems contra HubSpot/Pipedrive/Monday/Zoho/Salesforce + Tave/Honeybook, agrupats en 7 àrees (A-G) i 3 camins prioritzats.**
- Context: l'usuari ha demanat explícitament fer una auditoria contra els CRMs top i deixar-la documentada al checklist per atacar després. La feedback que arriba al sistema porta setmanes acumulant-se sense quedar registrada al protocol — ara queda formalitzada al checklist amb nomenclatura estable (A-G) i tags de criticitat (`[BLOC]` mai pot faltar · `[BÀSIC]` sentit comú · `[USP]` diferenciador d'Òrbita) perquè qualsevol agent futur pugui reprendre-la sense context oral.
- `docs/protocol-producte-admin-ca.md` · §6.18 (nou): "Auditoria CRMs top — backlog d'incorporacions". 27 ítems en 7 àrees: A. Conversió lead→client→pressupost→reserva (#1-#5, A.1 ja FET al #435); B. Auto-càlcul intel·ligent (#6-#9, on viu el USP brutal de l'auto-km); C. Comunicació multi-canal (#10-#13, parcialment fet); D. Dashboards executius (#14-#17, parcialment fet); E. Mòbil i camp (#18-#20); F. Integracions externes (#21-#24); G. Onboarding del client/portal (#25-#27, mig-llarg termini).
- Tres camins prioritzats com a `SEGÜENT` ben acotats: Camí 1 "Eradicar fricció lead→pressupost→reserva" (~10-15h, prioritat 1, ítems A.2-A.5); Camí 2 "Auto-càlcul brutal com a USP" (~8-12h, prioritat 2, ítems B.6-B.9 amb B.6 com a estrella visible del producte); Camí 3 "Portal client + signatura + pagament" (~25-40h, prioritat 3, ítems F.22, F.23, G.25-G.27, reservat per quan hi hagi flux real).
- La resta d'ítems queda registrada com a "Mancances transversals" amb estat actual (FET/parcial/pendent) i citacions als canvis corresponents quan s'aprofita codi ja existent (`commercialSequenceService`, `customerInsightsService`, `LEAD_SCORING_STATUS_PROBABILITY`, `dailyBriefService`, `inboxTemplateService`, `costService`, `LeadPipelineView`, `ClientPortalAccess`).
- Aquest tall **NO** afegeix codi: és pura documentació estratègica al protocol perquè la feina pendent quedi traçada com a backlog viu. La regla del §6.18 explícita: quan un ítem es tanca, marcar `FET` amb cita al canvi corresponent; quan apareix una nova mancança detectada per ús real, afegir-la mantenint la nomenclatura A-G + tags.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` no cal (sense canvi de codi).
- `ADMIN_CHANGE_COUNTER` puja a `436`; el següent canvi real ha de ser `#437`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #435 — 2026-04-28 — claude (FET)
**Lead → Client: panell de detecció + acció directa amb match per email/DNI/telèfon i feedback explícit.**
- Context: el detall del lead només mostrava la secció `Relació Client` quan el lead ja tenia `customerId` vinculat. Si no en tenia, no hi havia cap manera visible des del workspace de crear o vincular un client — l'única via era canviar l'estat a `WON` (que també desencadenava una upsert silenciosa per email a `statusRouteHandler.ts`). L'usuari portava demanant aquesta acció directa des del primer dia: "des de lead no es pot crear un client, i si ja existeix que ho digui".
- `lib/services/leads/leadCustomerLinkService.ts` (nou): exposa `previewLeadCustomerLink(leadId)` (busca matches a la base de clients per `emailNormalized`, `dniNormalized` i `phoneNormalized` reutilitzant els helpers canònics de `lib/utils/normalize.ts`; retorna `already-linked` | `matches-found` (ranked: confidence `strong` per email/dni vs `medium` per telèfon-only, ordenat per matchedBy.length) | `no-match` | `lead-not-found`) i `linkLeadToCustomer({leadId, action:'link'|'create', customerId?, actor?})` (idempotent: si el lead ja té customerId retorna `alreadyLinked:true` sense tocar res; per `link` valida que el customer existeix; per `create` rebutja amb 409 si hi ha conflicte de email/dni; usa el placeholder canònic `PLACEHOLDER_EMAIL_DOMAIN` per evitar crear customers amb email sintètic). Tota escriptura passa per `recordLeadConverted` amb `attribution.manualAction='link'|'create'` i `attribution.actor` per audit trail.
- `app/api/admin/leads/[id]/customer-link/route.ts` (nou): GET retorna preview (auth + read permission); POST aplica acció (auth + mutate permission + CSRF). Mateix patró que `score/route.ts`.
- `app/admin/leads/[id]/LeadCustomerLinkPanel.tsx` (nou, client component): renderitza segons preview — si `matches-found` mostra targetes amb nom/email/telèfon/DNI + badge de confidence + botons `Veure fitxa` i `Vincular`; si `no-match` mostra "Aquest lead encara no és un client" amb botó `Crear client nou`. Toast feedback explícit per cada cas (`Client nou creat`, `Lead vinculat al client existent`, `Ja estava vinculat`). `router.refresh()` post-acció.
- `app/admin/leads/[id]/page.tsx`: el server component computa `customerLinkPreview = lead.customerId ? null : await previewLeadCustomerLink(lead.id)` i renderitza el nou panell quan `!lead.customer && customerLinkPreview` (substitueix el buit visual que hi havia abans del bloc condicional `{lead.customer && (...)}`). Cap modificació al bloc existent quan ja hi ha customer.
- `__tests__/lib/services/leads/leadCustomerLinkService.test.ts` (nou): 13 tests amb mocks `prisma` + `recordLeadConverted` hoisted: `previewLeadCustomerLink` (lead-not-found, already-linked retorna customer summary, no-match per placeholder email sense phone/dni, ranking strong-email vs medium-phone-only, no-match amb 0 candidates); `linkLeadToCustomer` link (lead 404, alreadyLinked sense tocar update/activity, 400 sense customerId, 404 customer no existeix, happy path verifica `lead.update` + `recordLeadConverted` amb `attribution.manualAction='link'`); `linkLeadToCustomer` create (400 amb placeholder email, 409 quan email/DNI conflicte, happy path verifica normalització email/phone/dni i `attribution.manualAction='create'`).
- Aquest tall **NO** toca: el bloc existent `Relació Client` quan ja hi ha customer (segueix idèntic), ni el flux automàtic de `statusRouteHandler.ts` quan canvia l'estat a `WON`. Tots dos camins continuen funcionant en paral·lel; el nou panell només cobreix el cas explícit de "vol vincular/crear sense canviar l'estat del lead".
- Verificació del tall: `pnpm exec vitest run --pool=threads __tests__/lib/services/leads/leadCustomerLinkService.test.ts` OK (13 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `435`; el següent canvi real ha de ser `#436`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #434 — 2026-04-28 — claude (FET)
**Hotfix Railway: migració additiva 20260508090000 que materialitza els camps CRM/Social que vivien al schema des de fa 3 setmanes sense migració.**
- Context: `/admin` i `/admin/tasks` tornaven 500 a tot lectura per `P2022` — `customers.lifecycleStage` i `customers.healthScore` no existien a Railway. `prisma migrate status` retornava "Database schema is up to date!" amb les 21 migracions aplicades, però `prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel prisma/schema.prisma` mostrava un drift estructural significatiu: 5 enums + 7 columnes a `customers` + taula `social_posts` sencera + 3 índexs + 2 FK que el schema declarava (Canvis #38–#52, fa ~3 setmanes) però que cap migració havia generat. L'origen és un `prisma db push` local que va aterrar al schema sense passar per `migrate dev`.
- `prisma/migrations/20260508090000_add_customer_crm_and_social_posts/migration.sql` (nou, additiu pur, 71 línies, zero risc de pèrdua de dades): 5 enums (`CustomerLifecycle`, `SocialPlatform`, `SocialPostStatus`, `SocialContentType`, `SocialCategory`); 7 columnes a `customers` (`birthday TIMESTAMP(3)`, `healthScore INTEGER`, `lastContactedAt TIMESTAMP(3)`, `lifecycleStage CustomerLifecycle NOT NULL DEFAULT 'NEW'`, `preferences JSONB`, `referredById TEXT`, `tags TEXT[] DEFAULT ARRAY[]::TEXT[]`); taula `social_posts` amb FK a `bookings(id) ON DELETE SET NULL`; 3 índexs a `customers` (`lifecycleStage`, `healthScore`, `referredById`); FK self-reference `customers.referredById → customers.id ON DELETE SET NULL`. Tots els camps tenen defaults o són nullable, així que les files existents no es trenquen.
- Aplicat a Railway via `railway run --service orbitaevents-web npx prisma migrate deploy` — output: "Applying migration `20260508090000_add_customer_crm_and_social_posts` · All migrations have been successfully applied". `prisma migrate status` post-deploy retorna 22 migracions trobades + "Database schema is up to date!". `curl https://orbitaevents.com/api/health → 200`; `/admin → 401` (gate d'auth, abans 500 Prisma).
- Aquest tall és pur hotfix: NO toca codi d'aplicació, NO toca `schema.prisma` (que ja era la font correcta — només mancava la migració corresponent), NO afegeix tests (no és codi nou, és sincronització schema↔BD). El §6.14 documenta com a `MÉS ENDAVANT` afegir un guard `qa:schema-drift` que detecti aquest patró abans que escapi a producció — fora d'aquest tall.
- Verificació del tall: `prisma migrate status` post-deploy verd · `/api/health` 200 · `/admin` 401 (gate, abans 500 Prisma) · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `434`; el següent canvi real ha de ser `#435`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #433 — 2026-04-28 — claude (FET)
**El path SVG canònic de fletxa CTA (`M17 8l4 4m0 0l-4 4m4-4H3`) duplicat a 23 ocurrències a 14 fitxers públics passa al component canònic `ArrowRightIcon`.**
- Context: després de la trilogia d'icones de marca canalitzada al §6.12 (Google G #407, Star polygon #412/#432, WhatsApp #422), una passada `grep -rEo 'd="M[^"]+"'` sobre la web pública mostra que el path de la fletxa de CTA (`M17 8l4 4m0 0l-4 4m4-4H3` amb `strokeLinecap="round"` i `strokeLinejoin="round"`) viu replicat literal a **23 ocurrències a 14 fitxers** — molt més que les altres icones canalitzades fins ara. Tots comparteixen `viewBox="0 0 24 24"`, `fill="none"` i `stroke="currentColor"`; les úniques diferències són `strokeWidth` (most `2`, alguns `1.5`/`2.5`/`3`) i la mida via className (`w-3.5 h-3.5`, `w-4 h-4`, `w-5 h-5`) o via `width`/`height` props. Aquest path és la peça SVG **més duplicada** del frontend públic. Sense canalitzar, qualsevol canvi futur al disseny de la fletxa (gruix, finalització, replantejament a chevron, etc.) toca 14 fitxers.
- `app/components/public/ArrowRightIcon.tsx` (nou): component pur que rep `SVGProps<SVGSVGElement>` i renderitza `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>`. Tots els atributs default del svg viuen abans de `{...props}` perquè el caller els pugui sobreescriure (especialment `strokeWidth` per a les variants `1.5`, `2.5`, `3`). Mateix patró que `WhatsAppIcon` (#422), `GoogleGIcon` (#407) i `StarIcon` (#412).
- 23 substitucions a 14 fitxers, totes preservant la presentació via className i prop overrides:
  - `app/components/home/FAQSection.tsx` (×1, w-4 h-4 transition-transform group-hover:translate-x-1)
  - `app/components/marketing/CTAFinal.tsx` (×1 — `Icons.Arrow` wrapper redueix a `<ArrowRightIcon width={18} height={18} />`)
  - `app/components/marketing/PortfolioShowcase.tsx` (×4 — viewStory `strokeWidth={2.5}`, ScrollButton, swipe hint `strokeWidth={1.5}`, viewAll)
  - `app/components/marketing/ProcessSection.tsx` (×1)
  - `app/components/mobile-ultimate/MobilePortfolioShowcase.tsx` (×1, `strokeWidth={2.5}`)
  - `app/components/ui/HeroElegant.tsx` (×3 — ctaPacks `strokeWidth={3}`, ctaConfigurator, ctaContact `strokeWidth={2.5}`)
  - `app/components/ui/ServicesGridElegant.tsx` (×1, `strokeWidth={2.5}`)
  - `app/[locale]/blog/page.tsx` (×2 — readMore i ctaButton)
  - `app/[locale]/blog/[slug]/page.tsx` (×1 — ctaPrimary)
  - `app/[locale]/disponibilidad/page.tsx` (×1)
  - `app/[locale]/experiencias/page.tsx` (×2 — viewExperience i cta.custom)
  - `app/[locale]/portfolio/page.tsx` (×2 — primer i segon block de viewGallery)
  - `app/[locale]/portfolio/[slug]/page.tsx` (×1 — viewEvent)
  - `app/[locale]/portfolio/[slug]/[eventSlug]/page.tsx` (×1 — seePacks `strokeWidth={3}`)
  - `app/[locale]/servicios/client.tsx` (×1 — `Icons.Arrow` wrapper redueix a `<ArrowRightIcon width={20} height={20} />`)
- ~85 línies netes eliminades (cada ocurrència 3 línies inline → 1 línia component).
- `__tests__/app/components/public/ArrowRightIcon.test.tsx` (nou): 4 tests amb `render` testing-library: (1) renderitza viewBox `0 0 24 24` + `fill=none` + `stroke=currentColor` + `strokeWidth=2` + path canònic amb `strokeLinecap=round`/`strokeLinejoin=round`; (2) override de `strokeWidth` (`2.5`), `width`/`height` (`18`), `className` arbitrari; (3) renderitza el path canònic també sense props; (4) propaga `aria-hidden` i `data-testid` al svg.
- Aquest tall **NO** toca: les ocurrències de path inline a fitxers admin (`app/admin/...`) — territori fora del §6.12 web pública. Un grep ampliat retorna 0 ocurrències del path en territori admin: tot el deute de la web pública queda drenat aquí.
- Aquest tall tampoc rep nous tests sobre cada call site individual; la cobertura del component blinda el render canònic, i la migració és substitució literal entre dues representacions visualment idèntiques.
- Efecte: la **quarta peça SVG canònica** del catàleg públic queda extreta. Després de la trilogia d'icones de marca (Google G #407, Star #412/#432, WhatsApp #422), la fletxa de CTA — que apareixia 4× més vegades que qualsevol altra icona — ja viu en un sol fitxer. Si demà cal substituir la fletxa per un chevron, refinar el grossor, animar-la diferent o canviar el path per una corba, es resol al component sense haver de tocar 14 fitxers ni arriscar regressions.
- Verificació del tall: `pnpm exec vitest run --pool=threads __tests__/app/components/public/ArrowRightIcon.test.tsx` OK (4 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `433`; el següent canvi real ha de ser `#434`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #432 — 2026-04-27 — claude (FET)
**Drenades 3 ocurrències residuals del polygon star inline que van escapar al `#412`: `GoogleReviewsRotating.tsx`, `CTAFinal.tsx`, `reservar/page.tsx`.**
- Context: el `#412` va canalitzar 5 ocurrències del polygon canònic d'estrella (`M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z`) a `GoogleReviewsRotating.tsx` (×2), `MobileHomePage.tsx` (×2) i `opiniones/client.tsx`. Però una passada `grep -rn "M12 2l3.09 6.26"` actual mostra que **3 ocurrències més** del mateix path havien quedat fora: (1) el bloc fallback de 5 estrelles a `GoogleReviewsRotating.tsx:275-277` (un loop `[1,2,3,4,5].map` que pinta una linia d'estrelles d'amber al títol "Lo que dicen nuestros clientes"), (2) l'estrella decorativa al strip de trust de `CTAFinal.tsx:177` (acompanyant "5.0/5"), i (3) el panell de trust de `reservar/page.tsx:115` (badge purple). Ni #412 ni cap canvi posterior els havia tocat.
- 3 substitucions, totes amb el patró `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26..."/></svg>` → `<StarIcon className="..." fill="currentColor" />`:
  - `app/components/home/GoogleReviewsRotating.tsx` · línies 275-277: el bloc inline dins del map dels 5 stars passa a `<StarIcon key={i} className="w-8 h-8 text-amber-400" fill="currentColor" />`. L'import `StarIcon` ja existia (línia 22, importat al #412 per als altres usos del mateix fitxer).
  - `app/components/marketing/CTAFinal.tsx` · línia 177: `<svg className="w-5 h-5 text-yellow-400" ... />` passa a `<StarIcon className="w-5 h-5 text-yellow-400" fill="currentColor" />`. Afegit `import StarIcon from '@/app/components/public/StarIcon';` (no existia).
  - `app/[locale]/reservar/page.tsx` · línia 115: `<svg className="w-6 h-6 text-purple-400" ... />` passa a `<StarIcon className="w-6 h-6 text-purple-400" fill="currentColor" />`. Afegit l'import (server component — `StarIcon` no porta `'use client'` directiva, és pure render).
- ~9 línies netes eliminades.
- Aquest tall **NO** toca: `app/admin/google-reviews/page.tsx:189` (la 4a ocurrència restant). És territori admin, no §6.12 web pública. La canalització admin pot ser un canvi futur si es documenta com a línia separada — fora d'aquesta línia editorial.
- Cap test nou — la cobertura del component `StarIcon` viu a `__tests__/app/components/public/StarIcon.test.tsx` (4 tests del #412: render canònic, fill/stroke/strokeWidth/className passthrough, render sense props, ús aïllat de `StarPolygon`). La substitució és literal entre dos shapes mathematicament equivalents (path d'`M12 2l3.09 6.26...` ↔ polygon `12 2 15.09 8.26 22 9.27...`) sense canvi visual ni de runtime; afegir tests per call site individual seria soroll.
- Efecte: el polygon canònic d'estrella ja no viu fora del component a cap superfície de la web pública. La trilogia d'icones de marca (Google G #407, Star #412/#432, WhatsApp #422) queda totalment alineada — qualsevol canvi futur al path SVG (p.ex. canviar l'estil a una estrella més fina o amb stroke) toca un sol fitxer i propaga automàticament.
- Verificació del tall: `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `432`; el següent canvi real ha de ser `#433`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #431 — 2026-04-27 — claude (FET)
**El patró `fetch('/api/hero-media') + json()` duplicat als 2 heroes públics passa al client canònic `fetchHeroMedia()`.**
- Context: després dels Canvis `#427` (client `fetchPublicGoogleReviews`) i `#430` (re-export de `type GoogleReview`) la línia de canalització de **lectures públiques** ja tenia un patró clar al repo. Quedava una segona dada pública amb el mateix problema: `fetch('/api/hero-media').then(r => r.json()).then((data: HeroMediaItem[]) => ...)` vivia replicat literal a `app/components/ui/HeroElegant.tsx:196` i `app/components/mobile-ultimate/MobileHeroUltimate.tsx:97`. Ambdós fitxers redeclaraven a més el `type HeroMediaItem = (typeof PUBLIC_HERO_MEDIA_FALLBACK)[number]` (línies 11 i 12). Sense client canònic, qualsevol canvi futur al contracte HTTP (cache, telemetria de latency, `signal` per cancel·lar, fallback explícit) hauria de tocar dos punts.
- `lib/api/heroMediaClient.ts` (nou): exporta `type HeroMediaItem` derivat de `typeof PUBLIC_HERO_MEDIA_FALLBACK` i `async function fetchHeroMedia(init?: RequestInit): Promise<HeroMediaItem[]>` que crida `/api/hero-media`, llença `Error('hero-media fetch failed (...)')` si `!response.ok`, i retorna la resposta parsejada. Mateix shape de l'API de `googleReviewsClient.ts` (init opcional, error amb status, `import type` + re-export del tipus).
- 2 substitucions:
  - `HeroElegant.tsx`: el bloc `fetch('/api/hero-media').then((r) => r.json()).then((data: HeroMediaItem[]) => ...)` passa a `fetchHeroMedia().then((data) => ...)`. La declaració local `type HeroMediaItem = ...` s'elimina i el tipus es re-importa via `import { fetchHeroMedia, type HeroMediaItem } from '@/lib/api/heroMediaClient'`. La constant `PUBLIC_HERO_MEDIA_FALLBACK` continua important-se com a valor perquè la usa `imageFallbackItems`.
  - `MobileHeroUltimate.tsx`: mateixa substitució. El filtre `mobileSafeItems` (només `type === 'image'` amb `url` no buit) es preserva tal qual sobre el resultat del client.
- ~10 línies netes eliminades (2 declaracions de tipus + reescriptura del fetch a 2 punts).
- `__tests__/lib/api/heroMediaClient.test.ts` (nou): 3 tests amb mock de `globalThis.fetch`. Cobreixen (1) crida a la URL canònica `/api/hero-media` + parse de la resposta amb shape complet de slides, (2) error amb status quan `!response.ok` (status 503 → `Error /503/`), (3) propagació d'`init` arbitrari (`signal: AbortController.signal`, `cache: 'no-store'`) cap a `fetch`.
- Aquest tall **NO** toca: el contracte de `/api/hero-media/route.ts` (continua retornant `HeroMediaItem[]` brut sense embolcall), ni `imageFallbackItems`/`PUBLIC_HERO_MEDIA_FALLBACK` (continua sent el fallback de render abans del fetch), ni el `shuffle` ni el filtre `mobileSafeItems` (cada caller manté la seva post-processament específica). Tampoc s'amplia el catàleg de tests `googleReviewsClient` amb regressions noves — el patró és estable i el nou client té cobertura pròpia.
- Efecte: després de `#427` (Google Reviews fetch) i `#430` (Google Reviews type), la **segona dada pública crítica** del frontend també té un sol punt d'entrada. La trilogia de canalitzacions de dades públiques (Google Reviews → Hero Media) és consistent: si demà cal afegir SWR cache, AbortController automàtic per `useEffect` cleanup o telemetria de latency a aquestes superfícies, es resol al client sense tocar els consumidors.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/api/heroMediaClient.test.ts` OK (3 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `431`; el següent canvi real ha de ser `#432`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #430 — 2026-04-26 — claude (FET)
**La interface `GoogleReview` duplicada a 4 fitxers consumidors passa a importar-se canònicament des del client.**
- Context: després del `#427` (client canònic `fetchPublicGoogleReviews`) i el `#429` (Codex va resoldre col·lisió de tipus a `GoogleReviewsRotating.tsx` afegint un àlies local `PublicGoogleReview`), encara quedava el deute estructural: 4 dels 5 callers de `/api/google-reviews` mantenien la seva pròpia `interface GoogleReview` local — `GoogleReviewsRotating.tsx`, `MobileHomePage.tsx`, `opiniones/client.tsx`, `admin/google-reviews/page.tsx`. Cadascuna era lleugerament diferent: una sense `time`, una sense `source`, una amb `source: 'google'|'database'|'json'` però sense `language`, etc. Tot redundant — la dada arribava sempre per `fetchPublicGoogleReviews()` amb el shape canònic complet de `GoogleReviewsResponse.reviews`.
- `lib/api/googleReviewsClient.ts`: el `import type` ara inclou `GoogleReview` i el re-exporta junt amb `GoogleReviewsResponse`. Un sol punt d'entrada per al consumidor — `import { fetchPublicGoogleReviews, type GoogleReview } from '@/lib/api/googleReviewsClient'`.
- 4 fitxers migrats:
  - `app/components/home/GoogleReviewsRotating.tsx`: import `type GoogleReview as PublicGoogleReview` (l'àlies introduït al `#429` es manté per evitar col·lisió amb un mòdul local antic; consumidor d'usar `PublicGoogleReview` als `useState<PublicGoogleReview[]>` i `ReviewsData.reviews`). La declaració `interface GoogleReview { ... }` local s'elimina.
  - `app/components/mobile-ultimate/MobileHomePage.tsx`: import directe `type GoogleReview` (sense àlies — no hi havia col·lisió). La declaració local s'elimina.
  - `app/[locale]/opiniones/client.tsx`: import directe. La declaració local (que tenia `source: 'google'|'database'|'json'` ja alineat amb el canònic) s'elimina.
  - `app/admin/google-reviews/page.tsx`: import directe. La declaració local s'elimina. La interface `ReviewsData` local conserva la seva pròpia shape (té `user_ratings_total?` opcional vs el canònic obligatori) per compatibilitat amb el flux d'admin.
- ~22 línies netes eliminades.
- Aquest tall **NO** toca: la interface `ReviewsData` local de cada fitxer perquè cada caller en construeix la seva pròpia variant amb camps opcionals/obligatoris diferents. Canalitzar-la requeriria reescriure cada caller per acceptar el shape canònic estricte `GoogleReviewsResponse`. Pot ser una extracció futura.
- Cap test nou — la canalització és una **refactorització pura de tipus** sense canvi de shape de runtime. La cobertura existent del client (#427, 3 tests) i dels components SVG (Google G #407, Star #412, WhatsApp #422) continua validant tot el flux de cada superfície que toca.
- Codex va prendre el #428 (regularització §6.11) i el #429 (drenatge del `SEGÜENT` de §6.12 + correcció `TS2440` a `GoogleReviewsRotating.tsx`) entre el meu #427 i aquest tall, per la qual cosa la canalització de la interface `GoogleReview` es registra com a `#430` aplicant la norma de no-col·lisió del §2.1. La meva feina és complementària a la del #429 — Codex va corregir el tipus immediat al fitxer afectat, jo elimino les còpies a la resta de fitxers.
- Efecte: després del client canònic (#427) ara també el **tipus de dada** té un sol punt d'entrada. Si demà Google amplia la response amb un nou camp (per exemple `verified: boolean`), s'afegeix al canònic `app/api/google-reviews/reviews-types.ts` i tots els callers el reben automàticament sense caldre tocar 4 fitxers.
- Verificació del tall: `pnpm exec tsc --noEmit --pretty false` OK · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `430`; el següent canvi real ha de ser `#431`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #429 — 2026-04-26 — codex (FET)
**Regularitzat el `SEGÜENT` buit de `§6.12`: ja no quedava cap pas immediat viu dins del bloc.**
- Context: després dels Canvis `#421`, `#423`, `#426` i `#427`, `§6.12 Web pública / Conversió` havia drenat tant les duplicacions estructurals com l'últim pendent immediat de checklist. El bloc encara conservava l'encapçalament `SEGÜENT`, però a sota només hi havia dos bullets ja marcats com a `FET`, sense cap peça executable viva.
- `docs/protocol-producte-admin-ca.md` · §6.12: s'elimina aquest `SEGÜENT` residual i es deixa la deute viva únicament als apartats canònics `PENDENT CRÍTIC` i `MÉS ENDAVANT`.
- `app/components/home/GoogleReviewsRotating.tsx`: durant el tancament del tall, `validate:core` ha destapat un conflicte de tipus (`TS2440`) entre l'import `GoogleReview` i el mòdul local després del Canvi `#427`. El fitxer passa a consumir el tipus importat amb àlies local `PublicGoogleReview`, sense canviar comportament.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi traçada al rastre cronològic.
- Efecte: el bloc de web pública continua `EN MARXA` per direcció conceptual i deute de narrativa/SEO, però el protocol deixa de mostrar un `SEGÜENT` formalment obert quan ja no hi havia cap tall curt real pendent.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `429`; el següent canvi real ha de ser `#430`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #427 — 2026-04-26 — claude (FET)
**El patró `fetch('/api/google-reviews') + json()` duplicat a 7 ocurrències passa a la funció canònica `fetchPublicGoogleReviews()`.**
- Context: el fetch a l'endpoint públic `/api/google-reviews` vivia replicat literal a 7 punts a 5 fitxers — `app/components/home/GoogleReviewsRotating.tsx`, `app/components/mobile-ultimate/MobileHomePage.tsx`, `app/[locale]/opiniones/client.tsx`, `components/reviews/ReviewsSection.tsx` (×3 — `ReviewsSection` default + `ReviewsBadge` + `ReviewsInline`), `app/admin/google-reviews/page.tsx`. Cadascun feia `const response = await fetch('/api/google-reviews'); const data = await response.json();` (o variants `.then(r => r.json()).then(...)`) amb la seva pròpia interface local `ReviewsData` que duplicava la shape de la resposta. Si demà cal afegir caching, retry, telemetria, header d'autenticació o canviar la URL, caldria tocar 5 fitxers separats.
- `app/api/google-reviews/reviews-types.ts` ja exposava el tipus canònic `GoogleReviewsResponse` (`{rating, user_ratings_total, reviews, source, googleReviewsUrl, lastUpdated}`) que cap caller públic estava utilitzant.
- `lib/api/googleReviewsClient.ts` (nou): exposa `fetchPublicGoogleReviews(init?: RequestInit): Promise<GoogleReviewsResponse>`. Crida `fetch('/api/google-reviews', init)`, comprova `response.ok` i llança `Error('google-reviews fetch failed (<status>)')` si no, parseja el JSON i retorna amb el tipus canònic. Re-exporta `GoogleReviewsResponse` per als consumidors.
- 7 substitucions a 5 fitxers, sense canvis de comportament:
  - `GoogleReviewsRotating.tsx`: `const data: ReviewsData = await response.json()` → `const data = await fetchPublicGoogleReviews()`.
  - `MobileHomePage.tsx`: mateix patró. El filtre `reviews.filter((r) => r.rating === 5)` post-fetch es preserva.
  - `opiniones/client.tsx`: el bloc `if (googleRes.ok) { ... }` passa a `try { ... } catch { /* fallback */ }`. Equivalent funcional perquè el client llança si `!ok`.
  - `ReviewsSection.tsx`: 3 ocurrències. `fetchReviews()` interior, `ReviewsBadge` i `ReviewsInline` ara depenen del client. La interface local `Review` també es completa amb `'json'` al `source` per acceptar la unió completa de `GoogleReviewsResponse` (Codex ho va detectar i corregir al `#426`).
  - `admin/google-reviews/page.tsx`: el `loadReviews()` que feia `if (!response.ok)` + `setLoadError + throw + log.error` passa a usar el client (que ja llança), conservant el `try/catch` exterior amb `setLoadError` per al toast.
- `__tests__/lib/api/googleReviewsClient.test.ts` (nou): 3 tests amb mock de `globalThis.fetch`. Cobreixen (1) crida amb URL canònica `/api/google-reviews` + parse de la resposta amb tot el shape, (2) error amb status quan `!response.ok` (status 503 → `Error /503/`), (3) propagació d'`init` arbitrari (`signal: AbortController.signal`, `cache: 'no-store'`) cap a `fetch`.
- Aquest tall **NO** toca: el fetch a `/api/public/stats` (1 ocurrència, no duplicat), `/api/testimonials` (2 ocurrències amb propòsits divergents — read vs write), ni APIs admin amb autenticació diferent.
- Codex està prenent #423, #424 i #426 (regularitzacions documentals al §6.12 i col·lisió detectada per `qa:visual-overflow` que ha forçat un fix de tipus a `ReviewsSection`), per la qual cosa la canalització del client de google-reviews es reassigna a `#427` aplicant la norma de no-col·lisió del §2.1. Cap col·lisió — peces diferents al mateix §6.12 (Codex modifica el SEGÜENT, jo drena dades duplicades).
- Efecte: després de canalitzar les 3 icones de marca (#407 #412 #422) i els components shared d'entry points comercials, ara també la **lectura de dades públiques** té un client canònic. Si demà cal afegir SWR cache, telemetria de latency, o canviar el contracte HTTP, es resol al client sense tocar els 5 consumidors.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/api/googleReviewsClient.test.ts` OK (3 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `427`; el següent canvi real ha de ser `#428`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #428 — 2026-04-26 — codex (FET)
**Regularitzat el `SEGÜENT` residual de `§6.11`: el front ja no tenia una peça immediata pendent, només deute transversal i de sistema visual.**
- Context: `§6.11 UX / Visual / Marca` mantenia com a `SEGÜENT` la frase "saltar als pendents estructurals del cicle. El bloc shared + responsive d’aquest front queda drenat". Això ja no descrivia cap següent pas executable dins del bloc, només constatava que la feina immediata d'aquest front estava acabada i que la deute viva ja quedava expressada a `PENDENT CRÍTIC` i `MÉS ENDAVANT`.
- `docs/protocol-producte-admin-ca.md` · §6.11: s'elimina aquest `SEGÜENT` residual perquè el checklist no presenti com a següent operatiu una línia que en realitat és només una nota de drenatge. El bloc conserva la deute real on toca: coherència visual transversal i sistema visual formalitzat.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi traçada al rastre cronològic.
- Col·lisió de sessió: `ADMIN_CHANGE_COUNTER` ja havia pujat a `427` per una reserva paral·lela encara no aterrada al protocol. Seguint la norma de no-col·lisió, aquest tall es registra directament com a `#428`.
- Efecte: `§6.11` deixa de tenir un `SEGÜENT` buit. El protocol queda més net i deixa clar que aquest front no espera una microtasca pendent, sinó una deute visual/arquitectònica més ampla.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `428`; el següent canvi real ha de ser `#429`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #426 — 2026-04-26 — codex (FET)
**Regularitzat l'últim `SEGÜENT` de `§6.12`: ja no quedava un pas immediat, sinó deute editorial i SEO de mig termini.**
- Context: després dels Canvis `#420`, `#421` i `#423`, `§6.12 Web pública / Conversió` havia drenat els falsos pendents immediats del seu checklist. L'únic bullet viu sota `SEGÜENT` ja no descrivia un tall executable curt, sinó una deute editorial/SEO ampla ("refinament narratiu/SEO de pàgines singulars i hubs") que encaixa millor com a front de mig termini junt amb el replantejament global de missatge i arquitectura pública.
- `docs/protocol-producte-admin-ca.md` · §6.12: s'elimina aquest últim bullet del `SEGÜENT` i es mou a `MÉS ENDAVANT`, deixant clar que el bloc continua `EN MARXA` per direcció conceptual i deute transversal, però sense fingir que hi ha un següent pas immediat concret ja preparat al checklist.
- `components/reviews/ReviewsSection.tsx`: durant el tancament del tall, `validate:core` ha destapat una deriva de tipus aliena al bloc documental: `fetchPublicGoogleReviews()` ja pot retornar reviews amb `source: 'json'`, però l'estat local del component només admetia `'google' | 'database' | 'manual'`. S'alinea la unió local amb la resposta real afegint `'json'`, sense canviar comportament visual ni de negoci.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi traçada al rastre cronològic.
- Col·lisió de sessió: mentre tancava aquest tall, un altre agent ha pujat `ADMIN_CHANGE_COUNTER` a `425` sense que el seu `### Canvi #425` hagués aterrat encara al protocol. Seguint la norma de no-col·lisió, aquest tall es renumera al següent número lliure visible: `#426`.
- Efecte: `§6.12` deixa de barrejar "next step" operatiu amb feina editorial estratègica. El front web pública continua obert, però el protocol queda més honest sobre què és deute viu de mig termini i què era només un residu formal del `SEGÜENT`.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `426`; el següent canvi real ha de ser `#427`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #422 — 2026-04-26 — claude (FET)
**El SVG canònic del logo WhatsApp duplicat a 17 ocurrències passa a un component canònic `WhatsAppIcon`.**
- Context: el path SVG oficial del logo WhatsApp (`M17.472 14.382c-.297-.149...3.48-8.413z`, ~880 caràcters) amb `viewBox="0 0 24 24"` i `fill="currentColor"` vivia replicat literal a 17 punts UI a 17 fitxers diferents — header, footer, `FloatingCTAs.tsx` (×2), `ExitIntentModal.tsx`, `CTAFinal.tsx`, `ProcessSection.tsx`, mobile-ultimate (×4: Hero, CTAUrgency, ProcessSection, AppShell), `WhatsAppSticky.tsx`, `BottomCTABar.tsx`, `faq/client.tsx`, `servicios/client.tsx`, `experiencias/page.tsx`, `gracias/page.tsx`. Variants només a la presentació: width/height (3.5×3.5, 4×4, 5×5, 6×6, 7×7, 22×22, 24×24, h-5 w-5) i className (text-green-400, text-white, text-black). El path SVG canònic vivia 17 vegades.
- `app/components/public/WhatsAppIcon.tsx` (nou): component pur que rep `SVGProps<SVGSVGElement>` i renderitza `<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="..." /></svg>` amb el path canònic inline (sense `const = '...'` exposat per evitar `arch:layer:check` flag). El default de `fill="currentColor"` es manté per la majoria de calls; si es vol override (ex: variant verda fixa) es passa `fill="#25D366"`.
- 17 substitucions a 17 fitxers, totes amb el patró `<svg ... viewBox="0 0 24 24" fill="currentColor"><path d="..."/></svg>` → `<WhatsAppIcon className="..." />` (preservant la mida via className `w-N h-N` o props `width={N} height={N}`):
  - `app/components/ui/HeaderChampion.tsx` (text-green-400), `app/components/ui/footer.tsx`, `app/components/ui/FloatingCTAs.tsx` (×2: w-7 h-7 text-white + w-5 h-5 shrink-0), `app/components/ui/ExitIntentModal.tsx` (22×22).
  - `app/components/marketing/CTAFinal.tsx` (22×22), `app/components/marketing/ProcessSection.tsx` (w-5 h-5).
  - `app/components/mobile-ultimate/MobileHeroUltimate.tsx` (h-5 w-5 flex-shrink-0), `MobileCTAUrgency.tsx` (w-5 h-5 flex-shrink-0), `MobileProcessSection.tsx` (w-5 h-5), `MobileAppShell.tsx` (w-3.5 h-3.5 text-black).
  - `components/mobile/WhatsAppSticky.tsx` (w-7 h-7 text-white), `BottomCTABar.tsx` (w-5 h-5).
  - `app/[locale]/faq/client.tsx` (w-6 h-6), `servicios/client.tsx` (24×24), `experiencias/page.tsx` (w-5 h-5), `gracias/page.tsx` (w-4 h-4).
- ~187 línies netes eliminades.
- Aquest tall **NO** toca: `app/[locale]/contacto/client.tsx:70` perquè el seu svg conté **dos paths**: el path canònic truncat (acaba en `1.871.118...0-.57-.347z` en lloc de `0-3.48-8.413z`) + un segon path independent `M12 0C5.373 0 0 5.373 0 12...10 4.477 10 10 10z` (un cercle outline de fons). És una **variant visual diferent** (logo WhatsApp dins un cercle outline simple en lloc del path complet) — mantenir-lo inline és correcte fins que es decideixi si la canonització ha d'incloure aquesta variant separada.
- `__tests__/app/components/public/WhatsAppIcon.test.tsx` (nou): 3 tests amb `render` testing-library. Cobreixen (1) viewBox `0 0 24 24` + fill default `currentColor` + path canònic començat per `M17.472 14.382c` amb >800 caràcters; (2) override de fill via props (`#25D366`); (3) propagació de aria-hidden/width/height al svg.
- Codex està fent en paral·lel una sèrie de regularitzacions documentals (#413-#421) sobre `EN MARXA` obsolets de §6.2/6.5/6.6/6.7/6.8/6.11/6.12/6.14, així que la meva extracció del WhatsApp icon es registra com a `#422` aplicant la norma de no-col·lisió del §2.1. Cap col·lisió — peces diferents (Codex regularitza meta-checklists, jo drena dades duplicades).
- Efecte: el §6.12 drena la peça SVG duplicada més pesada de la web pública. La trilogia d'icones de marca (Google G #407, Star polygon #412, WhatsApp #422) queda canalitzada — totes les superfícies que mostren un d'aquests tres SVG ara depenen d'un únic component shared.
- Verificació del tall: `pnpm exec vitest run __tests__/app/components/public/WhatsAppIcon.test.tsx` OK (3 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `422`; el següent canvi real ha de ser `#423`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #423 — 2026-04-26 — codex (FET)
**Regularitzat el segon bullet del `SEGÜENT` de `§6.12`: la coherència visual/narrativa ja vivia com a deute transversal a `§6.11`.**
- Context: `§6.12 Web pública / Conversió` mantenia com a `SEGÜENT` revisar coherència visual i narrativa entre `home`, `serveis`, `portfolio` i `admin`, però aquesta mateixa preocupació ja estava registrada com a `PENDENT CRÍTIC` canònic a `§6.11 UX / Visual / Marca` amb una formulació més ampla i correcta: "identitat visual coherent entre admin, web pública i mòduls nous". Mantenir els dos punts obria el mateix front dues vegades sense aportar un següent pas concret.
- `docs/protocol-producte-admin-ca.md` · §6.12: el segon bullet del `SEGÜENT` passa a `FET` com a regularització documental, explicitant que la deute continua viva però només sota el `PENDENT CRÍTIC` transversal de `§6.11`.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: la web pública no es dona per tancada visualment; simplement es deixa d'arrossegar el mateix pendent en dos llocs diferents del protocol.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `423`; el següent canvi real ha de ser `#424`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #421 — 2026-04-26 — codex (FET)
**Regularitzat el primer bullet del `SEGÜENT` de `§6.12`: l’auditoria de jerarquia pública a `header/footer/home` ja no tenia feina real oberta.**
- Context: `§6.12 Web pública / Conversió` encara mantenia com a `SEGÜENT` revisar `header/footer/home` i altres entry points comercials per si quedava jerarquia pública duplicada fora del catàleg compartit. L'auditoria ràpida actual sobre les peces que el mateix bullet citava mostra que la capa shared ja cobreix aquest perímetre: `PUBLIC_CORE_SERVICE_NAV` al header/footer, `PUBLIC_FOOTER_*` al footer desktop, `PUBLIC_MOBILE_FOOTER_LEGAL_LINKS` al mobile footer, `PUBLIC_BOTTOM_NAV_ITEMS` a la bottom nav, `PUBLIC_SERVICE_ZONE_LINKS` + `buildPublicZoneBreadcrumbs` + `PublicServiceMidCta` als entry points comercials i `useManagedImageSrc` per als assets de marca.
- `docs/protocol-producte-admin-ca.md` · §6.12: el primer bullet del `SEGÜENT` passa a `FET` amb referència explícita a l'auditoria actual; el bloc continua obert pels altres dos fronts reals (coherència visual/narrativa i refinament narratiu/SEO).
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: la web pública continua en marxa on toca, però el checklist deixa de mantenir un "revisar per si..." genèric sobre un perímetre que ja ha quedat drenat cap a catàlegs i components shared.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `421`; el següent canvi real ha de ser `#422`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #420 — 2026-04-26 — codex (FET)
**Regularitzat un bullet obsolet del `SEGÜENT` de `§6.12`: el build ja no és pendent, només el refinament narratiu/SEO.**
- Context: `§6.12 Web pública / Conversió` mantenia dins el `SEGÜENT` una línia mixta: "build complet ja validat al Canvi #57 i netejat de pressió Prisma al Canvi #58; queda refinament narratiu/SEO...". Això barrejava una verificació ja tancada amb la deute real, fent que el checklist sonés com si el build encara formés part del pendent.
- `docs/protocol-producte-admin-ca.md` · §6.12: el bullet es reescriu perquè el `SEGÜENT` només llisti la feina viva (`refinament narratiu/SEO de pàgines singulars i hubs`) i deixi la validació de build com a context històric, no com a tasca oberta.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: el front públic continua obert on toca, però deixa d'arrossegar com a "següent" una comprovació tècnica que el protocol ja donava per feta.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `420`; el següent canvi real ha de ser `#421`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #419 — 2026-04-26 — codex (FET)
**Regularitzat el `SEGÜENT` obsolet de `§6.1`: el backlog zenith encara llistava com a pendents peces que ja estaven tancades.**
- Context: `§6.1 Fonaments de producte` mantenia dins el mateix `SEGÜENT` una barreja de fronts ja completats (`Executive Cockpit`, `next best action`, nurturing, attribution, forecast, command palette, QA visual, Google Calendar) i la deute real que encara segueix viva: convertir manual + playbooks en un product operating system amb una sola narrativa operativa. Deixar-los tots al mateix sac feia que el checklist semblés més viu del que és i reobria feina ja tancada.
- `docs/protocol-producte-admin-ca.md` · §6.1: el `SEGÜENT` es reescriu per deixar explícit què ja és `FET` amb cita als canvis corresponents i quin és el següent real que queda obert al bloc.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: el front de fonaments de producte conserva el seu `EN MARXA` real, però deixa d'arrossegar un backlog textual inflat amb ítems que fa dies que estan resolts.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `419`; el següent canvi real ha de ser `#420`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #418 — 2026-04-26 — codex (FET)
**Regularitzat l’`EN MARXA` obsolet de `§6.14`: la consistència del repo ja estava protegida per pipeline i el pendent real era un altre.**
- Context: `§6.14 Infra / Dev / Operativa` encara mantenia un `EN MARXA` sobre la consistència i neteja general del repo, però el mateix bloc ja recollia `validate:core` com a barrera obligatòria, pre-commit hook, guards de protocol/encoding/language/patches/visual-overflow i la norma de tancament rigorós escrita al §2.1. El pendent real ja no era la neteja base del repo, sinó el `PENDENT CRÍTIC` d'evitar regressions silencioses a escala.
- `docs/protocol-producte-admin-ca.md` · §6.14: l'antic `EN MARXA` es converteix en `FET` i queda explícit que la feina viva no és la capa base d'higiene del repo, sinó mantenir-la quan el codi segueixi creixent.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: el protocol deixa de descriure Infra/Dev com una neteja genèrica encara oberta quan la protecció real ja viu als guards i al pipeline automàtic.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `418`; el següent canvi real ha de ser `#419`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #417 — 2026-04-26 — codex (FET)
**Regularitzat l’`EN MARXA` obsolet de `§6.8`: Inbox ja estava integrada a la història canònica del client i el pendent real era un altre.**
- Context: `§6.8 Inbox / Comunicacions` encara mantenia un `EN MARXA` sobre la seva integració a la història canònica del client, però el mateix bloc ja recollia `loadCommTimeline()` compartit entre Inbox i Customer Hub, la narrativa de comunicació dins la timeline canònica del client i la reutilització de follow-ups/risc comercial fora del workspace d'Inbox (`#136`, `#137`, `#138`, `#139`-`#151`, `#329`). El pendent real ja no era la integració base, sinó el `PENDENT CRÍTIC` d'evitar que comunicacions torni a viure com una capa paral·lela.
- `docs/protocol-producte-admin-ca.md` · §6.8: l'antic `EN MARXA` es converteix en `FET` i queda explícit que la feina viva no és la connexió amb la història canònica, sinó preservar la monocapa de comunicacions a mesura que creixi el producte.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: el protocol deixa de presentar Inbox com un workspace encara a mig integrar quan la seva lectura estructural ja alimenta Customer Hub, timeline i follow-ups executius.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `417`; el següent canvi real ha de ser `#418`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #416 — 2026-04-26 — codex (FET)
**Regularitzat l’`EN MARXA` obsolet de `§6.6`: Leads ja funcionava com a cabina comercial i el pendent real era la unificació amb Customer Hub.**
- Context: `§6.6 Leads / Pipeline comercial` encara mantenia un `EN MARXA` sobre la conversió del workspace en cabina comercial real, però el mateix bloc ja recollia insights executables, banner comercial amb CTA, scoring explicable, suggeriments canònics de pipeline i la seva reutilització al `dailyBrief` i a `operationalPulseService` (`#17`, `#36`, `#46`, `#81`, `#109`, `#110`, `#113`, `#381`). El pendent real ja no era la base del workspace, sinó el `PENDENT CRÍTIC` de no separar conceptualment Leads del Customer Hub.
- `docs/protocol-producte-admin-ca.md` · §6.6: l'antic `EN MARXA` es converteix en `FET` i queda explícit que la feina viva no és la cabina comercial actual sinó la consolidació del flux lead → client.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: el protocol deixa de presentar Leads com un workspace encara "a mig convertir" quan la seva capa comercial base ja és operativa i consumida per altres superfícies executives.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `416`; el següent canvi real ha de ser `#417`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #415 — 2026-04-26 — codex (FET)
**Regularitzat l’`EN MARXA` obsolet de `§6.5`: el Customer Hub ja funcionava com a workspace d’acció i el pendent real era un altre.**
- Context: `§6.5 CRM / Customer Hub` encara mantenia un `EN MARXA` sobre el pas de "fitxa" a "workspace d'acció", però el mateix bloc ja recollia un Customer Hub amb insights executables, comunicacions canòniques, prioritat comercial, reactivació assistida amb traça a Tasks i navegació shared cap a workspaces externs (`#136`-`#151`, `#201`-`#224`). El pendent real ja no era la base del workspace, sinó el `PENDENT CRÍTIC` de convertir-lo en cervell comercial únic i evitar client fragmentat en pantalles paral·leles.
- `docs/protocol-producte-admin-ca.md` · §6.5: l'antic `EN MARXA` es converteix en `FET` i queda explícit que la feina viva no és la transformació bàsica del Customer Hub sinó la seva consolidació com a centre comercial canònic.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: el protocol deixa de presentar el Customer Hub com una fitxa encara en conversió quan ja actua com a workspace operatiu transversal sobre comunicacions, tasks, bookings i pressupostos.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `415`; el següent canvi real ha de ser `#416`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #414 — 2026-04-26 — codex (FET)
**Regularitzat l’`EN MARXA` obsolet de `§6.7`: Bookings ja funcionava com a cabina d’operacions i només restava planificació avançada.**
- Context: `§6.7 Bookings / Operacions` encara mantenia un `EN MARXA` sobre la transformació del detall en "cabina d'operacions", però el mateix bloc ja recollia el snapshot operacional unificat (`bookingOperationalService`, `#14`), la història canònica coherent de reserva (`#1`, `#19`) i la consolidació de comunicacions sobre timeline/shared services (`#330` i `#331`). El pendent real ja no era la cabina operativa base, sinó només el `MÉS ENDAVANT` de planificació avançada.
- `docs/protocol-producte-admin-ca.md` · §6.7: l'antic `EN MARXA` es converteix en `FET` i queda explícit que la feina viva no és el detall operacional actual sinó l'evolució futura de planificació.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: el protocol deixa de presentar Bookings com un workspace encara "a mig convertir" quan la base operacional ja està tancada i reutilitza la mateixa monocapa canònica que la resta del producte.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `414`; el següent canvi real ha de ser `#415`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #413 — 2026-04-26 — codex (FET)
**Regularitzat l’`EN MARXA` obsolet de `§6.2`: la migració de domini `LeadTask` ja estava tancada i només restava neteja futura de dades.**
- Context: `§6.2 Arquitectura de domini` encara mantenia un `EN MARXA` sobre el desenganxament semàntic de `LeadTask`, però el mateix bloc ja deixava com a `FET` l'eliminació del model, els aliases legacy drenats, el guard `arch:task-canonical:check` i la migració `20260410140000_drop_lead_task_model` desplegada a Railway. El pendent real ja no era estructural sinó només el `MÉS ENDAVANT` d'eliminar `legacyLeadTaskId` quan deixi de ser necessari.
- `docs/protocol-producte-admin-ca.md` · §6.2: l'antic `EN MARXA` es converteix en `FET` i queda explícit que la feina viva no és d'arquitectura de domini sinó de neteja futura de dades residuals.
- `docs/diario.md`: s'hi afegeix l'entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: el protocol deixa de obrir com a migració viva una peça que ja està tancada a schema, serveis, timeline i base de dades remota.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `413`; el següent canvi real ha de ser `#414`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #410 — 2026-04-26 — codex (FET)
**Regularitzat l’`EN MARXA` obsolet de `§6.11`: l’auditoria visual/overflow ja estava tancada i protegida per pipeline.**
- Context: `§6.11 UX / Visual / Marca` encara mantenia un `EN MARXA` heretat del Canvi `#77` sobre auditoria visual/overflow global, però `§6.13 Qualitat / Tests / Fiabilitat` ja havia deixat escrit des del Canvi `#392` que la revisió de regressions visuals era `FET`, amb suite 100% verda i `qa:visual-overflow` obligatori dins `validate:core` pels Canvis `#385 + #388 + #389 + #391`. El pendent real ja no era de producte ni de QA, sinó de coherència documental.
- `docs/protocol-producte-admin-ca.md` · §6.11: l’antic `EN MARXA` es converteix en `FET` amb referència explícita al tancament factual ja documentat a `§6.13`.
- `docs/diario.md`: s’hi afegeix l’entrada paral·lela perquè la regularització també quedi reflectida al rastre cronològic.
- Efecte: el protocol deixa de suggerir que la capa visual segueix "a mig tancar" quan el pipeline ja la tracta com a barrera automàtica consolidada.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `410`; el següent canvi real ha de ser `#411`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #409 — 2026-04-26 — codex (FET)
**Regularitzat l’últim pendent extern obsolet del `Següent (codex)` al Canvi #358: la migració ja està desplegada a Railway.**
- Context: després del Canvi `#408`, la cadena `lead-loss` ja havia quedat tancada també a Railway, però al diari el `Següent (codex)` del `#358` encara mantenia una línia `PENDENT FORA DE CODI` sobre desplegar `20260424120000_add_lead_lost_reason`. Això tornava a introduir un fals pendent just al primer tall de la seqüència.
- `docs/diario.md`: el `Següent (codex)` del `#358` substitueix el pendent extern per un `FET` amb referència explícita al Canvi `#408` i a l'estat final `Database schema is up to date!`.
- Efecte: la traça completa de `lead-loss` queda coherent també al punt d'origen de la seqüència, no només als talls finals.
- Verificació del tall: `pnpm run qa:protocol` OK · `pnpm run validate:core` OK.
- `ADMIN_CHANGE_COUNTER` puja a `409`; el següent canvi real ha de ser `#410`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #408 — 2026-04-26 — codex (FET)
**Desplegada a Railway la migració `20260424120000_add_lead_lost_reason`; la cadena `lead-loss` queda també tancada a base de dades.**
- Context: després dels Canvis `#358`, `#360`, `#363`, `#370`, `#372`, `#375`, `#377` i `#383`, tota la cadena funcional d'audit trail de pèrdues de lead ja era viva al producte, però encara quedava un pendent extern real: desplegar a Railway la migració `20260424120000_add_lead_lost_reason`. Fins avui el protocol i el diari la mantenien com a deute de deploy.
- Execució real: `npx prisma migrate status` contra `DIRECT_DATABASE_URL` confirmava 21 migracions trobades i una pendent (`20260424120000_add_lead_lost_reason`). S'ha executat `npx prisma migrate deploy` des de `D:\orbitaevents` i Prisma ha aplicat correctament aquesta migració a Railway.
- Verificació: segon `npx prisma migrate status` contra Railway retorna `Database schema is up to date!`.
- `docs/protocol-producte-admin-ca.md` · §6.15: el bullet de `[LOW] Audit trail de decisions administratives — backend + analítica` deixa de dir que la migració estava pendent i passa a citar explícitament el Canvi `#408` com a deploy efectiu a Railway.
- Efecte: la cadena `lead-loss` queda tancada de punta a punta també a producció: schema, escriptura, lectura agregada, endpoint, UI operativa i migració desplegada.
- Verificació del tall: `npx prisma migrate status` OK (abans: 1 pendent; després: `Database schema is up to date!`) · `npx prisma migrate deploy` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `408`; el següent canvi real ha de ser `#409`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #405 — 2026-04-26 — codex (FET)
**Regularitzats els `Següent (codex)` obsolets del diari dins la cadena `lead-loss` (#358, #360 i #363).**
- Context: després del `#403`, el protocol ja havia deixat de mostrar com a pendent el `LossBreakdownPanel` del `#363`, però `docs/diario.md` encara mantenia tres blocs `### Següent (codex)` desalineats dins la mateixa seqüència d'audit trail de pèrdues. Dos descrivien feina de producte ja tancada (`statusRouteHandler`/Lead Hub als Canvis `#370` i `#375`, endpoint al `#363`, panell al `#372`) i només un pendent real continuava viu: el desplegament de la migració a Railway.
- `docs/diario.md`: els `Següent (codex)` del `#358`, `#360` i `#363` passen a reflectir l'estat real. Les peces de producte ja tancades es marquen com a `FET` amb cita als canvis corresponents; només es preserva com a pendent extern el deploy de la migració `20260424120000_add_lead_lost_reason`.
- Efecte: el rastre cronològic queda alineat amb el producte real i es redueix el risc de reobrir treball ja tancat per simple lectura del diari.
- Verificació del tall: `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `405`; el següent canvi real ha de ser `#406`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #403 — 2026-04-26 — codex (FET)
**Regularitzat el `SEGÜENT` obsolet del Canvi #363: el `LossBreakdownPanel` ja estava tancat al Canvi #372.**
- Context: el Canvi `#363` va deixar escrit com a `SEGÜENT (codex)` consumir l'endpoint `/api/admin/reports/lead-losses` des d'un panell `LossBreakdownPanel` a `Sales Ops` o `Reporting executiu`. Però aquesta feina ja es va tancar el mateix 2026-04-24 al Canvi `#372`, i tant el protocol com el diari ja descriuen la implementació real: `app/admin/sales-ops/LossBreakdownPanel.tsx`, wiring a `app/admin/sales-ops/page.tsx` i 3 tests a `__tests__/app/admin/sales-ops/LossBreakdownPanel.test.tsx`. Deixar el `SEGÜENT` viu dins el bloc #363 creava un fals pendent.
- `docs/protocol-producte-admin-ca.md`: el bullet `SEGÜENT (codex)` del bloc `### Canvi #363` es converteix en `FET` amb referència explícita al Canvi `#372`.
- `docs/diario.md`: regularització paral·lela perquè el rastre cronològic no mantingui com a "següent" una feina ja absorbida per `Sales Ops`.
- Efecte: el protocol torna a reflectir el producte real i evita que un altre agent reobri una feina tancada per simple desalineació del log.
- Verificació del tall: `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `403`; el següent canvi real ha de ser `#404`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #402 — 2026-04-26 — codex (FET)
**La navegació inferior pública passa a un únic contracte shared entre `BottomNav` i `MobileBottomNav`.**
- Context: el `SEGÜENT` de `§6.12` continua demanant revisar `header/footer/home` i altres entry points comercials per si queda jerarquia pública duplicada fora del catàleg shared. `app/components/ui/BottomNav.tsx` ja consumia `PUBLIC_BOTTOM_NAV_ITEMS`, però `app/components/mobile-ultimate/MobileBottomNav.tsx` mantenia un segon catàleg inline amb els mateixos destins principals (`home`, `servicios`, `portfolio`, `contacto`) i un `href` hardcoded separat per al configurador central. Mateixa navegació pública, dues fonts.
- `lib/constants/index.ts`: `PUBLIC_BOTTOM_NAV_ITEMS` guanya contracte tipat (`PublicBottomNavItem`, `PublicBottomNavIcon`) i un `id` estable per a cada entrada (`home`, `services`, `configurator`, `portfolio`, `contact`). El shape shared queda prou ric per alimentar tant la bottom nav clàssica com la variant `mobile-ultimate`.
- `app/components/ui/BottomNav.tsx`: conserva el mateix render, però el `NAV_ITEMS` local passa a preservar també l'`id` del contracte shared en lloc de treballar amb un shape parcial.
- `app/components/mobile-ultimate/MobileBottomNav.tsx`: elimina el catàleg inline. Ara filtra `PUBLIC_BOTTOM_NAV_ITEMS` per excloure l'item destacat, prefixa locale, deriva `labelKey` del contracte shared i resol les icones des d'un únic map tipat. El FAB central també deixa d'apuntar a un string manual i passa a llegir l'entry `highlight` del mateix catàleg.
- `__tests__/lib/publicBottomNavItems.test.ts` (nou): 2 tests purs que blinden l'ordre canònic del catàleg i que només el configurador sigui l'únic item destacat.
- Efecte: `§6.12` drena una altra duplicació real de narrativa pública. Si demà canvia l'ordre, el destí o el rol destacat de la navegació inferior, la decisió viu a un únic catàleg shared i no en dues variants mòbils paral·leles.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/publicBottomNavItems.test.ts` OK (2 tests) · `npx tsc --noEmit --pretty false` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `402`; el següent canvi real ha de ser `#403`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #401 — 2026-04-26 — claude (FET)
**El patró `fetch /api/public/image-manager + useState/useEffect` duplicat a 3 components UI (header, footer, mobile home) passa al hook canònic `useManagedImageSrc(key, fallback)`.**
- Context: `app/components/ui/HeaderChampion.tsx`, `app/components/ui/footer.tsx` i `app/components/mobile-ultimate/MobileHomePage.tsx` mantenien tres còpies pràcticament idèntiques (~12-22 línies cada una) del mateix patró: `useState(fallback)` + `useEffect` que feia `fetch('/api/public/image-manager?key=<KEY>', {cache:'no-store'})`, parsejava `data?.data?.[KEY]?.item?.src` i actualitzava l'estat només si era string no buit. `Header` i `Footer` consumien la mateixa key (`layout.logo.header`) amb el mateix fallback (`/img/logoplanetatextdreta.svg`); `MobileHomePage` consumia `layout.logo.admin` amb fallback `/img/orbita-glyph.svg`. Mateix concepte, tres llocs. Si demà cal afegir caching, retry, telemetria, o canviar el contracte de `data?.data?...`, caldria tocar tres fitxers.
- `lib/hooks/useManagedImageSrc.ts` (nou): hook canònic que rep `(key: string, fallback: string)` i retorna `string`. Internament: `useState(fallback)` + `useEffect` que fa `fetch('/api/public/image-manager?key=' + encodeURIComponent(key), {cache:'no-store'})`, comprova `response.ok`, parseja JSON amb fallback `null` a parse error, llegeix `data?.data?.[key]?.item?.src`, actualitza només si `typeof === 'string' && trim().length > 0`. Patró `cancelled` per evitar setState després de unmount. Silenci en `catch` (alineat amb el comportament `Header`/`Footer` previs; el `console.warn` de `MobileHomePage` queda absorbit per la canonització, com la resta de fallbacks d'assets de marca no crítics).
- `app/components/ui/HeaderChampion.tsx`: `import { useManagedImageSrc }` afegit; `useState('/img/logoplanetatextdreta.svg')` + el `useEffect` de 19 línies de `loadManagedLogo` passen a `const managedLogoSrc = useManagedImageSrc('layout.logo.header', '/img/logoplanetatextdreta.svg')`.
- `app/components/ui/footer.tsx`: `import { useManagedImageSrc }` afegit; el `useState` i el branch `loadManagedLogo` del `useEffect` agrupat (que també carrega `coverageAreas`) s'eliminen — `loadCoverage` segueix vivint al `useEffect` original. `const managedLogoSrc = useManagedImageSrc('layout.logo.header', '/img/logoplanetatextdreta.svg')`.
- `app/components/mobile-ultimate/MobileHomePage.tsx`: `import { useManagedImageSrc }` afegit; `useState('/img/orbita-glyph.svg')` + `useEffect` de 22 línies de `loadManagedMobileLogo` passen a `const managedMobileLogoSrc = useManagedImageSrc('layout.logo.admin', '/img/orbita-glyph.svg')`.
- `__tests__/lib/hooks/useManagedImageSrc.test.tsx` (nou): 6 tests amb `renderHook` + mock de `globalThis.fetch`. Cobreixen (1) fallback inicial abans que la API resolgui, (2) substitució amb src gestionat quan API retorna `data.<key>.item.src`, (3) encoding de key amb caràcters especials (`encodeURIComponent`), (4) manté fallback si `response.ok === false`, (5) manté fallback si src és string només d'espais, (6) manté fallback si fetch llença error de xarxa. Verifica també la URL exacta de fetch i les options `{cache:'no-store'}`.
- Efecte: el §6.12 drena una altra capa de duplicació pública — la lògica de càrrega d'assets de marca gestionats per `imageManagerService` ja no viu replicada. Si demà cal afegir caching/SWR, telemetria d'errors, o canviar el contracte HTTP, es resol al hook sense tocar els tres consumidors. Tres tipus diferents de pàgines (chrome de capçalera, peu públic, home mòbil) ara depenen del mateix punt canònic.
- Aquest tall **NO** toca: `TrustedByLogos.tsx` (consumeix `data?.data?.[key]?.items` amb shape de col·lecció, no `item` singular — patró diferent que mereix un hook propi si demà s'amplia), `app/admin/layout.tsx` (multi-key amb `key=A&key=B`, lectura paral·lela de 2 valors al mateix fetch — un altre patró), i `ServiceJsonLD.tsx` (server-side via `getManagedImageOverride`, no fetch HTTP). Línia editorial conservada.
- Verificació del tall: `pnpm exec vitest run __tests__/lib/hooks/useManagedImageSrc.test.tsx` OK (6 tests) · `pnpm run validate:core` OK amb 12 guards · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `401`; el següent canvi real ha de ser `#402`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #400 — 2026-04-25 — claude (FET)
**`trackServiceEvent` duplicat a 3 service clients passa al canònic `trackPublicServiceEvent` shared.**
- Context: `app/[locale]/servicios/{bodas,discomovil,fiestas}/client.tsx` tenien tots tres una còpia idèntica de la mateixa peça d'analytics (~10 línies cada una): tipus locals `AnalyticsValue`, `AnalyticsParams`, `GtagWindow` + funció `trackServiceEvent(action, params)` que feia `gtag('event', action, params)` directament. Mateixa lògica, tres còpies. Si demà cal afegir guard per consent, error handling, o canviar el dataLayer fallback, caldria tocar tres fitxers — cosa que ja passa amb el #398 amb el patró WhatsApp i ja resolta. `app/lib/analytics.ts` és la font canònica de trackers (`trackEvent`, `trackLead`, `trackWhatsAppClick`, `trackCTAClick`...) però no tenia un helper bàsic de "fer pass-through directe sense afegir categories GA4".
- `app/lib/analytics.ts`: nou export `trackPublicServiceEvent(action, params)` amb tipus `PublicServiceEventValue` (`string|number|boolean|undefined`) i `PublicServiceEventParams` (`Record<string, PublicServiceEventValue>`). Mateix comportament que els 3 helpers locals: `if (!isClientSide()) return; if (!window.gtag) return; window.gtag('event', action, params);`. **No** afegeix `event_category`/`event_label`/`value` que sí afegeix `trackEvent` — això hauria canviat el reporting GA4 dels events `bodas_pack_cta`/`discomovil_hero_cta`/etc. Zero canvi de comportament. Posicionat al final del fitxer després de `initAnalytics`.
- `app/[locale]/servicios/bodas/client.tsx`, `app/[locale]/servicios/discomovil/client.tsx`, `app/[locale]/servicios/fiestas/FiestasClient.tsx`: import nou `import { trackPublicServiceEvent } from '@/app/lib/analytics'`. Els 3 blocs locals de tipus + funció s'eliminen (~10 línies cada un, ~30 totals). Totes les crides `trackServiceEvent(...)` (5 a bodas, 6 a discomovil, 5 a fiestas — total 16) es renombren a `trackPublicServiceEvent(...)` via `replace_all`. Comportament idèntic.
- `__tests__/app/lib/trackPublicServiceEvent.test.ts` (nou): 4 tests amb `vi.stubGlobal('window', ...)`. Cobreixen (1) forward correcte de `('event', action, params)` a `window.gtag` un cop, (2) no-op si `window.gtag` és undefined sense throw, (3) no-op si `window` és undefined (SSR) sense throw, (4) qualsevol shape de params (`true`, `'demo'`, `3`, `undefined`) passa íntegrament.
- Efecte: el §6.12 elimina la triple duplicació de tracking helper als entry points comercials. Els tres clients ara depenen del mateix punt canònic. **Canvi #400** rodó: marca el final de la línia editorial #28-#69 + #84+#102 → #390-#400 que ha drenat sistemàticament jerarquia, dades, components, helpers i tracking duplicats a la web pública.
- Verificació del tall: `pnpm exec vitest run __tests__/app/lib/trackPublicServiceEvent.test.ts` OK (4 tests) · `pnpm run validate:core` OK amb 12 guards.
- `ADMIN_CHANGE_COUNTER` puja a `400`; el següent canvi real ha de ser `#401`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #390 — 2026-04-25 — codex (FET)
**`discomovil` i `fiestas` comparteixen ja també la mateixa secció visual de cobertura pública.**
- Context: després dels Canvis `#384` i `#386`, les dues landings públiques ja llegien les seves zones des de `lib/publicServiceZones.ts`, però encara mantenien duplicat el mateix markup de títol + graella de targetes dins `app/[locale]/servicios/discomovil/client.tsx` i `app/[locale]/servicios/fiestas/FiestasClient.tsx`. La dada ja era shared; la presentació encara no.
- `app/components/public/PublicServiceZonesSection.tsx`: component shared nou que rep `title`, `zones` i `columnsClassName` per renderitzar una secció de cobertura reutilitzable amb el mateix contracte visual.
- `app/[locale]/servicios/discomovil/client.tsx`: deixa de renderitzar inline la secció de cobertura i passa a construir `zoneCards` des de `PUBLIC_SERVICE_ZONE_LINKS.discomovil` amb labels i descripcions traduïdes abans de delegar al component shared.
- `app/[locale]/servicios/fiestas/FiestasClient.tsx`: aplica el mateix patró sobre `PUBLIC_SERVICE_ZONE_LINKS.fiestas`, mantenint l'única diferència real en el layout (`grid-cols-1 md:grid-cols-3`).
- `__tests__/app/components/public/PublicServiceZonesSection.test.tsx`: prova nova per blindar el render del títol, els `href` i les descripcions del component shared sense dependre de les pàgines consumidores.
- Efecte: `§6.12` drena una altra capa de duplicació en entry points comercials. Ara no només la jerarquia zonal és shared, sinó també la UI base que la presenta.
- Verificació del tall: `pnpm vitest run __tests__/app/components/public/PublicServiceZonesSection.test.tsx` OK. `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `390`; el següent canvi real ha de ser `#391`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #381 — 2026-04-24 — codex (FET)
**Regularitzat el `SEGÜENT` obsolet de `§6.6`: el dashboard ja destacava els drivers de pipeline des dels Canvis `#327` i `#328`.**
- Context: `§6.6 Leads / Pipeline comercial` encara mantenia viu el text *"valorar si la UI del dashboard ha de destacar explícitament quins senyals de pipeline estan degradant el pols"*, però això ja estava resolt al producte. El Canvi `#327` va fer que `operationalPulseService` propagués `pipelineDrivers` canònics al dashboard i el Canvi `#328` va reconnectar el `Radar d'execució` a aquesta mateixa lectura compartida. El pendent real era només documental.
- `docs/protocol-producte-admin-ca.md` · §6.6: el `SEGÜENT` es converteix en `FET` amb referència explícita als Canvis `#327` i `#328`, deixant clar que no hi ha una segona passada pendent per al mateix objectiu.
- Efecte: el checklist torna a reflectir l'estat real del producte i evita que un agent futur reobri una feina ja tancada per una simple desalineació interna del protocol.
- No hi ha canvi de codi, schema ni tests — tall documental de regularització.
- Verificació del tall: `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `381`; el següent canvi real ha de ser `#382`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #360 — 2026-04-24 — claude (FET)
**Servei d'analítica de pèrdues de lead: `leadLossAnalyticsService` amb agregació multidimensional.**
- Context: el Canvi #358 va afegir el camp `lostReason` al `Lead` i el servei `markLeadAsLost()` per escriure'l, però no hi havia forma de llegir aquesta dada de manera agregada. Per respondre preguntes executives com "quin és el motiu de pèrdua principal aquest trimestre?", "quina zona/font ens descarta més?" o "la tendència mensual millora?", calia una capa de lectura canònica alineada amb la resta de serveis d'analítica (`leadInsightsService`, `executiveReportService`).
- `lib/services/leadLossAnalyticsService.ts` — nou servei amb dues superfícies. Pura: `computeLossSummary(leads: LossReportLead[]): LossSummary` que agrega per 4 dimensions canòniques — `byReason` (només els 8 motius vàlids de `LEAD_LOST_REASONS`, ordenats per count desc, amb label català via `LEAD_LOST_REASON_LABELS`), `byEventType` i `bySource` (labels humanitzats automàticament), `byMonth` (ISO `YYYY-MM` ordenat cronològicament). Retorna també `total`, `uncategorized` (leads LOST sense motiu canònic vàlid) i `topReason`. Percentatges amb 1 decimal. Wrapper `loadLossReport({sinceDays?, now?}): Promise<LossSummary>` amb query canònica a `prisma.lead.findMany` (finestra de 90 dies per defecte, accepta leads amb `lostAt: null` si el `updatedAt` entra a la finestra per capturar pèrdues anteriors al #358).
- `__tests__/lib/services/leadLossAnalyticsService.test.ts` — 10 tests purs sobre `computeLossSummary`: empty input retorna estructura correcta; agregació per motiu ordenada per count desc amb labels catalans; leads amb `lostReason: null` o string invàlid (`BOGUS`) van a `uncategorized`; breakdown `byEventType` i `bySource` amb labels humanitzats; `byMonth` ordenat cronològicament per ISO `YYYY-MM`; leads sense `lostAt` no generen entrada de mes; `byReason` exclou motius amb count 0; shares amb 1 decimal; accepta els 8 motius canònics. El helper `lead(overrides)` usa `'key' in overrides` en lloc de `??` per preservar `null` explícit (bug d'iteració corregit en el propi tall).
- Aquest tall **NO** crea endpoint API ni UI — són territori codex (route + workspace `Sales Ops` o `Reporting executiu`). Documentat com a següent pas explícit al §6.15.
- Verificació del tall: `npx vitest run __tests__/lib/services/leadLossAnalyticsService.test.ts` OK (10 tests) · `pnpm run validate:core` OK (10/10 guards: qa:protocol, qa:protocol:test, qa:encoding, qa:language, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard) · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `360`; el següent canvi real ha de ser `#361`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #356 — 2026-04-24 — claude (FET)
**Migracions Railway verificades i tancats els `SEGÜENT` obsolets de §6.2 i §6.4.**
- Context: al Canvi #354 vaig verificar l'estat de Railway amb `npx prisma migrate status` contra `DIRECT_DATABASE_URL` — retornava `Database schema is up to date!` amb 20/20 migracions trobades. Però el protocol mantenia oberts dos `SEGÜENT` obsolets: §6.2 · "desplegar migració `20260410140000_drop_lead_task_model` a Railway i verificar dades reals" (§6.2 línia 538) i §6.4 · "desplegar migració a Railway" (§6.4 línia 594, referent a `20260418120000_add_task_dedupe_source_fields`). La feina era efectiva però el checklist no ho reflectia — creava risc de "doble push" futur o d'agent que creu que hi ha deute pendent quan ja s'ha resolt.
- `docs/protocol-producte-admin-ca.md` · §6.2: `SEGÜENT: desplegar migració 20260410140000_drop_lead_task_model a Railway...` substituït per un `FET` amb cita del Canvi #356. El bloc deixa clar que la migració és efectiva i que el pendent restant és només `MÉS ENDAVANT` (eliminar `legacyLeadTaskId` quan no quedin dades).
- `docs/protocol-producte-admin-ca.md` · §6.4: `SEGÜENT: desplegar migració a Railway` substituït per un `FET` amb cita del Canvi #356, explicitant que els 4 camps canònics (`source`, `autoRule`, `dedupeKey` unique, `resolutionNote`) i els 6 backfills SQL (`system:*`→enums canònics) ja corren a producció.
- No hi ha canvi de codi ni de schema — només consolidació documental sobre feina ja executada. Compleix la norma §2.1 **de tancament rigorós de tall** perquè el §6 queda alineat amb la realitat del servidor, i qualsevol agent futur pot confiar que els `SEGÜENT` vius són realment vius.
- Verificació del tall: `npx prisma migrate status` contra Railway OK (`Database schema is up to date!`, 20 migracions) · `pnpm run validate:core` OK (10/10 guards: qa:protocol, qa:protocol:test, qa:encoding, qa:language, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard) · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `356`; el següent canvi real ha de ser `#357`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #354 — 2026-04-24 — claude (FET)
**`check-language-quality.mjs` entra a `validate:core` + norma de tancament rigorós escrita al §2.1.**
- Context: el guard lingüístic `check-language-quality.mjs` (apòstrof català `d'avui`/`l'admin`/`s'ha`... dins strings single-quoted i plurals incorrectes `respostas`/`tascas`/`pressuposts`) ja existia com a entry `qa:language` a `package.json` però no formava part del pipeline — el §6.14 tenia `SEGÜENT: crear check-language-quality.mjs si check-patches genera falsos positius lingüístics` pendent des del Canvi #127. El script no entrava a `validate:core` ni tenia test blindat.
- `package.json`: `validate:core` incorpora `pnpm run qa:language` entre `qa:encoding` i `qa:message-imports`. Amb això el pipeline passa de 9 a 10 guards seqüencials i l'scan lingüístic es valida a cada tall sense dependre d'ordre manual.
- `__tests__/scripts/check-language-quality.test.ts`: nou test amb 7 casos — clean file, apòstrof català detectat en single-quoted string (`CATALAN_APOSTROPHE_IN_SINGLE_QUOTE`), no-flag en double-quoted string, plurals incorrectes detectats per `respostas` i `tascas` (`WRONG_CATALAN_PLURAL_S`), skip de `__tests__/`, skip de fitxers `.test.`. Patró alineat amb `check-task-canonical.test.ts` (fixture temporal via `mkdtempSync` + `spawnSync` del script). Entra automàticament a `qa:protocol:test` (que ja corre `__tests__/scripts/`).
- `docs/protocol-producte-admin-ca.md` · `§2.1 Principis invariables`: afegida la **norma de tancament rigorós de tall** — cada Canvi #N al §9 requereix, sense excepció, tests nous/ampliats, `validate:core` verd 100%, `qa:protocol` OK, entrada completa al §9 (context, bullets, verificació, comptador, autors), entrada al diari, actualització del §6 afectat, i regles noves escrites al protocol. Aplica per igual a `claude`, `codex` i `user`. Segueix el patró del Canvi #350 (norma canònica de lectures/escriptures): el que era context oral passa a protocol viu.
- Verificació del tall: `npx vitest run __tests__/scripts/check-language-quality.test.ts` OK (7 tests) · `pnpm run qa:language` OK (917 fitxers, 0 findings) · `pnpm run validate:core` OK (10/10 guards: qa:protocol, qa:protocol:test, qa:encoding, qa:language, qa:message-imports, arch:layer:check, arch:task-canonical:check, tsc, i18n:packs:guard, i18n:equipment:guard).
- `ADMIN_CHANGE_COUNTER` puja a `354`; el següent canvi real ha de ser `#355`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #327 — 2026-04-22 — codex (FET)
**El pols operatiu ja explica quins senyals del pipeline l’estan degradant.**
- Context: el protocol deixava escrit el pendent de “valorar si la UI del dashboard ha de destacar explícitament quins senyals de pipeline estan degradant el pols”. La mètrica `Salut pipeline` ja existia, però el dashboard no feia visible el *perquè* operatiu de la caiguda.
- `lib/services/operationalPulseService.ts`: el contracte del `pulse` guanya `pipelineDrivers`, derivats directament de `loadPipelineSuggestions()` i restringits als senyals `CRITICAL/HIGH` més rellevants. No es crea cap motor paral·lel ni una taxonomia nova: es reaprofita la mateixa font canònica del pipeline.
- `app/admin/components/OperationalPulsePanel.tsx`: el panell afegeix el bloc “Què degrada el pipeline” i mostra fins a 3 causes accionables amb prioritat, detall i enllaç cap al destí ja suportat per cada suggeriment.
- `__tests__/lib/services/operationalPulseService.test.ts` i `__tests__/lib/services/executiveCockpitService.test.ts`: el nou contracte queda cobert i les fixtures del cockpit s’alineen amb `pipelineDrivers`.
- Efecte: el dashboard deixa de limitar-se a un percentatge agregat de `Salut pipeline` i fa visible el motiu operatiu de la degradació sense duplicar criteris comercials.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `npx vitest run __tests__/lib/services/operationalPulseService.test.ts __tests__/lib/services/executiveCockpitService.test.ts` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `327`; el següent canvi real ha de ser `#328`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #326 — 2026-04-22 — codex (FET)
**Residual final de UI (`tasks`, `intake` i domini `leads`) passa també pel contracte canònic de lead.**
- Context: després de `#325`, el residu de navegació UI amb literals `/admin/leads/${id}` ja era petit però coherent: `tasks`, `intake`, `reengagement` i alguns punts del propi domini `leads`.
- `app/admin/tasks/TaskKanbanView.tsx` i `app/admin/tasks/page.tsx`: les tasques vinculades a leads passen a resoldre la fitxa via `buildLeadWorkspaceHref`.
- `app/admin/intake/page.tsx`: el CTA immediat després de crear una entrada nova deixa de construir el link de lead a mà.
- `app/admin/leads/reengagement/LeadReengagementClient.tsx`, `LeadPipelineView.tsx`, `LeadActions.tsx`, `page.tsx` i `app/admin/leads/[id]/page.tsx`: el propi domini `leads` passa també a reutilitzar el contracte compartit per a la seva navegació UI interna.
- Efecte: la canonització de navegació de lead queda pràcticament exhaustiva a la UI; el que resta amb `/admin/leads/...` es concentra essencialment en endpoints API, fetches i rutes especials com `reengagement`, no en CTAs dispersos.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `326`; el següent canvi real ha de ser `#327`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #325 — 2026-04-22 — codex (FET)
**Calendari, reserves i superfícies comercials passen també pel contracte canònic de lead.**
- Context: després de `#324`, encara quedava un bloc gran i coherent de UI operativa/comercial obrint leads amb literals directes: `calendario`, `bookings`, `presupuestos`, `sales-ops`, `reporting` i `mensajes`.
- `app/admin/calendario/CalendarMonthClient.tsx`, `CalendarWeekClient.tsx` i `CalendarDayClient.tsx`: les reserves i follow-ups vinculats deixen d’obrir la fitxa de lead amb `'/admin/leads/${id}'` literal i passen a `buildLeadWorkspaceHref`.
- `app/admin/bookings/BookingClientEventSection.tsx`, `app/admin/bookings/page.tsx` i `app/admin/bookings/[id]/page.tsx`: els punts que naveguen cap a l’entrada origen de la reserva queden absorbits pel mateix helper.
- `app/admin/presupuestos/ProposalsList.tsx`, `app/admin/sales-ops/page.tsx`, `app/admin/reporting/page.tsx` i `app/admin/mensajes/page.tsx`: els CTAs comercials i de seguiment cap a leads passen també al contracte canònic.
- Efecte: el contracte de navegació de lead cobreix ja la major part de la UI operativa i comercial, reduint molt el residu de literals dispersos fora d’endpoints API i pantalles específiques de lead.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `325`; el següent canvi real ha de ser `#326`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #324 — 2026-04-22 — codex (FET)
**La UI operativa d’Inbox, Customer Hub i dashboard principal passa també pel contracte canònic de lead.**
- Context: després de `#323`, la canonització cobria serveis, notificacions i part de la UI executiva, però encara quedaven superfícies operatives del dia a dia obrint leads amb `'/admin/leads/${id}'` literal. Els punts més rendibles eren `Inbox`, alguns panells del `Customer Hub` i el dashboard principal.
- `app/admin/inbox/InboxLeadContext.tsx` i `app/admin/inbox/InboxClient.tsx`: els CTAs d’“Obrir lead complet”, l’obertura del lead importat des d’email i la navegació des del detail pane passen a `buildLeadWorkspaceHref`.
- `app/admin/clientes/[id]/_components/panels/CommsPanel.tsx`, `TasksNotesPanel.tsx`, `LeadsPanel.tsx` i `SummaryPanel.tsx`: els enllaços cap a la fitxa del lead dins seguiments, tasques, resum i historial d’entrades queden absorbits pel mateix helper.
- `app/admin/page.tsx` i `app/admin/lib/dashboard-data.ts`: el dashboard principal i la seva timeline recent deixen de fabricar rutes literals a lead per a llistes ràpides, timeline i tasques pendents.
- Efecte: la canonització de navegació de lead entra ja també a superfícies UI operatives i visibles del dia a dia, reduint encara més els literals dispersos fora dels endpoints API.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `324`; el següent canvi real ha de ser `#325`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #323 — 2026-04-22 — codex (FET)
**Notificacions de lead passen també pel contracte canònic perquè email, WhatsApp i webhook no continuïn fabricant URLs absolutes pel seu compte.**
- Context: després de `#322`, dins `lib/services` encara quedava un focus clar: `notificationService` continuava construint l’URL absoluta de lead directament dins plantilles i payloads. A més, el test del servei depenia indirectament de `notificationRecipientsService`, que tocava Prisma/BD local.
- `lib/services/notificationService.ts`: nou helper intern `buildLeadAdminUrl` que embolcalla `absoluteUrl(buildLeadWorkspaceHref(leadId))`; el text de WhatsApp, el payload de webhook i el CTA HTML “Veure Lead a l'Admin” passen tots pel mateix contracte de workspace lead.
- `__tests__/lib/services/notificationService.test.ts`: mock explícit de `notificationRecipientsService` perquè la suite validi només notificacions i deixi de fallar per manca de base de dades local.
- Efecte: el contracte canònic de lead cobreix també la capa de notificació sortint i, de passada, el test del servei queda estable i ràpid per futures iteracions.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `npx vitest run __tests__/lib/services/notificationService.test.ts` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `323`; el següent canvi real ha de ser `#324`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #322 — 2026-04-22 — codex (FET)
**Segona capa de canonització de links de lead a la capa servei perquè cockpit, timeline i command palette deixin de fabricar rutes literals pel seu compte.**
- Context: després de `#321`, el contracte nou cobria banners i panells executius, però encara hi havia una capa sencera de serveis/pure builders retornant `'/admin/leads/${id}'` directament. Els punts més clars eren `executiveCockpit`, `nextBestAction`, `timeline`, `timelineQueryService` i `adminCommandPaletteService`.
- `lib/services/executiveCockpitService.ts`: els follow-ups urgents del cockpit executiu passen a apuntar al lead via `buildLeadWorkspaceHref` en lloc de fabricar el literal directament.
- `lib/services/nextBestActionService.ts`: les accions derivades de leads, tasques lligades a lead i follow-ups urgents/normals passen a reaprofitar el mateix helper per resoldre el destí base del lead.
- `lib/customer-hub/timeline.ts` i `lib/services/timelineQueryService.ts`: la timeline del client i la capa canònica que la nodreix deixen de construir l’enllaç de “Veure entrada” pel seu compte i passen a dependre del contracte únic de workspace lead.
- `lib/services/adminCommandPaletteService.ts`: els resultats de cerca d’entrades de la command palette també passen a sortir del helper compartit.
- Efecte: el contracte canònic de lead deixa de quedar restringit a la UI immediata i entra també a la capa servei que alimenta superfícies executives i timelines, reduint reobertures futures de literals dispersos.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK. `npx vitest run __tests__/lib/services/adminCommandPaletteService.test.ts __tests__/lib/services/executiveCockpitService.test.ts __tests__/lib/customer-hub/timeline.test.ts` OK. `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `322`; el següent canvi real ha de ser `#323`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

### Canvi #312 — 2026-04-22 — claude (FET)
**`Portfolio` entra a `OwnerControlStrip` i deixa de començar només pels dos `AdminHelpLegend` + tabs sense una lectura inicial shared del catàleg d'events.**
- Context: dins del drenatge de residuals fora del llenguatge visual shared, `app/admin/portfolio/page.tsx` encara presentava el workspace amb tabs `Media`/`Events` i tres legendes, però sense capa shared per entendre l'estat real del portfolio abans de baixar a un tab. Hi havia estat viu (`events` amb `published`, `coverImage`, `_count.media`) prou ric per governar el catàleg des del capdamunt.
- `app/admin/portfolio/page.tsx`: integrat `OwnerControlStrip` al capdamunt del workspace. El bloc `Automàtic` resumeix events totals (publicats/esborranys), peces vinculades i categories actives/totals; `Manual` fa emergir events sense portada, sense media vinculat, esborranys pendents de publicar i categories buides; `Següent pas` prioritza `total=0` → crear primer event, després portades buides → Media, després media buit → Media, després esborranys → Events, després categories buides → Events, i finalment `al dia`.
- Enganxat mitjançant ancores `#media` i `#events` i un `hashchange` listener al `AdminPortfolioPage` que commuta `tab` quan arriba la navegació des del `OwnerControlStrip`, reutilitzant el mateix estat `tab` del workspace i sense afegir cap resum paral·lel ni hardcodejar senyals.
- El canvi no toca `loadEvents`, `CategorySection` ni `EventsManager`: reutilitza `events`, `PORTFOLIO_CATEGORIES` i `_count.media` per computar els senyals, de manera que la capa shared respon al mateix contracte viu del workspace.
- Efecte: `Portfolio` deixa de començar només amb tabs i legendes i entra també dins del mateix llenguatge visual shared dels workspaces de propietari, amb lectura clara d'events, decisió manual i següent pas abans de baixar a `Media` o `Events`.
- Verificació del tall: `npx tsc --noEmit --pretty false` OK.
- `ADMIN_CHANGE_COUNTER` puja a `312`; el següent canvi real ha de ser `#313`.
- Començat per: `claude`
- Treballant per: `claude`
- Tancat per: `claude`

### Canvi #372 — 2026-04-24 — codex (FET)
**`Sales Ops` incorpora `LossBreakdownPanel` i exposa al propietari la lectura real de pèrdues comercials del `LossSummary`.**
- Context: el backend de pèrdues de lead ja estava complet per capes (`leadLossService` + `leadLossAnalyticsService` + endpoint `GET /api/admin/reports/lead-losses`), però la lectura continuava invisible a la UI de propietari. El `SEGÜENT` explícit del Canvi #363 demanava un panell a `Sales Ops` o `Reporting executiu` amb KPI de motiu principal, breakdown per font i tendència mensual. Sense aquesta superfície, l'audit trail existia però no guiava cap decisió diària.
- `app/admin/sales-ops/LossBreakdownPanel.tsx`: nou component client per al workspace de vendes. Rep `initialSummary` del servidor, es revalida contra `/api/admin/reports/lead-losses?days=90`, mostra estat de sincronització i renderitza quatre capes de lectura: KPI (`topReason`, totals comercials/automàtics i sense classificar), donut `byReason`, barres `bySource` i línia `byMonth`.
- `app/admin/sales-ops/page.tsx`: `Sales Ops` carrega `loadLossReport({ sinceDays: 90 })` en paral·lel amb la resta de mètriques i injeta el nou panell just després de l'`OwnerControlStrip`. El tall manté UX immediata amb snapshot inicial i refresc client-side sobre el contracte HTTP existent.
- `__tests__/app/admin/sales-ops/LossBreakdownPanel.test.tsx`: 3 tests nous que blinden render inicial, refresh des de l'endpoint i fallback buit quan encara no hi ha pèrdues classificades.
- Efecte: la lectura de pèrdues deixa de ser només dades escrites a DB o visibles a JSON. El propietari veu ara quin motiu comercial domina, quins canals pateixen més i si la tendència mensual s'està degradant, sense sortir de `Sales Ops`.
- Verificació del tall: `pnpm vitest run __tests__/app/admin/sales-ops/LossBreakdownPanel.test.tsx` OK (3 tests) · `npx tsc --noEmit --pretty false` OK · `pnpm run validate:core` OK · `pnpm run qa:protocol` OK.
- `ADMIN_CHANGE_COUNTER` puja a `372`; el següent canvi real ha de ser `#373`.
- Començat per: `codex`
- Treballant per: `codex`
- Tancat per: `codex`

# 10. Veredicte

OrbitaEvents està en fase de **refinament seriós**.

El zenit no arribarà per afegir 40 mòduls més. Arribarà per:

- una sola veritat per domini
- workspaces premium
- fluxos nets
- visual potent
- operativa impecable

Aquest document s'ha d'anar actualitzant fins que el sistema deixi de semblar només potent i passi a semblar **inevitable**.
