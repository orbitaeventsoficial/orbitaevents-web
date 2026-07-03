'use client';

import { useEffect, useState, useCallback, useMemo, type MouseEvent } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import BookingServiceLinesSection from '@/app/admin/bookings/BookingServiceLinesSection';
import type { BookingServiceLineFormInput } from '@/app/admin/bookings/booking-form.types';
import { computeBookingFinancialSummary, aggregateServiceLines, classifyBoloLines } from '@/lib/services/costEngine';
import { EQUIPMENT_RENTAL_TRANSPORT_KM, DEFAULT_VEHICLE_COST_PER_KM } from '@/lib/services/travelCost';
import { calculateTravelCostBreakdown, deriveTravelHeadcount, computeBoloTransport } from '@/lib/services/travelLaborCost';
import { useBookingDistance } from '@/app/admin/bookings/useBookingDistance';
import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { formatCurrency, formatNumber } from '@/lib/constants';

/**
 * El BOLO dins la fitxa del lead (Fase 1.4 de docs/bolo-flux.md).
 * Reutilitza el configurador (catàleg dreta → bolo esquerra). Carrega/desa contra
 * `LeadServiceLine` via /api/admin/leads/[id]/service-lines. El pack base és una
 * línia més del bolo (kind especial gestionat al configurador).
 */
export interface BoloEconomia {
 net: number;
 marginPct: number;
 total: number;
 travelCharge: number;
 travelCost: number;
 directCost: number;
 acquisitionCost: number;
 serviceLinesCost: number;
 fixedOperationalCost: number;
 tone: 'emerald' | 'amber' | 'orange' | 'rose';
 label: string;
}

/**
 * Neteja de PRESENTACIÓ del detall del cost de ruta (#1359). El model
 * (`travelLaborCost`) genera el subtext amb etiquetes tècniques en anglès
 * (`vehicle`/`DRIVER`/`PASSENGER`) i unitats `EUR`. Com que el label de la línia
 * ja diu qui cobra i què és, aquí només es mostra el detall del càlcul en català
 * net: es treu el rol anglès redundant, `EUR`→`€` i el decimal amb coma.
 * No es toca el model (el marge negatiu és el segon pas, de lògica).
 */
function cleanRouteNote(raw: string): string {
 return raw
 .replace('[travel-cost] ', '')
 .replace(/^(?:vehicle|DRIVER|PASSENGER)\s·\s/, '')
 .replace(/(\d+)\.0+(\s?km)/g, '$1$2')
 .replace(/\bEUR(\/\w+)/g, '€$1')
 .replace(/(\d)\.(\d)/g, '$1,$2');
}

export default function LeadBoloSection({
 leadId,
 documentContext,
 contractedProducts = [],
 source,
 vehicleCostPerKm = DEFAULT_VEHICLE_COST_PER_KM,
 initialDistanceKm = null,
 initialTollsEur = null,
 onEconomiaChange,
 compactEconomia = false,
}: {
 leadId: string;
 documentContext: {
 name: string;
 email?: string | null;
 phone?: string | null;
 eventDate?: string | null;
 eventStartTime?: string | null;
 eventEndTime?: string | null;
 eventLocation?: string | null;
 eventAddress?: string | null;
 guestCount?: string | number | null;
 };
 contractedProducts?: Array<{
 kind: string;
 label: string;
 quantity: number;
 amount: number | null;
 meta?: string | null;
 }>;
 source?: string | null;
 vehicleCostPerKm?: number;
 initialDistanceKm?: number | null;
 initialTollsEur?: number | null;
 onEconomiaChange?: (e: BoloEconomia | null) => void;
 compactEconomia?: boolean;
}) {
 const toast = useToast();
 const [lines, setLines] = useState<BookingServiceLineFormInput[]>([]);
 // Cost intern de ruta (línies [travel-cost] amagades del #1342/#1343): fallback
 // quan encara no hi ha distància calculada en viu.
 const [internalTravelCost, setInternalTravelCost] = useState(0);
 // Càlcul de transport EN VIU (#1345): km anada+tornada + integrants derivats del bolo.
 const [distanceKm, setDistanceKm] = useState(initialDistanceKm ? String(initialDistanceKm) : '');
 const [tollsEur, setTollsEur] = useState(initialTollsEur ? String(initialTollsEur) : '');
 const [headcountOverride, setHeadcountOverride] = useState('');
 // Atribució del transport (#1354): qui posa el cotxe i qui condueix. '' = Òrbita;
 // altrament el collaboratorId d'un proveïdor del bolo → el cost va a aquella persona.
 const [vehicleOwnerId, setVehicleOwnerId] = useState('');
 const [driverId, setDriverId] = useState('');
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [dirty, setDirty] = useState(false);

 useEffect(() => {
 let alive = true;
 (async () => {
 try {
 const linesRes = await fetchWithCsrf(`/api/admin/leads/${leadId}/service-lines`);
 if (!alive) return;
 if (linesRes.ok) {
 const d = await linesRes.json();
 const loaded = (d.lines || []).map((l: {
 collaboratorId?: string | null; kind: string; label: string;
 revenueAmount?: number | null; costAmount?: number | null; quantity?: number | null; notes?: string | null;
 }) => ({
 collaboratorId: l.collaboratorId ?? undefined,
 kind: l.kind as BookingServiceLineFormInput['kind'],
 label: l.label,
 revenueAmount: l.revenueAmount ?? undefined,
 costAmount: l.costAmount ?? undefined,
 quantity: l.quantity ?? 1,
 notes: l.notes ?? undefined,
 }));
 setLines(loaded);
 setInternalTravelCost(Number(d.internalTravelCost) || 0);
 }
 } catch (e) {
 console.error('[LeadBolo] càrrega', e);
 } finally {
 if (alive) setLoading(false);
 }
 })();
 return () => { alive = false; };
 }, [leadId]);

 const onLinesChange = useCallback((next: BookingServiceLineFormInput[]) => {
 setLines(next);
 setDirty(true);
 }, []);

 // El bolo es munta amb serveis (DJ 1a hora 150 + extres), sense pack base.
 const buildAllLines = useCallback((): BookingServiceLineFormInput[] => lines, [lines]);
 const baseLines = useMemo<BookingServiceLineFormInput[]>(() => contractedProducts
 .filter((item) => item.kind === 'PACK' || item.kind === 'EXTRA' || item.kind === 'EXTRA_HOURS')
 .map((item) => ({
 kind: 'OTHER',
 label: item.meta ? `${item.label} · ${item.meta}` : item.label,
 revenueAmount: item.amount ?? 0,
 quantity: item.quantity || 1,
 })), [contractedProducts]);
 const buildVisibleLines = useCallback((): BookingServiceLineFormInput[] => [...baseLines, ...lines], [baseLines, lines]);

 // ── Transport EN VIU (#1345): mirall del càlcul de NewBookingForm ──
 // Distància auto-resolta des de la ubicació del lead → Granollers.
 const { calculatingDistance, distanceMessage } = useBookingDistance({
 eventVenue: documentContext.eventAddress ?? '',
 eventLocation: documentContext.eventLocation ?? '',
 onDistanceResolved: (km) => { setDistanceKm(km); setDirty(true); },
 onTollsResolved: (t) => { setTollsEur(t); setDirty(true); },
 });
 // Integrants derivats del bolo (#1363): persones FÍSIQUES via la regla canònica
 // (deriveTravelHeadcount) — els rols que fa Òrbita col·lapsen en 1. `baseLines` inclou
 // el pack contractat com a línia OTHER amb PVP; si n'hi ha, ets tu (DJ) → hasOrbitaPack.
 const derivedHeadcount = useMemo(() => {
 const hasOrbitaPack = baseLines.some((l) => (l.revenueAmount ?? 0) > 0);
 return deriveTravelHeadcount(lines, hasOrbitaPack);
 }, [lines, baseLines]);
 const headcount = headcountOverride ? Math.max(0, Math.floor(Number(headcountOverride) || 0)) : derivedHeadcount;
 // Col·laboradors presents al bolo (per triar qui posa el cotxe / condueix).
 const travelCollaborators = useMemo(() => {
 const seen = new Map<string, string>();
 for (const l of buildVisibleLines()) {
 if (l.collaboratorId && !seen.has(l.collaboratorId)) {
 seen.set(l.collaboratorId, l.label?.match(/\(([^)]+)\)/)?.[1] ?? l.label ?? 'Col·laborador');
 }
 }
 return [...seen.entries()].map(([id, name]) => ({ id, name }));
 }, [buildVisibleLines]);
 const nameFor = (id: string) => (id ? (travelCollaborators.find((c) => c.id === id)?.name ?? 'Proveïdor') : 'Òrbita');
 const travelBreakdown = useMemo(() => {
 const providerLine = buildVisibleLines().find((line) => line.kind === 'PROVIDER_SERVICE' && /\(([^)]+)\)/.test(line.label));
 const providerName = providerLine?.label.match(/\(([^)]+)\)/)?.[1] ?? 'Equip ruta';
 const passengerCount = Math.max(0, headcount - 1);
 return calculateTravelCostBreakdown({
 roundTripKm: Number(distanceKm) || 0,
 vehicleCostPerKm,
 tollsEur: Number(tollsEur) || 0,
 vehicleOwner: { label: nameFor(vehicleOwnerId), collaboratorId: vehicleOwnerId || null },
 people: [
 ...(headcount > 0 ? [{ role: 'DRIVER' as const, label: nameFor(driverId), collaboratorId: driverId || null }] : []),
 ...(passengerCount > 0 ? [{ role: 'PASSENGER' as const, label: providerName, collaboratorId: providerLine?.collaboratorId ?? null, count: passengerCount }] : []),
 ],
 });
 // eslint-disable-next-line react-hooks/exhaustive-deps -- nameFor és un closure estable sobre travelCollaborators (ja dep)
 }, [buildVisibleLines, distanceKm, tollsEur, headcount, vehicleCostPerKm, vehicleOwnerId, driverId, travelCollaborators]);
 // COST INTERN real del transport (cotxe + temps tripulació + peatges, tots els km).
 // Live si hi ha km resolts; si no, fallback al cost recuperat (#1343).
 const effectiveTravelCost = (Number(distanceKm) || 0) > 0 ? travelBreakdown.totalCost : internalTravelCost;
 const km = Number(distanceKm) || 0;
 // CÀRREC al client (#1369, monocapa): UNA crida al cervell econòmic `computeBoloTransport`.
 // El lead NO calcula el càrrec pel seu compte: demana el número al cervell, que aplica la
 // franquícia comercial (50 km inclosos al cotxe) i el marge. El breakdown segueix sent el
 // cost real per al repartiment/marge.
 const travelCharge = km > 0
   ? computeBoloTransport({ roundTripKm: km, headcountOverride: headcount, tollsEur: Number(tollsEur) || 0, vehicleCostPerKm }).clientCharge
   : internalTravelCost;

 // Fulla d'economia del bolo (Fase 4 de docs/bolo-flux.md). La pasta NO viu al
 // configurador: cada línia porta el cost amagat i alimenta SOLA aquesta fulla.
 // Cost de cada línia: el cost explícit (partners) o, per a línies pròpies d'Òrbita
 // sense cost, s'imputa cost intern via `orbitaServiceCostRatio` (el DJ no és cost 0).
 // Els agregats passen a `computeBookingFinancialSummary` (font única de marge).
 const economia = useMemo(() => {
 const allLines = buildVisibleLines();
 // ownCostRatio = 0: un servei propi (DJ) NO imputa cost sobre el seu preu.
 // El cost real de l'equip propi (desgast + amortització + consumibles) ja
 // viu al cost fix operatiu; imputar a més un % seria comptar-lo dos cops.
 const { revenue: linesRevenue, cost } = aggregateServiceLines(allLines, 0);
 if (linesRevenue <= 0) return null;
 // El càrrec de desplaçament es REPERCUTEIX al client: suma al total facturable.
 const revenue = linesRevenue + travelCharge;
 // Cost operatiu real (vegeu docs/bolo-flux.md):
 // - cost fix (desgast + amortització + consumibles) NOMÉS si el bolo porta
 // equip propi d'Òrbita (DJ o material propi); Masquerade sol → 0.
 // - el transport d'anar a buscar material de lloguer (Tino) el carrega la
 // pròpia línia de lloguer, sumat al seu cost.
 const { hasOwnEquipment, hasEquipmentRental } = classifyBoloLines(allLines);
 const rentalTransport = hasEquipmentRental ? EQUIPMENT_RENTAL_TRANSPORT_KM * vehicleCostPerKm : 0;
 const summary = computeBookingFinancialSummary({
 total: revenue,
 packPrice: 0, extrasTotal: 0, extraHours: 0, extraHourPrice: 0,
 distanceKm: Number(distanceKm) || 0, travelCost: effectiveTravelCost,
 serviceLinesRevenue: linesRevenue, serviceLinesCost: cost + rentalTransport,
 source: source ?? null,
 }, {
 ...PROFITABILITY_MODEL_DEFAULTS,
 fixedOperationalCost: hasOwnEquipment ? PROFITABILITY_MODEL_DEFAULTS.fixedOperationalCost : 0,
 });
 return summary;
 }, [buildVisibleLines, source, vehicleCostPerKm, effectiveTravelCost, distanceKm, travelCharge]);

 // Eleva el net al contenidor (perquè visqui al hero de la fitxa, no enterrat a baix).
 useEffect(() => {
 if (!onEconomiaChange) return;
 onEconomiaChange(economia
 ? {
 net: economia.netMargin,
 marginPct: economia.marginPct,
 total: economia.total,
 travelCharge,
 travelCost: effectiveTravelCost,
 directCost: economia.directCost,
 acquisitionCost: economia.acquisitionCost,
 serviceLinesCost: economia.serviceLinesCost,
 fixedOperationalCost: economia.fixedOperationalCost,
 tone: economia.marginTone.tone,
 label: economia.marginTone.label,
 }
 : null);
 }, [economia, effectiveTravelCost, onEconomiaChange, travelCharge]);

 const routeSettlementLines = useMemo(() => travelBreakdown.lines.map((line) => ({
 label: line.label,
 amount: line.costAmount,
 notes: cleanRouteNote(line.notes),
 })), [travelBreakdown.lines]);

 // Marge → nivell visual reutilitzant els tons existents (.ap-ledger-kpi data-level).
 const netLevel = !economia
 ? 'info'
 : economia.marginTone.tone === 'rose' ? 'critical'
 : economia.marginTone.tone === 'orange' ? 'warn'
 : 'ok';

 const handleSave = async (): Promise<boolean> => {
 setSaving(true);
 try {
 // Persisteix l'atribució del transport (#1357): les línies [travel-cost] amb el
 // collaboratorId de qui posa el cotxe / condueix / viatja. Es desen amagades
 // (isTravelCostLine les filtra de la vista) però alimenten el repartiment i el marge.
 const travelLines: BookingServiceLineFormInput[] = (Number(distanceKm) || 0) > 0
 ? travelBreakdown.lines.map((line) => ({
 kind: 'OTHER' as const,
 label: line.label,
 revenueAmount: 0,
 costAmount: line.costAmount,
 quantity: 1,
 collaboratorId: line.collaboratorId ?? undefined,
 notes: line.notes,
 }))
 : [];
 const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/service-lines`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ lines: [...buildAllLines(), ...travelLines], distanceKm: Number(distanceKm) || null, tollsEur: Number(tollsEur) || null }),
 });
 if (!res.ok) throw new Error('No s\'ha pogut desar');
 toast.success('Bolo desat.');
 setDirty(false);
 return true;
 } catch (e) {
 console.error('[LeadBolo] desar', e);
 toast.error('Error desant el bolo.');
 return false;
 } finally {
 setSaving(false);
 }
 };

 const buildDossierHref = () => {
 const params = new URLSearchParams({ leadId });
 params.set('nom', documentContext.name);
 if (documentContext.email) params.set('email', documentContext.email);
 if (documentContext.phone) params.set('telefon', documentContext.phone);
 const eventParts = [
 documentContext.eventDate,
 documentContext.eventStartTime && documentContext.eventEndTime
 ? `${documentContext.eventStartTime}-${documentContext.eventEndTime}`
 : documentContext.eventStartTime,
 documentContext.eventLocation,
 documentContext.eventAddress,
 documentContext.guestCount ? `${documentContext.guestCount} pax` : null,
 ].filter(Boolean);
 if (eventParts.length > 0) params.set('eventDesc', eventParts.join(' · '));
 const productIds = buildAllLines()
 .map((line) => line.collaboratorId)
 .filter((id): id is string => Boolean(id))
 .map((id) => id.startsWith('collab:') ? id : `collab:${id}`);
 if (productIds.length > 0) params.set('productIds', Array.from(new Set(productIds)).join(','));
 return `/admin/dossiers?${params.toString()}`;
 };

 const openBuilder = async (
 event: MouseEvent<HTMLAnchorElement>,
 href: string,
 ) => {
 if (!dirty) return;
 event.preventDefault();
 const saved = await handleSave();
 if (saved) window.location.assign(href);
 };

 const quoteHref = `/admin/presupuestos?leadId=${encodeURIComponent(leadId)}`;
 const dossierHref = buildDossierHref();

 if (loading) {
 return (
 <section className="ap-ledger-panel">
 <div className="ap-ledger-panelhead"><span>El bolo</span></div>
 <p className="ap-ledger-hint-inline">Carregant…</p>
 </section>
 );
 }

 return (
 <div className="ap-ledger-boloside">
 <section className="ap-ledger-panel">
 <div className="ap-ledger-panelhead">
 <span>El bolo</span>
 <button type="button" className="ap-btn ap-btn--primary" onClick={handleSave} disabled={saving || !dirty}>
 {saving ? 'Desant…' : 'Desar bolo'}
 </button>
 </div>
 <BookingServiceLinesSection
 embedded
 baseLines={baseLines}
 lines={lines}
 onChange={onLinesChange}
 />

 {/* ── PRESSUPOST: elements + transport → suma + total, exposat abans de contractar (#1348).
 Estirat a tota l'amplada. El transport el paga el CLIENT (línia estipulada que suma al total). ── */}
 {economia && (
 <div className="ap-ledger-budget" aria-label="Resum del pressupost">
 <div className="ap-ledger-budget-travel">
 <label className="ap-ledger-travel-field">
 <span>Km ruta</span>
 <input
 type="number" min={0} step={1} inputMode="numeric" className="adm-input"
 value={distanceKm}
 onChange={(e) => { setDistanceKm(e.target.value); setDirty(true); }}
 placeholder={calculatingDistance ? '…' : '0'}
 aria-label="Km anada i tornada de la ruta"
 />
 </label>
 <label className="ap-ledger-travel-field">
 <span>Integrants</span>
 <input
 type="number" min={0} step={1} inputMode="numeric" className="adm-input"
 value={headcountOverride}
 onChange={(e) => setHeadcountOverride(e.target.value)}
 placeholder={String(derivedHeadcount)}
 aria-label="Ajust manual d'integrants de la ruta"
 />
 </label>
 <label className="ap-ledger-travel-field">
 <span>Peatges €</span>
 <input
 type="number" min={0} step="0.01" inputMode="decimal" className="adm-input"
 value={tollsEur}
 onChange={(e) => { setTollsEur(e.target.value); setDirty(true); }}
 placeholder="0"
 aria-label="Peatges de la ruta en euros"
 />
 </label>
 {travelCollaborators.length > 0 && (
 <>
 <label className="ap-ledger-travel-field">
 <span>Cotxe</span>
 <select className="adm-input" value={vehicleOwnerId} onChange={(e) => { setVehicleOwnerId(e.target.value); setDirty(true); }} aria-label="Qui posa el cotxe">
 <option value="">Òrbita</option>
 {travelCollaborators.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
 </select>
 </label>
 <label className="ap-ledger-travel-field">
 <span>Condueix</span>
 <select className="adm-input" value={driverId} onChange={(e) => { setDriverId(e.target.value); setDirty(true); }} aria-label="Qui condueix">
 <option value="">Òrbita</option>
 {travelCollaborators.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
 </select>
 </label>
 </>
 )}
 <p className="ap-ledger-budget-travelnote">
 1a hora de ruta inclosa · es cobren {formatNumber(travelBreakdown.chargeableHours)} h de {formatNumber(travelBreakdown.routeHours)} h · cotxe: {nameFor(vehicleOwnerId)} · condueix: {nameFor(driverId)}
 </p>
 </div>
 <div className="ap-ledger-budget-sum">
 <div className="ap-ledger-budget-row">
 <span>Serveis</span>
 <strong>{formatCurrency(economia.total - travelCharge)}</strong>
 </div>
 <div className="ap-ledger-budget-row ap-ledger-budget-row--travel">
 <span>Transport al client<em>cotxe {km} km + {formatNumber(travelBreakdown.chargeableHours)} h × {headcount} pers.{travelBreakdown.tollsCost > 0 ? ` + ${formatCurrency(travelBreakdown.tollsCost)} peatges` : ''} (1a h inclosa)</em></span>
 <strong>+{formatCurrency(travelCharge)}</strong>
 </div>
 <div className="ap-ledger-budget-row ap-ledger-budget-row--total">
 <span>Total client</span>
 <strong>{formatCurrency(economia.total)}</strong>
 </div>
 </div>
 <div className="ap-ledger-route-settlement" aria-label="Repartiment econòmic del transport">
 <div className="ap-ledger-route-settlement-head">
 <span>Repartiment ruta</span>
 <strong>{formatCurrency(effectiveTravelCost)}</strong>
 </div>
 <div className="ap-ledger-route-settlement-grid">
 {routeSettlementLines.length > 0 ? routeSettlementLines.map((line, idx) => (
 <div key={`${line.label}-${idx}`} className="ap-ledger-route-settlement-row">
 <span>
 {line.label}
 <em>{line.notes}</em>
 </span>
 <strong>{formatCurrency(line.amount)}</strong>
 </div>
 )) : (
 <div className="ap-ledger-route-settlement-row">
 <span>Sense cost de ruta<em>afegeix km i integrants per calcular-lo</em></span>
 <strong>{formatCurrency(0)}</strong>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 <div className="ap-ledger-bolo-actions ap-ledger-bolo-actions--full">
 <a className="ap-btn" href={dossierHref} onClick={(event) => openBuilder(event, dossierHref)} aria-disabled={saving}>
 Crear dossier
 </a>
 <a className="ap-btn" href={quoteHref} onClick={(event) => openBuilder(event, quoteHref)} aria-disabled={saving}>
 Crear pressupost
 </a>
 <a className="ap-btn ap-btn--primary" href={`/admin/bookings/new?leadId=${encodeURIComponent(leadId)}`}>
 Crear reserva
 </a>
 </div>
 </section>

 {/* ── Fulla d'economia del bolo (net per bolo) — Fase 4 ── */}
 {!compactEconomia && <section className="ap-ledger-econo">
 <div className="ap-ledger-econohead">
 <span>Economia del bolo</span>
 <span className="ap-ledger-econonote">net per bolo · preus orientatius</span>
 </div>
 {!economia ? (
 <p className="ap-ledger-econonote">Afegeix un pack o línies al bolo per veure el net.</p>
 ) : (
 <div className="ap-ledger-kpis">
 <div className="ap-ledger-kpi" data-level="gold">
 <div className="ap-ledger-kpi-val">{formatCurrency(economia.total)}</div>
 <div className="ap-ledger-kpi-lbl">Ingrés del bolo</div>
 <div className="ap-ledger-kpi-sub">suma de les línies</div>
 </div>
 <div className="ap-ledger-kpi" data-level="info">
 <div className="ap-ledger-kpi-val">{formatCurrency(economia.directCost)}</div>
 <div className="ap-ledger-kpi-lbl">Cost directe</div>
 <div className="ap-ledger-kpi-sub">
 {formatCurrency(economia.serviceLinesCost)} línies + {formatCurrency(economia.fixedOperationalCost)} operatiu
 </div>
 </div>
 <div className="ap-ledger-kpi" data-level={netLevel}>
 <div className="ap-ledger-kpi-val">{formatCurrency(economia.netMargin)}</div>
 <div className="ap-ledger-kpi-lbl">Net per bolo</div>
 <div className="ap-ledger-kpi-sub">
 {Math.round(economia.marginPct)}% marge · {economia.marginTone.label}
 </div>
 </div>
 </div>
 )}
 </section>}

 </div>
 );
}
