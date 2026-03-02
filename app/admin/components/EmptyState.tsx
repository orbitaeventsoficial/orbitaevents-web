/**
 * Reusable empty state component for lists and tables.
 * Usage: <EmptyState icon="📋" title="Sense reserves" action={{ label: "Crear reserva", href: "/admin/bookings/new" }} />
 */
import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-12 px-6 text-center">
      <span className="text-3xl mb-3" role="img" aria-hidden="true">{icon}</span>
      <p className="text-sm font-medium text-white/60">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-white/40 max-w-xs">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600/20 px-4 py-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-600/30"
        >
          + {action.label}
        </Link>
      )}
    </div>
  );
}
