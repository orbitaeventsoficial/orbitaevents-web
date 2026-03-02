'use client';

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

// ═══════════════════════════════════════════════════════════════════════════
// STATUS STYLES
// ═══════════════════════════════════════════════════════════════════════════

const STEP_STYLES = {
  done: {
    card: 'border-emerald-500/40 bg-emerald-500/10',
    dot: 'bg-emerald-500',
    label: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  active: {
    card: 'border-cyan-500/40 bg-cyan-500/10',
    dot: 'bg-cyan-500 animate-pulse',
    label: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  pending: {
    card: 'border-white/10 bg-white/[0.02]',
    dot: 'bg-white/20',
    label: 'text-white/40',
    badge: 'bg-white/5 text-white/40 border-white/10',
  },
} as const;

function getStepStyle(done: boolean, active: boolean) {
  if (done) return STEP_STYLES.done;
  if (active) return STEP_STYLES.active;
  return STEP_STYLES.pending;
}

function proposalStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Esborrany', SENT: 'Enviat', VIEWED: 'Visualitzat',
    ACCEPTED: 'Acceptat', REJECTED: 'Rebutjat', EXPIRED: 'Expirat',
  };
  return map[status] || status;
}

function contractStatusLabel(status: string | null) {
  if (!status) return 'Pendent';
  const map: Record<string, string> = {
    DRAFT: 'Esborrany', SENT: 'Enviat', SIGNED: 'Signat', CANCELLED: 'Cancel\u00B7lat',
  };
  return map[status] || status;
}

function invoiceStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Esborrany', PENDING_SYNC: 'Sincronitzant...',
    SYNCED: 'Sincronitzada', SYNC_ERROR: 'Error sync',
    PAID: 'Pagada', CANCELLED: 'Cancel\u00B7lada',
  };
  return map[status] || status;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DocumentFlowSection({
  proposals,
  invoices,
}: {
  proposals: ProposalDoc[];
  invoices: InvoiceDoc[];
}) {
  const activeProposal = proposals.find(
    (p) => p.status === 'ACCEPTED' || p.status === 'SENT'
  ) || proposals[0];

  const activeInvoice = invoices.find((inv) => inv.status !== 'CANCELLED');

  const hasProposal = !!activeProposal;
  const proposalAccepted = activeProposal?.status === 'ACCEPTED';
  const hasContract = !!activeProposal?.contractStatus;
  const contractSigned = activeProposal?.contractStatus === 'SIGNED';
  const hasInvoice = !!activeInvoice;
  const invoicePaid = activeInvoice?.status === 'PAID';

  if (!hasProposal && !hasInvoice) return null;

  const steps = [
    {
      label: 'Pressupost',
      icon: '📄',
      style: getStepStyle(proposalAccepted, hasProposal && !proposalAccepted),
      ref: activeProposal?.reference,
      status: activeProposal ? proposalStatusLabel(activeProposal.status) : null,
      link: activeProposal?.pdfUrl ? { href: activeProposal.pdfUrl, label: 'PDF' } : null,
      empty: !hasProposal ? 'Sense pressupost' : null,
    },
    {
      label: 'Contracte',
      icon: '📝',
      style: getStepStyle(contractSigned, hasContract && !contractSigned),
      ref: activeProposal?.contractReference,
      status: hasContract ? contractStatusLabel(activeProposal?.contractStatus ?? null) : null,
      link: activeProposal?.contractPdfUrl ? { href: activeProposal.contractPdfUrl, label: 'PDF' } : null,
      empty: !hasContract ? (proposalAccepted ? 'Pendent de generar' : 'Requereix pressupost acceptat') : null,
    },
    {
      label: 'Factura',
      icon: '🧾',
      style: getStepStyle(invoicePaid, hasInvoice && !invoicePaid),
      ref: activeInvoice?.reference,
      status: activeInvoice ? invoiceStatusLabel(activeInvoice.status) : null,
      link: activeInvoice?.holdedInvoiceUrl ? { href: activeInvoice.holdedInvoiceUrl, label: 'Holded' } : null,
      empty: !hasInvoice ? 'Sense factura' : null,
    },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
        Flux documental
      </h2>

      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="absolute top-3 left-6 right-6 h-0.5 bg-white/10" />
        <div
          className="absolute top-3 left-6 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
          style={{
            width: invoicePaid ? 'calc(100% - 3rem)' :
              hasInvoice ? 'calc(83% - 2.5rem)' :
              contractSigned ? 'calc(67% - 2rem)' :
              hasContract ? 'calc(50% - 1.5rem)' :
              proposalAccepted ? 'calc(33% - 1rem)' :
              hasProposal ? 'calc(16% - 0.5rem)' : '0%'
          }}
        />
        <div className="flex justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center z-10">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border-2 border-black ${step.style.dot}`}>
                {step.style === STEP_STYLES.done ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`rounded-xl border p-3.5 transition-all ${step.style.card}`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">{step.icon}</span>
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${step.style.label}`}>
                {step.label}
              </p>
            </div>

            {step.ref && (
              <p className="text-sm font-mono font-semibold truncate">{step.ref}</p>
            )}

            {step.status && (
              <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium mt-1.5 ${step.style.badge}`}>
                {step.status}
              </span>
            )}

            {step.empty && (
              <p className="text-xs text-white/40 mt-1">{step.empty}</p>
            )}

            {step.link && (
              <a
                href={step.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors mt-2"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {step.link.label}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
