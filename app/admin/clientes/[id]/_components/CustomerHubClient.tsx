'use client';

import './customer-hub.css';
import { Component, createContext, useCallback, useContext, useEffect, useState, useTransition, type ReactNode } from 'react';
import { log } from '@/lib/logger';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import CustomerHeader from './CustomerHeader';
import TimelinePanel from './TimelinePanel';
import dynamic from 'next/dynamic';
import { ADMIN_CUSTOMER_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildCustomerWorkspaceTabHref, parseCustomerWorkspaceTab, type CustomerWorkspaceTab } from '@/lib/admin/customerWorkspaceHref';
import { getCustomerHubTaskNotice } from '@/lib/customer-hub/taskResultNotice';

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

const LeadsPanel = dynamic(() => import('./panels/LeadsPanel'), {
  loading: () => <PanelSkeleton />,
});

const PrivacyPanel = dynamic(() => import('./panels/PrivacyPanel'), {
  loading: () => <PanelSkeleton />,
});

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

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
    log.error(`Error al panell ${this.props.panelName}:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="ch__pnl-err">
            <p className="ch__pnl-err-title">Error carregant {this.props.panelName}</p>
            <p className="ch__pnl-err-msg">
              {this.state.error?.message || 'Error desconegut'}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="ch__pnl-err-btn"
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

function PanelSkeleton() {
  return (
    <div className="ch__skeleton">
      <div className="ch__skeleton-bar" />
      <div className="ch__skeleton-bar" />
      <div className="ch__skeleton-bar" />
      <div className="ch__skeleton-bar" />
    </div>
  );
}

export default function CustomerHubClient({ initial }: { initial: CustomerHubDTO }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab = parseCustomerWorkspaceTab(searchParams?.get('tab')) ?? 'summary';
  const initialTaskNotice = getCustomerHubTaskNotice(searchParams?.get('taskSource'), searchParams?.get('taskResult'));
  const [tab, setTab] = useState<CustomerWorkspaceTab>(initialTab);
  const [taskNotice, setTaskNotice] = useState<string | null>(initialTaskNotice);
  const [data, setData] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialTaskNotice) return;

    const taskSource = searchParams?.get('taskSource');
    const taskResult = searchParams?.get('taskResult');
    if (!taskSource || !taskResult) return;

    const cleanHref = pathname
      ? `${pathname}?tab=tasks`
      : buildCustomerWorkspaceTabHref(initial.customer.id, 'tasks');

    router.replace(cleanHref, { scroll: false });
  }, [initial.customer.id, initialTaskNotice, pathname, router, searchParams]);

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
            <TasksNotesPanel data={data} notice={taskNotice} onDismissNotice={() => setTaskNotice(null)} />
          </PanelErrorBoundary>
        );
      case 'discounts':
        return (
          <PanelErrorBoundary panelName="Descomptes">
            <DiscountsPanel data={data} />
          </PanelErrorBoundary>
        );
      case 'leads':
        return (
          <PanelErrorBoundary panelName="Entrades vinculades">
            <LeadsPanel data={data} />
          </PanelErrorBoundary>
        );
      case 'privacy':
        return (
          <PanelErrorBoundary panelName="Privacitat">
            <PrivacyPanel />
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
      <div className="ch__root">
        <CustomerHeader data={data} tab={tab} setTab={setTab} />

        {refreshError && (
          <div className="ch__alert">
            <div className="ch__alert-inner" {...helpAttrs(ADMIN_CUSTOMER_HELP.hub.refreshError)}>
              {refreshError}
              <button
                type="button"
                onClick={refresh}
                className="ch__alert-btn"
              >
                Torna a intentar
              </button>
            </div>
          </div>
        )}

        {isPending && (
          <div className="ch__alert">
            <div className="ch__alert-inner" {...helpAttrs(ADMIN_CUSTOMER_HELP.hub.refreshing)}>
              <span className="ch__spin">⟳</span>
              Actualitzant dades...
            </div>
          </div>
        )}

        <div className="ch__grid" {...helpAttrs(ADMIN_CUSTOMER_HELP.hub.layout)}>
          <div className="ch__main" {...helpAttrs(ADMIN_CUSTOMER_HELP.hub.mainPanel)}>
            {renderPanel()}
          </div>
          <div className="ch__aside" {...helpAttrs(ADMIN_CUSTOMER_HELP.hub.timeline)}>
            <PanelErrorBoundary panelName="Timeline">
              <TimelinePanel
                timeline={data.timeline}
                customerId={data.customer.id}
                customerName={data.customer.name}
                customerPhone={data.customer.phone}
                insights={data.insights}
                followUpSummary={data.followUpSummary}
              />
            </PanelErrorBoundary>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isPending}
          className="ch__fab"
          aria-label={ADMIN_CUSTOMER_HELP.hub.refresh.title}
          {...helpAttrs(ADMIN_CUSTOMER_HELP.hub.refresh)}
        >
          <span className={isPending ? 'ch__spin' : ''}>🔄</span>
        </button>
      </div>
    </HubContext.Provider>
  );
}
