import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const clientPath = join(process.cwd(), 'app/admin/economia/EconomiaClient.tsx');

describe('Economia forecast mobile layout', () => {
  it('mostra previsio de vendes com a cards en mobil i conserva taula en desktop', () => {
    const source = readFileSync(clientPath, 'utf8');

    expect(source).toContain('aria-label="Previsió de vendes en format mòbil"');
    expect(source).toContain('aria-label="Previsió de vendes"');
    expect(source).toContain('Rang ±1σ');
    expect(source).toContain('YoY');
    expect(source).toContain('Confirmades:');
    expect(source).toContain('className="hidden overflow-x-auto rounded-xl border border-[var(--line)] md:block"');
  });
});
