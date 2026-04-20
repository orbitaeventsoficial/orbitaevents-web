import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';
import { loadReactivationCandidates } from '@/lib/services/reactivationService';
import ReactivationClient from './ReactivationClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reactivació clients | Òrbita Admin',
};

export default async function ReactivationPage() {
  const candidates = await loadReactivationCandidates();

  return (
    <AdminPage
      title="Reactivació de clients"
      subtitle="Clients dormants, en risc o d'alt valor amb missatge suggerit"
      actions={
        <Link
          href="/admin/clientes"
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
        >
          ← Tornar al CRM
        </Link>
      }
    >
      <ReactivationClient initialCandidates={candidates} />
    </AdminPage>
  );
}
