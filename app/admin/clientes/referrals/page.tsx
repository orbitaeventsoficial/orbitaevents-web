import Link from 'next/link';
import { AdminPage } from '../../components/AdminPage';
import { loadReferralsSummary } from '@/lib/services/referralsService';
import ReferralsClient from './ReferralsClient';
import './referrals.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Referrals | Òrbita Admin',
};

export default async function ReferralsPage() {
  const summary = await loadReferralsSummary();

  return (
    <AdminPage
      title="Programa de referrals"
      subtitle={`${summary.stats.totalReferrers} clients han portat ${summary.stats.totalReferred} clients nous · ${summary.candidates.length} candidats per preguntar`}
      actions={
        <Link
          href="/admin/clientes"
          className="ap-btn ap-btn--xs"
        >
          ← Tornar al CRM
        </Link>
      }
    >
      <ReferralsClient summary={summary} />
    </AdminPage>
  );
}
