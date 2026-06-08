# Admin — Checklist gegant de migració (Frankenstein → Brass & Obsidian)

> Generat 2026-06-08. Font: `docs/admin-inventari-pagines.md` (mapa canònic) + pàgines 🟢 com a **referència de qualitat**.
> Objectiu: portar TOTA pàgina admin 🔴/🟡 al sistema visual canònic, igual de net que les ja fetes.
> Regla d'or: **l'admin NO inventa paleta** — consumeix tokens de `/admin/studio` (`orbita-tokens.css`). Vegeu `CLAUDE.md §Sistema visual admin`.

---

## 0. El PATRÓ (extret de les pàgines 🟢 — copia'l, no l'inventis)

Una pàgina està **🟢 migrada** quan compleix TOT això (mira `clientes/[id]` #812, `tasks` #868, `inbox` #801, `bookings/[id]` #849 com a exemples):

- [ ] **CSS propi de pàgina** amb prefix curt únic (`ch__`, `tk__`, `bd__`, `ix-`, `cl__`, `nb__`…). Només **layout/composició** (grid, gaps, posició, responsive).
- [ ] **`AdminPage` eliminat** com a wrapper visual (si la pàgina té chrome propi). Header/títol propis amb tokens.
- [ ] **`ap-*` eliminat** — res d'utilitaris genèrics heretats; tot consumeix tokens.
- [ ] **Zero hex/`style={{`/`rgba`** als `.tsx` (el hook `check-residue` ho vigila). Colors → `var(--ax-*)`/`var(--o-*)`.
- [ ] **Selector canònic CSS**: `html.admin-mode .prefix__classe { }` (sense `.admin-shell`).
- [ ] **Responsive** verificat a 375px / tablet / desktop (`@media` obligatori).
- [ ] **Accessibilitat**: `htmlFor`+`id`, `aria-label` a selects sense label i botons-icona, `scope="col"` a `<th>`, `min={0}` a inputs de preus.
- [ ] **Empty states** i **errors amb feedback** (`catch` + `console.error`/`toast.error`).
- [ ] **Monocapa**: cap catàleg/label/mapping local; tot de `lib/constants/*`.
- [ ] **Tancament**: nota `Canvi #NNN` a `admin-inventari-pagines.md` + entrada `admin-diary.md` + `§6`/`§9` del protocol + `ADMIN_CHANGE_COUNTER`.
- [ ] **Validació**: `pnpm run validate:core` + `pnpm build` (obligatori per `app/admin/**`) + reinici net del dev (matar node + esborrar `.next`).

> ⚠️ Cada pàgina = un canvi tancat i validat abans de passar a la següent. Res de deixar 10 pàgines a mitges.

---

## 1. Core — acabar el que està 🟡
- [ ] **Leads** `/admin/leads` (🟡) — funció #5 (suggeriments / focus zone com a botó-modal) pendent de decisió del propietari. És l'únic punt obert del nucli; la resta del core ja és 🟢.

---

## 2. Comercial (Fase 2 de l'ordre recomanat)
- [ ] **Pressupostos** `/admin/presupuestos` 🔴
- [ ] **Pressupost detall** `/admin/presupuestos/[id]` 🔴 (inclou PDF Studio)
- [ ] **Sales Ops** `/admin/sales-ops` 🔴 (SLA, seqüències, automatismes)
- [ ] **Quick create** `/admin/quick-create` 🔴
- [ ] **Marketing / Marketing Hub** `/admin/marketing` 🔴
- [ ] **Campanyes** `/admin/campaigns` 🔴
- (Intake `/admin/intake` ja 🟢 #809 — referència)

## 3. Financer
- [ ] **Economia** `/admin/economia` 🔴 (rendibilitat, KPIs, export)
- [ ] **Pricing** `/admin/pricing` 🔴
- [ ] **Cost calculator** `/admin/cost-calculator` 🔴
- [ ] **Analytics** `/admin/analytics` 🔴 (⚠️ té `EVENT_TYPE_LABELS` local — centralitzar en migrar)
- [ ] **Reporting** `/admin/reporting` 🔴

## 4. Operatiu
- [ ] **Inventari llista** `/admin/inventory` 🔴
- [ ] **Inventari detall** `/admin/inventory/[id]` 🔴
- [ ] **Nou inventari** `/admin/inventory/new` 🔴
- [ ] **Post-event hub** `/admin/post-event` 🔴
- [ ] **Post-event playbook** `/admin/post-event/playbook` 🔴
- [ ] **Post-event reports** `/admin/post-event/reports` 🔴
- [ ] **Nou report** `/admin/post-event/reports/new` 🔴
- [ ] **Enquestes** `/admin/post-event/surveys` 🔴
- [ ] **Post-event feedback** `/admin/post-event/feedback` 🔴
- [ ] **Partners** `/admin/collaborators` 🔴 → **lligar amb la Partners Platform** (vegeu `partners-platform-checklist.md`): migració visual + Partner Hub `/admin/collaborators/[id]` (servei `fetchPartnerHub` ja fet).

## 5. Growth
- [ ] **Portfolio** `/admin/portfolio` 🔴
- [ ] **Blog llista** `/admin/blog` 🔴
- [ ] **Blog edició** `/admin/blog/edit/[id]` 🔴
- [ ] **Nou blog** `/admin/blog/new` 🔴
- [ ] **Google Reviews** `/admin/google-reviews` 🔴
- [ ] **Ressenyes internes** `/admin/ressenyes` 🔴
- [ ] **Image Manager** `/admin/image-manager` 🔴
- [ ] **Canvas** `/admin/canvas` 🔴
- [ ] **Social** `/admin/social` 🔴

## 6. Catàleg
- [ ] **Packs llista** `/admin/packs` 🔴
- [ ] **Pack detall** `/admin/packs/[id]` 🔴
- [ ] **Nou pack** `/admin/packs/new` 🔴
- [ ] **Extres de packs** `/admin/packs/extras` 🔴
- [ ] **Catàleg** `/admin/catalog` 🔴
- [ ] **Codis descompte** `/admin/discount-codes` 🔴

## 7. Client portal i comunicació
- [ ] **Plantilles email** `/admin/email-templates` 🔴
- [ ] **Plantilla detall** `/admin/email-templates/[slug]` 🔴
- [ ] **Emails** `/admin/emails` 🔴
- [ ] **Missatges** `/admin/mensajes` 🔴
- [ ] **Qüestionaris** `/admin/questionnaires` 🔴
- [ ] **Qüestionari detall** `/admin/questionnaires/[id]` 🔴
- [ ] **Nou qüestionari** `/admin/questionnaires/new` 🔴
- [ ] **Privacitat** `/admin/privacy` 🔴 (RGPD, ARCO)
- [ ] **FAQ llista** `/admin/faq` 🔴
- [ ] **FAQ detall** `/admin/faq/[id]` 🔴
- [ ] **Nova FAQ** `/admin/faq/new` 🔴

## 8. Sistema (Fase 4 — al final)
- [ ] **Dashboard** `/admin` 🔴 (Control Room — overview)
- [ ] **Salut** `/admin/salut` 🔴
- [ ] **Settings** `/admin/settings` 🔴
- [ ] **Settings empresa** `/admin/settings/company` 🔴
- [ ] **Settings hero** `/admin/settings/hero` 🔴
- [ ] **Settings integracions** `/admin/settings/integrations` 🔴
- [ ] **Settings notificacions** `/admin/settings/notifications` 🔴
- [ ] **Settings pressupostos** `/admin/settings/quotes` 🔴
- [ ] **Crons** `/admin/crons` 🔴
- [ ] **Stats** `/admin/stats` 🔴
- [ ] **Coverage** `/admin/coverage` 🔴
- [ ] **Scripts** `/admin/scripts` 🔴
- [ ] **CSS Manager** `/admin/css-manager` 🔴
- [ ] **Text Manager** `/admin/text-manager` 🔴
- [ ] **Features** `/admin/features` 🔴
- [ ] **Activity** `/admin/activity` 🔴
- [ ] **Manual** `/admin/manual` 🔴
- [ ] **Protocol** `/admin/docs/protocol` 🔴

---

## Resum de volum
- 🟢 fetes (referència): 14 pàgines (Lead fitxa, Re-engagement, Clients, Client 360, Agenda/Reserves, Reserva detall, Nova reserva, Calendari, Tasques, Nova tasca, Inbox, Compose, Inbox settings, Intake).
- 🟡 en curs: 1 (Leads — 7/8).
- 🔴 pendents: ~55 pàgines (les llistades a §2–§8).

## Ordre recomanat (de l'inventari)
Fase 2 Comercial+Finances → Fase 3 Growth+Catàleg → Fase 4 Sistema. El Dashboard `/admin` es deixa pel final perquè depèn que els mòduls que enllaça ja estiguin migrats.

## Iniciatives transversals obertes (no són migració visual)
- **Partners Platform** — `docs/partners-platform-checklist.md` (Partner Hub, `billedCollaboratorId`, `BookingServiceLine`, analítica). Decisió d'arquitectura ja presa per Opus.
- **Centralitzar catàlegs locals** — encara hi ha `EVENT_TYPE_LABELS`/`STATUS_CONFIG` locals en pàgines 🔴 (analytics, etc.). En migrar cada pàgina, eliminar el catàleg local i importar de `lib/constants/`.
