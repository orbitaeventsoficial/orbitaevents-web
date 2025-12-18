'use client';

/**
 * ServiceCards.tsx
 *
 * Cards 3D swipeables para servicios
 * - Tilt 3D en drag
 * - Swipe para navegar
 * - Expand con gesture (drag up)
 * - Animaciones staggered
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Service {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  priceNote?: string;
  image: string;
  icon: string;
  features: string[];
  href: string;
  color: string;
  gradient: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE SERVICIOS
// ═══════════════════════════════════════════════════════════════════════════

const services: Service[] = [
  {
    id: 'bodas',
    title: 'Casaments',
    subtitle: 'El dia més especial',
    description: 'DJ professional + so d\'alta qualitat + il·luminació LED + efectes especials. Tot el que necessites per fer màgic el teu gran dia.',
    price: '550€',
    priceNote: 'fins 8h',
    image: '/img/portfolio/bodas/bodas-01.webp',
    icon: '💒',
    features: ['DJ Professional', 'So 4000W', 'Llums LED', 'Efectes especials', 'Coordinació cerimònia'],
    href: '/servicios/bodas',
    color: 'amber',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    id: 'fiestas',
    title: 'Festes Privades',
    subtitle: 'Celebra a ho gran',
    description: 'Aniversaris, comunions, graduacions... Creem l\'ambient perfecte per a la teva festa amb música i llums espectaculars.',
    price: '350€',
    priceNote: 'fins 5h',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    icon: '🎉',
    features: ['DJ + So', 'Llums de festa', 'Màquina de fum', 'Karaoke opcional'],
    href: '/servicios/fiestas',
    color: 'purple',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    id: 'tematicas',
    title: 'Festes Temàtiques',
    subtitle: 'Experiències úniques',
    description: 'Halloween, Harry Potter, anys 80... Tematització completa amb decoració, efectes i ambientació immersiva.',
    price: '800€',
    priceNote: 'pack complet',
    image: '/img/portfolio/tematicas/halloween-01.webp',
    icon: '🎭',
    features: ['Decoració temàtica', 'Efectes especials', 'Ambientació sonora', 'Photocall'],
    href: '/tematica-halloween',
    color: 'orange',
    gradient: 'from-orange-500/20 to-red-500/20',
  },
  {
    id: 'empresas',
    title: 'Events Corporatius',
    subtitle: 'Professionalitat garantida',
    description: 'Team building, presentacions de producte, convencions, festes d\'empresa. Serveis adaptats a les necessitats corporatives.',
    price: 'Consultar',
    image: '/img/portfolio/empresas/empresas-01.webp',
    icon: '🏢',
    features: ['Microfonía wireless', 'So conferència', 'Streaming', 'Coordinació total'],
    href: '/servicios/empresas',
    color: 'blue',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 'discomovil',
    title: 'Discomòbil',
    subtitle: 'La festa a qualsevol lloc',
    description: 'Portem tot l\'equip necessari: DJ, so potent, llums i efectes. Ideal per a festes a l\'aire lliure o espais sense equip.',
    price: '400€',
    priceNote: 'fins 5h',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-02.webp',
    icon: '🚐',
    features: ['Equip autònom', 'So potent', 'Llums portàtils', 'Generador opcional'],
    href: '/servicios/discomovil',
    color: 'green',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE CARD INDIVIDUAL
// ═══════════════════════════════════════════════════════════════════════════

interface ServiceCardProps {
  service: Service;
  isActive: boolean;
  onExpand: () => void;
}

function ServiceCard({ service, isActive, onExpand }: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values para tilt 3D
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  // Handle mouse/touch move para tilt
  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set(clientX - centerX);
    y.set(clientY - centerY);
  }, [x, y]);

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  // Haptic
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Color variants
  const colorClasses: Record<string, { badge: string; button: string; glow: string }> = {
    amber: {
      badge: 'bg-amber-500/20 text-amber-400',
      button: 'bg-amber-500 hover:bg-amber-400 text-black',
      glow: 'shadow-amber-500/20',
    },
    purple: {
      badge: 'bg-purple-500/20 text-purple-400',
      button: 'bg-purple-500 hover:bg-purple-400 text-white',
      glow: 'shadow-purple-500/20',
    },
    orange: {
      badge: 'bg-orange-500/20 text-orange-400',
      button: 'bg-orange-500 hover:bg-orange-400 text-black',
      glow: 'shadow-orange-500/20',
    },
    blue: {
      badge: 'bg-blue-500/20 text-blue-400',
      button: 'bg-blue-500 hover:bg-blue-400 text-white',
      glow: 'shadow-blue-500/20',
    },
    green: {
      badge: 'bg-green-500/20 text-green-400',
      button: 'bg-green-500 hover:bg-green-400 text-black',
      glow: 'shadow-green-500/20',
    },
  };

  const colors = colorClasses[service.color] || colorClasses.amber;

  return (
    <motion.div
      ref={cardRef}
      className="relative w-full h-full perspective-1000"
      style={{
        rotateX: isActive ? rotateX : 0,
        rotateY: isActive ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchEnd={handleLeave}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`relative w-full h-full rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl ${colors.glow}`}>
        {/* Image */}
        <div className="absolute inset-0">
          <Image
            src={service.image}
            alt={service.title}
            fill
            className="object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent`} />
          <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-50`} />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-6">
          {/* Icon & Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{service.icon}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
              {service.price} {service.priceNote && <span className="opacity-70">· {service.priceNote}</span>}
            </span>
          </div>

          {/* Title & Subtitle */}
          <h3 className="text-2xl font-bold text-white mb-1">{service.title}</h3>
          <p className="text-white/60 text-sm mb-4">{service.subtitle}</p>

          {/* Features (mini) */}
          <div className="flex flex-wrap gap-2 mb-6">
            {service.features.slice(0, 3).map((feature, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-white/5 rounded-lg text-xs text-white/50"
              >
                {feature}
              </span>
            ))}
            {service.features.length > 3 && (
              <span className="px-2 py-1 bg-white/5 rounded-lg text-xs text-white/50">
                +{service.features.length - 3}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={service.href}
              className={`flex-1 py-3 rounded-xl font-semibold text-center transition-all active:scale-95 ${colors.button}`}
              onClick={triggerHaptic}
            >
              Veure detalls
            </Link>
            <button
              onClick={() => {
                triggerHaptic();
                onExpand();
              }}
              className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/70 active:scale-95"
              aria-label="Expandir"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Drag hint */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full" />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE EXPANDED VIEW
// ═══════════════════════════════════════════════════════════════════════════

function ExpandedServiceView({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-zinc-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="h-full overflow-y-auto"
        style={{ y, opacity }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
      >
        {/* Header Image */}
        <div className="relative h-72">
          <Image
            src={service.image}
            alt={service.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Drag indicator */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-6 pb-32">
          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-6">
            <span className="text-5xl">{service.icon}</span>
            <div>
              <h2 className="text-3xl font-bold text-white">{service.title}</h2>
              <p className="text-white/60">{service.subtitle}</p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6 p-4 bg-white/5 rounded-2xl">
            <p className="text-white/50 text-sm mb-1">Preu des de</p>
            <p className="text-3xl font-bold text-amber-400">
              {service.price}
              {service.priceNote && (
                <span className="text-base font-normal text-white/50 ml-2">
                  {service.priceNote}
                </span>
              )}
            </p>
          </div>

          {/* Description */}
          <p className="text-white/70 text-lg mb-8 leading-relaxed">
            {service.description}
          </p>

          {/* Features */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Què inclou</h3>
            <div className="space-y-3">
              {service.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-4">
            <Link
              href={service.href}
              className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-center transition-all active:scale-95"
            >
              Més informació
            </Link>
            <Link
              href="/contacto"
              className="flex-1 py-4 bg-white/10 text-white font-semibold rounded-xl text-center transition-all active:scale-95"
            >
              Contactar
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function ServiceCards() {
  const [[currentIndex, direction], setPage] = useState([0, 0]);
  const [expandedService, setExpandedService] = useState<Service | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Haptic
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Cambiar card
  const paginate = useCallback((newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < services.length) {
      triggerHaptic();
      setPage([newIndex, newDirection]);
    }
  }, [currentIndex, triggerHaptic]);

  // Handle swipe
  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x < -threshold) {
        paginate(1);
      } else if (info.offset.x > threshold) {
        paginate(-1);
      }
    },
    [paginate]
  );

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      zIndex: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      rotateY: direction < 0 ? 15 : -15,
      zIndex: 0,
    }),
  };

  return (
    <section className="py-12 px-4 lg:hidden">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Els nostres serveis</h2>
        <p className="text-white/60">Swipe per explorar</p>
      </div>

      {/* Cards container */}
      <div
        ref={containerRef}
        className="relative h-[480px] perspective-1000"
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
              rotateY: { duration: 0.3 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            <ServiceCard
              service={services[currentIndex]}
              isActive={true}
              onExpand={() => setExpandedService(services[currentIndex])}
            />
          </motion.div>
        </AnimatePresence>

        {/* Preview cards (behind) */}
        {currentIndex > 0 && (
          <div
            className="absolute inset-0 -translate-x-8 scale-90 opacity-30 pointer-events-none"
            style={{ transformOrigin: 'center right' }}
          >
            <div className="w-full h-full rounded-3xl bg-zinc-800" />
          </div>
        )}
        {currentIndex < services.length - 1 && (
          <div
            className="absolute inset-0 translate-x-8 scale-90 opacity-30 pointer-events-none"
            style={{ transformOrigin: 'center left' }}
          >
            <div className="w-full h-full rounded-3xl bg-zinc-800" />
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          onClick={() => paginate(-1)}
          disabled={currentIndex === 0}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex gap-2">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                triggerHaptic();
                setPage([i, i > currentIndex ? 1 : -1]);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-amber-500 w-6' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => paginate(1)}
          disabled={currentIndex === services.length - 1}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Counter */}
      <p className="text-center text-white/40 text-sm mt-3">
        {currentIndex + 1} / {services.length}
      </p>

      {/* Expanded view */}
      <AnimatePresence>
        {expandedService && (
          <ExpandedServiceView
            service={expandedService}
            onClose={() => setExpandedService(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
