# Inventari de pàgines admin — Frankenstein

> Referència per a la migració del disseny (lab → admin real).
> Ordre: pàgines de negoci primer, sistema al final.
> Estat: 🔴 old (disseny original) · 🟡 en curs · 🟢 migrada al nou disseny
>
> **Aquest fitxer és el mapa canònic de la migració**. Quan una pàgina passa a 🟡 o 🟢, ha de portar a la columna "Nota" la referència explícita al `Canvi #NNN` que ho documenta. El guard `qa:admin-frankenstein-migration` valida l'alineament protocol ↔ inventari. Vegeu també `§Migració del Frankenstein` al `docs/protocol-producte-admin-ca.md`.

---

## Core (pipeline i decisions)

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Leads | `/admin/leads` | Calendari temporada, pipeline kanban, focus zone, fitxa lead | 🟡 | Lab #777 + servei #780 + shell #781 + pàgina #782 + dades reals #783 + canvi estat #784 + drag #785 + delete #786 + badge LOST #787 + WhatsApp/correu #788 + fix LOST #789 + enriquit #790 + arxiu #791-#793 + meteo #794 + prioritat inline #796. **7/8 funcions inventari leads tancades** (#5 suggeriments pendent decisió propietari) |
| Lead fitxa | `/admin/leads/[id]` | Timeline, tasques, documents, scoring, insights | 🔴 | |
| Lead re-engagement | `/admin/leads/reengagement` | Candidats a recuperar, WhatsApp/email | 🔴 | |
| Clients (llista) | `/admin/clientes` | Llista, segments, filtres | 🔴 | |
| Client fitxa 360 | `/admin/clientes/[id]` | Hub relacional, timeline, comunicacions, tasques | 🔴 | |
| Reactivació | `/admin/clientes/reactivation` | Candidats per reactivar | 🔴 | |
| Referrals | `/admin/clientes/referrals` | Top referrers, candidats | 🔴 | |
| Reserves (llista) | `/admin/bookings` | Llista, kanban, filtres | 🔴 | |
| Reserva detall | `/admin/bookings/[id]` | Cabina operativa, cobraments, checklist, inventari | 🔴 | |
| Nova reserva | `/admin/bookings/new` | Formulari ràpid | 🔴 | |
| Calendari | `/admin/calendario` | Calendari de capacitat | 🔴 | |
| Calendari capacitat | `/admin/calendario/capacity` | Forecast setmanal | 🔴 | |
| Tasques | `/admin/tasks` | Llista/kanban, cues, automatismes | 🔴 | |
| Nova tasca | `/admin/tasks/new` | Formulari amb assistència | 🔴 | |
| Inbox | `/admin/inbox` | Safata, missatges, follow-ups | 🟢 | Canvi #801 — `inbox.css`, prefix `ix-`, cap AdminPage |
| Compose | `/admin/inbox/compose` | Redactor d'email | 🟢 | Canvi #801 — `cx-` prefix, cap AdminPage, cap ap-* |
| Inbox settings | `/admin/inbox/settings` | Configuració IMAP | 🟢 | Canvi #802 — ix__settings*, cap AdminPage, cap ap-* |

## Comercial

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Pressupostos | `/admin/presupuestos` | Llista de proposals | 🔴 | |
| Pressupost detall | `/admin/presupuestos/[id]` | Detall, PDF Studio | 🔴 | |
| Sales Ops | `/admin/sales-ops` | SLA, seqüències, automatismes | 🔴 | |
| Intake ràpid | `/admin/intake` | Formulari de nova entrada | 🔴 | |
| Quick create | `/admin/quick-create` | Creació assistida lead/pressupost | 🔴 | |
| Marketing | `/admin/marketing` | Hub de captació, canals, gaps | 🔴 | |
| Campanyes | `/admin/campaigns` | Campanyes de reactivació | 🔴 | |

## Financer

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Economia | `/admin/economia` | Rentabilitat, KPIs financers, export | 🔴 | |
| Pricing | `/admin/pricing` | Configuració de preus | 🔴 | |
| Cost calculator | `/admin/cost-calculator` | Simulador de costos | 🔴 | |
| Analytics | `/admin/analytics` | Reporting executiu | 🔴 | |
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
| Social | `/admin/social` | Xarxes socials | 🔴 | |

## Catàleg

| Pàgina | Ruta | Contingut clau | Estat | Nota |
|---|---|---|---|---|
| Packs (llista) | `/admin/packs` | Gestió de packs | 🔴 | |
| Pack detall | `/admin/packs/[id]` | Editor de pack | 🔴 | |
| Nou pack | `/admin/packs/new` | Formulari | 🔴 | |
| Extres de packs | `/admin/packs/extras` | Gestió d'extres | 🔴 | |
| Catàleg | `/admin/catalog` | Vista catàleg | 🔴 | |
| Codis descompte | `/admin/discount-codes` | Gestió de codis | 🔴 | |

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
| Dashboard (/) | `/admin` | Control Room — overview | 🔴 | |
| Salut | `/admin/salut` | Diagnòstic del sistema | 🔴 | |
| Settings | `/admin/settings` | Configuració general | 🔴 | |
| Settings empresa | `/admin/settings/company` | Dades empresa | 🔴 | |
| Settings hero | `/admin/settings/hero` | Hero video | 🔴 | |
| Settings integraciones | `/admin/settings/integrations` | APIs externes | 🔴 | |
| Settings notificaciones | `/admin/settings/notifications` | Alertes i notificacions | 🔴 | |
| Settings pressupostos | `/admin/settings/quotes` | Config de pressupostos | 🔴 | |
| Crons | `/admin/crons` | Monitor de crons | 🔴 | |
| Stats | `/admin/stats` | Estadístiques dev | 🔴 | |
| Coverage | `/admin/coverage` | Cobertura de tests | 🔴 | |
| Scripts | `/admin/scripts` | Scripts manuals | 🔴 | |
| CSS Manager | `/admin/css-manager` | CSS personalitzat | 🔴 | |
| Text Manager | `/admin/text-manager` | Textos personalitzats | 🔴 | |
| Features | `/admin/features` | Feature flags | 🔴 | |
| Activity | `/admin/activity` | Log d'activitat | 🔴 | |
| Manual | `/admin/manual` | Manual operatiu | 🔴 | |
| Protocol | `/admin/docs/protocol` | Protocol de producte | 🔴 | |
| Marketing Hub | `/admin/marketing` | Hub de captació | 🔴 | |

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
