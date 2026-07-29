import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const clientPath = join(process.cwd(), 'app/admin/economia/EconomiaClient.tsx');

describe('Economia profitability mobile layout', () => {
  it('mostra rendibilitat per canal com a cards en mobil i conserva taula en desktop', () => {
    const source = readFileSync(clientPath, 'utf8');

    expect(source).toContain('const PROFITABILITY_EVENT_TITLE');
    expect(source).toContain("className={PROFITABILITY_EVENT_TITLE}");
    expect(source).not.toContain('text-sm font-semibold truncate transition-colors');
    expect(source).toContain('className="grid gap-2 md:hidden"');
    expect(source).toContain('className="hidden overflow-x-auto md:block"');
    expect(source).toContain('aria-label="Rendibilitat per canal"');
  });
});
