import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLIENT_PORTAL_MESSAGES } from '@/lib/clientPortalMessages';

describe('client portal hub external links', () => {
  it('avisa assistivament quan els CTAs externs obren una pestanya nova', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const targetBlankCount = source.match(/target="_blank"/g)?.length ?? 0;
    const newTabNoteCount = source.match(/t\.opensInNewTab/g)?.length ?? 0;

    expect(CLIENT_PORTAL_MESSAGES.ca.opensInNewTab).toBe('s\'obre en una pestanya nova');
    expect(CLIENT_PORTAL_MESSAGES.es.opensInNewTab).toBe('se abre en una pestaña nueva');
    expect(CLIENT_PORTAL_MESSAGES.en.opensInNewTab).toBe('opens in a new tab');
    expect(targetBlankCount).toBe(4);
    expect(newTabNoteCount).toBe(targetBlankCount);
  });
});
