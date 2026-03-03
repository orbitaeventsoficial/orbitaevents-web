import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { prisma } from '@/lib/prisma';
import { AdminPage } from '../components/AdminPage';

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
  title: 'Editor PDF de pressupostos | Òrbita Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams?: { customerId?: string; leadId?: string; proposalId?: string };
}) {
  const customerId = searchParams?.customerId || '';
  const leadId = searchParams?.leadId || '';
  const proposalId = searchParams?.proposalId || '';
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

  const createdQuotes = await prisma.leadDocument.findMany({
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
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const createdProposals = await prisma.proposal.findMany({
    where: leadId ? { leadId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      reference: true,
      status: true,
      total: true,
      createdAt: true,
      customerId: true,
      leadId: true,
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <AdminPage
      title="Pressupostos"
      subtitle={<>Personalitza client, pack, extres, descomptes i text per generar el PDF al moment.
        {customer && (
          <span className="block mt-2 text-xs">
            Guardant a fitxa: <Link href={`/admin/clientes/${customer.id}`} className="hover:underline"><strong>{customer.name}</strong></Link> ({customer.email})
          </span>
        )}
      </>}
      back={{ href: '/admin/settings', label: 'Configuració' }}
      actions={customer ? <Link href={`/admin/clientes/${customer.id}`} className="ap-btn ap-btn--secondary">👤 Fitxa Client</Link> : undefined}
    >
      <section className="mb-6 rounded-2xl border p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Pressupostos creats</h2>
          {leadId ? (
            <Link href="/admin/presupuestos" className="text-xs hover:underline">
              Veure tots
            </Link>
          ) : null}
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">Des de leads (LeadDocument QUOTE)</p>
            {createdQuotes.length === 0 ? (
              <p className="text-sm opacity-80">No n'hi ha.</p>
            ) : (
              <div className="space-y-2">
                {createdQuotes.map((quote) => (
                  <div key={quote.id} className="rounded-xl border p-3">
                    <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer" className="block hover:underline">
                      <p className="text-sm font-semibold">{quote.title}</p>
                    </a>
                    <p className="mt-1 text-xs opacity-80">
                      {quote.lead?.name || 'Lead'} ({quote.lead?.email || 'sense email'}) · {new Date(quote.createdAt).toLocaleString('ca-ES')} · ID lead: {quote.leadId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">Des de PDF Studio (Proposals)</p>
            {createdProposals.length === 0 ? (
              <p className="text-sm opacity-80">No n'hi ha.</p>
            ) : (
              <div className="space-y-2">
                {createdProposals.map((proposal) => (
                  <div key={proposal.id} className="rounded-xl border p-3">
                    <Link
                      href={`/admin/presupuestos?proposalId=${proposal.id}&customerId=${proposal.customerId}`}
                      className="block hover:underline"
                    >
                      <p className="text-sm font-semibold">{proposal.reference} · {proposal.total.toFixed(2)}€</p>
                    </Link>
                    <p className="mt-1 text-xs opacity-80">
                      {proposal.customer?.name || 'Client'} ({proposal.customer?.email || 'sense email'}) · {proposal.status} · {new Date(proposal.createdAt).toLocaleString('ca-ES')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

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
