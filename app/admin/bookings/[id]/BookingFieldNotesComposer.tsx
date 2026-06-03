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
    <section className="bd__fieldnotes">
      <div className="bd__fieldnotes-head">
        <div>
          <p className="bd__fieldnotes-kicker">Field notes</p>
          <h3 className="bd__fieldnotes-title">Foto + nota de bolo</h3>
        </div>
      </div>

      <label className="bd__fieldnotes-label">
        <span>Nota curta</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="Muntatge llest, canvi d'entrada, focus extra..."
          className="bd__fieldnotes-textarea"
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

      <div className="bd__fieldnotes-actions">
        <button
          type="button"
          onClick={handlePickPhoto}
          disabled={sending}
          className="bd__btn bd__btn--gold"
        >
          {sending ? 'Guardant...' : '+ Foto'}
        </button>
      </div>

      {error && <p className="bd__fieldnotes-alert bd__fieldnotes-alert--err">{error}</p>}
      {success && <p className="bd__fieldnotes-alert bd__fieldnotes-alert--ok">{success}</p>}
    </section>
  );
}
