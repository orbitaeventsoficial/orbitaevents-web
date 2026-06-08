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
import type { BookingExtra, BookingFormData, BookingSelectedExtras } from './booking-form.types';
import { OPERATOR_EXTRA_ID } from './booking-form.types';
import './nb-design.css';

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
  const [sourceCollaboratorId, setSourceCollaboratorId] = useState('');
  const [billedCollaboratorId, setBilledCollaboratorId] = useState('');
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

  const submitDisabled = submitting || !form.clientName || !form.clientEmail || !form.packId;

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

          <section className="nb__panel">
            <div className="nb__phead">
              <h2 className="nb__h2">Origen i facturació</h2>
              <span className="nb__pintro">Qui ens passa el bolo i qui el paga</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="nb__field">
                <span className="nb__label">Bolo passat per</span>
                <select
                  value={sourceCollaboratorId}
                  onChange={(e) => setSourceCollaboratorId(e.target.value)}
                  className="nb__input"
                >
                  <option value="">Client directe (ningú)</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.company ? `${partner.name} · ${partner.company}` : partner.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="nb__field">
                <span className="nb__label">Qui paga el bolo</span>
                <select
                  value={billedCollaboratorId}
                  onChange={(e) => setBilledCollaboratorId(e.target.value)}
                  className="nb__input"
                >
                  <option value="">El client final</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      Factura a: {partner.company ? `${partner.name} · ${partner.company}` : partner.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="nb__hint">Els serveis i productes del bolo (DJ, tècnic, animació…) s&apos;afegeixen a baix, a «Serveis i productes».</p>
          </section>

          <BookingPackExtrasSection
            packs={packs}
            displayExtras={displayExtras}
            selectedExtras={selectedExtras}
            selectedPackId={form.packId}
            extraHours={form.extraHours}
            customPackPrice={customPackPrice}
            manualTotalPrice={manualTotalPrice}
            invoiceRequired={invoiceRequired}
            onPackSelect={(packId) => { updateField('packId', packId); setCustomPackPrice(''); setManualTotalPrice(''); }}
            onExtraHoursChange={(value) => updateField('extraHours', value)}
            onCustomPackPriceChange={setCustomPackPrice}
            onManualTotalPriceChange={setManualTotalPrice}
            onInvoiceRequiredChange={setInvoiceRequired}
            onToggleExtra={toggleExtra}
            onUpdateExtraQuantity={updateExtraQuantity}
          />

          <BookingServiceLinesSection
            lines={serviceLines}
            onChange={setServiceLines}
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
