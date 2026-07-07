'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import { collaboratorLineCostErrorMessage, findCollaboratorLinesWithoutCost } from '@/lib/booking-service-line-validation';
import BookingServiceLinesSection from '../BookingServiceLinesSection';
import type { BookingServiceLineFormInput } from '../booking-form.types';

interface BookingServiceLinesEditorProps {
  bookingId: string;
  initialLines: BookingServiceLineFormInput[];
}

export default function BookingServiceLinesEditor({ bookingId, initialLines }: BookingServiceLinesEditorProps) {
  const router = useRouter();
  const toast = useToast();
  const [lines, setLines] = useState<BookingServiceLineFormInput[]>(initialLines);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (next: BookingServiceLineFormInput[]) => {
    setLines(next);
    setDirty(true);
    setError(null);
  };

  const handleSave = async () => {
    const missingCost = findCollaboratorLinesWithoutCost(lines)[0];
    if (missingCost) {
      const message = collaboratorLineCostErrorMessage(missingCost);
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceLines: lines }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No s\'ha pogut desar');
      }
      toast.success('Línies de servei desades. El total i el marge s\'han recalculat.');
      setDirty(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desant les línies.';
      console.error('[BookingServiceLinesEditor] Error desant', error);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BookingServiceLinesSection lines={lines} onChange={handleChange} />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          className="ap-btn ap-btn--primary px-4 py-2 text-sm disabled:opacity-50"
          onClick={handleSave}
          disabled={saving || !dirty}
          aria-invalid={error ? true : undefined}
        >
          {saving ? 'Desant…' : 'Desar línies de servei'}
        </button>
        {dirty && <span className="text-sm admin-tone-text-neutral">Canvis sense desar</span>}
      </div>
      {error && (
        <p role="alert" className="mt-2 rounded-xl border admin-tone-border-danger px-3 py-2 text-sm font-semibold admin-tone-text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
