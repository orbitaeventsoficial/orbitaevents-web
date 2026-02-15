import { redirect } from 'next/navigation';

interface Props {
  params: { id: string };
  searchParams?: { tab?: string };
}

export default function ContactesCustomerRedirect({ params, searchParams }: Props) {
  const tab = searchParams?.tab ? `?tab=${encodeURIComponent(searchParams.tab)}` : '';
  redirect(`/admin/clientes/${params.id}${tab}`);
}
