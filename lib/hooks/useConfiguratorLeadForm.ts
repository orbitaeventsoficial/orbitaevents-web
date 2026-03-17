import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

type ConfiguratorLeadFormData = {
  name: string;
  contact: string;
};

interface UseConfiguratorLeadFormOptions<TPayload> {
  buildPayload: (formData: ConfiguratorLeadFormData, turnstileToken: string) => TPayload;
  onSuccess?: () => void;
  validate: {
    errorName: string;
    errorContact: string;
    errorCaptcha: string;
    errorSend: string;
  };
}

export function useConfiguratorLeadForm<TPayload>({
  buildPayload,
  onSuccess,
  validate,
}: UseConfiguratorLeadFormOptions<TPayload>) {
  const [formData, setFormData] = useState<ConfiguratorLeadFormData>({ name: '', contact: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const updateField = (field: keyof ConfiguratorLeadFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const clearError = () => {
    setFormError('');
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name || formData.name.length < 2) {
      setFormError(validate.errorName);
      return;
    }

    if (!formData.contact || formData.contact.length < 5) {
      setFormError(validate.errorContact);
      return;
    }

    if (!turnstileToken) {
      setFormError(validate.errorCaptcha);
      return;
    }

    setSending(true);
    setFormError('');

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();

    timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const response = await fetchWithCsrf('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(buildPayload(formData, turnstileToken)),
      });

      if (!response.ok) {
        throw new Error('REQUEST_SEND_ERROR');
      }

      setSent(true);
      onSuccess?.();
    } catch {
      setFormError(validate.errorSend);
      setSending(false);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  return {
    formData,
    sending,
    sent,
    formError,
    turnstileToken,
    updateField,
    clearError,
    setTurnstileToken,
    submitForm,
  };
}
