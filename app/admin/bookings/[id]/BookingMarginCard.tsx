'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';
import {
  calculateTravelCost,
  DEFAULT_VEHICLE_COST_PER_KM,
  INCLUDED_TRAVEL_KM,
} from '@/lib/services/travelCost';
import {
  computeBoloTransport,
  TRAVEL_AVG_SPEED_KMH,
  TRAVEL_DRIVER_HOURLY_RATE,
  TRAVEL_INCLUDED_HOURS,
  TRAVEL_LONG_ROUTE_HOURS,
  TRAVEL_MEAL_ALLOWANCE_PER_PERSON,
} from '@/lib/services/travelLaborCost';
import { formatCurrency, formatCurrencyExact, formatNumber } from '@/lib/constants';
import { computeDirectCostBreakdown } from '@/lib/services/costEngine';
import type { ServiceLineLike } from '@/lib/services/costEngine';
import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { useToast } from '@/app/admin/components/ToastProvider';
import { getMarginTone, getTravelMarginTone } from '@/lib/margin-utils';
import Tooltip from '@/app/admin/components/Tooltip';
import BoloTripCard, { CROWDED_TRIP_THRESHOLD } from '@/app/admin/components/BoloTripCard';
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
  storedTravelCost?: number | null;
  tollsEur?: number | null;
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
  /** Línies reals per alimentar el cervell econòmic (subcontractat +20%, tècnic Òrbita, cost per línia). */
  serviceLines?: ServiceLineLike[];
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
  storedTravelCost,
  tollsEur: initialTollsEur,
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
  serviceLines = [],
  travelHeadcount = 0,
}: BookingMarginProps) {
  const router = useRouter();
  const toast = useToast();

  const [distanceKm, setDistanceKm] = useState(initialDistanceKm ?? 0);
  const [tollsEur, setTollsEur] = useState(
    typeof initialTollsEur === 'number' && Number.isFinite(initialTollsEur)
      ? Math.max(0, initialTollsEur)
      : 0,
  );
  const resolvedCostPerKm = initialVehicleCostPerKm ?? DEFAULT_VEHICLE_COST_PER_KM;
  const [vehicleCostPerKm] = useState(resolvedCostPerKm);
  const [saving, setSaving] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceMessage, setDistanceMessage] = useState<string | null>(null);
  const [travelSaveError, setTravelSaveError] = useState<string | null>(null);
  const lastDistanceDestinationRef = useRef('');

  const hasChanged = distanceKm !== (initialDistanceKm ?? 0);

  // Transport (#1369): una sola font per cost/càrrec/headcount. Si la reserva ja té
  // `travelCost` guardat, és la veritat fins que l'operador canvia la distància.
  const transport = computeBoloTransport({
    roundTripKm: distanceKm,
    vehicleCostPerKm,
    headcountOverride: travelHeadcount,
    tollsEur,
  });
  const travelBreakdown = transport.breakdown;
  const vehicleOnlyTravelCost = calculateTravelCost(distanceKm, vehicleCostPerKm, INCLUDED_TRAVEL_KM);
  const calculatedTravelCost = !hasChanged && typeof storedTravelCost === 'number' && storedTravelCost > 0
    ? storedTravelCost
    : transport.cost;
  const calculatedTravelCharge = transport.clientCharge;
  const effectiveTravelHeadcount = transport.headcount;
  const travelNetMargin = calculatedTravelCharge - calculatedTravelCost;
  const travelMarginPct = calculatedTravelCharge > 0 ? (travelNetMargin / calculatedTravelCharge) * 100 : 0;
  const travelCalculationNotes = distanceKm > 0
    ? [
        `Hores ruta: ${formatNumber(distanceKm, { maximumFractionDigits: 1 })} km / ${TRAVEL_AVG_SPEED_KMH} km/h = ${formatNumber(travelBreakdown.routeHours, { maximumFractionDigits: 2 })} h.`,
        ...(travelBreakdown.chargeableHours > 0 ? [
          `Temps cobrable: ${formatNumber(travelBreakdown.routeHours, { maximumFractionDigits: 2 })} h - ${formatNumber(TRAVEL_INCLUDED_HOURS, { maximumFractionDigits: 1 })} h inclosa = ${formatNumber(travelBreakdown.chargeableHours, { maximumFractionDigits: 1 })} h.`,
          `Hores de cotxe: ${formatNumber(travelBreakdown.chargeableHours, { maximumFractionDigits: 1 })} h x ${formatCurrencyExact(TRAVEL_DRIVER_HOURLY_RATE)}/h = ${formatCurrencyExact(travelBreakdown.chargeableHours * TRAVEL_DRIVER_HOURLY_RATE)} per persona; ${effectiveTravelHeadcount} ${effectiveTravelHeadcount === 1 ? 'persona' : 'persones'} = ${formatCurrencyExact(travelBreakdown.peopleCost)}.`,
        ] : []),
        ...(transport.mealAllowance > 0 ? [
          `Dietes: ruta > ${TRAVEL_LONG_ROUTE_HOURS} h; ${formatCurrencyExact(TRAVEL_MEAL_ALLOWANCE_PER_PERSON)} x ${effectiveTravelHeadcount} ${effectiveTravelHeadcount === 1 ? 'persona' : 'persones'} = ${formatCurrencyExact(transport.mealAllowance)}.`,
        ] : []),
      ]
    : [];

  // Cost directe via la font única (computeDirectCostBreakdown), no reimplementat.
  // El helper gestiona pack real-vs-estimat (inventoryCostReal) i usa el travelCost
  // explícit que ja hem calculat. Els ratios vénen dels props (config de la reserva).
  const {
    packCost: packCostUsed,
    extrasCost,
    extraHoursCost,
    transportMargin,
    directCost,
  } = computeDirectCostBreakdown(
    {
      total,
      packPrice,
      extrasTotal,
      extraHours,
      extraHourPrice,
      distanceKm,
      vehicleCostPerKm,
      travelCost: calculatedTravelCost,
      travelRevenue: calculatedTravelCharge,
      inventoryCostReal,
      serviceLinesCost,
      serviceLines,
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
    setTravelSaveError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distanceKm,
          fuelCostPerKm: vehicleCostPerKm,
          tollsEur,
          travelCost: transport.cost,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error desant');
      }

      toast.success('Costos de viatge desats');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desant costos';
      log.error('Error saving travel cost', error);
      setTravelSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [bookingId, distanceKm, vehicleCostPerKm, tollsEur, transport.cost, router, toast]);

  const persistDistance = useCallback(async (nextDistanceKm: number, nextTollsEur = tollsEur) => {
    try {
      const nextTransport = computeBoloTransport({
        roundTripKm: nextDistanceKm,
        vehicleCostPerKm,
        headcountOverride: travelHeadcount,
        tollsEur: nextTollsEur,
      });
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distanceKm: nextDistanceKm,
          fuelCostPerKm: vehicleCostPerKm,
          tollsEur: nextTollsEur,
          travelCost: nextTransport.cost,
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
  }, [bookingId, tollsEur, travelHeadcount, vehicleCostPerKm, toast]);

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
      const nextTollsEur = typeof data.tollsEur === 'number' && data.tollsEur > 0
        ? data.tollsEur
        : tollsEur;
      setDistanceKm(nextDistanceKm);
      setTollsEur(nextTollsEur);
      lastDistanceDestinationRef.current = destination;
      void persistDistance(nextDistanceKm, nextTollsEur);
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
    if ((initialDistanceKm ?? 0) > 0) return;
    if (destination === lastDistanceDestinationRef.current) return;

    const timer = setTimeout(() => {
      void calculateDistanceForDestination(destination);
    }, 450);

    return () => clearTimeout(timer);
  }, [eventLocation, eventVenue, initialDistanceKm, calculateDistanceForDestination]);

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

      <div id="booking-margin-costs" className="mb-6 scroll-mt-40 ap-card p-4" data-help-title="Sumatori de costos i marge" data-help-desc="Desglossa d'on surt el cost directe i com es compara el marge real amb el marge objectiu.">
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

      <details className="ap-rep-detail mb-6" data-help-title="Desglossament de costos" data-help-desc="Mostra el detall tècnic del cost del pack, extres, hores extra i desplaçament usat per calcular el marge.">
        <summary className="ap-rep-detail-summary">
          <span>Desglossament de costos</span>
        </summary>
        <div className="ap-rep-detail-body text-sm">
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
          <span>Cost transport intern ({distanceKm.toFixed(0)} km)</span>
          <span>{formatCurrency(calculatedTravelCost)}</span>
        </div>
        {tollsEur > 0 && (
          <div className="flex justify-between">
            <span>Peatges inclosos</span>
            <span>{formatCurrency(tollsEur)}</span>
          </div>
        )}
        {travelBreakdown.peopleCost > 0 && (
          <div className="flex justify-between">
            <span>Temps tripulació transport</span>
            <span>{formatCurrency(travelBreakdown.peopleCost)}</span>
          </div>
        )}
        {transport.mealAllowance > 0 && (
          <div className="flex justify-between">
            <span>Dieta transport</span>
            <span>{formatCurrency(transport.mealAllowance)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Transport al client (vehicle + {travelBreakdown.chargeableHours} h × {effectiveTravelHeadcount} pers.)</span>
          <span>{formatCurrency(calculatedTravelCharge)}</span>
        </div>
        <div className="flex justify-between">
          <span>Marge transport</span>
          <span className={travelMarginColor}>
            {formatCurrency(transportMargin.marginAmount)} {calculatedTravelCharge > 0 ? `(${transportMargin.marginPct.toFixed(1)}%)` : ''}
          </span>
        </div>
        </div>
      </details>

      <div className="ap-card p-4" data-help-title="Desplaçament" data-help-desc="Permet ajustar o recalcular la distància del servei i veure com canvien costos, suplement i marge del transport.">
        {/* ── DESPLAÇAMENT: MATEIXA targeta compartida que el lead (#1380). La reserva hereta
        el disseny; integrants en lectura (es decideix al lead). Els números, del cervell. ── */}
        <BoloTripCard
          km={distanceKm}
          distanceKm={String(distanceKm)}
          onDistanceChange={(v) => {
            setDistanceKm(Number(v) || 0);
            setTravelSaveError(null);
          }}
          calculatingDistance={calculatingDistance}
          derivedHeadcount={effectiveTravelHeadcount}
          headcount={effectiveTravelHeadcount}
          chargeableHours={travelBreakdown.chargeableHours}
          tripCrowded={effectiveTravelHeadcount > CROWDED_TRIP_THRESHOLD}
          calculationNotes={travelCalculationNotes}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="ap-card p-3">
            <p className="text-xs uppercase tracking-wide" title="Inclou vehicle, tripulació de ruta, dieta i peatges quan apliquen.">Cost transport intern</p>
            <p className="text-sm font-semibold">{formatCurrency(calculatedTravelCost)}</p>
            <p className="text-xs">
              vehicle {formatCurrency(vehicleOnlyTravelCost)} · {distanceKm.toFixed(1)} km · {vehicleCostPerKm.toFixed(2)} €/km{tollsEur > 0 ? ` · peatges ${formatCurrency(tollsEur)}` : ''}
            </p>
          </div>
          <div className="ap-card p-3">
            <p className="text-xs uppercase tracking-wide">Ingressos transport</p>
            <p className="text-sm font-semibold">{formatCurrency(calculatedTravelCharge)}</p>
            <p className="text-xs">vehicle + {travelBreakdown.chargeableHours} h × {effectiveTravelHeadcount} pers.</p>
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
            aria-invalid={travelSaveError ? true : undefined}
            className="mt-3 ap-btn ap-btn--primary text-sm disabled:opacity-50"
          >
            {saving ? 'Desant...' : 'Desar canvis'}
          </button>
        )}
        {travelSaveError && (
          <p role="alert" className="mt-2 rounded-[var(--o-r-md)] border border-[var(--ax-danger-border)] px-3 py-2 text-xs font-semibold text-[var(--o-danger)]">
            {travelSaveError}
          </p>
        )}
      </div>
    </section>
  );
}
