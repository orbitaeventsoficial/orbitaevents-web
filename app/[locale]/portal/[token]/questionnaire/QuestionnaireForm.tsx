'use client';

import { useState } from 'react';
import type { QuestionnaireTemplateDTO, QuestionnaireResponseDTO, QuestionnaireQuestion } from '@/lib/services/questionnaireService';
import { CLIENT_PORTAL_TONE_CLASS } from '@/lib/constants/clientPortalTones';

type Messages = {
  alreadySubmitted: string;
  edit: string;
  submit: string;
  saving: string;
  success: string;
  successBack: string;
  error: string;
  required: string;
};

type Props = {
  token: string;
  template: QuestionnaireTemplateDTO;
  existingResponse: QuestionnaireResponseDTO | null;
  messages: Messages;
  accentHex?: string;
};

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: QuestionnaireQuestion;
  value: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  const strVal = typeof value === 'string' ? value : '';
  const arrVal = Array.isArray(value) ? value : [];

  if (question.type === 'text') {
    return (
      <input
        id={`q-${question.id}`}
        type="text"
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        required={question.required}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
      />
    );
  }

  if (question.type === 'textarea') {
    return (
      <textarea
        id={`q-${question.id}`}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        required={question.required}
        rows={3}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
      />
    );
  }

  if (question.type === 'select') {
    return (
      <select
        id={`q-${question.id}`}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        aria-label={question.label}
        required={question.required}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
      >
        <option value="">—</option>
        {(question.options ?? []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (question.type === 'multiselect') {
    return (
      <div className="mt-1 space-y-1">
        {(question.options ?? []).map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
            <input
              type="checkbox"
              checked={arrVal.includes(opt)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...arrVal, opt]
                  : arrVal.filter((v) => v !== opt);
                onChange(next);
              }}
              className="rounded"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  return null;
}

export default function QuestionnaireForm({
  token,
  template,
  existingResponse,
  messages: m,
  accentHex = '#06b6d4',
}: Props) {
  const [editing, setEditing] = useState(!existingResponse);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    existingResponse?.answers ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function setAnswer(id: string, val: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = template.questions.find((q) => q.required && !answers[q.id]);
    if (missing) {
      setError(`"${missing.label}" és un ${m.required}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${token}/questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error('Error');
      setSubmitted(true);
    } catch {
      setError(m.error);
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className={`${CLIENT_PORTAL_TONE_CLASS.successText} font-semibold`}>{m.success}</p>
        <a
          href={`../`}
          className="inline-flex rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
        >
          {m.successBack}
        </a>
      </div>
    );
  }

  if (!editing && existingResponse) {
    return (
      <div className="space-y-4">
        <p className={`text-sm ${CLIENT_PORTAL_TONE_CLASS.successText}`}>{m.alreadySubmitted}</p>
        <dl className="space-y-3">
          {template.questions.map((q) => (
            <div key={q.id}>
              <dt className="text-xs text-white/40">{q.label}</dt>
              <dd className="text-sm text-white">
                {Array.isArray(existingResponse.answers[q.id])
                  ? (existingResponse.answers[q.id] as string[]).join(', ')
                  : (existingResponse.answers[q.id] as string) || '—'}
              </dd>
            </div>
          ))}
        </dl>
        <button
          onClick={() => setEditing(true)}
          type="button"
          className="inline-flex rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
        >
          {m.edit}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {template.description && (
        <p className="text-sm text-white/60">{template.description}</p>
      )}
      {error && (
        <p className={`rounded-lg border px-4 py-2 text-sm ${CLIENT_PORTAL_TONE_CLASS.dangerSoft}`}>{error}</p>
      )}
      {template.questions.map((q) => (
        <div key={q.id}>
          <label htmlFor={`q-${q.id}`} className="block text-sm font-medium text-white/80">
            {q.label}
            {q.required && <span className={`ml-1 text-xs ${CLIENT_PORTAL_TONE_CLASS.dangerText}`} aria-hidden="true">*</span>}
          </label>
          <QuestionField
            question={q}
            value={answers[q.id] ?? (q.type === 'multiselect' ? [] : '')}
            onChange={(v) => setAnswer(q.id, v)}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-black hover:brightness-110 disabled:opacity-50 transition-all"
        style={{ backgroundColor: accentHex }}
      >
        {saving ? m.saving : m.submit}
      </button>
    </form>
  );
}
