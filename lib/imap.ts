/**
 * CLIENT IMAP - Connexió amb correu DonDominio
 * =============================================
 * Llegeix emails reals del servidor IMAP
 */

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// Interfície de configuració IMAP
interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  logger: false;
  tls: { rejectUnauthorized: boolean };
}

/**
 * Obtenir configuració IMAP: env vars primer, BD (Settings) com a fallback
 */
async function getImapConfig(): Promise<ImapConfig> {
  let host = (process.env.IMAP_HOST || '').trim();
  let portRaw = (process.env.IMAP_PORT || '').trim();
  let user = (process.env.IMAP_USER || '').trim();
  let pass = (process.env.IMAP_PASS || '').trim();
  const allowInsecure = process.env.IMAP_ALLOW_INSECURE === 'true';

  // Fallback a Settings BD si env vars no estan configurades
  if (!host || !user || !pass) {
    try {
      const settings = await prisma.setting.findMany({
        where: { key: { startsWith: 'imap.' } },
      });
      const map: Record<string, string> = {};
      for (const s of settings) map[s.key] = s.value;

      if (!host && map['imap.host']) host = map['imap.host'];
      if (!portRaw && map['imap.port']) portRaw = map['imap.port'];
      if (!user && map['imap.user']) user = map['imap.user'];
      if (!pass && map['imap.pass']) pass = map['imap.pass'];
    } catch (e) {
      log.error('Error llegint config IMAP de BD', e instanceof Error ? e : undefined);
    }
  }

  const port = parseInt(portRaw || '993', 10);
  const secure = process.env.IMAP_SECURE === 'true' ||
    (!process.env.IMAP_SECURE && String(port) === '993');

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false as const,
    tls: { rejectUnauthorized: !allowInsecure },
  };
}

/**
 * Obtenir config actual (per mostrar a l'admin, sense password)
 */
export async function getImapConfigSafe(): Promise<{
  host: string; port: number; user: string; secure: boolean; configured: boolean; source: 'env' | 'db' | 'none';
}> {
  const envHost = (process.env.IMAP_HOST || '').trim();
  const envUser = (process.env.IMAP_USER || '').trim();
  const envPass = (process.env.IMAP_PASS || '').trim();

  if (envHost && envUser && envPass) {
    const portRaw = (process.env.IMAP_PORT || '993').trim();
    const port = parseInt(portRaw, 10);
    return { host: envHost, port, user: envUser, secure: port === 993, configured: true, source: 'env' };
  }

  try {
    const settings = await prisma.setting.findMany({ where: { key: { startsWith: 'imap.' } } });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    if (map['imap.host'] && map['imap.user'] && map['imap.pass']) {
      const port = parseInt(map['imap.port'] || '993', 10);
      return { host: map['imap.host'], port, user: map['imap.user'], secure: port === 993, configured: true, source: 'db' };
    }
  } catch { /* ignore */ }

  return { host: '', port: 993, user: '', secure: true, configured: false, source: 'none' };
}

export interface EmailMessage {
  id: string;
  uid: number;
  messageId: string;
  from: {
    name: string;
    address: string;
  };
  to: {
    name: string;
    address: string;
  }[];
  cc?: {
    name: string;
    address: string;
  }[];
  subject: string;
  date: Date;
  bodyText: string;
  bodyHtml: string;
  isRead: boolean;
  isFlagged?: boolean;
  hasAttachments: boolean;
  attachments: {
    partKey: string;
    filename: string;
    contentType: string;
    size: number;
  }[];
  /**
   * Vincle a entitat Òrbita, si està disponible. Es deriva, per ordre:
   *   1. Headers X-Orbita-Kind / X-Orbita-Id del propi missatge (per Sent).
   *   2. Match d'`In-Reply-To` o `References` contra format
   *      `<orbita.{kind}.{id}…>` (per Inbox: respostes de clients).
   */
  orbita?: {
    kind: OrbitaEntityKind;
    id: string;
    origin?: string;
    source: 'header' | 'reference';
  };
  inReplyTo?: string;
  references?: string;
}

/**
 * Connectar al servidor IMAP
 */
export async function connectIMAP(): Promise<ImapFlow> {
  const config = await getImapConfig();
  if (!config.host || !config.port || Number.isNaN(config.port) || !config.auth.user || !config.auth.pass) {
    throw new Error('IMAP not configured — configura les credencials a /admin/inbox/settings');
  }
  const client = new ImapFlow(config);
  await client.connect();
  return client;
}

/**
 * Obtenir llista canònica d'adreces destinatàries que volem mostrar.
 *
 * Per defecte: si l'env var `INBOX_TO_FILTER` està definida, només es retornen
 * emails on alguna `to[].address` coincideix amb una de les adreces de la
 * llista (case-insensitive). Si no està definida, retorna tots els emails
 * (comportament històric).
 *
 * Format de l'env: `INBOX_TO_FILTER=info@orbitaevents.com,reservas@orbitaevents.com`
 *
 * Útil quan la mateixa bústia IMAP rep mails forwardejats des d'adreces
 * antigues o alies que ja no volem veure operativament (ex: ctreball20@gmail).
 */
export function getInboxToFilter(): string[] {
  const raw = (process.env.INBOX_TO_FILTER || '').trim();
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function emailMatchesToFilter(email: EmailMessage, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  for (const t of email.to) {
    const addr = (t.address || '').trim().toLowerCase();
    if (addr && allowed.includes(addr)) return true;
  }
  return false;
}

/**
 * Obtenir llista d'emails de l'inbox
 */
export async function fetchEmails(options: {
  folder?: string;
  limit?: number;
  offset?: number;
  onlyUnread?: boolean;
  skipToFilter?: boolean;
}): Promise<EmailMessage[]> {
  const { folder = 'INBOX', limit = 50, offset = 0, onlyUnread = false, skipToFilter = false } = options;

  // No aplicar filtre de destinatari a carpetes de sortida (Sent, Drafts, etc.)
  const allowed = skipToFilter ? [] : getInboxToFilter();

  // Si hi ha filtre actiu, sobrebusquem (3×) i retallem post-filtre per
  // garantir que retornem ~limit emails que coincideixen.
  const fetchLimit = allowed.length > 0 ? Math.min(limit * 3, 200) : limit;
  const fetchOffset = allowed.length > 0 ? 0 : offset;

  const client = await connectIMAP();
  const emails: EmailMessage[] = [];

  try {
    const mailbox = await client.getMailboxLock(folder);

    try {
      const searchCriteria = onlyUnread ? { seen: false } : { all: true };
      const uids = await client.search(searchCriteria, { uid: true });

      if (!Array.isArray(uids) || uids.length === 0) {
        return emails;
      }

      const sortedUids = uids.sort((a, b) => b - a).slice(fetchOffset, fetchOffset + fetchLimit);

      if (sortedUids.length === 0) {
        return emails;
      }

      for await (const message of client.fetch(sortedUids, {
        uid: true,
        envelope: true,
        bodyStructure: true,
        flags: true,
      }, { uid: true })) {
        const envelope = message.envelope;

        const hasAttachments = identifyAttachmentParts(message.bodyStructure).length > 0;

        emails.push({
          id: `imap-${message.uid}`,
          uid: message.uid,
          messageId: envelope?.messageId || '',
          from: {
            name: envelope?.from?.[0]?.name || '',
            address: envelope?.from?.[0]?.address || '',
          },
          to: envelope?.to?.map((t: { name?: string; address?: string }) => ({
            name: t.name || '',
            address: t.address || '',
          })) || [],
          subject: envelope?.subject || '(Sense assumpte)',
          date: envelope?.date || new Date(),
          bodyText: '',
          bodyHtml: '',
          isRead: message.flags?.has('\\Seen') || false,
          hasAttachments,
          attachments: [],
        });
      }
    } finally {
      mailbox.release();
    }
  } finally {
    try {
      client.close();
    } catch {
      /* swallow */
    }
  }

  if (allowed.length === 0) {
    return emails;
  }

  // Aplicar filtre per `to` i retallar a `limit` reals
  const filtered = emails.filter((e) => emailMatchesToFilter(e, allowed));
  return filtered.slice(offset, offset + limit);
}

/**
 * Obtenir un email per UID.
 *
 * Notes operatives clau:
 *  1. Descarrega només `HEADER` + `TEXT` via `bodyParts`, MAI `source: true`.
 *     `source: true` baixaria el RFC822 sencer incloent attachments en base64,
 *     provocant timeouts >25s i 502 a Railway. Guard estructural a
 *     `__tests__/lib/imap-fetch-bodyparts.test.ts`.
 *  2. Cache LRU en memòria de procés. Cada `fetchEmailByUid(uid)` posterior
 *     a la primera vegada retorna instant. La cache es perd al redeploy
 *     (acceptable: el primer load post-deploy paga el cost real).
 *  3. NO fa `return` dins el `for await` del fetch IMAP — això deixava el
 *     stream en estat suspès i feia que `client.logout()` esperés el timeout
 *     (35s constants observats). Recollir el missatge en variable local i
 *     retornar després de tancar tot net.
 *  4. `client.logout()` substituït per `client.close()` que tanca local sense
 *     esperar resposta del servidor IMAP. Si el servidor és lent o no respon
 *     al `LOGOUT`, cap més bloqueig.
 */
/**
 * Decodifica un buffer raw segons el seu Content-Transfer-Encoding i charset.
 * Suporta:
 *   - 'quoted-printable': =XX → byte, soft line breaks (=\n).
 *   - 'base64': Buffer.from(str, 'base64').
 *   - '7bit' / '8bit' / 'binary' / undefined: passa tal qual.
 *
 * Aplica després el decoding de charset (utf-8 default, latin1, iso-8859-1).
 */
function decodePartBody(raw: Buffer, encoding?: string, charset?: string): string {
  const enc = (encoding || '').toLowerCase();
  let decoded: Buffer;

  if (enc === 'quoted-printable') {
    // Decodifica QP: =XX → byte, =\r\n / =\n → soft break (eliminat)
    const str = raw.toString('binary');
    const cleaned = str.replace(/=\r?\n/g, '');
    const out: number[] = [];
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '=' && i + 2 < cleaned.length) {
        const hex = cleaned.slice(i + 1, i + 3);
        const byte = parseInt(hex, 16);
        if (!Number.isNaN(byte)) {
          out.push(byte);
          i += 2;
          continue;
        }
      }
      out.push(cleaned.charCodeAt(i));
    }
    decoded = Buffer.from(out);
  } else if (enc === 'base64') {
    decoded = Buffer.from(raw.toString('ascii').replace(/\s+/g, ''), 'base64');
  } else {
    decoded = raw;
  }

  const cs = (charset || 'utf-8').toLowerCase().replace(/[_]/g, '-');
  if (cs === 'utf-8' || cs === 'utf8' || cs === 'us-ascii' || cs === 'ascii') {
    return decoded.toString('utf8');
  }
  if (cs === 'latin1' || cs === 'iso-8859-1' || cs === 'iso-8859-15' || cs === 'windows-1252') {
    return decoded.toString('latin1');
  }
  return decoded.toString('utf8');
}

type StructTextPart = {
  partKey: string;
  type: 'text/plain' | 'text/html';
  encoding?: string;
  charset?: string;
};

/**
 * Recorre bodyStructure i identifica les parts text (plain + html) que
 * NO són attachments. Retorna meta per a cada part perquè el caller pugui
 * decodificar el buffer corresponent amb decodePartBody.
 */
function identifyTextParts(bodyStructure: unknown): StructTextPart[] {
  const out: StructTextPart[] = [];
  type Node = {
    type?: string;
    part?: string;
    disposition?: string;
    encoding?: string;
    parameters?: { charset?: string };
    childNodes?: Node[];
  };
  const walk = (node: Node | null | undefined): void => {
    if (!node) return;
    if (node.disposition === 'attachment') return;
    const t = (node.type || '').toLowerCase();
    if ((t === 'text/plain' || t === 'text/html') && node.part) {
      out.push({
        partKey: node.part,
        type: t as 'text/plain' | 'text/html',
        encoding: node.encoding,
        charset: node.parameters?.charset,
      });
    }
    if (node.childNodes) for (const child of node.childNodes) walk(child);
  };
  walk(bodyStructure as Node);

  // Cas missatge single-part (no childNodes, no part): el bodyStructure mateix
  // és el part, i el buffer ImapFlow l'exposa com a 'text' o '1'.
  if (out.length === 0 && bodyStructure) {
    const node = bodyStructure as Node;
    const t = (node.type || '').toLowerCase();
    if (t === 'text/plain' || t === 'text/html') {
      out.push({
        partKey: 'text',
        type: t as 'text/plain' | 'text/html',
        encoding: node.encoding,
        charset: node.parameters?.charset,
      });
    }
  }
  return out;
}

type StructAttachPart = {
  partKey: string;
  filename: string;
  contentType: string;
  size: number;
  encoding?: string;
};

function identifyAttachmentParts(bodyStructure: unknown): StructAttachPart[] {
  const out: StructAttachPart[] = [];
  type Node = {
    type?: string;
    part?: string;
    disposition?: string;
    dispositionParameters?: { filename?: string };
    parameters?: { name?: string };
    encoding?: string;
    size?: number;
    childNodes?: Node[];
  };
  const walk = (node: Node | null | undefined): void => {
    if (!node) return;
    const disp = (node.disposition || '').toLowerCase();
    const type = (node.type || '').toLowerCase();
    const filename = node.dispositionParameters?.filename || node.parameters?.name;
    // Un adjunt és qualsevol part amb `part` que NO sigui multipart ni text del cos:
    //  - disposition 'attachment' o 'inline', O
    //  - sense disposition però amb nom de fitxer (cas Gmail i altres clients).
    const isAttachmentLike =
      !!node.part &&
      type !== 'multipart' && !type.startsWith('multipart/') &&
      (disp === 'attachment' || disp === 'inline' || (!disp && !!filename && !type.startsWith('text/')));
    if (isAttachmentLike && node.part) {
      out.push({
        partKey: node.part,
        filename: filename || `adjunt-${node.part}`,
        contentType: (node.type || 'application/octet-stream').toLowerCase(),
        size: node.size ?? 0,
        encoding: node.encoding,
      });
    }
    if (node.childNodes) for (const child of node.childNodes) walk(child);
  };
  walk(bodyStructure as Node);
  return out;
}

const FETCH_EMAIL_CACHE = new Map<string, EmailMessage>();
const FETCH_EMAIL_CACHE_MAX = 200;

function cacheKey(uid: number, folder: string) {
  return `${folder}:${uid}`;
}

export function invalidateFetchEmailCache(uid: number, folder: string = 'INBOX'): void {
  FETCH_EMAIL_CACHE.delete(cacheKey(uid, folder));
}

export async function fetchEmailByUid(uid: number, folder: string = 'INBOX'): Promise<EmailMessage | null> {
  const key = cacheKey(uid, folder);
  const cached = FETCH_EMAIL_CACHE.get(key);
  if (cached) {
    return cached;
  }

  const client = await connectIMAP();
  let result: EmailMessage | null = null;

  try {
    const mailbox = await client.getMailboxLock(folder);
    try {
      // 1 sol fetch IMAP: envelope + bodyStructure + flags + header + un set
      // genèric de partKeys que cobreix 95% dels casos. ImapFlow retorna
      // null per a parts que no existeixen, sense cost extra. Amb el
      // bodyStructure rebut, sabem quins partKeys són text i només
      // processem aquests. Decodifiquem manualment quoted-printable i
      // base64 per evitar dependre del MIME multipart wrapping.
      const DEFAULT_PARTS = ['header', '1', '2', '3', '1.1', '1.2', '1.3', '2.1', '2.2', 'text'];
      for await (const message of client.fetch([uid], {
        uid: true,
        envelope: true,
        bodyStructure: true,
        flags: true,
        bodyParts: DEFAULT_PARTS,
      }, { uid: true })) {
        const envelope = message.envelope;
        const bodyStructure: unknown = message.bodyStructure;
        const flagsPre = message.flags;

        const textParts = identifyTextParts(bodyStructure);
        const attachParts = identifyAttachmentParts(bodyStructure);
        const hasAttachments = attachParts.length > 0;

        let bodyText = '';
        let bodyHtml = '';

        let parsedHeaders: Record<string, string | string[]> = {};
        let parsedInReplyTo: string | undefined;
        let parsedReferences: string | undefined;
        let parsedCc: { name: string; address: string }[] | undefined;

        // Decodificar cada part text segons el seu encoding+charset
        const headerBuf = message.bodyParts?.get('header');
        for (const part of textParts) {
          const raw = message.bodyParts?.get(part.partKey);
          if (!raw || raw.length === 0) continue;
          const decoded = decodePartBody(raw, part.encoding, part.charset);
          if (part.type === 'text/plain' && !bodyText) bodyText = decoded;
          else if (part.type === 'text/html' && !bodyHtml) bodyHtml = decoded;
        }

        // Si tenim HTML però no text pla, derivem-lo de l'HTML
        if (!bodyText && bodyHtml) {
          bodyText = bodyHtml
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // Parsejar header per a metadades (Orbita, references, cc)
        if (headerBuf) {
          try {
            const parsed = await simpleParser(headerBuf);
            if (parsed.headers && typeof parsed.headers.get === 'function') {
              const kindRaw = parsed.headers.get('x-orbita-kind');
              const idRaw = parsed.headers.get('x-orbita-id');
              const originRaw = parsed.headers.get('x-orbita-origin');
              if (kindRaw) parsedHeaders['x-orbita-kind'] = String(kindRaw);
              if (idRaw) parsedHeaders['x-orbita-id'] = String(idRaw);
              if (originRaw) parsedHeaders['x-orbita-origin'] = String(originRaw);
            }
            parsedInReplyTo = parsed.inReplyTo;
            parsedReferences = Array.isArray(parsed.references) ? parsed.references.join(' ') : parsed.references;
            if (parsed.cc) {
              const ccList = Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc];
              parsedCc = ccList.flatMap(addr => {
                if ('value' in addr && Array.isArray(addr.value)) {
                  return addr.value.map(v => ({ name: v.name || '', address: v.address || '' }));
                }
                return [];
              });
            }
          } catch { /* header malformat: ignorem metadades */ }
        }

        // Derivar vincle Òrbita: header (Sent) > reference (Inbox responses)
        let orbita: EmailMessage['orbita'] | undefined;
        const kindHeader = parsedHeaders['x-orbita-kind'] as string | undefined;
        const idHeader = parsedHeaders['x-orbita-id'] as string | undefined;
        if (kindHeader && idHeader) {
          orbita = {
            kind: kindHeader as OrbitaEntityKind,
            id: idHeader,
            origin: parsedHeaders['x-orbita-origin'] as string | undefined,
            source: 'header',
          };
        } else {
          const fromRef = findOrbitaReferenceIn(parsedInReplyTo || parsedReferences);
          if (fromRef && fromRef.id) {
            orbita = { ...fromRef, source: 'reference' };
          }
        }

        result = {
          id: `imap-${message.uid}`,
          uid: message.uid,
          messageId: envelope?.messageId || '',
          from: {
            name: envelope?.from?.[0]?.name || '',
            address: envelope?.from?.[0]?.address || '',
          },
          to: envelope?.to?.map((t: { name?: string; address?: string }) => ({
            name: t.name || '',
            address: t.address || '',
          })) || [],
          cc: parsedCc,
          subject: envelope?.subject || '(Sense assumpte)',
          date: envelope?.date || new Date(),
          bodyText,
          bodyHtml,
          isRead: (flagsPre || message.flags)?.has('\\Seen') || false,
          isFlagged: (flagsPre || message.flags)?.has('\\Flagged') || false,
          hasAttachments,
          attachments: attachParts.map(p => ({
            partKey: p.partKey,
            filename: p.filename,
            contentType: p.contentType,
            size: p.size,
          })),
          orbita,
          inReplyTo: parsedInReplyTo,
          references: parsedReferences,
        };
        break;
      }
    } finally {
      mailbox.release();
    }
  } finally {
    try {
      client.close();
    } catch {
      /* swallow — close() és síncron i no hauria de fallar, però per si de cas */
    }
  }

  if (result) {
    if (FETCH_EMAIL_CACHE.size >= FETCH_EMAIL_CACHE_MAX) {
      const firstKey = FETCH_EMAIL_CACHE.keys().next().value;
      if (firstKey) FETCH_EMAIL_CACHE.delete(firstKey);
    }
    FETCH_EMAIL_CACHE.set(key, result);
  }

  return result;
}

/**
 * Baixar la part binària d'un adjunt (per a descàrrega).
 * Retorna el buffer decodificat (base64/QP → bytes originals).
 */
export async function fetchAttachmentPart(
  uid: number,
  partKey: string,
  folder: string = 'INBOX',
): Promise<Buffer | null> {
  const client = await connectIMAP();
  let result: Buffer | null = null;
  try {
    const mailbox = await client.getMailboxLock(folder);
    try {
      for await (const message of client.fetch([uid], {
        uid: true,
        bodyStructure: true,
        bodyParts: [partKey],
      }, { uid: true })) {
        const raw = message.bodyParts?.get(partKey);
        if (!raw || raw.length === 0) break;

        // Detectar encoding de la part des del bodyStructure
        type Node = { part?: string; encoding?: string; childNodes?: Node[] };
        let encoding: string | undefined;
        const findEnc = (node: Node | null | undefined): void => {
          if (!node) return;
          if (node.part === partKey) { encoding = node.encoding; return; }
          if (node.childNodes) for (const c of node.childNodes) findEnc(c);
        };
        findEnc(message.bodyStructure as Node);

        const enc = (encoding || '').toLowerCase();
        if (enc === 'base64') {
          result = Buffer.from(raw.toString('ascii').replace(/\s+/g, ''), 'base64');
        } else {
          result = raw instanceof Buffer ? raw : Buffer.from(raw);
        }
        break;
      }
    } finally {
      mailbox.release();
    }
  } finally {
    try { client.close(); } catch { /* swallow */ }
  }
  return result;
}

/**
 * Marcar email com llegit
 */
export async function markAsRead(uid: number, folder: string = 'INBOX'): Promise<boolean> {
  const client = await connectIMAP();

  try {
    const mailbox = await client.getMailboxLock(folder);

    try {
      await client.messageFlagsAdd([uid], ['\\Seen'], { uid: true });
      invalidateFetchEmailCache(uid, folder);
      return true;
    } finally {
      mailbox.release();
    }
  } catch (error) {
    log.error('Failed to mark email as read', error, {
      context: { uid, folder }
    });
    return false;
  } finally {
    await client.logout();
  }
}

/**
 * Marcar email com no llegit
 */
export async function markAsUnread(uid: number, folder: string = 'INBOX'): Promise<boolean> {
  const client = await connectIMAP();

  try {
    const mailbox = await client.getMailboxLock(folder);

    try {
      await client.messageFlagsRemove([uid], ['\\Seen'], { uid: true });
      invalidateFetchEmailCache(uid, folder);
      return true;
    } finally {
      mailbox.release();
    }
  } catch (error) {
    log.error('Failed to mark email as unread', error, {
      context: { uid, folder }
    });
    return false;
  } finally {
    await client.logout();
  }
}

/**
 * Eliminar email (moure a paperera)
 */
export async function deleteEmail(uid: number, folder: string = 'INBOX'): Promise<boolean> {
  const client = await connectIMAP();

  try {
    const mailbox = await client.getMailboxLock(folder);

    try {
      try {
        await client.messageDelete([uid], { uid: true });
        invalidateFetchEmailCache(uid, folder);
        return true;
      } catch {
        // Fallback for servers that block direct delete: move to trash.
        const all = await client.list();
        const trash = all.find(
          (f) =>
            f.specialUse === '\\Trash' ||
            /trash|papelera|eliminados|deleted/i.test(f.path || '')
        );
        if (!trash?.path) {
          return false;
        }
        await client.messageMove([uid], trash.path, { uid: true });
        invalidateFetchEmailCache(uid, folder);
        return true;
      }
    } finally {
      mailbox.release();
    }
  } catch (error) {
    log.error('Failed to delete email', error, {
      context: { uid, folder }
    });
    return false;
  } finally {
    await client.logout();
  }
}

/**
 * Obtenir el path de la carpeta paperera
 */
export async function getTrashFolderPath(): Promise<string | null> {
  const client = await connectIMAP();

  try {
    const all = await client.list();
    const trash = all.find(
      (f) =>
        f.specialUse === '\\Trash' ||
        /trash|papelera|eliminados|deleted/i.test(f.path || '')
    );
    return trash?.path || null;
  } finally {
    await client.logout();
  }
}

/**
 * Moure un email d'una carpeta a una altra
 */
export async function moveToFolder(uid: number, targetFolder: string, sourceFolder: string = 'INBOX'): Promise<boolean> {
  const client = await connectIMAP();

  try {
    const mailbox = await client.getMailboxLock(sourceFolder);

    try {
      await client.messageMove([uid], targetFolder, { uid: true });
      invalidateFetchEmailCache(uid, sourceFolder);
      return true;
    } finally {
      mailbox.release();
    }
  } catch (error) {
    log.error('Failed to move email', error, {
      context: { uid, sourceFolder, targetFolder }
    });
    return false;
  } finally {
    await client.logout();
  }
}

/**
 * Restaurar email de la paperera a INBOX
 */
export async function restoreFromTrash(uid: number): Promise<boolean> {
  const trashPath = await getTrashFolderPath();
  if (!trashPath) return false;
  return moveToFolder(uid, 'INBOX', trashPath);
}

/**
 * Obtenir carpetes disponibles
 */
export async function listFolders(): Promise<string[]> {
  const client = await connectIMAP();
  const folders: string[] = [];

  try {
    const list = await client.list();
    for (const folder of list) {
      folders.push(folder.path);
    }
  } finally {
    await client.logout();
  }

  return folders;
}

/**
 * Comptar emails no llegits
 */
export async function countUnread(folder: string = 'INBOX'): Promise<number> {
  const client = await connectIMAP();

  try {
    const status = await client.status(folder, { unseen: true });
    return status.unseen || 0;
  } finally {
    await client.logout();
  }
}

/**
 * Comptar total d'emails a la carpeta
 */
export async function countTotal(folder: string = 'INBOX'): Promise<number> {
  const client = await connectIMAP();

  try {
    const status = await client.status(folder, { messages: true });
    return status.messages || 0;
  } finally {
    await client.logout();
  }
}

/**
 * Verificar connexió IMAP
 */
export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = await connectIMAP();
    await client.logout();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error de connexió'
    };
  }
}

/* ============================================================================
 * EXTENSIONS — Outlook-style mail client
 * ===========================================================================
 * Funcions afegides per donar suport a múltiples carpetes IMAP (Sent, Drafts,
 * Trash, Junk + carpetes custom), append de missatges (enviats i esborranys),
 * gestió de flags (Seen, Flagged) i cerca.
 *
 * Totes les funcions usen `client.close()` (no `logout()`) per evitar
 * bloquejos quan el servidor IMAP no respon ràpid al LOGOUT.
 * ===========================================================================*/

/* ── Conversation linking — Message-ID & X-Orbita headers ───────────────── */

export type OrbitaEntityKind = 'lead' | 'customer' | 'booking' | 'dossier' | 'proposal' | 'admin';

export interface OrbitaContext {
  kind: OrbitaEntityKind;
  id?: string;
  /** Origen lliure (ex: "dossier-send", "lead-reply", "booking-payment-reminder"). */
  origin?: string;
}

const ORBITA_MID_DOMAIN = (process.env.ORBITA_MAIL_DOMAIN || process.env.SMTP_DOMAIN || 'orbitaevents.com').trim();
const ORBITA_MID_RX = /<orbita\.(lead|customer|booking|dossier|proposal|admin)\.([^.]+)\.[^@]+@[^>]+>/i;

/**
 * Construeix un Message-ID estable amb codificació d'entitat. Permet matchejar
 * resposta de client → entitat sense haver de consultar la BD.
 *
 * Format: `<orbita.{kind}.{id}.{ts36}.{rand}@{domain}>`
 */
export function buildOrbitaMessageId(ctx: OrbitaContext): string {
  const kind = ctx.kind || 'admin';
  const id = (ctx.id || 'na').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'na';
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `<orbita.${kind}.${id}.${ts}.${rand}@${ORBITA_MID_DOMAIN}>`;
}

/**
 * Extreu kind+id d'un Message-ID Òrbita. Retorna null si el messageId no és
 * nostre o no compleix el format.
 */
export function parseOrbitaMessageId(messageId?: string | null): { kind: OrbitaEntityKind; id: string } | null {
  if (!messageId) return null;
  const m = ORBITA_MID_RX.exec(messageId);
  if (!m) return null;
  const kind = m[1].toLowerCase() as OrbitaEntityKind;
  const id = m[2];
  if (!id || id === 'na') return { kind, id: '' };
  return { kind, id };
}

/**
 * Cerca dins una cadena `References:` el primer Message-ID Òrbita conegut.
 * Útil quan una conversa té diverses respostes: el primer reference sol ser
 * l'arrel del fil, on hi és el nostre Message-ID estable.
 */
export function findOrbitaReferenceIn(refs?: string | null): { kind: OrbitaEntityKind; id: string } | null {
  if (!refs) return null;
  const all = refs.match(new RegExp(ORBITA_MID_RX.source, 'gi'));
  if (!all) return null;
  for (const m of all) {
    const parsed = parseOrbitaMessageId(m);
    if (parsed && parsed.id) return parsed;
  }
  return null;
}

/**
 * Headers MIME custom per a tracking d'entitat sense BD intermèdia. Tots són
 * opt-in: si no es passa `ctx`, no s'injecten.
 */
export function buildOrbitaHeaders(ctx: OrbitaContext): Record<string, string> {
  const out: Record<string, string> = {
    'X-Orbita-Kind': ctx.kind,
  };
  if (ctx.id) out['X-Orbita-Id'] = ctx.id;
  if (ctx.origin) out['X-Orbita-Origin'] = ctx.origin;
  return out;
}

export type SpecialUse = 'inbox' | 'sent' | 'drafts' | 'trash' | 'junk' | 'archive' | null;

export interface FolderInfo {
  path: string;
  name: string;
  delimiter: string;
  specialUse: SpecialUse;
  unread: number;
  total: number;
}

/** Adverbis del bestiari: noms de carpeta candidates per a cada tipus. */
const FOLDER_HEURISTICS: Record<Exclude<SpecialUse, null | 'inbox'>, RegExp> = {
  sent: /^(INBOX[./])?(sent|enviados|enviats|elements\s*enviats|envio|enviada|sent\s*items?|sent\s*mail|gesendet)/i,
  drafts: /^(INBOX[./])?(drafts?|borradores|esborranys|esborrany|entwurf|brouillons?)/i,
  trash: /^(INBOX[./])?(trash|papelera|paperera|eliminados|deleted\s*items?|deleted|m[üu]ll|corbeille)/i,
  junk: /^(INBOX[./])?(junk|spam|correo\s*no\s*deseado|brossa)/i,
  archive: /^(INBOX[./])?(archive|archivo|arxiu)/i,
};

function classifyFolder(path: string, specialUse?: string): SpecialUse {
  if (path.toUpperCase() === 'INBOX') return 'inbox';
  if (specialUse) {
    const su = specialUse.replace(/\\/g, '').toLowerCase();
    if (su === 'sent') return 'sent';
    if (su === 'drafts') return 'drafts';
    if (su === 'trash') return 'trash';
    if (su === 'junk') return 'junk';
    if (su === 'archive') return 'archive';
  }
  for (const [kind, rx] of Object.entries(FOLDER_HEURISTICS) as [Exclude<SpecialUse, null | 'inbox'>, RegExp][]) {
    if (rx.test(path)) return kind;
  }
  return null;
}

/**
 * Llistat complet de carpetes amb status (unread + total). Una única connexió
 * IMAP per a tot el llistat — molt més eficient que una crida per carpeta.
 */
export async function listFoldersWithStatus(): Promise<FolderInfo[]> {
  const client = await connectIMAP();
  const result: FolderInfo[] = [];

  try {
    const list = await client.list();
    for (const folder of list) {
      const path = folder.path;
      const specialUse = classifyFolder(path, folder.specialUse);
      let unread = 0;
      let total = 0;
      try {
        const status = await client.status(path, { unseen: true, messages: true });
        unread = status.unseen || 0;
        total = status.messages || 0;
      } catch {
        // Carpeta sense suport de status (rare). Deixem 0.
      }
      result.push({
        path,
        name: folder.name || path,
        delimiter: folder.delimiter || '/',
        specialUse,
        unread,
        total,
      });
    }
  } finally {
    try { client.close(); } catch { /* swallow */ }
  }

  return result;
}

export interface SpecialFolders {
  inbox: string;
  sent: string | null;
  drafts: string | null;
  trash: string | null;
  junk: string | null;
  archive: string | null;
}

let SPECIAL_FOLDERS_CACHE: SpecialFolders | null = null;
let SPECIAL_FOLDERS_CACHED_AT = 0;
const SPECIAL_FOLDERS_TTL_MS = 5 * 60 * 1000;

/**
 * Descobreix les carpetes especials del servidor. Cache curt (5 min) perquè
 * aquesta consulta dispara una connexió IMAP completa.
 */
export async function discoverSpecialFolders(forceRefresh = false): Promise<SpecialFolders> {
  const now = Date.now();
  if (!forceRefresh && SPECIAL_FOLDERS_CACHE && now - SPECIAL_FOLDERS_CACHED_AT < SPECIAL_FOLDERS_TTL_MS) {
    return SPECIAL_FOLDERS_CACHE;
  }

  const client = await connectIMAP();
  const result: SpecialFolders = {
    inbox: 'INBOX',
    sent: null,
    drafts: null,
    trash: null,
    junk: null,
    archive: null,
  };

  try {
    const list = await client.list();
    for (const folder of list) {
      const kind = classifyFolder(folder.path, folder.specialUse);
      if (kind === 'inbox') result.inbox = folder.path;
      else if (kind && result[kind] === null) result[kind] = folder.path;
    }
  } finally {
    try { client.close(); } catch { /* swallow */ }
  }

  SPECIAL_FOLDERS_CACHE = result;
  SPECIAL_FOLDERS_CACHED_AT = now;
  return result;
}

export interface AppendResult {
  ok: boolean;
  folder: string;
  uid?: number;
  uidValidity?: number;
  error?: string;
}

/**
 * Append d'un missatge RFC822 a una carpeta IMAP. S'usa per:
 *   1. Reflectir l'email enviat al folder Sent del servidor.
 *   2. Desar un esborrany al folder Drafts.
 *
 * Retorna sempre un objecte amb `{ok, folder, uid?, error?}`. `uid` només
 * està disponible si el servidor IMAP suporta UIDPLUS (RFC4315) i retorna
 * l'AppendResponse amb UID — la majoria de servidors moderns sí.
 */
export async function appendToFolder(
  folder: string,
  rawMessage: Buffer | string,
  flags: string[] = []
): Promise<AppendResult> {
  if (!folder) return { ok: false, folder: '', error: 'Falta el nom de la carpeta' };
  const client = await connectIMAP();
  try {
    const buf = typeof rawMessage === 'string' ? Buffer.from(rawMessage, 'utf8') : rawMessage;
    const resp = await client.append(folder, buf, flags as string[], new Date()) as
      | { uid?: number; uidValidity?: number; path?: string }
      | undefined;
    return {
      ok: true,
      folder: resp?.path || folder,
      uid: resp?.uid,
      uidValidity: resp?.uidValidity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('[imap] appendToFolder failed', error instanceof Error ? error : undefined, {
      context: { folder, bytes: typeof rawMessage === 'string' ? Buffer.byteLength(rawMessage) : rawMessage.length },
    });
    return { ok: false, folder, error: msg };
  } finally {
    try { client.close(); } catch { /* swallow */ }
  }
}

/**
 * Afegir/treure un flag IMAP a un missatge. Suporta flags estàndard
 * (`\\Seen`, `\\Flagged`, `\\Answered`, `\\Draft`) i custom.
 */
export async function setFlag(
  uid: number,
  folder: string,
  flag: string,
  set: boolean
): Promise<boolean> {
  const client = await connectIMAP();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      if (set) {
        await client.messageFlagsAdd([uid], [flag], { uid: true });
      } else {
        await client.messageFlagsRemove([uid], [flag], { uid: true });
      }
      invalidateFetchEmailCache(uid, folder);
      return true;
    } finally {
      lock.release();
    }
  } catch (error) {
    log.error('[imap] setFlag failed', error instanceof Error ? error : undefined, {
      context: { uid, folder, flag, set }
    });
    return false;
  } finally {
    try { client.close(); } catch { /* swallow */ }
  }
}

/**
 * Cerca emails dins una carpeta amb suport de filtres bàsics. Retorna fins a
 * `limit` resultats ordenats per UID descendent (més nous primer).
 *
 * El paràmetre `query` es matcheja contra: assumpte, remitent (from), text.
 */
export async function searchEmails(opts: {
  folder?: string;
  query: string;
  limit?: number;
}): Promise<EmailMessage[]> {
  const { folder = 'INBOX', query, limit = 50 } = opts;
  const q = (query || '').trim();
  if (!q) return [];

  const client = await connectIMAP();
  const emails: EmailMessage[] = [];

  try {
    const lock = await client.getMailboxLock(folder);
    try {
      // Cerca server-side: OR(SUBJECT, FROM, TEXT). Si el servidor no suporta
      // OR de N criteris, ImapFlow ho linealitza internament.
      const uids = await client.search({
        or: [
          { subject: q },
          { from: q },
          { body: q },
        ],
      }, { uid: true });

      if (!Array.isArray(uids) || uids.length === 0) return emails;

      const sortedUids = uids.sort((a, b) => b - a).slice(0, limit);

      for await (const message of client.fetch(sortedUids, {
        uid: true,
        envelope: true,
        bodyStructure: true,
        flags: true,
      }, { uid: true })) {
        const envelope = message.envelope;
        const hasAttachments = identifyAttachmentParts(message.bodyStructure).length > 0;

        emails.push({
          id: `imap-${message.uid}`,
          uid: message.uid,
          messageId: envelope?.messageId || '',
          from: {
            name: envelope?.from?.[0]?.name || '',
            address: envelope?.from?.[0]?.address || '',
          },
          to: envelope?.to?.map((t: { name?: string; address?: string }) => ({
            name: t.name || '',
            address: t.address || '',
          })) || [],
          subject: envelope?.subject || '(Sense assumpte)',
          date: envelope?.date || new Date(),
          bodyText: '',
          bodyHtml: '',
          isRead: message.flags?.has('\\Seen') || false,
          hasAttachments,
          attachments: [],
        });
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    log.error('[imap] searchEmails failed', error instanceof Error ? error : undefined, {
      context: { folder, query: q, limit }
    });
  } finally {
    try { client.close(); } catch { /* swallow */ }
  }

  return emails;
}

/**
 * Buidar permanentment una carpeta (típic: Paperera). Marca tots els missatges
 * com `\\Deleted` i fa EXPUNGE.
 */
export async function expungeFolder(folder: string): Promise<{ ok: boolean; expunged: number }> {
  const client = await connectIMAP();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const uids = await client.search({ all: true }, { uid: true });
      if (!Array.isArray(uids) || uids.length === 0) return { ok: true, expunged: 0 };
      await client.messageFlagsAdd(uids, ['\\Deleted'], { uid: true });
      // EXPUNGE: ImapFlow no exposa expunge() directament en alguns servidors;
      // messageDelete() amb uids explícits fa el mateix efecte.
      await client.messageDelete(uids, { uid: true });
      return { ok: true, expunged: uids.length };
    } finally {
      lock.release();
    }
  } catch (error) {
    log.error('[imap] expungeFolder failed', error instanceof Error ? error : undefined, {
      context: { folder }
    });
    return { ok: false, expunged: 0 };
  } finally {
    try { client.close(); } catch { /* swallow */ }
  }
}

/**
 * Acció en lot sobre múltiples UIDs d'una mateixa carpeta. Suporta:
 *   - markRead / markUnread
 *   - flag / unflag (`\\Flagged`)
 *   - moveTo (paràmetre `targetFolder`)
 *   - delete (mou a Trash; si la carpeta JA és Trash, esborra permanent)
 */
export async function bulkAction(opts: {
  uids: number[];
  folder: string;
  action: 'markRead' | 'markUnread' | 'flag' | 'unflag' | 'moveTo' | 'delete';
  targetFolder?: string;
}): Promise<{ ok: boolean; affected: number; error?: string }> {
  const { uids, folder, action, targetFolder } = opts;
  if (!Array.isArray(uids) || uids.length === 0) return { ok: true, affected: 0 };

  const client = await connectIMAP();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      if (action === 'markRead') {
        await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });
      } else if (action === 'markUnread') {
        await client.messageFlagsRemove(uids, ['\\Seen'], { uid: true });
      } else if (action === 'flag') {
        await client.messageFlagsAdd(uids, ['\\Flagged'], { uid: true });
      } else if (action === 'unflag') {
        await client.messageFlagsRemove(uids, ['\\Flagged'], { uid: true });
      } else if (action === 'moveTo') {
        if (!targetFolder) return { ok: false, affected: 0, error: 'targetFolder required' };
        await client.messageMove(uids, targetFolder, { uid: true });
      } else if (action === 'delete') {
        const special = await discoverSpecialFolders();
        const isTrash = special.trash && folder === special.trash;
        if (isTrash) {
          await client.messageFlagsAdd(uids, ['\\Deleted'], { uid: true });
          await client.messageDelete(uids, { uid: true });
        } else if (special.trash) {
          await client.messageMove(uids, special.trash, { uid: true });
        } else {
          await client.messageDelete(uids, { uid: true });
        }
      } else {
        return { ok: false, affected: 0, error: `Acció no suportada: ${action}` };
      }
      for (const uid of uids) invalidateFetchEmailCache(uid, folder);
      return { ok: true, affected: uids.length };
    } finally {
      lock.release();
    }
  } catch (error) {
    log.error('[imap] bulkAction failed', error instanceof Error ? error : undefined, {
      context: { folder, action, uids: uids.length, targetFolder }
    });
    return { ok: false, affected: 0, error: error instanceof Error ? error.message : 'Error' };
  } finally {
    try { client.close(); } catch { /* swallow */ }
  }
}
