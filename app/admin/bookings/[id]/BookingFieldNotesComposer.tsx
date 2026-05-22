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
    <section className="rounded-xl border p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide">Field Notes</p>
        <h3 className="mt-1 text-base font-semibold">Foto + nota ràpida des del bolo</h3>
        <p className="mt-1 text-sm opacity-70">
          Obre la càmera del mòbil, captura una incidència o un moment clau i desa una nota curta a la reserva.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-wide opacity-70">Nota curta</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Ex.: muntatge llest, canvi d’entrada de càrrega, focus extra, petició del client..."
          className="w-full rounded-xl border px-3 py-2 text-sm"
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePickPhoto}
          disabled={sending}
          className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {sending ? 'Guardant...' : 'Obrir càmera / pujar foto'}
        </button>
        <span className="text-xs opacity-60">La captura queda interna per defecte: no va ni al portal ni al portfolio.</span>
      </div>

      {error && <p className="rounded-xl border border-rose-500/20 px-3 py-2 text-sm text-rose-300">{error}</p>}
      {success && <p className="rounded-xl border border-emerald-500/20 px-3 py-2 text-sm text-emerald-300">{success}</p>}
    </section>
  );
}
