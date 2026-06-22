# Auditoria de codi mort — passada neteja 2026-06-19

Detecció: `ts-prune` (exports sense ús) + verificació `grep` repo-wide (símbol exacte mencionat només al seu propi fitxer = `count==1`). Falsos positius de `ts-prune` descartats (re-exports de barrel, magic-exports de Next, helpers documentats).

## Ja eliminat (merda morta segura)

- **46 scripts de debug** `.dbg-*.cjs` (captures Playwright d'un sol ús). Mantingut només `.dbg-studio.cjs` (mandat del protocol per a la zona protegida `/studio`).
- **8 dependències sense ús**: `@react-email/components`, `@react-email/render`, `@sendgrid/mail`, `date-fns`, `dotenv`, `jspdf-autotable`, `react-hook-form` + `@types/dompurify` (stub deprecat). `cssnano` es manté (l'usa `postcss.config` en producció).
- **2 blobs base64 morts** (134 KB): `lib/logo-base64.ts` (`ORBITA_LOGO_BASE64`) + `lib/logo-wordmark-base64.ts` (`ORBITA_LOGO_TEXT_DRETA_BASE64`). 0 consumidors.

## Exports morts verificats — NO esborrats (decisió del propietari)

Verificats sense ús (`count==1`), però **conscientment NO eliminats** perquè són superfície d'API deliberada, infraestructura o domini canònic. Esborrar-los unilateralment violaria CLAUDE.md (*«conservar el que funciona», «no tocar negoci sense raó explícita»*) i la doctrina monocapa. El tree-shaking ja els treu del bundle de client, així que no fan bloat de producte.

### A — API documentada-canònica (CLAUDE.md). NO tocar sense ordre.
- `app/config/site-config.ts`: `getWhatsAppUrl`, `getPhoneLink`, `getEmailLink`, `getGoogleMapsUrl`, `isFeatureEnabled` — CLAUDE.md documenta `getWhatsAppUrl(messageType, customData)` com a helper canònic.

### B — Infraestructura (el canal de correu és font de veritat). NO tocar sense ordre.
- `lib/imap.ts`: `clearFetchEmailCache`, `clearSpecialFoldersCache`, `expungeFolder`.
- `lib/pdf-header.ts`: `drawCanonicalCard`, `drawCanonicalLabel`, `spacingDelta`.

### C — Domini / constants monocapa (decisió de producte)
- `lib/constants/pricing-intelligence.ts`: `getHourlyColor`, `getPriceDeviationAlert`, `MARGIN_ADVICE`, `SOLIDARITY_RULES`.
- `lib/constants/pricingRules.ts`: `DATE_PRICING_RULE_PRIORITY_MAX`.
- `lib/constants/admin.ts`: `ADMIN_SHORTCUT_ROUTES`, `ADMIN_KONAMI_SEQUENCE`, `ADMIN_PAGE_LABELS`, `ADMIN_DETAIL_PAGE_LABELS`, `BOOKING_ACTIVITY_ACTION_LABELS`, `ADMIN_FAB_ITEMS`, `ADMIN_MOBILE_PRIMARY_NAV`, `COLLABORATOR_DEFAULT_MARKUP`.
- `lib/constants/index.ts`: `INVENTORY_CATEGORY_LABELS`, `INTAKE_SOURCE_SELECTED_STYLES`, `INVOICE_STATUS_LABELS`, `PUBLIC_HALLOWEEN_PREVIEW_ICONS`, `PUBLIC_FOOTER_TRUST_SIGNAL_META`, + types (`PublicHomePillar*`, `TaskSource`, `PublicHomeMobileCard`, `PublicPortfolioShowcaseBaseItem`).
- `app/config/equipment-config.ts`: `getEquipmentByCategory`, `getEquipmentByBrand`, `getTotalEquipmentCount`, `isEquipmentAvailable`, `getTotalInventoryValue`, `validateInventory`.
- `app/config/packs-config.ts`: `getDescripcionSonido`, `getDescripcionIluminacionBasica`, `getDescripcionIluminacionPRO`, `getRecommendedPack`, `getFAQEquipamiento`, `getFAQPreciosResumen`.

### D — Candidats nets de poca controvèrsia (helpers/components UI no renderitzats)
Es podrien eliminar en una passada dedicada amb verificació visual, però NO en aquesta (no són «morta» evident i toquen UI viva):
- `app/admin/calendario/CalendarSections.tsx`: `CalendarHeader`, `CalendarStatsGrid`, `CalendarLegend`.
- `app/components/ui`: `HeroUrgencyBadgeCompact`, `LanguageBar`, `PWAInstallButton`.
- `components/reviews/ReviewsSection.tsx`: `ReviewsBadge`, `ReviewsInline`.
- `app/lib/analytics.ts`: `trackPackSelection`, `trackVideoView`, `trackCalculatorUse`, `initAnalytics`.
- `hooks/usePublicData.ts`: `useCountdown`, `usePrices`.
- `lib/api-error-handler.ts`: `handleApiError`, `notFoundError`, `unauthorizedError`, `rateLimitError`.
- Altres: `lib/home-meta.ts:getDefaultHomeMeta`, `lib/api-response.ts:ApiResponse`, `lib/services/publicServiceMediaService.ts:getPublicServicePortfolioSlug`, `lib/customer-hub/*`, `lib/inventory-image-constants.ts`, `app/admin/leads/colorTheme.ts`, `app/admin/text-manager/text-manager-config.ts` (types), etc.

## Deute canon (no és codi mort, és «no canònic»)
`qa:admin-canon`: **0 P1**, **78 P3** advisoris:
- `superficie-adhoc` ×70 — `bg-white/[0.0x]` ad-hoc → `.ap-card`/`.adm-row-hover`.
- `font-px` ×8 — `text-[22px]` en números display → token `--o-text-*`.

Són canvis **visuals** que requereixen verificació a 3 breakpoints; passada dedicada, no neteja de codi mort.

## Codi LATENT — preparat però no cablejat (NO esborrar, no és mort)

- `lib/services/holdedService.ts`: integració de facturació amb Holded, gated per `HOLDED_ENABLED`/`HOLDED_API_KEY` (`isHoldedEnabled()`). Cap importador actiu perquè la **facturació està APARCADA** al full de ruta (s'activa quan Òrbita tingui estructura legal/bancària, §0 de producte-zenit). Ecosistema present (InvoiceSection, `/api/admin/invoices/[id]/sync`, schema). És codi LATENT intencional, no mort. Verificat #1045 (claude, 2026-06-22).
