import Link from 'next/link';
import type { Metadata } from 'next';
import { CLIENT_PORTAL_MESSAGES, type ClientPortalLocale } from '@/lib/clientPortalMessages';
import { normalizePortalLocale } from '@/lib/services/clientPortalAccess';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { type?: string; ref?: string };
}) {
  const locale = normalizePortalLocale(params.locale) as ClientPortalLocale;
  const t = CLIENT_PORTAL_MESSAGES[locale];
  const paymentType = searchParams.type === 'remaining' ? 'remaining' : 'deposit';

  const body =
    paymentType === 'deposit'
      ? t.paymentSuccessDepositBody
      : t.paymentSuccessRemainingBody;

  return (
    <main className="min-h-screen text-white/90 flex items-center justify-center px-4 portal-shell-bg">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-900/30">
            <svg
              aria-hidden="true"
              className="h-8 w-8 text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-emerald-300">{t.paymentSuccessTitle}</h1>
          {searchParams.ref && (
            <p className="mt-1 text-sm text-white/40">
              {searchParams.ref}
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
