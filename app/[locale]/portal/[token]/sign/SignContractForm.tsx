'use client';

import { useState } from 'react';
import { SignaturePad } from './SignaturePad';
import { CLIENT_PORTAL_TONE_CLASS } from '@/lib/constants/clientPortalTones';

type SignFormMessages = {
  signYourName: string;
  signNamePlaceholder: string;
  signAcceptTerms: string;
  signSubmit: string;
  signSuccess: string;
  signSuccessBack: string;
  signError: string;
  signAlreadySigned: string;
  signNotAvailable: string;
  signaturePadLabel: string;
  signaturePadHint: string;
  signaturePadClear: string;
};

type Props = {
  token: string;
  locale: string;
  contractReference: string;
  accentHex: string;
  accentBorder: string;
  accentBg: string;
  messages: SignFormMessages;
};

export function SignContractForm({
  token,
  locale,
  contractReference,
  accentHex,
  accentBorder,
  accentBg,
  messages: m,
}: Props) {
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [signatureBlob, setSignatureBlob] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !accepted || !signatureBlob) return;
    setStatus('loading');

    const res = await fetch(`/api/portal/${token}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedBy: name.trim(), signatureBlob }),
    }).catch(() => null);

    if (!res) {
      setErrorKey('NETWORK_ERROR');
      setStatus('error');
      return;
    }

    if (res.ok) {
      setStatus('success');
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorKey((data as Record<string, string>).error || 'UNKNOWN');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={`rounded-2xl border p-8 text-center ${CLIENT_PORTAL_TONE_CLASS.successSoft}`}>
        <p className="text-2xl font-bold">✓</p>
        <p className="mt-2 text-lg font-semibold">{m.signSuccess}</p>
        <a
          href={`/${locale}/portal/${token}`}
          className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm font-semibold text-white/90 hover:brightness-110"
          style={{ borderColor: accentBorder, backgroundColor: accentBg }}
        >
          {m.signSuccessBack}
        </a>
      </div>
    );
  }

  const errorMessage =
    errorKey === 'ALREADY_SIGNED'
      ? m.signAlreadySigned
      : errorKey === 'NOT_SIGNABLE'
        ? m.signNotAvailable
        : m.signError;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="sign-name" className="block text-sm text-white/60 mb-1">
          {m.signYourName}
        </label>
        <input
          id="sign-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={m.signNamePlaceholder}
          required
          minLength={2}
          maxLength={200}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 focus:border-white/40 focus:outline-none"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/30 bg-white/5"
        />
        <span className="text-sm text-white/70">{m.signAcceptTerms} <strong>{contractReference}</strong></span>
      </label>

      <div className="pt-3 border-t border-white/10">
        <p className="block text-sm font-medium text-white/80 mb-3">{m.signaturePadLabel}</p>
        <SignaturePad
          onDataChange={setSignatureBlob}
          clearLabel={m.signaturePadClear}
          hintText={m.signaturePadHint}
        />
      </div>

      {status === 'error' && (
        <p className={`rounded-lg border px-4 py-2 text-sm ${CLIENT_PORTAL_TONE_CLASS.dangerSoft}`}>
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!name.trim() || !accepted || !signatureBlob || status === 'loading'}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
        style={{ backgroundColor: accentHex }}
      >
        {status === 'loading' ? '…' : m.signSubmit}
      </button>
    </form>
  );
}
