import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs/[id] economic labels', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/packs/[id]/EditPackForm.tsx'), 'utf8');

  it('posa labels reals als controls economics principals', () => {
    expect(source).toContain('aria-label="Reduir hores DJ"');
    expect(source).toContain('aria-label="Augmentar hores DJ"');
    expect(source).toContain('htmlFor="pack-editor-max-guests"');
    expect(source).toContain('id="pack-editor-max-guests"');
    expect(source).toContain('htmlFor="pack-editor-sound-watts"');
    expect(source).toContain('id="pack-editor-sound-watts"');
    expect(source).toContain('htmlFor="pack-editor-price"');
    expect(source).toContain('id="pack-editor-price"');
    expect(source).toContain('htmlFor="pack-editor-extra-hour-price"');
    expect(source).toContain('id="pack-editor-extra-hour-price"');
  });
});
