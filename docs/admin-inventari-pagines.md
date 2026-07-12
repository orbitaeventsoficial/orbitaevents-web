# Inventari de pàgines admin — Frankenstein

> Referència per a la migració del disseny (lab → admin real).
> Ordre: pàgines de negoci primer, sistema al final.
> Estat: 🔴 old (disseny original) · 🟡 en curs · 🟢 migrada al nou disseny
>
> **Aquest fitxer és el mapa canònic de la migració**. Quan una pàgina passa a 🟡 o 🟢, ha de portar a la columna "Nota" la referència explícita al `Canvi #NNN` que ho documenta. El guard `qa:admin-frankenstein-migration` valida l'alineament protocol ↔ inventari. Vegeu també `§Migració del Frankenstein` al `docs/admin-protocol.md`.

---

## Core (pipeline i decisions)

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Leads | `/admin/leads` | Calendari temporada, pipeline kanban, focus zone, fitxa lead | 🟢 | **TANCAT CHARLIE** — revisada pel propietari. Lab #777 + servei #780 + shell #781 + pàgina #782 + dades reals #783 + canvi estat #784 + drag #785 + delete #786 + badge LOST #787 + WhatsApp/correu #788 + fix LOST #789 + enriquit #790 + arxiu #791-#793 + meteo #794 + prioritat inline #796 + reconstrucció Agenda #846 + fitxa interna recuperada #848 + forecast ponderat #1020. |
| Lead fitxa | `/admin/leads/[id]` | Cabina comercial, bolo, economia, documents, historial | 🟢 | **TANCAT CHARLIE** — revisada pel propietari sobre el lead Alba. Canvi #1759 protegeix la ruta; base visual #810 + remat Manolo #1755-#1758. Excepció propietari #1833: Crear/Previsualitzar dossier passen pel generador canònic de `/admin/dossiers`. |
| Lead re-engagement | `/admin/leads/reengagement` | Candidats a recuperar, WhatsApp/email | 🟢 | Canvi #850 — `reengagement.css`, prefix `lr__`, `AdminPage` eliminat, `mailto:` substituït per `buildLeadComposeHref` |
| Clients (llista) | `/admin/clientes` | Llista, segments, filtres | 🟢 | Migració inicial #811; canonització #1273 (`AdminPage`/`ap-*`, `clientes.css` esborrat). Fitxa forense FETA #1761; links entrants `?segment=` connectats al #1762. |
| Client fitxa 360 | `/admin/clientes/[id]` | Hub relacional, timeline, comunicacions, tasques | 🟢 | Canvi #812 — `customer-hub.css`, prefix `ch__`, cap AdminPage, cap ap-* |
| Reactivació | `/admin/clientes/reactivation` | Candidats per reactivar | 🔴 | Fitxa forense FETA #1210 |
| Referrals | `/admin/clientes/referrals` | Top referrers, candidats | 🔴 | Fitxa forense FETA #1760; migració visual encara pendent. La reauditoria detecta que el codi viu no correspon del tot al #1140: encara usa `AdminPage`/`ap-*`/utilitats i no hi ha `referrals.css`. |
| Reserves (llista) | `/admin/bookings` | Absorbida per **Agenda** (#844). El workspace `/admin/leads` mostra leads+reserves+calendari fusionats amb vistes Calendari/Pipeline/Llista. | 🟢 | Canvi #836-#844 — fusió Leads+Reserves+Calendari sota *Agenda*. URL antiga segueix accessible directament. |
| Reserva detall | `/admin/bookings/[id]` | Fitxa operativa (cobraments, contracte, inventari, checklist, factura, post-event). | 🟢 | Canvi #849 — `booking-detail.css`, prefix `bd__`, `AdminPage` eliminat, `BookingSectionNav` amb `bd__secnav`. Sub-components conservats. |
| Nova reserva | `/admin/bookings/new` | Formulari ràpid pre-omplit des d'un lead. | 🟢 | Canvi #842+#843 — migrat a Brass & Obsidian (`nb-design.css`, `nb__*`), packs amb prefix de servei, extras humanitzats. |
| Calendari | `/admin/calendario` | Absorbit per **Agenda** (#844) — el calendari de caps de setmana de leads+reserves substitueix la vista vella. | 🟢 | URL antiga accessible per compatibilitat. |
| Calendari capacitat | `/admin/calendario/capacity` | Forecast setmanal — pendent decidir si val la pena recuperar-lo dins Agenda. | 🔴 | |
| Tasques | `/admin/tasks` | Llista/kanban, cues, automatismes | 🟢 | Canvi #868 — `tasks.css`, prefix `tk__`, `AdminPage` eliminat, `ap-*` eliminat, queue banner amb data attrs, kanban amb CSS `data-status` |
| Nova tasca | `/admin/tasks/new` | Formulari amb assistència | 🟢 | Canvi #868 — `tk__form-*`, `AdminPage` eliminat, inputs amb id/label, `aria-label` al select |
| Inbox | `/admin/inbox` | Safata, missatges, follow-ups | 🟢 | Canvi #801 — `inbox.css`, prefix `ix-`, cap AdminPage |
| Compose | `/admin/inbox/compose` | Redactor d'email | 🟢 | Canvi #801 — `cx-` prefix, cap AdminPage, cap ap-* |
| Inbox settings | `/admin/inbox/settings` | Configuració IMAP | 🟢 | Canvi #802 — ix__settings*, cap AdminPage, cap ap-* |

## Comercial

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Pressupostos | `/admin/presupuestos` | Llista de proposals | 🟡 | Canvi #1021 — `presupuestos.css`, prefix `pr__`, `AdminPage` eliminat de llista/editor/detall; cabina comercial i llista responsiva reordenades. Pendent validació humana per `TANCAT CHARLIE`. |
| Pressupost detall | `/admin/presupuestos/[id]` | Detall, PDF Studio | 🟡 | Canvi #1021 — shell de detall en pantalla negra amb `pr__*`; Canvi #1029 — fitxa forense `FETA` i CSRF blindat en enviament. Editor PDF intern pendent de passada visual pròpia (`PresupuestoPdfStudio`/`StudioPreview`). |
| Sales Ops | `/admin/sales-ops` | SLA, seqüències, automatismes | 🔴 | |
| Intake ràpid | `/admin/intake` | Formulari de nova entrada | 🟢 | Canvi #809 — `intake.css`, prefix `ni-`, extracció IA Gemini, "Nou lead" tret del nav |
| Quick create | `/admin/quick-create` | Creació assistida lead/pressupost | 🔴 | |
| Marketing | `/admin/marketing` | Hub de captació, canals, gaps | 🔴 | Fitxa forense FETA #1207; no migrada visualment |
| Campanyes | `/admin/campaigns` | Campanyes de reactivació | 🔴 | Fitxa forense FETA #1206; no migrada visualment |

## Financer

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Economia | `/admin/economia` | Rentabilitat, KPIs financers, export | 🔴 | Fitxa #1789; mojibake #1788; permisos #1790; feedback #1791; tabs #1792; icones secció #1793; rendibilitat mòbil #1794; tresoreria mòbil #1795; previsions mòbil #1796; config packs #1797. |
| Pricing | `/admin/pricing` | Configuració de preus | 🔴 | Fitxa #1801; permisos API #1799; icones #1802; feedback #1803; tarifes #1804; pendent densitat abans de validar. |
| Cost calculator | `/admin/cost-calculator` | Simulador de costos | 🔴 | |
| Analytics | `/admin/analytics` | Reporting executiu | 🔴 | Fitxa #1832; GA4 viu en captura, Google Ads pendent de config externa; tendència GA4 buida/sparse resolta #1835. |
| Reporting | `/admin/reporting` | Reports addicionals | 🔴 | |

## Operatiu

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Inventari (llista) | `/admin/inventory` | Equipament, salut, packs | 🔴 | |
| Inventari detall | `/admin/inventory/[id]` | Fitxa d'equipament | 🔴 | |
| Nou inventari | `/admin/inventory/new` | Formulari | 🔴 | |
| Post-event | `/admin/post-event` | Hub post-event | 🔴 | |
| Post-event playbook | `/admin/post-event/playbook` | Checklist post-event | 🔴 | |
| Post-event reports | `/admin/post-event/reports` | Informes | 🔴 | |
| Nou report | `/admin/post-event/reports/new` | Formulari report | 🔴 | |
| Enquestes | `/admin/post-event/surveys` | Feedback clients | 🔴 | |
| Post-event feedback | `/admin/post-event/feedback` | Respostes | 🔴 | |
| Collaboradors | `/admin/collaborators` | Recursos externs | 🔴 | |

## Growth

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Portfolio | `/admin/portfolio` | Gestió d'imatges i events | 🔴 | |
| Blog (llista) | `/admin/blog` | Entrades de blog | 🔴 | |
| Blog edició | `/admin/blog/edit/[id]` | Editor | 🔴 | |
| Nou blog | `/admin/blog/new` | Nova entrada | 🔴 | |
| Google Reviews | `/admin/google-reviews` | Ressenyes Google | 🔴 | |
| Ressenyes internes | `/admin/ressenyes` | Testimonis | 🔴 | |
| Image Manager | `/admin/image-manager` | Assets visuals | 🔴 | |
| Canvas | `/admin/canvas` | Creativitats | 🔴 | |
| Social | `/admin/social` | Xarxes socials | 🔴 | Fitxa forense FETA #1209 |

## Catàleg

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Packs (llista) | `/admin/packs` | Gestió de packs | 🔴 | Fitxa #1805; permisos #1800; quick editor #1806; icones #1807; densitat/card pendent. |
| Pack detall | `/admin/packs/[id]` | Editor de pack | 🔴 | Fitxa #1808; permisos API #1800; `?tab=content` #1809, tabs #1810, feedback #1811 i labels #1812-#1814 resolts; visual/densitat pendent. |
| Nou pack | `/admin/packs/new` | Formulari | 🔴 | Fitxa #1816; formulari #1817 (`PACK_SERVICE_OPTIONS`, feedback accessible, CTA i `price` resolts); permisos API #1800; visual desktop mínima pendent. |
| Extres de packs | `/admin/packs/extras` | Gestió d'extres | 🔴 | Fitxa #1818; permisos API #1819; claus i18n #1820 i feedback/botons #1821 resolts; visual/densitat pendent. |
| Catàleg | `/admin/catalog` | Vista catàleg | 🔴 | Fitxa #1822; hub viu sense mutacions; semàfor visual #1823 resolt; densitat pendent. |
| Codis descompte | `/admin/discount-codes` | Gestió de codis | 🔴 | Fitxa #1824; P1 toggle/API, permisos `read/mutate`, mojibake euro i feedback accessible resolts #1825; visual/densitat pendent. |

## Client portal i comunicació

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Plantilles email | `/admin/email-templates` | Llista de plantilles | 🔴 | |
| Plantilla detall | `/admin/email-templates/[slug]` | Editor de plantilla | 🔴 | |
| Emails | `/admin/emails` | Automatismes d'email | 🔴 | |
| Missatges | `/admin/mensajes` | Missatges directes | 🔴 | |
| Qüestionaris | `/admin/questionnaires` | Formularis client | 🔴 | |
| Qüestionari detall | `/admin/questionnaires/[id]` | Editor | 🔴 | |
| Nou qüestionari | `/admin/questionnaires/new` | Formulari | 🔴 | |
| Privacitat | `/admin/privacy` | RGPD, consentiments, ARCO | 🔴 | |
| FAQ | `/admin/faq` | Preguntes freqüents | 🔴 | |
| FAQ detall | `/admin/faq/[id]` | Edició | 🔴 | |
| Nova FAQ | `/admin/faq/new` | Nova entrada | 🔴 | |

## Sistema

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Dashboard (/) | `/admin` | Avui / Copilot executiu | 🔴 | Fitxa òrgan Comandament FETA #1156; Avui consumeix NBA, dailyBrief, economia, post-event, dossiers #1844, contractes pendents #1845 i pressupostos draft #1846. Pendent validació visual humana abans de 🟢. |
| Salut | `/admin/salut` | Diagnòstic del sistema | 🔴 | |
| Settings | `/admin/settings` | Configuració general | 🔴 | |
| Settings empresa | `/admin/settings/company` | Dades empresa | 🔴 | |
| Settings hero | `/admin/settings/hero` | Hero video | 🔴 | |
| Settings integraciones | `/admin/settings/integrations` | APIs externes | 🔴 | |
| Settings notificaciones | `/admin/settings/notifications` | Alertes i notificacions | 🔴 | |
| Settings pressupostos | `/admin/settings/quotes` | Config de pressupostos | 🔴 | |
| Crons | `/admin/crons` | Monitor de crons | 🔴 | Fitxa forense FETA #1767; monitor read-only sobre `ADMIN_CRON_PREFIXES` + `Setting.*lastRun`. Health #1768, route test #1769 i error persistent #1770 resolts; pendent validació visual. |
| Stats | `/admin/stats` | Estadístiques dev | 🔴 | Fitxa forense FETA #1783; governa fallbacks de stats públiques via `Setting(category=stats)`. Pont admin→públic #1782 i icones #1784 resolts; pendent validació visual. |
| Coverage | `/admin/coverage` | Cobertura territorial pública | 🔴 | Fitxa forense FETA #1764; configura `coverage.areas` i alimenta `/api/public/coverage`. Feedback d'errors `{ok:false}` resolt #1765; busy remove/toggle resolt #1766. |
| Scripts | `/admin/scripts` | Scripts manuals | 🔴 | Fitxa forense FETA #1774; catàleg/copiador de comandes, no executor. Risc #1775 i guard fitxers #1776 resolts; pendent validació visual. |
| CSS Manager | `/admin/css-manager` | CSS personalitzat | 🔴 | Fitxa forense FETA #1771; editor de CSS viu global admin. Live/persistent sanititzat #1772 i error inicial #1773 resolts; pendent validació visual. |
| Text Manager | `/admin/text-manager` | Textos personalitzats | 🔴 | Fitxa forense FETA #1779; editor PRO sobre `messages/*.json` + overrides `Translation`. GET #1780 i alertes #1781 resolts; pendent validació visual. |
| Features | `/admin/features` | Feature flags | 🔴 | Fitxa forense FETA #1777; toggles sobre `ADMIN_FEATURE_DEFINITIONS` + `Setting` BOOLEAN. Icones visuals resoltes #1778; pendent consumidor públic real abans de validar. |
| Activity | `/admin/activity` | Log d'activitat | 🔴 | Fitxa forense FETA #1763; visor read-only d'`adminLog` via `fetchCanonicalAdminActivityPage()`. Migració/validació visual pendent. |
| Manual | `/admin/manual` | Manual operatiu | 🔴 | Fitxa forense FETA #1785; memòria operativa server sobre `adminManual.ts` + §9 protocol. Sense mutacions; pendent validació visual. |
| Protocol | `/admin/docs/protocol` | Protocol de producte | 🔴 | Fitxa forense FETA #1787; viewer normatiu sobre `docs/admin-protocol.md` + `Setting(protocol.canviValidations)`. Toggle validació blindat #1786; API només accepta Canvis existents #1834; pendent validació visual. |
| Master Òrbita | `/admin/docs/master` | Porta modular Zenit | 🔴 | Fitxa #1829; consola viva sobre `masterAtlasService` + atles elèctric + auditoria visual; validació visual/priorització pendents. |
| Atles elèctric | `/admin/docs/electric-atlas` | Escàner del repo real | 🔴 | Fitxa #1830; `repoElectricAtlasService` indexa fitxers, símbols, cables, rutes, models, fluxos i glossari; validació visual tabs amples pendent. |
| Atles de l'organisme | `/admin/docs/organisme` | Mapa front/back | 🔴 | Fitxa #1828; viewer read-only sobre `docs/admin-organisme-atles.md`; taules mòbil apilades #1831; cobertura v1 API/serveis i validació humana pendents. |
| Esquema absolut | `/admin/docs/esquema` | Radiografia de cables | 🔴 | Fitxa #1826; viewer read-only sobre `docs/admin-esquema-absolut.md`; taules mòbil apilades #1831; validació visual humana pendent. |
| Full de ruta | `/admin/docs/full-de-ruta` | Zenit de producte | 🔴 | Fitxa #1827; viewer read-only sobre `docs/producte-zenit-full-de-ruta.md`; taules mòbil apilades #1831; validació visual humana pendent. |
| Marketing Hub | `/admin/marketing` | Hub de captació | 🔴 | Fitxa forense FETA #1207; no migrada visualment |

---

## Ordre de migració recomanat

### Fase 1 — Nucli comercial (impacte màxim)
1. **Leads** — calendari temporada + pipeline + focus ← comença aquí
2. Clients (llista + fitxa 360)
3. Reserves (llista + cabina)
4. Tasques
5. Inbox

### Fase 2 — Comercial i finances
6. Pressupostos
7. Sales Ops / Intake
8. Economia / Pricing

### Fase 3 — Growth i catàleg
9. Packs / Inventari
10. Portfolio / Blog / Social

### Fase 4 — Sistema
11. Dashboard (Control Room)
12. Settings / Crons / Sistema
