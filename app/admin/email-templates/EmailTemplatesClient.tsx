'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '../components/ToastProvider';
import { SUPPORTED_LOCALES, SUPPORTED_LOCALE_LABELS } from '@/lib/constants';

interface TemplateInfo {
  slug: string;
  description: string;
  locales: { locale: string; source: 'db' | 'default'; updatedAt?: string }[];
  variables: string[];
}

const SOURCE_BADGE = {
  db: { label: 'Personalitzat', className: 'ap-badge ap-badge--success' },
  default: { label: 'Per defecte', className: 'ap-badge' },
} as const;


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

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm admin-tone-text-neutral" role="status">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Carregant plantilles...
      </div>
    );
  }

  const customized = templates.filter((t) => t.locales.some((l) => l.source === 'db')).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="ap-kpi">
          <div className="ap-kpi-label">Total plantilles</div>
          <div className="ap-kpi-value">{templates.length}</div>
        </div>
        <div className="ap-kpi ap-kpi--success">
          <div className="ap-kpi-label">Personalitzades</div>
          <div className="ap-kpi-value">{customized}</div>
        </div>
        <div className="ap-kpi ap-kpi--info">
          <div className="ap-kpi-label">Idiomes</div>
          <div className="ap-kpi-value">{SUPPORTED_LOCALES.length}</div>
          <div className="ap-kpi-trend">{SUPPORTED_LOCALES.map((locale) => locale.toUpperCase()).join(' · ')}</div>
        </div>
      </div>

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.slug} className="ap-card rounded-2xl p-4 transition-all hover:admin-tone-bg-neutral">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{t.description}</div>
                <div className="mt-0.5 font-mono text-xs admin-tone-text-slate">{t.slug}</div>
              </div>
              <div className="flex items-center gap-2 text-xs admin-tone-text-slate">{t.variables.length} variables</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {t.locales.map((l) => {
                const badge = SOURCE_BADGE[l.source];
                return (
                  <Link
                    key={l.locale}
                    href={`/admin/email-templates/${t.slug}?locale=${l.locale}`}
                    className="ap-btn ap-btn--secondary"
                  >
                    <span className="font-semibold">{SUPPORTED_LOCALE_LABELS[l.locale] || l.locale}</span>
                    <span className={badge.className}>{badge.label}</span>
                  </Link>
                );
              })}
            </div>

            {t.variables.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {t.variables.map((v) => (
                  <span key={v} className="ap-badge font-mono text-[10px]">
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
