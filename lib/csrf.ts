/**
 * CSRF Protection Utilities
 *
 * Provides Cross-Site Request Forgery (CSRF) protection for sensitive operations.
 * Implements the double-submit cookie pattern with additional security measures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHmac } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CSRF_TOKEN_LENGTH = 32; // bytes
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const TOKEN_MAX_AGE = 3600; // 1 hour in seconds

// Get CSRF secret from environment (required in production)
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'dev-csrf-secret-CHANGE-ME';

if (process.env.NODE_ENV === 'production' && CSRF_SECRET === 'dev-csrf-secret-CHANGE-ME') {
  console.error('[CSRF] WARNING: Using default CSRF secret in production! Set CSRF_SECRET environment variable.');
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a cryptographically secure CSRF token
 * Format: randomBytes.hmac(randomBytes + secret)
 */
export function generateCsrfToken(): string {
  const tokenValue = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${tokenValue}.${timestamp}`;

  // Sign with HMAC to prevent tampering
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

/**
 * Verify CSRF token signature and expiration
 */
function verifyCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [tokenValue, timestamp, signature] = parts;
  const payload = `${tokenValue}.${timestamp}`;

  // Verify signature
  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) return false;

  // Verify token hasn't expired
  const tokenTime = parseInt(timestamp, 10);
  const now = Date.now();
  const age = (now - tokenTime) / 1000; // Convert to seconds

  if (age > TOKEN_MAX_AGE) return false;

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API - SERVER SIDE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify CSRF token from request
 * Implements double-submit cookie pattern
 *
 * Returns null if valid, or NextResponse with error if invalid
 */
export function verifyCsrf(request: NextRequest): NextResponse | null {
  // Only check POST, PUT, DELETE, PATCH requests
  const method = request.method;
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null; // No CSRF check needed for safe methods
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;

  // Both must be present
  if (!headerToken || !cookieToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'CSRF token missing',
        code: 'CSRF_TOKEN_MISSING'
      },
      { status: 403 }
    );
  }

  // Tokens must match
  if (headerToken !== cookieToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'CSRF token mismatch',
        code: 'CSRF_TOKEN_MISMATCH'
      },
      { status: 403 }
    );
  }

  // Token must be valid (signature + expiration)
  if (!verifyCsrfToken(headerToken)) {
    return NextResponse.json(
      {
        success: false,
        error: 'CSRF token invalid or expired',
        code: 'CSRF_TOKEN_INVALID'
      },
      { status: 403 }
    );
  }

  return null; // Valid
}

/**
 * Set CSRF token cookie in response
 * Call this when rendering pages that will make protected requests
 */
export function setCsrfCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCsrfToken();

  response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
    httpOnly: false, // Must be accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });

  return response;
}

/**
 * Get or generate CSRF token from request
 * Useful for API routes that return tokens
 */
export function getCsrfToken(request: NextRequest): string {
  const existingToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;

  // If token exists and is valid, return it
  if (existingToken && verifyCsrfToken(existingToken)) {
    return existingToken;
  }

  // Otherwise generate new one
  return generateCsrfToken();
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API - CLIENT SIDE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get CSRF token from cookie (for client-side use)
 * Add this to your fetch/axios requests
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_TOKEN_COOKIE) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Fetch with automatic CSRF token injection
 * Use this instead of regular fetch for protected requests
 *
 * @example
 * const data = await fetchWithCsrf('/api/admin/settings', {
 *   method: 'POST',
 *   body: JSON.stringify({ ... })
 * });
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getCsrfTokenFromCookie();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set(CSRF_TOKEN_HEADER, token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if CSRF protection should be enforced
 * Skip in development or for specific paths
 */
export function shouldEnforceCsrf(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;

  // Skip CSRF for public API routes
  const publicPaths = [
    '/api/health',
    '/api/contact',
    '/api/testimonials',
    '/api/google-reviews',
  ];

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return false;
  }

  // Enforce for all admin routes
  if (pathname.startsWith('/api/admin')) {
    return true;
  }

  return false;
}
