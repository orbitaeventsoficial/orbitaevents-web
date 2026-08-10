'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import { DOSSIER_LOCALE_OPTIONS } from '@/lib/constants/dossier-locales';

/**
 * L'idioma decideix en quina llengua li arriben al client els correus, els
 * pressupostos i els dossiers. La reserva en guarda un de propi, però fins ara
 * només es podia veure —mai corregir— des d'aquesta fitxa.
 *
 * La llista viu a `lib/constants/dossier-locales`: la fitxa de client, la
 * d'entrada i aquesta han de parlar del mateix.
 */
const LOCALE_OPTIONS = DOSSIER_LOCALE_OPTIONS;

export default function BookingLocaleSelector({
  bookingId,
  preferredLocale,
}: {
  bookingId: string;
  preferredLocale: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(preferredLocale);
  const [saving, setSaving] = useState(false);

  async function save(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);
    try {
      await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLocale: next }),
      });
      toast.success('Idioma actualitzat.');
      router.refresh();
    } catch (error) {
      console.error('[BookingLocaleSelector] Error saving locale', error);
      toast.error("Error desant l'idioma.");
      setValue(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="bd__field-label">Idioma</p>
      <select
        className="bd__field-val"
        value={value}
        disabled={saving}
        aria-label="Idioma del client"
        onChange={(event) => void save(event.target.value)}
      >
        {LOCALE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
