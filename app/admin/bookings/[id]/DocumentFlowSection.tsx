'use client';

import { getBookingDocumentFlowStepStyle, getContractStatusLabel, getDeliveryNoteStatusLabel, getInvoiceStatusLabel, getProposalStatusDisplay } from '@/lib/constants';
import { ADMIN_BOOKING_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { isSentLikeProposalStatus } from '@/lib/proposals/status';
interface ProposalDoc {
  id: string;
  reference: string;
  status: string;
  href: string;
  pdfUrl: string | null;
  contractStatus: string | null;
  contractReference: string | null;
  contractPdfUrl: string | null;
  contractSignedAt: string | null;
  contractSignedBy: string | null;
  contractSignatureIp: string | null;
  contractSignatureUa: string | null;
  contractSignatureBlob: string | null;
}

interface InvoiceDoc {
  id: string;
  reference: string;
  status: string;
  holdedInvoiceUrl: string | null;
  pdfUrl?: string | null;
}

interface DeliveryNoteDoc {
  id: string;
  reference: string;
  status: string;
  pdfUrl: string | null;
}

function formatSignedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

export default function DocumentFlowSection({ proposals, invoices, deliveryNotes }: { proposals: ProposalDoc[]; invoices: InvoiceDoc[]; deliveryNotes: DeliveryNoteDoc[] }) {
  const activeProposal = proposals.find((p) => p.status === 'ACCEPTED' || isSentLikeProposalStatus(p.status)) || proposals[0];
  const activeDeliveryNote = deliveryNotes.find((deliveryNote) => deliveryNote.status !== 'CANCELLED');
  const activeInvoice = invoices.find((inv) => inv.status !== 'CANCELLED');

  const hasProposal = !!activeProposal;
  const proposalAccepted = activeProposal?.status === 'ACCEPTED';
  const hasContract = !!activeProposal?.contractStatus;
  const contractSigned = activeProposal?.contractStatus === 'SIGNED';
  const hasDeliveryNote = !!activeDeliveryNote;
  const deliveryDone = activeDeliveryNote?.status === 'DELIVERED' || activeDeliveryNote?.status === 'SIGNED';
  const hasInvoice = !!activeInvoice;
  const invoicePaid = activeInvoice?.status === 'PAID';

  if (!hasProposal && !hasDeliveryNote && !hasInvoice) return null;

  const steps = [
    {
      label: 'Pressupost',
      icon: '📄',
      done: proposalAccepted,
      style: getBookingDocumentFlowStepStyle(proposalAccepted, hasProposal && !proposalAccepted),
      ref: activeProposal?.reference,
      status: activeProposal ? getProposalStatusDisplay(activeProposal.status).label : null,
      link: activeProposal ? { href: activeProposal.pdfUrl || activeProposal.href, label: activeProposal.pdfUrl ? 'PDF' : 'Obrir', targetBlank: Boolean(activeProposal.pdfUrl) } : null,
      empty: !hasProposal ? 'Sense pressupost' : null,
    },
    {
      label: 'Contracte',
      icon: '📝',
      done: contractSigned,
      style: getBookingDocumentFlowStepStyle(contractSigned, hasContract && !contractSigned),
      ref: activeProposal?.contractReference,
      status: hasContract ? getContractStatusLabel(activeProposal?.contractStatus ?? null) : null,
      link: activeProposal && hasContract ? { href: activeProposal.contractPdfUrl || activeProposal.href, label: activeProposal.contractPdfUrl ? 'PDF' : 'Gestionar', targetBlank: Boolean(activeProposal.contractPdfUrl) } : null,
      empty: !hasContract ? (proposalAccepted ? 'Pendent de generar' : 'Requereix pressupost acceptat') : null,
    },
    {
      label: 'Albarà',
      icon: '📋',
      done: deliveryDone,
      style: getBookingDocumentFlowStepStyle(deliveryDone, hasDeliveryNote && !deliveryDone),
      ref: activeDeliveryNote?.reference,
      status: activeDeliveryNote ? getDeliveryNoteStatusLabel(activeDeliveryNote.status) : null,
      link: activeDeliveryNote?.pdfUrl ? { href: activeDeliveryNote.pdfUrl, label: 'PDF', targetBlank: true } : null,
      empty: !hasDeliveryNote ? 'Pendent d’execució' : null,
    },
    {
      label: 'Factura',
      icon: '🧾',
      done: invoicePaid,
      style: getBookingDocumentFlowStepStyle(invoicePaid, hasInvoice && !invoicePaid),
      ref: activeInvoice?.reference,
      status: activeInvoice ? getInvoiceStatusLabel(activeInvoice.status) : null,
      link: activeInvoice?.pdfUrl
        ? { href: activeInvoice.pdfUrl, label: 'PDF', targetBlank: true }
        : activeInvoice?.holdedInvoiceUrl
          ? { href: activeInvoice.holdedInvoiceUrl, label: 'Holded', targetBlank: true }
          : null,
      empty: !hasInvoice ? 'Sense factura' : null,
    },
  ];

  const progressIndex = invoicePaid ? 3 : hasInvoice ? 3 : deliveryDone ? 2 : hasDeliveryNote ? 2 : contractSigned ? 1 : hasContract ? 1 : proposalAccepted ? 0 : hasProposal ? 0 : 0;
  const progressWidth = `${Math.round((progressIndex / Math.max(1, steps.length - 1)) * 100)}%`;
  const contractSignedAt = formatSignedAt(activeProposal?.contractSignedAt ?? null);

  return (
    <section className="ap-card rounded-2xl p-6" {...helpAttrs(ADMIN_BOOKING_HELP_2.documentFlow.root)}>
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold">Flux documental</h2>

      <div className="relative mb-6">
        <div className="absolute left-6 right-6 top-3 h-0.5 admin-tone-bg-neutral" />
        <div className="absolute left-6 top-3 h-0.5 transition-all duration-500 admin-tone-bg-info" style={{ width: progressWidth }} />
        <div className="flex justify-between">
          {steps.map((step, i) => (
            <div key={i} className="z-10 flex flex-col items-center">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-black text-xs ${step.style.dot}`}>
                {step.done ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" {...helpAttrs(ADMIN_BOOKING_HELP_2.documentFlow.steps)}>
        {steps.map((step, i) => (
          <div key={i} className={`${step.style.card} rounded-xl p-3.5 transition-all`}>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-sm">{step.icon}</span>
              <p className={`text-xs font-semibold uppercase tracking-wider ${step.style.label}`}>{step.label}</p>
            </div>

            {step.ref && <p className="truncate font-mono text-sm font-semibold">{step.ref}</p>}
            {step.status && <span className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${step.style.badge}`}>{step.status}</span>}
            {step.empty && <p className="mt-1 text-xs admin-tone-text-slate">{step.empty}</p>}
            {step.link && (
              <a
                href={step.link.href}
                target={step.link.targetBlank ? '_blank' : undefined}
                rel={step.link.targetBlank ? 'noopener noreferrer' : undefined}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors admin-tone-text-info"
              >
                {step.link.label}
              </a>
            )}
            {i === 1 && contractSigned && (
              <div className="mt-3 space-y-1 rounded-lg border admin-tone-border-success admin-tone-bg-success p-2 text-xs leading-snug admin-tone-text-success">
                {activeProposal?.contractSignedBy && <p>Signat per {activeProposal.contractSignedBy}</p>}
                {contractSignedAt && <p>{contractSignedAt}</p>}
                {activeProposal?.contractSignatureIp && <p>IP {activeProposal.contractSignatureIp}</p>}
                {activeProposal?.contractSignatureUa && <p className="break-words">UA {activeProposal.contractSignatureUa}</p>}
                {activeProposal?.contractSignatureBlob && (
                  // eslint-disable-next-line @next/next/no-img-element -- data:image URL de signatura manuscrita; next/image no suporta data URIs sense remote patterns
                  <img
                    src={activeProposal.contractSignatureBlob}
                    alt="Signatura manuscrita capturada"
                    className="mt-2 max-h-16 rounded border admin-tone-border-success bg-[var(--sunk)] object-contain"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
