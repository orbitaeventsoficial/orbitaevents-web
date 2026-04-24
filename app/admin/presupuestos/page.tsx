import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { prisma } from '@/lib/prisma';
import { AdminPage } from '../components/AdminPage';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { formatCurrency } from '@/lib/constants';
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

    const nextStep = acceptedWithoutBooking > 0
      ? {
          eyebrow: 'Següent pas · Conversió',
          title: 'Convertir acceptades en reserves',
          detail: `${acceptedWithoutBooking} ${acceptedWithoutBooking === 1 ? 'proposta acceptada no té reserva' : 'propostes acceptades no tenen reserva'} vinculada. Tanca el cercle creant la reserva des de la fitxa.`,
          href: '/admin/presupuestos?statusFilter=ACCEPTED',
          ctaLabel: 'Veure acceptades',
          secondaryAction: { href: '/admin/bookings', label: 'Obrir reserves' },
        }
      : sentStale > 0
      ? {
          eyebrow: 'Següent pas · Follow-up',
          title: 'Recuperar propostes enviades fredes',
          detail: `${sentStale} ${sentStale === 1 ? 'proposta enviada ha passat' : 'propostes enviades han passat'} ${SENT_STALE_DAYS}+ dies sense resposta. Reactiva-les amb un seguiment o tanca-les.`,
          href: '/admin/presupuestos?statusFilter=SENT',
          ctaLabel: 'Revisar enviades',
          secondaryAction: { href: '/admin/inbox/compose', label: 'Redactar seguiment' },
        }
      : draftStale > 0
      ? {
          eyebrow: 'Següent pas · Netejar',
          title: 'Tancar esborranys oberts',
          detail: `${draftStale} ${draftStale === 1 ? 'esborrany porta' : 'esborranys porten'} ${DRAFT_STALE_DAYS}+ dies sense enviar. Completa'ls, envia'ls o esborra'ls per no deixar cua fantasma.`,
          href: '/admin/presupuestos?statusFilter=DRAFT',
          ctaLabel: 'Revisar esborranys',
        }
      : counts.total === 0
      ? {
          eyebrow: 'Següent pas',
          title: 'Crear el primer pressupost',
          detail: 'Encara no hi ha propostes al catàleg comercial recent. Obre un pressupost nou per començar la traça.',
          href: '/admin/presupuestos?customerId=new',
          ctaLabel: 'Nou pressupost',
        }
      : {
          eyebrow: 'Següent pas',
          title: 'Catàleg comercial al dia',
          detail: 'Sense bloquejos visibles a les propostes recents. Aprofita per preparar noves ofertes o revisar plantilles del PDF.',
          href: '/admin/presupuestos?customerId=new',
          ctaLabel: 'Nou pressupost',
          secondaryAction: { href: '/admin/settings/quotes', label: 'Plantilles PDF' },
        };

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
        <OwnerControlStrip
          className="mb-6"
          system={{
            eyebrow: 'Automàtic · Catàleg comercial',
            title: counts.total === 0
              ? 'Sense propostes recents'
              : `${counts.total} propostes recents`,
            tone: counts.accepted > 0 ? 'success' : counts.total > 0 ? 'info' : 'info',
            items: systemItems,
            emptyText: 'El catàleg encara no té propostes registrades.',
          }}
          manual={{
            eyebrow: 'Manual · Intervenció',
            title: manualItems.length === 0
              ? 'Cap coll visible'
              : `${manualItems.length} senyals per revisar`,
            tone: (acceptedWithoutBooking > 0 || sentStale > 0 || counts.expired > 0)
              ? 'warning'
              : manualItems.length > 0
              ? 'info'
              : 'success',
            items: manualItems,
            emptyText: 'Cap proposta requereix intervenció manual ara mateix.',
          }}
          nextStep={nextStep}
        />
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
