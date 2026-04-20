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
    <div className="animate-pulse space-y-4">
      {/* Header skeleton */}
      <header className="sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 space-y-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 rounded" />
                <div className="h-5 w-20 rounded-full" />
              </div>
              <div className="h-7 w-48 rounded" />
              <div className="h-4 w-64 rounded" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-24 rounded-xl" />
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl" />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 w-28 rounded-xl" />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pb-6 lg:grid-cols-12">
        {/* Main panel */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section 1 */}
          <div className="rounded-2xl border p-5">
            <div className="h-6 w-1/3 rounded" />
            <div className="mt-2 h-4 w-2/3 rounded" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Section 2 */}
          <div className="rounded-2xl border p-5">
            <div className="h-6 w-1/4 rounded" />
            <div className="mt-2 h-4 w-1/2 rounded" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Section 3 */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl border" />
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border p-4">
            <div className="h-5 w-1/2 rounded" />
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
