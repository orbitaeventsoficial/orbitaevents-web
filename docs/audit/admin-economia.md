# Auditoria admin — Economia / Reporting / Sales-Ops / Analytics / Marketing

Data: 2026-06-16 · Abast: tots els `.tsx` sota `app/admin/economia/`, `app/admin/reporting/`, `app/admin/sales-ops/`, `app/admin/analytics/`, `app/admin/marketing/` (23 fitxers).

Context canònic avaluat: carbó + or; blau **no** és superfície; capa a consumir `.ap-card / .ap-btn--primary / .ap-kpi / .adm-input / admin-tone-* / tokens var(--*)`. Referència: fitxa de Cristina (carbó pla, estat com a accent).

Eixos: **HC**=0-hardcoded · **MONO**=monocapa · **RESP**=responsiu · **CANON**=canònic.

## Taula de troballes

| fitxer:línia | eix | descripció | severitat |
|---|---|---|---|
| economia/PackPricingModelEditor.tsx:71 | CANON/MONO | `className="admin-pack-model rounded-2xl border p-5 shadow-sm"` — la classe base `.admin-pack-model` NO existeix enlloc del CSS (només existeix `.admin-pack-model-chip--*` i sota selector mort `.admin-shell`). La secció queda sense superfície canònica `.ap-card`; només aplica `border` Tailwind sense fons/token de panell. | P1 |
| economia/PackPricingModelEditor.tsx:11-15,61-68 | CANON | `statusBadge()` retorna `admin-pack-model-chip admin-pack-model-chip--{ok,warn,danger}`. Aquestes classes només estan definides com `html.admin-mode .admin-shell .admin-pack-model-chip--*` a globals.css:2456-2458 → **selector mort** (`.admin-shell` no existeix al DOM). Els chips de semàfor no reben mai border/bg/color: cauen a estil neutre. | P1 |
| economia/PackPricingModelEditor.tsx:155,158,168,185,195 | MONO/CANON | `admin-pack-model-aside`, `admin-pack-model-note` són classes fantasma (cap definició CSS). Les targetes-nota queden amb només `rounded-xl border p-3/p-4`, sense superfície de la sèrie. | P1 |
| economia/PackPricingModelEditor.tsx:71 | CANON | Superfície a mà (`rounded-2xl border p-5 shadow-sm`) en lloc de `.ap-card`. `shadow-sm` no és el patró carbó pla de la sèrie. | P2 |
| economia/EconomiaClient.tsx:204-206,250-251,268-269,443,616,618 | MONO | `bgColor="bg-white/[0.03]"` + `borderColor="border-white/10"` passats a `KpiCard` duplicant `--panel`/`--line`. Són props ignorades (KpiCard ja és carbó pla), però segueixen al call-site com a Tailwind ad-hoc residual que hauria de desaparèixer. | P2 |
| economia/EconomiaClient.tsx:167-170 | HC/CANON | Badge de tab amb `text-white font-black` i `shadow-lg` sense fons tonal (no hi ha `admin-tone-bg-danger`): el comptador d'alertes queda sense color d'accent canònic. | P2 |
| economia/EconomiaClient.tsx:317,1006-1022,934-942 | CANON | `text-[22px] font-bold` / `text-xl font-black` per a xifres KPI fora del patró `.ap-kpi-value`; valor d'inventari i taula de semàfor de packs maqueten KPIs a mà en lloc de `.ap-kpi`. | P2 |
| economia/EconomiaClient.tsx:322,351,377 | CANON | Botons "Veure inventari", "Obrir detall de cobraments", "Veure rendibilitat" amb `rounded-xl border px-4 py-2` a mà en lloc de `.ap-btn`. | P2 |
| economia/EconomiaClient.tsx:459,559,603,750,793,878,918,998 + tots els `rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--panel)]` | MONO/CANON | Superfície de panell reconstruïda inline amb tokens a desenes de `<section>` en lloc de `.ap-card`. Correcte en tokens (no és blau ni hex), però duplica la recepta de superfície que ja viu a `.ap-card` → trenca monocapa. | P2 |
| economia/economia-components.tsx:66-68 | HC/CANON | `HealthScore`: `text-emerald-400 / amber-400 / rose-400` i `stroke-emerald-400 / amber-400 / rose-400` Tailwind de color cru en lloc de `admin-tone-text-*`. Estat com a color cru, no token. | P1 |
| economia/economia-components.tsx:108-122 | HC/CANON | `PaymentTimelineBar`: `bg-emerald-500 / bg-rose-500 / bg-amber-500 / bg-white/15` Tailwind cru per als segments en lloc de `admin-tone-bg-*`. | P1 |
| economia/economia-components.tsx:332-333,389,417 | HC/CANON | Filtre-chips actius `border-amber-500/50 bg-amber-500/15 text-amber-200` i checkboxes `accent-amber-500` color cru en lloc de token d'accent or de la sèrie. | P2 |
| economia/economia-components.tsx:426,431 | HC | `text-emerald-400 / text-rose-400 / text-white/60` cru a les cel·les dipòsit/resta de la taula en lloc de `admin-tone-text-*`. | P2 |
| economia/economia-components.tsx:294,302,347,379 | MONO/CANON | Inputs/sections amb `rounded-xl border border-white/10 bg-white/5` a mà; l'input de cerca no usa `.adm-input`. Superfícies i input reinventats. | P2 |
| economia/ProfitabilityConfigEditor.tsx:52-54,57-65 | HC/CANON | `ratioBadge`/`fixedState` retornen `bg-rose-500/15 text-rose-300 border-rose-500/40` (+amber/+emerald) Tailwind cru en lloc de `admin-tone-*`. | P1 |
| economia/ProfitabilityConfigEditor.tsx:172,178,184,190 | MONO | `bg-[var(--sunk)]` — token `--sunk` no apareix a orbita-tokens (la resta del fitxer usa `--panel`/`--line`); possible token inexistent → fons transparent. Verificar. | P2 |
| economia/ProfitabilityConfigHistory.tsx:145,151,162,176,204,222 | CANON/MONO | Superfície `rounded-2xl border border-white/10 p-5 shadow-sm`, selects/inputs `rounded-md border px-2 py-1.5` i botons `rounded-md border` a mà; no usa `.ap-card`, `.adm-input`, `.ap-btn`. Tot l'històric és superfície i controls reinventats. | P2 |
| economia/ProfitabilityConfigHistory.tsx:162,176,185,195 | CANON | Inputs `date`/`text`/`select` sense `.adm-input` → cauen al fons blanc per defecte del navegador sobre tema fosc (mateix bug ja documentat per a pack-model). | P1 |
| economia/PackPricingModelHistory.tsx:81,89,99,103,107,116,123 | CANON | Mateix patró: `.ap-card`/`.adm-input`/`.ap-btn` substituïts per `rounded-2xl border ... shadow-sm` i `rounded-md border` a mà; selects/inputs sense `.adm-input`. | P1 |
| economia/PaymentToggleButton.tsx:56-60 | HC/CANON | Botó amb `bg-emerald-500/15 text-emerald-300` / `bg-amber-500/15 text-amber-300` Tailwind cru per estat pagat/pendent en lloc de `admin-tone-*` + `.ap-btn`. | P1 |
| economia/PaymentReminderActions.tsx:72,80,88 | CANON | Botons Email / Obrir WA / WA API amb `rounded-md px-2 py-1 text-white` **sense fons** → botons invisibles (només text blanc), no `.ap-btn`. | P1 |
| economia/loading.tsx:4,8,13 | CANON | Skeleton amb superfícies `rounded-2xl border border-white/10` a mà; no consumeix tokens de superfície de la sèrie (acceptable en skeleton, però incoherent). | P3 |
| reporting/page.tsx:30-33 | HC/CANON | `FunnelBar` usa `admin-tone-bg-cyan` (blau) com a barra d'embut. Cyan és accent blau, no la paleta carbó+or; revisar contra "blau no és superfície". | P2 |
| reporting/page.tsx:96-104,158-163,301-308 | CANON | Botons/enllaços `rounded-lg border border-white/15 bg-white/5` a mà en lloc de `.ap-btn`. | P2 |
| reporting/page.tsx:133,147,173,205,219,etc. | MONO/CANON | Tot el cos usa `rounded-xl border border-white/10 bg-white/[0.02]` / `bg-white/[0.03]` per a panells i KPIs en lloc de `.ap-card`/`.ap-kpi`. Superfície reinventada sistemàticament. | P2 |
| reporting/page.tsx:172-200,311-327 | CANON | KPI headline a mà (`text-xl font-bold`, `text-[10px] uppercase`) en lloc de `.ap-kpi` + accents `admin-tone-*-cyan`/`-violet` (blau/violeta) per pipeline/clicks. | P2 |
| reporting/page.tsx:110 | RESP | `<div className="space-y-6 p-6">` embolcalla tota la pàgina amb `p-6` fix sense `@media`; padding no responsiu a mòbil 375px. | P3 |
| sales-ops/page.tsx:233,239,244,249,254,259,266 | HC/MONO/CANON | Secció "Contingut social" reinventa superfícies `rounded-xl border border-white/10 bg-white/[0.02]` i pinta estats amb color cru: `border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-300`, `amber-*`, `rose-*`, `border-pink-500/20 text-pink-300`. Rosa/emerald/amber crus en lloc de `admin-tone-*` i `.ap-card`. | P1 |
| sales-ops/page.tsx:265-270 | HC | Alerta social `border-amber-500/20 bg-amber-500/5 text-amber-200` + botó `border-amber-400/30 text-amber-200` color cru en lloc de `.ap-inline-alert--warning`. | P2 |
| sales-ops/page.tsx:199-203,207-209 | HC | Emojis com a icona (`💼🔮📥🎯⏱️`) dins `.ap-kpi` — acceptat com a decoració, però barreja amb el to corporatiu sobri de la sèrie. | P3 |
| sales-ops/LossBreakdownPanel.tsx:120-123 | HC | Estat error `border-rose-500/30 bg-rose-500/10 text-rose-200` Tailwind cru en lloc de `admin-tone-*-danger`. | P2 |
| sales-ops/LossBreakdownPanel.tsx:140,147,152-160,169,194,213,239,etc. | MONO/CANON | Targetes internes `rounded-2xl border border-white/10 bg-white/[0.03]` i `bg-amber-500/[0.06] text-amber-200` a mà; no usa `.ap-card`. Auto-descartats amb amber cru. | P2 |
| sales-ops/LossBreakdownPanel.tsx:112,141,148,186,201,224 | HC | `text-white/55 / white/50 / white/45 / white/85 / white/65 / white/8` literals repetits per a labels i hairlines en lloc de tokens `--t3`/`--line`. | P2 |
| sales-ops/RunCommercialSequencesButton.tsx:36-40, SendExecutiveReportButton.tsx:33-37, SlaAutomationButton.tsx:45-50 | CANON | Botons d'acció amb `rounded-xl px-4 py-2 text-white` **sense fons** → botons invisibles; no `.ap-btn--primary`. Tres botons operatius clau queden sense superfície. | P1 |
| analytics/page.tsx:312-313,365 | HC/CANON | Barres de tendència GA4/Ads amb `admin-tone-bg-info`/`admin-tone-bg-warning` (info = blau). Gràfic de barres en accent blau; revisar contra carbó+or. | P2 |
| analytics/page.tsx:286-288,354-355 | CANON | Alertes via `.ap-inline-alert--*` ✓ correcte; però KPIs `.ap-kpi--info`/`--violet`? usa `admin-tone-text-cyan`? — l'ús de cyan/info per a pipeline és consistent amb reporting, mateixa observació de blau. | P3 |
| analytics/page.tsx (general) | CANON | Bona base: usa `.ap-card`, `.ap-kpi`, `.ap-badge`, `.ap-btn`, `.ap-inline-alert`, `admin-tone-*`. Pocs residus; principal és l'ús d'accents blaus (info/cyan) en gràfics. | P3 |
| marketing/page.tsx:197,217,244,254 | MONO | `rounded-xl border border-white/10 bg-white/[0.03]` a mà per a moviments/integracions/fonts en lloc de subcard `.ap-card`. Duplicat de `--panel`/`--line`. | P2 |
| marketing/page.tsx:32,189,202 | HC/CANON | `diagnosticTone.info = admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan` (blau) com a to de diagnòstic; la resta del fitxer és canònic. Blau com a superfície de targeta. | P2 |
| marketing/page.tsx (general) | CANON | Base sòlida: `.ap-card`, `.ap-kpi`, `.ap-badge`, `.ap-btn`, `admin-tone-*`, maps de to centralitzats. Residus menors. | P3 |
| reporting/loading.tsx, sales-ops/loading.tsx, analytics/loading.tsx, marketing/loading.tsx | — | Re-export d'skeletons compartits (`AdminLoadingSkeleton*`). Sense troballes. | — |

## Recompte final

- **Total troballes: 41** (files amb defectes reals; els 4 `loading.tsx` re-export i blocs "general" comptats com observacions).
- **P0: 0**
- **P1: 11** — chips/superfícies fantasma de pack-model, botons invisibles (PaymentReminderActions + 3 botons sales-ops + PaymentToggleButton), inputs d'històric sense `.adm-input` sobre fons blanc, color cru d'estat a HealthScore / PaymentTimelineBar / ProfitabilityConfigEditor / secció social.
- **P2: 22** — superfície de panell reconstruïda inline amb tokens (monocapa) a tot economia/reporting/sales-ops, accents blaus (cyan/info/violet) com a superfície, color Tailwind cru repetit (`emerald/amber/rose/pink`), botons/inputs a mà sense `.ap-*`, token `--sunk` a verificar.
- **P3: 8** — padding fix no responsiu, skeletons amb superfície a mà, emojis decoratius, observacions de base sòlida (analytics/marketing).

## Top 5 (impacte més alt)

1. **PackPricingModelEditor.tsx** — `.admin-pack-model` + `.admin-pack-model-chip--*` són classes fantasma / sota selector mort `.admin-shell`: la secció i tots els semàfors queden sense superfície ni color de la sèrie (P1).
2. **Botons invisibles** — PaymentReminderActions (Email/WA/WA API) + RunCommercialSequences + SendExecutiveReport + SlaAutomation: `text-white` sense fons → no es veuen; cap usa `.ap-btn--primary` (P1).
3. **Inputs d'històric sobre fons blanc** — ProfitabilityConfigHistory i PackPricingModelHistory: selects/inputs `date`/`text` sense `.adm-input` cauen al blanc per defecte del navegador en tema fosc (P1).
4. **Color cru d'estat** — HealthScore (`emerald/amber/rose-400` + `stroke-*`), PaymentTimelineBar (`bg-emerald/rose/amber-500`), ProfitabilityConfigEditor (`bg-rose-500/15 text-rose-300`) i secció social (emerald/amber/rose/pink crus) en lloc de `admin-tone-*` (P1).
5. **Superfície de panell duplicada inline** — desenes de `<section className="rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--panel)]">` i `rounded-xl border border-white/10 bg-white/[0.02]` reinventen `.ap-card` a economia/reporting/sales-ops: monocapa trencada (P2, però volum alt).
