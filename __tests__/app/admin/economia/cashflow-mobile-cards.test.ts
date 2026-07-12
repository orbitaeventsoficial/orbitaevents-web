import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const clientPath = join(process.cwd(), 'app/admin/economia/EconomiaClient.tsx');

describe('Economia cashflow mobile layout', () => {
  it('mostra tresoreria com a cards en mobil i conserva taula en desktop', () => {
    const source = readFileSync(clientPath, 'utf8');

    expect(source).toContain('aria-label="Projecció de tresoreria en format mòbil"');
    expect(source).toContain('className="hidden overflow-x-auto rounded-xl border border-[var(--line)] md:block"');
    expect(source).toContain('aria-label="Projecció de tresoreria"');
    expect(source).toContain('Costos');
    expect(source).toContain('Flux net');
    expect(source).toContain('Acumulat');
  });
});
