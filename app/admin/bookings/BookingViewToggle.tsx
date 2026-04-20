'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { buildCustomerBookingListHref } from '@/lib/admin/customerWorkspaceHref';

function buildBookingsHref(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/admin/bookings?${query}` : '/admin/bookings';
}

export default function BookingViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams?.get('customerId') || '';
  const current = searchParams?.get('view') || 'list';

  const toggle = (view: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (view === 'list') {
      params.delete('view');
    } else {
      params.set('view', view);
    }
    params.delete('page');
    router.push(
      customerId
        ? buildCustomerBookingListHref(customerId, {
            view: params.get('view'),
            status: params.get('status'),
            eventType: params.get('eventType'),
            payment: params.get('payment'),
            fromDate: params.get('fromDate'),
            toDate: params.get('toDate'),
            search: params.get('search'),
            page: params.get('page') ? Number(params.get('page')) : null,
          })
        : buildBookingsHref(params)
    );
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
