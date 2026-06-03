# Implantació — `/studio-lab/leads` → admin real

> **ESTAT 2026-06-03:** `/studio-lab/leads` ha estat retirat del codi. Aquest checklist queda com a arxiu històric de la migració visual cap a `/admin`, no com a ruta activa.

> Checklist per portar el prototip **"Brass & Obsidian"** (calendari de caps de setmana + pipeline) de `/studio-lab/leads` cap a l'admin real, reutilitzant tot el que ja existeix. Prototip = laboratori amb dades de mostra. Aquest document és el pont cap a producció.

## 0. Numeració de canvis (perquè TOT vagi lligat)

Hi ha **tres seqüències diferents** i és normal que NO coincideixin:

| Seqüència | On viu | Valor actual | Qui la mou |
|---|---|---|---|
| **Canvi registrat** (xip UI) | `ADMIN_CHANGE_COUNTER` (`lib/constants/admin.ts`) ↔ `docs/protocol` ↔ `docs/diario` ↔ `LAB_CHANGE_NUMBER` | **#772** | manual, cada agent |
| **PR de GitHub** | missatges de commit `(#NNN)` | **#767** | GitHub, en fer merge |
| **Iteracions visuals** | captures `.codex-captures/*-vNN-*` | v18 | informal, no es registra |

- La regla del guard (`scripts/check-admin-change-log.mjs`): **`ADMIN_CHANGE_COUNTER` == màxim `### Canvi #N` del protocol**, sense duplicats, i l'entrada actual ha de tenir propietat (`Començat/Treballant/Tancat per`) + 3 capes de validació (`tècnica/funcional/humana`).
- "Lligat" = aquestes 4 fonts (counter, protocol, diario, xip) sempre amb el **mateix** número i **sense forats**. El número de PR de GitHub és una altra cosa i no s'ha de forçar a coincidir.
- ⚠️ No saltar números (p. ex. a #776) deixaria forats #772–#775: això és *menys* lligat. La sèrie contigua és la correcta.

## 1. Funcions del prototip vs. què ja tenim codificat

| Funció al prototip | Ja existeix a l'admin real? | Acció |
|---|---|---|
| Pipeline per estats (kanban) | ✅ `app/admin/leads/LeadPipelineView.tsx` + `LeadViewToggle` | **Reutilitzar**, no refer |
| Fitxa de lead | ✅ `app/admin/leads/[id]/` (`LeadWorkspace`, score, notes, activitats, documents) | **Reutilitzar** la fitxa rica; la del prototip és una maqueta |
| Colors d'estat | ✅ `app/admin/leads/colorTheme.ts` (configurables per l'usuari, CSS vars `--lead-status-*`) | **Reutilitzar** — NO duplicar la paleta del lab |
| Estats de lead | ✅ enum `LeadStatus`: NEW, CONTACTED, QUOTE_SENT, NEGOTIATING, WON, LOST | **Mapar** (prototip en té 4; real en té 6) |
| Suggeriments / "Pròxima decisió" | ✅ `lib/services/leadPipelineSuggestionsService.ts`, `commercialScoring.ts` | **Connectar** a la barra de decisió |
| Previsió meteo per esdeveniment | ✅ `lib/services/weatherService.ts` | **Connectar** a la targeta/fitxa |
| Marge / valor econòmic | ✅ `costEngine.computeBookingFinancialSummary()` | **Usar sempre**; mai marge inline |
| Dades de client | ✅ `fetchCustomerHub()` | **Reutilitzar** a la fitxa |
| Re-engagement | ✅ `app/admin/leads/reengagement/`, `leadReengagementService.ts` | Enllaçar |
| **Calendari de caps de setmana** (vista temporada) | ❌ no existeix com a tal a leads | **NOU** — la peça estrella a construir |
| **Selector de mesos** (córrer tot l'any) | ❌ | **NOU** |
| **Tira d'indicadors de temporada** | parcial (`adminStatsService`) | Afegir agregats concrets |

## 2. Model i dades (mapatge real)

`model Lead` (a `prisma/schema.prisma`) ja porta el que cal:
- `eventDate DateTime?` → eix del calendari de caps de setmana (filtrar Dv/Ds/Dg).
- `eventType EventType`, `eventLocation`, `guestCount`, `eventSchedule` → capçalera de targeta.
- `status LeadStatus`, `priority Priority`, `assignedTo`, `preferredLocale`.
- Relacions: `booking`, `proposals`, `activities`, `notes`, `documents`.

Decisions a tancar:
- [ ] **Valor econòmic del lead**: `Lead.budget` és **String lliure**, no serveix per sumar. El valor "real" surt de `proposals[]`/`booking` via `costEngine`. Definir: mostrar valor estimat de la proposta activa (o rang del pack `interestedPackId`).
- [ ] **Mapatge d'estats 6→vista**: decidir si el calendari mostra els 6 estats amb el seu color o n'agrupa (p. ex. QUOTE_SENT + NEGOTIATING dins "en curs"). El pipeline ha de mantenir els 6.
- [ ] **Font del calendari**: només `Lead.eventDate`, o també `Booking` confirmats? (probablement: leads oberts + reserves de la temporada).
- [ ] **Leads sense `eventDate`**: safata a part (no caben al calendari).

## 3. Capa de servei (reutilitzar; afegir el mínim)

- [ ] `seasonCalendarService` (NOU): donada una finestra de mesos, retorna per cap de setmana { lead/booking, estat, valor (costEngine), meteo (weatherService) }. Pur, testejable, amb el patró de mock de Prisma.
- [ ] Agregats de la tira (entrades, pipeline obert, guanyat, valor temporada) → ampliar `adminStatsService` o servei propi; **sense** càlcul inline al component.
- [ ] "Pròxima decisió" → `leadPipelineSuggestionsService` (ja existeix).
- [ ] Marges → `costEngine`. Cost vehicle → `fuelReferenceService`. Mai recalcular.

## 4. API i seguretat

- [ ] Tota ruta nova sota `/api/admin/*` amb `requireAuth` (sense excepcions).
- [ ] Reutilitzar `leadRouteService` per a mutacions d'estat (validació backend, auto-LOST/DELETE).
- [ ] CSRF a fetch mutants d'admin (guard `qa:admin-mutating-fetch-csrf`).

## 5. UI i sistema visual (on va cada cosa)

- [ ] Components nous: `SeasonCalendar`, `MonthSelector`, `WeekendTile`, `SeasonStatStrip`, `DecisionBar`. La fitxa i el pipeline = els reals.
- [ ] **Tokens visuals**: el lab té paleta pròpia inline (acceptat com a laboratori). A l'admin real, els colors van a `app/admin/admin-theme.css` / `globals.css` amb prefix `html.admin-mode`. **Zero hex als components** (guards `qa:no-inline-hex`, `qa:no-inline-rgba`).
- [ ] **Colors d'estat**: usar `colorTheme.ts` (configurables), NO la paleta joia del lab. Decidir si la direcció "Brass & Obsidian" (or + carbassa + neutres càlids) entra com a tema base de l'admin o només com a accent — afecta `admin-theme.css`.
- [ ] Gradients admin → classes `.admin-gradient--*` (mai gradients Tailwind directes). Sense `slate-*`/`gray-*`.
- [ ] Material plàstic (relleu/enfonsat), atmosfera i gra → tokens/utilitats compartides, no inline.

## 6. i18n · A11y · Responsive

- [ ] Admin = **català directe** (sense `t()`); el prototip ja ho és. ✓
- [ ] Formats: `formatDate`/`formatCurrency`/`formatDateTime` centralitzats (mai `toLocaleString` inline — guards actius).
- [ ] A11y: `aria-label` a selector de mesos i fletxes, `scope="col"`, focus ring visible, contrast ≥ AA (revisar carbassa+text), `role`/`aria-pressed` als toggles.
- [ ] Responsive 375/tablet/desktop; estat buit elegant per mesos sense bolos; `loading.tsx` (skeleton).

## 7. Tests

- [ ] `seasonCalendarService` → `__tests__/lib/services/seasonCalendarService.test.ts` (èxit, finestra de mesos, clamp, leads sense data, suma de valors via costEngine mockejat).
- [ ] Mapatge d'estats i agregats → tests unitaris.
- [ ] E2E mínim: canviar de mes, obrir fitxa des d'una targeta, alternar Calendari/Pipeline.

## 8. Migració i neteja

- [ ] Decidir punt d'entrada real: substituir `app/admin/leads/page.tsx` (vista per defecte calendari) o afegir una pestanya "Temporada".
- [ ] Feature flag / rollout si convé; conservar kanban i llista existents.
- [ ] En retirar el prototip, grep complet: component → servei → ruta → test → constants → i18n.
- [ ] Actualitzar `docs/estat-admin.md` i `docs/diario.md` en tancar cada fase.

## Ordre suggerit (per talls petits i lligats)

1. `seasonCalendarService` + tests (sense UI).
2. `SeasonCalendar` + `MonthSelector` darrere pestanya "Temporada" a `/admin/leads`.
3. `WeekendTile` amb meteo + valor reals (weatherService + costEngine).
4. Tira d'indicadors + barra "Pròxima decisió" (suggestions service).
5. Tokens visuals a `admin-theme.css` (decidir abast del tema "Brass & Obsidian").
6. A11y/responsive/empty/loading + E2E.
7. Decidir vista per defecte i retirar maqueta.
