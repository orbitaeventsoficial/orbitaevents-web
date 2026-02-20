'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('admin.leads.view');
    if (saved === 'list' || saved === 'pipeline') {
      setView(saved);
    }
  }, []);

  const setViewAndPersist = (nextView: 'list' | 'pipeline') => {
    setView(nextView);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('admin.leads.view', nextView);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewAndPersist('list')}
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
          onClick={() => setViewAndPersist('pipeline')}
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
