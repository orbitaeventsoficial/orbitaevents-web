'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { buildQuestionnaireHref } from '@/lib/admin/questionnaireWorkspaceHref';
import { fetchWithCsrf } from '@/lib/csrf';

export default function QuestionnaireTemplateActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const { confirm, dialogProps } = useConfirmDialog();

  async function handleToggle() {
    await fetchWithCsrf(`/api/admin/questionnaires/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar plantilla',
      message: 'Eliminar aquesta plantilla? Totes les respostes dels clients es perdran.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchWithCsrf(`/api/admin/questionnaires/${id}`, { method: 'DELETE' });
    router.refresh();
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
          className="ap-btn ap-btn--xs inline-flex"
          type="button"
        >
          {isActive ? 'Desactivar' : 'Activar'}
        </button>
        <button
          onClick={handleDelete}
          className="ap-btn ap-btn--xs admin-tone-border-danger admin-tone-text-danger"
          type="button"
        >
          Eliminar
        </button>
      </div>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
