'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

type PipelineFilters = {
  status: string[];
  priority: string[];
  eventType: string[];
  source: string[];
  q: string;
  from?: string | null;
  to?: string | null;
};

const LeadPipelineView = dynamic(() => import('./LeadPipelineView'), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
    </div>
  ),
});

export default function LeadViewToggle({
  children,
  pipelineFilters,
}: {
  children: React.ReactNode;
  pipelineFilters: PipelineFilters;
}) {
  const [view, setView] = useState<'list' | 'pipeline'>('pipeline');

  return (
    <>
      <div
        className="flex items-center justify-center sm:justify-start gap-2"
        data-help-title="Canvi de vista d'entrades"
        data-help-desc="Pipeline per avançar oportunitats d'una etapa a una altra. Llista per revisar cada entrada amb més detall."
      >
        <label htmlFor="lead-view-mode" className="text-xs font-medium">
          Vista
        </label>
        <select
          id="lead-view-mode"
          value={view}
          onChange={(e) => setView(e.target.value === 'pipeline' ? 'pipeline' : 'list')}
          className="rounded-xl border px-3 py-1.5 text-xs font-medium"
        >
          <option value="pipeline">Pipeline</option>
          <option value="list">Llista</option>
        </select>
      </div>

      {view === 'list' ? children : <LeadPipelineView filters={pipelineFilters} />}
    </>
  );
}
