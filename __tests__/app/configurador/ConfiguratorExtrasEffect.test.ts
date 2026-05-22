import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('configurator extras effect dependencies', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', '[locale]', 'configurador', 'client.tsx'),
    'utf8',
  );

  it('filters unavailable extras without suppressing exhaustive deps', () => {
    expect(source).toContain('filterUnavailableExtras(config.extras, availableExtras)');
    expect(source).toContain("setConfig((prev) => ({ ...prev, extras: filteredExtras }))");
    expect(source).toContain('}, [availableExtras, config.eventType, config.extras]);');
    expect(source).not.toContain('eslint-disable-next-line react-hooks/exhaustive-deps');
  });
});
