// REDIRECT: /contactes/[id] és l'antic nom, ara tot va a /clientes/[id]
import { redirect } from 'next/navigation';

interface Props {
  params: { id: string };
  searchParams?: { tab?: string };
}

export const dynamic = 'force-dynamic';

export default function ContactesLegacyRedirectPage({ params, searchParams }: Props) {
  const tab = searchParams?.tab?.trim();
  const suffix = tab ? `?tab=${encodeURIComponent(tab)}` : '';
  redirect(`/admin/clientes/${params.id}${suffix}`);
}
