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

## Estat actual (Canvi #762 — Òrbita Command v2)

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
| `app/studio-lab/page.tsx` | Client component. Dades: `STAGES`, `INITIAL_LEADS`, `LAYERS`, `SIGNALS`, `NEXT_ACTION`, `ACTIONS_BY_STAGE`. Estat React + drag&drop + agenda mensual. |
| `app/studio-lab/studio-lab.css` | Tokens scoped a `.sl-root` + colors d'estat sòlids + estats interactius + agenda mensual + responsive. |
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
