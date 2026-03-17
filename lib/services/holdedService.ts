/**
 * Holded Integration Service
 *
 * Capa d'abstracció per a la integració amb Holded (comptabilitat espanyola).
 * Dissenyat per permetre canviar a Quaderno o similar en el futur.
 *
 * Fallback silenciós si HOLDED_ENABLED=false.
 */

import { log } from '@/lib/logger';

const HOLDED_API_BASE = 'https://api.holded.com/api/invoicing/v1';

// ============================================
// CONFIG
// ============================================

export function isHoldedEnabled(): boolean {
  return process.env.HOLDED_ENABLED === 'true' && !!process.env.HOLDED_API_KEY;
}

function getApiKey(): string {
  const key = process.env.HOLDED_API_KEY;
  if (!key) throw new Error('HOLDED_API_KEY no configurat');
  return key;
}

async function holdedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = getApiKey();
  const url = `${HOLDED_API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      key: apiKey,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    log.error(`Holded API error: ${res.status} ${endpoint}`, { body });
    throw new Error(`Holded API error: ${res.status} — ${body}`);
  }

  return res;
}

// ============================================
// CONTACTS
// ============================================

interface HoldedContact {
  id: string;
  name: string;
  email?: string;
  vatnumber?: string;
}

/**
 * Cerca un contacte a Holded per NIF o email, o en crea un de nou.
 */
export async function findOrCreateHoldedContact(data: {
  name: string;
  email: string;
  nif?: string;
  address?: string;
  phone?: string;
}): Promise<string> {
  if (!isHoldedEnabled()) {
    log.info('Holded desactivat — salt findOrCreateHoldedContact');
    return '';
  }

  try {
    // Search by NIF first
    if (data.nif) {
      const searchRes = await holdedFetch(`/contacts?vatnumber=${encodeURIComponent(data.nif)}`);
      const contacts: HoldedContact[] = await searchRes.json();
      if (contacts.length > 0) {
        return contacts[0].id;
      }
    }

    // Search by email
    const searchRes = await holdedFetch(`/contacts?email=${encodeURIComponent(data.email)}`);
    const contacts: HoldedContact[] = await searchRes.json();
    if (contacts.length > 0) {
      return contacts[0].id;
    }

    // Create new contact
    const createRes = await holdedFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        vatnumber: data.nif || undefined,
        billAddress: data.address
          ? {
              address: data.address,
              country: 'ES',
            }
          : undefined,
        phone: data.phone || undefined,
        type: 'client',
      }),
    });

    const created = (await createRes.json()) as { id: string };
    log.info(`Holded: contacte creat ${created.id} per ${data.email}`);
    return created.id;
  } catch (error) {
    log.error('Error findOrCreateHoldedContact', error);
    throw error;
  }
}

// ============================================
// INVOICES
// ============================================

interface HoldedInvoiceItem {
  name: string;
  units: number;
  subtotal: number;
  tax: number; // 21 for 21%
}

interface CreateHoldedInvoiceData {
  contactId: string;
  description?: string;
  items: HoldedInvoiceItem[];
  notes?: string;
}

interface HoldedInvoiceResult {
  id: string;
  invoiceNum?: string;
  status?: string;
}

/**
 * Crea una factura a Holded.
 */
export async function createHoldedInvoice(
  data: CreateHoldedInvoiceData
): Promise<HoldedInvoiceResult> {
  if (!isHoldedEnabled()) {
    log.info('Holded desactivat — salt createHoldedInvoice');
    return { id: '' };
  }

  try {
    const res = await holdedFetch('/documents/invoice', {
      method: 'POST',
      body: JSON.stringify({
        contactId: data.contactId,
        desc: data.description || 'Factura Òrbita Events',
        items: data.items.map((item) => ({
          name: item.name,
          units: item.units,
          subtotal: item.subtotal,
          tax: item.tax,
        })),
        notes: data.notes || '',
      }),
    });

    const result = (await res.json()) as HoldedInvoiceResult;
    log.info(`Holded: factura creada ${result.id}`);
    return result;
  } catch (error) {
    log.error('Error createHoldedInvoice', error);
    throw error;
  }
}

/**
 * Obté l'estat d'una factura a Holded.
 */
export async function getHoldedInvoiceStatus(
  invoiceId: string
): Promise<{ status: string; url?: string } | null> {
  if (!isHoldedEnabled() || !invoiceId) return null;

  try {
    const res = await holdedFetch(`/documents/invoice/${invoiceId}`);
    const data = (await res.json()) as { status: string; publicUrl?: string };
    return {
      status: data.status,
      url: data.publicUrl,
    };
  } catch (error) {
    log.error('Error getHoldedInvoiceStatus', error);
    return null;
  }
}

