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
- **Interfície de propietari obligatòria**: qualsevol pantalla que governi negoci, operativa o risc ha de poder-se llegir d'un cop d'ull. La UI ha de separar clarament què és `automàtic` i què és `manual`, fer visibles semàfors, prioritat i següent pas, i reduir dependència de memòria o lectura tècnica.
- **No consolidar només a nivell de codi**: també cal consolidar llenguatge, UX i model mental.
- **Qualsevol millora grossa ha de quedar reflectida en aquest document.**

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
**SEGÜENT**: backlog major cap al zenit (Canvi #84): Executive Cockpit com a centre de comandament; motor de següent millor acció; nurturing automàtic controlat; attribution/ROI comercial; forecast real; manual viu + command palette; QA visual automàtica amb guards i captures. Playbook de màrqueting visible al manual (Canvi #85): què fer, com fer-ho, quan fer-ho i quin mòdul obrir. Criteri de canals i Google Ads visible al manual (Canvi #86): si no entren leads, no escalar pressupost a cegues; diagnosticar impressions, CTR, CPC, conversió, CPA, qualitat i marge. ~~Google Calendar amb alarmes pròpies per reserves sincronitzades~~ — ✅ FET (Canvi #134).
**FET** *(2026-04-11 per `codex` — Canvi #107)*: command palette blindada amb capa pura i tests. El catàleg, la deduplicació, els recents i el filtrat viuen a `adminCommandPaletteService.ts`, i el modal només consumeix aquesta capa.
**FET** *(2026-04-17 per `claude` — Canvi #153)*: `executiveCockpitService.ts` — Executive Cockpit com a centre de comandament. Agrega en paral·lel: Daily Brief, Operational Pulse, follow-ups pendents, conflictes de capacitat, suggeriments de pipeline i anomalies KPI. Funcions pures: `assemblePriorityActions` (ranking global d'accions per urgència), `assembleHealthSignals` (5 àrees de salut), `computeGlobalHealthScore` (score 0-100 + level). API `/api/admin/cockpit`. 19 tests.
**FET** *(2026-04-17 per `claude` — Canvi #168)*: `nextBestActionService.ts` — Motor de següent millor acció. Agrega 6 fonts (leads actius, customers, tasques, follow-ups, capacitat, pipeline) i genera rànking unificat d'accions executables amb scoring compost (urgència × impacte × finestra temporal). 6 dominis d'extracció, deduplicació per entitat+domini, scoring i ranking global. API `/api/admin/next-actions`. 24 tests servei + 4 tests ruta.
**PENDENT CRÍTIC**: evitar dispersió per excés de mòduls sense consolidació. Una sola narrativa de producte.
**MÉS ENDAVANT**: formalitzar product operating system.

## 6.2 Arquitectura de domini
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: detectat deute estructural. Servei canònic de tasks per lead (`leadScopedTaskService`). Servei canònic de rutes (`leadScopedTaskRouteService`). Els wrappers legacy (`leadTaskFacade`, `leadTaskRouteService`) ja han estat retirats; el protocol només els conserva com a rastre històric de la migració.
**EN MARXA**: desenganxament semàntic de `LeadTask`, desplaçament cap a `Task` model real, lectura canònica de timeline.
**FET** *(2026-04-10 per `claude`)*: `model LeadTask` eliminat del schema. Enums renombrats `TaskStatus`/`TaskPriority` (amb `@@map` per preservar noms SQL). Relació `tasks LeadTask[]` eliminada de `Lead`. Refs `tx.leadTask.deleteMany` tretes de `leadCleanupService` i `leadRouteService` + tests alineats. Migració `20260410140000_drop_lead_task_model`. Camp `legacyLeadTaskId` preservat a `Task` (1 ref viva a `leadScopedTaskService`). 2219 tests, 0 failures, 0 errors TS.
**FET** *(2026-04-10 per `codex` — Canvi #67)*: aliases legacy `LeadTaskRouteInput`/`LeadTaskRouteUpdateInput` eliminats de `leadScopedTaskRouteService`; substituïts per `LeadScopedTaskRouteInput`/`LeadScopedTaskRouteUpdateInput`.
**FET** *(2026-04-10 per `codex` — Canvi #69)*: guard `arch:task-canonical:check` integrat a `validate:core` per bloquejar regressions actives a `LeadTask` (`prisma.leadTask`, `lead.tasks`, wrappers/aliases legacy i `model LeadTask`).
**SEGÜENT**: desplegar migració `20260410140000_drop_lead_task_model` a Railway i verificar dades reals.
**MÉS ENDAVANT**: eliminar `legacyLeadTaskId` quan ja no hi hagi dades amb aquest camp.

## 6.3 Timeline canònica
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: detectades les 3 fonts. Creat `timelineQueryService` amb mappers. Customer Hub integra `adminLog` a la lectura. `Activity` route i UI amb forma canònica. `LeadWorkspace` amb lectura canònica.
**FET** *(2026-04-09 per `claude` — Canvi #1)*: afegits **fetchers unificats** (`fetchCanonicalEventsForCustomer/Lead/Booking`) al `timelineQueryService`. Bookings detail (`page.tsx`) ara consumeix `fetchCanonicalEventsForBooking` en lloc d'interpretar `adminLog` cru. 20 tests nous passant.
**FET** *(2026-04-10 per `codex` — Canvi #71)*: `leadActivity.metadata` preservada a la timeline canònica; les comunicacions `EMAIL/WHATSAPP/CALL/NOTE` ja no perden context quan entren a Customer/Lead/Booking timeline.
**SEGÜENT**: definir si cal una entitat `CommunicationEvent` pròpia o si `leadActivity` continua sent la font canònica de comunicacions.
**PENDENT CRÍTIC**: definir què és timeline operativa vs log tècnic. Decidir si a llarg termini hi ha una entitat única d'events.
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
**SEGÜENT**: desplegar migració a Railway.
**FET** *(2026-04-10 per `claude` — Canvi #45)*: `taskQueueService.ts` — queue operativa intel·ligent amb 5 classificacions (VENÇUT, AVUI, VIP, BLOQUEJAT, NORMAL), scoring, filtres a la UI. 18 tests.
**FET** *(2026-04-10 per `claude` — Canvi #48)*: `taskAutomationService.ts` — 7 regles d'automatització (SLA, stale, prep, payment, post-event, at-risk, quote). Cada tasca vinculada a entitat concreta amb deduplicació. API + botó a UI. 14 tests.
**FET** *(2026-04-10 per `codex` — Canvi #68)*: cron `/api/cron/tasks-auto` per executar `runTaskAutomation` diàriament amb Bearer `CRON_SECRET`, status `automation.tasks`, registre a `/admin/crons` i tests de route.
**MÉS ENDAVANT**: alertes en temps real i ajust fi de regles automàtiques segons dades reals.

## 6.5 CRM / Customer Hub
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: CRM potenciat. Customer Hub elevat visualment. Nous camps CRM. Lectura global del client.
**EN MARXA**: pas de "fitxa" a "workspace d'acció".
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
**SEGÜENT**: decidir si aquest mateix criteri de “CTA només cap a destins realment suportats” s’ha d’auditar també a altres banners o targetes executives fora de Customer/Lead Hub.
**PENDENT CRÍTIC**: Customer Hub com a cervell comercial. Evitar client repartit en pantalles paral·leles.
**MÉS ENDAVANT**: segments intel·ligents, reactivació assistida i automatismes comercials amb traçabilitat.

## 6.6 Leads / Pipeline comercial
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: LeadWorkspace reforçat. Timeline del lead coherent. Tasques en model canònic.
**EN MARXA**: conversió del workspace en cabina comercial real.
**FET** *(2026-04-09 per `claude` — Canvi #17)*: `leadInsightsService.ts` — next action, loss risk, commercial context. Integrat a lead detail page.
**FET** *(2026-04-10 per `claude` — Canvi #36)*: `LeadInsightsBanner.tsx` — next action amb CTA, risc de pèrdua amb raons, context comercial visible. Integrat entre executive section i LeadGuidedFlow.
**FET** *(2026-04-10 per `claude` — Canvi #46)*: `leadScoreBreakdownService.ts` — scoring explicable amb breakdown visual. Component `LeadScoreBreakdown` amb barra, factors, punts. Integrat al lead detail. 18 tests.
**FET** *(2026-04-10 per `claude` — Canvi #51)*: `leadReengagementService.ts` — 6 classificacions (UPCOMING_EVENT, HOT_STALE, QUOTE_NO_REPLY, NEGOTIATION_COLD, EARLY_SILENCE, LONG_DORMANT) amb missatges ca/es i UI `/admin/leads/reengagement`. 22 tests.
**FET** *(2026-04-10 per `claude` — Canvi #81)*: `leadPipelineSuggestionsService.ts` — 7 suggeriments automàtics de pipeline (hot uncontacted, stale negotiation, quote no reply, event soon, high value idle, bulk new, winning streak). API + panell integrat a `/admin/leads`. 25 tests.
**FET** *(2026-04-11 per `codex` — Canvi #109)*: `dailyBriefService.ts` deixa de duplicar criteris comercials i consumeix `loadPipelineSuggestions()` per alimentar alertes i accions de `HOT_UNCONTACTED`, `QUOTE_NO_REPLY` i `EVENT_SOON_NO_BOOKING` des de la capa canònica.
**FET** *(2026-04-11 per `codex` — Canvi #110)*: `operationalPulseService.ts` consumeix `loadPipelineSuggestions()` i separa la `conversió pipeline` del nou indicador `salut pipeline`, perquè el dashboard vegi tant el resultat com la fricció comercial real des de la mateixa font canònica.
**SEGÜENT**: valorar si la UI del dashboard ha de destacar explícitament quins senyals de pipeline estan degradant el pols.
**FET** *(2026-04-11 per `codex` — Canvi #113)*: el resum extern `commercial-daily` ja reflecteix les alertes crítiques del matí, de manera que el dashboard no és l'únic lloc on apareixen aquests senyals.
**PENDENT CRÍTIC**: evitar que Leads sigui pantalla separada conceptualment del Customer Hub. Flux clar: lead nou → negociació → conversió → reserva → client recurrent.
**MÉS ENDAVANT**: reengagement de leads dormants automatitzat.

## 6.7 Bookings / Operacions
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: detall visual més fort. Header, KPI cards, seccions premium. Mojibake visible corregit.
**FET** *(2026-04-09 per `claude` — Canvi #1)*: timeline canònica a Bookings — `fetchCanonicalEventsForBooking` substitueix `adminLog` cru.
**EN MARXA**: transformació del detall en "cabina d'operacions".
**FET** *(2026-04-09 per `claude` — Canvi #14)*: `bookingOperationalService.ts` — snapshot operacional unificat. 25 tests, integrat a `page.tsx`.
**FET** *(2026-04-09 per `claude` — Canvi #19)*: `fetchCanonicalEventsForBooking` enriquit — consolida adminLog booking + inventory adminLog + leadActivity del lead origen en una sola història ordenada. Tanca el pendent crític de la història coherent.
**FET** *(2026-04-10 per `claude` — Canvi #50)*: `bookingCapacityService.ts` — visió global de càrrega operativa per dia. 4 nivells (FREE/LIGHT/FULL/OVERLOADED), grid 14d, KPIs. 15 tests.
**FET** *(2026-04-16 per `claude` — Canvi #129)*: alertes de col·lisió automàtiques — `loadCapacityConflicts()` integrat al `commercialDailyAutomationService` amb bloc HTML email + línia WhatsApp. Test mock + 2 tests específics (email + WA) afegits.
**MÉS ENDAVANT**: planificació avançada.

## 6.8 Inbox / Comunicacions
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: Inbox existent i funcional. Jerarquia del workspace reforçada amb triatge visible, recompte de resultats i acció recomanada al detall.
**EN MARXA**: no plenament integrada a la història canònica del client.
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
**PENDENT CRÍTIC**: evitar que comunicacions visquin com a capa paral·lela.
**MÉS ENDAVANT**: inbox unificada multi-canal.

## 6.9 Social / Contingut / Growth
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: backend Social Media Calendar tancat (schema, servei `socialPostService`, routes `/api/admin/social-posts`, constants, 32 tests).
**FET** *(2026-04-10 per `claude` — Canvi #38)*: `SocialClient.tsx` + `/admin/social/page.tsx` — workspace complet amb vista llista, vista calendari mensual, CRUD modal, filtres per estat, navegació mensual, KPIs clicables. Integrat al menú a la secció Contingut.
**FET** *(2026-04-10 per `claude` — Canvi #40)*: `socialIdeasService.ts` — idees de post auto-generades des de bookings recents, testimonials aprovats, portfolio nou i esdeveniments futurs. Panell integrat al `SocialClient` amb pre-emplenat del modal.
**FET** *(2026-04-17 per `claude` — Canvi #147)*: `socialPerformanceService.ts` — mètriques de rendiment per canal: `computePlatformMetrics` (posts per estat, breakdown contentType/category, millor dia/hora, avgPostsPerWeek, daysSinceLastPost), `computeConsistencyScore` (% setmanes amb activitat), `generateRecommendations` (inactivitat, baixa freqüència, falta diversitat, posts no publicats). API `/api/admin/social-posts/performance`. 19 tests.
**SEGÜENT**: revisar visualment el workspace Social, decidir si cal planificador editorial avançat.
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
**EN MARXA**: experiència premium real, no només funcional. Canvi #77: auditoria visual/overflow global del repo iniciada per `codex`, treballant per `codex`, tancament pendent.
**FET** *(2026-04-10 per `claude`)*: visual premium aplicat a Lead detail (executive KPIs → glass+stagger, booking section → glass cards), Tasks (llista → glass cards amb indicador vençut), Social (KPIs → glass+stagger, posts → glass cards, idees → glass, calendari → glass). 0 hex hardcoded nous.
**FET** *(2026-04-10 per `claude` — Canvi #74)*: Activity — KPI stats cards, mobile cards i desktop table amb `admin-card-glass` + `admin-stagger-item` + hover subtle. Empty state coherent.
**SEGÜENT**: revisar responsive 375px de les pàgines tocades (Activity, Leads detail, Tasks, Social).
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
**SEGÜENT**:
- revisar header/footer/home i altres punts d'entrada comercials per si queda alguna jerarquia pública duplicada fora del catàleg compartit
- revisar coherència visual i narrativa entre home, serveis, portfolio i admin
- build complet ja validat al Canvi #57 i netejat de pressió Prisma al Canvi #58; queda refinament narratiu/SEO de pàgines singulars i hubs
**PENDENT CRÍTIC**:
- web i admin no poden semblar dos productes diferents
- els literals públics compartits no poden tornar a `app/config` ni components: han de passar per `messages/*` + helper `lib/*`
- evitar que la neteja i18n trenqui SEO o metadata per locale
**MÉS ENDAVANT**: replantejament complet de home, serveis, portfolio, formularis i missatge de marca coherent entre web pública, admin i emails.

## 6.13 Qualitat / Tests / Fiabilitat
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca · separació clara entre copy web, copy admin i semàntica de domini.
**FET**: `tsc` en verd als blocs treballats. Tests globals pujats. Backend Social amb tests nous. Afegida regressió específica de `Customer Hub` perquè `fetchCustomerHub` consumeixi `lead.universalTasks` quan no hi ha `customerTasks`.
**FET** *(fins Canvi #69)*: `validate:core` passa complet: protocol, encoding complet, imports de messages, layer catalogs, Task canònic, TypeScript, i18n packs i i18n equipment. `build:ci` passa amb 255/255 pàgines; `qa:protocol` valida comptador, propietat de canvis nous i artefactes reals de newline.
**EN MARXA**: review de regressions visuals després dels molts mòduls nous de Claude; tests globals i build ja tenen barrera verda recent.
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
**EN MARXA**: consistència i neteja general del repo.
**FET** *(2026-04-11 per `codex` — Canvi #111)*: el shell global de notificacions ja no depèn només de leads i alertes de negoci; també incorpora `inboxUnreadCount` i polling lleuger per detectar correu nou sense recarregar.
**FET** *(2026-04-11 per `codex` — Canvi #114)*: el shell admin deixa enrere el punt genèric de notificació: badge numèric real al header i l'entrada `Safata (IMAP)` mostra el recompte viu de correus no llegits en lloc del marcador estàtic `IMAP`.
**FET** *(2026-04-10 per `claude`)*: build complet amb barrera `validate:core` passat en verd (qa:protocol, qa:encoding, qa:message-imports, arch:layer:check, tsc, i18n:packs:guard, i18n:equipment:guard + next build).
**FET** *(2026-04-10 per `claude`)*: `validate:core` integrat a `ci.yml` com a step obligatori al job `lint-typecheck`. Substitueix els steps separats `arch:layer:check` + `tsc` per un sol `pnpm run validate:core` (7 guards).
**FET** *(2026-04-11 per `claude`)*: pre-commit hook instal·lat a `.git/hooks/pre-commit`. Executa `qa:encoding:changed` (mojibake dels fitxers canviats) + `tsc --noEmit` (TypeScript incremental). Lleuger (<5s) i bloquejant si falla.
**FET** *(2026-04-16 per `claude` — Canvi #127)*: mojibake residual eliminat a `lib/constants/index.ts` (~20 emojis corruptes CP1252→UTF-8 reparats: WEDDING, SOURCE_ICONS, LEAD_STATUS_ACTION_OPTIONS, INVENTORY_CATEGORY, SETTINGS, INTAKE_SOURCE/EVENT_TYPE_OPTIONS, ACTIVITY_CATEGORY_OPTIONS, TESTIMONIAL/DISCOUNT/LEAD_EMAIL icons, PUBLIC_TESTIMONIAL_API_MESSAGES). Allowlist `scripts/check-layer-catalogs.mjs` ampliat amb `lib/publicHomeShowcase.ts` (Canvi #124-125). Test `customerRouteService.test.ts` alineat al constant canònic `CUSTOMER_ANONYMIZED_NAME`. Validació: `validate:core` 7/7, 2392 tests, build net.
**FET** *(2026-04-16 per `claude`)*: `build:ci` avaluat — CI ja executa `validate:core` (job lint-typecheck) + `next build` (job build) per separat; `build:ci` queda com a conveniència local, no cal al CI. `check-patches` avaluat: 0 findings a 885 fitxers, 5 detectors centrats en code smells (no lingüístics). No cal separar ara — si apareixen falsos positius lingüístics, crear `check-language-quality.mjs` apart. `docs/runbook.md` i `docs/estat-admin.md` actualitzats: crons 6→10, endpoints `/api/admin/crons/...`→`/api/cron/...`.
**SEGÜENT**: crear `check-language-quality.mjs` separat si `check-patches` genera falsos positius lingüístics.
**PENDENT CRÍTIC**: evitar regressions silencioses en repo gran.
**MÉS ENDAVANT**: scripts de salut del repo. Checks de consistència de dominis compartits.

## 6.15 Roadmap de millores identificades (backlog prioritzat)
**CARACTERÍSTIQUES EXIGIDES**: monocapa · responsiu real · 0 hardcoded visible compartit · 0 mojibake · bellesa funcional obligatòria · zero overflow visible · TypeScript en verd al perímetre tocat · tests quan toca.
**FET** *(2026-04-10 per `claude` — Canvi #84)*: backlog exhaustiu documentat a `lib/constants/adminManual.ts` com a `ADMIN_MANUAL_ROADMAP` i visible a `/admin/manual`. Cada ítem porta prioritat, impacte, esforç i àrea.

### SEGÜENT (Crítiques — impacte directe a conversió)
- **[CRITICAL] ~~Motor de nurturing automàtic de leads~~** — ✅ FET (anteriorment). `commercialSequenceService.ts` executa cadència 5 passos (1d/3d/7d/14d/30d) amb email/WA, integrat al cron `commercialDailyAutomation`.
- **[HIGH] ~~Forecast predictiu per estat del pipeline~~** — ✅ FET (Canvi #115). `loadDailyBrief` usa `LEAD_SCORING_STATUS_PROBABILITY` per estat en lloc de `budget × 0.3` fix.
- **[HIGH] ~~A/B testing de plantilles d'email~~** — ✅ FET (Canvi #133). `emailTrackingService.ts` ampliat amb click tracking (clickedAt/clickCount), link wrapping, report amb best/worst performer. Ruta `/api/tracking/click/[token]`, API `/api/admin/email-tracking`. Migració schema. 33 tests.
- **[HIGH] ~~Attribution multi-touch del journey~~** — ✅ FET (Canvi #128 + #131). `generateMultiTouchReport` + `loadMultiTouchReport` amb journeys, crèdits per canal (first/assist/last touch), insights i veredicte. 12 tests nous. Dashboard connectat al model multi-touch amb panell operatiu.
- **[HIGH] Command palette global (Cmd+K)** — Cercador universal per saltar a qualsevol pàgina/lead/client/reserva en <2s.\n  Estat actual: base funcional tancada al Canvi #102; següent tall en marxa per extreure la lògica a capa pura i afegir tests.

### SEGÜENT (Importants — qualitat operativa)
- **[MEDIUM] ~~Scoring dinàmic automàtic de leads~~** — ✅ FET (anteriorment). `commercialScoring.ts` calcula score 0-100 + probabilitat + band. Cron `commercialDailyAutomation` actualitza `cachedScore` diari en lots.
- **[MEDIUM] ~~Detector d'anomalies al Daily Brief~~** — ✅ FET (Canvi #115). `dailyAnomalyService.ts` compara 5 KPIs vs mitjana 30d, threshold 50%. Panel `AnomalyPanel` al dashboard quan hi ha desviacions.
- **[MEDIUM] ~~Alertes de conflicte de capacitat operativa~~** — ✅ FET (Canvi #116). `capacityConflictService.ts` detecta col·lisions d'inventari entre reserves. Panel `CapacityConflictPanel` al dashboard.
- **[MEDIUM] ~~Notificacions push/email per alertes CRITICAL~~** — ✅ FET (Canvi #115). `commercialDailyAutomationService` envia alertes CRITICAL per email i WhatsApp al resum diari.
- **[MEDIUM] ~~Benchmark automàtic setmanal~~** — ✅ FET (Canvi #126). Test de route nou (4 tests) + fix workflow `daily-crons.yml` (`if:` del job mai s'executava). Servei, ruta, catàleg ADMIN_CRON_PREFIXES i job GitHub Actions ja existien prèviament.

### MÉS ENDAVANT
- **[LOW] Audit trail de decisions administratives** — Log de qui/perquè es va perdre un lead.

**PENDENT CRÍTIC**: aquestes millores no són "nice to have" aïllades — cadascuna tanca un gap identificat. Prioritzar per impacte vs esforç.

## 6.16 Màrqueting i captació externa (del zero)
**CONTEXT**: L'usuari reconeix que no té experiència en màrqueting i els clients no arriben. L'admin està preparat per gestionar leads, però fa falta un embut de captació real. Aquesta secció és el pla d'acció pas a pas.
**FET** *(2026-04-10 per `claude` — Canvi #84)*: pla d'acció màrqueting documentat (veure baix). Cal executar-lo per fases.

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
**SEGÜENT**: preparar una reunió de treball per definir Fase 0 (ICP + proposta de valor) — sense això no es pot començar res.

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

# 10. Veredicte

OrbitaEvents està en fase de **refinament seriós**.

El zenit no arribarà per afegir 40 mòduls més. Arribarà per:

- una sola veritat per domini
- workspaces premium
- fluxos nets
- visual potent
- operativa impecable

Aquest document s'ha d'anar actualitzant fins que el sistema deixi de semblar només potent i passi a semblar **inevitable**.
