'use client';

/**
 * PortfolioGallery.tsx
 *
 * Galería inmersiva con:
 * - Grid masonry con lazy loading
 * - Tap → fullscreen con pinch-to-zoom
 * - Swipe horizontal en fullscreen
 * - Double tap → like con animación
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Image from 'next/image';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface PortfolioItem {
  id: string;
  src: string;
  category: string;
  title: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

interface CategoryFilter {
  id: string;
  label: string;
  icon: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATOS
// ═══════════════════════════════════════════════════════════════════════════

const categories: CategoryFilter[] = [
  { id: 'all', label: 'Tot', icon: '✨' },
  { id: 'bodas', label: 'Casaments', icon: '💒' },
  { id: 'fiestas', label: 'Festes', icon: '🎉' },
  { id: 'tematicas', label: 'Temàtiques', icon: '🎭' },
  { id: 'empresas', label: 'Empreses', icon: '🏢' },
];

const portfolioItems: PortfolioItem[] = [
  { id: '1', src: '/img/portfolio/bodas/bodas-01.webp', category: 'bodas', title: 'Casament Mas Torroella', aspectRatio: 'landscape' },
  { id: '2', src: '/img/portfolio/bodas/bodas-02.webp', category: 'bodas', title: 'Casament Can Ribas', aspectRatio: 'portrait' },
  { id: '3', src: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp', category: 'fiestas', title: 'Aniversari 50', aspectRatio: 'square' },
  { id: '4', src: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg', category: 'tematicas', title: 'Festa Halloween', aspectRatio: 'landscape' },
  { id: '5', src: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp', category: 'empresas', title: 'Event Corporatiu', aspectRatio: 'portrait' },
  { id: '6', src: '/img/portfolio/bodas/bodas-03.webp', category: 'bodas', title: 'Casament Masia', aspectRatio: 'square' },
  { id: '7', src: '/img/portfolio/fiestas-privadas/fiestas-privadas-02.webp', category: 'fiestas', title: 'Comunió Alba', aspectRatio: 'landscape' },
  { id: '8', src: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp', category: 'tematicas', title: 'Festa Harry Potter', aspectRatio: 'portrait' },
  { id: '9', src: '/img/portfolio/bodas/bodas-04.webp', category: 'bodas', title: 'Boda Platja', aspectRatio: 'landscape' },
  { id: '10', src: '/img/portfolio/fiestas-privadas/fiestas-privadas-03.webp', category: 'fiestas', title: 'Graduació', aspectRatio: 'square' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE LIKE ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

function LikeAnimation({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: [0, 1.2, 1], rotate: [0, 10, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className="text-7xl"
          >
            ❤️
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE THUMBNAIL
// ═══════════════════════════════════════════════════════════════════════════

interface ThumbnailProps {
  item: PortfolioItem;
  index: number;
  onClick: () => void;
  onDoubleTap: () => void;
}

function Thumbnail({ item, index, onClick, onDoubleTap }: ThumbnailProps) {
  const [showLike, setShowLike] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();

  const handleClick = useCallback(() => {
    const now = Date.now();

    // Clear pending single tap
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    if (now - lastTapRef.current < 250) {
      // Double tap - like
      setShowLike(true);
      setTimeout(() => setShowLike(false), 800);
      onDoubleTap();
      if ('vibrate' in navigator) navigator.vibrate(20);
    } else {
      // Single tap - open viewer (reduced delay for better UX)
      tapTimeoutRef.current = setTimeout(() => {
        if (Date.now() - lastTapRef.current >= 200) {
          onClick();
        }
      }, 200);
    }
    lastTapRef.current = now;
  }, [onClick, onDoubleTap]);

  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative rounded-xl overflow-hidden ${aspectClasses[item.aspectRatio || 'square']}`}
      onClick={handleClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      whileTap={{ scale: 0.97 }}
    >
      {/* Skeleton loader */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
      )}

      <Image
        src={item.src}
        alt={item.title}
        fill
        className={`object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />

      {/* Overlay on press */}
      <motion.div
        className="absolute inset-0 bg-black/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: isPressed ? 1 : 0 }}
        transition={{ duration: 0.1 }}
      />

      {/* Title overlay */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white text-xs font-medium truncate">{item.title}</p>
      </div>

      <LikeAnimation show={showLike} />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE FULLSCREEN VIEWER
// ═══════════════════════════════════════════════════════════════════════════

interface FullscreenViewerProps {
  items: PortfolioItem[];
  initialIndex: number;
  onClose: () => void;
}

function FullscreenViewer({ items, initialIndex, onClose }: FullscreenViewerProps) {
  const [[currentIndex, direction], setPage] = useState([initialIndex, 0]);
  const [showLike, setShowLike] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Navigate
  const paginate = useCallback((newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < items.length) {
      setPage([newIndex, newDirection]);
      setIsZoomed(false);
    }
  }, [currentIndex, items.length]);

  // Swipe handling
  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (isZoomed) return; // Don't swipe when zoomed
      if (Math.abs(info.offset.y) > 100) {
        onClose();
      } else if (info.offset.x < -50) {
        paginate(1);
      } else if (info.offset.x > 50) {
        paginate(-1);
      }
    },
    [onClose, paginate, isZoomed]
  );

  // Double tap to zoom/like
  const lastTapRef = useRef(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap - toggle zoom or like
      if (isZoomed) {
        setIsZoomed(false);
      } else {
        setShowLike(true);
        setTimeout(() => setShowLike(false), 800);
        if ('vibrate' in navigator) navigator.vibrate(20);
      }
    }
    lastTapRef.current = now;
  }, [isZoomed]);

  const currentItem = items[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white/60 text-sm">
          {currentIndex + 1} / {items.length}
        </span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Image */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute inset-0 flex items-center justify-center"
          drag={!isZoomed ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={handleTap}
        >
          <motion.div
            className="relative w-full h-full touch-none"
            animate={{ scale: isZoomed ? 2 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Image
              src={currentItem.src}
              alt={currentItem.title}
              fill
              className="object-contain"
              priority
            />
          </motion.div>
          <LikeAnimation show={showLike} />
        </motion.div>
      </AnimatePresence>

      {/* Title */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-safe bg-gradient-to-t from-black/80 to-transparent">
        <motion.h3
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white font-semibold text-lg"
        >
          {currentItem.title}
        </motion.h3>
        <p className="text-white/60 text-sm capitalize">{currentItem.category}</p>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => paginate(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {currentIndex < items.length - 1 && (
        <button
          onClick={() => paginate(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Zoom hint */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="absolute bottom-32 left-0 right-0 z-10 flex justify-center"
      >
        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/60 text-xs">
          Pinça per fer zoom · Doble tap per ❤️
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function PortfolioGallery() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Filtrar items
  const filteredItems = activeCategory === 'all'
    ? portfolioItems
    : portfolioItems.filter(item => item.category === activeCategory);

  // Open fullscreen
  const openViewer = useCallback((index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, []);

  // Toggle like
  const toggleLike = useCallback((id: string) => {
    setLikedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <section className="py-12 px-4 lg:hidden">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Portfolio</h2>
        <p className="text-white/60">Les nostres millors feines</p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              if ('vibrate' in navigator) navigator.vibrate(10);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-amber-500 text-black font-medium'
                : 'bg-white/5 text-white/70'
            }`}
          >
            <span>{cat.icon}</span>
            <span className="text-sm">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Masonry grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredItems.map((item, index) => (
          <Thumbnail
            key={item.id}
            item={item}
            index={index}
            onClick={() => openViewer(index)}
            onDoubleTap={() => toggleLike(item.id)}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📸</span>
          <p className="text-white/60">No hi ha fotos en aquesta categoria</p>
        </div>
      )}

      {/* Liked counter */}
      {likedItems.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 right-4 z-40 px-4 py-2 bg-red-500/90 backdrop-blur-sm rounded-full text-white text-sm font-medium shadow-lg"
        >
          ❤️ {likedItems.size} favorites
        </motion.div>
      )}

      {/* Fullscreen viewer */}
      <AnimatePresence>
        {viewerOpen && (
          <FullscreenViewer
            items={filteredItems}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
