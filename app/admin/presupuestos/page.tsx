import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/constants';
import { ADMIN_PDF_STUDIO_DEFAULTS } from '@/lib/constants/admin';
import ProposalsList from './ProposalsList';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { AdminPage } from '../components/AdminPage';

const PresupuestoPdfStudio = dynamicImport(() => import('./PresupuestoPdfStudio'), {
  ssr: false,
  loading: () => (
    <section className="ap-card ap-card-body text-[var(--o-text-sm)] text-[var(--t2)]">
      Carregant editor de pressupostos...
    </section>
  ),
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pressupostos | Òrbita Admin',
  robots: { index: false, follow: false },
};

function toDateInputValue(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : '';
}

function buildSchedule(start?: string | null, end?: string | null): string {
  if (start && end) return `${start}-${end}`;
  return start || end || '';
}

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams?: { customerId?: string; leadId?: string; proposalId?: string; statusFilter?: string };
}) {
  const customerId = searchParams?.customerId || '';
  const leadId = searchParams?.leadId || '';
  const proposalId = searchParams?.proposalId || '';
  const statusFilter = searchParams?.statusFilter || '';

  // If we have customerId or proposalId, show the editor
  const showEditor = Boolean(customerId || proposalId || leadId);

  const customer = customerId
    ? await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, email: true, phone: true, preferredLocale: true },
      })
    : null;

  const leadForEditor = leadId
    ? await prisma.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          eventDate: true,
          eventStartTime: true,
          eventEndTime: true,
          eventLocation: true,
          eventAddress: true,
          guestCount: true,
          preferredLocale: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              preferredLocale: true,
            },
          },
        },
      })
    : null;

  const brandSettingsRows = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'quotes.brandName',
          'quotes.brandWebsite',
          'quotes.brandEmail',
          'quotes.brandPhone',
          'quotes.brandTagline',
          'quotes.logoDataUrl',
        ],
      },
    },
    select: { key: true, value: true },
  });
  const brandSettings = Object.fromEntries(brandSettingsRows.map((row) => [row.key, row.value]));

  // Always load proposals for the list
  const [proposals, quotes] = await Promise.all([
    prisma.proposal.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        reference: true,
        status: true,
        total: true,
        createdAt: true,
        sentAt: true,
        customerId: true,
        leadId: true,
        bookingId: true,
        customer: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.leadDocument.findMany({
      where: {
        type: 'QUOTE',
        ...(leadId ? { leadId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        fileUrl: true,
        createdAt: true,
        leadId: true,
        lead: {
          select: { name: true, email: true },
        },
      },
    }),
  ]);

  // Serialize dates for client component
  const serializedProposals = proposals.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    sentAt: p.sentAt?.toISOString() || null,
  }));

  const serializedQuotes = quotes.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
  }));

  if (!showEditor) {
    // LIST VIEW — show all proposals with filters and actions
    const now = Date.now();
    const SENT_STALE_DAYS = 7;
    const DRAFT_STALE_DAYS = 14;
    const counts = {
      total: proposals.length,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
    };
    let acceptedValue = 0;
    let sentValue = 0;
    let sentStale = 0;
    let draftStale = 0;
    let acceptedWithoutBooking = 0;
    for (const proposal of proposals) {
      const ageDays = Math.floor((now - proposal.createdAt.getTime()) / 86_400_000);
      switch (proposal.status) {
        case 'DRAFT':
          counts.draft += 1;
          if (!proposal.sentAt && ageDays >= DRAFT_STALE_DAYS) draftStale += 1;
          break;
        case 'SENT': {
          counts.sent += 1;
          sentValue += proposal.total;
          const sentAgeDays = proposal.sentAt
            ? Math.floor((now - proposal.sentAt.getTime()) / 86_400_000)
            : ageDays;
          if (sentAgeDays >= SENT_STALE_DAYS) sentStale += 1;
          break;
        }
        case 'ACCEPTED':
          counts.accepted += 1;
          acceptedValue += proposal.total;
          if (!proposal.bookingId) acceptedWithoutBooking += 1;
          break;
        case 'REJECTED':
          counts.rejected += 1;
          break;
        case 'EXPIRED':
          counts.expired += 1;
          break;
      }
    }

    const systemItems: string[] = [];
    if (counts.total > 0) {
      systemItems.push(`${counts.total} propostes recents al catàleg`);
    }
    if (counts.sent > 0) {
      systemItems.push(`${counts.sent} enviades · ${formatCurrency(sentValue)} pendents`);
    }
    if (counts.accepted > 0) {
      systemItems.push(`${counts.accepted} acceptades · ${formatCurrency(acceptedValue)} guanyats`);
    }
    if (counts.draft > 0) {
      systemItems.push(`${counts.draft} esborranys vius`);
    }
    if (quotes.length > 0) {
      systemItems.push(`${quotes.length} pressupostos antics (LeadDocument) encara vinculats`);
    }

    const manualItems: string[] = [];
    if (sentStale > 0) {
      manualItems.push(`${sentStale} propostes enviades sense resposta fa ${SENT_STALE_DAYS}+ dies`);
    }
    if (acceptedWithoutBooking > 0) {
      manualItems.push(`${acceptedWithoutBooking} acceptades encara sense reserva vinculada`);
    }
    if (draftStale > 0) {
      manualItems.push(`${draftStale} esborranys oberts fa ${DRAFT_STALE_DAYS}+ dies sense enviar`);
    }
    if (counts.expired > 0) {
      manualItems.push(`${counts.expired} propostes expirades per revisar`);
    }
    if (counts.rejected > 0) {
      manualItems.push(`${counts.rejected} rebutjades recents (lliçó per l'ofertes)`);
    }


    return (
      <AdminPage
        eyebrow="Comercial · Pressupostos"
        title="Pressupostos"
        subtitle="Controla què s'ha ofert, què està pendent de seguiment i què ja hauria de convertir-se en reserva."
        actions={
          <Link
            href="/admin/presupuestos?customerId=new"
            className="ap-btn ap-btn--primary"
          >
            + Nou pressupost
          </Link>
        }
      >
        <ProposalsList
          proposals={serializedProposals}
          quotes={serializedQuotes}
          initialStatusFilter={statusFilter}
        />
      </AdminPage>
    );
  }

  // EDITOR VIEW — show the PDF studio
  return (
    <AdminPage
      back={{ href: '/admin/presupuestos', label: 'Pressupostos' }}
      eyebrow="Comercial · Editor PDF"
      title={proposalId ? 'Editar pressupost' : 'Nou pressupost'}
      subtitle={
        customer ? (
          <span>
            Client: <Link href={buildCustomerHubHref(customer.id)} className="hover:underline"><strong>{customer.name}</strong></Link> ({customer.email})
          </span>
        ) : (
          'Selecciona un client per començar'
        )
      }
      actions={
        customer ? (
          <Link href={buildCustomerHubHref(customer.id)} className="ap-btn ap-btn--secondary">
            Fitxa client
          </Link>
        ) : undefined
      }
    >
      <PresupuestoPdfStudio
        initialCustomerId={customer?.id || leadForEditor?.customer?.id || ''}
        initialCustomerName={customer?.name || leadForEditor?.customer?.name || leadForEditor?.name || ''}
        initialCustomerEmail={customer?.email || leadForEditor?.customer?.email || leadForEditor?.email || ''}
        initialCustomerPhone={customer?.phone || leadForEditor?.customer?.phone || leadForEditor?.phone || ''}
        initialEventDate={toDateInputValue(leadForEditor?.eventDate)}
        initialEventSchedule={buildSchedule(leadForEditor?.eventStartTime, leadForEditor?.eventEndTime)}
        initialEventLocation={leadForEditor?.eventAddress || leadForEditor?.eventLocation || ''}
        initialGuests={leadForEditor?.guestCount || 80}
        initialLeadId={leadId}
        initialProposalId={proposalId}
        initialPreferredLocale={customer?.preferredLocale || leadForEditor?.customer?.preferredLocale || leadForEditor?.preferredLocale || 'ca'}
        initialBrandName={String(brandSettings['quotes.brandName'] || ADMIN_PDF_STUDIO_DEFAULTS.brandName)}
        initialBrandWebsite={String(brandSettings['quotes.brandWebsite'] || ADMIN_PDF_STUDIO_DEFAULTS.brandWebsite)}
        initialBrandEmail={String(brandSettings['quotes.brandEmail'] || '')}
        initialBrandPhone={String(brandSettings['quotes.brandPhone'] || '')}
        initialBrandTagline={String(brandSettings['quotes.brandTagline'] || 'El teu esdeveniment. El teu estil. La teva nit perfecta.')}
        initialBrandLogoDataUrl={String(brandSettings['quotes.logoDataUrl'] || '')}
      />
    </AdminPage>
  );
}
