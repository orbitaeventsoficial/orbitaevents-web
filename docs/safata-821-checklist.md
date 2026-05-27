# Checklist canvi #821 — Safata Outlook (mirall del servidor de correu)

> **Llegir aquest fitxer abans de tocar res.** Marca els items com a `[x]`
> quan els completis. Indica entre claudàtors qui ho ha fet, p.ex.
> `[x][codex 2026-05-27]`.
>
> **Estratègia global**: el servidor IMAP/SMTP és la font de veritat de les
> converses. La BD no entra al canal: només recull traça observable.
> Vinculació conversa ↔ entitat via headers MIME `X-Orbita-*` + Message-ID
> estable `<orbita.{kind}.{id}.{ts}.{rand}@orbitaevents.com>`.
>
> **Llegir també**: `docs/safata-outlook-handoff.md` (decisions detallades),
> `docs/agent-sync.md` (estat sessions).
>
> **Counter actual**: `ADMIN_CHANGE_COUNTER = 820`. Pujar a 821 quan es
> tanqui tot.

---

## A — Backend (FET, només verificar)

> Tot això ja és al working tree, sense commit. `npx tsc --noEmit` verd.

- [x][claude:opus 2026-05-27] `lib/imap.ts` ampliat amb helpers Òrbita,
  carpetes especials, APPEND, flags, search, bulkAction, expunge.
- [x][claude:opus 2026-05-27] `lib/email.ts` retorna `SendEmailResult`
  (smtp.accepted/rejected/response/messageId + imapSent.attempted/ok/folder/uid/error
  + orbitaMessageId). APPEND best-effort a Sent.
- [x][claude:opus 2026-05-27] `prisma/schema.prisma` — camps nous a EmailSend
  (smtpAccepted, smtpRejected, smtpResponse, smtpMessageId, imapAppendOk,
  imapSentFolder, imapSentUid, imapError, orbitaKind, orbitaId, orbitaOrigin)
  + índexs.
- [x][claude:opus 2026-05-27] Migració SQL
  `prisma/migrations/20260527140000_add_email_send_observability/migration.sql`.
- [x][claude:opus 2026-05-27] `lib/services/emailTrackingService.ts`:
  `recordEmailSend` accepta `orbitaKind/Id/Origin`. Nova
  `updateEmailSendResult(id, result)`.
- [x][claude:opus 2026-05-27] `lib/services/adminEmailSendService.ts` —
  passa orbita context i desa resultat real del canal a EmailSend.
- [x][claude:opus 2026-05-27] `lib/services/dossierService.ts` — passa
  orbita context i desa resultat real.
- [x][claude:opus 2026-05-27] Endpoint
  `app/api/admin/inbox/folders/route.ts` — GET amb status comptadors.
- [x][claude:opus 2026-05-27] Endpoint
  `app/api/admin/inbox/bulk/route.ts` — POST acció en lot (markRead /
  markUnread / flag / unflag / moveTo / delete).
- [x][claude:opus 2026-05-27] Endpoint
  `app/api/admin/inbox/search/route.ts` — GET cerca dins una carpeta.
- [x][claude:opus 2026-05-27] Endpoint
  `app/api/admin/inbox/drafts/route.ts` — POST desar esborrany al folder
  Drafts IMAP.
- [x][claude:opus 2026-05-27] Endpoint
  `app/api/admin/inbox/messages/[uid]/route.ts` — accions `flag/unflag/moveTo`
  + GET amb `?folder=` i `cc/isFlagged/orbita/inReplyTo/references` al
  resultat.
- [x][claude:opus 2026-05-27] Endpoint reintent
  `app/api/admin/emails/sent/[id]/append-imap/route.ts` — reconstrueix MIME
  des de `htmlBody` + `orbita*` desats i fa APPEND a Sent. Actualitza camps
  `imapAppendOk/Folder/Uid/Error`.
- [x][claude:opus 2026-05-27] Tests `__tests__/lib/imap-orbita.test.ts` —
  helpers Òrbita (Message-ID, headers, references).
- [x][claude:opus 2026-05-27] Tests
  `__tests__/lib/services/adminEmailSendService.test.ts` ampliats — context
  orbita lead/customer/admin, persistència del resultat, casos
  imapAppendOk null/false/true.

---

## B — Operacional (CODEX)

> Tasques que fan canvis a l'entorn (BD, dependències, processos) i que no
> requereixen disseny. Codex pot fer-les sense risc de trepitjar la UI.

### B.1 — Aplicar migració a Railway

- [ ][codex] Aturar dev server si hi és (`Stop-Process -Name node -Force -ErrorAction SilentlyContinue`).
- [ ][codex] Verificar `DATABASE_URL` apunta a Railway (no a local).
- [ ][codex] Executar `npx prisma migrate deploy`.
  - Migració esperada: `20260527140000_add_email_send_observability`.
  - Ha de quedar a la taula `_prisma_migrations` amb `finished_at`.
- [ ][codex] `npx prisma migrate status` → confirmar "Database schema is up
  to date".
- [ ][codex] Verificar a Railway que la taula `email_sends` té les columnes
  noves: `smtpAccepted`, `smtpRejected`, `smtpResponse`, `smtpMessageId`,
  `imapAppendOk`, `imapSentFolder`, `imapSentUid`, `imapError`,
  `orbitaKind`, `orbitaId`, `orbitaOrigin`.
- [ ][codex] Anotar al present checklist el resultat (OK / drift / error).

### B.2 — Regenerar client Prisma local

- [ ][codex] Aturar nodes (`Stop-Process -Name node -Force -ErrorAction SilentlyContinue`).
  - **Avís**: això matarà Claude Code si està via Node també. Verificar
    abans si l'usuari pot fer-ho ell.
- [ ][codex] `npx prisma generate`.
- [ ][codex] `npx tsc --noEmit` ha de retornar 0 errors.

### B.3 — Backfill del cas Eric (i altres emails antics)

> Tots els `EmailSend` enviats abans de #821 tenen `imapAppendOk = null` →
> no consten al folder Sent del servidor. El reintent recupera el rastre
> sense reenviar al destinatari.

- [ ][codex] Crear `scripts/backfill-append-imap.ts`:
  ```typescript
  // Llista emailSend amb imapAppendOk IS NULL OR imapAppendOk = false
  // Per cada: POST /api/admin/emails/sent/[id]/append-imap
  // Rate limit: 1 req/seg (per no saturar el servidor IMAP)
  // Log a tmp/append-backfill.log
  ```
- [ ][codex] Test del script en mode dry-run primer (només llistar quants
  emails es tocarien).
- [ ][codex] Confirmar amb l'usuari abans d'executar en mode real.
- [ ][codex] Executar real. Verificar que el cas Eric
  (`ercobix7@gmail.com`, subject "Tu consulta para tu festa privada") ja
  apareix a `INBOX.Sent` o equivalent del servidor.

### B.4 — Documentar variables d'entorn

- [ ][codex] Comprovar si `.env.example` existeix. Si no, crear-lo.
- [ ][codex] Afegir-hi:
  ```
  # IMAP — Safata d'admin
  IMAP_HOST=
  IMAP_PORT=993
  IMAP_USER=
  IMAP_PASS=
  IMAP_ALLOW_INSECURE=false
  IMAP_SECURE=true
  # INBOX_TO_FILTER=info@orbitaevents.com  # opcional: filtra forwards

  # SMTP — enviament
  SMTP_HOST=
  SMTP_PORT=465
  SMTP_USER=
  SMTP_PASS=
  SMTP_FROM=
  SMTP_REPLY_TO=
  SMTP_SECURE=true

  # Domini per al Message-ID Òrbita (default: orbitaevents.com)
  ORBITA_MAIL_DOMAIN=orbitaevents.com
  ```
- [ ][codex] Si ja existeix `.env.example`, només afegir el bloc
  `ORBITA_MAIL_DOMAIN` i actualitzar `INBOX_TO_FILTER` si cal.

### B.5 — Auditoria del cas Eric

- [ ][codex] Query a BD:
  ```sql
  SELECT id, "to", subject, "sentAt", "imapAppendOk", "smtpMessageId"
  FROM email_sends
  WHERE "to" = 'ercobix7@gmail.com'
  ORDER BY "sentAt" DESC;
  ```
- [ ][codex] Confirmar que abans del backfill: `imapAppendOk IS NULL`.
- [ ][codex] Després del backfill: `imapAppendOk = TRUE` i
  `imapSentFolder` definit.

---

## C — UI safata (CLAUDE) — la part gran

> Claude lidera el visual (vegeu memòria `feedback-studio-visual-blindatge`).
> Codex NO ha de tocar la UI ni el CSS de la safata.

### C.1 — `app/admin/inbox/SafataClient.tsx` — refactor

- [ ][claude] **Tipus**: ampliar `ImapEmail` amb `cc?`, `isFlagged?`,
  `orbita?: { kind, id, source }`, `inReplyTo?`, `references?`.
- [ ][claude] **Sidebar**: cridar `GET /api/admin/inbox/folders` al mount.
  Grups:
  1. "Comunicació" (sempre): Entrades web.
  2. "Bústia" (carregat IMAP):
     - 📥 Entrada (`special.inbox`)
     - 📤 Enviats (`special.sent`)
     - 📝 Esborranys (`special.drafts`)
     - 🗑 Paperera (`special.trash`)
     - 🚫 Spam (`special.junk`)
     - 📦 Arxiu (`special.archive`)
  3. "Carpetes" (custom): `folders.filter(f => !f.specialUse)` alfabètic.
  Badge daurat amb `folder.unread` si > 0.
- [ ][claude] **Pane (llista)**:
  - Checkbox global "select all visible".
  - Cerca local (filtre client-side) per remitent/assumpte.
  - **Cerca cross-folder server-side**: input que crida
    `/api/admin/inbox/search?q=...&folder={path}` amb debounce 400ms.
  - Botó refresh (`↻`) que recarrega la carpeta actual i neteja cache.
  - Cada fila: checkbox + dot no-llegit + ★ flag + remitent + data +
    subject + badge `🔗 lead/client/reserva` si `email.orbita`.
- [ ][claude] **Barra d'accions en lot** (apareix si selecció > 0):
  - Marcar llegit / Marcar no-llegit.
  - ★ Estrella / Treure estrella.
  - 📁 Moure a... (dropdown amb carpetes IMAP).
  - 🗑 Esborrar (mou a Trash; si JA és Trash, expunge).
  - Cancel·lar selecció.
  - Crida `POST /api/admin/inbox/bulk` amb `{ uids[], folder, action,
    targetFolder? }`.
- [ ][claude] **Detall**:
  - Header amb: ✉ Respondre · ↩ Resp. a tothom · ➡ Reenviar · ★ Flag ·
    📁 Moure · 🗑 Esborrar · ○ Marcar no-llegit · ✕ Tancar.
  - Subjectbar amb subject + data + 📎 si attachments.
  - Cos en iframe sandbox.
  - **Pill X-Orbita** si `email.orbita`:
    - Lead → `🔗 Lead — Veure fitxa` (`buildLeadWorkspaceHref(id)`).
    - Customer → `🔗 Client — Veure fitxa` (`buildCustomerHubHref(id)`).
    - Booking → `🔗 Reserva — Veure fitxa` (`buildBookingHref(id)`).
    - Dossier → `🔗 Dossier #id`.
    - Si `source === 'reference'`: subtítol `(detectat per resposta)`.

### C.2 — Composer 2.0 dins SafataClient

- [ ][claude] Camps: **To** (read-only en reply, editable en compose nou),
  **Cc** (toggle), **Bcc** (toggle), **Subject**, **Body**.
- [ ][claude] **Reply**:
  - `To = email.from.address`.
  - `Subject = "Re: " + email.subject` (sense duplicar "Re:" si ja en té).
  - Body amb cita:
    ```
    
    ───
    > El [Date], [From name] va escriure:
    > [primer paràgraf del body original]
    ```
- [ ][claude] **Reply-all**:
  - `To = email.from.address`.
  - `Cc = email.to + email.cc` excloent `SMTP_FROM`.
  - Resta igual que Reply.
- [ ][claude] **Forward**:
  - `To` buit, editable.
  - `Subject = "Fwd: " + email.subject`.
  - Body amb header de reenviament i cita complet.
- [ ][claude] **Desa esborrany**: `POST /api/admin/inbox/drafts` amb
  `{ to, cc, bcc, subject, bodyHtml, bodyText, orbita }`. Si `orbita` del
  mail original existeix, propagar-lo al draft.
- [ ][claude] **Plantilles** mantingudes (primer-contacte, seguiment,
  lliure).
- [ ][claude] **Indicador d'enviament** post-send: badge verd "Acceptat
  per SMTP + Arxivat a Sent" si tot OK; badge groc "Enviat (no arxivat
  a Sent)" si APPEND ha fallat; badge vermell "Rebutjat" si rejected > 0.

### C.3 — `app/admin/inbox/inbox.css`

- [ ][claude] Afegir (NO reescriure):
  - `.sf__pane-actions` (barra accions en lot, sticky top)
  - `.sf__pane-checkbox` (global select-all)
  - `.sf__lead-checkbox` (per fila)
  - `.sf__lead-flag` / `.sf__lead-flag.is-on` (★)
  - `.sf__lead-badge` (pill X-Orbita, daurat amb tint)
  - `.sf__detail-actions` (toolbar detall ampliada amb 6+ botons)
  - `.sf__detail-pill` (vincle entitat al detall)
  - `.sf__composer-cc-row` / `.sf__composer-bcc-row`
  - `.sf__send-status--ok` / `.sf__send-status--partial` /
    `.sf__send-status--rejected`
  - `.sf__navitem-group` (grup col·lapsable a sidebar)
  - `.sf__navitem-icon`
- [ ][claude] **Cap hex** hardcoded. Tot via tokens `var(--ax-*)` de
  `orbita-tokens.css`. Glass cards: `.admin-card-glass`. Focus:
  `focus:ring-1 focus:ring-cyan-500/50`.

### C.4 — Pàgina enviats: bloc de diagnòstic

- [ ][claude] Quan es selecciona un email del tab "Enviats" i tenim
  `EmailSend.id` corresponent (via `smtpMessageId` o `orbita`), mostrar
  un bloc:
  ```
  ✅ SMTP acceptat: ercobix7@gmail.com
  ✅ Resposta: 250 2.0.0 Ok: queued as ABC123
  ✅ A folder Sent: INBOX.Sent (UID 5)
  🔗 Vincle: lead/cmpk52bry003ivigkb0x4v5o0
  ```
- [ ][claude] Si `imapAppendOk === false`:
  ```
  ⚠ A folder Sent: ERROR — "Mailbox doesn't exist"
  [Botó: Reintentar arxivar a Sent]
  ```
  El botó crida `POST /api/admin/emails/sent/{id}/append-imap`.

---

## D — Tests addicionals (CLAUDE)

- [ ][claude] `__tests__/app/api/admin/inbox/folders.test.ts` — 200 amb
  mock de listFoldersWithStatus + discoverSpecialFolders. 401 sense auth.
- [ ][claude] `__tests__/app/api/admin/inbox/bulk.test.ts` — accions
  vàlides + invàlides. CSRF requerit.
- [ ][claude] `__tests__/app/api/admin/inbox/drafts.test.ts` — quan
  drafts folder no existeix retorna 400.
- [ ][claude] `__tests__/app/api/admin/emails/sent/append-imap.test.ts` —
  mock de discoverSpecialFolders + appendToFolder. Casos: ok (actualitza
  camps), error (deixa imapError), htmlBody absent (400).
- [ ][claude] `__tests__/lib/services/dossierService.test.ts` — afegir
  test que verifica `orbita` context passat (kind=lead si dossier.leadId,
  altrament kind=dossier).

---

## E — Tancament i validació (CLAUDE)

### E.1 — Counter + diari + agent-sync

- [ ][claude] `lib/constants/admin.ts`: `ADMIN_CHANGE_COUNTER = 821`.
- [ ][claude] `app/studio-lab/leads/page.tsx`: `LAB_CHANGE_NUMBER = 821`.
- [ ][claude] `docs/diario.md`: nova entrada **#821** explicant que la
  safata és ara un client de correu real, append automàtic a Sent,
  vinculació X-Orbita, observabilitat completa, reintent per a casos
  antics.
- [ ][claude] `docs/agent-sync.md`: bloc `[claude] 2026-05-27 [ESTAT: tancat]`
  amb #821 i alusió al backfill fet per Codex.

### E.2 — Validacions

- [ ][claude] `npx tsc --noEmit` → 0 errors.
- [ ][claude] `pnpm run validate:core` → verd.
- [ ][claude] `pnpm test:run` → tots els tests verds (inclosos els
  helpers Òrbita i el observabilitat).
- [ ][claude] `pnpm build` → build net.
- [ ][claude] Grep actiu de residus a fitxers tocats:
  - `#[0-9a-fA-F]{3,6}` → cap hex hardcoded a `app/admin/inbox/**`.
  - `style={{` → cap inline style.
  - `rgba(` → cap color inline.

### E.3 — Verificació manual al browser

- [ ][claude] Anar a `/admin/inbox`:
  - Sidebar mostra carpetes IMAP reals.
  - Click a "Enviats" llista mails reals del folder Sent.
  - Click a "Esborranys" llista esborranys o buit.
  - Click a "Paperera" llista paperera.
  - Seleccionar 2 emails amb checkbox → barra d'accions en lot apareix.
  - Marcar com no-llegit → fa el toggle al servidor.
  - Click ★ flag → toggle visual + servidor.
- [ ][claude] Composer nou:
  - Cc / Bcc toggle funciona.
  - Reply prefilla i envia.
  - Reply-all afegeix Cc.
  - Forward genera "Fwd:" amb cita.
  - "Desar esborrany" puja a Drafts IMAP.

### E.4 — Commit + push (autoritzat per l'usuari)

- [ ][claude] `git add` de tots els fitxers del canvi #821.
- [ ][claude] Commit amb missatge:
  ```
  feat(admin): #821 — Safata Outlook (mirall IMAP/SMTP + X-Orbita + observabilitat)
  ```
- [ ][claude] `git push` (l'usuari ja ha donat autorització en el
  context del canvi).

---

## F — Risc i edge cases (tenir en compte)

- **APPEND retorna sense UID**: alguns servidors IMAP no suporten UIDPLUS.
  El nostre codi accepta `uid?: undefined` i la UI ha de saber-ho.
- **Servidor IMAP lent**: `discoverSpecialFolders` cache 5 min. Si l'usuari
  canvia config IMAP, cridar `clearSpecialFoldersCache()` o reiniciar
  procés.
- **`sendEmail` cridat sense IMAP_*** env vars: `imapSent.attempted = false`.
  La UI mostra "Sent IMAP no configurat" en lloc d'error.
- **Backfill executat dues vegades**: l'endpoint detecta `imapAppendOk = true`
  i retorna sense duplicar. Safe.
- **MailComposer changes**: si una versió futura de nodemailer canvia
  l'export, l'`import()` dinàmic té fallback. Si falla, log + l'enviament
  segueix.
- **Headers MIME custom moguts per relay**: els X-Orbita-* viatgen sempre
  amb el missatge. Cap reescriptura a SMTP comú els toca.

---

## G — Quan tot estigui marcat com a fet

1. Notificar l'usuari amb resum executiu.
2. Tancar les tasques al sistema de gestió.
3. Esborrar aquest checklist OR moure'l a `docs/archive/safata-821-checklist-tancat.md`
   per a referència futura.
