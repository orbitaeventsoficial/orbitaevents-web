// app/components/ui/Card3D.tsx
// ÒRBITA EVENTS - Card amb efecte 3D WOW
// Hover 3D amb reflexos i glow multicolor

'use client';

import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'gold' | 'purple' | 'fuchsia' | 'multicolor';
  intensity?: 'subtle' | 'medium' | 'strong';
}

export default function Card3D({
  children,
  className = '',
  glowColor = 'multicolor',
  intensity = 'medium',
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Configurar intensitat
  const rotateIntensity = intensity === 'subtle' ? 8 : intensity === 'medium' ? 15 : 20;
  const glowIntensity = intensity === 'subtle' ? 0.3 : intensity === 'medium' ? 0.5 : 0.7;

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [rotateIntensity, -rotateIntensity]), { damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-rotateIntensity, rotateIntensity]), { damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPos = (e.clientX - rect.left) / rect.width - 0.5;
    const yPos = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPos);
    y.set(yPos);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  // Configurar colors del glow
  const glowStyles = {
    gold: 'from-amber-500/40 via-yellow-400/30 to-amber-500/40',
    purple: 'from-purple-500/40 via-violet-400/30 to-purple-500/40',
    fuchsia: 'from-fuchsia-500/40 via-pink-400/30 to-fuchsia-500/40',
    multicolor: 'from-amber-500/30 via-fuchsia-500/20 to-purple-500/30',
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative ${className}`}
    >
      {/* Reflection/Shine effect - moves with cursor */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
        style={{
          transform: 'translateZ(2px)',
        }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"
          animate={{
            opacity: isHovered ? 0.6 : 0,
            x: isHovered ? `${x.get() * 100}%` : '0%',
            y: isHovered ? `${y.get() * 100}%` : '0%',
          }}
          transition={{ duration: 0.1 }}
        />
      </motion.div>

      {/* Glow effect on hover */}
      <motion.div
        className={`absolute -inset-2 rounded-3xl bg-gradient-to-r ${glowStyles[glowColor]} blur-xl pointer-events-none`}
        animate={{
          opacity: isHovered ? glowIntensity : 0,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          boxShadow: isHovered
            ? glowColor === 'multicolor'
              ? '0 0 30px rgba(215, 184, 110, 0.3), 0 0 60px rgba(217, 70, 239, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
              : glowColor === 'gold'
              ? '0 0 40px rgba(215, 184, 110, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
              : glowColor === 'purple'
              ? '0 0 40px rgba(147, 51, 234, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 0 40px rgba(217, 70, 239, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
            : 'none',
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Content with 3D lift effect */}
      <div
        className="relative"
        style={{
          transform: isHovered ? 'translateZ(30px)' : 'translateZ(0px)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

// ========================================
// VARIANT: Card3D amb contingut integrat
// ========================================

interface Card3DContentProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  image?: string;
  children?: ReactNode;
  className?: string;
  glowColor?: 'gold' | 'purple' | 'fuchsia' | 'multicolor';
}

export function Card3DContent({
  title,
  description,
  icon,
  image,
  children,
  className = '',
  glowColor = 'multicolor',
}: Card3DContentProps) {
  return (
    <Card3D glowColor={glowColor} className={className}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 p-6 backdrop-blur-sm">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 pointer-events-none" />

        {/* Image if provided */}
        {image && (
          <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-2xl">
            <Image
              src={image}
              alt={title || ''}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Icon */}
        {icon && (
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-white/10">
            {icon}
          </div>
        )}

        {/* Title */}
        {title && (
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        )}

        {/* Description */}
        {description && (
          <p className="text-white/70 text-sm leading-relaxed">{description}</p>
        )}

        {/* Children */}
        {children}
      </div>
    </Card3D>
  );
}
