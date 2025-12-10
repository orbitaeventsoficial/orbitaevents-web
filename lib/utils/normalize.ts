/**
 * UTILITATS DE NORMALITZACIÓ DE DADES
 * Òrbita Events - Ecosistema CRM
 *
 * Aquestes funcions normalitzen les dades dels clients per:
 * - Detectar duplicats (mateix email/telèfon amb diferents formats)
 * - Facilitar cerques (noms sense accents)
 * - Unificar formats (telèfons amb prefix internacional)
 */

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalitza un email per detectar duplicats
 * - Lowercase
 * - Elimina espais
 * - Elimina punts de Gmail (j.o.h.n@gmail.com = john@gmail.com)
 * - Elimina +alias de Gmail (john+test@gmail.com = john@gmail.com)
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';

  let normalized = email.toLowerCase().trim();

  // Detectar si és Gmail
  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) return normalized;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Eliminar punts del local part
    let cleanLocal = localPart.replace(/\./g, '');
    // Eliminar tot després de +
    cleanLocal = cleanLocal.split('+')[0];
    normalized = `${cleanLocal}@gmail.com`;
  }

  return normalized;
}

/**
 * Valida format d'email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ═══════════════════════════════════════════════════════════════════════════
// TELÈFON
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalitza un telèfon per detectar duplicats
 * - Elimina espais, guions, parèntesis
 * - Afegeix prefix +34 si no en té (per Espanya)
 * - Retorna només dígits amb prefix
 */
export function normalizePhone(phone: string, defaultCountryCode = '+34'): string {
  if (!phone) return '';

  // Eliminar tot excepte dígits i +
  let digits = phone.replace(/[^\d+]/g, '');

  // Si comença amb 00, convertir a +
  if (digits.startsWith('00')) {
    digits = '+' + digits.slice(2);
  }

  // Si no té prefix internacional, afegir el default
  if (!digits.startsWith('+')) {
    // Si comença amb 0 (prefix nacional), eliminar-lo
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    digits = defaultCountryCode + digits;
  }

  return digits;
}

/**
 * Formata un telèfon per mostrar
 * +34612345678 -> +34 612 345 678
 */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return '';

  // Format espanyol
  if (normalized.startsWith('+34') && normalized.length === 12) {
    const number = normalized.slice(3);
    return `+34 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  }

  return normalized;
}

/**
 * Valida format de telèfon (mínim 9 dígits sense prefix)
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Mínim: +XX + 9 dígits
  return normalized.length >= 11;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalitza un nom per cerques i comparacions
 * - Lowercase
 * - Elimina accents
 * - Elimina espais múltiples
 * - Elimina caràcters especials
 */
export function normalizeName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Eliminar accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Eliminar espais múltiples
    .replace(/\s+/g, ' ')
    // Eliminar caràcters especials (mantenir espais i lletres)
    .replace(/[^a-z0-9\s]/g, '');
}

/**
 * Capitalitza un nom correctament
 * "JOAN GARCIA LÓPEZ" -> "Joan Garcia López"
 * "joan garcia" -> "Joan Garcia"
 */
export function capitalizeName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      // Partícules que no es capitalitzen (de, del, de la, etc.)
      const particles = ['de', 'del', 'la', 'las', 'los', 'el', 'i', 'y', 'e'];
      if (particles.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

/**
 * Extreu el primer nom d'un nom complet
 */
export function getFirstName(fullName: string): string {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0];
}

/**
 * Genera inicials d'un nom
 * "Joan Garcia López" -> "JG"
 */
export function getInitials(name: string, maxChars = 2): string {
  if (!name) return '';

  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, maxChars)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTAGRAM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalitza un handle d'Instagram
 * - Elimina @
 * - Lowercase
 * - Elimina URL si es passa
 */
export function normalizeInstagram(instagram: string): string {
  if (!instagram) return '';

  let handle = instagram.trim().toLowerCase();

  // Si és una URL, extreure el handle
  if (handle.includes('instagram.com/')) {
    const match = handle.match(/instagram\.com\/([^/?]+)/);
    if (match) {
      handle = match[1];
    }
  }

  // Eliminar @ si existeix
  handle = handle.replace(/^@/, '');

  // Eliminar caràcters no vàlids (Instagram només permet a-z, 0-9, . i _)
  handle = handle.replace(/[^a-z0-9._]/g, '');

  return handle;
}

/**
 * Valida un handle d'Instagram
 */
export function isValidInstagram(instagram: string): boolean {
  const normalized = normalizeInstagram(instagram);
  // Instagram: 1-30 caràcters, només a-z, 0-9, . i _
  const regex = /^[a-z0-9._]{1,30}$/;
  return regex.test(normalized);
}

/**
 * Genera URL d'Instagram
 */
export function getInstagramUrl(instagram: string): string {
  const normalized = normalizeInstagram(instagram);
  if (!normalized) return '';
  return `https://instagram.com/${normalized}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CODIS DE DESCOMPTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera un codi de descompte únic
 * Format: ORBITA-XXXX (on XXXX són 4 caràcters alfanumèrics)
 */
export function generateDiscountCode(prefix = 'ORBITA'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sense I, O, 0, 1 per evitar confusions
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

/**
 * Genera un codi de descompte personalitzat amb el nom del client
 * "Joan Garcia" -> "JOAN10"
 */
export function generatePersonalizedCode(name: string, discountPercent = 10): string {
  const firstName = getFirstName(name).toUpperCase();
  // Limitar a 8 caràcters
  const shortName = firstName.slice(0, 8);
  return `${shortName}${discountPercent}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITATS GENERALS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalitza totes les dades d'un client
 */
export interface CustomerData {
  email: string;
  phone?: string;
  name: string;
  instagram?: string;
}

export interface NormalizedCustomerData extends CustomerData {
  emailNormalized: string;
  phoneNormalized: string | null;
  nameNormalized: string;
  instagramNormalized: string | null;
  nameCleaned: string; // Nom capitalitzat correctament
}

export function normalizeCustomerData(data: CustomerData): NormalizedCustomerData {
  return {
    email: data.email.trim(),
    emailNormalized: normalizeEmail(data.email),
    phone: data.phone?.trim() || undefined,
    phoneNormalized: data.phone ? normalizePhone(data.phone) : null,
    name: data.name.trim(),
    nameNormalized: normalizeName(data.name),
    nameCleaned: capitalizeName(data.name),
    instagram: data.instagram?.trim() || undefined,
    instagramNormalized: data.instagram ? normalizeInstagram(data.instagram) : null,
  };
}

/**
 * Compara dos clients per veure si són el mateix
 * Retorna un score de 0-100
 */
export function compareCustomers(a: NormalizedCustomerData, b: NormalizedCustomerData): number {
  let score = 0;

  // Email idèntic = 100% match
  if (a.emailNormalized === b.emailNormalized) {
    return 100;
  }

  // Telèfon idèntic = 90% match
  if (a.phoneNormalized && b.phoneNormalized && a.phoneNormalized === b.phoneNormalized) {
    score = Math.max(score, 90);
  }

  // Instagram idèntic = 85% match
  if (a.instagramNormalized && b.instagramNormalized && a.instagramNormalized === b.instagramNormalized) {
    score = Math.max(score, 85);
  }

  // Nom molt similar + mateix domini d'email = 70% match
  if (a.nameNormalized === b.nameNormalized) {
    const domainA = a.email.split('@')[1];
    const domainB = b.email.split('@')[1];
    if (domainA === domainB) {
      score = Math.max(score, 70);
    }
  }

  return score;
}
