import Link from 'next/link';
import { formatCurrency, formatDateTimeFull } from '@/lib/constants';

export type CommercialDocumentHistoryItem = {
  id: string;
  kindLabel: string;
  title: string;
  reference?: string | null;
  statusLabel?: string | null;
  amount?: number | null;
  createdAt: string | Date;
  sentAt?: string | Date | null;
  href?: string | null;
  targetBlank?: boolean;
};

export default function CommercialDocumentsHistory({
  title = 'Històric comercial',
  subtitle = 'Pressupostos, dossiers, contractes, factures i documents vinculats.',
  items,
  emptyText = 'Encara no hi ha documents comercials.',
  className = '',
}: {
  title?: string;
  subtitle?: string;
  items: CommercialDocumentHistoryItem[];
  emptyText?: string;
  className?: string;
}) {
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <section className={`cdh ${className}`.trim()} aria-label={title}>
      <div className="cdh__head">
        <div>
          <h2 className="cdh__title">{title}</h2>
          {subtitle && <p className="cdh__subtitle">{subtitle}</p>}
        </div>
        <span className="cdh__count">{sortedItems.length}</span>
      </div>

      {sortedItems.length === 0 ? (
        <p className="cdh__empty">{emptyText}</p>
      ) : (
        <div className="cdh__list">
          {sortedItems.map((item) => {
            const meta = [
              formatDateTimeFull(item.createdAt),
              item.sentAt ? `enviat ${formatDateTimeFull(item.sentAt)}` : null,
            ].filter(Boolean);
            const body = (
              <>
                <span className="cdh__kind">{item.kindLabel}</span>
                <span className="cdh__main">
                  <strong>{item.reference || item.title}</strong>
                  {item.reference && <span>{item.title}</span>}
                </span>
                <span className="cdh__side">
                  {item.amount !== null && item.amount !== undefined && (
                    <strong>{formatCurrency(item.amount)}</strong>
                  )}
                  {item.statusLabel && <em>{item.statusLabel}</em>}
                </span>
                <span className="cdh__meta">{meta.join(' · ')}</span>
              </>
            );

            if (!item.href) {
              return (
                <article key={item.id} className="cdh__item">
                  {body}
                </article>
              );
            }

            if (item.targetBlank) {
              return (
                <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className="cdh__item cdh__item--link">
                  {body}
                </a>
              );
            }

            return (
              <Link key={item.id} href={item.href} className="cdh__item cdh__item--link">
                {body}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
