'use client';

import { useCallback, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import type { BookingDiscountValidation, BookingPack, BookingSelectedExtras } from './booking-form.types';
import { log } from '@/lib/logger';

interface UseBookingDiscountValidationOptions {
  packs: Pick<BookingPack, 'id' | 'price'>[];
  selectedPackId: string;
  selectedExtras: BookingSelectedExtras;
  onApplyDiscount: (value: string) => void;
  onValidationError: (message: string) => void;
}

export function useBookingDiscountValidation({
  packs,
  selectedPackId,
  selectedExtras,
  onApplyDiscount,
  onValidationError,
}: UseBookingDiscountValidationOptions) {
  const [discountValidation, setDiscountValidation] = useState<BookingDiscountValidation | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);

  const resetDiscountValidation = useCallback(() => {
    setDiscountValidation(null);
  }, []);

  const validateDiscountCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setDiscountValidation(null);
      return;
    }

    setValidatingCode(true);
    try {
      const res = await fetchWithCsrf(`/api/public/discount-code?code=${encodeURIComponent(code.trim())}`);
      if (!res.ok) {
        throw new Error('No s\'ha pogut validar el codi');
      }

      const data = await res.json();
      setDiscountValidation(data);

      if (data.valid && data.type && data.value != null) {
        if (data.type === 'PERCENTAGE') {
          const selectedPack = packs.find((pack) => pack.id === selectedPackId);
          if (selectedPack) {
            const subtotal = selectedPack.price + Object.values(selectedExtras).reduce((sum, extra) => sum + extra.price * extra.quantity, 0);
            const discountAmount = Math.round(subtotal * (data.value / 100));
            onApplyDiscount(String(discountAmount));
          }
        } else {
          onApplyDiscount(String(data.value));
        }
      }
    } catch (error) {
      log.error('[NewBooking] Error validant codi descompte', error);
      onValidationError('Error validant el codi de descompte');
    } finally {
      setValidatingCode(false);
    }
  }, [onApplyDiscount, onValidationError, packs, selectedExtras, selectedPackId]);

  return {
    discountValidation,
    validatingCode,
    resetDiscountValidation,
    validateDiscountCode,
  };
}
