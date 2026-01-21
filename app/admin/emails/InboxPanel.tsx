'use client';
import { log } from '@/lib/logger';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

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

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inbox/messages?limit=${limit}&offset=${page * limit}`);
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
  };

  useEffect(() => {
    fetchEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleEmailClick = async (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      // Marcar com a llegit
      try {
        await fetch(`/api/admin/inbox/messages/${email.uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markRead' }),
        });
        // Actualitzar estat local
        setEmails(prev => prev.map(e =>
          e.uid === email.uid ? { ...e, isRead: true } : e
        ));
      } catch {
        log.error('Error marcant email com a llegit');
      }
    }
  };

  const handleDelete = async (uid: number) => {
    if (!confirm('Segur que vols eliminar aquest email?')) return;

    try {
      const res = await fetch(`/api/admin/inbox/messages/${uid}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminant');

      // Actualitzar llista
      setEmails(prev => prev.filter(e => e.uid !== uid));
      if (selectedEmail?.uid === uid) {
        setSelectedEmail(null);
      }
      setTotal(prev => prev - 1);
    } catch {
      alert('Error eliminant email');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <section className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <span>📥</span> Safata d&apos;Entrada
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} nous
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {total} emails totals · info@orbitaevents.com
          </p>
        </div>
        <button
          onClick={fetchEmails}
          disabled={loading}
          type="button"
          aria-label="Refrescar emails"
          aria-busy={loading}
          className="p-2 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
          title="Refrescar"
        >
          <svg className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100" role="alert">
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-red-500 mt-1">
            Verifica que les variables IMAP_HOST, IMAP_PORT, IMAP_USER i IMAP_PASS estan configurades.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="p-8 text-center" role="status" aria-live="polite">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-slate-500 mt-3">Carregant emails...</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="flex">
          {/* Email List */}
          <div className={`${selectedEmail ? 'w-1/3 border-r border-slate-100' : 'w-full'} divide-y divide-slate-100 max-h-[500px] overflow-y-auto`}>
            {emails.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
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
                  className={`w-full text-left px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedEmail?.uid === email.uid ? 'bg-blue-50' : ''
                  } ${!email.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!email.isRead ? 'font-semibold text-slate-700' : 'text-slate-700'}`}>
                        {email.from.name || email.from.address}
                      </p>
                      <p className={`text-sm truncate ${!email.isRead ? 'font-medium text-slate-700' : 'text-slate-600'}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {email.preview}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-400">
                        {formatDate(email.date)}
                      </span>
                      {email.hasAttachments && (
                        <span className="text-slate-400">📎</span>
                      )}
                      {!email.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Email Detail */}
          {selectedEmail && (
            <div className="w-2/3 flex flex-col max-h-[500px]">
              {/* Email Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-700">{selectedEmail.subject}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      De: <span className="font-medium">{selectedEmail.from.name}</span>
                      {selectedEmail.from.address && (
                        <span className="text-slate-400"> &lt;{selectedEmail.from.address}&gt;</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(selectedEmail.date).toLocaleString('ca-ES')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(selectedEmail.uid)}
                      type="button"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      type="button"
                      aria-label="Tancar detall"
                      className="p-2 text-slate-400 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {selectedEmail.hasAttachments && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 rounded text-xs text-slate-600">
                        📎 {att.filename}
                        <span className="text-slate-400">({Math.round(att.size / 1024)}KB)</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedEmail.bodyHtml ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.bodyHtml) }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                    {selectedEmail.body}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && total > limit && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Mostrant {page * limit + 1}-{Math.min((page + 1) * limit, total)} de {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              type="button"
              className="px-3 py-1 text-sm border border-stone-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
              type="button"
              className="px-3 py-1 text-sm border border-stone-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Següent →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
