import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('AdminCssManagerPage sanitized CSS contract', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/css-manager/page.tsx'), 'utf8');

  it('aplica i propaga el CSS retornat pel backend despres de desar', () => {
    expect(source).toContain("const savedCss = typeof data?.css === 'string' ? data.css : css;");
    expect(source).toContain('setCss(savedCss);');
    expect(source).toContain('applyLiveCss(savedCss);');
    expect(source).toContain("new CustomEvent('admin-css-updated', { detail: { css: savedCss } })");
    expect(source).not.toContain("new CustomEvent('admin-css-updated', { detail: { css } })");
  });
});
