import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Feedback post-esdeveniment | Òrbita Admin',
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-200">
            💌 Feedback al Client
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Envia agraïments i incentius als clients després de l&apos;event
          </p>
        </div>
        <Link
          href="/admin/post-event"
          className="px-4 py-2 bg-white/5 text-slate-200 rounded-lg font-medium hover:bg-white/10"
        >
          ← Tornar
        </Link>
      </header>

      {/* Info Card */}
      <div className="bg-cyan-950/30 border border-cyan-400/30 rounded-xl p-6">
        <h3 className="font-semibold text-cyan-200 mb-2">💡 Què incloure al feedback?</h3>
        <ul className="text-sm text-cyan-300 space-y-1">
          <li>• 💌 Missatge personalitzat d&apos;agraïment</li>
          <li>• 📸 Foto icònica de l&apos;event (si disponible)</li>
          <li>• 🎁 Codi descompte 10% per proper event</li>
          <li>• 👥 Incentiu per referir amics/família</li>
          <li>• ⭐ Sol·licitud de review a Google</li>
        </ul>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-slate-950/60 border border-white/10 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">💌</div>
          <p className="text-slate-400">No hi ha events completats recent ment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const packName = booking.pack.translations[0]?.name || booking.pack.slug;
            const hasSurvey = !!booking.clientSurvey;

            return (
              <div
                key={booking.id}
                className="bg-slate-950/60 border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-200">
                        {booking.clientName}
                      </h3>
                      {hasSurvey && (
                        <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded text-xs font-medium">
                          ✓ Enquesta rebuda
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {new Date(booking.eventDate).toLocaleDateString('ca-ES')} · {packName} · {booking.eventLocation}
                    </p>
                    <p className="text-sm text-slate-300 mt-1">
                      📧 {booking.clientEmail} · 📞 {booking.clientPhone || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`mailto:${booking.clientEmail}?subject=Gràcies per confiar en Òrbita Events!&body=Hola ${booking.clientName},%0D%0A%0D%0AGràcies per confiar en nosaltres per al vostre event del ${new Date(booking.eventDate).toLocaleDateString('ca-ES')}!`}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                    >
                      ✉️ Enviar Email
                    </Link>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="px-4 py-2 bg-white/5 text-slate-200 rounded-lg text-sm font-medium hover:bg-white/10"
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






