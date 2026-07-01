# 🔬 AUDITORIA PROFUNDA — TOT el que és canonitzable (front + back)

> Escaneig exhaustiu de CADA fitxer del repo (app + lib + components), 2026-07-01.
> Distingeix **CANONITZABLE** (deute real a arreglar) de **TÈCNIC ACCEPTAT** (email HTML, PDF, eina css-manager, Studio — el protocol ho permet, NO tocar).

## RESUM
- Fitxers amb deute CANONITZABLE: **138**
- Fitxers tècnic acceptat (no tocar): 5
- Totals canonitzables: colors=395 · inline=241 · fontpx=51 · bem=0 · dashboard-cr=890 · px-css=860

## 🔴 CANONITZABLE (deute real — ordenat per prioritat)
Col=colors crus · Inl=inline · Fpx=font px · Bem=xx__ · CR=dashboard · Pxc=px CSS

| # | Fitxer | Col | Inl | Fpx | Bem | CR | Pxc |
|---|---|---|---|---|---|---|---|
| 1 | `app/admin/control-room.css` | 2 | 0 | 0 | 0 | 645 | 148 |
| 2 | `app/admin/page.tsx` | 0 | 1 | 0 | 0 | 243 | 0 |
| 3 | `app/globals.css` | 6 | 0 | 0 | 0 | 1 | 217 |
| 4 | `app/[locale]/tematica-halloween/client.tsx` | 33 | 5 | 3 | 0 | 0 | 0 |
| 5 | `lib/constants/admin.ts` | 18 | 0 | 0 | 0 | 0 | 0 |
| 6 | `app/components/ui/CalendarioUrgencia.tsx` | 31 | 0 | 6 | 0 | 0 | 0 |
| 7 | `app/admin/admin-shell.css` | 0 | 0 | 5 | 0 | 0 | 448 |
| 8 | `app/components/ui/HeaderChampion.tsx` | 19 | 4 | 9 | 0 | 0 | 0 |
| 9 | `app/admin/admin-theme.css` | 0 | 0 | 0 | 0 | 1 | 32 |
| 10 | `lib/services/customerProcessService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | `app/[locale]/tematica-mon-magic/client.tsx` | 6 | 24 | 2 | 0 | 0 | 0 |
| 12 | `app/api/canvas/rating/route.tsx` | 0 | 14 | 0 | 0 | 0 | 0 |
| 13 | `app/api/contact/route.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | `app/components/ui/HalloweenAtmosphere.tsx` | 13 | 6 | 0 | 0 | 0 | 0 |
| 15 | `app/[locale]/privacitat/client.tsx` | 15 | 0 | 0 | 0 | 0 | 0 |
| 16 | `lib/customer-hub/labels.ts` | 15 | 0 | 0 | 0 | 0 | 0 |
| 17 | `app/components/ui/LanguageSelector.tsx` | 8 | 0 | 0 | 0 | 0 | 0 |
| 18 | `lib/publicHomeShowcase.ts` | 14 | 0 | 0 | 0 | 0 | 0 |
| 19 | `app/[locale]/portal/[token]/page.tsx` | 5 | 24 | 1 | 0 | 0 | 0 |
| 20 | `app/admin/text-manager/text-manager-config.ts` | 13 | 0 | 0 | 0 | 0 | 0 |
| 21 | `app/components/marketing/GarantiaSection.tsx` | 13 | 0 | 0 | 0 | 0 | 0 |
| 22 | `app/api/privacy/verify/route.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 23 | `app/components/ui/FloatingCTAs.tsx` | 11 | 1 | 1 | 0 | 0 | 0 |
| 24 | `lib/margin-utils.ts` | 12 | 0 | 0 | 0 | 0 | 0 |
| 25 | `lib/utils/dossier-html-builder.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 26 | `app/components/ui/HeroPortalLogo.tsx` | 0 | 6 | 0 | 0 | 0 | 0 |
| 27 | `app/[locale]/portal/[token]/contract/page.tsx` | 8 | 4 | 0 | 0 | 0 | 0 |
| 28 | `lib/constants/pricing-intelligence.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 29 | `app/components/ui/footer.tsx` | 9 | 0 | 0 | 0 | 0 | 0 |
| 30 | `app/[locale]/gracias/page.tsx` | 9 | 0 | 0 | 0 | 0 | 0 |
| 31 | `app/components/mobile-ultimate/MobileHeroUltimate.tsx` | 1 | 5 | 6 | 0 | 0 | 0 |
| 32 | `lib/services/notificationService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 33 | `app/components/ui/HeroElegant.tsx` | 2 | 9 | 0 | 0 | 0 | 0 |
| 34 | `lib/services/commercialDailyAutomationService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 35 | `lib/services/weeklyBenchmarkService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 36 | `app/admin/leads/colorTheme.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 37 | `app/components/marketing/CTAFinal.tsx` | 7 | 1 | 0 | 0 | 0 | 0 |
| 38 | `app/components/ui/HalloweenDecorationSection.tsx` | 7 | 1 | 0 | 0 | 0 | 0 |
| 39 | `app/[locale]/configurador/configurador-utils.ts` | 7 | 0 | 0 | 0 | 0 | 0 |
| 40 | `app/admin/canvas/CanvasEditorClient.tsx` | 0 | 6 | 0 | 0 | 0 | 0 |
| 41 | `app/admin/presupuestos/StudioPreview.tsx` | 6 | 0 | 0 | 0 | 0 | 0 |
| 42 | `app/api/canvas/testimonial/route.tsx` | 0 | 16 | 0 | 0 | 0 | 0 |
| 43 | `app/[locale]/portal/payment-success/page.tsx` | 6 | 0 | 0 | 0 | 0 | 0 |
| 44 | `lib/inventory-utils.ts` | 6 | 0 | 0 | 0 | 0 | 0 |
| 45 | `app/[locale]/sensorial/page.tsx` | 2 | 9 | 1 | 0 | 0 | 0 |
| 46 | `lib/services/urgentFollowUpAlertService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 47 | `app/admin/presupuestos/PresupuestoPdfStudio.tsx` | 5 | 0 | 0 | 0 | 0 | 0 |
| 48 | `app/components/legal/CookieConsent.client.tsx` | 5 | 0 | 0 | 0 | 0 | 0 |
| 49 | `app/components/marketing/TrustedByLogos.tsx` | 5 | 0 | 0 | 0 | 0 | 0 |
| 50 | `app/[locale]/blog/page.tsx` | 5 | 0 | 0 | 0 | 0 | 0 |
| 51 | `components/calendar/AvailabilityCalendar.tsx` | 5 | 0 | 0 | 0 | 0 | 0 |
| 52 | `app/components/mobile-ultimate/MobileHomePage.tsx` | 1 | 3 | 3 | 0 | 0 | 0 |
| 53 | `app/components/mobile-ultimate/MobileProcessSection.tsx` | 2 | 2 | 1 | 0 | 0 | 0 |
| 54 | `app/[locale]/portal/[token]/sign/SignContractForm.tsx` | 4 | 2 | 0 | 0 | 0 | 0 |
| 55 | `app/components/marketing/ProcessSection.tsx` | 3 | 2 | 1 | 0 | 0 | 0 |
| 56 | `app/[locale]/configurador/client.tsx` | 3 | 0 | 2 | 0 | 0 | 0 |
| 57 | `app/[locale]/portal/[token]/invoice/page.tsx` | 3 | 4 | 0 | 0 | 0 | 0 |
| 58 | `app/[locale]/contacto/client.tsx` | 4 | 0 | 0 | 0 | 0 | 0 |
| 59 | `lib/services/adminTestNotificationService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 60 | `app/components/home/GoogleReviewsRotating.tsx` | 3 | 2 | 0 | 0 | 0 | 0 |
| 61 | `app/components/mobile-ultimate/MobileAppShell.tsx` | 3 | 2 | 0 | 0 | 0 | 0 |
| 62 | `app/[locale]/portal/[token]/payments/BizumPayButton.tsx` | 3 | 1 | 0 | 0 | 0 | 0 |
| 63 | `app/[locale]/portal/[token]/payments/page.tsx` | 2 | 4 | 0 | 0 | 0 | 0 |
| 64 | `lib/services/bookingPortalCompletionService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 65 | `lib/services/executiveReportDispatchService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 66 | `lib/services/paymentReminderService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 67 | `app/admin/image-manager/page.tsx` | 3 | 0 | 0 | 0 | 0 | 0 |
| 68 | `app/api/canvas/custom/route.tsx` | 0 | 3 | 0 | 0 | 0 | 0 |
| 69 | `app/[locale]/configurador/page.tsx` | 3 | 0 | 0 | 0 | 0 | 0 |
| 70 | `app/[locale]/faq/client.tsx` | 3 | 0 | 0 | 0 | 0 | 0 |
| 71 | `app/[locale]/legal/privacidad/client.tsx` | 3 | 0 | 0 | 0 | 0 | 0 |
| 72 | `app/[locale]/portal/[token]/questionnaire/QuestionnaireForm.tsx` | 2 | 1 | 0 | 0 | 0 | 0 |
| 73 | `app/[locale]/portfolio/[slug]/[eventSlug]/page.tsx` | 1 | 0 | 3 | 0 | 0 | 0 |
| 74 | `app/components/mobile-ultimate/MobileBottomNav.tsx` | 2 | 0 | 1 | 0 | 0 | 0 |
| 75 | `app/components/public/GoogleGIcon.tsx` | 0 | 0 | 0 | 0 | 0 | 0 |
| 76 | `app/[locale]/opiniones/page.tsx` | 2 | 0 | 0 | 0 | 0 | 0 |
| 77 | `app/[locale]/portal/[token]/timeline/page.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 78 | `app/admin/lib/dashboard-widgets.tsx` | 0 | 7 | 0 | 0 | 0 | 0 |
| 79 | `app/components/mobile-ultimate/MobilePortfolioShowcase.tsx` | 1 | 2 | 1 | 0 | 0 | 0 |
| 80 | `app/config/site-config.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 81 | `app/not-found.tsx` | 0 | 0 | 0 | 0 | 0 | 0 |
| 82 | `app/[locale]/experiencias/page.tsx` | 2 | 0 | 0 | 0 | 0 | 0 |
| 83 | `app/[locale]/gallery/[shareToken]/page.tsx` | 2 | 0 | 0 | 0 | 0 | 0 |
| 84 | `app/[locale]/portfolio/[slug]/page.tsx` | 0 | 0 | 3 | 0 | 0 | 0 |
| 85 | `app/[locale]/servicios/page.tsx` | 2 | 0 | 0 | 0 | 0 | 0 |
| 86 | `lib/services/bookingCommunicationService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 87 | `app/admin/analytics/page.tsx` | 0 | 5 | 0 | 0 | 0 | 0 |
| 88 | `app/components/mobile-ultimate/MobileServicesCards.tsx` | 1 | 2 | 0 | 0 | 0 | 0 |
| 89 | `app/[locale]/layout.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 90 | `app/[locale]/portal/[token]/PortalBottomNav.tsx` | 0 | 3 | 1 | 0 | 0 | 0 |
| 91 | `app/admin/components/AttributionPanel.tsx` | 0 | 4 | 0 | 0 | 0 | 0 |
| 92 | `app/api/og/route.tsx` | 0 | 4 | 0 | 0 | 0 | 0 |
| 93 | `app/[locale]/portal/[token]/sign/SignaturePad.tsx` | 0 | 0 | 0 | 0 | 0 | 0 |
| 94 | `lib/services/leadSnapshotService.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 95 | `app/admin/components/SortableList.tsx` | 0 | 3 | 0 | 0 | 0 | 0 |
| 96 | `app/admin/leads/arxiu/ArxiuClient.tsx` | 0 | 3 | 0 | 0 | 0 | 0 |
| 97 | `app/admin/sales-ops/LossBreakdownPanel.tsx` | 0 | 3 | 0 | 0 | 0 | 0 |
| 98 | `app/components/layout/LayoutWrapper.tsx` | 1 | 0 | 0 | 0 | 0 | 0 |
| 99 | `app/components/mobile-ultimate/MobileErrorBoundary.tsx` | 1 | 0 | 0 | 0 | 0 | 0 |
| 100 | `app/components/pwa/PWAProvider.tsx` | 1 | 0 | 0 | 0 | 0 | 0 |
| 101 | `app/components/ui/ExitIntentModal.tsx` | 1 | 0 | 0 | 0 | 0 | 0 |
| 102 | `app/[locale]/blog/[slug]/page.tsx` | 1 | 0 | 0 | 0 | 0 | 0 |
| 103 | `app/[locale]/disponibilidad/page.tsx` | 1 | 0 | 0 | 0 | 0 | 0 |
| 104 | `app/[locale]/opiniones/client.tsx` | 1 | 0 | 0 | 0 | 0 | 0 |
| 105 | `app/[locale]/portal/[token]/sign/page.tsx` | 0 | 3 | 0 | 0 | 0 | 0 |
| 106 | `app/[locale]/servicios/client.tsx` | 1 | 0 | 0 | 0 | 0 | 0 |
| 107 | `app/admin/bookings/[id]/page.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 108 | `app/admin/components/AdminLoadingSkeletonList.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 109 | `app/admin/components/PipelineBoard.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 110 | `app/admin/economia/economia-components.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 111 | `app/admin/economia/EconomiaClient.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 112 | `app/admin/inventory/InventoryListSections.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 113 | `app/admin/pricing/page.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 114 | `app/components/marketing/PortfolioShowcase.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 115 | `app/components/mobile-ultimate/MobileCTAUrgency.tsx` | 0 | 0 | 1 | 0 | 0 | 0 |
| 116 | `app/components/ui/ServicesGridElegant.tsx` | 0 | 2 | 0 | 0 | 0 | 0 |
| 117 | `app/viewport.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 118 | `lib/clientPortalUtils.ts` | 0 | 0 | 0 | 0 | 0 | 0 |
| 119 | `app/admin/bookings/[id]/BookingChecklist.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 120 | `app/admin/bookings/[id]/DocumentFlowSection.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 121 | `app/admin/clientes/[id]/_components/panels/SummaryPanel.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 122 | `app/admin/components/AdminLoadingSkeletonInbox.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 123 | `app/admin/components/AnomalyPanel.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 124 | `app/admin/components/CapacityConflictPanel.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 125 | `app/admin/components/CaptureHealthPanel.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 126 | `app/admin/components/InfoTooltip.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 127 | `app/admin/inventory/[id]/page.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 128 | `app/admin/leads/leads-design.css` | 0 | 0 | 0 | 0 | 0 | 15 |
| 129 | `app/admin/marketing/page.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 130 | `app/admin/post-event/playbook/page.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 131 | `app/components/legal/ConsentScripts.client.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 132 | `app/components/mobile-ultimate/MobileStatsSection.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 133 | `app/components/ui/GuestRecommender.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 134 | `app/[locale]/boda-halloween/page.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 135 | `app/[locale]/error.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 136 | `app/[locale]/portal/[token]/CountdownTimer.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 137 | `app/[locale]/portal/[token]/gallery/page.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |
| 138 | `app/[locale]/portal/[token]/questionnaire/page.tsx` | 0 | 1 | 0 | 0 | 0 | 0 |

## ⚪ TÈCNIC ACCEPTAT (NO tocar — email/PDF/eina/Studio)
| Fitxer | motiu |
|---|---|
| `app/studio/studio.css` | Studio (fitxa tècnica) |
| `lib/constants/index.ts` | config |
| `app/studio/StudioShowroom.tsx` | Studio (fitxa tècnica) |
| `app/admin/css-manager/page.tsx` | eina de color |
| `app/studio/orbita-tokens.css` | Studio (fitxa tècnica) |

## AGRUPACIÓ per zona (on ataca)
| Zona | Fitxers canonitzables | Deute principal |
|---|---|---|
| **Dashboard admin** (control-room + page.tsx) | 2 | 888 usos `admin-cr-*`/`cr-*` (EN CURS agent) + colors crus |
| **CSS admin** (admin-shell/theme/globals) | 3 | ~697 px hardcoded → tokens espaiat |
| **Front públic temàtiques** (halloween/mon-magic) | ~6 | colors crus — ⚠️ ALGUNS són paletes temàtiques APROVADES (CLAUDE.md: Món Màgic/Halloween tancats) — revisar cas per cas, NO tot és deute |
| **Front públic components** (ui/*) | ~30 | colors Tailwind crus (slate/gray) → tokens |
| **Front públic pàgines** ([locale]/*) | ~40 | colors crus + inline styles |
| **Back serveis/constants** (lib/*) | ~20 | colors en labels/config (alguns són dades, no UI) |
| **APIs** (app/api) | ~10 | inline styles (canvas/rating = imatge, acceptat), 1 prisma-in-route |

## MATISOS IMPORTANTS (no tot el count és deute real)
1. **Temàtiques** (halloween, mon-magic): tenen paleta pròpia APROVADA pel propietari (CLAUDE.md §Temàtiques tancat). NO són deute — són disseny intencional.
2. **Colors en `lib/constants`/`labels.ts`**: molts són noms de color com a DADES (mapes d'estat), no estil viu. Revisar.
3. **`api/canvas/rating`**: inline styles per generar IMATGE (og-image), cas tècnic acceptat.
4. **PDF/email/css-manager/Studio**: ja exclosos (tècnic acceptat).

## PLA (per capes, ordre d'impacte)
1. 🔄 **Dashboard** (control-room + page.tsx) → canònic. EN CURS (agent).
2. **Colors crus reals** del front públic (ui/* i pàgines, EXCLOSES temàtiques) → tokens.
3. **px → tokens d'espaiat** als CSS admin (~697) — el gran, homogeneïtza el ritme.
4. **Inline styles** substituïbles → classes (excloent width dinàmic/canvas).
5. **1 prisma-in-route** → servei.
