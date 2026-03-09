'use client';

import { useState, useCallback } from 'react';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatDate, formatDateFull, formatDateShort, formatDateSimple } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';

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
      const res = await fetchWithCsrf(`/api/admin/customers/${data.customer.id}`, {
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
              className={`rounded-xl border px-3 py-2 text-sm ${
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
      <div className="rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Informació de contacte</h2>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl border px-3 py-1.5 text-xs"
            >
              ✏️ Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-xl border px-3 py-1.5 text-xs disabled:opacity-50"
              >
                Cancel·la
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Desant...' : 'Desa'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 rounded-xl border px-3 py-2 text-xs">
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
      <div className="rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Resum operatiu</h2>
        <p className="mt-1 text-sm">
          Client des de {formatDate(data.customer.createdAt)}
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

      {/* Resum financer visual */}
      {((data.kpis.totalQuoted ?? 0) > 0 || (data.kpis.totalPaid ?? 0) > 0) && (() => {
        const quoted = data.kpis.totalQuoted ?? 0;
        const paid = data.kpis.totalPaid ?? 0;
        const pct = quoted > 0 ? Math.round((paid / quoted) * 100) : 0;
        return (
          <div className="rounded-2xl border p-5">
            <h2 className="text-lg font-semibold">Resum financer</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wider">Pressupostat</p>
                <p className="mt-1 text-2xl font-semibold">{fmtMoney(quoted)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider">Cobrat</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-300">{fmtMoney(paid)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider">Marge estimat</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-300">{fmtMoney(data.kpis.marginEstimated)}</p>
              </div>
            </div>
            {quoted > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Cobrament</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Countdown pròxim event */}
      {nextEvent && nextEvent.date && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-300">Pròxim esdeveniment</p>
              <p className="mt-1 text-lg font-semibold">{nextEvent.reference || 'Reserva'}</p>
              <p className="text-sm">{formatDateFull(nextEvent.date)}{nextEvent.startTime && ` · ${nextEvent.startTime}`}</p>
              {nextEvent.location && <p className="text-xs mt-1">{nextEvent.location}</p>}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-cyan-300">{getDaysUntil(nextEvent.date)}</p>
              <p className="text-xs">dies</p>
            </div>
          </div>
        </div>
      )}

      {/* Pròxima acció / Pròxim esdeveniment */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          title="Pròxima tasca"
          isEmpty={!nextTask}
          emptyText="Sense tasques pendents"
          content={
            nextTask && (
              <>
                <p className="text-sm font-medium">{nextTask.title}</p>
                {nextTask.dueDate && (
                  <p className="mt-1 text-xs">
                    Venciment: {formatDateSimple(nextTask.dueDate)}
                  </p>
                )}
                {nextTask.priority === 'HIGH' && (
                  <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold">
                    URGENT
                  </span>
                )}
              </>
            )
          }
          action={
            <a
              href={`/admin/tasks/new?customerId=${data.customer.id}`}
              className="text-xs"
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
                  <div key={ev.id} className="rounded-xl border p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {ev.reference || 'Reserva'}
                      </p>
                      <a
                        href={`/admin/bookings/${ev.id}`}
                        className="text-[11px]"
                      >
                        Obrir →
                      </a>
                    </div>
                    <p className="mt-0.5 text-xs">
                      {ev.date && formatDateFull(ev.date)}
                      {ev.startTime && ` · ${ev.startTime}`}
                    </p>
                    {ev.location && (
                      <p className="text-[11px]">📍 {ev.location}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          }
          action={
            <a
              href={`/admin/bookings/new?customerId=${data.customer.id}`}
              className="text-xs"
            >
              + Nova reserva
            </a>
          }
        />
      </div>

      {/* Accions ràpides contextuals */}
      <div className="rounded-2xl border p-5">
        <h3 className="text-sm font-semibold">Accions ràpides</h3>
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
        <p className="text-xs">{label}</p>
        <p className="mt-1 text-sm">{value || '—'}</p>
      </div>
    );
  }

  const fieldId = `sp-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  if (type === 'select' && options) {
    return (
      <div>
        <label htmlFor={fieldId} className="text-xs">{label}</label>
        <select
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
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
      <label htmlFor={fieldId} className="text-xs">{label}</label>
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
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
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {detail && <p className="mt-0.5 text-[11px]">{detail}</p>}
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
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider">{title}</p>
        {action}
      </div>
      <div className="mt-3">
        {isEmpty ? (
          <p className="text-sm">{emptyText}</p>
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
    slate: 'border-white/15 text-white/60 hover:bg-white/10',
  };

  return (
    <a
      href={href}
      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${colorStyles[color]}`}
    >
      {label}
    </a>
  );
}

function fmtMoney(value?: number): string {
  if (typeof value !== 'number') return '—';
  return `${value.toLocaleString('ca-ES', { maximumFractionDigits: 0 })}€`;
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
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
  return formatDateShort(date);
}
