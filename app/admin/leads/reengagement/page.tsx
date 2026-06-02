import './reengagement.css';
import Link from 'next/link';
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
    <div className="lr__root">
      <div className="lr__header">
        <div className="lr__hero">
          <div className="lr__breadcrumb">
            <Link href="/admin/leads" className="lr__back">Agenda</Link>
            <span className="lr__bread-sep">›</span>
            <span>Reengagement</span>
          </div>
          <div className="lr__toprow">
            <div>
              <p className="lr__eyebrow">Leads</p>
              <h1 className="lr__h1">Reengagement</h1>
              <p className="lr__subtitle">Leads dormants, pressupostos sense resposta i negociacions refredades</p>
            </div>
            <Link href="/admin/leads" className="lr__btn">← Tornar al pipeline</Link>
          </div>
        </div>
      </div>
      <LeadReengagementClient initialCandidates={serialized} />
    </div>
  );
}
