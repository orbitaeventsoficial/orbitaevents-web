'use client';

import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import type { BookingExtra, BookingFormData, BookingLeadData, BookingPack, BookingPartnerOption, RawExtraConfig } from './booking-form.types';
import { INITIAL_BOOKING_FORM } from './booking-form.types';
import { log } from '@/lib/logger';

// Converteix una clau d'i18n del configurador (`services.mobile.extras.<slug>.name`)
// o un slug kebab-case (`hora-extra`) en una etiqueta humana ("Hora extra").
// Necessari perquè l'endpoint /api/admin/extras serveix claus d'i18n del web
// públic com a `name` i moltes no estan traduïdes encara.
function kebabToLabel(input: string): string {
  return input
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function humaniseExtraLabel(name?: string | null, slug?: string | null, id?: string | number | null): string {
  const raw = String(name || slug || id || 'Extra');
  const i18nMatch = raw.match(/^services\.mobile\.extras\.(.+?)\.(?:name|label)$/);
  if (i18nMatch) return kebabToLabel(i18nMatch[1]);
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(raw)) return kebabToLabel(raw);
  return raw;
}

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
  const [partners, setPartners] = useState<BookingPartnerOption[]>([]);
  const [fuelReferenceInfo, setFuelReferenceInfo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [packsRes, extrasRes, partnersRes] = await Promise.all([
          fetchWithCsrf('/api/admin/packs'),
          fetchWithCsrf('/api/admin/extras'),
          fetchWithCsrf('/api/admin/collaborators'),
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
            translations: [{ name: humaniseExtraLabel(item.name, item.slug, item.id) }],
          })).filter((item: BookingExtra) => item.id);
          setExtras(normalizedExtras);
        }

        if (partnersRes.ok) {
          const partnerData = await partnersRes.json();
          const list = Array.isArray(partnerData?.collaborators) ? partnerData.collaborators : [];
          setPartners(list
            .filter((partner: BookingPartnerOption & { isActive?: boolean }) => partner.isActive !== false)
            .map((partner: BookingPartnerOption) => ({
              id: partner.id,
              name: partner.name,
              company: partner.company || null,
              roles: partner.roles || [],
            })));
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
                eventStartTime: lead.eventStartTime || prev.eventStartTime,
                eventEndTime: lead.eventEndTime || prev.eventEndTime,
                eventLocation: lead.eventLocation || prev.eventLocation,
                eventVenue: lead.eventAddress || prev.eventVenue,
                guestCount: lead.guestCount ? String(lead.guestCount) : prev.guestCount,
                packId: lead.interestedPackId || prev.packId,
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
    partners,
    fuelReferenceInfo,
  };
}
