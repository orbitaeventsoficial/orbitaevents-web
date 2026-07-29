'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';

type ReminderActionKey = 'email' | 'whatsapp-api' | 'whatsapp-log';

const PAYMENT_REMINDER_ERROR = 'No s\'ha pogut actualitzar el recordatori';

function getReminderErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function isFailedPayload(data: unknown): boolean {
  return Boolean(data && typeof data === 'object' && 'ok' in data && (data as { ok?: unknown }).ok === false);
}

export default function PaymentReminderActions({
  bookingId,
  phone,
  message,
}: {
  bookingId: string;
  phone: string;
  message: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<ReminderActionKey | null>(null);
  const [error, setError] = useState<{ message: string; actionKey: ReminderActionKey } | null>(null);
  const errorId = `payment-reminder-${bookingId}-error`;

  async function runCommunication(
    actionKey: ReminderActionKey,
    payload: Record<string, unknown>,
    fallback: string,
  ) {
    setLoading(actionKey);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || isFailedPayload(data)) {
        throw new Error(getReminderErrorMessage(data, fallback));
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error && err.message.trim() ? err.message : fallback;
      setError({ message: message || PAYMENT_REMINDER_ERROR, actionKey });
    } finally {
      setLoading(null);
    }
  }

  async function sendEmailReminder() {
    await runCommunication('email', { action: 'send_email', flow: 'PAYMENT' }, 'No s\'ha pogut enviar el correu');
  }

  async function markWhatsAppSent() {
    await runCommunication(
      'whatsapp-log',
      { action: 'log_sent', flow: 'PAYMENT', channel: 'whatsapp' },
      'No s\'ha pogut desar l\'estat',
    );
  }

  async function sendWhatsAppApi() {
    await runCommunication(
      'whatsapp-api',
      { action: 'send_whatsapp', flow: 'PAYMENT' },
      'No s\'ha pogut enviar per WhatsApp API',
    );
  }

  const waLink = `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;

  return (
    <div className="mt-2 flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={sendEmailReminder}
          disabled={Boolean(loading)}
          aria-invalid={error?.actionKey === 'email' ? true : undefined}
          aria-describedby={error?.actionKey === 'email' ? errorId : undefined}
          className="ap-btn ap-btn--xs"
        >
          {loading === 'email' ? '...' : 'Email'}
        </button>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="ap-btn ap-btn--xs"
        >
          Obrir WA
        </a>
        <button
          type="button"
          onClick={sendWhatsAppApi}
          disabled={Boolean(loading)}
          aria-invalid={error?.actionKey === 'whatsapp-api' ? true : undefined}
          aria-describedby={error?.actionKey === 'whatsapp-api' ? errorId : undefined}
          className="ap-btn ap-btn--xs"
        >
          {loading === 'whatsapp-api' ? '...' : 'WA API'}
        </button>
        <button
          type="button"
          onClick={markWhatsAppSent}
          disabled={Boolean(loading)}
          aria-invalid={error?.actionKey === 'whatsapp-log' ? true : undefined}
          aria-describedby={error?.actionKey === 'whatsapp-log' ? errorId : undefined}
          className="ap-btn ap-btn--xs"
        >
          {loading === 'whatsapp-log' ? '...' : 'Marcar WA enviat'}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs leading-snug admin-tone-text-danger">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
