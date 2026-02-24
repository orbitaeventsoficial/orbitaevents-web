'use client';

import { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { getEventLabel, formatDateShort, formatDateTimeFull, formatDateSimple, DEFAULT_LOCALE } from '@/lib/constants';
import { log } from '@/lib/logger';

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  eventType: string | null;
  status: string;
  preferredLocale: string | null;
  interestedPackId: string | null;
  interestedExtras: string[];
  budget: string | null;
  guestCount: number | null;
  eventDate: Date | null;
  eventLocation: string | null;
  createdAt: Date;
}

interface ImapEmail {
  id: string;
  uid: number;
  from: { name: string; address: string };
  subject: string;
  date: Date;
  bodyText: string;
  bodyHtml: string;
  isRead: boolean;
}

interface UnifiedEmail {
  id: string;
  type: 'lead' | 'imap';
  from: string;
  fromName: string;
  subject: string;
  preview: string;
  date: Date;
  read: boolean;
  leadData?: LeadData;
  imapData?: ImapEmail;
}

interface Stats {
  totalLeads: number;
  unreadLeads: number;
  todayLeads: number;
}

interface QuotePackOption {
  id: string;
  label: string;
  price: number;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-300',
  CONTACTED: 'bg-yellow-500/20 text-yellow-300',
  QUOTE_SENT: 'bg-purple-500/20 text-purple-300',
  NEGOTIATING: 'bg-orange-500/20 text-orange-300',
  WON: 'bg-emerald-500/20 text-emerald-300',
  LOST: 'bg-rose-500/20 text-rose-300',
};

export default function InboxClient({
  initialLeads,
  stats,
  imapConfigured,
  quotePacks,
}: {
  initialLeads: LeadData[];
  stats: Stats;
  imapConfigured: boolean;
  quotePacks: QuotePackOption[];
}) {
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'leads' | 'emails'>('leads');
  const [imapEmails, setImapEmails] = useState<ImapEmail[]>([]);
  const [imapUnread, setImapUnread] = useState(0);
  const [loadingImap, setLoadingImap] = useState(false);
  const [imapError, setImapError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<UnifiedEmail | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [replyTo, setReplyTo] = useState<UnifiedEmail | null>(null);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);

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
      const params = new URLSearchParams({ limit: '50', _t: String(Date.now()) });
      const res = await fetch(`/api/admin/inbox/messages?${params}`, { cache: 'no-store' });
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

  useEffect(() => {
    if (!imapConfigured) return;
    if (activeTab === 'leads') return;
    if (imapEmails.length > 0) return;
    loadImapEmails();
  }, [imapConfigured, activeTab, imapEmails.length, loadImapEmails]);

  // Filtrar emails
  const deferredQuery = useDeferredValue(searchQuery);
  const queryLower = deferredQuery.trim().toLowerCase();
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      if (activeTab === 'leads' && email.type !== 'lead') return false;
      if (activeTab === 'emails' && email.type !== 'imap') return false;
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
  }, [emails, activeTab, filter, queryLower]);

  function handleReply(email: UnifiedEmail) {
    setReplyTo(email);
    setShowCompose(true);
  }

  async function handleSelectEmail(email: UnifiedEmail) {
    setSelectedEmail(email);

    if (email.type !== 'imap' || !email.imapData?.uid) return;

    setLoadingSelected(true);
    try {
      const res = await fetch(`/api/admin/inbox/messages/${email.imapData.uid}`, { cache: 'no-store' });
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
    } catch {
      // Ignore detail errors to keep inbox responsive.
    } finally {
      setLoadingSelected(false);
    }
  }

  async function handleImportLeadFromEmail(email: UnifiedEmail) {
    if (email.type !== 'imap' || !email.imapData?.uid) return;

    try {
      const res = await fetch(`/api/admin/inbox/messages/${email.imapData.uid}/lead`, {
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
        setFlashMessage({ type: 'error', text: data?.error || 'No s’ha pogut importar el lead' });
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
    } catch {
      setFlashMessage({ type: 'error', text: 'Error important email a lead' });
    }
  }

  async function handleDeleteImapEmail(email: UnifiedEmail) {
    if (email.type !== 'imap' || !email.imapData?.uid) return;
    if (!confirm('Segur que vols eliminar aquest email?')) return;

    try {
      const res = await fetch(`/api/admin/inbox/messages/${email.imapData.uid}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setFlashMessage({ type: 'error', text: data?.error || 'No s’ha pogut eliminar l’email' });
        return;
      }

      setImapEmails((prev) => prev.filter((item) => item.uid !== email.imapData!.uid));
      setSelectedEmail((prev) => (prev?.id === email.id ? null : prev));
      setImapUnread((prev) => Math.max(0, prev - (email.read ? 0 : 1)));
      setFlashMessage({ type: 'success', text: 'Email eliminat correctament' });
    } catch {
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
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            }`}
          >
            📬 Tot ({emails.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'leads' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            }`}
          >
            📋 Entrades web ({initialLeads.length})
          </button>
          {imapConfigured && (
            <button
              onClick={() => setActiveTab('emails')}
              type="button"
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'emails' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              📧 Emails ({imapEmails.length})
              {imapUnread > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full">
                  {imapUnread}
                </span>
              )}
            </button>
          )}
        </div>

        <hr className="my-4" />

        <nav className="space-y-1">
          <button
            onClick={() => setFilter('all')}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              filter === 'all' ? 'bg-slate-700/50 text-slate-200' : 'text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            Tots
          </button>
          <button
            onClick={() => setFilter('unread')}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              filter === 'unread' ? 'bg-slate-700/50 text-slate-200' : 'text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            🔵 No llegits ({totalUnread})
          </button>
        </nav>

        {imapConfigured && (
          <div className="mt-4 p-3 border rounded-lg">
            <p className="text-sm font-medium">Només Òrbita</p>
            <p className="text-xs mt-1">
              Es mostren només emails de <span className="">orbitaevents.com</span>
            </p>
          </div>
        )}

        {imapConfigured && (
          <button
            onClick={loadImapEmails}
            disabled={loadingImap}
            type="button"
            className="w-full mt-4 px-3 py-2 border rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loadingImap ? '⏳ Carregant...' : '🔄 Actualitzar'}
          </button>
        )}

        {imapError && (
          <div className="mt-4 p-3 border rounded-lg">
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
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:ring-1"
            />
          </div>
        </div>

        {flashMessage && (
          <div
            className={`mx-3 mt-3 rounded-lg border px-3 py-2 text-xs ${
              flashMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
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
          {loadingImap && imapEmails.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4" />
              <p>Carregant emails...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-4xl">📭</span>
              <p className="mt-2">No hi ha missatges</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <button
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                type="button"
                className={`w-full text-left p-4 border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors ${
                  selectedEmail?.id === email.id ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500' : ''
                } ${!email.read ? 'bg-blue-500/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!email.read && <span className="w-2 h-2 rounded-full flex-shrink-0" />}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        email.type === 'lead' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {email.type === 'lead' ? 'Entrada web' : 'Correu IMAP'}
                      </span>
                      {!email.read && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded">
                          Nou
                        </span>
                      )}
                      <p className={`text-sm truncate ${!email.read ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>
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
                      selectedEmail.type === 'lead' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {selectedEmail.type === 'lead' ? '📋 Entrada web' : '📧 Correu IMAP'}
                    </span>
                    {selectedEmail.leadData?.status && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[selectedEmail.leadData.status] || 'bg-slate-700/50 text-slate-400'}`}>
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
                    className="p-4 rounded-lg border"
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
                {selectedEmail.type === 'imap' && (
                  <>
                    <button
                      onClick={() => handleImportLeadFromEmail(selectedEmail)}
                      type="button"
                      className="px-4 py-2 border rounded-xl transition-colors"
                    >
                      ➕ Crear/actualitzar lead
                    </button>
                    <button
                      onClick={() => handleDeleteImapEmail(selectedEmail)}
                      type="button"
                      className="px-4 py-2 border rounded-xl transition-colors"
                    >
                      🗑️ Eliminar email
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

// Compose Modal Component
function ComposeModal({
  replyTo,
  packOptions,
  onClose,
}: {
  replyTo: UnifiedEmail | null;
  packOptions: QuotePackOption[];
  onClose: () => void;
}) {
  const FALLBACK_OPTIONS: QuotePackOption[] = [
    { id: 'party-starter', label: 'Party Starter', price: 350 },
    { id: 'party-machine', label: 'Party Machine', price: 400 },
    { id: 'vip-experience', label: 'VIP Experience', price: 700 },
    { id: 'boda-signature', label: 'Boda Signature', price: 800 },
    { id: 'corporate-event', label: 'Corporate Event', price: 850 },
  ];
  const PACK_OPTIONS = packOptions.length > 0 ? packOptions : FALLBACK_OPTIONS;
  const initialPack = PACK_OPTIONS[0];
  const [to, setTo] = useState(replyTo?.from || '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [locale] = useState((replyTo?.leadData?.preferredLocale || 'ca').toLowerCase());
  const [attachQuote, setAttachQuote] = useState(false);
  const [quotePackId, setQuotePackId] = useState(initialPack.id);
  const [quotePrice, setQuotePrice] = useState(initialPack.price);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSend() {
    if (!to || !subject || !body) return;

    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body,
          replyToId: replyTo?.leadData?.id,
          locale,
          quote: attachQuote
            ? {
                packId: quotePackId,
                price: Number(quotePrice),
              }
            : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Error enviant email');
        setSending(false);
        return;
      }

      setSuccess('Email enviat correctament');
      setSent(true);
      setSending(false);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      log.error('Error enviant correu', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Temps d\'espera esgotat. Intenta-ho de nou.');
      } else {
        setError('Error enviant email');
      }
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="presentation">
      <div
        className="border rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 id="compose-title" className="text-lg font-semibold">
            {replyTo ? `↩️ Respondre a ${replyTo.fromName}` : '✏️ Nou email'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Tancar modal"
            className="p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Per a</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border focus:ring-1"
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assumpte</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border focus:ring-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Missatge</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 rounded-xl border focus:ring-1 resize-none"
              placeholder="Escriu el teu missatge..."
            />
          </div>
          <div className="rounded-xl border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={attachQuote}
                onChange={(e) => setAttachQuote(e.target.checked)}
              />
              Adjuntar pressupost personalitzat
            </label>
            {attachQuote && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs mb-1">Pack</label>
                  <select
                    value={quotePackId}
                    onChange={(e) => {
                      const next = PACK_OPTIONS.find((p) => p.id === e.target.value);
                      setQuotePackId(e.target.value);
                      if (next) setQuotePrice(next.price);
                    }}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                  >
                    {PACK_OPTIONS.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Preu base (€)</label>
                  <input
                    type="number"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" aria-live="polite">
          {error && <span className="text-xs mr-auto" role="alert">{error}</span>}
          {success && <span className="text-xs mr-auto" role="status">{success}</span>}
          <button onClick={onClose} type="button" className="px-4 py-2">Cancel·lar</button>
          <button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body || (attachQuote && quotePrice <= 0)}
            type="button"
            aria-busy={sending}
            className={`px-6 py-2 rounded-xl font-medium ${
              sent ? 'bg-emerald-500 text-white' :
              sending ? 'bg-slate-600 text-slate-400' :
              'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500'
            }`}
          >
            {sent ? '✓ Enviat!' : sending ? 'Enviant...' : '📤 Envia'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuoteModal({
  target,
  packOptions,
  onClose,
  onSent,
}: {
  target: UnifiedEmail;
  packOptions: QuotePackOption[];
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const FALLBACK_OPTIONS: QuotePackOption[] = [
    { id: 'party-starter', label: 'Party Starter', price: 350 },
    { id: 'party-machine', label: 'Party Machine', price: 400 },
    { id: 'vip-experience', label: 'VIP Experience', price: 700 },
    { id: 'boda-signature', label: 'Boda Signature', price: 800 },
    { id: 'corporate-event', label: 'Corporate Event', price: 850 },
  ];
  const PACK_OPTIONS = packOptions.length > 0 ? packOptions : FALLBACK_OPTIONS;

  const initialPack = PACK_OPTIONS[0];
  const [packId, setPackId] = useState(initialPack.id);
  const [price, setPrice] = useState(initialPack.price);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipient = target.leadData?.email || target.imapData?.from.address || target.from;
  const leadId = target.leadData?.id;

  async function handleSendQuote() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/emails/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          to: recipient,
          packId,
          price: Number(price),
          customMessage,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Error enviant pressupost');
        setSending(false);
        return;
      }

      onSent(`Pressupost enviat (${data.quoteNumber}) a ${recipient}`);
      onClose();
    } catch {
      setError('Error enviant pressupost');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="presentation">
      <div className="border rounded-2xl shadow-xl max-w-xl w-full" role="dialog" aria-modal="true" aria-labelledby="quote-title">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 id="quote-title" className="text-lg font-semibold">📄 Pressupost personalitzat</h2>
          <button onClick={onClose} type="button" className="p-2 rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">Destinatari</label>
            <input value={recipient} disabled className="w-full px-4 py-2 rounded-xl border text-sm" />
          </div>
          <div>
            <label className="block text-sm mb-1">Pack</label>
            <select
              value={packId}
              onChange={(e) => {
                const next = PACK_OPTIONS.find((p) => p.id === e.target.value);
                setPackId(e.target.value);
                if (next) setPrice(next.price);
              }}
              className="w-full px-4 py-2 rounded-xl border text-sm"
            >
              {PACK_OPTIONS.map((pack) => (
                <option key={pack.id} value={pack.id}>{pack.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Preu base (€)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-xl border text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Missatge personalitzat</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-xl border text-sm"
              placeholder="Detalls per al client..."
            />
          </div>
          {error && <p className="text-xs" role="alert">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose} type="button" className="px-4 py-2">Cancel·lar</button>
          <button
            onClick={handleSendQuote}
            disabled={sending || !recipient || !packId || price <= 0}
            type="button"
            className="px-6 py-2 rounded-xl text-white disabled:opacity-50"
          >
            {sending ? 'Enviant...' : 'Envia pressupost'}
          </button>
        </div>
      </div>
    </div>
  );
}

