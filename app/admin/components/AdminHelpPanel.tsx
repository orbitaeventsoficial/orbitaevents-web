import type { ReactNode } from 'react';
import { AdminHelpLegend } from './AdminHelpLegend';

type HelpItem = {
  title: string;
  body: string;
};

interface AdminHelpPanelProps {
  title?: ReactNode;
  description?: ReactNode;
  items: HelpItem[];
  className?: string;
}

export function AdminHelpPanel({
  title = 'Guia ràpida',
  description,
  items,
  className = '',
}: AdminHelpPanelProps) {
  if (items.length === 0) return null;

  return (
    <section className={`space-y-3 rounded-2xl border p-4 admin-card-glass ${className}`}>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? <p className="text-sm text-white/65">{description}</p> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <AdminHelpLegend key={`${item.title}-${item.body}`} title={item.title} body={item.body} />
        ))}
      </div>
    </section>
  );
}
