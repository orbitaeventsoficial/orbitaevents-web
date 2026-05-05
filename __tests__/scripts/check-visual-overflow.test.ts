// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-visual-overflow.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-visual-overflow-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return root;
}

function runGuard(files: Record<string, string>, extraArgs: string[] = []) {
  const cwd = writeFixture(files);
  return spawnSync(process.execPath, [scriptPath, ...extraArgs], { cwd, encoding: 'utf8' });
}

describe('check-visual-overflow', () => {
  it('passes with the OK marker when no overflow risks are present', () => {
    const result = runGuard({
      'app/page.tsx': "export default function Page() { return <div className='flex gap-2'>OK</div>; }",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK: no obvious static overflow risks');
  });

  it('flags whitespace-nowrap without an overflow guard (nowrap-no-guard)', () => {
    const result = runGuard({
      'app/risk.tsx': "export default () => <div className='whitespace-nowrap text-base'>llarguíssim</div>;",
    });
    expect(result.stdout).toContain('nowrap-no-guard');
    expect(result.stdout).toMatch(/app[/\\]risk\.tsx/);
  });

  it('does NOT flag whitespace-nowrap when paired with truncate/min-w-0/max-w', () => {
    const result = runGuard({
      'app/safe.tsx': `
        export const A = () => <div className='whitespace-nowrap truncate'>OK</div>;
        export const B = () => <div className='whitespace-nowrap min-w-0'>OK</div>;
        export const C = () => <div className='whitespace-nowrap max-w-[280px]'>OK</div>;
      `,
    });
    expect(result.stdout).not.toContain('nowrap-no-guard');
    expect(result.stdout).toContain('OK: no obvious static overflow risks');
  });

  it('does NOT flag whitespace-nowrap inside an overlay (absolute/fixed)', () => {
    const result = runGuard({
      'app/overlay.tsx': "export default () => <div className='absolute whitespace-nowrap'>tooltip</div>;",
    });
    expect(result.stdout).toContain('OK: no obvious static overflow risks');
  });

  it('does NOT flag whitespace-nowrap on icon-like primitives (h-/w-/size- + ≤12 tokens)', () => {
    const result = runGuard({
      'app/icon.tsx': "export default () => <span className='h-4 w-4 whitespace-nowrap'>·</span>;",
    });
    expect(result.stdout).toContain('OK: no obvious static overflow risks');
  });

  it('flags min-w-[500+px] without horizontal scroll (wide-min-no-scroll)', () => {
    const result = runGuard({
      'app/wide.tsx': "export default () => <div className='min-w-[640px] flex'>amplada gran</div>;",
    });
    expect(result.stdout).toContain('wide-min-no-scroll');
  });

  it('does NOT flag min-w-[640px] when overflow-x-auto is on the same element', () => {
    const result = runGuard({
      'app/scroll.tsx': "export default () => <div className='min-w-[640px] overflow-x-auto'>OK</div>;",
    });
    expect(result.stdout).toContain('OK: no obvious static overflow risks');
  });

  it('does NOT flag min-w-[640px] when overflow-x-auto is on a nearby ancestor', () => {
    const result = runGuard({
      'app/nearby.tsx': "export default () => <div className='overflow-x-auto'><div className='min-w-[640px] flex gap-2'>OK</div></div>;",
    });
    expect(result.stdout).toContain('OK: no obvious static overflow risks');
  });

  it('flags fixed grid-cols-4..9 without responsive breakpoint nor horizontal scroll', () => {
    const result = runGuard({
      'app/grid.tsx': "export default () => <div className='grid grid-cols-6 gap-4'>columnes</div>;",
    });
    expect(result.stdout).toContain('fixed-grid-mobile');
  });

  it('does NOT flag fixed grid when a responsive breakpoint is present (sm:grid-cols-...)', () => {
    const result = runGuard({
      'app/responsive.tsx': "export default () => <div className='grid grid-cols-1 sm:grid-cols-6 gap-4'>OK</div>;",
    });
    expect(result.stdout).toContain('OK: no obvious static overflow risks');
  });

  it('only scans app/ and components/ — files in lib/ or other roots are ignored', () => {
    const result = runGuard({
      'lib/leak.tsx': "export default () => <div className='whitespace-nowrap'>llarg</div>;",
      'docs/example.tsx': "export default () => <div className='grid grid-cols-7'>OK</div>;",
    });
    expect(result.stdout).toContain('OK: no obvious static overflow risks');
  });

  it('skips className with template literal interpolation (${...})', () => {
    const result = runGuard({
      'app/dynamic.tsx': "const k = 'whitespace-nowrap'; export default () => <div className={`${k}`}>OK</div>;",
    });
    expect(result.stdout).toContain('OK: no obvious static overflow risks');
  });

  it('exits 2 in --strict mode when there are risks', () => {
    const result = runGuard({
      'app/risk.tsx': "export default () => <div className='whitespace-nowrap'>llarg</div>;",
    }, ['--strict']);
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/visual-overflow.*WARN.*risk/);
  });

  it('exits 0 (warning only) without --strict even when there are risks', () => {
    const result = runGuard({
      'app/risk.tsx': "export default () => <div className='whitespace-nowrap'>llarg</div>;",
    });
    expect(result.status).toBe(0);
  });
});
