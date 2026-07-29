import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const cssPath = join(process.cwd(), 'app/admin/admin-shell.css');

describe('Admin shell primary actions', () => {
  it('dona mes amplada a Nova entrada que a Safata al sidebar', () => {
    const source = readFileSync(cssPath, 'utf8');

    expect(source).toContain('html.admin-mode .ax__add');
    expect(source).toContain('flex: 1.25 1 0; min-width: 0;');
    expect(source).toContain('html.admin-mode .ax__inbox');
    expect(source).toContain('flex: .75 1 0; min-width: 0;');
  });
});
