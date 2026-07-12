import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('admin shell logo ratio', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/admin-shell.css'), 'utf8');

  it('no força una alçada diferent a la ratio del logo next/image', () => {
    expect(source).toContain('html.admin-mode .ax__logo {\n  display: block; width: 140px; height: auto;');
    expect(source).toContain('html.admin-mode .ax__logo { width: 118px; height: auto; }');
    expect(source).not.toContain('html.admin-mode .ax__logo { width: 118px; height: 38px; }');
  });
});
