"use client";

// app/configurador/client.tsx
import { EXTRAS, OFFERS, getAllPacks, type ExtraDefinition, type ServiceSlug } from '@/config/packs-config';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Check,
  ChevronRight,
  Calendar,
  Users,
  FileText,
  Sparkles,
  Tag,
  Clock,
  Zap,
  AlertCircle,
  TrendingDown,
  ArrowLeft,
  CheckCircle,
  Download,
} from 'lucide-react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { usePacks } from '@/lib/hooks/usePacks';
import { generateQuotePDF } from '@/lib/pdf-utils';
import { fetchWithCsrf } from '@/lib/csrf';
import TurnstileWidget from '@/components/security/TurnstileWidget';

type EventType = 'bodas' | 'discomovil' | 'fiestas' | 'alquiler' | 'empresas';

const EVENT_TYPE_SERVICE_MAP: Record<EventType, ServiceSlug[]> = {
  bodas: ['bodas'],
  discomovil: ['discomovil', 'fiestas'],
  fiestas: ['fiestas', 'discomovil'],
  alquiler: ['alquiler'],
  empresas: ['empresas'],
};

interface ConfigState {
  eventType: EventType | null;
  selectedPack: any | null;
  date: string;
  guests: number;
  extras: string[];
  appliedOffer: string | null;
}

interface AppliedDiscountCode {
  code: string;
  source: 'customer' | 'global' | 'feedback';
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  expiresAt: string;
  isAccumulative?: boolean;
}

// Helper per obtenir text traduït de l'extra
function isI18nKey(value: string): boolean {
  return value.startsWith('pages.') || value.startsWith('extras.');
}

function getExtraText(t: ReturnType<typeof useTranslations>, extraId: string, field: 'name' | 'description', fallback: string): string {
  try {
    const key = `extras.${extraId}.${field}`;
    const translated = t(key);
    // Si retorna la clau, usar fallback
    if (translated !== key) return translated;
    if (isI18nKey(fallback)) {
      const nested = t(fallback);
      if (nested !== fallback) return nested;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function normalizePackBaseKey(baseKey: string): string {
  const noConfigurator = baseKey.startsWith('configurator.') ? baseKey.slice('configurator.'.length) : baseKey;
  if (noConfigurator.startsWith('pages.parties.discoPacks.')) {
    return noConfigurator.replace('pages.parties.discoPacks.', 'services.mobile.discoPacks.');
  }
  return noConfigurator;
}

function humanizeKeyFallback(value: string): string {
  if (!value || !isI18nKey(value)) return value;
  const token = value.split('.').pop() || value;
  return token
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function ConfiguradorClient() {
  const t = useTranslations('configurator');
  const tRoot = useTranslations();
  const tMobile = useTranslations('pages.mobile'); // Per traduccions d'extres
  const tServicesMobile = useTranslations('services.mobile');
  const locale = useLocale() as 'ca' | 'es' | 'en';
  const dateLocale = locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-US' : 'es-ES';
  const { track } = useAnalytics();
  const fallbackPacks = useMemo(() => getAllPacks(), []);
  const { packs: allPacks } = usePacks({
    locale,
    fallback: fallbackPacks,
  });
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ConfigState>({
    eventType: null,
    selectedPack: null,
    date: '',
    guests: 50,
    extras: [],
    appliedOffer: null,
  });
  const [extrasCatalog, setExtrasCatalog] = useState<ExtraDefinition[]>(EXTRAS);
  const [minDate, setMinDate] = useState(''); // Hydration-safe
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountCodeLoading, setDiscountCodeLoading] = useState(false);
  const [discountCodeError, setDiscountCodeError] = useState('');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<AppliedDiscountCode | null>(null);

  const getTranslatedText = (key: string, fallback: string): string => {
    try {
      if (key.startsWith('services.mobile.')) {
        const nested = key.slice('services.mobile.'.length);
        const translated = tServicesMobile(nested);
        if (translated !== nested) return translated;
      }
      if (key.startsWith('pages.mobile.')) {
        const nested = key.slice('pages.mobile.'.length);
        const translated = tMobile(nested);
        if (translated !== nested) return translated;
      }
      if (key.startsWith('configurator.')) {
        const nested = key.slice('configurator.'.length);
        const translated = t(nested);
        if (translated !== nested) return translated;
      }
      if (key.startsWith('step2.')) {
        const translated = t(key);
        if (translated !== key) return translated;
      }

      const translated = tRoot(key as any);
      return translated !== key ? translated : fallback;
    } catch {
      return fallback;
    }
  };

  const getLocalizedPack = (pack: any) => {
    const fallbackPack = fallbackPacks.find((item) => item.id === pack.id || item.slug === pack.slug);
    const safeNameRaw = isI18nKey(pack.name || '') && fallbackPack ? fallbackPack.name : pack.name;
    const safeTaglineRaw = isI18nKey(pack.tagline || '') && fallbackPack ? fallbackPack.tagline : pack.tagline;
    const safeFeatures = (pack.features || []).map((feature: string, index: number) => {
      if (isI18nKey(feature) && fallbackPack?.features?.[index]) {
        return fallbackPack.features[index];
      }
      return feature;
    });

    const baseKey = pack.i18nBaseKey || `step2.packs.${pack.id}`;
    const normalizedBase = normalizePackBaseKey(baseKey);
    const localizedFeatures = safeFeatures.map((feature: string, index: number) => {
      const byF = getTranslatedText(`${normalizedBase}.features.f${index + 1}`, feature);
      if (byF !== feature) return byF;
      const byIndex = getTranslatedText(`${normalizedBase}.features.${index}`, feature);
      return byIndex !== feature ? byIndex : humanizeKeyFallback(feature);
    });

    const translatedName = getTranslatedText(`${normalizedBase}.name`, safeNameRaw);
    const translatedTagline = getTranslatedText(`${normalizedBase}.tagline`, safeTaglineRaw);

    return {
      ...pack,
      name: humanizeKeyFallback(translatedName),
      tagline: humanizeKeyFallback(translatedTagline),
      features: localizedFeatures,
    };
  };

  const getPacksForEventType = useCallback((eventType: EventType | null) => {
    if (!eventType) return [];
    const allowedServices = EVENT_TYPE_SERVICE_MAP[eventType];
    return allPacks.filter((pack) => allowedServices.includes(pack.service));
  }, [allPacks]);

  // Set minDate on client to avoid hydration mismatch
  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadExtras() {
      try {
        const res = await fetch('/api/public/extras', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (Array.isArray(data?.extras)) {
          const normalized = (data.extras as ExtraDefinition[]).map((extra) => {
            const fallback = EXTRAS.find((item) => item.id === extra.id);
            return {
              ...extra,
              name: isI18nKey(extra.name) && fallback ? fallback.name : extra.name,
              description: isI18nKey(extra.description) && fallback ? fallback.description : extra.description,
            };
          });
          setExtrasCatalog(normalized);
        }
      } catch {
        // Fallback a EXTRAS del config
      }
    }

    loadExtras();
    return () => {
      active = false;
    };
  }, []);

  const getDiscountCodeErrorText = (reason: string) => {
    switch (reason) {
      case 'EXPIRED':
        return t('discountCodeErrors.expired');
      case 'INACTIVE':
        return t('discountCodeErrors.inactive');
      case 'MAX_USES_REACHED':
      case 'ALREADY_USED':
        return t('discountCodeErrors.unavailable');
      case 'NOT_FOUND':
        return t('discountCodeErrors.invalid');
      default:
        return t('discountCodeErrors.default');
    }
  };

  const applyDiscountCode = async () => {
    const code = discountCodeInput.trim().toUpperCase();
    if (!code) return;

    setDiscountCodeLoading(true);
    setDiscountCodeError('');
    try {
      const res = await fetch(`/api/public/discount-code?code=${encodeURIComponent(code)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error('DISCOUNT_API_ERROR');
      }

      if (!data.valid) {
        setAppliedDiscountCode(null);
        setDiscountCodeError(getDiscountCodeErrorText(String(data.reason || '')));
        return;
      }

      setAppliedDiscountCode({
        code: String(data.code || code),
        source: data.source,
        type: data.type,
        value: Number(data.value || 0),
        expiresAt: String(data.expiresAt || ''),
        isAccumulative: Boolean(data.isAccumulative),
      });
    } catch {
      setAppliedDiscountCode(null);
      setDiscountCodeError(t('discountCodeErrors.requestError'));
    } finally {
      setDiscountCodeLoading(false);
    }
  };

  const clearDiscountCode = () => {
    setAppliedDiscountCode(null);
    setDiscountCodeInput('');
    setDiscountCodeError('');
  };

  // Detecta pack preseleccionat via URL (des de pàgines de servei)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get('service') as EventType | null;
    const packId = params.get('packId');
    const guestsParam = params.get('guests');
    const extrasParam = params.get('extras');

    if (service && packId) {
      // Carrega el pack seleccionat
      const packs = getPacksForEventType(service);
      const selectedPack = packs.find(p => p.id === packId);

      if (selectedPack) {
        const initialGuests = guestsParam ? parseInt(guestsParam) : 50;
        const initialExtras = extrasParam ? extrasParam.split(',').filter(Boolean) : [];

        setConfig({
          eventType: service,
          selectedPack: selectedPack,
          date: '',
          guests: initialGuests,
          extras: initialExtras,
          appliedOffer: null,
        });

        // Anar directament al pas 3 (detalls)
        setStep(3);

        track('Configurador_PreSelected', {
          service,
          packId,
          guests: initialGuests,
          numExtras: initialExtras.length,
        });
      }
    } else {
      track('View_Configurador');
    }
  }, [getPacksForEventType, track]);

  // Scroll al top quan canvies de pas o selecciones pack
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, config.selectedPack, config.eventType]);

  const availableExtras = useMemo(() => {
    if (!config.eventType) return [];
    return extrasCatalog.filter((extra) => {
      if (!extra.compatibleWith) return true;
      if (extra.compatibleWith.length === 0) return false;
      return extra.compatibleWith.includes(config.eventType as ServiceSlug);
    });
  }, [extrasCatalog, config.eventType]);

  useEffect(() => {
    if (!config.eventType) return;
    const allowed = new Set(availableExtras.map((extra) => extra.id));
    if (config.extras.some((id) => !allowed.has(id))) {
      setConfig((prev) => ({
        ...prev,
        extras: prev.extras.filter((id) => allowed.has(id)),
      }));
    }
  }, [availableExtras, config.eventType, config.extras]);

  // 💰 Càlcul de preu amb descomptes
  const calculatePricing = () => {
    let basePrice = config.selectedPack?.priceValue || 0;
    let extrasPrice = 0;
    let discount = 0;
    let discountReason = '';

    // Calcula extres
    config.extras.forEach((extraId) => {
      const extra = extrasCatalog.find((e) => e.id === extraId);
      if (extra?.price) extrasPrice += extra.price;
    });

    const subtotal = basePrice + extrasPrice;

    // Aplica descomptes (prioritat: guanya el descompte més alt)
    const applicableOffers = [];

    // 1. Early Bird (reserva inmediata)
    if (config.appliedOffer === 'early-bird' && subtotal >= (OFFERS.earlyBird.minAmount || 0)) {
      applicableOffers.push({
        discount: Math.round((subtotal * (OFFERS.earlyBird.discount || 0)) / 100),
        reason: OFFERS.earlyBird.name,
        priority: 1,
      });
    }

    // 2. Combo d'extres (3 o més)
    if (config.extras.length >= (OFFERS.combo.minExtras || 3)) {
      applicableOffers.push({
        discount: Math.round((extrasPrice * (OFFERS.combo.discount || 0)) / 100),
        reason: OFFERS.combo.name,
        priority: 2,
      });
    }

    // 3. Temporada baixa
    if (config.date) {
      const eventMonth = new Date(config.date).getMonth() + 1;
      const seasonalMonths: readonly number[] = OFFERS.seasonal.months ?? [];
      if (seasonalMonths.includes(eventMonth)) {
        applicableOffers.push({
          discount: Math.round((subtotal * (OFFERS.seasonal.discount || 0)) / 100),
          reason: OFFERS.seasonal.name,
          priority: 3,
        });
      }
    }

    // 4. Codi promocional vàlid (si existeix)
    if (appliedDiscountCode) {
      const codeDiscount =
        appliedDiscountCode.type === 'PERCENTAGE'
          ? Math.round((subtotal * appliedDiscountCode.value) / 100)
          : Math.round(appliedDiscountCode.value);

      if (codeDiscount > 0) {
        applicableOffers.push({
          discount: codeDiscount,
          reason: t('step3.discountCodeReason', { code: appliedDiscountCode.code }),
          priority: 4,
        });
      }
    }

    // Selecciona el millor descompte
    if (applicableOffers.length > 0) {
      const bestOffer = applicableOffers.sort((a, b) => b.discount - a.discount)[0];
      discount = bestOffer.discount;
      discountReason = bestOffer.reason;
    }

    const total = subtotal - discount;

    return { basePrice, extrasPrice, subtotal, discount, discountReason, total };
  };

  // Genera URL del formulari amb les dades del configurador (unused però conservat per referència futura)
  const _getContactUrl = (): string => {
    const pricing = calculatePricing();
    const extrasNames = config.extras
      .map((id) => extrasCatalog.find((e) => e.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const params = new URLSearchParams({
      servicio: config.eventType || '',
      pack: config.selectedPack?.name || '',
      precio: pricing.total.toString(),
      invitados: config.guests.toString(),
      fecha: config.date || '',
      extras: extrasNames,
      descuento: pricing.discount > 0 ? `${pricing.discountReason}: -${pricing.discount}€` : '',
      fromConfigurador: 'true',
    });

    return `/contacto?${params.toString()}`;
  };

  // PAS 1: Tipus d'esdeveniment
  const renderStep1 = () => {
    const services = [
      { slug: 'bodas', icon: '💒' },
      { slug: 'fiestas', icon: '🎉' },
      { slug: 'discomovil', icon: '🎵' },
      { slug: 'empresas', icon: '💼' },
    ];

    return (
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white mb-4">
            {t('step1.title')}
          </h2>
          <p className="text-xl text-text-muted">{t('step1.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const packs = getPacksForEventType(service.slug as EventType);
            const minPrice = packs.length > 0 ? Math.min(...packs.map((p) => p.priceValue)) : 0;

            return (
              <button
                key={service.slug}
                onClick={() => {
                  setConfig({ ...config, eventType: service.slug as EventType });
                  setStep(2);
                  track('Configurador_Step1_EventType', { type: service.slug });
                }}
                className="p-8 rounded-2xl bg-bg-surface border-2 border-border hover:border-oe-gold transition-all duration-300 transform hover:scale-105 hover:shadow-oe-gold text-left group"
              >
                <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{service.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-oe-gold transition-colors">
                  {t(`step1.eventTypes.${service.slug}`)}
                </h3>
                <p className="text-text-muted text-sm mb-4">{t('step1.from')} {minPrice}€</p>
                <div className="flex items-center text-oe-gold text-sm font-bold">
                  {t('step1.viewPacks')} <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // PAS 2: Selecció de pack
  const renderStep2 = () => {
    const packs = getPacksForEventType(config.eventType);
    if (!packs || packs.length === 0) return null;

    const serviceName = t(`step1.eventTypes.${config.eventType || 'bodas'}`);

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <button
            onClick={() => setStep(1)}
            className="text-oe-gold hover:underline mb-4 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('step2.changeEvent')}
          </button>
          <h2 className="text-4xl font-display font-black text-white mb-4">{serviceName}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {packs.map((pack) => {
            const localizedPack = getLocalizedPack(pack);
            return (
            <div
              key={localizedPack.id}
              className={`group p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                config.selectedPack?.id === localizedPack.id
                  ? 'border-oe-gold bg-oe-gold/5 shadow-oe-gold'
                  : 'border-border bg-bg-surface hover:border-oe-gold/50 hover:shadow-lg'
              } ${localizedPack.highlight ? 'ring-2 ring-oe-gold/50 shadow-oe-gold-lg' : ''}`}
            >
              {localizedPack.popular && (
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-oe-gold via-yellow-300 to-oe-gold text-black text-xs font-bold mb-4 animate-pulse">
                  ⚡ {t('step2.mostSold')}
                </div>
              )}
              {localizedPack.highlight && (
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-oe-gold via-oe-gold-bright to-oe-gold text-black text-xs font-bold mb-4 shadow-oe-gold animate-pulse">
                  ⭐ {t('step2.premium')}
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">{localizedPack.name}</h3>
              <p className="text-text-muted text-sm mb-4">{localizedPack.tagline}</p>

              <div className="mb-6">
                <div className="text-4xl font-black text-oe-gold mb-1">{localizedPack.price}</div>
                <div className="text-text-muted text-sm">{localizedPack.duration}</div>
              </div>

              <ul className="space-y-2 mb-6">
                {localizedPack.features.slice(0, 4).map((feature: string, index: number) => (
                  <li key={`${localizedPack.id}-feature-${index}`} className="flex items-start text-sm text-text-muted">
                    <Check className="w-4 h-4 text-oe-gold mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {localizedPack.features.length > 4 && (
                  <li className="text-xs text-oe-gold">+ {localizedPack.features.length - 4} {t('step2.moreFeatures')}</li>
                )}
              </ul>

              <button
                onClick={() => {
                  setConfig({ ...config, selectedPack: localizedPack });
                  setStep(3);
                  track('Configurador_Step2_PackSelected', { pack: localizedPack.id, price: localizedPack.priceValue });
                }}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  config.selectedPack?.id === localizedPack.id
                    ? 'bg-oe-gold text-black'
                    : 'bg-bg-main text-white hover:bg-oe-gold hover:text-black'
                }`}
              >
                {config.selectedPack?.id === localizedPack.id ? t('step2.selected') : t('step2.select')}
              </button>
            </div>
          )})}
        </div>
      </div>
    );
  };

  // PAS 3: Detalls i extres
  const renderStep3 = () => {
    const pricing = calculatePricing();

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <button
            onClick={() => setStep(2)}
            className="text-oe-gold hover:underline mb-4 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('step3.changePack')}
          </button>
          <h2 className="text-4xl font-display font-black text-white mb-4">{t('step3.title')}</h2>
        </div>

        {/* Data i assistents */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-bg-surface border border-border">
            <label
              htmlFor="event-date"
              className="block text-white font-bold mb-3 flex items-center gap-2"
            >
              <Calendar className="w-5 h-5 text-oe-gold" />
              {t('step3.date')}
            </label>
            <input
              id="event-date"
              name="eventDate"
              type="date"
              autoComplete="off"
              value={config.date}
              onChange={(e) => setConfig({ ...config, date: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-bg-main text-white border border-border focus:border-oe-gold outline-none"
              min={minDate}
            />
            {config.date && (
              <p className="mt-2 text-xs text-text-muted flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t('step3.dateNote')}
              </p>
            )}
          </div>

          <div className="p-6 rounded-xl bg-bg-surface border border-border">
            <label
              htmlFor="guests"
              className="block text-white font-bold mb-3 flex items-center gap-2"
            >
              <Users className="w-5 h-5 text-oe-gold" />
              {t('step3.guests')}
            </label>
            <input
              id="guests"
              name="guests"
              type="number"
              autoComplete="off"
              value={config.guests}
              onChange={(e) => setConfig({ ...config, guests: parseInt(e.target.value) || 0 })}
              min="10"
              max="1000"
              className="w-full px-4 py-3 rounded-lg bg-bg-main text-white border border-border focus:border-oe-gold outline-none"
            />
          </div>
        </div>

        {/* Extras */}
        <div className="p-8 rounded-xl bg-bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-oe-gold" />
              {t('step3.extras')}
            </h3>
            {config.extras.length >= (OFFERS.combo.minExtras || 3) && (
              <span className="text-xs bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 text-fuchsia-400 px-3 py-1 rounded-full font-bold border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                ✨ {t('step3.extrasDiscount')}
              </span>
            )}
          </div>

            <div className="grid md:grid-cols-2 gap-4">
              {availableExtras.map((extra) => (
                <label
                  key={extra.id}
                  htmlFor={`extra-${extra.id}`}
                  className={`relative flex items-start justify-between w-full max-w-full p-4 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                    config.extras.includes(extra.id)
                      ? 'border-fuchsia-500 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/5 shadow-[0_0_20px_rgba(217,70,239,0.2)]'
                      : 'border-border hover:border-fuchsia-500/50'
                  }`}
                >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="relative mt-0.5 h-5 w-5 shrink-0">
                    <input
                      type="checkbox"
                      id={`extra-${extra.id}`}
                      name={`extra-${extra.id}`}
                      checked={config.extras.includes(extra.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig({ ...config, extras: [...config.extras, extra.id] });
                        } else {
                          setConfig({
                            ...config,
                            extras: config.extras.filter((id) => id !== extra.id),
                          });
                        }
                      }}
                      className="peer absolute inset-0 z-10 h-5 w-5 cursor-pointer appearance-none opacity-0"
                    />
                    <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-white/35 bg-black/30 transition-all peer-checked:border-oe-gold peer-checked:bg-oe-gold">
                      <Check className="h-3.5 w-3.5 text-black opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold flex items-center gap-2">
                      <span>{extra.icon}</span>
                      {getExtraText(tMobile, extra.id, 'name', extra.name)}
                    </div>
                    <div className="text-text-muted text-xs mt-1">
                      {getExtraText(tMobile, extra.id, 'description', extra.description)}
                    </div>
                    <div className="text-oe-gold text-sm font-bold mt-1">
                      {extra.price !== null ? `+${extra.price}€` : t('step3.toConsult')}
                    </div>
                  </div>
                </div>
                {extra.popular && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {t('step3.popular')}
                  </span>
                )}
                {extra.premium && (
                  <span className="absolute top-2 right-2 bg-oe-gold text-white text-xs px-2 py-0.5 rounded-full">
                    {t('step3.premiumExtra')}
                  </span>
                )}
                </label>
              ))}
            {availableExtras.length === 0 && (
                <div className="col-span-full text-center py-8 text-white/60">
                  {t('step3.noExtras')}
                </div>
              )}
            </div>
        </div>

        {/* Codi de descompte */}
        <div className="p-6 rounded-xl bg-bg-surface border border-border">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Tag className="w-5 h-5 text-oe-gold" />
            {t('step3.discountCode')}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={discountCodeInput}
              onChange={(e) => {
                setDiscountCodeInput(e.target.value.toUpperCase());
                setDiscountCodeError('');
              }}
              placeholder={t('step3.discountCodePlaceholder')}
              className="flex-1 px-4 py-3 rounded-lg bg-bg-main text-white border border-border focus:border-oe-gold outline-none"
            />
            <button
              type="button"
              onClick={applyDiscountCode}
              disabled={discountCodeLoading || !discountCodeInput.trim()}
              className="px-5 py-3 rounded-lg bg-oe-gold text-black font-bold disabled:opacity-50"
            >
              {discountCodeLoading ? t('step3.validatingCode') : t('step3.applyCode')}
            </button>
            {appliedDiscountCode && (
              <button
                type="button"
                onClick={clearDiscountCode}
                className="px-4 py-3 rounded-lg border border-border text-white"
              >
                {t('step3.removeCode')}
              </button>
            )}
          </div>
          {discountCodeError && (
            <p className="mt-2 text-sm text-red-400">{discountCodeError}</p>
          )}
          {appliedDiscountCode && !discountCodeError && (
            <p className="mt-2 text-sm text-emerald-400">
              {t('step3.activeCode', {
                code: appliedDiscountCode.code,
                date: new Date(appliedDiscountCode.expiresAt).toLocaleDateString(dateLocale),
              })}
            </p>
          )}
        </div>

        {/* Resum de preu */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-oe-gold/10 to-oe-gold/5 border-2 border-oe-gold/50">
          <h3 className="text-2xl font-bold text-white mb-4">{t('step3.summary')}</h3>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-text-muted">
              <span>{t('step3.basePrice')}</span>
              <span>{pricing.basePrice}€</span>
            </div>
            {pricing.extrasPrice > 0 && (
              <div className="flex justify-between text-text-muted">
                <span>{t('step3.extrasPrice', { count: config.extras.length })}</span>
                <span>{pricing.extrasPrice}€</span>
              </div>
            )}
            {pricing.discount > 0 && (
              <div className="flex justify-between text-green-400 font-bold">
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {pricing.discountReason}:
                </span>
                <span>-{pricing.discount}€</span>
              </div>
            )}
            <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
              <span className="text-xl font-bold text-white">{t('step3.total')}</span>
              <span className="text-3xl font-black text-oe-gold">{pricing.total}€</span>
            </div>
          </div>

          <button
            onClick={() => {
              setStep(4);
              track('Configurador_Step3_Continue', { total: pricing.total });
            }}
            className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-2"
          >
            {t('step3.continue')}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Estat del formulari inline
  const [formData, setFormData] = useState({ name: '', contact: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // 🔥 PAS 4 NOU: oferta de tancament amb formulari inline
  const renderStep4 = () => {
    const pricing = calculatePricing();

    // Calcula el descompte early bird SEMPRE (sobre subtotal)
    // Si ja hi ha descompte aplicat, aplica el més alt
    const potentialEarlyBird = Math.round((pricing.subtotal * (OFFERS.earlyBird.discount || 10)) / 100);

    // Usa el descompte més alt entre l'actual i l'early bird
    const earlyBirdDiscount = Math.max(pricing.discount, potentialEarlyBird);

    // Preu sense descompte (per mostrar "preu normal")
    const priceWithoutDiscount = pricing.subtotal;

    // Preu final amb el millor descompte
    const finalPrice = pricing.subtotal - earlyBirdDiscount;

    // Envia sol·licitud directa
    const handleDirectSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.name || formData.name.length < 2) {
        setFormError(t('step4.errorName'));
        return;
      }

      if (!formData.contact || formData.contact.length < 5) {
        setFormError(t('step4.errorContact'));
        return;
      }

      if (!turnstileToken) {
        setFormError(t('step4.errorCaptcha'));
        return;
      }

      setSending(true);
      setFormError('');

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const controller = new AbortController();

      timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000);

      try {
        const extrasArray = config.extras
          .map((id) => extrasCatalog.find((e) => e.id === id)?.name)
          .filter(Boolean) as string[];

        const response = await fetchWithCsrf('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            name: formData.name,
            contact: formData.contact,
            event: config.eventType || t('eventFallback'),
            message: t('requestMessage', { amount: earlyBirdDiscount }),
            packId: config.selectedPack?.id,
            packName: config.selectedPack?.name,
            estimatedPrice: finalPrice,
            eventDate: config.date,
            guests: config.guests,
            extras: extrasArray,
            turnstileToken,
          }),
        });

        if (!response.ok) {
          throw new Error('REQUEST_SEND_ERROR');
        }

        setSent(true);
        track('Configurador_DirectSubmit_Success', {
          packId: config.selectedPack?.id,
          finalPrice,
          discount: earlyBirdDiscount,
        });
      } catch (error) {
        setFormError(t('step4.errorSend'));
        setSending(false);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 rounded-full bg-red-500/20 text-red-400 text-sm font-bold mb-4 animate-pulse">
            ⏰ {t('step4.offerExpires')}
          </div>
          <h2 className="text-5xl font-display font-black text-white mb-4">
            {t('step4.title')}
          </h2>
          <p className="text-xl text-text-muted">
            {t('step4.subtitle', { amount: earlyBirdDiscount })}
          </p>
        </div>

        {/* Comparació de preus */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sense oferta */}
          <div className="p-6 rounded-xl bg-bg-surface border border-border opacity-60">
            <div className="text-center">
              <p className="text-text-muted mb-2">{t('step4.laterPrice')}</p>
              <p className="text-3xl font-black text-white line-through">{priceWithoutDiscount}€</p>
              <p className="text-sm text-text-muted mt-2">{t('step4.normalPrice')}</p>
            </div>
          </div>

          {/* Amb oferta */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-oe-gold/20 to-oe-gold/5 border-2 border-oe-gold ring-4 ring-oe-gold/30">
            <div className="text-center">
              <div className="inline-block px-3 py-1 rounded-full bg-oe-gold text-black text-xs font-bold mb-3">
                🔥 {t('step4.bookToday')}
              </div>
              <p className="text-sm text-text-muted mb-2">{t('step4.finalPrice')}</p>
              <p className="text-5xl font-black text-oe-gold mb-2">{finalPrice}€</p>
              <p className="text-green-400 font-bold flex items-center justify-center gap-1">
                <TrendingDown className="w-4 h-4" />
                {t('step4.youSave', { amount: earlyBirdDiscount })}
              </p>
            </div>
          </div>
        </div>

        {/* Urgència visual */}
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/50">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-white font-bold mb-2">{t('step4.whyOffer')}</h4>
              <p className="text-text-muted text-sm leading-relaxed">
                {t('step4.whyOfferText')}
              </p>
            </div>
          </div>
        </div>

        {/* Garantia */}
        <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/50">
          <div className="flex items-start gap-4">
            <Zap className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-white font-bold mb-2">{t('step4.guarantee')}</h4>
              <p className="text-text-muted text-sm leading-relaxed">
                {t('step4.guaranteeText')}
              </p>
            </div>
          </div>
        </div>

        {/* Formulari inline o missatge d'èxit */}
        {sent ? (
          <motion.div
            className="p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/50 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">{t('step4.successTitle')}</h3>
            <p className="text-xl text-white/80 mb-2">
              {t('step4.successMessage')}
            </p>
            <p className="text-green-400 font-bold text-lg mb-6">
              {t('step4.youSaved', { amount: earlyBirdDiscount })}
            </p>
            <p className="text-white/60 text-sm mb-6">
              {t('step4.checkEmail')}
            </p>

            {/* Download PDF Button */}
            <button
              onClick={async () => {
                const extrasNames = config.extras
                  .map((id) => extrasCatalog.find((e) => e.id === id)?.name)
                  .filter(Boolean) as string[];

                  const doc = await generateQuotePDF({
                    eventType: config.eventType || t('eventFallback'),
                    pack: config.selectedPack,
                    date: config.date,
                    guests: config.guests,
                    extras: extrasNames,
                    extrasCatalog,
                    basePrice: pricing.basePrice,
                    extrasPrice: pricing.extrasPrice,
                    discount: earlyBirdDiscount,
                  discountReason: pricing.discountReason || t('step4.bookToday'),
                  total: finalPrice,
                  clientName: formData.name,
                }, locale);

                doc.save(`orbita-pressupost-${Date.now()}.pdf`);
                track('Configurador_DownloadPDF', { total: finalPrice });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-oe-gold text-black font-bold hover:bg-oe-gold-bright transition-colors"
            >
              <Download className="w-5 h-5" />
              {t('step4.downloadPDF')}
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleDirectSubmit} className="space-y-6">
            {/* Formulari de contacte ràpid */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-oe-gold/5 to-oe-gold/10 border-2 border-oe-gold/30">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                🎉 {t('step4.lastStep')}
              </h3>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-white font-semibold mb-2">
                    {t('step4.yourName')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-bg-main text-white border-2 border-border focus:border-oe-gold outline-none transition-colors"
                    placeholder={t('step4.namePlaceholder')}
                    required
                    disabled={sending}
                  />
                </div>

                <div>
                  <label htmlFor="contact" className="block text-white font-semibold mb-2">
                    {t('step4.emailOrPhone')}
                  </label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    autoComplete="email tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-bg-main text-white border-2 border-border focus:border-oe-gold outline-none transition-colors"
                    placeholder={t('step4.contactPlaceholder')}
                    required
                    disabled={sending}
                  />
                </div>
              </div>
            </div>

            {/* Turnstile CAPTCHA */}
            <div className="pt-2">
              <TurnstileWidget
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setFormError('');
                }}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                theme="dark"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !turnstileToken}
              className="w-full btn-primary text-xl py-6 flex items-center justify-center gap-3 animate-pulse hover:animate-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                  {t('step4.sending')}
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6" />
                  {t('step4.reserveWithDiscount', { amount: earlyBirdDiscount })}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full text-text-muted hover:text-white text-sm underline"
            >
              {t('step4.reviewConfig')}
            </button>
          </form>
        )}

        {/* Social proof - usando datos reales del config */}
        <div className="text-center pt-6 border-t border-border">
          <p className="text-sm text-text-muted">
            ⭐⭐⭐⭐⭐ <strong className="text-white">{t('step4.satisfactionGuaranteed')}</strong> • {t('step4.responseTime')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-main py-20 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Progress Steps con glow fucsia */}
        <div className="mb-16 flex justify-center">
          <div className="flex items-center gap-2 sm:gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2 sm:gap-4">
                <div
                  className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all ${
                    step >= s
                      ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]'
                      : 'bg-bg-surface text-text-muted border border-border'
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : s}
                  {step === s && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 blur-lg" />
                  )}
                </div>
                {s < 4 && <div className={`h-0.5 w-6 sm:w-12 ${step > s ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Steps Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  );
}
