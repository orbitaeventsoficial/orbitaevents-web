import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useManagedImageSrc } from '@/lib/hooks/useManagedImageSrc';

const fetchMock = vi.fn();

Object.defineProperty(globalThis, 'fetch', {
  value: fetchMock,
  writable: true,
});

afterEach(() => {
  fetchMock.mockReset();
});

describe('useManagedImageSrc', () => {
  it('retorna el fallback abans que la API resolgui', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() =>
      useManagedImageSrc('layout.logo.header', '/fallback.svg'),
    );
    expect(result.current).toBe('/fallback.svg');
  });

  it('substitueix el fallback pel src gestionat quan la API el retorna', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: { 'layout.logo.header': { item: { src: '/uploads/managed.svg' } } },
      }),
    });

    const { result } = renderHook(() =>
      useManagedImageSrc('layout.logo.header', '/fallback.svg'),
    );

    await waitFor(() => {
      expect(result.current).toBe('/uploads/managed.svg');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/public/image-manager?key=layout.logo.header',
      { cache: 'no-store' },
    );
  });

  it('encoda la key al query string per evitar caràcters especials', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: {} }),
    });

    renderHook(() => useManagedImageSrc('home.client logos', '/fallback.svg'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/public/image-manager?key=home.client%20logos',
        { cache: 'no-store' },
      );
    });
  });

  it('manté el fallback si la resposta no és OK', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false }),
    });

    const { result } = renderHook(() =>
      useManagedImageSrc('layout.logo.admin', '/glyph.svg'),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(result.current).toBe('/glyph.svg');
  });

  it('manté el fallback si el src gestionat és buit o només espais', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: { 'layout.logo.admin': { item: { src: '   ' } } },
      }),
    });

    const { result } = renderHook(() =>
      useManagedImageSrc('layout.logo.admin', '/glyph.svg'),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(result.current).toBe('/glyph.svg');
  });

  it('manté el fallback si la API llença un error de xarxa', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() =>
      useManagedImageSrc('layout.logo.header', '/fallback.svg'),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(result.current).toBe('/fallback.svg');
  });
});
