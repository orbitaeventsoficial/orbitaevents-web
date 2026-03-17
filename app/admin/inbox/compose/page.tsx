// app/admin/inbox/compose/page.tsx
import { prisma } from '@/lib/prisma';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import { AdminPage } from '../../components/AdminPage';
import ComposeForm from './ComposeForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nou correu | Òrbita Admin',
};

async function getLeadsAndPacks(customerId?: string) {
  const [leads, packs] = await Promise.all([
    prisma.lead.findMany({
      where: {
        email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } },
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
    <AdminPage
      title="Nou correu"
      subtitle="Envia pressupostos professionals i respon sol·licituds"
      back={{ href: '/admin/inbox', label: 'Inbox' }}
      className="max-w-4xl"
    >

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
    </AdminPage>
  );
}



