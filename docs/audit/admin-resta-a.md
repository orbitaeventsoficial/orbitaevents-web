# Auditoria admin — resta A (settings, social, dossiers, packs, quick-create, presupuestos, discount-codes, questionnaires, post-event, pricing, cost-calculator, coverage, google-reviews)

Data: 2026-06-17 · Context canònic: carbó + or · capa `.ap-card`/`.ap-kpi`/`.ap-btn--primary`/`.adm-input`/`admin-tone-*` + tokens (`--panel/--line/--t/--gold/--o-r-md`). Referència: fitxa Cristina (`leads/[id]`).

NO s'ha editat codi. Casos tècnics acceptats (PdfStudio/StudioPreview paper-PDF, css-manager, email HTML) omesos. `dossiers/**` net (ja migrat, sense superfícies ad-hoc).

| fitxer:línia | eix | descripció | severitat |
|---|---|---|---|
| packs/PackPriceQuickEditor.tsx:73 | superfície/input | `inputClass` amb `bg-black/60` → near-negre absolut a input + no `.adm-input` | P1 |
| quick-create/QuickCreateForm.tsx:162,206 | superfície | `<fieldset>` `bg-black/20` ad-hoc → `.ap-card`/`--panel` | P1 |
| quick-create/QuickCreateForm.tsx:376 | superfície | botó `bg-black/30` ad-hoc | P1 |
| packs/extras/ExtrasConfiguratorClient.tsx:278 | bug classe | `bg-white/5/60` (classe malformada, no existeix) | P1 |
| packs/[id]/EditPackForm.tsx:461 | bug classe | `bg-white/5/70` (classe malformada, no existeix) | P1 |
| questionnaires/new/QuestionnaireTemplateCreator.tsx:70,79,113,123,138 | input | inputs/selects `bg-white/5` sense `.adm-input` | P1 |
| questionnaires/[id]/QuestionnaireTemplateEditor.tsx:81,90,128,138,153 | input | inputs/selects `bg-white/5` sense `.adm-input` | P1 |
| settings/notifications/RecipientsManager.tsx:207,260,270 | input | inputs/selects `bg-white/5` sense `.adm-input` | P1 |
| settings/page.tsx:119-167 | superfície/KPI | 6 cards `bg-white/[0.03]` hover `bg-white/[0.06]` ad-hoc → `.ap-card` | P2 |
| settings/hero/page.tsx:49 | superfície | `bg-white/[0.04]` ad-hoc → `.ap-card` | P2 |
| social/SocialClient.tsx:103,107 | tone map | STATUS_TONE IDEA/ARCHIVED amb `bg-white/[0.08]`/`[0.03]` cru → `admin-tone-*` | P2 |
| social/SocialClient.tsx:419,426 | superfície | toggle `bg-white/10 border-white/20` ad-hoc | P2 |
| social/SocialClient.tsx:524,531,474,531 | superfície | cards/empty `bg-white/[0.02-0.05]` ad-hoc → `.ap-card` | P2 |
| social/SocialClient.tsx:383-393 | KPI | 3 stats `text-2xl` fets a mà → `.ap-kpi` | P2 |
| social/SocialClient.tsx:525 | tipografia | `text-4xl` empty-state ad-hoc | P3 |
| social/SocialClient.tsx:626,636,etc | superfície/tipo | grid calendari `bg-white/[0.02-0.05]` + `text-[9/10/11px]` ad-hoc | P2/P3 |
| packs/new/NewPackForm.tsx:10 | input | `inputClass` `bg-white/[0.03]` sense `.adm-input` | P2 |
| packs/page.tsx:372-394 | KPI | 5 stats `text-3xl font-bold` fets a mà → `.ap-kpi` | P2 |
| packs/page.tsx:532,696 + 43,363,544,550,708,714 | superfície | cards/pills/botons `bg-white/[0.03]`/`bg-white/5`/`bg-white/10` ad-hoc | P2 |
| packs/[id]/EditPackForm.tsx:648,681,686,699,749,775,800,655 | superfície | múltiples panels/pills `bg-white/[0.02-0.04]` ad-hoc → `.ap-card` | P2 |
| pricing/page.tsx:449,472,631,756,788-900 | KPI/tipo | stats `text-2xl/3xl font-bold` (djHours, etc.) fets a mà → `.ap-kpi` | P2 |
| pricing/page.tsx:378,563,613 | superfície | tabs `bg-white/20`/`bg-white/10` + rows hover `bg-white/[0.02]` ad-hoc | P2 |
| discount-codes/page.tsx:386-398 | KPI | 4 stats `text-3xl font-bold` fets a mà → `.ap-kpi` | P2 |
| discount-codes/page.tsx:565,573,627,647 | superfície/tone | `bg-white/5` codi/badge/row hover + estat inactiu cru → `admin-tone-*` | P2 |
| questionnaires/new+/[id]/...:62,98,74,109 | superfície | panels `bg-white/[0.03]` ad-hoc → `.ap-card` | P2 |
| questionnaires/page.tsx:30,38,48 | superfície | cards/badge `bg-white/[0.03]`/`bg-white/10` ad-hoc | P2 |
| post-event/page.tsx:272 | superfície | row hover `bg-white/[0.03]` ad-hoc | P2 |
| post-event/playbook/page.tsx:17,46-82,125 | superfície/tone | summary/items `bg-white/[0.02-0.03]` + NOT_APPLICABLE tone cru → `.ap-card`/`admin-tone-*` | P2 |
| post-event/reports/page.tsx:65-110 | KPI/tipo | stats `text-3xl/4xl` fets a mà → `.ap-kpi` | P2 |
| post-event/surveys/page.tsx:44-75 | KPI/tipo | stats `text-3xl/4xl` fets a mà → `.ap-kpi` | P2 |
| post-event/feedback/page.tsx:59 | tipografia | `text-4xl` ad-hoc | P3 |
| coverage/page.tsx:219-227 | KPI | 3 stats `text-3xl font-bold` fets a mà → `.ap-kpi` | P2 |
| coverage/page.tsx:288 | tone | estat `bg-white/10 text-white/40` cru → `admin-tone-*` | P2 |
| google-reviews/page.tsx:103-125 | KPI | 3 stats `text-3xl font-bold` fets a mà → `.ap-kpi` | P2 |
| google-reviews/page.tsx:175 | superfície | avatar `bg-white/10` ad-hoc | P3 |
| cost-calculator/CostCalculatorClient.tsx:328-347 | KPI/tipo | stats `text-3xl font-bold` fets a mà → `.ap-kpi` | P2 |
| cost-calculator/CostCalculatorClient.tsx:255,266 | tipografia | `text-4xl`/`text-2xl` empty-state ad-hoc | P3 |
| presupuestos/ProposalsList.tsx:345,169-184 | superfície/tipo | row hover `bg-white/[0.03]` + `text-[22px]` xifres ad-hoc | P2/P3 |
| presupuestos/ProposalsList.tsx:267-313 | superfície | botons icona `border-white/10 hover:bg-white/10` ad-hoc | P3 |
| presupuestos/ProposalOwnerPanel.tsx:255 | superfície | item `hover:bg-white/10` ad-hoc | P3 |
| settings/notifications/page.tsx:62,419,473,489 | superfície/tipo | `<code> bg-white/5` + `text-2xl` ad-hoc | P3 |
| settings/SettingsClient.tsx:154 / quick-create/page.tsx:21 / presupuestos/[id]/page.tsx:53 | tipografia | títols `text-2xl` ad-hoc (no token `--display`) | P3 |
| social,packs,questionnaires,presupuestos (~10 ocurrències) | a11y/cromàtic | `focus:ring-cyan-500/50` (blau no és color de sistema; usar `--gold`/`--line`) | P3 |

## Recompte final

- Total troballes: 44 entrades (agrupades per patró i fitxer).
- P1: 8 — `bg-black` a input/superfície (PackPriceQuickEditor, QuickCreateForm), 2 classes malformades `bg-white/5/60-70`, i inputs sense `.adm-input` (questionnaires x2, RecipientsManager).
- P2: 26 — superfícies `bg-white/[0.0x]`/`bg-zinc` ad-hoc → `.ap-card`, KPIs `text-2xl/3xl font-bold` fets a mà → `.ap-kpi`, maps d'estat color cru → `admin-tone-*`.
- P3: 10 — tipografia ad-hoc (`text-4xl`/`text-[22px]`/títols `text-2xl`), botons icona ad-hoc, `<code>` decoratiu, focus-ring cyan.
- `dossiers/**`: net, sense troballes.

Cap botó-void, blau-superfície ni `font-black` escapat al guard dins l'abast (els `bg-black` trobats són superfície/input pròpia, no patró botó-void).
