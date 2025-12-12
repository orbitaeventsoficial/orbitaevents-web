// app/components/sections/ServicesShowcase.tsx
// ÒRBITA EVENTS 4.0 - Cards de Serveis amb efecte 3D
'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  PartyPopper,
  Music,
  Building2,
  ArrowRight
} from 'lucide-react';

interface Service {
  id: string;
  translationKey: string;
  icon: typeof Heart;
  color: string;
  image: string;
  href: string;
}

const services: Service[] = [
  {
    id: 'weddings',
    translationKey: 'weddings',
    icon: Heart,
    color: 'from-rose-500 to-pink-500',
    image: '/img/portfolio/bodas/bodas-01.webp',
    href: '/servicios/bodas',
  },
  {
    id: 'parties',
    translationKey: 'parties',
    icon: PartyPopper,
    color: 'from-amber-500 to-orange-500',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    href: '/servicios/fiestas',
  },
  {
    id: 'mobile',
    translationKey: 'mobile',
    icon: Music,
    color: 'from-purple-500 to-violet-500',
    image: '/img/portfolio/discomovil/discomovil-01.png',
    href: '/servicios/discomovil',
  },
  {
    id: 'corporate',
    translationKey: 'corporate',
    icon: Building2,
    color: 'from-blue-500 to-cyan-500',
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    href: '/servicios/empresas',
  },
];


// Card 3D Individual amb seguiment del mouse
const ServiceCard3D = ({ service }: { service: Service }) => {
  const t = useTranslations('services');
  const tShowcase = useTranslations('servicesShowcase');
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation
  const springConfig = { stiffness: 150, damping: 15 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set((e.clientX - centerX) / rect.width);
    mouseY.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const Icon = service.icon;

  return (
    <Link href={service.href}>
      <motion.div
        ref={cardRef}
        className="relative h-80 sm:h-96 cursor-pointer group"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          perspective: 1000,
        }}
      >
        {/* Card principal */}
        <motion.div
          className="relative h-full rounded-3xl overflow-hidden"
          animate={{
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Imatge de fons */}
          <div className="absolute inset-0 z-0">
            <Image
              src={service.image}
              alt={t(`${service.translationKey}.name`)}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Overlay gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-30 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>

          {/* Glow border al hover */}
          <motion.div
            className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${service.color}`}
            animate={{ opacity: isHovered ? 0.4 : 0 }}
            style={{
              padding: '2px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* Contingut */}
          <div className="relative z-10 h-full p-6 sm:p-8 flex flex-col justify-between">
            {/* Header */}
            <div>
              {/* Icon amb glow */}
              <motion.div
                className={`inline-flex p-3 sm:p-4 rounded-2xl bg-gradient-to-r ${service.color} shadow-lg`}
                animate={{
                  scale: isHovered ? 1.1 : 1,
                  boxShadow: isHovered
                    ? '0 20px 40px rgba(0, 0, 0, 0.3)'
                    : '0 10px 20px rgba(0, 0, 0, 0.2)',
                }}
                style={{
                  transform: 'translateZ(30px)',
                }}
              >
                <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </motion.div>

              {/* Emoji Badge */}
              <motion.div
                className="mt-3 sm:mt-4"
                style={{ transform: 'translateZ(20px)' }}
              >
                <span className="text-2xl sm:text-3xl">{t(`${service.translationKey}.icon`)}</span>
              </motion.div>
            </div>

            {/* Títol i descripció */}
            <motion.div
              style={{ transform: 'translateZ(25px)' }}
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                {t(`${service.translationKey}.name`)}
              </h3>

              {/* Subtítol emocional */}
              <p className="text-white/60 text-lg italic mb-3">
                {tShowcase(`emotionalSubtitles.${service.id}`)}
              </p>

              {/* CTA */}
              <motion.div
                className="flex items-center gap-2 text-amber-400 font-semibold"
                animate={{
                  x: isHovered ? 5 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm sm:text-base">{tShowcase('explore')}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
              </motion.div>
            </motion.div>
          </div>

          {/* Reflection effect */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(
                105deg,
                transparent 40%,
                rgba(255, 255, 255, 0.1) 45%,
                rgba(255, 255, 255, 0.05) 50%,
                transparent 55%
              )`,
              transform: `translateX(${isHovered ? '100%' : '-100%'})`,
              transition: 'transform 0.6s ease-out',
            }}
          />
        </motion.div>
      </motion.div>
    </Link>
  );
};

// Component principal
export default function ServicesShowcase() {
  const t = useTranslations('servicesShowcase');

  return (
    <section className="relative py-20 sm:py-32 bg-[#030303] overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Títol de secció - ELS MONS */}
        <div id="els-mons" className="text-center mb-12 sm:mb-16 scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
              {t('sectionTitle')}{' '}
              <span className="bg-gradient-to-r from-amber-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                {t('sectionTitleHighlight')}
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
              {t('sectionSubtitle')}
            </p>
          </motion.div>
        </div>

        {/* Grid de serveis */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              <ServiceCard3D service={service} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
