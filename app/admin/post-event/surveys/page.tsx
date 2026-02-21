import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-200">
            📊 Enquestes Post-Event
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Feedback i valoracions dels clients
          </p>
        </div>
        <Link
          href="/admin/post-event"
          className="rounded-lg border border-slate-700/60 bg-slate-800/70 px-4 py-2 font-medium text-slate-200 hover:bg-slate-700/70"
        >
          ← Tornar
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 p-4">
          <div className="text-sm text-cyan-300 font-medium">Total Enquestes</div>
          <div className="text-3xl font-bold text-cyan-300 mt-1">{surveys.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-4">
          <div className="text-sm text-emerald-300 font-medium">Valoracio mitjana</div>
          <div className="text-3xl font-bold text-emerald-300 mt-1">
            {surveys.length > 0
              ? (surveys.reduce((sum, s) => sum + (s.overallRating || 0), 0) / surveys.length).toFixed(1)
              : '—'
            }
          </div>
        </div>
        <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-violet-500/5 p-4">
          <div className="text-sm text-violet-300 font-medium">NPS Mitjà</div>
          <div className="text-3xl font-bold text-violet-300 mt-1">
            {surveys.length > 0
              ? (surveys.reduce((sum, s) => sum + (s.npsScore || 0), 0) / surveys.length).toFixed(0)
              : '—'
            }
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-4">
          <div className="text-sm text-orange-300 font-medium">Amb Testimoni</div>
          <div className="text-3xl font-bold text-orange-300 mt-1">
            {surveys.filter(s => s.testimonialPermission !== 'NO').length}
          </div>
        </div>
      </div>

      {/* Surveys List */}
      {surveys.length === 0 ? (
        <div className="bg-slate-950/60 border border-white/10 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-slate-400">Encara no hi ha enquestes rebudes</p>
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
                className="bg-slate-950/60 border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-200">
                        {survey.booking.clientName}
                      </h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < (survey.overallRating || 0) ? 'text-yellow-500' : 'text-slate-300'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 rounded text-xs font-medium">
                        NPS: {survey.npsScore}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      {new Date(survey.booking.eventDate).toLocaleDateString('ca-ES')} · {packName}
                    </p>
                    {survey.bestMoment && (
                      <p className="text-sm text-slate-300 mt-2 line-clamp-2 italic">
                        &quot;{survey.bestMoment}&quot;
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/bookings/${survey.bookingId}`}
                    className="px-4 py-2 bg-white/5 text-slate-200 rounded-lg text-sm font-medium hover:bg-white/10"
                  >
                    Veure detalls
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





