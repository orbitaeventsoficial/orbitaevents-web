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
    <div className="flex rounded-xl border overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => toggle('list')}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          current === 'list'
            ? 'bg-white/10 font-semibold'
            : 'hover:bg-white/5'
        }`}
      >
        Llista
      </button>
      <button
        type="button"
        onClick={() => toggle('kanban')}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          current === 'kanban'
            ? 'bg-white/10 font-semibold'
            : 'hover:bg-white/5'
        }`}
      >
        Kanban
      </button>
    </div>
  );
}
