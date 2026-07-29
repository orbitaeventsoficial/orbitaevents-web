import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const economiaDir = join(process.cwd(), 'app/admin/economia');

describe('Economia accessible feedback', () => {
  it('anuncia error de bulk payment com alerta', () => {
    const source = readFileSync(join(economiaDir, 'economia-components.tsx'), 'utf8');

    expect(source).toContain('{bulkError && (');
    expect(source).toContain('<p role="alert"');
    expect(source).toContain('admin-tone-text-danger');
  });

  it.each([
    'ProfitabilityConfigEditor.tsx',
    'ProfitabilityConfigHistory.tsx',
    'PackPricingModelEditor.tsx',
    'PackPricingModelHistory.tsx',
  ])('%s separa exit i error amb semantica accessible', (fileName) => {
    const source = readFileSync(join(economiaDir, fileName), 'utf8');

    expect(source).toContain("type Notice = { type: 'success' | 'error'; text: string };");
    expect(source).toContain("role={notice.type === 'error' ? 'alert' : 'status'}");
    expect(source).toContain("aria-live={notice.type === 'error' ? 'assertive' : 'polite'}");
    expect(source).toContain("notice.type === 'error' ? 'admin-tone-text-danger' : 'admin-tone-text-success'");
  });
});
