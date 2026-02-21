'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════
// IMATGES - Fotos reals del casament
// ═══════════════════════════════════════════════════════════════

const IMATGES = {
  hero: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.avif',
  heroAlt: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-02.avif',
  sostre: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-03.avif',
  sobreComplet: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-04.avif',
  sobrePlat: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.avif',
  sobreDetall: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-06.avif',
  provaSocial: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-07.avif',
  sobrePergami: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-08.avif',
  mussol: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-09.avif',
  pergaminsBilingue: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-10.avif',
  pergaminsCintes: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-11.avif',
  veles: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-12.avif',
  botigueta: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-13.avif',
  escombres: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-03.avif',
};

// ═══════════════════════════════════════════════════════════════
// CASES DE L'ESCOLA DE MÀGIA - Només dades estàtiques (colors, gradients)
// Textos via t('monMagic.houses.{id}.nom') i t('monMagic.houses.{id}.descripcio')
// ═══════════════════════════════════════════════════════════════

const CASES_MAGIA_DATA = [
  { id: 'escola', color: '#1A1A1A', colorLacre: '#D4AF37', gradient: 'from-amber-600 to-amber-800', animal: '🏰' },
  { id: 'lleons', color: '#740001', colorLacre: '#740001', gradient: 'from-red-700 to-red-900', animal: '🦁' },
  { id: 'serps', color: '#1A472A', colorLacre: '#1A472A', gradient: 'from-green-700 to-green-900', animal: '🐍' },
  { id: 'teixons', color: '#FFD700', colorLacre: '#1A1A1A', gradient: 'from-yellow-500 to-amber-600', animal: '🦡' },
  { id: 'aguiles', color: '#0E1A40', colorLacre: '#0E1A40', gradient: 'from-blue-800 to-blue-950', animal: '🦅' },
];

// ═══════════════════════════════════════════════════════════════
// PRODUCTES - Només dades estàtiques (preus, emojis)
// Textos via t('monMagic.productes.{key}.*')
// ═══════════════════════════════════════════════════════════════

const PRODUCTES_DATA = [
  { id: 'sobre-complet', key: 'sobreComplet', emoji: '✉️', preuUnitat: 10, preuPack: 8, packMinim: 50, destacat: true, numCaracteristiques: 6 },
  { id: 'pergami-amor', key: 'pergamiAmor', emoji: '📜', preuUnitat: 4, preuPack: 3, packMinim: 30, numCaracteristiques: 6 },
  { id: 'cartell-decoratiu', key: 'cartellDecoratiu', emoji: '🪧', preuUnitat: 15, preuPack: 12, packMinim: 5, numCaracteristiques: 6 },
];

// ═══════════════════════════════════════════════════════════════
// PACKS AMB DESCOMPTE - Només dades estàtiques (preus, emojis)
// Textos via t('monMagic.packs.{key}.*')
// ═══════════════════════════════════════════════════════════════

const PACKS_DATA = [
  { id: 'pack-basic', key: 'basic', emoji: '📨', preuPack50: 450, preuPack80: 680, preuPack100: 800, estalviPercent: 10, numCaracteristiques: 5 },
  { id: 'pack-premium', key: 'premium', emoji: '🏆', preuPack50: 650, preuPack80: 950, preuPack100: 1100, estalviPercent: 15, destacat: true, numCaracteristiques: 6 },
];

// ═══════════════════════════════════════════════════════════════
// EXTRA: MULTI-SEGELL - Només preus (textos via t('monMagic.multiSegell.*'))
// ═══════════════════════════════════════════════════════════════

const EXTRA_MULTISEGELL = {
  preuExtra50: 75,
  preuExtra80: 100,
  preuExtra100: 120,
};

// ═══════════════════════════════════════════════════════════════
// FAQS - Només keys, textos via t('monMagic.faqs.q{n}.*')
// ═══════════════════════════════════════════════════════════════

const FAQS_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];

// ═══════════════════════════════════════════════════════════════
// COMPONENT: Client-only Stars (to avoid hydration mismatch)
// ═══════════════════════════════════════════════════════════════

function ClientOnlyStars() {
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<Array<{ left: number; top: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    setMounted(true);
    // Generate stars only on client
    const shouldReduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const starsCount = shouldReduce ? 10 : 22;
    const newStars = Array.from({ length: starsCount }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 2,
    }));
    setStars(newStars);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT: Veles Flotants (Gran Saló)
// ═══════════════════════════════════════════════════════════════

// Pre-computed candle data to avoid hydration mismatch
const CANDLE_DATA = [
  { id: 0, left: '5%', delay: 2.3, duration: 5.1, size: 22 },
  { id: 1, left: '11%', delay: 0.8, duration: 4.3, size: 26 },
  { id: 2, left: '17%', delay: 4.1, duration: 5.8, size: 19 },
  { id: 3, left: '23%', delay: 1.5, duration: 4.7, size: 28 },
  { id: 4, left: '29%', delay: 3.2, duration: 5.4, size: 21 },
  { id: 5, left: '35%', delay: 0.3, duration: 4.1, size: 25 },
  { id: 6, left: '41%', delay: 2.9, duration: 5.6, size: 23 },
  { id: 7, left: '47%', delay: 1.1, duration: 4.5, size: 27 },
  { id: 8, left: '53%', delay: 4.5, duration: 5.2, size: 20 },
  { id: 9, left: '59%', delay: 0.6, duration: 4.9, size: 24 },
  { id: 10, left: '65%', delay: 3.7, duration: 5.0, size: 29 },
  { id: 11, left: '71%', delay: 1.8, duration: 4.2, size: 22 },
  { id: 12, left: '77%', delay: 2.5, duration: 5.5, size: 26 },
  { id: 13, left: '83%', delay: 0.9, duration: 4.8, size: 21 },
  { id: 14, left: '89%', delay: 3.4, duration: 5.3, size: 25 },
];

function FloatingCandles() {
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return null;

  const candles = CANDLE_DATA;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {candles.map((candle) => (
        <motion.div
          key={candle.id}
          className="absolute"
          style={{ left: candle.left, top: '-50px' }}
          animate={{
            y: ['0%', '130vh'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: candle.duration * 3,
            delay: candle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <div
              className="rounded-full bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-200"
              style={{
                width: candle.size * 0.4,
                height: candle.size * 0.6,
                filter: 'blur(1px)',
                boxShadow: '0 0 25px rgba(255,200,100,0.9)',
              }}
            />
          </motion.div>
          <div
            className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-sm mx-auto"
            style={{
              width: candle.size * 0.2,
              height: candle.size,
              marginTop: -2,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function ProductesMonMagic() {
  const t = useTranslations('monMagic');
  const locale = useLocale();

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [quantitat, setQuantitat] = useState<50 | 80 | 100>(80);
  const [casaSeleccionada, setCasaSeleccionada] = useState('escola');
  const [multiSegell, setMultiSegell] = useState(false);

  const casaActual = CASES_MAGIA_DATA.find(c => c.id === casaSeleccionada) || CASES_MAGIA_DATA[0];

  // Calcular preu extra multi-segell
  const preuMultiSegell = quantitat === 50 ? EXTRA_MULTISEGELL.preuExtra50
    : quantitat === 80 ? EXTRA_MULTISEGELL.preuExtra80
    : EXTRA_MULTISEGELL.preuExtra100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#0f0f1a] to-black">

      {/* ═══ HERO ═══ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <FloatingCandles />

        {/* Stars rendered client-side only to avoid hydration mismatch */}
        <ClientOnlyStars />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-6"
            >
              <span className="animate-pulse">⚡</span>
              <span className="text-amber-300 font-medium">
                {t('badge')}
              </span>
              <span className="animate-pulse">⚡</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              {t('heroTitle')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                {t('heroTitleHighlight')}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-4 max-w-3xl mx-auto">
              {t('heroSubtitle')}
            </p>

            <p className="text-lg text-amber-400/80 mb-8">
              {t('heroPrice')}
            </p>

            <div className="flex justify-center gap-8 md:gap-12 flex-wrap mb-10">
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-400">10€</div>
                <div className="text-white/50 text-sm">{t('priceUnit')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-400">8€</div>
                <div className="text-white/50 text-sm">{t('pricePackLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-400">5</div>
                <div className="text-white/50 text-sm">{t('housesLabel')}</div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="#calculadora"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-lg rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                {t('calculateBudget')} 🧮
              </Link>
              <Link
                href="#casas"
                className="px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-full hover:bg-white/20 transition-all border border-white/20"
              >
                {t('seeHouses')} 🏰
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ GALERIA FOTOS REALS ═══ */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            📸 {t('realPhotos')}
          </h2>
          <p className="text-white/60 text-center mb-10 max-w-2xl mx-auto">
            {t('realPhotosDesc')}
          </p>

          {/* Grid de fotos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {/* Foto destacada gran */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden group"
            >
              <Image
                src={IMATGES.sobreComplet}
                alt={t('altSobreObert')}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                quality={70}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                  ⭐ {t('mostSold')}
                </span>
                <p className="text-white font-medium mt-2">
                  {t('completeLetter')}
                </p>
              </div>
            </motion.div>

            {/* Foto producte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden aspect-square group"
            >
              <Image
                src={IMATGES.sobrePlat}
                alt={t('altSobrePlat')}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                quality={70}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>

            {/* Foto prova social */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden aspect-square group"
            >
              <Image
                src={IMATGES.provaSocial}
                alt={t('altConvidada')}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                quality={70}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <span className="text-white/90 text-xs">
                  {t('realReaction')}
                </span>
              </div>
            </motion.div>

            {/* Foto mussol */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative rounded-2xl overflow-hidden aspect-square group"
            >
              <Image
                src={IMATGES.mussol}
                alt={t('altMussol')}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                quality={70}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>

            {/* Foto decoració escombres */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative rounded-2xl overflow-hidden aspect-square group"
            >
              <Image
                src={IMATGES.escombres}
                alt={t('altEscombres')}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                quality={70}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          </div>

          {/* Badge de fotos reals */}
          <div className="text-center mt-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/70 text-sm">
              📷 {t('allPhotosReal')}
            </span>
          </div>
        </div>
      </section>

      {/* ═══ SECCIÓ CASES ═══ */}
      <section id="casas" className="py-16 border-t border-amber-500/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('chooseCasa')}
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              {t('chooseCasaDesc')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto mb-8">
            {CASES_MAGIA_DATA.map((casa, index) => (
              <motion.button
                key={casa.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setCasaSeleccionada(casa.id)}
                className={`relative p-4 rounded-xl transition-all duration-300 ${
                  casaSeleccionada === casa.id
                    ? `bg-gradient-to-b ${casa.gradient} ring-2 ring-amber-400 shadow-lg`
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-4xl mb-2">{casa.animal}</div>
                <div className="text-white font-bold">{t(`houses.${casa.id}.nom`)}</div>
                <div className="text-white/50 text-xs mt-1">
                  {t(`houses.${casa.id}.descripcio`)}
                </div>
                {casaSeleccionada === casa.id && (
                  <motion.div
                    layoutId="casa-selected"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-black text-sm font-bold"
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          <motion.div
            key={casaSeleccionada}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-white/5 rounded-2xl p-6 text-center"
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{
                backgroundColor: casaActual.colorLacre,
                boxShadow: `0 0 30px ${casaActual.colorLacre}50`
              }}
            >
              {casaActual.animal}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {t('lacreTitle')} {t(`houses.${casaActual.id}.nom`)}
            </h3>
            <p className="text-white/60 text-sm">
              {t(`houses.${casaActual.id}.descripcio`)}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ PRODUCTES INDIVIDUALS ═══ */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            {t('products')}
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            {t('productsDesc')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRODUCTES_DATA.map((producte, index) => (
              <motion.div
                key={producte.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl overflow-hidden ${
                  producte.destacat
                    ? 'bg-gradient-to-b from-amber-900/40 to-amber-950/40 ring-2 ring-amber-500/50'
                    : 'bg-white/5 hover:bg-white/10'
                } transition-all duration-300`}
              >
                {producte.destacat && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-center py-2 text-sm font-bold">
                    ⭐ {t('mostSold')}
                  </div>
                )}

                <div className={`p-6 ${producte.destacat ? 'pt-14' : ''}`}>
                  <div className="text-5xl mb-4 text-center">{producte.emoji}</div>

                  <h3 className="text-xl font-bold text-white mb-2 text-center">
                    {t(`productes.${producte.key}.nom`)}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 text-center line-clamp-3">
                    {t(`productes.${producte.key}.descripcio`)}
                  </p>

                  <ul className="space-y-1.5 mb-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">✓</span>
                        <span>{t(`productes.${producte.key}.caracteristiques.${i}`)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-black/20 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-white/50 text-xs block">{t('perUnit')}</span>
                        <span className="text-2xl font-bold text-white">{producte.preuUnitat}€</span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 text-xs block">Pack +{producte.packMinim}</span>
                        <span className="text-xl font-bold text-amber-400">{producte.preuPack}€</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/contacto?producte=${producte.id}&casa=${casaSeleccionada}`}
                    className={`block w-full py-3 rounded-xl text-center font-bold transition-all ${
                      producte.destacat
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {t('askBudget')}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PACKS ═══ */}
      <section className="py-16 border-t border-white/10 bg-gradient-to-b from-amber-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            {t('packsDiscount')}
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            {t('packsDiscountDesc')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PACKS_DATA.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`rounded-2xl overflow-hidden ${
                  pack.destacat
                    ? 'bg-gradient-to-b from-amber-900/50 to-amber-950/50 ring-2 ring-amber-500'
                    : 'bg-white/5'
                }`}
              >
                {pack.destacat && (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-center py-2 font-bold">
                    🏆 {t('recommended')} - {pack.estalviPercent}% {t('saving')}
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{pack.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {t(`packs.${pack.key}.nom`)}
                      </h3>
                      {!pack.destacat && (
                        <span className="text-amber-400 text-sm">{pack.estalviPercent}% {t('saving')}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-white/60 text-sm mb-6">
                    {t(`packs.${pack.key}.descripcio`)}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {Array.from({ length: pack.numCaracteristiques }).map((_, i) => (
                      <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                        <span className="text-amber-400">✓</span>
                        <span>{t(`packs.${pack.key}.caracteristiques.${i}`)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Taula de preus */}
                  <div className="bg-black/30 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={`p-2 rounded-lg ${quantitat === 50 ? 'bg-amber-500/30 ring-1 ring-amber-500' : ''}`}>
                        <div className="text-white/50 text-xs">50 {t('guests')}</div>
                        <div className="text-lg font-bold text-white">{pack.preuPack50}€</div>
                      </div>
                      <div className={`p-2 rounded-lg ${quantitat === 80 ? 'bg-amber-500/30 ring-1 ring-amber-500' : ''}`}>
                        <div className="text-white/50 text-xs">80 {t('guests')}</div>
                        <div className="text-lg font-bold text-white">{pack.preuPack80}€</div>
                      </div>
                      <div className={`p-2 rounded-lg ${quantitat === 100 ? 'bg-amber-500/30 ring-1 ring-amber-500' : ''}`}>
                        <div className="text-white/50 text-xs">100 {t('guests')}</div>
                        <div className="text-lg font-bold text-white">{pack.preuPack100}€</div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/contacto?pack=${pack.id}&quantitat=${quantitat}&casa=${casaSeleccionada}${multiSegell ? '&multisegell=true' : ''}`}
                    className={`block w-full py-3 rounded-xl text-center font-bold transition-all ${
                      pack.destacat
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/30'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {t('requestPack')}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CALCULADORA ═══ */}
      <section id="calculadora" className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white/5 rounded-2xl p-8 border border-amber-500/20">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              🧮 {t('calculator')}
            </h2>
            <p className="text-center text-white/50 mb-6">
              {t('calculatorDesc')}
            </p>

            {/* Selector quantitat */}
            <div className="flex justify-center gap-4 mb-8">
              {[50, 80, 100].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantitat(q as 50 | 80 | 100)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    quantitat === q
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {q} {t('guests')}
                </button>
              ))}
            </div>

            {/* Opció Multi-Segell */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer bg-white/5 p-4 rounded-xl border border-purple-500/30">
                <input
                  type="checkbox"
                  checked={multiSegell}
                  onChange={(e) => setMultiSegell(e.target.checked)}
                  className="w-5 h-5 accent-purple-500"
                />
                <div className="flex-1">
                  <span className="text-white font-medium">
                    🎨 {t('multiSegell.nom')}
                  </span>
                  <span className="text-purple-400 ml-2">(+{preuMultiSegell}€)</span>
                  <p className="text-white/50 text-sm mt-1">
                    {t('multiSegell.descripcio')}
                  </p>
                </div>
              </label>
            </div>

            {/* Resultats */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-white/70">📨 {t('packBasic')}</span>
                <span className="text-white font-bold">
                  {(quantitat === 50 ? 450 : quantitat === 80 ? 680 : 800) + (multiSegell ? preuMultiSegell : 0)}€
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-900/30 rounded-lg ring-1 ring-amber-500/50">
                <span className="text-white">🏆 {t('packPremium')}</span>
                <span className="text-amber-400 font-bold text-xl">
                  {(quantitat === 50 ? 650 : quantitat === 80 ? 950 : 1100) + (multiSegell ? preuMultiSegell : 0)}€
                </span>
              </div>
            </div>

            <Link
              href={`/contacto?pack=premium&quantitat=${quantitat}&casa=${casaSeleccionada}${multiSegell ? '&multisegell=true' : ''}`}
              className="block w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl text-center text-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              {t('requestBudgetFor', { count: quantitat })}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            {t('faq')}
          </h2>

          <div className="max-w-2xl mx-auto space-y-3">
            {FAQS_KEYS.map((faqKey, index) => (
              <motion.div
                key={index}
                className="bg-white/5 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                >
                  <span className="text-white font-medium">
                    {t(`faqs.${faqKey}.pregunta`)}
                  </span>
                  <span className="text-amber-400 text-xl">
                    {faqOpen === index ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence>
                  {faqOpen === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-4"
                    >
                      <p className="text-white/70">
                        {t(`faqs.${faqKey}.${locale === 'ca' ? 'resposta' : 'respuesta'}`)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            🪄 {t('wantCompletePack')}
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            {t('wantCompletePackDesc')}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/configurador?tema=monmagic"
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all"
            >
              {t('configureComplete')} ⚡
            </Link>
            <Link
              href="/contacto"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all"
            >
              {t('talkToUs')}
            </Link>
          </div>
        </div>
      </section>

      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Pack Boda Món Màgic amb Lacre Artesanal",
            "description": "Sobres complets per a casaments temàtics de màgia amb carta de la Directora, text personalitzat i lacre de cera artesanal.",
            "brand": { "@type": "Brand", "name": "Òrbita Events" },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "450",
              "highPrice": "1100",
              "priceCurrency": "EUR",
              "offerCount": "4"
            }
          })
        }}
      />
    </div>
  );
}
