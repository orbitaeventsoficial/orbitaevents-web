'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InfoTooltip from '../../components/InfoTooltip';
import { ADMIN_HELP } from '../../components/adminHelpGlossary';
import { LEAD_STATUS_LABELS as STATUS_LABELS, PRIORITY_LABELS, EVENT_TYPE_PLAIN as EVENT_TYPE_LABELS, SOURCE_LABELS } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';

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
    preferredLocale: (lead.preferredLocale || 'ca').toLowerCase(),
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmingDelete) return;
    const t = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmingDelete]);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeleteLead = async () => {
    if (deleting) return;
    if (!confirmingDelete) { setConfirmingDelete(true); return; }
    setConfirmingDelete(false);
    setDeleting(true);
    setStatus(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${lead.id}`, {
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
        preferredLocale: form.preferredLocale || 'ca',
      };

      const res = await fetchWithCsrf(`/api/admin/leads/${lead.id}`, {
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
    <section className="rounded-xl border border-white/10 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Fitxa del lead</h2>
          <p className="text-sm">Dades principals i seguiment comercial.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteLead}
            disabled={deleting || saving}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60 ${confirmingDelete ? 'border-rose-500 admin-tone-soft-danger' : ''}`}
          >
            {deleting ? 'Eliminant...' : confirmingDelete ? 'Segur? Fes clic per confirmar' : 'Eliminar registre'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || deleting}
            aria-busy={saving}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardant...' : 'Desar canvis'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Nom
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Telèfon
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Data event
          <input
            type="date"
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.eventDate}
            onChange={(e) => updateField('eventDate', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tipus event
          <select
            className="rounded-xl border border-white/10 px-3 py-2"
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
        <label className="flex flex-col gap-1 text-sm">
          Ubicació
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.eventLocation}
            onChange={(e) => updateField('eventLocation', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Invitats
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.guestCount}
            onChange={(e) => updateField('guestCount', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Pressupost
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.budget}
            onChange={(e) => updateField('budget', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Missatge
          <textarea
            className="rounded-xl border border-white/10 px-3 py-2"
            rows={3}
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="inline-flex items-center gap-1">
            Estat
            <InfoTooltip text={ADMIN_HELP.leadStatus} />
          </span>
          <select
            className="rounded-xl border border-white/10 px-3 py-2"
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
        <label className="flex flex-col gap-1 text-sm">
          <span className="inline-flex items-center gap-1">
            Prioritat
            <InfoTooltip text={ADMIN_HELP.leadPriority} />
          </span>
          <select
            className="rounded-xl border border-white/10 px-3 py-2"
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
        <label className="flex flex-col gap-1 text-sm">
          <span className="inline-flex items-center gap-1">
            Origen
            <InfoTooltip text={ADMIN_HELP.leadEditorSource} />
          </span>
          <select
            className="rounded-xl border border-white/10 px-3 py-2"
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
        <label className="flex flex-col gap-1 text-sm">
          Responsable
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.assignedTo}
            onChange={(e) => updateField('assignedTo', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Idioma preferit
          <select
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.preferredLocale}
            onChange={(e) => updateField('preferredLocale', e.target.value)}
          >
            <option value="es">es</option>
            <option value="ca">ca</option>
            <option value="en">en</option>
            <option value="ru">ru</option>
            <option value="fr">fr</option>
            <option value="de">de</option>
            <option value="it">it</option>
            <option value="pt">pt</option>
            <option value="ar">ar</option>
            <option value="zh">zh</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Pack interessat
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.interestedPackId}
            onChange={(e) => updateField('interestedPackId', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Extras (separats per coma)
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.interestedExtras}
            onChange={(e) => updateField('interestedExtras', e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="inline-flex items-center gap-1">
            Landing page
            <InfoTooltip text={ADMIN_HELP.leadEditorLanding} />
          </span>
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.landingPage}
            onChange={(e) => updateField('landingPage', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="inline-flex items-center gap-1">
            UTM source
            <InfoTooltip text={ADMIN_HELP.leadEditorUtmSource} />
          </span>
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.utmSource}
            onChange={(e) => updateField('utmSource', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="inline-flex items-center gap-1">
            UTM medium
            <InfoTooltip text={ADMIN_HELP.leadEditorUtmMedium} />
          </span>
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.utmMedium}
            onChange={(e) => updateField('utmMedium', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="inline-flex items-center gap-1">
            UTM campaign
            <InfoTooltip text={ADMIN_HELP.leadEditorUtmCampaign} />
          </span>
          <input
            className="rounded-xl border border-white/10 px-3 py-2"
            value={form.utmCampaign}
            onChange={(e) => updateField('utmCampaign', e.target.value)}
          />
        </label>
      </div>

      {status && (
        <p className="mt-3 text-sm" role="status" aria-live="polite">
          {status}
        </p>
      )}
    </section>
  );
}




