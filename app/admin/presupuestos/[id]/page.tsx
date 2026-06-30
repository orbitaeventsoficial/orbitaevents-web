import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDateTime, getProposalStatusDisplay } from '@/lib/constants';
import { buildCustomerProposalHref } from '@/lib/admin/customerWorkspaceHref';
import ProposalOwnerPanel from '../ProposalOwnerPanel';
import { AdminPage } from '../../components/AdminPage';

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
    <AdminPage
      back={{ href: '/admin/presupuestos', label: 'Tots els pressupostos' }}
      eyebrow="Comercial · Detall de proposta"
      title={proposal.reference}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusDisplay.bg} ${statusDisplay.text} ${statusDisplay.border}`}
          >
            {statusDisplay.label}
          </span>
          <span className="[font-family:var(--display)] font-bold tabular-nums text-[var(--t)]">{formatCurrency(proposal.total)}</span>
          <span className="text-xs text-[var(--t3)]">Creat {formatDateTime(proposal.createdAt)}</span>
        </span>
      }
      actions={
        editorHref ? (
          <Link
            href={editorHref}
            className="ap-btn ap-btn--primary"
          >
            Obrir editor
          </Link>
        ) : (
          <span className="text-xs italic text-[var(--t3)]">
            Vincula un client per editar el pressupost
          </span>
        )
      }
    >
        <section className="grid gap-4">
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
    </AdminPage>
  );
}
