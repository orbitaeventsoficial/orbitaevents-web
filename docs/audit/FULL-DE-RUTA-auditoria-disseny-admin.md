# 👁️ FULL DE RUTA — Auditoria de disseny total de l'admin («l'ull que tot ho veu»)

> **Encàrrec del propietari (2026-06-27):** auditar, millorar i replantejar si cal
> TOT l'admin, centímetre a centímetre, COMBINANT TOTES les dimensions alhora:
> disseny (CSS, forma, responsiu, format, colors, aspecte, tipografia, textos, normes
> de mida, jerarquia) + codi i funcions + botons + captures + APIs + enllaços interns
> i externs + lògica + millores. PDFs, emails i TOT inclòs. «El propietari diu que se
> li escapen coses, i moltes» → l'auditor no en deixa passar CAP.
>
> **To:** auditor implacable. Res es marca ✅ per simpatia. Una peça està bé quan ho
> demostra a les 9 dimensions; si no, és 🐛 o 🔶. El dubte compta com a no-revisat.
>
> **Naturalesa:** programa de llarg recorregut. Es trigarà els dies que faci falta.
> Aquest document és «l'ull que tot ho veu»: la font de veritat única. NO es tanca res
> sense passar per aquí. Cap peça queda sense auditar.

## Objectiu clar
Que tot l'admin sigui IMPECABLE i sembli fet pel mateix dissenyador a nivell
mil·limètric — i que tot FUNCIONI de debò: cap incoherència visual, tot canònic i
monocapa, tot responsiu (375/tablet/desktop), copy polit, PDFs/emails a l'altura,
cada botó fa el que ha de, cada API respon amb auth+CSRF, cada enllaç (intern i
extern) va on toca.

## Les 9 dimensions a verificar per CADA peça (totes han de passar per a un ✅)
1. **Vis** — Visual: aspecte, jerarquia, polidesa, densitat, alineació, espaiat, contrast.
2. **Coh** — Coherència: sembla germana de la resta (hipersemblança de sèrie).
3. **Can** — Canònic: `.ap-*`/tokens, 0 Tailwind ad-hoc, 0 botó-void, 0 hex/px hardcoded.
4. **Mon** — Monocapa: cap lògica/label/llindar/color duplicat (font única).
5. **Resp** — Responsiu: 375px · tablet · desktop (captura als 3; res tallat/desbordat).
6. **Typ** — Tipografia + mides: escala `--o-text-*`, pes, font canònica, 0 px a mà.
7. **Fn** — Funcions + botons: cada acció/botó/toggle/form/dropdown fa el que ha de; cap no-op; estats loading/error/empty.
8. **Api** — APIs + cablejat: endpoints existeixen i responen, auth+CSRF, dades flueixen entre òrgans; sense fetch a rutes mortes.
9. **Lnk** — Enllaços: interns (0 404) i externs (Waze/Maps/WhatsApp/web/Holded/Stripe — destí i params correctes).

## Mètode per peça (implacable)
1. **Warm-up + captura individual**: curl per compilar, després Playwright esperant un
   SELECTOR del contingut real (no temps fix — el capturador massiu satura el dev i dona
   falsos buits). Captura als 3 breakpoints quan el layout ho demani.
2. **Lectura del codi**: component (CSS/tokens/botons/handlers/estats) + API que consumeix + enllaços + còpia.
3. **Veredicte de les 9 dimensions** a la fila + millores concretes a Notes. Marcar 🐛 cada defecte real.
4. **Bug clar i segur** → arreglar + Canvi #N. **Replantejament gros o canvi visual** → proposar al propietari abans de tocar.

## Llegenda d'estat (columna Estat de cada fila)
⬜ no auditat · 🔶 en curs · ✅ impecable a les 9 dimensions · 🐛 té defecte/s obert/s (veure Notes)

## CHECKLIST MESTRE (s'aplica a cada peça; les 9 dimensions desglossades en 17 blocs)
1. **Visual fi**: jerarquia, densitat, whitespace, alineació de graella, ritme vertical · hover/active/focus/disabled de cada interactiu · cursor · z-index (modal>dropdown>tooltip) · ombres/radi únic/gradients/opacitats · transicions (durada/easing, reduced-motion, stagger) · scroll (sticky, intern, lock).
2. **Tipografia fi**: escala `--o-text-*`, pesos, font canònica, ≥12px · letter-spacing/line-height · tabular-nums · truncament vs wrap · òrfenes/vídues.
3. **Color/contrast**: carbó+or sense desviacions · WCAG AA 4.5:1 · semàfors monocapa (no Tailwind cru).
4. **Espaiat/layout**: paddings/margins canònics (0 px solts), gaps, max-width lectura, breakpoints, densitat.
5. **Responsiu**: 375/414/768/1024/1440 + landscape + zoom 200% · taules (scroll vs stack) · drawer sidebar · touch ≥44px · safe areas.
6. **Components**: taules (scope/sticky/hover/ordenació/responsive), formularis (htmlFor/labels/placeholders/help/errors inline/min=0/validació client+servidor/autosave), modals (ESC/clic-fora/focus-trap/scroll-lock), dropdowns/dates (teclat/locale), badges/cards/tabs/toggles/tooltips/avatars (fallbacks).
7. **Estats**: buit (missatge+CTA) · càrrega (skeleton) · error (catch+toast+retry) · 404/[param] inexistent · edge cases (0/negatiu/null/molt gran).
8. **Interacció/funcions**: cada botó/toggle/form/dropdown fa el que ha de (cap no-op) · filtres/cerca/ordenació/paginació persisteixen a searchParams · confirmació en destructius (mai confirm() natiu) · toast a cada acció · optimistic+rollback · exportacions (CSV/PDF).
9. **Dades/lògica**: càlculs (marge/IVA/cost) exactes i font única · format moneda/dates/números/% via helpers (locale ca) · timezone · validació de rangs · ordre per defecte sensat.
10. **Accessibilitat**: teclat (tab order), focus management post-acció, aria-live/roles/landmarks, aria-label, alt, contrast, reduced-motion.
11. **APIs/cablejat**: endpoint existeix/respon, auth+CSRF+requirePermission, sense fetch a rutes mortes · cablejat entre òrgans (params correctes lead→reserva→client→pressupost→dossier).
12. **Enllaços**: interns 0 404 · externs (Waze/Maps/WhatsApp/Holded/Stripe/web) destí+params · rel="noopener" · deep-linking.
13. **Seguretat**: sanitització (XSS), uploads (MIME+mida), IDOR, secrets a env, logs sense PII.
14. **Copy/i18n**: ortografia catalana normativa, to consistent (tu/vostè), terminologia única (glossari), 0 hardcoded, plurals, microcopy accionable.
15. **Estructura/codi**: codi mort (orfes), duplicació, monocapa, components massa grans, convencions de noms.
16. **Performance**: N+1, paginació servidor, lazy/memo, next/image+webp, cache headers.
17. **Cobertura**: test per codi nou/tocat, casos límit, E2E dels fluxos crítics.

> PDFs (extra): portada/capçalera/peu, paginació, salts de pàgina, taules, logo, **placeholders amb dades reals**, metadades, mida.
> Emails (extra): HTML responsive, dark-mode, logo, signatura, preheader, subject, plain-text fallback, **preferredLocale**, spam score.

## ESTRATÈGIA ACORDADA AMB EL PROPIETARI (2026-06-27) — VERTICALS PRIMER, HORITZONTALS DESPRÉS

Decisió conjunta: **NO** auditoria horitzontal de 92 pàgines d'entrada (inabastable, es
dilueix, i els guards ja cobreixen molt del CSS/canon). Es prioritza **PROFUNDITAT sobre
amplada**, perquè els bugs que costen diners (marge, pagament, repartiment, IVA, caixa)
són invisibles a les captures i NO els veuen els guards — només surten seguint la lògica.

### FASE 1 — AUDITORIES VERTICALS (fluxos end-to-end) · «que tot FUNCIONI»
Seguir cada flux de punta a punta amb **dades reals** (un bolo concret), verificant a cada
salt: el número surt de la font única? quadra amb el pas anterior? el cablejat passa el
context (ids/params) correcte? el que es veu aquí és el mateix que a Economia/fitxa?

| # | Vertical (flux) | Recorregut | Estat |
|---|---|---|---|
| **V1** | **ECONÒMICA / COMERCIAL** (el cor) | Lead→Pressupost→Reserva→Cost/Marge→Contracte→Pagament→Repartiment→Caixa/Economia | 🔶 EN CURS |
| V2 | POST-EVENT | Event→Informe→Enquesta→Ressenya→Feedback | ⬜ |
| V3 | COMUNICACIÓ | Lead→Email/Inbox→Seqüències→Timeline client | ⬜ |
| V4 | CLIENT / RECURRÈNCIA | Lead→Client→Portal client (pagament/signatura)→Reactivació/Referrals | ⬜ |
| V5 | CATÀLEG → PREU | Pack/Inventari→Cost→Preu recomanat→Pressupost (cablejat de preus) | ⬜ |

### 🔬 V3 — VERTICAL DE COMUNICACIÓ (1a passada) · Lead→Inbox/Email→Seqüències→Timeline
Dades reals: 53 leadActivity, 6 emailSend.
- ✅ **Arquitectura sòlida**: les escriptures de comunicació passen per helpers tipats (`recordLeadEmailSent`/`recordLeadQuoteSent`/`recordLeadContractSent`…), no inline → font única. La timeline unifica via `timelineQueryService` (canònic).
- ✅ **`pendingResponseFrom` correcte** (qui ha de respondre): últim contacte INBOUND→TEAM, OUTBOUND→CLIENT. 20 tests. La via VIVA (`loadCommTimeline`→`buildCommTimelineFromCanonicalEvents`→`inferDirectionFromCanonicalEvent`) usa `metadata.direction` explícit + `EMAIL_RECEIVED`, amb la heurística de text com a ÚLTIM recurs (robusta).
- 🐛 **V3-#1 · `buildCommTimeline` (raw) + `inferDirection` = codi mort** — funció pública exportada que NOMÉS criden els seus tests; producció usa la versió canònica. La `inferDirection` vella és més fràgil (només heurística de text, sense metadata.direction) però NO s'usa. Candidata a eliminar (verificar 0 consumidors externs fets — confirmat: només tests).
- ⏳ Pendents V3: seqüències comercials (commercialSequenceService), Inbox IMAP↔BD (vinculació via headers X-Orbita), reintent APPEND Sent (#3 auditoria).

### FASE 2 — AUDITORIES HORITZONTALS (disseny pàgina a pàgina) · «que tot sigui IMPECABLE»
Quan les verticals estiguin verdes: les 92 pàgines + 6 PDFs + 13 emails + components, amb
el checklist mestre de 17 blocs. Les taules A-D d'aquest document són per a aquesta fase.

---

## 🔬 V1 — AUDITORIA VERTICAL ECONÒMICA (EN CURS) · branca per branca

> Mètode: cada ramificació és una branca de codi/dades a comprovar (back→front).
> Bolos reals usats: OE-2026-001 (INVOICE+IVA21%), 003 (CASH cash=300), 004 (INVOICE+IVA0%), 005 (CASH).

### Ramificacions identificades (totes s'han de comprovar)
A. Mètode pagament: INVOICE · CASH · TRANSFER · Bizum · Stripe
B. IVA: invoiceRequired (21%) vs no (0%)
C. Estat reserva: PENDING · CONFIRMED · PREPARING · COMPLETED · CANCELLED
D. 2 trams: dipòsit + resta (mètode i estat independents)
E. Qui cobra: Òrbita vs col·laborador (billed/source) — repartiment
F. Composició: pack · serviceLines · extres · desplaçament
G. Cost: col·laborador (real) vs propi (imputat per ratio)

### Troballes V1 (acumulatives)
- ✅ **Càlcul IVA/total CORRECTE** a tots els bolos provats (cost engine matemàticament sòlid: 680+142.8=822.8; 445+0=445).
- 🐛 **V1-#1 · `cashAmount` desconnectat back↔front** — el camp existeix a BD i l'API el pot guardar, però NO es renderitza enlloc, NO té UI per registrar-lo i NO afecta el semàfor de pagament (que mira depositPaid/remainingPaid). Resultat: OE-2026-003 té cash=300 (=total) cobrat però el semàfor el marca «Pendent». **No hi ha manera neta de registrar un pagament en efectiu.** → REPLANTEJAMENT de producte (vol UI d'efectiu que ompli cashAmount + marqui pagat? o és camp llegat a eliminar?).
- 🐛 **V1-#2 · `paymentMethod=INVOICE` vs `invoiceRequired` incoherents** — OE-2026-004 és INVOICE però invoiceRequired=false (paga «per factura» però «sense IVA»). Dos camps que es poden contradir + el nom INVOICE confon amb invoiceRequired. Números OK; és coherència/nomenclatura. → clarificar significat de paymentMethod=INVOICE o renombrar.
- 🐛 **V1-#3 · Ternari de comissió amb branques idèntiques** — `computeCollaboratorNetMargin` (costEngine:265-268): el `if (pricingModel==='DISCOUNT')` calcula `total*pct/100` a les DUES branques. NET_PLUS_COMMISSION no es distingeix. Bug de lògica (o redundància que enganya). → verificar regla de negoci de NET_PLUS_COMMISSION.
- 🐛 **V1-#4 · DOS sistemes de repartiment paral·lels** — (A) línies de servei amb `costAmount`+`resellPrice` = VIU (Masquerade +20% automàtic). (B) `CollaboratorBooking`+`commissionPct`+`computeCollaboratorNetMargin` = BUIT (0 repartiments reals, tots els 5 col·lab a 0%) i amb el bug V1-#3. Sistema B sembla llegat/a mig fer. → decidir: consolidar en un o documentar quin és el canònic.
- ✅ **Markup +20% Masquerade (resellPrice) AUTOMATITZAT** — `RESELL_MARKUP=0.20`, `resellPrice(cost)=ceilToStep(cost*1.2,5)`. S'aplica a la fitxa de productes del col·laborador (`CollaboratorProductsPanel`); el bolo agafa preu venda + cost per separat. NO és manual.
- ⚠️ **V1-#5 · Línia LLIURE de col·laborador sense cost → marge inflat** — `addFreeLine` crea línia amb `revenueAmount` sense `costAmount`. Si s'afegeix Masquerade com a línia lliure (en comptes de «producte de col·laborador»), el cost no entra i el marge surt fals. → guia/validació perquè els serveis de col·lab passin sempre pel flux de producte.
- ✅ **Branca C (estats→caixa)** — forecast de caixa = `status IN [CONFIRMED, PREPARING]`; economia global = `not CANCELLED`. Raonable (previst vs global). `RETIRED` de la 156 és inventoryItem (correcte, no booking).
- 🐛 **V1-#6 · Cristina Rey: lead WON sense reserva** — guanyat però `booking: null`. Si la venda es va tancar, hauria d'haver generat reserva. → verificar si és cas real obert o residu.
- ⏳ Pendents: branca D (2 trams semàfor), F (pack vs línies: marge quadra?), propagació lead→reserva, mètodes TRANSFER/Bizum/Stripe.

### SUPERFÍCIES GROSSES (entren com a verticals/horitzontals segons toqui)
- **W. WEB PÚBLICA** (`orbitaevents.com`): homepage, serveis, packs, portfolio, blog, opinions, contacte, configurador, zones, legal, temàtiques — Fase 2 (disseny) + V-pròpia (conversió/SEO).
- **P. PORTAL DEL CLIENT** (cara externa): accés, reserva, documents, pagament Stripe/Bizum, signatura, enquestes — entra a V1 (pagament) i V4 (client).
- **X. ECONOMIA TRANSVERSAL**: cost engine, marge, IVA, caixa, CAC, repartiment, previsions — és el moll de V1; cap número escapa.

---

## A. PÀGINES ADMIN (92)

| # | Ruta | Vis | Coh | Can | Mon | Resp | Typ | Notes / millores |
|---|---|---|---|---|---|---|---|---|
| 1 | `/admin/activity` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 2 | `/admin/analytics` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 3 | `/admin/blog` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 4 | `/admin/blog/edit/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 5 | `/admin/blog/new` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 6 | `/admin/bookings` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 7 | `/admin/bookings/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 8 | `/admin/bookings/new` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 9 | `/admin/calendario` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 10 | `/admin/calendario/capacity` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 11 | `/admin/campaigns` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 12 | `/admin/canvas` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 13 | `/admin/catalog` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 14 | `/admin/clientes` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 15 | `/admin/clientes/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 16 | `/admin/clientes/reactivation` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 17 | `/admin/clientes/referrals` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 18 | `/admin/cockpit` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 19 | `/admin/collaborators` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 20 | `/admin/collaborators/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 21 | `/admin/cost-calculator` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 22 | `/admin/coverage` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 23 | `/admin/crons` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 24 | `/admin/css-manager` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 25 | `/admin/cuadrant` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 26 | `/admin/cuadrant/repartiment` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 27 | `/admin/discount-codes` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 28 | `/admin/docs/esquema` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 29 | `/admin/docs/full-de-ruta` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 30 | `/admin/docs/organisme` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 31 | `/admin/docs/protocol` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 32 | `/admin/dossiers` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 33 | `/admin/economia` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 34 | `/admin/email-templates` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 35 | `/admin/email-templates/[slug]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 36 | `/admin/emails` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 37 | `/admin/faq` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 38 | `/admin/faq/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 39 | `/admin/faq/new` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 40 | `/admin/features` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 41 | `/admin/google-reviews` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 42 | `/admin/image-manager` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 43 | `/admin/inbox` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 44 | `/admin/inbox/compose` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 45 | `/admin/inbox/settings` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 46 | `/admin/intake` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 47 | `/admin/inventory` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 48 | `/admin/inventory/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 49 | `/admin/inventory/new` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 50 | `/admin/leads` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 51 | `/admin/leads/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 52 | `/admin/leads/arxiu` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 53 | `/admin/leads/reengagement` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 54 | `/admin/manual` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 55 | `/admin/marketing` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 56 | `/admin/mensajes` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 57 | `/admin/packs` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 58 | `/admin/packs/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 59 | `/admin/packs/extras` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 60 | `/admin/packs/new` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 61 | `/admin/portfolio` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 62 | `/admin/post-event` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 63 | `/admin/post-event/feedback` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 64 | `/admin/post-event/playbook` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 65 | `/admin/post-event/reports` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 66 | `/admin/post-event/reports/new` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 67 | `/admin/post-event/surveys` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 68 | `/admin/presupuestos` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 69 | `/admin/presupuestos/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 70 | `/admin/pricing` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 71 | `/admin/privacy` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 72 | `/admin/questionnaires` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 73 | `/admin/questionnaires/[id]` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 74 | `/admin/questionnaires/new` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 75 | `/admin/quick-create` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 76 | `/admin/reporting` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 77 | `/admin/ressenyes` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 78 | `/admin/sales-ops` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 79 | `/admin/salut` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 80 | `/admin/scripts` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 81 | `/admin/settings` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 82 | `/admin/settings/company` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 83 | `/admin/settings/hero` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 84 | `/admin/settings/integrations` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 85 | `/admin/settings/notifications` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 86 | `/admin/settings/quotes` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 87 | `/admin/social` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 88 | `/admin/stats` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 89 | `/admin/studio` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 90 | `/admin/tasks` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 91 | `/admin/tasks/new` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| 92 | `/admin/text-manager` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |

---

## B. PDFs (6) — generar i auditar el PDF real

| PDF | Vis | Coh | Can | Typ | Notes |
|---|---|---|---|---|---|
| dossier | 🔶 | ⬜ | ⬜ | ⬜ | Auditat 2026-06-27: bo de base; 🔴 trencament fons portada-fosca→cos-clar; ⚠️ placeholders XXXXXX; preu poc pes; «1h» orfe |
| cataleg | ⬜ | ⬜ | ⬜ | ⬜ | |
| contracte | ⬜ | ⬜ | ⬜ | ⬜ | |
| factura | ⬜ | ⬜ | ⬜ | ⬜ | |
| informe | ⬜ | ⬜ | ⬜ | ⬜ | |
| pressupost | ⬜ | ⬜ | ⬜ | ⬜ | |

## C. EMAILS / PLANTILLES (13 serveis) — auditar HTML i copy

| Peça | Vis | Coh | Typ | Notes |
|---|---|---|---|---|
| welcome lead | ⬜ | ⬜ | ⬜ | |
| pressupost enviat | ⬜ | ⬜ | ⬜ | |
| recordatori pagament | ⬜ | ⬜ | ⬜ | |
| post-event (informe/enquesta) | ⬜ | ⬜ | ⬜ | |
| seqüències comercials | ⬜ | ⬜ | ⬜ | |
| signatura | ⬜ | ⬜ | ⬜ | |
| (+ plantilles BD email-templates) | ⬜ | ⬜ | ⬜ | |

## D. COMPONENTS COMPARTITS (34) + CSS (13) — auditar tokens, escala, responsiu
PENDENT: revisar app/admin/components/*.tsx i els 13 .css per coherència de tokens i normes de mida.

---

## Troballes transversals (acumulatives)
- **44 `<h2>` Tailwind cru** (text-sm/base/xl) en comptes de .ap-h2 → barreja de títols de secció (bug) i widgets compactes (potser ok). Revisió cas a cas.
- (acumular)

## Bugs ja arreglats durant l'auditoria
- #1190 — semàfor de marge fragmentat → unificat (4 bandes, getMarginBand)
- #1191 — label pagament «Completat/Pagat» incoherent + reporting «(CAC)» enganyós

## Progrés global
- Pàgines auditades a fons (disseny): **0 / 92**
- PDFs: **0,5 / 6** (dossier en curs)
- Emails: **0 / 13**
- Components: **0 / 34**
