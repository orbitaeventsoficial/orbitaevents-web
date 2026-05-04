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
  subject: string;
  date: Date;
  bodyText: string;
  bodyHtml: string;
  isRead: boolean;
  hasAttachments: boolean;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
  }[];
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
 * Obtenir llista d'emails de l'inbox
 */
export async function fetchEmails(options: {
  folder?: string;
  limit?: number;
  offset?: number;
  onlyUnread?: boolean;
}): Promise<EmailMessage[]> {
  const { folder = 'INBOX', limit = 50, offset = 0, onlyUnread = false } = options;
  
  const client = await connectIMAP();
  const emails: EmailMessage[] = [];

  try {
    // Obrir carpeta
    const mailbox = await client.getMailboxLock(folder);

    try {
      // Query per obtenir UIDs
      const searchCriteria = onlyUnread ? { seen: false } : { all: true };
      const uids = await client.search(searchCriteria, { uid: true });

      // Si no hi ha resultats, retornar buit
      if (!Array.isArray(uids) || uids.length === 0) {
        return emails;
      }

      // Ordenar per més recent primer i aplicar paginació
      const sortedUids = uids.sort((a, b) => b - a).slice(offset, offset + limit);

      if (sortedUids.length === 0) {
        return emails;
      }

      // Fetch emails (llistat ràpid): sense body complet per millor rendiment.
      for await (const message of client.fetch(sortedUids, {
        uid: true,
        envelope: true,
        bodyStructure: true,
        flags: true,
      }, { uid: true })) {
        const envelope = message.envelope;

        const hasAttachments = message.bodyStructure?.childNodes?.some(
          (node: { disposition?: string }) => node.disposition === 'attachment'
        ) || false;

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
    await client.logout();
  }

  return emails;
}

/**
 * Obtenir un email per UID.
 *
 * IMPORTANT: descarrega només `HEADER` + `TEXT` via `bodyParts`, NO `source: true`.
 * `source: true` baixaria el RFC822 sencer incloent attachments en base64
 * (ex: PDF de 2MB = 2.7MB de base64 transferit), provocant timeouts >25s i 502
 * a Railway quan els missatges porten attachments grans. `bodyParts` salta
 * attachments i descarrega només el text/HTML del missatge.
 */
export async function fetchEmailByUid(uid: number, folder: string = 'INBOX'): Promise<EmailMessage | null> {
  const client = await connectIMAP();

  try {
    const mailbox = await client.getMailboxLock(folder);

    try {
      for await (const message of client.fetch([uid], {
        uid: true,
        envelope: true,
        bodyStructure: true,
        flags: true,
        bodyParts: ['HEADER', 'TEXT'],
      }, { uid: true })) {
        const envelope = message.envelope;

        let bodyText = '';
        let bodyHtml = '';

        const headerPart = message.bodyParts?.get('HEADER');
        const textPart = message.bodyParts?.get('TEXT');

        if (headerPart && textPart) {
          try {
            const fullSource = Buffer.concat([headerPart, textPart]);
            const parsed = await simpleParser(fullSource);
            bodyText = parsed.text || '';
            bodyHtml = typeof parsed.html === 'string' ? parsed.html : '';
          } catch {
            bodyText = textPart.toString('utf8');
          }
        } else if (textPart) {
          bodyText = textPart.toString('utf8');
        }

        const hasAttachments = message.bodyStructure?.childNodes?.some(
          (node: { disposition?: string }) => node.disposition === 'attachment'
        ) || false;

        return {
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
          bodyText,
          bodyHtml,
          isRead: message.flags?.has('\\Seen') || false,
          hasAttachments,
          attachments: [],
        };
      }
    } finally {
      mailbox.release();
    }
  } finally {
    await client.logout();
  }

  return null;
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
