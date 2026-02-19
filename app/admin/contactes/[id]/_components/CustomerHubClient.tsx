'use client';

import { Component, createContext, useCallback, useContext, useState, useTransition, type ReactNode } from 'react';
import { log } from '@/lib/logger';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import CustomerHeader from './CustomerHeader';
import TimelinePanel from './TimelinePanel';
import dynamic from 'next/dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// LAZY LOADING DELS PANELS
// Només el SummaryPanel es carrega immediatament, la resta sota demanda
// ═══════════════════════════════════════════════════════════════════════════

const SummaryPanel = dynamic(() => import('./panels/SummaryPanel'), {
  loading: () => <PanelSkeleton />,
});

const ProposalsPanel = dynamic(() => import('./panels/ProposalsPanel'), {
  loading: () => <PanelSkeleton />,
});

const BookingsPanel = dynamic(() => import('./panels/BookingsPanel'), {
  loading: () => <PanelSkeleton />,
});

const MarginExtrasPanel = dynamic(() => import('./panels/MarginExtrasPanel'), {
  loading: () => <PanelSkeleton />,
});

const CommsPanel = dynamic(() => import('./panels/CommsPanel'), {
  loading: () => <PanelSkeleton />,
});

const TasksNotesPanel = dynamic(() => import('./panels/TasksNotesPanel'), {
  loading: () => <PanelSkeleton />,
});

const DiscountsPanel = dynamic(() => import('./panels/DiscountsPanel'), {
  loading: () => <PanelSkeleton />,
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT PER COMPARTIR REFRESH ENTRE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

type HubContextValue = {
  data: CustomerHubDTO;
  refreshing: boolean;
  refresh: () => void;
  customerId: string;
};

const HubContext = createContext<HubContextValue | null>(null);

export function useHubContext() {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHubContext must be used within CustomerHubClient');
  return ctx;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY PER PANELS
// ═══════════════════════════════════════════════════════════════════════════

type ErrorBoundaryState = { hasError: boolean; error?: Error };

class PanelErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; panelName: string },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode; panelName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error(`Error al panell ${this.props.panelName}:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5">
            <p className="text-sm font-semibold text-rose-200">
              Error carregant {this.props.panelName}
            </p>
            <p className="mt-1 text-xs text-rose-300/70">
              {this.state.error?.message || 'Error desconegut'}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
            >
              Torna a intentar
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON LOADING
// ═══════════════════════════════════════════════════════════════════════════

function PanelSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <div className="h-6 w-1/3 rounded bg-slate-700/50" />
      <div className="mt-2 h-4 w-2/3 rounded bg-slate-700/30" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800/50" />
        ))}
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <aside className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
      <div className="h-5 w-1/2 rounded bg-slate-700/50" />
      <div className="mt-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-800/50" />
        ))}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════

type TabKey = 'summary' | 'proposals' | 'bookings' | 'margin' | 'comms' | 'tasks' | 'discounts';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'summary', label: 'Resum', icon: '📊' },
  { key: 'proposals', label: 'Pressupostos', icon: '📄' },
  { key: 'bookings', label: 'Reserves', icon: '📅' },
  { key: 'margin', label: 'Marge', icon: '💰' },
  { key: 'comms', label: 'Comunicacions', icon: '💬' },
  { key: 'tasks', label: 'Tasques', icon: '✅' },
  { key: 'discounts', label: 'Descomptes', icon: '🏷️' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function CustomerHubClient({ initial }: { initial: CustomerHubDTO }) {
  const [tab, setTab] = useState<TabKey>('summary');
  const [data, setData] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        setRefreshError(null);
        const res = await fetch(`/api/admin/customers/${initial.customer.id}/hub`);
        if (!res.ok) throw new Error('Error refrescant dades');
        const json = await res.json();
        if (json?.data) {
          setData(json.data);
        }
      } catch (err) {
        setRefreshError(err instanceof Error ? err.message : 'Error refrescant');
        // No fa re-throw, només mostra error
      }
    });
  }, [initial.customer.id]);

  const contextValue: HubContextValue = {
    data,
    refreshing: isPending,
    refresh,
    customerId: data.customer.id,
  };

  const renderPanel = () => {
    switch (tab) {
      case 'proposals':
        return (
          <PanelErrorBoundary panelName="Pressupostos">
            <ProposalsPanel data={data} />
          </PanelErrorBoundary>
        );
      case 'bookings':
        return (
          <PanelErrorBoundary panelName="Reserves">
            <BookingsPanel data={data} />
          </PanelErrorBoundary>
        );
      case 'margin':
        return (
          <PanelErrorBoundary panelName="Marge">
            <MarginExtrasPanel data={data} activeProposalId={data.active.proposalId} />
          </PanelErrorBoundary>
        );
      case 'comms':
        return (
          <PanelErrorBoundary panelName="Comunicacions">
            <CommsPanel data={data} />
          </PanelErrorBoundary>
        );
      case 'tasks':
        return (
          <PanelErrorBoundary panelName="Tasques">
            <TasksNotesPanel data={data} />
          </PanelErrorBoundary>
        );
      case 'discounts':
        return (
          <PanelErrorBoundary panelName="Descomptes">
            <DiscountsPanel data={data} />
          </PanelErrorBoundary>
        );
      default:
        return (
          <PanelErrorBoundary panelName="Resum">
            <SummaryPanel data={data} />
          </PanelErrorBoundary>
        );
    }
  };

  return (
    <HubContext.Provider value={contextValue}>
      <div className="space-y-4">
        {/* Header */}
        <CustomerHeader data={data} tab={tab} setTab={setTab} />

        {/* Refresh error banner */}
        {refreshError && (
          <div className="mx-auto max-w-7xl px-4">
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
              {refreshError}
              <button
                type="button"
                onClick={refresh}
                className="ml-2 underline hover:no-underline"
              >
                Torna a intentar
              </button>
            </div>
          </div>
        )}

        {/* Refreshing indicator */}
        {isPending && (
          <div className="mx-auto max-w-7xl px-4">
            <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              <span className="mr-2 inline-block animate-spin">⟳</span>
              Actualitzant dades...
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pb-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {renderPanel()}
          </div>
          <div className="lg:col-span-4">
            <PanelErrorBoundary panelName="Timeline">
              <TimelinePanel timeline={data.timeline} />
            </PanelErrorBoundary>
          </div>
        </div>

        {/* Floating refresh button (mobile) */}
        <button
          type="button"
          onClick={refresh}
          disabled={isPending}
          className="fixed bottom-20 right-4 z-40 rounded-full bg-slate-800 p-3 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 lg:hidden"
          aria-label="Refrescar dades"
        >
          <span className={isPending ? 'inline-block animate-spin' : ''}>🔄</span>
        </button>
      </div>
    </HubContext.Provider>
  );
}
