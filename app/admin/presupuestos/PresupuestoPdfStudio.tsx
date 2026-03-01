'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_SERVICES,
  EXTRAS,
  getPacksByService,
  type ExtraDefinition,
  type PackDefinition,
  type ServiceSlug,
} from '@/app/config/packs-config';
import { generateQuotePDF } from '@/lib/pdf-utils';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '@/lib/pack-i18n';
import { calculateBillableTravelKm, calculateTravelBlocks, calculateTravelCharge, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_EUR, TRAVEL_BLOCK_KM } from '@/lib/services/travelCost';
import { z } from 'zod';

type Locale = 'ca' | 'es' | 'en';

type CustomExtra = {
  id: string;
  name: string;
  price: number;
};

type PricingCatalogState = {
  packNamesBySlug: Record<string, string>;
  extraNamesBySlug: Record<string, string>;
  extraDescriptionsBySlug: Record<string, string>;
};

type StudioProps = {
  initialCustomerId?: string;
  initialCustomerName?: string;
  initialCustomerEmail?: string;
  initialLeadId?: string;
  initialProposalId?: string;
  initialPreferredLocale?: string;
  initialBrandName?: string;
  initialBrandWebsite?: string;
  initialBrandEmail?: string;
  initialBrandPhone?: string;
  initialBrandTagline?: string;
  initialBrandLogoDataUrl?: string;
};

const STUDIO_DRAFT_KEY = 'admin.presupuestos.pdfstudio.draft.v1';
const CUSTOM_PACK_ID = '__custom_pack__';
const OPERATOR_PDF_EXTRA_ID = '__operator_extra_pdf__';

const STUDIO_COPY: Record<Locale, { hours: string; customServiceName: string; customExtraDescription: string; defaultClientName: string; sendQuote: string; sendingQuote: string; noDate: string; noSchedule: string; noLocation: string; clientLabel: string }> = {
  ca: {
    hours: 'hores',
    customServiceName: 'Servei personalitzat',
    customExtraDescription: 'Extra personalitzat',
    defaultClientName: 'Client',
    sendQuote: 'Envia pressupost',
    sendingQuote: 'Enviant...',
    noDate: 'Sense data',
    noSchedule: 'Sense horari',
    noLocation: 'Sense ubicació',
    clientLabel: 'Client',
  },
  es: {
    hours: 'horas',
    customServiceName: 'Servicio personalizado',
    customExtraDescription: 'Extra personalizado',
    defaultClientName: 'Cliente',
    sendQuote: 'Enviar presupuesto',
    sendingQuote: 'Enviando...',
    noDate: 'Sin fecha',
    noSchedule: 'Sin horario',
    noLocation: 'Sin ubicación',
    clientLabel: 'Cliente',
  },
  en: {
    hours: 'hours',
    customServiceName: 'Custom service',
    customExtraDescription: 'Custom extra',
    defaultClientName: 'Client',
    sendQuote: 'Send quote',
    sendingQuote: 'Sending...',
    noDate: 'No date',
    noSchedule: 'No schedule',
    noLocation: 'No location',
    clientLabel: 'Client',
  },
};

function normalizeStudioLocale(value?: string): Locale {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  return 'ca';
}
const quoteStudioSchema = z.object({
  clientName: z.string().trim().min(2, 'Nom del client massa curt'),
  clientEmail: z.string().trim().email("Correu del client no vàlid"),
  guests: z.number().int().min(1, 'Convidats ha de ser minim 1'),
  validityDays: z.number().int().min(1).max(120),
  basePrice: z.number().min(0),
});

const SERVICE_LABEL: Record<ServiceSlug, string> = {
  bodas: 'Bodes',
  fiestas: 'Festes',
  discomovil: 'Discomòbil',
  alquiler: 'Lloguer',
  empresas: 'Empreses',
  produccion: 'Producció',
};

function formatEUR(value: number): string {
  return `${Math.max(0, value).toFixed(2)}€`;
}

function toFeatureLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildPackFromForm(params: {
  source: PackDefinition;
  name: string;
  price: number;
  durationHours: number;
  featuresText: string;
  locale: Locale;
}): PackDefinition {
  const features = toFeatureLines(params.featuresText);
  const duration = Math.max(1, Math.round(params.durationHours));
  return {
    ...params.source,
    name: params.name.trim() || params.source.name,
    priceValue: Math.max(0, params.price),
    price: formatEUR(params.price),
    durationHours: duration,
    duration: `${duration} ${STUDIO_COPY[params.locale].hours}`,
    features: features.length > 0 ? features : params.source.features,
  };
}

const pdfTranslationCache = new Map<string, Map<Locale, string>>();

async function translateBatchForPdf(texts: string[], locale: Locale): Promise<Map<string, string>> {
  const cleaned = texts.map((t) => t.trim()).filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  const result = new Map<string, string>();

  if (unique.length === 0) return result;
  if (locale === 'ca') {
    for (const text of unique) result.set(text, text);
    return result;
  }

  const toFetch: string[] = [];
  for (const original of unique) {
    const cachedByLang = pdfTranslationCache.get(original);
    const cached = cachedByLang?.get(locale);
    if (cached) result.set(original, cached);
    else toFetch.push(original);
  }

  if (toFetch.length === 0) return result;

  try {
    const res = await fetch('/api/admin/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: toFetch,
        targetLanguages: [locale],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      for (const original of toFetch) result.set(original, original);
      return result;
    }

    const translationsByText: Record<string, Record<string, string>> =
      data?.translationsByText || {};

    for (const original of toFetch) {
      const translated = String(translationsByText?.[original]?.[locale] || original);
      let byLang = pdfTranslationCache.get(original);
      if (!byLang) {
        byLang = new Map<Locale, string>();
        pdfTranslationCache.set(original, byLang);
      }
      byLang.set(locale, translated);
      result.set(original, translated);
    }
  } catch {
    for (const original of toFetch) result.set(original, original);
  }

  return result;
}

export default function PresupuestoPdfStudio({
  initialCustomerId = '',
  initialCustomerName = '',
  initialCustomerEmail = '',
  initialLeadId = '',
  initialProposalId = '',
  initialPreferredLocale = 'ca',
  initialBrandName = 'Òrbita Events',
  initialBrandWebsite = 'orbitaevents.com',
  initialBrandEmail = '',
  initialBrandPhone = '',
  initialBrandTagline = 'El teu esdeveniment. El teu estil. La teva nit perfecta.',
  initialBrandLogoDataUrl = '',
}: StudioProps) {
  const [locale, setLocale] = useState<Locale>(normalizeStudioLocale(initialPreferredLocale));
  const studioText = STUDIO_COPY[locale];
  const [eventType, setEventType] = useState<ServiceSlug>('bodas');
  const [packId, setPackId] = useState<string>(() => getPacksByService('bodas')[0]?.id || '');
  const [clientContact, setClientContact] = useState('');
  const [clientName, setClientName] = useState(initialCustomerName || STUDIO_COPY.ca.defaultClientName);
  const [clientEmail, setClientEmail] = useState(initialCustomerEmail || '');
  const [clientPhone, setClientPhone] = useState('');
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [leadId] = useState(initialLeadId);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Array<{ id: string; name: string; email: string; phone?: string }>>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [proposalId, setProposalId] = useState(initialProposalId);
  const [eventDate, setEventDate] = useState('');
  const [eventSchedule, setEventSchedule] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [travelKm, setTravelKm] = useState(0);
  const [distanceMessage, setDistanceMessage] = useState<string | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const lastDistanceDestinationRef = useRef('');
  const [guests, setGuests] = useState(80);
  const [validityDays, setValidityDays] = useState(15);
  const [conditionsText, setConditionsText] = useState(
    `Reserva amb 30% per bloquejar la data.\nPagament final 7 dies abans de l'esdeveniment.\nDesplaçament inclòs fins a ${INCLUDED_TRAVEL_KM} km.`
  );
  const [whyChooseUs, setWhyChooseUs] = useState(
    'Equip tecnic professional, resposta rapida i proposta adaptada perque tot surti perfecte sense complicacions.'
  );
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [customExtras, setCustomExtras] = useState<CustomExtra[]>([]);
  const [customExtraName, setCustomExtraName] = useState('');
  const [customExtraPrice, setCustomExtraPrice] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [brandName, setBrandName] = useState(initialBrandName || 'Òrbita Events');
  const [brandWebsite, setBrandWebsite] = useState(initialBrandWebsite || 'orbitaevents.com');
  const [brandEmail, setBrandEmail] = useState(initialBrandEmail || '');
  const [brandPhone, setBrandPhone] = useState(initialBrandPhone || '');
  const [brandTagline, setBrandTagline] = useState(
    initialBrandTagline || 'El teu esdeveniment. El teu estil. La teva nit perfecta.'
  );
  const [logoDataUrl, setLogoDataUrl] = useState<string>(initialBrandLogoDataUrl || '');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const [autosaveTick, setAutosaveTick] = useState(0);
  const [allowBrandOverride, setAllowBrandOverride] = useState(false);
  const [pricingCatalog, setPricingCatalog] = useState<PricingCatalogState>({
    packNamesBySlug: {},
    extraNamesBySlug: {},
    extraDescriptionsBySlug: {},
  });
  const isCustomerScoped = Boolean(customerId);

  useEffect(() => {
    if (!isCustomerScoped || !draftLoaded) return;
    setLocale(normalizeStudioLocale(initialPreferredLocale));
  }, [isCustomerScoped, initialPreferredLocale, draftLoaded]);

  useEffect(() => {
    if (logoDataUrl) return;

    const candidates = [
      '/img/logosoloplaneta.png',
    ];

    const tryLoadLogo = async () => {
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('Failed to read logo blob'));
            reader.readAsDataURL(blob);
          });
          setLogoDataUrl(dataUrl);
          return;
        } catch {
          // keep trying next candidate
        }
      }
    };

    void tryLoadLogo();
  }, [logoDataUrl]);

  useEffect(() => {
    let cancelled = false;

    const loadPricingCatalog = async () => {
      try {
        const res = await fetch(`/api/admin/pricing?locale=${locale}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || cancelled) return;

        const packNamesBySlug = Object.fromEntries(
          (data?.data?.packs || [])
            .filter((pack: any) => typeof pack?.slug === 'string' && typeof pack?.name === 'string')
            .map((pack: any) => [pack.slug, pack.name.trim()])
        ) as Record<string, string>;

        const extraNamesBySlug = Object.fromEntries(
          (data?.data?.extras || [])
            .filter((extra: any) => typeof extra?.slug === 'string' && typeof extra?.name === 'string')
            .map((extra: any) => [extra.slug, extra.name.trim()])
        ) as Record<string, string>;

        const extraDescriptionsBySlug = Object.fromEntries(
          (data?.data?.extras || [])
            .filter((extra: any) => typeof extra?.slug === 'string' && typeof extra?.description === 'string')
            .map((extra: any) => [extra.slug, String(extra.description || '').trim()])
        ) as Record<string, string>;

        setPricingCatalog({ packNamesBySlug, extraNamesBySlug, extraDescriptionsBySlug });
      } catch {
        // Keep config fallback silently.
      }
    };

    void loadPricingCatalog();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const packs = useMemo(() => {
    return getPacksByService(eventType).map((pack) => ({
      ...pack,
      name:
        pricingCatalog.packNamesBySlug[pack.slug] ||
        resolvePackI18nKey(pack.name, locale),
      tagline: resolvePackI18nKey(pack.tagline, locale),
      emotion: resolvePackI18nKey(pack.emotion || '', locale),
      features: resolvePackI18nFeatures(pack.features, locale),
      badge: resolvePackI18nKey(pack.badge || '', locale) || pack.badge,
    }));
  }, [eventType, locale, pricingCatalog.packNamesBySlug]);

  const selectedPack = useMemo(() => {
    const found = packs.find((pack) => pack.id === packId);
    return found || packs[0];
  }, [packId, packs]);

  const operatorExtraPrice = useMemo(() => {
    if (!selectedPack) return 0;
    const hourlyBase = selectedPack.durationHours > 0
      ? selectedPack.priceValue / selectedPack.durationHours
      : selectedPack.priceValue;
    return Math.max(25, Math.round(hourlyBase * 0.6));
  }, [selectedPack]);

  const [packName, setPackName] = useState(selectedPack?.name || STUDIO_COPY.ca.customServiceName);
  const [basePrice, setBasePrice] = useState(selectedPack?.priceValue || 0);
  const [durationHours, setDurationHours] = useState(selectedPack?.durationHours || 4);
  const [featuresText, setFeaturesText] = useState((selectedPack?.features || []).join('\n'));

  const compatibleExtras = useMemo(() => {
    const catalog = EXTRAS
      .filter((extra) => !extra.compatibleWith || extra.compatibleWith.includes(eventType))
      .map((extra) => ({
        ...extra,
        name:
          pricingCatalog.extraNamesBySlug[extra.id] ||
          resolvePackI18nKey(extra.name, locale),
        description:
          pricingCatalog.extraDescriptionsBySlug[extra.id] ||
          resolvePackI18nKey(extra.description, locale),
      }));
    const operatorExtra: ExtraDefinition = {
      id: OPERATOR_PDF_EXTRA_ID,
      name: 'Operari extra (hora)',
      description: 'Suport operatiu addicional per muntatge i execució',
      price: operatorExtraPrice,
      icon: '👷',
      category: 'other',
      compatibleWith: ALL_SERVICES,
    };
    return [operatorExtra, ...catalog];
  }, [eventType, locale, operatorExtraPrice, pricingCatalog.extraNamesBySlug, pricingCatalog.extraDescriptionsBySlug]);

  const mappedSelectedExtras = useMemo(
    () => compatibleExtras.filter((extra) => selectedExtras.includes(extra.id)),
    [compatibleExtras, selectedExtras]
  );

  const extrasPrice = useMemo(() => {
    const base = mappedSelectedExtras.reduce((sum, extra) => sum + (extra.price || 0), 0);
    const custom = customExtras.reduce((sum, extra) => sum + Math.max(0, extra.price), 0);
    return base + custom;
  }, [mappedSelectedExtras, customExtras]);

  const travelBlocks = useMemo(
    () => calculateTravelBlocks(travelKm, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM),
    [travelKm]
  );
  const billableTravelKm = useMemo(
    () => calculateBillableTravelKm(travelKm, INCLUDED_TRAVEL_KM),
    [travelKm]
  );
  const travelCharge = useMemo(
    () => calculateTravelCharge(travelKm, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM, TRAVEL_BLOCK_EUR),
    [travelKm]
  );

  const total = useMemo(() => {
    return Math.max(0, basePrice + extrasPrice + travelCharge - Math.max(0, discount));
  }, [basePrice, extrasPrice, travelCharge, discount]);

  useEffect(() => {
    const destination = eventLocation.trim();
    if (destination.length < 3) {
      setTravelKm(0);
      setDistanceMessage(null);
      lastDistanceDestinationRef.current = '';
      return;
    }
    if (destination === lastDistanceDestinationRef.current) return;

    const timer = window.setTimeout(async () => {
      setCalculatingDistance(true);
      try {
        const res = await fetch('/api/admin/maps/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'No s’ha pogut calcular la distància');
        const nextKm = Number(data.roundTripKm || 0);
        setTravelKm(nextKm);
        setDistanceMessage(
          `Ruta: ${data.oneWayKm || 0} km anada · ${data.roundTripKm || 0} km anada+tornada`
        );
        lastDistanceDestinationRef.current = destination;
      } catch {
        setTravelKm(0);
        setDistanceMessage('No s’ha pogut calcular la ruta. Cost de desplaçament: 0 €.');
      } finally {
        setCalculatingDistance(false);
      }
    }, 550);

    return () => window.clearTimeout(timer);
  }, [eventLocation]);

  useEffect(() => {
    if (typeof window === 'undefined' || draftLoaded) return;
    try {
      const raw = window.localStorage.getItem(STUDIO_DRAFT_KEY);
      if (!raw) {
        setDraftLoaded(true);
        return;
      }
      const draft = JSON.parse(raw) as Record<string, unknown>;
      if (typeof draft.locale === 'string') setLocale(draft.locale as Locale);
      if (typeof draft.eventType === 'string') setEventType(draft.eventType as ServiceSlug);
      if (typeof draft.packId === 'string') setPackId(draft.packId);
      if (typeof draft.clientContact === 'string') setClientContact(draft.clientContact);
      if (typeof draft.clientName === 'string') setClientName(draft.clientName);
      if (typeof draft.clientEmail === 'string') setClientEmail(draft.clientEmail);
      if (typeof draft.clientPhone === 'string') setClientPhone(draft.clientPhone);
      if (typeof draft.eventDate === 'string') setEventDate(draft.eventDate);
      if (typeof draft.eventSchedule === 'string') setEventSchedule(draft.eventSchedule);
      if (typeof draft.eventLocation === 'string') setEventLocation(draft.eventLocation);
      if (typeof draft.guests === 'number') setGuests(draft.guests);
      if (typeof draft.validityDays === 'number') setValidityDays(draft.validityDays);
      if (typeof draft.conditionsText === 'string') setConditionsText(draft.conditionsText);
      if (typeof draft.whyChooseUs === 'string') setWhyChooseUs(draft.whyChooseUs);
      if (typeof draft.discount === 'number') setDiscount(draft.discount);
      if (typeof draft.discountReason === 'string') setDiscountReason(draft.discountReason);
      if (Array.isArray(draft.selectedExtras)) {
        setSelectedExtras(draft.selectedExtras.filter((id): id is string => typeof id === 'string'));
      }
      if (Array.isArray(draft.customExtras)) {
        setCustomExtras(
          draft.customExtras
            .map((item) => ({
              id: typeof (item as any)?.id === 'string' ? (item as any).id : '',
              name: typeof (item as any)?.name === 'string' ? (item as any).name : '',
              price: Number((item as any)?.price || 0),
            }))
            .filter((item) => item.id && item.name)
        );
      }
      if (typeof draft.packName === 'string') setPackName(draft.packName);
      if (typeof draft.basePrice === 'number') setBasePrice(draft.basePrice);
      if (typeof draft.durationHours === 'number') setDurationHours(draft.durationHours);
      if (typeof draft.featuresText === 'string') setFeaturesText(draft.featuresText);
      if (typeof draft.brandName === 'string') setBrandName(draft.brandName);
      if (typeof draft.brandWebsite === 'string') setBrandWebsite(draft.brandWebsite);
      if (typeof draft.brandEmail === 'string') setBrandEmail(draft.brandEmail);
      if (typeof draft.brandPhone === 'string') setBrandPhone(draft.brandPhone);
      if (typeof draft.brandTagline === 'string') setBrandTagline(draft.brandTagline);
    } catch {
      // Ignore corrupted drafts.
    } finally {
      setDraftLoaded(true);
    }
  }, [draftLoaded]);

  useEffect(() => {
    if (packId === CUSTOM_PACK_ID || !selectedPack) return;
    const looksLikeI18nKey = (value: string) =>
      value.includes('.') && value.split('.').every((part) => part.trim().length > 0);

    const hasI18nInPackName = looksLikeI18nKey(packName.trim());
    const hasI18nInFeatures = toFeatureLines(featuresText).some((line) => looksLikeI18nKey(line));

    if (hasI18nInPackName) setPackName(selectedPack.name);
    if (hasI18nInFeatures) setFeaturesText(selectedPack.features.join('\n'));
  }, [packId, selectedPack, packName, featuresText]);

  useEffect(() => {
    if (typeof window === 'undefined' || !draftLoaded) return;
    const timeout = window.setTimeout(() => {
      const draft = {
        locale,
        eventType,
        packId,
        clientContact,
        clientName,
        clientEmail,
        clientPhone,
        eventDate,
        eventSchedule,
        eventLocation,
        guests,
        validityDays,
        conditionsText,
        whyChooseUs,
        discount,
        discountReason,
        selectedExtras,
        customExtras,
        packName,
        basePrice,
        durationHours,
        featuresText,
        brandName,
        brandWebsite,
        brandEmail,
        brandPhone,
        brandTagline,
      };
      window.localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(draft));
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [
    draftLoaded,
    locale,
    eventType,
    packId,
    clientContact,
    clientName,
    clientEmail,
    clientPhone,
    eventDate,
    eventSchedule,
    eventLocation,
    guests,
    validityDays,
    conditionsText,
    whyChooseUs,
    discount,
    discountReason,
    selectedExtras,
    customExtras,
    packName,
    basePrice,
    durationHours,
    featuresText,
    brandName,
    brandWebsite,
    brandEmail,
    brandPhone,
    brandTagline,
  ]);

  // ─── Customer search autocomplete ───────────────────────────────
  useEffect(() => {
    if (!showCustomerPicker) return;
    const q = customerSearch.trim();
    if (q.length < 2) { setCustomerResults([]); return; }

    const timer = window.setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data?.customers)) {
          setCustomerResults(
            data.customers.map((c: any) => ({
              id: c.id,
              name: c.name || '',
              email: c.email || '',
              phone: c.phone || '',
            }))
          );
        }
      } catch { /* ignore */ }
      finally { setSearchingCustomers(false); }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [customerSearch, showCustomerPicker]);

  function selectCustomer(c: { id: string; name: string; email: string; phone?: string }) {
    setCustomerId(c.id);
    setClientName(c.name);
    setClientEmail(c.email);
    setClientPhone(c.phone || '');
    setShowCustomerPicker(false);
    setCustomerSearch('');
    setCustomerResults([]);
  }

  function clearSelectedCustomer() {
    setCustomerId('');
    setClientName(STUDIO_COPY.ca.defaultClientName);
    setClientEmail('');
    setClientPhone('');
    setClientContact('');
  }

  // ─── Step validation helpers ──────────────────────────────────
  const sectionStatus = useMemo(() => {
    const clientOk = Boolean(customerId) && clientName.trim().length >= 2;
    const clientWarn = !customerId ? 'Selecciona un client de la base de dades' :
      clientName.trim().length < 2 ? 'Nom del client massa curt' : null;

    const eventOk = Boolean(eventDate) && guests > 0;
    const eventWarn = !eventDate ? 'Indica la data de l\'esdeveniment' :
      guests <= 0 ? 'Indica el nombre de convidats' : null;

    const packOk = basePrice > 0 && packName.trim().length > 0;
    const packWarn = basePrice <= 0 ? 'Indica el preu base' :
      !packName.trim() ? 'Indica el nom del pack' : null;

    const brandOk = brandName.trim().length > 0 && brandEmail.trim().includes('@');
    const brandWarn = !brandName.trim() ? 'Indica la marca' :
      !brandEmail.trim().includes('@') ? 'Indica el correu de la marca' : null;

    const allOk = clientOk && eventOk && packOk;

    return { clientOk, clientWarn, eventOk, eventWarn, packOk, packWarn, brandOk, brandWarn, allOk };
  }, [customerId, clientName, eventDate, guests, basePrice, packName, brandName, brandEmail]);

  function reloadPackValues(nextPackId: string, nextService?: ServiceSlug) {
    const service = nextService || eventType;
    const available = getPacksByService(service);
    const found = available.find((pack) => pack.id === nextPackId) || available[0];
    if (!found) return;

    setPackId(found.id);
    setPackName(found.name);
    setBasePrice(found.priceValue);
    setDurationHours(found.durationHours);
    setFeaturesText(found.features.join('\n'));
  }

  function toggleExtra(id: string) {
    setSelectedExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addCustomExtra() {
    const name = customExtraName.trim();
    if (!name) return;
    const price = Math.max(0, Number(customExtraPrice) || 0);
    const item: CustomExtra = {
      id: `custom-${Date.now().toString(36)}`,
      name,
      price,
    };
    setCustomExtras((prev) => [...prev, item]);
    setCustomExtraName('');
    setCustomExtraPrice(0);
  }

  function removeCustomExtra(id: string) {
    setCustomExtras((prev) => prev.filter((extra) => extra.id !== id));
  }

  const buildProposalSnapshot = useCallback(() => {
    return {
      locale,
      eventType,
      packId,
      packName,
      basePrice,
      durationHours,
      features: toFeatureLines(featuresText),
      conditions: toFeatureLines(conditionsText),
      whyChooseUs: whyChooseUs.trim(),
      extras: {
        preset: mappedSelectedExtras.map((extra) => ({
          id: extra.id,
          name: extra.name,
          description: extra.description,
          price: extra.price || 0,
        })),
        custom: customExtras.map((extra) => ({
          id: extra.id,
          name: extra.name,
          price: extra.price,
        })),
      },
      customer: {
        customerId,
        name: clientName.trim(),
        email: clientEmail.trim(),
        phone: clientPhone.trim(),
        contact: clientContact.trim(),
      },
      event: {
        date: eventDate,
        schedule: eventSchedule.trim(),
        location: eventLocation.trim(),
        guests,
      },
      pricing: {
        extrasPrice,
        travelKm,
        travelCharge,
        discount,
        discountReason: discountReason.trim(),
        total,
      },
      brand: {
        brandName,
        brandWebsite,
        brandEmail,
        brandPhone,
        brandTagline,
      },
    };
  }, [
    locale,
    eventType,
    packId,
    packName,
    basePrice,
    durationHours,
    featuresText,
    conditionsText,
    whyChooseUs,
    mappedSelectedExtras,
    customExtras,
    customerId,
    clientName,
    clientEmail,
    clientPhone,
    clientContact,
    eventDate,
    eventSchedule,
    eventLocation,
    guests,
    extrasPrice,
    travelKm,
    travelCharge,
    discount,
    discountReason,
    total,
    brandName,
    brandWebsite,
    brandEmail,
    brandPhone,
    brandTagline,
  ]);

  const saveProposalDraft = useCallback(async (
    status: 'DRAFT' | 'SENT' = 'DRAFT'
  ): Promise<string | null> => {
    if (!customerId || !selectedPack) return null;

    const subtotal = Math.max(0, Number(basePrice) || 0) + extrasPrice + travelCharge;
    const discountSafe = Math.max(0, Number(discount) || 0);
    const vatRate = 21;
    const baseAfterDiscount = Math.max(0, subtotal - discountSafe);
    const vatAmount = baseAfterDiscount * (vatRate / 100);
    const finalTotal = baseAfterDiscount + vatAmount;

    const payload = {
      customerId,
      leadId: leadId || undefined,
      status,
      locale,
      currency: 'EUR',
      validityDays,
      subtotal,
      discount: discountSafe,
      vatRate,
      vatAmount,
      total: finalTotal,
      snapshot: buildProposalSnapshot(),
    };

    const url = proposalId ? `/api/admin/proposals/${proposalId}` : '/api/admin/proposals';
    const method = proposalId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || 'No s’ha pogut guardar el pressupost');
    }
    if (!proposalId && data?.proposal?.id) {
      setProposalId(data.proposal.id);
      return data.proposal.id as string;
    }
    return proposalId || data?.proposal?.id || null;
  }, [
    customerId,
    selectedPack,
    basePrice,
    extrasPrice,
    travelCharge,
    discount,
    locale,
    validityDays,
    buildProposalSnapshot,
    proposalId,
    leadId,
  ]);

  useEffect(() => {
    if (!draftLoaded || !customerId || !selectedPack) return;

    const timeout = window.setTimeout(() => {
      setAutosaving(true);
      void saveProposalDraft('DRAFT')
        .then(() => setAutosaveTick(Date.now()))
        .catch(() => {
          // Keep silent to avoid noisy UI while editing.
        })
        .finally(() => setAutosaving(false));
    }, 750);

    return () => window.clearTimeout(timeout);
  }, [draftLoaded, customerId, selectedPack, saveProposalDraft]);

  async function buildPdf() {
    if (!selectedPack) return null;
    const rawFeatures = toFeatureLines(featuresText);
    const rawConditions = toFeatureLines(conditionsText);
    const rawExtrasNames = [
      ...mappedSelectedExtras.map((extra) => extra.name),
      ...customExtras.map((extra) => extra.name),
    ];
    const batch = await translateBatchForPdf(
      [packName, whyChooseUs, ...rawFeatures, ...rawConditions, ...rawExtrasNames],
      locale
    );

    const translatedPackName = batch.get(packName.trim()) || packName;
    const translatedWhy = batch.get(whyChooseUs.trim()) || whyChooseUs;
    const translatedFeatures = rawFeatures.map((line) => batch.get(line.trim()) || line);
    const translatedConditions = rawConditions.map((line) => batch.get(line.trim()) || line);

    const translatedPresetExtras = mappedSelectedExtras.map((extra) => ({
      ...extra,
      name: batch.get(extra.name.trim()) || extra.name,
    }));
    const translatedCustomExtras = customExtras.map((extra) => ({
      ...extra,
      name: batch.get(extra.name.trim()) || extra.name,
    }));

    const translatedExtrasNames = [
      ...translatedPresetExtras.map((extra) => extra.name),
      ...translatedCustomExtras.map((extra) => extra.name),
    ];

    const translatedExtrasCatalog: ExtraDefinition[] = [
      ...translatedPresetExtras.map((extra) => ({
        id: extra.id,
        name: extra.name,
        description: extra.description || 'Extra',
        price: extra.price || 0,
        icon: extra.icon || '•',
        category: extra.category || 'other',
      })),
      ...translatedCustomExtras.map((extra) => ({
        id: extra.id,
        name: extra.name,
        description: studioText.customExtraDescription,
        price: extra.price,
        icon: '•',
        category: 'other' as const,
      })),
    ];

    const finalPack = buildPackFromForm({
      source: selectedPack,
      name: translatedPackName || packName,
      price: basePrice,
      durationHours,
      featuresText: translatedFeatures.join('\n'),
      locale,
    });

    return generateQuotePDF(
      {
        eventType,
        pack: finalPack,
        date: eventDate || '-',
        eventSchedule: eventSchedule.trim() || undefined,
        eventLocation: eventLocation.trim() || undefined,
        guests: Math.max(0, Number(guests) || 0),
        extras: translatedExtrasNames,
        extrasCatalog: translatedExtrasCatalog,
        basePrice: Math.max(0, Number(basePrice) || 0),
        extrasPrice,
        discount: Math.max(0, Number(discount) || 0),
        discountReason: discountReason.trim(),
        total,
        clientContact: clientContact.trim() || undefined,
        clientName: clientName.trim() || studioText.defaultClientName,
        clientEmail: clientEmail.trim() || '',
        clientPhone: clientPhone.trim() || undefined,
        validityDays,
        conditions: translatedConditions,
        whyChooseUs: translatedWhy.trim() || undefined,
      },
      locale,
      {
        logoDataUrl: logoDataUrl || undefined,
        brandName: brandName.trim() || undefined,
        website: brandWebsite.trim() || undefined,
        contactEmail: brandEmail.trim() || undefined,
        contactPhone: brandPhone.trim() || undefined,
        tagline: brandTagline.trim() || undefined,
      }
    );
  }

  async function downloadPdf() {
    if (!selectedPack) return;
    if (!validateBeforeGenerate(false)) return;
    setGenerating(true);
    setMessage(null);

    try {
      await saveProposalDraft('DRAFT');
      const doc = await buildPdf();
      if (!doc) throw new Error('No s’ha pogut generar el PDF');

      const fileName = `pressupost-${(clientName || 'client').trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      doc.save(fileName);
      setMessage('PDF generat correctament.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No s’ha pogut generar el PDF');
    } finally {
      setGenerating(false);
    }
  }

  async function printPdf() {
    if (!selectedPack) return;
    if (!validateBeforeGenerate(false)) return;
    setGenerating(true);
    setMessage(null);
    try {
      await saveProposalDraft('DRAFT');
      const doc = await buildPdf();
      if (!doc) throw new Error('No s’ha pogut generar el PDF');
      doc.autoPrint();
      const url = doc.output('bloburl');
      window.open(url, '_blank');
      setMessage('PDF preparat per imprimir.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No s’ha pogut preparar la impressio');
    } finally {
      setGenerating(false);
    }
  }

  async function sendQuoteEmail() {
    if (!validateBeforeGenerate(true)) return;
    if (!clientEmail.trim()) {
      setValidationError('Cal indicar email del client per enviar el pressupost.');
      setMessage('Cal indicar email del client per enviar el pressupost.');
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const payloadExtras = [
        ...mappedSelectedExtras.map((extra) => ({
          name: extra.name,
          description: extra.description,
          price: extra.price || 0,
          quantity: 1,
        })),
        ...customExtras.map((extra) => ({
          name: extra.name,
          description: studioText.customExtraDescription,
          price: extra.price,
          quantity: 1,
        })),
      ];
      if (travelCharge > 0) {
        payloadExtras.push({
          name: `Desplaçament (${travelBlocks} trams, ${travelKm.toFixed(1)} km)`,
          description: `${billableTravelKm.toFixed(1)} km extra sobre ${INCLUDED_TRAVEL_KM} km inclosos`,
          price: travelCharge,
          quantity: 1,
        });
      }

      const response = await fetch('/api/admin/emails/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          to: clientEmail.trim(),
          packId: packId || 'custom',
          price: total,
          extras: payloadExtras,
          notes: toFeatureLines(conditionsText).join('\n'),
          customMessage: whyChooseUs.trim(),
          locale,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'No s’ha pogut enviar el pressupost');
      }

      const savedProposalId = await saveProposalDraft('SENT');
      const targetProposalId = savedProposalId || proposalId;
      if (targetProposalId) {
        await fetch(`/api/admin/proposals/${targetProposalId}/send`, { method: 'POST' });
      }

      setMessage(`Pressupost enviat correctament a ${clientEmail.trim()}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error enviant el pressupost');
    } finally {
      setSending(false);
    }
  }

  function onLogoChange(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setLogoDataUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function clearDraft() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STUDIO_DRAFT_KEY);
    setMessage('Esborrany local eliminat.');
  }

  function validateBeforeGenerate(requireEmail = false): boolean {
    if (!customerId) {
      const message = 'Selecciona un client abans de generar o enviar un pressupost.';
      setValidationError(message);
      setMessage(message);
      return false;
    }
    const parsed = quoteStudioSchema.safeParse({
      clientName,
      clientEmail: requireEmail ? clientEmail : clientEmail || 'placeholder@orbitaevents.local',
      guests,
      validityDays,
      basePrice,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message || 'Dades no valides';
      setValidationError(first);
      setMessage(first);
      return false;
    }
    setValidationError(null);
    return true;
  }

  const inputClass =
    'admin-quote-input w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2';

  return (
    <section className="admin-quote-studio grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="admin-quote-studio-form space-y-5 rounded-2xl border p-5">
        {isCustomerScoped && (
          <div className="rounded-xl border px-3 py-2 text-xs">
            Mode client actiu. Aquest pressupost es guarda automàticament a la fitxa del client.
            {autosaving
              ? ' Guardant...'
              : autosaveTick > 0
                ? ' Guardat.'
                : ''}
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <input
                id="brand-override"
                type="checkbox"
                checked={allowBrandOverride}
                onChange={(e) => setAllowBrandOverride(e.target.checked)}
              />
              <label htmlFor="brand-override" className="cursor-pointer">
                Permetre override de marca/logo només per aquest pressupost
              </label>
            </div>
          </div>
        )}
        <div className="rounded-2xl border p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide">Configuració del pressupost</p>
          <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Idioma preferit del client
            <select className={inputClass} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="ca">Català</option>
              <option value="es">Castellà</option>
              <option value="en">Anglès</option>
            </select>
            <span className="mt-1 block text-xs">
              Aquest idioma s&apos;aplica directament al PDF i a l&apos;enviament.
            </span>
          </label>

          <label className="text-sm">
            Tipus d'esdeveniment
            <select
              className={inputClass}
              value={eventType}
              onChange={(e) => {
                const next = e.target.value as ServiceSlug;
                setEventType(next);
                setSelectedExtras([]);
                reloadPackValues('', next);
              }}
            >
              {ALL_SERVICES.map((service) => (
                <option key={service} value={service}>
                  {SERVICE_LABEL[service]}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm md:col-span-2">
            Pack base
            <select
              className={inputClass}
              value={packId}
              onChange={(e) => {
                const nextPackId = e.target.value;
                if (nextPackId === CUSTOM_PACK_ID) {
                  setPackId(CUSTOM_PACK_ID);
                  if (!packName.trim()) setPackName(studioText.customServiceName);
                  return;
                }
                reloadPackValues(nextPackId);
              }}
            >
              <option value={CUSTOM_PACK_ID}>{studioText.customServiceName}</option>
              {packs.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name} ({pack.price})
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs">
              Si tries servei personalitzat, pots definir nom, preu, hores i característiques manualment.
            </span>
          </label>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${sectionStatus.clientOk ? 'border-emerald-500/30' : sectionStatus.clientWarn ? 'border-amber-500/30' : ''}`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide">Client i esdeveniment</p>
              {sectionStatus.clientOk ? (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">OK</span>
              ) : sectionStatus.clientWarn ? (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">{sectionStatus.clientWarn}</span>
              ) : null}
            </div>
            {!isCustomerScoped && (
              <button
                type="button"
                onClick={() => setShowCustomerPicker(!showCustomerPicker)}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/5"
              >
                + Cercar client
              </button>
            )}
            {isCustomerScoped && !initialCustomerId && (
              <button
                type="button"
                onClick={clearSelectedCustomer}
                className="rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
              >
                Canviar client
              </button>
            )}
          </div>

          {/* Customer search dropdown */}
          {showCustomerPicker && (
            <div className="mb-4 rounded-xl border p-3">
              <input
                className={inputClass}
                placeholder="Cerca per nom, email o telèfon..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                autoFocus
              />
              {searchingCustomers && <p className="mt-2 text-xs">Cercant...</p>}
              {customerResults.length > 0 && (
                <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {customerResults
                    .filter((c) => c.id !== customerId)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
                      >
                        <div>
                          <span className="font-medium">{c.name}</span>
                          <span className="ml-2 text-xs opacity-60">{c.email}</span>
                        </div>
                        {c.phone && <span className="text-xs opacity-50">{c.phone}</span>}
                      </button>
                    ))}
                  {customerResults.length > 0 && customerResults.every((c) => c.id === customerId) && (
                    <p className="py-2 text-center text-xs opacity-60">Client ja seleccionat</p>
                  )}
                </div>
              )}
              {customerSearch.trim().length >= 2 && !searchingCustomers && customerResults.length === 0 && (
                <p className="mt-2 text-xs opacity-60">Cap resultat trobat</p>
              )}
            </div>
          )}

          {/* Selected customer badge */}
          {isCustomerScoped && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm">
              <span className="text-emerald-400">&#10003;</span>
              <span className="font-medium">{clientName}</span>
              <span className="text-xs opacity-60">{clientEmail}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Logotip (PNG/JPG)
            <input
              className={inputClass}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onLogoChange(e.target.files?.[0] || null)}
              disabled={isCustomerScoped && !allowBrandOverride}
            />
          </label>
          <label className="text-sm">
            Persona de contacte
            <input
              className={inputClass}
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm">
            Nom del client
            <input
              className={inputClass}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm">
            Correu del client
            <input
              className={inputClass}
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm">
            Telèfon del client
            <input
              className={inputClass}
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <div className="md:col-span-2 mt-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide">Esdeveniment</span>
            {sectionStatus.eventOk ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">OK</span>
            ) : sectionStatus.eventWarn ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">{sectionStatus.eventWarn}</span>
            ) : null}
          </div>
          <label className="text-sm">
            Data de l'esdeveniment
            <input className={inputClass} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </label>
          <label className="text-sm">
            Horari aproximat
            <input
              className={inputClass}
              value={eventSchedule}
              onChange={(e) => setEventSchedule(e.target.value)}
              placeholder="Ex.: 20:00 - 03:00"
            />
          </label>
          <label className="text-sm md:col-span-2">
            Lloc de l&apos;esdeveniment
            <input
              className={inputClass}
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Ex.: Masia Can X, Girona"
            />
            <span className="mt-1 block text-xs">
              {calculatingDistance ? 'Calculant ruta automàticament...' : distanceMessage || 'La ruta es calcula automàticament amb aquesta adreça.'}
            </span>
          </label>
          <label className="text-sm">
            Convidats
            <input className={inputClass} type="number" min={0} value={guests} onChange={(e) => setGuests(Number(e.target.value) || 0)} />
          </label>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${sectionStatus.brandOk ? 'border-emerald-500/30' : sectionStatus.brandWarn ? 'border-amber-500/30' : ''}`}>
          <div className="mb-3 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide">Marca i identitat</p>
            {sectionStatus.brandOk ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">OK</span>
            ) : sectionStatus.brandWarn ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">{sectionStatus.brandWarn}</span>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Marca / Empresa
            <input
              className={inputClass}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              readOnly={isCustomerScoped && !allowBrandOverride}
            />
          </label>
          <label className="text-sm">
            Web de la marca
            <input
              className={inputClass}
              value={brandWebsite}
              onChange={(e) => setBrandWebsite(e.target.value)}
              readOnly={isCustomerScoped && !allowBrandOverride}
            />
          </label>
          <label className="text-sm">
            Correu de la marca
            <input
              className={inputClass}
              value={brandEmail}
              onChange={(e) => setBrandEmail(e.target.value)}
              readOnly={isCustomerScoped && !allowBrandOverride}
            />
          </label>
          <label className="text-sm">
            Telèfon de la marca
            <input
              className={inputClass}
              value={brandPhone}
              onChange={(e) => setBrandPhone(e.target.value)}
              readOnly={isCustomerScoped && !allowBrandOverride}
            />
          </label>
          <label className="text-sm md:col-span-2">
            Eslògan del peu
            <input
              className={inputClass}
              value={brandTagline}
              onChange={(e) => setBrandTagline(e.target.value)}
              readOnly={isCustomerScoped && !allowBrandOverride}
            />
          </label>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${sectionStatus.packOk ? 'border-emerald-500/30' : sectionStatus.packWarn ? 'border-amber-500/30' : ''}`}>
          <div className="mb-3 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide">Pack i condicions</p>
            {sectionStatus.packOk ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">OK</span>
            ) : sectionStatus.packWarn ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">{sectionStatus.packWarn}</span>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            Nom visible del pack
            <input className={inputClass} value={packName} onChange={(e) => setPackName(e.target.value)} />
          </label>
          <label className="text-sm">
            Durada (h)
            <input
              className={inputClass}
              type="number"
              min={1}
              max={24}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value) || 1)}
            />
          </label>
          <label className="text-sm">
            Validesa (dies)
            <input
              className={inputClass}
              type="number"
              min={1}
              max={90}
              value={validityDays}
              onChange={(e) => setValidityDays(Math.max(1, Number(e.target.value) || 15))}
            />
          </label>
          <label className="text-sm">
            Preu base (€)
            <input
              className={inputClass}
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="text-sm">
            Descompte (€)
            <input
              className={inputClass}
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="text-sm">
            Motiu del descompte
            <input className={inputClass} value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} />
          </label>
          <label className="text-sm md:col-span-3">
            Característiques del pack (una per línia)
            <textarea rows={6} className={inputClass} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
          </label>
          <label className="text-sm md:col-span-3">
            Condicions (una per línia)
            <textarea rows={4} className={inputClass} value={conditionsText} onChange={(e) => setConditionsText(e.target.value)} />
          </label>
          <label className="text-sm md:col-span-3">
            Explicació comercial: per què triar-nos
            <textarea rows={3} className={inputClass} value={whyChooseUs} onChange={(e) => setWhyChooseUs(e.target.value)} />
          </label>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Extres del catàleg</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {compatibleExtras.map((extra) => (
              <label key={extra.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(extra.id)}
                  onChange={() => toggleExtra(extra.id)}
                />
                <span className="flex-1">{extra.name}</span>
                <span className="text-xs">
                  {extra.price
                    ? `+${extra.price}€${extra.id === OPERATOR_PDF_EXTRA_ID ? '/h' : ''}`
                    : 'Consultar'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Extres personalitzats</h3>
          <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <input
              className={inputClass}
              placeholder="Nom de l'extra"
              value={customExtraName}
              onChange={(e) => setCustomExtraName(e.target.value)}
            />
            <input
              className={inputClass}
              type="number"
              min={0}
              value={customExtraPrice}
              onChange={(e) => setCustomExtraPrice(Number(e.target.value) || 0)}
            />
            <button
              type="button"
              onClick={addCustomExtra}
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Afegir
            </button>
          </div>

          {customExtras.length > 0 && (
            <div className="space-y-2">
              {customExtras.map((extra) => (
                <div key={extra.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="">{extra.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="">+{extra.price}€</span>
                    <button
                      type="button"
                      onClick={() => removeCustomExtra(extra.id)}
                      className="rounded-md border px-2 py-1 text-xs"
                    >
                      Treure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`admin-quote-actions rounded-xl border p-3 ${sectionStatus.allOk ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
          {sectionStatus.allOk ? (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              <span>&#10003;</span> Tot correcte — el pressupost està llest per generar o enviar.
            </div>
          ) : (
            <div className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              Revisa els camps marcats abans de continuar:
              <ul className="mt-1 list-inside list-disc text-xs">
                {sectionStatus.clientWarn && <li>{sectionStatus.clientWarn}</li>}
                {sectionStatus.eventWarn && <li>{sectionStatus.eventWarn}</li>}
                {sectionStatus.packWarn && <li>{sectionStatus.packWarn}</li>}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={generating || sending || !selectedPack}
            className="admin-quote-action rounded-xl border px-5 py-2.5 text-sm font-semibold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2"
          >
            {generating ? 'Generant PDF...' : 'Descarregar PDF'}
          </button>
          <button
            type="button"
            onClick={printPdf}
            disabled={generating || sending || !selectedPack}
            className="admin-quote-action rounded-xl border px-5 py-2.5 text-sm font-semibold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2"
          >
            {generating ? 'Generant PDF...' : 'Imprimir PDF'}
          </button>
          <button
            type="button"
            onClick={sendQuoteEmail}
            disabled={generating || sending || !selectedPack || !clientEmail.trim()}
            className="admin-quote-action rounded-xl border px-5 py-2.5 text-sm font-semibold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2"
          >
            {sending ? studioText.sendingQuote : studioText.sendQuote}
          </button>
          <button
            type="button"
            onClick={clearDraft}
            className="admin-quote-action rounded-xl border px-4 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2"
          >
            Netejar esborrany
          </button>
          </div>
          {validationError && <p className="mt-2 text-sm text-amber-400">{validationError}</p>}
          {message && (
            <p className={`mt-2 text-sm ${message.includes('correctament') || message.includes('generat') || message.includes('preparat') ? 'text-emerald-400' : 'text-amber-400'}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      <aside className="admin-quote-studio-preview h-fit rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Vista ràpida</h2>
        <p className="mt-1 text-sm">Resum del que sortirà al PDF.</p>

        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-xl border p-3">
            <p className="">Marca</p>
            <p className="font-semibold">{brandName || 'Marca'}</p>
            <p className="">{brandWebsite || '-'}</p>
            <p className="">{brandEmail || '-'} · {brandPhone || '-'}</p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="">{studioText.clientLabel}</p>
            <p className="font-semibold">{clientName || studioText.defaultClientName}</p>
            <p className="">{clientContact || '-'}</p>
            <p className="">{clientEmail || '-'} · {clientPhone || '-'}</p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="">Esdeveniment</p>
            <p className="font-semibold">{SERVICE_LABEL[eventType]}</p>
            <p className="">{eventDate || studioText.noDate} · {guests} convidats</p>
            <p className="">{eventSchedule || studioText.noSchedule} · {eventLocation || studioText.noLocation}</p>
            <p className="">Validesa: {validityDays} dies</p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="">Narrativa comercial</p>
            <p className="line-clamp-3">{whyChooseUs || '-'}</p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="">Pack</p>
            <p className="font-semibold">{packName || selectedPack?.name || '-'}</p>
            <p className="">{durationHours}h</p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="mb-2">Costos</p>
            <div className="flex items-center justify-between">
              <span>Base</span>
              <span>{formatEUR(basePrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Extres</span>
              <span>{formatEUR(extrasPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Desplaçament</span>
              <span>{formatEUR(travelCharge)}</span>
            </div>
            {travelCharge > 0 && (
              <div className="text-xs">
                {travelKm.toFixed(1)} km totals · {billableTravelKm.toFixed(1)} km extra · {travelBlocks} trams
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Descompte</span>
              <span>-{formatEUR(discount)}</span>
            </div>
            <div className="mt-2 border-t pt-2 flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatEUR(total)}</span>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
