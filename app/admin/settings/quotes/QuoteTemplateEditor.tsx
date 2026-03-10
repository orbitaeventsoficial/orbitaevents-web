'use client';

import { useState } from 'react';
import type { QuoteTemplateSettings } from '@/lib/services/quoteTemplateService';
import { fetchWithCsrf } from '@/lib/csrf';

function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function QuoteTemplateEditor({ initial }: { initial: QuoteTemplateSettings }) {
  const [form, setForm] = useState({
    validityDays: initial.validityDays,
    introTitle: initial.introTitle,
    introSubtitle: initial.introSubtitle,
    ctaTitle: initial.ctaTitle,
    ctaSubtitle: initial.ctaSubtitle,
    conditionsText: initial.conditions.join('\n'),
    sendAdminCopy: initial.sendAdminCopy,
    adminCopyEmail: initial.adminCopyEmail,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetchWithCsrf('/api/admin/settings/quote-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: {
            validityDays: Number(form.validityDays),
            introTitle: form.introTitle,
            introSubtitle: form.introSubtitle,
            ctaTitle: form.ctaTitle,
            ctaSubtitle: form.ctaSubtitle,
            conditions: toLines(form.conditionsText),
            sendAdminCopy: form.sendAdminCopy,
            adminCopyEmail: form.adminCopyEmail,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s’ha pogut desar la plantilla');
      }
      setMessage('Plantilla desada correctament');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error desant plantilla');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'admin-quote-template-input w-full rounded-xl border px-4 py-2.5 text-sm';

  return (
    <section className="admin-quote-template rounded-2xl border p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm">
          Títol principal
          <input
            className={inputClass}
            value={form.introTitle}
            onChange={(e) => update('introTitle', e.target.value)}
          />
        </label>

        <label className="text-sm">
          Dies de validesa
          <input
            type="number"
            min={1}
            max={120}
            className={inputClass}
            value={form.validityDays}
            onChange={(e) => update('validityDays', Number(e.target.value))}
          />
        </label>

        <label className="text-sm lg:col-span-2">
          Subtítol capçalera
          <input
            className={inputClass}
            value={form.introSubtitle}
            onChange={(e) => update('introSubtitle', e.target.value)}
          />
        </label>

        <label className="text-sm">
          Títol CTA
          <input
            className={inputClass}
            value={form.ctaTitle}
            onChange={(e) => update('ctaTitle', e.target.value)}
          />
        </label>

        <label className="text-sm">
          Subtítol CTA
          <input
            className={inputClass}
            value={form.ctaSubtitle}
            onChange={(e) => update('ctaSubtitle', e.target.value)}
          />
        </label>

        <label className="text-sm lg:col-span-2">
          Condicions (una per línia)
          <textarea
            rows={8}
            className={inputClass}
            value={form.conditionsText}
            onChange={(e) => update('conditionsText', e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.sendAdminCopy}
            onChange={(e) => update('sendAdminCopy', e.target.checked)}
          />
          Enviar còpia interna automàtica de cada pressupost
        </label>

        <label className="text-sm">
          Email de còpia interna
          <input
            type="email"
            className={inputClass}
            value={form.adminCopyEmail}
            onChange={(e) => update('adminCopyEmail', e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="admin-quote-template-save rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? 'Desant...' : 'Desar plantilla'}
        </button>
        {message && <p className="text-sm">{message}</p>}
      </div>
    </section>
  );
}
