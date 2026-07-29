import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockClipboardWriteText } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockClipboardWriteText: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

import ClientPortalAccessPanel from '@/app/admin/bookings/[id]/ClientPortalAccessPanel';

describe('ClientPortalAccessPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockClipboardWriteText },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clampa la caducitat del portal al mateix rang que el servei', () => {
    const filePath = path.join(
      process.cwd(),
      'app',
      'admin',
      'bookings',
      '[id]',
      'ClientPortalAccessPanel.tsx',
    );
    const source = readFileSync(filePath, 'utf8');
    const helperStart = source.indexOf('function clampPortalExpiryDays');
    const helperEnd = source.indexOf('export default function ClientPortalAccessPanel', helperStart);
    const helperBlock = source.slice(helperStart, helperEnd);

    expect(helperStart).toBeGreaterThan(-1);
    expect(helperBlock).toContain('CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.minDays');
    expect(helperBlock).toContain('CLIENT_PORTAL_ACCESS_EXPIRY_LIMITS.maxDays');
    expect(source).toContain('setExpiresInDays(clampPortalExpiryDays(Number(event.target.value)))');
    expect(source).not.toContain('setExpiresInDays(Number(event.target.value) || 30)');
  });

  it('edita el missatge personalitzat del portal en textarea', () => {
    const filePath = path.join(
      process.cwd(),
      'app',
      'admin',
      'bookings',
      '[id]',
      'ClientPortalAccessPanel.tsx',
    );
    const source = readFileSync(filePath, 'utf8');
    const labelStart = source.indexOf('Missatge personalitzat (opcional)');
    const labelEnd = source.indexOf('</label>', labelStart);
    const block = source.slice(labelStart, labelEnd);

    expect(labelStart).toBeGreaterThan(-1);
    expect(block).toContain('<textarea');
    expect(block).toContain('rows={3}');
    expect(block).toContain('maxLength={CLIENT_PORTAL_PERSONALIZATION_LIMITS.introMessage}');
    expect(block).toContain('resize-y');
    expect(block).not.toContain('<input');
  });

  it('reflecteix els limits de sanejament dels camps de personalitzacio', () => {
    const filePath = path.join(
      process.cwd(),
      'app',
      'admin',
      'bookings',
      '[id]',
      'ClientPortalAccessPanel.tsx',
    );
    const source = readFileSync(filePath, 'utf8');

    expect(source).toContain('maxLength={CLIENT_PORTAL_PERSONALIZATION_LIMITS.headline}');
    expect(source).toContain('maxLength={CLIENT_PORTAL_PERSONALIZATION_LIMITS.introMessage}');
    expect(source).toContain('maxLength={CLIENT_PORTAL_PERSONALIZATION_LIMITS.accentColor}');
  });

  it('cableja la visibilitat del questionnaire al payload del portal', () => {
    const filePath = path.join(
      process.cwd(),
      'app',
      'admin',
      'bookings',
      '[id]',
      'ClientPortalAccessPanel.tsx',
    );
    const source = readFileSync(filePath, 'utf8');

    expect(source).toContain('showQuestionnaire');
    expect(source).toContain('setShowQuestionnaire');
    expect(source).toContain('Qüestionari');
  });

  it('mostra error accessible si generar el link del portal falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Portal no disponible' }),
    } as Response);

    render(<ClientPortalAccessPanel bookingId="booking-1" initialActive={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generar enllaç' }));

    await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Portal no disponible');
    });

    expect(screen.getByRole('button', { name: 'Generar enllaç' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Copiar enllaç' })).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button', { name: 'Revocar' })).not.toHaveAttribute('aria-invalid');
  });

  it('marca nomes copiar si el porta-retalls falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        url: 'https://portal.test/booking-1',
        active: {
          id: 'access-1',
          tokenPrefix: 'tok',
          locale: 'ca',
          expiresAt: null,
          createdAt: '2026-07-07T08:00:00.000Z',
          lastAccessedAt: null,
        },
      }),
    } as Response);
    mockClipboardWriteText.mockRejectedValueOnce(new Error('clipboard denied'));

    render(<ClientPortalAccessPanel bookingId="booking-1" initialActive={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generar enllaç' }));
    await screen.findByText('https://portal.test/booking-1');

    fireEvent.click(screen.getByRole('button', { name: 'Copiar enllaç' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No s\'ha pogut copiar automàticament');
    });

    expect(screen.getByRole('button', { name: 'Copiar enllaç' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Rotar enllaç' })).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button', { name: 'Revocar' })).not.toHaveAttribute('aria-invalid');
    expect(mockClipboardWriteText).toHaveBeenCalledWith('https://portal.test/booking-1');
  });

  it('marca nomes revocar si la baixa del portal falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'No s\'ha pogut revocar el portal' }),
    } as Response);

    render(
      <ClientPortalAccessPanel
        bookingId="booking-1"
        initialActive={{
          id: 'access-1',
          tokenPrefix: 'tok',
          locale: 'ca',
          expiresAt: null,
          createdAt: '2026-07-07T08:00:00.000Z',
          lastAccessedAt: null,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revocar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No s\'ha pogut revocar el portal');
    });

    expect(screen.getByRole('button', { name: 'Revocar' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Rotar enllaç' })).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button', { name: 'Copiar enllaç' })).not.toHaveAttribute('aria-invalid');
  });
});
