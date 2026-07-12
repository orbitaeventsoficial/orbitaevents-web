// lib/utils/sanitize.ts
// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES DE SANITIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════
//
// Funciones centralizadas para sanitización y seguridad
//
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Escapa caracteres HTML para prevenir XSS
 *
 * @param text - Texto a escapar
 * @returns Texto con caracteres HTML escapados
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * Sanitiza un email eliminando espacios y convirtiendo a minúsculas
 *
 * @param email - Email a sanitizar
 * @returns Email sanitizado
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Trunca un string a una longitud máxima
 *
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @param suffix - Sufijo a añadir si se trunca (default: '...')
 * @returns Texto truncado
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}
