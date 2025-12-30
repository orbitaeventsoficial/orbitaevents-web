/**
 * IMAP SERVICE - Llegir emails del servidor
 * ==========================================
 * Connexió IMAP per llegir emails entrants al panell admin
 */

import imaps from 'imap-simple';
import { simpleParser, ParsedMail } from 'mailparser';

export interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from: {
    name: string;
    address: string;
  };
  to: string[];
  date: Date;
  preview: string;
  body: string;
  bodyHtml: string | null;
  isRead: boolean;
  hasAttachments: boolean;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
  }[];
}

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
}

function getImapConfig(): ImapConfig | null {
  const host = process.env.IMAP_HOST;
  const port = process.env.IMAP_PORT;
  const user = process.env.IMAP_USER;
  const password = process.env.IMAP_PASS;

  if (!host || !port || !user || !password) {
    return null;
  }

  return {
    host: host.trim(),
    port: parseInt(port.trim()),
    user: user.trim(),
    password: password.trim(),
    tls: true,
  };
}

/**
 * Obtenir emails de la safata d'entrada
 */
export async function getInboxEmails(limit = 50, offset = 0): Promise<{
  emails: EmailMessage[];
  total: number;
}> {
  const config = getImapConfig();

  if (!config) {
    throw new Error('IMAP no configurat. Afegeix les variables IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS');
  }

  const imapConfig = {
    imap: {
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  };

  let connection: imaps.ImapSimple | null = null;

  try {
    connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    // Obtenir total de missatges
    const searchCriteria = ['ALL'];
    const allMessages = await connection.search(searchCriteria, {
      bodies: [],
      struct: true,
    });
    const total = allMessages.length;

    // Obtenir els últims N missatges (amb offset)
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      struct: true,
      markSeen: false,
    };

    // Ordenar per UID descendent i aplicar paginació
    const sortedMessages = allMessages
      .sort((a, b) => (b.attributes?.uid || 0) - (a.attributes?.uid || 0))
      .slice(offset, offset + limit);

    if (sortedMessages.length === 0) {
      return { emails: [], total };
    }

    // Obtenir UIDs per fetch
    const uids = sortedMessages.map(m => m.attributes?.uid).filter(Boolean) as number[];

    // Fetch dels missatges complets
    const messages = await connection.search([['UID', uids.join(',')]], fetchOptions);

    const emails: EmailMessage[] = [];

    for (const message of messages) {
      try {
        const all = message.parts.find(p => p.which === '');
        if (!all) continue;

        const parsed: ParsedMail = await simpleParser(all.body);

        const flags = message.attributes?.flags || [];
        const isRead = flags.includes('\\Seen');

        const fromAddress = parsed.from?.value?.[0];

        // Gestionar que "to" pot ser AddressObject o AddressObject[]
        const toValue = parsed.to
          ? (Array.isArray(parsed.to) ? parsed.to[0]?.value : parsed.to.value)
          : [];

        emails.push({
          id: `${message.attributes?.uid}`,
          uid: message.attributes?.uid || 0,
          subject: parsed.subject || '(Sense assumpte)',
          from: {
            name: fromAddress?.name || fromAddress?.address || 'Desconegut',
            address: fromAddress?.address || '',
          },
          to: toValue?.map(t => t.address || '') || [],
          date: parsed.date || new Date(),
          preview: (parsed.text || '').substring(0, 200).replace(/\s+/g, ' ').trim(),
          body: parsed.text || '',
          bodyHtml: parsed.html || null,
          isRead,
          hasAttachments: (parsed.attachments?.length || 0) > 0,
          attachments: parsed.attachments?.map(att => ({
            filename: att.filename || 'sense-nom',
            contentType: att.contentType,
            size: att.size,
          })) || [],
        });
      } catch (parseError) {
        console.error('Error parsing email:', parseError);
      }
    }

    // Ordenar per data descendent
    emails.sort((a, b) => b.date.getTime() - a.date.getTime());

    return { emails, total };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // Ignorar errors de tancament
      }
    }
  }
}

/**
 * Obtenir un email específic per UID
 */
export async function getEmailByUid(uid: number): Promise<EmailMessage | null> {
  const config = getImapConfig();

  if (!config) {
    throw new Error('IMAP no configurat');
  }

  const imapConfig = {
    imap: {
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  };

  let connection: imaps.ImapSimple | null = null;

  try {
    connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    const fetchOptions = {
      bodies: [''],
      struct: true,
      markSeen: true, // Marcar com a llegit
    };

    const messages = await connection.search([['UID', String(uid)]], fetchOptions);

    if (messages.length === 0) {
      return null;
    }

    const message = messages[0];
    const all = message.parts.find(p => p.which === '');
    if (!all) return null;

    const parsed: ParsedMail = await simpleParser(all.body);
    const flags = message.attributes?.flags || [];
    const isRead = flags.includes('\\Seen');
    const fromAddress = parsed.from?.value?.[0];

    // Gestionar que "to" pot ser AddressObject o AddressObject[]
    const toValue = parsed.to
      ? (Array.isArray(parsed.to) ? parsed.to[0]?.value : parsed.to.value)
      : [];

    return {
      id: `${message.attributes?.uid}`,
      uid: message.attributes?.uid || 0,
      subject: parsed.subject || '(Sense assumpte)',
      from: {
        name: fromAddress?.name || fromAddress?.address || 'Desconegut',
        address: fromAddress?.address || '',
      },
      to: toValue?.map(t => t.address || '') || [],
      date: parsed.date || new Date(),
      preview: (parsed.text || '').substring(0, 200).replace(/\s+/g, ' ').trim(),
      body: parsed.text || '',
      bodyHtml: parsed.html || null,
      isRead,
      hasAttachments: (parsed.attachments?.length || 0) > 0,
      attachments: parsed.attachments?.map(att => ({
        filename: att.filename || 'sense-nom',
        contentType: att.contentType,
        size: att.size,
      })) || [],
    };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // Ignorar errors de tancament
      }
    }
  }
}

/**
 * Marcar email com a llegit
 */
export async function markAsRead(uid: number): Promise<void> {
  const config = getImapConfig();

  if (!config) {
    throw new Error('IMAP no configurat');
  }

  const imapConfig = {
    imap: {
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  };

  let connection: imaps.ImapSimple | null = null;

  try {
    connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');
    await connection.addFlags(uid, ['\\Seen']);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // Ignorar errors de tancament
      }
    }
  }
}

/**
 * Eliminar email (moure a paperera)
 */
export async function deleteEmail(uid: number): Promise<void> {
  const config = getImapConfig();

  if (!config) {
    throw new Error('IMAP no configurat');
  }

  const imapConfig = {
    imap: {
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  };

  let connection: imaps.ImapSimple | null = null;

  try {
    connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');
    await connection.addFlags(uid, ['\\Deleted']);
    // Expunge per eliminar definitivament
    await new Promise<void>((resolve, reject) => {
      connection!.imap.expunge((err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // Ignorar errors de tancament
      }
    }
  }
}
