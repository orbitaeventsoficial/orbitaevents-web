// app/admin/post-event/page.tsx
import { log } from '@/lib/logger';
import { formatDateSimple } from '@/lib/constants';
import { getTranslatedPackName } from '@/lib/pack-name';
// Pàgina de gestió post-event
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Post-Event | Òrbita Admin',
};



async function getPostEventData() {
  try {
    const [
      recentBookings,
      pendingReports,
      pendingSurveys,
      completedReports,
      completedSurveys,
    ] = await Promise.all([
      // Reserves recents completades sense informe
      prisma.booking.findMany({
        where: {
          status: 'COMPLETED',
          postEventReport: null,
        },
        orderBy: { eventDate: 'desc' },
        take: 10,
        include: {
          pack: { include: { translations: true } },
          lead: { select: { preferredLocale: true } },
        },
      }),
      // Informes pendents (draft)
      prisma.postEventReport.count({
        where: { status: 'DRAFT' },
      }),
      // Enquestes pendents d'enviar
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          clientSurvey: null,
          eventDate: { lt: new Date() },
        },
      }),
      // Informes completats
      prisma.postEventReport.count({
        where: { status: 'COMPLETED' },
      }),
      // Enquestes rebudes
      prisma.clientSurvey.count(),
    ]);

    return {
      recentBookings,
      pendingReports,
      pendingSurveys,
      completedReports,
      completedSurveys,
    };
  } catch (error) {
    log.error('Error obtenint dades post-event:', error);
    return {
      recentBookings: [],
      pendingReports: 0,
      pendingSurveys: 0,
      completedReports: 0,
      completedSurveys: 0,
    };
  }
}

export default async function PostEventPage() {
  const data = await getPostEventData();
  const workflowSteps = [
    {
      number: 1,
      title: 'Informe Intern',
      subtitle: "Completa després de l'event",
      href: '/admin/post-event/reports',
      cta: 'Veure informes',
      numberTone: 'admin-tone-soft-warning admin-tone-border-warning admin-tone-text-warning',
      items: ['📋 Timing real de l\'event', '🔊 Qualitat del so i equip', '💃 Nivell de pista', '🎵 Estils musicals', '⚠️ Incidències'],
    },
    {
      number: 2,
      title: 'Enquesta Client',
      subtitle: "S'envia automàticament",
      href: '/admin/post-event/surveys',
      cta: 'Veure enquestes',
      numberTone: 'admin-tone-soft-info admin-tone-border-info admin-tone-text-info',
      items: ['⭐ Valoració general', '🎵 Selecció musical', '👤 Professionalitat', '📊 NPS Score', '💬 Testimoni públic'],
    },
    {
      number: 3,
      title: 'Feedback al Client',
      subtitle: 'Envia agraïment',
      href: '/admin/post-event/feedback',
      cta: 'Veure feedback',
      numberTone: 'admin-tone-soft-success admin-tone-border-success admin-tone-text-success',
      items: ['💌 Missatge personalitzat', '📸 Foto icònica', '🎁 Codi descompte 10%', '👥 Per referits'],
    },
  ] as const;

  return (
    <AdminPage title="Post-Event" subtitle="Gestiona informes, enquestes i feedback dels esdeveniments">
      <section className="ap-kpi-row lg:grid-cols-4">
        <div className="ap-kpi ap-kpi--warning">
          <p className="ap-kpi-label">Informes pendents</p>
          <p className="ap-kpi-value">{data.pendingReports}</p>
          <p className="ap-kpi-meta">Esborrany</p>
        </div>
        <div className="ap-kpi ap-kpi--info">
          <p className="ap-kpi-label">Enquestes per enviar</p>
          <p className="ap-kpi-value">{data.pendingSurveys}</p>
          <p className="ap-kpi-meta">Sense enquesta enviada</p>
        </div>
        <div className="ap-kpi ap-kpi--success">
          <p className="ap-kpi-label">Informes completats</p>
          <p className="ap-kpi-value">{data.completedReports}</p>
        </div>
        <div className="ap-kpi">
          <p className="ap-kpi-label">Enquestes rebudes</p>
          <p className="ap-kpi-value">{data.completedSurveys}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {workflowSteps.map((step) => (
          <article key={step.number} className="ap-card overflow-hidden rounded-2xl p-0">
            <div className="border-b p-4 admin-tone-border-neutral">
              <div className="flex items-center gap-3">
                <div className={['flex h-8 w-8 items-center justify-center rounded-full border font-bold', step.numberTone].join(' ')}>
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-xs admin-tone-text-neutral">{step.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <ul className="space-y-2 text-sm">
                {step.items.map((item) => {
                  const parts = item.split(' ');
                  const icon = parts.shift() || '';
                  return (
                    <li key={item} className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{parts.join(' ')}</span>
                    </li>
                  );
                })}
              </ul>
              <Link href={step.href} className="ap-btn ap-btn--secondary w-full justify-center text-sm">
                {step.cta}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="ap-card overflow-hidden rounded-2xl p-0">
        <div className="border-b p-4 admin-tone-border-neutral">
          <h2 className="flex items-center gap-2 font-semibold">
            📅 Events Completats Sense Informe
            <span className="text-sm font-normal">({data.recentBookings.length})</span>
          </h2>
        </div>
        <div className="divide-y admin-tone-border-subtle">
          {data.recentBookings.map((booking) => {
            const packName =
              getTranslatedPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale);
            return (
              <div key={booking.id} className="flex items-center justify-between p-4 transition-colors hover:bg-white/[0.03]">
                <div>
                  <p className="font-medium">{booking.clientName}</p>
                  <p className="text-sm admin-tone-text-neutral">
                    {formatDateSimple(booking.eventDate)} · {packName} · {booking.eventLocation}
                  </p>
                </div>
                <Link href={`/admin/post-event/reports/new?bookingId=${booking.id}`} className="ap-btn ap-btn--secondary text-xs">
                  📝 Crear informe
                </Link>
              </div>
            );
          })}
          {data.recentBookings.length === 0 && (
            <div className="p-8 text-center admin-tone-text-success">
              ✅ Tots els esdeveniments completats tenen informe
            </div>
          )}
        </div>
      </section>
    </AdminPage>
  );
}
