'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';

export default function BookingFieldNotesComposer({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePickPhoto = () => {
    if (sending) return;
    fileRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', note.trim());
      formData.append('isPortal', 'false');
      formData.append('isPortfolio', 'false');

      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, {
        method: 'POST',
        body: formData,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'No s\'ha pogut guardar la captura');
      }

      setNote('');
      setSuccess('Captura guardada al bolo');
      router.refresh();
    } catch (uploadError) {
      console.error('Error pujant captura de camp', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : 'Error pujant la captura');
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section className="grid grid-cols-1 items-end gap-3 rounded-[var(--o-r-lg)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] p-3 sm:grid-cols-[1fr_1.5fr_auto]">
      <div className="flex flex-col gap-0.5">
        <div>
          <p className="m-0 mb-1 font-mono text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--t3)]">Field notes</p>
          <h3 className="m-0 text-base font-bold text-[var(--t)]">Foto + nota de bolo</h3>
        </div>
      </div>

      <label className="block min-w-0">
        <span className="m-0 mb-1 block font-mono text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--t3)]">Nota curta</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="Muntatge llest, canvi d'entrada, focus extra..."
          className="adm-input adm-input--textarea w-full"
        />
      </label>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handlePickPhoto}
          disabled={sending}
          className="ap-btn ap-btn--primary ap-btn--xs"
        >
          {sending ? 'Guardant...' : '+ Foto'}
        </button>
      </div>

      {error && <p className="col-span-full m-0 rounded-[var(--o-r-md)] border border-[var(--ax-danger-border)] px-2.5 py-1.5 text-xs font-bold text-[var(--o-danger)]">{error}</p>}
      {success && <p className="col-span-full m-0 rounded-[var(--o-r-md)] border border-[var(--ax-success-border)] px-2.5 py-1.5 text-xs font-bold text-[var(--o-success)]">{success}</p>}
    </section>
  );
}
