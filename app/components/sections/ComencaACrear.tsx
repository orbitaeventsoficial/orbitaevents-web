// app/components/sections/ComencaACrear.tsx
// ÒRBITA EVENTS - Mini-configurador visual
// "Quin event tens al cap?" amb opcions que porten al configurador

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Opcio {
  id: string;
  icon: string;
  labelKey: string;
  href: string;
  colorClass: string;
}

const OPCIONS: Opcio[] = [
  {
    id: 'boda',
    icon: '💒',
    labelKey: 'wedding',
    href: '/configurador?service=bodas',
    colorClass: 'hover:border-rose-500/50 hover:bg-rose-500/10',
  },
  {
    id: 'festa',
    icon: '🎉',
    labelKey: 'party',
    href: '/configurador?service=fiestas',
    colorClass: 'hover:border-amber-500/50 hover:bg-amber-500/10',
  },
  {
    id: 'empresa',
    icon: '🏢',
    labelKey: 'corporate',
    href: '/configurador?service=empresas',
    colorClass: 'hover:border-blue-500/50 hover:bg-blue-500/10',
  },
  {
    id: 'altre',
    icon: '✨',
    labelKey: 'other',
    href: '/configurador',
    colorClass: 'hover:border-purple-500/50 hover:bg-purple-500/10',
  },
];

export default function ComencaACrear() {
  const t = useTranslations('startCreating');
  const _tCommon = useTranslations('common');

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-[#0a0a0b] to-[#0f0f12] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Títol */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-lg sm:text-xl text-white/60 mb-12">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Opcions visuals */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {OPCIONS.map((opcio, index) => (
            <motion.div
              key={opcio.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href={opcio.href}>
                <motion.div
                  className={`group p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 cursor-pointer ${opcio.colorClass}`}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Icon amb animació */}
                  <motion.span
                    className="text-5xl sm:text-6xl mb-4 block"
                    whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    {opcio.icon}
                  </motion.span>

                  {/* Label */}
                  <span className="text-xl sm:text-2xl font-semibold text-white group-hover:text-amber-400 transition-colors">
                    {t(`options.${opcio.labelKey}`)}
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA alternatiu */}
        <motion.p
          className="text-white/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {t('orPrefer')}{' '}
          <Link
            href="/contacto"
            className="text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
          >
            {t('talkDirectly')}
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
