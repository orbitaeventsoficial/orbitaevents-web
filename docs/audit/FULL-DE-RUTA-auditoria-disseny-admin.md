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
| **V1** | **ECONÒMICA / COMERCIAL** (el cor) | Lead→Pressupost→Reserva→Cost/Marge→Contracte→Pagament→Repartiment→Caixa/Economia | ✅ TANCADA #1218 |
| V2 | POST-EVENT | Event→Informe→Enquesta→Ressenya→Feedback | ✅ TANCADA #1239 (perímetre no-mail) |
| V3 | COMUNICACIÓ | Lead→Email/Inbox→Seqüències→Timeline client | ✅ TANCADA #1220 |
| V4 | CLIENT / RECURRÈNCIA | Lead→Client→Portal client (pagament/signatura)→Reactivació/Referrals | ✅ TANCADA #1231 |
| V5 | CATÀLEG → PREU | Pack/Inventari→Cost→Preu recomanat→Pressupost (cablejat de preus) | 🔶 EN CURS #1261 |

### 🔬 V3 — VERTICAL DE COMUNICACIÓ (1a passada) · Lead→Inbox/Email→Seqüències→Timeline
Dades reals: 53 leadActivity, 6 emailSend.
- ✅ **Arquitectura sòlida**: les escriptures de comunicació passen per helpers tipats (`recordLeadEmailSent`/`recordLeadQuoteSent`/`recordLeadContractSent`…), no inline → font única. La timeline unifica via `timelineQueryService` (canònic).
- ✅ **`pendingResponseFrom` correcte** (qui ha de respondre): últim contacte INBOUND→TEAM, OUTBOUND→CLIENT. 20 tests. La via VIVA (`loadCommTimeline`→`buildCommTimelineFromCanonicalEvents`→`inferDirectionFromCanonicalEvent`) usa `metadata.direction` explícit + `EMAIL_RECEIVED`, amb la heurística de text com a ÚLTIM recurs (robusta).
- ✅ **V3-#1 · `buildCommTimeline` (raw) + `inferDirection` = codi mort — RESOLT #1197 / reconciliat #1219** — el codi raw ja va ser retirat; els tests ara cobreixen la via viva `buildCommTimelineFromCanonicalEvents`.
- ✅ **Seqüències comercials — RESOLT / verificat #1220** — `commercialSequenceService` és la font viva i entra per automatitzacions diàries, execució manual del lead i endpoint admin; la traça `COMM_SEQUENCE_EXEC` alimenta timeline/metrics i té tests dedicats.
- ✅ **Inbox IMAP↔BD via X-Orbita — RESOLT / verificat #1220** — l'enviament persisteix `EmailSend` amb headers X-Orbita, Message-ID i resultat IMAP (`imapAppendOk`, folder, uid, error); `lib/imap.ts` parseja `In-Reply-To`/`References` i helpers X-Orbita.
- ✅ **Reintent APPEND Sent — RESOLT / blindat #1220** — `emailSentRetryService` reconstrueix MIME des del snapshot + headers persistits i `POST /api/admin/emails/sent/[id]/append-imap` queda coberta amb test HTTP.
- ✅ **V3 tancada en primera passada** — no queden pendents de codi detectats dins Lead→Email/Inbox→Seqüències→Timeline. Reobrir només amb prova viva contrària.

### 🔬 V4 — VERTICAL CLIENT / RECURRENCIA (1a passada) · Lead→Client→Portal→Signatura/Pagament→Reactivació/Referrals
- ✅ **V4-#1 · Toggles del portal només visuals — RESOLT #1226** — `showDocuments=false` ja talla `/contract` i `/invoice`, `showTimeline=false` talla `/timeline`, `showPayments=false` continua tallant `/payments`, i la nav inferior deriva els ítems visibles de la mateixa font `getClientPortalVisibility()`.
- ✅ **V4-#2 · Signatura parcial si falla el PDF firmat — RESOLT #1227** — `signContractOnline()` reverteix `SIGNED` a `SENT` i neteja metadata si `generateSignedContractPdf()` falla; la timeline només registra signatura quan el PDF material existeix.
- ✅ **V4-#3 · PortalAccess desconnectat si el client es vincula tard — RESOLT #1228** — `linkBookingToCustomer()` actualitza els accessos actius del portal quan la reserva passa a tenir customer, tant en vincle a client existent com en creació de client nou.
- ✅ **V4-#4 · Reactivació incloïa clients fusionats — RESOLT #1229** — `loadReactivationCandidates()` filtra `mergedIntoId=null`, com ja feia referrals, perquè la cua no generi tasques ni intents comercials sobre fitxes antigues fusionades.
- ✅ **V4-#5 · Fusió de clients perdia historial operatiu — RESOLT #1230** — `mergeCustomers()` mou bookings, proposals, invoices, tasks, portal access, contactes, consentiments i data requests al customer principal, i `resolveCustomerHubCustomerId()` redirigeix fitxes fusionades cap al canònic.
- ✅ **V4-#6 · Referrals trencats després de fusionar clients — RESOLT #1231** — `mergeCustomers()` reassigna cap al principal els clients que tenien `referredById` apuntant al duplicat i hereta el `referredById` del duplicat si el principal no en tenia.
- ✅ **V4 tancada en primera passada** — client/portal/pagament/signatura/reactivació/referrals queden verificats. La frontera post-event/enquesta/ressenya passa a V2 i els mails automàtics queden fora d'aquest tancament per coordinació amb Claude.

### 🔬 V2 — VERTICAL POST-EVENT (1a passada) · Event→Informe→Enquesta→Ressenya→Feedback
- 🔶 **V2-#1 · Informe intern acceptava dades fora de contracte — RESOLT #1232** — `createAdminPostEventReport()` només permet reserves `COMPLETED`, restringeix `status` a `DRAFT|COMPLETED` i valida valoracions 1-5 abans d'escriure a BD.
- 🔶 **V2-#2 · Estat operatiu post-event no distingia esborrany vs tancat — RESOLT #1232** — `getBookingOperationalSnapshot()` només marca `COMPLETO` quan hi ha informe `COMPLETED` i feedback enviat o enquesta rebuda.
- 🔶 **V2-#3 · Testimoni públic desconnectava booking i descompte — RESOLT #1233** — `POST /api/testimonials` propaga `token+bookingRef`; `submitPublicTestimonial()` enllaça reserva/customer, marca `reviewSubmittedAt`, copia `eventType/eventDate` i desa `discountCodeId` amb l'id real del descompte.
- 🔶 **V2-#4 · Google Reviews admin refrescava cache, no sincronitzava — RESOLT #1234** — `runReviewsSync()` és el runner canònic compartit per cron i admin; `/api/admin/google-reviews/sync` exigeix auth+CSRF i el botó `Refrescar` sincronitza amb SerpAPI abans de recarregar `/api/google-reviews` amb `cache: 'no-store'`.
- 🔶 **V2-#5 · Playbook comptava testimonis no aprovats com a prova social feta — RESOLT #1235** — `loadPostEventPlaybook()` filtra `CustomerTestimonial.isApproved=true`, de manera que una ressenya rebuda però pendent/amagada no tanca l'acció `testimonial`.
- 🔶 **V2-#6 · Copy admin confonia pendent d'enviar amb pendent de resposta — RESOLT #1236** — `/admin/post-event` etiqueta el KPI com `Enquestes sense resposta` (query real: `clientSurvey=null`) i `/admin/google-reviews` reflecteix el cron + refresc manual #1234.
- 🔶 **V2-#7 · Playbook post-event estava orfe del hub mare — RESOLT #1237** — `/admin/post-event` incorpora el quart pas `Playbook` cap a `/admin/post-event/playbook`, amb graella responsive a 4 passos.
- ✅ **V2 tancada en primera passada no-mail — #1239** — informe intern, estat operatiu, testimoni públic/moderació, Google Reviews, playbook i hub post-event queden coherents. El perímetre d'enviament automàtic de mails, Inbox, APPEND i seqüències queda fora d'aquest tancament per coordinació explícita.

### 🔬 V5 — VERTICAL CATÀLEG → PREU (1a passada) · Pack/Inventari→Cost→Preu recomanat→Pressupost
- 🔶 **V5-#1 · `specialistServices` no afectava el càlcul de packs — RESOLT #1241** — `computePackPricingHealth()` ja no força `specialistCount=1` per tots els packs. Els serveis configurats com a especialistes usen 1 especialista; la resta usa 1 operari base, i els llindars de convidats/hores/watts continuen sumant operari de suport.
- 🔶 **V5-#2 · L'editor de pack recalculava amb la fórmula antiga — RESOLT #1242** — `/admin/packs/[id]` usa `computePackEditorPricing()` pur amb la mateixa regla de `specialistServices`.
- 🔶 **V5-#3 · Pressupostos descartava el PVP real dels packs — RESOLT #1243** — `/admin/presupuestos` superposa per `slug` PVP, PVP original, hora extra i `djHours` de BD sobre el fallback estàtic.
- 🔶 **V5-#4 · El PVP real podia arribar tard i no entrar al formulari — RESOLT #1244** — el formulari se sincronitza amb el pack de catàleg quan és un pressupost nou i no hi ha override manual, sense trepitjar propostes existents, custom pack ni drafts locals.
- 🔶 **V5-#5 · L'email manual podia recalcular un total diferent del Studio — RESOLT #1245** — el Studio envia `quoteTotals` explícits i `adminQuoteEmailService` els respecta sense passar pel recalculador legacy.
- 🔶 **V5-#6 · PDF/preview mostraven un total sense IVA diferent de proposta/email — RESOLT #1247** — `computeQuoteStudioTotals()` centralitza subtotal, descompte, IVA i total final. Preview i PDF mostren IVA i comparteixen total final amb proposta, contracte i email.
- 🔶 **V5-#7 · Quick Create confiava en el PVP enviat pel client — RESOLT #1252** — `quickCreate()` resol server-side el `Pack.price` quan hi ha `interestedPackId`, conserva el fallback només sense pack i no fabrica imports amb un pack inexistent.
- 🔶 **V5-#8 · El POST del pressupost de lead acceptava overrides bruts — RESOLT #1253** — `handleLeadQuotePost()` saneja `customPrice`, `customHours` i `packId` igual que el GET, i conserva el pack base quan el body no és vàlid.
- 🔶 **V5-#9 · Extres/descompte de reserva podien distorsionar totals — RESOLT #1254** — la ruta i `createBookingFromInput()` rebutgen o normalitzen imports bruts, i només sumen extres que es poden resoldre i persistir.
- 🔶 **V5-#10 · Propostes acceptaven totals econòmics desquadrats — RESOLT #1256** — les APIs de propostes validen coherència `subtotal`/`discount`/`vatRate`/`vatAmount`/`total`; el PATCH només permet modificar economia si arriba el bloc complet i coherent.
- 🔶 **V5-#11 · La coherència de propostes vivia massa amunt — RESOLT #1257** — `lib/constants/pricing.ts` declara els camps econòmics i `proposalAdminService` és la font única de la regla: rebutja creació/update incoherent abans de Prisma; les rutes només consumeixen aquesta regla.
- 🔶 **V5-#12 · El preu pactat manual de reserva podia ser negatiu — RESOLT #1259** — el PATCH de reserva exigeix `totalPrice` positiu i `updateBookingDetail()` ignora imports manuals no positius abans de recalcular subtotal/IVA/total.
- 🔶 **V5-#13 · Callers interns podien persistir cobraments negatius — RESOLT #1260** — `updateBookingDetail()` retira del patch imports negatius/no finits de `depositAmount`, `remainingAmount`, `cashAmount` i `discount`, preservant només `cashAmount: null` com a neteja explícita.
- 🔶 **V5-#14 · Descompte superior al subtotal generava totals negatius — RESOLT #1261** — `bookingCreationService` i `useBookingPricing` clampen la base post-descompte a 0 quan no hi ha total manual, de manera que total, IVA, paga i senyal i pendent no baixen de zero.

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
- ✅ **V1-#1 · `cashAmount` desconnectat back↔front — RESOLT #1213** — el helper canònic de pagament accepta `cashAmount` + `total` com a cobertura real: efectiu complet = `Pagat`, efectiu parcial = `Parcial`. La llista i la fitxa de reserva consumeixen aquesta lectura, el detall mostra `Efectiu registrat`, i el botó d'efectiu continua escrivint `depositPaid`, `remainingPaid`, `paymentMethod=CASH` i `cashAmount`.
- ✅ **V1-#2 · `paymentMethod=INVOICE` vs `invoiceRequired` incoherents — RESOLT #1211** — el flux de creació desa explícitament `invoiceRequired`, les reserves noves neixen amb `paymentMethod=TRANSFER` i l'admin separa `Fiscalitat` (factura/IVA) de `Cobrament` (canal). El valor `INVOICE` queda etiquetat com a administratiu antic i ja no es pot llegir com a decisió d'IVA.
- ✅ **V1-#3 · Ternari de comissió amb branques idèntiques — RESOLT #1192** — el càlcul es va simplificar i els tests documenten la regla real: la comissió és `total × pct` als dos models; la diferència de negoci viu al `collaboratorPrice`. Era redundància enganyosa, no bug numèric.
- ✅ **V1-#4 · DOS sistemes de repartiment paral·lels — RESOLT #1196** — el propietari confirma que el repartiment canònic és una sola via: línies de servei amb cost + PVP/resellPrice (+20% per defecte). `CollaboratorBooking` queda retirat de la UI operativa i no participa en el càlcul.
- ✅ **Markup +20% Masquerade (resellPrice) AUTOMATITZAT** — `RESELL_MARKUP=0.20`, `resellPrice(cost)=ceilToStep(cost*1.2,5)`. S'aplica a la fitxa de productes del col·laborador (`CollaboratorProductsPanel`); el bolo agafa preu venda + cost per separat. NO és manual.
- ✅ **V1-#5 · Línia LLIURE de col·laborador sense cost → marge inflat — RESOLT #1214** — les línies amb `collaboratorId` exigeixen `costAmount > 0`: l'editor de `/admin/bookings/[id]` bloqueja el desat amb toast i el PATCH `/api/admin/bookings/[id]` retorna `400` si arriba una línia de col·laborador sense cost real. Les línies internes sense col·laborador continuen permeses.
- ✅ **Branca C (estats→caixa)** — forecast de caixa = `status IN [CONFIRMED, PREPARING]`; economia global = `not CANCELLED`. Raonable (previst vs global). `RETIRED` de la 156 és inventoryItem (correcte, no booking).
- ✅ **Branca D (2 trams semàfor) — RESOLT #1215** — `depositPaid` i `remainingPaid` són trams independents; el helper canònic considera qualsevol tram pagat com a `Parcial`, i només marca `Pagat` quan tots dos són certs. Dashboard i Agenda consumeixen aquesta lectura.
- ✅ **V1-#6 · Cristina Rey: lead WON sense reserva — RESOLT #1194 / DADA PENDENT PROPIETARI** — el sistema ja detecta leads `WON` sense reserva i els fa visibles al dashboard/NBA; F2 també redirigeix a crear reserva quan es marca WON sense booking. El que resta és materialitzar les dades antigues reals, no arreglar cablejat.
- ✅ **Branca F (pack + serviceLines + extres + desplaçament) — RESOLT #1217** — el motor ja sumava pack, hores extra, extres, línies i desplaçament; el forat era de lectura en superfícies resum. Fitxa de reserva, llista, dashboard i Economia ara alimenten el costEngine amb `serviceLines`, cost intern de línies pròpies (`aggregateServiceLines`), hores extra i cost de desplaçament.
- ✅ **TRANSFER/Bizum/Stripe — RE-VERIFICAT #1218** — `paymentMethod` queda acotat a canal manual/base (`TRANSFER`, `CASH`, `INVOICE` llegat). Stripe i Bizum són vies per tram: Stripe crea/desa links i el webhook marca `depositPaid`/`remainingPaid`; Bizum declara des del portal i l'admin confirma el tram. La UI de fitxa ho diu com a "Vies per tram".
- ✅ **V1 tancada a nivell de cablejat econòmic/comercial** — no queden pendents de codi detectats dins V1. La propagació lead→reserva queda marcada com a sòlida al `docs/ROADMAP-EXECUCIO.md` F3; només reobrir-la si una prova viva contradiu el roadmap.

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
