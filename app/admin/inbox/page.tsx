// app/admin/inbox/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import InboxClient from './InboxClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Correu | Òrbita Admin',
};

async function getLeads() {
  // Obtenir leads del formulari web
  const leads = await prisma.lead.findMany({
    where: {
      email: { not: { contains: '@leads.orbitaevents.local' } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      eventType: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      preferredLocale: true,
      interestedPackId: true,
      interestedExtras: true,
      budget: true,
      guestCount: true,
      eventDate: true,
      eventLocation: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return leads;
}

async function getStats() {
  const [totalLeads, unreadLeads, todayLeads] = await Promise.all([
    prisma.lead.count({
      where: { email: { not: { contains: '@leads.orbitaevents.local' } } },
    }),
    prisma.lead.count({
      where: { 
        email: { not: { contains: '@leads.orbitaevents.local' } },
        status: 'NEW',
      },
    }),
    prisma.lead.count({
      where: {
        email: { not: { contains: '@leads.orbitaevents.local' } },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return { totalLeads, unreadLeads, todayLeads };
}

// Verificar si IMAP està configurat
function isImapConfigured(): boolean {
  return !!(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS);
}

export default async function InboxPage() {
  const [leads, stats] = await Promise.all([getLeads(), getStats()]);
  const imapConfigured = isImapConfigured();

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
        <div>
          <h1 className="text-xl font-semibold text-slate-700">📬 Inbox</h1>
          <p className="text-sm text-slate-500">
            {stats.unreadLeads} leads nous · {stats.todayLeads} avui
            {imapConfigured && ' · 📧 Correu connectat'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/inbox/compose"
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm"
          >
            ✏️ Nou email
          </Link>
          <Link
            href="/admin/inbox/settings"
            className="px-4 py-2 border border-stone-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            ⚙️ Configurar
          </Link>
        </div>
      </header>

      {/* Avís si IMAP no està configurat */}
      {!imapConfigured && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-amber-800">Correu no configurat</h3>
              <p className="text-sm text-amber-700 mt-1">
                Per veure emails reals del teu domini, configura les variables IMAP a Railway:
              </p>
              <code className="block mt-2 p-2 bg-amber-100 rounded text-xs text-amber-900">
                IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS
              </code>
              <p className="text-sm text-amber-700 mt-2">
                Mentre tant, pots veure els <strong>leads del formulari web</strong> aquí sota.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <InboxClient 
        initialLeads={leads} 
        stats={stats} 
        imapConfigured={imapConfigured}
      />
    </div>
  );
}
