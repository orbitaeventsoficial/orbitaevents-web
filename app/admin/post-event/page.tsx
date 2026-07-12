// app/admin/post-event/page.tsx
import { log } from '@/lib/logger';
import { formatDateSimple } from '@/lib/constants';
import { getTranslatedPackName } from '@/lib/pack-name';
// Pàgina de gestió post-event
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import InfoTooltip from '../components/InfoTooltip';
import {
  isAdminTestArtifactFromParts,
  isAdminTestBookingArtifact,
  type AdminTestBookingArtifactInput,
} from '@/lib/admin/testArtifacts';
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
import {
  buildPendingPostEventEmailBookingWhere,
  buildPendingPostEventReportBookingWhere,
  buildPendingPostEventSurveyBookingWhere,
} from '@/lib/services/postEventPendingService';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Post-Event | Òrbita Admin',
};

type PostEventPageProps = {
  searchParams?: {
    showTestPostEvent?: string;
  };
};

type PostEventReportTestInput = {
  booking: AdminTestBookingArtifactInput;
  hitSongs?: string | null;
  memorableMoment?: string | null;
  clientComments?: string | null;
  incidentDescription?: string | null;
  whatWorkedBest?: string | null;
  whatToImprove?: string | null;
  lessonsLearned?: string | null;
};

type ClientSurveyTestInput = {
  booking: AdminTestBookingArtifactInput;
  bestMoment?: string | null;
  additionalComments?: string | null;
};

function isTestPostEventReportArtifact(report: PostEventReportTestInput): boolean {
  return (
    isAdminTestBookingArtifact(report.booking) ||
    isAdminTestArtifactFromParts([
      report.hitSongs,
      report.memorableMoment,
      report.clientComments,
      report.incidentDescription,
      report.whatWorkedBest,
      report.whatToImprove,
      report.lessonsLearned,
    ])
  );
}

function isTestClientSurveyArtifact(survey: ClientSurveyTestInput): boolean {
  return (
    isAdminTestBookingArtifact(survey.booking) ||
    isAdminTestArtifactFromParts([
      survey.bestMoment,
      survey.additionalComments,
    ])
  );
}

function buildPostEventVisibilityHref(showTestPostEvent: boolean): string {
  return showTestPostEvent ? '/admin/post-event?showTestPostEvent=1' : '/admin/post-event';
}

async function getPostEventData(showTestPostEvent: boolean) {
  try {
    const now = new Date();
    const [
      pendingEmailBookingsRaw,
      recentBookingsRaw,
      pendingReportsRaw,
      pendingSurveyBookingsRaw,
      completedReportsRaw,
      completedSurveysRaw,
    ] = await Promise.all([
      // Emails post-event pendents
      prisma.booking.findMany({
        where: buildPendingPostEventEmailBookingWhere(now),
        take: POST_EVENT_WORKFLOW.pendingTake,
        select: {
          reference: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          eventLocation: true,
          eventVenue: true,
          notes: true,
          lead: { select: { name: true, email: true, phone: true, notes: true } },
        },
      }),
      // Reserves recents completades sense informe
      prisma.booking.findMany({
        where: buildPendingPostEventReportBookingWhere(now),
        orderBy: { eventDate: 'desc' },
        take: POST_EVENT_WORKFLOW.pendingTake,
        include: {
          pack: { include: { translations: true } },
          lead: { select: { preferredLocale: true, name: true, email: true, phone: true, notes: true } },
        },
      }),
      // Informes pendents (draft)
      prisma.postEventReport.findMany({
        where: { status: 'DRAFT' },
        include: {
          booking: {
            select: {
              reference: true,
              clientName: true,
              clientEmail: true,
              clientPhone: true,
              eventLocation: true,
              eventVenue: true,
              notes: true,
              lead: { select: { name: true, email: true, phone: true, notes: true } },
            },
          },
        },
      }),
      // Enquestes sense resposta
      prisma.booking.findMany({
        where: buildPendingPostEventSurveyBookingWhere(now),
        take: POST_EVENT_WORKFLOW.pendingTake,
        select: {
          reference: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          eventLocation: true,
          eventVenue: true,
          notes: true,
          lead: { select: { name: true, email: true, phone: true, notes: true } },
        },
      }),
      // Informes completats
      prisma.postEventReport.findMany({
        where: { status: 'COMPLETED' },
        include: {
          booking: {
            select: {
              reference: true,
              clientName: true,
              clientEmail: true,
              clientPhone: true,
              eventLocation: true,
              eventVenue: true,
              notes: true,
              lead: { select: { name: true, email: true, phone: true, notes: true } },
            },
          },
        },
      }),
      // Enquestes rebudes
      prisma.clientSurvey.findMany({
        include: {
          booking: {
            select: {
              reference: true,
              clientName: true,
              clientEmail: true,
              clientPhone: true,
              eventLocation: true,
              eventVenue: true,
              notes: true,
              lead: { select: { name: true, email: true, phone: true, notes: true } },
            },
          },
        },
      }),
    ]);

    const recentBookings = (showTestPostEvent
      ? recentBookingsRaw
      : recentBookingsRaw.filter((booking) => !isAdminTestBookingArtifact(booking)))
      .slice(0, 10);
    const pendingEmailBookings = showTestPostEvent
      ? pendingEmailBookingsRaw
      : pendingEmailBookingsRaw.filter((booking) => !isAdminTestBookingArtifact(booking));
    const pendingReports = showTestPostEvent
      ? pendingReportsRaw
      : pendingReportsRaw.filter((report) => !isTestPostEventReportArtifact(report));
    const pendingSurveyBookings = showTestPostEvent
      ? pendingSurveyBookingsRaw
      : pendingSurveyBookingsRaw.filter((booking) => !isAdminTestBookingArtifact(booking));
    const completedReports = showTestPostEvent
      ? completedReportsRaw
      : completedReportsRaw.filter((report) => !isTestPostEventReportArtifact(report));
    const completedSurveys = showTestPostEvent
      ? completedSurveysRaw
      : completedSurveysRaw.filter((survey) => !isTestClientSurveyArtifact(survey));
    const testArtifactCount =
      pendingEmailBookingsRaw.filter((booking) => isAdminTestBookingArtifact(booking)).length +
      recentBookingsRaw.filter((booking) => isAdminTestBookingArtifact(booking)).length +
      pendingReportsRaw.filter((report) => isTestPostEventReportArtifact(report)).length +
      pendingSurveyBookingsRaw.filter((booking) => isAdminTestBookingArtifact(booking)).length +
      completedReportsRaw.filter((report) => isTestPostEventReportArtifact(report)).length +
      completedSurveysRaw.filter((survey) => isTestClientSurveyArtifact(survey)).length;

    return {
      recentBookings,
      pendingEmails: pendingEmailBookings.length,
      pendingReports: pendingReports.length,
      pendingSurveys: pendingSurveyBookings.length,
      completedReports: completedReports.length,
      completedSurveys: completedSurveys.length,
      testArtifactCount,
    };
  } catch (error) {
    log.error('Error obtenint dades post-event:', error);
    return {
      recentBookings: [],
      pendingEmails: 0,
      pendingReports: 0,
      pendingSurveys: 0,
      completedReports: 0,
      completedSurveys: 0,
      testArtifactCount: 0,
    };
  }
}

export default async function PostEventPage({ searchParams }: PostEventPageProps) {
  const showTestPostEvent = searchParams?.showTestPostEvent === '1';
  const data = await getPostEventData(showTestPostEvent);
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
      title: 'Agraïment al Client',
      subtitle: 'Seguiment post-event',
      href: '/admin/post-event/feedback',
      cta: 'Veure seguiment',
      numberTone: 'admin-tone-soft-success admin-tone-border-success admin-tone-text-success',
      items: ['💌 Missatge personalitzat', '📸 Foto icònica', '🎁 Codi descompte 10%', '👥 Per referits'],
    },
    {
      number: 4,
      title: 'Playbook',
      subtitle: 'Checklist de tancament',
      href: '/admin/post-event/playbook',
      cta: 'Obrir playbook',
      numberTone: 'admin-tone-soft-cyan admin-tone-border-cyan admin-tone-text-cyan',
      items: ['✅ Agraïment', '⭐ Testimoni aprovat', '📣 Publicació social', '👥 Referral'],
    },
  ] as const;

  const bookingsWithoutReport = data.recentBookings.length;
  const totalSurveyFlow = data.pendingSurveys + data.completedSurveys;
  const surveyResponseRate = totalSurveyFlow > 0
    ? Math.round((data.completedSurveys / totalSurveyFlow) * 100)
    : null;

  const systemItems: string[] = [];
  if (data.completedReports > 0) {
    systemItems.push(`${data.completedReports} informes interns tancats`);
  }
  if (data.completedSurveys > 0) {
    systemItems.push(
      `${data.completedSurveys} enquestes rebudes${surveyResponseRate !== null ? ` · ${surveyResponseRate}% resposta` : ''}`
    );
  }
  if (data.completedReports === 0 && data.completedSurveys === 0) {
    systemItems.push('Encara no hi ha cicle post-event tancat amb informe ni enquesta rebuda');
  }

  const manualItems: string[] = [];
  if (data.pendingEmails > 0) {
    manualItems.push(`${data.pendingEmails} emails post-event pendents d'enviar`);
  }
  if (bookingsWithoutReport > 0) {
    manualItems.push(`${bookingsWithoutReport} events completats sense informe intern`);
  }
  if (data.pendingReports > 0) {
    manualItems.push(`${data.pendingReports} informes en esborrany per completar`);
  }
  if (data.pendingSurveys > 0) {
    manualItems.push(`${data.pendingSurveys} enquestes encara sense resposta del client`);
  }


  return (
    <AdminPage
      title="Post-Event"
      subtitle="Gestiona informes, enquestes i seguiment dels esdeveniments"
      actions={data.testArtifactCount > 0 ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="ap-badge">
            {data.testArtifactCount} elements de prova post-event {showTestPostEvent ? 'visibles' : 'ocults'}
          </span>
          <Link
            href={buildPostEventVisibilityHref(!showTestPostEvent)}
            className="ap-btn ap-btn--secondary ap-btn--xs"
          >
            {showTestPostEvent ? 'Ocultar proves' : 'Mostrar proves'}
          </Link>
        </div>
      ) : undefined}
    >
      <section className="ap-kpi-row lg:grid-cols-5">
        <div className="ap-kpi ap-kpi--warning">
          <p className="ap-kpi-label">Emails pendents <InfoTooltip text="Reserves completades que encara no tenen email post-event enviat. L'enviament real es fa des d'Emails amb confirmació." /></p>
          <p className="ap-kpi-value">{data.pendingEmails}</p>
          <p className="ap-kpi-meta">Agraïment</p>
          {data.pendingEmails > 0 && (
            <Link href="/admin/emails" className="ap-btn ap-btn--secondary ap-btn--xs mt-3">
              Gestionar emails
            </Link>
          )}
        </div>
        <div className="ap-kpi ap-kpi--warning">
          <p className="ap-kpi-label">Informes pendents <InfoTooltip text="Esdeveniments completats que encara no tenen informe intern. Fes-lo per tancar el cicle operatiu." /></p>
          <p className="ap-kpi-value">{data.pendingReports}</p>
          <p className="ap-kpi-meta">Esborrany</p>
        </div>
        <div className="ap-kpi ap-kpi--info">
          <p className="ap-kpi-label">Enquestes sense resposta <InfoTooltip text="Esdeveniments completats on encara no consta cap resposta d'enquesta del client." /></p>
          <p className="ap-kpi-value">{data.pendingSurveys}</p>
          <p className="ap-kpi-meta">Sense resposta rebuda</p>
        </div>
        <div className="ap-kpi ap-kpi--success">
          <p className="ap-kpi-label">Informes completats <InfoTooltip text="Informes interns ja tancats. Serveixen per avaluar com va anar l'event i millorar." /></p>
          <p className="ap-kpi-value">{data.completedReports}</p>
        </div>
        <div className="ap-kpi">
          <p className="ap-kpi-label">Enquestes rebudes <InfoTooltip text="Respostes de clients que han completat l'enquesta post-event. D'aquí surten valoracions i testimonis." /></p>
          <p className="ap-kpi-value">{data.completedSurveys}</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
              <div key={booking.id} className="flex items-center justify-between p-4 transition-colors adm-row-hover">
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
