'use client';

/**
 * FORMULARI NOVA RESERVA - Creació de reserves des de l'admin
 * Carrega packs i extras, calcula preus en temps real
 * Pot pre-omplir des d'un lead (leadId) o client (customerId)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
  translations: Array<{ name: string; description: string }>;
};

type Extra = {
  id: string;
  slug: string;
  price: number;
  priceType: string;
  translations: Array<{ name: string }>;
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

const EVENT_TYPES = [
  { value: 'WEDDING', label: 'Casament', icon: '💍' },
  { value: 'BIRTHDAY', label: 'Aniversari', icon: '🎂' },
  { value: 'CORPORATE', label: 'Corporatiu', icon: '🎯' },
  { value: 'COMMUNION', label: 'Comunió', icon: '⛪' },
  { value: 'BAPTISM', label: 'Bateig', icon: '👶' },
  { value: 'GRADUATION', label: 'Graduació', icon: '🎓' },
  { value: 'ANNIVERSARY', label: 'Celebració', icon: '🎉' },
  { value: 'PRIVATE_PARTY', label: 'Festa privada', icon: '🎵' },
  { value: 'OTHER', label: 'Altre', icon: '📋' },
];

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

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const customerId = searchParams.get('customerId');
  const dateParam = searchParams.get('date');

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

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Load packs, extras, and optional lead data
  useEffect(() => {
    async function load() {
      try {
        const [packsRes, extrasRes] = await Promise.all([
          fetch('/api/admin/packs'),
          fetch('/api/admin/extras'),
        ]);

        if (packsRes.ok) {
          const pData = await packsRes.json();
          const packList = pData.packs || pData.data || [];
          setPacks(packList.filter((p: Pack) => p.translations?.length > 0));
        }

        if (extrasRes.ok) {
          const eData = await extrasRes.json();
          setExtras(eData.extras || eData.data || []);
        }

        // Pre-fill from lead
        if (leadId) {
          const leadRes = await fetch(`/api/admin/leads-new/${leadId}`);
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
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leadId, dateParam]);

  // Travel cost calculation
  const travelCost = useMemo(() => {
    const km = parseFloat(form.distanceKm) || 0;
    const rate = parseFloat(form.fuelCostPerKm) || 0.19;
    return km > 0 ? parseFloat((km * rate).toFixed(2)) : 0;
  }, [form.distanceKm, form.fuelCostPerKm]);

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
    const subtotal = packPrice + extraHoursPrice + extrasPrice;
    const discount = parseFloat(form.discount) || 0;
    const baseAfterDiscount = subtotal - discount;
    const vatRate = 21;
    const vatAmount = baseAfterDiscount * (vatRate / 100);
    const total = baseAfterDiscount + vatAmount;
    const deposit = Math.round(total * 0.3);

    return { packPrice, extraHoursPrice, extrasPrice, subtotal, discount, vatAmount, total, deposit };
  }, [form.packId, form.extraHours, form.discount, selectedExtras, packs]);

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

  const validateDiscountCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setDiscountValidation(null);
      return;
    }
    setValidatingCode(true);
    try {
      const res = await fetch(`/api/public/discount-code?code=${encodeURIComponent(code.trim())}`);
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
    } catch {
      // Silent
    } finally {
      setValidatingCode(false);
    }
  }, [packs, form.packId, selectedExtras]);

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
        travelCost: travelCost || undefined,
      };

      const res = await fetch('/api/admin/bookings', {
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
  }, [form, selectedExtras, leadId, leadData, customerId, router, travelCost]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            Nova reserva
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {leadData
              ? `Des de l'entrada de ${leadData.name}`
              : 'Crear una reserva manualment'}
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600/50 transition-colors"
        >
          ← Reserves
        </Link>
      </div>

      {/* Lead context banner */}
      {leadData && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 flex items-center justify-between">
          <div className="text-sm text-cyan-200">
            Entrada vinculada: <strong>{leadData.name}</strong> · {leadData.email}
            {leadData.budget && ` · Pressupost: ${leadData.budget}`}
          </div>
          <Link
            href={`/admin/leads/${leadData.id}`}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            Veure entrada →
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}

      {/* Client data */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Dades del client</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-400">Nom *</label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Email *</label>
            <input
              type="email"
              value={form.clientEmail}
              onChange={(e) => updateField('clientEmail', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Telèfon *</label>
            <input
              type="tel"
              value={form.clientPhone}
              onChange={(e) => updateField('clientPhone', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Event details */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Detalls de l&apos;esdeveniment</h2>

        <div>
          <label className="text-xs text-slate-400">Tipus</label>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.value}
                type="button"
                onClick={() => updateField('eventType', et.value)}
                aria-pressed={form.eventType === et.value}
                className={`rounded-xl border px-2 py-2 text-xs font-medium transition-all ${
                  form.eventType === et.value
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/60'
                    : 'border-slate-700/50 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">{et.icon}</span>
                <span className="block mt-0.5">{et.label}</span>
                {form.eventType === et.value && (
                  <span className="mt-1 inline-block rounded-full bg-cyan-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200">
                    Seleccionat ✓
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-cyan-300">
            Tipus seleccionat:{' '}
            <span className="font-semibold">
              {EVENT_TYPES.find((et) => et.value === form.eventType)?.label ?? 'Altre'}
            </span>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="text-xs text-slate-400">Data *</label>
            <input
              type="date"
              value={form.eventDate}
              onChange={(e) => updateField('eventDate', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Hora inici</label>
            <input
              type="time"
              value={form.eventStartTime}
              onChange={(e) => updateField('eventStartTime', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Hora final</label>
            <input
              type="time"
              value={form.eventEndTime}
              onChange={(e) => updateField('eventEndTime', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Convidats</label>
            <input
              type="number"
              value={form.guestCount}
              onChange={(e) => updateField('guestCount', e.target.value)}
              placeholder="100"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Ubicació *</label>
            <input
              type="text"
              value={form.eventLocation}
              onChange={(e) => updateField('eventLocation', e.target.value)}
              placeholder="Ciutat o comarca"
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Espai / Lloc concret</label>
            <input
              type="text"
              value={form.eventVenue}
              onChange={(e) => updateField('eventVenue', e.target.value)}
              placeholder="Nom de la finca, restaurant..."
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Pack selection */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Selecciona pack *</h2>
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
                className={`rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-400/50'
                    : 'border-slate-700/50 bg-slate-900/40 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">{name}</span>
                  <span className="text-sm font-bold text-cyan-300">{pack.price}€</span>
                </div>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{desc}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded">
                    {pack.djHours}h DJ
                  </span>
                  <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded">
                    {pack.soundWatts}W
                  </span>
                  {pack.includesFog && (
                    <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded">
                      Fum
                    </span>
                  )}
                  {pack.includesMic && (
                    <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded">
                      Micro
                    </span>
                  )}
                  <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded">
                    +{pack.extraHourPrice}€/h extra
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {form.packId && (
          <div>
            <label className="text-xs text-slate-400">Hores extra</label>
            <input
              type="number"
              min="0"
              max="10"
              value={form.extraHours}
              onChange={(e) => updateField('extraHours', e.target.value)}
              className="mt-1 w-24 rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        )}
      </div>

      {/* Extras */}
      {extras.length > 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Extres</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {extras.map((extra) => {
              const name = extra.translations[0]?.name || extra.slug;
              const isSelected = !!selectedExtras[extra.id];
              return (
                <div
                  key={extra.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-emerald-400/50 bg-emerald-500/10'
                      : 'border-slate-700/50 bg-slate-900/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className="flex-1 text-left"
                  >
                    <span className={`text-sm font-medium ${isSelected ? 'text-emerald-200' : 'text-slate-300'}`}>
                      {isSelected ? '✓ ' : ''}{name}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">{extra.price}€</span>
                  </button>
                  {isSelected && (
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={selectedExtras[extra.id].quantity}
                      onChange={(e) => updateExtraQuantity(extra.id, parseInt(e.target.value, 10) || 1)}
                      className="w-14 rounded-lg border border-slate-600/50 bg-slate-900/60 px-2 py-1 text-xs text-slate-100 text-center"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Desplaçament */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-200">Desplaçament</h2>
          <span className="text-xs text-slate-500">(opcional)</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-400">Km totals (anada + tornada)</label>
            <div className="mt-1 relative">
              <input
                type="number"
                min="0"
                step="1"
                value={form.distanceKm}
                onChange={(e) => updateField('distanceKm', e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">km</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Cost per km</label>
            <div className="mt-1 relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.fuelCostPerKm}
                onChange={(e) => updateField('fuelCostPerKm', e.target.value)}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 pr-12 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">€/km</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-600">Recomanat: 0.19 €/km (AEAT 2024)</p>
          </div>
          <div>
            <label className="text-xs text-slate-400">Cost desplaçament</label>
            <div className="mt-1 flex items-center rounded-xl border border-slate-700/30 bg-slate-900/30 px-3 py-2.5 h-[42px]">
              {travelCost > 0 ? (
                <span className="text-sm font-semibold text-amber-300">{travelCost.toFixed(2)} €</span>
              ) : (
                <span className="text-sm text-slate-600">— €</span>
              )}
            </div>
            {travelCost > 0 && (
              <p className="mt-1 text-[10px] text-slate-500">
                {parseFloat(form.distanceKm) || 0} km × {parseFloat(form.fuelCostPerKm) || 0.19} €/km
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Discount + Notes */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Descompte i notes</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-400">Descompte (€)</label>
            <input
              type="number"
              min="0"
              value={form.discount}
              onChange={(e) => updateField('discount', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Codi descompte</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={form.discountCode}
                onChange={(e) => { updateField('discountCode', e.target.value.toUpperCase()); setDiscountValidation(null); }}
                placeholder="Ex: BODA2026"
                className="flex-1 rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => validateDiscountCode(form.discountCode)}
                disabled={validatingCode || !form.discountCode}
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
              >
                {validatingCode ? '...' : 'Validar'}
              </button>
            </div>
            {discountValidation && (
              <p className={`mt-1 text-xs ${discountValidation.valid ? 'text-emerald-300' : 'text-rose-300'}`}>
                {discountValidation.valid
                  ? `Vàlid: ${discountValidation.type === 'PERCENTAGE' ? `${discountValidation.value}%` : `${discountValidation.value}€`} (${discountValidation.source})`
                  : `Invàlid: ${discountValidation.reason}`}
              </p>
            )}
          </div>
          <div className="sm:col-span-1" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Notes internes</label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            placeholder="Notes internes sobre la reserva..."
            className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
          />
        </div>
      </div>

      {/* Pricing summary */}
      {pricing && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Resum de preus</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Pack</span>
              <span>{pricing.packPrice.toFixed(2)}€</span>
            </div>
            {pricing.extraHoursPrice > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Hores extra</span>
                <span>+{pricing.extraHoursPrice.toFixed(2)}€</span>
              </div>
            )}
            {pricing.extrasPrice > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Extres</span>
                <span>+{pricing.extrasPrice.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400 border-t border-slate-700/50 pt-1.5">
              <span>Subtotal</span>
              <span>{pricing.subtotal.toFixed(2)}€</span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between text-amber-300">
                <span>Descompte</span>
                <span>-{pricing.discount.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>IVA (21%)</span>
              <span>+{pricing.vatAmount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-emerald-300 border-t border-slate-700/50 pt-2">
              <span>Total</span>
              <span>{pricing.total.toFixed(2)}€</span>
            </div>
            {travelCost > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>🚗 Desplaçament ({parseFloat(form.distanceKm) || 0} km)</span>
                <span>+{travelCost.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>Senyal (30%)</span>
              <span>{pricing.deposit.toFixed(2)}€</span>
            </div>
            {travelCost > 0 && (
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-700/30">
                * El desplaçament és un cost intern, no s&apos;inclou automàticament al total del client.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.clientName || !form.clientEmail || !form.packId}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creant reserva...' : 'Crear reserva'}
        </button>
        <Link
          href="/admin/bookings"
          className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-3 text-sm text-slate-300 hover:bg-slate-600/50 transition-colors"
        >
          Cancel·lar
        </Link>
      </div>
    </div>
  );
}
