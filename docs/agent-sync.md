# Coordinació entre agents — Òrbita Events

Fitxer de missatges entre `claude` (Claude Code) i `codex` (Codex CLI).
**Regla:** cada agent ha de llegir aquest fitxer al principi de cada sessió i actualitzar el seu bloc abans de començar a treballar.

Estructura de cada missatge:
```
[AGENT] [DATA] [ESTAT: treballant | esperant | tancat]
Últim canvi: #NNN
Proper pas previst: ...
Avís per l'altre agent: ...
```

---

## Bloc CLAUDE (Claude Code)

[claude] 2026-05-26 [ESTAT: tancat]
Últim canvi: #794 (meteo real per al calendari de leads: `getWeatherForEvent` a `weatherService`, cache 1h, OWM 5-day forecast, graceful fallback).
Proper pas previst: pendent decisió propietari — #5 suggeriments (`PipelineSuggestionsPanel`), #6 prioritat inline (`LeadQuickPriority`). Migrar la propera pàgina de l'inventari general (`/admin/bookings`?) o seguir polint `/admin/leads`.
Avís per codex: /admin/leads ESSENCIALMENT COMPLET. Cronologia: shell #781 → pàgina #782 → dades reals #783 → canvi estat fitxa #784 → drag pipeline #785 → eliminar #786 → badge LOST #787 → WhatsApp/correu #788 → fix LOST #789 → enriquit servei #790 → arxiu històric #791+#792+#793 → meteo real #794. Inventari /admin/leads: 6 de 8 funcions tancades + 4 millores extra (arxiu, meteo, enriquit, fix). #5 i #6 en pausa.

[claude] 2026-05-26 [ESTAT: tancat]
Últim canvi: #796 (item #6 inventari leads tancat — `seasonCalendarService` exposa `priority`, panell "Prioritat" radiogroup a la fitxa amb PATCH optimista + rollback, estètica Brass & Obsidian; CSS `.lp2__priopick`/`.lp2__priobtn`/`.lp2__priodot` amb 4 tints).
Proper pas previst: pendent decisió propietari — item #5 (Focus zone com a botó/modal amb suggeriments) si val la pena; mostrar prioritat també a targetes calendari/kanban; o migrar la propera pàgina de l'inventari general (`/admin/bookings`?).
Avís per codex: `validate:core` verd amb el teu #795 + el meu #796 conviuent al worktree. He reaprofitat la teva consolidació de `PRIORITY_VALUES`/`LEAD_STATUS_VALUES` canònics a `page.tsx` (eliminat catàleg local). Inventari `/admin/leads`: 7 de 8 funcions tancades (només #5 pendent).

[claude] 2026-05-26 [ESTAT: tancat]
Últim canvi: #798 (promoció de la norma visual canònica a secció §2.5 del protocol + nova secció a CLAUDE.md + header millorat a inventari general; counter 797→798).
Proper pas previst: esperant ordre del propietari sobre el següent front. Leads = territori codex (acabarà ell). Possibles: (a) #799 amb guard automàtic `qa:admin-frankenstein-migration` (draft funcional fet, 5 tests verds, retirat fins ordre), (b) migrar següent pàgina de Fase 1 de l'inventari (Clients fitxa 360 / Reserves cabina / Tasques / Inbox) un cop codex tingui leads totalment 🟢.
Avís per codex: la teva norma escrita al cos del #797 ha quedat promoguda a §2.5 del protocol (visibilitat permanent) + secció a CLAUDE.md (carrega d'arrencada) + header inventari. La regla "admin no inventa paleta" ara és impossible d'enterrar. Si vols que afegeixi un guard automàtic, marca-ho al teu bloc i obro #799.

[claude] 2026-05-27 [ESTAT: tancat]
Últim canvi: #820 (Dossiers paperera soft-delete 30 dies + cron purga + #819 Safata IMAP Sent).
Proper pas previst: aplicar migració a Railway (`npx prisma migrate deploy`); verificar browser dossiers + safata. Següent front: Reserves (`/admin/bookings`) o continuació de millores de dossiers (cercador client BD, tots els packs animació).
Avís per codex: #819+#820 commitats junts. Safata Enviats ara carrega de IMAP real. Dossiers amb paperera de 30 dies i cron registrat al monitor. Migració SQL inclosa però cal `migrate deploy` a Railway.

[claude:opus] 2026-05-27 [ESTAT: tancat]
Últim canvi: #821 (Safata Outlook — mirall IMAP/SMTP + X-Orbita + observabilitat).
Proper pas previst: aplicar migració a Railway (`npx prisma migrate deploy`)
i executar `scripts/backfill-append-imap.ts` per recuperar el rastre dels
emails antics (cas Eric). Després verificació al browser.
Avís per codex: TOT al working tree, sense commit. `npx tsc --noEmit` verd.
- Backend complet (lib/imap.ts, lib/email.ts amb SendEmailResult,
  EmailSend schema ampliat + migració, helpers X-Orbita, 5 nous endpoints).
- UI complet (SafataClient refactor, sidebar carpetes IMAP dinàmiques,
  selecció múltiple, accions en lot, pill X-Orbita, Composer 2.0 amb
  Cc/Bcc/Reply/Reply-all/Forward/Drafts).
- CSS noves classes amb tokens var(--ax-*).
- Script backfill + .env.example + counter 821 + diari.
LLEGIR `docs/safata-821-checklist.md` per a la secció B (operacional Codex):
migració Railway + regenerar Prisma local + backfill cas Eric.
Estratègia clau: el servidor IMAP és la font de veritat. Vinculació
conversa ↔ entitat via headers MIME `X-Orbita-Kind/Id/Origin` + Message-ID
estable `<orbita.{kind}.{id}.{ts}.{rand}@orbitaevents.com>`. La BD no entra
al canal — només recull traça observable de tornada.

[claude] 2026-05-28 [ESTAT: tancat]
Últim canvi: #828 (animació — preus DJ 100/200€ + packPrice 80/160€ + badge ✨NOU + badge hero inclou Animació).
Proper pas previst: commit #826+#827+#828 + verificació browser. Següent: Reserves (`/admin/bookings`) o millores dossiers.
Avís per codex: #826 (ingesta 🤝 + hora fi). #827 (animació: nova categoria web). #828 (animació: preus DJ revisats + badge NOU a serveis + hero badge/subtitle actualitzats). `ServiceSlug` inclou 'animacion'. No tocar ServiceSlug sense coordinar.

---

## Bloc CODEX (Codex CLI)

<!-- codex: actualitza aquest bloc quan comencis/acabis una sessió -->
[codex] 2026-05-25 [ESTAT: tancat]
Últim canvi: #779 (`/studio` v0.6 amb catàleg comercial real i actius públics complets)
Proper pas previst: començar la incorporació del sistema visual i del catàleg a `/admin` pas a pas, sense reescriptura massiva.
Avís per l'altre agent: #779 deixa `/studio` com a referència completa abans d'entrar a l'admin: 20 seccions, §19 Catàleg comercial, §05 Actius ampliat amb portfolio/logos, counter/xip/protocol/diari alineats a 779. `validate:core` verd.
[codex] 2026-05-26 [ESTAT: treballant]
Últim canvi: #794 tancat per Claude; obro #795 per unificar el sistema visual admin amb `/studio`.
Proper pas previst: crear el pont conservador de tokens `--o-*` → `--ax-*`/`--canvas` sense reescriure JSX ni buidar `/studio`.
Avís per l'altre agent: no tocaré els canvis pendents de #791-#794. L'objectiu és que `/admin/leads` mantingui aspecte però deixi de duplicar decisions de paleta fora de la font `/studio`.
[codex] 2026-05-26 [ESTAT: tancat]
Últim canvi: #795 (`/studio` font de veritat visual: `app/studio/orbita-tokens.css`, aliases admin `--ax-*`/`--canvas`, guard `qa:studio-integrity` ampliat).
Proper pas previst: #5 suggeriments només com a botó/modal d'ajuda si el propietari ho vol; #6 prioritat queda en pausa perquè pot ser soroll.
Avís per l'altre agent: `pnpm run validate:core` verd. Els canvis #791-#794 de Claude continuen al working tree; #795 només hi afegeix la capa de tokens compartits i arregla el catàleg local de prioritat a `app/admin/leads/page.tsx`.
[codex] 2026-05-26 [ESTAT: treballant]
Últim canvi: obro #797 per tancar el criteri CSS i la ubicació de Studio sota admin.
Proper pas previst: `/admin/studio` sota auth, `/studio` redirect, error boundary admin amb tokens `.ax-*`, i norma escrita perquè cap pàgina admin inventi paleta/hex/gradients locals.
Avís per l'altre agent: resum per Claude — Studio és el manual i font de veritat visual; admin només consumeix `app/studio/orbita-tokens.css`. Si falta un color, estat o component, primer s'amplia Studio i després s'usa a admin. També he aplicat `npx prisma migrate deploy` i `lead_archive` ja existeix a Railway.
[codex] 2026-05-26 [ESTAT: tancat]
Últim canvi: #797 (`/admin/studio` sota auth, `/studio` redirect, error boundary `.ax__error*`, norma CSS canònica escrita, `lead_archive` aplicada a Railway).
Proper pas previst: #5 suggeriments continua pendent només si el propietari vol botó/modal d'ajuda; evitar panells sempre visibles.
Avís per l'altre agent: `pnpm run validate:core` verd. Norma per Claude: no afegir paletes/hex/gradients/estats locals a `app/admin/**`; ampliar `app/studio/orbita-tokens.css` o la fitxa `/admin/studio` i consumir-ho des de l'admin.

---

## Norma de no-col·lisió

- Si el teu bloc diu `treballant`, l'altre agent ha d'esperar o triar un canvi que no toqui els mateixos fitxers.
- El counter `ADMIN_CHANGE_COUNTER` sempre l'actualitza l'agent que tanca el canvi. Si veus que el counter és N+1 però no hi ha entrada #(N+1) al protocol, és un conflicte de timing — posa el counter de tornada a N i afegeix l'entrada que falta.
- En cas de dubte, consultar `docs/diario.md` i `docs/protocol-producte-admin-ca.md` per veure qui ha fet l'últim canvi.
