import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const clientPath = join(process.cwd(), 'app/admin/economia/EconomiaClient.tsx');

describe('Economia pack pricing responsive layout', () => {
  it('mostra el semafor de packs com a cards compactes i reserva la taula per pantalles molt amples', () => {
    const source = readFileSync(clientPath, 'utf8');

    expect(source).toContain('aria-label="Rendibilitat per pack en format compacte"');
    expect(source).toContain('className="mt-4 grid gap-2 xl:grid-cols-2 2xl:hidden"');
    expect(source).toContain('className="mt-4 hidden overflow-x-auto rounded-xl border border-[var(--line)] 2xl:block"');
    expect(source).toContain('H. extra recom.');
    expect(source).toContain('Marge h extra');
    expect(source).toContain('aria-label="Rendibilitat per pack"');
  });
});
