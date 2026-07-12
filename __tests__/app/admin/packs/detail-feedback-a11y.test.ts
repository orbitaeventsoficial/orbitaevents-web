import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('/admin/packs/[id] accessible feedback', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/packs/[id]/EditPackForm.tsx'), 'utf8');

  it('anuncia error, info i exit amb semantica accessible', () => {
    expect(source).toContain('role="alert" aria-live="assertive"');
    expect(source).toContain('Error: {error}');
    expect(source).toContain('role="status" aria-live="polite"');
    expect(source).toContain('Info: {info}');
    expect(source).toContain('Pack actualitzat correctament');
  });
});
