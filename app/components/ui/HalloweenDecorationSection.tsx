'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PUBLIC_HALLOWEEN_DECORATION_ITEMS } from '@/lib/constants';
import {
  buildHalloweenCobwebGeometry,
  buildHalloweenFilamentLayer,
  type HalloweenFilamentItem,
} from '@/lib/constants/halloween-atmosphere';

function FilamentSvg({ anchor, directionBias, tension, forkBias, className }: { anchor: HalloweenFilamentItem['anchor']; directionBias: number; tension: number; forkBias: number; className?: string }) {
  const edgeAnchor = anchor === 'top' || anchor === 'bottom' || anchor === 'left' || anchor === 'right';
  const intensity = Math.abs(forkBias) + tension * 0.35;
  const coverage = edgeAnchor
    ? intensity > 1.25 ? 'three-quarter' : 'half'
    : intensity > 1.2 ? 'half' : 'quarter';
  const geometry = buildHalloweenCobwebGeometry(coverage);
  const baseTransform =
    anchor === 'top-left' ? 'none' :
    anchor === 'top-right' ? 'scaleX(-1)' :
    anchor === 'bottom-left' ? 'scaleY(-1)' :
    anchor === 'bottom-right' ? 'scale(-1,-1)' :
    anchor === 'top' ? 'none' :
    anchor === 'right' ? 'rotate(90deg)' :
    anchor === 'bottom' ? 'scaleY(-1)' :
    anchor === 'left' ? 'rotate(-90deg)' : 'none';
  const tilt = directionBias * (edgeAnchor ? 7 : 11);
  const scale = 0.9 + Math.min(0.22, Math.max(0, (tension - 0.7) * 0.22));
  const transformPrefix = baseTransform === 'none' ? '' : `${baseTransform} `;
  const transform = `${transformPrefix}rotate(${tilt}deg) scale(${scale})`.trim();

  return (
    <svg viewBox={geometry.viewBox} className={className} fill="none" style={{ transform, transformOrigin: 'center' }}>
      {geometry.radialLines.map((path, index) => (
        <path key={`r-${index}`} d={path} stroke="currentColor" strokeWidth={index % 2 === 0 ? '1.12' : '0.96'} strokeLinecap="round" opacity={edgeAnchor ? 0.8 : 0.88} />
      ))}
      {geometry.ringLines.map((path, index) => (
        <path key={`g-${index}`} d={path} stroke="currentColor" strokeWidth={index < 2 ? '0.98' : '0.84'} strokeLinecap="round" opacity={index < 2 ? 0.78 : 0.62} />
      ))}
    </svg>
  );
}
function getFilamentPlacement(filament: HalloweenFilamentItem) {
  const baseStyle = {
    width: filament.width,
    height: filament.height,
    opacity: filament.opacity,
  };

  if (filament.anchor === 'top-left') {
    return {
      style: {
        ...baseStyle,
        left: filament.insetX,
        top: filament.insetY,
      },
      motionStyle: { transformOrigin: '0% 0%' },
    };
  }

  if (filament.anchor === 'top') {
    return {
      style: {
        ...baseStyle,
        left: `calc(${filament.leftRatio * 100}% - ${filament.width / 2}px)`,
        top: filament.insetY,
      },
      motionStyle: { transformOrigin: '50% 0%' },
    };
  }

  if (filament.anchor === 'top-right') {
    return {
      style: {
        ...baseStyle,
        right: filament.insetX,
        top: filament.insetY,
      },
      motionStyle: { transformOrigin: '100% 0%' },
    };
  }

  if (filament.anchor === 'right') {
    return {
      style: {
        ...baseStyle,
        right: filament.insetX,
        top: `calc(${filament.topRatio * 100}% - ${filament.height / 2}px)`,
      },
      motionStyle: { transformOrigin: '100% 50%' },
    };
  }

  if (filament.anchor === 'bottom-right') {
    return {
      style: {
        ...baseStyle,
        right: filament.insetX,
        bottom: filament.insetY,
      },
      motionStyle: { transformOrigin: '100% 100%' },
    };
  }

  if (filament.anchor === 'bottom') {
    return {
      style: {
        ...baseStyle,
        left: `calc(${filament.leftRatio * 100}% - ${filament.width / 2}px)`,
        bottom: filament.insetY,
      },
      motionStyle: { transformOrigin: '50% 100%' },
    };
  }

  if (filament.anchor === 'bottom-left') {
    return {
      style: {
        ...baseStyle,
        left: filament.insetX,
        bottom: filament.insetY,
      },
      motionStyle: { transformOrigin: '0% 100%' },
    };
  }

  if (filament.anchor === 'left') {
    return {
      style: {
        ...baseStyle,
        left: filament.insetX,
        top: `calc(${filament.topRatio * 100}% - ${filament.height / 2}px)`,
      },
      motionStyle: { transformOrigin: '0% 50%' },
    };
  }

  return {
    style: {
      ...baseStyle,
      left: `${filament.leftRatio * 100}%`,
      top: `${filament.topRatio * 100}%`,
    },
    motionStyle: { transformOrigin: '0% 0%', transform: `${filament.mirror ? 'scaleX(-1) ' : ''}rotate(${filament.rotateDeg}deg)` },
  };
}
export default function HalloweenDecorationSection() {
  const t = useTranslations('halloweenPage.decoration');
  const [mounted, setMounted] = useState(false);
  const [filaments, setFilaments] = useState<HalloweenFilamentItem[][]>([]);

  useEffect(() => {
    setMounted(true);

    const updateFilaments = () => {
      const viewportWidth = window.innerWidth || 1440;
      setFilaments(
        PUBLIC_HALLOWEEN_DECORATION_ITEMS.map((_, index) =>
          buildHalloweenFilamentLayer(200 + index * 17, viewportWidth, viewportWidth < 768 ? [1, 2] : [2, 3], 'container')
        )
      );
    };

    updateFilaments();
    window.addEventListener('resize', updateFilaments);
    return () => window.removeEventListener('resize', updateFilaments);
  }, []);

  return (
    <section className="relative -mt-2 overflow-hidden bg-[linear-gradient(180deg,#070710_0%,#10081c_28%,#140a22_56%,#0a0a13_100%)] pb-24 pt-8 md:-mt-4 md:pb-28 md:pt-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.12),transparent_48%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(168,130,255,0.06),transparent_16%,transparent_100%)]" />
        <div className="absolute left-[-5rem] top-10 h-48 w-48 rounded-full bg-purple-500/8 blur-3xl" />
        <div className="absolute bottom-10 right-[-5rem] h-56 w-56 rounded-full bg-indigo-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-10 max-w-3xl text-center md:mb-12"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-purple-300/80">
            {t('label')}
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            {t('title')} <span className="bg-gradient-to-r from-purple-400 to-violet-500 bg-clip-text text-transparent">{t('titleHighlight')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/68">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="mb-10 grid gap-6 md:mb-12 md:grid-cols-[1.18fr_0.82fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[28px] border border-purple-300/14 bg-[linear-gradient(180deg,rgba(17,12,29,0.96),rgba(10,10,18,0.985))] p-7 shadow-[0_28px_88px_rgba(0,0,0,0.26)] backdrop-blur-sm"
          >
            <p className="text-sm font-semibold text-purple-200/92">{t('passatge.title')}</p>
            <p className="mt-3 text-lg leading-8 text-white/80">
              {t('passatge.description')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="rounded-[28px] border border-purple-300/14 bg-[linear-gradient(180deg,rgba(17,12,29,0.96),rgba(10,10,18,0.985))] p-7 shadow-[0_26px_76px_rgba(0,0,0,0.22)] backdrop-blur-sm"
          >
            <p className="text-sm font-semibold text-purple-200/92">{t('inclou.title')}</p>
            <ul className="mt-4 space-y-3 text-sm text-white/72">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-violet-400">✦</span>{t('inclou.item1')}</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-violet-400">✦</span>{t('inclou.item2')}</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-violet-400">✦</span>{t('inclou.item3')}</li>
            </ul>
          </motion.div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PUBLIC_HALLOWEEN_DECORATION_ITEMS.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="group relative min-h-[248px] overflow-hidden rounded-[26px] border border-purple-300/18 bg-[linear-gradient(180deg,rgba(17,12,29,0.96),rgba(10,10,18,0.985))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:border-purple-300/28 hover:shadow-[0_28px_68px_rgba(88,28,135,0.22)]"
            >
              <div className="pointer-events-none absolute inset-0 rounded-[26px] border border-purple-300/10 opacity-70 transition-all duration-500 group-hover:border-purple-200/20" />
              <div className="pointer-events-none absolute inset-[7px] rounded-[22px] border border-purple-500/8 opacity-80 transition-all duration-500 group-hover:border-purple-300/18" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[25px] bg-[linear-gradient(180deg,rgba(168,130,255,0.06),rgba(120,78,196,0.035)_12%,transparent_28%,transparent_72%,rgba(120,78,196,0.03)_88%,rgba(168,130,255,0.055))] opacity-90" /><div className="pointer-events-none absolute inset-[2px] rounded-[24px] bg-[radial-gradient(ellipse_at_top,rgba(196,181,253,0.11),transparent_46%),radial-gradient(ellipse_at_bottom,rgba(91,33,182,0.12),transparent_56%)] opacity-90" /><div className="pointer-events-none absolute inset-[3px] rounded-[23px] bg-[radial-gradient(ellipse_at_left,rgba(99,102,241,0.12),transparent_52%),radial-gradient(ellipse_at_right,rgba(168,130,255,0.14),transparent_56%)] blur-[14px] opacity-95" /><div className="pointer-events-none absolute inset-x-[10px] top-[7px] h-7 rounded-full bg-white/[0.18] blur-[20px] opacity-100" /><div className="pointer-events-none absolute inset-x-[12px] bottom-[8px] h-8 rounded-full bg-purple-300/[0.22] blur-[26px] opacity-100" /><div className="pointer-events-none absolute inset-[4px] rounded-[23px] shadow-[inset_0_1px_0_rgba(236,233,254,0.08),inset_0_-1px_0_rgba(91,33,182,0.12)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_38%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="pointer-events-none absolute -left-8 bottom-2 h-20 w-28 rounded-full bg-purple-200/[0.06] blur-2xl opacity-60 transition-all duration-500 group-hover:left-0 group-hover:opacity-100" />
              <div className="pointer-events-none absolute right-0 top-10 h-16 w-24 rounded-full bg-indigo-200/[0.05] blur-2xl opacity-40 transition-all duration-500 group-hover:translate-x-[-6px] group-hover:opacity-80" />
              {mounted ? (
                <div className="pointer-events-none absolute inset-[7px] z-[2] rounded-[22px] overflow-visible">
                  {(filaments[index] ?? []).map((filament) => {
                    const placement = getFilamentPlacement(filament);
                    const restAngle = 0;
                    const breezeAngle = filament.swayX * 0.025;
                    const gustAngle = filament.swayX * 0.06;
                    const settleAngle = filament.swayX * 0.015;
                    return (
                      <div
                        key={filament.id}
                        className="pointer-events-none absolute"
                        style={placement.style}
                      >
                        <motion.div
                          style={placement.motionStyle}
                          animate={{ rotate: [restAngle, breezeAngle, gustAngle, settleAngle, restAngle], x: [0, filament.swayX * 0.04, filament.swayX * 0.092, filament.swayX * 0.03, 0], y: [0, Math.abs(filament.swayY) * 0.02, Math.abs(filament.swayY) * 0.05, Math.abs(filament.swayY) * 0.03, 0] }}
                          transition={{ duration: 6.6 + Math.abs(filament.swayX) * 0.08, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <motion.div
                            style={placement.motionStyle}
                            animate={{ x: [0, filament.swayX * 0.038, filament.swayX * 0.088, filament.swayX * 0.028, 0], y: [0, Math.abs(filament.swayY) * 0.08, Math.abs(filament.swayY) * 0.14, Math.abs(filament.swayY) * 0.09, 0], scaleY: [1.01, 1.03, 1.06, 1.025, 1.01], skewX: [0, filament.swayX * 0.04, filament.swayX * 0.074, filament.swayX * 0.03, 0], scaleX: [1, 0.994, 1.024, 1.006, 1] }}
                            transition={{ duration: 6.6 + Math.abs(filament.swayX) * 0.08, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <FilamentSvg anchor={filament.anchor} directionBias={filament.directionBias} tension={filament.tension} forkBias={filament.forkBias} className="h-full w-full text-violet-50 drop-shadow-[0_0_22px_rgba(233,213,255,0.58)]" />
                          </motion.div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <div className="relative z-10">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/24 bg-purple-400/12 text-2xl shadow-[0_12px_28px_rgba(139,92,246,0.16)] transition-all duration-500 group-hover:scale-110 group-hover:border-purple-200/36 group-hover:bg-purple-300/16 group-hover:shadow-[0_0_32px_rgba(139,92,246,0.28)]">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-white transition-colors duration-300 group-hover:text-white">
                  {t(`items.${item.key}.title`)}
                </h3>
                <p className="text-sm leading-6 text-white/72 transition-colors duration-300 group-hover:text-white/80">
                  {t(`items.${item.key}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 flex justify-center md:mt-12"
        >
          <div className="rounded-[24px] border border-purple-300/18 bg-[linear-gradient(180deg,rgba(19,13,32,0.97),rgba(10,10,18,0.99))] px-6 py-4 text-center shadow-[0_26px_70px_rgba(0,0,0,0.24)]">
            <p className="text-sm font-semibold text-white/96">{t('footer.title')}</p>
            <p className="mt-1 text-sm text-white/68">{t('footer.subtitle')}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}




















