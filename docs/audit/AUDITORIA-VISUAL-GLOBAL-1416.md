# Auditoria visual global #1416 — radiografia, zenit i full de ruta

Data: 2026-07-04
Agent: `codex`
Perimetre: admin runtime visual. No toca schema, dades, emails reals ni logica de negoci.

## Actualitzacio #1417 — visor viu dins l'admin

El baseline #1416 ja no s'ha de consultar nomes com a JSON/Markdown local. El Canvi #1417 afegeix `/admin/docs/visual-audit`, una superficie admin que llegeix `.codex-captures/visual-audit-1416-final/visual-audit-results.json`, agrupa les rutes per organ, mostra captures desktop/tablet/mobile i marca totes les rutes com a revisio humana pendent.

Us operatiu: abans de tocar visualment una pantalla, obre `/admin/docs/visual-audit`, filtra l'organ o ruta, mira les tres captures i despres ves a `docs/admin-fitxes-pantalles.md` si cal intervencio de codi.

## 1. Que es aquest document

Aquest document es la capa visual de l'atles operatiu d'Orbita Events.

No substitueix:
- `CLAUDE.md`: la constitucio i les normes.
- `/admin/docs/electric-atlas`: l'atles viu del repo real.
- `docs/audit/FULL-DE-RUTA-auditoria-disseny-admin.md`: el programa llarg de disseny total.
- `docs/admin-fitxes-pantalles.md`: les fitxes forenses per pantalla.

El que fa es unir tres coses que sempre han d'anar juntes:

1. **Radiografia real**: que renderitza avui, amb quines rutes, quins viewports, quines captures i quins errors.
2. **Zenit**: quin es el model ideal d'admin, marca, gestio i continuitat.
3. **Full de ruta**: quina distancia hi ha entre l'estat real i el model ideal, i com es converteix en talls verificables.

La regla de lectura per a qualsevol IA nova es simple: abans de proposar una millora visual, primer mira la radiografia; abans de tocar una pantalla, mira la fitxa; abans de canviar una regla, mira el cervell canonic.

## 2. Principi mare

La maquina te dues capes que no es poden confondre:

| Capa | Pregunta | Evidencia |
|---|---|---|
| Radiografia | Que existeix i que passa ara? | Repo escanejat, rutes renderitzades, captures, errors, guards. |
| Zenit | Com hauria de ser si fos perfecte? | Criteris de marca, gestio, UX, negoci, continuïtat i delegacio. |
| Full de ruta | Com passem d'una cosa a l'altra? | Talls petits, protocol, counter, tests, captures i validacio humana. |

Sense radiografia, el zenit es fantasia. Sense zenit, la radiografia es inventari mort. Sense full de ruta, la distancia entre tots dos no genera millora real.

## 3. Que s'ha construit a #1416

### Eina nova

S'ha afegit:

```bash
pnpm run audit:visual:admin
```

Implementacio:

- `scripts/admin-visual-audit.mjs`
- script npm `audit:visual:admin` a `package.json`

L'eina:
- descobreix automaticament rutes admin estatiques;
- importa el resolver existent de `scripts/smoke-render-detail.mjs` per rutes `[id]`;
- autentica amb Basic Auth carregant `.env.local` abans de construir el token;
- captura desktop, tablet i mobile;
- escriu JSON incremental despres de cada ruta;
- escriu Markdown amb matriu de captures;
- deixa les captures a `.codex-captures/`, que es regenerable i no entra al repo.

### Checks per ruta i viewport

Cada ruta/viewpoint queda verificada amb:

- HTTP status;
- shell admin real (`.ax-root` / `#admin-main-content`);
- overflow horitzontal;
- pantalla buida;
- overlay/error de Next detectable;
- errors de consola o `pageerror`;
- assets fallits;
- requests fallides accionables;
- captura creada.

Les `net::ERR_ABORTED` de prefetch/navegacio es conserven al JSON com a evidencia, pero no fan fallar la pagina si no hi ha error real d'asset/API. Això evita falsos vermells en rutes amb links o previews.

## 4. Radiografia final executada

Comanda executada:

```bash
$env:VISUAL_AUDIT_BASE='http://127.0.0.1:3001'
$env:VISUAL_AUDIT_OUT='.codex-captures/visual-audit-1416-final'
$env:VISUAL_AUDIT_VIEWPORTS='desktop,tablet,mobile'
pnpm run audit:visual:admin
```

Resultat final:

| Metica | Valor |
|---|---:|
| Rutes admin auditables | 94 |
| Rutes `[id]` omeses per manca de dades | 1 |
| Viewports | 3 |
| Renders completats | 282/282 |
| Captures creades | 282/282 |
| Checks fallits finals | 0 |
| Rutes amb problemes finals | 0 |

Evidencia regenerable:

- JSON: `.codex-captures/visual-audit-1416-final/visual-audit-results.json`
- Informe Markdown: `.codex-captures/visual-audit-1416-final/visual-audit-report.md`
- Captures: `.codex-captures/visual-audit-1416-final/screenshots/`

Ruta omesa:

- `/admin/questionnaires/[id]`: no hi havia id de dades de prova resoluble en aquesta passada.

## 5. Incidencia real trobada i resolta

La primera passada neta va trobar un warning React repetible a `/admin/analytics`:

- React avisava de claus duplicades amb dimensio `/en`.
- Causa: GA4 pot retornar la mateixa dimensio mes d'un cop i el JSX usava nomes `row.dimension` com a `key`.
- Fix: les llistes GA4 de pagines, fonts i temps real usen clau composta `dimension + index`.
- Validacio: rerun enfocat de `/admin/analytics` en desktop/tablet/mobile: 3/3 OK, 0 checks fallits.

Fitxer corregit:

- `app/admin/analytics/page.tsx`

## 6. Lectura del primer run brut

Abans del criteri final, el primer run gran va trobar soroll que s'ha classificat:

- `net::ERR_ABORTED` en links/previews interns: prefetch o tancament de pagina, no bug visual si la ruta renderitza i no hi ha resposta >=400.
- `/admin/social` tablet va patir `ERR_CONNECTION_RESET/REFUSED`: el dev server de `3001` es va reiniciar durant la passada. Rerun enfocat posterior: OK.
- `/admin/reporting` es una ruta de compatibilitat que redirigeix a `/admin/economia?tab=rendibilitat`; el check final valida shell admin real, no nomes la classe `admin-mode` aplicada per efecte client.

Decisio: el baseline final es el run `visual-audit-1416-final`, no el primer run brut.

## 7. Zenit visual

El model ideal no es "que no peti". El zenit es:

1. **Mateixa ma visual**: qualsevol pantalla admin sembla del mateix sistema, no d'un altre projecte.
2. **Densitat amb calma**: molta informacio, pero jerarquia clara, sense soroll tecnic.
3. **Accio clara**: cada pantalla diu que passa, que importa i que toca fer.
4. **Un sol cervell**: els numeros, labels, estats i regles venen de fonts canoniques.
5. **Sense pantalles decoratives**: una ruta existeix per governar una part real del negoci.
6. **Sense cables muts**: boto, link, filtre, tab, formulari i export han de fer alguna cosa verificable.
7. **Responsiu real**: desktop, tablet i mobil son maneres d'operar, no versions degradades.
8. **Marca funcional**: carbo + or, to Orbita, cap paleta aliena, cap UI d'enginyer on cal UI de propietari.
9. **Continuïtat per IA**: una IA nova ha de poder saber on tocar sense inventar ni duplicar.

Aquest zenit no es dona per aconseguit per tenir 0 errors runtime. El baseline #1416 nomes diu: la superficie renderitza neta i es pot inspeccionar. El judici de bellesa, jerarquia, copy, polidesa i flux encara requereix la fase manual/visual profunda.

## 8. Full de ruta derivat

### Fase V0 — Base runtime visual

Estat: FET #1416.

Objectiu: cap 404, cap overflow horitzontal, cap error JS repetible, captures per viewport.

Resultat: 282/282 captures OK.

### Fase V1 — Lectura humana de captures

Objectiu: revisar les captures finals per organs, no per llista plana.

Ordre:

1. Comandament: `/admin`, `/admin/control`, `/admin/salut`, `/admin/economia`, `/admin/reporting`.
2. Comercial/Documents: leads, dossiers, pressupostos, inbox.
3. Reserves/Operativa: bookings, calendario, cuadrant, tasks.
4. Clients/Partners: clientes, collaborators, compte corrent.
5. Cataleg: packs, inventory, pricing, catalog.
6. Post-event.
7. Sistema/Studio/manual/docs.
8. Web/Marketing.

Sortida esperada: una taula de deute visual amb severitat, captura, ruta, component probable i decisio: arreglar ara / fitxa forense / replantejar / protegir.

### Fase V2 — Interaccions

El baseline #1416 renderitza. Encara no prova:

- clicar tots els botons;
- canviar filtres;
- obrir modals;
- omplir formularis;
- exportar PDF/CSV;
- fer accions destructives amb confirmacio segura;
- comprovar focus, teclat i a11y interactiu.

Cada interaccio critica ha d'anar amb script o Playwright enfocat, no amb intuicio.

### Fase V3 — Documents, PDFs i emails

El visual runtime admin no valida encara:

- PDFs finals;
- dossiers;
- pressupostos;
- contractes;
- factures;
- emails HTML;
- dark mode d'email;
- preheaders;
- annexos de partner;
- consistencia entre preview/admin/PDF/client.

Aixo es una fase propia: captura/generacio de documents reals amb dades representatives i comparacio contra el zenit editorial.

### Fase V4 — Web publica i conversio

El #1416 s'ha centrat en admin. La web publica necessita la mateixa disciplina:

- home;
- serveis;
- packs;
- configurador;
- portfolio;
- blog;
- contacte;
- SEO/metadata;
- formularis;
- i18n real ca/es/en;
- mobile-first.

### Fase V5 — Manual viu dins admin

El resultat ideal es que el propietari no depengui d'un fitxer Markdown extern per entendre l'estat. L'atles i els informes han de poder viure o enllacar-se des de l'admin:

- `/admin/docs/electric-atlas`: mapa tecnic/semantic viu.
- futur: vista d'auditoria visual amb ultimes captures, rutes i estat.

## 9. Com ha d'usar-ho una IA nova

1. Llegeix `CLAUDE.md`, `docs/agent-sync.md`, `docs/admin-diary.md`, `docs/admin-protocol.md`.
2. Obre `/admin/docs/electric-atlas` per saber fitxers, cables, fluxos i punts d'intervencio.
3. Llegeix aquest document per entendre la radiografia visual i la metodologia.
4. Abans de tocar una pantalla, consulta `docs/admin-fitxes-pantalles.md`.
5. Si fas un canvi visual, captura abans/despres en desktop/tablet/mobile.
6. Si el canvi afecta una ruta admin, executa com a minim:

```bash
pnpm run validate:core
pnpm run audit:visual:admin
```

amb `VISUAL_AUDIT_ROUTE_MATCH` acotat a la ruta si el canvi es petit, i complet si el canvi toca shell, tokens, nav o CSS global.

7. Documenta sempre: protocol, diari, counter i agent-sync.

## 10. Limitacions honestes

- 0 checks fallits no vol dir disseny perfecte; vol dir runtime net sota els checks definits.
- Les captures no entren al repo; son evidencia local regenerable.
- Les rutes dinamiques depenen de dades reals disponibles a BD.
- Una auditoria visual no substitueix una auditoria de cablejat, marges, diners o emails.
- El run contra dev server pot patir resets en passades llargues; per això l'script escriu incrementalment i permet reruns acotats.

## 11. Veredicte #1416

La base visual runtime de l'admin queda mesurable i reproduible.

El punt de partida ja no es una opinio: son 94 rutes, 282 captures i un JSON amb checks. El zenit queda definit com a criteri. El full de ruta queda separat en fases per no confondre "renderitza" amb "es perfecte".
