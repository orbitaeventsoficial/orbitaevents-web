import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import Link from 'next/link';

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Casament',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '🎉 Celebració',
  PRIVATE_PARTY: '🎵 Festa privada',
  OTHER: '📋 Altre',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  NEW: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Nova entrada' },
  CONTACTED: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Contactat' },
  QUOTE_SENT: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Negociació' },
  WON: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Guanyat' },
  LOST: { bg: 'bg-slate-500/20', text: 'text-slate-300', label: 'Perdut' },
};

export default function LeadsPanel({ data }: { data: CustomerHubDTO }) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Entrades vinculades</h2>
          <p className="text-sm text-slate-400">
            Historial d&apos;oportunitats comercials d&apos;aquest client.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {data.leads.length === 0 ? (
          <p className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 text-sm text-slate-400">
            Cap entrada vinculada a aquest client.
          </p>
        ) : (
          data.leads.map((lead) => {
            const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
            return (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="block rounded-xl border border-slate-700/70 bg-slate-800/60 p-4 hover:bg-slate-800 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">{lead.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusConf.bg} ${statusConf.text}`}
                  >
                    {statusConf.label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="text-slate-200">
                    {EVENT_TYPE_LABELS[lead.eventType] || lead.eventType}
                  </span>
                  <span className="text-slate-400">
                    {lead.eventDate
                      ? new Date(lead.eventDate).toLocaleDateString('ca-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Sense data'}
                  </span>
                </div>
                {lead.booking && (
                  <p className="mt-2 text-xs text-emerald-400">
                    Reserva {lead.booking.reference} · {lead.booking.total.toLocaleString('ca-ES')}€
                  </p>
                )}
                <p className="mt-1 text-[11px] text-slate-500">
                  Creada {new Date(lead.createdAt).toLocaleDateString('ca-ES')}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
