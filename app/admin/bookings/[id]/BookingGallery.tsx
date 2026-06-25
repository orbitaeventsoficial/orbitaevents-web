'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { fetchWithCsrf } from '@/lib/csrf';
import { BOOKING_GALLERY_PORTFOLIO_CATEGORIES } from '@/lib/constants';
import { ADMIN_BOOKING_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { log } from '@/lib/logger';
import GallerySharePanel from './GallerySharePanel';

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 0.85;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type GalleryPhoto = {
  id: string;
  photoUrl: string;
  caption: string | null;
  isPortfolio: boolean;
  isPortal: boolean;
  portfolioSlug: string | null;
  sortOrder: number;
  createdAt: string;
};

interface Props {
  bookingId: string;
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
      canvas.toBlob((blob) => { if (blob) { resolve(blob); } else { reject(new Error('toBlob failed')); } }, 'image/webp', WEBP_QUALITY);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error carregant imatge')); };
    img.src = url;
  });
}

export default function BookingGallery({ bookingId }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.body || []);
      }
    } catch (err) {
      log.error('Error carregant galeria', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);
  useEffect(() => {
    const selected = selectedId ? photos.find((photo) => photo.id === selectedId) : null;
    setCaptionDraft(selected?.caption || '');
  }, [photos, selectedId]);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);
    let uploaded = 0;

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} massa gran (màx 10MB)`);
        continue;
      }
      try {
        const optimized = await optimizeImage(file);
        const formData = new FormData();
        formData.append('file', optimized, `${Date.now()}.webp`);
        formData.append('isPortal', 'true');
        formData.append('isPortfolio', 'false');

        const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, { method: 'POST', body: formData });
        if (res.ok) uploaded++;
        else {
          const d = await res.json().catch(() => ({}));
          setError(d?.error || 'Error pujant foto');
        }
      } catch (err) {
        log.error('Error pujant', err);
        setError('Error processant imatge');
      }
    }

    if (uploaded > 0) await loadPhotos();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
  };

  const toggleFlag = async (photo: GalleryPhoto, flag: 'isPortal' | 'isPortfolio', portfolioSlug?: string) => {
    try {
      const body: Record<string, unknown> = { photoId: photo.id, [flag]: !photo[flag] };
      if (flag === 'isPortfolio' && !photo.isPortfolio && portfolioSlug) body.portfolioSlug = portfolioSlug;
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) await loadPhotos();
    } catch (err) {
      log.error('Error actualitzant', err);
    }
  };

  const setPortfolioSlug = async (photo: GalleryPhoto, slug: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId: photo.id, portfolioSlug: slug }) });
      if (res.ok) await loadPhotos();
    } catch (err) {
      log.error('Error actualitzant slug', err);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery?photoId=${photoId}`, { method: 'DELETE' });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (selectedId === photoId) setSelectedId(null);
      }
    } catch (err) {
      log.error('Error eliminant', err);
    }
  };

  const saveCaption = async (photo: GalleryPhoto) => {
    try {
      setSavingCaption(true);
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, caption: captionDraft.trim() || null }),
      });
      if (res.ok) await loadPhotos();
    } catch (err) {
      log.error('Error actualitzant caption', err);
    } finally {
      setSavingCaption(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-1/4 rounded bg-white/10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-xl admin-tone-bg-neutral" />)}
        </div>
      </div>
    );
  }

  const selected = selectedId ? photos.find((p) => p.id === selectedId) : null;

  return (
    <div className="space-y-4" {...helpAttrs(ADMIN_BOOKING_HELP.gallery.root)}>
      <GallerySharePanel bookingId={bookingId} />

      <div className="flex items-center justify-between">
        <h2 className="ap-h2">Galeria de fotos ({photos.length})</h2>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]" {...helpAttrs(ADMIN_BOOKING_HELP.gallery.upload)}>
          {uploading ? 'Pujant...' : 'Pujar fotos'}
        </button>
      </div>

      {error && <p className="text-sm admin-tone-text-danger rounded-xl border admin-tone-border-danger px-3 py-2">{error}</p>}

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} />

      {photos.length === 0 && (
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="rounded-2xl border-2 border-dashed border-white/20 p-12 text-center hover:border-white/40 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()} {...helpAttrs(ADMIN_BOOKING_HELP.gallery.dropzone)}>
          <span className="text-4xl block mb-2">📷</span>
          <p className="text-sm">Arrossega fotos aquí o clica per pujar</p>
          <p className="text-xs opacity-50 mt-1">JPG, PNG, WebP · Compressió automàtica a WebP</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          {photos.map((photo) => (
            <div key={photo.id} className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedId === photo.id ? 'admin-tone-border-info admin-tone-bg-info' : 'admin-tone-border-neutral hover:admin-tone-border-slate'}`} onClick={() => setSelectedId(selectedId === photo.id ? null : photo.id)} {...helpAttrs(ADMIN_BOOKING_HELP.gallery.photo)}>
              <Image src={photo.photoUrl} alt={photo.caption || 'Foto event'} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              <div className="absolute top-2 left-2 flex gap-1">{photo.isPortal && <span className="ap-badge ap-badge--info text-xs">Portal</span>}{photo.isPortfolio && <span className="ap-badge text-xs">Portfolio</span>}</div>
              <button type="button" onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 admin-tone-bg-danger text-white rounded-full p-1.5 transition-opacity min-h-[32px] min-w-[32px] flex items-center justify-center" title={ADMIN_BOOKING_HELP.gallery.delete.title} aria-label={ADMIN_BOOKING_HELP.gallery.delete.title} {...helpAttrs(ADMIN_BOOKING_HELP.gallery.delete)}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <div onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-white/40 transition-colors cursor-pointer" role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()} {...helpAttrs(ADMIN_BOOKING_HELP.gallery.upload)}>
            <span className="text-3xl opacity-40">+</span>
          </div>
        </div>
      )}

      {selected && (
        <div className="ap-card rounded-xl p-4 space-y-3" {...helpAttrs(ADMIN_BOOKING_HELP.gallery.selected)}>
          <div className="flex items-center justify-between"><p className="text-sm font-medium">Configuració de la foto</p><button type="button" onClick={() => setSelectedId(null)} className="text-xs opacity-50 hover:opacity-100">Tancar</button></div>
          <div>
            <label htmlFor="gallery-caption" className="text-xs opacity-50 block mb-1">Nota / context</label>
            <textarea
              id="gallery-caption"
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              rows={3}
              className="ap-input w-full px-3 py-2.5 text-sm"
              placeholder="Afegeix context ràpid de la captura"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => saveCaption(selected)}
                disabled={savingCaption}
                className="rounded-xl border px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {savingCaption ? 'Desant...' : 'Desar nota'}
              </button>
            </div>
          </div>
          <label className="flex items-center justify-between gap-3" {...helpAttrs(ADMIN_BOOKING_HELP.gallery.portal)}>
            <span className="text-sm">Visible al portal client</span>
            <button type="button" role="switch" aria-checked={selected.isPortal} onClick={() => toggleFlag(selected, 'isPortal')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${selected.isPortal ? 'admin-tone-bg-info' : 'admin-tone-bg-neutral'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-[var(--o-admin-light)] transition-transform ${selected.isPortal ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between gap-3" {...helpAttrs(ADMIN_BOOKING_HELP.gallery.portfolio)}>
            <span className="text-sm">Visible al portfolio públic</span>
            <button type="button" role="switch" aria-checked={selected.isPortfolio} onClick={() => { if (!selected.isPortfolio) { toggleFlag(selected, 'isPortfolio', selected.portfolioSlug || BOOKING_GALLERY_PORTFOLIO_CATEGORIES[0].slug); } else { toggleFlag(selected, 'isPortfolio'); } }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${selected.isPortfolio ? 'admin-tone-bg-violet' : 'admin-tone-bg-neutral'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-[var(--o-admin-light)] transition-transform ${selected.isPortfolio ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
          {selected.isPortfolio && (
            <div {...helpAttrs(ADMIN_BOOKING_HELP.gallery.portfolioFolder)}>
              <label htmlFor="portfolio-slug" className="text-xs opacity-50 block mb-1">Carpeta del portfolio</label>
              <select id="portfolio-slug" value={selected.portfolioSlug || ''} onChange={(e) => setPortfolioSlug(selected, e.target.value)} className="ap-input w-full px-3 py-2.5 text-sm">
                {BOOKING_GALLERY_PORTFOLIO_CATEGORIES.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
