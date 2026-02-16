// app/admin/inbox/page.tsx
import { prisma } from '@/lib/prisma';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import Link from 'next/link';
import InboxClient from './InboxClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Correu | Òrbita Admin',
};

type QuotePackOption = {
  id: string;
  label: string;
  price: number;
};

async function getLeads() {
  try {
    return await cachedQuery(
      'admin:inbox:leads:50',
      () => prisma.lead.findMany({
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
      }),
      CacheTTL.VERY_SHORT
    );
  } catch (error) {
    console.error('[Inbox] Error carregant leads:', error);
    return [];
  }
}

async function getStats() {
  try {
    const startToday = new Date(new Date().setHours(0, 0, 0, 0));
    const [totalLeads, unreadLeads, todayLeads] = await cachedQuery(
      `admin:inbox:stats:${startToday.toISOString().slice(0, 10)}`,
      () => Promise.all([
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
            createdAt: { gte: startToday },
          },
        }),
      ]),
      CacheTTL.SHORT
    );
    return { totalLeads, unreadLeads, todayLeads };
  } catch (error) {
    console.error('[Inbox] Error carregant stats:', error);
    return { totalLeads: 0, unreadLeads: 0, todayLeads: 0 };
  }
}

async function getQuotePacks(): Promise<QuotePackOption[]> {
  try {
    const packs = await cachedQuery(
      'admin:inbox:quote-packs',
      () => prisma.pack.findMany({
        where: { isActive: true },
        select: {
          code: true,
          slug: true,
          price: true,
          translations: {
            where: { locale: 'ca' },
            select: { name: true },
            take: 1,
          },
        },
        orderBy: { price: 'asc' },
        take: 20,
      }),
      CacheTTL.SHORT
    );

    return packs.map((pack) => ({
      id: (pack.code || pack.slug || '').toLowerCase(),
      label: pack.translations[0]?.name || pack.slug,
      price: Number(pack.price || 0),
    })).filter((pack) => pack.id && pack.price > 0);
  } catch (error) {
    console.error('[Inbox] Error carregant packs:', error);
    return [];
  }
}

// Verificar si IMAP està configurat
function isImapConfigured(): boolean {
  return !!(process.env.IMAP_HOST && process.env.IMAP_PORT && process.env.IMAP_USER && process.env.IMAP_PASS);
}

export default async function InboxPage() {
  const [leads, stats, quotePacks] = await Promise.all([getLeads(), getStats(), getQuotePacks()]);
  const imapConfigured = isImapConfigured();

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
        <div>
          <h1 className="text-xl font-semibold text-slate-200">📬 Inbox</h1>
          <p className="text-sm text-slate-400">
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
            className="px-4 py-2 border border-white/10 text-slate-200 rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            ⚙️ Configuració
          </Link>
        </div>
      </header>

      {/* Avís si IMAP no està configurat */}
      {!imapConfigured && (
        <div className="mx-6 mt-4 p-4 bg-amber-950/30 border border-amber-400/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-amber-200">Correu no configurat</h3>
              <p className="text-sm text-amber-300 mt-1">
                Per veure emails reals del teu domini, configura les variables IMAP a Railway:
              </p>
              <code className="block mt-2 p-2 bg-amber-500/15 rounded text-xs text-amber-200">
                IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS
              </code>
              <p className="text-sm text-amber-300 mt-2">
                Mentrestant, pots veure els <strong>leads del formulari web</strong> aquí sota.
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
        quotePacks={quotePacks}
      />
    </div>
  );
}





