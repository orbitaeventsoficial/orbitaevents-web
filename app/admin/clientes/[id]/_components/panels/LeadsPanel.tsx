import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import Link from 'next/link';
import { EVENT_TYPE_LABELS, LEAD_STATUS_CONFIG as STATUS_CONFIG, formatDate, formatDateSimple, formatNumber } from '@/lib/constants';

export default function LeadsPanel({ data }: { data: CustomerHubDTO }) {
  return (
    <section className="rounded-2xl border p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Entrades vinculades</h2>
          <p className="text-sm">
            Historial d&apos;oportunitats comercials d&apos;aquest client.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {data.leads.length === 0 ? (
          <p className="rounded-xl border p-3 text-sm">
            Cap entrada vinculada a aquest client.
          </p>
        ) : (
          data.leads.map((lead) => {
            const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
            return (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="block rounded-xl border p-4 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{lead.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusConf.bg} ${statusConf.text}`}
                  >
                    {statusConf.label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="">
                    {EVENT_TYPE_LABELS[lead.eventType] || lead.eventType}
                  </span>
                  <span className="">
                    {lead.eventDate
                      ? formatDate(lead.eventDate)
                      : 'Sense data'}
                  </span>
                </div>
                {lead.booking && (
                  <p className="mt-2 text-xs">
                    Reserva {lead.booking.reference} · {formatNumber(lead.booking.total)}€
                  </p>
                )}
                <p className="mt-1 text-[11px]">
                  Creada {formatDateSimple(lead.createdAt)}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
