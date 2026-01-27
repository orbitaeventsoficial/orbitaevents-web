import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import Link from 'next/link';
import LeadActions from './LeadActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Leads | Òrbita Admin',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  NEW: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Nou Lead' },
  CONTACTED: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Contactat' },
  QUOTE_SENT: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Negociació' },
  WON: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Guanyat!' },
  LOST: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Perdut' },
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
  LOW: 'bg-slate-500/20 text-slate-300',
  MEDIUM: 'bg-blue-500/20 text-blue-300',
  HIGH: 'bg-orange-500/20 text-orange-300',
  URGENT: 'bg-rose-500/20 text-rose-300',
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100">Leads</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {stats.total} contactes
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
        >
          ← Tornar
        </Link>
      </header>

      {/* Stats Cards - 2x2 mobile */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase">Total</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-sky-400 uppercase">Nous</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-100">{stats.nous}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-amber-400 uppercase">Negociació</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-100">{stats.enNegociacio}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-medium text-emerald-400 uppercase">Convertits</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-100">{stats.convertits}</p>
        </div>
      </section>

      {/* Mobile Card View */}
      <section className="lg:hidden space-y-3">
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-8 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-2 text-slate-300">Encara no hi ha leads</p>
            <p className="text-xs text-slate-500">Els contactes apareixeran aquí</p>
          </div>
        ) : (
          leads.map((lead) => {
            const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
            const eventType = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;

            return (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="block rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4 hover:bg-slate-700/40 active:bg-slate-700/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-semibold shrink-0">
                      {lead.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-100 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-400 truncate">{lead.email}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.bg} ${statusConf.text}`}>
                    {statusConf.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{eventType}</span>
                  <span>
                    {lead.eventDate
                      ? new Date(lead.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })
                      : 'Sense data'}
                  </span>
                </div>
                {lead.booking && (
                  <div className="mt-2 text-xs text-emerald-400 font-medium">✓ Reserva: {lead.booking.reference}</div>
                )}
              </Link>
            );
          })
        )}
      </section>

      {/* Desktop Table View */}
      <section className="hidden lg:block rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/30 border-b border-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Client</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Contacte</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Tipus</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Data</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Estat</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">Prioritat</th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📭</span>
                      <p>Encara no hi ha leads</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
                  const eventType = EVENT_TYPE_LABELS[lead.eventType] || lead.eventType;
                  const priorityColor = PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS.MEDIUM;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/leads/${lead.id}`} className="font-medium text-slate-100 hover:text-cyan-400">
                          {lead.name}
                        </Link>
                        {lead.booking && (
                          <div className="text-xs text-emerald-400">✓ {lead.booking.reference}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${lead.email}`} className="text-cyan-400 hover:underline text-xs truncate block max-w-[180px]">
                          {lead.email}
                        </a>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-slate-400 text-xs">📱 {lead.phone}</a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{eventType}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {lead.eventDate
                          ? new Date(lead.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <LeadActions leadId={lead.id} leadName={lead.name} phone={lead.phone} hasBooking={!!lead.booking} />
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
