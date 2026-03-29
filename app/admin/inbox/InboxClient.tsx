'use client';

import { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { getEventLabel, formatDateShort, formatDateTimeFull, formatDateSimple, DEFAULT_LOCALE } from '@/lib/constants';
import { log } from '@/lib/logger';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';
import { ComposeModal, QuoteModal } from './InboxModals';
import type { LeadData, ImapEmail, UnifiedEmail, InboxStats, QuotePackOption } from './inbox-types';
import { getLeadStatusTone } from './inbox-types';

export default function InboxClient({
  initialLeads,
  stats,
  imapConfigured,
  quotePacks,
}: {
  initialLeads: LeadData[];
  stats: InboxStats;
  imapConfigured: boolean;
  quotePacks: QuotePackOption[];
}) {
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'leads' | 'emails' | 'trash'>('all');
  const [imapEmails, setImapEmails] = useState<ImapEmail[]>([]);
  const [trashEmails, setTrashEmails] = useState<ImapEmail[]>([]);
  const [trashCount, setTrashCount] = useState(0);
  const [imapUnread, setImapUnread] = useState(0);
  const [loadingImap, setLoadingImap] = useState(false);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [imapError, setImapError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<UnifiedEmail | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [replyTo, setReplyTo] = useState<UnifiedEmail | null>(null);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [emailDetailsByUid, setEmailDetailsByUid] = useState<Record<number, ImapEmail>>({});
  const { confirm, dialogProps } = useConfirmDialog();

  // Convertir leads a format unificat
  const emails = useMemo(() => {
    const leadEmails: UnifiedEmail[] = initialLeads.map((lead) => ({
      id: lead.id,
      type: 'lead' as const,
      from: lead.email,
      fromName: lead.name,
      subject: `📋 ${getEventLabel(lead.eventType || '', 'Sol·licitud')}`,
      preview: lead.message || 'Sense missatge',
      date: new Date(lead.createdAt),
      read: lead.status !== 'NEW',
      leadData: lead,
    }));

    const imapUnified: UnifiedEmail[] = imapEmails.map((email) => ({
      id: email.id,
      type: 'imap' as const,
      from: email.from.address,
      fromName: email.from.name || email.from.address.split('@')[0],
      subject: email.subject,
      preview: email.bodyText?.slice(0, 150) || '',
      date: new Date(email.date),
      read: email.isRead,
      imapData: email,
    }));

    return [...leadEmails, ...imapUnified].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [initialLeads, imapEmails]);

  const loadImapEmails = useCallback(async () => {
    setLoadingImap(true);
    setImapError(null);

    try {
      const params = new URLSearchParams({ limit: '25', _t: String(Date.now()) });
      const res = await fetchWithCsrf(`/api/admin/inbox/messages?${params}`, { cache: 'no-store' });
      const data = await res.json();
      const message = data?.details
        ? `${data?.error || 'Error carregant emails'}: ${data.details}`
        : data?.error || 'Error carregant emails';

      if (!res.ok || !data.ok) {
        setImapError(message);
        setFlashMessage({ type: 'error', text: message });
        setImapEmails([]);
        setImapUnread(0);
        return;
      }

      setImapEmails(data.emails || []);
      setImapUnread(data.unread || 0);
      setFlashMessage(null);
    } catch (error) {
      const msg = error instanceof Error ? `Error de connexió: ${error.message}` : 'Error de connexió';
      setImapError(msg);
      setFlashMessage({ type: 'error', text: msg });
      setImapEmails([]);
      setImapUnread(0);
    } finally {
      setLoadingImap(false);
    }
  }, []);

  const loadTrashEmails = useCallback(async () => {
    setLoadingTrash(true);
    try {
      const params = new URLSearchParams({ folder: 'Trash', action: 'countTotal' });
      const countRes = await fetchWithCsrf(`/api/admin/inbox/messages?${params}`, { cache: 'no-store' });
      const countData = await countRes.json().catch(() => ({}));
      if (countRes.ok) setTrashCount(countData.total || 0);

      const listParams = new URLSearchParams({ folder: 'Trash', limit: '25', _t: String(Date.now()) });
      const res = await fetchWithCsrf(`/api/admin/inbox/messages?${listParams}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setTrashEmails(data.emails || []);
        setTrashCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error loading trash:', error);
    } finally {
      setLoadingTrash(false);
    }
  }, []);

  useEffect(() => {
    if (!imapConfigured) return;
    if (activeTab === 'trash') {
      if (trashEmails.length === 0) loadTrashEmails();
      return;
    }
    if (imapEmails.length > 0) return;
    loadImapEmails();
  }, [imapConfigured, activeTab, imapEmails.length, trashEmails.length, loadImapEmails, loadTrashEmails]);

  // Filtrar emails
  // Emails de la paperera en format unificat
  const trashUnified: UnifiedEmail[] = useMemo(() => {
    return trashEmails.map((email) => ({
      id: email.id,
      type: 'imap' as const,
      from: email.from.address,
      fromName: email.from.name || email.from.address.split('@')[0],
      subject: email.subject,
      preview: email.bodyText?.slice(0, 150) || '',
      date: new Date(email.date),
      read: email.isRead,
      imapData: email,
    }));
  }, [trashEmails]);

  const deferredQuery = useDeferredValue(searchQuery);
  const queryLower = deferredQuery.trim().toLowerCase();
  const filteredEmails = useMemo(() => {
    let source = activeTab === 'trash' ? trashUnified : emails;
    if (activeTab === 'leads') source = emails.filter((e) => e.type === 'lead');
    if (activeTab === 'emails') source = emails.filter((e) => e.type === 'imap');
    return source.filter((email) => {
      if (filter === 'unread' && email.read) return false;
      if (queryLower) {
        return (
          email.from.toLowerCase().includes(queryLower) ||
          email.fromName.toLowerCase().includes(queryLower) ||
          email.subject.toLowerCase().includes(queryLower) ||
          email.preview.toLowerCase().includes(queryLower)
        );
      }
      return true;
    });
  }, [emails, trashUnified, activeTab, filter, queryLower]);

  function handleReply(email: UnifiedEmail) {
    setReplyTo(email);
    setShowCompose(true);
  }

  async function handleSelectEmail(email: UnifiedEmail) {
    setSelectedEmail(email);

    if (email.type !== 'imap' || !email.imapData?.uid) return;

    setLoadingSelected(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.imapData.uid}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.email) return;

      const detailed = data.email as ImapEmail;
      setSelectedEmail((prev) => {
        if (!prev || prev.id !== email.id) return prev;
        return {
          ...prev,
          read: true,
          preview: detailed.bodyText?.slice(0, 150) || prev.preview,
          imapData: {
            ...prev.imapData!,
            ...detailed,
          },
        };
      });
    } catch (error) {
      console.warn("No s'han pogut carregar els detalls de l'email seleccionat", error);
    } finally {
      setLoadingSelected(false);
    }
  }

  async function handleImportLeadFromEmail(email: UnifiedEmail) {
    if (email.type !== 'imap' || !email.imapData?.uid) return;

    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.imapData.uid}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fallbackEmail: {
            fromAddress: email.imapData.from.address || email.from,
            fromName: email.imapData.from.name || email.fromName,
            subject: email.imapData.subject || email.subject,
            bodyText: email.imapData.bodyText || email.preview || '',
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.lead?.id) {
        setFlashMessage({ type: 'error', text: data?.error || "No s'ha pogut importar el lead" });
        return;
      }

      setFlashMessage({
        type: 'success',
        text: data.action === 'updated'
          ? `Entrada actualitzada: ${data.lead.name}`
          : `Entrada creada: ${data.lead.name}`,
      });
      router.push(`/admin/leads/${data.lead.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error importing lead from email:', error);
      setFlashMessage({ type: 'error', text: 'Error important email a lead' });
    }
  }

  async function handleMoveToTrash(email: UnifiedEmail) {
    if (email.type !== 'imap' || !email.imapData?.uid) return;
    const ok = await confirm({ title: 'Moure a paperera', message: 'Segur que vols moure aquest email a la paperera?', confirmLabel: 'Moure', variant: 'warning' });
    if (!ok) return;

    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.imapData.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moveToTrash' }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setFlashMessage({ type: 'error', text: data?.error || 'No s\'ha pogut moure a la paperera' });
        return;
      }

      setImapEmails((prev) => prev.filter((item) => item.uid !== email.imapData!.uid));
      setSelectedEmail((prev) => (prev?.id === email.id ? null : prev));
      setImapUnread((prev) => Math.max(0, prev - (email.read ? 0 : 1)));
      setTrashCount((prev) => prev + 1);
      setTrashEmails([]); // Reset per forçar recàrrega
      setFlashMessage({ type: 'success', text: 'Email mogut a la paperera' });
    } catch (error) {
      console.error('Error moving to trash:', error);
      setFlashMessage({ type: 'error', text: 'Error movent a la paperera' });
    }
  }

  async function handleRestoreEmail(email: UnifiedEmail) {
    if (email.type !== 'imap' || !email.imapData?.uid) return;

    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.imapData.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setFlashMessage({ type: 'error', text: data?.error || 'No s\'ha pogut restaurar l\'email' });
        return;
      }

      setTrashEmails((prev) => prev.filter((item) => item.uid !== email.imapData!.uid));
      setTrashCount((prev) => Math.max(0, prev - 1));
      setSelectedEmail((prev) => (prev?.id === email.id ? null : prev));
      setImapEmails([]); // Reset per forçar recàrrega
      setFlashMessage({ type: 'success', text: 'Email restaurat a la safata d\'entrada' });
    } catch (error) {
      console.error('Error restoring email:', error);
      setFlashMessage({ type: 'error', text: 'Error restaurant email' });
    }
  }

  async function handleDeletePermanently(email: UnifiedEmail) {
    if (email.type !== 'imap' || !email.imapData?.uid) return;
    const ok = await confirm({ title: 'Eliminar permanentment', message: 'Aquesta acció és irreversible. Segur?', confirmLabel: 'Eliminar', variant: 'danger' });
    if (!ok) return;

    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.imapData.uid}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setFlashMessage({ type: 'error', text: data?.error || 'No s\'ha pogut eliminar l\'email' });
        return;
      }

      setTrashEmails((prev) => prev.filter((item) => item.uid !== email.imapData!.uid));
      setTrashCount((prev) => Math.max(0, prev - 1));
      setSelectedEmail((prev) => (prev?.id === email.id ? null : prev));
      setFlashMessage({ type: 'success', text: 'Email eliminat permanentment' });
    } catch (error) {
      console.error('Error deleting email permanently:', error);
      setFlashMessage({ type: 'error', text: 'Error eliminant email' });
    }
  }

  function formatEmailDate(date: Date) {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString(DEFAULT_LOCALE, { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ahir';
    } else if (diffDays < 7) {
      return d.toLocaleDateString(DEFAULT_LOCALE, { weekday: 'short' });
    } else {
      return formatDateShort(d);
    }
  }

  const totalUnread = stats.unreadLeads + imapUnread;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar filters */}
      <aside className="w-56 border-r p-4 hidden lg:block">
        <div className="space-y-1 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'
            }`}
          >
            📬 Tot ({emails.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'leads' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'
            }`}
          >
            📋 Entrades web ({initialLeads.length})
          </button>
          {imapConfigured && (
            <>
              <button
                onClick={() => setActiveTab('emails')}
                type="button"
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'emails' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'
                }`}
              >
                📧 Emails ({imapEmails.length})
                {imapUnread > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full">
                    {imapUnread}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('trash')}
                type="button"
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'trash' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'
                }`}
              >
                🗑️ Paperera {trashCount > 0 && `(${trashCount})`}
              </button>
            </>
          )}
        </div>

        <hr className="my-4" />

        <nav className="space-y-1">
          <button
            onClick={() => setFilter('all')}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
              filter === 'all' ? 'admin-tone-soft-info admin-tone-text-info' : 'text-white/40 hover:bg-white/5'
            }`}
          >
            Tots
          </button>
          <button
            onClick={() => setFilter('unread')}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
              filter === 'unread' ? 'admin-tone-soft-info admin-tone-text-info' : 'text-white/40 hover:bg-white/5'
            }`}
          >
            🔵 No llegits ({totalUnread})
          </button>
        </nav>

        {imapConfigured && (
          <div className="mt-4 p-3 border rounded-xl">
            <p className="text-sm font-medium">Només Òrbita</p>
            <p className="text-xs mt-1">
              Es mostren només emails de <span className="">orbitaevents.com</span>
            </p>
          </div>
        )}

        {imapConfigured && (
          <button
            onClick={activeTab === 'trash' ? loadTrashEmails : loadImapEmails}
            disabled={loadingImap || loadingTrash}
            type="button"
            className="w-full mt-4 px-3 py-2 border rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {loadingImap || loadingTrash ? '⏳ Carregant...' : '🔄 Actualitzar'}
          </button>
        )}

        {imapError && (
          <div className="mt-4 p-3 border rounded-xl">
            <p className="text-xs">{imapError}</p>
          </div>
        )}
      </aside>

      {/* Email list */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cercar..."
              aria-label="Cercar emails"
              className="ap-input py-2 pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        {flashMessage && (
          <div
            className={`mx-3 mt-3 rounded-xl border px-3 py-2 text-xs ${
              flashMessage.type === 'success'
                ? 'admin-tone-soft-success admin-tone-border-success admin-tone-text-success'
                : 'admin-tone-soft-danger admin-tone-border-danger admin-tone-text-danger'
            }`}
            role={flashMessage.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <span>{flashMessage.text}</span>
              <button
                onClick={() => setFlashMessage(null)}
                type="button"
                aria-label="Tancar missatge"
                className="text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {(loadingImap && imapEmails.length === 0) || (loadingTrash && trashEmails.length === 0) ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4" />
              <p>Carregant emails...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-4xl">📭</span>
              <p className="mt-2">No hi ha missatges</p>
              <p className="text-xs mt-1 admin-tone-text-slate">Els correus rebuts apareixeran aquí. Prova a canviar el filtre o recarregar.</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <button
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                type="button"
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                  selectedEmail?.id === email.id ? 'admin-tone-bg-info border-l-4 admin-tone-border-info' : ''
                } ${!email.read ? 'admin-tone-bg-info' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!email.read && <span className="w-2 h-2 rounded-full flex-shrink-0" />}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        email.type === 'lead' ? 'admin-tone-bg-violet admin-tone-text-violet' : 'admin-tone-bg-success admin-tone-text-success'
                      }`}>
                        {email.type === 'lead' ? 'Entrada web' : 'Correu IMAP'}
                      </span>
                      {!email.read && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded">
                          Nou
                        </span>
                      )}
                      <p className={`text-sm truncate ${!email.read ? 'font-semibold text-white/90' : 'text-white/60'}`}>
                        {email.fromName}
                      </p>
                    </div>
                    <p className="text-sm truncate mt-0.5">{email.subject}</p>
                    <p className="text-xs truncate mt-1">{email.preview || email.subject}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs">{formatEmailDate(email.date)}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Email detail */}
      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedEmail.type === 'lead' ? 'admin-tone-bg-violet admin-tone-text-violet' : 'admin-tone-bg-success admin-tone-text-success'
                    }`}>
                      {selectedEmail.type === 'lead' ? '📋 Entrada web' : '📧 Correu IMAP'}
                    </span>
                    {selectedEmail.leadData?.status && (
                      <span className={`rounded border px-2 py-1 text-xs font-medium ${getLeadStatusTone(selectedEmail.leadData.status).bg} ${getLeadStatusTone(selectedEmail.leadData.status).text} ${getLeadStatusTone(selectedEmail.leadData.status).border}`}>
                        {selectedEmail.leadData.status}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      {selectedEmail.fromName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{selectedEmail.fromName}</p>
                      <p className="text-sm">{selectedEmail.from}</p>
                    </div>
                  </div>
                </div>
                <span className="text-sm">
                  {formatDateTimeFull(selectedEmail.date)}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedEmail.leadData && (
                <div className="rounded-xl p-6 mb-6 border">
                  <h3 className="font-semibold mb-4">📋 Detalls de la sol·licitud</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="">Tipus d&apos;event:</span>
                      <p className="font-medium">{getEventLabel(selectedEmail.leadData.eventType || '', 'No especificat')}</p>
                    </div>
                    {selectedEmail.leadData.eventDate && (
                      <div>
                        <span className="">Data:</span>
                        <p className="font-medium">{formatDateSimple(selectedEmail.leadData.eventDate)}</p>
                      </div>
                    )}
                    {selectedEmail.leadData.guestCount && (
                      <div>
                        <span className="">Convidats:</span>
                        <p className="font-medium">{selectedEmail.leadData.guestCount} persones</p>
                      </div>
                    )}
                    {selectedEmail.leadData.budget && (
                      <div>
                        <span className="">Pressupost:</span>
                        <p className="font-medium">{selectedEmail.leadData.budget}</p>
                      </div>
                    )}
                    {selectedEmail.leadData.eventLocation && (
                      <div>
                        <span className="">Ubicació:</span>
                        <p className="font-medium">{selectedEmail.leadData.eventLocation}</p>
                      </div>
                    )}
                    {selectedEmail.leadData.phone && (
                      <div>
                        <span className="">Telèfon:</span>
                        <p className="font-medium">
                          <a href={`tel:${selectedEmail.leadData.phone}`} className="hover:underline">
                            {selectedEmail.leadData.phone}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                <h4 className="text-sm font-medium mb-2">Missatge:</h4>
                {loadingSelected && selectedEmail.type === 'imap' && (
                  <p className="text-xs mb-2">Carregant contingut complet...</p>
                )}
                {selectedEmail.imapData?.bodyHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.imapData.bodyHtml) }}
                    className="p-4 rounded-xl border"
                  />
                ) : (
                  <p className="whitespace-pre-wrap">
                    {selectedEmail.leadData?.message || selectedEmail.imapData?.bodyText || selectedEmail.preview || 'Sense missatge'}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReply(selectedEmail)}
                  type="button"
                  className="flex-1 px-4 py-2 rounded-xl text-white shadow-lg transition-colors font-medium"
                >
                  ↩️ Respondre
                </button>
                <button
                  onClick={() => setShowQuote(true)}
                  type="button"
                  className="px-4 py-2 rounded-xl border transition-colors"
                >
                  📄 Pressupost
                </button>
                {selectedEmail.leadData?.phone && (
                  <>
                    <a
                      href={`https://wa.me/${selectedEmail.leadData.phone.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl border transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                    <a
                      href={`tel:${selectedEmail.leadData.phone}`}
                      className="px-4 py-2 rounded-xl border transition-colors"
                    >
                      📞 Trucar
                    </a>
                  </>
                )}
                {selectedEmail.type === 'lead' && (
                  <button
                    onClick={() => router.push(`/admin/leads/${selectedEmail.id}`)}
                    type="button"
                    className="px-4 py-2 border rounded-xl transition-colors"
                  >
                    📋 Veure lead
                  </button>
                )}
                {selectedEmail.type === 'imap' && activeTab !== 'trash' && (
                  <>
                    <button
                      onClick={() => handleImportLeadFromEmail(selectedEmail)}
                      type="button"
                      className="px-4 py-2 border rounded-xl transition-colors"
                    >
                      ➕ Crear/actualitzar lead
                    </button>
                    <button
                      onClick={() => handleMoveToTrash(selectedEmail)}
                      type="button"
                      className="px-4 py-2 border rounded-xl transition-colors"
                    >
                      🗑️ Paperera
                    </button>
                  </>
                )}
                {selectedEmail.type === 'imap' && activeTab === 'trash' && (
                  <>
                    <button
                      onClick={() => handleRestoreEmail(selectedEmail)}
                      type="button"
                      className="px-4 py-2 border rounded-xl transition-colors"
                    >
                      ↩️ Restaurar
                    </button>
                    <button
                      onClick={() => handleDeletePermanently(selectedEmail)}
                      type="button"
                      className="px-4 py-2 border rounded-xl transition-colors"
                    >
                      ❌ Eliminar permanent
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl">📬</span>
              <p className="mt-4">Selecciona un missatge per veure&apos;l</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose modal */}
      {showCompose && (
        <ComposeModal
          replyTo={replyTo}
          packOptions={quotePacks}
          onClose={() => {
            setShowCompose(false);
            setReplyTo(null);
          }}
        />
      )}

      <ConfirmDialog {...dialogProps} />

      {showQuote && selectedEmail && (
        <QuoteModal
          target={selectedEmail}
          packOptions={quotePacks}
          onClose={() => setShowQuote(false)}
          onSent={(message) => setFlashMessage({ type: 'success', text: message })}
        />
      )}
    </div>
  );
}








