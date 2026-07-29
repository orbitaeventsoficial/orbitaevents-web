import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ComposeForm from '@/app/admin/inbox/compose/ComposeForm';
import type { BulkComposeSegmentAudience } from '@/lib/services/bulkComposeSegmentService';

const { generateSmartTemplatesMock, generateAllTemplatesMock } = vi.hoisted(() => ({
  generateSmartTemplatesMock: vi.fn(),
  generateAllTemplatesMock: vi.fn(() => [] as Array<Record<string, unknown>>),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/services/inboxTemplateService', () => ({
  generateSmartTemplates: generateSmartTemplatesMock,
  generateAllTemplates: generateAllTemplatesMock,
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
  {
    id: 'lead-2',
    name: 'Joan Pons',
    email: 'joan@example.com',
    eventType: 'BIRTHDAY',
    eventDate: new Date('2026-09-14T18:00:00.000Z'),
    eventLocation: 'Badalona',
    guestCount: 60,
    budget: null,
    status: 'QUOTE_SENT',
    preferredLocale: 'ca',
    interestedPackId: null,
    interestedExtras: [],
    message: null,
  },
];

const SEGMENT_AUDIENCE: BulkComposeSegmentAudience = {
  key: 'customers-weddings-2025',
  label: 'Clients de bodes 2025',
  description: 'Clients amb reserva de boda durant el 2025 i correu vàlid.',
  recipients: [
    {
      id: 'c1',
      entityType: 'customer',
      name: 'Maria Garcia',
      email: 'maria@example.com',
      preferredLocale: 'ca',
      customerId: 'c1',
    },
  ],
};

describe('ComposeForm', () => {
  beforeEach(() => {
    generateSmartTemplatesMock.mockImplementation((context) => ([
      {
        key: 'primer-contacte',
        label: 'Primer contacte',
        icon: '👋',
        description: 'Resposta inicial',
        subject: `Subject ${context.name}`,
        body: `Body ${context.name}`,
        mode: 'email',
      },
    ]));
    generateAllTemplatesMock.mockReturnValue([]);
  });

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

  it('reaplica la plantilla activa quan canvia el lead i el text continua autoemplenat', async () => {
    render(
      <ComposeForm
        leads={LEADS}
        packs={[]}
        returnHref="/admin/leads/lead-1"
        initialLeadId="lead-1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /primer contacte/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Assumpte de l'email")).toHaveValue('Subject Maria Garcia');
    });

    fireEvent.change(screen.getByLabelText('Selecciona entrada'), { target: { value: 'lead-2' } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Assumpte de l'email")).toHaveValue('Subject Joan Pons');
      expect(screen.getByPlaceholderText('Escriu el teu missatge...')).toHaveValue('Body Joan Pons');
    });
  });

  it('no sobreescriu edicions manuals quan canvia el context del lead', async () => {
    render(
      <ComposeForm
        leads={LEADS}
        packs={[]}
        returnHref="/admin/leads/lead-1"
        initialLeadId="lead-1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /primer contacte/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Assumpte de l'email")).toHaveValue('Subject Maria Garcia');
    });

    fireEvent.change(screen.getByPlaceholderText("Assumpte de l'email"), { target: { value: 'Assumpte manual' } });
    fireEvent.change(screen.getByLabelText('Selecciona entrada'), { target: { value: 'lead-2' } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('email@exemple.com')).toHaveValue('joan@example.com');
    });

    expect(screen.getByPlaceholderText("Assumpte de l'email")).toHaveValue('Assumpte manual');
    expect(screen.getByPlaceholderText('Escriu el teu missatge...')).toHaveValue('Body Maria Garcia');
  });

  it("mostra resum d'audiència quan el redactor està en mode segmentat", () => {
    render(
      <ComposeForm
        leads={LEADS}
        packs={[]}
        returnHref="/admin/inbox"
        initialSegmentAudience={SEGMENT_AUDIENCE}
      />
    );

    expect(screen.getByText('Audiència segmentada')).toBeInTheDocument();
    expect(screen.getAllByText('Clients de bodes 2025')).toHaveLength(2);
    expect(screen.getByText("1 destinataris preparats per l'enviament massiu.")).toBeInTheDocument();
  });

  it('no exposa el mode pressupost legacy', () => {
    render(
      <ComposeForm
        leads={LEADS}
        packs={[]}
        returnHref="/admin/inbox"
        initialTemplate="enviament-pressupost"
      />
    );

    expect(screen.queryByRole('tab', { name: /pressupost/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envia correu/i })).toBeInTheDocument();
  });

  it('aplica la plantilla inicial de client quan arriba per query', async () => {
    generateAllTemplatesMock.mockReturnValueOnce([
      {
        key: 'referral',
        label: 'Referral',
        icon: '🤝',
        description: 'Demanar referral',
        subject: 'Subject referral',
        body: 'Body referral',
        mode: 'email',
      },
    ]);

    render(
      <ComposeForm
        leads={[]}
        packs={[]}
        returnHref="/admin/clientes/customer-1"
        initialCustomer={{
          id: 'customer-1',
          name: 'Client Primera',
          email: 'primera@example.com',
          preferredLocale: 'ca',
        }}
        initialTemplate="referral"
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Assumpte de l'email")).toHaveValue('Subject referral');
      expect(screen.getByPlaceholderText('Escriu el teu missatge...')).toHaveValue('Body referral');
    });
  });
});
