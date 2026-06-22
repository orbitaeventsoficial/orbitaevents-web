import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDateTime, getProposalStatusDisplay } from '@/lib/constants';
import { buildCustomerProposalHref } from '@/lib/admin/customerWorkspaceHref';
import ProposalOwnerPanel from '../ProposalOwnerPanel';
import '../presupuestos.css';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    select: { reference: true },
  });
  return {
    title: proposal ? `${proposal.reference} | Pressupost` : 'Pressupost no trobat',
  };
}

export default async function ProposalDetailPage({ params }: Props) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, name: true, email: true } },
      booking: { select: { id: true, reference: true, status: true } },
    },
  });

  if (!proposal) notFound();

  const statusDisplay = getProposalStatusDisplay(proposal.status);

  const editorHref = proposal.customerId
    ? buildCustomerProposalHref(proposal.customerId, proposal.id)
    : null;

  return (
    <main className="pr__page">
        <header className="pr__hero">
          <div>
            <Link
              href="/admin/presupuestos"
              className="ap-back"
            >
              ← Tots els pressupostos
            </Link>
            <p className="pr__eyebrow">Comercial · Detall de proposta</p>
            <h1 className="pr__title">{proposal.reference}</h1>
            <div className="pr__statusLine">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusDisplay.bg} ${statusDisplay.text} ${statusDisplay.border}`}
              >
                {statusDisplay.label}
              </span>
              <span className="pr__amount">{formatCurrency(proposal.total)}</span>
              <span className="pr__muted text-xs">Creat {formatDateTime(proposal.createdAt)}</span>
            </div>
          </div>
          <div className="pr__heroActions">
            {editorHref ? (
              <Link
                href={editorHref}
                className="ap-btn ap-btn--primary"
              >
                Obrir editor
              </Link>
            ) : (
              <span className="pr__muted text-xs italic">
                Vincula un client per editar el pressupost
              </span>
            )}
          </div>
        </header>

        <section className="pr__detailGrid">
        <ProposalOwnerPanel
          proposalId={proposal.id}
          initial={{
            customerId: proposal.customerId,
            customer: proposal.customer
              ? {
                  id: proposal.customer.id,
                  name: proposal.customer.name,
                  email: proposal.customer.email,
                }
              : null,
            leadId: proposal.leadId,
            lead: proposal.lead
              ? { id: proposal.lead.id, name: proposal.lead.name, email: proposal.lead.email }
              : null,
            bookingId: proposal.bookingId,
            booking: proposal.booking
              ? {
                  id: proposal.booking.id,
                  reference: proposal.booking.reference,
                  status: proposal.booking.status,
                }
              : null,
          }}
        />
        </section>
    </main>
  );
}
