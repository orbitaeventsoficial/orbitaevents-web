import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'app/admin/email-templates/EmailTemplatesClient.tsx'), 'utf8');

describe('EmailTemplatesClient error handling', () => {
  it('keeps a failed template load separate from an empty catalog', () => {
    expect(source).toContain('async function readEmailTemplatesResponse');
    expect(source).toContain('const [loadError, setLoadError] = useState');
    expect(source).toContain('data.error || data.message');
    expect(source).toContain('role="alert"');
    expect(source).toContain('Reintentar');
    expect(source).not.toContain("throw new Error('Error')");
  });
});
