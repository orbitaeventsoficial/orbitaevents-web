'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface HeroMedia {
  id: string;
  url: string;
  type: 'video' | 'image';
  label: string;
  active: boolean;
  sortOrder: number;
}

export default function HeroMediaAdmin() {
  const [media, setMedia] = useState<HeroMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    const res = await fetch('/api/admin/hero-media');
    if (res.ok) setMedia(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // Upload file
  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', labelInput || file.name);

    await fetch('/api/admin/hero-media', { method: 'POST', body: formData });
    setLabelInput('');
    if (fileRef.current) fileRef.current.value = '';
    await fetchMedia();
    setUploading(false);
  };

  // Add external URL
  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    setUploading(true);
    await fetch('/api/admin/hero-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput, label: labelInput || 'External' }),
    });
    setUrlInput('');
    setLabelInput('');
    await fetchMedia();
    setUploading(false);
  };

  // Toggle active
  const handleToggle = async (id: string) => {
    await fetch('/api/admin/hero-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id }),
    });
    await fetchMedia();
  };

  // Delete
  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Eliminar "${label}"?`)) return;
    await fetch('/api/admin/hero-media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchMedia();
  };

  // Move up/down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const sorted = [...media];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];
    const ids = sorted.map((m) => m.id);
    await fetch('/api/admin/hero-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder', ids }),
    });
    await fetchMedia();
  };

  const activeCount = media.filter((m) => m.active).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Hero — Mitjans</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Imatges i vídeos que roten al hero. {activeCount} actius de {media.length}.
          </p>
        </div>
      </div>

      {/* Upload section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Afegir mitjà</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nom</label>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Ex: Festa Halloween 2024"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* File upload */}
          <div className="flex-1">
            <label className="block text-sm text-zinc-400 mb-1">Pujar fitxer</label>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,image/avif"
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-amber-500/20 file:text-amber-400 file:text-sm file:font-medium file:cursor-pointer"
              />
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-lg text-sm disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {uploading ? 'Pujant...' : 'Pujar'}
              </button>
            </div>
          </div>

          {/* URL input */}
          <div className="flex-1">
            <label className="block text-sm text-zinc-400 mb-1">O URL externa</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm"
              />
              <button
                onClick={handleAddUrl}
                disabled={uploading || !urlInput.trim()}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold rounded-lg text-sm disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                Afegir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media list */}
      {loading ? (
        <div className="text-center text-zinc-500 py-12">Carregant...</div>
      ) : media.length === 0 ? (
        <div className="text-center text-zinc-500 py-12">
          No hi ha mitjans. Puja el primer vídeo o imatge.
        </div>
      ) : (
        <div className="space-y-3">
          {media.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                item.active
                  ? 'bg-zinc-900 border-zinc-700'
                  : 'bg-zinc-950 border-zinc-800 opacity-60'
              }`}
            >
              {/* Preview */}
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    muted
                    className="w-full h-full object-cover"
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-1 left-1">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    item.type === 'video'
                      ? 'bg-purple-500/80 text-white'
                      : 'bg-blue-500/80 text-white'
                  }`}>
                    {item.type === 'video' ? 'VID' : 'IMG'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 font-medium text-sm truncate">{item.label}</p>
                <p className="text-zinc-500 text-xs truncate">{item.url}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Move up */}
                <button
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 transition-colors"
                  title="Moure amunt"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Move down */}
                <button
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === media.length - 1}
                  className="p-2 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 transition-colors"
                  title="Moure avall"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Toggle active */}
                <button
                  onClick={() => handleToggle(item.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.active
                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-zinc-600 hover:bg-zinc-800'
                  }`}
                  title={item.active ? 'Desactivar' : 'Activar'}
                >
                  {item.active ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item.id, item.label)}
                  className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
