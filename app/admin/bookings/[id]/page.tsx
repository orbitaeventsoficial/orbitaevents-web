// app/admin/bookings/[id]/page.tsx
import { log } from '@/lib/logger';
// Detall de reserva amb canvi d'estat
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookingStatusChanger } from './BookingStatusChanger';
import CommunicationPanel from './CommunicationPanel';
import { deriveFlowStatus } from '@/lib/services/communicationStatusService';
import CalendarSyncButton from './CalendarSyncButton';

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

function toGoogleCalendarUtc(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

function combineDateAndTime(baseDate: Date, time: string | null): Date | null {
  if (!time) return null;
  const [hRaw, mRaw] = time.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const dt = new Date(baseDate);
  dt.setHours(h, m, 0, 0);
  return dt;
}

function buildGoogleCalendarUrl(booking: {
  reference: string;
  clientName: string;
  eventDate: Date;
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventLocation: string;
  eventVenue: string | null;
  notes: string | null;
}) {
  const title = `Òrbita · ${booking.reference} · ${booking.clientName}`;
  const start = combineDateAndTime(booking.eventDate, booking.eventStartTime);
  const end = combineDateAndTime(booking.eventDate, booking.eventEndTime);
  const location = [booking.eventVenue, booking.eventLocation].filter(Boolean).join(' · ');
  const details = [
    `Cliente: ${booking.clientName}`,
    `Referencia: ${booking.reference}`,
    booking.notes ? `Notas: ${booking.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', title);
  if (start && end && end.getTime() > start.getTime()) {
    params.set('dates', `${toGoogleCalendarUtc(start)}/${toGoogleCalendarUtc(end)}`);
    params.set('ctz', 'Europe/Madrid');
  } else {
    const dayStart = new Date(booking.eventDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const yyyymmdd = `${dayStart.getFullYear()}${String(dayStart.getMonth() + 1).padStart(2, '0')}${String(dayStart.getDate()).padStart(2, '0')}`;
    const yyyymmddEnd = `${dayEnd.getFullYear()}${String(dayEnd.getMonth() + 1).padStart(2, '0')}${String(dayEnd.getDate()).padStart(2, '0')}`;
    params.set('dates', `${yyyymmdd}/${yyyymmddEnd}`);
  }
  if (location) params.set('location', location);
  if (details) params.set('details', details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function parseLogDetails(details: unknown): Record<string, unknown> {
  if (!details || typeof details !== 'object') return {};
  return details as Record<string, unknown>;
}

export default async function BookingDetailPage({ params }: PageProps) {
  const booking = await getBooking(params.id);

  if (!booking) {
    notFound();
  }

  const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const eventType = EVENT_TYPE_LABELS[booking.eventType] || booking.eventType;
  const packTranslation = booking.pack.translations.find((t) => t.locale === 'ca');
  const commLogs = await prisma.adminLog.findMany({
    where: {
      entity: 'booking',
      entityId: booking.id,
      action: { in: ['COMM_SENT', 'COMM_RESPONDED'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const commStatuses = {
    PAYMENT: deriveFlowStatus(commLogs, 'PAYMENT'),
    POST_EVENT: deriveFlowStatus(commLogs, 'POST_EVENT'),
    GENERAL: deriveFlowStatus(commLogs, 'GENERAL'),
  } as const;
  const customer = await prisma.customer.findFirst({
    where: { emailNormalized: booking.clientEmail.trim().toLowerCase() },
    select: {
      id: true,
      totalEvents: true,
      totalSpent: true,
      lastEventDate: true,
    },
  });
  const reviewFlowStatus = booking.reviewSubmittedAt || booking.clientSurvey
    ? 'RESPONDIDO'
    : booking.postEventEmailSent
      ? 'ENVIADO'
      : 'FALTA_ENVIAR';
  const internalPostEventStatus =
    booking.postEventReport && booking.clientFeedback?.sentAt
      ? 'COMPLETO'
      : booking.postEventReport || booking.clientFeedback?.sentAt
        ? 'EN_PROGRESO'
        : 'PENDIENTE';
  const googleCalendarUrl = buildGoogleCalendarUrl({
    reference: booking.reference,
    clientName: booking.clientName,
    eventDate: booking.eventDate,
    eventStartTime: booking.eventStartTime,
    eventEndTime: booking.eventEndTime,
    eventLocation: booking.eventLocation,
    eventVenue: booking.eventVenue,
    notes: booking.notes,
  });
  const recentCommRows = commLogs.slice(0, 12).map((logEntry) => {
    const details = parseLogDetails(logEntry.details);
    return {
      id: logEntry.id,
      createdAt: logEntry.createdAt,
      action: logEntry.action,
      flow: typeof details.flow === 'string' ? details.flow : '-',
      channel: typeof details.channel === 'string' ? details.channel : '-',
    };
  });

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
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-700">
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total reserva</p>
          <p className="text-xl font-semibold text-slate-800">{formatCurrency(booking.total)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pago</p>
          <p className="text-xl font-semibold text-slate-800">
            {booking.depositPaid && booking.remainingPaid ? 'Completado' : booking.depositPaid ? 'Parcial' : 'Pendiente'}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Flujo cliente</p>
          <p className="text-xl font-semibold text-slate-800">
            {reviewFlowStatus === 'RESPONDIDO'
              ? 'Respondido'
              : reviewFlowStatus === 'ENVIADO'
                ? 'Enviado'
                : 'Falta enviar'}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Post-event interno</p>
          <p className="text-xl font-semibold text-slate-800">
            {internalPostEventStatus === 'COMPLETO'
              ? 'Completado'
              : internalPostEventStatus === 'EN_PROGRESO'
                ? 'En progreso'
                : 'Pendiente'}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Lead comercial</p>
          <p className="text-xl font-semibold text-slate-800">{booking.lead?.status || 'Sin lead'}</p>
        </div>
      </section>

      {/* Client Info */}
      <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Informació del Client</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Nom</p>
            <p className="mt-1 text-slate-700 font-medium">{booking.clientName}</p>
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
        <div className="mt-3 flex flex-wrap gap-2">
          <form action="/api/admin/emails/send-post-event" method="POST">
            <input type="hidden" name="bookingId" value={booking.id} />
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
            >
              Enviar post-event client
            </button>
          </form>
          <Link
            href={`/admin/post-event/reports/new?bookingId=${booking.id}`}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Crear informe interno
          </Link>
          {customer && (
            <Link
              href={`/admin/contactes/${customer.id}`}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Abrir ficha cliente 360
            </Link>
          )}
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Añadir a Google Calendar
          </a>
          <Link
            href="/admin/settings/integrations"
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sync móvil/ICS
          </Link>
          <CalendarSyncButton bookingId={booking.id} />
        </div>
        {customer && (
          <div className="mt-3 rounded-lg border border-stone-200 bg-slate-50 p-3 text-xs text-slate-600">
            Historial cliente: {customer.totalEvents} eventos · {formatCurrency(customer.totalSpent)} ·
            {' '}último evento {customer.lastEventDate ? new Date(customer.lastEventDate).toLocaleDateString('ca-ES') : '-'}
          </div>
        )}
      </section>

      {/* Event Info */}
      <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Detalls de l&apos;Event</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Tipus</p>
            <p className="mt-1 text-slate-700">{eventType}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Data</p>
            <p className="mt-1 text-slate-700 font-medium">{formatDate(booking.eventDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Horari</p>
            <p className="mt-1 text-slate-700">
              {booking.eventStartTime || '--:--'} - {booking.eventEndTime || '--:--'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Convidats</p>
            <p className="mt-1 text-slate-700 font-medium">{booking.guestCount} persones</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-slate-500 uppercase">Ubicació</p>
            <p className="mt-1 text-slate-700">{booking.eventLocation}</p>
          </div>
          {booking.eventVenue && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Espai</p>
              <p className="mt-1 text-slate-700">{booking.eventVenue}</p>
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Serveis Contractats</h2>

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
                    <p className="font-medium text-slate-700">
                      {extraTranslation?.name || extra.extra.slug}
                    </p>
                    {extra.quantity > 1 && (
                      <p className="text-xs text-slate-500">x{extra.quantity}</p>
                    )}
                  </div>
                  <p className="font-medium text-slate-700">{formatCurrency(extra.price)}</p>
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
      <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Resum Econòmic</h2>
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
          <div className="flex justify-between text-xl font-bold text-slate-700 pt-3 border-t">
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
        <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Notes</h2>
          <p className="text-slate-700 whitespace-pre-wrap">{booking.notes}</p>
        </section>
      )}

      <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Historial de comunicaciones</h2>
        {recentCommRows.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay comunicaciones registradas para este evento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">Fecha</th>
                  <th className="px-2 py-2">Acción</th>
                  <th className="px-2 py-2">Flujo</th>
                  <th className="px-2 py-2">Canal</th>
                </tr>
              </thead>
              <tbody>
                {recentCommRows.map((row) => (
                  <tr key={row.id} className="border-b border-stone-100 text-slate-700">
                    <td className="px-2 py-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString('ca-ES')}</td>
                    <td className="px-2 py-2">{row.action === 'COMM_RESPONDED' ? 'Respondido' : 'Enviado'}</td>
                    <td className="px-2 py-2">{row.flow}</td>
                    <td className="px-2 py-2">{row.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Post-Event Section */}
      {booking.status === 'COMPLETED' && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold text-emerald-900 mb-4">Post-Event</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={`p-4 rounded-lg border ${booking.postEventReport ? 'bg-green-100 border-green-300' : 'bg-white border-stone-200'}`}>
              <p className="font-medium text-slate-700">Informe Intern</p>
              <p className="text-sm text-slate-500">
                {booking.postEventReport ? '✓ Completat' : 'Pendent de completar'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${booking.clientSurvey ? 'bg-green-100 border-green-300' : 'bg-white border-stone-200'}`}>
              <p className="font-medium text-slate-700">Enquesta Client</p>
              <p className="text-sm text-slate-500">
                {booking.clientSurvey ? `✓ NPS: ${booking.clientSurvey.npsScore}` : 'Pendent de rebre'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${booking.clientFeedback ? 'bg-green-100 border-green-300' : 'bg-white border-stone-200'}`}>
              <p className="font-medium text-slate-700">Feedback Enviat</p>
              <p className="text-sm text-slate-500">
                {booking.clientFeedback ? `✓ Codi: ${booking.clientFeedback.discountCode}` : 'Pendent d\'enviar'}
              </p>
            </div>
          </div>
        </section>
      )}

      <CommunicationPanel
        bookingId={booking.id}
        clientName={booking.clientName}
        clientPhone={booking.clientPhone}
        initialStatuses={{
          PAYMENT: {
            ...commStatuses.PAYMENT,
            sentAt: commStatuses.PAYMENT.sentAt?.toISOString() || null,
            respondedAt: commStatuses.PAYMENT.respondedAt?.toISOString() || null,
          },
          POST_EVENT: {
            ...commStatuses.POST_EVENT,
            sentAt: commStatuses.POST_EVENT.sentAt?.toISOString() || null,
            respondedAt: commStatuses.POST_EVENT.respondedAt?.toISOString() || null,
          },
          GENERAL: {
            ...commStatuses.GENERAL,
            sentAt: commStatuses.GENERAL.sentAt?.toISOString() || null,
            respondedAt: commStatuses.GENERAL.respondedAt?.toISOString() || null,
          },
        }}
      />
    </div>
  );
}
