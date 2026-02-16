import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface Props {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

/**
 * Fallback de compatibilitat per enllaços antics o trencats.
 * Si algú entra a /admin/{id}, intentem resoldre si és lead o customer.
 */
export default async function AdminIdFallbackPage({ params }: Props) {
  const { id } = params;

  const [lead, customer] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    }),
    prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    }),
  ]);

  if (lead) {
    redirect(`/admin/leads/${id}`);
  }

  if (customer) {
    redirect(`/admin/contactes/${id}`);
  }

  redirect('/admin/leads');
}

