'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { ANIMACIO_PRODUCTS } from '@/lib/constants/animacio-products';
import { buildDossierHtml, type DossierClientInfo } from '@/lib/utils/dossier-html-builder';

interface Props {
  dossierId: string;
  email?: string;
  nom: string;
  productIds: string[];
  clientInfo: DossierClientInfo;
  alreadySent: boolean;
}

export function LeadDossierActions({ dossierId, email, nom, productIds, clientInfo, alreadySent }: Props) {
  const toast = useToast();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function preview() {
    const products = ANIMACIO_PRODUCTS.filter((p) => productIds.includes(p.id));
    const html = buildDossierHtml(clientInfo, products);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
  }

  async function send() {
    if (!email) {
      toast.error('El dossier no té email de destinatari');
      return;
    }
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
      console.error('[LeadDossierActions] send error:', err);
      toast.error(err instanceof Error ? err.message : 'Error enviant el dossier');
    } finally {
      setSending(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await fetchWithCsrf(`/api/admin/dossiers/${dossierId}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      console.error('[LeadDossierActions] delete error:', err);
      toast.error('Error eliminant el dossier');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={preview}
        className="ap-btn ap-btn--ghost text-xs px-2 py-1"
        title="Previsualitzar"
      >
        Vista
      </button>
      {email && (
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="ap-btn ap-btn--secondary text-xs px-2 py-1"
          title={alreadySent ? 'Reenviar dossier' : 'Enviar per email'}
        >
          {sending ? '…' : alreadySent ? 'Reenviar' : 'Enviar'}
        </button>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={deleting}
        className="ap-btn ap-btn--danger text-xs px-2 py-1"
        title="Eliminar dossier"
        aria-label={`Eliminar dossier de ${nom}`}
      >
        ✕
      </button>
    </div>
  );
}
