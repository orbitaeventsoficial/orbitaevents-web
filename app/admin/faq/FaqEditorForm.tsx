'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FAQ_CATEGORY_OPTIONS } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';

type Translation = {
  locale: 'ca' | 'es' | 'en';
  question: string;
  answer: string;
};

type InitialFaq = {
  id?: string;
  slug: string;
  category: string;
  order: number;
  isActive: boolean;
  translations: Translation[];
};

const BASE_TRANSLATIONS: Translation[] = [
  { locale: 'ca', question: '', answer: '' },
  { locale: 'es', question: '', answer: '' },
  { locale: 'en', question: '', answer: '' },
];

function normalizeTranslations(input: Translation[] | undefined): Translation[] {
  const map = new Map<string, Translation>();
  (input || []).forEach((t) => map.set(t.locale, t));
  return BASE_TRANSLATIONS.map((base) => map.get(base.locale) || base);
}

export default function FaqEditorForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit';
  initial?: InitialFaq;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug || '');
  const [category, setCategory] = useState(initial?.category || 'general');
  const [order, setOrder] = useState<number>(initial?.order ?? 0);
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [translations, setTranslations] = useState<Translation[]>(
    normalizeTranslations(initial?.translations)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!slug.trim()) return false;
    return translations.some((t) => t.question.trim() && t.answer.trim());
  }, [slug, translations]);

  const updateTranslation = (locale: Translation['locale'], key: 'question' | 'answer', value: string) => {
    setTranslations((prev) =>
      prev.map((t) => (t.locale === locale ? { ...t, [key]: value } : t))
    );
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        slug: slug.trim(),
        category,
        order,
        isActive,
        translations: translations.map((t) => ({
          locale: t.locale,
          question: t.question.trim(),
          answer: t.answer.trim(),
        })),
      };

      const res = await fetchWithCsrf(
        mode === 'create' ? '/api/admin/faq' : `/api/admin/faq/${initial?.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "No s'ha pogut desar la FAQ");
      }

      router.push('/admin/faq');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconegut');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="ap-card p-5">
        <h2 className="text-sm font-semibold">Dades bàsiques</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="faq-slug" className="text-xs">Slug</label>
            <input
              id="faq-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="faq-reserva-data"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="faq-category" className="text-xs">Categoria</label>
            <select
              id="faq-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            >
              {FAQ_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="faq-order" className="text-xs">Ordre</label>
            <input
              id="faq-order"
              type="number"
              value={order}
              min={0}
              max={999}
              onChange={(e) => setOrder(Number.parseInt(e.target.value || '0', 10))}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                isActive
                  ? 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
                  : 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger'
              }`}
            >
              {isActive ? 'Activa' : 'Inactiva'}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {translations.map((t) => (
          <div key={t.locale} className="ap-card p-5">
            <h3 className="text-sm font-semibold">Idioma: {t.locale.toUpperCase()}</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor={`faq-question-${t.locale}`} className="text-xs">Pregunta</label>
                <input
                  id={`faq-question-${t.locale}`}
                  value={t.question}
                  onChange={(e) => updateTranslation(t.locale, 'question', e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor={`faq-answer-${t.locale}`} className="text-xs">Resposta</label>
                <textarea
                  id={`faq-answer-${t.locale}`}
                  rows={4}
                  value={t.answer}
                  onChange={(e) => updateTranslation(t.locale, 'answer', e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {error && (
        <div className="ap-card p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || !canSubmit}
          className="ap-btn ap-btn--primary"
        >
          {saving ? 'Desant...' : mode === 'create' ? 'Crear FAQ' : 'Desar canvis'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/faq')}
          className="rounded-xl border px-5 py-2.5 text-sm font-semibold"
        >
          Cancel·lar
        </button>
      </div>
    </div>
  );
}
