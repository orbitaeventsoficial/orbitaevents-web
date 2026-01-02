// app/admin/emails/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import EmailStatsCards from './EmailStatsCards';
import EmailConfigPanel from './EmailConfigPanel';
import RecentEmailsTable from './RecentEmailsTable';
import ManualActionsPanel from './ManualActionsPanel';
import InboxPanel from './InboxPanel';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Emails Automàtics | Òrbita Admin',
};

async function getEmailStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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

  // Últims emails (simulat via activitat)
  const recentActivity = await prisma.customerActivity.findMany({
    where: {
      action: { in: ['POST_EVENT_EMAIL_SENT', 'TESTIMONIAL_SUBMITTED'] },
      createdAt: { gte: sevenDaysAgo },
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return {
    leadsWithEmail,
    postEventSent,
    postEventPending,
    testimonials,
    discountCodes,
    recentActivity,
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            📧 Emails Automàtics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Control i configuració del sistema d&apos;emails automàtics
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Tornar al panell
        </Link>
      </header>

      {/* Stats Cards */}
      <EmailStatsCards stats={stats} />

      {/* Inbox Panel - Lectura d'emails IMAP */}
      <InboxPanel />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna Principal (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Post-Event Emails */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-amber-50 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  ⏳ Emails Post-Event Pendents
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Events completats fa 1-7 dies sense email enviat
                </p>
              </div>
              <span className="bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {pendingBookings.length}
              </span>
            </div>
            
            {pendingBookings.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <span className="text-4xl">✅</span>
                <p className="mt-2">Tots els emails post-event estan enviats!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{booking.clientName}</p>
                      <p className="text-sm text-slate-500">{booking.clientEmail}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Event: {new Date(booking.eventDate).toLocaleDateString('ca-ES')} · Ref: {booking.reference}
                      </p>
                    </div>
                    <form action={`/api/admin/emails/send-post-event`} method="POST">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        📤 Enviar ara
                      </button>
                    </form>
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
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">⭐ Google Reviews</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enllaç directe per als clients que vulguin deixar ressenya a Google:
            </p>
            <div className="bg-slate-50 rounded-lg p-3 break-all">
              <code className="text-xs text-slate-700">
                https://g.page/r/CXcgbvANsXSzEBI/review
              </code>
            </div>
            <a
              href="https://g.page/r/CXcgbvANsXSzEBI/review"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              🔗 Obrir enllaç Google
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
