import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal sign page access tracking', () => {
  it('marca lastAccessedAt quan el client entra directament a signar', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'sign', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const accessStart = source.indexOf('const access = await findPortalAccessByRawToken');
    const proposalStart = source.indexOf('const proposals = access.booking.proposals', accessStart);
    const accessBlock = source.slice(accessStart, proposalStart);

    expect(source).toContain("import { headers } from 'next/headers';");
    expect(source).toContain('markPortalAccessHit');
    expect(accessBlock).toContain('const requestHeaders = headers();');
    expect(accessBlock).toContain('accessId: access.id');
    expect(accessBlock).toContain("requestHeaders.get('user-agent')");
  });
});
