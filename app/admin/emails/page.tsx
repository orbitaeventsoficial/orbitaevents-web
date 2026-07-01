// app/admin/emails/page.tsx
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { formatDateTime, formatDateSimple, PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import { SITE_CONFIG } from '@/app/config/site-config';
import EmailStatsCards from './EmailStatsCards';
import EmailConfigPanel from './EmailConfigPanel';
import RecentEmailsTable from './RecentEmailsTable';
import ManualActionsPanel from './ManualActionsPanel';
import InboxPanel from './InboxPanel';
import SendPostEventButton from './SendPostEventButton';
import { readRecentEmailActivitySummary, type RecentEmailActivity } from '@/lib/services/customerActivityService';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Emails Automàtics | Òrbita Admin',
};

async function getEmailStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let hasQueryErrors = false;
  const safe = async <T,>(label: string, fallback: T, fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      hasQueryErrors = true;
      log.error(`[admin/emails] Query failed: ${label}`, error as Error);
      return fallback;
    }
  };

  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const [
    leadsWithEmail,
    postEventSent,
    postEventPending,
    testimonials,
    discountCodes,
    emailActivitySummary,
    cronSettings,
  ] = await Promise.all([
    safe('leadsWithEmail', 0, () =>
      prisma.lead.count({
        where: {
          email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } },
          createdAt: { gte: thirtyDaysAgo },
        },
      })
    ),
    safe('postEventSent', 0, () =>
      prisma.booking.count({
        where: { postEventEmailSent: true },
      })
    ),
    safe('postEventPending', 0, () =>
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          eventDate: { lte: twoDaysAgo },
          postEventEmailSent: false,
          clientEmail: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } },
        },
      })
    ),
    safe('testimonials', 0, () =>
      prisma.customerTestimonial.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      })
    ),
    safe('discountCodes', 0, () =>
      prisma.customerDiscountCode.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      })
    ),
    safe(
      'emailActivitySummary',
      {
        recentActivity: [] as RecentEmailActivity[],
        recentEmailActions: 0,
        recentTestimonials: 0,
      },
      () =>
        readRecentEmailActivitySummary({
          recentSince: sevenDaysAgo,
          recentLimit: 20,
          emailsSince: twentyFourHoursAgo,
          testimonialsSince: sevenDaysAgo,
        })
    ),
    safe('cronSettings', [] as Awaited<ReturnType<typeof prisma.setting.findMany>>, () =>
      prisma.setting.findMany({
        where: { key: { in: ['emails.cron.lastRun', 'emails.cron.lastStatus', 'emails.cron.lastSummary', 'emails.cron.lastMessage'] } },
      })
    ),
  ]);

  const cronMap = cronSettings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    leadsWithEmail,
    postEventSent,
    postEventPending,
    testimonials,
    discountCodes,
    recentActivity: emailActivitySummary.recentActivity,
    recentEmailActions: emailActivitySummary.recentEmailActions,
    recentTestimonials: emailActivitySummary.recentTestimonials,
    cronLastRun: cronMap['emails.cron.lastRun'] || null,
    cronLastStatus: cronMap['emails.cron.lastStatus'] || null,
    cronLastMessage: cronMap['emails.cron.lastMessage'] || null,
    cronLastSummary: cronMap['emails.cron.lastSummary'] || null,
    hasQueryErrors,
  };
}

async function getPendingPostEventBookings() {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    return await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        eventDate: {
          gte: sevenDaysAgo,
          lte: twoDaysAgo,
        },
        postEventEmailSent: false,
        clientEmail: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } },
      },
      select: {
        id: true,
        reference: true,
        clientName: true,
        clientEmail: true,
        eventDate: true,
        pack: { select: { translations: true } },
      },
      orderBy: { eventDate: 'desc' },
      take: 20,
    });
  } catch (error) {
    log.error('[admin/emails] Query failed: pendingPostEventBookings', error as Error);
    return [];
  }
}

export default async function EmailsAdminPage() {
  const stats = await getEmailStats();
  const pendingBookings = await getPendingPostEventBookings();

  return (
    <AdminPage
      title="Emails Automàtics"
      subtitle="Control i configuració del sistema d'emails automàtics"
      back={{ href: '/admin', label: 'Panell' }}
    >

      {/* Stats Cards */}
      <EmailStatsCards stats={stats} />

      {stats.hasQueryErrors && (
        <section className="ap-card p-4" data-help-title="Avís de dades parcials" data-help-desc="Indica que alguna consulta ha fallat. El panell segueix operatiu, però algunes xifres poden estar incompletes.">
          <p className="text-sm">
            ⚠️ Algunes dades no s&apos;han pogut carregar. El panell continua operatiu, però cal revisar migracions/estructura de BD.
          </p>
        </section>
      )}

      {/* Logs / Automatitzacions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-help-title="Estat d'automatitzacions" data-help-desc="Resumeix activitat recent del sistema d'emails i l'última execució del cron.">
        <div className="ap-card p-5">
          <p className="text-xs uppercase">Emails 24h</p>
          <p className="mt-2 text-2xl font-semibold">{stats.recentEmailActions}</p>
          <p className="text-xs mt-1">Enviats automàticament</p>
        </div>
        <div className="ap-card p-5">
          <p className="text-xs uppercase">Testimonis 7d</p>
          <p className="mt-2 text-2xl font-semibold">{stats.recentTestimonials}</p>
          <p className="text-xs mt-1">Respostes rebudes</p>
        </div>
        <div className="ap-card p-5">
          <p className="text-xs uppercase">Post-event pendents</p>
          <p className="mt-2 text-2xl font-semibold">{stats.postEventPending}</p>
          <p className="text-xs mt-1">Per enviar</p>
        </div>
        <div className="ap-card p-5">
          <p className="text-xs uppercase">Últim cron</p>
          <p className="mt-2 text-sm">
            {stats.cronLastRun
              ? formatDateTime(stats.cronLastRun)
              : 'Mai executat'}
          </p>
          <p className="text-xs mt-1">
            Estat: {stats.cronLastStatus || '—'}
          </p>
          {stats.cronLastMessage && (
            <p className="text-xs mt-1">
              {stats.cronLastMessage}
            </p>
          )}
        </div>
      </section>

      {/* Inbox Panel - Lectura d'emails IMAP */}
      <InboxPanel />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna Principal (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Post-Event Emails */}
          <section className="rounded-2xl border admin-card-glass overflow-hidden" data-help-title="Post-event pendents" data-help-desc="Llista reserves completades que encara no han rebut el correu post-event perquè puguis forçar-lo manualment.">
            <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="font-semibold">
                  ⏳ Emails Post-Event Pendents
                </h2>
                <p className="text-xs mt-1">
                  Events completats fa 1-7 dies sense email enviat
                </p>
              </div>
              <span className="w-fit text-sm font-bold px-3 py-1 rounded-full">
                {pendingBookings.length}
              </span>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-4xl">✅</span>
                <p className="mt-2">Tots els emails post-event estan enviats!</p>
              </div>
            ) : (
              <div className="divide-y admin-tone-border-subtle">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <p className="font-medium">{booking.clientName}</p>
                      <p className="break-all text-sm">{booking.clientEmail}</p>
                      <p className="text-xs mt-1">
                        Event: {formatDateSimple(booking.eventDate)} · Ref: {booking.reference}
                      </p>
                    </div>
                    <div className="sm:shrink-0">
                      <SendPostEventButton bookingId={booking.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <RecentEmailsTable
            activities={stats.recentActivity.map((activity) => ({
              ...activity,
              customer: activity.customer ?? null,
              details: activity.details as Record<string, unknown> | undefined
            }))}
          />
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Config Panel */}
          <EmailConfigPanel />

          {/* Manual Actions */}
          <ManualActionsPanel />

          {/* Google Reviews Link */}
          <section className="rounded-2xl border admin-card-glass p-6" data-help-title="Enllaç de Google Reviews" data-help-desc="Tens a mà l'enllaç oficial perquè el client pugui deixar una ressenya pública a Google.">
            <h3 className="font-semibold mb-4">⭐ Google Reviews</h3>
            <p className="text-sm mb-4">
              Enllaç directe per als clients que vulguin deixar ressenya a Google:
            </p>
            <div className="rounded-xl p-3 break-all">
              <code className="text-xs">
                {SITE_CONFIG.reviews.googleReviewUrl}
              </code>
            </div>
            <a
              href={SITE_CONFIG.reviews.googleReviewUrl}
              target="_blank" rel="noopener noreferrer"
              className="ap-btn ap-btn--primary mt-4 w-full justify-center"
            >
              🔗 Obrir enllaç Google
            </a>
          </section>
        </div>
      </div>
    </AdminPage>
  );
}



