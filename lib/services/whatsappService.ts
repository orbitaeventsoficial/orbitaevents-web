import { log } from '@/lib/logger';
import { normalizePhone } from '@/lib/utils/normalize';

interface WhatsAppSendInput {
  to: string;
  text: string;
}

interface WhatsAppSendResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export async function sendWhatsAppText(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!apiUrl || !token) {
    return { ok: false, error: 'WHATSAPP_API_URL/WHATSAPP_API_TOKEN no configurats' };
  }

  const to = normalizePhone(input.to);
  if (!to) {
    return { ok: false, error: 'Telèfon no vàlid' };
  }

  try {
    const response = await fetch(`${apiUrl}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: input.text },
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const details = payload?.error?.message || payload?.message || 'Error enviando WhatsApp';
      return { ok: false, error: details };
    }

    const providerMessageId = payload?.messages?.[0]?.id;
    return { ok: true, providerMessageId };
  } catch (error) {
    log.error('sendWhatsAppText failed', error);
    return { ok: false, error: 'Excepción enviando WhatsApp' };
  }
}

