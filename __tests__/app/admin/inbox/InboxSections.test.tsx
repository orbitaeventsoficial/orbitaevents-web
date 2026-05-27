import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InboxDetailPane } from '@/app/admin/inbox/InboxSections';
import type { UnifiedEmail } from '@/app/admin/inbox/inbox-types';

vi.mock('@/app/admin/inbox/InboxLeadContext', () => ({
  default: () => <div>Lead context</div>,
}));

vi.mock('@/app/admin/inbox/CommSummaryPanel', () => ({
  default: () => <div>Comm summary</div>,
}));

function makeLeadEmail(overrides: Partial<UnifiedEmail> = {}): UnifiedEmail {
  return {
    id: 'lead-1',
    type: 'lead',
    from: 'maria@example.com',
    fromName: 'Maria',
    subject: 'Consulta boda',
    preview: 'Hola',
    date: new Date('2026-04-25T10:00:00.000Z'),
    read: false,
    leadData: {
      id: 'lead-1',
      customerId: null,
      name: 'Maria',
      email: 'maria@example.com',
      phone: '600123123',
      message: 'Hola',
      eventType: 'BODA',
      status: 'NEW',
      preferredLocale: 'ca',
      interestedPackId: null,
      interestedExtras: [],
      budget: null,
      guestCount: 120,
      eventDate: new Date('2026-08-20T18:00:00.000Z'),
      eventLocation: 'Sitges',
      createdAt: new Date('2026-04-25T08:00:00.000Z'),
      updatedAt: new Date('2026-04-25T09:00:00.000Z'),
      source: 'web',
    },
    ...overrides,
  };
}

function renderDetail(selectedEmail: UnifiedEmail, handleOpenLead = vi.fn()) {
  render(
    <InboxDetailPane
      selectedEmail={selectedEmail}
      loadingSelected={false}
      activeTab="all"
      mobileOpen={false}
      onMobileClose={vi.fn()}
      handleReply={vi.fn()}
      handleOpenQuote={vi.fn()}
      handleOpenLead={handleOpenLead}
      handleImportLeadFromEmail={vi.fn()}
      handleMoveToTrash={vi.fn()}
      handleRestoreEmail={vi.fn()}
      handleDeletePermanently={vi.fn()}
    />
  );

  return { handleOpenLead };
}

describe('InboxDetailPane', () => {
  it('manté el CTA cap al lead quan encara no hi ha customerId', () => {
    const { handleOpenLead } = renderDetail(makeLeadEmail());

    fireEvent.click(screen.getByRole('button', { name: '📋 Lead' }));

    expect(handleOpenLead).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'lead-1', customerId: null })
    );
  });

  it('canvia el CTA a client quan el lead ja està vinculat', () => {
    const { handleOpenLead } = renderDetail(
      makeLeadEmail({
        leadData: {
          ...makeLeadEmail().leadData!,
          customerId: 'cust-1',
        },
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '👤 Client' }));

    expect(handleOpenLead).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'lead-1', customerId: 'cust-1' })
    );
  });
});
