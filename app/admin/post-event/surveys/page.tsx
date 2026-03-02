import { prisma } from '@/lib/prisma';
import { formatDateSimple } from '@/lib/constants';
import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Enquestes Post-Event | Òrbita Admin',
};

function getPackName(
  translations: Array<{ locale: string; name: string }>,
  fallback: string,
  locale?: string | null
) {
  const preferred = String(locale || 'ca').toLowerCase();
  return (
    translations.find((t) => t.locale === preferred)?.name ||
    translations.find((t) => t.locale === 'ca')?.name ||
    translations[0]?.name ||
    fallback
  );
}

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

export default async function SurveysPage() {
  const surveys = await getSurveys();

  return (
    <AdminPage
      title="Enquestes Post-Event"
      subtitle="Feedback i valoracions dels clients"
      back={{ href: '/admin/post-event', label: 'Post-Event' }}
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium">Total Enquestes</div>
          <div className="text-3xl font-bold mt-1">{surveys.length}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium">Valoracio mitjana</div>
          <div className="text-3xl font-bold mt-1">
            {surveys.length > 0
              ? (surveys.reduce((sum, s) => sum + (s.overallRating || 0), 0) / surveys.length).toFixed(1)
              : '—'
            }
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium">NPS Mitjà</div>
          <div className="text-3xl font-bold mt-1">
            {surveys.length > 0
              ? (surveys.reduce((sum, s) => sum + (s.npsScore || 0), 0) / surveys.length).toFixed(0)
              : '—'
            }
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium">Amb Testimoni</div>
          <div className="text-3xl font-bold mt-1">
            {surveys.filter(s => s.testimonialPermission !== 'NO').length}
          </div>
        </div>
      </div>

      {/* Surveys List */}
      {surveys.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="">Encara no hi ha enquestes rebudes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((survey) => {
            const packName = getPackName(
              survey.booking.pack.translations,
              survey.booking.pack.slug,
              survey.booking.lead?.preferredLocale
            );
            return (
              <div
                key={survey.id}
                className="border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {survey.booking.clientName}
                      </h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < (survey.overallRating || 0) ? 'text-yellow-500' : 'text-white/70'}>
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
                    href={`/admin/bookings/${survey.bookingId}`}
                    className="px-4 py-2 bg-white/5 rounded-xl text-sm font-medium hover:bg-white/10"
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





