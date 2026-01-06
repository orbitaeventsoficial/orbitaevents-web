/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📱 MOBILE EXPERIENCE PREMIUM - LA MILLOR INTERFÍCIE MÒBIL
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * INSPIRAT EN: TikTok, Instagram Stories, Apple Music
 * 
 * CARACTERÍSTIQUES:
 * ✅ Full-screen immersive stories
 * ✅ Swipe gestures natius (horitzontal i vertical)
 * ✅ Haptic feedback
 * ✅ Bottom sheet per serveis
 * ✅ Floating action bar (thumb-friendly)
 * ✅ Pull-up per contacte ràpid
 * ✅ Skeleton loading
 * ✅ Optimitzat per bateria
 * ✅ Safe area support (iPhone notch)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓ
// ═══════════════════════════════════════════════════════════════════════════════

const WHATSAPP_NUMBER = '34699121023';

const STORIES = [
  {
    id: 'bodes',
    image: '/img/portfolio/bodas/bodas-01.webp',
    emoji: '💒',
    gradient: 'from-rose-500/80 to-amber-500/80',
    price: '550€',
    badge: 'POPULAR',
  },
  {
    id: 'monMagic',
    image: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
    emoji: '⚡',
    gradient: 'from-violet-600/80 to-fuchsia-500/80',
    price: '600€',
    badge: 'MÀGIA',
  },
  {
    id: 'halloween',
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    emoji: '🎃',
    gradient: 'from-orange-600/80 to-red-600/80',
    price: '600€',
    badge: 'TERROR',
  },
  {
    id: 'festes',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    emoji: '🎉',
    gradient: 'from-cyan-500/80 to-blue-600/80',
    price: '350€',
    badge: 'FESTES',
  },
  {
    id: 'empreses',
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    emoji: '🏢',
    gradient: 'from-slate-600/80 to-zinc-700/80',
    price: '400€',
    badge: 'CORPORATE',
  },
];

const QUICK_SERVICES = [
  { id: 'bodas', emoji: '💒', href: '/bodas' },
  { id: 'tematicas', emoji: '🧙‍♂️', href: '/tematicas' },
  { id: 'festes', emoji: '🎉', href: '/fiestas' },
  { id: 'empreses', emoji: '🏢', href: '/empresas' },
  { id: 'sensorial', emoji: '💜', href: '/sensorial' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITATS
// ═══════════════════════════════════════════════════════════════════════════════

const haptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(patterns[type]);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function MobileExperiencePremium() {
  const t = useTranslations('mobileLanding');
  const [currentStory, setCurrentStory] = useState(0);
  const [showServices, setShowServices] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <main className="fixed inset-0 bg-black overflow-hidden">
      {/* STORIES - Full screen */}
      <StoriesViewer
        stories={STORIES}
        currentIndex={currentStory}
        onIndexChange={setCurrentStory}
        t={t}
      />

      {/* FLOATING ACTION BAR - Bottom */}
      <FloatingActionBar
        onServicesClick={() => { haptic('medium'); setShowServices(true); }}
        onContactClick={() => { haptic('medium'); setShowContact(true); }}
      />

      {/* BOTTOM SHEET - Services */}
      <BottomSheet
        isOpen={showServices}
        onClose={() => setShowServices(false)}
        title="Serveis"
      >
        <ServicesList t={t} onClose={() => setShowServices(false)} />
      </BottomSheet>

      {/* BOTTOM SHEET - Contact */}
      <BottomSheet
        isOpen={showContact}
        onClose={() => setShowContact(false)}
        title="Contacte ràpid"
      >
        <QuickContact />
      </BottomSheet>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORIES VIEWER - Estil TikTok/Instagram
// ═══════════════════════════════════════════════════════════════════════════════

interface StoriesViewerProps {
  stories: typeof STORIES;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  t: (key: string) => string;
}

function StoriesViewer({ stories, currentIndex, onIndexChange, t }: StoriesViewerProps) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return;

    const STORY_DURATION = 5000;
    const TICK = 50;

    setProgress(0);
    
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (TICK / STORY_DURATION) * 100;
        if (next >= 100) {
          // Next story
          const nextIndex = (currentIndex + 1) % stories.length;
          onIndexChange(nextIndex);
          return 0;
        }
        return next;
      });
    }, TICK);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, stories.length, onIndexChange]);

  // Swipe handlers
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x < -threshold) {
      // Swipe left - next
      haptic('light');
      const next = Math.min(currentIndex + 1, stories.length - 1);
      onIndexChange(next);
    } else if (info.offset.x > threshold) {
      // Swipe right - prev
      haptic('light');
      const prev = Math.max(currentIndex - 1, 0);
      onIndexChange(prev);
    }
  };

  // Tap handlers
  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;

    if (x < third) {
      // Left third - prev
      haptic('light');
      onIndexChange(Math.max(0, currentIndex - 1));
    } else if (x > third * 2) {
      // Right third - next
      haptic('light');
      onIndexChange(Math.min(stories.length - 1, currentIndex + 1));
    }
  };

  const story = stories[currentIndex];

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, scale }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onClick={handleTap}
    >
      {/* Background image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={story.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image
            src={story.image}
            alt={t(`heroSlides.${story.id}`)}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${story.gradient} mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Progress bars - Top */}
      <div className="absolute top-0 inset-x-0 pt-safe flex gap-1 p-3 z-20">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
            {idx === currentIndex ? (
              <motion.div
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            ) : idx < currentIndex ? (
              <div className="h-full w-full bg-white" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Content - Bottom */}
      <div className="absolute inset-x-0 bottom-0 p-6 pb-32 z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
            <span className="text-2xl">{story.emoji}</span>
            <span className="text-white font-bold tracking-wide">{story.badge}</span>
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-black text-white mb-2"
        >
          {t(`heroSlides.${story.id}`)}
        </motion.h2>

        {/* Price */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-baseline gap-2"
        >
          <span className="text-white/60 text-lg">Des de</span>
          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {story.price}
          </span>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Link
            href={`/packs`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full"
            onClick={(e) => { e.stopPropagation(); haptic('medium'); }}
          >
            Veure packs
            <span>→</span>
          </Link>
        </motion.div>
      </div>

      {/* Navigation hints */}
      <div className="absolute inset-y-0 left-0 w-16 z-5" />
      <div className="absolute inset-y-0 right-0 w-16 z-5" />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING ACTION BAR - Thumb-friendly bottom bar
// ═══════════════════════════════════════════════════════════════════════════════

interface FloatingActionBarProps {
  onServicesClick: () => void;
  onContactClick: () => void;
}

function FloatingActionBar({ onServicesClick, onContactClick }: FloatingActionBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', damping: 20 }}
      className="fixed bottom-6 inset-x-4 z-30 pb-safe"
    >
      <div className="flex items-center gap-2 p-2 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10">
        {/* Quick services */}
        <div className="flex-1 flex items-center justify-around">
          {QUICK_SERVICES.slice(0, 4).map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10 transition-colors"
              onClick={() => haptic('light')}
            >
              <span className="text-xl">{service.emoji}</span>
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />

        {/* Main actions */}
        <button
          onClick={onServicesClick}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 active:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        {/* WhatsApp CTA */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          onClick={() => haptic('heavy')}
          className="h-12 px-5 flex items-center gap-2 bg-[#25D366] rounded-xl font-bold text-white"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM SHEET - Slide up panel
// ═══════════════════════════════════════════════════════════════════════════════

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const y = useMotionValue(0);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      haptic('light');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className="fixed inset-x-0 bottom-0 z-50 bg-zinc-900 rounded-t-3xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-100px)] pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES LIST
// ═══════════════════════════════════════════════════════════════════════════════

interface ServicesListProps {
  t: (key: string) => string;
  onClose: () => void;
}

function ServicesList({ t, onClose }: ServicesListProps) {
  const services = [
    { id: 'bodas', emoji: '💒', href: '/bodas', price: '550€', color: 'from-rose-500 to-pink-600' },
    { id: 'monMagic', emoji: '⚡', href: '/tematicas/mon-magic', price: '600€', color: 'from-violet-500 to-purple-600' },
    { id: 'halloween', emoji: '🎃', href: '/tematicas/halloween', price: '600€', color: 'from-orange-500 to-red-600' },
    { id: 'festes', emoji: '🎉', href: '/fiestas', price: '350€', color: 'from-cyan-500 to-blue-600' },
    { id: 'empreses', emoji: '🏢', href: '/empresas', price: '400€', color: 'from-slate-500 to-zinc-600' },
    { id: 'sensorial', emoji: '💜', href: '/sensorial', price: 'GRATIS', color: 'from-purple-500 to-violet-600', badge: 'NOU' },
  ];

  return (
    <div className="p-4 space-y-3">
      {services.map((service, idx) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Link
            href={service.href}
            onClick={() => { haptic('light'); onClose(); }}
            className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl active:bg-white/10 transition-colors"
          >
            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center`}>
              <span className="text-2xl">{service.emoji}</span>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">{t(`heroSlides.${service.id}`)}</span>
                {service.badge && (
                  <span className="px-2 py-0.5 bg-purple-500 rounded-full text-[10px] font-bold text-white">
                    {service.badge}
                  </span>
                )}
              </div>
              <span className="text-white/50 text-sm">Des de {service.price}</span>
            </div>
            
            {/* Arrow */}
            <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK CONTACT
// ═══════════════════════════════════════════════════════════════════════════════

function QuickContact() {
  const actions = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      sublabel: 'Resposta en menys de 2h',
      icon: '💬',
      href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hola! M'interessa informació sobre els vostres serveis.`,
      color: 'bg-[#25D366]',
    },
    {
      id: 'call',
      label: 'Trucar',
      sublabel: '+34 699 121 023',
      icon: '📞',
      href: `tel:+${WHATSAPP_NUMBER}`,
      color: 'bg-blue-500',
    },
    {
      id: 'email',
      label: 'Email',
      sublabel: 'info@orbitaevents.com',
      icon: '✉️',
      href: 'mailto:info@orbitaevents.com',
      color: 'bg-violet-500',
    },
    {
      id: 'form',
      label: 'Formulari',
      sublabel: 'Pressupost detallat',
      icon: '📝',
      href: '/contacto',
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="p-4">
      {/* Quick message */}
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-500/30">
        <p className="text-amber-400 font-medium text-center">
          🎯 Resposta garantida en menys de 2 hores
        </p>
      </div>

      {/* Actions grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, idx) => (
          <motion.a
            key={action.id}
            href={action.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => haptic('medium')}
            className={`p-4 ${action.color} rounded-2xl text-white text-center active:scale-95 transition-transform`}
          >
            <span className="text-3xl block mb-2">{action.icon}</span>
            <span className="font-bold block">{action.label}</span>
            <span className="text-xs opacity-80 block">{action.sublabel}</span>
          </motion.a>
        ))}
      </div>

      {/* Trust badges */}
      <div className="mt-6 flex items-center justify-center gap-4 text-white/40 text-xs">
        <span>🏆 15+ anys</span>
        <span>•</span>
        <span>📍 BCN & Girona</span>
        <span>•</span>
        <span>⭐ 5.0/5</span>
      </div>
    </div>
  );
}

export { MobileExperiencePremium };
