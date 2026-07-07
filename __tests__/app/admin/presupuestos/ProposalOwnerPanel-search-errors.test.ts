import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('ProposalOwnerPanel search error guard', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/presupuestos/ProposalOwnerPanel.tsx'), 'utf8');

  it('no tracta una fallada de cerca de vincles com a zero resultats', () => {
    const searchBlock = source.slice(
      source.indexOf('async function searchEntities'),
      source.indexOf('const ENTITY_LABELS'),
    );
    const effectBlock = source.slice(
      source.indexOf('useEffect(() => {'),
      source.indexOf('const submitChange'),
    );

    expect(source).toContain('const OWNER_SEARCH_ERROR =');
    expect(searchBlock).toContain('throw new Error(payload?.error || payload?.message || OWNER_SEARCH_ERROR);');
    expect(searchBlock).not.toContain('if (!res.ok) return [];');
    expect(effectBlock).toContain('setSearchError(message);');
    expect(effectBlock).toContain('toast.error(message);');
    expect(source).toContain('searchError ? (');
    expect(source).toContain('role="alert"');
  });
});
