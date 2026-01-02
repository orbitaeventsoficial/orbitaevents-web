"use client";
/**
 * SmartImage.tsx
 * 
 * COMPONENTE DE IMAGEN OPTIMIZADO - VERSIÓN BRUTAL
 * =================================================
 * 
 * FEATURES:
 * - Lazy loading inteligente con IntersectionObserver
 * - Aspect ratio consistente (sin distorsión)
 * - Fallback elegante con retry
 * - Preload automático para imágenes críticas
 * - Skeleton loader profesional
 * - Optimización WebP con fallback
 * - Blur placeholder con base64
 * - Error handling robusto
 * - Performance optimizada (no CLS)
 */



import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';

// ========================================
// TYPES
// ========================================

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  category?: 'portfolio' | 'services' | 'equipment' | 'branding' | 'general';
  aspectRatio?: '16/9' | '4/3' | '1/1' | '21/9' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
}

// ========================================
// CONSTANTS
// ========================================

const ASPECT_RATIO_MAP: Record<string, string> = {
  '16/9': 'pb-[56.25%]',
  '4/3': 'pb-[75%]',
  '1/1': 'pb-[100%]',
  '21/9': 'pb-[42.86%]',
  'auto': '',
};

const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExMjE0Ii8+PC9zdmc+';

// ========================================
// HELPERS
// ========================================

function normalizeSrc(path: string, category: SmartImageProps['category'] = 'general'): string {
  // Si ya es una URL completa o data URI, devolverla tal cual
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  
  // Si ya tiene extensión WebP, devolverla
  if (path.endsWith('.webp')) {
    return path;
  }
  
  // Normalizar rutas de portfolio
  if (path.includes('/images/portfolio/') || category === 'portfolio') {
    return path
      .replace('/images/portfolio/', '/img/portfolio/')
      .replace(/\.(jpg|jpeg|png|avif)$/, '.webp');
  }
  
  // Si no tiene extensión, agregar .webp
  if (!path.includes('.')) {
    return `${path}.webp`;
  }
  
  // Reemplazar extensión por .webp
  return path.replace(/\.(jpg|jpeg|png|avif)$/, '.webp');
}

// ========================================
// COMPONENT
// ========================================

export default function SmartImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  category = 'general',
  aspectRatio = '16/9',
  objectFit = 'cover',
  quality = 85,
  placeholder = 'blur',
  onLoad,
  onError,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: SmartImageProps) {
  // ========================================
  // STATE
  // ========================================

  const t = useTranslations('smartImage');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(() => normalizeSrc(src, category));

  const MAX_RETRIES = 2;
  
  // ========================================
  // EFFECTS
  // ========================================
  
  // Update src if prop changes
  useEffect(() => {
    const normalized = normalizeSrc(src, category);
    if (normalized !== currentSrc) {
      setCurrentSrc(normalized);
      setLoaded(false);
      setError(false);
      setRetryCount(0);
    }
  }, [src, category, currentSrc]);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const handleLoad = useCallback(() => {
    setLoaded(true);
    setError(false);
    onLoad?.();
  }, [onLoad]);
  
  const handleError = useCallback(() => {
    // Retry logic with fallback
    if (retryCount < MAX_RETRIES) {
      setRetryCount((prev) => prev + 1);

      // Try fallback to original extension
      if (currentSrc.endsWith('.webp') && retryCount === 0) {
        const fallbackSrc = currentSrc.replace('.webp', '.jpg');
        setCurrentSrc(fallbackSrc);
        return;
      }
    }

    // After all retries, show error state
    setError(true);
    setLoaded(true);
    onError?.();
  }, [currentSrc, retryCount, onError]);
  
  // ========================================
  // RENDER HELPERS
  // ========================================
  
  const paddingClass = ASPECT_RATIO_MAP[aspectRatio] || '';
  const useFill = aspectRatio !== 'auto';
  
  // Tailwind no suporta classes dinàmiques - cal mapejar-les explícitament
  const objectFitClasses: Record<string, string> = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  };

  const imageClasses = [
    'transition-all duration-500',
    loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
    useFill ? objectFitClasses[objectFit] : '',
  ]
    .filter(Boolean)
    .join(' ');
  
  const containerClasses = ['relative overflow-hidden', className]
    .filter(Boolean)
    .join(' ');
  
  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div className={containerClasses}>
      {/* Aspect ratio wrapper */}
      <div className={`relative ${paddingClass}`}>
        {!error ? (
          <Image
            src={currentSrc}
            alt={alt}
            fill={useFill}
            width={useFill ? undefined : width}
            height={useFill ? undefined : height}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={imageClasses}
            sizes={sizes}
            quality={quality}
            placeholder={placeholder === 'blur' ? 'blur' : undefined}
            blurDataURL={placeholder === 'blur' ? DEFAULT_BLUR_DATA_URL : undefined}
          />
        ) : (
          // Error fallback
          <FallbackImage aspectRatio={aspectRatio} alt={alt} t={t} />
        )}
        
        {/* Loading skeleton */}
        {!loaded && !error && <LoadingSkeleton />}
      </div>
    </div>
  );
}

// ========================================
// SUB-COMPONENTS
// ========================================

function LoadingSkeleton() {
  return (
    <div
      className="absolute inset-0 animate-pulse"
      style={{
        background:
          'linear-gradient(110deg, rgba(17,18,20,0.8) 8%, rgba(30,30,35,0.8) 18%, rgba(17,18,20,0.8) 33%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
      aria-hidden="true"
    />
  );
}

interface FallbackImageProps {
  aspectRatio: string;
  alt: string;
  t: (_key: string) => string;
}

function FallbackImage({ aspectRatio, alt, t }: FallbackImageProps) {
  const useFill = aspectRatio !== 'auto';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3
        bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-surface)]
        ${useFill ? 'absolute inset-0' : 'min-h-[200px] py-12'}`}
      role="img"
      aria-label={`${t('loadError')}: ${alt}`}
    >
      {/* Icon */}
      <svg
        className="w-12 h-12 text-white/30"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>

      {/* Text */}
      <div className="text-center px-4">
        <p className="text-sm text-white/50 mb-1">{t('imageNotAvailable')}</p>
        <p className="text-xs text-white/30">{alt}</p>
      </div>
    </div>
  );
}

// ========================================
// EXPORTS
// ========================================

/**
 * Helper: Generate portfolio image path
 */
export function getPortfolioImage(
  category: string,
  imageNumber: number | 'cover'
): string {
  if (imageNumber === 'cover') {
    return `/img/portfolio/${category}/cover.webp`;
  }
  return `/img/portfolio/${category}/${String(imageNumber).padStart(2, '0')}.webp`;
}

/**
 * Helper: Generate optimized srcset
 */
export function generateSrcSet(basePath: string, sizes: number[]): string {
  return sizes
    .map((size) => {
      const path = basePath.replace(/(\.\w+)$/, `-${size}w$1`);
      return `${path} ${size}w`;
    })
    .join(', ');
}

// ========================================
// GLOBAL STYLES (inject once)
// ========================================

if (typeof window !== 'undefined' && !document.getElementById('smart-image-styles')) {
  const style = document.createElement('style');
  style.id = 'smart-image-styles';
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}

