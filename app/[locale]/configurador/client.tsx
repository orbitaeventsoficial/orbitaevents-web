"use client";

// app/configurador/client.tsx
import { OFFERS, getAllPacks, type ExtraDefinition, type PackDefinition, type ServiceSlug } from '@/config/packs-config';
import { useState, useEffect, useMemo } from 'react';
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
import { generateQuotePDF } from '@/lib/pdf-utils';
import TurnstileWidget from '@/components/security/TurnstileWidget';
import { toIntlLocale } from '@/lib/constants';
import { getWhatsAppUrl } from '@/config/site-config';

type EventType = 'bodas' | 'discomovil' | 'fiestas' | 'empresas';

const EVENT_TYPE_SERVICE_MAP: Record<EventType, ServiceSlug[]> = {
  bodas: ['bodas'],
  discomovil: ['discomovil'],
  fiestas: ['fiestas'],
  empresas: ['empresas'],
};

const EVENT_TYPE_CARDS: Array<{
  slug: EventType;
  icon: string;
  idealKey: 'step1.idealBodas' | 'step1.idealFiestas' | 'step1.idealDiscomovil' | 'step1.idealEmpresas';
}> = [
  { slug: 'bodas', icon: '💒', idealKey: 'step1.idealBodas' },
  { slug: 'fiestas', icon: '🎉', idealKey: 'step1.idealFiestas' },
  { slug: 'discomovil', icon: '🎵', idealKey: 'step1.idealDiscomovil' },
  { slug: 'empresas', icon: '💼', idealKey: 'step1.idealEmpresas' },
];
// ─── Ambient visual per tipus d'event ─────────────────────────────────────

const EVENT_AMBIENTS: Record<EventType, { glow: string; gradient: string; accent: string; accentBorder: string }> = {
  bodas: { glow: 'rgba(244,63,94,0.08)', gradient: 'from-rose-500/10 via-pink-500/5 to-transparent', accent: 'text-rose-400', accentBorder: 'border-rose-500/30' },
  fiestas: { glow: 'rgba(217,70,239,0.08)', gradient: 'from-purple-500/10 via-fuchsia-500/5 to-transparent', accent: 'text-fuchsia-400', accentBorder: 'border-fuchsia-500/30' },
  discomovil: { glow: 'rgba(34,211,238,0.08)', gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent', accent: 'text-cyan-400', accentBorder: 'border-cyan-500/30' },
  empresas: { glow: 'rgba(59,130,246,0.08)', gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent', accent: 'text-blue-400', accentBorder: 'border-blue-500/30' },
};

function getPacksForEventType(packs: PackDefinition[], eventType: EventType | null): PackDefinition[] {
  if (!eventType) return [];

  const allowedServices = EVENT_TYPE_SERVICE_MAP[eventType];
  const deduped = new Map<string, PackDefinition>();

  for (const pack of packs) {
    if (!allowedServices.includes(pack.service)) continue;
    const key = pack.slug || pack.id;
    if (!deduped.has(key)) {
      deduped.set(key, pack);
    }
  }

  return Array.from(deduped.values());
}

function getMinPriceForEventType(packs: PackDefinition[], eventType: EventType): number {
  const availablePacks = getPacksForEventType(packs, eventType);
  return availablePacks.length > 0 ? Math.min(...availablePacks.map((pack) => pack.priceValue)) : 0;
}
interface ConfigState {
  eventType: EventType | null;
  selectedPack: PackDefinition | null;
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

interface PricingSummary {
  basePrice: number;
  extrasPrice: number;
  subtotal: number;
  discount: number;
  discountReason: string;
  total: number;
}

interface ClosingPricingSummary {
  earlyBirdDiscount: number;
  priceWithoutDiscount: number;
  finalPrice: number;
}

function calculatePricingSummary(
  config: ConfigState,
  extrasCatalog: ExtraDefinition[],
  appliedDiscountCode: AppliedDiscountCode | null,
  discountCodeReason: string
): PricingSummary {
  const basePrice = config.selectedPack?.priceValue || 0;
  const extrasPrice = config.extras.reduce((sum, extraId) => {
    const extra = extrasCatalog.find((candidate) => candidate.id === extraId);
    return sum + (extra?.price || 0);
  }, 0);
  const subtotal = basePrice + extrasPrice;
  const applicableOffers: Array<{ discount: number; reason: string }> = [];

  if (config.appliedOffer === 'early-bird' && subtotal >= (OFFERS.earlyBird.minAmount || 0)) {
    applicableOffers.push({
      discount: Math.round((subtotal * (OFFERS.earlyBird.discount || 0)) / 100),
      reason: OFFERS.earlyBird.name,
    });
  }

  if (config.extras.length >= (OFFERS.combo.minExtras || 3)) {
    applicableOffers.push({
      discount: Math.round((extrasPrice * (OFFERS.combo.discount || 0)) / 100),
      reason: OFFERS.combo.name,
    });
  }

  if (config.date) {
    const eventMonth = new Date(config.date).getMonth() + 1;
    const seasonalMonths: readonly number[] = OFFERS.seasonal.months ?? [];
    if (seasonalMonths.includes(eventMonth)) {
      applicableOffers.push({
        discount: Math.round((subtotal * (OFFERS.seasonal.discount || 0)) / 100),
        reason: OFFERS.seasonal.name,
      });
    }
  }

  if (appliedDiscountCode) {
    const codeDiscount =
      appliedDiscountCode.type === 'PERCENTAGE'
        ? Math.round((subtotal * appliedDiscountCode.value) / 100)
        : Math.round(appliedDiscountCode.value);

    if (codeDiscount > 0) {
      applicableOffers.push({
        discount: codeDiscount,
        reason: discountCodeReason,
      });
    }
  }

  const bestOffer = applicableOffers.sort((a, b) => b.discount - a.discount)[0];
  const discount = bestOffer?.discount || 0;
  const discountReason = bestOffer?.reason || '';

  return {
    basePrice,
    extrasPrice,
    subtotal,
    discount,
    discountReason,
    total: subtotal - discount,
  };
}

function calculateClosingPricing(pricing: PricingSummary): ClosingPricingSummary {
  const potentialEarlyBird = Math.round((pricing.subtotal * (OFFERS.earlyBird.discount || 10)) / 100);
  const earlyBirdDiscount = Math.max(pricing.discount, potentialEarlyBird);

  return {
    earlyBirdDiscount,
    priceWithoutDiscount: pricing.subtotal,
    finalPrice: pricing.subtotal - earlyBirdDiscount,
  };
}

function toggleExtraSelection(selectedExtras: string[], extraId: string, checked: boolean): string[] {
  if (checked) {
    return selectedExtras.includes(extraId) ? selectedExtras : [...selectedExtras, extraId];
  }

  return selectedExtras.filter((id) => id !== extraId);
}

function filterUnavailableExtras(selectedExtras: string[], availableExtras: ExtraDefinition[]): string[] {
  const allowed = new Set(availableExtras.map((extra) => extra.id));
  return selectedExtras.filter((id) => allowed.has(id));
}

function getSelectedExtraNames(extraIds: string[], extrasCatalog: ExtraDefinition[]): string[] {
  return extraIds
    .map((id) => extrasCatalog.find((extra) => extra.id === id)?.name)
    .filter(Boolean) as string[];
}

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
      className="p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/50 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
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
        className="w-full btn-primary sm:text-xl text-lg sm:py-6 py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
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
    <nav aria-label={labels[0]} className="mb-16 flex justify-center">
      <div className="flex items-center gap-2 sm:gap-4">
        {([
          { n: 1, label: labels[0] },
          { n: 2, label: labels[1] },
          { n: 3, label: labels[2] },
          { n: 4, label: labels[3] },
        ] as const).map(({ n: stepNumber, label }) => (
          <div key={stepNumber} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                aria-current={currentStep === stepNumber ? 'step' : undefined}
                className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all ${
                  currentStep >= stepNumber
                    ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]'
                    : 'bg-bg-surface text-text-muted border border-border'
                }`}
              >
                {currentStep > stepNumber ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : stepNumber}
                {currentStep === stepNumber && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 blur-lg" />
                )}
              </div>
              <span className="hidden sm:block text-[10px] text-text-muted max-w-[80px] text-center truncate">{label}</span>
            </div>
            {stepNumber < 4 && (
              <div className={`h-0.5 w-6 sm:w-12 ${currentStep > stepNumber ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' : 'bg-border'}`} />
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
  const [step, setStep] = useState(1);
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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
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
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white mb-4">
            {t('step1.title')}
          </h2>
          <p className="text-xl text-text-muted">{t('step1.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                className="p-8 rounded-2xl bg-bg-surface border-2 border-border hover:border-oe-gold transition-all duration-300 transform hover:scale-105 hover:shadow-oe-gold text-left group"
              >
                <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{service.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-oe-gold transition-colors">
                  {t(`step1.eventTypes.${service.slug}`)}
                </h3>
                <p className="text-white/40 text-xs mb-3">{t(service.idealKey)}</p>
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
          <h2 className="text-4xl font-display font-black text-white mb-4">{serviceName}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {packs.map((pack) => {
            const safeFeatures = pack.features || [];
            return (
            <div
              key={pack.id}
              className={`group p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                selectedPackId === pack.id
                  ? 'border-oe-gold bg-oe-gold/5 shadow-oe-gold'
                  : 'border-border bg-bg-surface hover:border-oe-gold/50 hover:shadow-lg'
              } ${pack.highlight ? 'ring-2 ring-oe-gold/50 shadow-oe-gold-lg' : ''}`}
            >
              {pack.popular && (
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-oe-gold to-amber-400 text-black text-xs font-bold mb-4">
                  {t('step2.mostSold')}
                </div>
              )}
              {pack.highlight && (
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-oe-gold to-amber-400 text-black text-xs font-bold mb-4">
                  {t('step2.premium')}
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">{pack.name}</h3>
              <p className="text-text-muted text-sm mb-2">{pack.tagline}</p>
              {pack.ideal && (
                <p className="text-white/40 text-xs mb-4">{t('step2.recommendedFor')}: {pack.ideal}</p>
              )}

              <div className="mb-6">
                <div className="text-4xl font-black text-oe-gold mb-1">{pack.price}</div>
                <div className="text-text-muted text-sm">{pack.duration}</div>
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
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  selectedPackId === pack.id
                    ? 'bg-oe-gold text-black'
                    : 'bg-bg-main text-white hover:bg-oe-gold hover:text-black'
                }`}
              >
                {selectedPackId === pack.id ? t('step2.selected') : t('step2.select')}
              </button>
            </div>
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
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-main text-white border border-border focus:border-oe-gold outline-none"
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
              onChange={(e) => setGuestCount(Number.parseInt(e.target.value, 10) || 0)}
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
            {hasComboDiscount && (
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
                  className={`relative flex items-start justify-between w-full max-w-full p-4 rounded-lg border-2 cursor-pointer transition-all overflow-hidden min-h-[44px] ${
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
            {!hasAvailableExtras && (
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
              aria-label={t('step3.discountCode')}
              value={discountCodeInput}
              onChange={(e) => {
                setDiscountCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setDiscountCodeError('');
              }}
              placeholder={t('step3.discountCodePlaceholder')}
              className="flex-1 px-4 py-3 rounded-lg bg-bg-main text-white border border-border focus:border-oe-gold outline-none"
            />
            <button
              type="button"
              onClick={applyDiscountCode}
              disabled={discountCodeLoading || !trimmedDiscountCode}
              aria-busy={discountCodeLoading}
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
          <h2 className="text-4xl font-display font-black text-white mb-4">
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
            <p className="text-5xl font-black text-oe-gold mb-2">{finalPrice}€</p>
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
        <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30">
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

        {/* Social proof - usando datos reales del config */}
        <div className="text-center pt-6 border-t border-border">
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
    <div className="relative min-h-screen bg-bg-main py-20 overflow-x-hidden">
      {/* Ambient background glow — changes per event type */}
      {ambient && (
        <>
          <div
            className="fixed inset-0 pointer-events-none transition-all duration-1000 opacity-100"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${ambient.glow}, transparent 60%)` }}
          />
          <div className={`fixed inset-0 pointer-events-none transition-all duration-1000 bg-gradient-to-b ${ambient.gradient}`} />
        </>
      )}

      {/* Sticky price bar — visible from step 2 onwards */}
      {showStickyPrice && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-white/60 text-sm hidden sm:inline">
                {config.selectedPack?.name}
              </span>
              {config.extras.length > 0 && (
                <span className="text-white/40 text-xs">
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
                  className="px-5 py-2 rounded-xl bg-oe-gold text-black font-bold text-sm hover:bg-oe-gold-bright transition-colors"
                >
                  {t('step3.continue')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProgressStepsNav
          currentStep={step}
          labels={[t('step1.title'), 'Pack', t('step3.title'), t('step4.lastStep')]}
        />

        {/* Steps Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Bottom spacing for sticky bar */}
      {showStickyPrice && <div className="h-16" />}
    </div>
  );
}


























