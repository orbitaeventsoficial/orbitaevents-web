"use client";

// app/configurador/client.tsx
import { OFFERS, getAllPacks, type ExtraDefinition, type PackDefinition, type ServiceSlug } from '@/config/packs-config';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Check,
  ChevronRight,
  Calendar,
  Users,
  FileText,
  Sparkles,
  Tag,
  Zap,
  AlertCircle,
  TrendingDown,
  ArrowLeft,
  CheckCircle,
  Download,
} from 'lucide-react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useBookedDates } from '@/lib/hooks/useBookedDates';
import { useConfiguratorExtras } from '@/lib/hooks/useConfiguratorExtras';
import { useConfiguratorLeadForm } from '@/lib/hooks/useConfiguratorLeadForm';
import { usePacks } from '@/lib/hooks/usePacks';
import { filterCompatibleExtras } from '@/lib/extrasCompatibility';
// jspdf carrega lazy — només quan l'usuari clica "Descarregar PDF"
import TurnstileWidget from '@/components/security/TurnstileWidget';
import { toIntlLocale } from '@/lib/constants';
import { getWhatsAppUrl } from '@/config/site-config';

import { type EventType, type ConfigState, type AppliedDiscountCode, type PricingSummary, type ClosingPricingSummary, EVENT_TYPE_SERVICE_MAP, EVENT_TYPE_CARDS, EVENT_AMBIENTS, getPacksForEventType, getMinPriceForEventType, calculatePricingSummary, calculateClosingPricing, toggleExtraSelection, filterUnavailableExtras, getSelectedExtraNames } from './configurador-utils';

type ConfiguratorTranslations = ReturnType<typeof useTranslations<'configurator'>>;

interface Step4SuccessCardProps {
  t: ConfiguratorTranslations;
  locale: 'ca' | 'es' | 'en';
  config: ConfigState;
  extrasCatalog: ExtraDefinition[];
  pricing: PricingSummary;
  closingPricing: ClosingPricingSummary;
  clientName: string;
  onDownload: (total: number) => void;
}

function Step4SuccessCard({
  t,
  locale,
  config,
  extrasCatalog,
  pricing,
  closingPricing,
  clientName,
  onDownload,
}: Step4SuccessCardProps) {
  const selectedEvent = config.eventType || t('eventFallback');
  const earlyBirdDiscount = closingPricing.earlyBirdDiscount;
  const finalPrice = closingPricing.finalPrice;

  return (
    <motion.div
      className="p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/50 text-center shadow-[0_0_40px_rgba(34,197,94,0.1)]"
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-green-400" />
      </div>
      <h3 className="text-3xl font-bold text-white mb-4">{t('step4.successTitle')}</h3>
      <p className="text-xl text-white/80 mb-2">{t('step4.successMessage')}</p>
      <p className="text-green-400 font-bold text-lg mb-6">
        {t('step4.youSaved', { amount: closingPricing.earlyBirdDiscount })}
      </p>
      <p className="text-white/60 text-sm mb-6">{t('step4.checkEmail')}</p>

      <button
        onClick={async () => {
          const selectedPack = config.selectedPack;
          if (!selectedPack) return;

          const extrasNames = getSelectedExtraNames(config.extras, extrasCatalog);

          const { generateQuotePDF } = await import('@/lib/pdf-utils');
          const doc = await generateQuotePDF({
            eventType: selectedEvent,
            pack: selectedPack,
            date: config.date,
            guests: config.guests,
            extras: extrasNames,
            extrasCatalog,
            basePrice: pricing.basePrice,
            extrasPrice: pricing.extrasPrice,
            discount: earlyBirdDiscount,
            discountReason: pricing.discountReason || t('step4.bookToday'),
            total: finalPrice,
            clientName,
          }, locale);

          doc.save(`orbita-pressupost-${Date.now()}.pdf`);
          onDownload(finalPrice);
        }}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-oe-gold text-black font-bold hover:bg-oe-gold-bright transition-colors"
      >
        <Download className="w-5 h-5" />
        {t('step4.downloadPDF')}
      </button>
    </motion.div>
  );
}

interface Step4LeadFormProps {
  t: ConfiguratorTranslations;
  formData: { name: string; contact: string };
  formError: string;
  sending: boolean;
  turnstileToken: string | null;
  finalPrice: number;
  packName?: string | null;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  onReviewConfig: () => void;
  onNameChange: (value: string) => void;
  onContactChange: (value: string) => void;
  onTurnstileSuccess: (token: string) => void;
  onTurnstileClear: () => void;
  onWhatsAppClick: () => void;
}

function Step4LeadForm({
  t,
  formData,
  formError,
  sending,
  turnstileToken,
  finalPrice,
  packName,
  onSubmit,
  onReviewConfig,
  onNameChange,
  onContactChange,
  onTurnstileSuccess,
  onTurnstileClear,
  onWhatsAppClick,
}: Step4LeadFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-oe-gold/5 to-oe-gold/10 border-2 border-oe-gold/30">
        <h3 className="text-2xl font-bold text-white mb-4 text-center">🎉 {t('step4.lastStep')}</h3>

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
              aria-required="true"
              value={formData.name}
              onChange={(e) => onNameChange(e.target.value)}
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
              aria-required="true"
              value={formData.contact}
              onChange={(e) => onContactChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-main text-white border-2 border-border focus:border-oe-gold outline-none transition-colors"
              placeholder={t('step4.contactPlaceholder')}
              required
              disabled={sending}
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <p className="text-xs text-text-muted mb-2">{t('step4.captchaExplanation')}</p>
        <TurnstileWidget
          onSuccess={onTurnstileSuccess}
          onError={onTurnstileClear}
          onExpire={onTurnstileClear}
          theme="dark"
        />
      </div>

      <button
        type="submit"
        disabled={sending || !turnstileToken}
        className="group relative overflow-hidden w-full btn-primary sm:text-xl text-lg sm:py-6 py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_8px_32px_rgba(251,191,36,0.3)] transition-shadow duration-300"
      >
        {/* Shine sweep */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] pointer-events-none" />
        {sending ? (
          <>
            <div className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin" />
            {t('step4.sending')}
          </>
        ) : (
          <>
            <FileText className="w-6 h-6" />
            {t('step4.requestProposal')}
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onReviewConfig}
        className="w-full text-text-muted hover:text-white text-sm underline"
      >
        {t('step4.reviewConfig')}
      </button>

      <div className="text-center pt-4 border-t border-border">
        <p className="text-xs text-text-muted mb-2">{t('step4.preferWhatsApp')}</p>
        <a
          href={getWhatsAppUrl('configurador', { packName: packName ?? undefined, precio: finalPrice })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#20BD5A] transition-colors"
          onClick={onWhatsAppClick}
        >
          💬 {t('step4.contactWhatsApp')}
        </a>
      </div>
    </form>
  );
}

interface Step3DiscountCodePanelProps {
  t: ConfiguratorTranslations;
  dateLocale: string;
  discountCodeInput: string;
  discountCodeLoading: boolean;
  discountCodeError: string;
  appliedDiscountCode: AppliedDiscountCode | null;
  onInputChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

function Step3DiscountCodePanel({
  t,
  dateLocale,
  discountCodeInput,
  discountCodeLoading,
  discountCodeError,
  appliedDiscountCode,
  onInputChange,
  onApply,
  onClear,
}: Step3DiscountCodePanelProps) {
  return (
    <div className="p-6 rounded-xl bg-bg-surface border border-border">
      <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
        <Tag className="w-5 h-5 text-oe-gold" />
        {t('step3.discountCode')}
      </h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          aria-label={t('step3.discountCode')}
          value={discountCodeInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={t('step3.discountCodePlaceholder')}
          className="flex-1 px-4 py-3 rounded-lg bg-bg-main text-white border border-border focus:border-oe-gold outline-none"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={discountCodeLoading || !discountCodeInput.trim()}
          aria-busy={discountCodeLoading}
          className="px-5 py-3 rounded-lg bg-oe-gold text-black font-bold disabled:opacity-50"
        >
          {discountCodeLoading ? t('step3.validatingCode') : t('step3.applyCode')}
        </button>
        {appliedDiscountCode && (
          <button
            type="button"
            onClick={onClear}
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
  );
}

interface Step3PricingSummaryCardProps {
  t: ConfiguratorTranslations;
  pricing: PricingSummary;
  extrasCount: number;
  onContinue: () => void;
}

function Step3PricingSummaryCard({ t, pricing, extrasCount, onContinue }: Step3PricingSummaryCardProps) {
  const hasExtrasPrice = pricing.extrasPrice > 0;
  const hasPricingDiscount = pricing.discount > 0;
  return (
    <div className="p-8 rounded-2xl bg-gradient-to-br from-oe-gold/10 to-oe-gold/5 border-2 border-oe-gold/50">
      <h3 className="text-2xl font-bold text-white mb-4">{t('step3.summary')}</h3>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-text-muted">
          <span>{t('step3.basePrice')}</span>
          <span>{pricing.basePrice}€</span>
        </div>
        {hasExtrasPrice && (
          <div className="flex justify-between text-text-muted">
            <span>{t('step3.extrasPrice', { count: extrasCount })}</span>
            <span>{pricing.extrasPrice}€</span>
          </div>
        )}
        {hasPricingDiscount && (
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
        onClick={onContinue}
        className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-2"
      >
        {t('step3.continue')}
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
interface ProgressStepsNavProps {
  currentStep: number;
  labels: [string, string, string, string];
}

function ProgressStepsNav({ currentStep, labels }: ProgressStepsNavProps) {
  return (
    <nav aria-label={labels[0]} className="mb-8 flex justify-center overflow-x-auto px-2 sm:px-0">
      <div className="flex min-w-max items-start gap-2 sm:gap-5 lg:gap-7">
        {([
          { n: 1, label: labels[0] },
          { n: 2, label: labels[1] },
          { n: 3, label: labels[2] },
          { n: 4, label: labels[3] },
        ] as const).map(({ n: stepNumber, label }) => (
          <div key={stepNumber} className="flex items-start gap-2 sm:gap-3 lg:gap-5">
            <div className="flex w-10 flex-col items-center gap-1.5 sm:w-[6.25rem] sm:gap-2 lg:w-[8.5rem]">
              <div
                aria-current={currentStep === stepNumber ? 'step' : undefined}
                className={`relative h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 sm:h-9 sm:w-9 sm:text-sm lg:h-10 lg:w-10 ${
                  currentStep >= stepNumber
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-2 ring-amber-500/25'
                    : 'bg-bg-surface text-text-muted border border-border'
                }`}
              >
                {currentStep > stepNumber ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : stepNumber}
                {currentStep === stepNumber && (
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-lg animate-pulse" />
                )}
              </div>
              <span className={`hidden min-h-[2.4rem] text-center text-[10px] leading-tight transition-colors sm:block sm:max-w-[6.25rem] lg:min-h-[2.8rem] lg:max-w-[8.5rem] lg:text-[11px] ${
                currentStep >= stepNumber ? 'text-oe-gold font-medium' : 'text-text-muted'
              }`}>{label}</span>
            </div>
            {stepNumber < 4 && (
              <div className={`mt-3 h-0.5 w-6 transition-all duration-700 sm:mt-4 sm:w-10 lg:w-14 ${currentStep > stepNumber ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
export default function ConfiguradorClient() {
  const t = useTranslations('configurator');
  const locale = useLocale() as 'ca' | 'es' | 'en';
  const dateLocale = toIntlLocale(locale);
  const { track } = useAnalytics();
  const fallbackPacks = useMemo(() => getAllPacks(), []);
  const { packs: allPacks } = usePacks({
    locale,
    fallback: fallbackPacks,
  });
  const [step, setStepRaw] = useState(1);
  const setStep = (n: number) => { setStepRaw(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const [config, setConfig] = useState<ConfigState>({
    eventType: null,
    selectedPack: null,
    date: '',
    guests: 50,
    extras: [],
    appliedOffer: null,
  });
  const extrasCatalog = useConfiguratorExtras(locale);
  const [minDate, setMinDate] = useState('');
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountCodeLoading, setDiscountCodeLoading] = useState(false);
  const [discountCodeError, setDiscountCodeError] = useState('');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<AppliedDiscountCode | null>(null);
  const bookedDates = useBookedDates(locale);
  const selectedPack = config.selectedPack;
  const selectedPackId = selectedPack?.id || '';
  const selectedEvent = config.eventType || t('eventFallback');
  const selectedDate = config.date;
  const extrasCount = config.extras.length;
  const isDateBooked = selectedDate ? bookedDates.has(selectedDate) : false;
  const trimmedDiscountCode = discountCodeInput.trim();
  const discountCodeReason = appliedDiscountCode ? t('step3.discountCodeReason', { code: appliedDiscountCode.code }) : '';
  const pricing = useMemo(() => calculatePricingSummary(config, extrasCatalog, appliedDiscountCode, discountCodeReason), [config, extrasCatalog, appliedDiscountCode, discountCodeReason]);
  const closingPricing = useMemo(() => calculateClosingPricing(pricing), [pricing]);
  const earlyBirdDiscount = closingPricing.earlyBirdDiscount;
  const finalPrice = closingPricing.finalPrice;
  const hasExtrasPrice = pricing.extrasPrice > 0;
  const hasPricingDiscount = pricing.discount > 0;

  const updateConfig = (updates: Partial<ConfigState>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const selectEventType = (eventType: EventType) => {
    updateConfig({ eventType });
  };

  const selectPack = (selectedPack: PackDefinition) => {
    updateConfig({ selectedPack });
  };

  const setEventDate = (date: string) => {
    updateConfig({ date });
  };

  const setGuestCount = (guests: number) => {
    updateConfig({ guests });
  };

  const setSelectedExtras = (extras: string[]) => {
    updateConfig({ extras });
  };

  const toggleExtra = (extraId: string, checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      extras: toggleExtraSelection(prev.extras, extraId, checked),
    }));
  };

  // Set minDate on client to avoid hydration mismatch
  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0]);
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
      const packs = getPacksForEventType(allPacks, service);
      const selectedPack = packs.find((pack) => pack.id === packId);

      if (selectedPack) {
        const parsedGuests = guestsParam ? Number.parseInt(guestsParam, 10) : Number.NaN;
        const initialGuests = Number.isFinite(parsedGuests) ? parsedGuests : 50;
        const initialExtras = extrasParam ? extrasParam.split(',').filter(Boolean) : [];

        setConfig({
          eventType: service,
          selectedPack,
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
  }, [allPacks, track]);

  // Scroll al top quan canvies de pas o selecciones pack
  useEffect(() => {
    requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
    });
  }, [step, config.selectedPack, config.eventType]);

  const availableExtras = useMemo(() => {
    if (!config.eventType) return [];
    return filterCompatibleExtras(extrasCatalog, config.eventType);
  }, [extrasCatalog, config.eventType]);
  const hasAvailableExtras = availableExtras.length > 0;
  const hasComboDiscount = extrasCount >= (OFFERS.combo.minExtras || 3);

  useEffect(() => {
    if (!config.eventType) return;

    const filteredExtras = filterUnavailableExtras(config.extras, availableExtras);
    if (filteredExtras.length !== extrasCount) {
      setSelectedExtras(filteredExtras);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableExtras, config.eventType, config.extras]);

  // PAS 1: Tipus d'esdeveniment
  const renderStep1 = () => {
        return (
      <div className="space-y-5">
        <div className="mb-5 text-center">
          <h2 className="mb-2 text-3xl font-display font-black sm:text-4xl bg-gradient-to-r from-white via-amber-100 to-oe-gold bg-clip-text text-transparent">
            {t('step1.title')}
          </h2>
          <p className="text-base text-text-muted sm:text-lg">{t('step1.subtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {EVENT_TYPE_CARDS.map((service) => {
            const minPrice = getMinPriceForEventType(allPacks, service.slug);

            return (
              <button
                key={service.slug}
                aria-pressed={config.eventType === service.slug}
                onClick={() => {
                  selectEventType(service.slug);
                  setStep(2);
                  track('Configurador_Step1_EventType', { type: service.slug });
                }}
                className="group relative overflow-hidden rounded-2xl border-2 border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 text-left transition-all duration-500 hover:border-oe-gold/70 hover:shadow-[0_12px_48px_rgba(245,158,11,0.2),0_0_80px_rgba(245,158,11,0.06)] md:hover:scale-[1.05] hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-oe-gold/0 to-oe-gold/0 group-hover:from-oe-gold/[0.07] group-hover:to-transparent transition-all duration-700 rounded-2xl" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-[linear-gradient(115deg,transparent_30%,rgba(245,158,11,0.06)_45%,rgba(245,158,11,0.14)_50%,rgba(245,158,11,0.06)_55%,transparent_70%)] pointer-events-none" />
                <div className="relative">
                  <div className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110">{service.icon}</div>
                  <h3 className="mb-2 text-[1.9rem] font-bold text-white transition-colors group-hover:text-oe-gold">
                    {t(`step1.eventTypes.${service.slug}`)}
                  </h3>
                  <p className="mb-2 text-xs text-white/40">{t(service.idealKey)}</p>
                  <p className="mb-3 text-lg font-bold text-oe-gold">{t('step1.from')} {minPrice}€</p>
                  <div className="flex items-center text-white/60 group-hover:text-oe-gold text-sm font-semibold transition-colors">
                    {t('step1.viewPacks')} <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
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
    if (!config.eventType) return null;

    const packs = getPacksForEventType(allPacks, config.eventType);
    if (packs.length === 0) return null;

    const serviceName = t(`step1.eventTypes.${config.eventType}`);

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
          <h2 className="text-4xl font-display font-black mb-4 bg-gradient-to-r from-white via-amber-100 to-oe-gold bg-clip-text text-transparent">{serviceName}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {packs.map((pack, packIndex) => {
            const safeFeatures = pack.features || [];
            return (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: packIndex * 0.12, ease: [0.4, 0, 0.2, 1] }}
              className={`relative group p-8 rounded-2xl border-2 transition-all duration-500 transform hover:scale-[1.03] hover:-translate-y-2 flex flex-col ${
                selectedPackId === pack.id
                  ? 'border-oe-gold bg-gradient-to-b from-oe-gold/10 to-transparent shadow-[0_16px_48px_rgba(245,158,11,0.2)]'
                  : pack.popular
                  ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/[0.07] to-transparent ring-1 ring-amber-500/20 md:scale-[1.03]'
                  : 'border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-white/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)]'
              } ${pack.highlight ? 'ring-2 ring-oe-gold/30' : ''}`}
            >
              {/* Shine sweep on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-[linear-gradient(115deg,transparent_30%,rgba(245,158,11,0.06)_45%,rgba(245,158,11,0.12)_50%,rgba(245,158,11,0.06)_55%,transparent_70%)] pointer-events-none" />

              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-black text-xs font-bold whitespace-nowrap shadow-lg shadow-amber-500/25 animate-[pulse_3s_ease-in-out_infinite]">
                  ⭐ {t('step2.mostSold')}
                </div>
              )}
              {pack.highlight && !pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-oe-gold to-amber-400 text-black text-xs font-bold whitespace-nowrap">
                  {t('step2.premium')}
                </div>
              )}

              <div className="text-center mb-5 mt-2">
                <h3 className="text-2xl font-bold text-white mb-1">{pack.name}</h3>
                {pack.tagline && <p className="text-white/50 text-sm">{pack.tagline}</p>}
              </div>
              {pack.ideal && (
                <p className="text-white/40 text-xs mb-4 text-center">👥 {pack.ideal}</p>
              )}

              <div className="text-center mb-6 pb-5 border-b border-white/[0.06]">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{t('step1.from')}</p>
                <div className="text-4xl font-black text-oe-gold mb-1">{pack.price}</div>
                <div className="text-white/50 text-sm">{pack.duration}</div>
              </div>

              <ul className="space-y-2 mb-6">
                {safeFeatures.slice(0, 4).map((feature: string, index: number) => (
                  <li key={`${pack.id}-feature-${index}`} className="flex items-start text-sm text-text-muted">
                    <Check className="w-4 h-4 text-oe-gold mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {safeFeatures.length > 4 && (
                  <li className="text-xs text-oe-gold">+ {safeFeatures.length - 4} {t('step2.moreFeatures')}</li>
                )}
              </ul>

              <button
                onClick={() => {
                  selectPack(pack);
                  setStep(3);
                  track('Configurador_Step2_PackSelected', { pack: pack.id, price: pack.priceValue });
                }}
                className={`relative overflow-hidden w-full py-3.5 rounded-xl font-bold transition-all mt-auto ${
                  pack.popular
                    ? 'bg-amber-500 text-black hover:bg-amber-400 hover:shadow-[0_8px_24px_rgba(245,158,11,0.3)]'
                    : selectedPackId === pack.id
                    ? 'bg-oe-gold text-black'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {selectedPackId === pack.id ? t('step2.selected') : t('step2.select')} →
              </button>
            </motion.div>
          )})}
        </div>
      </div>
    );
  };

  // PAS 3: Detalls i extres
  const renderStep3 = () => {

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
          <h2 className="text-4xl font-display font-black mb-4 bg-gradient-to-r from-white via-amber-100 to-oe-gold bg-clip-text text-transparent">{t('step3.title')}</h2>
        </div>

        {/* Data i assistents */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
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
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-white/10 focus:border-oe-gold focus:ring-1 focus:ring-oe-gold/30 outline-none transition-all"
              min={minDate}
            />
            {selectedDate && isDateBooked && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {t('step3.dateBooked')}
              </p>
            )}
            {selectedDate && !isDateBooked && (
              <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t('step3.dateAvailable')}
              </p>
            )}
            {!selectedDate && (
              <p className="mt-2 text-xs text-text-muted flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t('step3.dateNote')}
              </p>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
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
              onChange={(e) => setGuestCount(Number.parseInt(e.target.value, 10) || 0)}
              min="10"
              max="1000"
              className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-white/10 focus:border-oe-gold focus:ring-1 focus:ring-oe-gold/30 outline-none transition-all"
            />
          </div>
        </div>

        {/* Extras — hidden when none available */}
        {hasAvailableExtras && (
        <div className="p-8 rounded-xl bg-bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-oe-gold" />
              {t('step3.extras')}
            </h3>
            {hasComboDiscount && (
              <span className="text-xs bg-oe-gold/10 text-oe-gold px-3 py-1 rounded-full font-bold border border-oe-gold/30">
                ✨ {t('step3.extrasDiscount')}
              </span>
            )}
          </div>

            <div className="grid md:grid-cols-2 gap-4">
              {availableExtras.map((extra) => (
                <label
                  key={extra.id}
                  htmlFor={`extra-${extra.id}`}
                  className={`relative flex items-start justify-between w-full max-w-full p-4 rounded-xl border-2 cursor-pointer transition-all overflow-hidden min-h-[44px] ${
                    config.extras.includes(extra.id)
                      ? 'border-oe-gold bg-gradient-to-br from-oe-gold/10 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'border-white/10 hover:border-oe-gold/40'
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
                        toggleExtra(extra.id, e.target.checked);
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
                      {extra.name}
                    </div>
                    <div className="text-text-muted text-xs mt-1">
                      {extra.description}
                    </div>
                    <div className="text-oe-gold text-sm font-bold mt-1">
                      {extra.price !== null ? `+${extra.price}€` : t('step3.toConsult')}
                    </div>
                  </div>
                </div>
                {extra.popular && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                    {t('step3.popular')}
                  </span>
                )}
                {extra.premium && (
                  <span className="absolute top-2 right-2 bg-oe-gold/20 text-oe-gold text-xs px-2 py-0.5 rounded-full font-bold border border-oe-gold/30">
                    {t('step3.premiumExtra')}
                  </span>
                )}
                </label>
              ))}
            </div>
        </div>
        )}

        {/* Codi de descompte */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Tag className="w-5 h-5 text-oe-gold" />
            {t('step3.discountCode')}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              aria-label={t('step3.discountCode')}
              value={discountCodeInput}
              onChange={(e) => {
                setDiscountCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setDiscountCodeError('');
              }}
              placeholder={t('step3.discountCodePlaceholder')}
              className="flex-1 px-4 py-3 rounded-xl bg-black/30 text-white border border-white/10 focus:border-oe-gold focus:ring-1 focus:ring-oe-gold/30 outline-none transition-all"
            />
            <button
              type="button"
              onClick={applyDiscountCode}
              disabled={discountCodeLoading || !trimmedDiscountCode}
              aria-busy={discountCodeLoading}
              className="px-5 py-3 rounded-xl bg-oe-gold text-black font-bold disabled:opacity-50 transition-all hover:bg-oe-gold-bright"
            >
              {discountCodeLoading ? t('step3.validatingCode') : t('step3.applyCode')}
            </button>
            {appliedDiscountCode && (
              <button
                type="button"
                onClick={clearDiscountCode}
                className="px-4 py-3 rounded-xl border border-white/10 text-white hover:border-white/20 transition-colors"
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
        <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30">
          <h3 className="text-2xl font-bold text-white mb-6">{t('step3.summary')}</h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-white/60">
              <span>{t('step3.basePrice')}</span>
              <span className="text-white/80 font-medium">{pricing.basePrice}€</span>
            </div>
            {hasExtrasPrice && (
              <div className="flex justify-between text-white/60">
                <span>{t('step3.extrasPrice', { count: extrasCount })}</span>
                <span className="text-white/80 font-medium">{pricing.extrasPrice}€</span>
              </div>
            )}
            {hasPricingDiscount && (
              <div className="flex justify-between text-green-400 font-bold">
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {pricing.discountReason}:
                </span>
                <span>-{pricing.discount}€</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-center">
              <span className="text-xl font-bold text-white">{t('step3.total')}</span>
              <span className="text-5xl font-black text-oe-gold drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">{pricing.total}€</span>
            </div>
          </div>

          <button
            onClick={() => {
              setStep(4);
              track('Configurador_Step3_Continue', { total: pricing.total });
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-lg hover:scale-[1.03] transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-[0_8px_32px_rgba(251,191,36,0.35)] flex items-center justify-center gap-2"
          >
            {t('step3.continue')}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Estat del formulari inline
  const {
    formData,
    sending,
    sent,
    formError,
    turnstileToken,
    updateField,
    clearError,
    setTurnstileToken,
    submitForm,
  } = useConfiguratorLeadForm({
    buildPayload: (leadFormData, token) => ({
      name: leadFormData.name,
      contact: leadFormData.contact,
      event: selectedEvent,
      message: t('requestMessage', { amount: earlyBirdDiscount }),
      packId: selectedPackId,
      packName: selectedPack?.name,
      estimatedPrice: finalPrice,
      eventDate: config.date,
      guests: config.guests,
      extras: getSelectedExtraNames(config.extras, extrasCatalog),
      turnstileToken: token,
    }),
    onSuccess: () => {
      track('Configurador_DirectSubmit_Success', {
        packId: selectedPackId,
        finalPrice,
        discount: earlyBirdDiscount,
      });
    },
    validate: {
      errorName: t('step4.errorName'),
      errorContact: t('step4.errorContact'),
      errorCaptcha: t('step4.errorCaptcha'),
      errorSend: t('step4.errorSend'),
    },
  });

  // 🔥 PAS 4 NOU: oferta de tancament amb formulari inline
  const renderStep4 = () => {
    const priceWithoutDiscount = closingPricing.priceWithoutDiscount;

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-display font-black mb-4 bg-gradient-to-r from-white via-amber-100 to-oe-gold bg-clip-text text-transparent">
            {t('step4.title')}
          </h2>
          <p className="text-xl text-text-muted">
            {t('step4.subtitle', { amount: earlyBirdDiscount })}
          </p>
        </div>

        {/* Resum del preu */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-oe-gold/10 to-oe-gold/5 border border-oe-gold/30">
          <div className="text-center">
            <p className="text-sm text-text-muted mb-2">{t('step4.finalPrice')}</p>
            <p className="text-6xl font-black text-oe-gold mb-2 drop-shadow-[0_0_24px_rgba(245,158,11,0.35)]">{finalPrice}€</p>
            {earlyBirdDiscount > 0 && (
              <p className="text-green-400 text-sm font-medium flex items-center justify-center gap-1">
                <TrendingDown className="w-4 h-4" />
                {t('step4.youSave', { amount: earlyBirdDiscount })}
                <span className="text-text-muted ml-1">({t('step4.normalPrice')}: {priceWithoutDiscount}€)</span>
              </p>
            )}
          </div>
        </div>

        {/* Garantia */}
        <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30 transition-all duration-300 hover:border-green-500/50 hover:shadow-[0_0_24px_rgba(34,197,94,0.08)]">
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

        {/* Formulari inline o missatge d'exit */}
        {sent ? (
          <Step4SuccessCard
            t={t}
            locale={locale}
            config={config}
            extrasCatalog={extrasCatalog}
            pricing={pricing}
            closingPricing={closingPricing}
            clientName={formData.name}
            onDownload={(total) => track('Configurador_DownloadPDF', { total })}
          />
        ) : (
          <Step4LeadForm
            t={t}
            formData={formData}
            formError={formError}
            sending={sending}
            turnstileToken={turnstileToken}
            finalPrice={finalPrice}
            packName={selectedPack?.name}
            onSubmit={submitForm}
            onReviewConfig={() => setStep(3)}
            onNameChange={(value) => updateField('name', value)}
            onContactChange={(value) => updateField('contact', value)}
            onTurnstileSuccess={(token) => {
              setTurnstileToken(token);
              clearError();
            }}
            onTurnstileClear={() => setTurnstileToken(null)}
            onWhatsAppClick={() => track('Configurador_WhatsApp_Fallback', { step: 4, packId: selectedPackId })}
          />
        )}

        {/* Social proof */}
        <div className="text-center pt-6 px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-sm text-text-muted">
            ⭐⭐⭐⭐⭐ <strong className="text-white">{t('step4.satisfactionGuaranteed')}</strong> • {t('step4.responseTime')}
          </p>
        </div>
      </div>
    );
  };

  const ambient = config.eventType ? EVENT_AMBIENTS[config.eventType] : null;
  const showStickyPrice = step >= 2 && config.selectedPack && step < 4;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg-main pb-16 pt-4 sm:pb-20 sm:pt-6">
      {/* NOTE: No particles — project aesthetic is premium-minimal, not atmospheric */}

      {/* Ambient background glow — animated multi-orb system */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute w-[800px] h-[600px] rounded-full blur-[150px] -top-[20%] left-1/2 -translate-x-1/2"
          animate={{
            backgroundColor: ambient ? ambient.glow : 'rgba(245,158,11,0.04)',
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] bottom-[5%] -left-[10%]"
          animate={{
            backgroundColor: ambient ? ambient.glow : 'rgba(245,158,11,0.03)',
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, delay: 4, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] top-[40%] -right-[8%]"
          animate={{
            backgroundColor: ambient ? ambient.glow : 'rgba(245,158,11,0.03)',
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
        />
      </div>
      {ambient && (
        <div className={`fixed inset-0 pointer-events-none transition-all duration-1000 bg-gradient-to-b ${ambient.gradient}`} />
      )}

      {/* Sticky price bar — visible from step 2 onwards */}
      {showStickyPrice && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-oe-gold/20 bg-black/90 backdrop-blur-2xl shadow-[0_-8px_30px_rgba(245,158,11,0.06)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm hidden sm:inline">
                {config.selectedPack?.name}
              </span>
              {config.extras.length > 0 && (
                <span className="text-white/40 text-xs bg-white/5 px-2 py-0.5 rounded-full">
                  +{config.extras.length} extras
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {hasPricingDiscount && (
                <span className="text-white/40 text-sm line-through">
                  {pricing.subtotal}€
                </span>
              )}
              <span className="text-2xl font-black text-oe-gold">
                {pricing.total}€
              </span>
              {step === 3 && (
                <button
                  onClick={() => { setStep(4); track('Configurador_Step3_Continue'); }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-orange-500/25"
                >
                  {t('step3.continue')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProgressStepsNav
          currentStep={step}
          labels={[t('step1.title'), 'Pack', t('step3.title'), t('step4.lastStep')]}
        />

        {/* Steps Content — smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom spacing for sticky bar */}
      {showStickyPrice && <div className="h-16" />}
    </div>
  );
}



























