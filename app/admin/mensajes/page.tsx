// app/admin/mensajes/page.tsx
import { log } from '@/lib/logger';
import { LEAD_STATUS_CONFIG, WHATSAPP_URL, formatDateSimple } from '@/lib/constants';
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
    const [recentLeads, pendingLeads, todayLeads] = await Promise.all([
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
      prisma.lead.count({
        where: { status: 'NEW' },
      }),
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

const DEFAULT_LEAD_STATUS_STYLE = {
  label: 'Nova entrada',
  bg: 'admin-tone-bg-info',
  text: 'admin-tone-text-info',
  border: 'admin-tone-border-info',
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
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-medium uppercase">Pendents de contactar</p>
          <p className="mt-2 text-3xl font-bold">{data.pendingLeads}</p>
          <p className="mt-1 text-xs">Entrades noves sense resposta</p>
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

      <section className="flex flex-wrap gap-3">
        <Link
          href="/admin/leads?status=NEW"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
        >
          🔵 Veure noves ({data.pendingLeads})
        </Link>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
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

      <section className="overflow-hidden rounded-xl border shadow-sm">
        <div className="border-b p-4">
          <h3 className="font-semibold">📋 Plantilles Ràpides</h3>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
          <button type="button" className="rounded-xl border p-3 text-left transition-colors">
            <p className="font-medium">Primer contacte</p>
            <p className="mt-1 text-xs">Resposta inicial a una entrada nova</p>
          </button>
          <button type="button" className="rounded-xl border p-3 text-left transition-colors">
            <p className="font-medium">Envia pressupost</p>
            <p className="mt-1 text-xs">Acompanyament de pressupost</p>
          </button>
          <button type="button" className="rounded-xl border p-3 text-left transition-colors">
            <p className="font-medium">Seguiment</p>
            <p className="mt-1 text-xs">Recordatori després de dies</p>
          </button>
          <button type="button" className="rounded-xl border p-3 text-left transition-colors">
            <p className="font-medium">Confirmació</p>
            <p className="mt-1 text-xs">Confirmar reserva</p>
          </button>
          <button type="button" className="rounded-xl border p-3 text-left transition-colors">
            <p className="font-medium">Preesdeveniment</p>
            <p className="mt-1 text-xs">Detalls abans de l&apos;esdeveniment</p>
          </button>
          <button type="button" className="rounded-xl border p-3 text-left transition-colors">
            <p className="font-medium">Postesdeveniment</p>
            <p className="mt-1 text-xs">Agraïment i enquesta</p>
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border shadow-sm">
        <div className="border-b p-4">
          <h3 className="font-semibold">📬 Missatges recents</h3>
        </div>
        <div className="divide-y divide-white/5">
          {data.recentLeads.map((lead) => {
            const statusConfig = LEAD_STATUS_CONFIG[lead.status] || DEFAULT_LEAD_STATUS_STYLE;
            const sourceIcon = SOURCE_ICONS[lead.source] || '📩';
            return (
              <div key={lead.id} className="p-4 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white">
                    {lead.name.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{lead.name}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-xs">{sourceIcon}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm">
                      {lead.message || 'Sense missatge'}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span>{timeAgo(lead.createdAt)}</span>
                      {lead.email && <span>{lead.email}</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
                        title="WhatsApp"
                      >
                        💬
                      </a>
                    )}
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
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

