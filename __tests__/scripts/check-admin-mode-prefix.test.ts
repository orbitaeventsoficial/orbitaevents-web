import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-admin-mode-prefix.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amp-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  const result = spawnSync('node', [SCRIPT], { cwd: tmpDir, encoding: 'utf8' });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-admin-mode-prefix', () => {
  it('passa quan tots els selectors usen html.admin-mode', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
html.admin-mode {
  --at-bg: #0b0f16;
}
html.admin-mode .admin-card {
  background: var(--at-surface);
}
`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta selector sense prefix html.admin-mode', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
.admin-card {
  background: #111;
}
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('admin-theme.css');
    expect(result.stderr).toContain('.admin-card');
  });

  it('ignora @keyframes i els selectors from/to interiors', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
@keyframes admin-shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}
html.admin-mode .admin-shimmer {
  animation: admin-shimmer 1.8s ease infinite;
}
`,
    });
    expect(result.status).toBe(0);
  });

  it('ignora @keyframes amb passos de percentatge', () => {
    const result = runGuard({
      'app/admin/control-room.css': `
@keyframes admin-glow-pulse-anim {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,0,0,0.3); }
  50% { box-shadow: 0 0 20px 4px rgba(0,0,0,0.15); }
}
html.admin-mode .admin-shell .admin-glow-pulse {
  animation: admin-glow-pulse-anim 2.5s ease-in-out infinite;
}
`,
    });
    expect(result.status).toBe(0);
  });

  it('ignora @media com a at-rule però verifica selectors interiors', () => {
    const result = runGuard({
      'app/admin/control-room.css': `
@media (min-width: 640px) {
  html.admin-mode .admin-cr-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
`,
    });
    expect(result.status).toBe(0);
  });

  it('detecta selector sense prefix dins @media', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
@media (min-width: 640px) {
  .admin-cr-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('.admin-cr-grid');
  });

  it('detecta selector sense prefix dins @supports', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
@supports (display: grid) {
  .leak-supports {
    display: grid;
  }
}
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('.leak-supports');
  });

  it('FLAGS :root perquè filtraria tokens a la web pública', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
:root {
  --at-leaked: #fff;
}
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(':root');
  });

  it('passa amb selector multiline on tots tenen html.admin-mode i el darrer la {', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
html.admin-mode .admin-tooltip-wrap:hover .admin-tooltip-bubble,
html.admin-mode .admin-tooltip-wrap:focus-within .admin-tooltip-bubble {
  opacity: 1;
}
`,
    });
    expect(result.status).toBe(0);
  });

  it('REGRESSIÓ: detecta selector sense prefix que NO és la línia amb la { (multiline)', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
.leak-first,
html.admin-mode .admin-ok {
  opacity: 1;
}
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('.leak-first');
  });

  it('detecta selector sense prefix en grup multi-selector d\'una sola línia', () => {
    const result = runGuard({
      'app/admin/control-room.css': `
html.admin-mode .admin-a, .leak-inline, html.admin-mode .admin-b { color: red; }
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('.leak-inline');
  });

  it('no parteix per comes dins de [] o :is() (cap fals positiu)', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
html.admin-mode [data-state='a,b'] {
  opacity: 1;
}
html.admin-mode :is(.x, .y) .z {
  color: red;
}
`,
    });
    expect(result.status).toBe(0);
  });

  it('un @import/@charset previ no emmascara una violació posterior', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
@charset "utf-8";
@import "x.css";
.leak-after-import {
  color: red;
}
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('.leak-after-import');
  });

  it('adverteix quan el fitxer no existeix però no falla', () => {
    const result = runGuard({});
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('WARN');
  });

  it('reporta múltiples violacions de fitxers diferents', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
.admin-foo { color: red; }
.admin-bar { color: blue; }
`,
      'app/admin/control-room.css': `
.admin-cr-panel { background: #111; }
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('3 selector(s)');
  });

  it('ignora comentaris de bloc CSS (inclòs CSS comentat amb claus)', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
/* =====
   ADMIN THEME
   ===== */
/* .admin-card { background: #000; } */
html.admin-mode .admin-card {
  background: var(--at-surface);
}
`,
    });
    expect(result.status).toBe(0);
  });

  it('passa @media prefers-reduced-motion amb selectors html.admin-mode', () => {
    const result = runGuard({
      'app/admin/admin-theme.css': `
@media (prefers-reduced-motion: reduce) {
  html.admin-mode .admin-drag-placeholder,
  html.admin-mode .admin-shimmer {
    animation: none;
  }
}
`,
    });
    expect(result.status).toBe(0);
  });
});
