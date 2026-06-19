# Auditoria admin — resta B

Carbó + or. Blau NO és superfície · negre/blanc absolut prohibit · capa canònica `.ap-card` / `.ap-btn--primary` / `.ap-kpi` / `.adm-input`·`.ap-input` / `admin-tone-*` / tokens (`--panel/--line/--t/--gold/--o-r-md/--mono/--display`). Referència: fitxa Cristina.

Abast auditat (només .tsx substantius; els `loading.tsx` re-exporten skeletons compartits i queden fora): blog, faq, canvas, email-templates, image-manager, manual, docs, css-manager, inbox, emails, scripts, stats, privacy, features, activity, portfolio.

**Nota sobre overlays `white/X` i `black/X`:** la paleta admin accepta `rgba(255,255,255,X)` sobre fons fosc com a sistema. Per tant `bg-white/5`, `border-white/10`, `bg-black/20` NO es marquen com a hardcoded de color absolut; el problema real és **MONOCAPA/CANÒNIC** quan reinventen un `.ap-card` / `.adm-input` / `.ap-btn` a mà en lloc de consumir la classe. El negre/blanc **absolut** (`bg-white` sòlid + `text-black`) sí és violació dura.

## Taula de troballes

| fitxer:línia | eix | descripció | severitat |
|---|---|---|---|
| **stats/page.tsx:283** | canònic | Botó primari «Desar» amb `text-white rounded-xl` i SENSE fons → invisible sobre carbó. Ha de ser `.ap-btn ap-btn--primary` | P1 |
| stats/page.tsx:233 | canònic | Card `bg-black/60 border-white/10` (negre quasi sòlid) com a superfície de targeta; ha de ser `.ap-card` | P2 |
| stats/page.tsx:252,256,260 | monocapa | Sub-caixes `bg-white/5 rounded-xl` reinventant mini-cards en lloc de `.ap-kpi`/token | P2 |
| stats/page.tsx:275,290,300 | monocapa | Inputs/botons (`border border-white/10`, `bg-white/5`) ad-hoc en lloc de `.adm-input`/`.ap-btn--secondary` | P2 |
| stats/page.tsx:118-122,212-223 | monocapa | KPI cards `admin-card-glass` ad-hoc + spinner manual; `.ap-kpi` existeix per això | P3 |
| **manual/page.tsx:143,148,153,158** | canònic | KPI `text-3xl font-black` (tipografia "font-black" prohibida); ha de ser `.ap-kpi` | P1 |
| manual/page.tsx (~50 línies) | canònic | Títols de card massius `text-base/text-sm/text-lg/text-xl font-black` repetits a tota la pàgina | P1 |
| manual/page.tsx (tota la pàgina) | monocapa | Chrome de card reinventat: `admin-card-glass rounded-2xl border border-white/10` + `bg-white/[0.03]` desenes de cops en lloc de `.ap-card`/token; és el fitxer més Frankenstein del lot | P1 |
| manual/page.tsx:610,718,752 | monocapa | Tints semàntics `border-emerald-500/* bg-emerald-500/*` / `border-violet-500/*` inline en lloc de `admin-tone-success`/`admin-tone-*` | P2 |
| manual/page.tsx:747,754 | canònic | Blocs amb `text-violet-200`/`text-violet-100` (lila com a color de marca; no és or/carbó) | P2 |
| manual/page.tsx:462,583,606,648,746 | monocapa | Caixes `bg-black/10` ad-hoc com a superfície imbricada | P3 |
| **image-manager/page.tsx:89** | canònic | `<h1 class="text-3xl font-black text-white">` — títol "font-black" + blanc absolut; ha d'anar a header canònic (`AdminPage`) | P1 |
| image-manager/page.tsx:167,176 | canònic | Botó actiu `bg-amber-500 text-black font-bold` — `text-black` ABSOLUT sobre or; usar token de text sobre or | P1 |
| image-manager/page.tsx:162,185,198,209 | monocapa | Panells `rounded-3xl border border-white/10 bg-white/[0.04]` reinventant `.ap-card` | P2 |
| image-manager/page.tsx:190 | monocapa | Input cerca `border border-white/10 bg-black/20 ...` ad-hoc en lloc de `.adm-input`/`.ap-input` | P2 |
| image-manager/page.tsx:95,101,194,195 | monocapa | Pills i alerts (`bg-white/5`, `bg-red-500/10`, `bg-emerald-500/10`) inline; `admin-tone-*`/`.ap-badge` existeixen | P3 |
| image-manager/ImagePlacementCard.tsx:190 | monocapa | `article rounded-3xl border border-white/10 bg-white/[0.04]` reinventa `.ap-card` | P2 |
| image-manager/ImagePlacementCard.tsx:302,374 | monocapa | Inputs ad-hoc `border border-white/10 bg-black/20/30 text-white` en lloc de `.adm-input` | P2 |
| image-manager/ImagePlacementCard.tsx:185,217,273 | P3 | Dropzone/preview sobre fotos (`bg-black/20`) — overlay tècnic acceptat per legibilitat | P3 |
| **portfolio/page.tsx:622** | canònic | Botó «Crear event» `bg-white px-4 ... text-black` — **blanc sòlid + text negre ABSOLUT** (violació dura); ha de ser `.ap-btn--primary` | P1 |
| portfolio/page.tsx (formulari ~608-618) | monocapa | ~11 inputs/selects/textarea `rounded-xl border border-white/10 bg-white/[0.04] text-white/85` clonats a mà en lloc de `.adm-input` | P1 |
| portfolio/page.tsx:464,479 | canònic | Estat actiu/vincle amb `border-cyan-400/40`, `border-cyan-500/30 text-cyan-200` — **blau/cian com a accent** (prohibit; ha de ser or/`--gold`) | P1 |
| portfolio/page.tsx:418,597,637,etc. | monocapa | Botons `rounded-xl border border-white/10 ... hover:bg-white/5` ad-hoc en lloc de `.ap-btn--secondary` | P2 |
| portfolio/page.tsx:139,143,466,468 | P3 | Overlays sobre fotos/preview (`bg-black/95`, `bg-black/60`, `bg-black`) — legibilitat sobre imatge, acceptat | P3 |
| **features/page.tsx:209** | canònic | Knob del toggle `bg-white` (blanc sòlid) — tècnicament és un indicador d'estat; revisar si ha d'anar a token | P2 |
| features/page.tsx:203-204 | monocapa | Estat ON/OFF `bg-emerald-500/85 text-emerald-950` / `bg-rose-500/85 text-rose-950` inline; consolidar a `admin-tone-success`/`admin-tone-danger` o classe `.admin-feature-toggle` (ja existeix parcialment) | P2 |
| features/page.tsx:164-185 | monocapa | KPI cards `rounded-2xl border admin-card-glass` + `text-3xl font-bold` ad-hoc en lloc de `.ap-kpi` | P3 |
| features/page.tsx:185 | monocapa | Files de feature `border rounded-xl p-4` sense classe canònica (border sense color → depèn de cascada) | P3 |
| **docs/protocol/page.tsx:111-139** | canònic | 5 KPI `text-3xl font-black` (font-black prohibit); ha de ser `.ap-kpi` | P1 |
| docs/protocol/page.tsx:40 | manual/estat | Mapping autor `claude: border-violet-500/* bg-violet-500/* text-violet-200` — **tint lila/blau** per a metadada d'autor; reportat per ordre explícita (mappings d'estat que tinten de blau/lila) | P2 |
| docs/protocol/page.tsx:158,163 | monocapa | Inputs cerca/filtre `border border-white/15 bg-white/[0.04]` ad-hoc en lloc de `.adm-input`; també `min-w-[240px]`/`min-w-[180px]` px fix | P2 |
| docs/protocol/page.tsx:229,256,274 | canònic | Card `border-white/10 bg-white/[0.03]` + `text-base font-black` en lloc de `.ap-card`/`.ap-kpi` | P2 |
| docs/protocol/ProtocolValidationToggle.tsx:65 | monocapa | `border-emerald-500/* bg-emerald-500/*` vs `border-white/10 bg-white/[0.03]` inline; usar `admin-tone-success`/token | P3 |
| **inbox/AiReplySuggestions.tsx:65,66,75,77** | canònic | Bloc IA amb `border-violet-500/*`, `bg-violet-500/5`, `text-violet-300/70`, `text-violet-400/70`, hover `bg-violet-500/10` — **lila/violeta com a color d'accent** (no és or/carbó) | P1 |
| inbox/CommSummaryPanel.tsx:72,81,92,103 | monocapa | Targetes `rounded-xl border border-white/10 bg-white/[0.03]` reinventant `.ap-card` | P2 |
| inbox/PendingFollowUpsPanel.tsx:13,43,97-113 | monocapa | Map de prioritat + card + botons `border-white/10 bg-white/[0.03]`, `hover:bg-white/5` ad-hoc; usar `.ap-card`/`.ap-btn`/`admin-tone-*` | P2 |
| inbox/InboxLeadContext.tsx:60,72,79 | monocapa | Map prioritat `border-white/10 bg-white/[0.03]` + botons border sense classe canònica | P2 |
| inbox/InboxModals.tsx:96,282 | P3 | Backdrop modal `bg-black/60 backdrop-blur-sm` — overlay tècnic acceptat | P3 |
| inbox/InboxModals.tsx:212 | monocapa | Estat disabled `border-white/10 bg-white/15 text-white/40` ad-hoc | P3 |
| **manual + image-manager + portfolio + docs/protocol** | responsiu | Pàgines amb molt layout `px`/`[Nrem]` arbitrari i sense `@media` propi a CSS de pàgina (depenen de Tailwind utilitari); revisar breakpoints reals a 375px | P2 |
| docs/protocol/page.tsx:158,163; inbox/InboxLeadContext (max-w) | responsiu | `min-w-[240px]`/`min-w-[180px]` px fix en inputs (norma «zero maquetació a píxel» en admin) | P3 |
| emails/ManualActionsPanel.tsx:8 | monocapa | Constant `DISABLED_BUTTON` amb `border-white/10 bg-white/5 text-white/30` ad-hoc en lloc de variant `.ap-btn--disabled`/token | P3 |
| emails/EmailConfigPanel.tsx:159; emails/SendPostEventButton.tsx:41 | monocapa | Estats disabled `border-white/10 bg-white/5 text-white/30` inline repetits (mateix patró duplicat 3 cops a emails/) | P3 |
| emails/InboxPanel.tsx:218,220 | monocapa | Files de llista `hover:bg-white/[0.03]`, no-llegit `bg-white/[0.02]` ad-hoc; consolidar a token de fila | P3 |
| activity/ActivityClient.tsx:243,244,351,364,409 | monocapa | Cards `admin-stagger-item admin-card-glass ... border border-white/10` + `hover:bg-white/[0.03]` reinventant `.ap-card`; usa `admin-tone-*` per text (bé) però superfície ad-hoc | P2 |
| privacy/page.tsx:476,477 | monocapa | Estat urgent `border-red-500/30 bg-red-500/5` + `text-red-400` inline en lloc de `admin-tone-danger` | P2 |
| privacy/page.tsx:437 | monocapa | Error `text-amber-400` inline en lloc de `admin-tone-warning` | P3 |
| privacy/page.tsx:460-476 | monocapa | KPI `rounded-2xl border admin-card-glass` + `text-2xl font-bold` ad-hoc en lloc de `.ap-kpi` | P3 |
| privacy/page.tsx:485,495,504,567 | responsiu/monocapa | Tabs/cards amb border sense classe canònica; `min-h-[44px]` (a11y target, acceptable) | P3 |

### Casos tècnics acceptats (P3 / omès — color = contingut, no chrome)

| fitxer | motiu |
|---|---|
| css-manager/page.tsx:10-269 | Editor de temes CSS: tots els hex (`#1e2228`, `#79a8d8`, etc.) són **presets de paleta editables** = dada, no chrome. Acceptat. Únic matís: alguns presets són blau/gris pur (`#3563e9`, `#65b8ff`) però són opcions que l'usuari tria, no la superfície del propi panell. |
| canvas/CanvasEditorClient.tsx:88,231,242,390,423,547,644 | Editor gràfic: `#0a0a0a`, `#ffffff`, `#06b6d4`, `linear-gradient(...)` són **color del contingut que crea l'usuari** = dada de l'element del canvas, no chrome admin. Acceptat. (Únic chrome real: línia 464 `bg-white/10` divisor de toolbar = overlay acceptat.) |
| email-templates/[slug]/TemplateEditorClient.tsx:35-93,559,595 | Generació d'**HTML d'email** (inline styles obligatoris en email; `#06b6d4`, `#0a0a0a`, `linear-gradient`, `rgba(255,255,255,X)`). Acceptat. Els `value={...color || '#06b6d4'}` són valors per defecte del color-picker de contingut. |
| image-manager/portfolio — overlays sobre foto | `bg-black/XX`, `bg-black/60` damunt previews/imatges per legibilitat. Acceptat (vegeu files marcades P3 a la taula). |
| inbox/InboxModals backdrop | `bg-black/60 backdrop-blur-sm` overlay de modal. Acceptat. |

### Zones netes (consumeixen capa canònica, sense troballes)

- **blog/** (`page.tsx`, `BlogEditorForm.tsx`, `new`, `edit/[id]`): `.ap-card`, `.ap-btn--*`, `.ap-input`, `.ap-table*`, `.ap-badge`, `admin-tone-*`. Exemplar.
- **faq/** (`page.tsx`, `FaqEditorForm.tsx`, `new`, `[id]`, `layout`): `.ap-btn--primary`, `EditorControlStrip`, `AdminPage`, constants centralitzades.
- **scripts/ScriptsClient.tsx**: `.ap-card`, `.ap-card--danger`, `admin-tone-*`, `EditorControlStrip`. Net.
- **email-templates/EmailTemplatesClient.tsx** (chrome): `admin-tone-*`, `EditorControlStrip`, constants. Net (el TemplateEditor és HTML d'email, P3 acceptat).
- **inbox** rutes reconstruïdes #801/#802 (`compose/`, `settings/`, `ComposeForm`, `ImapSettingsClient`): sistema propi `cx-`/`ix-` documentat (Brass & Obsidian), fora de la capa `.ap-*` però intencionalment migrades; no es marquen com a residu.
- Tots els `loading.tsx`: re-exporten skeletons compartits.

## Recompte final

- **Total troballes:** 44 files de taula (excloent les 5 zones netes i 5 casos tècnics).
- **Per severitat:**
  - **P1 (canònic dur / blau-lila accent / negre-blanc absolut / botó invisible):** 9
  - **P2:** 20
  - **P3 (menor o tècnic acceptat):** 15
- **Fitxers nets:** blog, faq, scripts, email-templates (chrome), inbox reconstruïts.
- **Casos tècnics acceptats (color = dada):** css-manager, canvas, email-templates (HTML email), overlays sobre foto (image-manager/portfolio), backdrop modals.
