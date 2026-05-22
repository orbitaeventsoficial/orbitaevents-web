import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useConfiguratorLeadForm } from '@/lib/hooks/useConfiguratorLeadForm';
import type React from 'react';

const { mockFetchWithCsrf } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({ fetchWithCsrf: mockFetchWithCsrf }));

afterEach(() => {
  mockFetchWithCsrf.mockReset();
});

const validate = {
  errorName: 'Nom massa curt',
  errorContact: 'Contacte massa curt',
  errorCaptcha: 'Cal completar el captcha',
  errorSend: 'Error enviant el formulari',
};

const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

function makeHook() {
  return renderHook(() =>
    useConfiguratorLeadForm({ buildPayload: vi.fn().mockReturnValue({}), validate }),
  );
}

describe('useConfiguratorLeadForm', () => {
  it('estableix formError si el nom és massa curt', async () => {
    const { result } = makeHook();
    await act(async () => {
      result.current.updateField('name', 'A');
      result.current.updateField('contact', '600123456');
      result.current.setTurnstileToken('token');
    });
    await act(async () => {
      await result.current.submitForm(mockEvent);
    });
    expect(result.current.formError).toBe('Nom massa curt');
    expect(result.current.sent).toBe(false);
  });

  it('estableix formError si el contacte és massa curt', async () => {
    const { result } = makeHook();
    await act(async () => {
      result.current.updateField('name', 'Joan Garcia');
      result.current.updateField('contact', 'abc');
      result.current.setTurnstileToken('token');
    });
    await act(async () => {
      await result.current.submitForm(mockEvent);
    });
    expect(result.current.formError).toBe('Contacte massa curt');
  });

  it('estableix formError si no hi ha token de captcha', async () => {
    const { result } = makeHook();
    await act(async () => {
      result.current.updateField('name', 'Joan Garcia');
      result.current.updateField('contact', '600123456');
    });
    await act(async () => {
      await result.current.submitForm(mockEvent);
    });
    expect(result.current.formError).toBe('Cal completar el captcha');
  });

  it('marca sent=true quan el formulari s\'envia correctament', async () => {
    mockFetchWithCsrf.mockResolvedValue({ ok: true, json: async () => ({}) });
    const { result } = makeHook();
    await act(async () => {
      result.current.updateField('name', 'Joan Garcia');
      result.current.updateField('contact', '600123456');
      result.current.setTurnstileToken('token-valid');
    });
    await act(async () => {
      await result.current.submitForm(mockEvent);
    });
    expect(result.current.sent).toBe(true);
    expect(result.current.formError).toBe('');
  });

  it('estableix formError si la resposta del servidor no és ok', async () => {
    mockFetchWithCsrf.mockResolvedValue({ ok: false });
    const { result } = makeHook();
    await act(async () => {
      result.current.updateField('name', 'Joan Garcia');
      result.current.updateField('contact', '600123456');
      result.current.setTurnstileToken('token');
    });
    await act(async () => {
      await result.current.submitForm(mockEvent);
    });
    expect(result.current.formError).toBe('Error enviant el formulari');
    expect(result.current.sent).toBe(false);
  });
});
