'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function BookingViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams?.get('view') || 'list';

  const toggle = (view: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (view === 'list') {
      params.delete('view');
    } else {
      params.set('view', view);
    }
    params.delete('page');
    router.push(`/admin/bookings?${params.toString()}`);
  };

  return (
    <div
      role="tablist"
      aria-label="Vista de reserves"
      data-help-title="Canvi de vista de reserves"
      data-help-desc="Llista per revisar detall i accions concretes. Kanban per moure reserves ràpidament entre estats."
      className="admin-tone-border-neutral admin-tone-bg-neutral flex shrink-0 overflow-hidden rounded-xl border"
    >
      <button
        type="button"
        role="tab"
        aria-selected={current === 'list'}
        onClick={() => toggle('list')}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          current === 'list'
            ? 'admin-tone-bg-info admin-tone-text-info font-semibold'
            : 'admin-tone-text-neutral hover:brightness-105'
        }`}
      >
        Llista
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={current === 'kanban'}
        onClick={() => toggle('kanban')}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          current === 'kanban'
            ? 'admin-tone-bg-info admin-tone-text-info font-semibold'
            : 'admin-tone-text-neutral hover:brightness-105'
        }`}
      >
        Kanban
      </button>
    </div>
  );
}
