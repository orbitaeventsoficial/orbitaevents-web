'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/admin/components/ToastProvider';
import { LEAD_STATUS_OPTIONS } from '@/lib/constants';
import { log } from '@/lib/logger';
import LeadLostStatusPrompt from './LeadLostStatusPrompt';
import { patchLeadStatus, type LeadStatus } from './leadStatusClient';

export default function LeadQuickStatus({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: LeadStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [showLostPrompt, setShowLostPrompt] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [lostNote, setLostNote] = useState('');

  const onChange = async (nextStatus: LeadStatus) => {
    if (saving || nextStatus === currentStatus) return;
    if (nextStatus === 'LOST') {
      setShowLostPrompt(true);
      return;
    }
    setSaving(true);
    try {
      await patchLeadStatus({ leadId, status: nextStatus });
      router.refresh();
    } catch (error) {
      log.error('[LeadQuickStatus] Error canviant estat', error);
      toast.error(error instanceof Error ? error.message : 'Error canviant l\'estat');
    } finally {
      setSaving(false);
    }
  };

  const confirmLostStatus = async () => {
    if (!lostReason || saving) return;
    setSaving(true);
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
      log.error('[LeadQuickStatus] Error marcant lead com a perdut', error);
      toast.error(error instanceof Error ? error.message : 'Error canviant l\'estat');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <select
        value={currentStatus}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
        disabled={saving}
        className="rounded-xl border px-2 py-1 text-xs"
        title="Canviar estat"
        aria-label="Canviar estat"
      >
        {LEAD_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <LeadLostStatusPrompt
        open={showLostPrompt}
        lostReason={lostReason}
        note={lostNote}
        saving={saving}
        title="Per marcar aquest lead com a perdut cal classificar-ne el motiu."
        confirmLabel="Marcar perdut"
        onLostReasonChange={setLostReason}
        onNoteChange={setLostNote}
        onCancel={() => {
          if (saving) return;
          setShowLostPrompt(false);
          setLostReason('');
          setLostNote('');
        }}
        onConfirm={confirmLostStatus}
      />
    </div>
  );
}



