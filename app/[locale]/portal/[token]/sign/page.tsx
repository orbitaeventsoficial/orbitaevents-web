import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  findPortalAccessByRawToken,
  markPortalAccessHit,
  normalizePortalLocale,
} from '@/lib/services/clientPortalAccess';
import {
  CLIENT_PORTAL_MESSAGES,
  getClientPortalContractStatusLabel,
  type ClientPortalLocale,
} from '@/lib/clientPortalMessages';
import {
  getClientPortalContractSummary,
} from '@/lib/clientPortalContract';
import { SignContractForm } from './SignContractForm';
import { toRgba, resolvePortalAccentHex } from '@/lib/clientPortalUtils';
import ClientPortalPageHeader from '@/app/components/public/ClientPortalPageHeader';
import { getClientPortalVisibility } from '@/lib/clientPortalVisibility';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SignContractPage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  const locale = normalizePortalLocale(params.locale);
  const t = CLIENT_PORTAL_MESSAGES[locale];

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

  const contractSummary = getClientPortalContractSummary(access.booking.proposals);

  if (!contractSummary || !contractSummary.awaitingInlineSignature) {
    const portalUrl = `/${locale}/portal/${params.token}`;
    return (
      <main className="min-h-screen text-white/90 flex items-center justify-center p-6 portal-shell-bg">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-lg font-semibold">
            {contractSummary?.status === 'SIGNED'
              ? t.signatureSigned
              : t.signatureNotReady}
          </p>
          {contractSummary?.status && (
            <p className="text-sm text-white/50">
              {getClientPortalContractStatusLabel(locale, contractSummary.status)}
            </p>
          )}
          <Link
            href={portalUrl}
            className="inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 hover:brightness-110"
          >
            {t.signSuccessBack}
          </Link>
        </div>
      </main>
    );
  }

  const accentHex = resolvePortalAccentHex(access.personalization);
  const accentBorder = toRgba(accentHex, 0.45) || 'rgba(6, 182, 212, 0.45)';
  const accentBg = toRgba(accentHex, 0.15) || 'rgba(6, 182, 212, 0.15)';

  return (
    <main className="min-h-screen text-white/90 relative portal-shell-bg">
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <ClientPortalPageHeader
          eyebrow={t.contract}
          title={t.contractPageTitle}
          reference={contractSummary.contractReference}
          accentColor={accentHex}
          frameBorderColor={accentBorder}
          framed
        />

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <p className="text-sm text-white/70">{t.signaturePreparation}</p>

          <SignContractForm
            token={params.token}
            locale={locale}
            contractReference={contractSummary.contractReference}
            accentHex={accentHex}
            accentBorder={accentBorder}
            accentBg={accentBg}
            messages={{
              signYourName: t.signYourName,
              signNamePlaceholder: t.signNamePlaceholder,
              signAcceptTerms: t.signAcceptTerms,
              signSubmit: t.signSubmit,
              signSubmitting: t.signSubmitting,
              signSuccess: t.signSuccess,
              signSuccessBack: t.signSuccessBack,
              signError: t.signError,
              signAlreadySigned: t.signAlreadySigned,
              signNotAvailable: t.signNotAvailable,
              signaturePadLabel: t.signaturePadLabel,
              signaturePadHint: t.signaturePadHint,
              signaturePadClear: t.signaturePadClear,
            }}
          />

          {contractSummary.pdfUrl && (
            <a
              href={contractSummary.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg border px-4 py-2 text-sm font-semibold text-white/90 hover:brightness-110"
              style={{ borderColor: accentBorder, backgroundColor: accentBg }}
            >
              {t.openContract}
              <span className="sr-only"> ({t.opensInNewTab})</span>
            </a>
          )}
        </section>

        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/portal/${params.token}`}
            className="text-sm text-white/40 hover:text-white/70"
          >
            <span aria-hidden="true">←</span> {t.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
