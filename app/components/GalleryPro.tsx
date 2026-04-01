'use client';

/**
 * Gallery Component for Portfolio
 * Mosaic layout with hero images + grid blocks + lightbox
 * Pattern: HERO → 3-grid → HERO → 2-grid → repeat
 */

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';

export interface GalleryItem {
  src: string;
  alt: string;
  type?: 'image' | 'video';
}

function isVideo(item: GalleryItem): boolean {
  if (item.type === 'video') return true;
  const ext = item.src.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'webm', 'mov'].includes(ext);
}

// ─── Scroll fade-in hook ────────────────────────────────────────────────────

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setVisible(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: '40px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function FadeInBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className || ''}`}
    >
      {children}
    </div>
  );
}

// ─── Media cell ─────────────────────────────────────────────────────────────

const BLUR_DATA =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxMTEyMTQiLz48L3N2Zz4=";

function MediaCell({
  item,
  index,
  aspect,
  sizes,
  onClick,
  onPrefetch,
}: {
  item: GalleryItem;
  index: number;
  aspect: string;
  sizes: string;
  onClick: () => void;
  onPrefetch: (src: string) => void;
}) {
  const itemIsVideo = isVideo(item);
  const isPriority = index < 4;

  return (
    <div
      className={`relative ${aspect} rounded-2xl overflow-hidden cursor-pointer group bg-stone-900 transition-shadow duration-500 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}
      onClick={onClick}
      onMouseEnter={() => !itemIsVideo && onPrefetch(item.src)}
      onFocus={() => !itemIsVideo && onPrefetch(item.src)}
    >
      {itemIsVideo ? (
        <video
          src={item.src}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          muted
          playsInline
          preload="metadata"
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
        />
      ) : (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={sizes}
          quality={index === 0 ? 75 : 60}
          priority={isPriority}
          loading={isPriority ? 'eager' : 'lazy'}
          placeholder="blur"
          blurDataURL={BLUR_DATA}
        />
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      {itemIsVideo && (
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
          <span>▶</span> Vídeo
        </div>
      )}
    </div>
  );
}

// ─── Main gallery ───────────────────────────────────────────────────────────

export function SimpleGallery({ images }: { images: GalleryItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: ReactTouchEvent) => {
    if (touchStartX.current === null || selectedIndex === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return; // min swipe distance
    if (dx < 0 && selectedIndex < images.length - 1) setSelectedIndex(selectedIndex + 1);
    if (dx > 0 && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  }, [selectedIndex, images.length]);

  const prefetchImage = useCallback((src: string) => {
    if (typeof window === 'undefined') return;
    const img = new window.Image();
    img.src = src;
  }, []);

  useEffect(() => {
    if (selectedIndex === null) return;
    const next = images[selectedIndex + 1];
    const prev = images[selectedIndex - 1];
    if (next && !isVideo(next)) prefetchImage(next.src);
    if (prev && !isVideo(prev)) prefetchImage(prev.src);
  }, [selectedIndex, images, prefetchImage]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight' && selectedIndex < images.length - 1) setSelectedIndex(selectedIndex + 1);
      if (e.key === 'ArrowLeft' && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, images.length]);

  // Build mosaic blocks
  // Pattern: HERO(1) → ROW3(3) → HERO(1) → ROW2(2) = 7 per cycle
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < images.length) {
    const remaining = images.length - i;

    // HERO — single wide image
    if (remaining >= 1) {
      const heroIdx = i;
      blocks.push(
        <FadeInBlock key={`hero-${blockKey}`}>
          <MediaCell
            item={images[heroIdx]}
            index={heroIdx}
            aspect="aspect-[21/9]"
            sizes="100vw"
            onClick={() => setSelectedIndex(heroIdx)}
            onPrefetch={prefetchImage}
          />
        </FadeInBlock>,
      );
      i += 1;
    }

    // ROW of 3
    if (i < images.length) {
      const row = images.slice(i, Math.min(i + 3, images.length));
      blocks.push(
        <FadeInBlock key={`row3-${blockKey}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {row.map((item, j) => (
            <MediaCell
              key={i + j}
              item={item}
              index={i + j}
              aspect="aspect-[4/3]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onClick={() => setSelectedIndex(i + j)}
              onPrefetch={prefetchImage}
            />
          ))}
        </FadeInBlock>,
      );
      i += row.length;
    }

    // Second HERO (only if enough left)
    if (i < images.length && (images.length - i) >= 3) {
      const heroIdx = i;
      blocks.push(
        <FadeInBlock key={`hero2-${blockKey}`}>
          <MediaCell
            item={images[heroIdx]}
            index={heroIdx}
            aspect="aspect-[16/7]"
            sizes="100vw"
            onClick={() => setSelectedIndex(heroIdx)}
            onPrefetch={prefetchImage}
          />
        </FadeInBlock>,
      );
      i += 1;
    }

    // ROW of 2
    if (i < images.length) {
      const row = images.slice(i, Math.min(i + 2, images.length));
      blocks.push(
        <FadeInBlock key={`row2-${blockKey}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {row.map((item, j) => (
            <MediaCell
              key={i + j}
              item={item}
              index={i + j}
              aspect="aspect-[3/2]"
              sizes="(max-width: 640px) 100vw, 50vw"
              onClick={() => setSelectedIndex(i + j)}
              onPrefetch={prefetchImage}
            />
          ))}
        </FadeInBlock>,
      );
      i += row.length;
    }

    blockKey += 1;
  }

  const selected = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <>
      <div className="space-y-3">
        {blocks}
      </div>

      {/* Lightbox */}
      {selected && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl font-normal hover:bg-white/20 hover:text-amber-400 transition-all z-10"
            onClick={() => setSelectedIndex(null)}
            aria-label="Cerrar"
          >
            ×
          </button>

          {selectedIndex > 0 && (
            <button
              className="absolute left-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl font-normal hover:bg-white/20 hover:text-amber-400 transition-all z-10"
              onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex - 1); }}
              aria-label="Anterior"
            >
              ‹
            </button>
          )}

          <div
            className="relative max-w-6xl max-h-[90vh] w-full h-full animate-[scaleIn_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {isVideo(selected) ? (
              <video
                key={selected.src}
                src={selected.src}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <Image
                src={selected.src}
                alt={selected.alt}
                fill
                className="object-contain"
                sizes="100vw"
                quality={75}
                priority
                loading="eager"
                placeholder="blur"
                blurDataURL={BLUR_DATA}
              />
            )}
          </div>

          {selectedIndex < images.length - 1 && (
            <button
              className="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl font-normal hover:bg-white/20 hover:text-amber-400 transition-all z-10"
              onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex + 1); }}
              aria-label="Siguiente"
            >
              ›
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm font-medium z-10">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
