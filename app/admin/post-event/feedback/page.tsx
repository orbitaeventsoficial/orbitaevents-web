import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Feedbacks Post-Event | Òrbita Admin',
};

async function getCompletedBookings() {
  return prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      eventDate: { lt: new Date() },
    },
    orderBy: { eventDate: 'desc' },
    take: 50,
    include: {
      pack: { include: { translations: { where: { locale: 'es' } } } },
      clientSurvey: true,
    },
  });
}

export default async function FeedbackPage() {
  const bookings = await getCompletedBookings();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
            💌 Feedback al Client
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Envia agraïments i incentius als clients després de l&apos;event
          </p>
        </div>
        <Link
          href="/admin/post-event"
          className="px-4 py-2 bg-stone-100 text-slate-700 rounded-lg font-medium hover:bg-stone-200"
        >
          ← Tornar
        </Link>
      </header>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Què incloure al feedback?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 💌 Missatge personalitzat d&apos;agraïment</li>
          <li>• 📸 Foto icònica de l&apos;event (si disponible)</li>
          <li>• 🎁 Codi descompte 10% per proper event</li>
          <li>• 👥 Incentiu per referir amics/família</li>
          <li>• ⭐ Sol·licitud de review a Google</li>
        </ul>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">💌</div>
          <p className="text-slate-500">No hi ha events completats recent ment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const packName = booking.pack.translations[0]?.name || booking.pack.slug;
            const hasSurvey = !!booking.clientSurvey;

            return (
              <div
                key={booking.id}
                className="bg-white border border-stone-200 rounded-xl p-4 hover:bg-stone-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-700">
                        {booking.clientName}
                      </h3>
                      {hasSurvey && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                          ✓ Enquesta rebuda
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(booking.eventDate).toLocaleDateString('ca-ES')} · {packName} · {booking.eventLocation}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      📧 {booking.clientEmail} · 📞 {booking.clientPhone || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`mailto:${booking.clientEmail}?subject=Gràcies per confiar en Òrbita Events!&body=Hola ${booking.clientName},%0D%0A%0D%0AGràcies per confiar en nosaltres per al vostre event del ${new Date(booking.eventDate).toLocaleDateString('ca-ES')}!`}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                    >
                      ✉️ Enviar Email
                    </Link>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="px-4 py-2 bg-stone-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-stone-200"
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
    </div>
  );
}
