'use client';

/**
 * Component de pujada de fotos per a elements d'inventari.
 * Accepta qualsevol format d'imatge (JPG, PNG, HEIC, BMP, TIFF, GIF, SVG...)
 * Converteix automàticament a WebP optimitzat (800px, qualitat 0.82)
 * i puja al storage local via API.
 */

import { useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchWithCsrf } from '@/lib/csrf';

// Constants alineades amb lib/inventory-image-constants.ts
// (importació directa no possible aquí perquè és codi de client-browser)
const MAX_DIMENSION = 800;       // INVENTORY_IMAGE_MAX_DIMENSION
const WEBP_QUALITY = 0.82;       // INVENTORY_IMAGE_WEBP_QUALITY_CLIENT (escala 0-1 per canvas.toBlob)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // INVENTORY_IMAGE_MAX_FILE_SIZE (10 MB)

interface Props {
  itemId: string;
  itemCode: string;
  currentImageUrl: string | null;
}

/**
 * Converteix qualsevol imatge a WebP optimitzat via canvas.
 * Redimensiona si supera MAX_DIMENSION mantenint aspect ratio.
 * Retorna un Blob WebP.
 */
function optimizeImage(file: File): Promise<{ blob: Blob; previewUrl: string; originalKB: number; optimizedKB: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    const originalKB = Math.round(file.size / 1024);

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
      if (!ctx) {
        reject(new Error('No s\'ha pogut crear el canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error convertint a WebP'));
            return;
          }

          const previewUrl = URL.createObjectURL(blob);
          const optimizedKB = Math.round(blob.size / 1024);
          resolve({ blob, previewUrl, originalKB, optimizedKB });
        },
        'image/webp',
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No s\'ha pogut llegir la imatge'));
    };

    img.src = url;
  });
}

export default function InventoryPhotoUpload({ itemId, itemCode, currentImageUrl }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const [dragActive, setDragActive] = useState(false);
  const [sizeInfo, setSizeInfo] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Només es permeten imatges');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('La imatge no pot superar 10 MB');
      return;
    }

    setUploading(true);
    setError(null);
    setSizeInfo(null);

    try {
      // 1. Convertir a WebP optimitzat al navegador
      const { blob, previewUrl, originalKB, optimizedKB } = await optimizeImage(file);

      setSizeInfo(`${originalKB} KB → ${optimizedKB} KB WebP`);
      setPreview(previewUrl);

      // 2. Pujar via API
      const formData = new FormData();
      formData.append('file', blob, `${itemCode}.webp`);

      const res = await fetchWithCsrf(`/api/admin/inventory/${itemId}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error pujant la foto');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error pujant foto');
      setPreview(currentImageUrl);
      setSizeInfo(null);
    } finally {
      setUploading(false);
    }
  }, [itemId, itemCode, currentImageUrl, router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleRemovePhoto = useCallback(async () => {
    setUploading(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/inventory/${itemId}/photo`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error eliminant foto');

      setPreview(null);
      setSizeInfo(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setUploading(false);
    }
  }, [itemId, router]);

  return (
    <div className="rounded-2xl border p-5 space-y-4">
      <h2 className="text-sm font-semibold">Foto</h2>

      {error && (
        <div className="rounded-xl border p-2">
          <p className="text-xs">{error}</p>
        </div>
      )}

      {preview ? (
        <div className="space-y-2">
          <div className="relative aspect-square rounded-xl overflow-hidden border">
            <Image
              src={preview}
              alt={itemCode}
              fill
              className="object-contain"
              unoptimized
            />
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-xl px-2 py-1 text-xs backdrop-blur-sm"
              >
                Canviar
              </button>
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="rounded-xl px-2 py-1 text-xs backdrop-blur-sm"
              >
                Treure
              </button>
            </div>
          </div>
          {sizeInfo && (
            <p className="text-[10px] text-center">{sizeInfo}</p>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
          }`}
        >
          {uploading ? (
            <>
              <span className="text-3xl mb-2 animate-pulse">...</span>
              <p className="text-sm">Convertint i pujant...</p>
            </>
          ) : (
            <>
              <span className="text-4xl mb-2">📷</span>
              <p className="text-sm">Arrossega una foto o fes clic</p>
              <p className="text-[10px] mt-1">Qualsevol format · Auto-converteix a WebP</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
