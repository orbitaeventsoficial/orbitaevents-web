# RESUM auditoria exhaustiva admin — 2026-06-16 (claude)

Consolidació de 5 informes (de 9 llançats; 4 pendents per límit de sessió: admin-operativa, admin-resta-a, front-pagines, front-components → rellançar després de les 23h).

Eixos: **0-hardcoded · monocapa · responsiu · canònic**. Referència NETA verificada: fitxa Cristina (`leads/[id]`), calendari, `EditorControlStrip`, blog, faq, scripts, `orbita-tokens.css`.

## P0
Cap. (Sense rutes admin sense auth, sense crash visual.)

## P1 — patrons sistèmics (atacar per arrel)

### A. Botons invisibles (`text-white` sense fons → no es veuen) — BUG FUNCIONAL
- `economia/PaymentReminderActions.tsx:72,80,88` (Email/WA/WA API)
- `sales-ops/RunCommercialSequencesButton`, `SendExecutiveReportButton`, `SlaAutomationButton`
- `economia/PaymentToggleButton.tsx:56-60`
- `stats/page.tsx:283` (Desar)
- `portfolio/page.tsx:622` (Crear event — a més `bg-white text-black` absolut)
- `image-manager/page.tsx:167,176` (`text-black` sobre or)
→ FIX: `.ap-btn ap-btn--primary` / `admin-tone-*`.

### B. Blanc/negre absolut (PROHIBIT)
- `clientes/[id]/_components/TimelinePanel.tsx:197` — `bg-white text-black`
- `portfolio/page.tsx:622` — `bg-white ... text-black`
- `image-manager/page.tsx:89` — `text-3xl font-black text-white`

### C. Classes fantasma (usades al TSX, inexistents o sota selector mort `.admin-shell` → cauen a default)
- `.admin-shell` MORT (0 al DOM, 366 selectors a control-room.css, 13 admin-theme, 77 globals)
- `economia/PackPricingModelEditor`: `.admin-pack-model`, `.admin-pack-model-aside/-note` (inexistents); `.admin-pack-model-chip--*` sota `.admin-shell` mort (globals.css:2456-2458)
- `inbox.css`: token fantasma `--o-stage-done` (7 punts, semàfor sense color)

### D. Tints blau/violeta com a accent (canon = carbó+or)
- `--at-cr-*` (~40 hex blau-slate, admin-theme.css:66-118) — illot Control Room
- Panells violeta: `NBAExplainPanel`, `AiCopySuggestionsInline`, `inbox/AiReplySuggestions`, `manual` blocs, `docs/protocol` autor
- `portfolio/page.tsx:464,479` cyan; `reporting`/`analytics`/`marketing` accents info/cyan

### E. Inputs sense `.adm-input` → fons blanc del navegador
- `economia/ProfitabilityConfigHistory`, `PackPricingModelHistory`, `image-manager`, `portfolio` (~11 inputs)

### F. Color cru d'estat (map local Tailwind ple en lloc de `admin-tone-*`)
- Dashboard panels: `AnomalyPanel`, `CapacityConflictPanel`, `CaptureHealthPanel`(TREND), `WeeklyCapacityForecastPanel`, `ToastProvider`, `DailyBriefPanel:40`
- `economia/economia-components` (HealthScore, PaymentTimelineBar), `ProfitabilityConfigEditor`
- `sales-ops/page` secció social (emerald/amber/rose/pink crus)
- `manual/page` KPIs `text-3xl font-black`

## P2 (volum alt) — monocapa: superfície de panell reinventada
Desenes de `rounded-2xl border border-white/10 bg-white/[0.0X] admin-card-glass` en lloc de `.ap-card`, a tot economia/reporting/sales-ops/marketing/clientes/bookings/manual/image-manager/portfolio/activity. Model a seguir: `EditorControlStrip.tsx`.

## P3
Font-px ad-hoc (`text-[10px]`/`text-[11px]`), `style` de marges/amplades px, skeletons amb superfície a mà, emojis decoratius.

## Casos tècnics ACCEPTATS (color = dada, no chrome)
css-manager (editor temes), canvas (disseny usuari), email-templates (HTML email), overlays sobre foto (image-manager/portfolio), backdrops de modal, previews de PDF a studio.

## Zones NETES confirmades
Cristina (leads/[id]), capçalera fitxa reserva (ja corregida), blog, faq, scripts, AdminPage, EditorControlStrip, CommercialDocumentsHistory, email-templates (chrome), inbox reconstruïts (cx-/ix-), tasks.css, intake.css.

## Pla d'atac (per impacte/risc)
1. ✅ Botons invisibles → `.ap-btn` (funcional, segur)
2. Blanc/negre absolut → token
3. `--at-cr-*` blau → carbó (token, segur)
4. pack-model chips fora de `.admin-shell` (surgical)
5. Panells violeta → carbó/or
6. Maps d'estat locals → `admin-tone-*`
7. Inputs → `.adm-input`
8. P2 superfícies → `.ap-card` (volum, passades validades)
