'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatDate, formatDateShort, formatDateTime } from '@/lib/constants';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';

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

type ImapEmailAddr = { name: string; address: string };

type OrbitaLink = {
  kind: 'lead' | 'customer' | 'booking' | 'dossier' | 'admin';
  id: string;
  origin?: string;
  source: 'header' | 'reference';
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
        if (res.ok) {
          updateLocalStatus(lead.id, 'CONTACTED');
          setLocalStats(prev => ({ ...prev, unreadLeads: Math.max(0, prev.unreadLeads - 1) }));
        }
      } catch { /* silenci */ }
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
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) {
        console.error('[Safata] Bulk action error:', data.error);
        return;
      }
      // Invalida tant la carpeta origen com la target
      invalidateFolder(folder);
      if (targetFolder) invalidateFolder(targetFolder);
      clearSelection();
      setSelectedImap(null);
      loadFolders(); // refresh comptadors
    } catch (err) {
      console.error('[Safata] Bulk action error:', err);
    }
  };

  /**
   * Quan es clica un email de la llista, el cos no està descarregat (la llista
   * només té envelope). Carreguem el cos amb fetchEmailByUid via GET /messages/[uid].
   * Si el folder és outbound, no auto-marquem com llegit (els enviats ja són
   * "llegits" per definició).
   */
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

  const setFlagSingle = async (email: ImapEmail, flag: boolean) => {
    if (active.kind !== 'folder') return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: flag ? 'flag' : 'unflag', folder: active.path }),
      });
      if (res.ok) {
        setEmailsByFolder(prev => ({
          ...prev,
          [active.path]: (prev[active.path] || []).map(e => e.uid === email.uid ? { ...e, isFlagged: flag } : e),
        }));
        setSelectedImap(prev => prev?.uid === email.uid ? { ...prev, isFlagged: flag } : prev);
      }
    } catch (err) { console.error('[Safata] setFlag error:', err); }
  };

  const markUnread = async (email: ImapEmail) => {
    if (active.kind !== 'folder') return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markUnread', folder: active.path }),
      });
      if (res.ok) {
        setEmailsByFolder(prev => ({
          ...prev,
          [active.path]: (prev[active.path] || []).map(e => e.uid === email.uid ? { ...e, isRead: false } : e),
        }));
        setSelectedImap(null);
        loadFolders();
      }
    } catch (err) { console.error('[Safata] markUnread error:', err); }
  };

  const deleteSingle = async (email: ImapEmail) => {
    if (active.kind !== 'folder') return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.uid}?folder=${encodeURIComponent(active.path)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moveToTrash', folder: active.path }),
      });
      if (res.ok) {
        invalidateFolder(active.path);
        if (special?.trash) invalidateFolder(special.trash);
        setSelectedImap(null);
        loadFolders();
      }
    } catch (err) { console.error('[Safata] delete error:', err); }
  };

  const moveSingle = async (email: ImapEmail, targetFolder: string) => {
    if (active.kind !== 'folder') return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moveTo', folder: active.path, targetFolder }),
      });
      if (res.ok) {
        invalidateFolder(active.path);
        invalidateFolder(targetFolder);
        setSelectedImap(null);
        loadFolders();
      }
    } catch (err) { console.error('[Safata] move error:', err); }
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
  const inboxUnread = useMemo(() => {
    if (!special) return 0;
    const f = folders.find(x => x.path === special.inbox);
    return f?.unread ?? 0;
  }, [folders, special]);

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
    ? 'Entrades web'
    : (specialFolders.find(f => f.path === active.path)?.iconKey
        ? FOLDER_LABELS[specialFolders.find(f => f.path === active.path)!.iconKey]
        : (active.kind === 'folder' ? active.path : ''));

  const paneCount = active.kind === 'leads' ? filteredLeads.length : filteredEmails.length;
  const hasSelected = (active.kind === 'leads' && !!selectedLead) || (active.kind === 'folder' && !!selectedImap);

  return (
    <div className="sf">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="sf__sidebar">
        <div className="sf__sidebar-brand">
          <span className="sf__eyebrow">Comunicació</span>
          <h1 className="sf__title">Safata</h1>
        </div>

        <nav className="sf__nav">
          <div className="sf__navgroup">
            <span className="sf__navgroup-label">Web</span>
            <button type="button"
              className={`sf__navitem${active.kind === 'leads' ? ' is-on' : ''}`}
              onClick={() => handleTabChange({ kind: 'leads' })}>
              <span className="sf__navitem-icon">📬</span>
              <span className="sf__navitem-label">Entrades</span>
              {localStats.unreadLeads > 0 && <span className="sf__navitem-badge">{localStats.unreadLeads}</span>}
            </button>
          </div>

          {imapConfigured && (
            <div className="sf__navgroup">
              <span className="sf__navgroup-label">Bústia</span>
              {foldersError && <p className="sf__navgroup-error">{foldersError}</p>}
              {specialFolders.map(f => (
                <button key={f.path} type="button"
                  className={`sf__navitem${active.kind === 'folder' && active.path === f.path ? ' is-on' : ''}`}
                  onClick={() => handleTabChange({ kind: 'folder', path: f.path, specialUse: f.iconKey })}>
                  <span className="sf__navitem-icon">{ICONS[f.iconKey]}</span>
                  <span className="sf__navitem-label">{FOLDER_LABELS[f.iconKey]}</span>
                  {f.unread > 0 && <span className="sf__navitem-badge">{f.unread}</span>}
                </button>
              ))}
            </div>
          )}

          {imapConfigured && customFolders.length > 0 && (
            <div className="sf__navgroup">
              <span className="sf__navgroup-label">Carpetes</span>
              {customFolders.map(f => (
                <button key={f.path} type="button"
                  className={`sf__navitem${active.kind === 'folder' && active.path === f.path ? ' is-on' : ''}`}
                  onClick={() => handleTabChange({ kind: 'folder', path: f.path })}>
                  <span className="sf__navitem-icon">{ICONS.custom}</span>
                  <span className="sf__navitem-label" title={f.path}>{f.name}</span>
                  {f.unread > 0 && <span className="sf__navitem-badge">{f.unread}</span>}
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="sf__sidebar-foot">
          <button type="button"
            className="sf__compose-trigger sf__compose-trigger--full"
            onClick={() => setComposerOpen({ mode: 'new' })}>
            ✉ Nou correu
          </button>
          <a href="/admin/inbox/settings" className="sf__navitem">
            <span className="sf__navitem-icon">⚙</span>
            <span className="sf__navitem-label">Configuració</span>
          </a>
        </div>
      </aside>

      {/* ── Pane (llista) ────────────────────────────────────────────────── */}
      <div className="sf__pane">
        <div className="sf__pane-head">
          {active.kind === 'folder' && filteredEmails.length > 0 && (
            <input
              type="checkbox"
              className="sf__pane-checkbox"
              aria-label="Seleccionar tots"
              checked={selectedUids.size > 0 && selectedUids.size === filteredEmails.length}
              ref={el => { if (el) el.indeterminate = selectedUids.size > 0 && selectedUids.size < filteredEmails.length; }}
              onChange={e => e.target.checked ? selectAllVisible(filteredEmails.map(x => x.uid)) : clearSelection()}
            />
          )}
          <span className="sf__pane-title">{paneTitle}</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="sf__sort-select"
            aria-label="Ordenar per"
          >
            <option value="data-desc">Data ↓</option>
            <option value="data-asc">Data ↑</option>
            <option value="unread">No llegits</option>
            <option value="remitent">Remitent A-Z</option>
          </select>
          {active.kind === 'folder' && (
            <button type="button" className="sf__pane-refresh" aria-label="Refrescar"
              onClick={() => { invalidateFolder(active.path); loadFolders(); }}
              title="Refrescar carpeta">↻</button>
          )}
          <span className="sf__pane-count">{paneCount}</span>
        </div>

        {active.kind === 'folder' && selectedUids.size > 0 && (
          <div className="sf__pane-actions" role="toolbar" aria-label="Accions en lot">
            <span className="sf__pane-actions-count">{selectedUids.size} seleccionat{selectedUids.size === 1 ? '' : 's'}</span>
            <button type="button" onClick={() => doBulk('markRead')} className="sf__action-btn sf__action-btn--ghost sf__action-btn--sm">● Llegit</button>
            <button type="button" onClick={() => doBulk('markUnread')} className="sf__action-btn sf__action-btn--ghost sf__action-btn--sm">○ No llegit</button>
            <button type="button" onClick={() => doBulk('flag')} className="sf__action-btn sf__action-btn--ghost sf__action-btn--sm">★ Marcar</button>
            <button type="button" onClick={() => doBulk('unflag')} className="sf__action-btn sf__action-btn--ghost sf__action-btn--sm">☆ Treure</button>
            <MoveDropdown folders={folders} special={special} currentPath={active.path}
              onMove={target => doBulk('moveTo', target)} />
            <button type="button" onClick={() => doBulk('delete')} className="sf__action-btn sf__action-btn--ghost sf__action-btn--sm">🗑 Esborrar</button>
            <button type="button" onClick={clearSelection} className="sf__action-btn sf__action-btn--ghost sf__action-btn--sm">✕</button>
          </div>
        )}

        <div className="sf__search">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={outbound ? 'Cercar destinatari o assumpte...' : 'Cercar remitent o assumpte...'}
            aria-label="Cercar"
            className="sf__searchinput"
          />
        </div>

        <div className="sf__pane-list">
          {/* Entrades web */}
          {active.kind === 'leads' && (
            filteredLeads.length === 0 ? (
              <div className="sf__empty">
                <span className="sf__empty-icon">📭</span>
                <p className="sf__empty-title">Cap entrada</p>
              </div>
            ) : filteredLeads.map(lead => (
              <button key={lead.id} type="button" onClick={() => handleSelectLead(lead)}
                className={['sf__lead', selectedLead?.id === lead.id ? 'is-selected' : '', lead.status === 'NEW' ? 'is-unread' : ''].filter(Boolean).join(' ')}>
                <div className="sf__lead-row">
                  {lead.status === 'NEW' && <span className="sf__lead-dot" aria-label="Nova" />}
                  <span className="sf__lead-name">{lead.name}</span>
                  <span className="sf__lead-date">{formatDateShort(lead.createdAt)}</span>
                </div>
                <p className="sf__lead-preview">
                  {lead.eventType ?? '—'}{lead.eventDate ? ` · ${formatDate(lead.eventDate)}` : ''}
                </p>
              </button>
            ))
          )}

          {/* Carpeta IMAP */}
          {active.kind === 'folder' && (
            currentFolderState?.loading && filteredEmails.length === 0 ? (
              <div className="sf__empty"><span className="sf__empty-icon sf__spin">↻</span><p className="sf__empty-title">Carregant...</p></div>
            ) : currentFolderState?.error ? (
              <div className="sf__empty">
                <p className="sf__empty-title sf__empty-title--error">{currentFolderState.error}</p>
                <button type="button" onClick={() => loadFolderEmails(active.path, 0)} className="sf__action-btn sf__action-btn--ghost">Reintentar</button>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="sf__empty"><span className="sf__empty-icon">{outbound ? '📤' : '📭'}</span><p className="sf__empty-title">{outbound ? 'Cap email enviat' : 'Cap correu'}</p></div>
            ) : <>
              {filteredEmails.map(email => {
                const isSelected = selectedImap?.id === email.id;
                const checked = selectedUids.has(email.uid);
                const display = outbound
                  ? ((email.to ?? [])[0]?.name || (email.to ?? [])[0]?.address || '—')
                  : (email.from.name || email.from.address);
                const pill = email.orbita ? buildOrbitaPill(email.orbita) : null;
                return (
                  <div key={email.id} className={['sf__lead', isSelected ? 'is-selected' : '', !email.isRead && !outbound ? 'is-unread' : ''].filter(Boolean).join(' ')}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(email.uid)}
                      className="sf__lead-checkbox"
                      aria-label="Seleccionar"
                      onClick={e => e.stopPropagation()}
                    />
                    <button type="button" onClick={() => handleSelectImap(email)} className="sf__lead-body">
                      <div className="sf__lead-row">
                        {!email.isRead && !outbound && <span className="sf__lead-dot" aria-label="No llegit" />}
                        {email.isFlagged && <span className="sf__lead-flag is-on" aria-label="Marcat">★</span>}
                        <span className="sf__lead-name">{display}</span>
                        <span className="sf__lead-date">{formatDateShort(email.date)}</span>
                      </div>
                      <p className="sf__lead-preview">
                        {email.subject}
                        {email.hasAttachments && <span className="sf__lead-attach"> 📎</span>}
                        {pill && <span className="sf__lead-badge" title={pill.hint}>🔗 {pill.label}</span>}
                      </p>
                    </button>
                    <div className="sf__lead-quickacts">
                      <button type="button"
                        className={`sf__iconbtn${email.isFlagged ? ' is-on' : ''}`}
                        title={email.isFlagged ? 'Treure marca' : 'Marcar'}
                        onClick={e => { e.stopPropagation(); setFlagSingle(email, !email.isFlagged); }}>
                        {email.isFlagged ? '★' : '☆'}
                      </button>
                      <button type="button"
                        className="sf__iconbtn sf__iconbtn--danger"
                        title="Esborrar"
                        onClick={e => { e.stopPropagation(); deleteSingle(email); }}>
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
              {currentFolderState?.hasMore && (
                <button type="button" onClick={() => loadFolderEmails(active.path, currentFolderState.offset, true)}
                  disabled={currentFolderState.loading} className="sf__load-more">
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
          onClose={() => setSelectedLead(null)}
          onStatusChange={updateLocalStatus}
          onCustomerCreated={cid => setSelectedLead(prev => prev ? { ...prev, customerId: cid } : prev)}
          onCompose={() => setComposerOpen({ mode: 'lead-reply', lead: selectedLead })}
        />
      ) : active.kind === 'folder' && selectedImap ? (
        <ImapDetail
          email={selectedImap}
          outbound={outbound}
          loading={detailLoading}
          folders={folders}
          special={special}
          currentPath={active.path}
          onClose={() => setSelectedImap(null)}
          onReply={() => setComposerOpen({ mode: 'reply', email: selectedImap })}
          onReplyAll={() => setComposerOpen({ mode: 'reply-all', email: selectedImap })}
          onForward={() => setComposerOpen({ mode: 'forward', email: selectedImap })}
          onFlag={(val) => setFlagSingle(selectedImap, val)}
          onMarkUnread={() => markUnread(selectedImap)}
          onMove={(target) => moveSingle(selectedImap, target)}
          onDelete={() => deleteSingle(selectedImap)}
        />
      ) : !hasSelected && !composerOpen ? (
        <div className="sf__detail-blank">
          <span className="sf__detail-blank-icon">
            {outbound ? '📤' : active.kind === 'folder' ? '📨' : '📬'}
          </span>
          <p className="sf__detail-blank-title">
            Selecciona un {outbound ? 'enviat' : 'correu'}
          </p>
          <p className="sf__detail-blank-body">El contingut del missatge apareixerà aquí.</p>
        </div>
      ) : null}

      {/* ── Composer modal ─────────────────────────────────────────────── */}
      {composerOpen && (
        <Composer
          mode={composerOpen.mode}
          email={composerOpen.email}
          lead={composerOpen.lead}
          draftsAvailable={!!special?.drafts}
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
    <div className="sf__modal-backdrop" role="dialog" aria-modal="true" aria-label="Extreure dades del correu">
      <div className="sf__modal sf__extract-modal">
        <div className="sf__modal-head">
          <span className="sf__modal-title">✦ Crear lead des del correu</span>
          <button type="button" onClick={onClose} className="sf__detail-close" aria-label="Tancar">✕</button>
        </div>
        <div className="sf__modal-body">
          <div className="sf__extract-fields">
            <div className="sf__extract-row">
              <span className="sf__extract-lbl">Nom</span>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="sf__extract-input" aria-label="Nom" />
            </div>
            <div className="sf__extract-row">
              <span className="sf__extract-lbl">Email</span>
              <input type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} className="sf__extract-input" aria-label="Email" />
            </div>
            <div className="sf__extract-row">
              <span className="sf__extract-lbl">Telèfon</span>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="sf__extract-input" placeholder="Opcional" aria-label="Telèfon" />
            </div>
            <div className="sf__extract-row">
              <span className="sf__extract-lbl">Tipus d&apos;event</span>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className="sf__extract-select" aria-label="Tipus d'event">
                {Object.entries(EVENT_TYPES_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="sf__extract-row" style={{ gridTemplateColumns: '130px 1fr', alignItems: 'start' }}>
              <span className="sf__extract-lbl" style={{ paddingTop: 12 }}>Missatge</span>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="sf__extract-input"
                rows={4}
                aria-label="Missatge"
              />
            </div>
          </div>
          <p className="sf__extract-hint">
            Es crearà un lead amb estat CONTACTED i s&apos;intentarà vincular al client existent.
          </p>
          {error && <p className="sf__action-error" style={{ padding: '8px 16px' }}>{error}</p>}
        </div>
        <div className="sf__modal-footer">
          <button type="button" onClick={handleCreate} disabled={saving || !name.trim() || !emailVal.trim()} className="sf__action-btn sf__action-btn--primary">
            {saving ? 'Creant...' : 'Crear lead'}
          </button>
          <button type="button" onClick={onClose} className="sf__action-btn sf__action-btn--ghost">Cancel·lar</button>
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
  return (
    <div className="sf__move-wrap">
      <button type="button" onClick={() => setOpen(o => !o)} className="sf__action-btn sf__action-btn--ghost sf__action-btn--sm">
        📁 Moure
      </button>
      {open && (
        <div className="sf__move-menu" role="menu">
          {special?.inbox && special.inbox !== currentPath && (
            <button type="button" onClick={() => { onMove(special.inbox); setOpen(false); }} className="sf__move-item">
              📥 Entrada
            </button>
          )}
          {special?.archive && special.archive !== currentPath && (
            <button type="button" onClick={() => { onMove(special.archive!); setOpen(false); }} className="sf__move-item">
              📦 Arxiu
            </button>
          )}
          {targets.filter(t => !t.specialUse).map(t => (
            <button key={t.path} type="button" onClick={() => { onMove(t.path); setOpen(false); }} className="sf__move-item">
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
  mode, email, lead, draftsAvailable, onClose, onSent,
}: {
  mode: 'new' | 'reply' | 'reply-all' | 'forward' | 'lead-reply';
  email?: ImapEmail;
  lead?: SafataLead;
  draftsAvailable: boolean;
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
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error || 'Error enviant');
        setSending(false);
        return;
      }
      setSuccess({ ok: true, folder: 'Enviat', smtp: 'OK' });
      setTimeout(onSent, 1200);
    } catch (err) {
      console.error('[Composer] Error:', err);
      setError('Error de connexió');
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
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) { setError(data.error || 'Error desant esborrany'); return; }
      onClose();
    } catch (err) {
      console.error('[Composer] Draft error:', err);
      setError('Error de connexió');
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

  return (
    <div className="sf__modal-backdrop" role="dialog" aria-modal="true" aria-label={titleByMode[mode]}>
      <div className="sf__modal">
        <div className="sf__modal-head">
          <span className="sf__modal-title">{titleByMode[mode]}</span>
          <button type="button" onClick={onClose} className="sf__detail-close" aria-label="Tancar">✕</button>
        </div>
        <div className="sf__modal-body">
          {(mode === 'lead-reply' || mode === 'new') && (
            <div className="sf__compose-tpls">
              {TPLS.map(t => (
                <button key={t.key} type="button" onClick={() => selectTpl(t.key)} className={`sf__compose-tpl${tpl === t.key ? ' is-on' : ''}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <input type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="Per a..." aria-label="Per a" className="sf__compose-subject" />
          {showCc ? (
            <input type="text" value={cc} onChange={e => setCc(e.target.value)} placeholder="CC (separa amb comes)" aria-label="CC" className="sf__compose-subject sf__compose-cc" />
          ) : (
            <button type="button" onClick={() => setShowCc(true)} className="sf__compose-cc-toggle">+ CC</button>
          )}
          {showBcc ? (
            <input type="text" value={bcc} onChange={e => setBcc(e.target.value)} placeholder="CCO" aria-label="CCO" className="sf__compose-subject sf__compose-cc" />
          ) : (
            <button type="button" onClick={() => setShowBcc(true)} className="sf__compose-cc-toggle">+ CCO</button>
          )}
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assumpte" aria-label="Assumpte" className="sf__compose-subject" />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Escriu el missatge..." aria-label="Cos del mail" className="sf__compose-body" />
          {error && <p className="sf__action-error">{error}</p>}
          {success && (
            <div className="sf__send-ok">
              ✓ Enviat correctament — {success.folder ? `arxivat a ${success.folder}` : 'sense arxiu a Sent'}
            </div>
          )}
        </div>
        <div className="sf__modal-footer">
          <button type="button" onClick={handleSend} disabled={sending || !to.trim() || !subject.trim() || !body.trim()} className="sf__action-btn sf__action-btn--primary">
            {sending ? 'Enviant...' : 'Enviar'}
          </button>
          {draftsAvailable && (
            <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="sf__action-btn sf__action-btn--ghost">
              {savingDraft ? 'Desant...' : 'Desar esborrany'}
            </button>
          )}
          <a href={lead?.id ? `/admin/inbox/compose?leadId=${lead.id}` : '/admin/inbox/compose'} className="sf__action-btn sf__action-btn--ghost" title="Composer complet (pressupost, adjunts)">
            Composer complet ↗
          </a>
          <button type="button" onClick={onClose} className="sf__action-btn sf__action-btn--ghost">Cancel·lar</button>
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
          <button type="button" onClick={onCompose} className="sf__compose-trigger">✉ Respondre</button>
          <button type="button" onClick={onClose} className="sf__detail-close" aria-label="Tancar">✕</button>
        </div>
      </div>
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
    <div className="sf__detail">
      <div className="sf__detail-head">
        <div className="sf__detail-sender">
          <div className="sf__detail-avatar">{display.charAt(0).toUpperCase()}</div>
          <div className="sf__detail-senderinfo">
            <p className="sf__detail-sendername">{display}</p>
            <p className="sf__detail-senderaddr">{displayAddr}</p>
          </div>
        </div>
        <div className="sf__detail-headactions">
          {!outbound && (
            <button type="button" onClick={onReply} className="sf__compose-trigger" title="Respondre">✉ Respondre</button>
          )}
          {!outbound && !email.orbita && (
            <button type="button" onClick={() => setExtractOpen(true)} className="sf__extract-btn" title="Crear lead des d'aquest correu">
              ✦ Crear lead
            </button>
          )}
          <div className="sf__detail-acts-group">
            {!outbound && (
              <button type="button" onClick={onReplyAll} className="sf__iconbtn" title="Respondre a tothom">↩↩</button>
            )}
            <button type="button" onClick={onForward} className="sf__iconbtn" title="Reenviar">➡</button>
            <button type="button" onClick={() => onFlag(!email.isFlagged)} className={`sf__iconbtn${email.isFlagged ? ' is-on' : ''}`} title={email.isFlagged ? 'Treure marca' : 'Marcar amb estrella'}>
              {email.isFlagged ? '★' : '☆'}
            </button>
            <MoveDropdown folders={folders} special={special} currentPath={currentPath} onMove={onMove} />
            {!outbound && (
              <button type="button" onClick={onMarkUnread} className="sf__iconbtn" title="Marcar com no llegit">○</button>
            )}
            <button type="button" onClick={onDelete} className="sf__iconbtn sf__iconbtn--danger" title="Esborrar">🗑</button>
          </div>
          <button type="button" onClick={onClose} className="sf__detail-close" aria-label="Tancar">✕</button>
        </div>
      </div>

      <div className="sf__detail-scroll">
        {pill && (
          <div className={`sf__detail-pill${pill.href ? '' : ' is-static'}`} title={pill.hint}>
            🔗 Vincle:
            {pill.href ? (
              <a href={pill.href} className="sf__detail-pill-link">{pill.label}</a>
            ) : (
              <span className="sf__detail-pill-text">{pill.label}</span>
            )}
            {email.orbita?.source === 'reference' && (
              <span className="sf__detail-pill-hint">(detectat per resposta)</span>
            )}
          </div>
        )}
        <div className="sf__imap-subjectbar">
          <p className="sf__imap-subject">{email.subject}</p>
          <p className="sf__imap-meta">
            {formatDateTime(email.date)}
            {email.hasAttachments && <span className="sf__imap-attach">📎</span>}
            {ccList.length > 0 && <span className="sf__imap-cc">CC: {ccList.join(', ')}</span>}
          </p>
        </div>
        <div className="sf__imap-body">
          {loading ? (
            <p className="sf__imap-text-empty"><span className="sf__spin">↻</span> Carregant cos del missatge...</p>
          ) : email.bodyHtml ? (
            <iframe srcDoc={email.bodyHtml} sandbox="allow-same-origin" className="sf__imap-iframe" title="Cos del missatge" />
          ) : email.bodyText ? (
            <pre className="sf__imap-text">{email.bodyText}</pre>
          ) : (
            <p className="sf__imap-text-empty">(sense cos de text)</p>
          )}
        </div>
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
