# Handoff — Safata Outlook (Canvi #821 → tancar)

> **Autor**: Claude (Opus 4.7 max-effort). Disseny + backend acabats. UI per a
> Sonnet/Claude. Llegir aquest fitxer SENCER abans de tocar res.
>
> **Branch actual**: `studio-lab/leads-777-shell-lateral-poliment` (working tree)
> **No commitat encara**. El counter `ADMIN_CHANGE_COUNTER` segueix a 820.

## 1. Què vol l'usuari

> *"Necessito que la safata d'entrada es converteixi en un programa de gestió
> de correu com cal, amb entrades, enviats, etc. Mirall del servidor de correu.
> Un Outlook / un Mail dins l'admin. La web admin utilitza el servidor SMTP per
> enviar dossiers, leads, pressupostos. Tot ha de quedar reflectit al folder
> Sent del servidor. La BD no ha de passar pel mig del canal — només per
> recollida de dades de tornada."*

> *"Les converses han de tenir enllaç amb el client / lead / reserva.
> Que la BD no entri al mig del canal."*

**Cinc principis irreductibles** (decideixen tots els tradeoffs):

1. **El servidor IMAP/SMTP és la font de veritat de les converses.** La BD
   `EmailSend` només per a tracking secundari (obertures/clicks).
2. **Tot enviament des de l'admin (dossiers, pressupostos, follow-ups,
   leads, recordatoris) deixa rastre al folder Sent del servidor** —
   automàtic via APPEND IMAP després de SMTP.
3. **Vinculació conversa ↔ entitat sense BD**: via headers MIME
   `X-Orbita-Kind / Id / Origin` + Message-ID estable
   `<orbita.{kind}.{id}.{ts}.{rand}@orbitaevents.com>`. Quan el client respon,
   el seu `In-Reply-To` permet matchejar l'entitat directament del MIME.
4. **Multi-carpeta real**: Entrada, Enviats, Esborranys, Paperera, Spam,
   Arxiu, + carpetes custom del servidor. Comptadors no-llegits dinàmics.
5. **Selecció múltiple + accions en lot**: marcar llegit/no, esborrar, moure,
   flag (estrella).

## 1.1 Incident real que canvia el criteri de tancament: Eric Conchillo

Aquest cas NO és teòric i s'ha d'usar com a regressió abans de tancar #821.

Lead:
- `Lead.id`: `cmpk52bry003ivigkb0x4v5o0`
- Nom: Eric Conchillo
- Email: `ercobix7@gmail.com`
- `EmailSend.id`: `cmpmc0ffh0000f3tilugwf1jh`
- `templateKey`: `primer-contacte`
- Assumpte: `Tu consulta para tu festa privada — Òrbita Events`
- `sentAt`: 2026-05-26 09:46 hora Madrid

Evidència trobada:
- La BD té `EmailSend`.
- El lead té activitat `Email enviat`.
- No hi ha obertures ni clics.
- El missatge NO apareix a cap carpeta IMAP (`INBOX`, `Sent`, `Drafts`,
  `Spam`, `Trash`).
- No tenim persistida la resposta SMTP (`accepted`, `rejected`, `response`,
  `messageId`).

Conclusió operativa:
- **No podem afirmar al 100% que l'email d'Eric sortís.**
- El sistema antic permetia que l'admin veiés "Email enviat" sense una prova
  observable suficient.
- A partir d'ara, la safata no pot tractar "registre BD" com a "enviat
  verificat".

Prova posterior feta a `ctreball20@gmail.com`:
- SMTP va respondre `250 2.0.0 Ok: queued as 0947D400BE`.
- `accepted`: `ctreball20@gmail.com`
- `rejected`: buit.
- APPEND manual a `Sent` va funcionar i el missatge es va trobar amb UID `5`.

Per tant, SMTP + IMAP poden funcionar, però #821 ha de fer que cada enviament
deixi proves persistides i visibles.

## 1.2 Checklist obligatori d'observabilitat SMTP/IMAP

No tancar #821 fins que això estigui resolt:

- [ ] `sendEmail()` ha de retornar un resultat observable, no `void`.
- [ ] El resultat ha d'incloure:
  - [ ] `smtp.accepted`
  - [ ] `smtp.rejected`
  - [ ] `smtp.response`
  - [ ] `smtp.messageId`
  - [ ] `imapAppend.attempted`
  - [ ] `imapAppend.ok`
  - [ ] `imapAppend.folder`
  - [ ] `imapAppend.error`
- [ ] `appendBuiltMimeToSent()` ha de retornar `{ ok, folder, error? }`.
- [ ] Si `appendToFolder()` retorna `false`, això s'ha de tractar com
  `imapAppend.ok = false`, no com a èxit silenciós.
- [ ] `adminEmailSendService` ha de persistir aquesta evidència a `adminLog`.
- [ ] Si hi ha `leadId`, `recordLeadEmailSent()` ha de guardar la mateixa
  evidència a `LeadActivity.metadata`.
- [ ] La UI ha de distingir aquests estats:
  - [ ] `SMTP acceptat + còpia a Enviats OK`
  - [ ] `SMTP acceptat, però no s'ha pogut guardar a Enviats`
  - [ ] `Registrat a BD, però sense evidència SMTP` (cas legacy com Eric)
  - [ ] `Error SMTP: no enviat`
- [ ] La pestanya Enviats ha de mostrar un avís si un `EmailSend` existeix a
  BD però no hi ha còpia IMAP ni evidència SMTP persistida.
- [ ] El cas Eric ha de quedar visible com a "no verificat / legacy", no com a
  enviat amb certesa.

## 2. Què s'ha fet (ja al working tree, sense commit)

### 2.1 `lib/imap.ts` — ampliat

Nou API públic:

```typescript
// Type d'entitat Òrbita
export type OrbitaEntityKind = 'lead' | 'customer' | 'booking' | 'dossier' | 'admin';
export interface OrbitaContext { kind: OrbitaEntityKind; id?: string; origin?: string }

// Conversa ↔ entitat (sense BD)
export function buildOrbitaMessageId(ctx: OrbitaContext): string
export function parseOrbitaMessageId(messageId?: string | null): { kind, id } | null
export function findOrbitaReferenceIn(refs?: string | null): { kind, id } | null
export function buildOrbitaHeaders(ctx: OrbitaContext): Record<string, string>

// Carpetes IMAP
export interface FolderInfo { path; name; delimiter; specialUse; unread; total }
export interface SpecialFolders { inbox; sent; drafts; trash; junk; archive }
export async function listFoldersWithStatus(): Promise<FolderInfo[]>
export async function discoverSpecialFolders(forceRefresh?): Promise<SpecialFolders>
export function clearSpecialFoldersCache(): void

// Append (per Sent + Drafts)
export async function appendToFolder(folder, rawMessage: Buffer|string, flags?: string[]): Promise<boolean>

// Flags + accions en lot + cerca + expunge
export async function setFlag(uid, folder, flag, set: boolean): Promise<boolean>
export async function searchEmails({ folder, query, limit? }): Promise<EmailMessage[]>
export async function expungeFolder(folder): Promise<{ ok; expunged }>
export async function bulkAction({ uids, folder, action, targetFolder? }): Promise<{ ok; affected; error? }>
```

`EmailMessage` ara conté `cc`, `isFlagged`, `orbita`, `inReplyTo`, `references`.
`fetchEmailByUid()` ja extreu headers `X-Orbita-Kind / Id / Origin` i parseja
`In-Reply-To` / `References` per a derivar el vincle d'entitat (source =
`'header'` quan és Sent nostre, `'reference'` quan és una resposta del client).

### 2.2 `lib/email.ts` — APPEND automàtic a Sent

`SendEmailOptions` ara accepta:
- `orbita?: OrbitaContext` — injecta headers + Message-ID estable.
- `headers?: Record<string, string>` — headers MIME addicionals.
- `skipImapAppend?: boolean` — per a campanyes massives no monitoritzades.

`sendEmail()` ara:
1. Build MIME amb les opcions (incloent X-Orbita-* i Message-ID si hi ha
   `orbita`).
2. Envia per SMTP.
3. Si `IMAP_*` env vars estan definides i `skipImapAppend !== true`,
   construeix el MIME via `nodemailer/lib/mail-composer` i fa
   `appendToFolder(special.sent, built, ['\\Seen'])` — best-effort, l'error no
bloqueja l'enviament.

**IMPORTANT arran del cas Eric:** això encara no és suficient si el resultat
queda invisible. `sendEmail()` no pot continuar retornant `void`: ha de retornar
la resposta SMTP i l'estat de l'APPEND a Sent perquè `adminEmailSendService`
ho pugui persistir i la UI ho pugui mostrar.

**TOTS els callers de `sendEmail()` (18 fitxers) automàticament guarden a Sent
sense canvis.** Només cal afegir `orbita` al subset que tingui leadId /
customerId / bookingId / dossierId per al vincle conversa.

### 2.3 Callers actualitzats amb `orbita`

- `lib/services/adminEmailSendService.ts` — composer admin amb leadId /
  customerId / admin.
- `lib/services/dossierService.ts` — dossier amb leadId si en té,
  altrament dossierId.

### 2.4 Nous endpoints API

| Endpoint | Mètode | Body / Query | Resposta |
|---|---|---|---|
| `/api/admin/inbox/folders` | GET | — | `{ ok, folders: FolderInfo[], special: SpecialFolders }` |
| `/api/admin/inbox/search` | GET | `?q=...&folder=...&limit=...` | `{ ok, emails }` |
| `/api/admin/inbox/bulk` | POST | `{ uids[], folder, action, targetFolder? }` | `{ ok, affected, error? }` |
| `/api/admin/inbox/drafts` | POST | `{ to, cc?, bcc?, subject?, bodyHtml?, bodyText?, orbita? }` | `{ ok }` |
| `/api/admin/inbox/messages/[uid]` | GET | `?folder=...&autoMarkRead=false` | `{ ok, email }` |
| `/api/admin/inbox/messages/[uid]` | PATCH | `{ action: 'markRead'\|'markUnread'\|'moveToTrash'\|'restore'\|'flag'\|'unflag'\|'moveTo', folder?, targetFolder? }` | `{ ok }` |
| `/api/admin/inbox/messages/[uid]` | DELETE | — | `{ ok }` |
| `/api/admin/inbox/messages` (existent) | GET | `?folder=...&action=list\|test\|folders\|count\|countTotal&limit&offset&unread` | `{ ok, emails, total, unread, folder }` |

`bulk.action` ∈ `{ markRead, markUnread, flag, unflag, moveTo, delete }`.
`delete` mou a Trash si la carpeta NO és Trash, altrament expunge.

CSRF obligatori a tots els POST/PATCH (ja gestionat).

### 2.5 Tipatge TypeScript verd

`npx tsc --noEmit` 0 errors al working tree.

## 3. Què queda per fer (Sonnet)

### 3.1 UI — `app/admin/inbox/SafataClient.tsx` (refactor complet)

**Estructura final (3 columnes, mantenir layout actual):**

```
┌─────────────┬────────────────────┬──────────────────────────────┐
│ Sidebar     │ Pane (llista)      │ Detall                       │
│             │                    │                              │
│ Comunicació │ [☑] cerca [↓] [↻]  │ [Avatar] Remitent            │
│ ├ Entrades  │ ─────────────────  │ [Re] [Re-all] [Fwd] [...]    │
│ │  web  [3] │ ☐ ● Pep   01-feb   │ Per a: client@...           │
│ ├ INBOX [5] │   Re: Pressupost   │ Cc: ...                     │
│ ├ Enviats   │                    │ ─────────────────           │
│ ├ Esborranys│ ☐ ★ Maria 31-gen   │ Subject                     │
│ ├ Paperera  │   Confirmació...   │                              │
│ ├ Spam      │                    │ [iframe HTML body]          │
│ └ + carpeta │ ☑ Joan   30-gen    │                              │
│             │   Pressupost...    │ [🔗 Veure lead/client]       │
│ ⚙ Config    │                    │                              │
└─────────────┴────────────────────┴──────────────────────────────┘
```

**Sidebar** (`sf__sidebar`):
- **Comunicació** > "Entrades web" (leads BD; ja existent, NO tocar la lògica).
- Al cridar `GET /api/admin/inbox/folders` al mount, popular el grup
  "Bústia" amb els items `special.inbox`, `special.sent`, `special.drafts`,
  `special.trash`, `special.junk`, `special.archive`, en aquest ordre, només
  els que NO siguin null. Per cada item, mostrar `folder.unread` com a badge
  daurat si > 0; sinó comptador subtil.
- Sota: secció "Carpetes" amb les `folders.filter(f => !f.specialUse)`
  ordenades alfabèticament.
- Cada item té icona pròpia (📥 INBOX, 📤 Sent, 📝 Drafts, 🗑 Trash, 🚫 Junk,
  📁 Custom).

**Pane (llista)** (`sf__pane`):
- Header amb:
  - Checkbox global "select all visible" (només quan hi ha emails carregats).
  - Cerca dins la carpeta actual (`?q=...&folder=...`).
  - Selector ordenació (mantenir l'actual).
  - Botó refresh manual (`↻`) que neteja cache i recarrega.
- Cada fila d'email:
  - Checkbox a l'esquerra.
  - Indicador no-llegit (dot daurat) + indicador flag (★).
  - Remitent (Sent: destinatari), data, subject.
  - Si `email.orbita`: badge petit "🔗 lead" / "🔗 client" / "🔗 reserva"
    (tooltip amb ID).
- **Barra d'accions en lot** apareix quan hi ha selecció:
  - Marcar llegit, Marcar no-llegit, Estrella, Treure estrella,
  - Moure a... (dropdown amb carpetes), Esborrar.
  - Botó "Cancel·lar selecció".

**Detall** (`sf__detail`):
- Header:
  - Remitent (avatar + nom + adreça).
  - Botons: ✉ Respondre, ↩ Resp. a tothom, ➡ Reenviar, ★ Flag,
    📁 Moure, 🗑 Esborrar, ○ Marcar no-llegit, ✕ Tancar.
- Subjectbar amb Subject + data + paperclip si attachments.
- Cos: `<iframe srcDoc sandbox="allow-same-origin">` com ara.
- **Pill de vincle**: si `email.orbita`, mostrar:
  - `🔗 Lead #abc123 — Veure fitxa` (link a `/admin/leads/{id}` o
    `buildLeadWorkspaceHref(id)`)
  - `🔗 Client — Veure fitxa` (link a `buildCustomerHubHref(id)`)
  - `🔗 Reserva — Veure fitxa` (link a `buildBookingHref(id)`)
  - `🔗 Dossier #xyz` (link a `/admin/dossiers#xyz`)
- Si `email.orbita.source === 'reference'`, afegir text petit:
  *"(vincle detectat per resposta a Òrbita)"*.

**Composer** (millorat — actualment al peu del LeadDetail / ImapDetail):
- Camps: To (read-only o editable segons reply/new), Cc, Bcc (toggle), Subject,
  Body.
- Reply: prefill `To = email.from`, `Subject = "Re: ..."`, body amb cita:
  ```
  ───
  > [Date], [From] wrote:
  > [body original primer paràgraf]
  ```
- Reply-all: To = email.from; Cc = email.to + email.cc (excloent `SMTP_FROM`).
- Forward: To buit, Subject = "Fwd: ...", body amb header de reenviament i
  cita.
- Plantilles (mantenir les actuals: primer-contacte / seguiment / lliure).
- Botons: **Enviar** | **Desar esborrany** | **Cancel·lar**.
- Desar esborrany crida `POST /api/admin/inbox/drafts` amb `orbita` si el mail
  original en tenia.

**Flux de càrrega:**
1. `useEffect` al canvi de tab → si tab no és 'entrades', cridar
   `loadFolderEmails(folderPath)`.
2. `loadFolderEmails(path, offset = 0)` crida
   `GET /api/admin/inbox/messages?folder={path}&limit=30&offset={offset}`.
3. Cache per folder a l'estat (Map<string, ImapEmail[]>).
4. Al fer `bulkAction` o `setFlag`, invalidar cache del folder afectat (i del
   target si moveTo).

**Atenció:**
- Mantenir paleta `var(--ax-*)`. Cap hex nou. Cap Tailwind utilitari.
- `client.append()` no apareix als bytes que envia SMTP — l'append fa un
  segon build via MailComposer. Per a coherència visual, OK; per a coherència
  literal de Message-ID, el messageId estable garanteix la identitat.

### 3.2 CSS — `app/admin/inbox/inbox.css`

Afegir (no reescriure):
- `.sf__pane-actions` (barra d'accions en lot)
- `.sf__pane-checkbox` (checkbox global)
- `.sf__lead-checkbox`
- `.sf__lead-flag` / `.sf__lead-flag.is-on`
- `.sf__lead-badge` (pill X-Orbita)
- `.sf__detail-actions` (toolbar detall ampliada)
- `.sf__detail-pill` (vincle entitat)
- `.sf__composer-cc-row` / `.sf__composer-bcc-row`
- `.sf__navitem-group` (grup col·lapsable a sidebar)
- `.sf__navitem-icon`

Tots amb tokens `var(--ax-*)` de `orbita-tokens.css`. **Cap hex hardcoded.**

### 3.3 Tests requerits

`__tests__/lib/imap-extensions.test.ts` (NOU):
- `buildOrbitaMessageId` format + escape.
- `parseOrbitaMessageId` casos: nostre / d'altri / null / mal format.
- `findOrbitaReferenceIn` amb cadena References múltiple.
- `buildOrbitaHeaders` sortida.
- `classifyFolder` heurística (INBOX, Sent, Drafts, Trash, Junk, custom).

Mock d'ImapFlow per tests d'integració (opcional — la majoria de funcions
fan IMAP real, difícil de mocar fidelment; deixar com a integration test
manual si cal).

`__tests__/lib/email-orbita.test.ts` (NOU):
- Mock de `nodemailer.createTransport` i `appendToFolder`.
- Verificar que `sendEmail({ orbita: { kind: 'lead', id: 'L1' } })` injecta
  `X-Orbita-Kind: lead`, `X-Orbita-Id: L1`, `messageId` format
  `<orbita.lead.L1.…>`.
- Verificar que `skipImapAppend: true` no crida appendToFolder.
- Verificar que `IMAP_HOST` undefined no crida appendToFolder.
- Verificar que `sendEmail()` retorna `smtp.accepted`, `smtp.rejected`,
  `smtp.response`, `smtp.messageId`.
- Verificar que si `appendToFolder()` retorna `true`, el resultat té
  `imapAppend.ok === true` i `imapAppend.folder === 'Sent'`.
- Verificar que si `appendToFolder()` retorna `false` o llença error, el
  resultat té `imapAppend.ok === false` i `imapAppend.error` informat, però
  l'enviament SMTP continua quedant com acceptat.

`__tests__/lib/services/adminEmailSendService-orbita.test.ts` (NOU):
- Verificar que amb `leadId` el `sendEmail` rep `orbita.kind === 'lead'`.
- Idem amb `customerId`.
- Verificar que `adminLog.details` inclou `smtp` i `imapAppend`.
- Verificar que `recordLeadEmailSent()` rep `smtp` i `imapAppend` dins el seu
  input quan hi ha lead.

`__tests__/lib/services/leadActivityService.test.ts` (AMPLIAR):
- `recordLeadEmailSent()` escriu a `metadata`:
  - `emailSendId`
  - `smtpMessageId`
  - `smtpResponse`
  - `smtpAccepted`
  - `smtpRejected`
  - `imapSentAppendOk`
  - `imapSentFolder`
  - `imapSentError`

`__tests__/app/api/admin/inbox/folders.test.ts` (NOU):
- 200 amb mock de listFoldersWithStatus.
- 401 sense auth.
- 400 si IMAP no configurat.

### 3.4 Counter + diari + agent-sync

- `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER = 821`.
- `app/studio-lab/leads/page.tsx`: `LAB_CHANGE_NUMBER = 821`.
- `docs/diario.md`: nova entrada **#821** explicant que la safata és ara un
  client de correu complet mirall del servidor, amb append automàtic a Sent
  i vinculació X-Orbita.
- `docs/agent-sync.md`: bloc `[claude] 2026-05-27 [ESTAT: tancat]` amb #821.

### 3.5 Validació final

```bash
pnpm run validate:core
pnpm test:run
pnpm build
```

Tot ha de quedar verd. Si algun test antic de `lib/email.ts` falla per
l'append automàtic, mocar `discoverSpecialFolders` i `appendToFolder`.

## 4. Punts subtils a no oblidar

1. **Threading**: el camp `email.references` ja s'omple. Si vols agrupar
   visualment una conversa al mateix `Message-ID` root, deixa-ho per a un
   **canvi #822** (no és blocant). Mínim per #821: pill de vincle d'entitat.

2. **Adjunts**: el `fetchEmailByUid` no descarrega adjunts (per performance).
   Per descarregar un adjunt: nou endpoint
   `GET /api/admin/inbox/messages/[uid]/attachments/[index]?folder=...` amb
   `fetch({ uid: true, bodyParts: [partId] })`. **No urgent**; només mostrar
   📎 al detall sense permetre descàrrega és acceptable per #821.

3. **Carpeta Drafts**: si el servidor IMAP no té Drafts (alguns IMAP basics),
   `discoverSpecialFolders().drafts === null`. L'endpoint
   `/api/admin/inbox/drafts` retorna 400 explicatiu. L'UI ha de deshabilitar
   el botó "Desar esborrany" en aquest cas.

4. **Cache `SPECIAL_FOLDERS_CACHE`**: 5 minuts. Si l'admin canvia config IMAP
   a `/admin/inbox/settings`, cridar `clearSpecialFoldersCache()` o reiniciar
   procés.

5. **MailComposer import**: l'import dinàmic
   `(await import('nodemailer/lib/mail-composer')).default` és necessari
   perquè el package és CJS i el .default a vegades és la classe, a vegades
   no. He posat un fallback. Si Sonnet veu errors d'instanciació, ajustar
   així:
   ```typescript
   const mod = await import('nodemailer/lib/mail-composer');
   const MailComposer = mod.default ?? (mod as any);
   ```

6. **`X-Orbita-Origin`**: text lliure (ex: `dossier-abc123`, `admin-compose`,
   `payment-reminder`). Útil per a logs/analytics però NO és la font del
   vincle — el vincle ve de `X-Orbita-Kind + X-Orbita-Id`.

7. **Domain de Message-ID**: per defecte `orbitaevents.com`. Es pot
   sobreescriure amb `ORBITA_MAIL_DOMAIN` o `SMTP_DOMAIN` env vars.

## 5. Ordre suggerit per a Sonnet

1. Llegir aquest handoff + `docs/agent-sync.md` + `docs/diario.md` (últimes 3
   entrades) + `docs/protocol-producte-admin-ca.md` §6 (Inbox).
2. **Primer: tancar observabilitat SMTP/IMAP** (1.2). Sense això, la safata
   pot tornar a dir "enviat" quan només hi ha registre BD.
3. **Refactor SafataClient.tsx** (3.1): sidebar dinàmic + pane amb selecció
   múltiple + detall amb pill X-Orbita. Reusar tipus `ImapEmail` però
   afegir-hi `orbita?`, `isFlagged?`, `cc?`, `inReplyTo?`, `references?`.
4. **Tests** (3.3): unit tests dels helpers Òrbita primer (ràpids, donen
   confiança).
5. **CSS** (3.2): paral·lel a la UI.
6. **Counter + diari + agent-sync** (3.4).
7. **`pnpm run validate:core && pnpm test:run && pnpm build`** (3.5).
8. Si tot verd → commit + push (l'usuari l'ha autoritzat implícitament al
   demanar "ho acabi sonnet").

## 6. Risc i fallbacks

- **APPEND falla** (carpeta Sent inexistent, sense permisos): l'enviament
  SMTP pot haver-se completat OK, però ja NO pot quedar com a èxit opac.
  Persistir `smtp.*` i `imapAppend.*`, mostrar avís a UI i permetre reintentar
  l'APPEND o reenviar. **Mitigació**: documentar al setup IMAP que la carpeta
  Sent ha d'existir i afegir una prova manual des de `/admin/inbox`.
- **Servidor IMAP lent**: el `discoverSpecialFolders()` té cache 5 min, però
  el primer load pot tardar 1-3s. Acceptable. Si surt molt lent, paral·lelitzar.
- **Bytes diferents entre SMTP-sent i IMAP-append**: nodemailer genera
  Message-ID nou si no passes `messageId` explícitament. Sempre passem
  `messageId` quan hi ha `orbita.kind`, així IDENTITAT garantida. Sense
  `orbita`, els bytes són diferents (Message-ID i Date). Acceptable: l'append
  serveix per veure'l, no per a un mirror byte-perfect.

## 7. No tocar

- `lib/services/safataService.ts` (capa BD, ja correcta).
- `app/api/admin/inbox/settings/route.ts` (configuració, ja correcta).
- Lògica del compose llarg a `app/admin/inbox/compose/` (segon flux per a
  pressupostos amb adjunts; manté la seva pròpia ruta).
- `EmailSend` model — segueix sent el rastre de tracking BD. NO és el canal.

## 8. Resum executiu

> "El servidor SMTP envia. El servidor IMAP guarda al Sent. La BD només per
> tracking secundari i evidència d'auditoria. Cada enviament ha de deixar
> resposta SMTP (`accepted/rejected/response/messageId`) i estat d'APPEND a
> Sent. Els headers X-Orbita-* + Message-ID estable vinculen conversa ↔
> entitat sense que cap consulta BD entri al canal. La safata d'admin és un
> client de correu real amb les mateixes carpetes que un Outlook, amb selecció
> múltiple, accions en lot, flags, cerca, pill de vincle i estats d'enviament
> que no amaguen casos legacy com Eric."
