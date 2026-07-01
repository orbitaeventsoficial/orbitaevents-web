'use client';
import { log } from '@/lib/logger';
import { formatDateShort, formatDateTimeFull, formatTimeShort } from '@/lib/constants';

import { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';

interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from: {
    name: string;
    address: string;
  };
  to: {
    name: string;
    address: string;
  }[];
  date: string;
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

interface InboxResponse {
  ok: boolean;
  emails: ImapApiEmail[];
  total: number;
  unread: number;
  error?: string;
}

interface ImapApiEmail {
  id: string;
  uid: number;
  subject: string;
  from: {
    name: string;
    address: string;
  };
  to: {
    name: string;
    address: string;
  }[];
  date: string;
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

export default function InboxPanel() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [page, setPage] = useState(0);
  const limit = 20;
  const { confirm, dialogProps } = useConfirmDialog();

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages?limit=${limit}&offset=${page * limit}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error carregant emails');
      }
      const data: InboxResponse = await res.json();
      if (!data.ok) {
        throw new Error(data.error || 'Error carregant emails');
      }
      const mapped = data.emails.map((email) => ({
        id: email.id,
        uid: email.uid,
        subject: email.subject,
        from: email.from,
        to: email.to || [],
        date: email.date,
        preview: (email.bodyText || '').substring(0, 200).replace(/\s+/g, ' ').trim(),
        body: email.bodyText || '',
        bodyHtml: email.bodyHtml || null,
        isRead: email.isRead,
        hasAttachments: email.hasAttachments,
        attachments: email.attachments || [],
      }));
      setEmails(mapped);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error carregant emails');
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleEmailClick = async (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        await fetchWithCsrf(`/api/admin/inbox/messages/${email.uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markRead' }),
        });
        setEmails((prev) => prev.map((item) => (item.uid === email.uid ? { ...item, isRead: true } : item)));
      } catch (error) {
        log.error('Error marcant email com a llegit', error);
      }
    }
  };

  const handleDelete = async (uid: number) => {
    const ok = await confirm({ title: 'Eliminar email', message: 'Segur que vols eliminar aquest email?', confirmLabel: 'Eliminar', variant: 'danger' });
    if (!ok) return;

    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${uid}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminant');

      setEmails((prev) => prev.filter((email) => email.uid !== uid));
      if (selectedEmail?.uid === uid) {
        setSelectedEmail(null);
      }
      setTotal((prev) => prev - 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error eliminant email');
    }
  };

  const formatEmailDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return formatTimeShort(date);
    }
    return formatDateShort(date);
  };

  const unreadCount = emails.filter((email) => !email.isRead).length;

  return (
    <section className="ap-card overflow-hidden" data-help-title="Safata d'entrada IMAP" data-help-desc="Llista els emails rebuts a info@orbitaevents.com via IMAP. Pots llegir, eliminar i refrescar.">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <span>📥</span> Safata d&apos;Entrada
            {unreadCount > 0 && <span className="ap-badge ap-badge--info">{unreadCount} nous</span>}
          </h2>
          <p className="mt-1 text-xs">{total} emails totals · info@orbitaevents.com</p>
        </div>
        <button
          onClick={fetchEmails}
          disabled={loading}
          type="button"
          aria-label="Refrescar emails"
          aria-busy={loading}
          className="rounded-xl p-2 transition-colors disabled:opacity-50 admin-tone-idle"
          title="Refrescar"
        >
          <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="border-b p-4 admin-tone-soft-danger admin-tone-border-danger" role="alert">
          <p className="text-sm admin-tone-text-danger">{error}</p>
          <p className="mt-1 text-xs">Verifica que les variables IMAP_HOST, IMAP_PORT, IMAP_USER i IMAP_PASS estan configurades.</p>
        </div>
      )}

      {loading && !error && (
        <div className="p-8 text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="mt-3 text-sm">Carregant emails...</p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex">
          <div className={`${selectedEmail ? 'w-1/3 border-r border-[var(--line)]' : 'w-full'} max-h-[500px] overflow-y-auto divide-y admin-tone-border-subtle`}>
            {emails.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-4xl">📭</span>
                <p className="mt-2">No hi ha emails</p>
              </div>
            ) : (
              emails.map((email) => (
                <button
                  key={email.uid}
                  onClick={() => handleEmailClick(email)}
                  type="button"
                  aria-pressed={selectedEmail?.uid === email.uid}
                  className={`w-full cursor-pointer px-4 py-3 text-left transition-colors adm-row-hover ${
                    selectedEmail?.uid === email.uid ? 'admin-tone-bg-info border-l-2 admin-tone-border-info' : ''
                  } ${!email.isRead ? 'bg-[var(--o-admin-fill-1)]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${!email.isRead ? 'font-semibold text-[var(--t)]' : 'text-[var(--t2)]'}`}>
                        {email.from.name || email.from.address}
                      </p>
                      <p className={`truncate text-sm ${!email.isRead ? 'font-medium text-[var(--t2)]' : 'text-[var(--t3)]'}`}>
                        {email.subject}
                      </p>
                      <p className="mt-1 truncate text-xs">{email.preview}</p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className="text-xs">{formatEmailDate(email.date)}</span>
                      {email.hasAttachments && <span>📎</span>}
                      {!email.isRead && <span className="h-2 w-2 rounded-full admin-tone-bg-info" />}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {selectedEmail && (
            <div className="flex max-h-[500px] w-2/3 flex-col">
              <div className="border-b px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedEmail.subject}</h3>
                    <p className="mt-1 text-sm">
                      De: <span className="font-medium">{selectedEmail.from.name}</span>
                      {selectedEmail.from.address && <span> &lt;{selectedEmail.from.address}&gt;</span>}
                    </p>
                    <p className="mt-1 text-xs">{formatDateTimeFull(selectedEmail.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDelete(selectedEmail.uid)} type="button" className="rounded-xl p-2 transition-colors admin-tone-idle" title="Eliminar">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button onClick={() => setSelectedEmail(null)} type="button" aria-label="Tancar detall" className="rounded-xl p-2 transition-colors admin-tone-idle">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {selectedEmail.hasAttachments && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((attachment, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
                        📎 {attachment.filename}
                        <span>({Math.round(attachment.size / 1024)}KB)</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selectedEmail.bodyHtml ? (
                  <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.bodyHtml) }} />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm">{selectedEmail.body}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && total > limit && (
        <div className="flex items-center justify-between border-t px-4 py-3" data-help-title="Paginació" data-help-desc="Navega entre pàgines d'emails. Es mostren 20 per pàgina.">
          <span className="text-sm">Mostrant {page * limit + 1}-{Math.min((page + 1) * limit, total)} de {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
              disabled={page === 0}
              type="button"
              className="ap-btn ap-btn--secondary disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={(page + 1) * limit >= total}
              type="button"
              className="ap-btn ap-btn--secondary disabled:opacity-50"
            >
              Següent →
            </button>
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </section>
  );
}
