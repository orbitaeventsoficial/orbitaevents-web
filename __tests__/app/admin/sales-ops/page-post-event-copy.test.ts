import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('/admin/sales-ops post-event copy', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/sales-ops/page.tsx'), 'utf8');

  it('uses learning/reputation wording instead of visible feedback legacy copy', () => {
    expect(source).toContain('Aprenentatge de valoracions i testimonis per millorar oferta comercial.');
    expect(source).toContain('Post-event: aprenentatge de valoracions i testimonis per millorar proposta comercial.');
    expect(source).not.toContain('Bucle de feedback per millorar oferta comercial.');
    expect(source).not.toContain('Post-event: feedback incorporat per millorar proposta comercial.');
  });
});
