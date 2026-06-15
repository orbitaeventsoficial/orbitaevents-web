// app/admin/inbox/compose/page.tsx
// Canvi #801 — reconstrucció des de zero (cx- classes, cap AdminPage)
import { prisma } from '@/lib/prisma';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import Link from 'next/link';
import ComposeForm from './ComposeForm';
import { resolveComposeReturnHref } from './composeNavigation';
import {
  BULK_COMPOSE_SEGMENTS,
  loadBulkComposeAudience,
  type BulkComposeSegmentKey,
} from '@/lib/services/bulkComposeSegmentService';
import '../inbox.css';

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
      include: { translations: true },
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
        select: { id: true, name: true, email: true, preferredLocale: true },
      })
    : null;

  const mergedLeads =
    selectedLead && !leads.some((l) => l.id === selectedLead.id)
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
  searchParams?: {
    customerId?: string;
    leadId?: string;
    template?: string;
    segment?: string;
    to?: string;
  };
}) {
  const customerId = searchParams?.customerId || '';
  const leadId = searchParams?.leadId || '';
  const template = searchParams?.template || '';
  const segmentKey = searchParams?.segment || '';
  const to = searchParams?.to || '';

  const [{ leads, packs, customer }, segmentAudience] = await Promise.all([
    getLeadsAndPacks(customerId || undefined, leadId || undefined),
    getSegmentAudience(segmentKey || undefined),
  ]);

  const returnHref = resolveComposeReturnHref({
    customerId: customerId || null,
    leadId: leadId || null,
  });

  return (
    <div className="cx">
      {/* Capçalera */}
      <div className="cx__head">
        <Link href={returnHref} className="cx__back">
          ← {customerId ? 'Client' : leadId ? 'Lead' : 'Safata'}
        </Link>
        <div className="cx__headtitles">
          <p className="cx__headeyebrow">Redactor</p>
          <h1 className="cx__headtitle">Nou correu</h1>
        </div>
      </div>

      {/* Cos */}
      <div className="cx__body">
        {/* Segments de campanya */}
        <div className="cx__segments">
          {BULK_COMPOSE_SEGMENTS.map((segment) => (
            <a
              key={segment.key}
              href={`/admin/inbox/compose?segment=${segment.key}`}
              className={`cx__segpill${segmentAudience?.key === segment.key ? ' is-on' : ''}`}
            >
              {segment.label}
            </a>
          ))}
          {segmentAudience && (
            <a href="/admin/inbox/compose" className="cx__segpill">
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
          initialTo={to || undefined}
          initialSegmentAudience={segmentAudience || undefined}
        />
      </div>
    </div>
  );
}
