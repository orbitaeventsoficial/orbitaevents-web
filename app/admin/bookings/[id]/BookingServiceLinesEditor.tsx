'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
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

  const handleChange = (next: BookingServiceLineFormInput[]) => {
    setLines(next);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
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
      console.error('[BookingServiceLinesEditor] Error desant', error);
      toast.error(error instanceof Error ? error.message : 'Error desant les línies.');
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
        >
          {saving ? 'Desant…' : 'Desar línies de servei'}
        </button>
        {dirty && <span className="text-sm admin-tone-text-neutral">Canvis sense desar</span>}
      </div>
    </div>
  );
}
