'use client';

/**
 * Skip Links Component
 * Provides keyboard navigation shortcuts for screen reader users
 * and keyboard-only users to skip repetitive content.
 *
 * @accessibility WCAG 2.1 AA - 2.4.1 Bypass Blocks
 */

import { useTranslations } from 'next-intl';

interface SkipLink {
  href: string;
  label: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Saltar al contingut principal' },
  { href: '#main-nav', label: 'Saltar a la navegació' },
  { href: '#footer', label: 'Saltar al peu de pàgina' },
];

interface SkipLinksProps {
  links?: SkipLink[];
}

export function SkipLinks({ links = defaultLinks }: SkipLinksProps) {
  return (
    <div className="skip-links">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="
            sr-only focus:not-sr-only
            focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
            focus:px-4 focus:py-2
            focus:bg-amber-500 focus:text-black
            focus:font-semibold focus:rounded-lg
            focus:shadow-lg focus:outline-none
            focus:ring-2 focus:ring-amber-300
            transition-all
          "
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

/**
 * Focus Trap Component
 * Traps focus within a container (useful for modals, dropdowns)
 *
 * @accessibility WCAG 2.1 AA - 2.1.2 No Keyboard Trap
 */
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
}

export function FocusTrap({ children, active = true }: FocusTrapProps) {
  if (!active) return <>{children}</>;

  return (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          // Parent should handle escape
        }

        if (e.key === 'Tab') {
          const focusableElements = e.currentTarget.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }}
    >
      {children}
    </div>
  );
}

/**
 * Live Region Component
 * Announces dynamic content changes to screen readers
 *
 * @accessibility WCAG 2.1 AA - 4.1.3 Status Messages
 */
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

/**
 * Visually Hidden Component
 * Hides content visually but keeps it accessible to screen readers
 */
interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}
