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
import { listPortalPhotos } from '@/lib/services/galleryService';
import Image from 'next/image';
import { CLIENT_PORTAL_CONTRACT_STATUS_LABELS, CLIENT_PORTAL_MESSAGES, CLIENT_PORTAL_STATUS_LABELS, type ClientPortalLocale } from '@/lib/clientPortalMessages';
import { buildClientPortalContractPath, getClientPortalContractSummary, type ClientPortalContractProposal } from '@/lib/clientPortalContract';
import { buildClientPortalPaymentsPath, getClientPortalPaymentSummary, type ClientPortalPaymentSummary } from '@/lib/clientPortalPayment';
import { buildClientPortalTimelinePath } from '@/lib/clientPortalTimeline';
import { buildClientPortalInvoicePath } from '@/lib/clientPortalInvoice';
import { getBookingQuestionnaire } from '@/lib/services/questionnaireService';
import { buildClientPortalQuestionnairePath } from '@/lib/clientPortalQuestionnaire';
import { buildClientPortalGalleryPath } from '@/lib/clientPortalGallery';
import CountdownTimer from './CountdownTimer';
import StarIcon from '@/app/components/public/StarIcon';
import { toRgba, resolvePortalAccentHex } from '@/lib/clientPortalUtils';
import PortalBottomNav from './PortalBottomNav';
import { getClientPortalHiddenNavItems, getClientPortalVisibility } from '@/lib/clientPortalVisibility';
import { CLIENT_PORTAL_TONE_CLASS, clientPortalPaymentTone } from '@/lib/constants/clientPortalTones';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Locale = ClientPortalLocale;
const MESSAGES = CLIENT_PORTAL_MESSAGES;
const STATUS_LABELS = CLIENT_PORTAL_STATUS_LABELS;
const CONTRACT_STATUS_LABELS = CLIENT_PORTAL_CONTRACT_STATUS_LABELS;

function formatDistanceKm(km: number, locale: Locale): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(km);
}

function getPackTranslation(
  translations: Array<{ locale: string; name: string; tagline?: string | null }>,
  locale: string,
) {
  const preferred = locale.toLowerCase();
  return (
    translations.find((t) => t.locale.toLowerCase() === preferred) ||
    translations.find((t) => t.locale === 'ca') ||
    translations[0]
  );
}

function getPaymentNoticeMessage(
  t: Record<string, string>,
  notice: ClientPortalPaymentSummary['notice'],
): string {
  const messages: Record<ClientPortalPaymentSummary['notice'], string> = {
    deposit_payable: t.paymentNoticeDepositPayable,
    remaining_payable: t.paymentNoticeRemainingPayable,
    deposit_paid_remaining_pending: t.paymentNoticeDepositReceived,
    manual_pending: t.paymentNoticeManualPending,
    all_paid: t.paymentNoticeAllPaid,
  };
  return messages[notice];
}

// ─── Progress step helpers ───────────────────────────────────────────────────

type StepStatus = 'done' | 'active' | 'pending';

function getProgressSteps(
  t: Record<string, string>,
  booking: {
    proposals: Array<{ status: string; pdfUrl: string | null; contractSignedAt: Date | null }>;
    depositPaid: boolean;
    remainingPaid: boolean;
    status: string;
  },
  locale: Locale,
): Array<{ label: string; status: StepStatus }> {
  const hasProposal = booking.proposals.some((p) => p.pdfUrl);
  const hasSigned = booking.proposals.some((p) => p.contractSignedAt);

  const isConfirmedOrBeyond = ['CONFIRMED', 'PREPARING', 'COMPLETED'].includes(booking.status);
  const step1Done = isConfirmedOrBeyond || hasProposal;
  const step2Done = hasSigned;
  const step3Done = booking.depositPaid;
  const step4Done = booking.status === 'COMPLETED';

  const steps: Array<{ label: string; done: boolean }> = [
    { label: t.milestoneProposalSent, done: step1Done },
    { label: t.milestoneContractSigned, done: step2Done },
    { label: t.milestoneDepositPaid, done: step3Done },
    { label: t.milestoneEvent, done: step4Done },
  ];

  let seenActive = false;
  return steps.map(({ label, done }) => {
    if (done) return { label, status: 'done' as StepStatus };
    if (!seenActive) {
      seenActive = true;
      return { label, status: 'active' as StepStatus };
    }
    return { label, status: 'pending' as StepStatus };
  });
}

function getNextActionLabel(
  t: Record<string, string>,
  paymentSummary: ClientPortalPaymentSummary,
  contractSummary: ReturnType<typeof getClientPortalContractSummary>,
): { label: string; href?: string; token?: string; locale?: string; urgent: boolean } | null {
  if (contractSummary?.awaitingInlineSignature) {
    return { label: t.signHere, urgent: true };
  }
  if (paymentSummary.deposit.payableOnline) {
    return { label: t.payDepositOnline, href: paymentSummary.deposit.paymentUrl!, urgent: true };
  }
  if (paymentSummary.remaining.payableOnline) {
    return { label: t.payRemainingOnline, href: paymentSummary.remaining.paymentUrl!, urgent: false };
  }
  return null;
}

// ─── SVG icons (inline, small) ───────────────────────────────────────────────

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    </svg>
  );
}
function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function IconCreditCard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function IconActivity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IconImage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}
function IconTruck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  accentHex,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  accentHex: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6 ${className ?? ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: toRgba(accentHex, 0.12) ?? 'rgba(6,182,212,0.12)' }}>
          <span style={{ color: accentHex }}>{icon}</span>
        </div>
        <h2 className="text-base font-semibold text-white/90">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

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
  };
  const visibility = getClientPortalVisibility(access.personalization);

  let portalPhotos: { id: string; photoUrl: string; caption: string | null }[] = [];
  try {
    portalPhotos = await listPortalPhotos(booking.id);
  } catch {
    // non-critical — skip
  }

  let activeQuestionnaire: Awaited<ReturnType<typeof getBookingQuestionnaire>> = null;
  try {
    activeQuestionnaire = await getBookingQuestionnaire(booking.id);
  } catch {
    // non-critical — skip
  }

  const accentHex = resolvePortalAccentHex(personalization);
  const accentBorder = toRgba(accentHex, 0.35) || 'rgba(6, 182, 212, 0.35)';
  const accentBg = toRgba(accentHex, 0.12) || 'rgba(6, 182, 212, 0.12)';
  const accentGlow = toRgba(accentHex, 0.18) || 'rgba(6, 182, 212, 0.18)';

  const packTranslation = getPackTranslation(booking.pack.translations, locale);
  const proposals = booking.proposals as Array<{
    id: string;
    status: string;
    reference: string;
    pdfUrl: string | null;
    createdAt: Date;
    contractReference: string | null;
    contractStatus: string | null;
    contractPdfUrl: string | null;
    contractSignedAt: Date | null;
    contractSignatureBlob: string | null;
  }>;
  const latestProposal = proposals.find((p) => !!p.pdfUrl) || proposals[0];
  const contractSummary = getClientPortalContractSummary(proposals as ClientPortalContractProposal[]);
  const paymentSummary = getClientPortalPaymentSummary(booking as {
    depositAmount: number;
    depositPaid: boolean;
    depositPaymentUrl?: string | null;
    remainingAmount: number;
    remainingPaid: boolean;
    remainingPaymentUrl?: string | null;
  });
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

  const progressSteps = getProgressSteps(t, booking as Parameters<typeof getProgressSteps>[1], locale);
  const nextAction = getNextActionLabel(t, paymentSummary, contractSummary);

  const customerName = (access.customer?.name || booking.customer?.name || '').split(' ')[0];
  const eventDateObj = new Date(booking.eventDate);
  const formattedEventDate = eventDateObj.toLocaleDateString(toIntlLocale(locale), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const isUpcoming = eventDateObj.getTime() > Date.now();

  return (
    <main className="min-h-screen pb-24 text-white/90 relative portal-shell-bg">
      {/* Ambient glow behind hero */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[900px] rounded-full blur-[120px]"
          style={{ backgroundColor: accentGlow }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <header className="mb-8">
          {/* Brand pill */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/40 tracking-widest uppercase">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentHex }} />
              Òrbita Events
            </span>
          </div>

          {/* Welcome + name */}
          <div className="text-center">
            <p className="text-sm font-medium mb-2" style={{ color: accentHex }}>
              {personalization.headline || t.defaultHeadline}
              {customerName ? `, ${customerName}` : ''}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white mb-1">
              {packTranslation?.name || booking.pack.slug}
            </h1>
            <p className="text-white/40 text-sm">{t.booking} · {booking.reference}</p>
          </div>

          {/* Event info strip */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-white/60">
              <IconCalendar className="w-4 h-4" />
              {formattedEventDate}
            </span>
            <span className="flex items-center gap-1.5 text-white/60">
              <IconMapPin className="w-4 h-4" />
              {booking.eventVenue ? `${booking.eventVenue} · ${booking.eventLocation}` : booking.eventLocation}
            </span>
            <span className="flex items-center gap-1.5 text-white/60">
              <IconUsers className="w-4 h-4" />
              {booking.guestCount} {t.eventGuests.toLowerCase()}
            </span>
          </div>

          {/* Countdown */}
          {isUpcoming && (
            <div className="mt-8 flex justify-center">
              <CountdownTimer
                eventDateIso={booking.eventDate.toISOString()}
                locale={locale}
                accentHex={accentHex}
              />
            </div>
          )}
        </header>

        {/* ── PROGRESS BAR ──────────────────────────────────────────────── */}
        <div
          className="mb-8 rounded-2xl border p-5"
          style={{ borderColor: accentBorder, backgroundColor: accentBg }}
        >
          <div className="flex items-center justify-between gap-2">
            {progressSteps.map((step, i) => (
              <div key={step.label} className="flex flex-1 flex-col items-center gap-2">
                {/* connector left */}
                <div className="flex w-full items-center">
                  {i > 0 && (
                    <div
                      className="h-px flex-1"
                      style={{
                        backgroundColor: progressSteps[i - 1].status === 'done' ? accentHex : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  )}
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={
                      step.status === 'done'
                        ? { backgroundColor: accentHex, color: '#000' }
                        : step.status === 'active'
                        ? { border: `2px solid ${accentHex}`, color: accentHex }
                        : { border: '2px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.25)' }
                    }
                  >
                    {step.status === 'done' ? (
                      <IconCheck className="w-3.5 h-3.5" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  {i < progressSteps.length - 1 && (
                    <div
                      className="h-px flex-1"
                      style={{
                        backgroundColor: step.status === 'done' ? accentHex : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  )}
                </div>
                <span
                  className="text-center text-[10px] leading-tight hidden sm:block"
                  style={{
                    color:
                      step.status === 'done'
                        ? accentHex
                        : step.status === 'active'
                        ? 'rgba(255,255,255,0.75)'
                        : 'rgba(255,255,255,0.28)',
                  }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── NEXT ACTION CTA ────────────────────────────────────────────── */}
        {nextAction && (
          <div
            className="mb-6 rounded-2xl p-5 flex items-center justify-between gap-4"
            style={{
              border: `1px solid ${accentBorder}`,
              background: `linear-gradient(135deg, ${toRgba(accentHex, 0.15) ?? accentBg} 0%, ${toRgba(accentHex, 0.06) ?? 'transparent'} 100%)`,
            }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-0.5">{t.paymentNextStep}</p>
              <p className="text-base font-semibold text-white">{nextAction.label}</p>
            </div>
            {nextAction.href ? (
              <a
                href={nextAction.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-black hover:brightness-110 transition-all"
                style={{ backgroundColor: accentHex }}
              >
                {nextAction.label}
              </a>
            ) : contractSummary?.awaitingInlineSignature ? (
              <Link
                href={`/${locale}/portal/${params.token}/sign`}
                className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-black hover:brightness-110 transition-all"
                style={{ backgroundColor: accentHex }}
              >
                {nextAction.label}
              </Link>
            ) : null}
          </div>
        )}

        {/* ── SECTIONS GRID ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Services */}
          <SectionCard icon={<StarIcon className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />} title={t.services} accentHex={accentHex}>
            <div
              className="rounded-xl p-4 mb-3"
              style={{ border: `1px solid ${toRgba(accentHex, 0.3)}`, backgroundColor: toRgba(accentHex, 0.08) ?? 'transparent' }}
            >
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: accentHex }}>Pack</p>
              <p className="text-lg font-bold text-white">{packTranslation?.name || booking.pack.slug}</p>
              {packTranslation?.tagline && (
                <p className="text-sm text-white/50 mt-0.5">{packTranslation.tagline}</p>
              )}
            </div>
            {bookingExtras.length > 0 && (
              <div className="space-y-2">
                {bookingExtras.map((extra) => {
                  const translation = getPackTranslation(extra.extra.translations, locale);
                  return (
                    <div key={extra.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-2.5 text-sm">
                      <span className="text-white/75">
                        {translation?.name || extra.extra.slug}
                        {extra.quantity > 1 ? ` ×${extra.quantity}` : ''}
                      </span>
                      <span className="text-white/50 font-medium">{formatCurrency(extra.price)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Payments */}
          {visibility.payments && (
            <SectionCard icon={<IconCreditCard className="w-4 h-4" />} title={t.payments} accentHex={accentHex}>
              <p className="text-sm text-white/50 mb-4">{getPaymentNoticeMessage(t, paymentSummary.notice)}</p>
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                {/* Deposit */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <p className="text-xs text-white/35 mb-1">{t.paymentDeposit}</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(paymentSummary.deposit.amount)}</p>
                  <p className={`text-xs font-medium mt-1 ${clientPortalPaymentTone(paymentSummary.deposit.paid)}`}>
                    {paymentSummary.deposit.paid ? '✓ ' : '○ '}{paymentSummary.deposit.paid ? t.paid : t.pending}
                  </p>
                  {paymentSummary.deposit.payableOnline && paymentSummary.deposit.paymentUrl && (
                    <a href={paymentSummary.deposit.paymentUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center rounded-lg py-2 text-sm font-semibold text-black hover:brightness-110 transition-all"
                      style={{ backgroundColor: accentHex }}>
                      {t.payDepositOnline}
                    </a>
                  )}
                </div>
                {/* Remaining */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <p className="text-xs text-white/35 mb-1">{t.paymentRemaining}</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(paymentSummary.remaining.amount)}</p>
                  <p className={`text-xs font-medium mt-1 ${clientPortalPaymentTone(paymentSummary.remaining.paid)}`}>
                    {paymentSummary.remaining.paid ? '✓ ' : '○ '}{paymentSummary.remaining.paid ? t.paid : t.pending}
                  </p>
                  {paymentSummary.remaining.payableOnline && paymentSummary.remaining.paymentUrl && (
                    <a href={paymentSummary.remaining.paymentUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center rounded-lg py-2 text-sm font-semibold text-black hover:brightness-110 transition-all"
                      style={{ backgroundColor: accentHex }}>
                      {t.payRemainingOnline}
                    </a>
                  )}
                </div>
              </div>
              <Link
                href={buildClientPortalPaymentsPath(locale, params.token)}
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white hover:brightness-110 transition-all"
                style={{ borderColor: accentBorder, backgroundColor: accentBg }}
              >
                {t.paymentDetails} →
              </Link>
            </SectionCard>
          )}

          {/* Documents */}
          {visibility.documents && (
            <SectionCard icon={<IconFileText className="w-4 h-4" />} title={t.documents} accentHex={accentHex}>
              {contractSummary ? (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 mb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-wide">{t.contract}</p>
                      <p className="text-base font-semibold text-white mt-0.5">{contractSummary.contractReference}</p>
                      <p className="text-xs text-white/35">{contractSummary.proposalReference}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/35">{t.contractStatus}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {CONTRACT_STATUS_LABELS[locale][contractSummary.status] || contractSummary.status}
                      </p>
                      {contractSummary.awaitingInlineSignature && (
                        <span className={`text-xs ${CLIENT_PORTAL_TONE_CLASS.warningText}`}>{t.inlineSignaturePending}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contractSummary.awaitingInlineSignature && (
                      <Link href={`/${locale}/portal/${params.token}/sign`}
                        className="inline-flex rounded-xl px-4 py-2 text-sm font-bold text-black hover:brightness-110 transition-all"
                        style={{ backgroundColor: accentHex }}>
                        {t.signHere}
                      </Link>
                    )}
                    <Link href={buildClientPortalContractPath(locale, params.token)}
                      className="inline-flex rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
                      style={{ borderColor: accentBorder, backgroundColor: accentBg }}>
                      {t.contractDetails}
                    </Link>
                  </div>
                </div>
              ) : !latestProposal ? (
                <p className="text-sm text-white/40 mb-3">{t.noDocuments}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Link href={buildClientPortalInvoicePath(locale, params.token)}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
                  style={{ borderColor: accentBorder, backgroundColor: accentBg }}>
                  {t.invoiceViewLink}
                </Link>
                {latestProposal?.pdfUrl && (
                  <a href={latestProposal.pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
                    style={{ borderColor: accentBorder, backgroundColor: accentBg }}>
                    {t.openQuote} ({latestProposal.reference})
                  </a>
                )}
              </div>
            </SectionCard>
          )}

          {/* Timeline */}
          {visibility.timeline && (
            <SectionCard icon={<IconActivity className="w-4 h-4" />} title={t.timeline} accentHex={accentHex}>
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <p className="text-xs text-white/35 mb-1">{t.status}</p>
                  <p className="text-sm font-semibold">{STATUS_LABELS[locale][booking.status] || booking.status}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <p className="text-xs text-white/35 mb-1">{t.portalLabel}</p>
                  <p className="text-sm font-semibold">
                    {access.expiresAt
                      ? `${t.portalValidUntil} ${new Date(access.expiresAt).toLocaleDateString(toIntlLocale(locale))}`
                      : t.portalActive}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <p className="text-xs text-white/35 mb-1">{t.postEvent}</p>
                  <p className="text-sm font-semibold">{booking.postEventReport ? t.postEventDone : t.postEventProgress}</p>
                </div>
              </div>
              <Link href={buildClientPortalTimelinePath(locale, params.token)}
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
                style={{ borderColor: accentBorder, backgroundColor: accentBg }}>
                {t.timelineViewLink} →
              </Link>
            </SectionCard>
          )}

          {/* Travel */}
          {typeof booking.distanceKm === 'number' && booking.distanceKm > 0 && (
            <SectionCard icon={<IconTruck className="w-4 h-4" />} title={t.travel} accentHex={accentHex}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <p className="text-xs text-white/35 mb-1">{t.travelDistance}</p>
                  <p className="text-sm font-semibold">{formatDistanceKm(totalTravelKm, locale)} km</p>
                  <p className="text-xs text-white/35">{t.travelRoundTripFrom} Granollers</p>
                  <p className={`text-xs ${CLIENT_PORTAL_TONE_CLASS.successText} mt-0.5`}>{t.travelIncluded}: {INCLUDED_TRAVEL_KM} km</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <p className="text-xs text-white/35 mb-1">{t.travelRate}</p>
                  <p className="text-sm font-semibold">{TRAVEL_BLOCK_EUR}€ / {TRAVEL_BLOCK_KM} km extra</p>
                  <p className="text-xs text-white/35 mt-0.5">{t.travelExtraKm}: {formatDistanceKm(billableTravelKm, locale)} km ({travelBlocks} trams)</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <p className="text-xs text-white/35 mb-1">{t.travelEstimated}</p>
                  <p className="text-lg font-bold">{formatCurrency(travelCharge)}</p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Gallery */}
          {portalPhotos.length > 0 && (
            <SectionCard icon={<IconImage className="w-4 h-4" />} title={t.gallery} accentHex={accentHex}>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {portalPhotos.slice(0, 6).map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.06]">
                    <Image
                      src={photo.photoUrl}
                      alt={photo.caption || t.gallery}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 25vw"
                    />
                  </div>
                ))}
              </div>
              <Link href={buildClientPortalGalleryPath(locale, params.token)}
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
                style={{ borderColor: accentBorder, backgroundColor: accentBg }}>
                {t.galleryViewLink}{portalPhotos.length > 6 ? ` (${portalPhotos.length})` : ''} →
              </Link>
            </SectionCard>
          )}

          {/* Questionnaire */}
          {visibility.questionnaire && activeQuestionnaire && (
            <SectionCard icon={<IconClipboard className="w-4 h-4" />} title={t.questionnaireLabel} accentHex={accentHex}>
              <div className="mb-4 flex items-center gap-2">
                {activeQuestionnaire.response ? (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${CLIENT_PORTAL_TONE_CLASS.successSoft}`}>
                    <IconCheck className="w-3 h-3" />
                    {t.questionnaireCompleted}
                  </span>
                ) : (
                  <p className="text-sm text-white/50">{t.questionnaireViewLink}</p>
                )}
              </div>
              <Link href={buildClientPortalQuestionnairePath(locale, params.token)}
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
                style={{ borderColor: accentBorder, backgroundColor: accentBg }}>
                {activeQuestionnaire.response ? t.questionnaireEdit : t.questionnaireViewLink} →
              </Link>
            </SectionCard>
          )}

          {/* Post-event */}
          {visibility.postEvent && booking.status === 'COMPLETED' && (
            <SectionCard icon={<StarIcon className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />} title={t.postEvent} accentHex={accentHex}>
              <p className="text-sm text-white/50">
                {t.trackingStatus}: {(booking as Record<string, unknown>).clientFeedback ? t.feedbackSent : t.pendingClose}.
              </p>
            </SectionCard>
          )}

        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="mt-10 text-center">
          <div className="inline-flex flex-col items-center gap-2">
            <Link href={`/${locale}`} className="text-xs text-white/25 hover:text-white/50 transition-colors">
              {t.backHome}
            </Link>
            <p className="text-xs text-white/15">Òrbita Events</p>
          </div>
        </footer>

      </div>
      <PortalBottomNav
        basePath={`/${locale}/portal/${params.token}`}
        accentHex={accentHex}
        labels={{
          hub: t.portalLabel,
          payments: t.payments,
          timeline: t.timelineLabel,
          contract: t.contract,
          gallery: t.navGallery,
        }}
        hiddenItems={getClientPortalHiddenNavItems(visibility)}
      />
    </main>
  );
}
