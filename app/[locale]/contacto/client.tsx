"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import ContactFormComplete from '@/app/components/forms/ContactFormComplete';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { SITE_CONFIG } from '@/app/config/site-config';

function ContactContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('contact');

  const preselectedService = searchParams?.get('servicio') || undefined;
  const preselectedDate = searchParams?.get('fecha') || undefined;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.08),transparent_50%)]" />
      <div className="absolute inset-0 oe-vignette pointer-events-none" aria-hidden="true" />

      <div className="relative">
        {/* Header */}
        <section className="px-4 pb-6 pt-14 sm:pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              suppressHydrationWarning
            >
              <h1 className="mb-3 text-3xl font-black text-white md:text-5xl lg:text-6xl tracking-tight">
                {t('page.titlePart1')}
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {t('page.titleHighlight')}
                </span>
              </h1>

              <p className="mx-auto mb-5 max-w-xl text-base leading-7 text-white/66 md:text-lg">
                {t('subtitle')}
              </p>

              {/* Trust — compact */}
              <div className="mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/52 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {t('page.trust.response')}
                </span>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><polygon points="10 1 13 7 20 8 15 12 16 19 10 16 4 19 5 12 0 8 7 7"/></svg>
                  {t('page.trust.rating')}
                </span>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  {t('page.trust.noCommitment')}
                </span>
              </div>

              {/* WhatsApp + Email — auxiliary */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <a
                  href={WHATSAPP_URL_WITH_MESSAGE(t('page.whatsappMessage'))}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/48 transition-all duration-300 hover:text-[var(--oe-whatsapp)] hover:drop-shadow-[0_0_8px_rgba(var(--oe-whatsapp-rgb),0.3)]"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.352 0-4.556-.725-6.379-1.963l-.447-.305-2.948.988.988-2.948-.305-.447A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  <span>{t('page.whatsappCta')}</span>
                </a>
                <span className="text-white/20">·</span>
                <a
                  href={`mailto:${SITE_CONFIG.business.email}`}
                  className="inline-flex items-center gap-2 text-sm text-white/48 transition-all duration-300 hover:text-amber-300 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                  aria-label={`Enviar email a ${SITE_CONFIG.business.email}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span>{SITE_CONFIG.business.email}</span>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 pb-10 sm:pb-16"
          suppressHydrationWarning
        >
          <div className="max-w-2xl mx-auto">
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 shadow-2xl backdrop-blur-sm md:p-8 hover:border-amber-500/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-500">
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

export default function ContactClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />}>
      <ContactContent />
    </Suspense>
  );
}
