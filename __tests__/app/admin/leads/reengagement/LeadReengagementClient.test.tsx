import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReengagementCandidate } from '@/lib/services/leadReengagementService';
import LeadReengagementClient from '@/app/admin/leads/reengagement/LeadReengagementClient';

const { mockClipboardWriteText } = vi.hoisted(() => ({
  mockClipboardWriteText: vi.fn(),
}));

type SerializedCandidate = Omit<ReengagementCandidate, 'eventDate'> & { eventDate: string | null };

const candidates: SerializedCandidate[] = [
  {
    leadId: 'lead-1',
    name: 'Lead Primera',
    email: 'primera@example.com',
    phone: '+34 600 111 111',
    status: 'QUOTE_SENT',
    priority: 'HIGH',
    eventType: 'BIRTHDAY',
    eventDate: '2026-08-15T00:00:00.000Z',
    eventLocation: 'Barcelona',
    budget: '600',
    preferredLocale: 'ca',
    daysSinceCreation: 12,
    daysSinceContact: 7,
    daysSinceActivity: 7,
    daysUntilEvent: 39,
    reason: 'QUOTE_NO_REPLY',
    reasonLabel: 'Pressupost sense resposta',
    reengagementPriority: 'ALTA',
    score: 85,
    suggestedChannels: ['whatsapp', 'email'],
    suggestedSubject: 'Tens dubtes?',
    suggestedMessage: 'Missatge reengagement 1',
    whatsappUrl: 'https://wa.me/34600111111',
    mailtoUrl: 'mailto:primera@example.com',
  },
  {
    leadId: 'lead-2',
    name: 'Lead Segona',
    email: 'segona@example.com',
    phone: '+34 600 222 222',
    status: 'NEGOTIATING',
    priority: 'MEDIUM',
    eventType: 'WEDDING',
    eventDate: '2026-09-20T00:00:00.000Z',
    eventLocation: 'Girona',
    budget: '900',
    preferredLocale: 'ca',
    daysSinceCreation: 20,
    daysSinceContact: 8,
    daysSinceActivity: 8,
    daysUntilEvent: 75,
    reason: 'NEGOTIATION_COLD',
    reasonLabel: 'Negociació refredada',
    reengagementPriority: 'MITJANA',
    score: 62,
    suggestedChannels: ['whatsapp', 'email'],
    suggestedSubject: 'Tanquem detalls?',
    suggestedMessage: 'Missatge reengagement 2',
    whatsappUrl: 'https://wa.me/34600222222',
    mailtoUrl: 'mailto:segona@example.com',
  },
];

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('LeadReengagementClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockClipboardWriteText },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('marca nomes el lead de reengagement que no es pot copiar', async () => {
    mockClipboardWriteText.mockRejectedValueOnce(new Error('clipboard denied'));

    render(<LeadReengagementClient initialCandidates={candidates} />);

    const copyButtons = screen.getAllByRole('button', { name: 'Copiar missatge' });
    fireEvent.click(copyButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No s\'ha pogut copiar el missatge.');
    });

    expect(copyButtons[0]).not.toHaveAttribute('aria-invalid');
    expect(copyButtons[1]).toHaveAttribute('aria-invalid', 'true');
    expect(mockClipboardWriteText).toHaveBeenCalledWith('Missatge reengagement 2');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
