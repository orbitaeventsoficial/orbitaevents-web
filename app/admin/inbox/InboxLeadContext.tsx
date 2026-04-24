'use client';

import Link from 'next/link';
import { scoreLead } from '@/lib/services/commercialScoring';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import type { LeadData } from './inbox-types';

const BAND_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HIGH: { label: 'Alt', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  MEDIUM: { label: 'Mitjà', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30' },
  LOW: { label: 'Baix', color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-500/30' },
};

function getSmartHint(lead: LeadData, band: string): { label: string; urgency: 'HIGH' | 'MEDIUM' | 'LOW' } {
  const hoursOld = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);

  if (lead.status === 'NEW' && hoursOld > 4) {
    return { label: 'Contactar urgentment — porta més de 4h sense resposta', urgency: 'HIGH' };
  }
  if (lead.status === 'NEW') {
    return { label: 'Primer contacte — respondre ràpid augmenta la conversió', urgency: 'MEDIUM' };
  }
  if (lead.status === 'CONTACTED' || lead.status === 'NEGOTIATING') {
    return { label: 'Enviar pressupost personalitzat per avançar la conversió', urgency: 'MEDIUM' };
  }
  if (lead.status === 'QUOTE_SENT') {
    return { label: 'Fer seguiment del pressupost — no deixar refredar', urgency: band === 'HIGH' ? 'HIGH' : 'MEDIUM' };
  }
  if (lead.status === 'VISIT_DONE' || lead.status === 'QUALIFIED') {
    return { label: 'Tancar acord — el lead ja està qualificat', urgency: 'HIGH' };
  }
  return { label: 'Respon o obre el lead per continuar la conversió', urgency: 'LOW' };
}

export default function InboxLeadContext({ lead }: { lead: LeadData }) {
  const score = scoreLead({
    status: lead.status,
    createdAt: new Date(lead.createdAt),
    updatedAt: new Date(lead.updatedAt),
    eventDate: lead.eventDate ? new Date(lead.eventDate) : null,
    budget: lead.budget,
    phone: lead.phone,
    eventLocation: lead.eventLocation,
    guestCount: lead.guestCount,
    interestedPackId: lead.interestedPackId,
    source: lead.source,
  });

  const band = BAND_CONFIG[score.band] || BAND_CONFIG.LOW;
  const hint = getSmartHint(lead, score.band);
  const daysOld = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilEvent = lead.eventDate
    ? Math.ceil((new Date(lead.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const URGENCY_BG: Record<string, string> = {
    HIGH: 'border-rose-500/40 bg-rose-500/10',
    MEDIUM: 'border-amber-500/40 bg-amber-500/10',
    LOW: 'border-white/10 bg-white/[0.03]',
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2 mb-6">
      {/* Smart Action */}
      <div className={`rounded-xl border p-3 ${URGENCY_BG[hint.urgency]}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Acció recomanada</p>
        <p className="mt-1 text-sm font-semibold">{hint.label}</p>
        <Link
          href={buildLeadWorkspaceHref(lead.id)}
          className="mt-2 inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-semibold hover:bg-white/10 transition-colors"
        >
          Obrir lead complet
        </Link>
      </div>

      {/* Score + Context */}
      <div className={`rounded-xl border p-3 ${band.bg}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Puntuació comercial</p>
        <p className={`mt-1 text-lg font-bold ${band.color}`}>
          {score.score} · {band.label}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-70">
          <span>Creat fa {daysOld}d</span>
          {daysUntilEvent != null && daysUntilEvent >= 0 && <span>Event en {daysUntilEvent}d</span>}
          {daysUntilEvent != null && daysUntilEvent < 0 && <span className="text-rose-300">Event ja passat</span>}
          {score.riskFlags.length > 0 && (
            <span className="text-amber-300">{score.riskFlags.length} risc{score.riskFlags.length > 1 ? 'os' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}
