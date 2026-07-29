import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const clientPath = join(process.cwd(), 'app/admin/economia/EconomiaClient.tsx');

describe('Economia CAC mobile layout', () => {
  it('mostra CAC per canal com a cards en mobil i conserva taula en desktop', () => {
    const source = readFileSync(clientPath, 'utf8');

    expect(source).toContain('aria-label="CAC per canal en format mòbil"');
    expect(source).toContain('aria-label="CAC per canal"');
    expect(source).toContain('CAC estimat');
    expect(source).toContain('CAC real');
    expect(source).toContain('Conversió');
    expect(source).toContain('className="hidden overflow-x-auto rounded-xl border border-[var(--line)] md:block"');
  });
});
