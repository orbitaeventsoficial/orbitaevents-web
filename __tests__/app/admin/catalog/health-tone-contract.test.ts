import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/catalog health tone contract', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/catalog/page.tsx'), 'utf8');

  it('pinta els estats del semafor amb tons canonics', () => {
    expect(source).toContain("badgeClass: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success'");
    expect(source).toContain("dotClass: 'admin-tone-bg-success'");
    expect(source).toContain("badgeClass: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning'");
    expect(source).toContain("dotClass: 'admin-tone-bg-warning'");
    expect(source).toContain("badgeClass: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger'");
    expect(source).toContain("dotClass: 'admin-tone-bg-danger'");
    expect(source).not.toContain("badgeClass: ''");
    expect(source).not.toContain("dotClass: ''");
  });
});
