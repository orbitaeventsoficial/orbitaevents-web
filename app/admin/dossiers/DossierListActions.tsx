'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, FileText, RotateCcw, Send, Trash2, XCircle } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { buildDossierHtml, type DossierClientInfo, type DossierCopy } from '@/lib/utils/dossier-html-builder';

const ACTIONS_WRAP = 'grid w-full grid-cols-2 gap-2 sm:grid-cols-4 md:flex md:w-auto md:flex-wrap md:items-center md:justify-end';
const ACTION_BTN = 'ap-btn ap-btn--xs min-h-10 justify-center gap-1.5';
const ACTION_ICON = 'h-3.5 w-3.5 shrink-0';

async function readDossierListActionError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json() as { error?: string; message?: string };
    return payload.error || payload.message || fallback;
  } catch {
    return fallback;
  }
}

interface Props {
  dossierId: string;
  email?: string;
  nom: string;
  productIds: string[];
  products: AnimacioProduct[];
  snapshotProducts?: AnimacioProduct[];
  clientInfo: DossierClientInfo;
  dossierCopy: DossierCopy;
  alreadySent: boolean;
  logoDataUri?: string;
  isDeleted?: boolean;
}

export function DossierListActions({ dossierId, email, nom, productIds, products, snapshotProducts, clientInfo, dossierCopy, alreadySent, logoDataUri, isDeleted }: Props) {
  const toast = useToast();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purging, setPurging] = useState(false);

  function preview() {
    try {
      const filteredProducts = snapshotProducts && snapshotProducts.length > 0
        ? snapshotProducts
        : products.filter((p) => productIds.includes(p.id));
      const html = buildDossierHtml(clientInfo, filteredProducts, dossierCopy, { logoDataUri, locale: 'ca-ES' });
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('[DossierListActions] preview error:', err);
      toast.error('No he pogut obrir la previsualització.');
    }
  }

  function openCompositePdf() {
    window.open(`/api/admin/dossiers/${dossierId}/composite`, '_blank', 'noopener,noreferrer');
  }

  async function send() {
    if (!email) { toast.error('El dossier no té email de destinatari'); return; }
    setSending(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/dossiers/${dossierId}/send`, { method: 'POST' });
      if (!res.ok) {
        throw new Error(await readDossierListActionError(res, 'Error enviant el dossier'));
      }
      toast.success(`Dossier enviat a ${email}`);
      router.refresh();
    } catch (err) {
      console.error('[DossierListActions] send error:', err);
      toast.error(err instanceof Error ? err.message : 'Error enviant el dossier');
    } finally {
      setSending(false);
    }
  }

  async function moveToTrash() {
    setDeleting(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/dossiers/${dossierId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readDossierListActionError(res, 'Error movent el dossier a la paperera'));
      toast.success('Dossier mogut a la paperera (30 dies per restaurar)');
      router.refresh();
    } catch (err) {
      console.error('[DossierListActions] delete error:', err);
      toast.error(err instanceof Error ? err.message : 'Error movent el dossier a la paperera');
    } finally {
      setDeleting(false);
    }
  }

  async function restore() {
    setRestoring(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      if (!res.ok) throw new Error(await readDossierListActionError(res, 'Error restaurant el dossier'));
      toast.success('Dossier restaurat');
      router.refresh();
    } catch (err) {
      console.error('[DossierListActions] restore error:', err);
      toast.error(err instanceof Error ? err.message : 'Error restaurant el dossier');
    } finally {
      setRestoring(false);
    }
  }

  async function purge() {
    setPurging(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge' }),
      });
      if (!res.ok) throw new Error(await readDossierListActionError(res, 'Error eliminant el dossier'));
      toast.success('Dossier eliminat permanentment');
      router.refresh();
    } catch (err) {
      console.error('[DossierListActions] purge error:', err);
      toast.error(err instanceof Error ? err.message : 'Error eliminant el dossier');
    } finally {
      setPurging(false);
    }
  }

  if (isDeleted) {
    return (
      <div className={ACTIONS_WRAP}>
        <button type="button" onClick={preview} className={ACTION_BTN} title="Previsualitzar">
          <Eye className={ACTION_ICON} aria-hidden="true" />
          Vista
        </button>
        <button type="button" onClick={openCompositePdf} className={`${ACTION_BTN} ap-btn--primary`} title="Obrir dossier + fitxes en un sol PDF">
          <FileText className={ACTION_ICON} aria-hidden="true" />
          PDF complet
        </button>
        <button type="button" onClick={restore} disabled={restoring} className={ACTION_BTN} title="Restaurar de la paperera">
          <RotateCcw className={ACTION_ICON} aria-hidden="true" />
          {restoring ? '…' : 'Restaurar'}
        </button>
        <button type="button" onClick={purge} disabled={purging} className={`${ACTION_BTN} ap-btn--danger`} aria-label={`Eliminar permanentment dossier de ${nom}`} title="Eliminar permanentment">
          <XCircle className={ACTION_ICON} aria-hidden="true" />
          {purging ? '…' : 'Eliminar'}
        </button>
      </div>
    );
  }

  return (
    <div className={ACTIONS_WRAP}>
      <button type="button" onClick={preview} className={ACTION_BTN} title="Previsualitzar">
        <Eye className={ACTION_ICON} aria-hidden="true" />
        Vista
      </button>
      <button type="button" onClick={openCompositePdf} className={`${ACTION_BTN} ap-btn--primary`} title="Obrir dossier + fitxes en un sol PDF">
        <FileText className={ACTION_ICON} aria-hidden="true" />
        PDF complet
      </button>
      {email && (
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className={ACTION_BTN}
          title={alreadySent ? 'Reenviar' : 'Enviar per email'}
        >
          <Send className={ACTION_ICON} aria-hidden="true" />
          {sending ? '…' : alreadySent ? 'Reenviar' : 'Enviar'}
        </button>
      )}
      <button
        type="button"
        onClick={moveToTrash}
        disabled={deleting}
        className={`${ACTION_BTN} ap-btn--danger`}
        aria-label={`Mou a la paperera dossier de ${nom}`}
        title="Moure a la paperera (30 dies per restaurar)"
      >
        <Trash2 className={ACTION_ICON} aria-hidden="true" />
        {deleting ? '…' : 'Paperera'}
      </button>
    </div>
  );
}
