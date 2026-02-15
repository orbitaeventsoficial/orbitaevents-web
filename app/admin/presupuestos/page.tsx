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
  title: 'Editor PDF Presupuestos | Orbita Admin',
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
        select: { id: true, name: true, email: true },
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
        <Link href="/admin/settings" className="text-sm text-slate-300 hover:text-slate-100">
          ← Volver a configuración
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">Editor avanzado de presupuesto PDF</h1>
        <p className="mt-1 text-sm text-slate-300">
          Personaliza cliente, pack, extras, descuentos y texto para generar el PDF al momento.
        </p>
        {customer && (
          <p className="mt-2 text-xs text-cyan-200">
            Guardant a fitxa: <strong>{customer.name}</strong> ({customer.email})
          </p>
        )}
      </header>

      <PresupuestoPdfStudio
        initialCustomerId={customer?.id || ''}
        initialCustomerName={customer?.name || ''}
        initialCustomerEmail={customer?.email || ''}
        initialLeadId={leadId}
        initialProposalId={proposalId}
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
