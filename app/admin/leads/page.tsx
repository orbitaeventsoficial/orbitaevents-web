import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import Link from 'next/link';
import LeadActions from './LeadActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Leads | Òrbita Admin',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  NEW: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nou Lead' },
  CONTACTED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Contactat' },
  QUOTE_SENT: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Negociació' },
  WON: { bg: 'bg-green-100', text: 'text-green-700', label: 'Guanyat!' },
  LOST: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Perdut' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Boda',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '🎉 Aniversari',
  PRIVATE_PARTY: '🎵 Festa privada',
  OTHER: '📋 Altre',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-stone-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

async function getLeads() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
        booking: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
    });
    return leads;
  } catch (e) {
    log.error('Error obtenint leads:', e);
    return [];
  }
}

export default async function LeadsPage() {
  const leads = await getLeads();

  // Estadístiques ràpides
  const stats = {
    total: leads.length,
    nous: leads.filter((l) => l.status === 'NEW').length,
    enNegociacio: leads.filter((l) => ['CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'].includes(l.status)).length,
    convertits: leads.filter((l) => l.status === 'WON').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">Leads / Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona tots els contactes que han entrat pel web
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Tornar al panell
        </Link>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Leads</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600 uppercase">Nous (per contactar)</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{stats.nous}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-yellow-600 uppercase">En negociació</p>
          <p className="mt-2 text-3xl font-bold text-yellow-700">{stats.enNegociacio}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Convertits</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{stats.convertits}</p>
        </div>
      </section>

      {/* Leads Table */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Client</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Contacte</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tipus Event</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Data Event</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Estat</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Prioritat</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Creat</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📭</span>
                      <p>Encara no hi ha leads</p>
                      <p className="text-xs text-slate-400">Els contactes del formulari web apareixeran aquí</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
                  const eventType = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;
                  const priorityColor = PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS.MEDIUM;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      {/* Client */}
                      <td className="px-4 py-3">
                        <Link href={`/admin/leads/${lead.id}`} className="font-medium text-slate-700 hover:text-amber-600">
                          {lead.name}
                        </Link>
                        {lead.booking && (
                          <div className="text-xs text-green-600">✓ Reserva: {lead.booking.reference}</div>
                        )}
                      </td>

                      {/* Contacte */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <a
                            href={`mailto:${lead.email}`}
                            className="block text-blue-600 hover:underline truncate max-w-[200px]"
                            title={lead.email}
                          >
                            {lead.email}
                          </a>
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="block text-slate-600 hover:text-slate-700"
                            >
                              📱 {lead.phone}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Tipus Event */}
                      <td className="px-4 py-3 text-slate-700">{eventType}</td>

                      {/* Data Event */}
                      <td className="px-4 py-3 text-slate-700">
                        {lead.eventDate
                          ? new Date(lead.eventDate).toLocaleDateString('ca-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Estat */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Prioritat */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor}`}>
                          {lead.priority}
                        </span>
                      </td>

                      {/* Creat */}
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(lead.createdAt).toLocaleDateString('ca-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Accions */}
                      <td className="px-4 py-3 text-right">
                        <LeadActions
                          leadId={lead.id}
                          leadName={lead.name}
                          phone={lead.phone}
                          hasBooking={!!lead.booking}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
