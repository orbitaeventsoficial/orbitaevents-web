'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import type { BookingFormData, BookingLeadData, BookingSelectedExtras, BookingServiceLineFormInput } from './booking-form.types';

interface UseNewBookingSubmitOptions {
  form: BookingFormData;
  selectedExtras: BookingSelectedExtras;
  leadId: string | null;
  leadData: Pick<BookingLeadData, 'customerId'> | null;
  customerId: string | null;
  sourceCollaboratorId?: string | null;
  internalTravelCost: number;
  customPackPrice?: number;
  manualTotalPrice?: number;
  invoiceRequired?: boolean;
  /** Línies de servei explícites (editor obert). Si s'informen, tenen prioritat
   *  sobre les derivades del relationshipContext (sistema antic). */
  serviceLines?: BookingServiceLineFormInput[];
  /** Partner que factura el bolo (si no és el client final). */
  billedCollaboratorId?: string;
  relationshipContext?: {
    mode: string;
    partnerId?: string;
    partnerLabel?: string;
    orbitaDjAmount?: string;
    orbitaTechAmount?: string;
    partnerRole?: string;
    partnerCostAmount?: string;
  };
}

function parsePositiveMoney(value?: string) {
  const amount = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

function buildServiceLines(input?: UseNewBookingSubmitOptions['relationshipContext']): BookingServiceLineFormInput[] {
  if (!input || input.mode === 'DIRECT_CLIENT') return [];
  const lines: BookingServiceLineFormInput[] = [];
  const djAmount = parsePositiveMoney(input.orbitaDjAmount);
  const techAmount = parsePositiveMoney(input.orbitaTechAmount);
  const partnerCost = parsePositiveMoney(input.partnerCostAmount);
  const partnerLabel = input.partnerLabel || 'Partner';

  if ((input.mode === 'PARTNER_HIRES_ORBITA' || input.mode === 'MIXED_PARTNER') && djAmount) {
    lines.push({ kind: 'DJ', label: 'DJ Orbita', revenueAmount: djAmount, quantity: 1 });
  }

  if ((input.mode === 'PARTNER_HIRES_ORBITA' || input.mode === 'MIXED_PARTNER') && techAmount) {
    lines.push({ kind: 'SOUND_TECH', label: 'Tecnic de so Orbita', revenueAmount: techAmount, quantity: 1 });
  }

  if ((input.mode === 'ORBITA_HIRES_PARTNER' || input.mode === 'MIXED_PARTNER') && partnerCost) {
    lines.push({
      collaboratorId: input.partnerId || undefined,
      kind: 'PROVIDER_SERVICE',
      label: input.partnerRole || `Servei ${partnerLabel}`,
      costAmount: partnerCost,
      quantity: 1,
    });
  }

  return lines;
}

export function useNewBookingSubmit({
  form,
  selectedExtras,
  leadId,
  leadData,
  customerId,
  sourceCollaboratorId,
  internalTravelCost,
  customPackPrice,
  manualTotalPrice,
  invoiceRequired = false,
  serviceLines: explicitServiceLines,
  billedCollaboratorId: explicitBilledCollaboratorId,
  relationshipContext,
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
      const serviceLines = explicitServiceLines && explicitServiceLines.length > 0
        ? explicitServiceLines
        : buildServiceLines(relationshipContext);
      const billedCollaboratorId = explicitBilledCollaboratorId
        ?? (relationshipContext?.mode === 'PARTNER_HIRES_ORBITA' ? relationshipContext.partnerId || undefined : undefined);
      const notes = form.notes.trim();
      const body = {
        leadId: leadId || undefined,
        customerId: leadData?.customerId || customerId || undefined,
        sourceCollaboratorId: sourceCollaboratorId || undefined,
        billedCollaboratorId,
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
        customPackPrice: customPackPrice || undefined,
        manualTotalPrice: manualTotalPrice || undefined,
        invoiceRequired,
        extraHours: form.extraHours.trim() ? parseInt(form.extraHours, 10) || 0 : undefined,
        extras: Object.entries(selectedExtras).map(([extraId, extra]) => ({
          extraId,
          quantity: extra.quantity,
          price: extra.price,
        })),
        discount: parseFloat(form.discount) || 0,
        discountCode: form.discountCode.trim() || undefined,
        notes: notes || undefined,
        serviceLines: serviceLines.length > 0 ? serviceLines : undefined,
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
      // Si la reserva neix d'un lead, torna a la fitxa del lead (workspace nou amb
      // banner de reserva activa + semàfor). Si no, fitxa de booking clàssica.
      router.push(leadId ? buildLeadWorkspaceHref(leadId) : buildBookingHref(data.booking.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setSubmitting(false);
    }
  }, [customerId, form, internalTravelCost, leadData, leadId, manualTotalPrice, relationshipContext, router, selectedExtras, sourceCollaboratorId, customPackPrice, invoiceRequired, explicitServiceLines, explicitBilledCollaboratorId]);

  return {
    submitting,
    error,
    setError,
    submit,
  };
}
