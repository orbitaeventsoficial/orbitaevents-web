import { prisma } from '@/lib/prisma';
import { formatDateSimple } from '@/lib/constants';
import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Feedback post-esdeveniment | Òrbita Admin',
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

async function getCompletedBookings() {
  return prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      eventDate: { lt: new Date() },
    },
    orderBy: { eventDate: 'desc' },
    take: 50,
    include: {
      pack: { include: { translations: true } },
      lead: { select: { preferredLocale: true } },
      clientSurvey: true,
    },
  });
}

export default async function FeedbackPage() {
  const bookings = await getCompletedBookings();

  return (
    <AdminPage
      title="Feedback al Client"
      subtitle="Envia agraïments i incentius als clients després de l'event"
      back={{ href: '/admin/post-event', label: 'Post-Event' }}
    >

      {/* Info Card */}
      <div className="border rounded-xl p-6">
        <h3 className="font-semibold mb-2">💡 Què incloure al feedback?</h3>
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
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">💌</div>
          <p className="">No hi ha esdeveniments completats recentment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const packName = getPackName(booking.pack.translations, booking.pack.slug, booking.lead?.preferredLocale);
            const hasSurvey = !!booking.clientSurvey;

            return (
              <div
                key={booking.id}
                className="border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors"
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
                    <Link
                      href={`mailto:${booking.clientEmail}?subject=Gràcies per confiar en Òrbita Events!&body=Hola ${booking.clientName},%0D%0A%0D%0AGràcies per confiar en nosaltres per al vostre event del ${formatDateSimple(booking.eventDate)}!`}
                      className="px-4 py-2 text-white rounded-xl text-sm font-medium"
                    >
                      ✉️ Envia correu
                    </Link>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="px-4 py-2 bg-white/5 rounded-xl text-sm font-medium hover:bg-white/10"
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






