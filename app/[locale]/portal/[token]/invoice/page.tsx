import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  findPortalAccessByRawToken,
  markPortalAccessHit,
  normalizePortalLocale,
} from '@/lib/services/clientPortalAccess';
import { formatCurrency, toIntlLocale } from '@/lib/constants';
import {
  CLIENT_PORTAL_MESSAGES,
  type ClientPortalLocale,
} from '@/lib/clientPortalMessages';
import {
  getClientPortalInvoiceSummary,
  type ClientPortalInvoiceBooking,
  type ClientPortalInvoiceProposal,
} from '@/lib/clientPortalInvoice';
import { toRgba, resolvePortalAccentHex } from '@/lib/clientPortalUtils';
import PortalBottomNav from '../PortalBottomNav';
import { getClientPortalHiddenNavItems, getClientPortalVisibility } from '@/lib/clientPortalVisibility';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ClientPortalInvoicePage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  const locale = normalizePortalLocale(params.locale) as ClientPortalLocale;
  const t = CLIENT_PORTAL_MESSAGES[locale];
  const intlLocale = toIntlLocale(locale);

  const access = await findPortalAccessByRawToken(params.token);
  if (!access) notFound();
  const visibility = getClientPortalVisibility(access.personalization);
  if (!visibility.documents) notFound();

  const requestHeaders = headers();
  await markPortalAccessHit({
    accessId: access.id,
    ip: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip'),
    userAgent: requestHeaders.get('user-agent'),
  });

  const accentHex = resolvePortalAccentHex(access.personalization);
  const accentBorder = toRgba(accentHex, 0.35) || 'rgba(6,182,212,0.35)';
  const accentBg = toRgba(accentHex, 0.12) || 'rgba(6,182,212,0.12)';

  const booking = access.booking as ClientPortalInvoiceBooking & { reference: string };
  const proposals = (access.booking.proposals as ClientPortalInvoiceProposal[]);
  const summary = getClientPortalInvoiceSummary(booking, proposals);

  function formatDate(d: Date | null): string | null {
    if (!d) return null;
    return new Date(d).toLocaleDateString(intlLocale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const paymentStatus = summary.allPaid
    ? t.invoiceAllPaid
    : summary.deposit.paid
    ? t.invoicePartialPaid
    : t.invoicePendingPayment;

  const paymentStatusColor = summary.allPaid
    ? 'text-emerald-300'
    : summary.deposit.paid
    ? 'text-amber-300'
    : 'text-white/50';

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
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: accentHex }}>{t.invoiceLabel}</p>
          <h1 className="text-2xl font-bold text-white">{t.invoicePageTitle}</h1>
          <p className="text-sm text-white/40 mt-1">{booking.reference}</p>
        </header>

        {/* Total */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 mb-4">
          <div className="flex items-end justify-between">
            <p className="text-sm text-white/40">{t.invoiceTotal}</p>
            <p className="text-3xl font-black text-white">{formatCurrency(summary.total)}</p>
          </div>
          <p className={`mt-1 text-right text-sm font-medium ${paymentStatusColor}`}>{paymentStatus}</p>
        </div>

        {/* Line items */}
        <div className="space-y-3 mb-5">
          {/* Deposit */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-white/50">{t.paymentDeposit}</p>
              <p className="text-base font-bold text-white">{formatCurrency(summary.deposit.amount)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-sm ${summary.deposit.paid ? 'text-emerald-300' : 'text-amber-300'}`}>
                {summary.deposit.paid ? `✓ ${t.paid}` : `○ ${t.pending}`}
              </p>
              {summary.deposit.paidAt && (
                <p className="text-xs text-white/30">{formatDate(summary.deposit.paidAt)}</p>
              )}
            </div>
            {summary.deposit.payableOnline && summary.deposit.paymentUrl && (
              <a
                href={summary.deposit.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
                style={{ borderColor: accentBorder, backgroundColor: accentBg }}
              >
                {t.payDepositOnline}
              </a>
            )}
          </div>

          {/* Remaining */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-white/50">{t.paymentRemaining}</p>
              <p className="text-base font-bold text-white">{formatCurrency(summary.remaining.amount)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-sm ${summary.remaining.paid ? 'text-emerald-300' : 'text-amber-300'}`}>
                {summary.remaining.paid ? `✓ ${t.paid}` : `○ ${t.pending}`}
              </p>
              {summary.remaining.paidAt && (
                <p className="text-xs text-white/30">{formatDate(summary.remaining.paidAt)}</p>
              )}
            </div>
            {summary.remaining.payableOnline && summary.remaining.paymentUrl && (
              <a
                href={summary.remaining.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
                style={{ borderColor: accentBorder, backgroundColor: accentBg }}
              >
                {t.payRemainingOnline}
              </a>
            )}
          </div>
        </div>

        {/* PDF download */}
        {summary.pdfUrl && (
          <a
            href={summary.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
            style={{ borderColor: accentBorder, backgroundColor: accentBg }}
          >
            {t.invoiceDownloadPdf}
            {summary.proposalReference && (
              <span className="text-white/30 ml-1">({summary.proposalReference})</span>
            )}
          </a>
        )}

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
