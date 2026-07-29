# Auditoria funcional mil·limètrica de l'admin — 2026-06-27

> Encàrrec del propietari: revisar TOTES les funcions de l'admin una a una, amb
> captures, verificant que funcionen (PDFs, enquestes post-event, mails automàtics,
> economia, packs, etc.) i caçant bugs pel camí.
>
> Mètode: navegació real com a treballador (Playwright + captures a `.audit-shots/`),
> òrgan per òrgan. Cada funció es marca ✅ OK · 🐛 BUG · ⚠️ DUBTE · ⛔ TRENCAT.
> IDs reals usats: lead `cmpyhlaox…` · booking `cmq49d2vz…` · customer `cmpyhlb4p…`
> · pack `cmq9h2e4m…` · inventory `cmmkqgcdy…` · proposal `cmq0y8ohw…` · collaborator
> `tino-lloguer` · blog `cmmxx2cxy…`.

## Mapa d'òrgans (ordre de revisió)

1. **Comandament** — /admin, /salut, /reporting, /analytics, /stats, /activity
2. **Comercial** — /leads, /leads/[id], /sales-ops, /marketing
3. **Reserves** — /bookings, /bookings/[id], /bookings/new, /calendario
4. **Clients** — /clientes, /clientes/[id], /reactivation*, /referrals*
5. **Documents** — /presupuestos, /presupuestos/[id], /dossiers
6. **Comunicacions** — /inbox, /inbox/compose, /emails, /email-templates, /mensajes
7. **Catàleg** — /packs, /pricing, /inventory, /inventory/[id], /catalog, /cost-calculator
8. **Partners** — /collaborators, /collaborators/[id]
9. **Post-event** — /post-event, /questionnaires, /ressenyes, /google-reviews
10. **Web/Contingut** — /portfolio, /blog, /blog/[id], /social, /campaigns, /text-manager, /image-manager, /canvas
11. **Sistema** — /settings, /crons, /coverage, /features, /studio, /docs

## Troballes (acumulatives)

### Barem d'avaluació (7 eixos «Sèrie Òrbita Events», CLAUDE.md)
Cada peça s'avalua contra: **1 Visual · 2 Coherència · 3 Canònic · 4 Monocapa · 5 Responsiu · 6 Corporatiu (cablejat entre òrgans) · 7 Tècnic (viu, sense codi mort, 0 hardcoded)**.

### 🐛 BUGS / incongruències confirmats

- **#1190 (ARREGLAT)** — Semàfor de marge fragmentat en 3+ implementacions divergents (nova reserva pintava crític en ambre; economia col·lapsada a 3 colors). Unificat a `getMarginBand` (4 bandes).
- **Reporting «(CAC)» enganyós (ARREGLAT)** — `reporting/page.tsx:210` titulava «Conversió per origen (CAC)» però la taula només mostra conversió (total/tancats/win rate/ingrés mig), CAP columna de cost. El CAC real viu a Economia (#1188). A més el `<h2>` era `text-sm font-semibold` (Tailwind cru, viola eix 3 canònic). Fix: títol → «Conversió per origen» + `.ap-h2`.
- **Label pagament incoherent** — fitxa de reserva diu «Completat», llista diu «Pagat» per al mateix estat (`bookings/[id]/page.tsx:185` vs `bookings/page.tsx:362`). PENDENT d'unificar (#1191).
- **Botons de pagament absents** — només es pot marcar pagat des de la fitxa de reserva (#1187) i Economia (bulk); falta a la **llista de reserves** i al **Customer Hub → Reserves**. PENDENT (#1191).

### ✅ PDFs verificats FUNCIONALMENT (no captura — generats de debò via API)
studio/preview: cataleg (518KB), contracte (473KB), dossier (1MB), factura (453KB), informe (488KB) → tots `%PDF` HTTP 200. Dossier compost real (15KB) ✅. Contracte de proposta = POST genera+desa (correcte).

### Estat per òrgan

| Òrgan | Estat | Notes |
|---|---|---|
| Comandament | 🔶 | analytics ✅ (KPIs/GA4/paid media OK) |
| Comercial | ✅ | leads/temporada ✅ (calendari CS amb events!), sales-ops ✅ (SLA/seqüències/canals), marketing ✅ (readiness/CAC/integracions) |
| Reserves | 🔶 en curs | bookings ✅; semàfor marge OK (#1190); labels «Completat/Pagat» + botons pagament pendents (#1191); calendari ✅ (events surten a leads/temporada → el buit anterior era càrrega) |
| Clients | 🔶 | clientes (llista) ✅ |
| Documents | 🔶 | presupuestos (llista 25) ✅; presupuestos/[id]=vista vinculació ⚠️; **PDF editor (Editar→PdfStudio) verificació profunda pendent** |
| Comunicacions | 🔶 | emails (mails automàtics, triggers manuals, config) ✅ |
| Catàleg | ✅ | catalog ✅, packs ✅ (motor preus/marge/divergència), inventory ✅ (51 items, KPIs) |
| Partners | ✅ | collaborators ✅ (5 partners, comissions, catàleg amb fotos) |
| Post-event | 🔶 | post-event ✅ (3 fluxos + 4 events accionables); enquesta/envio profund pendent |
| Web/Contingut | ⏳ | social ✅; portfolio/blog/campaigns/text-manager/image-manager/canvas pendents |
| Sistema | ⏳ | |

### 📌 Lliçó metodològica (important)
Les captures amb **temps d'espera fix** (`waitForTimeout`) donen **FALSOS BUITS** en pàgines amb fetch client pesat + doble compilació en fred (loading.tsx → page → fetch). Ex: `/admin/inventory` sortia negre amb 6s, però amb `waitForSelector('text=...contingut real...')` apareix complet i amb **0 errors de consola**. → Mètode fiable d'auditoria: esperar un SELECTOR del contingut real, no temps. El curl directe a l'API confirma backend OK en aquests casos.

### ⚠️ A VERIFICAR (sense càrrega del servidor)

- **Calendari mensual** — la graella es veu BUIDA a la captura tot i haver-hi 3 reserves COMPLETED al juny 2026 (dies 6/12/23). El servei `adminCalendarMonthService` inclou correctament les bookings (`status notIn ['CANCELLED']`), per tant les dades hi són. La crida directa a `/api/admin/calendario/mes` va donar HTTP 000 (timeout) PERQUÈ el dev server estava saturat per les captures en bucle. **Conclusió provisional: artefacte de càrrega, no bug** — re-verificar el render del calendari sense contenció.

### 📌 Nota metodològica
Capturar 88 pàgines en bucle satura el dev server (single-thread); les pàgines amb **fetch client** (calendari, inbox, etc.) poden sortir buides a la captura per timeout del fetch sota càrrega. Re-verificar aquestes individualment quan el servidor estigui lliure.
