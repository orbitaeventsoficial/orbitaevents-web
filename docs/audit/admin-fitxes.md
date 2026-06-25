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
| bookings/[id]/ClientPortalAccessPanel.tsx:39,197 | 0-HARDCODED | `#06b6d4` (default + placeholder de l'accent del portal); hauria de venir de config/token de marca del portal | P3 |
| clientes/ClientesModals.tsx:143,381 | CANÒNIC | Resolt al #1141: overlays `bg-black/60 admin-card-glass` substituïts per `cl__modal-backdrop` tokenitzat a `clientes.css` | OK |
| clientes/ClientesModals.tsx:179 | CANÒNIC | Resolt al #1141: fallback `bg-white/5 text-white/40` substituït per `cl__duplicate-score-low` tokenitzat | OK |
| clientes/reactivation/ReactivationClient.tsx:14,76,86,95,113,178,206-219 | MONOCAPA | Resolt al #1139: KPIs, cards, pills, missatge suggerit i accions passen a gramàtica local `rc__*` + `reactivation.css` escopat a `html.admin-mode` | OK |
| clientes/referrals/ReferralsClient.tsx:14,56-255 | MONOCAPA | Resolt al #1140: KPIs, top referrers, filtres, candidats, missatge suggerit i accions passen a gramàtica local `rf__*` + `referrals.css` escopat a `html.admin-mode` | OK |
| clientes/reactivation/page.tsx:22 · referrals/page.tsx:22 | MONOCAPA | Resolt al #1137: botó `border-white/15 bg-white/5` ad-hoc substituït per `.ap-btn ap-btn--xs` | OK |
| clientes/page.tsx:350 · CustomersPageSections.tsx:226,310 | RESPONSIU | `style={{marginTop:10}}`/`{marginLeft:6}` px inline → token/classe | P3 |
| clientes/[id]/_components/CustomerHeader.tsx:234,425 | MONOCAPA | Resolt al #1136: `style` inline (`inset/zIndex`, `display:contents`) mogut a `ch__statusbackdrop` i `ch__stageitem` a `customer-hub.css` | OK |
| bookings/[id]/BookingTotalEditor.tsx:59-119 | MONOCAPA+RESPONSIU | Resolt al #1148: input, trigger, alerta i suggeriment passen de `style={{...}}` inline a classes `bd-total-editor*` tokenitzades a `booking-detail.css` | OK |
| bookings/[id]/BookingMarginCard.tsx:222,248,357 | CANÒNIC | Resolt al #1148: percentatges/títols/benefici passen a classes locals `admin-booking-margin-*` amb escala tipogràfica tokenitzada | OK |
| bookings/[id]/BookingMarginCard.tsx:215,223 | RESPONSIU | `text-[11px]` font-px ad-hoc → token | P3 |
| bookings/page.tsx:304,310,340,363 | MONOCAPA+RESPONSIU | Resolt al #1142: contenidors `style={{...}}` moguts a `bk-detail-bar-row`, `bk-detail-bar-actions`, `bk-list-shell` i `bk-list-shell--top` | OK |
| bookings/page.tsx:366,383 | CANÒNIC | Resolt al #1142: empty-state i cards mòbil passen de `admin-card-glass` a `ap-card bk-empty-state` / `ap-card bk-mobile-card` | OK |
| bookings/page.tsx:393-546 | RESPONSIU | múltiples `text-[10px]`/`text-[9px]` font-px ad-hoc a la taula → tokens | P3 |
| bookings/BookingPipelineView.tsx:182,267,283 | CANÒNIC | Resolt al #1149: dot inactiu i botons ←/→ passen a `bk-pipeline-dot--inactive` / `bk-pipeline-shift-btn` tokenitzats a `booking-detail.css` | OK |
| bookings/BookingPipelineView.tsx:154-312 | RESPONSIU | `text-[10px]`/`text-[11px]` repetits → tokens | P3 |
| bookings/[id]/BookingQuestionnaireSection.tsx:21,25,61 | MONOCAPA+CANÒNIC | `bg-white/[0.02] border-white/10` (10 ocurr.) + `text-cyan-400` enllaç blau | P2 |
| bookings/[id]/BookingGallery.tsx:179,256,262 | CANÒNIC | `bg-white/10`, `bg-white` (toggles) blanc absolut → token/superfície | P2 |
| bookings/[id]/DocumentFlowSection.tsx:97 | CANÒNIC | `bg-black/20` (preview de signatura) + `border-emerald-300/30` ad-hoc | P3 |
| bookings/[id]/GallerySharePanel.tsx:145 | MONOCAPA | `text-white/40 bg-white/[0.03]` (5 ocurr.) ad-hoc → `--t3`/`--panel` | P2 |
| bookings/[id]/BookingStatusChanger.tsx:89,110 | MONOCAPA | fallback `bg-white/30` en map de dots → token | P3 |
| bookings/[id]/BookingChecklist.tsx:115 | RESPONSIU | barra amb `style={{width:pct}}` — dinàmic OK; tone via `${tone.bar}` correcte | OK |
| bookings/BookingFilters.tsx:104 | RESPONSIU | `style={{width:260}}` px dur → `--o-*`/`%` | P3 |
| bookings/BookingClientEventSection.tsx:114-219 | RESPONSIU | `style={{marginBottom/Top:N}}` px inline (6 ocurr.) → classes `nb__*` | P3 |
| bookings/BookingTravelDiscountSection.tsx:112,129,143 | RESPONSIU | `style` amb px (`gap:8`,`padding:'10px 14px'`) inline → classes | P3 |
| leads/[id]/LeadInsightsBanner.tsx:92 | CANÒNIC | `text-cyan-300` blau → `admin-tone-text-cyan` | P2 |
| leads/[id]/LeadInsightsBanner.tsx | MONOCAPA | colors Tailwind semàntics (3) → tones | P3 |
| leads/[id]/LeadDossiersPanel.tsx:52 | CANÒNIC | Obsolet al #1149: el fitxer ja no existeix al perímetre viu `app/admin/leads` | OK |
| leads/[id]/LeadCustomerLinkPanel.tsx | MONOCAPA | Obsolet al #1149: el fitxer ja no existeix al perímetre viu `app/admin/leads` | OK |
| leads/[id]/LeadScoreBreakdown.tsx:18 | CANÒNIC | barra + colors Tailwind semàntics (7) → tones; `style={{width:score}}` dinàmic OK | P3 |
| leads/LeadPipelineView.tsx:371,387 | CANÒNIC | `hover:bg-black/20 hover:text-white` — negre/blanc ad-hoc | P3 |
| leads/LeadPipelineView.tsx:53-465 | RESPONSIU | `text-[10px]` repetit (llista pipeline) → tokens | P3 |
| leads/LeadQuickPriority.tsx:46 · LeadQuickStatus.tsx:71 | RESPONSIU | `text-[11px]` ad-hoc → token | P3 |
| leads/LeadLostStatusPrompt.tsx | MONOCAPA | `white/[...]` ad-hoc (2) → token | P3 |
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
- **P2**: ~3 — superfícies `bg-white/[0.03]` / `border-white/10` ad-hoc, `text-cyan-*` blau i toggles/superfícies `white/*` pendents a questionnaire/gallery/share. Pipeline resolt #1149; entrades antigues de leads obsoletes #1149.
- **P3**: ~20 — font-px ad-hoc (`text-[10px]`/`text-[11px]`/`text-[9px]`), `style` de marges/amplades px puntuals, `#06b6d4` default del portal, `bg-black/20` previews.

## Top 3

1. **bookings/[id]/BookingQuestionnaireSection.tsx (P2)** — superfícies `white/*` i enllaç `text-cyan-*` dins qüestionari; baixar a tokens/classes locals.
2. **bookings/[id]/BookingGallery.tsx + GallerySharePanel.tsx (P2)** — toggles/superfícies amb blanc absolut o `white/*`; baixar a tokens/classes locals.
3. **leads/[id]/LeadInsightsBanner.tsx (P2)** — blau `text-cyan-300` viu; baixar a tone/token canònic.
