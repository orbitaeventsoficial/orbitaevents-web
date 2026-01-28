// app/admin/emails/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import EmailStatsCards from './EmailStatsCards';
import EmailConfigPanel from './EmailConfigPanel';
import RecentEmailsTable from './RecentEmailsTable';
import ManualActionsPanel from './ManualActionsPanel';
import InboxPanel from './InboxPanel';
import SendPostEventButton from './SendPostEventButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Emails Automàtics | Òrbita Admin',
};

async function getEmailStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Leads amb email enviat
  const leadsWithEmail = await prisma.lead.count({
    where: {
      email: { not: { contains: '@leads.orbitaevents.local' } },
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Bookings amb post-event email enviat
  const postEventSent = await prisma.booking.count({
    where: { postEventEmailSent: true },
  });

  // Bookings pendents d'enviar post-event
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const postEventPending = await prisma.booking.count({
    where: {
      status: 'COMPLETED',
      eventDate: { lte: twoDaysAgo },
      postEventEmailSent: false,
      clientEmail: { not: { contains: '@leads.orbitaevents.local' } },
    },
  });

  // Valoracions rebudes
  const testimonials = await prisma.customerTestimonial.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // Codis descompte generats
  const discountCodes = await prisma.customerDiscountCode.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // Últims emails (via activitat)
  const recentActivity = await prisma.customerActivity.findMany({
    where: {
      action: { in: ['POST_EVENT_EMAIL_SENT', 'TESTIMONIAL_SUBMITTED', 'DISCOUNT_CODE_GENERATED', 'LEAD_EMAIL_SENT'] },
      createdAt: { gte: sevenDaysAgo },
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const recentEmailActions = await prisma.customerActivity.count({
    where: {
      action: { in: ['POST_EVENT_EMAIL_SENT', 'LEAD_EMAIL_SENT'] },
      createdAt: { gte: twentyFourHoursAgo },
    },
  });

  const recentTestimonials = await prisma.customerActivity.count({
    where: {
      action: { in: ['TESTIMONIAL_SUBMITTED'] },
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const cronSettings = await prisma.setting.findMany({
    where: { key: { in: ['emails.cron.lastRun', 'emails.cron.lastStatus', 'emails.cron.lastSummary', 'emails.cron.lastMessage'] } },
  });

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
    recentActivity,
    recentEmailActions,
    recentTestimonials,
    cronLastRun: cronMap['emails.cron.lastRun'] || null,
    cronLastStatus: cronMap['emails.cron.lastStatus'] || null,
    cronLastMessage: cronMap['emails.cron.lastMessage'] || null,
    cronLastSummary: cronMap['emails.cron.lastSummary'] || null,
  };
}

async function getPendingPostEventBookings() {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      eventDate: {
        gte: sevenDaysAgo,
        lte: twoDaysAgo,
      },
      postEventEmailSent: false,
      clientEmail: { not: { contains: '@leads.orbitaevents.local' } },
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
}

export default async function EmailsAdminPage() {
  const stats = await getEmailStats();
  const pendingBookings = await getPendingPostEventBookings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            📧 Emails Automàtics
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Control i configuració del sistema d&apos;emails automàtics
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
        >
          ← Tornar al panell
        </Link>
      </header>

      {/* Stats Cards */}
      <EmailStatsCards stats={stats} />

      {/* Logs / Automatitzacions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-5">
          <p className="text-xs uppercase text-slate-400">Emails 24h</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.recentEmailActions}</p>
          <p className="text-xs text-slate-500 mt-1">Enviats automàticament</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5">
          <p className="text-xs uppercase text-slate-400">Testimonis 7d</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.recentTestimonials}</p>
          <p className="text-xs text-slate-500 mt-1">Respostes rebudes</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5">
          <p className="text-xs uppercase text-slate-400">Post-event pendents</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.postEventPending}</p>
          <p className="text-xs text-slate-500 mt-1">Per enviar</p>
        </div>
        <div className="rounded-2xl border border-slate-600/50 bg-slate-800/60 p-5">
          <p className="text-xs uppercase text-slate-400">Últim cron</p>
          <p className="mt-2 text-sm text-slate-300">
            {stats.cronLastRun
              ? new Date(stats.cronLastRun).toLocaleString('ca-ES', { dateStyle: 'medium', timeStyle: 'short' })
              : 'Mai executat'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Estat: {stats.cronLastStatus || '—'}
          </p>
          {stats.cronLastMessage && (
            <p className="text-[10px] text-rose-300 mt-1">
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
          <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 bg-amber-500/10 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-100">
                  ⏳ Emails Post-Event Pendents
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Events completats fa 1-7 dies sense email enviat
                </p>
              </div>
              <span className="bg-amber-500/20 text-amber-300 text-sm font-bold px-3 py-1 rounded-full">
                {pendingBookings.length}
              </span>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <span className="text-4xl">✅</span>
                <p className="mt-2">Tots els emails post-event estan enviats!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/30">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                    <div>
                      <p className="font-medium text-slate-100">{booking.clientName}</p>
                      <p className="text-sm text-slate-400">{booking.clientEmail}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Event: {new Date(booking.eventDate).toLocaleDateString('ca-ES')} · Ref: {booking.reference}
                      </p>
                    </div>
                    <SendPostEventButton bookingId={booking.id} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <RecentEmailsTable
            activities={stats.recentActivity.map(activity => ({
              ...activity,
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
          <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
            <h3 className="font-semibold text-slate-100 mb-4">⭐ Google Reviews</h3>
            <p className="text-sm text-slate-400 mb-4">
              Enllaç directe per als clients que vulguin deixar ressenya a Google:
            </p>
            <div className="bg-slate-700/30 rounded-xl p-3 break-all">
              <code className="text-xs text-slate-300">
                https://g.page/r/CXcgbvANsXSzEBI/review
              </code>
            </div>
            <a
              href="https://g.page/r/CXcgbvANsXSzEBI/review"
              target="_blank" rel="noopener noreferrer"
              className="mt-4 block w-full text-center px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-colors text-sm font-medium"
            >
              🔗 Obrir enllaç Google
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
