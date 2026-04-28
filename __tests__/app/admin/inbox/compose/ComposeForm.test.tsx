import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ComposeForm from '@/app/admin/inbox/compose/ComposeForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/services/inboxTemplateService', () => ({
  generateSmartTemplates: vi.fn(() => []),
  generateAllTemplates: vi.fn(() => []),
}));

const LEADS = [
  {
    id: 'lead-1',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    eventType: 'WEDDING',
    eventDate: new Date('2026-08-20T18:00:00.000Z'),
    eventLocation: 'Sitges',
    guestCount: 120,
    budget: null,
    status: 'QUOTE_SENT',
    preferredLocale: 'ca',
    interestedPackId: null,
    interestedExtras: [],
    message: 'Hola',
  },
];

describe('ComposeForm', () => {
  it('preselecciona el lead rebut per query i carrega el seu email', async () => {
    render(
      <ComposeForm
        leads={LEADS}
        packs={[]}
        returnHref="/admin/leads/lead-1"
        initialLeadId="lead-1"
      />
    );

    expect(screen.getByLabelText('Selecciona entrada')).toHaveValue('lead-1');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('email@exemple.com')).toHaveValue('maria@example.com');
    });
  });
});
