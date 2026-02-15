'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ALL_SERVICES,
  EXTRAS,
  getPacksByService,
  type ExtraDefinition,
  type PackDefinition,
  type ServiceSlug,
} from '@/app/config/packs-config';
import { generateQuotePDF } from '@/lib/pdf-utils';
import { z } from 'zod';

type Locale = 'ca' | 'es' | 'en';

type CustomExtra = {
  id: string;
  name: string;
  price: number;
};

type StudioProps = {
  initialCustomerId?: string;
  initialCustomerName?: string;
  initialCustomerEmail?: string;
  initialLeadId?: string;
  initialProposalId?: string;
};

const STUDIO_DRAFT_KEY = 'admin.presupuestos.pdfstudio.draft.v1';
const quoteStudioSchema = z.object({
  clientName: z.string().trim().min(2, 'Nom del client massa curt'),
  clientEmail: z.string().trim().email('Email del client no valid'),
  guests: z.number().int().min(1, 'Convidats ha de ser minim 1'),
  validityDays: z.number().int().min(1).max(120),
  basePrice: z.number().min(0),
});

const SERVICE_LABEL: Record<ServiceSlug, string> = {
  bodas: 'Bodas',
  fiestas: 'Fiestas',
  discomovil: 'Discomóvil',
  alquiler: 'Alquiler',
  empresas: 'Empresas',
  produccion: 'Producción',
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
}): PackDefinition {
  const features = toFeatureLines(params.featuresText);
  return {
    ...params.source,
    name: params.name.trim() || params.source.name,
    priceValue: Math.max(0, params.price),
    price: formatEUR(params.price),
    durationHours: Math.max(1, Math.round(params.durationHours)),
    duration: `${Math.max(1, Math.round(params.durationHours))} horas`,
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
}: StudioProps) {
  const [locale, setLocale] = useState<Locale>('ca');
  const [eventType, setEventType] = useState<ServiceSlug>('bodas');
  const [packId, setPackId] = useState<string>(() => getPacksByService('bodas')[0]?.id || '');
  const [clientContact, setClientContact] = useState('');
  const [clientName, setClientName] = useState(initialCustomerName || 'Cliente');
  const [clientEmail, setClientEmail] = useState(initialCustomerEmail || '');
  const [clientPhone, setClientPhone] = useState('');
  const [customerId] = useState(initialCustomerId);
  const [leadId] = useState(initialLeadId);
  const [proposalId, setProposalId] = useState(initialProposalId);
  const [eventDate, setEventDate] = useState('');
  const [guests, setGuests] = useState(80);
  const [validityDays, setValidityDays] = useState(15);
  const [conditionsText, setConditionsText] = useState(
    "Reserva amb 30% per bloquejar la data.\nPagament final 7 dies abans de l'esdeveniment.\nDesplacament inclos fins a 50km."
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
  const [brandName, setBrandName] = useState('Orbita Events');
  const [brandWebsite, setBrandWebsite] = useState('orbitaevents.com');
  const [brandEmail, setBrandEmail] = useState('');
  const [brandPhone, setBrandPhone] = useState('');
  const [brandTagline, setBrandTagline] = useState('Tu evento. Tu estilo. Tu noche perfecta.');
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const [autosaveTick, setAutosaveTick] = useState(0);
  const isCustomerScoped = Boolean(customerId);

  const packs = useMemo(() => getPacksByService(eventType), [eventType]);

  const selectedPack = useMemo(() => {
    const found = packs.find((pack) => pack.id === packId);
    return found || packs[0];
  }, [packId, packs]);

  const [packName, setPackName] = useState(selectedPack?.name || 'Pack personalizado');
  const [basePrice, setBasePrice] = useState(selectedPack?.priceValue || 0);
  const [durationHours, setDurationHours] = useState(selectedPack?.durationHours || 4);
  const [featuresText, setFeaturesText] = useState((selectedPack?.features || []).join('\n'));

  const compatibleExtras = useMemo(
    () => EXTRAS.filter((extra) => !extra.compatibleWith || extra.compatibleWith.includes(eventType)),
    [eventType]
  );

  const mappedSelectedExtras = useMemo(
    () => compatibleExtras.filter((extra) => selectedExtras.includes(extra.id)),
    [compatibleExtras, selectedExtras]
  );

  const extrasPrice = useMemo(() => {
    const base = mappedSelectedExtras.reduce((sum, extra) => sum + (extra.price || 0), 0);
    const custom = customExtras.reduce((sum, extra) => sum + Math.max(0, extra.price), 0);
    return base + custom;
  }, [mappedSelectedExtras, customExtras]);

  const total = useMemo(() => {
    return Math.max(0, basePrice + extrasPrice - Math.max(0, discount));
  }, [basePrice, extrasPrice, discount]);

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
  }, [
    draftLoaded,
    customerId,
    selectedPack,
    locale,
    eventType,
    packId,
    packName,
    basePrice,
    durationHours,
    featuresText,
    conditionsText,
    whyChooseUs,
    selectedExtras,
    customExtras,
    discount,
    discountReason,
    clientContact,
    clientName,
    clientEmail,
    clientPhone,
    eventDate,
    guests,
    validityDays,
    total,
    extrasPrice,
    brandName,
    brandWebsite,
    brandEmail,
    brandPhone,
    brandTagline,
  ]);

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

  function buildProposalSnapshot() {
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
        guests,
      },
      pricing: {
        extrasPrice,
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
  }

  async function saveProposalDraft(status: 'DRAFT' | 'SENT' = 'DRAFT'): Promise<string | null> {
    if (!customerId || !selectedPack) return null;

    const subtotal = Math.max(0, Number(basePrice) || 0) + extrasPrice;
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
  }

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
        description: 'Extra personalitzat',
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
    });

    return generateQuotePDF(
      {
        eventType,
        pack: finalPack,
        date: eventDate || '-',
        guests: Math.max(0, Number(guests) || 0),
        extras: translatedExtrasNames,
        extrasCatalog: translatedExtrasCatalog,
        basePrice: Math.max(0, Number(basePrice) || 0),
        extrasPrice,
        discount: Math.max(0, Number(discount) || 0),
        discountReason: discountReason.trim(),
        total,
        clientContact: clientContact.trim() || undefined,
        clientName: clientName.trim() || 'Client',
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

      const fileName = `presupuesto-${(clientName || 'cliente').trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
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
          description: 'Extra personalitzat',
          price: extra.price,
          quantity: 1,
        })),
      ];

      const response = await fetch('/api/admin/emails/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      const message = 'Selecciona un cliente antes de generar o enviar presupuesto.';
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
    'w-full rounded-xl border border-slate-700/60 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/70';

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
        {isCustomerScoped && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
            Modo client actiu. Aquest pressupost es guarda automàticament a la fitxa del client.
            {autosaving
              ? ' Guardant...'
              : autosaveTick > 0
                ? ' Guardat.'
                : ''}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Idioma preferit del client
            <select className={inputClass} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="ca">Català</option>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
            <span className="mt-1 block text-xs text-slate-400">
              Aquest idioma s&apos;aplica directament al PDF i a l&apos;enviament.
            </span>
          </label>

          <label className="text-sm text-slate-300">
            Tipo de evento
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

          <label className="text-sm text-slate-300 md:col-span-2">
            Pack base
            <select className={inputClass} value={packId} onChange={(e) => reloadPackValues(e.target.value)}>
              {packs.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name} ({pack.price})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300 md:col-span-2">
            Logo (PNG/JPG)
            <input
              className={inputClass}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onLogoChange(e.target.files?.[0] || null)}
              disabled={isCustomerScoped}
            />
          </label>
          <label className="text-sm text-slate-300">
            Persona de contacto
            <input
              className={inputClass}
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm text-slate-300">
            Nombre cliente
            <input
              className={inputClass}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm text-slate-300">
            Email cliente
            <input
              className={inputClass}
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm text-slate-300">
            Teléfono cliente
            <input
              className={inputClass}
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm text-slate-300">
            Fecha evento
            <input className={inputClass} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </label>
          <label className="text-sm text-slate-300">
            Invitados
            <input className={inputClass} type="number" min={0} value={guests} onChange={(e) => setGuests(Number(e.target.value) || 0)} />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Marca / Empresa
            <input
              className={inputClass}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm text-slate-300">
            Web marca
            <input
              className={inputClass}
              value={brandWebsite}
              onChange={(e) => setBrandWebsite(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm text-slate-300">
            Email marca
            <input
              className={inputClass}
              value={brandEmail}
              onChange={(e) => setBrandEmail(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm text-slate-300">
            Teléfono marca
            <input
              className={inputClass}
              value={brandPhone}
              onChange={(e) => setBrandPhone(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
          <label className="text-sm text-slate-300 md:col-span-2">
            Tagline footer
            <input
              className={inputClass}
              value={brandTagline}
              onChange={(e) => setBrandTagline(e.target.value)}
              readOnly={isCustomerScoped}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-300 md:col-span-2">
            Nombre visible del pack
            <input className={inputClass} value={packName} onChange={(e) => setPackName(e.target.value)} />
          </label>
          <label className="text-sm text-slate-300">
            Duración (h)
            <input
              className={inputClass}
              type="number"
              min={1}
              max={24}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value) || 1)}
            />
          </label>
          <label className="text-sm text-slate-300">
            Validez (días)
            <input
              className={inputClass}
              type="number"
              min={1}
              max={90}
              value={validityDays}
              onChange={(e) => setValidityDays(Math.max(1, Number(e.target.value) || 15))}
            />
          </label>
          <label className="text-sm text-slate-300">
            Precio base (€)
            <input
              className={inputClass}
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="text-sm text-slate-300">
            Descuento (€)
            <input
              className={inputClass}
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="text-sm text-slate-300">
            Motivo descuento
            <input className={inputClass} value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} />
          </label>
          <label className="text-sm text-slate-300 md:col-span-3">
            Features del pack (una por línea)
            <textarea rows={6} className={inputClass} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
          </label>
          <label className="text-sm text-slate-300 md:col-span-3">
            Condiciones (una por línea)
            <textarea rows={4} className={inputClass} value={conditionsText} onChange={(e) => setConditionsText(e.target.value)} />
          </label>
          <label className="text-sm text-slate-300 md:col-span-3">
            Explicación humanizada: por qué elegirnos
            <textarea rows={3} className={inputClass} value={whyChooseUs} onChange={(e) => setWhyChooseUs(e.target.value)} />
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/40 p-4">
          <h3 className="text-sm font-semibold text-slate-100">Extras del catálogo</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {compatibleExtras.map((extra) => (
              <label key={extra.id} className="flex items-center gap-2 rounded-lg border border-slate-700/40 px-3 py-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(extra.id)}
                  onChange={() => toggleExtra(extra.id)}
                />
                <span className="flex-1">{extra.name}</span>
                <span className="text-xs text-amber-300">{extra.price ? `+${extra.price}€` : 'Consultar'}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-950/40 p-4">
          <h3 className="text-sm font-semibold text-slate-100">Extras personalizados</h3>
          <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <input
              className={inputClass}
              placeholder="Nombre del extra"
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
              className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
            >
              Añadir
            </button>
          </div>

          {customExtras.length > 0 && (
            <div className="space-y-2">
              {customExtras.map((extra) => (
                <div key={extra.id} className="flex items-center justify-between rounded-lg border border-slate-700/40 px-3 py-2 text-sm">
                  <span className="text-slate-200">{extra.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-300">+{extra.price}€</span>
                    <button
                      type="button"
                      onClick={() => removeCustomExtra(extra.id)}
                      className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={generating || sending || !selectedPack}
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-5 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            {generating ? 'Generant PDF...' : 'Descarregar PDF'}
          </button>
          <button
            type="button"
            onClick={printPdf}
            disabled={generating || sending || !selectedPack}
            className="rounded-xl border border-sky-500/40 bg-sky-500/15 px-5 py-2.5 text-sm font-semibold text-sky-200 hover:bg-sky-500/20 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
          >
            {generating ? 'Generant PDF...' : 'Imprimir PDF'}
          </button>
          <button
            type="button"
            onClick={sendQuoteEmail}
            disabled={generating || sending || !selectedPack || !clientEmail.trim()}
            className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
          >
            {sending ? 'Enviant...' : 'Enviar pressupost'}
          </button>
          <button
            type="button"
            onClick={clearDraft}
            className="rounded-xl border border-slate-600/50 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70"
          >
            Netejar esborrany
          </button>
          {validationError && <p className="text-sm text-rose-300">{validationError}</p>}
          {message && <p className="text-sm text-slate-300">{message}</p>}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-slate-100">Vista rápida</h2>
        <p className="mt-1 text-sm text-slate-400">Resumen de lo que saldrá en el PDF.</p>

        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <p className="text-slate-400">Branding</p>
            <p className="font-semibold text-slate-100">{brandName || 'Marca'}</p>
            <p className="text-slate-300">{brandWebsite || '-'}</p>
            <p className="text-slate-300">{brandEmail || '-'} · {brandPhone || '-'}</p>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <p className="text-slate-400">Cliente</p>
            <p className="font-semibold text-slate-100">{clientName || 'Cliente'}</p>
            <p className="text-slate-300">{clientContact || '-'}</p>
            <p className="text-slate-300">{clientEmail || '-'} · {clientPhone || '-'}</p>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <p className="text-slate-400">Evento</p>
            <p className="font-semibold text-slate-100">{SERVICE_LABEL[eventType]}</p>
            <p className="text-slate-300">{eventDate || 'Sin fecha'} · {guests} invitados</p>
            <p className="text-slate-300">Validez: {validityDays} días</p>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <p className="text-slate-400">Narrativa comercial</p>
            <p className="text-slate-200 line-clamp-3">{whyChooseUs || '-'}</p>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <p className="text-slate-400">Pack</p>
            <p className="font-semibold text-slate-100">{packName || selectedPack?.name || '-'}</p>
            <p className="text-slate-300">{durationHours}h</p>
          </div>

          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <p className="text-slate-400 mb-2">Costes</p>
            <div className="flex items-center justify-between text-slate-200">
              <span>Base</span>
              <span>{formatEUR(basePrice)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-200">
              <span>Extras</span>
              <span>{formatEUR(extrasPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-300">
              <span>Descuento</span>
              <span>-{formatEUR(discount)}</span>
            </div>
            <div className="mt-2 border-t border-slate-700 pt-2 flex items-center justify-between text-base font-semibold text-amber-300">
              <span>Total</span>
              <span>{formatEUR(total)}</span>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
