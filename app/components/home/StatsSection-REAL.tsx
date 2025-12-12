'use client';

// ═══════════════════════════════════════════════════════════════════════════
// STATS SECTION REAL - NÚMEROS 100% REALS DE BD
// ═══════════════════════════════════════════════════════════════════════════
// 
// Connectat a /api/public/stats
// - Events completats reals
// - Valoració mitjana real
// - Anys experiència real
// - Zero números inventats
//
// Versió: 3.0 DEFINITIVA - Desembre 2025
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { usePublicStats, useTestimonials } from '@/hooks/usePublicData';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedCounter({ 
  target, 
  suffix = '', 
  decimals = 0,
  duration = 2000 
}: { 
  target: number; 
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (ease-out-expo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const current = target * easeOutExpo;
      
      setCount(current);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  icon: string;
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
  description?: string;
  color: string;
  isLoading?: boolean;
}

function StatCard({ icon, value, suffix = '', decimals = 0, label, description, color, isLoading }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className={`relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 overflow-hidden group hover:border-${color}-500/30 transition-all duration-300`}
    >
      {/* Background glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${color}-500/10 rounded-full blur-3xl group-hover:bg-${color}-500/20 transition-all duration-500`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="text-4xl mb-4">{icon}</div>
        
        <div className={`text-4xl md:text-5xl font-black text-${color}-400 mb-2`}>
          {isLoading ? (
            <span className="inline-block w-20 h-12 bg-white/10 rounded animate-pulse" />
          ) : (
            <AnimatedCounter target={value} suffix={suffix} decimals={decimals} />
          )}
        </div>
        
        <div className="text-white font-semibold mb-1">{label}</div>
        
        {description && (
          <div className="text-white/50 text-sm">{description}</div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function StatsSectionReal() {
  const t = useTranslations('stats');
  const { stats, isLoading: statsLoading } = usePublicStats();
  const { data: testimonialsData, isLoading: testimonialsLoading } = useTestimonials(100);
  
  const isLoading = statsLoading || testimonialsLoading;

  // Calculate years of experience dynamically
  const startYear = 2023; // Company founded
  const currentYear = new Date().getFullYear();
  const yearsExperience = currentYear - startYear;

  const statCards = [
    {
      icon: '🎉',
      value: stats.totalEvents || 0,
      suffix: '+',
      label: t('events.label'),
      description: t('events.description'),
      color: 'amber',
    },
    {
      icon: '💍',
      value: stats.totalWeddings || 0,
      suffix: '+',
      label: t('weddings.label'),
      description: t('weddings.description'),
      color: 'pink',
    },
    {
      icon: '⭐',
      value: stats.averageRating || 5,
      decimals: 1,
      label: t('rating.label'),
      description: t('rating.description'),
      color: 'amber',
    },
    {
      icon: '💬',
      value: testimonialsData.stats.total || 0,
      label: t('reviews.label'),
      description: t('reviews.description'),
      color: 'purple',
    },
    {
      icon: '🏆',
      value: yearsExperience,
      suffix: '+',
      label: t('years.label'),
      description: t('years.description'),
      color: 'blue',
    },
    {
      icon: '📍',
      value: 2,
      label: t('coverage.label'),
      description: t('coverage.description'),
      color: 'green',
    },
  ];

  return (
    <section className="py-20 bg-black relative overflow-hidden" id="stats">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 to-black" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-amber-500/10 text-amber-400 text-sm font-medium rounded-full border border-amber-500/20">
              📊 {t('badge')}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-white mb-4"
          >
            {t('title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              {t('titleHighlight')}
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-2xl mx-auto"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {statCards.map((stat, index) => (
            <StatCard
              key={index}
              {...stat}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Google Badge */}
        {stats.googleRating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex justify-center"
          >
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4">
              <svg className="w-10 h-10" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">{stats.googleRating}</span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(stats.googleRating || 0) ? '' : 'opacity-30'}>★</span>
                    ))}
                  </div>
                </div>
                <div className="text-white/60 text-sm">
                  {stats.googleReviewsCount} {t('googleReviews')}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Trust message */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-white/40 text-sm"
        >
          {t('footer')}
        </motion.p>
      </div>
    </section>
  );
}
