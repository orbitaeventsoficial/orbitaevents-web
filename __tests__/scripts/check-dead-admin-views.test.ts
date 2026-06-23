// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-dead-admin-views.mjs');

function runGuard(files: Record<string, string>) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dead-'));
  for (const [name, content] of Object.entries(files)) {
    const fp = path.join(tmp, name);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
  }
  const r = spawnSync('node', [SCRIPT], { cwd: tmp, encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  return r;
}

describe('check-dead-admin-views', () => {
  it('FALLA amb un component admin que no importa cap ruta (illa orfe)', () => {
    const r = runGuard({
      'app/admin/leads/page.tsx': 'export default function P(){return null;}',
      'app/admin/leads/Ghost.tsx': 'export default function Ghost(){return null;}',
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('Ghost.tsx');
  });

  it('FALLA amb una illa TRANSITIVA (A importa B, ningú importa A)', () => {
    const r = runGuard({
      'app/admin/x/page.tsx': 'export default function P(){return <div/>;}',
      'app/admin/x/IslandA.tsx': "import IslandB from './IslandB';\nexport default function A(){return <IslandB/>;}",
      'app/admin/x/IslandB.tsx': 'export default function B(){return null;}',
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('IslandA.tsx');
    expect(r.stderr).toContain('IslandB.tsx');
  });

  it('FALLA amb un import sense ús (component importat però no renderitzat)', () => {
    const r = runGuard({
      'app/admin/y/page.tsx': "import Ghost from './Ghost';\nexport default function P(){return <div>res</div>;}",
      'app/admin/y/Ghost.tsx': 'export default function Ghost(){return null;}',
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('Ghost.tsx');
  });

  it('PASSA amb un component realment usat per la ruta', () => {
    const r = runGuard({
      'app/admin/z/page.tsx': "import Card from './Card';\nexport default function P(){return <Card/>;}",
      'app/admin/z/Card.tsx': 'export default function Card(){return null;}',
    });
    expect(r.status).toBe(0);
  });

  it('PASSA quan no hi ha components admin (escaneig robust)', () => {
    const r = runGuard({ 'app/admin/page.tsx': 'export default function P(){return null;}' });
    expect(r.status).toBe(0);
  });
});
