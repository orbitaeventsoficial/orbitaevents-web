import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactivationCandidate } from '@/lib/services/reactivationService';
import ReactivationClient from '@/app/admin/clientes/reactivation/ReactivationClient';

const { mockClipboardWriteText, mockFetchWithCsrf } = vi.hoisted(() => ({
  mockClipboardWriteText: vi.fn(),
  mockFetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: mockFetchWithCsrf,
}));

const candidates: ReactivationCandidate[] = [
  {
    customerId: 'customer-1',
    name: 'Client Primera',
    email: 'primera@example.com',
    phone: '+34 600 111 111',
    phoneNormalized: '34600111111',
    instagram: null,
    lifecycleStage: 'VIP',
    totalEvents: 3,
    totalSpent: 1200,
    healthScore: 92,
    daysSinceLastEvent: 320,
    daysSinceLastContact: 90,
    preferredLocale: 'ca',
    priority: 'ALTA',
    reason: 'DORMANT_VIP',
    reasonLabel: 'VIP dormant',
    score: 95,
    suggestedChannels: ['whatsapp', 'email'],
    suggestedSubject: 'Et trobem a faltar',
    suggestedMessage: 'Missatge reactivacio 1',
    whatsappUrl: 'https://wa.me/34600111111',
    mailtoUrl: 'mailto:primera@example.com',
  },
  {
    customerId: 'customer-2',
    name: 'Client Segona',
    email: 'segona@example.com',
    phone: '+34 600 222 222',
    phoneNormalized: '34600222222',
    instagram: null,
    lifecycleStage: 'DORMANT',
    totalEvents: 1,
    totalSpent: 500,
    healthScore: 70,
    daysSinceLastEvent: 410,
    daysSinceLastContact: 120,
    preferredLocale: 'ca',
    priority: 'MITJANA',
    reason: 'DORMANT_FIRST_TIME',
    reasonLabel: 'Primer event dormant',
    score: 55,
    suggestedChannels: ['whatsapp', 'email'],
    suggestedSubject: 'Fem una segona?',
    suggestedMessage: 'Missatge reactivacio 2',
    whatsappUrl: 'https://wa.me/34600222222',
    mailtoUrl: 'mailto:segona@example.com',
  },
];

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('ReactivationClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockClipboardWriteText },
    });
    mockFetchWithCsrf.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('marca nomes el candidat de reactivacio que no es pot copiar', async () => {
    mockClipboardWriteText.mockRejectedValueOnce(new Error('clipboard denied'));

    render(<ReactivationClient initialCandidates={candidates} />);

    const copyButtons = screen.getAllByRole('button', { name: 'Copiar missatge' });
    fireEvent.click(copyButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No s\'ha pogut copiar el missatge.');
    });

    expect(copyButtons[0]).not.toHaveAttribute('aria-invalid');
    expect(copyButtons[1]).toHaveAttribute('aria-invalid', 'true');
    expect(mockClipboardWriteText).toHaveBeenCalledWith('Missatge reactivacio 2');
    expect(mockFetchWithCsrf).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('registra al Customer Hub quan copia un missatge de reactivacio', async () => {
    mockClipboardWriteText.mockResolvedValueOnce(undefined);

    render(<ReactivationClient initialCandidates={candidates} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Copiar missatge' })[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '✓ Copiat' })).toBeInTheDocument();
    });

    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/customers/customer-1/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('REACTIVATION_PREPARED'),
    });
    expect(mockFetchWithCsrf.mock.calls[0][1].body).toContain('Missatge reactivacio 1');
  });

  it('obre Email pel composer canonic del client', () => {
    render(<ReactivationClient initialCandidates={candidates} />);

    expect(screen.getAllByRole('link', { name: '✉️ Email' })[0]).toHaveAttribute(
      'href',
      '/admin/inbox/compose?customerId=customer-1&template=reactivacio',
    );
  });
});
