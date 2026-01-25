'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LeadActionsProps {
  leadId: string;
  leadName: string;
  phone?: string | null;
  hasBooking: boolean;
}

export default function LeadActions({ leadId, leadName, phone, hasBooking }: LeadActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (hasBooking) {
      alert('No es pot eliminar un lead amb reserva associada');
      return;
    }

    if (!confirm(`Segur que vols eliminar el lead "${leadName}"?\n\nAquesta acció no es pot desfer.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error eliminant lead');
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error eliminant lead');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {phone && (
        <a
          href={`https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
            `Hola ${leadName}! Sóc de Òrbita Events, hem rebut la teva sol·licitud i volem ajudar-te a organitzar el teu event.`
          )}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 transition-colors shadow-sm"
          title="Enviar WhatsApp"
        >
          💬 WA
        </a>
      )}
      <Link
        href={`/admin/leads/${leadId}`}
        className="inline-flex items-center rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-amber-100 border border-amber-200 transition-colors"
      >
        Veure
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting || hasBooking}
        type="button"
        aria-busy={isDeleting}
        className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors
          ${hasBooking
            ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
          }`}
        title={hasBooking ? 'No es pot eliminar (té reserva)' : 'Eliminar lead'}
      >
        {isDeleting ? '...' : '🗑️'}
      </button>
    </div>
  );
}
