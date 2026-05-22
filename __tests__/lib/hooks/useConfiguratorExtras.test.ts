import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useConfiguratorExtras } from '@/lib/hooks/useConfiguratorExtras';

const { MOCK_EXTRAS } = vi.hoisted(() => ({
  MOCK_EXTRAS: [
    { id: 'E1', name: 'Extra E1', description: '', price: 100, icon: '🎵' },
    { id: 'E2', name: 'Extra E2', description: '', price: 200, icon: '🎉', enabled: false },
    { id: 'E3', name: 'Extra E3', description: '', price: 300, icon: '✨', enabled: true },
  ],
}));

vi.mock('@/config/packs-config', () => ({
  EXTRAS: MOCK_EXTRAS,
}));

const fetchMock = vi.fn();
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true });

afterEach(() => {
  fetchMock.mockReset();
});

describe('useConfiguratorExtras', () => {
  it('arrenca amb els EXTRAS del config filtrant els disabled', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useConfiguratorExtras('ca'));
    // E1 (sense prop enabled), E3 (enabled:true) → 2; E2 (enabled:false) exclòs
    expect(result.current).toHaveLength(2);
    expect(result.current.find((e) => e.id === 'E1')).toBeDefined();
    expect(result.current.find((e) => e.id === 'E3')).toBeDefined();
    expect(result.current.find((e) => e.id === 'E2')).toBeUndefined();
  });

  it('substitueix el catàleg pels extres remots quan el fetch té èxit', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        extras: [
          { id: 'R1', name: 'Extra R1', description: '', price: 50, icon: '🎤' },
          { id: 'R2', name: 'Extra R2', description: '', price: 75, icon: '💡' },
        ],
      }),
    });
    const { result } = renderHook(() => useConfiguratorExtras('ca'));
    await waitFor(() => expect(result.current.find((e) => e.id === 'R1')).toBeDefined());
    expect(result.current).toHaveLength(2);
    expect(result.current.find((e) => e.id === 'R2')).toBeDefined();
  });

  it('filtra els extres remots amb enabled:false', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        extras: [
          { id: 'R1', name: 'Extra R1', description: '', price: 50, icon: '🎤' },
          { id: 'R2', name: 'Extra R2', description: '', price: 75, icon: '💡', enabled: false },
        ],
      }),
    });
    const { result } = renderHook(() => useConfiguratorExtras('es'));
    await waitFor(() => expect(result.current.find((e) => e.id === 'R1')).toBeDefined());
    expect(result.current.find((e) => e.id === 'R2')).toBeUndefined();
  });

  it('manté el catàleg inicial si el fetch llença un error', async () => {
    fetchMock.mockRejectedValue(new Error('network fail'));
    const { result } = renderHook(() => useConfiguratorExtras('en'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // Catàleg inicial té E1 i E3 (E2 disabled)
    expect(result.current).toHaveLength(2);
  });
});
