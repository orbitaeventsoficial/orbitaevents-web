'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '../components/ToastProvider';

type DraftResponse = {
  id?: string;
  status?: 'created' | 'existing';
  dossierId?: string;
  error?: string;
};

export function DossierDraftCreateButton({ leadId, label }: { leadId: string; label: string }) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);

  async function createDraft() {
    setCreating(true);
    try {
      const res = await fetchWithCsrf('/api/admin/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json().catch(() => ({})) as DraftResponse;
      if (!res.ok || !(data.dossierId ?? data.id)) throw new Error(data.error || 'No he pogut crear l’esborrany');
      toast.success(data.status === 'existing' ? 'Aquest lead ja tenia un dossier actiu' : 'Esborrany de dossier creat');
      router.refresh();
    } catch (error) {
      console.error('[DossierDraftCreateButton] createDraft error:', error);
      toast.error(error instanceof Error ? error.message : 'No he pogut crear l’esborrany');
    } finally {
      setCreating(false);
    }
  }

  return (
    <button type="button" className="ap-btn ap-btn--secondary ap-btn--xs" onClick={createDraft} disabled={creating}>
      {creating ? 'Creant...' : label}
    </button>
  );
}
