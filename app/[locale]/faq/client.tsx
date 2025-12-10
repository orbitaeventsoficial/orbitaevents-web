"use client";

import { SITE_CONFIG } from '@/config/site-config';
import Link from 'next/link';
import { useState } from "react";
import { Search, ChevronDown, MessageCircle, FileText } from "lucide-react";
import { FAQ_DATA } from '@/config/faq-data';
import { useTranslations } from 'next-intl';

type CategoryType = "all" | "general" | "sonido" | "iluminacion" | "precios" | "reservas";

export default function FAQClient() {
  const t = useTranslations('faq');
  const tCommon = useTranslations('common.buttons');
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [category, setCategory] = useState<CategoryType>("all");

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesSearch =
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || faq.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-20 text-white">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-xl text-white/80 mb-4">
          {t('subtitle')}
        </p>
      </div>

      {/* CTA Superior */}
      <div className="max-w-3xl mx-auto mb-12 p-6 bg-gradient-to-r from-[var(--oe-gold)]/10 to-transparent border border-[var(--oe-gold)]/30 rounded-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold mb-1">{t('urgency.title')}</p>
            <p className="text-white/60 text-sm">{t('urgency.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/contacto"
              className="oe-btn oe-btn-gold flex items-center gap-2 whitespace-nowrap"
            >
              <MessageCircle className="w-5 h-5" />
              {tCommon('contact')}
            </Link>
            <Link
              href="/calendario"
              className="oe-btn flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="w-5 h-5" />
              {t('viewDates')}
            </Link>
          </div>
        </div>
      </div>

      {/* Búsqueda + Filtros */}
      <div className="mb-12">
        <div className="relative max-w-md mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--oe-gold)] transition text-white placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: "all", label: t('categories.all') },
            { id: "general", label: t('categories.general') },
            { id: "sonido", label: t('categories.sound') },
            { id: "iluminacion", label: t('categories.lighting') },
            { id: "precios", label: t('categories.pricing') },
            { id: "reservas", label: t('categories.booking') },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as CategoryType)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat.id
                  ? "bg-[var(--oe-gold)] text-black"
                  : "bg-white/5 border border-white/20 hover:bg-white/10 text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Acordeón */}
      <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 mb-4">{t('noResults')}</p>
            <Link
              href="/contacto"
              className="oe-btn oe-btn-gold inline-flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {t('askDirectly')}
            </Link>
          </div>
        ) : (
          filteredFAQs.map((faq, i) => (
            <div
              key={i}
              className="oe-card rounded-2xl border border-white/10 transition-all duration-300 hover:border-[var(--oe-gold)]/30"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left group"
              >
                <h2 className="text-lg font-semibold pr-4 group-hover:text-[var(--oe-gold)] transition">
                  {faq.q}
                </h2>
                <ChevronDown
                  className={`w-5 h-5 transition-transform flex-shrink-0 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4 text-white/80">
                  <p className="mb-4 leading-relaxed">{faq.a}</p>
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                    <Link
                      href="/contacto"
                      className="inline-flex items-center gap-2 text-[var(--oe-gold)] hover:text-white transition text-sm font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t('sendQuery')} →
                    </Link>
                    <Link
                      href="/configurador"
                      className="inline-flex items-center gap-2 text-white/60 hover:text-white transition text-sm"
                    >
                      {t('orUseConfigurator')} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* CTA Final */}
      <div className="mt-16 text-center bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-8">
        <p className="text-2xl font-bold mb-2">{t('cta.title')}</p>
        <p className="text-white/70 mb-6 max-w-xl mx-auto">
          {t('cta.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/contacto"
            className="oe-btn oe-btn-gold flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            {t('sendQuery')}
          </Link>
          <Link
            href="/configurador"
            className="oe-btn flex items-center justify-center gap-2"
          >
            {t('useConfigurator')}
          </Link>
        </div>
        <p className="text-white/40 text-sm mt-4">
          {t('alsoCall')}: {SITE_CONFIG.business.phone}
        </p>
      </div>
    </section>
  );
}


