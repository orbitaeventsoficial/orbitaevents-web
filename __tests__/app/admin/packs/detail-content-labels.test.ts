import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs/[id] content labels', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/packs/[id]/EditPackForm.tsx'), 'utf8');

  it('posa labels als controls principals de la pestanya content', () => {
    expect(source).toContain('htmlFor="pack-editor-content-search"');
    expect(source).toContain('id="pack-editor-content-search"');
    expect(source).toContain('htmlFor="pack-editor-slug"');
    expect(source).toContain('id="pack-editor-slug"');
    expect(source).toContain('htmlFor="pack-editor-service"');
    expect(source).toContain('id="pack-editor-service"');
    expect(source).toContain('htmlFor={`pack-editor-quantity-${item.id}`}');
    expect(source).toContain('id={`pack-editor-quantity-${item.id}`}');
    expect(source).toContain('aria-label={`Quantitat de ${item.name}`}');
  });
});
