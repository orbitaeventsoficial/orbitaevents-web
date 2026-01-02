"use client";

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import ContactFormComplete from '@/app/components/forms/ContactFormComplete';
import CalendarioUrgencia from '@/app/components/ui/CalendarioUrgencia';

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT CLIENT v2.0 - ESTIL ELEGANT
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Star: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
};

export default function ContactClient() {
  const searchParams = useSearchParams();
  const t = useTranslations('contact');

  const preselectedService = searchParams.get('servicio') || undefined;
  const preselectedDate = searchParams.get('fecha') || undefined;

  const trustItems = [
    {
      icon: <Icons.Clock />,
      text: t('page.trust.response'),
    },
    {
      icon: <Icons.Star />,
      text: t('page.trust.rating'),
    },
    {
      icon: <Icons.Shield />,
      text: t('page.trust.noCommitment'),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.08),transparent_50%)]" />

      <div className="relative">
        {/* Header */}
        <section className="pt-20 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6">
                <span>💬</span>
                {t('page.badge')}
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                {t('page.titlePart1')}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {t('page.titleHighlight')}
                </span>
              </h1>

              <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
                {t('subtitle')}
              </p>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
                {trustItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/60 text-sm">
                    <span className="text-amber-400">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* WhatsApp quick contact */}
              <a
                href={`https://wa.me/34699121023?text=${encodeURIComponent(t('page.whatsappMessage'))}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-[#25D366] hover:bg-[#20BD5A] rounded-full transition-all hover:shadow-[0_8px_30px_rgba(37,211,102,0.3)] text-white font-semibold text-sm"
              >
                <Icons.WhatsApp />
                <span>{t('page.whatsappCta')}</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </a>
            </motion.div>
          </div>
        </section>

        {/* Calendar */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 mb-12"
        >
          <div className="max-w-4xl mx-auto">
            <CalendarioUrgencia />
          </div>
        </motion.section>

        {/* Form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 pb-20"
        >
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
              <ContactFormComplete
                preselectedService={preselectedService}
                preselectedDate={preselectedDate}
              />
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
