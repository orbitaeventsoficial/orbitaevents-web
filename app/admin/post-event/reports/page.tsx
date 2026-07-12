import { prisma } from '@/lib/prisma';
import { formatDateSimple } from '@/lib/constants';
import { getTranslatedPackName } from '@/lib/pack-name';
import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { PORTFOLIO_EVENT_ORIGIN_TYPES } from '@/lib/constants/portfolio-media';
import { EnsurePortfolioEventButton } from './EnsurePortfolioEventButton';
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
import { buildPendingPostEventReportBookingWhere } from '@/lib/services/postEventPendingService';

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
          pack: { include: { translations: true } },
          lead: { select: { preferredLocale: true } },
        },
      },
    },
  });
}

async function getAvailableBookings() {
  return prisma.booking.findMany({
    where: buildPendingPostEventReportBookingWhere(),
    orderBy: { eventDate: 'desc' },
    take: POST_EVENT_WORKFLOW.pendingTake,
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
  const reportBookingIds = reports.map((report) => report.bookingId);
  const portfolioEvents = reportBookingIds.length > 0
    ? await prisma.portfolioEvent.findMany({
        where: {
          sourceBookingId: { in: reportBookingIds },
          originType: {
            in: [
              PORTFOLIO_EVENT_ORIGIN_TYPES.POST_EVENT_REPORT,
              PORTFOLIO_EVENT_ORIGIN_TYPES.BOOKING_GALLERY,
            ],
          },
        },
        select: {
          id: true,
          title: true,
          sourceBookingId: true,
        },
      })
    : [];
  const portfolioEventByBooking = new Map(
    portfolioEvents
      .filter((event) => event.sourceBookingId)
      .map((event) => [event.sourceBookingId!, event])
  );

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
        <div className="ap-card p-4">
          <div className="text-sm font-medium">Esborranys</div>
          <div className="text-3xl font-bold mt-1">{draftReports.length}</div>
        </div>
        <div className="ap-card p-4">
          <div className="text-sm font-medium">Completats</div>
          <div className="text-3xl font-bold mt-1">{completedReports.length}</div>
        </div>
        <div className="ap-card p-4">
          <div className="text-sm font-medium">Total</div>
          <div className="text-3xl font-bold mt-1">{reports.length}</div>
        </div>
      </div>

      {/* Available Bookings for New Report */}
      {availableBookings.length > 0 && (
        <div className="ap-card overflow-hidden">
          <div className="border-b p-4">
            <h3 className="font-semibold">📝 Events sense informe ({availableBookings.length})</h3>
          </div>
          <div className="divide-y divide-white/5/40">
            {availableBookings.map((booking) => {
              const packName = getTranslatedPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale);
              return (
                <div key={booking.id} className="flex items-center justify-between p-4 hover:brightness-105">
                  <div>
                    <p className="font-medium">{booking.clientName}</p>
                    <p className="text-sm">
                      {formatDateSimple(booking.eventDate)} · {packName}
                    </p>
                  </div>
                  <Link
                    href={`/admin/post-event/reports/new?bookingId=${booking.id}`}
                    className="ap-btn ap-btn--primary px-4 py-2 text-sm"
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
        <div className="ap-card p-12 text-center">
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
            const packName = getTranslatedPackName(
              report.booking.pack.translations,
              report.booking.pack.slug,
              report.booking.lead?.preferredLocale
            );
            const portfolioEvent = portfolioEventByBooking.get(report.bookingId);
            return (
              <div
                key={report.id}
                className="ap-card p-4 hover:brightness-105 transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">
                        {report.booking.clientName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        report.status === 'DRAFT'
                          ? 'admin-tone-bg-warning admin-tone-text-warning'
                          : 'admin-tone-bg-success admin-tone-text-success'
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
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Link
                      href={buildBookingHref(report.bookingId, 'sec-post-event')}
                      className="ap-btn ap-btn--secondary px-4 py-2 text-sm"
                    >
                      Veure detalls
                    </Link>
                    {report.status === 'COMPLETED' && (
                      <EnsurePortfolioEventButton
                        bookingId={report.bookingId}
                        existingEvent={portfolioEvent ? {
                          id: portfolioEvent.id,
                          title: portfolioEvent.title,
                          adminHref: '/admin/portfolio#events',
                        } : null}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}



