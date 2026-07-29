import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync(path.join(process.cwd(), 'app/admin/docs/MarkdownView.tsx'), 'utf-8');

describe('MarkdownView responsive tables', () => {
  it('keeps desktop tables and renders mobile rows as labelled cards', () => {
    expect(SOURCE).toContain('hidden sm:table');
    expect(SOURCE).toContain('sm:hidden divide-y divide-[var(--ax-line)]');
    expect(SOURCE).toContain('MOBILE_TABLE_LABEL_CLS');
    expect(SOURCE).toContain('MOBILE_TABLE_VALUE_CLS');
    expect(SOURCE).toContain('header[c] ?? `Columna ${c + 1}`');
  });
});
