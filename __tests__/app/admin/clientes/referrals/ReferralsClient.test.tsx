import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReferralsSummary } from '@/lib/services/referralsService';
import ReferralsClient from '@/app/admin/clientes/referrals/ReferralsClient';

const { mockClipboardWriteText } = vi.hoisted(() => ({
  mockClipboardWriteText: vi.fn(),
}));

const summary: ReferralsSummary = {
  stats: {
    totalCustomers: 2,
    totalReferrers: 0,
    totalReferred: 0,
    referralRate: 0,
    totalReferralValue: 0,
    avgValuePerReferral: 0,
    topReferrerName: null,
  },
  topReferrers: [],
  candidates: [
    {
      id: 'customer-1',
      name: 'Client Primera',
      email: 'primera@example.com',
      phone: '+34 600 111 111',
      lifecycleStage: 'ACTIVE',
      totalEvents: 2,
      totalSpent: 900,
      healthScore: 90,
      priority: 'ALTA',
      reason: 'VIP_NO_REFERRAL',
      reasonLabel: 'VIP sense referral',
      score: 95,
      suggestedSubject: 'Ens ajudes?',
      suggestedMessage: 'Missatge referral 1',
      whatsappUrl: 'https://wa.me/34600111111',
      mailtoUrl: 'mailto:primera@example.com',
    },
    {
      id: 'customer-2',
      name: 'Client Segona',
      email: 'segona@example.com',
      phone: '+34 600 222 222',
      lifecycleStage: 'ACTIVE',
      totalEvents: 1,
      totalSpent: 500,
      healthScore: 80,
      priority: 'MITJANA',
      reason: 'HAPPY_FIRST_TIME',
      reasonLabel: 'Primera experiència bona',
      score: 70,
      suggestedSubject: 'Una proposta',
      suggestedMessage: 'Missatge referral 2',
      whatsappUrl: 'https://wa.me/34600222222',
      mailtoUrl: 'mailto:segona@example.com',
    },
  ],
};

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('ReferralsClient', () => {
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

  it('marca nomes el candidat de referral que no es pot copiar', async () => {
    mockClipboardWriteText.mockRejectedValueOnce(new Error('clipboard denied'));

    render(<ReferralsClient summary={summary} />);

    const copyButtons = screen.getAllByRole('button', { name: 'Copiar missatge' });
    fireEvent.click(copyButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No s\'ha pogut copiar el missatge.');
    });

    expect(copyButtons[0]).not.toHaveAttribute('aria-invalid');
    expect(copyButtons[1]).toHaveAttribute('aria-invalid', 'true');
    expect(mockClipboardWriteText).toHaveBeenCalledWith('Missatge referral 2');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
