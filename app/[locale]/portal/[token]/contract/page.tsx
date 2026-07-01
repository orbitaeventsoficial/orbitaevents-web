import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  findPortalAccessByRawToken,
  markPortalAccessHit,
  normalizePortalLocale,
} from '@/lib/services/clientPortalAccess';
import { toIntlLocale } from '@/lib/constants';
import {
  CLIENT_PORTAL_CONTRACT_STATUS_LABELS,
  CLIENT_PORTAL_MESSAGES,
  type ClientPortalLocale,
} from '@/lib/clientPortalMessages';
import {
  getClientPortalContractSummary,
  type ClientPortalContractProposal,
  type ClientPortalContractSignatureState,
} from '@/lib/clientPortalContract';
import { toRgba, resolvePortalAccentHex } from '@/lib/clientPortalUtils';
import PortalBottomNav from '../PortalBottomNav';
import { getClientPortalHiddenNavItems, getClientPortalVisibility } from '@/lib/clientPortalVisibility';
import ClientPortalPageHeader from '@/app/components/public/ClientPortalPageHeader';
import { CLIENT_PORTAL_TONE_CLASS } from '@/lib/constants/clientPortalTones';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function getSignatureLabel(state: ClientPortalContractSignatureState, messages: Record<string, string>): string {
  if (state === 'READY_TO_SIGN') return messages.signatureReady;
  if (state === 'SIGNED') return messages.signatureSigned;
  if (state === 'CANCELLED') return messages.signatureCancelled;
  return messages.signatureNotReady;
}

function getSignatureRequirementLabel(id: string, messages: Record<string, string>): string {
  if (id === 'sent') return messages.signatureRequirementSent;
  if (id === 'pdf') return messages.signatureRequirementPdf;
  return messages.signatureRequirementUnsigned;
}

export default async function ClientPortalContractPage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  const locale = normalizePortalLocale(params.locale) as ClientPortalLocale;
  const t = CLIENT_PORTAL_MESSAGES[locale];
  const contractStatusLabels = CLIENT_PORTAL_CONTRACT_STATUS_LABELS[locale];

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

  const contractSummary = getClientPortalContractSummary(
    access.booking.proposals as ClientPortalContractProposal[],
  );
  if (!contractSummary) notFound();

  const signedAt = contractSummary.signedAt
    ? contractSummary.signedAt.toLocaleDateString(toIntlLocale(locale))
    : null;

  return (
    <main className="min-h-screen pb-24 text-white/90 portal-shell-bg">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <ClientPortalPageHeader
          backHref={`/${locale}/portal/${params.token}`}
          backLabel={t.portalLabel}
          eyebrow={t.contract}
          title={t.contractPageTitle}
          reference={access.booking.reference}
          accentColor={accentHex}
        />

        {/* Contract & status */}
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-xs text-white/35 uppercase tracking-wide">{t.contract}</p>
            <p className="mt-1 text-lg font-bold text-white">{contractSummary.contractReference}</p>
            <p className="text-xs text-white/35 mt-0.5">{contractSummary.proposalReference}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-xs text-white/35 uppercase tracking-wide">{t.contractStatus}</p>
            <p className="mt-1 text-lg font-bold text-white">
              {contractStatusLabels[contractSummary.status] || contractSummary.status}
            </p>
            {signedAt && <p className={`text-xs ${CLIENT_PORTAL_TONE_CLASS.successText} mt-0.5`}>{signedAt}</p>}
          </div>
        </div>

        {/* Signature box */}
        <div
          className="mb-4 rounded-2xl p-5"
          style={{ border: `1px solid ${accentBorder}`, backgroundColor: accentBg }}
        >
          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">{t.signature}</p>
          <p className="text-base font-semibold text-white mb-3">
            {getSignatureLabel(contractSummary.signatureState, t)}
          </p>
          {contractSummary.signatureState === 'READY_TO_SIGN' && (
            <p className="text-sm text-white/60 mb-3">{t.signaturePreparation}</p>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            {contractSummary.signatureChecklist.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border px-3 py-2 text-xs ${item.complete ? CLIENT_PORTAL_TONE_CLASS.successSoft : CLIENT_PORTAL_TONE_CLASS.warningSoft}`}
              >
                <span className="font-bold">{item.complete ? '✓' : '○'}</span>
                <span className="ml-2">{getSignatureRequirementLabel(item.id, t)}</span>
              </div>
            ))}
          </div>
          {contractSummary.signatureState === 'SIGNED' && contractSummary.signatureBlob && (
            <div className={`mt-4 rounded-xl border p-3 ${CLIENT_PORTAL_TONE_CLASS.successSoft}`}>
              <p className="text-xs font-semibold uppercase mb-2">{t.signature}</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- data:image URL de signatura capturada; next/image no suporta data URIs sense remote patterns */}
              <img
                src={contractSummary.signatureBlob}
                alt={t.signatureSigned}
                className={`max-h-28 rounded border ${CLIENT_PORTAL_TONE_CLASS.successBorder} bg-black/20 object-contain`}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {contractSummary.awaitingInlineSignature && (
            <Link
              href={`/${locale}/portal/${params.token}/sign`}
              className="inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-black hover:brightness-110 transition-all"
              style={{ backgroundColor: accentHex }}
            >
              {t.signHere}
            </Link>
          )}
          {contractSummary.pdfUrl && (
            <a
              href={contractSummary.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl border px-4 py-2 text-sm font-medium text-white/75 hover:text-white transition-all"
              style={{ borderColor: accentBorder, backgroundColor: accentBg }}
            >
              {t.openContract}
            </a>
          )}
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
