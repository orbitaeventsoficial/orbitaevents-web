import { redirect } from 'next/navigation';

interface Props {
  params: { id: string };
  searchParams?: { tab?: string };
}

export const dynamic = 'force-dynamic';

export default function CustomerLegacyRedirectPage({ params, searchParams }: Props) {
  const tab = searchParams?.tab?.trim();
  const suffix = tab ? `?tab=${encodeURIComponent(tab)}` : '';
  redirect(`/admin/contactes/${params.id}${suffix}`);
}

