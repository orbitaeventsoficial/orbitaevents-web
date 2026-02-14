'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InfoTooltip from '../../components/InfoTooltip';

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
const SOURCE_OPTIONS = ['WEBSITE', 'CONFIGURATOR', 'PHONE', 'WHATSAPP', 'INSTAGRAM', 'WALLAPOP', 'REFERRAL', 'GOOGLE', 'OTHER'];
const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nou lead',
  CONTACTED: 'Contactat',
  QUOTE_SENT: 'Pressupost enviat',
  NEGOTIATING: 'En negociació',
  WON: 'Guanyat',
  LOST: 'Perdut',
};
const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Mitjana',
  HIGH: 'Alta',
  URGENT: 'Urgent',
};
const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Boda',
  BIRTHDAY: 'Aniversari',
  CORPORATE: 'Corporatiu',
  COMMUNION: 'Comunió',
  BAPTISM: 'Bateig',
  GRADUATION: 'Graduació',
  ANNIVERSARY: 'Aniversari',
  PRIVATE_PARTY: 'Festa privada',
  OTHER: 'Altre',
};
const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Web',
  CONFIGURATOR: 'Configurador',
  PHONE: 'Telèfon',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  WALLAPOP: 'Wallapop',
  REFERRAL: 'Recomanació',
  GOOGLE: 'Google',
  OTHER: 'Altres',
};

export default function LeadProfileEditor({ lead }: { lead: LeadProfile }) {
  const router = useRouter();
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
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeleteLead = async () => {
    if (deleting) return;
    const confirmed = window.confirm(
      'Segur que vols eliminar aquest registre? Aquesta acció no es pot desfer.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/leads-new/${lead.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No s’ha pogut eliminar el registre');
      }
      router.push('/admin/leads');
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error eliminant registre');
    } finally {
      setDeleting(false);
    }
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
          <h2 className="text-lg font-semibold text-slate-900">Fitxa del lead</h2>
          <p className="text-sm text-slate-700">Dades principals i seguiment comercial.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteLead}
            disabled={deleting || saving}
            className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
          >
            {deleting ? 'Eliminant...' : 'Eliminar registre'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || deleting}
            aria-busy={saving}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {saving ? 'Guardant...' : 'Guardar canvis'}
          </button>
        </div>
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
                {EVENT_TYPE_LABELS[type] || type}
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
          <span className="inline-flex items-center gap-1">
            Estat
            <InfoTooltip text="Fase comercial actual del lead: nou, contactat, pressupost enviat, negociació, guanyat o perdut." />
          </span>
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABELS[item] || item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1">
            Prioritat
            <InfoTooltip text="Nivell d'urgència comercial per ordenar seguiment i tasques." />
          </span>
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.priority}
            onChange={(e) => updateField('priority', e.target.value)}
          >
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {PRIORITY_LABELS[item] || item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1">
            Origen
            <InfoTooltip text="Canal pel qual ha arribat el lead (Web, WhatsApp, Instagram, Wallapop, etc.)." />
          </span>
          <select
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.source}
            onChange={(e) => updateField('source', e.target.value)}
          >
            {SOURCE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {SOURCE_LABELS[item] || item}
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
          <span className="inline-flex items-center gap-1">
            Landing page
            <InfoTooltip text="Pàgina exacta on l'usuari estava quan va enviar el formulari." />
          </span>
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.landingPage}
            onChange={(e) => updateField('landingPage', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1">
            UTM source
            <InfoTooltip text="Font de la campanya (ex: google, instagram, newsletter)." />
          </span>
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.utmSource}
            onChange={(e) => updateField('utmSource', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1">
            UTM medium
            <InfoTooltip text="Tipus de canal de captació (ex: cpc, social, email, organic)." />
          </span>
          <input
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-slate-700"
            value={form.utmMedium}
            onChange={(e) => updateField('utmMedium', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
          <span className="inline-flex items-center gap-1">
            UTM campaign
            <InfoTooltip text="Nom de la campanya de màrqueting (ex: primavera-2026, black-friday)." />
          </span>
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
