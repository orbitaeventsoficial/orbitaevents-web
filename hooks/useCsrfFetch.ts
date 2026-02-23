'use client';

import { useEffect } from 'react';

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

/**
 * Patch global fetch to automatically inject CSRF token
 * on same-origin mutation requests (POST, PUT, PATCH, DELETE).
 */
export function useCsrfFetch(): void {
  useEffect(() => {
    const windowRef = window as typeof window & { __csrfFetchWrapped?: boolean };
    if (windowRef.__csrfFetchWrapped) return;
    windowRef.__csrfFetchWrapped = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const method = request.method.toUpperCase();
      const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
      const url = new URL(request.url, window.location.origin);
      const isSameOrigin = url.origin === window.location.origin;

      if (isMutation && isSameOrigin) {
        let token = getCookieValue('csrf-token');
        if (!token) {
          try {
            await originalFetch('/api/csrf', { method: 'GET', credentials: 'same-origin' });
          } catch {
            // Ignore token fetch failures
          }
          token = getCookieValue('csrf-token');
        }
        if (token) {
          const headers = new Headers(request.headers);
          headers.set('x-csrf-token', token);
          return originalFetch(new Request(request, { headers }));
        }
      }

      return originalFetch(request);
    };

    return () => {
      window.fetch = originalFetch;
      windowRef.__csrfFetchWrapped = false;
    };
  }, []);
}
