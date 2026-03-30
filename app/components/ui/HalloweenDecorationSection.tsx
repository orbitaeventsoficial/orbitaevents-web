'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { PUBLIC_HALLOWEEN_DECORATION_ITEMS } from '@/lib/constants';

export default function HalloweenDecorationSection() {
  const t = useTranslations('halloweenPage.decoration');

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#070707_0%,#120907_28%,#1a0d09_56%,#090909_100%)] py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,83,9,0.18),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(120,53,15,0.14),transparent_48%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_16%,transparent_100%)]" />
        <div className="absolute left-[-5rem] top-10 h-48 w-48 rounded-full bg-orange-500/8 blur-3xl" />
        <div className="absolute right-[-5rem] bottom-10 h-56 w-56 rounded-full bg-red-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">
            {t('label')}
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            {t('title')} <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{t('titleHighlight')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/62">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="mb-14 grid gap-6 md:grid-cols-[1.18fr_0.82fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[28px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.98))] p-7 shadow-[0_26px_84px_rgba(0,0,0,0.28)] backdrop-blur-sm"
          >
            <p className="text-sm font-semibold text-orange-300">{t('passatge.title')}</p>
            <p className="mt-3 text-lg leading-8 text-white/74">
              {t('passatge.description')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="rounded-[28px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.98))] p-7 shadow-[0_24px_72px_rgba(0,0,0,0.22)] backdrop-blur-sm"
          >
            <p className="text-sm font-semibold text-orange-300">{t('inclou.title')}</p>
            <ul className="mt-4 space-y-3 text-sm text-white/66">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-400">✦</span>{t('inclou.item1')}</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-400">✦</span>{t('inclou.item2')}</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-400">✦</span>{t('inclou.item3')}</li>
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
              className="group relative min-h-[248px] overflow-hidden rounded-[26px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.98))] p-5 shadow-[0_20px_52px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/10 hover:shadow-[0_24px_56px_rgba(0,0,0,0.3)]"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_38%)]" />
              <div className="relative z-10">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl shadow-[0_10px_24px_rgba(249,115,22,0.14)]">
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
          className="mt-16 flex justify-center"
        >
          <div className="rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.98))] px-6 py-4 text-center shadow-[0_22px_58px_rgba(0,0,0,0.22)]">
            <p className="text-sm font-semibold text-white">{t('footer.title')}</p>
            <p className="mt-1 text-sm text-white/60">{t('footer.subtitle')}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}




