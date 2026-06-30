'use client';

import { useState } from 'react';
import { formatNumber } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';

type Props = {
  bookingId: string;
  depositPaid: boolean;
  depositPaymentUrl: string | null;
  depositBizumDeclaredAt: Date | null;
  remainingPaid: boolean;
  remainingPaymentUrl: string | null;
  remainingBizumDeclaredAt: Date | null;
  depositAmount: number;
  remainingAmount: number;
  stripeConfigured: boolean;
};

function PaymentRow({
  label,
  sublabel,
  amount,
  paid,
  url,
  loading,
  copiedKey,
  rowKey,
  onGenerate,
  onCopy,
  locked,
  stripeConfigured,
}: {
  label: string;
  sublabel: string;
  amount: string;
  paid: boolean;
  url: string | null;
  loading: boolean;
  copiedKey: string | null;
  rowKey: string;
  onGenerate: () => void;
  onCopy: (url: string) => void;
  locked: boolean;
  stripeConfigured: boolean;
}) {
  const stateClass = paid ? 'paid' : locked ? 'locked' : 'pending';
  const DOT_TONE: Record<string, string> = {
    paid: 'border-[var(--ax-success-border)] bg-[var(--ax-success-bg)]',
    pending: 'border-[var(--ax-warning-border)] bg-[var(--ax-warning-bg)]',
    locked: 'border-[var(--o-admin-line)] bg-[var(--ax-fill-1)]',
  };
  const PRICE_TONE: Record<string, string> = {
    paid: 'text-[var(--o-success)]',
    pending: 'text-[var(--t)]',
    locked: 'text-[var(--t)]',
  };
  const STATUS_TONE: Record<string, string> = {
    paid: 'text-[var(--o-success)]',
    pending: 'text-[var(--o-warning)]',
    locked: 'text-[var(--t3)]',
  };

  return (
    <div className="flex items-center gap-3 p-4">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${DOT_TONE[stateClass]}`}>
        {paid ? '✓' : locked ? '🔒' : '◌'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="m-0 text-sm font-semibold text-[var(--t)]">{label}</p>
        <p className="m-0 text-xs text-[var(--t3)]">{sublabel}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`m-0 text-sm font-bold tabular-nums ${PRICE_TONE[stateClass]}`}>
          {amount}
        </p>
        <p className={`m-0 text-xs font-semibold ${STATUS_TONE[stateClass]}`}>
          {paid ? 'Pagat' : locked ? 'Blocat' : 'Pendent'}
        </p>
      </div>

      {!paid && !locked && (
        <div className="flex items-center gap-1 shrink-0">
          {url && (
            <>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="ap-btn ap-btn--secondary ap-btn--xs"
              >
                Obrir
              </a>
              <button
                type="button"
                onClick={() => onCopy(url)}
                className="ap-btn ap-btn--secondary ap-btn--xs"
                title="Copiar link al portapapers"
              >
                {copiedKey === rowKey ? '✓ Copiat' : '⎘ Copiar'}
              </button>
            </>
          )}
          {stripeConfigured && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="ap-btn ap-btn--primary ap-btn--xs"
            >
              {loading ? '…' : url ? 'Regenerar' : 'Generar link'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function StripePaymentPanel({
  bookingId,
  depositPaid,
  depositPaymentUrl,
  depositBizumDeclaredAt,
  remainingPaid,
  remainingPaymentUrl,
  remainingBizumDeclaredAt,
  depositAmount,
  remainingAmount,
  stripeConfigured,
}: Props) {
  const [loadingDeposit, setLoadingDeposit] = useState(false);
  const [loadingRemaining, setLoadingRemaining] = useState(false);
  const [depositUrl, setDepositUrl] = useState<string | null>(depositPaymentUrl);
  const [remainingUrl, setRemainingUrl] = useState<string | null>(remainingPaymentUrl);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bizumDepositDeclared, setBizumDepositDeclared] = useState<boolean>(!!depositBizumDeclaredAt);
  const [bizumRemainingDeclared, setBizumRemainingDeclared] = useState<boolean>(!!remainingBizumDeclaredAt);
  const [confirmingBizum, setConfirmingBizum] = useState<'deposit' | 'remaining' | null>(null);

  async function generateLink(paymentType: 'deposit' | 'remaining') {
    setError(null);
    if (paymentType === 'deposit') setLoadingDeposit(true);
    else setLoadingRemaining(true);

    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType }),
      });
      const data = await res.json().catch(() => ({})) as { url?: string; error?: string };
      if (!res.ok) {
        const message = res.status === 401
          ? 'Sessió caducada. Recarrega la pàgina i torna a entrar.'
          : data.error === 'DEPOSIT_NOT_PAID'
            ? 'Cal que la paga i senyal estigui pagada primer.'
            : data.error === 'STRIPE_NOT_CONFIGURED'
              ? 'Stripe no està configurat en aquest entorn. Falta STRIPE_SECRET_KEY.'
              : 'No s’ha pogut generar el link de pagament.';
        setError(message);
      } else if (data.url) {
        if (paymentType === 'deposit') setDepositUrl(data.url);
        else setRemainingUrl(data.url);
      }
    } finally {
      if (paymentType === 'deposit') setLoadingDeposit(false);
      else setLoadingRemaining(false);
    }
  }

  async function copyToClipboard(url: string, key: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { /* ignore */ }
  }

  async function confirmBizum(paymentType: 'deposit' | 'remaining') {
    setConfirmingBizum(paymentType);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/confirm-bizum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error === 'ALREADY_PAID' ? 'El pagament ja estava confirmat.' : 'No s\'ha pogut confirmar. Recarrega i torna a intentar-ho.');
      } else {
        if (paymentType === 'deposit') setBizumDepositDeclared(false);
        else setBizumRemainingDeclared(false);
        window.location.reload();
      }
    } finally {
      setConfirmingBizum(null);
    }
  }

  const formatEur = (n: number) => formatNumber(n, { style: 'currency', currency: 'EUR' });

  const bothPaid = depositPaid && remainingPaid;
  const hasBizumPending = bizumDepositDeclared || bizumRemainingDeclared;

  return (
    <div className="ap-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--o-admin-line)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 select-none items-center justify-center rounded-[var(--o-r-md)] border border-[var(--o-admin-hair-gold)] bg-[var(--ax-gold-tint-2)] text-sm">
            💳
          </div>
          <div>
            <p className="m-0 text-sm font-semibold text-[var(--t)]">Pagaments</p>
            <p className="m-0 text-xs text-[var(--t3)]">Vies per tram: Stripe checkout o Bizum declarat pel client</p>
          </div>
        </div>
        {hasBizumPending && !bothPaid && (
          <span className="animate-pulse whitespace-nowrap rounded-full border border-[var(--ax-warning-border)] bg-[var(--ax-warning-bg)] px-2.5 py-1 text-xs font-bold text-[var(--o-warning)]">
            ● Bizum pendent
          </span>
        )}
        {bothPaid && (
          <span className="whitespace-nowrap rounded-full border border-[var(--ax-success-border)] bg-[var(--ax-success-bg)] px-2.5 py-1 text-xs font-bold text-[var(--o-success)]">
            ✓ Tot pagat
          </span>
        )}
      </div>

      <div className="border-t border-[var(--o-admin-line-2)]">
        <PaymentRow
          label="Paga i senyal"
          sublabel="30% · primer pagament"
          amount={formatEur(depositAmount)}
          paid={depositPaid}
          url={depositUrl}
          loading={loadingDeposit}
          copiedKey={copiedKey}
          rowKey="deposit"
          onGenerate={() => void generateLink('deposit')}
          onCopy={(url) => void copyToClipboard(url, 'deposit')}
          locked={false}
          stripeConfigured={stripeConfigured}
        />
        <div className="mx-4 h-px bg-[var(--o-admin-line-2)]" />
        <PaymentRow
          label="Pagament final"
          sublabel="70% · pagament restant"
          amount={formatEur(remainingAmount)}
          paid={remainingPaid}
          url={remainingUrl}
          loading={loadingRemaining}
          copiedKey={copiedKey}
          rowKey="remaining"
          onGenerate={() => void generateLink('remaining')}
          onCopy={(url) => void copyToClipboard(url, 'remaining')}
          locked={!depositPaid}
          stripeConfigured={stripeConfigured}
        />
      </div>

      {(bizumDepositDeclared || bizumRemainingDeclared) && (
        <div className="mx-3 mt-2 mb-1 space-y-1.5">
          {bizumDepositDeclared && !depositPaid && (
            <div className="flex items-center justify-between gap-3 rounded-[var(--o-r-lg)] border border-[var(--ax-warning-border)] bg-[var(--ax-warning-bg)] px-3 py-2.5 text-xs text-[var(--o-warning)]">
              <span>
                El client declara que ha fet el Bizum de la <strong>paga i senyal</strong>. Confirma quan vegis l'ingrés.
              </span>
              <button
                type="button"
                onClick={() => void confirmBizum('deposit')}
                disabled={confirmingBizum === 'deposit'}
                className="shrink-0 ap-btn ap-btn--primary ap-btn--xs"
              >
                {confirmingBizum === 'deposit' ? '…' : 'Confirmar'}
              </button>
            </div>
          )}
          {bizumRemainingDeclared && !remainingPaid && (
            <div className="flex items-center justify-between gap-3 rounded-[var(--o-r-lg)] border border-[var(--ax-warning-border)] bg-[var(--ax-warning-bg)] px-3 py-2.5 text-xs text-[var(--o-warning)]">
              <span>
                El client declara que ha fet el Bizum del <strong>pagament final</strong>. Confirma quan vegis l'ingrés.
              </span>
              <button
                type="button"
                onClick={() => void confirmBizum('remaining')}
                disabled={confirmingBizum === 'remaining'}
                className="shrink-0 ap-btn ap-btn--primary ap-btn--xs"
              >
                {confirmingBizum === 'remaining' ? '…' : 'Confirmar'}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mx-3 mb-3 mt-1 flex items-center justify-between gap-3 rounded-[var(--o-r-lg)] border border-[var(--ax-danger-border)] bg-[var(--ax-danger-bg)] px-3 py-2.5 text-xs text-[var(--o-danger)]">
          {error}
        </div>
      )}
    </div>
  );
}
