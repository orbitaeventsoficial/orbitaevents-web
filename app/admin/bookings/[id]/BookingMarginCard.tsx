'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';
import { calculateBillableTravelKm, calculateTravelBlocks, calculateTravelCharge, calculateTravelCost, DEFAULT_VEHICLE_COST_PER_KM, getIncludedTravelOneWayKm, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_EUR, TRAVEL_BLOCK_KM } from '@/lib/services/travelCost';
import { formatCurrency } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';
import { getMarginTone, getTravelMarginTone } from '@/lib/margin-utils';
import Tooltip from '@/app/admin/components/Tooltip';
import { fetchWithCsrf } from '@/lib/csrf';

interface BookingMarginProps {
  bookingId: string;
  total: number;
  packPrice: number;
  extrasTotal: number;
  extraHours: number;
  extraHourPrice: number;
  distanceKm: number | null;
  vehicleCostPerKm?: number | null;
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


export default function BookingMarginCard({
  bookingId,
  total,
  packPrice,
  extrasTotal,
  extraHours,
  extraHourPrice,
  distanceKm: initialDistanceKm,
  vehicleCostPerKm: initialVehicleCostPerKm,
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
  const toast = useToast();

  // Editable travel fields
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm ?? 0);
  const resolvedCostPerKm = initialVehicleCostPerKm ?? DEFAULT_VEHICLE_COST_PER_KM;
  const [vehicleCostPerKm] = useState(resolvedCostPerKm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceMessage, setDistanceMessage] = useState<string | null>(null);
  const lastDistanceDestinationRef = useRef('');

  const billableKm = calculateBillableTravelKm(distanceKm, INCLUDED_TRAVEL_KM);
  const travelBlocks = calculateTravelBlocks(distanceKm, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM);
  const calculatedTravelCost = calculateTravelCost(distanceKm, vehicleCostPerKm, INCLUDED_TRAVEL_KM);
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

  const marginTone = getMarginTone(marginPct);
  const marginColor = marginTone.color;
  const marginBg = `border-${marginTone.tone}-400/30 bg-${marginTone.tone}-950/30`;

  const travelTone = getTravelMarginTone(travelMarginPct);
  const travelMarginColor = travelTone.color;
  const travelMarginCardBorder = travelTone.border;
  const travelMarginCardBg = travelTone.bg;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distanceKm,
          fuelCostPerKm: vehicleCostPerKm,
          travelCost: calculatedTravelCost,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error desant');
      }

      toast.success('Costos de viatge desats');
      router.refresh();
    } catch (error) {
      log.error('Error saving travel cost', error);
      toast.error(error instanceof Error ? error.message : 'Error desant costos');
    } finally {
      setSaving(false);
    }
  }, [bookingId, distanceKm, vehicleCostPerKm, calculatedTravelCost, router, toast]);

  const persistDistance = useCallback(async (nextDistanceKm: number) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distanceKm: nextDistanceKm,
          fuelCostPerKm: vehicleCostPerKm,
          travelCost: calculateTravelCost(nextDistanceKm, vehicleCostPerKm, INCLUDED_TRAVEL_KM),
        }),
      });
      if (!res.ok) {
        console.error('[BookingMarginCard] Error desant distància:', res.status);
        toast.error('Error desant la distància');
      }
    } catch (err) {
      console.error('[BookingMarginCard] Error desant distància:', err);
      toast.error('Error desant la distància');
    }
  }, [bookingId, vehicleCostPerKm, toast]);

  const calculateDistanceForDestination = useCallback(async (destination: string) => {
    setCalculatingDistance(true);
    setDistanceMessage(null);
    try {
      const res = await fetchWithCsrf('/api/admin/maps/distance', {
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
      <h2 className="text-lg font-semibold mb-4">
        📊 Marge i Costos
      </h2>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div>
          <p className="text-xs font-medium uppercase">Ingrés total</p>
          <p className="text-lg font-bold">{formatCurrency(total)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase">Cost directe</p>
          <p className="text-lg font-bold">{formatCurrency(directCost)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase">Marge net</p>
          <p className={`text-lg font-bold ${marginColor}`}>{formatCurrency(netMargin)}</p>
        </div>
        <div>
          <Tooltip text="Calculat pel motor de cost (costEngine.ts) — pack, extras, transport, operacional">
            <p className="text-xs font-medium uppercase">% Marge</p>
          </Tooltip>
          <p className={`text-2xl font-black ${marginColor}`}>{marginPct.toFixed(1)}%</p>
          <p className={`text-[11px] mt-0.5 ${marginColor}`}>
            {marginPct >= 50 ? 'Excel·lent. Marge sa.' :
             marginPct >= 30 ? 'Acceptable. Considera reduir costos o augmentar preu.' :
             marginPct >= 15 ? 'Vigilar. Revisa descomptes i transport.' :
             'Crític! Revisa preu o costos.'}
          </p>
        </div>
      </div>

      {/* Sumatori clar */}
      <div className="mb-6 ap-card rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">Sumatori de costos i marge</h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between"><span>Cost pack (real/estimat)</span><span>{formatCurrency(packCostUsed)}</span></div>
          <div className="flex justify-between"><span>Cost extres</span><span>{formatCurrency(extrasCost)}</span></div>
          <div className="flex justify-between"><span>Cost hores extra</span><span>{formatCurrency(extraHoursCost)}</span></div>
          <div className="flex justify-between"><span>Cost operacional fix</span><span>{formatCurrency(fixedOperationalCost)}</span></div>
          <div className="flex justify-between"><span title="Inclou benzina, manteniment, assegurança i amortització. Valor recomanat: 0.35-0.50 €/km">Cost vehicle per km</span><span>{formatCurrency(calculatedTravelCost)}</span></div>
          <div className="flex justify-between border-t admin-tone-border-neutral pt-1.5"><span>Cost directe total</span><span className="font-semibold">{formatCurrency(directCost)}</span></div>
          <div className="flex justify-between"><span>Ingressos reserva</span><span>{formatCurrency(total)}</span></div>
          <div className="flex justify-between"><span>Diferencial de marge (ingrés - cost)</span><span className={marginColor}>{formatCurrency(netMargin)}</span></div>
          <div className="flex justify-between"><span>Marge objectiu ({targetMarginPct.toFixed(1)}%)</span><span>{formatCurrency(targetMarginAmount)}</span></div>
          <div className="flex justify-between">
            <span>Diferencial vs objectiu</span>
            <span className={marginDeltaVsTarget >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}>
              {formatCurrency(marginDeltaVsTarget)}
            </span>
          </div>
          {typeof inventoryRemainingHoursAvg === 'number' && (
            <div className="flex justify-between border-t admin-tone-border-neutral pt-1.5">
              <span>Vida útil mitjana material assignat</span>
              <span>{inventoryRemainingHoursAvg.toFixed(0)}h restants</span>
            </div>
          )}
          {typeof inventoryRemainingHoursMin === 'number' && (
            <div className="flex justify-between">
              <span>Element més crític (mínim)</span>
              <span className={inventoryRemainingHoursMin < 200 ? 'admin-tone-text-danger' : 'admin-tone-text-neutral'}>
                {inventoryRemainingHoursMin.toFixed(0)}h restants
              </span>
            </div>
          )}
        </div>
      </div>

      {/* On va cada euro — desglossament del benefici */}
      {total > 0 && (
        <div className="mb-6 rounded-xl border p-4">
          <h3 className="text-sm font-semibold mb-1">On va cada euro d'aquest bolo</h3>
          <p className="text-[11px] mb-3">Desglossament pràctic: què es queda l'empresa, què s'ha de reservar, i què és benefici net.</p>
          <div className="space-y-2 text-xs">
            {/* Benzina / combustible */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium">Combustible (benzina)</span>
                <p className="text-[10px]">Pot «Gasolina» — usar per repostar la furgoneta</p>
              </div>
              <span className="shrink-0 font-semibold">
                {formatCurrency(distanceKm > 0 ? distanceKm * vehicleCostPerKm * 0.55 : 0)}
              </span>
            </div>
            {/* Manteniment vehicle */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium">Manteniment vehicle</span>
                <p className="text-[10px]">Pot «Vehicle» — rodes, oli, revisió, assegurança, ITV</p>
              </div>
              <span className="shrink-0 font-semibold">
                {formatCurrency(distanceKm > 0 ? distanceKm * vehicleCostPerKm * 0.45 : 0)}
              </span>
            </div>
            {/* Amortització equip */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium">Amortització equip (so, llum, etc.)</span>
                <p className="text-[10px]">Pot «Equip» — per quan calgui comprar recanvis o equip nou</p>
              </div>
              <span className="shrink-0 font-semibold">{formatCurrency(packCostUsed)}</span>
            </div>
            {/* Cost operacional */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium">Costos operatius fixes</span>
                <p className="text-[10px]">Pot «Operacions» — assegurança RC, llicències, material fungible</p>
              </div>
              <span className="shrink-0 font-semibold">{formatCurrency(fixedOperationalCost)}</span>
            </div>
            {/* Extres */}
            {extrasCost > 0 && (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium">Cost extres</span>
                  <p className="text-[10px]">Pot «Extres» — productes i material addicional</p>
                </div>
                <span className="shrink-0 font-semibold">{formatCurrency(extrasCost)}</span>
              </div>
            )}
            {/* Hores extra */}
            {extraHoursCost > 0 && (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium">Cost hores extra</span>
                  <p className="text-[10px]">Pot «Personal» — compensació per hores extra treballades</p>
                </div>
                <span className="shrink-0 font-semibold">{formatCurrency(extraHoursCost)}</span>
              </div>
            )}
            {/* Separador */}
            <div className="border-t admin-tone-border-neutral pt-2 mt-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold">Benefici net (el que queda per a tu)</span>
                  <p className="text-[10px]">Compte corrent de l'empresa — sou, inversions, estalvi</p>
                </div>
                <span className={`shrink-0 text-sm font-black ${netMargin >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
                  {formatCurrency(netMargin)}
                </span>
              </div>
            </div>
            {/* Consell */}
            <div className="border-t admin-tone-border-neutral pt-2 mt-1">
              <p className="text-[10px] leading-relaxed">
                <strong>Consell pràctic:</strong> Obre 4 comptes/pots al banc: <strong>Gasolina</strong> (repostar), <strong>Equip</strong> (recanvis i equip nou), <strong>Operacions</strong> (assegurança, llicències), i <strong>Benefici</strong> (sou i estalvi). Després de cada bolo, transfereix automàticament els imports d'amunt a cada pot. Així mai et quedaràs sense per a manteniment o reposició d'equip.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cost breakdown */}
      <div className="text-sm space-y-1 mb-6 border-t admin-tone-border-neutral pt-4">
        <div className="flex justify-between">
          <span>
            {typeof inventoryCostReal === 'number' && inventoryCostReal > 0
              ? `Pack (inventari real${inventoryHours ? ` · ${inventoryHours.toFixed(1)}h` : ''})`
              : `Pack (${(packCostRatio * 100).toFixed(0)}% de ${formatCurrency(packPrice)})`}
          </span>
          <span className="">{formatCurrency(packCostUsed)}</span>
        </div>
        {extrasTotal > 0 && (
          <div className="flex justify-between">
            <span>Extras ({(extraCostRatio * 100).toFixed(0)}% de {formatCurrency(extrasTotal)})</span>
            <span className="">{formatCurrency(extrasCost)}</span>
          </div>
        )}
        {extraHours > 0 && (
          <div className="flex justify-between">
            <span>Hores extra ({extraHours}h × {formatCurrency(extraHourPrice)})</span>
            <span className="">{formatCurrency(extraHoursCost)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Cost operacional fix</span>
          <span className="">{formatCurrency(fixedOperationalCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>Desplaçament ({travelBlocks} trams de {TRAVEL_BLOCK_KM} km)</span>
          <span className="">{formatCurrency(calculatedTravelCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>Suplement client ({travelBlocks} trams)</span>
          <span className="">{formatCurrency(calculatedTravelCharge)}</span>
        </div>
        <div className="flex justify-between">
          <span>Marge transport</span>
          <span className={travelMarginColor}>
            {formatCurrency(travelNetMargin)} {calculatedTravelCharge > 0 ? `(${travelMarginPct.toFixed(1)}%)` : ''}
          </span>
        </div>
      </div>

      {/* Editable travel fields */}
      <div className="border-t admin-tone-border-neutral pt-4">
        <h3 className="text-sm font-semibold mb-3">🚗 Desplaçament (editable)</h3>
        <p className="mb-3 text-xs">
          Inclòs: {INCLUDED_TRAVEL_KM} km totals ({includedOneWayKm} anada + {includedOneWayKm} tornada). Després: {TRAVEL_BLOCK_EUR} € per cada {TRAVEL_BLOCK_KM} km extra.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="bmc-distance" className="block text-xs font-medium mb-1">Distància (km)</label>
            <input
              id="bmc-distance"
              type="number"
              min="0"
              step="1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value) || 0)}
              className="ap-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Km extra</label>
            <div className="ap-card px-3 py-2 text-sm">
              {billableKm} km
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Cost viatge</label>
            <div className="ap-card px-3 py-2 text-sm font-bold">
              {formatCurrency(calculatedTravelCost)}
            </div>
            <p className="mt-1 text-[11px]">
              {travelBlocks} trams × {TRAVEL_BLOCK_EUR} €
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="ap-card rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wide" title="Inclou benzina, manteniment, assegurança i amortització. Valor recomanat: 0.35-0.50 €/km">Cost vehicle per km</p>
            <p className="text-sm font-semibold">{formatCurrency(calculatedTravelCost)}</p>
            <p className="text-[11px]">{distanceKm.toFixed(1)} km × {vehicleCostPerKm.toFixed(2)} €/km</p>
          </div>
          <div className="ap-card rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wide">Ingressos transport</p>
            <p className="text-sm font-semibold">{formatCurrency(calculatedTravelCharge)}</p>
            <p className="text-[11px]">{travelBlocks} trams × {TRAVEL_BLOCK_EUR} €</p>
          </div>
          <div className={`rounded-xl border p-3 ${travelMarginCardBorder} ${travelMarginCardBg}`}>
            <p className="text-[11px] uppercase tracking-wide">Marge real transport</p>
            <p className={`text-sm font-semibold ${travelMarginColor}`}>
              {formatCurrency(travelNetMargin)}
            </p>
            <p className="text-[11px]">
              {calculatedTravelCharge > 0 ? `${travelMarginPct.toFixed(1)}% de marge` : 'Sense suplement aplicat'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {calculatingDistance && <p className="text-xs">Calculant ruta automàticament...</p>}
          {distanceMessage && <p className="text-xs">{distanceMessage}</p>}
        </div>
        {hasChanged && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 ap-btn ap-btn--primary text-sm disabled:opacity-50"
          >
            {saving ? '⏳ Desant...' : '💾 Desar canvis'}
          </button>
        )}
      </div>
    </section>
  );
}





