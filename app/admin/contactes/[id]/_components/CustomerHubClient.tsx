'use client';

import { useMemo, useState } from 'react';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import CustomerHeader from './CustomerHeader';
import TimelinePanel from './TimelinePanel';
import SummaryPanel from './panels/SummaryPanel';
import ProposalsPanel from './panels/ProposalsPanel';
import BookingsPanel from './panels/BookingsPanel';
import MarginExtrasPanel from './panels/MarginExtrasPanel';
import CommsPanel from './panels/CommsPanel';
import TasksNotesPanel from './panels/TasksNotesPanel';

type TabKey = 'summary' | 'proposals' | 'bookings' | 'margin' | 'comms' | 'tasks';

export default function CustomerHubClient({ initial }: { initial: CustomerHubDTO }) {
  const [tab, setTab] = useState<TabKey>('summary');

  const panel = useMemo(() => {
    if (tab === 'proposals') return <ProposalsPanel data={initial} />;
    if (tab === 'bookings') return <BookingsPanel data={initial} />;
    if (tab === 'margin') return <MarginExtrasPanel data={initial} activeProposalId={initial.active.proposalId} />;
    if (tab === 'comms') return <CommsPanel data={initial} />;
    if (tab === 'tasks') return <TasksNotesPanel data={initial} />;
    return <SummaryPanel data={initial} />;
  }, [tab, initial]);

  return (
    <div className="space-y-4">
      <CustomerHeader data={initial} tab={tab} setTab={setTab} />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pb-6 lg:grid-cols-12">
        <div className="lg:col-span-8">{panel}</div>
        <div className="lg:col-span-4">
          <TimelinePanel timeline={initial.timeline} />
        </div>
      </div>
    </div>
  );
}

