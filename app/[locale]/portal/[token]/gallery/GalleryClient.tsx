'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { getClientPortalGalleryPhotoLabel } from '@/lib/clientPortalMessages';

type Photo = {
  id: string;
  photoUrl: string;
  caption: string | null;
};

type GalleryLabels = {
  gallery: string;
  galleryClose: string;
  galleryDownload: string;
  galleryOf: string;
  galleryPhotoLabel: string;
  galleryPrev: string;
  galleryNext: string;
  opensInNewTab: string;
};

type Props = {
  photos: Photo[];
  labels: GalleryLabels;
};

export default function GalleryClient({ photos, labels }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const photoPositionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number>(0);

  const open = useCallback((idx: number) => setSelectedIdx(idx), []);
  const close = useCallback(() => setSelectedIdx(null), []);

  const prev = useCallback(
    () => setSelectedIdx((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)),
    [photos.length],
  );
  const next = useCallback(
    () => setSelectedIdx((i) => (i !== null ? (i + 1) % photos.length : null)),
    [photos.length],
  );

  useEffect(() => {
    if (selectedIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedIdx, close, prev, next]);

  useEffect(() => {
    if (selectedIdx !== null) {
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => closeRef.current?.focus(), 60);
      return () => {
        document.body.style.overflow = '';
        clearTimeout(t);
      };
    }
    document.body.style.overflow = '';
    return undefined;
  }, [selectedIdx]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 48) {
      if (dx < 0) next();
      else prev();
    }
  };

  const overlayTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.18 };
  const photoTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] };

  const selectedPhoto = selectedIdx !== null ? photos[selectedIdx] : null;
  const selectedPhotoLabel = selectedPhoto !== null && selectedIdx !== null
    ? getClientPortalGalleryPhotoLabel(labels.galleryPhotoLabel, selectedPhoto.caption, selectedIdx)
    : labels.gallery;
  const downloadNewTabLabel = `${labels.galleryDownload} (${labels.opensInNewTab})`;

  return (
    <>
      <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
        {photos.map((photo, idx) => {
          const photoLabel = getClientPortalGalleryPhotoLabel(
            labels.galleryPhotoLabel,
            photo.caption,
            idx,
          );

          return (
            <button
              key={photo.id}
              type="button"
              className="group relative block w-full overflow-hidden rounded-xl border border-white/[0.06] bg-white/5 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              onClick={() => open(idx)}
              aria-label={photoLabel}
            >
              <Image
                src={photo.photoUrl}
                alt={photoLabel}
                width={400}
                height={400}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  {photo.caption}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedPhoto !== null && selectedIdx !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label={selectedPhotoLabel}
            aria-describedby={photoPositionId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="absolute inset-0 bg-black/92 backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />

            <motion.div
              key={selectedIdx}
              className="relative z-10 flex flex-col items-center"
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
              transition={photoTransition}
            >
              <Image
                src={selectedPhoto.photoUrl}
                alt={selectedPhotoLabel}
                width={1200}
                height={900}
                className="max-h-[80vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
                priority
              />
              {selectedPhoto.caption && (
                <p className="mt-3 text-center text-sm text-white/55 max-w-[80vw]">
                  {selectedPhoto.caption}
                </p>
              )}
            </motion.div>

            {/* Top controls */}
            <div className="absolute inset-x-0 top-4 z-10 flex items-center justify-between px-4">
              <span
                id={photoPositionId}
                className="rounded-full bg-black/60 px-3 py-1 text-xs text-white/50 backdrop-blur-sm"
              >
                {selectedIdx + 1} {labels.galleryOf} {photos.length}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto.photoUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/60 hover:text-white backdrop-blur-sm transition-colors"
                  aria-label={downloadNewTabLabel}
                  title={downloadNewTabLabel}
                >
                  <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/60 hover:text-white backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label={labels.galleryClose}
                >
                  <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/60 hover:text-white backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label={labels.galleryPrev}
                >
                  <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/60 hover:text-white backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label={labels.galleryNext}
                >
                  <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
