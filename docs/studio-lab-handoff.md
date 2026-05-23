# Studio Lab · Òrbita Command — handoff

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

## Estat actual (Canvi #765 — Sala de comandament: senyal visual, no soroll)

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
