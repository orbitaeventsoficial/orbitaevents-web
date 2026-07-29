import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal gallery CTA count', () => {
  it('manté el recompte visual separat del recompte accessible localitzat', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const ctaStart = source.indexOf('{t.galleryViewLink}');
    const ctaEnd = source.indexOf('</Link>', ctaStart);
    const ctaBlock = source.slice(ctaStart, ctaEnd);

    expect(ctaStart).toBeGreaterThan(-1);
    expect(ctaBlock).toContain('<span aria-hidden="true"> ({portalPhotos.length})</span>');
    expect(ctaBlock).toContain('className="sr-only"');
    expect(ctaBlock).toContain(
      'getClientPortalGalleryPhotoCountLabel(locale, portalPhotos.length)',
    );
    expect(ctaBlock).not.toContain("{portalPhotos.length > 6 ? ` (${portalPhotos.length})` : ''}");
  });
});
