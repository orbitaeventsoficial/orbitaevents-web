'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EXTRAS, getPacksByService } from '@/app/config/packs-config';
import { generateQuotePDF, generateContractPDF } from '@/lib/pdf-utils';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '@/lib/pack-i18n';
import { calculateBillableTravelKm, calculateTravelBlocks, calculateTravelCharge, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_EUR, TRAVEL_BLOCK_KM } from '@/lib/services/travelCost';
import { fetchWithCsrf } from '@/lib/csrf';
import SortableList from '@/app/admin/components/SortableList';
import StudioPreview from './StudioPreview';
import {
  type DocMode, type SectionId, type Locale, type CustomExtra,
  type PricingCatalogState, type PricingCatalogPack, type PricingCatalogExtra,
  type PricingCatalogResponse, type StudioProps, type ExtraDefinition, type ServiceSlug,
  SECTION_LABELS, DEFAULT_SECTION_ORDER, STUDIO_DRAFT_KEY, CUSTOM_PACK_ID,
  OPERATOR_PDF_EXTRA_ID, STUDIO_COPY, SERVICE_LABEL, ALL_SERVICES,
  quoteStudioSchema, normalizeStudioLocale, formatEUR, toFeatureLines,
  buildPackFromForm, translateBatchForPdf,
} from './studio-utils';


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
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
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
  const [docMode, setDocMode] = useState<DocMode>('quote');
  // Contract-specific fields
  const [companyLegalName, setCompanyLegalName] = useState('');
  const [companyNIF, setCompanyNIF] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyIBAN, setCompanyIBAN] = useState('');
  const [clientNIF, setClientNIF] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [depositPct, setDepositPct] = useState(30);
  const [depositDueDays, setDepositDueDays] = useState(7);
  const [finalPaymentDays, setFinalPaymentDays] = useState(7);
  const [cancellationPolicy, setCancellationPolicy] = useState(
    'Cancel·lació fins a 30 dies: 100% devolució. 15-30 dies: 50%. Menys de 15 dies: no reemborsable.'
  );
  const [additionalClauses, setAdditionalClauses] = useState('');
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(DEFAULT_SECTION_ORDER);
  const [collapsedSections, setCollapsedSections] = useState<Set<SectionId>>(new Set());
  const toggleCollapse = useCallback((id: SectionId) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
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
          const res = await fetchWithCsrf(url);
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
        } catch (error) {
          console.warn('Failed to load logo candidate:', error);
        }
      }
    };

    void tryLoadLogo();
  }, [logoDataUrl]);

  useEffect(() => {
    let cancelled = false;

    const loadPricingCatalog = async () => {
      try {
        const res = await fetchWithCsrf(`/api/admin/pricing?locale=${locale}`);
        const data: PricingCatalogResponse = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || cancelled) return;

        const packNamesBySlug = Object.fromEntries(
          (data?.data?.packs || [])
            .filter(
              (pack): pack is Required<Pick<PricingCatalogPack, 'slug' | 'name'>> =>
                typeof pack?.slug === 'string' && typeof pack?.name === 'string'
            )
            .map((pack) => [pack.slug, pack.name.trim()])
        ) as Record<string, string>;

        const extraNamesBySlug = Object.fromEntries(
          (data?.data?.extras || [])
            .filter(
              (extra): extra is Required<Pick<PricingCatalogExtra, 'slug' | 'name'>> =>
                typeof extra?.slug === 'string' && typeof extra?.name === 'string'
            )
            .map((extra) => [extra.slug, extra.name.trim()])
        ) as Record<string, string>;

        const extraDescriptionsBySlug = Object.fromEntries(
          (data?.data?.extras || [])
            .filter(
              (extra): extra is Required<Pick<PricingCatalogExtra, 'slug' | 'description'>> =>
                typeof extra?.slug === 'string' && typeof extra?.description === 'string'
            )
            .map((extra) => [extra.slug, String(extra.description || '').trim()])
        ) as Record<string, string>;

        setPricingCatalog({ packNamesBySlug, extraNamesBySlug, extraDescriptionsBySlug });
      } catch (error) {
        console.warn('Error loading pricing catalog:', error);
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
        const res = await fetchWithCsrf('/api/admin/maps/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination }),
        });
        const data: PricingCatalogResponse = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'No s\'ha pogut calcular la distància');
        const nextKm = Number(data.roundTripKm || 0);
        setTravelKm(nextKm);
        setDistanceMessage(
          `Ruta: ${data.oneWayKm || 0} km anada · ${data.roundTripKm || 0} km anada+tornada`
        );
        lastDistanceDestinationRef.current = destination;
      } catch (error) {
        console.error('Error calculating distance:', error);
        setTravelKm(0);
        setDistanceMessage('No s\'ha pogut calcular la ruta. Cost de desplaçament: 0 €.');
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
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item) => ({
              id: typeof item.id === 'string' ? item.id : '',
              name: typeof item.name === 'string' ? item.name : '',
              price: Number(item.price || 0),
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
      if (Array.isArray(draft.sectionOrder)) {
        const valid = (draft.sectionOrder as string[]).filter((id): id is SectionId => id in SECTION_LABELS);
        if (valid.length === DEFAULT_SECTION_ORDER.length) setSectionOrder(valid);
      }
    } catch (error) {
      console.warn('Corrupted local draft, ignoring:', error);
    } finally {
      setDraftLoaded(true);
    }
  }, [draftLoaded]);

  // Load existing proposal from API when opened with proposalId
  useEffect(() => {
    if (!initialProposalId || !draftLoaded) return;
    let cancelled = false;

    async function loadProposal() {
      try {
        const res = await fetchWithCsrf(`/api/admin/proposals/${initialProposalId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const snap = data?.proposal?.snapshot;
        if (!snap || cancelled) return;

        // Restore all state from snapshot
        if (snap.locale) setLocale(snap.locale as Locale);
        if (snap.eventType) setEventType(snap.eventType as ServiceSlug);
        if (snap.packId) setPackId(snap.packId);
        if (snap.packName) setPackName(snap.packName);
        if (typeof snap.basePrice === 'number') setBasePrice(snap.basePrice);
        if (typeof snap.durationHours === 'number') setDurationHours(snap.durationHours);
        if (Array.isArray(snap.features)) setFeaturesText(snap.features.join('\n'));
        if (Array.isArray(snap.conditions)) setConditionsText(snap.conditions.join('\n'));
        if (snap.whyChooseUs) setWhyChooseUs(snap.whyChooseUs);

        // Customer
        if (snap.customer) {
          if (snap.customer.customerId) setCustomerId(snap.customer.customerId);
          if (snap.customer.name) setClientName(snap.customer.name);
          if (snap.customer.email) setClientEmail(snap.customer.email);
          if (snap.customer.phone) setClientPhone(snap.customer.phone);
          if (snap.customer.contact) setClientContact(snap.customer.contact);
        }

        // Event
        if (snap.event) {
          if (snap.event.date) setEventDate(snap.event.date);
          if (snap.event.schedule) setEventSchedule(snap.event.schedule);
          if (snap.event.location) setEventLocation(snap.event.location);
          if (typeof snap.event.guests === 'number') setGuests(snap.event.guests);
        }

        // Pricing
        if (snap.pricing) {
          if (typeof snap.pricing.travelKm === 'number') setTravelKm(snap.pricing.travelKm);
          if (typeof snap.pricing.discount === 'number') setDiscount(snap.pricing.discount);
          if (snap.pricing.discountReason) setDiscountReason(snap.pricing.discountReason);
        }

        // Extras
        if (snap.extras) {
          if (Array.isArray(snap.extras.preset)) {
            setSelectedExtras(snap.extras.preset.map((e: { id: string }) => e.id));
          }
          if (Array.isArray(snap.extras.custom)) {
            setCustomExtras(snap.extras.custom.map((e: { id: string; name: string; price: number }) => ({
              id: e.id, name: e.name, price: e.price,
            })));
          }
        }

        // Brand
        if (snap.brand) {
          if (snap.brand.brandName) setBrandName(snap.brand.brandName);
          if (snap.brand.brandWebsite) setBrandWebsite(snap.brand.brandWebsite);
          if (snap.brand.brandEmail) setBrandEmail(snap.brand.brandEmail);
          if (snap.brand.brandPhone) setBrandPhone(snap.brand.brandPhone);
          if (snap.brand.brandTagline) setBrandTagline(snap.brand.brandTagline);
        }

        // Validity
        if (data.proposal?.validityDays) setValidityDays(data.proposal.validityDays);
      } catch (error) {
        console.error('Error loading proposal:', error);
      }
    }

    void loadProposal();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProposalId, draftLoaded]);

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
        sectionOrder,
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
    sectionOrder,
  ]);

  // ─── Customer search autocomplete ───────────────────────────────
  useEffect(() => {
    if (!showCustomerPicker) return;
    const q = customerSearch.trim();
    if (q.length < 2) { setCustomerResults([]); return; }

    const timer = window.setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await fetchWithCsrf(`/api/admin/customers?q=${encodeURIComponent(q)}&limit=8`, { credentials: 'include' });
        const data: PricingCatalogResponse = await res.json().catch(() => ({}));
        const apiCustomers = Array.isArray(data?.data?.customers)
          ? data.data.customers
          : [];

        if (res.ok && Array.isArray(apiCustomers)) {
          setCustomerResults(
            apiCustomers.map((customer) => ({
              id: customer.id,
              name: customer.name || '',
              email: customer.email || '',
              phone: customer.phone || '',
            }))
          );
        } else {
          setCustomerResults([]);
        }
      } catch (error) { console.error('Error cercant clients:', error); }
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
    const res = await fetchWithCsrf(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || 'No s\'ha pogut desar el pressupost');
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
        .catch((error) => {
          console.warn('Autosave failed:', error);
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
        issueDate: issueDate || undefined,
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

  async function buildContract() {
    if (!selectedPack) return null;
    const subtotal = Math.max(0, basePrice + extrasPrice + travelCharge);
    const discountSafe = Math.max(0, discount);
    const vatRate = 21;
    const base = Math.max(0, subtotal - discountSafe);
    const vatAmount = base * (vatRate / 100);
    const finalTotal = base + vatAmount;
    const depositAmount = finalTotal * (depositPct / 100);
    const eventDateObj = eventDate ? new Date(eventDate) : new Date();
    const now = new Date();

    const contractExtras = [
      ...mappedSelectedExtras.map((e) => ({ name: e.name, price: e.price || 0, quantity: 1 })),
      ...customExtras.map((e) => ({ name: e.name, price: e.price, quantity: 1 })),
    ];
    if (travelCharge > 0) {
      contractExtras.push({ name: `Desplaçament (${travelKm.toFixed(0)} km)`, price: travelCharge, quantity: 1 });
    }

    const depositDue = new Date(now);
    depositDue.setDate(depositDue.getDate() + depositDueDays);
    const finalDue = new Date(eventDateObj);
    finalDue.setDate(finalDue.getDate() - finalPaymentDays);

    return generateContractPDF({
      contractReference: `CTR-${Date.now().toString(36).toUpperCase()}`,
      contractDate: now,
      companyName: brandName.trim() || 'Òrbita Events',
      companyLegalName: companyLegalName.trim() || brandName.trim() || 'Òrbita Events',
      companyNIF: companyNIF.trim(),
      companyAddress: companyAddress.trim(),
      companyIBAN: companyIBAN.trim(),
      companyPhone: brandPhone.trim(),
      companyEmail: brandEmail.trim(),
      clientName: clientName.trim(),
      clientNIF: clientNIF.trim() || undefined,
      clientAddress: clientAddress.trim() || undefined,
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim() || undefined,
      eventType: SERVICE_LABEL[eventType],
      eventDate: eventDateObj,
      eventTime: eventSchedule.trim() || undefined,
      eventLocation: eventLocation.trim(),
      guestCount: guests,
      packName: packName.trim(),
      packPrice: basePrice,
      djHours: durationHours,
      extras: contractExtras.length > 0 ? contractExtras : undefined,
      subtotal,
      discount: discountSafe,
      vatRate,
      vatAmount,
      total: finalTotal,
      depositAmount,
      depositDueDate: depositDue,
      finalPaymentDue: finalDue,
      cancellationPolicy: cancellationPolicy.trim(),
      additionalClauses: additionalClauses.trim() || undefined,
    }, locale, {
      logoDataUrl: logoDataUrl || undefined,
      brandName: brandName.trim() || undefined,
      website: brandWebsite.trim() || undefined,
      contactEmail: brandEmail.trim() || undefined,
      contactPhone: brandPhone.trim() || undefined,
      tagline: brandTagline.trim() || undefined,
    });
  }

  async function downloadPdf() {
    if (!selectedPack) return;
    if (!validateBeforeGenerate(false)) return;
    setGenerating(true);
    setMessage(null);

    try {
      await saveProposalDraft('DRAFT');
      const doc = docMode === 'contract' ? await buildContract() : await buildPdf();
      if (!doc) throw new Error('No s\'ha pogut generar el PDF');

      const prefix = docMode === 'contract' ? 'contracte' : 'pressupost';
      const fileName = `${prefix}-${(clientName || 'client').trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      doc.save(fileName);
      setMessage(`${docMode === 'contract' ? 'Contracte' : 'Pressupost'} generat correctament.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No s\'ha pogut generar el PDF');
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
      const doc = docMode === 'contract' ? await buildContract() : await buildPdf();
      if (!doc) throw new Error('No s\'ha pogut generar el PDF');
      doc.autoPrint();
      const url = doc.output('bloburl');
      window.open(url, '_blank');
      setMessage('PDF preparat per imprimir.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No s\'ha pogut preparar la impressió');
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

      const response = await fetchWithCsrf('/api/admin/emails/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          to: clientEmail.trim(),
          customerName: clientName.trim(),
          customerPhone: clientPhone.trim() || undefined,
          eventType,
          eventDate: eventDate || undefined,
          eventSchedule: eventSchedule.trim() || undefined,
          eventLocation: eventLocation.trim() || undefined,
          guestCount: guests,
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
        throw new Error(data?.error || 'No s\'ha pogut enviar el pressupost');
      }

      const savedProposalId = await saveProposalDraft('SENT');
      const targetProposalId = savedProposalId || proposalId;
      if (targetProposalId) {
        await fetchWithCsrf(`/api/admin/proposals/${targetProposalId}/send`, { method: 'POST' });
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

  function renderSectionContent(sectionId: SectionId) {
    switch (sectionId) {
      case 'config':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Tipus de document
              <select className={inputClass} value={docMode} onChange={(e) => setDocMode(e.target.value as DocMode)}>
                <option value="quote">Pressupost</option>
                <option value="contract">Contracte</option>
              </select>
            </label>
            <label className="text-sm">
              Idioma preferit del client
              <select className={inputClass} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                <option value="ca">Català</option>
                <option value="es">Castellà</option>
                <option value="en">Anglès</option>
              </select>
              <span className="mt-1 block text-xs">Aquest idioma s&apos;aplica directament al PDF i a l&apos;enviament.</span>
            </label>
            <label className="text-sm">
              Tipus d&apos;esdeveniment
              <select className={inputClass} value={eventType} onChange={(e) => { const next = e.target.value as ServiceSlug; setEventType(next); setSelectedExtras([]); reloadPackValues('', next); }}>
                {ALL_SERVICES.map((service) => (<option key={service} value={service}>{SERVICE_LABEL[service]}</option>))}
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              Pack base
              <select className={inputClass} value={packId} onChange={(e) => { const nextPackId = e.target.value; if (nextPackId === CUSTOM_PACK_ID) { setPackId(CUSTOM_PACK_ID); if (!packName.trim()) setPackName(studioText.customServiceName); return; } reloadPackValues(nextPackId); }}>
                <option value={CUSTOM_PACK_ID}>{studioText.customServiceName}</option>
                {packs.map((pack) => (<option key={pack.id} value={pack.id}>{pack.name} ({pack.price})</option>))}
              </select>
              <span className="mt-1 block text-xs">Si tries servei personalitzat, pots definir nom, preu, hores i característiques manualment.</span>
            </label>
          </div>
        );

      case 'client':
        return (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {sectionStatus.clientOk ? (<span className="rounded-full px-2 py-0.5 text-[10px]">OK</span>) : sectionStatus.clientWarn ? (<span className="rounded-full px-2 py-0.5 text-[10px]">{sectionStatus.clientWarn}</span>) : null}
              </div>
              {!isCustomerScoped && (<button type="button" onClick={() => setShowCustomerPicker(!showCustomerPicker)} className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/5">+ Cercar client</button>)}
              {isCustomerScoped && !initialCustomerId && (<button type="button" onClick={clearSelectedCustomer} className="rounded-xl border px-3 py-1.5 text-xs transition-colors hover:bg-white/5">Canviar client</button>)}
            </div>
            {showCustomerPicker && (
              <div className="mb-4 rounded-xl border p-3">
                <input className={inputClass} placeholder="Cerca per nom, email o telèfon..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} autoFocus />
                {searchingCustomers && <p className="mt-2 text-xs">Cercant...</p>}
                {customerResults.length > 0 && (
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {customerResults.filter((c) => c.id !== customerId).map((c) => (
                      <button key={c.id} type="button" onClick={() => selectCustomer(c)} className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors hover:bg-white/5">
                        <div><span className="font-medium">{c.name}</span><span className="ml-2 text-xs opacity-60">{c.email}</span></div>
                        {c.phone && <span className="text-xs opacity-50">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {customerSearch.trim().length >= 2 && !searchingCustomers && customerResults.length === 0 && (<p className="mt-2 text-xs opacity-60">Cap resultat trobat</p>)}
              </div>
            )}
            {isCustomerScoped && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                <span className="">&#10003;</span>
                <span className="font-medium">{clientName}</span>
                <span className="text-xs opacity-60">{clientEmail}</span>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm md:col-span-2">Logotip (PNG/JPG)<input className={inputClass} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onLogoChange(e.target.files?.[0] || null)} disabled={isCustomerScoped && !allowBrandOverride} /></label>
              <label className="text-sm">Persona de contacte<input className={inputClass} value={clientContact} onChange={(e) => setClientContact(e.target.value)} readOnly={isCustomerScoped} /></label>
              <label className="text-sm">Nom del client<input className={inputClass} value={clientName} onChange={(e) => setClientName(e.target.value)} readOnly={isCustomerScoped} /></label>
              <label className="text-sm">Correu del client<input className={inputClass} type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} readOnly={isCustomerScoped} /></label>
              <label className="text-sm">Telèfon del client<input className={inputClass} value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} readOnly={isCustomerScoped} /></label>
              <div className="md:col-span-2 mt-2 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide">Esdeveniment</span>
                {sectionStatus.eventOk ? (<span className="rounded-full px-2 py-0.5 text-[10px]">OK</span>) : sectionStatus.eventWarn ? (<span className="rounded-full px-2 py-0.5 text-[10px]">{sectionStatus.eventWarn}</span>) : null}
              </div>
              <label className="text-sm">Data d&apos;emissió<input className={inputClass} type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></label>
              <label className="text-sm">Data de l&apos;esdeveniment<input className={inputClass} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></label>
              <label className="text-sm">Horari aproximat<input className={inputClass} value={eventSchedule} onChange={(e) => setEventSchedule(e.target.value)} placeholder="Ex.: 20:00 - 03:00" /></label>
              <label className="text-sm md:col-span-2">Lloc de l&apos;esdeveniment<input className={inputClass} value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Ex.: Masia Can X, Girona" /><span className="mt-1 block text-xs">{calculatingDistance ? 'Calculant ruta automàticament...' : distanceMessage || 'La ruta es calcula automàticament amb aquesta adreça.'}</span></label>
              <label className="text-sm">Convidats<input className={inputClass} type="number" min={0} value={guests} onChange={(e) => setGuests(Number(e.target.value) || 0)} /></label>
            </div>
          </>
        );

      case 'brand':
        return (
          <>
            <div className="mb-3 flex items-center gap-2">
              {sectionStatus.brandOk ? (<span className="rounded-full px-2 py-0.5 text-[10px]">OK</span>) : sectionStatus.brandWarn ? (<span className="rounded-full px-2 py-0.5 text-[10px]">{sectionStatus.brandWarn}</span>) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">Marca / Empresa<input className={inputClass} value={brandName} onChange={(e) => setBrandName(e.target.value)} readOnly={isCustomerScoped && !allowBrandOverride} /></label>
              <label className="text-sm">Web de la marca<input className={inputClass} value={brandWebsite} onChange={(e) => setBrandWebsite(e.target.value)} readOnly={isCustomerScoped && !allowBrandOverride} /></label>
              <label className="text-sm">Correu de la marca<input className={inputClass} value={brandEmail} onChange={(e) => setBrandEmail(e.target.value)} readOnly={isCustomerScoped && !allowBrandOverride} /></label>
              <label className="text-sm">Telèfon de la marca<input className={inputClass} value={brandPhone} onChange={(e) => setBrandPhone(e.target.value)} readOnly={isCustomerScoped && !allowBrandOverride} /></label>
              <label className="text-sm md:col-span-2">Eslògan del peu<input className={inputClass} value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} readOnly={isCustomerScoped && !allowBrandOverride} /></label>
            </div>
          </>
        );

      case 'pack':
        return (
          <>
            <div className="mb-3 flex items-center gap-2">
              {sectionStatus.packOk ? (<span className="rounded-full px-2 py-0.5 text-[10px]">OK</span>) : sectionStatus.packWarn ? (<span className="rounded-full px-2 py-0.5 text-[10px]">{sectionStatus.packWarn}</span>) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm md:col-span-2">Nom visible del pack<input className={inputClass} value={packName} onChange={(e) => setPackName(e.target.value)} /></label>
              <label className="text-sm">Durada (h)<input className={inputClass} type="number" min={1} max={24} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value) || 1)} /></label>
              <label className="text-sm">Validesa (dies)<input className={inputClass} type="number" min={1} max={90} value={validityDays} onChange={(e) => setValidityDays(Math.max(1, Number(e.target.value) || 15))} /></label>
              <label className="text-sm">Preu base (€)<input className={inputClass} type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value) || 0))} /></label>
              <label className="text-sm">Descompte (€)<input className={inputClass} type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} /></label>
              <label className="text-sm">Motiu del descompte<input className={inputClass} value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} /></label>
              <label className="text-sm md:col-span-3">Característiques del pack (una per línia)<textarea rows={6} className={inputClass} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} /></label>
              <label className="text-sm md:col-span-3">Condicions (una per línia)<textarea rows={4} className={inputClass} value={conditionsText} onChange={(e) => setConditionsText(e.target.value)} /></label>
              <label className="text-sm md:col-span-3">Explicació comercial: per què triar-nos<textarea rows={3} className={inputClass} value={whyChooseUs} onChange={(e) => setWhyChooseUs(e.target.value)} /></label>
            </div>
          </>
        );

      case 'extras-catalog':
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            {compatibleExtras.map((extra) => (
              <label key={extra.id} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                <input type="checkbox" checked={selectedExtras.includes(extra.id)} onChange={() => toggleExtra(extra.id)} />
                <span className="flex-1">{extra.name}</span>
                <span className="text-xs">{extra.price ? `+${extra.price}€${extra.id === OPERATOR_PDF_EXTRA_ID ? '/h' : ''}` : 'Consultar'}</span>
              </label>
            ))}
          </div>
        );

      case 'extras-custom':
        return (
          <>
            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
              <input className={inputClass} placeholder="Nom de l'extra" value={customExtraName} onChange={(e) => setCustomExtraName(e.target.value)} />
              <input className={inputClass} type="number" min={0} value={customExtraPrice} onChange={(e) => setCustomExtraPrice(Number(e.target.value) || 0)} />
              <button type="button" onClick={addCustomExtra} className="rounded-xl border px-4 py-2 text-sm font-semibold">Afegir</button>
            </div>
            {customExtras.length > 0 && (
              <div className="mt-3 space-y-2">
                {customExtras.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                    <span>{extra.name}</span>
                    <div className="flex items-center gap-3">
                      <span>+{extra.price}€</span>
                      <button type="button" onClick={() => removeCustomExtra(extra.id)} className="rounded-md border px-2 py-1 text-xs">Treure</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );

      case 'contract':
        if (docMode !== 'contract') return <p className="text-xs opacity-50">Selecciona mode &quot;Contracte&quot; a Configuració per activar.</p>;
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">Raó social<input className={inputClass} value={companyLegalName} onChange={(e) => setCompanyLegalName(e.target.value)} placeholder="Nom legal de l'empresa" /></label>
            <label className="text-sm">NIF empresa<input className={inputClass} value={companyNIF} onChange={(e) => setCompanyNIF(e.target.value)} /></label>
            <label className="text-sm md:col-span-2">Adreça fiscal empresa<input className={inputClass} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} /></label>
            <label className="text-sm md:col-span-2">IBAN<input className={inputClass} value={companyIBAN} onChange={(e) => setCompanyIBAN(e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" /></label>
            <label className="text-sm">NIF client<input className={inputClass} value={clientNIF} onChange={(e) => setClientNIF(e.target.value)} /></label>
            <label className="text-sm">Adreça client<input className={inputClass} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} /></label>
            <label className="text-sm">Dipòsit (%)<input className={inputClass} type="number" min={0} max={100} value={depositPct} onChange={(e) => setDepositPct(Number(e.target.value) || 30)} /></label>
            <label className="text-sm">Dies per pagar dipòsit<input className={inputClass} type="number" min={1} value={depositDueDays} onChange={(e) => setDepositDueDays(Number(e.target.value) || 7)} /></label>
            <label className="text-sm">Dies pagament final (abans event)<input className={inputClass} type="number" min={1} value={finalPaymentDays} onChange={(e) => setFinalPaymentDays(Number(e.target.value) || 7)} /></label>
            <label className="text-sm md:col-span-2">Política de cancel·lació<textarea rows={3} className={inputClass} value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} /></label>
            <label className="text-sm md:col-span-2">Clàusules addicionals<textarea rows={3} className={inputClass} value={additionalClauses} onChange={(e) => setAdditionalClauses(e.target.value)} placeholder="Opcional" /></label>
          </div>
        );

      default:
        return null;
    }
  }

  function getSectionBorderTone(sectionId: SectionId): string {
    switch (sectionId) {
      case 'client': return sectionStatus.clientOk ? 'border-emerald-500/30' : sectionStatus.clientWarn ? 'border-amber-500/30' : '';
      case 'brand': return sectionStatus.brandOk ? 'border-emerald-500/30' : sectionStatus.brandWarn ? 'border-amber-500/30' : '';
      case 'pack': return sectionStatus.packOk ? 'border-emerald-500/30' : sectionStatus.packWarn ? 'border-amber-500/30' : '';
      default: return '';
    }
  }

  return (
    <section className="admin-quote-studio grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="admin-quote-studio-form space-y-5 rounded-2xl border p-5">
        {isCustomerScoped && (
          <div className="rounded-xl border px-3 py-2 text-xs">
            Mode client actiu. Aquest pressupost es guarda automàticament a la fitxa del client.
            {autosaving ? ' Desant...' : autosaveTick > 0 ? ' Desat.' : ''}
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <input id="brand-override" type="checkbox" checked={allowBrandOverride} onChange={(e) => setAllowBrandOverride(e.target.checked)} />
              <label htmlFor="brand-override" className="cursor-pointer">Permetre override de marca/logo només per aquest pressupost</label>
            </div>
          </div>
        )}

        <SortableList
          items={sectionOrder}
          keyFn={(id) => id}
          onReorder={(newOrder) => setSectionOrder(newOrder)}
          className="space-y-4"
          placeholderHeight={60}
          renderItem={(sectionId, _idx, { isDragging }) => {
            const isCollapsed = collapsedSections.has(sectionId);
            const borderTone = getSectionBorderTone(sectionId);
            return (
              <div className={`rounded-2xl border p-4 transition-all ${borderTone} ${isDragging ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing select-none">
                  <span className="text-white/20 text-sm" aria-hidden>&#9776;</span>
                  <p className="flex-1 text-xs font-semibold uppercase tracking-wide">{SECTION_LABELS[sectionId]}</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleCollapse(sectionId); }} className="rounded-lg px-2 py-1 text-xs hover:bg-white/5 transition-colors" aria-label={isCollapsed ? 'Expandir secció' : 'Col·lapsar secció'}>
                    {isCollapsed ? '▸' : '▾'}
                  </button>
                </div>
                {!isCollapsed && <div className="mt-3">{renderSectionContent(sectionId)}</div>}
              </div>
            );
          }}
        />

        <div className={`admin-quote-actions rounded-xl border p-3 ${sectionStatus.allOk ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
          {sectionStatus.allOk ? (
            <div className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
              <span>&#10003;</span> Tot correcte — el pressupost està llest per generar o enviar.
            </div>
          ) : (
            <div className="mb-3 rounded-xl px-3 py-2 text-sm">
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
          {validationError && <p className="mt-2 text-sm">{validationError}</p>}
          {message && (
            <p className={`mt-2 text-sm ${message.includes('correctament') || message.includes('generat') || message.includes('preparat') ? 'text-emerald-400' : 'text-amber-400'}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      <StudioPreview
        brandName={brandName}
        brandWebsite={brandWebsite}
        brandEmail={brandEmail}
        brandPhone={brandPhone}
        clientName={clientName}
        clientContact={clientContact}
        clientEmail={clientEmail}
        clientPhone={clientPhone}
        eventType={eventType}
        eventDate={eventDate}
        guests={guests}
        eventSchedule={eventSchedule}
        eventLocation={eventLocation}
        validityDays={validityDays}
        whyChooseUs={whyChooseUs}
        packName={packName}
        selectedPackName={selectedPack?.name}
        durationHours={durationHours}
        basePrice={basePrice}
        extrasPrice={extrasPrice}
        travelCharge={travelCharge}
        travelKm={travelKm}
        billableTravelKm={billableTravelKm}
        travelBlocks={travelBlocks}
        discount={discount}
        total={total}
        locale={locale}
      />
    </section>
  );
}
