'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  shareToken: string;
  locale: string;
  wrongPassword: boolean;
  brandName: string;
  labels: {
    title: string;
    prompt: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    wrongPassword: string;
    submitting: string;
    access: string;
  };
}

export default function GalleryPasswordGate({ shareToken, locale, wrongPassword, brandName, labels }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    router.push(`/${locale}/gallery/${shareToken}?password=${encodeURIComponent(password.trim())}`);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-10 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 mb-2">{brandName}</p>
        <h1 className="text-xl font-bold mb-1">{labels.title}</h1>
        <p className="text-sm text-white/50 mb-6">{labels.prompt}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gallery-password" className="sr-only">{labels.passwordLabel}</label>
            <input
              id="gallery-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={labels.passwordPlaceholder}
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {wrongPassword && (
            <p className="text-sm text-red-400" role="alert">{labels.wrongPassword}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? labels.submitting : labels.access}
          </button>
        </form>
      </div>
    </div>
  );
}
