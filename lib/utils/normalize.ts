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

// ═══════════════════════════════════════════════════════════════════════════
// DNI / NIF / NIE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalitza un DNI/NIF/NIE per detectar duplicats
 * - Uppercase
 * - Elimina espais, guions, punts
 * - "12.345.678-A" → "12345678A"
 * - "X-1234567-L" → "X1234567L"
 */
export function normalizeDni(dni: string): string {
  if (!dni) return '';
  return dni.toUpperCase().replace(/[\s.\-]/g, '').trim();
}
