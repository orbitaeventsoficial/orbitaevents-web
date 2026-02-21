'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';

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
}

// Default ratios (must match profitabilityService defaults)
const DEFAULT_PACK_COST_RATIO = 0.36;
const DEFAULT_EXTRA_COST_RATIO = 0.28;
const DEFAULT_EXTRA_HOUR_COST_RATIO = 0.20;
const DEFAULT_FIXED_OPERATIONAL_COST = 45;

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
}: BookingMarginProps) {
  const router = useRouter();

  // Editable travel fields
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm ?? 0);
  const [fuelCostPerKm, setFuelCostPerKm] = useState(initialFuelCostPerKm ?? 0.19);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceMessage, setDistanceMessage] = useState<string | null>(null);

  const calculatedTravelCost = Math.round(distanceKm * fuelCostPerKm * 100) / 100;

  // Margin calculation
  const directCost =
    packPrice * DEFAULT_PACK_COST_RATIO +
    extrasTotal * DEFAULT_EXTRA_COST_RATIO +
    extraHours * extraHourPrice * DEFAULT_EXTRA_HOUR_COST_RATIO +
    DEFAULT_FIXED_OPERATIONAL_COST +
    calculatedTravelCost;

  const netMargin = total - directCost;
  const marginPct = total > 0 ? (netMargin / total) * 100 : 0;

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

  const handleCalculateDistance = useCallback(async () => {
    const destination = [eventVenue || '', eventLocation || ''].filter(Boolean).join(', ').trim();
    if (!destination) {
      setDistanceMessage('Cal omplir la ubicació de l\'esdeveniment per calcular la ruta.');
      return;
    }

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

      setDistanceKm(Number(data.roundTripKm || 0));
      setDistanceMessage(`Ruta: ${data.oneWayKm || 0} km anada · ${data.roundTripKm || 0} km anada+tornada`);
    } catch (error) {
      setDistanceMessage(error instanceof Error ? error.message : 'Error calculant ruta');
    } finally {
      setCalculatingDistance(false);
    }
  }, [eventLocation, eventVenue]);

  const hasChanged =
    distanceKm !== (initialDistanceKm ?? 0) ||
    fuelCostPerKm !== (initialFuelCostPerKm ?? 0.19);

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

      {/* Cost breakdown */}
      <div className="text-sm text-slate-400 space-y-1 mb-6 border-t border-white/10 pt-4">
        <div className="flex justify-between">
          <span>Pack ({(DEFAULT_PACK_COST_RATIO * 100).toFixed(0)}% de {formatCurrency(packPrice)})</span>
          <span className="text-slate-300">{formatCurrency(packPrice * DEFAULT_PACK_COST_RATIO)}</span>
        </div>
        {extrasTotal > 0 && (
          <div className="flex justify-between">
            <span>Extras ({(DEFAULT_EXTRA_COST_RATIO * 100).toFixed(0)}% de {formatCurrency(extrasTotal)})</span>
            <span className="text-slate-300">{formatCurrency(extrasTotal * DEFAULT_EXTRA_COST_RATIO)}</span>
          </div>
        )}
        {extraHours > 0 && (
          <div className="flex justify-between">
            <span>Hores extra ({extraHours}h × {formatCurrency(extraHourPrice)})</span>
            <span className="text-slate-300">{formatCurrency(extraHours * extraHourPrice * DEFAULT_EXTRA_HOUR_COST_RATIO)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Cost operacional fix</span>
          <span className="text-slate-300">{formatCurrency(DEFAULT_FIXED_OPERATIONAL_COST)}</span>
        </div>
        <div className="flex justify-between">
          <span>Desplaçament ({distanceKm} km × {fuelCostPerKm}€/km)</span>
          <span className="text-amber-300">{formatCurrency(calculatedTravelCost)}</span>
        </div>
      </div>

      {/* Editable travel fields */}
      <div className="border-t border-white/10 pt-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">🚗 Desplaçament (editable)</h3>
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
            <label className="block text-xs font-medium text-slate-400 mb-1">€/km (AEAT)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fuelCostPerKm}
              onChange={(e) => setFuelCostPerKm(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Cost viatge</label>
            <div className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-amber-300 text-sm font-bold">
              {formatCurrency(calculatedTravelCost)}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCalculateDistance}
            disabled={calculatingDistance || !(eventLocation || eventVenue)}
            className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {calculatingDistance ? 'Calculant...' : 'Calcular amb Google Maps'}
          </button>
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
