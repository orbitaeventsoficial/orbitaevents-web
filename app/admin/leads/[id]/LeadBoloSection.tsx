'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '@/app/admin/components/ToastProvider';
import BookingServiceLinesSection from '@/app/admin/bookings/BookingServiceLinesSection';
import type { BookingServiceLineFormInput, BookingPack } from '@/app/admin/bookings/booking-form.types';
import { computeBookingFinancialSummary, aggregateServiceLines } from '@/lib/services/costEngine';
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
  serviceLinesCost: number;
  fixedOperationalCost: number;
  tone: 'emerald' | 'amber' | 'orange' | 'rose';
  label: string;
}

export default function LeadBoloSection({
  leadId,
  source,
  onEconomiaChange,
  compactEconomia = false,
}: {
  leadId: string;
  source?: string | null;
  onEconomiaChange?: (e: BoloEconomia | null) => void;
  compactEconomia?: boolean;
}) {
  const toast = useToast();
  const [lines, setLines] = useState<BookingServiceLineFormInput[]>([]);
  const [packs, setPacks] = useState<BookingPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState('');
  const [customPackPrice, setCustomPackPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [linesRes, packsRes] = await Promise.all([
          fetchWithCsrf(`/api/admin/leads/${leadId}/service-lines`),
          fetchWithCsrf('/api/admin/packs'),
        ]);
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
        if (packsRes.ok) {
          const p = await packsRes.json();
          const packList = (p.packs || p.data || []) as BookingPack[];
          setPacks(packList.filter((x) => x.translations?.length));
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
  const onPackSelect = useCallback((packId: string) => {
    setSelectedPackId(packId);
    setCustomPackPrice('');
    setDirty(true);
  }, []);

  // El pack triat es desa com una línia més del bolo (kind OTHER, label del pack).
  const buildAllLines = useCallback((): BookingServiceLineFormInput[] => {
    const pack = packs.find((p) => p.id === selectedPackId);
    if (!pack) return lines;
    const packLine: BookingServiceLineFormInput = {
      kind: 'OTHER',
      label: `Pack: ${pack.translations?.[0]?.name || pack.slug}`,
      revenueAmount: customPackPrice ? Number(customPackPrice) : pack.price,
      quantity: 1,
    };
    return [packLine, ...lines];
  }, [packs, selectedPackId, customPackPrice, lines]);

  // Fulla d'economia del bolo (Fase 4 de docs/bolo-flux.md). La pasta NO viu al
  // configurador: cada línia porta el cost amagat i alimenta SOLA aquesta fulla.
  // Cost de cada línia: el cost explícit (partners) o, per a línies pròpies d'Òrbita
  // sense cost, s'imputa cost intern via `orbitaServiceCostRatio` (el DJ no és cost 0).
  // Els agregats passen a `computeBookingFinancialSummary` (font única de marge).
  const economia = useMemo(() => {
    const { revenue, cost } = aggregateServiceLines(buildAllLines());
    if (revenue <= 0) return null;
    return computeBookingFinancialSummary({
      total: revenue,
      packPrice: 0, extrasTotal: 0, extraHours: 0, extraHourPrice: 0,
      distanceKm: 0, travelCost: 0,
      serviceLinesRevenue: revenue, serviceLinesCost: cost,
      source: source ?? null,
    }, PROFITABILITY_MODEL_DEFAULTS);
  }, [buildAllLines, source]);

  // Eleva el net al contenidor (perquè visqui al hero de la fitxa, no enterrat a baix).
  useEffect(() => {
    if (!onEconomiaChange) return;
    onEconomiaChange(economia
      ? {
          net: economia.netMargin,
          marginPct: economia.marginPct,
          total: economia.total,
          directCost: economia.directCost,
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

  const handleSave = async () => {
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
    } catch (e) {
      console.error('[LeadBolo] desar', e);
      toast.error('Error desant el bolo.');
    } finally {
      setSaving(false);
    }
  };

  // Desa el bolo (si cal) i després executa l'acció de generació.
  const generate = async (mode: 'full' | 'quote') => {
    if (dirty) await handleSave();
    setSaving(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/generate-dossier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error('No s\'ha pogut generar');
      toast.success(mode === 'quote' ? 'Pressupost creat.' : 'Dossier creat.');
    } catch (e) {
      console.error('[LeadBolo] generar', e);
      toast.error('Error generant el document.');
    } finally {
      setSaving(false);
    }
  };

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
          lines={lines}
          onChange={onLinesChange}
          packs={packs}
          selectedPackId={selectedPackId}
          onPackSelect={onPackSelect}
          customPackPrice={customPackPrice}
          onCustomPackPriceChange={(v) => { setCustomPackPrice(v); setDirty(true); }}
        />

        <div className="fxd__bolo-actions">
          <button type="button" className="fxd__btn" onClick={() => generate('full')} disabled={saving}>
            Crear dossier
          </button>
          <button type="button" className="fxd__btn" onClick={() => generate('quote')} disabled={saving}>
            Crear pressupost
          </button>
          <a className="fxd__btn fxd__btn--primary" href={`/admin/bookings/new?leadId=${encodeURIComponent(leadId)}`}>
            Crear reserva
          </a>
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
