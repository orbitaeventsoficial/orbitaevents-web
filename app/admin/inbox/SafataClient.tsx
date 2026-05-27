'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatDate, formatDateShort, formatDateTime } from '@/lib/constants';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';

/* ── Tipus ─────────────────────────────────────────────────────────────────── */
export type SafataLead = {
  id: string;
  customerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  eventType: string | null;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  preferredLocale: string;
  interestedPackId: string | null;
  interestedExtras: string[];
  budget: string | null;
  guestCount: number | null;
  eventDate: string | Date | null;
  eventLocation: string | null;
  source: string | null;
};

export type SafataStats = {
  totalLeads: number;
  unreadLeads: number;
  todayLeads: number;
};

export type SafataEmailSend = {
  id: string;
  to: string;
  subject: string;
  templateKey: string | null;
  leadId: string | null;
  customerId: string | null;
  locale: string | null;
  sentAt: string | Date;
  openedAt: string | Date | null;
  openCount: number;
  clickedAt: string | Date | null;
  clickCount: number;
};

type ImapEmail = {
  id: string;
  uid: number;
  messageId: string;
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  subject: string;
  date: string;
  bodyText: string;
  bodyHtml: string;
  isRead: boolean;
  hasAttachments: boolean;
};

/* ── Plantilles ────────────────────────────────────────────────────────────── */
const TPLS = [
  {
    key: 'primer-contacte',
    label: 'Primer contacte',
    subject: 'La vostra sol·licitud a Òrbita Events',
    body: (name: string) =>
      `Hola ${name},\n\nGràcies per posar-vos en contacte amb nosaltres. Hem rebut la vostra sol·licitud i en breu us posarem al dia.\n\nSalutacions,`,
  },
  {
    key: 'seguiment',
    label: 'Seguiment',
    subject: 'Seguiment de la vostra sol·licitud',
    body: (name: string) =>
      `Hola ${name},\n\nUs escrivim per fer un seguiment de la vostra consulta. Quedeu a disposició per qualsevol dubte.\n\nSalutacions,`,
  },
  {
    key: 'lliure',
    label: 'Lliure',
    subject: '',
    body: (_name: string) => '',
  },
];

/* ── Component principal ───────────────────────────────────────────────────── */
export default function SafataClient({
  leads: initialLeads,
  stats: initialStats,
  emailSends: initialSends,
  imapConfigured,
}: {
  leads: SafataLead[];
  stats: SafataStats;
  emailSends: SafataEmailSend[];
  imapConfigured: boolean;
}) {
  const [tab, setTab] = useState<'entrades' | 'imap' | 'enviats'>('entrades');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<SafataLead | null>(null);
  const [selectedImap, setSelectedImap] = useState<ImapEmail | null>(null);
  const [selectedSend, setSelectedSend] = useState<SafataEmailSend | null>(null);

  /* Entrades web */
  const [localLeads, setLocalLeads] = useState<SafataLead[]>(initialLeads);
  const [localStats, setLocalStats] = useState(initialStats);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* IMAP */
  const [imapEmails, setImapEmails] = useState<ImapEmail[]>([]);
  const [imapLoading, setImapLoading] = useState(false);
  const [imapError, setImapError] = useState('');
  const [imapOffset, setImapOffset] = useState(0);
  const [imapHasMore, setImapHasMore] = useState(false);
  const IMAP_PAGE = 30;

  /* Enviats */
  const [localSends, setLocalSends] = useState<SafataEmailSend[]>(initialSends);
  const [sendsPage, setSendsPage] = useState(1);
  const SENDS_PAGE = 50;

  /* Auto-refresh entrades (cada 60s) */
  const refreshLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inbox/refresh-leads', { headers: { 'x-admin': '1' } });
      if (!res.ok) return;
      const data = await res.json() as { leads?: SafataLead[]; stats?: SafataStats };
      if (data.leads) setLocalLeads(data.leads);
      if (data.stats) setLocalStats(data.stats);
    } catch { /* silenci */ }
  }, []);

  useEffect(() => {
    refreshRef.current = setInterval(refreshLeads, 60_000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [refreshLeads]);

  /* Carregar IMAP */
  const loadImap = useCallback(async (offset = 0, append = false) => {
    if (!imapConfigured) return;
    setImapLoading(true);
    setImapError('');
    try {
      const res = await fetch(
        `/api/admin/inbox/messages?action=list&limit=${IMAP_PAGE}&offset=${offset}`,
        { headers: { 'x-admin': '1' } }
      );
      const data = await res.json() as { ok: boolean; emails?: ImapEmail[]; error?: string };
      if (!data.ok) { setImapError(data.error ?? 'Error carregant IMAP'); return; }
      const emails = data.emails ?? [];
      setImapEmails(prev => append ? [...prev, ...emails] : emails);
      setImapOffset(offset + emails.length);
      setImapHasMore(emails.length === IMAP_PAGE);
    } catch (err) {
      console.error('[Safata] Error IMAP:', err);
      setImapError('Error de connexió IMAP');
    } finally {
      setImapLoading(false);
    }
  }, [imapConfigured]);

  useEffect(() => {
    if (tab === 'imap' && imapEmails.length === 0 && !imapLoading) loadImap(0);
  }, [tab, imapEmails.length, imapLoading, loadImap]);

  const updateLocalStatus = (id: string, status: string) => {
    setLocalLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setSelectedLead(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  const handleSelectLead = async (lead: SafataLead) => {
    setSelectedLead(lead);
    if (lead.status === 'NEW') {
      try {
        const res = await fetchWithCsrf(`/api/admin/leads/${lead.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CONTACTED' }),
        });
        if (res.ok) updateLocalStatus(lead.id, 'CONTACTED');
      } catch { /* silenci */ }
    }
  };

  const handleTabChange = (t: typeof tab) => {
    setTab(t);
    setSelectedLead(null);
    setSelectedImap(null);
    setSelectedSend(null);
    setSearch('');
  };

  /* Filtres */
  const filteredLeads = localLeads.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.eventType ?? '').toLowerCase().includes(q);
  });

  const filteredImap = imapEmails.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.from.address.toLowerCase().includes(q) || e.from.name.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q);
  });

  const filteredSends = localSends.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.to.toLowerCase().includes(q) || s.subject.toLowerCase().includes(q);
  });

  const imapUnread = imapEmails.filter(e => !e.isRead).length;

  return (
    <div className="sf">

      {/* ── Barra superior ── */}
      <div className="sf__topbar">
        <div className="sf__topbar-left">
          <span className="sf__eyebrow">Comunicació</span>
          <h1 className="sf__title">Safata</h1>
        </div>
        <div className="sf__topbar-right">
          <div className="sf__tabs">
            <button type="button" className={`sf__tab${tab === 'entrades' ? ' is-on' : ''}`} onClick={() => handleTabChange('entrades')}>
              Entrades web
              {localStats.unreadLeads > 0 && <span className="sf__tab-badge">{localStats.unreadLeads}</span>}
            </button>
            {imapConfigured && (
              <button type="button" className={`sf__tab${tab === 'imap' ? ' is-on' : ''}`} onClick={() => handleTabChange('imap')}>
                Correu rebut
                {imapUnread > 0 && <span className="sf__tab-badge">{imapUnread}</span>}
              </button>
            )}
            <button type="button" className={`sf__tab${tab === 'enviats' ? ' is-on' : ''}`} onClick={() => handleTabChange('enviats')}>
              Enviats
            </button>
          </div>
          <a href="/admin/inbox/settings" className="sf__composer-btn" aria-label="Configuració de mail">
            ⚙ Configuració
          </a>
        </div>
      </div>

      {/* ── Estadístiques ── */}
      <div className="sf__stats">
        <div className="sf__stat">
          <span className="sf__stat-label">No llegits</span>
          <span className="sf__stat-value">{localStats.unreadLeads + imapUnread}</span>
        </div>
        <div className="sf__stat">
          <span className="sf__stat-label">Avui</span>
          <span className="sf__stat-value">{localStats.todayLeads}</span>
        </div>
        <div className="sf__stat">
          <span className="sf__stat-label">Leads</span>
          <span className="sf__stat-value">{localStats.totalLeads}</span>
        </div>
        <div className="sf__stat">
          <span className="sf__stat-label">Enviats</span>
          <span className="sf__stat-value">{localSends.length}</span>
        </div>
        <div className="sf__stat">
          <span className="sf__stat-label">Obertes</span>
          <span className="sf__stat-value">{localSends.filter(s => s.openCount > 0).length}</span>
        </div>
      </div>

      {/* ── Cos ── */}
      <div className="sf__body">
        <div className="sf__canvas">

          {/* TAB: Entrades web */}
          {tab === 'entrades' && (
            <div className="sf__main">
              <div className="sf__list">
                <div className="sf__search">
                  <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cercar per nom, email o event..." aria-label="Cercar entrades" className="sf__searchinput" />
                </div>
                <div className="sf__list-head">
                  <span className="sf__list-scope">Entrades web</span>
                  <span className="sf__list-count">{filteredLeads.length}</span>
                </div>
                <div className="sf__list-items">
                  {filteredLeads.length === 0 ? (
                    <div className="sf__empty"><span className="sf__empty-icon">📭</span><p className="sf__empty-title">Cap entrada</p></div>
                  ) : filteredLeads.map(lead => (
                    <button key={lead.id} type="button" onClick={() => handleSelectLead(lead)}
                      className={['sf__lead', selectedLead?.id === lead.id ? 'is-selected' : '', lead.status === 'NEW' ? 'is-unread' : ''].filter(Boolean).join(' ')}>
                      <div className="sf__lead-row">
                        {lead.status === 'NEW' && <span className="sf__lead-dot" aria-label="Nova" />}
                        <span className="sf__lead-name">{lead.name}</span>
                        <span className="sf__lead-status">{lead.status}</span>
                      </div>
                      <p className="sf__lead-preview">
                        {lead.eventType ?? '—'}
                        {lead.eventDate ? ` · ${formatDate(lead.eventDate)}` : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedLead ? (
                <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={updateLocalStatus}
                  onCustomerCreated={cid => setSelectedLead(prev => prev ? { ...prev, customerId: cid } : prev)} />
              ) : (
                <div className="sf__detail-blank">
                  <span className="sf__detail-blank-icon">📬</span>
                  <p className="sf__detail-blank-title">Selecciona una entrada</p>
                  <p className="sf__detail-blank-body">Les dades, el compositor i les accions apareixeran aquí.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: Correu rebut (IMAP) */}
          {tab === 'imap' && (
            <div className="sf__main">
              <div className="sf__list">
                <div className="sf__search">
                  <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cercar per remitent o assumpte..." aria-label="Cercar correu" className="sf__searchinput" />
                </div>
                <div className="sf__list-head">
                  <span className="sf__list-scope">INBOX</span>
                  <span className="sf__list-count">{filteredImap.length}</span>
                </div>
                <div className="sf__list-items">
                  {imapLoading && imapEmails.length === 0 ? (
                    <div className="sf__empty"><span className="sf__empty-icon sf__spin">↻</span><p className="sf__empty-title">Carregant...</p></div>
                  ) : imapError ? (
                    <div className="sf__empty"><p className="sf__empty-title sf__empty-title--error">{imapError}</p>
                      <button type="button" onClick={() => loadImap(0)} className="sf__action-btn sf__action-btn--ghost">Reintentar</button>
                    </div>
                  ) : filteredImap.length === 0 ? (
                    <div className="sf__empty"><span className="sf__empty-icon">📭</span><p className="sf__empty-title">Cap correu</p></div>
                  ) : (
                    <>
                      {filteredImap.map(email => (
                        <button key={email.id} type="button" onClick={() => setSelectedImap(email)}
                          className={['sf__lead', selectedImap?.id === email.id ? 'is-selected' : '', !email.isRead ? 'is-unread' : ''].filter(Boolean).join(' ')}>
                          <div className="sf__lead-row">
                            {!email.isRead && <span className="sf__lead-dot" aria-label="No llegit" />}
                            <span className="sf__lead-name">{email.from.name || email.from.address}</span>
                            <span className="sf__lead-status">{formatDateShort(email.date)}</span>
                          </div>
                          <p className="sf__lead-preview">{email.subject}</p>
                        </button>
                      ))}
                      {imapHasMore && (
                        <button type="button" onClick={() => loadImap(imapOffset, true)} disabled={imapLoading}
                          className="sf__load-more">
                          {imapLoading ? 'Carregant...' : 'Carregar més'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {selectedImap ? (
                <ImapDetail email={selectedImap} onClose={() => setSelectedImap(null)} onSent={send => setLocalSends(prev => [send, ...prev])} />
              ) : (
                <div className="sf__detail-blank">
                  <span className="sf__detail-blank-icon">📨</span>
                  <p className="sf__detail-blank-title">Selecciona un correu</p>
                  <p className="sf__detail-blank-body">El cos del missatge i les accions apareixeran aquí.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: Enviats */}
          {tab === 'enviats' && (
            <div className="sf__main">
              <div className="sf__list">
                <div className="sf__search">
                  <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cercar per destinatari o assumpte..." aria-label="Cercar enviats" className="sf__searchinput" />
                </div>
                <div className="sf__list-head">
                  <span className="sf__list-scope">Emails enviats</span>
                  <span className="sf__list-count">{filteredSends.length}</span>
                </div>
                <div className="sf__list-items">
                  {filteredSends.length === 0 ? (
                    <div className="sf__empty"><span className="sf__empty-icon">📤</span><p className="sf__empty-title">Cap email enviat</p></div>
                  ) : filteredSends.slice(0, sendsPage * SENDS_PAGE).map(s => (
                    <button key={s.id} type="button" onClick={() => setSelectedSend(s)}
                      className={`sf__lead${selectedSend?.id === s.id ? ' is-selected' : ''}`}>
                      <div className="sf__lead-row">
                        <span className="sf__lead-name">{s.to}</span>
                        {s.openCount > 0 && <span className="sf__lead-status">👁 {s.openCount}</span>}
                      </div>
                      <p className="sf__lead-preview">
                        {s.subject} · {formatDate(s.sentAt)}
                      </p>
                    </button>
                  ))}
                  {filteredSends.length > sendsPage * SENDS_PAGE && (
                    <button type="button" onClick={() => setSendsPage(p => p + 1)} className="sf__load-more">
                      Carregar més ({filteredSends.length - sendsPage * SENDS_PAGE} restants)
                    </button>
                  )}
                </div>
              </div>

              {selectedSend ? (
                <SendDetail send={selectedSend} onClose={() => setSelectedSend(null)} />
              ) : (
                <div className="sf__detail-blank">
                  <span className="sf__detail-blank-icon">📤</span>
                  <p className="sf__detail-blank-title">Selecciona un enviat</p>
                  <p className="sf__detail-blank-body">Les dades i el seguiment apareixeran aquí.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Compositor reutilitzable ──────────────────────────────────────────────── */
function Composer({
  to,
  leadId,
  customerId,
  locale,
  replySubject,
  onSent,
  onClose,
}: {
  to: string;
  leadId?: string | null;
  customerId?: string | null;
  locale?: string;
  replySubject?: string;
  onSent: (send: SafataEmailSend) => void;
  onClose: () => void;
}) {
  const [tpl, setTpl] = useState(replySubject ? 'lliure' : TPLS[0].key);
  const [subject, setSubject] = useState(replySubject ? `Re: ${replySubject.replace(/^Re:\s*/i, '')}` : TPLS[0].subject);
  const [body, setBody] = useState(replySubject ? '' : TPLS[0].body(''));
  const [cc, setCc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectTpl = (key: string, name = '') => {
    const t = TPLS.find(x => x.key === key) ?? TPLS[0];
    setTpl(key);
    if (!replySubject) setSubject(t.subject);
    setBody(t.body(name));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetchWithCsrf('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject: subject.trim(),
          body: body.trim(),
          cc: cc.trim() || undefined,
          templateKey: tpl !== 'lliure' ? tpl : undefined,
          leadId: leadId ?? undefined,
          customerId: customerId ?? undefined,
          locale: locale ?? 'ca',
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string; id?: string };
      if (!data.ok) { setError(data.error ?? 'Error enviant'); return; }
      onSent({
        id: data.id ?? crypto.randomUUID(),
        to, subject: subject.trim(),
        templateKey: tpl !== 'lliure' ? tpl : null,
        leadId: leadId ?? null, customerId: customerId ?? null,
        locale: locale ?? null,
        sentAt: new Date().toISOString(),
        openedAt: null, openCount: 0, clickedAt: null, clickCount: 0,
      });
      onClose();
    } catch (err) {
      console.error('[Composer] Error:', err);
      setError('Error de connexió');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sf__compose">
      <div className="sf__compose-head">
        <span className="sf__compose-to">Per a: {to}</span>
        <button type="button" onClick={onClose} className="sf__compose-discard" aria-label="Descartar">✕</button>
      </div>

      {!replySubject && (
        <div className="sf__compose-tpls">
          {TPLS.map(t => (
            <button key={t.key} type="button" onClick={() => selectTpl(t.key)} className={`sf__compose-tpl${tpl === t.key ? ' is-on' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assumpte" aria-label="Assumpte" className="sf__compose-subject" />

      {showCc ? (
        <input type="text" value={cc} onChange={e => setCc(e.target.value)} placeholder="CC (separa amb comes)" aria-label="CC" className="sf__compose-subject sf__compose-cc" />
      ) : (
        <button type="button" onClick={() => setShowCc(true)} className="sf__compose-cc-toggle">+ CC</button>
      )}

      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Escriu el missatge..." aria-label="Cos del mail" className="sf__compose-body" />

      {error && <p className="sf__action-error" style={{ padding: '0 14px' }}>{error}</p>}

      <div className="sf__compose-footer">
        <button type="button" onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} className="sf__action-btn sf__action-btn--primary">
          {sending ? 'Enviant...' : 'Enviar'}
        </button>
        <a href={leadId ? `/admin/inbox/compose?leadId=${leadId}` : '/admin/inbox/compose'} className="sf__action-btn sf__action-btn--ghost" title="Composer complet (pressupost, adjunts)">
          Composer complet ↗
        </a>
        <button type="button" onClick={onClose} className="sf__action-btn sf__action-btn--ghost">Cancel·lar</button>
      </div>
    </div>
  );
}

/* ── Detall lead ───────────────────────────────────────────────────────────── */
function LeadDetail({
  lead, onClose, onStatusChange, onCustomerCreated,
}: {
  lead: SafataLead;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onCustomerCreated: (cid: string) => void;
}) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [sendOk, setSendOk] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [markingStatus, setMarkingStatus] = useState(false);

  const handleToggleRead = async () => {
    const next = lead.status === 'NEW' ? 'CONTACTED' : 'NEW';
    setMarkingStatus(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${lead.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) onStatusChange(lead.id, next);
    } catch { /* silenci */ } finally { setMarkingStatus(false); }
  };

  const handleCreateCustomer = async () => {
    setCreating(true); setCreateError('');
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${lead.id}/customer-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      const data = await res.json() as { ok: boolean; customerId?: string; error?: string };
      if (!data.ok) setCreateError(data.error ?? 'Error');
      else if (data.customerId) onCustomerCreated(data.customerId);
    } catch { setCreateError('Error de connexió'); } finally { setCreating(false); }
  };

  return (
    <div className="sf__detail">
      <div className="sf__detail-head">
        <div className="sf__detail-sender">
          <div className="sf__detail-avatar">{lead.name.charAt(0).toUpperCase()}</div>
          <div className="sf__detail-senderinfo">
            <p className="sf__detail-sendername">{lead.name}</p>
            <p className="sf__detail-senderaddr">{lead.email}</p>
          </div>
        </div>
        <div className="sf__detail-headactions">
          <button type="button" onClick={handleToggleRead} disabled={markingStatus} className="sf__action-btn sf__action-btn--ghost sf__action-btn--sm">
            {lead.status === 'NEW' ? '○ No llegit' : '● Llegit'}
          </button>
          {!composeOpen && (
            <button type="button" onClick={() => setComposeOpen(true)} className="sf__compose-trigger">✉ Respondre</button>
          )}
          <button type="button" onClick={onClose} className="sf__detail-close" aria-label="Tancar">✕</button>
        </div>
      </div>

      {composeOpen && (
        <Composer to={lead.email} leadId={lead.id} customerId={lead.customerId} locale={lead.preferredLocale}
          onSent={() => { setSendOk(true); setComposeOpen(false); }}
          onClose={() => setComposeOpen(false)} />
      )}
      {sendOk && <div className="sf__send-ok">✓ Mail enviat correctament</div>}

      <div className="sf__detail-scroll">
        <div className="sf__data-grid">
          {lead.eventType && <div className="sf__data-field"><p className="sf__data-label">Tipus d&apos;event</p><p className="sf__data-value">{lead.eventType}</p></div>}
          {lead.eventDate && <div className="sf__data-field"><p className="sf__data-label">Data</p><p className="sf__data-value">{formatDate(lead.eventDate)}</p></div>}
          {lead.eventLocation && <div className="sf__data-field"><p className="sf__data-label">Ubicació</p><p className="sf__data-value">{lead.eventLocation}</p></div>}
          {lead.guestCount != null && <div className="sf__data-field"><p className="sf__data-label">Convidats</p><p className="sf__data-value">{lead.guestCount}</p></div>}
          {lead.budget && <div className="sf__data-field"><p className="sf__data-label">Pressupost</p><p className="sf__data-value">{lead.budget}</p></div>}
          {lead.phone && <div className="sf__data-field"><p className="sf__data-label">Telèfon</p><p className="sf__data-value"><a href={`tel:${lead.phone}`} className="sf__data-link">{lead.phone}</a></p></div>}
        </div>

        {lead.message && (
          <div className="sf__msg-section">
            <p className="sf__msg-label">Missatge</p>
            <p className="sf__msg-body">{lead.message}</p>
          </div>
        )}

        <div className="sf__action-block">
          <p className="sf__action-block-label">Client</p>
          <div className="sf__action-row">
            {lead.customerId ? (
              <a href={buildCustomerHubHref(lead.customerId)} className="sf__action-btn sf__action-btn--primary">Veure client</a>
            ) : (
              <button type="button" onClick={handleCreateCustomer} disabled={creating} className="sf__action-btn sf__action-btn--primary">
                {creating ? 'Creant...' : 'Crear client'}
              </button>
            )}
            <a href={buildLeadWorkspaceHref(lead.id)} className="sf__action-btn sf__action-btn--ghost">Veure lead</a>
          </div>
          {createError && <p className="sf__action-error">{createError}</p>}
        </div>

        {lead.phone && (
          <div className="sf__action-block">
            <p className="sf__action-block-label">Contacte directe</p>
            <div className="sf__action-row">
              <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="sf__action-btn sf__action-btn--primary">WhatsApp</a>
              <a href={`tel:${lead.phone}`} className="sf__action-btn sf__action-btn--ghost">Trucar</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Detall IMAP ───────────────────────────────────────────────────────────── */
function ImapDetail({
  email, onClose, onSent,
}: {
  email: ImapEmail;
  onClose: () => void;
  onSent: (send: SafataEmailSend) => void;
}) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [sendOk, setSendOk] = useState(false);

  return (
    <div className="sf__detail">
      <div className="sf__detail-head">
        <div className="sf__detail-sender">
          <div className="sf__detail-avatar">{(email.from.name || email.from.address).charAt(0).toUpperCase()}</div>
          <div className="sf__detail-senderinfo">
            <p className="sf__detail-sendername">{email.from.name || email.from.address}</p>
            <p className="sf__detail-senderaddr">{email.from.address}</p>
          </div>
        </div>
        <div className="sf__detail-headactions">
          {!composeOpen && (
            <button type="button" onClick={() => setComposeOpen(true)} className="sf__compose-trigger">✉ Respondre</button>
          )}
          <button type="button" onClick={onClose} className="sf__detail-close" aria-label="Tancar">✕</button>
        </div>
      </div>

      {composeOpen && (
        <Composer to={email.from.address} replySubject={email.subject}
          onSent={send => { onSent(send); setSendOk(true); setComposeOpen(false); }}
          onClose={() => setComposeOpen(false)} />
      )}
      {sendOk && <div className="sf__send-ok">✓ Mail enviat correctament</div>}

      <div className="sf__detail-scroll">
        <div className="sf__imap-subjectbar">
          <p className="sf__imap-subject">{email.subject}</p>
          <p className="sf__imap-meta">
            {formatDateTime(email.date)}
            {email.hasAttachments && <span className="sf__imap-attach">📎</span>}
          </p>
        </div>

        <div className="sf__imap-body">
          {email.bodyText
            ? <pre className="sf__imap-text">{email.bodyText}</pre>
            : <p className="sf__imap-text-empty">(sense cos de text)</p>
          }
        </div>
      </div>
    </div>
  );
}

/* ── Detall enviat ─────────────────────────────────────────────────────────── */
function SendDetail({ send, onClose }: { send: SafataEmailSend; onClose: () => void }) {
  return (
    <div className="sf__detail">
      <div className="sf__detail-head">
        <div className="sf__detail-sender">
          <div className="sf__detail-avatar">{send.to.charAt(0).toUpperCase()}</div>
          <div className="sf__detail-senderinfo">
            <p className="sf__detail-sendername">{send.to}</p>
            <p className="sf__detail-senderaddr">{send.subject}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="sf__detail-close" aria-label="Tancar">✕</button>
      </div>
      <div className="sf__detail-scroll">
        <div className="sf__data-grid">
          <div className="sf__data-field"><p className="sf__data-label">Enviat</p><p className="sf__data-value">{formatDateTime(send.sentAt)}</p></div>
          {send.templateKey && <div className="sf__data-field"><p className="sf__data-label">Plantilla</p><p className="sf__data-value">{send.templateKey}</p></div>}
          <div className="sf__data-field"><p className="sf__data-label">Obertures</p><p className="sf__data-value">{send.openCount}</p></div>
          <div className="sf__data-field"><p className="sf__data-label">Clics</p><p className="sf__data-value">{send.clickCount}</p></div>
          {send.openedAt && <div className="sf__data-field"><p className="sf__data-label">Primer obert</p><p className="sf__data-value">{formatDateTime(send.openedAt)}</p></div>}
        </div>
        <div className="sf__action-block">
          <p className="sf__action-block-label">Accions</p>
          <div className="sf__action-row">
            {send.leadId && <a href={buildLeadWorkspaceHref(send.leadId)} className="sf__action-btn sf__action-btn--ghost">Veure lead</a>}
            {send.customerId && <a href={buildCustomerHubHref(send.customerId)} className="sf__action-btn sf__action-btn--ghost">Veure client</a>}
            <a href={`/api/admin/emails/sent/${send.id}`} target="_blank" rel="noopener noreferrer" className="sf__action-btn sf__action-btn--ghost">Previsualitzar HTML</a>
          </div>
        </div>
      </div>
    </div>
  );
}
