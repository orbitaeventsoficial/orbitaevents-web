'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { PUBLIC_HALLOWEEN_DECORATION_ITEMS } from '@/lib/constants';

export default function HalloweenDecorationSection() {
  const t = useTranslations('halloweenPage.decoration');

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#090909_0%,#130b09_50%,#090909_100%)] py-18 md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,83,9,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(120,53,15,0.1),transparent_50%)]" />
        <div className="absolute left-[-4rem] top-12 h-40 w-40 rounded-full bg-orange-500/6 blur-3xl" />
        <div className="absolute right-[-4rem] bottom-12 h-48 w-48 rounded-full bg-red-500/6 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">Escenografia</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            {t('title')} <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{t('titleHighlight')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/58">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="mb-10 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
          >
            <p className="text-sm font-semibold text-orange-300">Passatge encantat</p>
            <p className="mt-3 text-lg leading-8 text-white/74">
              No portem només objectes. Muntem una escena: punts d'impacte, racons foscos, textures, llum i volum perquè l'espai sembli habitat per la història que expliques.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="rounded-[28px] border border-orange-500/15 bg-gradient-to-br from-orange-500/8 via-white/[0.02] to-red-500/8 p-6"
          >
            <p className="text-sm font-semibold text-orange-300">Inclou</p>
            <ul className="mt-4 space-y-3 text-sm text-white/66">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-400">✦</span>Muntatge i desmuntatge</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-400">✦</span>Transport i col·locació</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-400">✦</span>Composició visual perquè llueixi també a fotos</li>
            </ul>
          </motion.div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PUBLIC_HALLOWEEN_DECORATION_ITEMS.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-black/24 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/35 hover:bg-white/[0.03]"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_38%)]" />
              <div className="relative z-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">
                  {t(`items.${item.key}.title`)}
                </h3>
                <p className="text-sm leading-6 text-white/56">
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
          className="mt-12 flex justify-center"
        >
          <div className="rounded-[24px] border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-red-500/10 px-6 py-4 text-center shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <p className="text-sm font-semibold text-white">Tot inclòs en el preu</p>
            <p className="mt-1 text-sm text-white/60">Muntatge, desmuntatge, transport i composició de l'escena</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
