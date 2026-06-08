import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormAutosave } from '@/lib/hooks/useFormAutosave';

const KEY = 'test-form';
const STORAGE_KEY = `orbita.autosave.${KEY}`;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('useFormAutosave', () => {
  it('desa el valor a localStorage amb debounce', () => {
    const onRestore = vi.fn();
    const { rerender } = renderHook(({ v }) => useFormAutosave(KEY, v, onRestore, { debounceMs: 500 }), {
      initialProps: { v: { name: 'A' } },
    });
    rerender({ v: { name: 'B' } });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull(); // encara no (debounce)
    act(() => { vi.advanceTimersByTime(500); });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.value).toEqual({ name: 'B' });
    expect(typeof stored.savedAt).toBe('number');
  });

  it('restaura un esborrany existent en muntar', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), value: { name: 'desat' } }));
    const onRestore = vi.fn();
    const { result } = renderHook(() => useFormAutosave(KEY, { name: '' }, onRestore));
    expect(onRestore).toHaveBeenCalledWith({ name: 'desat' });
    expect(result.current.restored).toBe(true);
  });

  it('ignora i neteja esborranys caducats', () => {
    const old = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 dies
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: old, value: { name: 'vell' } }));
    const onRestore = vi.fn();
    renderHook(() => useFormAutosave(KEY, { name: '' }, onRestore, { ttlMs: 7 * 24 * 60 * 60 * 1000 }));
    expect(onRestore).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clear() esborra l\'esborrany', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), value: { name: 'x' } }));
    const { result } = renderHook(() => useFormAutosave(KEY, { name: '' }, vi.fn()));
    act(() => { result.current.clear(); });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(result.current.restored).toBe(false);
  });

  it('no fa res si enabled=false', () => {
    const onRestore = vi.fn();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), value: { name: 'x' } }));
    const { rerender } = renderHook(({ v }) => useFormAutosave(KEY, v, onRestore, { enabled: false }), {
      initialProps: { v: { name: 'A' } },
    });
    expect(onRestore).not.toHaveBeenCalled();
    rerender({ v: { name: 'B' } });
    act(() => { vi.advanceTimersByTime(1000); });
    // el valor existent no s'ha sobreescrit
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string).value).toEqual({ name: 'x' });
  });
});
