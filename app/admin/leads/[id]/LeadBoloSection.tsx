'use client';

import { useEffect, useState, useCallback, useMemo, type MouseEvent } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import BookingServiceLinesSection from '@/app/admin/bookings/BookingServiceLinesSection';
import type { BookingServiceLineFormInput } from '@/app/admin/bookings/booking-form.types';
import { computeBookingFinancialSummary, aggregateServiceLines, classifyBoloLines } from '@/lib/services/costEngine';
import { EQUIPMENT_RENTAL_TRANSPORT_KM, DEFAULT_VEHICLE_COST_PER_KM } from '@/lib/services/travelCost';
import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { formatCurrency } from '@/lib/constants';

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
  directCost: number;
  acquisitionCost: number;
  serviceLinesCost: number;
  fixedOperationalCost: number;
  tone: 'emerald' | 'amber' | 'orange' | 'rose';
  label: string;
}

export default function LeadBoloSection({
  leadId,
  documentContext,
  contractedProducts = [],
  source,
  vehicleCostPerKm = DEFAULT_VEHICLE_COST_PER_KM,
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
  onEconomiaChange?: (e: BoloEconomia | null) => void;
  compactEconomia?: boolean;
}) {
  const toast = useToast();
  const [lines, setLines] = useState<BookingServiceLineFormInput[]>([]);
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
    const { revenue, cost } = aggregateServiceLines(allLines, 0);
    if (revenue <= 0) return null;
    // Cost operatiu real (vegeu docs/bolo-flux.md):
    // - cost fix (desgast + amortització + consumibles) NOMÉS si el bolo porta
    //   equip propi d'Òrbita (DJ o material propi); Masquerade sol → 0.
    // - el transport d'anar a buscar material de lloguer (Tino) el carrega la
    //   pròpia línia de lloguer, sumat al seu cost.
    const { hasOwnEquipment, hasEquipmentRental } = classifyBoloLines(allLines);
    const rentalTransport = hasEquipmentRental ? EQUIPMENT_RENTAL_TRANSPORT_KM * vehicleCostPerKm : 0;
    const summary = computeBookingFinancialSummary({
      total: revenue,
      packPrice: 0, extrasTotal: 0, extraHours: 0, extraHourPrice: 0,
      distanceKm: 0, travelCost: 0,
      serviceLinesRevenue: revenue, serviceLinesCost: cost + rentalTransport,
      source: source ?? null,
    }, {
      ...PROFITABILITY_MODEL_DEFAULTS,
      fixedOperationalCost: hasOwnEquipment ? PROFITABILITY_MODEL_DEFAULTS.fixedOperationalCost : 0,
    });
    return summary;
  }, [buildVisibleLines, source, vehicleCostPerKm]);

  // Eleva el net al contenidor (perquè visqui al hero de la fitxa, no enterrat a baix).
  useEffect(() => {
    if (!onEconomiaChange) return;
    onEconomiaChange(economia
      ? {
          net: economia.netMargin,
          marginPct: economia.marginPct,
          total: economia.total,
          directCost: economia.directCost,
          acquisitionCost: economia.acquisitionCost,
          serviceLinesCost: economia.serviceLinesCost,
          fixedOperationalCost: economia.fixedOperationalCost,
          tone: economia.marginTone.tone,
          label: economia.marginTone.label,
        }
      : null);
  }, [economia, onEconomiaChange]);

  // Marge → nivell visual reutilitzant els tons existents (.fxd__kpi data-level).
  const netLevel = !economia
    ? 'info'
    : economia.marginTone.tone === 'rose' ? 'critical'
    : economia.marginTone.tone === 'orange' ? 'warn'
    : 'ok';

  const handleSave = async (): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/service-lines`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: buildAllLines() }),
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
      <section className="fxd__panel">
        <div className="fxd__panelhead"><span>El bolo</span></div>
        <p className="fxd__hint-inline">Carregant…</p>
      </section>
    );
  }

  return (
    <div className="fxd__boloside">
      <section className="fxd__panel">
        <div className="fxd__panelhead">
          <span>El bolo</span>
          <button type="button" className="fxd__btn fxd__btn--primary" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? 'Desant…' : 'Desar bolo'}
          </button>
        </div>
        <BookingServiceLinesSection
          embedded
          baseLines={baseLines}
          lines={lines}
          onChange={onLinesChange}
        />

        <div className="fxd__bolo-footer">
          <div className="fxd__bolo-total" aria-label="Total del bolo">
            <span>Total bolo</span>
            <strong>{economia ? formatCurrency(economia.total) : '0€'}</strong>
          </div>
          <div className="fxd__bolo-actions">
            <a className="fxd__btn" href={dossierHref} onClick={(event) => openBuilder(event, dossierHref)} aria-disabled={saving}>
              Crear dossier
            </a>
            <a className="fxd__btn" href={quoteHref} onClick={(event) => openBuilder(event, quoteHref)} aria-disabled={saving}>
              Crear pressupost
            </a>
            <a className="fxd__btn fxd__btn--primary" href={`/admin/bookings/new?leadId=${encodeURIComponent(leadId)}`}>
              Crear reserva
            </a>
          </div>
        </div>
      </section>

      {/* ── Fulla d'economia del bolo (net per bolo) — Fase 4 ── */}
      {!compactEconomia && <section className="fxd__econo">
        <div className="fxd__econohead">
          <span>Economia del bolo</span>
          <span className="fxd__econonote">net per bolo · preus orientatius</span>
        </div>
        {!economia ? (
          <p className="fxd__econonote">Afegeix un pack o línies al bolo per veure el net.</p>
        ) : (
          <div className="fxd__kpis">
            <div className="fxd__kpi" data-level="gold">
              <div className="fxd__kpi-val">{formatCurrency(economia.total)}</div>
              <div className="fxd__kpi-lbl">Ingrés del bolo</div>
              <div className="fxd__kpi-sub">suma de les línies</div>
            </div>
            <div className="fxd__kpi" data-level="info">
              <div className="fxd__kpi-val">{formatCurrency(economia.directCost)}</div>
              <div className="fxd__kpi-lbl">Cost directe</div>
              <div className="fxd__kpi-sub">
                {formatCurrency(economia.serviceLinesCost)} línies + {formatCurrency(economia.fixedOperationalCost)} operatiu
              </div>
            </div>
            <div className="fxd__kpi" data-level={netLevel}>
              <div className="fxd__kpi-val">{formatCurrency(economia.netMargin)}</div>
              <div className="fxd__kpi-lbl">Net per bolo</div>
              <div className="fxd__kpi-sub">
                {Math.round(economia.marginPct)}% marge · {economia.marginTone.label}
              </div>
            </div>
          </div>
        )}
      </section>}
    </div>
  );
}
