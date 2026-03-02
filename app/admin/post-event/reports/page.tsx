import { prisma } from '@/lib/prisma';
import { formatDateSimple } from '@/lib/constants';
import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Informes Post-Event | Òrbita Admin',
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

async function getReports() {
  return prisma.postEventReport.findMany({
    orderBy: { createdAt: 'desc' },
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

async function getAvailableBookings() {
  return prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      postEventReport: null,
    },
    orderBy: { eventDate: 'desc' },
    take: 5,
    include: {
      pack: { include: { translations: true } },
      lead: { select: { preferredLocale: true } },
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
    <AdminPage
      title="Informes Post-Event"
      subtitle="Informes interns completats després dels esdeveniments"
      back={{ href: '/admin/post-event', label: 'Post-Event' }}
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium">Esborranys</div>
          <div className="text-3xl font-bold mt-1">{draftReports.length}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium">Completats</div>
          <div className="text-3xl font-bold mt-1">{completedReports.length}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium">Total</div>
          <div className="text-3xl font-bold mt-1">{reports.length}</div>
        </div>
      </div>

      {/* Available Bookings for New Report */}
      {availableBookings.length > 0 && (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="border-b p-4">
            <h3 className="font-semibold">📝 Events sense informe ({availableBookings.length})</h3>
          </div>
          <div className="divide-y divide-white/5/40">
            {availableBookings.map((booking) => {
              const packName = getPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale);
              return (
                <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-white/5">
                  <div>
                    <p className="font-medium">{booking.clientName}</p>
                    <p className="text-sm">
                      {formatDateSimple(booking.eventDate)} · {packName}
                    </p>
                  </div>
                  <Link
                    href={`/admin/post-event/reports/new?bookingId=${booking.id}`}
                    className="px-4 py-2 text-white rounded-xl text-sm font-medium"
                  >
                    Crear informe
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="mb-4">Encara no hi ha informes creats</p>
          {availableBookings.length === 0 ? (
            <p className="text-sm">No hi ha esdeveniments completats pendents d&apos;informe</p>
          ) : (
            <p className="text-sm">Selecciona un event de la llista superior per crear un informe</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const packName = getPackName(
              report.booking.pack.translations,
              report.booking.pack.slug,
              report.booking.lead?.preferredLocale
            );
            return (
              <div
                key={report.id}
                className="border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">
                        {report.booking.clientName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        report.status === 'DRAFT'
                          ? 'bg-orange-500/15 text-orange-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}>
                        {report.status === 'DRAFT' ? 'Esborrany' : 'Completat'}
                      </span>
                    </div>
                    <p className="text-sm">
                      {formatDateSimple(report.booking.eventDate)} · {packName} · {report.booking.eventLocation}
                    </p>
                    {report.lessonsLearned && (
                      <p className="text-sm mt-2 line-clamp-2">
                        {report.lessonsLearned}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/bookings/${report.bookingId}`}
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






