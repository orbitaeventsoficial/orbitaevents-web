// app/admin/mensajes/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió de missatges i comunicacions
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Missatges | Òrbita Admin',
};

async function getMessagesData() {
  try {
    const [
      recentLeads,
      pendingLeads,
      todayLeads,
    ] = await Promise.all([
      // Leads recents amb missatge
      prisma.lead.findMany({
        where: {
          message: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      // Leads pendents de contactar
      prisma.lead.count({
        where: { status: 'NEW' },
      }),
      // Leads d'avui
      prisma.lead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      recentLeads,
      pendingLeads,
      todayLeads,
    };
  } catch (error) {
    log.error('Error obtenint missatges:', error);
    return {
      recentLeads: [],
      pendingLeads: 0,
      todayLeads: 0,
    };
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Nou', color: 'text-blue-700', bg: 'bg-blue-100' },
  CONTACTED: { label: 'Contactat', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  QUOTE_SENT: { label: 'Pressupost', color: 'text-purple-700', bg: 'bg-purple-100' },
  NEGOTIATING: { label: 'Negociant', color: 'text-orange-700', bg: 'bg-orange-100' },
  WON: { label: 'Guanyat', color: 'text-green-700', bg: 'bg-green-100' },
  LOST: { label: 'Perdut', color: 'text-red-700', bg: 'bg-red-100' },
};

const SOURCE_ICONS: Record<string, string> = {
  WEBSITE: '🌐',
  CONFIGURATOR: '⚙️',
  PHONE: '📞',
  WHATSAPP: '💬',
  INSTAGRAM: '📸',
  WALLAPOP: '🟣',
  REFERRAL: '👥',
  GOOGLE: '🔍',
  OTHER: '📩',
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Ara mateix';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Fa ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Fa ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Fa ${days}d`;
  return date.toLocaleDateString('ca-ES');
}

export default async function MensajesPage() {
  const data = await getMessagesData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">Missatges</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona les comunicacions amb clients
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600 uppercase">Pendents de Contactar</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{data.pendingLeads}</p>
          <p className="text-xs text-blue-500 mt-1">Leads nous sense resposta</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Rebuts Avui</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{data.todayLeads}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Converses</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{data.recentLeads.length}</p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/admin/leads?status=NEW"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          🔵 Veure Nous ({data.pendingLeads})
        </Link>
        <a
          href="https://wa.me/34600000000"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
        >
          💬 Obrir WhatsApp Web
        </a>
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100"
        >
          👥 Tots els Leads
        </Link>
      </section>

      {/* Message Templates */}
      <section className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-stone-200 p-4">
          <h3 className="font-semibold text-slate-700">📋 Plantilles Ràpides</h3>
        </div>
        <div className="p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <button type="button" className="p-3 rounded-lg border border-stone-200 text-left hover:bg-slate-50 transition-colors">
            <p className="font-medium text-slate-700">Primer Contacte</p>
            <p className="text-xs text-slate-500 mt-1">Resposta inicial a nou lead</p>
          </button>
          <button type="button" className="p-3 rounded-lg border border-stone-200 text-left hover:bg-slate-50 transition-colors">
            <p className="font-medium text-slate-700">Enviar Pressupost</p>
            <p className="text-xs text-slate-500 mt-1">Acompanyament de pressupost</p>
          </button>
          <button type="button" className="p-3 rounded-lg border border-stone-200 text-left hover:bg-slate-50 transition-colors">
            <p className="font-medium text-slate-700">Seguiment</p>
            <p className="text-xs text-slate-500 mt-1">Recordatori després de dies</p>
          </button>
          <button type="button" className="p-3 rounded-lg border border-stone-200 text-left hover:bg-slate-50 transition-colors">
            <p className="font-medium text-slate-700">Confirmació</p>
            <p className="text-xs text-slate-500 mt-1">Confirmar reserva</p>
          </button>
          <button type="button" className="p-3 rounded-lg border border-stone-200 text-left hover:bg-slate-50 transition-colors">
            <p className="font-medium text-slate-700">Pre-Event</p>
            <p className="text-xs text-slate-500 mt-1">Detalls abans de l&apos;event</p>
          </button>
          <button type="button" className="p-3 rounded-lg border border-stone-200 text-left hover:bg-slate-50 transition-colors">
            <p className="font-medium text-slate-700">Post-Event</p>
            <p className="text-xs text-slate-500 mt-1">Agraïment i enquesta</p>
          </button>
        </div>
      </section>

      {/* Recent Messages */}
      <section className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-stone-200 p-4">
          <h3 className="font-semibold text-slate-700">📬 Missatges Recents</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {data.recentLeads.map((lead) => {
            const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
            const sourceIcon = SOURCE_ICONS[lead.source] || '📩';
            return (
              <div
                key={lead.id}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold shrink-0">
                    {lead.name.charAt(0)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700">{lead.name}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-slate-400">{sourceIcon}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {lead.message || 'Sense missatge'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{timeAgo(lead.createdAt)}</span>
                      {lead.email && <span>{lead.email}</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                        title="WhatsApp"
                      >
                        💬
                      </a>
                    )}
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100 text-slate-700 hover:bg-stone-100"
                      title="Veure"
                    >
                      👁️
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {data.recentLeads.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              📭 No hi ha missatges
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
