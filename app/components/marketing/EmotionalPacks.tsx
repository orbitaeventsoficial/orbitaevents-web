"use client";

// app/components/marketing/EmotionalPacks.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle2, ArrowRight, Sparkles, Heart, Building2, Zap } from 'lucide-react';
import { trackPackSelection } from '@/lib/analytics';
import { getAllPacks, type PackDefinition } from '@/config/packs-config';
import { useTranslations } from 'next-intl';

// === TIPO PACK (ESENCIAL) ===
interface Pack {
  id: string;
  name: string;
  tagline: string;
  emotion: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  features: string[];
  highlight: boolean;
  ctaLabel: string;
  ctaHref: string;
  gradient: string;
  glowColor: string;
  icon: 'heart' | 'building' | 'sparkles';
}

export default function EmotionalPacks() {
  const t = useTranslations('packs');
  const tCommon = useTranslations('common.buttons');
  const [packs, setPacks] = useState<Pack[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Mapeo directo de packs-config → componente (memoitzat)
  const mapPack = useCallback((pack: PackDefinition): Pack => ({
    id: pack.id,
    name: pack.name,
    tagline: pack.tagline,
    emotion: pack.emotion || '',
    price: pack.priceValue,
    originalPrice: pack.priceOriginal ? parseInt(pack.priceOriginal.replace('€', '')) : undefined,
    discount: pack.priceOriginal ? Math.round((1 - pack.priceValue / parseInt(pack.priceOriginal.replace('€', ''))) * 100) : undefined,
    features: pack.features,
    highlight: pack.highlight || false,
    ctaLabel: tCommon('configure'),
    ctaHref: `/configurador?service=${pack.service}&packId=${pack.id}`,
    gradient: pack.service === 'bodas' ? 'from-oe-gold/20 via-red-500/20 to-oe-gold/20' :
             pack.service === 'empresas' ? 'from-oe-gold/20 via-oe-gold/20 to-oe-gold/20' :
             'from-green-500/20 via-oe-gold/20 to-oe-gold/20',
    glowColor: pack.service === 'bodas' ? 'rgba(236, 72, 153, 0.3)' :
               pack.service === 'empresas' ? 'rgba(99, 102, 241, 0.3)' :
               'rgba(34, 197, 94, 0.3)',
    icon: pack.service === 'bodas' ? 'heart' : pack.service === 'empresas' ? 'building' : 'sparkles',
  }), [tCommon]);

  // SIN API → DIRECTO DE packs-config.ts
  useEffect(() => {
    const allPacks = getAllPacks().filter(p => p.service !== 'alquiler');
    const cheapestPacks = allPacks
      .sort((a, b) => a.priceValue - b.priceValue)
      .slice(0, 3);
    setPacks(cheapestPacks.map(mapPack));
  }, [mapPack]);

  // Handler memoitzat per evitar re-renders
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      {/* ... fondo aurora igual ... */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-main via-bg-surface to-bg-main" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-oe-gold/10 rounded-full blur-3xl animate-aurora" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-oe-gold/10 rounded-full blur-3xl animate-aurora" style={{ animationDelay: '5s' }} />

      <div className="mx-auto max-w-7xl px-4 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block mb-4 px-4 py-2 rounded-full glass border border-oe-gold/30 animate-fade-in">
            <span className="text-oe-gold font-bold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t('badge')}
            </span>
          </div>
          <h2 className="text-h2 text-white mb-6 animate-fade-in-up">
            {t('title')}
            <br />
            <span className="gradient-text-gold">{t('titleHighlight')}</span>
          </h2>
          <p className="text-xl text-text-muted max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {packs.map((pack, index) => {
            const Icon = iconMap[pack.icon];
            const isHighlight = pack.highlight;
            const _isHovered = hoveredCard === index;

            return (
              <div
                key={pack.id}
                ref={(el) => { cardRefs.current[index] = el; }}
                className={`group relative rounded-3xl p-8 transition-all duration-500 transform
                  ${isHighlight ? 'md:-translate-y-6 md:scale-110' : ''}
                  hover:scale-110 hover:-translate-y-4 hover:rotate-1`}
                style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onMouseMove={(e) => handleMouseMove(e, index)}
              >
                {/* BRUTAL GLOW EFFECT */}
                <div className={`absolute inset-0 rounded-3xl transition-all duration-500 ${isHighlight ? 'bg-gradient-to-br from-oe-gold/30 via-yellow-400/20 to-oe-gold/30 blur-2xl opacity-60 group-hover:opacity-100 group-hover:blur-3xl' : 'bg-oe-gold/0 group-hover:bg-oe-gold/20 blur-xl opacity-0 group-hover:opacity-80'}`} />

                <div className={`relative rounded-3xl p-8 h-full flex flex-col bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl
                  ${isHighlight ? 'border-2 border-oe-gold shadow-[0_0_60px_rgba(218,165,32,0.6)] group-hover:shadow-[0_0_100px_rgba(218,165,32,0.9)]' : 'border-2 border-white/20 group-hover:border-oe-gold/80 group-hover:shadow-[0_0_50px_rgba(218,165,32,0.5)]'}
                  transition-all duration-500`}
                >
                  {/* Etiqueta del tipo de servicio - PULSE SUAVE */}
                  <div className="absolute -top-3 left-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wide shadow-[0_0_20px_rgba(147,51,234,0.6)] hover:shadow-[0_0_30px_rgba(147,51,234,0.9)] transition-all duration-300 animate-pulse-slow hover:scale-110 cursor-default">
                    {pack.name.includes('Boda') || pack.name.includes('Nupcial') ? `💍 ${t('wedding')}` :
                     pack.name.includes('Party') || pack.name.includes('VIP Experience') ? `🎵 ${t('mobile')}` :
                     pack.name.includes('Corporate') || pack.name.includes('Team Building') ? `💼 ${t('corporate')}` :
                     pack.name.includes('Flash') || pack.name.includes('Fiesta') ? `🎉 ${t('party')}` : `✨ ${t('event')}`}
                  </div>

                  {isHighlight && (
                    <div className="absolute -top-3 right-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-oe-gold via-yellow-300 to-oe-gold text-black text-xs font-black font-display shadow-[0_0_25px_rgba(218,165,32,0.8)] hover:shadow-[0_0_40px_rgba(218,165,32,1)] transition-all duration-300 animate-pulse hover:scale-110 cursor-default">
                      ⭐ {t('mostPopular')}
                    </div>
                  )}

                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 relative
                    ${isHighlight ? 'bg-oe-gold/20' : 'bg-white/5'}
                    group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                  >
                    <Icon className={`w-8 h-8 ${isHighlight ? 'text-oe-gold' : 'text-white'} drop-shadow-glow`} />
                    <div className="absolute inset-0 bg-oe-gold/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-display font-black text-white mb-2 group-hover:text-oe-gold transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_10px_rgba(218,165,32,0.8)]">
                    {pack.name}
                  </h3>
                  <p className="text-sm font-bold text-oe-gold mb-6 uppercase tracking-wide group-hover:tracking-wider transition-all duration-300 animate-pulse">
                    {pack.tagline}
                  </p>

                  {/* TEXTO EMOCIONAL - SIN FONDO */}
                  <div className="relative mb-6 p-4 rounded-xl border border-oe-gold/20 group-hover:border-oe-gold/50 transition-all duration-500 overflow-hidden">
                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-oe-gold/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                    <p className="relative text-white/80 italic text-sm leading-relaxed group-hover:text-white transition-colors duration-300">
                      "{pack.emotion}"
                    </p>
                    <div className="absolute -top-2 -left-2 text-4xl text-oe-gold/30 group-hover:text-oe-gold/60 font-serif transition-all duration-300">"</div>
                  </div>

                  <div className="relative mb-6 p-4 rounded-xl border border-oe-gold/30 group-hover:border-oe-gold group-hover:shadow-[0_0_30px_rgba(218,165,32,0.4)] transition-all duration-500">
                    {pack.originalPrice && (
                      <div className="text-sm text-text-muted line-through mb-1 group-hover:text-red-400 transition-colors">
                        {pack.originalPrice}€
                      </div>
                    )}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <div className={`text-4xl font-display font-black transition-all duration-300 group-hover:scale-110 ${isHighlight ? 'gradient-text-gold animate-pulse' : 'text-white group-hover:text-oe-gold'}`}>
                        {t('from')} {pack.price}€
                      </div>
                      {pack.discount && (
                        <span className="text-xs text-green-400 font-bold px-2 py-1 rounded-full bg-green-400/20 border border-green-400/40 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse">
                          ¡{t('save')} {pack.discount}%!
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-grow">
                    {pack.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-text-muted group/item hover:text-white hover:translate-x-1 transition-all duration-300">
                        <CheckCircle2 className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5 group-hover/item:scale-125 group-hover/item:rotate-12 group-hover/item:drop-shadow-[0_0_8px_rgba(218,165,32,0.8)] transition-all duration-300" />
                        <span className="text-sm leading-snug">{feature}</span>
                      </li>
                    ))}
                    {pack.features.length > 5 && (
                      <li className="text-xs text-text-muted/70">
                        +{pack.features.length - 5} {t('moreDetails')}
                      </li>
                    )}
                  </ul>

                  <a
                    href={pack.ctaHref}
                    onClick={() => trackPackSelection({
                      packId: pack.id as any,
                      packType: pack.name.includes('Boda') ? 'boda' : pack.name.includes('Corporate') ? 'empresa' : 'fiesta'
                    })}
                    className={`group/btn relative inline-flex items-center justify-center gap-2 w-full rounded-xl px-6 py-4 font-bold font-display transition-all duration-500 overflow-hidden
                      ${isHighlight
                        ? 'bg-gradient-to-r from-oe-gold via-yellow-300 to-oe-gold text-black shadow-[0_0_30px_rgba(218,165,32,0.6)] hover:shadow-[0_0_50px_rgba(218,165,32,1)] hover:scale-105 animate-pulse-subtle'
                        : 'bg-gradient-to-r from-white/5 via-oe-gold/10 to-white/5 border-2 border-oe-gold/30 text-white hover:border-oe-gold hover:from-oe-gold/20 hover:via-oe-gold/30 hover:to-oe-gold/20 hover:shadow-[0_0_30px_rgba(218,165,32,0.5)] hover:scale-105'
                      }`}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />

                    <span className="relative z-10 group-hover/btn:scale-110 transition-transform duration-300">{pack.ctaLabel}</span>
                    <ArrowRight className="relative z-10 w-5 h-5 group-hover/btn:translate-x-3 group-hover/btn:scale-125 transition-all duration-300" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const iconMap = {
  heart: Heart,
  building: Building2,
  sparkles: Sparkles,
};

