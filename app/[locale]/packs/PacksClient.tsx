'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import type { PackDefinition, ServiceSlug } from '@/config/packs-config';

type Tab = 'bodas' | 'festes' | 'empresas';

const TABS: { id: Tab; services: ServiceSlug[] }[] = [
  { id: 'festes', services: ['discomovil', 'fiestas'] },
  { id: 'bodas', services: ['bodas'] },
  { id: 'empresas', services: ['empresas'] },
];

export default function PacksClient({ packs }: { packs: PackDefinition[] }) {
  const t = useTranslations('packs');
  const [activeTab, setActiveTab] = useState<Tab>('festes');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const packRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handlePackClick = useCallback((packId: string) => {
    setSelectedPackId(packId);
    requestAnimationFrame(() => {
      packRefs.current[packId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const tabConfig = TABS.find((tab) => tab.id === activeTab)!;
  const filtered = packs.filter((p) => tabConfig.services.includes(p.service));

  // Price ascending (grow-up progression: Bàsic → Complet → Premium)
  const sorted = [...filtered].sort((a, b) => (a.priceValue ?? 0) - (b.priceValue ?? 0));

  return (
    <main className="min-h-screen bg-bg-main text-white pt-28 pb-20 px-4 relative">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-wider mb-3">
            {t('badge')}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
            {t('title')}
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {t('titleHighlight')}
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {t(`tab_${tab.id}`)}
            </button>
          ))}
        </div>

        {/* Pack cards */}
        <div className={`grid gap-6 mb-16 ${sorted.length <= 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : sorted.length === 3 ? 'md:grid-cols-3 max-w-5xl mx-auto' : 'md:grid-cols-3'}`}>
          {sorted.map((pack) => {
            const features = pack.features || [];
            const isPopular = pack.popular;
            const isSelected = selectedPackId === pack.id;
            return (
              <div
                key={pack.id}
                ref={(el) => { packRefs.current[pack.id] = el; }}
                onClick={() => handlePackClick(pack.id)}
                className={`relative rounded-2xl border transition-all duration-300 flex flex-col cursor-pointer group ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-500/15 to-transparent border-amber-500/60 ring-2 ring-amber-500/40 scale-[1.02]'
                    : isPopular
                    ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/40 ring-1 ring-amber-500/20 md:scale-[1.03] hover:shadow-lg hover:shadow-amber-500/10'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-white/5'
                } p-7 md:p-8`}
              >
                {/* Badge */}
                {pack.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      isPopular
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                        : 'bg-white/10 text-white/80 border border-white/15 backdrop-blur-sm'
                    }`}
                  >
                    {pack.badge}
                  </div>
                )}

                {/* Name + tagline */}
                <div className="text-center mb-5 mt-1">
                  <h2 className="text-2xl font-bold mb-1">{pack.name}</h2>
                  {pack.tagline && (
                    <p className="text-white/50 text-sm leading-snug">{pack.tagline}</p>
                  )}
                </div>

                {/* Price */}
                <div className="text-center mb-6 pb-6 border-b border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{t('from')}</p>
                  {pack.priceOriginal && (
                    <p className="text-white/30 text-lg line-through mb-0.5">{pack.priceOriginal}</p>
                  )}
                  <p className={`text-4xl font-black ${isPopular ? 'text-amber-400' : ''}`}>{pack.price}</p>
                  <p className="text-white/30 text-xs mt-1">{t('vatExcluded')}</p>
                </div>

                {/* Quick specs */}
                <div className="space-y-2 text-sm text-white/50 mb-5 pb-5 border-b border-white/10">
                  <div className="flex justify-between">
                    <span>{t('duration')}</span>
                    <span className="text-white/70 font-medium">{pack.duration}</span>
                  </div>
                  {pack.capacidadMaxima && (
                    <div className="flex justify-between">
                      <span>{t('guests')}</span>
                      <span className="text-white/70 font-medium">
                        {pack.capacidadMinima ? `${pack.capacidadMinima}–` : ''}
                        {pack.capacidadMaxima}
                      </span>
                    </div>
                  )}
                  {pack.extraHourPrice && (
                    <div className="flex justify-between">
                      <span>{t('extraHour')}</span>
                      <span className="text-white/70 font-medium">+{pack.extraHourPrice}€</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <ul className="space-y-2 mb-5 flex-1">
                    {features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-xs shrink-0 mt-0.5">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Ideal for */}
                {pack.ideal && (
                  <p className="text-xs text-white/40 mb-5">
                    <span className="text-white/50 font-medium">{t('idealFor')}:</span> {pack.ideal}
                  </p>
                )}

                {/* CTA */}
                <Link
                  href={`/configurador?pack=${pack.id}&service=${pack.service}`}
                  className={`block text-center py-3.5 rounded-xl font-semibold transition-all mt-auto ${
                    isPopular
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {t('configurePack')}
                </Link>
              </div>
            );
          })}
        </div>

        {/* All packs include */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 md:p-12 mb-16">
          <h3 className="text-xl font-bold text-center mb-8">{t('allInclude')}</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {(t.raw('allIncludeItems') as string[]).map((item: string, i: number) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">✓</span>
                <span className="text-white/80 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-3">{t('customNeeds')}</h3>
          <p className="text-white/50 mb-6 max-w-lg mx-auto">{t('customNeedsSub')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/configurador"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold hover:opacity-90 transition-opacity"
            >
              {t('configurePack')}
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all border border-white/10"
            >
              {t('contactUs')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
