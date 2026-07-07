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
const GALLERY_ERROR_FALLBACK = 'No s\'ha pogut actualitzar la galeria';

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

type GalleryErrorTarget = 'load' | 'upload' | 'portal' | 'portfolio' | 'folder' | 'delete' | 'caption';

type GalleryErrorState = {
  message: string;
  target: GalleryErrorTarget;
  photoId?: string;
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

function getGalleryErrorMessage(data: unknown, fallback = GALLERY_ERROR_FALLBACK): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

async function readGalleryError(res: Response, fallback = GALLERY_ERROR_FALLBACK): Promise<string> {
  const data = await res.json().catch(() => null);
  return getGalleryErrorMessage(data, fallback);
}

export default function BookingGallery({ bookingId }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<GalleryErrorState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function setGalleryError(message: string, target: GalleryErrorTarget, photoId?: string) {
    setError({ message, target, photoId });
  }

  function hasGalleryError(target: GalleryErrorTarget, photoId?: string): boolean {
    return error?.target === target && (!photoId || error.photoId === photoId);
  }

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, { cache: 'no-store' });
      if (!res.ok) {
        setGalleryError(await readGalleryError(res, 'No s\'ha pogut carregar la galeria'), 'load');
        return;
      }
      const data = await res.json();
      setPhotos(data.body || []);
    } catch (err) {
      log.error('Error carregant galeria', err);
      setGalleryError('No s\'ha pogut carregar la galeria', 'load');
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
        setGalleryError(`${file.name} massa gran (màx 10MB)`, 'upload');
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
          setGalleryError(d?.error || 'Error pujant foto', 'upload');
        }
      } catch (err) {
        log.error('Error pujant', err);
        setGalleryError('Error processant imatge', 'upload');
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
    setError(null);
    try {
      const body: Record<string, unknown> = { photoId: photo.id, [flag]: !photo[flag] };
      if (flag === 'isPortfolio' && !photo.isPortfolio && portfolioSlug) body.portfolioSlug = portfolioSlug;
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        setGalleryError(
          await readGalleryError(res, 'No s\'ha pogut actualitzar la foto'),
          flag === 'isPortal' ? 'portal' : 'portfolio',
          photo.id,
        );
        return;
      }
      await loadPhotos();
    } catch (err) {
      log.error('Error actualitzant', err);
      setGalleryError('No s\'ha pogut actualitzar la foto', flag === 'isPortal' ? 'portal' : 'portfolio', photo.id);
    }
  };

  const setPortfolioSlug = async (photo: GalleryPhoto, slug: string) => {
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId: photo.id, portfolioSlug: slug }) });
      if (!res.ok) {
        setGalleryError(await readGalleryError(res, 'No s\'ha pogut canviar la carpeta'), 'folder', photo.id);
        return;
      }
      await loadPhotos();
    } catch (err) {
      log.error('Error actualitzant slug', err);
      setGalleryError('No s\'ha pogut canviar la carpeta', 'folder', photo.id);
    }
  };

  const deletePhoto = async (photoId: string) => {
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery?photoId=${photoId}`, { method: 'DELETE' });
      if (!res.ok) {
        setGalleryError(await readGalleryError(res, 'No s\'ha pogut eliminar la foto'), 'delete', photoId);
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (selectedId === photoId) setSelectedId(null);
    } catch (err) {
      log.error('Error eliminant', err);
      setGalleryError('No s\'ha pogut eliminar la foto', 'delete', photoId);
    }
  };

  const saveCaption = async (photo: GalleryPhoto) => {
    setError(null);
    try {
      setSavingCaption(true);
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/gallery`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, caption: captionDraft.trim() || null }),
      });
      if (!res.ok) {
        setGalleryError(await readGalleryError(res, 'No s\'ha pogut desar la nota'), 'caption', photo.id);
        return;
      }
      await loadPhotos();
    } catch (err) {
      log.error('Error actualitzant caption', err);
      setGalleryError('No s\'ha pogut desar la nota', 'caption', photo.id);
    } finally {
      setSavingCaption(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-1/4 rounded-lg admin-tone-bg-neutral" />
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
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-invalid={hasGalleryError('upload') ? true : undefined} className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]" {...helpAttrs(ADMIN_BOOKING_HELP.gallery.upload)}>
          {uploading ? 'Pujant...' : 'Pujar fotos'}
        </button>
      </div>

      {error && <p role="alert" className="text-sm admin-tone-text-danger rounded-xl border admin-tone-border-danger px-3 py-2">{error.message}</p>}

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} />

      {photos.length === 0 && (
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="cursor-pointer rounded-2xl border-2 border-dashed border-[var(--line2)] p-12 text-center transition-colors hover:border-[var(--line)]" onClick={() => fileRef.current?.click()} role="button" tabIndex={0} aria-invalid={hasGalleryError('upload') ? true : undefined} onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()} {...helpAttrs(ADMIN_BOOKING_HELP.gallery.dropzone)}>
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
              <button type="button" onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }} aria-invalid={hasGalleryError('delete', photo.id) ? true : undefined} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full admin-tone-bg-danger text-[var(--o-admin-light)] opacity-0 transition-opacity group-hover:opacity-100 hover:brightness-110" title={ADMIN_BOOKING_HELP.gallery.delete.title} aria-label={ADMIN_BOOKING_HELP.gallery.delete.title} {...helpAttrs(ADMIN_BOOKING_HELP.gallery.delete)}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <div onClick={() => fileRef.current?.click()} className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[var(--line2)] transition-colors hover:border-[var(--line)]" role="button" tabIndex={0} aria-invalid={hasGalleryError('upload') ? true : undefined} onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()} {...helpAttrs(ADMIN_BOOKING_HELP.gallery.upload)}>
            <span className="text-2xl text-[var(--t3)]">+</span>
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
              aria-invalid={hasGalleryError('caption', selected.id) ? true : undefined}
              className="ap-input w-full px-3 py-2.5 text-sm"
              placeholder="Afegeix context ràpid de la captura"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => saveCaption(selected)}
                disabled={savingCaption}
                aria-invalid={hasGalleryError('caption', selected.id) ? true : undefined}
                className="rounded-xl border px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {savingCaption ? 'Desant...' : 'Desar nota'}
              </button>
            </div>
          </div>
          <label className="flex items-center justify-between gap-3" {...helpAttrs(ADMIN_BOOKING_HELP.gallery.portal)}>
            <span className="text-sm">Visible al portal client</span>
            <button type="button" role="switch" aria-checked={selected.isPortal} aria-invalid={hasGalleryError('portal', selected.id) ? true : undefined} onClick={() => toggleFlag(selected, 'isPortal')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${selected.isPortal ? 'admin-tone-bg-info' : 'admin-tone-bg-neutral'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-[var(--o-admin-light)] transition-transform ${selected.isPortal ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
          <label className="flex items-center justify-between gap-3" {...helpAttrs(ADMIN_BOOKING_HELP.gallery.portfolio)}>
            <span className="text-sm">Visible al portfolio públic</span>
            <button type="button" role="switch" aria-checked={selected.isPortfolio} aria-invalid={hasGalleryError('portfolio', selected.id) ? true : undefined} onClick={() => { if (!selected.isPortfolio) { toggleFlag(selected, 'isPortfolio', selected.portfolioSlug || BOOKING_GALLERY_PORTFOLIO_CATEGORIES[0].slug); } else { toggleFlag(selected, 'isPortfolio'); } }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${selected.isPortfolio ? 'admin-tone-bg-violet' : 'admin-tone-bg-neutral'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-[var(--o-admin-light)] transition-transform ${selected.isPortfolio ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
          {selected.isPortfolio && (
            <div {...helpAttrs(ADMIN_BOOKING_HELP.gallery.portfolioFolder)}>
              <label htmlFor="portfolio-slug" className="text-xs opacity-50 block mb-1">Carpeta del portfolio</label>
              <select id="portfolio-slug" value={selected.portfolioSlug || ''} onChange={(e) => setPortfolioSlug(selected, e.target.value)} aria-invalid={hasGalleryError('folder', selected.id) ? true : undefined} className="ap-input w-full px-3 py-2.5 text-sm">
                {BOOKING_GALLERY_PORTFOLIO_CATEGORIES.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
