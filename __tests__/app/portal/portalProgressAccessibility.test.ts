import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal hub progress accessibility', () => {
  it('exposa cada pas del progres amb label i estat accessibles', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx');
    const source = readFileSync(filePath, 'utf8');
    const progressStart = source.indexOf('progressSteps.map');
    const progressEnd = source.indexOf('/* ── NEXT ACTION CTA', progressStart);
    const progressBlock = source.slice(progressStart, progressEnd);

    expect(source).toContain('function getProgressStepStatusLabel');
    expect(progressBlock).toContain('role="listitem"');
    expect(progressBlock).toContain('getProgressStepStatusLabel(t, step.status)');
    expect(progressBlock).toContain('aria-hidden="true"');
    expect(source).toContain('role="list" aria-label={t.timeline}');
  });
});
