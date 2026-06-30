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
      <div className="ap-dochist-head">
        <div>
          <h2 className="ap-dochist-title">{title}</h2>
          {subtitle && <p className="ap-dochist-subtitle">{subtitle}</p>}
        </div>
        <span className="ap-dochist-count">{sortedItems.length}</span>
      </div>

      {sortedItems.length === 0 ? (
        <p className="ap-dochist-empty">{emptyText}</p>
      ) : (
        <div className="ap-dochist-list">
          {sortedItems.map((item) => {
            const meta = [
              formatDateTimeFull(item.createdAt),
              item.sentAt ? `enviat ${formatDateTimeFull(item.sentAt)}` : null,
            ].filter(Boolean);
            const body = (
              <>
                <span className="ap-dochist-kind">{item.kindLabel}</span>
                <span className="ap-dochist-main">
                  <strong>{item.reference || item.title}</strong>
                  {item.reference && <span>{item.title}</span>}
                </span>
                <span className="ap-dochist-side">
                  {item.amount !== null && item.amount !== undefined && (
                    <strong>{formatCurrency(item.amount)}</strong>
                  )}
                  {item.statusLabel && <em>{item.statusLabel}</em>}
                </span>
                <span className="ap-dochist-meta">{meta.join(' · ')}</span>
              </>
            );

            if (!item.href) {
              return (
                <article key={item.id} className="ap-dochist-item">
                  {body}
                </article>
              );
            }

            if (item.targetBlank) {
              return (
                <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className="ap-dochist-item ap-dochist-item--link">
                  {body}
                </a>
              );
            }

            return (
              <Link key={item.id} href={item.href} className="ap-dochist-item ap-dochist-item--link">
                {body}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
