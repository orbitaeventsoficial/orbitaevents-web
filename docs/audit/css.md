# Auditoria CSS — Òrbita Events

Data: 2026-06-16 · Abast: tots els `.css` sota `app/` (admin + studio + globals).
Llei visual: `app/studio/orbita-tokens.css` (font de tokens) · canon NET: `leads-design.css` + calendari.

Avaluació per 4 eixos: **hardcoded · monocapa · responsiu · canònic**.
Severitat: **P0** crític · **P1** alt · **P2** mitjà · **P3** menor.

Nota d'abast:
- `app/studio/studio.css` és ZONA PROTEGIDA (fitxa tècnica / laboratori). Els hex de les **previsualitzacions de PDF/documents** (línies ~2700–3900) són reproduccions de color d'impressió i NO es reporten (excepció acceptada tipus canvas). Es reporten només les paletes locals reinventades (`--os-*`, `--lab-*`) com a P3.
- `app/globals.css` és el web **públic** (sistema Tailwind propi amb tokens `--oe-*`/`--bg-*` definits al seu `:root`). No consumeix la capa admin `--ax-*`. Els hex del bloc `:root` són definició de tokens (acceptat). Es reporten com a P3 els pocs hex i `#000` fora del bloc de tokens.

---

## Taula de violacions (ordenada per severitat)

| fitxer:línia | eix | descripció | severitat |
|---|---|---|---|
| inbox.css:921,1406,1412,1420-1422,1884-1886 | canònic/hardcoded | Token fantasma `--o-stage-done` (no existeix a orbita-tokens) usat a 7 punts → color cau a `initial`, semàfor «enviat/OK» sense color real | P1 |
| booking-detail.css:149-154 | canònic | Bloc CSS trencat: `.bd__overview #sec-serveis,` acaba la llista de selectors amb coma i el segueix directament un `@media` → regla invàlida, el grid de la secció «serveis» no aplica el `grid-column: span 6` esperat | P1 |
| inbox.css:8 + 1494 + 1494(flex-row) | monocapa | `.sf` definit 2 cops (línia 8 `flex-direction: column`, 1494 `flex-direction: row`) → la primera direcció és codi mort; fusionar | P1 |
| inbox.css:418 + 539 + 1904 | monocapa | `.sf__lead` definit 3 cops (la 3a el redefineix de `flex` a `grid`) → 2 definicions són codi mort que enganya el manteniment | P1 |
| admin-theme.css:66-118 | hardcoded/canònic | Paleta Control Room `--at-cr-*`: ~40 hex blau-slate i blaus de superfície (`#5a98c0`,`#111a2a`,`#172135`,`#1a2437`,`#8ecbff`,`#67d6ff`,`#263245`…). El blau NO existeix com a superfície al canon; són una paleta sencera fora de tokens | P1 |
| control-room.css:6→1061 (tot el fitxer) | canònic | Tots els selectors usen `.admin-shell` (selector MORT — no existeix al DOM segons CLAUDE.md). Si el dashboard depèn d'aquest CSS, no s'aplica; si s'aplica és per una capa intermèdia fantasma | P1 |
| admin-theme.css:358-366 | hardcoded | `admin-gradient--fab` i `--progress-emerald`: gradients amb hex literals (`#f59e0b,#f97316,#fbbf24,#fb923c,#10b981,#34d399`) en lloc de tokens d'estat | P2 |
| admin-theme.css:351 | hardcoded/canònic | `.admin-form-deep { background-color: #0a0a0a; }` — negre quasi absolut hardcodejat (hauria de ser `--ax-canvas`/`--o-admin-ink`) | P2 |
| admin-theme.css:60 | hardcoded/canònic | `--at-glass-bg: rgba(18, 24, 38, 0.88)` — blau-slate tintat (no carbó) | P2 |
| admin-shell.css:614-622 | canònic | `.ap-detail-bar-btn--accent` usa blau `rgba(95,183,232,.3/.08/.14)` + fallback `#5fb7e8` com a accent de botó → introdueix blau d'acció (el canon reserva or per accions) | P2 |
| admin-shell.css:570-771 (ap-detail-*) | hardcoded | Bloc «header sticky canònic»: desenes de `rgba(255,255,255,X)` i `rgba(10,10,12,.94)` literals + font-sizes en px (32px,17px,14px,13px,11px,10px) en lloc de tokens `--ax-*`/`--o-text-*` | P2 |
| admin-theme.css:372-385 | canònic | `.admin-shell .admin-stagger-item` — stagger global penjat del selector mort `.admin-shell`; si el DOM no el té, l'animació no s'aplica | P2 |
| control-room.css:474-525 | hardcoded | Glows/semàfors amb rgba literals fora de token: `rgba(245,158,11,…)`, `rgba(251,113,133,…)`, `rgba(251,191,36,…)`, `rgba(52,211,153,…)`, `rgba(34,211,238,…)` | P2 |
| control-room.css:754-1060 | hardcoded | Customer/booking/leads hero: `color-mix(... white …)` i `... black …` (keywords blanc/negre absoluts) repetits a ~30 regles en lloc de `--ax-light`/`--ax-ink` | P2 |
| booking-detail.css:285-315, 1072-1097 | monocapa/canònic | Clúster de `!important` (≈14) per sobreescriure `.admin-booking-*` (de control-room.css). `!important` sobre classe pròpia = senyal de doble font; viu mentre dura la migració però és deute | P2 |
| inbox.css:165,363,373,1601,1667,1682,1500,1668 | responsiu | Amplades de columna fixes en px: `.sf__inv 280px`, `.sf__list/__main 360px`, `.sf__pane 340px/260px`, `.sf__sidebar 175px/155px` → maquetació a píxel (hauria de ser rem/clamp/%) | P2 |
| nb-design.css:267-273 + 310-311 | monocapa | `.nb__cfg-grp--menu` i `.nb__cfg-grp--menu[open] > summary` definits 2 cops (267-270 i 310, 271 i 311) → segona definició duplicada | P2 |
| nb-design.css:201 | canònic | `var(--o-fw-regular)` — token fantasma (existeix `--o-fw-normal`); el `font-weight` queda ignorat | P2 |
| admin-shell.css:34-42 | hardcoded | `font-size: 12px !important` per escalar texts Tailwind petits — `!important` + px sense token (mínim tipogràfic) | P3 |
| admin-shell.css:19,26-28,245-253,290-294,402 etc. | hardcoded | Font-sizes base en px literals (14px, 24px, 13px, 11px) en lloc de `--o-text-*` al shell/error boundary | P3 |
| reengagement.css:308 | canònic | `list-none: none;` — propietat inexistent (typo de `list-style`); declaració morta | P3 |
| customer-hub.css:332 | monocapa | `.ch__rail { }` — regla buida (placeholder) = soroll | P3 |
| customer-hub.css:419-420 | canònic | `.ch__tab--on { color: var(--ax-panel); }` — text = color de panell sobre fons clar `--ax-fill-bright`; correcte però fràgil (depèn que fill-bright sigui prou clar) | P3 |
| dossiers.css:2-7,12,19,59… | monocapa | Fallbacks a tokens fantasma `--ax-border`, `--ax-surface2`, `--ax-t1` (no existeixen; sempre cauen al fallback `--ax-fill-*`/`--ax-t`). Funciona, però els noms primaris són inventats | P3 |
| studio.css:2322-2331, 4620-4628 | monocapa | Paletes locals `--os-*` (`#58d7ff`,`#ff5f7e`,`#f2bd63`…) i `--lab-*` (`#0a0a0c`,`#d7b86e`…) reinventen tokens canònics dins la zona protegida (lab) | P3 |
| studio.css:146,213,215,638-662,4701-4789 | hardcoded | Hex de component fora de PDF dins studio (`#2a2010`,`#7a5e1f`,`#e2b865`,`#3fa06a`,`#9d83c2`,`#e0922b`…) — botons/cel·les del lab amb color literal | P3 |
| globals.css:194 | hardcoded | `body.hero-loading { background: #000 !important; }` — negre absolut + `!important` (web públic) | P3 |
| globals.css:1004,1077,1785,1803 | hardcoded | Hex de component al web públic fora del bloc `:root` (`#fb923c !important`, `#000 !important`, `#a5f3fc`, `#e0f7fa`) | P3 |
| clientes.css:66 / arxiu-design.css:40 / docs-view.css:60 | responsiu | `min-width` de taula en px (`860px`/`92px`/`32rem`) — acceptable (scroll-x), però els px purs podrien ser `rem`/`ch` | P3 |

---

## Recompte

### Per eix (violació principal de cada fila)
| eix | recompte |
|---|---|
| hardcoded | 12 |
| canònic | 9 |
| monocapa | 7 |
| responsiu | 3 |
| **Total files** | **31** |

### Per severitat
| severitat | recompte |
|---|---|
| P0 | 0 |
| P1 | 6 |
| P2 | 11 |
| P3 | 14 |
| **Total** | **31** |

---

## Fitxers NET (canon-compliant, sense violacions materials)

- `leads-design.css` (canon de referència)
- `tasks.css` · `intake.css` · `arxiu-design.css` · `docs-view.css` (exemplars, rem+clamp+token)
- `clientes.css` · `customer-hub.css` · `reengagement.css` · `dossiers.css` (token-based; només P3 menors anotats)
- `nb-design.css` (token-based; només els 2 duplicats + token fantasma)

## Observació transversal

El deute real concentrat és **`control-room.css` + la paleta `--at-cr-*` d'`admin-theme.css`**: és l'únic illot de blau-slate i selectors `.admin-shell` morts de tot l'admin. Els òrgans nous (leads, tasks, intake, booking, inbox, dossiers) ja consumeixen la sèrie correctament. La neteja d'alt impacte i baix risc seria migrar el dashboard Control Room a tokens `--ax-*` i eliminar el prefix `.admin-shell`.
