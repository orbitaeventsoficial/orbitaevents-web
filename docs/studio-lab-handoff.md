# Studio Lab · Òrbita Command — handoff

> **ESTAT 2026-06-03:** `/studio-lab` ha estat retirat del codi. Aquest document queda com a arxiu històric del prototip, no com a guia activa. No recrear la ruta sense ordre explícita del propietari.

> **Per continuar sense re-explicar res.** Obre això i sabràs on som i què toca.
> Superfície: `http://localhost:3000/studio-lab` (intern, `noindex`, sense auth).

## Què és

`/studio-lab` és el **laboratori del nou admin**: el concepte **Òrbita Command**.
Premissa: *el sistema no organitza pantalles, organitza decisions*. No és un CRM amb
menús; és un lloc de comandament per a una empresa d'esdeveniments, amb els bolos i les
decisions al centre.

Distinció de les tres superfícies:
- `/admin` → l'admin **real** de producció (el que es vol substituir).
- `/studio` → la **fitxa tècnica** del sistema visual (tokens, components, PDFs). Zona protegida.
- `/studio-lab` → el **laboratori** on es dissenya el nou admin (aquesta pàgina).

## Estat actual (Canvi #777 — shell lateral + fitxa v2 consolidats + poliment)

> **#777** (`/studio-lab/leads`): consolidació a git de la feina de **codex** (estava al working tree sense commitejar ni enumerar): `AppShell` reescrit de barra superior a **menú lateral** (logo real, àrees amb subítems, cerca ⌘K, "Nova entrada", peu amb el xip de canvi) i **fitxa de lead v2** a dues columnes orientades a la decisió (informació | accions·canvi d'estat·previsió). Per damunt, **poliment de Claude**: xip `Canvi #N` mogut al peu del menú (capçalera de Temporada descongestionada), calendari més dens (`grid-auto-rows` 104→94) i ritme vertical ajustat, i **neteja total de codi mort** (residus de la transició top-bar→lateral i de la fitxa v1; dos `@media 900px` fusionats). Captures `.codex-captures/leads-desktop-*.png` i `leads-mobile-*.png`. Pendent del vistiplau "wow" del propietari sobre el shell lateral i la fitxa v2.

> **#775** (`/studio-lab/leads`): paleta refeta. **Or = heroi únic** (marca + diners + única acció primària); chrome calmat (nav/toggle/xips de mes = selecció tranquil·la, no taronja). **Carbassa retirada.** **4 estats distints per hue**: nou=topazi, contactat=ametista, guanyat=maragda, perdut=cendra — cap usa l'or, així "color = estat" funciona. **Forats silenciosos**: caselles lliures sense repetir "Lliure", s'encenen en or (oportunitat) en hover. Captures `leads-cal-v2.png` / `leads-pipe-v2.png`.

> **#774** (blindatge): les proves #768–773 estaven documentades al diari/protocol però **no commitejades** (git a #767). Reconciliades a git. `qa:protocol` ara exigeix que el xip `LAB_CHANGE_NUMBER` de `/studio-lab/leads` sigui igual a `ADMIN_CHANGE_COUNTER` — cada canvi s'ha de reflectir al diari **i** a la pàgina o la validació falla. Retirada la prova morta `app/studio-lab/flux/`. Numeració lligada: counter ↔ protocol ↔ diari ↔ xip = **774**.

> **#773** (`/studio-lab/leads`): millora radical d'estructura/flux — nova **zona FOCUS** (comandament "la decisió que toca ara", ciclable ‹ ›, amb anella de probabilitat i acció contextual) que s'**enllaça en or** amb la casella del calendari i la targeta del pipeline del bolo en focus. Base: calendari de caps de setmana amb forats, sense preu (#772). Numeració lligada: counter ↔ protocol ↔ diari ↔ xip = **773**.

### Pròxims passos (demà) — palanques per al "wow" (acordat #773)
1. **Clic al calendari → carrega el bolo a la zona FOCUS** (ara obre directament la fitxa). Flux "toca i decideix" sense sortir; la fitxa s'obre des del FOCUS.
2. **Senyals visuals a les caselles lliures**: ressaltar oportunitats (caps de setmana buits propers) en lloc de només "Lliure".
3. **Transicions animades** en ciclar el FOCUS i en canviar de mes.
- En validar-se el "wow", iniciar la implantació real seguint `docs/studio-lab-leads-implantacio.md`.
- Direcció visual blindada a la memòria `feedback-studio-lab-estetica` (Brass & Obsidian: fosc, or+carbassa, tons joia, plàstic sense neó, calendari amb forats, sense preu a les targetes, numeració sempre lligada).

### Base immediata (Canvi #772 — calendari amb forats, sense preu + llums/color + checklist)

> **#772** (`/studio-lab/leads`): graella de caps de setmana amb forats mantinguda, **preu fora de les targetes** (tipus·nom·hora·lloc), llums/color afinats (vinyeta, sheen, reservats il·luminats pel seu to). Nou `docs/studio-lab-leads-implantacio.md` amb el checklist per portar el prototip a l'admin real (reutilitzant pipeline, fitxa, colorTheme, weatherService, costEngine…).

### Base immediata (Canvi #771 — redirecció radical "Brass & Obsidian")

> **#771** (`/studio-lab/leads`): passada de disseny sencera amb comandament creatiu del propietari. Direcció **"Brass & Obsidian"**: obsidiana càlida, **or** com a identitat de marca (moneda `Ò` + xifres de diners) i **carbassa sofisticada** com a accent d'acció; tons **joia** per estats (sense blau, sense candy, sense glow). Profunditat **plàstica** real (reservats en relleu, lliures enfonsats), atmosfera càlida + gra, aparició esglaonada. **Calendari** de caps de setmana com a vista principal amb **selector de mesos** per córrer tot l'any; pipeline secundari. Targetes enriquides i consistents (tipus, nom, hora·lloc, import en or). `Canvi #771` visible a la UI. Pendent del vistiplau "wow" del propietari.

### Base immediata (Canvi #770 — retorn a Contrast negre)

> **#770** (`/studio-lab/leads`): descartada la prova crema/grassa. Es torna al **Contrast negre** que agradava, conservant els ajustos bons: blanc menys agressiu, noms/imports més continguts i informació de data/lloc/pax/producte/següent pas més llegible. `Canvi #770` visible a la UI.

### Base immediata (Canvi #769 — CRM Events en Contrast únic)

> **#769** (`/studio-lab/leads`): el lab de leads queda com a **CRM Events** en **Contrast únic**. Eliminats Grafit/Marfil/Joia i el selector d'aspecte. Blanc base rebaixat a off-white, targetes reequilibrades perquè nom/import no eclipsin data/lloc/pax/producte/següent pas, i responsive mòbil corregit després de retirar el selector.

### Base immediata (Canvi #768 — grafit operatiu + número visible)

> **#768** (`/studio-lab/leads`): el lab de leads passa a **Grafit** per defecte, amb paleta menys neó, franja de mètriques de temporada, pipeline més compacte i xip visible **Canvi #768** a la capçalera. El tall queda enumerat a diari/protocol i el responsive del resum queda ajustat.

### Base recent de `/studio-lab/leads` (Canvi #767)

> **#767**: esquelet d'app separat per `/studio-lab/leads`, quatre aspectes commutables (Grafit/Marfil/Joia/Contrast), hora/lloc al calendari i fitxa de lead amb `location`.

### Base recent de `/studio-lab` (Canvi #766 — poliment visual sobre la Sala de comandament)

> **#766** (només `studio-lab.css`): targetes ocupades amb rentat d'estat des de la vora-espina (joies sobre vellut), caselles lliures convertides en pou recollit (reforça el `ple/buit`), hover amb halo d'estat i capçaleres Dv/Ds/Dg més llegibles. Sense canvis de lògica ni de `page.tsx`.

### Base (Canvi #765 — Sala de comandament: senyal visual, no soroll)

Aclariment del propietari: volia **menys soroll, no menys interfície**. Es **mantenen** els elements que valorava (navegació superior per àrees, calendari de caps de setmana Dv/Ds/Dg, pipeline de columnes arrossegable) i s'elimina el **soroll textual** (dades advisory en paraules), que ara es llegeix **visualment**. Construït amb la skill `frontend-design`.

Composició:
- **Masthead** (`sl-mast`): marca `Òrbita` (serif) + navegació per àrees amb desplegables (`sl-nav`) + data + senyal d'atenció (punt + número).
- **Temporada** (`sl-cal`): 3 mesos (`SEASON_WINDOW=3`), cada mes amb un **meter de capacitat** (un punt ple/buit per cap de setmana) i la graella **Dv/Ds/Dg** (`sl-grid`). Casella ocupada → client (serif) + vora-espina de color (estat). Casella lliure → **buit visible** (sense la paraula "Lliure"). `⚠` = conflicte.
- **Pipeline + Detall** (`sl-ops`): columnes Nou→Perdut arrossegables (`sl-board`/`sl-lead`) amb estat en color; i el **detall mínim** (`sl-detail`) del bolo seleccionat o el més urgent per defecte (nom, data, import, cobrament en barra, equip amb conflicte ressaltat, fase en punts, una acció).

Principi: **color = estat**, **ple/buit = capacitat**, **barra = cobrament**, **⚠ = conflicte**, **punts = fase**. Es conserva només la dada (client, data, import, equip).

Sistema visual: **espresso càlid + un sol metall (llautó)**, serif **Cormorant** (`--font-serif`) per a titulars i imports, sans per a UI, mono per a dades; hairlines i molt aire. Dades de **mostra**. Sense dependències noves.

### Històric (substituïts per #765)
- #764 — comandament mínim (una zona de focus + temporada); massa despullat, treia elements que el propietari volia.
- #763 — vora, paleta joia i agenda de caps de setmana.
- #762 — Òrbita Command v2 (triage + cockpit).

Re-centrat en el **temps com a espina** + **execució**, no només venda. Quatre pilars:

1. **Triage "Avui"** (el cor, a dalt): 3-5 decisions reals prioritzades per pes i urgència
   (conflicte > resposta pendent > senyal en risc > resta a cobrar > tancament calent > producció pendent).
2. **Capacitat de temporada**: Juny/Juliol/Agost bolo a bolo amb **detecció de conflictes** de
   dia/recurs (DJ, so, llums, furgoneta, fotògraf). KPI `Conflictes`, banner i marcador ⚠.
3. **Pipeline** com a **lent** (no centre): drag & drop HTML5 + re-ordenable per capa
   (Temps/Diners/Persones/Operació canvien l'ordre de les columnes, ja no són decoratives).
4. **Cockpit d'execució** del bolo seleccionat: semàfor de **cobrament** (senyal/resta),
   barra de **producció** (checklist %), **equip** amb conflicte ressaltat, *pròxima millor acció*
   contextual i fletxes `‹ ›` per moure de fase (moviment usable a mòbil sense drag).

- **Model de dades enriquit** (`Bolo`): data ISO, recursos, senyal/resta, checklist, dies sense contacte.
- **Mòbil usable**: selector d'estat en graella + cockpit amb fletxes; tot apila net a 390px.
- **Ergonomia**: `prefers-reduced-motion`, text no-blanc-pur sobre fons no-negre-pur, vermell saturat només en accents.
- Dades de **mostra** (no connectat encara a leads reals).

## Fitxers

| Fitxer | Rol |
|---|---|
| `app/studio-lab/page.tsx` | Client component. Dades de mostra `INITIAL_BOLOS` + helpers purs. Estat: `selectedId`, `openMenu` (nav), `monthAnchor`, `draggingId`/`dragOver`. `stateOf` (color), `findConflicts`, `months` (temporada), `detail` (seleccionat o més urgent). |
| `app/studio-lab/studio-lab.css` | Tokens scoped a `.sl-root`: espresso + llautó, serif Cormorant (`--sl-serif`). Regions `sl-mast`/`sl-nav`, `sl-cal`/`sl-grid`/`sl-cell`, `sl-board`/`sl-lead`, `sl-detail`. Estat via `[data-state] → --c`; responsive. |
| `app/studio-lab/layout.tsx` | `robots: noindex`. |
| `.dbg-studio-lab.cjs` | Captura Playwright → `.codex-captures/studio-lab.png`. |

## Roadmap (per ordre)

1. **Connectar a dades reals**: `INITIAL_BOLOS` són mostra. Recursos i conflictes haurien de
   venir de l'inventari/equip real i del calendari (`fetchCustomerHub`, booking inventory).
2. **Persistir** l'estat del pipeline i les assignacions d'equip (ara es reseteja en recarregar).
3. **Resolució de conflictes**: acció real des del triage/cockpit per reassignar recurs o data.
4. **Motiu de pèrdua** en moure un bolo a "perdut" (coherent amb `leadLoss` del repo).
5. **Comandaments reals**: WhatsApp amb senyal, cobrar senyal/resta, generar contracte, reservar equip.
6. **Promoure a esquelet del nou admin** quan convenci, i muntar-hi les peces de `/studio`.

## Validació / captura

```bash
npx tsc --noEmit
node scripts/check-layer-catalogs.mjs     # studio-lab exempt
# dev net (si surt "Cannot read properties of undefined (reading 'call')" → rm -rf .next i torna a arrencar)
npx next dev
node .dbg-studio-lab.cjs                   # captura
```

## Regles de la casa

- Tot canvi (prova o definitiu) → **git** + diari amb número de canvi (`ADMIN_CHANGE_COUNTER`).
- No tocar `/studio` (zona protegida) ni l'admin consolidat des d'aquí.
- Català sempre. Colors via tokens `--sl-*` (no hex nou al JSX).
