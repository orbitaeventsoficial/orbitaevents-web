'use client';

import { useState } from 'react';

type LeadProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  eventDate?: string | null;
  eventType?: string | null;
  eventLocation?: string | null;
  guestCount?: number | null;
  budget?: string | null;
  message?: string | null;
  status?: string | null;
  priority?: string | null;
  source?: string | null;
  assignedTo?: string | null;
  interestedPackId?: string | null;
  interestedExtras?: string[] | null;
  landingPage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  preferredLocale?: string | null;
};

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const EVENT_TYPES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER'];
const SOURCE_OPTIONS = ['WEBSITE', 'CONFIGURATOR', 'PHONE', 'WHATSAPP', 'INSTAGRAM', 'REFERRAL', 'GOOGLE', 'OTHER'];

export default function LeadProfileEditor({ lead }: { lead: LeadProfile }) {
  const [form, setForm] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    eventDate: lead.eventDate ? lead.eventDate.slice(0, 10) : '',
    eventType: lead.eventType || 'OTHER',
    eventLocation: lead.eventLocation || '',
    guestCount: lead.guestCount?.toString() || '',
    budget: lead.budget || '',
    message: lead.message || '',
    status: lead.status || 'NEW',
    priority: lead.priority || 'MEDIUM',
    source: lead.source || 'WEBSITE',
    assignedTo: lead.assignedTo || '',
    interestedPackId: lead.interestedPackId || '',
    interestedExtras: (lead.interestedExtras || []).join(', '),
    landingPage: lead.landingPage || '',
    utmSource: lead.utmSource || '',
    utmMedium: lead.utmMedium || '',
    utmCampaign: lead.utmCampaign || '',
    preferredLocale: (lead.preferredLocale || 'es').toLowerCase(),
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        eventDate: form.eventDate || undefined,
        eventType: form.eventType,
        eventLocation: form.eventLocation || null,
        guestCount: form.guestCount ? Number(form.guestCount) : undefined,
        budget: form.budget || null,
        message: form.message || null,
        status: form.status,
        priority: form.priority,
        source: form.source,
        assignedTo: form.assignedTo || null,
        interestedPackId: form.interestedPackId || null,
        interestedExtras: form.interestedExtras
          ? form.interestedExtras.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
        landingPage: form.landingPage || null,
        utmSource: form.utmSource || null,
        utmMedium: form.utmMedium || null,
        utmCampaign: form.utmCampaign || null,
        preferredLocale: form.preferredLocale || 'es',
      };

      const res = await fetch(`/api/admin/leads-new/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error guardant');
      }

      setStatus('Guardat correctament');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error guardant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-700">Fitxa del lead</h2>
          <p className="text-sm text-slate-500">Dades principals i seguiment comercial.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
        >
          {saving ? 'Guardant...' : 'Guardar canvis'}
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Nom
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Email
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Telèfon
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Data event
          <input
            type="date"
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.eventDate}
            onChange={(e) => updateField('eventDate', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Tipus event
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.eventType}
            onChange={(e) => updateField('eventType', e.target.value)}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Ubicació
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.eventLocation}
            onChange={(e) => updateField('eventLocation', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Invitats
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.guestCount}
            onChange={(e) => updateField('guestCount', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Pressupost
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.budget}
            onChange={(e) => updateField('budget', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
          Missatge
          <textarea
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            rows={3}
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Estat
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Prioritat
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.priority}
            onChange={(e) => updateField('priority', e.target.value)}
          >
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Origen
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.source}
            onChange={(e) => updateField('source', e.target.value)}
          >
            {SOURCE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Responsable
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.assignedTo}
            onChange={(e) => updateField('assignedTo', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Idioma preferit
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.preferredLocale}
            onChange={(e) => updateField('preferredLocale', e.target.value)}
          >
            <option value="es">es</option>
            <option value="ca">ca</option>
            <option value="en">en</option>
            <option value="fr">fr</option>
            <option value="ar">ar</option>
            <option value="zh">zh</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Pack interessat
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.interestedPackId}
            onChange={(e) => updateField('interestedPackId', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
          Extras (separats per coma)
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.interestedExtras}
            onChange={(e) => updateField('interestedExtras', e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Landing page
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.landingPage}
            onChange={(e) => updateField('landingPage', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          UTM source
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.utmSource}
            onChange={(e) => updateField('utmSource', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          UTM medium
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.utmMedium}
            onChange={(e) => updateField('utmMedium', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
          UTM campaign
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.utmCampaign}
            onChange={(e) => updateField('utmCampaign', e.target.value)}
          />
        </label>
      </div>

      {status && (
        <p className="mt-3 text-sm text-slate-500" role="status" aria-live="polite">
          {status}
        </p>
      )}
    </section>
  );
}
