import type { ReactNode } from 'react';

type PublicPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  align?: 'center' | 'left';
  spacing?: 'default' | 'compact' | 'none';
};

export default function PublicPageHeader({
  title,
  description,
  eyebrow,
  align = 'center',
  spacing = 'default',
}: PublicPageHeaderProps) {
  const alignment = align === 'left' ? 'items-start text-left' : 'items-center text-center mx-auto';
  const descriptionAlignment = align === 'left' ? '' : 'mx-auto';
  const spacingClass = {
    default: 'mb-12',
    compact: 'mb-6',
    none: 'mb-0',
  }[spacing];

  return (
    <header className={`${spacingClass} flex max-w-3xl flex-col ${alignment}`}>
      {eyebrow && (
        <p className="mb-4 inline-flex items-center rounded-full border border-[color-mix(in_oklab,var(--oe-gold)_32%,transparent)] bg-[color-mix(in_oklab,var(--oe-gold)_10%,transparent)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[var(--oe-gold)]">
          {eyebrow}
        </p>
      )}
      <h1 className="mb-4 text-4xl font-black leading-tight text-[var(--text-primary)] md:text-5xl">
        {title}
      </h1>
      {description && (
        <p className={`max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] ${descriptionAlignment}`}>
          {description}
        </p>
      )}
    </header>
  );
}
