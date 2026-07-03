import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { clearFormAutosaveDraft, useFormAutosave } from '@/lib/hooks/useFormAutosave';

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

  it('clearFormAutosaveDraft esborra un esborrany abans de restaurar un prefill forçat', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), value: { name: 'vell' } }));
    clearFormAutosaveDraft(KEY);
    const onRestore = vi.fn();
    renderHook(() => useFormAutosave(KEY, { name: 'lead' }, onRestore));
    expect(onRestore).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('desa quan enabled passa de false a true (cas prefill async: !loading)', () => {
    const onRestore = vi.fn();
    const { rerender } = renderHook(
      ({ v, en }) => useFormAutosave(KEY, v, onRestore, { enabled: en, debounceMs: 500 }),
      { initialProps: { v: { name: '' }, en: false } },
    );
    // loading acaba → enabled true
    rerender({ v: { name: '' }, en: true });
    // usuari escriu
    rerender({ v: { name: 'Collsacreu' }, en: true });
    act(() => { vi.advanceTimersByTime(500); });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.value).toEqual({ name: 'Collsacreu' });
  });

  it('restaura l\'esborrany quan enabled passa de false a true (cas booking amb prefill)', () => {
    // Esborrany previ (el que l'usuari havia escrit).
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), value: { loc: 'Collsacreu', pax: 150 } }));
    const restored: unknown[] = [];
    const onRestore = (v: unknown) => restored.push(v);
    // Munta amb enabled=false (loading) i value buit; després el prefill posa dades del lead
    // i enabled passa a true.
    const { rerender } = renderHook(
      ({ v, en }) => useFormAutosave(KEY, v, onRestore, { enabled: en, debounceMs: 500 }),
      { initialProps: { v: { loc: '', pax: 0 }, en: false } },
    );
    expect(restored).toHaveLength(0); // encara no (loading)
    // prefill: dades del lead + loading acaba
    rerender({ v: { loc: 'lead-loc', pax: 100 }, en: true });
    // ha de restaurar l'esborrany de l'usuari (guanya sobre el prefill)
    expect(restored).toEqual([{ loc: 'Collsacreu', pax: 150 }]);
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
