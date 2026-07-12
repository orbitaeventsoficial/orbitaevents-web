import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('admin dashboard post-event alert', () => {
  it('entra pel hub post-event i no per la subpantalla d emails', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/lib/dashboard-data.ts'), 'utf8');
    const alertStart = source.indexOf("title: 'Emails post-event pendents'");
    const alertBlock = source.slice(alertStart, source.indexOf(']', alertStart));

    expect(alertStart).toBeGreaterThan(-1);
    expect(alertBlock).toContain("href: '/admin/post-event'");
    expect(alertBlock).not.toContain("href: '/admin/emails'");
  });
});
