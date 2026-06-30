'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { buildDossierHtml, type DossierClientInfo, type DossierCopy } from '@/lib/utils/dossier-html-builder';

interface Props {
  dossierId: string;
  email?: string;
  nom: string;
  productIds: string[];
  products: AnimacioProduct[];
  clientInfo: DossierClientInfo;
  dossierCopy: DossierCopy;
  alreadySent: boolean;
  logoDataUri?: string;
  isDeleted?: boolean;
}

export function DossierListActions({ dossierId, email, nom, productIds, products, clientInfo, dossierCopy, alreadySent, logoDataUri, isDeleted }: Props) {
  const toast = useToast();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purging, setPurging] = useState(false);

  function preview() {
    try {
      const filteredProducts = products.filter((p) => productIds.includes(p.id));
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
        const data = await res.json() as { error?: string };
        throw new Error(data.error || 'Error enviant');
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
      await fetchWithCsrf(`/api/admin/dossiers/${dossierId}`, { method: 'DELETE' });
      toast.success('Dossier mogut a la paperera (30 dies per restaurar)');
      router.refresh();
    } catch (err) {
      console.error('[DossierListActions] delete error:', err);
      toast.error('Error movent el dossier a la paperera');
    } finally {
      setDeleting(false);
    }
  }

  async function restore() {
    setRestoring(true);
    try {
      await fetchWithCsrf(`/api/admin/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      toast.success('Dossier restaurat');
      router.refresh();
    } catch (err) {
      console.error('[DossierListActions] restore error:', err);
      toast.error('Error restaurant el dossier');
    } finally {
      setRestoring(false);
    }
  }

  async function purge() {
    setPurging(true);
    try {
      await fetchWithCsrf(`/api/admin/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge' }),
      });
      toast.success('Dossier eliminat permanentment');
      router.refresh();
    } catch (err) {
      console.error('[DossierListActions] purge error:', err);
      toast.error('Error eliminant el dossier');
    } finally {
      setPurging(false);
    }
  }

  if (isDeleted) {
    return (
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={preview} className="ap-btn ap-btn--xs" title="Previsualitzar">
          Vista
        </button>
        <button type="button" onClick={openCompositePdf} className="ap-btn ap-btn--primary ap-btn--xs" title="Obrir dossier + fitxes en un sol PDF">
          PDF complet
        </button>
        <button type="button" onClick={restore} disabled={restoring} className="ap-btn ap-btn--xs" title="Restaurar de la paperera">
          {restoring ? '…' : '↩ Restaurar'}
        </button>
        <button type="button" onClick={purge} disabled={purging} className="ap-btn ap-btn--danger ap-btn--xs" aria-label={`Eliminar permanentment dossier de ${nom}`} title="Eliminar permanentment">
          {purging ? '…' : '✕ Eliminar'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <button type="button" onClick={preview} className="ap-btn ap-btn--xs" title="Previsualitzar">
        Vista
      </button>
      <button type="button" onClick={openCompositePdf} className="ap-btn ap-btn--primary ap-btn--xs" title="Obrir dossier + fitxes en un sol PDF">
        PDF complet
      </button>
      {email && (
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="ap-btn ap-btn--xs"
          title={alreadySent ? 'Reenviar' : 'Enviar per email'}
        >
          {sending ? '…' : alreadySent ? 'Reenviar' : 'Enviar'}
        </button>
      )}
      <button
        type="button"
        onClick={moveToTrash}
        disabled={deleting}
        className="ap-btn ap-btn--danger ap-btn--xs"
        aria-label={`Mou a la paperera dossier de ${nom}`}
        title="Moure a la paperera (30 dies per restaurar)"
      >
        {deleting ? '…' : '🗑'}
      </button>
    </div>
  );
}
