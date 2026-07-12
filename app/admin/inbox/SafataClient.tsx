'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatDate, formatDateShort, formatDateTime } from '@/lib/constants';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';
import { AdminEmptyState } from '../components/AdminPage';

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
  eventStartTime: string | null;
  eventEndTime: string | null;
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

type ImapEmailAddr = { name: string; address: string };

type OrbitaLink = {
  kind: 'lead' | 'customer' | 'booking' | 'dossier' | 'proposal' | 'admin';
  id: string;
  origin?: string;
  source: 'header' | 'reference';
};

type ImapAttachment = {
  partKey: string;
  filename: string;
  contentType: string;
  size: number;
};

type ImapEmail = {
  id: string;
  uid: number;
  messageId: string;
  from: ImapEmailAddr;
  to: ImapEmailAddr[];
  cc?: ImapEmailAddr[];
  subject: string;
  date: string;
  bodyText: string;
  bodyHtml: string;
  isRead: boolean;
  isFlagged?: boolean;
  hasAttachments: boolean;
  attachments?: ImapAttachment[];
  orbita?: OrbitaLink;
  inReplyTo?: string;
  references?: string;
};

type SpecialUse = 'inbox' | 'sent' | 'drafts' | 'trash' | 'junk' | 'archive' | null;

type FolderInfo = {
  path: string;
  name: string;
  delimiter: string;
  specialUse: SpecialUse;
  unread: number;
  total: number;
};

type SpecialFolders = {
  inbox: string;
  sent: string | null;
  drafts: string | null;
  trash: string | null;
  junk: string | null;
  archive: string | null;
};

type ActiveTab =
  | { kind: 'leads' }
  | { kind: 'folder'; path: string; specialUse?: SpecialUse };

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

/* Missatges d'error del compositor (copy local únic; no és catàleg de domini) */
const ERR_SEND_TIMEOUT = 'No s\'ha pogut connectar amb el servidor de correu (timeout SMTP). El missatge NO s\'ha enviat. Torna-ho a provar d\'aquí uns segons o revisa la configuració.';
const ERR_SEND_GENERIC = 'No s\'ha pogut enviar el correu. El missatge NO s\'ha enviat; pots reintentar-ho.';
const ERR_NETWORK = 'Error de connexió amb el servidor. El missatge NO s\'ha enviat; comprova la xarxa i torna-ho a provar.';
const ERR_DRAFT = 'No s\'ha pogut desar l\'esborrany. Torna-ho a provar.';

const ICONS: Record<Exclude<SpecialUse, null> | 'custom', string> = {
  inbox: '📥',
  sent: '📤',
  drafts: '📝',
  trash: '🗑',
  junk: '🚫',
  archive: '📦',
  custom: '📁',
};

const FOLDER_LABELS: Record<Exclude<SpecialUse, null>, string> = {
  inbox: 'Entrada',
  sent: 'Enviats',
  drafts: 'Esborranys',
  trash: 'Paperera',
  junk: 'Spam',
  archive: 'Arxiu',
};

const SPECIAL_ORDER: Exclude<SpecialUse, null>[] = ['inbox', 'sent', 'drafts', 'archive', 'junk', 'trash'];

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function buildOrbitaPill(orbita: OrbitaLink): { label: string; href: string | null; hint: string } {
  const sourceHint = orbita.source === 'reference' ? ' (detectat per resposta)' : '';
  if (orbita.kind === 'lead' && orbita.id) {
    return { label: 'Lead', href: buildLeadWorkspaceHref(orbita.id), hint: `Lead #${orbita.id}${sourceHint}` };
  }
  if (orbita.kind === 'customer' && orbita.id) {
    return { label: 'Client', href: buildCustomerHubHref(orbita.id), hint: `Client #${orbita.id}${sourceHint}` };
  }
  if (orbita.kind === 'booking' && orbita.id) {
    return { label: 'Reserva', href: buildBookingHref(orbita.id), hint: `Reserva #${orbita.id}${sourceHint}` };
  }
  if (orbita.kind === 'dossier' && orbita.id) {
    return { label: 'Dossier', href: `/admin/dossiers#${orbita.id}`, hint: `Dossier #${orbita.id}${sourceHint}` };
  }
  if (orbita.kind === 'proposal' && orbita.id) {
    return { label: 'Pressupost', href: buildProposalHref(orbita.id), hint: `Pressupost #${orbita.id}${sourceHint}` };
  }
  return { label: 'Admin', href: null, hint: `Origen admin${sourceHint}` };
}

function isOutboundFolder(folder: string | undefined, su?: SpecialUse | null): boolean {
  if (su === 'sent' || su === 'drafts') return true;
  if (!folder) return false;
  const f = folder.toLowerCase();
  return f.includes('sent') || f.includes('draft');
}

function quoteReply(email: ImapEmail): string {
  const date = formatDateTime(email.date);
  const fromName = email.from.name || email.from.address;
  const lines = (email.bodyText || '').split('\n').slice(0, 30);
  const quoted = lines.map(l => `> ${l}`).join('\n');
  return `\n\n───\nEl ${date}, ${fromName} va escriure:\n${quoted}`;
}

function quoteForward(email: ImapEmail): string {
  const date = formatDateTime(email.date);
  const fromLine = email.from.name ? `${email.from.name} <${email.from.address}>` : email.from.address;
  const toLine = (email.to ?? []).map(t => t.name ? `${t.name} <${t.address}>` : t.address).join(', ');
  const body = (email.bodyText || '').slice(0, 4000);
  return `\n\n──────── Missatge reenviat ────────\nDe: ${fromLine}\nData: ${date}\nAssumpte: ${email.subject}\nPer a: ${toLine}\n\n${body}`;
}

/* ── Classes canòniques compartides (Tailwind + tokens · 100% canònic) ─────── */
const NAV_ITEM =
  'flex w-full items-center gap-2 rounded-[var(--o-r-md)] border border-transparent bg-transparent px-3 py-2 text-left text-sm font-semibold text-[var(--t2)] no-underline transition-colors hover:bg-[var(--panel)] hover:text-[var(--t)]';
const NAV_ITEM_ON =
  'border-[var(--hair-gold)] bg-[color-mix(in_oklab,var(--gold)_10%,var(--panel))] text-[var(--gold-bright)] hover:bg-[color-mix(in_oklab,var(--gold)_10%,var(--panel))] hover:text-[var(--gold-bright)]';
const NAV_BADGE =
  'inline-flex h-[1.125rem] min-w-[1.125rem] flex-shrink-0 items-center justify-center rounded-[var(--o-r-sm)] bg-[var(--gold)] px-1.5 text-xs font-bold leading-none text-[var(--gold-ink)]';
const ICON_BTN =
  'inline-flex h-[2.125rem] w-[2.125rem] flex-shrink-0 items-center justify-center rounded-[var(--o-r-sm)] border border-transparent bg-transparent text-base text-[var(--t3)] transition-colors hover:border-[var(--line2)] hover:bg-[var(--raised)] hover:text-[var(--t)]';
const ICON_BTN_ON =
  'border-[var(--hair-gold)] bg-[color-mix(in_oklab,var(--gold)_12%,var(--panel))] text-[var(--gold-bright)] hover:text-[var(--gold-bright)]';
const ICON_BTN_DANGER =
  'text-[var(--o-danger)] hover:border-[color-mix(in_oklab,var(--o-danger)_40%,transparent)] hover:bg-[var(--o-danger-soft)] hover:text-[var(--o-danger)]';
const CLOSE_BTN =
  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--o-r-sm)] border border-[var(--line2)] bg-transparent text-base text-[var(--t3)] transition-colors hover:border-[var(--hair-gold)] hover:bg-[var(--raised)] hover:text-[var(--t)]';
const DATA_LABEL = 'text-xs font-bold uppercase tracking-[0.15em] text-[var(--t3)]';
const MODAL_BACKDROP =
  'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[color-mix(in_oklab,var(--canvas)_80%,var(--ax-ink))] px-5 py-[5vh]';
const MODAL =
  'flex w-full max-w-[45rem] flex-col overflow-hidden rounded-[var(--o-r-lg)] border border-[var(--hair-gold)] bg-[var(--panel)] shadow-[0_24px_48px_var(--ax-overlay-lg)]';
const MODAL_HEAD =
  'flex items-center justify-between border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--gold)_5%,var(--panel))] px-[1.125rem] py-3.5';
const MODAL_TITLE = 'text-base font-bold tracking-[-0.005em] text-[var(--t)]';
const MODAL_FOOTER =
  'flex flex-wrap items-center gap-2 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--canvas)_92%,var(--ax-ink))] px-4 py-3';
const SPIN = 'inline-block animate-spin';

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
  const [active, setActive] = useState<ActiveTab>({ kind: 'leads' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'data-desc' | 'data-asc' | 'unread' | 'remitent'>('data-desc');
  const [selectedLead, setSelectedLead] = useState<SafataLead | null>(null);
  const [selectedImap, setSelectedImap] = useState<ImapEmail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUids, setSelectedUids] = useState<Set<number>>(new Set());
  /* Feedback transitori d'accions de bústia (bulk/individuals) */
  const [actionFeedback, setActionFeedback] = useState<{ type: 'error' | 'ok'; text: string } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashFeedback = useCallback((type: 'error' | 'ok', text: string) => {
    setActionFeedback({ type, text });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setActionFeedback(null), 4500);
  }, []);
  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);
  const [composerOpen, setComposerOpen] = useState<null | {
    mode: 'new' | 'reply' | 'reply-all' | 'forward' | 'lead-reply';
    email?: ImapEmail;
    lead?: SafataLead;
  }>(null);

  /* Entrades web */
  const [localLeads, setLocalLeads] = useState<SafataLead[]>(initialLeads);
  const [localStats, setLocalStats] = useState(initialStats);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localSends] = useState<SafataEmailSend[]>(initialSends);

  /* Carpetes IMAP */
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [special, setSpecial] = useState<SpecialFolders | null>(null);
  const [foldersError, setFoldersError] = useState('');

  /* Cache d'emails per carpeta */
  const [emailsByFolder, setEmailsByFolder] = useState<Record<string, ImapEmail[]>>({});
  const [folderState, setFolderState] = useState<Record<string, { loading: boolean; error: string; offset: number; hasMore: boolean }>>({});
  const PAGE = 30;

  /* Auto-refresh entrades (cada 60s) */
  const refreshLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inbox/refresh-leads', { headers: { 'x-admin': '1' } });
      const data = (await res.json().catch(() => ({}))) as { leads?: SafataLead[]; stats?: SafataStats; error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || data.message || "No s'ha pogut refrescar la llista de leads.");
      }
      if (data.leads) setLocalLeads(data.leads);
      if (data.stats) setLocalStats(data.stats);
    } catch (error) {
      console.error('[Safata] Error refrescant leads de la safata', { error });
      flashFeedback(
        'error',
        error instanceof Error ? error.message : "No s'ha pogut refrescar la llista de leads."
      );
    }
  }, [flashFeedback]);

  useEffect(() => {
    refreshRef.current = setInterval(refreshLeads, 60_000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [refreshLeads]);

  /* Carregar carpetes IMAP */
  const loadFolders = useCallback(async () => {
    if (!imapConfigured) return;
    try {
      const res = await fetch('/api/admin/inbox/folders', { headers: { 'x-admin': '1' } });
      const data = await res.json() as { ok: boolean; folders?: FolderInfo[]; special?: SpecialFolders; error?: string };
      if (!data.ok || !data.folders || !data.special) {
        setFoldersError(data.error || 'Error carregant carpetes');
        return;
      }
      setFolders(data.folders);
      setSpecial(data.special);
      setFoldersError('');
    } catch (err) {
      console.error('[Safata] Error carregant folders:', err);
      setFoldersError('Error de connexió IMAP');
    }
  }, [imapConfigured]);

  useEffect(() => { loadFolders(); }, [loadFolders]);

  /* Carregar emails d'una carpeta */
  const loadFolderEmails = useCallback(async (path: string, offset = 0, append = false) => {
    setFolderState(prev => ({ ...prev, [path]: { ...(prev[path] || { offset: 0, hasMore: false }), loading: true, error: '' } }));
    try {
      const res = await fetch(
        `/api/admin/inbox/messages?folder=${encodeURIComponent(path)}&limit=${PAGE}&offset=${offset}`,
        { headers: { 'x-admin': '1' } }
      );
      const data = await res.json() as { ok: boolean; emails?: ImapEmail[]; error?: string };
      if (!data.ok) {
        setFolderState(prev => ({ ...prev, [path]: { loading: false, error: data.error || 'Error', offset, hasMore: false } }));
        return;
      }
      const emails = data.emails ?? [];
      setEmailsByFolder(prev => ({
        ...prev,
        [path]: append ? [...(prev[path] || []), ...emails] : emails,
      }));
      setFolderState(prev => ({
        ...prev,
        [path]: { loading: false, error: '', offset: offset + emails.length, hasMore: emails.length === PAGE },
      }));
    } catch (err) {
      console.error('[Safata] Error carregant carpeta', path, err);
      setFolderState(prev => ({ ...prev, [path]: { loading: false, error: 'Error de connexió', offset, hasMore: false } }));
    }
  }, []);

  /* Quan canvia la pestanya, carregar la carpeta si IMAP */
  useEffect(() => {
    if (active.kind !== 'folder') return;
    const path = active.path;
    if (!emailsByFolder[path] && !folderState[path]?.loading) {
      loadFolderEmails(path, 0);
    }
  }, [active, emailsByFolder, folderState, loadFolderEmails]);

  /* Nota: el inbox IMAP es carrega quan l'usuari clica la carpeta "Entrada correu" */

  /* Invalidar carpeta (refresh manual o post-acció) */
  const invalidateFolder = useCallback((path: string) => {
    setEmailsByFolder(prev => { const cp = { ...prev }; delete cp[path]; return cp; });
    setFolderState(prev => { const cp = { ...prev }; delete cp[path]; return cp; });
  }, []);

  /* Actions ─────────────────────────────────────────────────────────────── */
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
        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        if (!res.ok) {
          throw new Error(data.error || data.message || "No s'ha pogut marcar el lead com llegit.");
        }
        updateLocalStatus(lead.id, 'CONTACTED');
        setLocalStats(prev => ({ ...prev, unreadLeads: Math.max(0, prev.unreadLeads - 1) }));
      } catch (error) {
        console.error('[Safata] Error marcant lead nou com contactat', {
          leadId: lead.id,
          error,
        });
        flashFeedback(
          'error',
          error instanceof Error ? error.message : "No s'ha pogut marcar el lead com llegit."
        );
      }
    }
  };

  const handleTabChange = (next: ActiveTab) => {
    setActive(next);
    setSelectedLead(null);
    setSelectedImap(null);
    setSelectedUids(new Set());
    setComposerOpen(null);
    setSearch('');
  };

  const toggleSelect = (uid: number) => {
    setSelectedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const selectAllVisible = (uids: number[]) => {
    setSelectedUids(new Set(uids));
  };

  const clearSelection = () => setSelectedUids(new Set());

  const doBulk = async (action: 'markRead' | 'markUnread' | 'flag' | 'unflag' | 'delete' | 'moveTo', targetFolder?: string) => {
    if (active.kind !== 'folder' || selectedUids.size === 0) return;
    const folder = active.path;
    const uids = Array.from(selectedUids);
    try {
      const res = await fetchWithCsrf('/api/admin/inbox/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uids, folder, action, targetFolder }),
      });
      const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        console.error('[Safata] Bulk action error:', data.error);
        flashFeedback('error', data.error || `No s'ha pogut completar l'acció sobre ${uids.length} correu${uids.length === 1 ? '' : 's'}.`);
        // Recarrega per restaurar l'estat real del servidor (rollback de l'optimisme).
        invalidateFolder(folder);
        return;
      }
      // Invalida tant la carpeta origen com la target
      invalidateFolder(folder);
      if (targetFolder) invalidateFolder(targetFolder);
      clearSelection();
      setSelectedImap(null);
      loadFolders(); // refresh comptadors
      flashFeedback('ok', `${uids.length} correu${uids.length === 1 ? '' : 's'} actualitzat${uids.length === 1 ? '' : 's'}.`);
    } catch (err) {
      console.error('[Safata] Bulk action error:', err);
      flashFeedback('error', 'Error de connexió en l\'acció en lot. Cap canvi aplicat.');
      invalidateFolder(folder);
    }
  };

  /**
   * Quan es clica un email de la llista, el cos no està descarregat (la llista
   * només té envelope). Carreguem el cos amb fetchEmailByUid via GET /messages/[uid].
   * Si el folder és outbound, no auto-marquem com llegit (els enviats ja són
   * "llegits" per definició).
   */
  /* Seleccionar email IMAP des de la vista d'entrada unificada (usa special.inbox) */

  const handleSelectImap = async (email: ImapEmail) => {
    setSelectedImap(email); // mostra capçalera de seguida (UX optimista)
    if (active.kind !== 'folder') return;
    setDetailLoading(true);
    try {
      const folder = active.path;
      const params = new URLSearchParams({ folder });
      if (outbound) params.set('autoMarkRead', 'false');
      const res = await fetch(`/api/admin/inbox/messages/${email.uid}?${params.toString()}`, {
        headers: { 'x-admin': '1' },
      });
      const data = await res.json() as { ok: boolean; email?: ImapEmail };
      if (data.ok && data.email) {
        setSelectedImap(data.email);
        // Marca llegit a la llista si no era outbound
        if (!outbound && !email.isRead) {
          setEmailsByFolder(prev => ({
            ...prev,
            [folder]: (prev[folder] || []).map(e => e.uid === email.uid ? { ...e, isRead: true } : e),
          }));
          loadFolders();
        }
      }
    } catch (err) {
      console.error('[Safata] Error carregant email body:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const setFlagSingle = async (email: ImapEmail, flag: boolean, folderOverride?: string) => {
    const folder = folderOverride ?? (active.kind === 'folder' ? active.path : null);
    if (!folder) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: flag ? 'flag' : 'unflag', folder }),
      });
      if (res.ok) {
        setEmailsByFolder(prev => ({
          ...prev,
          [folder]: (prev[folder] || []).map(e => e.uid === email.uid ? { ...e, isFlagged: flag } : e),
        }));
        setSelectedImap(prev => prev?.uid === email.uid ? { ...prev, isFlagged: flag } : prev);
      } else {
        flashFeedback('error', flag ? 'No s\'ha pogut marcar el correu.' : 'No s\'ha pogut treure la marca.');
      }
    } catch (err) {
      console.error('[Safata] setFlag error:', err);
      flashFeedback('error', 'Error de connexió en marcar el correu.');
    }
  };

  const markUnread = async (email: ImapEmail, folderOverride?: string) => {
    const folder = folderOverride ?? (active.kind === 'folder' ? active.path : null);
    if (!folder) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markUnread', folder }),
      });
      if (res.ok) {
        setEmailsByFolder(prev => ({
          ...prev,
          [folder]: (prev[folder] || []).map(e => e.uid === email.uid ? { ...e, isRead: false } : e),
        }));
        setSelectedImap(null);
        loadFolders();
      } else {
        flashFeedback('error', 'No s\'ha pogut marcar com a no llegit.');
      }
    } catch (err) {
      console.error('[Safata] markUnread error:', err);
      flashFeedback('error', 'Error de connexió.');
    }
  };

  const deleteSingle = async (email: ImapEmail, folderOverride?: string) => {
    const folder = folderOverride ?? (active.kind === 'folder' ? active.path : null);
    if (!folder) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.uid}?folder=${encodeURIComponent(folder)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moveToTrash', folder }),
      });
      if (res.ok) {
        invalidateFolder(folder);
        if (special?.trash) invalidateFolder(special.trash);
        setSelectedImap(null);
        loadFolders();
        flashFeedback('ok', 'Correu mogut a la paperera.');
      } else {
        flashFeedback('error', 'No s\'ha pogut esborrar el correu.');
      }
    } catch (err) {
      console.error('[Safata] delete error:', err);
      flashFeedback('error', 'Error de connexió en esborrar.');
    }
  };

  const moveSingle = async (email: ImapEmail, targetFolder: string, folderOverride?: string) => {
    const folder = folderOverride ?? (active.kind === 'folder' ? active.path : null);
    if (!folder) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moveTo', folder, targetFolder }),
      });
      if (res.ok) {
        invalidateFolder(folder);
        invalidateFolder(targetFolder);
        setSelectedImap(null);
        loadFolders();
        flashFeedback('ok', 'Correu mogut de carpeta.');
      } else {
        flashFeedback('error', 'No s\'ha pogut moure el correu.');
      }
    } catch (err) {
      console.error('[Safata] move error:', err);
      flashFeedback('error', 'Error de connexió en moure.');
    }
  };

  /* Ordenació */
  function sortEmails<T extends { isRead?: boolean; date?: string | Date; from?: { name?: string; address?: string } }>(items: T[]): T[] {
    const arr = [...items];
    if (sortBy === 'data-asc') arr.sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());
    else if (sortBy === 'unread') arr.sort((a, b) => (a.isRead === b.isRead ? new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime() : a.isRead ? 1 : -1));
    else if (sortBy === 'remitent') arr.sort((a, b) => (a.from?.name ?? a.from?.address ?? '').localeCompare(b.from?.name ?? b.from?.address ?? ''));
    else arr.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
    return arr;
  }

  function sortLeads<T extends { status?: string; createdAt?: string | Date; name?: string }>(leads: T[]): T[] {
    const arr = [...leads];
    if (sortBy === 'unread') arr.sort((a, b) => (a.status === 'NEW' ? -1 : b.status === 'NEW' ? 1 : 0));
    else if (sortBy === 'data-asc') arr.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
    else if (sortBy === 'remitent') arr.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    else arr.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    return arr;
  }

  /* Llistes filtrades */
  const filteredLeads = useMemo(() => sortLeads(localLeads.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.eventType ?? '').toLowerCase().includes(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sortLeads és pura sobre l'arg, depèn només de `sortBy` via closure
  })), [localLeads, search, sortBy]);

  const currentFolderEmails = active.kind === 'folder' ? (emailsByFolder[active.path] || []) : [];
  const currentFolderState = active.kind === 'folder' ? folderState[active.path] : undefined;
  const currentFolderSpecialUse: SpecialUse | undefined = active.kind === 'folder' ? active.specialUse : undefined;
  const outbound = active.kind === 'folder' && isOutboundFolder(active.path, currentFolderSpecialUse);

  const filteredEmails = useMemo(() => sortEmails(currentFolderEmails.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const toStr = (e.to ?? []).map((t: ImapEmailAddr) => `${t.name} ${t.address}`).join(' ');
    if (outbound) return e.subject.toLowerCase().includes(q) || toStr.toLowerCase().includes(q);
    return e.from.address.toLowerCase().includes(q) || e.from.name.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sortEmails és pura sobre l'arg, depèn només de `sortBy` via closure
  })), [currentFolderEmails, search, sortBy, outbound]);

  /* Comptadors sidebar */


  /* Comptador de leads no llegits (només leads web) */
  const entranceUnread = localStats.unreadLeads;

  /* Sidebar groups */
  const specialFolders = useMemo(() => {
    if (!special) return [] as Array<FolderInfo & { iconKey: Exclude<SpecialUse, null> }>;
    const result: Array<FolderInfo & { iconKey: Exclude<SpecialUse, null> }> = [];
    for (const su of SPECIAL_ORDER) {
      const path = special[su];
      if (!path) continue;
      const f = folders.find(x => x.path === path);
      if (!f) continue;
      result.push({ ...f, iconKey: su });
    }
    return result;
  }, [folders, special]);

  const customFolders = useMemo(() =>
    folders.filter(f => !f.specialUse).sort((a, b) => a.name.localeCompare(b.name)),
    [folders]
  );

  /* Render ───────────────────────────────────────────────────────────────── */
  const paneTitle = active.kind === 'leads'
    ? 'Leads web'
    : (specialFolders.find(f => f.path === active.path)?.iconKey
        ? FOLDER_LABELS[specialFolders.find(f => f.path === active.path)!.iconKey]
        : (active.kind === 'folder' ? active.path : ''));

  const paneCount = active.kind === 'leads' ? filteredLeads.length : filteredEmails.length;
  const hasSelected = (active.kind === 'leads' && !!selectedLead) || (active.kind === 'folder' && !!selectedImap);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--canvas)] text-[var(--t)] md:flex-row">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="flex flex-none flex-col overflow-hidden border-b border-[var(--line)] bg-[var(--side)] md:w-[11rem] md:border-b-0 md:border-r">
        <div className="hidden flex-none border-b border-[var(--line)] px-4 pb-3.5 pt-4 md:block">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--gold)] opacity-70">Comunicació</p>
          <h1 className="text-2xl font-bold leading-none text-[var(--t)] [font-family:var(--display)]">Safata</h1>
        </div>

        <nav className="flex min-h-0 flex-1 flex-row gap-0.5 overflow-auto p-2 [scrollbar-width:none] md:flex-col [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-shrink-0 flex-col gap-0.5 md:flex-shrink">
            <button type="button"
              className={`${NAV_ITEM}${active.kind === 'leads' ? ` ${NAV_ITEM_ON}` : ''}`}
              onClick={() => handleTabChange({ kind: 'leads' })}>
              <span className="w-[18px] flex-shrink-0 text-center text-base opacity-90">📥</span>
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">Leads web</span>
              {entranceUnread > 0 && <span className={NAV_BADGE}>{entranceUnread}</span>}
            </button>
          </div>

          {imapConfigured && (
            <div className="flex flex-shrink-0 flex-col gap-0.5 md:mt-3 md:flex-shrink md:border-t md:border-[var(--line)] md:pt-3">
              <span className="hidden px-2 pb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)] opacity-70 md:block">Bústia</span>
              {foldersError && <p className="px-2 pb-1.5 text-xs text-[var(--o-stage-lost)]">{foldersError}</p>}
              {specialFolders.map(f => (
                <button key={f.path} type="button"
                  className={`${NAV_ITEM}${active.kind === 'folder' && active.path === f.path ? ` ${NAV_ITEM_ON}` : ''}`}
                  onClick={() => handleTabChange({ kind: 'folder', path: f.path, specialUse: f.iconKey })}>
                  <span className="w-[18px] flex-shrink-0 text-center text-base opacity-90">{ICONS[f.iconKey]}</span>
                  <span className="min-w-0 flex-1 truncate whitespace-nowrap">{FOLDER_LABELS[f.iconKey]}</span>
                  {f.unread > 0 && <span className={NAV_BADGE}>{f.unread}</span>}
                </button>
              ))}
            </div>
          )}

          {imapConfigured && customFolders.length > 0 && (
            <div className="flex flex-shrink-0 flex-col gap-0.5 md:mt-3 md:flex-shrink md:border-t md:border-[var(--line)] md:pt-3">
              <span className="hidden px-2 pb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)] opacity-70 md:block">Carpetes</span>
              {customFolders.map(f => (
                <button key={f.path} type="button"
                  className={`${NAV_ITEM}${active.kind === 'folder' && active.path === f.path ? ` ${NAV_ITEM_ON}` : ''}`}
                  onClick={() => handleTabChange({ kind: 'folder', path: f.path })}>
                  <span className="w-[18px] flex-shrink-0 text-center text-base opacity-90">{ICONS.custom}</span>
                  <span className="flex-1 truncate" title={f.path}>{f.name}</span>
                  {f.unread > 0 && <span className={NAV_BADGE}>{f.unread}</span>}
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="flex flex-none gap-2 border-l border-[var(--line)] p-2 md:flex-col md:border-l-0 md:border-t">
          <button type="button"
            className="ap-btn ap-btn--primary w-full justify-center"
            onClick={() => setComposerOpen({ mode: 'new' })}>
            ✉ Nou correu
          </button>
          <a href="/admin/inbox/settings" className={NAV_ITEM}>
            <span className="w-[18px] flex-shrink-0 text-center text-base opacity-90">⚙</span>
            <span className="min-w-0 flex-1 truncate whitespace-nowrap">Configuració</span>
          </a>
        </div>
      </aside>

      {/* ── Pane (llista) ────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-none flex-col overflow-hidden border-[var(--line)] md:w-[21rem] md:border-r">
        <div className="flex flex-none items-center gap-2 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_50%,var(--canvas))] px-3 py-2.5">
          {active.kind === 'folder' && filteredEmails.length > 0 && (
            <input
              type="checkbox"
              className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-[var(--gold)]"
              aria-label="Seleccionar tots"
              checked={selectedUids.size > 0 && selectedUids.size === filteredEmails.length}
              ref={el => { if (el) el.indeterminate = selectedUids.size > 0 && selectedUids.size < filteredEmails.length; }}
              onChange={e => e.target.checked ? selectAllVisible(filteredEmails.map(x => x.uid)) : clearSelection()}
            />
          )}
          <span className="flex-1 truncate text-xs font-bold text-[var(--t)]">{paneTitle}</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="adm-input w-auto py-1 text-xs"
            aria-label="Ordenar per"
          >
            <option value="data-desc">Data ↓</option>
            <option value="data-asc">Data ↑</option>
            <option value="unread">No llegits</option>
            <option value="remitent">Remitent A-Z</option>
          </select>
          {active.kind === 'folder' && (
            <button type="button" className={`${ICON_BTN} h-[1.625rem] w-[1.625rem] border-[var(--line2)]`} aria-label="Refrescar"
              onClick={() => { invalidateFolder(active.path); loadFolders(); }}
              title="Refrescar carpeta">↻</button>
          )}
          <span className="flex-shrink-0 rounded-[var(--o-r-xs)] border border-[var(--line)] bg-[var(--sunk)] px-1.5 py-0.5 text-xs tabular-nums text-[var(--t3)]">{paneCount}</span>
        </div>

        {actionFeedback && (
          <div
            className={`ap-inline-alert ${actionFeedback.type === 'error' ? 'ap-inline-alert--danger' : 'ap-inline-alert--success'} flex items-start gap-2`}
            role={actionFeedback.type === 'error' ? 'alert' : 'status'}
          >
            <span className="min-w-0 flex-1">{actionFeedback.text}</span>
            <button type="button" className="flex-shrink-0 cursor-pointer bg-transparent text-xs opacity-70 transition-opacity hover:opacity-100" aria-label="Tancar avís"
              onClick={() => setActionFeedback(null)}>✕</button>
          </div>
        )}

        {active.kind === 'folder' && selectedUids.size > 0 && (
          <div className="sticky top-0 z-[2] flex flex-wrap items-center gap-1.5 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--gold)_5%,var(--panel))] px-3 py-2" role="toolbar" aria-label="Accions en lot">
            <span className="pr-1.5 text-xs font-bold tracking-[0.05em] text-[var(--gold-bright)]">{selectedUids.size} seleccionat{selectedUids.size === 1 ? '' : 's'}</span>
            <button type="button" onClick={() => doBulk('markRead')} className="ap-btn ap-btn--xs">● Llegit</button>
            <button type="button" onClick={() => doBulk('markUnread')} className="ap-btn ap-btn--xs">○ No llegit</button>
            <button type="button" onClick={() => doBulk('flag')} className="ap-btn ap-btn--xs">★ Marcar</button>
            <button type="button" onClick={() => doBulk('unflag')} className="ap-btn ap-btn--xs">☆ Treure</button>
            <MoveDropdown folders={folders} special={special} currentPath={active.path}
              onMove={target => doBulk('moveTo', target)} />
            <button type="button" onClick={() => doBulk('delete')} className="ap-btn ap-btn--xs ap-btn--danger">🗑 Esborrar</button>
            <button type="button" onClick={clearSelection} aria-label="Esborrar selecció" className="ap-btn ap-btn--xs">✕</button>
          </div>
        )}

        <div className="flex-none border-b border-[var(--line)] px-3 py-2.5">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={outbound ? 'Cercar destinatari o assumpte...' : 'Cercar remitent o assumpte...'}
            aria-label="Cercar"
            className="adm-input"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Leads web */}
          {active.kind === 'leads' && (
            filteredLeads.length === 0 ? (
              <AdminEmptyState icon="📭" title="Cap lead" />
            ) : filteredLeads.map(lead => {
              const selected = selectedLead?.id === lead.id;
              const unread = lead.status === 'NEW';
              return (
              <button key={lead.id} type="button" onClick={() => handleSelectLead(lead)}
                className={`flex w-full flex-col gap-1 border-b border-l-[3px] px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--panel)] ${selected ? 'border-l-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_8%,var(--panel))]' : 'border-l-transparent'} ${unread ? 'border-b-[var(--hair-gold)] bg-[color-mix(in_oklab,var(--gold)_6%,var(--canvas))]' : 'border-b-[var(--line)]'}`}>
                <div className="flex items-center gap-2">
                  {unread && <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[var(--gold)] shadow-[0_0_6px_var(--gold)]" aria-label="Nova" />}
                  <span className="flex-1 truncate text-sm font-bold text-[var(--t)]">{lead.name}</span>
                  {unread && <span className="flex-shrink-0 rounded-[var(--o-r-xs)] bg-[var(--gold)] px-1.5 text-xs font-bold uppercase tracking-[0.1em] leading-relaxed text-[var(--gold-ink)]">NOU</span>}
                  <span className="flex-shrink-0 text-xs text-[var(--t3)]">{formatDateShort(lead.createdAt)}</span>
                </div>
                <p className="truncate text-xs text-[var(--t3)]">
                  {lead.eventType ?? '—'}{lead.eventDate ? ` · ${formatDate(lead.eventDate)}` : ''}
                </p>
              </button>
            );})
          )}

          {/* Carpeta IMAP */}
          {active.kind === 'folder' && (
            currentFolderState?.loading && filteredEmails.length === 0 ? (
              <AdminEmptyState icon="↻" title="Carregant..." />
            ) : currentFolderState?.error ? (
              <AdminEmptyState
                icon="⚠"
                title={currentFolderState.error}
                action={<button type="button" onClick={() => loadFolderEmails(active.path, 0)} className="ap-btn ap-btn--xs">Reintentar</button>}
              />
            ) : filteredEmails.length === 0 ? (
              <AdminEmptyState icon={outbound ? '📤' : '📭'} title={outbound ? 'Cap email enviat' : 'Cap correu'} />
            ) : <>
              {filteredEmails.map(email => {
                const isSelected = selectedImap?.id === email.id;
                const checked = selectedUids.has(email.uid);
                const unread = !email.isRead && !outbound;
                const display = outbound
                  ? ((email.to ?? [])[0]?.name || (email.to ?? [])[0]?.address || '—')
                  : (email.from.name || email.from.address);
                const pill = email.orbita ? buildOrbitaPill(email.orbita) : null;
                return (
                  <div key={email.id} className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-l-[3px] px-2.5 py-2.5 transition-colors ${isSelected ? 'border-l-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_8%,var(--panel))]' : 'border-l-transparent'} ${unread ? 'border-b-[var(--hair-gold)] bg-[color-mix(in_oklab,var(--gold)_6%,var(--canvas))]' : 'border-b-[var(--line)]'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(email.uid)}
                      className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-[var(--gold)]"
                      aria-label="Seleccionar"
                      onClick={e => e.stopPropagation()}
                    />
                    <button type="button" onClick={() => handleSelectImap(email)} className="flex min-w-0 flex-col gap-1 bg-transparent text-left">
                      <div className="flex items-center gap-2">
                        {unread && <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[var(--gold)] shadow-[0_0_6px_var(--gold)]" aria-label="No llegit" />}
                        {email.isFlagged && <span className="flex-shrink-0 text-xs text-[var(--gold-bright)] [text-shadow:0_0_5px_var(--gold)]" aria-label="Marcat">★</span>}
                        <span className="flex-1 truncate text-sm font-bold text-[var(--t)]">{display}</span>
                        <span className="flex-shrink-0 text-xs text-[var(--t3)]">{formatDateShort(email.date)}</span>
                      </div>
                      <p className="truncate text-xs text-[var(--t3)]">
                        {email.subject}
                        {email.hasAttachments && <span className="ml-1 inline-block text-xs opacity-70"> 📎</span>}
                        {pill && <span className="ml-1.5 inline-block max-w-full truncate whitespace-nowrap rounded-[var(--o-r-xs)] border border-[var(--hair-gold)] bg-[color-mix(in_oklab,var(--gold)_10%,var(--panel))] px-1.5 text-xs font-bold tracking-[0.04em] text-[var(--gold-bright)] align-bottom" title={pill.hint}>🔗 {pill.label}</span>}
                      </p>
                    </button>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button type="button"
                        className={`${ICON_BTN} h-8 w-8${email.isFlagged ? ` ${ICON_BTN_ON}` : ''}`}
                        title={email.isFlagged ? 'Treure marca' : 'Marcar'}
                        aria-label={email.isFlagged ? 'Treure marca' : 'Marcar'}
                        aria-pressed={email.isFlagged}
                        onClick={e => { e.stopPropagation(); setFlagSingle(email, !email.isFlagged); }}>
                        {email.isFlagged ? '★' : '☆'}
                      </button>
                      <button type="button"
                        className={`${ICON_BTN} ${ICON_BTN_DANGER} h-8 w-8`}
                        title="Esborrar"
                        aria-label="Esborrar correu"
                        onClick={e => { e.stopPropagation(); deleteSingle(email); }}>
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
              {currentFolderState?.hasMore && (
                <button type="button" onClick={() => loadFolderEmails(active.path, currentFolderState.offset, true)}
                  disabled={currentFolderState.loading} className="ap-btn ap-btn--secondary w-full rounded-none border-x-0 border-b-0">
                  {currentFolderState.loading ? 'Carregant...' : 'Carregar més'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Detall ──────────────────────────────────────────────────────── */}
      {active.kind === 'leads' && selectedLead ? (
        <LeadDetail
          lead={selectedLead}
          onClose={() => { setSelectedLead(null); }}
          onStatusChange={updateLocalStatus}
          onCustomerCreated={cid => setSelectedLead(prev => prev ? { ...prev, customerId: cid } : prev)}
          onCompose={() => setComposerOpen({ mode: 'lead-reply', lead: selectedLead })}
        />
      ) : (active.kind === 'leads' || active.kind === 'folder') && selectedImap ? (
        <ImapDetail
          email={selectedImap}
          outbound={active.kind === 'folder' ? outbound : false}
          loading={detailLoading}
          folders={folders}
          special={special}
          currentPath={active.kind === 'folder' ? active.path : (special?.inbox || 'INBOX')}
          onClose={() => setSelectedImap(null)}
          onReply={() => setComposerOpen({ mode: 'reply', email: selectedImap })}
          onReplyAll={() => setComposerOpen({ mode: 'reply-all', email: selectedImap })}
          onForward={() => setComposerOpen({ mode: 'forward', email: selectedImap })}
          onFlag={(val) => setFlagSingle(selectedImap, val, active.kind === 'leads' ? (special?.inbox ?? undefined) : undefined)}
          onMarkUnread={() => markUnread(selectedImap, active.kind === 'leads' ? (special?.inbox ?? undefined) : undefined)}
          onMove={(target) => moveSingle(selectedImap, target, active.kind === 'leads' ? (special?.inbox ?? undefined) : undefined)}
          onDelete={() => deleteSingle(selectedImap, active.kind === 'leads' ? (special?.inbox ?? undefined) : undefined)}
        />
      ) : !hasSelected && !composerOpen ? (
        <div className="flex flex-1 flex-col items-center justify-center border-l border-[var(--line)] bg-[color-mix(in_oklab,var(--canvas)_96%,var(--panel))] p-10 text-center text-[var(--t3)]">
          <span className="mb-4 text-3xl opacity-40">
            {outbound ? '📤' : active.kind === 'folder' ? '📨' : '📬'}
          </span>
          <p className="mb-1.5 text-base font-bold text-[var(--t2)]">
            Selecciona un {outbound ? 'enviat' : 'correu'}
          </p>
          <p className="max-w-[16rem] text-xs leading-relaxed text-[var(--t3)]">El contingut del missatge apareixerà aquí.</p>
        </div>
      ) : null}

      {/* ── Composer modal ─────────────────────────────────────────────── */}
      {composerOpen && (
        <Composer
          mode={composerOpen.mode}
          email={composerOpen.email}
          lead={composerOpen.lead}
          draftsAvailable={!!special?.drafts}
          imapFolder={active.kind === 'folder' ? active.path : (special?.inbox ?? undefined)}
          onClose={() => setComposerOpen(null)}
          onSent={() => {
            setComposerOpen(null);
            // Refresca Sent si està obert
            if (special?.sent && emailsByFolder[special.sent]) {
              invalidateFolder(special.sent);
            }
            loadFolders();
          }}
        />
      )}
    </div>
  );
}

/* ── Modal Extreure dades d'email ────────────────────────────────────── */
const EVENT_TYPES_LABELS: Record<string, string> = {
  WEDDING: 'Casament', BIRTHDAY: 'Aniversari', CORPORATE: 'Empresa', COMMUNION: 'Comunió',
  BAPTISM: 'Bateig', GRADUATION: 'Graduació', ANNIVERSARY: 'Aniversari de parella',
  PRIVATE_PARTY: 'Festa privada', OTHER: 'Altre',
};

function guessEventType(subject: string, body: string): string {
  const txt = `${subject} ${body}`.toLowerCase();
  if (txt.includes('boda') || txt.includes('casament') || txt.includes('wedding')) return 'WEDDING';
  if (txt.includes('empresa') || txt.includes('corporate') || txt.includes('corporat')) return 'CORPORATE';
  if (txt.includes('comunió') || txt.includes('comunion') || txt.includes('communion')) return 'COMMUNION';
  if (txt.includes('bateig') || txt.includes('bautizo') || txt.includes('baptism')) return 'BAPTISM';
  if (txt.includes('graduació') || txt.includes('graduacion') || txt.includes('graduatio')) return 'GRADUATION';
  if (txt.includes('fiesta') || txt.includes('festa') || txt.includes('party')) return 'PRIVATE_PARTY';
  if (txt.includes('cumpleaños') || txt.includes('aniversari') || txt.includes('birthday')) return 'BIRTHDAY';
  return 'OTHER';
}

function extractTimesFromText(text: string): string | null {
  if (!text) return null;
  // Rang complet: "de 13:00 a 16:00", "desde 13:00 hasta 16:00", "13:00 a 16:00", "13:00-16:00", "13:00 - 16:00"
  const range = text.match(/(?:de(?:sde)?\s+)?(\d{1,2}:\d{2})\s*(?:h(?:oras?)?)?\s*(?:a|hasta|-|–)\s*(\d{1,2}:\d{2})\s*(?:h(?:oras?)?)?/i);
  if (range) return `${range[1]} – ${range[2]}`;
  // Hora sola: "a las 13:00", "desde las 13:00"
  const single = text.match(/(?:a\s+las?|desde\s+las?|a\s+les?|des\s+de\s+les?)\s+(\d{1,2}:\d{2})/i);
  if (single) return single[1];
  return null;
}

function extractPhoneFromText(text: string): string {
  const m = text.match(/(?:tel[.:\s]*|phone[.:\s]*|mob[.:\s]*|tlf[.:\s]*|telèfon[:\s]*)?((?:\+34|0034|34)?[\s.-]?[67]\d{2}[\s.-]?\d{3}[\s.-]?\d{3})/i);
  return m ? m[1].replace(/[\s.-]/g, '') : '';
}

function ExtractEmailModal({
  email, onClose, onDone,
}: {
  email: ImapEmail;
  onClose: () => void;
  onDone: (leadId: string) => void;
}) {
  const fromName = email.from.name || '';
  const fromEmail = email.from.address || '';
  const guessedPhone = extractPhoneFromText(`${email.bodyText || ''} ${email.subject}`);
  const guessedEventType = guessEventType(email.subject, email.bodyText || '');

  const [name, setName] = useState(fromName);
  const [emailVal, setEmailVal] = useState(fromEmail);
  const [phone, setPhone] = useState(guessedPhone);
  const [eventType, setEventType] = useState(guessedEventType);
  const [message, setMessage] = useState((email.bodyText || '').slice(0, 600));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !emailVal.trim()) return;
    setSaving(true); setError('');
    try {
      const res = await fetchWithCsrf('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: emailVal.trim(),
          phone: phone.trim() || undefined,
          eventType,
          message: message.trim() || undefined,
          source: 'OTHER',
        }),
      });
      const data = await res.json() as { ok?: boolean; lead?: { id: string }; error?: string };
      if (!res.ok || !data.lead?.id) {
        setError(data.error || 'Error creant lead');
        return;
      }
      onDone(data.lead.id);
    } catch (err) {
      console.error('[ExtractEmailModal] error:', err);
      setError('Error de connexió');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={MODAL_BACKDROP} role="dialog" aria-modal="true" aria-label="Extreure dades del correu">
      <div className={`${MODAL} max-w-[35rem]`}>
        <div className={MODAL_HEAD}>
          <span className={MODAL_TITLE}>✦ Crear lead des del correu</span>
          <button type="button" onClick={onClose} className={CLOSE_BTN} aria-label="Tancar">✕</button>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="grid gap-1.5">
            <label htmlFor="ex-name" className={DATA_LABEL}>Nom</label>
            <input id="ex-name" type="text" value={name} onChange={e => setName(e.target.value)} className="adm-input" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="ex-email" className={DATA_LABEL}>Email</label>
            <input id="ex-email" type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} className="adm-input" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="ex-phone" className={DATA_LABEL}>Telèfon</label>
            <input id="ex-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="adm-input" placeholder="Opcional" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="ex-type" className={DATA_LABEL}>Tipus d&apos;event</label>
            <select id="ex-type" value={eventType} onChange={e => setEventType(e.target.value)} className="adm-input" aria-label="Tipus d'event">
              {Object.entries(EVENT_TYPES_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="ex-msg" className={DATA_LABEL}>Missatge</label>
            <textarea
              id="ex-msg"
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="adm-input adm-input--textarea"
              rows={4}
            />
          </div>
          <p className="text-xs leading-relaxed text-[var(--t3)]">
            Es crearà un lead amb estat CONTACTED i s&apos;intentarà vincular al client existent.
          </p>
          {error && <div className="ap-inline-alert ap-inline-alert--danger" role="alert">{error}</div>}
        </div>
        <div className={MODAL_FOOTER}>
          <button type="button" onClick={handleCreate} disabled={saving || !name.trim() || !emailVal.trim()} className="ap-btn ap-btn--primary">
            {saving ? 'Creant...' : 'Crear lead'}
          </button>
          <button type="button" onClick={onClose} className="ap-btn ap-btn--secondary">Cancel·lar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Dropdown Moure a... ───────────────────────────────────────────────── */
function MoveDropdown({
  folders, special, currentPath, onMove,
}: {
  folders: FolderInfo[];
  special: SpecialFolders | null;
  currentPath: string;
  onMove: (target: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const targets = folders.filter(f => f.path !== currentPath);
  const MOVE_ITEM = 'block w-full cursor-pointer rounded-[var(--o-r-sm)] bg-transparent px-2.5 py-1.5 text-left text-xs text-[var(--t2)] transition-colors hover:bg-[color-mix(in_oklab,var(--gold)_10%,var(--panel))] hover:text-[var(--gold-bright)]';
  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(o => !o)} className="ap-btn ap-btn--xs">
        📁 Moure
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[3] mt-1 max-h-[17.5rem] min-w-[11.25rem] overflow-y-auto rounded-[var(--o-r-md)] border border-[var(--hair-gold)] bg-[var(--raised)] p-1 shadow-[0_12px_28px_var(--ax-overlay-lg)]" role="menu">
          {special?.inbox && special.inbox !== currentPath && (
            <button type="button" onClick={() => { onMove(special.inbox); setOpen(false); }} className={MOVE_ITEM}>
              📥 Entrada
            </button>
          )}
          {special?.archive && special.archive !== currentPath && (
            <button type="button" onClick={() => { onMove(special.archive!); setOpen(false); }} className={MOVE_ITEM}>
              📦 Arxiu
            </button>
          )}
          {targets.filter(t => !t.specialUse).map(t => (
            <button key={t.path} type="button" onClick={() => { onMove(t.path); setOpen(false); }} className={MOVE_ITEM}>
              📁 {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Composer ──────────────────────────────────────────────────────────── */
function Composer({
  mode, email, lead, draftsAvailable, imapFolder, onClose, onSent,
}: {
  mode: 'new' | 'reply' | 'reply-all' | 'forward' | 'lead-reply';
  email?: ImapEmail;
  lead?: SafataLead;
  draftsAvailable: boolean;
  imapFolder?: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const initialTo = (() => {
    if (mode === 'lead-reply') return lead?.email || '';
    if (mode === 'reply' || mode === 'reply-all') return email?.from.address || '';
    if (mode === 'forward' || mode === 'new') return '';
    return '';
  })();

  const initialCc = (() => {
    if (mode !== 'reply-all' || !email) return '';
    const ours = (process.env.NEXT_PUBLIC_SMTP_FROM || '').toLowerCase();
    const all = [...(email.to ?? []), ...(email.cc ?? [])];
    return all
      .map(x => x.address)
      .filter(a => a && a.toLowerCase() !== ours && a.toLowerCase() !== (email.from.address || '').toLowerCase())
      .join(', ');
  })();

  const initialSubject = (() => {
    if (mode === 'reply' || mode === 'reply-all') {
      return `Re: ${(email?.subject || '').replace(/^Re:\s*/i, '')}`;
    }
    if (mode === 'forward') return `Fwd: ${(email?.subject || '').replace(/^Fwd:\s*/i, '')}`;
    if (mode === 'lead-reply') return TPLS[0].subject;
    return '';
  })();

  const initialBody = (() => {
    if (mode === 'reply' || mode === 'reply-all') return email ? quoteReply(email) : '';
    if (mode === 'forward') return email ? quoteForward(email) : '';
    if (mode === 'lead-reply') return TPLS[0].body(lead?.name || '');
    return '';
  })();

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState(initialCc);
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(!!initialCc);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [tpl, setTpl] = useState(mode === 'lead-reply' ? TPLS[0].key : 'lliure');
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<null | { ok: boolean; folder: string | null; uid?: number; smtp: string }>(null);

  /* Adjunts reenviats: per defecte tots seleccionats */
  const forwardAttachments = mode === 'forward' ? (email?.attachments ?? []) : [];
  const [selectedAttachPartKeys, setSelectedAttachPartKeys] = useState<Set<string>>(
    () => new Set(forwardAttachments.map(a => a.partKey))
  );
  const toggleAttach = (partKey: string) => setSelectedAttachPartKeys(prev => {
    const next = new Set(prev);
    if (next.has(partKey)) next.delete(partKey); else next.add(partKey);
    return next;
  });

  const selectTpl = (key: string) => {
    const t = TPLS.find(x => x.key === key) ?? TPLS[0];
    setTpl(key);
    if (mode === 'lead-reply' || mode === 'new') {
      setSubject(t.subject);
      setBody(t.body(lead?.name || ''));
    }
  };

  const orbitaCtx = (() => {
    if (mode === 'lead-reply' && lead) return { kind: 'lead', id: lead.id, origin: 'safata-lead-reply' };
    if (email?.orbita?.kind && email.orbita.id) {
      return { kind: email.orbita.kind, id: email.orbita.id, origin: `safata-${mode}` };
    }
    return undefined;
  })();

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetchWithCsrf('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
          cc: cc.trim() || undefined,
          templateKey: tpl !== 'lliure' ? tpl : undefined,
          leadId: lead?.id ?? (orbitaCtx?.kind === 'lead' ? orbitaCtx.id : undefined),
          customerId: lead?.customerId ?? (orbitaCtx?.kind === 'customer' ? orbitaCtx.id : undefined),
          locale: lead?.preferredLocale ?? 'ca',
          imapAttachments: forwardAttachments.length > 0 && selectedAttachPartKeys.size > 0
            ? forwardAttachments
                .filter(a => selectedAttachPartKeys.has(a.partKey))
                .map(a => ({ uid: email!.uid, folder: imapFolder || 'INBOX', partKey: a.partKey, filename: a.filename, contentType: a.contentType }))
            : undefined,
        }),
      });
      const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        // L'API retorna 504 amb missatge clar per timeout SMTP; la resta, 500.
        const serverMsg = data.error
          || (res.status === 504 ? ERR_SEND_TIMEOUT : ERR_SEND_GENERIC);
        setError(serverMsg);
        setSending(false);
        return;
      }
      setSuccess({ ok: true, folder: 'Enviat', smtp: 'OK' });
      setTimeout(onSent, 1200);
    } catch (err) {
      console.error('[Composer] Error:', err);
      setError(ERR_NETWORK);
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!to.trim() && !subject.trim() && !body.trim()) return;
    setSavingDraft(true);
    setError('');
    try {
      const res = await fetchWithCsrf('/api/admin/inbox/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject: subject.trim(),
          bodyText: body.trim(),
          bodyHtml: `<p style="white-space:pre-line;font-family:'Segoe UI',Arial,sans-serif;">${body.trim().replace(/</g, '&lt;')}</p>`,
          orbita: orbitaCtx,
        }),
      });
      const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) { setError(data.error || ERR_DRAFT); return; }
      onClose();
    } catch (err) {
      console.error('[Composer] Draft error:', err);
      setError(ERR_NETWORK);
    } finally {
      setSavingDraft(false);
    }
  };

  const titleByMode: Record<typeof mode, string> = {
    'new': 'Nou correu',
    'reply': 'Respondre',
    'reply-all': 'Respondre a tothom',
    'forward': 'Reenviar',
    'lead-reply': 'Respondre al lead',
  };

  const CC_TOGGLE = 'w-fit cursor-pointer border-b border-[var(--line)] bg-transparent px-4 py-1 text-left text-xs font-semibold text-[var(--t3)] transition-colors hover:text-[var(--t2)]';
  const COMPOSE_INPUT = 'w-full border-0 border-b border-[var(--line)] bg-transparent px-4 py-2.5 text-base font-semibold text-[var(--t)] outline-none placeholder:text-[var(--t3)]';
  return (
    <div className={MODAL_BACKDROP} role="dialog" aria-modal="true" aria-label={titleByMode[mode]}>
      <div className={MODAL}>
        <div className={MODAL_HEAD}>
          <span className={MODAL_TITLE}>{titleByMode[mode]}</span>
          <button type="button" onClick={onClose} className={CLOSE_BTN} aria-label="Tancar">✕</button>
        </div>
        <div className="flex flex-col">
          {(mode === 'lead-reply' || mode === 'new') && (
            <div className="flex flex-wrap gap-1 border-b border-[var(--line)] px-3 py-2">
              {TPLS.map(t => (
                <button key={t.key} type="button" onClick={() => selectTpl(t.key)}
                  className={`ap-tab ${tpl === t.key ? 'ap-tab--active' : 'ap-tab--idle'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <input type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="Per a..." aria-label="Per a" className={COMPOSE_INPUT} />
          {showCc ? (
            <input type="text" value={cc} onChange={e => setCc(e.target.value)} placeholder="CC (separa amb comes)" aria-label="CC" className={`${COMPOSE_INPUT} text-sm font-normal text-[var(--t2)]`} />
          ) : (
            <button type="button" onClick={() => setShowCc(true)} className={CC_TOGGLE}>+ CC</button>
          )}
          {showBcc ? (
            <input type="text" value={bcc} onChange={e => setBcc(e.target.value)} placeholder="CCO" aria-label="CCO" className={`${COMPOSE_INPUT} text-sm font-normal text-[var(--t2)]`} />
          ) : (
            <button type="button" onClick={() => setShowBcc(true)} className={CC_TOGGLE}>+ CCO</button>
          )}
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assumpte" aria-label="Assumpte" className={COMPOSE_INPUT} />
          {forwardAttachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--gold)_3%,var(--panel))] px-4 py-2">
              <span className="max-w-full truncate whitespace-nowrap text-xs font-bold text-[var(--t3)]">📎 Adjunts:</span>
              {forwardAttachments.map(a => (
                <label key={a.partKey} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--o-r-sm)] border border-[var(--line2)] bg-[var(--panel)] px-2 py-1 text-xs text-[var(--t2)] transition-colors has-[:checked]:border-[var(--hair-gold)] has-[:checked]:bg-[color-mix(in_oklab,var(--gold)_8%,var(--panel))] has-[:checked]:text-[var(--gold-bright)]">
                  <input
                    type="checkbox"
                    className="h-3 w-3 flex-shrink-0 accent-[var(--gold)]"
                    checked={selectedAttachPartKeys.has(a.partKey)}
                    onChange={() => toggleAttach(a.partKey)}
                  />
                  <span>{a.filename}</span>
                </label>
              ))}
            </div>
          )}
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Escriu el missatge..." aria-label="Cos del mail" className="min-h-[8.75rem] w-full resize-y border-0 border-b border-[var(--line)] bg-transparent px-4 py-3 text-base leading-relaxed text-[var(--t)] outline-none placeholder:text-[var(--t3)]" />
          {error && <div className="ap-inline-alert ap-inline-alert--danger m-4" role="alert">{error}</div>}
          {success && (
            <div className="ap-inline-alert ap-inline-alert--success m-4" role="status">
              ✓ Enviat correctament — {success.folder ? `arxivat a ${success.folder}` : 'sense arxiu a Sent'}
            </div>
          )}
        </div>
        <div className={MODAL_FOOTER}>
          <button type="button" onClick={handleSend} disabled={sending || !to.trim() || !subject.trim() || !body.trim()} className="ap-btn ap-btn--primary">
            {sending ? 'Enviant...' : 'Enviar'}
          </button>
          {draftsAvailable && (
            <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="ap-btn ap-btn--secondary">
              {savingDraft ? 'Desant...' : 'Desar esborrany'}
            </button>
          )}
          <a href={lead?.id ? `/admin/inbox/compose?leadId=${lead.id}` : '/admin/inbox/compose'} className="ap-btn ap-btn--secondary" title="Composer complet (pressupost, adjunts)">
            Composer complet ↗
          </a>
          <button type="button" onClick={onClose} className="ap-btn ap-btn--secondary">Cancel·lar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Detall lead ───────────────────────────────────────────────────────── */
function LeadDetail({
  lead, onClose, onStatusChange, onCustomerCreated, onCompose,
}: {
  lead: SafataLead;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onCustomerCreated: (cid: string) => void;
  onCompose: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [markingStatus, setMarkingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const handleToggleRead = async () => {
    const next = lead.status === 'NEW' ? 'CONTACTED' : 'NEW';
    setMarkingStatus(true);
    setStatusError('');
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${lead.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || data.message || "No s'ha pogut actualitzar l'estat del lead.");
      }
      if (res.ok) onStatusChange(lead.id, next);
    } catch (error) {
      console.error('[Safata] Error actualitzant estat de lectura del lead', {
        leadId: lead.id,
        error,
      });
      setStatusError(error instanceof Error ? error.message : "No s'ha pogut actualitzar l'estat del lead.");
    } finally { setMarkingStatus(false); }
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

  const displayTime = lead.eventStartTime
    ? `${lead.eventStartTime}${lead.eventEndTime ? ` – ${lead.eventEndTime}` : ''}`
    : extractTimesFromText(`${lead.message ?? ''} ${lead.eventType ?? ''}`);


  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_80%,var(--canvas))] px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--hair-gold)] bg-[color-mix(in_oklab,var(--gold)_20%,var(--raised))] text-base font-bold text-[var(--gold-bright)]">{lead.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-[var(--t)]">{lead.name}</p>
            <p className="truncate text-xs text-[var(--t3)]">{lead.email}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleToggleRead}
            disabled={markingStatus}
            aria-invalid={statusError ? true : undefined}
            aria-describedby={statusError ? `lead-read-status-error-${lead.id}` : undefined}
            className="ap-btn ap-btn--xs"
          >
            {lead.status === 'NEW' ? '○ No llegit' : '● Llegit'}
          </button>
          <button type="button" onClick={onCompose} className="ap-btn ap-btn--primary">✉ Respondre</button>
          <button type="button" onClick={onClose} className={CLOSE_BTN} aria-label="Tancar">✕</button>
        </div>
      </div>
      {statusError && (
        <p
          id={`lead-read-status-error-${lead.id}`}
          role="alert"
          className="border-b border-[var(--line)] px-5 py-2 text-xs admin-tone-text-danger"
        >
          {statusError}
        </p>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="grid grid-cols-2 gap-px border-b border-[var(--line)] bg-[var(--line)]">
          {lead.eventType && <div className="flex flex-col gap-1 bg-[color-mix(in_oklab,var(--panel)_70%,var(--canvas))] px-[1.125rem] py-3.5"><p className={DATA_LABEL}>Tipus d&apos;event</p><p className="text-base font-semibold text-[var(--t)]">{lead.eventType}</p></div>}
          {lead.eventDate && <div className="flex flex-col gap-1 bg-[color-mix(in_oklab,var(--panel)_70%,var(--canvas))] px-[1.125rem] py-3.5"><p className={DATA_LABEL}>Data</p><p className="text-base font-semibold text-[var(--t)]">{formatDate(lead.eventDate)}</p></div>}
          {displayTime && <div className="flex flex-col gap-1 bg-[color-mix(in_oklab,var(--panel)_70%,var(--canvas))] px-[1.125rem] py-3.5"><p className={DATA_LABEL}>Horari</p><p className="text-base font-semibold text-[var(--t)]">{displayTime}</p></div>}
          {lead.eventLocation && <div className="flex flex-col gap-1 bg-[color-mix(in_oklab,var(--panel)_70%,var(--canvas))] px-[1.125rem] py-3.5"><p className={DATA_LABEL}>Ubicació</p><p className="text-base font-semibold text-[var(--t)]">{lead.eventLocation}</p></div>}
          {lead.guestCount != null && <div className="flex flex-col gap-1 bg-[color-mix(in_oklab,var(--panel)_70%,var(--canvas))] px-[1.125rem] py-3.5"><p className={DATA_LABEL}>Convidats</p><p className="text-base font-semibold text-[var(--t)]">{lead.guestCount}</p></div>}
          {lead.budget && <div className="flex flex-col gap-1 bg-[color-mix(in_oklab,var(--panel)_70%,var(--canvas))] px-[1.125rem] py-3.5"><p className={DATA_LABEL}>Pressupost</p><p className="text-base font-semibold text-[var(--t)]">{lead.budget}</p></div>}
          {lead.phone && <div className="flex flex-col gap-1 bg-[color-mix(in_oklab,var(--panel)_70%,var(--canvas))] px-[1.125rem] py-3.5"><p className={DATA_LABEL}>Telèfon</p><p className="text-base font-semibold text-[var(--t)]"><a href={`tel:${lead.phone}`} className="text-[var(--gold-bright)] no-underline hover:underline">{lead.phone}</a></p></div>}
        </div>
        {lead.message && (
          <div className="border-b border-[var(--line)] px-5 py-[1.125rem]">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.15em] text-[var(--gold)] opacity-80">Missatge</p>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-[var(--t2)]">{lead.message}</p>
          </div>
        )}
        <div className="border-b border-[var(--line)] px-5 py-4">
          <p className={`mb-3 ${DATA_LABEL}`}>Client</p>
          <div className="flex flex-wrap gap-2">
            {lead.customerId ? (
              <a href={buildCustomerHubHref(lead.customerId)} className="ap-btn ap-btn--primary">Veure client</a>
            ) : (
              <button type="button" onClick={handleCreateCustomer} disabled={creating} className="ap-btn ap-btn--primary">
                {creating ? 'Creant...' : 'Crear client'}
              </button>
            )}
            <a href={buildLeadWorkspaceHref(lead.id)} className="ap-btn ap-btn--secondary">Veure lead</a>
          </div>
          {createError && <div className="ap-inline-alert ap-inline-alert--danger mt-2" role="alert">{createError}</div>}
        </div>
        {lead.phone && (
          <div className="border-b border-[var(--line)] px-5 py-4">
            <p className={`mb-3 ${DATA_LABEL}`}>Contacte directe</p>
            <div className="flex flex-wrap gap-2">
              <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--primary">WhatsApp</a>
              <a href={`tel:${lead.phone}`} className="ap-btn ap-btn--secondary">Trucar</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function attachIcon(contentType: string): string {
  const ct = contentType.toLowerCase();
  if (ct.startsWith('image/')) return '🖼';
  if (ct === 'application/pdf') return '📄';
  if (ct.includes('spreadsheet') || ct.includes('excel') || ct.endsWith('.xlsx') || ct.endsWith('.xls')) return '📊';
  if (ct.includes('wordprocessing') || ct.includes('word') || ct.endsWith('.docx') || ct.endsWith('.doc')) return '📝';
  if (ct.startsWith('video/')) return '🎬';
  if (ct.startsWith('audio/')) return '🎵';
  if (ct.includes('zip') || ct.includes('rar') || ct.includes('7z') || ct.includes('tar')) return '🗜';
  return '📎';
}

function formatAttachSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Detall IMAP ───────────────────────────────────────────────────────── */
function ImapDetail({
  email, outbound, loading, folders, special, currentPath,
  onClose, onReply, onReplyAll, onForward, onFlag, onMarkUnread, onMove, onDelete,
}: {
  email: ImapEmail;
  outbound: boolean;
  loading?: boolean;
  folders: FolderInfo[];
  special: SpecialFolders | null;
  currentPath: string;
  onClose: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onFlag: (val: boolean) => void;
  onMarkUnread: () => void;
  onMove: (target: string) => void;
  onDelete: () => void;
}) {
  const [extractOpen, setExtractOpen] = useState(false);
  const display = outbound
    ? ((email.to ?? [])[0]?.name || (email.to ?? [])[0]?.address || '—')
    : (email.from.name || email.from.address);
  const displayAddr = outbound ? ((email.to ?? [])[0]?.address || '') : email.from.address;
  const pill = email.orbita ? buildOrbitaPill(email.orbita) : null;
  const ccList = (email.cc ?? []).map(c => c.name ? `${c.name} <${c.address}>` : c.address).filter(Boolean);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_80%,var(--canvas))] px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--hair-gold)] bg-[color-mix(in_oklab,var(--gold)_20%,var(--raised))] text-base font-bold text-[var(--gold-bright)]">{display.charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-[var(--t)]">{display}</p>
            <p className="truncate text-xs text-[var(--t3)]">{displayAddr}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2.5">
          {!outbound && (
            <button type="button" onClick={onReply} className="ap-btn ap-btn--primary" title="Respondre">✉ Respondre</button>
          )}
          {!outbound && !email.orbita && (
            <button type="button" onClick={() => setExtractOpen(true)} className="ap-btn" title="Crear lead des d'aquest correu">
              ✦ Crear lead
            </button>
          )}
          <div className="flex items-center gap-1 rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] px-2 py-1">
            {!outbound && (
              <button type="button" onClick={onReplyAll} className={ICON_BTN} title="Respondre a tothom" aria-label="Respondre a tothom">↩↩</button>
            )}
            <button type="button" onClick={onForward} className={ICON_BTN} title="Reenviar" aria-label="Reenviar">➡</button>
            <button type="button" onClick={() => onFlag(!email.isFlagged)} className={`${ICON_BTN}${email.isFlagged ? ` ${ICON_BTN_ON}` : ''}`} title={email.isFlagged ? 'Treure marca' : 'Marcar amb estrella'} aria-label={email.isFlagged ? 'Treure marca' : 'Marcar amb estrella'} aria-pressed={email.isFlagged}>
              {email.isFlagged ? '★' : '☆'}
            </button>
            <MoveDropdown folders={folders} special={special} currentPath={currentPath} onMove={onMove} />
            {!outbound && (
              <button type="button" onClick={onMarkUnread} className={ICON_BTN} title="Marcar com no llegit" aria-label="Marcar com a no llegit">○</button>
            )}
          </div>
          <button type="button" onClick={onDelete} className={`${ICON_BTN} border-[color-mix(in_oklab,var(--o-danger)_45%,var(--line))] bg-[var(--o-danger-soft)] text-[var(--o-danger)] hover:border-[var(--o-danger)] hover:bg-[color-mix(in_oklab,var(--o-danger)_25%,var(--panel))] hover:text-[var(--o-danger)]`} title="Esborrar" aria-label="Esborrar correu">🗑</button>
          <button type="button" onClick={onClose} className={CLOSE_BTN} aria-label="Tancar">✕</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {pill && (
          <div className={`mx-5 mt-3.5 flex w-fit items-center gap-2 rounded-[var(--o-r-sm)] border border-[var(--hair-gold)] bg-[color-mix(in_oklab,var(--gold)_6%,var(--panel))] px-3 py-2 text-xs font-semibold text-[var(--t2)]${pill.href ? '' : ' opacity-85'}`} title={pill.hint}>
            🔗 Vincle:
            {pill.href ? (
              <a href={pill.href} className="font-bold text-[var(--gold-bright)] no-underline hover:underline">{pill.label}</a>
            ) : (
              <span className="font-bold text-[var(--t)]">{pill.label}</span>
            )}
            {email.orbita?.source === 'reference' && (
              <span className="text-xs italic text-[var(--t3)]">(detectat per resposta)</span>
            )}
          </div>
        )}
        <div className="border-b border-[var(--line)] px-5 pb-3 pt-4">
          <p className="mb-1.5 text-base font-bold leading-tight text-[var(--t)]">{email.subject}</p>
          <p className="flex items-center gap-2 text-xs text-[var(--t3)]">
            {formatDateTime(email.date)}
            {email.hasAttachments && <span className="text-sm opacity-80">📎</span>}
            {ccList.length > 0 && <span className="block text-[var(--t3)]">CC: {ccList.join(', ')}</span>}
          </p>
        </div>
        <div className="flex flex-1 flex-col p-5">
          {loading ? (
            <p className="text-sm text-[var(--t3)]"><span className={SPIN}>↻</span> Carregant cos del missatge...</p>
          ) : email.bodyHtml ? (
            <iframe srcDoc={email.bodyHtml} sandbox="allow-same-origin" className="block min-h-[30rem] w-full flex-1 rounded-[var(--o-r-sm)] border-0 bg-[var(--ax-light)]" title="Cos del missatge" />
          ) : email.bodyText ? (
            <pre className="m-0 whitespace-pre-wrap break-words bg-transparent text-sm leading-relaxed text-[var(--t2)] [font-family:inherit]">{email.bodyText}</pre>
          ) : (
            <p className="text-sm text-[var(--t3)]">(sense cos de text)</p>
          )}
        </div>
        {!loading && email.attachments && email.attachments.length > 0 && (
          <div className="border-t border-[var(--line)] px-5 pb-5 pt-3.5">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--t3)]">📎 Adjunts ({email.attachments.length})</p>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map(att => {
                const params = new URLSearchParams({
                  folder: currentPath,
                  part: att.partKey,
                  filename: att.filename,
                  contentType: att.contentType,
                });
                return (
                  <a
                    key={att.partKey}
                    href={`/api/admin/inbox/messages/${email.uid}/attachment?${params.toString()}`}
                    className="inline-flex max-w-[15rem] items-center gap-1.5 rounded-[var(--o-r-sm)] border border-[var(--line2)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--t2)] no-underline transition-colors hover:border-[var(--hair-gold)] hover:bg-[var(--raised)] hover:text-[var(--t)]"
                    download={att.filename}
                  >
                    <span className="flex-shrink-0 text-base">{attachIcon(att.contentType)}</span>
                    <span className="flex-1 truncate">{att.filename}</span>
                    {att.size > 0 && (
                      <span className="flex-shrink-0 text-xs text-[var(--t3)]">{formatAttachSize(att.size)}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {extractOpen && (
        <ExtractEmailModal
          email={email}
          onClose={() => setExtractOpen(false)}
          onDone={leadId => {
            setExtractOpen(false);
            window.open(buildLeadWorkspaceHref(leadId), '_blank', 'noopener,noreferrer');
          }}
        />
      )}
    </div>
  );
}
