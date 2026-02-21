'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';
import { calculateBillableTravelKm, calculateTravelBlocks, calculateTravelCharge, calculateTravelCost, DEFAULT_FUEL_COST_PER_KM, getIncludedTravelOneWayKm, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_EUR, TRAVEL_BLOCK_KM } from '@/lib/services/travelCost';

interface BookingMarginProps {
  bookingId: string;
  total: number;
  packPrice: number;
  extrasTotal: number;
  extraHours: number;
  extraHourPrice: number;
  distanceKm: number | null;
  fuelCostPerKm: number | null;
  travelCost: number | null;
  source: string;
  eventLocation?: string | null;
  eventVenue?: string | null;
  inventoryCostReal?: number | null;
  inventoryHours?: number | null;
  inventoryRemainingHoursAvg?: number | null;
  inventoryRemainingHoursMin?: number | null;
  packCostRatio: number;
  extraCostRatio: number;
  extraHourCostRatio: number;
  fixedOperationalCost: number;
  targetMarginPct: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

export default function BookingMarginCard({
  bookingId,
  total,
  packPrice,
  extrasTotal,
  extraHours,
  extraHourPrice,
  distanceKm: initialDistanceKm,
  fuelCostPerKm: initialFuelCostPerKm,
  travelCost: initialTravelCost,
  source,
  eventLocation,
  eventVenue,
  inventoryCostReal,
  inventoryHours,
  inventoryRemainingHoursAvg,
  inventoryRemainingHoursMin,
  packCostRatio,
  extraCostRatio,
  extraHourCostRatio,
  fixedOperationalCost,
  targetMarginPct,
}: BookingMarginProps) {
  const router = useRouter();

  // Editable travel fields
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm ?? 0);
  const [fuelCostPerKm] = useState(initialFuelCostPerKm ?? DEFAULT_FUEL_COST_PER_KM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceMessage, setDistanceMessage] = useState<string | null>(null);
  const lastDistanceDestinationRef = useRef('');

  const billableKm = calculateBillableTravelKm(distanceKm, INCLUDED_TRAVEL_KM);
  const travelBlocks = calculateTravelBlocks(distanceKm, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM);
  const calculatedTravelCost = calculateTravelCost(distanceKm, fuelCostPerKm, INCLUDED_TRAVEL_KM);
  const calculatedTravelCharge = calculateTravelCharge(distanceKm, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM, TRAVEL_BLOCK_EUR);
  const includedOneWayKm = getIncludedTravelOneWayKm(INCLUDED_TRAVEL_KM);
  const travelNetMargin = calculatedTravelCharge - calculatedTravelCost;
  const travelMarginPct = calculatedTravelCharge > 0 ? (travelNetMargin / calculatedTravelCharge) * 100 : 0;

  const packEstimatedCost = packPrice * packCostRatio;
  const packCostUsed = typeof inventoryCostReal === 'number' && inventoryCostReal > 0
    ? inventoryCostReal
    : packEstimatedCost;
  const extrasCost = extrasTotal * extraCostRatio;
  const extraHoursCost = extraHours * extraHourPrice * extraHourCostRatio;

  // Margin calculation
  const directCost =
    packCostUsed +
    extrasCost +
    extraHoursCost +
    fixedOperationalCost +
    calculatedTravelCost;

  const netMargin = total - directCost;
  const marginPct = total > 0 ? (netMargin / total) * 100 : 0;
  const targetMarginAmount = total * (targetMarginPct / 100);
  const marginDeltaVsTarget = netMargin - targetMarginAmount;

  const marginColor =
    marginPct >= 50 ? 'text-emerald-300' :
    marginPct >= 30 ? 'text-amber-300' :
    marginPct >= 15 ? 'text-orange-300' :
    'text-rose-300';

  const marginBg =
    marginPct >= 50 ? 'border-emerald-400/30 bg-emerald-950/30' :
    marginPct >= 30 ? 'border-amber-400/30 bg-amber-950/30' :
    marginPct >= 15 ? 'border-orange-400/30 bg-orange-950/30' :
    'border-rose-400/30 bg-rose-950/30';

  const travelMarginColor =
    travelMarginPct >= 45 ? 'text-emerald-300' :
    travelMarginPct >= 20 ? 'text-orange-300' :
    'text-rose-300';

  const travelMarginCardBorder =
    travelMarginPct >= 45 ? 'border-emerald-400/30' :
    travelMarginPct >= 20 ? 'border-orange-400/30' :
    'border-rose-400/30';

  const travelMarginCardBg =
    travelMarginPct >= 45 ? 'bg-emerald-950/20' :
    travelMarginPct >= 20 ? 'bg-orange-950/20' :
    'bg-rose-950/20';

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distanceKm,
          fuelCostPerKm,
          travelCost: calculatedTravelCost,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error desant');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (error) {
      log.error('Error saving travel cost', error);
      alert(error instanceof Error ? error.message : 'Error desant costos');
    } finally {
      setSaving(false);
    }
  }, [bookingId, distanceKm, fuelCostPerKm, calculatedTravelCost, router]);

  const persistDistance = useCallback(async (nextDistanceKm: number) => {
    try {
      await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distanceKm: nextDistanceKm,
          fuelCostPerKm,
          travelCost: calculateTravelCost(nextDistanceKm, fuelCostPerKm, INCLUDED_TRAVEL_KM),
        }),
      });
    } catch {
      // Silent: mantenim el valor local encara que falli la persistència
    }
  }, [bookingId, fuelCostPerKm]);

  const calculateDistanceForDestination = useCallback(async (destination: string) => {
    setCalculatingDistance(true);
    setDistanceMessage(null);
    try {
      const res = await fetch('/api/admin/maps/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut calcular la distància');
      }

      const nextDistanceKm = Number(data.roundTripKm || 0);
      setDistanceKm(nextDistanceKm);
      lastDistanceDestinationRef.current = destination;
      void persistDistance(nextDistanceKm);
      setDistanceMessage(`Ruta: ${data.oneWayKm || 0} km anada · ${data.roundTripKm || 0} km anada+tornada`);
    } catch (error) {
      setDistanceMessage(error instanceof Error ? error.message : 'Error calculant ruta');
    } finally {
      setCalculatingDistance(false);
    }
  }, [persistDistance]);

  useEffect(() => {
    const destination = [eventVenue || '', eventLocation || ''].filter(Boolean).join(', ').trim();
    if (!destination) return;
    if (destination === lastDistanceDestinationRef.current) return;

    const timer = setTimeout(() => {
      void calculateDistanceForDestination(destination);
    }, 450);

    return () => clearTimeout(timer);
  }, [eventLocation, eventVenue, calculateDistanceForDestination]);

  const hasChanged =
    distanceKm !== (initialDistanceKm ?? 0);

  return (
    <section className={`rounded-xl border shadow-sm p-6 ${marginBg}`}>
      <h2 className="text-lg font-semibold text-slate-200 mb-4">
        📊 Marge i Costos
      </h2>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Ingrés total</p>
          <p className="text-lg font-bold text-slate-200">{formatCurrency(total)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Cost directe</p>
          <p className="text-lg font-bold text-slate-200">{formatCurrency(directCost)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">Marge net</p>
          <p className={`text-lg font-bold ${marginColor}`}>{formatCurrency(netMargin)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">% Marge</p>
          <p className={`text-2xl font-black ${marginColor}`}>{marginPct.toFixed(1)}%</p>
        </div>
      </div>

      {/* Sumatori clar */}
      <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Sumatori de costos i marge</h3>
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex justify-between"><span>Cost pack (real/estimat)</span><span>{formatCurrency(packCostUsed)}</span></div>
          <div className="flex justify-between"><span>Cost extres</span><span>{formatCurrency(extrasCost)}</span></div>
          <div className="flex justify-between"><span>Cost hores extra</span><span>{formatCurrency(extraHoursCost)}</span></div>
          <div className="flex justify-between"><span>Cost operacional fix</span><span>{formatCurrency(fixedOperationalCost)}</span></div>
          <div className="flex justify-between"><span>Cost benzina intern</span><span>{formatCurrency(calculatedTravelCost)}</span></div>
          <div className="flex justify-between border-t border-white/10 pt-1.5"><span>Cost directe total</span><span className="font-semibold">{formatCurrency(directCost)}</span></div>
          <div className="flex justify-between"><span>Ingressos reserva</span><span>{formatCurrency(total)}</span></div>
          <div className="flex justify-between"><span>Diferencial de marge (ingrés - cost)</span><span className={marginColor}>{formatCurrency(netMargin)}</span></div>
          <div className="flex justify-between"><span>Marge objectiu ({targetMarginPct.toFixed(1)}%)</span><span>{formatCurrency(targetMarginAmount)}</span></div>
          <div className="flex justify-between">
            <span>Diferencial vs objectiu</span>
            <span className={marginDeltaVsTarget >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {formatCurrency(marginDeltaVsTarget)}
            </span>
          </div>
          {typeof inventoryRemainingHoursAvg === 'number' && (
            <div className="flex justify-between border-t border-white/10 pt-1.5">
              <span>Vida útil mitjana material assignat</span>
              <span>{inventoryRemainingHoursAvg.toFixed(0)}h restants</span>
            </div>
          )}
          {typeof inventoryRemainingHoursMin === 'number' && (
            <div className="flex justify-between">
              <span>Element més crític (mínim)</span>
              <span className={inventoryRemainingHoursMin < 200 ? 'text-rose-300' : 'text-slate-200'}>
                {inventoryRemainingHoursMin.toFixed(0)}h restants
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="text-sm text-slate-400 space-y-1 mb-6 border-t border-white/10 pt-4">
        <div className="flex justify-between">
          <span>
            {typeof inventoryCostReal === 'number' && inventoryCostReal > 0
              ? `Pack (inventari real${inventoryHours ? ` · ${inventoryHours.toFixed(1)}h` : ''})`
              : `Pack (${(packCostRatio * 100).toFixed(0)}% de ${formatCurrency(packPrice)})`}
          </span>
          <span className="text-slate-300">{formatCurrency(packCostUsed)}</span>
        </div>
        {extrasTotal > 0 && (
          <div className="flex justify-between">
            <span>Extras ({(extraCostRatio * 100).toFixed(0)}% de {formatCurrency(extrasTotal)})</span>
            <span className="text-slate-300">{formatCurrency(extrasCost)}</span>
          </div>
        )}
        {extraHours > 0 && (
          <div className="flex justify-between">
            <span>Hores extra ({extraHours}h × {formatCurrency(extraHourPrice)})</span>
            <span className="text-slate-300">{formatCurrency(extraHoursCost)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Cost operacional fix</span>
          <span className="text-slate-300">{formatCurrency(fixedOperationalCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>Desplaçament ({travelBlocks} trams de {TRAVEL_BLOCK_KM} km)</span>
          <span className="text-amber-300">{formatCurrency(calculatedTravelCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>Suplement client ({travelBlocks} trams)</span>
          <span className="text-cyan-300">{formatCurrency(calculatedTravelCharge)}</span>
        </div>
        <div className="flex justify-between">
          <span>Marge transport</span>
          <span className={travelMarginColor}>
            {formatCurrency(travelNetMargin)} {calculatedTravelCharge > 0 ? `(${travelMarginPct.toFixed(1)}%)` : ''}
          </span>
        </div>
      </div>

      {/* Editable travel fields */}
      <div className="border-t border-white/10 pt-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">🚗 Desplaçament (editable)</h3>
        <p className="mb-3 text-xs text-emerald-300">
          Inclòs: {INCLUDED_TRAVEL_KM} km totals ({includedOneWayKm} anada + {includedOneWayKm} tornada). Després: {TRAVEL_BLOCK_EUR} € per cada {TRAVEL_BLOCK_KM} km extra.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Distància (km)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Km extra</label>
            <div className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-sm">
              {billableKm} km
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Cost viatge</label>
            <div className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-amber-300 text-sm font-bold">
              {formatCurrency(calculatedTravelCost)}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {travelBlocks} trams × {TRAVEL_BLOCK_EUR} €
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Cost benzina intern</p>
            <p className="text-sm font-semibold text-amber-300">{formatCurrency(calculatedTravelCost)}</p>
            <p className="text-[11px] text-slate-500">{distanceKm.toFixed(1)} km × {fuelCostPerKm.toFixed(2)} €/km</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Ingressos transport</p>
            <p className="text-sm font-semibold text-cyan-300">{formatCurrency(calculatedTravelCharge)}</p>
            <p className="text-[11px] text-slate-500">{travelBlocks} trams × {TRAVEL_BLOCK_EUR} €</p>
          </div>
          <div className={`rounded-lg border p-3 ${travelMarginCardBorder} ${travelMarginCardBg}`}>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Marge real transport</p>
            <p className={`text-sm font-semibold ${travelMarginColor}`}>
              {formatCurrency(travelNetMargin)}
            </p>
            <p className="text-[11px] text-slate-500">
              {calculatedTravelCharge > 0 ? `${travelMarginPct.toFixed(1)}% de marge` : 'Sense suplement aplicat'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {calculatingDistance && <p className="text-xs text-amber-300">Calculant ruta automàticament...</p>}
          {distanceMessage && <p className="text-xs text-slate-300">{distanceMessage}</p>}
        </div>
        {hasChanged && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {saved ? '✅ Desat!' : saving ? '⏳ Desant...' : '💾 Desar canvis'}
          </button>
        )}
      </div>
    </section>
  );
}
