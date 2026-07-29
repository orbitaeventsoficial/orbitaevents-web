import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs/extras client accessibility', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/packs/extras/ExtrasConfiguratorClient.tsx'), 'utf8');

  it('anuncia loading, error i exit amb semantica accessible', () => {
    expect(source).toContain('role="status" aria-live="polite"');
    expect(source).toContain("Carregant configuració d'extres...");
    expect(source).toContain('role="alert" aria-live="assertive"');
    expect(source).toContain('Error: {error}');
    expect(source).toContain("setNotice('Canvis desats.')");
    expect(source).toContain('ap-inline-alert ap-inline-alert--success');
  });

  it('usa jerarquia canonica per accions i toggles', () => {
    expect(source).toContain('className="ap-btn ap-btn--secondary"');
    expect(source).toContain('className="ap-btn ap-btn--primary disabled:opacity-60"');
    expect(source).toContain('aria-busy={saving}');
    expect(source).toContain('className="ap-btn ap-btn--danger ap-btn--xs"');
    expect(source).toContain('aria-pressed={Boolean(active)}');
    expect(source).not.toContain('inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors');
    expect(source).not.toContain('className="ap-card p-3 text-sm"');
  });
});
