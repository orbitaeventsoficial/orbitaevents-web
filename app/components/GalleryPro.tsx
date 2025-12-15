// app/components/GalleryPro.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - GALLERY PRO v2.0
// ═══════════════════════════════════════════════════════════════════════════
//
// La galería que VENDE mostrando tu trabajo.
// Características:
// - Filtros por categoría con animaciones
// - Layout masonry adaptativo
// - Soporte para vídeos (YouTube, Vimeo, MP4)
// - Lightbox premium con zoom y swipe
// - Lazy loading optimizado
// - Hover effects cinematográficos
// - Info overlay con datos del evento
// - Share buttons integrados
// - Mobile-first con swipe
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

type MediaType = 'image' | 'video';

interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  type: MediaType;
  category: string;
  thumbnail?: string;
  videoUrl?: string;
  title?: string;
  description?: string;
  eventType?: string;
  location?: string;
  date?: string;
  featured?: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS SVG
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Play: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  ZoomIn: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  Share: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  Download: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Location: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Grid: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Masonry: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9"/>
      <rect x="14" y="3" width="7" height="5"/>
      <rect x="14" y="12" width="7" height="9"/>
      <rect x="3" y="16" width="7" height="5"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍAS POR DEFECTO
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', label: 'Todos', icon: '✨' },
  { id: 'bodas', label: 'Bodas', icon: '💍' },
  { id: 'fiestas', label: 'Fiestas', icon: '🎉' },
  { id: 'empresas', label: 'Empresas', icon: '💼' },
  { id: 'tematicas', label: 'Temáticas', icon: '🎃' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Gallery Item Card
// ═══════════════════════════════════════════════════════════════════════════

interface GalleryCardProps {
  item: GalleryItem;
  onClick: () => void;
  index: number;
  layout: 'grid' | 'masonry';
}

function GalleryCard({ item, onClick, index, layout }: GalleryCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  // Altura variable para masonry
  const heights = ['aspect-[4/3]', 'aspect-[3/4]', 'aspect-square', 'aspect-[4/5]'];
  const heightClass = layout === 'masonry' 
    ? heights[index % heights.length] 
    : 'aspect-[4/3]';
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer ${heightClass}`}
      onClick={onClick}
    >
      {/* Imagen/Thumbnail */}
      <Image
        src={item.thumbnail || item.src}
        alt={item.alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-all duration-700 group-hover:scale-110"
        loading="lazy"
      />
      
      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
      
      {/* Badge de categoría */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
        <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full">
          {item.category}
        </span>
      </div>
      
      {/* Indicador de video */}
      {item.type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
            <Icons.Play />
          </div>
        </div>
      )}
      
      {/* Badge featured */}
      {item.featured && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
            ⭐ DESTACADO
          </span>
        </div>
      )}
      
      {/* Info overlay (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
        {item.title && (
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
            {item.title}
          </h3>
        )}
        
        <div className="flex items-center gap-3 text-white/70 text-xs">
          {item.location && (
            <span className="flex items-center gap-1">
              <Icons.Location />
              {item.location}
            </span>
          )}
          {item.date && (
            <span className="flex items-center gap-1">
              <Icons.Calendar />
              {item.date}
            </span>
          )}
        </div>
      </div>
      
      {/* Hover zoom icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100">
        {item.type === 'image' && (
          <div className="w-14 h-14 rounded-full bg-amber-500/90 backdrop-blur-sm flex items-center justify-center text-black">
            <Icons.ZoomIn />
          </div>
        )}
      </div>
      
      {/* Border glow on hover */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 2px rgba(245, 158, 11, 0.5)' }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Lightbox Premium
// ═══════════════════════════════════════════════════════════════════════════

interface LightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function Lightbox({ items, currentIndex, onClose, onNavigate }: LightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const item = items[currentIndex];
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          onNavigate((currentIndex + 1) % items.length);
          setIsZoomed(false);
          break;
        case 'ArrowLeft':
          onNavigate((currentIndex - 1 + items.length) % items.length);
          setIsZoomed(false);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentIndex, items.length, onClose, onNavigate]);
  
  // Share handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title || 'Galería Òrbita Events',
          text: item.description || 'Mira este evento de Òrbita Events',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        <Icons.Close />
      </button>
      
      {/* Counter */}
      <div className="absolute top-4 left-4 z-20 text-white/60 text-sm font-medium">
        {currentIndex + 1} / {items.length}
      </div>
      
      {/* Actions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <button
          onClick={handleShare}
          className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          title="Compartir"
        >
          <Icons.Share />
        </button>
        {item.type === 'image' && (
          <a
            href={item.src}
            download
            className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title="Descargar"
          >
            <Icons.Download />
          </a>
        )}
      </div>
      
      {/* Navigation buttons */}
      <button
        onClick={() => {
          onNavigate((currentIndex - 1 + items.length) % items.length);
          setIsZoomed(false);
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 hover:bg-amber-500/80 flex items-center justify-center text-white hover:text-black transition-all"
      >
        <Icons.ChevronLeft />
      </button>
      
      <button
        onClick={() => {
          onNavigate((currentIndex + 1) % items.length);
          setIsZoomed(false);
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 hover:bg-amber-500/80 flex items-center justify-center text-white hover:text-black transition-all"
      >
        <Icons.ChevronRight />
      </button>
      
      {/* Main content */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: isZoomed ? 1.5 : 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`relative max-w-[90vw] max-h-[80vh] ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        onClick={() => item.type === 'image' && setIsZoomed(!isZoomed)}
      >
        {item.type === 'image' ? (
          <Image
            src={item.src}
            alt={item.alt}
            width={1920}
            height={1080}
            className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg"
            priority
          />
        ) : (
          <div className="relative w-[80vw] max-w-4xl aspect-video rounded-lg overflow-hidden">
            {item.videoUrl?.includes('youtube') ? (
              <iframe
                src={item.videoUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : item.videoUrl?.includes('vimeo') ? (
              <iframe
                src={item.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={item.videoUrl || item.src}
                className="w-full h-full"
                controls
                autoPlay
              />
            )}
          </div>
        )}
      </motion.div>
      
      {/* Item info */}
      {(item.title || item.description) && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          {item.title && (
            <h3 className="text-white font-semibold text-lg mb-1">{item.title}</h3>
          )}
          {item.description && (
            <p className="text-white/60 text-sm max-w-2xl mx-auto">{item.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 mt-2 text-white/50 text-xs">
            {item.eventType && <span>{item.eventType}</span>}
            {item.location && (
              <span className="flex items-center gap-1">
                <Icons.Location />
                {item.location}
              </span>
            )}
            {item.date && (
              <span className="flex items-center gap-1">
                <Icons.Calendar />
                {item.date}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Thumbnails strip */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-2 scrollbar-hide">
        {items.map((thumbItem, idx) => (
          <button
            key={thumbItem.id}
            onClick={() => {
              onNavigate(idx);
              setIsZoomed(false);
            }}
            className={`
              relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300
              ${idx === currentIndex 
                ? 'ring-2 ring-amber-500 scale-110' 
                : 'opacity-50 hover:opacity-100'
              }
            `}
          >
            <Image
              src={thumbItem.thumbnail || thumbItem.src}
              alt={thumbItem.alt}
              fill
              className="object-cover"
            />
            {thumbItem.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="text-white text-xs">▶</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: GalleryPro
// ═══════════════════════════════════════════════════════════════════════════

interface GalleryProProps {
  items: GalleryItem[];
  categories?: Category[];
  className?: string;
  showLayoutToggle?: boolean;
  initialLayout?: 'grid' | 'masonry';
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export function GalleryPro({
  items,
  categories = DEFAULT_CATEGORIES,
  className = '',
  showLayoutToggle = true,
  initialLayout = 'masonry',
  columns = { sm: 1, md: 2, lg: 3 }
}: GalleryProProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [layout, setLayout] = useState<'grid' | 'masonry'>(initialLayout);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Filtrar items por categoría
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter(item => item.category.toLowerCase() === activeCategory);
  }, [items, activeCategory]);
  
  // Calcular conteo por categoría
  const categoriesWithCount = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      count: cat.id === 'all' 
        ? items.length 
        : items.filter(item => item.category.toLowerCase() === cat.id).length
    }));
  }, [categories, items]);
  
  // Grid classes
  const gridClasses = useMemo(() => {
    if (layout === 'masonry') {
      return `columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4`;
    }
    return `grid grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} gap-4`;
  }, [layout, columns]);
  
  return (
    <div className={className}>
      {/* Header con filtros y layout toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Filtros de categoría */}
        <div className="flex flex-wrap gap-2">
          {categoriesWithCount.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${activeCategory === cat.id
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }
              `}
            >
              <span className="mr-1.5">{cat.icon}</span>
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span className={`ml-1.5 ${activeCategory === cat.id ? 'text-black/60' : 'text-white/40'}`}>
                  ({cat.count})
                </span>
              )}
            </motion.button>
          ))}
        </div>
        
        {/* Layout toggle */}
        {showLayoutToggle && (
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-md transition-colors ${
                layout === 'grid' ? 'bg-amber-500 text-black' : 'text-white/50 hover:text-white'
              }`}
              title="Vista cuadrícula"
            >
              <Icons.Grid />
            </button>
            <button
              onClick={() => setLayout('masonry')}
              className={`p-2 rounded-md transition-colors ${
                layout === 'masonry' ? 'bg-amber-500 text-black' : 'text-white/50 hover:text-white'
              }`}
              title="Vista mosaico"
            >
              <Icons.Masonry />
            </button>
          </div>
        )}
      </div>
      
      {/* Contador de resultados */}
      <div className="mb-4 text-white/50 text-sm">
        {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
        {activeCategory !== 'all' && (
          <button
            onClick={() => setActiveCategory('all')}
            className="ml-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            Ver todos →
          </button>
        )}
      </div>
      
      {/* Gallery grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + layout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={layout === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3 gap-4' : `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}
        >
          {filteredItems.map((item, index) => (
            <div key={item.id} className={layout === 'masonry' ? 'break-inside-avoid mb-4' : ''}>
              <GalleryCard
                item={item}
                onClick={() => setLightboxIndex(index)}
                index={index}
                layout={layout}
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
      
      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">📷</span>
          <p className="text-white/50">No hay elementos en esta categoría</p>
          <button
            onClick={() => setActiveCategory('all')}
            className="mt-4 text-amber-400 hover:text-amber-300 transition-colors"
          >
            Ver todos los elementos
          </button>
        </div>
      )}
      
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            items={filteredItems}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT: Versión simple sin filtros
// ═══════════════════════════════════════════════════════════════════════════

interface SimpleGalleryProps {
  images: { src: string; alt: string }[];
  className?: string;
}

export function SimpleGallery({ images, className = '' }: SimpleGalleryProps) {
  const items: GalleryItem[] = images.map((img, i) => ({
    id: `img-${i}`,
    src: img.src,
    alt: img.alt,
    type: 'image' as MediaType,
    category: 'all',
  }));
  
  return (
    <GalleryPro
      items={items}
      categories={[]}
      className={className}
      showLayoutToggle={false}
      initialLayout="grid"
    />
  );
}

export default GalleryPro;
