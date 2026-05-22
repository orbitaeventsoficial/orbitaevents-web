'use client';

import { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';
import { ComposeModal, QuoteModal } from './InboxModals';
import { resolveImportedLeadHref } from './importNavigation';
import type { LeadData, ImapEmail, UnifiedEmail, InboxStats, QuotePackOption } from './inbox-types';
import {
  InboxDetailPane,
  InboxListPane,
  InboxSidebar,
} from './InboxSections';
import { ADMIN_INBOX_HELP, helpAttrs } from '../components/adminHelpContent';

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
  const [suggestedBody, setSuggestedBody] = useState('');
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();

  const emails = useMemo(() => {
    const leadEmails: UnifiedEmail[] = initialLeads.map((lead) => ({
      id: lead.id,
      type: 'lead' as const,
      from: lead.email,
      fromName: lead.name,
      subject: `📋 ${lead.eventType || 'Sol·licitud'}`,
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

    return [...leadEmails, ...imapUnified].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [initialLeads, imapEmails]);

  const loadImapEmails = useCallback(async () => {
    setLoadingImap(true);
    setImapError(null);
    try {
      const params = new URLSearchParams({ limit: '25', _t: String(Date.now()) });
      const res = await fetchWithCsrf(`/api/admin/inbox/messages?${params}`, { cache: 'no-store' });
      const data = await res.json();
      const message = data?.details ? `${data?.error || 'Error carregant emails'}: ${data.details}` : data?.error || 'Error carregant emails';
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
      console.error('Error carregant correus IMAP a Inbox', error);
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
      log.error('Error loading trash:', error);
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
        return email.from.toLowerCase().includes(queryLower) || email.fromName.toLowerCase().includes(queryLower) || email.subject.toLowerCase().includes(queryLower) || email.preview.toLowerCase().includes(queryLower);
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
          imapData: { ...prev.imapData!, ...detailed },
        };
      });
    } catch (error) {
      log.warn("No s'han pogut carregar els detalls de l'email seleccionat", { error: error instanceof Error ? error.message : String(error) });
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
        body: JSON.stringify({ fallbackEmail: { fromAddress: email.imapData.from.address || email.from, fromName: email.imapData.from.name || email.fromName, subject: email.imapData.subject || email.subject, bodyText: email.imapData.bodyText || email.preview || '' } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.lead?.id) {
        setFlashMessage({ type: 'error', text: data?.error || "No s'ha pogut importar el lead" });
        return;
      }
      setFlashMessage({ type: 'success', text: data.action === 'updated' ? `Entrada actualitzada: ${data.lead.name}` : `Entrada creada: ${data.lead.name}` });
      router.push(resolveImportedLeadHref(data.lead));
      router.refresh();
    } catch (error) {
      log.error('Error importing lead from email:', error);
      setFlashMessage({ type: 'error', text: 'Error important email a lead' });
    }
  }

  async function handleMoveToTrash(email: UnifiedEmail) {
    if (email.type !== 'imap' || !email.imapData?.uid) return;
    const ok = await confirm({ title: 'Moure a paperera', message: 'Segur que vols moure aquest email a la paperera?', confirmLabel: 'Moure', variant: 'warning' });
    if (!ok) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.imapData.uid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'moveToTrash' }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setFlashMessage({ type: 'error', text: data?.error || "No s'ha pogut moure a la paperera" });
        return;
      }
      setImapEmails((prev) => prev.filter((item) => item.uid !== email.imapData!.uid));
      setSelectedEmail((prev) => (prev?.id === email.id ? null : prev));
      setImapUnread((prev) => Math.max(0, prev - (email.read ? 0 : 1)));
      setTrashCount((prev) => prev + 1);
      setTrashEmails([]);
      setFlashMessage({ type: 'success', text: 'Email mogut a la paperera' });
    } catch (error) {
      log.error('Error moving to trash:', error);
      setFlashMessage({ type: 'error', text: 'Error movent a la paperera' });
    }
  }

  async function handleRestoreEmail(email: UnifiedEmail) {
    if (email.type !== 'imap' || !email.imapData?.uid) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.imapData.uid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'restore' }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setFlashMessage({ type: 'error', text: data?.error || "No s'ha pogut restaurar l'email" });
        return;
      }
      setTrashEmails((prev) => prev.filter((item) => item.uid !== email.imapData!.uid));
      setTrashCount((prev) => Math.max(0, prev - 1));
      setSelectedEmail((prev) => (prev?.id === email.id ? null : prev));
      setImapEmails([]);
      setFlashMessage({ type: 'success', text: "Email restaurat a la safata d'entrada" });
    } catch (error) {
      log.error('Error restoring email:', error);
      setFlashMessage({ type: 'error', text: 'Error restaurant email' });
    }
  }

  async function handleDeletePermanently(email: UnifiedEmail) {
    if (email.type !== 'imap' || !email.imapData?.uid) return;
    const ok = await confirm({ title: 'Eliminar permanentment', message: 'Aquesta acció és irreversible. Segur?', confirmLabel: 'Eliminar', variant: 'danger' });
    if (!ok) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/inbox/messages/${email.imapData.uid}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setFlashMessage({ type: 'error', text: data?.error || "No s'ha pogut eliminar l'email" });
        return;
      }
      setTrashEmails((prev) => prev.filter((item) => item.uid !== email.imapData!.uid));
      setTrashCount((prev) => Math.max(0, prev - 1));
      setSelectedEmail((prev) => (prev?.id === email.id ? null : prev));
      setFlashMessage({ type: 'success', text: 'Email eliminat permanentment' });
    } catch (error) {
      log.error('Error deleting email permanently:', error);
      setFlashMessage({ type: 'error', text: 'Error eliminant email' });
    }
  }

  const totalUnread = stats.unreadLeads + imapUnread;

  return (
    <div className="flex-1 flex overflow-hidden" {...helpAttrs(ADMIN_INBOX_HELP.root)}>
      <InboxSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filter={filter}
        setFilter={setFilter}
        emailsCount={emails.length}
        leadsCount={initialLeads.length}
        imapConfigured={imapConfigured}
        imapEmailsCount={imapEmails.length}
        imapUnread={imapUnread}
        trashCount={trashCount}
        totalUnread={totalUnread}
        loadingImap={loadingImap}
        loadingTrash={loadingTrash}
        imapError={imapError}
        loadImapEmails={loadImapEmails}
        loadTrashEmails={loadTrashEmails}
      />
      <InboxListPane
        activeTab={activeTab}
        filter={filter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        flashMessage={flashMessage}
        clearFlashMessage={() => setFlashMessage(null)}
        loadingImap={loadingImap}
        loadingTrash={loadingTrash}
        imapEmailsCount={imapEmails.length}
        trashEmailsCount={trashEmails.length}
        filteredEmails={filteredEmails}
        selectedEmail={selectedEmail}
        handleSelectEmail={handleSelectEmail}
      />
      <InboxDetailPane
        selectedEmail={selectedEmail}
        loadingSelected={loadingSelected}
        activeTab={activeTab}
        handleReply={handleReply}
        handleOpenQuote={() => setShowQuote(true)}
        handleOpenLead={(lead) => router.push(resolveImportedLeadHref(lead))}
        handleImportLeadFromEmail={handleImportLeadFromEmail}
        handleMoveToTrash={handleMoveToTrash}
        handleRestoreEmail={handleRestoreEmail}
        handleDeletePermanently={handleDeletePermanently}
        onApplySuggestion={(text) => {
          setSuggestedBody(text);
          if (selectedEmail) handleReply(selectedEmail);
        }}
      />
      {showCompose && (
        <ComposeModal
          replyTo={replyTo}
          packOptions={quotePacks}
          initialBody={suggestedBody}
          onClose={() => { setShowCompose(false); setReplyTo(null); setSuggestedBody(''); }}
        />
      )}
      <ConfirmDialog {...dialogProps} />
      {showQuote && selectedEmail && (
        <QuoteModal target={selectedEmail} packOptions={quotePacks} onClose={() => setShowQuote(false)} onSent={(message) => setFlashMessage({ type: 'success', text: message })} />
      )}
    </div>
  );
}
