import { prisma } from '@/lib/prisma';
import { formatDateSimple } from '@/lib/constants';
import { getTranslatedPackName } from '@/lib/pack-name';
import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import PostEventEmailButton from '../../components/PostEventEmailButton';
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
import { buildPendingPostEventFollowUpBookingWhere } from '@/lib/services/postEventPendingService';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Seguiment post-esdeveniment | Òrbita Admin',
};



async function getCompletedBookings() {
  return prisma.booking.findMany({
    where: buildPendingPostEventFollowUpBookingWhere(),
    orderBy: { eventDate: 'desc' },
    take: POST_EVENT_WORKFLOW.pendingTake,
    include: {
      pack: { include: { translations: true } },
      lead: { select: { preferredLocale: true } },
      clientSurvey: true,
    },
  });
}

export default async function PostEventFollowUpPage() {
  const bookings = await getCompletedBookings();

  return (
    <AdminPage
      title="Agraïment al Client"
      subtitle="Envia agraïments, reviews i incentius als clients després de l'event"
      back={{ href: '/admin/post-event', label: 'Post-Event' }}
    >

      {/* Info Card */}
      <div className="border rounded-xl p-6">
        <h3 className="font-semibold mb-2">💡 Què incloure al seguiment?</h3>
        <ul className="text-sm space-y-1">
          <li>• 💌 Missatge personalitzat d&apos;agraïment</li>
          <li>• 📸 Foto icònica de l&apos;event (si disponible)</li>
          <li>• 🎁 Codi descompte 10% per proper event</li>
          <li>• 👥 Incentiu per referir amics/família</li>
          <li>• ⭐ Sol·licitud de review a Google</li>
        </ul>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="ap-card p-12 text-center">
          <div className="text-4xl mb-4">💌</div>
          <p className="">No hi ha esdeveniments completats recentment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const packName = getTranslatedPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale);
            const hasSurvey = !!booking.clientSurvey;

            return (
              <div
                key={booking.id}
                className="ap-card p-4 hover:brightness-105 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">
                        {booking.clientName}
                      </h3>
                      {hasSurvey && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium">
                          ✓ Enquesta rebuda
                        </span>
                      )}
                    </div>
                    <p className="text-sm">
                      {formatDateSimple(booking.eventDate)} · {packName} · {booking.eventLocation}
                    </p>
                    <p className="text-sm mt-1">
                      📧 {booking.clientEmail} · 📞 {booking.clientPhone || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <PostEventEmailButton bookingId={booking.id} initiallySent={booking.postEventEmailSent} />
                    <Link
                      href={buildBookingHref(booking.id, 'sec-post-event')}
                      className="ap-btn ap-btn--secondary px-4 py-2 text-sm"
                    >
                      Veure
                    </Link>
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

