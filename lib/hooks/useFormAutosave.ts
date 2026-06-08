'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Autosave genèric de formularis a localStorage (esborrany local).
 *
 * Pensat per a tot l'admin: evita perdre el que s'està omplint si es recarrega,
 * es navega per error o cau la connexió. NO substitueix el desat real al servidor;
 * és una xarxa de seguretat local. En desar de debò, crida `clear()`.
 *
 * Ús:
 *   const { restored, clear } = useFormAutosave(`lead-intake`, form, setForm);
 *   // form i setForm són l'estat del formulari; restored=true si s'ha recuperat esborrany.
 *
 * - `key`: identificador únic per formulari (afegeix-hi l'id de l'entitat si edites).
 * - Desa amb debounce (default 600ms) quan `value` canvia.
 * - Caduca esborranys vells (default 7 dies) per no acumular brossa.
 */

const PREFIX = 'orbita.autosave.';
const DEFAULT_DEBOUNCE_MS = 600;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface AutosaveOptions {
  debounceMs?: number;
  ttlMs?: number;
  /** Si false, no desa ni restaura (p. ex. mentre carrega dades inicials). */
  enabled?: boolean;
}

interface StoredEnvelope<T> {
  savedAt: number;
  value: T;
}

export function useFormAutosave<T>(
  key: string,
  value: T,
  onRestore: (restored: T) => void,
  options: AutosaveOptions = {},
) {
  const { debounceMs = DEFAULT_DEBOUNCE_MS, ttlMs = DEFAULT_TTL_MS, enabled = true } = options;
  const storageKey = `${PREFIX}${key}`;
  const [restored, setRestored] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRestoredRef = useRef(false);

  // Restaura una sola vegada en muntar.
  useEffect(() => {
    if (!enabled || hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredEnvelope<T>;
      if (Date.now() - parsed.savedAt > ttlMs) {
        localStorage.removeItem(storageKey);
        return;
      }
      onRestore(parsed.value);
      setRestored(true);
    } catch {
      // esborrany corrupte: neteja silenciosa
      try { localStorage.removeItem(storageKey); } catch { /* noop */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restaura només en muntar
  }, [storageKey, enabled]);

  // Desa amb debounce quan canvia el valor.
  useEffect(() => {
    if (!enabled || !hasRestoredRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const envelope: StoredEnvelope<T> = { savedAt: Date.now(), value };
        localStorage.setItem(storageKey, JSON.stringify(envelope));
      } catch {
        // quota plena o serialització fallida: ignora, és best-effort
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, storageKey, debounceMs, enabled]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* noop */ }
    setRestored(false);
  }, [storageKey]);

  return { restored, clear };
}
