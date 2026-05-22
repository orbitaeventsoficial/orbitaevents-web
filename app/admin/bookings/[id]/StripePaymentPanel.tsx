'use client';

import { useState } from 'react';
import { formatNumber } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';

type Props = {
  bookingId: string;
  depositPaid: boolean;
  depositPaymentUrl: string | null;
  remainingPaid: boolean;
  remainingPaymentUrl: string | null;
  depositAmount: number;
  remainingAmount: number;
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
}) {
  const dotStyle: React.CSSProperties = paid
    ? { background: 'color-mix(in oklab, var(--at-green) 18%, var(--at-panel) 82%)', border: '1px solid color-mix(in oklab, var(--at-green) 40%, var(--at-border) 60%)' }
    : locked
      ? { background: 'var(--at-panel)', border: '1px solid var(--at-border)' }
      : { background: 'color-mix(in oklab, var(--at-orange) 12%, var(--at-panel) 88%)', border: '1px solid color-mix(in oklab, var(--at-orange) 35%, var(--at-border) 65%)' };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={{ background: paid ? 'color-mix(in oklab, var(--at-green) 3%, transparent 97%)' : undefined }}
    >
      <div
        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm"
        style={dotStyle}
      >
        {paid ? '✓' : locked ? '🔒' : '◌'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--at-text)]">{label}</p>
        <p className="text-[11px] text-[var(--at-subtle)]">{sublabel}</p>
      </div>

      <div className="text-right shrink-0 mr-2">
        <p
          className="text-sm font-bold tabular-nums"
          style={{ color: paid ? 'var(--at-green)' : 'var(--at-text)' }}
        >
          {amount}
        </p>
        <p
          className="text-[11px] font-medium"
          style={{ color: paid ? 'var(--at-green)' : locked ? 'var(--at-subtle)' : 'var(--at-orange)' }}
        >
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
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="ap-btn ap-btn--primary ap-btn--xs"
          >
            {loading ? '…' : url ? 'Regenerar' : 'Generar link'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function StripePaymentPanel({
  bookingId,
  depositPaid,
  depositPaymentUrl,
  remainingPaid,
  remainingPaymentUrl,
  depositAmount,
  remainingAmount,
}: Props) {
  const [loadingDeposit, setLoadingDeposit] = useState(false);
  const [loadingRemaining, setLoadingRemaining] = useState(false);
  const [depositUrl, setDepositUrl] = useState<string | null>(depositPaymentUrl);
  const [remainingUrl, setRemainingUrl] = useState<string | null>(remainingPaymentUrl);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
        setError(data.error === 'DEPOSIT_NOT_PAID'
          ? 'Cal que la paga i senyal estigui pagada primer.'
          : 'Error generant el link. Revisa la configuració de Stripe.');
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

  const formatEur = (n: number) => formatNumber(n, { style: 'currency', currency: 'EUR' });

  const bothPaid = depositPaid && remainingPaid;

  return (
    <div className="ap-card overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-[var(--at-border)]"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg text-sm select-none"
            style={{
              background: 'color-mix(in oklab, var(--at-violet) 14%, var(--at-panel) 86%)',
              border: '1px solid color-mix(in oklab, var(--at-violet) 30%, var(--at-border) 70%)',
            }}
          >
            💳
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--at-text)]">Pagaments Stripe</p>
            <p className="text-[11px] text-[var(--at-subtle)]">Links de checkout per al client</p>
          </div>
        </div>
        {bothPaid && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: 'color-mix(in oklab, var(--at-green) 14%, var(--at-panel) 86%)',
              color: 'var(--at-green)',
              border: '1px solid color-mix(in oklab, var(--at-green) 30%, var(--at-border) 70%)',
            }}
          >
            ✓ Tot pagat
          </span>
        )}
      </div>

      <div className="border-t border-[var(--at-border-sub)]">
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
        />
        <div className="h-px bg-[var(--at-border-sub)] mx-4" />
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
        />
      </div>

      {error && (
        <div
          className="mx-3 mb-3 mt-1 px-3 py-2 rounded-lg text-xs"
          style={{
            background: 'var(--at-red-dim)',
            border: '1px solid color-mix(in oklab, var(--at-red) 30%, var(--at-border) 70%)',
            color: 'var(--at-red)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
