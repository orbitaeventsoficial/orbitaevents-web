# Inventari de recursos del repo — què ja tenim i com reaprofitar-ho

> **Propòsit.** Llistar les capacitats que el repo ha acumulat amb el temps (serveis, helpers, atributs únics, guards) perquè **no quedin oblidades** i es reutilitzin en construir la nova eina (`/studio-lab` → admin real). Encàrrec del propietari (2026-05-25).
>
> **Com usar-lo.** Abans de construir res nou per al nou admin, mira aquí: probablement ja existeix. Aquest doc és un **mapa**, no la font de veritat del codi — verifica sempre contra el fitxer abans d'assumir comportament. Complementa `docs/studio-lab-leads-implantacio.md` (mapatge específic de leads) i la secció "Què JA EXISTEIX" de `CLAUDE.md`.
>
> **Escala (2026-05-25):** ~181 serveis a `lib/services/`, 55 guards `qa:*`/`arch:*` a `validate:core`, ~17 catàlegs a `lib/constants/`, formatters i18n centralitzats, hooks i patrons UX reutilitzables.

---

## Llegenda d'aprofitament

- 🟢 **JOIA transversal** — útil a més d'un lloc; portar-ho al nou admin sí o sí.
- 🔵 **Reutilitzar** — peça sòlida per a la seva àrea.
- 🟡 **Avaluar** — pot fer soroll o solapar-se; decidir si entra o va a la brossa.

---

## A. Helpers transversals (capa comuna) — 🟢

Tot el que NO s'ha de reimplementar mai. Viuen sobretot a `lib/constants/index.ts` i `lib/*`.

| Recurs | On | Què fa / per què |
|---|---|---|
| `formatCurrency` / `formatCurrencyExact` | `lib/constants/index.ts` | Moneda centralitzada amb locale. **Mai** `toLocaleString`+€ inline (hi ha guard). |
| `formatDate` / `formatDateTime` / `formatDateShort` / `formatWeekday*` / `formatMonthYear*` | `lib/constants/index.ts` | Família completa de dates/locale. Cobreix gairebé qualsevol format que necessiti el calendari de leads. |
| `toIntlLocale` | `lib/constants/index.ts` | `ca`→`ca-ES`, `es`→`es-ES`, `en`→`en-GB`. |
| `formatNumber` | `lib/constants/index.ts` | Números amb `Intl`. |
| Marge / utilitats financeres | `lib/margin-utils.ts` | Càlculs de marge reutilitzables (no recalcular inline). |
| Sanititza HTML/input | `lib/utils/sanitize.ts`, `lib/utils/normalize.ts` | Neteja d'entrada d'usuari. |
| Resposta API + errors | `lib/api-response.ts`, `lib/api-error-handler.ts` | Forma canònica de resposta i maneig d'errors a rutes. |
| CSRF | `lib/csrf.ts` | Token per a fetch mutants d'admin (guard `qa:admin-mutating-fetch-csrf`). |
| Auth | `lib/auth.ts`, `lib/middleware/admin-auth.ts`, `lib/admin-role.ts` | `requireAuth`/`requirePermission` — tota ruta `/api/admin/*` (guard `qa:api-admin-auth`). |
| Rate limit / Turnstile | `lib/rate-limit.ts`, `lib/turnstile.ts` | Protecció de rutes públiques. |
| Cache de query | `lib/query-cache.ts` | Memoïtzació de consultes. |
| Logger | `lib/logger.ts` | Log estructurat (mai `console.log` a prod; guard `qa:no-console-log`). |
| Storage | `lib/storage.ts` | Uploads a `./uploads/` servits via `/api/uploads/[...path]`. |
| Context de petició | `lib/request-context.ts` | Dades de la request. |

---

## B. Motors de negoci (lògica pura, testejada) — 🟢

Els "cervells" del repo. Reutilitzar **sempre**; mai recalcular inline.

| Motor | On | Què calcula |
|---|---|---|
| **costEngine** | `lib/services/costEngine.ts` | `computeBookingFinancialSummary()` (marge real), `computeSimpleMarginPct()`, `computeCollaboratorNetMargin()`. **Font única** de cost/marge. |
| **fuelReferenceService** | `lib/services/fuelReferenceService.ts` | `getEffectiveVehicleCostPerKm()` — cost vehicle (preu combustible + manteniment). |
| **travelCost** + **googleMapsDistance** | `lib/services/travelCost.ts`, `googleMapsDistance.ts` | Cost i distància de desplaçament per esdeveniment. |
| **commercialScoring** | `lib/services/commercialScoring.ts` | Scoring comercial del lead. |
| **leadScoreBreakdownService** | `lib/services/leadScoreBreakdownService.ts` | Desglossament del score (per què puntua així). |
| **leadPipelineSuggestionsService** | `lib/services/leadPipelineSuggestionsService.ts` | "Pròxima millor acció" — alimenta directament la zona FOCUS de leads. |
| **capacityConflictService** | `lib/services/capacityConflictService.ts` | Detecció de conflictes de recurs/dia (DJ, so, furgoneta…). |
| **bookingCapacityService** | `lib/services/bookingCapacityService.ts` | Capacitat de la temporada. |
| **weatherService** | `lib/services/weatherService.ts` | Previsió meteo per esdeveniment (ja al calendari/fitxa de leads). |
| **cashFlowForecast** / **cacAnalysis** / **attributionService** | `lib/services/*` | Previsió de tresoreria, cost d'adquisició, atribució de canal. |
| **adminStatsService** | `lib/services/adminStatsService.ts` | Agregats per a la tira d'indicadors. |
| **healthCheckService** / **adminHealthService** | `lib/services/*` | Semàfor de salut del sistema. |

---

## C. Lead / comercial — recursos per al PRIMER EXERCICI 🔵

Tot el que ja existeix per a leads i que el laboratori `/studio-lab/leads` pot incorporar (avui usa dades de mostra).

| Recurs | On | Reutilitzar per a |
|---|---|---|
| `leadRouteService` | `lib/services/leadRouteService.ts` | Mutacions d'estat amb validació (auto-LOST/DELETE). |
| **colorTheme** (configurable per l'usuari) | `app/admin/leads/colorTheme.ts` | Colors d'estat/prioritat amb CSS vars `--lead-status-*`. **No** duplicar la paleta del lab; pont cap a aquests tokens. |
| `LeadPipelineView` + `LeadViewToggle` | `app/admin/leads/*` | Kanban real amb D&D i toggle de vista. |
| `LeadQuickStatus` / `LeadQuickPriority` | `app/admin/leads/*` | Canvi ràpid inline. |
| `PipelineSuggestionsPanel` | `app/admin/leads/PipelineSuggestionsPanel.tsx` | Mostra suggeriments del suggestions service. |
| `LeadLostReasonBadge` / `LeadLostStatusPrompt` | `app/admin/leads/*` | Motiu de pèrdua canònic (`lib/constants/leadLoss.ts`). |
| `leadSavedViewsService` | `lib/services/leadSavedViewsService.ts` | Vistes desades (filtres per usuari). |
| `leadReengagementService` / `reactivationService` | `lib/services/*` | Reactivació de leads dormants. |
| `fetchCustomerHub` | (client hub) | Font única de la fitxa de client. |
| Fitxa rica de lead | `app/admin/leads/[id]/` | Score, notes, activitats, documents — reutilitzar, no remaquetar. |

> La maqueta del lab (FOCUS, calendari de caps de setmana, paleta Brass & Obsidian) és la **capa de presentació nova**; aquests serveis són el **motor real** a connectar-hi.

---

## D. Constants i catàlegs (monocapa) — 🔵

`lib/constants/` i `config/` — decisions estables de domini. No duplicar.

- `lib/constants/index.ts` — formatters + ServiceSlug + base (~1800L).
- `lib/constants/admin.ts` — labels de nav, FAB, mòbil, `ADMIN_CHANGE_COUNTER`, paletes de chart/SVG, etc.
- `lib/constants/leadLoss.ts` — motius de pèrdua canònics.
- `lib/constants/pricingRules.ts` — regles de preu per data.
- `lib/constants/automationThresholds.ts` — llindars d'automatització.
- `lib/constants/notifications.ts`, `customer-crm.ts`, `privacy.ts`, `social.ts`, `googleCalendar.ts`, `services.ts`, `adminManual.ts`, `clientPortalNavigation.ts`.
- `config/*` — `packs-config.ts`, `site-config.ts`, `portfolio-images.ts`, `client-logos.ts`, `equipment-config.ts`.

---

## E. Patrons UX i sistema visual — 🟢 per a la PÀGINA TIPUS

El que l'esquelet del nou admin (la "pàgina tipus que ho albergarà tot") ha de reutilitzar.

| Patró | On | Nota |
|---|---|---|
| `useConfirmDialog` + `ConfirmDialog` | `app/admin/components/ConfirmDialog.tsx` | **Mai** `alert()`/`confirm()`. Diàleg canònic. |
| `useAsyncForm` | `app/admin/components/useAsyncForm.ts` | Submit async amb estat de càrrega/error. |
| Hooks de domini | `lib/hooks/*` (`usePacks`, `useBookedDates`, `useAnalytics`, `useUtmParams`…) i `app/admin/bookings/use*` | Lògica reutilitzable. |
| Tokens de tema admin | `app/admin/admin-theme.css`, `app/globals.css`, `app/admin/control-room.css` | Paleta `--at-*`, glass, gradients `.admin-gradient--*`, prefix `html.admin-mode`. |
| Kanban D&D + view toggle | Tasks/Leads/Bookings | Patró de pipeline arrossegable + `view=kanban|list`. |
| Semàfor de pagament | (patró) | `depositPaid && remainingPaid` = verd / `depositPaid` = groc / cap = vermell. |
| Smart GDPR delete | `customerRouteService` | Si té reserves → anonimitza; si no → elimina. |
| WhatsApp | `config/site-config.ts` | `getWhatsAppUrl(messageType, customData)`. |
| Signatura email + `preferredLocale` | `lib/email.ts`, `lib/email-i18n.ts` | Cadena `lead → booking → customer → 'es'`. |

---

## F. Atributs únics / disciplina del repo — 🟢

El que fa aquest repo diferent i que la nova eina ha de **conservar**.

- **55 guards `qa:*`/`arch:*` a `validate:core`** — barrera de qualitat: zero hex inline, zero `slate/gray` a admin, auth a tota ruta admin, monocapa (`arch:layer:check`), CSRF, `th[scope]`, `target=_blank` segur, etc. És patrimoni: cada guard documenta una lliçó apresa.
- **Blindatge de numeració** (`scripts/check-admin-change-log.mjs`, #774) — counter ↔ protocol ↔ diari ↔ xip de la pàgina sempre lligats.
- **`qa:studio-integrity`** — `/studio` no es pot buidar/wireframitzar.
- **`qa:nonstop-protocol`** — `CLAUDE.md` ↔ `agent-runtime-policy.json` ↔ protocol alineats.
- **Monocapa** — cada decisió estable viu a un sol lloc (constants/CSS/helpers).

---

## G. Infraestructura — 🔵

- Storage local + `/api/uploads/[...path]`, CSP/HSTS/headers ja configurats, PWA admin, Sentry, GA4 WebVitals (`lib/analytics/*`), crons amb Bearer auth (`qa:api-cron-auth`), backup BD setmanal, CI (lint+tsc, tests+coverage, build).

---

## Pla d'aprofitament

### 1) Primer exercici — `/studio-lab/leads` incorpora recursos reals
Ordre suggerit (mantenint la presentació nova, canviant la font de dades):
1. **Suggeriments reals a la zona FOCUS** ← `leadPipelineSuggestionsService` + `commercialScoring`.
2. **Colors d'estat via tokens configurables** ← pont a `colorTheme.ts` (no duplicar la paleta del lab).
3. **Meteo i marge reals a la targeta/fitxa** ← `weatherService` + `costEngine`.
4. **Conflictes de recurs al calendari** ← `capacityConflictService`.
5. **Tira d'indicadors amb agregats reals** ← `adminStatsService`.
6. **Mutacions d'estat** ← `leadRouteService` (validació backend).

### 2) La pàgina tipus — l'esquelet que ho albergarà tot
L'`AppShell` de `/studio-lab/leads` (top-nav + grups + page slot) encara **no s'ha treballat**: és la peça que ha de convertir-se en el **layout mestre** del nou admin. Ha de néixer reutilitzant:
- Nav/labels de `lib/constants/admin.ts` (no hardcodejar grups).
- Tokens de `admin-theme.css` amb prefix `html.admin-mode`.
- `useConfirmDialog`, `useAsyncForm`, formatters, `requireAuth`.
- El sistema de guards (qualsevol peça nova passa `validate:core`).

### 3) Soroll / candidats a la brossa — 🟡 (a avaluar, no esborrar sense verificar)
- Possibles serveis duplicats o d'un sol ús que se solapin (p. ex. múltiples `*Static*`/`*StaticFile*` de reviews) — revisar abans de migrar.
- Captures `.dbg-*.cjs` i artefactes de prova que no aporten a producció.
- Qualsevol catàleg local que dupliqui la capa comuna (els guards `*-split`/`arch:layer` ja en detecten molts).

> Regla: abans de llençar res, `grep` complet (component → hook → servei → ruta → test → constants → i18n) com mana `CLAUDE.md`.
