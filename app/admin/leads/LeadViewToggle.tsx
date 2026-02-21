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
      <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
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
      <div className="flex items-center justify-center sm:justify-start gap-2">
        <label htmlFor="lead-view-mode" className="text-xs font-medium text-slate-400">
          Vista
        </label>
        <select
          id="lead-view-mode"
          value={view}
          onChange={(e) => setView(e.target.value === 'pipeline' ? 'pipeline' : 'list')}
          className="rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        >
          <option value="pipeline">Pipeline</option>
          <option value="list">Llista</option>
        </select>
      </div>

      {view === 'list' ? children : <LeadPipelineView filters={pipelineFilters} />}
    </>
  );
}
