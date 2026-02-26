import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  findPortalAccessByRawToken,
  markPortalAccessHit,
  normalizePortalLocale,
} from '@/lib/services/clientPortalAccess';
import { calculateBillableTravelKm, calculateTravelBlocks, calculateTravelCharge, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_EUR, TRAVEL_BLOCK_KM } from '@/lib/services/travelCost';
import { formatCurrency, toIntlLocale } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type Locale = 'ca' | 'es' | 'en';

const MESSAGES: Record<Locale, Record<string, string>> = {
  ca: {
    pageTitle: 'Portal del teu esdeveniment',
    defaultHeadline: 'Benvinguts al vostre portal privat',
    defaultIntro: 'Aquí teniu tota la informació important del vostre esdeveniment en un únic lloc.',
    booking: 'Reserva',
    event: 'Detalls de l\'esdeveniment',
    services: 'Serveis contractats',
    payments: 'Pagaments',
    timeline: 'Estat del procés',
    documents: 'Documents',
    postEvent: 'Post-event',
    noDocuments: 'Encara no hi ha documents disponibles.',
    paymentDeposit: 'Paga i senyal',
    paymentRemaining: 'Resta',
    paid: 'Pagat',
    pending: 'Pendent',
    status: 'Estat',
    eventDate: 'Data',
    eventLocation: 'Ubicació',
    eventGuests: 'Convidats',
    travel: 'Desplaçament',
    travelDistance: 'Distància',
    travelRate: 'Model de cost',
    travelEstimated: 'Cost estimat',
    travelRoundTripFrom: 'Anada i tornada des de',
    travelIncluded: 'Inclòs',
    travelExtraKm: 'Km extra',
    backHome: 'Anar al web principal',
  },
  es: {
    pageTitle: 'Portal de tu evento',
    defaultHeadline: 'Bienvenidos a vuestro portal privado',
    defaultIntro: 'Aquí tenéis toda la información importante de vuestro evento en un único lugar.',
    booking: 'Reserva',
    event: 'Detalles del evento',
    services: 'Servicios contratados',
    payments: 'Pagos',
    timeline: 'Estado del proceso',
    documents: 'Documentos',
    postEvent: 'Post-evento',
    noDocuments: 'Todavía no hay documentos disponibles.',
    paymentDeposit: 'Señal',
    paymentRemaining: 'Resto',
    paid: 'Pagado',
    pending: 'Pendiente',
    status: 'Estado',
    eventDate: 'Fecha',
    eventLocation: 'Ubicación',
    eventGuests: 'Invitados',
    travel: 'Desplazamiento',
    travelDistance: 'Distancia',
    travelRate: 'Modelo de coste',
    travelEstimated: 'Coste estimado',
    travelRoundTripFrom: 'Ida y vuelta desde',
    travelIncluded: 'Incluido',
    travelExtraKm: 'Km extra',
    backHome: 'Ir a la web principal',
  },
  en: {
    pageTitle: 'Your event portal',
    defaultHeadline: 'Welcome to your private event portal',
    defaultIntro: 'Here you can find all key information for your event in one place.',
    booking: 'Booking',
    event: 'Event details',
    services: 'Booked services',
    payments: 'Payments',
    timeline: 'Process status',
    documents: 'Documents',
    postEvent: 'Post-event',
    noDocuments: 'No documents are available yet.',
    paymentDeposit: 'Deposit',
    paymentRemaining: 'Remaining',
    paid: 'Paid',
    pending: 'Pending',
    status: 'Status',
    eventDate: 'Date',
    eventLocation: 'Location',
    eventGuests: 'Guests',
    travel: 'Travel',
    travelDistance: 'Distance',
    travelRate: 'Cost model',
    travelEstimated: 'Estimated cost',
    travelRoundTripFrom: 'Round trip from',
    travelIncluded: 'Included',
    travelExtraKm: 'Extra km',
    backHome: 'Back to main site',
  },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendent',
  CONFIRMED: 'Confirmada',
  PREPARING: 'Preparant',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancel·lada',
};


function formatDistanceKm(km: number): string {
  return new Intl.NumberFormat('ca-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(km);
}

function toRgba(hex: string, alpha: number): string | null {
  const clean = hex.trim().replace('#', '');
  const valid = /^[0-9a-fA-F]{6}$/.test(clean) ? clean : /^[0-9a-fA-F]{3}$/.test(clean) ? clean.split('').map((c) => c + c).join('') : null;
  if (!valid) return null;
  const r = parseInt(valid.slice(0, 2), 16);
  const g = parseInt(valid.slice(2, 4), 16);
  const b = parseInt(valid.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getPackTranslation(
  translations: Array<{ locale: string; name: string; tagline?: string | null }>,
  locale: string
) {
  const preferred = locale.toLowerCase();
  return (
    translations.find((t) => t.locale.toLowerCase() === preferred) ||
    translations.find((t) => t.locale === 'ca') ||
    translations[0]
  );
}

export default async function ClientPortalPage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  const locale = normalizePortalLocale(params.locale) as Locale;
  const t = MESSAGES[locale];

  const access = await findPortalAccessByRawToken(params.token);
  if (!access) notFound();

  const requestHeaders = headers();
  await markPortalAccessHit({
    accessId: access.id,
    ip: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip'),
    userAgent: requestHeaders.get('user-agent'),
  });

  const booking = access.booking;
  const personalization = (access.personalization || {}) as {
    headline?: string;
    introMessage?: string;
    accentColor?: string;
    showTimeline?: boolean;
    showPayments?: boolean;
    showDocuments?: boolean;
    showPostEvent?: boolean;
  };

  const showTimeline = personalization.showTimeline ?? true;
  const showPayments = personalization.showPayments ?? true;
  const showDocuments = personalization.showDocuments ?? true;
  const showPostEvent = personalization.showPostEvent ?? true;
  const accentHex = personalization.accentColor && /^#?[0-9a-fA-F]{3,6}$/.test(personalization.accentColor)
    ? (personalization.accentColor.startsWith('#') ? personalization.accentColor : `#${personalization.accentColor}`)
    : '#06b6d4';
  const accentBorder = toRgba(accentHex, 0.45) || 'rgba(6, 182, 212, 0.45)';
  const accentBg = toRgba(accentHex, 0.15) || 'rgba(6, 182, 212, 0.15)';

  const packTranslation = getPackTranslation(booking.pack.translations, locale);
  const proposals = booking.proposals as Array<{
    id: string;
    status: string;
    reference: string;
    pdfUrl: string | null;
    createdAt: Date;
  }>;
  const latestProposal = proposals.find((proposal) => !!proposal.pdfUrl) || proposals[0];
  const bookingExtras = booking.extras as Array<{
    id: string;
    quantity: number;
    price: number;
    extra: {
      slug: string;
      translations: Array<{ locale: string; name: string; tagline?: string | null }>;
    };
  }>;
  const totalTravelKm = typeof booking.distanceKm === 'number' ? booking.distanceKm : 0;
  const billableTravelKm = calculateBillableTravelKm(totalTravelKm, INCLUDED_TRAVEL_KM);
  const travelBlocks = calculateTravelBlocks(totalTravelKm, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM);
  const travelCharge = calculateTravelCharge(totalTravelKm, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM, TRAVEL_BLOCK_EUR);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border bg-slate-900/60 p-6 shadow-xl" style={{ borderColor: accentBorder }}>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: accentHex }}>{t.booking} {booking.reference}</p>
          <h1 className="mt-2 text-2xl font-bold">{personalization.headline || t.defaultHeadline}</h1>
          <p className="mt-2 text-sm text-slate-300">{personalization.introMessage || t.defaultIntro}</p>
        </header>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold">{t.event}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-slate-400">{t.eventDate}</p>
              <p>{new Date(booking.eventDate).toLocaleDateString(toIntlLocale(locale))}</p>
            </div>
            <div>
              <p className="text-slate-400">{t.eventLocation}</p>
              <p>{booking.eventVenue ? `${booking.eventVenue} · ${booking.eventLocation}` : booking.eventLocation}</p>
            </div>
            <div>
              <p className="text-slate-400">{t.eventGuests}</p>
              <p>{booking.guestCount}</p>
            </div>
          </div>
        </section>

        {(typeof booking.distanceKm === 'number' && booking.distanceKm > 0) && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">{t.travel}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">{t.travelDistance}</p>
                <p>{formatDistanceKm(totalTravelKm)} km</p>
                <p className="text-xs text-slate-500">{t.travelRoundTripFrom} Granollers</p>
                <p className="text-xs text-emerald-300">{t.travelIncluded}: {INCLUDED_TRAVEL_KM} km</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">{t.travelRate}</p>
                <p>{TRAVEL_BLOCK_EUR} € / {TRAVEL_BLOCK_KM} km extra</p>
                <p className="text-xs text-slate-400">{t.travelExtraKm}: {formatDistanceKm(billableTravelKm)} km ({travelBlocks} trams)</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">{t.travelEstimated}</p>
                <p>{formatCurrency(travelCharge)}</p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold">{t.services}</h2>
          <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-950/20 p-4">
            <p className="text-xs uppercase text-amber-300">Pack</p>
            <p className="text-lg font-semibold text-amber-100">{packTranslation?.name || booking.pack.slug}</p>
            {packTranslation?.tagline && <p className="text-sm text-amber-200/80">{packTranslation.tagline}</p>}
          </div>

          {bookingExtras.length > 0 && (
            <div className="mt-3 space-y-2">
              {bookingExtras.map((extra) => {
                const translation = getPackTranslation(extra.extra.translations, locale);
                return (
                  <div key={extra.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                    <span>{translation?.name || extra.extra.slug}{extra.quantity > 1 ? ` x${extra.quantity}` : ''}</span>
                    <span>{formatCurrency(extra.price)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {showPayments && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">{t.payments}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">{t.paymentDeposit}</p>
                <p className="text-base font-semibold">{formatCurrency(booking.depositAmount)}</p>
                <p className={booking.depositPaid ? 'text-emerald-300' : 'text-amber-300'}>
                  {booking.depositPaid ? t.paid : t.pending}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">{t.paymentRemaining}</p>
                <p className="text-base font-semibold">{formatCurrency(booking.remainingAmount)}</p>
                <p className={booking.remainingPaid ? 'text-emerald-300' : 'text-amber-300'}>
                  {booking.remainingPaid ? t.paid : t.pending}
                </p>
              </div>
            </div>
          </section>
        )}

        {showTimeline && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">{t.timeline}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">{t.status}</p>
                <p>{STATUS_LABELS[booking.status] || booking.status}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">Portal</p>
                <p>{access.expiresAt ? `Vàlid fins ${new Date(access.expiresAt).toLocaleDateString('ca-ES')}` : 'Actiu'}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">Post-event</p>
                <p>{booking.postEventReport ? 'Informe intern completat' : 'En progrés'}</p>
              </div>
            </div>
          </section>
        )}

        {showDocuments && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">{t.documents}</h2>
            {latestProposal?.pdfUrl ? (
              <div className="mt-3">
                <a
                  href={latestProposal.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border px-4 py-2 text-sm font-semibold text-slate-100 hover:brightness-110"
                  style={{ borderColor: accentBorder, backgroundColor: accentBg }}
                >
                  Obrir pressupost ({latestProposal.reference})
                </a>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-300">{t.noDocuments}</p>
            )}
          </section>
        )}

        {showPostEvent && booking.status === 'COMPLETED' && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">{t.postEvent}</h2>
            <p className="mt-2 text-sm text-slate-300">
              Estat de seguiment: {(booking as Record<string, unknown>).clientFeedback ? 'feedback enviat' : 'pendent de tancament'}.
            </p>
          </section>
        )}

        <footer className="mt-8 text-center text-xs text-slate-400">
          <p>Orbita Events</p>
          <Link href={`/${locale}`} className="hover:underline" style={{ color: accentHex }}>
            {t.backHome}
          </Link>
        </footer>
      </div>
    </main>
  );
}
