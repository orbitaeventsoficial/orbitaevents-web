import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/analytics/page.tsx'), 'utf8');

describe('/admin/analytics GA4 trend empty state', () => {
  it('no dibuixa una tendencia buida com si fos un grafic valid', () => {
    expect(source).toContain('hasGa4TrendData');
    expect(source).toContain('ga4TrendActiveDays');
    expect(source).toContain('ga4.timeseries.filter((row) => row.sessions > 0 || row.activeUsers > 0).length');
    expect(source).toContain('Pic sessions');
    expect(source).toContain('Pic usuaris');
    expect(source).toContain('Dies amb activitat GA4');
    expect(source).toContain("active ? 'admin-tone-bg-success' : 'admin-tone-bg-neutral'");
    expect(source).toContain('Sense tendència útil encara');
    expect(source).toContain('role="status"');
    expect(source).not.toContain('ga4 && ga4.timeseries.length > 0 &&');
  });
});
