import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import {
  isHoldedEnabled,
  findOrCreateHoldedContact,
  createHoldedInvoice,
  getHoldedInvoiceStatus,
} from '@/lib/services/holdedService';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.HOLDED_ENABLED;
  delete process.env.HOLDED_API_KEY;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

// ═══════════ isHoldedEnabled ═══════════

describe('isHoldedEnabled', () => {
  it('retorna false per defecte', () => {
    expect(isHoldedEnabled()).toBe(false);
  });

  it('retorna false si HOLDED_ENABLED=true però sense API key', () => {
    process.env.HOLDED_ENABLED = 'true';
    expect(isHoldedEnabled()).toBe(false);
  });

  it('retorna true amb ambdues variables', () => {
    process.env.HOLDED_ENABLED = 'true';
    process.env.HOLDED_API_KEY = 'test-key';
    expect(isHoldedEnabled()).toBe(true);
  });
});

// ═══════════ findOrCreateHoldedContact ═══════════

describe('findOrCreateHoldedContact', () => {
  it('retorna string buit si Holded desactivat', async () => {
    const result = await findOrCreateHoldedContact({
      name: 'Test', email: 'test@test.com',
    });
    expect(result).toBe('');
  });

  it('cerca per NIF primer', async () => {
    process.env.HOLDED_ENABLED = 'true';
    process.env.HOLDED_API_KEY = 'key';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'h1', name: 'Test' }]),
    });

    const result = await findOrCreateHoldedContact({
      name: 'Test', email: 'test@test.com', nif: '12345678A',
    });

    expect(result).toBe('h1');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('cerca per email si no hi ha NIF match', async () => {
    process.env.HOLDED_ENABLED = 'true';
    process.env.HOLDED_API_KEY = 'key';

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // NIF search empty
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ id: 'h2' }]) }); // email search

    const result = await findOrCreateHoldedContact({
      name: 'Test', email: 'test@test.com', nif: '12345678A',
    });

    expect(result).toBe('h2');
  });

  it('crea contacte nou si no existeix', async () => {
    process.env.HOLDED_ENABLED = 'true';
    process.env.HOLDED_API_KEY = 'key';

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // email search
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'h3' }) }); // create

    const result = await findOrCreateHoldedContact({
      name: 'Nou Client', email: 'nou@test.com',
    });

    expect(result).toBe('h3');
  });
});

// ═══════════ createHoldedInvoice ═══════════

describe('createHoldedInvoice', () => {
  it('retorna id buit si Holded desactivat', async () => {
    const result = await createHoldedInvoice({
      contactId: 'c1',
      items: [{ name: 'Pack Premium', units: 1, subtotal: 1500, tax: 21 }],
    });
    expect(result).toEqual({ id: '' });
  });

  it('crea factura i retorna resultat', async () => {
    process.env.HOLDED_ENABLED = 'true';
    process.env.HOLDED_API_KEY = 'key';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'inv1', invoiceNum: 'F-001' }),
    });

    const result = await createHoldedInvoice({
      contactId: 'c1',
      items: [{ name: 'Servei DJ', units: 1, subtotal: 1000, tax: 21 }],
    });

    expect(result).toEqual({ id: 'inv1', invoiceNum: 'F-001' });
  });

  it('llança error si API falla', async () => {
    process.env.HOLDED_ENABLED = 'true';
    process.env.HOLDED_API_KEY = 'key';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve('Invalid data'),
    });

    await expect(
      createHoldedInvoice({
        contactId: 'c1',
        items: [{ name: 'Test', units: 1, subtotal: 100, tax: 21 }],
      }),
    ).rejects.toThrow('Holded API error');
  });
});

// ═══════════ getHoldedInvoiceStatus ═══════════

describe('getHoldedInvoiceStatus', () => {
  it('retorna null si Holded desactivat', async () => {
    expect(await getHoldedInvoiceStatus('inv1')).toBeNull();
  });

  it('retorna null amb id buit', async () => {
    process.env.HOLDED_ENABLED = 'true';
    process.env.HOLDED_API_KEY = 'key';

    expect(await getHoldedInvoiceStatus('')).toBeNull();
  });

  it('retorna estat de factura', async () => {
    process.env.HOLDED_ENABLED = 'true';
    process.env.HOLDED_API_KEY = 'key';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'paid', publicUrl: 'https://holded.com/inv1' }),
    });

    const result = await getHoldedInvoiceStatus('inv1');

    expect(result).toEqual({ status: 'paid', url: 'https://holded.com/inv1' });
  });

  it('retorna null si API falla', async () => {
    process.env.HOLDED_ENABLED = 'true';
    process.env.HOLDED_API_KEY = 'key';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server error'),
    });

    expect(await getHoldedInvoiceStatus('inv1')).toBeNull();
  });
});
