'use client';

import { useState } from 'react';
import type { QuoteTemplateSettings } from '@/lib/services/quoteTemplateService';

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
      const res = await fetch('/api/admin/settings/quote-template', {
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
        throw new Error(data?.error || 'No se pudo guardar la plantilla');
      }
      setMessage('Plantilla guardada correctamente');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error guardando plantilla');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500';

  return (
    <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm text-slate-300">
          Título principal
          <input
            className={inputClass}
            value={form.introTitle}
            onChange={(e) => update('introTitle', e.target.value)}
          />
        </label>

        <label className="text-sm text-slate-300">
          Días de validez
          <input
            type="number"
            min={1}
            max={120}
            className={inputClass}
            value={form.validityDays}
            onChange={(e) => update('validityDays', Number(e.target.value))}
          />
        </label>

        <label className="text-sm text-slate-300 lg:col-span-2">
          Subtítulo cabecera
          <input
            className={inputClass}
            value={form.introSubtitle}
            onChange={(e) => update('introSubtitle', e.target.value)}
          />
        </label>

        <label className="text-sm text-slate-300">
          CTA título
          <input
            className={inputClass}
            value={form.ctaTitle}
            onChange={(e) => update('ctaTitle', e.target.value)}
          />
        </label>

        <label className="text-sm text-slate-300">
          CTA subtítulo
          <input
            className={inputClass}
            value={form.ctaSubtitle}
            onChange={(e) => update('ctaSubtitle', e.target.value)}
          />
        </label>

        <label className="text-sm text-slate-300 lg:col-span-2">
          Condiciones (una por línea)
          <textarea
            rows={8}
            className={inputClass}
            value={form.conditionsText}
            onChange={(e) => update('conditionsText', e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.sendAdminCopy}
            onChange={(e) => update('sendAdminCopy', e.target.checked)}
          />
          Enviar copia interna automática de cada presupuesto
        </label>

        <label className="text-sm text-slate-300">
          Email de copia interna
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
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar plantilla'}
        </button>
        {message && <p className="text-sm text-slate-300">{message}</p>}
      </div>
    </section>
  );
}
