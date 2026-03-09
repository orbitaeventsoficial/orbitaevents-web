# Estat de l'Admin Òrbita Events — Referència Permanent

> Última actualització: 2026-03-09
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
| Clients Hub | ✅ Molt complet | 9 panells, timeline, KPIs |
| Calendari | ⚠️ Parcial | Vista mensual + bloqueig dies inline, falta vista setmanal |
| Tasques | ✅ Complet | Kanban + llista, checklist diari |
| Emails | ✅ Complet | Auto + IMAP + post-event |
| Finances | ✅ Molt complet | Tresoreria, marge, CAC, MITECO, Holded |
| Pressupostos | ✅ Complet | Editor PDF + llistat amb filtres, cerca, accions, stats |
| Packs | ✅ Complet | Motor preus, health, extras |
| Inventari | ✅ Complet | Items, fotos, cost/hora, bundles |
| Sales Ops | ✅ Complet | SLA, seqüències, auditoria, plans |
| Post-event | ✅ Complet | 3 passos, informes, surveys, feedback |
| Analítica | ✅ Complet | GA4, Ads, KPIs operatius |
| Configuració | ✅ Complet | Empresa, Holded, integracions, plantilles |
| Canvas | ✅ Complet | Generador imatges promo |
| Crons (5) | ✅ Complet | Comercial, fuel, invoices, pricing, post-event |

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

## Què falta (full de ruta)

### Prioritat ALTA (funcionalitat trencada o absent)
1. ~~**Llistat pressupostos millorat**~~ ✅ Fet (2026-03-09)
2. **Calendari vista setmanal** — ara només mensual
3. **Templates email editables** — ara hardcoded al codi
4. **Configuració IMAP des de l'admin** — ara cal tocar Railway

### Prioritat MITJANA (millores significatives)
5. ~~**Gestió disponibilitat**~~ ✅ Fet (2026-03-09) — bloquejar/desbloquejar inline al calendari
6. **WhatsApp integrat** — historial visible a l'admin
7. **Logs de crons visuals** — ara només al tauler parcialment
8. ~~**Aprovació testimonis a la nav**~~ ✅ Fet (2026-03-09)

### Prioritat BAIXA (nice to have)
9. **Multi-usuari** — rols i permisos
10. **Editor visual emails** — drag & drop
11. **Vista diària calendari**
12. **Privacitat GDPR UI** — API existeix sense pàgina admin
