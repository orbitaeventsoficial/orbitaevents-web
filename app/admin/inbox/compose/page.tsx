// app/admin/inbox/compose/page.tsx
import { prisma } from '@/lib/prisma';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import { AdminPage } from '../../components/AdminPage';
import ComposeForm from './ComposeForm';
import { resolveComposeReturnHref } from './composeNavigation';
import { BULK_COMPOSE_SEGMENTS, loadBulkComposeAudience, type BulkComposeSegmentKey } from '@/lib/services/bulkComposeSegmentService';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nou correu | Òrbita Admin',
};

async function getLeadsAndPacks(customerId?: string, leadId?: string) {
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

  const selectedLead = leadId
    ? await prisma.lead.findUnique({
        where: { id: leadId },
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
      })
    : null;

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

  const mergedLeads = selectedLead && !leads.some((lead) => lead.id === selectedLead.id)
    ? [selectedLead, ...leads]
    : leads;

  return { leads: mergedLeads, packs, customer };
}

async function getSegmentAudience(segmentKey?: string) {
  if (!segmentKey) return null;
  return loadBulkComposeAudience(segmentKey as BulkComposeSegmentKey);
}

export default async function ComposePage({
  searchParams,
}: {
  searchParams?: { customerId?: string; leadId?: string; template?: string; segment?: string };
}) {
  const customerId = searchParams?.customerId || '';
  const leadId = searchParams?.leadId || '';
  const template = searchParams?.template || '';
  const segmentKey = searchParams?.segment || '';
  const [{ leads, packs, customer }, segmentAudience] = await Promise.all([
    getLeadsAndPacks(customerId || undefined, leadId || undefined),
    getSegmentAudience(segmentKey || undefined),
  ]);
  const returnHref = resolveComposeReturnHref({
    customerId: customerId || null,
    leadId: leadId || null,
  });

  return (
    <AdminPage
      title="Nou correu"
      subtitle="Envia pressupostos professionals i respon sol·licituds"
      back={{ href: returnHref, label: customerId ? 'Client' : leadId ? 'Lead' : 'Inbox' }}
      className="max-w-4xl"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {BULK_COMPOSE_SEGMENTS.map((segment) => (
          <a
            key={segment.key}
            href={`/admin/inbox/compose?segment=${segment.key}`}
            className={`rounded-xl border px-3 py-2 text-xs ${
              segmentAudience?.key === segment.key
                ? 'admin-tone-soft-info admin-tone-border-info admin-tone-text-info'
                : 'admin-tone-idle'
            }`}
          >
            {segment.label}
          </a>
        ))}
        {segmentAudience && (
          <a href="/admin/inbox/compose" className="rounded-xl border px-3 py-2 text-xs admin-tone-idle">
            Redactor individual
          </a>
        )}
      </div>

      <ComposeForm
        leads={leads}
        packs={packs}
        returnHref={returnHref}
        initialLeadId={leadId || undefined}
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
        initialSegmentAudience={segmentAudience || undefined}
      />
    </AdminPage>
  );
}
