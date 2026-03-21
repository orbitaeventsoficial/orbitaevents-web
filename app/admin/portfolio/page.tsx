'use client';

/**
 * Admin Portfolio — Gestió de media per categoria
 * Bustia de pujada per cada secció amb suport d'imatges i vídeos.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { fetchWithCsrf } from '@/lib/csrf';
import { PORTFOLIO_CATEGORIES } from '@/app/config/portfolio-images';

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 0.85;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

type MediaItem = {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string | null;
  sortOrder: number;
  createdAt: string;
};

function isImageType(type: string) {
  return type.startsWith('image/');
}

function optimizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) { resolve(blob); } else { reject(new Error('toBlob failed')); }
        },
        'image/webp',
        WEBP_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error carregant imatge')); };
    img.src = url;
  });
}

function CategorySection({ slug, name }: { slug: string; name: string }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    try {
      const res = await fetchWithCsrf(`/api/admin/portfolio/media?slug=${slug}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMedia(data.data || []);
      }
    } catch (err) {
      console.error(`Error carregant ${slug}:`, err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (expanded) loadMedia();
  }, [expanded, loadMedia]);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);
    let uploaded = 0;

    for (const file of Array.from(files)) {
      const isImage = isImageType(file.type);
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

      if (file.size > maxSize) {
        const maxMB = maxSize / (1024 * 1024);
        setError(`${file.name} massa gran (màx ${maxMB}MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('slug', slug);

        if (isImage) {
          const optimized = await optimizeImage(file);
          formData.append('file', optimized, `${Date.now()}.webp`);
        } else {
          formData.append('file', file, file.name);
        }

        const res = await fetchWithCsrf('/api/admin/portfolio/media', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          uploaded++;
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d?.error || 'Error pujant fitxer');
        }
      } catch (err) {
        console.error('Error pujant:', err);
        setError('Error processant fitxer');
      }
    }

    if (uploaded > 0) await loadMedia();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/portfolio/media?mediaId=${mediaId}`, { method: 'DELETE' });
      if (res.ok) setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (err) {
      console.error('Error eliminant:', err);
    }
  };

  const imageCount = media.filter((m) => m.mediaType === 'image').length;
  const videoCount = media.filter((m) => m.mediaType === 'video').length;

  return (
    <div className="ap-card overflow-hidden rounded-2xl">
      {/* Header — sempre visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📁</span>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs opacity-50">{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (imageCount > 0 || videoCount > 0) && (
            <div className="flex gap-2 text-xs">
              {imageCount > 0 && (
                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                  {imageCount} foto{imageCount !== 1 ? 's' : ''}
                </span>
              )}
              {videoCount > 0 && (
                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  {videoCount} vídeo{videoCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {/* Cos expandible */}
      {expanded && (
        <div className="border-t p-5 space-y-4 admin-tone-border-neutral">
          {error && <p className="text-sm text-red-400 rounded-xl border border-red-500/20 px-3 py-2">{error}</p>}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-white/20 p-8 text-center hover:border-white/40 transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            {uploading ? (
              <p className="text-sm animate-pulse">Pujant fitxers...</p>
            ) : (
              <>
                <span className="text-3xl block mb-2">📷🎬</span>
                <p className="text-sm">Arrossega imatges o vídeos aquí</p>
                <p className="text-xs opacity-50 mt-1">
                  Imatges: JPG, PNG, WebP (màx 10MB, compressió auto WebP) · Vídeos: MP4, WebM (màx 100MB)
                </p>
              </>
            )}
          </div>

          {/* Media grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : media.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {media.map((item) => (
                <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl border admin-tone-border-neutral transition-all hover:admin-tone-border-info">
                  {item.mediaType === 'image' ? (
                    <Image
                      src={item.mediaUrl}
                      alt={item.caption || `${name} foto`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                      <video
                        src={item.mediaUrl}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">▶ Vídeo</span>
                    </div>
                  )}

                  {/* Badge tipus */}
                  <div className="absolute top-2 left-2">
                    <span className={`text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      item.mediaType === 'video' ? 'bg-purple-500/80' : 'bg-blue-500/80'
                    }`}>
                      {item.mediaType === 'video' ? 'Vídeo' : 'Foto'}
                    </span>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => deleteMedia(item.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-600/80 text-white rounded-full p-1.5 transition-opacity min-h-[32px] min-w-[32px] flex items-center justify-center"
                    title="Eliminar"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-50 text-center py-4">Encara no hi ha media en aquesta categoria</p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

type PortfolioEvent = {
  id: string;
  slug: string;
  categorySlug: string;
  title: string;
  subtitle: string | null;
  venue: string | null;
  location: string | null;
  eventDate: string | null;
  guestCount: number | null;
  description: string | null;
  services: string[];
  coverImage: string;
  published: boolean;
  _count?: { media: number };
};

function EventsManager() {
  const [events, setEvents] = useState<PortfolioEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: '', categorySlug: 'bodas', title: '', subtitle: '', venue: '', location: '',
    eventDate: '', guestCount: '', description: '', services: '', coverImage: '', published: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetchWithCsrf('/api/admin/portfolio/events?published=all', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error carregant events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleSubmit = async () => {
    if (!form.slug || !form.title || !form.coverImage) {
      setError('Slug, títol i imatge de portada són requerits');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/portfolio/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          eventDate: form.eventDate || undefined,
          guestCount: form.guestCount ? Number(form.guestCount) : undefined,
          services: form.services ? form.services.split(',').map((s) => s.trim()).filter(Boolean) : [],
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ slug: '', categorySlug: 'bodas', title: '', subtitle: '', venue: '', location: '', eventDate: '', guestCount: '', description: '', services: '', coverImage: '', published: false });
        await loadEvents();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.error || 'Error creant event');
      }
    } catch {
      setError('Error de xarxa');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (ev: PortfolioEvent) => {
    try {
      await fetchWithCsrf('/api/admin/portfolio/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ev.id, published: !ev.published }),
      });
      await loadEvents();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await fetchWithCsrf(`/api/admin/portfolio/events?id=${id}`, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Events del portfolio</h2>
          <p className="text-xs opacity-50">Mini-pàgines per events concrets (Boda Laura & Marc, etc.)</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] hover:bg-white/5"
        >
          {showForm ? 'Cancel·lar' : '+ Nou event'}
        </button>
      </div>

      {error && <p className="text-sm text-red-400 rounded-xl border border-red-500/20 px-3 py-2">{error}</p>}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-white/10 p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs opacity-50 block mb-1">Títol *</label>
              <input value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') }); }} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" placeholder="Boda Laura & Marc" />
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-1">Slug (URL) *</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" placeholder="boda-laura-marc" />
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-1">Categoria *</label>
              <select value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm">
                {PORTFOLIO_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-1">Subtítol</label>
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" placeholder="Masía Can Riera · Septiembre 2024" />
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-1">Lloc (venue)</label>
              <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" placeholder="Masía Can Riera" />
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-1">Ubicació</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" placeholder="Girona" />
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-1">Data</label>
              <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs opacity-50 block mb-1">Convidats</label>
              <input type="number" value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" placeholder="120" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs opacity-50 block mb-1">Serveis (separats per coma)</label>
              <input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" placeholder="DJ, Iluminación, Tematización" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs opacity-50 block mb-1">URL imatge portada *</label>
              <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" placeholder="/img/portfolio/bodas/bodas-01.avif o URL pujada" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs opacity-50 block mb-1">Descripció</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm" placeholder="Boda temàtica amb ambientació completa..." />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="rounded" />
              Publicat
            </label>
            <button type="button" onClick={handleSubmit} disabled={saving} className="rounded-xl bg-amber-500 text-black px-6 py-2.5 text-sm font-bold hover:bg-amber-400 disabled:opacity-50 min-h-[44px]">
              {saving ? 'Guardant...' : 'Crear event'}
            </button>
          </div>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
      ) : events.length === 0 ? (
        <p className="text-sm opacity-50 text-center py-8">Cap event creat. Crea el primer event del portfolio.</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="ap-card rounded-xl p-4 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                <Image src={ev.coverImage} alt={ev.title} fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{ev.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${ev.published ? 'ap-badge ap-badge--success' : 'ap-badge'}`}>
                    {ev.published ? 'Publicat' : 'Esborrany'}
                  </span>
                </div>
                <p className="text-xs opacity-50 truncate">
                  {ev.categorySlug} · {ev.venue || 'sense lloc'} · {ev._count?.media || 0} fotos
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => togglePublished(ev)} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-white/5 min-h-[36px]">
                  {ev.published ? 'Despublicar' : 'Publicar'}
                </button>
                <button type="button" onClick={() => deleteEvent(ev.id)} className="rounded-lg border border-red-500/20 text-red-400 px-3 py-1.5 text-xs hover:bg-red-500/10 min-h-[36px]">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

type AdminTab = 'media' | 'events';

export default function AdminPortfolioPage() {
  const [tab, setTab] = useState<AdminTab>('media');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-sm opacity-50 mt-1">
          Gestiona les imatges, vídeos i events del portfolio públic.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('media')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'media' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'}`}
        >
          📷 Media per categoria
        </button>
        <button
          type="button"
          onClick={() => setTab('events')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'events' ? 'admin-tone-soft-info admin-tone-text-info' : 'admin-tone-idle'}`}
        >
          🎪 Events
        </button>
      </div>

      {tab === 'media' ? (
        <div className="space-y-3">
          {PORTFOLIO_CATEGORIES.map((cat) => (
            <CategorySection key={cat.slug} slug={cat.slug} name={cat.name} />
          ))}
        </div>
      ) : (
        <EventsManager />
      )}
    </div>
  );
}
