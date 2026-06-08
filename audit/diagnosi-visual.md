# Auditoria visual + sistèmica · Òrbita Events

**Data:** 2026-05-20
**Captures generades:** 71/78 OK (Playwright headless · viewports 1440×900 i 375×812)
**Pipeline:** `pnpm run audit:visual` → `audit/visual-report.html`
**Versió:** Canvi #703 · base de codi verda (`validate:core` 58 guards + 4463 tests)

---

## 1 · Resum executiu

El sistema té **una base d'enginyeria seriosa** (tests, guards, schema, serveis) i **una identitat visual coherent** (admin dark, accent taronja, OwnerControlStrip transversal). El que falla no és el codi: és l'**operativa real del dev** i un seguit de **fricciones d'execució** que impedeixen experimentar el producte com qui ho compra.

| Categoria | Estat | Risc |
|---|---|---|
| Tests + guards + schema | 🟢 Sòlid | — |
| Identitat visual admin | 🟢 Coherent | — |
| Públic packs + serveis | 🟡 Funcional, polish necessari | Baix |
| Públic home + portfolio + reservar | 🔴 Timeouts + cascada d'errors | **Alt** |
| Admin dashboard + leads + bookings + reporting + inbox | 🔴 Error page (DB) | **Alt operatiu** |
| Portal client (signatura + pagament + galeria) | ⚪ Existeix però no auditat aquesta sessió | A confirmar |
| Performance (logo header, css admin) | 🟡 Duplicació de requests | Mitjà |

---

## 2 · Troballa #1 — Base de dades intermitent (BLOQUEJANT)

**Símptoma:** `prisma:error Can't reach database server at 'tramway.proxy.rlwy.net:57035'` repetit a totes les queries inicials del dev.

**Evidència visual:** captures `admin-dashboard__desktop.png`, `admin-bookings__desktop.png`, `admin-reporting__desktop.png`, `admin-inbox__desktop.png`, `admin-marketing__desktop.png` totes mostren la mateixa pantalla **"Error al panell d'administració"** amb el `Invalid 'prisma.X.findMany()' invocation: Can't reach database server`.

**Impacte:**
- Tu, el propietari, no pots **veure el sistema real des de la teva màquina ara mateix**. Cada vegada que obres el dashboard local, veus error.
- L'auditoria automàtica ha capturat 12+ pàgines en estat d'error, no en estat operatiu.
- Probablement passa a producció en moments puntuals (latència del proxy Railway) i el cap d'usuari ho viu com a "lent" o "petat".

**Causes possibles** (per ordre de probabilitat):
1. La URL del proxy Railway (`tramway.proxy.rlwy.net:57035`) ha rotat — Railway sol fer-ho cada poques setmanes.
2. La DB està en mode "sleep" (Railway Hobby plan).
3. Xarxa local bloqueja port 57035.

> NOTA (2026-06-08): la BD és **exclusivament Railway**. No s'usa Supabase (es va migrar fora fa temps). Qualsevol referència antiga a Supabase és obsoleta.

**Acció recomanada (TU, 5 min):**
- Obrir Railway dashboard → comprovar URL actual del Postgres.
- Provar `DATABASE_URL="<URL nova>" npx prisma migrate status` per veure si connecta.
- Comprovar que el servei Railway estigui despert i no en `sleep mode`.

**Sense això, qualsevol altre canvi visual / UX queda invisible.**

---

## 3 · Troballa #2 — Fricció de dev: rate-limit admin agressiu

**Símptoma:** 5 intents fallits d'auth Basic = 15 minuts bloquejat (in-memory dev). Trobat empíricament al primer run d'auditoria (la pass no es carregava per script Node sense dotenv).

**Codi:** `lib/middleware/admin-rate-limit.ts:3` → `ADMIN_AUTH_LIMIT = 5`, `ADMIN_AUTH_WINDOW_SECONDS = 900`.

**Per què molesta a dev:** qualsevol eina d'auditoria automàtica, script de captures, test E2E manual o curl repetit pot disparar el limit i deixar-te 15 min sense entrar al teu propi dashboard.

**Acció recomanada (5 min de codi):** afegir flag `DISABLE_ADMIN_RATE_LIMIT` que en dev / test només bypass-i el limit:
```ts
if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_ADMIN_RATE_LIMIT === '1') {
  return true;
}
```
Documentar-ho a `.env.example`. NO tocar producció.

---

## 4 · Troballa #3 — Logo header carregat 2-4 cops per pàgina

**Símptoma:** al log del dev server, cada pàgina admin dispara entre **2 i 4 crides** a `/api/public/image-manager?key=layout.logo.admin&key=layout.appleTouchIcon`. A pàgines públiques, el patró és `/api/public/image-manager?key=layout.logo.header` també x2-x4.

**Cost real:** cada crida triga **0,4 - 9 segons** (depèn de la DB). En el pitjor cas, 4 crides × 9s = 36 s gastats en logo abans que la pàgina renderitzi del tot.

**Causa probable:** múltiples components consumeixen `useManagedImageSrc` o `fetchImageManager` sense compartir cache. O server-side el logo es resol per cada component sense memoització request-scope.

**Acció recomanada (~1h):**
- Localitzar `useManagedImageSrc` i el seu servei.
- Memoitzar a nivell de request server (`React.cache()` per RSC) o capa de cache compartida `Map<key, Promise>` per evitar n-crides parallel.
- Test de regressió: visitant `/admin` no fa més d'1 fetch a `layout.logo.admin`.

---

## 5 · Troballa #4 — Hydration warning per atributs `style`

**Símptoma:** captura `contacte__desktop.png` reporta exactament: `console.error: Warning: Extra attributes from the server: %s%s style`.

**Significat:** un atribut `style="..."` viu al HTML SSR però no al render del client (o viceversa). Típicament passa per scripts d'analítica que injecten `style` al `<body>`, o per components que llegeixen `window` fora de `useEffect`.

**Pendent:** localitzar el component que ho fa. Hauria de ser un grep curt: `style={{` que no estigui dins JSX local; o `document.body.style.X =` cridat sense `useEffect`.

**Acció (15-30 min):** localitzar + fixar. Petit però molesta cada càrrega.

---

## 6 · Troballa #5 — Pàgines públiques amb timeout

**Símptoma:** `/ca`, `/es`, `/en`, `/ca/servicios/fiestas` van timeout-ar a 45 s (Playwright domcontentloaded) en mobile. Desktop també a la primera passada.

**Hipòtesi:** la primera càrrega d'una pàgina pública dispara compilació Next.js + ~3-5 queries Prisma + portfolio media + reviews + image-manager… si tot va serial i la DB triga, fàcilment supera 45s.

**Acció recomanada:**
- Investigar si hi ha queries paral·lelitzables que avui van serial (mirar amb Lighthouse, no aquí).
- Posar `loading.tsx` reals amb skeleton perquè en perception sigui ràpid.

---

## 7 · Què funciona bé visualment

| Pantalla | Per què mola |
|---|---|
| `packs__desktop.png` + `packs__mobile.png` | Layout clar, jerarquia visual (Des de · preu · durada · convidats · CTA), pack destacat amb halo taronja. Mobile col·lapsa perfectament. |
| `admin-portfolio__desktop.png` | OwnerControlStrip canònic ben aplicat: BBDD / PENDENTS MANUALS / SEGÜENT PAS. 3 cards "QUÈ ESTÀS VEIENT / COM TREBALLAR / PROTECCIÓ" educatives. |
| `admin-emails__desktop.png` | Densitat alta però llegible. Combina KPIs, safata IMAP real, configuració, accions manuals. |
| `admin-settings__desktop.png` | OwnerControlStrip + accessos directes amb icones. Patró clar. |
| `configurador__desktop.png` | Step indicator 1/3, cards d'event type amb icones, preu inicial visible. Bon onboarding. |
| Error page (`Error al panell d'administració`) | **Genial.** Icona, títol clar, missatge curt, `Digest:`, dues accions clares ("Torna-ho a provar" / "Tornar a l'inici"). Si la DB peta, l'usuari no veu una pantalla blanca: veu una pantalla disenyada. |

---

## 8 · Patró visual consolidat (no tocar)

L'admin té convergit un sistema clar:
- **Sidebar** dark, agrupada per `PRIORITAT` (Entrades, Clients, Reserves, Tasques, Calendari) i `OPERACIONS` (Pressupostos, Calculadora costos, Finances, Salut, Col·laboradors, Safata IMAP, Sales Ops, Reactivació, Reengagement leads, Referrals, Campanyes, Capacitat).
- **Top bar** `ADMIN > [secció] · CANVI #N · Ajuda OFF · Cercar Ctrl+K · 🔔 · Admin Configuració`.
- **OwnerControlStrip** com a primera lectura de tota pàgina (BBDD / PENDENTS / SEGÜENT PAS).
- **Cards** glass amb `--at-*` tokens.
- **FAB taronja** (gradient `--admin-gradient--fab`) a baix-dreta.
- **Mobile**: hamburger + bottom nav (Entrades / Clients / Reserves / Tasques / Més).

Aquest sistema és **defensable**. La feina no és canviar-lo: és que cada **contingut** dins d'aquesta closca arribi al nivell del millor del món.

---

## 9 · Replantejament — On apostar (recomanació)

L'usuari ha dit literalment: *"vull el millor de cada programa de gestió d'esdeveniments tot al meu programa propi · ferrari fàcil de conduir · meravellosament preciós · ràpid · millor del món"*.

Donat l'estat actual, proposo aquesta seqüència (no negociable a la lleugera):

### Fase 0 · DESBLOCAR (avui, manual + Sonnet, ~1h)
1. Tu: arreglar connexió DB (Railway o canviar a Supabase). Sense això la resta és cec.
2. Sonnet: afegir `DISABLE_ADMIN_RATE_LIMIT=1` opcional, deduplicar logo-header request, fixar hydration warning.

### Fase 1 · PORTAL DE CLIENT (Sonnet → Opus per decisions, ~30-50h)
És el gran buit del producte i el principal "wow factor" inspirat als tops (Honeybook, Tave, 17hats):
- **Una landing del client** preciosa amb el seu nom + event + foto + comte regressiu.
- **Galeria de fotos** (ja existeix base) — pulir-la al nivell Pic-Time / Pixieset.
- **Pagament** (Stripe ja integrat parcialment) — embed de cobrament del dipòsit + saldo amb confirmació visual.
- **Signatura digital del contracte** (no existeix) — DocuSign-style integrat.
- **Qüestionari pre-event** (ja existeix base) — wizard amb steps.
- **Timeline del dia** (no existeix) — runsheet visible per al client i el seu equip.
- **Pagaments fets** + factura descarregable + invoice tracking.

Tot dins `/portal/[token]` amb branding del client (subdomain o path).

**Per què aquesta primer:** és l'única àrea on **el teu client final viu el sistema directament**. Ferrari per a ells = referral + retenció + alt valor percebut.

### Fase 2 · ADMIN POLISH (Sonnet, ~20-30h)
- Empty states reals a cada workspace (no spinners eternals com a clients).
- Estats `loading.tsx` amb skeleton de la mateixa shape del contingut final.
- Densitat: revisar info-per-pixel. Algunes pàgines (emails, manual) són **massa denses**. Linear / Notion en serien una referència de "menys és més".
- Performance: deduplicar requests, prefetch al sidebar hover, optimistic updates.

### Fase 3 · BRAND BRIDGE (Sonnet + Opus per decisions de marca, ~15-25h)
- Que l'admin, web pública, portal client i emails comparteixin el **mateix llenguatge visual**. Avui són mons diferents.
- Una sola "Òrbita Events" amb consistència total — gradients, tipografies, micro-interaccions, sons (sí, sons subtils en accions clau).

### Fase 4 · AI + AUTOMATITZACIONS (Opus arquitectura, Sonnet execució, ~25-40h)
- Auto-resposta intel·ligent a Inbox amb opcions suggerides (Anthropic SDK + prompt caching).
- NBA (Next Best Action) explicada: avui es calcula però no es justifica al propietari. Que la IA digui "perquè".
- Suggeriments de copy per pressupostos, emails, social posts.

### Fase 5 · POLISH FINAL (Sonnet, ~10-15h)
- Lighthouse > 95 a totes les pàgines públiques.
- Accessibilitat WCAG AAA.
- Micro-interaccions (Framer Motion ja és al projecte, usar més).
- Easter eggs si vols sorprendre.

---

## 10 · Model recomanat per fase

| Fase | Opus 4.7 | Sonnet 4.6 | Haiku 4.5 |
|---|---|---|---|
| 0 Desbloc | — | ✅ Execució | — |
| 1 Portal | ✅ Arq + decisions | ✅ Execució | — |
| 2 Admin polish | — | ✅ Tot | ✅ Renames mecànics |
| 3 Brand bridge | ✅ Decisions visuals | ✅ Execució | — |
| 4 AI | ✅ Arq prompts | ✅ Integració | — |
| 5 Polish final | — | ✅ Tot | ✅ Lints |

**Regla pràctica:** quan jo (Opus) estic picant codi mecànic, estem cremant diners. Quan tu necessites una decisió de producte o un replantejament arquitectònic, val la pena. Per executar passos del roadmap, Sonnet.

---

## 11 · Pròxim pas immediat

**Tu** (5 min): arreglar DB.

**Després** (Sonnet, una sessió nova): obre amb la consigna *"Llegeix `audit/diagnosi-visual.md`. Executa **Fase 0**: (a) afegeix `DISABLE_ADMIN_RATE_LIMIT` opcional al `admin-rate-limit.ts` amb tests, (b) localitza i deduplica les crides a `/api/public/image-manager?key=layout.logo.*`, (c) localitza el component que provoca l'hydration warning d'atributs `style` extres. Crea un canvi per cada un, segueix el protocol §2.1, actualitza diari + counter."*

Després, decidim conjuntament la Fase 1 (Portal client) amb una proposta detallada.
