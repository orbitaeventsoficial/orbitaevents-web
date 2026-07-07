import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePacks } from '@/lib/hooks/usePacks';
import type { PackDefinition } from '@/config/packs-config';

const { mockFetchPublicPacks } = vi.hoisted(() => ({
  mockFetchPublicPacks: vi.fn(),
}));

vi.mock('@/lib/api/publicPacksClient', () => ({
  fetchPublicPacks: mockFetchPublicPacks,
}));

vi.mock('@/lib/pack-i18n', () => ({
  resolvePackI18nKey: (key: string) => key,
  resolvePackI18nFeatures: (features: string[]) => features,
}));

afterEach(() => {
  mockFetchPublicPacks.mockReset();
});

const stubPack = (id: string): PackDefinition =>
  ({
    id,
    name: `Pack ${id}`,
    tagline: `Tagline ${id}`,
    description: '',
    priceFrom: 0,
    features: [],
    services: [],
  }) as unknown as PackDefinition;

describe('usePacks', () => {
  it('arrenca en estat loading amb els packs del fallback', () => {
    mockFetchPublicPacks.mockReturnValue(new Promise(() => {}));
    const fallback = [stubPack('A')];
    const { result } = renderHook(() => usePacks({ locale: 'ca', fallback }));
    expect(result.current.loading).toBe(true);
    expect(result.current.packs).toHaveLength(1);
    expect(result.current.packs[0].name).toBe('Pack A');
  });

  it('substitueix el fallback pels packs remots quan el fetch té èxit', async () => {
    const remote = [stubPack('R1'), stubPack('R2')];
    mockFetchPublicPacks.mockResolvedValue({ ok: true, packs: remote });
    const { result } = renderHook(() => usePacks({ locale: 'ca' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.packs).toHaveLength(2);
    expect(result.current.packs[0].name).toBe('Pack R1');
    expect(result.current.error).toBeNull();
  });

  it('manté el fallback si el servidor retorna packs buit', async () => {
    mockFetchPublicPacks.mockResolvedValue({ ok: true, packs: [] });
    const fallback = [stubPack('F')];
    const { result } = renderHook(() => usePacks({ locale: 'ca', fallback }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.packs).toHaveLength(1);
    expect(result.current.packs[0].name).toBe('Pack F');
  });

  it('usa el fallback i no propaga errors tècnics si el fetch llença una excepció', async () => {
    mockFetchPublicPacks.mockRejectedValue(new Error('api down'));
    const fallback = [stubPack('FB')];
    const { result } = renderHook(() => usePacks({ locale: 'ca', fallback }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.packs[0].name).toBe('Pack FB');
  });
});
