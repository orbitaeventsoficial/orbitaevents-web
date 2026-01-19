import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Enquestes Post-Event | Òrbita Admin',
};

async function getSurveys() {
  return prisma.clientSurvey.findMany({
    orderBy: { submittedAt: 'desc' },
    include: {
      booking: {
        include: {
          pack: { include: { translations: { where: { locale: 'es' } } } },
        },
      },
    },
  });
}

export default async function SurveysPage() {
  const surveys = await getSurveys();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
            📊 Enquestes Post-Event
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Feedback i valoracions dels clients
          </p>
        </div>
        <Link
          href="/admin/post-event"
          className="px-4 py-2 bg-stone-100 text-slate-700 rounded-lg font-medium hover:bg-stone-200"
        >
          ← Tornar
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="text-sm text-blue-600 font-medium">Total Enquestes</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">{surveys.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="text-sm text-green-600 font-medium">Rating Mitjà</div>
          <div className="text-3xl font-bold text-green-700 mt-1">
            {surveys.length > 0
              ? (surveys.reduce((sum, s) => sum + (s.overallRating || 0), 0) / surveys.length).toFixed(1)
              : '—'
            }
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="text-sm text-purple-600 font-medium">NPS Mitjà</div>
          <div className="text-3xl font-bold text-purple-700 mt-1">
            {surveys.length > 0
              ? (surveys.reduce((sum, s) => sum + (s.npsScore || 0), 0) / surveys.length).toFixed(0)
              : '—'
            }
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="text-sm text-orange-600 font-medium">Amb Testimoni</div>
          <div className="text-3xl font-bold text-orange-700 mt-1">
            {surveys.filter(s => s.testimonialPermission !== 'NO').length}
          </div>
        </div>
      </div>

      {/* Surveys List */}
      {surveys.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-slate-500">No hi ha enquestes rebudes encara</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((survey) => {
            const packName = survey.booking.pack.translations[0]?.name || survey.booking.pack.slug;
            return (
              <div
                key={survey.id}
                className="bg-white border border-stone-200 rounded-xl p-4 hover:bg-stone-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-700">
                        {survey.booking.clientName}
                      </h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < (survey.overallRating || 0) ? 'text-yellow-500' : 'text-slate-300'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        NPS: {survey.npsScore}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">
                      {new Date(survey.booking.eventDate).toLocaleDateString('ca-ES')} · {packName}
                    </p>
                    {survey.bestMoment && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2 italic">
                        &quot;{survey.bestMoment}&quot;
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/bookings/${survey.bookingId}`}
                    className="px-4 py-2 bg-stone-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-stone-200"
                  >
                    Veure Detalls
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
