'use client';

/* ============================================================================
   ÒRBITA ADMIN — Nova reserva (Brass & Obsidian)
   ----------------------------------------------------------------------------
   Shell `nb-root` amb top bar + hero + layout 2 columnes (main + sidebar
   sticky). Reaprofita tots els hooks i la lògica existent. Substitueix
   `<AdminPage>` (vell) i les classes Tailwind del Frankenstein per CSS
   canònic `nb__*` consumint tokens Studio.
   Canvi #842.
============================================================================ */

import { useEffect, useState } from 'react';
import { VAT_RATE_INVOICE } from '@/lib/constants/pricing';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { DEFAULT_VEHICLE_COST_PER_KM, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_EUR, TRAVEL_BLOCK_KM } from '@/lib/services/travelCost';
import { useToast } from '../components/ToastProvider';
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
import { OPERATOR_EXTRA_ID } from './booking-form.types';
import './nb-design.css';

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
  const autosaveKey = `booking-new-${leadId || customerId || 'lliure'}`;
  const { restored: bookingDraftRestored, clear: clearBookingDraft } = useFormAutosave(
    autosaveKey, form, setForm, { enabled: !loading },
  );
  const [selectedExtras, setSelectedExtras] = useState<BookingSelectedExtras>({});
  const [customPackPrice, setCustomPackPrice] = useState('');
  const [manualTotalPrice, setManualTotalPrice] = useState('');
  const [serviceLines, setServiceLines] = useState<BookingServiceLineFormInput[]>([]);
  // Arrossega el pressupost del lead com a punt de partida del preu acordat.
  useEffect(() => {
    if (!leadData?.budget || manualTotalPrice) return;
    const parsed = String(leadData.budget).replace(/[^\d]/g, '');
    if (parsed) setManualTotalPrice(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- només ha de reaccionar quan arriba leadData, no a manualTotalPrice
  }, [leadData]);
  const [invoiceRequired, setInvoiceRequired] = useState(false);
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
      <div className="nb-root">
        <div className="nb__loading"><span className="nb__spinner" aria-label="Carregant" /></div>
      </div>
    );
  }

  // El bolo no pot ser buit: pack de catàleg, o serveis/productes, o total pactat.
  const boloNotEmpty = !!form.packId || serviceLines.length > 0 || Object.keys(selectedExtras).length > 0 || (!!manualTotalPrice && Number(manualTotalPrice) > 0);
  const submitDisabled = submitting || !form.clientName || !form.clientEmail || !boloNotEmpty;

  return (
    <div className="nb-root">
      <div className="nb__bar">
        <Link href={backHref} className="nb__back">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12L6 8l4-4" /></svg>
          {backLabel}
        </Link>
        <span className="nb__crumb">{crumbContext} <em>/</em> <strong>Nova reserva</strong></span>
      </div>

      <div className="nb__hero">
        <span className="nb__eyebrow">Nova reserva</span>
        <h1 className="nb__h1">{leadData ? leadData.name : 'Crear reserva'}</h1>
        <p className="nb__sub">
          {leadData ? (
            <>
              Des de l&apos;entrada <Link href={buildLeadWorkspaceHref(leadData.id)} className="nb__leadlink">{leadData.name}</Link>
              {leadData.budget && <> · Pressupost <b>{leadData.budget}</b></>}
              {leadData.email && <> · {leadData.email}</>}
            </>
          ) : (
            'Omple les dades del client, l\'esdeveniment i selecciona un pack.'
          )}
        </p>
      </div>

      <div className="nb__layout">
        <div className="nb__main">
          {error && (
            <div className="nb__panel nb__panel--error">
              <p className="nb__errortext">{error}</p>
            </div>
          )}

          {bookingDraftRestored && (
            <div className="nb__autosave" role="status">
              <span>S&apos;ha recuperat un esborrany d&apos;aquesta reserva.</span>
              <button type="button" className="nb__toggle" onClick={clearBookingDraft}>Descartar esborrany</button>
            </div>
          )}

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

          <BookingServiceLinesSection
            lines={serviceLines}
            onChange={setServiceLines}
          />

          <section className="nb__panel">
            <div className="nb__phead">
              <h2 className="nb__h2">Preu i facturació</h2>
              <span className="nb__pintro">Total pactat i factura</span>
            </div>
            <div className="nb__pack-tune-grid">
              <div className="nb__field nb__field--narrow">
                <label htmlFor="nb-manual-total" className="nb__label">Total tancat amb el client</label>
                <input
                  id="nb-manual-total" type="number" min={0} placeholder="Ex. 340"
                  value={manualTotalPrice} onChange={(e) => setManualTotalPrice(e.target.value)}
                  className="nb__input"
                />
                <span className="nb__field-hint">preu final pactat; substitueix el càlcul automàtic</span>
              </div>
              <div className="nb__field nb__field--narrow">
                <span className="nb__label">Factura</span>
                <label className="nb__invoice-check">
                  <input
                    type="checkbox" checked={invoiceRequired}
                    onChange={(e) => setInvoiceRequired(e.target.checked)}
                    role="switch" aria-checked={invoiceRequired}
                  />
                  Vol factura
                  {invoiceRequired && <span className="nb__vat-flag">+{VAT_RATE_INVOICE}% IVA</span>}
                </label>
              </div>
            </div>
          </section>

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

          <section className="nb__panel">
            <div className="nb__phead nb__phead--toggle">
              <div>
                <h2 className="nb__h2">Origen i facturació</h2>
                <span className="nb__pintro">
                  {(() => {
                    const src = partners.find((p) => p.id === sourceCollaboratorId);
                    const bill = partners.find((p) => p.id === billedCollaboratorId);
                    const origin = src ? `Ve de ${src.company || src.name}` : 'Client directe';
                    const billing = bill ? `factura a ${bill.company || bill.name}` : 'factura al client final';
                    return `${origin} · ${billing}`;
                  })()}
                </span>
              </div>
              <button type="button" className="nb__toggle" onClick={() => setShowSourceBilling((v) => !v)}>
                {showSourceBilling ? 'Amagar' : 'Ajustar'}
              </button>
            </div>
            {showSourceBilling && (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="nb__field">
                  <span className="nb__label">D&apos;on ve el bolo</span>
                  <select value={sourceCollaboratorId} onChange={(e) => setSourceCollaboratorId(e.target.value)} className="nb__input">
                    <option value="">Client directe (cap intermediari)</option>
                    {renderPartnerOptions(partners)}
                  </select>
                </label>
                <label className="nb__field">
                  <span className="nb__label">A qui facturem</span>
                  <select value={billedCollaboratorId} onChange={(e) => setBilledCollaboratorId(e.target.value)} className="nb__input">
                    <option value="">Al client final</option>
                    {renderPartnerOptions(partners)}
                  </select>
                </label>
              </div>
            )}
          </section>

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
        </div>

        <aside className="nb__side">
          {pricing && (
            <BookingPricingSummary
              pricing={pricing}
              travelBlocks={travelBlocks}
              internalTravelCost={internalTravelCost}
              defaultVehicleCostPerKm={DEFAULT_VEHICLE_COST_PER_KM}
              marginEstimate={marginEstimate}
            />
          )}
          <div className="nb__cta">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitDisabled}
              className="nb__btn--prim"
            >
              {submitting ? 'Creant reserva…' : 'Crear reserva'}
            </button>
            <Link href={backHref} className="nb__btn--sec">
              Cancel·lar
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
