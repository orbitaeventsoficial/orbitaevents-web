import DOMPurify from 'dompurify';
import Link from 'next/link';
import { DEFAULT_LOCALE, formatDateShort, formatDateSimple, formatDateTimeFull, getEventLabel } from '@/lib/constants';
import type { LeadData, UnifiedEmail } from './inbox-types';
import { getLeadStatusTone } from './inbox-types';
import { ADMIN_INBOX_HELP, helpAttrs } from '../components/adminHelpContent';
import InboxLeadContext from './InboxLeadContext';
import CommSummaryPanel from './CommSummaryPanel';

function getInboxScopeLabel(activeTab: 'all' | 'leads' | 'emails' | 'trash') {
  switch (activeTab) {
    case 'leads':
      return 'Entrades web';
    case 'emails':
      return 'Correus IMAP';
    case 'trash':
      return 'Paperera';
    default:
      return 'Safata unificada';
  }
}

function getInboxFilterLabel(filter: 'all' | 'unread') {
  return filter === 'unread' ? 'No llegits' : 'Tots els missatges';
}

export function formatInboxEmailDate(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString(DEFAULT_LOCALE, { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Ahir';
  }
  if (diffDays < 7) {
    return d.toLocaleDateString(DEFAULT_LOCALE, { weekday: 'short' });
  }
  return formatDateShort(d);
}

export function InboxSidebar({
  activeTab,
  setActiveTab,
  filter,
  setFilter,
  emailsCount,
  leadsCount,
  imapConfigured,
  imapEmailsCount,
  imapUnread,
  trashCount,
  totalUnread,
  loadingImap,
  loadingTrash,
  imapError,
  loadImapEmails,
  loadTrashEmails,
}: {
  activeTab: 'all' | 'leads' | 'emails' | 'trash';
  setActiveTab: (value: 'all' | 'leads' | 'emails' | 'trash') => void;
  filter: 'all' | 'unread';
  setFilter: (value: 'all' | 'unread') => void;
  emailsCount: number;
  leadsCount: number;
  imapConfigured: boolean;
  imapEmailsCount: number;
  imapUnread: number;
  trashCount: number;
  totalUnread: number;
  loadingImap: boolean;
  loadingTrash: boolean;
  imapError: string | null;
  loadImapEmails: () => void;
  loadTrashEmails: () => void;
}) {
  return (
    <aside className="hidden w-56 border-r p-4 lg:block" {...helpAttrs(ADMIN_INBOX_HELP.sidebar)}>
      <div className="mb-4 rounded-2xl border p-3 admin-tone-soft-info">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] admin-tone-text-info">Triage</p>
        <div className="mt-3 grid gap-2">
          <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">No llegits</p>
            <p className="mt-1 text-xl font-semibold text-white/90">{totalUnread}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Canal actiu</p>
            <p className="mt-1 text-sm font-medium text-white/80">{getInboxScopeLabel(activeTab)}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-1">
        <button onClick={() => setActiveTab('all')} type="button" className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${activeTab === 'all' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'}`}>
          📬 Tot ({emailsCount})
        </button>
        <button onClick={() => setActiveTab('leads')} type="button" className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${activeTab === 'leads' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'}`}>
          📋 Entrades web ({leadsCount})
        </button>
        {imapConfigured && (
          <>
            <button onClick={() => setActiveTab('emails')} type="button" className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${activeTab === 'emails' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'}`}>
              📧 Emails ({imapEmailsCount})
              {imapUnread > 0 && <span className="ml-2 rounded-full px-2 py-0.5 text-xs">{imapUnread}</span>}
            </button>
            <button onClick={() => setActiveTab('trash')} type="button" className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${activeTab === 'trash' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'}`}>
              🗑️ Paperera {trashCount > 0 && `(${trashCount})`}
            </button>
          </>
        )}
      </div>

      <hr className="my-4" />

      <nav className="space-y-1">
        <button onClick={() => setFilter('all')} type="button" className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${filter === 'all' ? 'admin-tone-soft-info admin-tone-text-info' : 'text-white/40 hover:bg-white/5'}`}>
          Tots
        </button>
        <button onClick={() => setFilter('unread')} type="button" className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${filter === 'unread' ? 'admin-tone-soft-info admin-tone-text-info' : 'text-white/40 hover:bg-white/5'}`}>
          🔵 No llegits ({totalUnread})
        </button>
      </nav>

      {imapConfigured && (
        <div className="mt-4 rounded-xl border p-3">
          <p className="text-sm font-medium">Només Òrbita</p>
          <p className="mt-1 text-xs">Es mostren només emails de <span>orbitaevents.com</span></p>
        </div>
      )}

      {imapConfigured && (
        <button onClick={activeTab === 'trash' ? loadTrashEmails : loadImapEmails} disabled={loadingImap || loadingTrash} type="button" className="mt-4 w-full rounded-xl border px-3 py-2 text-sm transition-colors disabled:opacity-50">
          {loadingImap || loadingTrash ? '⏳ Carregant...' : '🔄 Actualitzar'}
        </button>
      )}

      {imapError && (
        <div className="mt-4 rounded-xl border p-3">
          <p className="text-xs">{imapError}</p>
        </div>
      )}
    </aside>
  );
}

export function InboxListPane({
  activeTab,
  filter,
  searchQuery,
  setSearchQuery,
  flashMessage,
  clearFlashMessage,
  loadingImap,
  loadingTrash,
  imapEmailsCount,
  trashEmailsCount,
  filteredEmails,
  selectedEmail,
  handleSelectEmail,
}: {
  activeTab: 'all' | 'leads' | 'emails' | 'trash';
  filter: 'all' | 'unread';
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  flashMessage: { type: 'success' | 'error'; text: string } | null;
  clearFlashMessage: () => void;
  loadingImap: boolean;
  loadingTrash: boolean;
  imapEmailsCount: number;
  trashEmailsCount: number;
  filteredEmails: UnifiedEmail[];
  selectedEmail: UnifiedEmail | null;
  handleSelectEmail: (email: UnifiedEmail) => void;
}) {
  return (
    <div className="flex w-96 flex-col border-r" {...helpAttrs(ADMIN_INBOX_HELP.list)}>
      <div className="border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Inbox Workspace</p>
            <h2 className="mt-1 text-base font-semibold text-white/90">{getInboxScopeLabel(activeTab)}</h2>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{getInboxFilterLabel(filter)}</p>
            <p className="mt-1 text-sm font-medium text-white/80">{filteredEmails.length} resultats</p>
          </div>
        </div>
      </div>

      <div className="border-b p-3" {...helpAttrs(ADMIN_INBOX_HELP.search)}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
          <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cercar..." aria-label="Cercar emails" className="ap-input py-2 pl-10 pr-4 text-sm" />
        </div>
      </div>

      {flashMessage && (
        <div className={`mx-3 mt-3 rounded-xl border px-3 py-2 text-xs ${flashMessage.type === 'success' ? 'admin-tone-soft-success admin-tone-border-success admin-tone-text-success' : 'admin-tone-soft-danger admin-tone-border-danger admin-tone-text-danger'}`} role={flashMessage.type === 'error' ? 'alert' : 'status'} aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <span>{flashMessage.text}</span>
            <button onClick={clearFlashMessage} type="button" aria-label="Tancar missatge" className="text-xs">✕</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {(loadingImap && imapEmailsCount === 0) || (loadingTrash && trashEmailsCount === 0) ? (
          <div className="p-8 text-center"><div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" /><p>Carregant emails...</p></div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-2 text-sm font-semibold text-white/85">No hi ha missatges en aquesta vista</p>
            <p className="mt-1 text-xs admin-tone-text-slate">Canvia el filtre, revisa un altre canal o recarrega per buscar activitat nova.</p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <button key={email.id} onClick={() => handleSelectEmail(email)} type="button" className={`w-full border-b border-white/5 p-4 text-left transition-colors hover:bg-white/[0.03] ${selectedEmail?.id === email.id ? 'admin-tone-bg-info border-l-4 admin-tone-border-info' : ''} ${!email.read ? 'admin-tone-bg-info' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2" {...helpAttrs(ADMIN_INBOX_HELP.messageActions)}>
                    {!email.read && <span className="h-2 w-2 flex-shrink-0 rounded-full" />}
                    <span className={`rounded px-1.5 py-0.5 text-xs ${email.type === 'lead' ? 'admin-tone-bg-violet admin-tone-text-violet' : 'admin-tone-bg-success admin-tone-text-success'}`}>{email.type === 'lead' ? 'Entrada web' : 'Correu IMAP'}</span>
                    {!email.read && <span className="rounded px-1.5 py-0.5 text-[10px]">Nou</span>}
                    <p className={`truncate text-sm ${!email.read ? 'font-semibold text-white/90' : 'text-white/60'}`}>{email.fromName}</p>
                  </div>
                  <p className="mt-0.5 truncate text-sm">{email.subject}</p>
                  <p className="mt-1 truncate text-xs">{email.preview || email.subject}</p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1"><span className="text-xs">{formatInboxEmailDate(email.date)}</span></div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function InboxDetailPane({
  selectedEmail,
  loadingSelected,
  activeTab,
  handleReply,
  handleOpenQuote,
  handleOpenLead,
  handleImportLeadFromEmail,
  handleMoveToTrash,
  handleRestoreEmail,
  handleDeletePermanently,
}: {
  selectedEmail: UnifiedEmail | null;
  loadingSelected: boolean;
  activeTab: 'all' | 'leads' | 'emails' | 'trash';
  handleReply: (email: UnifiedEmail) => void;
  handleOpenQuote: () => void;
  handleOpenLead: (lead: Pick<LeadData, 'id' | 'customerId'>) => void;
  handleImportLeadFromEmail: (email: UnifiedEmail) => void;
  handleMoveToTrash: (email: UnifiedEmail) => void;
  handleRestoreEmail: (email: UnifiedEmail) => void;
  handleDeletePermanently: (email: UnifiedEmail) => void;
}) {
  if (!selectedEmail) {
    return <div className="flex flex-1 items-center justify-center"><div className="text-center"><span className="text-6xl">📬</span><p className="mt-4 text-sm font-semibold text-white/85">Selecciona un missatge per veure&apos;l</p><p className="mt-2 text-xs text-white/50">La columna dreta s&apos;activa quan tries una conversa o una entrada web.</p></div></div>;
  }

  const actionHint = activeTab === 'trash'
    ? { title: 'Acció recomanada', body: 'Decideix si aquest correu s\'ha de restaurar o eliminar definitivament.' }
    : { title: 'Acció recomanada', body: 'Converteix aquest correu en lead si és comercial; si no, respon o arxiva ràpid.' };
  const selectedLead = selectedEmail.type === 'lead' ? selectedEmail.leadData ?? null : null;

  return (
    <div className="flex flex-1 flex-col" {...helpAttrs(ADMIN_INBOX_HELP.detail)}>
      <div className="border-b p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded px-2 py-1 text-xs ${selectedEmail.type === 'lead' ? 'admin-tone-bg-violet admin-tone-text-violet' : 'admin-tone-bg-success admin-tone-text-success'}`}>{selectedEmail.type === 'lead' ? '📋 Entrada web' : '📧 Correu IMAP'}</span>
              {selectedEmail.leadData?.status && <span className={`rounded border px-2 py-1 text-xs font-medium ${getLeadStatusTone(selectedEmail.leadData.status).bg} ${getLeadStatusTone(selectedEmail.leadData.status).text} ${getLeadStatusTone(selectedEmail.leadData.status).border}`}>{selectedEmail.leadData.status}</span>}
            </div>
            <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full font-bold">{selectedEmail.fromName.charAt(0).toUpperCase()}</div>
              <div><p className="font-medium">{selectedEmail.fromName}</p><p className="text-sm">{selectedEmail.from}</p></div>
            </div>
          </div>
          <span className="text-sm">{formatDateTimeFull(selectedEmail.date)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedLead ? (
          <>
            <InboxLeadContext lead={selectedLead} />
            <div className="mb-4">
              <CommSummaryPanel leadId={selectedLead.id} customerId={selectedLead.customerId} />
            </div>
          </>
        ) : (
          <div className="mb-6 rounded-2xl border px-4 py-4 admin-tone-soft-info">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] admin-tone-text-info">{actionHint.title}</p>
            <p className="mt-2 text-sm text-white/85">{actionHint.body}</p>
          </div>
        )}

        {selectedLead && (
          <div className="mb-6 rounded-xl border p-6">
            <h3 className="mb-4 font-semibold">📋 Detalls de la sol·licitud</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span>Tipus d&apos;event:</span><p className="font-medium">{getEventLabel(selectedLead.eventType || '', 'No especificat')}</p></div>
              {selectedLead.eventDate && <div><span>Data:</span><p className="font-medium">{formatDateSimple(selectedLead.eventDate)}</p></div>}
              {selectedLead.guestCount && <div><span>Convidats:</span><p className="font-medium">{selectedLead.guestCount} persones</p></div>}
              {selectedLead.budget && <div><span>Pressupost:</span><p className="font-medium">{selectedLead.budget}</p></div>}
              {selectedLead.eventLocation && <div><span>Ubicació:</span><p className="font-medium">{selectedLead.eventLocation}</p></div>}
              {selectedLead.phone && <div><span>Telèfon:</span><p className="font-medium"><a href={`tel:${selectedLead.phone}`} className="hover:underline">{selectedLead.phone}</a></p></div>}
            </div>
          </div>
        )}

        <div className="prose prose-invert max-w-none">
          <h4 className="mb-2 text-sm font-medium">Missatge:</h4>
          {loadingSelected && selectedEmail.type === 'imap' && <p className="mb-2 text-xs">Carregant contingut complet...</p>}
          {selectedEmail.imapData?.bodyHtml ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.imapData.bodyHtml) }} className="rounded-xl border p-4" />
          ) : (
            <p className="whitespace-pre-wrap">{selectedLead?.message || selectedEmail.imapData?.bodyText || selectedEmail.preview || 'Sense missatge'}</p>
          )}
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex flex-wrap items-center gap-2" {...helpAttrs(ADMIN_INBOX_HELP.messageActions)}>
          <button onClick={() => handleReply(selectedEmail)} type="button" className="ap-btn ap-btn--primary flex-1 px-4 py-2 font-medium">↩️ Respondre</button>
          <button onClick={handleOpenQuote} type="button" className="rounded-xl border px-4 py-2 transition-colors">📄 Pressupost</button>
          {selectedLead?.phone && (
            <>
              <a href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border px-4 py-2 transition-colors">💬 WhatsApp</a>
              <a href={`tel:${selectedLead.phone}`} className="rounded-xl border px-4 py-2 transition-colors">📞 Trucar</a>
            </>
          )}
          {selectedLead && (
            <button
              onClick={() => handleOpenLead(selectedLead)}
              type="button"
              className="rounded-xl border px-4 py-2 transition-colors"
            >
              {selectedLead.customerId ? '👤 Veure client' : '📋 Veure lead'}
            </button>
          )}
          {selectedEmail.type === 'imap' && activeTab !== 'trash' && (
            <>
              <button onClick={() => handleImportLeadFromEmail(selectedEmail)} type="button" className="rounded-xl border px-4 py-2 transition-colors">➕ Crear/actualitzar lead</button>
              <button onClick={() => handleMoveToTrash(selectedEmail)} type="button" className="rounded-xl border px-4 py-2 transition-colors">🗑️ Paperera</button>
            </>
          )}
          {selectedEmail.type === 'imap' && activeTab === 'trash' && (
            <>
              <button onClick={() => handleRestoreEmail(selectedEmail)} type="button" className="rounded-xl border px-4 py-2 transition-colors">↩️ Restaurar</button>
              <button onClick={() => handleDeletePermanently(selectedEmail)} type="button" className="rounded-xl border px-4 py-2 transition-colors">❌ Eliminar permanent</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
