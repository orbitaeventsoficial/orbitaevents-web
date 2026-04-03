'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import type { BookingFormData, BookingLeadData, BookingSelectedExtras } from './booking-form.types';

interface UseNewBookingSubmitOptions {
  form: BookingFormData;
  selectedExtras: BookingSelectedExtras;
  leadId: string | null;
  leadData: Pick<BookingLeadData, 'customerId'> | null;
  customerId: string | null;
  internalTravelCost: number;
}

export function useNewBookingSubmit({
  form,
  selectedExtras,
  leadId,
  leadData,
  customerId,
  internalTravelCost,
}: UseNewBookingSubmitOptions) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!form.clientName || !form.clientEmail || !form.clientPhone) {
      setError('Nom, email i telèfon són obligatoris');
      return;
    }
    if (!form.packId) {
      setError('Selecciona un pack');
      return;
    }
    if (!form.eventDate || !form.eventLocation) {
      setError('Data i ubicació són obligatoris');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body = {
        leadId: leadId || undefined,
        customerId: leadData?.customerId || customerId || undefined,
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim(),
        clientPhone: form.clientPhone.trim(),
        eventType: form.eventType,
        eventDate: form.eventDate,
        eventStartTime: form.eventStartTime || undefined,
        eventEndTime: form.eventEndTime || undefined,
        eventLocation: form.eventLocation.trim(),
        eventVenue: form.eventVenue.trim() || undefined,
        guestCount: parseInt(form.guestCount, 10) || 100,
        packId: form.packId,
        extraHours: parseInt(form.extraHours, 10) || 0,
        extras: Object.entries(selectedExtras).map(([extraId, extra]) => ({
          extraId,
          quantity: extra.quantity,
          price: extra.price,
        })),
        discount: parseFloat(form.discount) || 0,
        discountCode: form.discountCode.trim() || undefined,
        notes: form.notes.trim() || undefined,
        distanceKm: parseFloat(form.distanceKm) || undefined,
        fuelCostPerKm: parseFloat(form.fuelCostPerKm) || undefined,
        travelCost: internalTravelCost || undefined,
      };

      const res = await fetchWithCsrf('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error creant la reserva');
      }

      const data = await res.json();
      router.push(`/admin/bookings/${data.booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setSubmitting(false);
    }
  }, [customerId, form, internalTravelCost, leadData, leadId, router, selectedExtras]);

  return {
    submitting,
    error,
    setError,
    submit,
  };
}
