import { notFound } from 'next/navigation';
import { fetchCustomerHub } from '@/lib/customer-hub/fetchCustomerHub';
import CustomerHubClient from './_components/CustomerHubClient';

interface Props {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export default async function CustomerHubPage({ params }: Props) {
  try {
    const data = await fetchCustomerHub(params.id);
    return <CustomerHubClient initial={data} />;
  } catch {
    notFound();
  }
}

