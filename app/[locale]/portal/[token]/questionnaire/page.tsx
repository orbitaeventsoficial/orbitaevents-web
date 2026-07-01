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
  type ClientPortalLocale,
} from '@/lib/clientPortalMessages';
import { getBookingQuestionnaire } from '@/lib/services/questionnaireService';
import { resolvePortalAccentHex } from '@/lib/clientPortalUtils';
import PortalBottomNav from '../PortalBottomNav';
import QuestionnaireForm from './QuestionnaireForm';
import { getClientPortalHiddenNavItems, getClientPortalVisibility } from '@/lib/clientPortalVisibility';
import ClientPortalPageHeader from '@/app/components/public/ClientPortalPageHeader';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ClientPortalQuestionnairePage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  const locale = normalizePortalLocale(params.locale) as ClientPortalLocale;
  const t = CLIENT_PORTAL_MESSAGES[locale];

  const access = await findPortalAccessByRawToken(params.token);
  if (!access) notFound();
  const visibility = getClientPortalVisibility(access.personalization);
  if (!visibility.questionnaire) notFound();

  const requestHeaders = headers();
  await markPortalAccessHit({
    accessId: access.id,
    ip: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip'),
    userAgent: requestHeaders.get('user-agent'),
  });

  const accentHex = resolvePortalAccentHex(access.personalization);
  const questionnaire = await getBookingQuestionnaire(access.booking.id);

  return (
    <main className="min-h-screen pb-24 text-white/90 portal-shell-bg">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <ClientPortalPageHeader
          backHref={`/${locale}/portal/${params.token}`}
          backLabel={t.portalLabel}
          eyebrow={t.questionnaireLabel}
          title={t.questionnairePageTitle}
          reference={(access.booking as { reference: string }).reference}
          accentColor={accentHex}
        />

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
          {!questionnaire ? (
            <p className="text-sm text-white/50">{t.questionnaireNoTemplate}</p>
          ) : (
            <QuestionnaireForm
              token={params.token}
              template={questionnaire.template}
              existingResponse={questionnaire.response}
              accentHex={accentHex}
              messages={{
                alreadySubmitted: t.questionnaireAlreadySubmitted,
                edit: t.questionnaireEdit,
                submit: t.questionnaireSubmit,
                saving: t.questionnaireSaving,
                success: t.questionnaireSuccess,
                successBack: t.questionnaireSuccessBack,
                error: t.questionnaireError,
                required: t.questionnaireRequired,
              }}
            />
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
