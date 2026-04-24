'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { ADMIN_ACTIONS_HELP, helpAttrs } from '../components/adminHelpContent';
import { fetchWithCsrf } from '@/lib/csrf';
import { LEAD_STATUS_OPTIONS, PRIORITY_LABELS } from '@/lib/constants';
import LeadLostStatusPrompt from './LeadLostStatusPrompt';
import { patchLeadStatus, type LeadStatus } from './leadStatusClient';

interface LeadActionsProps {
  leadId: string;
  leadName: string;
  phone?: string | null;
  hasBooking: boolean;
  currentStatus: 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';
  currentPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export default function LeadActions({ leadId, leadName, phone, hasBooking, currentStatus, currentPriority }: LeadActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [priorityUpdating, setPriorityUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showLostPrompt, setShowLostPrompt] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [lostNote, setLostNote] = useState('');
  const { confirm, dialogProps } = useConfirmDialog();

  const handleDelete = async () => {
    if (hasBooking) {
      setActionError(ADMIN_ACTIONS_HELP.lead.removeBlockedBooking);
      return;
    }

    const ok = await confirm({
      title: 'Eliminar entrada',
      message: `Segur que vols eliminar l'entrada "${leadName}"?\n\nAquesta acció no es pot desfer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    setIsDeleting(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error eliminant l'entrada");
      }
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Error eliminant l'entrada");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (nextStatus: LeadStatus) => {
    if (statusUpdating || nextStatus === currentStatus) return;
    if (nextStatus === 'LOST') {
      setShowLostPrompt(true);
      return;
    }
    setStatusUpdating(true);
    try {
      await patchLeadStatus({ leadId, status: nextStatus });
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Error actualitzant l'estat");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLostConfirm = async () => {
    if (!lostReason || statusUpdating) return;
    setStatusUpdating(true);
    try {
      await patchLeadStatus({
        leadId,
        status: 'LOST',
        lostReason,
        note: lostNote,
      });
      setShowLostPrompt(false);
      setLostReason('');
      setLostNote('');
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Error actualitzant l'estat");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePriorityChange = async (nextPriority: LeadActionsProps['currentPriority']) => {
    if (priorityUpdating || nextPriority === currentPriority) return;
    setPriorityUpdating(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: nextPriority }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error actualitzant la prioritat');
      }
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Error actualitzant la prioritat');
    } finally {
      setPriorityUpdating(false);
    }
  };

  const deleteTitle = hasBooking
    ? ADMIN_ACTIONS_HELP.lead.removeBlockedBooking
    : currentStatus !== 'LOST'
      ? ADMIN_ACTIONS_HELP.lead.removeBlockedStatus
      : ADMIN_ACTIONS_HELP.lead.remove.desc;

  return (
    <div className="flex flex-col items-end gap-1">
      {actionError && (
        <div className="ap-card admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger flex items-center gap-2 px-2 py-1 text-[10px]" {...helpAttrs(ADMIN_ACTIONS_HELP.lead.error)}>
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} aria-label="Tancar error">✕</button>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value as LeadActionsProps['currentStatus'])}
          disabled={statusUpdating}
          className="ap-input px-2 py-1.5 text-xs"
          title={ADMIN_ACTIONS_HELP.lead.status.title}
          aria-label={ADMIN_ACTIONS_HELP.lead.status.title}
          {...helpAttrs(ADMIN_ACTIONS_HELP.lead.status)}
        >
          {LEAD_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={currentPriority}
          onChange={(e) => handlePriorityChange(e.target.value as LeadActionsProps['currentPriority'])}
          disabled={priorityUpdating}
          className="ap-input px-2 py-1.5 text-xs"
          title={ADMIN_ACTIONS_HELP.lead.priority.title}
          aria-label={ADMIN_ACTIONS_HELP.lead.priority.title}
          {...helpAttrs(ADMIN_ACTIONS_HELP.lead.priority)}
        >
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {phone && (
          <a
            href={`https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola ${leadName}! Sóc de Òrbita Events, hem rebut la teva sol·licitud i volem ajudar-te a organitzar el teu event.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs"
            title={ADMIN_ACTIONS_HELP.lead.whatsappTitle}
            {...helpAttrs(ADMIN_ACTIONS_HELP.lead.whatsapp)}
          >
            💬 WA
          </a>
        )}
        <Link href={buildLeadWorkspaceHref(leadId)} className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs" {...helpAttrs(ADMIN_ACTIONS_HELP.lead.view)}>
          Veure
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting || hasBooking || currentStatus !== 'LOST'}
          type="button"
          aria-busy={isDeleting}
          className={`ap-btn px-2.5 py-1.5 text-xs ${
            hasBooking || currentStatus !== 'LOST'
              ? 'admin-tone-border-neutral admin-tone-bg-neutral admin-tone-text-neutral cursor-not-allowed'
              : 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger hover:brightness-105'
          }`}
          title={deleteTitle}
          {...helpAttrs(ADMIN_ACTIONS_HELP.lead.remove)}
        >
          {isDeleting ? '...' : '🗑️'}
        </button>
        <ConfirmDialog {...dialogProps} />
      </div>
      <LeadLostStatusPrompt
        open={showLostPrompt}
        lostReason={lostReason}
        note={lostNote}
        saving={statusUpdating}
        title="Per tancar aquesta entrada com a perduda cal deixar motiu i, si cal, context."
        confirmLabel="Guardar pèrdua"
        onLostReasonChange={setLostReason}
        onNoteChange={setLostNote}
        onCancel={() => {
          if (statusUpdating) return;
          setShowLostPrompt(false);
          setLostReason('');
          setLostNote('');
        }}
        onConfirm={handleLostConfirm}
      />
    </div>
  );
}
