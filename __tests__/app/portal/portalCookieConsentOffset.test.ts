import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal cookie consent', () => {
  it('no munta el banner public de cookies dins el portal client', () => {
    const layoutSource = readFileSync(
      path.join(process.cwd(), 'app', 'components', 'layout', 'LayoutWrapper.tsx'),
      'utf8',
    );
    const cookieSource = readFileSync(
      path.join(process.cwd(), 'app', 'components', 'legal', 'CookieConsent.client.tsx'),
      'utf8',
    );
    const navSource = readFileSync(
      path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'PortalBottomNav.tsx'),
      'utf8',
    );
    const globalsSource = readFileSync(path.join(process.cwd(), 'app', 'globals.css'), 'utf8');

    expect(layoutSource).toContain('shouldRenderCookieConsent');
    expect(layoutSource).toContain('renderCookieConsent && <CookieConsent');
    expect(cookieSource).toContain('bottom-[calc(var(--o-portal-bottom-nav-h)+var(--safe-bottom))]');
    expect(navSource).toContain('min-h-[var(--o-portal-bottom-nav-h)]');
    expect(globalsSource).toContain('--o-portal-bottom-nav-h: 4.25rem;');
    expect(globalsSource).toContain('--o-cookie-mobile-banner-h: 3.5rem;');
    expect(globalsSource).toContain('padding-bottom: calc(');
    expect(globalsSource).toContain('var(--o-cookie-mobile-banner-h)');
  });
});
