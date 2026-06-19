# Auditoria — `app/admin/components/` + `app/admin/lib/` (.tsx)

Data: 2026-06-16 · Abast: 38 fitxers compartits de l'admin · Avaluació contra 4 eixos (0-hardcoded, monocapa, responsiu, canònic).

Llei visual de referència: carbó + or; blau prohibit com a superfície; negre/blanc absolut prohibit; consumir capa canònica `.ap-*` + `admin-tone-*` + tokens `--panel/--line/--t/--gold`.

## Taula de violacions

| fitxer:línia | eix | descripció | sev |
|---|---|---|---|
| AnomalyPanel.tsx:3-7 | canònic | `LEVEL_STYLE` map local amb fons plens `bg-emerald-500/[0.06]`, `bg-rose-500/[0.06]`, badges `bg-emerald-500/20`. Estat com a fons tintat (no accent/punt) → trenca gramàtica Cristina | P1 |
| AnomalyPanel.tsx:12 | canònic | `bg-emerald-400/60` / `bg-rose-400/60` plens com a barra; haurien de ser `--o-success`/`--o-danger` | P2 |
| AnomalyPanel.tsx:6,14,26,56 | monocapa | `border-white/10`, `bg-white/[0.02]`, `bg-white/[0.06]`, `hover:bg-white/[0.03]` ad-hoc en lloc de `--line`/`--panel` | P2 |
| AnomalyPanel.tsx:47 | canònic | superfície feta a mà (`rounded-2xl border admin-card-glass`) en lloc de `.ap-card` | P2 |
| CapacityConflictPanel.tsx:7-9 | canònic | map local de severitat amb `bg-rose/amber/orange-400/60` i badges `bg-*-500/20`; `orange` ni existeix com a tone de sèrie | P1 |
| CapacityConflictPanel.tsx:12,22,47 | monocapa | `bg-rose-500/[0.04]`, `bg-white/[0.06]`, `border-white/10` ad-hoc; superfície a mà no `.ap-card` | P2 |
| WeatherWidget.tsx:71 | monocapa | `border-white/10 bg-white/[0.02]` en lloc de `--line`/`--panel` (`.ap-card` existeix) | P2 |
| WeatherWidget.tsx:79 | responsiu | `min-w-[160px] max-w-[200px]` px fixos en card; hauria de ser `rem`/`ch`/`clamp()` | P2 |
| WeatherWidget.tsx:89 | canònic | `text-cyan-400/80` (blau) per a la pluja; fora del canon carbó+or | P2 |
| WeatherWidget.tsx:83 | canònic | `text-xl font-bold font-mono` per número; hauria de ser `var(--display)` (no `font-mono`) | P3 |
| AttributionPanel.tsx:30,53,109,135,160,168,174,225,236 | monocapa | `border-white/10 bg-white/[0.02-0.05]` repetit; superfícies a mà (mai `.ap-card`) | P2 |
| AttributionPanel.tsx:33,176-191,241-255 | canònic | `text-lg/2xl/xl font-black` per números en lloc de `var(--display)` | P2 |
| AttributionPanel.tsx:61,78-80,99-105,176,196,212-214,249 | canònic | accents `admin-tone-*-cyan` (blau) per "first touch"; cyan és tone de sèrie però blau a superfície/badge contradiu "blau no existeix" | P2 |
| AttributionPanel.tsx:84,88,239-253 | monocapa | `bg-black/10` ad-hoc (negre semi); hauria de ser `--sunk`/`--panel` | P3 |
| AttributionPanel.tsx:68-70 | canònic | `bg-[var(--o-info)]` per la barra first-touch — `--o-info` és blau; canon vol or/neutre | P3 |
| CaptureHealthPanel.tsx:20-24 | canònic | `TREND_COLOR` map local `text-emerald-300/text-rose-300/text-white/50` en lloc de `admin-tone-text-*` | P1 |
| CaptureHealthPanel.tsx:45,61,71,80 | canònic | `text-base/2xl font-black` per números/headline en lloc de `var(--display)` | P2 |
| CaptureHealthPanel.tsx:50,58-118 | monocapa | `border-white/10 bg-white/[0.02-0.03]`, `bg-white/10`, `hover:bg-white/10` ad-hoc repetit; superfície a mà no `.ap-card` | P2 |
| OperationalPulsePanel.tsx:24-29 | canònic | `LEVEL_DOT` amb `bg-[var(--o-info)]` (blau) per nivell GOOD; punt d'estat blau fora del canon | P2 |
| OperationalPulsePanel.tsx:13 | canònic | `LEVEL_BG.GOOD = admin-tone-bg-cyan` — fons d'estat blau en secció sencera | P2 |
| OperationalPulsePanel.tsx:48,60,70 | monocapa | `bg-white/[0.04]`, `bg-black/10`, `bg-white/[0.03]`, `hover:bg-white/[0.06]` ad-hoc | P3 |
| DailyBriefPanel.tsx:13,24,32-44,87 | monocapa | `border-white/10 bg-white/[0.03]`, `hover:bg-white/5` ad-hoc repetit; superfície a mà no `.ap-card` | P2 |
| DailyBriefPanel.tsx:40,42 | canònic | `border-rose-500/30 bg-rose-500/[0.04]` + `text-rose-300` plens per "vençudes" en lloc de `admin-tone-*-danger` | P1 |
| WeeklyCapacityForecastPanel.tsx:4-8 | canònic | `ALERT_STYLE` map local amb `bg-amber-500/[0.08]`, `bg-rose-500/[0.08]`, `text-amber/rose-300`, `border-white/10 bg-white/[0.03]`; WARNING/CRITICAL no usen `admin-tone-*` | P1 |
| WeeklyCapacityForecastPanel.tsx:16-19,32,56,60-61 | canònic | `border-rose/amber-500/30`, `text-rose-300`, `text-emerald-300` inline per YoY/sobrec. | P2 |
| NBAExplainPanel.tsx:13-18 | canònic | `URGENCY_CHIP` map local: `bg-rose-500/10`, `bg-amber-500/10`, `bg-white/5` plens en lloc de `admin-tone-*` (CRITICAL/HIGH/LOW) | P1 |
| NBAExplainPanel.tsx:38,42-43,50,52-55,64 | canònic | bloc IA tot en `border-violet-500/25 bg-violet-500/[0.05]`, `text-violet-300/400` (violeta = no carbó+or); skeleton `bg-white/[0.06]` | P1 |
| AiCopySuggestionsInline.tsx:48,60-83 | canònic | botó i panell IA en `border-violet-500/30 bg-violet-500/5`, `text-violet-300/400`, `hover:bg-violet-500/15`; `bg-white/[0.03]` | P1 |
| ToastProvider.tsx:10-14 | canònic | `TOAST_STYLES` map local: success/error/warning fets amb `bg-emerald/rose/amber-500/20` plens; només `info` usa `admin-tone-*` | P1 |
| AdminHelpOverlay.tsx:268,279 | 0-hardcoded | `bg-black/90`, `bg-black/95` (negre quasi absolut) com a fons de panell/botó d'ajuda | P1 |
| AdminHelpOverlay.tsx:264 | canònic | `bg-black/[0.12]` vel; hauria de venir d'un token d'overlay | P3 |
| AdminSearchModal.tsx:261 | 0-hardcoded | `bg-black/60` backdrop hardcoded (repetit a ConfirmDialog) | P2 |
| AdminSearchModal.tsx:63,93-94,267-363 | monocapa | `border-white/10 bg-white/[0.03]`, `hover:bg-white/[0.06]` ad-hoc massiu en files i seccions | P2 |
| AdminSearchModal.tsx:291,345 | canònic | `text-rose-300` inline per error/empty en lloc de `admin-tone-text-danger` | P3 |
| ConfirmDialog.tsx:165 | 0-hardcoded | `bg-black/60` backdrop hardcoded | P3 |
| ConfirmDialog.tsx:198,213 | monocapa | `border-white/10 bg-white/5`, `border-white/30` ad-hoc al botó cancel·lar/spinner | P3 |
| InfoTooltip.tsx:130,154 | monocapa | `border-white/10`, `bg-white/10`, `border-white/15` ad-hoc; panel usa `var(--at-bg)` (token legacy `--at-*`, no `--panel`) | P2 |
| AdminHelpLegend.tsx:3 | monocapa | `border-white/10 bg-white/[0.03]` en lloc de `--line`/`--panel` | P3 |
| AdminHelpPanel.tsx:25 | canònic | superfície a mà `rounded-2xl border admin-card-glass` en lloc de `.ap-card` | P3 |
| QuickActions.tsx:111,123-161 | canònic | botons/links `rounded-xl border px-3 py-2` sense `.ap-btn`; superfície a mà `admin-card-glass` | P2 |
| QuickActions.tsx:114-119 | monocapa | classes sense color (`border`, `text-xs`) cauen al default del navegador; depèn de cascada global no explícita | P3 |
| StatusQuickSelect.tsx:51 | canònic | `<select className="rounded-xl border px-2 py-1">` sense `.adm-input`/`.ap-input`; estil de control no canònic | P2 |
| PipelineBoard.tsx:105,107,226 | responsiu | `max-h-[68vh]` ok, però `min-h-[320px]` px fix; `estimatedItemHeight=168` número màgic de layout | P3 |
| PipelineBoard.tsx:183,232-267,360 | monocapa | `border`/`border-b`/`border-dashed` sense color token; depenen de cascada (`col.toneClass` opcional) | P3 |
| dashboard-widgets.tsx:18-21,44-51 | monocapa | `accentClassMap` + `colorOverride` amb noms de color (`cyan/emerald/rose/amber/purple/sky`) com a contracte de domini; `sky`/`cyan` = blau | P2 |
| dashboard-widgets.tsx:149,288,343,349 | 0-hardcoded | `fontFamily="Inter, system-ui, sans-serif"` hardcoded a SVG `<text>` (repetit 4×); hauria de venir de token de tipografia | P3 |
| dashboard-widgets.tsx:297 | monocapa | `<span className="inline-block h-2 w-2 rounded-full" />` sense fons (llegenda "Any actual") → punt invisible/inconsistent | P3 |
| AdminLoadingSkeleton*.tsx (Dashboard:7-23, base:9-17, List/Detail/Inbox/Kanban/Calendar) | monocapa | `border-white/10 bg-white/[0.03-0.05]` ad-hoc a tots els skeletons en lloc de `--line`/`--panel` | P3 |
| AdminLoadingSkeletonCalendar.tsx:24,33 | responsiu | `min-w-[640px]` px fix al grid del calendari | P3 |

## Sense violacions rellevants (consumeixen capa canònica o són purs)

- `AdminPage.tsx` — tot via classes `.ap-*` (page/section/kpi/empty). Canònic net.
- `EditorControlStrip.tsx` — refet a carbó pla (`--line`/`--panel`/`--t*`), accents `admin-tone-text-*`, `.ap-btn`, tipografia `var(--mono)`/`var(--display)`. Model a seguir.
- `CommercialDocumentsHistory.tsx` — 100% classes `cdh__*` (CSS propi). Net.
- `OwnerControlStrip.tsx` — retorna `null` (erradicat #976). Net.
- `ExportCsvButton.tsx`, `MobileQuickActions.tsx` — consumeixen `.ap-btn`/`.ap-btn--*`. Net.
- `WxBadge.tsx` — classes `wx-badge*` + SVG (excepció canvas/SVG). Net.
- `Tooltip.tsx`, `SortableList.tsx`, `AdminHelpMode.tsx` — només classes `admin-*` de CSS o lògica pura. Nets.
- `DailyBriefPanel` previsió i `CaptureHealthPanel` barra d'origen usen tokens `--gold`/`--line`/`--sunk`/`--o-admin-gold-tint-3` correctament (parcial).

## Recompte

### Per eix
| eix | violacions |
|---|---|
| Canònic | 27 |
| Monocapa | 17 |
| 0-hardcoded | 4 |
| Responsiu | 5 |
| **Total** | **53** |

### Per severitat
| sev | nombre |
|---|---|
| P0 | 0 |
| P1 | 10 |
| P2 | 22 |
| P3 | 21 |
| **Total** | **53** |

## Patró sistèmic dominant

Els panells de dashboard (Anomaly, CapacityConflict, CaptureHealth, WeeklyForecast, NBAExplain, OperationalPulse, AttributionPanel, ToastProvider, AiCopySuggestions) comparteixen el mateix anti-patró: **map d'estats local** (`LEVEL_STYLE`/`ALERT_STYLE`/`URGENCY_CHIP`/`TOAST_STYLES`) amb **fons Tailwind plens** (`bg-emerald/rose/amber/violet-500/XX`) + **superfície a mà** (`border-white/10 bg-white/[0.0X] admin-card-glass`) en lloc de `.ap-card` + `admin-tone-*`. El refet model ja existeix a `EditorControlStrip.tsx`.
