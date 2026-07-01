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
  CLIENT_PORTAL_MESSAGES,
  type ClientPortalLocale,
} from '@/lib/clientPortalMessages';
import {
  getClientPortalTimeline,
  PORTAL_TIMELINE_MILESTONE_MESSAGE_KEYS,
  type MilestoneStatus,
  type ClientPortalTimelineMilestone,
} from '@/lib/clientPortalTimeline';
import { resolvePortalAccentHex } from '@/lib/clientPortalUtils';
import PortalBottomNav from '../PortalBottomNav';
import { getClientPortalHiddenNavItems, getClientPortalVisibility } from '@/lib/clientPortalVisibility';
import ClientPortalPageHeader from '@/app/components/public/ClientPortalPageHeader';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function MilestoneRow({
  milestone,
  label,
  statusLabel,
  date,
  isLast,
  accentHex,
}: {
  milestone: ClientPortalTimelineMilestone;
  label: string;
  statusLabel: string;
  date: string | null;
  isLast: boolean;
  accentHex: string;
}) {
  const isDone = milestone.status === 'done';
  const isUpcoming = milestone.status === 'upcoming';
  const isFuture = milestone.status === 'future';

  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className="mt-1 h-4 w-4 flex-none rounded-full border-2"
          style={
            isDone
              ? { backgroundColor: 'var(--oe-green)', borderColor: 'var(--oe-green)' }
              : isUpcoming
              ? { backgroundColor: 'transparent', borderColor: accentHex, boxShadow: `0 0 0 3px ${accentHex}33` }
              : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' }
          }
          aria-hidden="true"
        />
        {!isLast && (
          <span
            className="mt-1 w-0.5 flex-1"
            style={{ backgroundColor: isDone ? 'color-mix(in oklab, var(--oe-green) 25%, transparent)' : 'rgba(255,255,255,0.08)' }}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-semibold ${isFuture ? 'text-white/35' : 'text-white/90'}`}>{label}</p>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={
              isDone
                ? { backgroundColor: 'color-mix(in oklab, var(--oe-green) 12%, transparent)', color: 'color-mix(in oklab, var(--oe-green) 70%, white)' }
                : isUpcoming
                ? { backgroundColor: `${accentHex}22`, color: accentHex }
                : { backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }
            }
          >
            {statusLabel}
          </span>
        </div>
        {date && <p className="mt-0.5 text-xs text-white/35">{date}</p>}
      </div>
    </li>
  );
}

export default async function ClientPortalTimelinePage({
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
  if (!visibility.timeline) notFound();

  const requestHeaders = headers();
  await markPortalAccessHit({
    accessId: access.id,
    ip: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip'),
    userAgent: requestHeaders.get('user-agent'),
  });

  const accentHex = resolvePortalAccentHex(access.personalization);

  const booking = access.booking as {
    createdAt: Date;
    eventDate: Date;
    reference: string;
    depositPaid: boolean;
    depositPaidAt: Date | null;
    remainingPaid: boolean;
    remainingPaidAt: Date | null;
  };

  const proposals = (access.booking.proposals as Array<{
    createdAt: Date;
    contractSignedAt: Date | null;
  }>);

  const milestones = getClientPortalTimeline(booking, proposals);

  function formatDate(d: Date | null): string | null {
    if (!d) return null;
    return new Date(d).toLocaleDateString(intlLocale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function statusLabel(status: MilestoneStatus): string {
    if (status === 'done') return t.milestoneDone;
    if (status === 'upcoming') return t.milestoneUpcoming;
    return t.milestoneFuture;
  }

  return (
    <main className="min-h-screen pb-24 text-white/90 portal-shell-bg">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <ClientPortalPageHeader
          backHref={`/${locale}/portal/${params.token}`}
          backLabel={t.portalLabel}
          eyebrow={t.timelineLabel}
          title={t.timelinePageTitle}
          reference={booking.reference}
          accentColor={accentHex}
        />

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
          <ul className="space-y-0" aria-label={t.timelineLabel}>
            {milestones.map((milestone, idx) => {
              const msgKey = PORTAL_TIMELINE_MILESTONE_MESSAGE_KEYS[milestone.key];
              const label = msgKey ? (t[msgKey] ?? milestone.key) : milestone.key;
              return (
                <MilestoneRow
                  key={milestone.key}
                  milestone={milestone}
                  label={label}
                  statusLabel={statusLabel(milestone.status)}
                  date={formatDate(milestone.date ? new Date(milestone.date) : null)}
                  isLast={idx === milestones.length - 1}
                  accentHex={accentHex}
                />
              );
            })}
          </ul>
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
