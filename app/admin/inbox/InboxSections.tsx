import DOMPurify from 'dompurify';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  formatDateSimple,
  formatDateTimeFull,
  formatTimeShort,
  formatWeekdayShort,
  formatDateShort,
  getEventLabel,
} from '@/lib/constants';
import type { LeadData, UnifiedEmail } from './inbox-types';
import { getLeadStatusTone } from './inbox-types';
import { ADMIN_INBOX_HELP, helpAttrs } from '../components/adminHelpContent';
import InboxLeadContext from './InboxLeadContext';
import CommSummaryPanel from './CommSummaryPanel';

const AiReplySuggestions = dynamic(() => import('./AiReplySuggestions'), { ssr: false });

function getInboxScopeLabel(activeTab: 'all' | 'leads' | 'emails' | 'trash') {
  switch (activeTab) {
    case 'leads':   return 'Entrades web';
    case 'emails':  return 'Correus IMAP';
    case 'trash':   return 'Paperera';
    default:        return 'Safata unificada';
  }
}

export function formatInboxEmailDate(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return formatTimeShort(d);
  if (diffDays === 1) return 'Ahir';
  if (diffDays < 7) return formatWeekdayShort(d);
  return formatDateShort(d);
}

/* ── Navegació lateral (lg+) ─────────────────────────────────────────────── */
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
  setActiveTab: (v: 'all' | 'leads' | 'emails' | 'trash') => void;
  filter: 'all' | 'unread';
  setFilter: (v: 'all' | 'unread') => void;
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
    <nav className="ix__nav" aria-label="Canals" {...helpAttrs(ADMIN_INBOX_HELP.sidebar)}>
      {/* Resum ràpid */}
      <div className="ix__navsummary">
        <div className="ix__navstat">
          <span className="ix__navstat-label">No llegits</span>
          <span className="ix__navstat-value">{totalUnread}</span>
        </div>
        <div className="ix__navstat">
          <span className="ix__navstat-label">Canal actiu</span>
          <span className="ix__navstat-value--small">{getInboxScopeLabel(activeTab)}</span>
        </div>
      </div>

      {/* Pestanyes de canal */}
      <div className="ix__navgroup">
        <p className="ix__navlabel">Canal</p>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`ix__navitem${activeTab === 'all' ? ' is-on' : ''}`}
        >
          <span>Tot ({emailsCount})</span>
          {totalUnread > 0 && activeTab !== 'all' && (
            <span className="ix__navbadge">{totalUnread}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`ix__navitem${activeTab === 'leads' ? ' is-on' : ''}`}
        >
          <span>Entrades web ({leadsCount})</span>
        </button>
        {imapConfigured && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              className={`ix__navitem${activeTab === 'emails' ? ' is-on' : ''}`}
            >
              <span>Correus ({imapEmailsCount})</span>
              {imapUnread > 0 && <span className="ix__navbadge">{imapUnread}</span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trash')}
              className={`ix__navitem${activeTab === 'trash' ? ' is-on' : ''}`}
            >
              <span>Paperera{trashCount > 0 ? ` (${trashCount})` : ''}</span>
            </button>
          </>
        )}
      </div>

      <div className="ix__navdivider" />

      {/* Filtres de lectura */}
      <div className="ix__navgroup">
        <p className="ix__navlabel">Filtre</p>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`ix__navitem${filter === 'all' ? ' is-on' : ''}`}
        >
          Tots
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`ix__navitem${filter === 'unread' ? ' is-on' : ''}`}
        >
          No llegits ({totalUnread})
        </button>
      </div>

      {imapConfigured && (
        <>
          <div className="ix__navdivider" />
          <div className="ix__navnote">
            <strong>Només Òrbita</strong>
            <br />Es mostren emails de orbitaevents.com
          </div>
          <button
            type="button"
            onClick={activeTab === 'trash' ? loadTrashEmails : loadImapEmails}
            disabled={loadingImap || loadingTrash}
            className="ix__navrefresh"
          >
            {loadingImap || loadingTrash ? 'Carregant...' : '⟳ Actualitzar'}
          </button>
        </>
      )}

      {imapError && (
        <div className="ix__naverror">{imapError}</div>
      )}
    </nav>
  );
}

/* ── Pestanyes mobile (< lg) ─────────────────────────────────────────────── */
export function InboxTabs({
  activeTab,
  setActiveTab,
  emailsCount,
  leadsCount,
  imapConfigured,
  imapEmailsCount,
  imapUnread,
  trashCount,
  totalUnread,
}: {
  activeTab: 'all' | 'leads' | 'emails' | 'trash';
  setActiveTab: (v: 'all' | 'leads' | 'emails' | 'trash') => void;
  emailsCount: number;
  leadsCount: number;
  imapConfigured: boolean;
  imapEmailsCount: number;
  imapUnread: number;
  trashCount: number;
  totalUnread: number;
}) {
  return (
    <div className="ix__tabs" role="tablist" aria-label="Canals">
      <button
        type="button" role="tab"
        onClick={() => setActiveTab('all')}
        className={`ix__tab${activeTab === 'all' ? ' is-on' : ''}`}
      >
        Tot ({emailsCount})
        {totalUnread > 0 && <span className="ix__navbadge">{totalUnread}</span>}
      </button>
      <button
        type="button" role="tab"
        onClick={() => setActiveTab('leads')}
        className={`ix__tab${activeTab === 'leads' ? ' is-on' : ''}`}
      >
        Web ({leadsCount})
      </button>
      {imapConfigured && (
        <>
          <button
            type="button" role="tab"
            onClick={() => setActiveTab('emails')}
            className={`ix__tab${activeTab === 'emails' ? ' is-on' : ''}`}
          >
            IMAP ({imapEmailsCount})
            {imapUnread > 0 && <span className="ix__navbadge">{imapUnread}</span>}
          </button>
          <button
            type="button" role="tab"
            onClick={() => setActiveTab('trash')}
            className={`ix__tab${activeTab === 'trash' ? ' is-on' : ''}`}
          >
            Paperera{trashCount > 0 ? ` (${trashCount})` : ''}
          </button>
        </>
      )}
    </div>
  );
}

/* ── Columna de llista ────────────────────────────────────────────────────── */
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
  setSearchQuery: (v: string) => void;
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
  const isLoading =
    (loadingImap && imapEmailsCount === 0) ||
    (loadingTrash && trashEmailsCount === 0);

  return (
    <div className="ix__list" {...helpAttrs(ADMIN_INBOX_HELP.list)}>
      {/* Capçalera */}
      <div className="ix__listhead">
        <div className="ix__listscope">
          <span className="ix__listscope-label">{getInboxScopeLabel(activeTab)}</span>
          <span className="ix__listscope-title">
            {filter === 'unread' ? 'No llegits' : 'Tots els missatges'}
          </span>
        </div>
        <div className="ix__listcount">
          {filteredEmails.length} resultats
        </div>
      </div>

      {/* Cerca */}
      <div className="ix__search" {...helpAttrs(ADMIN_INBOX_HELP.search)}>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cercar per nom, email, assumpte..."
          aria-label="Cercar missatges"
          className="ix__searchinput"
        />
      </div>

      {/* Flash */}
      {flashMessage && (
        <div
          className={`ix__flash ix__flash--${flashMessage.type}`}
          role={flashMessage.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <span>{flashMessage.text}</span>
          <button
            type="button"
            onClick={clearFlashMessage}
            className="ix__flashclose"
            aria-label="Tancar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Missatges */}
      <div className="ix__messages">
        {isLoading ? (
          <div className="ix__listplaceholder">
            <div className="ix__spin" />
            <p className="ix__listplaceholder-body">Carregant missatges...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="ix__listplaceholder">
            <div className="ix__listplaceholder-icon">📭</div>
            <p className="ix__listplaceholder-title">Cap missatge</p>
            <p className="ix__listplaceholder-body">
              Canvia el filtre o revisa un altre canal per buscar activitat nova.
            </p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <button
              key={email.id}
              type="button"
              onClick={() => handleSelectEmail(email)}
              className={[
                'ix__msgitem',
                selectedEmail?.id === email.id ? 'is-selected' : '',
                !email.read ? 'is-unread' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="ix__msgrow">
                <div className="ix__msginfo">
                  <div className="ix__msgmeta">
                    {!email.read && <span className="ix__msgdot" aria-label="No llegit" />}
                    <span className={`ix__badge ix__badge--${email.type === 'lead' ? 'lead' : 'imap'}`}>
                      {email.type === 'lead' ? 'Web' : 'IMAP'}
                    </span>
                    <span className="ix__msgsender">{email.fromName}</span>
                  </div>
                  <p className="ix__msgsubject">{email.subject}</p>
                  <p className="ix__msgpreview">{email.preview || email.subject}</p>
                </div>
                <div>
                  <span className="ix__msgtime">{formatInboxEmailDate(email.date)}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Panell de detall ─────────────────────────────────────────────────────── */
export function InboxDetailPane({
  selectedEmail,
  loadingSelected,
  activeTab,
  mobileOpen,
  onMobileClose,
  handleReply,
  handleOpenQuote,
  handleOpenLead,
  handleImportLeadFromEmail,
  handleMoveToTrash,
  handleRestoreEmail,
  handleDeletePermanently,
  onApplySuggestion,
}: {
  selectedEmail: UnifiedEmail | null;
  loadingSelected: boolean;
  activeTab: 'all' | 'leads' | 'emails' | 'trash';
  mobileOpen: boolean;
  onMobileClose: () => void;
  handleReply: (email: UnifiedEmail) => void;
  handleOpenQuote: () => void;
  handleOpenLead: (lead: Pick<LeadData, 'id' | 'customerId'>) => void;
  handleImportLeadFromEmail: (email: UnifiedEmail) => void;
  handleMoveToTrash: (email: UnifiedEmail) => void;
  handleRestoreEmail: (email: UnifiedEmail) => void;
  handleDeletePermanently: (email: UnifiedEmail) => void;
  onApplySuggestion?: (text: string) => void;
}) {
  return (
    <div
      className={`ix__detail${mobileOpen ? ' is-open' : ''}`}
      {...helpAttrs(ADMIN_INBOX_HELP.detail)}
    >
      {/* Botó tornar (mobile) */}
      <button type="button" onClick={onMobileClose} className="ix__detailbackbtn">
        ← Tornar a la llista
      </button>

      {!selectedEmail ? (
        <div className="ix__detailblank">
          <div className="ix__detailblank-icon">📬</div>
          <p className="ix__detailblank-title">Selecciona un missatge</p>
          <p className="ix__detailblank-body">
            La columna dreta s&apos;activa quan tries una conversa o una entrada web.
          </p>
        </div>
      ) : (
        <>
          {/* Capçalera del detall */}
          <div className="ix__detailhead">
            <div className="ix__detailheadrow">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ix__detailmeta">
                  <span className={`ix__badge ix__badge--${selectedEmail.type === 'lead' ? 'lead' : 'imap'}`}>
                    {selectedEmail.type === 'lead' ? 'Entrada web' : 'Correu IMAP'}
                  </span>
                  {selectedEmail.leadData?.status && (
                    <span className="ix__statusbadge">
                      {selectedEmail.leadData.status}
                    </span>
                  )}
                </div>
                <h2 className="ix__detailsubject">{selectedEmail.subject}</h2>
                <div className="ix__detailsender">
                  <div className="ix__senderavatar">
                    {selectedEmail.fromName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ix__senderinfo">
                    <p className="ix__sendername">{selectedEmail.fromName}</p>
                    <p className="ix__senderaddr">{selectedEmail.from}</p>
                  </div>
                </div>
              </div>
              <span className="ix__detaildate">
                {formatDateTimeFull(selectedEmail.date)}
              </span>
            </div>
          </div>

          {/* Cos del detall */}
          <div className="ix__detailbody">
            {selectedEmail.type === 'lead' && selectedEmail.leadData ? (
              <>
                <InboxLeadContext lead={selectedEmail.leadData} />
                <div style={{ marginBottom: 16 }}>
                  <CommSummaryPanel
                    leadId={selectedEmail.leadData.id}
                    customerId={selectedEmail.leadData.customerId}
                  />
                </div>
              </>
            ) : (
              <div className="ix__actionhint">
                <p className="ix__actionhint-label">
                  {activeTab === 'trash' ? 'Acció recomanada' : 'Acció recomanada'}
                </p>
                <p className="ix__actionhint-body">
                  {activeTab === 'trash'
                    ? "Decideix si aquest correu s'ha de restaurar o eliminar definitivament."
                    : "Converteix aquest correu en lead si és comercial; si no, respon o arxiva ràpid."}
                </p>
              </div>
            )}

            {selectedEmail.type === 'lead' && selectedEmail.leadData && (
              <div className="ix__leadcard">
                <p className="ix__leadcard-title">Detalls de la sol·licitud</p>
                <div className="ix__leadgrid">
                  <div>
                    <p className="ix__leadfield-label">Tipus d&apos;event</p>
                    <p className="ix__leadfield-value">
                      {getEventLabel(selectedEmail.leadData.eventType || '', 'No especificat')}
                    </p>
                  </div>
                  {selectedEmail.leadData.eventDate && (
                    <div>
                      <p className="ix__leadfield-label">Data</p>
                      <p className="ix__leadfield-value">
                        {formatDateSimple(selectedEmail.leadData.eventDate)}
                      </p>
                    </div>
                  )}
                  {selectedEmail.leadData.guestCount && (
                    <div>
                      <p className="ix__leadfield-label">Convidats</p>
                      <p className="ix__leadfield-value">
                        {selectedEmail.leadData.guestCount} persones
                      </p>
                    </div>
                  )}
                  {selectedEmail.leadData.budget && (
                    <div>
                      <p className="ix__leadfield-label">Pressupost</p>
                      <p className="ix__leadfield-value">{selectedEmail.leadData.budget}</p>
                    </div>
                  )}
                  {selectedEmail.leadData.eventLocation && (
                    <div>
                      <p className="ix__leadfield-label">Ubicació</p>
                      <p className="ix__leadfield-value">{selectedEmail.leadData.eventLocation}</p>
                    </div>
                  )}
                  {selectedEmail.leadData.phone && (
                    <div>
                      <p className="ix__leadfield-label">Telèfon</p>
                      <p className="ix__leadfield-value">
                        <a
                          href={`tel:${selectedEmail.leadData.phone}`}
                          style={{ textDecoration: 'underline', textDecorationColor: 'var(--ax-gold)' }}
                        >
                          {selectedEmail.leadData.phone}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cos del missatge */}
            <div className="ix__msgsection">
              <p className="ix__msgsection-title">Missatge</p>
              {loadingSelected && selectedEmail.type === 'imap' && (
                <p className="ix__detailloading">
                  <span className="ix__spin" style={{ width: 16, height: 16 }} />
                  Carregant contingut complet...
                </p>
              )}
              {selectedEmail.imapData?.bodyHtml ? (
                <div
                  className="ix__emailhtml"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedEmail.imapData.bodyHtml),
                  }}
                />
              ) : (
                <p className="ix__emailtext">
                  {selectedEmail.leadData?.message ||
                    selectedEmail.imapData?.bodyText ||
                    selectedEmail.preview ||
                    'Sense missatge'}
                </p>
              )}
            </div>

            {/* Suggeriments IA */}
            {onApplySuggestion && activeTab !== 'trash' && (
              <div style={{ marginTop: 16 }}>
                <AiReplySuggestions email={selectedEmail} onApply={onApplySuggestion} />
              </div>
            )}
          </div>

          {/* Accions */}
          <div
            className="ix__detailactions"
            {...helpAttrs(ADMIN_INBOX_HELP.messageActions)}
          >
            <button
              type="button"
              onClick={() => handleReply(selectedEmail)}
              className="ix__btn ix__btn--primary"
            >
              ↩ Respondre
            </button>
            <button
              type="button"
              onClick={handleOpenQuote}
              className="ix__btn ix__btn--ghost"
            >
              Pressupost
            </button>
            {selectedEmail.leadData?.phone && (
              <>
                <a
                  href={`https://wa.me/${selectedEmail.leadData.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ix__btn ix__btn--ghost"
                >
                  WhatsApp
                </a>
                <a
                  href={`tel:${selectedEmail.leadData.phone}`}
                  className="ix__btn ix__btn--ghost"
                >
                  Trucar
                </a>
              </>
            )}
            {selectedEmail.leadData && (
              <button
                type="button"
                onClick={() => handleOpenLead(selectedEmail.leadData!)}
                className="ix__btn ix__btn--ghost"
              >
                {selectedEmail.leadData.customerId ? '👤 Veure client' : '📋 Veure lead'}
              </button>
            )}
            {selectedEmail.type === 'imap' && activeTab !== 'trash' && (
              <>
                <button
                  type="button"
                  onClick={() => handleImportLeadFromEmail(selectedEmail)}
                  className="ix__btn ix__btn--ghost"
                >
                  + Crear lead
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveToTrash(selectedEmail)}
                  className="ix__btn ix__btn--ghost"
                >
                  Paperera
                </button>
              </>
            )}
            {selectedEmail.type === 'imap' && activeTab === 'trash' && (
              <>
                <button
                  type="button"
                  onClick={() => handleRestoreEmail(selectedEmail)}
                  className="ix__btn ix__btn--ghost"
                >
                  Restaurar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePermanently(selectedEmail)}
                  className="ix__btn ix__btn--danger"
                >
                  Eliminar permanent
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
