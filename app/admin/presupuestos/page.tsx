import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { prisma } from '@/lib/prisma';

const PresupuestoPdfStudio = dynamicImport(() => import('./PresupuestoPdfStudio'), {
  ssr: false,
  loading: () => (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 text-sm text-slate-300">
      Carregant editor de pressupostos...
    </section>
  ),
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Editor PDF de pressupostos | Orbita Admin',
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

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/settings" className="text-sm text-slate-300 hover:text-slate-100">
            ← Configuració
          </Link>
          {customer && (
            <Link
              href={`/admin/contactes/${customer.id}`}
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 transition-colors"
            >
              👤 Fitxa Client
            </Link>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">Editor avançat de pressupost PDF</h1>
        <p className="mt-1 text-sm text-slate-300">
          Personalitza client, pack, extres, descomptes i text per generar el PDF al moment.
        </p>
        {customer && (
          <p className="mt-2 text-xs text-cyan-200">
            Guardant a fitxa: <Link href={`/admin/contactes/${customer.id}`} className="hover:underline"><strong>{customer.name}</strong></Link> ({customer.email})
          </p>
        )}
      </header>

      <PresupuestoPdfStudio
        initialCustomerId={customer?.id || ''}
        initialCustomerName={customer?.name || ''}
        initialCustomerEmail={customer?.email || ''}
        initialLeadId={leadId}
        initialProposalId={proposalId}
        initialPreferredLocale={customer?.preferredLocale || 'ca'}
        initialBrandName={String(brandSettings['quotes.brandName'] || 'Orbita Events')}
        initialBrandWebsite={String(brandSettings['quotes.brandWebsite'] || 'orbitaevents.com')}
        initialBrandEmail={String(brandSettings['quotes.brandEmail'] || '')}
        initialBrandPhone={String(brandSettings['quotes.brandPhone'] || '')}
        initialBrandTagline={String(brandSettings['quotes.brandTagline'] || 'Tu evento. Tu estilo. Tu noche perfecta.')}
        initialBrandLogoDataUrl={String(brandSettings['quotes.logoDataUrl'] || '')}
      />
    </div>
  );
}
