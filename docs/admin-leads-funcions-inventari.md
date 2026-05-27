# Inventari de funcions — `/admin/leads` (Quarantena Frankenstein)

> **Propòsit**: registre de totes les funcions del vell admin de leads que han quedat en quarantena quan s'ha substituït la pàgina principal pel disseny Brass & Obsidian del studio-lab (Canvi #782). Cada funció aquí documentada espera ordres per ser aplicada al nou sistema, adaptada o descartada.
>
> **Regla**: res s'elimina del disc sense ordre explícita. Els fitxers en quarantena continuen al directori `app/admin/leads/` però no els importa cap pàgina activa.

---

## Components en quarantena (`app/admin/leads/`)

### `LeadActions.tsx`
**Funció**: menú d'accions per a un lead concret (eliminar, canviar estat, anar a WhatsApp, crear reserva).
**Dependències**: `ConfirmDialog` / `useConfirmDialog`, `LeadLostStatusPrompt`, `leadStatusClient.patchLeadStatus`, `fetchWithCsrf`, `LEAD_STATUS_OPTIONS`, `PRIORITY_LABELS`, `buildLeadWorkspaceHref`.
**Funcions clau**:
- Eliminació amb diàleg de confirmació (bloquejada si hi ha reserva).
- Canvi d'estat inline (inclou flux LOST amb motiu canònic).
- Canvi de prioritat inline.
- Accés directe a WhatsApp del client.
- Accés a la fitxa del lead / creació de reserva.
**Estat**: 🔴 Quarantena · **Prioritat alta** — és la funció d'acció principal sobre cada lead.

---

### `LeadQuickStatus.tsx`
**Funció**: selector inline d'estat per a un lead (dropdown o botons), amb flux LOST.
**Dependències**: `useToast`, `useRouter`, `LeadLostStatusPrompt`, `patchLeadStatus`, `LEAD_STATUS_OPTIONS`.
**Funcions clau**:
- Canvi d'estat directe des de la targeta (sense obrir fitxa).
- Gestió del flux LOST (motiu obligatori).
- Toast d'èxit/error.
- Refresh de la pàgina.
**Estat**: 🔴 Quarantena · **Prioritat alta** — el canvi d'estat inline és la interacció central del pipeline.

---

### `LeadPipelineView.tsx`
**Funció**: vista kanban del pipeline de leads amb drag & drop (HTML5), filtres avançats i cerca.
**Dependències**: `PipelineBoard`, `LeadLostStatusPrompt`, `LeadLostReasonBadge`, `patchLeadStatus`, `useToast`, constants múltiples (`EVENT_TYPE_ICONS`, `PRIORITY_DOT_CLASS`, `LEAD_PIPELINE_COLUMNS`, etc.), `buildLeadWorkspaceHref`, `buildLeadCustomerContinuityTarget`, `buildBookingHref`.
**Funcions clau**:
- Kanban amb columnes per estat: NEW / CONTACTED / QUOTE_SENT / NEGOTIATING / WON / LOST.
- Drag & drop optimista (actualització visual immediata, patch API en background).
- Filtres: estat, prioritat, tipus d'event, canal, cerca de text, rang de dates.
- Cerca amb `useDeferredValue` (sense bloqueig).
- Menú de context per lead: obrir fitxa, WhatsApp, fitxa client, reserva.
- Integració de `PipelineBoard` (component compartit del kanban).
**Estat**: 🔴 Quarantena · **Prioritat alta** — el pipeline és la vista "Temporada" del nou disseny.

---

### `LeadLostStatusPrompt.tsx`
**Funció**: modal inline per seleccionar motiu de pèrdua abans de marcar un lead com a LOST.
**Dependències**: `LEAD_LOST_REASONS`, `LEAD_LOST_REASON_LABELS` de `lib/constants/leadLoss`.
**Funcions clau**:
- Select de motiu canònic (del catàleg compartit, no hardcoded).
- Camp de nota lliure.
- Botons cancel·lar / confirmar amb estat de loading.
**Estat**: 🔴 Quarantena · **Prioritat alta** — necessari per qualsevol acció que pugui marcar LOST.

---

### `LeadLostReasonBadge.tsx`
**Funció**: badge visual que mostra el motiu de pèrdua d'un lead en estat LOST.
**Dependències**: `LEAD_LOST_REASON_LABELS` de `lib/constants/leadLoss`.
**Funcions clau**:
- Traducció del motiu canònic a text llegible.
- Presentació discreta com a badge/etiqueta dins la targeta.
**Estat**: 🔴 Quarantena · **Prioritat mitjana** — útil per donar context visual als leads perduts.

---

### `LeadQuickPriority.tsx`
**Funció**: selector inline de prioritat d'un lead (LOW / MEDIUM / HIGH / URGENT).
**Dependències**: `useToast`, `useRouter`, `fetchWithCsrf`, `PRIORITY_LABELS`.
**Funcions clau**:
- Canvi de prioritat directe des de la targeta.
- Toast d'èxit/error.
- Refresh de la pàgina.
**Estat**: 🔴 Quarantena · **Prioritat mitjana** — millora la usabilitat de la vista pipeline.

---

### `PipelineSuggestionsPanel.tsx`
**Funció**: panell de suggeriments automàtics del pipeline (leads que necessiten acció urgent).
**Dependències**: `/api/admin/leads/suggestions` (GET), `PipelineSuggestion` type de `leadPipelineSuggestionsService`.
**Funcions clau**:
- Fetch de suggeriments en muntar el component.
- Agrupació per prioritat: CRITICAL / HIGH / MEDIUM / INFO.
- Presenta leads que superen SLA, que no han tingut contacte, o que estan bloquejats.
- Es renderitza a zero si no hi ha suggeriments.
**Estat**: 🔴 Quarantena · **Prioritat mitja-alta** — el "focus zone" del nou disseny és la seva evolució natural.

---

### `LeadViewToggle.tsx`
**Funció**: toggle entre vista llista i vista kanban.
**Dependències**: `useRouter`, `useSearchParams`.
**Funcions clau**:
- Commuta el searchParam `view=list|kanban`.
- Indicador visual de la vista activa.
**Estat**: 🔴 Quarantena · **Prioritat baixa** — el nou disseny ja té vista calendari/pipeline integrada.

---

### `colorTheme.ts`
**Funció**: mapa de colors per a estats de leads (per la vista pipeline antiga).
**Dependències**: Cap (constants pures).
**Funcions clau**:
- Colors de fons, text i vora per cada estat (NEW, CONTACTED, WON, LOST, etc.).
**Estat**: 🔴 Quarantena · **Prioritat baixa** — el nou sistema usa tokens CSS (`.fx-root.is-contrast` / Brass & Obsidian). Pot ser font de referència de semàntica visual, no s'importa.

---

### `leadStatusClient.ts`
**Funció**: helper client-side per fer PATCH d'estat d'un lead via API.
**Dependències**: `fetchWithCsrf`, `/api/admin/leads/[id]/status`.
**API**:
```ts
patchLeadStatus({ leadId, status, lostReason?, note? }): Promise<any>
```
**Estat**: 🟡 Quarantena · **Prioritat crítica** — és la capa d'escriptura d'estat. El nou disseny l'haurà d'adoptar directament quan s'activi el canvi d'estat real.

---

## Serveis i API routes relacionats (en ús, no en quarantena)

Aquests recursos NO estan en quarantena — segueixen actius i seran el backend del nou disseny:

| Servei / Ruta | Fitxer | Funció |
|---|---|---|
| `leadRouteService` | `lib/services/leadRouteService.ts` | CRUD leads, validació LOST, delete restringit |
| `seasonCalendarService` | `lib/services/seasonCalendarService.ts` | Calendari de temporada (caps de setmana + leads) — Canvi #780 |
| `leadPipelineSuggestionsService` | `lib/services/leadPipelineSuggestionsService.ts` | Suggeriments automàtics de pipeline |
| `GET /api/admin/leads` | `app/api/admin/leads/route.ts` | Llista leads (filtres, paginació) |
| `GET /api/admin/leads/suggestions` | `app/api/admin/leads/suggestions/route.ts` | Suggeriments pipeline |
| `PATCH /api/admin/leads/[id]/status` | `app/api/admin/leads/[id]/status/route.ts` | Canvi d'estat amb validació |
| `DELETE /api/admin/leads/[id]` | `app/api/admin/leads/[id]/route.ts` | Eliminació (requereix LOST previ) |

---

## Ordre d'aplicació recomanat

Les funcions del nou disseny s'apliquen per ordre d'impacte, una a una, per ordre del propietari:

| # | Funció | Component font | Canvi previst |
|---|---|---|---|
| 1 | Dades reals (Prisma + `loadSeasonCalendar`) | `seasonCalendarService` | ✅ FET — Canvi #783 |
| 2 | Canvi d'estat inline (fitxa) | `leadStatusClient.ts` (`patchLeadStatus`) | ✅ FET — Canvi #784 (botons `lp2__stagepick` + `lp2__commit` a `LeadPage`) |
| 3 | Flux LOST (motiu obligatori) | `LeadLostStatusPrompt.tsx` | ✅ FET — Canvi #784 (integrat dins del panell de canvi d'estat) |
| 2.b | Canvi d'estat des del pipeline (drag & drop entre lanes) | `LeadPipelineView.tsx` (D&D) | ✅ FET — Canvi #785 |
| 4 | Acció eliminar | `LeadActions.tsx` (parcialment) | ✅ FET — Canvi #786 (panell `lp2__panel--danger` + `useConfirmDialog` + restricció LOST) |
| 5 | Suggeriments pipeline | `PipelineSuggestionsPanel.tsx` | Focus zone del nou disseny (evolució del panell) |
| 6 | Prioritat inline | `LeadQuickPriority.tsx` | ✅ FET — Canvi #796 (panell "Prioritat" radiogroup de 4 botons a la fitxa, PATCH optimista a `/api/admin/leads/[id]` amb rollback, estètica Brass & Obsidian + dot semàntic per nivell) |
| 7 | Badge motiu pèrdua | `LeadLostReasonBadge.tsx` | ✅ FET — Canvi #787 (`LostReasonBadge` intern, Brass & Obsidian; pipeline + fitxa; servei propaga `lostReason`) |
| 8 | WhatsApp / Email | `LeadActions.tsx` (parcialment) | ✅ FET — Canvi #788 (WhatsApp `<a>` amb missatge prefilled si hi ha telèfon; correu via `buildLeadComposeHref` al redactor canònic, sense `mailto:`) |

---

*Creat: Canvi #782 — 2026-05-25. Actualitzar quan es tanca cada funció.*
