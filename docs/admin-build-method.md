# Mètode de construcció de pàgines admin + marca TANCAT CHARLIE

> Com es construeix CADA pàgina de l'admin perquè totes surtin amb el mateix nivell.
> Complement de `docs/admin-migration-checklist.md` (què queda) i `docs/admin-inventari-pagines.md` (mapa 🔴/🟡/🟢).

---

## 0. Principi rector: l'admin és UN TOT — òrgans d'un organisme (paràmetre d'avaluació, propietari 2026-06-15)

**L'admin NO és un conjunt de pàgines independents. És un organisme, i cada pàgina (dossiers, leads, fitxa de lead, safata/inbox, reserves, clients, packs…) és un ÒRGAN del mateix cos.** No s'audita ni es construeix cap pàgina mirant-la aïllada: es mira com a part del tot.

Conseqüències pràctiques (i criteri d'avaluació per a tota auditoria/TANCAT CHARLIE futur):

1. **Mateixa sang** — tots els òrgans comparteixen el sistema visual únic (`/admin/studio` + `orbita-tokens.css`): tokens, tipografia, estats, components. Cap òrgan inventa paleta, hex, gradients, patrons de layout ni copy local propi. Si falta una peça, primer s'amplia el sistema compartit, després es consumeix (norma §2.5).
2. **Mateix llenguatge** — copy, labels, estats, llindars i microcòpia segueixen el mateix to i viuen a la capa comuna (`lib/constants/*`, `messages/*`). Dos òrgans que fan el mateix gest l'anomenen igual.
3. **Òrgans connectats, no illes** — els fluxos del negoci travessen òrgans (lead → dossier → safata → reserva → client). Els punts de connexió (enllaços, transicions, dades i context compartit entre seccions) són tan importants com cada òrgan per separat. Una pàgina que no enllaça amb el seu context està incompleta.
4. **Coherència del conjunt** — el resultat ha de sentir-se un sol cos. En revisar diverses pàgines alhora, la pregunta no és «cada una està bé?», sinó «se senten part del mateix organisme?».

**Test d'avaluació (aplicar a cada pàgina abans de donar-la per tancada):**
- (a) Consumeix el sistema compartit sense inventar res local?
- (b) Parla el mateix llenguatge visual i de copy que la resta de l'admin?
- (c) Connecta bé amb els òrgans veïns (entrades/sortides del flux)?
- (d) Posada al costat de les altres, el conjunt sembla dissenyat per una sola mà?

Si una pàgina falla (a)–(d), no és `TANCAT CHARLIE` per molt polida que estigui en solitari.

### 0.1 Revalidació de pàgines ja tancades pel propietari

Quan el propietari demana revisar pàgines que "teòricament ja estan tancades", la feina principal NO és tornar a fer-les ni buscar detalls decoratius. La feina principal és **unificar criteri entre les pàgines validades**:

- una mateixa jerarquia visual per llegir estat, risc, valor i següent acció;
- els mateixos patrons de feedback, empty state, loading i error;
- formats canònics compartits (moneda, dates, WhatsApp, enllaços a òrgans veïns);
- mateixa densitat, mateix to i mateixa manera de decidir què és protagonista i què és secundari;
- cap dependència estranya d'un òrgan sobre CSS/copy intern d'un altre.

Una pàgina pot continuar sent `TANCAT CHARLIE` només si, posada al costat de les altres pàgines tancades pel propietari, sembla part del mateix sistema i no una peça feta amb un criteri diferent.

### 0.2 «Sèrie Òrbita Events» — fet pel mateix dissenyador (criteri d'autor, propietari 2026-06-15)

Tot l'admin ha de semblar una **sèrie d'una sola marca, dissenyada per la mateixa mà**. No quatre pàgines que funcionen: una col·lecció coherent «Òrbita Events». Cada òrgan s'avalua contra aquests SET eixos, alhora:

1. **Visual** — mateixa qualitat d'acabat: espaiat, ritme, alineació, jerarquia, densitat. Cap pàgina «pobre» al costat d'una «rica».
2. **Coherència** — mateixos patrons per al mateix gest (botons, feedback, empty state, loading, error, capçaleres, taules, modals). Si una pàgina ho fa d'una manera, totes igual.
3. **Canònic** — consumeix el sistema (`/admin/studio` + `orbita-tokens.css`); res inventat localment. Si falta, s'amplia el sistema primer.
4. **Monocapa** — cada decisió (color, copy, label, format, llindar) viu a UN sol lloc compartit; zero duplicats locals.
5. **Responsiu** — 375px / tablet / desktop comprovats a cada peça; res que es trenqui a mòbil.
6. **Corporatiu** — to i identitat Òrbita: seriós, net, premium, en català; copy amb veu de marca, no argot intern ni text de farciment.
7. **Tècnic** — sòlid sota el capó: tipat estricte, a11y, sense codi mort, sense residus (hex/px/`!important`/inline), tests del que és nou, i **cablejat real entre òrgans verificat** (els enllaços/params/context flueixen i tenen sentit).

**Regla d'or:** si un usuari passés per `/admin/dossiers`, `/admin/leads`, la fitxa, `/admin/inbox`… i notés que «aquesta pantalla la va fer una altra persona», la sèrie no està tancada. L'objectiu és que no es noti la costura entre òrgans.

### 0.3 Les mides, mostres i formats de la sèrie viuen a `/admin/studio` (propietari 2026-06-15)

Tota decisió canònica de la sèrie —**mides** (escala tipogràfica, espaiats, alçades de fila, radis), **mostres** (com es veu cada component: botons, capçaleres, empty states, badges, taules, cards) i **formats** (patrons de feedback, loading, error, densitat)— s'ha de **deixar exposada a `/admin/studio`** com a fitxa tècnica viva, a més dels tokens a `app/studio/orbita-tokens.css`.

- Studio és el **mostrari** de la sèrie: el lloc on es veu el patró canònic abans de consumir-lo des d'un òrgan.
- Quan una passada canonitza un patró nou (p. ex. una capçalera estàndard, un empty state compartit, una variant de botó), s'**afegeix a Studio** la mostra + la mida/format de referència. Additiu: mai buidar Studio (guard `qa:studio-integrity`).
- Cap òrgan inventa una mida/format que no tingui reflex a Studio. Si el necessita, primer s'amplia Studio, després es consumeix.

---

## 1. La marca `TANCAT CHARLIE`

Significa: **pàgina validada pel propietari** («Charlie»). A prop de final, no 100% acabada, però **és el model de referència** al qual la resta s'ha de semblar.

És un eix **diferent** de l'estat de migració:
- 🟢 = migrada tècnicament al sistema visual.
- `TANCAT CHARLIE` = el propietari l'ha checkat i la dóna per bona com a patró.

### 1.1 Maniobra obligatòria quan el propietari diu `TANCAT CHARLIE`

Quan el propietari diu que una pantalla està revisada o `TANCAT CHARLIE`, l'agent **atura la feina nova i primer consolida aquest fet**:

1. Actualitza `docs/admin-inventari-pagines.md`: estat 🟢 i nota explícita `TANCAT CHARLIE — revisada pel propietari`.
2. Comprova si el fitxer principal de la pantalla ja té la marca al top; si no, l'afegeix amb la data.
3. Afegeix al bloc d'agent-sync que aquella ruta és zona protegida.
4. A partir d'aquell moment, la pantalla no es reobre per "millorar-la" ni per fer auditories genèriques. Només es toca si el propietari ho demana explícitament o si una regressió tècnica demostrable la trenca.
5. Si la pantalla tenia subzones pendents, es documenten com a subpantalles separades. No es baixa el rang de la pantalla validada.

Objectiu: no perdre temps redescobrint pantalles ja revisades pel propietari ni tornar a posar en dubte criteris humans ja tancats.

**Marca canònica (comentari al TOP del fitxer de pàgina/component):**

```tsx
// ─────────────────────────────────────────────────────────
// ✅ TANCAT CHARLIE — validat pel propietari (DATA)
// Patró de referència. A prop de final (no 100%). La resta de
// pàgines s'ha de construir fidel a aquest model.
// ─────────────────────────────────────────────────────────
```

### 1.2 Fitxa forense obligatòria abans de construir

Abans de qualsevol actuació visual, funcional o de cablejat sobre una pantalla admin, la pantalla ha de tenir fitxa `FETA` a `docs/admin-fitxes-pantalles.md`. Si no la té, la feina no és "millorar la pantalla": la feina és auditar-la.

La fitxa `FETA` exigeix:

1. història del component (`git log --follow`, diari/protocol i motiu original);
2. reachability real des de la ruta viva, no només imports que semblen ús;
3. lectura línia per línia de ruta, components propis, CSS local, helpers, APIs i serveis específics;
4. comprovació CSS contra DOM real;
5. cable punta a punta: UI → acció → API/servei → dades → resposta → òrgan veí;
6. detecció explícita de duplicacions, codi mort, codi latent i hardcoded;
7. diagnòstic de connexions interrompudes: si la capacitat viu en 2, 3 o 4 illes en lloc d'un organisme;
8. decisió abans d'implementar: conservar, fusionar, podar, reconnectar o protegir.

No es marca `FETA` perquè compila, perquè el navegador carrega o perquè un grep no troba res. `FETA` vol dir que el component ha estat entès i que no queda cap peça sobrera sense nom ni decisió.

---

## 2. Pàgines validades pel propietari (Charlie) — **A CONFIRMAR**

Segons el que has dit: targetes del calendari, client pipeline, llista i «alguna més». La meva millor correspondència (confirma'm la llista exacta abans d'estampar):

- [ ] Targetes del calendari → `app/admin/calendario/CalendarMonthClient.tsx` (+ Week/Day?)
- [ ] Client pipeline → `app/admin/leads/LeadPipelineView.tsx`
- [ ] Llista → `app/admin/clientes/*` (llista) o `app/admin/leads` (llista)?
- [ ] «Alguna més» → ___

> Quan em confirmis la llista, estampo la marca al top de cada fitxer en un sol pas.

---

## 3. Mètode de construcció (per cada pàgina nova/migrada)

**Principi: partir de PANTALLA NEGRA, no del disseny vell.** No es retoca el Frankenstein; es reconstrueix net.

1. **Pantalla negra** — començar del buit amb el canvas i els tokens del sistema (`/admin/studio`), no arrossegant CSS antic.
2. **Element per element, de més a menys important** — primer el que aporta valor real (dades, accions, decisions), després el secundari. No pintar abans de tenir l'esquelet funcional.
3. **Treure soroll a cada pas** — eliminar el que no aporta: camps morts, duplicats, decoració buida, catàlegs locals. Menys, però net.
4. **Sense hardcoded** — colors → tokens `--ax-*`/`--o-*`; textos/labels → `lib/constants/*`; res de hex/`style={{`/`rgba` (el hook ho vigila).
5. **Responsiu** — 375px / tablet / desktop comprovats.
6. **Accessibilitat** — `htmlFor`+`id`, `aria-label`, `scope="col"`, focus visible.
7. **Tot relacionat** — la pàgina ha d'enllaçar amb el seu context (fitxa ↔ llista ↔ bolo ↔ partner ↔ client), no illes.
8. **El propietari valida CADA pàgina** abans de tancar-la. Fins que no diu «ok», no és `TANCAT CHARLIE`.

## 4. Funcions noves → marcar-les sempre

Si una pàgina incorpora una **funció nova** (no existia abans), s'ha de marcar perquè el propietari la validi expressament:

- Al **diari** (`admin-diary.md`): secció «Funcions noves en aquest tall».
- A la **UI**, opcionalment, un petit indicador `✨ NOU` mentre estigui pendent de validació.
- Un cop el propietari la valida → passa a formar part del `TANCAT CHARLIE` de la pàgina.

> Regla: cap funció nova es dóna per bona sola. Es construeix, es marca, el propietari la prova, i només llavors es consolida.

## 5. Ordre de treball
Seguir `docs/admin-migration-checklist.md` (Comercial → Finances → Growth → Catàleg → Sistema), **1-3 pàgines per sessió**, cada una: construir → treure soroll → validació del propietari → marca → tancar al diari/counter.
