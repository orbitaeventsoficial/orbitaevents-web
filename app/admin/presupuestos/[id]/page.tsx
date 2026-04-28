import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDateTime, getProposalStatusDisplay } from '@/lib/constants';
import { buildCustomerProposalHref } from '@/lib/admin/customerWorkspaceHref';
import ProposalOwnerPanel from '../ProposalOwnerPanel';

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
    <div className="ap-page">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/presupuestos"
              className="text-xs text-white/60 hover:text-white"
            >
              ← Tots els pressupostos
            </Link>
            <h1 className="text-2xl font-semibold mt-1">{proposal.reference}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusDisplay.bg} ${statusDisplay.text} ${statusDisplay.border}`}
              >
                {statusDisplay.label}
              </span>
              <span className="text-white/50">·</span>
              <span className="tabular-nums font-medium">{formatCurrency(proposal.total)}</span>
              <span className="text-white/50">·</span>
              <span className="text-white/60 text-xs">Creat {formatDateTime(proposal.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editorHref ? (
              <Link
                href={editorHref}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/90 text-zinc-900 font-semibold hover:bg-amber-400"
              >
                Obrir editor
              </Link>
            ) : (
              <span className="text-xs text-white/50 italic">
                Vincula un client per editar el pressupost
              </span>
            )}
          </div>
        </header>

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
      </div>
    </div>
  );
}
