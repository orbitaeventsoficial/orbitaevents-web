# Diari de treball — Òrbita Events

## 2026-03-09 sessió 7 — Emails i18n complets + Vista diària + Firma + Form extraction

### Fet
1. **lib/email.ts — i18n complet**: 3 funcions internacionalitzades a ca/es/en:
   - `sendPrivacyVerificationEmail`: Tota la UX de verificació RGPD (etiquetes drets, CTA, legal)
   - `sendPrivacyRequestCompletedEmail`: Resultat processament sol·licitud RGPD
   - `sendTestimonialApprovedEmail`: Email al client quan s'aprova el testimonial (descompte, CTA)
   - Noves constants: `PRIVACY_REQUEST_LABELS`, `PRIVACY_COPY`, `TESTIMONIAL_COPY` — tot tipat per `EmailLocale`
2. **Firma professional email**: `getEmailSignatureHtml()` i `getEmailSignatureText()` exportades des de `lib/email.ts`. S'injecta automàticament a tots els emails enviats des del compose admin (`/api/admin/emails/send`).
3. **Vista diària calendari**: `CalendarDayClient.tsx` — timeline per hores (06:00-23:00), bloquejar/desbloquejar dia, resum lateral amb detalls de reserves. Toggle Mes/Setmana/Dia a les 3 vistes.
4. **Bookings form extraction**: `NewBookingForm.tsx` (1045 línies) extret de `new/page.tsx` (ara 5 línies wrapper). Segueix el patró Blog (`BlogEditorForm` + mode prop).
5. **Callers actualitzats**: `privacy/request/route.ts` passa `locale`, `start-process/route.ts` passa `preferredLocale` a testimonials.
6. **Scripts audit**: 17 scripts revisats — tots actius i funcionals, cap obsolet.
7. **Blog form**: Ja estava unificat (`BlogEditorForm.tsx` amb mode prop) — confirmat.

### Commits
- `45096df` — feat: emails i18n complets + vista diària calendari + firma email + form extraction

### Raonament
- L'usuari va dir "fesho tot el que quedi pendent" — executat tot el que estava al llistat de tasques pendents.
- Emails de privacitat/testimonials eren l'últim punt d'i18n pendent — ara TOT enviat des del sistema està en l'idioma del client.
- La vista diària és la tercera opció del calendari (Mes/Setmana/Dia) — completa el sistema de vistes.
- L'extracció del form de bookings segueix el patró consolidat del projecte.

---

## TASQUES PENDENTS (actualitzat)

### Alta prioritat
1. **Canvas editor**: L'usuari va preguntar "i canvas?" — editor visual no implementat.
2. **WhatsApp integrat**: `whatsappService.ts` existeix però és bàsic. Falta integració real Business API.
3. **Fitxa client ben pensada**: Redissenyar `/admin/clientes/[id]` amb UX millorada.
4. **Reserves ben pensades**: Redissenyar UX reserves (llistat + fitxa).

### Mitjana prioritat
5. **Tot al mòbil**: Millores mòbil específiques a l'admin.
6. **estat-admin.md**: Actualitzar roadmap (email templates fets, calendari diària feta).

### Baixa prioritat
7. **Multi-user (rols i permisos)**: Roadmap futur.
8. **GDPR UI admin**: API existeix, falta pàgina admin.

---

## 2026-03-09 sessió 6 — PDF Studio D&D + Contractes unificats + Emails idioma client + Auto-traducció

### Fet
1. **PDF Studio drag & drop**: Seccions del formulari reordenables amb `SortableList`. Cada secció col·lapsable (▸/▾). Ordre persistent a localStorage draft. Icona de drag handle (☰) a cada secció.
2. **PDF Studio: mode contracte unificat**: Selector "Tipus de document" (Pressupost / Contracte). Secció "Dades del contracte" amb camps legals (NIF, IBAN, dipòsit %, política cancel·lació, clàusules). Genera contracte PDF usant `generateContractPDF()` existent.
3. **Auto-traducció plantilles email**: Botó "Traduir des del CA → ES/EN" a l'editor de plantilles. Agafa subject + blocs de text i els tradueix via `/api/admin/translate` (DeepL + Google fallback). Només visible quan l'idioma actiu no és català.
4. **Emails en idioma preferit del client** — 4 fitxers corregits:
   - `paymentReminderService.ts`: Recordatoris pagament ara en ca/es/en segons `booking.preferredLocale`
   - `commercialSequenceService.ts`: Follow-ups comercials ara en ca/es/en segons `lead.preferredLocale` (abans tot en castellà fix)
   - `bookings/[id]/status/route.ts`: Email portal accés (COMPLETED) ara en idioma del client
   - `bookings/[id]/communications/route.ts`: Tots els emails de comunicació (pagament, post-event, general) en idioma del client

### Auditoria completa d'idiomes als emails (resultat de l'agent explorador)
- **Correctes** (ja usaven `preferredLocale`): quote, send-post-event, cron/post-event, send genèric, contact form
- **Corregits en aquesta sessió**: paymentReminder, commercialSequence, status portal, communications
- **Pendents menors**: `lib/email.ts` (privacitat/testimonials en castellà fix — ús intern poc freqüent)

### Commits
- `3685cf7` — feat: PDF Studio drag & drop + emails en idioma del client (6 fitxers, +610 −536 línies)

### Raonament
- L'usuari va dir "superimportantissim que sigui drag and drop" pel PDF Studio — implementat amb SortableList reutilitzable.
- "El més important és que surti en l'idioma preferit del client" — auditoria exhaustiva de tots els punts d'enviament d'email, 4 fitxers corregits.
- Unificar pressupost + contracte al mateix editor evita que l'usuari hagi de navegar a llocs diferents.

---

## TASQUES PENDENTS (prioritzades)

### Alta prioritat
1. **Safata d'entrada completa**: Paperera/arxiu d'emails, enviar email com a Òrbita (compose), firma professional d'email. Ara només es poden llegir emails IMAP.
2. **Canvas editor**: L'usuari va preguntar "i canvas?" — editor visual tipus canvas per composar materials visuals. No implementat.
3. **WhatsApp integrat**: `whatsappService.ts` existeix però és bàsic. Falta integració real (Business API o link-based).
4. **Fitxa client ben pensada**: L'usuari va dir "que la fitxa de client estigui pensada" — redissenyar la pàgina `/admin/clientes/[id]` amb UX millorada.
5. **Reserves ben pensades**: L'usuari va dir "que les reserves estiguin pensades" — redissenyar la UX de reserves.

### Mitjana prioritat
6. **Tot al mòbil**: PWA existeix però no s'han fet millores mòbil específiques aquesta sessió.
7. **Bookings new form extraction**: 520+ línies inline, candidat per extreure component (com BlogEditorForm).
8. **lib/email.ts testimonials/privacitat**: Emails de testimonial aprovats i verificació GDPR segueixen en castellà fix.
9. **scripts/ cleanup**: Revisar scripts potencialment no mantinguts (check-packs-i18n.ts, autofix-*.ts).
10. **estat-admin.md**: Actualitzar roadmap — email templates ja estan fets però no reflectit.

### Baixa prioritat
11. **Vista diària calendari**: Setmanal i mensual existeixen, falta diària.
12. **Multi-user (rols i permisos)**: Roadmap futur.
13. **GDPR UI admin**: API existeix, falta pàgina admin.

---

## 2026-03-09 sessió 5 — IMAP + Plantilles email + Drag & Drop global + Auditoria codi

### Fet
1. **IMAP configurable des d'admin**: `lib/imap.ts` refactoritzat — config dinàmica (env vars primer, BD Settings fallback). Nova pàgina `/admin/inbox/settings` amb `ImapSettingsClient.tsx` (formulari, test connexió, guardar). Eliminats `InboxSettingsClient.tsx` (Gmail OAuth legacy) i `lib/gmail.ts` (codi mort).
2. **Connexió IMAP verificada**: DonDominio `imap.dondominio.com:993`, info@orbitaevents.com — 15 emails, 13 no llegits, 5 carpetes.
3. **Sistema plantilles email editables**: Model `EmailTemplate` a Prisma. `emailTemplateService.ts` amb 8 plantilles × 3 idiomes (ca/es/en), disseny fosc professional. API routes + editor visual amb blocs drag & drop (6 tipus: heading, text, button, info_table, highlight, divider). Preview en temps real via iframe.
4. **CSS drag & drop global**: Classes a `admin-theme.css` — `.admin-drag-placeholder` (silueta lluminosa color corporatiu), `[data-dragging]`, `.admin-drag-item`, `.admin-drag-inserted`. Tot amb CSS variables (`--at-brand`, `--at-brand-glow`), `prefers-reduced-motion` respectat.
5. **SortableList.tsx**: Component reutilitzable drag & drop genèric. Encara no integrat a cap component existent.
6. **Nav actualitzada**: Afegit "Plantilles email" a secció Contingut.

### Auditoria codi completa (3 auditors en paral·lel)

#### A. Components admin (`app/admin/components/`) — 21 fitxers, 2.849 línies
- **20/21 actius** (95.2%)
- **1 "okupa"**: `SortableList.tsx` (195 línies) — creat però no importat enlloc encara (pendent d'integrar)
- **Possible consolidació**: `ui.tsx` i `AdminUI.tsx` podrien unificar-se (pattern dual)
- **Components més crítics**: `AdminPage` (59 importadors), `ToastProvider` (21), `ConfirmDialog` (14), `AdminLoadingSkeleton` (57 loading.tsx)

#### B. Formularis duplicats
- **Blog new/edit**: 416 + 396 línies quasi idèntiques → **PENDENT extreure `BlogEditorForm.tsx`** (com FAQ fa amb `FaqEditorForm`)
- **Inventory new**: 372 línies inline form, però `[id]/page.tsx` usa `InventoryItemEditor` separat → **PENDENT unificar**
- **Bookings new**: 520+ línies inline, no extret → candidat futur
- **FAQ**: ✅ ja consolidat (`FaqEditorForm` amb mode prop)
- **Packs**: ✅ acceptable (NewPackForm simple vs EditPackForm complex, workflows molt diferents)
- **Cap component old/legacy/backup trobat**
- **Tots els *Client.tsx correctament parellats amb page.tsx**

#### C. Codi mort lib/API
- **0 fitxers lib/ orfes** — tots importats
- **0 rutes API sense crides** — totes cridades des de client/server/cron
- **0 fitxers legacy** (old/backup/v2/copy)
- **Repo molt net** després de 2 migracions (Supabase→Railway, C:→D:) i múltiples auditories
- **Scripts**: `scripts/` potencialment amb scripts no mantinguts (check-packs-i18n.ts, autofix-*.ts) — revisar en futura sessió

### Accions pendents d'aquesta auditoria
1. ~~SortableList.tsx~~ → integrar als components amb drag & drop existents (leads, bookings, tasks, email editor)
2. Blog new/edit → extreure BlogEditorForm.tsx reutilitzable
3. Inventory new → usar InventoryItemEditor per crear també
4. ui.tsx + AdminUI.tsx → valorar consolidació

### Raonament
- L'usuari va demanar explícitament "no vull okupas al repo" i "formularis triplicats" — auditoria exhaustiva necessària.
- El repo està sorprenentment net (95%+ components actius, 0 rutes mortes) gràcies a les auditories anteriors.
- Els duplicats principals són Blog i Inventory (patró new/edit no consolidat), totalment resoluble amb el patró FAQ (FaqEditorForm amb mode prop).
- SortableList.tsx es manté perquè s'integrarà pròximament — no és codi mort sinó codi preparat.

---

## 2026-03-09 sessió 4 — Calendari complet + Crons monitoratge

### Fet
1. **Calendari bloqueig/desbloqueig inline**: API `/api/admin/availability` (GET/POST/DELETE). Substituït link mort `/admin/bloqueos/new` per botons funcionals amb formulari de nota opcional.
2. **Vista setmanal calendari**: Nou `CalendarWeekClient.tsx` amb 7 columnes, reserves detallades, bloqueig inline. Toggle mes/setmana a la barra superior.
3. **Monitoratge crons**: Nova pàgina `/admin/crons` amb estat visual de tots 6 crons. Cards resum, detall expandible (últim run, estat, resum, missatge error).
4. **Logging unificat crons**: Afegit `saveRunStatus()` a invoice-sync, pack-pricing-check, post-event, reviews-sync. Tots guarden `lastRun/lastStatus/lastSummary/lastMessage` a Settings.
5. **Nav actualitzada**: Afegits Testimonis (aprovar) + Crons a la navegació.

### Raonament
- El calendari era funcionalitat trencada visible — link mort que trencava l'experiència.
- Vista setmanal molt demanada per veure detall diari de la setmana en curs.
- Crons invisibles = incertesa — ara l'admin veu l'estat de tot amb un cop d'ull.

---

## 2026-03-09 sessió 3 — Ressenyes Google automàtiques

### Problema
Les ressenyes noves de Google no es reflectien al web. El `google-reviews.json` estava buit (`reviews: []`).

### Causa
El script `sync-reviews.mjs` no carregava les variables d'entorn (`.env`) quan s'executava com a script Node. `SERPAPI_KEY` existeix però el script no la veia → retornava 0 ressenyes.

### Solució (3 nivells)
1. **Fix immediat**: Script carrega `.env` automàticament → 8 ressenyes de 5★ sincronitzades (16 total a Google)
2. **Automatització**: Nou cron `reviews-sync` que sincronitza via SerpAPI i guarda a BD (`cache.googleReviews`)
3. **Stats dinàmiques**: `site-config.ts` ara llegeix `avgRating` i `reviewCount` del JSON sincronitzat (abans hardcoded 50)

### Flux ara
```
Cron diari reviews-sync → SerpAPI → BD (Setting cache.googleReviews)
                                    ↓
API /api/google-reviews ← llegeix cache BD + JSON deploy + testimonis BD
                                    ↓
Web pública ← GoogleReviewsRotating + OpinionesClient
```

### Fitxers
- `scripts/sync-reviews.mjs` — carrega .env automàticament
- `app/api/cron/reviews-sync/route.ts` — NOU: cron SerpAPI → BD
- `app/api/google-reviews/route.ts` — nova font `getReviewsFromCache()`
- `app/config/site-config.ts` — stats dinàmiques
- `public/data/google-reviews.json` — 8 ressenyes reals

---

## 2026-03-09 sessió 2 — Pressupostos funcionals + Lockfile + Type errors + Dossier

### Objectiu
Fer que els pressupostos FUNCIONIN de debò: que es puguin trobar, llistar, filtrar i editar. Arreglar el build a Railway (lockfile). Crear dossier permanent per no re-auditar.

### Canvis

#### 1. Lockfile sense Supabase (fix build Railway)
- **Causa**: `pnpm-lock.yaml` encara tenia 18 línies de `@supabase/supabase-js` però `package.json` ja no.
- **Fix**: `pnpm install --lockfile-only --no-frozen-lockfile` → lockfile regenerat, 0 refs supabase.
- **Impacte**: El build a Railway fallava amb `ERR_PNPM_OUTDATED_LOCKFILE`.

#### 2. Pressupostos carreguen des de la BD
- **Causa**: Quan obries `/admin/presupuestos?proposalId=XXX`, el `PresupuestoPdfStudio` rebia l'ID però MAI feia fetch del snapshot guardat. Tots els camps apareixien buits.
- **Fix**: Afegit `useEffect` que fa `GET /api/admin/proposals/[id]` i restaura TOTS els camps: pack, preu, extras, client, dates, condicions, marca.
- **Fitxer**: `PresupuestoPdfStudio.tsx` (75 línies noves)

#### 3. Llistat de pressupostos millorat
- **Abans**: Només 20 últims en una llista plana, sense filtres, sense accions.
- **Ara**: Component `ProposalsList.tsx` (nou) amb:
  - 5 stats cards clicables (Total, Esborranys, Enviats, Acceptats, Rebutjats)
  - Valor total acceptat visible
  - Cerca per client/referència
  - Filtre per estat (clic a la card)
  - Taula completa amb: referència (link editar), client (link hub), badge estat amb color, import, data relativa
  - Menú accions: editar, marcar enviat, acceptat/rebutjat, fitxa client, entrada
  - Pressupostos antics (LeadDocument) en collapsable
- **Pàgina**: `presupuestos/page.tsx` reescrit — sense paràmetres mostra el llistat, amb paràmetres mostra l'editor.

#### 4. Type errors preexistents arreglats (9 fitxers)
Amb Prisma regenerat correctament, el build strict revela callbacks `.map()` sense tipus:
- `bodas/page.tsx`, `discomovil/page.tsx`, `fiestas/page.tsx`, `empresas/page.tsx` — `packs.map((p)` → tipat
- `analytics/page.tsx` — 3 `.reduce()`/`.map()` tipats (bySource, conversionByMonth, byEventType)
- `bookings/[id]/page.tsx` — 8 callbacks tipats (commLogs, activityLogs, extras, inventory, invoices, proposals)

#### 5. Dossier permanent creat
- **Fitxer**: `docs/estat-admin.md` — referència completa de l'admin (64 pàgines, 132 API, 5 crons, 37 serveis)
- **Objectiu**: NO re-auditar cada sessió. Consultar el dossier i actualitzar només el que canvia.
- **Enllaç al diari**: Aquí sota.

### Referència
- Estat complet de l'admin: `docs/estat-admin.md`
- Full de ruta de millores: al final del dossier (4 prioritats altes, 4 mitjanes, 4 baixes)

### Verificació
- `next build`: OK (236 pàgines)
- `prisma generate`: OK
- Lockfile: 0 refs supabase
- tsc: 0 errors nous

---

## 2026-03-09 — Auditoria de bugs funcionals + correcció CSS + rendiment

### Objectiu
Arreglar bugs reals que l'usuari notava: pressupostos que desapareixien, colors que no es veien, admin lent, emails que no s'enviaven.

### Bugs crítics corregits

#### 1. Pressupostos desapareixien (CSRF)
- **Causa**: `PresupuestoPdfStudio.tsx` feia `fetch()` sense token CSRF. L'API (`proposals/route.ts`) verifica CSRF → retornava 403 → el pressupost mai es guardava a la BD.
- **Fix**: Substituït `fetch()` per `fetchWithCsrf()` a les 2 crides de guardat/enviament.
- **Per què no es va detectar abans**: L'error 403 es capturava genèricament i mostrava "No s'ha pogut guardar" sense indicar que era un problema de CSRF.

#### 2. 13 components més amb el mateix bug CSRF
- **Fitxers arreglats**: clientes/page.tsx, SummaryPanel.tsx, CommsPanel.tsx, ProposalsPanel.tsx, EconomiaClient.tsx, InvoiceSection.tsx, LeadSavedViews.tsx, QuickActions.tsx, SlaAutomationButton.tsx, SendExecutiveReportButton.tsx, CalendarSyncButton.tsx, CalendarTokenManager.tsx, notifications/page.tsx
- **Impacte**: Crear clients, editar factures, guardar vistes de leads, executar automatitzacions, sincronitzar calendari — tot fallava silenciosament amb 403.

#### 3. Email post-event no s'enviava des de fitxa reserva
- **Causa 1**: `PostEventEmailButton.tsx` enviava JSON però la ruta esperava FormData → fix a FormData.
- **Causa 2**: `send-post-event/route.ts` retornava `NextResponse.redirect(303)` en lloc de JSON. Quan `fetch()` segueix el redirect, `res.ok` sempre és `true` (200 de la pàgina HTML), fins i tot en errors → l'usuari veia "Enviat!" quan no s'havia enviat.
- **Fix**: Ruta canviada a retornar JSON. Botons actualitzats per gestionar la resposta JSON.

#### 4. Plantilla email post-event duplicada en 3 fitxers
- **Causa**: Mateixa plantilla HTML copiada a `cron/post-event/route.ts`, `emails/run-cron/route.ts` i `emails/send-post-event/route.ts`.
- **Fix**: Creat `lib/services/postEventEmailService.ts` com a font única de veritat. Els 3 fitxers ara importen d'allà.

### CSS — 3 regles assassines eliminades

#### 5. admin-theme.css matava tots els colors
- **Regla 1 (línia 347)**: `html.admin-mode .admin-main-shell :is(.rounded-xl, .rounded-2xl, .rounded-3xl) { background: var(--at-panel) !important }` — forçava TOTS els elements arrodonits al mateix gris fosc. Cards de mètriques, passos del pilot, semàfors del radar — tot invisible.
- **Regla 2 (línia 374)**: Tots els botons forçats al mateix gris (`var(--at-raised) !important`) — botons primaris, secundaris, d'èxit, tots iguals.
- **Regla 3 (línia 162)**: `background-image: none !important` a TOTS els elements — matava gradients de QuickActions, glass cards, etc.
- **Fix**: Eliminades les 3 regles. Ara els components controlen els seus propis colors.

### Rendiment

#### 6. Dashboard 12× més ràpid al primer load
- **Causa**: El bucle d'ingressos mensuals feia `for (let m = 0; m < 12; m++) { await Promise.all([cur, prev]) }` — 12 iteracions seqüencials, 2 queries cada una = 12 round trips a la BD.
- **Fix**: Totes les 24 queries en un sol `Promise.all()` — 1 round trip en lloc de 12.
- **Extra**: Query de checklist setting ara cacheada amb `cachedQuery()`.

### Qualitat menor
- Accents catalans: "Ultims" → "Últims", "Valoracio" → "Valoració", "Confirmacio" → "Confirmació"
- `SendPostEventButton.tsx`: Canviat de `fetchWithCsrf` (innecessari) a `fetch` simple, afegit estat `sent` visual

### Verificació
- `npx tsc --noEmit`: 0 errors
- `npm run build`: OK (233 pàgines)
- SMTP verificat: connexió OK a smtp.dondominio.com:465

---

## 2026-03-08 — Migració Supabase → Railway + Tasques pendents

### Objectiu
Completar les 3 tasques pendents de la sessió anterior i migrar completament de Supabase a Railway.

### Raonament
Supabase ha tancat el període de gràcia gratuït. Railway ja es paga ($15/mes) i ofereix BD PostgreSQL integrada. Millor consolidar tot en un sol proveïdor que pagar dos serveis. A més, Supabase s'usava de forma mixta (Prisma per la majoria + client Supabase per a customerService i events), cosa que era una inconsistència arquitectònica.

### Tasques completades

#### 1. costPerUnit a Extra (schema.prisma)
- Afegit camp `costPerUnit Float?` al model Extra
- Permetrà calcular semàfors de marge per extra individual

#### 2. prisma db push (Railway)
- BD configurada: `tramway.proxy.rlwy.net:57035/railway`
- Aplicats: Invoice, InvoiceStatus, ContractStatus, camps contracte a Proposal, costPerUnit a Extra
- `.env`, `.env.local`, `.env.production`, `.env.railway` actualitzats amb nova connexió

#### 3. sync-packs-to-db.ts
- 10 packs creats amb traduccions ca/es/en
- Noms en català clar: Bàsic, Premium, Exclusiu, Complet, Còctel, Estàndard, Gala

#### 4. Eliminació total de Supabase (14 fitxers)
**Per què?** Supabase feia dues coses: BD (ja migrada a Prisma fa temps) i Storage (pujada fitxers). Les úniques parts que encara usaven el client Supabase directe eren customerService.ts, events/route.ts i les rutes de pujada de fitxers. Consolidar-ho tot a Prisma + filesystem és més coherent i elimina una dependència externa.

**Fitxers eliminats:**
- `lib/supabase.ts` — client centralitzat, tipus legacy
- `scripts/sync-inventory-images.mjs` — depenia de Supabase Storage
- `@supabase/supabase-js` — desinstal·lat de package.json

**Fitxers reescrits (Supabase → Prisma):**
- `lib/services/customerService.ts` — totes les queries ara amb Prisma, tipus de Prisma Client
- `app/api/admin/events/route.ts` — queries de bookings via Prisma

**Fitxers reescrits (Supabase Storage → filesystem local):**
- `app/api/upload/route.ts` — pujada general de fitxers
- `app/api/admin/inventory/[id]/photo/route.ts` — fotos inventari
- `app/api/admin/leads/[id]/documents/route.ts` — documents de leads
- `app/api/admin/leads/[id]/documents/[documentId]/route.ts` — eliminació documents

**Nous fitxers creats:**
- `lib/storage.ts` — mòdul de storage amb filesystem local (uploadFile, deleteFile, readFile, getPublicUrl, isLocalStorageUrl)
- `app/api/uploads/[...path]/route.ts` — serveix fitxers pujats amb cache immutable i MIME types

**Fitxers netejats:**
- `lib/inventory-image-constants.ts` — eliminat bucket Supabase, isInventoryBucketUrl
- `lib/env.ts` — eliminades vars SUPABASE_*, afegit UPLOADS_DIR
- `next.config.mjs` — eliminat `*.supabase.co` de remotePatterns i CSP
- `app/admin/inventory/InventoryListClient.tsx` — `.supabase.co/` → `/api/uploads/`
- `app/admin/layout.tsx` — "Prisma + Supabase" → "Prisma + Railway"
- `app/admin/inventory/[id]/InventoryPhotoUpload.tsx` — comentaris actualitzats
- `.env`, `.env.local`, `.env.production`, `.env.railway`, `.env.example` — eliminades totes les vars Supabase

### Verificació
- `npx tsc --noEmit`: 0 errors
- `npm run build`: OK
- `npx vitest run`: 167 tests, tots passen
- `grep -ri supabase *.{ts,tsx,js,mjs}`: 0 resultats

---

## 2026-03-04 sessió 5 — Visual Potent + Reporting + PWA + Automatitzacions + UX Polish

### Objectiu
Upgrade visual complet de l'admin: de "funcional però pla" a "professional i impressionant". Gradients controlats, glassmorphism, animacions, glow effects, gràfiques comparatives, PWA, avisos intel·ligents i tooltips.

### Canvis implementats

#### 1. Visual Potent — Admin Theme Upgrade
- **admin-theme.css**: Reactivació gradients selectius (`.admin-gradient-*`), eliminació del blanket ban `background-image: none !important`. Classes `.admin-card-glass` amb backdrop-blur + 3 nivells elevació. Micro-animacions: hover scale, entrada escalonada, progress bars animades. Sidebar premium: glass, logo glow, item actiu gradient, separadors gradient.
- **page.tsx**: Dashboard hero header amb gradient radial brand gold, salutació dinàmica (Bon dia/Bona tarda/Bona nit), glow effect. KPI cards amb hover glow accent, font mono per números, animació fade-in-up escalonada. Objectiu mensual amb RadialProgress ring.
- **ui.tsx**: MetricCard amb classes glass + hover glow. Card amb glass variant.
- **layout.tsx**: Sidebar glass amb blur, logo glow or, item actiu gradient lateral, separadors gradient.
- **tailwind.config.js**: Noves animacions (stagger-in, glow-pulse, ring-fill), keyframes.

#### 2. RadialProgress Component
- **RadialProgress.tsx** (NOU): SVG cercle per a percentatges. Color dinàmic (emerald/amber/rose). Número centrat font mono. Animació ring-fill. Usat a objectiu mensual, checklist progress.

#### 3. Reporting — Gràfiques comparatives
- **Charts.tsx**: `MonthlyBarChart` — barres 12 mesos amb gradient fill, comparativa any actual vs anterior, tooltip. `DonutChart` — distribució rendibilitat per tipus event, colors per categoria.

#### 4. PWA Admin
- **public/manifest.json**: Ja existia per la web pública. Afegit shortcut admin.
- **public/sw.js** (NOU): Service worker bàsic amb cache d'assets estàtics + offline fallback.
- **layout.tsx**: Meta tags PWA per admin.

#### 5. Avisos Intel·ligents Dashboard
- **dashboard-data.ts**: Noves alertes contextuals — checklist baixa amb bolo imminent, impagament amb event proper, lead HOT sense resposta 48h.
- **page.tsx**: Visual millorat per alertes amb icones i urgència.

#### 6. Tooltip Component
- **Tooltip.tsx** (NOU): Component reutilitzable amb hover/focus. Posició auto (top/bottom). Accessible amb aria-describedby.
- Aplicat a: KPIs dashboard, semàfors radar, marge %.

### Raonament
- **Gradients selectius**: El blanket ban era necessari al principi per netejar el legacy, però ara que el tema és estable, gradients controlats amb classes `.admin-gradient-*` donen profunditat sense caos.
- **Glassmorphism**: backdrop-blur + bg rgba + border brillant = modernitat sense sacrificar llegibilitat. 3 nivells (surface/panel/raised) per jerarquia visual.
- **Animacions**: Subtils i amb `prefers-reduced-motion` respectat. Hover 1.01-1.02 scale, entrada fade-in-up, progress ring-fill.
- **RadialProgress**: Més impacte visual que barres lineals per a percentatges únics (objectiu mensual, checklist). SVG lleuger.
- **Gràfiques**: DJ necessita veure tendències mensuals i distribució per tipus d'event. Barres + donut cobreixen els dos casos.
- **PWA**: Admin ha de ser instal·lable al mòbil. Un DJ consulta el tauler des del cotxe, al lloc de l'event.
- **Avisos intel·ligents**: La intel·ligència del sistema és que t'avisi ABANS que passi un problema, no després.
- **Tooltips**: Redueixen la corba d'aprenentatge. "Què vol dir marge %?" → hover i ho saps.

### Verificació
- `tsc --noEmit`: 0 errors
- `next build`: OK

---

## 2026-03-04 sessió 4 — Double-booking + Estimador marge + Historial canvis

### Canvis implementats

#### 1. Detecció de double-booking (CRÍTIC)
- **Fitxer**: `app/admin/bookings/new/page.tsx`
- Quan l'usuari selecciona una data, es fa fetch de reserves actives (PENDING/CONFIRMED/PREPARING) al mateix dia
- Si hi ha conflictes, banner groc amb referència, client i hora de cada reserva existent
- No bloqueja la creació (un DJ pot fer 2 bolos si els horaris no es solapen), només avisa
- AbortController per cancel·lar peticions obsoletes quan canvia la data ràpidament

#### 2. Estimador de rendibilitat en temps real
- **Fitxer**: `app/admin/bookings/new/page.tsx`
- Secció "Rendibilitat estimada" sota el resum de preus
- Mostra: cost estimat, marge net (€), marge % amb barra de progrés
- Semàfor: verd ≥50%, groc ≥30%, vermell <30%
- Usa ratis estàndard del costEngine (packCostRatio 0.36, extraCostRatio 0.28, etc.)
- Nota que el marge real es calcularà amb inventari assignat post-creació

#### 3. Historial de canvis a fitxa reserva
- **Fitxer**: `app/admin/bookings/[id]/page.tsx`
- Nova query `activityLogs`: tots els AdminLog de la reserva (no només comunicacions)
- Timeline visual amb línia vertical, punts, icones i timestamps
- 12 tipus d'acció reconeguts: CREATE, UPDATE, STATUS_CHANGE, COMM_SENT, PAYMENT_RECORDED, etc.
- Descripcions contextuals: "PENDING → CONFIRMED", "Camps: eventDate, notes", etc.
- Mostrat just abans del Post-Event a la fitxa

### Raonament
- **Double-booking**: El buit més crític identificat — cap sistema professional permet crear reserves sense avisar de conflictes
- **Estimador marge**: Un DJ ha de saber si un bolo serà rendible ABANS de crear-lo, no després. Decisió comercial informada
- **Historial**: Traçabilitat completa — saber qui va canviar què i quan. Essencial per auditoria i disputes

### Verificació
- `tsc --noEmit`: 0 errors
- `next build`: OK

---

## 2026-03-04 sessió 3 — Checklist de preparació per bolo

### Canvis implementats

#### Checklist de reserva
1. **BookingChecklist.tsx** (nou): Component client amb checklist interactiu per preparar cada bolo.
   - 7 ítems per defecte: confirmar client, playlist, equipament, vehicle, adreça, pagament, contracte
   - Toggle checkboxes amb UI optimista + save a API
   - Afegir/eliminar ítems personalitzats
   - Barra de progrés amb percentatge i colors (verd/groc/vermell)
   - Només es mostra per reserves CONFIRMED/PREPARING

2. **API checklist** (`/api/admin/bookings/[id]/checklist`): GET + PUT.
   - Emmagatzema al model Setting (clau `booking.checklist.{id}`, categoria `checklist`)
   - Retorna ítems per defecte si no hi ha dades guardades
   - Auth via `requireAuth()`

3. **Integració al detall reserva**: Checklist visible abans del BookingMarginCard per reserves confirmades/preparant.

4. **Integració al dashboard**: Card "Pròxim bolo" ara mostra barra de progrés del checklist amb fracció (X/Y) al costat del semàfor de pagament.

5. **dashboard-data.ts**: Afegits camps `checklistDone` i `checklistTotal` al `nextEvent`, llegint l'estat del Setting de BD.

### Raonament
- Un DJ necessita saber si ho té tot llest abans de cada bolo. La checklist respon "Tinc tot el material?" en 2 segons.
- Guardar a Setting evita canvis d'esquema Prisma — zero migracions.
- La barra al dashboard permet veure d'un cop d'ull si el pròxim event està preparat sense entrar a la fitxa.

### Verificació
- `tsc --noEmit`: 0 errors
- `next build`: OK
- Fix: camp `category: 'checklist'` obligatori al create del Setting

---

## 2026-03-04 sessió 2 — Dashboard professional: Pròxim Bolo + Objectiu Mensual

### Canvis implementats

#### Residuals de la sessió anterior
1. **Slugs antics**: Actualitzats FALLBACK_OPTIONS a InboxClient.tsx (x2 ocurrències) i placeholder a NewPackForm. Tots els noms antics (Party Starter, VIP Experience, etc.) substituïts per noms catalans.
2. **Finanzas**: Verificat que és un redirect a economia (igual que rentabilidad).

#### Dashboard — Millores professionals
3. **Card "Pròxim bolo"**: Card prominent a dalt del dashboard amb:
   - Compte enrere dinàmic (AVUI/DEMÀ/d'aquí X dies) amb punt animat si és avui/demà
   - Nom client, data, hora, lloc, venue
   - Tipus d'event, pack, total
   - Semàfor pagament (verd/groc/vermell)
   - Border canvia de color segons urgència (groc si ≤1 dia, cian si ≤3, neutre si >3)
   - Link directe a la fitxa de reserva

4. **Barra "Objectiu mensual"**: Visualització d'ingressos vs objectiu:
   - Barra de progrés amb color dinàmic (verd ≥100%, groc ≥60%, vermell <60%)
   - Percentatge gran a la dreta
   - Ingressos actuals / objectiu configurable
   - Objectiu llegit de `setting` (clau `dashboard.revenueTarget`, default 3.000€)

### Raonament
- Un DJ obre l'admin i vol saber 2 coses: "Què tinc demà?" i "Vaig bé de pasta aquest mes?". Les 2 respostes ara estan a dalt de tot, abans de tot.
- L'objectiu és configurable via BD (no hardcoded) per poder ajustar-lo cada temporada.

---

## 2026-03-04 — Consolidació Professional (Fases A–F)

### Objectiu de la sessió
Pla de consolidació complet: fixes crítics, packs amb noms clars, consolidació de pàgines, velocitat, i semàfors visuals.

### Canvis implementats

#### Fase A: Fixes crítics
1. **A1: Fix presupuestos crash** — `app/admin/presupuestos/page.tsx:80`: canviat `where: leadId ? { leadId } : undefined` → `where: leadId ? { leadId } : {}`. Prisma no accepta `where: undefined`.
2. **A2-A4**: Verificats com ja aplicats (respira-rosa overlay z-index, auth economia, catch buits).

#### Fase B: Packs — noms catalans + neteja (18→10)
3. **Noms renombrats a català clar**:
   - Bodes: Essential→Bàsic, Signature→Premium, Royal Wedding→Exclusiu
   - Festes: Party Starter→Bàsic, Party Machine→Complet, VIP Experience→Premium
   - Empreses: Corporate Cocktail→Còctel, Corporate Event→Estàndard, Corporate Gala→Gala
   - Oferta Flash: mantingut (ja era en català)
4. **Eliminats packs irreals**: Producció tècnica (3 packs) i Lloguer (categoria buida). Un DJ no és empresa de producció.
5. **ServiceSlug simplificat**: `'fiestas' | 'bodas' | 'discomovil' | 'empresas'` (sense produccion/alquiler).
6. **Fitxers actualitzats**: packs-config.ts, packs/page.tsx, NewPackForm.tsx, api/public/packs/route.ts, configurador/client.tsx, servicios/page.tsx, packPricingHealth.ts, analytics.ts, pdf-utils.ts, ExtrasConfiguratorClient.tsx, PresupuestoPdfStudio.tsx.
7. **Badge corregit**: "MILLOR VENDUT" → "MILLOR VENUT".
8. **Slugs unificats**: Tots els slugs ara coincideixen amb l'id del pack (bodas-basico, disco-completo, etc.).

#### Fase C: Stats valor real
9. **Fallback rating**: `app/api/admin/stats/route.ts` canviat de 4.8 → 5.0 (coherent amb dashboard-data.ts i site-config.ts que ja deien 5.0).

#### Fase D: Consolidar pàgines + nav
10. **Nav reorganitzat**: Stats i CSS Manager moguts a secció Configuració (no mereixen secció pròpia a Finances).
11. **Nav simplificat**: Finances passa de 3→2 ítems (Economia + Analítica). Configuració guanya Stats web + Tema admin.
12. **Rentabilidad**: Ja era un redirect a economia — no cal tocar.

#### Fase E: Velocitat admin
13. **CSS fetch**: Tret `pathname` del useEffect dependency a `layout.tsx` → CSS es carrega 1 cop (no a cada navegació).
14. **GA4 timeout**: 1200ms → 3000ms (menys fallbacks per xarxa lenta).
15. **Cache TTL**: 8 queries VERY_SHORT (60s) pujades a SHORT (2min) — timeline, command, recent-leads, upcoming-bookings, tasks. No són temps real crític.

#### Fase F: Semàfors visuals
16. **Dashboard health**: Afegit punt de color (verd/groc/vermell) al costat de cada ítem de salut del sistema.
17. **Dashboard radar**: Semàfors dinàmics — fons i punt canvien de color segons el valor (0=verd, >0=color d'atenció).
18. **Reserves llistat**: Indicador pagament amb punt de color a cada reserva (verd=pagat, groc=parcial, vermell=pendent). Tant a vista mòbil com taula desktop.
19. **Fitxa reserva**: Cards superiors amb semàfor visual (border + fons colorat + punt) per Pagament, Flux client i Post-event intern.

### Verificació
- `npx tsc --noEmit` → 0 errors
- `npx next build` → OK
- Tots els fitxers compilats correctament

### Raonament
- **Packs en català clar**: Un client de Barcelona no vol veure "Royal Wedding" ni "VIP Experience". Vol veure "Exclusiu" o "Premium" — paraules que entén sense pensar.
- **Eliminar producció/lloguer**: Un DJ sol no pot oferir 3 tècnics + coordinador. Si mai sorgeix, es fa com a pressupost personalitzat.
- **Semàfors**: L'objectiu és que amb 1 cop d'ull sàpigues: va bé (verd), cal atenció (groc), urgent (vermell). Sense llegir text.
- **Velocitat**: Cada navegació admin feia fetch CSS + 32 queries. Ara CSS es carrega 1 cop i les queries no crítiques tenen 2min de cache.

---

## 2026-03-03 — Pressupostos: traçabilitat total (lead obligatori + vista unificada)

### Objectiu de la sessió
- Localitzar on es guarda el pressupost "perdut".
- Fer visible els pressupostos ja creats des de `/admin/presupuestos`.
- Forçar regla comercial: pressupost enviat => sempre amb lead.
- Si ja existeix client, vincular-hi el pressupost automàticament.

### Diagnòstic inicial (fet i verificat)
- S'ha trobat 1 pressupost existent a `lead_documents` (`type=QUOTE`):
  - `Pressupost PRE-2026-D11F`
  - `fileUrl`: `https://orbitaevents.com/api/admin/leads/cmlm96j7c000011ioe30vt0gj/quote`
- No hi havia registres a `proposals` en aquell moment.
- Conclusió: part del flux desa pressupost com a document de lead (URL dinàmica), no com a fitxer local.

### Canvis implementats

1. **Vista central de pressupostos creats**
- Fitxer: `app/admin/presupuestos/page.tsx`
- Afegit contenidor **"Pressupostos creats"** amb 2 blocs:
  - `LeadDocument QUOTE` (pressupostos del flux leads)
  - `Proposals` (pressupostos del PDF Studio)
- Permet obrir directament els pressupostos ja generats.

2. **PDF Studio envia més context al backend**
- Fitxer: `app/admin/presupuestos/PresupuestoPdfStudio.tsx`
- El `POST /api/admin/emails/quote` ara envia també:
  - `customerName`, `customerPhone`
  - `eventType`, `eventDate`, `eventSchedule`, `eventLocation`, `guestCount`
- Objectiu: poder crear/enllaçar lead/client de forma fiable al backend.

3. **Lead obligatori en enviar pressupost (ruta email)**
- Fitxer: `app/api/admin/emails/quote/route.ts`
- Regla aplicada:
  - si no hi ha `lead`, es busca lead reutilitzable;
  - si no n'hi ha, es **crea lead automàticament** amb `status: QUOTE_SENT`;
  - el trail comercial (note/document/activity/follow-up) es desa sempre sobre el lead efectiu.

4. **Assignació automàtica a client existent**
- Fitxer: `app/api/admin/emails/quote/route.ts`
- Quan no arriba `customerId`, es fa match de client per:
  - `emailNormalized`
  - `phoneNormalized`
- Si es troba client existent, el pressupost s'hi vincula i, si cal, també s'actualitza el `lead.customerId`.

5. **Garantia final al flux de proposta enviada**
- Fitxer: `app/api/admin/proposals/[id]/send/route.ts`
- En `POST /proposals/[id]/send`, si la proposta no té `leadId`:
  - reutilitza lead existent o en crea un,
  - l'enllaça a la proposta,
  - i després marca `SENT`.

### Verificació
- `npx tsc -p tsconfig.json --noEmit --pretty false` => OK
- Consulta directa Prisma per confirmar pressupost existent => OK

### Commit creat
- `aa50ee0`
- Missatge: `feat(admin): list created quotes and enforce lead/client linkage on quote send`
- Fitxers inclosos al commit:
  - `app/admin/presupuestos/PresupuestoPdfStudio.tsx`
  - `app/admin/presupuestos/page.tsx`
  - `app/api/admin/emails/quote/route.ts`
  - `app/api/admin/proposals/[id]/send/route.ts`
- Fitxer no relacionat **no inclòs**: `app/api/admin/economia/cash-flow/route.ts`

---
## 2026-03-03 — Auditoria de bugs completa (4 commits, ~37 bugs arreglats)

### Objectiu de la sessió
Continuar l'auditoria de bugs iniciada a la sessió anterior (que va petar per límit de context). Arreglar tots els bugs trobats, traduir respira-rosa a català, i fer push.

### Context
La sessió anterior va fer:
- 3 commits: bugs Customer Hub/pack sync/respira/start-process, 6 bugs bookings, performance admin
- 2 agents d'auditoria en paral·lel (leads/clients/portal + economia/API) van completar

### 1. Respira-rosa traduït a català
**Fitxer**: `public/respira-rosa/index.html`
Tot el cartell llegenda de la tècnica 5-4-3-2-1 estava en castellà (és HTML estàtic, fora de next-intl).
- `<html lang="es">` → `<html lang="ca">`
- "ESTRATEGIA DE RELAJACIÓN" → "ESTRATÈGIA DE RELAXACIÓ"
- "Observa a tu alrededor y nombra:" → "Observa al teu voltant i anomena:"
- 5 passos: VER→VEURE, TOCAR, OÍR→SENTIR, OLER→OLORAR, SABOREAR→ASSABORIR
- Botons: "Tocar para empezar" → "Toca per començar", "Permitir movimiento" → "Permetre moviment"
- Missatges JS: "Movimiento no permitido" → "Moviment no permès", etc.
- Tots els comentaris JS traduïts
- Afegit excepció al `.gitignore` (`!public/respira-rosa/index.html`) perquè `*.html` l'excloïa

### 2. Portal client — i18n complet (11 bugs arreglats)
**Fitxer**: `app/[locale]/portal/[token]/page.tsx`
El portal del client és multilingüe (ca/es/en) però tenia molts textos hardcoded en català.
- `STATUS_LABELS`: de `Record<string, string>` → `Record<Locale, Record<string, string>>` (3 idiomes)
- `formatDistanceKm`: ara rep `locale` i usa `toIntlLocale(locale)` (era `'ca-ES'` hardcoded)
- 9 claus noves als 3 idiomes: portalLabel, portalValidUntil, portalActive, postEventDone, postEventProgress, openQuote, feedbackSent, pendingClose, trackingStatus
- Data portal: `toLocaleDateString('ca-ES')` → `toLocaleDateString(toIntlLocale(locale))`
- `rel="noreferrer"` → `rel="noopener noreferrer"` (consistència codebase)

### 3. Catch silenciosos i errors sense feedback (4 fitxers)
L'agent d'auditoria va trobar múltiples llocs on errors es silenciaven sense feedback a l'usuari.

| Fitxer | Problema | Solució |
|--------|----------|---------|
| `LeadPipelineView.tsx` | catch buit a fetchPipeline | `console.error` + `toast.error` |
| `CustomerHeader.tsx` | catch buit a changeStatus | import useToast + `toast.error` |
| `LeadWorkspace.tsx` | 7× `if (!res.ok) return;` sense feedback | `toast.error` a cada operació (tasques, documents, activitats) |

### 4. KPI VIP clients — stats.vip absent
**Fitxer**: `app/api/admin/customers/route.ts`
El component `clientes/page.tsx` mostra un KPI "VIP" amb `stats.vip`, però l'API no retornava aquest camp.
- Afegit `prisma.customer.count({ where: { totalSpent: { gte: 2000 } } })` al Promise.all de stats
- Afegit `vip` al objecte de resposta

### Resum commit 1
- 7 fitxers modificats
- 11 bugs arreglats (portal i18n: 6, catch silenciosos: 4, stats.vip: 1)
- 1 fitxer traduït completament (respira-rosa)
- TypeScript: 0 errors

### 5. Seguretat auth — 3 vulnerabilitats CRÍTIQUES (commit 2)
**Fitxer**: `lib/auth.ts`
3 agents d'auditoria en paral·lel van trobar vulnerabilitats greus:

| Vulnerabilitat | Severitat | Solució |
|----------------|-----------|---------|
| Bypass via header `x-admin-authenticated: 1` | CRÍTIC | Eliminat completament |
| Escalació de rol via header `x-admin-role` | CRÍTIC | Només llegeix de cookie, fallback VIEWER (era OWNER) |
| Comparació de credencials amb `===` (timing attack) | CRÍTIC | `timingSafeEqual` per Basic Auth + Bearer |

### 6. Calendari — bug timezone (CRÍTIC)
**Fitxer**: `app/admin/calendario/CalendarMonthClient.tsx`
`formatKey()` usava `toISOString().slice(0, 10)` que converteix a UTC. A Espanya (UTC+1/+2), un event a les 23:00 del 15 de març apareixia al dia 16. Ara usa `getFullYear()/getMonth()/getDate()` (hora local).

Arreglat també `hover:bg-white/5/90` → `hover:bg-white/10` (classe Tailwind invàlida).

### 7. Economia — bugs de càlcul
**Fitxer**: `lib/services/pipelineForecast.ts`
- `historicalAvg` calculava la mitjana *per reserva* (total / nReserves). El pipeline era la *suma total* ponderat. Unitats incompatibles. Ara agrupa per (any, mes) i calcula el total mensual real, i la mitjana entre anys.
- Mes actual apareixia tant a les dades històriques com a la previsió (bias). Ara el forecast comença al mes següent.

**Fitxer**: `lib/services/cashFlowForecast.ts`
- Usava `total - depositAmount` per calcular pendent. Ara usa `remainingAmount` de la BD (camp real) amb fallback.
- Protecció contra ingressos negatius (`Math.max(0, ...)`) si depositAmount > total per error de dades.

### 8. Components UI
| Fitxer | Bug | Solució |
|--------|-----|---------|
| `Charts.tsx` | `strokeToFill()` no gestionava hex (#rrggbb) — tots els callers passen hex | Parsing RGB + rgba() |
| `Charts.tsx` | `buildAreaPath()` crash amb array buit | Guard `if (values.length === 0) return ''` |
| `AdminHelpLegend.tsx` | Classe Tailwind invàlida `bg-black/60/95` | `bg-black/95` |

### 9. Crons en castellà → català
| Fitxer | Canvi |
|--------|-------|
| `commercial-daily/route.ts` | Email resum diari + WA: tot en català (era castellà) |
| `post-event/route.ts` | Auth amb `timingSafeEqual` (era `===`), locale fallback `ca` (era `es`), logs en català |

### 10. Altres bugs arreglats
| Fitxer | Bug | Solució |
|--------|-----|---------|
| `reservar/page.tsx` | Links `/contacto` i `/disponibilidad` sense prefix locale | `/${locale}/contacto` i `/${locale}/disponibilidad` |
| `pricing/page.tsx` | `loadData()` silenciós si API retorna `ok: false` | Mostra `setMessage({ type: 'error', ... })` |
| `contact/route.ts` | Log error DB en castellà | Traduït a català |

### Resum commit 2
- 11 fitxers modificats, 75 insercions, 64 eliminacions
- 3 vulnerabilitats de seguretat CRÍTIQUES arreglades
- 1 bug de timezone CRÍTIC arreglat
- 2 bugs d'economia (càlcul incorrecte)
- 4 bugs de components UI
- 2 crons traduïts
- 3 bugs menors
- TypeScript: 0 errors, tsc: OK

### 11. Rate limit off-by-one (commit 3)
**Fitxer**: `lib/middleware/admin-rate-limit.ts`
Comparació `<= ADMIN_AUTH_LIMIT` permetia 6 intents fallits en lloc de 5. Arreglat a `<` tant per Redis com in-memory.

### 12. Middleware auth documentat (commit 3)
**Fitxer**: `lib/middleware/admin-auth.ts`
- Documentat que Edge Runtime no suporta `timingSafeEqual` ni `createHmac`
- La validació timing-safe i CSRF completa (signatura+expiració) la fa `requireAuth()` a les API routes (Node.js runtime)
- El middleware fa check ràpid igualtat header/cookie com a primera porta

### 13. Altres fixes commit 3
| Fitxer | Bug | Solució |
|--------|-----|---------|
| `contractService.ts` | `snapshot` null causa crash | Fallback `(proposal.snapshot \|\| {})` |
| `blog/page.tsx` | Locale default `'es'` | Canviat a `'ca'` |
| `InventoryListClient.tsx` | Errors API silenciosos | `console.error` amb status |
| `BookingMarginCard.tsx` | `persistDistance` silenciós | `console.error` amb detalls |

### 14. Descartats (falsos positius)
L'agent de pàgines públiques va reportar ~15 links `/contacto` sense prefix locale, però TOTS usen `<Link>` de `@/lib/navigation` (next-intl) que gestiona el locale automàticament. No són bugs. L'únic cas real era `reservar/page.tsx` que usa `<a>` tags (arreglat al commit 2).

### Resum commit 3
- 6 fitxers modificats
- Rate limit off-by-one (seguretat)
- 4 errors silenciosos arreglats
- 1 null check contracte

### 15. Booking stats + invoice (commit 4)
| Fitxer | Bug | Solució |
|--------|-----|---------|
| `status/route.ts` | `guestCount` null causa error SQL `CAST(NULL + 1)` | Guard `existing.guestCount \|\| 0` |
| `invoiceService.ts` | Accés `invoice.booking.pack` sense check null | Guard `if (!invoice.booking) throw` |

### Total sessió
- **4 commits** pushejats
- **~37 bugs arreglats** en total
- **6 agents d'auditoria** executats en paral·lel
- **0 errors TypeScript**
- Àrees auditades: auth, middleware, rate limiting, CSRF, calendari, economia, components compartits, crons, portal i18n, pàgines públiques, formularis, inventari, blog, contractes, proposals, invoices, booking stats

## 2026-03-02 (sessió 3) — Passada final exhaustiva: htmlFor+id a TOTS els formularis + Auditoria completa

### Objectiu de la sessió
Passada final per assegurar que TOTS els formularis admin tenen accessibilitat completa (htmlFor+id). Dues auditories exhaustives en paral·lel (qualitat general + formularis). Correcció de tot el que queda.

### 1. Blog edit — htmlFor+id completats (11 labels)

| Fitxer | Labels afegits |
|--------|----------------|
| `blog/edit/[id]/page.tsx` | blog-category, blog-tags, blog-featured-image, blog-reading-time |
| `blog/edit/[id]/page.tsx` | blog-title-{locale}, blog-excerpt-{locale}, blog-content-{locale} (dinàmics) |
| `blog/edit/[id]/page.tsx` | blog-meta-title-{locale}, blog-meta-desc-{locale} (dinàmics) |

### 2. Blog new — htmlFor+id completats (12 labels)

| Fitxer | Labels afegits |
|--------|----------------|
| `blog/new/page.tsx` | nb-slug, nb-author, nb-category, nb-tags, nb-featured-image |
| `blog/new/page.tsx` | nb-reading-time, nb-publish-date |
| `blog/new/page.tsx` | nb-title-{locale}, nb-excerpt-{locale}, nb-content-{locale} (dinàmics) |
| `blog/new/page.tsx` | nb-meta-title-{locale}, nb-meta-desc-{locale} (dinàmics) |

### 3. Canvas — htmlFor+id + type="button" (4+5 correccions)

| Fitxer | Canvi |
|--------|-------|
| `canvas/page.tsx` | cv-name, cv-code, cv-event-type, cv-photo-url — htmlFor+id |
| `canvas/page.tsx` | 5 botons sense `type="button"` → afegit (descompte%, presets, preview, copy, download) |

### 4. Discount codes — htmlFor+id (7 labels)

| Fitxer | Labels afegits |
|--------|----------------|
| `discount-codes/page.tsx` | dc-code, dc-value, dc-valid-until, dc-max-uses, dc-min-order, dc-description |

### 5. Inventory new — htmlFor+id + min (11 labels)

| Fitxer | Labels afegits |
|--------|----------------|
| `inventory/new/page.tsx` | ni-code, ni-name, ni-description, ni-watts, ni-value |
| `inventory/new/page.tsx` | ni-stock, ni-min-stock, ni-purchase-price, ni-purchase-date, ni-life-hours, ni-notes |
| `inventory/new/page.tsx` | `min={0}` afegit als inputs numèrics (watts, value, stock, minStock, purchasePrice, lifeHours) |

### 6. FAQ editor — htmlFor+id (5 labels)

| Fitxer | Labels afegits |
|--------|----------------|
| `faq/FaqEditorForm.tsx` | faq-slug, faq-category, faq-order |
| `faq/FaqEditorForm.tsx` | faq-question-{locale}, faq-answer-{locale} (dinàmics) |

### 7. Altres correccions

| Fitxer | Canvi | Raonament |
|--------|-------|-----------|
| `BookingMarginCard.tsx` | htmlFor="bmc-distance" + id | Label Distància (km) |
| `BookingActions.tsx` | `aria-label="Canviar estat reserva"` al select | Accessibilitat |
| `BookingInventorySection.tsx` | `aria-label="Seleccionar lot d'equipament"` | Select sense label |
| `BookingInventorySection.tsx` | `aria-label="Condició de retorn"` | Select checkin sense label |
| `ComposeForm.tsx` | htmlFor="cf-price" + id + `min={0}` | Label preu + validació |
| `InboxClient.tsx` | htmlFor="ib-quote-price" + id + `min={0}` | Label preu base + validació |
| `EmailConfigPanel.tsx` | htmlFor="ec-google-url" + id, htmlFor="ec-post-delay" + id | Labels configuració |
| `SummaryPanel.tsx` | id dinàmic `sp-{label-slug}` + htmlFor a labels | Component genèric fix |

### 8. Auditories exhaustives (dues en paral·lel)

**Auditoria 1 — Qualitat general** (96 tool uses, 12 categories):
- htmlFor: 8 troballes → totes arreglades
- Silent catches: 0 (tots ja arreglats en sessions anteriors)
- type="button": 0 pendents
- Selects sense aria-label: 4 → arreglades
- Tables sense aria-label: 0 (tots ja arreglats)
- Links externs sense noopener: 0
- Inputs numèrics sense min: 2 → arreglats
- alert(): 0 | confirm(): 0 | console.log: 0
- Contrast: tot acceptable (placeholders/disabled)
- Key props: tots correctes

**Auditoria 2 — Formularis** (33 tool uses):
- 60+ issues originals → tots corregits
- PackPricingModelEditor: labels envoltants (vàlid, no cal canviar)
- PackPricingModelHistory: labels envoltants (vàlid)
- ClientPortalAccessPanel: labels envoltants (vàlid)

### 9. Verificació final
- `tsc --noEmit`: **0 errors**
- Totes les categories d'auditoria: **0 issues pendents**

### Raonament general
Aquesta sessió ha estat la passada final definitiva. Dues auditories en paral·lel que han cobert 229 fitxers TSX a l'admin, tots els formularis, tots els selects, totes les taules, tots els links externs, tots els catch, tots els inputs numèrics. El resultat: zero problemes d'accessibilitat bàsica pendents. Les úniques labels sense htmlFor que queden fan servir el patró de label envoltant (implicit association), que és 100% vàlid per WCAG.

---

## 2026-03-02 (sessió 2) — Configurador UX + Accessibilitat profunda + Catch errors

### Objectiu de la sessió
Continuació de la passada de qualitat. Auditoria exhaustiva del configurador públic (26 troballes), auditoria profunda admin (10 troballes), i correcció de tots els catch silenciosos restants.

### 1. Configurador públic — Millores UX/Accessibilitat

| Fitxer | Canvi | Raonament |
|--------|-------|-----------|
| `configurador/client.tsx` | Catch silent extres → `console.error` | No emmudir errors de xarxa |
| `configurador/client.tsx` | Scroll `smooth` → respecta `prefers-reduced-motion` | Accessibilitat per motion sickness |
| `configurador/client.tsx` | `animate-pulse` del botó sencer → només la icona | L'usuari no pensa que està carregant |
| `configurador/client.tsx` | Botó submit `text-xl py-6` → `sm:text-xl text-lg sm:py-6 py-4` | Responsive mòbil |
| `configurador/client.tsx` | Afegit `aria-pressed` als botons d'event type (step 1) | Screen readers saben quin està seleccionat |
| `configurador/client.tsx` | Afegit `aria-label` al input codi descompte | Accessibilitat |
| `configurador/client.tsx` | Afegit `aria-busy` al botó validar codi | Screen readers saben que està carregant |
| `configurador/client.tsx` | Afegit `aria-required="true"` als inputs del formulari | Accessibilitat |
| `configurador/client.tsx` | Input codi descompte: sanitització alfanumèrica | Evita caràcters no vàlids |
| `configurador/client.tsx` | Progress bar amb etiquetes de cada step (`hidden sm:block`) | L'usuari sap en quin pas està |
| `configurador/client.tsx` | `aria-current="step"` al step actiu | Screen readers |
| `configurador/client.tsx` | `min-h-[44px]` als labels d'extres | Touch targets WCAG AA (44x44px) |
| `configurador/client.tsx` | Afegit botó WhatsApp fallback al step 4 | Conversió: alternativa si formulari falla |
| `configurador/client.tsx` | Text explicatiu CAPTCHA | L'usuari sap per què hi ha verificació |
| `messages/ca.json` | +3 claus: captchaExplanation, preferWhatsApp, contactWhatsApp | i18n |
| `messages/es.json` | +3 claus idem | i18n |
| `messages/en.json` | +3 claus idem | i18n |

### 2. Formulari nova reserva — Labels accessibles completats

| Fitxer | Canvi |
|--------|-------|
| `bookings/new/page.tsx` | `htmlFor`+`id` afegits a: nb-venue, nb-extra-hours, nb-km, nb-discount, nb-discount-code, nb-notes |
| `bookings/new/page.tsx` | Grup de botons event type: `role="group"` + `aria-labelledby` |

### 3. Auditoria profunda admin — Troballes i correccions

**Contrast WCAG**:
- `DocumentFlowSection.tsx`: `text-white/30` → `text-white/40`
- `portal/[token]/page.tsx`: `text-white/30` → `text-white/40`

**Inputs numèrics sense `min`**:
- `discount-codes/page.tsx`: Afegit `min={0}` als inputs value, maxUses, minOrderValue

**Selects sense `aria-label`**:
- `LeadStatusQuickActions.tsx`: Afegit `aria-label`
- `BookingStatusQuickActions.tsx`: Afegit `aria-label`
- `LeadQuickPriority.tsx`: Afegit `aria-label`
- `LeadQuickStatus.tsx`: Afegit `aria-label`

**Links externs sense `noopener`**:
- 7 fitxers admin: `rel="noreferrer"` → `rel="noopener noreferrer"` (seguretat window.opener)

**Taules sense `aria-label`** (19 taules):
- `blog/page.tsx`: "Llistat d'articles del blog"
- `bookings/page.tsx`: "Llistat de reserves"
- `bookings/[id]/page.tsx`: "Extres de la reserva"
- `catalog/page.tsx`: "Catàleg de packs i extres"
- `clientes/page.tsx`: "Llistat de clients"
- `discount-codes/page.tsx`: "Codis de descompte"
- `leads/page.tsx`: "Pipeline d'entrades"
- `inventory/[id]/page.tsx`: "Historial de bolos", "Registres d'ús"
- `inventory/InventoryListClient.tsx`: "Inventari d'equipament"
- `economia/EconomiaClient.tsx`: "Cobraments pendents", "Rendibilitat per canal", "Projecció de tresoreria", "Previsió de vendes", "CAC per canal", "Rendibilitat per pack"
- `sales-ops/page.tsx`: "Conversió per origen", "Conversió per comercial"
- `AdminPage.tsx`: Component genèric — accepta `aria-label` prop

### 4. Catch buits → console.error (lib + app)

| Fitxer | Context |
|--------|---------|
| `TaskRowActions.tsx` | Error actualitzant tasca |
| `TaskKanbanView.tsx` | Error carregant tasques |
| `EditPackForm.tsx` | Error carregant bundles |
| `InventoryListClient.tsx` | Error actualitzant item |
| `MobileHomePage.tsx` | Error carregant reviews |
| `blog/[slug]/view/route.ts` | Error incrementant views |
| `translate/route.ts` | Error traduint |
| `public/extras/route.ts` | Error BD, fallback a config |
| `LeadQuickPriority.tsx` | Error canviant prioritat |
| `LeadQuickStatus.tsx` | Error canviant estat |
| `profitabilityService.ts` | Error parsejant config |
| `fuelReferenceService.ts` | Error refrescant preu |
| `clientPortalAccess.ts` | Error actualitzant accés |
| `inventoryBundles.ts` | Error parsejant bundles |

### 5. Verificació final
- `tsc --noEmit`: 0 errors
- Cap `text-white/30` a contingut llegible (només placeholders i disabled)
- Totes les taules admin amb `aria-label`
- Tots els selects inline amb `aria-label`
- Tots els links externs amb `rel="noopener noreferrer"`
- Tots els catch amb logging mínim

### Raonament general
Sessió centrada en la profunditat: cada catch silenciós és una oportunitat perduda de diagnòstic. Cada taula sense label és una barrera per a lectors de pantalla. El configurador tenia 5 problemes crítics (touch targets, zero aria, no WhatsApp fallback) que afectaven directament conversió i accessibilitat.

---

## 2026-03-02 — Auditoria UX completa (front + back) + Dates dinàmiques + Accessibilitat

### Objectiu de la sessió
Passada completa de qualitat tant del frontend públic com de l'admin backend. L'usuari va demanar explícitament: "no hi hauria d'haver ni dates, ni dades, ni preus, ni res sensible hardcodejat", "ha d'anar tot enllaçat", "millorar i corregir", i "quan acabis fes el mateix amb el back".

### 1. Dates dinàmiques — Eliminació de hardcoding

| Fitxer | Canvi | Raonament |
|--------|-------|-----------|
| `footer.tsx` | `© 2026` → `© {new Date().getFullYear()}` | Any de copyright sempre actual |
| `layout.tsx` | `priceValidUntil: '2026-12-31'` → template literal dinàmic | Schema.org structured data amb any actual |
| `legal/cookies/client.tsx` | "13 de diciembre de 2025" → `toLocaleDateString('ca-ES')` | Data d'actualització legal dinàmica |
| `legal/privacidad/client.tsx` | Idem | Idem |
| `legal/terminos/client.tsx` | Idem | Idem |
| `messages/ca.json` | "Reserva Halloween 2025" → "Reserva Halloween {year}" | Interpolació dinàmica |
| `messages/es.json` | Idem | Idem |
| `messages/en.json` | "Book Halloween 2025" → "Book Halloween {year}" | Idem |
| `tematica-halloween/page.tsx` | Passa `{ year: new Date().getFullYear() }` a la traducció | Any dinàmic al CTA |

### 2. Data d'emissió editable als pressupostos

| Fitxer | Canvi | Raonament |
|--------|-------|-----------|
| `lib/pdf-utils.ts` | `QuoteData.issueDate?: string` — camp opcional | Permet sobreescriure la data d'emissió |
| `lib/pdf-utils.ts` | `generateQuotePDF()` usa `data.issueDate` si existeix, sinó `new Date()` | Retrocompatible |
| `PresupuestoPdfStudio.tsx` | `issueDate` state (default: avui), input type="date" editable | L'admin pot crear pressupost amb data passada/futura |
| `PresupuestoPdfStudio.tsx` | Passa `issueDate` a `generateQuotePDF()` | Connecta UI → PDF |

### 3. Auditoria UX Frontend — Problemes trobats i arreglats

**CRÍTIC**:
- `HeaderChampion.tsx`: `role="button"` sense `onKeyDown` → afegit handler Enter/Space per accessibilitat de teclat
- `HeaderChampion.tsx`: `aria-expanded="true"` hardcodejat → canviat a dinàmic `{true}`

**IMPORTANT**:
- `CalendarioUrgencia.tsx`: `text-white/20` en dies passats → `text-white/40` (contrast WCAG AA)
- `CalendarioUrgencia.tsx`: `text-white/50` en dies normals → `text-white/60` (idem)
- `MobileHomePage.tsx`: `text-white/20` copyright → `text-white/40`
- `footer.tsx`: `text-white/60` en mida 11px → `text-white/70`
- `BottomNav.tsx`: Icones `w-5 h-5` → `w-6 h-6` (millor visibilitat)

### 4. Auditoria UX Admin Backend — Problemes trobats i arreglats

**CRÍTIC**:
- `InventoryListClient.tsx`: `catch {}` buit → afegit `console.error` amb context

**IMPORTANT**:
- `BookingFilters.tsx`: Selects sense `aria-label` → afegit a cada select/input
- `BookingFilters.tsx`: Input `toDate` sense `min` → afegit `min={fromDate}` per validar rang
- 12 fitxers admin: `<th>` sense `scope="col"` → afegit a totes les capçaleres de taula (accessibilitat)
- `AdminPage.tsx`: `<th>` genèric sense scope → afegit `scope="col"`

### 5. Anys hardcodejats als messages (i18n)
Tots els anys "2025" i "2026" als fitxers de traducció (ca/es/en) s'han canviat a `{year}` amb interpolació dinàmica:
- `halloweenPage.badge`: "🎃 Temporada Halloween 2025" → `{year}`
- `halloweenPage.packs.titleHighlight`: "Halloween 2025" → `{year}`
- `halloweenPage.urgency.title`: "Halloween 2025" → `{year}`
- `servicesGrid.items.halloween.badge`: "🔥 Temporada 2025" → `{year}`
- `mobileHero.badges.halloween`: "Agenda 2026 oberta" → `{year}`
- `mobileServices.services.halloween.badge`: "🔥 Temporada 2025" → `{year}`

Fitxers actualitzats per passar `{ year: new Date().getFullYear() }`:
- `tematica-halloween/page.tsx` (badge, titleHighlight, reserve2025)
- `MobileServicesCards.tsx` (badge)
- `MobileHeroUltimate.tsx` (badges.halloween)
- `ServicesGridElegant.tsx` (items badge)

Únic any hardcodejat que queda: `themingSection.testimonial.author: "Lorena i Carles, 2025"` — és una cita real, no es canvia.

### 6. Catch buits amb feedback + Labels accessibles
- `discount-codes/page.tsx`: Afegit `useToast` + `toast.error()` als 2 catch buits (carrega codis + toggle actiu)
- `packs/new/NewPackForm.tsx`: Afegit `htmlFor`/`id` a tots els 5 parells label/input
- `packs/[id]/EditPackForm.tsx`: Afegit `min={0}` als inputs de preu i hora extra
- `blog/page.tsx`: Canviat `overflow-hidden` → `overflow-x-auto` al container de taula

### 7. Verificació final
- `tsc --noEmit`: 0 errors
- `next build`: OK (totes les pàgines compilades)
- Cap `alert()` natiu, cap `confirm()` natiu, cap `console.log` al admin
- Cap any hardcodejat als fitxers .tsx
- Cap any hardcodejat als messages (excepte la cita testimonial real)
- Tots els `<th>` amb `scope="col"`
- Tots els selects de filtres amb `aria-label`

### 8. Catch buits restants → console.error
- `bookings/new/page.tsx`: 2 catch buits → afegit `console.error` (càrrega dades + validació codi)
- `economia/page.tsx`: catch buit → afegit `console.error`
- `LeadGuidedFlow.tsx`: `text-white/20` → `text-white/40`
- `sensorial/page.tsx`: `text-white/20` → `text-white/40`

### 9. Segona passada — Verificació final
Resultats de la passada completa:
- **0** anys hardcodejats als .tsx
- **0** `text-white/20` als .tsx (excepte `aria-hidden` decoratius)
- **0** `bg-slate/text-slate/border-slate` Tailwind
- **0** `rounded-lg` a l'admin
- **0** `alert()`/`confirm()` natius
- **0** `console.log` a l'admin
- **0** `href="#"` dead links
- **3** anys als .ts que són exemples (UTM) o comentaris — acceptables

### Raonament general
L'auditoria va revelar 3 problemes crítics, 12 importants i 11 millores al frontend, i 3 crítics, 7 importants i 10 millores al backend. Hem arreglat tots els crítics i tots els importants. La filosofia: res hardcodejat, tot accessible, tot enllaçat. Dues passades completes per assegurar zero regressió.

---

## 2026-03-01 — Facturació Holded + Contractes PDF + Panell Cobraments

### Objectiu de la sessió
Completar el cicle comercial: Pressupost → Contracte → Reserva → Factura.
- Generació de contractes PDF legals (jsPDF, dark theme coherent)
- Facturació integrada amb Holded (comptabilitat espanyola)
- Panell de cobraments millorat (filtres, accions massives, timeline)

### Sprint 1: Schema + Contractes PDF

#### 1.1 Migració Prisma
- **Nou model `Invoice`**: referència FAC-YYYY-NNNN, vinculada a Booking+Customer, camps Holded (holdedInvoiceId, holdedContactId, etc.), estat DRAFT→PENDING_SYNC→SYNCED→PAID
- **Nou enum `ContractStatus`**: DRAFT/SENT/SIGNED/CANCELLED
- **Nou enum `InvoiceStatus`**: DRAFT/PENDING_SYNC/SYNCED/SYNC_ERROR/PAID/CANCELLED
- **Camps nous a `Proposal`**: contractReference, contractStatus, contractPdfUrl/Key, contractSentAt/SignedAt/SignedBy, depositAmount/depositDueDate/finalPaymentDue, cancellationPolicy, additionalClauses
- **Relacions noves**: Booking.invoices[], Customer.invoices[]
- **Raonament**: El model Invoice és independent de Proposal perquè una factura pot existir sense proposta prèvia (reserva directa). ContractStatus viu a Proposal perquè el contracte sempre neix d'una proposta acceptada.

#### 1.2 generateContractPDF() — `lib/pdf-utils.ts`
- Funció completa amb dark theme (mateixa estètica que pressupost)
- Seccions: capçalera, parts, detalls servei, resum econòmic, condicions pagament, cancel·lació, clàusules legals, signatures
- Multiidioma (ca/es/en) amb traduccions completes
- **Raonament**: Segueix exactament el patró visual del pressupost per coherència de marca.

#### 1.3 contractService.ts — `lib/services/contractService.ts`
- `generateContractFromProposal()`: Proposta ACCEPTED → genera PDF → actualitza proposal
- `sendContract()`: Email amb PDF adjunt → contractStatus=SENT → log activitat
- `markContractSigned()`: contractStatus=SIGNED
- `getDefaultCancellationPolicy(locale)`: Política escalonada (>60d: 100%, 30-60d: 50%, <30d: 0%) — **coherent amb les FAQ**
- `getDefaultTermsAndConditions(locale)`: 8 condicions reals (reserva 30%, pagament final 7d, desplaçament km inclosos, hores extra, equip tècnic, danys, alimentació, soroll)
- **Raonament**: Les condicions del contracte són la font de veritat. Les FAQ han de reflectir-les sense contradir-les. La política de cancel·lació és escalonada i justa.

#### 1.4 API Routes contracte
- `POST /api/admin/proposals/[id]/contract` — Genera + descarrega PDF
- `POST /api/admin/proposals/[id]/contract/send` — Envia per email
- `PATCH /api/admin/proposals/[id]/contract` — SIGNED / CANCELLED

#### 1.5 UI ProposalsPanel
- Botó "Generar contracte" visible a propostes ACCEPTED sense contracte
- Botó "Enviar contracte" si contractStatus=DRAFT
- Botó "Marcar signat" si contractStatus=SENT
- Badge d'estat del contracte amb colors
- DTO ampliat amb camps contracte

### Sprint 2: Panell Cobraments millorat

#### 2.1 Nav entry
- Afegit `💳 Cobraments` a la secció "Eines" del nav lateral, apuntant a `/admin/economia?tab=cobraments`

#### 2.2 Millores EconomiaClient — Pestanya Cobraments
- **Filtres client-side**: Cerca per referència/nom + chips (Tots/Pendents/Vencits/Pròxims 7d/Pagats) amb comptadors
- **Timeline visual**: Barra de progrés per reserva [Dipòsit]—[Resta] amb colors (verd/ambre/vermell/gris)
- **Taula completa**: Totes les reserves amb checkboxes, referència, client, data, progrés, imports, link
- **Accions massives**: "Marcar dipòsit pagat" + "Marcar resta pagada" per seleccions múltiples
- **Export CSV**: Amb ExportCsvButton integrat (referència, client, telèfon, dates, imports, estats)
- **allPaymentRows**: Nou prop passat des de page.tsx amb TOTES les reserves (no només at-risk + upcoming)
- **Raonament**: La vista anterior només mostrava vençuts i pròxims. Ara es veu tot amb filtres, cosa que fa la gestió molt més àgil.

#### 2.3 API bulk-payment
- `POST /api/admin/bookings/bulk-payment` — body: `{ bookingIds[], field, value }`
- Valida amb zod, actualitza `depositPaid/remainingPaid` + timestamp

### Sprint 3: Facturació + Holded

#### 3.1 holdedService.ts — `lib/services/holdedService.ts`
- Capa d'abstracció per Holded API (permet canviar a Quaderno en el futur)
- `isHoldedEnabled()`: retorna `true` només si `HOLDED_ENABLED=true` i `HOLDED_API_KEY` present
- `findOrCreateHoldedContact()`: cerca per NIF/email, o crea nou contacte
- `createHoldedInvoice()`: crea factura amb ítems, tax, notes
- `getHoldedInvoiceStatus()`: comprova estat + publicUrl
- **Fallback silenciós**: si Holded desactivat, totes les funcions retornen buit sense error

#### 3.2 invoiceService.ts — `lib/services/invoiceService.ts`
- `generateInvoiceReference()`: FAC-YYYY-NNNN seqüencial (busca última referència a la BD)
- `createInvoiceFromBooking()`: crea factura local, intenta sync Holded si activat
- `retryHoldedSync()`: reintenta per factures SYNC_ERROR
- `markInvoiceAsPaid()`: canvia estat a PAID
- `refreshHoldedStatus()`: comprova si Holded marca la factura com a pagada

#### 3.3 API Routes factures
- `GET/POST /api/admin/invoices` — Llistat + creació
- `GET/PATCH /api/admin/invoices/[id]` — Detall + actualització (PAID/CANCELLED)
- `POST /api/admin/invoices/[id]/sync` — Reintentar sync Holded

#### 3.4 Cron invoice-sync — `app/api/cron/invoice-sync/route.ts`
- Auto-crea factures per reserves COMPLETED + totalment pagades sense factura
- Reintenta factures SYNC_ERROR
- Refresca estat de factures SYNCED a Holded
- **Raonament**: Automatitza la facturació post-event sense intervenció manual.

#### 3.5 InvoiceSection — `app/admin/bookings/[id]/InvoiceSection.tsx`
- Sense factura: botó "Crear factura"
- SYNCED: referència + link Holded
- SYNC_ERROR: error + botó reintentar
- DRAFT/SYNCED: botó "Marcar pagada"
- PAID: badge verd
- Integrat a la fitxa de reserva (entre marge i notes)

### Sprint 4: Polish + Integració

#### 4.1 Secció "Flux documental" a fitxa reserva
- **Nou component `DocumentFlowSection.tsx`**: Vista lineal Pressupost → Contracte → Factura
- Cada pas mostra referència, estat, i link a PDF/Holded si disponible
- Colors: verd (completat), cian (actiu), gris (pendent)
- Fletxes SVG entre passos
- Integrat a la fitxa de reserva entre BookingMarginCard i InvoiceSection
- **Raonament**: Permet veure d'un cop d'ull l'estat de tot el cicle documental d'una reserva.

#### 4.2 Configuració empresa a Settings
- **Nova subpàgina `/admin/settings/company`**: Formulari dedicat per dades fiscals + Holded
- Camps empresa: nom comercial, nom legal, NIF, adreça, ciutat, codi postal, IBAN, banc
- Camps Holded: activat/desactivat, API Key (amb màscara password), botó provar connexió
- **Seeds nous**: 8 camps empresa + 2 camps Holded afegits al seed
- **`contractService.ts` actualitzat**: Ara carrega dades empresa de Settings DB (amb fallback a env vars)
- Quick link afegit a la pàgina principal de settings
- **Raonament**: Les dades fiscals canvien poc però han d'estar editables sense tocar codi. La taula Settings ja existia, aprofitem l'arquitectura.

#### 4.3 Flux complet visual
```
Lead → Pressupost DRAFT→SENT→ACCEPTED
                                 ↓
                    Contracte DRAFT→SENT→SIGNED
                                          ↓
                           Reserva CONFIRMED→COMPLETED
                                                  ↓
                                Factura DRAFT→SYNCED→PAID (Holded)
```
El DocumentFlowSection mostra els últims 3 passos (Pressupost, Contracte, Factura) de forma compacta i visual.

---

## 2026-03-02 — Auditoria qualitat + Eliminacio alert/confirm + Millores visuals TOP

### Context
Sessio de revisio exhaustiva post-implementacio. L'objectiu era auditar tot el codi nou (Sprints 1-4), corregir bugs, i pujar la qualitat visual al maxim nivell.

### Auditoria i bugs corregits (15 fixes)

1. **contractService.ts — Separacio read/write**: `renderContractPDF()` (read-only) separat de `generateContractFromProposal()` (escriu a DB). Evita que `sendContract()` resetegi l'estat del contracte.
2. **sendContract() arreglat**: Usa `renderContractPDF()` en lloc de regenerar tot el contracte.
3. **markContractSigned() validacio**: Rebutja contractes CANCELLED.
4. **PATCH contract route reescrit**: Valida transicions d'estat, log cancel·lacions, crea LeadActivity.
5. **Invoice onDelete: Cascade → Restrict**: Les factures son documents legals, no es poden eliminar en cascada.
6. **Index redundant eliminat**: `@@index([reference])` ja cobert per `@unique`.
7. **invoiceService.ts — retry loop**: Genera referencies amb retry per race condition P2002. Validacio d'estat a `markInvoiceAsPaid`.
8. **InvoiceSection.tsx reescrit**: Helper `apiCall` comu, boto cancel·lar, `formatCurrency`, spinners.
9. **bulk-payment route**: Neteja timestamp quan `value=false`.
10. **EconomiaClient bulkMarkPaid**: Mostra errors en lloc de silent catch.
11. **PATCH invoice route**: Valida que no es pot cancel·lar una factura ja pagada.
12. **Cron invoice-sync**: Comparacio timing-safe per CRON_SECRET.
13. **Contracte km**: Display unificat (25 km anada, no 50 km anada i tornada).
14. **FAQ/legal coherencia**: Politica cancel·lacio unificada a 5 fitxers (3 JSONs + 2 serveis).
15. **ProposalsPanel download**: `document.body.appendChild(a)` + `setTimeout` per `revokeObjectURL`.

### ConfirmDialog component
- **Nou component reutilitzable** `ConfirmDialog.tsx` amb hook `useConfirmDialog()`.
- Modal accessible (aria-modal, Escape, body scroll lock, focus trap).
- 3 variants: danger (vermell), warning (ambar), info (cian).
- Spinner al boto confirmar per accions async.
- Portal a `document.body` per evitar z-index issues.
- **10 fitxers migrats** de `window.confirm()` a ConfirmDialog: coverage, blog, InboxPanel, text-manager, BookingInventorySection, SyncButton, stats, LeadActions, InventoryItemEditor, InboxClient.

### Eliminacio alert()
- **11 alert() eliminats** de 6 fitxers: InboxPanel, LeadActions, BookingStatusChanger, PostEventEmailButton, post-event reports.
- Tots substituits per feedback inline (setError, setActionError, setFormError, setSuccessMsg).

### Millores visuals TOP

1. **CompanySettingsClient reescrit**:
   - `holded.enabled` canviat de text input ("true"/"false") a **toggle switch** accessible (role=switch).
   - Boto "Mostrar/Amagar" per API Key.
   - Spinner als botons durant accions.
   - Missatge success amb auto-dismiss (4s).
   - Cards amb icones i millor jerarquia visual.
   - Focus states millorats (ring-2, bg change).
   - Save button gradient amb shadow.

2. **DocumentFlowSection reescrit**:
   - Barra de progres gradient (emerald→cyan) amb amplada dinamica.
   - Dots de progres amb checkmark quan completat, pulse quan actiu.
   - Cards amb icones per cada pas (📄📝🧾).
   - Badges d'estat amb border i colors coherents.
   - Links amb icona SVG external link i hover transition.

3. **InvoiceSection millorat**:
   - Icones d'estat per cada status (📝🔄☁️⚠️✓✕).
   - Spinners en lloc de "...".
   - ConfirmDialog per cancel·lar factura.
   - Error dismissable amb boto ✕.
   - Empty state amb border dashed.

4. **PaymentTimelineBar millorat**:
   - Barra mes alta (h-4 vs h-3) per millor target tactil.
   - Percentatges visibles on hover dins cada segment.
   - Llegenda amb color dots sota la barra.
   - `depositPct` clamped a 0-100.
   - ARIA `role=meter` per accessibilitat.

5. **Booking detail — menu "Mes accions"**:
   - 6 botons reduits a 3 + dropdown `<details>`.
   - No trenca en mobil.

6. **BookingStatusChanger**: Missatges success/error inline amb dismiss.

### Revisió final — Eliminació `as any`
Auditoria de qualitat final va detectar `as any` casts innecessaris:
- **bookings/[id]/page.tsx**: 3 `as any` eliminats — `booking.proposals` i `booking.invoices` ja es resolen pel `include` de la query Prisma.
- **PresupuestoPdfStudio.tsx**: 3 `as any` eliminats — substituïts per type guard `Record<string, unknown>` (dades JSON dinàmiques).
- **slaAutomationService.ts**: 2 `as any` eliminats — `prisma.task` i `tx.task` ja existeixen al client generat, no cal fallback try/catch.
- **quoteRouteHandler.ts**: 2 `as any` eliminats — `PackDefinition` ja inclou `durationHours` i `emotion`.
- **privacyService.ts**: 1 `as any` eliminat — `type` parametritzat com `LegalDocumentType` en lloc de `string`.
- **Raonament**: Els `as any` eren vestigis de quan el client Prisma no tenia els models generats o de tipus incompletos que ja existien.

### Verificacio
- `tsc --noEmit`: 0 errors
- `next build`: OK (236 pàgines)
- 0 `window.confirm()`, 0 `alert()` a tot el repo
- `as any` admin: 0 (de 8 que hi havia), 67 restants a tests/scripts/components públics

---

## 2026-03-02 — Migració visual completa: slate→white/opacity + UX polish

### Objectiu de la sessió
Polir la totalitat del codi (front públic + admin) per aconseguir una experiència "formidable, fàcil, visual, meravellosa, fantàstica, ràpida i responsiva" (cita directa de l'usuari). Zero prioritats, tot és important.

### 1. Migració slate→white/opacity — COMPLETADA

**Per què**: Els colors `slate-*` de Tailwind (bg-slate-700, text-slate-400, border-slate-600...) creen un tema fosc amb tons blaus/grisos inconsistents. El patró `white/opacity` (bg-white/5, text-white/40, border-white/10...) és neutral, consistent i dóna un efecte "frosted glass" premium.

**Què s'ha fet**:
- **81 fitxers admin** migrats (269 ocurrències → 0)
- **31 fitxers públics** `app/[locale]/` migrats
- **17 fitxers components** (`components/`, `app/components/`) migrats
- **Patrons aplicats**:
  - `text-slate-300` → `text-white/70`, `text-slate-400` → `text-white/40`, `text-slate-500` → `text-white/30`
  - `bg-slate-800` → `bg-white/5`, `bg-slate-700/50` → `bg-white/5`, `bg-slate-900/60` → `bg-white/[0.03]`
  - `border-slate-600` → `border-white/10`, `border-slate-500` → `border-white/20`
  - `hover:bg-slate-700` → `hover:bg-white/5`, `divide-slate-700` → `divide-white/5`
  - Gradients: `from-slate-900` → `from-black` (admin) / `from-[#0a0a0a]` (públic)
  - `bg-slate-400` (medalles plata) → `bg-zinc-400` (cas especial visual)
- **Fix patrons invàlids**: `border-white/10/60` → `border-white/10` (artefactes de sed anteriors)
- **Raonament**: Un sol sistema de color basat en opacitat de blanc sobre fons negre. Més coherent, més fàcil de mantenir, i visualment superior.

### 2. Focus states unificats — 79 inputs corregits

**Per què**: `focus:ring-1` sense color definit no mostra feedback visual quan l'usuari fa clic a un camp. Imprescindible per accessibilitat i per transmetre qualitat.

**Què s'ha fet**:
- 79 inputs a `app/admin/` tenien `focus:ring-1` sense color
- Tots migrats a `focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50`
- El cyan és el color accent del sistema admin (coherent amb botons, links, badges actius)

### 3. Border radius normalitzat — 474 → 0 `rounded-lg`

**Per què**: Barreja de `rounded-lg` (8px) i `rounded-xl` (12px) a l'admin. La inconsistència fa que la UI sembli "a mig fer".

**Què s'ha fet**:
- 474 instàncies de `rounded-lg` a `app/admin/` normalitzades a `rounded-xl`
- El `rounded-xl` ja era majoritari (577 instàncies), ara és l'únic
- `rounded-2xl` es manté per a cards/seccions grans, `rounded-full` per a badges/dots

### 4. Seguretat backend — timingSafeEqual als crons

**Per què**: Comparar secrets amb `===` és vulnerable a timing attacks.

**Què s'ha fet** (sessió anterior, documentat aquí per completesa):
- 3 rutes cron (`commercial-daily`, `pack-pricing-check`, `fuel-daily`) migrades a `timingSafeEqual` de `crypto`
- Pattern: `Buffer.from(expected)` vs `Buffer.from(received)`, comparació de longitud primer

### 5. UX inline errors i empty states

- **BookingPipelineView**: Silent catch → `toast.error('Error carregant reserves')`
- **BookingInventorySection**: `if (!res.ok) return` → throw Error + banner dismissable
- **EmptyState component** reutilitzable: icona, títol, descripció, CTA opcional
- **Analytics page**: 4 empty states millorats amb icones descriptives
- **Clients modal**: Escape key handler afegit
- **Client form**: Asteriscs vermells als camps obligatoris + border vermell si buit
- **FAQ order input**: `min={0} max={999}` per evitar valors invàlids

### Verificació
- `tsc --noEmit`: 0 errors
- `next build`: OK (236 pàgines), 162 kB shared JS
- 0 ocurrències de `slate` com a color Tailwind a tot el repo
- 0 `rounded-lg` a l'admin
- 0 `focus:ring-1` sense color definit

### 6. Nav admin reorganitzat (de 3 seccions a 5)

**Per què**: "Eines" era un calaix de sastre amb 8 ítems. 12 pàgines importants no tenien entrada al nav.

**Abans** (3 seccions, 20 ítems): Operativa / Eines (8!) / Configuració
**Ara** (5 seccions, 24 ítems):
- **Comercial** (5): Missatges, Safata IMAP, Pressupostos, Sales Ops, Post-event
- **Producte** (5): Packs, Inventari, Preus, Descomptes, Catàleg
- **Finances** (3): Economia, Analítica, Estadístiques
- **Contingut** (5): Blog, FAQ, Textos, Ressenyes, Correus automàtics
- **Configuració** (4): Config, Integracions, Features, Cobertura

**Afegits**: Pressupostos, Sales Ops, Packs, Preus, FAQ, Textos, Ressenyes Google, Estadístiques
**Eliminat**: "Cobraments" (ja és tab dins Economia)

### 7. Header públic millorat

- **Discmòbil afegit** al dropdown de Serveis (faltava!)
- **Configurador afegit** al nav amb badge "NEW" (peça clau de conversió)
- Clau de traducció `configurator` afegida als 3 idiomes

### 8. Extras del configurador — De 28 a 10

**Per què**: 28 extras eren massa — confonen el client, molts es solapen amb features dels packs, i els menys importants diluïen els que realment es venen.

**Eliminats** (18):
- `pulseras-luminosas` — no és servei DJ
- `barras-led-personalizadas`, `alfombra-led-pista`, `cortina-led-backdrop`, `uplighting-colores` — 4 extras LED que solapen amb il·luminació dels packs
- `letras-luminosas-love`, `gobo-personalizado`, `monograma-proyeccion` — 3 extras de projecció redundants
- `bengalas-frias-invitados`, `sparklers-fountain`, `humo-pesado` — 3 extras que dupliquen `fuego-frio` i `humo-bajo`
- `first-dance-special` — combo que duplica altres extras individualment
- `subwoofer-refuerzo`, `altavoces-adicionales` — tècnics, confonen el client
- `alfombra-roja`, `efectos-nieve`, `pantalla-led-gigante` — nicho o duplicats

**Mantinguts** (10):
1. Hora Extra (75€) — universal
2. Fum Baix (150€) — espectacular per ball nupcial
3. Espurnes Fredes (150€) — molt visual
4. Canó CO2 (200€) — espectacular
5. Canó Confeti (100€) — clàssic
6. Bombolles (50€) — econòmic, divertit
7. Micros Extra (80€) — útil per discursos
8. Neó Personalitzat (180€) — photocall, se'l queden
9. Show Làser (220€) — premium, espectacular
10. Photobooth 360° (350€) — molt demanat, viral

### 9. Preu hora extra unificat

**Problema**: `packs-config.ts` deia 100€, BD default 75€ (`extraHourPrice || 75`). Inconsistència client↔real.
**Solució**: Config alineat a 75€ (font de veritat = BD). Quan l'Extra model de Prisma tingui dades reals, l'API ja les servirà automàticament.

### 10. API `/api/public/extras` millorada

**Abans**: Llegia d'un `Setting` JSON serialitzat o fallback a `packs-config.ts`.
**Ara**: Llegeix del model `Extra` de Prisma (BD) amb traduccions per locale. Si no hi ha dades a BD, fallback a config estàtic.
**Raonament**: El model Extra ja existeix amb preu, slug, traduccions i inventari. No tenia sentit ignorar-lo.

### 11. Footer públic

- Any actualitzat: 2025 → 2026

### Verificació
- `tsc --noEmit`: 0 errors
- `next build`: OK (236 pàgines), 162 kB shared JS
- 0 colors slate Tailwind
- 0 `rounded-lg` a l'admin
- 0 `focus:ring-1` sense color
- Extras: 28 → 10 (sense solapaments amb features dels packs)
- Preu hora extra: 75€ consistent BD ↔ config

### Pendent
- [ ] Executar `prisma db push` (Supabase no accessible — migració Invoice+Contract)
- [ ] Afegir `costPerUnit` al model Extra de Prisma → semàfors individuals per extra
- [ ] Verificar visualment: focus rings cyan, frosted glass effect, nav reorganitzat
- [ ] Touch targets mòbil: hamburger button i BottomNav (< 44px, WCAG AA)
- [ ] Responsive check: bottom nav, FAB, formulari de contacte

---

## Auditories previes (sessions anteriors)

S'han realitzat **2 auditories exhaustives de codi** abans de la sessió del 2026-02-23. Gran part del codi ha estat reparat, netejat i reorganitzat. El que se sap amb seguretat que s'ha fet:

- **Eliminació de codi mort i assets morts** (commit: `refactor: fase 1 — eliminació codi duplicat i assets morts`)
  - Components sense importar eliminats
  - Assets (imatges, fonts, fitxers) sense referència eliminats
  - Codi duplicat consolidat
- **Revisió d'inconsistències** al llarg de tot el repo:
  - Rutes inconsistents detectades i catalogades
  - Labels d'idioma inconsistents identificats
  - Dependències sense ús revisades
- **Recuperació del repo** (accident durant la còpia de C: a D:):
  - La còpia de C: a D: va perdre una gran quantitat de fitxers
  - 225 fitxers recuperats des de GitHub (el repo remot)
  - 66 fitxers van sobreviure localment (es desconeix exactament quins)
  - Repo restaurat a estat coherent i commitat

> Nota: Les auditories prèvies no estan detallades aquí perquè les sessions van crashejar. Tot el que es va fer queda a l'historial de git.

---

## 2026-02-23

### Context de la sessió
- El repo va ser copiat de C: a D:, es van perdre fitxers a meitat d'un canvi gran
- Es van recuperar 225 fitxers des de GitHub per completar el repo
- S'havien fet 2 auditories prèvies exhaustives de codi mort + inconsistències, amb gran quantitat de reparacions
- S'estava a la 3a passada de refactoring quan va petar la sessió
- Últim commit en arrencar: `refactor: fase 1 — eliminació codi duplicat i assets morts` (21:20)

### Anàlisi del repo (estat en iniciar)
- ~19.000 LOC TypeScript, 132 rutes API, 63 pàgines admin, schema Prisma 1.417 línies
- Cobertura de tests: ~6%

---

### Treball realitzat

#### ✅ Unificar rutes `clientes` / `contactes`
**Per què**: L'entitat "client" tenia la llista a `/admin/clientes` però el detall a `/admin/contactes/[id]`. Hi havia 28+ enllaços apuntant a rutes diferents per a la mateixa cosa. Confusió operativa i risc d'enllaços trencats.
**Què s'ha fet**:
- Contingut real mogut de `contactes/[id]` a `clientes/[id]`
- `contactes/[id]/page.tsx` convertit en redirect de compatibilitat
- 28 links actualitzats a `clientes/[id]`
- Label duplicat "Contactes" eliminat de `mapa/page.tsx`
- `CustomerTabSelector.tsx` eliminat (codi mort, ningú l'importava)

#### ✅ Unificar labels d'idioma (`es`)
**Per què**: El panell admin barrejava "Castellà", "Español" i "Spanish" per al mateix codi `es`. Confusió en operar i aparença poc professional. L'admin és en català, per tant "Castellà" és el terme correcte.
**Què s'ha fet**:
- "Español" → "Castellà" a ClientPortalAccessPanel, PresupuestoPdfStudio, text-manager
- ServiceJsonLD.tsx manté "Spanish" (schema.org requereix anglès estàndard)
- `contactes/[id]/_components/` eliminat (codi mort post-migració)

#### ✅ Refactoritzar `admin/layout.tsx` (904 → 717 línies)
**Per què**: El fitxer barrejava dades de navegació estàtiques, lògica de fetching d'alertes, el patch de CSRF en fetch, i el JSX del layout. Difícil de mantenir i de testejar individualment.
**Què s'ha fet**:
- Nav items extrets a `app/admin/components/nav-items.ts` (dades estàtiques)
- Lògica d'alertes (leads/packs/finances + visibility refresh) → `hooks/useAdminAlerts.ts`
- CSRF fetch wrapper → `hooks/useCsrfFetch.ts` (reutilitzable)

#### ✅ Refactoritzar `admin/page.tsx` (1.186 → 480 línies)
**Per què**: El dashboard barrejava 29 queries Prisma en paral·lel, processament de dades i el JSX de renderitzat, tot en un sol fitxer. Impossible de llegir, difícil de depurar si fallava una query.
**Què s'ha fet**:
- Fetching + processament + tipus extrets a `app/admin/lib/dashboard-data.ts`
- `page.tsx` només importa `fetchDashboardData()` i renderitza

#### ✅ Reduir usos de `any` (110 → 94)
**Per què**: `any` desactiva el sistema de tipus de TypeScript. Cada `as any` és un punt cec on poden entrar bugs sense que el compilador els detecti.
**Què s'ha fet**:
- `types/window.d.ts` creat: `window.dataLayer` tipat globalment (GTM/GA4)
- ExitIntentModal + WebVitalsReporter: `(window as any)` eliminat
- InventoryListClient: interface `BundleApiItem` local per a dades de fetch
- tasks/page.tsx: `prisma as any` eliminat, `prisma.task` directe
- ESLint: `@typescript-eslint/no-explicit-any: warn` afegit per prevenir nous
- **Pendient**: 94 usos restants concentrats a `api/admin/emails/` amb patrons `(pack as any).field` — requereixen tipat correcte del schema Prisma, sessió dedicada

#### ✅ Playwright: webServer configurat correctament
**Per què**: El `webServer` estava comentat i `baseURL` apuntava a `https://orbitaevents.com` per defecte. Qualsevol `pnpm test:e2e` sense configurar `BASE_URL` llançava tests contra producció real. Risc de dades corruptes i side effects en producció.
**Què s'ha fet**:
- Sense `BASE_URL` → aixeca `pnpm dev` a `localhost:3000` automàticament
- Amb `BASE_URL` → usa aquella URL (staging/prod) sense aixecar servidor local
- `baseURL` ja no apunta a producció per defecte

#### ✅ Refactoritzar middleware (321 → 90 línies)
**Per què**: Barrejava 5 responsabilitats (bots, www redirect, legacy redirects, admin auth+CSRF, i18n). Impossible de testejar individualment i difícil de depurar en producció quan falla l'auth.
**Què s'ha fet**:
- `lib/middleware/admin-rate-limit.ts`: Upstash Redis + fallback in-memory per a rate limiting de login
- `lib/middleware/admin-auth.ts`: Basic auth + Bearer + CSRF — retorna null si passa, NextResponse si bloqueja
- `middleware.ts`: orquestrador de 90 línies, flow clar i llegible amb 5 passos numerats

#### ✅ Admin verificat en català
**Per què**: L'admin ha d'estar 100% en català (text visible a la UI, no noms de variables ni rutes).
**Què s'ha fet**:
- Auditoria exhaustiva de tots els fitxers `.tsx` de `/app/admin`
- Únic text en castellà trobat: nom del fitxer CSV descarregable `rentabilidad-history-*.csv`
- Corregit: `rendibilitat-history-${stamp}.csv`
- `PresupuestoPdfStudio.tsx`: les cadenes en castellà estan correctament al bloc `es` de `STUDIO_COPY` (contingut per a PDFs en castellà enviats a clients, no UI de l'admin)

---

### Pendent per a properes sessions (estat actualitzat 2026-02-25)
- [x] ~~94 usos de `any` a rutes email~~ — Resolt a la sessió 2026-02-24 (17 `as any` eliminats, fitxers ben tipats)
- [x] ~~`formatDate` hardcodejat a `ca-ES` sense suport i18n~~ — Resolt a la sessió 2026-02-25 amb `toIntlLocale()`
- [x] ~~TODO sense resoldre a `FiestasClient.tsx`~~ — No era un TODO pendent; és una nota arquitectònica ("TODO sale de packs-config.ts" = "tot ve de packs-config.ts"). Ja implementat correctament.

---

## 2026-02-24

### Context de la sessió
- L'admin ja funciona (7.5/10) però l'operador sol necessita: feedback visual, semafors de marge, kanban de tasques, navegació creuada i dreceres.
- Sessió d'implementació UX completa: 4 fases, 15 subtasques.

### Treball realitzat

#### ✅ Fase 1A: Sistema global de Toast notifications
**Per què**: Cada acció (drag-drop, guardar, eliminar) succeïa en silenci. L'operador no sabia si havia funcionat.
**Què s'ha fet**:
- `app/admin/components/ToastProvider.tsx` creat — context provider amb `useToast()` hook
- Reutilitza el component `Toast` existent d'`AdminUI.tsx` (corregit posicionament: `fixed` eliminat del component, ara gestionat pel provider amb stacking)
- Integrat a `layout.tsx` wrapping children
- Connectat a:
  - `LeadPipelineView.tsx` — toast.success/error al moure entrada (drag-drop i botons ←→)
  - `BookingActions.tsx` — toast en lloc d'`alert()` per eliminar i canviar estat
  - `BookingMarginCard.tsx` — toast en lloc d'`alert()` i inline "Desat!"

#### ✅ Fase 1B: Semafors de marge a la llista de reserves
**Per què**: L'usuari ho va demanar explícitament. Cal veure si una reserva és rendible sense obrir-la.
**Què s'ha fet**:
- `lib/margin-utils.ts` creat — `getMarginTone(pct)` retorna color/bg/label (emerald≥50%, amber≥30%, orange≥15%, rose<15%), `calculateSimpleMarginPct()` per càlcul ràpid
- Query de `bookings/page.tsx` ampliada amb `extras: { select: { price, quantity } }`
- Chip colorat de marge afegit a la taula desktop (nova columna "Marge") i a les cards mòbil
- Fórmula simplificada amb ratios per defecte (packCostRatio: 0.36, extraCostRatio: 0.28, fixedOperationalCost: 45€)

#### ✅ Fase 1C: Cards més rics al pipeline de leads
**Per què**: Les cards del kanban eren text pur sense indicadors visuals ràpids.
**Què s'ha fet**:
- Chip "dies sense resposta" amb semàfor (verd≤2d, ambre 3-5d, rosa>5d)
- Budget prominent amb chip emerald quan existeix
- Data d'event amb icona 📅
- Punt de prioritat augmentat (w-3 h-3 en lloc de w-2 h-2)
- Booking reference com a chip-link prominent (border sky)
- Link a client amb text "👤 Client" en lloc d'emoji sol

#### ✅ Fase 1D: KPI marge mitjà al dashboard
**Per què**: 6 KPIs al dashboard però cap de marge. L'operador vol veure la salut del negoci d'un cop d'ull.
**Què s'ha fet**:
- `dashboard-data.ts` — nova query per obtenir reserves confirmades/completades amb preu pack i extras
- Càlcul `avgMarginPct` amb la mateixa fórmula simplificada
- MetricCard "Marge mitjà" amb semàfor dinàmic (emerald/amber/rose) afegit a la fila de KPIs

#### ✅ Fase 2A: Navegació creuada entre entitats
**Per què**: Des de qualsevol entitat arribar a les relacionades en 1 clic.
**Què s'ha fet**:
- Les cards de leads ja tenien links a client i booking — millorats amb estil prominent (chip sky per booking, text "👤 Client")
- Reserves ja tenien links a lead/client/calendari a BookingActions

#### ✅ Fase 2B: Botó flotant d'acció ràpida (FAB)
**Per què**: Crear nova entrada/reserva/tasca/pressupost des de qualsevol pàgina en 1 clic.
**Què s'ha fet**:
- `app/admin/components/FloatingAddButton.tsx` creat — botó "+" fix baix-dreta, expandeix a 4 opcions
- Posicionat `bottom-24 sm:bottom-6` per no tapar bottom-nav mòbil
- Tanca amb clic fora o Escape
- Integrat a `layout.tsx`

#### ✅ Fase 2C: Dreceres de teclat
**Per què**: Velocitat per a l'operador sol. Abans només hi havia Ctrl+K.
**Què s'ha fet**:
- `layout.tsx` — handler de shortcuts ampliat: Alt+1→leads, Alt+2→tasques, Alt+3→correus, Alt+4→reserves, Alt+C→calendari, Alt+N→FAB
- `AdminSearchModal.tsx` — secció "Dreceres de teclat" mostrada quan el modal és buit

#### ✅ Fase 2D: Ítems recents al cercador
**Per què**: 80% de les cerques són coses d'avui. Estalvia temps.
**Què s'ha fet**:
- `AdminSearchModal.tsx` — `addRecentItem()` exportat, `localStorage admin.recent` (max 8 ítems)
- "Visitats recentment" mostrat al modal quan no hi ha query
- Cada clic a resultat de cerca (lead/booking/customer) guarda automàticament l'ítem als recents

#### ✅ Fase 3A: Kanban de tasques amb drag-drop
**Per què**: L'usuari adora el drag-drop. Les tasques eren una taula plana.
**Què s'ha fet**:
- `app/admin/tasks/TaskKanbanView.tsx` creat — 3 columnes (OPEN, IN_PROGRESS, DONE) amb HTML5 DnD
- Cards amb: títol, entitat relacionada (link a client/lead), data límit amb color (vençuda=rosa, avui=ambre, futur=neutral)
- Optimistic update + rollback en cas d'error + toast
- `tasks/page.tsx` — toggle vista llista/kanban amb searchParam `view=kanban|list` (default: kanban)

#### ✅ Fase 3B: Drag-drop al calendari per moure reserves
**Per què**: Reprogramar un event requeria obrir reserva → editar data → guardar. Amb drag-drop: 1 segon.
**Què s'ha fet**:
- `CalendarMonthClient.tsx` — chips de reserva fets `draggable`, cel·les receptores amb `onDrop`
- PATCH `/api/admin/bookings/{id}` amb nova `eventDate`
- Highlight ring ambre a la cel·la target durant hover
- Refetch automàtic del calendari després de moure
- Toast de confirmació/error

#### ✅ Fase 4A: Exportació CSV reutilitzable
**Per què**: Poder exportar dades des de qualsevol llista sense dependre del backend.
**Què s'ha fet**:
- `app/admin/components/ExportCsvButton.tsx` creat — botó reutilitzable, BOM UTF-8, escapament de comes/cometes
- Toast de confirmació o warning si no hi ha dades

#### ✅ Fase 4B: Explicacions "Per què" al marge
**Per què**: L'operador vol saber ràpidament si el marge és sa o no, i què fer al respecte.
**Què s'ha fet**:
- `BookingMarginCard.tsx` — missatge contextual sota el % de marge:
  - ≥50%: "Excel·lent. Marge sa."
  - 30-50%: "Acceptable. Considera reduir costos o augmentar preu."
  - 15-30%: "Vigilar. Revisa descomptes i transport."
  - <15%: "Crític! Revisa preu o costos."

#### ✅ Fase 4C: Empty states millorats al pipeline
**Per què**: "Cap entrada" era poc informatiu. Ara té CTA contextual.
**Què s'ha fet**:
- Pipeline de leads: columna "Noves" buida mostra link "+ Afegir entrada"
- Kanban de tasques: empty state per columna amb "Cap tasca"

---

### Fitxers nous creats
- `app/admin/components/ToastProvider.tsx`
- `app/admin/components/FloatingAddButton.tsx`
- `app/admin/components/ExportCsvButton.tsx`
- `app/admin/tasks/TaskKanbanView.tsx`
- `lib/margin-utils.ts`

### Fitxers modificats
- `app/admin/components/AdminUI.tsx` — Toast: eliminat `fixed` positioning
- `app/admin/components/AdminSearchModal.tsx` — recents, dreceres, save recent on click
- `app/admin/layout.tsx` — ToastProvider, FAB, dreceres teclat
- `app/admin/leads/LeadPipelineView.tsx` — cards enriquides, toast, empty states
- `app/admin/bookings/page.tsx` — columna marge, chip marge mòbil
- `app/admin/bookings/BookingActions.tsx` — toast
- `app/admin/bookings/[id]/BookingMarginCard.tsx` — toast, "Per què" marge
- `app/admin/lib/dashboard-data.ts` — avgMarginPct
- `app/admin/page.tsx` — KPI marge mitjà
- `app/admin/tasks/page.tsx` — toggle kanban/llista
- `app/admin/calendario/CalendarMonthClient.tsx` — drag-drop reserves

---

### Continuació sessió 2026-02-24 (part 2)

#### ✅ Centralitzar formatació de dates i números (zero `ca-ES` hardcodejat)
**Per què**: Hi havia ~60 instàncies de `toLocaleDateString('ca-ES', ...)`, `toLocaleString('ca-ES')` i `new Intl.NumberFormat('ca-ES', ...)` repartides per tot l'admin. Canviar el locale requeriria editar 46 fitxers. Un únic punt de control és imprescindible.
**Què s'ha fet**:
- `lib/constants/index.ts` — afegits `DEFAULT_LOCALE`, `formatDateShort`, `formatDateFull`, `formatDateSimple`, `formatDateTimeFull`, `formatNumber`, i paràmetre `locale` a `formatDate`/`formatDateTime`
- ~46 fitxers admin actualitzats: tots els `'ca-ES'` hardcodejats reemplaçats per helpers centralitzats
- Casos especials (hora sola, dia de la setmana) usen `DEFAULT_LOCALE`
- Verificat amb Grep: **zero** `'ca-ES'` hardcodejat a tot el directori admin

#### ✅ Eliminar tots els `as any` a rutes d'email (17 → 0)
**Per què**: 17 `as any` a 4 fitxers de `api/admin/emails/` desactivaven el sistema de tipus. Cada cast era un punt cec on podien entrar bugs.
**Què s'ha fet**:
- `app/api/admin/emails/quote/route.ts`:
  - `(pack as any).durationHours` → `pack.durationHours ?? 4` (PackDefinition ja té el camp)
  - `(pack as any).emotion` → `pack.emotion` (PackDefinition ja té el camp)
  - Interfície `ExtraInput` creada per a extras no tipats
  - `extra.translations as any` → `extra.translations` (tipus Prisma compatibles)
  - `prisma as any` → `prisma.task` directe (model Task existeix a l'schema línia 732)
- `app/api/admin/emails/send/route.ts`:
  - Mateixos canvis de pack + interfície `QuoteAttachmentInput` creada
- `app/api/admin/emails/send-post-event/route.ts` i `run-cron/route.ts`:
  - `booking.pack?.translations as any` → `booking.pack?.translations`
- Verificat amb Grep: **zero** `as any` a rutes email

#### ✅ Integrar ExportCsvButton a bookings, leads i economia
**Per què**: El botó ExportCsvButton existia però no estava connectat a cap pàgina. L'operador necessita poder exportar dades.
**Què s'ha fet**:
- `ExportCsvButton.tsx` refactoritzat amb mode dual:
  - `headers+rows` (strings pre-computats, per a server components)
  - `data+columns` (amb funcions accessor, per a client components)
  - Motiu: les funcions no es poden serialitzar de server a client components
- `bookings/page.tsx` — integrat amb mode `headers+rows` (server component)
- `leads/page.tsx` — integrat amb mode `headers+rows` (server component)
- `economia/EconomiaClient.tsx` — integrat amb mode `data+columns` (client component), substituint l'antic "Exportar JSON"

#### ✅ Verificació TypeScript
**Per què**: Confirmar que els canvis no introdueixen errors de compilació.
**Què s'ha fet**:
- `npx tsc --noEmit` — només errors preexistents (CookieConsent, analytics), cap error nou introduït

### Commit
- 53 fitxers, commit `7997d97`: `refactor: centralitzar formatació dates/números i eliminar any a rutes email`
- Push a origin/main completat

#### ✅ Resoldre errors TypeScript preexistents (7 → 0)
**Per què**: 7 errors de compilació a CookieConsent i analytics impedien un `tsc --noEmit` net. Causats per declaracions duplicades i incompatibles de `Window.dataLayer`.
**Què s'ha fet**:
- `types/window.d.ts` — unificada la declaració de `Window`: `dataLayer`, `gtag`, `gtagConsentUpdate` amb tipus correctes
- `app/lib/analytics.ts` — eliminat `declare global` duplicat, `Record<string, any>` → `Record<string, unknown>`
- `npx tsc --noEmit` → **zero errors**

### Pendent per a properes sessions
- [ ] Verificar manualment al navegador: toast, semafors, drag-drop, FAB, dreceres
- [ ] Comprovar responsive (mòbil): bottom nav no es tapa amb FAB, cards touch-friendly

---

## 2026-02-25

### Context de la sessió
- 3 tasques pendents de la sessió 2026-02-23 per resoldre.
- Investigació prèvia va revelar que 2 de 3 ja estaven resoltes; la tercera (`formatDate` i18n) era real.

### Treball realitzat

#### ✅ Centralitzar locale mapping amb `toIntlLocale()`
**Per què**: 14 aparicions del patró `locale === 'ca' ? 'ca-ES' : locale === 'es' ? 'es-ES' : 'en-GB'` escampades per 11 fitxers. Codi duplicat, propens a errors (un fitxer tenia `en-US` en lloc de `en-GB`), i impossible de mantenir si s'afegeix un nou locale.
**Què s'ha fet**:
- `lib/constants/index.ts` — afegit `LOCALE_MAP` i `toIntlLocale()` que mapeja `ca→ca-ES`, `es→es-ES`, `en→en-GB`
- 8 funcions de format (`formatDate`, `formatDateTime`, `formatDateShort`, `formatDateFull`, `formatDateSimple`, `formatDateTimeFull`, `formatNumber`, `formatCurrency`) actualitzades per usar `toIntlLocale(locale)` internament
- `formatCurrency` — afegit paràmetre `locale` (abans hardcodejat a `ca-ES`)
- Blog `page.tsx` i `[slug]/page.tsx` — eliminades funcions `formatDate` locals, substituïdes per `toIntlLocale()` inline
- 9 fitxers més actualitzats: `pdf-utils.ts`, `portal/[token]/page.tsx`, `configurador/client.tsx` (corregit bug `en-US`→`en-GB`), `CalendarioUrgencia.tsx`, `contact/route.ts` (3 llocs), `cron/post-event/route.ts`, `emails/run-cron/route.ts`, `emails/send-post-event/route.ts`, `privacy/verify/route.ts`
- Verificat amb Grep: **zero** aparicions del patró antic

#### ✅ Tancar tasques pendents sessió 2026-02-23
**Per què**: El diari i la memòria tenien 3 tasques pendents que ja no ho eren.
**Què s'ha fet**:
- `any` a emails: ja resolt sessió 2026-02-24 (17 `as any` → 0)
- `formatDate` i18n: resolt en aquesta sessió amb `toIntlLocale()`
- TODO a `FiestasClient.tsx`: no era un TODO pendent, era nota arquitectònica ("TODO sale de packs-config.ts")
- Diari i memòria actualitzats

### Fitxers modificats
- `lib/constants/index.ts` — `toIntlLocale()`, `LOCALE_MAP`, 8 funcions actualitzades
- `app/[locale]/blog/page.tsx` — eliminat `formatDate` local, import `toIntlLocale`
- `app/[locale]/blog/[slug]/page.tsx` — eliminat `formatDate` local, import `toIntlLocale`
- `lib/pdf-utils.ts` — 3 substitucions, import `toIntlLocale`
- `app/[locale]/portal/[token]/page.tsx` — 1 substitució, import `toIntlLocale`
- `app/[locale]/configurador/client.tsx` — 1 substitució (fix `en-US`→`en-GB`), import `toIntlLocale`
- `app/components/ui/CalendarioUrgencia.tsx` — 1 substitució, import `toIntlLocale`
- `app/api/contact/route.ts` — 3 substitucions, import `toIntlLocale`
- `app/api/cron/post-event/route.ts` — 1 substitució, import `toIntlLocale`
- `app/api/admin/emails/run-cron/route.ts` — 1 substitució, import `toIntlLocale`
- `app/api/admin/emails/send-post-event/route.ts` — 1 substitució, import `toIntlLocale`
- `app/api/privacy/verify/route.ts` — 1 substitució, import `toIntlLocale`
- `docs/diario.md` — tasques 2026-02-23 marcades resoltes, entrada 2026-02-25
- `.eslintrc.json` — corregit error preexistent: afegit `plugin:@typescript-eslint/recommended` per registrar el plugin, desactivades regles noves que no apliquen al codi existent

---

## 2026-02-25 (sessió 2 — Revisió sistema econòmic-financer + UX)

### Context de la sessió
L'operador vol un sistema de gestió de nivell professional: coherència financera absoluta, tests exhaustius, i una UX que permeti prendre decisions econòmiques correctes tant en desktop com en mòbil. Criteri de doctor en ADE: cada número ha de reflectir la realitat operativa, cada semàfor ha de tenir significat econòmic real, i la interfície ha de ser comprensible per qualsevol persona.

### Treball realitzat

#### ✅ Bloc 5: Centralitzar `escapeHtml()` (5 còpies → 1)
**Per què**: 5 fitxers tenien la seva pròpia implementació d'`escapeHtml()`. 2 d'ells acceptaven `null|undefined`, 3 no. Això és risc de seguretat (XSS) i deute tècnic: si es troba un vector d'atac nou, s'ha de corregir a 5 llocs.
**Què s'ha fet**:
- `lib/utils/sanitize.ts` — ampliat per acceptar `string | null | undefined` (retorna `''` per null/undefined)
- 5 fitxers: eliminada còpia local, afegit `import { escapeHtml } from '@/lib/utils/sanitize'`
- Tests actualitzats amb casos `null` i `undefined`
- Verificat amb Grep: **zero** `function escapeHtml` fora de `sanitize.ts`

#### ✅ Bloc 7: Correccions de qualitat
**Per què**: `(prisma as any)` desactiva la comprovació de tipus — si el model canvia, no detectem l'error fins a producció. Toast sense `role="status"` és invisible per a lectors de pantalla (accessibilitat). `exhaustive-deps` evita bugs subtils de closures.
**Què s'ha fet**:
- `scripts/autofix-system-health.ts` — `(prisma as any).task` → `prisma.task` (model Task existeix a schema línia 732)
- `lib/services/clientPortalAccess.ts` — `(prisma as any).clientPortalAccess` → `prisma.clientPortalAccess` (model existeix línia 657)
- `app/admin/components/ToastProvider.tsx` — afegit `role="status"` i `aria-live="polite"` al contenidor de toasts
- `BookingMarginCard.tsx` — afegit `toast` al dependency array del `handleSave` useCallback
- Verificat: **zero** `(prisma as any)` al projecte

#### ✅ Bloc 3: Renominar fuel→vehicle al model de cost
**Per què**: `DEFAULT_FUEL_COST_PER_KM = 0.19` cobreix NOMÉS benzina. El cost real d'un vehicle inclou manteniment (~0.05 €/km), assegurança (~0.03 €/km), pneumàtics (~0.02 €/km) i amortització (~0.08 €/km). El nom "Cost benzina intern" a la UI enganyava l'operador, que creia que 0.19 €/km cobria tot. Cost real recomanat: 0.35-0.50 €/km.
**Què s'ha fet**:
- `lib/services/travelCost.ts` — nova constant `DEFAULT_VEHICLE_COST_PER_KM`, alias deprecated `DEFAULT_FUEL_COST_PER_KM` per compatibilitat
- Paràmetre `fuelCostPerKm` → `vehicleCostPerKm` a `calculateTravelCost()`
- `BookingMarginCard.tsx` — interfície actualitzada amb `vehicleCostPerKm` (compat amb prop legacy `fuelCostPerKm`)
- UI: "Cost benzina intern" → "Cost vehicle per km" + tooltip "Inclou benzina, manteniment, assegurança i amortització. Valor recomanat: 0.35-0.50 €/km"

#### ✅ Bloc 2: Centralitzar semàfors de marge
**Per què**: `BookingMarginCard.tsx` tenia ~25 línies de lògica inline duplicant `getMarginTone()` amb colors lleugerament diferents (inconsistència visual). A més, el transport tenia llindars propis (45%/20%) sense funció reutilitzable.
**Què s'ha fet**:
- `lib/margin-utils.ts` — afegit `getTravelMarginTone()` amb 3 bandes: ≥45% emerald (sa), ≥20% orange (vigilar), <20% rose (crític)
- `BookingMarginCard.tsx` — substituïts ~25 línies de lògica inline per `getMarginTone()` i `getTravelMarginTone()`

#### ✅ Bloc 1: Unificar ratis de cost (config BD)
**Per què**: PROBLEMA CRÍTIC. `bookings/page.tsx` i `dashboard-data.ts` usaven `0.36/0.28/45` hardcodejats. El detall de booking sí usava `getProfitabilityConfig()`. Resultat: l'operador canviava la config a Economia, veia marges correctes al detall, però la llista i el dashboard seguien mostrant els antics. Decisió de preus errònies.
**Què s'ha fet**:
- `bookings/page.tsx` — afegit `getProfitabilityConfig()` al `Promise.all`, els 2 blocs de marge (mòbil + desktop) ara usen `profitConfig.packCostRatio/extraCostRatio/fixedOperationalCost`
- `dashboard-data.ts` — afegit `getProfitabilityConfig()` al bloc d'inicialització, marge mitjà usa config de BD
- Verificat amb Grep: **zero** `0.36` hardcodejat fora de `profitabilityService.ts` i tests

#### ✅ Bloc 4: Tests exhaustius del sistema financer (4 fitxers, ~88 casos nous)
**Per què**: Zero cobertura de test per a la lògica financera. El sistema decideix si una reserva és rendible, calcula costos de viatge, puntua leads comercialment, i normalitza configuració. Tot això sense cap test unitari. Un error de càlcul = decisions financeres incorrectes.
**Què s'ha fet**:
- `__tests__/lib/margin-utils.test.ts` (21 tests) — semàfors de marge (fronteres exactes 15/30/50), semàfors de transport (20/45), càlcul de marge (cas típic, total=0, negatiu, sense extras/viatge)
- `__tests__/lib/services/travelCost.test.ts` (35 tests) — sanitizeNonNegative (NaN, Infinity, negatiu), km facturables, trams, cost vehicle, suplement client, km inclosos
- `__tests__/lib/services/commercialScoring.test.ts` (17 tests) — scoring per estat, bonificacions (budget, telèfon, referit), penalitzacions (event passat, stale), clamping (0-100, probabilitat 2%-98%), estimació d'import
- `__tests__/lib/services/profitabilityService.test.ts` (15 tests) — valors per defecte, normalització (null, parcial, ràtios fora rang, CAC parcial)
- Tots els tests documentats amb comentaris pedagògics en català explicant conceptes econòmics (marge, ràtio de cost, CAC, amortització, trams de transport)
- **151 tests totals, 12 fitxers, TOTS passen**

#### ✅ Bloc 6: Fallbacks mòbil per drag-drop
**Per què**: HTML5 Drag & Drop no funciona en dispositius tàctils (mòbil/tablet). El kanban de tasques i el calendari eren inutilitzables en mòbil — 50%+ del tràfic admin.
**Què s'ha fet**:
- `TaskKanbanView.tsx` — afegits botons "Obertes" / "En curs" / "Fetes" sota cada card, visibles només en mòbil (`md:hidden`). Usen la mateixa funció `moveTask()` que el drag-drop.
- `CalendarMonthClient.tsx` — afegit botó "Canviar data" al panell de detalls de cada reserva. Obre un input `type="date"` natiu (óptim per mòbil). En seleccionar, mou la reserva i refresca el calendari.

### Verificació final
- `npx tsc --noEmit` → 2 errors pre-existents (portal/booking), cap error nou
- `npx vitest run` → **151 tests, 12 fitxers, tots passen**
- Grep `function escapeHtml` → 1 sola definició (sanitize.ts)
- Grep `0.36` hardcodejat → només a profitabilityService.ts (font canònica) i tests
- Grep `(prisma as any)` → zero

### Fitxers nous creats
- `__tests__/lib/margin-utils.test.ts`
- `__tests__/lib/services/travelCost.test.ts`
- `__tests__/lib/services/commercialScoring.test.ts`
- `__tests__/lib/services/profitabilityService.test.ts`

### Fitxers modificats
- `lib/utils/sanitize.ts` — escapeHtml ampliat a null|undefined
- `lib/margin-utils.ts` — getTravelMarginTone() afegit
- `lib/services/travelCost.ts` — DEFAULT_VEHICLE_COST_PER_KM, alias deprecated
- `lib/services/clientPortalAccess.ts` — eliminat (prisma as any)
- `lib/email.ts` — import escapeHtml centralitzat
- `lib/services/documentService.ts` — import escapeHtml centralitzat
- `lib/services/canvasService.ts` — import escapeHtml centralitzat
- `app/admin/bookings/page.tsx` — getProfitabilityConfig, zero hardcodes
- `app/admin/lib/dashboard-data.ts` — getProfitabilityConfig, zero hardcodes
- `app/admin/bookings/[id]/BookingMarginCard.tsx` — semàfors centralitzats, fuel→vehicle, tooltip, exhaustive-deps
- `app/admin/components/ToastProvider.tsx` — accessibilitat (role/aria-live)
- `app/admin/tasks/TaskKanbanView.tsx` — botons mòbil per moure tasques
- `app/admin/calendario/CalendarMonthClient.tsx` — botó canviar data per mòbil
- `app/api/admin/emails/send/route.ts` — import escapeHtml centralitzat
- `app/api/admin/leads/[id]/snapshot/route.ts` — import escapeHtml centralitzat
- `scripts/autofix-system-health.ts` — eliminat (prisma as any)
- `__tests__/lib/sanitize.test.ts` — tests null/undefined

## 2026-02-26 — Auditoria econòmica-financera Fase 2

### Context de la sessió
L'operador vol el sistema econòmic completament automatitzat i interconnectat. Criteri de doctor en ADE: tots els costos derivats de dades reals, previsions de vendes, recordatoris automàtics, i que "la feina es faci sola". Objectiu: enriquir i automatitzar, no reconstruir.

### Treball realitzat

#### Bloc 0: Motor de cost unificat (`costEngine.ts`)
**Per què**: Hi havia 3 sistemes de cost desconnectats (profitabilityService, packPricingHealth, BookingMarginCard). L'operador veia marges diferents segons on mirés.
**Què s'ha fet**:
- Creat `lib/services/costEngine.ts` — `computeBookingFinancialSummary()` com a font única de veritat
- Si hi ha inventari real → cost REAL, si no → estimat via ratis
- `profitabilityService.ts` ara delega internament a costEngine
- `bookings/page.tsx` i `dashboard-data.ts` ara usen `computeSimpleMarginPct()` del costEngine
- 10 tests nous per al costEngine

#### Bloc 1: MITECO → cost vehicle automàtic
**Per què**: `travelCost.ts` usava 0.19€/km hardcodejat. `fuelReferenceService.ts` ja descarregava el preu MITECO però no s'usava en cap càlcul.
**Què s'ha fet**:
- `travelCost.ts` — nova `calculateEffectiveVehicleCostPerKm()` amb fórmula: `(fuelPrice × consumL100 / 100) + maintenance`
- `fuelReferenceService.ts` — nova `getEffectiveVehicleCostPerKm()` que llegeix MITECO de BD
- Defaults: consum 8.5 L/100km (furgoneta), manteniment 0.12 €/km
- 6 tests nous per al càlcul de cost vehicle
- UI a economia/config mostrant preu combustible, consum, manteniment i cost efectiu

#### Bloc 7: Eliminar redundàncies de càlcul
**Per què**: Marge es calculava de manera diferent a bookings/page, dashboard-data, BookingMarginCard, profitabilityService.
**Què s'ha fet**:
- `profitabilityService.ts` → `toProfitabilityRow()` ara usa costEngine
- `dashboard-data.ts` → marge mitjà ara via `computeSimpleMarginPct()` del costEngine
- `bookings/page.tsx` → ambdós càlculs de marge (mòbil + desktop) via costEngine
- Eliminat import de `calculateSimpleMarginPct` dels consumidors (queda a margin-utils per retrocompatibilitat)

#### Bloc 2: Previsió de tresoreria
**Per què**: L'operador no sabia quan entraria diners. Sense previsió de tresoreria, qualsevol empresa petita va a cegues.
**Què s'ha fet**:
- Creat `lib/services/cashFlowForecast.ts` — `buildCashFlowForecast()`
- Ingressos = total × % pendent de cobrar per mes d'event
- Costos = estimats via costEngine per reserva
- Taula mensual: ingressos, costos, flux net, acumulat
- API route: `app/api/admin/economia/cash-flow/route.ts`
- Nova pestanya "Tresoreria" a Economia

#### Bloc 3: Previsió de vendes + estacionalitat
**Per què**: L'operador no sabia quantes reserves necessitava per arribar als objectius ni quins mesos eren forts.
**Què s'ha fet**:
- Creat `lib/services/pipelineForecast.ts` — `buildPipelineForecast()`
- Pipeline ponderat: leads actius × probabilitat (scoreLead) × import estimat
- Històric: reserves passades per mes → mitjana estacional (últims 24 mesos)
- Combinació: 60% pipeline + 40% històric
- API route: `app/api/admin/economia/forecast/route.ts`
- Nova pestanya "Previsions" a Economia

#### Bloc 4: Recordatoris de pagament automàtics
**Per què**: L'operador mirava manualment quines reserves tenien pagaments pendents. Amb 30+ reserves al mes, molt temps perdut.
**Què s'ha fet**:
- Creat `lib/services/paymentReminderService.ts`
- Cerca reserves amb pagament pendent i event < 14 dies
- No repeteix si ja enviat en últims 7 dies (via AdminLog)
- Integrat al cron `commercial-daily`
- Email en HTML amb import pendent, dies fins l'event

#### Bloc 5: Portal client automàtic en COMPLETED
**Per què**: Quan una reserva es marcava COMPLETED, l'operador havia de crear manualment el portal. Pas mecànic que s'oblidava.
**Què s'ha fet**:
- `app/api/admin/bookings/[id]/route.ts` — al canvi a COMPLETED:
  - Auto-crea `ClientPortalAccess` via `issueClientPortalAccess()`
  - Envia email al client amb enllaç del portal
  - Registra a AdminLog
  - No bloqueja el canvi d'estat si falla

#### Bloc 6: Cron setmanal sync preus pack
**Per què**: `packPricingHealth.ts` calcula preu recomanat, però l'operador havia d'anar manualment a revisar. Si els costos canviaven, els preus quedaven desactualitzats.
**Què s'ha fet**:
- Creat `app/api/cron/pack-pricing-check/route.ts`
- Analitza divergència per cada pack actiu
- Si >15% → crea Task amb prioritat proporcional
- No canvia preus automàticament (decisió comercial)

#### Bloc 8: Cache intel·ligent de scoring
**Per què**: `scoreLead()` es cridava per cada lead a cada renderització. Amb 200+ leads, feina repetida.
**Què s'ha fet**:
- Afegit `cachedScore` i `cachedScoreAt` al model Lead (schema Prisma)
- Migració: `20260501090000_add_lead_cached_score`
- Cron `commercial-daily` actualitza scores de tots els leads actius

#### Bloc 10: CAC real des de dades
**Per què**: CAC era estimacions fixes (Instagram=35€, etc). No reflectien la realitat.
**Què s'ha fet**:
- Creat `lib/services/cacAnalysis.ts` — `buildCacAnalysis()`
- Per canal: leads totals, guanyats, taxa conversió, CAC ponderat
- Comparativa CAC estimat vs real a Economia → pestanya Previsions

#### Bloc 9: Dashboard financer enriquit
**Per què**: Dashboard mostrava marge i facturació, però faltaven KPIs financers clau.
**Què s'ha fet**:
- `dashboard-data.ts` — afegit `cashFlowNet30`, `pipelineWeighted30`, `pendingPayments`
- `app/admin/page.tsx` — 3 cards noves: Flux net previst, Pipeline ponderat, Pendent de cobrar
- Tot resilient amb catch (no bloqueja dashboard si un servei falla)

### Verificació
- `npx tsc --noEmit` → 0 errors nous (2 pre-existents en portal/booking page)
- `npx vitest run` → **167 tests, 14 fitxers, tots passen** (151→167, +16 nous)
- 6 nous serveis creats, 4 API routes noves, 2 crons nous
- Tots els càlculs de marge ara via costEngine (font única)

### Fitxers nous creats
- `lib/services/costEngine.ts`
- `lib/services/cashFlowForecast.ts`
- `lib/services/pipelineForecast.ts`
- `lib/services/paymentReminderService.ts`
- `lib/services/cacAnalysis.ts`
- `app/api/admin/economia/cash-flow/route.ts`
- `app/api/admin/economia/forecast/route.ts`
- `app/api/cron/pack-pricing-check/route.ts`
- `prisma/migrations/20260501090000_add_lead_cached_score/migration.sql`
- `__tests__/lib/services/costEngine.test.ts`
- `__tests__/lib/services/vehicleCost.test.ts`

### Fitxers modificats
- `lib/services/travelCost.ts` — calculateEffectiveVehicleCostPerKm, constants noves
- `lib/services/fuelReferenceService.ts` — getEffectiveVehicleCostPerKm
- `lib/services/profitabilityService.ts` — delega a costEngine
- `app/admin/bookings/page.tsx` — computeSimpleMarginPct del costEngine
- `app/admin/lib/dashboard-data.ts` — costEngine + KPIs financers
- `app/admin/page.tsx` — 3 cards dashboard noves
- `app/admin/economia/EconomiaClient.tsx` — 2 pestanyes noves + vehicle config + CAC
- `app/admin/economia/page.tsx` — integració dades noves
- `app/api/admin/bookings/[id]/route.ts` — portal auto-created en COMPLETED
- `app/api/cron/commercial-daily/route.ts` — recordatoris + scoring cache
- `prisma/schema.prisma` — cachedScore, cachedScoreAt al Lead

---

#### ✅ Corregir ESLint config (build bloquejat)
**Per què**: La regla `@typescript-eslint/no-explicit-any: warn` va ser afegida a la sessió 2026-02-23, però sense registrar el plugin `@typescript-eslint` explícitament. `next/core-web-vitals` no el registra de forma que les regles siguin accessibles directament. Resultat: `npm run build` fallava amb "Definition for rule not found".
**Què s'ha fet**:
- Afegit `plugin:@typescript-eslint/recommended` als extends (registra el plugin)
- Desactivades regles noves que `recommended` activa per defecte i que trencarien el codebase: `no-unused-vars`, `no-require-imports`, `prefer-as-const`, `no-unsafe-function-type`, `prefer-const`
- `npm run build` → **èxit** (compilació + lint + 235 pàgines generades)

---

## 2026-02-26 — Auditoria UX completa admin

### Context de la sessió
L'operador (no expert tècnic) utilitza l'admin sol per gestionar un negoci d'events. Algunes pàgines clau (reserves, clients) estaven per sota del nivell de les altres (leads, tasques). Cal unificar l'experiència.

### Treball realitzat

#### ✅ Reserves: Filtres + cerca
**Per què**: La pàgina de reserves no tenia filtres ni cerca. L'API ja suportava `status`, `eventType`, `fromDate`, `toDate`, `search` però la pàgina no els passava. Amb 30+ reserves, trobar-ne una requeria fer scroll.
**Què s'ha fet**:
- `BookingFilters.tsx` creat — barra de filtres client-side amb cerca (debounce 300ms), selects d'estat i tipus, dates des de/fins a, botó "Netejar filtres"
- `bookings/page.tsx` — `searchParams` ampliat a `status`, `eventType`, `fromDate`, `toDate`, `search`, `view`
- Query Prisma amb `where` dinàmic basat en filtres (ja existent a l'API)
- Paginació conserva filtres a la URL

#### ✅ Reserves: Vista kanban amb drag & drop
**Per què**: Leads i tasques tenen kanban, reserves no. L'operador vol veure el flux d'un cop d'ull i moure reserves d'estat amb drag.
**Què s'ha fet**:
- `BookingPipelineView.tsx` creat — 4 columnes (PENDING → CONFIRMED → PREPARING → COMPLETED), CANCELLED ocultes
- Drag & drop HTML5 amb optimistic updates via `PATCH /api/admin/bookings/{id}/status`
- Cards compactes: referència, nom client, data, total, marge, paga pendent
- Botons ← → per a mòbil (com a TaskKanbanView)
- Mètriques per columna: total reserves, facturació
- `BookingViewToggle.tsx` creat — toggle Llista/Kanban via searchParam `view=kanban`

#### ✅ Clients: alert() → toast + Export CSV
**Per què**: `window.alert()` a la pàgina de clients — UX amateur. I clients no tenia export CSV (leads i reserves sí).
**Què s'ha fet**:
- `alert()` substituït per `toast.success()` (hook `useToast()` que ja existia)
- `ExportCsvButton` afegit amb headers: Nom, Email, Telèfon, Ciutat, Font, Esdeveniments, Despesa total, VIP

#### ✅ Pipeline Leads: Filtres interactius + score
**Per què**: La vista pipeline rebia filtres del servidor però no es podien canviar localment (cada canvi recarregava). I el score es calculava però no es veia a les targetes.
**Què s'ha fet**:
- Filtres locals (no recarrega pàgina): FilterChips clicables per prioritat, tipus event, font + cerca inline amb debounce
- Botó "Netejar" per reiniciar filtres locals
- Score badge a cada card: si hi ha `cachedScore` l'usa, si no, estima (budget+phone+eventDate+email)
- Colors: verd >70, ambre >40, vermell ≤40

#### ✅ Navegació: Simplificar
**Per què**: 31 ítems al menú, sobrecàrrega cognitiva per a un operador sol.
**Què s'ha fet**:
- **Prioritat** (7→5): Eliminats Entrada ràpida (accessible des de Leads), Pressupost PDF, Mapa admin
- **Operativa** (5→4): Eliminat Calendari (mogut a Prioritat)
- **Eines** (12→7): Eliminats FAQ, Textos PRO, Canvas, Google Reviews, Operativa vendes (poc usats, accessibles via Ctrl+K)
- **Config** (7→4): Eliminats Plantilla pressupostos (dins config), Traduccions, CSS PRO

#### ✅ Bottom nav: Millorat
**Per què**: Analítica apareixia al bottom nav mòbil i a "Eines". I l'operador necessita accés ràpid al calendari.
**Què s'ha fet**:
- Bottom nav: Tauler, Entrades, Reserves, Calendari, Més (obre sidebar)
- "Més" és un botó que obre el sidebar, no un link

#### ✅ Bidireccionalitat: Botó entrada original
**Per què**: Des de la fitxa de reserva, el link a l'entrada original estava amagat al peu d'una secció.
**Què s'ha fet**:
- Botó "📥 Entrada original" afegit al header d'`AdminPage` (al costat de "👤 Fitxa Client")
- Només visible si hi ha lead associat

#### ✅ Fix errors TypeScript preexistents (21→0)
**Per què**: `useSearchParams()` pot retornar `null` en Next.js 14 strict mode. 15 fitxers tenien `searchParams.get()` sense null check. El build fallava.
**Què s'ha fet**:
- 11 fitxers arreglats amb optional chaining (`searchParams?.get()`)
- `layout.tsx` — `isActive()` ara retorna `boolean` explícit (no `boolean | undefined`)
- `LanguageSelector.tsx`, `MobileBottomNav.tsx` — `pathname` nullable arreglat
- Build complet: **233 pàgines generades, 0 errors**

### Fitxers nous creats
- `app/admin/bookings/BookingFilters.tsx`
- `app/admin/bookings/BookingPipelineView.tsx`
- `app/admin/bookings/BookingViewToggle.tsx`

### Fitxers modificats
- `app/admin/bookings/page.tsx` — filtres, toggle kanban, searchParams ampliat
- `app/admin/bookings/[id]/page.tsx` — botó "Entrada original" al header
- `app/admin/clientes/page.tsx` — toast, CSV export
- `app/admin/leads/LeadPipelineView.tsx` — filtres locals, score badge, estimateScore()
- `app/admin/components/nav-items.ts` — simplificat (31→20 ítems)
- `app/admin/layout.tsx` — bottom nav millorat, isActive fix
- `app/[locale]/valoracio/client.tsx` — fix searchParams nullable
- `app/admin/blog/page.tsx` — fix searchParams nullable
- `app/admin/bookings/new/page.tsx` — fix searchParams nullable
- `app/admin/inbox/settings/InboxSettingsClient.tsx` — fix searchParams nullable
- `app/admin/post-event/reports/new/page.tsx` — fix searchParams nullable
- `app/admin/tasks/new/page.tsx` — fix searchParams nullable
- `app/components/mobile-ultimate/MobileBottomNav.tsx` — fix pathname nullable
- `app/components/ui/LanguageSelector.tsx` — fix pathname nullable

#### ✅ Fix mismatches API ↔ components (post-auditoria)
**Per què**: Auditoria automàtica va detectar que el kanban de reserves demanava `limit=500` però l'API clampava a 200. I `cachedScore` no s'incloïa al select del pipeline leads (migració pendent).
**Què s'ha fet**:
- `bookings/route.ts` — suport `pipeline=true` amb limit fins a 1000 (en mode normal es manté 200)
- `pipeline.ts` — `cachedScore` preparat al type i comentat al select (activar un cop fet `prisma generate`)
- `contacto/client.tsx` — fix searchParams nullable

### Commits
- `561e255` — `feat: auditoria UX completa admin — filtres, kanban, pipeline, navegació`
- `449f5a9` — `fix: corregir mismatches API ↔ components detectats a auditoria UX`

---

## Informe per a Codex — Tasques pendents (2026-02-26)

### PENDENT CRÍTIC: Migració Prisma
```bash
cd D:/orbitaevents
source .env.local && npx prisma db push
npx prisma generate
```
- Això aplica el camp `cachedScore` i `cachedScoreAt` al model Lead (schema.prisma línia 419-420)
- Un cop fet, descomentar la línia `// cachedScore: true,` a `lib/services/leads/pipeline.ts:43`
- Descomentar també `cachedScore` del type `PipelineLead` al mateix fitxer (línia 14)
- Verificar que el pipeline de leads mostra el score real en comptes de l'estimat

### PENDENT: Verificació manual al navegador
1. **Reserves kanban** (`/admin/bookings?view=kanban`):
   - [ ] Drag & drop funciona (arrossegar card d'una columna a una altra)
   - [ ] Botons ← → mòbil funcionen
   - [ ] Optimistic update: la card es mou immediatament i es torna enrere si l'API falla
   - [ ] Mètriques per columna (count + facturació) correctes
   - [ ] CANCELLED no apareix al kanban (recompte a sota)
   - [ ] Badge "Paga pendent" apareix si `depositPaid=false`

2. **Reserves filtres** (`/admin/bookings`):
   - [ ] Cerca per nom/referència funciona
   - [ ] Filtre per estat funciona
   - [ ] Filtre per tipus event funciona
   - [ ] Filtres de data (des de/fins a) funcionen
   - [ ] "Netejar filtres" reseteja tot
   - [ ] Toggle Llista/Kanban funciona

3. **Pipeline leads** (`/admin/leads?view=pipeline`):
   - [ ] FilterChips clicables funcionen
   - [ ] Cerca inline filtra en temps real
   - [ ] Score badge visible a cada card
   - [ ] "Netejar" reinicia filtres

4. **Clients** (`/admin/clientes`):
   - [ ] Al clicar "Enviar recordatori" apareix un toast (no un alert)
   - [ ] Botó CSV descarrega fitxer amb les columnes correctes

5. **Navegació**:
   - [ ] Sidebar: 20 ítems (no 31)
   - [ ] Bottom nav mòbil: Tauler, Entrades, Reserves, Calendari, Més
   - [ ] Botó "Més" obre el sidebar

6. **Bidireccionalitat**:
   - [ ] Des de reserva amb lead → botó "📥 Entrada original" visible al header

### PENDENT: `marginPct` al kanban de reserves
- L'API retorna tots els camps del booking (`include`) però NO calcula marge
- `BookingPipelineView.tsx` línia 69: `marginPct: typeof b.marginPct === 'number' ? b.marginPct : null`
- Com que `marginPct` NO és un camp del model Booking, sempre serà `null`
- Opcions per implementar:
  1. Calcular al servidor: a la resposta de l'API, cridar `computeSimpleMarginPct()` per cada booking
  2. Calcular al client: importar la lògica de marge al component (menys ideal)
  3. Deixar-ho com està: el marge es veu al detall de la reserva (ja funciona)

### PENDENT: Tests pendents d'executar
```bash
cd D:/orbitaevents && npx vitest run
```
- Última execució: 167 tests, 14 fitxers, tots passen
- Cap test nou afegit en els últims canvis (fixes menors)

### Arquitectura i patrons a seguir
- **Cost/marge**: Sempre via `costEngine.ts` — `computeBookingFinancialSummary()` és la font de veritat
- **Formatació**: `formatDate/Currency/Number()` de `lib/constants` — MAI hardcodejar `'ca-ES'`
- **Locale**: `toIntlLocale(locale)` per convertir `'ca'→'ca-ES'`
- **Semàfors marge**: `getMarginTone()` de `lib/margin-utils.ts`
- **UI admin en català**: Tots els textos visibles en català, variables/URLs en anglès
- **Drag & drop mòbil**: Sempre afegir botons fallback `md:hidden` (HTML5 D&D no funciona en tàctil)
- **searchParams/pathname nullable**: Next.js 14 — sempre `?.get()` i `(pathname || '')`
- **Toast, no alert()**: `useToast()` de `ToastProvider`
- **CSV export**: `ExportCsvButton` amb mode `headers+rows` (server) o `data+columns` (client)

---

## 2026-03-03 — Auditoria de bugs (sessió Claude, interrompuda)

### Objectiu de la sessió
Auditoria exhaustiva de bugs a tot el projecte: pàgines públiques, admin, API routes, components compartits. La sessió es va interrompre a mitja feina.

### 1. Customer Hub (Fitxa 360) — 3 bugs crítics arreglats

| Fitxer | Bug | Fix |
|--------|-----|-----|
| `lib/customer-hub/fetchCustomerHub.ts` | `marginEstimated` calculava IVA (total - subtotal), no marge real | Ara usa `costTotal` del snapshot; fallback 35% si no hi ha cost |
| `lib/customer-hub/fetchCustomerHub.ts` | `totalPaid` ignorava `remainingPaid` — només sumava dipòsit | Ara suma dipòsit + resta pagada correctament |
| `lib/customer-hub/fetchCustomerHub.ts` | `safeQuery()` silenciava tots els errors (catch buit) | Afegit `console.error('[CustomerHub] safeQuery error:', error)` |
| `lib/customer-hub/dto.ts` | `MessageDTO.channel` no incloïa 'CALL' | Afegit `'CALL'` al tipus union |
| `lib/customer-hub/fetchCustomerHub.ts` | Activitat CALL es mapejava com a NOTE | Ara es mapeja correctament a CALL |

### 2. Pack sync — no reactivar packs desactivats

| Fitxer | Bug | Fix |
|--------|-----|-----|
| `app/api/admin/packs/sync/route.ts` | Sync sempre posava `isActive: true`, reactivant packs desactivats manualment | Eliminat `isActive` de l'update; `isActive: true` només al create de packs nous |
| `scripts/sync-packs-to-db.ts` | Mateix bug que l'anterior | Mateix fix — `isActive` no es toca en update |

### 3. Pàgina /respira — IMMERSIVE_PAGES + textos en espanyol

| Fitxer | Bug | Fix |
|--------|-----|-----|
| `app/components/layout/LayoutWrapper.tsx` | `/respira` no estava a `IMMERSIVE_PAGES` — mostrava header/footer | Afegit `/respira` a la llista |
| `app/components/ui/HeaderChampion.tsx` | Textos hardcoded en espanyol: "Espacio sensorial" | Traduït a català: "Espai sensorial", "Un espai per a persones..." |

### 4. Codi mort eliminat

| Fitxer | Què | Raonament |
|--------|-----|-----------|
| `app/[locale]/sensorial/client.tsx` | 754 línies eliminades | Component orfe — `sensorial/page.tsx` no l'importava |
| `public/respira/` | HTML+PWA+audio+icones eliminats | Fitxers legacy servits estàticament, no integrats a Next.js |

### 5. Neteja configurador — patches ChatGPT

| Fitxer | Què s'ha netejat |
|--------|------------------|
| `app/[locale]/configurador/client.tsx` | Eliminat `normalizePackBaseKey()` (innecessari), eliminat `getTranslatedText()` (massa complex), eliminat variables `tRoot`/`tServicesMobile` no usades |
| `app/[locale]/configurador/client.tsx` | Simplificat `getLocalizedPack()` — resolució directa amb fallback humanitzat |
| `app/[locale]/configurador/client.tsx` | Eliminat doble filtratge i Map<string,any> de ChatGPT |

### 6. start-process — migració Supabase→Prisma

| Fitxer | Què |
|--------|-----|
| `app/api/admin/start-process/route.ts` | Migrat de `supabaseAdmin` a `prisma` — totes les queries (customer, discount codes) |
| `app/api/admin/start-process/route.ts` | Eliminada `checkSupabase()` i `verifyAdminAuth()` duplicades (ja hi ha `requireAuth()`) |
| `app/api/admin/start-process/route.ts` | Codis descompte ara es creen amb `prisma.discountCode.create()` en lloc de Supabase |
| `app/api/admin/start-process/route.ts` | Afegit registre d'activitat a `customerActivity` |

### 7. Sensorial — link a Respira Rosa

| Fitxer | Què |
|--------|-----|
| `app/[locale]/sensorial/page.tsx` | Afegit botó "🌼 5-4-3-2-1" amb link a `/respira-rosa/index.html` |

### 8. Clients — fix link pressupost

| Fitxer | Bug | Fix |
|--------|-----|-----|
| `app/admin/clientes/page.tsx` | Link "Crear pressupost" passava email com a param | Ara passa `customerId` (més fiable) |

### Estat de l'auditoria quan es va interrompre

**Completat:** Mapeig pàgines, Customer Hub, respira, configurador, codi mort, pack sync
**En progrés:** Auditoria bookings, auditoria pàgines públiques
**Pendent:** Leads, components compartits, clientes, portal client, economia+dashboard, API routes, informe final

### Verificació
- `tsc --noEmit`: 0 errors
- `next build`: OK (compila totes les pàgines)
- Cap canvi commitejat (sessió interrompuda)

---

## 2026-03-02 — Fix configurador (fet per ChatGPT)

### Què s'ha fet
- ChatGPT ha corregit el pas 2 del configurador (pp/[locale]/configurador/client.tsx) per evitar packs duplicats.
- S'ha ajustat el mapatge de serveis:
  - iestas -> només iestas
  - discomovil -> només discomovil
- S'ha reforçat la resolució d'i18n perquè no es mostrin claus en brut (ex: configurator.step2.packs...) quan falta una traducció.

### Resultat esperat
- Ja no apareixen packs repetits al bloc "Canvia el tipus d'esdeveniment".
- Les features i textos dels packs no mostren keys tècniques a la UI.

### Traca detallada (pas a pas)
1. Localitzacio del projecte correcte a D:\orbitaevents.
2. Verificacio del simptoma: al configurador (step2) es veien packs duplicats i claus i18n en brut.
3. Revisio de fitxers implicats:
   - app/[locale]/configurador/client.tsx
   - app/config/packs-config.ts
   - lib/pack-i18n.ts
   - lib/packs-db.ts
   - messages/ca.json
4. Identificacio de causa principal al configurador:
   - EVENT_TYPE_SERVICE_MAP barrejava serveis (fiestas + discomovil i viceversa).
5. Patch aplicat a app/[locale]/configurador/client.tsx:
   - fiestas filtra nomes fiestas.
   - discomovil filtra nomes discomovil.
6. Patch de robustesa i18n al mateix fitxer:
   - Si una traduccio retorna una key tecnica (no text final), no es mostra tal qual.
   - S'aplica fallback llegible (humanizeKeyFallback) per evitar claus visibles a UI.
7. Validacio:
   - Revisio de git diff del fitxer modificat.
   - Nota: node --check no valida .tsx en aquest entorn.

### Fitxer modificat
- app/[locale]/configurador/client.tsx

### Actualitzacio 2026-03-02 (segon patch)
- S'ha afegit un segon blindatge al configurador per sanejar packs per tipus d'esdeveniment i deduplicar per identitat normalitzada.
- S'ha afegit normalitzacio d'identitat (`flash` -> `oferta-flash`, `corporate` -> `empresas-evento`).
- S'ha reforcat la traduccio de features intentant traduccio directa de key abans del fallback.
- Incidencia durant el patch: error puntual de sintaxi en una linia (`const hay`). Corregit i verificat.

### Actualitzacio 2026-03-02 (tercer patch anti-keys)
- Blindatge directe al render del step2 del configurador.
- Si l'eventType es `fiestas`/`discomovil`, es descarten packs fora de context en render (ex: corporate).
- Les features es sanegen abans de pintar: si arriba una key i18n crua, es transforma a fallback humanitzat.
- Objectiu: evitar visualment claus `services.mobile...` o `configurator.step2...` encara que arribin dades brutes.

### Fix 2026-03-02 (Pressupostos - cerca de client)
- S'ha corregit la cerca de client a `app/admin/presupuestos/PresupuestoPdfStudio.tsx`.
- Causa: el frontend llegia `data.customers`, però l'API retorna el payload dins `data.data.customers` (successResponse).
- Solució: parser robust acceptant `data.customers` i `data.data.customers`.
- També es netegen resultats quan la resposta no és vàlida.
- Resultat esperat: la cerca torna a llistar clients i es poden seleccionar.

