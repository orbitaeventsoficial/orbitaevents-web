# Auditoria fitxes admin — leads · bookings · clientes

Abast: tots els `.tsx` sota `app/admin/leads/`, `app/admin/bookings/`, `app/admin/clientes/` (96 fitxers).
Data: 2026-06-16. Mètode: grep dirigit + lectura dels fitxers ofensors. NO s'ha editat codi.

Referència canònica: `app/admin/leads/[id]/LeadDetailClient.tsx` (cas «Cristina»). **Verificat NET**:
consumeix `fxd__*` / `ap-*`, helpers `formatCurrency`/`formatDateFull`/`buildLeadWhatsAppHref`, tokens via
classes, `data-tone`, cap hex inline, cap blau, a11y correcte. Els seus maps locals
`STAGE_LABEL`/`PAY_LABEL`/`PRIORITY_LABEL` són acceptats com a wiring local de la fitxa de referència
(no es marquen com a violació).

Fitxa de RESERVA `app/admin/bookings/[id]/page.tsx`: **verificada — ja no queda negre/blau**. Els únics
`style` són `textDecoration:'none'`, `opacity` i `marginTop` (no cromàtics). La correcció prèvia es manté.
El blau/negre residual viu en **components compartits de llista i panells**, no a la capçalera de la fitxa.

## Troballes

| fitxer:línia | eix | descripció | sev |
|---|---|---|---|
| bookings/[id]/ClientPortalAccessPanel.tsx:39,197 | 0-HARDCODED | Resolt al #1159: default i placeholder de l'accent del portal consumeixen `CLIENT_PORTAL_DEFAULT_ACCENT_COLOR` de `clientPortalUtils` | OK |
| clientes/ClientesModals.tsx:143,381 | CANÒNIC | Resolt al #1141: overlays `bg-black/60 admin-card-glass` substituïts per `cl__modal-backdrop` tokenitzat a `clientes.css` | OK |
| clientes/ClientesModals.tsx:179 | CANÒNIC | Resolt al #1141: fallback `bg-white/5 text-white/40` substituït per `cl__duplicate-score-low` tokenitzat | OK |
| clientes/reactivation/ReactivationClient.tsx:14,76,86,95,113,178,206-219 | MONOCAPA | Resolt al #1139: KPIs, cards, pills, missatge suggerit i accions passen a gramàtica local `rc__*` + `reactivation.css` escopat a `html.admin-mode` | OK |
| clientes/referrals/ReferralsClient.tsx:14,56-255 | MONOCAPA | Resolt al #1140: KPIs, top referrers, filtres, candidats, missatge suggerit i accions passen a gramàtica local `rf__*` + `referrals.css` escopat a `html.admin-mode` | OK |
| clientes/reactivation/page.tsx:22 · referrals/page.tsx:22 | MONOCAPA | Resolt al #1137: botó `border-white/15 bg-white/5` ad-hoc substituït per `.ap-btn ap-btn--xs` | OK |
| clientes/page.tsx:350 · CustomersPageSections.tsx:226,310 | RESPONSIU | Resolt al #1163: `marginTop:10` (`.cl__lifecycle`) i `marginLeft:6` ×2 (badge VIP) passen a `clientes.css` en `rem` | OK |
| clientes/[id]/_components/CustomerHeader.tsx:234,425 | MONOCAPA | Resolt al #1136: `style` inline (`inset/zIndex`, `display:contents`) mogut a `ch__statusbackdrop` i `ch__stageitem` a `customer-hub.css` | OK |
| bookings/[id]/BookingTotalEditor.tsx:59-119 | MONOCAPA+RESPONSIU | Resolt al #1148: input, trigger, alerta i suggeriment passen de `style={{...}}` inline a classes `bd-total-editor*` tokenitzades a `booking-detail.css` | OK |
| bookings/[id]/BookingMarginCard.tsx:222,248,357 | CANÒNIC | Resolt al #1148: percentatges/títols/benefici passen a classes locals `admin-booking-margin-*` amb escala tipogràfica tokenitzada | OK |
| bookings/[id]/BookingMarginCard.tsx:215,223 | RESPONSIU | Obsolet/resolt al #1148: ja no hi ha `text-[11px]`; les línies són `admin-booking-margin` + `text-sm opacity-80` | OK |
| bookings/page.tsx:304,310,340,363 | MONOCAPA+RESPONSIU | Resolt al #1142: contenidors `style={{...}}` moguts a `bk-detail-bar-row`, `bk-detail-bar-actions`, `bk-list-shell` i `bk-list-shell--top` | OK |
| bookings/page.tsx:366,383 | CANÒNIC | Resolt al #1142: empty-state i cards mòbil passen de `admin-card-glass` a `ap-card bk-empty-state` / `ap-card bk-mobile-card` | OK |
| bookings/page.tsx:393-546 | RESPONSIU | Obsolet/resolt al #1160: ja no hi ha `text-[10px]`/`text-[9px]`; el residu real `text-[var(--gold)]` de la referència passa a `bk-booking-ref-link` | OK |
| bookings/BookingPipelineView.tsx:182,267,283 | CANÒNIC | Resolt al #1149: dot inactiu i botons ←/→ passen a `bk-pipeline-dot--inactive` / `bk-pipeline-shift-btn` tokenitzats a `booking-detail.css` | OK |
| bookings/BookingPipelineView.tsx:154-312 | RESPONSIU | Obsolet al #1160: no queden `text-[10px]`/`text-[11px]` ni cap `text-[...]` al pipeline viu | OK |
| bookings/[id]/BookingQuestionnaireSection.tsx:21,25,61 | MONOCAPA+CANÒNIC | Resolt al #1151: textos/enllaços passen de `text-white/*` i `admin-tone-text-cyan` a classes `bd-questionnaire-*` tokenitzades | OK |
| bookings/[id]/BookingGallery.tsx:179,256,262 | CANÒNIC | Resolt al #1152: skeleton/dropzones/delete passen de `white/*` a `bd-gallery-*` tokenitzat | OK |
| bookings/[id]/DocumentFlowSection.tsx:97 | CANÒNIC | Obsolet al #1153: el residu cromàtic ja no existeix; queda només `style={{ width: progressWidth }}` dinàmic acceptable | OK |
| bookings/[id]/GallerySharePanel.tsx:145 | MONOCAPA | Resolt al #1152: icona, botons, URL i label passen de `white/*` a `bd-gallery-share-*` tokenitzat | OK |
| bookings/[id]/BookingStatusChanger.tsx:89,110 | MONOCAPA | Resolt al #1153: fallback `bg-white/30` passa a `bd__status-dot--fallback`; fletxa sense inline style estàtic | OK |
| bookings/[id]/BookingChecklist.tsx:115 | RESPONSIU | barra amb `style={{width:pct}}` — dinàmic OK; tone via `${tone.bar}` correcte | OK |
| bookings/BookingFilters.tsx:104 | RESPONSIU | Resolt al #1154: wrapper de cerca passa de `style={{width:260}}` a `bk-filter-search` responsiu | OK |
| bookings/BookingClientEventSection.tsx:114-219 | RESPONSIU | Resolt al #1158: cinc `style` estàtics de margin/display passen a `nb__event-type-field`, `nb__chips--spaced`, `nb__conflict-title`, `nb__row--spaced` i `nb__hint--spaced` | OK |
| bookings/BookingTravelDiscountSection.tsx:112,129,143 | RESPONSIU | Resolt al #1157: `gap`, `padding/whiteSpace` i `marginTop` inline passen a `nb__discount-code-row`, `nb__btn--compact` i `nb__field--spaced` | OK |
| leads/[id]/LeadInsightsBanner.tsx:92 | CANÒNIC | Obsolet al #1153: el fitxer ja no existeix al perímetre viu `app/admin/leads` | OK |
| leads/[id]/LeadInsightsBanner.tsx | MONOCAPA | Obsolet al #1153: el fitxer ja no existeix al perímetre viu `app/admin/leads` | OK |
| leads/[id]/LeadDossiersPanel.tsx:52 | CANÒNIC | Obsolet al #1149: el fitxer ja no existeix al perímetre viu `app/admin/leads` | OK |
| leads/[id]/LeadCustomerLinkPanel.tsx | MONOCAPA | Obsolet al #1149: el fitxer ja no existeix al perímetre viu `app/admin/leads` | OK |
| leads/[id]/LeadScoreBreakdown.tsx:18 | CANÒNIC | Obsolet: el fitxer ja no existeix al perímetre viu `app/admin/leads` (Leads reescrit post-2026-06-16) | OK |
| leads/LeadPipelineView.tsx:371,387 | CANÒNIC | Obsolet: el fitxer ja no existeix al perímetre viu `app/admin/leads` | OK |
| leads/LeadPipelineView.tsx:53-465 | RESPONSIU | Obsolet: el fitxer ja no existeix al perímetre viu `app/admin/leads` | OK |
| leads/LeadQuickPriority.tsx:46 · LeadQuickStatus.tsx:71 | RESPONSIU | Obsolet: cap dels dos fitxers existeix al perímetre viu `app/admin/leads` | OK |
| bookings/[id]/page.tsx:392,687 | RESPONSIU | `style={{marginTop:'10px'}}`/`{marginBottom:'16px'}` px estàtic de maquetació → classe local | P3 |
| leads/LeadLostStatusPrompt.tsx | MONOCAPA | Resolt al #1161: `text-white` i `text-white/75` passen a `fx__lostprompt-title` i `fx__lostprompt-label` tokenitzats a `leads-design.css` | OK |
| leads/arxiu/ArxiuClient.tsx:97,117,118 | RESPONSIU | `style={{width:pct}}` dinàmic — OK (excepció) | OK |

## Recompte

- **Fitxers auditats**: 96
- **Fitxers amb troballes**: 35 aprox. (la resta — incloent-hi les fitxes canòniques de lead i la
  capçalera de la fitxa de reserva, els `loading.tsx`/`error.tsx` i la majoria de seccions `nb__*` /
  `bd__*` — netes).
- **Troballes totals**: ~34 entrades de taula.
- **Actualització Client 360**: després dels canvis #1116-#1121, #1126, #1128, #1130, #1131, #1134, #1136, #1139, #1140 i #1141, els panells dinàmics principals del Customer Hub ja tenen drenatge visual documentat, els inline styles de `CustomerHeader` queden fora, `/admin/clientes/reactivation` + `/admin/clientes/referrals` ja no emeten superfícies visuals ad hoc i `ClientesModals` ja no conserva overlay/glass legacy; el residu restant d'aquest òrgan és llista i validació visual, no de panells principals.

### Per severitat

- **P0**: 0 (cap ruta sense auth, cap hex de superfície carbó trencat, cap negre absolut a la fitxa de reserva corregida).
- **P1**: 0 — `StripePaymentPanel.tsx` resolt al Canvi #1113 i `TimelinePanel.tsx` resolt al Canvi #1116.
- **P2**: 0 — pipeline resolt #1149; questionnaire resolt #1151; gallery/share resolts #1152; entrades antigues de leads obsoletes #1149/#1153.
- **P3**: ~16 — font-px ad-hoc restant fora de Bookings llista/pipeline, `style` de marges/amplades px puntuals i `bg-black/20` previews. El default del portal queda resolt al #1159, el Top 1 de Bookings queda resolt/obsolet al #1160 i `LeadLostStatusPrompt` queda resolt al #1161.

## Top 3

1. **bookings/[id]/page.tsx:392,687 (P3)** — `marginTop:'10px'` / `marginBottom:'16px'` px estàtic de maquetació → classe local a `booking-detail.css`.
2. — *(buit)* La resta de l'abast (leads · clientes) està drenada de residus cromàtics, font-px i `style` estàtics.
3. — *(buit)*

> **Estat 2026-06-25 (#1163):** reescaneig de tot l'abast (leads/bookings/clientes). 0 residus cromàtics (`text-[Npx]`, `bg-black`, `hover:text-white`). Els antics Top de Leads (`LeadPipelineView`, `LeadScoreBreakdown`, `LeadQuick*`) són **obsolets**: els fitxers ja no existeixen (Leads reescrit). Top 1 anterior (marges de la llista de clients) resolt al #1163. Únic residu real viu: 2 px estàtics a la fitxa de reserva.
