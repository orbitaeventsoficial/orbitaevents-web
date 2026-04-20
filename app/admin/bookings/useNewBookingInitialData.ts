'use client';

import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import type { BookingExtra, BookingFormData, BookingLeadData, BookingPack, RawExtraConfig } from './booking-form.types';
import { INITIAL_BOOKING_FORM } from './booking-form.types';
import { log } from '@/lib/logger';

interface UseNewBookingInitialDataOptions {
  leadId: string | null;
  dateParam: string | null;
}

export function useNewBookingInitialData({ leadId, dateParam }: UseNewBookingInitialDataOptions) {
  const [form, setForm] = useState<BookingFormData>(INITIAL_BOOKING_FORM);
  const [packs, setPacks] = useState<BookingPack[]>([]);
  const [extras, setExtras] = useState<BookingExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadData, setLeadData] = useState<BookingLeadData | null>(null);
  const [fuelReferenceInfo, setFuelReferenceInfo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [packsRes, extrasRes] = await Promise.all([
          fetchWithCsrf('/api/admin/packs'),
          fetchWithCsrf('/api/admin/extras'),
        ]);

        if (packsRes.ok) {
          const pData = await packsRes.json();
          const packList = pData.packs || pData.data || [];
          setPacks(packList.filter((p: BookingPack) => p.translations?.length > 0));
        }

        if (extrasRes.ok) {
          const eData = await extrasRes.json();
          const rawConfig = Array.isArray(eData?.config)
            ? eData.config
            : Array.isArray(eData?.extras)
              ? eData.extras
              : Array.isArray(eData?.data)
                ? eData.data
                : [];
          const normalizedExtras: BookingExtra[] = rawConfig.map((item: RawExtraConfig) => ({
            id: String(item.id || item.slug || ''),
            slug: String(item.slug || item.id || ''),
            price: Number(item.price || 0),
            priceType: String(item.priceType || 'FIXED'),
            translations: [{ name: String(item.name || item.slug || 'Extra') }],
          })).filter((item: BookingExtra) => item.id);
          setExtras(normalizedExtras);
        }

        const fuelRes = await fetchWithCsrf('/api/admin/fuel/reference');
        if (fuelRes.ok) {
          const fuelData = await fuelRes.json();
          const referenceValue = Number(fuelData?.costPerKm || 0);
          if (referenceValue > 0) {
            setForm((prev) => ({ ...prev, fuelCostPerKm: referenceValue.toFixed(4) }));
            setFuelReferenceInfo(`Referència automàtica: ${referenceValue.toFixed(4)} €/km`);
          }
        }

        if (leadId) {
          const leadRes = await fetchWithCsrf(`/api/admin/leads/${leadId}`);
          if (leadRes.ok) {
            const lData = await leadRes.json();
            const lead = lData.lead || lData.data;
            if (lead) {
              setLeadData(lead);
              setForm((prev) => ({
                ...prev,
                clientName: lead.name || prev.clientName,
                clientEmail: lead.email || prev.clientEmail,
                clientPhone: lead.phone || prev.clientPhone,
                eventType: lead.eventType || prev.eventType,
                eventDate: lead.eventDate ? lead.eventDate.slice(0, 10) : prev.eventDate,
                eventLocation: lead.eventLocation || prev.eventLocation,
                guestCount: lead.guestCount ? String(lead.guestCount) : prev.guestCount,
              }));
            }
          }
        }

        if (dateParam) {
          setForm((prev) => ({ ...prev, eventDate: dateParam }));
        }
      } catch (error) {
        log.error('[NewBooking] Error carregant dades inicials', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [dateParam, leadId]);

  return {
    form,
    setForm,
    packs,
    extras,
    loading,
    leadData,
    fuelReferenceInfo,
  };
}
