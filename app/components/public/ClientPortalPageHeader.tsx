import Link from 'next/link';
import type { ReactNode } from 'react';

type ClientPortalPageHeaderProps = {
  backHref?: string;
  backLabel?: ReactNode;
  eyebrow: ReactNode;
  title: ReactNode;
  reference?: ReactNode;
  accentColor: string;
  frameBorderColor?: string;
  framed?: boolean;
};

export default function ClientPortalPageHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  reference,
  accentColor,
  frameBorderColor,
  framed = false,
}: ClientPortalPageHeaderProps) {
  const content = (
    <>
      {backHref && backLabel && (
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
        >
          <span aria-hidden="true">←</span>
          <span>{backLabel}</span>
        </Link>
      )}
      <p className="mb-1 text-xs uppercase tracking-widest" style={{ color: accentColor }}>
        {eyebrow}
      </p>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {reference && <p className="mt-1 text-sm text-white/40">{reference}</p>}
    </>
  );

  if (framed) {
    return (
      <header className="rounded-2xl border bg-white/[0.03] p-6 shadow-xl" style={{ borderColor: frameBorderColor || accentColor }}>
        {content}
      </header>
    );
  }

  return <header className="mb-6">{content}</header>;
}
