import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchCustomerHub } from '@/lib/customer-hub/fetchCustomerHub';
import CustomerHubClient from './_components/CustomerHubClient';
import { log } from '@/lib/logger';
import './customer-hub.css';

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
    <div className="ch__root">
      <div className="ch__skeleton-header">
        <div className="ch__skeleton-header-bar" />
        <div className="ch__skeleton-header-bar" />
        <div className="ch__skeleton-header-bar" />
      </div>
      <div className="ch__grid">
        <div className="ch__main">
          <div className="ch__skeleton">
            <div className="ch__skeleton-bar" />
            <div className="ch__skeleton-bar" />
            <div className="ch__skeleton-bar" />
            <div className="ch__skeleton-bar" />
          </div>
        </div>
        <div className="ch__aside">
          <div className="ch__skeleton">
            <div className="ch__skeleton-bar" />
            <div className="ch__skeleton-bar" />
            <div className="ch__skeleton-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
