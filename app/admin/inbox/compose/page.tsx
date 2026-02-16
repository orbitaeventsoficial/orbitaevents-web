// app/admin/inbox/compose/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ComposeForm from './ComposeForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nou correu | Òrbita Admin',
};

async function getLeadsAndPacks(customerId?: string) {
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

  const customer = customerId
    ? await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          name: true,
          email: true,
          preferredLocale: true,
        },
      })
    : null;

  return { leads, packs, customer };
}

export default async function ComposePage({
  searchParams,
}: {
  searchParams?: { customerId?: string; template?: string };
}) {
  const customerId = searchParams?.customerId || '';
  const template = searchParams?.template || '';
  const { leads, packs, customer } = await getLeadsAndPacks(customerId || undefined);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-200">✏️ Nou correu</h1>
          <p className="text-sm text-slate-400 mt-1">
            Envia pressupostos professionals i respon sol·licituds
          </p>
        </div>
        <Link
          href="/admin/inbox"
          className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-sm"
        >
          ← Tornar a l&apos;inbox
        </Link>
      </header>

      <ComposeForm
        leads={leads}
        packs={packs}
        initialCustomer={
          customer
            ? {
                id: customer.id,
                name: customer.name,
                email: customer.email || '',
                preferredLocale: customer.preferredLocale || 'ca',
              }
            : undefined
        }
        initialTemplate={template}
      />
    </div>
  );
}



