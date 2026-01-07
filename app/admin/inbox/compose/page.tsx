// app/admin/inbox/compose/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ComposeForm from './ComposeForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nou Email | Òrbita Admin',
};

async function getLeadsAndPacks() {
  const [leads, packs] = await Promise.all([
    prisma.lead.findMany({
      where: {
        email: { not: { contains: '@leads.orbitaevents.local' } },
        status: { in: ['NEW', 'CONTACTED', 'NEGOTIATING'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        eventType: true,
        eventDate: true,
        eventLocation: true,
        guestCount: true,
        budget: true,
        status: true,
        preferredLocale: true,
        interestedPackId: true,
        interestedExtras: true,
        message: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.pack.findMany({
      where: { isActive: true },
      include: {
        translations: true,
      },
      orderBy: { price: 'asc' },
    }),
  ]);

  return { leads, packs };
}

export default async function ComposePage() {
  const { leads, packs } = await getLeadsAndPacks();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">✏️ Nou Email</h1>
          <p className="text-sm text-slate-500 mt-1">
            Envia pressupostos professionals i respon sol·licituds
          </p>
        </div>
        <Link
          href="/admin/inbox"
          className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-slate-50 text-sm"
        >
          ← Tornar a l&apos;inbox
        </Link>
      </header>

      <ComposeForm leads={leads} packs={packs} />
    </div>
  );
}
