"use client";

// app/configurador/client.tsx
import { EXTRAS, OFFERS, getPacksByService, type ServiceSlug } from '@/config/packs-config';
import { useState, useEffect } from 'react';
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
import { generateQuotePDF } from '@/lib/pdf-utils';
import { fetchWithCsrf } from '@/lib/csrf';
import TurnstileWidget from '@/components/security/TurnstileWidget';

type EventType = 'bodas' | 'discomovil' | 'fiestas' | 'alquiler' | 'empresas';

interface ConfigState {
  eventType: EventType | null;
  selectedPack: any | null;
  date: string;
  guests: number;
  extras: string[];
  appliedOffer: string | null;
}

// Helper per obtenir text traduït de l'extra
function getExtraText(t: ReturnType<typeof useTranslations>, extraId: string, field: 'name' | 'description', fallback: string): string {
  try {
    const key = `extras.${extraId}.${field}`;
    const translated = t(key);
    // Si retorna la clau, usar fallback
    return translated === key ? fallback : translated;
  } catch {
    return fallback;
  }
}

export default function ConfiguradorClient() {
  const t = useTranslations('configurator');
  const tMobile = useTranslations('pages.mobile'); // Per traduccions d'extres
  const locale = useLocale() as 'ca' | 'es' | 'en';
  const { track } = useAnalytics();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ConfigState>({
    eventType: null,
    selectedPack: null,
    date: '',
    guests: 50,
    extras: [],
    appliedOffer: null,
  });
  const [minDate, setMinDate] = useState(''); // Hydration-safe

  // Set minDate on client to avoid hydration mismatch
  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Detectar pack pre-seleccionado desde URL (viene de páginas de servicios)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get('service') as EventType | null;
    const packId = params.get('packId');
    const guestsParam = params.get('guests');
    const extrasParam = params.get('extras');

    if (service && packId) {
      // Cargar el pack seleccionado
      const packs = getPacksByService(service as ServiceSlug);
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

        // Ir directamente al step 3 (detalles)
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
  }, [track]);

  // Scroll to top cuando cambias de paso o seleccionas pack
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, config.selectedPack, config.eventType]);

  // 💰 CÁLCULO DE PRECIO CON DESCUENTOS
  const calculatePricing = () => {
    let basePrice = config.selectedPack?.priceValue || 0;
    let extrasPrice = 0;
    let discount = 0;
    let discountReason = '';

    // Calcular extras
    config.extras.forEach((extraId) => {
      const extra = EXTRAS.find((e) => e.id === extraId);
      if (extra?.price) extrasPrice += extra.price;
    });

    const subtotal = basePrice + extrasPrice;

    // APLICAR DESCUENTOS (prioridad: mayor descuento gana)
    const applicableOffers = [];

    // 1. Early Bird (reserva inmediata)
    if (config.appliedOffer === 'early-bird' && subtotal >= (OFFERS.earlyBird.minAmount || 0)) {
      applicableOffers.push({
        discount: Math.round((subtotal * (OFFERS.earlyBird.discount || 0)) / 100),
        reason: OFFERS.earlyBird.name,
        priority: 1,
      });
    }

    // 2. Combo de extras (3 o más)
    if (config.extras.length >= (OFFERS.combo.minExtras || 3)) {
      applicableOffers.push({
        discount: Math.round((extrasPrice * (OFFERS.combo.discount || 0)) / 100),
        reason: OFFERS.combo.name,
        priority: 2,
      });
    }

    // 3. Temporada baja
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

    // Seleccionar el mejor descuento
    if (applicableOffers.length > 0) {
      const bestOffer = applicableOffers.sort((a, b) => b.discount - a.discount)[0];
      discount = bestOffer.discount;
      discountReason = bestOffer.reason;
    }

    const total = subtotal - discount;

    return { basePrice, extrasPrice, subtotal, discount, discountReason, total };
  };

  // Generar URL del formulario con los datos del configurador (unused pero conservat per referència futura)
  const _getContactUrl = (): string => {
    const pricing = calculatePricing();
    const extrasNames = config.extras
      .map((id) => EXTRAS.find((e) => e.id === id)?.name)
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

  // PASO 1: Tipo de Evento
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
            const packs = getPacksByService(service.slug as ServiceSlug);
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

  // PASO 2: Selección de pack
  const renderStep2 = () => {
    const packs = getPacksByService(config.eventType as ServiceSlug);
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
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`group p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                config.selectedPack?.id === pack.id
                  ? 'border-oe-gold bg-oe-gold/5 shadow-oe-gold'
                  : 'border-border bg-bg-surface hover:border-oe-gold/50 hover:shadow-lg'
              } ${pack.highlight ? 'ring-2 ring-oe-gold/50 shadow-oe-gold-lg' : ''}`}
            >
              {pack.popular && (
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-oe-gold via-yellow-300 to-oe-gold text-black text-xs font-bold mb-4 animate-pulse">
                  ⚡ {t('step2.mostSold')}
                </div>
              )}
              {pack.highlight && (
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-oe-gold via-oe-gold-bright to-oe-gold text-black text-xs font-bold mb-4 shadow-oe-gold animate-pulse">
                  ⭐ {t('step2.premium')}
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">{pack.name}</h3>
              <p className="text-text-muted text-sm mb-4">{pack.tagline}</p>

              <div className="mb-6">
                <div className="text-4xl font-black text-oe-gold mb-1">{pack.price}</div>
                <div className="text-text-muted text-sm">{pack.duration}</div>
              </div>

              <ul className="space-y-2 mb-6">
                {pack.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start text-sm text-text-muted">
                    <Check className="w-4 h-4 text-oe-gold mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {pack.features.length > 4 && (
                  <li className="text-xs text-oe-gold">+ {pack.features.length - 4} {t('step2.moreFeatures')}</li>
                )}
              </ul>

              <button
                onClick={() => {
                  setConfig({ ...config, selectedPack: pack });
                  setStep(3);
                  track('Configurador_Step2_PackSelected', { pack: pack.id, price: pack.priceValue });
                }}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  config.selectedPack?.id === pack.id
                    ? 'bg-oe-gold text-black'
                    : 'bg-bg-main text-white hover:bg-oe-gold hover:text-black'
                }`}
              >
                {config.selectedPack?.id === pack.id ? t('step2.selected') : t('step2.select')}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // PASO 3: Detalles y Extras
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

        {/* Fecha y Asistentes */}
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
              type="date"
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
              type="number"
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
            {EXTRAS
              .filter((extra) => {
                // Si el extra no tiene compatibleWith, está disponible para todos
                if (!extra.compatibleWith) return true;

                // Si no hay pack seleccionado, mostrar todos
                if (!config.selectedPack) return true;

                // Verificar si el pack actual está en la lista de compatibles
                const packService = config.eventType;

                // Si no hay eventType seleccionado, mostrar todos
                if (!packService) return true;

                return extra.compatibleWith.includes(packService);
              })
              .map((extra) => (
              <label
                key={extra.id}
                className={`relative flex items-start justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  config.extras.includes(extra.id)
                    ? 'border-fuchsia-500 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/5 shadow-[0_0_20px_rgba(217,70,239,0.2)]'
                    : 'border-border hover:border-fuchsia-500/50'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
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
                    className="w-5 h-5 mt-0.5"
                  />
                  <div className="flex-1">
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
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {t('step3.popular')}
                  </span>
                )}
                {extra.premium && (
                  <span className="absolute -top-2 -right-2 bg-oe-gold text-white text-xs px-2 py-0.5 rounded-full">
                    {t('step3.premiumExtra')}
                  </span>
                )}
              </label>
            ))}
            {EXTRAS.filter((extra) => {
              if (!extra.compatibleWith) return true;
              if (!config.selectedPack) return true;
              const packService = config.eventType;
              if (!packService) return true;
              return extra.compatibleWith.includes(packService);
            }).length === 0 && (
              <div className="col-span-full text-center py-8 text-white/60">
                {t('step3.noExtras')}
              </div>
            )}
          </div>
        </div>

        {/* Resumen Precio */}
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

  // Estado para el formulario inline
  const [formData, setFormData] = useState({ name: '', contact: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // 🔥 PASO 4 NUEVO: OFERTA DE CIERRE CON FORMULARIO INLINE
  const renderStep4 = () => {
    const pricing = calculatePricing();

    // Calcular el descuento early bird SIEMPRE (sobre subtotal, no sobre total ya descontado)
    // Si ya tiene descuento aplicado, usar el mayor de los dos
    const potentialEarlyBird = Math.round((pricing.subtotal * (OFFERS.earlyBird.discount || 10)) / 100);

    // Usar el descuento mayor entre el existente y el early bird
    const earlyBirdDiscount = Math.max(pricing.discount, potentialEarlyBird);

    // Precio sin ningún descuento (para mostrar "precio normal")
    const priceWithoutDiscount = pricing.subtotal;

    // Precio final con el mejor descuento
    const finalPrice = pricing.subtotal - earlyBirdDiscount;

    // Enviar solicitud directa
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
        setFormError(t('step4.errorCaptcha') || 'Por favor, completa la verificación de seguridad');
        return;
      }

      setSending(true);
      setFormError('');

      try {
        const extrasArray = config.extras
          .map((id) => EXTRAS.find((e) => e.id === id)?.name)
          .filter(Boolean) as string[];

        const response = await fetchWithCsrf('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            contact: formData.contact,
            event: config.eventType || 'evento',
            message: `Solicitud desde configurador. Descuento early bird aplicado: ${earlyBirdDiscount}€`,
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
          throw new Error('Error al enviar la solicitud');
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

        {/* Comparación de precios */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sin oferta */}
          <div className="p-6 rounded-xl bg-bg-surface border border-border opacity-60">
            <div className="text-center">
              <p className="text-text-muted mb-2">{t('step4.laterPrice')}</p>
              <p className="text-3xl font-black text-white line-through">{priceWithoutDiscount}€</p>
              <p className="text-sm text-text-muted mt-2">{t('step4.normalPrice')}</p>
            </div>
          </div>

          {/* Con oferta */}
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

        {/* Urgencia visual */}
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

        {/* Garantía */}
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

        {/* FORMULARIO INLINE O MENSAJE DE ÉXITO */}
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
              onClick={() => {
                const extrasNames = config.extras
                  .map((id) => EXTRAS.find((e) => e.id === id)?.name)
                  .filter(Boolean) as string[];

                const doc = generateQuotePDF({
                  eventType: config.eventType || 'evento',
                  pack: config.selectedPack,
                  date: config.date,
                  guests: config.guests,
                  extras: extrasNames,
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
            {/* Formulario de contacto rápido */}
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
