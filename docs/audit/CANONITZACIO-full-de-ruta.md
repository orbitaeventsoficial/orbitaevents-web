# 🎯 Full de ruta — CANONITZACIÓ TOTAL de l'admin (mira a Studio)

> **Ordre del propietari (porta dies demanant-ho):** tot el repo ha de mirar a Studio.
> *Canònic* = canvio un token/component a Studio i **tota la web respon**. Ara NO és així:
> cada pàgina té estructures pròpies. Aquest document és la llei d'aquesta feina i la
> coordinació amb Codex. **No es treballa sol.**

## 1. Definició de «canònic» (4 capes — totes han de mirar a UNA font)
| Capa | Font única | Estat |
|---|---|---|
| 🎨 **Color/superfícies** | `orbita-tokens.css` (`--o-*`) | ✅ funciona (test fucsia) |
| 🔤 **Tipografia/mida/pes/espaiat/radius** | `orbita-tokens.css` (`--o-text-*`, `--o-fw-*`, `--o-space-*`, `--o-r-*`) | ✅ majoritàriament |
| 🧩 **Components** (header, card, botó, input, KPI, tab, badge, taula, row…) | classes canòniques `.ap-*` que consumeixen tokens | 🔴 **EL DEUTE** |
| ⚙️ **Lògica/dades** (cost, estats, copy, labels) | `lib/services/*`, `lib/constants/*`, `messages/*` | ✅ majoritàriament |

**El problema viu a la capa 3 (Components):** 21 sistemes de classes propis dupliquen el que
hauria de ser UN component canònic. El header n'és NOMÉS UN EXEMPLE.

## 2. Diagnòstic — 21 sistemes propis · 5.859 usos (a eliminar)
| Prefix | Usos | Pàgina/zona | Migra a (canònic) |
|---|---|---|---|
| `ch__` | 958 | hub de client (`clientes/[id]`) | AdminPage + AdminSection + .ap-card/.ap-kpi |
| `fxd__` | 683 | leads + bookings/[id] | AdminPage + .ap-card + .ap-btn |
| `sf__` | 553 | inbox | AdminPage + .ap-card + .ap-btn |
| `bd__` | 533 | booking detail | AdminPage + AdminSection |
| `nb__` | 533 | new booking | AdminSection + .adm-input + .ap-btn |
| `fx__` | 376 | leads workspace (shell) | AdminPage + .ap-card |
| `dg__` | 348 | dossiers generator | AdminSection + .ap-card + .ap-btn |
| `tk__` | 237 | tasks | AdminPage + .ap-card + .ap-btn ← **EN CURS** |
| `cl__` | 192 | clientes (llista) | AdminPage + taula canònica + .ap-btn |
| `rf__` | 185 | referrals | AdminPage + .ap-card |
| `ni__` | 171 | intake | AdminPage + AdminSection + .adm-input |
| `cx__` | 164 | inbox/compose | AdminSection + .adm-input + .ap-btn |
| `lr__` | 152 | leads/reengagement | AdminPage + .ap-card |
| `pr__` | 137 | presupuestos | AdminPage + .ap-card |
| `rc__` | 122 | reactivation | AdminPage + .ap-card |
| `dmd__` | 75 | docs view | AdminSection |
| `ax__`, `ix__`, `bd-`, … | ~600 | shell/varis | revisar cas a cas |

**Nota:** `ax__`/`ix__` (a admin-shell.css) poden ser part del shell canònic — verificar si són
infraestructura legítima abans de tocar. `ap-*` és el canònic (NO es toca, és el destí).

## 3. Mapatge de migració (taula de conversió universal)
| Element propi | → Canònic |
|---|---|
| `xx__header` / `xx__pagehead` / `xx__hero` | `<AdminPage title eyebrow subtitle actions kpis>` |
| `xx__section` / `xx__panel` / `xx__card` | `<AdminSection>` o `.ap-card` |
| `xx__btn` / `xx__btn--sm` / `xx__btn--prim` | `.ap-btn` / `.ap-btn--xs` / `.ap-btn--primary` |
| `xx__input` / `xx__searchinput` / `xx__sel` | `.adm-input` |
| `xx__kpi` / `xx__stat` | `.ap-kpi` (gramàtica: label `--mono`, número `--display`) |
| `xx__badge` / `xx__pill` / `xx__tag` | `.ap-badge` o `admin-tone-*` |
| `xx__title` (h1) | `.ap-title` (dins AdminPage) |
| `xx__eyebrow` | `.ap-eyebrow` |
| `xx__table` / `xx__row` | taula canònica (`.ap-table` si existeix; si no, crear-la a Studio PRIMER) |
| `xx__empty` | `<AdminEmptyState>` |
| `xx__spinner` / `xx__loading` | skeleton/spinner canònic |

**Regla d'or (propietari):** si falta un component canònic, **primer s'amplia Studio/components
canònics, després es consumeix.** Afegir elements està bé — però han de ser canònics. MAI un `xx__` nou.

### Regla de decisió per element (propietari 2026-06-30)
Per cada element propi `xx__` trobat:
1. **Equival a un canònic existent?** → migra'l (`xx__btn`→`.ap-btn`).
2. **Es repeteix en ≥2 pàgines fent el mateix?** → **ajunta i simplifica** en UN canònic compartit (amplia Studio); totes l'usen.
3. **És exclusiu d'una pàgina però vàlid?** → es **crea de nou COM A CANÒNIC** a Studio/components (no `xx__`). Es simplifica si es pot.
> Resum: ajuntar el que es repeteix · crear canònic el que és exclusiu · zero estructures pròpies.

## 4. Mètode per pàgina (repetible)
1. Llegir la pàgina + el seu `xx.css`.
2. Substituir l'estructura: `<AdminPage>` + `<AdminSection>` + `.ap-card`/`.ap-btn`/`.adm-input`…
3. El contingut específic (stats, toggles, rail) passa com a **props** (`actions`, `kpis`, `tabs`).
4. Si falta un canònic → ampliar Studio/components PRIMER.
5. **Esborrar** el `xx.css` (o les classes migrades).
6. Validar: `tsc` 0 · `validate:core` 0 · captura desktop **+ mòbil 375px** (responsiu obligatori).
7. Documentar el canvi (#NNN) + marcar el checklist d'aquí.

## 5. Ordre de prioritat (de més usat / més vist a menys)
- **Fase A (workspaces grans, ús diari):** tasks ← *en curs* · clientes · bookings · presupuestos · leads
- **Fase B (hub i detalls):** clientes/[id] (`ch__`) · bookings/[id] (`bd__`/`nb__`) · dossiers (`dg__`)
- **Fase C (comunicació):** inbox (`sf__`) · compose (`cx__`)
- **Fase D (CRM secundari):** referrals · reactivation · reengagement · intake
- **Fase E (neteja final):** docs view · residus shell

## 6. CHECKLIST D'ESTAT (es marca a mesura)
- [x] **Header: tokens canònics `--head-*` a Studio** (#1255) — 6 sistemes consumeixen els mateixos paràmetres
- [x] **tasks** → header (AdminPage) + botons (.ap-btn) + tokens (#1258). Kanban card/queue = layout específic tokenitzat (protocol OK).
- [ ] clientes (llista) → canònic + esborrar `clientes.css`
- [ ] bookings → canònic
- [ ] presupuestos → canònic + esborrar `presupuestos.css`
- [ ] leads → canònic (cas complex: rail de temporada com a contingut, no estructura)
- [ ] clientes/[id] hub (`ch__`, 958) → canònic
- [ ] bookings/[id] (`bd__`/`nb__`) → canònic
- [ ] dossiers (`dg__`) → canònic
- [ ] inbox (`sf__`/`cx__`) → canònic
- [ ] referrals / reactivation / reengagement → canònic
- [ ] intake (`ni__`) → canònic
- [ ] docs view (`dmd__`) → canònic
- [x] **Guard ratchet `qa:canon-debt`** (#1265): baseline 5892, bloqueja regressions, força deute→0. Integrat a validate:core.

## 7. Honestedat sobre l'abast
Això és una **refactorització gran** (no d'una sessió): ~5.900 usos en 21 sistemes. Es fa
**pàgina a pàgina, validada**, no a cegues (un canvi massiu trencaria funcionalitat). La
direcció és la del propietari i és correcta. Aquest document és la coordinació amb Codex:
**qui agafi una pàgina, marca el checklist i avisa a `agent-sync.md`.**

## 8. Coordinació Codex ↔ Claude
- Claude arrenca per **tasks** (Fase A). Codex: no toquis tasks mentre estigui en curs.
- Repartir per pàgines senceres (no per capes) per evitar trepitjar-se.
- Cada pàgina migrada = 1 canvi documentat + checklist marcat aquí.
