import { describe, it, expect } from 'vitest';
import { buildClientPortalGalleryPath } from '@/lib/clientPortalGallery';

describe('buildClientPortalGalleryPath', () => {
  it('construeix la ruta canònica de galeria del portal', () => {
    expect(buildClientPortalGalleryPath('ca', 'abc123')).toBe('/ca/portal/abc123/gallery');
  });

  it('respecta el locale es', () => {
    expect(buildClientPortalGalleryPath('es', 'tok456')).toBe('/es/portal/tok456/gallery');
  });

  it('respecta el locale en', () => {
    expect(buildClientPortalGalleryPath('en', 'tok789')).toBe('/en/portal/tok789/gallery');
  });
});
