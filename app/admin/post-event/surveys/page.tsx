import { prisma } from '@/lib/prisma';
import { formatDateSimple } from '@/lib/constants';
import { getTranslatedPackName } from '@/lib/pack-name';
import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { isAdminTestArtifactFromParts, isAdminTestBookingArtifact } from '@/lib/admin/testArtifacts';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Enquestes Post-Event | Òrbita Admin',
};

type SurveysPageProps = {
  searchParams?: {
    showTestSurveys?: string;
  };
};

async function getSurveys() {
  return prisma.clientSurvey.findMany({
    orderBy: { submittedAt: 'desc' },
    include: {
      booking: {
        include: {
          pack: { include: { translations: true } },
          lead: { select: { preferredLocale: true } },
        },
      },
    },
  });
}

type SurveyRow = Awaited<ReturnType<typeof getSurveys>>[number];

function isTestSurveyArtifact(survey: SurveyRow): boolean {
  return (
    isAdminTestBookingArtifact(survey.booking) ||
    isAdminTestArtifactFromParts([
      survey.bestMoment,
      survey.additionalComments,
    ])
  );
}

function buildSurveyVisibilityHref(showTestSurveys: boolean): string {
  return showTestSurveys
    ? '/admin/post-event/surveys?showTestSurveys=1'
    : '/admin/post-event/surveys';
}

export default async function SurveysPage({ searchParams }: SurveysPageProps) {
  const surveys = await getSurveys();
  const testSurveys = surveys.filter(isTestSurveyArtifact);
  const showTestSurveys = searchParams?.showTestSurveys === '1';
  const visibleSurveys = showTestSurveys
    ? surveys
    : surveys.filter((survey) => !isTestSurveyArtifact(survey));
  const hiddenTestSurveys = testSurveys.length;
  const totalVisible = visibleSurveys.length;
  const averageRating = totalVisible > 0
    ? (visibleSurveys.reduce((sum, s) => sum + (s.overallRating || 0), 0) / totalVisible).toFixed(1)
    : '—';
  const averageNps = totalVisible > 0
    ? (visibleSurveys.reduce((sum, s) => sum + (s.npsScore || 0), 0) / totalVisible).toFixed(0)
    : '—';
  const surveysWithTestimonial = visibleSurveys.filter(s => s.testimonialPermission !== 'NO').length;

  return (
    <AdminPage
      title="Enquestes Post-Event"
      subtitle="Feedback i valoracions dels clients"
      back={{ href: '/admin/post-event', label: 'Post-Event' }}
      actions={hiddenTestSurveys > 0 ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="ap-badge">
            {hiddenTestSurveys} enquestes de prova {showTestSurveys ? 'visibles' : 'ocultes'}
          </span>
          <Link
            href={buildSurveyVisibilityHref(!showTestSurveys)}
            className="ap-btn ap-btn--secondary ap-btn--xs"
          >
            {showTestSurveys ? 'Ocultar proves' : 'Mostrar proves'}
          </Link>
        </div>
      ) : undefined}
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="ap-card p-4">
          <div className="text-sm font-medium">Total Enquestes</div>
          <div className="text-3xl font-bold mt-1">{totalVisible}</div>
        </div>
        <div className="ap-card p-4">
          <div className="text-sm font-medium">Valoracio mitjana</div>
          <div className="text-3xl font-bold mt-1">{averageRating}</div>
        </div>
        <div className="ap-card p-4">
          <div className="text-sm font-medium">NPS Mitjà</div>
          <div className="text-3xl font-bold mt-1">{averageNps}</div>
        </div>
        <div className="ap-card p-4">
          <div className="text-sm font-medium">Amb Testimoni</div>
          <div className="text-3xl font-bold mt-1">{surveysWithTestimonial}</div>
        </div>
      </div>

      {/* Surveys List */}
      {visibleSurveys.length === 0 ? (
        <div className="ap-card p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p>{hiddenTestSurveys > 0 ? 'Només hi ha enquestes de prova ocultes' : 'Encara no hi ha enquestes rebudes'}</p>
          <p className="text-sm mt-2 admin-tone-text-slate">
            {hiddenTestSurveys > 0
              ? 'Activa Mostrar proves només quan vulguis revisar o netejar el rastre E2E.'
              : 'Les enquestes es generen quan un client respon el formulari post-esdeveniment enviat des de la fitxa del booking.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleSurveys.map((survey) => {
            const packName = getTranslatedPackName(
              survey.booking.pack.translations,
              survey.booking.pack.slug,
              survey.booking.lead?.preferredLocale
            );
            return (
              <div
                key={survey.id}
                className="ap-card p-4 hover:brightness-105 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {survey.booking.clientName}
                      </h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < (survey.overallRating || 0) ? 'admin-tone-text-warning' : 'admin-tone-text-neutral'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-medium">
                        NPS: {survey.npsScore}
                      </span>
                    </div>
                    <p className="text-sm mb-2">
                      {formatDateSimple(survey.booking.eventDate)} · {packName}
                    </p>
                    {survey.bestMoment && (
                      <p className="text-sm mt-2 line-clamp-2 italic">
                        &quot;{survey.bestMoment}&quot;
                      </p>
                    )}
                  </div>
                  <Link
                    href={buildBookingHref(survey.bookingId, 'sec-post-event')}
                    className="ap-btn ap-btn--secondary px-4 py-2 text-sm"
                  >
                    Veure detalls
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}




