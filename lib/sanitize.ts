/**
 * HTML Sanitization Utilities
 *
 * Provides server-side and client-side HTML sanitization using DOMPurify.
 * Prevents XSS attacks when rendering user-generated or external content.
 */

import DOMPurify from 'isomorphic-dompurify';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type SanitizeConfig = {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOW_DATA_ATTR?: boolean;
  ALLOW_UNKNOWN_PROTOCOLS?: boolean;
  SAFE_FOR_TEMPLATES?: boolean;
  RETURN_DOM?: boolean;
  RETURN_DOM_FRAGMENT?: boolean;
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default sanitization options - Strict mode
 */
const DEFAULT_CONFIG: SanitizeConfig = {
  // Only allow safe tags
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'span', 'div',
    'blockquote', 'code', 'pre',
  ],
  // Only allow safe attributes
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'id'],
  // Force links to open in new tab with security attributes
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
  // Return a string, not DOM
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Relaxed config for rich content (emails, blog posts, etc.)
 */
const RELAXED_CONFIG: SanitizeConfig = {
  ...DEFAULT_CONFIG,
  ALLOWED_TAGS: [
    ...DEFAULT_CONFIG.ALLOWED_TAGS!,
    'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'hr', 'dl', 'dt', 'dd', 'sup', 'sub',
  ],
  ALLOWED_ATTR: [
    ...DEFAULT_CONFIG.ALLOWED_ATTR!,
    'src', 'alt', 'width', 'height', 'style',
  ],
};

/**
 * Minimal config for simple text with basic formatting
 */
const MINIMAL_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i'],
  ALLOWED_ATTR: [],
  RETURN_DOM: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize HTML content with default strict settings
 * Use this for user-generated content, translations, etc.
 *
 * @example
 * const safe = sanitizeHtml('<script>alert("xss")</script><p>Hello</p>');
 * // Returns: '<p>Hello</p>'
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, DEFAULT_CONFIG) as string;
}

/**
 * Sanitize HTML with relaxed settings - allows images, tables, etc.
 * Use this for trusted rich content like email templates, blog posts
 *
 * @example
 * const safe = sanitizeRichHtml('<img src="safe.jpg"><script>bad()</script>');
 * // Returns: '<img src="safe.jpg">' (no script)
 */
export function sanitizeRichHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, RELAXED_CONFIG) as string;
}

/**
 * Sanitize HTML with minimal settings - only basic text formatting
 * Use this for simple user input like comments, names, etc.
 *
 * @example
 * const safe = sanitizeMinimal('<a href="evil">Click</a><strong>Bold</strong>');
 * // Returns: '<strong>Bold</strong>' (no links)
 */
export function sanitizeMinimal(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, MINIMAL_CONFIG) as string;
}

/**
 * Strip all HTML tags - return only plain text
 * Use this when you need clean text without any HTML
 *
 * @example
 * const text = stripHtml('<p>Hello <strong>World</strong></p>');
 * // Returns: 'Hello World'
 */
export function stripHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }) as string;
}

/**
 * Sanitize translation strings that may contain HTML
 * This is a convenience wrapper for sanitizeHtml with context
 */
export function sanitizeTranslation(translation: string): string {
  return sanitizeHtml(translation);
}

/**
 * Custom sanitization with user-provided config
 * Advanced usage - only use if you know what you're doing
 */
export function sanitizeCustom(dirty: string, config: SanitizeConfig): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, config) as string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS FOR ADDITIONAL SECURITY
// ═══════════════════════════════════════════════════════════════════════════

// Add hook to force external links to be safe
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Force all links to open in new tab with security attributes
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');

    // Only allow http/https links
    const href = node.getAttribute('href');
    if (href && !href.match(/^https?:\/\//i) && !href.startsWith('/')) {
      node.removeAttribute('href');
    }
  }

  // Remove inline event handlers (onclick, onload, etc.)
  for (let i = node.attributes.length - 1; i >= 0; i--) {
    const attr = node.attributes[i];
    if (attr.name.startsWith('on')) {
      node.removeAttribute(attr.name);
    }
  }
});
