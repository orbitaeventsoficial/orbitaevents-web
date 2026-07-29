import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal sign visibility', () => {
  it('respecta showDocuments abans de mostrar o registrar la pantalla de signatura', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'sign', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const accessStart = source.indexOf('const access = await findPortalAccessByRawToken');
    const trackingStart = source.indexOf('const requestHeaders = headers();', accessStart);
    const guardBlock = source.slice(accessStart, trackingStart);

    expect(source).toContain("import { getClientPortalVisibility } from '@/lib/clientPortalVisibility';");
    expect(guardBlock).toContain('const visibility = getClientPortalVisibility(access.personalization);');
    expect(guardBlock).toContain('if (!visibility.documents) notFound();');
  });
});
