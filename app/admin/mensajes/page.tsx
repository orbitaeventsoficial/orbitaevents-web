// app/admin/mensajes/page.tsx
import { log } from '@/lib/logger';
import { formatDateSimple } from '@/lib/constants';
// Pàgina de gestió de missatges i comunicacions
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';

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
      // Entrades recents amb missatge
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
      // Entrades pendents de contactar
      prisma.lead.count({
        where: { status: 'NEW' },
      }),
      // Entrades d'avui
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

// Local config kept because it uses a `color` key (not `text`) and has
// different label/color values from the centralized LEAD_STATUS_CONFIG
// (e.g. shorter labels, LOST uses red instead of slate).
const LEAD_STATUS_CONFIG_LOCAL: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Nou', color: 'text-blue-300', bg: 'bg-blue-500/20' },
  CONTACTED: { label: 'Contactat', color: 'text-yellow-300', bg: 'bg-yellow-500/20' },
  QUOTE_SENT: { label: 'Pressupost', color: 'text-purple-300', bg: 'bg-purple-500/20' },
  NEGOTIATING: { label: 'Negociant', color: 'text-orange-300', bg: 'bg-orange-500/20' },
  WON: { label: 'Guanyat', color: 'text-green-300', bg: 'bg-green-500/20' },
  LOST: { label: 'Perdut', color: 'text-red-300', bg: 'bg-red-500/20' },
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
  return formatDateSimple(date);
}

export default async function MensajesPage() {
  const data = await getMessagesData();

  return (
    <AdminPage title="Missatges" subtitle="Gestiona les comunicacions amb la clientela">

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-medium uppercase">Pendents de contactar</p>
          <p className="mt-2 text-3xl font-bold">{data.pendingLeads}</p>
          <p className="text-xs mt-1">Entrades noves sense resposta</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-medium uppercase">Rebudes avui</p>
          <p className="mt-2 text-3xl font-bold">{data.todayLeads}</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-medium uppercase">Total converses</p>
          <p className="mt-2 text-3xl font-bold">{data.recentLeads.length}</p>
        </div>
      </section>

      {/* Accions ràpides */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/admin/leads?status=NEW"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
        >
          🔵 Veure noves ({data.pendingLeads})
        </Link>
        <a
          href="https://wa.me/34600000000"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
        >
          💬 Obrir WhatsApp Web
        </a>
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
        >
          👥 Totes les entrades
        </Link>
      </section>

      {/* Plantilles de missatge */}
      <section className="rounded-xl border shadow-sm overflow-hidden">
        <div className="border-b p-4">
          <h3 className="font-semibold">📋 Plantilles Ràpides</h3>
        </div>
        <div className="p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <button type="button" className="p-3 rounded-xl border text-left transition-colors">
            <p className="font-medium">Primer contacte</p>
            <p className="text-xs mt-1">Resposta inicial a una entrada nova</p>
          </button>
          <button type="button" className="p-3 rounded-xl border text-left transition-colors">
            <p className="font-medium">Envia pressupost</p>
            <p className="text-xs mt-1">Acompanyament de pressupost</p>
          </button>
          <button type="button" className="p-3 rounded-xl border text-left transition-colors">
            <p className="font-medium">Seguiment</p>
            <p className="text-xs mt-1">Recordatori després de dies</p>
          </button>
          <button type="button" className="p-3 rounded-xl border text-left transition-colors">
            <p className="font-medium">Confirmació</p>
            <p className="text-xs mt-1">Confirmar reserva</p>
          </button>
          <button type="button" className="p-3 rounded-xl border text-left transition-colors">
            <p className="font-medium">Preesdeveniment</p>
            <p className="text-xs mt-1">Detalls abans de l&apos;esdeveniment</p>
          </button>
          <button type="button" className="p-3 rounded-xl border text-left transition-colors">
            <p className="font-medium">Postesdeveniment</p>
            <p className="text-xs mt-1">Agraïment i enquesta</p>
          </button>
        </div>
      </section>

      {/* Missatges recents */}
      <section className="rounded-xl border shadow-sm overflow-hidden">
        <div className="border-b p-4">
          <h3 className="font-semibold">📬 Missatges recents</h3>
        </div>
        <div className="divide-y divide-white/5">
          {data.recentLeads.map((lead) => {
            const statusConfig = LEAD_STATUS_CONFIG_LOCAL[lead.status] || LEAD_STATUS_CONFIG_LOCAL.NEW;
            const sourceIcon = SOURCE_ICONS[lead.source] || '📩';
            return (
              <div
                key={lead.id}
                className="p-4 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                    {lead.name.charAt(0)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{lead.name}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-xs">{sourceIcon}</span>
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">
                      {lead.message || 'Sense missatge'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
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
                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl"
                        title="WhatsApp"
                      >
                        💬
                      </a>
                    )}
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-xl"
                      title="Obre"
                    >
                      👁️
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {data.recentLeads.length === 0 && (
            <div className="p-8 text-center">
              📭 No hi ha missatges
            </div>
          )}
        </div>
      </section>
    </AdminPage>
  );
}

