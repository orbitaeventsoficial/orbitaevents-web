'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_DOSSIER_GENERATOR_COPY } from '@/lib/constants/admin';
import { getEventLabel, toIntlLocale } from '@/lib/constants';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { DJ_EXTRA_HOUR_PRICE, DJ_FIRST_HOUR_PRICE, djPriceForHours, CANDYBAR_INCLUDED_CHILDREN } from '@/lib/constants/orbita-services';
import { buildQuoteLines } from '@/lib/services/quoteLines';
import { MASQUERADE_CHARACTERS, isCharacterProduct } from '@/lib/constants/masquerade-characters';
import { buildDossierHtml, type DossierCopy, type DossierQuoteLine, type DossierTema } from '@/lib/utils/dossier-html-builder';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { DOSSIER_LOCALE_OPTIONS, type DossierLocale } from '@/lib/constants/dossier-locales';
import { useBookingDistance } from '../bookings/useBookingDistance';
import './dossiers.css';

const DJ_FIRST_PRODUCT_ID = 'orbita:dj-primera-hora';

interface Props {
  /** El catàleg i els textos en cada llengua. La tria es fa aquí, no al servidor. */
  catalogs: Record<DossierLocale, { products: AnimacioProduct[]; copy: DossierCopy }>;
  /**
   * La llengua amb què s'obre: la del client si el lead en té, i si no la que
   * porta la base per defecte. A partir d'aquí la decideix qui envia el dossier.
   */
  initialLocale: DossierLocale;
  /** El bolo muntat a la fitxa. Si n'hi ha, el pressupost són aquestes línies. */
  quoteLines?: DossierQuoteLine[];
  logoDataUri?: string;
  leadId?: string;
  initialNom?: string;
  initialEmail?: string;
  initialTelefon?: string;
  initialEmpresa?: string;
  initialEventDesc?: string;
  initialProductIds?: string;
  /** La població del lead. Si n'hi ha, els km es calculen sols. */
  initialEventLocation?: string;
}

type LeadResult = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  eventType: string;
  status: string;
  eventDate: string | null;
  eventLocation: string | null;
};

type CustomerResult = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lifecycleStage?: string | null;
  totalSpent?: number | null;
};

type LeadServiceLineResult = {
  lines?: DossierServiceLine[];
};

type CreateLeadResult = {
  lead?: { id?: string | null };
  customerLink?: { customerId?: string | null };
};

type ExtractedLeadData = {
  name?: string;
  email?: string;
  phone?: string;
  eventDate?: string;
  eventTime?: string;
  eventEndTime?: string;
  eventLocation?: string;
  guestCount?: string;
  message?: string;
};

type ExtractLeadResult = {
  data?: ExtractedLeadData;
  fallback?: boolean;
  fallbackReason?: 'quota' | 'unavailable';
};

type ProductGroupKey = 'orbita' | 'masquerade' | 'tino' | 'altres';

type DossierServiceLine = {
  collaboratorId?: string | null;
  kind?: string | null;
  label?: string | null;
  revenueAmount?: number | null;
  quantity?: number | null;
};

type LeadServiceLinePayload = {
  collaboratorId?: string | null;
  kind: 'DJ' | 'SOUND_TECH' | 'PROVIDER_SERVICE' | 'EQUIPMENT' | 'OTHER';
  label: string;
  revenueAmount?: number | null;
  quantity?: number | null;
  notes?: string | null;
};

function parseInitialProductIds(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function productPriceLabel(product: AnimacioProduct): string | null {
  // El DJ es construeix per hores: primera hora + cada hora addicional (font única).
  if (product.id === DJ_FIRST_PRODUCT_ID) return `des de ${DJ_FIRST_HOUR_PRICE}€ · +${DJ_EXTRA_HOUR_PRICE}€/h`;
  const tierPrice = product.trams?.find((tier) => tier.price !== null)?.price;
  if (typeof tierPrice === 'number') return `des de ${tierPrice}€`;
  const djPrice = product.djOptions?.find((option) => option.price !== null)?.price;
  if (typeof djPrice === 'number') return `des de ${djPrice}€/h`;
  if (typeof product.priceFrom === 'number') return `des de ${product.priceFrom}€`;
  return null;
}

function productPriceValue(product: AnimacioProduct, djHours = 1): number | null {
  // El DJ es construeix per hores (font única `djPriceForHours`): 1a hora + extres.
  if (product.id === DJ_FIRST_PRODUCT_ID) return djPriceForHours(djHours);
  const tierPrice = product.trams?.find((tier) => tier.price !== null)?.price;
  if (typeof tierPrice === 'number') return tierPrice;
  const djPrice = product.djOptions?.find((option) => option.price !== null)?.price;
  if (typeof djPrice === 'number') return djPrice;
  if (typeof product.priceFrom === 'number') return product.priceFrom;
  return null;
}

/** Un producte que es cobra per nen: llavors cal saber quants nens hi ha. */
function esPerNen(product: AnimacioProduct): boolean {
  return /per\s*nen|por\s*ni[ñn]/i.test(product.nom) || product.id.endsWith(':llaminadures-per-nen');
}

function formatEuro(value: number): string {
  return `${value}€`;
}

function productGroupKey(product: AnimacioProduct): ProductGroupKey {
  if (!product.id.startsWith('collab:')) return 'orbita';
  const provider = normalizeProductText(product.sourceProviderName);
  if (provider.includes('tino')) return 'tino';
  if (provider.includes('masquerade') || provider.includes('carlos')) return 'masquerade';
  return 'altres';
}

function productGroupTitle(group: ProductGroupKey): string {
  return ADMIN_DOSSIER_GENERATOR_COPY.catalog.groups[group].title;
}

function productGroupSubtitle(group: ProductGroupKey): string {
  return ADMIN_DOSSIER_GENERATOR_COPY.catalog.groups[group].subtitle;
}

function productBadge(product: AnimacioProduct): string {
  const category = product.categoria ?? '';
  const normalized = normalizeProductText(category);
  if (normalized.includes('infantil')) return 'Infantil';
  if (normalized.includes('adulta')) return 'Adults';
  if (normalized.includes('casament')) return 'Boda';
  if (normalized.includes('lloguer') || normalized.includes('material')) return 'Material';
  if (normalized.includes('dj')) return 'DJ';
  if (normalized.includes('efectes')) return 'Efecte';
  if (normalized.includes('llums')) return 'Llums';
  if (normalized.includes('operativa')) return 'Operari';
  if (normalized === 'extra') return 'Extra';
  return product.id.startsWith('collab:') ? 'Partner' : 'Òrbita';
}

function productToServiceLine(product: AnimacioProduct, djHours = 1, nensPerLinia = 1): LeadServiceLinePayload {
  const revenueAmount = productPriceValue(product, djHours);
  if (product.id === DJ_FIRST_PRODUCT_ID) {
    // Les hores sempre surten escrites: al dossier el client ha de llegir
    // quantes hores de DJ contracta, també quan només n'és una.
    return { kind: 'DJ', label: djHours > 1 ? `DJ · ${djHours} hores` : 'DJ · 1 hora', revenueAmount, quantity: 1 };
  }
  if (product.id === 'orbita:bombolles') {
    return { kind: 'EQUIPMENT', label: 'Màquina de bombolles', revenueAmount, quantity: 1 };
  }
  if (product.id === 'orbita:pont-llums-caps-mobils') {
    return { kind: 'EQUIPMENT', label: 'Pont de llums + caps mòbils', revenueAmount, quantity: 1 };
  }
  if (product.id === 'orbita:operari-extra') {
    return { kind: 'OTHER', label: 'Operari extra', revenueAmount, quantity: 1 };
  }
  if (esPerNen(product)) {
    // Els vint primers ja van dins del candybar: aquí només els que sobren.
    const deMes = Math.max(0, nensPerLinia - CANDYBAR_INCLUDED_CHILDREN);
    return { kind: 'OTHER', label: product.nom, revenueAmount, quantity: deMes };
  }
  const group = productGroupKey(product);
  return {
    collaboratorId: product.sourceProviderId ?? null,
    kind: group === 'tino' ? 'EQUIPMENT' : 'PROVIDER_SERVICE',
    label: product.sourceProviderName ? `${product.nom} · ${product.sourceProviderName}` : product.nom,
    revenueAmount,
    quantity: 1,
    notes: product.sourceProductId ? `Producte de catàleg: ${product.sourceProductId}` : null,
  };
}

function normalizeProductText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[·–—-]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeCustomerText(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeCustomerPhone(value?: string | null): string {
  return (value ?? '').replace(/\D+/g, '');
}

function extractCustomers(payload: { customers?: CustomerResult[]; data?: { customers?: CustomerResult[] } }): CustomerResult[] {
  if (Array.isArray(payload.customers)) return payload.customers;
  if (Array.isArray(payload.data?.customers)) return payload.data.customers;
  return [];
}

function buildEventDescription(data: ExtractedLeadData): string {
  const schedule = data.eventTime && data.eventEndTime
    ? `${data.eventTime}-${data.eventEndTime}`
    : data.eventTime;
  const parts = [
    data.eventDate,
    schedule,
    data.eventLocation,
    data.guestCount ? `${data.guestCount} pax` : null,
  ].filter((part): part is string => Boolean(part?.trim()));
  return parts.join(' · ');
}

function isDjExtraLabel(label: string): boolean {
  return label.includes('dj') &&
    (label.includes('hora addicional') || label.includes('hora extra') || label.includes('extra'));
}

function isDjFirstHourLabel(label: string): boolean {
  return label.includes('dj') &&
    (label.includes('1a hora') || label.includes('primera hora'));
}

/**
 * Deriva el nombre d'hores de DJ d'unes línies de servei. Inverteix el preu
 * canònic (`djPriceForHours`) sobre el revenue total de les línies DJ, de manera
 * que tant «DJ · 3 hores» (1 línia 350€) com «primera hora» + «hora addicional ×2»
 * (150 + 100 + 100) tornin 3 hores. Mínim 1.
 */
function djHoursFromServiceLines(lines: DossierServiceLine[]): number {
  const djRevenue = lines
    .filter((line) => line.kind === 'DJ')
    .reduce((sum, line) => sum + (line.revenueAmount ?? 0) * (line.quantity ?? 1), 0);
  if (djRevenue <= 0) return 1;
  const extras = Math.round((djRevenue - DJ_FIRST_HOUR_PRICE) / DJ_EXTRA_HOUR_PRICE);
  return Math.max(1, 1 + Math.max(0, extras));
}

function productIdsFromServiceLines(lines: DossierServiceLine[], products: AnimacioProduct[], validProductIds: Set<string>): string[] {
  const byName = new Map(products.map((product) => [normalizeProductText(product.nom), product.id]));
  const ids = lines
    .map((line) => {
      const directId = line.collaboratorId
        ? (line.collaboratorId.startsWith('collab:') ? line.collaboratorId : `collab:${line.collaboratorId}`)
        : null;
      if (directId && validProductIds.has(directId)) return directId;

      const normalizedLabel = normalizeProductText(line.label);
      // El DJ és un sol capítol al dossier: tant la primera hora com qualsevol
      // hora extra apunten al producte DJ únic (l'hora extra ja no és un capítol propi).
      if (line.kind === 'DJ' && (isDjExtraLabel(normalizedLabel) || isDjFirstHourLabel(normalizedLabel))) return DJ_FIRST_PRODUCT_ID;
      const exactName = byName.get(normalizedLabel);
      if (exactName) return exactName;

      const candidate = products
        .filter((product) => {
          const normalizedName = normalizeProductText(product.nom);
          return normalizedName && (
            normalizedLabel.startsWith(normalizedName) ||
            normalizedName.startsWith(normalizedLabel)
          );
        })
        .sort((a, b) => normalizeProductText(b.nom).length - normalizeProductText(a.nom).length)[0];
      if (candidate) return candidate.id;

      if (line.kind === 'DJ' && /\bdj\b/.test(normalizedLabel)) {
        return DJ_FIRST_PRODUCT_ID;
      }
      return null;
    })
    .filter((id): id is string => typeof id === 'string' && validProductIds.has(id));

  return Array.from(new Set(ids));
}

export function DossierGeneratorClient({ catalogs, initialLocale, quoteLines, logoDataUri, leadId: initialLeadId, initialNom, initialEmail, initialTelefon, initialEmpresa, initialEventDesc, initialProductIds, initialEventLocation }: Props) {
  /* La llengua en què s'enviarà el dossier. S'obre amb la del client, però qui
     l'envia la pot canviar: el lead pot tenir-la mal desada, o el client pot
     ser una parella de dues llengües. Els tres catàlegs ja són aquí, així que
     canviar-la no recarrega res ni esborra el que s'ha omplert. */
  const [locale, setLocale] = useState<DossierLocale>(initialLocale);
  /* La decoració del document. No toca ni els productes ni els preus: el
     dossier de Halloween és el mateix dossier amb una altra roba. */
  const [tema, setTema] = useState<DossierTema>('general');
  /* Els personatges que van a aquest bolo. Només es demanen quan hi ha un
     servei amb personatge triat: si no, no hi ha res a dir. */
  const [personatges, setPersonatges] = useState<string[]>([]);
  /* Les llaminadures es venen per nen: sense saber quants nens, el preu no és
     cap preu. Vint nens no mengen com seixanta. */
  const [nens, setNens] = useState(20);
  const { products, copy: dossierCopy } = catalogs[locale] ?? catalogs[initialLocale];
  const toast = useToast();
  const validProductIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  const productGroups = useMemo(() => (['orbita', 'masquerade', 'tino', 'altres'] as const)
    .map((group) => ({ group, items: products.filter((product) => productGroupKey(product) === group) }))
    .filter(({ items }) => items.length > 0), [products]);
  const [linkedLeadId, setLinkedLeadId] = useState(initialLeadId ?? '');
  const [nom, setNom] = useState(initialNom ?? '');
  const [empresa, setEmpresa] = useState(initialEmpresa ?? '');
  const [telefon, setTelefon] = useState(initialTelefon ?? '');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [eventDesc, setEventDesc] = useState(initialEventDesc ?? '');
  const [travelKm, setTravelKm] = useState('');
  /* La població del destí. Ve del lead amb què s'obre la pantalla, però si aquí
     dins se'n tria un altre, els km han d'anar al poble del nou: abans només
     mirava el de l'adreça d'entrada i, entrant pel menú, es quedaven buits. */
  const [eventLocation, setEventLocation] = useState(initialEventLocation ?? '');
  /* Les línies del bolo que van al pressupost. Obren amb les del client d'entrada
     i se substitueixen per les del client que es triï aquí dins. */
  const [pressupost, setPressupost] = useState<DossierQuoteLine[]>(quoteLines ?? []);
  /* Si el lead ja diu la població, els km no s'han de teclejar: es calculen amb
     la mateixa ruta que ja fan servir les Reserves. Si algú ja n'ha escrit un,
     no se li toca: mana la persona. */
  const omplirKmSiEstaBuit = useCallback((km: string) => {
    setTravelKm((actual) => (actual.trim() ? actual : km));
  }, []);
  const { calculatingDistance, distanceMessage } = useBookingDistance({
    eventVenue: '',
    eventLocation,
    onDistanceResolved: omplirKmSiEstaBuit,
  });
  const [salutacio, setSalutacio] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(parseInitialProductIds(initialProductIds).filter((id) => validProductIds.has(id))),
  );
  const [djHours, setDjHours] = useState(1);
  const selectedProducts = useMemo(() => products.filter((product) => selectedIds.has(product.id)), [products, selectedIds]);
  // Productes tal com surten al dossier: el DJ porta el preu i la durada de les hores triades.
  const dossierProducts = useMemo(
    () => selectedProducts.map((p) =>
      p.id === DJ_FIRST_PRODUCT_ID
        ? { ...p, priceFrom: djPriceForHours(djHours), durada: `${djHours}h` }
        : p,
    ),
    [selectedProducts, djHours],
  );
  const selectedTotal = selectedProducts.reduce((sum, product) => sum + (productPriceValue(product, djHours) ?? 0), 0);
  const [createLeadOnSave, setCreateLeadOnSave] = useState(false);
  const [sendOnSave, setSendOnSave] = useState(false);
  const [linkedCustomerId, setLinkedCustomerId] = useState('');
  const [linkedCustomerLabel, setLinkedCustomerLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Cercador de leads
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LeadResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [customerConflict, setCustomerConflict] = useState<CustomerResult | null>(null);
  const [receivedText, setReceivedText] = useState('');
  const [extractingText, setExtractingText] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLeadSyncRef = useRef(false);

  const searchLeads = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); setShowResults(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/leads?search=${encodeURIComponent(q)}&limit=8`);
      if (!res.ok) return;
      const data = await res.json() as { leads?: LeadResult[] };
      setSearchResults(data.leads ?? []);
      setShowResults(true);
    } catch (err) {
      console.error('[DossierGenerator] searchLeads error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const loadCustomers = useCallback(async (q: string): Promise<CustomerResult[]> => {
    const res = await fetchWithCsrf(`/api/admin/customers?q=${encodeURIComponent(q)}&limit=8`, { method: 'GET' });
    if (!res.ok) return [];
    const payload = await res.json() as { customers?: CustomerResult[]; data?: { customers?: CustomerResult[] } };
    return extractCustomers(payload);
  }, []);

  const searchCustomers = useCallback(async (q: string) => {
    if (q.length < 2) { setCustomerResults([]); setShowCustomerResults(false); return; }
    setCustomerSearching(true);
    try {
      const customers = await loadCustomers(q);
      setCustomerResults(customers);
      setShowCustomerResults(true);
    } catch (err) {
      console.error('[DossierGenerator] searchCustomers error:', err);
    } finally {
      setCustomerSearching(false);
    }
  }, [loadCustomers]);

  const findExistingCustomerMatchFor = useCallback(async (contact: { email?: string | null; phone?: string | null; name?: string | null }): Promise<CustomerResult | null> => {
    const emailKey = normalizeCustomerText(contact.email);
    const phoneKey = normalizeCustomerPhone(contact.phone);
    const queries = Array.from(new Set([emailKey, phoneKey, contact.name?.trim() ?? ''].filter((value) => value.length >= 2)));
    const candidates = new Map<string, CustomerResult>();
    for (const query of queries) {
      const matches = await loadCustomers(query);
      matches.forEach((customer) => candidates.set(customer.id, customer));
    }
    const all = Array.from(candidates.values());
    return all.find((customer) => emailKey && normalizeCustomerText(customer.email) === emailKey)
      ?? all.find((customer) => phoneKey && normalizeCustomerPhone(customer.phone) === phoneKey)
      ?? null;
  }, [loadCustomers]);

  const findExistingCustomerMatch = useCallback(async (): Promise<CustomerResult | null> => (
    findExistingCustomerMatchFor({ email, phone: telefon, name: nom })
  ), [email, findExistingCustomerMatchFor, nom, telefon]);

  const syncProductsFromLead = useCallback(async (leadId: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/service-lines`);
      if (!res.ok) return;
      const data = await res.json() as LeadServiceLineResult;
      const lines = data.lines ?? [];
      const ids = productIdsFromServiceLines(lines, products, validProductIds);
      setSelectedIds(new Set(ids));
      setDjHours(djHoursFromServiceLines(lines));
      // El pressupost del dossier és el bolo muntat a la fitxa. Fins ara només
      // arribava quan la pantalla s'obria des del client; triant-lo aquí dins
      // el dossier es quedava sense línies i ensenyava un «des de» del catàleg
      // en comptes del preu d'aquest bolo.
      setPressupost(buildQuoteLines(lines));
    } catch (err) {
      console.error('[DossierGenerator] syncProductsFromLead error:', err);
    }
  }, [products, validProductIds]);

  const syncProductsToLead = useCallback(async (leadId: string) => {
    const lines = selectedProducts.map((p) => productToServiceLine(p, djHours, nens));
    const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/service-lines`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    });
    if (!res.ok) throw new Error('Error sincronitzant la configuració del lead');
  }, [selectedProducts, djHours]);

  useEffect(() => {
    if (initialLeadSyncRef.current || !initialLeadId || selectedIds.size > 0) return;
    initialLeadSyncRef.current = true;
    void syncProductsFromLead(initialLeadId);
  }, [initialLeadId, selectedIds.size, syncProductsFromLead]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchLeads(q), 280);
  }

  function handleCustomerSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setCustomerQuery(q);
    setCustomerConflict(null);
    if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);
    customerSearchTimer.current = setTimeout(() => searchCustomers(q), 280);
  }

  function selectLead(lead: LeadResult) {
    setLinkedLeadId(lead.id);
    setLinkedCustomerId('');
    setLinkedCustomerLabel('');
    setCustomerConflict(null);
    setNom(lead.name);
    setEmail(lead.email ?? '');
    setTelefon(lead.phone ?? '');
    const parts: string[] = [];
    // Label traduït (BIRTHDAY → «Aniversari»), mai el codi cru de l'enum.
    if (lead.eventType && lead.eventType !== 'OTHER') parts.push(getEventLabel(lead.eventType));
    if (lead.eventDate) parts.push(lead.eventDate.slice(0, 10));
    if (lead.eventLocation) parts.push(lead.eventLocation);
    setEventDesc(parts.join(' · '));
    // Els km són d'aquest client: es buiden perquè es tornin a calcular fins al
    // seu poble. Deixar-hi els del client anterior seria cobrar un viatge fals.
    setEventLocation(lead.eventLocation ?? '');
    setTravelKm('');
    setSearchQuery('');
    setShowResults(false);
    setSavedId(null);
    void syncProductsFromLead(lead.id);
  }

  function selectCustomer(customer: CustomerResult) {
    setLinkedCustomerId(customer.id);
    setLinkedCustomerLabel(customer.name);
    setCustomerConflict(null);
    setNom(customer.name);
    setEmail(customer.email ?? '');
    setTelefon(customer.phone ?? '');
    setCustomerQuery('');
    setShowCustomerResults(false);
    setCreateLeadOnSave(true);
    setSavedId(null);
  }

  function clearLinkedCustomer() {
    setLinkedCustomerId('');
    setLinkedCustomerLabel('');
    setCustomerQuery('');
    setCustomerResults([]);
    setShowCustomerResults(false);
    setCustomerConflict(null);
    setSavedId(null);
  }

  function clearLinkedLead() {
    setLinkedLeadId('');
    setLinkedCustomerId('');
    setLinkedCustomerLabel('');
    setCustomerConflict(null);
    setNom('');
    setEmail('');
    setTelefon('');
    setEventDesc('');
    setEventLocation('');
    setTravelKm('');
    setPressupost([]);
    setSelectedIds(new Set());
    setCreateLeadOnSave(false);
    setSendOnSave(false);
    setSavedId(null);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setShowCustomerResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  async function extractReceivedText() {
    const text = receivedText.trim();
    if (!text) {
      toast.error(ADMIN_DOSSIER_GENERATOR_COPY.client.intakeEmpty);
      return;
    }
    setExtractingText(true);
    try {
      const res = await fetchWithCsrf('/api/admin/leads/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('No he pogut extreure les dades');
      const payload = await res.json() as ExtractLeadResult;
      const data = payload.data ?? {};
      const nextEventDesc = buildEventDescription(data);
      setNom(data.name || nom);
      setEmail(data.email || email);
      setTelefon(data.phone || telefon);
      if (nextEventDesc) setEventDesc(nextEventDesc);
      setCustomerConflict(null);
      const existingCustomer = await findExistingCustomerMatchFor({
        email: data.email || email,
        phone: data.phone || telefon,
        name: data.name || nom,
      });
      if (existingCustomer && !linkedCustomerId && !linkedLeadId) {
        setCustomerConflict(existingCustomer);
        setCustomerResults([existingCustomer]);
        setShowCustomerResults(false);
      }
      if (payload.fallback) {
        toast.warning(
          payload.fallbackReason === 'quota'
            ? ADMIN_DOSSIER_GENERATOR_COPY.client.intakeFallbackQuota
            : ADMIN_DOSSIER_GENERATOR_COPY.client.intakeFallbackUnavailable,
        );
      } else {
        toast.success(ADMIN_DOSSIER_GENERATOR_COPY.client.intakeSuccess);
      }
    } catch (err) {
      console.error('[DossierGenerator] extractReceivedText error:', err);
      toast.error(err instanceof Error ? err.message : 'No he pogut extreure les dades');
    } finally {
      setExtractingText(false);
    }
  }

  /**
   * El dossier real, el que està desat.
   *
   * Abans aquí es fabricava un document al navegador amb el que hi havia a la
   * pantalla: es podia veure una cosa i enviar-ne una altra. Ordre del
   * propietari: el previsualitzador ha de previsualitzar una cosa creada de
   * veritat. Per això demana desar primer.
   */
  function openSavedDocument(format: 'html' | 'pdf') {
    if (!savedId) {
      toast.error('Desa el dossier primer: la vista prèvia ensenya el dossier de veritat.');
      return;
    }
    const suffix = format === 'pdf' ? '?format=pdf' : '';
    window.open(`/api/admin/dossiers/${savedId}/document${suffix}`, '_blank', 'noopener,noreferrer');
  }

  async function saveDossier() {
    if (!nom.trim() || selectedIds.size === 0) return;
    setSaving(true);
    try {
      let dossierLeadId = linkedLeadId || undefined;
      if (sendOnSave && !email.trim()) {
        toast.error('Cal email per enviar el dossier.');
        return;
      }
      const shouldCreateLead = !dossierLeadId && (createLeadOnSave || sendOnSave || Boolean(linkedCustomerId));
      if (shouldCreateLead) {
        if (!email.trim()) {
          toast.error('Cal email per crear lead/client.');
          return;
        }
        if (!linkedCustomerId) {
          const existingCustomer = await findExistingCustomerMatch();
          if (existingCustomer) {
            setCustomerConflict(existingCustomer);
            setCustomerResults([existingCustomer]);
            setShowCustomerResults(false);
            toast.error(ADMIN_DOSSIER_GENERATOR_COPY.conflict.toast);
            return;
          }
        }
        const leadRes = await fetchWithCsrf('/api/admin/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nom.trim(),
            email: email.trim(),
            phone: telefon.trim() || undefined,
            eventType: 'OTHER',
            eventLocation: eventDesc.trim() || undefined,
            message: 'Lead creat des del generador de dossiers solidari.',
            source: 'OTHER',
            interestedExtras: selectedProducts.map((product) => product.nom),
            customerId: linkedCustomerId || undefined,
          }),
        });
        if (!leadRes.ok) throw new Error('Error creant el lead');
        const leadData = await leadRes.json() as CreateLeadResult;
        dossierLeadId = leadData.lead?.id || undefined;
        if (!dossierLeadId) throw new Error('El lead s\'ha creat sense id retornat');
        setLinkedLeadId(dossierLeadId);
        if (leadData.customerLink?.customerId) {
          setLinkedCustomerId(leadData.customerLink.customerId);
          setLinkedCustomerLabel(linkedCustomerLabel || nom.trim());
        }
        await syncProductsToLead(dossierLeadId);
        setCreateLeadOnSave(false);
      }
      const res = await fetchWithCsrf('/api/admin/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: dossierLeadId,
          nom: nom.trim(),
          empresa: empresa.trim() || undefined,
          telefon: telefon.trim() || undefined,
          email: email.trim() || undefined,
          eventDesc: eventDesc.trim() || undefined,
          salutacio: salutacio.trim() || undefined,
          /* La llengua triada viatja amb el dossier. Sense això el servidor
             tornava a preguntar-la al lead i el document sortia en una altra. */
          locale,
          productIds: Array.from(selectedIds),
          /**
           * La foto del bolo va amb el dossier.
           *
           * Sense això el servidor no pot refer el document que s'acaba de
           * veure: li faltarien els preus acordats i els quilòmetres, i el
           * client rebria una versió diferent de l'aprovada.
           */
          lineSnapshot: {
            travelKm: Number.isFinite(Number(travelKm)) && Number(travelKm) > 0
              ? Number(travelKm)
              : undefined,
            lines: pressupost.length > 0 ? pressupost : undefined,
            tema: tema === 'halloween' ? 'halloween' : undefined,
            personatges: personatges.length > 0 ? personatges : undefined,
          },
        }),
      });
      if (!res.ok) throw new Error('Error desant');
      const data = await res.json() as { id: string };
      setSavedId(data.id);
      if (sendOnSave) {
        const sendRes = await fetchWithCsrf(`/api/admin/dossiers/${data.id}/send`, { method: 'POST' });
        if (!sendRes.ok) {
          // El dossier ja s'ha desat: l'error és només d'enviament, no de desat.
          toast.error('Dossier desat, però no s\'ha pogut enviar. Reenvia\'l des de la llista.');
          return;
        }
        toast.success('Dossier desat i enviat correctament');
      } else {
        toast.success('Dossier desat correctament');
      }
    } catch (err) {
      console.error('[DossierGenerator] saveDossier error:', err);
      toast.error('Error desant el dossier');
    } finally {
      setSaving(false);
    }
  }

  const canGenerate = nom.trim().length > 0 && selectedProducts.length > 0;

  return (
    <div className="dg__wrap">
      <section className="dg__panel dg__client-panel">
        <div className="dg__panel-head">
          <h2 className="dg__section-title">{ADMIN_DOSSIER_GENERATOR_COPY.client.title}</h2>
          <p className="dg__section-hint">{ADMIN_DOSSIER_GENERATOR_COPY.client.hint}</p>
        </div>
        <div className="dg__intake">
          <div className="dg__intake-head">
            <div>
              <h3>{ADMIN_DOSSIER_GENERATOR_COPY.client.intakeTitle}</h3>
              <p>{ADMIN_DOSSIER_GENERATOR_COPY.client.intakeHint}</p>
            </div>
            <button type="button" className="dg__intake-action" onClick={extractReceivedText} disabled={extractingText}>
              {extractingText ? ADMIN_DOSSIER_GENERATOR_COPY.client.intakeWorking : ADMIN_DOSSIER_GENERATOR_COPY.client.intakeAction}
            </button>
          </div>
          <label htmlFor="dg-received-text" className="dg__label">{ADMIN_DOSSIER_GENERATOR_COPY.client.intakeLabel}</label>
          <textarea
            id="dg-received-text"
            className="adm-input adm-input--textarea dg__intake-textarea"
            value={receivedText}
            onChange={(event) => setReceivedText(event.target.value)}
            placeholder={ADMIN_DOSSIER_GENERATOR_COPY.client.intakePlaceholder}
            rows={3}
          />
        </div>
        <div className="dg__search-wrap" ref={searchRef}>
          {linkedLeadId ? (
            <div className="dg__linked-lead">
              <span className="dg__linked-label">{ADMIN_DOSSIER_GENERATOR_COPY.client.linkedLeadLabel}</span>
              <span className="dg__linked-nom">{nom}</span>
              {email && <span className="dg__linked-email">{email}</span>}
              <a
                href={buildLeadWorkspaceHref(linkedLeadId)}
                target="_blank"
                rel="noopener noreferrer"
                className="dg__linked-open"
                title="Obre la fitxa completa del lead en una pestanya nova (no perds el dossier en curs)"
              >
                Obrir fitxa ↗
              </a>
              <button type="button" className="dg__linked-clear" onClick={clearLinkedLead} aria-label="Desvincula el lead">
                {ADMIN_DOSSIER_GENERATOR_COPY.client.changeLeadAction}
              </button>
            </div>
          ) : (
            <div className="dg__search-field">
              <label htmlFor="dg-search" className="dg__label">{ADMIN_DOSSIER_GENERATOR_COPY.client.leadSearchLabel}</label>
              <input
                id="dg-search"
                type="search"
                className="adm-input"
                placeholder="Nom, email o telèfon..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                autoComplete="off"
              />
              {searching && <span className="dg__search-spinner">Cercant…</span>}
              {showResults && searchResults.length > 0 && (
                <ul className="dg__search-results">
                  {searchResults.map((lead) => (
                    <li key={lead.id}>
                      <button type="button" className="dg__search-result" onClick={() => selectLead(lead)}>
                        <span className="dg__sr-nom">{lead.name}</span>
                        <span className="dg__sr-meta">
                          {lead.email ?? lead.phone ?? ''}
                          {' · '}
                          {lead.status}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showResults && searchResults.length === 0 && !searching && searchQuery.length >= 2 && (
                <div className="dg__search-empty">Cap lead trobat. Omple les dades manualment.</div>
              )}
            </div>
          )}
          {!linkedLeadId && (
            <div className="dg__customer-wrap">
              {linkedCustomerId ? (
                <div className="dg__linked-lead dg__linked-lead--customer">
                  <span className="dg__linked-label">{ADMIN_DOSSIER_GENERATOR_COPY.client.linkedCustomerLabel}</span>
                  <span className="dg__linked-nom">{linkedCustomerLabel || nom}</span>
                  {email && <span className="dg__linked-email">{email}</span>}
                  <button type="button" className="dg__linked-clear" onClick={clearLinkedCustomer} aria-label="Desvincula el client">
                    {ADMIN_DOSSIER_GENERATOR_COPY.client.changeCustomerAction}
                  </button>
                </div>
              ) : (
                <div className="dg__search-field">
                  <label htmlFor="dg-customer-search" className="dg__label">{ADMIN_DOSSIER_GENERATOR_COPY.client.customerSearchLabel}</label>
                  <input
                    id="dg-customer-search"
                    type="search"
                    className="adm-input"
                    placeholder="Nom, email o telèfon del client..."
                    value={customerQuery}
                    onChange={handleCustomerSearchChange}
                    onFocus={() => customerResults.length > 0 && setShowCustomerResults(true)}
                    autoComplete="off"
                  />
                  {customerSearching && <span className="dg__search-spinner">Cercant…</span>}
                  {showCustomerResults && customerResults.length > 0 && (
                    <ul className="dg__search-results">
                      {customerResults.map((customer) => (
                        <li key={customer.id}>
                          <button type="button" className="dg__search-result" onClick={() => selectCustomer(customer)}>
                            <span className="dg__sr-nom">{customer.name}</span>
                            <span className="dg__sr-meta">
                              {customer.email ?? customer.phone ?? 'Client sense contacte principal'}
                              {customer.lifecycleStage ? ` · ${customer.lifecycleStage}` : ''}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {showCustomerResults && customerResults.length === 0 && !customerSearching && customerQuery.length >= 2 && (
                    <div className="dg__search-empty">Cap client trobat. Es crearà un client nou si actives el flux CRM.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {customerConflict && !linkedCustomerId && !linkedLeadId && (
          <div className="dg__customer-conflict" role="alert">
            <div className="dg__conflict-body">
              <span className="dg__conflict-kicker">{ADMIN_DOSSIER_GENERATOR_COPY.conflict.kicker}</span>
              <strong>{customerConflict.name}</strong>
              <span>{customerConflict.email ?? customerConflict.phone ?? ADMIN_DOSSIER_GENERATOR_COPY.conflict.noContact}</span>
              <p>{ADMIN_DOSSIER_GENERATOR_COPY.conflict.body}</p>
            </div>
            <div className="dg__conflict-actions">
              <button type="button" onClick={() => selectCustomer(customerConflict)}>
                {ADMIN_DOSSIER_GENERATOR_COPY.conflict.linkAction}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerQuery(customerConflict.email ?? customerConflict.phone ?? customerConflict.name);
                  setCustomerConflict(null);
                  void searchCustomers(customerConflict.email ?? customerConflict.phone ?? customerConflict.name);
                }}
              >
                {ADMIN_DOSSIER_GENERATOR_COPY.conflict.reviewAction}
              </button>
            </div>
          </div>
        )}
          <div className="dg__fields">
            <div className="dg__field">
              <label htmlFor="dg-nom" className="dg__label">Nom *</label>
              <input id="dg-nom" type="text" className="adm-input" value={nom} onChange={(e) => { setNom(e.target.value); setCustomerConflict(null); }} placeholder="Adrià" autoComplete="off" />
            </div>
            <div className="dg__field">
              <label htmlFor="dg-empresa" className="dg__label">Empresa / Associació</label>
              <input id="dg-empresa" type="text" className="adm-input" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Associació de Veïns de Rubí" autoComplete="off" />
            </div>
            <div className="dg__field">
              <label htmlFor="dg-telefon" className="dg__label">Telèfon</label>
              <input id="dg-telefon" type="tel" className="adm-input" value={telefon} onChange={(e) => { setTelefon(e.target.value); setCustomerConflict(null); }} placeholder="+34 600 00 00 00" autoComplete="off" />
            </div>
            <div className="dg__field">
              <label htmlFor="dg-email" className="dg__label">Email</label>
              <input id="dg-email" type="email" className="adm-input" value={email} onChange={(e) => { setEmail(e.target.value); setCustomerConflict(null); }} placeholder="client@exemple.com" autoComplete="off" />
            </div>
            <div className="dg__field">
              <label htmlFor="dg-locale" className="dg__label">Idioma del dossier</label>
              <select
                id="dg-locale"
                className="adm-input"
                value={locale}
                onChange={(e) => setLocale(e.target.value as DossierLocale)}
                aria-describedby="dg-locale-nota"
              >
                {DOSSIER_LOCALE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p id="dg-locale-nota" className="dg__hint">
                {locale === initialLocale
                  ? 'És la llengua que consta al client.'
                  : 'Diferent de la que consta al client: mana la teva tria.'}
              </p>
            </div>
            <div className="dg__field">
              <label htmlFor="dg-tema" className="dg__label">Decoració del dossier</label>
              <select
                id="dg-tema"
                className="adm-input"
                value={tema}
                onChange={(e) => setTema(e.target.value as DossierTema)}
                aria-describedby="dg-tema-nota"
              >
                <option value="general">General</option>
                <option value="halloween">Halloween</option>
              </select>
              <p id="dg-tema-nota" className="dg__hint">
                {tema === 'halloween'
                  ? 'Mateixos productes i preus: només canvia la roba del document.'
                  : 'La decoració de sempre.'}
              </p>
            </div>
            {/* Els personatges només es demanen si el bolo en porta: si no, no
                hi ha res a triar i la pantalla no ha de preguntar-ho. */}
            {selectedProducts.some((p) => isCharacterProduct(p.nom)) && (
              <div className="dg__field dg__field--full">
                <span className="dg__label">Personatges que hi van</span>
                <div className="dg__personatges">
                  {MASQUERADE_CHARACTERS.map((c) => {
                    const triat = personatges.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        className={`dg__personatge${triat ? ' dg__personatge--on' : ''}`}
                        aria-pressed={triat}
                        onClick={() => setPersonatges((actuals) => (
                          actuals.includes(c.id)
                            ? actuals.filter((id) => id !== c.id)
                            : [...actuals, c.id]
                        ))}
                      >
                        <Image src={c.foto} alt="" width={128} height={170} unoptimized />
                        <span>{c.nom}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="dg__hint">
                  {personatges.length === 0
                    ? 'Cap triat: el dossier no ensenyarà cap personatge.'
                    : `${personatges.length} al dossier, amb la seva foto.`}
                </p>
              </div>
            )}
            <div className="dg__field dg__field--full">
              <label htmlFor="dg-event" className="dg__label">{ADMIN_DOSSIER_GENERATOR_COPY.client.eventSummaryLabel}</label>
              <input id="dg-event" type="text" className="adm-input" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder={ADMIN_DOSSIER_GENERATOR_COPY.client.eventSummaryPlaceholder} autoComplete="off" />
            </div>
            <div className="dg__field">
              <label htmlFor="dg-travel-km" className="dg__label">Km desplaçament (anada + tornada)</label>
              <input id="dg-travel-km" type="number" min={0} step={1} className="adm-input" value={travelKm} onChange={(e) => setTravelKm(e.target.value)} placeholder="Ex: 70" autoComplete="off" aria-describedby="dg-travel-km-nota" />
              {/* D'on surt el número. Un import que ningú sap d'on ve no es pot
                  defensar davant del client. */}
              <p id="dg-travel-km-nota" className="dg__hint" role="status">
                {/* Sense població no es pot ensenyar cap ruta: la de l'últim
                    client seria mentida sobre el que hi ha ara a la pantalla. */}
                {!eventLocation
                  ? 'Sense població al lead: escriu-los a mà.'
                  : calculatingDistance
                    ? `Calculant la distància fins a ${eventLocation}…`
                    : distanceMessage || `El lead diu ${eventLocation}.`}
              </p>
            </div>
            <div className="dg__field dg__field--full">
              <label htmlFor="dg-salutacio" className="dg__label">
                {ADMIN_DOSSIER_GENERATOR_COPY.client.introLabel}
                <span className="dg__label-hint">{ADMIN_DOSSIER_GENERATOR_COPY.client.introHint}</span>
              </label>
              <textarea id="dg-salutacio" className="adm-input adm-input--textarea" value={salutacio} onChange={(e) => setSalutacio(e.target.value)} placeholder={ADMIN_DOSSIER_GENERATOR_COPY.client.introPlaceholder} rows={4} />
            </div>
          </div>
      </section>

      <div className="dg__config-grid">
        <aside className="dg__config-side">
          <section className="dg__checkout">
            <div className="dg__checkout-head">
              <div>
                <h2 className="dg__section-title">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.title}</h2>
                <p className="dg__section-hint">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.hint}</p>
              </div>
              <div className="dg__checkout-total">
                <span>{ADMIN_DOSSIER_GENERATOR_COPY.bolo.totalLabel}</span>
                <strong>{formatEuro(selectedTotal)}</strong>
              </div>
            </div>
            {selectedProducts.length > 0 ? (
              <div className="dg__checkout-list">
                {selectedProducts.map((product) => {
                  const isDj = product.id === DJ_FIRST_PRODUCT_ID;
                  const price = productPriceValue(product, djHours);
                  return (
                    <div key={product.id} className="dg__checkout-row">
                      <div>
                        <span className="dg__checkout-name">{product.nom}{isDj ? ` · ${djHours}h` : ''}</span>
                        <span className="dg__checkout-meta">{productGroupTitle(productGroupKey(product))} · {productBadge(product)}</span>
                        {isDj && (
                          <div className="dg__dj-hours" role="group" aria-label="Hores de DJ">
                            <button
                              type="button"
                              className="dg__dj-hours-btn"
                              onClick={() => setDjHours((h) => Math.max(1, h - 1))}
                              disabled={djHours <= 1}
                              aria-label="Treure una hora de DJ"
                            >−</button>
                            <span className="dg__dj-hours-val">{djHours} {djHours === 1 ? 'hora' : 'hores'}</span>
                            <button
                              type="button"
                              className="dg__dj-hours-btn"
                              onClick={() => setDjHours((h) => h + 1)}
                              aria-label="Afegir una hora de DJ"
                            >+</button>
                            <span className="dg__dj-hours-hint">1a {formatEuro(DJ_FIRST_HOUR_PRICE)} · +{formatEuro(DJ_EXTRA_HOUR_PRICE)}/h</span>
                          </div>
                        )}
                        {esPerNen(product) && (
                          <div className="dg__dj-hours" role="group" aria-label="Nens del candybar">
                            <button
                              type="button"
                              className="dg__dj-hours-btn"
                              onClick={() => setNens((n) => Math.max(1, n - 1))}
                              disabled={nens <= 1}
                              aria-label="Un nen menys"
                            >−</button>
                            <span className="dg__dj-hours-val">{nens} {nens === 1 ? 'nen' : 'nens'}</span>
                            <button
                              type="button"
                              className="dg__dj-hours-btn"
                              onClick={() => setNens((n) => n + 1)}
                              aria-label="Un nen més"
                            >+</button>
                            <span className="dg__dj-hours-hint">{nens <= CANDYBAR_INCLUDED_CHILDREN
                              ? `${CANDYBAR_INCLUDED_CHILDREN} inclosos al candybar`
                              : `${nens - CANDYBAR_INCLUDED_CHILDREN} de més × ${formatEuro(product.priceFrom ?? 0)} = ${formatEuro((nens - CANDYBAR_INCLUDED_CHILDREN) * (product.priceFrom ?? 0))}`}</span>
                          </div>
                        )}
                      </div>
                      <div className="dg__checkout-side">
                        <span>{price != null ? formatEuro(price) : 'A mida'}</span>
                        <button type="button" onClick={() => toggleProduct(product.id)} aria-label={`Treure ${product.nom}`}>
                          Treure
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="dg__checkout-empty">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.empty}</p>
            )}
          </section>

          <div className="dg__send-options">
            {!linkedLeadId && (
              <label className="dg__lead-create">
                <input
                  type="checkbox"
                  checked={createLeadOnSave}
                  onChange={(event) => setCreateLeadOnSave(event.target.checked)}
                />
                <span>{linkedCustomerId ? ADMIN_DOSSIER_GENERATOR_COPY.actions.createLeadForCustomer : ADMIN_DOSSIER_GENERATOR_COPY.actions.createCrmFlow}</span>
              </label>
            )}
            <label className="dg__lead-create">
              <input
                type="checkbox"
                checked={sendOnSave}
                onChange={(event) => setSendOnSave(event.target.checked)}
              />
              <span>{ADMIN_DOSSIER_GENERATOR_COPY.actions.sendOnSave}</span>
            </label>
          </div>

          <div className="dg__actions">
            <button type="button" className="dg__btn dg__btn--save" onClick={saveDossier} disabled={!canGenerate || saving}>
              {saving ? 'Desant…' : savedId ? '✓ Desat' : 'Desar al sistema'}
            </button>
            <button type="button" className="dg__btn dg__btn--preview" onClick={() => openSavedDocument('html')} disabled={!savedId}>
              Previsualitzar
            </button>
            <button type="button" className="dg__btn dg__btn--pdf" onClick={() => openSavedDocument('pdf')} disabled={!savedId}>
              Obrir PDF
            </button>
            <span className="dg__hint">
              {!nom.trim()
                ? 'Omple el nom del client per continuar'
                : selectedProducts.length === 0
                  ? 'Selecciona almenys un producte'
                  : !savedId
                    ? `${selectedProducts.length} producte${selectedProducts.length > 1 ? 's' : ''} · ${formatEuro(selectedTotal)} · desa'l per veure el dossier de veritat`
                    : `${selectedProducts.length} producte${selectedProducts.length > 1 ? 's' : ''} · ${formatEuro(selectedTotal)} · el que veus és el que rebrà el client`}
            </span>
          </div>
        </aside>

        <section className="dg__panel dg__catalog-panel">
          <h2 className="dg__section-title">{ADMIN_DOSSIER_GENERATOR_COPY.catalog.title}</h2>
          <p className="dg__section-hint">{ADMIN_DOSSIER_GENERATOR_COPY.catalog.hint}</p>
          {productGroups.length === 0 && (
            <p className="dg__catalog-empty">
              Encara no hi ha cap servei al catàleg. Activa productes a Òrbita o als col·laboradors per poder muntar el dossier.
            </p>
          )}
          <div className="dg__product-groups">
            {productGroups.map(({ group, items }) => (
              <section key={group} className="dg__product-group">
                <div className="dg__group-head">
                  <span className="dg__group-title">{productGroupTitle(group)}</span>
                  <span className="dg__group-subtitle">{productGroupSubtitle(group)}</span>
                </div>
                <div className="dg__products">
                  {items.map((p) => {
                    const checked = selectedIds.has(p.id);
                    const priceLabel = productPriceLabel(p);
                    return (
                      <label key={p.id} className={`dg__product-card${checked ? ' dg__product-card--active' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleProduct(p.id)} className="dg__product-checkbox" aria-label={`Incloure ${p.nom}`} />
                        <div className="dg__product-info">
                          <span className="dg__product-top">
                            <span className="dg__product-name">{p.nom}</span>
                            <span className="dg__product-badge">{productBadge(p)}</span>
                          </span>
                          {priceLabel && <span className="dg__product-price">{priceLabel}</span>}
                        </div>
                        <div className={`dg__product-check${checked ? ' dg__product-check--on' : ''}`}>✓</div>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          {selectedIds.size === 0 && <p className="dg__warn">Selecciona almenys un producte per generar el dossier.</p>}
        </section>
      </div>
    </div>
  );
}
