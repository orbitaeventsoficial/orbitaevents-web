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
  const [view, setView] = useState<'list' | 'pipeline'>('list');

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setView('list')}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
            view === 'list'
              ? 'bg-slate-100 text-slate-900'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Llista
        </button>
        <button
          type="button"
          onClick={() => setView('pipeline')}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
            view === 'pipeline'
              ? 'bg-slate-100 text-slate-900'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Pipeline
        </button>
      </div>

      {view === 'list' ? children : <LeadPipelineView filters={pipelineFilters} />}
    </>
  );
}
