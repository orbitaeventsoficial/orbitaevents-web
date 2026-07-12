import { describe, expect, it } from 'vitest';
import {
  shouldHidePublicMobileChrome,
  shouldOffsetMobileCookieConsentForPortalNav,
  shouldRenderCookieConsent,
} from '@/lib/constants/publicChrome';

describe('public mobile chrome rules', () => {
  it('oculta chrome mobil als fluxos publics focalitzats', () => {
    expect(shouldHidePublicMobileChrome('/configurador', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/contacto', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/portal/raw-token', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/portal/raw-token/invoice', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/reservar', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/valoracio', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/valoracio/gracies', true)).toBe(true);
  });

  it('manté chrome en desktop i en rutes publiques navegables', () => {
    expect(shouldHidePublicMobileChrome('/valoracio', false)).toBe(false);
    expect(shouldHidePublicMobileChrome('/servicios', true)).toBe(false);
    expect(shouldHidePublicMobileChrome('/valoracions', true)).toBe(false);
  });

  it('no munta el banner de cookies dins el portal client', () => {
    expect(shouldRenderCookieConsent('/portal/raw-token')).toBe(false);
    expect(shouldRenderCookieConsent('/portal/raw-token/invoice')).toBe(false);
    expect(shouldRenderCookieConsent('/portalish/raw-token')).toBe(true);
    expect(shouldRenderCookieConsent('/reservar')).toBe(true);
  });

  it('calcula l’offset de cookies per la navegacio propia del portal en mobil', () => {
    expect(shouldOffsetMobileCookieConsentForPortalNav('/portal/raw-token', true)).toBe(true);
    expect(shouldOffsetMobileCookieConsentForPortalNav('/portal/raw-token/invoice', true)).toBe(true);
    expect(shouldOffsetMobileCookieConsentForPortalNav('/portal/raw-token/invoice', false)).toBe(false);
    expect(shouldOffsetMobileCookieConsentForPortalNav('/portalish/raw-token', true)).toBe(false);
    expect(shouldOffsetMobileCookieConsentForPortalNav('/reservar', true)).toBe(false);
  });
});
