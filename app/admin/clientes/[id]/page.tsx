import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchCustomerHub } from '@/lib/customer-hub/fetchCustomerHub';
import CustomerHubClient from './_components/CustomerHubClient';
import { log } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  try {
    const data = await fetchCustomerHub(params.id);
    return {
      title: `${data.customer.name} - Fitxa Client | Admin`,
      description: `Gestió del client ${data.customer.name}`,
    };
  } catch (error) {
    log.warn('[customerHub] metadata fallback', { error: error instanceof Error ? error.message : String(error) });
    return {
      title: 'Client no trobat | Admin',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CustomerHubPage({ params }: Props) {
  return (
    <Suspense fallback={<CustomerHubSkeleton />}>
      <CustomerHubLoader id={params.id} />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADER (async server component)
// ═══════════════════════════════════════════════════════════════════════════

async function CustomerHubLoader({ id }: { id: string }) {
  try {
    const data = await fetchCustomerHub(id);
    return <CustomerHubClient initial={data} />;
  } catch (error) {
    log.warn('[customerHub] not found', { error: error instanceof Error ? error.message : String(error) });
    notFound();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON LOADING
// ═══════════════════════════════════════════════════════════════════════════

function CustomerHubSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="flex flex-col gap-3 border-b border-[var(--o-admin-line)] px-4 py-5">
        <div className="skeleton h-3.5 w-[30%] rounded-[var(--o-r-sm)]" />
        <div className="skeleton h-3.5 w-[55%] rounded-[var(--o-r-sm)]" />
        <div className="skeleton h-3.5 w-[80%] rounded-[var(--o-r-sm)]" />
      </div>
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 p-4 pb-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] p-5">
            <div className="skeleton mb-2 h-3 w-full rounded-[var(--o-r-sm)]" />
            <div className="skeleton mb-2 h-3 w-[72%] rounded-[var(--o-r-sm)]" />
            <div className="skeleton mb-2 h-3 w-[48%] rounded-[var(--o-r-sm)]" />
            <div className="skeleton h-3 w-[65%] rounded-[var(--o-r-sm)]" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-1)] p-5">
            <div className="skeleton mb-2 h-3 w-full rounded-[var(--o-r-sm)]" />
            <div className="skeleton mb-2 h-3 w-[72%] rounded-[var(--o-r-sm)]" />
            <div className="skeleton h-3 w-[48%] rounded-[var(--o-r-sm)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
