'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';
import {
  calculateTravelCost,
  DEFAULT_VEHICLE_COST_PER_KM,
  getIncludedTravelOneWayKm,
  INCLUDED_TRAVEL_KM,
} from '@/lib/services/travelCost';
import { calculateClientTravelCharge, calculateTravelCostBreakdown } from '@/lib/services/travelLaborCost';
import { formatCurrency } from '@/lib/constants';
import { computeDirectCostBreakdown } from '@/lib/services/costEngine';
import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
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
  /** Cost de subcontractació de les línies de servei (animació, pintacares...). */
  serviceLinesCost?: number;
  /** Persones que viatgen al bolo (#1363): alimenta el càrrec de transport de dues potes. */
  travelHeadcount?: number;
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
  serviceLinesCost = 0,
  travelHeadcount = 0,
}: BookingMarginProps) {
  const router = useRouter();
  const toast = useToast();

  const [distanceKm, setDistanceKm] = useState(initialDistanceKm ?? 0);
  const resolvedCostPerKm = initialVehicleCostPerKm ?? DEFAULT_VEHICLE_COST_PER_KM;
  const [vehicleCostPerKm] = useState(resolvedCostPerKm);
  const [saving, setSaving] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceMessage, setDistanceMessage] = useState<string | null>(null);
  const lastDistanceDestinationRef = useRef('');

  // Transport (#1363): cost real dues potes (cotxe/km + gent/hores). El càrrec al client
  // = el mateix cost (break-even) via la font única. `calculatedTravelCost` és només el
  // cotxe (cost intern del vehicle); les hores de gent són cost de col·laborador a part.
  const travelBreakdown = calculateTravelCostBreakdown({
    roundTripKm: distanceKm,
    vehicleCostPerKm,
    vehicleOwner: { label: '' },
    people: travelHeadcount > 0
      ? [{ role: 'DRIVER', label: '' }, ...(travelHeadcount > 1 ? [{ role: 'PASSENGER' as const, label: '', count: travelHeadcount - 1 }] : [])]
      : [],
  });
  const calculatedTravelCost = calculateTravelCost(distanceKm, vehicleCostPerKm, INCLUDED_TRAVEL_KM);
  const calculatedTravelCharge = calculateClientTravelCharge(distanceKm, travelHeadcount, vehicleCostPerKm);
  const includedOneWayKm = getIncludedTravelOneWayKm(INCLUDED_TRAVEL_KM);
  const travelNetMargin = calculatedTravelCharge - calculatedTravelCost;
  const travelMarginPct = calculatedTravelCharge > 0 ? (travelNetMargin / calculatedTravelCharge) * 100 : 0;

  // Cost directe via la font única (computeDirectCostBreakdown), no reimplementat.
  // El helper gestiona pack real-vs-estimat (inventoryCostReal) i usa el travelCost
  // explícit que ja hem calculat. Els ratios vénen dels props (config de la reserva).
  const { packCost: packCostUsed, extrasCost, extraHoursCost, directCost } = computeDirectCostBreakdown(
    {
      total,
      packPrice,
      extrasTotal,
      extraHours,
      extraHourPrice,
      distanceKm,
      vehicleCostPerKm,
      travelCost: calculatedTravelCost,
      inventoryCostReal,
      serviceLinesCost,
    },
    { ...PROFITABILITY_MODEL_DEFAULTS, packCostRatio, extraCostRatio, extraHourCostRatio, fixedOperationalCost },
  );

  const netMargin = total - directCost; // marge en viu: sense CAC (per disseny)
  const marginPct = total > 0 ? (netMargin / total) * 100 : 0;
  const targetMarginAmount = total * (targetMarginPct / 100);
  const marginDeltaVsTarget = netMargin - targetMarginAmount;

  const marginTone = getMarginTone(marginPct);
  const marginColor = marginTone.color;

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
        log.error('[BookingMarginCard] Error desant distancia', { status: res.status });
        toast.error('Error desant la distància');
      }
    } catch (err) {
      log.error('[BookingMarginCard] Error desant distancia', err);
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
      setDistanceMessage(`Ruta: ${data.oneWayKm || 0} km anada · ${data.roundTripKm || 0} km anada i tornada`);
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

  const hasChanged = distanceKm !== (initialDistanceKm ?? 0);

  return (
    <section
      className="ap-card p-6"
      data-help-title="Marge i costos"
      data-help-desc="Explica què costa realment aquest esdeveniment, quin marge deixa i com impacta el transport en la rendibilitat."
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">Cabina econòmica</p>
          <h2 className="mt-2 ap-h2">Marge i costos</h2>
          <p className="mt-1 text-sm opacity-80">
            Llegeix en un cop d'ull què deixa la reserva, on marxa cada euro i si el desplaçament està ben cobert.
          </p>
        </div>
        <div className="ap-card flex flex-col gap-1 p-4 sm:items-end">
          <span className={`text-xl font-bold leading-none ${marginColor}`}>{marginPct.toFixed(1)}%</span>
          <span className="text-xs uppercase tracking-wide opacity-70">Marge actual</span>
        </div>
      </div>

      <div
        className="mb-6 grid gap-4 sm:grid-cols-4"
        data-help-title="KPI de marge"
        data-help-desc="Resumeixen ingrés total, cost directe, marge net i percentatge de marge d'aquesta reserva."
      >
        <div className="ap-kpi">
          <p className="text-xs font-medium uppercase">Ingrés total</p>
          <p className="text-lg font-bold">{formatCurrency(total)}</p>
        </div>
        <div className="ap-kpi">
          <p className="text-xs font-medium uppercase">Cost directe</p>
          <p className="text-lg font-bold">{formatCurrency(directCost)}</p>
        </div>
        <div className="ap-kpi">
          <p className="text-xs font-medium uppercase">Marge net</p>
          <p className={`text-lg font-bold ${marginColor}`}>{formatCurrency(netMargin)}</p>
        </div>
        <div className="ap-kpi">
          <Tooltip text="Calculat pel motor de cost: pack, extres, transport i cost operacional.">
            <p className="text-xs font-medium uppercase">% marge</p>
          </Tooltip>
          <p className={`text-lg font-bold ${marginColor}`}>{marginPct.toFixed(1)}%</p>
          <p className={`text-xs mt-0.5 ${marginColor}`}>
            {marginPct >= 50 ? 'Excel·lent. Marge sa.' :
             marginPct >= 30 ? 'Acceptable. Encara hi ha marge per optimitzar.' :
             marginPct >= 15 ? 'Vigilar. Revisa descomptes i transport.' :
             'Crític. Revisa preu o costos.'}
          </p>
        </div>
      </div>

      <div className="mb-6 ap-card p-4" data-help-title="Sumatori de costos i marge" data-help-desc="Desglossa d'on surt el cost directe i com es compara el marge real amb el marge objectiu.">
        <h3 className="text-sm font-semibold mb-3">Sumatori de costos i marge</h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between"><span>Cost pack (real o estimat)</span><span>{formatCurrency(packCostUsed)}</span></div>
          <div className="flex justify-between"><span>Cost extres</span><span>{formatCurrency(extrasCost)}</span></div>
          <div className="flex justify-between"><span>Cost hores extra</span><span>{formatCurrency(extraHoursCost)}</span></div>
          <div className="flex justify-between"><span>Cost operacional fix</span><span>{formatCurrency(fixedOperationalCost)}</span></div>
          <div className="flex justify-between"><span title="Inclou benzina, manteniment, assegurança i amortització. Valor recomanat: 0.35-0.50 €/km">Cost vehicle</span><span>{formatCurrency(calculatedTravelCost)}</span></div>
          {serviceLinesCost > 0 && (
            <div className="flex justify-between"><span>Cost serveis externs</span><span>{formatCurrency(serviceLinesCost)}</span></div>
          )}
          <div className="flex justify-between border-t admin-tone-border-neutral pt-1.5"><span>Cost directe total</span><span className="font-semibold">{formatCurrency(directCost)}</span></div>
          <div className="flex justify-between"><span>Ingressos reserva</span><span>{formatCurrency(total)}</span></div>
          <div className="flex justify-between"><span>Diferencial de marge</span><span className={marginColor}>{formatCurrency(netMargin)}</span></div>
          <div className="flex justify-between"><span>Marge objectiu ({targetMarginPct.toFixed(1)}%)</span><span>{formatCurrency(targetMarginAmount)}</span></div>
          <div className="flex justify-between">
            <span>Diferencial vs objectiu</span>
            <span className={marginDeltaVsTarget >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}>
              {formatCurrency(marginDeltaVsTarget)}
            </span>
          </div>
          {typeof inventoryRemainingHoursAvg === 'number' && (
            <div className="flex justify-between border-t admin-tone-border-neutral pt-1.5">
              <span>Vida útil mitjana del material assignat</span>
              <span>{inventoryRemainingHoursAvg.toFixed(0)}h restants</span>
            </div>
          )}
          {typeof inventoryRemainingHoursMin === 'number' && (
            <div className="flex justify-between">
              <span>Element més crític</span>
              <span className={inventoryRemainingHoursMin < 200 ? 'admin-tone-text-danger' : 'admin-tone-text-neutral'}>
                {inventoryRemainingHoursMin.toFixed(0)}h restants
              </span>
            </div>
          )}
        </div>
      </div>

      {total > 0 && (
        <div className="mb-6 ap-card p-4">
          <h3 className="mb-1 text-sm font-semibold">{"On va cada euro d'aquest bolo"}</h3>
          <p className="text-sm mb-4 opacity-70">Desglossament practic de costos i benefici real.</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-semibold">Combustible</span>
                <p className="text-xs opacity-60 mt-0.5">Pot Gasolina — repostar i cobrir ruta</p>
              </div>
              <span className="shrink-0 font-bold tabular-nums">
                {formatCurrency(distanceKm > 0 ? distanceKm * vehicleCostPerKm * 0.55 : 0)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-semibold">Manteniment vehicle</span>
                <p className="text-xs opacity-60 mt-0.5">Pot Vehicle — rodes, oli, revisions, assegurança</p>
              </div>
              <span className="shrink-0 font-bold tabular-nums">
                {formatCurrency(distanceKm > 0 ? distanceKm * vehicleCostPerKm * 0.45 : 0)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-semibold">Amortitzacio equip</span>
                <p className="text-xs opacity-60 mt-0.5">Pot Equip — recanvis i renovacio de material</p>
              </div>
              <span className="shrink-0 font-bold tabular-nums">{formatCurrency(packCostUsed)}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-semibold">Costos operatius fixos</span>
                <p className="text-xs opacity-60 mt-0.5">Pot Operacions — assegurança RC, llicencies, fungible</p>
              </div>
              <span className="shrink-0 font-bold tabular-nums">{formatCurrency(fixedOperationalCost)}</span>
            </div>
            {extrasCost > 0 && (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-semibold">Cost extres</span>
                  <p className="text-xs opacity-60 mt-0.5">Pot Extres — material i productes adicionals</p>
                </div>
                <span className="shrink-0 font-bold tabular-nums">{formatCurrency(extrasCost)}</span>
              </div>
            )}
            {extraHoursCost > 0 && (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-semibold">Cost hores extra</span>
                  <p className="text-xs opacity-60 mt-0.5">Pot Personal — compensar hores addicionals</p>
                </div>
                <span className="shrink-0 font-bold tabular-nums">{formatCurrency(extraHoursCost)}</span>
              </div>
            )}
            <div className="border-t admin-tone-border-neutral pt-3 mt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold">Benefici net</span>
                  <p className="text-xs opacity-60 mt-0.5">Compte principal — sou, estalvi i reinversio</p>
                </div>
                <span className={`shrink-0 font-bold tabular-nums ${netMargin >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
                  {formatCurrency(netMargin)}
                </span>
              </div>
            </div>
            <div className="border-t admin-tone-border-neutral pt-3 mt-1">
              <p className="text-xs leading-relaxed opacity-70">
                Consell: separa els pots de Gasolina, Equip, Operacions i Benefici. Despres de cada bolo, mou-hi aquests imports.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="ap-card p-4 text-sm space-y-1 mb-6" data-help-title="Desglossament de costos" data-help-desc="Mostra el detall tècnic del cost del pack, extres, hores extra i desplaçament usat per calcular el marge.">
        <div className="flex justify-between">
          <span>
            {typeof inventoryCostReal === 'number' && inventoryCostReal > 0
              ? `Pack (inventari real${inventoryHours ? ` · ${inventoryHours.toFixed(1)}h` : ''})`
              : `Pack (${(packCostRatio * 100).toFixed(0)}% de ${formatCurrency(packPrice)})`}
          </span>
          <span>{formatCurrency(packCostUsed)}</span>
        </div>
        {extrasTotal > 0 && (
          <div className="flex justify-between">
            <span>Extres ({(extraCostRatio * 100).toFixed(0)}% de {formatCurrency(extrasTotal)})</span>
            <span>{formatCurrency(extrasCost)}</span>
          </div>
        )}
        {extraHours > 0 && (
          <div className="flex justify-between">
            <span>Hores extra ({extraHours}h × {formatCurrency(extraHourPrice)})</span>
            <span>{formatCurrency(extraHoursCost)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Cost operacional fix</span>
          <span>{formatCurrency(fixedOperationalCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>Desplaçament cotxe ({distanceKm.toFixed(0)} km)</span>
          <span>{formatCurrency(calculatedTravelCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>Transport al client (cotxe + {travelBreakdown.chargeableHours} h × {travelHeadcount} pers.)</span>
          <span>{formatCurrency(calculatedTravelCharge)}</span>
        </div>
        <div className="flex justify-between">
          <span>Marge transport</span>
          <span className={travelMarginColor}>
            {formatCurrency(travelNetMargin)} {calculatedTravelCharge > 0 ? `(${travelMarginPct.toFixed(1)}%)` : ''}
          </span>
        </div>
      </div>

      <div className="ap-card p-4" data-help-title="Desplaçament editable" data-help-desc="Permet ajustar o recalcular la distància del servei i veure com canvien costos, suplement i marge del transport.">
        <h3 className="text-sm font-semibold mb-3">Desplaçament editable</h3>
        <p className="mb-3 text-xs">
          Transport al client = cost real: cotxe ({vehicleCostPerKm.toFixed(2)} €/km) + temps de la tripulació (15 €/h, 1a hora inclosa).
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
            <label className="block text-xs font-medium mb-1">Hores tripulació</label>
            <div className="ap-card px-3 py-2 text-sm">
              {travelBreakdown.chargeableHours} h × {travelHeadcount} pers.
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Cost viatge (cotxe)</label>
            <div className="ap-card px-3 py-2 text-sm font-bold">
              {formatCurrency(calculatedTravelCost)}
            </div>
            <p className="mt-1 text-xs">
              {distanceKm.toFixed(0)} km · {vehicleCostPerKm.toFixed(2)} €/km
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="ap-card p-3">
            <p className="text-xs uppercase tracking-wide" title="Inclou benzina, manteniment, assegurança i amortització. Valor recomanat: 0.35-0.50 €/km">Cost vehicle per km</p>
            <p className="text-sm font-semibold">{formatCurrency(calculatedTravelCost)}</p>
            <p className="text-xs">{distanceKm.toFixed(1)} km · {vehicleCostPerKm.toFixed(2)} €/km</p>
          </div>
          <div className="ap-card p-3">
            <p className="text-xs uppercase tracking-wide">Ingressos transport</p>
            <p className="text-sm font-semibold">{formatCurrency(calculatedTravelCharge)}</p>
            <p className="text-xs">cotxe + {travelBreakdown.chargeableHours} h × {travelHeadcount} pers.</p>
          </div>
          <div className={`ap-card p-3 ${travelMarginCardBorder} ${travelMarginCardBg}`}>
            <p className="text-xs uppercase tracking-wide">Marge real transport</p>
            <p className={`text-sm font-semibold ${travelMarginColor}`}>
              {formatCurrency(travelNetMargin)}
            </p>
            <p className="text-xs">
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
            {saving ? 'Desant...' : 'Desar canvis'}
          </button>
        )}
      </div>
    </section>
  );
}
