'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_DOSSIER_GENERATOR_COPY } from '@/lib/constants/admin';
import { getEventLabel } from '@/lib/constants';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { DJ_EXTRA_HOUR_PRICE, DJ_FIRST_HOUR_PRICE } from '@/lib/constants/orbita-services';
import { buildDossierHtml, type DossierCopy } from '@/lib/utils/dossier-html-builder';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { AdminSection } from '../components/AdminPage';
import { computeDossierMarginGuard } from '@/lib/services/dossierMarginGuardService';
import { buildDossierLineSnapshot } from '@/lib/services/dossierSnapshotService';
import {
  buildDossierProductsForSelection,
  DOSSIER_DJ_PRODUCT_ID,
  dossierDjHoursFromServiceLines,
  dossierProductGroupKey,
  dossierProductPriceValue,
  normalizeDossierProductText,
  productIdsFromDossierServiceLines,
  productToDossierServiceLine,
  type DossierProductGroupKey,
} from '@/lib/services/dossierProductMappingService';

// Classes canòniques reutilitzades dins el generador (label de camp, capsa de
// resultats del cercador i ítem de resultat) — tokens del sistema, zero hex local.
const LABEL_CLS = 'flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--t2)]';
const RESULTS_CLS = 'absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 m-0 list-none overflow-hidden rounded-[var(--o-r-md)] border border-[var(--line2)] bg-[var(--raised)] p-1 shadow-lg';
const RESULT_BTN_CLS = 'flex w-full flex-col gap-0.5 rounded-[var(--o-r-sm)] border-none bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-[var(--panel)]';
const CUSTOMER_LOOKUP_ERROR = 'No he pogut consultar clients existents. Torna-ho a provar abans de crear lead/client.';
const LEAD_LOOKUP_ERROR = 'No he pogut consultar leads existents. Torna-ho a provar abans d’omplir el dossier manualment.';
const LEAD_PRODUCTS_SYNC_ERROR = 'No he pogut carregar la configuració del lead. Revisa la fitxa o selecciona els productes manualment.';

interface Props {
  products: AnimacioProduct[];
  dossierCopy: DossierCopy;
  logoDataUri?: string;
  leadId?: string;
  initialNom?: string;
  initialEmail?: string;
  initialTelefon?: string;
  initialEmpresa?: string;
  initialEventDesc?: string;
  initialTravelLocation?: string;
  initialDistanceKm?: number | null;
  initialProductIds?: string;
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

type DossierServiceLine = {
  collaboratorId?: string | null;
  kind?: string | null;
  label?: string | null;
  revenueAmount?: number | null;
  quantity?: number | null;
};

function parseInitialProductIds(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function productPriceLabel(product: AnimacioProduct): string | null {
  // El DJ es construeix per hores: primera hora + cada hora addicional (font única).
  if (product.id === DOSSIER_DJ_PRODUCT_ID) return `des de ${DJ_FIRST_HOUR_PRICE}€ · +${DJ_EXTRA_HOUR_PRICE}€/h`;
  const tierPrice = product.trams?.find((tier) => tier.price !== null)?.price;
  if (typeof tierPrice === 'number') return `des de ${tierPrice}€`;
  const djPrice = product.djOptions?.find((option) => option.price !== null)?.price;
  if (typeof djPrice === 'number') return `des de ${djPrice}€/h`;
  if (typeof product.priceFrom === 'number') return `des de ${product.priceFrom}€`;
  return null;
}

function formatEuro(value: number): string {
  return `${value}€`;
}

function productGroupTitle(group: DossierProductGroupKey): string {
  return ADMIN_DOSSIER_GENERATOR_COPY.catalog.groups[group].title;
}

function productGroupSubtitle(group: DossierProductGroupKey): string {
  return ADMIN_DOSSIER_GENERATOR_COPY.catalog.groups[group].subtitle;
}

function productBadge(product: AnimacioProduct): string {
  const category = product.categoria ?? '';
  const normalized = normalizeDossierProductText(category);
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

function isInfantilDossierProduct(product: AnimacioProduct): boolean {
  const text = normalizeDossierProductText([
    product.categoria,
    product.nom,
    ...(product.descripcio ?? []),
  ].filter(Boolean).join(' '));
  return /\b(infantil|infantils|nens|nenes|mainada|casal|escola|pirates|personatge|pintacares|globoflexia)\b/.test(text);
}

function marginGuardToneClass(band: string): string {
  switch (band) {
    case 'excellent':
      return 'admin-tone-border-success admin-tone-bg-success';
    case 'acceptable':
      return 'admin-tone-border-warning admin-tone-bg-warning';
    case 'watch':
      return 'admin-tone-border-warning admin-tone-bg-warning';
    default:
      return 'admin-tone-border-danger admin-tone-bg-danger';
  }
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

export function DossierGeneratorClient({ products, dossierCopy, logoDataUri, leadId: initialLeadId, initialNom, initialEmail, initialTelefon, initialEmpresa, initialEventDesc, initialTravelLocation, initialDistanceKm, initialProductIds }: Props) {
  const toast = useToast();
  const validProductIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  const productProviderGroups = useMemo(() => (['orbita', 'masquerade', 'tino', 'altres'] as const)
    .map((group) => {
      const groupProducts = products.filter((product) => dossierProductGroupKey(product) === group);
      return {
        group,
        items: groupProducts,
        audienceColumns: [
          { key: 'infantil' as const, items: groupProducts.filter(isInfantilDossierProduct) },
          { key: 'adult' as const, items: groupProducts.filter((product) => !isInfantilDossierProduct(product)) },
        ],
      };
    })
    .filter(({ items }) => items.length > 0), [products]);
  const [linkedLeadId, setLinkedLeadId] = useState(initialLeadId ?? '');
  const [nom, setNom] = useState(initialNom ?? '');
  const [empresa, setEmpresa] = useState(initialEmpresa ?? '');
  const [telefon, setTelefon] = useState(initialTelefon ?? '');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [eventDesc, setEventDesc] = useState(initialEventDesc ?? '');
  const [travelLocation, setTravelLocation] = useState(initialTravelLocation ?? '');
  // Hereta els km calculats del lead la primera vegada (#1371): abans quedava buit i
  // s'havia d'entrar a mà tot i que el lead ja tenia la distància resolta.
  const [travelKm, setTravelKm] = useState(initialDistanceKm != null && initialDistanceKm > 0 ? String(initialDistanceKm) : '');
  const [salutacio, setSalutacio] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(parseInitialProductIds(initialProductIds).filter((id) => validProductIds.has(id))),
  );
  const [djHours, setDjHours] = useState(1);
  const selectedProducts = useMemo(() => products.filter((product) => selectedIds.has(product.id)), [products, selectedIds]);
  // Productes tal com surten al dossier: el DJ porta el preu i la durada de les hores triades.
  const dossierProducts = useMemo(
    () => buildDossierProductsForSelection(selectedProducts, selectedIds, djHours),
    [selectedProducts, selectedIds, djHours],
  );
  const selectedTotal = selectedProducts.reduce((sum, product) => sum + (dossierProductPriceValue(product, djHours) ?? 0), 0);
  const marginGuardLines = useMemo(() => selectedProducts.map((p) => productToDossierServiceLine(p, djHours)), [selectedProducts, djHours]);
  const marginGuard = useMemo(() => {
    const km = Number(travelKm);
    return computeDossierMarginGuard({
      serviceLines: marginGuardLines,
      travelKm: Number.isFinite(km) && km > 0 ? km : 0,
    });
  }, [marginGuardLines, travelKm]);
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
  const [leadSearchError, setLeadSearchError] = useState('');
  const [leadSyncError, setLeadSyncError] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState('');
  const [customerConflict, setCustomerConflict] = useState<CustomerResult | null>(null);
  const [receivedText, setReceivedText] = useState('');
  const [extractingText, setExtractingText] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLeadSyncRef = useRef(false);

  const searchLeads = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); setShowResults(false); setLeadSearchError(''); return; }
    setSearching(true);
    try {
      setLeadSearchError('');
      const res = await fetch(`/api/admin/leads?search=${encodeURIComponent(q)}&limit=8`);
      const data = (await res.json().catch(() => ({}))) as { leads?: LeadResult[]; error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || data.message || LEAD_LOOKUP_ERROR);
      }
      setSearchResults(data.leads ?? []);
      setShowResults(true);
    } catch (err) {
      console.error('[DossierGenerator] searchLeads error:', err);
      setSearchResults([]);
      setShowResults(false);
      setLeadSearchError(err instanceof Error ? err.message : LEAD_LOOKUP_ERROR);
    } finally {
      setSearching(false);
    }
  }, []);

  const loadCustomers = useCallback(async (q: string): Promise<CustomerResult[]> => {
    const res = await fetchWithCsrf(`/api/admin/customers?q=${encodeURIComponent(q)}&limit=8`, { method: 'GET' });
    const payload = (await res.json().catch(() => ({}))) as { customers?: CustomerResult[]; data?: { customers?: CustomerResult[] }; error?: string; message?: string };
    if (!res.ok) {
      throw new Error(payload.error || payload.message || CUSTOMER_LOOKUP_ERROR);
    }
    return extractCustomers(payload);
  }, []);

  const searchCustomers = useCallback(async (q: string) => {
    if (q.length < 2) { setCustomerResults([]); setShowCustomerResults(false); setCustomerSearchError(''); return; }
    setCustomerSearching(true);
    try {
      setCustomerSearchError('');
      const customers = await loadCustomers(q);
      setCustomerResults(customers);
      setShowCustomerResults(true);
    } catch (err) {
      console.error('[DossierGenerator] searchCustomers error:', err);
      setCustomerResults([]);
      setShowCustomerResults(false);
      setCustomerSearchError(err instanceof Error ? err.message : CUSTOMER_LOOKUP_ERROR);
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
      setLeadSyncError('');
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/service-lines`);
      const data = (await res.json().catch(() => ({}))) as LeadServiceLineResult & { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || data.message || LEAD_PRODUCTS_SYNC_ERROR);
      }
      const lines = data.lines ?? [];
      const ids = productIdsFromDossierServiceLines(lines, products, validProductIds);
      setSelectedIds(new Set(ids));
      setDjHours(dossierDjHoursFromServiceLines(lines));
    } catch (err) {
      console.error('[DossierGenerator] syncProductsFromLead error:', err);
      const message = err instanceof Error ? err.message : LEAD_PRODUCTS_SYNC_ERROR;
      setLeadSyncError(message);
      toast.error(message);
    }
  }, [products, toast, validProductIds]);

  const syncProductsToLead = useCallback(async (leadId: string) => {
    const lines = selectedProducts.map((p) => productToDossierServiceLine(p, djHours));
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
    setLeadSearchError('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchLeads(q), 280);
  }

  function handleCustomerSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setCustomerQuery(q);
    setCustomerConflict(null);
    setCustomerSearchError('');
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
    setTravelLocation(lead.eventLocation ?? '');
    setSearchQuery('');
    setShowResults(false);
    setSavedId(null);
    setLeadSearchError('');
    setLeadSyncError('');
    void syncProductsFromLead(lead.id);
  }

  function selectCustomer(customer: CustomerResult) {
    setLinkedCustomerId(customer.id);
    setLinkedCustomerLabel(customer.name);
    setCustomerConflict(null);
    setCustomerSearchError('');
    setLeadSearchError('');
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
    setCustomerSearchError('');
    setLeadSearchError('');
    setSavedId(null);
  }

  function clearLinkedLead() {
    setLinkedLeadId('');
    setLinkedCustomerId('');
    setLinkedCustomerLabel('');
    setCustomerConflict(null);
    setCustomerSearchError('');
    setLeadSearchError('');
    setLeadSyncError('');
    setNom('');
    setEmail('');
    setTelefon('');
    setEventDesc('');
    setTravelLocation('');
    setTravelKm('');
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
      if (data.eventLocation) setTravelLocation(data.eventLocation);
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

  function generate(mode: 'preview' | 'pdf' | 'download') {
    if (!nom.trim()) return;
    setGenerating(true);
    try {
      const selected = dossierProducts;
      const clientInfo = {
        nom: nom.trim(), empresa: empresa.trim(), telefon: telefon.trim(),
        email: email.trim(), eventDesc: eventDesc.trim(),
        salutacio: salutacio.trim() || undefined,
      };
      const km = Number(travelKm);
      const html = buildDossierHtml(clientInfo, selected, dossierCopy, {
        autoPrint: mode === 'pdf',
        logoDataUri,
        locale: 'ca-ES',
        travelKm: Number.isFinite(km) && km > 0 ? km : undefined,
        location: travelLocation.trim() || undefined,
      });
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      if (mode === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = `dossier-${nom.trim().toLowerCase().replace(/[^a-z0-9àáèéíïòóúüç]+/gi, '-')}.html`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('[DossierGenerator] generate error:', err);
      toast.error('No he pogut generar el dossier.');
    } finally {
      setGenerating(false);
    }
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
          productIds: Array.from(selectedIds),
          lineSnapshot: buildDossierLineSnapshot({
            products: dossierProducts,
            travelKm: Number.isFinite(Number(travelKm)) && Number(travelKm) > 0 ? Number(travelKm) : null,
            travelLocation: travelLocation.trim() || null,
          }),
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
      toast.error(err instanceof Error ? err.message : 'Error desant el dossier');
    } finally {
      setSaving(false);
    }
  }

  const canGenerate = nom.trim().length > 0 && selectedProducts.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <AdminSection
        title={ADMIN_DOSSIER_GENERATOR_COPY.client.title}
        description={ADMIN_DOSSIER_GENERATOR_COPY.client.hint}
      >
        <div className="mb-4 flex flex-col gap-2.5 rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--t)]">{ADMIN_DOSSIER_GENERATOR_COPY.client.intakeTitle}</h3>
              <p className="mt-1 max-w-[72ch] text-sm text-[var(--t3)]">{ADMIN_DOSSIER_GENERATOR_COPY.client.intakeHint}</p>
            </div>
            <button type="button" className="ap-btn ap-btn--primary shrink-0" onClick={extractReceivedText} disabled={extractingText}>
              {extractingText ? ADMIN_DOSSIER_GENERATOR_COPY.client.intakeWorking : ADMIN_DOSSIER_GENERATOR_COPY.client.intakeAction}
            </button>
          </div>
          <label htmlFor="dg-received-text" className={LABEL_CLS}>{ADMIN_DOSSIER_GENERATOR_COPY.client.intakeLabel}</label>
          <textarea
            id="dg-received-text"
            className="adm-input adm-input--textarea min-h-20"
            value={receivedText}
            onChange={(event) => setReceivedText(event.target.value)}
            placeholder={ADMIN_DOSSIER_GENERATOR_COPY.client.intakePlaceholder}
            rows={3}
          />
        </div>
        <div className="relative mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2" ref={searchRef}>
          {linkedLeadId ? (
            <div className="flex flex-wrap items-center gap-2.5 rounded-[var(--o-r-sm)] border border-[var(--gold)] bg-[var(--ax-gold-tint-1)] px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold-bright)]">{ADMIN_DOSSIER_GENERATOR_COPY.client.linkedLeadLabel}</span>
              <span className="text-base font-semibold text-[var(--t)]">{nom}</span>
              {email && <span className="text-xs text-[var(--t3)]">{email}</span>}
              <a
                href={buildLeadWorkspaceHref(linkedLeadId)}
                target="_blank"
                rel="noopener noreferrer"
                className="ap-btn ap-btn--primary ap-btn--xs ml-auto"
                title="Obre la fitxa completa del lead en una pestanya nova (no perds el dossier en curs)"
              >
                Obrir fitxa ↗
              </a>
              <button type="button" className="ap-btn ap-btn--xs" onClick={clearLinkedLead} aria-label="Desvincula el lead">
                {ADMIN_DOSSIER_GENERATOR_COPY.client.changeLeadAction}
              </button>
            </div>
          ) : (
            <div className="relative flex max-w-[42rem] flex-col gap-1.5">
              <label htmlFor="dg-search" className={LABEL_CLS}>{ADMIN_DOSSIER_GENERATOR_COPY.client.leadSearchLabel}</label>
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
              {searching && <span className="absolute right-3 top-9 text-xs text-[var(--t3)]">Cercant…</span>}
              {leadSearchError && (
                <div className="ap-inline-alert ap-inline-alert--danger mt-1" role="alert">
                  {leadSearchError}
                </div>
              )}
              {showResults && searchResults.length > 0 && (
                <ul className={RESULTS_CLS}>
                  {searchResults.map((lead) => (
                    <li key={lead.id}>
                      <button type="button" className={RESULT_BTN_CLS} onClick={() => selectLead(lead)}>
                        <span className="text-base font-semibold text-[var(--t)]">{lead.name}</span>
                        <span className="text-xs text-[var(--t3)]">
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
                <div className="mt-1 rounded-[var(--o-r-sm)] border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--t3)]">Cap lead trobat. Omple les dades manualment.</div>
              )}
            </div>
          )}
          {leadSyncError && (
            <div className="ap-inline-alert ap-inline-alert--danger max-w-[42rem]" role="alert">
              {leadSyncError}
            </div>
          )}
          {!linkedLeadId && (
            <div>
              {linkedCustomerId ? (
                <div className="flex max-w-[42rem] flex-wrap items-center gap-2.5 rounded-[var(--o-r-sm)] border border-[var(--line2)] bg-[var(--sunk)] px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold-bright)]">{ADMIN_DOSSIER_GENERATOR_COPY.client.linkedCustomerLabel}</span>
                  <span className="text-base font-semibold text-[var(--t)]">{linkedCustomerLabel || nom}</span>
                  {email && <span className="text-xs text-[var(--t3)]">{email}</span>}
                  <button type="button" className="ap-btn ap-btn--xs ml-auto" onClick={clearLinkedCustomer} aria-label="Desvincula el client">
                    {ADMIN_DOSSIER_GENERATOR_COPY.client.changeCustomerAction}
                  </button>
                </div>
              ) : (
                <div className="relative flex max-w-[42rem] flex-col gap-1.5">
                  <label htmlFor="dg-customer-search" className={LABEL_CLS}>{ADMIN_DOSSIER_GENERATOR_COPY.client.customerSearchLabel}</label>
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
                  {customerSearching && <span className="absolute right-3 top-9 text-xs text-[var(--t3)]">Cercant…</span>}
                  {customerSearchError && (
                    <div className="ap-inline-alert ap-inline-alert--danger mt-1" role="alert">
                      {customerSearchError}
                    </div>
                  )}
                  {showCustomerResults && customerResults.length > 0 && (
                    <ul className={RESULTS_CLS}>
                      {customerResults.map((customer) => (
                        <li key={customer.id}>
                          <button type="button" className={RESULT_BTN_CLS} onClick={() => selectCustomer(customer)}>
                            <span className="text-base font-semibold text-[var(--t)]">{customer.name}</span>
                            <span className="text-xs text-[var(--t3)]">
                              {customer.email ?? customer.phone ?? 'Client sense contacte principal'}
                              {customer.lifecycleStage ? ` · ${customer.lifecycleStage}` : ''}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {showCustomerResults && customerResults.length === 0 && !customerSearching && customerQuery.length >= 2 && (
                    <div className="mt-1 rounded-[var(--o-r-sm)] border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--t3)]">Cap client trobat. Es crearà un client nou si actives el flux CRM.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {customerConflict && !linkedCustomerId && !linkedLeadId && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[var(--o-r-sm)] border border-[var(--gold)] bg-[var(--ax-gold-tint-1)] px-4 py-3.5" role="alert">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold-bright)]">{ADMIN_DOSSIER_GENERATOR_COPY.conflict.kicker}</span>
              <strong className="text-base text-[var(--t)]">{customerConflict.name}</strong>
              <span className="text-xs text-[var(--t3)]">{customerConflict.email ?? customerConflict.phone ?? ADMIN_DOSSIER_GENERATOR_COPY.conflict.noContact}</span>
              <p className="mt-1 text-sm text-[var(--t2)]">{ADMIN_DOSSIER_GENERATOR_COPY.conflict.body}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <button type="button" className="ap-btn ap-btn--primary ap-btn--xs" onClick={() => selectCustomer(customerConflict)}>
                {ADMIN_DOSSIER_GENERATOR_COPY.conflict.linkAction}
              </button>
              <button
                type="button"
                className="ap-btn ap-btn--xs"
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
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dg-nom" className={LABEL_CLS}>Nom *</label>
              <input id="dg-nom" type="text" className="adm-input" value={nom} onChange={(e) => { setNom(e.target.value); setCustomerConflict(null); }} placeholder="Adrià" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dg-empresa" className={LABEL_CLS}>Empresa / Associació</label>
              <input id="dg-empresa" type="text" className="adm-input" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Associació de Veïns de Rubí" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dg-telefon" className={LABEL_CLS}>Telèfon</label>
              <input id="dg-telefon" type="tel" className="adm-input" value={telefon} onChange={(e) => { setTelefon(e.target.value); setCustomerConflict(null); }} placeholder="+34 600 00 00 00" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dg-email" className={LABEL_CLS}>Email</label>
              <input id="dg-email" type="email" className="adm-input" value={email} onChange={(e) => { setEmail(e.target.value); setCustomerConflict(null); }} placeholder="client@exemple.com" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-4">
              <label htmlFor="dg-event" className={LABEL_CLS}>{ADMIN_DOSSIER_GENERATOR_COPY.client.eventSummaryLabel}</label>
              <input id="dg-event" type="text" className="adm-input" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder={ADMIN_DOSSIER_GENERATOR_COPY.client.eventSummaryPlaceholder} autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dg-travel-km" className={LABEL_CLS}>Km desplaçament (anada + tornada)</label>
              <input id="dg-travel-km" type="number" min={0} step={1} className="adm-input" value={travelKm} onChange={(e) => setTravelKm(e.target.value)} placeholder="Ex: 70" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-3">
              <label htmlFor="dg-travel-location" className={LABEL_CLS}>Lloc del desplaçament</label>
              <input id="dg-travel-location" type="text" className="adm-input" value={travelLocation} onChange={(e) => setTravelLocation(e.target.value)} placeholder="Ex: l'Aldosa" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-4">
              <label htmlFor="dg-salutacio" className={LABEL_CLS}>
                {ADMIN_DOSSIER_GENERATOR_COPY.client.introLabel}
                <span className="text-xs font-normal normal-case tracking-normal text-[var(--t3)]">{ADMIN_DOSSIER_GENERATOR_COPY.client.introHint}</span>
              </label>
              <textarea id="dg-salutacio" className="adm-input adm-input--textarea" value={salutacio} onChange={(e) => setSalutacio(e.target.value)} placeholder={ADMIN_DOSSIER_GENERATOR_COPY.client.introPlaceholder} rows={4} />
            </div>
          </div>
      </AdminSection>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)]">
        <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
          <section className="ap-card ap-card-body">
            <div className="mb-3.5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--t)]">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.title}</h2>
                <p className="mt-1 text-sm text-[var(--t3)]">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.hint}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="block font-mono text-xs uppercase tracking-[0.08em] text-[var(--t3)]">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.totalLabel}</span>
                <strong className="block text-xl leading-tight text-[var(--gold-bright)]">{formatEuro(selectedTotal)}</strong>
              </div>
            </div>
            {selectedProducts.length > 0 ? (
              <div className="flex flex-col gap-2">
                {selectedProducts.map((product) => {
                  const isDj = product.id === DOSSIER_DJ_PRODUCT_ID;
                  const price = dossierProductPriceValue(product, djHours);
                  return (
                    <div key={product.id} className="flex items-center justify-between gap-3 rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] px-3 py-2.5">
                      <div>
                        <span className="block font-semibold text-[var(--t)]">{product.nom}{isDj ? ` · ${djHours}h` : ''}</span>
                        <span className="mt-0.5 block text-xs text-[var(--t3)]">{productGroupTitle(dossierProductGroupKey(product))} · {productBadge(product)}</span>
                        {isDj && (
                          <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Hores de DJ">
                            <button
                              type="button"
                              className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--o-r-sm)] border border-[var(--line2)] text-sm leading-none text-[var(--t)] hover:border-[var(--gold)] hover:text-[var(--gold-bright)] disabled:opacity-40"
                              onClick={() => setDjHours((h) => Math.max(1, h - 1))}
                              disabled={djHours <= 1}
                              aria-label="Treure una hora de DJ"
                            >−</button>
                            <span className="min-w-16 text-center font-mono text-xs text-[var(--t)]">{djHours} {djHours === 1 ? 'hora' : 'hores'}</span>
                            <button
                              type="button"
                              className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--o-r-sm)] border border-[var(--line2)] text-sm leading-none text-[var(--t)] hover:border-[var(--gold)] hover:text-[var(--gold-bright)] disabled:opacity-40"
                              onClick={() => setDjHours((h) => h + 1)}
                              aria-label="Afegir una hora de DJ"
                            >+</button>
                            <span className="text-xs text-[var(--t3)]">1a {formatEuro(DJ_FIRST_HOUR_PRICE)} · +{formatEuro(DJ_EXTRA_HOUR_PRICE)}/h</span>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5 font-mono text-sm text-[var(--t)]">
                        <span>{price != null ? formatEuro(price) : 'A mida'}</span>
                        <button type="button" className="ap-btn ap-btn--xs" onClick={() => toggleProduct(product.id)} aria-label={`Treure ${product.nom}`}>
                          Treure
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--t3)]">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.empty}</p>
            )}
          </section>

          {selectedProducts.length > 0 && (
            <section className={`rounded-[var(--o-r-sm)] border px-4 py-3.5 ${marginGuardToneClass(marginGuard.band)}`} aria-label={ADMIN_DOSSIER_GENERATOR_COPY.bolo.marginTitle}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--t)]">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.marginTitle}</h3>
                  <p className="mt-1 text-xs text-[var(--t2)]">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.marginHint}</p>
                </div>
                <div className="text-right">
                  <span className={`block font-mono text-xs uppercase tracking-[0.08em] o-margin-text--${marginGuard.band}`}>{marginGuard.label}</span>
                  <strong className={`block text-xl leading-tight o-margin-text--${marginGuard.band}`}>{marginGuard.marginPct}%</strong>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] px-2.5 py-2">
                  <span className="block text-[var(--t3)]">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.revenueLabel}</span>
                  <strong className="font-mono text-[var(--t)]">{formatEuro(Math.round(marginGuard.totalRevenue))}</strong>
                </div>
                <div className="rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] px-2.5 py-2">
                  <span className="block text-[var(--t3)]">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.directCostLabel}</span>
                  <strong className="font-mono text-[var(--t)]">{formatEuro(Math.round(marginGuard.directCost + marginGuard.acquisitionCost))}</strong>
                </div>
                <div className="rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] px-2.5 py-2">
                  <span className="block text-[var(--t3)]">{ADMIN_DOSSIER_GENERATOR_COPY.bolo.netMarginLabel}</span>
                  <strong className={`font-mono o-margin-text--${marginGuard.band}`}>{formatEuro(Math.round(marginGuard.netMargin))}</strong>
                </div>
              </div>
              {marginGuard.subcontractedMarkupPct > 0 && (
                <p className={`mt-2 text-xs ${marginGuard.subcontractedMarkupOk ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
                  {ADMIN_DOSSIER_GENERATOR_COPY.bolo.subcontractedLabel}: {marginGuard.subcontractedMarkupPct.toFixed(1)}%
                </p>
              )}
              {marginGuard.warnings.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-xs text-[var(--t)]">
                  {marginGuard.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
                </ul>
              )}
            </section>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] px-4 py-3">
            {!linkedLeadId && (
              <label className="inline-flex cursor-pointer items-center gap-2.5 font-mono text-xs text-[var(--t2)]">
                <input
                  type="checkbox"
                  className="accent-[var(--gold)]"
                  checked={createLeadOnSave}
                  onChange={(event) => setCreateLeadOnSave(event.target.checked)}
                />
                <span>{linkedCustomerId ? ADMIN_DOSSIER_GENERATOR_COPY.actions.createLeadForCustomer : ADMIN_DOSSIER_GENERATOR_COPY.actions.createCrmFlow}</span>
              </label>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2.5 font-mono text-xs text-[var(--t2)]">
              <input
                type="checkbox"
                className="accent-[var(--gold)]"
                checked={sendOnSave}
                onChange={(event) => setSendOnSave(event.target.checked)}
              />
              <span>{ADMIN_DOSSIER_GENERATOR_COPY.actions.sendOnSave}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button type="button" className="ap-btn" onClick={() => generate('preview')} disabled={!canGenerate || generating}>
              Previsualitzar
            </button>
            <button type="button" className="ap-btn ap-btn--primary" onClick={() => generate('pdf')} disabled={!canGenerate || generating}>
              Obrir PDF
            </button>
            <button type="button" className="ap-btn" onClick={saveDossier} disabled={!canGenerate || saving}>
              {saving ? 'Desant…' : savedId ? '✓ Desat' : 'Desar al sistema'}
            </button>
            <button type="button" className="ap-btn" onClick={() => generate('download')} disabled={!canGenerate || generating}>
              Descarregar peça HTML
            </button>
            <span className="text-xs text-[var(--t3)]">
              {!nom.trim() ? 'Omple el nom del client per continuar' : selectedProducts.length === 0 ? 'Selecciona almenys un producte' : `${selectedProducts.length} producte${selectedProducts.length > 1 ? 's' : ''} · ${formatEuro(selectedTotal)}`}
            </span>
          </div>
        </aside>

        <section className="ap-card ap-card-body min-w-0">
          <h2 className="text-base font-semibold text-[var(--t)]">{ADMIN_DOSSIER_GENERATOR_COPY.catalog.title}</h2>
          <p className="mb-4 mt-1 text-sm text-[var(--t3)]">{ADMIN_DOSSIER_GENERATOR_COPY.catalog.hint}</p>
          {products.length === 0 && (
            <p className="mt-2 rounded-[var(--o-r-sm)] border border-dashed border-[var(--line2)] bg-[var(--sunk)] p-5 text-center text-sm text-[var(--t3)]">
              Encara no hi ha cap servei al catàleg. Activa productes a Òrbita o als col·laboradors per poder muntar el dossier.
            </p>
          )}
          {products.length > 0 && (
            <div className="flex flex-col gap-4">
              {productProviderGroups.map(({ group, audienceColumns, items }) => {
                return (
                  <section key={group} className="flex min-w-0 flex-col gap-3 rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--panel)] p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2">
                      <div className="min-w-0">
                        <span className="block font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--gold-bright)]">{productGroupTitle(group)}</span>
                        <span className="text-xs text-[var(--t3)]">{productGroupSubtitle(group)}</span>
                      </div>
                      <span className="ap-badge shrink-0">{items.length} {ADMIN_DOSSIER_GENERATOR_COPY.catalog.serviceCountLabel}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      {audienceColumns.map(({ key, items: audienceItems }) => {
                        const audienceCopy = ADMIN_DOSSIER_GENERATOR_COPY.catalog.audiences[key];
                        return (
                          <section key={key} className="flex min-w-0 flex-col gap-2.5 rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)] p-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--t2)]">{audienceCopy.title}</span>
                              <span className="text-xs text-[var(--t3)]">{audienceItems.length}</span>
                            </div>
                            {audienceItems.length === 0 ? (
                              <p className="rounded-[var(--o-r-sm)] border border-dashed border-[var(--line2)] px-3 py-2.5 text-xs text-[var(--t3)]">
                                {audienceCopy.empty}
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2.5">
                                {audienceItems.map((p) => {
                                  const checked = selectedIds.has(p.id);
                                  const priceLabel = productPriceLabel(p);
                                  return (
                                    <label
                                      key={p.id}
                                      className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-[var(--o-r-sm)] border bg-[var(--panel)] px-3.5 py-3 transition-colors hover:border-[var(--gold)] ${checked ? 'border-[var(--gold)] bg-[var(--ax-gold-tint-1)]' : 'border-[var(--line)]'}`}
                                    >
                                      <input type="checkbox" checked={checked} onChange={() => toggleProduct(p.id)} className="sr-only" aria-label={`Incloure ${p.nom}`} />
                                      {p.image && (
                                        <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--sunk)]">
                                          <Image src={p.image} alt="" fill sizes="5rem" className="object-cover" />
                                        </span>
                                      )}
                                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="flex min-w-0 items-center gap-2">
                                          <span className="font-semibold text-[var(--t)]">{p.nom}</span>
                                          <span className="ap-badge shrink-0">{productBadge(p)}</span>
                                        </span>
                                        {priceLabel && <span className="text-xs text-[var(--t3)]">{priceLabel}</span>}
                                      </div>
                                      <div className={`flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full border-2 text-xs ${checked ? 'border-[var(--gold)] bg-[var(--gold)] text-[var(--canvas)]' : 'border-[var(--line2)] text-transparent'}`}>✓</div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
          {selectedIds.size === 0 && <p className="mt-3 text-sm text-[var(--o-stage-lost)]">Selecciona almenys un producte per generar el dossier.</p>}
        </section>
      </div>
    </div>
  );
}
