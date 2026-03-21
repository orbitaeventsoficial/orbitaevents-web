'use client';

import { CONTRACT_STATUS_CONFIG, INVOICE_STATUS_LABELS, PROPOSAL_STATUS_CONFIG } from '@/lib/constants';
interface ProposalDoc {
  id: string;
  reference: string;
  status: string;
  pdfUrl: string | null;
  contractStatus: string | null;
  contractReference: string | null;
  contractPdfUrl: string | null;
  contractSignedAt: string | null;
}

interface InvoiceDoc {
  id: string;
  reference: string;
  status: string;
  holdedInvoiceUrl: string | null;
}

const STEP_STYLES = {
  done: { card: 'ap-card ap-card--success', dot: 'admin-tone-bg-success', label: 'admin-tone-text-success', badge: 'ap-badge ap-badge--success' },
  active: { card: 'ap-card ap-card--info', dot: 'admin-tone-bg-info', label: 'admin-tone-text-info', badge: 'ap-badge ap-badge--info' },
  pending: { card: 'ap-card', dot: 'admin-tone-bg-neutral', label: 'admin-tone-text-neutral', badge: 'ap-badge' },
} as const;

function getStepStyle(done: boolean, active: boolean) {
  if (done) return STEP_STYLES.done;
  if (active) return STEP_STYLES.active;
  return STEP_STYLES.pending;
}

function proposalStatusLabel(status: string) {
  return PROPOSAL_STATUS_CONFIG[status]?.label || status;
}

function contractStatusLabel(status: string | null) {
  if (!status) return 'Pendent';
  return CONTRACT_STATUS_CONFIG[status]?.label || status;
}

function invoiceStatusLabel(status: string) {
  return INVOICE_STATUS_LABELS[status] || status;
}

export default function DocumentFlowSection({ proposals, invoices }: { proposals: ProposalDoc[]; invoices: InvoiceDoc[] }) {
  const activeProposal = proposals.find((p) => p.status === 'ACCEPTED' || p.status === 'SENT') || proposals[0];
  const activeInvoice = invoices.find((inv) => inv.status !== 'CANCELLED');

  const hasProposal = !!activeProposal;
  const proposalAccepted = activeProposal?.status === 'ACCEPTED';
  const hasContract = !!activeProposal?.contractStatus;
  const contractSigned = activeProposal?.contractStatus === 'SIGNED';
  const hasInvoice = !!activeInvoice;
  const invoicePaid = activeInvoice?.status === 'PAID';

  if (!hasProposal && !hasInvoice) return null;

  const steps = [
    { label: 'Pressupost', icon: '📄', style: getStepStyle(proposalAccepted, hasProposal && !proposalAccepted), ref: activeProposal?.reference, status: activeProposal ? proposalStatusLabel(activeProposal.status) : null, link: activeProposal?.pdfUrl ? { href: activeProposal.pdfUrl, label: 'PDF' } : null, empty: !hasProposal ? 'Sense pressupost' : null },
    { label: 'Contracte', icon: '📝', style: getStepStyle(contractSigned, hasContract && !contractSigned), ref: activeProposal?.contractReference, status: hasContract ? contractStatusLabel(activeProposal?.contractStatus ?? null) : null, link: activeProposal?.contractPdfUrl ? { href: activeProposal.contractPdfUrl, label: 'PDF' } : null, empty: !hasContract ? (proposalAccepted ? 'Pendent de generar' : 'Requereix pressupost acceptat') : null },
    { label: 'Factura', icon: '🧾', style: getStepStyle(invoicePaid, hasInvoice && !invoicePaid), ref: activeInvoice?.reference, status: activeInvoice ? invoiceStatusLabel(activeInvoice.status) : null, link: activeInvoice?.holdedInvoiceUrl ? { href: activeInvoice.holdedInvoiceUrl, label: 'Holded' } : null, empty: !hasInvoice ? 'Sense factura' : null },
  ];

  const progressWidth = invoicePaid ? 'calc(100% - 3rem)' : hasInvoice ? 'calc(83% - 2.5rem)' : contractSigned ? 'calc(67% - 2rem)' : hasContract ? 'calc(50% - 1.5rem)' : proposalAccepted ? 'calc(33% - 1rem)' : hasProposal ? 'calc(16% - 0.5rem)' : '0%';

  return (
    <section className="ap-card rounded-2xl p-6">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold">Flux documental</h2>

      <div className="relative mb-6">
        <div className="absolute left-6 right-6 top-3 h-0.5 admin-tone-bg-neutral" />
        <div className="absolute left-6 top-3 h-0.5 transition-all duration-500 admin-tone-bg-info" style={{ width: progressWidth }} />
        <div className="flex justify-between">
          {steps.map((step, i) => (
            <div key={i} className="z-10 flex flex-col items-center">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-black text-xs ${step.style.dot}`}>
                {step.style === STEP_STYLES.done ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {steps.map((step, i) => (
          <div key={i} className={`${step.style.card} rounded-xl p-3.5 transition-all`}>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-sm">{step.icon}</span>
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${step.style.label}`}>{step.label}</p>
            </div>

            {step.ref && <p className="truncate font-mono text-sm font-semibold">{step.ref}</p>}
            {step.status && <span className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${step.style.badge}`}>{step.status}</span>}
            {step.empty && <p className="mt-1 text-xs admin-tone-text-slate">{step.empty}</p>}
            {step.link && <a href={step.link.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium transition-colors admin-tone-text-info">{step.link.label}</a>}
          </div>
        ))}
      </div>
    </section>
  );
}
