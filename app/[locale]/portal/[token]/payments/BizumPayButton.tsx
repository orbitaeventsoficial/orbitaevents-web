'use client';

import { useState } from 'react';

type Props = {
  token: string;
  paymentType: 'deposit' | 'remaining';
  bizumPhone: string;
  amount: string;
  reference: string;
  accentHex: string;
  labels: {
    instruction: string;
    concept: string;
    button: string;
    sending: string;
    successTitle: string;
    successBody: string;
    alreadyDeclared: string;
    errorRetry: string;
  };
  alreadyDeclared: boolean;
};

export default function BizumPayButton({
  token,
  paymentType,
  bizumPhone,
  amount,
  reference,
  accentHex,
  labels,
  alreadyDeclared: initialDeclared,
}: Props) {
  const [declared, setDeclared] = useState(initialDeclared);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeclare() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${token}/bizum-notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (data.error === 'ALREADY_DECLARED' || data.error === 'ALREADY_PAID') {
          setDeclared(true);
        } else {
          setError(labels.errorRetry);
        }
      } else {
        setDeclared(true);
      }
    } catch {
      setError(labels.errorRetry);
    } finally {
      setLoading(false);
    }
  }

  if (declared) {
    return (
      <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-300">✓ {labels.successTitle}</p>
        <p className="text-xs text-white/50 mt-0.5">{labels.successBody}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 space-y-3">
      <p className="text-xs text-white/50">{labels.instruction}</p>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2">
        <span className="text-xs text-white/40">Bizum</span>
        <span className="font-bold text-white tabular-nums tracking-wide">{bizumPhone}</span>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2">
        <span className="text-xs text-white/40">{labels.concept}</span>
        <span className="font-mono text-sm text-white">{reference}</span>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2">
        <span className="text-xs text-white/40">Import</span>
        <span className="font-bold text-white tabular-nums">{amount}</span>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        type="button"
        onClick={() => void handleDeclare()}
        disabled={loading}
        className="w-full rounded-xl py-2.5 text-sm font-bold text-black hover:brightness-110 transition-all disabled:opacity-50"
        style={{ backgroundColor: accentHex }}
      >
        {loading ? labels.sending : labels.button}
      </button>
    </div>
  );
}
