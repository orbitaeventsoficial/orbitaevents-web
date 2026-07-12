import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs/[id] texts and publish labels', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/packs/[id]/EditPackForm.tsx'), 'utf8');

  it('posa labels als camps de textos per idioma i al camp ordre', () => {
    expect(source).toContain('htmlFor={`pack-editor-${locale}-name`}');
    expect(source).toContain('id={`pack-editor-${locale}-name`}');
    expect(source).toContain('htmlFor={`pack-editor-${locale}-tagline`}');
    expect(source).toContain('id={`pack-editor-${locale}-tagline`}');
    expect(source).toContain('htmlFor={`pack-editor-${locale}-description`}');
    expect(source).toContain('id={`pack-editor-${locale}-description`}');
    expect(source).toContain('htmlFor={`pack-editor-${locale}-features`}');
    expect(source).toContain('id={`pack-editor-${locale}-features`}');
    expect(source).toContain('htmlFor="pack-editor-order"');
    expect(source).toContain('id="pack-editor-order"');
  });
});
