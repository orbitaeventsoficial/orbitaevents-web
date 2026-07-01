'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import type { CanviValidation } from '@/lib/services/protocolValidationsService';
import { formatDateTimeFull } from '@/lib/constants';

interface ProtocolValidationToggleProps {
  canviN: number;
  validation?: CanviValidation | null;
}

export default function ProtocolValidationToggle({
  canviN,
  validation,
}: ProtocolValidationToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState(validation?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const isValidated = Boolean(validation);

  const handleValidate = async () => {
    setError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/protocol/validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canviN,
          notes: note.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'No s\'ha pogut marcar la validació humana');
      }
      startTransition(() => router.refresh());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error validant el canvi');
    }
  };

  const handleRemove = async () => {
    setError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/protocol/validations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canviN }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'No s\'ha pogut desfer la validació humana');
      }
      startTransition(() => router.refresh());
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Error desfent la validació');
    }
  };

  return (
    <section className={`mt-3 ap-card p-3 ${isValidated ? 'admin-tone-border-success admin-tone-bg-success' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Validació humana</p>
          {validation ? (
            <p className="text-sm admin-tone-text-success">
              Validat per {validation.validatedBy} · {formatDateTimeFull(validation.validatedAt)}
            </p>
          ) : (
            <p className="text-sm opacity-70">Encara no consta com a validat per una persona.</p>
          )}
        </div>
        <button
          type="button"
          onClick={isValidated ? handleRemove : handleValidate}
          disabled={isPending}
          className={isValidated ? 'ap-btn-secondary text-xs' : 'ap-btn-primary text-xs'}
        >
          {isPending ? 'Guardant...' : isValidated ? 'Desfer validació' : 'Marcar validació humana'}
        </button>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider opacity-60">Nota curta</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Ex.: revisat en mòbil, CTA clar, flux entenedor, text OK..."
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--sunk)] px-3 py-2 text-sm placeholder:text-[var(--t3)]"
        />
      </label>

      {validation?.notes ? (
        <p className="mt-2 text-xs opacity-70">Nota registrada: {validation.notes}</p>
      ) : null}
      {error ? (
        <p className="mt-2 rounded-xl border admin-tone-border-danger px-3 py-2 text-xs admin-tone-text-danger">{error}</p>
      ) : null}
    </section>
  );
}
