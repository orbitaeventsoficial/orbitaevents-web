'use client';

/* ============================================================================
   ÒRBITA ADMIN — Nova reserva
   ----------------------------------------------------------------------------
   Canònic: AdminPage + AdminSection + .ap-card + .adm-input + .ap-btn +
   Tailwind/tokens de /studio. sistema propi `nb-*` eradicat (canonització 2026-06-30).
   Layout de 2 columnes (qüestionari + sidebar sticky amb resum i CTA).
   Reaprofita tots els hooks i la lògica de càlcul de preu existent.
============================================================================ */

import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/constants';
import { getBookingFiscalMode } from '@/lib/constants/booking-payment';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { DEFAULT_VEHICLE_COST_PER_KM, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_EUR, TRAVEL_BLOCK_KM } from '@/lib/services/travelCost';
import { calculateTravelCostBreakdown, TRAVEL_COST_LINE_MARKER } from '@/lib/services/travelLaborCost';
import { useToast } from '../components/ToastProvider';
import { AdminPage, AdminSection } from '../components/AdminPage';
import { NB_FIELD, NB_LABEL, NB_HINT, NB_GROUP } from './booking-form-classes';
import BookingPricingSummary from './BookingPricingSummary';
import BookingPackExtrasSection from './BookingPackExtrasSection';
import BookingTravelDiscountSection from './BookingTravelDiscountSection';
import BookingClientEventSection from './BookingClientEventSection';
import { useNewBookingInitialData } from './useNewBookingInitialData';
import { useNewBookingSubmit } from './useNewBookingSubmit';
import BookingServiceLinesSection from './BookingServiceLinesSection';
import type { BookingServiceLineFormInput } from './booking-form.types';
import { useBookingDiscountValidation } from './useBookingDiscountValidation';
import { useBookingDistance } from './useBookingDistance';
import { useBookingDateConflicts } from './useBookingDateConflicts';
import { useBookingPricing } from './useBookingPricing';
import { useFormAutosave } from '@/lib/hooks/useFormAutosave';
import type { BookingExtra, BookingFormData, BookingSelectedExtras, BookingPartnerOption } from './booking-form.types';
import { OPERATOR_EXTRA_ID, bookingAutosaveKey } from './booking-form.types';

// Opcions del desplegable de partners agrupades: Favorits primer, Altres després.
// Així els típics (Masquerade) queden a dalt i els de material (Tronios, DJ Mania)
// no molesten sense desaparèixer. El propietari marca favorits a la fitxa de partner.
function renderPartnerOptions(partners: BookingPartnerOption[]) {
  const label = (p: BookingPartnerOption) => (p.company ? `${p.name} · ${p.company}` : p.name);
  const favs = partners.filter((p) => p.isFavorite);
  const rest = partners.filter((p) => !p.isFavorite);
  return (
    <>
      {favs.length > 0 && (
        <optgroup label="Favorits">
          {favs.map((p) => <option key={p.id} value={p.id}>{label(p)}</option>)}
        </optgroup>
      )}
      {rest.length > 0 && (
        <optgroup label={favs.length > 0 ? 'Altres' : 'Tots els partners'}>
          {rest.map((p) => <option key={p.id} value={p.id}>{label(p)}</option>)}
        </optgroup>
      )}
    </>
  );
}

export default function NewBookingForm() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const leadId = searchParams?.get('leadId') ?? null;
  const customerId = searchParams?.get('customerId') ?? null;
  const dateParam = searchParams?.get('date') ?? null;
  // Si la reserva ve d'un lead, el back natural és la fitxa del lead (Agenda).
  // Si ve d'un client, el back és la pestanya Reserves del client. Cas isolat: Agenda.
  const backHref = customerId
    ? buildCustomerWorkspaceTabHref(customerId, 'bookings')
    : leadId
      ? buildLeadWorkspaceHref(leadId)
      : '/admin/leads';
  const backLabel = customerId ? 'Client' : leadId ? 'Lead' : 'Agenda';
  const crumbContext = customerId ? 'Client' : 'Agenda';

  const { form, setForm, packs, extras, loading, leadData, partners, fuelReferenceInfo } = useNewBookingInitialData({ leadId, dateParam });
  // Autosave de l'esborrany de reserva (hora, lloc, tot). Només actiu un cop
  // carregat el prefill del lead, perquè no machaqui ni el sobreescrigui.
  const autosaveKey = bookingAutosaveKey(leadId, customerId);
  // Autosave silenciós (sense banner): desa i restaura l'esborrany de la reserva.
  const { clear: clearBookingDraft } = useFormAutosave(
    autosaveKey, form, setForm, { enabled: !loading },
  );
  const [selectedExtras, setSelectedExtras] = useState<BookingSelectedExtras>({});
  const [customPackPrice, setCustomPackPrice] = useState('');
  const [manualTotalPrice, setManualTotalPrice] = useState('');
  const [serviceLines, setServiceLines] = useState<BookingServiceLineFormInput[]>([]);
  const [travelRouteHours, setTravelRouteHours] = useState('');
  const [travelVehicleOwner, setTravelVehicleOwner] = useState('OWNER');
  const [travelDriver, setTravelDriver] = useState('OWNER');
  const [travelPartnerId, setTravelPartnerId] = useState('');
  const [travelOwnerPassengers, setTravelOwnerPassengers] = useState('0');
  const [travelPartnerPassengers, setTravelPartnerPassengers] = useState('0');
  // Arrossega el pressupost del lead com a punt de partida del preu acordat.
  useEffect(() => {
    if (!leadData?.budget || manualTotalPrice) return;
    const parsed = String(leadData.budget).replace(/[^\d]/g, '');
    if (parsed) setManualTotalPrice(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- només ha de reaccionar quan arriba leadData, no a manualTotalPrice
  }, [leadData]);
  const [invoiceRequired, setInvoiceRequired] = useState(false);
  const fiscalMode = getBookingFiscalMode(invoiceRequired);
  const [showPack, setShowPack] = useState(false);
  useEffect(() => { if (form.packId) setShowPack(true); }, [form.packId]);
  const [sourceCollaboratorId, setSourceCollaboratorId] = useState('');
  const [billedCollaboratorId, setBilledCollaboratorId] = useState('');
  const [showSourceBilling, setShowSourceBilling] = useState(false);
  useEffect(() => {
    if (sourceCollaboratorId || billedCollaboratorId) setShowSourceBilling(true);
  }, [sourceCollaboratorId, billedCollaboratorId]);
  const { discountValidation, validatingCode, resetDiscountValidation, validateDiscountCode } = useBookingDiscountValidation({
    packs,
    selectedPackId: form.packId,
    selectedExtras,
    onApplyDiscount: (value) => updateField('discount', value),
    onValidationError: (message) => toast.error(message),
  });
  const { calculatingDistance, distanceMessage } = useBookingDistance({
    eventVenue: form.eventVenue,
    eventLocation: form.eventLocation,
    onDistanceResolved: (distanceKm) => setForm((prev) => ({ ...prev, distanceKm })),
  });
  const dateConflicts = useBookingDateConflicts(form.eventDate);

  const updateField = (field: keyof BookingFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const {
    internalTravelCost,
    travelCharge,
    billableKm,
    travelBlocks,
    operatorExtraPrice,
    displayExtras,
    pricing,
    marginEstimate,
  } = useBookingPricing({
    form,
    packs,
    extras,
    selectedExtras,
    customPackPrice: customPackPrice ? Number(customPackPrice) : undefined,
    manualTotalPrice: manualTotalPrice ? Number(manualTotalPrice) : undefined,
    invoiceRequired,
    serviceLines,
  });

  const travelPartner = useMemo(
    () => partners.find((partner) => partner.id === travelPartnerId) || null,
    [partners, travelPartnerId],
  );
  const travelPartnerLabel = travelPartner ? (travelPartner.company || travelPartner.name) : 'Proveïdor';
  const travelVehicleOwnerMeta = travelVehicleOwner === 'PARTNER' && travelPartner
    ? { label: travelPartnerLabel, collaboratorId: travelPartner.id }
    : { label: 'Òrbita' };
  const travelDriverMeta = travelDriver === 'PARTNER' && travelPartner
    ? { label: travelPartnerLabel, collaboratorId: travelPartner.id }
    : { label: 'Òrbita' };
  const travelCostBreakdown = useMemo(() => {
    const partnerPassengerCount = Number(travelPartnerPassengers) || 0;
    const ownerPassengerCount = Number(travelOwnerPassengers) || 0;
    return calculateTravelCostBreakdown({
      roundTripKm: Number(form.distanceKm) || 0,
      vehicleCostPerKm: Number(form.fuelCostPerKm) || DEFAULT_VEHICLE_COST_PER_KM,
      routeHours: travelRouteHours ? Number(travelRouteHours) : undefined,
      vehicleOwner: travelVehicleOwnerMeta,
      people: [
        { role: 'DRIVER', ...travelDriverMeta },
        ...(ownerPassengerCount > 0 ? [{ role: 'PASSENGER' as const, label: 'Òrbita', count: ownerPassengerCount }] : []),
        ...(partnerPassengerCount > 0 && travelPartner ? [{ role: 'PASSENGER' as const, label: travelPartnerLabel, collaboratorId: travelPartner.id, count: partnerPassengerCount }] : []),
      ],
    });
  }, [form.distanceKm, form.fuelCostPerKm, travelDriverMeta, travelOwnerPassengers, travelPartner, travelPartnerLabel, travelPartnerPassengers, travelRouteHours, travelVehicleOwnerMeta]);

  const applyTravelCostLines = () => {
    const nextLines = serviceLines.filter((line) => !line.notes?.includes(TRAVEL_COST_LINE_MARKER));
    const travelLines: BookingServiceLineFormInput[] = travelCostBreakdown.lines
      .filter((line) => !line.notes.includes(`${TRAVEL_COST_LINE_MARKER} vehicle`))
      .map((line) => ({
        kind: 'OTHER',
        label: line.label,
        revenueAmount: 0,
        costAmount: line.costAmount,
        collaboratorId: line.collaboratorId || undefined,
        quantity: 1,
        notes: line.notes,
      }));
    setServiceLines([...nextLines, ...travelLines]);
  };

  useEffect(() => {
    setSelectedExtras((prev) => {
      const current = prev[OPERATOR_EXTRA_ID];
      if (!current) return prev;
      if (current.price === operatorExtraPrice) return prev;
      return {
        ...prev,
        [OPERATOR_EXTRA_ID]: {
          ...current,
          price: operatorExtraPrice,
        },
      };
    });
  }, [operatorExtraPrice]);

  const { submitting, error, submit: handleSubmit } = useNewBookingSubmit({
    onSuccess: clearBookingDraft,
    form,
    selectedExtras,
    leadId,
    leadData,
    customerId,
    sourceCollaboratorId,
    internalTravelCost,
    customPackPrice: customPackPrice ? Number(customPackPrice) : undefined,
    manualTotalPrice: manualTotalPrice ? Number(manualTotalPrice) : undefined,
    invoiceRequired,
    serviceLines: serviceLines.length > 0 ? serviceLines : undefined,
    billedCollaboratorId: billedCollaboratorId || undefined,
  });

  const toggleExtra = (extra: BookingExtra) => {
    setSelectedExtras((prev) => {
      const copy = { ...prev };
      if (copy[extra.id]) {
        delete copy[extra.id];
      } else {
        copy[extra.id] = { quantity: 1, price: extra.price };
      }
      return copy;
    });
  };

  const updateExtraQuantity = (extraId: string, qty: number) => {
    setSelectedExtras((prev) => ({
      ...prev,
      [extraId]: { ...prev[extraId], quantity: Math.max(1, qty) },
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--hair-gold)] border-t-transparent"
          aria-label="Carregant"
        />
      </div>
    );
  }

  // El bolo no pot ser buit: pack de catàleg, o serveis/productes, o total pactat.
  const boloNotEmpty = !!form.packId || serviceLines.length > 0 || Object.keys(selectedExtras).length > 0 || (!!manualTotalPrice && Number(manualTotalPrice) > 0);
  const submitDisabled = submitting || !form.clientName || !form.clientEmail || !boloNotEmpty;

  const narrowField = `${NB_FIELD} max-w-[12.5rem] flex-1 basis-40`;

  return (
    <AdminPage
      back={{ href: backHref, label: backLabel }}
      eyebrow={`${crumbContext} · Nova reserva`}
      title={leadData ? leadData.name : 'Crear reserva'}
      subtitle={leadData ? (
        <>
          Des de l&apos;entrada <Link href={buildLeadWorkspaceHref(leadData.id)} className="text-[var(--gold-bright)] underline decoration-dashed underline-offset-2 hover:text-[var(--gold)]">{leadData.name}</Link>
          {leadData.budget && <> · Pressupost <b className="text-[var(--t)]">{leadData.budget}</b></>}
          {leadData.email && <> · {leadData.email}</>}
        </>
      ) : (
        'Omple les dades del client, l\'esdeveniment i selecciona un pack.'
      )}
    >
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22.5rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {error && (
            <div className="ap-card ap-card--danger ap-card-body">
              <p className="text-sm text-[var(--t)]">{error}</p>
            </div>
          )}

          <div className={NB_GROUP}>Qui i quan</div>

          <BookingClientEventSection
            leadData={leadData ? {
              id: leadData.id,
              name: leadData.name,
              email: leadData.email,
              budget: leadData.budget,
            } : null}
            form={{
              clientName: form.clientName,
              clientEmail: form.clientEmail,
              clientPhone: form.clientPhone,
              eventType: form.eventType,
              eventDate: form.eventDate,
              eventStartTime: form.eventStartTime,
              eventEndTime: form.eventEndTime,
              eventLocation: form.eventLocation,
              eventVenue: form.eventVenue,
              guestCount: form.guestCount,
            }}
            calculatingDistance={calculatingDistance}
            distanceMessage={distanceMessage}
            dateConflicts={dateConflicts}
            onFieldChange={updateField}
          />

          <div className={NB_GROUP}>Què contractem</div>

          <BookingServiceLinesSection
            lines={serviceLines}
            onChange={setServiceLines}
            packs={packs}
            selectedPackId={form.packId}
            onPackSelect={(packId) => { updateField('packId', packId); setCustomPackPrice(''); }}
            customPackPrice={customPackPrice}
            onCustomPackPriceChange={setCustomPackPrice}
          />

          <BookingPackExtrasSection
            packs={packs}
            displayExtras={displayExtras}
            selectedExtras={selectedExtras}
            selectedPackId={form.packId}
            extraHours={form.extraHours}
            customPackPrice={customPackPrice}
            collapsed={!showPack}
            onToggleCollapsed={() => setShowPack((v) => !v)}
            onPackSelect={(packId) => { updateField('packId', packId); setCustomPackPrice(''); }}
            onExtraHoursChange={(value) => updateField('extraHours', value)}
            onCustomPackPriceChange={setCustomPackPrice}
            onToggleExtra={toggleExtra}
            onUpdateExtraQuantity={updateExtraQuantity}
          />

          <BookingTravelDiscountSection
            form={{
              distanceKm: form.distanceKm,
              discount: form.discount,
              discountCode: form.discountCode,
              notes: form.notes,
            }}
            travelBlocks={travelBlocks}
            travelCharge={travelCharge}
            billableKm={billableKm}
            includedTravelKm={INCLUDED_TRAVEL_KM}
            travelBlockKm={TRAVEL_BLOCK_KM}
            travelBlockEur={TRAVEL_BLOCK_EUR}
            fuelReferenceInfo={fuelReferenceInfo}
            validatingCode={validatingCode}
            discountValidation={discountValidation}
            onFieldChange={updateField}
            onResetDiscountValidation={resetDiscountValidation}
            onValidateDiscountCode={() => void validateDiscountCode(form.discountCode)}
          />

          <AdminSection title="Transport real" description="Vehicle, conductor i persones">
            <div className="grid gap-3 md:grid-cols-3">
              <label className={NB_FIELD}>
                <span className={NB_LABEL}>Hores totals de cotxe</span>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={travelRouteHours}
                  onChange={(event) => setTravelRouteHours(event.target.value)}
                  placeholder={travelCostBreakdown.routeHours ? String(travelCostBreakdown.routeHours) : '0'}
                  className="adm-input"
                />
                <span className={NB_HINT}>Anada + tornada. Si ho deixes buit, estima per km.</span>
              </label>
              <label className={NB_FIELD}>
                <span className={NB_LABEL}>Vehicle</span>
                <select value={travelVehicleOwner} onChange={(event) => setTravelVehicleOwner(event.target.value)} className="adm-input">
                  <option value="OWNER">Vehicle Òrbita</option>
                  <option value="PARTNER" disabled={!travelPartner}>Vehicle proveïdor</option>
                </select>
              </label>
              <label className={NB_FIELD}>
                <span className={NB_LABEL}>Proveïdor/persona externa</span>
                <select value={travelPartnerId} onChange={(event) => setTravelPartnerId(event.target.value)} className="adm-input">
                  <option value="">Cap proveïdor</option>
                  {renderPartnerOptions(partners)}
                </select>
              </label>
              <label className={NB_FIELD}>
                <span className={NB_LABEL}>Conductor</span>
                <select value={travelDriver} onChange={(event) => setTravelDriver(event.target.value)} className="adm-input">
                  <option value="OWNER">Òrbita</option>
                  <option value="PARTNER" disabled={!travelPartner}>Proveïdor</option>
                </select>
              </label>
              <label className={NB_FIELD}>
                <span className={NB_LABEL}>Passatgers Òrbita</span>
                <input type="number" min={0} step={1} value={travelOwnerPassengers} onChange={(event) => setTravelOwnerPassengers(event.target.value)} className="adm-input" />
              </label>
              <label className={NB_FIELD}>
                <span className={NB_LABEL}>Passatgers proveïdor</span>
                <input type="number" min={0} step={1} value={travelPartnerPassengers} onChange={(event) => setTravelPartnerPassengers(event.target.value)} className="adm-input" disabled={!travelPartner} />
              </label>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <div className="ap-kpi"><p className="text-xs font-medium uppercase">Vehicle</p><p className="text-lg font-bold">{formatCurrency(travelCostBreakdown.vehicleCost)}</p></div>
              <div className="ap-kpi"><p className="text-xs font-medium uppercase">Conductor</p><p className="text-lg font-bold">{formatCurrency(travelCostBreakdown.driverCost)}</p></div>
              <div className="ap-kpi"><p className="text-xs font-medium uppercase">Passatgers</p><p className="text-lg font-bold">{formatCurrency(travelCostBreakdown.passengerCost)}</p></div>
              <div className="ap-kpi"><p className="text-xs font-medium uppercase">Cost ruta</p><p className="text-lg font-bold">{formatCurrency(travelCostBreakdown.totalCost)}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" className="ap-btn ap-btn--secondary" onClick={applyTravelCostLines} disabled={travelCostBreakdown.totalCost <= 0}>
                Aplicar al bolo
              </button>
              <span className={NB_HINT}>Crea línies de cost marcades com a transport; si ho tornes a aplicar, substitueix les anteriors.</span>
            </div>
          </AdminSection>

          <div className={NB_GROUP}>Preu i tancament</div>

          <AdminSection title="Preu acordat" description="Resum econòmic del bolo">
            <div className="flex flex-wrap gap-4">
              <div className={narrowField}>
                <label htmlFor="nb-manual-total" className={NB_LABEL}>Total tancat amb el client</label>
                <input
                  id="nb-manual-total" type="number" min={0} placeholder="Ex. 340"
                  value={manualTotalPrice} onChange={(e) => setManualTotalPrice(e.target.value)}
                  className="adm-input"
                />
                <span className={NB_HINT}>preu final pactat; substitueix el càlcul automàtic</span>
              </div>
              <div className={narrowField}>
                <span className={NB_LABEL}>Fiscalitat</span>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--t2)]">
                  <input
                    type="checkbox" checked={invoiceRequired}
                    onChange={(e) => setInvoiceRequired(e.target.checked)}
                    className="accent-[var(--gold)]"
                    role="switch" aria-checked={invoiceRequired}
                  />
                  Factura amb IVA
                  {invoiceRequired && <span className="ml-1 text-xs text-[var(--o-warning)]">+{fiscalMode.vatRate}% IVA</span>}
                </label>
                <span className={NB_HINT}>{fiscalMode.help}</span>
              </div>
            </div>

            {pricing && manualTotalPrice && (() => {
              const calculat = Math.max(0, pricing.subtotal - pricing.discount);
              const pactat = Number(manualTotalPrice);
              const diff = pactat - calculat;
              const diffPct = calculat > 0 ? (diff / calculat) * 100 : null;
              if (!diff) return null;
              return (
                <p className="mt-2.5 text-xs text-[var(--t2)]">
                  Pactat {diff > 0 ? '+' : ''}{formatCurrency(diff)} sobre el calculat ({formatCurrency(calculat)})
                  {diffPct != null ? ` · ${diffPct > 0 ? '+' : ''}${diffPct.toFixed(0)}%` : ''}
                  <span className="text-[var(--t3)]"> · el marge i el total complet són al resum de la dreta</span>
                </p>
              );
            })()}
          </AdminSection>

          <AdminSection
            title="Origen i facturació"
            description={(() => {
              const src = partners.find((p) => p.id === sourceCollaboratorId);
              const bill = partners.find((p) => p.id === billedCollaboratorId);
              const origin = src ? `Ve de ${src.company || src.name}` : 'Client directe';
              const billing = bill ? `factura a ${bill.company || bill.name}` : 'factura al client final';
              return `${origin} · ${billing}`;
            })()}
            actions={(
              <button type="button" className="ap-btn ap-btn--xs" onClick={() => setShowSourceBilling((v) => !v)}>
                {showSourceBilling ? 'Amagar' : 'Ajustar'}
              </button>
            )}
          >
            {showSourceBilling && (
              <div className="grid gap-3 md:grid-cols-2">
                <label className={NB_FIELD}>
                  <span className={NB_LABEL}>D&apos;on ve el bolo</span>
                  <select value={sourceCollaboratorId} onChange={(e) => setSourceCollaboratorId(e.target.value)} className="adm-input">
                    <option value="">Client directe (cap intermediari)</option>
                    {renderPartnerOptions(partners)}
                  </select>
                </label>
                <label className={NB_FIELD}>
                  <span className={NB_LABEL}>A qui facturem</span>
                  <select value={billedCollaboratorId} onChange={(e) => setBilledCollaboratorId(e.target.value)} className="adm-input">
                    <option value="">Al client final</option>
                    {renderPartnerOptions(partners)}
                  </select>
                </label>
              </div>
            )}
          </AdminSection>
        </div>

        <aside className="flex flex-col gap-3.5 xl:sticky xl:top-4">
          {pricing && (
            <BookingPricingSummary
              pricing={pricing}
              travelBlocks={travelBlocks}
              internalTravelCost={internalTravelCost}
              defaultVehicleCostPerKm={DEFAULT_VEHICLE_COST_PER_KM}
              marginEstimate={marginEstimate}
            />
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitDisabled}
              className="ap-btn ap-btn--primary w-full"
            >
              {submitting ? 'Creant reserva…' : 'Crear reserva'}
            </button>
            <Link href={backHref} className="ap-btn w-full">
              Cancel·lar
            </Link>
          </div>
        </aside>
      </div>
    </AdminPage>
  );
}
