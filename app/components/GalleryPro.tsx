'use client';

/**
 * Simple Gallery Component for Portfolio
 * Displays images in a responsive grid
 */

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface GalleryImage {
  src: string;
  alt: string;
}

export function SimpleGallery({ images }: { images: GalleryImage[] }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const blurDataURL =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxMTEyMTQiLz48L3N2Zz4=";

  const prefetchImage = useCallback((src: string) => {
    if (typeof window === 'undefined') return;
    const img = new window.Image();
    img.src = src;
  }, []);

  useEffect(() => {
    if (selectedImage === null) return;
    const next = images[selectedImage + 1]?.src;
    const prev = images[selectedImage - 1]?.src;
    if (next) prefetchImage(next);
    if (prev) prefetchImage(prev);
  }, [selectedImage, images, prefetchImage]);

  return (
    <>
      {/* Grid de imágenes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image, index) => {
          // Primeres 6 imatges carreguen amb prioritat (2 files above the fold)
          const isPriority = index < 6;
          return (
            <div
              key={index}
              className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-stone-900"
              onClick={() => setSelectedImage(index)}
              onMouseEnter={() => prefetchImage(image.src)}
              onFocus={() => prefetchImage(image.src)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={60}
                priority={isPriority}
                loading={isPriority ? 'eager' : 'lazy'}
                placeholder="blur"
                blurDataURL={blurDataURL}
              />
            </div>
          );
        })}
      </div>

      {/* Modal de imagen ampliada */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl font-light hover:text-orange-500 transition-colors"
            onClick={() => setSelectedImage(null)}
            aria-label="Cerrar"
          >
            ×
          </button>

          {/* Navegación anterior */}
          {selectedImage > 0 && (
            <button
              className="absolute left-4 text-white text-4xl font-light hover:text-orange-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage - 1);
              }}
              aria-label="Anterior"
            >
              ‹
            </button>
          )}

          {/* Imagen */}
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <Image
              src={images[selectedImage].src}
              alt={images[selectedImage].alt}
              fill
              className="object-contain"
              sizes="100vw"
              quality={65}
              priority
              loading="eager"
              placeholder="blur"
              blurDataURL={blurDataURL}
            />
          </div>

          {/* Navegación siguiente */}
          {selectedImage < images.length - 1 && (
            <button
              className="absolute right-4 text-white text-4xl font-light hover:text-orange-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage + 1);
              }}
              aria-label="Siguiente"
            >
              ›
            </button>
          )}

          {/* Contador */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
