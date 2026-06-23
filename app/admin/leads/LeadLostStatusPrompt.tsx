'use client';

import { LEAD_LOST_REASONS, LEAD_LOST_REASON_LABELS } from '@/lib/constants/leadLoss';

type LeadLostStatusPromptProps = {
  open: boolean;
  lostReason: string;
  note: string;
  saving?: boolean;
  title?: string;
  confirmLabel?: string;
  onLostReasonChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LeadLostStatusPrompt({
  open,
  lostReason,
  note,
  saving = false,
  title = 'Marca el motiu de pèrdua abans de tancar aquest lead.',
  confirmLabel = 'Confirmar pèrdua',
  onLostReasonChange,
  onNoteChange,
  onCancel,
  onConfirm,
}: LeadLostStatusPromptProps) {
  if (!open) return null;

  return (
    <div className="mt-3 rounded-2xl border admin-tone-border-warning admin-tone-bg-warning p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/75" htmlFor="lead-lost-reason">
            Motiu canònic
          </label>
          <select
            id="lead-lost-reason"
            value={lostReason}
            onChange={(e) => onLostReasonChange(e.target.value)}
            className="ap-input w-full px-3 py-2 text-sm"
          >
            <option value="">Selecciona un motiu</option>
            {LEAD_LOST_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {LEAD_LOST_REASON_LABELS[reason]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-white/75" htmlFor="lead-lost-note">
            Nota interna (opcional)
          </label>
          <textarea
            id="lead-lost-note"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            className="ap-input min-h-[92px] w-full px-3 py-2 text-sm"
            placeholder="Ex: pressupost per sobre del rang indicat, data no compatible, va escollir un altre proveïdor..."
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving || !lostReason}
            className="ap-btn ap-btn--primary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Guardant...' : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="ap-btn ap-btn--secondary px-3 py-2 text-xs disabled:opacity-50"
          >
            Cancel·lar
          </button>
        </div>
      </div>
    </div>
  );
}
