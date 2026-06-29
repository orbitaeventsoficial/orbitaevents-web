import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  findPortalAccessByRawToken,
  markPortalAccessHit,
  normalizePortalLocale,
} from '@/lib/services/clientPortalAccess';
import { formatCurrency } from '@/lib/constants';
import {
  CLIENT_PORTAL_MESSAGES,
  type ClientPortalLocale,
} from '@/lib/clientPortalMessages';
import {
  getClientPortalPaymentSummary,
  type ClientPortalPaymentSummary,
} from '@/lib/clientPortalPayment';
import { toRgba, resolvePortalAccentHex } from '@/lib/clientPortalUtils';
import PortalBottomNav from '../PortalBottomNav';
import BizumPayButton from './BizumPayButton';
import { getClientPortalHiddenNavItems, getClientPortalVisibility } from '@/lib/clientPortalVisibility';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function getPaymentNoticeMessage(
  messages: Record<string, string>,
  notice: ClientPortalPaymentSummary['notice'],
): string {
  const map: Record<ClientPortalPaymentSummary['notice'], string> = {
    deposit_payable: messages.paymentNoticeDepositPayable,
    remaining_payable: messages.paymentNoticeRemainingPayable,
    deposit_paid_remaining_pending: messages.paymentNoticeDepositReceived,
    manual_pending: messages.paymentNoticeManualPending,
    all_paid: messages.paymentNoticeAllPaid,
  };
  return map[notice];
}

export default async function ClientPortalPaymentsPage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  const locale = normalizePortalLocale(params.locale) as ClientPortalLocale;
  const t = CLIENT_PORTAL_MESSAGES[locale];

  const access = await findPortalAccessByRawToken(params.token);
  if (!access) notFound();

  const personalization = access.personalization;
  const visibility = getClientPortalVisibility(personalization);
  if (!visibility.payments) notFound();

  const requestHeaders = headers();
  await markPortalAccessHit({
    accessId: access.id,
    ip: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip'),
    userAgent: requestHeaders.get('user-agent'),
  });

  const accentHex = resolvePortalAccentHex(personalization);
  const accentBorder = toRgba(accentHex, 0.35) || 'rgba(6,182,212,0.35)';
  const accentBg = toRgba(accentHex, 0.12) || 'rgba(6,182,212,0.12)';

  const booking = access.booking as {
    reference: string;
    depositAmount: number;
    depositPaid: boolean;
    depositPaymentUrl?: string | null;
    depositBizumDeclaredAt?: Date | null;
    remainingAmount: number;
    remainingPaid: boolean;
    remainingPaymentUrl?: string | null;
    remainingBizumDeclaredAt?: Date | null;
  };

  const paymentSummary = getClientPortalPaymentSummary(booking);

  const bizumPhone = process.env.BIZUM_PHONE ?? null;

  const nextPaymentLabel = paymentSummary.nextPayment === 'deposit'
    ? t.paymentDeposit
    : paymentSummary.nextPayment === 'remaining'
    ? t.paymentRemaining
    : t.paymentNoAction;

  const bizumLabels = {
    instruction: t.bizumInstruction,
    concept: t.bizumConcept,
    button: t.bizumButton,
    sending: t.bizumSending,
    successTitle: t.bizumSuccessTitle,
    successBody: t.bizumSuccessBody,
    alreadyDeclared: t.bizumAlreadyDeclared,
    errorRetry: t.bizumErrorRetry,
  };

  return (
    <main className="min-h-screen pb-24 text-white/90 portal-shell-bg">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-6">
          <Link
            href={`/${locale}/portal/${params.token}`}
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            ← {t.portalLabel}
          </Link>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: accentHex }}>{t.payments}</p>
          <h1 className="text-2xl font-bold text-white">{t.paymentPageTitle}</h1>
          <p className="text-sm text-white/40 mt-1">{booking.reference}</p>
        </header>

        {/* Overview */}
        <div
          className="mb-5 rounded-2xl p-5"
          style={{ border: `1px solid ${accentBorder}`, backgroundColor: accentBg }}
        >
          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">{t.paymentOverview}</p>
          <p className="text-base text-white/80 mb-3">{getPaymentNoticeMessage(t, paymentSummary.notice)}</p>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2 text-sm">
            <span className="text-white/40">{t.paymentNextStep}:</span>
            <span className="font-semibold text-white">{nextPaymentLabel}</span>
          </div>
        </div>

        {/* Payment cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Deposit */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-xs text-white/35 uppercase tracking-wide mb-1">{t.paymentDeposit}</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(paymentSummary.deposit.amount)}</p>
            <p className={`text-sm font-medium mt-1 ${paymentSummary.deposit.paid ? 'text-emerald-300' : 'text-amber-300'}`}>
              {paymentSummary.deposit.paid ? `✓ ${t.paid}` : `○ ${t.pending}`}
            </p>
            {paymentSummary.deposit.payableOnline && paymentSummary.deposit.paymentUrl ? (
              <a
                href={paymentSummary.deposit.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full justify-center rounded-xl py-2.5 text-sm font-bold text-black hover:brightness-110 transition-all"
                style={{ backgroundColor: accentHex }}
              >
                {t.payDepositOnline}
              </a>
            ) : !paymentSummary.deposit.paid && bizumPhone ? (
              <BizumPayButton
                token={params.token}
                paymentType="deposit"
                bizumPhone={bizumPhone}
                amount={formatCurrency(paymentSummary.deposit.amount)}
                reference={booking.reference}
                accentHex={accentHex}
                labels={bizumLabels}
                alreadyDeclared={!!booking.depositBizumDeclaredAt}
              />
            ) : (
              <p className="mt-4 text-sm text-white/40">
                {paymentSummary.deposit.paid ? t.paymentNoAction : t.paymentLinkPending}
              </p>
            )}
          </div>

          {/* Remaining */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-xs text-white/35 uppercase tracking-wide mb-1">{t.paymentRemaining}</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(paymentSummary.remaining.amount)}</p>
            <p className={`text-sm font-medium mt-1 ${paymentSummary.remaining.paid ? 'text-emerald-300' : 'text-amber-300'}`}>
              {paymentSummary.remaining.paid ? `✓ ${t.paid}` : `○ ${t.pending}`}
            </p>
            {paymentSummary.remaining.payableOnline && paymentSummary.remaining.paymentUrl ? (
              <a
                href={paymentSummary.remaining.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full justify-center rounded-xl py-2.5 text-sm font-bold text-black hover:brightness-110 transition-all"
                style={{ backgroundColor: accentHex }}
              >
                {t.payRemainingOnline}
              </a>
            ) : !paymentSummary.remaining.paid && bizumPhone && paymentSummary.deposit.paid ? (
              <BizumPayButton
                token={params.token}
                paymentType="remaining"
                bizumPhone={bizumPhone}
                amount={formatCurrency(paymentSummary.remaining.amount)}
                reference={booking.reference}
                accentHex={accentHex}
                labels={bizumLabels}
                alreadyDeclared={!!booking.remainingBizumDeclaredAt}
              />
            ) : (
              <p className="mt-4 text-sm text-white/40">
                {paymentSummary.remaining.paid ? t.paymentNoAction : t.paymentLinkPending}
              </p>
            )}
          </div>
        </div>

        <footer className="mt-10 text-center">
          <p className="text-xs text-white/15">Òrbita Events</p>
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
