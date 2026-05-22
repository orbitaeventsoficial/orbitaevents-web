import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useManagedImageSrc } from '@/lib/hooks/useManagedImageSrc';
import type { ImageManagerResponse } from '@/lib/api/imageManagerClient';

const { mockFetchImageManager } = vi.hoisted(() => ({
  mockFetchImageManager: vi.fn(),
}));

vi.mock('@/lib/api/imageManagerClient', () => ({
  fetchImageManager: mockFetchImageManager,
}));

afterEach(() => {
  mockFetchImageManager.mockReset();
});

function makeResponse(key: string, src: string): ImageManagerResponse {
  return { ok: true, data: { [key]: { item: { src } } } };
}

describe('useManagedImageSrc', () => {
  it('retorna el fallback inicialment', () => {
    mockFetchImageManager.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useManagedImageSrc('hero', '/fallback.jpg'));
    expect(result.current).toBe('/fallback.jpg');
  });

  it('actualitza al src gestionat quan el fetch té èxit', async () => {
    mockFetchImageManager.mockResolvedValue(makeResponse('hero', '/managed.jpg'));
    const { result } = renderHook(() => useManagedImageSrc('hero', '/fallback.jpg'));
    await waitFor(() => {
      expect(result.current).toBe('/managed.jpg');
    });
  });

  it('manté el fallback si el fetch falla', async () => {
    mockFetchImageManager.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useManagedImageSrc('hero', '/fallback.jpg'));
    await waitFor(() => {
      expect(mockFetchImageManager).toHaveBeenCalled();
    });
    expect(result.current).toBe('/fallback.jpg');
  });

  it('manté el fallback si la resposta no conté src per la clau', async () => {
    mockFetchImageManager.mockResolvedValue({ ok: true, data: { hero: { item: {} } } });
    const { result } = renderHook(() => useManagedImageSrc('hero', '/fallback.jpg'));
    await waitFor(() => {
      expect(mockFetchImageManager).toHaveBeenCalled();
    });
    expect(result.current).toBe('/fallback.jpg');
  });

  it('manté el fallback si el src és una cadena buida', async () => {
    mockFetchImageManager.mockResolvedValue(makeResponse('hero', '   '));
    const { result } = renderHook(() => useManagedImageSrc('hero', '/fallback.jpg'));
    await waitFor(() => {
      expect(mockFetchImageManager).toHaveBeenCalled();
    });
    expect(result.current).toBe('/fallback.jpg');
  });

  it('crida fetchImageManager amb la clau correcta', async () => {
    mockFetchImageManager.mockResolvedValue(makeResponse('gallery-hero', '/img.jpg'));
    renderHook(() => useManagedImageSrc('gallery-hero', '/fb.jpg'));
    await waitFor(() => {
      expect(mockFetchImageManager).toHaveBeenCalledWith('gallery-hero', { cache: 'no-store' });
    });
  });
});
