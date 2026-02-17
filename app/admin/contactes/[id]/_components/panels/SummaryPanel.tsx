'use client';

import { useState, useCallback } from 'react';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY PANEL MILLORAT
// Mostra informació clau del client amb edició in-line i accions ràpides
// ═══════════════════════════════════════════════════════════════════════════

type CustomerEditableFields = {
  name: string;
  email: string;
  phone: string;
  instagram?: string;
  preferredLocale: string;
};

export default function SummaryPanel({ data }: { data: CustomerHubDTO }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CustomerEditableFields>({
    name: data.customer.name || '',
    email: data.customer.email || '',
    phone: data.customer.phone || '',
    preferredLocale: 'ca',
  });

  // Calcular estadístiques
  const openTasks = data.tasks.filter((t) => !t.done).length;
  const urgentTasks = data.tasks.filter((t) => !t.done && t.priority === 'HIGH').length;
  const draftProposals = data.proposals.filter((p) => p.status === 'DRAFT').length;
  const sentProposals = data.proposals.filter((p) => p.status === 'SENT').length;
  const acceptedProposals = data.proposals.filter((p) => p.status === 'ACCEPTED').length;
  const confirmedBookings = data.bookings.filter((b) => b.status === 'CONFIRMED').length;
  const upcomingBookings = data.bookings.filter(
    (b) => b.date && new Date(b.date) > new Date() && b.status !== 'CANCELLED'
  );

  const nextTask = data.tasks.find((t) => !t.done);
  const nextEvents = upcomingBookings.slice(0, 3);
  const nextEvent = nextEvents[0];
  const activeDiscounts = (data.discountCodes || []).filter(
    (dc) => dc.isActive && dc.currentUses < dc.maxUses && new Date(dc.validUntil) > new Date()
  );

  // Alertes automàtiques
  const alerts: Array<{ type: 'warning' | 'info' | 'success'; text: string }> = [];
  if (urgentTasks > 0) {
    alerts.push({ type: 'warning', text: `${urgentTasks} tasca${urgentTasks > 1 ? 'ques' : ''} urgent${urgentTasks > 1 ? 's' : ''}` });
  }
  if (draftProposals > 0) {
    alerts.push({ type: 'info', text: `${draftProposals} pressupost${draftProposals > 1 ? 's' : ''} en esborrany` });
  }
  if (sentProposals > 0 && acceptedProposals === 0) {
    alerts.push({ type: 'info', text: `${sentProposals} pressupost${sentProposals > 1 ? 's' : ''} pendent${sentProposals > 1 ? 's' : ''} de resposta` });
  }
  if (confirmedBookings > 0) {
    alerts.push({ type: 'success', text: `${confirmedBookings} reserva${confirmedBookings > 1 ? 'es' : ''} confirmada${confirmedBookings > 1 ? 'es' : ''}` });
  }
  if (activeDiscounts.length > 0) {
    alerts.push({ type: 'info', text: `${activeDiscounts.length} codi${activeDiscounts.length > 1 ? 's' : ''} de descompte actiu${activeDiscounts.length > 1 ? 's' : ''} (${activeDiscounts.map(d => d.code).join(', ')})` });
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${data.customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "No s'ha pogut guardar");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desant canvis');
    } finally {
      setSaving(false);
    }
  }, [data.customer.id, formData, router]);

  const cancelEdit = useCallback(() => {
    setFormData({
      name: data.customer.name || '',
      email: data.customer.email || '',
      phone: data.customer.phone || '',
      preferredLocale: 'ca',
    });
    setEditing(false);
    setError(null);
  }, [data.customer]);

  return (
    <section className="space-y-4">
      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2 text-sm ${
                alert.type === 'warning'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : alert.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-sky-500/40 bg-sky-500/10 text-sky-200'
              }`}
            >
              {alert.type === 'warning' && '⚠️ '}
              {alert.type === 'success' && '✅ '}
              {alert.type === 'info' && 'ℹ️ '}
              {alert.text}
            </div>
          ))}
        </div>
      )}

      {/* Informació de contacte */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Informació de contacte</h2>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              ✏️ Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel·la
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                {saving ? 'Desant...' : 'Desa'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoField
            label="Nom"
            value={formData.name}
            editing={editing}
            onChange={(v) => setFormData((prev) => ({ ...prev, name: v }))}
          />
          <InfoField
            label="Email"
            value={formData.email}
            editing={editing}
            type="email"
            onChange={(v) => setFormData((prev) => ({ ...prev, email: v }))}
          />
          <InfoField
            label="Telèfon"
            value={formData.phone}
            editing={editing}
            type="tel"
            onChange={(v) => setFormData((prev) => ({ ...prev, phone: v }))}
          />
          <InfoField
            label="Idioma preferit"
            value={formData.preferredLocale}
            editing={editing}
            type="select"
            options={[
              { value: 'ca', label: 'Català' },
              { value: 'es', label: 'Castellà' },
              { value: 'en', label: 'Anglès' },
            ]}
            onChange={(v) => setFormData((prev) => ({ ...prev, preferredLocale: v }))}
          />
        </div>
      </div>

      {/* Estadístiques */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-slate-100">Resum operatiu</h2>
        <p className="mt-1 text-sm text-slate-400">
          Client des de {new Date(data.customer.createdAt).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pressupostos"
            value={data.proposals.length}
            detail={acceptedProposals > 0 ? `${acceptedProposals} acceptat${acceptedProposals > 1 ? 's' : ''}` : undefined}
            color="cyan"
          />
          <StatCard
            label="Reserves"
            value={data.bookings.length}
            detail={upcomingBookings.length > 0 ? `${upcomingBookings.length} pròxim${upcomingBookings.length > 1 ? 's' : ''}` : undefined}
            color="indigo"
          />
          <StatCard
            label="Tasques"
            value={openTasks}
            detail={urgentTasks > 0 ? `${urgentTasks} urgent${urgentTasks > 1 ? 's' : ''}` : 'cap pendent'}
            color={urgentTasks > 0 ? 'amber' : 'emerald'}
          />
          <StatCard
            label="Comunicacions"
            value={data.messages.length}
            detail={data.messages[0] ? `Última: ${formatRelativeDate(data.messages[0].createdAt)}` : undefined}
            color="violet"
          />
        </div>
      </div>

      {/* Pròxima acció / Pròxim esdeveniment */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          title="Pròxima tasca"
          isEmpty={!nextTask}
          emptyText="Sense tasques pendents"
          content={
            nextTask && (
              <>
                <p className="text-sm font-medium text-slate-100">{nextTask.title}</p>
                {nextTask.dueDate && (
                  <p className="mt-1 text-xs text-slate-400">
                    Venciment: {new Date(nextTask.dueDate).toLocaleDateString('ca-ES')}
                  </p>
                )}
                {nextTask.priority === 'HIGH' && (
                  <span className="mt-2 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    URGENT
                  </span>
                )}
              </>
            )
          }
          action={
            <a
              href={`/admin/tasks/new?customerId=${data.customer.id}`}
              className="text-xs text-cyan-300 hover:text-cyan-200"
            >
              + Nova tasca
            </a>
          }
        />

        <ActionCard
          title={`Pròxims esdeveniments (${nextEvents.length})`}
          isEmpty={nextEvents.length === 0}
          emptyText="Sense esdeveniments programats"
          content={
            nextEvents.length > 0 && (
              <div className="space-y-3">
                {nextEvents.map((ev) => (
                  <div key={ev.id} className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-100">
                        {ev.reference || 'Reserva'}
                      </p>
                      <a
                        href={`/admin/bookings/${ev.id}`}
                        className="text-[11px] text-cyan-300 hover:text-cyan-200"
                      >
                        Obrir →
                      </a>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {ev.date && new Date(ev.date).toLocaleDateString('ca-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                      {ev.startTime && ` · ${ev.startTime}`}
                    </p>
                    {ev.location && (
                      <p className="text-[11px] text-slate-500">📍 {ev.location}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          }
          action={
            <a
              href={`/admin/bookings/new?customerId=${data.customer.id}`}
              className="text-xs text-cyan-300 hover:text-cyan-200"
            >
              + Nova reserva
            </a>
          }
        />
      </div>

      {/* Accions ràpides contextuals */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
        <h3 className="text-sm font-semibold text-slate-300">Accions ràpides</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {draftProposals > 0 && (
            <QuickAction
              href={`/admin/presupuestos?customerId=${data.customer.id}`}
              label="Continuar pressupost"
              color="cyan"
            />
          )}
          {sentProposals > 0 && acceptedProposals === 0 && (
            <QuickAction
              href={`/admin/inbox/compose?customerId=${data.customer.id}&template=recordatori`}
              label="Enviar recordatori"
              color="amber"
            />
          )}
          {acceptedProposals > 0 && confirmedBookings === 0 && (
            <QuickAction
              href={`/admin/bookings/new?customerId=${data.customer.id}`}
              label="Crear reserva"
              color="emerald"
            />
          )}
          {confirmedBookings > 0 && (
            <QuickAction
              href={`/admin/inbox/compose?customerId=${data.customer.id}&template=confirmacio`}
              label="Enviar confirmació"
              color="indigo"
            />
          )}
          <QuickAction
            href={`/admin/inbox/compose?customerId=${data.customer.id}`}
            label="Enviar missatge"
            color="slate"
          />
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function InfoField({
  label,
  value,
  editing,
  type = 'text',
  options,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  type?: 'text' | 'email' | 'tel' | 'select';
  options?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  if (!editing) {
    return (
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-1 text-sm text-slate-100">{value || '—'}</p>
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div>
        <label className="text-xs text-slate-400">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: number;
  detail?: string;
  color: 'cyan' | 'indigo' | 'amber' | 'emerald' | 'violet';
}) {
  const colorStyles = {
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
    indigo: 'border-indigo-500/30 bg-indigo-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    violet: 'border-violet-500/30 bg-violet-500/5',
  };

  return (
    <div className={`rounded-xl border p-3 ${colorStyles[color]}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
      {detail && <p className="mt-0.5 text-[11px] text-slate-500">{detail}</p>}
    </div>
  );
}

function ActionCard({
  title,
  isEmpty,
  emptyText,
  content,
  action,
}: {
  title: string;
  isEmpty: boolean;
  emptyText: string;
  content: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
        {action}
      </div>
      <div className="mt-3">
        {isEmpty ? (
          <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  color,
}: {
  href: string;
  label: string;
  color: 'cyan' | 'amber' | 'emerald' | 'indigo' | 'slate';
}) {
  const colorStyles = {
    cyan: 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10',
    amber: 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10',
    emerald: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10',
    indigo: 'border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10',
    slate: 'border-slate-600 text-slate-300 hover:bg-slate-800',
  };

  return (
    <a
      href={href}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${colorStyles[color]}`}
    >
      {label}
    </a>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'avui';
  if (diffDays === 1) return 'ahir';
  if (diffDays < 7) return `fa ${diffDays} dies`;
  if (diffDays < 30) return `fa ${Math.floor(diffDays / 7)} setmanes`;
  return date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
}
