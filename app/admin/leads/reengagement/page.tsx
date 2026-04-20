import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';
import { loadReengagementCandidates } from '@/lib/services/leadReengagementService';
import LeadReengagementClient from './LeadReengagementClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reengagement leads | Òrbita Admin',
};

export default async function LeadReengagementPage() {
  const candidates = await loadReengagementCandidates();

  // Serialize dates for client component
  const serialized = candidates.map((c) => ({
    ...c,
    eventDate: c.eventDate ? c.eventDate.toISOString() : null,
  }));

  return (
    <AdminPage
      title="Reengagement de leads"
      subtitle="Leads dormants, pressupostos sense resposta i negociacions refredades"
      actions={
        <Link
          href="/admin/leads"
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
        >
          ← Tornar al pipeline
        </Link>
      }
    >
      <LeadReengagementClient initialCandidates={serialized} />
    </AdminPage>
  );
}
