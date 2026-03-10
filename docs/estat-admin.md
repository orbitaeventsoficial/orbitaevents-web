# Estat de l'Admin Òrbita Events — Referència Permanent

> Última actualització: 2026-03-09 (sessió 4)
> NO cal re-auditar cada sessió. Només actualitzar les seccions que canvien.

## Resum

- **64 pàgines**, **132 rutes API**, **5 crons**, **37 serveis**
- Stack: Next.js 14 App Router, TypeScript, Prisma, PostgreSQL (Railway)
- Admin 100% en català

## Estat per àrea

| Àrea | Estat | Nota |
|------|-------|------|
| Tauler | ✅ Complet | 10 KPIs, gràfiques, radar, alertes, pilot automàtic |
| Leads | ✅ Molt complet | Kanban, scoring, flux guiat, workspace, vistes desades |
| Reserves | ✅ Molt complet | Kanban, marge, portal client, contracte, factura |
| Clients Hub | ✅ Molt complet | 9 panells + privacitat, timeline, KPIs |
| Privacitat RGPD | ✅ Complet | KPIs, sol·licituds ARCO, audit log, consentiments |
| Calendari | ✅ Complet | Vista mensual + setmanal, bloqueig dies inline, drag&drop |
| Tasques | ✅ Complet | Kanban + llista, checklist diari |
| Emails | ✅ Complet | Auto + IMAP + post-event + paperera |
| Finances | ✅ Molt complet | Tresoreria, marge, CAC, MITECO, Holded |
| Pressupostos | ✅ Complet | Editor PDF + llistat amb filtres, cerca, accions, stats |
| Packs | ✅ Complet | Motor preus, health, extras |
| Inventari | ✅ Complet | Items, fotos, cost/hora, bundles |
| Sales Ops | ✅ Complet | SLA, seqüències, auditoria, plans |
| Post-event | ✅ Complet | 3 passos, informes, surveys, feedback |
| Analítica | ✅ Complet | GA4, Ads, KPIs operatius |
| Configuració | ✅ Complet | Empresa, Holded, integracions, plantilles |
| Canvas | ✅ Complet | Generador imatges promo |
| Crons (6) | ✅ Complet | Comercial, fuel, invoices, pricing, post-event, reviews-sync + pàgina monitoratge |

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
- `/admin/inbox` — Safata IMAP
- `/admin/inbox/compose` — Redactar email
- `/admin/inbox/settings` — Config IMAP
- `/admin/mensajes` — Missatges/seqüències
- `/admin/presupuestos` — Editor PDF pressupostos
- `/admin/sales-ops` — Panell comercial
- `/admin/post-event` — Hub post-event
- `/admin/post-event/reports` — Informes interns
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
- `/admin/economia` — Panell finances
- `/admin/analytics` — Analítica (GA4, Ads)
- `/admin/rentabilidad` — Config rendibilitat

### Contingut
- `/admin/blog` — Blog
- `/admin/faq` — FAQ
- `/admin/text-manager` — Textos web
- `/admin/google-reviews` — Ressenyes Google
- `/admin/ressenyes` — Testimonis

### Legal
- `/admin/privacy` — Privacitat RGPD (KPIs, ARCO, audit)

### Scripts i eines
- `/admin/scripts` — Catàleg visual de 25+ scripts (seed/sync/check/report/fix/audit)

### Configuració
- `/admin/settings` — Hub configuració
- `/admin/settings/company` — Empresa + Holded
- `/admin/settings/integrations` — Integracions
- `/admin/settings/quotes` — Plantilla pressupostos
- `/admin/settings/notifications` — Notificacions
- `/admin/features` — Feature flags
- `/admin/coverage` — Cobertura
- `/admin/stats` — Estadístiques web
- `/admin/css-manager` — Tema CSS
- `/admin/canvas` — Generador imatges
- `/admin/mapa` — Mapa cobertura
- `/admin/theme` — Editor tema

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

- `costEngine.ts` — Font única veritat marges/costos
- `commercialScoring.ts` — Score + band leads
- `cashFlowForecast.ts` — Projecció tresoreria
- `pipelineForecast.ts` — Previsió vendes
- `postEventEmailService.ts` — Emails post-event
- `contractService.ts` — Contractes PDF
- `holdedService.ts` — Facturació Holded
- `fuelReferenceService.ts` — MITECO → cost/km
- `paymentReminderService.ts` — Recordatoris pagament
- `slaAutomationService.ts` — SLA 24h

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

## Full de ruta v2 — "La Millor Web del Món"

### FASE 1 — Impacte visual (web pública) 🎬
> Que qualsevol que entri digui "uau"

| # | Tasca | Fitxer principal | Estat |
|---|-------|-----------------|-------|
| P1 | **Hero cinematogràfic** — typewriter lletra per lletra, 1 CTA únic, entrada seqüencial badge→títol→sub→CTA→proof | `HeroElegant.tsx` | ❌ |
| P3 | **Portfolio cinematogràfic** — scroll horitzontal desktop, stories per event (foto+vídeo+testimoni+xifres), parallax | `PortfolioShowcase.tsx` | ❌ |
| P4 | **Comptadors dinàmics** — connectats a BD real, API `/api/public/stats` amb cache 1h | `StatsSection.tsx` | ❌ |

### FASE 2 — Conversió (configurador + urgència) 🎯
> Convertir visites en leads qualificats

| # | Tasca | Fitxer principal | Estat |
|---|-------|-----------------|-------|
| P2 | **Configurador amb ambient** — canvi colors/imatges per tipus, disponibilitat real integrada, preu persistent visible | `configurador/client.tsx` | ❌ |
| P5 | **Social pressure + countdown** — "X persones mirant", countdown early-bird, "queden N dissabtes" | `CalendarioUrgencia.tsx` | ❌ |

### FASE 3 — Eines de negoci noves 💰
> Funcionalitats que fan guanyar diners

| # | Tasca | Fitxer principal | Estat |
|---|-------|-----------------|-------|
| F1 | **Col·laboradors** — Model Prisma, CRUD admin, comissions (model net o descompte), integració costEngine, pressupost col·lab, report | `admin/collaborators/` | ❌ |
| F2 | **Configurador de costos D&D** — drag & drop components (DJ/hora, altaveu, llum...), cost real des inventari, marge suggerit, guardar + PDF | `admin/cost-calculator/` | ❌ |

### FASE 4 — Admin intel·ligent 🧠
> L'admin "parla" i anticipa

| # | Tasca | Fitxer principal | Estat |
|---|-------|-----------------|-------|
| A1 | **Insights narratius** — textos interpretatius al dashboard ("3 leads calents sense resposta"), comparativa setmanal, widget meteo | `admin/page.tsx` | ❌ |
| A5 | **Timeline comunicació unificat** — un sol fil cronològic per client (email+WhatsApp+notes+trucades) | `UnifiedTimeline.tsx` | ❌ |
| A6 | **Auto-triggers** — pressupost acceptat→contracte auto, welcome email immediat, checklist pre-event per tipus | `automationTriggers.ts` | ❌ |

### Detall: F1 — Col·laboradors

**Problema:** Treballem amb col·laboradors que revenen els nostres serveis. Dos models possibles:
- **Model A (Preu net + comissió):** Donem el nostre preu, el col·laborador afegeix la seva comissió. Transparent, però no controlem PVP final.
- **Model B (Descompte col·laborador):** Li fem un 10% menys, ell s'emporta el 10%. Controlem PVP, menys marge nostre.

**Implementació:**
- Model Prisma: `Collaborator` (nom, email, tlf, % comissió, model A/B, actiu) + `CollaboratorBooking` (relació + comissió + import)
- Pàgina admin `/admin/collaborators` amb CRUD + reserves + KPIs
- Integració costEngine: marge NET descomptant comissió
- Pressupost PDF versió col·laborador
- Report: facturació directa vs via col·laboradors

### Detall: F2 — Configurador de costos personalitzat

**Problema:** Ens demanen pressupostos a mida que no encaixen en cap pack. Ex: "DJ 3h sense altaveus", "Només il·luminació 5h". Cal saber cost real i marge ABANS de donar preu.

**Implementació:**
- Pàgina admin `/admin/cost-calculator`
- Components arrossegables: DJ (€/hora), altaveu (€/unitat), llum (€/unitat), cabina foto, transport (€/km), tècnic extra, hores extres
- Cost de cada component tret de l'inventari (amortització real + tarifa horària)
- Sumatori temps real: cost total, preu suggerit (marge configurable), marge brut/net
- Guardar com a pressupost personalitzat → generar PDF → enviar client
