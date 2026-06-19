# Auditoria admin operativa — calendario · cuadrant · tasks · inventory · collaborators

Data: 2026-06-17 · Abast: 41 `.tsx` sota `app/admin/{calendario,cuadrant,tasks,inventory,collaborators}/`

Context canònic: Carbó + or. Capa a consumir (`.ap-card`, `.ap-btn--*`, `.ap-kpi`, `.adm-input`/`.ap-input`, `admin-tone-*`, tokens `--panel/--line/--t/--gold`). El CALENDARI és la referència neta; els seus pocs colors crus (rose follow-ups, ring cyan/amber de selecció) són el patró establert i es marquen baix.

Severitats: P0 (trencat/inaccessible) · P1 (canònic dur: input fons blanc/negre, classe trencada, negre absolut) · P2 (superfície ad-hoc / map d'estat amb color cru) · P3 (tipografia ad-hoc).

| fitxer:línia | eix | descripció | severitat |
|---|---|---|---|
| inventory/[id]/InventoryItemEditor.tsx:511 | tècnic | Classe trencada `admin-tone-bg-cyanp-5` (falta espai → `admin-tone-bg-cyan p-5`); el padding i el to no s'apliquen | P1 |
| inventory/InventoryListSections.tsx:45,57 | tècnic | Classe inexistent `hover:bg-white/10/50` (doble slash); hover mort al toggle de vista | P1 |
| cuadrant/CrewBlockManager.tsx:93,99,103,107,111 | canònic | Inputs/select amb `bg-black/30` (negre absolut) en lloc de `.adm-input`/`.ap-input` | P1 |
| cuadrant/CrewBlockManager.tsx:77,90,122 | superfície | `bg-white/[0.02]`/`bg-white/[0.03]` ad-hoc en lloc de `.ap-card` | P2 |
| cuadrant/CrewBlockManager.tsx:128 | estat | `text-rose-300 hover:text-rose-200` cru en lloc de `admin-tone-text-danger` | P2 |
| cuadrant/page.tsx:71,106,124,151 | superfície | `bg-white/[0.03]`/`bg-white/[0.04]` ad-hoc per targetes en lloc de `.ap-card` | P2 |
| cuadrant/page.tsx:68,76,80,94,131,133,142,156,161,166 | tipografia | `text-[11px]`/`text-[10px]`/`text-[9px]` ad-hoc repetits | P3 |
| cuadrant/repartiment/page.tsx:49,51,53,55,70,75,87 | estat | Colors d'estat crus `amber-*`/`emerald-300/400` (a-col·laboradors / la-teva-part) en lloc de `admin-tone-{warning,success}` | P2 |
| cuadrant/repartiment/page.tsx:38,40,45,61,70 | superfície | `bg-white/[0.03]` ad-hoc per targetes en lloc de `.ap-card` | P2 |
| cuadrant/repartiment/page.tsx:46,50,54,83,94 | tipografia | `text-[9px]`/`text-[10px]`/`text-[11px]` ad-hoc | P3 |
| calendario/capacity/page.tsx:44,48,52,56,69,85 | superfície | `bg-white/[0.03]`/`bg-white/[0.04]` ad-hoc per targetes/dies en lloc de `.ap-card` | P2 |
| calendario/capacity/page.tsx:16,23 | estat | Maps `LOAD_CONFIG`/`ALERT_CONFIG` amb `text-white/50`+`bg-white/[0.02/03]` per nivells FREE/NONE (la resta de nivells ja usa `admin-tone-*`) | P2 |
| calendario/capacity/page.tsx:45,49,53,57,76,85,98,102,110,136,139,143,148,157,160 | tipografia | `text-[9px]`/`text-[10px]`/`text-[11px]` ad-hoc molt repetits | P3 |
| inventory/InventoryListSections.tsx:416,532 | estat | Barra de vida amb colors crus `bg-emerald-400/bg-amber-400/bg-orange-400/bg-rose-400` (només el `width:%` és excepció dinàmica, no el color) | P2 |
| inventory/InventoryListSections.tsx:517 | superfície | `hover:bg-white/[0.03]` ad-hoc a fila de taula | P2 |
| inventory/InventoryListSections.tsx:99,109,115,394,410,451,455,463,464,468 | tipografia | `text-[11px]`/`text-[10px]` ad-hoc repetits | P3 |
| inventory/InventoryListClient.tsx:439 | estat | `text-amber-400` cru a l'estat d'error en lloc de `admin-tone-text-warning` | P3 |
| inventory/[id]/InventoryItemEditor.tsx:200,230,234,238,261,380,429,471,484,487,492,501,523 | superfície | `bg-white/[0.03]`/`bg-white/[0.02]` ad-hoc repetit per seccions/cards en lloc de `.ap-card` | P2 |
| inventory/[id]/InventoryItemEditor.tsx:220,264,383,431,485,489,494,503,512,220+ | canònic | `text-white` absolut (no `white/X`) en múltiples títols/valors; el sistema usa `--t`/`white/80` | P2 |
| inventory/[id]/InventoryItemEditor.tsx:528 | canònic | Acció primària amb `bg-[var(--o-info)]` + estils manuals en lloc de `.ap-btn--primary` | P2 |
| inventory/[id]/InventoryItemEditor.tsx:231,235,239,293,341,451,488,493,502 | tipografia | `text-[11px]`/`text-[10px]` ad-hoc | P3 |
| inventory/[id]/page.tsx:145,146 | estat | Barra de vida amb colors crus `bg-emerald-400/bg-amber-400/bg-rose-400` | P2 |
| inventory/[id]/page.tsx:237,303 | superfície | `hover:bg-white/[0.03]` ad-hoc a files de taula | P2 |
| inventory/[id]/page.tsx:199 | tipografia | `text-[10px]` ad-hoc al badge "obligatori" | P3 |
| inventory/[id]/InventoryPhotoUpload.tsx:216,240 | tipografia | `text-[10px]` ad-hoc | P3 |
| collaborators/CollaboratorProductsPanel.tsx:221 | canònic | `bg-black/20` darrere `<Image>` (placeholder tècnic; negre absolut) | P2 |
| collaborators/CollaboratorProductsPanel.tsx:240 | canònic | `font-bold text-white` absolut al PVP | P3 |
| calendario/CalendarMonthClient.tsx:742 · CalendarWeekClient.tsx:355 · CalendarDayClient.tsx:417 | estat | Capa follow-ups amb `border-rose-500/30 bg-rose-500/10 text-rose-200` cru (patró del calendari canònic; uniformar a `admin-tone-danger` quan toqui) | P3 |
| calendario/CalendarMonthClient.tsx:638,639 · CalendarWeekClient.tsx:244 | estat | Anells de selecció/avui `ring-cyan-400`/`ring-amber-400` crus (patró canònic del calendari) | P3 |

## Recompte

- **Total troballes: 27 línies-grup** (≈ files de taula).
- **P0: 0**
- **P1: 3** (classe trencada editor, classe trencada toggle inventari, inputs negre absolut cuadrant-blocks)
- **P2: 14**
- **P3: 10**

## Notes de qualitat (no comptabilitzades com a violació)

- **Net / exemplars**: tot el mòdul `tasks/` (`tk__*` complet), `collaborators/page.tsx`, `CollaboratorsClient.tsx`, `PartnerHubClient.tsx` (`ap-*` complet), `TaskKanbanView.tsx`, els `loading.tsx` i `error.tsx`. Cap acció.
- El **cuadrant/repartiment** és el bloc més allunyat del cànon (sembla fet per una altra mà respecte a tasks/collaborators): superfícies `bg-white/[0.03]`, estats `amber/emerald` crus i tipografia `text-[Npx]` arreu. És el candidat prioritari de tokenització de la sèrie.
- `statusConf.bg`/`statusConf.text` (inventory) venen de `lib/inventory-utils` (config centralitzada), no són ad-hoc al JSX — fora d'abast.
