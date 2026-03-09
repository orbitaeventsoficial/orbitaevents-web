import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { prisma } from '@/lib/prisma';
import { AdminPage } from '../components/AdminPage';
import ProposalsList from './ProposalsList';

const PresupuestoPdfStudio = dynamicImport(() => import('./PresupuestoPdfStudio'), {
  ssr: false,
  loading: () => (
    <section className="rounded-2xl border p-6 text-sm">
      Carregant editor de pressupostos...
    </section>
  ),
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pressupostos | Òrbita Admin',
  robots: { index: false, follow: false },
};

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams?: { customerId?: string; leadId?: string; proposalId?: string };
}) {
  const customerId = searchParams?.customerId || '';
  const leadId = searchParams?.leadId || '';
  const proposalId = searchParams?.proposalId || '';

  // If we have customerId or proposalId, show the editor
  const showEditor = Boolean(customerId || proposalId || leadId);

  const customer = customerId
    ? await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, email: true, preferredLocale: true },
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
    return (
      <AdminPage
        title="Pressupostos"
        subtitle="Tots els pressupostos creats. Filtra, cerca i gestiona des d'aquí."
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
        />
      </AdminPage>
    );
  }

  // EDITOR VIEW — show the PDF studio
  return (
    <AdminPage
      title={proposalId ? 'Editar pressupost' : 'Nou pressupost'}
      subtitle={
        <>
          {customer ? (
            <span>
              Client: <Link href={`/admin/clientes/${customer.id}`} className="hover:underline"><strong>{customer.name}</strong></Link> ({customer.email})
            </span>
          ) : (
            'Selecciona un client per començar'
          )}
        </>
      }
      back={{ href: '/admin/presupuestos', label: 'Pressupostos' }}
      actions={
        <div className="flex gap-2">
          {customer && (
            <Link href={`/admin/clientes/${customer.id}`} className="ap-btn ap-btn--secondary">
              👤 Fitxa Client
            </Link>
          )}
        </div>
      }
    >
      <PresupuestoPdfStudio
        initialCustomerId={customer?.id || ''}
        initialCustomerName={customer?.name || ''}
        initialCustomerEmail={customer?.email || ''}
        initialLeadId={leadId}
        initialProposalId={proposalId}
        initialPreferredLocale={customer?.preferredLocale || 'ca'}
        initialBrandName={String(brandSettings['quotes.brandName'] || 'Òrbita Events')}
        initialBrandWebsite={String(brandSettings['quotes.brandWebsite'] || 'orbitaevents.com')}
        initialBrandEmail={String(brandSettings['quotes.brandEmail'] || '')}
        initialBrandPhone={String(brandSettings['quotes.brandPhone'] || '')}
        initialBrandTagline={String(brandSettings['quotes.brandTagline'] || 'El teu esdeveniment. El teu estil. La teva nit perfecta.')}
        initialBrandLogoDataUrl={String(brandSettings['quotes.logoDataUrl'] || '')}
      />
    </AdminPage>
  );
}
