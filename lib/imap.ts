/**
 * CLIENT IMAP - Connexió amb correu DonDominio
 * =============================================
 * Llegeix emails reals del servidor IMAP
 */

import { ImapFlow } from 'imapflow';
import { log } from '@/lib/logger';

// Configuració IMAP - DonDominio
const IMAP_ALLOW_INSECURE = process.env.IMAP_ALLOW_INSECURE === 'true';
const IMAP_CONFIG = {
  host: process.env.IMAP_HOST || '31.214.176.11',
  port: parseInt(process.env.IMAP_PORT || '993'),
  secure: true,
  auth: {
    user: process.env.IMAP_USER || process.env.SMTP_USER || '',
    pass: process.env.IMAP_PASS || process.env.SMTP_PASS || '',
  },
  logger: false as const,
  tls: {
    rejectUnauthorized: !IMAP_ALLOW_INSECURE, // Permetre desactivar verificació només si cal
  },
};

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
  const client = new ImapFlow(IMAP_CONFIG);
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

      // Fetch emails
      for await (const message of client.fetch(sortedUids, {
        uid: true,
        envelope: true,
        bodyStructure: true,
        flags: true,
        source: true,
      }, { uid: true })) {
        const envelope = message.envelope;
        
        // Parse body
        let bodyText = '';
        let bodyHtml = '';
        
        if (message.source) {
          const source = message.source.toString();
          // Simple extraction - en producció usar mailparser
          const textMatch = source.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n\r\n)/i);
          const htmlMatch = source.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n\r\n)/i);
          
          if (textMatch) bodyText = textMatch[1] || '';
          if (htmlMatch) bodyHtml = htmlMatch[1] || '';
          
          // Si no hi ha parts, el body és directe
          if (!bodyText && !bodyHtml) {
            const simpleBody = source.split('\r\n\r\n').slice(1).join('\r\n\r\n');
            bodyText = simpleBody;
          }
        }

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
          bodyText: bodyText.substring(0, 10000), // Limitar mida
          bodyHtml: bodyHtml.substring(0, 50000),
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
 * Obtenir un email per UID
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
        source: true,
      }, { uid: true })) {
        const envelope = message.envelope;
        
        let bodyText = '';
        let bodyHtml = '';
        
        if (message.source) {
          const source = message.source.toString();
          const textMatch = source.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n\r\n)/i);
          const htmlMatch = source.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n\r\n)/i);
          
          if (textMatch) bodyText = textMatch[1] || '';
          if (htmlMatch) bodyHtml = htmlMatch[1] || '';
          
          if (!bodyText && !bodyHtml) {
            bodyText = source.split('\r\n\r\n').slice(1).join('\r\n\r\n');
          }
        }

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
          hasAttachments: false,
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
      await client.messageDelete([uid], { uid: true });
      return true;
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
