/**
 * CLIENT GMAIL API - Connexió amb Gmail via API REST
 * ===================================================
 * Llegeix emails reals del servidor Gmail usant OAuth2
 * Compatible amb Vercel Serverless (no usa connexions TCP persistents)
 */

import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/v1/users/me';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface GmailMessage {
  id: string;
  threadId: string;
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
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  isRead: boolean;
  hasAttachments: boolean;
  labels: string[];
}

/**
 * Obtenir access token (refrescar si cal)
 */
async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    log.error('Missing Google OAuth credentials');
    return null;
  }

  // Obtenir refresh token de la DB
  const setting = await prisma.setting.findUnique({
    where: { key: 'integrations.gmail.refreshToken' },
  });

  if (!setting?.value) {
    log.error('No Gmail refresh token found - need to authorize');
    return null;
  }

  // Refrescar access token
  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: setting.value,
      grant_type: 'refresh_token',
    });

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      log.error('Failed to refresh Gmail token:', new Error(text));
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (error) {
    log.error('Error refreshing Gmail token:', error as Error);
    return null;
  }
}

/**
 * Fer petició a Gmail API
 */
async function gmailFetch(endpoint: string, accessToken: string): Promise<Response> {
  return fetch(`${GMAIL_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Parsejar header d'email (From, To)
 */
function parseEmailHeader(header: string): { name: string; address: string } {
  const match = header.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim() || '',
      address: match[2]?.trim() || header,
    };
  }
  return { name: '', address: header };
}

/**
 * Decodificar base64url
 */
function decodeBase64Url(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * Extreure cos del missatge
 */
function extractBody(payload: {
  mimeType?: string;
  body?: { data?: string };
  parts?: Array<{ mimeType?: string; body?: { data?: string }; parts?: unknown[] }>;
}): { text: string; html: string } {
  let text = '';
  let html = '';

  if (payload.body?.data) {
    const content = decodeBase64Url(payload.body.data);
    if (payload.mimeType === 'text/plain') {
      text = content;
    } else if (payload.mimeType === 'text/html') {
      html = content;
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = decodeBase64Url(part.body.data);
      } else if (part.parts) {
        const nested = extractBody(part as typeof payload);
        if (!text) text = nested.text;
        if (!html) html = nested.html;
      }
    }
  }

  return { text, html };
}

/**
 * Obtenir llista d'emails
 */
export async function fetchEmails(options: {
  maxResults?: number;
  query?: string;
  labelIds?: string[];
}): Promise<GmailMessage[]> {
  const { maxResults = 50, query = '', labelIds = ['INBOX'] } = options;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('No Gmail access token available');
  }

  const emails: GmailMessage[] = [];

  try {
    // Obtenir llista de missatges
    const params = new URLSearchParams({
      maxResults: String(maxResults),
      labelIds: labelIds.join(','),
    });
    if (query) params.set('q', query);

    const listRes = await gmailFetch(`/messages?${params}`, accessToken);
    if (!listRes.ok) {
      const text = await listRes.text();
      throw new Error(`Gmail API error: ${text}`);
    }

    const listData = await listRes.json();
    const messageIds: { id: string; threadId: string }[] = listData.messages || [];

    // Obtenir detalls de cada missatge
    for (const { id, threadId } of messageIds) {
      try {
        const msgRes = await gmailFetch(`/messages/${id}?format=full`, accessToken);
        if (!msgRes.ok) continue;

        const msg = await msgRes.json();
        const headers = msg.payload?.headers || [];

        const getHeader = (name: string): string =>
          headers.find((h: { name: string; value: string }) =>
            h.name.toLowerCase() === name.toLowerCase()
          )?.value || '';

        const fromHeader = getHeader('From');
        const toHeader = getHeader('To');
        const subject = getHeader('Subject');
        const dateHeader = getHeader('Date');

        const { text, html } = extractBody(msg.payload || {});
        const isRead = !msg.labelIds?.includes('UNREAD');
        const hasAttachments = msg.payload?.parts?.some(
          (p: { filename?: string }) => p.filename && p.filename.length > 0
        ) || false;

        emails.push({
          id,
          threadId,
          from: parseEmailHeader(fromHeader),
          to: toHeader.split(',').map((t: string) => parseEmailHeader(t.trim())),
          subject: subject || '(Sense assumpte)',
          date: dateHeader ? new Date(dateHeader) : new Date(),
          snippet: msg.snippet || '',
          bodyText: text.substring(0, 10000),
          bodyHtml: html.substring(0, 50000),
          isRead,
          hasAttachments,
          labels: msg.labelIds || [],
        });
      } catch (err) {
        log.error(`Error fetching message ${id}:`, err as Error);
      }
    }
  } catch (error) {
    log.error('Error fetching Gmail messages:', error as Error);
    throw error;
  }

  return emails;
}

/**
 * Obtenir un email per ID
 */
export async function fetchEmailById(messageId: string): Promise<GmailMessage | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('No Gmail access token available');
  }

  try {
    const msgRes = await gmailFetch(`/messages/${messageId}?format=full`, accessToken);
    if (!msgRes.ok) {
      return null;
    }

    const msg = await msgRes.json();
    const headers = msg.payload?.headers || [];

    const getHeader = (name: string): string =>
      headers.find((h: { name: string; value: string }) =>
        h.name.toLowerCase() === name.toLowerCase()
      )?.value || '';

    const fromHeader = getHeader('From');
    const toHeader = getHeader('To');
    const subject = getHeader('Subject');
    const dateHeader = getHeader('Date');

    const { text, html } = extractBody(msg.payload || {});
    const isRead = !msg.labelIds?.includes('UNREAD');
    const hasAttachments = msg.payload?.parts?.some(
      (p: { filename?: string }) => p.filename && p.filename.length > 0
    ) || false;

    return {
      id: messageId,
      threadId: msg.threadId,
      from: parseEmailHeader(fromHeader),
      to: toHeader.split(',').map((t: string) => parseEmailHeader(t.trim())),
      subject: subject || '(Sense assumpte)',
      date: dateHeader ? new Date(dateHeader) : new Date(),
      snippet: msg.snippet || '',
      bodyText: text,
      bodyHtml: html,
      isRead,
      hasAttachments,
      labels: msg.labelIds || [],
    };
  } catch (error) {
    log.error('Error fetching Gmail message:', error as Error);
    return null;
  }
}

/**
 * Marcar email com llegit
 */
export async function markAsRead(messageId: string): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    const res = await fetch(`${GMAIL_API_BASE}/messages/${messageId}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Marcar email com no llegit
 */
export async function markAsUnread(messageId: string): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    const res = await fetch(`${GMAIL_API_BASE}/messages/${messageId}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addLabelIds: ['UNREAD'],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Eliminar email (moure a paperera)
 */
export async function deleteEmail(messageId: string): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    const res = await fetch(`${GMAIL_API_BASE}/messages/${messageId}/trash`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Comptar emails no llegits
 */
export async function countUnread(): Promise<number> {
  const accessToken = await getAccessToken();
  if (!accessToken) return 0;

  try {
    const res = await gmailFetch('/messages?labelIds=INBOX&labelIds=UNREAD&maxResults=1', accessToken);
    if (!res.ok) return 0;

    const data = await res.json();
    return data.resultSizeEstimate || 0;
  } catch {
    return 0;
  }
}

/**
 * Comptar total d'emails a l'inbox
 */
export async function countTotal(): Promise<number> {
  const accessToken = await getAccessToken();
  if (!accessToken) return 0;

  try {
    const res = await gmailFetch('/labels/INBOX', accessToken);
    if (!res.ok) return 0;

    const data = await res.json();
    return data.messagesTotal || 0;
  } catch {
    return 0;
  }
}

/**
 * Verificar connexió Gmail
 */
export async function testConnection(): Promise<{ ok: boolean; error?: string; email?: string }> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {
      ok: false,
      error: 'No Gmail autoritzat. Cal connectar el compte de Gmail primer.'
    };
  }

  try {
    const res = await gmailFetch('/profile', accessToken);
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Gmail API error: ${text}` };
    }

    const profile = await res.json();
    return {
      ok: true,
      email: profile.emailAddress
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error de connexió'
    };
  }
}

/**
 * Verificar si Gmail està configurat
 */
export async function isGmailConfigured(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'integrations.gmail.refreshToken' },
  });
  return !!setting?.value;
}
