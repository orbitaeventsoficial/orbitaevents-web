'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '../components/ToastProvider';

interface TemplateInfo {
  slug: string;
  description: string;
  locales: { locale: string; source: 'db' | 'default'; updatedAt?: string }[];
  variables: string[];
}

const SOURCE_BADGE = {
  db: { label: 'Personalitzat', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  default: { label: 'Per defecte', color: 'bg-white/5 text-white/40 border-white/10' },
} as const;

const LOCALE_LABELS: Record<string, string> = { ca: 'Català', es: 'Castellà', en: 'Anglès' };

export default function EmailTemplatesClient() {
  const toast = useToast();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/email-templates');
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error carregant');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetch_(); }, [fetch_]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm" role="status">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Carregant plantilles...
      </div>
    );
  }

  const customized = templates.filter((t) => t.locales.some((l) => l.source === 'db')).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border p-4">
          <div className="text-[10px] uppercase tracking-wide text-white/50">Total plantilles</div>
          <div className="text-2xl font-bold">{templates.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-[10px] uppercase tracking-wide text-white/50">Personalitzades</div>
          <div className="text-2xl font-bold text-emerald-400">{customized}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-[10px] uppercase tracking-wide text-white/50">Idiomes</div>
          <div className="text-2xl font-bold">3</div>
          <div className="text-xs text-white/40">CA · ES · EN</div>
        </div>
      </div>

      {/* Llista */}
      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.slug} className="rounded-2xl border p-4 transition-all hover:bg-white/[0.02]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm">{t.description}</div>
                <div className="text-xs text-white/40 font-mono mt-0.5">{t.slug}</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                {t.variables.length} variables
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {t.locales.map((l) => {
                const badge = SOURCE_BADGE[l.source];
                return (
                  <Link
                    key={l.locale}
                    href={`/admin/email-templates/${t.slug}?locale=${l.locale}`}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/10 ${badge.color}`}
                  >
                    <span className="font-semibold">{LOCALE_LABELS[l.locale] || l.locale}</span>
                    <span className="text-[10px]">{badge.label}</span>
                  </Link>
                );
              })}
            </div>

            {t.variables.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {t.variables.map((v) => (
                  <span key={v} className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/30">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
