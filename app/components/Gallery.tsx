// app/components/Gallery.tsx
// ÒRBITA EVENTS 4.0 - Galeria amb Lightbox Professional
'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

type GalleryProps = {
  images: { src: string; alt: string }[];
};

export function Gallery({ images }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
    setIsZoomed(false);
    document.body.style.overflow = 'unset';
  }, []);

  const goNext = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
      setIsZoomed(false);
    }
  }, [selectedIndex, images.length]);

  const goPrev = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
      setIsZoomed(false);
    }
  }, [selectedIndex, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, closeLightbox, goNext, goPrev]);

  return (
    <>
      {/* Grid de imatges */}
      <div className="grid gap-4 md:grid-cols-3">
        {images.map((img, index) => (
          <motion.div
            key={img.src}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            onClick={() => openLightbox(index)}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Overlay al hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center backdrop-blur-sm">
                  <ZoomIn className="w-6 h-6 text-black" />
                </div>
              </motion.div>
            </div>

            {/* Border glow al hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 0 2px rgba(215, 184, 110, 0.5)',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              onClick={closeLightbox}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Contingut */}
            <div className="relative z-10 w-full h-full flex flex-col">
              {/* Header amb controls */}
              <div className="flex items-center justify-between p-4 md:p-6">
                <div className="text-white/60 text-sm">
                  {selectedIndex + 1} / {images.length}
                </div>

                <button
                  onClick={closeLightbox}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Imatge principal */}
              <div className="flex-1 flex items-center justify-center px-4 pb-4">
                <motion.div
                  key={selectedIndex}
                  className={`relative max-w-[90vw] max-h-[80vh] ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: isZoomed ? 1.5 : 1
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  <Image
                    src={images[selectedIndex].src}
                    alt={images[selectedIndex].alt}
                    width={1600}
                    height={1200}
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                    priority
                  />
                </motion.div>
              </div>

              {/* Navegació */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <button
                  onClick={goPrev}
                  className="w-14 h-14 rounded-full bg-white/10 hover:bg-amber-500/80 flex items-center justify-center transition-all duration-300 group"
                >
                  <ChevronLeft className="w-8 h-8 text-white group-hover:text-black transition-colors" />
                </button>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <button
                  onClick={goNext}
                  className="w-14 h-14 rounded-full bg-white/10 hover:bg-amber-500/80 flex items-center justify-center transition-all duration-300 group"
                >
                  <ChevronRight className="w-8 h-8 text-white group-hover:text-black transition-colors" />
                </button>
              </div>

              {/* Thumbnails */}
              <div className="flex justify-center gap-2 p-4 overflow-x-auto scrollbar-hide">
                {images.map((img, index) => (
                  <button
                    key={img.src}
                    onClick={() => {
                      setSelectedIndex(index);
                      setIsZoomed(false);
                    }}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 ${
                      index === selectedIndex
                        ? 'ring-2 ring-amber-500 scale-110'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
