// app/admin/mensajes/page.tsx
import { log } from '@/lib/logger';
import { getLeadStatusDisplay, WHATSAPP_URL, formatDateSimple, getSourceDisplay } from '@/lib/constants';
// Pàgina de gestió de missatges i comunicacions
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { AdminPage } from '../components/AdminPage';
import { OwnerControlStrip } from '@/app/admin/components/OwnerControlStrip';
import { pluralize } from '@/lib/utils/pluralize';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Missatges | Òrbita Admin',
};

async function getMessagesData() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentLeads, pendingLeads, todayLeads, totalConverses, stalePendingLeads] = await Promise.all([
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
      // El total real de converses. La llista de sota va capada a 20, i sense
      // aquest recompte el taulell ensenyava el 20 com si fos el total.
      prisma.lead.count({
        where: { message: { not: null } },
      }),
      prisma.lead.count({
        where: {
          status: 'NEW',
          createdAt: { lt: twentyFourHoursAgo },
        },
      }),
    ]);

    return {
      recentLeads,
      pendingLeads,
      todayLeads,
      totalConverses,
      stalePendingLeads,
    };
  } catch (error) {
    log.error('Error obtenint missatges:', error);
    return {
      recentLeads: [],
      pendingLeads: 0,
      todayLeads: 0,
      totalConverses: 0,
      stalePendingLeads: 0,
    };
  }
}


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
  const withoutContact = data.recentLeads.filter((lead) => !lead.phone && !lead.email).length;
  const pendingNoNotesInSample = data.recentLeads.filter(
    (lead) => lead.status === 'NEW' && (lead.notes?.length ?? 0) === 0,
  ).length;
  const systemItems = [
    `Pendents (NEW): ${data.pendingLeads}`,
    `Rebudes avui: ${data.todayLeads}`,
    `Amb missatge: ${data.totalConverses} en total · ${data.recentLeads.length} a la llista`,
  ];
  const manualItems: string[] = [];
  if (data.stalePendingLeads > 0)
    manualItems.push(
      `${data.stalePendingLeads} ${pluralize(data.stalePendingLeads, 'entrada', 'entrades')} NEW de més de 24h sense gestió`,
    );
  if (pendingNoNotesInSample > 0)
    manualItems.push(`${pendingNoNotesInSample} pendents sense cap nota (mostra recent)`);
  if (withoutContact > 0)
    manualItems.push(`${withoutContact} entrades de la mostra sense telèfon ni email`);
  const nextStep =
    data.recentLeads.length === 0
      ? {
          title: 'Encara no hi ha missatges',
          detail:
            'Cap entrada amb missatge ha arribat. Comparteix el formulari de contacte o WhatsApp per obrir el primer canal.',
          href: '/admin/leads',
          ctaLabel: 'Obrir entrades',
        }
      : data.stalePendingLeads > 0
        ? {
            title: `Respon ${data.stalePendingLeads} ${pluralize(data.stalePendingLeads, 'entrada', 'entrades')} NEW de més de 24h`,
            detail:
              'Superar les 24h sense resposta trenca la promesa comercial. Obre les entrades noves filtrades i tanca aquest backlog.',
            href: '/admin/leads?status=NEW',
            ctaLabel: 'Obrir entrades NEW',
          }
        : data.pendingLeads > 0
          ? {
              title: `Respon ${data.pendingLeads} ${pluralize(data.pendingLeads, 'entrada nova', 'entrades noves')}`,
              detail:
                'Encara no porten 24h però estan en estat NEW sense contacte. Obre-les i mou-les a la següent etapa.',
              href: '/admin/leads?status=NEW',
              ctaLabel: 'Obrir entrades NEW',
            }
          : {
              title: 'Safata de missatges al dia',
              detail:
                'Sense pendents NEW. Aprofita per revisar la mostra recent i verifica que tot té nota de seguiment.',
              href: '/admin/leads',
              ctaLabel: 'Obrir entrades',
            };
  const manualTone: 'info' | 'warning' | 'success' =
    data.stalePendingLeads > 0 ? 'warning' : data.pendingLeads > 0 ? 'info' : 'success';

  return (
    <AdminPage title="Missatges" subtitle="Gestiona les comunicacions amb la clientela">
      <OwnerControlStrip
        system={{
          eyebrow: 'BBDD',
          title: 'Safata de comunicació',
          tone: data.pendingLeads === 0 ? 'success' : 'info',
          items: systemItems,
          emptyText: 'Sense moviment recent.',
        }}
        manual={{
          eyebrow: 'Pendents manuals',
          title: 'Què requereix la teva mà',
          tone: manualTone,
          items: manualItems,
          emptyText: 'Cap acció manual pendent.',
        }}
        nextStep={nextStep}
        className="mb-2"
      />
      <section className="ap-kpi-row sm:grid-cols-3">
        <div className="ap-kpi ap-kpi--warning">
          <p className="ap-kpi-label">Pendents de contactar</p>
          <p className="ap-kpi-value">{data.pendingLeads}</p>
          <p className="ap-kpi-meta">Entrades noves sense resposta</p>
        </div>
        <div className="ap-kpi ap-kpi--info">
          <p className="ap-kpi-label">Rebudes avui</p>
          <p className="ap-kpi-value">{data.todayLeads}</p>
        </div>
        <div className="ap-kpi">
          <p className="ap-kpi-label">Total converses</p>
          <p className="ap-kpi-value">{data.totalConverses}</p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/admin/leads?status=NEW"
          className="ap-btn ap-btn--primary w-full sm:w-auto"
        >
          🔵 Veure noves ({data.pendingLeads})
        </Link>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ap-btn ap-btn--secondary w-full sm:w-auto"
        >
          💬 Obrir WhatsApp Web
        </a>
        <Link
          href="/admin/leads"
          className="ap-btn ap-btn--secondary w-full sm:w-auto"
        >
          👥 Totes les entrades
        </Link>
      </section>

      <section className="ap-card overflow-hidden rounded-2xl p-0">
        <div className="border-b p-4 admin-tone-border-neutral">
          <h3 className="font-semibold">📋 Plantilles Ràpides</h3>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
          <button type="button" className="ap-card rounded-xl p-3 text-left transition-colors hover:admin-tone-bg-neutral">
            <p className="font-medium">Primer contacte</p>
            <p className="mt-1 text-xs admin-tone-text-neutral">Resposta inicial a una entrada nova</p>
          </button>
          <button type="button" className="ap-card rounded-xl p-3 text-left transition-colors hover:admin-tone-bg-neutral">
            <p className="font-medium">Envia pressupost</p>
            <p className="mt-1 text-xs admin-tone-text-neutral">Acompanyament de pressupost</p>
          </button>
          <button type="button" className="ap-card rounded-xl p-3 text-left transition-colors hover:admin-tone-bg-neutral">
            <p className="font-medium">Seguiment</p>
            <p className="mt-1 text-xs admin-tone-text-neutral">Recordatori després de dies</p>
          </button>
          <button type="button" className="ap-card rounded-xl p-3 text-left transition-colors hover:admin-tone-bg-neutral">
            <p className="font-medium">Confirmació</p>
            <p className="mt-1 text-xs admin-tone-text-neutral">Confirmar reserva</p>
          </button>
          <button type="button" className="ap-card rounded-xl p-3 text-left transition-colors hover:admin-tone-bg-neutral">
            <p className="font-medium">Preesdeveniment</p>
            <p className="mt-1 text-xs admin-tone-text-neutral">Detalls abans de l&apos;esdeveniment</p>
          </button>
          <button type="button" className="ap-card rounded-xl p-3 text-left transition-colors hover:admin-tone-bg-neutral">
            <p className="font-medium">Postesdeveniment</p>
            <p className="mt-1 text-xs admin-tone-text-neutral">Agraïment i enquesta</p>
          </button>
        </div>
      </section>

      <section className="ap-card overflow-hidden rounded-2xl p-0">
        <div className="border-b p-4">
          <h3 className="font-semibold">📬 Missatges recents</h3>
          {data.totalConverses > data.recentLeads.length && (
            <p className="mt-1 text-xs admin-tone-text-neutral">
              Els {data.recentLeads.length} més recents de {data.totalConverses}.{' '}
              <Link href="/admin/leads" className="hover:underline">Veure&apos;ls tots a Leads →</Link>
            </p>
          )}
        </div>
        <div className="divide-y admin-tone-border-subtle">
          {data.recentLeads.map((lead) => {
            const statusConfig = getLeadStatusDisplay(lead.status);
            const sourceIcon = getSourceDisplay(lead.source).icon;
            return (
              <div key={lead.id} className="p-4 transition-colors adm-row-hover">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold admin-tone-soft-info admin-tone-text-info">
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
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span>{timeAgo(lead.createdAt)}</span>
                      {lead.email && <span>{lead.email}</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ap-btn ap-btn--secondary h-8 w-8 p-0"
                        title="WhatsApp"
                      >
                        💬
                      </a>
                    )}
                    <Link
                      href={buildLeadWorkspaceHref(lead.id)}
                      className="ap-btn ap-btn--secondary h-8 w-8 p-0"
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
            <div className="p-8 text-center admin-tone-text-slate">
              📭 No hi ha missatges
            </div>
          )}
        </div>
      </section>
    </AdminPage>
  );
}

