import type { ReactNode } from 'react';

type OwnerTone = 'info' | 'warning' | 'success';

type OwnerCard = {
  eyebrow: string;
  title: string;
  tone: OwnerTone;
  items: string[];
  emptyText: string;
};

type OwnerNextStep = {
  eyebrow?: string;
  title: string;
  detail: string;
  href: string;
  ctaLabel?: string;
  external?: boolean;
  secondaryAction?: {
    href: string;
    label: string;
    external?: boolean;
  };
};

export function OwnerControlStrip({
  system,
  manual,
  nextStep,
  className = '',
}: {
  system: OwnerCard;
  manual: OwnerCard;
  nextStep: OwnerNextStep;
  className?: string;
}) {
  return (
    <section className={`grid gap-3 lg:grid-cols-[1.1fr_1.1fr_1.3fr] ${className}`}>
      <OwnerSignalCard {...system} />
      <OwnerSignalCard {...manual} />
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
          {nextStep.eyebrow || 'Següent pas'}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">{nextStep.title}</h2>
        <p className="mt-2 text-sm text-cyan-50/80">{nextStep.detail}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={nextStep.href}
            target={nextStep.external ? '_blank' : undefined}
            rel={nextStep.external ? 'noopener noreferrer' : undefined}
            className="inline-flex rounded-xl border border-cyan-400/40 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/20"
          >
            {nextStep.ctaLabel || 'Obrir ara'}
          </a>
          {nextStep.secondaryAction && (
            <a
              href={nextStep.secondaryAction.href}
              target={nextStep.secondaryAction.external ? '_blank' : undefined}
              rel={nextStep.secondaryAction.external ? 'noopener noreferrer' : undefined}
              className="inline-flex rounded-xl border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/5"
            >
              {nextStep.secondaryAction.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function OwnerSignalCard({
  eyebrow,
  title,
  tone,
  items,
  emptyText,
}: OwnerCard) {
  const toneStyles: Record<OwnerTone, string> = {
    info: 'border-sky-500/25 bg-sky-500/8',
    warning: 'border-amber-500/25 bg-amber-500/8',
    success: 'border-emerald-500/25 bg-emerald-500/8',
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneStyles[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{eyebrow}</p>
      <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.slice(0, 4).map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-white/85">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-white/60">{emptyText}</p>
      )}
    </div>
  );
}

export function OwnerControlSlot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
