"use client";

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Package,
  Sparkles,
  Check,
  Loader2,
  ChevronDown,
  Music,
  Heart,
  Building2,
  Wrench,
} from 'lucide-react';
import { generateServiceBrochure, downloadImages } from '@/lib/pdf-utils';
import { PORTFOLIO_CATEGORIES, PORTFOLIO_IMAGES } from '@/app/config/portfolio-images';
import type { ServiceSlug } from '@/app/config/packs-config';

type DownloadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ServiceBrochure {
  id: ServiceSlug;
  icon: React.ReactNode;
  color: string;
}

const SERVICE_BROCHURES: ServiceBrochure[] = [
  { id: 'bodas', icon: <Heart className="w-6 h-6" />, color: 'from-pink-500 to-rose-500' },
  { id: 'fiestas', icon: <Sparkles className="w-6 h-6" />, color: 'from-purple-500 to-fuchsia-500' },
  { id: 'discomovil', icon: <Music className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500' },
  { id: 'empresas', icon: <Building2 className="w-6 h-6" />, color: 'from-emerald-500 to-teal-500' },
  { id: 'produccion', icon: <Wrench className="w-6 h-6" />, color: 'from-orange-500 to-amber-500' },
];

export default function RecursosClient() {
  const t = useTranslations('resources');
  const locale = useLocale() as 'ca' | 'es' | 'en';

  const [brochureStatus, setBrochureStatus] = useState<Record<string, DownloadStatus>>({});
  const [portfolioStatus, setPortfolioStatus] = useState<Record<string, DownloadStatus>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Download service brochure PDF
  const handleDownloadBrochure = async (service: ServiceSlug) => {
    setBrochureStatus((prev) => ({ ...prev, [service]: 'loading' }));

    try {
      const doc = generateServiceBrochure(service, locale);
      doc.save(`orbita-events-${service}-${locale}.pdf`);
      setBrochureStatus((prev) => ({ ...prev, [service]: 'success' }));

      // Reset status after 3 seconds
      setTimeout(() => {
        setBrochureStatus((prev) => ({ ...prev, [service]: 'idle' }));
      }, 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setBrochureStatus((prev) => ({ ...prev, [service]: 'error' }));
    }
  };

  // Download portfolio images
  const handleDownloadPortfolio = async (categorySlug: string) => {
    setPortfolioStatus((prev) => ({ ...prev, [categorySlug]: 'loading' }));

    try {
      const images = PORTFOLIO_IMAGES[categorySlug as keyof typeof PORTFOLIO_IMAGES] || [];
      await downloadImages(images, `orbita-${categorySlug}`);
      setPortfolioStatus((prev) => ({ ...prev, [categorySlug]: 'success' }));

      setTimeout(() => {
        setPortfolioStatus((prev) => ({ ...prev, [categorySlug]: 'idle' }));
      }, 3000);
    } catch (error) {
      console.error('Error downloading images:', error);
      setPortfolioStatus((prev) => ({ ...prev, [categorySlug]: 'error' }));
    }
  };

  const getServiceName = (service: ServiceSlug): string => {
    const names: Record<ServiceSlug, Record<string, string>> = {
      bodas: { ca: 'Casaments', es: 'Bodas', en: 'Weddings' },
      fiestas: { ca: 'Festes', es: 'Fiestas', en: 'Parties' },
      discomovil: { ca: 'Discomòbil', es: 'Discomóvil', en: 'Mobile DJ' },
      empresas: { ca: 'Empreses', es: 'Empresas', en: 'Corporate' },
      produccion: { ca: 'Producció', es: 'Producción', en: 'Production' },
      alquiler: { ca: 'Lloguer', es: 'Alquiler', en: 'Rental' },
    };
    return names[service]?.[locale] || service;
  };

  const renderDownloadButton = (
    status: DownloadStatus,
    onClick: () => void,
    label: string
  ) => {
    return (
      <button
        onClick={onClick}
        disabled={status === 'loading'}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all
          ${status === 'success'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : status === 'loading'
            ? 'bg-white/5 text-white/50 cursor-wait'
            : 'bg-white/10 text-white hover:bg-oe-gold hover:text-black border border-white/10 hover:border-oe-gold'
          }
        `}
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'success' ? (
          <Check className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {status === 'success' ? t('downloaded') : label}
      </button>
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 lg:py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-black bg-gradient-to-r from-oe-gold to-oe-gold-bright bg-clip-text text-transparent mb-4"
        >
          {t('title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto"
        >
          {t('subtitle')}
        </motion.p>
      </div>

      {/* Service Brochures Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-16"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-oe-gold/20">
            <FileText className="w-6 h-6 text-oe-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{t('brochures.title')}</h2>
            <p className="text-white/60 text-sm">{t('brochures.subtitle')}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICE_BROCHURES.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="group p-6 rounded-2xl bg-bg-surface border border-white/10 hover:border-oe-gold/50 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white mb-4`}>
                {service.icon}
              </div>

              <h3 className="text-lg font-bold text-white mb-2">
                {getServiceName(service.id)}
              </h3>
              <p className="text-white/60 text-sm mb-4">
                {t('brochures.description')}
              </p>

              {renderDownloadButton(
                brochureStatus[service.id] || 'idle',
                () => handleDownloadBrochure(service.id),
                t('brochures.download')
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Portfolio Images Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-16"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-fuchsia-500/20">
            <ImageIcon className="w-6 h-6 text-fuchsia-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{t('portfolio.title')}</h2>
            <p className="text-white/60 text-sm">{t('portfolio.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {PORTFOLIO_CATEGORIES.map((category, index) => {
            const images = PORTFOLIO_IMAGES[category.slug as keyof typeof PORTFOLIO_IMAGES] || [];
            const isExpanded = expandedCategory === category.slug;

            return (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.03 }}
                className="rounded-xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.slug)}
                  className="w-full p-4 flex items-center justify-between bg-bg-surface hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                      <NextImage
                        src={category.cover}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-white">{category.name}</h3>
                      <p className="text-white/50 text-sm">{images.length} {t('portfolio.images')}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="p-4 bg-black/20 border-t border-white/5">
                    {/* Image preview grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 mb-4">
                      {images.slice(0, 8).map((img, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden relative">
                          <NextImage
                            src={img.src}
                            alt={img.alt}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
                          />
                        </div>
                      ))}
                      {images.length > 8 && (
                        <div className="aspect-square rounded-lg bg-white/10 flex items-center justify-center">
                          <span className="text-white/60 text-sm font-medium">+{images.length - 8}</span>
                        </div>
                      )}
                    </div>

                    {renderDownloadButton(
                      portfolioStatus[category.slug] || 'idle',
                      () => handleDownloadPortfolio(category.slug),
                      t('portfolio.downloadAll')
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Configurator CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-8 rounded-3xl bg-gradient-to-br from-oe-gold/20 to-oe-gold/5 border border-oe-gold/30"
      >
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-xl bg-oe-gold/20 flex-shrink-0">
            <Package className="w-8 h-8 text-oe-gold" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{t('quote.title')}</h2>
            <p className="text-white/70 mb-6">{t('quote.description')}</p>
            <a
              href="/configurador"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-oe-gold text-black font-bold hover:bg-oe-gold-bright transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              {t('quote.cta')}
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
