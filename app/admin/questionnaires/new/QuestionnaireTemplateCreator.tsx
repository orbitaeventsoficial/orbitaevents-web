'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuestionnaireQuestion, QuestionType } from '@/lib/services/questionnaireService';
import { fetchWithCsrf } from '@/lib/csrf';
import { createQuestionnaireQuestion } from '@/lib/admin/questionnaireQuestionFactory';

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'Text curt' },
  { value: 'textarea', label: 'Text llarg' },
  { value: 'select', label: 'Selecció única' },
  { value: 'multiselect', label: 'Selecció múltiple' },
];

export default function QuestionnaireTemplateCreator() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([createQuestionnaireQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(idx: number, patch: Partial<QuestionnaireQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleCreate() {
    if (!title.trim()) { setError('El títol és obligatori.'); return; }
    if (questions.some((q) => !q.label.trim())) { setError('Totes les preguntes han de tenir un enunciat.'); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, questions, isActive }),
      });
      if (!res.ok) throw new Error('Error creant la plantilla.');
      router.push('/admin/questionnaires');
      router.refresh();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Error creant la plantilla.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <p className="rounded-lg border admin-tone-border-danger admin-tone-bg-danger px-4 py-2 text-sm admin-tone-text-danger">{error}</p>
      )}

      <div className="space-y-4 ap-card p-4">
        <div>
          <label htmlFor="new-tpl-title" className="block text-xs text-white/50 mb-1">Títol</label>
          <input
            id="new-tpl-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Qüestionari pre-event"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
        <div>
          <label htmlFor="new-tpl-desc" className="block text-xs text-white/50 mb-1">Descripció (opcional)</label>
          <input
            id="new-tpl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
            role="switch"
            aria-checked={isActive}
          />
          Plantilla activa (visible al portal del client)
        </label>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/70">Preguntes</h2>
        {questions.map((q, idx) => (
          <div key={q.id} className="ap-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40">Pregunta {idx + 1}</p>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(idx)} type="button" className="text-xs admin-tone-text-danger hover:underline">
                  Eliminar
                </button>
              )}
            </div>
            <div>
              <label htmlFor={`new-q-label-${idx}`} className="block text-xs text-white/50 mb-1">Enunciat</label>
              <input
                id={`new-q-label-${idx}`}
                value={q.label}
                onChange={(e) => updateQuestion(idx, { label: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor={`new-q-type-${idx}`} className="block text-xs text-white/50 mb-1">Tipus</label>
              <select
                id={`new-q-type-${idx}`}
                value={q.type}
                onChange={(e) => updateQuestion(idx, { type: e.target.value as QuestionType })}
                aria-label="Tipus de pregunta"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {(q.type === 'select' || q.type === 'multiselect') && (
              <div>
                <label htmlFor={`new-q-opts-${idx}`} className="block text-xs text-white/50 mb-1">Opcions (una per línia)</label>
                <textarea
                  id={`new-q-opts-${idx}`}
                  rows={3}
                  value={(q.options ?? []).join('\n')}
                  onChange={(e) => updateQuestion(idx, { options: e.target.value.split('\n').filter(Boolean) })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                className="rounded"
                role="switch"
                aria-checked={q.required}
              />
              Obligatòria
            </label>
          </div>
        ))}
        <button
          onClick={() => setQuestions((prev) => [...prev, createQuestionnaireQuestion()])}
          type="button"
          className="inline-flex rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
        >
          + Afegir pregunta
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCreate}
          disabled={saving}
          type="button"
          className="ap-btn ap-btn--primary"
        >
          {saving ? 'Creant...' : 'Crear plantilla'}
        </button>
        <button
          onClick={() => router.back()}
          type="button"
          className="inline-flex rounded-lg border border-white/15 px-5 py-2 text-sm text-white/70 hover:bg-white/5"
        >
          Cancel·lar
        </button>
      </div>
    </div>
  );
}
