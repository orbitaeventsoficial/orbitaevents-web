'use client';

import { useState } from 'react';
import { CLIENT_PORTAL_TONE_CLASS } from '@/lib/constants/clientPortalTones';
import { readPortalActionError } from '@/lib/clientPortalUtils';

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
    amount: string;
    button: string;
    sending: string;
    successTitle: string;
    successBody: string;
    alreadyDeclared: string;
    errorRetry: string;
  };
  alreadyDeclared: boolean;
};

type BizumNotifyErrorKey = 'ALREADY_DECLARED' | 'ALREADY_PAID' | 'GENERIC';

function normalizeBizumNotifyErrorKey(error: unknown): BizumNotifyErrorKey {
  return error === 'ALREADY_DECLARED' || error === 'ALREADY_PAID' ? error : 'GENERIC';
}

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
        const data = await res.json().catch(() => null);
        const errorKey = normalizeBizumNotifyErrorKey(readPortalActionError(data));
        if (errorKey === 'ALREADY_DECLARED' || errorKey === 'ALREADY_PAID') {
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
      <div className={`mt-4 rounded-xl border px-4 py-3 ${CLIENT_PORTAL_TONE_CLASS.successSoft}`} role="status">
        <p className="text-sm font-semibold"><span aria-hidden="true">✓</span> {labels.successTitle}</p>
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
        <span className="text-xs text-white/40">{labels.amount}</span>
        <span className="font-bold text-white tabular-nums">{amount}</span>
      </div>

      {error && (
        <p className={`text-xs ${CLIENT_PORTAL_TONE_CLASS.dangerText}`} role="alert">{error}</p>
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
