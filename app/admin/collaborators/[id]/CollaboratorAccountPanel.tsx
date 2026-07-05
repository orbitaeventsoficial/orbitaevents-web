import Link from 'next/link';
import { AdminSection } from '../../components/AdminPage';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { formatCurrency, formatDate } from '@/lib/constants';
import type { CollaboratorAccount } from '@/lib/services/collaboratorAccountService';
import CashPaymentButton from '../../bookings/[id]/CashPaymentButton';

/**
 * Compte corrent d'un col·laborador mutu (cas Masquerade/Carlos Lucas): «li dec»
 * (la seva pasta) vs «em deu» (bolos que ell contracta, facturats a ell) i el SALDO
 * net. Presentacional pur: el càlcul viu al cervell `collaboratorAccountService`.
 */
export default function CollaboratorAccountPanel({ account }: { account: CollaboratorAccount | null }) {
  if (!account) return null;
  const { iOwe, owesMe, balance } = account;
  const hasActivity = owesMe.bookings.length > 0 || iOwe.pending > 0 || iOwe.upcoming > 0 || iOwe.paid > 0;
  if (!hasActivity) return null;

  // Saldo net: > 0 → el soci em deu; < 0 → jo li dec; 0 → en paus.
  const balanceLabel = balance > 0
    ? `${account.collaboratorName} et deu ${formatCurrency(balance)}`
    : balance < 0
      ? `Li deus ${formatCurrency(Math.abs(balance))}`
      : 'En paus: ningú deu res';
  const balanceTone = balance > 0
    ? 'admin-tone-border-success'
    : balance < 0
      ? 'admin-tone-border-warning'
      : '';
  const balanceTextTone = balance > 0
    ? 'admin-tone-text-success'
    : balance < 0
      ? 'admin-tone-text-warning'
      : 'text-[var(--t2)]';

  return (
    <AdminSection
      title="Compte corrent"
      description="Col·laborador mutu: el que li deus (la seva pasta) i el que et deu (bolos que ell et contracta). El saldo és l'únic que canvia de mans."
    >
      {/* Saldo net destacat */}
      <div className={`ap-card p-4 flex flex-wrap items-center justify-between gap-3 border-l-[3px] ${balanceTone}`}>
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--t3)]">Saldo net</span>
        <span className={`font-[family-name:var(--display)] text-xl font-bold ${balanceTextTone}`}>{balanceLabel}</span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {/* EM DEU — bolos que ell contracta */}
        <section className="ap-card ap-card-body">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--t)]">Em deu</h3>
            <span className="admin-tone-text-success font-mono text-lg font-bold tabular-nums">{formatCurrency(owesMe.outstanding)}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--t3)]">Bolos que t&apos;ha contractat · {formatCurrency(owesMe.billedTotal)} facturats</p>
          {owesMe.bookings.length > 0 ? (
            <div className="mt-2.5 flex flex-col gap-1.5">
              {owesMe.bookings.map((b) => (
                <div key={b.bookingId} className="ap-card p-2 flex items-center justify-between gap-2">
                  <Link href={buildBookingHref(b.bookingId)} className="min-w-0 flex-1 no-underline">
                    <span className="block truncate text-sm text-[var(--t)]">{b.reference}</span>
                    <span className="block truncate text-xs text-[var(--t3)]">{b.eventDate ? formatDate(b.eventDate) : 'Sense data'}</span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2.5">
                    {!b.paid && <CashPaymentButton bookingId={b.bookingId} total={b.total} fullyPaid={b.paid} />}
                    <span className={`font-mono text-sm tabular-nums ${b.paid ? 'admin-tone-text-success' : 'admin-tone-text-warning'}`}>
                      {b.paid ? 'Pagat' : formatCurrency(b.outstanding)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-[var(--t3)]">Cap bolo facturat a aquest soci encara.</p>
          )}
        </section>

        {/* LI DEC — la seva pasta */}
        <section className="ap-card ap-card-body">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--t)]">Li dec</h3>
            <span className="admin-tone-text-warning font-mono text-lg font-bold tabular-nums">{formatCurrency(iOwe.pending)}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--t3)]">La seva pasta entregada i pendent de pagar</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="ap-kpi">
              <span className="ap-kpi-label">Previst (futur)</span>
              <span className="ap-kpi-value">{formatCurrency(iOwe.upcoming)}</span>
            </div>
            <div className="ap-kpi ap-kpi--success">
              <span className="ap-kpi-label">Pagat (històric)</span>
              <span className="ap-kpi-value">{formatCurrency(iOwe.paid)}</span>
            </div>
          </div>
          <Link href="#pasta" className="mt-2 inline-flex text-xs font-bold text-[var(--t3)] underline decoration-dotted">Detall de la pasta a sota ↓</Link>
        </section>
      </div>
    </AdminSection>
  );
}
