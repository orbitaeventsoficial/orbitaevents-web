// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-canonical-reimpl.mjs');

function runGuard(files: Record<string, string>) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reimpl-'));
  for (const [name, content] of Object.entries(files)) {
    const fp = path.join(tmp, name);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
  }
  const r = spawnSync('node', [SCRIPT], { cwd: tmp, encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  return r;
}

describe('check-canonical-reimpl', () => {
  it('detecta reimplementació de parseBudget fora de la canònica', () => {
    const r = runGuard({
      'lib/services/foo.ts': "const n = budget.replace(/[^\\d.,]/g, '');",
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('parseBudget');
  });

  it('detecta marge inline amb cost ratio fora del costEngine', () => {
    const r = runGuard({
      'app/admin/foo.tsx': 'const c = packPrice * config.packCostRatio;',
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('marge-inline');
  });

  it('NO marca el patró dins el fitxer canònic', () => {
    const r = runGuard({
      'lib/constants/index.ts': "const n = budget.replace(/[^\\d.,]/g, '');",
    });
    expect(r.status).toBe(0);
  });

  it('NO marca codi net (sense reimplementacions)', () => {
    const r = runGuard({
      'lib/services/foo.ts': "import { parseBudgetAmount } from '@/lib/constants';\nconst n = parseBudgetAmount(x);",
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('OK');
  });

  it('ignora el patró en comentaris', () => {
    const r = runGuard({
      'lib/services/foo.ts': "// abans: budget.replace(/[^\\d.,]/g, '')\nconst n = 1;",
    });
    expect(r.status).toBe(0);
  });
});
