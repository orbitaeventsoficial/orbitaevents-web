'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../../components/ToastProvider';
import { AdminHelpLegend } from '@/app/admin/components/AdminHelpLegend';

interface HeroMedia {
  id: string;
  url: string;
  type: 'video' | 'image';
  label: string;
  active: boolean;
  sortOrder: number;
}

const INPUT = 'ap-input';
const CARD = 'rounded-xl border p-4 admin-card-glass';
const ACTION = 'rounded-lg p-2 transition-colors admin-tone-idle';

export default function HeroMediaAdmin() {
  const [media, setMedia] = useState<HeroMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const fetchMedia = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/admin/hero-media');
      if (!res.ok) {
        throw new Error("No s'ha pogut carregar el hero media");
      }
      setMedia(await res.json());
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "No s'ha pogut carregar el hero media";
      setLoadError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const parseHeroMediaError = async (response: Response, fallback: string) => {
    try {
      const data = await response.json();
      if (data?.error && typeof data.error === 'string') return data.error;
    } catch (error) {
      console.warn("No s'ha pogut llegir el payload d'error del hero media", error);
    }
    return fallback;
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', labelInput || file.name);

    try {
      const response = await fetch('/api/admin/hero-media', { method: 'POST', body: formData });
      if (!response.ok) {
        throw new Error(await parseHeroMediaError(response, "No s'ha pogut pujar el fitxer"));
      }
      setLabelInput('');
      if (fileRef.current) fileRef.current.value = '';
      await fetchMedia();
      toast.success('Fitxer pujat');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No s'ha pogut pujar el fitxer");
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    setUploading(true);
    try {
      const response = await fetch('/api/admin/hero-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, label: labelInput || 'External' }),
      });
      if (!response.ok) {
        throw new Error(await parseHeroMediaError(response, "No s'ha pogut afegir la URL"));
      }
      setUrlInput('');
      setLabelInput('');
      await fetchMedia();
      toast.success('URL afegida');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No s'ha pogut afegir la URL");
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await fetch('/api/admin/hero-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });
      if (!response.ok) {
        throw new Error(await parseHeroMediaError(response, "No s'ha pogut actualitzar el mitjà"));
      }
      await fetchMedia();
      toast.success('Mitjà actualitzat');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No s'ha pogut actualitzar el mitjà");
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Eliminar "${label}"?`)) return;
    try {
      const response = await fetch('/api/admin/hero-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error(await parseHeroMediaError(response, "No s'ha pogut eliminar el mitjà"));
      }
      await fetchMedia();
      toast.success('Mitjà eliminat');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No s'ha pogut eliminar el mitjà");
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const sorted = [...media];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];
    const ids = sorted.map((item) => item.id);

    try {
      const response = await fetch('/api/admin/hero-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', ids }),
      });
      if (!response.ok) {
        throw new Error(await parseHeroMediaError(response, "No s'ha pogut reordenar el hero media"));
      }
      await fetchMedia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No s'ha pogut reordenar el hero media");
    }
  };

  const activeCount = media.filter((item) => item.active).length;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero — Mitjans</h1>
          <p className="mt-1 text-sm">Imatges i vídeos que roten al hero. {activeCount} actius de {media.length}.</p>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <AdminHelpLegend title="Què és" body="Aquests mitjans alimenten el carrousel del hero públic. Pots combinar imatge i vídeo." />
        <AdminHelpLegend title="Ordre" body="L'ordre determina la rotació. Mou amunt o avall per prioritzar què veu primer l'usuari." />
        <AdminHelpLegend title="Actiu" body="Si un mitjà està desactivat es conserva, però deixa de sortir al hero públic." />
      </div>

      <div className="mb-8 rounded-xl border p-6 admin-card-glass">
        <h2 className="mb-4 text-lg font-semibold">Afegir mitjà</h2>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Nom</label>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Ex: Festa Halloween 2024"
              className={INPUT}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="mb-1 block text-sm">Pujar fitxer</label>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,image/avif"
                className="ap-input flex-1 file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1 file:text-sm file:font-medium"
              />
              <button onClick={handleUpload} disabled={uploading} className="ap-btn ap-btn--primary whitespace-nowrap disabled:opacity-50">
                {uploading ? 'Pujant...' : 'Pujar'}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-sm">O URL externa</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="ap-input flex-1"
              />
              <button onClick={handleAddUrl} disabled={uploading || !urlInput.trim()} className="ap-btn ap-btn--secondary whitespace-nowrap disabled:opacity-50">
                Afegir
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">Carregant...</div>
      ) : media.length === 0 ? (
        <div className="py-12 text-center">No hi ha mitjans. Puja el primer vídeo o imatge.</div>
      ) : (
        <div className="space-y-3">
          {media.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${item.active ? 'admin-card-glass' : 'opacity-60'}`}
            >
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border">
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    muted
                    className="h-full w-full object-cover"
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLVideoElement).pause();
                      (e.currentTarget as HTMLVideoElement).currentTime = 0;
                    }}
                  />
                ) : (
                  <Image
                    src={item.url}
                    alt={item.label}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                )}
                <div className="absolute left-1 top-1">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${item.type === 'video' ? 'admin-tone-bg-violet admin-tone-text-violet' : 'admin-tone-soft-info admin-tone-text-info'}`}>
                    {item.type === 'video' ? 'VID' : 'IMG'}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="truncate text-xs">{item.url}</p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1">
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className={`${ACTION} disabled:opacity-20`} title="Moure amunt">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                <button onClick={() => handleMove(index, 'down')} disabled={index === media.length - 1} className={`${ACTION} disabled:opacity-20`} title="Moure avall">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleToggle(item.id)}
                  className={`rounded-lg p-2 transition-colors ${item.active ? 'admin-tone-soft-success admin-tone-text-success' : 'admin-tone-idle'}`}
                  title={item.active ? 'Desactivar' : 'Activar'}
                >
                  {item.active ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </button>

                <button onClick={() => handleDelete(item.id, item.label)} className="rounded-lg p-2 transition-colors admin-tone-soft-danger admin-tone-text-danger" title="Eliminar">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

