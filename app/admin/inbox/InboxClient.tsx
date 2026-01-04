'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { EVENT_TYPE_LABELS } from '@/lib/constants/labels';
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

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  QUOTE_SENT: 'bg-purple-100 text-purple-700',
  NEGOTIATING: 'bg-orange-100 text-orange-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
};

export default function InboxClient({ 
  initialLeads, 
  stats,
  imapConfigured 
}: { 
  initialLeads: LeadData[]; 
  stats: Stats;
  imapConfigured: boolean;
}) {
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState<'all' | 'leads' | 'emails'>('all');
  const [emails, setEmails] = useState<UnifiedEmail[]>([]);
  const [imapEmails, setImapEmails] = useState<ImapEmail[]>([]);
  const [imapUnread, setImapUnread] = useState(0);
  const [loadingImap, setLoadingImap] = useState(false);
  const [imapError, setImapError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<UnifiedEmail | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<UnifiedEmail | null>(null);

  // Convertir leads a format unificat
  useEffect(() => {
    const leadEmails: UnifiedEmail[] = initialLeads.map(lead => ({
      id: lead.id,
      type: 'lead' as const,
      from: lead.email,
      fromName: lead.name,
      subject: `📋 ${EVENT_TYPE_LABELS[lead.eventType || ''] || 'Sol·licitud'}`,
      preview: lead.message || 'Sense missatge',
      date: new Date(lead.createdAt),
      read: lead.status !== 'NEW',
      leadData: lead,
    }));

    const imapUnified: UnifiedEmail[] = imapEmails.map(email => ({
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

    // Combinar i ordenar per data
    const combined = [...leadEmails, ...imapUnified].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setEmails(combined);
  }, [initialLeads, imapEmails]);

  // Carregar emails IMAP
  useEffect(() => {
    if (imapConfigured) {
      loadImapEmails();
    }
  }, [imapConfigured]);

  async function loadImapEmails() {
    setLoadingImap(true);
    setImapError(null);

    try {
      const res = await fetch('/api/admin/inbox/messages?limit=50');
      const data = await res.json();

      if (data.ok) {
        setImapEmails(data.emails || []);
        setImapUnread(data.unread || 0);
      } else {
        setImapError(data.error || 'Error carregant emails');
      }
    } catch (error) {
      setImapError('Error de connexió');
    } finally {
      setLoadingImap(false);
    }
  }

  // Filtrar emails
  const filteredEmails = emails.filter(email => {
    // Filtre per tab
    if (activeTab === 'leads' && email.type !== 'lead') return false;
    if (activeTab === 'emails' && email.type !== 'imap') return false;

    // Filtre per llegit/no llegit
    if (filter === 'unread' && email.read) return false;

    // Filtre per cerca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        email.from.toLowerCase().includes(query) ||
        email.fromName.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        email.preview.toLowerCase().includes(query)
      );
    }
    return true;
  });

  function handleReply(email: UnifiedEmail) {
    setReplyTo(email);
    setShowCompose(true);
  }

  function formatDate(date: Date) {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ahir';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('ca-ES', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
    }
  }

  const totalUnread = stats.unreadLeads + imapUnread;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar filters */}
      <aside className="w-56 border-r border-slate-200 bg-slate-50 p-4 hidden lg:block">
        {/* Tabs */}
        <div className="space-y-1 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📬 Tot ({emails.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'leads' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📋 Leads web ({initialLeads.length})
          </button>
          {imapConfigured && (
            <button
              onClick={() => setActiveTab('emails')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'emails' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📧 Emails ({imapEmails.length})
              {imapUnread > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {imapUnread}
                </span>
              )}
            </button>
          )}
        </div>

        <hr className="my-4 border-slate-200" />

        {/* Filtres */}
        <nav className="space-y-1">
          <button
            onClick={() => setFilter('all')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              filter === 'all' ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tots
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              filter === 'unread' ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🔵 No llegits ({totalUnread})
          </button>
        </nav>

        {/* Refresh button */}
        {imapConfigured && (
          <button
            onClick={loadImapEmails}
            disabled={loadingImap}
            className="w-full mt-4 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {loadingImap ? '⏳ Carregant...' : '🔄 Actualitzar'}
          </button>
        )}

        {/* Error IMAP */}
        {imapError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{imapError}</p>
          </div>
        )}
      </aside>

      {/* Email list */}
      <div className="w-96 border-r border-slate-200 flex flex-col bg-white">
        {/* Search */}
        <div className="p-3 border-b border-slate-200">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cercar..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingImap && imapEmails.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p>Carregant emails...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <span className="text-4xl">📭</span>
              <p className="mt-2">No hi ha missatges</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  selectedEmail?.id === email.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''
                } ${!email.read ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!email.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        email.type === 'lead' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {email.type === 'lead' ? 'Lead' : 'Email'}
                      </span>
                      <p className={`text-sm truncate ${!email.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {email.fromName}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 truncate mt-0.5">{email.subject}</p>
                    <p className="text-xs text-slate-400 truncate mt-1">{email.preview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-slate-400">{formatDate(email.date)}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Email detail */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedEmail.type === 'lead' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedEmail.type === 'lead' ? '📋 Lead del formulari' : '📧 Email rebut'}
                    </span>
                    {selectedEmail.leadData?.status && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[selectedEmail.leadData.status] || 'bg-slate-100'}`}>
                        {selectedEmail.leadData.status}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">
                      {selectedEmail.fromName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{selectedEmail.fromName}</p>
                      <p className="text-sm text-slate-500">{selectedEmail.from}</p>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-slate-400">
                  {new Date(selectedEmail.date).toLocaleString('ca-ES')}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Lead details */}
              {selectedEmail.leadData && (
                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-slate-900 mb-4">📋 Detalls de la sol·licitud</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Tipus d&apos;event:</span>
                      <p className="font-medium">{EVENT_TYPE_LABELS[selectedEmail.leadData.eventType || ''] || 'No especificat'}</p>
                    </div>
                    {selectedEmail.leadData.eventDate && (
                      <div>
                        <span className="text-slate-500">Data:</span>
                        <p className="font-medium">{new Date(selectedEmail.leadData.eventDate).toLocaleDateString('ca-ES')}</p>
                      </div>
                    )}
                    {selectedEmail.leadData.guestCount && (
                      <div>
                        <span className="text-slate-500">Convidats:</span>
                        <p className="font-medium">{selectedEmail.leadData.guestCount} persones</p>
                      </div>
                    )}
                    {selectedEmail.leadData.budget && (
                      <div>
                        <span className="text-slate-500">Pressupost:</span>
                        <p className="font-medium">{selectedEmail.leadData.budget}</p>
                      </div>
                    )}
                    {selectedEmail.leadData.eventLocation && (
                      <div>
                        <span className="text-slate-500">Ubicació:</span>
                        <p className="font-medium">{selectedEmail.leadData.eventLocation}</p>
                      </div>
                    )}
                    {selectedEmail.leadData.phone && (
                      <div>
                        <span className="text-slate-500">Telèfon:</span>
                        <p className="font-medium">
                          <a href={`tel:${selectedEmail.leadData.phone}`} className="text-amber-600 hover:underline">
                            {selectedEmail.leadData.phone}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message body */}
              <div className="prose prose-slate max-w-none">
                <h4 className="text-sm font-medium text-slate-500 mb-2">Missatge:</h4>
                {selectedEmail.imapData?.bodyHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.imapData.bodyHtml) }}
                    className="text-slate-700 bg-white p-4 rounded-lg border border-slate-200"
                  />
                ) : (
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedEmail.leadData?.message || selectedEmail.imapData?.bodyText || selectedEmail.preview || 'Sense missatge'}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReply(selectedEmail)}
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                >
                  ↩️ Respondre
                </button>
                {selectedEmail.leadData?.phone && (
                  <>
                    <a
                      href={`https://wa.me/${selectedEmail.leadData.phone.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                    <a
                      href={`tel:${selectedEmail.leadData.phone}`}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      📞 Trucar
                    </a>
                  </>
                )}
                {selectedEmail.type === 'lead' && (
                  <button
                    onClick={() => router.push(`/admin/leads/${selectedEmail.id}`)}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white transition-colors"
                  >
                    📋 Veure lead
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
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
          onClose={() => {
            setShowCompose(false);
            setReplyTo(null);
          }}
        />
      )}
    </div>
  );
}

// Compose Modal Component
function ComposeModal({ replyTo, onClose }: { replyTo: UnifiedEmail | null; onClose: () => void }) {
  const [to, setTo] = useState(replyTo?.from || '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!to || !subject || !body) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body,
          replyToId: replyTo?.leadData?.id,
        }),
      });

      if (res.ok) {
        setSent(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error enviant email:', error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {replyTo ? `↩️ Respondre a ${replyTo.fromName}` : '✏️ Nou email'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Per a</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assumpte</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Missatge</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
              placeholder="Escriu el teu missatge..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-slate-600">Cancel·lar</button>
          <button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body}
            className={`px-6 py-2 rounded-lg font-medium ${
              sent ? 'bg-green-500 text-white' : 
              sending ? 'bg-slate-300 text-slate-500' : 
              'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            {sent ? '✓ Enviat!' : sending ? 'Enviant...' : '📤 Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
