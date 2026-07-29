'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { buildQuestionnaireHref } from '@/lib/admin/questionnaireWorkspaceHref';
import { fetchWithCsrf } from '@/lib/csrf';

type BusyAction = 'toggle' | 'delete' | null;

async function readQuestionnaireActionError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json() as { error?: string; message?: string };
    return payload.error || payload.message || fallback;
  } catch {
    return fallback;
  }
}

export default function QuestionnaireTemplateActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const { confirm, dialogProps } = useConfirmDialog();
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [error, setError] = useState('');

  async function handleToggle() {
    setBusyAction('toggle');
    setError('');
    try {
      const res = await fetchWithCsrf(`/api/admin/questionnaires/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error(await readQuestionnaireActionError(res, "No s'ha pogut actualitzar la plantilla"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No s'ha pogut actualitzar la plantilla");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar plantilla',
      message: 'Eliminar aquesta plantilla? Totes les respostes dels clients es perdran.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    setBusyAction('delete');
    setError('');
    try {
      const res = await fetchWithCsrf(`/api/admin/questionnaires/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readQuestionnaireActionError(res, "No s'ha pogut eliminar la plantilla"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No s'ha pogut eliminar la plantilla");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={buildQuestionnaireHref(id)}
          className="ap-btn ap-btn--xs"
        >
          Editar
        </Link>
        <button
          onClick={handleToggle}
          disabled={busyAction !== null}
          className="ap-btn ap-btn--xs inline-flex"
          type="button"
        >
          {busyAction === 'toggle' ? '…' : isActive ? 'Desactivar' : 'Activar'}
        </button>
        <button
          onClick={handleDelete}
          disabled={busyAction !== null}
          className="ap-btn ap-btn--xs admin-tone-border-danger admin-tone-text-danger"
          type="button"
        >
          {busyAction === 'delete' ? '…' : 'Eliminar'}
        </button>
      </div>
      {error && (
        <p className="w-full text-xs admin-tone-text-danger" role="alert">
          {error}
        </p>
      )}
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
