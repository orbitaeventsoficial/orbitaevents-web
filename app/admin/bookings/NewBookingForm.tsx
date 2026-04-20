'use client';

/**
 * FORMULARI NOVA RESERVA - Creació de reserves des de l'admin
 * Carrega packs i extras, calcula preus en temps real
 * Pot pre-omplir des d'un lead (leadId) o client (customerId)
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminPage } from '../components/AdminPage';
import { buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';
import { DEFAULT_VEHICLE_COST_PER_KM, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_EUR, TRAVEL_BLOCK_KM } from '@/lib/services/travelCost';
import { useToast } from '../components/ToastProvider';
import BookingPricingSummary from './BookingPricingSummary';
import BookingPackExtrasSection from './BookingPackExtrasSection';
import BookingTravelDiscountSection from './BookingTravelDiscountSection';
import BookingClientEventSection from './BookingClientEventSection';
import { useNewBookingInitialData } from './useNewBookingInitialData';
import { useNewBookingSubmit } from './useNewBookingSubmit';
import { useBookingDiscountValidation } from './useBookingDiscountValidation';
import { useBookingDistance } from './useBookingDistance';
import { useBookingDateConflicts } from './useBookingDateConflicts';
import { useBookingPricing } from './useBookingPricing';
import type { BookingExtra, BookingFormData, BookingSelectedExtras } from './booking-form.types';
import { OPERATOR_EXTRA_ID } from './booking-form.types';

export default function NewBookingForm() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const leadId = searchParams?.get('leadId') ?? null;
  const customerId = searchParams?.get('customerId') ?? null;
  const dateParam = searchParams?.get('date') ?? null;
  const customerHubBookingsHref = customerId ? buildCustomerWorkspaceTabHref(customerId, 'bookings') : '/admin/bookings';

  const { form, setForm, packs, extras, loading, leadData, fuelReferenceInfo } = useNewBookingInitialData({ leadId, dateParam });
  const [selectedExtras, setSelectedExtras] = useState<BookingSelectedExtras>({});
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

  const { submitting, error, setError, submit: handleSubmit } = useNewBookingSubmit({
    form,
    selectedExtras,
    leadId,
    leadData,
    customerId,
    internalTravelCost,
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
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <AdminPage
      title="Nova reserva"
      subtitle={leadData ? `Des de l'entrada de ${leadData.name}` : 'Crear una reserva manualment'}
      back={{ href: customerHubBookingsHref, label: customerId ? 'Client' : 'Reserves' }}
      className="max-w-5xl"
    >
      {error && (
        <div className="rounded-xl border p-4">
          <p className="text-sm">{error}</p>
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

      <BookingPackExtrasSection
        packs={packs}
        displayExtras={displayExtras}
        selectedExtras={selectedExtras}
        selectedPackId={form.packId}
        extraHours={form.extraHours}
        onPackSelect={(packId) => updateField('packId', packId)}
        onExtraHoursChange={(value) => updateField('extraHours', value)}
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

      {pricing && (
        <BookingPricingSummary
          pricing={pricing}
          travelBlocks={travelBlocks}
          internalTravelCost={internalTravelCost}
          defaultVehicleCostPerKm={DEFAULT_VEHICLE_COST_PER_KM}
          marginEstimate={marginEstimate}
        />
      )}

      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.clientName || !form.clientEmail || !form.packId}
          className="ap-btn ap-btn--primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Creant reserva...' : 'Crear reserva'}
        </button>
        <Link
          href={customerHubBookingsHref}
          className="ap-btn ap-btn--secondary px-4 py-3 text-sm"
        >
          Cancel·lar
        </Link>
      </div>
    </AdminPage>
  );
}
