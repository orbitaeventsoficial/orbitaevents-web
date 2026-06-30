# 🎨 Canonització VISUAL (capa 2) — homogeneïtat real entre pàgines

> **Ordre del propietari (2026-07-01):** «quan he demanat canònic, també em referia a AIXÒ».
> La capa 1 (eliminar classes `xx__` → tokens) està feta (deute 0). Però **canònic també vol
> dir que es VEGIN idèntics**: mateix header, mateixos contenidors, mateixes mides de botó i
> tipografia. Aquesta capa 2 ho tanca. «Confio en tu, tu pots fer-ho.»

## Per què la capa 1 no n'hi havia prou
Eliminar `xx__` i fer que consumeixin tokens va treure el deute estructural, PERÒ van quedar
**múltiples classes canòniques que fan el mateix amb valors lleugerament diferents**. Exemple
real (la queixa del propietari): `.ap-leads-pagehead` tenia `padding: 12px/10px` propi mentre
`.ap-header` usava `var(--head-pad)` → headers de 120px vs 98px. Token compartit, estructura no.

## ESTUDI D'ABAST (2026-07-01)
| # | Inconsistència | Detall | Acció |
|---|---|---|---|
| V1 | **4 sistemes de header** | `.ap-header`, `.ap-detail-hero`, `.ap-leads-pagehead`, `.ap-ledger-hd` | Tots consumeixen `--head-*` per a padding/border/fons. Verificar que eyebrow+títol base són EXACTAMENT iguals. |
| V2 | **4 sistemes de tabs** | `.ap-tab` (canònic) + `.ap-leads-view` + `admin-economia-tab` + `admin-catalog-tab` | Unificar tots a `.ap-tab`/`--active`/`--idle`. |
| V3 | **~64 px hardcoded** | a `.ap-*` (8/6/16/12/10px…) | Tokenitzar a `--o-space-*` (escala 4px). Homogeneïtza espaiats. |
| V4 | **N classes de títol** | `.ap-title`, `.ap-detail-title`, `.ap-leads-h1`, `.ap-dochist-title`, `.ap-leads-lanetitle`… | Totes han de consumir `--o-text-2xl`+`--display`+`--o-fw-xbold` (algunes ja). Auditar i alinear. |
| V5 | **N classes d'eyebrow** | `.ap-eyebrow`, `.ap-leads-eyebrow`, `.ap-detail-kicker`, `.ap-leads-leadkicker` | Totes `--o-text-xs`+`--mono`+`--ls-eyebrow`+uppercase. Auditar i alinear. |
| — | Botons | `.ap-btn`+4 variants | ✅ Ja coherent. |

## FULL DE RUTA (per impacte visual)
- [ ] **V1 Headers**: confirmar els 4 sistemes amb eyebrow+títol+padding idèntics (leads fet #1305; falta verificar detail-hero, ledger-hd contra ap-header píxel a píxel).
- [ ] **V2 Tabs**: `admin-economia-tab` + `admin-catalog-tab` + `.ap-leads-view` → `.ap-tab`. (3 sistemes → 1).
- [ ] **V3 px → tokens**: tokenitzar els ~64 px d'espaiat a `--o-space-*`.
- [ ] **V4 Títols**: alinear totes les classes `*title*`/`*h1*`/`*name*` als tokens de títol.
- [ ] **V5 Eyebrows**: alinear totes les classes `*eyebrow*`/`*kicker*` als tokens d'eyebrow.

## Mètode
Per cada eix: 1) escanejar les classes implicades, 2) detectar les que divergeixen del canònic,
3) alinear-les als mateixos tokens (o fusionar a la classe canònica), 4) captura comparativa,
5) commit + validate:core. Cap canvi a cegues; la fitxa de lead (referència) es preserva exacta.

## Criteri de «fet»
Obrir 5 pàgines diferents (leads, bookings, presupuestos, tasks, economia) i que els headers,
títols, eyebrows, tabs i espaiats siguin **indistingibles** (mateix dissenyador). El propietari
ho valida visualment.
