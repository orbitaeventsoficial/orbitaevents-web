import { SITE_CONFIG } from '@/app/config/site-config';

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export const DEFAULT_SITE_URL = normalizeUrl(SITE_CONFIG.web.url);

export function getSiteUrl(): string {
  return normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL);
}

export function getAppBaseUrl(): string {
  return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
}

export function absoluteUrl(pathname: string, baseUrl = getSiteUrl()): string {
  if (/^https?:\/\//.test(pathname)) return pathname;
  return `${baseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}
