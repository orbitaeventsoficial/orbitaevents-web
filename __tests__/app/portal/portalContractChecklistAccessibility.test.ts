import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal contract checklist accessibility', () => {
  it('exposa el complet/pendent en text accessible, no nomes amb simbols', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'contract', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const checklistStart = source.indexOf('signatureChecklist.map');
    const checklistEnd = source.indexOf('))}', checklistStart);
    const checklistBlock = source.slice(checklistStart, checklistEnd);

    expect(checklistStart).toBeGreaterThan(-1);
    expect(checklistBlock).toContain('aria-hidden="true"');
    expect(checklistBlock).toContain('className="sr-only"');
    expect(checklistBlock).toContain('item.complete ? t.milestoneDone : t.pending');
  });
});
