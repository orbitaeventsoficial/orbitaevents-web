import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'app/admin/components/StatusQuickSelect.tsx'), 'utf8');

describe('StatusQuickSelect error handling', () => {
  it('shows the backend error instead of only logging a failed status update', () => {
    expect(source).toContain('async function readStatusUpdateError');
    expect(source).toContain('payload.error || payload.message');
    expect(source).toContain('const [error, setError] = useState');
    expect(source).toContain('throw new Error(await readStatusUpdateError(res));');
    expect(source).toContain('role="alert"');
    expect(source).toContain('{error}');
    expect(source).not.toContain('throw new Error();');
  });
});
