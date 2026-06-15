# Esquema absolut d'Òrbita Events — radiografia de cables i funcions

> **Composició/diagrama de TOT** (v0, generat per extracció real del codi 2026-06-15). Imperfecte a propòsit: l'objectiu ara és **tenir-ho tot plasmat i ajuntat**; ja ho afinarem quan ho tinguem clar. Complementa `docs/admin-organisme-atles.md` (narratiu) amb el **mapa elèctric** real: cada òrgan, la seva alçada, prioritat, temps i funció, i cada cable (nav + API + servei).

## Llegenda
- **Alçada** = nivell jeràrquic: **H1** nucli operatiu diari · **H2** comercial/producte · **H3** eines/sistema/contingut.
- **Prioritat** = impacte de negoci: 🔴 alta · 🟠 mitjana · ⚪ baixa.
- **Temps** = freqüència d'ús: ⏱️ diari · 📅 setmanal · 🗓️ puntual.
- **Eix** = conversió / execució / cobrament / recurrència / sistema.

---

## 1. Diagrama del flux vital (les artèries)

```
                          ┌─────────────────────────── WEB PÚBLIC (72 pàgines) ───────────────────────────┐
                          │  landings SEO municipi · configurador · contacto · reservar · portal/[token]   │
                          └───────────────────────────────────┬───────────────────────────────────────────┘
                                                               │ app/api/** (captació)
                                                               ▼
   ┌────────────┐    ┌──────────────┐    ┌───────────────────┐    ┌────────────┐    ┌───────────┐    ┌────────────┐
   │   LEADS    │───▶│  FITXA LEAD  │───▶│ DOSSIER/PRESSUPOST │───▶│  RESERVA   │───▶│  CLIENT   │───▶│ POST-EVENT │
   │ (Temporada)│    │  («el bolo») │    │    (proposta)      │    │ (cobrament)│    │   (360)   │    │ + REVIEWS  │
   └─────┬──────┘    └──────┬───────┘    └─────────┬─────────┘    └─────┬──────┘    └─────┬─────┘    └──────┬─────┘
         │                  │                      │                    │                 │                 │
         └───────── SAFATA (IMAP) ◀────────────────┴── comunicació ─────┴─────────────────┘                 │
                                                                        │                                   │
                                          CUADRANT / CALENDARI / CAPACITAT (execució de camp) ◀──────────────┘
```
*(Estat dels cables: vegeu §4–§5. Alguns són forts, d'altres falten o estan fluixos.)*

---

## 2. Taula mestra d'òrgans (alçada · prioritat · temps · funció)

### Grup AGENDA → hauria de dir-se **COMERCIAL** (nucli del negoci)
| Òrgan | Ruta | H | Prio | Temps | Funció |
|---|---|---|---|---|---|
| Temporada (Leads) | `/admin/leads` | H1 | 🔴 | ⏱️ | Pipeline de consultes; calendari de caps de setmana; conversió |
| Fitxa de lead | `/admin/leads/[id]` | H1 | 🔴 | ⏱️ | «El bolo»: configurador, marge real, proposta |
| Reserves | `/admin/bookings` (+`[id]`,`new`) | H1 | 🔴 | ⏱️ | Execució, cobrament, marge per esdeveniment |
| Dossiers | `/admin/dossiers` | H2 | 🔴 | 📅 | Dossier editorial de propostes (✅ TANCAT CHARLIE) |
| Clients | `/admin/clientes` (+`[id]`) | H1 | 🔴 | ⏱️ | Hub 360; recurrència |
| Pressupostos | `/admin/presupuestos` (+`[id]`) | H2 | 🔴 | 📅 | Propostes vinculants |
| Arxiu | `/admin/leads/arxiu` | H3 | ⚪ | 🗓️ | Històric de leads tancats |

### Grup OPERATIVA (execució de camp)
| Òrgan | Ruta | H | Prio | Temps | Funció |
|---|---|---|---|---|---|
| Tasques | `/admin/tasks` (+`new`) | H1 | 🟠 | ⏱️ | Feina pendent (kanban) |
| Inventari | `/admin/inventory` (+`[id]`,`new`) | H2 | 🟠 | 📅 | Equip tècnic, estat, disponibilitat |
| Calendari | `/admin/calendario` (+`capacity`) | H1 | 🔴 | ⏱️ | Càrrega per dia/setmana/mes |
| Cuadrant | `/admin/cuadrant` (+`repartiment`) | H2 | 🟠 | 📅 | Qui treballa cada bolo + repartiment |

### Grup CATÀLEG (què venem)
| Òrgan | Ruta | H | Prio | Temps | Funció |
|---|---|---|---|---|---|
| Packs | `/admin/packs` (+`[id]`,`extras`,`new`) | H2 | 🟠 | 🗓️ | Definició comercial dels packs |
| Pricing | `/admin/pricing` | H2 | 🟠 | 🗓️ | Criteris de preu |
| Catàleg | `/admin/catalog` | H3 | ⚪ | 🗓️ | Oferta global (packs+inventari+preus) |
| Descomptes | `/admin/discount-codes` | H3 | ⚪ | 🗓️ | Codis promocionals |
| Qüestionaris | `/admin/questionnaires` (+`[id]`,`new`) | H2 | 🟠 | 📅 | Pre-event al portal |

### Grup WEB / CONTINGUT
| Òrgan | Ruta | H | Prio | Temps | Funció |
|---|---|---|---|---|---|
| Portfolio | `/admin/portfolio` | H3 | 🟠 | 🗓️ | Aparador visual |
| Blog | `/admin/blog` (+`new`,`edit/[id]`) | H3 | ⚪ | 🗓️ | Contingut editorial/SEO |
| Ressenyes | `/admin/ressenyes` | H3 | 🟠 | 📅 | Testimonis interns |
| Ressenyes Google | `/admin/google-reviews` | H3 | 🟠 | 📅 | Prova social externa |
| Social | `/admin/social` | H3 | ⚪ | 📅 | Xarxes socials |

### Grup SISTEMA
| Òrgan | Ruta | H | Prio | Temps | Funció |
|---|---|---|---|---|---|
| Finances | `/admin/economia` | H2 | 🔴 | 📅 | Cobraments, rendibilitat, tresoreria |
| Configuració | `/admin/settings` (+`company`,`hero`,`integrations`,`notifications`,`quotes`) | H3 | ⚪ | 🗓️ | Configuració base |
| Studio | `/admin/studio` | H3 | 🟠 | 🗓️ | **Font de veritat visual (mostrari de la sèrie)** |
| Manual | `/admin/manual` · `docs/protocol` | H3 | ⚪ | 🗓️ | Guia interna |
| Atles · Full de ruta | `/admin/docs/organisme` · `/full-de-ruta` | H3 | 🟠 | 🗓️ | Mapa i visió del sistema |

### Òrgans FORA del sidebar (existeixen però no enllaçats al nav principal — cable solt)
Safata `/admin/inbox` (+`compose`,`settings`) 🔴 ⏱️ · Sales Ops `/admin/sales-ops` · Reactivació `/admin/clientes/reactivation` · Reengagement `/admin/leads/reengagement` · Referrals `/admin/clientes/referrals` · Campanyes `/admin/campaigns` · Intake `/admin/intake` · Quick-create `/admin/quick-create` · Col·laboradors `/admin/collaborators` (+`[id]`) · Post-event `/admin/post-event` (+`feedback`,`surveys`,`reports`,`playbook`) · Analítica `/admin/analytics` · Reporting `/admin/reporting` · Stats `/admin/stats` · Cost-calculator `/admin/cost-calculator` · Salut `/admin/salut` · FAQ `/admin/faq` · Text-manager · Image-manager · Css-manager · Canvas · Privacy · Coverage · Features · Activity · Crons · Scripts · Marketing · Mensajes.
> ⚠️ **Cable solt greu:** la Safata (`/admin/inbox`, H1, ús diari) i Col·laboradors NO són al sidebar principal (NAV_GROUPS). S'hi arriba per enllaços interns o URL. Vegeu D9.

---

## 3. Cables de NAVEGACIÓ (qui enllaça amb qui — top destins reals)
`leads ×15 · inventory ×10 · bookings ×10 · tasks ×8 · packs ×8 · calendario ×8 · bookings/new ×6 · social ×5 · reporting ×4 · presupuestos ×4 · intake ×4 · emails ×4 · clientes ×4 · salut ×3 · questionnaires ×3 · pricing ×3 · inbox ×3 · faq ×3 · blog ×3 · analytics ×3` … (la resta, 1–2 cada un).
> Lectura: **leads/bookings/clientes** són els nodes més connectats (el cor). `inventory` molt enllaçat (cablejat des de packs/reserves).

## 4. Cables UI → API (quins endpoints es criden — top)
`bookings ×40 · leads ×32 · inbox/messages ×13 · proposals ×11 · customers ×10 · portfolio/media ×8 · dossiers ×7 · portfolio/events ×6 · image-manager ×6 · collaborators ×6 · availability ×6 · maps/distance ×5 · inbox/settings ×5 · blog ×5` … (239 rutes API en total).

## 5. FUNCIONS de negoci (serveis) i la seva alçada
> «Cada funció i la seva altura»: capa CORE (veritat del domini, alçada màxima — tot hi depèn) vs capa SUPORT.

**CORE (H1 — la veritat; no es dupliquen mai):**
- `costEngine` ×6 — marge real per bolo (`computeBookingFinancialSummary`). **Tota decisió econòmica hi passa.**
- `travelCost` ×7 — cost de desplaçament per trams.
- `profitabilityService` ×7 — config de rendibilitat.
- `packPricingHealth` ×7 — salut de preus dels packs.
- `fuelReferenceService` — cost de combustible per km.

**SUPORT (H2 — capacitats especialitzades):**
- Pipeline/forecast: `pipelineForecast`, `operationalForecastService`, `commercialScoring`, `seasonCalendarService`.
- Comercial: `quoteTemplateService`, `dossierService`, `leadInsightsService`, `leadLossAnalyticsService`.
- Recurrència: `reactivationService`, `leadReengagementService`, `referralsService`, `customerInsightsService`.
- Operativa: `questionnaireService`, `weatherService`, `timelineQueryService`, `crewScheduleService`.
- Sistema: `protocolCanvisService`, `protocolValidationsService`, `dailyBriefService`, `operationalPulseService`.
> 221 serveis en total. Aquí els més connectats; la resta s'inventariaran a l'atles v2.

---

## 6. Cables solts / trencats detectats (per arreglar)
1. **D9 — Navegació duplicada:** `layout.tsx::NAV_GROUPS` (sidebar) vs `nav-items.ts` (cercador). Dues fonts → no monocapa. **Falta: una sola font canònica.**
2. **Safata i Col·laboradors fora del sidebar** tot i ser H1/ús diari → cable solt.
3. **Grup «Agenda» mal anomenat:** conté tot el comercial → hauria de dir-se «Comercial».
4. **8 duplicacions D1–D8** (de l'atles) + D9 = 9 capacitats repartides.
5. **`getGroupForPath`** (layout) no mapeja `/admin/docs/*` → cap grup actiu en aquestes pàgines.

> Aquest document és la base. El proper pas és ajuntar-ho: una font de nav única, reagrupar pel flux, i connectar els cables solts.
