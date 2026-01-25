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

async function getAvailableBookings() {
  return prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      postEventReport: null,
    },
    orderBy: { eventDate: 'desc' },
    take: 5,
    include: {
      pack: { include: { translations: { where: { locale: 'es' } } } },
    },
  });
}

export default async function ReportsPage() {
  const [reports, availableBookings] = await Promise.all([
    getReports(),
    getAvailableBookings(),
  ]);

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

      {/* Available Bookings for New Report */}
      {availableBookings.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="bg-orange-50 border-b border-orange-100 p-4">
            <h3 className="font-semibold text-orange-700">📝 Events sense informe ({availableBookings.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {availableBookings.map((booking) => {
              const packName = booking.pack.translations[0]?.name || booking.pack.slug;
              return (
                <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-700">{booking.clientName}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(booking.eventDate).toLocaleDateString('ca-ES')} · {packName}
                    </p>
                  </div>
                  <Link
                    href={`/admin/post-event/reports/new?bookingId=${booking.id}`}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                  >
                    Crear Informe
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-slate-500 mb-4">No hi ha informes creats encara</p>
          {availableBookings.length === 0 ? (
            <p className="text-sm text-slate-400">No hi ha events completats pendents d&apos;informe</p>
          ) : (
            <p className="text-sm text-slate-400">Selecciona un event de la llista superior per crear un informe</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const packName = report.booking.pack.translations[0]?.name || report.booking.pack.slug;
            return (
              <div
                key={report.id}
                className="bg-white border border-stone-200 rounded-xl p-4 hover:bg-stone-100 transition-colors"
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
