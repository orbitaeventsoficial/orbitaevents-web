/**
 * Server-Side Input Sanitization Utilities
 *
 * Comprehensive input sanitization for API routes and server components.
 * Prevents XSS, SQL injection, and other security vulnerabilities.
 *
 * USE THESE FUNCTIONS ON ALL USER INPUT BEFORE STORAGE
 */

// ═══════════════════════════════════════════════════════════════════════════
// TEXT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize a plain text string
 * Removes control characters, normalizes whitespace
 */
export function sanitizeText(text: string, maxLength?: number): string {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text
    // Remove control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize Unicode
    .normalize('NFC')
    // Trim whitespace
    .trim();

  // Truncate if max length specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize name (person, business, etc.)
 * Allows letters, spaces, hyphens, apostrophes
 */
export function sanitizeName(name: string, maxLength: number = 100): string {
  if (!name || typeof name !== 'string') return '';

  return sanitizeText(name, maxLength)
    // Remove any remaining non-name characters
    .replace(/[^a-zA-ZáéíóúàèìòùäëïöüñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÑçÇ\s\-']/g, '')
    .trim();
}

/**
 * Sanitize email address
 * Removes dangerous characters while preserving valid email format
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  return email
    .toLowerCase()
    .trim()
    // Remove any whitespace
    .replace(/\s/g, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Sanitize phone number
 * Removes all non-digit characters except + (for international)
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';

  // Keep only digits and leading +
  let sanitized = phone.replace(/[^\d+]/g, '');

  // Ensure + is only at the beginning
  if (sanitized.includes('+')) {
    const hasLeadingPlus = sanitized.startsWith('+');
    sanitized = sanitized.replace(/\+/g, '');
    if (hasLeadingPlus) {
      sanitized = '+' + sanitized;
    }
  }

  return sanitized;
}

/**
 * Sanitize URL
 * Ensures URL is safe and uses allowed protocols
 */
export function sanitizeUrl(
  url: string,
  allowedProtocols: string[] = ['http:', 'https:', 'mailto:']
): string {
  if (!url || typeof url !== 'string') return '';

  try {
    const trimmed = url.trim();

    // Check for dangerous protocols
    if (/^(javascript|data|vbscript|file|about):/i.test(trimmed)) {
      return '';
    }

    const parsed = new URL(trimmed);

    // Check if protocol is allowed
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }

    return parsed.href;
  } catch {
    // Invalid URL
    return '';
  }
}

/**
 * Sanitize message/comment text
 * Removes HTML and prevents XSS
 */
export function sanitizeMessage(
  message: string,
  maxLength: number = 5000
): string {
  if (!message || typeof message !== 'string') return '';

  // First sanitize as text
  let sanitized = sanitizeText(message, maxLength);

  // Remove any HTML-like patterns
  sanitized = sanitized
    .replace(/<[^>]*>/g, '') // Remove tags
    .replace(/&[a-z]+;/gi, ''); // Remove HTML entities

  return sanitized;
}

/**
 * Sanitize slug (URL-safe string)
 * Converts to lowercase, replaces spaces with hyphens
 */
export function sanitizeSlug(text: string, maxLength: number = 100): string {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()
    .normalize('NFD')
    // Remove accents
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove invalid characters
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Truncate
    .slice(0, maxLength);
}

/**
 * Sanitize search query
 * Prevents SQL injection and other attacks
 */
export function sanitizeSearchQuery(
  query: string,
  maxLength: number = 200
): string {
  if (!query || typeof query !== 'string') return '';

  return sanitizeText(query, maxLength)
    // Remove SQL injection attempts
    .replace(/['";\\]/g, '')
    // Remove percentage signs (LIKE wildcard)
    .replace(/%/g, '')
    .trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize an entire object of user input
 * Applies appropriate sanitization to each field
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  data: T,
  schema: Record<
    keyof T,
    'name' | 'email' | 'phone' | 'text' | 'message' | 'url' | 'slug'
  >
): T {
  const sanitized = { ...data };

  for (const key in schema) {
    const value = data[key];
    const type = schema[key];

    if (typeof value !== 'string') continue;

    switch (type) {
      case 'name':
        sanitized[key] = sanitizeName(value) as T[Extract<keyof T, string>];
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(value) as T[Extract<keyof T, string>];
        break;
      case 'phone':
        sanitized[key] = sanitizePhone(value) as T[Extract<keyof T, string>];
        break;
      case 'text':
        sanitized[key] = sanitizeText(value) as T[Extract<keyof T, string>];
        break;
      case 'message':
        sanitized[key] = sanitizeMessage(value) as T[Extract<keyof T, string>];
        break;
      case 'url':
        sanitized[key] = sanitizeUrl(value) as T[Extract<keyof T, string>];
        break;
      case 'slug':
        sanitized[key] = sanitizeSlug(value) as T[Extract<keyof T, string>];
        break;
    }
  }

  return sanitized;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if string contains potential XSS
 */
export function containsXss(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(text));
}

/**
 * Check if string contains SQL injection patterns
 */
export function containsSqlInjection(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const sqlPatterns = [
    /(\bor\b|\band\b).+[=<>]/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+\w+\s+set/i,
    /;.*--.*/,
  ];

  return sqlPatterns.some((pattern) => pattern.test(text));
}
