'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import ConfirmDialog, { useConfirmDialog } from '@/app/admin/components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '../components/ToastProvider';
import { DossierListActions, readDossierListActionError } from './DossierListActions';

export type DossierSavedListItem = {
  id: string;
  nom: string;
  title: string;
  productLine: string;
  sentLabel?: string | null;
  draftLabel?: string | null;
  leadOrigin?: { href: string; label: string } | null;
  customerOrigin?: { href: string; label: string } | null;
  leadId?: string | null;
  email?: string | null;
  alreadySent: boolean;
};

export function DossierSavedList({ items }: { items: DossierSavedListItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, dialogProps } = useConfirmDialog();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const selectedCount = selectedIds.size;
  const allSelected = items.length > 0 && selectedCount === items.length;

  function toggleOne(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  async function moveSelectedToTrash() {
    const ids = [...selectedIds];
    if (ids.length === 0 || bulkDeleting) return;
    const ok = await confirm({
      title: 'Moure dossiers a la paperera',
      message: `S'enviaran ${ids.length} dossiers a la paperera. Es podran restaurar durant 30 dies.`,
      variant: 'danger',
      confirmLabel: 'Enviar a paperera',
    });
    if (!ok) return;

    setBulkDeleting(true);
    const failed: string[] = [];
    try {
      for (const id of ids) {
        const res = await fetchWithCsrf(`/api/admin/dossiers/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          failed.push(await readDossierListActionError(res, 'Error movent un dossier a la paperera'));
        }
      }
      const moved = ids.length - failed.length;
      if (moved > 0) toast.success(`${moved} dossiers moguts a la paperera.`);
      if (failed.length > 0) toast.error(`${failed.length} dossiers no s'han pogut moure.`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      console.error('[DossierSavedList] bulk delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Error movent dossiers a la paperera');
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--t2)]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4"
            aria-label="Seleccionar dossiers visibles"
          />
          Seleccionar visibles
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 && <span className="ap-badge">{selectedCount} seleccionats</span>}
          {selectedCount > 0 && (
            <button type="button" className="ap-btn ap-btn--xs" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Netejar
            </button>
          )}
          <button
            type="button"
            className="ap-btn ap-btn--danger ap-btn--xs"
            onClick={moveSelectedToTrash}
            disabled={selectedCount === 0 || bulkDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {bulkDeleting ? 'Enviant...' : 'Enviar a paperera'}
          </button>
        </div>
      </div>

      {items.map((item) => (
        <article key={item.id} className="ap-card ap-card-body grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 flex-1 gap-3">
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={() => toggleOne(item.id)}
              className="mt-1 h-4 w-4 shrink-0"
              aria-label={`Seleccionar dossier ${item.nom}`}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold leading-snug text-[var(--t)] sm:truncate">{item.title}</span>
              <span className="line-clamp-2 break-words text-xs leading-relaxed text-[var(--t3)]">{item.productLine}</span>
              {item.sentLabel && (
                <span className="line-clamp-1 text-xs text-[var(--gold-bright)]">{item.sentLabel}</span>
              )}
              {item.draftLabel && (
                <span className="text-xs text-[var(--gold-bright)]">{item.draftLabel}</span>
              )}
              {(item.leadOrigin || item.customerOrigin) && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold uppercase tracking-[0.08em] text-[var(--t3)]">Origen</span>
                  {item.leadOrigin && (
                    <Link href={item.leadOrigin.href} className="rounded-full border border-[var(--o-admin-line)] bg-[var(--sunk)] px-2 py-0.5 font-semibold text-[var(--t2)] no-underline transition-colors hover:text-[var(--gold-bright)]">
                      {item.leadOrigin.label}
                    </Link>
                  )}
                  {item.customerOrigin && (
                    <Link href={item.customerOrigin.href} className="rounded-full border border-[var(--o-admin-line)] bg-[var(--sunk)] px-2 py-0.5 font-semibold text-[var(--t2)] no-underline transition-colors hover:text-[var(--gold-bright)]">
                      {item.customerOrigin.label}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
          <DossierListActions
            dossierId={item.id}
            leadId={item.leadId ?? undefined}
            email={item.email ?? undefined}
            nom={item.nom}
            alreadySent={item.alreadySent}
          />
        </article>
      ))}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
