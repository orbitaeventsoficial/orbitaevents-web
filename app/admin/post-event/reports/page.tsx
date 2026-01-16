import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Informes Post-Event | Òrbita Admin',
};

async function getReports() {
  return prisma.postEventReport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      booking: {
        include: {
          pack: { include: { translations: { where: { locale: 'es' } } } },
        },
      },
    },
  });
}

export default async function ReportsPage() {
  const reports = await getReports();

  const draftReports = reports.filter(r => r.status === 'DRAFT');
  const completedReports = reports.filter(r => r.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
            📋 Informes Post-Event
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Informes interns completats després dels events
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="text-sm text-orange-600 font-medium">Esborranys</div>
          <div className="text-3xl font-bold text-orange-700 mt-1">{draftReports.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="text-sm text-green-600 font-medium">Completats</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{completedReports.length}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="text-sm text-blue-600 font-medium">Total</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">{reports.length}</div>
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-slate-500 mb-4">No hi ha informes creats encara</p>
          <Link
            href="/admin/post-event"
            className="inline-flex px-6 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-rose-600"
          >
            Crear Primer Informe
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const packName = report.booking.pack.translations[0]?.name || report.booking.pack.slug;
            return (
              <div
                key={report.id}
                className="bg-stone-50 border border-stone-200 rounded-xl p-4 hover:bg-stone-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-700">
                        {report.booking.clientName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        report.status === 'DRAFT'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {report.status === 'DRAFT' ? 'Esborrany' : 'Completat'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(report.booking.eventDate).toLocaleDateString('ca-ES')} · {packName} · {report.booking.eventLocation}
                    </p>
                    {report.lessonsLearned && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {report.lessonsLearned}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/bookings/${report.bookingId}`}
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
