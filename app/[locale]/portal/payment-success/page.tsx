import Link from 'next/link';
import type { Metadata } from 'next';
import { CLIENT_PORTAL_MESSAGES } from '@/lib/clientPortalMessages';
import { normalizePortalLocale } from '@/lib/services/clientPortalAccess';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type SearchParamValue = string | string[] | undefined;

function firstSearchParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getPaymentSuccessBody(messages: Record<string, string>, type: SearchParamValue): string {
  const normalizedType = firstSearchParam(type);
  if (normalizedType === 'deposit') return messages.paymentSuccessDepositBody;
  if (normalizedType === 'remaining') return messages.paymentSuccessRemainingBody;
  return messages.paymentSuccessGenericBody;
}

export default function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { type?: SearchParamValue; ref?: SearchParamValue };
}) {
  const locale = normalizePortalLocale(params.locale);
  const t = CLIENT_PORTAL_MESSAGES[locale];
  const body = getPaymentSuccessBody(t, searchParams.type);
  const reference = firstSearchParam(searchParams.ref)?.trim();

  return (
    <main className="min-h-screen text-white/90 flex items-center justify-center px-4 portal-shell-bg">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-[color-mix(in_oklab,var(--oe-green)_30%,transparent)] bg-[color-mix(in_oklab,var(--oe-green)_10%,transparent)] p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--oe-green)_40%,transparent)] bg-[color-mix(in_oklab,var(--oe-green)_18%,transparent)]">
            <svg
              aria-hidden="true"
              className="h-8 w-8 text-[var(--oe-green)]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">{t.paymentSuccessTitle}</h1>
          {reference && (
            <p className="mt-1 text-sm text-white/40">
              {reference}
            </p>
          )}
          <p className="mt-4 text-white/80">{body}</p>
          <p className="mt-3 text-sm text-white/50">{t.paymentSuccessPortalNote}</p>
        </div>
        <div className="mt-6 text-center">
          <Link href={`/${locale}`} className="text-sm text-white/40 hover:text-white/70 underline">
            {t.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
