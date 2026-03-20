'use client';

/**
 * FORMULARI NOVA RESERVA - Creació de reserves des de l'admin
 * Carrega packs i extras, calcula preus en temps real
 * Pot pre-omplir des d'un lead (leadId) o client (customerId)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminPage } from '../components/AdminPage';
import { calculateBillableTravelKm, calculateTravelBlocks, calculateTravelCharge, calculateTravelCost, DEFAULT_VEHICLE_COST_PER_KM, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_EUR, TRAVEL_BLOCK_KM } from '@/lib/services/travelCost';
import { EVENT_TYPE_PLAIN, EVENT_TYPE_ICONS } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '../components/ToastProvider';

type Pack = {
  id: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  extraHourPrice: number;
  djHours: number;
  soundWatts: number;
  includesFog: boolean;
  includesMic: boolean;
  recommendedOperatorExtraHourPrice?: number;
  translations: Array<{ name: string; description: string }>;
};

type Extra = {
  id: string;
  slug: string;
  price: number;
  priceType: string;
  translations: Array<{ name: string }>;
  isOperatorExtra?: boolean;
};

type LeadData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  guestCount: number | null;
  budget: string | null;
  customerId: string | null;
};

type RawExtraConfig = {
  id?: string | number | null;
  slug?: string | null;
  price?: number | string | null;
  priceType?: string | null;
  name?: string | null;
};

type BookingConflictRow = {
  id: string;
  reference: string;
  clientName: string;
  eventStartTime?: string | null;
  status: string;
};

// Derived from centralized EVENT_TYPE_PLAIN and EVENT_TYPE_ICONS constants.
const EVENT_TYPES = Object.keys(EVENT_TYPE_PLAIN).map((value) => ({
  value,
  label: EVENT_TYPE_PLAIN[value],
  icon: EVENT_TYPE_ICONS[value] ?? '',
}));
const OPERATOR_EXTRA_ID = '__operator_extra__';

type FormData = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  eventVenue: string;
  guestCount: string;
  packId: string;
  extraHours: string;
  distanceKm: string;
  fuelCostPerKm: string;
  discount: string;
  discountCode: string;
  notes: string;
};

const INITIAL_FORM: FormData = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  eventType: 'OTHER',
  eventDate: '',
  eventStartTime: '22:00',
  eventEndTime: '04:00',
  eventLocation: '',
  eventVenue: '',
  guestCount: '',
  packId: '',
  extraHours: '0',
  distanceKm: '',
  fuelCostPerKm: '0.19',
  discount: '0',
  discountCode: '',
  notes: '',
};

export default function NewBookingForm() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const leadId = searchParams?.get('leadId') ?? null;
  const customerId = searchParams?.get('customerId') ?? null;
  const dateParam = searchParams?.get('date') ?? null;

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, { quantity: number; price: number }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [discountValidation, setDiscountValidation] = useState<{
    valid: boolean;
    type?: string;
    value?: number;
    source?: string;
    reason?: string;
  } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceMessage, setDistanceMessage] = useState<string | null>(null);
  const [fuelReferenceInfo, setFuelReferenceInfo] = useState<string | null>(null);
  const lastDistanceDestinationRef = useRef('');
  const [dateConflicts, setDateConflicts] = useState<Array<{ id: string; reference: string; clientName: string; eventStartTime: string | null }>>([]);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Load packs, extras, and optional lead data
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
          setPacks(packList.filter((p: Pack) => p.translations?.length > 0));
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
          const normalizedExtras: Extra[] = rawConfig.map((item: RawExtraConfig) => ({
            id: String(item.id || item.slug || ''),
            slug: String(item.slug || item.id || ''),
            price: Number(item.price || 0),
            priceType: String(item.priceType || 'FIXED'),
            translations: [{ name: String(item.name || item.slug || 'Extra') }],
          })).filter((item: Extra) => item.id);
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

        // Pre-fill from lead
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

        // Pre-fill date from calendar
        if (dateParam) {
          setForm((prev) => ({ ...prev, eventDate: dateParam }));
        }
      } catch (error) {
        console.error('[NewBooking] Error carregant dades inicials:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leadId, dateParam]);

  // Travel cost calculation
  const internalTravelCost = useMemo(() => {
    const km = parseFloat(form.distanceKm) || 0;
    const rate = parseFloat(form.fuelCostPerKm) || DEFAULT_VEHICLE_COST_PER_KM;
    return calculateTravelCost(km, rate, INCLUDED_TRAVEL_KM);
  }, [form.distanceKm, form.fuelCostPerKm]);
  const travelCharge = useMemo(() => {
    const km = parseFloat(form.distanceKm) || 0;
    return calculateTravelCharge(km, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM, TRAVEL_BLOCK_EUR);
  }, [form.distanceKm]);
  const billableKm = useMemo(() => {
    const km = parseFloat(form.distanceKm) || 0;
    return calculateBillableTravelKm(km, INCLUDED_TRAVEL_KM);
  }, [form.distanceKm]);
  const travelBlocks = useMemo(() => {
    const km = parseFloat(form.distanceKm) || 0;
    return calculateTravelBlocks(km, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM);
  }, [form.distanceKm]);

  // Price calculation
  const pricing = useMemo(() => {
    const selectedPack = packs.find((p) => p.id === form.packId);
    if (!selectedPack) return null;

    const packPrice = selectedPack.price;
    const extraHoursCount = parseInt(form.extraHours, 10) || 0;
    const extraHoursPrice = extraHoursCount * selectedPack.extraHourPrice;
    const extrasPrice = Object.values(selectedExtras).reduce(
      (sum, e) => sum + e.price * e.quantity,
      0
    );
    const subtotal = packPrice + extraHoursPrice + extrasPrice + travelCharge;
    const discount = parseFloat(form.discount) || 0;
    const baseAfterDiscount = subtotal - discount;
    const vatRate = 21;
    const vatAmount = baseAfterDiscount * (vatRate / 100);
    const total = baseAfterDiscount + vatAmount;
    const deposit = Math.round(total * 0.3);

    return { packPrice, extraHoursPrice, extrasPrice, travelCharge, subtotal, discount, vatAmount, total, deposit };
  }, [form.packId, form.extraHours, form.discount, selectedExtras, packs, travelCharge]);

  // Margin estimator (simplified costEngine inline — no server call needed)
  const marginEstimate = useMemo(() => {
    if (!pricing) return null;
    const packCost = pricing.packPrice * 0.36;
    const extrasCost = pricing.extrasPrice * 0.28;
    const extraHoursCost = pricing.extraHoursPrice * 0.2;
    const fixedCost = 45;
    const travelCostEst = internalTravelCost;
    const directCost = packCost + extrasCost + extraHoursCost + fixedCost + travelCostEst;
    const netMargin = pricing.total - directCost;
    const marginPct = pricing.total > 0 ? (netMargin / pricing.total) * 100 : 0;
    const tone = marginPct >= 50 ? 'emerald' : marginPct >= 30 ? 'amber' : 'rose';
    return { directCost, netMargin, marginPct, tone };
  }, [pricing, internalTravelCost]);

  const toggleExtra = (extra: Extra) => {
    setSelectedExtras((prev) => {
      const copy = { ...prev };
      if (copy[extra.id]) {
        delete copy[extra.id];
      } else {
        copy[extra.id] = { quantity: 1, price: extra.price };
      }
      return copy;
    });
  };

  const updateExtraQuantity = (extraId: string, qty: number) => {
    setSelectedExtras((prev) => ({
      ...prev,
      [extraId]: { ...prev[extraId], quantity: Math.max(1, qty) },
    }));
  };

  const selectedPack = useMemo(
    () => packs.find((p) => p.id === form.packId) || null,
    [packs, form.packId]
  );

  const operatorExtraPrice = useMemo(() => {
    if (!selectedPack) return 0;
    const recommended = Number(selectedPack.recommendedOperatorExtraHourPrice || 0);
    if (recommended > 0) return Number(recommended.toFixed(2));
    return Number(Math.max(25, selectedPack.extraHourPrice * 0.6).toFixed(2));
  }, [selectedPack]);

  const displayExtras = useMemo<Extra[]>(() => {
    if (!selectedPack) return extras;
    const operatorExtra: Extra = {
      id: OPERATOR_EXTRA_ID,
      slug: 'operator-support-hour',
      price: operatorExtraPrice,
      priceType: 'PER_HOUR',
      translations: [{ name: 'Operari extra (hora)' }],
      isOperatorExtra: true,
    };
    return [operatorExtra, ...extras];
  }, [extras, operatorExtraPrice, selectedPack]);

  useEffect(() => {
    setSelectedExtras((prev) => {
      const current = prev[OPERATOR_EXTRA_ID];
      if (!current) return prev;
      if (current.price === operatorExtraPrice) return prev;
      return {
        ...prev,
        [OPERATOR_EXTRA_ID]: {
          ...current,
          price: operatorExtraPrice,
        },
      };
    });
  }, [operatorExtraPrice]);

  const validateDiscountCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setDiscountValidation(null);
      return;
    }
    setValidatingCode(true);
    try {
      const res = await fetchWithCsrf(`/api/public/discount-code?code=${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setDiscountValidation(data);
        // Auto-apply discount if valid
        if (data.valid && data.type && data.value != null) {
          if (data.type === 'PERCENTAGE') {
            // We'll apply % in the pricing calculation
            const selectedPack = packs.find((p) => p.id === form.packId);
            if (selectedPack) {
              const subtotal = selectedPack.price + Object.values(selectedExtras).reduce((s, e) => s + e.price * e.quantity, 0);
              const discountAmount = Math.round(subtotal * (data.value / 100));
              updateField('discount', String(discountAmount));
            }
          } else {
            updateField('discount', String(data.value));
          }
        }
      }
    } catch (error) {
      console.error('[NewBooking] Error validant codi descompte:', error);
      toast.error('Error validant el codi de descompte');
    } finally {
      setValidatingCode(false);
    }
  }, [packs, form.packId, selectedExtras, toast]);

  const calculateDistanceForDestination = useCallback(async (destination: string) => {
    setCalculatingDistance(true);
    setDistanceMessage(null);

    try {
      const res = await fetchWithCsrf('/api/admin/maps/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut calcular la distància');
      }

      setForm((prev) => ({ ...prev, distanceKm: String(data.roundTripKm || 0) }));
      lastDistanceDestinationRef.current = destination;
      setDistanceMessage(
        `Ruta calculada: ${data.originResolved || 'Origen'} → ${data.destinationResolved || 'Destí'} (${data.oneWayKm || 0} km anada, ${data.roundTripKm || 0} km anada+tornada).`
      );
    } catch (error) {
      setDistanceMessage(error instanceof Error ? error.message : 'Error calculant distància');
    } finally {
      setCalculatingDistance(false);
    }
  }, []);

  useEffect(() => {
    const destination = [form.eventVenue.trim(), form.eventLocation.trim()].filter(Boolean).join(', ');
    if (destination.length < 3) {
      return;
    }
    if (destination === lastDistanceDestinationRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      void calculateDistanceForDestination(destination);
    }, 550);

    return () => clearTimeout(timer);
  }, [form.eventLocation, form.eventVenue, calculateDistanceForDestination]);

  // Double-booking detection
  useEffect(() => {
    if (!form.eventDate) {
      setDateConflicts([]);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetchWithCsrf(
          `/api/admin/bookings?fromDate=${form.eventDate}&toDate=${form.eventDate}&limit=10`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        const active = ((data.bookings || []) as BookingConflictRow[]).filter(
          (b) => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(b.status)
        );
        setDateConflicts(active.map((b) => ({
          id: b.id,
          reference: b.reference,
          clientName: b.clientName,
          eventStartTime: b.eventStartTime || null,
        })));
      } catch {
        // ignore abort
      }
    })();
    return () => controller.abort();
  }, [form.eventDate]);

  const handleSubmit = useCallback(async () => {
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
        extras: Object.entries(selectedExtras).map(([extraId, e]) => ({
          extraId,
          quantity: e.quantity,
          price: e.price,
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
  }, [form, selectedExtras, leadId, leadData, customerId, router, internalTravelCost]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AdminPage
      title="Nova reserva"
      subtitle={leadData ? `Des de l'entrada de ${leadData.name}` : 'Crear una reserva manualment'}
      back={{ href: '/admin/bookings', label: 'Reserves' }}
      className="max-w-5xl"
    >
      {/* Lead context banner */}
      {leadData && (
        <div className="rounded-xl border p-4 flex items-center justify-between">
          <div className="text-sm">
            Entrada vinculada: <strong>{leadData.name}</strong> · {leadData.email}
            {leadData.budget && ` · Pressupost: ${leadData.budget}`}
          </div>
          <Link
            href={`/admin/leads/${leadData.id}`}
            className="text-xs"
          >
            Veure entrada →
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-xl border p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Client data */}
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Dades del client</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="nb-name" className="text-xs">Nom *</label>
            <input
              id="nb-name"
              type="text"
              value={form.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="nb-email" className="text-xs">Email *</label>
            <input
              id="nb-email"
              type="email"
              value={form.clientEmail}
              onChange={(e) => updateField('clientEmail', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="nb-phone" className="text-xs">Telèfon *</label>
            <input
              id="nb-phone"
              type="tel"
              value={form.clientPhone}
              onChange={(e) => updateField('clientPhone', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {calculatingDistance && <p className="text-xs">Calculant ruta automàticament...</p>}
          {distanceMessage && <p className="text-xs">{distanceMessage}</p>}
        </div>
      </div>

      {/* Event details */}
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Detalls de l&apos;esdeveniment</h2>

        <div>
          <span id="nb-event-type-label" className="text-xs">Tipus</span>
          <div role="group" aria-labelledby="nb-event-type-label" className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.value}
                type="button"
                onClick={() => updateField('eventType', et.value)}
                aria-pressed={form.eventType === et.value}
                className={`rounded-xl border px-2 py-2 text-xs font-medium transition-all ${
                  form.eventType === et.value
                    ? 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info'
                    : 'admin-tone-border-neutral admin-tone-bg-neutral admin-tone-text-neutral hover:brightness-105'
                }`}
              >
                <span className="text-base leading-none">{et.icon}</span>
                <span className="mt-1 block leading-tight">{et.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="nb-date" className="text-xs">Data *</label>
            <input
              id="nb-date"
              type="date"
              value={form.eventDate}
              onChange={(e) => updateField('eventDate', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="nb-start-time" className="text-xs">Hora inici</label>
            <input
              id="nb-start-time"
              type="time"
              value={form.eventStartTime}
              onChange={(e) => updateField('eventStartTime', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="nb-end-time" className="text-xs">Hora final</label>
            <input
              id="nb-end-time"
              type="time"
              value={form.eventEndTime}
              onChange={(e) => updateField('eventEndTime', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="nb-guests" className="text-xs">Convidats</label>
            <input
              id="nb-guests"
              type="number"
              value={form.guestCount}
              onChange={(e) => updateField('guestCount', e.target.value)}
              placeholder="100"
              min={1}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
        </div>

        {dateConflicts.length > 0 && (
          <div className="rounded-xl border-2 p-3">
            <p className="text-sm font-semibold">
              Ja {dateConflicts.length === 1 ? 'hi ha 1 reserva' : `hi ha ${dateConflicts.length} reserves`} el {form.eventDate}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {dateConflicts.map((c) => (
                <li key={c.id} className="text-xs">
                  {c.reference} · {c.clientName}{c.eventStartTime ? ` · ${c.eventStartTime}` : ''}
                </li>
              ))}
            </ul>
            <p className="text-[10px] mt-1.5">Pots continuar si els horaris no es solapen.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nb-location" className="text-xs">Ubicació *</label>
            <input
              id="nb-location"
              type="text"
              value={form.eventLocation}
              onChange={(e) => updateField('eventLocation', e.target.value)}
              placeholder="Ciutat o comarca"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="nb-venue" className="text-xs">Espai / Lloc concret</label>
            <input
              id="nb-venue"
              type="text"
              value={form.eventVenue}
              onChange={(e) => updateField('eventVenue', e.target.value)}
              placeholder="Nom de la finca, restaurant..."
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
        </div>
      </div>

      {/* Pack selection */}
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Selecciona pack *</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => {
            const name = pack.translations[0]?.name || pack.slug;
            const desc = pack.translations[0]?.description || '';
            const isSelected = form.packId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => updateField('packId', pack.id)}
                className={`rounded-xl border p-4 text-center transition-all ${
                  isSelected
                    ? 'admin-tone-border-info admin-tone-bg-info'
                    : 'admin-tone-border-neutral admin-tone-bg-neutral hover:brightness-105'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{name}</span>
                  <span className="text-sm font-bold">{pack.price}€</span>
                </div>
                <p className="mt-1 text-xs line-clamp-2">{desc}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded">
                    {pack.djHours}h DJ
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded">
                    {pack.soundWatts}W
                  </span>
                  {pack.includesFog && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded">
                      Fum
                    </span>
                  )}
                  {pack.includesMic && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded">
                      Micro
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded">
                    +{pack.extraHourPrice}€/h extra
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {form.packId && (
          <div>
            <label htmlFor="nb-extra-hours" className="text-xs">Hores extra</label>
            <input
              id="nb-extra-hours"
              type="number"
              min="0"
              max="10"
              value={form.extraHours}
              onChange={(e) => updateField('extraHours', e.target.value)}
              className="mt-1 w-24 rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
        )}
      </div>

      {/* Extras */}
      {displayExtras.length > 0 && (
        <div className="rounded-2xl border p-5 space-y-4">
          <h2 className="text-sm font-semibold">Extres</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {displayExtras.map((extra) => {
              const name = extra.translations[0]?.name || extra.slug;
              const isSelected = !!selectedExtras[extra.id];
              return (
                <div
                  key={extra.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'admin-tone-border-success admin-tone-bg-success'
                      : 'admin-tone-border-neutral admin-tone-bg-neutral'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className="flex-1 text-center"
                  >
                    <span className={`text-sm font-medium ${isSelected ? 'admin-tone-text-success' : 'admin-tone-text-neutral'}`}>
                      {isSelected ? '✓ ' : ''}{name}
                    </span>
                    <span className="ml-2 text-xs">{extra.price}€{extra.isOperatorExtra ? '/h' : ''}</span>
                  </button>
                  {isSelected && (
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={selectedExtras[extra.id].quantity}
                      onChange={(e) => updateExtraQuantity(extra.id, parseInt(e.target.value, 10) || 1)}
                      className="w-14 rounded-xl border px-2 py-1 text-xs text-center"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Desplaçament */}
      <div className="rounded-2xl border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Desplaçament</h2>
          <span className="text-xs">(opcional)</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="nb-km" className="text-xs">Km totals (anada + tornada)</label>
            <div className="mt-1 relative">
              <input
                id="nb-km"
                type="number"
                min="0"
                step="1"
                value={form.distanceKm}
                onChange={(e) => updateField('distanceKm', e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm "
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">km</span>
            </div>
            <p className="mt-1 text-[10px]">
              Inclòs al pack: {INCLUDED_TRAVEL_KM} km (anada + tornada)
            </p>
          </div>
          <div>
            <label className="text-xs">Trams aplicats</label>
            <div className="mt-1 flex items-center rounded-xl border px-3 py-2.5 h-[42px]">
              <span className="text-sm font-semibold">{travelBlocks}</span>
            </div>
            <p className="mt-1 text-[10px]">
              {TRAVEL_BLOCK_EUR} € per cada {TRAVEL_BLOCK_KM} km extra
            </p>
            {fuelReferenceInfo && (
              <p className="mt-1 text-[10px]">{fuelReferenceInfo}</p>
            )}
          </div>
          <div>
            <label className="text-xs">Cost desplaçament</label>
            <div className="mt-1 flex items-center rounded-xl border px-3 py-2.5 h-[42px]">
              {travelCharge > 0 ? (
                <span className="text-sm font-semibold">{travelCharge.toFixed(2)} €</span>
              ) : (
                <span className="text-sm">— €</span>
              )}
            </div>
            {travelCharge > 0 && (
              <p className="mt-1 text-[10px]">
                {billableKm} km extra → {travelBlocks} trams × {TRAVEL_BLOCK_EUR} €
              </p>
            )}
            {travelCharge === 0 && (parseFloat(form.distanceKm) || 0) > 0 && (
              <p className="mt-1 text-[10px]">
                Dins del tram inclòs ({INCLUDED_TRAVEL_KM} km), cost extra 0 €
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Discount + Notes */}
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Descompte i notes</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="nb-discount" className="text-xs">Descompte (€)</label>
            <input
              id="nb-discount"
              type="number"
              min="0"
              value={form.discount}
              onChange={(e) => updateField('discount', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm "
            />
          </div>
          <div>
            <label htmlFor="nb-discount-code" className="text-xs">Codi descompte</label>
            <div className="mt-1 flex gap-2">
              <input
                id="nb-discount-code"
                type="text"
                value={form.discountCode}
                onChange={(e) => { updateField('discountCode', e.target.value.toUpperCase()); setDiscountValidation(null); }}
                placeholder="Ex: BODA2026"
                className="flex-1 rounded-xl border px-3 py-2.5 text-sm focus:ring-1 font-mono"
              />
              <button
                type="button"
                onClick={() => validateDiscountCode(form.discountCode)}
                disabled={validatingCode || !form.discountCode}
                className="ap-btn ap-btn--secondary px-3 py-2 text-xs disabled:opacity-50"
              >
                {validatingCode ? '...' : 'Validar'}
              </button>
            </div>
            {discountValidation && (
              <p className={`mt-1 text-xs ${discountValidation.valid ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
                {discountValidation.valid
                  ? `Vàlid: ${discountValidation.type === 'PERCENTAGE' ? `${discountValidation.value}%` : `${discountValidation.value}€`} (${discountValidation.source})`
                  : `Invàlid: ${discountValidation.reason}`}
              </p>
            )}
          </div>
          <div className="sm:col-span-1" />
        </div>
        <div>
          <label htmlFor="nb-notes" className="text-xs">Notes internes</label>
          <textarea
            id="nb-notes"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            placeholder="Notes internes sobre la reserva..."
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-1 resize-none"
          />
        </div>
      </div>

      {/* Pricing summary */}
      {pricing && (
        <div className="rounded-2xl border p-5">
          <h2 className="text-sm font-semibold mb-3">Resum de preus</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>Pack</span>
              <span>{pricing.packPrice.toFixed(2)}€</span>
            </div>
            {pricing.extraHoursPrice > 0 && (
              <div className="flex justify-between">
                <span>Hores extra</span>
                <span>+{pricing.extraHoursPrice.toFixed(2)}€</span>
              </div>
            )}
            {pricing.extrasPrice > 0 && (
              <div className="flex justify-between">
                <span>Extres</span>
                <span>+{pricing.extrasPrice.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1.5">
              <span>Subtotal</span>
              <span>{pricing.subtotal.toFixed(2)}€</span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between">
                <span>Descompte</span>
                <span>-{pricing.discount.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>IVA (21%)</span>
              <span>+{pricing.vatAmount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{pricing.total.toFixed(2)}€</span>
            </div>
            {pricing.travelCharge > 0 && (
              <div className="flex justify-between">
                <span>🚗 Desplaçament ({travelBlocks} trams)</span>
                <span>+{pricing.travelCharge.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between text-xs pt-1">
              <span>Senyal (30%)</span>
              <span>{pricing.deposit.toFixed(2)}€</span>
            </div>
            {internalTravelCost > 0 && (
              <p className="text-[11px] pt-1 border-t">
                * Cost intern estimat de transport: {internalTravelCost.toFixed(2)} € (coeficient {DEFAULT_VEHICLE_COST_PER_KM.toFixed(2)} €/km sobre km extra).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Margin estimate */}
      {marginEstimate && (
        <div className={`rounded-2xl border-2 p-5 ${
          marginEstimate.tone === 'emerald' ? 'admin-tone-border-success admin-tone-bg-success' :
          marginEstimate.tone === 'amber' ? 'admin-tone-border-warning admin-tone-bg-warning' :
          'admin-tone-border-danger admin-tone-bg-danger'
        }`}>
          <h2 className="text-sm font-semibold mb-3">Rendibilitat estimada</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs opacity-60">Cost estimat</p>
              <p className="text-lg font-bold">{marginEstimate.directCost.toFixed(0)}€</p>
            </div>
            <div>
              <p className="text-xs opacity-60">Marge net</p>
              <p className={`text-lg font-bold ${
                marginEstimate.tone === 'emerald' ? 'admin-tone-text-success' :
                marginEstimate.tone === 'amber' ? 'admin-tone-text-warning' :
                'admin-tone-text-danger'
              }`}>{marginEstimate.netMargin.toFixed(0)}€</p>
            </div>
            <div>
              <p className="text-xs opacity-60">Marge %</p>
              <p className={`text-lg font-bold ${
                marginEstimate.tone === 'emerald' ? 'admin-tone-text-success' :
                marginEstimate.tone === 'amber' ? 'admin-tone-text-warning' :
                'admin-tone-text-danger'
              }`}>{marginEstimate.marginPct.toFixed(1)}%</p>
            </div>
          </div>
          <div className="admin-tone-bg-neutral mt-3 h-2 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all ${
                marginEstimate.tone === 'emerald' ? 'admin-tone-bg-success' :
                marginEstimate.tone === 'amber' ? 'admin-tone-bg-warning' :
                'admin-tone-bg-danger'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, marginEstimate.marginPct))}%` }}
            />
          </div>
          <p className="text-[10px] opacity-40 mt-2">
            Estimació basada en ratis estàndard. El marge real es calcularà amb costos d&apos;inventari assignat.
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.clientName || !form.clientEmail || !form.packId}
          className="ap-btn ap-btn--primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Creant reserva...' : 'Crear reserva'}
        </button>
        <Link
          href="/admin/bookings"
          className="ap-btn ap-btn--secondary px-4 py-3 text-sm"
        >
          Cancel·lar
        </Link>
      </div>
    </AdminPage>
  );
}








