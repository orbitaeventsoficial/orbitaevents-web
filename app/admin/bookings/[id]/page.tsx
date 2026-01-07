// app/admin/bookings/[id]/page.tsx
import { log } from '@/lib/logger';
// Detall de reserva amb canvi d'estat
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookingStatusChanger } from './BookingStatusChanger';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendent', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CONFIRMED: { label: 'Confirmada', bg: 'bg-green-100', text: 'text-green-700' },
  PREPARING: { label: 'Preparant', bg: 'bg-blue-100', text: 'text-blue-700' },
  COMPLETED: { label: 'Completada', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CANCELLED: { label: 'Cancel·lada', bg: 'bg-red-100', text: 'text-red-700' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Boda',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '💑 Aniversari',
  PRIVATE_PARTY: '🎉 Festa Privada',
  OTHER: '📋 Altre',
};

interface PageProps {
  params: { id: string };
}

async function getBooking(id: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        pack: { include: { translations: true, inventory: { include: { item: true } } } },
        extras: { include: { extra: { include: { translations: true } } } },
        inventory: { include: { item: true } },
        lead: true,
        postEventReport: true,
        clientSurvey: true,
        clientFeedback: true,
      },
    });

    return booking;
  } catch (error) {
    log.error('Error obtenint reserva:', error);
    return null;
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ca-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function BookingDetailPage({ params }: PageProps) {
  const booking = await getBooking(params.id);

  if (!booking) {
    notFound();
  }

  const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const eventType = EVENT_TYPE_LABELS[booking.eventType] || booking.eventType;
  const packTranslation = booking.pack.translations.find((t) => t.locale === 'ca');

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/bookings"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Tornar
            </Link>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusConf.bg} ${statusConf.text}`}>
              {statusConf.label}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">
            Reserva {booking.reference}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {eventType} · {formatDate(booking.eventDate)}
          </p>
        </div>

        {/* Status Changer */}
        <BookingStatusChanger
          bookingId={booking.id}
          currentStatus={booking.status}
          guestCount={booking.guestCount}
        />
      </header>

      {/* Client Info */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Informació del Client</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Nom</p>
            <p className="mt-1 text-slate-800 font-medium">{booking.clientName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
            <a href={`mailto:${booking.clientEmail}`} className="mt-1 text-blue-600 hover:underline block">
              {booking.clientEmail}
            </a>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Telèfon</p>
            <a href={`tel:${booking.clientPhone}`} className="mt-1 text-blue-600 hover:underline block">
              {booking.clientPhone}
            </a>
          </div>
        </div>
        {booking.lead && (
          <div className="mt-4 pt-4 border-t border-stone-200">
            <Link
              href={`/admin/leads/${booking.lead.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Veure lead original →
            </Link>
          </div>
        )}
      </section>

      {/* Event Info */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Detalls de l&apos;Event</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Tipus</p>
            <p className="mt-1 text-slate-800">{eventType}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Data</p>
            <p className="mt-1 text-slate-800 font-medium">{formatDate(booking.eventDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Horari</p>
            <p className="mt-1 text-slate-800">
              {booking.eventStartTime || '--:--'} - {booking.eventEndTime || '--:--'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Convidats</p>
            <p className="mt-1 text-slate-800 font-medium">{booking.guestCount} persones</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-slate-500 uppercase">Ubicació</p>
            <p className="mt-1 text-slate-800">{booking.eventLocation}</p>
          </div>
          {booking.eventVenue && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Espai</p>
              <p className="mt-1 text-slate-800">{booking.eventVenue}</p>
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Serveis Contractats</h2>

        {/* Pack */}
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-amber-700 uppercase">Pack</span>
              <p className="text-lg font-semibold text-amber-900">
                {packTranslation?.name || booking.pack.slug}
              </p>
              {packTranslation?.tagline && (
                <p className="text-sm text-amber-700">{packTranslation.tagline}</p>
              )}
              <p className="text-xs text-amber-600 mt-1">
                {booking.pack.djHours}h DJ · {booking.pack.soundWatts}W So
                {booking.pack.includesFog && ' · Fum'}
                {booking.pack.includesMic && ' · Micro'}
              </p>
            </div>
            <p className="text-xl font-bold text-amber-900">{formatCurrency(booking.pack.price)}</p>
          </div>
        </div>

        {/* Extras */}
        {booking.extras.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Extras</p>
            {booking.extras.map((extra) => {
              const extraTranslation = extra.extra.translations.find((t) => t.locale === 'ca');
              return (
                <div key={extra.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">
                      {extraTranslation?.name || extra.extra.slug}
                    </p>
                    {extra.quantity > 1 && (
                      <p className="text-xs text-slate-500">x{extra.quantity}</p>
                    )}
                  </div>
                  <p className="font-medium text-slate-800">{formatCurrency(extra.price)}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Extra Hours */}
        {booking.extraHours > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <p className="font-medium text-blue-900">Hores extra</p>
            <p className="font-medium text-blue-900">
              {booking.extraHours}h × {formatCurrency(booking.pack.extraHourPrice)} = {formatCurrency(booking.extraHours * booking.pack.extraHourPrice)}
            </p>
          </div>
        )}
      </section>

      {/* Pricing */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Resum Econòmic</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(booking.subtotal)}</span>
          </div>
          {booking.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descompte {booking.discountCode && `(${booking.discountCode})`}</span>
              <span>-{formatCurrency(booking.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>IVA ({booking.vatRate}%)</span>
            <span>{formatCurrency(booking.vatAmount)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-slate-800 pt-3 border-t">
            <span>Total</span>
            <span>{formatCurrency(booking.total)}</span>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={`p-4 rounded-lg ${booking.depositPaid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-xs font-medium uppercase text-slate-500">Paga i Senyal (30%)</p>
            <p className="text-lg font-bold">{formatCurrency(booking.depositAmount)}</p>
            <span className={`text-xs ${booking.depositPaid ? 'text-green-600' : 'text-red-600'}`}>
              {booking.depositPaid ? '✓ Pagat' : '✗ Pendent'}
            </span>
          </div>
          <div className={`p-4 rounded-lg ${booking.remainingPaid ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className="text-xs font-medium uppercase text-slate-500">Resta</p>
            <p className="text-lg font-bold">{formatCurrency(booking.remainingAmount)}</p>
            <span className={`text-xs ${booking.remainingPaid ? 'text-green-600' : 'text-amber-600'}`}>
              {booking.remainingPaid ? '✓ Pagat' : '○ Pendent'}
            </span>
          </div>
        </div>
      </section>

      {/* Notes */}
      {booking.notes && (
        <section className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Notes</h2>
          <p className="text-slate-700 whitespace-pre-wrap">{booking.notes}</p>
        </section>
      )}

      {/* Post-Event Section */}
      {booking.status === 'COMPLETED' && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold text-emerald-900 mb-4">Post-Event</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={`p-4 rounded-lg border ${booking.postEventReport ? 'bg-green-100 border-green-300' : 'bg-stone-50 border-stone-200'}`}>
              <p className="font-medium text-slate-800">Informe Intern</p>
              <p className="text-sm text-slate-500">
                {booking.postEventReport ? '✓ Completat' : 'Pendent de completar'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${booking.clientSurvey ? 'bg-green-100 border-green-300' : 'bg-stone-50 border-stone-200'}`}>
              <p className="font-medium text-slate-800">Enquesta Client</p>
              <p className="text-sm text-slate-500">
                {booking.clientSurvey ? `✓ NPS: ${booking.clientSurvey.npsScore}` : 'Pendent de rebre'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${booking.clientFeedback ? 'bg-green-100 border-green-300' : 'bg-stone-50 border-stone-200'}`}>
              <p className="font-medium text-slate-800">Feedback Enviat</p>
              <p className="text-sm text-slate-500">
                {booking.clientFeedback ? `✓ Codi: ${booking.clientFeedback.discountCode}` : 'Pendent d\'enviar'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
