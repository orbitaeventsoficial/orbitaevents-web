import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const MANIFEST_PATH = join(process.cwd(), 'public', 'manifest.webmanifest');

interface ManifestShortcut {
  name: string;
  short_name?: string;
  description?: string;
  url: string;
  icons?: Array<{ src: string; sizes: string; type?: string }>;
}

interface AdminManifest {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
  shortcuts?: ManifestShortcut[];
}

function loadManifest(): AdminManifest {
  const raw = readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw) as AdminManifest;
}

describe('public/manifest.webmanifest — PWA admin (E.18)', () => {
  it('JSON vàlid amb camps mínims de PWA', () => {
    const manifest = loadManifest();

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  it('exposa Quick Actions admin (shortcuts) per a leads, creació ràpida, reserves i inbox', () => {
    const manifest = loadManifest();

    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts).toBeDefined();

    const urls = manifest.shortcuts!.map((s) => s.url);
    expect(urls).toEqual(
      expect.arrayContaining(['/admin/leads', '/admin/quick-create', '/admin/bookings', '/admin/inbox']),
    );
    expect(manifest.shortcuts!.length).toBeGreaterThanOrEqual(4);
  });

  it('cada shortcut admin té name + url + icona 96x96', () => {
    const manifest = loadManifest();
    const adminShortcuts = manifest.shortcuts!.filter((s) => s.url.startsWith('/admin/'));

    for (const shortcut of adminShortcuts) {
      expect(shortcut.name).toBeTruthy();
      expect(shortcut.url).toMatch(/^\/admin\//);
      expect(Array.isArray(shortcut.icons)).toBe(true);
      const has96 = shortcut.icons!.some((icon) => icon.sizes === '96x96');
      expect(has96).toBe(true);
    }
  });
});
