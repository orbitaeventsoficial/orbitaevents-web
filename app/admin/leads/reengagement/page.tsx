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

  const serialized = candidates.map((c) => ({
    ...c,
    eventDate: c.eventDate ? c.eventDate.toISOString() : null,
  }));

  return (
    <AdminPage
      title="Reengagement"
      subtitle="Leads dormants, pressupostos sense resposta i negociacions refredades"
      back={{ href: '/admin/leads', label: 'Agenda' }}
      actions={
        <Link href="/admin/leads" className="ap-btn ap-btn--xs">
          ← Tornar al pipeline
        </Link>
      }
    >
      <LeadReengagementClient initialCandidates={serialized} />
    </AdminPage>
  );
}
