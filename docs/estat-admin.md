# Estat de l'Admin Òrbita Events — Referència Permanent

> Última actualització: 2026-03-17
> NO cal re-auditar cada sessió. Només actualitzar les seccions que canvien.

## Resum

- **57 pàgines admin**, **148 rutes API**, **6 crons**, **~120 serveis**
- Stack: Next.js 14 App Router, TypeScript, Prisma, PostgreSQL (Railway)
- Admin 100% en català, PWA instal·lable
- v2.1 · Prisma + Railway

## Estat per àrea

| Àrea | Estat | Nota |
|------|-------|------|
| Tauler | ✅ Complet | 10 KPIs, gràfiques, radar, alertes, pilot automàtic, **insights narratius** |
| Leads | ✅ Molt complet | Kanban, scoring, flux guiat, workspace, vistes desades |
| Reserves | ✅ Molt complet | Kanban, marge, portal client, contracte, factura, **countdown dies**, section nav |
| Clients Hub | ✅ Molt complet | 9 panells + privacitat, **timeline unificat multi-canal**, KPIs, avatar stepper |
| Privacitat RGPD | ✅ Complet | KPIs, sol·licituds ARCO, audit log, consentiments |
| Calendari | ✅ Complet | Vista mensual + setmanal + **diària**, bloqueig dies inline, drag&drop |
| Tasques | ✅ Complet | Kanban + llista, checklist diari |
| Emails | ✅ Complet | Auto + IMAP + post-event + paperera + **firma professional** + **plantilles i18n BD** |
| Finances | ✅ Molt complet | Tresoreria, marge, CAC, MITECO, Holded, **col·laboradors** |
| Pressupostos | ✅ Complet | Editor PDF **D&D** + contracte unificat + llistat amb filtres, cerca, accions, stats |
| Packs | ✅ Complet | Motor preus, health, extras |
| Inventari | ✅ Complet | Items, fotos, cost/hora, bundles |
| Sales Ops | ✅ Complet | SLA, seqüències, auditoria, plans |
| Post-event | ✅ Complet | 3 passos, informes, surveys, feedback |
| Col·laboradors | ✅ Complet | **NOU** — CRUD, KPIs, comissions (model net/descompte), integració costEngine |
| Cost Calculator | ✅ Complet | **NOU** — D&D components, cost inventari real, marge suggerit, guardar pressupost |
| Analítica | ✅ Complet | GA4, Ads, KPIs operatius |
| Configuració | ✅ Complet | Empresa, Holded, integracions, plantilles, **email-templates** |
| Canvas | ✅ Complet | Generador imatges promo (stories + posts) |
| Scripts | ✅ Complet | Catàleg visual 28+ scripts (seed/sync/check/report/fix/audit) |
| Crons (6) | ✅ Complet | Comercial, fuel, invoices, pricing, post-event, reviews-sync + **pàgina monitoratge** |
| Auto-triggers | ✅ Complet | **NOU** — proposal→contracte, lead→welcome email, booking→checklist pre-event |

## Pàgines per ruta

### Navegació principal
- `/admin` — Tauler (dashboard)
- `/admin/leads` — Entrades (llistat + kanban)
- `/admin/leads/[id]` — Fitxa lead
- `/admin/intake` — Entrada ràpida
- `/admin/clientes` — Clients
- `/admin/clientes/[id]` — Customer Hub 360
- `/admin/bookings` — Reserves (llistat + kanban)
- `/admin/bookings/[id]` — Fitxa reserva
- `/admin/bookings/new` — Nova reserva
- `/admin/tasks` — Tasques (kanban)
- `/admin/calendario` — Calendari mensual

### Comercial
- `/admin/emails` — Correus automàtics + stats
- `/admin/inbox` — Safata IMAP + paperera
- `/admin/inbox/compose` — Redactar email (amb firma)
- `/admin/inbox/settings` — Config IMAP
- `/admin/mensajes` — Missatges/seqüències
- `/admin/presupuestos` — PDF Studio D&D (pressupost + contracte)
- `/admin/sales-ops` — Panell comercial
- `/admin/email-templates` — Plantilles email (24 plantilles × 3 idiomes)
- `/admin/email-templates/[slug]` — Editar plantilla
- `/admin/post-event` — Hub post-event
- `/admin/post-event/reports` — Informes interns
- `/admin/post-event/reports/new` — Nou informe
- `/admin/post-event/feedback` — Feedback clients
- `/admin/post-event/surveys` — Enquestes

### Producte
- `/admin/packs` — Packs
- `/admin/packs/[id]` — Editar pack
- `/admin/packs/new` — Nou pack
- `/admin/packs/extras` — Extras
- `/admin/inventory` — Inventari
- `/admin/inventory/[id]` — Fitxa inventari
- `/admin/inventory/new` — Nou item
- `/admin/pricing` — Preus
- `/admin/discount-codes` — Codis descompte
- `/admin/catalog` — Catàleg

### Finances
- `/admin/economia` — Panell finances (tresoreria, cobraments, marge, CAC)
- `/admin/collaborators` — Col·laboradors (CRUD, KPIs, comissions)
- `/admin/cost-calculator` — Configurador costos D&D
- `/admin/analytics` — Analítica (GA4, Ads)

### Contingut
- `/admin/blog` — Blog
- `/admin/faq` — FAQ
- `/admin/text-manager` — Textos web
- `/admin/google-reviews` — Ressenyes Google
- `/admin/ressenyes` — Testimonis

### Legal
- `/admin/privacy` — Privacitat RGPD (KPIs, ARCO, audit)

### Scripts i eines
- `/admin/scripts` — Catàleg visual de 28+ scripts (seed/sync/check/report/fix/audit)
- `/admin/crons` — Monitoratge crons (estat, últim run, errors)

### Configuració
- `/admin/settings` — Hub configuració
- `/admin/settings/company` — Empresa + Holded + toggle switch
- `/admin/settings/integrations` — Integracions
- `/admin/settings/quotes` — Plantilla pressupostos
- `/admin/settings/notifications` — Notificacions
- `/admin/features` — Feature flags
- `/admin/coverage` — Cobertura
- `/admin/stats` — Estadístiques web
- `/admin/css-manager` — Tema CSS
- `/admin/canvas` — Generador imatges (stories + posts)

## Crons

| Cron | Freqüència | Funció |
|------|-----------|--------|
| `commercial-daily` | Diari | Seqüències + SLA + recordatoris + scoring + resum |
| `fuel-daily` | Diari | Preu MITECO → cost/km |
| `invoice-sync` | Diari | Sync Holded |
| `pack-pricing-check` | Diari | Alertes preus divergents >15% |
| `post-event` | Diari | Emails post-event auto |
| `reviews-sync` | Diari | SerpAPI → ressenyes Google a BD |

## Serveis clau (lib/services/)

- `costEngine.ts` — Font única veritat marges/costos + marge col·laboradors
- `commercialScoring.ts` — Score + band leads (cache diari)
- `cashFlowForecast.ts` — Projecció tresoreria mensual
- `pipelineForecast.ts` — Previsió vendes ponderat + estacionalitat
- `automationTriggers.ts` — Auto-triggers (proposal→contracte, lead→welcome, booking→checklist)
- `dashboardInsightsService.ts` — Insights narratius (fins a 5 prioritzats)
- `collaboratorAdminService.ts` — CRUD col·laboradors + KPIs
- `postEventEmailService.ts` — Emails post-event
- `contractService.ts` — Contractes PDF
- `holdedService.ts` — Facturació Holded
- `fuelReferenceService.ts` — MITECO → cost/km
- `paymentReminderService.ts` — Recordatoris pagament (i18n)
- `slaAutomationService.ts` — SLA 24h
- `cacAnalysis.ts` — CAC per canal (dades conversió reals)

## Bugs arreglats (2026-03-09)

- ✅ Lockfile sense supabase (build Railway)
- ✅ CSRF a 14 components (pressupostos, factures, cobraments, etc.)
- ✅ Post-event email ruta redirect→JSON
- ✅ CSS !important matava totes les visuals
- ✅ Dashboard queries seqüencials→paral·leles
- ✅ Pressupostos carreguen snapshot quan s'editen

## Full de ruta v1 (COMPLETAT — 12/14)

> Tasques originals. 12 fetes, 2 nice-to-haves pendents (WhatsApp historial, multi-usuari).

1. ~~Llistat pressupostos millorat~~ ✅ | 2. ~~Calendari setmanal~~ ✅ | 3. ~~Templates email~~ ✅ | 4. ~~Config IMAP~~ ✅
5. ~~Gestió disponibilitat~~ ✅ | 6. WhatsApp historial (nice-to-have) | 7. ~~Logs crons~~ ✅ | 8. ~~Aprovació testimonis~~ ✅
9. Multi-usuari (nice-to-have) | 10. ~~Editor emails~~ ✅ | 11. ~~Vista diària~~ ✅ | 12. ~~Privacitat RGPD~~ ✅ | 13. ~~Scripts admin~~ ✅ | 14. ~~Seed plantilles~~ ✅

---

## Full de ruta v2 — "La Millor Web del Món" (COMPLETAT 2026-03-17 — 10/10)

### FASE 1 — Impacte visual (web pública)

| # | Tasca | Fitxer principal | Estat |
|---|-------|-----------------|-------|
| P1 | **Hero cinematogràfic** — slide-up + blur transició, typewriter, stagger | `HeroElegant.tsx` | ✅ |
| P3 | **Portfolio cinematogràfic** — scroll horitzontal snap, auto-rotate fotos, parallax títol, dots | `PortfolioShowcase.tsx` | ✅ |
| P4 | **Comptadors dinàmics** — connectats a BD real, API `/api/public/stats` cache 1h | `StatsSection.tsx` | ✅ |

### FASE 2 — Conversió (configurador + urgència)

| # | Tasca | Fitxer principal | Estat |
|---|-------|-----------------|-------|
| P2 | **Configurador amb ambient** — gradient dinàmic per tipus, barra preu sticky, accents | `configurador/client.tsx` | ✅ |
| P5 | **Social pressure + countdown** — LED pulsant, "queden N dissabtes", early-bird | `CalendarioUrgencia.tsx` | ✅ |

### FASE 3 — Eines de negoci noves

| # | Tasca | Fitxer principal | Estat |
|---|-------|-----------------|-------|
| F1 | **Col·laboradors** — Prisma model, CRUD, KPIs, comissions net/descompte, costEngine integrat | `admin/collaborators/` | ✅ |
| F2 | **Configurador costos D&D** — 12 components arrossegables, cost inventari, marge configurable | `admin/cost-calculator/` | ✅ |

### FASE 4 — Admin intel·ligent

| # | Tasca | Fitxer principal | Estat |
|---|-------|-----------------|-------|
| A1 | **Insights narratius** — fins a 5 insights prioritzats en català al dashboard | `dashboardInsightsService.ts` | ✅ |
| A5 | **Timeline unificat** — email+WhatsApp+trucades+notes en un fil, icones per canal | `TimelinePanel.tsx` | ✅ |
| A6 | **Auto-triggers** — proposal→contracte, lead→welcome, booking→checklist | `automationTriggers.ts` | ✅ |
